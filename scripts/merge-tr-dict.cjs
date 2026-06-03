#!/usr/bin/env node
/**
 * merge-tr-dict.cjs
 * Merges word-level alignment translations with existing Wiktionary metadata
 * to produce the final Turkish dictionary entries.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALIGNED_PATH = path.join(ROOT, 'scripts/output/tr-aligned-dictionary.json');
const TRTS_PATH = path.join(ROOT, 'src/data/dictionary/tr.ts');
const OUTPUT_PATH = path.join(ROOT, 'scripts/output/tr-dict-entries.ts');

// ── 1. Read aligned dictionary ──────────────────────────────────
const aligned = JSON.parse(fs.readFileSync(ALIGNED_PATH, 'utf8'));

// ── 2. Parse existing tr.ts dictionary entries ──────────────────
const trTsContent = fs.readFileSync(TRTS_PATH, 'utf8');

// Extract the dictionary object block (between first { and matching };)
const dictStart = trTsContent.indexOf('= {');
const dictEnd = trTsContent.indexOf('\n};', dictStart);
const dictBlock = trTsContent.slice(dictStart + 3, dictEnd);

// Parse each entry line
const existingDict = {};
const entryRegex = /^\s+'([^']+)':\s*\{(.+?)\}\s*,?\s*$/gm;
let match;
while ((match = entryRegex.exec(dictBlock)) !== null) {
  const key = match[1];
  const propsStr = match[2];

  const entry = {};

  // Extract en
  const enMatch = propsStr.match(/en:\s*'((?:[^'\\]|\\.)*)'/);
  if (enMatch) entry.en = enMatch[1].replace(/\\'/g, "'");

  // Extract ipa
  const ipaMatch = propsStr.match(/ipa:\s*'((?:[^'\\]|\\.)*)'/);
  if (ipaMatch) entry.ipa = ipaMatch[1].replace(/\\'/g, "'");

  // Extract pos
  const posMatch = propsStr.match(/pos:\s*'([^']*)'/);
  if (posMatch) entry.pos = posMatch[1];

  // Extract lemma
  const lemmaMatch = propsStr.match(/lemma:\s*'((?:[^'\\]|\\.)*)'/);
  if (lemmaMatch) entry.lemma = lemmaMatch[1].replace(/\\'/g, "'");

  existingDict[key] = entry;
}

console.log(`Parsed ${Object.keys(existingDict).length} entries from tr.ts`);
console.log(`Aligned dictionary has ${Object.keys(aligned).length} entries`);

// ── 3. Merge ────────────────────────────────────────────────────
const merged = {};
let updatedCount = 0;
let keptOldCount = 0;
const changes = []; // track old→new for reporting

// Helper: build combined meaning string
function buildMeaning(alignedEntry, pos) {
  const meanings = alignedEntry.meanings || [];
  let primary = meanings[0]?.en || alignedEntry.en;

  // Check if 2nd meaning is significant
  if (meanings.length > 1 && meanings[1].count >= 2) {
    const secondary = meanings[1].en;
    // Don't add if secondary is just a longer version of primary
    if (!secondary.includes(primary) && !primary.includes(secondary)) {
      const combined = `${primary}; ${secondary}`;
      if (combined.length <= 40) {
        primary = combined;
      }
    }
  }

  // Ensure verbs start with "to "
  if (pos === 'v' && !primary.startsWith('to ')) {
    const withTo = `to ${primary}`;
    if (withTo.length <= 40) {
      primary = withTo;
    }
  }

  // Cap at 40 chars
  if (primary.length > 40) {
    primary = primary.slice(0, 37) + '...';
  }

  return primary;
}

// Process all words from aligned dictionary (these are the deck words)
for (const [word, alignedEntry] of Object.entries(aligned)) {
  const existing = existingDict[word];
  const pos = existing?.pos || '';
  const newEn = buildMeaning(alignedEntry, pos);

  if (existing) {
    const oldEn = existing.en;
    merged[word] = {
      en: newEn,
      ipa: existing.ipa || '?',
      pos: existing.pos || '',
    };
    if (existing.lemma) merged[word].lemma = existing.lemma;

    if (oldEn !== newEn) {
      updatedCount++;
      changes.push({ word, old: oldEn, new: newEn });
    } else {
      keptOldCount++;
    }
  } else {
    // Word in aligned but not in existing dict – add with minimal info
    merged[word] = {
      en: newEn,
      ipa: '?',
      pos: '',
    };
    updatedCount++;
    changes.push({ word, old: '(not in dict)', new: newEn });
  }
}

// Also keep words from existing dict that aren't in aligned dict
for (const [word, entry] of Object.entries(existingDict)) {
  if (!merged[word]) {
    merged[word] = { ...entry };
    keptOldCount++;
  }
}

// ── 4. Sort and output ──────────────────────────────────────────
const sortedKeys = Object.keys(merged).sort((a, b) =>
  a.localeCompare(b, 'tr', { sensitivity: 'base' })
);

// Helper: escape single quotes in a value
function esc(s) {
  return (s || '').replace(/'/g, "\\'");
}

// Build output lines
const lines = [];
for (const key of sortedKeys) {
  const e = merged[key];
  let props = `en: '${esc(e.en)}', ipa: '${esc(e.ipa)}', pos: '${e.pos}'`;
  if (e.lemma) {
    props += `, lemma: '${esc(e.lemma)}'`;
  }
  lines.push(`  '${esc(key)}': { ${props} },`);
}

const output = lines.join('\n') + '\n';
fs.writeFileSync(OUTPUT_PATH, output, 'utf8');

// ── 5. Report ───────────────────────────────────────────────────
const ipaGaps = sortedKeys.filter(k => merged[k].ipa === '?' || merged[k].ipa === '').length;

console.log(`\n=== MERGE REPORT ===`);
console.log(`Total entries in final dictionary: ${sortedKeys.length}`);
console.log(`Updated translations from alignments: ${updatedCount}`);
console.log(`Kept old Wiktionary translations: ${keptOldCount}`);
console.log(`IPA gaps (ipa === '?'): ${ipaGaps}`);

console.log(`\n=== SAMPLE CHANGES (first 10) ===`);
// Show most interesting changes (skip trivial ones)
const interestingChanges = changes
  .filter(c => c.old !== '(not in dict)' && c.old !== c.new)
  .slice(0, 10);

for (const c of interestingChanges) {
  console.log(`  ${c.word}:`);
  console.log(`    OLD: "${c.old}"`);
  console.log(`    NEW: "${c.new}"`);
}

console.log(`\nOutput written to: ${OUTPUT_PATH}`);
