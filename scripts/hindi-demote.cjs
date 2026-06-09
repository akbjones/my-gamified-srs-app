#!/usr/bin/env node
/* Hindi heavy-repeat demoter. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/hindi/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Hindi word boundary helpers — JS \b doesn't work with Devanagari.
// Use space/sentence-start/punctuation as boundaries.
const HB_START = '(?:^|\\s)'; // before the word
const HB_END = '(?:\\s|$|[।.!?,])'; // after the word

// Present-tense verb form: stem + ता/ती/ते + है/हैं/हो/हूँ
const PRESENT_VERB = /[ऀ-ॿ]+(ता|ती|ते)\s+(है|हैं|हो|हूँ)/;
// ने (ne) as standalone particle after a noun
const NE_PARTICLE = new RegExp(HB_START + 'ने' + HB_END);
// ने fused with pronouns
const NE_PRONOUN = /(मैंने|तुमने|आपने|उसने|उन्होंने|हमने)/;
// Copula at sentence end
const COPULA = /(है|हैं|हो|हूँ|था|थी|थे|थीं)\s*[।.!?]?\s*$/m;
// Postpositions (standalone)
const POSTPOSITIONS = new RegExp(HB_START + '(में|पर|से|को|तक)' + HB_END + '|के\\s+(लिए|पास|साथ|बाद|बारे)');
const POSTPOS_KO = new RegExp(HB_START + 'को' + HB_END);
// Oblique form for masculine -आ → -ए before postposition
const OBLIQUE_MASC = /[ऀ-ॿ]+े\s+(में|पर|से|को|तक|के\s+लिए|के\s+पास|के\s+साथ)/;
// भी (also/even)
const BHI = new RegExp(HB_START + 'भी' + HB_END);

const RULES = [
  {
    name: 'present-gender-54a',
    tipMatch: /^Verbs change with the SPEAKER's gender/,
    keep: 2,
    score: (t) => {
      // Need present verb form -ता/-ती/-ते + auxiliary
      if (!PRESENT_VERB.test(t)) return 0;
      let s = 5;
      if (t.length < 45) s += 2;
      return s;
    },
  },
  {
    name: 'present-endings-54',
    tipMatch: /^Three present endings: -ता \(-ta, m sg\)/,
    keep: 2,
    score: (t) => {
      if (!PRESENT_VERB.test(t)) return 0;
      let s = 5;
      if (t.length < 45) s += 2;
      return s;
    },
  },
  {
    name: 'gender-mismatch-warning-54',
    tipMatch: /^Common mistake: a woman saying/,
    keep: 1,
    score: (t) => {
      // Demo: मैं + present feminine (...ती हूँ)
      if (!/मैं\b/.test(t)) return 0;
      if (!/ती\s+हूँ/.test(t)) return 0;
      let s = 7;
      if (t.length < 45) s += 2;
      return s;
    },
  },
  {
    name: 'polite-aap-te-54',
    tipMatch: /^For polite आप or plural, use -ते/,
    keep: 2,
    score: (t) => {
      // Demo: आप/हम + ...ते हैं anywhere
      if (!/(आप|हम)/.test(t)) return 0;
      if (!/ते\s+हैं/.test(t)) return 0;
      let s = 7;
      if (t.length < 45) s += 2;
      return s;
    },
  },
  {
    name: 'third-person-gender-54',
    tipMatch: /^Third-person verbs still mark gender/,
    keep: 2,
    score: (t) => {
      // Demo: third-person subject + gendered verb at end
      if (!/(राम|सीता|वह|यह|वो|मेरे|मेरी|मेरा|उसक|पिता|माता|दादा|दादी|भाई|बहन|बेटा|बेटी)/.test(t)) return 0;
      if (!/(ता|ती|ते)\s+(है|हैं)/.test(t)) return 0;
      let s = 6;
      if (t.length < 45) s += 2;
      return s;
    },
  },
  {
    name: 'copula-ending-48',
    tipMatch: /^Hindi ends sentences with है/,
    keep: 1,
    score: (t) => {
      if (!COPULA.test(t)) return 0;
      let s = 4;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'copula-position-47a',
    tipMatch: /^है \/ हैं \/ हूँ \/ हो/,
    keep: 1,
    score: (t) => {
      if (!COPULA.test(t)) return 0;
      let s = 4;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'copula-mandatory-47',
    tipMatch: /^Never drop है\/हैं\/हूँ/,
    keep: 1,
    score: (t) => {
      if (!COPULA.test(t)) return 0;
      let s = 4;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'copula-by-subject-47',
    tipMatch: /^Pick auxiliary by subject/,
    keep: 2,
    score: (t) => {
      // Demo: a sentence with subject + auxiliary that match
      if (!COPULA.test(t)) return 0;
      let s = 4;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'ne-past-tense-22',
    tipMatch: /^In past tense for action verbs, add ने/,
    keep: 2,
    score: (t) => {
      if (!NE_PRONOUN.test(t) && !NE_PARTICLE.test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'ne-action-only-22',
    tipMatch: /^ने \(ne\) only for action-on-something verbs/,
    keep: 2,
    score: (t) => {
      if (!NE_PRONOUN.test(t) && !NE_PARTICLE.test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'ne-object-agreement-22',
    tipMatch: /^After ने, the verb agrees with the OBJECT/,
    keep: 2,
    score: (t) => {
      // Need ne (particle or pronoun) + verb with feminine -ई ending
      if (!NE_PRONOUN.test(t) && !NE_PARTICLE.test(t)) return 0;
      // Feminine object agreement: verb ends in ई/ईं at sentence end (skip masc या)
      if (!/(ाई|ी|यी|ईं)\s*[।.!?]?\s*$/m.test(t)) return 0;
      let s = 7;
      if (t.length < 45) s += 2;
      return s;
    },
  },
  {
    name: 'ne-ko-default-masc-22',
    tipMatch: /^If the object has its own `को` marker, the verb defaults/,
    keep: 1,
    score: (t) => {
      if ((!NE_PRONOUN.test(t) && !NE_PARTICLE.test(t)) || !POSTPOS_KO.test(t)) return 0;
      let s = 8;
      if (t.length < 45) s += 2;
      return s;
    },
  },
  {
    name: 'postposition-after-noun-21',
    tipMatch: /^Hindi position words come AFTER the noun/,
    keep: 1,
    score: (t) => {
      if (!POSTPOSITIONS.test(t)) return 0;
      let s = 4;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'common-postpositions-21',
    tipMatch: /^Common position words: में \(in\), पर \(on\)/,
    keep: 1,
    score: (t) => {
      if (!POSTPOSITIONS.test(t)) return 0;
      let s = 4;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'ke-compounds-21',
    tipMatch: /^के \+ word = common compounds/,
    keep: 2,
    score: (t) => {
      if (!/के\s+(लिए|पास|साथ|बाद|बारे|ऊपर|नीचे|सामने|पीछे|बीच)/.test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'oblique-shift-21',
    tipMatch: /^Before a position word, a -ा masculine noun shifts/,
    keep: 2,
    score: (t) => {
      // Demo: masculine -ा noun → -े before postposition
      if (!OBLIQUE_MASC.test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'three-word-for-21',
    tipMatch: /^'For the boy' needs THREE Hindi words/,
    keep: 1,
    score: (t) => {
      // Oblique noun (ending in ए vowel sign) + के + relation word
      if (!/[ऀ-ॿ]*े\s+के\s+(लिए|पास|साथ|बाद)/.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'ne-subject-forms-21',
    tipMatch: /^Subject forms with ने: मैंने/,
    keep: 1,
    score: (t) => {
      // Demo: card uses a fused ne-pronoun (मैंने, तुमने etc.)
      if (!NE_PRONOUN.test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'sov-11',
    tipMatch: /^Hindi is SOV/,
    keep: 1,
    score: (t) => {
      if (!COPULA.test(t)) return 0;
      let s = 4;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'aux-end-11',
    tipMatch: /^Auxiliaries \(है\/हैं\/था\/थी\/हो\) come at the very end/,
    keep: 1,
    score: (t) => {
      // Need progressive verb (रहा/रही/रहे) + copula at sentence end
      if (!/(रहा|रही|रहे)\s+(है|हैं|हो|हूँ|था|थी|थे|थीं)\s*[।.!?]?\s*$/m.test(t)) return 0;
      let s = 7;
      return s;
    },
  },
  {
    name: 'long-pile-before-verb-11',
    tipMatch: /^For long sentences, pile everything before/,
    keep: 1,
    score: (t) => {
      // Demo: a long sentence with the verb at end
      if (t.length < 50) return 0;
      if (!COPULA.test(t)) return 0;
      let s = 5;
      return s;
    },
  },
  {
    name: 'question-words-in-place-11',
    tipMatch: /^Question words go where the answer would go/,
    keep: 1,
    score: (t) => {
      // Demo: question with question word + ?
      if (!/(क्या|कब|कहाँ|कैसे|कौन|किसका|क्यों|कितने|कितना|कितनी)/.test(t) || !/\?/.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'ka-ki-ke-of-8',
    tipMatch: /^का \/ की \/ के = of/,
    keep: 1,
    score: (t) => {
      // Demo: owner + ka/ki/ke + owned
      if (!/[ऀ-ॿ]+\s+(का|की|के)\s+[ऀ-ॿ]+/.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'ka-ki-ke-gender-7',
    tipMatch: /^Pick का \/ की \/ के by the gender/,
    keep: 1,
    score: (t) => {
      if (!/[ऀ-ॿ]+\s+(का|की|के)\s+[ऀ-ॿ]+/.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'possessive-pronouns-7',
    tipMatch: /^Possessives by pronoun: मेरा \(my\)/,
    keep: 1,
    score: (t) => {
      // Demo: a possessive pronoun + noun
      const hasPossessive = /(मेरा|मेरी|मेरे|तुम्हारा|तुम्हारी|तुम्हारे|उसका|उसकी|उसके|हमारा|हमारी|हमारे|आपका|आपकी|आपके)/.test(t);
      if (!hasPossessive) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'ke-postpos-7',
    tipMatch: /^`के \+ postposition` is everywhere/,
    keep: 1,
    score: (t) => {
      if (!/के\s+(लिए|पास|साथ|बाद|बारे)/.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
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
  console.log('Hindi deck written; stripped:', stripped);
}
