#!/usr/bin/env node
/**
 * High-confidence sub-audit + fix: in Romance languages, nouns whose spelling
 * exactly matches the 1sg present form derived from their verb lemma are
 * almost always polysemous (e.g. Italian `lavoro` = "work; job" AND "I work").
 *
 * Strategy: walk the dict, find entries where
 *   - pos == 'n'
 *   - lemma exists, points to a verb
 *   - dropping the lemma's infinitive ending and appending the 1sg ending
 *     produces the exact word
 *   - the entry's en doesn't already contain "I <verb>" semantics
 *
 * For each match, prepend "I <verb-stem>" to the existing English and rewrite
 * the file. Adjective entries (past participles like "accepted") are left
 * alone — those are legitimately adjectives, not polysemy.
 */
const fs = require('fs');

// (language, file, infinitive endings → 1sg ending)
// Romance pattern: drop infinitive ending, append 1sg ending.
const RULES = {
  italian:    { path: 'src/data/dictionary/it.ts', endings: { 'are': 'o', 'ere': 'o', 'ire': 'o' } },
  spanish:    { path: 'src/data/dictionary/es.ts', endings: { 'ar':  'o', 'er':  'o', 'ir':  'o' } },
  portuguese: { path: 'src/data/dictionary/pt.ts', endings: { 'ar':  'o', 'er':  'o', 'ir':  'o' } },
  french:     { path: 'src/data/dictionary/fr.ts', endings: { 'er':  'e' } }, // -er → 1sg -e only
};

function parseDict(path) {
  const text = fs.readFileSync(path, 'utf8');
  const re = /^\s*'([^']+)':\s*\{[^}]*en:\s*'([^']*)'[^}]*pos:\s*'([^']+)'(?:[^}]*lemma:\s*'([^']+)')?[^}]*\},?\s*$/gm;
  const out = {};
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, word, en, pos, lemma] = m;
    out[word] = { en, pos, lemma };
  }
  return out;
}

function derive1sg(infinitive, endings) {
  for (const [inf, sg] of Object.entries(endings)) {
    if (infinitive.endsWith(inf)) {
      return infinitive.slice(0, -inf.length) + sg;
    }
  }
  return null;
}

/** Cheap verb stem for the English meaning. Strips "to " prefix. */
function englishVerbStem(verbEn) {
  // Take first sense before ';' or ','
  const first = verbEn.split(/[;,]/)[0].trim();
  return first.replace(/^to\s+/, '');
}

const allFixes = {};

for (const [lang, rule] of Object.entries(RULES)) {
  if (!fs.existsSync(rule.path)) continue;
  const entries = parseDict(rule.path);
  const fixes = [];

  for (const word of Object.keys(entries)) {
    const e = entries[word];
    if (e.pos !== 'n') continue;
    if (!e.lemma) continue;
    const lemmaEntry = entries[e.lemma];
    if (!lemmaEntry || lemmaEntry.pos !== 'v') continue;

    const expected1sg = derive1sg(e.lemma, rule.endings);
    if (expected1sg !== word) continue;

    // Skip if the en already mentions an "I X" or verbal sense
    if (/\bI\s+\w/.test(e.en)) continue;

    const stem = englishVerbStem(lemmaEntry.en);
    if (!stem) continue;

    const newEn = `${e.en}; I ${stem} (1sg of ${e.lemma})`;
    fixes.push({ word, oldEn: e.en, newEn, lemma: e.lemma });
  }

  allFixes[lang] = fixes;
  console.log(`${lang.padEnd(12)} ${fixes.length} fixes`);
}

console.log('');

// Apply fixes language by language
const APPLY = process.argv.includes('--apply');

for (const [lang, fixes] of Object.entries(allFixes)) {
  if (fixes.length === 0) continue;
  const rule = RULES[lang];
  console.log(`\n--- ${lang.toUpperCase()} ---`);
  fixes.slice(0, 10).forEach(f => {
    console.log(`  ${f.word.padEnd(20)} "${f.oldEn}" → "${f.newEn}"`);
  });
  if (fixes.length > 10) console.log(`  ... and ${fixes.length - 10} more`);

  if (APPLY) {
    let text = fs.readFileSync(rule.path, 'utf8');
    let applied = 0;
    for (const f of fixes) {
      // Find line for this entry, replace en only
      const escaped = f.oldEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(
        `(^\\s*'${f.word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}':\\s*\\{\\s*en:\\s*')${escaped}('[^}]*\\})`,
        'm'
      );
      const next = text.replace(re, `$1${f.newEn}$2`);
      if (next !== text) {
        text = next;
        applied++;
      }
    }
    fs.writeFileSync(rule.path, text);
    console.log(`  applied: ${applied} / ${fixes.length}`);
  }
}

fs.mkdirSync('scripts/output', { recursive: true });
fs.writeFileSync('scripts/output/noun-verb-1sg-fixes.json', JSON.stringify(allFixes, null, 2));
console.log('\nReport: scripts/output/noun-verb-1sg-fixes.json');
if (!APPLY) console.log('\nRun with --apply to write changes.');
