#!/usr/bin/env node
/**
 * Rebuild ALL 11 language dictionaries from Wiktionary JSONL data.
 *
 * CRITICAL DIFFERENCE from rebuild-dict-from-wiktionary.cjs:
 *   - NO card-context scoring (scoreGloss) — this was the source of context bleed
 *   - Takes the FIRST primary/non-grammatical sense from Wiktionary
 *   - Form-of entries resolve to the base word's primary definition
 *
 * Usage:
 *   node scripts/rebuild-dict-wiktionary-clean.cjs <lang-code>
 *   node scripts/rebuild-dict-wiktionary-clean.cjs all
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');

const LANG_MAP = {
  es: { name: 'Spanish',    wiktName: 'Spanish' },
  it: { name: 'Italian',    wiktName: 'Italian' },
  fr: { name: 'French',     wiktName: 'French' },
  pt: { name: 'Portuguese', wiktName: 'Portuguese' },
  de: { name: 'German',     wiktName: 'German' },
  nl: { name: 'Dutch',      wiktName: 'Dutch' },
  sv: { name: 'Swedish',    wiktName: 'Swedish' },
  cy: { name: 'Welsh',      wiktName: 'Welsh' },
  hi: { name: 'Hindi',      wiktName: 'Hindi' },
  tr: { name: 'Turkish',    wiktName: 'Turkish' },
  ru: { name: 'Russian',    wiktName: 'Russian' },
};

// POS mapping from Wiktionary to short codes
const POS_MAP = {
  noun: 'n', verb: 'v', adj: 'adj', adv: 'adv',
  prep: 'prep', conj: 'conj', det: 'det', pron: 'pron',
  intj: 'intj', num: 'num', particle: 'part', postp: 'postp',
  prefix: 'prefix', suffix: 'suffix', name: 'n', phrase: 'phrase',
  proverb: 'phrase', affix: 'affix',
};

// Patterns that indicate a grammatical/form-of gloss (not a real definition)
const FORM_OF_PATTERNS = [
  /^(?:inflection|form|mutation|lenition|soft mutation|nasal mutation|aspirate mutation) of\b/i,
  /^alternative (?:form|spelling) of\b/i,
  /^(?:first|second|third)[/-](?:first|second|third)?[- ]?person\b/i,
  /^(?:nominative|genitive|dative|accusative|ablative|locative|instrumental|vocative|partitive)\b/i,
  /^(?:definite|indefinite)\s+(?:accusative|nominative|genitive|dative|singular|plural|neuter|masculine|feminine|common|form)/i,
  /^(?:singular|plural)\s+(?:present|past|definite|indefinite|imperative|subjunctive|indicative|conditional)/i,
  /^(?:present|past|future)\s+(?:tense|participle|indicative|subjunctive)/i,
  /^(?:masculine|feminine|neuter)\s+(?:singular|plural|nominative|form)/i,
  /^(?:imperfect|preterite|conditional|imperative|subjunctive|indicative)\b/i,
  /^(?:past participle|present participle|gerund)\b/i,
  /^inflection of\b/i,
  /^(?:simple past|past historic|past tense|present tense)\b/i,
  /^verbal noun of\b/i,
  /^agent noun of\b/i,
  /^diminutive of\b/i,
  /^superlative of\b/i,
  /^comparative of\b/i,
  /^augmentative of\b/i,
  /^plural of\b/i,
  /^feminine of\b/i,
  /^masculine of\b/i,
  /^(?:singular|plural) of\b/i,
  /^(?:abstract noun|action noun) (?:of|from)\b/i,
  /^(?:romanization|transliteration) of\b/i,
  /^obsolete (?:form|spelling) of\b/i,
  /^archaic (?:form|spelling) of\b/i,
  /^(?:eye|ear) dialect (?:form|spelling) of\b/i,
  /^clipping of\b/i,
  /^abbreviation of\b/i,
  /^(?:definite|indefinite) (?:form|accusative|nominative) of\b/i,
  /^(?:supine|passive|causative) (?:of|form)\b/i,
  /^(?:construct state|absolute state) of\b/i,
  // German adjective declension descriptions
  /^(?:strong|weak|mixed)[/\s](?:strong|weak|mixed)?\s*(?:nominative|genitive|dative|accusative)/i,
  /^(?:strong|weak|mixed)\s+(?:nominative|genitive|dative|accusative)/i,
  // Generic "X of Y" for form-of that slipped through
  /^(?:elative|superlative|comparative|positive)\s+(?:degree\s+)?of\b/i,
  // "to for there to be" type verbose Wiktionary definitions for form-of verbs
  /^(?:second|third|first)[- ]person\b/i,
  // Swedish/Dutch form-of patterns: "passive infinitive of X", "dependent-clause past indicative"
  /^(?:passive|active)\s+(?:infinitive|participle|supine|form)\s+of\b/i,
  /^singular\s+(?:dependent-clause|independent-clause)\b/i,
  /^plural\s+(?:dependent-clause|independent-clause)\b/i,
  /^(?:dependent-clause|independent-clause)\b/i,
  // "infinitive of X"
  /^infinitive of\b/i,
  // Spanish combined forms: "infinitive of X combined with Y"
  /^(?:infinitive|gerund|imperative)\s+of\s+\w+\s+combined\b/i,
  // Dutch/generic: "masculine/feminine singular attributive", "plural attributive" etc.
  /^(?:masculine|feminine|neuter|common)[/\s](?:masculine|feminine|neuter|common)?\s*(?:singular|plural)\s+(?:attributive|predicative)\b/i,
  /^(?:singular|plural)\s+(?:attributive|predicative)\b/i,
  // "present passive of X", "present active of X"
  /^(?:present|past|perfect)\s+(?:passive|active|participle)\s+of\b/i,
  // "direct masculine singular perfective participle"
  /^direct\s+(?:masculine|feminine|neuter|oblique)\b/i,
  // "direct plural of X"
  /^direct\s+(?:singular|plural)\s+of\b/i,
];

// Patterns to extract the base word from form-of glosses
const BASE_WORD_PATTERNS = [
  /(?:inflection|form|mutation) of\s+(.+?)(?:[,;:]|\s*$)/i,
  /alternative (?:form|spelling) of\s+(.+?)(?:[,;:]|\s*$)/i,
  /verbal noun of\s+(.+?)(?:[,;:]|\s*$)/i,
  /agent noun of\s+(.+?)(?:[,;:]|\s*$)/i,
  /plural of\s+(.+?)(?:[,;:]|\s*$)/i,
  /feminine of\s+(.+?)(?:[,;:]|\s*$)/i,
  /masculine of\s+(.+?)(?:[,;:]|\s*$)/i,
  /diminutive of\s+(.+?)(?:[,;:]|\s*$)/i,
  /superlative of\s+(.+?)(?:[,;:]|\s*$)/i,
  /comparative of\s+(.+?)(?:[,;:]|\s*$)/i,
  /(?:singular|plural) of\s+(.+?)(?:[,;:]|\s*$)/i,
  /(?:abstract noun|action noun) (?:of|from)\s+(.+?)(?:[,;:]|\s*$)/i,
  /clipping of\s+(.+?)(?:[,;:]|\s*$)/i,
  /abbreviation of\s+(.+?)(?:[,;:]|\s*$)/i,
  /(?:definite|indefinite)\s+(?:\w+\s+)*?of\s+(.+?)(?:[,;:]|\s*$)/i,
  /(?:supine|passive|causative) (?:of|form)\s+(.+?)(?:[,;:]|\s*$)/i,
  // German adjective declension: "strong/mixed nominative ... of X"
  /(?:strong|weak|mixed)[/\s].*?\bof\s+(.+?)(?:[,;:]|\s*$)/i,
  // Generic "X degree of Y"
  /(?:elative|superlative|comparative|positive)\s+(?:degree\s+)?of\s+(.+?)(?:[,;:]|\s*$)/i,
  // "passive infinitive of X", "infinitive of X"
  /(?:passive|active)\s+(?:infinitive|participle|supine|form)\s+of\s+(.+?)(?:[,;:]|\s*$)/i,
  /infinitive of\s+(.+?)(?:[,;:]|\s*$)/i,
  // "present passive of X", "past active of X"
  /(?:present|past|perfect)\s+(?:passive|active|participle)\s+of\s+(.+?)(?:[,;:]|\s*$)/i,
  // "direct plural of X", "direct singular of X"
  /direct\s+(?:singular|plural)\s+of\s+(.+?)(?:[,;:]|\s*$)/i,
];

/**
 * Check if a gloss is a grammatical/form-of description (not a real definition).
 */
