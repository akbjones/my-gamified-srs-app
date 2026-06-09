#!/usr/bin/env node
/* Swedish heavy-repeat demoter. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/swedish/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Swedish-aware boundaries (JS \b can't handle å/ä/ö reliably)
const SV_LETTER = '[a-zåäö]';
const NOT_SV_LETTER = '(?![a-zåäöA-ZÅÄÖ])';
const SV_WORD_START = '(?:^|[^a-zåäöA-ZÅÄÖ])';

// Definite article: noun ending in -en/-et/-na (need stem of 2+ chars to avoid 'en'/'et' as articles)
const DEF_NOUN = new RegExp(SV_LETTER + '{2,}' + '(en|et|na)' + NOT_SV_LETTER, 'i');
// Past tense endings -ade/-de/-te (need 3+ char stem to avoid "ute", "inte", etc.)
const PAST = new RegExp(SV_LETTER + '{3,}' + '(ade|de|te)' + NOT_SV_LETTER, 'i');
// Strong/irregular Group 4 verbs (vowel change) — word-bounded
const GROUP_4_VERBS = new RegExp(SV_WORD_START + '(drack|drick|gick|åt|äta|kom|komma|fick|få|såg|gav|sprang|springa|skrev|skriva|tog|bjöd|bjuda|slog|slå|hjälpte|bröt|bryta|sjöng|sjunga|sov|sova|stod|stå|satt|sitta|låg|ligga|kände|känna|red|rida|skrek|skrika)' + NOT_SV_LETTER, 'i');
// Subordinating conjunctions
const SUBORD = new RegExp(SV_WORD_START + '(att|när|om|eftersom|därför att|fast|trots att|innan)' + NOT_SV_LETTER, 'i');
// inte (negation)
const INTE = new RegExp(SV_WORD_START + 'inte' + NOT_SV_LETTER, 'i');
// Present tense verb endings -ar/-er (need 3+ char stem)
const PRESENT_AR = new RegExp(SV_LETTER + '{3,}' + 'ar' + NOT_SV_LETTER, 'i');
const PRESENT_ER = new RegExp(SV_LETTER + '{3,}' + 'er' + NOT_SV_LETTER, 'i');
// det är / det finns
const DET_AR = new RegExp(SV_WORD_START + 'det är' + NOT_SV_LETTER, 'i');
const DET_FINNS = new RegExp(SV_WORD_START + 'det finns' + NOT_SV_LETTER, 'i');
// har + supinum (perfect)
const HAR_SUPINUM = new RegExp(SV_WORD_START + 'har\\s+' + SV_LETTER + '+(at|t|tt|it)' + NOT_SV_LETTER, 'i');
// V2: starts with non-subject element then verb
const V2_INVERSION = /^(Idag|Imorgon|Igår|I morgon|I går|Nu|Här|Då|På|I)\s+[a-zåäö]+\s+[a-zåäö]+(ar|er|r)\b/i;

const RULES = [
  {
    name: 'def-article-en-et-141',
    tipMatch: /^Swedish glues "the" onto the END of the noun/,
    keep: 2,
    score: (t) => {
      if (!DEF_NOUN.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'two-genders-141',
    tipMatch: /^Two genders – common \(suffix -n\) and neuter/,
    keep: 1,
    score: (t) => {
      // Need both -en and -et forms in same card, or just one is OK
      if (!DEF_NOUN.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'past-endings-70',
    tipMatch: /^Past endings: -ade \(group 1, most regular\)/,
    keep: 2,
    score: (t) => {
      if (!PAST.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'group-4-vowel-70',
    tipMatch: /^Group 4 verbs change vowels instead of adding endings/,
    keep: 2,
    score: (t) => {
      if (!GROUP_4_VERBS.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'subord-inte-61a',
    tipMatch: /^After att, när, om, eftersom: inte \(not\) goes BEFORE the verb/,
    keep: 2,
    score: (t) => {
      // Need a subord + inte + verb sequence
      if (!/\b(att|när|om|eftersom|därför att)\s+\w+\s+inte\s+\w/i.test(t)) return 0;
      let s = 7;
      if (t.length < 50) s += 2;
      return s;
    },
  },
  {
    name: 'subord-conj-61',
    tipMatch: /^Subordinating conjunctions don't push the verb/,
    keep: 1,
    score: (t) => {
      if (!SUBORD.test(t)) return 0;
      let s = 4;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'present-all-persons-45',
    tipMatch: /^Swedish present tense is the same for all persons/,
    keep: 1,
    score: (t) => {
      if (!PRESENT_AR.test(t) && !PRESENT_ER.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'verb-group-endings-45',
    tipMatch: /^Endings tell you the verb group/,
    keep: 1,
    score: (t) => {
      if (!PRESENT_AR.test(t) && !PRESENT_ER.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'det-ar-finns-19a',
    tipMatch: /^`det är` = 'it is \/ there is'/,
    keep: 2,
    score: (t) => {
      if (!DET_AR.test(t) && !DET_FINNS.test(t)) return 0;
      let s = 6;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'perfect-har-supinum-19',
    tipMatch: /^Perfect tense uses `har \+ supinum`/,
    keep: 2,
    score: (t) => {
      if (!HAR_SUPINUM.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'det-ar-invariant-19',
    tipMatch: /^`Det är` doesn't care about gender or number/,
    keep: 1,
    score: (t) => {
      if (!DET_AR.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'supinum-vs-past-18',
    tipMatch: /^Don't confuse supinum with the past tense/,
    keep: 1,
    score: (t) => {
      // Need both a past and a supinum in card, or supinum
      if (!HAR_SUPINUM.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'subord-inte-before-16',
    tipMatch: /^In subordinate clauses, `inte` moves BEFORE the verb/,
    keep: 1,
    score: (t) => {
      if (!/\b(att|när|om|eftersom)\s+\w+\s+inte\s+\w/i.test(t)) return 0;
      let s = 7;
      return s;
    },
  },
  {
    name: 'inte-after-verb-main-16',
    tipMatch: /^`inte` \(not\) goes AFTER the verb in main clauses/,
    keep: 1,
    score: (t) => {
      // Demo: main clause with verb + inte
      if (!/^(?!att |när |om |eftersom )[A-ZÅÄÖ][a-zåäö]+\s+\w+\s+inte\b/i.test(t)) return 0;
      let s = 6;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'v2-6',
    tipMatch: /^Swedish is V2: the verb is always the second element/,
    keep: 1,
    score: (t) => {
      if (!V2_INVERSION.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'subj-inversion-6',
    tipMatch: /^If anything but the subject opens the sentence/,
    keep: 1,
    score: (t) => {
      if (!V2_INVERSION.test(t)) return 0;
      let s = 8;
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
  console.log('Swedish deck written; stripped:', stripped);
}
