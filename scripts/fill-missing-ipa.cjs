#!/usr/bin/env node
/**
 * Fill missing IPA pronunciations using espeak-ng.
 *
 * Usage:
 *   node scripts/fill-missing-ipa.cjs <lang-code|all>
 *
 * Finds entries with ipa: '?' in each dictionary .ts file and replaces
 * them with IPA from espeak-ng. Processes words in batches for speed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const ESPEAK = '/opt/homebrew/bin/espeak-ng';
const BATCH_SIZE = 50;

const LANG_MAP = {
  es: 'es',
  it: 'it',
  fr: 'fr',
  pt: 'pt-br',
  de: 'de',
  nl: 'nl',
  sv: 'sv',
  cy: 'cy',
  hi: 'hi',
  tr: 'tr',
  ru: 'ru',
};

/**
 * Get IPA for a batch of words using a temp file.
 * Each line in the file is one word; espeak-ng outputs one IPA per line.
 */
function getIpaBatch(words, espeakLang) {
  const tmpFile = path.join(os.tmpdir(), `ipa-batch-${Date.now()}.txt`);
  // Write words one per line
  fs.writeFileSync(tmpFile, words.join('\n') + '\n', 'utf8');
  try {
    const result = execSync(
      `${ESPEAK} -v ${espeakLang} --ipa -q -f "${tmpFile}"`,
      { encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    ).trim();
    const lines = result.split('\n');
    // espeak-ng outputs one line per input line, but may add blank lines
    // We need to map them back carefully
    const ipas = [];
    let lineIdx = 0;
    for (let i = 0; i < words.length; i++) {
      if (lineIdx < lines.length) {
        let ipa = lines[lineIdx].trim();
        // For multi-word entries, espeak outputs space-separated IPA - keep it all
        // but clean up extra whitespace
        ipa = ipa.replace(/\s+/g, ' ').trim();
        ipas.push(ipa || '?');
        lineIdx++;
      } else {
        ipas.push('?');
      }
    }
    return ipas;
  } catch (e) {
    // Fallback: return all '?'
    return words.map(() => '?');
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

/**
 * Fallback: get IPA for a single word directly.
 */
function getIpaSingle(word, espeakLang) {
  try {
    const result = execSync(
      `${ESPEAK} -v ${espeakLang} --ipa -q "${word.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 5000 }
    ).trim();
    let ipa = result.replace(/\s+/g, ' ').trim();
    return ipa || '?';
  } catch {
    return '?';
  }
}

function fillLang(langCode) {
  const dictPath = path.join(ROOT, 'src', 'data', 'dictionary', `${langCode}.ts`);
  let content = fs.readFileSync(dictPath, 'utf8');
  const espeakLang = LANG_MAP[langCode];

  // Match both single-quoted and double-quoted keys with ipa: '?'
  // Group 1: everything before "ipa: '?'"
  // Group 2: the key (word) – captured from either single or double quote variant
  // Group 3: everything after "ipa: '?'" to end of object
  const re = /^(\s*(?:'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"]*)"):\s*\{[^}]*?)ipa: '\?'([^}]*\})/gm;

  const entries = [];
  let match;
  while ((match = re.exec(content)) !== null) {
    // Word comes from group 2 (single-quoted) or group 3 (double-quoted)
    const rawWord = match[2] !== undefined ? match[2] : match[3];
    const word = rawWord.replace(/\\'/g, "'").replace(/\\"/g, '"');
    entries.push({
      word,
      fullMatch: match[0],
      prefix: match[1],
      suffix: match[4],
    });
  }

  if (entries.length === 0) {
    console.log(`  ${langCode}: 0 gaps – skipping`);
    return 0;
  }

  console.log(`  ${langCode}: found ${entries.length} IPA gaps, processing...`);

  // Process in batches
  let filled = 0;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const words = batch.map(e => e.word);
    const ipas = getIpaBatch(words, espeakLang);

    for (let j = 0; j < batch.length; j++) {
      let ipa = ipas[j];
      // If batch gave us '?', try single word as fallback
      if (!ipa || ipa === '?') {
        ipa = getIpaSingle(batch[j].word, espeakLang);
      }
      if (ipa && ipa !== '?') {
        const safeIpa = ipa.replace(/'/g, "\\'");
        const entry = batch[j];
        content = content.replace(
          entry.fullMatch,
          entry.prefix + `ipa: '${safeIpa}'` + entry.suffix
        );
        filled++;
      }
    }

    // Progress indicator for large batches
    if (entries.length > 100 && (i + BATCH_SIZE) % 200 === 0) {
      process.stdout.write(`    ... ${Math.min(i + BATCH_SIZE, entries.length)}/${entries.length}\n`);
    }
  }

  fs.writeFileSync(dictPath, content, 'utf8');
  console.log(`  ${langCode}: filled ${filled}/${entries.length} IPA entries`);
  return filled;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/fill-missing-ipa.cjs <lang-code|all>');
    process.exit(1);
  }

  // Check espeak-ng exists
  try {
    execSync(`${ESPEAK} --version`, { encoding: 'utf8' });
  } catch {
    console.error('espeak-ng not found at', ESPEAK);
    process.exit(1);
  }

  const langs = args[0] === 'all' ? Object.keys(LANG_MAP) : [args[0]];

  console.log('Filling missing IPA pronunciations...\n');
  let total = 0;
  for (const lang of langs) {
    if (!LANG_MAP[lang]) {
      console.error(`Unknown language: ${lang}`);
      continue;
    }
    total += fillLang(lang);
  }
  console.log(`\nDone. Total IPA entries filled: ${total}`);
}

main();
