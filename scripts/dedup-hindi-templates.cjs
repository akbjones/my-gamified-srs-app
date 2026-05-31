#!/usr/bin/env node
/**
 * Remove template-duplicate cards from Hindi deck.
 *
 * Uses the same normalization as exhaustive-qc.cjs to match the 190 template groups.
 *
 * Rules:
 * - Exact English duplicates: keep first 1, remove rest
 * - Template groups (3+ cards same normalized English): keep 2 (keep 1 if all node-01)
 * - Re-sort by (grammarNode, English word count), reassign sequential IDs, preserve audio
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

console.log(`Initial deck size: ${deck.length}`);

// ── Normalization (matching exhaustive-qc.cjs) ──
const commonStarters = new Set(['I', 'The', 'A', 'An', 'My', 'We', 'You', 'He', 'She', 'It', 'They', 'Our', 'Your', 'His', 'Her', 'Its', 'Their', 'This', 'That', 'These', 'Those', 'There', 'Here', 'What', 'Where', 'When', 'Who', 'How', 'Why', 'Which', 'Do', 'Does', 'Did', 'Is', 'Are', 'Was', 'Were', 'Have', 'Has', 'Had', 'Can', 'Could', 'Would', 'Should', 'Will', 'Shall', 'May', 'Might', 'Must', 'Let', 'Please', 'Every', 'Each', 'Some', 'No', 'Not', 'All', 'Both', 'Either', 'Neither', 'If', 'After', 'Before', 'During', 'Since', 'Until', 'While', 'Although', 'Because', 'So', 'But', 'And', 'Or', 'Nor', 'For', 'Yet', 'Still', 'Most', 'Many', 'Much', 'Few', 'Several', 'Only', 'Just', 'Even', 'Also', 'Too', 'Very', 'Really', 'Quite', 'Rather', 'Almost', 'Nearly', 'Hardly', 'Barely', 'Absolutely', 'Actually', 'Apparently', 'Certainly', 'Clearly', 'Definitely', 'Fortunately', 'Generally', 'Honestly', 'Hopefully', 'Ideally', 'Incidentally', 'Luckily', 'Obviously', 'Personally', 'Possibly', 'Presumably', 'Probably', 'Recently', 'Strangely', 'Supposedly', 'Surprisingly', 'Traditionally', 'Typically', 'Unfortunately', 'Usually', 'Sometimes', 'Always', 'Never', 'Often', 'Rarely', 'Seldom', 'Suddenly', 'Immediately', 'Eventually', 'Finally', 'First', 'Last', 'Next', 'Then', 'Now', 'Today', 'Tomorrow', 'Yesterday', 'Already', 'Soon']);

function normalizeEnglish(eng) {
  const words = eng.trim().split(/\s+/);
  return words.map((w, i) => {
    // Any capitalized word after position 0 → X
    if (i > 0 && /^[A-Z]/.test(w)) return 'X';
    // First word: if it's a name (capitalized, not a common starter)
    if (i === 0 && /^[A-Z][a-z]+$/.test(w)) {
      if (!commonStarters.has(w)) return 'X';
    }
    return w;
  }).join(' ');
}

// ── Step 1: Find exact English duplicates ──
const exactMap = new Map();
for (const card of deck) {
  const key = card.english.trim();
  if (!exactMap.has(key)) exactMap.set(key, []);
  exactMap.get(key).push(card);
}

const exactDupeGroups = [];
for (const [eng, cards] of exactMap) {
  if (cards.length >= 2) {
    exactDupeGroups.push({ english: eng, cards, type: 'exact' });
  }
}
console.log(`\nExact duplicate groups: ${exactDupeGroups.length}`);
for (const g of exactDupeGroups) {
  console.log(`  "${g.english}" → ${g.cards.length} cards: ${g.cards.map(c => c.id).join(', ')}`);
}

// ── Step 2: Detect template groups ──
const templateMap = new Map();
for (const card of deck) {
  const norm = normalizeEnglish(card.english);
  if (!templateMap.has(norm)) templateMap.set(norm, []);
  templateMap.get(norm).push(card);
}

const templateGroups = [];
for (const [norm, cards] of templateMap) {
  if (cards.length >= 3) {
    templateGroups.push({ normalized: norm, cards, type: 'template' });
  }
}

console.log(`\nTemplate groups (3+ cards with same normalized English): ${templateGroups.length}`);

// Verify: look at groups to make sure they're real templates (check that only proper nouns differ)
// Flag any suspicious groups where the non-X words differ
let totalTemplateCards = 0;
let suspiciousGroups = 0;
for (const g of templateGroups) {
  totalTemplateCards += g.cards.length;

  // Check if this is a genuine template: all cards should differ only in the X positions
  const normalized = g.normalized;
  const xPositions = normalized.split(/\s+/).reduce((acc, w, i) => {
    if (w === 'X') acc.push(i);
    return acc;
  }, []);

  // Check non-X positions are identical across all cards
  const firstWords = g.cards[0].english.trim().split(/\s+/);
  let suspicious = false;
  for (let ci = 1; ci < g.cards.length; ci++) {
    const cardWords = g.cards[ci].english.trim().split(/\s+/);
    if (cardWords.length !== firstWords.length) { suspicious = true; break; }
    for (let wi = 0; wi < firstWords.length; wi++) {
      if (xPositions.includes(wi)) continue;
      if (cardWords[wi] !== firstWords[wi]) { suspicious = true; break; }
    }
    if (suspicious) break;
  }

  if (suspicious) {
    suspiciousGroups++;
    console.log(`  [SUSPICIOUS] "${normalized}" → ${g.cards.length} cards`);
    for (const c of g.cards) {
      console.log(`    ${c.id}: "${c.english}"`);
    }
  }
}
console.log(`Total cards in template groups: ${totalTemplateCards}`);
console.log(`Suspicious groups (may not be real templates): ${suspiciousGroups}`);

// ── Step 3: Determine which cards to remove ──
const removeIds = new Set();

// Exact dupes: keep first, remove rest
for (const g of exactDupeGroups) {
  for (let i = 1; i < g.cards.length; i++) {
    removeIds.add(g.cards[i].id);
  }
}
console.log(`\nCards to remove from exact dupes: ${removeIds.size}`);

// Template groups: keep 2 (or 1 if all in node-01), remove rest
// Skip suspicious groups
for (const g of templateGroups) {
  const normalized = g.normalized;
  const xPositions = normalized.split(/\s+/).reduce((acc, w, i) => {
    if (w === 'X') acc.push(i);
    return acc;
  }, []);

  // Verify non-X positions are identical
  const firstWords = g.cards[0].english.trim().split(/\s+/);
  let suspicious = false;
  for (let ci = 1; ci < g.cards.length; ci++) {
    const cardWords = g.cards[ci].english.trim().split(/\s+/);
    if (cardWords.length !== firstWords.length) { suspicious = true; break; }
    for (let wi = 0; wi < firstWords.length; wi++) {
      if (xPositions.includes(wi)) continue;
      if (cardWords[wi] !== firstWords[wi]) { suspicious = true; break; }
    }
    if (suspicious) break;
  }

  if (suspicious) continue; // Skip suspicious groups

  const allNode01 = g.cards.every(c => c.grammarNode === 'node-01');
  const keepCount = allNode01 ? 1 : 2;

  for (let i = keepCount; i < g.cards.length; i++) {
    removeIds.add(g.cards[i].id);
  }
}

console.log(`Total cards to remove (exact + template, skipping suspicious): ${removeIds.size}`);

// ── Step 4: Filter deck ──
const filtered = deck.filter(c => !removeIds.has(c.id));
console.log(`Cards remaining after removal: ${filtered.length}`);

// ── Step 5: Re-sort by (grammarNode, English word count) ──
function nodeNum(node) {
  const m = node.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

filtered.sort((a, b) => {
  const na = nodeNum(a.grammarNode);
  const nb = nodeNum(b.grammarNode);
  if (na !== nb) return na - nb;

  const wa = a.english.split(/\s+/).length;
  const wb = b.english.split(/\s+/).length;
  return wa - wb;
});

// ── Step 6: Reassign sequential IDs, preserve audio ──
for (let i = 0; i < filtered.length; i++) {
  const newId = `hi-${String(i + 1).padStart(4, '0')}`;
  filtered[i].id = newId;
}

// ── Step 7: Write back ──
fs.writeFileSync(DECK_PATH, JSON.stringify(filtered, null, 2) + '\n', 'utf8');

console.log(`\nFinal deck written: ${filtered.length} cards`);

// Show node distribution
const nodeCount = {};
for (const c of filtered) {
  nodeCount[c.grammarNode] = (nodeCount[c.grammarNode] || 0) + 1;
}
console.log('\nNode distribution:');
for (const [node, count] of Object.entries(nodeCount).sort((a, b) => nodeNum(a[0]) - nodeNum(b[0]))) {
  console.log(`  ${node}: ${count}`);
}

// Show first 10 cards
console.log('\nFirst 10 cards:');
for (let i = 0; i < 10 && i < filtered.length; i++) {
  const c = filtered[i];
  console.log(`  ${c.id} [${c.grammarNode}] "${c.english}" → audio: ${c.audio}`);
}

// Show grammar tip coverage
const withTip = filtered.filter(c => c.grammar && c.grammar.trim()).length;
console.log(`\nGrammar tips: ${withTip}/${filtered.length} (${(100*withTip/filtered.length).toFixed(1)}%)`);

// Verify no remaining exact dupes
const postExactMap = new Map();
for (const c of filtered) {
  const k = c.english.trim();
  postExactMap.set(k, (postExactMap.get(k) || 0) + 1);
}
const remainingDupes = [...postExactMap.entries()].filter(([, n]) => n > 1);
console.log(`\nRemaining exact English duplicates: ${remainingDupes.length}`);
if (remainingDupes.length > 0) {
  for (const [eng, n] of remainingDupes.slice(0, 5)) {
    console.log(`  "${eng}" × ${n}`);
  }
}

// Verify no remaining template groups of 3+
const postTemplateMap = new Map();
for (const c of filtered) {
  const norm = normalizeEnglish(c.english);
  postTemplateMap.set(norm, (postTemplateMap.get(norm) || 0) + 1);
}
const remainingTemplates = [...postTemplateMap.entries()].filter(([, n]) => n >= 3);
console.log(`Remaining template groups (3+): ${remainingTemplates.length}`);
if (remainingTemplates.length > 0) {
  for (const [norm, n] of remainingTemplates.slice(0, 5)) {
    console.log(`  "${norm}" × ${n}`);
  }
}
