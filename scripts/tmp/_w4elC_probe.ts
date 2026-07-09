/* Coverage probe for wave-4 slice C raw cards.
 * Reports which target tokens are NOT covered by the existing merged dict
 * or the engine (findInfinitive). Those need a dict entry or a rewrite. */
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { findInfinitive, normalizeGreek } from '../../src/data/conjugation/el';

const dir = new URL('.', import.meta.url).pathname;
const cards = JSON.parse(readFileSync(dir + '_w4elC_raw.json', 'utf8'));
const tokenize = (s: string) => s.replace(/[;,.!?·«»()—:'’"]/g, ' ').split(/\s+/).filter(Boolean);
const uncovered: Record<string, string[]> = {};
for (const c of cards) {
  for (const raw of tokenize(c.target)) {
    const key = normalizeGreek(raw);
    if (!/[α-ωάέήίόύώϊϋΐΰ]/.test(key)) continue;
    if (lookupWord(key) || findInfinitive(key)) continue;
    (uncovered[key] ||= []).push(c.target);
  }
}
const keys = Object.keys(uncovered).sort();
console.log(`UNCOVERED TOKENS: ${keys.length}\n`);
for (const k of keys) console.log(`${k}\t(${uncovered[k].length}x) e.g. ${uncovered[k][0]}`);
