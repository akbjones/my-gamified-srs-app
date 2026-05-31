// Remove duplicate dictionary entries from pt.ts - more robust regex
const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, '../src/data/dictionary/pt.ts');
const content = fs.readFileSync(dictPath, 'utf8');
const lines = content.split('\n');

const dictStart = lines.findIndex(l => l.includes('const dictionary: Record<string, DictEntry>'));

const seenKeys = new Set();
const linesToRemove = new Set();

for (let i = dictStart; i < lines.length; i++) {
  const line = lines[i];
  // Match any key pattern: either bare word or quoted string followed by : {
  // Use a very permissive pattern for bare keys
  let key = null;
  const quotedMatch = line.match(/^\s+"([^"]+)":\s*\{/);
  if (quotedMatch) {
    key = quotedMatch[1];
  } else {
    // Match bare key: anything that's not whitespace or colon before : {
    const bareMatch = line.match(/^\s+([^\s:]+):\s*\{/);
    if (bareMatch) {
      key = bareMatch[1];
    }
  }

  if (key) {
    if (seenKeys.has(key)) {
      linesToRemove.add(i);
      // console.log(`Removing duplicate at line ${i+1}: ${key}`);
    } else {
      seenKeys.add(key);
    }
  }
}

console.log(`Found ${linesToRemove.size} duplicate lines to remove`);

const newLines = lines.filter((_, i) => !linesToRemove.has(i));
fs.writeFileSync(dictPath, newLines.join('\n'), 'utf8');
console.log('Deduplication complete!');
