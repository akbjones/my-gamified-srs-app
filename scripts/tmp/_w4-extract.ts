import { readFileSync } from 'fs';
import { findInfinitive } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const cards: any[] = JSON.parse(readFileSync(new URL('./wave4-ko-cards-A.json', import.meta.url), 'utf8'));
const uncovered = new Map<string, string[]>(); // token -> sample card ids
for (const c of cards) {
  for (const raw of c.target.split(/\s+/)) {
    const w = raw.replace(/[^가-힣]/g, '');
    if (!w) continue;
    if (lookupWord(w)) continue;           // real dict resolves (incl. its own findInf + particle strip)
    if (findInfinitive(w)) continue;       // engine resolves a conjugated form (lemma may or may not be in dict — check later)
    const arr = uncovered.get(w) ?? [];
    if (arr.length < 2) arr.push(c.id);
    uncovered.set(w, arr);
  }
}
const keys = [...uncovered.keys()].sort();
console.log('UNCOVERED unique tokens:', keys.length);
for (const k of keys) console.log(k, '  <-', uncovered.get(k)!.join(','));
