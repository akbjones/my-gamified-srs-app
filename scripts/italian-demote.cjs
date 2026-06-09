#!/usr/bin/env node
/* Italian heavy-repeat demoter. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/italian/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const ART_M = /\b(il|lo|l'|i|gli)\s+\w/i;
const ART_F = /\b(la|le|l')\s+\w/i;
const ART_LO = /\blo\s+(s|z|gn|x|y|p)/i;
const ART_L_APOS = /\bl'\w/i;
const DIMINUTIVE = /\w+(ino|ina|etto|etta|olino|olina|uccio|uccia)\b/i;
const PASSATO = /\b(ho|hai|ha|abbiamo|avete|hanno|sono|sei|è|siamo|siete)\s+\w+(ato|ito|uto|sso|tto|sto|nto)\b/i;
const PASSATO_REG = /\w+(ato|ito|uto)\b/i;
const PRESENT = /\w+(o|i|a|iamo|ate|ano|isco|ono)(?:\s|[.,!?;:]|$)/i;
const CHE_SUBJ = /\bche\s+\w+(i|a|iamo|iate|ano|abbia|sia|abbiano|siano)\b/i;
const MODAL_INF = /\b(devo|devi|deve|dobbiamo|dovete|devono|posso|puoi|può|possiamo|potete|possono|voglio|vuoi|vuole|vogliamo|volete|vogliono)\s+\w+(are|ere|ire)\b/i;
const STARE_GERUNDIO = /\b(sto|stai|sta|stiamo|state|stanno)\s+\w+(ando|endo)\b/i;
const ESSERE_AUX = /\b(sono|sei|è|siamo|siete)\s+\w+(ato|ata|ati|ate|ito|ita|iti|ite|uto|uta|uti|ute)\b/i;

const RULES = [
  {
    name: 'noun-gender-90a',
    tipMatch: /^Italian nouns are masculine or feminine\. il libro/,
    keep: 2,
    score: (t) => {
      if (!ART_M.test(t) && !ART_F.test(t)) return 0;
      let s = 5;
      if (ART_M.test(t) && ART_F.test(t)) s += 3;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'gender-endings-90',
    tipMatch: /^Endings hint at gender: -o usually m/,
    keep: 1,
    score: (t) => {
      // Demo: noun ending in -o or -a with matching article
      if (!/\b(il|la|un|una)\s+\w+(o|a)\b/i.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'three-il-lo-l-90',
    tipMatch: /^Three forms of "the" for masculine: il/,
    keep: 2,
    score: (t) => {
      // Demo: card uses lo or l' (the trickier articles)
      if (!ART_LO.test(t) && !ART_L_APOS.test(t)) return 0;
      let s = 7;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'plural-o-i-90',
    tipMatch: /^Plural: -o → -i \(libro → libri\)/,
    keep: 1,
    score: (t) => {
      // Demo: plural noun ending in -i or -e
      if (!/\b(i|gli|le)\s+\w+(i|e)(?:\s|[.,!?;:]|$)/i.test(t)) return 0;
      let s = 5;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'diminutive-affection-43',
    tipMatch: /^Italian diminutives -ino \/ -etta signal affection/,
    keep: 1,
    score: (t) => {
      // Require explicit diminutive: known diminutive words (not lexicalized ones like macchina/bicicletta)
      const TRUE_DIMINUTIVE = /\b(gattino|gattina|cagnolino|cagnolina|bambino|bambina|tavolino|fratellino|sorellina|paesino|momentino|attimino|cugino|cugina|cuginetto|cuginetta|orsetto|orsetta|caffettino|libretto|stradina|pacchettino)\b/i;
      if (!TRUE_DIMINUTIVE.test(t)) return 0;
      let s = 9;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'diminutive-reshape-43',
    tipMatch: /^Diminutives reshape nouns: tavolo → tavolino/,
    keep: 1,
    score: (t) => {
      const TRUE_DIMINUTIVE = /\b(gattino|gattina|cagnolino|cagnolina|bambino|bambina|tavolino|fratellino|sorellina|paesino|momentino|attimino|cugino|cugina|cuginetto|cuginetta|orsetto|orsetta|caffettino|libretto|stradina|pacchettino)\b/i;
      if (!TRUE_DIMINUTIVE.test(t)) return 0;
      let s = 9;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'passato-30a',
    tipMatch: /^Passato prossimo = avere or essere \+ past participle/,
    keep: 1,
    score: (t) => {
      if (!PASSATO.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'reg-participle-30',
    tipMatch: /^Regular past participles: -are → -ato/,
    keep: 1,
    score: (t) => {
      if (!PASSATO.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'drop-pronoun-29',
    tipMatch: /^Italians drop subject pronouns/,
    keep: 1,
    score: (t) => {
      // Demo: starts with a verb (no overt subject pronoun)
      if (!/^[A-Z][a-zà-ÿ]+(o|i|a|iamo|ate|ano|isco)\b/i.test(t)) return 0;
      let s = 6;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'verb-endings-29',
    tipMatch: /^Verb endings show who: mangio/,
    keep: 1,
    score: (t) => {
      if (!PRESENT.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'subj-wish-doubt-12a',
    tipMatch: /^After expressions of wish\/doubt\/opinion \+ `che`/,
    keep: 1,
    score: (t) => {
      if (!CHE_SUBJ.test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'credo-che-sia-12',
    tipMatch: /^`Credo che sia` not `credo che è`/,
    keep: 1,
    score: (t) => {
      if (!/\b(credo|penso|spero|dubito|temo)\s+che\s+\w+\s+(sia|abbia|faccia|venga|vada|stia)/i.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'subj-trigger-phrases-12',
    tipMatch: /^`È necessario che`, `bisogna che`/,
    keep: 1,
    score: (t) => {
      if (!/\b(è necessario che|bisogna che|è importante che|è meglio che)\b/i.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'modal-infinitive-9a',
    tipMatch: /^Modal verbs \(dovere, potere, volere\)/,
    keep: 1,
    score: (t) => {
      if (!MODAL_INF.test(t)) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'reflexive-modal-9',
    tipMatch: /^If a reflexive verb follows a modal/,
    keep: 1,
    score: (t) => {
      // Demo: modal + reflexive infinitive (e.g., devo svegliarmi or mi devo svegliare)
      if (!/\b(devo|posso|voglio|deve|può|vuole|dobbiamo|possiamo|vogliamo)\s+\w+(arsi|ersi|irsi)\b/i.test(t) &&
          !/\b(mi|ti|si|ci|vi)\s+(devo|devi|deve|dobbiamo|dovete|devono|posso|puoi|può|possiamo|potete|possono|voglio|vuoi|vuole|vogliamo|volete|vogliono)\s+\w+(are|ere|ire)\b/i.test(t)) return 0;
      let s = 9;
      return s;
    },
  },
  {
    name: 'stare-gerundio-4',
    tipMatch: /^`stare \+ gerundio` = English '-ing now'/,
    keep: 1,
    score: (t) => {
      if (!STARE_GERUNDIO.test(t)) return 0;
      let s = 9;
      return s;
    },
  },
  {
    name: 'stare-this-moment-4',
    tipMatch: /^Only use `stare \+ -ando\/-endo` for emphasis/,
    keep: 1,
    score: (t) => {
      if (!STARE_GERUNDIO.test(t)) return 0;
      let s = 7;
      return s;
    },
  },
  {
    name: 'essere-movement-4a',
    tipMatch: /^Past tense with movement\/change verbs uses `essere`/,
    keep: 1,
    score: (t) => {
      if (!ESSERE_AUX.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'essere-agreement-4',
    tipMatch: /^Auxiliary `essere` triggers agreement/,
    keep: 1,
    score: (t) => {
      // Need essere + participle with gender/number ending
      if (!/\b(sono|sei|è|siamo|siete)\s+\w+(ata|ati|ate|ita|iti|ite|uta|uti|ute)\b/i.test(t)) return 0;
      let s = 9;
      return s;
    },
  },
  {
    name: 'movement-essere-list-4',
    tipMatch: /^Movement and change verbs \(andare, venire/,
    keep: 1,
    score: (t) => {
      // Need essere + andato/venuto/partito/diventato form
      if (!/\b(sono|sei|è|siamo|siete)\s+(andat|venut|partit|nat|mort|diventat|stat)/i.test(t)) return 0;
      let s = 9;
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
  console.log('Italian deck written; stripped:', stripped);
}
