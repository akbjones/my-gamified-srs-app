#!/usr/bin/env node
/**
 * Rebuild Turkish dictionary using Google Translate as PRIMARY source.
 * Hand-verified function words (~100) are never sent to Google.
 * Uses shared post-process-google.cjs pipeline + english-lemmatizer.cjs.
 *
 * Steps:
 *  1. Parse existing tr.ts dictionary (preserve IPA + pos + lemma)
 *  2. Extract all unique words from deck
 *  3. Apply function word table for ~100 known entries
 *  4. Google Translate everything else (tr→en)
 *  5. Post-process via shared 16-rule pipeline
 *  6. Lemma copy: inflected forms inherit base form's translation
 *  7. Write back to tr.ts preserving the lookup function
 *
 * Output: updated src/data/dictionary/tr.ts + 50-sample report on stdout
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/tr.ts');
const DECK_PATH = path.join(ROOT, 'src/data/turkish/deck.json');
const API_KEY = process.env.GOOGLE_TTS_KEY;

// ── Turkish function word table (~100 entries) ──────────────────
const FUNCTION_WORDS = {
  // Pronouns – subject
  'ben': 'I',
  'sen': 'you',
  'o': 'he, she, it',
  'biz': 'we',
  'siz': 'you (pl./formal)',
  'onlar': 'they',
  // Pronouns – accusative
  'beni': 'me',
  'seni': 'you',
  'onu': 'him, her, it',
  'bizi': 'us',
  'sizi': 'you (pl./formal)',
  'onları': 'them',
  // Pronouns – dative
  'bana': 'to me',
  'sana': 'to you',
  'ona': 'to him/her',
  'bize': 'to us',
  'size': 'to you (pl.)',
  'onlara': 'to them',
  // Pronouns – genitive
  'benim': 'my',
  'senin': 'your',
  'onun': 'his, her, its',
  'bizim': 'our',
  'sizin': 'your (pl.)',
  'onların': 'their',
  // Interrogatives
  'kim': 'who',
  'ne': 'what',
  'nerede': 'where',
  'nereye': 'where to',
  'nereden': 'where from',
  'nasıl': 'how',
  'neden': 'why',
  'niçin': 'why',
  'hangi': 'which',
  'kaç': 'how many',
  // Postpositions / relational
  'için': 'for',
  'ile': 'with',
  'gibi': 'like, as',
  'kadar': 'as much as, until',
  'göre': 'according to',
  'karşı': 'against, opposite',
  'doğru': 'toward, correct',
  'sonra': 'after',
  'önce': 'before',
  'beri': 'since',
  'arasında': 'between, among',
  'hakkında': 'about',
  // Conjunctions
  've': 'and',
  'veya': 'or',
  'ama': 'but',
  'fakat': 'but, however',
  'çünkü': 'because',
  'ise': 'as for, if',
  'ya': 'or (emphatic)',
  'hem': 'both, also',
  'de': 'also, too',
  'da': 'also, too',
  'ki': 'that (conj.)',
  // Common adverbs
  'çok': 'very, much',
  'az': 'little, few',
  'en': 'most (superlative)',
  'daha': 'more, still',
  'bile': 'even',
  'sadece': 'only',
  'yalnız': 'only, alone',
  'hep': 'always',
  'hiç': 'never, ever',
  'her': 'every, each',
  'şimdi': 'now',
  'bugün': 'today',
  'yarın': 'tomorrow',
  'dün': 'yesterday',
  'artık': 'anymore, now',
  'henüz': 'yet, just',
  'hemen': 'immediately',
  'bazen': 'sometimes',
  // Auxiliaries / particles
  'var': 'there is, exists',
  'yok': 'there is not',
  'değil': 'not, is not',
  'mi': '(question particle)',
  'mı': '(question particle)',
  'mu': '(question particle)',
  'mü': '(question particle)',
  'evet': 'yes',
  'hayır': 'no',
  // Determiners
  'bu': 'this',
  'şu': 'that (nearby)',
  'bir': 'a, one',
  'bazı': 'some',
  'birkaç': 'a few',
  'hiçbir': 'none, no',
  'tüm': 'all, entire',
  'bütün': 'all, whole',
  // Existence / copula
  'olan': 'that is, being',
  'olarak': 'as',
  'olmak': 'to be, to become',
};

// ── Turkish special chars (used for source-char detection) ──────
const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/;

// ── Parse existing dictionary from .ts ─────────────────────────
function parseDictionary() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};

  // Match: 'key': { ... } or "key": { ... }
  const re = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const obj = {};

    // en
    const enM = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    if (enM) obj.en = enM[1];

    // ipa
    const ipaM = body.match(/ipa:\s*'([^']*)'/) || body.match(/ipa:\s*"([^"]*)"/);
    if (ipaM) obj.ipa = ipaM[1];

    // pos
    const posM = body.match(/pos:\s*'([^']*)'/) || body.match(/pos:\s*"([^"]*)"/);
    if (posM) obj.pos = posM[1];

    // lemma
    const lemmaM = body.match(/lemma:\s*'([^']*)'/) || body.match(/lemma:\s*"([^"]*)"/);
    if (lemmaM) obj.lemma = lemmaM[1];

    entries[key] = obj;
  }
  return entries;
}

// ── Load deck and extract unique words ─────────────────────────
function loadDeckWords() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const words = new Set();
  for (const card of deck) {
    const text = card.target || '';
    const tokens = text.replace(/[.,!?;:"""''()––…\[\]{}\d«»]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    for (const t of tokens) {
      words.add(t.toLowerCase());
    }
  }
  return { deck, words };
}

// ── Google Translate batch (tr → en) ────────────────────────────
function googleTranslateBatch(words) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=tr&target=en&${qParams}`;

    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Google API error: ${json.error.message}`));
            return;
          }
          const translations = json.data.translations.map(t => t.translatedText);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nBody: ${data.slice(0, 500)}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Build word→cards index for validation ──────────────────────
function buildWordCardsIndex(deck) {
  const index = {};
  for (const card of deck) {
    const words = (card.target || '')
      .replace(/[.,!?;:"""''()––…\[\]{}\d«»]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w.toLowerCase());
    for (const w of words) {
      if (!index[w]) index[w] = [];
      index[w].push(card);
    }
  }
  return index;
}

// ── Card-based validation ──────────────────────────────────────
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'has', 'have', 'had', 'do', 'does', 'did',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  'and', 'or', 'but', 'not', 'no', 'yes',
  'if', 'then', 'so', 'as', 'than', 'very', 'too', 'also',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'shall',
  'up', 'out', 'about', 'into', 'over', 'after', 'before',
]);

function extractContentWords(text) {
  return text.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function validateEntry(newEn, word, wordCardsIndex) {
  const cards = wordCardsIndex[word] || [];
  if (cards.length < 2) return false;
  const contentWords = extractContentWords(newEn);
  if (contentWords.length === 0) return false;
  for (const cw of contentWords) {
    let matchCount = 0;
    for (const card of cards) {
      const cardWords = card.english.toLowerCase().split(/\s+/);
      if (cardWords.some(w => w.replace(/[^a-z]/g, '').includes(cw) || cw.includes(w.replace(/[^a-z]/g, '')))) {
        matchCount++;
        if (matchCount >= 2) break;
      }
    }
    if (matchCount >= 2) return true;
  }
  return false;
}

// ── Emit TypeScript ────────────────────────────────────────────
function emitDictTs(entries) {
  // Read the ORIGINAL file to preserve the lookup function
  const origSrc = fs.readFileSync(DICT_PATH, 'utf8');

  // Find where the dictionary body ends (the closing `};` for the main dict)
  // We'll preserve everything from the first occurrence of `};\n` that is
  // followed by the suffix-stripping / lookup code.
  const lookupStart = origSrc.indexOf('\n// ── Suffix-strip');
  let suffix = '';
  if (lookupStart !== -1) {
    suffix = origSrc.slice(lookupStart);
  } else {
    // Try other markers
    const altStart = origSrc.indexOf('\nconst CASE_SUFFIXES');
    if (altStart !== -1) {
      suffix = origSrc.slice(altStart);
    } else {
      // Fallback: find export default
      const expStart = origSrc.indexOf('\nexport default');
      if (expStart !== -1) {
        suffix = origSrc.slice(expStart);
      }
    }
  }

  // Build header
  let ts = `import type { DictEntry } from './es';
import { findInfinitive } from '../conjugation/tr';

// ── Turkish Dictionary ────────────────────────────────────────
// Keys are lowercase Turkish (with ç, ğ, ı, ö, ş, ü).
// Each entry: { en: 'English translation', ipa: 'ˈæntrj', pos: 'part of speech' }
const dictionary: Record<string, DictEntry> = {\n`;

  // Sort entries by Turkish locale
  const sortedKeys = Object.keys(entries).sort((a, b) =>
    a.localeCompare(b, 'tr', { sensitivity: 'base' })
  );

  for (const key of sortedKeys) {
    const e = entries[key];
    // Escape single quotes in values
    const en = (e.en || '?').replace(/'/g, "\\'");
    const ipa = (e.ipa || '').replace(/'/g, "\\'");
    const pos = (e.pos || 'n').replace(/'/g, "\\'");

    // Use double quotes for keys containing apostrophes
    const keyStr = key.includes("'") ? `"${key}"` : `'${key}'`;

    let line = `  ${keyStr}: { en: '${en}', ipa: '${ipa}', pos: '${pos}'`;
    if (e.lemma) {
      const lemma = e.lemma.replace(/'/g, "\\'");
      line += `, lemma: '${lemma}'`;
    }
    line += ` },`;
    ts += line + '\n';
  }

  ts += '};\n';

  // Append the suffix (lookup function etc.)
  ts += suffix;

  return ts;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('=== Turkish Dictionary Rebuild via Google Translate ===\n');

  // Step 1: Parse existing dictionary
  console.log('Parsing existing dictionary...');
  const dict = parseDictionary();
  const dictKeys = Object.keys(dict);
  console.log(`  ${dictKeys.length} entries found`);

  // Step 2: Load deck words
  console.log('Loading deck and extracting words...');
  const { deck, words: deckWords } = loadDeckWords();
  console.log(`  ${deck.length} cards, ${deckWords.size} unique words`);

  const wordCardsIndex = buildWordCardsIndex(deck);

  // All words that need definitions: union of dict keys and deck words
  const allWords = new Set([...dictKeys, ...deckWords]);
  console.log(`  ${allWords.size} total words (dict + deck)`);

  // Classify into function words vs Google words
  const functionKeys = [];
  const googleKeys = [];
  for (const w of allWords) {
    if (FUNCTION_WORDS[w] !== undefined) {
      functionKeys.push(w);
    } else {
      googleKeys.push(w);
    }
  }
  console.log(`  ${functionKeys.length} function words (hand-verified)`);
  console.log(`  ${googleKeys.length} words to send to Google Translate`);

  // Step 3: Build results – function words
  const results = {};
  for (const key of functionKeys) {
    const existing = dict[key] || {};
    results[key] = {
      en: FUNCTION_WORDS[key],
      ipa: existing.ipa || '',
      pos: existing.pos || 'part',
      lemma: existing.lemma,
      source: 'function_table',
    };
  }

  // Step 4: Google Translate in batches
  const BATCH_SIZE = 80;
  const DELAY = 250;
  const googleRaw = {}; // word → raw translation

  console.log(`\nSending ${googleKeys.length} words to Google Translate in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < googleKeys.length; i += BATCH_SIZE) {
    const batch = googleKeys.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(googleKeys.length / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} words)...`);

    try {
      const translations = await googleTranslateBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        googleRaw[batch[j]] = translations[j];
      }
      console.log(' done');
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      for (const w of batch) {
        googleRaw[w] = null;
      }
    }

    if (i + BATCH_SIZE < googleKeys.length) {
      await sleep(DELAY);
    }
  }

  // Step 5: Post-process via shared pipeline
  console.log('\nPost-processing Google results...');
  const stats = new PostProcessStats();
  const googleProcessed = {};

  for (const key of googleKeys) {
    const raw = googleRaw[key];
    const existing = dict[key] || {};
    const pos = existing.pos || 'n';

    if (raw === null || raw === undefined) {
      googleProcessed[key] = { text: existing.en || '?', failed: true };
      continue;
    }

    // Turkish uses Latin script – detect if Google just echoed the word back
    const rawLower = raw.toLowerCase().trim();
    if (rawLower === key) {
      // Google echoed it back – probably a proper noun or unknown
      googleProcessed[key] = { text: raw.toLowerCase(), echoedBack: true };
      continue;
    }

    const result = postProcess(raw, pos, key, stats);
    googleProcessed[key] = { text: result.text, flagged: result.flagged };
  }

  console.log('\n' + stats.report());

  // Step 6: Build final entries – Google words + lemma copy
  // First pass: collect base-form translations
  const baseTranslations = {};
  for (const key of googleKeys) {
    const existing = dict[key] || {};
    if (!existing.lemma) {
      baseTranslations[key] = googleProcessed[key].text;
    }
  }
  // Also include function words as potential bases
  for (const key of functionKeys) {
    baseTranslations[key] = FUNCTION_WORDS[key];
  }

  let lemmaCopyCount = 0;
  for (const key of googleKeys) {
    const existing = dict[key] || {};
    let en = googleProcessed[key].text;
    let source = googleProcessed[key].failed ? 'google_failed' : 'google';

    // Lemma copy: if entry has a lemma and the base has a translation, use it
    if (existing.lemma && baseTranslations[existing.lemma]) {
      en = baseTranslations[existing.lemma];
      source = 'lemma_copy';
      lemmaCopyCount++;
    }

    results[key] = {
      en,
      ipa: existing.ipa || '',
      pos: existing.pos || 'n',
      lemma: existing.lemma,
      source,
    };
  }

  console.log(`\nLemma copies: ${lemmaCopyCount}`);

  // Stats
  const sourceBreakdown = {};
  let changedCount = 0;
  for (const key of Object.keys(results)) {
    const src = results[key].source;
    sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
    const oldEn = dict[key] ? dict[key].en : undefined;
    if (oldEn !== results[key].en) changedCount++;
  }

  console.log(`\n--- Source breakdown ---`);
  for (const [src, count] of Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${count}`);
  }
  console.log(`Total entries: ${Object.keys(results).length}`);
  console.log(`Changed: ${changedCount}`);

  // Step 7: Write back to tr.ts
  console.log('\nWriting updated tr.ts...');
  const tsContent = emitDictTs(results);
  fs.writeFileSync(DICT_PATH, tsContent, 'utf8');
  console.log(`  Written to ${DICT_PATH}`);

  // Count entries in written file for verification
  const writtenEntries = (tsContent.match(/^\s+['"]/gm) || []).length;
  console.log(`  Entries in written file: ${writtenEntries}`);

  // Step 8: Print 50 random samples
  console.log('\n\n=== 50 RANDOM SAMPLES ===\n');
  console.log('| # | Word | Old EN | New EN | Source |');
  console.log('|---|------|--------|--------|--------|');

  const allResultKeys = Object.keys(results);
  const shuffled = [...allResultKeys].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, 50);

  sample.forEach((key, i) => {
    const oldEn = dict[key] ? dict[key].en : '(new)';
    const newEn = results[key].en;
    const src = results[key].source;
    console.log(`| ${i + 1} | ${key} | ${oldEn} | ${newEn} | ${src} |`);
  });

  console.log('\nDone!');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
