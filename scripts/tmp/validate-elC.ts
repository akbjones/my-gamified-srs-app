/* Validation for slice C (el-0151..el-0225). Run: npx tsx scripts/tmp/validate-elC.ts */
import { readFileSync } from 'fs';
import { conjugate, findInfinitive, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const dir = new URL('.', import.meta.url).pathname;
const cards = JSON.parse(readFileSync(dir + 'el-cards-C.json', 'utf8'));
const dict = JSON.parse(readFileSync(dir + 'el-dict-C.json', 'utf8'));
const offenders = JSON.parse(
  readFileSync(dir + '../../docs/greek-register-offenders.json', 'utf8'),
).offenders.map((o: any) => stripAccents(normalizeGreek(o.word)));

const errs: string[] = [];
const warn: string[] = [];

// 1. ids sequential, priority, audio, tags, node
if (cards.length !== 75) errs.push(`card count ${cards.length} != 75`);
cards.forEach((c: any, i: number) => {
  const n = 151 + i;
  const id = `el-${String(n).padStart(4, '0')}`;
  if (c.id !== id) errs.push(`${c.id}: expected id ${id}`);
  if (c.priority !== n) errs.push(`${c.id}: priority ${c.priority} != ${n}`);
  if (c.audio !== `el-${c.id}.mp3`) errs.push(`${c.id}: bad audio ${c.audio}`);
  if (!Array.isArray(c.tags) || !c.tags.includes('general')) errs.push(`${c.id}: missing general tag`);
  if (c.grammarNode !== 'node-03') errs.push(`${c.id}: bad grammarNode`);
  if (!c.target || !c.english) errs.push(`${c.id}: missing target/english`);
});

// 2. unique sentences + word band 3–10
const seen = new Set<string>();
for (const c of cards) {
  const t = c.target.trim();
  if (seen.has(t)) errs.push(`${c.id}: duplicate target`);
  seen.add(t);
  const words = t.split(/\s+/).filter((w: string) => /[Α-Ωα-ωΆ-Ώά-ώΪϊΫϋΐΰ]/.test(w));
  if (words.length < 3 || words.length > 10) errs.push(`${c.id}: ${words.length} words (band 3-10): ${t}`);
}

// 3. every token in dict; offender scan
const tokenize = (s: string) =>
  s.replace(/[;,.!?·«»()—:]/g, ' ').split(/\s+/).filter(Boolean);
const usedKeys = new Set<string>();
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    const key = normalizeGreek(tok);
    usedKeys.add(key);
    if (!dict[key]) errs.push(`${c.id}: token '${tok}' -> key '${key}' missing from dict`);
    if (offenders.includes(stripAccents(key))) errs.push(`${c.id}: OFFENDER word '${tok}'`);
  }
}

// 4. dict hygiene: en/ipa/pos present, keys normalized, verbs resolve
for (const [k, e] of Object.entries<any>(dict)) {
  if (k !== normalizeGreek(k)) errs.push(`dict key not normalized: '${k}'`);
  if (!e.en || !e.ipa || !e.pos) errs.push(`dict '${k}': missing en/ipa/pos`);
  if (e.lemma) {
    if (!dict[normalizeGreek(e.lemma)]) errs.push(`dict '${k}': lemma '${e.lemma}' not its own entry`);
    if (!conjugate(e.lemma)) errs.push(`dict '${k}': lemma '${e.lemma}' NOT conjugatable by engine`);
    const found = findInfinitive(k);
    if (!found) warn.push(`dict '${k}': findInfinitive fails (lemma '${e.lemma}' present, ok)`);
    else if (normalizeGreek(found) !== normalizeGreek(e.lemma))
      warn.push(`dict '${k}': findInfinitive -> '${found}' != lemma '${e.lemma}'`);
  } else if (e.pos === 'v') {
    // citation form: engine must conjugate it directly
    if (!conjugate(k) && !findInfinitive(k)) errs.push(`dict '${k}': verb without lemma not conjugatable`);
  }
  if (!usedKeys.has(k)) warn.push(`dict key '${k}' unused by slice targets`);
}

// 5. tips: length, count, accent presence
let tips = 0;
for (const c of cards) {
  if (c.grammar) {
    tips++;
    if (c.grammar.length > 120) errs.push(`${c.id}: tip ${c.grammar.length} chars > 120`);
    const greek = c.grammar.match(/[Α-Ωα-ω΄-ώ]+/g) || [];
    const hasAccented = /[άέήίόύώΐΰΆΈΉΊΌΎΏ]/.test(c.grammar);
    if (greek.length && !hasAccented) warn.push(`${c.id}: tip has Greek but no accents?`);
  }
}

// 6. every verb FORM used in targets resolves via engine or dict lemma
for (const key of usedKeys) {
  const e = dict[key];
  if (e?.pos === 'v') {
    const ok = !!(e.lemma ? conjugate(e.lemma) : conjugate(key) || findInfinitive(key));
    if (!ok) errs.push(`verb token '${key}' unresolvable`);
  }
}

console.log(`cards: ${cards.length}`);
console.log(`unique targets: ${seen.size}`);
console.log(`dict entries: ${Object.keys(dict).length}`);
console.log(`unique target tokens: ${usedKeys.size}`);
console.log(`tips: ${tips} (${((tips / cards.length) * 100).toFixed(1)}%)`);
const tagCount: Record<string, number> = {};
for (const c of cards) for (const t of c.tags) tagCount[t] = (tagCount[t] || 0) + 1;
console.log('tags:', tagCount);
if (warn.length) console.log('\nWARN:\n' + warn.join('\n'));
if (errs.length) {
  console.error('\nERRORS:\n' + errs.join('\n'));
  process.exit(1);
}
console.log('\nALL CHECKS PASSED');
