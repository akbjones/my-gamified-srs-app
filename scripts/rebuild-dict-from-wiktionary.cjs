#!/usr/bin/env node
/**
 * Rebuild dictionary entries from kaikki.org (Wiktionary structured data).
 *
 * Usage:
 *   node scripts/rebuild-dict-from-wiktionary.cjs <lang-code>
 *   node scripts/rebuild-dict-from-wiktionary.cjs all
 *
 * Downloads the JSONL dump for each language from kaikki.org, extracts
 * word → {en, ipa, pos} for every word appearing in the deck, and writes
 * a clean dictionary data file that can be spliced into the .ts files.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');

const LANG_MAP = {
  es: { name: 'Spanish',    deckDir: 'spanish',    wiktName: 'Spanish' },
  it: { name: 'Italian',    deckDir: 'italian',    wiktName: 'Italian' },
  fr: { name: 'French',     deckDir: 'french',     wiktName: 'French' },
  pt: { name: 'Portuguese', deckDir: 'portuguese',  wiktName: 'Portuguese' },
  de: { name: 'German',     deckDir: 'german',     wiktName: 'German' },
  nl: { name: 'Dutch',      deckDir: 'dutch',      wiktName: 'Dutch' },
  sv: { name: 'Swedish',    deckDir: 'swedish',    wiktName: 'Swedish' },
  cy: { name: 'Welsh',      deckDir: 'welsh',      wiktName: 'Welsh' },
  hi: { name: 'Hindi',      deckDir: 'hindi',      wiktName: 'Hindi' },
  tr: { name: 'Turkish',    deckDir: 'turkish',    wiktName: 'Turkish' },
  ru: { name: 'Russian',    deckDir: 'russian',    wiktName: 'Russian' },
};

// POS mapping from Wiktionary to short codes
const POS_MAP = {
  noun: 'n', verb: 'v', adj: 'adj', adv: 'adv',
  prep: 'prep', conj: 'conj', det: 'det', pron: 'pron',
  intj: 'intj', num: 'num', particle: 'part', postp: 'postp',
  prefix: 'prefix', suffix: 'suffix', name: 'n', phrase: 'phrase',
  proverb: 'phrase', affix: 'affix',
};

/**
 * Extract all unique words from a deck's sentences.
 */