function isFormOfGloss(gloss) {
  return FORM_OF_PATTERNS.some(p => p.test(gloss));
}

/**
 * Try to extract the base word from a form-of gloss.
 */
function extractBaseWord(gloss) {
  for (const pat of BASE_WORD_PATTERNS) {
    const m = gloss.match(pat);
    if (m) return m[1].trim().toLowerCase();
  }
  return null;
}

/**
 * Clean raw Wiktionary gloss text: strip HTML, wiki markup, bracket annotations, grammar notes.
 */
function cleanGloss(raw) {
  let s = raw;
  // Strip HTML tags
  s = s.replace(/<[^>]+>/g, '');
  // Strip wiki markup: [[word|display]] → display, [[word]] → word
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1');
  // Strip {{...}} templates
  s = s.replace(/\{\{[^}]*\}\}/g, '');
  // Strip square-bracket annotations like [with dative], [formal], [+ accusative]
  s = s.replace(/\s*\[[^\]]*\]\s*/g, ' ');
  // Strip parenthetical grammar notes: (archaic), (dated), (colloquial), (transitive), etc.
  s = s.replace(/\s*\((?:archaic|dated|colloquial|informal|formal|literary|poetic|rare|obsolete|dialectal|regional|vulgar|slang|figurative|literally|by extension|by metonymy|transitive|intransitive|reflexive|impersonal|uncountable|countable|pejorative|derogatory|euphemistic|humorous|ironic|diminutive|augmentative|familiar|elevated|biblical|historical|neologism|nonstandard|proscribed|offensive|ethnic slur|\+ ?\w+)[^)]*\)\s*/gi, ' ');
  // Strip remaining parentheticals that are purely grammatical labels
  s = s.replace(/\s*\([^)]*\)\s*/g, ' ');
  // Fix stray closing parens with no matching open
  s = s.replace(/^\s*\)\s*/, '');
  s = s.replace(/\s*\)\s*$/, '');
  // Strip trailing POS labels that leak from Wiktionary structure
  s = s.replace(/\s+(?:pronoun|noun|verb|adjective|adverb|preposition|conjunction|determiner|interjection|numeral|particle|postposition|prefix|suffix|phrase|proverb|letter)\s*$/i, '');
  // Strip leading POS labels too
  s = s.replace(/^(?:pronoun|noun|verb|adjective|adverb|preposition|conjunction|determiner|interjection|numeral|particle|postposition|prefix|suffix|phrase|proverb|letter)\s+/i, '');
  // Fix double spaces, leading/trailing
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Format a gloss into a concise English definition (max 60 chars, "to X" for verbs).
 */
