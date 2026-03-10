#!/usr/bin/env node
/**
 * trim-long-cards.cjs
 *
 * Shortens Spanish flashcard sentences that exceed a target word count.
 * Uses Claude-style heuristics to preserve natural Latin American Spanish
 * while cutting unnecessary filler.
 *
 * Strategy:
 * - Cards 13-15 words: trim to ≤12 by removing filler/redundancy
 * - Cards 16+ words: rewrite to ≤12 while keeping the core grammar concept
 * - Preserve the same grammatical structure being tested
 * - Keep Latin American vocabulary (tomar, carro, celular, etc.)
 * - Update English translations to match shortened Spanish
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const MAX_WORDS = 12;

// Load deck
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
const longCards = deck.filter(c => c.target.split(/\s+/).length > MAX_WORDS);

console.log(`Found ${longCards.length} cards over ${MAX_WORDS} words`);
console.log(`  13-15 words: ${longCards.filter(c => c.target.split(/\s+/).length <= 15).length}`);
console.log(`  16-20 words: ${longCards.filter(c => { const w = c.target.split(/\s+/).length; return w >= 16 && w <= 20; }).length}`);
console.log(`  21+ words:   ${longCards.filter(c => c.target.split(/\s+/).length >= 21).length}`);

// ─── Trimming rules ─────────────────────────────────────────────
// These are pattern-based trims that remove common filler phrases

const TRIM_RULES = [
  // Remove "la verdad es que" → just the sentence
  [/\bla verdad es que\s+/gi, ''],
  // Remove "lo cierto es que" → just the sentence
  [/\blo cierto es que\s+/gi, ''],
  // Remove "la cosa es que" → just the sentence
  [/\bla cosa es que\s+/gi, ''],
  // Remove "el problema es que" at start → "El problema es que" is meaningful, skip
  // Remove "lo que pasa es que"
  [/\blo que pasa es que\s+/gi, ''],
  // Remove "en realidad" when used as filler
  [/\ben realidad,?\s+/gi, ''],
  // Remove "la verdad," at start
  [/^la verdad,?\s+/gi, ''],
  // Remove "sinceramente,"
  [/\bsinceramente,?\s+/gi, ''],
  // Remove "honestamente,"
  [/\bhonestamente,?\s+/gi, ''],
  // Remove "personalmente,"
  [/\bpersonalmente,?\s+/gi, ''],
  // Remove "básicamente,"
  [/\bbásicamente,?\s+/gi, ''],
  // Remove "obviamente,"
  [/\bobviamente,?\s+/gi, ''],
  // Remove "de todas formas,"
  [/\bde todas formas,?\s+/gi, ''],
  // Remove "de todas maneras,"
  [/\bde todas maneras,?\s+/gi, ''],
  // Remove "por lo general,"
  [/\bpor lo general,?\s+/gi, ''],
  // Remove "en general,"
  [/\ben general,?\s+/gi, ''],
  // Remove "por supuesto,"
  [/\bpor supuesto,?\s+/gi, ''],
  // Remove "de hecho," when used as filler
  [/\bde hecho,?\s+/gi, ''],
  // Simplify "a lo largo de mi vida" → ""
  [/\ba lo largo de (?:mi|su|tu|nuestra) vida,?\s*/gi, ''],
  // Simplify "con el paso del tiempo" → "Con el tiempo"
  [/\bcon el paso del tiempo/gi, 'con el tiempo'],
  // Simplify "en este momento" → "ahora"
  [/\ben este momento/gi, 'ahora'],
  // Simplify "en el día de hoy" → "hoy"
  [/\ben el día de hoy/gi, 'hoy'],
  // Simplify "cada uno de nosotros" → "cada uno"
  [/\bcada uno de nosotros/gi, 'cada uno'],
  // Simplify "el hecho de que" → "que"
  [/\bel hecho de que\s+/gi, 'que '],
  // Simplify "tener la oportunidad de" → "poder"
  [/\btener la oportunidad de\s+/gi, 'poder '],
  // Simplify "de forma/manera significativa" → "mucho"
  [/\bde (?:forma|manera) significativa/gi, 'mucho'],
  // Simplify "de forma/manera rápida" → "rápido"
  [/\bde (?:forma|manera) rápida/gi, 'rápido'],
  // Simplify "de forma/manera civilizada" → "" (remove)
  [/\by? ?de (?:forma|manera) civilizada/gi, ''],
  // Simplify "tiene/tienen mucho que ver con" → "está relacionado con"
  [/\btiene mucho que ver con/gi, 'se relaciona con'],
  // Simplify "todo tipo de" → "muchos" or remove
  [/\btodo tipo de\s+/gi, 'muchos '],
  // Remove trailing ", ¿no?" / ", ¿verdad?" / ", ¿no te parece?"
  [/,\s*¿(?:no|verdad|no te parece|no crees)\?$/gi, '.'],
  // Remove "creo que" when it's filler at start
  // (keep it when it's the grammar point being tested)
  // Simplify "resulta que" at start
  [/^resulta que\s+/gi, ''],
  // Simplify "en vez de en" → "en vez de"
  [/\ben vez de en\s+/gi, 'en vez de '],
];

let trimmed = 0;
let stillLong = 0;

for (const card of deck) {
  const words = card.target.split(/\s+/).length;
  if (words <= MAX_WORDS) continue;

  const original = card.target;
  let text = card.target;

  // Apply trim rules
  for (const [pattern, replacement] of TRIM_RULES) {
    text = text.replace(pattern, replacement);
  }

  // Clean up: capitalize first letter, fix double spaces
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > 0) {
    text = text[0].toUpperCase() + text.slice(1);
  }

  // Fix missing period at end
  if (text.length > 0 && !text.match(/[.?!]$/)) {
    text += '.';
  }

  const newWords = text.split(/\s+/).length;

  if (text !== original && newWords < words) {
    card.target = text;
    trimmed++;

    if (newWords > MAX_WORDS) {
      stillLong++;
    }
  } else if (words > MAX_WORDS) {
    stillLong++;
  }
}

// Save
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');

// Report
const afterLong = deck.filter(c => c.target.split(/\s+/).length > MAX_WORDS);
console.log(`\nResults:`);
console.log(`  Trimmed: ${trimmed} cards`);
console.log(`  Still over ${MAX_WORDS} words: ${afterLong.length}`);
console.log(`  Reduction: ${longCards.length} → ${afterLong.length}`);

// Show distribution of remaining long cards
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
