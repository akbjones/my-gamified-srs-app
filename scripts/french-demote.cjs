#!/usr/bin/env node
/* French heavy-repeat demoter. */

const fs = require('fs');
const args = process.argv.slice(2);
const fix = args.includes('--fix');
const DECK_PATH = 'src/data/french/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const ART_M = /\b(le|les|un|des|du)\s+\w/i;
const ART_F = /\b(la|les|une|de la)\s+\w/i;
const L_APOS = /\bl'\w/i;
const PASSE_COMPOSE = /\b(j'ai|tu as|il a|elle a|on a|nous avons|vous avez|ils ont|elles ont|je suis|tu es|il est|elle est|nous sommes|vous êtes|ils sont|elles sont)\s+\w+(é|i|u|s|t)\b/i;
const ETRE_AGREED = /\b(suis|es|est|sommes|êtes|sont)\s+\w+(ée|és|ées|ie|ies|us|ues)\b/i;

const RULES = [
  { name: 'noun-gender-73a', tipMatch: /^French nouns are masculine or feminine, even objects/, keep: 1,
    score: (t) => {
      if (!ART_M.test(t) && !ART_F.test(t)) return 0;
      let s = 5;
      if (ART_M.test(t) && ART_F.test(t)) s += 3;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  { name: 'gender-endings-73', tipMatch: /^Ending hints: -e often f \(la voiture\)/, keep: 1,
    score: (t) => /\b(le|la)\s+\w+(e|au|eau)\b/i.test(t) ? 5 + (t.length<30?2:0) : 0 },
  { name: 'adj-agreement-73', tipMatch: /^Adjectives match the noun/, keep: 1,
    score: (t) => /\b(un|une|des|le|la|les)\s+\w+\s+\w+(e|s|es)\b/i.test(t) ? 6 + (t.length<35?2:0) : 0 },
  { name: 'le-la-apostrophe-73', tipMatch: /^le \/ la → l' before a vowel/, keep: 1,
    score: (t) => L_APOS.test(t) ? 7 + (t.length<30?2:0) : 0 },
  { name: 'passe-compose-14a', tipMatch: /^Passé composé = avoir or être \+ past participle/, keep: 1,
    score: (t) => PASSE_COMPOSE.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'reg-participle-14', tipMatch: /^Regular past participles: -er → -é/, keep: 1,
    score: (t) => PASSE_COMPOSE.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'pp-agree-with-object-13', tipMatch: /^Past participle agrees with the direct object ONLY when it comes BEFORE/, keep: 1,
    score: (t) => /\b(que|qu')\s+\w*\s*j'ai\s+\w+(ée|és|ées)\b/i.test(t) ? 9 : 0 },
  { name: 'modal-inf-5a', tipMatch: /^Modals \(vouloir, pouvoir, devoir\)/, keep: 1,
    score: (t) => /\b(veux|veut|peut|peux|peuvent|dois|doit|doivent|voulons|voulez|veulent|pouvons|pouvez|devons|devez)\s+\w+(er|ir|re)\b/i.test(t) ? 8 + (t.length<35?2:0) : 0 },
  { name: 'je-apostrophe-5', tipMatch: /^je → j' before a vowel/, keep: 1,
    score: (t) => /\bj'(a|e|i|o|u|h)/i.test(t) ? 8 + (t.length<30?2:0) : 0 },
  { name: 'elisions-5', tipMatch: /^More elisions: ne → n'/, keep: 1,
    score: (t) => /\b(n'|m'|t'|s'|l'|d'|qu')[aeiouàâéèêëïôöùüy]/i.test(t) ? 7 + (t.length<35?2:0) : 0 },
];

const removedCardIds = new Set();
for (const rule of RULES) {
  const hosts = deck.filter(c => c.grammar && rule.tipMatch.test(c.grammar));
  if (!hosts.length) { console.log('  ! ' + rule.name + ': no hosts'); continue; }
  const scored = hosts.map(c => ({ card: c, score: rule.score(c.target) }));
  scored.sort((a, b) => (b.score - a.score) || String(a.card.id).localeCompare(String(b.card.id)));
  const eligible = scored.filter(s => s.score > 0).slice(0, rule.keep);
  const keepIds = new Set(eligible.map(s => s.card.id));
  const removeIds = scored.filter(s => !keepIds.has(s.card.id)).map(s => s.card.id);
  for (const id of removeIds) removedCardIds.add(id);
  console.log('  ' + rule.name.padEnd(28) + ' hosts=' + String(hosts.length).padStart(3) +
              ' kept=' + eligible.length + ' strip=' + removeIds.length +
              (eligible.length ? '  best: ' + [...keepIds].slice(0,2).join(',') : '  NONE'));
}
console.log('\nTotal:', removedCardIds.size);
if (fix) {
  let n = 0;
  for (const c of deck) if (removedCardIds.has(c.id)) { delete c.grammar; n++; }
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
  console.log('Stripped:', n);
}
