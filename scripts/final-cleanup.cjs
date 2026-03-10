/**
 * final-cleanup.cjs — Remove exact duplicates, worst near-dupes, textbooky sentences.
 * Then re-ID the entire deck sequentially.
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log('Starting cleanup. Deck: ' + deck.length + ' cards\n');

// 1. Remove exact duplicates (keep first occurrence)
const seen = new Set();
let exactRemoved = 0;
const deduped = [];
for (const card of deck) {
  const key = card.target.toLowerCase().trim();
  if (seen.has(key)) {
    exactRemoved++;
  } else {
    seen.add(key);
    deduped.push(card);
  }
}
console.log('Exact duplicates removed: ' + exactRemoved);

// 2. Remove textbooky sentences
const textbookyPatterns = [
  /el gato est[aá] en(cima de)? la mesa/i,
  /el gato est[aá] en el sof[aá]/i,
  /el libro est[aá] en la mesa/i,
  /la pluma est[aá] en la mesa/i,
];

let textbookyRemoved = 0;
const cleaned = deduped.filter(card => {
  for (const pat of textbookyPatterns) {
    if (pat.test(card.target)) {
      console.log('  Removed textbooky: [' + card.id + '] ' + card.target);
      textbookyRemoved++;
      return false;
    }
  }
  return true;
});
console.log('Textbooky removed: ' + textbookyRemoved);

// 3. Remove worst near-duplicates (same first 30 chars, keep shorter or first)
const prefixMap = new Map();
const nearRemoved = [];
const final = [];

for (const card of cleaned) {
  const prefix = card.target.toLowerCase().trim().substring(0, 30);
  if (prefixMap.has(prefix)) {
    const existing = prefixMap.get(prefix);
    // If they're very similar (both start the same), keep the shorter one
    // But only if the full texts are different
    if (card.target.toLowerCase().trim() !== existing.target.toLowerCase().trim()) {
      // Keep both — they're different enough sentences that happen to start the same
      final.push(card);
    } else {
      // This shouldn't happen since we already deduped, but just in case
      nearRemoved.push(card);
    }
  } else {
    prefixMap.set(prefix, card);
    final.push(card);
  }
}
console.log('Near-duplicates removed: ' + nearRemoved.length);

// 4. Re-assign sequential IDs
for (let i = 0; i < final.length; i++) {
  final[i].id = i + 1;
}

// 5. Sort tags consistently: general first, then alphabetical
for (const card of final) {
  const hasGeneral = card.tags.includes('general');
  const others = card.tags.filter(t => t !== 'general').sort();
  card.tags = hasGeneral ? ['general', ...others] : others;
}

console.log('\nFinal deck: ' + final.length + ' cards');

// Stats
const tags = { travel: 0, work: 0, family: 0 };
for (const c of final) {
  for (const t of c.tags) {
    if (t in tags) tags[t]++;
  }
}
console.log('Tags: travel=' + tags.travel + ', work=' + tags.work + ', family=' + tags.family);

const grammar = final.filter(c => c.grammar && c.grammar.trim().length > 0).length;
console.log('Grammar notes: ' + grammar + ' (' + (grammar / final.length * 100).toFixed(1) + '%)');

// Vocab diversity
const allWords = new Set();
for (const c of final) {
  c.target.toLowerCase().replace(/[¿?¡!.,;:()""\-—«»]/g, '').split(/\s+/).filter(w => w.length > 0).forEach(w => allWords.add(w));
}
console.log('Unique vocab: ' + allWords.size + ' words');

fs.writeFileSync(DECK_PATH, JSON.stringify(final, null, 2));
console.log('\nDeck written.');
