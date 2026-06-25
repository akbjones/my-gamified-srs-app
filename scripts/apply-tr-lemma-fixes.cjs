/**
 * Apply Turkish dict lemma fixes from tr-lemma-fixes.json.
 *
 * For each fix, find the matching line in tr.ts and replace
 * `lemma: 'oldLemma'` with `lemma: 'newLemma'` ONLY for the entry whose
 * key matches. We use a per-line edit keyed by the literal `'key': {` to
 * scope the replacement.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
const FIXES = path.resolve(__dirname, 'tr-lemma-fixes.json');

const fixes = JSON.parse(fs.readFileSync(FIXES, 'utf8'));
let txt = fs.readFileSync(SRC, 'utf8');
const lines = txt.split('\n');

let applied = 0;
let skipped = 0;
const skips = [];

for (const fix of fixes) {
  const lineIdx = fix.line - 1; // 1-indexed → 0-indexed
  const line = lines[lineIdx];
  if (!line) { skips.push({...fix, reason: 'no line'}); skipped++; continue; }

  // Verify the key appears on this line in the expected position
  const keyPattern = new RegExp(`^\\s*['"\`]${fix.key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}['"\`]\\s*:`);
  if (!keyPattern.test(line)) {
    skips.push({...fix, reason: `key not on line ${fix.line}: ${line.slice(0, 60)}`});
    skipped++;
    continue;
  }

  // Verify the old lemma appears on this line
  const oldPattern = new RegExp(`lemma\\s*:\\s*['"\`]${fix.oldLemma.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}['"\`]`);
  if (!oldPattern.test(line)) {
    skips.push({...fix, reason: `oldLemma '${fix.oldLemma}' not on line ${fix.line}`});
    skipped++;
    continue;
  }

  const newLine = line.replace(oldPattern, `lemma: '${fix.newLemma}'`);
  if (newLine === line) {
    skips.push({...fix, reason: 'replace was no-op'});
    skipped++;
    continue;
  }
  lines[lineIdx] = newLine;
  applied++;
}

if (applied > 0) {
  fs.writeFileSync(SRC, lines.join('\n'));
}

console.log(`Applied: ${applied}`);
console.log(`Skipped: ${skipped}`);
if (skips.length > 0) {
  console.log('\nSkips:');
  for (const s of skips) console.log(`  [${s.line}] ${s.key}: ${s.reason}`);
}
