#!/usr/bin/env node
/**
 * Audit dictionary lookup coverage — for each language, tokenize all deck
 * sentences and check what % of tokens resolve via lookupWord().
 *
 * Usage: node scripts/audit-lookup-coverage.cjs [lang-code|all]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const LANGS = {
  es: { deckDir: 'spanish', name: 'Spanish' },
  it: { deckDir: 'italian', name: 'Italian' },
  fr: { deckDir: 'french', name: 'French' },
  pt: { deckDir: 'portuguese', name: 'Portuguese' },
  de: { deckDir: 'german', name: 'German' },
  nl: { deckDir: 'dutch', name: 'Dutch' },
  sv: { deckDir: 'swedish', name: 'Swedish' },
  cy: { deckDir: 'welsh', name: 'Welsh' },
  hi: { deckDir: 'hindi', name: 'Hindi' },
  tr: { deckDir: 'turkish', name: 'Turkish' },
  ru: { deckDir: 'russian', name: 'Russian' },
};

// We need to use tsx to import TypeScript modules
// Instead, let's parse the .ts files directly

function parseDictionary(langCode) {
  const dictPath = path.join(ROOT, 'src', 'data', 'dictionary', `${langCode}.ts`);
  const content = fs.readFileSync(dictPath, 'utf8');

  const dict = new Map();
  // Match entries like: 'word': { en: '...', ipa: '...', pos: '...' },
  const re = /^\s*'([^'\\]*(?:\\.[^'\\]*)*)'\s*:\s*\{[^}]*en:\s*'([^']*)'/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    dict.set(m[1].replace(/\\'/g, "'"), m[2]);
  }
  return dict;
}

function auditLang(langCode) {
  const info = LANGS[langCode];
  const deckPath = path.join(ROOT, 'src', 'data', info.deckDir, 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const dict = parseDictionary(langCode);

  const allTokens = new Set();
  const missingTokens = new Set();

  for (const card of deck) {
    const tokens = card.target
      .replace(/[.,!?;:"""\u2018\u2019()—–«»\u0964\u0965/\[\]{}]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    for (const t of tokens) {
      allTokens.add(t);
      if (!dict.has(t)) {
        missingTokens.add(t);
      }
    }
  }

  const found = allTokens.size - missingTokens.size;
  const pct = ((found / allTokens.size) * 100).toFixed(1);

  console.log(`${langCode.toUpperCase()} (${info.name}): ${found}/${allTokens.size} = ${pct}% | Missing: ${missingTokens.size}`);

  if (missingTokens.size > 0 && missingTokens.size <= 30) {
    console.log(`  Missing: ${[...missingTokens].slice(0, 30).join(', ')}`);
  } else if (missingTokens.size > 30) {
    console.log(`  Sample missing: ${[...missingTokens].slice(0, 20).join(', ')}...`);
  }

  return { langCode, total: allTokens.size, found, missing: missingTokens.size, pct: parseFloat(pct) };
}

const args = process.argv.slice(2);
const langs = (!args.length || args[0] === 'all') ? Object.keys(LANGS) : [args[0]];

console.log('Dictionary Lookup Coverage Audit\n');
const results = [];
for (const lang of langs) {
  if (!LANGS[lang]) { console.error(`Unknown: ${lang}`); continue; }
  results.push(auditLang(lang));
}

if (results.length > 1) {
  console.log('\n--- Summary ---');
  results.sort((a, b) => a.pct - b.pct);
  for (const r of results) {
    console.log(`  ${r.langCode.toUpperCase()}: ${r.pct}% (${r.missing} missing)`);
  }
}