function formatGloss(gloss, pos) {
  let en = cleanGloss(gloss);

  // Take first sense if separated by semicolons
  if (en.includes(';')) en = en.split(/;\s*/)[0].trim();

  // Limit to 2 comma-separated parts
  const parts = en.split(/,\s*/);
  if (parts.length >= 3) en = parts.slice(0, 2).join(', ');

  // Deduplicate "to X, to Y" → just "to X" for verbs
  if (parts.length >= 2 && parts[0].startsWith('to ') && parts[1].startsWith('to ')) {
    en = parts[0];
  }

  // Ensure verbs start with "to "
  if (pos === 'v' && en && !en.startsWith('to ') && /^[a-z]/.test(en)) {
    en = 'to ' + en;
  }

  // Strip leading "to for " artifacts from verbose Wiktionary defs
  en = en.replace(/^to for\b/, 'to');

  // Clean up trailing/leading whitespace again after all transforms
  en = en.trim();

  // Truncate to 60 chars
  if (en.length > 60) en = en.substring(0, 57) + '...';

  return en;
}

/**
 * Download a URL, following redirects, returning a readable stream.
 */
function downloadStream(url) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, { headers: { 'User-Agent': 'srs-dict-rebuild/2.0' } }, (res) => {
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
 * Process the Wiktionary JSONL stream and build a clean dictionary.
 * NO context scoring — just take the first primary gloss.
 */
async function processKaikkiStream(langCode) {
  const info = LANG_MAP[langCode];
  const url = `https://kaikki.org/dictionary/${info.wiktName}/kaikki.org-dictionary-${info.wiktName}.jsonl.gz`;

  console.log(`  Downloading ${info.name} from kaikki.org...`);
  console.log(`  URL: ${url}`);

  // Two maps: definitions for real entries, and form-of references
  const definitions = new Map();  // word → { en, ipa, pos }
  const formRefs = new Map();     // word → { baseWord, ipa, pos }

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
      if (lineCount % 100000 === 0) {
        process.stdout.write(`  Processed ${lineCount} entries...\r`);
      }

      try {
        const obj = JSON.parse(line);
        const word = (obj.word || '').toLowerCase().trim();
        if (!word) continue;

        const rawPos = (obj.pos || '').toLowerCase();
        const pos = POS_MAP[rawPos] || rawPos || '?';

        // Extract IPA
        let ipa = '?';
        if (obj.sounds) {
          for (const s of obj.sounds) {
            if (s.ipa) {
              ipa = s.ipa.replace(/^\/|\/$/g, '').replace(/^\[|\]$/g, '');
              break;
            }
          }
        }

        if (!obj.senses || obj.senses.length === 0) continue;

        // Find the FIRST non-grammatical English gloss
        let firstGloss = null;
        let baseWord = null;

        for (const sense of obj.senses) {
          // Check form_of field first
          if (sense.form_of && sense.form_of.length > 0 && !baseWord) {
            baseWord = (sense.form_of[0].word || '').toLowerCase().trim();
          }

          if (!sense.glosses || sense.glosses.length === 0) continue;

          for (const gloss of sense.glosses) {
            if (!gloss || gloss.length < 2) continue;

            // Clean the gloss first so form-of patterns match reliably
            const cleaned = cleanGloss(gloss);

            // Try to extract base word from form-of glosses
            if (isFormOfGloss(cleaned)) {
              if (!baseWord) {
                const extracted = extractBaseWord(cleaned);
                if (extracted) baseWord = extracted;
              }
              continue;
            }

            // This is a real definition — take it
            if (!firstGloss) {
              firstGloss = cleaned;
            }
            break; // We only want the FIRST non-grammatical gloss
          }

          if (firstGloss) break; // Stop after first real gloss
        }

        if (firstGloss) {
          const en = formatGloss(firstGloss, pos);
          if (en && en.length >= 1) {
            // Only store if we don't already have a definition for this word,
            // OR if this is a "better" POS (prefer noun/verb/adj over other)
            if (!definitions.has(word)) {
              definitions.set(word, { en, ipa, pos });
            }
          }
        } else if (baseWord) {
          // This is purely a form-of entry — store for later resolution
          if (!formRefs.has(word)) {
            formRefs.set(word, { baseWord, ipa, pos });
          }
        }

      } catch (e) { /* skip malformed lines */ }
    }

    console.log(`  Done: processed ${lineCount} Wiktionary entries`);
    console.log(`  Direct definitions: ${definitions.size} | Form-of refs: ${formRefs.size}`);

    // Resolve form-of entries: look up the base word's definition
    // Also inherit POS from base word when the form's POS is wrong/generic
    let resolved = 0;
    for (const [word, ref] of formRefs) {
      if (definitions.has(word)) continue; // Already has a direct definition
      if (definitions.has(ref.baseWord)) {
        const baseDef = definitions.get(ref.baseWord);
        // Inherit POS from base word — form-of entries often get wrong POS
        // (e.g., conjugated verb forms tagged as 'n')
        const resolvedPos = (baseDef.pos && baseDef.pos !== '?') ? baseDef.pos : (ref.pos !== '?' ? ref.pos : baseDef.pos);
        definitions.set(word, {
          en: baseDef.en,
          ipa: ref.ipa !== '?' ? ref.ipa : baseDef.ipa,
          pos: resolvedPos,
          lemma: ref.baseWord,
        });
        resolved++;
      }
    }
    console.log(`  Form-of resolved: ${resolved}`);

    // Second pass: fix POS for entries that already had definitions but wrong POS
    // If an entry has a lemma pointing to a base word, inherit the base's POS
    let posFixed = 0;
    for (const [word, entry] of definitions) {
      if (entry.lemma && definitions.has(entry.lemma)) {
        const baseDef = definitions.get(entry.lemma);
        if (baseDef.pos && baseDef.pos !== '?' && entry.pos !== baseDef.pos) {
          // Only fix clearly wrong POS (e.g., 'n' for a verb form)
          if (entry.pos === 'n' || entry.pos === '?') {
            entry.pos = baseDef.pos;
            posFixed++;
          }
        }
      }
    }
    if (posFixed > 0) console.log(`  POS fixes from base word: ${posFixed}`);

    return definitions;

  } catch (err) {
    console.error(`  Error downloading ${info.name}: ${err.message}`);
    return new Map();
  }
}

