#!/usr/bin/env node
/**
 * Welsh dictionary semantic verification via Google Translate.
 * 1. Parse ALL entries from cy.ts
 * 2. Skip function words
 * 3. Translate cy→en via Google, batch 80
 * 4. Compare – zero content word match → flag for replacement
 * 5. Filter garbage Google results
 * 6. Output fixes JSON
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'cy.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';
const BATCH_SIZE = 80;

// Welsh function words to skip
const FUNCTION_WORDS = new Set([
  'a', 'â', 'ac', 'ag', 'ai', 'am', 'ar', 'at', 'au',
  'beth', 'bod', 'bydd', 'byth',
  'chi', 'cyn',
  'da', 'dan', 'dau', 'dda', 'ddim', 'di', 'dim', 'do', 'does', 'dros', 'drwy', 'dw', 'dwy', 'dy', 'dyn',
  'e', 'ef', 'ei', 'ein', 'er', 'ers', 'eu', 'eich',
  'fe', 'fi', 'fo', 'fy', 'fydd',
  'ga', 'gan', 'ger', 'go',
  'hi', 'hon', 'heb', 'hefyd', 'holl', 'hun', 'hyd', 'hyn', 'hynny',
  'i', 'ie', 'iddyn', 'iddo', 'iddi', 'iddynt', 'in', 'is',
  'le', 'les',
  'ma', 'mae', 'mewn', 'mi', 'mo', 'mor', 'mwy',
  'na', 'nac', 'nad', 'nag', 'naw', 'neb', 'neu', 'nhw', 'ni', 'nid',
  'o', 'oes', 'oedd', 'oherwydd', 'os',
  'pa', 'pan', 'pe', 'pob', 'pryd', 'pwy',
  'r', 'rhai', 'rhaid', 'rhyw', 'roedd', 'ryw',
  'sut', 'sy', 'sydd',
  'tan', 'taw', 'ti', 'tra', 'tri', 'trwy', 'tu', 'tua',
  'un', 'uwch',
  'w', 'wedi', 'wrth', 'wy',
  'y', 'ydy', 'yma', 'ymlaen', 'yn', 'yna', 'yr', 'yng', 'yw',
  // Mutated forms of common function words
  'ddi', 'ddau', 'ddwy', 'fod', 'fy', 'ger', 'gan',
  // Numbers
  'un', 'dau', 'dwy', 'tri', 'tair', 'pedwar', 'pedair', 'pump', 'pum',
  'chwech', 'chwe', 'saith', 'wyth', 'naw', 'deg', 'deng',
  'cant', 'mil', 'miliwn',
  // Articles / particles
  'y', 'yr', 'r', "'r", "'n", "'i", "'w", "'m",
]);

// ── Parse dictionary ──
function parseDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  // Find the dict block: from "const dict" to the first function or export
  const dictStart = src.indexOf('const dict');
  // Find the closing of the dict object - look for }; followed by function or export

  const entries = {};
  // Match each entry: 'key': { en: '...', ... }
  const entryRe = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  // Also match double-quoted keys
  const entryRe2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;

  let m;
  while ((m = entryRe.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/);
    if (!enMatch) continue;
    const en = enMatch[1];

    // Extract other fields
    const ipaMatch = body.match(/ipa:\s*'([^']*)'/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    const lemmaMatch = body.match(/lemma:\s*'([^']*)'/);

    entries[key] = {
      en,
      ipa: ipaMatch ? ipaMatch[1] : '',
      pos: posMatch ? posMatch[1] : '',
      lemma: lemmaMatch ? lemmaMatch[1] : null,
    };
  }

  while ((m = entryRe2.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/);
    if (!enMatch) continue;
    const en = enMatch[1];

    const ipaMatch = body.match(/ipa:\s*'([^']*)'/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    const lemmaMatch = body.match(/lemma:\s*'([^']*)'/);

    entries[key] = {
      en,
      ipa: ipaMatch ? ipaMatch[1] : '',
      pos: posMatch ? posMatch[1] : '',
      lemma: lemmaMatch ? lemmaMatch[1] : null,
    };
  }

  return entries;
}

// ── Google Translate ──
function translateBatch(texts) {
  return new Promise((resolve, reject) => {
    const params = texts.map(t => `q=${encodeURIComponent(t)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${params}&source=cy&target=en&key=${API_KEY}`;

    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`API error: ${json.error.message}`));
            return;
          }
          const translations = json.data.translations.map(t => {
            // Decode HTML entities
            return t.translatedText
              .replace(/&#39;/g, "'")
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"');
          });
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message} – ${data.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

// ── Comparison logic ──
function normalizeForCompare(s) {
  return s.toLowerCase()
    .replace(/^to /, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

function getContentWords(s) {
  const stops = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'its', 'and', 'or', 'but', 'not', 'no', 'very', 'much', 'so', 'too', 'up', 'out', 'off', 'by', 'with', 'from', 'as', 'into', 'that', 'this', 'which', 'who', 'whom', 'what', 'when', 'where', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'then', 'there', 'here', 'will', 'can', 'may', 'shall', 'should', 'would', 'could', 'might', 'must', 'has', 'have', 'had', 'do', 'does', 'did', 'get', 'gets', 'got']);
  return normalizeForCompare(s).split(/\s+/).filter(w => w.length > 1 && !stops.has(w));
}

function getStemmedWord(w) {
  // Very basic stemming: remove common suffixes
  return w.replace(/(ing|ed|er|est|tion|sion|ment|ness|able|ible|ful|less|ous|ive|ly|ity|al|ial)$/, '');
}

function hasSemanticOverlap(dictEn, googleEn) {
  const dictWords = getContentWords(dictEn);
  const googleWords = getContentWords(googleEn);

  if (dictWords.length === 0 || googleWords.length === 0) return true; // skip if no content words

  // Direct word match
  for (const dw of dictWords) {
    for (const gw of googleWords) {
      if (dw === gw) return true;
      // Stem match
      if (getStemmedWord(dw) === getStemmedWord(gw) && getStemmedWord(dw).length >= 3) return true;
      // One contains the other
      if (dw.length >= 4 && gw.length >= 4) {
        if (dw.includes(gw) || gw.includes(dw)) return true;
      }
    }
  }

  return false;
}

// ── Garbage filter for Google results ──
function isGarbageGoogle(welsh, googleEn) {
  const g = googleEn.toLowerCase().trim();
  // Google sometimes just returns the Welsh word back
  if (g === welsh.toLowerCase()) return true;
  // Single letter/number results for real words
  if (g.length <= 1 && welsh.length > 2) return true;
  // Empty
  if (g === '') return true;
  return false;
}

// ── Main ──
async function main() {
  console.log('Parsing Welsh dictionary...');
  const entries = parseDict();
  const allKeys = Object.keys(entries);
  console.log(`Parsed ${allKeys.length} entries`);

  // Filter: skip function words, skip '?' entries, skip proper nouns (place names etc)
  const toCheck = [];
  let skippedFunction = 0;
  let skippedQuestion = 0;
  let skippedNumeric = 0;

  for (const key of allKeys) {
    const e = entries[key];
    if (FUNCTION_WORDS.has(key)) { skippedFunction++; continue; }
    if (e.en === '?') { skippedQuestion++; continue; }
    if (/^\d+$/.test(key)) { skippedNumeric++; continue; }
    toCheck.push(key);
  }

  console.log(`Skipped: ${skippedFunction} function, ${skippedQuestion} unknown(?), ${skippedNumeric} numeric`);
  console.log(`Checking ${toCheck.length} entries via Google Translate...`);

  // Batch translate
  const fixes = [];
  let batchNum = 0;
  const totalBatches = Math.ceil(toCheck.length / BATCH_SIZE);

  for (let i = 0; i < toCheck.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = toCheck.slice(i, i + BATCH_SIZE);
    const welshTexts = batch; // translate the keys

    let translations;
    try {
      translations = await translateBatch(welshTexts);
    } catch (e) {
      console.error(`Batch ${batchNum}/${totalBatches} failed: ${e.message}`);
      // Retry once after 2s
      await new Promise(r => setTimeout(r, 2000));
      try {
        translations = await translateBatch(welshTexts);
      } catch (e2) {
        console.error(`Batch ${batchNum} retry failed: ${e2.message}`);
        continue;
      }
    }

    for (let j = 0; j < batch.length; j++) {
      const key = batch[j];
      const e = entries[key];
      const googleEn = translations[j];

      if (isGarbageGoogle(key, googleEn)) continue;

      if (!hasSemanticOverlap(e.en, googleEn)) {
        fixes.push({
          key,
          oldEn: e.en,
          googleEn: googleEn.toLowerCase(),
          ipa: e.ipa,
          pos: e.pos,
          lemma: e.lemma,
        });
      }
    }

    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`  Batch ${batchNum}/${totalBatches} done – ${fixes.length} mismatches so far`);
    }

    // Small delay between batches
    if (i + BATCH_SIZE < toCheck.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`\nTotal mismatches: ${fixes.length}`);

  // Save fixes
  const outPath = path.join(__dirname, 'output', 'cy-semantic-fixes.json');
  fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(fixes, null, 2));
  console.log(`Saved to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
