#!/usr/bin/env node
/**
 * regen-audio.cjs
 *
 * Regenerates audio ONLY for cards whose target text has changed.
 * Compares current deck.json against a baseline commit to find changed cards,
 * then deletes old audio files and calls generate-audio.cjs with --resume.
 *
 * Usage:
 *   GOOGLE_TTS_KEY=your-key node scripts/regen-audio.cjs --lang=ru [--baseline=COMMIT]
 *
 * Options:
 *   --lang=CODE      Language code (required)
 *   --baseline=SHA   Git commit to compare against (default: 54086741)
 *   --dry-run        Show what would be regenerated without doing it
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const lang = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const baseline = (args.find(a => a.startsWith('--baseline=')) || '--baseline=54086741').split('=')[1];
const dryRun = args.includes('--dry-run');

if (!lang) {
  console.error('Usage: GOOGLE_TTS_KEY=key node scripts/regen-audio.cjs --lang=ru');
  process.exit(1);
}

const LANG_MAP = {
  es: 'spanish', it: 'italian', fr: 'french', pt: 'portuguese',
  de: 'german', nl: 'dutch', sv: 'swedish', cy: 'welsh',
  hi: 'hindi', tr: 'turkish', ru: 'russian',
};

const deckDir = LANG_MAP[lang];
if (!deckDir) {
  console.error(`Unknown language: ${lang}`);
  process.exit(1);
}

const deckPath = `src/data/${deckDir}/deck.json`;
const audioDir = path.join(__dirname, '..', 'public', 'quest-audio');

// Load current deck
const currentDeck = JSON.parse(fs.readFileSync(path.join(__dirname, '..', deckPath), 'utf8'));

// Load baseline deck from git
let baselineDeck;
try {
  const oldJson = execSync(`git show ${baseline}:${deckPath}`, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  baselineDeck = JSON.parse(oldJson);
} catch (e) {
  console.error(`Could not load baseline deck from commit ${baseline}`);
  process.exit(1);
}

// Find changed cards
const oldMap = {};
for (const c of baselineDeck) oldMap[c.id] = c.target;

const changed = [];
for (const c of currentDeck) {
  if (!oldMap[c.id] || c.target !== oldMap[c.id]) {
    changed.push(c);
  }
}

console.log(`Found ${changed.length} cards with changed target text in ${deckDir}`);

if (changed.length === 0) {
  console.log('Nothing to regenerate.');
  process.exit(0);
}

// Delete old audio files for changed cards
let deleted = 0;
for (const c of changed) {
  const audioFile = path.join(audioDir, c.audio);
  if (fs.existsSync(audioFile)) {
    if (dryRun) {
      console.log(`  Would delete: ${c.audio}`);
    } else {
      fs.unlinkSync(audioFile);
      deleted++;
    }
  }
}

console.log(dryRun ? `Would delete ${changed.length} audio files` : `Deleted ${deleted} audio files`);

if (dryRun) {
  console.log('\nDry run complete. Run without --dry-run to regenerate.');
  process.exit(0);
}

// Now run generate-audio.cjs with --resume to regenerate only deleted files
console.log(`\nRunning generate-audio.cjs --lang=${lang} --resume...`);
try {
  execSync(`node ${path.join(__dirname, 'generate-audio.cjs')} --lang=${lang} --resume`, {
    stdio: 'inherit',
    env: process.env,
  });
} catch (e) {
  console.error('Audio generation failed:', e.message);
  process.exit(1);
}
