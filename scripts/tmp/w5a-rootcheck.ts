import { readFileSync } from 'fs';
import { findInfinitive, KNOWN_ROOTS } from '../../src/data/conjugation/id';
const toks = readFileSync('scripts/tmp/w5a-tokens-all.txt','utf8').split('\n').filter(Boolean);
// verb-looking tokens: meN-/di-/ter-/ber- prefixed or known verbal
const verbal = toks.filter(t => /^(me|di|ter|ber|be[rl])/.test(t) && t.length > 4);
const unresolved = verbal.filter(t => !findInfinitive(t));
console.log('verbal-looking tokens:', verbal.length);
console.log('unresolved by findInfinitive:');
for (const t of unresolved) console.log(' ', t);
