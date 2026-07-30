#!/usr/bin/env node
// Re-rank deck priorities from usefulness scores (docs/ordering/<lang>/score-*.json).
// WITHIN each grammar node, cards are reordered by (score desc, current rank asc)
// and reassigned that node's existing multiset of priority values — so node
// progression, ids, audio and SRS state are untouched; only the order in which
// a node's cards are introduced changes. Cards without a score keep their
// relative position at the tail of the reorder (scored-early bands for tr/cy).
// Usage: node scripts/apply-ordering.cjs --lang=hindi [--check]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const lang = (process.argv.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const check = process.argv.includes('--check');
if (!lang) { console.error('use --lang=hindi|turkish|welsh'); process.exit(1); }

const DECK_PATH = path.join(ROOT, `src/data/${lang}/deck.json`);
const DIR = path.join(ROOT, `docs/ordering/${lang}`);
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const score = new Map();
for (const f of fs.readdirSync(DIR).filter(f => /^score-\d+\.json$/.test(f)))
  for (const e of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
    if (e && e.id && typeof e.score === 'number') score.set(String(e.id), e.score);
if (!score.size) { console.error('no scores found in', DIR); process.exit(1); }

// current global rank for stable tiebreaks
const sorted = [...deck].sort((a, b) => (a.priority ?? 9e9) - (b.priority ?? 9e9));
const rank = new Map(sorted.map((c, i) => [String(c.id), i]));

const byNode = new Map();
for (const c of deck) {
  const n = c.grammarNode || 'node-00';
  if (!byNode.has(n)) byNode.set(n, []);
  byNode.get(n).push(c);
}

let moved = 0, scoredCards = 0;
for (const cards of byNode.values()) {
  // Only reorder among the node's SCORED cards; unscored keep their exact slots.
  const scored = cards.filter(c => score.has(String(c.id)));
  if (scored.length < 2) continue;
  scoredCards += scored.length;
  const slots = scored.map(c => c.priority).sort((a, b) => a - b);
  // Within a score bucket, order by a stable id hash instead of authored
  // adjacency — otherwise same-template cards (four comparatives, twin
  // "Hey Ajay / Hey Akash" cards) land in consecutive slots and a band
  // reads like a drill sheet. The hash disperses them deterministically.
  const hash = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const reordered = [...scored].sort((a, b) => {
    const d = (score.get(String(b.id)) ?? 3) - (score.get(String(a.id)) ?? 3);
    return d !== 0 ? d : (hash(String(a.id)) - hash(String(b.id)));
  });
  reordered.forEach((c, i) => { if (c.priority !== slots[i]) moved++; c.priority = slots[i]; });
}
console.log(`${lang}: ${score.size} scores | ${scoredCards} cards eligible | ${moved} priorities changed`);

// preview: new first-30 study order
const after = [...deck].sort((a, b) => (a.priority ?? 9e9) - (b.priority ?? 9e9));
console.log('\nnew top 30:');
for (const c of after.slice(0, 30)) console.log(' ', String(c.priority).padStart(4), c.grammarNode, '|', c.english);

if (check) { console.log('\n(check mode — no write)'); process.exit(0); }
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('\nwrote', DECK_PATH);
