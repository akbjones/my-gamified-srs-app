#!/usr/bin/env node
/**
 * Fix Hindi dictionary entries that have grammatical descriptions in parentheses
 * instead of clean translations.
 *
 * These entries already have good English translations but include grammar notes
 * like "(oblique)", "(oblique pl.)", "(inf. oblique)" that should be removed.
 *
 * Examples:
 *   'cook (oblique)' → 'cook'
 *   'lamps (oblique pl.)' → 'lamps'
 *   'to cook, to ripen (inf. oblique)' → 'to cook, to ripen'
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'hi.ts');

let content = fs.readFileSync(DICT_PATH, 'utf8');
const lines = content.split('\n');

// Grammar note patterns in parentheses to strip
const GRAMMAR_PARENS = /\s*\((?:oblique|oblique pl\.|inf\. oblique|obl\.|pl\.|obl\.? pl\.?)\)/gi;

const fixes = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Match dictionary entry lines
  const m = line.match(/^(\s*'[^']+':.*en:\s*')((?:[^'\\]|\\.)*)('.*)$/);
  if (!m) continue;

  const prefix = m[1];
  const en = m[2];
  const suffix = m[3];

  if (!GRAMMAR_PARENS.test(en)) continue;
  // Reset regex lastIndex
  GRAMMAR_PARENS.lastIndex = 0;

  const newEn = en.replace(GRAMMAR_PARENS, '').trim();
  if (newEn === en) continue;

  fixes.push({ word: line.match(/'([^']+)':/)[1], oldEn: en, newEn });
  lines[i] = prefix + newEn + suffix;
}

console.log(`Fixed ${fixes.length} entries by removing grammar parentheticals`);
console.log('\n=== All fixes ===');
for (const f of fixes) {
  console.log(`  ${f.word}: "${f.oldEn}" → "${f.newEn}"`);
}

// Write updated file
fs.writeFileSync(DICT_PATH, lines.join('\n'), 'utf8');

// Verify: check for any remaining grammar descriptions
const verifyContent = fs.readFileSync(DICT_PATH, 'utf8');
const remaining = [];
const entryRegex = /^\s*'([^']+)':\s*\{[^}]*en:\s*'((?:[^'\\]|\\.)*)'/gm;
let vm;
while ((vm = entryRegex.exec(verifyContent)) !== null) {
  if (/\b(oblique|vocative|singular|plural|masculine|feminine|genitive|dative|accusative|nominative|inflection of|form of|conjunctive)\b/i.test(vm[2])) {
    remaining.push({ word: vm[1], en: vm[2] });
  }
}
console.log(`\nRemaining entries with grammar keywords: ${remaining.length}`);
if (remaining.length > 0) {
  for (const r of remaining) {
    console.log(`  ${r.word}: "${r.en}"`);
  }
}
