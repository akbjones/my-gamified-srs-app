import { readFileSync } from 'fs';
import { KNOWN_ROOTS, findInfinitive } from '../../src/data/conjugation/id';

const roots: string[] = JSON.parse(readFileSync('scripts/tmp/wave4-roots-H.json', 'utf8'));
const dup = roots.filter(r => KNOWN_ROOTS.has(r));
if (dup.length) console.log('ROOTS ALREADY KNOWN:', dup);
roots.forEach(r => KNOWN_ROOTS.add(r));

const dict: Record<string, { pos?: string; lemma?: string }> = JSON.parse(readFileSync('scripts/tmp/wave4-dict-H.json', 'utf8'));
// every verb token must resolve: known root, or findInfinitive hit
let bad = 0;
for (const [tok, e] of Object.entries(dict)) {
  if (e.pos !== 'v') continue;
  if (KNOWN_ROOTS.has(tok)) continue;
  const inf = findInfinitive(tok);
  if (!inf) { console.log('VERB UNRESOLVED:', tok); bad++; }
}
// lemma targets must be resolvable words (in dict or a known root)
for (const [tok, e] of Object.entries(dict)) {
  if (e.lemma && !dict[e.lemma] && !KNOWN_ROOTS.has(e.lemma)) console.log('LEMMA DANGLING:', tok, '->', e.lemma);
}
console.log('verb check done, unresolved:', bad);
