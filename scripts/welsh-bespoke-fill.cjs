#!/usr/bin/env node
/* Welsh bespoke tip fill.
 *
 * For each rule that lost ALL its hosts in the demote pass (because the
 * tip was misattached), search the deck for cards that genuinely
 * demonstrate the rule and currently HAVE NO TIP. Attach the tip to
 * the 1-2 best demos.
 *
 * This adds back the rule, but pinned to a card that actually shows it.
 *
 *   node scripts/welsh-bespoke-fill.cjs       # dry run
 *   node scripts/welsh-bespoke-fill.cjs --fix # apply
 */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/welsh/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Each entry: a NEW tip to (re)introduce, a detector for cards that demo it,
// and a max count. The selected cards must NOT currently have a tip.
const FILLS = [
  {
    tip: 'Soft mutation: p→b, t→d, c→g, b→f, d→dd, m→f, ll→l. Trigger here: `dau` (two). After the number 2 the noun softens.',
    detect: (t) => /\b(dau|dwy)\s+(b|d|f|g|l|r|m)\w/.test(t),
    score: (t) => {
      let s = 5;
      if (t.length < 35) s += 3;
      return s;
    },
    max: 2,
  },
  {
    tip: 'Feminine singular nouns SOFT-MUTATE after `y`/`yr`/`\'r`: `merch → y ferch`, `cath → y gath`. Masculine nouns stay as-is.',
    // Explicit list of clearly-feminine SM'd noun forms — avoids false positives
    // on masculine nouns that happen to start with f/l/r in their dictionary form.
    detect: (t) => /\b(y|yr|\'r)\s+(gath|ferch|bont|gadair|ddesg|dref|fam|wraig|wlad|gegin|farchnad|fenyw|gân|gerdd|ddinas|fenter|ddoethineb)\b/.test(t),
    score: (t) => {
      let s = 5;
      if (t.length < 35) s += 3;
      return s;
    },
    max: 2,
  },
  {
    tip: 'Numbers from 2 onwards have masc/fem forms. `dau gi` (2 m. dogs) vs `dwy gath` (2 f. cats). The noun soft-mutates either way.',
    detect: (t) => /\b(dau|dwy)\s+(b|d|f|g|l|r|m)\w/.test(t),
    score: (t) => {
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 2,
  },
  {
    tip: '`Roedd` = was/were (3rd person), imperfect of `bod`. `Roedd e\'n hapus` = he was happy. Used for past states.',
    detect: (t) => /^Roedd\s/.test(t),
    score: (t) => {
      let s = 5;
      if (t.length < 35) s += 3;
      return s;
    },
    max: 2,
  },
  {
    tip: '`Rwy\'n` is a contraction of `Rydw i\'n` (I am). Both work; `Rwy\'n` is shorter and common in writing. `Dw i\'n` is the most casual spoken form.',
    detect: (t) => /^Rwy'n\s/.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 30) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Plural forms of present `bod`: `dyn ni\'n` / `rydym ni\'n` (we are), `dych chi\'n` / `rydych chi\'n` (you all are).',
    detect: (t) => /\b(dyn ni\'n|rydym ni\'n|dych chi\'n|rydych chi\'n)\b/i.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 2,
  },
  {
    tip: 'Formal/written Welsh: `Nid yw e\'n hapus` instead of `dyw e ddim yn hapus`. Same meaning, literary register.',
    detect: (t) => /\bNid\s+yw\b/i.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Negative imperfect: `doeddwn i ddim` (I wasn\'t), `doedd e ddim` (he wasn\'t). The `r-` of `roedd` becomes `d-` for negation.',
    detect: (t) => /\b(doeddwn|doeddet|doedd|doedden|doeddech)\b/i.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Negate future by softening: `bydd → fydd`. `Fydd hi ddim yn dod` (she won\'t come). Same `ddim` particle as the present negative.',
    detect: (t) => /^Fydd\b/.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: '`Newydd` as a perfect-like particle = \'just (now)\'. `Dw i newydd fwyta` = I\'ve just eaten. Compare `wedi` (generic perfect) vs `newydd` (very recent).',
    // Require subject pronoun + newydd + SM'd verb-noun (the particle context).
    // Adjective "newydd" appears in noun + newydd (e.g. "ffôn newydd") which we exclude.
    detect: (t) => /\b(Dw i|Mae e|Mae hi|Dyn ni|Maen nhw|Dych chi)\s+newydd\s+(f|d|g|b|l|r|m)\w/i.test(t),
    score: (t) => {
      let s = 6;
      if (t.length < 40) s += 2;
      return s;
    },
    max: 1,
  },
];

const adds = [];
const claimedIds = new Set();

for (const fill of FILLS) {
  // Candidates: cards with no tip AND not already claimed for an earlier rule
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
  console.log('Welsh deck written; filled:', filled);
}
