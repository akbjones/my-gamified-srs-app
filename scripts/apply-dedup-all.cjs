#!/usr/bin/env node
/**
 * Apply remaining duplicate cleanup across all languages.
 * For each cluster found by find-duplicates-all, keep the lowest-priority canonical
 * and delete the rest.
 */
const fs = require('fs');

const DECKS = {
  spanish:    'src/data/spanish/deck.json',
  french:     'src/data/french/deck.json',
  italian:    'src/data/italian/deck.json',
  portuguese: 'src/data/portuguese/deck.json',
  german:     'src/data/german/deck.json',
  dutch:      'src/data/dutch/deck.json',
  swedish:    'src/data/swedish/deck.json',
  welsh:      'src/data/welsh/deck.json',
  hindi:      'src/data/hindi/deck.json',
  turkish:    'src/data/turkish/deck.json',
  russian:    'src/data/russian/deck.json',
};

const summary = {};

for (const [lang, deckPath] of Object.entries(DECKS)) {
  const clusterPath = `scripts/dup-clusters-${lang}.json`;
  if (!fs.existsSync(clusterPath)) continue;
  const { clusters } = JSON.parse(fs.readFileSync(clusterPath, 'utf8'));
  if (!clusters.length) { summary[lang] = 0; continue; }

  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const toDelete = new Set();

  for (const c of clusters) {
    const sorted = [...c.cards].sort((a, b) => (a.priority || 999999) - (b.priority || 999999));
    // Keep canonical (sorted[0]); delete the rest
    for (const dup of sorted.slice(1)) toDelete.add(dup.id);
  }

  if (toDelete.size === 0) { summary[lang] = 0; continue; }

  const before = deck.length;
  const newDeck = deck.filter(c => !toDelete.has(c.id));
  fs.writeFileSync(deckPath, JSON.stringify(newDeck, null, 2) + '\n');
  console.log(`${lang}: ${before} → ${newDeck.length} (-${before - newDeck.length})  IDs deleted: ${[...toDelete].join(', ')}`);
  summary[lang] = before - newDeck.length;
}

console.log();
console.log('Total deleted: ' + Object.values(summary).reduce((s, n) => s + n, 0));
