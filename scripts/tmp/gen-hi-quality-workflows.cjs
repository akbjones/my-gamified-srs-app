#!/usr/bin/env node
// Build two Hindi quality workflows:
//   A) dict-audit   – flag+fix wrong/reductive glosses, bad IPA, wrong pos/lemma
//   B) sentence-qc  – flag+replace unnatural, vacuous, preachy or useless cards
// Both are FLAG-ONLY-WHAT'S-BROKEN: agents emit entries/cards that need change,
// not a full rewrite of everything (safer + far cheaper to review).
const fs = require('fs');
const path = require('path');

// ── A. dictionary audit ──────────────────────────────────────────────────────
const srcTs = fs.readFileSync('src/data/dictionary/hi.ts', 'utf8');
const entryRe = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*en:\s*'((?:[^'\\]|\\.)*)'\s*,\s*ipa:\s*'((?:[^'\\]|\\.)*)'\s*,\s*pos:\s*'([^']*)'(?:\s*,\s*lemma:\s*'((?:[^'\\]|\\.)*)')?/;
const entries = [];
for (const line of srcTs.split('\n')) {
  const m = line.match(entryRe);
  if (m) entries.push({ word: m[1], en: m[2], ipa: m[3], pos: m[4], ...(m[5] ? { lemma: m[5] } : {}) });
}
fs.mkdirSync('docs/hi-quality/dict', { recursive: true });
const dictTasks = [];
const DCHUNK = 60;
for (let i = 0, seq = 1; i < entries.length; i += DCHUNK, seq++) {
  const p = `docs/hi-quality/dict/in-${String(seq).padStart(3, '0')}.json`;
  fs.writeFileSync(p, JSON.stringify(entries.slice(i, i + DCHUNK)));
  dictTasks.push({ in: p, out: `docs/hi-quality/dict/fix-${String(seq).padStart(3, '0')}.json` });
}

// ── B. sentence quality ──────────────────────────────────────────────────────
const deck = require(path.resolve('src/data/hindi/deck.json'));
const sorted = [...deck].sort((a, b) => (a.priority ?? 9e9) - (b.priority ?? 9e9));
fs.mkdirSync('docs/hi-quality/sent', { recursive: true });
const sentTasks = [];
const SCHUNK = 45;
for (let i = 0, seq = 1; i < sorted.length; i += SCHUNK, seq++) {
  const p = `docs/hi-quality/sent/in-${String(seq).padStart(3, '0')}.json`;
  fs.writeFileSync(p, JSON.stringify(sorted.slice(i, i + SCHUNK).map((c, j) => ({
    id: String(c.id), rank: i + j + 1, node: c.grammarNode, target: c.target, english: c.english,
  }))));
  sentTasks.push({ in: p, out: `docs/hi-quality/sent/fix-${String(seq).padStart(3, '0')}.json` });
}

console.log(`dict entries ${entries.length} → ${dictTasks.length} batches | deck ${deck.length} → ${sentTasks.length} batches`);

const DICT_P = [
  'You are auditing a Hindi→English learner dictionary. Read `IN` — an array of {word, en, ipa, pos, lemma?}.',
  'Report ONLY entries that are WRONG or MEANINGFULLY INCOMPLETE. Leave good entries out of your output entirely.',
  'Check each entry for:',
  '1. GLOSS ACCURACY — is the English gloss correct for this Hindi word? Flag plain errors.',
  '2. GLOSS COMPLETENESS — a common, everyday sense missing makes the entry reductive. e.g. घूमना is not only "to roam/wander": it also covers "to visit (a place), to go sightseeing, to go around/turn". Give the common senses a learner will meet, separated by semicolons, most common first. Do NOT pad with rare/literary senses.',
  '3. IPA — must be correct AND in this dictionary house style: length marks (aː iː uː eː oː), aspiration ʰ/ʱ, retroflex ʈ ɖ ɳ ɽ, nasalisation with the combining tilde, natural schwa deletion. NO stress marks (ˈ ˌ), no ɑ (use aː), no ɾ (use r), no optional-length "(ː)". Example house style: ɡʱuːmnaː, bədʒeː, tʃʰoːʈeː.',
  '4. POS — one of n/v/adj/adv/pron/postp/part/conj/interj/num.',
  '5. LEMMA — inflected forms must point at the correct dictionary form (infinitive for verbs).',
  'English glosses must contain NO Devanagari and no romanised Hindi.',
  'Output a JSON array of ONLY the entries needing change, each as {word, en, ipa, pos, lemma?, issue} where issue names the problem briefly. WRITE it to `OUT` with the Write tool (an empty array [] is a valid, expected result for a clean batch). Return {out, flagged}.',
].join('\n');

const SENT_P = [
  'You are quality-checking Hindi flashcard sentences for a learner app. Read `IN` — an array of {id, rank, node, target, english}.',
  'Report ONLY cards that should be REPLACED. Leave good cards out of your output entirely.',
  'Replace a card when its sentence is:',
  '- VACUOUS or padded — says nothing a learner would ever need ("We are all very happy and content with our family").',
  '- PREACHY / moralising / proverb-like, or reads like a textbook motto.',
  '- UNNATURAL — no native speaker would say it this way; stilted, translationese, or awkward word order.',
  '- POINTLESS TRIVIA or niche content a learner will not use in real life.',
  '- OFFICIALESE / bureaucratic register when everyday speech is what is being taught.',
  'KEEP anything that is natural, ordinary and useful, even if simple or mundane. Mundane-but-usable is GOOD.',
  'For each card you replace, write a NEW Hindi sentence that: teaches the SAME grammar point (same node), is natural everyday spoken Hindi a real person would say, uses ordinary polite register, is a similar length, and reuses common vocabulary. Provide the English translation too.',
  'Output a JSON array of ONLY the cards to replace: {id, target, english, reason}. WRITE it to `OUT` with the Write tool (an empty array [] is valid and expected for a clean batch). Return {out, flagged}.',
].join('\n');

const SCHEMA = '{ type:"object", additionalProperties:false, properties:{ out:{type:"string"}, flagged:{type:"number"} }, required:["out"] }';

function mk(name, desc, tasks, prompt, label) {
  return `export const meta = {
  name: ${JSON.stringify(name)},
  description: ${JSON.stringify(desc)},
  phases: [{ title: "Audit" }],
};
const TASKS = ${JSON.stringify(tasks)};
const P = ${JSON.stringify(prompt)};
const SCHEMA = ${SCHEMA};
log(${JSON.stringify(desc)} + " — " + TASKS.length + " batches.");
const results = await parallel(TASKS.map(t => () => agent(P.replace("IN", t.in).replace("OUT", t.out), { label: ${JSON.stringify(label)} + "/" + t.out.split("/").pop(), phase: "Audit", agentType: "general-purpose", schema: SCHEMA })));
const flagged = results.filter(Boolean).reduce((a, r) => a + (r.flagged || 0), 0);
return { total: TASKS.length, completed: results.filter(Boolean).length, flagged };
`;
}

fs.writeFileSync('scripts/tmp/hi-dict-audit.workflow.js',
  mk('hi-dict-audit', 'Hindi dictionary audit — flag+fix wrong/reductive glosses, bad IPA, wrong pos/lemma', dictTasks, DICT_P, 'dict'));
fs.writeFileSync('scripts/tmp/hi-sentence-qc.workflow.js',
  mk('hi-sentence-qc', 'Hindi sentence QC — replace unnatural, vacuous, preachy or useless cards', sentTasks, SENT_P, 'sent'));

for (const f of ['scripts/tmp/hi-dict-audit.workflow.js', 'scripts/tmp/hi-sentence-qc.workflow.js']) {
  const s = fs.readFileSync(f, 'utf8').replace(/export const meta/, 'const meta');
  require('vm').compileFunction(`const agent=async()=>({});const parallel=async(a)=>Promise.all(a.map(f=>f()));const log=()=>{};(async()=>{ ${s} })();`);
  console.log('✓ compiles:', f);
}
