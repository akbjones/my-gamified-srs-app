// Stricter audit for slice D — mirrors scripts/tmp/audit-ko-D.ts:
// builds a verbForms set from the verbs list (does NOT push to KNOWN_VERBS),
// so it catches coverage that only works after the real merge. Any token that
// still fails here should have an explicit slice-dict surface entry.
import { readFileSync, existsSync } from 'node:fs';
import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future } from '../../src/data/conjugation/ko';
import cards from './wave4-ko-cards-D.json';
import sliceDictRaw from './wave4-ko-dict-D.json';
import verbsRaw from './wave4-ko-verbs-D.json';
import deck from '../../src/data/korean/deck.json';

type Card = { id: string; target: string; english: string };
const sliceDict = sliceDictRaw as Record<string, { en: string; ipa: string; pos?: string; lemma?: string }>;
const verbs = verbsRaw as (string | [string, string])[];
const DIR = new URL('.', import.meta.url).pathname;

const S_BASE = 0xac00, V_COUNT = 21, T_COUNT = 28, T_SS = 20;
function decompose(ch: string): [number, number, number] | null {
  const c = ch.charCodeAt(0) - S_BASE;
  if (c < 0 || c > 11171) return null;
  return [Math.floor(c / (V_COUNT * T_COUNT)), Math.floor((c % (V_COUNT * T_COUNT)) / T_COUNT), c % T_COUNT];
}
function compose(i: number, v: number, f: number) {
  return String.fromCharCode(S_BASE + i * V_COUNT * T_COUNT + v * T_COUNT + f);
}
function pastFromHaeyo(h: string): string | null {
  if (!h.endsWith('요')) return null;
  const pre = h.slice(0, -1);
  const last = pre[pre.length - 1];
  const d = decompose(last);
  if (!d || d[2] !== 0) return null;
  return pre.slice(0, -1) + compose(d[0], d[1], T_SS) + '어요';
}

const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다', '으로', '에는', '이랑', '하고', '께',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로',
];
function inSliceDict(w: string): boolean {
  if (sliceDict[w]) return true;
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length && sliceDict[w.slice(0, -p.length)]) return true;
  }
  return false;
}

const verbForms = new Set<string>();
function addForm(f: string | null | undefined) {
  if (!f) return;
  const first = f.split(' ')[0];
  verbForms.add(first);
  if (first.endsWith('요')) verbForms.add(first.slice(0, -1));
}
for (const entry of verbs) {
  if (typeof entry === 'string') {
    const v = entry;
    const h = haeyo(v);
    if (!h) continue;
    verbForms.add(v);
    addForm(h);
    verbForms.add(v.slice(0, -1) + '고');
    addForm(past(v));
    addForm(future(v));
  } else {
    const [dict, h] = entry;
    verbForms.add(dict);
    verbForms.add(h);
    if (h.endsWith('요')) verbForms.add(h.slice(0, -1));
    verbForms.add(dict.slice(0, -1) + '고');
    const p = pastFromHaeyo(h);
    if (p) { verbForms.add(p); verbForms.add(p.slice(0, -1)); }
  }
}

function covered(w: string): boolean {
  if (!w) return true;
  if (lookupWord(w)) return true;
  if (findInfinitive(w)) return true;
  if (inSliceDict(w)) return true;
  if (verbForms.has(w)) return true;
  // particle strip then retry lookupWord/findInfinitive (mirror lookupWord)
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const b = w.slice(0, -p.length);
      if (lookupWord(b) || findInfinitive(b) || inSliceDict(b) || verbForms.has(b)) return true;
    }
  }
  return false;
}

const uncovered = new Map<string, { count: number; cards: string[] }>();
for (const c of cards as Card[]) {
  for (const rt of c.target.split(/\s+/)) {
    const w = rt.replace(/[^가-힣]/g, '');
    if (!w) continue;
    if (!covered(w)) {
      const e = uncovered.get(w) ?? { count: 0, cards: [] };
      e.count++;
      if (e.cards.length < 4) e.cards.push(c.id);
      uncovered.set(w, e);
    }
  }
}

const deckTargets = new Set((deck as Card[]).map((c) => c.target.trim()));
const sibTargets = new Set<string>();
for (const sib of ['wave4-ko-cards-A.json', 'wave4-ko-cards-C.json']) {
  if (existsSync(DIR + sib)) (JSON.parse(readFileSync(DIR + sib, 'utf8')) as Card[]).forEach((c) => sibTargets.add(c.target.trim()));
}
const dupes: string[] = [];
const seen = new Set<string>();
for (const c of cards as Card[]) {
  const t = c.target.trim();
  if (deckTargets.has(t)) dupes.push(`${c.id}::deck::${t}`);
  if (sibTargets.has(t)) dupes.push(`${c.id}::sibling::${t}`);
  if (seen.has(t)) dupes.push(`${c.id}::internal::${t}`);
  seen.add(t);
}

console.log('DUPLICATES:', dupes.length);
dupes.forEach((d) => console.log('  ✗', d));
console.log('UNCOVERED (' + uncovered.size + '):');
for (const [w, e] of [...uncovered.entries()].sort((a, b) => b[1].count - a[1].count)) {
  console.log(`  · ${w}  x${e.count}  ${e.cards.join(',')}`);
}
