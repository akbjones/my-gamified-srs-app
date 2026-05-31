#!/usr/bin/env node
/**
 * Semantic verification of ALL Dutch dictionary entries via Google Translate.
 * 1. Parse every entry from nl.ts
 * 2. Skip function words
 * 3. Translate nl→en via Google (batches of 80)
 * 4. Compare — zero overlap → flag for replacement
 * 5. Filter garbage Google results
 * 6. Output JSON with fixes
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const NL_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'nl.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ── Function words to skip ──────────────────────────────────────
const FUNCTION_WORDS = new Set([
  // determiners
  'de', 'het', 'een', 'dit', 'dat', 'deze', 'die', 'elk', 'elke', 'alle',
  'geen', 'ieder', 'iedere', 'welk', 'welke', 'zulk', 'zulke', 'enig', 'enige',
  // pronouns
  'ik', 'je', 'jij', 'u', 'hij', 'zij', 'ze', 'wij', 'we', 'jullie',
  'hen', 'hun', 'hem', 'haar', 'het', 'mij', 'me', 'ons', 'zich',
  'wie', 'wat', 'welke', 'wiens', 'wier',
  'dit', 'dat', 'deze', 'die', 'zelf', 'elkaar', 'men', 'iets', 'niets',
  'iemand', 'niemand', 'alles', 'iedereen',
  // prepositions
  'aan', 'achter', 'bij', 'binnen', 'buiten', 'door', 'in', 'langs',
  'met', 'na', 'naar', 'naast', 'om', 'onder', 'op', 'over', 'rond',
  'sinds', 'te', 'tegen', 'tot', 'tussen', 'uit', 'van', 'voor',
  'vanaf', 'vanuit', 'via', 'zonder', 'per', 'dankzij', 'tijdens',
  'volgens', 'wegens', 'behalve', 'ondanks', 'tegenover', 'rondom',
  // conjunctions
  'en', 'of', 'maar', 'want', 'dus', 'noch', 'dat', 'omdat', 'zodat',
  'als', 'indien', 'mits', 'tenzij', 'hoewel', 'ofschoon', 'terwijl',
  'toen', 'voordat', 'nadat', 'opdat', 'doordat', 'totdat',
  // auxiliaries / modals (handled in IRREGULAR_MAP)
  'ben', 'bent', 'is', 'zijn', 'was', 'waren', 'heb', 'hebt', 'heeft', 'hebben',
  'had', 'hadden', 'word', 'wordt', 'werd', 'werden',
  'kan', 'kun', 'kunt', 'kon', 'konden', 'kunnen',
  'mag', 'mocht', 'mochten', 'mogen',
  'moet', 'moest', 'moesten', 'moeten',
  'wil', 'wilt', 'wilde', 'wilden', 'willen',
  'zal', 'zul', 'zult', 'zou', 'zouden', 'zullen',
  // adverbs / particles
  'er', 'hier', 'daar', 'waar', 'hoe', 'waarom', 'wanneer',
  'niet', 'wel', 'ook', 'nog', 'al', 'reeds', 'steeds', 'altijd',
  'nooit', 'ooit', 'soms', 'vaak', 'zelden',
  'heel', 'zeer', 'erg', 'best', 'nogal', 'tamelijk', 'vrij',
  'ja', 'nee', 'neen', 'toch',
  'nu', 'dan', 'zo', 'heen', 'weg', 'terug',
  // numbers
  'nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien',
  'elf', 'twaalf', 'dertien', 'veertien', 'vijftien',
  'eerste', 'tweede', 'derde',
  // misc function
  'er', 'toe', 'af', 'mee',
]);

// ── Parse dictionary entries from nl.ts ─────────────────────────
function parseDictionary(src) {
  const entries = {};
  // Match:  'word': { en: 'translation', ipa: '...', ... }
  const re = /^\s*'([^']+)':\s*\{\s*en:\s*'([^']*(?:\\'[^']*)*)'/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const word = m[1];
    const en = m[2].replace(/\\'/g, "'");
    entries[word] = en;
  }
  return entries;
}

// ── Google Translate batch ───────────────────────────────────────
function translateBatch(words) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams();
    params.append('key', API_KEY);
    params.append('source', 'nl');
    params.append('target', 'en');
    params.append('format', 'text');
    for (const w of words) {
      params.append('q', w);
    }
    const body = params.toString();
    const options = {
      hostname: 'translation.googleapis.com',
      path: '/language/translate/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.translations) {
            resolve(json.data.translations.map((t) => t.translatedText));
          } else {
            reject(new Error('Bad response: ' + data.slice(0, 300)));
          }
        } catch (e) {
          reject(new Error('JSON parse error: ' + data.slice(0, 300)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Normalize for comparison ─────────────────────────────────────
function normalize(s) {
  return s
    .toLowerCase()
    .replace(/\b(to|a|an|the|of|it|is|are|be|in|on|at|for|with|by|up|out|as|or|and|no|not|so|do|my|me|we|he|she|one|has|had|was|were|been)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWords(s) {
  return new Set(normalize(s).split(/\s+/).filter(Boolean));
}

function hasOverlap(dictEn, googleEn) {
  const dw = extractWords(dictEn);
  const gw = extractWords(googleEn);
  if (dw.size === 0 || gw.size === 0) return true; // skip empty
  for (const w of dw) {
    if (w.length <= 2) continue; // skip tiny words
    if (gw.has(w)) return true;
    // check stem overlap (first 4+ chars)
    if (w.length >= 5) {
      for (const g of gw) {
        if (g.length >= 5 && g.startsWith(w.slice(0, 5))) return true;
        if (g.length >= 5 && w.startsWith(g.slice(0, 5))) return true;
      }
    }
  }
  // Also check reverse
  for (const g of gw) {
    if (g.length <= 2) continue;
    if (dw.has(g)) return true;
    if (g.length >= 5) {
      for (const d of dw) {
        if (d.length >= 5 && d.startsWith(g.slice(0, 5))) return true;
        if (d.length >= 5 && g.startsWith(d.slice(0, 5))) return true;
      }
    }
  }
  return false;
}

// ── Filter garbage Google results ────────────────────────────────
function isGarbageGoogle(nlWord, googleEn) {
  const g = googleEn.toLowerCase().trim();
  // Google just returned the Dutch word as-is
  if (g === nlWord.toLowerCase()) return true;
  // Mostly non-alpha
  if (g.replace(/[^a-z]/g, '').length < 2) return true;
  // Very long (probably a sentence, not a word translation)
  if (g.split(/\s+/).length > 12) return true;
  return false;
}

// ── Format Google translation for dict ───────────────────────────
function formatTranslation(nlWord, googleEn, pos) {
  let en = googleEn.trim();
  // Add "to " prefix for verbs
  if (pos === 'v' && !en.toLowerCase().startsWith('to ')) {
    en = 'to ' + en.toLowerCase();
  }
  // Lowercase first word for non-proper-nouns
  if (pos !== 'n' || en[0] === en[0].toLowerCase()) {
    en = en.charAt(0).toLowerCase() + en.slice(1);
  }
  return en;
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const src = fs.readFileSync(NL_PATH, 'utf8');
  const entries = parseDictionary(src);
  const allWords = Object.keys(entries);
  console.log(`Parsed ${allWords.length} dictionary entries`);

  // Also parse POS for each entry
  const posMap = {};
  const posRe = /^\s*'([^']+)':\s*\{[^}]*pos:\s*'([^']*)'/gm;
  let pm;
  while ((pm = posRe.exec(src)) !== null) {
    posMap[pm[1]] = pm[2];
  }

  // Filter content words
  const contentWords = allWords.filter(w => {
    if (FUNCTION_WORDS.has(w.toLowerCase())) return false;
    // Skip single characters
    if (w.length <= 1) return false;
    // Skip entries that look like proper nouns / place names only
    // (we still translate them to verify)
    return true;
  });
  console.log(`Content words to verify: ${contentWords.length} (skipped ${allWords.length - contentWords.length} function words)`);

  // Batch translate
  const BATCH_SIZE = 80;
  const googleResults = {};
  const batches = [];
  for (let i = 0; i < contentWords.length; i += BATCH_SIZE) {
    batches.push(contentWords.slice(i, i + BATCH_SIZE));
  }
  console.log(`Translating in ${batches.length} batches of up to ${BATCH_SIZE}...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const results = await translateBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        googleResults[batch[j]] = results[j];
      }
      if ((i + 1) % 10 === 0) {
        console.log(`  Batch ${i + 1}/${batches.length} done`);
      }
    } catch (err) {
      console.error(`  Batch ${i + 1} FAILED: ${err.message}`);
      // Wait and retry once
      await new Promise(r => setTimeout(r, 2000));
      try {
        const results = await translateBatch(batch);
        for (let j = 0; j < batch.length; j++) {
          googleResults[batch[j]] = results[j];
        }
      } catch (err2) {
        console.error(`  Batch ${i + 1} RETRY FAILED: ${err2.message}`);
      }
    }
    // Rate limit: small delay
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  console.log(`Got Google translations for ${Object.keys(googleResults).length} words`);

  // Compare
  const mismatches = [];
  for (const word of contentWords) {
    const dictEn = entries[word];
    const googleEn = googleResults[word];
    if (!googleEn) continue;
    if (isGarbageGoogle(word, googleEn)) continue;

    if (!hasOverlap(dictEn, googleEn)) {
      const pos = posMap[word] || '';
      mismatches.push({
        word,
        dictEn,
        googleEn,
        pos,
        suggestedEn: formatTranslation(word, googleEn, pos),
      });
    }
  }

  console.log(`\nFound ${mismatches.length} mismatches (zero content word overlap)`);

  // Write results
  const outPath = path.join(__dirname, 'output', 'nl-semantic-verify.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(mismatches, null, 2));
  console.log(`Written to ${outPath}`);

  // Print sample
  console.log('\n── Sample mismatches (first 30) ──');
  for (const m of mismatches.slice(0, 30)) {
    console.log(`  ${m.word}: dict="${m.dictEn}" → google="${m.googleEn}" → suggested="${m.suggestedEn}"`);
  }
}

main().catch(console.error);
