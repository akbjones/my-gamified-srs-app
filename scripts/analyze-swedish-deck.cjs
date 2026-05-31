const fs = require('fs');
const path = require('path');

const deckPath = path.join(__dirname, '..', 'src', 'data', 'swedish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

console.log(`Total cards: ${deck.length}`);

// Count words in target
function wordCount(s) {
  return s.replace(/[!?.,"]+/g, '').trim().split(/\s+/).filter(w => w.length > 0).length;
}

// Find short sentences by node
const shortByNode = {};
const allByNode = {};
let totalWords = 0;
let shortCount = 0;

for (const card of deck) {
  const wc = wordCount(card.target);
  totalWords += wc;
  const node = card.grammarNode;
  if (!allByNode[node]) allByNode[node] = 0;
  allByNode[node]++;

  if (wc <= 3) {
    shortCount++;
    if (!shortByNode[node]) shortByNode[node] = [];
    shortByNode[node].push({ id: card.id, target: card.target, wc });
  }
}

console.log(`\nAverage words per sentence: ${(totalWords / deck.length).toFixed(1)}`);
console.log(`Short sentences (<=3 words): ${shortCount}`);

console.log(`\nShort sentences by node:`);
const sortedNodes = Object.keys(shortByNode).sort((a, b) => {
  const na = parseInt(a.replace('node-', ''));
  const nb = parseInt(b.replace('node-', ''));
  return na - nb;
});

for (const node of sortedNodes) {
  console.log(`  ${node}: ${shortByNode[node].length} short / ${allByNode[node]} total`);
}

// Find duplicates
const seen = {};
const dupes = [];
for (const card of deck) {
  const key = card.target.toLowerCase().trim();
  if (seen[key]) {
    dupes.push({ id: card.id, target: card.target, node: card.grammarNode, firstId: seen[key].id });
  } else {
    seen[key] = card;
  }
}

console.log(`\nDuplicates: ${dupes.length}`);
for (const d of dupes) {
  console.log(`  id=${d.id} "${d.target}" (${d.node}) - dupe of id=${d.firstId}`);
}

// Show some examples of short sentences per node
console.log(`\n--- Sample short sentences per node ---`);
for (const node of sortedNodes) {
  console.log(`\n${node} (${shortByNode[node].length} short):`);
  for (const s of shortByNode[node].slice(0, 5)) {
    console.log(`  [${s.wc}w] "${s.target}"`);
  }
  if (shortByNode[node].length > 5) {
    console.log(`  ... and ${shortByNode[node].length - 5} more`);
  }
}

// Count unique words
const allWords = new Set();
for (const card of deck) {
  const words = card.target.toLowerCase().replace(/[!?.,"]+/g, '').trim().split(/\s+/).filter(w => w.length > 0);
  words.forEach(w => allWords.add(w));
}
console.log(`\nUnique words: ${allWords.size}`);
