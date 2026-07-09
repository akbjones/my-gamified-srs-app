/* Validation for Greek pilot slice B (el-0076..el-0150). Run: npx tsx scripts/tmp/validate-elB.ts */
import { readFileSync } from 'fs';
import { conjugate, findInfinitive, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const cards = JSON.parse(readFileSync('scripts/tmp/el-cards-B.json', 'utf8'));
const dict = JSON.parse(readFileSync('scripts/tmp/el-dict-B.json', 'utf8'));
const offenders = JSON.parse(readFileSync('docs/greek-register-offenders.json', 'utf8')).offenders as {
  word: string; severity: string;
}[];

const errors: string[] = [];
const warn: string[] = [];

// 1. ids sequential/unique, priority, audio, tags, node
const seenTargets = new Set<string>();
cards.forEach((c: any, i: number) => {
  const n = 76 + i;
  const id = `el-${String(n).padStart(4, '0')}`;
  if (c.id !== id) errors.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errors.push(`${c.id}: priority ${c.priority} != ${n}`);
  if (c.audio !== `el-${c.id}.mp3`) errors.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errors.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== 'node-02') errors.push(`${c.id}: bad grammarNode`);
  if (!c.target || !c.english) errors.push(`${c.id}: missing target/english`);
  if (seenTargets.has(c.target)) errors.push(`${c.id}: DUPLICATE sentence "${c.target}"`);
  seenTargets.add(c.target);

  // 2. word count 3–10
  const wc = c.target.split(/\s+/).filter(Boolean).length;
  if (wc < 3 || wc > 10) errors.push(`${c.id}: word count ${wc} out of Q1 band (${c.target})`);

  // 3. grammar tips: <=120 chars, accented Greek present
  if (c.grammar) {
    if (c.grammar.length > 120) errors.push(`${c.id}: tip ${c.grammar.length} chars`);
    const greek = c.grammar.match(/[Ͱ-Ͽἀ-῿]+/g);
    if (!greek) errors.push(`${c.id}: tip has no Greek example`);
    else if (!/[άέήίόύώΐΰΆΈΉΊΌΎΏ]/.test(c.grammar)) warn.push(`${c.id}: tip Greek may be unaccented`);
  }
});
if (cards.length !== 75) errors.push(`card count ${cards.length} != 75`);

// 4. token coverage + accent check + offender scan
const tokenize = (t: string): string[] =>
  t.replace(/[.,;!;·«»?—]/g, ' ').split(/\s+/).filter(Boolean).map((w: string) => normalizeGreek(w));

const offSet = new Set(offenders.map((o) => stripAccents(normalizeGreek(o.word))));
const allTokens = new Set<string>();
const missing = new Set<string>();

const countVowels = (w: string): number => {
  const collapsed = w
    .replace(/ου|αί|αι|εί|ει|οί|οι|ού|αύ|αυ|εύ|ευ/g, 'V')
    // unaccented ι/υ before a vowel is a glide (για, γιος, πιο), not a syllable
    .replace(/[ιυ](?=[αεηοωάέήόώV])/g, '')
    .replace(/[αεηιουωάέήίόύώϊϋΐΰ]/g, 'V');
  return (collapsed.match(/V/g) || []).length;
};

for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    allTokens.add(tok);
    if (!dict[tok]) missing.add(`${tok} (${c.id})`);
    if (offSet.has(stripAccents(tok))) errors.push(`${c.id}: OFFENDER token ${tok}`);
    if (countVowels(tok) >= 2 && !/[άέήίόύώΐΰ]/.test(tok)) errors.push(`${c.id}: unaccented multisyllable "${tok}"`);
  }
  for (const tip of [c.grammar]) {
    if (!tip) continue;
    for (const g of tip.match(/[Ͱ-Ͽἀ-῿]+/g) || []) {
      if (offSet.has(stripAccents(normalizeGreek(g)))) errors.push(`${c.id}: OFFENDER in tip: ${g}`);
    }
  }
}
missing.forEach((m) => errors.push(`dict missing key: ${m}`));

// 5. dict entries well-formed; σ-normalized keys; verbs resolve
let verbCount = 0;
for (const [k, e] of Object.entries<any>(dict)) {
  if (k !== normalizeGreek(k)) errors.push(`dict key not σ-normalized/lowercase: ${k}`);
  if (!e.en || !e.ipa || !e.pos) errors.push(`dict ${k}: missing en/ipa/pos`);
  if (e.pos === 'v') {
    verbCount++;
    const viaEngine = findInfinitive(k);
    const viaLemma = e.lemma && conjugate(e.lemma);
    if (!viaEngine && !viaLemma) errors.push(`dict verb ${k}: engine cannot resolve (no findInfinitive hit, no valid lemma)`);
    if (e.lemma && !conjugate(e.lemma)) errors.push(`dict verb ${k}: lemma ${e.lemma} not conjugatable`);
    if (e.lemma && !dict[normalizeGreek(e.lemma)]) errors.push(`dict verb ${k}: lemma ${e.lemma} has no own entry`);
  }
}

// 6. verify every SENTENCE verb form resolves (tokens whose dict pos is v)
for (const tok of allTokens) {
  const e = dict[tok];
  if (e?.pos === 'v') {
    const inf = findInfinitive(tok) || (e.lemma && findInfinitive(e.lemma));
    if (!inf) errors.push(`sentence verb form ${tok}: unresolvable`);
  }
}

// stats
const tips = cards.filter((c: any) => c.grammar).length;
const tagPct = (t: string) =>
  ((cards.filter((c: any) => c.tags.includes(t)).length / cards.length) * 100).toFixed(1);

console.log(`cards: ${cards.length}`);
console.log(`unique sentences: ${seenTargets.size}`);
console.log(`unique tokens: ${allTokens.size}`);
console.log(`dict entries: ${Object.keys(dict).length} (verbs: ${verbCount})`);
console.log(`tips: ${tips} (${((tips / cards.length) * 100).toFixed(1)}%)`);
console.log(`tags: travel ${tagPct('travel')}%, work ${tagPct('work')}%, family ${tagPct('family')}%`);
console.log(`warnings: ${warn.length}`);
warn.forEach((w) => console.log(`  WARN ${w}`));
if (errors.length) {
  console.log(`ERRORS: ${errors.length}`);
  errors.forEach((e) => console.log(`  ERR ${e}`));
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
