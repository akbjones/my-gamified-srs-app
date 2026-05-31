#!/usr/bin/env node
/**
 * Expand German and Dutch dictionaries with missing words.
 * Reads translations from JSON files, generates IPA via espeak-ng.
 */

const { execSync } = require('child_process');
const fs = require('fs');

function getIPA(word, lang) {
  try {
    const result = execSync(
      `/opt/homebrew/bin/espeak-ng -v ${lang} -q --ipa "${word.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 5000 }
    ).trim();
    return result || '';
  } catch {
    return '';
  }
}

function guessPos(word, lang) {
  if (lang === 'de') {
    if (word.endsWith('ung') || word.endsWith('heit') || word.endsWith('keit') ||
        word.endsWith('schaft') || word.endsWith('nis') || word.endsWith('tum')) return 'n';
    if (word.endsWith('en') && word.length > 4) return 'v';
    if (word.endsWith('lich') || word.endsWith('ig') || word.endsWith('isch') ||
        word.endsWith('bar') || word.endsWith('sam')) return 'adj';
  }
  if (lang === 'nl') {
    if (word.endsWith('ing') || word.endsWith('heid') || word.endsWith('schap') ||
        word.endsWith('nis') || word.endsWith('ment')) return 'n';
    if (word.endsWith('en') && word.length > 4) return 'v';
    if (word.endsWith('lijk') || word.endsWith('ig') || word.endsWith('isch') ||
        word.endsWith('baar') || word.endsWith('zaam')) return 'adj';
  }
  return 'n';
}

function escapeKey(word) {
  if (word.includes("'")) return `"${word}"`;
  return `'${word}'`;
}

function escapeValue(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function processLanguage(lang, missingFile, translationsFile) {
  const data = JSON.parse(fs.readFileSync(missingFile, 'utf8'));
  const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));

  console.log(`\n=== ${lang.toUpperCase()} ===`);
  console.log(`Total missing words: ${data.length}`);
  console.log(`Translation entries: ${Object.keys(translations).length}`);

  const entries = [];
  let realTranslations = 0;
  let placeholders = 0;

  for (let i = 0; i < data.length; i++) {
    const { word } = data[i];
    if (!word || word.length < 2) continue;

    const ipa = getIPA(word, lang);
    const known = translations[word];
    let en, pos, lemma;

    if (known) {
      en = known.en;
      pos = known.pos || guessPos(word, lang);
      lemma = known.lemma;
      realTranslations++;
    } else {
      en = '?';
      pos = guessPos(word, lang);
      placeholders++;
    }

    const entry = { word, en, ipa: ipa || '', pos };
    if (lemma) entry.lemma = lemma;
    entries.push(entry);

    if ((i + 1) % 100 === 0) {
      process.stderr.write(`  ${lang}: processed ${i + 1}/${data.length}\n`);
    }
  }

  console.log(`Real translations: ${realTranslations}`);
  console.log(`Placeholders: ${placeholders}`);

  // Generate TypeScript lines
  const lines = entries.map(e => {
    const key = escapeKey(e.word);
    let val = `en: '${escapeValue(e.en)}', ipa: '${escapeValue(e.ipa)}', pos: '${e.pos}'`;
    if (e.lemma) val += `, lemma: '${escapeValue(e.lemma)}'`;
    return `  ${key}: { ${val} },`;
  });

  return { entries, lines, realTranslations, placeholders };
}

const deResult = processLanguage('de', '/tmp/de-missing.json', 'scripts/de-translations.json');
const nlResult = processLanguage('nl', '/tmp/nl-missing.json', 'scripts/nl-translations.json');

fs.writeFileSync('/tmp/de-dict-entries.txt', deResult.lines.join('\n') + '\n');
fs.writeFileSync('/tmp/nl-dict-entries.txt', nlResult.lines.join('\n') + '\n');

console.log('\n=== Summary ===');
console.log(`DE: ${deResult.lines.length} entries (${deResult.realTranslations} translated, ${deResult.placeholders} placeholder)`);
console.log(`NL: ${nlResult.lines.length} entries (${nlResult.realTranslations} translated, ${nlResult.placeholders} placeholder)`);
