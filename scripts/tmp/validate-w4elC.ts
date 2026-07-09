/* Full validation for wave-4 slice C (el-2801..el-3050). */
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { conjugate, findInfinitive, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const dir = new URL('.', import.meta.url).pathname;
const ROOT = dir + '../../';
const cards = JSON.parse(readFileSync(dir + 'wave4-el-cards-C.json', 'utf8'));
const dict = JSON.parse(readFileSync(dir + 'wave4-el-dict-C.json', 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(dir + 'wave4-el-verbs-C.json', 'utf8'));
const deck = JSON.parse(readFileSync(ROOT + 'src/data/greek/deck.json', 'utf8'));
const offenders = JSON.parse(readFileSync(ROOT + 'docs/greek-register-offenders.json', 'utf8'))
  .offenders.map((o: any) => stripAccents(normalizeGreek(o.word)));
const siblings = ['A', 'B'].flatMap(s => {
  try { return JSON.parse(readFileSync(dir + `wave4-el-cards-${s}.json`, 'utf8')); } catch { return []; }
});

const IEME = new Set(['βαριέμαι', 'στενοχωριέμαι']);
const errs: string[] = [], warn: string[] = [];

// 1. structure
if (cards.length !== 250) errs.push(`card count ${cards.length} != 250`);
cards.forEach((c: any, i: number) => {
  const n = 2801 + i;
  if (c.id !== `el-${n}`) errs.push(`${c.id}: expected el-${n}`);
  if (c.priority !== n) errs.push(`${c.id}: priority ${c.priority}`);
  if (c.audio !== `el-el-${n}.mp3`) errs.push(`${c.id}: audio ${c.audio}`);
  if (!c.tags?.includes('general')) errs.push(`${c.id}: no general tag`);
  const wantNode = n <= 2925 ? 'node-25' : 'node-26';
  if (c.grammarNode !== wantNode) errs.push(`${c.id}: node ${c.grammarNode} != ${wantNode}`);
  if (!c.target || !c.english) errs.push(`${c.id}: missing target/english`);
});

// 2. uniqueness vs deck + siblings (accent-blind), word band 3-10
const norm = (t: string) => stripAccents(normalizeGreek(t)).replace(/[^α-ω ]/g, '').replace(/\s+/g, ' ').trim();
const seen = new Map<string, string>();
for (const c of [...deck, ...siblings]) seen.set(norm(c.target), c.id);
for (const c of cards) {
  const k = norm(c.target);
  if (seen.has(k)) errs.push(`${c.id}: DUP of ${seen.get(k)}: ${c.target}`);
  seen.set(k, c.id);
  const words = c.target.split(/\s+/).filter((w: string) => /[Α-Ωα-ωΆ-Ώά-ώϊϋΐΰΪΫ]/.test(w));
  if (words.length < 3 || words.length > 10) errs.push(`${c.id}: ${words.length} words: ${c.target}`);
}

// 3. offenders
for (const c of cards) {
  const toks = new Set(norm(c.target).split(' '));
  for (const o of offenders) if (toks.has(o)) errs.push(`${c.id}: OFFENDER ${o}`);
}

// 4. verbs file conjugable; collect engine forms
const verbForms = new Set<string>();
for (const v of verbs) {
  const t = conjugate(v);
  if (!t) { errs.push(`verbs: ${v} not conjugable`); continue; }
  for (const forms of Object.values(t.tenses)) for (const f of forms as string[]) for (const p of f.split(' ')) verbForms.add(normalizeGreek(p));
  verbForms.add(normalizeGreek(v));
}

// 5. token coverage
const tokenize = (s: string) => s.replace(/[;,.!?·«»()—:'’"]/g, ' ').split(/\s+/).filter(Boolean);
const usedKeys = new Set<string>();
const uncovered: Record<string, string[]> = {};
for (const c of cards) for (const raw of tokenize(c.target)) {
  const key = normalizeGreek(raw);
  if (!/[α-ωάέήίόύώϊϋΐΰ]/.test(key)) continue;
  usedKeys.add(key);
  if (dict[key] || verbForms.has(key) || lookupWord(key) || findInfinitive(key)) continue;
  errs.push(`${c.id}: token '${raw}' uncovered`);
  (uncovered[key] ||= []).push(c.id);
}

// 6. dict hygiene + engine-exactness
for (const [k, e] of Object.entries<any>(dict)) {
  if (k !== normalizeGreek(k)) errs.push(`dict key not normalized: ${k}`);
  if (!e.en || !e.ipa || !e.pos) errs.push(`dict ${k}: missing en/ipa/pos`);
  if (e.lemma) {
    const lk = normalizeGreek(e.lemma);
    if (!dict[lk] && !lookupWord(lk)) errs.push(`dict ${k}: lemma ${e.lemma} has no entry`);
    if (!conjugate(e.lemma)) {
      if (IEME.has(e.lemma)) warn.push(`dict ${k}: -ιέμαι lemma (engine gap)`);
      else errs.push(`dict ${k}: lemma ${e.lemma} NOT conjugatable`);
    } else {
      const t = conjugate(e.lemma)!;
      const all = new Set<string>();
      for (const fs of Object.values(t.tenses)) for (const f of fs as string[]) all.add(normalizeGreek(f.replace(/^θα /, '')));
      const ok = all.has(k) || [...all].some(f => stripAccents(f) === stripAccents(k));
      if (!ok) warn.push(`dict ${k}: not engine-produced from ${e.lemma}`);
    }
  } else if (e.pos === 'v') {
    if (!conjugate(k) && !findInfinitive(k)) {
      if (IEME.has(k)) warn.push(`dict ${k}: -ιέμαι citation`);
      else errs.push(`dict ${k}: verb without lemma not conjugatable`);
    }
  }
  if (!usedKeys.has(k)) {
    const isAnchor = Object.values<any>(dict).some(v => v.lemma && normalizeGreek(v.lemma) === k);
    if (!isAnchor) warn.push(`dict key unused: ${k}`);
  }
}

// 7. tips
let tips = 0;
for (const c of cards) {
  if (!c.grammar) continue;
  tips++;
  if (c.grammar.length > 120) errs.push(`${c.id}: tip ${c.grammar.length} chars`);
}

// 8. tags
const tagCount: Record<string, number> = {};
for (const c of cards) for (const t of c.tags) tagCount[t] = (tagCount[t] || 0) + 1;

console.log(`cards: ${cards.length}, dict: ${Object.keys(dict).length}, verbs: ${verbs.length}`);
console.log(`tips: ${tips} (${(tips * 100 / cards.length).toFixed(1)}%)`);
console.log('tags:', JSON.stringify(tagCount), '=>', Object.fromEntries(Object.entries(tagCount).map(([k, v]) => [k, (v * 100 / 250).toFixed(0) + '%'])));
console.log('siblings loaded:', siblings.length);
if (Object.keys(uncovered).length) console.log(`\nUNCOVERED TOKENS (${Object.keys(uncovered).length}):\n` + Object.entries(uncovered).map(([k, ids]) => `  ${k}  (${ids.length}x, e.g. ${ids[0]})`).join('\n'));
if (warn.length) console.log(`\n${warn.length} WARN:\n` + warn.slice(0, 60).join('\n'));
if (errs.length) { console.error(`\n${errs.length} ERRORS:\n` + errs.slice(0, 120).join('\n')); process.exit(1); }
console.log('\nALL CHECKS PASSED');
