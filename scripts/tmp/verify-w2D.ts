/** Verify wave-2 slice D (el-1051..el-1300) against the brief. */
import { readFileSync } from 'fs';
import { conjugate, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const ROOT = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones';
const cards: any[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-cards-D.json`, 'utf8'));
const dict: Record<string, any> = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-dict-D.json`, 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-verbs-D.json`, 'utf8'));
const existingDeck: any[] = JSON.parse(readFileSync(`${ROOT}/src/data/greek/deck.json`, 'utf8'));
const sibA: any[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-cards-A.json`, 'utf8'));
const sibC: any[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-cards-C.json`, 'utf8'));
const offenders: { word: string }[] = JSON.parse(
  readFileSync(`${ROOT}/docs/greek-register-offenders.json`, 'utf8')).offenders;
const dictSrc = readFileSync(`${ROOT}/src/data/dictionary/el.ts`, 'utf8');
const existingKeys = new Set(
  [...dictSrc.matchAll(/^\s*['"]([^'"]+)['"]:\s*\{/gm)].map((m) => m[1]));

const errs: string[] = [];

// 1. structure: ids el-1051..1300, priority, audio, node ranges, tags
if (cards.length !== 250) errs.push(`card count ${cards.length} != 250`);
cards.forEach((c, i) => {
  const n = i + 1051;
  const want = `el-${String(n).padStart(4, '0')}`;
  if (c.id !== want) errs.push(`${c.id}: expected id ${want}`);
  if (c.priority !== n) errs.push(`${c.id}: priority ${c.priority} != ${n}`);
  if (c.audio !== `el-${c.id}.mp3`) errs.push(`${c.id}: bad audio ${c.audio}`);
  const node = n <= 1175 ? 'node-11' : 'node-12';
  if (c.grammarNode !== node) errs.push(`${c.id}: grammarNode ${c.grammarNode} != ${node}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errs.push(`${c.id}: missing general tag`);
  for (const t of c.tags) if (!['general', 'travel', 'work', 'family'].includes(t)) errs.push(`${c.id}: bad tag ${t}`);
  const wc = c.target.split(/\s+/).filter(Boolean).length;
  if (wc < 3 || wc > 10) errs.push(`${c.id}: word count ${wc} out of 3-10 ("${c.target}")`);
  if (c.grammar && c.grammar.length > 120) errs.push(`${c.id}: tip ${c.grammar.length} chars > 120`);
  if (!c.english || !c.target) errs.push(`${c.id}: missing target/english`);
});

// 2. unique sentences (within slice AND vs existing deck AND vs sibling slices)
const keyOf = (t: string) =>
  stripAccents(normalizeGreek(t)).replace(/[^α-ω\s]/g, '').replace(/\s+/g, ' ').trim();
const seen = new Map<string, string>();
for (const c of [...existingDeck, ...sibA, ...sibC]) seen.set(keyOf(c.target), c.id);
for (const c of cards) {
  const k = keyOf(c.target);
  if (seen.has(k)) errs.push(`${c.id}: duplicate sentence of ${seen.get(k)}`);
  seen.set(k, c.id);
}

// 3. dict key hygiene + completeness; no shadowing of existing keys
for (const [k, v] of Object.entries(dict)) {
  if (k !== normalizeGreek(k)) errs.push(`dict key not σ-normalized/lowercase: ${k}`);
  if (!v.en || !v.ipa || !v.pos) errs.push(`dict entry incomplete: ${k}`);
  if (existingKeys.has(k)) errs.push(`dict key already in el.ts: ${k}`);
}

// 4. every target token resolves (existing el.ts ∪ slice dict)
const tokenize = (t: string): string[] =>
  t.split(/\s+/)
    .map((w) => normalizeGreek(w).replace(/[^α-ωάέήίόύώϊϋΐΰ-]/g, ''))
    .filter(Boolean);
const allTokens = new Set<string>();
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    allTokens.add(tok);
    if (!dict[tok] && !existingKeys.has(tok)) errs.push(`${c.id}: token "${tok}" missing from dict`);
  }
}

// 5. verb entries: lemma conjugatable AND actually produces the surface form
const produces = (lemma: string, form: string): boolean => {
  const t = conjugate(lemma);
  if (!t) return false;
  const want = stripAccents(normalizeGreek(form));
  for (const forms of Object.values(t.tenses)) {
    for (const f of forms) {
      if (stripAccents(normalizeGreek(f.replace(/^θα /, ''))) === want) return true;
    }
  }
  return false;
};
for (const [k, v] of Object.entries(dict)) {
  if (v.pos !== 'v') continue;
  if (v.lemma) {
    if (!conjugate(v.lemma)) errs.push(`dict ${k}: lemma ${v.lemma} not conjugatable`);
    else if (!produces(v.lemma, k)) errs.push(`dict ${k}: ${v.lemma} does not produce this form`);
  } else {
    if (!conjugate(k.replace(/σ$/, 'ς')) && !conjugate(k)) errs.push(`dict ${k}: citation form not conjugatable`);
  }
}

// 6. verbs file: mechanical-class lemmas, tables exist with the tenses we rely on
for (const v of verbs) {
  const t = conjugate(v);
  if (!t) { errs.push(`verbs: ${v} not conjugatable`); continue; }
  if (!t.tenses['Παρατατικός (Imperfect)']) errs.push(`verbs: ${v} has no imperfect`);
}

// 7. tip accents: every Greek word (≥2 vowels) in tips must carry an accent
for (const c of cards) {
  if (!c.grammar) continue;
  for (const w of c.grammar.split(/[\s,:;()=!;·—?/]+/)) {
    const g = w.replace(/[^α-ωάέήίόύώΆ-Ώα-ωϊϋΐΰA-Za-zΑ-Ω]/gi, '');
    if (!/[α-ωΑ-Ω]/i.test(g)) continue;
    const bare = normalizeGreek(g);
    const nvow = (bare.match(/[αεηιουωάέήίόύώ]/g) ?? []).length;
    if (nvow >= 2 && stripAccents(bare) === bare && !/^(θα|να|δεν|μη|μην|και|του|τησ|την|τον|το|τα|τη|με|σε|για|απο|ποτε|μου|σου|μασ|σασ|τουσ|τισ|οτι|που|ενω|οι|πιο)$/.test(bare)) {
      errs.push(`${c.id}: tip word "${g}" missing accent`);
    }
  }
}

// 8. offender scan
const offSet = new Set(offenders.map((o) => stripAccents(normalizeGreek(o.word))));
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    if (offSet.has(stripAccents(tok))) errs.push(`${c.id}: OFFENDER "${tok}"`);
  }
}

// Report
const tips = cards.filter((c) => c.grammar).length;
const tagCount = (t: string) => cards.filter((c) => c.tags.includes(t)).length;
const pct = (x: number) => ((x / cards.length) * 100).toFixed(1);
console.log(`cards: ${cards.length}`);
console.log(`unique target tokens: ${allTokens.size}, new dict entries: ${Object.keys(dict).length}`);
console.log(`tips: ${tips} (${pct(tips)}%)`);
console.log(`tags — general: ${tagCount('general')}, travel: ${tagCount('travel')} (${pct(tagCount('travel'))}%), work: ${tagCount('work')} (${pct(tagCount('work'))}%), family: ${tagCount('family')} (${pct(tagCount('family'))}%)`);
console.log(`new verbs (${verbs.length}): ${verbs.join(', ')}`);
console.log(errs.length ? `\nERRORS (${errs.length}):\n` + errs.join('\n') : '\nALL CHECKS PASSED');
process.exit(errs.length ? 1 : 0);
