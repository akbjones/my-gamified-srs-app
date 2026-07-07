/**
 * Self-test for the Welsh findInfinitive reverse lookup.
 *
 * For every card target token that the Welsh dictionary marks pos 'v':
 *   lemma = entry.lemma || findInfinitive(token)
 *   PASS if token === lemma OR conjugate(lemma)'s table contains the token
 *   (lowercased; multi-word table cells are split into single words).
 *
 * Prints the lemma-only baseline (entry.lemma alone) vs the full pass rate,
 * plus the top failing tokens.
 *
 * Run: npx tsx scripts/tmp/selftest-cy.ts
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { lookupWord } from '../../src/data/dictionary/cy';
import { conjugate, findInfinitive } from '../../src/data/conjugation/cy';

interface Card {
  target: string;
}

const here = dirname(fileURLToPath(import.meta.url));
const deckPath = join(here, '../../src/data/welsh/deck.json');
const deck: Card[] = JSON.parse(readFileSync(deckPath, 'utf8'));

// Welsh clitics that attach with an apostrophe: 'n (yn), 'r (yr), 'i/'w (ei),
// 'ch (eich), 'th (dy), 'u (eu), 'm (fy). "swnio'n" is two words.
const CLITIC = /'(n|r|i|w|ch|th|u|m)$/;

function tokenize(target: string): string[] {
  return target
    .toLowerCase()
    .replace(/[^a-zàáâäèéêëìíîïòóôöùúûüŵŷ'\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((t) => t.replace(/^'+|'+$/g, ''))
    .map((t) => {
      let x = t;
      while (CLITIC.test(x)) x = x.replace(CLITIC, '');
      return x;
    })
    .filter((t) => t.length > 0);
}

// Cache of lemma → set of single words appearing in its conjugation table.
const tableWordsCache = new Map<string, Set<string>>();
function tableWords(lemma: string): Set<string> {
  let words = tableWordsCache.get(lemma);
  if (words) return words;
  words = new Set<string>();
  words.add(lemma.toLowerCase());
  const table = conjugate(lemma);
  if (table) {
    words.add(table.infinitive.toLowerCase());
    for (const forms of Object.values(table.tenses)) {
      for (const form of forms) {
        for (const raw of form.toLowerCase().split(/[\s/]+/)) {
          if (raw) words.add(raw);
          const base = raw.split("'")[0];
          if (base) words.add(base);
        }
      }
    }
  }
  tableWordsCache.set(lemma, words);
  return words;
}

function passes(token: string, lemma: string | null): boolean {
  if (!lemma) return false;
  const l = lemma.toLowerCase();
  return token === l || tableWords(l).has(token);
}

let total = 0;
let passBaseline = 0; // lemma = entry.lemma only
let passFull = 0; // lemma = entry.lemma || findInfinitive(token)
let passFindOnly = 0; // lemma = findInfinitive(token), ignoring entry.lemma
const failures = new Map<string, number>();
const failureLemma = new Map<string, string>();
const failClass = new Map<string, number>();
const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

for (const card of deck) {
  for (const token of tokenize(card.target)) {
    const entry = lookupWord(token);
    if (!entry || entry.pos !== 'v') continue;
    total++;

    if (passes(token, entry.lemma ?? null)) passBaseline++;
    if (passes(token, findInfinitive(token))) passFindOnly++;

    const lemma = entry.lemma || findInfinitive(token);
    if (passes(token, lemma)) {
      passFull++;
    } else {
      failures.set(token, (failures.get(token) ?? 0) + 1);
      failureLemma.set(token, `${lemma ?? 'null'}${entry.lemma ? ' (dict lemma)' : ''}`);
      if (entry.lemma) {
        bump(failClass, 'dict lemma field short-circuits (cannot override)');
      } else if (lemma === 'bod') {
        bump(failClass, 'bod form correctly resolved but absent from bod table');
      } else if (lemma && passes(lemma, lemma)) {
        bump(failClass, 'lemma is a valid verbal noun; token form not in its table');
      } else {
        bump(failClass, 'unresolved / bad guess');
      }
    }
  }
}

const pct = (n: number) => ((n * 100) / total).toFixed(1);
console.log(`Welsh verb tokens: ${total}`);
console.log(`  lemma-only baseline: ${passBaseline}/${total} (${pct(passBaseline)}%)`);
console.log(`  with findInfinitive: ${passFull}/${total} (${pct(passFull)}%)`);
console.log(`  findInfinitive only (no dict lemma): ${passFindOnly}/${total} (${pct(passFindOnly)}%)`);
console.log('\nFailure classes:');
for (const [k, n] of [...failClass.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${k}`);
}
console.log('\nTop failing tokens:');
const top = [...failures.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, Number(process.env.TOP ?? 15));
for (const [token, count] of top) {
  console.log(`  ${String(count).padStart(4)}  ${token}  → ${failureLemma.get(token)}`);
}
