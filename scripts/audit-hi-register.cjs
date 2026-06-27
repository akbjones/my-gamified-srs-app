/**
 * Hindi register classifier.
 *
 * Reads docs/hindi-register-offenders.json and src/data/hindi/deck.json.
 * For each card, scans the target sentence for occurrences of formal Hindi
 * words from the offender list and emits a "formality score" plus the
 * matched offenders + their preferred everyday-speech replacements.
 *
 * Output:
 *   - docs/hindi-register-audit.csv     — ranked CSV for the user to scan
 *   - docs/hindi-register-audit.json    — same data as JSON for downstream
 *                                          scripts to consume (Phase 3 swap
 *                                          generator)
 *
 * Run: node scripts/audit-hi-register.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POLICY = path.join(ROOT, 'docs', 'hindi-register-offenders.json');
const DECK = path.join(ROOT, 'src', 'data', 'hindi', 'deck.json');
const OUT_CSV = path.join(ROOT, 'docs', 'hindi-register-audit.csv');
const OUT_JSON = path.join(ROOT, 'docs', 'hindi-register-audit.json');

const policy = JSON.parse(fs.readFileSync(POLICY, 'utf8'));
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));

// Flatten the offender list into one searchable array. Compound entries
// like "भोजन करना" need word-boundary matching, single-word entries can
// substring-match.
const offenders = [];
for (const [catName, cat] of Object.entries(policy.categories)) {
  for (const e of cat.entries) {
    offenders.push({
      category: catName,
      formal: e.formal,
      preferred: e.preferred,
      alt: e.alt || [],
      rom: e.rom || '',
      note: e.note || '',
      severity: e.severity || 'medium',
      isCompound: /\s/.test(e.formal),
    });
  }
}

// Sort longest-first so "भोजन करना" matches before "भोजन" alone.
offenders.sort((a, b) => b.formal.length - a.formal.length);

const results = [];
for (const card of deck) {
  const target = card.target || '';
  if (!target) continue;

  const hits = [];
  // Mark used spans so we don't double-count "भोजन" after matching "भोजन करना".
  let consumed = target;
  for (const o of offenders) {
    // Word boundary: Devanagari doesn't have ASCII \b. Use a manual check
    // that the matched span is not embedded in a longer Devanagari word.
    let idx = consumed.indexOf(o.formal);
    while (idx >= 0) {
      // Check left + right context — must be whitespace, punctuation, or
      // string boundary. This catches the "नियुक्ति" inside "अनियुक्ति"
      // false positive.
      const left = consumed[idx - 1];
      const right = consumed[idx + o.formal.length];
      const isWordChar = (c) => c && /[ऀ-ॿ]/.test(c);
      const okLeft = !left || !isWordChar(left);
      const okRight = !right || !isWordChar(right);
      if (okLeft && okRight) {
        hits.push({
          formal: o.formal,
          preferred: o.preferred,
          alt: o.alt,
          category: o.category,
          rom: o.rom,
          note: o.note,
          severity: o.severity,
        });
        // Blank out the matched span so shorter offenders don't re-match it.
        consumed = consumed.slice(0, idx) + ' '.repeat(o.formal.length) + consumed.slice(idx + o.formal.length);
      }
      idx = consumed.indexOf(o.formal, idx + 1);
    }
  }

  if (hits.length > 0) {
    // Weighted score: high=3, medium=2, low=1. Cards with one "high" offender
    // (शौचालय) outrank cards with two "low" offenders (समय used twice).
    const weight = { high: 3, medium: 2, low: 1 };
    const weightedScore = hits.reduce((s, h) => s + (weight[h.severity] || 2), 0);
    const maxSeverity = hits.some(h => h.severity === 'high') ? 'high'
      : hits.some(h => h.severity === 'medium') ? 'medium'
      : 'low';
    results.push({
      id: card.id,
      target,
      english: card.english || '',
      tags: card.tags || [],
      score: hits.length,
      weightedScore,
      maxSeverity,
      hits,
    });
  }
}

// Rank: weighted score first, then severity, then hit count.
results.sort((a, b) => b.weightedScore - a.weightedScore || b.score - a.score || a.id.localeCompare(b.id));

// CSV — quote any field that contains commas, quotes, or newlines.
const q = (s) => {
  const str = String(s ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};
const csvRows = [
  ['id', 'score', 'target', 'english', 'tags', 'offenders', 'suggested_replacements'].join(','),
];
for (const r of results) {
  csvRows.push([
    q(r.id),
    q(r.score),
    q(r.target),
    q(r.english),
    q(r.tags.join('|')),
    q(r.hits.map(h => h.formal).join(' | ')),
    q(r.hits.map(h => `${h.formal} → ${h.preferred}`).join(' | ')),
  ].join(','));
}
fs.writeFileSync(OUT_CSV, csvRows.join('\n'));
fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));

// Summary to stdout
const totalCards = deck.length;
const flagged = results.length;
const bySeverity = { high: 0, medium: 0, low: 0 };
const byCategory = {};
for (const r of results) {
  bySeverity[r.maxSeverity]++;
  for (const h of r.hits) {
    byCategory[h.category] = (byCategory[h.category] || 0) + 1;
  }
}

console.log(`Cards in deck: ${totalCards}`);
console.log(`Cards flagged: ${flagged}  (${(flagged * 100 / totalCards).toFixed(1)}%)`);
console.log(`  high severity:   ${bySeverity.high}   (definite swap, nobody says this)`);
console.log(`  medium severity: ${bySeverity.medium}  (textbook-formal, default-swap)`);
console.log(`  low severity:    ${bySeverity.low}   (both registers natural; swap only if surrounding text is casual)`);
console.log(`\nHits by category:`);
for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(28)} ${n}`);
}

const showRange = (label, sev, n = 8) => {
  const items = results.filter(r => r.maxSeverity === sev).slice(0, n);
  if (items.length === 0) return;
  console.log(`\nTop ${items.length} ${label} cards:`);
  for (const r of items) {
    const swaps = r.hits.map(h => `${h.formal} → ${h.preferred} [${h.severity}]`).join('; ');
    console.log(`  [${r.id}] wscore=${r.weightedScore}`);
    console.log(`    ${r.target}`);
    console.log(`    (${r.english})`);
    console.log(`    SWAP: ${swaps}`);
  }
};
showRange('HIGH-severity', 'high', 10);
showRange('MEDIUM-severity', 'medium', 8);
showRange('LOW-severity (borderline)', 'low', 4);
console.log(`\nFull output:`);
console.log(`  ${path.relative(ROOT, OUT_CSV)}`);
console.log(`  ${path.relative(ROOT, OUT_JSON)}`);
