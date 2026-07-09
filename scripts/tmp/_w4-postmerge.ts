// Post-merge simulation: confirm each new verb, once seeded, is engine-derivable
// and its dict-form exists, so audit-lang (post-write, findInfinitive-based) passes.
import { readFileSync } from 'fs';
import { haeyo, conjugate } from '../../src/data/conjugation/ko';
const dir = new URL('.', import.meta.url).pathname;
const dict = JSON.parse(readFileSync(dir+'wave4-ko-dict-A.json','utf8'));
const verbs = JSON.parse(readFileSync(dir+'wave4-ko-verbs-A.json','utf8'));
let bad=0;
for (const v of verbs) {
  const lemma = typeof v==='string'?v:v.dict;
  if (!dict[lemma] && !['부담되다','부담스럽다'].includes(lemma)) {} // dict-form should exist
  if (!dict[lemma]) { console.log('WARN no dict-form for', lemma); bad++; }
  if (typeof v==='string') { if (!conjugate(lemma)) { console.log('BAD conjugate', lemma); bad++; } }
  else { if (haeyo(lemma)===v.haeyo) { console.log('BAD not-irregular', lemma); bad++; } }
}
console.log('post-merge verb check:', bad? bad+' issues':'OK ('+verbs.length+' verbs, all have dict-forms + derive)');
