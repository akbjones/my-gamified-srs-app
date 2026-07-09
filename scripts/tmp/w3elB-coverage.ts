import { readFileSync, writeFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { findInfinitive, conjugate, normalizeGreek } from '../../src/data/conjugation/el';
const dir = new URL('.', import.meta.url).pathname;
const cards = JSON.parse(readFileSync(dir + 'wave3-el-cards-B.json', 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(dir + 'wave3-el-verbs-B.json', 'utf8'));
const verbForms = new Set<string>();
for (const v of verbs) {
  const t = conjugate(v); if (!t) { console.log('NOT CONJUGABLE:', v); continue; }
  for (const forms of Object.values(t.tenses)) for (const f of forms) for (const p of f.split(' ')) verbForms.add(normalizeGreek(p));
  verbForms.add(normalizeGreek(v));
}
const tokenize = (s: string) => s.replace(/[;,.!?·«»()—:'’]/g, ' ').split(/\s+/).filter(Boolean);
const missing = new Map<string, string>();
for (const c of cards) for (const raw of tokenize(c.target)) {
  const key = normalizeGreek(raw);
  if (!/[α-ωάέήίόύώϊϋΐΰ]/.test(key)) continue;
  if (verbForms.has(key) || lookupWord(key) || findInfinitive(key)) continue;
  if (!missing.has(key)) missing.set(key, `${c.id}: ${raw}`);
}
const list = [...missing.keys()].sort();
console.log('TRUE missing tokens:', list.length);
for (const k of list) console.log(' ', k, ' <= ', missing.get(k));
writeFileSync(dir + 'w3elB-missing.txt', list.join('\n'));
