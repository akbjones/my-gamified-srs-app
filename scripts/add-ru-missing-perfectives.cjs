#!/usr/bin/env node
/**
 * Add the perfective infinitives from the aspect-pair map that aren't yet
 * in src/data/dictionary/ru.ts. For each missing key:
 *
 *   - Look up its pair (the impf partner) in the dict.
 *   - Copy the impf entry's English meaning, prefixing with "completed: " so
 *     the user sees that this is the pf side. (e.g. impf "to read" →
 *     pf "completed: to read").
 *   - Leave IPA blank (we don't have IPA data for these).
 *   - Set pos, aspect, pair, note from the map.
 *
 * Inserted in Cyrillic alphabetical position relative to existing keys.
 *
 *   --dry-run    preview without writing
 *   (default)    apply
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DICT = path.join(ROOT, 'src/data/dictionary/ru.ts');
const MAP_PATH = path.join(__dirname, 'ru-aspect-pairs.json');
const DRY = process.argv.includes('--dry-run');

const pairMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
const src = fs.readFileSync(DICT, 'utf8');

const entryRe = /^(\s*)(['"])([^'"]+?)\2\s*:\s*\{([^}]*)\}/gm;
function parseEntries(text) {
  const entries = [];
  let m;
  while ((m = entryRe.exec(text)) !== null) {
    entries.push({
      start: m.index,
      end: m.index + m[0].length,
      lineEnd: text.indexOf('\n', m.index + m[0].length),
      key: m[3],
      body: m[4],
    });
  }
  return entries;
}
const getEn = b => (b.match(/en\s*:\s*['"]([^'"]*)['"]/) || ['', ''])[1];

const entries = parseEntries(src);
const byKey = new Map(entries.map(e => [e.key, e]));

const missing = [];
for (const [key, data] of Object.entries(pairMap)) {
  if (key.startsWith('_')) continue;
  if (byKey.has(key)) continue;
  // Find pair (impf partner) so we can copy its English meaning
  if (!data.pair) {
    // bi-aspectual entries with no pair — skip (can't derive meaning)
    continue;
  }
  const partner = byKey.get(data.pair);
  if (!partner) {
    // partner also not in dict — skip (rare)
    continue;
  }
  const partnerEn = getEn(partner.body);
  if (!partnerEn) {
    continue;
  }
  // Strip leading "to " for a tighter "completed: X" label
  const baseEn = partnerEn.replace(/^to\s+/i, '');
  const newEn = `completed: ${baseEn}`;
  missing.push({ key, data, newEn });
}

// Build new entry line text
function buildLine(key, data, newEn) {
  const fields = [
    `en: '${newEn.replace(/'/g, "\\'")}'`,
    `ipa: ''`,
    `pos: 'v'`,
    `aspect: '${data.aspect}'`,
  ];
  if (data.pair) fields.push(`pair: '${data.pair}'`);
  if (data.note) fields.push(`note: '${data.note.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);
  return `  '${key}': { ${fields.join(', ')} },`;
}

// Cyrillic-aware sort: find correct insertion line for each missing key
const cmp = (a, b) => a.localeCompare(b, 'ru');

console.log('═══════════════════════════════════════════════════════════════');
console.log(`ADD MISSING RU PERFECTIVES  ·  ${DRY ? '[DRY RUN]' : '[APPLYING]'}`);
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Map entries:           ${Object.keys(pairMap).filter(k => !k.startsWith('_')).length}`);
console.log(`Dict entries:          ${entries.length}`);
console.log(`Missing perfectives:   ${missing.length}`);

if (missing.length > 0) {
  console.log(`\nSample (first 8):`);
  for (const { key, newEn, data } of missing.slice(0, 8)) {
    console.log(`  '${key}': { en: '${newEn.slice(0, 40)}', aspect: '${data.aspect}', pair: '${data.pair}' }`);
  }
}

if (DRY) {
  console.log('\nDRY RUN — no writes.');
  process.exit(0);
}

// Apply. Iterate over missing entries; for each, find the right insertion point.
let newSrc = src;
// Re-parse after each insertion would be O(n²). Cheaper: collect all
// insertions first with their target offsets from the ORIGINAL source,
// then apply right-to-left.
const insertions = [];
for (const { key, data, newEn } of missing) {
  // Find the first existing entry whose key sorts AFTER ours; insert before it.
  let insertAfter = null;
  for (const e of entries) {
    if (cmp(e.key, key) > 0) break;
    insertAfter = e;
  }
  if (!insertAfter) {
    // No earlier entry — insert at very top of dictionary block (after the opening line)
    // For safety, fall back to inserting after the first entry.
    insertAfter = entries[0];
  }
  const line = buildLine(key, data, newEn);
  insertions.push({ atOffset: insertAfter.lineEnd + 1, text: line + '\n' });
}

// Sort right-to-left
insertions.sort((a, b) => b.atOffset - a.atOffset);
for (const ins of insertions) {
  newSrc = newSrc.slice(0, ins.atOffset) + ins.text + newSrc.slice(ins.atOffset);
}

fs.writeFileSync(DICT, newSrc);
console.log('\nWritten.');
