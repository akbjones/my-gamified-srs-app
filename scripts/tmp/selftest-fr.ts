/**
 * Self-test for French findInfinitive (see /tmp/findinf-brief.txt).
 * For every verb token in the deck: lemma = entry.lemma || findInfinitive(tok);
 * PASS if tok === lemma OR conjugate(lemma) table contains tok.
 * Run: npx tsx scripts/tmp/selftest-fr.ts
 */
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/fr';
import { conjugate, findInfinitive } from '../../src/data/conjugation/fr';

interface Card { target: string }
const deck: Card[] = JSON.parse(
  readFileSync(new URL('../../src/data/french/deck.json', import.meta.url), 'utf8'),
);

const ELISION = ["qu'", "l'", "d'", "j'", "n'", "s'", "c'", "m'", "t'"];

/** Clean a raw token the same way lookupWord does, then strip elisions/hyphen tails. */
function coreForm(raw: string): string {
  let clean = raw.normalize('NFC').toLowerCase().replace(/[¿¡.,!?;:"“”‘’()––«»\d/]/g, '');
  for (const p of ELISION) {
    if (clean.startsWith(p)) { clean = clean.slice(p.length); break; }
  }
  clean = clean.replace(/'/g, '');
  if (clean.includes('-')) clean = clean.split('-')[0]; // donnez-moi → donnez
  return clean;
}

/** All single words appearing in a conjugation table, lowercased. */
const tableCache = new Map<string, Set<string> | null>();
function tableWords(lemma: string): Set<string> | null {
  if (tableCache.has(lemma)) return tableCache.get(lemma)!;
  const t = conjugate(lemma);
  if (!t) { tableCache.set(lemma, null); return null; }
  const set = new Set<string>();
  for (const forms of Object.values(t.tenses)) {
    for (const form of forms) {
      if (!form || form === '-') continue;
      const lf = form.toLowerCase();
      set.add(lf);
      for (const w of lf.split(/[\s']+/)) if (w) set.add(w);
    }
  }
  tableCache.set(lemma, set);
  return set;
}

function passes(tok: string, lemma: string | null): boolean {
  if (!lemma) return false;
  const l = lemma.toLowerCase();
  if (tok === l) return true;
  const words = tableWords(l);
  return !!words && words.has(tok);
}

let total = 0;
let passLemmaOnly = 0;
let passWithFind = 0;
let failsWithDictLemma = 0; // table lacks the form even though dict lemma is authoritative
const fails = new Map<string, number>();
const failDetail = new Map<string, string>();

for (const card of deck) {
  for (const raw of card.target.split(/\s+/)) {
    const entry = lookupWord(raw);
    if (!entry || entry.pos !== 'v') continue;
    const tok = coreForm(raw);
    if (!tok) continue;
    total++;

    // Baseline: dictionary lemma only
    if (passes(tok, entry.lemma ?? null)) passLemmaOnly++;

    // With findInfinitive fallback
    const lemma = entry.lemma || findInfinitive(tok);
    if (passes(tok, lemma)) {
      passWithFind++;
    } else {
      if (entry.lemma) failsWithDictLemma++;
      fails.set(tok, (fails.get(tok) || 0) + 1);
      if (!failDetail.has(tok)) {
        failDetail.set(tok, `lemma=${lemma ?? 'null'}${entry.lemma ? ' [dict]' : ' [derived]'}`);
      }
    }
  }
}

const pct = (n: number) => ((100 * n) / total).toFixed(2) + '%';
console.log(`verb tokens: ${total}`);
console.log(`baseline (entry.lemma only): ${passLemmaOnly} = ${pct(passLemmaOnly)}`);
console.log(`with findInfinitive:         ${passWithFind} = ${pct(passWithFind)}`);
console.log(`failures where dict lemma was already authoritative (table gap): ${failsWithDictLemma} of ${total - passWithFind}`);
console.log('\nTop 15 failing tokens:');
for (const [tok, n] of [...fails.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(n).padStart(4)}  ${tok}  (${failDetail.get(tok)})`);
}
