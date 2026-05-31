#!/usr/bin/env node
/**
 * Apply gap-fill basics cards to a deck.
 * Usage: node scripts/apply-basics.cjs <lang> <json-path>
 *   lang  = turkish | hindi | russian | ...
 *   json  = scripts/<lang>-basics.json (with {cards: [...]})
 */
const fs = require('fs');

const DECK_DIRS = {
  turkish: 'turkish', hindi: 'hindi', russian: 'russian',
  spanish: 'spanish', french: 'french', italian: 'italian',
  portuguese: 'portuguese', german: 'german', dutch: 'dutch',
  swedish: 'swedish', welsh: 'welsh',
};

const lang = process.argv[2];
const jsonPath = process.argv[3];
if (!lang || !jsonPath) { console.error('usage: node apply-basics.cjs <lang> <json>'); process.exit(1); }
if (!DECK_DIRS[lang]) { console.error('unknown lang: ' + lang); process.exit(1); }

const deckPath = `src/data/${DECK_DIRS[lang]}/deck.json`;
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
const { cards } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync('scripts/edge-tts-cards.json', 'utf8'));

const existingIds = new Set(deck.map(c => c.id));
let added = 0, skipped = 0;
const newIds = [];
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
  newIds.push(card.id);
  added++;
}

console.log(`${lang}: ${added} cards added, ${skipped} skipped.`);
fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');

// Add to manifest under the language key
const existing = new Set(manifest[lang] || []);
for (const id of newIds) existing.add(id);
manifest[lang] = [...existing].sort();
manifest._total = Object.entries(manifest)
  .filter(([k]) => !k.startsWith('_'))
  .reduce((sum, [_, v]) => sum + (Array.isArray(v) ? v.length : 0), 0);
fs.writeFileSync('scripts/edge-tts-cards.json', JSON.stringify(manifest, null, 2) + '\n');

console.log(`Updated manifest: ${lang} edge-TTS list now has ${manifest[lang].length} entries`);
console.log(`Deck size: ${deck.length}`);
