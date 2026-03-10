/**
 * cleanup-deck.cjs
 *
 * Phase 1: Clean up the existing deck
 * - Remove duplicate Spanish sentences (keep lower ID)
 * - Replace textbooky / unnatural sentences
 * - Re-ID everything sequentially
 * - Ensure proper tag distribution
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log(`Starting deck: ${deck.length} cards`);

// ─── Step 1: Remove duplicates (keep lower ID) ────────────────────
const seen = new Map(); // target → first card
const dupes = [];

for (const card of deck) {
  const key = card.target.toLowerCase().trim();
  if (seen.has(key)) {
    dupes.push(card.id);
  } else {
    seen.set(key, card);
  }
}

let cleaned = deck.filter(c => !dupes.includes(c.id));
console.log(`Removed ${dupes.length} duplicates → ${cleaned.length} cards`);

// ─── Step 2: Replace textbooky / unnatural sentences ──────────────
// Map of IDs to replacement cards (natural everyday sentences)
const replacements = {
  // Metalinguistic (about learning Spanish)
  1405: { target: "Quien busca, encuentra.", english: "He who seeks, finds.", tags: ["general"] },
  // ID 2223 and 2785 were removed as dupes of 1405
  2463: { target: "Este año he cambiado mucho como persona.", english: "This year I've changed a lot as a person.", tags: ["general", "family"] },

  // Overly philosophical / textbooky thesis statements
  990: { target: "Vamos a pedir un aumento de sueldo.", english: "Let's ask for a raise.", tags: ["general", "work"] },
  1199: { target: "Intenta ponerte en su lugar antes de juzgar.", english: "Try to put yourself in their shoes before judging.", tags: ["general", "family"] },
  1484: { target: "Los niños de hoy saben más de tecnología que nosotros.", english: "Kids today know more about technology than we do.", tags: ["general", "family"] },
  1993: { target: "A veces lo mejor es no decir nada.", english: "Sometimes the best thing is to say nothing.", tags: ["general"] },

  // Archaic register
  2320: { target: "Todos deben cumplir las normas de seguridad.", english: "Everyone must follow the safety rules.", tags: ["general", "work"] },

  // Classic textbook sentences
  27: { target: "Estudio en la universidad.", english: "I study at the university.", tags: ["general", "work"] },
  1843: { target: "Mi gato se sube a todos los muebles.", english: "My cat climbs on all the furniture.", tags: ["general", "family"] },
  1846: { target: "El perro de mi vecino ladra toda la noche.", english: "My neighbor's dog barks all night.", tags: ["general", "family"] },
};

let replacedCount = 0;
cleaned = cleaned.map(card => {
  if (replacements[card.id]) {
    replacedCount++;
    return { ...card, ...replacements[card.id] };
  }
  return card;
});
console.log(`Replaced ${replacedCount} textbooky sentences`);

// ─── Step 3: Re-ID sequentially ──────────────────────────────────
cleaned.sort((a, b) => a.id - b.id);
cleaned = cleaned.map((card, i) => ({ ...card, id: i + 1 }));
console.log(`Re-IDed to ${cleaned.length} sequential cards`);

// ─── Step 4: Verify tag distribution ─────────────────────────────
const tagCounts = {};
for (const card of cleaned) {
  for (const tag of card.tags) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
}
console.log('\nTag distribution:');
for (const [tag, count] of Object.entries(tagCounts)) {
  console.log(`  ${tag}: ${count} (${(count / cleaned.length * 100).toFixed(1)}%)`);
}

// ─── Step 5: Write cleaned deck ──────────────────────────────────
fs.writeFileSync(DECK_PATH, JSON.stringify(cleaned, null, 2));
console.log(`\nWrote cleaned deck: ${cleaned.length} cards`);
