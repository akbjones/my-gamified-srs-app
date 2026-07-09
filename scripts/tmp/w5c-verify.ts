import { KNOWN_ROOTS, findInfinitive } from '../../src/data/conjugation/id';
import * as fs from 'fs';
const roots: string[] = JSON.parse(fs.readFileSync('scripts/tmp/wave5-roots-C.json','utf8'));
roots.forEach(r => KNOWN_ROOTS.add(r));
const dict = JSON.parse(fs.readFileSync('scripts/tmp/wave5-dict-C.json','utf8'));
const fails: string[] = [];
for (const [tok, e] of Object.entries<any>(dict)) {
  if (e.pos !== 'v') continue;
  if (KNOWN_ROOTS.has(tok)) continue;
  const inf = findInfinitive(tok);
  if (!inf) fails.push(tok + (e.lemma ? ` (lemma ${e.lemma})` : ''));
  else if (e.lemma && inf !== e.lemma) fails.push(`${tok}: engine=${inf} dict-lemma=${e.lemma}`);
}
console.log('verb tokens checked:', Object.values<any>(dict).filter(e=>e.pos==='v').length);
console.log('failures:', fails.length ? fails : 'none');
