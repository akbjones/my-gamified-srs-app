import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { lookupWord } from '../../src/data/dictionary/el';
import { findInfinitive, conjugate, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';
const HERE = dirname(fileURLToPath(import.meta.url));
type Entry = { en: string }; type Card = { id: string; target: string };
const cards: Card[] = JSON.parse(readFileSync(join(HERE, 'wave3-el-cards-A.json'), 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(join(HERE, 'wave3-el-verbs-A.json'), 'utf8'));
const dictA: Record<string, Entry> = JSON.parse(readFileSync(join(HERE, 'wave3-el-dict-A.json'), 'utf8'));
const bareOf = (t: string) => stripAccents(normalizeGreek(t));
const toToken = (raw: string) => normalizeGreek(raw.replace(/[^Ͱ-Ͽἀ-῿]/g, ''));
const verbForms = new Set<string>();
for (const v of verbs) { const t = conjugate(v); if (!t) continue; verbForms.add(bareOf(v)); for (const forms of Object.values(t.tenses)) for (const f of forms) for (const p of f.split(/\s+/)) verbForms.add(bareOf(p)); }
const dictBare = new Set<string>(); for (const k of Object.keys(dictA)) dictBare.add(bareOf(k));
const toks = new Set<string>();
for (const c of cards) for (const raw of c.target.split(/\s+/)) { const t = toToken(raw); if (t) toks.add(t); }
const cnt: Record<string, number> = { dict: 0, lookupWord: 0, findInfinitive: 0, verbs: 0, NONE: 0 };
for (const tok of toks) {
  if (dictA[tok] || dictBare.has(bareOf(tok))) cnt.dict++;
  else if (lookupWord(tok)) cnt.lookupWord++;
  else if (findInfinitive(tok)) cnt.findInfinitive++;
  else if (verbForms.has(bareOf(tok))) cnt.verbs++;
  else cnt.NONE++;
}
console.log('unique tokens', toks.size);
console.log('coverage source breakdown (first-match order):', JSON.stringify(cnt));
// sanity: a token that is NOT in any source should fail
const fake = 'ζzζxfακεword';
console.log('fake-token covered?', !!(lookupWord(fake) || findInfinitive(fake) || verbForms.has(bareOf(fake)) || dictBare.has(bareOf(fake))));
