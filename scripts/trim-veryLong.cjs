#!/usr/bin/env node
/* Manual trim of the 14 remaining >200 char tips. */

const fs = require('fs');

const REWRITES = {
  french: {
    'fr-1182': 'Motion/state-change verbs (`aller`, `venir`, `partir`, `mourir`, `naître`, all reflexives) take `être`. The rest take `avoir`.',
    'fr-1307': 'Motion/state-change verbs (`aller`, `venir`, `partir`, `mourir`, `naître`, all reflexives) take `être`. The rest take `avoir`.',
  },
  portuguese: {
    'pt-0041': 'Portuguese has TWO `you`s: `tu` (informal, PT/southern BR) and `você` (universal in BR). Different verb forms: `tu falas` vs `você fala`.',
    'pt-0807': 'Portuguese has TWO `you`s: `tu` (informal, PT/southern BR) and `você` (universal in BR). Different verb forms: `tu falas` vs `você fala`.',
  },
  german: {
    'de-0033': 'Default to `Sie` with anyone you would address as Mr/Mrs in English. Wait for them to suggest `wir können uns duzen` (let us switch to du).',
  },
  dutch: {
    'nl-0031': 'Modern Dutch trends toward `je` even with strangers. But in customer service, with older people, or in writing — default to `u`.',
    'nl-0286': 'Modern Dutch trends toward `je` even with strangers. But in customer service, with older people, or in writing — default to `u`.',
    'nl-0700': 'Modern Dutch trends toward `je` even with strangers. But in customer service, with older people, or in writing — default to `u`.',
  },
  swedish: {
    'sv-1689': 'Swedish dropped formal `you` in the 1960s-70s (`du-reformen`). Unlike French/German/Russian, there is no formal pronoun — `du` works for everyone.',
  },
  welsh: {
    'cy-1004': 'Welsh has TWO `you` forms: `ti` (informal singular) and `chi` (formal singular AND plural). Different verb forms: `wyt ti\'n` (informal) vs `ydych chi\'n` (formal/plural).',
    'cy-1240': 'Welsh has TWO `you` forms: `ti` (informal singular) and `chi` (formal singular AND plural). Different verb forms: `wyt ti\'n` (informal) vs `ydych chi\'n` (formal/plural).',
  },
  russian: {
    'ru-0561': '`Вы` (vy) is BOTH the formal singular AND the plural. Verbs always conjugate as plural with `вы`. Capital `Вы` in letters is polite.',
    'ru-1169': 'Russian gender is PREDICTABLE from the noun ending: consonant → masc (`дом`, dom), `-а/-я` → fem (`книга`, kniga), `-о/-е` → neuter (`окно`, okno).',
    'ru-1911': 'Russian gender is PREDICTABLE from the noun ending: consonant → masc (`дом`, dom), `-а/-я` → fem (`книга`, kniga), `-о/-е` → neuter (`окно`, okno).',
  },
};

let total = 0;
for (const [lang, edits] of Object.entries(REWRITES)) {
  const p = 'src/data/' + lang + '/deck.json';
  const deck = JSON.parse(fs.readFileSync(p, 'utf8'));
  let n = 0;
  for (const c of deck) {
    if (edits[c.id]) {
      c.grammar = edits[c.id];
      n++;
    }
  }
  fs.writeFileSync(p, JSON.stringify(deck, null, 2));
  console.log(lang + ': ' + n);
  total += n;
}
console.log('Total trimmed:', total);
