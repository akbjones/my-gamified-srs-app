#!/usr/bin/env node
/* Dutch heavy-repeat demoter. */

const fs = require('fs');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

const DECK_PATH = 'src/data/dutch/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Dutch only uses Latin chars + some diacritics, but mostly standard letters.
// JS \b works for Dutch (no å/ä/ö etc. issues — except for ë, é, ï).
const DE = /\bde\s+/i;
const HET = /\bhet\s+/i;
const POSSESSIVE = /\b(mijn|jouw|je|zijn|haar|onze|ons|jullie|hun)\b/i;
const ONS = /\bons\s+\w/i;
const ONZE = /\bonze\s+\w/i;
const MODAL = /\b(moet|moeten|kan|kunnen|wil|willen|mag|mogen|zal|zullen|wou|wilde)\b/i;
const ZOU_GRAAG = /zou graag/i;
const OMDAT = /\bomdat\b/i;
const WANT = /\bwant\b/i;
const SUBORD = /\b(dat|omdat|als|terwijl|nadat|voordat|hoewel|wanneer|zodra|tenzij)\b/i;
const GEEN = /\bgeen\b/i;
const NIET = /\bniet\b/i;
const HEBBEN_PAST_PART = /\b(heb|hebt|heeft|hebben|had|hadden)\s+\w*(\s+\w+)*\s+ge\w+(t|d|en)\b/i;
const ZIJN_PAST_PART = /\b(ben|bent|is|zijn|was|waren)\s+\w*(\s+\w+)*\s+ge\w+(t|d|en)\b/i;

const RULES = [
  {
    name: 'gender-de-het-179a',
    tipMatch: /^Dutch has two genders: de \(common, ~75% of nouns\)/,
    keep: 1,
    score: (t) => {
      // Need both de and het in card, or strong demo of one
      if (!DE.test(t) && !HET.test(t)) return 0;
      let s = 4;
      if (DE.test(t) && HET.test(t)) s += 3;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'plural-always-de-179',
    tipMatch: /^Plural is always de: het kind/,
    keep: 1,
    score: (t) => {
      // Demo: card with both het + singular and de + plural, OR de + plural
      if (!/de\s+\w+(en|s)(?!\w)/i.test(t)) return 0;
      let s = 5;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'possessives-51',
    tipMatch: /^Possessives: mijn \(my\), jouw \/ je \(your\)/,
    keep: 1,
    score: (t) => {
      if (!POSSESSIVE.test(t)) return 0;
      let s = 4;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  {
    name: 'ons-vs-onze-50',
    tipMatch: /^ons vs onze: ons only before singular het-words/,
    keep: 2,
    score: (t) => {
      // Possessive ons: at sentence start (capitalized) + noun, OR
      // before specific het-words. Excludes reflexive uses.
      const possOns = /^Ons\s+\w+/.test(t) ||
        /\bons\s+(huis|gezin|hoofd|kantoor|boek|bed|brood|kind|land|water|woord|jaar|uur|been|oog|oor|hart|feest|team|idee|feit|licht|recht|vuur|volk|gebouw|park|strand|leven|werk|geld|spel|raam|haar|vlees|been)\b/i.test(t);
      const possOnze = /^Onze\s+\w+/.test(t) || /\bonze\s+\w+/i.test(t);
      if (!possOns && !possOnze) return 0;
      let s = 7;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'modal-verb-end-37',
    tipMatch: /^Modal verb sits second; the main verb jumps to the END/,
    keep: 2,
    score: (t) => {
      // Demo: modal + ... + infinitive at end
      if (!MODAL.test(t)) return 0;
      // Verb at end (ending in -en)
      if (!/\w+en[.!?]?$/i.test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'zou-graag-37',
    tipMatch: /^Polite alternative to `willen`: `Ik zou graag…`/,
    keep: 2,
    score: (t) => {
      if (!ZOU_GRAAG.test(t)) return 0;
      let s = 8;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'omdat-vs-want-34',
    tipMatch: /^Tricky: `omdat` \(because\) sends the verb back/,
    keep: 2,
    score: (t) => {
      // Demo: contains omdat AND verb at end, OR want with verb in 2nd position
      if (OMDAT.test(t)) {
        // Verb at end after omdat clause
        if (!/omdat\s+\w+\s+\w+(\s+\w+)*\s+\w+(t|en|d)[.!?]?$/i.test(t)) return 0;
        let s = 9;
        if (t.length < 50) s += 2;
        return s;
      }
      if (WANT.test(t)) {
        let s = 6;
        if (t.length < 40) s += 2;
        return s;
      }
      return 0;
    },
  },
  {
    name: 'subord-verb-end-30',
    tipMatch: /^Subordinating conjunctions \(`dat`, `omdat`, `als`, `terwijl`/,
    keep: 1,
    score: (t) => {
      if (!SUBORD.test(t)) return 0;
      // Verb at end
      if (!/\w+(en|d|t)[.!?]?$/i.test(t)) return 0;
      let s = 5;
      if (t.length < 50) s += 2;
      return s;
    },
  },
  {
    name: 'geen-vs-niet-18a',
    tipMatch: /^`geen` negates a noun without article/,
    keep: 2,
    score: (t) => {
      if (!GEEN.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'no-x-vs-not-18',
    tipMatch: /^If you'd say 'no X' in English, use `geen X`/,
    keep: 1,
    score: (t) => {
      if (!GEEN.test(t)) return 0;
      let s = 6;
      if (t.length < 35) s += 2;
      return s;
    },
  },
  {
    name: 'v2-7',
    tipMatch: /^Dutch follows V2 like German/,
    keep: 1,
    score: (t) => {
      // Card starts with non-subject adverb + verb + subject
      if (!/^(Vandaag|Morgen|Gisteren|Nu|Daar|Hier|Soms|Vaak|Altijd|In|Op|Met)\s+\w+\s+(ik|je|jij|hij|zij|wij|jullie|ze)\b/i.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'inversion-7',
    tipMatch: /^Inversion is mandatory: if anything but the subject is first/,
    keep: 1,
    score: (t) => {
      // Same as V2 detection
      if (!/^(Vandaag|Morgen|Gisteren|Nu|Daar|Hier|Soms|Vaak|Altijd|In|Op|Met|Misschien)\s+\w+\s+(ik|je|jij|hij|zij|wij|jullie|ze)\b/i.test(t)) return 0;
      let s = 8;
      return s;
    },
  },
  {
    name: 'perfect-hebben-zijn-5',
    tipMatch: /^Perfect = `hebben\/zijn` \+ past participle/,
    keep: 1,
    score: (t) => {
      if (!HEBBEN_PAST_PART.test(t) && !ZIJN_PAST_PART.test(t)) return 0;
      let s = 7;
      if (t.length < 40) s += 2;
      return s;
    },
  },
  {
    name: 'participle-t-d-5',
    tipMatch: /^Participle endings: -t for most/,
    keep: 1,
    score: (t) => {
      // Card has a past participle ge-X-t or ge-X-d
      if (!/\bge\w+(t|d)\b/i.test(t)) return 0;
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
  console.log('Dutch deck written; stripped:', stripped);
}
