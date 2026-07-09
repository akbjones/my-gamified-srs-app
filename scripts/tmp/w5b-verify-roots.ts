import { readFileSync } from 'fs';
import { KNOWN_ROOTS, findInfinitive } from '../../src/data/conjugation/id';

const NEW_ROOTS = ['batas','bujuk','bukti','canda','hafal','keluh','pasti','rugi','sangka','susul','tampil','tanggung'];
for (const r of NEW_ROOTS) {
  if (KNOWN_ROOTS.has(r)) console.log('ALREADY KNOWN:', r);
  KNOWN_ROOTS.add(r);
}
const toks = readFileSync('scripts/tmp/w5b-tokens-all.txt','utf8').trim().split('\n');
const derivedLook = (t: string) =>
  /^(me|di|ter|ber|be|ke.*an$|per)/.test(t) || /(kan|nya|lah|i)$/.test(t);
const unresolved: string[] = [];
for (const t of toks) {
  if (findInfinitive(t)) continue;
  if (derivedLook(t)) unresolved.push(t);
}
console.log('unresolved derived-looking tokens:', unresolved.length);
console.log(unresolved.join(' '));
