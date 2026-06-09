#!/usr/bin/env node
/* Turkish bespoke tip fill. See welsh-bespoke-fill for pattern. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/turkish/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const TR_LETTER = '[a-zçğıiöşü]';
const NOT_TR_LETTER = '(?![a-zçğıiöşü])';

const FILLS = [
  {
    tip: 'Subject pronouns (benim, senin, onun, bizim, sizin) are optional in Turkish — possession is already in the noun ending. Use them for emphasis: `benim evim` = MY house (with stress).',
    detect: (t) => /(?:^|\s)(benim|senin|onun|bizim|sizin|onların)\s+\w+(?:im|in|i|imiz|iniz|leri|ım|ın|ımız|ınız|ları)(?![a-zçğıiöşü])/i.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: '`-miş/-mış` = the witnessed-past variant (hearsay, inferred, or surprise). `Gelmiş` = he came (so I hear / apparently). Distinct from `geldi` (I saw him come).',
    // Exclude "Geçmiş olsun" — that's a fixed get-well-soon idiom, not a productive demo
    detect: (t) => new RegExp(TR_LETTER + 'm(i|ı|u|ü)ş(im|sin|tir|iz|siniz|ler)?' + NOT_TR_LETTER, 'i').test(t) && !/Geçmiş olsun/i.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 2,
  },
  {
    tip: 'Turkish has no grammatical gender and no articles. `O` = he/she/it. `Ev` = a house OR the house (context decides which).',
    detect: (t) => /(?:^|\s)O\s+\w/.test(t),
    score: (t) => {
      let s = 5;
      if (t.length < 25) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Question particle `mi/mı/mu/mü` floats — it goes after whatever you\'re asking about. `Geliyor mu?` (Is he coming?). Harmonizes with the last vowel.',
    detect: (t) => /(?:^|\s)(mi|mı|mu|mü)(?:\s|\?)/i.test(t) && /\?/.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 30) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Negation slides INSIDE the verb as `-me/-ma`. `geliyorum` (I come) → `gelmiyorum` (I don\'t come). The negation sits between stem and the rest of the suffixes.',
    detect: (t) => new RegExp(TR_LETTER + 'm(i|ı|u|ü)yor(um|sun|uz|sunuz|lar)?' + NOT_TR_LETTER, 'i').test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Past of `var/yok`: `vardı` (there was), `yoktu` (there wasn\'t). Future: `olacak` (will be). The bare `var/yok` is present-only.',
    detect: (t) => /(?:^|\s)(vardı|yoktu|olacak|olacaktı)(?:$|\s|\.|,)/i.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: '"I have X" = locative pronoun + var. `Bende kalem var` = lit. "at me a pen there is" = I have a pen. Turkish doesn\'t have a verb "to have".',
    detect: (t) => /(?:^|\s)(bende|sende|onda|bizde|sizde|onlarda)\s+.+\s+var(?:$|\s|\.|,)/i.test(t),
    score: (t) => {
      let s = 8;
      if (t.length < 40) s += 2;
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
  console.log('Turkish deck written; filled:', filled);
}
