import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future, conjugate } from '../../src/data/conjugation/ko';
import cards from './wave4-ko-cards-B.json';
import sliceDictRaw from './wave4-ko-dict-B.json';
import verbsRaw from './wave4-ko-verbs-B.json';
import deck from '../../src/data/korean/deck.json';

type Card = { id: string; target: string; english: string; grammar?: string; grammarNode?: string };
const sliceDict = sliceDictRaw as Record<string, { en: string; ipa: string; pos?: string; lemma?: string }>;
const verbs = verbsRaw as (string | [string, string])[];

// jamo helpers for pastFromHaeyo (irregular tuples)
const S_BASE = 0xac00, V_COUNT = 21, T_COUNT = 28, T_SS = 20;
function decompose(ch: string): [number, number, number] | null {
  const c = ch.charCodeAt(0) - S_BASE;
  if (c < 0 || c > 11171) return null;
  return [Math.floor(c / (V_COUNT * T_COUNT)), Math.floor((c % (V_COUNT * T_COUNT)) / T_COUNT), c % T_COUNT];
}
function compose(i: number, v: number, f: number) { return String.fromCharCode(S_BASE + i * V_COUNT * T_COUNT + v * T_COUNT + f); }
function pastFromHaeyo(h: string): string | null {
  if (!h.endsWith('요')) return null;
  const pre = h.slice(0, -1); const last = pre[pre.length - 1]; const d = decompose(last);
  if (!d || d[2] !== 0) return null;
  return pre.slice(0, -1) + compose(d[0], d[1], T_SS) + '어요';
}

// particle list for slice-dict strip (superset incl. honorific 께서/께서는)
const PARTICLES = [
  '에서는','에서도','한테서','으로는','까지는','께서는','에게서',
  '에서','에게','한테','부터','까지','처럼','보다','마다','으로','에는','에도','이랑','하고','께서','께',
  '은','는','이','가','을','를','에','도','만','와','과','랑','의','로',
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

// build covered verb-form set: harvest ALL tenses from conjugate() for regular
// slice verbs; haeyo/past/connective for irregular tuples.
const verbForms = new Set<string>();
const verbConjIssues: string[] = [];
function addForm(f: string | null | undefined) {
  if (!f) return;
  const first = f.split(' ')[0];
  verbForms.add(first);
  if (first.endsWith('요')) verbForms.add(first.slice(0, -1));
}
for (const entry of verbs) {
  if (typeof entry === 'string') {
    const v = entry;
    const t = conjugate(v);
    if (!t) { verbConjIssues.push(v); continue; }
    verbForms.add(v);
    verbForms.add(v.slice(0, -1) + '고');
    for (const forms of Object.values(t.tenses)) for (const f of forms) addForm(f);
    addForm(past(v)); addForm(future(v)); addForm(haeyo(v));
  } else {
    const [dict, h] = entry;
    verbForms.add(dict); verbForms.add(h);
    if (h.endsWith('요')) verbForms.add(h.slice(0, -1));
    verbForms.add(dict.slice(0, -1) + '고');
    const p = pastFromHaeyo(h);
    if (p) { verbForms.add(p); verbForms.add(p.slice(0, -1)); }
  }
}

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
  for (const rt of c.target.split(/\s+/)) {
    const w = rt.replace(/[^가-힣]/g, '');
    if (!w) continue;
    if (!covered(w)) {
      const e = uncovered.get(w) ?? { count: 0, cards: [] };
      e.count++; if (e.cards.length < 5) e.cards.push(c.id); uncovered.set(w, e);
    }
  }
}

// duplicate target check (vs deck + internal)
const norm = (s: string) => s.trim();
const deckTargets = new Set((deck as Card[]).map((c) => norm(c.target)));
const dupes: string[] = []; const seen = new Set<string>();
for (const c of cards as Card[]) {
  const tt = norm(c.target);
  if (deckTargets.has(tt)) dupes.push(`${c.id}::deck::${tt}`);
  if (seen.has(tt)) dupes.push(`${c.id}::internal::${tt}`); seen.add(tt);
}

// structural register: final Hangul syllable must be 요 (haeyo-che) or end 니다
const regIssues: string[] = [];
const BANNED = ['당신', '너희', '반말'];
for (const c of cards as Card[]) {
  const t = c.target.replace(/[.?!\s"']+$/u, '');
  const lastH = [...t].reverse().find((ch) => /[가-힣]/.test(ch)) ?? '';
  if (!(lastH === '요' || t.endsWith('니다'))) regIssues.push(`${c.id}::end='${lastH}'::${c.target}`);
  for (const b of BANNED) if (c.target.includes(b)) regIssues.push(`${c.id}::banned '${b}'::${c.target}`);
  // 반말: bare -어/아 declarative would end in a non-요 vowel syllable, already caught above
}

// tip length + count
let tipCount = 0; const tipLong: string[] = [];
for (const c of cards as Card[]) if (c.grammar) { tipCount++; if (c.grammar.length > 120) tipLong.push(`${c.id}::${c.grammar.length}`); }

console.log('=== VERB CONJ ISSUES ===', JSON.stringify(verbConjIssues));
console.log('=== DUPLICATES ===', JSON.stringify(dupes, null, 1));
console.log('=== REGISTER/STRUCTURAL ISSUES (' + regIssues.length + ') ===');
for (const r of regIssues) console.log(r);
console.log('=== TIPS: count=' + tipCount + ' long=' + JSON.stringify(tipLong));
console.log('=== UNCOVERED TOKENS (' + uncovered.size + ') ===');
for (const [w, e] of [...uncovered.entries()].sort((a, b) => b[1].count - a[1].count))
  console.log(`${w}\tx${e.count}\t${e.cards.join(',')}`);
