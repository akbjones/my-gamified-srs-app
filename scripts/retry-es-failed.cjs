#!/usr/bin/env node
/**
 * Retry failed Spanish dictionary entries (those with '?').
 * Translates them via Google and patches es.ts in-place.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.join(__dirname, '..');
const API_KEY = process.env.GOOGLE_TTS_KEY;
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/es.ts');
const BATCH_SIZE = 50;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function googleTranslateBatch(texts) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
  const body = JSON.stringify({ q: texts, source: 'es', target: 'en', format: 'text' });
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error(`${res.statusCode}: ${data.slice(0, 200)}`)); return; }
        try {
          const json = JSON.parse(data);
          resolve(json.data.translations.map(t => t.translatedText));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  let content = fs.readFileSync(DICT_PATH, 'utf8');

  // Find all entries with en: '?'
  const failedWords = [];
  const regex = /^\s*['"]([^'"]+)['"]: \{ en: '\?'/gm;
  let m;
  while ((m = regex.exec(content)) !== null) {
    failedWords.push(m[1]);
  }
  console.log(`Found ${failedWords.length} failed entries to retry`);

  if (failedWords.length === 0) return;

  // Also parse existing entries to get pos and lemma info
  const entryRegex = /^\s*(['"])(.*?)\1:\s*\{([^}]+)\}/gm;
  const existing = {};
  let em;
  while ((em = entryRegex.exec(content)) !== null) {
    const word = em[2];
    const body = em[3];
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    const lemmaMatch = body.match(/lemma:\s*'([^']*)'/);
    existing[word] = { pos: posMatch?.[1] || '', lemma: lemmaMatch?.[1] || '' };
  }

  const stats = new PostProcessStats();
  const results = {};

  for (let i = 0; i < failedWords.length; i += BATCH_SIZE) {
    const batch = failedWords.slice(i, i + BATCH_SIZE);
    process.stdout.write(`  Batch ${Math.floor(i/BATCH_SIZE)+1}: ${batch.length} words...`);
    try {
      const translations = await googleTranslateBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        const word = batch[j];
        const pos = existing[word]?.pos || '';
        const processed = postProcess(translations[j], pos, word, stats);
        results[word] = processed.text;
      }
      process.stdout.write(' done\n');
    } catch (err) {
      console.error(` ERROR: ${err.message}`);
    }
    if (i + BATCH_SIZE < failedWords.length) await sleep(150);
  }

  // Now apply lemma copy for these entries
  // First, collect all translations from the full dict for lemma lookup
  const allTransRegex = /^\s*['"]([^'"]+)['"]: \{ en: '((?:[^'\\]|\\.)*?)'/gm;
  const allTrans = {};
  let atm;
  while ((atm = allTransRegex.exec(content)) !== null) {
    allTrans[atm[1]] = atm[2];
  }

  // Merge new results
  for (const [w, t] of Object.entries(results)) {
    allTrans[w] = t;
  }

  // Lemma copy
  let lemmaCopied = 0;
  for (const word of failedWords) {
    const lemma = existing[word]?.lemma;
    if (lemma && allTrans[lemma] && allTrans[lemma] !== '?') {
      results[word] = allTrans[lemma];
      lemmaCopied++;
    }
  }

  // Patch the file
  let patched = 0;
  for (const [word, translation] of Object.entries(results)) {
    if (!translation || translation === '?') continue;
    const escaped = translation.replace(/'/g, "\\'");
    // Match the entry line and replace en: '?'
    const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(\\s*['"]${safeWord}['"]:\\s*\\{\\s*en:\\s*)'\\?'`);
    if (pattern.test(content)) {
      content = content.replace(pattern, `$1'${escaped}'`);
      patched++;
    }
  }

  fs.writeFileSync(DICT_PATH, content, 'utf8');
  console.log(`\nPatched ${patched} entries (${lemmaCopied} via lemma copy)`);
  console.log(`Remaining '?': ${failedWords.length - patched}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
