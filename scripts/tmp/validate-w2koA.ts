/**
 * Validation for wave2 slice A (ko-0301..ko-0550, node-05/node-06).
 * Uses the REAL engine. Run: npx tsx scripts/tmp/validate-w2koA.ts
 * Adapted from validate-wave2-koB.ts; adds cross-slice checks vs B/C/D.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { haeyo, past, future, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';
import deck from '../../src/data/korean/deck.json';

const dir = dirname(fileURLToPath(import.meta.url));
const cards: any[] = JSON.parse(readFileSync(join(dir, 'wave2-ko-cards-A.json'), 'utf8'));
const myDict: Record<string, { en: string; ipa: string; pos?: string; lemma?: string }> =
  JSON.parse(readFileSync(join(dir, 'wave2-ko-dict-A.json'), 'utf8'));
const verbsOut: (string | { dict: string; haeyo: string })[] =
  JSON.parse(readFileSync(join(dir, 'wave2-ko-verbs-A.json'), 'utf8'));

const errors: string[] = [];

// ── 1. Card structure ─────────────────────────────────────────────
if (cards.length !== 250) errors.push(`expected 250 cards, got ${cards.length}`);
const norm = (t: string) => t.replace(/[^가-힣 ]/g, '').replace(/\s+/g, ' ').trim();
const existingTargets = new Set((deck as any[]).map(c => norm(c.target)));
const siblingTargets = new Map<string, string>();
for (const s of ['B', 'C', 'D']) {
  try {
    for (const c of JSON.parse(readFileSync(join(dir, `wave2-ko-cards-${s}.json`), 'utf8')))
      siblingTargets.set(norm(c.target), `${s}:${c.id}`);
  } catch { /* slice optional */ }
}
const seenTargets = new Set<string>();
cards.forEach((c, i) => {
  const n = 301 + i;
  const id = `ko-${String(n).padStart(4, '0')}`;
  const node = n <= 425 ? 'node-05' : 'node-06';
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} !== ${n}`);
  if (c.audio !== `ko-${c.id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== node) errors.push(`${c.id}: bad grammarNode ${c.grammarNode}`);
  if (!c.target || !c.english) errors.push(`${c.id}: missing target/english`);
  const nt = norm(c.target);
  if (seenTargets.has(nt)) errors.push(`${c.id}: DUPLICATE sentence: ${c.target}`);
  if (existingTargets.has(nt)) errors.push(`${c.id}: duplicates EXISTING deck sentence: ${c.target}`);
  if (siblingTargets.has(nt)) errors.push(`${c.id}: duplicates sibling ${siblingTargets.get(nt)}: ${c.target}`);
  seenTargets.add(nt);
  if (c.grammar && c.grammar.length > 120) errors.push(`${c.id}: tip ${c.grammar.length} chars > 120`);
  // register: each sentence in the target must end in a -요 form
  for (const s of c.target.split(/(?<=[.!?])\s+/)) {
    const w = s.replace(/[^가-힣]/g, '');
    if (w && !w.endsWith('요')) errors.push(`${c.id}: sentence not 해요체-final: "${s}"`);
  }
});

// ── 2. Verbs output sanity ────────────────────────────────────────
const irrMap: Record<string, string> = {};
const newRegular: string[] = [];
for (const v of verbsOut) {
  if (typeof v === 'string') newRegular.push(v);
  else irrMap[v.dict] = v.haeyo;
}
for (const v of [...newRegular, ...Object.keys(irrMap)]) {
  if (KNOWN_VERBS.includes(v)) errors.push(`verbs-A: ${v} already in KNOWN_VERBS`);
  if (!v.endsWith('다')) errors.push(`verbs-A: ${v} not a -다 form`);
}
for (const v of newRegular) {
  if (!haeyo(v)) errors.push(`verbs-A: engine cannot derive ${v}`);
}

// expected forms per new verb: present, past (ㅆ algebra on haeyo), future
const T_SS = 20;
function pastFromHaeyo(h: string): string | null {
  const pre = h.slice(0, -1);
  const c = pre.charCodeAt(pre.length - 1) - 0xac00;
  if (c < 0 || c > 11171 || c % 28 !== 0) return null;
  return pre.slice(0, -1) + String.fromCharCode(0xac00 + c + T_SS) + '어요';
}
function expectedForms(lemma: string): Set<string> {
  const forms = new Set<string>();
  const h = irrMap[lemma] ?? haeyo(lemma);
  if (h) {
    forms.add(h);
    const p = irrMap[lemma] ? pastFromHaeyo(irrMap[lemma]) : past(lemma);
    if (p) forms.add(p);
  }
  if (!irrMap[lemma]) {
    const f = future(lemma);
    if (f) forms.add(f); // "stem 거예요"
  }
  return forms;
}

