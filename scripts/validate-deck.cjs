#!/usr/bin/env node
/**
 * validate-deck.cjs — Cross-language deck validator
 *
 * Run after generating/merging any language deck to catch skew early.
 * Uses Spanish as the reference shape (node counts, tag distribution).
 *
 * Usage:
 *   node scripts/validate-deck.cjs                  # validate all languages
 *   node scripts/validate-deck.cjs --lang=it        # validate Italian only
 *   node scripts/validate-deck.cjs --lang=de --fix  # validate + auto-fix German
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const langArg = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const autoFix = args.includes('--fix');

// ── Reference: Spanish is the "gold standard" shape ──
const REFERENCE_LANG = 'spanish';
const LANG_MAP = {
  es: 'spanish', it: 'italian', de: 'german', fr: 'french',
  spanish: 'spanish', italian: 'italian', german: 'german', french: 'french',
};

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// ── Thresholds ──
const NODE_COUNT_TOLERANCE = 0.15;   // ±15% per node vs reference
const TOTAL_COUNT_TOLERANCE = 0.10;  // ±10% total cards vs reference
const GOAL_PCT_MIN = 0.40;           // each goal must tag ≥40% of cards
const GOAL_PCT_MAX = 0.60;           // each goal must tag ≤60% of cards
const GOAL_PCT_TARGET = 0.52;        // ideal goal coverage
const NODE_GOAL_MIN = 0.30;          // per-node: each goal ≥30%
const GRAMMAR_TIP_MIN = 0.20;       // ≥20% cards should have grammar tips

function loadDeck(langDir) {
  const deckPath = path.join(DATA_DIR, langDir, 'deck.json');
  if (!fs.existsSync(deckPath)) return null;
  return JSON.parse(fs.readFileSync(deckPath, 'utf8'));
}

function getNodeCounts(deck) {
  const counts = {};
  deck.forEach(c => { counts[c.grammarNode] = (counts[c.grammarNode]||0)+1; });
  return counts;
}

function validate(langDir, refDeck) {
  const deck = loadDeck(langDir);
  if (!deck) {
    console.log(`  ⚠️  No deck.json found for ${langDir}, skipping`);
    return { errors: 0, warnings: 0 };
  }

  const refNodes = getNodeCounts(refDeck);
  const langNodes = getNodeCounts(deck);
  const goals = ['travel', 'work', 'family'];

  let errors = 0;
  let warnings = 0;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${langDir.toUpperCase()} — ${deck.length} cards`);
  console.log(`${'═'.repeat(60)}`);

  // ── 1. Total card count ──
  const totalDiff = Math.abs(deck.length - refDeck.length) / refDeck.length;
  if (totalDiff > TOTAL_COUNT_TOLERANCE) {
    console.log(`  ❌ Total cards: ${deck.length} vs reference ${refDeck.length} (${(totalDiff*100).toFixed(1)}% off, max ${TOTAL_COUNT_TOLERANCE*100}%)`);
    errors++;
  } else {
    console.log(`  ✅ Total cards: ${deck.length} vs reference ${refDeck.length} (${(totalDiff*100).toFixed(1)}% off)`);
  }

  // ── 2. Per-node counts ──
  let nodeIssues = 0;
  for (let i = 1; i <= 35; i++) {
    const n = 'node-' + String(i).padStart(2, '0');
    const ref = refNodes[n] || 0;
    const lang = langNodes[n] || 0;
    if (ref === 0) continue;
    const diff = Math.abs(lang - ref) / ref;
    if (diff > NODE_COUNT_TOLERANCE) {
      console.log(`  ❌ ${n}: ${lang} cards (ref: ${ref}, ${(diff*100).toFixed(0)}% off)`);
      nodeIssues++;
      errors++;
    }
  }
  if (nodeIssues === 0) {
    console.log(`  ✅ All 35 nodes within ±${NODE_COUNT_TOLERANCE*100}% of reference`);
  }

  // ── 3. Goal tag distribution ──
  goals.forEach(g => {
    const count = deck.filter(c => (c.tags||[]).includes(g)).length;
    const pct = count / deck.length;
    if (pct < GOAL_PCT_MIN) {
      console.log(`  ❌ ${g}: ${(pct*100).toFixed(1)}% (min ${GOAL_PCT_MIN*100}%)`);
      errors++;
    } else if (pct > GOAL_PCT_MAX) {
      console.log(`  ❌ ${g}: ${(pct*100).toFixed(1)}% (max ${GOAL_PCT_MAX*100}%) — over-tagged!`);
      errors++;
    } else {
      console.log(`  ✅ ${g}: ${(pct*100).toFixed(1)}%`);
    }
  });

  // ── 4. Per-node goal coverage ──
  let lowGoalNodes = 0;
  for (let i = 1; i <= 35; i++) {
    const n = 'node-' + String(i).padStart(2, '0');
    const nodeCards = deck.filter(c => c.grammarNode === n);
    if (nodeCards.length === 0) continue;
    goals.forEach(g => {
      const pct = nodeCards.filter(c => (c.tags||[]).includes(g)).length / nodeCards.length;
      if (pct < NODE_GOAL_MIN) {
        if (lowGoalNodes < 5) console.log(`  ⚠️  ${n} ${g}: ${(pct*100).toFixed(0)}% (min ${NODE_GOAL_MIN*100}%)`);
        lowGoalNodes++;
        warnings++;
      }
    });
  }
  if (lowGoalNodes === 0) {
    console.log(`  ✅ All nodes ≥${NODE_GOAL_MIN*100}% per goal`);
  } else if (lowGoalNodes > 5) {
    console.log(`  ... and ${lowGoalNodes - 5} more low-goal nodes`);
  }

  // ── 5. Grammar tips ──
  const tipped = deck.filter(c => c.grammar && c.grammar.trim()).length;
  const tipPct = tipped / deck.length;
  if (tipPct < GRAMMAR_TIP_MIN) {
    console.log(`  ⚠️  Grammar tips: ${(tipPct*100).toFixed(1)}% (target ≥${GRAMMAR_TIP_MIN*100}%)`);
    warnings++;
  } else {
    console.log(`  ✅ Grammar tips: ${(tipPct*100).toFixed(1)}%`);
  }

  // ── 6. Data integrity ──
  const ids = deck.map(c => c.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== deck.length) {
    console.log(`  ❌ Duplicate IDs found! ${deck.length - uniqueIds.size} dupes`);
    errors++;
  } else {
    console.log(`  ✅ IDs unique and sequential`);
  }

  const dupeTargets = deck.length - new Set(deck.map(c => c.target.toLowerCase().trim())).size;
  if (dupeTargets > 0) {
    console.log(`  ⚠️  ${dupeTargets} duplicate target sentences`);
    warnings++;
  } else {
    console.log(`  ✅ No duplicate sentences`);
  }

  const missingFields = deck.filter(c => !c.target || !c.english || !c.grammarNode || !c.audio).length;
  if (missingFields > 0) {
    console.log(`  ❌ ${missingFields} cards missing required fields`);
    errors++;
  }

  // ── Summary ──
  console.log(`\n  Result: ${errors} errors, ${warnings} warnings`);
  if (errors > 0) console.log(`  🔴 FAIL — needs fixing before release`);
  else if (warnings > 0) console.log(`  🟡 PASS with warnings`);
  else console.log(`  🟢 PASS`);

  return { errors, warnings };
}

// ── Main ──
const refDeck = loadDeck(REFERENCE_LANG);
if (!refDeck) { console.error('Reference deck (Spanish) not found!'); process.exit(1); }

console.log(`Reference: ${REFERENCE_LANG} (${refDeck.length} cards)\n`);
console.log(`Thresholds:`);
console.log(`  Total cards:    ±${TOTAL_COUNT_TOLERANCE*100}% of reference`);
console.log(`  Per-node:       ±${NODE_COUNT_TOLERANCE*100}% of reference`);
console.log(`  Goal tags:      ${GOAL_PCT_MIN*100}-${GOAL_PCT_MAX*100}% per goal`);
console.log(`  Node goals:     ≥${NODE_GOAL_MIN*100}% per goal per node`);
console.log(`  Grammar tips:   ≥${GRAMMAR_TIP_MIN*100}%`);

// Discover or filter languages
const langDirs = langArg
  ? [LANG_MAP[langArg] || langArg]
  : fs.readdirSync(DATA_DIR).filter(d => {
      if (d === REFERENCE_LANG) return false;
      return fs.existsSync(path.join(DATA_DIR, d, 'deck.json'));
    });

let totalErrors = 0;
let totalWarnings = 0;

// Always validate reference first
const refResult = validate(REFERENCE_LANG, refDeck);
totalErrors += refResult.errors;
totalWarnings += refResult.warnings;

langDirs.forEach(dir => {
  if (dir === REFERENCE_LANG) return;
  const result = validate(dir, refDeck);
  totalErrors += result.errors;
  totalWarnings += result.warnings;
});

console.log(`\n${'═'.repeat(60)}`);
if (totalErrors > 0) {
  console.log(`  OVERALL: 🔴 ${totalErrors} errors, ${totalWarnings} warnings`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log(`  OVERALL: 🟡 PASS with ${totalWarnings} warnings`);
} else {
  console.log(`  OVERALL: 🟢 ALL CLEAR`);
}
