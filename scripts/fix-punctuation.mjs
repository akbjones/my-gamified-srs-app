import { readFileSync, writeFileSync } from 'fs';

const deck = JSON.parse(readFileSync('src/data/spanish/deck.json', 'utf8'));
let fixCount = 0;

for (const c of deck) {
  const t = c.target;
  const qCount = (t.match(/¿/g) || []).length;

  if (qCount !== 2) continue;

  // Pattern: ¿...¿...?  →  remove first ¿, keep the second one
  // The first ¿ is always at position 0 in these cases (starts the sentence)
  // The actual question starts at the second ¿
  if (t.startsWith('¿')) {
    // Find second ¿
    const secondQ = t.indexOf('¿', 1);
    if (secondQ > 0) {
      // Remove leading ¿, capitalize first real character
      let fixed = t.slice(1); // remove leading ¿
      // Capitalize first letter
      fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);

      console.log(`[${c.id}] BEFORE: ${t}`);
      console.log(`[${c.id}] AFTER:  ${fixed}`);
      console.log();

      c.target = fixed;
      fixCount++;
    }
  }
}

console.log(`\nFixed ${fixCount} cards`);
writeFileSync('src/data/spanish/deck.json', JSON.stringify(deck, null, 2) + '\n');
console.log('Saved deck.json');
