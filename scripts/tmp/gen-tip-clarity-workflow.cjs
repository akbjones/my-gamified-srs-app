#!/usr/bin/env node
// Tip Clarity pass — Tier 1 (hindi/russian/turkish/welsh). Per batch: review
// every existing tip against the agreed standard, leave compliant ones UNCHANGED,
// minimally fix violators. Rule text is precomputed per batch here (plain JS) and
// injected via JSON.stringify so there are no nested-quote escaping headaches.
const fs = require('fs');
const TASKS = JSON.parse(fs.readFileSync('/private/tmp/tip-clarity-manifest.json', 'utf8'));
const OUT = 'scripts/tmp/tip-clarity.workflow.js';

const ROMAN = {
  hindi: 'inherent schwa अ = short a/uh; फ = ph (native, e.g. phal), फ़ = f; nukta ज़=za, क़=qa; mark long vowels; match the deck dictionary.',
  russian: 'unstressed о reduces to a (пока = paka, хорошо = harasho); genitive/adjective -ого/-его: г becomes v (того = tavo, его = yevo, красного = krasnava); ё = yo; give the SPOKEN form, not letter-by-letter.',
};
function rulesFor(t) {
  const latin = t.latin;
  return [
    '1. LOWERCASE citations: cite a target word in lowercase unless it is a proper noun — never keep a capital a word only has from starting the example sentence.',
    latin
      ? '2. QUOTE every target-language word in single quotes so it cannot blur into the English (this is a Latin-script language). For example: write it as the-suffix -dan/-den marks the source: ‘arkadasimdan’ = from my friend; or ‘ei’ (her) mutates ‘tad-cu’ to ‘thad-cu’.'
      : '2. Do NOT quote the target word (its non-Latin script already separates it); give its romanisation in parens instead.',
    latin
      ? '3. (romanisation not needed — Latin script.)'
      : '3. ROMANISATION = a pronunciation respelling in parens (how to SAY it), never letter-by-letter. For ' + t.lang + ': ' + (ROMAN[t.lang] || ''),
    '4. NO false absolutes — qualify claims that are not universally true (normally, usually).',
    '5. Only cite segments that REALLY appear in the surface form (or state the sound-change); never invent a clean split or cite a segment that collides with a different real word.',
    '6. Use English analogies only when genuinely parallel; otherwise explain the target directly.',
    '7. Plain terms, not linguistics jargon — name a form by what it does and show it.',
    '8. Keep the base gates: <=200 chars, ONE rule, still cites a word from the card sentence, no em dash, no markdown/backticks, chill + factual voice.',
  ].join('\n');
}
const enriched = TASKS.map(t => ({ ...t, rules: rulesFor(t) }));

const script = `export const meta = {
  name: 'tip-clarity-tier1',
  description: 'Tip Clarity pass — review + fix hindi/russian/turkish/welsh tips to the agreed standard',
  phases: [{ title: 'Review & fix', detail: 'one agent per ~30-tip batch' }],
};

const TASKS = ${JSON.stringify(enriched)};
const bn = p => p.split('/').pop();

function prompt(t) {
  return 'You are reviewing existing grammar tips for the ' + t.lang + ' deck against the Tip Clarity Standard. Read the batch from \`' + t.in + '\` — an array of {id, target, english, tip}. For EACH tip: if it ALREADY fully complies, return it UNCHANGED; if it violates any rule, rewrite it MINIMALLY to comply while keeping its teaching point and worked example. Output a JSON array of {id, tip} with the SAME ids and SAME count, and WRITE it to \`' + t.out + '\` with the Write tool. Return {out, reviewed, changed}.\\n\\nTHE STANDARD:\\n' + t.rules;
}

const SCHEMA = { type: 'object', additionalProperties: false, properties: { out: { type: 'string' }, reviewed: { type: 'number' }, changed: { type: 'number' } }, required: ['out', 'reviewed'] };

log('Tip Clarity Tier 1: reviewing ' + TASKS.length + ' batches across hindi/russian/turkish/welsh.');

const results = await parallel(TASKS.map(t => () =>
  agent(prompt(t), { label: t.lang + '/' + bn(t.out), phase: 'Review & fix', agentType: 'general-purpose', schema: SCHEMA })
));

const byLang = {};
for (let i = 0; i < TASKS.length; i++) { const t = TASKS[i], r = results[i]; const L = (byLang[t.lang] = byLang[t.lang] || { ok: 0, failed: 0, changed: 0 }); if (r) { L.ok++; L.changed += r.changed || 0; } else L.failed++; }
return { totalBatches: TASKS.length, completed: results.filter(Boolean).length, byLang };
`;
fs.writeFileSync(OUT, script);
console.log('wrote', OUT, `(${(script.length / 1024).toFixed(1)} KB, ${enriched.length} batches)`);