// ── 3. Token resolution + verb-form correctness ───────────────────
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로',
];
const findInf = (w: string) => {
  try { return findInfinitive(w); } catch { return null; }
};
const safeLookup = (w: string) => {
  try { return lookupWord(w); } catch { return null; }
};
const get = (w: string) => myDict[w] ?? safeLookup(w) ?? null;
function resolve(w: string) {
  if (myDict[w]) return myDict[w];
  const real = safeLookup(w);
  if (real) return real;
  const lem = findInf(w);
  if (lem && get(lem)) return { ...get(lem)!, lemma: lem };
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      const hit = get(base);
      if (hit) return hit;
      const l2 = findInf(base);
      if (l2 && get(l2)) return { ...get(l2)!, lemma: l2 };
    }
  }
  return null;
}

const hasFinal = (ch: string) => {
  const c = ch.charCodeAt(0) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
};

let tokenCount = 0;
const unresolved: string[] = [];
let verbTokens = 0;
for (const c of cards) {
  const rawTokens = c.target.split(/\s+/).map((r: string) => r.replace(/[^가-힣]/g, ''));
  for (let ti = 0; ti < rawTokens.length; ti++) {
    const w = rawTokens[ti];
    if (!w) continue;
    tokenCount++;
    const entry = resolve(w);
    if (!entry) { unresolved.push(`${c.id}: ${w}`); continue; }

    const lemma = myDict[w]
      ? (myDict[w].lemma ?? null)
      : (safeLookup(w)?.lemma ?? findInf(w) ?? null);
    if (!lemma || w.endsWith('다')) continue;
    if (entry.pos === 'phrase') continue;
    verbTokens++;
    if (lemma === '이다') {
      if (w === '이에요' || w === '예요' || w === '이었어요' || w === '였어요') continue;
      if (w.endsWith('이에요')) {
        const base = w.slice(0, -3);
        if (!base || !hasFinal(base[base.length - 1]))
          errors.push(`${c.id}: ${w} — 이에요 after vowel-final base`);
      } else if (w.endsWith('예요')) {
        const base = w.slice(0, -2);
        if (!base || hasFinal(base[base.length - 1]))
          errors.push(`${c.id}: ${w} — 예요 after consonant-final base`);
      } else errors.push(`${c.id}: ${w} — lemma 이다 but not a recognized copula surface`);
      continue;
    }
    if (lemma === '아니다' || lemma === '이시다') continue;
    const exp = expectedForms(lemma);
    const isFutureStem = rawTokens[ti + 1] === '거예요' && exp.has(`${w} 거예요`);
    if (!exp.has(w) && !isFutureStem) {
      errors.push(`${c.id}: ${w} — not an allowed form of ${lemma} (allowed: ${[...exp].join(', ')})`);
    }
  }
}
for (const u of unresolved) errors.push(`unresolved token: ${u}`);

// ── 4. Dict entry sanity ──────────────────────────────────────────
for (const [k, v] of Object.entries(myDict)) {
  if (!v.en || !v.ipa) errors.push(`dict-A: ${k} missing en/ipa`);
  if (!v.lemma || v.lemma === '이다') continue;
  if (!get(v.lemma)) errors.push(`dict-A: lemma ${v.lemma} of ${k} has no entry`);
  const exp = expectedForms(v.lemma);
  if (!exp.has(k) && !exp.has(`${k} 거예요`))
    errors.push(`dict-A: ${k} is not a present/past/future form of ${v.lemma} (${[...exp].join(', ')})`);
}

// register offenders scan (from docs/korean-register-offenders.json)
const off = JSON.parse(readFileSync(join(dir, '../../docs/korean-register-offenders.json'), 'utf8'));
for (const c of cards) {
  const toks = new Set(norm(c.target).split(' '));
  for (const o of off.offenders) {
    if (toks.has(o.word)) errors.push(`${c.id}: register offender ${o.word} (${o.severity})`);
  }
  if (/(^|[^가-힣])(너|야)([^가-힣]|$)/.test(c.target)) errors.push(`${c.id}: possible banmal pronoun`);
}

// ── 5. Report ─────────────────────────────────────────────────────
const tips = cards.filter(c => c.grammar).length;
const tagCounts: Record<string, number> = {};
cards.forEach(c => c.tags.forEach((t: string) => (tagCounts[t] = (tagCounts[t] ?? 0) + 1)));

console.log('cards:', cards.length, '(ko-0301..ko-0550)');
console.log('unique sentences:', seenTargets.size, '| checked vs deck + slices B/C/D');
console.log('tokens checked:', tokenCount, '| unresolved:', unresolved.length);
console.log('verb tokens form-checked:', verbTokens);
console.log('grammar tips:', tips, `(${((tips / cards.length) * 100).toFixed(1)}%)`);
console.log('tags:', JSON.stringify(tagCounts));
console.log('dict entries:', Object.keys(myDict).length, '| new verbs:', newRegular.length, 'regular +', Object.keys(irrMap).length, 'irregular');
if (errors.length) {
  console.log('\nERRORS (' + errors.length + '):');
  errors.forEach(e => console.log(' -', e));
  process.exit(1);
}
console.log('\nALL CHECKS PASSED');
