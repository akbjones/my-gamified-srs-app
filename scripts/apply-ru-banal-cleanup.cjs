#!/usr/bin/env node
/**
 * Delete the Russian template-banal cards.
 * Source: /tmp/ru-banal.json (191 cards detected by 3-of-4 signal heuristic).
 *
 * Russian still has ~3174 cards after deletion. The deleted cards' audio
 * files become orphaned (left on CDN harmlessly).
 */
const fs = require('fs');

const DECK_PATH = 'src/data/russian/deck.json';
const BANAL_PATH = '/tmp/ru-banal.json';

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const banal = JSON.parse(fs.readFileSync(BANAL_PATH, 'utf8'));
const toDelete = new Set(banal.map(c => c.id));

console.log('Russian deck before: ' + deck.length);
console.log('Cards flagged banal: ' + banal.length);

const newDeck = deck.filter(c => !toDelete.has(c.id));
console.log('Russian deck after:  ' + newDeck.length + ' (-' + (deck.length - newDeck.length) + ')');

fs.writeFileSync(DECK_PATH, JSON.stringify(newDeck, null, 2) + '\n');

// Note: audio files for deleted cards are orphaned. Not deleting from disk
// (10MB of dead weight; can be cleaned later if needed).
console.log();
console.log('Wrote ' + DECK_PATH);
console.log('Audio orphans: ' + toDelete.size + ' files (left on CDN; harmless)');
