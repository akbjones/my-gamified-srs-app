#!/usr/bin/env node
/**
 * Fix zero-byte Welsh audio files by regenerating them.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'welsh', 'deck.json');
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'quest-audio');

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
let fixed = 0;

for (const card of deck) {
  if (!card.audio) continue;
  const outPath = path.join(AUDIO_DIR, card.audio);

  try {
    const stat = fs.statSync(outPath);
    if (stat.size >= 1000) continue; // Good file, skip
  } catch (e) {
    // File doesn't exist, regenerate
  }

  // Regenerate this file
  const text = card.target
    .replace(/'/g, "'\\''")
    .replace(/[""«»]/g, '"')
    .replace(/[–—]/g, '-');

  try {
    execSync(`espeak-ng -v cy -s 150 '${text}' --stdout | lame --quiet -V 2 - '${outPath}'`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });
    const newSize = fs.statSync(outPath).size;
    if (newSize > 0) {
      fixed++;
      console.log(`  ✓ Fixed ${card.audio} (${newSize} bytes) — "${card.target.slice(0, 50)}"`);
    } else {
      // If still 0 bytes, generate a silent placeholder
      console.log(`  ⚠ Still empty: ${card.audio} — "${card.target.slice(0, 50)}"`);
    }
  } catch (err) {
    console.log(`  ✗ Failed: ${card.audio} — ${err.message.slice(0, 80)}`);
  }
}

console.log(`\nFixed ${fixed} files`);
const tiny = fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('cy-')).filter(f => {
  try { return fs.statSync(path.join(AUDIO_DIR, f)).size < 1000; } catch(e) { return true; }
}).length;
console.log(`Remaining tiny files: ${tiny}`);
