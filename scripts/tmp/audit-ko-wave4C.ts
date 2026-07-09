import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future } from '../../src/data/conjugation/ko';
import * as fs from 'fs';
import * as path from 'path';
const HERE = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones/scripts/tmp';
const cards = JSON.parse(fs.readFileSync(path.join(HERE, 'wave4-ko-cards-C.json'), 'utf8'));
const sliceDict: Record<string, any> = JSON.parse(fs.readFileSync(path.join(HERE, 'wave4-ko-dict-C.json'), 'utf8'));
const verbs: any[] = JSON.parse(fs.readFileSync(path.join(HERE, 'wave4-ko-verbs-C.json'), 'utf8'));
const S_BASE = 0xac00; const V_COUNT = 21, T_COUNT = 28;
function decompose(ch: string): [number, number, number] | null { const c = ch.charCodeAt(0) - S_BASE; if (c < 0 || c > 11171) return null; return [Math.floor(c/(V_COUNT*T_COUNT)), Math.floor((c%(V_COUNT*T_COUNT))/T_COUNT), c%T_COUNT]; }
function compose(ini: number, vow: number, fin: number): string { return String.fromCharCode(S_BASE + ini*V_COUNT*T_COUNT + vow*T_COUNT + fin); }
const T_SS = 20, T_L = 8;
function pastFromHaeyo(hy: string): string | null { if (!hy || !hy.endsWith('요')) return null; const pre = hy.slice(0,-1); const last = pre[pre.length-1]; const d = decompose(last); if (!d || d[2] !== 0) return null; return pre.slice(0,-1) + compose(d[0], d[1], T_SS) + '어요'; }
const PARTICLES = ['에서는','에서도','한테서','으로는','까지는','에서','에게','한테','부터','까지','처럼','보다','마다','으로','에는','이랑','하고','께','은','는','이','가','을','를','에','도','만','와','과','랑','의','로'];
const verbForms = new Set<string>(); const verbConjIssues: string[] = [];
function addForm(f: string | null) { if (!f) return; const first = f.includes(' ') ? f.split(' ')[0] : f; verbForms.add(first); if (first.endsWith('요')) verbForms.add(first.slice(0,-1)); }
for (const spec of verbs) {
  let dict: string, hy: string | null;
  if (typeof spec === 'string') { dict = spec; hy = haeyo(dict); if (!hy) { verbConjIssues.push(dict); continue; } }
  else { dict = spec.dict; hy = spec.haeyo; if (!dict || !dict.endsWith('다') || !hy) verbConjIssues.push(JSON.stringify(spec)); }
  const stem = dict.slice(0, -1);
  addForm(hy);
  verbForms.add(stem + '고');
  const pst = typeof spec === 'string' ? past(dict) : pastFromHaeyo(hy!);
  addForm(pst);
  const fut = typeof spec === 'string' ? future(dict) : null;
  if (fut) addForm(fut);
  if (typeof spec !== 'string') { const last = stem[stem.length-1]; const d = decompose(last); if (d) { if (d[2]===0) verbForms.add(stem.slice(0,-1)+compose(d[0],d[1],T_L)); else if (d[2]===T_L) verbForms.add(stem); else verbForms.add(stem+'을'); } }
}
function inSliceDict(tok: string, w: string): boolean { if (sliceDict[tok]) return true; if (sliceDict[w]) return true; for (const p of PARTICLES) { if (w.endsWith(p) && w.length > p.length) { const base = w.slice(0, -p.length); if (sliceDict[base]) return true; } } return false; }
function covered(tok: string): boolean { const w = tok.replace(/[^가-힣]/g, ''); if (!w) return true; if (lookupWord(tok)) return true; if (lookupWord(w)) return true; if (findInfinitive(w)) return true; if (inSliceDict(tok, w)) return true; if (verbForms.has(w)) return true; return false; }
const uncovered = new Map<string, { tok: string; count: number; cards: string[] }>();
for (const c of cards) { for (const raw of String(c.target).split(/\s+/).filter(Boolean)) { const w = raw.replace(/[^가-힣]/g, ''); if (!w) continue; if (!covered(raw)) { const e = uncovered.get(w) ?? { tok: raw, count: 0, cards: [] }; e.count++; if (e.cards.length < 5 && !e.cards.includes(c.id)) e.cards.push(c.id); uncovered.set(w, e); } } }
const structIssues: string[] = [];
if (cards.length !== 250) structIssues.push(`card count ${cards.length} != 250`);
for (let i = 0; i < cards.length; i++) { const expected = `ko-${String(2801 + i).padStart(4, '0')}`; if (cards[i].id !== expected) structIssues.push(`id[${i}] ${cards[i].id} != ${expected}`); if (!cards[i].target || !String(cards[i].target).trim()) structIssues.push(`${cards[i].id} empty target`); if (!cards[i].english || !String(cards[i].english).trim()) structIssues.push(`${cards[i].id} empty english`); }
const norm = (s: string) => String(s).trim();
const deck = JSON.parse(fs.readFileSync(path.join(HERE, '../../src/data/korean/deck.json'), 'utf8'));
const deckTargets = new Set(deck.map((c: any) => norm(c.target)));
const siblingTargets = new Set<string>();
for (const s of ['A', 'B', 'D']) { const p = path.join(HERE, `wave4-ko-cards-${s}.json`); if (fs.existsSync(p)) { const sc = JSON.parse(fs.readFileSync(p, 'utf8')); for (const c of sc) siblingTargets.add(norm(c.target)); } }
const dupTargets: string[] = []; const seenInC = new Set<string>();
for (const c of cards) { const t = norm(c.target); if (deckTargets.has(t)) dupTargets.push(`${c.id}: deck dup: ${t}`); else if (siblingTargets.has(t)) dupTargets.push(`${c.id}: sibling dup: ${t}`); else if (seenInC.has(t)) dupTargets.push(`${c.id}: intra-C dup: ${t}`); seenInC.add(t); }
const out = { uncovered: [...uncovered.entries()].map(([k, v]) => ({ w: k, tok: v.tok, count: v.count, cards: v.cards })), structIssues, dupTargets, verbConjIssues, verbFormsSize: verbForms.size, sliceDictKeys: Object.keys(sliceDict).length };
fs.writeFileSync(path.join(HERE, 'audit-ko-wave4C-out.json'), JSON.stringify(out, null, 2));
console.log('UNCOVERED', out.uncovered.length, 'STRUCT', structIssues.length, 'DUP', dupTargets.length, 'VERBCONJ', verbConjIssues.length);
