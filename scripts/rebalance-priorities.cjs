#!/usr/bin/env node
/**
 * Rebalance card priorities based on sentence length.
 *
 * For early nodes (A1/A2), assign priority so shortest sentences
 * are shown first to beginners:
 *
 * Nodes 01-05 (A1):
 *   Priority 1: ≤4 words
 *   Priority 2: 5-6 words
 *   Priority 3: 7+ words
 *
 * Nodes 06-10 (A2):
 *   Priority 1: ≤6 words
 *   Priority 2: 7-9 words
 *   Priority 3: 10+ words
 *
 * Nodes 11+: unchanged
 */

const fs = require('fs');

const DECKS = [
  'src/data/spanish/deck.json',
  'src/data/french/deck.json',
  'src/data/italian/deck.json',
  'src/data/portuguese/deck.json',
  'src/data/german/deck.json',
  'src/data/dutch/deck.json',
  'src/data/swedish/deck.json',
  'src/data/welsh/deck.json',
  'src/data/hindi/deck.json',
  'src/data/turkish/deck.json',
  'src/data/russian/deck.json',
];

let grandTotal = 0;

DECKS.forEach(deckPath => {
  const lang = deckPath.split('/')[2];
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  let changed = 0;

  deck.forEach(card => {
    const nodeNum = parseInt((card.grammarNode || '').replace('node-', ''));
    if (!nodeNum) return;

    const wordCount = card.target.split(/\s+/).length;
    let newPriority = card.priority;

    if (nodeNum >= 1 && nodeNum <= 5) {
      // A1: short sentences first
      if (wordCount <= 4) newPriority = 1;
      else if (wordCount <= 6) newPriority = 2;
      else newPriority = 3;
    } else if (nodeNum >= 6 && nodeNum <= 10) {
      // A2: slightly more tolerant
      if (wordCount <= 6) newPriority = 1;
      else if (wordCount <= 9) newPriority = 2;
      else newPriority = 3;
    }
    // Nodes 11+: leave unchanged

    if (newPriority !== card.priority) {
      card.priority = newPriority;
      changed++;
    }
  });

  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');
  console.log(`${lang.padEnd(12)} ${changed} cards rebalanced`);
  grandTotal += changed;
});

console.log(`\nTotal: ${grandTotal} cards rebalanced across ${DECKS.length} languages`);
