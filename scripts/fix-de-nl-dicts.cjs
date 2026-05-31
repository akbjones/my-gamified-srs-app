#!/usr/bin/env node
/**
 * Fix German and Dutch dictionaries:
 * - Replace self-referential translations with real English translations
 * - Update IPA with espeak-ng output
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

function processFile(filePath, lang, translationsFile) {
  const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));
  let content = fs.readFileSync(filePath, 'utf8');

  // Find entries where en = word (self-translated)
  // Match both quoted and unquoted keys
  const regex = /^(\s+(?:'([^']+)'|"([^"]+)"|(\w[\w\u00C0-\u024F]*))\s*:\s*\{)([^}]+)(\},?)$/gm;

  let fixedTranslations = 0;
  let fixedIPA = 0;
  let totalSelfTranslated = 0;

  content = content.replace(regex, (match, prefix, qkey1, qkey2, bareKey, body, suffix) => {
    const key = qkey1 || qkey2 || bareKey;
    if (!key) return match;

    const enMatch = body.match(/en:\s*'([^']*)'/);
    const ipaMatch = body.match(/ipa:\s*'([^']*)'/);

    if (!enMatch) return match;

    const currentEn = enMatch[1];
    const currentIpa = ipaMatch ? ipaMatch[1] : '';
    const keyLower = key.toLowerCase();
    const enLower = currentEn.toLowerCase().replace(/^to /, '');

    // Check if self-translated
    const isSelfTranslated = (enLower === keyLower);
    if (isSelfTranslated) totalSelfTranslated++;

    // Get translation from our map
    const known = translations[key];
    let newEn = currentEn;
    let newIpa = currentIpa;
    let changed = false;

    if (known && isSelfTranslated) {
      newEn = known.en;
      fixedTranslations++;
      changed = true;
    }

    // Also update IPA if it looks like simple ASCII (not real IPA)
    const hasRealIPA = /[ˈˌːɪɛʊɔəɑʁçʃŋɾɐʒθðæ]/.test(currentIpa);
    if (!hasRealIPA && key.length > 1) {
      const espeakIpa = getIPA(key, lang);
      if (espeakIpa) {
        newIpa = espeakIpa;
        fixedIPA++;
        changed = true;
      }
    }

    if (!changed) return match;

    let newBody = body;
    if (newEn !== currentEn) {
      newBody = newBody.replace(/en:\s*'[^']*'/, `en: '${newEn.replace(/'/g, "\\'")}'`);
    }
    if (newIpa !== currentIpa) {
      newBody = newBody.replace(/ipa:\s*'[^']*'/, `ipa: '${newIpa.replace(/'/g, "\\'")}'`);
    }

    // If we have known pos/lemma, add those too
    if (known && isSelfTranslated) {
      if (known.pos && !body.includes('pos:')) {
        newBody += `, pos: '${known.pos}'`;
      }
      if (known.lemma && !body.includes('lemma:')) {
        newBody += `, lemma: '${known.lemma}'`;
      }
    }

    return prefix + newBody + suffix;
  });

  fs.writeFileSync(filePath, content);
  console.log(`${lang.toUpperCase()}: fixed ${fixedTranslations} translations, ${fixedIPA} IPA entries`);
  console.log(`  Total self-translated entries: ${totalSelfTranslated}`);
}

processFile('src/data/dictionary/de.ts', 'de', 'scripts/de-translations.json');
processFile('src/data/dictionary/nl.ts', 'nl', 'scripts/nl-translations.json');
