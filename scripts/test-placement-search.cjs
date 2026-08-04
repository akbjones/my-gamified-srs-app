// Placement test simulation (2026-08-04).
//
// The old test was a linear 0->34 scan that stopped dead at the FIRST node
// scoring badly, so one unlucky card pair capped the whole result — a user with
// decent Spanish skipped 86 of 3,935 cards. This replays the NEW adaptive
// search against real deck data for simulated users of known true level and
// asserts it lands close, in few questions, on every deck without crashing.
//
// Run: node scripts/test-placement-search.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// Mirrors PlacementTest.tsx
const FIRST_PROBE_NODE = 6;
const MAX_PROBES = 8;
const CARDS_PER_NODE = 3;

function nodeVerdict(points) {
  const served = points.length;
  if (served === 0) return { fail: true, wobble: false };
  const total = points.reduce((a, b) => a + b, 0);
  const ratio = total / (3 * served);
  if (ratio < 0.45) return { fail: true, wobble: false };
  if (ratio < 0.60) return { fail: false, wobble: true };
  return { fail: false, wobble: false };
}

/** A simulated user of a given true level rating one card at `node`. */
function rateCard(node, trueLevel) {
  const gap = node - trueLevel;
  // Comfortably below their level -> very easy / knew it; at the boundary it
  // gets noisy; above it they're lost. Noise is what killed the old design.
  let p;
  if (gap <= -3) p = [0.00, 0.05, 0.35, 0.60];
  else if (gap <= -1) p = [0.02, 0.13, 0.50, 0.35];
  else if (gap === 0) p = [0.10, 0.35, 0.40, 0.15];
  else if (gap === 1) p = [0.35, 0.40, 0.20, 0.05];
  else if (gap === 2) p = [0.65, 0.25, 0.09, 0.01];
  else p = [0.90, 0.08, 0.02, 0.00];
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < 4; i++) { acc += p[i]; if (r < acc) return i; }
  return 0;
}

function runSearch(nodeSizes, trueLevel) {
  const nNodes = nodeSizes.length;
  const probeable = [];
  for (let i = 0; i < nNodes; i++) {
    if (Math.min(nodeSizes[i], CARDS_PER_NODE) >= 2) probeable.push(i);
  }
  let lo = 0, hi = nNodes, probes = 1, questions = 0;
  let node = probeable.includes(FIRST_PROBE_NODE)
    ? FIRST_PROBE_NODE
    : (probeable[Math.floor(probeable.length / 2)] ?? 0);
  if (!probeable.length) return { ceiling: 0, questions: 0, probes: 0, crashed: false };

  for (;;) {
    const served = Math.min(nodeSizes[node], CARDS_PER_NODE);
    if (served === 0) return { ceiling: lo, questions, probes, crashed: true };
    const points = Array.from({ length: served }, () => rateCard(node, trueLevel));
    questions += served;
    const v = nodeVerdict(points);
    if (v.fail) hi = Math.min(hi, node);
    else {
      lo = Math.max(lo, node + 1);
      if (v.wobble) hi = Math.min(hi, node + 2);
    }
    const remaining = probeable.filter(i => i >= lo && i < hi);
    if (!remaining.length || probes >= MAX_PROBES) return { ceiling: lo, questions, probes, crashed: false };
    probes++;
    node = remaining[Math.floor(remaining.length / 2)];
  }
}

// ── load a real deck ─────────────────────────────────────────
// MAIN_PATH order, dumped from src/data/topicConfig.ts. Cards carry the node
// id as `grammarNode`; `topic` is a derived field added by buildDeck at runtime.
const MAIN_PATH_IDS = JSON.parse(fs.readFileSync('/tmp/mainpath.json', 'utf8'));

function loadNodeSizes(deckPath, goal) {
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  if (!Array.isArray(deck)) return { sizes: [], total: 0 };
  const filtered = goal === 'general' ? deck : deck.filter(c => (c.tags || []).includes(goal));
  const byNode = new Map();
  for (const c of filtered) byNode.set(c.grammarNode, (byNode.get(c.grammarNode) || 0) + 1);
  return { sizes: MAIN_PATH_IDS.map(id => byNode.get(id) || 0), total: filtered.length };
}

const DECKS = fs.readdirSync(path.join(ROOT, 'src/data'))
  .map(d => path.join(ROOT, 'src/data', d, 'deck.json'))
  .filter(p => fs.existsSync(p));

let failed = 0;
const check = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) failed++; };

// 1. accuracy + length on Spanish (the reported case)
const es = DECKS.find(p => p.includes('/spanish/')) || DECKS[0];
const { sizes, total } = loadNodeSizes(es, 'general');
// cards in nodes strictly BELOW index i (a[i-1], not a[i], is the running total)
const prefix = sizes.reduce((a, n, i) => (a.push((i === 0 ? 0 : a[i - 1]) + n), a), []);
console.log(`deck: ${path.basename(path.dirname(es))} — ${total} cards over ${sizes.length} nodes\n`);
console.log('true level | mean ceiling | mean questions | mean cards skipped');
for (const trueLevel of [0, 5, 12, 15, 20]) {
  const runs = Array.from({ length: 400 }, () => runSearch(sizes, trueLevel));
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const ceil = mean(runs.map(r => r.ceiling));
  const q = mean(runs.map(r => r.questions));
  const skipped = mean(runs.map(r => prefix[r.ceiling - 1] || 0));
  console.log(`  ${String(trueLevel).padStart(2)}       |   ${ceil.toFixed(1).padStart(5)}      |     ${q.toFixed(1).padStart(5)}      |  ${Math.round(skipped)}`);
  check(Math.abs(ceil - trueLevel) <= 2.5, `level ${trueLevel}: mean ceiling ${ceil.toFixed(1)} within 2.5 nodes of truth`);
  check(q <= 24, `level ${trueLevel}: ${q.toFixed(1)} questions asked (<= 24)`);
}
// The reported failure: a mid-level user must skip far more than 86 cards.
const mid = Array.from({ length: 400 }, () => runSearch(sizes, 12));
const midSkip = mid.reduce((a, r) => a + (prefix[r.ceiling - 1] || 0), 0) / mid.length;
console.log('');
check(midSkip > 800, `a level-12 user now skips ~${Math.round(midSkip)} cards (was 86)`);

// 2. no deck/goal combination can crash the search
console.log('\nempty-node crash sweep across every deck x goal:');
let combos = 0, crashes = 0;
for (const d of DECKS) {
  for (const goal of ['general', 'travel', 'work', 'family']) {
    let s;
    try { s = loadNodeSizes(d, goal); } catch { continue; }
    if (!s.total) continue;
    combos++;
    for (let i = 0; i < 40; i++) {
      if (runSearch(s.sizes, Math.floor(Math.random() * 35)).crashed) { crashes++; break; }
    }
  }
}
check(crashes === 0, `${combos} deck x goal combinations, ${crashes} crashed on an empty node`);

console.log(failed ? `\n✗ ${failed} assertion(s) failed` : '\n✓ all assertions passed');
process.exit(failed ? 1 : 0);
