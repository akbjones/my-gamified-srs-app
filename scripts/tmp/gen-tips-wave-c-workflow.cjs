#!/usr/bin/env node
// Emit the Wave-C tips workflow (turkish / russian / welsh) — from scratch,
// per grammar node: keep/improve existing tips + author new ones to ~22%, then
// adversarially verify. Manifest + doctrine baked in (no fs in workflow).
const fs = require('fs');
const TASKS = JSON.parse(fs.readFileSync('/private/tmp/tips-wave-c-manifest.json', 'utf8'));
const OUT = 'scripts/tmp/tips-wave-c.workflow.js';

const script = `export const meta = {
  name: 'tips-wave-c-author',
  description: 'Author + adversarially verify grammar tips for tr/ru/cy (Wave C, from scratch to ~22%)',
  phases: [{ title: 'Author', detail: 'one agent per grammar node' }, { title: 'Verify', detail: 'adversarial check + fix per node' }],
};

const TASKS = ${JSON.stringify(TASKS)};
const bn = p => p.split('/').pop();

const BASE = [
  'The explanation is in ENGLISH; the worked example uses the target-language word(s) from that card\\'s "target" sentence.',
  'At most 120 characters is ideal; 200 is the HARD maximum.',
  'Exactly ONE grammar/usage rule per tip. Never combine two points.',
  'The tip MUST contain a word that appears in that card\\'s "target" sentence (quote the surface form exactly as written there). A tip citing no target word is auto-rejected downstream.',
  'Teach the grammar or usage point. Do NOT merely restate the English meaning.',
  'Voice: chill, factual, plain. The hook is the fact itself. BANNED: wordplay, cutesy metaphors, "think of it as", personifying grammar, exclamation marks.',
  'Avoid jargon: say "position word" not "postposition"; name the actual words.',
  'NO em dashes (the — character). NO backticks, asterisks, #, or markdown. Plain commas/periods only.',
  'Write NOTHING but the JSON array of {id, tip} to the output file.',
];
const PERLANG = {
  turkish: 'Turkish is agglutinative with vowel harmony; suffixes stack (ev-ler-im-de = in my houses). Cite the actual word from the sentence.',
  russian: 'Russian is Cyrillic: EVERY Russian word you show must have romanization in parentheses, e.g. стол (stol = table). The cited word must appear in the card target (Cyrillic surface form).',
  welsh: 'Welsh mutates initial consonants (treiglo: c→g, p→b, t→d, and so on). Quote the word EXACTLY as it appears in the target sentence (its mutated surface form) so the example matches the card.',
};

function authorPrompt(t) {
  return 'You are authoring grammar tips for the ' + t.lang + ' deck. Read the JSON file \`' + t.in + '\` — {lang, node, quota, cards:[{id, target, english, existing}]}. "existing" is the current tip if any (may be null). Produce a JSON array of {id, tip} covering about quota=' + t.quota + ' cards from this node: KEEP or IMPROVE existing tips that are good, and author fresh tips for the best remaining cards. Pick cards where a genuine, useful, non-obvious grammar/usage point applies; skip filler and bare-translation restatements. WRITE the array to \`' + t.out + '\` with the Write tool. Return {out, count}.\\n\\nRULES:\\n' + BASE.concat([PERLANG[t.lang]]).map((r, i) => (i + 1) + '. ' + r).join('\\n');
}
function verifyPrompt(t) {
  return 'Adversarially verify ' + t.lang + ' grammar tips. Read the cards from \`' + t.in + '\` and the authored tips from \`' + t.out + '\`. For each {id, tip} check: (1) the grammar claim is factually CORRECT for ' + t.lang + '; (2) the tip quotes a word that appears in that card\\'s target (surface form) — REQUIRED; (3)' + (t.lang === 'russian' ? ' every Russian word has romanization in parens;' : '') + ' exactly ONE rule; (4) <=200 chars; (5) no em dash, no markdown; (6) chill factual voice, no cutesy/wordplay/exclamation. FIX any tip that fails (minimal rewrite). DROP a tip only if its card supports no correct, useful tip. Overwrite \`' + t.out + '\` with the corrected JSON array {id, tip}. Return {out, kept, fixed, dropped}.';
}

const AUTHOR_SCHEMA = { type: 'object', additionalProperties: false, properties: { out: { type: 'string' }, count: { type: 'number' } }, required: ['out', 'count'] };
const VERIFY_SCHEMA = { type: 'object', additionalProperties: false, properties: { out: { type: 'string' }, kept: { type: 'number' }, fixed: { type: 'number' }, dropped: { type: 'number' } }, required: ['out', 'kept'] };

log('Wave C: authoring ' + TASKS.length + ' node-batches across tr/ru/cy, then adversarially verifying each.');

const results = await pipeline(
  TASKS,
  (t) => agent(authorPrompt(t), { label: 'auth ' + t.lang + '/' + t.node, phase: 'Author', agentType: 'general-purpose', schema: AUTHOR_SCHEMA }),
  (a, t) => a ? agent(verifyPrompt(t), { label: 'ver ' + t.lang + '/' + t.node, phase: 'Verify', agentType: 'general-purpose', schema: VERIFY_SCHEMA }) : null
);

const byLang = {};
for (let i = 0; i < TASKS.length; i++) {
  const t = TASKS[i], r = results[i];
  const L = (byLang[t.lang] = byLang[t.lang] || { ok: 0, failed: 0, kept: 0, fixed: 0, dropped: 0 });
  if (r) { L.ok++; L.kept += r.kept || 0; L.fixed += r.fixed || 0; L.dropped += r.dropped || 0; } else L.failed++;
}
return { totalBatches: TASKS.length, completed: results.filter(Boolean).length, byLang };
`;
fs.writeFileSync(OUT, script);
console.log('wrote', OUT, `(${(script.length / 1024).toFixed(1)} KB, ${TASKS.length} tasks)`);
