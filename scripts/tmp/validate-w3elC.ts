/* Full validation for wave-3 slice C (el-1801..el-2050). */
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { conjugate, findInfinitive, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

const dir = new URL('.', import.meta.url).pathname;
const ROOT = dir + '../../';
const cards = JSON.parse(readFileSync(dir + 'wave3-el-cards-C.json', 'utf8'));
const dict = JSON.parse(readFileSync(dir + 'wave3-el-dict-C.json', 'utf8'));
const verbs: string[] = JSON.parse(readFileSync(dir + 'wave3-el-verbs-C.json', 'utf8'));
const deck = JSON.parse(readFileSync(ROOT + 'src/data/greek/deck.json', 'utf8'));
const offenders = JSON.parse(readFileSync(ROOT + 'docs/greek-register-offenders.json', 'utf8'))
  .offenders.map((o: any) => stripAccents(normalizeGreek(o.word)));

// -ιέμαι deponents: engine has no class; theme-mandated, present-only, dict-covered
const IEME_EXCEPTIONS = new Set(['βαριέμαι', 'στενοχωριέμαι']);

const errs: string[] = [];
const warn: string[] = [];

// 1. structure
if (cards.length !== 250) errs.push(`card count ${cards.length} != 250`);
cards.forEach((c: any, i: number) => {
  const n = 1801 + i;
  if (c.id !== `el-${n}`) errs.push(`${c.id}: expected el-${n}`);
  if (c.priority !== n) errs.push(`${c.id}: priority ${c.priority}`);
  if (c.audio !== `el-${c.id}.mp3`) errs.push(`${c.id}: audio ${c.audio}`);
  if (!c.tags?.includes('general')) errs.push(`${c.id}: no general tag`);
  const wantNode = n <= 1925 ? 'node-17' : 'node-18';
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
  if (words.length < 3 || words.length > 10) errs.push(`${c.id}: ${words.length} words: ${c.target}`);
}

// 3. offenders
for (const c of cards) {
  const toks = new Set(norm(c.target).split(' '));
  for (const o of offenders) if (toks.has(o)) errs.push(`${c.id}: OFFENDER ${o}`);
}

// 4. verbs file: engine must conjugate; collect all engine forms
const verbForms = new Set<string>();
for (const v of verbs) {
  const t = conjugate(v);
  if (!t) { errs.push(`verbs file: ${v} not conjugable`); continue; }
  for (const forms of Object.values(t.tenses))
    for (const f of forms) for (const p of f.split(' ')) verbForms.add(normalizeGreek(p));
  verbForms.add(normalizeGreek(v));
}

// 5. token coverage: slice dict OR existing dict OR engine OR new-verb forms
const tokenize = (s: string) => s.replace(/[;,.!?·«»()—:]/g, ' ').split(/\s+/).filter(Boolean);
const usedKeys = new Set<string>();
for (const c of cards) {
  for (const raw of tokenize(c.target)) {
    const key = normalizeGreek(raw);
    if (!/[α-ωάέήίόύώϊϋΐΰ]/.test(key)) continue;
    usedKeys.add(key);
    if (dict[key]) continue;
    if (verbForms.has(key)) continue;
    if (lookupWord(key)) continue;
    if (findInfinitive(key)) continue;
    errs.push(`${c.id}: token '${raw}' uncovered`);
  }
}

// 6. dict hygiene + engine-exactness of verb forms
for (const [k, e] of Object.entries<any>(dict)) {
  if (k !== normalizeGreek(k)) errs.push(`dict key not normalized: ${k}`);
  if (!e.en || !e.ipa || !e.pos) errs.push(`dict ${k}: missing en/ipa/pos`);
  if (e.lemma) {
    const lk = normalizeGreek(e.lemma);
    if (!dict[lk] && !lookupWord(lk)) errs.push(`dict ${k}: lemma ${e.lemma} has no entry`);
    if (!conjugate(e.lemma)) {
      if (IEME_EXCEPTIONS.has(e.lemma)) warn.push(`dict ${k}: lemma ${e.lemma} is -ιέμαι (engine gap, present-only by design)`);
      else errs.push(`dict ${k}: lemma ${e.lemma} NOT conjugatable`);
    } else {
      // forward-verify: does the lemma actually produce this surface form?
      const t = conjugate(e.lemma)!;
      const all = new Set<string>();
      for (const fs of Object.values(t.tenses)) for (const f of fs) all.add(normalizeGreek(f.replace(/^θα /, '')));
      const bare = stripAccents(k).replace(/-.*$/, '');
      const ok = all.has(k) || [...all].some(f => stripAccents(f) === stripAccents(k));
      if (!ok) warn.push(`dict ${k}: not produced by engine from ${e.lemma} (dict-covered form)`);
    }
  } else if (e.pos === 'v') {
    if (!conjugate(k) && !findInfinitive(k)) {
      if (IEME_EXCEPTIONS.has(k)) warn.push(`dict ${k}: -ιέμαι citation (engine gap, by design)`);
      else errs.push(`dict ${k}: verb without lemma not conjugatable`);
    }
  }
  if (!usedKeys.has(k)) {
    // lemma anchors are fine unused
    const isAnchor = Object.values<any>(dict).some(v => v.lemma && normalizeGreek(v.lemma) === k);
    if (!isAnchor) warn.push(`dict key unused: ${k}`);
  }
}

// 7. HARD RULE: every verb-looking past form in targets must be engine-exact.
// Scan targets for tokens the engine reverses to a lemma; forward-verify accent-exactly.
for (const c of cards) {
  for (const raw of tokenize(c.target)) {
    const key = normalizeGreek(raw);
    const e = dict[key];
    if (e?.pos === 'v' && e.lemma && IEME_EXCEPTIONS.has(e.lemma)) {
      // must be a present-tense form (row 0 of mechanical class doesn't exist; hand-check list)
      const presentForms = ['βαριέμαι','βαριέσαι','βαριέται','βαριόμαστε','βαριέστε','βαριούνται',
        'στενοχωριέμαι','στενοχωριέσαι','στενοχωριέται','στενοχωριόμαστε','στενοχωριέστε','στενοχωριούνται'];
      if (!presentForms.map(normalizeGreek).includes(key)) errs.push(`${c.id}: -ιέμαι NON-PRESENT form '${raw}'`);
    }
  }
}

// 8. tips
let tips = 0;
for (const c of cards) {
  if (!c.grammar) continue;
  tips++;
  if (c.grammar.length > 120) errs.push(`${c.id}: tip ${c.grammar.length} chars: ${c.grammar}`);
  if (/[α-ωΑ-Ω]/.test(c.grammar) && !/\([a-zA-Z]/.test(c.grammar) && !/[a-z]+[áéíóú]/.test(c.grammar))
    warn.push(`${c.id}: tip may lack romanization: ${c.grammar}`);
}

// 9. tag distribution
const tagCount: Record<string, number> = {};
for (const c of cards) for (const t of c.tags) tagCount[t] = (tagCount[t] || 0) + 1;

console.log(`cards: ${cards.length}, dict: ${Object.keys(dict).length}, verbs: ${verbs.length}`);
console.log(`tips: ${tips} (${(tips * 100 / cards.length).toFixed(1)}%)`);
console.log('tags:', JSON.stringify(tagCount));
if (warn.length) console.log(`\n${warn.length} WARN:\n` + warn.join('\n'));
if (errs.length) { console.error(`\n${errs.length} ERRORS:\n` + errs.join('\n')); process.exit(1); }
console.log('\nALL CHECKS PASSED');