function extractDeckWords(langCode) {
  const info = LANG_MAP[langCode];
  const deckPath = path.join(ROOT, 'src', 'data', info.deckDir, 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  const words = new Set();
  const wordContext = new Map(); // word -> Set of English words from cards containing it
  for (const card of deck) {
    const tokens = card.target
      .replace(/[.,!?;:"""\u2018\u2019()––«»\u0964\u0965/\[\]{}]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);
    const englishWords = new Set(
      (card.english || '').toLowerCase().split(/\s+/).filter(w => w.length > 2)
    );
    for (const t of tokens) {
      words.add(t);
      if (!wordContext.has(t)) wordContext.set(t, new Set());
      for (const ew of englishWords) wordContext.get(t).add(ew);
    }
  }
  return { words, wordContext };
}

/**
 * Score how well a gloss matches the English context of a word.
 * Returns 0-100.
 */
function scoreGloss(gloss, contextWords) {
  if (!contextWords || contextWords.size === 0) return 50;
  const glossWords = gloss.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let matches = 0;
  for (const gw of glossWords) {
    for (const cw of contextWords) {
      if (gw === cw || cw.startsWith(gw) || gw.startsWith(cw)) {
        matches++;
        break;
      }
    }
  }
  return glossWords.length > 0 ? (matches / glossWords.length) * 100 : 50;
}

/**
 * Download a URL, following redirects, returning a readable stream.
 */
function downloadStream(url) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, { headers: { 'User-Agent': 'srs-dict-rebuild/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadStream(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      resolve(res);
    }).on('error', reject);
  });
}

/**
 * Process a kaikki.org JSONL stream and extract dictionary entries for needed words.
 */
async function processKaikkiStream(langCode, neededWords, wordContext) {
  const info = LANG_MAP[langCode];
  const url = `https://kaikki.org/dictionary/${info.wiktName}/kaikki.org-dictionary-${info.wiktName}.jsonl.gz`;

  console.log(`Downloading ${info.name} dictionary from kaikki.org...`);
  console.log(`  URL: ${url}`);
  console.log(`  Need ${neededWords.size} words`);

  // Collect ALL candidate senses per word, then pick the best using context
  const candidates = new Map(); // word -> [{en, ipa, pos, baseWord}]
  const formsToBase = new Map(); // inflected form -> base word (from forms[] field)
  const baseWordIpa = new Map(); // base word -> best IPA (for lemma entries)

  try {
    const stream = await downloadStream(url);
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({
      input: stream.pipe(gunzip),
      crlfDelay: Infinity,
    });

    let lineCount = 0;

    for await (const line of rl) {
      lineCount++;
      if (lineCount % 50000 === 0) {
        process.stdout.write(`  Processed ${lineCount} entries...\r`);
      }

      try {
        const obj = JSON.parse(line);
        const word = (obj.word || '').toLowerCase();

        const isNeeded = neededWords.has(word);
        const isShort = word.length <= 15;
        if (!isNeeded && !isShort) continue;

        // Extract base word from form_of or gloss references
        let baseWord = null;

        // Collect all non-technical glosses from this entry
        const glosses = [];
        if (obj.senses) {
          for (const sense of obj.senses) {
            if (sense.form_of && sense.form_of.length > 0 && !baseWord) {
              baseWord = (sense.form_of[0].word || '').toLowerCase();
            }
            if (sense.glosses && sense.glosses.length > 0) {
              for (const gloss of sense.glosses) {
                if (!gloss) continue;
                const inflMatch = gloss.match(/^(?:inflection|form) of\s+(\S+?)[:,]?\s*$/i);
                const altMatch = gloss.match(/^Alternative (?:form|spelling) of\s+(\S+?)[:,]?\s*$/i);
                if (inflMatch || altMatch) {
                  baseWord = (inflMatch || altMatch)[1].toLowerCase();
                  continue;
                }
                // Skip technical grammar descriptions
                if (/^(first|second|third)[/-](first|second|third)?[- ]?person\b/i.test(gloss)) continue;
                if (/^(first|second|third)-person\b/i.test(gloss)) continue;
                if (/^(nominative|genitive|dative|accusative|ablative|locative|instrumental|vocative|partitive)\b/i.test(gloss)) continue;
                if (/^(definite|indefinite)\s+(accusative|nominative|genitive|dative|singular|plural|form)/i.test(gloss)) continue;
                if (/^(singular|plural)\s+(present|past|definite|indefinite|imperative|subjunctive|indicative|conditional)/i.test(gloss)) continue;
                if (/^(present|past|future)\s+(tense|participle|indicative|subjunctive)/i.test(gloss)) continue;
                if (/^(masculine|feminine|neuter)\s+(singular|plural|nominative|form)/i.test(gloss)) continue;
                if (/^(imperfect|preterite|conditional|imperative|subjunctive|indicative)\b/i.test(gloss)) continue;
                if (/^(past participle|present participle|gerund)\b/i.test(gloss)) continue;
                if (/^inflection of\b/i.test(gloss)) continue;
                if (/^(simple past|past historic|past tense|present tense)\b/i.test(gloss)) continue;
                if (/^verbal noun of\b/i.test(gloss)) { baseWord = gloss.match(/of\s+(\S+)/i)?.[1]?.toLowerCase(); continue; }
                if (/^agent noun of\b/i.test(gloss)) { baseWord = gloss.match(/of\s+(\S+)/i)?.[1]?.toLowerCase(); continue; }
                if (/^diminutive of\b/i.test(gloss)) continue;
                if (/^superlative of\b/i.test(gloss)) continue;
                if (/^comparative of\b/i.test(gloss)) continue;
                if (/^plural of\b/i.test(gloss)) { baseWord = gloss.match(/of\s+(\S+)/i)?.[1]?.toLowerCase(); continue; }
                if (/^feminine of\b/i.test(gloss)) { baseWord = gloss.match(/of\s+(\S+)/i)?.[1]?.toLowerCase(); continue; }
                if (/^masculine of\b/i.test(gloss)) { baseWord = gloss.match(/of\s+(\S+)/i)?.[1]?.toLowerCase(); continue; }
                glosses.push(gloss);
              }
            }
          }
        }

        // Extract IPA
        let ipa = '?';
        if (obj.sounds) {
          for (const s of obj.sounds) {
            if (s.ipa) { ipa = s.ipa.replace(/^\/|\/$/g, ''); break; }
          }
        }

        const rawPos = (obj.pos || '').toLowerCase();
        const pos = POS_MAP[rawPos] || rawPos || '?';

        // Store each valid gloss as a candidate
        for (const gloss of glosses) {
          let en = gloss
            .replace(/\s*\([^)]*\)\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (en.includes(';')) en = en.split(/;\s*/)[0].trim();
          const parts = en.split(/,\s*/);
          if (parts.length >= 3) en = parts.slice(0, 2).join(', ');
          if (parts.length >= 2 && parts[0].startsWith('to ') && parts[1].startsWith('to ')) en = parts[0];
          // Ensure verbs start with "to "
          if (pos === 'v' && en && !en.startsWith('to ') && /^[a-z]/.test(en)) {
            en = 'to ' + en;
          }
          if (en.length > 50) en = en.substring(0, 47) + '...';
          if (!en || en.length < 1) continue;

          if (!candidates.has(word)) candidates.set(word, []);
          candidates.get(word).push({ en, ipa, pos, baseWord });
        }

        // Track IPA for base words (needed when generating lemma references)
        if (glosses.length > 0 && ipa !== '?') {
          if (!baseWordIpa.has(word) || baseWordIpa.get(word) === '?') {
            baseWordIpa.set(word, ipa);
          }
        }

        // If no non-technical glosses, store with baseWord for later resolution
        if (glosses.length === 0 && baseWord) {
          if (!candidates.has(word)) candidates.set(word, []);
          candidates.get(word).push({ en: null, ipa, pos, baseWord });
        }

        // Extract inflected forms from forms[] field
        if (obj.forms && glosses.length > 0) {
          for (const f of obj.forms) {
            const form = (f.form || '').toLowerCase().replace(/\u0301/g, '').trim();
            if (form && form !== word && neededWords.has(form)) {
              if (!formsToBase.has(form)) formsToBase.set(form, []);
              formsToBase.get(form).push(word);
            }
          }
        }

      } catch (e) { /* skip malformed */ }
    }

    console.log(`  Done: processed ${lineCount} Wiktionary entries`);

    // Now pick the best candidate for each word using context scoring
    const entries = new Map();
    let directMatches = 0;

    for (const [word, cands] of candidates) {
      const ctx = wordContext ? wordContext.get(word) : null;
      let bestEn = null, bestIpa = '?', bestPos = '?', bestScore = -1, bestBase = null;

      for (const c of cands) {
        if (!c.en) { bestBase = c.baseWord; continue; }
        const score = scoreGloss(c.en, ctx);
        if (score > bestScore || (score === bestScore && c.ipa !== '?')) {
          bestScore = score;
          bestEn = c.en;
          bestIpa = c.ipa;
          bestPos = c.pos;
        }
        if (!bestBase && c.baseWord) bestBase = c.baseWord;
      }

      if (bestEn) {
        // If this word has a base word, it's an inflected form – set lemma
        const entry = { en: bestEn, ipa: bestIpa, pos: bestPos };
        if (bestBase && bestBase !== word) entry.lemma = bestBase;
        entries.set(word, entry);
        if (neededWords.has(word)) directMatches++;
      } else if (bestBase) {
        // Will resolve via base word later
        entries.set(word, { en: null, ipa: bestIpa, pos: bestPos, _base: bestBase });
      }
    }

    // Resolve entries that only had technical glosses (form-of)
    // Use context scoring to pick the best base word translation
    let formResolved = 0;
    for (const [word, entry] of entries) {
      if (entry.en) continue;
      const base = entry._base;
      if (base && candidates.has(base)) {
        // Pick the best translation from the base word's candidates using THIS word's context
        const ctx = wordContext ? wordContext.get(word) : null;
        const baseCands = candidates.get(base);
        let bestEn = null, bestScore = -1;
        for (const c of baseCands) {
          if (!c.en) continue;
          const score = scoreGloss(c.en, ctx);
          if (score > bestScore) { bestScore = score; bestEn = c.en; }
        }
        if (bestEn) {
          entry.en = bestEn;
          entry.lemma = base; // Set lemma to base word
          formResolved++;
        } else if (entries.has(base) && entries.get(base).en) {
          entry.en = entries.get(base).en;
          entry.lemma = base;
          formResolved++;
        }
      }
    }

    // Resolve inflected forms from forms[] field
    let formsResolved = 0;
    for (const [form, baseWords] of formsToBase) {
      if (entries.has(form) && entries.get(form).en) continue;
      const ctx = wordContext ? wordContext.get(form) : null;
      let bestEn = null, bestIpa = '?', bestPos = '?', bestScore = -1, bestBase = null;
      for (const bw of baseWords) {
        if (candidates.has(bw)) {
          for (const c of candidates.get(bw)) {
            if (!c.en) continue;
            const score = scoreGloss(c.en, ctx);
            if (score > bestScore) {
              bestScore = score;
              bestEn = c.en;
              bestIpa = c.ipa || '?';
              bestPos = c.pos || '?';
              bestBase = bw;
            }
          }
        }
      }
      if (bestEn) {
        const entry = { en: bestEn, ipa: bestIpa, pos: bestPos };
        if (bestBase && bestBase !== form) entry.lemma = bestBase;
        entries.set(form, entry);
        formsResolved++;
      }
    }

    // Clean up entries with null translations and internal fields
    for (const [word, entry] of entries) {
      if (!entry.en) { entries.delete(word); continue; }
      delete entry._base;
      // Validate lemma references – only keep if lemma is different from the word itself
      if (entry.lemma === word) delete entry.lemma;
      // Ensure all verbs have "to " prefix
      if (entry.pos === 'v' && entry.en && !entry.en.startsWith('to ') && /^[a-z]/.test(entry.en)) {
        entry.en = 'to ' + entry.en;
      }
      // Fix form-of entries with '?' pos – inherit from base if possible
      if (entry.pos === '?' && entry.lemma && entries.has(entry.lemma)) {
        const baseEntry = entries.get(entry.lemma);
        if (baseEntry.pos && baseEntry.pos !== '?') entry.pos = baseEntry.pos;
      }
    }

    console.log(`  Direct matches: ${directMatches} | Form-of resolved: ${formResolved} | Forms[] resolved: ${formsResolved}`);
    return entries;

  } catch (err) {
    console.error(`  Error downloading ${info.name}: ${err.message}`);
    return new Map();
  }
}

/**
 * Read existing dictionary .ts file and extract:
 * 1. The header (everything before the dictionary object)
 * 2. The existing entries (to merge/fallback)
 * 3. The footer (export, etc.)
 */
function parseExistingDict(langCode) {
  const dictPath = path.join(ROOT, 'src', 'data', 'dictionary', `${langCode}.ts`);
  const content = fs.readFileSync(dictPath, 'utf8');

  // Find the dictionary object start - look for various patterns
  // Some files use: const dictionary: Record<string, DictEntry> = {
  // Some use: const dictionary = {
  // Some use: export const dictionary: { [key: string]: DictEntry } = {
  const dictStartPatterns = [
    /^(const dictionary[^=]*=\s*\{)/m,
    /^(export const dictionary[^=]*=\s*\{)/m,
    /^(const DICT[^=]*=\s*\{)/m,
    /^(const dict[^=]*=\s*\{)/m,
    /^(export const dict[^=]*=\s*\{)/m,
  ];

  let dictStartIdx = -1;
  let dictStartMatch = '';
  for (const pat of dictStartPatterns) {
    const m = content.match(pat);
    if (m) {
      dictStartIdx = content.indexOf(m[1]);
      dictStartMatch = m[1];
      break;
    }
  }

  if (dictStartIdx === -1) {
    console.error(`  Could not find dictionary object in ${langCode}.ts`);
    return null;
  }

  const header = content.substring(0, dictStartIdx);

  // Find the matching closing brace by counting braces
  let braceDepth = 0;
  let dictEndIdx = -1;
  let inString = false;
  let strChar = '';
  for (let i = dictStartIdx; i < content.length; i++) {
    const ch = content[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; strChar = ch; continue; }
    if (ch === '{') braceDepth++;
    if (ch === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        dictEndIdx = i;
        break;
      }
    }
  }

  // Check for semicolon after closing brace
  let footerStart = dictEndIdx + 1;
  if (content[footerStart] === ';') footerStart++;

  const footer = content.substring(footerStart);

  // Parse existing entries using regex (imperfect but good enough for fallback)
  const existing = new Map();
  const entryRe = /['"]?([^'":\s]+)['"]?\s*:\s*\{\s*en:\s*'([^']*)'\s*,\s*ipa:\s*'([^']*)'\s*(?:,\s*pos:\s*'([^']*)')?\s*(?:,\s*lemma:\s*'([^']*)')?\s*\}/g;
  let match;
  const dictSection = content.substring(dictStartIdx, dictEndIdx + 1);
  while ((match = entryRe.exec(dictSection)) !== null) {
    existing.set(match[1], {
      en: match[2],
      ipa: match[3],
      pos: match[4] || '?',
    });
  }

  return { header, footer, existing, dictStartMatch };
}

/**
 * Generate the dictionary entries as a TypeScript string.
 */
function generateDictEntries(merged, langCode) {
  const sorted = [...merged.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  let lines = [];
  for (const [word, entry] of sorted) {
    const safeEn = entry.en.replace(/'/g, "\\'");
    const safeIpa = entry.ipa.replace(/'/g, "\\'");
    const safePos = (entry.pos || '?').replace(/'/g, "\\'");

    // Always quote keys to be safe – avoids issues with special chars, hyphens, accents, etc.
    const key = `'${word.replace(/'/g, "\\'")}'`;

    let line = `  ${key}: { en: '${safeEn}', ipa: '${safeIpa}', pos: '${safePos}'`;
    if (entry.lemma) {
      const safeLemma = entry.lemma.replace(/'/g, "\\'");
      line += `, lemma: '${safeLemma}'`;
    }
    line += ' },';
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Rebuild dictionary for a single language.
 */
async function rebuildLang(langCode) {
  console.log(`\n=== Rebuilding ${LANG_MAP[langCode].name} (${langCode}) ===`);

  // 1. Extract deck words with English context
  const { words: deckWords, wordContext } = extractDeckWords(langCode);
  console.log(`  Deck has ${deckWords.size} unique words`);

  // 2. Parse existing dictionary (for header/footer structure only)
  const existing = parseExistingDict(langCode);
  if (!existing) return;
  console.log(`  Existing dictionary has ${existing.existing.size} entries`);

  // 3. Download and process kaikki.org data
  const wiktEntries = await processKaikkiStream(langCode, deckWords, wordContext);

  // 4. Merge: Wiktionary only – NO fallback to old LLM-generated entries (they are unreliable)
  const merged = new Map();
  let wiktUsed = 0, missing = 0;

  for (const word of deckWords) {
    if (wiktEntries.has(word)) {
      const we = wiktEntries.get(word);
      // Borrow IPA from old dict if Wiktionary has none
      if (we.ipa === '?' && existing.existing.has(word)) {
        const oldIpa = existing.existing.get(word).ipa;
        if (oldIpa && oldIpa !== '?') we.ipa = oldIpa;
      }
      merged.set(word, we);
      wiktUsed++;
    } else {
      missing++;
    }
  }

  // Don't include extra base words – keep dictionary lean and deck-focused

  console.log(`  Wiktionary: ${wiktUsed} | Missing: ${missing}`);
  console.log(`  Total merged entries: ${merged.size}`);

  // 5. Generate output
  const entries = generateDictEntries(merged, langCode);
  const newContent = existing.header +
    existing.dictStartMatch + '\n' +
    entries + '\n' +
    '};\n' +
    existing.footer;

  // 6. Write back
  const dictPath = path.join(ROOT, 'src', 'data', 'dictionary', `${langCode}.ts`);
  fs.writeFileSync(dictPath, newContent, 'utf8');
  console.log(`  Written to ${dictPath}`);

  // 7. Report missing words
  if (missing > 0) {
    const missingWords = [...deckWords].filter(w => !merged.has(w));
    console.log(`  Missing words (${missing}): ${missingWords.slice(0, 20).join(', ')}${missing > 20 ? '...' : ''}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/rebuild-dict-from-wiktionary.cjs <lang-code|all>');
    console.log('Languages:', Object.keys(LANG_MAP).join(', '));
    process.exit(1);
  }

  const langs = args[0] === 'all' ? Object.keys(LANG_MAP) : [args[0]];

  for (const lang of langs) {
    if (!LANG_MAP[lang]) {
      console.error(`Unknown language: ${lang}`);
      continue;
    }
    await rebuildLang(lang);
  }
}

main().catch(console.error);
