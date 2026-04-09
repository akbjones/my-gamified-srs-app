#!/usr/bin/env node
/**
 * sync-verb-pos.cjs
 *
 * Cross-references conjugation engine data (IRREGULARS, IRR, STEM_CHANGERS,
 * ISCO_VERBS, IRR_PARTICIPLES, ETRE_VERBS, CONTRACTED, SPELLING_CHANGERS)
 * and dictionary IRREGULAR_MAP data with dictionary entries to fix all verb
 * POS misassignments.
 *
 * For every verb infinitive found in conjugation data:
 *  - If dictionary entry exists: ensure pos='v', en starts with 'to ', add lemma if missing
 *  - If no dictionary entry: create one with pos='v', en='to [infinitive]', lemma
 *
 * Also checks entries that already have lemma fields pointing to verb infinitives.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const CONJ_DIR = path.join(BASE, 'src/data/conjugation');
const DICT_DIR = path.join(BASE, 'src/data/dictionary');

// ── Language configurations ────────────────────────────────────
const LANGUAGES = [
  { code: 'es', conjVar: 'IRREGULARS', dictVar: 'dictionary', extraMaps: ['STEM_CHANGERS', 'SPELLING_CHANGERS'] },
  { code: 'it', conjVar: 'IRR', dictVar: 'dictionary', extraMaps: ['ISCO_VERBS', 'CONTRACTED'] },
  { code: 'fr', conjVar: 'IRR', dictVar: 'dictionary', extraMaps: ['IRR_PARTICIPLES', 'ETRE_VERBS'] },
  { code: 'pt', conjVar: 'IRREGULARS', dictVar: 'dictionary', extraMaps: ['STEM_CHANGERS'], hasIrregularMap: true },
  { code: 'de', conjVar: 'IRREGULARS', dictVar: 'DICT', hasIrregularMap: true },
  { code: 'nl', conjVar: 'IRREGULARS', dictVar: 'dictionary', hasIrregularMap: true },
  { code: 'sv', conjVar: 'IRREGULARS', dictVar: 'dictionary', hasIrregularMap: true },
  { code: 'cy', conjVar: 'IRREGULARS', dictVar: 'dict' },
  { code: 'hi', conjVar: 'IRREGULARS', dictVar: 'dictionary' },
  { code: 'tr', conjVar: 'IRREGULARS', dictVar: 'dictionary' },
  { code: 'ru', conjVar: 'IRREGULARS', dictVar: 'dictionary' },
];

// ── Parsers ────────────────────────────────────────────────────

/**
 * Extract keys from a Record<string, ...> = { ... } block.
 * Works for IRREGULARS, IRR, STEM_CHANGERS, SPELLING_CHANGERS, CONTRACTED, IRR_PARTICIPLES.
 */
function extractRecordKeys(source, varName) {
  // Find the start of the variable declaration
  // Handle both `const X: Record<...> = {` and `const X = {`
  const patterns = [
    new RegExp(`const\\s+${varName}\\s*(?::\\s*Record<[^>]+>)?\\s*=\\s*\\{`, 'g'),
  ];

  let startIdx = -1;
  for (const pat of patterns) {
    const m = pat.exec(source);
    if (m) {
      startIdx = m.index + m[0].length;
      break;
    }
  }
  if (startIdx === -1) return [];

  // Find matching closing brace
  let depth = 1;
  let i = startIdx;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  const block = source.slice(startIdx, i - 1);

  // Extract top-level keys
  // Keys can be: bare identifiers, or 'quoted strings', or "quoted strings"
  const keys = [];
  // Match keys at the start of object entries (after newlines or commas)
  // Handle: `  key: {`, `  'key': {`, `  "key": {`, `  'key': f(...)`
  const keyRegex = /(?:^|[,\n])\s*(?:'([^']+)'|"([^"]+)"|(\w[\w\u00C0-\u024F\u0900-\u097F\u0400-\u04FF\u00E0-\u00FF]*(?:[\u0900-\u097F\u0400-\u04FF\u00C0-\u024F\u00E0-\u00FF\w]*)))\s*:/g;
  let m;
  while ((m = keyRegex.exec(block)) !== null) {
    const key = m[1] || m[2] || m[3];
    if (key) keys.push(key);
  }

  return [...new Set(keys)];
}

