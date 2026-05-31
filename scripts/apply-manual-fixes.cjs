#!/usr/bin/env node
/**
 * Apply manual dict fixes from a JSON map of {lang: [{k, en, pos, ipa?}]}.
 * Adds entries that don't exist, updates ones that do.
 */
const fs = require('fs');
const vm = require('vm');

const VARS = {
  es: 'dictionary', fr: 'dictionary', it: 'dictionary', pt: 'dictionary',
  de: 'DICT', nl: 'dictionary', sv: 'dictionary', cy: 'dict',
  hi: 'dictionary', tr: 'dictionary', ru: 'dictionary',
};

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

const file = process.argv[2] || 'scripts/manual-bill-fixes.json';
const allFixes = JSON.parse(fs.readFileSync(file, 'utf8'));

let total = 0;
for (const [lang, fixes] of Object.entries(allFixes)) {
  if (!VARS[lang]) continue;
  const content = fs.readFileSync(`src/data/dictionary/${lang}.ts`, 'utf8');
  let preDictCode, dictBody, postDictCode, dict;
  try {
    ({ preDictCode, dictBody, postDictCode } = splitFile(content, VARS[lang]));
    dict = parseDict(dictBody);
  } catch (e) { console.log(`${lang}: ERROR - ${e.message}`); continue; }

  let added = 0, updated = 0;
  for (const fix of fixes) {
    if (dict[fix.k]) {
      // Update
      dict[fix.k].en = fix.en;
      if (fix.pos) dict[fix.k].pos = fix.pos;
      if (fix.ipa) dict[fix.k].ipa = fix.ipa;
      updated++;
    } else {
      // Add
      dict[fix.k] = { en: fix.en, ipa: fix.ipa || '', pos: fix.pos || 'n' };
      if (fix.lemma) dict[fix.k].lemma = fix.lemma;
      added++;
    }
  }
  console.log(`${lang}: updated=${updated}, added=${added}`);
  if (updated + added === 0) continue;
  const output = preDictCode + ' {' + serializeDict(dict) + '};' + postDictCode;
  fs.writeFileSync(`src/data/dictionary/${lang}.ts`, output);
  total += updated + added;
}
console.log(`\nTOTAL: ${total}`);
