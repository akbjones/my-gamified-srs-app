/**
 * fix-grammar-notes.cjs — Fix misattached grammar notes.
 *
 * Many grammar notes start with a quoted example sentence that belongs
 * to a different card. This script:
 * 1. Detects misattached notes (quoted sentence doesn't match the card)
 * 2. Extracts just the grammar explanation after the em-dash
 * 3. If the explanation is useful on its own, keeps it
 * 4. If not, removes the grammar note entirely
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

let fixed = 0;
let removed = 0;
let kept = 0;

for (const card of deck) {
  if (!card.grammar || card.grammar.trim().length === 0) continue;

  const g = card.grammar;
  const match = g.match(/^"([^"]+)"\s*[—–-]\s*(.*)/s);

  if (!match) {
    kept++;
    continue;
  }

  const quotedText = match[1].toLowerCase().trim();
  const explanation = match[2].trim();
  const cardText = card.target.toLowerCase().trim();

  // Check if the quoted text relates to this card
  const quoteStart = quotedText.substring(0, 15);
  const cardStart = cardText.substring(0, 15);

  if (cardText.includes(quoteStart) || quoteStart.includes(cardStart)) {
    kept++;
    continue;
  }

  // Misattached! Extract just the explanation
  if (explanation.length >= 15) {
    // The explanation part is substantial enough to keep
    card.grammar = explanation;
    fixed++;
  } else {
    // Too short without the example — remove entirely
    delete card.grammar;
    removed++;
  }
}

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));

const remaining = deck.filter(c => c.grammar && c.grammar.trim().length > 0).length;

console.log('Grammar notes fixed: ' + fixed);
console.log('Grammar notes removed (too short after fix): ' + removed);
console.log('Grammar notes unchanged: ' + kept);
console.log('Total grammar notes remaining: ' + remaining);
