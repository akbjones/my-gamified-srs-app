/**
 * Validation for slice A (ko-0001..ko-0075, node-01) — uses the REAL engine.
 * Run: npx tsx scripts/tmp/validate-koA.ts
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { haeyo, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const dir = dirname(fileURLToPath(import.meta.url));
const cards: any[] = JSON.parse(readFileSync(join(dir, 'ko-cards-A.json'), 'utf8'));
const myDict: Record<string, { en: string; ipa: string; pos?: string; lemma?: string }> =
  JSON.parse(readFileSync(join(dir, 'ko-dict-A.json'), 'utf8'));
const verbsOut: (string | [string, string])[] = JSON.parse(readFileSync(join(dir, 'ko-verbs-A.json'), 'utf8'));

const errors: string[] = [];
const warn: string[] = [];

// ── 1. Card structure ─────────────────────────────────────────────
if (cards.length !== 75) errors.push(`expected 75 cards, got ${cards.length}`);
const seenTargets = new Set<string>();
cards.forEach((c, i) => {
  const n = 1 + i;
  const id = `ko-${String(n).padStart(4, '0')}`;
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} !== ${n}`);
  if (c.audio !== `ko-${c.id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== 'node-01') errors.push(`${c.id}: bad grammarNode ${c.grammarNode}`);
  if (!c.target || !c.english) errors.push(`${c.id}: missing target/english`);
  if (seenTargets.has(c.target)) errors.push(`${c.id}: DUPLICATE sentence: ${c.target}`);
  seenTargets.add(c.target);
});

// ── 2. Verbs output sanity ────────────────────────────────────────
const irrMap: Record<string, string> = {};
const newRegular: string[] = [];
for (const v of verbsOut) {
  if (Array.isArray(v)) irrMap[v[0]] = v[1];
  else newRegular.push(v);
}
for (const v of [...newRegular, ...Object.keys(irrMap)]) {
  if (KNOWN_VERBS.includes(v)) errors.push(`verbs-A: ${v} already in KNOWN_VERBS`);
  if (!v.endsWith('다')) errors.push(`verbs-A: ${v} not a -다 form`);
}
for (const v of newRegular) {
  if (!haeyo(v)) errors.push(`verbs-A: engine cannot derive ${v}`);
}

// ── 3. Token resolution + verb-form correctness ───────────────────
// Simulates lookup after merge: real lookupWord OR my dict (with the same
// particle-stripping/findInfinitive chain the real lookupWord uses).
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로',
];
const get = (w: string) => myDict[w] ?? lookupWord(w) ?? null;
function resolve(w: string) {
  if (myDict[w]) return myDict[w];
  const real = lookupWord(w);
  if (real) return real;
  const lem = findInfinitive(w);
  if (lem && get(lem)) return { ...get(lem)!, lemma: lem };
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      const hit = get(base);
      if (hit) return hit;
      const l2 = findInfinitive(base);
      if (l2 && get(l2)) return { ...get(l2)!, lemma: l2 };
    }
  }
  return null;
}

// jamo: does the syllable have a final consonant?
const hasFinal = (ch: string) => {
  const c = ch.charCodeAt(0) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
};

let tokenCount = 0;
const unresolved: string[] = [];
let verbTokens = 0;
let copulaSurfaces = 0;
for (const c of cards) {
  for (const raw of c.target.split(/\s+/)) {
    const w = raw.replace(/[^가-힣]/g, '');
    if (!w) continue;
    tokenCount++;
    const entry = resolve(w);
    if (!entry) { unresolved.push(`${c.id}: ${w}`); continue; }

    // verb-form check
    const lemma = findInfinitive(w) ?? myDict[w]?.lemma ?? null;
    if (!lemma || w.endsWith('다')) continue; // nouns / dict forms
    verbTokens++;
    if (lemma === '이다') {
      // copula surface: correct allomorph for the attached noun
      if (w === '이에요' || w === '예요') continue;
      copulaSurfaces++;
      if (w.endsWith('이에요')) {
        const base = w.slice(0, -3);
        if (!base || !hasFinal(base[base.length - 1]))
          errors.push(`${c.id}: ${w} — 이에요 after vowel-final base`);
      } else if (w.endsWith('예요')) {
        const base = w.slice(0, -2);
        if (!base || hasFinal(base[base.length - 1]))
          errors.push(`${c.id}: ${w} — 예요 after consonant-final base`);
      } else errors.push(`${c.id}: ${w} — lemma 이다 but not a copula surface`);
    } else if (irrMap[lemma]) {
      if (w !== irrMap[lemma]) errors.push(`${c.id}: ${w} !== seeded irregular ${irrMap[lemma]} (${lemma})`);
    } else {
      const h = haeyo(lemma);
      if (h !== w) errors.push(`${c.id}: ${w} — haeyo(${lemma}) = ${h}, mismatch`);
    }
  }
}
for (const u of unresolved) errors.push(`unresolved token: ${u}`);

// every conjugated dict entry's lemma must itself resolve + derive correctly
for (const [k, v] of Object.entries(myDict)) {
  if (!v.en || !v.ipa) errors.push(`dict-A: ${k} missing en/ipa`);
  if (!v.lemma) continue;
  if (!get(v.lemma)) errors.push(`dict-A: lemma ${v.lemma} of ${k} has no entry`);
  if (v.lemma === '이다') continue;
  const expected = irrMap[v.lemma] ?? haeyo(v.lemma);
  if (expected !== k) errors.push(`dict-A: ${k} vs derived ${expected} (${v.lemma})`);
}

// ── 4. Report ─────────────────────────────────────────────────────
const tips = cards.filter(c => c.grammar).length;
const tagCounts: Record<string, number> = {};
cards.forEach(c => c.tags.forEach((t: string) => (tagCounts[t] = (tagCounts[t] ?? 0) + 1)));

console.log('cards:', cards.length, `(ko-0001..ko-0075)`);
console.log('unique sentences:', seenTargets.size);
console.log('tokens checked:', tokenCount, '| unresolved:', unresolved.length);
console.log('verb tokens form-checked:', verbTokens, `(of which copula surfaces: ${copulaSurfaces})`);
console.log('grammar tips:', tips, `(${((tips / cards.length) * 100).toFixed(1)}%)`);
console.log('tags:', JSON.stringify(tagCounts));
console.log('dict entries:', Object.keys(myDict).length, '| new verbs:', newRegular.length, 'regular +', Object.keys(irrMap).length, 'irregular');
console.log('irregular pairs:', JSON.stringify(Object.entries(irrMap)));
if (warn.length) { console.log('\nWARNINGS:'); warn.forEach(w => console.log(' -', w)); }
if (errors.length) {
  console.log('\nERRORS:');
  errors.forEach(e => console.log(' -', e));
  process.exit(1);
}
console.log('\nALL CHECKS PASSED');
