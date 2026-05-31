#!/usr/bin/env node
/**
 * merge-all-dicts.cjs
 *
 * Universal dictionary merge script.
 * For each language: reads alignment JSON + existing .ts dictionary,
 * merges them, and splices the result back into the .ts file.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DICT_DIR = path.join(ROOT, 'src/data/dictionary');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// Languages to process (everything except Turkish which is already done)
const LANGUAGES = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'hi', 'ru'];

// ── Parse existing .ts dictionary entries ───────────────────────
function parseTsDict(filePath) {
  const src = fs.readFileSync(filePath, 'utf-8');
  const lines = src.split('\n');

  // Find the dictionary object declaration line
  let dictStartLine = -1;
  let dictVarPattern = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(?:export )?const (dictionary|DICT|dict)\s*:\s*Record<string,\s*DictEntry>\s*=\s*\{/);
    if (m) {
      dictStartLine = i;
      dictVarPattern = m[1];
      break;
    }
  }
  if (dictStartLine === -1) {
    throw new Error(`Could not find dictionary declaration in ${filePath}`);
  }

  // Find the matching closing `};`
  let dictEndLine = -1;
  let braceDepth = 1; // we're inside the opening {
  for (let i = dictStartLine + 1; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth--;
      if (braceDepth === 0) {
        dictEndLine = i;
        break;
      }
    }
    if (dictEndLine !== -1) break;
  }
  if (dictEndLine === -1) {
    throw new Error(`Could not find closing }; for dictionary in ${filePath}`);
  }

  // Parse entries between dictStartLine+1 and dictEndLine-1
  const entries = {};
  const entryRegex = /^\s+(?:'([^']*)'|"([^"]*)")\s*:\s*\{([^}]+)\}/;
  for (let i = dictStartLine + 1; i < dictEndLine; i++) {
    const line = lines[i];
    const m = line.match(entryRegex);
    if (!m) continue;
    const key = m[1] || m[2];
    const propsStr = m[3];

    const entry = {};
    // Parse en
    const enMatch = propsStr.match(/en:\s*'([^']*(?:\\'[^']*)*)'|en:\s*"([^"]*)"/);
    if (enMatch) entry.en = (enMatch[1] || enMatch[2] || '').replace(/\\'/g, "'");
    // Parse ipa
    const ipaMatch = propsStr.match(/ipa:\s*'([^']*(?:\\'[^']*)*)'|ipa:\s*"([^"]*)"/);
    if (ipaMatch) entry.ipa = (ipaMatch[1] || ipaMatch[2] || '').replace(/\\'/g, "'");
    // Parse pos
    const posMatch = propsStr.match(/pos:\s*'([^']*)'|pos:\s*"([^"]*)"/);
    if (posMatch) entry.pos = posMatch[1] || posMatch[2];
    // Parse lemma
    const lemmaMatch = propsStr.match(/lemma:\s*'([^']*(?:\\'[^']*)*)'|lemma:\s*"([^"]*)"/);
    if (lemmaMatch) entry.lemma = (lemmaMatch[1] || lemmaMatch[2] || '').replace(/\\'/g, "'");

    entries[key] = entry;
  }

  return {
    entries,
    dictStartLine,
    dictEndLine,
    dictVarName: dictVarPattern,
    header: lines.slice(0, dictStartLine + 1).join('\n'),
    footer: lines.slice(dictEndLine).join('\n'),
  };
}

// ── Compute best translation from alignment data ────────────────
function bestTranslation(alignments) {
  // Count frequency of each translation
  const counts = {};
  for (const a of alignments) {
    const en = a.en?.trim();
    if (!en || en === '?') continue;
    counts[en] = (counts[en] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  let result = sorted[0][0];

  // If 2nd meaning has count >= 2, combine
  if (sorted.length >= 2 && sorted[1][1] >= 2) {
    const combined = `${sorted[0][0]}; ${sorted[1][0]}`;
    if (combined.length <= 40) {
      result = combined;
    }
  }

  // Cap at 40 chars
  if (result.length > 40) {
    result = result.slice(0, 37) + '...';
  }

  return result;
}

// ── Format a single entry line ──────────────────────────────────
function formatEntry(key, entry) {
  // Choose quoting for key: use double quotes if key contains apostrophe
  const q = key.includes("'") ? '"' : "'";
  const keyStr = `${q}${key}${q}`;

  // Escape backslashes first, then single quotes
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  let props = `en: '${esc(entry.en)}', ipa: '${esc(entry.ipa)}'`;
  if (entry.pos && entry.pos !== '?') {
    props += `, pos: '${esc(entry.pos)}'`;
  }
  if (entry.lemma) {
    props += `, lemma: '${esc(entry.lemma)}'`;
  }

  return `  ${keyStr}: { ${props} },`;
}

// ── Process one language ────────────────────────────────────────
function processLanguage(lang) {
  const alignFile = path.join(OUTPUT_DIR, `${lang}-alignments.json`);
  const dictFile = path.join(DICT_DIR, `${lang}.ts`);

  // Read alignment file
  if (!fs.existsSync(alignFile)) {
    console.log(`  SKIP: No alignment file for ${lang}`);
    return null;
  }
  const alignData = JSON.parse(fs.readFileSync(alignFile, 'utf-8'));
  const alignments = alignData.alignments || alignData;

  // Parse existing dictionary
  const parsed = parseTsDict(dictFile);
  const existing = parsed.entries;

  // Build merged dictionary
  const merged = {};
  let updatedFromAlign = 0;
  let keptFromWiktionary = 0;
  let ipaGaps = 0;

  // Process alignment words
  for (const [word, aligns] of Object.entries(alignments)) {
    const en = bestTranslation(aligns);
    if (!en) continue; // all translations were "?"

    const ex = existing[word];
    merged[word] = {
      en: en,
      ipa: ex?.ipa || '?',
      pos: ex?.pos || '?',
    };
    if (ex?.lemma) {
      merged[word].lemma = ex.lemma;
    }
    if (merged[word].ipa === '?' || merged[word].ipa === '') ipaGaps++;
    updatedFromAlign++;
  }

  // Keep existing entries not in alignments
  for (const [word, entry] of Object.entries(existing)) {
    if (!merged[word]) {
      merged[word] = { ...entry };
      keptFromWiktionary++;
    }
  }

  // Sort entries alphabetically (locale-aware)
  const sortedKeys = Object.keys(merged).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  // Format entry lines
  const entryLines = sortedKeys.map(k => formatEntry(k, merged[k]));

  // Write intermediate output
  const entriesOutFile = path.join(OUTPUT_DIR, `${lang}-dict-entries.ts`);
  fs.writeFileSync(entriesOutFile, entryLines.join('\n') + '\n', 'utf-8');

  // Splice into actual .ts file
  const newContent = parsed.header + '\n' + entryLines.join('\n') + '\n' + parsed.footer;
  fs.writeFileSync(dictFile, newContent, 'utf-8');

  return {
    lang,
    total: sortedKeys.length,
    updatedFromAlign,
    keptFromWiktionary,
    ipaGaps,
  };
}

// ── Main ────────────────────────────────────────────────────────
function main() {
  console.log('=== Universal Dictionary Merge ===\n');

  const results = [];
  for (const lang of LANGUAGES) {
    process.stdout.write(`Processing ${lang}... `);
    try {
      const r = processLanguage(lang);
      if (r) {
        results.push(r);
        console.log(`OK (${r.total} entries)`);
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  // Summary table
  console.log('\n┌──────────┬─────────┬───────────┬──────────┬──────────┐');
  console.log('│ Language │  Total  │ Aligned   │ Wikt.    │ IPA gaps │');
  console.log('├──────────┼─────────┼───────────┼──────────┼──────────┤');
  for (const r of results) {
    console.log(
      `│ ${r.lang.padEnd(8)} │ ${String(r.total).padStart(7)} │ ${String(r.updatedFromAlign).padStart(9)} │ ${String(r.keptFromWiktionary).padStart(8)} │ ${String(r.ipaGaps).padStart(8)} │`
    );
  }
  console.log('└──────────┴─────────┴───────────┴──────────┴──────────┘');

  const totalEntries = results.reduce((s, r) => s + r.total, 0);
  const totalIpaGaps = results.reduce((s, r) => s + r.ipaGaps, 0);
  console.log(`\nTotal: ${totalEntries} entries across ${results.length} languages, ${totalIpaGaps} IPA gaps`);
}

main();
