#!/usr/bin/env node
/**
 * trim-long-cards-it.cjs
 *
 * Shortens Italian flashcard sentences that exceed a target word count.
 * Italian-specific filler removal and simplification rules.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const MAX_WORDS = 12;

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
const longCards = deck.filter(c => c.target.split(/\s+/).length > MAX_WORDS);

console.log(`Found ${longCards.length} cards over ${MAX_WORDS} words`);
console.log(`  13-15 words: ${longCards.filter(c => c.target.split(/\s+/).length <= 15).length}`);
console.log(`  16-20 words: ${longCards.filter(c => { const w = c.target.split(/\s+/).length; return w >= 16 && w <= 20; }).length}`);
console.log(`  21+ words:   ${longCards.filter(c => c.target.split(/\s+/).length >= 21).length}`);

const TRIM_RULES = [
  // Remove Italian discourse fillers
  [/\bla verità è che\s+/gi, ''],
  [/\bil fatto è che\s+/gi, ''],
  [/\bla cosa è che\s+/gi, ''],
  [/\bquello che succede è che\s+/gi, ''],
  [/\bin realtà,?\s+/gi, ''],
  [/\bla verità,?\s+/gi, ''],
  [/\bsinceramente,?\s+/gi, ''],
  [/\bonestamente,?\s+/gi, ''],
  [/\bpersonalmente,?\s+/gi, ''],
  [/\bfondamentalmente,?\s+/gi, ''],
  [/\bovviamente,?\s+/gi, ''],
  [/\bpraticamente,?\s+/gi, ''],
  [/\beffettivamente,?\s+/gi, ''],
  [/\bin ogni caso,?\s+/gi, ''],
  [/\bin generale,?\s+/gi, ''],
  [/\bdi solito,?\s+/gi, ''],
  [/\bnaturalmente,?\s+/gi, ''],
  [/\bcertamente,?\s+/gi, ''],
  [/\bsicuramente,?\s+/gi, ''],
  [/\bpurtroppo,?\s+/gi, ''],
  // Simplify common long phrases
  [/\bcon il passare del tempo/gi, 'col tempo'],
  [/\bin questo momento/gi, 'adesso'],
  [/\bnel giorno d'oggi/gi, 'oggi'],
  [/\bal giorno d'oggi/gi, 'oggi'],
  [/\bil fatto che\s+/gi, 'che '],
  [/\bavere l'opportunità di\s+/gi, 'poter '],
  [/\bin modo significativo/gi, 'molto'],
  [/\bin modo rapido/gi, 'rapidamente'],
  [/\btutto sommato,?\s+/gi, ''],
  [/\ba dire il vero,?\s+/gi, ''],
  [/\bper essere sincero,?\s+/gi, ''],
  [/\bper quanto riguarda\s+/gi, 'per '],
  // Remove trailing tag questions
  [/,\s*(?:no|vero|giusto|non è vero|non credi)\?$/gi, '.'],
];

let trimmed = 0;
let stillLong = 0;

for (const card of deck) {
  const words = card.target.split(/\s+/).length;
  if (words <= MAX_WORDS) continue;

  const original = card.target;
  let text = card.target;

  for (const [pattern, replacement] of TRIM_RULES) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > 0) {
    text = text[0].toUpperCase() + text.slice(1);
  }
  if (text.length > 0 && !text.match(/[.?!]$/)) {
    text += '.';
  }

  const newWords = text.split(/\s+/).length;

  if (text !== original && newWords < words) {
    card.target = text;
    trimmed++;
    if (newWords > MAX_WORDS) stillLong++;
  } else if (words > MAX_WORDS) {
    stillLong++;
  }
}

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');

const afterLong = deck.filter(c => c.target.split(/\s+/).length > MAX_WORDS);
console.log(`\nResults:`);
console.log(`  Trimmed: ${trimmed} cards`);
console.log(`  Still over ${MAX_WORDS} words: ${afterLong.length}`);
console.log(`  Reduction: ${longCards.length} → ${afterLong.length}`);

if (afterLong.length > 0) {
  const buckets = {};
  afterLong.forEach(c => {
    const w = c.target.split(/\s+/).length;
    const b = w <= 15 ? '13-15' : w <= 20 ? '16-20' : '21+';
    buckets[b] = (buckets[b] || 0) + 1;
  });
  console.log(`\n  Remaining breakdown:`);
  Object.entries(buckets).sort().forEach(([b, n]) => console.log(`    ${b}: ${n}`));

  console.log(`\n  Examples still long:`);
  afterLong.slice(0, 10).forEach(c => {
    console.log(`    [${c.id}] (${c.target.split(/\s+/).length}w) ${c.target}`);
  });
}
