// Scheduling planner: decides HOW each too-late teachable gets fixed.
// A card can only be pulled forward if its grammar suits the earlier band -
// moving a node-20 sentence to position 150 would trade a vocabulary problem
// for a difficulty problem. Where the first-teaching card is too advanced, the
// fix is a NEW simple card instead, and this script emits that work order.
// Run: npx tsx scripts/hindi-schedule-plan.ts
import fs from 'fs';

const deck = JSON.parse(fs.readFileSync('src/data/hindi/deck.json', 'utf8'));
const report = JSON.parse(fs.readFileSync('docs/hindi/coverage-report.json', 'utf8'));
const general = deck
  .filter((c: any) => (c.tags || []).includes('general'))
  .sort((a: any, b: any) => (a.priority ?? 999999) - (b.priority ?? 999999));
const byId = new Map(general.map((c: any, i: number) => [c.id, { ...c, pos: i + 1 }]));

// Node ceiling per position band: what grammar complexity is acceptable this
// early. Derived from the existing deck's own distribution (nodes 1-9 make up
// the first 300 cards today).
const nodeCeilingFor = (pos: number) =>
  pos <= 200 ? 9 : pos <= 600 ? 14 : pos <= 1200 ? 20 : pos <= 2200 ? 28 : 35;
const nodeNum = (n: string) => parseInt(String(n).replace('node-', ''), 10) || 99;
const BAND: Record<number, number> = { 1: 200, 2: 600, 3: 1200, 4: 2200 };

const movable: any[] = [];
const needsNewCard: any[] = [];

for (const late of report.tooLate) {
  const card: any = byId.get(late.firstCard);
  if (!card) continue;
  const target = BAND[late.tier];
  const ceiling = nodeCeilingFor(target);
  const entry = {
    teachable: late.id, hi: late.hi, en: late.en, tier: late.tier,
    cardId: card.id, cardNode: card.grammarNode, currentPos: late.firstPos, targetPos: target,
    cardHi: card.target, cardEn: card.english,
  };
  if (nodeNum(card.grammarNode) <= ceiling) movable.push(entry);
  else needsNewCard.push({ ...entry, reason: `${card.grammarNode} exceeds the node-${ceiling} ceiling for position ${target}` });
}

// Dead weight: retire (drop from the general goal) rather than delete, so SRS
// history for anyone mid-deck is never orphaned.
const retire = report.deadWeight;

const out = {
  summary: {
    tooLate: report.tooLate.length,
    movable: movable.length,
    needNewEarlyCard: needsNewCard.length,
    retire: retire.length,
  },
  movable, needsNewCard, retire,
};
fs.writeFileSync('docs/hindi/schedule-plan.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.summary, null, 1));
console.log('\nTier-1 items needing a NEW early card (existing card too advanced):');
for (const n of needsNewCard.filter(x => x.tier === 1).slice(0, 15)) {
  console.log(` ${n.hi} – ${n.en}  [${n.cardId} ${n.cardNode} @${n.currentPos}]`);
}
console.log('\nTier-1 items that can simply move earlier:');
for (const m of movable.filter(x => x.tier === 1).slice(0, 15)) {
  console.log(` ${m.hi} – ${m.en}  [${m.cardId} ${m.cardNode} @${m.currentPos} -> ${m.targetPos}]`);
}
