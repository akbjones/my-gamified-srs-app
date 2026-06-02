#!/usr/bin/env node
/**
 * Etymology QC — anti-hallucination gate.
 *
 * Scans every entry in src/data/etymology/<lang>.ts for:
 *   - Required fields present (word, origin, note, verified, sources)
 *   - Note ≤ 150 chars
 *   - No academic jargon (PIE, *reconstructed, h₁/h₂/h₃, "Proto-Indo-European")
 *   - At least 1 source citation
 *   - Sources in the allow-list
 *   - Cross-language consistency (e.g. if "mother" is cited as a cognate
 *     in multiple languages, the etymologies must agree)
 *   - No verified: false entries (those should be removed or fixed)
 *
 * Run:
 *   node scripts/etymology/qc.cjs          # validate
 *   node scripts/etymology/qc.cjs --report # also write a markdown checklist
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — at least one issue found (build gate fails)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const WRITE_REPORT = args.includes('--report');

// ── Allowed source identifiers ──────────────────────────────────
const ALLOWED_SOURCES = new Set([
  'wiktionary', 'etymonline', 'rae', 'cnrtl', 'duden',
  'turner-cdial', 'vasmer',
]);

// ── Jargon detector — these patterns flag pedantic linguistics ──
const JARGON_PATTERNS = [
  /\bPIE\b/,
  /\bproto-indo-european\b/i,
  /\*\s*[a-záéíóúüñ]+/i,    // reconstructed forms like "*méh₂tēr"
  /h[₁₂₃]/,                  // laryngeal notations h₁, h₂, h₃
  /\bproto-slavic\b/i,
  /\bgermanic root\b/i,      // too academic — prefer "ancient root"
];

const MAX_NOTE_LENGTH = 150;

// ── Required fields ────────────────────────────────────────────
const REQUIRED_FIELDS = ['word', 'origin', 'note', 'verified', 'sources'];

// ── Load all etymology tables via simple regex parsing of the TS files ──
// (Avoids needing a TS runtime; the files have a stable export shape.)
function loadLanguageTable(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');

  // Extract each entry block: `'<key>': { ... },`
  // We parse the literal object by finding balanced braces.
  const entries = {};
  const headerRegex = /'([^']+)':\s*\{/g;
  let m;
  while ((m = headerRegex.exec(src)) !== null) {
    const key = m[1];
    const startBrace = m.index + m[0].length - 1;
    // Find matching close brace
    let depth = 1;
    let i = startBrace + 1;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    if (depth !== 0) continue;
    const body = src.slice(startBrace + 1, i - 1);
    entries[key] = parseEntryBody(body, key);
  }
  return entries;
}

function parseEntryBody(body, key) {
  const get = (field, isArray = false, isBool = false) => {
    if (isArray) {
      const m = body.match(new RegExp(field + ":\\s*\\[([^\\]]*)\\]"));
      if (!m) return undefined;
      return m[1]
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }
    if (isBool) {
      const m = body.match(new RegExp(field + ":\\s*(true|false)"));
      if (!m) return undefined;
      return m[1] === 'true';
    }
    const m = body.match(new RegExp(field + ":\\s*['\"]([^'\"]*)['\"]"));
    return m ? m[1] : undefined;
  };
  return {
    word: get('word'),
    origin: get('origin'),
    cognates: get('cognates', true) || [],
    note: get('note'),
    verified: get('verified', false, true),
    sources: get('sources', true) || [],
    _key: key,
  };
}

// ── Validate a single entry ─────────────────────────────────────
function validateEntry(entry, lang) {
  const issues = [];
  const id = `${lang}:${entry._key || entry.word}`;

  // Required fields
  for (const f of REQUIRED_FIELDS) {
    if (entry[f] === undefined || entry[f] === null) {
      issues.push({ id, severity: 'error', problem: `missing required field "${f}"` });
    }
  }

  // verified must be true
  if (entry.verified === false) {
    issues.push({ id, severity: 'error', problem: 'verified: false — entry would not display but must not ship' });
  }

  // Note length
  if (typeof entry.note === 'string' && entry.note.length > MAX_NOTE_LENGTH) {
    issues.push({ id, severity: 'error', problem: `note too long: ${entry.note.length} chars (max ${MAX_NOTE_LENGTH})` });
  }

  // Jargon detection in note
  if (typeof entry.note === 'string') {
    for (const re of JARGON_PATTERNS) {
      if (re.test(entry.note)) {
        issues.push({ id, severity: 'error', problem: `note uses jargon: ${re}` });
      }
    }
  }

  // Sources required + allow-listed
  if (Array.isArray(entry.sources)) {
    if (entry.sources.length === 0) {
      issues.push({ id, severity: 'error', problem: 'sources array is empty — at least 1 reference required' });
    }
    for (const s of entry.sources) {
      if (!ALLOWED_SOURCES.has(s)) {
        issues.push({ id, severity: 'warning', problem: `unknown source "${s}" — add to ALLOWED_SOURCES if legitimate` });
      }
    }
  }

  return issues;
}

// ── Cross-language consistency ─────────────────────────────────
// If an English cognate appears in multiple entries, the origin words
// (excluding the language family prefix) should be compatible.
function crossLanguageCheck(allTables) {
  const cognateToOrigins = {};
  for (const [lang, table] of Object.entries(allTables)) {
    for (const entry of Object.values(table)) {
      for (const cog of entry.cognates || []) {
        const key = cog.toLowerCase();
        if (!cognateToOrigins[key]) cognateToOrigins[key] = [];
        cognateToOrigins[key].push({ lang, word: entry.word, origin: entry.origin });
      }
    }
  }

  const issues = [];
  for (const [cog, origins] of Object.entries(cognateToOrigins)) {
    if (origins.length < 2) continue;
    // Strip leading language label (Latin, Sanskrit, etc.) and compare.
    // We just check that the entries DON'T contradict — same cognate
    // from supposedly unrelated families is suspicious.
    const families = new Set(origins.map(o => o.origin.split(/\s+/)[0]));
    if (families.size > 1) {
      // Multiple source families — this is OK when shared via ancient root
      // (e.g. mater via Latin & Sanskrit). Just note for review.
      issues.push({
        id: `cognate:${cog}`,
        severity: 'info',
        problem: `cognate "${cog}" appears in ${origins.length} entries across families [${[...families].join(', ')}] — verify they share an ancient root`,
      });
    }
  }
  return issues;
}

// ── Walk language files ────────────────────────────────────────
const langFiles = {
  spanish: 'src/data/etymology/es.ts',
  hindi:   'src/data/etymology/hi.ts',
  russian: 'src/data/etymology/ru.ts',
};

const allTables = {};
const allIssues = [];
let totalEntries = 0;

for (const [lang, file] of Object.entries(langFiles)) {
  if (!fs.existsSync(file)) {
    console.log(`${lang.padEnd(10)} (no data file)`);
    continue;
  }
  const table = loadLanguageTable(file);
  allTables[lang] = table;
  const count = Object.keys(table).length;
  totalEntries += count;
  console.log(`${lang.padEnd(10)} ${count} entries`);

  for (const entry of Object.values(table)) {
    const issues = validateEntry(entry, lang);
    allIssues.push(...issues);
  }
}

// Cross-language check
const xIssues = crossLanguageCheck(allTables);
allIssues.push(...xIssues);

// ── Report ─────────────────────────────────────────────────────
const errors = allIssues.filter(i => i.severity === 'error');
const warnings = allIssues.filter(i => i.severity === 'warning');
const infos = allIssues.filter(i => i.severity === 'info');

console.log('');
console.log(`Total entries:   ${totalEntries}`);
console.log(`Errors:          ${errors.length}`);
console.log(`Warnings:        ${warnings.length}`);
console.log(`Info notes:      ${infos.length}`);

if (errors.length > 0) {
  console.log('\n── ERRORS ──');
  errors.forEach(e => console.log(`  ✗ ${e.id}  ${e.problem}`));
}
if (warnings.length > 0) {
  console.log('\n── WARNINGS ──');
  warnings.forEach(w => console.log(`  ⚠ ${w.id}  ${w.problem}`));
}
if (infos.length > 0 && WRITE_REPORT) {
  console.log('\n── INFO ──');
  infos.forEach(i => console.log(`  · ${i.id}  ${i.problem}`));
}

if (WRITE_REPORT) {
  const outDir = 'scripts/output';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'etymology-qc.json'),
    JSON.stringify({ totalEntries, errors, warnings, infos }, null, 2),
  );

  // Manual checklist
  const checklistLines = ['# Etymology review checklist', ''];
  for (const [lang, table] of Object.entries(allTables)) {
    checklistLines.push(`## ${lang}`);
    for (const entry of Object.values(table)) {
      const cogs = (entry.cognates || []).join(', ');
      checklistLines.push(`- [${entry.verified ? 'x' : ' '}] **${entry.word}** — ${entry.origin}${cogs ? ' · cognates: ' + cogs : ''}`);
      checklistLines.push(`      Sources: ${(entry.sources || []).join(', ')}`);
      checklistLines.push(`      Note: ${entry.note}`);
      checklistLines.push('');
    }
  }
  fs.writeFileSync(path.join(outDir, 'etymology-review.md'), checklistLines.join('\n'));
  console.log('\nWrote scripts/output/etymology-qc.json + etymology-review.md');
}

process.exit(errors.length > 0 ? 1 : 0);
