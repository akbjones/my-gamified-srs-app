#!/usr/bin/env node
/* Russian heavy-repeat demoter. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/russian/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// JS \b doesn't work with Cyrillic. Hand-roll space/punctuation boundaries.
const RB_START = '(?:^|\\s)';
const RB_END = '(?:\\s|$|[.,!?;:])';

// Prepositions
const V_NA_PREPS = new RegExp(RB_START + '(в|во|на|о|об|обо|при)' + RB_END, 'i');
const V_NA_DIR_LOC = new RegExp(RB_START + '(в|на)\\s+[А-Яа-яёЁ]+', 'i');
// Prepositional case marker: noun ending in -е after one of в/на/о/при
const PREP_CASE_E = /(в|во|на|о|об|при)\s+[А-Яа-яёЁ]*е(?:[.,!?;:]|\s|$)/i;
// About X: о/об + noun in -е
const ABOUT_E = /(?:^|\s)(о|об|обо)\s+[А-Яа-яёЁ]+е(?:[.,!?;:]|\s|$)/i;
// Adjective + noun
const ADJ_NOUN = /(?:^|\s)[А-Яа-я]+(ый|ой|ий|ая|яя|ое|ее|ые|ие)\s+[А-Яа-яёЁ]+/i;
// Reflexive ending
const REFLEXIVE = /[а-яё]+(ся|сь)(?:[.,!?;:]|\s|$)/i;
// Particle бы
const BY_PARTICLE = new RegExp(RB_START + 'бы' + RB_END, 'i');
const ESLI_BY = /если\s+бы/i;
// Verb conjugation endings (1st conjugation: -ю/-у, -ешь, -ет, -ем, -ете, -ют/-ут)
// 2nd conjugation: -ю/-у, -ишь, -ит, -им, -ите, -ат/-ят
const CONJ_VERB = /[а-яё]+(ю|у|ешь|ёшь|ет|ёт|ем|ём|ете|ёте|ют|ут|ишь|ит|им|ите|ат|ят)(?:[.,!?;:]|\s|$)/i;
const ET_3SG = /[а-яё]+(ет|ёт)(?:[.,!?;:]|\s|$)/i;
const IT_3SG = /[а-яё]+(ит)(?:[.,!?;:]|\s|$)/i;
// Subject pronoun
const SUBJECT_PRONOUN = new RegExp(RB_START + '(я|ты|он|она|оно|мы|вы|они)' + RB_END, 'i');
// Numbers 2/3/4 + noun
const NUM_2_3_4 = /(?:^|\s)(два|две|три|четыре)\s+[а-яё]+/i;
// Много/мало/сколько/несколько
const MUCH_LITTLE = new RegExp(RB_START + '(много|мало|сколько|несколько)' + RB_END, 'i');
// Motion verbs idti / ekhat / khodit / ezdit
const MOTION_UNI = /(?:^|\s)(иду|идёшь|идёт|идём|идёте|идут|еду|едешь|едет|едем|едете|едут|шёл|шла|шли)(?:[.,!?;:]|\s|$)/i;
const MOTION_MULTI = /(?:^|\s)(хожу|ходишь|ходит|ходим|ходите|ходят|езжу|ездишь|ездит|ездим|ездите|ездят|ходил|ездил)(?:[.,!?;:]|\s|$)/i;

const RULES = [
  {
    name: 'prep-place-33a',
    tipMatch: /^After в, на, о, при for a place or topic, the noun gets -е/,
    keep: 2,
    score: (t) => {
      if (!PREP_CASE_E.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'v-na-dir-loc-33',
    tipMatch: /^After в \/ на: direction uses accusative/,
    keep: 2,
    score: (t) => {
      // Need в/на + word (could be either case)
      if (!V_NA_DIR_LOC.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'prep-e-marker-32',
    tipMatch: /^When the noun ends in -е after one of в, на, о, при/,
    keep: 1,
    score: (t) => {
      if (!PREP_CASE_E.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'about-e-32',
    tipMatch: /^To say "about X" use о \/ об \+ noun in -е/,
    keep: 2,
    score: (t) => {
      if (!ABOUT_E.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'adj-agree-31',
    tipMatch: /^Adjectives match the noun: красивый дом/,
    keep: 2,
    score: (t) => {
      if (!ADJ_NOUN.test(t)) return 0;
      let s = 5;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'adj-dict-form-31',
    tipMatch: /^Dictionary form is masculine: -ый \/ -ой \/ -ий/,
    keep: 1,
    score: (t) => {
      // Demo: masculine adj + masc noun
      if (!/[а-яё]+(ый|ой|ий)\s+[а-яё]+(?:[.,!?;:]|\s|$)/i.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'soft-hard-adj-31',
    tipMatch: /^Soft adjectives \(-ний type, синий/,
    keep: 1,
    score: (t) => {
      // Demo: needs an adjective in -ний or -ний-derived form
      if (!/[а-яё]+(ний|няя|нее|ние)(?:[.,!?;:]|\s|$)/i.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'adj-before-noun-31',
    tipMatch: /^Adjective comes BEFORE the noun, like English/,
    keep: 1,
    score: (t) => {
      if (!ADJ_NOUN.test(t)) return 0;
      let s = 4;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'verb-conj-25',
    tipMatch: /^Russian verbs conjugate by person \+ number/,
    keep: 1,
    score: (t) => {
      if (!CONJ_VERB.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'six-person-endings-25',
    tipMatch: /^Six person endings: -ю\/-у \(я/,
    keep: 1,
    score: (t) => {
      if (!CONJ_VERB.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'subject-pronouns-24',
    tipMatch: /^Subject pronouns: я \(ya = I\)/,
    keep: 1,
    score: (t) => {
      if (!SUBJECT_PRONOUN.test(t)) return 0;
      let s = 4;
      if (t.length < 25) s += 2;
      return s;
    },
  },
  {
    name: 'russian-keeps-pronoun-24',
    tipMatch: /^Unlike Spanish\/Italian where the pronoun is usually dropped/,
    keep: 1,
    score: (t) => {
      // Demo: card with explicit subject pronoun + verb
      if (!SUBJECT_PRONOUN.test(t) || !CONJ_VERB.test(t)) return 0;
      let s = 6;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'reflexive-sya-18',
    tipMatch: /^Reflexive verbs end in -ся \/ -сь/,
    keep: 2,
    score: (t) => {
      if (!REFLEXIVE.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'sya-not-literal-18',
    tipMatch: /^Many -ся verbs aren't literally reflexive/,
    keep: 1,
    score: (t) => {
      if (!REFLEXIVE.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'sya-from-sebya-18',
    tipMatch: /^-ся is a shortened себя/,
    keep: 1,
    score: (t) => {
      if (!REFLEXIVE.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'sya-each-other-18',
    tipMatch: /^-ся can mean "each other"/,
    keep: 1,
    score: (t) => {
      // Need a reciprocal-style sya verb (встречаться, целоваться, переписываться)
      if (!/(встреч|целу|перепис|вид|здоров|обнима)[а-яё]+(ся|сь)/i.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'third-sg-endings-10',
    tipMatch: /^3rd-person singular endings: `-ет`/,
    keep: 2,
    score: (t) => {
      // Need a 3rd person sg verb -ет/-ёт or -ит
      if (!ET_3SG.test(t) && !IT_3SG.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'two-conjugations-10',
    tipMatch: /^Two conjugations: I/,
    keep: 1,
    score: (t) => {
      if (!CONJ_VERB.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'by-conditional-10',
    tipMatch: /^бы \+ past = conditional/,
    keep: 2,
    score: (t) => {
      if (!BY_PARTICLE.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'num-2-3-4-gen-sg-9',
    tipMatch: /^Numbers 2\/3\/4 \(and `оба`\/`полтора`\) take genitive SINGULAR/,
    keep: 2,
    score: (t) => {
      if (!NUM_2_3_4.test(t)) return 0;
      let s = 6;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'num-counterintuitive-9',
    tipMatch: /^Counterintuitive for English: 'two houses'/,
    keep: 1,
    score: (t) => {
      if (!NUM_2_3_4.test(t)) return 0;
      let s = 6;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'much-little-gen-pl-9',
    tipMatch: /^`Много`, `мало`, `сколько`, `несколько`/,
    keep: 1,
    score: (t) => {
      if (!MUCH_LITTLE.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'chisla-22-9',
    tipMatch: /^Числа `2\/3\/4` are special/,
    keep: 1,
    score: (t) => {
      // Need a compound number ending in 2/3/4
      if (!/(22|23|24|32|33|34|42|43|44|52|53|54|62|63|64|72|73|74|82|83|84|92|93|94)\s+[а-яё]+/.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'guess-conj-from-inf-9',
    tipMatch: /^You can guess conjugation from the infinitive/,
    keep: 1,
    score: (t) => {
      // Demo: infinitive (-ить/-ать/-ять/-овать/-еть)
      if (!/[а-яё]+(ить|ать|ять|овать|еть)(?:[.,!?;:]|\s|$)/i.test(t)) return 0;
      let s = 4;
      return s;
    },
  },
  {
    name: 'stress-yot-9',
    tipMatch: /^Stressed `-ёт` is just `-ет` with stress/,
    keep: 1,
    score: (t) => {
      // Need a verb with ё in ending
      if (!/[а-я]+ё[тшмл]/i.test(t)) return 0;
      let s = 7;
      return s;
    },
  },
  {
    name: 'by-position-9',
    tipMatch: /^`Бы` can sit anywhere after the verb or pronoun/,
    keep: 1,
    score: (t) => {
      if (!BY_PARTICLE.test(t)) return 0;
      let s = 5;
      return s;
    },
  },
  {
    name: 'esli-by-9',
    tipMatch: /^`Если бы \+ past/,
    keep: 1,
    score: (t) => {
      if (!ESLI_BY.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'polite-by-9',
    tipMatch: /^Polite requests use бы/,
    keep: 1,
    score: (t) => {
      // Need хотел/хотела + бы
      if (!/хотел[ао]?\s+бы/i.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'motion-pairs-7',
    tipMatch: /^Motion verbs come in pairs\. Unidirectional/,
    keep: 1,
    score: (t) => {
      if (!MOTION_UNI.test(t) && !MOTION_MULTI.test(t)) return 0;
      let s = 6;
      return s;
    },
  },
  {
    name: 'motion-idu-vs-hozhu-7',
    tipMatch: /^`Я иду в школу` \(going right now/,
    keep: 1,
    score: (t) => {
      if (!MOTION_UNI.test(t) && !MOTION_MULTI.test(t)) return 0;
      let s = 6;
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
  console.log('Russian deck written; stripped:', stripped);
}
