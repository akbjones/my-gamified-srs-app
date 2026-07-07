/**
 * Self-test for Spanish findInfinitive (src/data/conjugation/es.ts).
 *
 * For every verb token in the Spanish deck (pos 'v' per dictionary lookup):
 *   lemma = entry.lemma || findInfinitive(token)
 *   PASS if token === lemma OR conjugate(lemma) table contains the token
 *   (lowercased; multi-word and slash-alternate table forms are split and
 *    matched word-by-word).
 *
 * Prints pass % for lemma-only (baseline) vs lemma+findInfinitive, plus the
 * top-15 failing tokens.
 *
 * Run: npx tsx scripts/tmp/selftest-es.ts
 */
import deck from '../../src/data/spanish/deck.json';
import { lookupWord } from '../../src/data/dictionary/es';
import { conjugate, findInfinitive } from '../../src/data/conjugation/es';

interface Card { target: string }

const tableCache = new Map<string, Set<string> | null>();
function tableWords(lemma: string): Set<string> | null {
  if (tableCache.has(lemma)) return tableCache.get(lemma)!;
  const table = conjugate(lemma);
  let words: Set<string> | null = null;
  if (table) {
    words = new Set<string>();
    for (const forms of Object.values(table.tenses)) {
      for (const form of forms) {
        if (!form || form === '-') continue;
        for (const piece of form.toLowerCase().split(/[\s/]+/)) {
          if (piece && piece !== '-') words.add(piece);
        }
      }
    }
  }
  tableCache.set(lemma, words);
  return words;
}

function passes(token: string, lemma: string | null | undefined): boolean {
  if (!lemma) return false;
  const l = lemma.toLowerCase();
  if (token === l) return true;
  return tableWords(l)?.has(token) ?? false;
}

let verbTokens = 0;
let passLemmaOnly = 0;
let passCombined = 0;
const failures = new Map<string, number>();

for (const card of deck as Card[]) {
  const tokens = card.target.toLowerCase().split(/[^a-záéíóúüñ-]+/).filter(Boolean);
  for (const token of tokens) {
    const entry = lookupWord(token);
    if (!entry || entry.pos !== 'v') continue;
    verbTokens++;

    if (passes(token, entry.lemma)) passLemmaOnly++;

    const lemma = entry.lemma || findInfinitive(token);
    if (passes(token, lemma)) {
      passCombined++;
    } else {
      failures.set(token, (failures.get(token) ?? 0) + 1);
    }
  }
}

const pct = (n: number) => ((100 * n) / verbTokens).toFixed(2) + '%';
console.log(`Verb tokens:            ${verbTokens}`);
console.log(`PASS lemma-only:        ${passLemmaOnly}  (${pct(passLemmaOnly)})`);
console.log(`PASS lemma+findInf:     ${passCombined}  (${pct(passCombined)})`);
console.log(`FAIL:                   ${verbTokens - passCombined}`);
console.log('\nTop 15 failing tokens:');
const top = [...failures.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [tok, n] of top) {
  const entry = lookupWord(tok);
  const lemma = entry?.lemma || findInfinitive(tok);
  console.log(`  ${String(n).padStart(4)}  ${tok}  → lemma: ${lemma ?? 'null'}`);
}

// ── Failure class breakdown ─────────────────────────────────
let ndo = 0, hayN = 0, cliticInf = 0, femPart = 0, other = 0;
const otherToks = new Map<string, number>();
for (const [tok, n] of failures) {
  if (tok === 'hay') hayN += n;
  else if (/ndo(me|te|se|nos|os|le|les|lo|la|los|las)?$/.test(tok)) ndo += n;
  else if (/(r|ndo)(me|te|se|nos|os|le|les|lo|la|los|las|selo|sela|melo|telo)$/.test(tok) || /rse$/.test(tok)) cliticInf += n;
  else if (/(ada|adas|ados|ida|idas|idos)$/.test(tok)) femPart += n;
  else { other += n; otherToks.set(tok, n); }
}
console.log(`\nClasses: gerund=${ndo} hay=${hayN} clitic/reflex-inf=${cliticInf} agreeing-participle=${femPart} other=${other}`);
console.log('Other failures:');
for (const [t, n] of [...otherToks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)) {
  const e = lookupWord(t);
  console.log(`  ${String(n).padStart(3)}  ${t}  dictLemma=${e?.lemma ?? '-'}  findInf=${findInfinitive(t) ?? 'null'}`);
}

// ── Failures where dict has no lemma (findInfinitive-owned) ──
console.log('\nFailures with NO dict lemma (findInfinitive responsible):');
let noLemmaFails = 0;
for (const [t, n] of [...failures.entries()].sort((a, b) => b[1] - a[1])) {
  const e = lookupWord(t);
  if (e?.lemma) continue;
  noLemmaFails += n;
  console.log(`  ${String(n).padStart(3)}  ${t}  findInf=${findInfinitive(t) ?? 'null'}`);
}
console.log(`Total no-lemma failures: ${noLemmaFails}`);
