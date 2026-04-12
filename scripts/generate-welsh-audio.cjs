#!/usr/bin/env node
/**
 * Generate Welsh audio using espeak-ng + lame (since Google TTS doesn't support Welsh).
 * Generates MP3 files for all cards in the Welsh deck.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'welsh', 'deck.json');
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'quest-audio');
const RESUME = process.argv.includes('--resume');

// Ensure output directory exists
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
let generated = 0;
let skipped = 0;
let failed = 0;

console.log(`Generating Welsh audio for ${deck.length} cards...`);
console.log(`Output: ${AUDIO_DIR}`);
console.log(`Resume mode: ${RESUME}\n`);

for (let i = 0; i < deck.length; i++) {
  const card = deck[i];
  const audioFile = card.audio;
  if (!audioFile) {
    console.log(`  ⚠ Card ${card.id} has no audio field, skipping`);
    skipped++;
    continue;
  }

  const outPath = path.join(AUDIO_DIR, audioFile);

  // Skip if already exists in resume mode
  if (RESUME && fs.existsSync(outPath)) {
    skipped++;
    continue;
  }

  try {
    // espeak-ng outputs WAV to stdout, pipe to lame for MP3
    // Use -s 150 for slightly slower speech (default 175 is fast)
    const text = card.target.replace(/'/g, "'\\''"); // escape single quotes
    execSync(`espeak-ng -v cy -s 150 '${text}' --stdout | lame --quiet -V 2 - '${outPath}'`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });
    generated++;

    if ((generated + skipped) % 100 === 0) {
      console.log(`  Progress: ${generated + skipped}/${deck.length} (${generated} generated, ${skipped} skipped)`);
    }
  } catch (err) {
    failed++;
    if (failed <= 5) {
      console.log(`  ✗ Failed card ${card.id}: ${err.message.slice(0, 100)}`);
    }
  }
}

console.log(`\n✅ Done: ${generated} generated, ${skipped} skipped, ${failed} failed`);
console.log(`Total files in ${AUDIO_DIR}: ${fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('cy-')).length}`);
