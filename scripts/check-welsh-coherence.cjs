#!/usr/bin/env node
/**
 * Regression guard against the "template + random-vocabulary" word-salad that
 * once polluted the Welsh deck (e.g. "boil denim and winding cave", "judo more
 * warm than heatwave", "your ankle bone and your bark are jealous"). 93 such
 * cards were rewritten 2026-07-14; this stops any of them silently returning.
 *
 * Two layers (both English-gloss based — the generator produced the gloss from
 * the same random slots, so it is a faithful proxy):
 *  1. EXACT regression: none of the 93 known-garbled glosses (welsh-salad-
 *     snapshot.json) may reappear. Zero false positives.
 *  2. Curated heuristics: a small set of genuinely-impossible collocations and
 *     the distinctive copula-less comparative-salad shape ("<noun> more <adj>
 *     than <noun>"), which real comparisons ("The town is busier than…") never
 *     match. Deliberately conservative to avoid flagging legitimate "X and Y".
 *
 * Exits non-zero if any offender is found, so it can gate CI.
 * Usage: node scripts/check-welsh-coherence.cjs [path-to-deck.json]
 */
const fs = require('fs');
const path = require('path');

const deckPath = process.argv[2] || path.resolve(__dirname, '..', 'src/data/welsh/deck.json');
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

let snapshot = {};
try {
  snapshot = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'welsh-salad-snapshot.json'), 'utf8'));
} catch { /* snapshot optional */ }
const knownGarbled = new Set(Object.values(snapshot).map(s => s.trim().toLowerCase()));

// Distinctive salad shapes that legitimate sentences don't take.
const COMPARATIVE_SALAD = /^(?:the\s+)?\w+\s+more\s+\w+\s+than\s+(?:the\s+)?\w+\.?$/i; // "judo more warm than heatwave"
const IMPOSSIBLE = [
  /jealous (?:fence|bark|journey|wind)/i, /boil denim/i, /winding (?:talent|cave)/i,
  /\bankle bone\b/i, /wise wind/i, /laughing roebuck/i,
  /(?:cooked|broke|built|lost|found|got|washed)\s+\w+\s+\w+\s+and\s+(?:elbow|swan|rain|smell|hip|beer|harmonica|headteacher|kiln|chef|laptop|hospital|timetable)\b/i,
];

const offenders = [];
for (const c of deck) {
  const e = (c.english || '').trim();
  const el = e.toLowerCase();
  let why = null;
  if (knownGarbled.has(el)) why = 'known-garbled gloss returned';
  else if (COMPARATIVE_SALAD.test(e)) why = 'comparative word-salad shape';
  else if (IMPOSSIBLE.some(re => re.test(e))) why = 'impossible collocation';
  if (why) offenders.push({ id: c.id, node: c.grammarNode, english: e, why });
}

if (offenders.length) {
  console.error(`\n✗ Welsh coherence check FAILED — ${offenders.length} suspected word-salad card(s):`);
  offenders.slice(0, 80).forEach(o => console.error(`  ${o.id} [${o.node}] (${o.why}) ${o.english}`));
  if (offenders.length > 80) console.error(`  … and ${offenders.length - 80} more`);
  process.exit(1);
}
console.log(`✓ Welsh coherence check passed — ${deck.length} cards, no word-salad (${path.basename(deckPath)}).`);