/**
 * Find the LAST (and largest) dictionary object declaration in the file.
 * Some files have duplicate content or empty stubs before the real dictionary.
 * Returns { startIdx, matchStr, endIdx } or null.
 */
function findDictBlock(content) {
  const dictStartPatterns = [
    /const DICT[^=]*=\s*\{/gm,
    /const dict[^=]*=\s*\{/gm,
    /const dictionary[^=]*=\s*\{/gm,
    /export const dictionary[^=]*=\s*\{/gm,
  ];

  // Collect ALL matches across all patterns
  const allMatches = [];
  for (const pat of dictStartPatterns) {
    let m;
    while ((m = pat.exec(content)) !== null) {
      allMatches.push({ idx: m.index, str: m[0] });
    }
  }

  if (allMatches.length === 0) return null;

  // For each match, find its closing `};` by searching for `};` at start of line
  // (or after only whitespace). This is more robust than brace-counting, because
  // dictionary files may have broken string literals with unescaped quotes.
  let best = null;
  for (const match of allMatches) {
    // Find the first `};` that appears at the start of a line after the opening
    const searchFrom = match.idx + match.str.length;
    const closingRe = /^};\s*$/gm;
    closingRe.lastIndex = searchFrom;
    const closeMatch = closingRe.exec(content);
    if (!closeMatch) continue;
    const endIdx = closeMatch.index; // index of the `}`
    const size = endIdx - match.idx;
    if (!best || size > best.size) {
      best = { startIdx: match.idx, matchStr: match.str, endIdx, size };
    }
  }

  return best;
}

/**
 * Parse the existing dictionary .ts file.
 * Returns { header, footer, entries, dictStartMatch }.
 */
function parseExistingDict(langCode) {
  const dictPath = path.join(ROOT, 'src', 'data', 'dictionary', `${langCode}.ts`);
  let content = fs.readFileSync(dictPath, 'utf8');

  // Special handling for Russian: the file may have duplicate content (stub + real).
  // Detect this by checking if "const dictionary" appears more than once with entries.
  if (langCode === 'ru') {
    const dictMatches = [...content.matchAll(/const dictionary[^=]*=\s*\{/gm)];
    if (dictMatches.length > 1) {
      // The first is a stub, the second is real. Find the second import block.
      const secondDictIdx = dictMatches[1].index;
      // Go back from the second dict to find its import block
      const lastImportBefore = content.lastIndexOf('import ', secondDictIdx);
      if (lastImportBefore > 0) {
        // Find the actual start of this import block (may have a DictEntry import before it)
        const lineStart = content.lastIndexOf('\n', lastImportBefore) + 1;
        // Check for a DictEntry import right before
        const prevLineEnd = lineStart - 1;
        const prevLineStart = content.lastIndexOf('\n', prevLineEnd - 1) + 1;
        const prevLine = content.substring(prevLineStart, prevLineEnd);
        const start = prevLine.includes('DictEntry') ? prevLineStart : lineStart;
        content = content.substring(start);
        console.log(`  [ru] Detected duplicate file content, using second copy`);
      }
    }
  }

  const block = findDictBlock(content);
  if (!block) {
    console.error(`  Could not find dictionary object in ${langCode}.ts`);
    return null;
  }

  const header = content.substring(0, block.startIdx);
  const dictStartMatch = block.matchStr;
  const dictEndIdx = block.endIdx;

  let footerStart = dictEndIdx + 1;
  if (content[footerStart] === ';') footerStart++;

  const footer = content.substring(footerStart);

  // Parse existing entries — handle both single-quoted and double-quoted formats
  const existing = new Map();
  const dictSection = content.substring(block.startIdx, dictEndIdx + 1);

  // Multi-format entry regex: handles both ' and " quoting for keys and values
  // Also handles unquoted keys (like pt dictionary)
  const entryPatterns = [
    // Double-quoted keys and values: "word": { en: "...", ipa: "...", pos: "...", lemma: "..." }
    /"([^"]+)":\s*\{\s*en:\s*"([^"]*?)"\s*,\s*ipa:\s*"([^"]*?)"\s*(?:,\s*pos:\s*"([^"]*?)")?\s*(?:,\s*lemma:\s*"([^"]*?)")?\s*\}/g,
    // Single-quoted keys and values: 'word': { en: '...', ipa: '...', pos: '...', lemma: '...' }
    /'([^']+)':\s*\{\s*en:\s*'([^']*?)'\s*,\s*ipa:\s*'([^']*?)'\s*(?:,\s*pos:\s*'([^']*?)')?\s*(?:,\s*lemma:\s*'([^']*?)')?\s*\}/g,
    // Unquoted keys with single-quoted values: word: { en: '...', ipa: '...', pos: '...', lemma: '...' }
    /\b([a-zA-Z\u00C0-\u024F\u0400-\u04FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u309F\u4E00-\u9FFF\u0590-\u05FF\u0621-\u064A\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E80-\u0EFF\-]+):\s*\{\s*en:\s*'([^']*?)'\s*,\s*ipa:\s*'([^']*?)'\s*(?:,\s*pos:\s*'([^']*?)')?\s*(?:,\s*lemma:\s*'([^']*?)')?\s*\}/g,
  ];

  for (const re of entryPatterns) {
    let match;
    while ((match = re.exec(dictSection)) !== null) {
      const key = match[1];
      if (existing.has(key)) continue;
      existing.set(key, {
        en: match[2],
        ipa: match[3],
        pos: match[4] || '?',
        lemma: match[5] || undefined,
      });
    }
  }

  return { header, footer, existing, dictStartMatch, fullContent: content };
}

