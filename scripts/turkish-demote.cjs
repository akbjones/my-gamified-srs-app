#!/usr/bin/env node
/* Turkish heavy-repeat demoter.
 *
 * Same approach as welsh-demote: for each tip appearing 5+ times,
 * identify which cards actually demonstrate the rule, keep the tip on
 * the best 1-2, strip the rest.
 *
 *   node scripts/turkish-demote.cjs            # dry run
 *   node scripts/turkish-demote.cjs --fix      # apply
 */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/turkish/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Turkish-aware boundary: a letter (Turkish or Latin) means "still in word".
// JS \b doesn't handle Turkish chars (ı, ö, ü, ç, ş, ğ), so we hand-roll.
const TR_LETTER = '[a-zçğıiöşü]';
const NOT_TR_LETTER = '(?![a-zçğıiöşü])';

// Past-tense word: must be at SENTENCE END (verb-final SOV) to avoid false
// positives on nouns that coincidentally end in -dın/-dim morphologically.
function pastAtEnd(target) {
  // Strip trailing punctuation; check the last word
  const cleaned = target.replace(/[.!?,;:]+$/, '').trim();
  const words = cleaned.split(/\s+/);
  const last = words[words.length - 1];
  return /[a-zçğıiöşü](d|t)(i|ı|u|ü)(m|n|k|niz|nız|nuz|nüz|ler|lar)?$/i.test(last);
}

// -iyor (any vowel-harmony) anywhere in the target
const IYOR = new RegExp(TR_LETTER + '(i|ı|u|ü)yor', 'i');
const IYOR_HARMONIZED = new RegExp(TR_LETTER + '(ı|ü|u)yor', 'i'); // non-default vowel
// Locative -de/-da/-te/-ta at end of a word
const LOCATIVE = new RegExp(TR_LETTER + '(d|t)(e|a)' + NOT_TR_LETTER, 'i');
// Ablative -den/-dan/-ten/-tan at end of a word
const ABLATIVE = new RegExp(TR_LETTER + '(d|t)(e|a)n' + NOT_TR_LETTER, 'i');
// Future -ecek/-acak (with optional person/buffer)
function futureAtEnd(target) {
  const cleaned = target.replace(/[.!?,;:]+$/, '').trim();
  const words = cleaned.split(/\s+/);
  const last = words[words.length - 1];
  return /[a-zçğıiöşü](e|a)c(e|a)(k|ğ)/i.test(last);
}
// Question particle mi/mu/mı/mü as standalone word
const MI_PARTICLE = new RegExp('(?:^|\\s)(mi|mı|mu|mü)(?:$|\\s|\\?)', 'i');
// Negation infix -me/-ma (within a verb form, between stem and suffix)
const NEGATION = new RegExp(TR_LETTER + '(m)(e|a)(yor|cek|cak|dim|din|di|dik|diniz|diler)', 'i');
// Var/yok as standalone
const VAR_YOK = new RegExp('(?:^|\\s)(var|yok)(?:$|\\s|\\.)', 'i');

