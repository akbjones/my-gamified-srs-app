#!/usr/bin/env node
/**
 * Fix plain-text IPA entries across all language dictionaries.
 * Uses espeak-ng to regenerate IPA for entries that contain no real IPA symbols.
 *
 * Processes words individually to ensure correct IPA-to-word mapping.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ESPEAK = '/opt/homebrew/bin/espeak-ng';
const DICT_DIR = path.join(__dirname, '..', 'src', 'data', 'dictionary');

const LANGS = {
  es: 'es', fr: 'fr', tr: 'tr', sv: 'sv', nl: 'nl',
  cy: 'cy', de: 'de', it: 'it', pt: 'pt', hi: 'hi', ru: 'ru',
};

// Explicit IPA characters from the task spec
const EXPLICIT_IPA = new Set([
  'ˈ', 'ˌ', 'ɛ', 'ɔ', 'ʃ', 'ʒ', 'ŋ', 'ɲ', 'ʎ', 'ʤ', 'ʧ',
  'θ', 'ð', 'æ', 'ɑ', 'ɒ', 'ɜ', 'ʊ', 'ɪ', 'ə', 'ɐ', 'ɾ',
  'ʁ', 'ɫ', 'ɬ', 'ʰ', 'ʲ', 'ʷ', '˞', 'ˠ',
  'β', 'ç', 'ħ', 'ɡ', 'ɣ', 'ɤ', 'ɥ', 'ɨ', 'ɯ', 'ɳ', 'ɵ',
  'ɸ', 'ʂ', 'ʐ', 'ʑ', 'ʔ', 'ʕ', 'ʙ', 'ʜ', 'ʢ', 'ɟ', 'ɻ',
  'ʋ', 'ɹ', 'ɝ', 'ɞ', 'ʌ', 'ʍ', 'ɮ', 'ɱ', 'ɴ', 'ɶ', 'ɺ',
  'ɽ', 'ʀ', 'ʝ', 'ʟ', 'ː', 'ˑ',
]);

// Standard accented Latin letters (NOT IPA indicators)
const STANDARD_ACCENTED = new Set([
  'à', 'á', 'â', 'ã', 'ä', 'å', 'ç', 'è', 'é', 'ê', 'ë',
  'ì', 'í', 'î', 'ï', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ù',
  'ú', 'û', 'ü', 'ý', 'ÿ', 'ø', 'ß',
  'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Ç', 'È', 'É', 'Ê', 'Ë',
  'Ì', 'Í', 'Î', 'Ï', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ù',
  'Ú', 'Û', 'Ü', 'Ý', 'Ÿ', 'Ø',
  'ı', 'İ', 'ş', 'Ş', 'ğ', 'Ğ', 'ŵ', 'Ŵ', 'ŷ', 'Ŷ', 'ẁ', 'ẃ', 'ẅ',
  'ā', 'ē', 'ī', 'ō', 'ū', 'ă', 'ĕ', 'ĭ', 'ŏ', 'ŭ',
  'ą', 'ę', 'ł', 'ć', 'ś', 'ź', 'ż', 'ń',
  'ě', 'ř', 'ů', 'ž', 'č', 'š', 'ď', 'ť',
]);

function hasRealIPA(ipa) {
  if (!ipa || ipa.trim() === '') return false;
  for (const ch of ipa) {
    if (EXPLICIT_IPA.has(ch)) return true;
    const code = ch.codePointAt(0);
    if (code > 0x0100 && !STANDARD_ACCENTED.has(ch)) {
      if (code >= 0x0250 && code <= 0x02AF) return true; // IPA Extensions
      if (code >= 0x02B0 && code <= 0x02FF) return true; // Spacing Modifier Letters
      if (code >= 0x0300 && code <= 0x036F) return true; // Combining Diacritical Marks
      if (code >= 0x0370 && code <= 0x03FF) return true; // Greek
      if (code >= 0x1D00 && code <= 0x1DBF) return true; // Phonetic Extensions
      if (code >= 0x0400 && code <= 0x04FF) return true; // Cyrillic
      if (code >= 0x0900 && code <= 0x097F) return true; // Devanagari
    }
  }
  return false;
}

function espeakIPA(word, voice) {
  try {
    // Use --stdin for a single word to avoid file-based issues
    const safe = word.replace(/'/g, "'\\''");
    const output = execSync(
      `printf '%s' '${safe}' | ${ESPEAK} -v ${voice} -q --ipa`,
      { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return output.trim().split('\n')[0]?.trim() || null;
  } catch {
    return null;
  }
}

function processLanguage(langCode) {
  const filePath = path.join(DICT_DIR, `${langCode}.ts`);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${langCode}: file not found`);
    return 0;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const voice = LANGS[langCode];

  // Parse all ipa entries with their positions
  // Match ipa values, handling escaped quotes (e.g. ipa: 'd\'oliva')
  const ipaRegex = /ipa:\s*(['"])((?:[^'"\\\n]|\\.)*?)\1/g;
  let match;
  const plainEntries = [];

  while ((match = ipaRegex.exec(content)) !== null) {
    // Unescape the captured IPA value
    const rawIPA = match[2];
    const ipa = rawIPA.replace(/\\'/g, "'").replace(/\\"/g, '"');
    if (!ipa || ipa === '' || ipa === 'string') continue;
    if (hasRealIPA(ipa)) continue;

    // Find the word key for this entry (handles quoted and unquoted keys)
    const before = content.slice(Math.max(0, match.index - 500), match.index);
    // Match: 'key': {, "key": {, or bareKey: { (bareKey can include accented chars, apostrophes)
    const keyRegex = /(?:'([^']+)'|"([^"]+)"|([\w\u00C0-\u024F][\w\u00C0-\u024F'-]*)):\s*\{[^}]*$/;
    const m = before.match(keyRegex);
    if (!m) continue;

    const word = m[1] || m[2] || m[3];
    plainEntries.push({
      word,
      ipa: rawIPA, // Keep the raw (escaped) version for replacement matching
      quote: match[1],
      index: match.index,
      fullMatch: match[0],
    });
  }

  if (plainEntries.length === 0) {
    console.log(`${langCode}: 0 plain-text IPA entries`);
    return 0;
  }

  console.log(`${langCode}: ${plainEntries.length} plain-text IPA entries, generating...`);

  // Generate IPA for unique words
  const uniqueWords = [...new Set(plainEntries.map(e => e.word))];
  const newIPAs = {};
  let progress = 0;

  for (const word of uniqueWords) {
    const ipa = espeakIPA(word, voice);
    if (ipa) newIPAs[word] = ipa;
    progress++;
    if (progress % 200 === 0) {
      process.stdout.write(`  ${progress}/${uniqueWords.length}\r`);
    }
  }
  process.stdout.write(`  ${uniqueWords.length}/${uniqueWords.length}\n`);

  // Count how many generated IPAs are actually different and have real IPA chars
  let wouldFix = 0;
  for (const entry of plainEntries) {
    const newIPA = newIPAs[entry.word];
    if (newIPA && newIPA !== entry.ipa && hasRealIPA(newIPA)) wouldFix++;
  }
  console.log(`  ${Object.keys(newIPAs).length} words got espeak output, ${wouldFix} have real IPA chars`);

  // Replace: work backwards to preserve indices
  const toReplace = [];
  for (const entry of plainEntries) {
    const newIPA = newIPAs[entry.word];
    if (!newIPA || newIPA === entry.ipa) continue;
    if (!hasRealIPA(newIPA)) continue; // Skip if espeak also produced plain text

    let cleanIPA = newIPA.trim();
    // Escape quotes
    if (entry.quote === "'") {
      cleanIPA = cleanIPA.replace(/'/g, "\\'");
    } else {
      cleanIPA = cleanIPA.replace(/"/g, '\\"');
    }

    toReplace.push({
      index: entry.index,
      oldMatch: entry.fullMatch,
      newMatch: `ipa: ${entry.quote}${cleanIPA}${entry.quote}`,
    });
  }

  // Sort by index descending
  toReplace.sort((a, b) => b.index - a.index);

  for (const r of toReplace) {
    content = content.slice(0, r.index) + r.newMatch + content.slice(r.index + r.oldMatch.length);
  }

  fs.writeFileSync(filePath, content);
  console.log(`  ${toReplace.length} entries fixed`);
  return toReplace.length;
}

// Main
console.log('=== Fixing plain-text IPA entries ===\n');

let totalFixed = 0;
const langOrder = ['es', 'fr', 'tr', 'sv', 'nl', 'cy', 'de', 'it', 'pt', 'hi', 'ru'];
const results = {};

for (const lang of langOrder) {
  const fixed = processLanguage(lang);
  results[lang] = fixed;
  totalFixed += fixed;
  console.log('');
}

console.log('=== Summary ===');
for (const [lang, count] of Object.entries(results)) {
  if (count > 0) console.log(`  ${lang}: ${count} fixed`);
}
console.log(`\nTotal fixed: ${totalFixed}`);
