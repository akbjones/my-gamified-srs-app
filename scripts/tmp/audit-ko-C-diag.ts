import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future } from '../../src/data/conjugation/ko';
import * as fs from 'fs';

const HERE = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones/scripts/tmp';
const cards = JSON.parse(fs.readFileSync(HERE + '/wave3-ko-cards-C.json', 'utf8'));
const sliceDict: Record<string, any> = JSON.parse(fs.readFileSync(HERE + '/wave3-ko-dict-C.json', 'utf8'));
const verbs: any[] = JSON.parse(fs.readFileSync(HERE + '/wave3-ko-verbs-C.json', 'utf8'));

const S_BASE = 0xac00; const V_COUNT = 21, T_COUNT = 28;
function decompose(ch: string): [number, number, number] | null {
  const c = ch.charCodeAt(0) - S_BASE; if (c < 0 || c > 11171) return null;
  return [Math.floor(c / (V_COUNT * T_COUNT)), Math.floor((c % (V_COUNT * T_COUNT)) / T_COUNT), c % T_COUNT];
}
function compose(i: number, v: number, f: number) { return String.fromCharCode(S_BASE + i * V_COUNT * T_COUNT + v * T_COUNT + f); }
const T_SS = 20, T_L = 8;
function pastFromHaeyo(hy: string): string | null {
  if (!hy || !hy.endsWith('요')) return null;
  const pre = hy.slice(0, -1); const last = pre[pre.length - 1]; const d = decompose(last);
  if (!d || d[2] !== 0) return null;
  return pre.slice(0, -1) + compose(d[0], d[1], T_SS) + '어요';
}
const PARTICLES = ['에서는','에서도','한테서','으로는','까지는','에서','에게','한테','부터','까지','처럼','보다','마다','으로','에는','이랑','하고','께','은','는','이','가','을','를','에','도','만','와','과','랑','의','로'];

const verbForms = new Set<string>();
for (const spec of verbs) {
  let dict: string, hy: string | null;
  if (typeof spec === 'string') { dict = spec; hy = haeyo(dict); if (!hy) continue; }
  else { dict = spec.dict; hy = spec.haeyo; }
  const stem = dict.slice(0, -1);
  const add = (f: string | null) => { if (!f) return; const fw = f.includes(' ') ? f.split(' ')[0] : f; verbForms.add(fw); if (fw.endsWith('요')) verbForms.add(fw.slice(0, -1)); };
  add(hy); verbForms.add(stem + '고');
  add(typeof spec === 'string' ? past(dict) : pastFromHaeyo(hy!));
  if (typeof spec === 'string') add(future(dict));
  else { const last = stem[stem.length - 1]; const d = decompose(last); if (d) { if (d[2] === 0) verbForms.add(stem.slice(0, -1) + compose(d[0], d[1], T_L)); else if (d[2] === T_L) verbForms.add(stem); else verbForms.add(stem + '을'); } }
}
function inSliceDict(tok: string, w: string): boolean {
  if (sliceDict[tok] || sliceDict[w]) return true;
  for (const p of PARTICLES) if (w.endsWith(p) && w.length > p.length && sliceDict[w.slice(0, -p.length)]) return true;
  return false;
}

// classify each unique token by FIRST matching path
const pathCount: Record<string, number> = { engineLookup: 0, engineFind: 0, slice: 0, verbForms: 0, NONE: 0 };
const byPath: Record<string, Set<string>> = { engineLookup: new Set(), engineFind: new Set(), slice: new Set(), verbForms: new Set(), NONE: new Set() };
const uniq = new Set<string>();
let totalTok = 0;
for (const c of cards) for (const raw of String(c.target).split(/\s+/).filter(Boolean)) {
  const w = raw.replace(/[^가-힣]/g, ''); if (!w) continue; totalTok++;
  if (uniq.has(raw)) continue; uniq.add(raw);
  let p: string;
  if (lookupWord(raw) || lookupWord(w)) p = 'engineLookup';
  else if (findInfinitive(w)) p = 'engineFind';
  else if (inSliceDict(raw, w)) p = 'slice';
  else if (verbForms.has(w)) p = 'verbForms';
  else p = 'NONE';
  pathCount[p]++; byPath[p].add(raw);
}
console.log('total tokens', totalTok, 'unique', uniq.size);
console.log('by path', pathCount);
console.log('\n--- ONLY slice-covered (sample 40) ---');
console.log([...byPath.slice].slice(0, 40).join(' '));
console.log('\n--- ONLY verbForms-covered (sample 40) ---');
console.log([...byPath.verbForms].slice(0, 40).join(' '));
console.log('\n--- NONE ---');
console.log([...byPath.NONE].join(' '));

// Adversarial: check slice-dict-only tokens where the surface is inflected/particled and
// verify the base actually resolves (not a spurious sliceDict key). Just list slice keys unused.
const usedSliceKeys = new Set<string>();
for (const raw of uniq) {
  const w = raw.replace(/[^가-힣]/g, '');
  if (sliceDict[raw]) usedSliceKeys.add(raw);
  if (sliceDict[w]) usedSliceKeys.add(w);
  for (const pp of PARTICLES) if (w.endsWith(pp) && w.length > pp.length && sliceDict[w.slice(0, -pp.length)]) usedSliceKeys.add(w.slice(0, -pp.length));
}
const unused = Object.keys(sliceDict).filter(k => !usedSliceKeys.has(k));
console.log('\nslice dict keys total', Object.keys(sliceDict).length, 'used', usedSliceKeys.size, 'unused', unused.length);
