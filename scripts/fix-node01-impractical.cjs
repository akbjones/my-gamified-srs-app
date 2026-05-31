#!/usr/bin/env node
/**
 * Move impractical cards out of node-01, remove duplicates and garbage.
 * Reads review data from scripts/output/node01-review.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const reviewPath = path.join(ROOT, 'scripts/output/node01-review.json');
const review = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));

const LANG_DIRS = {
  spanish: 'es', italian: 'it', french: 'fr', portuguese: 'pt',
  german: 'de', dutch: 'nl', swedish: 'sv', welsh: 'cy',
  hindi: 'hi', turkish: 'tr', russian: 'ru'
};

const results = {};

for (const [langName, prefix] of Object.entries(LANG_DIRS)) {
  const deckPath = path.join(ROOT, 'src/data', langName, 'deck.json');
  let deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  const rv = review[langName];
  if (!rv) { console.log(`No review data for ${langName}, skipping`); continue; }

  const impracticalSet = new Set(rv.impractical || []);
  const duplicateSet = new Set(rv.duplicates || []);
  const garbageSet = new Set(rv.garbage || []);

  let movedCount = 0;
  let dupRemoved = 0;
  let garbageRemoved = 0;

  // 1. Remove garbage cards
  const beforeGarbage = deck.length;
  deck = deck.filter(c => {
    if (garbageSet.has(c.english)) {
      garbageRemoved++;
      return false;
    }
    return true;
  });

  // 2. Remove duplicate cards (keep first occurrence of each English sentence)
  const seenDups = new Set();
  deck = deck.filter(c => {
    if (duplicateSet.has(c.english)) {
      if (seenDups.has(c.english)) {
        dupRemoved++;
        return false;
      }
      seenDups.add(c.english);
    }
    return true;
  });

  // 3. Move impractical cards from node-01 to node-15
  for (const card of deck) {
    if (card.grammarNode === 'node-01' && impracticalSet.has(card.english)) {
      card.grammarNode = 'node-15';
      movedCount++;
    }
  }

  // 4. Re-sort: by grammarNode number, then English word count
  deck.sort((a, b) => {
    const nodeA = parseInt(a.grammarNode.replace('node-', ''), 10);
    const nodeB = parseInt(b.grammarNode.replace('node-', ''), 10);
    if (nodeA !== nodeB) return nodeA - nodeB;
    const wordsA = a.english.split(/\s+/).length;
    const wordsB = b.english.split(/\s+/).length;
    return wordsA - wordsB;
  });

  // 5. Reassign sequential IDs, preserve audio
  deck.forEach((card, i) => {
    card.id = `${prefix}-${String(i + 1).padStart(4, '0')}`;
  });

  // Count final node-01
  const finalNode01 = deck.filter(c => c.grammarNode === 'node-01').length;

  // Write back
  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');

  results[langName] = {
    impracticalMoved: movedCount,
    duplicatesRemoved: dupRemoved,
    garbageRemoved: garbageRemoved,
    finalNode01: finalNode01,
    totalCards: deck.length
  };

  console.log(`${langName}: moved=${movedCount}, dups=${dupRemoved}, garbage=${garbageRemoved}, node-01=${finalNode01}, total=${deck.length}`);
}

console.log('\n=== Summary ===');
console.log(JSON.stringify(results, null, 2));
