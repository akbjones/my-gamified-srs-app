#!/usr/bin/env node
/**
 * Post-process AI fixes: any entry tagged pos='v' where en doesn't start with 'to '
 * is actually a clause (e.g. "it hurt", "I am under", "they call"), not an infinitive.
 *
 * Strategy:
 *   - If en starts with a subject pronoun (it/I/he/she/we/you/they/let) → pos = 'phrase'
 *   - If en starts with "is/was/were/has/have" → pos = 'phrase'
 *   - Otherwise (bare verb form like "received", "having taken") → prepend 'to '
 *     and strip participle endings as best we can
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

// Subject markers that indicate this is a clause, not a verb
const SUBJECT_RE = /^(I |i |you |he |she |it |we |they |let |my |your |his |her |their |our |if |that |what |which |who )/i;
const COPULA_RE = /^(is |are |was |were |has |have |had |will |would |should |may |might |can |could |do |does |did )/i;

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
  const content = fs.readFileSync(lang.file, 'utf8');
  let preDictCode, dictBody, postDictCode, dict;
  try {
    ({ preDictCode, dictBody, postDictCode } = splitFile(content, lang.varName));
    dict = parseDict(dictBody);
  } catch (e) {
    console.log(`${lang.code}: ERROR - ${e.message}`);
    continue;
  }

  let phrasified = 0, prefixed = 0;
  for (const [key, entry] of Object.entries(dict)) {
    if (entry.pos !== 'v') continue;
    if (!entry.en || entry.en.startsWith('to ')) continue;
    if (entry.en.includes(';')) {
      // Polysemy – check if at least one part starts with 'to '
      const parts = entry.en.split(';').map(p => p.trim());
      if (parts.some(p => p.startsWith('to '))) continue;
    }

    // Decide: clause vs bare verb
    if (SUBJECT_RE.test(entry.en) || COPULA_RE.test(entry.en)) {
      // It's a clause → mark as phrase
      entry.pos = 'phrase';
      phrasified++;
    } else {
      // Bare verb form (e.g. "received", "having taken") → prepend 'to '
      // Strip "having " prefix
      let en = entry.en.replace(/^having /, '');
      entry.en = 'to ' + en;
      prefixed++;
    }
  }

  if (phrasified === 0 && prefixed === 0) {
    console.log(`${lang.code}: clean (no fixes needed)`);
    continue;
  }

  console.log(`${lang.code}: ${phrasified} clauses → phrase, ${prefixed} verbs prefixed with 'to '`);

  const serialized = serializeDict(dict);
  const output = preDictCode + ' {' + serialized + '};' + postDictCode;
  fs.writeFileSync(lang.file, output);
  grandTotal += phrasified + prefixed;
}

console.log(`\nTOTAL FIXED: ${grandTotal}`);
