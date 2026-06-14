#!/usr/bin/env node
/**
 * Apply the curated Russian aspect-pair map to src/data/dictionary/ru.ts.
 *
 *   --dry-run   Print what would change without writing.
 *   (default)   Write changes in place.
 *
 * Safety:
 *   - Only touches entries that already exist in the dict AND already have
 *     pos: 'v'. Won't add aspect/pair fields to a non-verb entry.
 *   - Won't overwrite an aspect/pair/note field that's already set (so
 *     re-running is idempotent and any manual edits are preserved).
 *   - Skips entries with pos: 'v' but whose key doesn't appear in the
 *     pair map (the ~700 verbs that aren't in the top-200).
 *   - Logs every action; finishes with a per-action count.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DICT = path.join(ROOT, 'src/data/dictionary/ru.ts');
const MAP_PATH = path.join(__dirname, 'ru-aspect-pairs.json');
const DRY = process.argv.includes('--dry-run');

const pairMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
const src = fs.readFileSync(DICT, 'utf8');

// Parse entries one-line-per-entry. Captures key + body, preserving offsets.
function parseEntries(text) {
  const entries = [];
  const re = /^(\s*)(['"])([^'"]+?)\2\s*:\s*\{([^}]*)\}/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    entries.push({
      start: m.index,
      end: m.index + m[0].length,
      key: m[3],
      body: m[4],
      raw: m[0],
    });
  }
  return entries;
}

const getPos = b => (b.match(/pos\s*:\s*['"]([^'"]+)['"]/) || [])[1];
const hasField = (b, field) => new RegExp(`${field}\\s*:`).test(b);

const entries = parseEntries(src);
const byKey = new Map(entries.map(e => [e.key, e]));

const actions = { added: 0, skipNotInDict: 0, skipNotVerb: 0, skipAlreadyHasFields: 0 };
const additions = [];   // { entry, fieldsToAdd: { aspect, pair, note } }
const issues = [];

for (const [key, data] of Object.entries(pairMap)) {
  if (key.startsWith('_')) continue;
  const entry = byKey.get(key);
  if (!entry) { actions.skipNotInDict++; issues.push(`${key}: not in dict`); continue; }
  if (getPos(entry.body) !== 'v') { actions.skipNotVerb++; issues.push(`${key}: dict pos is not 'v'`); continue; }
  const alreadyHas = hasField(entry.body, 'aspect') && hasField(entry.body, 'pair');
  if (alreadyHas) { actions.skipAlreadyHasFields++; continue; }
  additions.push({ entry, data });
  actions.added++;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log(`APPLY RU ASPECT-PAIR MAP  ·  ${DRY ? '[DRY RUN]' : '[APPLYING]'}`);
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Pair map: ${Object.keys(pairMap).filter(k => !k.startsWith('_')).length} entries`);
console.log(`Dict     : ${entries.length} total entries, ${entries.filter(e => getPos(e.body) === 'v').length} verbs`);
console.log();
console.log(`  add fields:           ${actions.added}`);
console.log(`  skip (not in dict):   ${actions.skipNotInDict}`);
console.log(`  skip (not verb):      ${actions.skipNotVerb}`);
console.log(`  skip (already set):   ${actions.skipAlreadyHasFields}`);

if (issues.length > 0) {
  console.log(`\nIssues (${issues.length}):`);
  for (const i of issues.slice(0, 20)) console.log(`  - ${i}`);
  if (issues.length > 20) console.log(`  - ... +${issues.length - 20} more`);
}

if (additions.length > 0) {
  console.log(`\nSample of fields being added (first 8):`);
  for (const { entry, data } of additions.slice(0, 8)) {
    const fields = [`aspect: '${data.aspect}'`];
    if (data.pair) fields.push(`pair: '${data.pair}'`);
    if (data.note) fields.push(`note: '...'`);
    console.log(`  ${entry.key}: { ..., ${fields.join(', ')} }`);
  }
}

if (DRY) {
  console.log('\nDRY RUN — no writes. Re-run without --dry-run to apply.');
  process.exit(0);
}

// Apply edits right-to-left so earlier offsets stay valid.
let newSrc = src;
const sorted = additions.slice().sort((a, b) => b.entry.start - a.entry.start);
for (const { entry, data } of sorted) {
  const newFields = [];
  newFields.push(`aspect: '${data.aspect}'`);
  if (data.pair) newFields.push(`pair: '${data.pair}'`);
  if (data.note) {
    // Escape single quotes inside the note so the embedded string survives.
    const safe = data.note.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    newFields.push(`note: '${safe}'`);
  }
  // Trim trailing whitespace from body, then re-attach our additions.
  const newBody = entry.body.replace(/\s*$/, '') + `, ${newFields.join(', ')} `;
  const newRaw = entry.raw.slice(0, entry.raw.indexOf('{') + 1) + newBody + '}';
  newSrc = newSrc.slice(0, entry.start) + newRaw + newSrc.slice(entry.end);
}

fs.writeFileSync(DICT, newSrc);
console.log('\nWritten.');
