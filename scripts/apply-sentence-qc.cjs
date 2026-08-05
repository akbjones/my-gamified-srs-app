#!/usr/bin/env node
// Apply verified sentence replacements for any deck.
// ONLY `target` and `english` change — id, grammarNode, priority, audio filename
// and every learner's SRS state are untouched, so progress survives intact.
// Refuses to write if anything looks unsafe (unknown id, empty text, duplicate
// sentence, or a replacement that collides with another card).
// Usage: node scripts/apply-sentence-qc.cjs [--check] [--max-rank=N] [--deck=hindi] [--dir=docs/hi-quality/overuse-verify]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const check = process.argv.includes('--check');
const maxRankArg = (process.argv.find(a => a.startsWith('--max-rank=')) || '').split('=')[1];
const MAX_RANK = maxRankArg ? parseInt(maxRankArg, 10) : Infinity;

const deckArg = (process.argv.find(a => a.startsWith('--deck=')) || '').split('=')[1] || 'hindi';
const DECK = path.join(ROOT, `src/data/${deckArg}/deck.json`);
const dirArg = (process.argv.find(a => a.startsWith('--dir=')) || '').split('=')[1];
const DIR = path.join(ROOT, dirArg || 'docs/hi-quality/verify');
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));
const byId = new Map(deck.map(c => [String(c.id), c]));
const sorted = [...deck].sort((a, b) => (a.priority ?? 9e9) - (b.priority ?? 9e9));
const rank = new Map(sorted.map((c, i) => [String(c.id), i + 1]));

const reps = new Map();
for (const f of fs.readdirSync(DIR).filter(f => /^out-\d+\.json$/.test(f)))
  for (const e of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
    if (e && e.id && e.target) reps.set(String(e.id), e);

const fails = [];
const gate = (id, cond, why) => { if (!cond) fails.push({ id, why }); };

// sentences that will exist AFTER the swap, to catch collisions
const finalText = new Map();
for (const c of deck) {
  const id = String(c.id);
  const r = reps.get(id);
  const inScope = r && (rank.get(id) ?? 9e9) <= MAX_RANK;
  finalText.set(id, inScope ? r.target.trim() : c.target);
}
// Only fail on collisions this change would INTRODUCE. Duplicates that already
// exist in the deck (both sides unchanged) are a separate pre-existing problem —
// report them, don't block on them.
const isRep = id => reps.has(id) && (rank.get(id) ?? 9e9) <= MAX_RANK;
const seen = new Map();
const preExisting = [];
for (const [id, t] of finalText) {
  const prev = seen.get(t);
  if (prev === undefined) { seen.set(t, id); continue; }
  if (isRep(id) || isRep(prev)) gate(id, false, `replacement duplicates ${prev}`);
  else preExisting.push([prev, id]);
}
if (preExisting.length) {
  console.log(`note: ${preExisting.length} duplicate pairs already in the deck (untouched by this change)`);
}

let applied = 0, skippedRank = 0;
for (const [id, r] of reps) {
  const card = byId.get(id);
  gate(id, !!card, 'unknown card id');
  if (!card) continue;
  if ((rank.get(id) ?? 9e9) > MAX_RANK) { skippedRank++; continue; }
  gate(id, !!r.target && r.target.trim().length > 2, 'empty/short target');
  gate(id, !!r.english && r.english.trim().length > 2, 'empty/short english');
  gate(id, /[ऀ-ॿ]/.test(r.target), 'target has no Devanagari');
  applied++;
}

console.log(`${deckArg}: ${reps.size} verified replacements | ${applied} in scope${MAX_RANK !== Infinity ? ` (rank <= ${MAX_RANK}, ${skippedRank} skipped)` : ''}`);
if (fails.length) {
  console.error(`\n✗ ${fails.length} GATE FAILURES — refusing to write:`);
  for (const f of fails.slice(0, 30)) console.error(`  ${f.id}: ${f.why}`);
  if (fails.length > 30) console.error(`  … and ${fails.length - 30} more`);
  process.exit(1);
}
console.log('✓ all gates green');
if (check) { console.log('(check mode — no write)'); process.exit(0); }

const changed = [];
for (const c of deck) {
  const id = String(c.id);
  const r = reps.get(id);
  if (!r || (rank.get(id) ?? 9e9) > MAX_RANK) continue;
  c.target = r.target.trim();
  c.english = r.english.trim();
  delete c.tokens;                  // stale tokenisation for the old sentence
  changed.push({ id, audio: c.audio });
}
fs.writeFileSync(DECK, JSON.stringify(deck, null, 2) + '\n');
const regenPath = deckArg === 'hindi' ? 'docs/hi-quality/regen-list.json' : `docs/declump/${deckArg}/regen-list.json`;
fs.mkdirSync(path.dirname(path.join(ROOT, regenPath)), { recursive: true });
fs.writeFileSync(path.join(ROOT, regenPath), JSON.stringify(changed, null, 1));
console.log(`wrote ${DECK}`);
console.log(`${changed.length} cards changed → audio regen list at ${regenPath}`);
