#!/usr/bin/env node
/**
 * Fix wrong lemma fields in src/data/dictionary/sv.ts by cross-referencing
 * IRREGULARS in src/data/conjugation/sv.ts. Historical bulk lemma scripts
 * mis-tagged many entries (fick → lemma 'skaffa' should be 'få'; hjälpte
 * → 'hjälpt' should be 'hjälpa'; åkte → 'åkt' should be 'åka'; etc.)
 */
const fs = require('fs');
const path = require('path');

const DICT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'sv.ts');
const CONJ_PATH = path.resolve(__dirname, '..', 'src', 'data', 'conjugation', 'sv.ts');

const conjSrc = fs.readFileSync(CONJ_PATH, 'utf8');

// Parse IRREGULARS: 'infinitive': { present: 'x', past: 'y', supine: 'z', imperative: 'w' }
const IRREGULAR_ENTRY = /'([^']+)':\s*\{\s*present:\s*'([^']*)',\s*past:\s*'([^']*)',\s*supine:\s*'([^']*)',\s*imperative:\s*'([^']*)'/g;
const formToInf = new Map();  // form → infinitive
for (const m of conjSrc.matchAll(IRREGULAR_ENTRY)) {
  const [, inf, present, past, supine, imperative] = m;
  for (const f of [present, past, supine, imperative]) {
    if (f && f !== '-' && !formToInf.has(f)) formToInf.set(f, inf);
  }
}
console.log(`Built reverse map: ${formToInf.size} forms → infinitives`);

let dict = fs.readFileSync(DICT_PATH, 'utf8');
let fixed = 0, missingAdded = 0;
const REPORT = [];

// Entry pattern in dict: '<key>': { ... pos: 'v' ... lemma: 'X' ... },
// or without lemma: '<key>': { ... pos: 'v' ... },
const VERB_ENTRY = /^(\s*)'([^']+)':\s*\{([^}]*pos:\s*'v'[^}]*)\},?$/gm;

dict = dict.replace(VERB_ENTRY, (match, indent, key, body) => {
  const correctLemma = formToInf.get(key);
  if (!correctLemma) return match;  // not in IRREGULARS reverse map — skip

  // Extract existing lemma
  const lemmaMatch = body.match(/lemma:\s*'([^']*)'/);
  const existingLemma = lemmaMatch ? lemmaMatch[1] : null;

  if (existingLemma === correctLemma) return match;  // already correct

  if (key === correctLemma) return match;  // the key IS the infinitive (no lemma needed)

  if (existingLemma) {
    // Fix wrong lemma
    const newBody = body.replace(/lemma:\s*'[^']*'/, `lemma: '${correctLemma}'`);
    fixed++;
    REPORT.push(`  ${key}: '${existingLemma}' → '${correctLemma}'`);
    return `${indent}'${key}': {${newBody}},`;
  } else {
    // Add missing lemma before the closing brace
    const newBody = body.trimEnd().replace(/,?\s*$/, '') + `, lemma: '${correctLemma}'`;
    missingAdded++;
    REPORT.push(`  ${key}: (missing) → '${correctLemma}'`);
    return `${indent}'${key}': {${newBody} },`;
  }
});

// Second pass: regular verbs where lemma is a supine (-t/-tt) rather than
// infinitive. Fix by replacing the trailing t with `a` if that produces a
// known dict entry — e.g. lemma:'köpt' → 'köpa' (köpa is a real verb).
const VERB_KEYS = new Set();
for (const m of dict.matchAll(/^\s*'([^']+)':\s*\{[^}]*pos:\s*'v'/gm)) VERB_KEYS.add(m[1]);

let regFixed = 0;
dict = dict.replace(/^(\s*)'([^']+)':\s*\{([^}]*pos:\s*'v'[^}]*)\},?$/gm, (match, indent, key, body) => {
  const lemmaMatch = body.match(/lemma:\s*'([^']+)'/);
  if (!lemmaMatch) return match;
  const lemma = lemmaMatch[1];
  if (key === lemma || VERB_KEYS.has(lemma)) {
    // lemma is a valid key already — leave it unless it's a supine
    if (!/t$/.test(lemma)) return match;
  }
  if (!/t$/.test(lemma) && !/tt$/.test(lemma)) return match;
  // Try replacing final 't' with 'a' — most Group 2 regulars work this way
  const cand1 = lemma.replace(/tt$/, '') + 'a';
  const cand2 = lemma.replace(/t$/, '') + 'a';
  const better = VERB_KEYS.has(cand1) ? cand1 : (VERB_KEYS.has(cand2) ? cand2 : null);
  if (better && better !== lemma) {
    const newBody = body.replace(/lemma:\s*'[^']+'/, `lemma: '${better}'`);
    regFixed++;
    REPORT.push(`  ${key}: '${lemma}' → '${better}' (regular)`);
    return `${indent}'${key}': {${newBody}},`;
  }
  return match;
});

fs.writeFileSync(DICT_PATH, dict);
console.log(`\nFixed ${fixed} irregular, ${regFixed} regular, added ${missingAdded} missing lemmas.`);
if (REPORT.length) {
  console.log('\nChanges:');
  for (const r of REPORT.slice(0, 60)) console.log(r);
  if (REPORT.length > 60) console.log(`  ... ${REPORT.length - 60} more`);
}
