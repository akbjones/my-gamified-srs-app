/**
 * quality-audit.cjs — Comprehensive quality check on the full deck
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log('=== DECK QUALITY AUDIT ===');
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

// 2. Near-duplicates (same first 30 chars but different full text)
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
console.log('');

// 4. ID integrity
const ids = deck.map(c => c.id);
const uniqueIds = new Set(ids);
console.log('── ID INTEGRITY ──');
console.log('Unique IDs: ' + uniqueIds.size + '/' + deck.length);
if (uniqueIds.size < deck.length) {
  const idCount = {};
  ids.forEach(id => { idCount[id] = (idCount[id] || 0) + 1; });
  const dupeIds = Object.entries(idCount).filter(([, count]) => count > 1);
  console.log('Duplicate IDs: ' + dupeIds.map(([id, n]) => id + ' (x' + n + ')').join(', '));
}
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

// 6. Grammar note coverage
const withGrammar = deck.filter(c => c.grammar && c.grammar.trim().length > 0);
console.log('── GRAMMAR NOTES ──');
console.log('Cards with grammar: ' + withGrammar.length + ' (' + (withGrammar.length / deck.length * 100).toFixed(1) + '%)');

// Check grammar note quality - too short or too long
const shortGrammar = withGrammar.filter(c => c.grammar.length < 10);
const longGrammar = withGrammar.filter(c => c.grammar.length > 200);
if (shortGrammar.length > 0) {
  console.log('Very short grammar (<10 chars): ' + shortGrammar.length);
  shortGrammar.slice(0, 5).forEach(c => console.log('  [' + c.id + '] "' + c.grammar + '"'));
}
if (longGrammar.length > 0) {
  console.log('Very long grammar (>200 chars): ' + longGrammar.length);
  longGrammar.slice(0, 5).forEach(c => console.log('  [' + c.id + '] "' + c.grammar.substring(0, 80) + '..."'));
}
console.log('');

// 7. Sentence length distribution
const lengths = deck.map(c => c.target.length);
lengths.sort((a, b) => a - b);
console.log('── SENTENCE LENGTH ──');
console.log('Shortest: ' + lengths[0] + ' chars');
console.log('Longest: ' + lengths[lengths.length - 1] + ' chars');
console.log('Median: ' + lengths[Math.floor(lengths.length / 2)] + ' chars');
console.log('Mean: ' + Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) + ' chars');

// Very short sentences (might be fragments)
const veryShort = deck.filter(c => c.target.length < 5);
if (veryShort.length > 0) {
  console.log('Very short (<5 chars): ' + veryShort.length);
  veryShort.forEach(c => console.log('  [' + c.id + '] "' + c.target + '"'));
}
console.log('');

// 8. Vocab diversity - count unique words
const allWords = new Set();
for (const c of deck) {
  const words = c.target.toLowerCase()
    .replace(/[¿?¡!.,;:()""—]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
  words.forEach(w => allWords.add(w));
}
console.log('── VOCAB DIVERSITY ──');
console.log('Unique Spanish words: ' + allWords.size);

// 9. Per-goal vocab diversity
for (const goal of ['travel', 'work', 'family']) {
  const goalWords = new Set();
  const goalCards = deck.filter(c => c.tags.includes(goal));
  for (const c of goalCards) {
    const words = c.target.toLowerCase()
      .replace(/[¿?¡!.,;:()""—]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);
    words.forEach(w => goalWords.add(w));
  }
  console.log('  ' + goal + ': ' + goalWords.size + ' unique words across ' + goalCards.length + ' cards');
}
console.log('');

// 10. Check for textbooky patterns
const textbooky = deck.filter(c => {
  const t = c.target.toLowerCase();
  return t.includes('el gato está en') ||
    t.includes('la mesa es') ||
    t.includes('el libro está en la mesa') ||
    t.includes('the boy is') ||
    (t.includes('juan') && t.includes('maria') && t.includes('son'));
});
console.log('── TEXTBOOKY PATTERNS ──');
console.log('Suspicious: ' + textbooky.length);
textbooky.forEach(c => console.log('  [' + c.id + '] ' + c.target));
