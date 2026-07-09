/**
 * Validator for pilot slice D (ko-0226..ko-0300) — intermediates -koD only.
 * Uses the REAL engine (haeyo, findInfinitive, KNOWN_VERBS) and the REAL
 * lookupWord; slice-D dict entries are layered on top the same way the
 * merge will layer them (direct key, lemma via engine, particle strip).
 */
import { readFileSync } from 'fs';
import { haeyo, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const TMP = new URL('.', import.meta.url).pathname;
const cards: any[] = JSON.parse(readFileSync(TMP + 'ko-cards-D.json', 'utf8'));
const dict: Record<string, any> = JSON.parse(readFileSync(TMP + 'ko-dict-D.json', 'utf8'));
const verbs: (string | [string, string])[] = JSON.parse(readFileSync(TMP + 'ko-verbs-D.json', 'utf8'));

const errors: string[] = [];
const warn: string[] = [];

// Irregular pairs from the verbs output (these get seeded into IRREGULARS at merge)
const pairs = new Map<string, string>();
const newVerbs = new Set<string>();
for (const v of verbs) {
  if (Array.isArray(v)) { pairs.set(v[0], v[1]); newVerbs.add(v[0]); }
  else newVerbs.add(v);
}
const haeyoMerged = (lemma: string): string | null => pairs.get(lemma) ?? haeyo(lemma);

// ── 1. Card structure ────────────────────────────────────────────
if (cards.length !== 75) errors.push(`expected 75 cards, got ${cards.length}`);
const seenTargets = new Set<string>();
const OFFENDER_WORDS = ['당신', '금일', '명일', '본인', '귀하', '하오니', '바랍니다', '너', '야'];

cards.forEach((c, i) => {
  const n = 226 + i;
  const id = `ko-${String(n).padStart(4, '0')}`;
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} != ${n}`);
  if (c.audio !== `ko-${id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== 'node-04') errors.push(`${c.id}: bad grammarNode`);
  if (!c.target || !c.english) errors.push(`${c.id}: missing target/english`);
  const keys = Object.keys(c);
  const allowed = ['id', 'target', 'english', 'audio', 'tags', 'grammarNode', 'priority', 'grammar'];
  for (const k of keys) if (!allowed.includes(k)) errors.push(`${c.id}: unexpected field ${k}`);

  // uniqueness + Q1 band
  if (seenTargets.has(c.target)) errors.push(`${c.id}: duplicate sentence`);
  seenTargets.add(c.target);
  const words = c.target.replace(/[.?!]/g, '').trim().split(/\s+/);
  if (words.length < 2 || words.length > 8) errors.push(`${c.id}: ${words.length} words (band 2-8)`);

  // register: structural — sentence-final token ends in 요
  const final = words[words.length - 1];
  if (!final.endsWith('요')) errors.push(`${c.id}: final token "${final}" not 해요체`);

  // offenders (token-exact for 너/야, substring for the rest)
  for (const w of words) {
    if (w === '너' || w === '야') errors.push(`${c.id}: offender token ${w}`);
  }
  for (const off of OFFENDER_WORDS.filter(o => o.length > 1)) {
    if (c.target.includes(off)) errors.push(`${c.id}: offender ${off}`);
  }

  // tips
  if (c.grammar) {
    if (c.grammar.length > 120) errors.push(`${c.id}: tip ${c.grammar.length} chars (>120)`);
    if (!/\([a-zA-Z][^)]*\)/.test(c.grammar)) errors.push(`${c.id}: tip lacks romanization parens`);
  }
});

// ── 2. Token resolution (real lookupWord + slice-D dict layered) ──
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로',
];

function resolveD(w: string): { entry: any; via: string } | null {
  if (dict[w]) return { entry: dict[w], via: 'dictD' };
  const lem = findInfinitive(w);
  if (lem && dict[lem]) return { entry: { ...dict[lem], lemma: lem }, via: 'dictD-lemma' };
  // pair-seeded irregulars (merge seeds IRREGULARS, making findInfinitive resolve these)
  for (const [l, form] of pairs) if (form === w && dict[l]) return { entry: { ...dict[l], lemma: l }, via: 'pair' };
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      if (dict[base]) return { entry: dict[base], via: `dictD strip ${p}` };
      const lm = findInfinitive(base);
      if (lm && dict[lm]) return { entry: { ...dict[lm], lemma: lm }, via: `dictD-lemma strip ${p}` };
    }
  }
  return null;
}

