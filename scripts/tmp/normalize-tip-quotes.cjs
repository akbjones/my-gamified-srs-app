#!/usr/bin/env node
// Normalize smart/curly quotes in grammar tips to straight ASCII quotes, so the
// citation style is identical across all 14 languages (the clarity standard's
// rule A2 says single quotes; the passes emitted a mix). Curly apostrophes
// inside words (don’t, l’ho) become straight apostrophes, which is correct too.
const fs = require('fs');
const LANGS = ['spanish', 'italian', 'french', 'portuguese', 'german', 'dutch', 'swedish',
  'indonesian', 'hindi', 'russian', 'turkish', 'welsh', 'greek', 'korean'];
let total = 0;
for (const lang of LANGS) {
  const p = `src/data/${lang}/deck.json`;
  const deck = JSON.parse(fs.readFileSync(p, 'utf8'));
  let n = 0;
  for (const c of deck) {
    if (!c.grammar) continue;
    const fixed = c.grammar.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
    if (fixed !== c.grammar) { c.grammar = fixed; n++; }
  }
  if (n) { fs.writeFileSync(p, JSON.stringify(deck, null, 2) + '\n'); console.log(`${lang}: ${n} tips normalized`); total += n; }
}
console.log('total normalized:', total);
