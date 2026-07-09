import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future } from '../../src/data/conjugation/ko';
import cards from './wave3-ko-cards-D.json';
import sliceDictRaw from './wave3-ko-dict-D.json';
import verbsRaw from './wave3-ko-verbs-D.json';
import deck from '../../src/data/korean/deck.json';
import cardsA from './wave3-ko-cards-A.json';
import cardsB from './wave3-ko-cards-B.json';

type Card = { id: string; target: string; english: string };
const sliceDict = sliceDictRaw as Record<string, { en: string; ipa: string; pos?: string; lemma?: string }>;
const verbs = verbsRaw as (string | [string, string])[];

// ---- jamo helpers for deriving past from a given haeyo form (irregulars) ----
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

// ---- particle list (mirror of dictionary ko.ts) for slice-dict strip ----
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다', '으로', '에는', '이랑', '하고', '께',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로',
];
function inSliceDict(w: string): boolean {
  if (sliceDict[w]) return true;
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      if (sliceDict[base]) return true;
    }
  }
  return false;
}

// ---- build covered verb-form set from slice verbs ----
const verbForms = new Set<string>();
const verbConjIssues: string[] = [];
function addForm(f: string | null | undefined) {
  if (!f) return;
  const first = f.split(' ')[0];
  verbForms.add(first);
  if (first.endsWith('요')) verbForms.add(first.slice(0, -1)); // bare connective -어
}
for (const entry of verbs) {
  if (typeof entry === 'string') {
    const v = entry;
    const h = haeyo(v);
    if (!h) { verbConjIssues.push(v); continue; }
    verbForms.add(v);
    addForm(h);
    verbForms.add(v.slice(0, -1) + '고');
    addForm(past(v));
    const f = future(v);
    if (f) addForm(f);
  } else {
    const [dict, h] = entry;
    // irregular spec: seeded from {dict, haeyo}
    verbForms.add(dict);
    verbForms.add(h);
    if (h.endsWith('요')) verbForms.add(h.slice(0, -1));
    verbForms.add(dict.slice(0, -1) + '고');
    const p = pastFromHaeyo(h);
    if (p) { verbForms.add(p); verbForms.add(p.slice(0, -1)); }
  }
}

// ---- coverage decision per token ----
function covered(w: string): string {
  if (!w) return 'empty';
  if (lookupWord(w)) return 'lookupWord';
  if (findInfinitive(w)) return 'findInfinitive';
  if (inSliceDict(w)) return 'sliceDict';
  if (verbForms.has(w)) return 'verbForm';
  return '';
}

const uncovered = new Map<string, { count: number; cards: string[] }>();
for (const c of cards as Card[]) {
  const rawToks = c.target.split(/\s+/);
  for (const rt of rawToks) {
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

// ---- duplicate target check ----
const norm = (s: string) => s.trim();
const deckTargets = new Set((deck as Card[]).map((c) => norm(c.target)));
const aTargets = new Set((cardsA as Card[]).map((c) => norm(c.target)));
const bTargets = new Set((cardsB as Card[]).map((c) => norm(c.target)));
const dupes: string[] = [];
const seen = new Set<string>();
for (const c of cards as Card[]) {
  const t = norm(c.target);
  if (deckTargets.has(t)) dupes.push(`${c.id}::deck::${t}`);
  if (aTargets.has(t)) dupes.push(`${c.id}::A::${t}`);
  if (bTargets.has(t)) dupes.push(`${c.id}::B::${t}`);
  if (seen.has(t)) dupes.push(`${c.id}::internal::${t}`);
  seen.add(t);
}

// ---- report ----
console.log('=== VERB CONJ ISSUES ===');
console.log(JSON.stringify(verbConjIssues));
console.log('=== DUPLICATES ===');
console.log(JSON.stringify(dupes, null, 1));
console.log('=== UNCOVERED TOKENS (' + uncovered.size + ') ===');
const sorted = [...uncovered.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [w, e] of sorted) {
  console.log(`${w}\tx${e.count}\t${e.cards.join(',')}`);
}
