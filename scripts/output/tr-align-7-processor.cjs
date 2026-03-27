// Processor script to build alignment structure from pre-computed word meanings
const fs = require('fs');
const cards = require('./tr-align-batch-7.json');

// Pre-computed word-level alignments for all 395 cards
// Format: { cardId: { word: meaning, ... }, ... }
const cardAlignments = {
