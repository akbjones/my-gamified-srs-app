// Check Portuguese dictionary coverage accurately
const fs = require('fs');
const path = require('path');

const deck = require('../src/data/portuguese/deck.json');
const dictContent = fs.readFileSync(path.join(__dirname, '../src/data/dictionary/pt.ts'), 'utf8');

// Extract all words from deck with frequency
const words = new Map();
deck.forEach(card => {
  const text = card.target;
  if (!text) return;
  const tokens = text.toLowerCase()
    .replace(/[.,!?;:"()¡¿…––\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
  tokens.forEach(w => {
    words.set(w, (words.get(w) || 0) + 1);
  });
});

// Extract ALL dictionary keys using a very permissive approach
const dictKeys = new Set();

// Extract from main dictionary object
const lines = dictContent.split('\n');
const dictStart = lines.findIndex(l => l.includes('const dictionary: Record<string, DictEntry>'));
for (let i = dictStart; i < lines.length; i++) {
  const line = lines[i];
  // Quoted key
  const qm = line.match(/^\s+"([^"]+)":\s*\{/);
  if (qm) { dictKeys.add(qm[1].toLowerCase()); continue; }
  // Bare key (permissive: anything before `: {`)
  const bm = line.match(/^\s+([^\s:]+):\s*\{/);
  if (bm) { dictKeys.add(bm[1].toLowerCase()); continue; }
}

// Also extract IRREGULAR_MAP keys
const irregularSection = dictContent.match(/const IRREGULAR_MAP[\s\S]*?^};/m);
if (irregularSection) {
  const irrRegex = /([^\s,:{]+):\s*'[^']+'/g;
  let m;
  while ((m = irrRegex.exec(irregularSection[0])) !== null) {
    dictKeys.add(m[1].toLowerCase());
  }
}

// Extract CONTRACTION_MAP keys
const contractionSection = dictContent.match(/const CONTRACTION_MAP[\s\S]*?^};/m);
if (contractionSection) {
  const conRegex = /'([^']+)':\s*\[/g;
  let m;
  while ((m = conRegex.exec(contractionSection[0])) !== null) {
    dictKeys.add(m[1].toLowerCase());
  }
}

console.log('Total unique deck words:', words.size);
console.log('Dict keys (including irregular+contraction):', dictKeys.size);

// Check direct matches
let directMatches = 0;
const missing = [];
for (const [word, count] of words) {
  if (dictKeys.has(word)) {
    directMatches++;
  } else {
    missing.push({ word, count });
  }
}

console.log('Direct matches:', directMatches);
console.log('Direct coverage:', (directMatches / words.size * 100).toFixed(1) + '%');
console.log('Missing:', missing.length);

missing.sort((a, b) => b.count - a.count);

console.log('\nMissing 5+:', missing.filter(w => w.count >= 5).length);
console.log('Missing 2-4:', missing.filter(w => w.count >= 2 && w.count < 5).length);
console.log('Missing 1:', missing.filter(w => w.count === 1).length);

console.log('\n=== TOP 50 MISSING ===');
missing.slice(0, 50).forEach(w => console.log(`${w.word} (${w.count})`));
