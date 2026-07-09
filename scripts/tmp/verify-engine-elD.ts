import { findInfinitive, conjugate, normalizeGreek } from '../../src/data/conjugation/el';
import * as fs from 'fs';

const dict = JSON.parse(fs.readFileSync('scripts/tmp/el-dict-D.json', 'utf8'));
const cards = JSON.parse(fs.readFileSync('scripts/tmp/el-cards-D.json', 'utf8'));

let fail = 0;
for (const [key, e] of Object.entries<any>(dict)) {
  if (e.pos !== 'v') continue;
  const hit = findInfinitive(key);
  const lem = e.lemma ? conjugate(e.lemma) : conjugate(key);
  if (!hit && !lem) { console.error('UNRESOLVED VERB:', key); fail++; }
}
const tokenize = (s: string) => s.replace(/[;,.!·—?«»"'()]/g, ' ').trim().split(/\s+/).filter(Boolean);
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    if (!dict[normalizeGreek(tok)]) { console.error('MISSING TOKEN:', tok, 'in', c.id); fail++; }
  }
}
console.log(fail ? `FAILED: ${fail}` : `OK: real engine resolves all verbs; all ${cards.length} cards covered`);
process.exit(fail ? 1 : 0);
