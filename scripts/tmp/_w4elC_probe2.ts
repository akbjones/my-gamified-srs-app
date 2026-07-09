/* Probe v2: verbs-file validity + token coverage incl. verbForms. */
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { conjugate, findInfinitive, normalizeGreek } from '../../src/data/conjugation/el';

const dir = new URL('.', import.meta.url).pathname;
const cards = JSON.parse(readFileSync(dir + '_w4elC_raw.json', 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(dir + 'wave4-el-verbs-C.json', 'utf8'));

const verbForms = new Set<string>();
console.log('=== NON-CONJUGABLE VERBS ===');
for (const v of verbs) {
  const t = conjugate(v);
  if (!t) { console.log('  NULL:', v); continue; }
  for (const forms of Object.values(t.tenses)) for (const f of forms as string[]) for (const p of f.split(' ')) verbForms.add(normalizeGreek(p));
  verbForms.add(normalizeGreek(v));
}

const tokenize = (s: string) => s.replace(/[;,.!?·«»()—:'’"]/g, ' ').split(/\s+/).filter(Boolean);
const uncovered: Record<string, string[]> = {};
for (const c of cards) {
  for (const raw of tokenize(c.target)) {
    const key = normalizeGreek(raw);
    if (!/[α-ωάέήίόύώϊϋΐΰ]/.test(key)) continue;
    if (verbForms.has(key) || lookupWord(key) || findInfinitive(key)) continue;
    (uncovered[key] ||= []).push(c.target);
  }
}
// Split: verb-looking uncovered (likely engine-wrong) vs noun-looking (need dict)
const keys = Object.keys(uncovered).sort();
console.log(`\n=== UNCOVERED (${keys.length}) ===`);
for (const k of keys) console.log(`${k}\t(${uncovered[k].length}x) ${uncovered[k][0]}`);
