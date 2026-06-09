#!/usr/bin/env node
/* German heavy-repeat demoter. */

const fs = require('fs');
const args = process.argv.slice(2);
const fix = args.includes('--fix');
const DECK_PATH = 'src/data/german/deck.json';
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const DER_DIE_DAS = /\b(der|die|das|den|dem|des)\s+\w/i;
const MIT_VON_etc = /\b(mit|aus|bei|nach|von|zu|seit|gegenüber)\s+(dem|der|einem|einer)/i;
const FUR_DURCH = /\b(für|durch|gegen|ohne|um|bis|wider)\s+(den|die|das|einen|eine)/i;
const MODAL = /\b(muss|musst|müssen|kann|kannst|können|will|willst|wollen|mag|magst|mögen|soll|sollst|sollen|darf|darfst|dürfen|möchte|möchtest|möchten)\b/i;
const SUBORD_VERB_END = /\b(dass|weil|wenn|ob|obwohl|während|nachdem|bevor|sobald|damit)\s+\w+(\s+\w+){2,}\s+\w+(t|en|st)[.!?]?$/i;

const RULES = [
  { name: 'der-die-das-100a', tipMatch: /^German has 3 "the" words: der \(m\), die \(f\), das \(n\)/, keep: 1,
    score: (t) => DER_DIE_DAS.test(t) ? 5 + (t.length<30?2:0) : 0 },
  { name: 'the-by-role-100', tipMatch: /^"The" forms by role: subject = der\/die\/das/, keep: 1,
    score: (t) => /\b(den|dem|des)\s+\w/i.test(t) ? 8 + (t.length<35?2:0) : 0 },
  { name: 'mit-dem-14', tipMatch: /^After mit \/ aus \/ bei \/ nach \/ von \/ zu \/ seit \/ gegenüber, the article shifts to dem/, keep: 2,
    score: (t) => MIT_VON_etc.test(t) ? 8 + (t.length<35?2:0) : 0 },
  { name: 'mit-chant-13a', tipMatch: /^Chant it: mit, aus, bei, nach, von, zu, seit, gegenüber/, keep: 1,
    score: (t) => MIT_VON_etc.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'mit-expect-dem-13', tipMatch: /^After mit\/aus\/bei\/nach\/von\/zu\/seit\/gegenüber expect dem/, keep: 1,
    score: (t) => MIT_VON_etc.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'fur-durch-13a', tipMatch: /^After für \/ durch \/ gegen \/ ohne \/ um \/ bis \/ wider, the article goes to den/, keep: 1,
    score: (t) => FUR_DURCH.test(t) ? 8 + (t.length<35?2:0) : 0 },
  { name: 'fur-accusative-13', tipMatch: /^für always takes the direct-object form/, keep: 1,
    score: (t) => /\bfür\s+(mich|dich|den|einen|sie|ihn)\b/i.test(t) ? 8 + (t.length<30?2:0) : 0 },
  { name: 'modal-verb-end-11a', tipMatch: /^Modal verb in position 2, main verb at the END/, keep: 1,
    score: (t) => {
      if (!MODAL.test(t)) return 0;
      if (!/\w+en[.!?]?$/i.test(t)) return 0;
      return 7 + (t.length<40?2:0);
    },
  },
  { name: 'mochte-polite-11', tipMatch: /^möchte \(would like\) is polite/, keep: 1,
    score: (t) => /\b(möchte|möchtest|möchten|möchtet)\b/i.test(t) ? 9 + (t.length<35?2:0) : 0 },
  { name: 'modal-irregular-11', tipMatch: /^Modals are irregular: ich kann/, keep: 1,
    score: (t) => /\b(ich kann|er kann|sie kann|ich muss|er muss|ich will|er will|ich mag|er mag|ich soll|er soll|ich darf|er darf)\b/i.test(t) ? 9 + (t.length<30?2:0) : 0 },
  { name: 'three-genders-9', tipMatch: /^German has THREE genders: `der` \(m\)/, keep: 1,
    score: (t) => DER_DIE_DAS.test(t) ? 5 + (t.length<30?2:0) : 0 },
  { name: 'articles-encode-case-9', tipMatch: /^Articles also encode CASE/, keep: 1,
    score: (t) => /\b(den|dem|des)\s+\w/i.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'gender-endings-9', tipMatch: /^Quick gender hints from endings/, keep: 1,
    score: (t) => /\w+(ung|heit|keit|schaft|tät|chen|lein|ismus|or|er|ling)\b/i.test(t) ? 8 + (t.length<35?2:0) : 0 },
  { name: 'prep-case-fixed-8', tipMatch: /^After prepositions, the case is fixed/, keep: 1,
    score: (t) => MIT_VON_etc.test(t) || FUR_DURCH.test(t) ? 6 + (t.length<35?2:0) : 0 },
  { name: 'du-sie-formality-7a', tipMatch: /^German has TWO 'you's: `du` \(informal/, keep: 1,
    score: (t) => /\b(du|Sie|ihr)\b/.test(t) ? 5 + (t.length<25?2:0) : 0 },
  { name: 'sie-capital-7', tipMatch: /^Sie \(you formal\) looks like sie/, keep: 1,
    score: (t) => /\bSie\s+(sind|haben|werden|können|möchten|wollen)\b/.test(t) ? 8 + (t.length<30?2:0) : 0 },
  { name: 'default-sie-7', tipMatch: /^Default to `Sie` with anyone you'd address/, keep: 1,
    score: (t) => /\b(du|Sie|ihr)\b/.test(t) ? 5 : 0 },
  { name: 'plural-ihr-sie-7', tipMatch: /^Plural: ihr \(informal, you guys\) vs Sie/, keep: 1,
    score: (t) => /\b(ihr|euch)\b/i.test(t) ? 7 + (t.length<35?2:0) : 0 },
  { name: 'subord-verb-end-7', tipMatch: /^Subordinating conjunctions \(`dass`, `weil`, `wenn`, `ob`, `obwohl`\)/, keep: 1,
    score: (t) => SUBORD_VERB_END.test(t) ? 9 + (t.length<50?2:0) : 0 },
  { name: 'relative-pronoun-5', tipMatch: /^Relative pronouns match the noun's gender/, keep: 1,
    score: (t) => /\b\w+,\s*(der|die|das|den|dem|denen|deren)\s+\w/i.test(t) ? 8 + (t.length<50?2:0) : 0 },
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
