// Remove garbage auto-expanded entries from pt.ts
// These have wrong translations, wrong IPA (no /.../ notation), wrong POS
const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, '../src/data/dictionary/pt.ts');
const content = fs.readFileSync(dictPath, 'utf8');
const lines = content.split('\n');

const autoIdx = lines.findIndex(l => l.includes('Auto-expanded entries'));
console.log('Auto-expanded section starts at line:', autoIdx + 1);

// Find the closing }; of the dictionary object after the auto-expanded section
let closingIdx = -1;
for (let i = autoIdx; i < lines.length; i++) {
  if (lines[i].match(/^};/)) {
    closingIdx = i;
    break;
  }
}
console.log('Dictionary closing at line:', closingIdx + 1);

// Count entries being removed
let removedCount = 0;
for (let i = autoIdx; i < closingIdx; i++) {
  if (lines[i].match(/^\s+[^\s/].*:\s*\{/)) removedCount++;
}
console.log('Removing', removedCount, 'garbage entries');

// Keep everything before auto-expanded, plus the closing and export
const newLines = [
  ...lines.slice(0, autoIdx),
  lines[closingIdx],   // };
  '',
  lines[closingIdx + 2] || 'export default dictionary;', // export default dictionary;
];

// Make sure the last good entry line ends with comma
const lastEntryIdx = autoIdx - 1;
// Actually, let's just keep it clean
const newContent = newLines.join('\n');
fs.writeFileSync(dictPath, newContent, 'utf8');

console.log('Done! Removed garbage section from line', autoIdx + 1, 'to', closingIdx);
console.log('New file has', newLines.length, 'lines');
