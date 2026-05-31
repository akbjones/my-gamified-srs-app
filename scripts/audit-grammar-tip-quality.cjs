#!/usr/bin/env node
/**
 * Audit the `grammar` field on every card across all 11 languages and
 * classify each tip's quality. Outputs:
 *   - per-language summary table
 *   - scripts/output/grammar-tips-low-quality.json with cards to rewrite
 *
 * Low-quality tags (each tip can match several):
 *   too-short        tip < 25 chars ("Past tense." is useless)
 *   no-takeaway      no actionable language ("use", "remember", "don't", …)
 *   jargon-only      a single grammatical-jargon noun phrase
 *                    ("subjunctive mood"; "auxiliary verb")
 *   verb-pattern     "X → Xs in 3rd person singular" — pattern recitation
 *   meta             describes the card itself instead of grammar
 */
const fs = require('fs');

const LANGS = {
  spanish:    'src/data/spanish/deck.json',
  italian:    'src/data/italian/deck.json',
  french:     'src/data/french/deck.json',
  portuguese: 'src/data/portuguese/deck.json',
  german:     'src/data/german/deck.json',
  dutch:      'src/data/dutch/deck.json',
  swedish:    'src/data/swedish/deck.json',
  welsh:      'src/data/welsh/deck.json',
  hindi:      'src/data/hindi/deck.json',
  turkish:    'src/data/turkish/deck.json',
  russian:    'src/data/russian/deck.json',
};

const ACTIONABLE_TOKENS = [
  'use', 'used', 'using',
  'remember', 'note that',
  'always', 'never',
  "don't", 'do not', "doesn't",
  'instead of',
  'be careful', 'careful',
  'watch out',
  'unlike english', 'unlike french', 'unlike spanish',
  'tip:', 'hint:',
  'common mistake', 'common error',
  'literally', 'literal',
];

const PURE_DESCRIPTION_KEYWORDS = [
  'this is the', 'this sentence', 'this verb', 'this card',
];

const VERB_PATTERN_RE = /\b(-[aeiou]+)\b\s+(?:becomes|→|->|=)\s+\b(-[a-z]+)\b/i;

const JARGON_PATTERNS = [
  /^(present|past|future|perfect|imperfect|preterite|conditional|subjunctive|imperative|infinitive)( tense)?\.?$/i,
  /^(masculine|feminine|neuter|singular|plural)( form)?\.?$/i,
  /^(auxiliary|modal|reflexive|transitive|intransitive)( verb)?\.?$/i,
];

function classify(tip) {
  if (!tip) return ['empty'];
  const t = tip.trim();
  const lower = t.toLowerCase();
  const tags = [];
  if (t.length < 25) tags.push('too-short');
  if (JARGON_PATTERNS.some(re => re.test(t))) tags.push('jargon-only');
  if (PURE_DESCRIPTION_KEYWORDS.some(k => lower.includes(k))) tags.push('meta');
  if (!ACTIONABLE_TOKENS.some(tok => lower.includes(tok))) tags.push('no-takeaway');
  if (VERB_PATTERN_RE.test(t)) tags.push('verb-pattern');
  return tags;
}

const summary = {};
const lowQuality = {};

for (const [lang, path] of Object.entries(LANGS)) {
  if (!fs.existsSync(path)) continue;
  const deck = JSON.parse(fs.readFileSync(path));
  const stats = { total: deck.length, withTip: 0, byTag: {}, lowCount: 0 };
  const flagged = [];
  for (const c of deck) {
    const tip = (c.grammar || '').trim();
    if (!tip) continue;
    stats.withTip++;
    const tags = classify(tip);
    for (const t of tags) stats.byTag[t] = (stats.byTag[t] || 0) + 1;
    // High-confidence "low quality" only: a short tip is fine if it's
    // actionable, but anything tagged short+no-takeaway is genuinely useless.
    const high = tags.includes('too-short') || tags.includes('jargon-only') || tags.includes('verb-pattern') || tags.includes('meta');
    const shortAndVague = tags.includes('too-short') && tags.includes('no-takeaway');
    const isLow = high || shortAndVague;
    if (isLow) {
      stats.lowCount++;
      flagged.push({ id: c.id, target: c.target, english: c.english, grammar: tip, tags, node: c.grammarNode });
    }
  }
  summary[lang] = stats;
  lowQuality[lang] = flagged;
}

console.log('=== Grammar tip quality summary ===\n');
console.log('lang        cards   tipped    short    no-tk   jargon   verb-pat   LOW(%)');
for (const [lang, s] of Object.entries(summary)) {
  const pct = s.withTip > 0 ? ((s.lowCount / s.withTip) * 100).toFixed(0) : '0';
  console.log(
    lang.padEnd(11) +
    s.total.toString().padStart(6) +
    s.withTip.toString().padStart(9) +
    (s.byTag['too-short']    || 0).toString().padStart(9) +
    (s.byTag['no-takeaway']  || 0).toString().padStart(9) +
    (s.byTag['jargon-only']  || 0).toString().padStart(9) +
    (s.byTag['verb-pattern'] || 0).toString().padStart(11) +
    `   ${s.lowCount} (${pct}%)`
  );
}

console.log('\nWorst 5 examples per language:\n');
for (const [lang, list] of Object.entries(lowQuality)) {
  if (list.length === 0) continue;
  console.log(`--- ${lang.toUpperCase()} ---`);
  for (const f of list.slice(0, 5)) {
    console.log(`  [${f.tags.join(',')}] ${f.id}`);
    console.log(`    target:  ${f.target.slice(0, 60)}`);
    console.log(`    grammar: ${f.grammar}`);
  }
  console.log();
}

fs.mkdirSync('scripts/output', { recursive: true });
fs.writeFileSync('scripts/output/grammar-tips-low-quality.json', JSON.stringify(lowQuality, null, 2));
fs.writeFileSync('scripts/output/grammar-tips-summary.json', JSON.stringify(summary, null, 2));
console.log('Reports written to scripts/output/grammar-tips-*.json');
