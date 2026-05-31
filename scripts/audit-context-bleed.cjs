/**
 * Audit Romance-language dictionaries for context-bleed errors.
 * Extracts every {word, en, ipa, pos} entry and dumps to JSON for review.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DICT_DIR = path.join(ROOT, 'src/data/dictionary');

function extractEntries(lang) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const src = fs.readFileSync(filePath, 'utf8');

  // Find start of dictionary object
  const dictStart = src.search(/(?:export )?const dictionary.*=\s*\{/);
  if (dictStart === -1) throw new Error(`No dictionary found in ${lang}.ts`);

  const entries = [];
  // Match each entry: "word": { en: "...", ipa: "...", ... }
  // or  word: { en: "...", ipa: "...", ... }
  const entryRe = /(?:"([^"]+)"|'([^']+)'|([\wàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿąćęłńóśźżšžğışüöçαβγδεζηθικλμνξοπρστυφχψωабвгдеёжзийклмнопрстуфхцчшщъыьэюяіїєґ]+)):\s*\{([^}]+)\}/g;

  const dictSection = src.slice(dictStart);
  let m;
  while ((m = entryRe.exec(dictSection)) !== null) {
    const word = m[1] || m[2] || m[3];
    const body = m[4];

    // Extract en field
    const enMatch = body.match(/en:\s*["']([^"']+)["']/);
    if (!enMatch) continue;
    const en = enMatch[1];

    // Extract pos field
    const posMatch = body.match(/pos:\s*["']([^"']+)["']/);
    const pos = posMatch ? posMatch[1] : '';

    // Extract ipa field
    const ipaMatch = body.match(/ipa:\s*["']([^"']+)["']/);
    const ipa = ipaMatch ? ipaMatch[1] : '';

    entries.push({ word, en, pos, ipa });
  }

  return entries;
}

for (const lang of ['es', 'it', 'fr', 'pt']) {
  const entries = extractEntries(lang);
  const outPath = path.join(ROOT, 'scripts/output', `${lang}-dict-entries.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2));
  console.log(`${lang}: ${entries.length} entries extracted`);
}
