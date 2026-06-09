#!/usr/bin/env node
/* Portuguese heavy-repeat demoter. */

const fs = require('fs');
const args = process.argv.slice(2);
const fix = args.includes('--fix');
const DECK_PATH = 'src/data/portuguese/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const PRETERITE = /\w+(ei|aste|ou|amos|astes|aram|i|este|iu|imos|istes|iram)(?:\s|[.,!?;:]|$)/i;
const IMPERFEITO = /\w+(ava|avas|ávamos|ávais|avam|ia|ias|íamos|íeis|iam)(?:\s|[.,!?;:]|$)/i;
const ART_M = /\b(o|os|um|uns)\s+\w/i;
const ART_F = /\b(a|as|uma|umas)\s+\w/i;
const PREP_ART_FUSED = /\b(do|da|dos|das|no|na|nos|nas|ao|à|aos|às|pelo|pela|pelos|pelas)\b/i;
const POR_PARA = /\b(por|para|pelo|pela|pelos|pelas)\b/i;
const A_GENTE = /\ba gente\b/i;

const RULES = [
  { name: 'comi-covers-both-106', tipMatch: /^comi covers BOTH "I ate" and "I have eaten"/, keep: 1,
    score: (t) => PRETERITE.test(t) ? 6 + (t.length<35?2:0) : 0 },
  { name: 'past-single-word-44', tipMatch: /^Past tense is a single word, no helper verb/, keep: 1,
    score: (t) => PRETERITE.test(t) ? 5 + (t.length<35?2:0) : 0 },
  { name: 'noun-gender-31', tipMatch: /^Portuguese nouns are masculine or feminine/, keep: 1,
    score: (t) => {
      if (!ART_M.test(t) && !ART_F.test(t)) return 0;
      let s = 5;
      if (ART_M.test(t) && ART_F.test(t)) s += 3;
      if (t.length < 30) s += 2;
      return s;
    },
  },
  { name: 'gender-endings-30', tipMatch: /^-o usually m \(o livro\), -a usually f/, keep: 1,
    score: (t) => /\b(o|a)\s+\w+(o|a)\b/i.test(t) ? 4 + (t.length<30?2:0) : 0 },
  { name: 'adj-agreement-30', tipMatch: /^Adjectives match the noun\. o carro vermelho/, keep: 1,
    score: (t) => /\b(o|a|os|as)\s+\w+\s+\w+(o|a|os|as)\b/i.test(t) ? 6 + (t.length<35?2:0) : 0 },
  { name: 'prep-art-fused-30', tipMatch: /^Prepositions and articles fuse: de \+ o → do/, keep: 2,
    score: (t) => PREP_ART_FUSED.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'por-para-27', tipMatch: /^por = reason \/ exchange \/ route/, keep: 1,
    score: (t) => POR_PARA.test(t) ? 5 + (t.length<30?2:0) : 0 },
  { name: 'pelo-contractions-26', tipMatch: /^por \+ o → pelo, por \+ a → pela/, keep: 1,
    score: (t) => /\b(pelo|pela|pelos|pelas)\b/i.test(t) ? 8 + (t.length<30?2:0) : 0 },
  { name: 'a-gente-informal-18a', tipMatch: /^a gente \(literally "the people"\) = informal nós/, keep: 1,
    score: (t) => A_GENTE.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'a-gente-us-folks-18', tipMatch: /^Think of a gente as "us folks"/, keep: 1,
    score: (t) => A_GENTE.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'imperfeito-18', tipMatch: /^Imperfeito \(`-ava\/-ia` endings\)/, keep: 1,
    score: (t) => IMPERFEITO.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'diminutive-inho-7', tipMatch: /^Diminutives `-inho\/-inha`/, keep: 1,
    score: (t) => /\b(cafezinho|gatinho|cachorrinho|amigo|bebezinho|momentinho|pacotinho|carrinho|casinha|sapatinhos|filhinho|mãezinha)\b/i.test(t) ? 9 : 0 },
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
