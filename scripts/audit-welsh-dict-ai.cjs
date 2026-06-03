#!/usr/bin/env node
/**
 * AI-assisted audit of Welsh dictionary entries.
 *
 * Sends batches of the most frequent Welsh deck words + their current
 * dict English to Claude API and asks for a translation quality check.
 *
 * Output: scripts/output/cy-ai-audit.json with entries flagged as
 * wrong/incomplete and the suggested correction.
 *
 * Usage: ANTHROPIC_API_KEY=... node scripts/audit-welsh-dict-ai.cjs
 */
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk').default;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Set ANTHROPIC_API_KEY');
  process.exit(1);
}

const client = new Anthropic();
const top = JSON.parse(fs.readFileSync('/tmp/cy-top-300.json'));

const BATCH = 25;
const MODEL = 'claude-sonnet-4-5'; // Good quality, fast, cheap

async function auditBatch(entries, batchNum, totalBatches) {
  const items = entries.map((e, i) => `${i + 1}. ${e.word} → "${e.en}" (pos: ${e.pos}${e.lemma ? `, lemma: ${e.lemma}` : ''})`).join('\n');
  const prompt = `You are a Welsh-English bilingual expert. I have a Welsh-English dictionary
where each entry maps a Welsh word/form to an English meaning. Many entries
include mutated forms (soft mutation, nasal mutation, aspirate mutation),
inflected verbs, etc.

For each entry below, judge if the English translation is ACCURATE and SUFFICIENT
for a language learner. Common bugs to look for:
- Wrong word (e.g. "glaear" listed as "hail" when it actually means "lukewarm/mild")
- Wrong POS (e.g. verb listed as noun without "to")
- Missing main meaning (e.g. "de" = "south" only, but it's ALSO "tea")
- Mutated form not marked as such
- Mistakes from machine translation

Reply ONLY with JSON. For each entry, output an object:
  {
    "n": <entry number>,
    "word": "<the welsh word>",
    "verdict": "OK" | "WRONG" | "INCOMPLETE",
    "suggestion": "<corrected English if not OK, or empty string>",
    "reason": "<brief reason if not OK>"
  }

Only include entries where verdict != "OK". Return an empty array if all OK.
Use semicolons to separate multiple meanings in suggestion (NEVER slashes).

Entries (batch ${batchNum}/${totalBatches}):
${items}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  // Extract JSON array
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) {
    console.error('No JSON in response for batch', batchNum);
    return [];
  }
  try {
    return JSON.parse(m[0]);
  } catch (e) {
    console.error('Parse error batch', batchNum, e.message);
    return [];
  }
}

async function main() {
  const batches = [];
  for (let i = 0; i < top.length; i += BATCH) batches.push(top.slice(i, i + BATCH));
  console.log(`Auditing ${top.length} entries in ${batches.length} batches...`);

  const allFlags = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Batch ${i + 1}/${batches.length} (${batch.length} entries)...`);
    try {
      const flags = await auditBatch(batch, i + 1, batches.length);
      // Map back to original word objects
      for (const f of flags) {
        const original = batch[f.n - 1];
        if (original) {
          allFlags.push({ ...f, current: original.en, pos: original.pos, lemma: original.lemma, freq: original.freq });
        }
      }
      console.log(`    flagged ${flags.length} entries`);
    } catch (e) {
      console.error('    error:', e.message);
    }
  }

  fs.mkdirSync('scripts/output', { recursive: true });
  fs.writeFileSync('scripts/output/cy-ai-audit.json', JSON.stringify(allFlags, null, 2));
  console.log(`\nDone. ${allFlags.length} flagged entries in scripts/output/cy-ai-audit.json`);
  console.log('\nSummary:');
  for (const f of allFlags) {
    console.log(`  ${f.word.padEnd(15)} [${f.current}] → [${f.suggestion}] – ${f.reason}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
