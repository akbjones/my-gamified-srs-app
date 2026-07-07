#!/usr/bin/env node
/**
 * Quality pilot — apply the 14 worst-rated cards per language (RU + TR)
 * from the full LLM audit, with proposed fixes. Reads /tmp/quality-pilot.json
 * staged from docs/{russian,turkish}-quality-full-audit.json.
 */
const fs = require('fs');
const path = require('path');

const pilot = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/quality-pilot.json', 'utf8'));

for (const [lang, fixes] of Object.entries(pilot)) {
  const deckPath = path.resolve(__dirname, '..', 'src', 'data', lang, 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const byId = new Map(deck.map(c => [c.id, c]));
  let applied = 0;
  console.log(`\n=== ${lang} ===`);
  for (const p of fixes) {
    const card = byId.get(p.id);
    if (!card) { console.warn(`MISSING: ${p.id}`); continue; }
    console.log(`[${p.id}]`);
    console.log(`  was: ${card.target}`);
    console.log(`  now: ${p.target}`);
    card.target = p.target;
    card.english = p.english;
    applied++;
  }
  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');
  console.log(`Applied ${applied}/${fixes.length}`);
}
