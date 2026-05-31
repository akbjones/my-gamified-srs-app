#!/usr/bin/env node
/**
 * Add the Turkish A1 starter set to the deck.
 * Cards are appended with id 'tr-S-001' through 'tr-S-040'.
 * Audio = empty (will be Edge-TTS-generated next pass).
 * Adds all 40 IDs to scripts/edge-tts-cards.json under turkish.
 */
const fs = require('fs');

const DECK_PATH = 'src/data/turkish/deck.json';
const STARTER_PATH = 'scripts/tr-starter-set.json';
const EDGE_MANIFEST = 'scripts/edge-tts-cards.json';

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const { cards } = JSON.parse(fs.readFileSync(STARTER_PATH, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(EDGE_MANIFEST, 'utf8'));

const existingIds = new Set(deck.map(c => c.id));
let added = 0, skipped = 0;

for (const card of cards) {
  if (existingIds.has(card.id)) { skipped++; continue; }
  deck.push({
    id: card.id,
    target: card.target,
    english: card.english,
    audio: '',
    tags: card.tags,
    grammarNode: card.grammarNode,
    priority: card.priority,
    grammar: '',
    category: card.category,
  });
  added++;
}

console.log('Starter cards added: ' + added + ' (skipped: ' + skipped + ')');

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');

// Add to manifest
const newIds = cards.map(c => c.id);
const existing = new Set(manifest.turkish || []);
for (const id of newIds) existing.add(id);
manifest.turkish = [...existing].sort();
manifest._total = Object.entries(manifest)
  .filter(([k]) => !k.startsWith('_'))
  .reduce((sum, [_, v]) => sum + (Array.isArray(v) ? v.length : 0), 0);
fs.writeFileSync(EDGE_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

console.log('Updated ' + EDGE_MANIFEST + ' (Turkish edge-TTS list: ' + manifest.turkish.length + ' cards)');
console.log('Total deck size: ' + deck.length + ' cards');
