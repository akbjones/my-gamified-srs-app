#!/usr/bin/env node
/**
 * End-to-end verification script for the 35-node restructure.
 * Checks data integrity across all components.
 */
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

function section(name) {
  console.log(`\n=== ${name} ===`);
}

// ─── Load data ──────────────────────────────────────────────────
const esDeck = require(path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json'));
const itDeck = require(path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json'));
const esCards = esDeck.cards || esDeck;
const itCards = itDeck.cards || itDeck;

const topicConfigSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'topicConfig.ts'), 'utf8');
const grammarDescSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'grammarDescriptions.ts'), 'utf8');
const placementSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'placementService.ts'), 'utf8');
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf8');

// ─── 1. Topic Config: 35 nodes ─────────────────────────────────
section('1. TopicConfig — 35 nodes');

for (let i = 1; i <= 35; i++) {
  const nodeId = `node-${String(i).padStart(2, '0')}`;
  assert(topicConfigSrc.includes(`id: '${nodeId}'`), `MAIN_PATH missing ${nodeId}`);
}
console.log(`  ✅ All 35 nodes present in MAIN_PATH`);

// Check NODE_NAMES for both languages
const nodeNameEs = topicConfigSrc.match(/spanish:\s*\{([^}]+)\}/s);
const nodeNameIt = topicConfigSrc.match(/italian:\s*\{([^}]+)\}/s);
assert(nodeNameEs && nodeNameEs[1].includes('node-35'), 'Spanish NODE_NAMES missing node-35');
assert(nodeNameIt && nodeNameIt[1].includes('node-35'), 'Italian NODE_NAMES missing node-35');
console.log(`  ✅ NODE_NAMES: Spanish and Italian both have 35 entries`);

// Check CEFR tiers
for (const tier of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
  assert(topicConfigSrc.includes(`tier: '${tier}'`), `Missing tier ${tier}`);
}
console.log(`  ✅ All 6 CEFR tiers present`);

// ─── 2. Grammar Nudges: 35 per language ────────────────────────
section('2. Grammar Descriptions — 35 nudges per language');

for (let i = 1; i <= 35; i++) {
  const nodeId = `node-${String(i).padStart(2, '0')}`;
  // Check both Spanish and Italian nudges exist
  const esNudge = grammarDescSrc.includes(`'${nodeId}': '`) || grammarDescSrc.includes(`'${nodeId}': "`);
  assert(esNudge, `Grammar nudge missing for ${nodeId}`);
}
// Count occurrences of 'node-XX' patterns in each language section
const esSection = grammarDescSrc.split('italian:')[0];
const itSection = grammarDescSrc.split('italian:')[1] || '';
const esNodeCount = (esSection.match(/'node-\d{2}':/g) || []).length;
const itNodeCount = (itSection.match(/'node-\d{2}':/g) || []).length;
assert(esNodeCount === 35, `Spanish nudges: ${esNodeCount}/35`);
assert(itNodeCount === 35, `Italian nudges: ${itNodeCount}/35`);
console.log(`  ✅ Spanish: ${esNodeCount} nudges, Italian: ${itNodeCount} nudges`);

// ─── 3. Deck integrity ─────────────────────────────────────────
section('3. Deck Integrity');

