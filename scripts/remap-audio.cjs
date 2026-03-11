#!/usr/bin/env node
/**
 * Remap Spanish audio files after deck reclassification.
 *
 * Problem: After re-sequencing IDs, card id=1 now refers to a different sentence
 * than old card id=1. The audio files on disk still match OLD IDs.
 *
 * Solution:
 * 1. Build map: normalized_target_text → old_audio_filename (from old deck in git)
 * 2. For each new card, find matching old audio file by target text
 * 3. Copy old audio files into new positions in a staging dir
 * 4. Replace the original audio dir with the remapped files
 *
 * Usage: node scripts/remap-audio.cjs
 */

const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'public', 'quest-audio');
const OLD_DECK_PATH = '/tmp/old-spanish-deck.json';
const NEW_DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const STAGING_DIR = path.join(__dirname, '..', 'public', 'quest-audio-remapped');

// Normalize text for matching (strip accents, lowercase, collapse whitespace)
function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿¡.,!?;:"""''…—–\-()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  // 1. Load old deck
  if (!fs.existsSync(OLD_DECK_PATH)) {
    console.error('Old deck not found at', OLD_DECK_PATH);
    console.error('Run: git show ea84a1c:src/data/spanish/deck.json > /tmp/old-spanish-deck.json');
    process.exit(1);
  }
  const oldDeck = JSON.parse(fs.readFileSync(OLD_DECK_PATH, 'utf8'));
  const oldCards = oldDeck.cards || oldDeck;
  console.log(`Old deck: ${oldCards.length} cards`);

  // 2. Load new deck
  const newDeck = JSON.parse(fs.readFileSync(NEW_DECK_PATH, 'utf8'));
  const newCards = newDeck.cards || newDeck;
  console.log(`New deck: ${newCards.length} cards`);

  // 3. Build map: normalized text → old audio filename
  const textToOldAudio = new Map();
  let duplicateTexts = 0;
  for (const card of oldCards) {
    const key = normalize(card.target);
    if (!key) continue;
    if (textToOldAudio.has(key)) {
      duplicateTexts++;
      continue; // keep first occurrence
    }
    textToOldAudio.set(key, card.audio);
  }
  console.log(`Text→audio map: ${textToOldAudio.size} entries (${duplicateTexts} duplicate texts skipped)`);

  // 4. Create staging directory
  if (fs.existsSync(STAGING_DIR)) {
    fs.rmSync(STAGING_DIR, { recursive: true });
  }
  fs.mkdirSync(STAGING_DIR, { recursive: true });

  // 5. Map new cards to old audio files
  let matched = 0;
  let unmatched = 0;
  let fileMissing = 0;
  const unmatchedCards = [];

  for (const card of newCards) {
    const key = normalize(card.target);
    const oldAudio = textToOldAudio.get(key);
    const newAudioName = card.audio; // e.g., "es-42.mp3"

    if (!oldAudio) {
      unmatched++;
      unmatchedCards.push({ id: card.id, target: card.target.substring(0, 60), audio: card.audio });
      continue;
    }

    const oldPath = path.join(AUDIO_DIR, oldAudio);
    const newPath = path.join(STAGING_DIR, newAudioName);

    if (!fs.existsSync(oldPath)) {
      fileMissing++;
      continue;
    }

    // Copy old audio file to new filename in staging
    fs.copyFileSync(oldPath, newPath);
    matched++;
  }

  console.log(`\nResults:`);
  console.log(`  Matched: ${matched}/${newCards.length} (${(matched/newCards.length*100).toFixed(1)}%)`);
  console.log(`  Unmatched (no old text match): ${unmatched}`);
  console.log(`  File missing on disk: ${fileMissing}`);

  if (unmatchedCards.length > 0 && unmatchedCards.length <= 200) {
    console.log(`\nUnmatched cards (will fall back to TTS):`);
    unmatchedCards.forEach(c => console.log(`  ${c.id}: "${c.target}" (${c.audio})`));
  } else if (unmatchedCards.length > 200) {
    console.log(`\nFirst 20 unmatched cards:`);
    unmatchedCards.slice(0, 20).forEach(c => console.log(`  ${c.id}: "${c.target}" (${c.audio})`));
  }

  // 6. Count remapped files
  const remappedFiles = fs.readdirSync(STAGING_DIR).filter(f => f.endsWith('.mp3'));
  console.log(`\nStaging dir has ${remappedFiles.length} remapped audio files`);

  // 7. Swap directories
  if (matched > 0) {
    // Backup non-Spanish files (hypertts-*.mp3 etc.) by copying them to staging
    const origFiles = fs.readdirSync(AUDIO_DIR);
    const nonSpanish = origFiles.filter(f => !f.startsWith('es-') && f.endsWith('.mp3'));
    console.log(`Preserving ${nonSpanish.length} non-Spanish audio files`);
    for (const f of nonSpanish) {
      fs.copyFileSync(path.join(AUDIO_DIR, f), path.join(STAGING_DIR, f));
    }

    // Remove old Spanish files and replace with remapped ones
    const oldSpanish = origFiles.filter(f => f.startsWith('es-') && f.endsWith('.mp3'));
    console.log(`Removing ${oldSpanish.length} old Spanish audio files...`);
    for (const f of oldSpanish) {
      fs.unlinkSync(path.join(AUDIO_DIR, f));
    }

    // Move remapped files into quest-audio dir
    const stagingFiles = fs.readdirSync(STAGING_DIR);
    for (const f of stagingFiles) {
      fs.renameSync(path.join(STAGING_DIR, f), path.join(AUDIO_DIR, f));
    }

    // Clean up staging dir
    fs.rmSync(STAGING_DIR, { recursive: true });

    const finalCount = fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('es-') && f.endsWith('.mp3')).length;
    console.log(`\n✅ Done! quest-audio now has ${finalCount} Spanish audio files (matched to new deck IDs)`);
    console.log(`   ${unmatched + fileMissing} cards will use TTS fallback`);
  } else {
    console.log('\n❌ No matches found — something went wrong. Staging dir left for inspection.');
  }
}

main();
