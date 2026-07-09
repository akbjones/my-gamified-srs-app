/**
 * Validate wave-3 Korean slice B (ko-1551..1800) against the REAL engine
 * and dictionary. Mirrors merge-ko-wave2.ts gates + post-merge coverage
 * (new verbs seeded into the reverse map the way the merge will).
 */
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future } from '../../src/data/conjugation/ko';

const ROOT = new URL('../..', import.meta.url).pathname;

interface Card { id: string; target: string; english: string; audio: string; tags: string[]; grammarNode: string; priority: number; grammar?: string }
interface DictEntry { en: string; ipa?: string; pos?: string; lemma?: string }
type VerbSpec = string | { dict: string; haeyo: string };

const cards: Card[] = JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave3-ko-cards-B.json`, 'utf8'));
let myDict: Record<string, DictEntry> = {};
try { myDict = JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave3-ko-dict-B.json`, 'utf8')); } catch { /* first pass */ }
const verbs: VerbSpec[] = JSON.parse(readFileSync(`${ROOT}scripts/tmp/wave3-ko-verbs-B.json`, 'utf8'));

const problems: string[] = [];

// ── ids / audio / tags / priority ──
cards.forEach((c, i) => {
  const want = `ko-${String(i + 1551).padStart(4, '0')}`;
  if (c.id !== want) problems.push(`id: got ${c.id}, want ${want}`);
  if (c.audio !== `ko-${c.id}.mp3`) problems.push(`${c.id}: audio ${c.audio}`);
  if (c.priority !== i + 1551) problems.push(`${c.id}: priority ${c.priority}`);
  if (!c.tags.includes('general')) problems.push(`${c.id}: no general tag`);
  const node = i < 125 ? 'node-15' : 'node-16';
  if (c.grammarNode !== node) problems.push(`${c.id}: node ${c.grammarNode}`);
});

// ── verb specs: regulars derivable, irregulars NOT (else list as regular) ──
const newForms = new Set<string>();
const addForms = (dict: string, polite: string) => {
  const fut = future(dict);
  // past from the polite form (ㅆ-받침 algebra), like the engine does
  const pre = polite.slice(0, -1);
  const last = pre[pre.length - 1];
  const c = last.charCodeAt(0) - 0xac00;
  let pst: string | null = null;
  if (c >= 0 && c <= 11171 && c % 28 === 0) {
    pst = pre.slice(0, -1) + String.fromCharCode(last.charCodeAt(0) + 20) + '어요';
  }
  const conn = polite.slice(0, -1);
  const go = dict.slice(0, -1) + '고';
  for (const f of [polite, pst, fut, dict, conn, go]) {
    if (!f) continue;
    for (const p of f.split(' ')) { newForms.add(p); if (p.endsWith('요')) newForms.add(p.slice(0, -1)); }
  }
};
for (const v of verbs) {
  if (typeof v === 'string') {
    const h = haeyo(v);
    if (!h) { problems.push(`regular verb not derivable: ${v}`); continue; }
    addForms(v, h);
  } else {
    const engineSays = haeyo(v.dict);
    if (engineSays === v.haeyo) problems.push(`"${v.dict}" is engine-derivable (${engineSays}) — list as regular`);
    addForms(v.dict, v.haeyo);
  }
}

// ── token coverage: real lookup ∪ my dict (with particle strip) ∪ new verb forms ──
const PARTICLES = ['에서는','에서도','한테서','으로는','까지는','에서','에게','한테','부터','까지','처럼','보다','마다','으로','에는','이랑','하고','께','은','는','이','가','을','를','에','도','만','와','과','랑','의','로'];
const myLookup = (w: string): boolean => {
  if (myDict[w]) return true;
  if (newForms.has(w)) return true;
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      if (myDict[base] || newForms.has(base)) return true;
      const lem = findInfinitive(base);
      if (lem) return true;
    }
  }
  return false;
};
const missing = new Map<string, string[]>();
for (const c of cards) {
  for (const raw of c.target.split(/\s+/)) {
    const tok = raw.replace(/[^가-힣]/g, '');
    if (!tok) continue;
    if (lookupWord(tok)) continue;
    if (findInfinitive(tok)) continue;
    if (myLookup(tok)) continue;
    if (!missing.has(tok)) missing.set(tok, []);
    missing.get(tok)!.push(c.id);
  }
}

// ── my dict entries sanity: lemma resolvable, verb lemmas conjugatable ──
const newVerbSet = new Set(verbs.map(v => (typeof v === 'string' ? v : v.dict)));
for (const [k, e] of Object.entries(myDict)) {
  if (e.lemma && e.lemma !== '이다' && !newVerbSet.has(e.lemma) && !haeyo(e.lemma)) {
    problems.push(`dict "${k}": lemma ${e.lemma} not conjugatable`);
  }
  if (!e.en || !e.ipa) problems.push(`dict "${k}": missing en/ipa`);
}

console.log(`cards: ${cards.length}, dict entries: ${Object.keys(myDict).length}, verbs: ${verbs.length}`);
if (missing.size) {
  console.log(`\n${missing.size} UNCOVERED tokens:`);
  for (const [t, ids] of missing) console.log(`  ${t}  (${ids.slice(0, 3).join(',')})`);
}
if (problems.length) {
  console.log(`\n${problems.length} PROBLEMS:`);
  for (const p of problems) console.log('  ·', p);
}
if (!missing.size && !problems.length) console.log('ALL GREEN');
