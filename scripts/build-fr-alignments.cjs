#!/usr/bin/env node
/**
 * French word-level alignment script.
 * Processes all cards from deck.json, tokenizes French sentences,
 * and maps each word to its English meaning.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const DECK_PATH = path.join(BASE, 'src/data/french/deck.json');
const OUT_PATH = path.join(BASE, 'scripts/output/fr-alignments.json');

// Load deck
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
console.log(`Loaded ${deck.length} cards`);

// Load dictionary parts
const dict1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fr-align-dict.json'), 'utf8'));
const dict2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fr-align-dict2.json'), 'utf8'));
const dict3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fr-align-dict3.json'), 'utf8'));
const dictPatch = JSON.parse(fs.readFileSync(path.join(__dirname, 'fr-align-dict-patch.json'), 'utf8'));

// Merge all dictionaries (patch overrides)
const DICT = { ...dict1, ...dict2, ...dict3, ...dictPatch };
console.log(`Dictionary: ${Object.keys(DICT).length} entries`);

// Tokenizer: splits French text into tokens, handling contractions
function tokenize(text) {
  let t = text.toLowerCase();
  // Remove punctuation except apostrophes and hyphens within words
  t = t.replace(/[.,!?;:""«»…()"]/g, ' ');

  const tokens = [];
  const rawTokens = t.split(/\s+/).filter(Boolean);

  for (const tok of rawTokens) {
    // Handle contractions: l'eau -> l' + eau, d'argent -> d' + argent, etc.
    // Pattern: common contraction prefixes followed by apostrophe
    const contrMatch = tok.match(/^([ljdnscq]u?|jusqu)'+(.+)$/i);
    if (contrMatch) {
      tokens.push(contrMatch[1] + "'");
      tokens.push(contrMatch[2]);
    } else {
      tokens.push(tok);
    }
  }

  return tokens.filter(Boolean);
}

// Build alignments
const alignments = {};
let totalTokens = 0;
let matchedTokens = 0;
let unmatchedSet = new Set();

for (const card of deck) {
  const cardId = card.id;
  const tokens = tokenize(card.target);

  for (const token of tokens) {
    totalTokens++;

    // Look up in dictionary
    let meaning = DICT[token];

    if (!meaning) {
      unmatchedSet.add(token);
    } else {
      matchedTokens++;
    }

    // If not in dictionary, use a fallback based on the token itself
    if (!meaning) {
      meaning = token; // fallback: use the French word itself
    }

    if (!alignments[token]) {
      alignments[token] = [];
    }

    alignments[token].push({
      en: meaning,
      card: String(cardId)
    });
  }
}

// Report coverage
const uniqueTokens = new Set();
for (const card of deck) {
  tokenize(card.target).forEach(t => uniqueTokens.add(t));
}

const covered = [...uniqueTokens].filter(t => DICT[t]);
const uncovered = [...uniqueTokens].filter(t => !DICT[t]);

console.log(`\nTotal tokens processed: ${totalTokens}`);
console.log(`Unique tokens: ${uniqueTokens.size}`);
console.log(`Dictionary coverage: ${covered.length}/${uniqueTokens.size} (${(100 * covered.length / uniqueTokens.size).toFixed(1)}%)`);
console.log(`Matched token occurrences: ${matchedTokens}/${totalTokens} (${(100 * matchedTokens / totalTokens).toFixed(1)}%)`);

if (uncovered.length > 0) {
  console.log(`\nUncovered tokens (${uncovered.length}):`);
  // Sort by frequency
  const freq = {};
  for (const card of deck) {
    tokenize(card.target).forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  }
  uncovered.sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
  uncovered.forEach(t => console.log(`  ${t} (${freq[t]} occurrences)`));
}

// Write output
const output = { alignments };
fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
console.log(`\nWrote ${Object.keys(alignments).length} word entries to ${OUT_PATH}`);
console.log(`Output file size: ${(fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(1)} MB`);
