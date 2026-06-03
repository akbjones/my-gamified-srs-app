// This script finds words that are truly missing from the dictionary,
// accounting for the lookup function's ability to find verb forms, plurals, etc.

const fs = require('fs');
const path = require('path');

// We need to test against the actual lookup function
// But since it's TypeScript, let's simulate the key lookups

const deck = require('../src/data/portuguese/deck.json');

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

// Read dictionary to get existing keys
const dictContent = fs.readFileSync(path.join(__dirname, '../src/data/dictionary/pt.ts'), 'utf8');

const dictKeys = new Set();
// Main dict entries
const bareKeyRegex = /^\s+(\w+):\s*\{[^}]*en:/gm;
let m;
while ((m = bareKeyRegex.exec(dictContent)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
const quotedKeyRegex = /^\s+"([^"]+)":\s*\{[^}]*en:/gm;
while ((m = quotedKeyRegex.exec(dictContent)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}

// Irregular map keys
const irregularSection = dictContent.match(/const IRREGULAR_MAP[\s\S]*?};/);
if (irregularSection) {
  const irrRegex = /(\w+):\s*'([^']+)'/g;
  while ((m = irrRegex.exec(irregularSection[0])) !== null) {
    dictKeys.add(m[1].toLowerCase());
  }
}

// Contraction map keys
const contractionSection = dictContent.match(/const CONTRACTION_MAP[\s\S]*?};/);
if (contractionSection) {
  const conRegex = /'(\w+)':\s*\[/g;
  while ((m = conRegex.exec(contractionSection[0])) !== null) {
    dictKeys.add(m[1].toLowerCase());
  }
}

// Simulate reverseVerb
function reverseVerb(clean) {
  // Regular -ar verbs
  const arEndings = {
    'o': '', 'a': '', 'as': '', 'amos': '', 'am': '',
    'ei': '', 'ou': '', 'aram': '',
    'ava': '', 'avas': '', 'ávamos': '', 'avam': '',
    'arei': '', 'ará': '', 'aremos': '', 'arão': '',
    'aria': '', 'aríamos': '', 'ariam': '',
    'e': '', 'em': '', 'emos': '',
    'asse': '', 'assem': '', 'ássemos': '',
    'ando': '', 'ado': '', 'ada': '',
    'ados': '', 'adas': '',
  };
  for (const [ending, _] of Object.entries(arEndings)) {
    if (clean.endsWith(ending) && clean.length > ending.length + 2) {
      const stem = clean.slice(0, -ending.length);
      const inf = stem + 'ar';
      if (dictKeys.has(inf)) return inf;
    }
  }

  // Regular -er verbs
  const erEndings = {
    'o': '', 'e': '', 'es': '', 'emos': '', 'em': '',
    'i': '', 'eu': '', 'eram': '',
    'ia': '', 'ias': '', 'íamos': '', 'iam': '',
    'erei': '', 'erá': '', 'eremos': '', 'erão': '',
    'eria': '', 'eríamos': '', 'eriam': '',
    'a': '', 'am': '', 'amos': '',
    'esse': '', 'essem': '', 'êssemos': '',
    'endo': '', 'ido': '', 'ida': '',
    'idos': '', 'idas': '',
  };
  for (const [ending, _] of Object.entries(erEndings)) {
    if (clean.endsWith(ending) && clean.length > ending.length + 2) {
      const stem = clean.slice(0, -ending.length);
      const inf = stem + 'er';
      if (dictKeys.has(inf)) return inf;
    }
  }

  // Regular -ir verbs
  const irEndings = {
    'o': '', 'e': '', 'es': '', 'imos': '', 'em': '',
    'i': '', 'iu': '', 'iram': '',
    'ia': '', 'ias': '', 'íamos': '', 'iam': '',
    'irei': '', 'irá': '', 'iremos': '', 'irão': '',
    'iria': '', 'iríamos': '', 'iriam': '',
    'a': '', 'am': '', 'amos': '',
    'isse': '', 'issem': '', 'íssemos': '',
    'indo': '', 'ido': '', 'ida': '',
    'idos': '', 'idas': '',
  };
  for (const [ending, _] of Object.entries(irEndings)) {
    if (clean.endsWith(ending) && clean.length > ending.length + 2) {
      const stem = clean.slice(0, -ending.length);
      const inf = stem + 'ir';
      if (dictKeys.has(inf)) return inf;
    }
  }

  return null;
}

// Check plural stripping
function checkPlural(clean) {
  if (clean.endsWith('ões')) {
    const sing = clean.slice(0, -3) + 'ão';
    if (dictKeys.has(sing)) return sing;
  }
  if (clean.endsWith('ais')) {
    const sing = clean.slice(0, -3) + 'al';
    if (dictKeys.has(sing)) return sing;
  }
  if (clean.endsWith('éis')) {
    const sing = clean.slice(0, -3) + 'el';
    if (dictKeys.has(sing)) return sing;
  }
  if (clean.endsWith('eis') && clean.length > 4) {
    const sing = clean.slice(0, -3) + 'il';
    if (dictKeys.has(sing)) return sing;
    const sing2 = clean.slice(0, -3) + 'el';
    if (dictKeys.has(sing2)) return sing2;
  }
  if (clean.endsWith('ns') && clean.length > 3) {
    const sing = clean.slice(0, -2) + 'm';
    if (dictKeys.has(sing)) return sing;
  }
  if (clean.endsWith('zes') && clean.length > 4) {
    const sing = clean.slice(0, -2);
    if (dictKeys.has(sing)) return sing;
  }
  if (clean.endsWith('eses') && clean.length > 4) {
    const sing = clean.slice(0, -4) + 'ês';
    if (dictKeys.has(sing)) return sing;
  }
  if (clean.endsWith('es') && clean.length > 3) {
    const sing = clean.slice(0, -2);
    if (dictKeys.has(sing)) return sing;
  }
  if (clean.endsWith('s') && clean.length > 2) {
    const sing = clean.slice(0, -1);
    if (dictKeys.has(sing)) return sing;
    // feminine plural → masculine singular
    if (sing.endsWith('a') && sing.length > 3) {
      const masc = sing.slice(0, -1) + 'o';
      if (dictKeys.has(masc)) return masc;
    }
  }
  return null;
}

// Check -mente adverbs
function checkAdverb(clean) {
  if (clean.endsWith('mente') && clean.length > 7) {
    const adj = clean.slice(0, -5);
    if (dictKeys.has(adj)) return adj;
    if (adj.endsWith('a')) {
      const masc = adj.slice(0, -1) + 'o';
      if (dictKeys.has(masc)) return masc;
    }
  }
  return null;
}

// Check spelling changes
function checkSpellingChange(clean) {
  if (clean.endsWith('guei') || clean.endsWith('gue') || clean.endsWith('guem')) {
    const stem2 = clean.replace(/guei$/, 'gar').replace(/gue$/, 'gar').replace(/guem$/, 'gar');
    if (dictKeys.has(stem2)) return stem2;
  }
  if (clean.endsWith('quei') || clean.endsWith('que') || clean.endsWith('quem')) {
    const stem2 = clean.replace(/quei$/, 'car').replace(/que$/, 'car').replace(/quem$/, 'car');
    if (dictKeys.has(stem2)) return stem2;
  }
  if (clean.endsWith('cei') && clean.length > 4) {
    const stem = clean.slice(0, -3);
    if (dictKeys.has(stem + 'çar')) return stem + 'çar';
  }
  return null;
}

// Now find truly missing words
const missing = [];
const resolved = [];

for (const [word, count] of words) {
  if (dictKeys.has(word)) continue;

  // Try verb reversal
  let found = reverseVerb(word);
  if (!found) found = checkPlural(word);
  if (!found) found = checkAdverb(word);
  if (!found) found = checkSpellingChange(word);

  if (found) {
    resolved.push({ word, count, via: found });
  } else {
    missing.push({ word, count });
  }
}

missing.sort((a, b) => b.count - a.count);

console.log('Total unique deck words:', words.size);
console.log('Direct dict matches:', [...words.keys()].filter(w => dictKeys.has(w)).length);
console.log('Resolved via lookup logic:', resolved.length);
console.log('Truly missing:', missing.length);
console.log('Truly missing 5+:', missing.filter(w => w.count >= 5).length);
console.log('Truly missing 2+:', missing.filter(w => w.count >= 2).length);
console.log('Truly missing 1:', missing.filter(w => w.count === 1).length);

console.log('\n=== TRULY MISSING HIGH (5+) ===');
missing.filter(w => w.count >= 5).forEach(w => console.log(`${w.word} (${w.count})`));

console.log('\n=== TRULY MISSING MEDIUM (2-4) ===');
missing.filter(w => w.count >= 2 && w.count < 5).forEach(w => console.log(`${w.word} (${w.count})`));

console.log('\n=== TRULY MISSING LOW (1) ===');
missing.filter(w => w.count === 1).forEach(w => console.log(`${w.word} (${w.count})`));
