const fs = require('fs');
const path = require('path');
const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
let deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const node22 = deck.filter(c => c.grammarNode === 'node-22');
const keepIds = new Set(node22.slice(0, 100).map(c => c.id));
deck = deck.filter(c => c.grammarNode !== 'node-22' || keepIds.has(c.id));

deck.sort((a, b) => {
  const na = parseInt(a.grammarNode.replace('node-', ''));
  const nb = parseInt(b.grammarNode.replace('node-', ''));
  return na !== nb ? na - nb : a.id - b.id;
});
deck.forEach((c, i) => { c.id = i + 1; c.audio = `it-${i + 1}.mp3`; });

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
console.log('Trimmed node-22: 117 -> 100');
console.log('Final deck:', deck.length, 'cards');
