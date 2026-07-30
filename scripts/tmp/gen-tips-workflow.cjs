#!/usr/bin/env node
// Emit the tips-wave-b authoring workflow with the task manifest + doctrine
// baked in (workflow scripts have no fs access, so everything is inlined).
const fs = require('fs');
const TASKS = JSON.parse(fs.readFileSync('/private/tmp/tips-wave-b-manifest.json', 'utf8'));
const OUT = 'scripts/tmp/tips-wave-b.workflow.js';

const script = `export const meta = {
  name: 'tips-wave-b-author',
  description: 'Author + adversarially verify grammar tips for it/pt/de/nl/sv (Wave B)',
  phases: [{ title: 'Author', detail: 'one agent per rewrite/fill batch' }, { title: 'Verify', detail: 'adversarial check + fix per batch' }],
};

const TASKS = ${JSON.stringify(TASKS)};
const bn = p => p.split('/').pop();

const DOCTRINE = [
  'The explanation is in ENGLISH; the worked example uses the target-language word(s) from that card\\'s "target" sentence.',
  'At most 120 characters is ideal; 200 is the HARD maximum.',
  'Exactly ONE grammar/usage rule per tip. Never combine two points.',
  'The tip MUST contain a word that appears in that card\\'s "target" sentence. This is enforced downstream (accent-insensitive, exact or >=4-char stem match); a tip citing no target word is auto-rejected, so always quote an actual word from the sentence.',
  'Teach the grammar or usage point. Do NOT merely restate the English meaning.',
  'Voice: chill, factual, plain. The hook is the fact itself, stated directly. BANNED: wordplay, cutesy metaphors, "think of it as", personifying grammar (e.g. "estar savors the sip"), and exclamation marks.',
  'Avoid jargon: say "position word" not "postposition"; name the actual words rather than "the auxiliary".',
  'NO em dashes (the — character). NO backticks, asterisks, #, or any markdown. Use plain commas/periods.',
  'Write NOTHING but the JSON array to the output file.',
].map((r, i) => (i + 1) + '. ' + r).join('\\n');

function authorPrompt(t) {
  const head = 'You are authoring grammar tips for the ' + t.lang + ' deck of a language-learning app. Explanations in English, examples in ' + t.lang + '.';
  if (t.kind === 'rewrite') {
    return head + '\\n\\nRead the JSON file \`' + t.in + '\` — an array of cards, each {id, target, english, node, old, focus}. "old" is the current weak tip; "focus" says how to fix it. For EACH card, write ONE improved tip following "focus" and the RULES below. Produce a JSON array of {id, tip} with one entry per input card, and WRITE it to \`' + t.out + '\` using the Write tool. Then return {out, count}.\\n\\nRULES:\\n' + DOCTRINE;
  }
  return head + '\\n\\nRead the JSON file \`' + t.in + '\` — an object {node, quota, cards:[{id,target,english}], existing_tips}. Author tips for UP TO quota=' + (t.quota || 0) + ' of the cards. Choose cards where a genuine, useful, non-obvious grammar/usage point applies; SKIP cards where any tip would be filler or a bare translation restatement. Do not duplicate any of "existing_tips". Produce a JSON array of {id, tip} and WRITE it to \`' + t.out + '\` using the Write tool. Return {out, count}.\\n\\nRULES:\\n' + DOCTRINE;
}

function verifyPrompt(t) {
  return 'You are an adversarial checker for ' + t.lang + ' grammar tips. Read the cards from \`' + t.in + '\` and the authored tips from \`' + t.out + '\`. For each {id, tip} verify: (1) the grammar claim is factually CORRECT for ' + t.lang + '; (2) the tip contains a word that appears in that card\\'s "target" (accent-insensitive) — REQUIRED or it is rejected on apply; (3) exactly ONE rule; (4) <=200 chars; (5) no em dash, no markdown/backticks; (6) chill factual voice, no cutesy/wordplay/personification/exclamation. FIX any tip that fails by minimally rewriting it to pass every check. DROP a tip only if its card genuinely supports no correct, useful tip. Overwrite \`' + t.out + '\` with the corrected JSON array of {id, tip} using the Write tool. Return {out, kept, fixed, dropped}.';
}

const AUTHOR_SCHEMA = { type: 'object', additionalProperties: false, properties: { out: { type: 'string' }, count: { type: 'number' } }, required: ['out', 'count'] };
const VERIFY_SCHEMA = { type: 'object', additionalProperties: false, properties: { out: { type: 'string' }, kept: { type: 'number' }, fixed: { type: 'number' }, dropped: { type: 'number' } }, required: ['out', 'kept'] };

log('Authoring ' + TASKS.length + ' batches across it/pt/de/nl/sv, then adversarially verifying each.');

const results = await pipeline(
  TASKS,
  (t) => agent(authorPrompt(t), { label: 'auth ' + t.lang + '/' + bn(t.out), phase: 'Author', agentType: 'general-purpose', schema: AUTHOR_SCHEMA }),
  (a, t) => a ? agent(verifyPrompt(t), { label: 'ver ' + t.lang + '/' + bn(t.out), phase: 'Verify', agentType: 'general-purpose', schema: VERIFY_SCHEMA }) : null
);

const done = results.filter(Boolean);
const byLang = {};
for (let i = 0; i < TASKS.length; i++) {
  const t = TASKS[i], r = results[i];
  const L = (byLang[t.lang] = byLang[t.lang] || { ok: 0, failed: 0, kept: 0, fixed: 0, dropped: 0 });
  if (r) { L.ok++; L.kept += r.kept || 0; L.fixed += r.fixed || 0; L.dropped += r.dropped || 0; }
  else L.failed++;
}
return { totalBatches: TASKS.length, completed: done.length, byLang };
`;

fs.writeFileSync(OUT, script);
console.log('wrote', OUT, `(${(script.length / 1024).toFixed(1)} KB, ${TASKS.length} tasks embedded)`);
