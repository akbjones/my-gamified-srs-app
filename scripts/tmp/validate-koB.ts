/**
 * Validation for pilot slice B (ko-0076..ko-0150) against the REAL engine.
 * Checks: JSON parse, id sequence/uniqueness, priority, audio, tags,
 * sentence uniqueness, word-count band, register (sentence-final -요),
 * offenders, tip length/coverage, verb derivation via real haeyo/findInfinitive,
 * token resolution via real lookupWord semantics with slice dict merged in.
 */
import * as fs from 'fs';
import * as path from 'path';
import { haeyo, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const dir = path.dirname(new URL(import.meta.url).pathname);
const cards = JSON.parse(fs.readFileSync(path.join(dir, 'ko-cards-B.json'), 'utf8'));
const dict: Record<string, { en: string; ipa: string; pos?: string; lemma?: string }> =
  JSON.parse(fs.readFileSync(path.join(dir, 'ko-dict-B.json'), 'utf8'));
const verbs: (string | [string, string])[] =
  JSON.parse(fs.readFileSync(path.join(dir, 'ko-verbs-B.json'), 'utf8'));

const errors: string[] = [];
const warn: string[] = [];

// ── card-level checks ──────────────────────────────────────────────
if (cards.length !== 75) errors.push(`expected 75 cards, got ${cards.length}`);
const targets = new Set<string>();
const offenders = ['당신', '너 ', ' 너', '금일', '명일', '본인', '귀하', '하오니', '바랍니다', '야,', ' 야 '];
let tips = 0;
cards.forEach((c: any, i: number) => {
  const n = 76 + i;
  const id = `ko-${String(n).padStart(4, '0')}`;
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} != ${n}`);
  if (c.audio !== `ko-${id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== 'node-02') errors.push(`${c.id}: bad grammarNode`);
  if (targets.has(c.target)) errors.push(`${c.id}: duplicate sentence`);
  targets.add(c.target);
  const words = c.target.replace(/[.?!]/g, '').trim().split(/\s+/);
  if (words.length < 2 || words.length > 8) errors.push(`${c.id}: ${words.length} words out of 2-8 band`);
  // structural register check: final token ends in 요 (해요체) before punctuation
  const finalTok = words[words.length - 1];
  if (!finalTok.endsWith('요')) errors.push(`${c.id}: sentence-final "${finalTok}" not 해요체`);
  for (const off of offenders) if (c.target.includes(off.trim()) && off.trim().length > 1) errors.push(`${c.id}: offender ${off}`);
  if (/(^|\s)(너|야|당신|금일|명일|본인)(\s|[을를이가은는도.?!]|$)/.test(c.target)) errors.push(`${c.id}: offender token`);
  if (c.grammar) {
    tips++;
    if ([...c.grammar].length > 120) errors.push(`${c.id}: tip ${[...c.grammar].length} chars > 120`);
    if (!/\([^)]*[a-z][^)]*\)/.test(c.grammar)) errors.push(`${c.id}: tip lacks romanization in parens`);
  }
});

// ── verb checks against REAL engine ────────────────────────────────
const pairMap = new Map<string, string>();
const newBare: string[] = [];
for (const v of verbs) {
  if (Array.isArray(v)) pairMap.set(v[0], v[1]);
  else newBare.push(v);
}
for (const v of [...newBare, ...pairMap.keys()]) {
  if (KNOWN_VERBS.includes(v)) warn.push(`verbs-B lists ${v} already in KNOWN_VERBS`);
}
// every new bare verb must derive correctly with the real engine
for (const v of newBare) {
  const form = haeyo(v);
  if (!form) errors.push(`engine cannot derive ${v}`);
}
// pair-listed verbs: real engine derivation must match the given form
// (these are regular-path derivable; pairs are seed metadata for IRREGULARS)
for (const [v, f] of pairMap) {
  const got = haeyo(v);
  if (got !== f) errors.push(`pair mismatch ${v}: engine says ${got}, pair says ${f}`);
}

// verb tokens used in sentences: resolve lemma, check haeyo(lemma) === form
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로'
];
function mergedLookup(w: string) {
  // real lookupWord semantics with slice dict merged in
  const real = lookupWord(w);
  if (real) return real;
  if (dict[w]) return dict[w];
  const lem = findInfinitive(w);
  if (lem && dict[lem]) return { ...dict[lem], lemma: lem };
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      if (dict[base]) return dict[base];
      const l2 = findInfinitive(base);
      if (l2 && dict[l2]) return { ...dict[l2], lemma: l2 };
    }
  }
  return null;
}

let verbTokens = 0, tokens = 0;
const unresolved: string[] = [];
for (const c of cards) {
  for (const raw of c.target.split(/\s+/)) {
    const w = raw.replace(/[^가-힣]/g, '');
    if (!w) continue;
    tokens++;
    const entry = mergedLookup(w);
    if (!entry) { unresolved.push(`${c.id}: ${w}`); continue; }
    // verb-form check: any token that IS a conjugated -요 form in our dict
    if (w.endsWith('요') && dict[w]?.pos === 'v') {
      verbTokens++;
      const lemma = dict[w].lemma ?? findInfinitive(w);
      if (!lemma) { errors.push(`${c.id}: verb ${w} has no lemma`); continue; }
      const derived = haeyo(lemma);
      if (derived !== w) errors.push(`${c.id}: haeyo(${lemma}) = ${derived} != ${w}`);
      // also verify findInfinitive OR dict lemma path exists
      const viaEngine = findInfinitive(w);
      if (viaEngine && viaEngine !== lemma) errors.push(`${c.id}: findInfinitive(${w}) = ${viaEngine} != lemma ${lemma}`);
    }
  }
}
for (const u of unresolved) errors.push(`unresolved token ${u}`);

// dict lemmas must exist as their own entries (or in seed via lookupWord)
for (const [k, e] of Object.entries(dict)) {
  if (e.lemma && !dict[e.lemma] && !lookupWord(e.lemma)) errors.push(`dict: lemma ${e.lemma} of ${k} missing`);
  if (!e.en || !e.ipa) errors.push(`dict: ${k} missing en/ipa`);
}

// ── report ─────────────────────────────────────────────────────────
console.log(`cards: ${cards.length}`);
console.log(`unique sentences: ${targets.size}`);
console.log(`tips: ${tips} (${(100 * tips / cards.length).toFixed(1)}%)`);
console.log(`dict entries: ${Object.keys(dict).length}`);
console.log(`new verbs: ${newBare.length} bare + ${pairMap.size} pairs`);
console.log(`tokens checked: ${tokens}, verb tokens: ${verbTokens}`);
const tagCount: Record<string, number> = {};
for (const c of cards) for (const t of c.tags) tagCount[t] = (tagCount[t] ?? 0) + 1;
console.log(`tags: ${JSON.stringify(tagCount)}`);
if (warn.length) console.log('WARNINGS:\n' + warn.join('\n'));
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
