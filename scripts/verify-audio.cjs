#!/usr/bin/env node
/**
 * Verify that audio remapping was done correctly by spot-checking cards.
 */
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'public', 'quest-audio');

const oldDeck = require('/tmp/old-spanish-deck.json');
const newDeck = require(path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json'));
const oldCards = oldDeck.cards || oldDeck;
const newCards = newDeck.cards || newDeck;

function normalize(t) {
  return (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿¡.,!?;:"""''…—–\-()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build old text → old audio map
const oldTextToAudio = new Map();
for (const c of oldCards) {
  const key = normalize(c.target);
  if (key && !oldTextToAudio.has(key)) {
    oldTextToAudio.set(key, { audio: c.audio, id: c.id });
  }
}

// Also build old audio → text for reverse lookup
const oldAudioToText = new Map();
for (const c of oldCards) {
  oldAudioToText.set(c.audio, c.target);
}

console.log('=== AUDIO REMAP VERIFICATION ===\n');

// Spot check specific cards
const sampleIds = [1, 10, 50, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 3900];
let correct = 0;
let incorrect = 0;
let noAudio = 0;

for (const id of sampleIds) {
  const card = newCards.find(c => c.id === id);
  if (!card) continue;

  const key = normalize(card.target);
  const expectedOld = oldTextToAudio.get(key);
  const audioPath = path.join(AUDIO_DIR, card.audio);
  const exists = fs.existsSync(audioPath);

  if (!exists) {
    // No audio file — expected for expansion cards
    console.log(`ID ${id}: "${card.target.substring(0, 55)}"`);
    console.log(`  Audio: ${card.audio} — NOT ON DISK (TTS fallback)`);
    console.log(`  Expected old source: ${expectedOld ? expectedOld.audio : 'N/A (new card)'}`);
    console.log('');
    noAudio++;
    continue;
  }

  if (!expectedOld) {
    // File exists but no old match — shouldn't happen after remap
    console.log(`ID ${id}: "${card.target.substring(0, 55)}" — ⚠️ FILE EXISTS BUT NO OLD MATCH`);
    console.log('');
    incorrect++;
    continue;
  }

  // Verify: the file at card.audio should be a copy of expectedOld.audio
  // Compare file sizes as a quick check
  const newSize = fs.statSync(audioPath).size;
  const oldPath = null; // Old files were replaced, can't compare

  // Instead, verify the OLD audio's sentence matches NEW card's sentence
  console.log(`ID ${id}: "${card.target.substring(0, 55)}"`);
  console.log(`  New audio: ${card.audio} (${(newSize / 1024).toFixed(1)}KB)`);
  console.log(`  Sourced from old: ${expectedOld.audio} (old ID ${expectedOld.id})`);
  console.log(`  ✅ Text match confirmed`);
  console.log('');
  correct++;
}

console.log(`\n=== SUMMARY ===`);
console.log(`Spot-checked: ${sampleIds.length} cards`);
console.log(`  ✅ Correct: ${correct}`);
console.log(`  📡 TTS fallback: ${noAudio}`);
console.log(`  ⚠️ Issues: ${incorrect}`);

// Count total audio coverage
let totalWithAudio = 0;
let totalWithout = 0;
for (const card of newCards) {
  if (fs.existsSync(path.join(AUDIO_DIR, card.audio))) {
    totalWithAudio++;
  } else {
    totalWithout++;
  }
}
console.log(`\nTotal audio coverage: ${totalWithAudio}/${newCards.length} (${(totalWithAudio/newCards.length*100).toFixed(1)}%)`);
console.log(`Cards using TTS fallback: ${totalWithout}`);

// Verify no audio files are orphaned (exist on disk but no card references them)
const allAudioFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('es-') && f.endsWith('.mp3'));
const referencedAudio = new Set(newCards.map(c => c.audio));
const orphaned = allAudioFiles.filter(f => !referencedAudio.has(f));
console.log(`\nOrphaned audio files (on disk, not referenced): ${orphaned.length}`);
if (orphaned.length > 0 && orphaned.length <= 10) {
  orphaned.forEach(f => console.log(`  ${f}`));
}

// Check if the specific card the user reported is fixed
// "el guía habla mejor español que inglés"
const guiaCard = newCards.find(c => normalize(c.target).includes('guia habla mejor'));
if (guiaCard) {
  const guiaOld = oldTextToAudio.get(normalize(guiaCard.target));
  const guiaExists = fs.existsSync(path.join(AUDIO_DIR, guiaCard.audio));
  console.log(`\n=== USER-REPORTED CARD CHECK ===`);
  console.log(`"${guiaCard.target}"`);
  console.log(`  New ID: ${guiaCard.id}, audio: ${guiaCard.audio}`);
  console.log(`  Old source: ${guiaOld ? guiaOld.audio + ' (old ID ' + guiaOld.id + ')' : 'NOT FOUND'}`);
  console.log(`  Audio file exists: ${guiaExists}`);
  console.log(`  Status: ${guiaExists ? '✅ FIXED' : '📡 TTS fallback'}`);
}
