#!/usr/bin/env node
/**
 * generate-audio.cjs
 *
 * Batch-generates MP3 audio for every card in deck.json using Google Cloud TTS.
 * Uses es-US-Standard-A (Latin American female voice) at normal speed.
 *
 * Usage:
 *   GOOGLE_TTS_KEY=your-api-key node scripts/generate-audio.cjs
 *
 * Options:
 *   --resume        Skip cards that already have generated files
 *   --concurrency=N Number of parallel requests (default: 20)
 *   --voice=NAME    Google TTS voice name (default: es-US-Standard-A)
 *   --speed=N       Speaking rate 0.25-4.0 (default: 0.95)
 *   --dry-run       Print what would be generated without calling API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Config ──────────────────────────────────────────────────────
const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) {
  console.error('Error: Set GOOGLE_TTS_KEY environment variable');
  console.error('Usage: GOOGLE_TTS_KEY=your-key node scripts/generate-audio.cjs');
  process.exit(1);
}

const args = process.argv.slice(2);
const resume = args.includes('--resume');
const dryRun = args.includes('--dry-run');
const concurrency = parseInt((args.find(a => a.startsWith('--concurrency=')) || '').split('=')[1]) || 20;
const voiceName = (args.find(a => a.startsWith('--voice=')) || '').split('=')[1] || 'es-US-Standard-A';
const speakingRate = parseFloat((args.find(a => a.startsWith('--speed=')) || '').split('=')[1]) || 0.95;

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'quest-audio');
const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

// ── Helpers ─────────────────────────────────────────────────────
function audioFilename(cardId) {
  return `es-${cardId}.mp3`;
}

function callGoogleTTS(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { text },
      voice: {
        languageCode: voiceName.split('-').slice(0, 2).join('-'), // e.g. es-US
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate,
        pitch: 0,
        sampleRateHertz: 24000,
      },
    });

    const url = new URL(TTS_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          resolve(Buffer.from(json.audioContent, 'base64'));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Rate limiter — token bucket, refills at `rate` tokens/sec
class RateLimiter {
  constructor(ratePerMinute) {
    this.interval = 60000 / ratePerMinute; // ms between tokens
    this.lastTime = 0;
    this.queue = [];
    this.running = false;
  }

  async acquire() {
    return new Promise(resolve => {
      this.queue.push(resolve);
      this._process();
    });
  }

  async _process() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const now = Date.now();
      const wait = Math.max(0, this.lastTime + this.interval - now);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      this.lastTime = Date.now();
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
    this.running = false;
  }
}

const rateLimiter = new RateLimiter(240); // stay well under 300 RPM quota

// Retry with exponential backoff
async function callWithRetry(text, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await rateLimiter.acquire();
      return await callGoogleTTS(text);
    } catch (err) {
      if (attempt === retries) throw err;
      // Longer backoff for rate limit errors
      const base = err.message.includes('429') ? 5000 : 1000;
      const wait = Math.pow(2, attempt) * base + Math.random() * 1000;
      if (attempt > 0) console.warn(`  Retry ${attempt + 1} in ${Math.round(wait / 1000)}s: ${err.message.slice(0, 80)}`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// Run promises with concurrency limit
async function pMap(items, fn, limit) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  Google Cloud TTS Audio Generator            │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│  Voice: ${voiceName.padEnd(35)}│`);
  console.log(`│  Speed: ${String(speakingRate).padEnd(35)}│`);
  console.log(`│  Concurrency: ${String(concurrency).padEnd(29)}│`);
  console.log(`│  Resume mode: ${String(resume).padEnd(29)}│`);
  console.log('└─────────────────────────────────────────────┘');

  // Load deck
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
  console.log(`\nLoaded ${deck.length} cards from deck.json`);

  // Ensure audio directory exists
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  // Filter cards to process
  let toProcess = deck;
  if (resume) {
    const existing = new Set(fs.readdirSync(AUDIO_DIR));
    toProcess = deck.filter(card => !existing.has(audioFilename(card.id)));
    console.log(`Resuming: ${deck.length - toProcess.length} already done, ${toProcess.length} remaining`);
  }

  if (dryRun) {
    console.log(`\nDry run — would generate ${toProcess.length} audio files`);
    toProcess.slice(0, 5).forEach(c => {
      console.log(`  ${audioFilename(c.id)}: "${c.target}"`);
    });
    if (toProcess.length > 5) console.log(`  ... and ${toProcess.length - 5} more`);
    return;
  }

  if (toProcess.length === 0) {
    console.log('\nAll cards already have audio files. Nothing to do.');
  } else {
    console.log(`\nGenerating ${toProcess.length} audio files (${concurrency} parallel)...\n`);

    let done = 0;
    let failed = 0;
    const failedCards = [];
    const startTime = Date.now();

    await pMap(toProcess, async (card) => {
      const filename = audioFilename(card.id);
      const filepath = path.join(AUDIO_DIR, filename);

      try {
        const mp3Buffer = await callWithRetry(card.target);
        fs.writeFileSync(filepath, mp3Buffer);
        done++;

        // Progress every 50 cards
        if (done % 50 === 0 || done === toProcess.length) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = done / elapsed;
          const remaining = (toProcess.length - done) / rate;
          const pct = ((done / toProcess.length) * 100).toFixed(1);
          console.log(`  [${pct}%] ${done}/${toProcess.length} done — ${rate.toFixed(1)} cards/s — ~${Math.ceil(remaining)}s remaining`);
        }
      } catch (err) {
        failed++;
        failedCards.push({ id: card.id, target: card.target, error: err.message });
        console.error(`  FAILED card ${card.id}: ${err.message}`);
      }
    }, concurrency);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nGeneration complete: ${done} succeeded, ${failed} failed in ${totalTime}s`);

    if (failedCards.length > 0) {
      const failPath = path.join(__dirname, 'failed-audio.json');
      fs.writeFileSync(failPath, JSON.stringify(failedCards, null, 2));
      console.log(`Failed cards saved to: ${failPath}`);
    }
  }

  // ── Update deck.json audio fields ────────────────────────────
  console.log('\nUpdating deck.json audio fields...');
  const audioFiles = new Set(fs.readdirSync(AUDIO_DIR));
  let updated = 0;

  for (const card of deck) {
    const filename = audioFilename(card.id);
    if (audioFiles.has(filename)) {
      if (card.audio !== filename) {
        card.audio = filename;
        updated++;
      }
    }
  }

  if (updated > 0) {
    fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
    console.log(`Updated ${updated} cards with audio filenames`);
  } else {
    console.log('All audio fields already up to date');
  }

  // ── Summary ──────────────────────────────────────────────────
  const withAudio = deck.filter(c => c.audio && c.audio.length > 0).length;
  console.log(`\nFinal: ${withAudio}/${deck.length} cards have audio (${((withAudio/deck.length)*100).toFixed(1)}%)`);

  // Size report
  let totalSize = 0;
  for (const file of audioFiles) {
    const stat = fs.statSync(path.join(AUDIO_DIR, file));
    totalSize += stat.size;
  }
  console.log(`Total audio: ${audioFiles.size} files, ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
