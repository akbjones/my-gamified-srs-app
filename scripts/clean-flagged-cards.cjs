#!/usr/bin/env node
/**
 * Remove flagged bad cards from deck files based on validation JSONs.
 *
 * - Welsh (cy): remove GARBAGE
 * - Russian (ru): remove GARBAGE and MISMATCH
 * - Hindi (hi): fix PrRiya typo in MISMATCH cards, keep AWKWARD as-is
 * - French (fr): keep all (accent issues are minor)
 * - Swedish (sv): remove GARBAGE only
 * - Dutch (nl): remove GARBAGE only
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const OUTPUT = path.join(__dirname, 'output');
const DATA = path.join(BASE, 'src', 'data');

const languages = [
  {
    code: 'cy',
    name: 'Welsh',
    deckPath: path.join(DATA, 'welsh', 'deck.json'),
    validationPath: path.join(OUTPUT, 'cy-card-validation.json'),
    action: 'remove',
    removeCategories: ['GARBAGE'],
  },
  {
    code: 'ru',
    name: 'Russian',
    deckPath: path.join(DATA, 'russian', 'deck.json'),
    validationPath: path.join(OUTPUT, 'ru-card-validation.json'),
    action: 'remove',
    removeCategories: ['GARBAGE', 'MISMATCH'],
  },
  {
    code: 'hi',
    name: 'Hindi',
    deckPath: path.join(DATA, 'hindi', 'deck.json'),
    validationPath: path.join(OUTPUT, 'hi-card-validation.json'),
    action: 'fix',
    // For Hindi: fix PrRiya typo, keep everything else
  },
  {
    code: 'fr',
    name: 'French',
    deckPath: path.join(DATA, 'french', 'deck.json'),
    validationPath: path.join(OUTPUT, 'fr-card-validation.json'),
    action: 'skip', // Keep all - accent issues are minor
  },
  {
    code: 'sv',
    name: 'Swedish',
    deckPath: path.join(DATA, 'swedish', 'deck.json'),
    validationPath: path.join(OUTPUT, 'sv-card-validation.json'),
    action: 'remove',
    removeCategories: ['GARBAGE'],
  },
  {
    code: 'nl',
    name: 'Dutch',
    deckPath: path.join(DATA, 'dutch', 'deck.json'),
    validationPath: path.join(OUTPUT, 'nl-card-validation.json'),
    action: 'remove',
    removeCategories: ['GARBAGE'],
  },
];

for (const lang of languages) {
  console.log(`\n=== ${lang.name} (${lang.code}) ===`);

  const validation = JSON.parse(fs.readFileSync(lang.validationPath, 'utf8'));
  let cards = JSON.parse(fs.readFileSync(lang.deckPath, 'utf8'));
  // Deck might be an array or {cards: [...]}
  const isArray = Array.isArray(cards);
  const cardArray = isArray ? cards : cards.cards;
  const originalCount = cardArray.length;

  // Save backup
  const backupPath = path.join(OUTPUT, `${lang.code}-deck-backup.json`);
  fs.writeFileSync(backupPath, fs.readFileSync(lang.deckPath, 'utf8'));
  console.log(`  Backup saved to: ${backupPath}`);

  if (lang.action === 'skip') {
    console.log(`  Action: SKIP (keeping all ${originalCount} cards)`);
    console.log(`  Original: ${originalCount} | Removed: 0 | Final: ${originalCount}`);
    continue;
  }

  if (lang.action === 'fix') {
    // Hindi: fix PrRiya typo in English translations
    const prRiyaIds = new Set(
      validation.flagged
        .filter(f => f.issue === 'MISMATCH' && f.reason.includes('PrRiya'))
        .map(f => String(f.id))
    );

    let fixedCount = 0;
    for (const card of cardArray) {
      const cardId = String(card.id);
      if (prRiyaIds.has(cardId)) {
        if (card.english && card.english.includes('PrRiya')) {
          card.english = card.english.replace(/PrRiya/g, 'Priya');
          fixedCount++;
        }
      }
    }

    fs.writeFileSync(lang.deckPath, JSON.stringify(isArray ? cardArray : cards, null, 2) + '\n');
    console.log(`  Action: FIX PrRiya typo`);
    console.log(`  Fixed ${fixedCount} cards with PrRiya -> Priya`);
    console.log(`  Original: ${originalCount} | Removed: 0 | Final: ${originalCount}`);
    continue;
  }

  // Remove cards matching specified categories
  const removeIds = new Set(
    validation.flagged
      .filter(f => {
        const cat = f.issue || f.category;
        return lang.removeCategories.includes(cat);
      })
      .map(f => String(f.id))
  );

  const cleanCards = cardArray.filter(card => !removeIds.has(String(card.id)));
  const removedCount = originalCount - cleanCards.length;

  const output = isArray ? cleanCards : { ...cards, cards: cleanCards };
  fs.writeFileSync(lang.deckPath, JSON.stringify(output, null, 2) + '\n');

  console.log(`  Action: REMOVE ${lang.removeCategories.join(', ')}`);
  console.log(`  IDs to remove: ${removeIds.size}`);
  console.log(`  Original: ${originalCount} | Removed: ${removedCount} | Final: ${cleanCards.length}`);

  if (removeIds.size !== removedCount) {
    console.log(`  WARNING: ${removeIds.size - removedCount} IDs not found in deck!`);
  }
}

console.log('\nDone!');
