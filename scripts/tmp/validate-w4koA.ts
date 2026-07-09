/**
 * Validation for wave4 Korean slice A (ko-2301..ko-2550, node-21 직장&커리어 II /
 * node-22 돈&은행) against the REAL engine + REAL dictionary.
 *   npx tsx scripts/tmp/validate-w4koA.ts
 *   npx tsx scripts/tmp/validate-w4koA.ts --uncovered   # list uncovered tokens only
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { haeyo, past, future, conjugate, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const dir = dirname(fileURLToPath(import.meta.url));
type Entry = { en: string; ipa: string; pos?: string; lemma?: string };
const cards: any[] = JSON.parse(readFileSync(join(dir, 'wave4-ko-cards-A.json'), 'utf8'));
const myDict: Record<string, Entry> = JSON.parse(readFileSync(join(dir, 'wave4-ko-dict-A.json'), 'utf8'));
const verbsOut: (string | { dict: string; haeyo: string })[] =
  JSON.parse(readFileSync(join(dir, 'wave4-ko-verbs-A.json'), 'utf8'));
const deck: any[] = JSON.parse(readFileSync(join(dir, '../../src/data/korean/deck.json'), 'utf8'));
const off = JSON.parse(readFileSync(join(dir, '../../docs/korean-register-offenders.json'), 'utf8'));
const uncoveredOnly = process.argv.includes('--uncovered');
const errors: string[] = [];

const norm = (t: string) => t.replace(/[^가-힣 ]/g, '').replace(/\s+/g, ' ').trim();
const existingTargets = new Set(deck.map(c => norm(c.target)));

// ── 1. Card structure + register ──────────────────────────────────
if (cards.length !== 250) errors.push(`expected 250 cards, got ${cards.length}`);
const seen = new Set<string>();
cards.forEach((c, i) => {
  const n = 2301 + i;
  const id = `ko-${n}`;
  const node = n <= 2425 ? 'node-21' : 'node-22';
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} !== ${n}`);
  if (c.audio !== `ko-${c.id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== node) errors.push(`${c.id}: bad grammarNode ${c.grammarNode} (want ${node})`);
  if (!c.target || !c.english) errors.push(`${c.id}: missing target/english`);
  const nt = norm(c.target);
  if (seen.has(nt)) errors.push(`${c.id}: DUPLICATE in slice: ${c.target}`);
  if (existingTargets.has(nt)) errors.push(`${c.id}: DUPLICATE of deck: ${c.target}`);
  seen.add(nt);
  if (c.grammar && c.grammar.length > 120) errors.push(`${c.id}: tip ${c.grammar.length} chars > 120`);
  // register: every sentence ends in a -요 form
  for (const s of c.target.split(/(?<=[.!?])\s+/)) {
    const w = s.replace(/[^가-힣]/g, '');
    if (w && !w.endsWith('요')) errors.push(`${c.id}: sentence not 해요체-final: "${s}"`);
  }
  if (/(^|[^가-힣])(너|야|당신)([^가-힣]|$)/.test(c.target)) errors.push(`${c.id}: banmal/marked pronoun`);
  const toks = new Set(norm(c.target).split(' '));
  for (const o of off.offenders) if (toks.has(o.word)) errors.push(`${c.id}: register offender ${o.word} (${o.severity})`);
});

// ── 2. Verb specs ─────────────────────────────────────────────────
const irrMap: Record<string, string> = {};
const newRegular: string[] = [];
for (const v of verbsOut) {
  if (typeof v === 'string') newRegular.push(v);
  else irrMap[v.dict] = v.haeyo;
}
for (const v of [...newRegular, ...Object.keys(irrMap)]) {
  if (KNOWN_VERBS.includes(v)) errors.push(`verbs: ${v} already in KNOWN_VERBS`);
  if (!v.endsWith('다')) errors.push(`verbs: ${v} not a -다 form`);
}
for (const v of newRegular) if (!haeyo(v)) errors.push(`verbs: engine cannot derive ${v}`);
// irregular sanity: the engine's naive derivation must DIFFER (else it isn't irregular)
for (const [d, h] of Object.entries(irrMap)) {
  if (haeyo(d) === h) errors.push(`verbs: ${d} listed irregular but engine already derives ${h}`);
}

const hasFinal = (ch: string) => { const c = ch.charCodeAt(0) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0; };
function derivePastFrom(polite: string): string | null {
  const pre = polite.slice(0, -1);
  const last = pre[pre.length - 1];
  const c = last.charCodeAt(0) - 0xac00;
  if (c < 0 || c > 11171 || c % 28 !== 0) return null;
  return pre.slice(0, -1) + String.fromCharCode(last.charCodeAt(0) + 20) + '어요';
}

// Full engine form-set of a regular lemma (mirrors buildReverse indexing).
function engineForms(lemma: string): Set<string> {
  const s = new Set<string>();
  const t = conjugate(lemma);
  if (t) for (const forms of Object.values(t.tenses)) for (const f of forms) {
    for (const part of f.split(' ')) { s.add(part); if (part.endsWith('요')) s.add(part.slice(0, -1)); }
  }
  s.add(lemma);
  return s;
}
// Sanctioned form-set of an irregular lemma from its listed 해요체.
function irregularForms(lemma: string, h: string): Set<string> {
  const s = new Set<string>([lemma, h]);
  if (h.endsWith('요')) { s.add(h.slice(0, -1)); s.add(h.slice(0, -1) + '서'); }
  s.add(lemma.slice(0, -1) + '고');
  const p = derivePastFrom(h);
  if (p) { s.add(p); if (p.endsWith('요')) s.add(p.slice(0, -1)); }
  return s;
}
function formOk(lemma: string, w: string): boolean {
  if (irrMap[lemma]) return irregularForms(lemma, irrMap[lemma]).has(w);
  return engineForms(lemma).has(w);
}
function isidaOk(w: string): boolean {
  for (const [suf, wantFinal] of [['이세요', true], ['이셨어요', true], ['세요', false], ['셨어요', false]] as const) {
    if (!w.endsWith(suf) || w.length <= suf.length) continue;
    const base = w.slice(0, -suf.length);
    return hasFinal(base[base.length - 1]) === wantFinal;
  }
  return false;
}

// token → lemma for every sanctioned surface form of a NEW verb (pre-merge findInfinitive can't).
const verbFormLemma = new Map<string, string>();
for (const lemma of newRegular) for (const w of engineForms(lemma)) if (!verbFormLemma.has(w)) verbFormLemma.set(w, lemma);
for (const [lemma, h] of Object.entries(irrMap)) for (const w of irregularForms(lemma, h)) if (!verbFormLemma.has(w)) verbFormLemma.set(w, lemma);

// ── 3. Token resolution over merged dict (mirrors real lookupWord) ─
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다', '으로', '에는', '에도', '이랑', '하고', '께',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로',
];
const get = (w: string): Entry | null => myDict[w] ?? lookupWord(w) ?? null;
function resolve(w: string): Entry | null {
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

let tokenCount = 0, verbTokens = 0;
const unresolved: string[] = [];
for (const c of cards) {
  for (const raw of c.target.split(/\s+/)) {
    const w = raw.replace(/[^가-힣]/g, '');
    if (!w) continue;
    tokenCount++;
    const entry = resolve(w);
    if (!entry) { unresolved.push(`${c.id}: ${w}`); continue; }
    if (uncoveredOnly) continue;
    if (w.endsWith('다')) continue; // dictionary form token
    const pos = myDict[w]?.pos ?? (lookupWord(w)?.pos);
    if (pos === 'phrase') continue;
    const lemma = findInfinitive(w) ?? verbFormLemma.get(w) ?? myDict[w]?.lemma ?? null;
    if (!lemma) continue; // not a verb-form token (noun/adv/adnominal surface)
    verbTokens++;
    if (lemma === '이다') {
      if (w === '이에요' || w === '예요') continue;
      if (w.endsWith('이에요') || w.endsWith('이었어요')) {
        const base = w.slice(0, -(w.endsWith('이에요') ? 3 : 4));
        if (!base || !hasFinal(base[base.length - 1])) errors.push(`${c.id}: ${w} — 이에요/이었어요 after vowel-final base`);
      } else if (w.endsWith('예요') || w.endsWith('였어요')) {
        const base = w.slice(0, -(w.endsWith('예요') ? 2 : 3));
        if (!base || hasFinal(base[base.length - 1])) errors.push(`${c.id}: ${w} — 예요/였어요 after consonant-final base`);
      } else errors.push(`${c.id}: ${w} — lemma 이다 but not a copula surface`);
    } else if (lemma === '이시다') {
      if (w !== '이세요' && !isidaOk(w)) errors.push(`${c.id}: ${w} — lemma 이시다 but not honorific copula`);
    } else if (!formOk(lemma, w)) {
      errors.push(`${c.id}: ${w} — not a sanctioned form of ${lemma}`);
    }
  }
}
for (const u of unresolved) errors.push(`unresolved token: ${u}`);

if (!uncoveredOnly) {
  // every conjugated dict entry's lemma must resolve + be a sanctioned form
  for (const [k, v] of Object.entries(myDict)) {
    if (!v.lemma) continue;
    if (!get(v.lemma)) errors.push(`dict: lemma ${v.lemma} of ${k} has no entry`);
    if (v.lemma === '이다' || v.lemma === '이시다') continue;
    if (!formOk(v.lemma, k)) errors.push(`dict: ${k} is not a sanctioned form of ${v.lemma}`);
  }
}

// ── 4. Report ─────────────────────────────────────────────────────
if (uncoveredOnly) {
  const uniq = [...new Set(unresolved.map(u => u.split(': ')[1]))].sort();
  console.log('unique uncovered tokens:', uniq.length);
  for (const u of uniq) console.log(' ', u);
  process.exit(0);
}
const tips = cards.filter(c => c.grammar).length;
const tagCount: Record<string, number> = {};
for (const c of cards) for (const t of c.tags) tagCount[t] = (tagCount[t] || 0) + 1;
console.log('cards:', cards.length, '(ko-2301..ko-2550)');
console.log('tokens checked:', tokenCount, '| verb tokens form-checked:', verbTokens, '| unresolved:', unresolved.length);
console.log('grammar tips:', tips, `(${(tips / cards.length * 100).toFixed(1)}%)`);
console.log('tags:', JSON.stringify(tagCount));
console.log('dict entries:', Object.keys(myDict).length, '| new verbs:', newRegular.length, 'regular +', Object.keys(irrMap).length, 'irregular');
if (errors.length) {
  console.log('\nERRORS (' + errors.length + '):');
  errors.slice(0, 60).forEach(e => console.log(' -', e));
  if (errors.length > 60) console.log(`  … ${errors.length - 60} more`);
  process.exit(1);
}
console.log('\nALL CHECKS PASSED');
