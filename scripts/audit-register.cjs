/**
 * Generic register classifier — Russian + Turkish (extensible).
 *
 * Same shape as audit-hi-register.cjs but parameterized per language:
 *   - case-insensitive matching (Hindi had no case; RU/TR do)
 *   - language-appropriate word-boundary character class
 *   - Russian gets a built-in STRUCTURAL scan for participles/gerunds,
 *     which are pattern-level offenders that can't live in the lexicon
 *     as literal strings.
 *
 * Lexicon entries whose `formal` field is a pattern description rather
 * than a literal string (starts with "-" or contains "(") are skipped by
 * the lexical matcher — the structural scan covers those for Russian.
 *
 * Run: node scripts/audit-register.cjs russian
 *      node scripts/audit-register.cjs turkish
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const LANGS = {
  russian: {
    deck: 'src/data/russian/deck.json',
    offenders: 'docs/russian-register-offenders.json',
    outPrefix: 'docs/russian-register-audit',
    // Cyrillic word characters
    wordChar: /[а-яёА-ЯЁ]/,
    lower: (s) => s.toLowerCase(),
    // NOTE: JS \b is ASCII-only and silently fails on Cyrillic — use
    // explicit (?![а-яё]) lookaheads instead.
    structural: [
      // Structural hits are CANDIDATES for the LLM pass, not auto-rewrites:
      // single-word attributive participles are often lexicalized adjectives
      // that are perfectly natural in speech (горящий дом, уставший вид).
      // The truly bookish cases — participial clauses with dependents — need
      // sentence-level judgment a regex can't make. Severity medium.
      {
        name: 'active_participle',
        // -ущий/-ющий/-ащий/-ящий + case endings
        re: /[а-яё]+(ущ|ющ|ащ|ящ)(ий|ая|ее|ие|его|ей|их|ем|им|ими|ую|юю)(?![а-яё])/gi,
        note: 'Active participle — LLM judges: lexicalized adjective (keep) vs bookish clause (который-clause)',
        severity: 'medium',
        exempt: /(следующ|настоящ|будущ|подходящ|выдающ|предыдущ|предстоящ|горящ|блестящ|кипящ|летящ|текущ)/i,
      },
      {
        name: 'past_participle',
        re: /[а-яё]{3,}вш(ий|ая|ее|ие|его|ей|их|ем|им|ими|ую|юю)(?![а-яё])/gi,
        note: 'Past active participle — LLM judges: lexicalized adjective (keep) vs bookish clause (который-clause)',
        severity: 'medium',
        exempt: /(бывш|устав|сумасшед|промокш|замёрзш|уставш)/i,
      },
      {
        name: 'gerund',
        // Target the unambiguous clause-comma pattern: -вши(сь), / -ав, / -ив,
        re: /(?<![а-яё])[а-яё]{3,}(вшись|вши|ав|ив)\s*,/gi,
        note: 'Gerund clause — convert to когда/после того как at Q1–Q3',
        severity: 'medium',
        exempt: /(разве|прав|напротив)/i,
      },
    ],
  },
  turkish: {
    deck: 'src/data/turkish/deck.json',
    offenders: 'docs/turkish-register-offenders.json',
    outPrefix: 'docs/turkish-register-audit',
    // Turkish Latin word characters
    wordChar: /[a-zA-ZçğıöşüÇĞİÖŞÜâîû]/,
    lower: (s) => s.toLocaleLowerCase('tr'),
    structural: [
      {
        name: 'makta_progressive',
        // The bare -makta/-mekte form is ambiguous with the locative of the
        // infinitive ("yazmakta zorlanıyorum" = "I struggle WITH writing" —
        // normal speech). Exempt when governed by a locative-taking verb.
        re: /\b[a-zçğıöşüâîû]+(makta|mekte)(dır|dir|dur|dür)?\b(?!\s+(zorlan|güçlük|ısrar|fayda|yarar|kararlı))/gi,
        note: 'Formal -makta/-mekte progressive — use -ıyor in speech',
        severity: 'medium',
        exempt: null,
      },
      {
        name: 'gerekmektedir',
        re: /gerekmektedir/gi,
        note: 'Bureaucratic "is required" — use gerekiyor / lazım',
        severity: 'high',
        exempt: null,
      },
    ],
  },
};

const langKey = process.argv[2];
const cfg = LANGS[langKey];
if (!cfg) {
  console.error(`Usage: node scripts/audit-register.cjs <${Object.keys(LANGS).join('|')}>`);
  process.exit(1);
}

const policy = JSON.parse(fs.readFileSync(path.join(ROOT, cfg.offenders), 'utf8'));
const deck = JSON.parse(fs.readFileSync(path.join(ROOT, cfg.deck), 'utf8'));

// Flatten lexicon; skip pattern-style entries (structural scan covers them).
const offenders = [];
let skippedPatterns = 0;
for (const [catName, cat] of Object.entries(policy.categories)) {
  for (const e of cat.entries) {
    if (/^-|[()]/.test(e.formal)) { skippedPatterns++; continue; }
    offenders.push({
      category: catName,
      formal: cfg.lower(e.formal),
      formalDisplay: e.formal,
      preferred: e.preferred,
      alt: e.alt || [],
      rom: e.rom || '',
      note: e.note || '',
      severity: e.severity || 'medium',
    });
  }
}
offenders.sort((a, b) => b.formal.length - a.formal.length);

const results = [];
for (const card of deck) {
  const target = card.target || '';
  if (!target) continue;
  const targetLower = cfg.lower(target);

  const hits = [];
  let consumed = targetLower;
  for (const o of offenders) {
    let idx = consumed.indexOf(o.formal);
    while (idx >= 0) {
      const left = consumed[idx - 1];
      const right = consumed[idx + o.formal.length];
      const isW = (c) => c && cfg.wordChar.test(c);
      if (!isW(left) && !isW(right)) {
        hits.push({
          formal: o.formalDisplay, preferred: o.preferred, alt: o.alt,
          category: o.category, rom: o.rom, note: o.note, severity: o.severity,
        });
        consumed = consumed.slice(0, idx) + ' '.repeat(o.formal.length) + consumed.slice(idx + o.formal.length);
      }
      idx = consumed.indexOf(o.formal, idx + 1);
    }
  }

  // Structural scan
  for (const s of cfg.structural || []) {
    s.re.lastIndex = 0;
    let m;
    while ((m = s.re.exec(target)) !== null) {
      if (s.exempt && s.exempt.test(m[0])) continue;
      hits.push({
        formal: m[0], preferred: '(restructure)', alt: [],
        category: `structural:${s.name}`, rom: '', note: s.note, severity: s.severity,
      });
    }
  }

  if (hits.length > 0) {
    const weight = { high: 3, medium: 2, low: 1 };
    const weightedScore = hits.reduce((s, h) => s + (weight[h.severity] || 2), 0);
    const maxSeverity = hits.some(h => h.severity === 'high') ? 'high'
      : hits.some(h => h.severity === 'medium') ? 'medium' : 'low';
    results.push({
      id: card.id, target, english: card.english || '', tags: card.tags || [],
      score: hits.length, weightedScore, maxSeverity, hits,
    });
  }
}

results.sort((a, b) => b.weightedScore - a.weightedScore || b.score - a.score || a.id.localeCompare(b.id));

const q = (s) => {
  const str = String(s ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};
const csvRows = [['id', 'score', 'target', 'english', 'tags', 'offenders', 'suggested_replacements'].join(',')];
for (const r of results) {
  csvRows.push([
    q(r.id), q(r.score), q(r.target), q(r.english), q(r.tags.join('|')),
    q(r.hits.map(h => h.formal).join(' | ')),
    q(r.hits.map(h => `${h.formal} → ${h.preferred}`).join(' | ')),
  ].join(','));
}
fs.writeFileSync(path.join(ROOT, `${cfg.outPrefix}.csv`), csvRows.join('\n'));
fs.writeFileSync(path.join(ROOT, `${cfg.outPrefix}.json`), JSON.stringify(results, null, 2));

const bySeverity = { high: 0, medium: 0, low: 0 };
const byCategory = {};
for (const r of results) {
  bySeverity[r.maxSeverity]++;
  for (const h of r.hits) byCategory[h.category] = (byCategory[h.category] || 0) + 1;
}

console.log(`[${langKey}] Cards in deck: ${deck.length}`);
console.log(`Lexicon entries used: ${offenders.length} (skipped ${skippedPatterns} pattern-style)`);
console.log(`Cards flagged: ${results.length}  (${(results.length * 100 / deck.length).toFixed(1)}%)`);
console.log(`  high:   ${bySeverity.high}`);
console.log(`  medium: ${bySeverity.medium}`);
console.log(`  low:    ${bySeverity.low}`);
console.log(`\nHits by category:`);
for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(32)} ${n}`);
}
const top = results.filter(r => r.maxSeverity === 'high').slice(0, 10);
if (top.length) {
  console.log(`\nTop ${top.length} HIGH-severity cards:`);
  for (const r of top) {
    console.log(`  [${r.id}] ${r.target}`);
    console.log(`    (${r.english})`);
    console.log(`    ${r.hits.map(h => `${h.formal} → ${h.preferred} [${h.severity}]`).join('; ')}`);
  }
}
console.log(`\nFull output: ${cfg.outPrefix}.{csv,json}`);
