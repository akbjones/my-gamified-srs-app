#!/usr/bin/env node
/* Spanish heavy-repeat demoter. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/spanish/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Imperfect endings: -aba/-abas/-aba/-ábamos/-abais/-aban (ar) OR -ía/-ías/-ía/-íamos/-íais/-ían (er/ir)
const IMPERFECT = /\w+(aba|abas|ábamos|abais|aban|ía|ías|íamos|íais|ían)(?:\s|[.,!?;:]|$)/i;
// Preterite endings: -é/-aste/-ó/-amos/-asteis/-aron (ar) or -í/-iste/-ió/-imos/-isteis/-ieron (er/ir)
const PRETERITE = /\w+(é|aste|amos|asteis|aron|í|iste|ió|imos|isteis|ieron)(?:\s|[.,!?;:]|$)/i;
// SER forms
const SER = /\b(soy|eres|es|somos|sois|son|era|eras|éramos|erais|eran|fui|fuiste|fue|fuimos|fuisteis|fueron)\b/i;
// ESTAR forms
const ESTAR = /\b(estoy|estás|está|estamos|estáis|están|estaba|estabas|estábamos|estabais|estaban|estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron)\b/i;
// Articles
const ART_M = /\b(el|los|un|unos)\s+\w/i;
const ART_F = /\b(la|las|una|unas)\s+\w/i;
// PARA
const PARA = /\bpara\b/i;
const POR = /\bpor\b/i;
// Reflexive pronouns before verb
const REFLEXIVE = /\b(me|te|se|nos|os)\s+\w+(o|as|a|amos|áis|an|es|e|emos|en)\b/i;
// Diminutive -ito/-ita
const DIMINUTIVO = /\w+(ito|ita|cito|cita|ico|illa)(?:\s|[.,!?;:]|$)/i;
// VOSOTROS forms -áis/-éis/-ís
const VOSOTROS = /\w+(áis|éis|ís)(?:\s|[.,!?;:]|$)/i;
// TÚ vs USTED
const TU_USTED = /\b(tú|usted|ustedes|vosotros)\b/i;

const RULES = [
  {
    name: 'imperfect-habit-50',
    tipMatch: /^Imperfect \(endings -aba \/ -ía\) paints habit/,
    keep: 2,
    score: (t) => {
      if (!IMPERFECT.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'imperfect-bg-48',
    tipMatch: /^Imperfect = background past/,
    keep: 1,
    score: (t) => {
      if (!IMPERFECT.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'noun-gender-36a',
    tipMatch: /^Spanish nouns are masculine or feminine, even objects/,
    keep: 1,
    score: (t) => {
      if (!ART_M.test(t) && !ART_F.test(t)) return 0;
      let s = 5;
      if (ART_M.test(t) && ART_F.test(t)) s += 3;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'gender-endings-36',
    tipMatch: /^-o is usually m \(el libro\)/,
    keep: 1,
    score: (t) => {
      if (!/\b(el|la)\s+\w+(o|a)\b/i.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'adj-agreement-36',
    tipMatch: /^Adjectives match the noun in gender \+ number/,
    keep: 1,
    score: (t) => {
      // Demo: noun + adj agreeing (e.g., el coche rojo, los coches rojos)
      if (!/\b(el|la|los|las)\s+\w+\s+\w+(o|a|os|as)\b/i.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'plural-formation-36',
    tipMatch: /^Plural: add -s after a vowel/,
    keep: 1,
    score: (t) => {
      if (!/\b(los|las|unos|unas)\s+\w+s\b/i.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'para-por-dest-cause-32a',
    tipMatch: /^para = destination \/ purpose/,
    keep: 1,
    score: (t) => {
      if (!PARA.test(t) && !POR.test(t)) return 0;
      let s = 5;
      if (PARA.test(t) && POR.test(t)) s += 3;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'por-backwards-para-forwards-32',
    tipMatch: /^por and para both translate as "for"/,
    keep: 1,
    score: (t) => {
      if (!PARA.test(t) && !POR.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'para-endpoint-31',
    tipMatch: /^para = endpoint \/ intent/,
    keep: 1,
    score: (t) => {
      if (!PARA.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'ser-permanent-27a',
    tipMatch: /^ser = what something IS permanently/,
    keep: 1,
    score: (t) => {
      if (!SER.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'ser-equals-27',
    tipMatch: /^If "is" could be replaced with "equals"/,
    keep: 1,
    score: (t) => {
      if (!SER.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'ser-identity-27',
    tipMatch: /^`ser` declares identity/,
    keep: 1,
    score: (t) => {
      if (!SER.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'preterite-complete-27',
    tipMatch: /^Preterite for completed past actions/,
    keep: 1,
    score: (t) => {
      if (!PRETERITE.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'preterite-endings-23',
    tipMatch: /^Preterite endings: -ar verbs → -é\/-aste/,
    keep: 1,
    score: (t) => {
      if (!PRETERITE.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'reflexive-pronoun-22a',
    tipMatch: /^Reflexive verbs put a pronoun \(me\/te\/se\/nos\/os\/se\)/,
    keep: 2,
    score: (t) => {
      if (!REFLEXIVE.test(t)) return 0;
      let s = 6;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'reflexive-not-literal-22',
    tipMatch: /^Reflexive isn't always literal/,
    keep: 1,
    score: (t) => {
      if (!/\b(acordarse|acuerd|quejarse|quej|llamar|llam|levantar|levant|sentar|sient|ducharse|duch)/i.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'se-not-decorative-20',
    tipMatch: /^The `se` in `se llama`/,
    keep: 1,
    score: (t) => {
      if (!/\bse\s+(llama|ducha|levanta|sienta|acuesta|despierta)/i.test(t)) return 0;
      let s = 8;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'diminutive-ito-10a',
    tipMatch: /^Diminutives -ito\/-ita add "small \/ cute/,
    keep: 1,
    score: (t) => {
      // Strictly require a known diminutive word — not just any -ito/-ita ending
      if (!/\b(cafecito|cafelito|gatito|perrito|perrita|hijito|hermanito|hermanita|mesita|cosita|momentito|abuelita|abuelito|vasito|paquetito|cochecito|casita)\b/i.test(t)) return 0;
      let s = 9;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'tu-vs-usted-10a',
    tipMatch: /^Two "you" pronouns: tú \(informal\) and usted/,
    keep: 1,
    score: (t) => {
      if (!TU_USTED.test(t)) return 0;
      let s = 6;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'puede-puedes-10',
    tipMatch: /^puede could mean "he\/she can"/,
    keep: 1,
    score: (t) => {
      if (!/\b(puede|puedes)\b/i.test(t)) return 0;
      let s = 8;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'default-tu-usted-10',
    tipMatch: /^Default to tú with peers/,
    keep: 1,
    score: (t) => {
      if (!TU_USTED.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'ito-softening-10',
    tipMatch: /^-ito softens emotionally/,
    keep: 1,
    score: (t) => {
      if (!/\b(cafecito|cafelito|momentito|cosita|gatito|perrito)\b/i.test(t)) return 0;
      let s = 9;
      return s;
    },
  },
  {
    name: 'vosotros-9',
    tipMatch: /^Spain uses vosotros/,
    keep: 1,
    score: (t) => {
      if (!/\bvosotros\b/i.test(t) && !VOSOTROS.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'drop-pronoun-9a',
    tipMatch: /^Spanish usually drops subject pronouns/,
    keep: 1,
    score: (t) => {
      // Demo: starts with verb (no overt pronoun)
      if (!/^[A-Z][a-záéíóúñ]+(o|as|a|amos|áis|an|es|e|emos|en)\b/i.test(t)) return 0;
      let s = 6;
      if (t.length < 25) s += 2;
      return s;
    },
  },
  {
    name: 'pronoun-optional-9',
    tipMatch: /^Subject pronouns are optional/,
    keep: 1,
    score: (t) => {
      if (!/^[A-Z][a-záéíóúñ]+(o|as|a|amos|áis|an|es|e|emos|en)\b/i.test(t)) return 0;
      let s = 6;
      if (t.length < 25) s += 2;
      return s;
    },
  },
];

const removedCardIds = new Set();

for (const rule of RULES) {
  const hosts = deck.filter(c => c.grammar && rule.tipMatch.test(c.grammar));
  if (!hosts.length) {
    console.log('  ! ' + rule.name + ': no host cards found');
    continue;
  }
  const scored = hosts.map(c => ({ card: c, score: rule.score(c.target) }));
  scored.sort((a, b) => (b.score - a.score) || String(a.card.id).localeCompare(String(b.card.id)));
  const eligible = scored.filter(s => s.score > 0).slice(0, rule.keep);
  const keepIds = new Set(eligible.map(s => s.card.id));
  const removeIds = scored.filter(s => !keepIds.has(s.card.id)).map(s => s.card.id);
  for (const id of removeIds) removedCardIds.add(id);
  const keptLabel = eligible.length === 0
    ? 'NONE-eligible'
    : [...keepIds].slice(0, 2).join(', ') + ' (scores: ' + eligible.slice(0,2).map(e => e.score).join(',') + ')';
  console.log('  ' + rule.name.padEnd(28) + ' hosts=' + String(hosts.length).padStart(3) +
              ' kept=' + eligible.length +
              ' strip=' + removeIds.length +
              '   ' + keptLabel);
}

console.log('\nTotal cards to strip:', removedCardIds.size);

if (fix) {
  let stripped = 0;
  for (const card of deck) {
    if (removedCardIds.has(card.id)) {
      delete card.grammar;
      stripped++;
    }
  }
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
  console.log('Spanish deck written; stripped:', stripped);
}
