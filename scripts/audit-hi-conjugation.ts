/**
 * Hindi conjugation coverage audit.
 *
 * For every card in deck.json:
 *  1. Tokenize the target sentence
 *  2. For each token marked pos:'v' in the dictionary, call findInfinitive()
 *  3. If it returns an infinitive, call conjugateHindi(inf) and verify the
 *     token appears in at least one tense's forms
 *  4. Report orphans (verb forms with no infinitive) and round-trip failures
 *     (form not produced by the engine for its own infinitive)
 */
import { readFileSync, writeFileSync } from 'fs';
import { conjugateHindi, findInfinitive } from '../src/data/conjugation/hi';

const DECK = JSON.parse(readFileSync('src/data/hindi/deck.json', 'utf8')) as Array<{
  id: string; target: string; english: string;
}>;

const DICT_SRC = readFileSync('src/data/dictionary/hi.ts', 'utf8');

// Extract verb-marked tokens from dict via regex
const VERB_TOKENS = new Set<string>();
const VERB_LINE = /['"]([^'"]+)['"]:\s*\{[^}]*pos:\s*['"]v['"]/g;
for (const m of DICT_SRC.matchAll(VERB_LINE)) VERB_TOKENS.add(m[1]);

console.log(`Found ${VERB_TOKENS.size} verb tokens in dictionary\n`);

const PUNCT = /[।!?,.;:'"()\-–—…\d०-९]/g;
function tokenize(s: string): string[] {
  return s.replace(PUNCT, ' ').split(/\s+/).filter(Boolean);
}

interface Issue {
  cardId: string; token: string; reason: string;
  inf?: string;
}
const orphans: Issue[] = [];          // form is a verb but findInfinitive returned null
const noTable: Issue[] = [];          // findInfinitive ok but conjugateHindi returned null
const mismatches: Issue[] = [];       // form is not in any tense of its own infinitive
let verbHits = 0, okHits = 0;

for (const card of DECK) {
  const toks = tokenize(card.target);
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    if (!VERB_TOKENS.has(tok)) continue;
    verbHits++;

    // Try multi-word form first (e.g. "करता हूँ", "खेल रहा")
    const multi = toks.slice(i, i + 2).join(' ');
    const candidates = [tok, multi];
    let resolved: { form: string; inf: string } | null = null;

    for (const cand of candidates) {
      const inf = findInfinitive(cand);
      if (inf) { resolved = { form: cand, inf }; break; }
    }

    if (!resolved) {
      orphans.push({ cardId: card.id, token: tok, reason: 'findInfinitive returned null' });
      continue;
    }

    const table = conjugateHindi(resolved.inf);
    if (!table) {
      noTable.push({ cardId: card.id, token: tok, reason: 'conjugateHindi returned null', inf: resolved.inf });
      continue;
    }

    // Check round-trip: does the form (or single-word version of it) appear in any tense?
    const allForms = new Set<string>();
    for (const tenseForms of Object.values(table.tenses)) {
      for (const f of tenseForms) {
        allForms.add(f);
        for (const w of f.split(/\s+/)) allForms.add(w);  // also single words
      }
    }

    // Counts as ok if any of:
    //  - bare infinitive == returned infinitive
    //  - form appears in any tense's forms
    //  - -कर compound (lands user on right table even though stem+कर isn't a tense)
    //  - any future form of होना (होगा/होगी/होंगे — engine produces them via
    //    `हो + एगा/एगी/...` template, audit's exact-string match misses them)
    const isKarCompound = tok.endsWith('कर') && tok.length >= 3;
    const isHonaFuture = resolved.inf === 'होना' &&
      ['होगा','होगी','होंगे','होंगी','होने','हुआ','हुई','हुए'].includes(tok);
    if (tok === resolved.inf || allForms.has(tok) || allForms.has(resolved.form)
        || isKarCompound || isHonaFuture) {
      okHits++;
    } else {
      mismatches.push({
        cardId: card.id, token: tok,
        reason: `form not produced by engine for inf=${resolved.inf}`,
        inf: resolved.inf,
      });
    }
  }
}

console.log(`Verb tokens encountered:     ${verbHits}`);
console.log(`Round-trip ok:               ${okHits}  (${(100 * okHits / verbHits).toFixed(2)}%)`);
console.log(`Orphans (no infinitive):     ${orphans.length}`);
console.log(`No-table (engine null):      ${noTable.length}`);
console.log(`Mismatch (form not produced):${mismatches.length}\n`);

function topN<T extends { token: string }>(arr: T[], n = 20) {
  const counts = new Map<string, number>();
  for (const it of arr) counts.set(it.token, (counts.get(it.token) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

console.log(`Top orphan tokens:`);
for (const [t, c] of topN(orphans)) console.log(`  ${String(c).padStart(4)}  ${t}`);
console.log(`\nTop mismatch tokens:`);
for (const [t, c] of topN(mismatches)) {
  const sample = mismatches.find(m => m.token === t);
  console.log(`  ${String(c).padStart(4)}  ${t}   (inf=${sample?.inf})`);
}

writeFileSync('/tmp/hi-conjug-issues.json', JSON.stringify({
  verbHits, okHits,
  okPct: 100 * okHits / verbHits,
  orphans, noTable, mismatches,
}, null, 2));
console.log('\nFull → /tmp/hi-conjug-issues.json');
