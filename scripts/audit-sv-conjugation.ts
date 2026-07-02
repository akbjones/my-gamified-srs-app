/**
 * Swedish conjugation coverage audit — same shape as audit-hi-conjugation.ts.
 * For every card, tokenize the target sentence, look up verb tokens in the
 * dictionary, and verify the engine can round-trip them.
 */
import { readFileSync, writeFileSync } from 'fs';
import { conjugate, findInfinitive } from '../src/data/conjugation/sv';
const DICT_JSON = readFileSync('src/data/dictionary/sv.ts', 'utf8');

const DECK = JSON.parse(readFileSync('src/data/swedish/deck.json', 'utf8')) as Array<{
  id: string; target: string; english: string;
}>;

const DICT_SRC = readFileSync('src/data/dictionary/sv.ts', 'utf8');
const VERB_TOKENS = new Set<string>();
const VERB_LINE = /['"]([^'"]+)['"]:\s*\{[^}]*pos:\s*['"]v['"]/g;
for (const m of DICT_SRC.matchAll(VERB_LINE)) VERB_TOKENS.add(m[1]);

console.log(`Loaded ${DECK.length} cards, ${VERB_TOKENS.size} verb tokens in dictionary\n`);

const PUNCT = /[!?,.;:'"()\-–—…\d]/g;
function tokenize(s: string): string[] {
  return s.toLowerCase().replace(PUNCT, ' ').split(/\s+/).filter(Boolean);
}

interface Issue { cardId: string; token: string; inf?: string; reason: string; }
const orphans: Issue[] = [];
const mismatches: Issue[] = [];
let verbHits = 0, okHits = 0;

for (const card of DECK) {
  const toks = tokenize(card.target);
  for (const tok of toks) {
    if (!VERB_TOKENS.has(tok)) continue;
    verbHits++;
    const inf = findInfinitive(tok);
    if (!inf) {
      orphans.push({ cardId: card.id, token: tok, reason: 'no infinitive returned' });
      continue;
    }
    const table = conjugate(inf);
    if (!table) {
      orphans.push({ cardId: card.id, token: tok, reason: `conjugate returned null for inf=${inf}` });
      continue;
    }
    const allForms = new Set<string>();
    for (const forms of Object.values(table.tenses)) {
      for (const f of forms) {
        allForms.add(f);
        for (const w of f.split(/\s+/)) allForms.add(w);
      }
    }
    if (tok === inf || allForms.has(tok)) okHits++;
    else mismatches.push({ cardId: card.id, token: tok, inf, reason: 'form not in any tense' });
  }
}

console.log(`Verb hits: ${verbHits}`);
console.log(`OK:        ${okHits} (${(100*okHits/verbHits).toFixed(2)}%)`);
console.log(`Orphans:   ${orphans.length}`);
console.log(`Mismatch:  ${mismatches.length}\n`);

function topN<T extends { token: string }>(arr: T[], n = 25) {
  const c = new Map<string, number>();
  for (const it of arr) c.set(it.token, (c.get(it.token) || 0) + 1);
  return [...c.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n);
}
console.log('Top orphans:');
for (const [t,c] of topN(orphans)) console.log(`  ${String(c).padStart(4)}  ${t}`);
console.log('\nTop mismatches (form vs claimed infinitive):');
for (const [t,c] of topN(mismatches)) {
  const sample = mismatches.find(m => m.token === t);
  console.log(`  ${String(c).padStart(4)}  ${t}  (inf=${sample?.inf})`);
}

writeFileSync('/tmp/sv-conjug-issues.json', JSON.stringify({
  verbHits, okHits, okPct: 100*okHits/verbHits,
  orphans, mismatches,
}, null, 2));
console.log('\nFull → /tmp/sv-conjug-issues.json');
