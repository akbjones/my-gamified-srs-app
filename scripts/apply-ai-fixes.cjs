#!/usr/bin/env node
/**
 * Apply AI semantic audit fixes directly to dictionary files.
 *
 * Reads scripts/ai-fixes-{lang}.json files (output of ai-semantic-audit.py)
 * and applies the corrections in-memory using the proven Parse → Fix → Write approach.
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

function parseDict(body) {
  return vm.runInNewContext('({' + body + '})', {}, { timeout: 10000 });
}

function serializeDict(dict) {
  const lines = [];
  for (const [key, entry] of Object.entries(dict)) {
    const escKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escEn = (entry.en || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escIpa = (entry.ipa || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    let line = `  '${escKey}': { en: '${escEn}', ipa: '${escIpa}', pos: '${entry.pos || 'n'}'`;
    if (entry.lemma) {
      line += `, lemma: '${entry.lemma.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }
    line += ' },';
    lines.push(line);
  }
  return '\n' + lines.join('\n') + '\n';
}

let grandTotal = 0;

for (const lang of LANGS) {
  const fixesPath = `scripts/ai-fixes-${lang.code}.json`;
  if (!fs.existsSync(fixesPath)) {
    console.log(`${lang.code}: no fixes file, skipping`);
    continue;
  }

  const fixes = JSON.parse(fs.readFileSync(fixesPath, 'utf8'));
  if (fixes.length === 0) {
    console.log(`${lang.code}: 0 fixes, skipping`);
    continue;
  }

  // Load dict
  const content = fs.readFileSync(lang.file, 'utf8');
  let preDictCode, dictBody, postDictCode, dict;
  try {
    ({ preDictCode, dictBody, postDictCode } = splitFile(content, lang.varName));
    dict = parseDict(dictBody);
  } catch (e) {
    console.log(`${lang.code}: ERROR - ${e.message}`);
    continue;
  }

  let applied = 0, skipped = 0, missing = 0;

  for (const fix of fixes) {
    const key = fix.k;
    if (!dict[key]) {
      missing++;
      continue;
    }
    const entry = dict[key];
    let changed = false;

    // Apply en if different
    if (fix.en && fix.en !== entry.en) {
      entry.en = fix.en;
      changed = true;
    }

    // Apply pos if different and meaningful
    if (fix.pos && fix.pos !== entry.pos) {
      entry.pos = fix.pos;
      changed = true;
    }

    if (changed) applied++;
    else skipped++;
  }

  console.log(`${lang.code}: applied=${applied}, skipped=${skipped} (no change), missing=${missing} (not in dict)`);

  // Write back
  const serialized = serializeDict(dict);
  const output = preDictCode + ' {' + serialized + '};' + postDictCode;
  fs.writeFileSync(lang.file, output);
  grandTotal += applied;
}

console.log(`\nTOTAL APPLIED: ${grandTotal}`);
