/**
 * Dump all entries in a compact format for manual review.
 * Format: word → en (pos) per line
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

for (const lang of ['es', 'it', 'fr', 'pt']) {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  const lines = entries.map(e => `${e.word} → ${e.en}${e.pos ? ` (${e.pos})` : ''}`);
  fs.writeFileSync(path.join(OUTPUT, `${lang}-review.txt`), lines.join('\n'));
  console.log(`${lang}: ${lines.length} lines written`);
}
