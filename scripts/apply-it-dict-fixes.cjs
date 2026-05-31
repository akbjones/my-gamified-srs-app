#!/usr/bin/env node
/**
 * Apply Italian dictionary fixes from the review JSON.
 * Uses line-by-line approach for reliability with apostrophes.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const FIXES_PATH = path.join(__dirname, 'output', 'it-full-verb-review.json');

const fixes = JSON.parse(fs.readFileSync(FIXES_PATH, 'utf8'));
const lines = fs.readFileSync(DICT_PATH, 'utf8').split('\n');

// Build lookup of fixes by key
const fixMap = {};
for (const f of fixes) {
  fixMap[f.key] = f;
}

let applied = 0;
let failed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Match dictionary entry lines
  const keyMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{(.+)\}\s*,?\s*$/);
  if (!keyMatch) continue;

  const key = keyMatch[1];
  const f = fixMap[key];
  if (!f) continue;

  // Parse the current line fully
  let newLine = line;

  // Replace en value using indexOf approach (handles apostrophes correctly)
  if (f.new.en !== undefined) {
    const enStart = newLine.indexOf("en: '");
    if (enStart === -1) { failed++; continue; }
    const enValueStart = enStart + 5; // after "en: '"
    // Find the closing apostrophe (handle escaped ones)
    let enEnd = enValueStart;
    while (enEnd < newLine.length) {
      if (newLine[enEnd] === "'" && newLine[enEnd - 1] !== '\\') break;
      enEnd++;
    }
    const escapedNewEn = f.new.en.replace(/'/g, "\\'");
    newLine = newLine.substring(0, enValueStart) + escapedNewEn + newLine.substring(enEnd);
  }

  // Replace pos value
  if (f.new.pos !== undefined) {
    newLine = newLine.replace(/pos: '[^']*'/, `pos: '${f.new.pos}'`);
  }

  // Handle lemma
  if (f.new.lemma === null) {
    // Remove lemma
    newLine = newLine.replace(/,\s*lemma: '[^']*'/, '');
  } else if (f.new.lemma !== undefined) {
    if (newLine.includes('lemma:')) {
      newLine = newLine.replace(/lemma: '[^']*'/, `lemma: '${f.new.lemma}'`);
    } else {
      // Add lemma before closing brace
      newLine = newLine.replace(/(\s*pos: '[^']*')/, `$1, lemma: '${f.new.lemma}'`);
    }
  }

  if (newLine !== line) {
    lines[i] = newLine;
    applied++;
  }
}

fs.writeFileSync(DICT_PATH, lines.join('\n'));
console.log(`Applied: ${applied}, Failed: ${failed}, Total fixes: ${fixes.length}`);
