const fs = require('fs');
const { lemmatize } = require('./english-lemmatizer.cjs');

// Load word sets from post-processor
const ppContent = fs.readFileSync(__dirname + '/post-process-google.cjs', 'utf8');

const VERBS = new Set();
const verbMatch = ppContent.match(/const KNOWN_ENGLISH_VERBS = new Set\(\[([\s\S]*?)\]\)/);
if (verbMatch) verbMatch[1].match(/'(\w+)'/g).forEach(m => VERBS.add(m.replace(/'/g, '')));

const NOUNS = new Set();
const nounMatch = ppContent.match(/const KNOWN_NOUNS = new Set\(\[([\s\S]*?)\]\)/);
if (nounMatch) nounMatch[1].match(/'(\w+)'/g).forEach(m => NOUNS.add(m.replace(/'/g, '')));

const ADJS = new Set();
const adjMatch = ppContent.match(/const KNOWN_ADJECTIVES = new Set\(\[([\s\S]*?)\]\)/);
if (adjMatch) adjMatch[1].match(/'(\w+)'/g).forEach(m => ADJS.add(m.replace(/'/g, '')));

// Also add from COMMON_ENGLISH
const ceMatch = ppContent.match(/const COMMON_ENGLISH = new Set\(\[([\s\S]*?)\]\)/);
if (ceMatch) ceMatch[1].match(/'(\w+)'/g).forEach(m => {
  const w = m.replace(/'/g, '');
  if (!VERBS.has(w) && !NOUNS.has(w)) ADJS.add(w); // treat as adj by default
});

// NOT_VERB_WORDS — things that should never get "to "
const NOT_VERBS = new Set();
const nvMatch = ppContent.match(/const NOT_VERB_WORDS = new Set\(\[([\s\S]*?)\]\)/);
if (nvMatch) nvMatch[1].match(/'(\w+)'/g).forEach(m => NOT_VERBS.add(m.replace(/'/g, '')));

console.log('Loaded: ' + VERBS.size + ' verbs, ' + NOUNS.size + ' nouns, ' + ADJS.size + ' adj/common');

function isEnglishVerb(word) {
  const w = word.toLowerCase();
  if (VERBS.has(w)) return true;
  const base = lemmatize(w, 'v');
  if (base !== w && VERBS.has(base)) return true;
  return false;
}

function isEnglishNoun(word) {
  return NOUNS.has(word.toLowerCase());
}

function isEnglishAdj(word) {
  return ADJS.has(word.toLowerCase());
}

function isNotVerb(word) {
  return NOT_VERBS.has(word.toLowerCase()) || isEnglishNoun(word) || isEnglishAdj(word);
}

const langs = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'tr', 'ru'];
// Skip hi (still building)

let grandTotal = 0;

for (const lang of langs) {
  const path = `src/data/dictionary/${lang}.ts`;
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  let fixed = 0;
  let toAdded = 0, toStripped = 0, posFixed = 0;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*['"][^'"]+['"]\s*:\s*\{.*?en:\s*['"])([^'"]*?)(['"].*?pos:\s*['"])(\w+)(['"].*)/);
    if (!m) continue;

    const prefix = m[1];
    let en = m[2];
    const mid = m[3];
    let pos = m[4];
    const suffix = m[5];

    const startsWithTo = en.startsWith('to ');
    const enCore = en.replace(/^to /, '').split(/[;,\/]/)[0].trim().toLowerCase();
    const firstWord = enCore.split(/\s+/)[0];

    let changed = false;

    // Rule 1: en starts with "to " — check if it's actually a verb
    if (startsWithTo) {
      if (isNotVerb(firstWord) && !isEnglishVerb(firstWord)) {
        // False "to " on a non-verb — strip it
        en = en.replace(/^to /, '');
        pos = isEnglishAdj(firstWord) ? 'adj' : 'n';
        toStripped++;
        changed = true;
      } else {
        // Legitimate verb — ensure pos='v'
        if (pos !== 'v') {
          pos = 'v';
          posFixed++;
          changed = true;
        }
      }
    }
    // Rule 2: en does NOT start with "to " — check if it should
    else {
      if (isEnglishVerb(firstWord) && !isNotVerb(firstWord) && !isEnglishNoun(firstWord) && !isEnglishAdj(firstWord)) {
        // It's a verb without "to " — add it
        en = 'to ' + en;
        pos = 'v';
        toAdded++;
        changed = true;
      } else {
        // Not a verb — fix POS if wrong
        if (pos === 'v' && !isEnglishVerb(firstWord)) {
          pos = isEnglishAdj(firstWord) ? 'adj' : 'n';
          posFixed++;
          changed = true;
        } else if (pos === 'n' && isEnglishAdj(firstWord) && !isEnglishNoun(firstWord)) {
          pos = 'adj';
          posFixed++;
          changed = true;
        }
      }
    }

    if (changed) {
      lines[i] = prefix + en + mid + pos + suffix;
      fixed++;
    }
  }

  if (fixed > 0) {
    fs.writeFileSync(path, lines.join('\n'));
    grandTotal += fixed;
    console.log(`${lang.toUpperCase()}: ${fixed} fixes (${toAdded} "to" added, ${toStripped} "to" stripped, ${posFixed} POS fixed)`);
  }
}

console.log(`\nTotal: ${grandTotal} fixes across ${langs.length} languages`);
