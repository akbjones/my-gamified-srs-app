#!/usr/bin/env node
/**
 * expand-dictionary.cjs
 *
 * Analyzes a language's deck to find words missing from its dictionary,
 * then generates stub entries that can be reviewed and filled in.
 *
 * Usage: node scripts/expand-dictionary.cjs --lang=de
 *
 * Output: A report showing missing words and optionally writes stubs.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const lang = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const writeStubs = args.includes('--write');

if (!lang) {
  console.error('Usage: node scripts/expand-dictionary.cjs --lang=CODE [--write]');
  console.error('Codes: es, it, fr, pt, de, nl, sv, cy, hi, tr, ru');
  process.exit(1);
}

const LANG_MAP = {
  es: 'spanish', it: 'italian', fr: 'french', pt: 'portuguese',
  de: 'german', nl: 'dutch', sv: 'swedish', cy: 'welsh',
  hi: 'hindi', tr: 'turkish', ru: 'russian',
};

const langDir = LANG_MAP[lang];
if (!langDir) {
  console.error(`Unknown language code: ${lang}`);
  process.exit(1);
}

const BASE = path.join(__dirname, '..', 'src', 'data');
const deckPath = path.join(BASE, langDir, 'deck.json');
const dictPath = path.join(BASE, 'dictionary', `${lang}.ts`);

// Load deck
if (!fs.existsSync(deckPath)) {
  console.error(`Deck not found: ${deckPath}`);
  process.exit(1);
}
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
console.log(`Loaded ${deck.length} cards from ${langDir} deck`);

// Extract all words from deck
const deckWords = new Map(); // word → count
for (const card of deck) {
  const sentence = card.target || '';
  const words = sentence.split(/\s+/).filter(Boolean);
  for (const w of words) {
    const clean = w.replace(/[.,!?;:"""''()—–\-…¿¡«»\[\]{}]/g, '').trim().toLowerCase();
    if (clean && clean.length > 0) {
      deckWords.set(clean, (deckWords.get(clean) || 0) + 1);
    }
  }
}
console.log(`Found ${deckWords.size} unique words in deck`);

// Load dictionary and extract known words
if (!fs.existsSync(dictPath)) {
  console.error(`Dictionary not found: ${dictPath}`);
  process.exit(1);
}
const dictContent = fs.readFileSync(dictPath, 'utf8');

// Extract dictionary keys (bare keys, 'word', and "word" patterns)
const dictKeys = new Set();
// Match: word: { en: OR 'word': { en: OR "word": { en:
const keyPattern = /(?:^|\n)\s*(?:['"]([^'"]+)['"]|(\w[\w\u00C0-\u024F\u0400-\u04FF\u0900-\u097F]*)):\s*\{\s*en:/g;
let match;
while ((match = keyPattern.exec(dictContent)) !== null) {
  const key = (match[1] || match[2] || '').toLowerCase();
  if (key) dictKeys.add(key);
}
console.log(`Dictionary has ${dictKeys.size} entries`);

// Find missing words (in deck but not in dictionary)
const missing = [];
for (const [word, count] of deckWords) {
  if (!dictKeys.has(word)) {
    missing.push({ word, count });
  }
}

// Sort by frequency (most common first)
missing.sort((a, b) => b.count - a.count);

const coverage = ((deckWords.size - missing.length) / deckWords.size * 100).toFixed(1);
console.log(`\nDictionary coverage: ${coverage}% (${deckWords.size - missing.length}/${deckWords.size})`);
console.log(`Missing words: ${missing.length}`);

if (missing.length > 0) {
  console.log(`\nTop 50 most frequent missing words:`);
  for (const { word, count } of missing.slice(0, 50)) {
    console.log(`  ${count}x  ${word}`);
  }

  if (missing.length > 50) {
    console.log(`  ... and ${missing.length - 50} more`);
  }

  // Categorize missing words by frequency
  const freq5plus = missing.filter(m => m.count >= 5);
  const freq2to4 = missing.filter(m => m.count >= 2 && m.count <= 4);
  const freq1 = missing.filter(m => m.count === 1);

  console.log(`\nFrequency breakdown of missing words:`);
  console.log(`  5+ occurrences: ${freq5plus.length} words (HIGH priority)`);
  console.log(`  2-4 occurrences: ${freq2to4.length} words (MEDIUM priority)`);
  console.log(`  1 occurrence: ${freq1.length} words (LOW priority)`);
}

// Summary
console.log(`\n${'═'.repeat(60)}`);
console.log(`  ${langDir.toUpperCase()} DICTIONARY ANALYSIS`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Deck words:      ${deckWords.size}`);
console.log(`  Dict entries:    ${dictKeys.size}`);
console.log(`  Coverage:        ${coverage}%`);
console.log(`  Missing:         ${missing.length}`);
console.log(`  Target:          ≥99% coverage`);
console.log(`${'═'.repeat(60)}`);
