const fs = require('fs');
const path = require('path');

const BASE = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd';

for (const lang of ['de', 'nl', 'sv']) {
  const data = JSON.parse(fs.readFileSync(path.join(BASE, `scripts/output/${lang}-alignments.json`), 'utf8'));
  const missing = {};
  for (const [word, entries] of Object.entries(data.alignments)) {
    if (entries[0].en === '?') {
      missing[word] = entries.length;
    }
  }
  // Sort by frequency
  const sorted = Object.entries(missing).sort((a, b) => b[1] - a[1]);
  console.log(`\n=== ${lang.toUpperCase()} TOP 100 MISSING ===`);
  sorted.slice(0, 100).forEach(([w, c]) => console.log(`  ${w}: ${c}`));
  console.log(`Total missing unique: ${sorted.length}`);
}