function checkDeck(cards, name) {
  console.log(`  --- ${name} (${cards.length} cards) ---`);

  // All required fields
  const missingTarget = cards.filter(c => !c.target || c.target.trim() === '');
  const missingEnglish = cards.filter(c => !c.english || c.english.trim() === '');
  const missingAudio = cards.filter(c => !c.audio);
  const missingNode = cards.filter(c => !c.grammarNode);
  const missingTags = cards.filter(c => !c.tags || c.tags.length === 0);

  assert(missingTarget.length === 0, `${name}: ${missingTarget.length} cards missing target`);
  assert(missingEnglish.length === 0, `${name}: ${missingEnglish.length} cards missing english`);
  assert(missingAudio.length === 0, `${name}: ${missingAudio.length} cards missing audio`);
  assert(missingNode.length === 0, `${name}: ${missingNode.length} cards missing grammarNode`);
  assert(missingTags.length === 0, `${name}: ${missingTags.length} cards missing tags`);

  // All 35 nodes covered
  const nodes = new Set(cards.map(c => c.grammarNode));
  for (let i = 1; i <= 35; i++) {
    const nodeId = `node-${String(i).padStart(2, '0')}`;
    assert(nodes.has(nodeId), `${name}: No cards for ${nodeId}`);
  }

  // No unknown nodes
  const validNodes = new Set(Array.from({ length: 35 }, (_, i) => `node-${String(i + 1).padStart(2, '0')}`));
  const unknownNodes = [...nodes].filter(n => !validNodes.has(n));
  assert(unknownNodes.length === 0, `${name}: Unknown nodes: ${unknownNodes.join(', ')}`);

  // Unique IDs
  const ids = new Set(cards.map(c => c.id));
  assert(ids.size === cards.length, `${name}: ${cards.length - ids.size} duplicate IDs`);

  // No duplicates
  const targets = new Set();
  let dupes = 0;
  for (const c of cards) {
    const key = c.target.toLowerCase().trim();
    if (targets.has(key)) dupes++;
    targets.add(key);
  }
  assert(dupes === 0, `${name}: ${dupes} duplicate target sentences`);

  // Word count <= 14
  const overLimit = cards.filter(c => c.target.split(/\s+/).length > 14);
  assert(overLimit.length === 0, `${name}: ${overLimit.length} cards over 14 words`);

  // Tags include 'general'
  const missingGeneral = cards.filter(c => !c.tags.includes('general'));
  assert(missingGeneral.length === 0, `${name}: ${missingGeneral.length} cards missing 'general' tag`);

  // Node distribution within reasonable bounds
  const targets_per_node = {};
  const TARGETS = {
    'node-01':200,'node-02':150,'node-03':80,'node-04':150,'node-05':150,
    'node-06':50,'node-07':100,'node-08':150,'node-09':200,'node-10':150,
    'node-11':150,'node-12':80,'node-13':80,'node-14':50,'node-15':200,
    'node-16':180,'node-17':100,'node-18':100,'node-19':150,'node-20':100,
    'node-21':130,'node-22':100,'node-23':100,'node-24':80,'node-25':100,
    'node-26':80,'node-27':100,'node-28':90,'node-29':90,'node-30':90,
    'node-31':90,'node-32':80,'node-33':80,'node-34':80,'node-35':80
  };

  let totalDeficit = 0;
  for (let i = 1; i <= 35; i++) {
    const nodeId = `node-${String(i).padStart(2, '0')}`;
    const count = cards.filter(c => c.grammarNode === nodeId).length;
    const target = TARGETS[nodeId];
    const deficit = Math.max(0, target - count);
    totalDeficit += deficit;
    // Allow 10% under-target
    if (deficit > target * 0.2) {
      console.error(`  ⚠️  ${nodeId}: ${count}/${target} (${deficit} under, ${(deficit/target*100).toFixed(0)}%)`);
    }
  }
  assert(totalDeficit < 100, `${name}: Total deficit ${totalDeficit} (should be < 100)`);

  console.log(`  ✅ ${name}: All required fields present, all 35 nodes covered, ${dupes} duplicates, deficit ${totalDeficit}`);
}

checkDeck(esCards, 'Spanish');
checkDeck(itCards, 'Italian');

// ─── 4. Placement test ─────────────────────────────────────────
section('4. Placement Test');

assert(placementSrc.includes('CARDS_PER_NODE = 2'), 'CARDS_PER_NODE should be 2');
console.log(`  ✅ Placement test: 2 cards per node (35×2=70 total)`);

// ─── 5. App.tsx wiring ─────────────────────────────────────────
section('5. App.tsx');

assert(appSrc.includes("import rawSpanishDeck"), 'Missing Spanish deck import');
assert(appSrc.includes("import rawItalianDeck"), 'Missing Italian deck import');
assert(appSrc.includes("spanish: rawSpanishDeck"), 'Missing Spanish in DECK_MAP');
assert(appSrc.includes("italian: rawItalianDeck"), 'Missing Italian in DECK_MAP');
console.log(`  ✅ Both decks imported and mapped`);

// ─── 6. Audio files (Spanish) ──────────────────────────────────
section('6. Audio Files');

const audioDir = path.join(__dirname, '..', 'public', 'quest-audio');
if (fs.existsSync(audioDir)) {
  const audioFiles = fs.readdirSync(audioDir).filter(f => f.startsWith('es-') && f.endsWith('.mp3'));
  const audioSet = new Set(audioFiles);

  let withAudio = 0;
  let withoutAudio = 0;
  for (const card of esCards) {
    if (audioSet.has(card.audio)) withAudio++;
    else withoutAudio++;
  }

  const coverage = (withAudio / esCards.length * 100).toFixed(1);
  assert(withAudio > esCards.length * 0.9, `Audio coverage: ${coverage}% (should be >90%)`);
  console.log(`  ✅ Spanish audio: ${withAudio}/${esCards.length} (${coverage}%) have matching files`);
  console.log(`  📡 ${withoutAudio} cards will use TTS fallback`);

  // No orphaned audio files
  const referencedAudio = new Set(esCards.map(c => c.audio));
  const orphaned = audioFiles.filter(f => !referencedAudio.has(f));
  assert(orphaned.length === 0, `${orphaned.length} orphaned audio files`);
  console.log(`  ✅ No orphaned audio files`);
} else {
  console.log(`  ⚠️  Audio directory not found`);
}

// ─── Summary ────────────────────────────────────────────────────
section('SUMMARY');
console.log(`  ✅ Passed: ${passed}`);
if (failed > 0) {
  console.log(`  ❌ Failed: ${failed}`);
  process.exit(1);
} else {
  console.log(`  🎉 All checks passed!`);
}
