#!/usr/bin/env node
/**
 * quality-audit-it.cjs — Comprehensive quality check on the Italian deck
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log('=== ITALIAN DECK QUALITY AUDIT ===');
console.log('Total cards: ' + deck.length);
console.log('');

// 1. Exact duplicates
const seen = new Map();
const exactDupes = [];
for (const c of deck) {
  const k = c.target.toLowerCase().trim();
  if (seen.has(k)) {
    exactDupes.push({ id: c.id, dupeOf: seen.get(k), target: c.target });
  } else {
    seen.set(k, c.id);
  }
}
console.log('── EXACT DUPLICATES: ' + exactDupes.length + ' ──');
exactDupes.forEach(d => console.log('  ID ' + d.id + ' (dupe of ' + d.dupeOf + '): ' + d.target));
console.log('');

// 2. Near-duplicates
const prefixes = new Map();
const nearDupes = [];
for (const c of deck) {
  const prefix = c.target.toLowerCase().trim().substring(0, 30);
  if (prefixes.has(prefix)) {
    const other = prefixes.get(prefix);
    if (c.target.toLowerCase().trim() !== other.target.toLowerCase().trim()) {
      nearDupes.push([other, c]);
    }
  } else {
    prefixes.set(prefix, c);
  }
}
console.log('── NEAR-DUPLICATES (same first 30 chars): ' + nearDupes.length + ' ──');
nearDupes.slice(0, 20).forEach(pair => {
  console.log('  [' + pair[0].id + '] ' + pair[0].target);
  console.log('  [' + pair[1].id + '] ' + pair[1].target);
  console.log('');
});
if (nearDupes.length > 20) console.log('  ... and ' + (nearDupes.length - 20) + ' more\n');

// 3. Missing fields
console.log('── MISSING FIELDS ──');
console.log('No target: ' + deck.filter(c => !c.target || c.target.trim() === '').length);
console.log('No english: ' + deck.filter(c => !c.english || c.english.trim() === '').length);
console.log('No tags: ' + deck.filter(c => !c.tags || c.tags.length === 0).length);
console.log('No grammarNode: ' + deck.filter(c => !c.grammarNode).length);
console.log('No audio: ' + deck.filter(c => !c.audio).length);
console.log('');

// 4. ID integrity
const ids = deck.map(c => c.id);
const uniqueIds = new Set(ids);
console.log('── ID INTEGRITY ──');
console.log('Unique IDs: ' + uniqueIds.size + '/' + deck.length);
console.log('Sequential: ' + (ids.every((id, i) => id === i + 1) ? 'YES' : 'NO'));
console.log('');

// 5. Tag distribution
console.log('── TAG DISTRIBUTION ──');
const tagCounts = {};
for (const c of deck) {
  for (const t of (c.tags || [])) {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  }
}
Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => {
  console.log('  ' + t + ': ' + n + ' (' + (n / deck.length * 100).toFixed(1) + '%)');
});
console.log('');

// 6. Node distribution
console.log('── NODE DISTRIBUTION ──');
const nodeCounts = {};
for (const c of deck) {
  const n = c.grammarNode || 'none';
  nodeCounts[n] = (nodeCounts[n] || 0) + 1;
}
Object.entries(nodeCounts).sort().forEach(([n, count]) => {
  const bar = '█'.repeat(Math.round(count / 10));
  console.log(`  ${n.padEnd(8)}: ${String(count).padStart(4)} ${bar}`);
});
console.log('');

// 7. Grammar note coverage
const withGrammar = deck.filter(c => c.grammar && c.grammar.trim().length > 0);
console.log('── GRAMMAR NOTES ──');
console.log('Cards with grammar: ' + withGrammar.length + ' (' + (withGrammar.length / deck.length * 100).toFixed(1) + '%)');

// Per-node grammar coverage
console.log('\nPer-node grammar coverage:');
const nodeGrammar = {};
for (const c of deck) {
  const n = c.grammarNode || 'none';
  if (!nodeGrammar[n]) nodeGrammar[n] = { total: 0, withTip: 0 };
  nodeGrammar[n].total++;
  if (c.grammar && c.grammar.trim().length > 0) nodeGrammar[n].withTip++;
}
Object.entries(nodeGrammar).sort().forEach(([n, { total, withTip }]) => {
  const pct = (withTip / total * 100).toFixed(0);
  const status = withTip === 0 ? ' ✗ NONE' : pct < 15 ? ' ⚠ LOW' : '';
  console.log(`  ${n.padEnd(8)}: ${withTip}/${total} (${pct}%)${status}`);
});

const shortGrammar = withGrammar.filter(c => c.grammar.length < 10);
const longGrammar = withGrammar.filter(c => c.grammar.length > 200);
if (shortGrammar.length > 0) {
  console.log('\nVery short grammar (<10 chars): ' + shortGrammar.length);
  shortGrammar.slice(0, 5).forEach(c => console.log('  [' + c.id + '] "' + c.grammar + '"'));
}
if (longGrammar.length > 0) {
  console.log('\nVery long grammar (>200 chars): ' + longGrammar.length);
  longGrammar.slice(0, 5).forEach(c => console.log('  [' + c.id + '] "' + c.grammar.substring(0, 80) + '..."'));
}
console.log('');

// 8. Sentence length distribution
const wordCounts = deck.map(c => c.target.split(/\s+/).length);
wordCounts.sort((a, b) => a - b);
console.log('── SENTENCE LENGTH (words) ──');
console.log('Shortest: ' + wordCounts[0]);
console.log('Longest: ' + wordCounts[wordCounts.length - 1]);
console.log('Median: ' + wordCounts[Math.floor(wordCounts.length / 2)]);
console.log('Mean: ' + (wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length).toFixed(1));
console.log('Over 12 words: ' + wordCounts.filter(w => w > 12).length);
console.log('');

// 9. Vocab diversity
const allWords = new Set();
for (const c of deck) {
  const words = c.target.toLowerCase()
    .replace(/[?!.,;:()""«»—'']/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
  words.forEach(w => allWords.add(w));
}
console.log('── VOCAB DIVERSITY ──');
console.log('Unique Italian words: ' + allWords.size);

for (const goal of ['travel', 'work', 'family']) {
  const goalWords = new Set();
  const goalCards = deck.filter(c => c.tags.includes(goal));
  for (const c of goalCards) {
    const words = c.target.toLowerCase()
      .replace(/[?!.,;:()""«»—'']/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);
    words.forEach(w => goalWords.add(w));
  }
  console.log('  ' + goal + ': ' + goalWords.size + ' unique words across ' + goalCards.length + ' cards');
}
console.log('');

// 10. Italian textbooky patterns
const textbooky = deck.filter(c => {
  const t = c.target.toLowerCase();
  return t.includes('il gatto è sul') ||
    t.includes('la penna è sul tavolo') ||
    t.includes('il libro è sulla') ||
    (t.includes('marco') && t.includes('maria'));
});
console.log('── TEXTBOOKY PATTERNS ──');
console.log('Suspicious: ' + textbooky.length);
textbooky.forEach(c => console.log('  [' + c.id + '] ' + c.target));

// 11. Spanish language comparison metrics
console.log('\n── SPANISH PARITY CHECK ──');
console.log('Target: 3,935 cards, 30.1% grammar tips, ~51% per goal tag');
console.log('Italian: ' + deck.length + ' cards, ' + (withGrammar.length / deck.length * 100).toFixed(1) + '% grammar tips');
const goalPcts = ['travel', 'work', 'family'].map(g => {
  const count = deck.filter(c => c.tags.includes(g)).length;
  return `${g}: ${(count / deck.length * 100).toFixed(1)}%`;
});
console.log('Italian goals: ' + goalPcts.join(', '));
