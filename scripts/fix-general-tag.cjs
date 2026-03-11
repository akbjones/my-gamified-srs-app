const fs = require('fs');
const path = require('path');

const deckPath = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

let fixed = 0;
for (const card of cards) {
  if (!card.tags || !card.tags.includes('general')) {
    if (!card.tags) card.tags = [];
    card.tags.unshift('general');
    fixed++;
  }
}

console.log(`Fixed ${fixed} cards missing 'general' tag`);
fs.writeFileSync(deckPath, JSON.stringify(cards, null, 2));
console.log('Saved.');
