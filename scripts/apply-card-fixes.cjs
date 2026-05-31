#!/usr/bin/env node
/**
 * Apply card-level AI fixes to dictionaries.
 * Reads scripts/ai-card-issues-{lang}.jsonl, extracts {fix: ...} lines,
 * applies them via Parse → Edit → Write.
 *
 * Also writes a markdown report of all issues for human review.
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
const allIssues = {};

for (const lang of LANGS) {
  const path = `scripts/ai-card-issues-${lang.code}.jsonl`;
  if (!fs.existsSync(path)) {
    console.log(`${lang.code}: no card-issues file, skipping`);
    continue;
  }
  const lines = fs.readFileSync(path, 'utf8').split('\n').filter(l => l.trim());
  const fixes = [];
  const issues = [];
  for (const line of lines) {
    try {
      const j = JSON.parse(line);
      if (j.fix) fixes.push(j.fix);
      if (j.issue) issues.push(j);
    } catch {}
  }
  console.log(`${lang.code}: ${issues.length} issues, ${fixes.length} fixes proposed`);
  allIssues[lang.code] = issues;

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

  let applied = 0, added = 0;
  for (const fix of fixes) {
    if (!fix.k || !fix.en) continue;
    const k = fix.k;
    if (dict[k]) {
      // Update existing
      dict[k].en = fix.en;
      if (fix.pos) dict[k].pos = fix.pos;
      applied++;
    } else {
      // Add new (multi-word phrases often)
      dict[k] = { en: fix.en, ipa: '', pos: fix.pos || 'phrase' };
      added++;
    }
  }
  console.log(`  applied=${applied}, added=${added}`);

  const output = preDictCode + ' {' + serializeDict(dict) + '};' + postDictCode;
  fs.writeFileSync(lang.file, output);
  grandTotal += applied + added;
}

console.log(`\nTOTAL DICT CHANGES: ${grandTotal}`);

// Write markdown report
let md = '# AI Card-Level Audit Report\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;
for (const [lang, issues] of Object.entries(allIssues)) {
  md += `## ${lang.toUpperCase()} (${issues.length} issues)\n\n`;
  // Group by severity
  const high = issues.filter(i => i.severity === 'high');
  const med = issues.filter(i => i.severity === 'medium');
  const low = issues.filter(i => i.severity === 'low');
  md += `- **High**: ${high.length}\n- **Medium**: ${med.length}\n- **Low**: ${low.length}\n\n`;
  if (high.length > 0) {
    md += `### High-severity samples\n\n`;
    for (const i of high.slice(0, 10)) {
      md += `- **${i.id}** (${i.issue}): ${i.note}\n`;
    }
    md += '\n';
  }
}
fs.writeFileSync('scripts/ai-card-audit-report.md', md);
console.log('Wrote report: scripts/ai-card-audit-report.md');
