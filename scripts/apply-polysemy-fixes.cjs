#!/usr/bin/env node
/**
 * Apply polysemy completeness fixes to dictionaries.
 * Reads scripts/ai-polysemy-{lang}.json and updates en + pos in each entry.
 * Preserves other fields (ipa, lemma).
 */
const fs = require('fs');
const vm = require('vm');

const LANGS = [
  { code: 'es', file: 'src/data/dictionary/es.ts', varName: 'dictionary' },
  { code: 'fr', file: 'src/data/dictionary/fr.ts', varName: 'dictionary' },
  { code: 'it', file: 'src/data/dictionary/it.ts', varName: 'dictionary' },
  { code: 'pt', file: 'src/data/dictionary/pt.ts', varName: 'dictionary' },
  { code: 'de', file: 'src/data/dictionary/de.ts', varName: 'DICT' },
  { code: 'nl', file: 'src/data/dictionary/nl.ts', varName: 'dictionary' },
  { code: 'sv', file: 'src/data/dictionary/sv.ts', varName: 'dictionary' },
  { code: 'cy', file: 'src/data/dictionary/cy.ts', varName: 'dict' },
  { code: 'hi', file: 'src/data/dictionary/hi.ts', varName: 'dictionary' },
  { code: 'tr', file: 'src/data/dictionary/tr.ts', varName: 'dictionary' },
  { code: 'ru', file: 'src/data/dictionary/ru.ts', varName: 'dictionary' },
];

function splitFile(content, varName) {
  const patterns = [
    new RegExp(`((?:export\\s+)?const\\s+${varName}\\s*:\\s*Record<[^>]+>\\s*=\\s*)\\{`, 'm'),
    new RegExp(`((?:export\\s+)?const\\s+${varName}\\s*=\\s*)\\{`, 'm'),
  ];
  let match = null;
  for (const pat of patterns) { match = content.match(pat); if (match) break; }
  if (!match) throw new Error(`Can't find dict for ${varName}`);
  const declEnd = match.index + match[0].length;
  const preDictCode = content.slice(0, declEnd - 1);
  let depth = 1, i = declEnd;
  while (i < content.length && depth > 0) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (ch === "'" || ch === '"') {
      const q = ch; i++;
      while (i < content.length) { if (content[i] === '\\') { i += 2; continue; } if (content[i] === q) break; i++; }
    }
    i++;
  }
  const closingBrace = i - 1;
  const dictBody = content.slice(declEnd, closingBrace);
  let postStart = closingBrace;
  while (postStart < content.length && content[postStart] !== ';') postStart++;
  postStart++;
  return { preDictCode, dictBody, postDictCode: content.slice(postStart) };
}

function parseDict(body) { return vm.runInNewContext('({' + body + '})', {}, { timeout: 10000 }); }

function serializeDict(dict) {
  const lines = [];
  for (const [key, entry] of Object.entries(dict)) {
    const escKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escEn = (entry.en || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escIpa = (entry.ipa || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    let line = `  '${escKey}': { en: '${escEn}', ipa: '${escIpa}', pos: '${entry.pos || 'n'}'`;
    if (entry.lemma) line += `, lemma: '${entry.lemma.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    line += ' },';
    lines.push(line);
  }
  return '\n' + lines.join('\n') + '\n';
}

let grandTotal = 0;
const langCodes = process.argv.slice(2);
for (const lang of LANGS) {
  if (langCodes.length > 0 && !langCodes.includes(lang.code)) continue;

  const aiPath = `scripts/ai-polysemy-${lang.code}.json`;
  if (!fs.existsSync(aiPath)) {
    console.log(`${lang.code}: no polysemy file, skipping`);
    continue;
  }
  const fixes = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
  if (fixes.length === 0) continue;

  const content = fs.readFileSync(lang.file, 'utf8');
  let preDictCode, dictBody, postDictCode, dict;
  try {
    ({ preDictCode, dictBody, postDictCode } = splitFile(content, lang.varName));
    dict = parseDict(dictBody);
  } catch (e) {
    console.log(`${lang.code}: parse error: ${e.message}`);
    continue;
  }

  let applied = 0, skipped = 0, missing = 0;
  for (const fix of fixes) {
    const k = fix.k;
    if (!dict[k]) { missing++; continue; }
    const entry = dict[k];
    let changed = false;
    if (fix.en && fix.en !== entry.en) {
      entry.en = fix.en;
      changed = true;
    }
    if (fix.pos && fix.pos !== entry.pos) {
      entry.pos = fix.pos;
      changed = true;
    }
    if (changed) applied++; else skipped++;
  }
  console.log(`${lang.code}: applied=${applied}, skipped=${skipped}, missing=${missing}`);

  if (applied === 0) continue;
  const output = preDictCode + ' {' + serializeDict(dict) + '};' + postDictCode;
  fs.writeFileSync(lang.file, output);
  grandTotal += applied;
}

console.log(`\nTOTAL POLYSEMY FIXES APPLIED: ${grandTotal}`);
