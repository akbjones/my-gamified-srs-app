/**
 * Validation for wave3 slice A (ko-1301..ko-1550, node-13 health / node-14 weather).
 * Uses the REAL engine. Run: npx tsx scripts/tmp/validate-w3koA.ts
 * Coverage-only listing: npx tsx scripts/tmp/validate-w3koA.ts --uncovered
 * Adapted from validate-w2koD.ts (latest-generation checks) + register scan from validate-w2koA.ts.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { haeyo, past, future, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const dir = dirname(fileURLToPath(import.meta.url));
const cards: any[] = JSON.parse(readFileSync(join(dir, 'wave3-ko-cards-A.json'), 'utf8'));
const dictPath = join(dir, 'wave3-ko-dict-A.json');
const myDict: Record<string, { en: string; ipa: string; pos?: string; lemma?: string }> =
  existsSync(dictPath) ? JSON.parse(readFileSync(dictPath, 'utf8')) : {};
const verbsOut: (string | { dict: string; haeyo: string })[] =
  JSON.parse(readFileSync(join(dir, 'wave3-ko-verbs-A.json'), 'utf8'));
const deck: any[] = JSON.parse(readFileSync(join(dir, '../../src/data/korean/deck.json'), 'utf8'));
const uncoveredOnly = process.argv.includes('--uncovered');

const errors: string[] = [];
const norm = (t: string) => t.replace(/[^가-힣 ]/g, '').replace(/\s+/g, ' ').trim();
const existingTargets = new Set(deck.map(c => norm(c.target)));

// ── 1. Card structure + register ──────────────────────────────────
if (cards.length !== 250) errors.push(`expected 250 cards, got ${cards.length}`);
const seenTargets = new Set<string>();
cards.forEach((c, i) => {
  const n = 1301 + i;
  const id = `ko-${n}`;
  const node = n <= 1425 ? 'node-13' : 'node-14';
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} !== ${n}`);
  if (c.audio !== `ko-${c.id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== node) errors.push(`${c.id}: bad grammarNode ${c.grammarNode} (want ${node})`);
  if (!c.target || !c.english) errors.push(`${c.id}: missing target/english`);
  const nt = norm(c.target);
  if (seenTargets.has(nt)) errors.push(`${c.id}: DUPLICATE sentence in slice: ${c.target}`);
  if (existingTargets.has(nt)) errors.push(`${c.id}: DUPLICATE of existing deck sentence: ${c.target}`);
  seenTargets.add(nt);
  if (c.grammar && c.grammar.length > 120) errors.push(`${c.id}: tip ${c.grammar.length} chars > 120`);
  // register: every sentence must end in a -요 form (해요체)
  for (const s of c.target.split(/(?<=[.!?])\s+/)) {
    const w = s.replace(/[^가-힣]/g, '');
    if (w && !w.endsWith('요')) errors.push(`${c.id}: sentence not 해요체-final: "${s}"`);
  }
  if (/(^|[^가-힣])(너|야|당신)([^가-힣]|$)/.test(c.target)) errors.push(`${c.id}: banmal/marked pronoun`);
});

// register offenders scan
const off = JSON.parse(readFileSync(join(dir, '../../docs/korean-register-offenders.json'), 'utf8'));
for (const c of cards) {
  const toks = new Set(norm(c.target).split(' '));
  for (const o of off.offenders) {
    if (toks.has(o.word)) errors.push(`${c.id}: register offender ${o.word} (${o.severity})`);
  }
}

// ── 2. Verb specs ─────────────────────────────────────────────────
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

function derivePastFrom(polite: string): string | null {
  const pre = polite.slice(0, -1);
  const last = pre[pre.length - 1];
  const c = last.charCodeAt(0) - 0xac00;
  if (c < 0 || c > 11171 || c % 28 !== 0) return null;
  return pre.slice(0, -1) + String.fromCharCode(last.charCodeAt(0) + 20) + '어요';
}

// token → lemma for every sanctioned surface form of a new wave-3 verb
const verbFormLemma = new Map<string, string>();
const addForm = (f: string | null, lemma: string) => {
  if (!f) return;
  const w = f.split(' ')[0];
  if (!verbFormLemma.has(w)) verbFormLemma.set(w, lemma);
  if (w.endsWith('요') && !verbFormLemma.has(w.slice(0, -1)))
    verbFormLemma.set(w.slice(0, -1), lemma); // bare connective
};
for (const lemma of [...newRegular, ...Object.keys(irrMap)]) {
  const h = irrMap[lemma] ?? haeyo(lemma);
  addForm(h, lemma);
  addForm(h ? derivePastFrom(h) : null, lemma);
  addForm(future(lemma), lemma);
  addForm(lemma, lemma);
  if (h) addForm(h.slice(0, -1) + '고', lemma); // not a surface; guard only
  addForm(lemma.slice(0, -1) + '고', lemma);    // -고 connective (먹고)
}

// ── 3. Token resolution (mirrors real lookupWord over merged dict) ─
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다', '으로', '에는', '이랑', '하고', '께',
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

// Sanctioned surface forms: 해요체 present, past, future stem word, bare
// -아/어 connective, -고 connective, -아/어서 connective.
function formOk(lemma: string, w: string): boolean {
  const h = irrMap[lemma] ?? haeyo(lemma);
  if (!h) return false;
  if (w === h) return true;
  if (h.endsWith('요') && w === h.slice(0, -1)) return true;         // 재, 가
  if (h.endsWith('요') && w === h.slice(0, -1) + '서') return true;  // 아파서
  if (w === lemma.slice(0, -1) + '고') return true;                  // 먹고
  const p = irrMap[lemma] ? derivePastFrom(h) : (past(lemma) ?? derivePastFrom(h));
  if (p && (w === p || (p.endsWith('요') && w === p.slice(0, -1)))) return true;
  if (p && p.endsWith('요') && w === p.slice(0, -1) + '서') return true; // 걸렸어서 guard (rare)
  if (!irrMap[lemma]) {
    const f = future(lemma);
    if (f && w === f.split(' ')[0]) return true;                     // 갈 (거예요/때/것)
  }
  return false;
}

// Honorific copula surface (이시다)
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
    if (!v.en || !v.ipa) errors.push(`dict-A: ${k} missing en/ipa`);
    if (!v.lemma) continue;
    if (!get(v.lemma)) errors.push(`dict-A: lemma ${v.lemma} of ${k} has no entry`);
    if (v.lemma === '이다') continue;
    if (v.lemma === '이시다') {
      if (!isidaOk(k)) errors.push(`dict-A: ${k} is not an honorific copula surface`);
    } else if (!formOk(v.lemma, k)) errors.push(`dict-A: ${k} is not a sanctioned form of ${v.lemma}`);
  }
}

// ── 4. Report ─────────────────────────────────────────────────────
const tips = cards.filter(c => c.grammar).length;
const tagCounts: Record<string, number> = {};
cards.forEach(c => c.tags.forEach((t: string) => (tagCounts[t] = (tagCounts[t] ?? 0) + 1)));
console.log('cards:', cards.length, '(ko-1301..ko-1550)');
console.log('tokens checked:', tokenCount, '| unresolved:', unresolved.length);
if (uncoveredOnly) {
  const uniq = [...new Set(unresolved.map(u => u.split(': ')[1]))];
  console.log('unique uncovered tokens:', uniq.length);
  for (const u of uniq) console.log(u);
  process.exit(0);
}
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
