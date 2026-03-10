/**
 * rebalance-tags.cjs
 *
 * Rebalance goal tags so that each goal (travel/work/family) yields ~2000+ cards.
 *
 * Strategy:
 *   A1 (nodes 1-5):   ~80% of cards get each tag  → foundational vocab is universal
 *   A2 (nodes 6-10):  ~65% of cards get each tag  → still broad but starting to lean
 *   B1 (nodes 11-15): ~45% of cards get each tag  → noticeable specialization
 *   B2 (nodes 16-20): ~35% of cards get each tag  → strongest differentiation
 *
 * Cards that already have a specific tag keep it. We only ADD tags to cards that
 * are under the target. Priority: cards with fewer specific tags get new ones first
 * (so existing specialized cards stay specialized).
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

const PER_NODE = 250;
const GOALS = ['travel', 'work', 'family'];

// Target percentage of cards that should have each tag, by CEFR band
const TARGET_PCT = {
  A1: 0.80,  // nodes 1-5
  A2: 0.65,  // nodes 6-10
  B1: 0.45,  // nodes 11-15
  B2: 0.35,  // nodes 16-20
};

function getBand(nodeNum) {
  if (nodeNum <= 5) return 'A1';
  if (nodeNum <= 10) return 'A2';
  if (nodeNum <= 15) return 'B1';
  return 'B2';
}

// Shuffle array in place (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

console.log('=== BEFORE REBALANCE ===');
for (const goal of GOALS) {
  const count = deck.filter(c => (c.tags || []).includes(goal)).length;
  console.log(`  ${goal}: ${count} (${(count / deck.length * 100).toFixed(1)}%)`);
}
console.log('');

let totalAdded = { travel: 0, work: 0, family: 0 };

for (let nodeIdx = 0; nodeIdx < 20; nodeIdx++) {
  const nodeNum = nodeIdx + 1;
  const band = getBand(nodeNum);
  const targetPct = TARGET_PCT[band];
  const start = nodeIdx * PER_NODE;
  const nodeCards = deck.slice(start, start + PER_NODE);
  const targetCount = Math.round(nodeCards.length * targetPct);

  for (const goal of GOALS) {
    // Count how many already have this tag
    const withTag = nodeCards.filter(c => (c.tags || []).includes(goal));
    const need = targetCount - withTag.length;

    if (need <= 0) continue; // already at or above target

    // Get candidates: cards in this node that DON'T have this tag
    const candidates = nodeCards.filter(c => !(c.tags || []).includes(goal));

    // Sort candidates: prefer cards with fewer specific tags (more "general-only" cards first)
    // This preserves the identity of already-specialized cards
    candidates.sort((a, b) => {
      const aSpecific = (a.tags || []).filter(t => t !== 'general').length;
      const bSpecific = (b.tags || []).filter(t => t !== 'general').length;
      return aSpecific - bSpecific;
    });

    // Shuffle within same-priority groups to avoid bias
    let i = 0;
    while (i < candidates.length) {
      const currentSpecific = (candidates[i].tags || []).filter(t => t !== 'general').length;
      let j = i;
      while (j < candidates.length && (candidates[j].tags || []).filter(t => t !== 'general').length === currentSpecific) {
        j++;
      }
      // Shuffle the group [i, j)
      const group = candidates.slice(i, j);
      shuffle(group);
      for (let k = 0; k < group.length; k++) {
        candidates[i + k] = group[k];
      }
      i = j;
    }

    // Add the tag to the first `need` candidates
    const toTag = candidates.slice(0, need);
    for (const card of toTag) {
      // Find this card in the actual deck array and add the tag
      const deckCard = deck.find(c => c.id === card.id);
      if (deckCard) {
        if (!deckCard.tags.includes(goal)) {
          deckCard.tags.push(goal);
          totalAdded[goal]++;
        }
      }
    }
  }
}

// Sort tags consistently for every card: general first, then alphabetical
for (const card of deck) {
  const general = card.tags.includes('general');
  const others = card.tags.filter(t => t !== 'general').sort();
  card.tags = general ? ['general', ...others] : others;
}

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));

console.log('Tags added:');
for (const goal of GOALS) {
  console.log(`  ${goal}: +${totalAdded[goal]}`);
}
console.log('');

console.log('=== AFTER REBALANCE ===');
for (const goal of GOALS) {
  const count = deck.filter(c => (c.tags || []).includes(goal)).length;
  console.log(`  ${goal}: ${count} (${(count / deck.length * 100).toFixed(1)}%)`);
}
console.log('');

// Per-node breakdown
console.log('Per-node breakdown:');
console.log('Node | Band | Travel | Work | Family | Target');
console.log('-----|------|--------|------|--------|-------');
for (let n = 0; n < 20; n++) {
  const nodeNum = n + 1;
  const band = getBand(nodeNum);
  const start = n * PER_NODE;
  const nodeCards = deck.slice(start, start + PER_NODE);
  const t = nodeCards.filter(c => c.tags.includes('travel')).length;
  const w = nodeCards.filter(c => c.tags.includes('work')).length;
  const f = nodeCards.filter(c => c.tags.includes('family')).length;
  const target = Math.round(PER_NODE * TARGET_PCT[band]);
  console.log(`  ${String(nodeNum).padStart(2)} |  ${band}  |   ${String(t).padStart(3)}  | ${String(w).padStart(3)}  |   ${String(f).padStart(3)}  |  ${target}`);
}
