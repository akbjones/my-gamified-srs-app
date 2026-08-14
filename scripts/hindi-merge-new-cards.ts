// Merge spec-authored cards into the Hindi deck and place them by what they
// teach, not by when they were written. Also applies the movable repositions
// and retires dead weight. Priority is a computed property here - that is the
// whole point of the curriculum engine.
//
// Run: npx tsx scripts/hindi-merge-new-cards.ts [--dry]
import fs from 'fs';

const DRY = process.argv.includes('--dry');
const deck = JSON.parse(fs.readFileSync('src/data/hindi/deck.json', 'utf8'));
const syllabus = JSON.parse(fs.readFileSync('docs/hindi/syllabus.json', 'utf8')).items;
const plan = JSON.parse(fs.readFileSync('docs/hindi/schedule-plan.json', 'utf8'));
const tierOf = new Map<string, number>(syllabus.map((t: any) => [t.id, t.tier]));

const newFiles = ['docs/hindi/new-cards-gaps.json', 'docs/hindi/new-cards-early.json']
  .filter(f => fs.existsSync(f));
const incoming: any[] = newFiles.flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')));

// ── ids: continue the numeric hi-NNNN series ────────────────────────────────
const numericIds = deck
  .map((c: any) => /^hi-(\d+)$/.exec(String(c.id)))
  .filter(Boolean)
  .map((m: any) => parseInt(m[1], 10));
let nextId = Math.max(...numericIds) + 1;

// ── placement: a card lands in the band of the most urgent thing it teaches ──
// Bands mirror the compiler's expectations, with headroom so a whole tier's
// new cards don't pile onto one position.
const BAND_START: Record<number, number> = { 1: 20, 2: 210, 3: 620, 4: 1220 };
const BAND_END: Record<number, number> = { 1: 200, 2: 600, 3: 1200, 4: 2200 };

const seen = new Set(deck.map((c: any) => String(c.target).trim()));
const prepared: any[] = [];
const skipped: any[] = [];
for (const c of incoming) {
  const hi = String(c.hi || '').trim();
  if (!hi) { skipped.push([c.en, 'empty target']); continue; }
  if (seen.has(hi)) { skipped.push([hi, 'duplicate of an existing deck sentence']); continue; }
  if (/[a-zA-Z]/.test(hi.replace(/[^\p{L}]/gu, ''))) { skipped.push([hi, 'latin letters in target']); continue; }
  if (/;|—/.test(hi) || /;|—/.test(c.en)) { skipped.push([hi, 'punctuation violation']); continue; }
  const tiers = (c.teaches || []).map((t: string) => tierOf.get(t)).filter((n: any) => n != null) as number[];
  const tier = tiers.length ? Math.min(...tiers) : 3;
  const id = `hi-${String(nextId++).padStart(4, '0')}`;
  prepared.push({
    id,
    target: hi,
    english: String(c.en).trim(),
    audio: `hi-${id}.mp3`,           // Hindi convention: doubled prefix, flat dir
    tags: ['general'],
    grammarNode: c.node || 'node-01',
    teaches: c.teaches || [],
    _tier: tier,
  });
  seen.add(hi);
}

// ── build the new ordering ──────────────────────────────────────────────────
const general = deck
  .filter((c: any) => (c.tags || []).includes('general'))
  .sort((a: any, b: any) => (a.priority ?? 999999) - (b.priority ?? 999999));
const posOf = new Map<string, number>(general.map((c: any, i: number) => [c.id, i + 1]));

// movable repositions: pull the first-teaching card to its band
const moveTo = new Map<string, number>();
for (const m of plan.movable) {
  const target = BAND_END[m.tier] ?? 2200;
  const cur = moveTo.get(m.cardId);
  moveTo.set(m.cardId, cur == null ? target : Math.min(cur, target));
}
// retire dead weight out of the general goal (keep the card, drop the tag) so
// nobody's SRS history is orphaned.
const retire = new Set(plan.retire.map((r: any) => r.id));

// sort key: existing cards keep their position unless repositioned; new cards
// get a fractional slot spread across their band.
const byTier: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
for (const p of prepared) byTier[p._tier].push(p);
const keyed: { card: any; key: number; isNew: boolean }[] = [];
for (const c of general) {
  if (retire.has(c.id)) continue;
  keyed.push({ card: c, key: moveTo.has(c.id) ? moveTo.get(c.id)! - 0.5 : posOf.get(c.id)!, isNew: false });
}
for (const tier of [1, 2, 3, 4]) {
  const group = byTier[tier];
  const start = BAND_START[tier], end = BAND_END[tier];
  group.forEach((p, i) => {
    const frac = group.length === 1 ? 0.5 : i / (group.length - 1);
    keyed.push({ card: p, key: start + frac * (end - start) - 0.25, isNew: true });
  });
}
keyed.sort((a, b) => a.key - b.key);

// renumber 1..N
keyed.forEach((k, i) => { k.card.priority = i + 1; });

// ── write ───────────────────────────────────────────────────────────────────
const out = deck.slice();
for (const p of prepared) { const { _tier, ...card } = p; out.push(card); }
for (const c of out) {
  if (retire.has(c.id)) c.tags = (c.tags || []).filter((t: string) => t !== 'general');
}
const summary = {
  incoming: incoming.length,
  merged: prepared.length,
  skipped: skipped.length,
  repositioned: moveTo.size,
  retired: retire.size,
  deckBefore: deck.length,
  deckAfter: out.length,
  newIdRange: prepared.length ? `${prepared[0].id}..${prepared[prepared.length - 1].id}` : 'none',
};
console.log(JSON.stringify(summary, null, 1));
for (const s of skipped.slice(0, 15)) console.log('  SKIP', s[1], '|', String(s[0]).slice(0, 45));

if (!DRY) {
  fs.writeFileSync('src/data/hindi/deck.json', JSON.stringify(out, null, 1));
  fs.writeFileSync('docs/hindi/merged-new-cards.json', JSON.stringify(prepared.map(p => ({ id: p.id, target: p.target, audio: p.audio })), null, 1));
  console.log('\nwritten. audio needed for', prepared.length, 'new cards');
} else {
  console.log('\n(dry run - nothing written)');
}