let tokens = 0, viaExisting = 0, viaD = 0;
const verbFormsUsed = new Map<string, string>(); // surface form -> card id (요-final tokens)

for (const c of cards) {
  for (const raw of c.target.split(/\s+/)) {
    const w = raw.replace(/[^가-힣]/g, '');
    if (!w) continue;
    tokens++;
    const real = lookupWord(w);
    const mine = resolveD(w);
    if (real) viaExisting++;
    else if (mine) viaD++;
    else errors.push(`${c.id}: token "${w}" unresolvable`);
    if (w.endsWith('요')) verbFormsUsed.set(w, c.id);
  }
}

// ── 3. Verb audit: every 요-final token is engine-true 해요체 ─────
for (const [form, cid] of verbFormsUsed) {
  const entry = dict[form] ?? null;
  if (entry?.pos === 'phrase') {
    if (form !== '주세요') errors.push(`${cid}: unexpected phrase verb ${form}`);
    continue; // 주세요 is a fixed ordering phrase, not a conjugation
  }
  const lemma = entry?.lemma ?? findInfinitive(form);
  if (!lemma) { errors.push(`${cid}: 요-form "${form}" has no lemma`); continue; }
  const derived = haeyoMerged(lemma);
  if (derived !== form) errors.push(`${cid}: haeyo(${lemma}) = ${derived} != used form ${form}`);
  if (!dict[lemma]) errors.push(`${cid}: dictionary form ${lemma} missing from dict-D`);
  if (!KNOWN_VERBS.includes(lemma) && !newVerbs.has(lemma))
    errors.push(`${cid}: lemma ${lemma} neither in KNOWN_VERBS nor verbs-D`);
}

// verbs-D sanity: every listed verb is actually used and derivable
for (const v of newVerbs) {
  if (KNOWN_VERBS.includes(v)) warn.push(`verbs-D: ${v} already in KNOWN_VERBS`);
  const d = haeyoMerged(v);
  if (!d) errors.push(`verbs-D: ${v} not derivable`);
  else if (!verbFormsUsed.has(d)) warn.push(`verbs-D: ${v} (${d}) listed but never used`);
  if (!pairs.has(v)) {
    // non-pair entries must be engine-derivable with the CURRENT engine
    const eng = haeyo(v);
    if (eng !== d) errors.push(`verbs-D: ${v} needs a pair (engine says ${eng})`);
  }
}

// dict lemma consistency
for (const [k, e] of Object.entries(dict)) {
  if (e.lemma && !dict[e.lemma]) errors.push(`dict-D: ${k} lemma ${e.lemma} has no own entry`);
  if (e.lemma) {
    const d = haeyoMerged(e.lemma);
    if (d !== k) errors.push(`dict-D: entry ${k} != haeyo(${e.lemma}) = ${d}`);
  }
}

// ── report ────────────────────────────────────────────────────────
const tips = cards.filter(c => c.grammar).length;
const tagCount = (t: string) => cards.filter(c => c.tags.includes(t)).length;
console.log(`cards: ${cards.length} (ko-0226..ko-0300)`);
console.log(`unique sentences: ${seenTargets.size}`);
console.log(`tokens: ${tokens} (existing dict: ${viaExisting}, dict-D: ${viaD})`);
console.log(`dict-D entries: ${Object.keys(dict).length}; verbs-D: ${verbs.length} (${pairs.size} pairs)`);
console.log(`tips: ${tips} (${(tips / cards.length * 100).toFixed(1)}%)`);
console.log(`tags: general=${tagCount('general')} travel=${tagCount('travel')} work=${tagCount('work')} family=${tagCount('family')}`);
console.log(`distinct 요-forms used: ${verbFormsUsed.size}`);
if (warn.length) { console.log(`\nWARNINGS (${warn.length}):`); warn.forEach(w => console.log('  ' + w)); }
if (errors.length) {
  console.log(`\nERRORS (${errors.length}):`);
  errors.forEach(e => console.log('  ' + e));
  process.exit(1);
}
console.log('\nALL CHECKS PASSED');
