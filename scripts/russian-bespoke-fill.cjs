#!/usr/bin/env node
/* Russian bespoke tip fill. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/russian/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const FILLS = [
  {
    tip: 'To say "about X" use `о` / `об` + noun in -е: `думаю о доме` (dumayu o dome = thinking about home). `Об` before vowel-initial words: `об отце` (ob ottse = about dad).',
    detect: (t) => /(?:^|\s)(о|об|обо)\s+[А-Яа-яёЁ]+е(?:[.,!?;:]|\s|$)/i.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 2,
  },
  {
    tip: 'Compound numbers ending in 2/3/4 still take genitive singular: `двадцать два года` (22 years), `тридцать три рубля` (33 rubles). 22/23/24/32/33/34… all behave like bare 2/3/4.',
    detect: (t) => /(22|23|24|32|33|34|42|43|44|52|53|54|62|63|64|72|73|74|82|83|84|92|93|94)\s+[а-яё]+/.test(t) || /(двадцать|тридцать|сорок|пятьдесят)\s+(два|две|три|четыре)\s+[а-яё]+/i.test(t),
    score: (t) => {
      let s = 8;
      if (t.length < 35) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'You can guess conjugation from the infinitive. `-ить` and most `-еть` → II conjugation (-ишь/-ит/…). Most `-ать/-ять/-овать` → I conjugation (-ешь/-ет/…).',
    // Verb infinitive ending in -ть; exclude cards that are number lists or that contain known non-verb -ть words.
    detect: (t) => {
      if (!/[а-яё]+(ить|ать|ять|овать)(?:[.,!?;:]|\s|$)/i.test(t)) return false;
      // Reject cards starting with a number sequence like "Один, два, три..."
      if (/^Один,\s*два/.test(t)) return false;
      // Reject if only non-verb -ть words appear: пять, шесть, девять, десять, etc.
      const verbMatch = t.match(/(?:^|\s)([а-яё]+)(ить|ать|ять|овать)(?:[.,!?;:]|\s|$)/i);
      if (verbMatch) {
        const word = verbMatch[1] + verbMatch[2];
        const NON_VERB = ['пять','шесть','девять','десять','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','часть','масть','новость','радость','любовь','прелесть','песнь'];
        if (NON_VERB.includes(word.toLowerCase())) return false;
      }
      return true;
    },
    score: (t) => {
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Stressed `-ёт` is just `-ет` with stress on it: `идёт`, `поёт`. The two dots over `ё` mark the stressed vowel — important for pronunciation.',
    // Require -ёт/-ёшь/-ём verb form NOT preceded by н (which would make it a noun like днём, приём)
    detect: (t) => {
      const re = /(?:^|\s)([а-я]{1,5})ё(т|шь|м|те)(?:[.,!?;:]|\s|$)/i;
      const m = t.match(re);
      if (!m) return false;
      const stem = m[1];
      // Reject if the matched word is a known noun
      const NOUN_STEMS = ['дн', 'при', 'переп', 'перел', 'наро', 'самолё', 'самолё'];
      if (NOUN_STEMS.includes(stem.toLowerCase())) return false;
      return true;
    },
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
  console.log('Russian deck written; filled:', filled);
}
