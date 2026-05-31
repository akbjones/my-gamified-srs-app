#!/usr/bin/env node
const fs = require('fs');
const p = require('path').join(__dirname, '..', 'src', 'data', 'dictionary', 'fr.ts');
let src = fs.readFileSync(p, 'utf8');
const lines = src.split('\n');
let count = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Fix corrupted "let's X's X" and "to X's X" patterns
  // Pattern: en: 'let\'s X's X' or en: 'to X's X'
  const m = line.match(/^(\s*'[^']+'\s*:\s*\{\s*en:\s*')(.+?)(',\s*ipa:.*)/);
  if (!m) continue;

  const enValue = m[2];

  // Check for corrupted patterns
  // Pattern 1: let\'s X's X  (e.g., "let\'s borrow's borrow")
  // Pattern 2: to X's X (e.g., "to chat's chat")
  // Pattern 3: to let\'s X's X (e.g., "to let\'s recover's recover")
  // Pattern 4: to X's X this. (e.g., "to settle's settle this.")

  let fixed = null;

  if (/let\\'s .+'s /.test(enValue) || /let's .+'s /.test(enValue)) {
    // Extract the verb from "let's VERB's VERB"
    const vm = enValue.match(/let(?:\\'s|'s) (\w+)/);
    if (vm) fixed = 'to ' + vm[1];
  } else if (/^to [a-z]+'s [a-z]/.test(enValue)) {
    // "to chat's chat" -> "to chat"
    const vm = enValue.match(/^to (\w+)/);
    if (vm) fixed = 'to ' + vm[1];
  } else if (/^to let\\'s /.test(enValue) || /^to let's /.test(enValue)) {
    // "to let's recover's recover" -> "to recover"
    const vm = enValue.match(/let(?:\\'s|'s) (\w+)/);
    if (vm) fixed = 'to ' + vm[1];
  }

  if (fixed) {
    lines[i] = m[1] + fixed + m[3];
    console.log('Fixed line ' + (i+1) + ': "' + enValue + '" -> "' + fixed + '"');
    count++;
  }
}

// Also fix entries with wrong POS that should be verbs (ending in -ons with lemma)
// Fix pos: 'n' to pos: 'v' for verb forms
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("pos: 'n'") && line.includes("lemma:") && line.match(/en: 'to \w/)) {
    const before = lines[i];
    lines[i] = line.replace("pos: 'n'", "pos: 'v'");
    if (lines[i] !== before) {
      console.log('Fixed POS line ' + (i+1));
      count++;
    }
  }
}

fs.writeFileSync(p, lines.join('\n'));
console.log('\nTotal fixes: ' + count);
