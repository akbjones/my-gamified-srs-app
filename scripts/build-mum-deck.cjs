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

// Deterministic per-node shuffle: FNV-1a + murmur finalizer. The old
// h*31+c hash mapped sequential ids to near-sequential values, so "sorted
// by hash" was secretly "sorted by id" and each node ran personal-block ->
// theme-block -> everyday-block. The avalanche mixes sources properly
// while staying stable across rebuilds.
const hash = s => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
};
// The five-riff reassurance run (DESIGN.md: "stays CONSECUTIVE - it's a
// bit") spans three nodes, so it is pulled out wholesale and re-inserted
// as one block, in its authored escalation order, inside n17 (its majority
// node). The standalone 'not to worry' card (mum-0003) shuffles normally.
const RIFF = ['mum-0111', 'mum-0112', 'mum-0113', 'mum-0114', 'mum-0115'];
const riffCards = RIFF.map(id => cards.find(c => c.mumId === id)).filter(Boolean);
const byNode = new Map();
for (let n = 1; n <= 20; n++) byNode.set(n, []);
for (const c of cards) {
  if (RIFF.includes(c.mumId)) continue;
  const n = parseInt(String(c.node).replace('mum-n', ''), 10);
  if (!byNode.has(n)) { console.error('bad node', c.node, 'on', c.srcId); process.exit(1); }
  byNode.get(n).push(c);
}
const ordered = [];
for (let n = 1; n <= 20; n++) {
  const group = byNode.get(n).sort((a, b) => hash(a.mumId) - hash(b.mumId));
  if (n === 17 && riffCards.length) {
    const anchor = Math.min(group.length, hash('reassurance-riff') % (group.length + 1));
    group.splice(anchor, 0, ...riffCards);
  }
  ordered.push(...group);
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
  // TTS reads the accented short names Béa/Véro as initialisms and spells
  // them out; the unaccented forms say the same thing naturally. Display
  // keeps the accents, only the synthesis text differs.
  if (/Béa|Véro/.test(c.es)) card.ttsText = c.es.replace(/Béa/g, 'Bea').replace(/Véro/g, 'Vero');
  return card;
});

fs.mkdirSync(path.join(ROOT, 'src/data/mum'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/mum/deck.json'), JSON.stringify(out, null, 1));
const withTips = out.filter(c => c.grammar).length;
console.log(`built src/data/mum/deck.json: ${out.length} cards, ${withTips} with tips`);
