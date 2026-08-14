// Language-agnostic merge: fold spec-authored cards into a deck, placing each
// by the tier of what it teaches rather than appending it to the end.
// Priority is a computed property here - that is the point of the engine.
//
//   npx tsx scripts/curriculum/merge.ts <language> <targetField> [--dry]
import fs from 'fs';

const [LANG, FIELD] = process.argv.slice(2);
const DRY = process.argv.includes('--dry');
if (!LANG || !FIELD) { console.error('usage: merge.ts <language> <targetField> [--dry]'); process.exit(1); }

const PREFIX: Record<string, string> = {
  spanish: 'es', french: 'fr', german: 'de', italian: 'it', portuguese: 'pt',
  russian: 'ru', turkish: 'tr', dutch: 'nl', swedish: 'sv', welsh: 'cy',
  greek: 'el', korean: 'ko', indonesian: 'id', hindi: 'hi',
};
const p = PREFIX[LANG];
const DIR = `docs/curriculum/${LANG}`;
const deck = JSON.parse(fs.readFileSync(`src/data/${LANG}/deck.json`, 'utf8'));
const syllabus = JSON.parse(fs.readFileSync(`${DIR}/syllabus.json`, 'utf8')).items;
const incoming = JSON.parse(fs.readFileSync(`${DIR}/new-cards.json`, 'utf8'));
const tierOf = new Map<string, number>(syllabus.map((t: any) => [t.id, t.tier]));

const nums = deck.map((c: any) => new RegExp(`^${p}-(\\d+)$`).exec(String(c.id))).filter(Boolean).map((m: any) => +m[1]);
let next = Math.max(...nums) + 1;

const general = deck.filter((c: any) => (c.tags || []).includes('general'))
  .sort((a: any, b: any) => (a.priority ?? 999999) - (b.priority ?? 999999));
const N = general.length;
// Place inside the tier's band, leaving the front of tier 1 free so the deck's
// own opening survives.
const BAND: Record<number, [number, number]> = {
  1: [Math.round(N * 0.01), Math.round(N * 0.06)],
  2: [Math.round(N * 0.07), Math.round(N * 0.19)],
  3: [Math.round(N * 0.20), Math.round(N * 0.38)],
  4: [Math.round(N * 0.39), Math.round(N * 0.70)],
};

const seen = new Set(deck.map((c: any) => String(c.target).trim()));
const prepared: any[] = []; const skipped: string[] = [];
for (const c of incoming) {
  const text = String(c[FIELD] || '').trim();
  if (!text) { skipped.push('empty'); continue; }
  if (seen.has(text)) { skipped.push('dup: ' + text.slice(0, 40)); continue; }
  if (/;|—/.test(text) || /;|—/.test(c.en)) { skipped.push('punct: ' + text.slice(0, 40)); continue; }
  const tiers = (c.teaches || []).map((t: string) => tierOf.get(t)).filter((n: any) => n != null) as number[];
  const tier = tiers.length ? Math.min(...tiers) : 3;
  const id = `${p}-${String(next++).padStart(4, '0')}`;
  prepared.push({
    id, target: text, english: String(c.en).trim(), audio: `${p}-${id}.mp3`,
    tags: ['general'], grammarNode: c.node || 'node-01', teaches: c.teaches || [], _tier: tier,
  });
  seen.add(text);
}

const posOf = new Map<string, number>(general.map((c: any, i: number) => [c.id, i + 1]));
const byTier: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
for (const c of prepared) byTier[c._tier].push(c);
const keyed: { card: any; key: number }[] = general.map((c: any) => ({ card: c, key: posOf.get(c.id)! }));
for (const tier of [1, 2, 3, 4]) {
  const g = byTier[tier]; if (!g.length) continue;
  const [start, end] = BAND[tier];
  g.forEach((c, i) => keyed.push({ card: c, key: start + (g.length === 1 ? 0.5 : i / (g.length - 1)) * (end - start) - 0.25 }));
}
keyed.sort((a, b) => a.key - b.key);
keyed.forEach((k, i) => { k.card.priority = i + 1; });

const out = deck.slice();
for (const c of prepared) { const { _tier, ...card } = c; out.push(card); }
console.log(JSON.stringify({ language: LANG, incoming: incoming.length, merged: prepared.length, skipped: skipped.length,
  deckBefore: deck.length, deckAfter: out.length, newIds: prepared.length ? `${prepared[0].id}..${prepared[prepared.length-1].id}` : 'none' }, null, 1));
for (const s of skipped.slice(0, 10)) console.log('  SKIP', s);

if (!DRY) {
  fs.writeFileSync(`src/data/${LANG}/deck.json`, JSON.stringify(out, null, 1));
  fs.writeFileSync(`${DIR}/tts-list.json`, JSON.stringify(prepared.map(c => ({ file: c.audio, text: c.target })), null, 1));
  console.log('\nwritten. audio needed for', prepared.length, 'cards');
} else console.log('\n(dry run)');
