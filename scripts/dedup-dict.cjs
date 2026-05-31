#!/usr/bin/env node
/**
 * Remove duplicate dictionary keys from a .ts file.
 * Keeps the FIRST occurrence, removes later duplicates.
 */
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/dedup-dict.cjs <dict-file.ts>');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// Track seen keys
const seen = new Set();
const keepLines = [];
let removed = 0;

for (const line of lines) {
  // Match dictionary entry lines: key: { en: or 'key': { en: or "key": { en:
  const m = line.match(/^\s*(?:'([^']+)'|"([^"]+)"|(\w[\w\u00C0-\u024F\u0400-\u04FF\u0900-\u097F]*))\s*:\s*\{/);
  if (m) {
    const key = (m[1] || m[2] || m[3] || '').toLowerCase();
    if (key && seen.has(key)) {
      removed++;
      continue; // skip duplicate
    }
    if (key) seen.add(key);
  }
  keepLines.push(line);
}

if (removed > 0) {
  fs.writeFileSync(file, keepLines.join('\n'));
  console.log(`Removed ${removed} duplicate entries from ${path.basename(file)}`);
} else {
  console.log(`No duplicates found in ${path.basename(file)}`);
}
