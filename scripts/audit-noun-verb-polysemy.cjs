#!/usr/bin/env node
/**
 * Cross-language audit: find dict entries that are tagged as a non-verb POS
 * (n/adj/adv/...) but have a `lemma` field pointing to a verb infinitive in
 * the same dict. These are very often polysemous nouns/adjectives that ARE
 * ALSO a conjugated form of the verb, e.g.:
 *
 *   Italian  lavoro: 'work; job' (n, lemma=lavorare) — also 1sg "I work"
 *   Spanish  trabajo: 'work; job' (n, lemma=trabajar) — also 1sg "I work"
 *   French   travail: 'work' (n) — separate root from travailler, NOT a polysemy
 *
 * Output: scripts/output/noun-verb-polysemy.json + a printed summary.
 */
const fs = require('fs');

const DICTS = {
  spanish: 'src/data/dictionary/es.ts',
  italian: 'src/data/dictionary/it.ts',
  french: 'src/data/dictionary/fr.ts',
  portuguese: 'src/data/dictionary/pt.ts',
  german: 'src/data/dictionary/de.ts',
  dutch: 'src/data/dictionary/nl.ts',
  swedish: 'src/data/dictionary/sv.ts',
  welsh: 'src/data/dictionary/cy.ts',
  hindi: 'src/data/dictionary/hi.ts',
  turkish: 'src/data/dictionary/tr.ts',
  russian: 'src/data/dictionary/ru.ts',
};

/** Cheap regex-line parser for the dict files. */
function parseDict(path) {
  const text = fs.readFileSync(path, 'utf8');
  // Match:  '<word>': { en: '<en>', ipa: '<ipa>', pos: '<pos>'[, lemma: '<lemma>'] },
  const re = /^\s*'([^']+)':\s*\{[^}]*en:\s*'([^']*)'[^}]*pos:\s*'([^']+)'(?:[^}]*lemma:\s*'([^']+)')?[^}]*\},?\s*$/gm;
  const entries = {};
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, word, en, pos, lemma] = m;
    entries[word] = { en, pos, lemma };
  }
  return entries;
}

const langSuspects = {};

for (const [lang, path] of Object.entries(DICTS)) {
  if (!fs.existsSync(path)) continue;
  const entries = parseDict(path);
  const wordList = Object.keys(entries);

  const verbPos = new Set(['v']);
  const suspects = [];

  for (const word of wordList) {
    const e = entries[word];
    if (!e.lemma) continue;             // no lemma → not a derivable mismatch
    if (verbPos.has(e.pos)) continue;   // already tagged as verb → fine
    const lemmaEntry = entries[e.lemma];
    if (!lemmaEntry) continue;          // lemma not in dict → can't judge
    if (!verbPos.has(lemmaEntry.pos)) continue; // lemma isn't a verb → genuinely a non-verb inflection

    // POS isn't verb but lemma IS a verb. → polysemy or misclassification.
    suspects.push({
      word,
      en: e.en,
      pos: e.pos,
      lemma: e.lemma,
      lemmaEn: lemmaEntry.en,
    });
  }
  langSuspects[lang] = suspects;
}

console.log('=== Noun/verb polysemy candidates ===');
console.log('  (entry has non-verb POS but lemma points to a verb infinitive)\n');

let total = 0;
for (const [lang, list] of Object.entries(langSuspects)) {
  console.log(`${lang.padEnd(12)} ${list.length} suspects`);
  total += list.length;
}
console.log(`\nTOTAL: ${total}\n`);

// Show top 10 most striking per language
for (const [lang, list] of Object.entries(langSuspects)) {
  if (list.length === 0) continue;
  console.log(`--- ${lang.toUpperCase()} (first 10) ---`);
  for (const s of list.slice(0, 10)) {
    console.log(
      '  ' + s.word.padEnd(18) +
      `[${s.en}]`.padEnd(40) +
      `(${s.pos}, lemma=${s.lemma} = "${s.lemmaEn}")`,
    );
  }
  console.log();
}

fs.mkdirSync('scripts/output', { recursive: true });
fs.writeFileSync('scripts/output/noun-verb-polysemy.json', JSON.stringify(langSuspects, null, 2));
console.log('Full report: scripts/output/noun-verb-polysemy.json');
