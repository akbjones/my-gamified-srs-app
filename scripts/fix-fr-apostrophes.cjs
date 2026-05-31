#!/usr/bin/env node
const fs = require('fs');
const p = require('path').join(__dirname, '..', 'src', 'data', 'dictionary', 'fr.ts');
let src = fs.readFileSync(p, 'utf8');
const lines = src.split('\n');
let count = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.includes("en: '")) continue;

  // Pattern: word'll, word  -> word
  const m1 = line.match(/(en: ')(\w[\w ]*?)'ll[,. ]+\2[^']*(')/);
  if (m1) {
    lines[i] = line.replace(m1[0], m1[1] + m1[2] + m1[3]);
    console.log('Fixed line ' + (i+1) + ': removed \'ll pattern -> "' + m1[2] + '"');
    count++;
    continue;
  }

  // Pattern: word's, word  -> word
  const m2 = line.match(/(en: ')(\w[\w ]*?)'s[,. ]+\2[^']*(')/);
  if (m2 && !line.includes("someone's") && !line.includes("let\\'s")) {
    lines[i] = line.replace(m2[0], m2[1] + m2[2] + m2[3]);
    console.log('Fixed line ' + (i+1) + ': removed \'s pattern -> "' + m2[2] + '"');
    count++;
    continue;
  }
}

fs.writeFileSync(p, lines.join('\n'));
console.log('\nTotal: ' + count);
