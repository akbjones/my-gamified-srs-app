/**
 * Validation for wave2 slice D (ko-1051..ko-1300, node-11/node-12) — REAL engine.
 * Run: npx tsx scripts/tmp/validate-w2koD.ts
 * Coverage-only listing: npx tsx scripts/tmp/validate-w2koD.ts --uncovered
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { haeyo, past, future, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const dir = dirname(fileURLToPath(import.meta.url));
const cards: any[] = JSON.parse(readFileSync(join(dir, 'wave2-ko-cards-D.json'), 'utf8'));
const dictPath = join(dir, 'wave2-ko-dict-D.json');
const myDict: Record<string, { en: string; ipa: string; pos?: string; lemma?: string }> =
  existsSync(dictPath) ? JSON.parse(readFileSync(dictPath, 'utf8')) : {};
const verbsOut: (string | [string, string])[] = JSON.parse(readFileSync(join(dir, 'wave2-ko-verbs-D.json'), 'utf8'));
const existingTargets = new Set(
  (JSON.parse(readFileSync(join(dir, '../../src/data/korean/deck.json'), 'utf8')) as any[]).map(c => c.target)
);
const uncoveredOnly = process.argv.includes('--uncovered');

const errors: string[] = [];

// ── 1. Card structure ─────────────────────────────────────────────
if (cards.length !== 250) errors.push(`expected 250 cards, got ${cards.length}`);
const seenTargets = new Set<string>();
cards.forEach((c, i) => {
  const n = 1051 + i;
  const id = `ko-${n}`;
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} !== ${n}`);
  if (c.audio !== `ko-${c.id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== 'node-11' && c.grammarNode !== 'node-12')
    errors.push(`${c.id}: bad grammarNode ${c.grammarNode}`);
  if (!c.target || !c.english) errors.push(`${c.id}: missing target/english`);
  if (seenTargets.has(c.target)) errors.push(`${c.id}: DUPLICATE sentence in slice: ${c.target}`);
  if (existingTargets.has(c.target)) errors.push(`${c.id}: DUPLICATE of existing deck sentence: ${c.target}`);
  seenTargets.add(c.target);
  if (c.grammar && c.grammar.length > 120) errors.push(`${c.id}: tip ${c.grammar.length} chars > 120`);
});

// ── 2. Verb specs: build per-lemma sanctioned surface forms ───────
const irrMap: Record<string, string> = {};
const newRegular: string[] = [];
for (const v of verbsOut) {
  if (Array.isArray(v)) irrMap[v[0]] = v[1];
  else newRegular.push(v);
}
for (const v of [...newRegular, ...Object.keys(irrMap)]) {
  if (KNOWN_VERBS.includes(v)) errors.push(`verbs-D: ${v} already in KNOWN_VERBS`);
  if (!v.endsWith('다')) errors.push(`verbs-D: ${v} not a -다 form`);
}
for (const v of newRegular) {
  if (!haeyo(v)) errors.push(`verbs-D: engine cannot derive ${v}`);
}

function derivePastFrom(polite: string): string | null {
  const pre = polite.slice(0, -1);
  const last = pre[pre.length - 1];
  const c = last.charCodeAt(0) - 0xac00;
  if (c < 0 || c > 11171 || c % 28 !== 0) return null;
  return pre.slice(0, -1) + String.fromCharCode(last.charCodeAt(0) + 20) + '어요';
}

// token → lemma for every sanctioned surface form of a wave-D verb
const verbFormLemma = new Map<string, string>();
const addForm = (f: string | null, lemma: string) => {
  if (!f) return;
  const w = f.split(' ')[0];
  if (!verbFormLemma.has(w)) verbFormLemma.set(w, lemma);
  if (w.endsWith('요') && !verbFormLemma.has(w.slice(0, -1)))
    verbFormLemma.set(w.slice(0, -1), lemma); // bare banmal/connective
};
for (const lemma of [...newRegular, ...Object.keys(irrMap)]) {
  const h = irrMap[lemma] ?? haeyo(lemma);
  addForm(h, lemma);
  addForm(h ? derivePastFrom(h) : null, lemma);
  addForm(future(lemma), lemma);
  addForm(lemma, lemma); // dictionary form itself
}

// ── 3. Token resolution (mirrors real lookupWord over merged dict) ─
// Full particle list from src/data/dictionary/ko.ts (longest first).
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다', '으로', '에는', '이랑', '하고',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로',
];
const get = (w: string) => myDict[w] ?? lookupWord(w) ?? null;
function resolve(w: string) {
  if (myDict[w]) return myDict[w];
  const real = lookupWord(w);
  if (real) return real;
  const lem = findInfinitive(w) ?? verbFormLemma.get(w) ?? null;
  if (lem && get(lem)) return { ...get(lem)!, lemma: lem };
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      const hit = get(base);
      if (hit) return hit;
      const l2 = findInfinitive(base) ?? verbFormLemma.get(base) ?? null;
      if (l2 && get(l2)) return { ...get(l2)!, lemma: l2 };
    }
  }
  return null;
}

const hasFinal = (ch: string) => {
  const c = ch.charCodeAt(0) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
};

// Sanctioned surface forms of a lemma: 해요체 present, past, future stem
// word, the bare -아/어 connective / banmal stem, the -고 connective
// (먹고, 놓고) and the -아/어서 connective (많아서, 더워서).
function formOk(lemma: string, w: string): boolean {
  const h = irrMap[lemma] ?? haeyo(lemma);
  if (!h) return false;
  if (w === h) return true;
  if (h.endsWith('요') && w === h.slice(0, -1)) return true;
  if (h.endsWith('요') && w === h.slice(0, -1) + '서') return true; // 많아서
  if (w === lemma.slice(0, -1) + '고') return true;                 // 먹고
  const p = irrMap[lemma] ? derivePastFrom(h) : (past(lemma) ?? derivePastFrom(h));
  if (p && (w === p || (p.endsWith('요') && w === p.slice(0, -1)))) return true;
  const f = future(lemma);
  if (f && w === f.split(' ')[0]) return true;
  return false;
}

// Honorific copula surface: X이세요 after consonant-final noun, X세요
// after vowel-final (사장님이세요 / 할머니세요), + past X(이)셨어요.
function isidaOk(w: string): boolean {
  for (const [suf, wantFinal] of [['이세요', true], ['이셨어요', true], ['세요', false], ['셨어요', false]] as const) {
    if (!w.endsWith(suf) || w.length <= suf.length) continue;
    const base = w.slice(0, -suf.length);
    return hasFinal(base[base.length - 1]) === wantFinal;
  }
  return false;
}

let tokenCount = 0;
const unresolved: string[] = [];
let verbTokens = 0;
for (const c of cards) {
  for (const raw of c.target.split(/\s+/)) {
    const w = raw.replace(/[^가-힣]/g, '');
    if (!w) continue;
    tokenCount++;
    const entry = resolve(w);
    if (!entry) { unresolved.push(`${c.id}: ${w}`); continue; }
    if (uncoveredOnly) continue;

    const lemma = findInfinitive(w) ?? verbFormLemma.get(w) ?? myDict[w]?.lemma ?? null;
    if (!lemma || w.endsWith('다')) continue;
    if (myDict[w]?.pos === 'phrase' || (!myDict[w] && lookupWord(w)?.pos === 'phrase')) continue;
    verbTokens++;
    if (lemma === '이다') {
      if (w === '이에요' || w === '예요') continue;
      if (w.endsWith('이에요') || w.endsWith('이었어요')) {
        const cut = w.endsWith('이에요') ? 3 : 4;
        const base = w.slice(0, -cut);
        if (!base || !hasFinal(base[base.length - 1]))
          errors.push(`${c.id}: ${w} — 이에요/이었어요 after vowel-final base`);
      } else if (w.endsWith('예요') || w.endsWith('였어요')) {
        const cut = w.endsWith('예요') ? 2 : 3;
        const base = w.slice(0, -cut);
        if (!base || hasFinal(base[base.length - 1]))
          errors.push(`${c.id}: ${w} — 예요/였어요 after consonant-final base`);
      } else errors.push(`${c.id}: ${w} — lemma 이다 but not a copula surface`);
    } else if (lemma === '이시다') {
      if (w !== '이세요' && !isidaOk(w))
        errors.push(`${c.id}: ${w} — lemma 이시다 but not an honorific copula surface`);
    } else if (!formOk(lemma, w)) {
      errors.push(`${c.id}: ${w} — not a sanctioned form of ${lemma} (haeyo=${irrMap[lemma] ?? haeyo(lemma)}, past=${past(lemma)}, fut=${future(lemma)})`);
    }
  }
}
for (const u of unresolved) errors.push(`unresolved token: ${u}`);

if (!uncoveredOnly) {
  // every conjugated dict entry's lemma must itself resolve + derive correctly
  for (const [k, v] of Object.entries(myDict)) {
    if (!v.lemma) continue;
    if (!get(v.lemma)) errors.push(`dict-D: lemma ${v.lemma} of ${k} has no entry`);
    if (v.lemma === '이다') continue;
    if (v.lemma === '이시다') {
      if (!isidaOk(k)) errors.push(`dict-D: ${k} is not an honorific copula surface`);
    } else if (!formOk(v.lemma, k)) errors.push(`dict-D: ${k} is not a sanctioned form of ${v.lemma}`);
  }
}

// ── 4. Report ─────────────────────────────────────────────────────
const tips = cards.filter(c => c.grammar).length;
console.log('cards:', cards.length, '(ko-1051..ko-1300)');
console.log('tokens checked:', tokenCount, '| unresolved:', unresolved.length);
if (uncoveredOnly) {
  const uniq = [...new Set(unresolved.map(u => u.split(': ')[1]))];
  console.log('unique uncovered tokens:', uniq.length);
  for (const u of uniq) console.log(u);
  process.exit(0);
}
console.log('verb tokens form-checked:', verbTokens);
console.log('grammar tips:', tips, `(${((tips / cards.length) * 100).toFixed(1)}%)`);
console.log('dict entries:', Object.keys(myDict).length, '| new verbs:', newRegular.length, '+', Object.keys(irrMap).length, 'irregular');
if (errors.length) {
  console.log('\nERRORS (' + errors.length + '):');
  errors.forEach(e => console.log(' -', e));
  process.exit(1);
}
console.log('\nALL CHECKS PASSED');
