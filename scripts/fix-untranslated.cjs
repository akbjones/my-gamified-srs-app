#!/usr/bin/env node
/**
 * fix-untranslated.cjs
 *
 * Fixes dictionary entries where `en` is just the source-language word itself
 * (i.e. untranslated) by restoring real translations from older git versions
 * that had proper Wiktionary-sourced translations.
 *
 * Usage: node scripts/fix-untranslated.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Map of language -> old dictionary file path (pre-extracted from git)
const LANGUAGES = [
  { code: 'it', oldFile: '/tmp/old-it.ts' },
  { code: 'pt', oldFile: '/tmp/old-pt.ts' },
  { code: 'es', oldFile: '/tmp/old-es.ts' },
  { code: 'fr', oldFile: '/tmp/old-fr.ts' },
  { code: 'cy', oldFile: '/tmp/old-cy.ts' },
];

/**
 * Parse a dictionary .ts file and extract key -> { en, ipa, pos, lemma } map.
 * Handles both single-quoted and double-quoted keys and values.
 */
function parseDictionary(content) {
  const entries = new Map();

  // Match entries like:  'word': { en: 'translation', ... }
  // or:                  "word": { en: "translation", ... }
  // or:                  word: { en: 'translation', ... }  (unquoted keys)
  // The key can use single or double quotes, and the en value can too.
  const entryRegex = /(?:(['"])(.*?)\1|(\w[\w\u00C0-\u024F]*))\s*:\s*\{([^}]*)\}/g;
  let m;
  while ((m = entryRegex.exec(content))) {
    const key = m[2] || m[3]; // m[2] for quoted, m[3] for unquoted
    const body = m[4];

    // Extract en value - handle both en: 'val' and en: "val"
    const enMatch = body.match(/en:\s*(['"])((?:[^\\]|\\.)*?)\1/);
    if (!enMatch) continue;
    const en = enMatch[2];

    // Extract pos
    const posMatch = body.match(/pos:\s*['"]([^'"]*)['"]/);
    const pos = posMatch ? posMatch[1] : undefined;

    // Extract ipa
    const ipaMatch = body.match(/ipa:\s*['"]([^'"]*)['"]/);
    const ipa = ipaMatch ? ipaMatch[1] : undefined;

    // Extract lemma
    const lemmaMatch = body.match(/lemma:\s*['"]([^'"]*)['"]/);
    const lemma = lemmaMatch ? lemmaMatch[1] : undefined;

    entries.set(key, { en, ipa, pos, lemma });
  }

  return entries;
}

/**
 * Fix a single language's dictionary file.
 */
function fixLanguage(langCode, oldFilePath) {
  const currentPath = path.join(ROOT, 'src', 'data', 'dictionary', `${langCode}.ts`);

  if (!fs.existsSync(currentPath)) {
    console.log(`  SKIP: ${currentPath} not found`);
    return { fixed: 0, total: 0, untranslatedBefore: 0, untranslatedAfter: 0 };
  }
  if (!fs.existsSync(oldFilePath)) {
    console.log(`  SKIP: ${oldFilePath} not found`);
    return { fixed: 0, total: 0, untranslatedBefore: 0, untranslatedAfter: 0 };
  }

  const currentContent = fs.readFileSync(currentPath, 'utf8');
  const oldContent = fs.readFileSync(oldFilePath, 'utf8');

  // Parse old dictionary for lookup
  const oldDict = parseDictionary(oldContent);

  let fixCount = 0;
  let totalEntries = 0;
  let untranslatedBefore = 0;

  // Process the current file, replacing untranslated en values.
  // Handles both quoted and unquoted keys:
  //   'key': { en: 'key', ... }   or   key: { en: 'key', ... }
  const fixedContent = currentContent.replace(
    /(?:(['"])(.*?)\1|(\w[\w\u00C0-\u024F]*))(\s*:\s*\{\s*en:\s*)(['"])((?:[^\\]|\\.)*?)\5/g,
    (fullMatch, keyQuote, quotedKey, unquotedKey, middle, enQuote, enValue) => {
      const key = quotedKey || unquotedKey;
      const keyPrefix = keyQuote ? `${keyQuote}${key}${keyQuote}` : key;
      totalEntries++;

      // Check if this entry is untranslated (en === key)
      if (enValue !== key) {
        return fullMatch; // Already has a real translation
      }

      untranslatedBefore++;

      // Look up in old dictionary
      const oldEntry = oldDict.get(key);
      if (oldEntry && oldEntry.en && oldEntry.en !== key) {
        fixCount++;
        // Escape single quotes in the replacement value if needed
        const newEn = oldEntry.en.replace(/'/g, "\\'");
        return `${keyPrefix}${middle}'${newEn}'`;
      }

      // Also try lowercase lookup
      const oldEntryLower = oldDict.get(key.toLowerCase());
      if (oldEntryLower && oldEntryLower.en && oldEntryLower.en !== key && oldEntryLower.en !== key.toLowerCase()) {
        fixCount++;
        const newEn = oldEntryLower.en.replace(/'/g, "\\'");
        return `${keyPrefix}${middle}'${newEn}'`;
      }

      return fullMatch; // No old translation found
    }
  );

  // Now also fix pos values where the old dictionary has better data
  let posFixCount = 0;
  const finalContent = fixedContent.replace(
    /(?:(['"])(.*?)\1|(\w[\w\u00C0-\u024F]*))(\s*:\s*\{[^}]*pos:\s*')([^']*)(')/g,
    (fullMatch, keyQuote, quotedKey, unquotedKey, before, posValue, after) => {
      const key = quotedKey || unquotedKey;
      const keyPrefix = keyQuote ? `${keyQuote}${key}${keyQuote}` : key;
      if (posValue === 'character' || posValue === 'unknown' || posValue === '') {
        const oldEntry = oldDict.get(key);
        if (oldEntry && oldEntry.pos && oldEntry.pos !== 'character' && oldEntry.pos !== 'unknown' && oldEntry.pos !== '') {
          posFixCount++;
          return `${keyPrefix}${before}${oldEntry.pos}${after}`;
        }
      }
      return fullMatch;
    }
  );

  // Count remaining untranslated
  let untranslatedAfter = 0;
  const reCount = /(?:(['"])(.*?)\1|(\w[\w\u00C0-\u024F]*))\s*:\s*\{\s*en:\s*['"]([^'"]*)['"]/g;
  let mc;
  while ((mc = reCount.exec(finalContent))) {
    const k = mc[2] || mc[3];
    if (k === mc[4]) untranslatedAfter++;
  }

  fs.writeFileSync(currentPath, finalContent, 'utf8');

  return { fixed: fixCount, posFixed: posFixCount, total: totalEntries, untranslatedBefore, untranslatedAfter };
}

// Main
console.log('Fixing untranslated dictionary entries...\n');

const results = [];
for (const { code, oldFile } of LANGUAGES) {
  console.log(`Processing ${code.toUpperCase()}...`);
  const result = fixLanguage(code, oldFile);
  results.push({ code, ...result });
  console.log(`  Entries: ${result.total}`);
  console.log(`  Untranslated before: ${result.untranslatedBefore} (${(100 * result.untranslatedBefore / result.total).toFixed(1)}%)`);
  console.log(`  Fixed translations: ${result.fixed}`);
  if (result.posFixed) console.log(`  Fixed POS tags: ${result.posFixed}`);
  console.log(`  Untranslated after: ${result.untranslatedAfter} (${(100 * result.untranslatedAfter / result.total).toFixed(1)}%)`);
  console.log();
}

console.log('\n=== SUMMARY ===');
console.log('Lang | Before | Fixed | After');
console.log('-----|--------|-------|------');
for (const r of results) {
  const beforePct = (100 * r.untranslatedBefore / r.total).toFixed(1);
  const afterPct = (100 * r.untranslatedAfter / r.total).toFixed(1);
  console.log(`${r.code.toUpperCase()}   | ${r.untranslatedBefore} (${beforePct}%) | ${r.fixed} | ${r.untranslatedAfter} (${afterPct}%)`);
}
