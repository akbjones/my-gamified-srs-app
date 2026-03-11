/**
 * merge-italian-deck.cjs
 *
 * Merges the three Italian card batches (a1a2.json, b1b2.json, c1c2.json)
 * into a single deck.json with:
 * - Sequential IDs starting from 1
 * - Audio filenames: it-{id}.mp3
 * - Cards ordered by grammar node (node-01 through node-26)
 * - Deduplication by exact target sentence
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'src', 'data', 'italian');
const OUT = path.join(BASE, 'deck.json');

// Load batches (any that exist)
const batches = [];
for (const file of ['a1a2.json', 'b1b2.json', 'c1c2.json']) {
  const p = path.join(BASE, file);
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(`${file}: ${data.length} cards`);
    batches.push(...data);
  } else {
    console.log(`${file}: NOT FOUND (skipping)`);
  }
}

if (batches.length === 0) {
  console.error('No batch files found!');
  process.exit(1);
}

console.log(`\nTotal raw cards: ${batches.length}`);

// ─── Deduplication ────────────────────────────────────────────
const seen = new Set();
const deduped = [];
for (const card of batches) {
  const key = card.target.toLowerCase().trim();
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(card);
}
console.log(`After dedup: ${deduped.length} (removed ${batches.length - deduped.length})`);

// ─── Sort by grammar node ─────────────────────────────────────
const nodeOrder = (n) => {
  const m = n.match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 999;
};
deduped.sort((a, b) => nodeOrder(a.grammarNode) - nodeOrder(b.grammarNode));

// ─── Re-assign sequential IDs ─────────────────────────────────
const deck = deduped.map((card, i) => ({
  id: i + 1,
  target: card.target,
  english: card.english,
  audio: `it-${i + 1}.mp3`,
  tags: card.tags || ['general'],
  ...(card.grammar ? { grammar: card.grammar } : {}),
  grammarNode: card.grammarNode,
}));

// ─── Stats ────────────────────────────────────────────────────
const nodeStats = {};
for (const c of deck) {
  nodeStats[c.grammarNode] = (nodeStats[c.grammarNode] || 0) + 1;
}

console.log('\n=== Per-node distribution ===');
Object.entries(nodeStats).sort().forEach(([node, count]) => {
  console.log(`  ${node}: ${count}`);
});
console.log(`\nTotal: ${deck.length} cards`);

// ─── Tag stats ────────────────────────────────────────────────
const tagStats = {};
for (const c of deck) {
  for (const t of c.tags) {
    tagStats[t] = (tagStats[t] || 0) + 1;
  }
}
console.log('\n=== Goal tags ===');
Object.entries(tagStats).sort().forEach(([tag, count]) => {
  console.log(`  ${tag}: ${count}`);
});

// ─── Write ────────────────────────────────────────────────────
fs.writeFileSync(OUT, JSON.stringify(deck, null, 2) + '\n');
console.log(`\nWrote ${deck.length} cards to ${OUT}`);