/**
 * Extract keys from a Record<string, ...> = { ... } block where
 * keys map to string values (like IRREGULAR_MAP, IRR_PARTICIPLES).
 * Returns unique values (the infinitives).
 */
function extractRecordValues(source, varName) {
  const patterns = [
    new RegExp(`const\\s+${varName}\\s*(?::\\s*Record<[^>]+>)?\\s*=\\s*\\{`, 'g'),
  ];

  let startIdx = -1;
  for (const pat of patterns) {
    const m = pat.exec(source);
    if (m) {
      startIdx = m.index + m[0].length;
      break;
    }
  }
  if (startIdx === -1) return [];

  let depth = 1;
  let i = startIdx;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  const block = source.slice(startIdx, i - 1);

  const values = new Set();
  // Match: 'key': 'value', "key": "value", or bareKey: 'value'
  const valRegex = /(?:['"][^'"]+['"]|\w[\w\u00C0-\u024F\u00E0-\u00FF]*)\s*:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = valRegex.exec(block)) !== null) {
    values.add(m[1]);
  }
  return [...values];
}

/**
 * Extract members from a Set([...]) declaration.
 * Works for ISCO_VERBS, ETRE_VERBS.
 */
function extractSetMembers(source, varName) {
  const pattern = new RegExp(`const\\s+${varName}\\s*=\\s*new\\s+Set\\(\\[([^\\]]+)\\]\\)`, 's');
  const m = pattern.exec(source);
  if (!m) return [];

  const members = [];
  const memberRegex = /['"]([^'"]+)['"]/g;
  let mm;
  while ((mm = memberRegex.exec(m[1])) !== null) {
    members.push(mm[1]);
  }
  return members;
}

/**
 * Parse dictionary entries from a TypeScript file.
 * Returns a Map of key -> { en, ipa, pos, lemma, lineStart, lineEnd, raw }
 */
