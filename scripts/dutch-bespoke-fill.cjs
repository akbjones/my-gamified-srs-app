#!/usr/bin/env node
/* Dutch bespoke tip fill. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/dutch/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const FILLS = [
  {
    tip: 'Polite alternative to `willen`: `Ik zou graag…` (I would like…) for soft requests. `Ik wil` can sound abrupt; `Ik zou graag` is the polite form.',
    detect: (t) => /\bzou graag\b/i.test(t),
    score: (t) => {
      let s = 8;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Tricky: `omdat` (because) sends the verb to the END of the clause; `want` (because) does NOT — same English translation, different word-order rules.',
    detect: (t) => /\bomdat\s+\w+\s+\w+(\s+\w+)*\s+\w+(t|en|d)[.!?]?$/i.test(t),
    score: (t) => {
      let s = 9;
      if (t.length < 50) s += 2;
      return s;
    },
    max: 1,
  },
];

const adds = [];
const claimedIds = new Set();

for (const fill of FILLS) {
  const candidates = deck
    .filter(c => !c.grammar && !claimedIds.has(c.id) && fill.detect(c.target))
    .map(c => ({ card: c, score: fill.score(c.target) }))
    .sort((a, b) => (b.score - a.score) || String(a.card.id).localeCompare(String(b.card.id)));

  const chosen = candidates.slice(0, fill.max);
  if (!chosen.length) {
    console.log('  ! ' + fill.tip.slice(0, 50) + '… — no untipped candidate found');
    continue;
  }
  for (const c of chosen) {
    adds.push({ id: c.card.id, target: c.card.target, tip: fill.tip });
    claimedIds.add(c.card.id);
    console.log('  + [' + c.card.id + '] (score=' + c.score + ') ' + c.card.target.slice(0, 50));
    console.log('     » ' + fill.tip.slice(0, 90));
  }
}

console.log('\nTotal cards to fill:', adds.length);

if (fix) {
  const addMap = new Map(adds.map(a => [a.id, a.tip]));
  let filled = 0;
  for (const card of deck) {
    if (addMap.has(card.id)) {
      card.grammar = addMap.get(card.id);
      filled++;
    }
  }
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
  console.log('Dutch deck written; filled:', filled);
}
