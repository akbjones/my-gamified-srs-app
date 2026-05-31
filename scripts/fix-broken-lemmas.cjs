#!/usr/bin/env node
/**
 * Fix broken lemma references across 6 language dictionaries.
 * A lemma is "broken" if it references a key that doesn't exist in the dictionary.
 *
 * Strategy: For each entry with a broken lemma, either fix via normalization or remove the lemma field.
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['pt', 'de', 'nl', 'sv', 'tr', 'ru'];
const DICT_DIR = path.join(__dirname, '..', 'src', 'data', 'dictionary');

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
}

function processLanguage(lang) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Step 1: Extract all dictionary keys
  // Handle both quoted keys ('key': { en:) and unquoted keys (key: { en:)
  const keySet = new Set();
  const lines = content.split('\n');
  for (const line of lines) {
    // Quoted: 'key': { ... en: or "key": { ... en:
    let m = line.match(/^\s+['"]([^'"]+)['"]\s*:\s*\{/);
    if (m && line.includes('en:')) {
      keySet.add(m[1]);
      continue;
    }
    // Unquoted: key: { ... en:
    m = line.match(/^\s+([a-zA-ZÀ-ÿ\u0100-\u024F\u0400-\u04FF\u0900-\u097F][a-zA-ZÀ-ÿ\u0100-\u024F\u0400-\u04FF\u0900-\u097Fçğıöşü0-9_-]*)\s*:\s*\{/);
    if (m && line.includes('en:') && !line.match(/^\s*(const|export|import|\/\/|type|interface)\b/)) {
      keySet.add(m[1]);
    }
  }

  // Build normalized lookup: stripped+lowered -> actual key
  const normalizedMap = new Map();
  for (const key of keySet) {
    const norm = stripAccents(key).toLowerCase();
    if (!normalizedMap.has(norm)) {
      normalizedMap.set(norm, key);
    }
  }

  console.log(`\n=== ${lang.toUpperCase()} ===`);
  console.log(`  Dictionary keys: ${keySet.size}`);

  let brokenBefore = 0;
  let fixedByNorm = 0;
  let removed = 0;

  function findMatch(lemmaValue) {
    if (keySet.has(lemmaValue)) return lemmaValue;

    const stripped = stripAccents(lemmaValue);
    if (keySet.has(stripped)) return stripped;

    const normLemma = stripped.toLowerCase();
    if (normalizedMap.has(normLemma)) return normalizedMap.get(normLemma);

    // Try suffix swapping
    const suffixes = ['en', 'er', 'e', 's', 'n', 'a', 'ar', 'or', 'mak', 'mek', 'ть', 'ся', 'ный', 'ний', 'ий', 'ой'];
    for (const suffix of suffixes) {
      if (normLemma.endsWith(suffix) && normLemma.length > suffix.length + 2) {
        const stem = normLemma.slice(0, -suffix.length);
        if (normalizedMap.has(stem)) return normalizedMap.get(stem);
        for (const altSuffix of suffixes) {
          const candidate = stem + altSuffix;
          if (normalizedMap.has(candidate)) return normalizedMap.get(candidate);
        }
      }
    }

    return null;
  }

  // Step 2: Process line by line
  const newLines = [];

  for (const line of lines) {
    const lemmaMatch = line.match(/\blemma:\s*(['"])([^'"]*)\1/);
    if (!lemmaMatch) {
      newLines.push(line);
      continue;
    }

    const quote = lemmaMatch[1];
    const lemmaValue = lemmaMatch[2];

    if (keySet.has(lemmaValue)) {
      newLines.push(line);
      continue;
    }

    brokenBefore++;
    const match = findMatch(lemmaValue);

    if (match) {
      fixedByNorm++;
      const fixedLine = line.replace(
        /\blemma:\s*(['"])([^'"]*)\1/,
        `lemma: ${quote}${match}${quote}`
      );
      newLines.push(fixedLine);
    } else {
      removed++;
      // Remove ", lemma: 'value'" pattern (lemma is typically last field)
      let fixedLine = line.replace(/,\s*lemma:\s*['"][^'"]*['"]/, '');
      // Handle if lemma is before other fields: "lemma: 'x', "
      fixedLine = fixedLine.replace(/lemma:\s*['"][^'"]*['"]\s*,\s*/, '');
      newLines.push(fixedLine);
    }
  }

  const newContent = newLines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');

  console.log(`  Broken before: ${brokenBefore}`);
  console.log(`  Fixed by normalization: ${fixedByNorm}`);
  console.log(`  Removed (unfixable): ${removed}`);
  console.log(`  Remaining broken: ${brokenBefore - fixedByNorm - removed}`);

  return { lang, brokenBefore, fixedByNorm, removed };
}

console.log('Fixing broken lemma references...');
const results = [];
for (const lang of LANGUAGES) {
  results.push(processLanguage(lang));
}

console.log('\n\n=== SUMMARY ===');
console.log('Lang | Broken | Fixed | Removed');
console.log('-----|--------|-------|--------');
let totalBroken = 0, totalFixed = 0, totalRemoved = 0;
for (const r of results) {
  console.log(`${r.lang.toUpperCase().padEnd(4)} | ${String(r.brokenBefore).padStart(6)} | ${String(r.fixedByNorm).padStart(5)} | ${String(r.removed).padStart(7)}`);
  totalBroken += r.brokenBefore;
  totalFixed += r.fixedByNorm;
  totalRemoved += r.removed;
}
console.log('-----|--------|-------|--------');
console.log(`ALL  | ${String(totalBroken).padStart(6)} | ${String(totalFixed).padStart(5)} | ${String(totalRemoved).padStart(7)}`);
