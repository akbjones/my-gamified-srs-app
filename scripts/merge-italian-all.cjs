/**
 * merge-italian-all.cjs
 *
 * Merges the base deck + b1b2 + c1c2 into a single deck.json
 * with sequential IDs, deduplication, and proper ordering.
 */
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..', 'src', 'data', 'italian');

// Load all sources
const deck = JSON.parse(fs.readFileSync(path.join(BASE, 'deck.json'), 'utf8'));
const b1b2 = JSON.parse(fs.readFileSync(path.join(BASE, 'b1b2.json'), 'utf8'));
const c1c2 = JSON.parse(fs.readFileSync(path.join(BASE, 'c1c2.json'), 'utf8'));

console.log('Base deck:', deck.length);
console.log('B1-B2 extra:', b1b2.length);
console.log('C1-C2 extra:', c1c2.length);

// Merge: base deck first, then add non-duplicate cards from b1b2 and c1c2
const seen = new Set();
const all = [];

for (const card of deck) {
  const key = card.target.toLowerCase().trim();
  if (seen.has(key)) continue;
  seen.add(key);
  all.push(card);
}
for (const card of [...b1b2, ...c1c2]) {
  const key = card.target.toLowerCase().trim();
  if (seen.has(key)) continue;
  seen.add(key);
  all.push(card);
}

console.log('After dedup:', all.length);

// Sort by grammar node
function nodeOrder(n) {
  const m = n.match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 999;
}
all.sort((a, b) => nodeOrder(a.grammarNode) - nodeOrder(b.grammarNode));

// Re-assign sequential IDs
const final = all.map((card, i) => {
  const out = {
    id: i + 1,
    target: card.target,
    english: card.english,
    audio: `it-${i + 1}.mp3`,
    tags: card.tags || ['general'],
    grammarNode: card.grammarNode,
  };
  if (card.grammar) out.grammar = card.grammar;
  return out;
});

// Stats
const nodeStats = {};
for (const c of final) nodeStats[c.grammarNode] = (nodeStats[c.grammarNode] || 0) + 1;
console.log('\nPer-node distribution:');
Object.entries(nodeStats).sort().forEach(([n, c]) => console.log(`  ${n}: ${c}`));

const tagStats = {};
for (const c of final) for (const t of c.tags) tagStats[t] = (tagStats[t] || 0) + 1;
console.log('\nGoal tags:');
Object.entries(tagStats).sort().forEach(([t, c]) => console.log(`  ${t}: ${c}`));

console.log(`\nTotal: ${final.length}`);

fs.writeFileSync(path.join(BASE, 'deck.json'), JSON.stringify(final, null, 2) + '\n');
console.log('Written to deck.json');
