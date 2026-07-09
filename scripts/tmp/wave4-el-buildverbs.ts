/** Emit wave4-el-verbs-A.json = new lemmas whose engine forms appear in cards. */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { conjugate, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const HERE = dirname(fileURLToPath(import.meta.url));
const bareOf = (t: string) => stripAccents(normalizeGreek(t));
const STRIP_NON_GREEK = /[^Ͱ-Ͽἀ-῿]/g;

const cards: { target: string }[] = JSON.parse(readFileSync(join(HERE, 'wave4-el-cards-A.json'), 'utf8'));
const known: string[] = JSON.parse(readFileSync(join(HERE, '_el_knownverbs.json'), 'utf8'));
const knownSet = new Set(known.map(bareOf));

const cardToks = new Set<string>();
for (const c of cards)
  for (const raw of c.target.split(/\s+/)) {
    const t = normalizeGreek(raw.replace(STRIP_NON_GREEK, ''));
    if (t) cardToks.add(bareOf(t));
  }

const CANDIDATES = [
  'επισυνάπτω', 'αναφέρομαι', 'αποταμιεύω', 'διοικώ', 'δηλώνω', 'φορολογώ',
  'σπαταλάω', 'στοιχίζω', 'υπολογίζω', 'χρεώνω', 'πιστώνω', 'εξαργυρώνω',
  'δανείζω', 'δανείζομαι', 'εξοφλώ', 'γλυτώνω', 'καταθέτω', 'ενημερώνω',
  'εξηγώ', 'λήγω', 'μειώνω', 'προσθέτω', 'προσλαμβάνω', 'αναλαμβάνω',
  'προσφέρω', 'απολύω', 'εκπαιδεύω', 'επενδύω', 'μεταφέρω', 'αποσύρω',
  'διορίζω', 'απασχολώ',
];

const used: string[] = [];
const unused: string[] = [];
const nullConj: string[] = [];
for (const lemma of CANDIDATES) {
  if (knownSet.has(bareOf(lemma))) continue; // already in engine
  const t = conjugate(lemma);
  if (!t) { nullConj.push(lemma); continue; }
  const forms = new Set<string>([bareOf(lemma)]);
  for (const row of Object.values(t.tenses))
    for (const f of row)
      for (const piece of f.split(/\s+/)) { const b = bareOf(piece); if (b !== 'θα') forms.add(b); }
  const hits = [...forms].filter((f) => cardToks.has(f));
  if (hits.length) { used.push(lemma); console.log(`  ${lemma} <- ${hits.join(', ')}`); }
  else unused.push(lemma);
}
used.sort((a, b) => a.localeCompare(b, 'el'));
writeFileSync(join(HERE, 'wave4-el-verbs-A.json'), JSON.stringify(used, null, 1));
console.log('USED verbs-A:', used.length, used.join(', '));
console.log('UNUSED (dropped):', unused.join(', '));
console.log('NULL-conjugate:', nullConj.join(', '));
