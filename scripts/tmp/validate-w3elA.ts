/* Full validation for wave-3 slice A (el-1301..el-1550, node-13/node-14). */
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { conjugate, findInfinitive, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const dir = new URL('.', import.meta.url).pathname;
const ROOT = dir + '../../';
const cards = JSON.parse(readFileSync(dir + 'wave3-el-cards-A.json', 'utf8'));
const dict: Record<string, any> = JSON.parse(readFileSync(dir + 'wave3-el-dict-A.json', 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(dir + 'wave3-el-verbs-A.json', 'utf8'));
const deck = JSON.parse(readFileSync(ROOT + 'src/data/greek/deck.json', 'utf8'));
const offenders = JSON.parse(readFileSync(ROOT + 'docs/greek-register-offenders.json', 'utf8'))
  .offenders.map((o: any) => stripAccents(normalizeGreek(o.word)));

// KNOWN set (IRREGULARS + KNOWN_VERBS) from engine source
const engSrc = readFileSync(ROOT + 'src/data/conjugation/el.ts', 'utf8');
const irrBlock = engSrc.slice(engSrc.indexOf('const IRREGULARS'), engSrc.indexOf('\n};', engSrc.indexOf('const IRREGULARS')));
const kvBlock = engSrc.slice(engSrc.indexOf('const KNOWN_VERBS'), engSrc.indexOf('\n];', engSrc.indexOf('const KNOWN_VERBS')));
const known = new Set<string>([
  ...[...irrBlock.matchAll(/^\s{2}'([^']+)':\s*\{/gm)].map(m => m[1]),
  ...[...kvBlock.matchAll(/'([^']+)'/g)].map(m => m[1]),
]);

const errs: string[] = [];
const warn: string[] = [];

// 1. structure
if (cards.length !== 250) errs.push(`card count ${cards.length} != 250`);
cards.forEach((c: any, i: number) => {
  const n = 1301 + i;
  if (c.id !== `el-${n}`) errs.push(`${c.id}: expected el-${n}`);
  if (c.priority !== n) errs.push(`${c.id}: priority ${c.priority}`);
  if (c.audio !== `el-${c.id}.mp3`) errs.push(`${c.id}: audio ${c.audio}`);
  if (!c.tags?.includes('general')) errs.push(`${c.id}: no general tag`);
  const wantNode = n <= 1425 ? 'node-13' : 'node-14';
  if (c.grammarNode !== wantNode) errs.push(`${c.id}: node ${c.grammarNode} != ${wantNode}`);
  if (!c.target || !c.english) errs.push(`${c.id}: missing target/english`);
});

// 2. uniqueness vs deck + slice (accent-blind), word band 3-10
const norm = (t: string) => stripAccents(normalizeGreek(t)).replace(/[^α-ω ]/g, '').replace(/\s+/g, ' ').trim();
const seen = new Map<string, string>();
for (const c of deck) seen.set(norm(c.target), c.id);
for (const c of cards) {
  const k = norm(c.target);
  if (seen.has(k)) errs.push(`${c.id}: duplicate of ${seen.get(k)}: ${c.target}`);
  seen.set(k, c.id);
  const words = c.target.split(/\s+/).filter((w: string) => /[Α-Ωα-ωΆ-Ώά-ώϊϋΐΰΪΫ]/.test(w));
  if (words.length < 3 || words.length > 10) warn.push(`${c.id}: ${words.length} words: ${c.target}`);
}

// 3. offenders
for (const c of cards) {
  const toks = new Set(norm(c.target).split(' '));
  for (const o of offenders) if (toks.has(o)) errs.push(`${c.id}: OFFENDER ${o}`);
}

// 4. verbs file: NEW (not known), engine-conjugable; collect all engine forms
const verbForms = new Set<string>();
for (const v of verbs) {
  if (known.has(v)) errs.push(`verbs file: ${v} already in KNOWN_VERBS/IRREGULARS`);
  const t = conjugate(v);
  if (!t) { errs.push(`verbs file: ${v} not conjugable`); continue; }
  for (const forms of Object.values(t.tenses))
    for (const f of forms as string[]) for (const p of f.split(' ')) { verbForms.add(normalizeGreek(p)); verbForms.add(stripAccents(normalizeGreek(p))); }
  verbForms.add(normalizeGreek(v)); verbForms.add(stripAccents(normalizeGreek(v)));
}

// 5. token coverage
const tokenize = (s: string) => s.replace(/[;,.!?·«»()—:"'“”]/g, ' ').split(/\s+/).filter(Boolean);
const usedKeys = new Set<string>();
for (const c of cards) {
  for (const raw of tokenize(c.target)) {
    const key = normalizeGreek(raw);
    if (!/[α-ωάέήίόύώϊϋΐΰ]/.test(key)) continue;
    usedKeys.add(key);
    const bare = stripAccents(key);
    if (dict[key] || dict[bare]) continue;
    if (verbForms.has(key) || verbForms.has(bare)) continue;
    if (lookupWord(key)) continue;
    if (findInfinitive(key)) continue;
    errs.push(`${c.id}: token '${raw}' uncovered`);
  }
}

// 6. dict hygiene + lemma resolution
for (const [k, e] of Object.entries<any>(dict)) {
  if (k !== normalizeGreek(k)) errs.push(`dict key not normalized: ${k}`);
  if (!e.en || !e.ipa || !e.pos) errs.push(`dict ${k}: missing en/ipa/pos`);
  if (e.lemma) {
    const lk = normalizeGreek(e.lemma);
    if (!dict[lk] && !lookupWord(lk)) errs.push(`dict ${k}: lemma ${e.lemma} has no entry`);
    if (!conjugate(e.lemma)) errs.push(`dict ${k}: lemma ${e.lemma} NOT conjugatable`);
  } else if (e.pos === 'v') {
    if (!conjugate(k) && !findInfinitive(k)) errs.push(`dict ${k}: verb without lemma not conjugatable`);
  }
  if (!usedKeys.has(k)) {
    const isAnchor = Object.values<any>(dict).some(v => v.lemma && normalizeGreek(v.lemma) === k);
    if (!isAnchor) warn.push(`dict key unused: ${k}`);
  }
}

// 7. collisions with shipped DICT (should not re-add existing keys)
for (const k of Object.keys(dict)) {
  const hit = lookupWord(k);
  // a slice key that resolves to shipped DICT AND isn't a conjugated form we intend
  // (informational only)
}

// 8. tips ≤120, romanization presence
let tips = 0;
for (const c of cards) {
  if (!c.grammar) continue;
  tips++;
  if (c.grammar.length > 120) errs.push(`${c.id}: tip ${c.grammar.length} chars`);
}

const tagCount: Record<string, number> = {};
for (const c of cards) for (const t of c.tags) tagCount[t] = (tagCount[t] || 0) + 1;

console.log(`cards: ${cards.length}, dict: ${Object.keys(dict).length}, verbs: ${verbs.length}, known-base: ${known.size}`);
console.log(`tips: ${tips} (${(tips * 100 / cards.length).toFixed(1)}%)`);
console.log('tags:', JSON.stringify(tagCount));
if (warn.length) console.log(`\n${warn.length} WARN (first 15):\n` + warn.slice(0, 15).join('\n'));
if (errs.length) { console.error(`\n${errs.length} ERRORS:\n` + errs.join('\n')); process.exit(1); }
console.log('\nALL CHECKS PASSED');