const RULES = [
  {
    name: 'past-tense-79',
    tipMatch: /^Past tense = stem \+ di \+ person/,
    keep: 2,
    score: (t) => {
      if (!pastAtEnd(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'past-endings-78',
    tipMatch: /^Past-tense person endings:/,
    keep: 2,
    score: (t) => {
      if (!pastAtEnd(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'locative-de-da-38',
    tipMatch: /^Add -de \/ -da to a word/,
    keep: 2,
    score: (t) => {
      // Word ending in -de/-da, not just the conjunction "da"
      if (!new RegExp(TR_LETTER + 'd(e|a)' + NOT_TR_LETTER, 'i').test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'hardening-te-ta-38',
    tipMatch: /^After a hard ending \(p, ç, t, k, f, h, s, ş\) the suffix hardens/,
    keep: 2,
    score: (t) => {
      // Word ending in -te/-ta after a hard consonant
      if (!new RegExp('(p|ç|t|k|f|h|s|ş)' + TR_LETTER + '*t(e|a)' + NOT_TR_LETTER, 'i').test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'apostrophe-names-38',
    tipMatch: /^Names get an apostrophe before any suffix/,
    keep: 2,
    score: (t) => {
      // Proper noun + apostrophe + suffix
      if (!new RegExp("[A-ZÇĞIİÖŞÜ]" + TR_LETTER + "*'(d|t|y|n|l)" + TR_LETTER).test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'locative-not-the-38',
    tipMatch: /^-de\/-da doesn't mean "the"/,
    keep: 1,
    score: (t) => {
      if (!LOCATIVE.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'iyor-ing-32',
    tipMatch: /^-iyor = -ing \(continuous\)/,
    keep: 2,
    score: (t) => {
      if (!IYOR.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'iyor-vowel-harmony-32',
    tipMatch: /^-iyor changes shape to match the root/,
    keep: 2,
    score: (t) => {
      if (!IYOR_HARMONIZED.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'iyor-both-uses-32',
    tipMatch: /^-iyor covers BOTH "I am doing now"/,
    keep: 1,
    score: (t) => {
      if (!IYOR.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'decode-iyor-32',
    tipMatch: /^Decoding a long verb\? Find -iyor first/,
    keep: 1,
    score: (t) => {
      // Need a complex iyor verb form
      if (!/\w{5,}(i|ı|u|ü)yor\w+\b/i.test(t)) return 0;
      let s = 6;
      return s;
    },
  },
  {
    name: 'possession-baked-in-20',
    tipMatch: /^Possession is baked into the noun/,
    keep: 2,
    score: (t) => {
      // Word ending in -im/-in/-um/-ün/-ım/-ın (1p/2p possessive)
      if (!new RegExp(TR_LETTER + '(i|ı|u|ü)(m|n)' + NOT_TR_LETTER, 'i').test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'person-endings-20',
    tipMatch: /^Person endings: -im \(my\), -in \(your\)/,
    keep: 2,
    score: (t) => {
      if (!new RegExp(TR_LETTER + '(im|in|imiz|iniz|leri|ım|ın|ımız|ınız|ları|um|un|umuz|unuz|üm|ün|ümüz|ünüz)' + NOT_TR_LETTER, 'i').test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'buffer-s-20',
    tipMatch: /^Buffer 's' after vowel-ending nouns/,
    keep: 2,
    score: (t) => {
      // Buffer s: vowel + s + i (3rd p possessive) at word end.
      // Must be Turkish-word-end (not just JS \b) and the s isn't part of -sın(ız) copula.
      if (!new RegExp(TR_LETTER + '(a|e|ı|i|o|ö|u|ü)s(ı|i|u|ü)' + NOT_TR_LETTER, 'i').test(t)) return 0;
      // Reject cards where the matched substring is followed by n (sın/sınız copula)
      if (/(a|e|ı|i|o|ö|u|ü)s(ı|i|u|ü)n(ı|i|u|ü)?z?/i.test(t)) return 0;
      let s = 7;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'benim-emphasis-20',
    tipMatch: /^You CAN add a separate 'my'\/'your' word for emphasis/,
    keep: 1,
    score: (t) => {
      if (!/\b(benim|senin|onun|bizim|sizin|onların)\b/i.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'mis-hearsay-20',
    tipMatch: /^Distinct from the witnessed past `-miş\/-mış`/,
    keep: 2,
    score: (t) => {
      if (!new RegExp(TR_LETTER + 'm(i|ı|u|ü)ş', 'i').test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'future-ecek-13',
    tipMatch: /^Future = stem \+ -ecek\/-acak/,
    keep: 2,
    score: (t) => {
      if (!futureAtEnd(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'sov-12',
    tipMatch: /^Turkish is SOV: verb always at the end/,
    keep: 1,
    score: (t) => {
      // Demo: any verb-final sentence.
      if (!pastAtEnd(t) && !futureAtEnd(t) && !IYOR.test(t.split(/\s+/).pop().replace(/[.!?]/, ''))) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'no-gender-articles-12',
    tipMatch: /^No gender, no articles\. O = he\/she\/it/,
    keep: 1,
    score: (t) => {
      // Demo: standalone "O" pronoun used as he/she/it
      if (!/(?:^|\s)O\s/.test(t)) return 0;
      let s = 5;
      if (t.length < 25) s += 2;
      return s;
    },
  },
  {
    name: 'mi-question-12',
    tipMatch: /^Question particle mi floats/,
    keep: 2,
    score: (t) => {
      if (!MI_PARTICLE.test(t) || !/\?/.test(t)) return 0;
      let s = 6;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'negation-me-ma-12',
    tipMatch: /^Negation = -me\/-ma INSIDE the verb/,
    keep: 2,
    score: (t) => {
      // Need a negated verb: containing -me-/-ma- followed by another verb suffix
      if (!NEGATION.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'k-to-g-12',
    tipMatch: /^k → ğ between vowels/,
    keep: 1,
    score: (t) => {
      if (!new RegExp('(a|e|ı|i|o|ö|u|ü)ğ(a|e|ı|i|o|ö|u|ü)', 'i').test(t)) return 0;
      let s = 7;
      return s;
    },
  },
  {
    name: 'future-question-12',
    tipMatch: /^Future \+ question: `gelecek misin\?`/,
    keep: 1,
    score: (t) => {
      // Need future + mi question
      if (!futureAtEnd(t) && !/(e|a)c(e|a)(k|ğ)\s+(mi|mı|mu|mü)/i.test(t)) return 0;
      if (!/\?/.test(t)) return 0;
      let s = 7;
      return s;
    },
  },
  {
    name: 'future-prediction-12',
    tipMatch: /^Future can also be prediction or intention/,
    keep: 1,
    score: (t) => {
      if (!futureAtEnd(t)) return 0;
      let s = 4;
      return s;
    },
  },
  {
    name: 'ablative-from-10',
    tipMatch: /^-den \/ -dan = from \/ out of \/ through/,
    keep: 2,
    score: (t) => {
      if (!new RegExp(TR_LETTER + 'd(e|a)n' + NOT_TR_LETTER, 'i').test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'ablative-hardened-9',
    tipMatch: /^Hardening: after voiceless consonants, the suffix becomes `-ten\/-tan`/,
    keep: 2,
    score: (t) => {
      if (!new RegExp('(p|ç|t|k|f|h|s|ş)' + TR_LETTER + '*t(e|a)n' + NOT_TR_LETTER, 'i').test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'ablative-cause-9',
    tipMatch: /^-den\/-dan also marks cause and comparison/,
    keep: 1,
    score: (t) => {
      if (!ABLATIVE.test(t)) return 0;
      let s = 4;
      return s;
    },
  },
  {
    name: 'ablative-verb-stem-9',
    tipMatch: /^-den\/-dan on a verb stem makes a noun/,
    keep: 1,
    score: (t) => {
      if (!new RegExp(TR_LETTER + 'm(e|a)kt(e|a)n' + NOT_TR_LETTER, 'i').test(t)) return 0;
      let s = 7;
      return s;
    },
  },
  {
    name: 'var-yok-7',
    tipMatch: /^var = there is\/are, yok = there isn't/,
    keep: 2,
    score: (t) => {
      if (!VAR_YOK.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'var-past-future-6',
    tipMatch: /^Past forms: `vardı` \(there was\)/,
    keep: 1,
    score: (t) => {
      if (!/(?:^|\s)(vardı|yoktu|olacak|olacaktı)(?:\s|$|\.|,)/i.test(t)) return 0;
      let s = 7;
      return s;
    },
  },
  {
    name: 'have-locative-var-6',
    tipMatch: /^"I have X" = locative \+ var/,
    keep: 1,
    score: (t) => {
      // Need locative pronoun + var/yok
      if (!/(?:^|\s)(bende|sende|onda|bizde|sizde|onlarda)\s+.+\s+(var|yok)(?:$|\s|\.|,)/i.test(t)) return 0;
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
  console.log('Turkish deck written; stripped:', stripped);
}