function parseDictionary(source, varName) {
  // Find the dictionary variable
  const patterns = [
    new RegExp(`(?:export\\s+)?const\\s+${varName}\\s*(?::\\s*Record<[^>]+>)?\\s*=\\s*\\{`, 'g'),
  ];

  let startIdx = -1;
  let matchEnd = -1;
  for (const pat of patterns) {
    const m = pat.exec(source);
    if (m) {
      startIdx = m.index;
      matchEnd = m.index + m[0].length;
      break;
    }
  }
  if (startIdx === -1) return { entries: new Map(), dictStart: -1, dictEnd: -1, dictBodyStart: -1 };

  // Find matching closing brace
  let depth = 1;
  let i = matchEnd;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  const dictEnd = i; // position after closing };
  const block = source.slice(matchEnd, i - 1);

  const entries = new Map();

  // Parse entries line by line for more accuracy
  const lines = source.slice(startIdx, dictEnd).split('\n');
  let lineOffset = source.slice(0, startIdx).split('\n').length - 1;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    // Match dictionary entry pattern:  'key': { en: '...', ipa: '...', pos: '...', lemma: '...' },
    const entryMatch = line.match(/^\s*(?:'([^']*)'|"([^"]*)")\s*:\s*\{(.+?)\}\s*,?\s*$/);
    if (!entryMatch) continue;

    const key = entryMatch[1] !== undefined ? entryMatch[1] : entryMatch[2];
    const propsStr = entryMatch[3];

    const enMatch = propsStr.match(/en:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    const ipaMatch = propsStr.match(/ipa:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    const posMatch = propsStr.match(/pos:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    const lemmaMatch = propsStr.match(/lemma:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);

    entries.set(key, {
      en: enMatch ? (enMatch[1] !== undefined ? enMatch[1] : enMatch[2]) : '',
      ipa: ipaMatch ? (ipaMatch[1] !== undefined ? ipaMatch[1] : ipaMatch[2]) : '',
      pos: posMatch ? (posMatch[1] !== undefined ? posMatch[1] : posMatch[2]) : undefined,
      lemma: lemmaMatch ? (lemmaMatch[1] !== undefined ? lemmaMatch[1] : lemmaMatch[2]) : undefined,
      lineNum: lineOffset + li,
      rawLine: line,
    });
  }

  return { entries, dictStart: startIdx, dictEnd, dictBodyStart: matchEnd };
}

/**
 * Rebuild a dictionary entry line from its properties.
 */
function buildEntryLine(key, entry, indent = '  ') {
  // Quote key: use double quotes if key has apostrophe, single quotes otherwise
  const quotedKey = key.includes("'") ? `"${key}"` : `'${key}'`;
  let props = `en: '${escapeQuotes(entry.en)}', ipa: '${escapeQuotes(entry.ipa)}'`;
  if (entry.pos) props += `, pos: '${entry.pos}'`;
  if (entry.lemma) props += `, lemma: '${escapeQuotes(entry.lemma)}'`;
  return `${indent}${quotedKey}: { ${props} },`;
}

function escapeQuotes(s) {
  if (!s) return '';
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Check if an English translation is a verb form (starts with "to ").
 */
function hasToPrefix(en) {
  return en.startsWith('to ');
}

/**
 * Add "to " prefix to an English translation, avoiding duplicates.
 */
function addToPrefix(en) {
  if (!en || hasToPrefix(en)) return en;
  // Don't add "to " to things like "?", empty, or clearly non-verb translations
  if (en === '?' || en === '') return en;
  return 'to ' + en;
}

// ── Main Processing ────────────────────────────────────────────

const results = {};

for (const lang of LANGUAGES) {
  const { code, conjVar, dictVar, extraMaps, hasIrregularMap } = lang;

  console.log(`\n=== Processing ${code.toUpperCase()} ===`);

  // Read conjugation file
  const conjPath = path.join(CONJ_DIR, `${code}.ts`);
  const conjSource = fs.readFileSync(conjPath, 'utf-8');

  // Read dictionary file
  const dictPath = path.join(DICT_DIR, `${code}.ts`);
  let dictSource = fs.readFileSync(dictPath, 'utf-8');

  // ── Step 1: Collect all verb infinitives from conjugation data ──
  const verbInfinitives = new Set();

  // Main IRREGULARS/IRR map
  const conjKeys = extractRecordKeys(conjSource, conjVar);
  for (const k of conjKeys) verbInfinitives.add(k);
  console.log(`  ${conjVar}: ${conjKeys.length} verbs`);

  // Extra maps from conjugation file
  if (extraMaps) {
    for (const mapName of extraMaps) {
      if (mapName === 'ISCO_VERBS' || mapName === 'ETRE_VERBS') {
        const members = extractSetMembers(conjSource, mapName);
        for (const m of members) verbInfinitives.add(m);
        console.log(`  ${mapName}: ${members.length} verbs`);
      } else if (mapName === 'IRR_PARTICIPLES') {
        const keys = extractRecordKeys(conjSource, mapName);
        for (const k of keys) verbInfinitives.add(k);
        console.log(`  ${mapName}: ${keys.length} verbs`);
      } else if (mapName === 'CONTRACTED') {
        const keys = extractRecordKeys(conjSource, mapName);
        for (const k of keys) verbInfinitives.add(k);
        console.log(`  ${mapName}: ${keys.length} verbs`);
      } else {
        // STEM_CHANGERS, SPELLING_CHANGERS
        const keys = extractRecordKeys(conjSource, mapName);
        for (const k of keys) verbInfinitives.add(k);
        console.log(`  ${mapName}: ${keys.length} verbs`);
      }
    }
  }

  // IRREGULAR_MAP from dictionary file (form → infinitive)
  if (hasIrregularMap) {
    const irrMapValues = extractRecordValues(dictSource, 'IRREGULAR_MAP');
    for (const v of irrMapValues) verbInfinitives.add(v);
    console.log(`  IRREGULAR_MAP values: ${irrMapValues.length} unique infinitives`);

    // Also collect all IRREGULAR_MAP keys (conjugated forms) — these need lemma
    const irrMapKeys = extractRecordKeys(dictSource, 'IRREGULAR_MAP');
    // We'll handle these separately below
  }

  console.log(`  Total verb infinitives: ${verbInfinitives.size}`);

  // ── Step 2: Parse dictionary entries ──
  const { entries, dictStart, dictEnd, dictBodyStart } = parseDictionary(dictSource, dictVar);
  console.log(`  Dictionary entries: ${entries.size}`);

  // ── Step 3: Build IRREGULAR_MAP lookup (form → infinitive) ──
  const formToInfinitive = new Map();
  if (hasIrregularMap) {
    // Parse IRREGULAR_MAP to get form→infinitive mappings
    const irrMapPattern = /const\s+IRREGULAR_MAP\s*(?::\s*Record<[^>]+>)?\s*=\s*\{/g;
    const irrMatch = irrMapPattern.exec(dictSource);
    if (irrMatch) {
      const irrStart = irrMatch.index + irrMatch[0].length;
      let depth = 1, idx = irrStart;
      while (idx < dictSource.length && depth > 0) {
        if (dictSource[idx] === '{') depth++;
        else if (dictSource[idx] === '}') depth--;
        idx++;
      }
      const irrBlock = dictSource.slice(irrStart, idx - 1);
      // Match both quoted and bare keys → quoted values
      const pairRegex = /(?:'([^']+)'|"([^"]+)"|([\w\u00C0-\u024F\u00E0-\u00FF]+))\s*:\s*['"]([^'"]+)['"]/g;
      let pm;
      while ((pm = pairRegex.exec(irrBlock)) !== null) {
        const form = pm[1] || pm[2] || pm[3];
        const inf = pm[4];
        if (form && inf) formToInfinitive.set(form, inf);
      }
    }
    console.log(`  IRREGULAR_MAP form→inf pairs: ${formToInfinitive.size}`);
  }

  // ── Step 4: Fix/create dictionary entries ──
  let fixedCount = 0;
  let createdCount = 0;
  const newEntries = [];
  const modifications = []; // { lineNum, oldLine, newLine }

  // 4a: Process verb infinitives
  for (const inf of verbInfinitives) {
    const entry = entries.get(inf);
    if (entry) {
      let changed = false;
      const updated = { ...entry };

      // Fix pos
      if (entry.pos !== 'v') {
        updated.pos = 'v';
        changed = true;
      }

      // Fix "to " prefix
      if (!hasToPrefix(entry.en) && entry.en !== '?' && entry.en !== '') {
        updated.en = addToPrefix(entry.en);
        changed = true;
      }

      // These ARE infinitives, so they shouldn't need a lemma pointing elsewhere
      // (they are their own lemma). But if they have one that's wrong, leave it.

      if (changed) {
        fixedCount++;
        modifications.push({
          lineNum: entry.lineNum,
          oldLine: entry.rawLine,
          newLine: buildEntryLine(inf, updated),
        });
        // Update in-memory
        entries.set(inf, { ...updated, lineNum: entry.lineNum, rawLine: buildEntryLine(inf, updated) });
      }
    } else {
      // No dictionary entry — create one
      // We need to figure out the English translation
      // For now, we use the infinitive itself as placeholder
      createdCount++;
      const newEntry = {
        en: `to ${inf}`,
        ipa: '',
        pos: 'v',
      };
      newEntries.push({ key: inf, entry: newEntry });
    }
  }

  // 4b: Process IRREGULAR_MAP keys (conjugated forms in dictionary)
  // These are forms that should have pos='v' and lemma pointing to infinitive
  for (const [form, inf] of formToInfinitive) {
    const entry = entries.get(form);
    if (entry) {
      let changed = false;
      const updated = { ...entry };

      // Fix pos
      if (entry.pos !== 'v') {
        updated.pos = 'v';
        changed = true;
      }

      // Fix "to " prefix on English
      if (!hasToPrefix(entry.en) && entry.en !== '?' && entry.en !== '') {
        updated.en = addToPrefix(entry.en);
        changed = true;
      }

      // Fix lemma (don't add self-referencing lemma for infinitives)
      if (!entry.lemma && form !== inf) {
        updated.lemma = inf;
        changed = true;
      }

      if (changed) {
        fixedCount++;
        modifications.push({
          lineNum: entry.lineNum,
          oldLine: entry.rawLine,
          newLine: buildEntryLine(form, updated),
        });
        entries.set(form, { ...updated, lineNum: entry.lineNum, rawLine: buildEntryLine(form, updated) });
      }
    }
    // Don't create entries for conjugated forms that aren't in the dictionary
  }

  // 4c: Process entries that already have pos='v' AND lemma pointing to known verb infinitives
  // Only fix "to " prefix — do NOT change pos for entries with wrong lemma assignments
  for (const [key, entry] of entries) {
    if (entry.pos === 'v' && entry.lemma && verbInfinitives.has(entry.lemma)) {
      let changed = false;
      const updated = { ...entry };

      if (!hasToPrefix(entry.en) && entry.en !== '?' && entry.en !== '') {
        updated.en = addToPrefix(entry.en);
        changed = true;
      }

      if (changed) {
        // Check we haven't already modified this line
        const alreadyModified = modifications.some(m => m.lineNum === entry.lineNum);
        if (!alreadyModified) {
          fixedCount++;
          modifications.push({
            lineNum: entry.lineNum,
            oldLine: entry.rawLine,
            newLine: buildEntryLine(key, updated),
          });
        }
      }
    }
  }

  // ── Step 5: Apply modifications to source ──
  if (modifications.length > 0 || newEntries.length > 0) {
    const lines = dictSource.split('\n');

    // Apply line modifications
    for (const mod of modifications) {
      if (mod.lineNum >= 0 && mod.lineNum < lines.length) {
        lines[mod.lineNum] = mod.newLine;
      }
    }

    // Insert new entries before the closing }; of the dictionary
    if (newEntries.length > 0) {
      // Find the line with the dictionary's closing };
      // We need to find the closing brace of the dictionary object
      const dictEndLine = dictSource.slice(0, dictEnd).split('\n').length - 1;

      // Sort new entries alphabetically
      newEntries.sort((a, b) => a.key.localeCompare(b.key));

      const newLines = newEntries.map(e => buildEntryLine(e.key, e.entry));

      // Insert before the closing line
      lines.splice(dictEndLine, 0, ...newLines);
    }

    dictSource = lines.join('\n');
    fs.writeFileSync(dictPath, dictSource, 'utf-8');
  }

  console.log(`  Fixed: ${fixedCount}, Created: ${createdCount}`);
  results[code] = { fixed: fixedCount, created: createdCount };
}

// ── Summary ────────────────────────────────────────────────────
console.log('\n' + '='.repeat(50));
console.log('SUMMARY');
console.log('='.repeat(50));
console.log(`${'Lang'.padEnd(6)} ${'Fixed'.padStart(8)} ${'Created'.padStart(8)} ${'Total'.padStart(8)}`);
console.log('-'.repeat(32));
let totalFixed = 0, totalCreated = 0;
for (const [code, { fixed, created }] of Object.entries(results)) {
  console.log(`${code.toUpperCase().padEnd(6)} ${String(fixed).padStart(8)} ${String(created).padStart(8)} ${String(fixed + created).padStart(8)}`);
  totalFixed += fixed;
  totalCreated += created;
}
console.log('-'.repeat(32));
console.log(`${'TOTAL'.padEnd(6)} ${String(totalFixed).padStart(8)} ${String(totalCreated).padStart(8)} ${String(totalFixed + totalCreated).padStart(8)}`);
