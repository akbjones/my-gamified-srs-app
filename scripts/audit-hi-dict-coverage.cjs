#!/usr/bin/env node
/**
 * Hindi dictionary coverage audit.
 * For every card in deck.json, tokenize the Devanagari target sentence
 * by whitespace + punctuation, then check each token against the dict.
 * Report missing tokens with their card IDs.
 */
const fs = require('fs');
const path = require('path');

const DECK = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'src', 'data', 'hindi', 'deck.json'), 'utf8'));

// Parse hi.ts dict keys via regex (avoids ts-node import overhead)
const DICT_SRC = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'data', 'dictionary', 'hi.ts'), 'utf8');
const DICT_KEYS = new Set();
for (const m of DICT_SRC.matchAll(/^\s*'([^']+)':\s*\{/gm)) DICT_KEYS.add(m[1]);
for (const m of DICT_SRC.matchAll(/^\s*"([^"]+)":\s*\{/gm)) DICT_KEYS.add(m[1]);

console.log(`Loaded ${DECK.length} cards, ${DICT_KEYS.size} dict keys`);

const PUNCT = /[।!?,.;:'"()\-–—…\d०-९]/g;
const ZWJ = /[‌‍]/g;
function tokenize(text) {
  return text.replace(PUNCT, ' ').replace(ZWJ, '').split(/\s+/).filter(Boolean);
}

// Whitelist English-in-Devanagari + proper nouns we'd never put in dict
const COMMON_OK = new Set([
  // English borrowings in Devanagari that we accept w/o dict entry
]);

const missingByToken = new Map();   // token → Set(cardIds)
const cardsWithIssues = new Set();
let totalTokens = 0, missingTokens = 0;

for (const card of DECK) {
  for (const tok of tokenize(card.target)) {
    totalTokens++;
    if (DICT_KEYS.has(tok) || COMMON_OK.has(tok)) continue;
    missingTokens++;
    if (!missingByToken.has(tok)) missingByToken.set(tok, new Set());
    missingByToken.get(tok).add(card.id);
    cardsWithIssues.add(card.id);
  }
}

const ranked = [...missingByToken.entries()].sort((a, b) => b[1].size - a[1].size);
console.log(`\nCoverage: ${(100 * (1 - missingTokens / totalTokens)).toFixed(2)}%`);
console.log(`Tokens missing: ${missingTokens} / ${totalTokens}`);
console.log(`Unique missing: ${ranked.length}`);
console.log(`Cards with ≥1 missing: ${cardsWithIssues.size} / ${DECK.length}\n`);

console.log('Top 80 missing tokens by card count:');
for (const [tok, ids] of ranked.slice(0, 80)) {
  console.log(`  ${ids.size.toString().padStart(4)}  ${tok}`);
}

fs.writeFileSync('/tmp/hi-dict-missing.json', JSON.stringify({
  totalTokens, missingTokens,
  cardsWithIssues: cardsWithIssues.size,
  coveragePct: 100 * (1 - missingTokens / totalTokens),
  uniqueMissing: ranked.length,
  ranked: ranked.map(([tok, ids]) => ({
    token: tok, count: ids.size, sampleCards: [...ids].slice(0, 5),
  })),
}, null, 2));
console.log('\nFull report → /tmp/hi-dict-missing.json');
