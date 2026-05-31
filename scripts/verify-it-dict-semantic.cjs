#!/usr/bin/env node
/**
 * Semantic verification of Italian dictionary via Google Translate API.
 * 1. Parse all entries from it.ts
 * 2. Skip Italian function words
 * 3. Translate all remaining via Google (it→en), batch 80
 * 4. Compare — zero content-word match → flag for replacement
 * 5. Filter garbage Google results
 * 6. Output JSON with fixes
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ── Italian function words to skip ──────────────────────────────
const FUNCTION_WORDS = new Set([
  // articles
  'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una',
  // prepositions & contractions
  'a', 'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  // conjunctions
  'e', 'ed', 'o', 'ma', 'però', 'che', 'se', 'né', 'oppure',
  'perché', 'quando', 'mentre', 'come', 'dove', 'anche', 'pure',
  'dunque', 'quindi', 'eppure', 'anzi', 'cioè', 'ossia',
  // pronouns
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'esso', 'essa',
  'mi', 'ti', 'ci', 'vi', 'si', 'lo', 'la', 'li', 'le', 'ne',
  'me', 'te', 'sé', 'ce', 've',
  'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle',
  'chi', 'cui', 'quale', 'quali',
  // demonstratives & misc
  'il', 'lo', 'la', 'i', 'gli', 'le',
  'mio', 'mia', 'miei', 'mie',
  'tuo', 'tua', 'tuoi', 'tue',
  'suo', 'sua', 'suoi', 'sue',
  'nostro', 'nostra', 'nostri', 'nostre',
  'vostro', 'vostra', 'vostri', 'vostre',
  'loro',
  // common auxiliaries/modals (skip as function words)
  // adverbs that are truly function-like
  'non', 'no', 'sì', 'già', 'più', 'molto', 'poco', 'mai',
  'sempre', 'ancora', 'solo', 'proprio', 'così', 'qui', 'qua',
  'lì', 'là', 'ora', 'adesso', 'poi', 'prima', 'dopo',
  // other
  'c', 'n', 'd', 'ecco',
  // essere/avere forms
  'è', 'sono', 'sei', 'siamo', 'siete',
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno',
  'era', 'ero', 'eri', 'eravamo', 'eravate', 'erano',
  'sarà', 'sarò', 'sarai', 'saremo', 'sarete', 'saranno',
  'sia', 'siano', 'siate',
  'stato', 'stata', 'stati', 'state',
  'avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano',
  'avrà', 'avrò', 'avrai', 'avremo', 'avrete', 'avranno',
  'abbia', 'abbiano', 'abbiate', 'abbi',
  // fare/dare/stare basic forms
  'fa', 'fai', 'fanno', 'facciamo', 'fate',
  'do', 'dai', 'dà', 'diamo', 'danno', 'date',
  'sta', 'stai', 'stanno', 'stiamo',
  // potere/volere/dovere forms
  'può', 'posso', 'puoi', 'possiamo', 'possono', 'potete',
  'vuoi', 'vuole', 'voglio', 'vogliamo', 'volete', 'vogliono',
  'deve', 'devo', 'devi', 'dobbiamo', 'devono', 'dovete',
  // andare/venire basic
  'va', 'vai', 'andiamo', 'vanno', 'andate',
  'viene', 'vengo', 'vieni', 'veniamo', 'vengono', 'venite',
]);

// ── Parse dictionary ────────────────────────────────────────────
function parseDictionary(src) {
  const entries = {};
  // Match: 'key': { en: 'value', ... }
  const re = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  // Also match double-quoted keys
  const re2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;

  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    if (enMatch) {
      entries[key] = { en: enMatch[1], raw: m[0].trim() };
    }
  }
  while ((m = re2.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    if (enMatch) {
      entries[key] = { en: enMatch[1], raw: m[0].trim() };
    }
  }
  return entries;
}

// ── Google Translate batch ──────────────────────────────────────
function googleTranslateBatch(words, sourceLang, targetLang) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${qParams}&source=${sourceLang}&target=${targetLang}&key=${API_KEY}&format=text`;

    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
            return;
          }
          const translations = json.data.translations.map(t => t.translatedText);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nResponse: ${data.slice(0, 500)}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Semantic comparison ─────────────────────────────────────────
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'but',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'my', 'your',
  'his', 'her', 'their', 'our', 'us', 'them',
  'do', 'does', 'did', 'will', 'would', 'can', 'could', 'shall', 'should',
  'may', 'might', 'must', 'have', 'has', 'had',
  'not', 'no', 'up', 'out', 'off', 'by', 'with', 'from', 'as',
  'this', 'that', 'these', 'those', 'some', 'any', 'all', 'each', 'every',
  'very', 'so', 'too', 'also', 'just', 'more', 'most', 'own', 'other',
  'one', 'oneself', 'something', 'someone', 'thing',
]);

function extractContentWords(text) {
  if (!text) return new Set();
  return new Set(
    text.toLowerCase()
      .replace(/[().,!?;:"""''\/\-–—]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w))
  );
}

function semanticMatch(dictEn, googleEn) {
  const dWords = extractContentWords(dictEn);
  const gWords = extractContentWords(googleEn);

  if (dWords.size === 0 || gWords.size === 0) return true; // skip if no content words

  // Check if ANY content word overlaps (or stem-level match)
  for (const dw of dWords) {
    for (const gw of gWords) {
      // Exact match
      if (dw === gw) return true;
      // Stem match (first 4+ chars)
      if (dw.length >= 4 && gw.length >= 4 && dw.slice(0, 4) === gw.slice(0, 4)) return true;
      // One contains the other
      if (dw.length >= 3 && gw.length >= 3) {
        if (dw.includes(gw) || gw.includes(dw)) return true;
      }
    }
  }
  return false;
}

// ── Garbage filter for Google results ───────────────────────────
function isGarbageTranslation(googleEn, italianWord) {
  if (!googleEn || googleEn.trim() === '') return true;
  // Google returned the Italian word unchanged
  if (googleEn.toLowerCase().trim() === italianWord.toLowerCase().trim()) return true;
  // Way too long (probably a sentence explanation)
  if (googleEn.length > 80) return true;
  // Contains non-ASCII that shouldn't be in English
  if (/[^\x00-\x7F]/.test(googleEn) && !/[àáâãäåèéêëìíîïòóôõöùúûüýÿñ]/i.test(googleEn)) return true;
  return false;
}

// ── Clean Google translation for use as replacement ─────────────
function cleanGoogleTranslation(googleEn, pos) {
  let clean = googleEn.trim();
  // Lowercase unless it's a proper noun
  if (!/^[A-Z][a-z]/.test(clean) || clean.split(' ').length > 1) {
    clean = clean.toLowerCase();
  }
  // Add "to " prefix for verbs if not present
  if (pos === 'v' && !clean.startsWith('to ')) {
    clean = 'to ' + clean;
  }
  // Remove trailing period
  clean = clean.replace(/\.$/, '');
  return clean;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('Reading dictionary...');
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = parseDictionary(src);
  const allKeys = Object.keys(entries);
  console.log(`Parsed ${allKeys.length} entries`);

  // Filter: skip function words and entries with '?' (already flagged)
  const toCheck = allKeys.filter(k => {
    if (FUNCTION_WORDS.has(k)) return false;
    return true;
  });
  console.log(`Checking ${toCheck.length} content entries (skipped ${allKeys.length - toCheck.length} function words)`);

  // Batch translate
  const BATCH_SIZE = 80;
  const translations = {};
  const batches = [];
  for (let i = 0; i < toCheck.length; i += BATCH_SIZE) {
    batches.push(toCheck.slice(i, i + BATCH_SIZE));
  }

  console.log(`Translating in ${batches.length} batches of ${BATCH_SIZE}...`);

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    try {
      const results = await googleTranslateBatch(batch, 'it', 'en');
      for (let j = 0; j < batch.length; j++) {
        translations[batch[j]] = results[j];
      }
      if ((bi + 1) % 10 === 0 || bi === batches.length - 1) {
        console.log(`  Batch ${bi + 1}/${batches.length} done (${Object.keys(translations).length} translated)`);
      }
    } catch (err) {
      console.error(`  Batch ${bi + 1} failed: ${err.message}`);
      // Retry once after 2s
      await new Promise(r => setTimeout(r, 2000));
      try {
        const results = await googleTranslateBatch(batch, 'it', 'en');
        for (let j = 0; j < batch.length; j++) {
          translations[batch[j]] = results[j];
        }
        console.log(`  Batch ${bi + 1} retry succeeded`);
      } catch (err2) {
        console.error(`  Batch ${bi + 1} retry failed: ${err2.message}`);
      }
    }
    // Small delay to avoid rate limits
    if (bi < batches.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`\nTranslated ${Object.keys(translations).length} words. Comparing...`);

  // Compare
  const mismatches = [];
  let matchCount = 0;
  let skipCount = 0;

  for (const key of toCheck) {
    const dictEn = entries[key].en;
    const googleEn = translations[key];

    if (!googleEn) {
      skipCount++;
      continue;
    }

    if (semanticMatch(dictEn, googleEn)) {
      matchCount++;
    } else {
      // Check if Google result is garbage
      if (isGarbageTranslation(googleEn, key)) {
        skipCount++;
        continue;
      }

      mismatches.push({
        word: key,
        dictEn: dictEn,
        googleEn: googleEn,
      });
    }
  }

  console.log(`\nResults:`);
  console.log(`  Matched: ${matchCount}`);
  console.log(`  Mismatched: ${mismatches.length}`);
  console.log(`  Skipped: ${skipCount}`);

  // Save mismatches for review
  const outputPath = path.join(__dirname, 'output', 'it-semantic-mismatches.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(mismatches, null, 2));
  console.log(`\nSaved ${mismatches.length} mismatches to ${outputPath}`);

  // Now apply fixes
  console.log(`\nApplying fixes...`);
  let fixedSrc = src;
  let fixCount = 0;

  for (const mm of mismatches) {
    const key = mm.word;
    const entry = entries[key];
    const dictEn = entry.en;

    // Extract POS from entry
    const posMatch = entry.raw.match(/pos:\s*'([^']*)'/);
    const pos = posMatch ? posMatch[1] : '';

    const newEn = cleanGoogleTranslation(mm.googleEn, pos);

    // Skip if new translation is same as old after cleanup
    if (newEn === dictEn.toLowerCase().trim()) continue;
    // Skip if new translation is too similar (just capitalization)
    if (newEn.toLowerCase() === dictEn.toLowerCase()) continue;

    // Replace in source - find the exact en value and replace it
    // Need to be careful with special regex chars
    const escapedDictEn = dictEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match the specific entry line
    const entryRegex = new RegExp(
      `('${escapedKey}':\\s*\\{[^}]*en:\\s*')${escapedDictEn}(')`
    );
    const dqEntryRegex = new RegExp(
      `("${escapedKey}":\\s*\\{[^}]*en:\\s*')${escapedDictEn}(')`
    );

    // Escape single quotes in new translation
    const safeNewEn = newEn.replace(/'/g, "\\'");

    if (entryRegex.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(entryRegex, `$1${safeNewEn}$2`);
      fixCount++;
    } else if (dqEntryRegex.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(dqEntryRegex, `$1${safeNewEn}$2`);
      fixCount++;
    }
  }

  console.log(`Applied ${fixCount} fixes`);

  if (fixCount > 0) {
    fs.writeFileSync(DICT_PATH, fixedSrc);
    console.log(`Wrote updated dictionary to ${DICT_PATH}`);
  }

  // Output summary
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total entries: ${allKeys.length}`);
  console.log(`Checked: ${toCheck.length}`);
  console.log(`Matched: ${matchCount}`);
  console.log(`Mismatches found: ${mismatches.length}`);
  console.log(`Fixes applied: ${fixCount}`);

  return fixCount;
}

main().then(fixCount => {
  console.log(`\nITALIAN SEMANTIC VERIFICATION COMPLETE — ${fixCount} fixes`);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
