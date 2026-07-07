/**
 * Self-test for German findInfinitive (src/data/conjugation/de.ts).
 * For every verb token in the German deck, resolve a lemma via
 * dictionary lemma || findInfinitive, then check the token appears in
 * conjugate(lemma)'s table (multi-word forms are split into words).
 *
 * Run: npx tsx scripts/tmp/selftest-de.ts
 */
import { readFileSync } from 'node:fs';
import { conjugate, findInfinitive } from '../../src/data/conjugation/de';
import { lookupWord } from '../../src/data/dictionary/de';

interface Card { target: string }

const deck: Card[] = JSON.parse(
  readFileSync(new URL('../../src/data/german/deck.json', import.meta.url), 'utf8'),
);

function tableContains(lemma: string | null, token: string): boolean {
  if (!lemma) return false;
  const t = token.toLowerCase();
  if (lemma.toLowerCase() === t) return true;
  const table = conjugate(lemma);
  if (!table) return false;
  if (table.infinitive.toLowerCase() === t) return true;
  for (const forms of Object.values(table.tenses)) {
    for (const form of forms) {
      const lf = form.toLowerCase();
      if (lf === t) return true;
      if (lf.includes(' ') && lf.split(' ').includes(t)) return true;
    }
  }
  return false;
}

let totalBefore = 0, passBefore = 0;
let totalAfter = 0, passAfter = 0;
const failCounts = new Map<string, number>();
const failExample = new Map<string, string>();
const failBySource = { 'dict-lemma': 0, 'findInf': 0 };
const findInfFails = new Map<string, number>();
const findInfLemma = new Map<string, string>();

for (const card of deck) {
  const tokens = card.target.split(/[^A-Za-zÄÖÜäöüß]+/).filter(Boolean);
  for (const raw of tokens) {
    const token = raw.toLowerCase();
    if (token.length < 2) continue;
    const entry = lookupWord(token);
    if (!entry || entry.pos !== 'v') continue;

    // BEFORE: dictionary lemma only (no fallback at all)
    totalBefore++;
    if (entry.lemma && tableContains(entry.lemma, token)) passBefore++;

    // AFTER: lemma || findInfinitive
    totalAfter++;
    const lemma = entry.lemma || findInfinitive(token);
    if (tableContains(lemma, token)) {
      passAfter++;
    } else {
      failCounts.set(token, (failCounts.get(token) ?? 0) + 1);
      const src = entry.lemma ? 'dict-lemma' : 'findInf';
      failBySource[src]++;
      if (src === 'findInf') {
        findInfFails.set(token, (findInfFails.get(token) ?? 0) + 1);
        findInfLemma.set(token, lemma ?? 'null');
      }
      if (!failExample.has(token)) {
        failExample.set(token, `${lemma ?? 'null'} [${src}]`);
      }
    }
  }
}

const pct = (p: number, t: number) => t ? ((100 * p) / t).toFixed(2) : 'n/a';
console.log(`Verb tokens tested: ${totalAfter}`);
console.log(`BEFORE (dict lemma only): ${passBefore}/${totalBefore} = ${pct(passBefore, totalBefore)}%`);
console.log(`AFTER  (lemma || findInfinitive): ${passAfter}/${totalAfter} = ${pct(passAfter, totalAfter)}%`);

const top = [...failCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log('\nTop failing tokens (token x count -> resolved lemma):');
for (const [tok, n] of top) {
  console.log(`  ${tok} x${n} -> ${failExample.get(tok)}`);
}

console.log(`\nFailure source: dict-lemma wrong = ${failBySource['dict-lemma']}, findInfinitive = ${failBySource['findInf']}`);
const topFi = [...findInfFails.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('Top findInfinitive-attributable failures:');
for (const [tok, n] of topFi) {
  console.log(`  ${tok} x${n} -> ${findInfLemma.get(tok)}`);
}
