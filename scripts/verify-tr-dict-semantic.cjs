#!/usr/bin/env node
/**
 * Semantic verification of EVERY entry in the Turkish dictionary.
 * 1. Parse all entries from tr.ts
 * 2. Skip function words
 * 3. Translate all via Google Translate (tr→en), batch 80
 * 4. Compare – zero content word match → flag for replacement
 * 5. Filter garbage Google results
 * 6. Output fixes JSON
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'tr-semantic-fixes.json');

// ── Function words to skip ──
const FUNCTION_WORDS = new Set([
  'a', 'ama', 'ancak', 'artık', 'asla', 'ayrıca', 'bazen', 'bazı', 'ben', 'bana', 'beni', 'benim',
  'bile', 'bir', 'biri', 'birisi', 'birkaç', 'birçok', 'biz', 'bize', 'bizi', 'bizim',
  'bu', 'buna', 'bunu', 'bunun', 'bunlar', 'bunları', 'burada', 'böyle', 'böylece',
  'da', 'de', 'daha', 'değil', 'değildir', 'diğer', 'dolayı',
  'eğer', 'en', 'evet',
  'fakat', 'filan',
  'gene', 'gibi', 'göre',
  'hala', 'hâlâ', 'hangi', 'hangisi', 'hani', 'hayır', 'hem', 'henüz', 'hep', 'hepsi',
  'her', 'herkes', 'herhangi', 'herşey', 'hiç', 'hiçbir', 'hiçbiri',
  'ile', 'için', 'ise',
  'kadar', 'karşı', 'kendi', 'kendim', 'kendisi', 'ki', 'kim', 'kime', 'kimi', 'kimse',
  'mı', 'mi', 'mu', 'mü', 'madem',
  'nasıl', 'ne', 'neden', 'nedir', 'nere', 'nerede', 'nereden', 'nereye', 'niye', 'niçin',
  'o', 'ona', 'onu', 'onun', 'onlar', 'onları', 'onlara', 'onların', 'orada', 'oysa',
  'öyle', 'öylece',
  'pek',
  'sen', 'sana', 'seni', 'senin', 'siz', 'size', 'sizi', 'sizin', 'sadece', 'sonra',
  'şey', 'şimdi', 'şu', 'şöyle',
  'tabi', 'tabii', 'tamam', 'tek', 'tüm',
  'var', 've', 'veya', 'veyahut',
  'ya', 'yada', 'yahut', 'yani', 'yoksa',
  'zaten', 'zira',
  // Common short particles / suffixes that appear as entries
  'da', 'de', 'ki', 'ile', 'ise', 'dahi', 'hatta', 'üzere', 'rağmen',
  'elbette', 'belki', 'galiba', 'gerçekten', 'muhtemelen', 'sanırım',
  'lütfen', 'teşekkürler', 'merhaba', 'güle', 'hoşça',
]);

// ── Parse dictionary ──
function parseDictionary(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const entries = {};
  // Match lines like:  'word': { en: 'translation', ... }
  // Also handles double-quoted keys
  const re = /^\s+['"](.+?)['"]\s*:\s*\{\s*en:\s*'((?:[^'\\]|\\.)*)'/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    const en = m[2].replace(/\\'/g, "'");
    entries[key] = en;
  }
  return entries;
}

// ── Google Translate batch ──
function googleTranslate(words, sl, tl) {
  return new Promise((resolve, reject) => {
    const params = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${params}&source=${sl}&target=${tl}&key=${process.env.GOOGLE_API_KEY}&format=text`;

    https.get(url, { timeout: 30000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            reject(new Error(`Google API error: ${json.error.message}`));
            return;
          }
          const translations = json.data.translations.map(t => t.translatedText);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, body: ${body.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

// ── Normalize for comparison ──
function normalize(s) {
  return s.toLowerCase()
    .replace(/^to /, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 1);
}

// Words too common to count as a mismatch signal
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'is', 'it', 'and', 'or', 'for',
  'be', 'am', 'are', 'was', 'were', 'been', 'being', 'do', 'does', 'did', 'has', 'have', 'had',
  'i', 'my', 'me', 'we', 'us', 'our', 'you', 'your', 'he', 'his', 'him', 'she', 'her',
  'they', 'them', 'their', 'this', 'that', 'these', 'those', 'not', 'no', 'so', 'but',
  'if', 'up', 'out', 'with', 'from', 'by', 'as', 'very', 'will', 'can', 'may', 'just',
]);

function contentWords(words) {
  return words.filter(w => !STOP_WORDS.has(w));
}

function hasOverlap(dictEn, googleEn) {
  const dWords = contentWords(normalize(dictEn));
  const gWords = contentWords(normalize(googleEn));

  if (dWords.length === 0 && gWords.length === 0) return true;
  if (dWords.length === 0 || gWords.length === 0) return false;

  // Check if ANY content word overlaps
  const gSet = new Set(gWords);
  for (const w of dWords) {
    if (gSet.has(w)) return true;
    // Check stems (3+ chars)
    for (const g of gWords) {
      if (w.length >= 4 && g.length >= 4) {
        const minLen = Math.min(w.length, g.length);
        const stemLen = Math.max(3, Math.floor(minLen * 0.7));
        if (w.slice(0, stemLen) === g.slice(0, stemLen)) return true;
      }
    }
  }
  return false;
}

// ── Filter garbage Google results ──
function isGarbageGoogle(trWord, googleEn) {
  const g = googleEn.toLowerCase().trim();
  // Google just returned the Turkish word back
  if (g === trWord.toLowerCase()) return true;
  // Google returned empty or very short non-English
  if (g.length === 0) return true;
  // Google returned a single character
  if (g.length === 1 && !/^[a-z]$/.test(g)) return true;
  return false;
}

// ── Main ──
async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_API_KEY not set');
    process.exit(1);
  }

  console.log('Parsing Turkish dictionary...');
  const entries = parseDictionary(DICT_PATH);
  const allKeys = Object.keys(entries);
  console.log(`Total entries: ${allKeys.length}`);

  // Filter out function words
  const toVerify = allKeys.filter(k => !FUNCTION_WORDS.has(k));
  console.log(`After skipping function words: ${toVerify.length} entries to verify`);

  const BATCH_SIZE = 80;
  const batches = [];
  for (let i = 0; i < toVerify.length; i += BATCH_SIZE) {
    batches.push(toVerify.slice(i, i + BATCH_SIZE));
  }
  console.log(`Batches: ${batches.length} (size ${BATCH_SIZE})`);

  const mismatches = [];
  let processed = 0;

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    let translations;
    let retries = 0;
    while (retries < 3) {
      try {
        translations = await googleTranslate(batch, 'tr', 'en');
        break;
      } catch (e) {
        retries++;
        console.error(`  Batch ${bi + 1} error (attempt ${retries}): ${e.message}`);
        if (retries >= 3) {
          console.error(`  Skipping batch ${bi + 1}`);
          translations = null;
        }
        await new Promise(r => setTimeout(r, 2000 * retries));
      }
    }

    if (!translations) continue;

    for (let j = 0; j < batch.length; j++) {
      const trWord = batch[j];
      const dictEn = entries[trWord];
      const googleEn = translations[j];

      if (isGarbageGoogle(trWord, googleEn)) continue;

      if (!hasOverlap(dictEn, googleEn)) {
        mismatches.push({
          tr: trWord,
          dictEn,
          googleEn,
        });
      }
    }

    processed += batch.length;
    if ((bi + 1) % 10 === 0 || bi === batches.length - 1) {
      console.log(`  Progress: ${processed}/${toVerify.length} (${mismatches.length} mismatches so far)`);
    }

    // Rate limit: 10 req/s allowed, be conservative
    if (bi < batches.length - 1) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  console.log(`\nTotal mismatches: ${mismatches.length}`);

  // Save results
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mismatches, null, 2));
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
