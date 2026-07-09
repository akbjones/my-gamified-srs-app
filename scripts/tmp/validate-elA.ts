/** Validate slice A (el-0001..el-0075) against the brief. Intermediate: -elA */
import { readFileSync } from 'fs';
import { conjugate, findInfinitive, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const ROOT = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones';
const cards: any[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/el-cards-A.json`, 'utf8'));
const dict: Record<string, any> = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/el-dict-A.json`, 'utf8'));
const offenders: { word: string }[] = JSON.parse(readFileSync(`${ROOT}/docs/greek-register-offenders.json`, 'utf8')).offenders;

const errs: string[] = [];

// 1. ids sequential/unique, priority, audio, grammarNode, tags
if (cards.length !== 75) errs.push(`card count ${cards.length} != 75`);
cards.forEach((c, i) => {
  const want = `el-${String(i + 1).padStart(4, '0')}`;
  if (c.id !== want) errs.push(`${c.id}: expected id ${want}`);
  if (c.priority !== i + 1) errs.push(`${c.id}: priority ${c.priority} != ${i + 1}`);
  if (c.audio !== `el-${c.id}.mp3`) errs.push(`${c.id}: bad audio ${c.audio}`);
  if (c.grammarNode !== 'node-01') errs.push(`${c.id}: bad grammarNode`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errs.push(`${c.id}: missing general tag`);
  const wc = c.target.split(/\s+/).filter(Boolean).length;
  if (wc < 3 || wc > 10) errs.push(`${c.id}: word count ${wc} out of 3-10 ("${c.target}")`);
  if (c.grammar && c.grammar.length > 120) errs.push(`${c.id}: tip ${c.grammar.length} chars > 120`);
  if (!c.english || !c.target) errs.push(`${c.id}: missing target/english`);
});

// 2. unique sentences
const seen = new Map<string, string>();
for (const c of cards) {
  const k = normalizeGreek(c.target).replace(/[^α-ωάέήίόύώϊϋΐΰ\s]/g, '').trim();
  if (seen.has(k)) errs.push(`${c.id}: duplicate sentence of ${seen.get(k)}`);
  seen.set(k, c.id);
}

// 3. dict key hygiene + entry completeness
for (const [k, v] of Object.entries(dict)) {
  if (k !== normalizeGreek(k)) errs.push(`dict key not σ-normalized/lowercase: ${k}`);
  if (!v.en || !v.ipa || !v.pos) errs.push(`dict entry incomplete: ${k}`);
}

// 4. every target token resolves in dict
const tokenize = (t: string): string[] =>
  t.split(/\s+/)
    .map((w) => normalizeGreek(w).replace(/[^α-ωάέήίόύώϊϋΐΰ-]/g, ''))
    .filter(Boolean);
const allTokens = new Set<string>();
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    allTokens.add(tok);
    if (!dict[tok]) errs.push(`${c.id}: token "${tok}" missing from dict`);
  }
}

// 5. verbs resolve via engine findInfinitive or dict lemma; citation forms conjugatable
for (const [k, v] of Object.entries(dict)) {
  if (v.pos !== 'v') continue;
  if (v.lemma) {
    if (normalizeGreek(v.lemma) !== v.lemma && !conjugate(v.lemma)) {
      // lemma stored accented with final ω — check conjugatable as-is
    }
    if (!conjugate(v.lemma)) errs.push(`dict ${k}: lemma ${v.lemma} not conjugatable`);
    const fi = findInfinitive(k);
    if (!fi) errs.push(`dict ${k}: findInfinitive failed (dict lemma ${v.lemma} covers it: ${!!conjugate(v.lemma)})`);
    else if (normalizeGreek(fi) !== normalizeGreek(v.lemma)) errs.push(`dict ${k}: findInfinitive→${fi} != lemma ${v.lemma}`);
  } else {
    if (!conjugate(k.replace(/σ$/, 'ς')) && !conjugate(k)) errs.push(`dict ${k}: citation form not conjugatable`);
  }
}

// 6. offender scan (σ-normalized + accent-stripped)
const offSet = new Set(offenders.map((o) => stripAccents(normalizeGreek(o.word))));
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    if (offSet.has(stripAccents(tok))) errs.push(`${c.id}: OFFENDER "${tok}"`);
  }
}

// Report
const tips = cards.filter((c) => c.grammar).length;
const tagCount = (t: string) => cards.filter((c) => c.tags.includes(t)).length;
console.log(`cards: ${cards.length}`);
console.log(`unique sentences: ${seen.size}`);
console.log(`dict entries: ${Object.keys(dict).length}`);
console.log(`unique target tokens: ${allTokens.size}`);
console.log(`tips: ${tips} (${((tips / cards.length) * 100).toFixed(1)}%)`);
console.log(`tags — general: ${tagCount('general')}, travel: ${tagCount('travel')}, work: ${tagCount('work')}, family: ${tagCount('family')}`);
console.log(errs.length ? `\nERRORS (${errs.length}):\n` + errs.join('\n') : '\nALL CHECKS PASSED');
process.exit(errs.length ? 1 : 0);
