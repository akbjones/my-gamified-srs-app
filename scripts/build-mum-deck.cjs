#!/usr/bin/env node
// Compile the mum deck from its four source files into src/data/mum/deck.json
// (QuestCard raw shape: id, target, english, audio, tags, grammarNode, grammar?, priority).
// - ids for T/E/V candidates come from docs/mum-deck/id-map.json (stable across rebuilds)
// - grammarNode mum-nXX -> node-XX (buildDeck only knows MAIN_PATH ids)
// - ordering: node arc n01..n20, sources interleaved deterministically inside each
//   node; the reassurance run (gag "reassurance") stays CONSECUTIVE - it's a bit.
// - tips merged from docs/mum-deck/tips.json ({"mum-NNNN"|"TNNN"|"ENNN"|"VNNN": tip})
//   when that file exists; seed cards may also carry their own grammar field.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const D = p => path.join(ROOT, 'docs/mum-deck', p);

const seed = JSON.parse(fs.readFileSync(D('seed-cards.json'), 'utf8'));
const idMap = JSON.parse(fs.readFileSync(D('id-map.json'), 'utf8'));
const tips = fs.existsSync(D('tips.json')) ? JSON.parse(fs.readFileSync(D('tips.json'), 'utf8')) : {};
const sets = ['theme-skill-candidates.json', 'everyday-candidates.json', 'vocab-candidates.json']
  .map(f => JSON.parse(fs.readFileSync(D(f), 'utf8')).sort((a, b) => a.rid.localeCompare(b.rid)));

// Normalize every card to {srcId, mumId, es, en, node, gag?, grammar?}
const cards = [];
for (const c of seed) cards.push({ srcId: c.id, mumId: c.id, es: c.es, en: c.en, node: c.node, gag: c.gag, grammar: c.grammar || tips[c.id] });
for (const set of sets) for (const c of set) {
  const mumId = idMap[c.rid];
  if (!mumId) { console.error('no id mapping for', c.rid); process.exit(1); }
  cards.push({ srcId: c.rid, mumId, es: c.es, en: c.en, node: c.node, grammar: tips[c.rid] });
}

// Deterministic per-node interleave: stable string hash of the mum id.
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const byNode = new Map();
for (let n = 1; n <= 20; n++) byNode.set(n, []);
for (const c of cards) {
  const n = parseInt(String(c.node).replace('mum-n', ''), 10);
  if (!byNode.has(n)) { console.error('bad node', c.node, 'on', c.srcId); process.exit(1); }
  byNode.get(n).push(c);
}
const ordered = [];
for (let n = 1; n <= 20; n++) {
  const group = byNode.get(n);
  const reassurance = group.filter(c => c.gag === 'reassurance');
  const rest = group.filter(c => c.gag !== 'reassurance').sort((a, b) => hash(a.mumId) - hash(b.mumId));
  if (reassurance.length) {
    // keep the run consecutive at the position of its (hash-ordered) first member
    const anchor = Math.min(rest.length, Math.abs(hash(reassurance[0].mumId)) % (rest.length + 1));
    rest.splice(anchor, 0, ...reassurance);
  }
  ordered.push(...rest);
}

const out = ordered.map((c, i) => {
  const card = {
    id: c.mumId,
    target: c.es,
    english: c.en,
    audio: `${c.mumId}.mp3`,
    tags: ['general'],
    grammarNode: 'node-' + String(c.node).replace('mum-n', ''),
    priority: (i + 1) * 10,
  };
  if (c.grammar) card.grammar = c.grammar;
  return card;
});

fs.mkdirSync(path.join(ROOT, 'src/data/mum'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/mum/deck.json'), JSON.stringify(out, null, 1));
const withTips = out.filter(c => c.grammar).length;
console.log(`built src/data/mum/deck.json: ${out.length} cards, ${withTips} with tips`);
