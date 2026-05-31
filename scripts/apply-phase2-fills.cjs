#!/usr/bin/env node
const fs = require('fs');

const DECK_DIRS = {
  spanish: 'spanish', portuguese: 'portuguese', welsh: 'welsh',
  hindi: 'hindi', turkish: 'turkish',
};

const fills = JSON.parse(fs.readFileSync('scripts/phase2-fills.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('scripts/edge-tts-cards.json', 'utf8'));

let totalAdded = 0;
for (const [lang, cards] of Object.entries(fills)) {
  if (lang.startsWith('_')) continue;
  if (!DECK_DIRS[lang]) continue;
  const deckPath = 'src/data/' + DECK_DIRS[lang] + '/deck.json';
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const existing = new Set(deck.map(c => c.id));
  let added = 0;
  const newIds = [];
  for (const card of cards) {
    if (existing.has(card.id)) continue;
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
  console.log(`${lang}: +${added} cards (deck now ${deck.length})`);
  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');

  const existingMani = new Set(manifest[lang] || []);
  for (const id of newIds) existingMani.add(id);
  manifest[lang] = [...existingMani].sort();
  totalAdded += added;
}
manifest._total = Object.entries(manifest).filter(([k]) => !k.startsWith('_')).reduce((s, [_, v]) => s + (Array.isArray(v) ? v.length : 0), 0);
fs.writeFileSync('scripts/edge-tts-cards.json', JSON.stringify(manifest, null, 2) + '\n');
console.log();
console.log('Total added: ' + totalAdded);
