#!/usr/bin/env node
/** Apply the second batch of missing entries (manual additions). */
const fs = require('fs');
const vm = require('vm');

const LANGS = [
  { code: 'es', file: 'src/data/dictionary/es.ts', varName: 'dictionary' },
  { code: 'fr', file: 'src/data/dictionary/fr.ts', varName: 'dictionary' },
  { code: 'cy', file: 'src/data/dictionary/cy.ts', varName: 'dict' },
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
for (const lang of LANGS) {
  const path = `scripts/ai-missing-${lang.code}2.json`;
  if (!fs.existsSync(path)) continue;
  const newEntries = JSON.parse(fs.readFileSync(path, 'utf8'));
  const content = fs.readFileSync(lang.file, 'utf8');
  const { preDictCode, dictBody, postDictCode } = splitFile(content, lang.varName);
  const dict = parseDict(dictBody);
  let added = 0;
  for (const e of newEntries) {
    if (dict[e.k]) continue;
    dict[e.k] = { en: e.en || '', ipa: e.ipa || '', pos: e.pos || 'n' };
    if (e.lemma) dict[e.k].lemma = e.lemma;
    added++;
  }
  console.log(`${lang.code}: added=${added}`);
  if (added === 0) continue;
  const output = preDictCode + ' {' + serializeDict(dict) + '};' + postDictCode;
  fs.writeFileSync(lang.file, output);
  grandTotal += added;
}
console.log(`TOTAL: ${grandTotal}`);
