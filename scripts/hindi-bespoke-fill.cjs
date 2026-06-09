#!/usr/bin/env node
/* Hindi bespoke tip fill. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/hindi/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const FILLS = [
  {
    tip: 'Common mistake: a woman saying `मैं करता हूँ` (mai karta hun, m. form) sounds wrong. Match verb gender to the speaker — women say `मैं करती हूँ` (mai karti hun).',
    detect: (t) => /मैं\s/.test(t) && /ती\s+हूँ/.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: '`के + word` makes compound postpositions: `के लिए` (ke liye = for), `के पास` (ke paas = near), `के साथ` (ke saath = with). Learn each as one chunk.',
    detect: (t) => /के\s+(लिए|पास|साथ|बाद|बारे)/.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
    max: 2,
  },
  {
    tip: '"For the boy" needs THREE Hindi words: `लड़के के लिए` (ladke ke liye). Owner-in-oblique + linker `के` + relation word.',
    detect: (t) => /[ऀ-ॿ]*े\s+के\s+(लिए|पास|साथ)/.test(t),
    score: (t) => {
      let s = 8;
      if (t.length < 40) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Subject forms with `ने` fuse with pronouns: `मैंने` (I), `तुमने` (you), `आपने` (you-resp), `उसने` (he/she), `उन्होंने` (they). Used only with action-past verbs.',
    detect: (t) => /(मैंने|तुमने|आपने|उसने|उन्होंने|हमने)/.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Auxiliaries (`है/हैं/था/थी/हो`) come at the very end, AFTER the main verb. `राम घर जा रहा है` (Ram home going is) = Ram is going home.',
    detect: (t) => /(रहा|रही|रहे)\s+(है|हैं|था|थी|थे|थीं)\s*[।.!?]?\s*$/m.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 50) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'For long sentences, pile everything before the verb: time, place, object. `कल मेरा भाई स्कूल में पढ़ाई करेगा` (Yesterday my brother at-school study will-do).',
    detect: (t) => t.length > 50 && /(है|हैं|था|थी|थे|थीं|हो|हूँ|गा|गी|गे)\s*[।.!?]?\s*$/m.test(t),
    score: (t) => {
      let s = 5;
      if (t.length > 60) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Question words go where the answer would go, not at the start. `तुम कहाँ जा रहे हो?` (You where going?) — `कहाँ` sits where the place answer would.',
    detect: (t) => /(क्या|कब|कहाँ|कैसे|कौन|किसका|क्यों|कितन)/.test(t) && /\?/.test(t),
    score: (t) => {
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
    max: 1,
  },
  {
    tip: 'Possessives by pronoun: `मेरा` (my), `तुम्हारा` (your), `उसका` (his/her). They gender-agree with the THING owned, not the owner. `मेरा घर` (m), `मेरी किताब` (f).',
    detect: (t) => /(मेरा|मेरी|मेरे|तुम्हारा|तुम्हारी|तुम्हारे|उसका|उसकी|उसके|आपका|आपकी|आपके)\s+[ऀ-ॿ]/.test(t),
    score: (t) => {
      let s = 6;
      if (t.length < 35) s += 2;
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
  console.log('Hindi deck written; filled:', filled);
}
