#!/usr/bin/env node
/**
 * Phase A: strip grammar tips that are just a word-translation (X = Y.).
 * These add zero pedagogical value – the WordPopover already shows the
 * translation when the user taps the word.
 *
 * Phase B: detect duplicate tips that appear on >= 5 cards and report them
 * (to be replaced with varied tips in a follow-up pass).
 *
 * Run with --apply to write changes.
 */
const fs = require('fs');

const DECKS = {
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

/** True if `tip` is just a word-translation with no grammar content.
 *  Examples to strip:
 *    "मीठा = sweet."
 *    "'Achter' = behind."
 *    "Buiten = outside."
 *    "घोषणा (f.) → की."
 *    "पंखा = fan (m.)."
 *    "टीन = tin (m.)."
 *    "Pymthegfed = fifteenth"
 *    "Casual and warm."   (no actual content)
 *    "Very casual exclamation."
 */
function isTranslationOnly(tip) {
  if (!tip) return false;
  const t = tip.trim();
  if (t.length > 60) return false; // anything longer is unlikely pure translation

  // Pattern: ['"]?WORD['"]?\s*[=→]\s*WORD( \(gender\))?\.?
  // Matches lots of  X = Y , 'X' = Y, X → Y, etc.
  const TRANS_RE = /^['"“”]?[^\s='"“”=→\.]+(?:\s+[^\s='"“”=→\.]+){0,2}['"“”]?\s*[=→]\s*[^\s.;]+(?:\s+\([^)]{0,15}\))?\.?$/u;

  // Common content-free fillers
  const FILLER_RE = /^(casual\s+\w+|very\s+casual\s+\w+|standard\s+\w+|common\s+\w+|^\.+$)\.?$/i;

  return TRANS_RE.test(t) || FILLER_RE.test(t);
}

const APPLY = process.argv.includes('--apply');

let totalStripped = 0;
const dupTips = {};

for (const [lang, path] of Object.entries(DECKS)) {
  if (!fs.existsSync(path)) continue;
  const deck = JSON.parse(fs.readFileSync(path));

  // Phase A: strip pure-translation tips
  let stripped = 0;
  const stripExamples = [];
  for (const c of deck) {
    const tip = (c.grammar || '').trim();
    if (!tip) continue;
    if (isTranslationOnly(tip)) {
      if (stripExamples.length < 5) stripExamples.push({ id: c.id, tip });
      if (APPLY) c.grammar = '';
      stripped++;
    }
  }

  // Phase B: detect duplicates appearing >= 5 cards
  const counts = {};
  for (const c of deck) {
    const tip = (c.grammar || '').trim();
    if (!tip) continue;
    counts[tip] = (counts[tip] || 0) + 1;
  }
  const dups = Object.entries(counts).filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]);
  dupTips[lang] = dups.map(([tip, n]) => ({ tip, count: n }));

  console.log(`${lang.padEnd(11)} stripped ${String(stripped).padStart(4)} translation-only tips`);
  stripExamples.forEach(e => console.log(`     • ${e.id}: ${e.tip}`));

  // Phase B: among tips repeated ≥ 5 times, keep the FIRST occurrence
  // (lowest priority / earliest in deck order) and blank the rest. Cards
  // left empty here are candidates for future hand-crafted varied tips.
  let dedupedCount = 0;
  const repeatThreshold = 5;
  const repeatedTips = new Set(
    Object.entries(counts).filter(([, n]) => n >= repeatThreshold).map(([t]) => t)
  );
  if (repeatedTips.size) {
    const sortedDeck = [...deck].sort(
      (a, b) => (a.priority || 999999) - (b.priority || 999999),
    );
    const keepers = new Map(); // tip → first-encountered card id
    for (const c of sortedDeck) {
      const t = (c.grammar || '').trim();
      if (!t || !repeatedTips.has(t)) continue;
      if (!keepers.has(t)) {
        keepers.set(t, c.id);
        continue;
      }
      // not the first card with this tip → blank it
      if (APPLY) {
        const orig = deck.find(x => x.id === c.id);
        if (orig) orig.grammar = '';
      }
      dedupedCount++;
    }
    console.log(`     deduped ${dedupedCount} repeated tips (${repeatedTips.size} unique repeated, kept on first card only)`);
  }

  if (APPLY) fs.writeFileSync(path, JSON.stringify(deck, null, 2) + '\n');
  totalStripped += stripped + dedupedCount;
}

console.log(`\nTotal stripped: ${totalStripped}\n`);
console.log('=== Duplicates (tips reused on ≥5 cards) ===');
for (const [lang, list] of Object.entries(dupTips)) {
  if (list.length === 0) continue;
  console.log(`\n${lang.toUpperCase()}:`);
  for (const { tip, count } of list.slice(0, 10)) {
    console.log(`  ${String(count).padStart(3)}×  ${tip.slice(0, 110)}`);
  }
}

fs.mkdirSync('scripts/output', { recursive: true });
fs.writeFileSync('scripts/output/grammar-tip-duplicates.json', JSON.stringify(dupTips, null, 2));
console.log('\nDuplicates report: scripts/output/grammar-tip-duplicates.json');
if (!APPLY) console.log('Run with --apply to strip translation-only tips.');