/**
 * Check if a Wiktionary IPA is "better" than the current one.
 * Better = has stress marks that the current one lacks.
 */
function isBetterIpa(wiktIpa, currentIpa) {
  if (!wiktIpa || wiktIpa === '?') return false;
  if (!currentIpa || currentIpa === '?') return true;
  // Wiktionary IPA is better if it has stress marks and current doesn't
  const wiktHasStress = /[ˈˌ]/.test(wiktIpa);
  const currentHasStress = /[ˈˌ]/.test(currentIpa);
  if (wiktHasStress && !currentHasStress) return true;
  return false;
}

/**
 * Generate dictionary entries as TypeScript string.
 * Uses single quotes consistently.
 */
function generateDictEntries(entries) {
  const sorted = [...entries.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const lines = [];
  for (const [word, entry] of sorted) {
    const safeEn = entry.en.replace(/'/g, "\\'");
    const safeIpa = (entry.ipa || '?').replace(/'/g, "\\'");
    const safePos = (entry.pos || '?').replace(/'/g, "\\'");

    // Quote keys — use double quotes for words containing apostrophes
    let key;
    if (word.includes("'")) {
      key = `"${word}"`;
    } else {
      key = `'${word}'`;
    }

    let line = `  ${key}: { en: '${safeEn}', ipa: '${safeIpa}', pos: '${safePos}'`;
    if (entry.lemma && entry.lemma !== word) {
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
  const info = LANG_MAP[langCode];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Rebuilding ${info.name} (${langCode})`);
  console.log(`${'='.repeat(60)}`);

  // 1. Parse existing dictionary
  const existing = parseExistingDict(langCode);
  if (!existing) return null;
  console.log(`  Existing dictionary: ${existing.existing.size} entries`);

  // 2. Download and process Wiktionary data (NO context scoring)
  const wiktEntries = await processKaikkiStream(langCode);

  // 3. Merge: update existing entries with Wiktionary definitions
  const merged = new Map();
  let wiktSourced = 0, keptFromCurrent = 0, ipaUpdates = 0;

  for (const [word, currentEntry] of existing.existing) {
    if (wiktEntries.has(word)) {
      const wikt = wiktEntries.get(word);
      const newEntry = {
        en: wikt.en,
        ipa: currentEntry.ipa, // Keep current IPA by default
        pos: currentEntry.pos !== '?' ? currentEntry.pos : wikt.pos,
        lemma: currentEntry.lemma || wikt.lemma,
      };
      // Update IPA only if Wiktionary has a clearly better one
      if (isBetterIpa(wikt.ipa, currentEntry.ipa)) {
        newEntry.ipa = wikt.ipa;
        ipaUpdates++;
      }
      merged.set(word, newEntry);
      wiktSourced++;
    } else {
      // Wiktionary doesn't have this word — keep current entry as-is
      merged.set(word, { ...currentEntry });
      keptFromCurrent++;
    }
  }

  console.log(`\n  --- Results for ${info.name} ---`);
  console.log(`  Total entries: ${merged.size}`);
  console.log(`  Wiktionary-sourced: ${wiktSourced}`);
  console.log(`  Kept from current: ${keptFromCurrent}`);
  console.log(`  IPA updates: ${ipaUpdates}`);

  // 4. Generate output
  const entriesStr = generateDictEntries(merged);
  const newContent = existing.header +
    existing.dictStartMatch + '\n' +
    entriesStr + '\n' +
    '};\n' +
    existing.footer;

  // 5. Write back
  const dictPath = path.join(ROOT, 'src', 'data', 'dictionary', `${langCode}.ts`);
  fs.writeFileSync(dictPath, newContent, 'utf8');
  console.log(`  Written to ${dictPath}`);

  // 6. Report: count truncated definitions and sample entries
  let truncatedCount = 0;
  const sampleEntries = [];
  let sampleIdx = 0;
  const mergedArr = [...merged.entries()];
  const step = Math.max(1, Math.floor(mergedArr.length / 10));
  for (let i = 0; i < mergedArr.length; i++) {
    const [w, e] = mergedArr[i];
    if (e.en.endsWith('...')) truncatedCount++;
    if (sampleIdx < 10 && i % step === 0) {
      sampleEntries.push(`    ${w}: "${e.en}" [${e.pos}]`);
      sampleIdx++;
    }
  }
  console.log(`  Truncated definitions (ending "..."): ${truncatedCount} / ${merged.size}`);
  console.log(`  Sample entries:`);
  for (const s of sampleEntries) console.log(s);

  return {
    lang: langCode,
    name: info.name,
    total: merged.size,
    wiktSourced,
    keptFromCurrent,
    ipaUpdates,
    truncatedCount,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/rebuild-dict-wiktionary-clean.cjs <lang-code|all>');
    console.log('Languages:', Object.keys(LANG_MAP).join(', '));
    process.exit(1);
  }

  const langs = args[0] === 'all' ? Object.keys(LANG_MAP) : [args[0]];

  console.log(`\nClean Wiktionary Dictionary Rebuild`);
  console.log(`NO context scoring — first primary sense only`);
  console.log(`Languages: ${langs.join(', ')}\n`);

  const results = [];
  for (const lang of langs) {
    if (!LANG_MAP[lang]) {
      console.error(`Unknown language: ${lang}`);
      continue;
    }
    const result = await rebuildLang(lang);
    if (result) results.push(result);
  }

  // Final summary table
  if (results.length > 1) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('  SUMMARY');
    console.log(`${'='.repeat(70)}`);
    console.log('  Lang  | Total   | Wikt-sourced | Kept-current | IPA updates | Truncated');
    console.log('  ------|---------|--------------|--------------|-------------|----------');
    for (const r of results) {
      console.log(`  ${r.lang.padEnd(5)} | ${String(r.total).padStart(7)} | ${String(r.wiktSourced).padStart(12)} | ${String(r.keptFromCurrent).padStart(12)} | ${String(r.ipaUpdates).padStart(11)} | ${String(r.truncatedCount || 0).padStart(9)}`);
    }
    const totals = results.reduce((acc, r) => ({
      total: acc.total + r.total,
      wiktSourced: acc.wiktSourced + r.wiktSourced,
      keptFromCurrent: acc.keptFromCurrent + r.keptFromCurrent,
      ipaUpdates: acc.ipaUpdates + r.ipaUpdates,
      truncatedCount: acc.truncatedCount + (r.truncatedCount || 0),
    }), { total: 0, wiktSourced: 0, keptFromCurrent: 0, ipaUpdates: 0, truncatedCount: 0 });
    console.log('  ------|---------|--------------|--------------|-------------|----------');
    console.log(`  TOTAL | ${String(totals.total).padStart(7)} | ${String(totals.wiktSourced).padStart(12)} | ${String(totals.keptFromCurrent).padStart(12)} | ${String(totals.ipaUpdates).padStart(11)} | ${String(totals.truncatedCount).padStart(9)}`);
  }
}

main().catch(console.error);
