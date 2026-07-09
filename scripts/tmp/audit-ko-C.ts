import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future } from '../../src/data/conjugation/ko';
import * as fs from 'fs';
import * as path from 'path';

const HERE = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones/scripts/tmp';
const cards = JSON.parse(fs.readFileSync(path.join(HERE, 'wave3-ko-cards-C.json'), 'utf8'));
const sliceDict: Record<string, any> = JSON.parse(fs.readFileSync(path.join(HERE, 'wave3-ko-dict-C.json'), 'utf8'));
const verbs: any[] = JSON.parse(fs.readFileSync(path.join(HERE, 'wave3-ko-verbs-C.json'), 'utf8'));

// ── jamo arithmetic (mirror of engine) ──
const S_BASE = 0xac00;
const V_COUNT = 21, T_COUNT = 28;
function decompose(ch: string): [number, number, number] | null {
  const c = ch.charCodeAt(0) - S_BASE;
  if (c < 0 || c > 11171) return null;
  return [Math.floor(c / (V_COUNT * T_COUNT)), Math.floor((c % (V_COUNT * T_COUNT)) / T_COUNT), c % T_COUNT];
}
function compose(ini: number, vow: number, fin: number): string {
  return String.fromCharCode(S_BASE + ini * V_COUNT * T_COUNT + vow * T_COUNT + fin);
}
const T_SS = 20, T_L = 8;
const V = { a: 0, eo: 4, o: 8, wa: 9, u: 13, wo: 14, eu: 18, i: 20 };

// past from a given haeyo surface (ㅆ 받침 algebra)
function pastFromHaeyo(hy: string): string | null {
  if (!hy || !hy.endsWith('요')) return null;
  const pre = hy.slice(0, -1);
  const last = pre[pre.length - 1];
  const d = decompose(last);
  if (!d || d[2] !== 0) return null;
  return pre.slice(0, -1) + compose(d[0], d[1], T_SS) + '어요';
}

// PARTICLES mirror (for slice-dict particle stripping)
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다', '으로', '에는', '이랑', '하고', '께',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로'
];

// ── Build covered surface set from slice verbs ──
const verbForms = new Set<string>();
const verbConjIssues: string[] = [];
function addForm(f: string | null) {
  if (!f) return;
  const first = f.includes(' ') ? f.split(' ')[0] : f;
  verbForms.add(first);
  if (first.endsWith('요')) verbForms.add(first.slice(0, -1)); // banmal / connective
}
for (const spec of verbs) {
  let dict: string, hy: string | null;
  if (typeof spec === 'string') {
    dict = spec;
    hy = haeyo(dict);
    if (!hy) { verbConjIssues.push(dict); continue; }
  } else {
    dict = spec.dict;
    hy = spec.haeyo;
    // validate irregular spec well-formed
    if (!dict || !dict.endsWith('다') || !hy) verbConjIssues.push(JSON.stringify(spec));
  }
  const stem = dict.slice(0, -1);
  // present
  addForm(hy);
  // connective -어/아 already added via banmal strip of hy
  // -고 connective
  verbForms.add(stem + '고');
  // past
  const pst = typeof spec === 'string' ? past(dict) : pastFromHaeyo(hy!);
  addForm(pst);
  // future first word
  const fut = typeof spec === 'string' ? future(dict) : null;
  if (fut) addForm(fut);
  // generic future adnominal (best effort) for irregulars: stem+(으)ㄹ
  if (typeof spec !== 'string') {
    const last = stem[stem.length - 1];
    const d = decompose(last);
    if (d) {
      if (d[2] === 0) verbForms.add(stem.slice(0, -1) + compose(d[0], d[1], T_L));
      else if (d[2] === T_L) verbForms.add(stem);
      else verbForms.add(stem + '을');
    }
  }
}

function inSliceDict(tok: string, w: string): boolean {
  if (sliceDict[tok]) return true;
  if (sliceDict[w]) return true;
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      if (sliceDict[base]) return true;
    }
  }
  return false;
}

function covered(tok: string): boolean {
  const w = tok.replace(/[^가-힣]/g, '');
  if (!w) return true; // no hangul → skip
  if (lookupWord(tok)) return true;
  if (lookupWord(w)) return true;
  if (findInfinitive(w)) return true;
  if (inSliceDict(tok, w)) return true;
  if (verbForms.has(w)) return true;
  return false;
}

// ── Coverage pass ──
const uncovered = new Map<string, { tok: string; count: number; cards: string[] }>();
for (const c of cards) {
  const toks = String(c.target).split(/\s+/).filter(Boolean);
  for (const raw of toks) {
    const w = raw.replace(/[^가-힣]/g, '');
    if (!w) continue;
    if (!covered(raw)) {
      const key = w;
      const e = uncovered.get(key) ?? { tok: raw, count: 0, cards: [] };
      e.count++;
      if (e.cards.length < 5 && !e.cards.includes(c.id)) e.cards.push(c.id);
      uncovered.set(key, e);
    }
  }
}

// ── (a) cards present, sequential ids, non-empty ──
const structIssues: string[] = [];
if (cards.length !== 250) structIssues.push(`card count ${cards.length} != 250`);
const ids = cards.map((c: any) => c.id);
for (let i = 0; i < cards.length; i++) {
  const expected = `ko-${String(1801 + i).padStart(4, '0')}`;
  if (cards[i].id !== expected) structIssues.push(`id[${i}] ${cards[i].id} != ${expected}`);
  if (!cards[i].target || !String(cards[i].target).trim()) structIssues.push(`${cards[i].id} empty target`);
  if (!cards[i].english || !String(cards[i].english).trim()) structIssues.push(`${cards[i].id} empty english`);
}

// ── (b) duplicate targets ──
const norm = (s: string) => String(s).trim();
const deck = JSON.parse(fs.readFileSync(path.join(HERE, '../../src/data/korean/deck.json'), 'utf8'));
const deckTargets = new Set(deck.map((c: any) => norm(c.target)));
const siblingTargets = new Set<string>();
for (const s of ['A', 'B', 'D']) {
  const sc = JSON.parse(fs.readFileSync(path.join(HERE, `wave3-ko-cards-${s}.json`), 'utf8'));
  for (const c of sc) siblingTargets.add(norm(c.target));
}
const dupTargets: string[] = [];
const seenInC = new Set<string>();
for (const c of cards) {
  const t = norm(c.target);
  if (deckTargets.has(t)) dupTargets.push(`${c.id}: deck dup: ${t}`);
  else if (siblingTargets.has(t)) dupTargets.push(`${c.id}: sibling dup: ${t}`);
  else if (seenInC.has(t)) dupTargets.push(`${c.id}: intra-C dup: ${t}`);
  seenInC.add(t);
}

const out = {
  uncovered: [...uncovered.entries()].map(([k, v]) => ({ w: k, tok: v.tok, count: v.count, cards: v.cards })),
  structIssues,
  dupTargets,
  verbConjIssues,
  verbFormsSize: verbForms.size,
  sliceDictKeys: Object.keys(sliceDict).length,
};
fs.writeFileSync(path.join(HERE, 'audit-ko-C-out.json'), JSON.stringify(out, null, 2));
console.log('UNCOVERED', out.uncovered.length);
for (const u of out.uncovered) console.log('  ', u.w, '<', u.tok, '> x', u.count, u.cards.join(','));
console.log('STRUCT ISSUES', structIssues.length, structIssues.slice(0, 10));
console.log('DUP TARGETS', dupTargets.length, dupTargets.slice(0, 10));
console.log('VERB CONJ ISSUES', verbConjIssues.length, verbConjIssues);
