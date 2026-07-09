import { KNOWN_ROOTS, findInfinitive } from '../../src/data/conjugation/id';
import * as fs from 'fs';

const roots: string[] = JSON.parse(fs.readFileSync('scripts/tmp/wave4-roots-G.json', 'utf8'));
for (const r of roots) {
  if (KNOWN_ROOTS.has(r)) console.log('ALREADY KNOWN (remove from roots file):', r);
  KNOWN_ROOTS.add(r);
}
const dict = JSON.parse(fs.readFileSync('scripts/tmp/wave4-dict-G.json', 'utf8'));
const toks: string[] = fs.readFileSync('scripts/tmp/w4g-tokens.txt', 'utf8').split('\n').filter(Boolean);

// every token whose dict pos is 'v': either a known root, or findInfinitive resolves it
let issues = 0;
for (const t of toks) {
  const e = dict[t];
  if (!e) continue;
  if (e.pos === 'v') {
    if (KNOWN_ROOTS.has(t)) continue;
    const inf = findInfinitive(t);
    if (!inf) { console.log('VERB UNRESOLVED:', t); issues++; }
    else if (e.lemma && e.lemma !== inf) { console.log('LEMMA MISMATCH:', t, 'dict lemma', e.lemma, 'engine says', inf); issues++; }
  }
}
console.log(issues ? issues + ' verb issues' : 'all verb tokens resolve');
