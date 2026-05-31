#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.join(__dirname, '..');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/es.ts');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translateOne(text) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
  const body = JSON.stringify({ q: [text], source: 'es', target: 'en', format: 'text' });
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
          resolve(json.data.translations[0].translatedText);
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
  const failedWords = [];
  const regex = /^\s*['"]([^'"]+)['"]: \{ en: '\?'/gm;
  let m;
  while ((m = regex.exec(content)) !== null) failedWords.push(m[1]);
  console.log(`${failedWords.length} entries to retry one-by-one`);

  // Parse existing for pos/lemma
  const entryRegex = /^\s*(['"])(.*?)\1:\s*\{([^}]+)\}/gm;
  const existing = {};
  let em;
  while ((em = entryRegex.exec(content)) !== null) {
    const body = em[3];
    existing[em[2]] = {
      pos: body.match(/pos:\s*'([^']*)'/)?.[1] || '',
      lemma: body.match(/lemma:\s*'([^']*)'/)?.[1] || '',
    };
  }

  // Get all translations for lemma lookup
  const allTransRegex = /^\s*['"]([^'"]+)['"]: \{ en: '((?:[^'\\]|\\.)*?)'/gm;
  const allTrans = {};
  let atm;
  while ((atm = allTransRegex.exec(content)) !== null) allTrans[atm[1]] = atm[2];

  const stats = new PostProcessStats();
  const results = {};

  for (const word of failedWords) {
    process.stdout.write(`  ${word}...`);
    try {
      const raw = await translateOne(word);
      const pos = existing[word]?.pos || '';
      const processed = postProcess(raw, pos, word, stats);
      results[word] = processed.text;
      allTrans[word] = processed.text;
      process.stdout.write(` "${processed.text}"\n`);
    } catch (err) {
      console.error(` ERROR: ${err.message}`);
    }
    await sleep(80);
  }

  // Lemma copy
  for (const word of failedWords) {
    const lemma = existing[word]?.lemma;
    if (lemma && allTrans[lemma] && allTrans[lemma] !== '?') {
      results[word] = allTrans[lemma];
    }
  }

  // Patch
  let patched = 0;
  for (const [word, translation] of Object.entries(results)) {
    if (!translation || translation === '?') continue;
    const escaped = translation.replace(/'/g, "\\'");
    const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(\\s*['"]${safeWord}['"]:\\s*\\{\\s*en:\\s*)'\\?'`);
    if (pattern.test(content)) {
      content = content.replace(pattern, `$1'${escaped}'`);
      patched++;
    }
  }

  fs.writeFileSync(DICT_PATH, content, 'utf8');
  console.log(`\nPatched ${patched}/${failedWords.length}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
