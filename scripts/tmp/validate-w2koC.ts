/**
 * Validation for wave2 slice C (ko-0801..ko-1050, node-09/node-10) — REAL engine.
 * Run: npx tsx scripts/tmp/validate-w2koC.ts
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { haeyo, past, future, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const dir = dirname(fileURLToPath(import.meta.url));
const cards: any[] = JSON.parse(readFileSync(join(dir, 'wave2-ko-cards-C.json'), 'utf8'));
const myDict: Record<string, { en: string; ipa: string; pos?: string; lemma?: string }> =
  JSON.parse(readFileSync(join(dir, 'wave2-ko-dict-C.json'), 'utf8'));
const verbsOut: (string | [string, string])[] = JSON.parse(readFileSync(join(dir, 'wave2-ko-verbs-C.json'), 'utf8'));
const existingTargets = new Set(
  readFileSync(join(dir, '../../src/data/korean/deck.json'), 'utf8')
    ? (JSON.parse(readFileSync(join(dir, '../../src/data/korean/deck.json'), 'utf8')) as any[]).map(c => c.target)
    : []
);

const errors: string[] = [];

// ── 1. Card structure ─────────────────────────────────────────────
if (cards.length !== 250) errors.push(`expected 250 cards, got ${cards.length}`);
const seenTargets = new Set<string>();
cards.forEach((c, i) => {
  const n = 801 + i;
  const id = `ko-${String(n).padStart(4, '0')}`;
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} !== ${n}`);
  if (c.audio !== `ko-${c.id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  const node = n <= 925 ? 'node-09' : 'node-10';
  if (c.grammarNode !== node) errors.push(`${c.id}: bad grammarNode ${c.grammarNode}`);
  if (!c.target || !c.english) errors.push(`${c.id}: missing target/english`);
  if (seenTargets.has(c.target)) errors.push(`${c.id}: DUPLICATE sentence in slice: ${c.target}`);
  if (existingTargets.has(c.target)) errors.push(`${c.id}: DUPLICATE of existing deck sentence: ${c.target}`);
  seenTargets.add(c.target);
  const wc = c.target.trim().split(/\s+/).length;
  if (wc < 2 || wc > 8) errors.push(`${c.id}: word count ${wc} out of band 2-8: ${c.target}`);
  if (c.grammar) {
    if (c.grammar.length > 120) errors.push(`${c.id}: tip ${c.grammar.length} chars > 120`);
    if (!/\([a-zA-Z]/.test(c.grammar)) errors.push(`${c.id}: tip lacks romanization in parens`);
  }
});

// ── 2. Register: structural + offender lexicon ────────────────────
const OFFENDER_SUBSTR = ['당신', '금일', '명일', '본인', '귀하', '하오니', '바랍니다'];
const OFFENDER_TOKEN = ['너', '야'];
for (const c of cards) {
  const t: string = c.target;
  for (const o of OFFENDER_SUBSTR) if (t.includes(o)) errors.push(`${c.id}: offender ${o}`);
  const toks = t.split(/\s+/).map((x: string) => x.replace(/[^가-힣]/g, '')).filter(Boolean);
  for (const tok of toks) if (OFFENDER_TOKEN.includes(tok)) errors.push(`${c.id}: offender token ${tok}`);
  const last = toks[toks.length - 1];
  // policy: 해요체 (-요) canonical; -니다 allowed only for sanctioned set phrases
  if (!last.endsWith('요') && !last.endsWith('니다'))
    errors.push(`${c.id}: sentence does not end in 해요체/-니다: ${t}`);
  // sanctioned 합니다체 must carry a tip on the card
  if (last.endsWith('니다') && !c.grammar)
    errors.push(`${c.id}: 합니다체 set phrase without a tip: ${t}`);
}

// honorific first-use tips: 계세요 / 드세요 must be tipped where first used
for (const h of ['계세요', '드세요']) {
  const first = cards.find(c => c.target.includes(h));
  if (first && !first.grammar?.includes(h))
    errors.push(`${first.id}: first use of honorific ${h} lacks a tip naming it`);
}

// ── 3. Verbs output sanity ────────────────────────────────────────
const irrMap: Record<string, string> = {};
const newRegular: string[] = [];
for (const v of verbsOut) {
  if (Array.isArray(v)) irrMap[v[0]] = v[1];
  else newRegular.push(v);
}
for (const v of [...newRegular, ...Object.keys(irrMap)]) {
  if (KNOWN_VERBS.includes(v)) errors.push(`verbs-C: ${v} already in KNOWN_VERBS`);
  if (!v.endsWith('다')) errors.push(`verbs-C: ${v} not a -다 form`);
}
for (const v of newRegular) {
  if (!haeyo(v)) errors.push(`verbs-C: engine cannot derive ${v}`);
}

// ── 4. Token resolution + verb-form correctness ───────────────────
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

const hasFinal = (ch: string) => {
  const c = ch.charCodeAt(0) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
};

// Acceptable surface forms for a lemma: 해요체 present, past, future stem word,
// or the bare -아/어 connective (used before auxiliary 봐요/주세요).
function formOk(lemma: string, w: string): boolean {
  const h = irrMap[lemma] ?? haeyo(lemma);
  if (!h) return false;
  if (w === h) return true;
  if (h.endsWith('요') && w === h.slice(0, -1)) return true; // connective 입어, 써
  // past: derive from the (possibly seeded) haeyo form the same way the engine does
  const p = past(lemma) ?? derivePastFrom(h);
  if (p && w === p) return true;
  const f = future(lemma);
  if (f && w === f.split(' ')[0]) return true;
  return false;
}
function derivePastFrom(polite: string): string | null {
  const pre = polite.slice(0, -1);
  const last = pre[pre.length - 1];
  const c = last.charCodeAt(0) - 0xac00;
  if (c < 0 || c > 11171 || c % 28 !== 0) return null;
  return pre.slice(0, -1) + String.fromCharCode(last.charCodeAt(0) + 20) + '어요';
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

    const lemma = findInfinitive(w) ?? myDict[w]?.lemma ?? null;
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
    } else if (!formOk(lemma, w)) {
      errors.push(`${c.id}: ${w} — not a sanctioned form of ${lemma} (haeyo=${irrMap[lemma] ?? haeyo(lemma)}, past=${past(lemma)}, fut=${future(lemma)})`);
    }
  }
}
for (const u of unresolved) errors.push(`unresolved token: ${u}`);

// every conjugated dict entry's lemma must itself resolve + derive correctly
for (const [k, v] of Object.entries(myDict)) {
  if (!v.lemma || v.lemma === '이다') continue;
  if (!get(v.lemma)) errors.push(`dict-C: lemma ${v.lemma} of ${k} has no entry`);
  if (!formOk(v.lemma, k)) errors.push(`dict-C: ${k} is not a sanctioned form of ${v.lemma}`);
}

// ── 5. Report ─────────────────────────────────────────────────────
const tips = cards.filter(c => c.grammar).length;
const tagCounts: Record<string, number> = {};
cards.forEach(c => c.tags.forEach((t: string) => (tagCounts[t] = (tagCounts[t] ?? 0) + 1)));
const uniqueWords = new Set<string>();
cards.forEach(c => c.target.split(/\s+/).forEach((r: string) => {
  const w = r.replace(/[^가-힣]/g, '');
  if (w) uniqueWords.add(w);
}));

console.log('cards:', cards.length, '(ko-0801..ko-1050)');
console.log('unique sentences:', seenTargets.size, '| unique surface words:', uniqueWords.size);
console.log('tokens checked:', tokenCount, '| unresolved:', unresolved.length);
console.log('verb tokens form-checked:', verbTokens);
console.log('grammar tips:', tips, `(${((tips / cards.length) * 100).toFixed(1)}%)`);
console.log('tags:', JSON.stringify(tagCounts));
console.log('dict entries:', Object.keys(myDict).length, '| new verbs:', newRegular.length, '+', Object.keys(irrMap).length, 'irregular');
if (errors.length) {
  console.log('\nERRORS (' + errors.length + '):');
  errors.forEach(e => console.log(' -', e));
  process.exit(1);
}
console.log('\nALL CHECKS PASSED');
