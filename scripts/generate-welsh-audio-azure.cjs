#!/usr/bin/env node
/**
 * Generate Welsh deck audio using Azure TTS (cy-GB-NiaNeural)
 * Overwrites all existing Welsh audio files with high-quality Azure output.
 *
 * Usage:  node scripts/generate-welsh-audio-azure.cjs [--start N]
 *   --start N   Resume from card index N (0-based, default 0)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Config ──────────────────────────────────────────────────────────────────
const AZURE_KEY    = 'nAHo7lJTOlg23D7ZQVv9uysWAMeTnM3Utag0pnoGRhaFLvLLdB4XJQQJ99CDACmepeSXJ3w3AAAYACOGYniL';
const AZURE_REGION = 'uksouth';
const VOICE        = 'cy-GB-NiaNeural';
const OUTPUT_FMT   = 'audio-16khz-128kbitrate-mono-mp3';
const DELAY_MS     = 3000;          // 3 s between requests (20 req/min free tier)
const TOKEN_REFRESH = 500;          // refresh token every N requests
const LOG_EVERY     = 50;

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH  = path.join(ROOT, 'src/data/welsh/deck.json');
const AUDIO_DIR  = path.join(ROOT, 'public/quest-audio');

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Fetch an Azure access token (valid ~10 min). */
function fetchToken() {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: `${AZURE_REGION}.api.cognitive.microsoft.com`,
      path: '/sts/v1.0/issueToken',
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Length': '0',
      },
    };
    const req = https.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(body);
        else reject(new Error(`Token fetch failed ${res.statusCode}: ${body}`));
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/** Synthesise one sentence and return the mp3 buffer. */
function synthesise(token, text) {
  // Escape XML special chars in the sentence
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="cy-GB"><voice name="${VOICE}">${escaped}</voice></speak>`;

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: `${AZURE_REGION}.tts.speech.microsoft.com`,
      path: '/cognitiveservices/v1',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': OUTPUT_FMT,
        'User-Agent': 'SRSAppAudioGen',
      },
    };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        if (res.statusCode === 200) resolve(Buffer.concat(chunks));
        else reject(new Error(`TTS ${res.statusCode}: ${Buffer.concat(chunks).toString()}`));
      });
    });
    req.on('error', reject);
    req.write(ssml);
    req.end();
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Parse --start flag
  let startIdx = 0;
  const startFlag = process.argv.indexOf('--start');
  if (startFlag !== -1 && process.argv[startFlag + 1]) {
    startIdx = parseInt(process.argv[startFlag + 1], 10) || 0;
  }

  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  console.log(`Welsh Azure TTS: ${deck.length} cards, starting at index ${startIdx}`);
  console.log(`Output dir: ${AUDIO_DIR}`);
  console.log(`Delay: ${DELAY_MS}ms (~${Math.round(60000/DELAY_MS)} req/min)`);
  const eta = ((deck.length - startIdx) * DELAY_MS / 1000 / 60).toFixed(1);
  console.log(`Estimated time: ~${eta} minutes\n`);

  // Ensure output dir exists
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  let token = await fetchToken();
  console.log('Got initial Azure token.\n');

  let generated = 0;
  let errors = 0;
  const errorLog = [];
  const t0 = Date.now();

  for (let i = startIdx; i < deck.length; i++) {
    const card = deck[i];
    const outFile = path.join(AUDIO_DIR, card.audio);

    // Refresh token periodically
    if (generated > 0 && generated % TOKEN_REFRESH === 0) {
      try {
        token = await fetchToken();
        console.log(`  [Token refreshed at request ${generated}]`);
      } catch (err) {
        console.error(`  [Token refresh failed, retrying in 10s: ${err.message}]`);
        await sleep(10000);
        token = await fetchToken();
      }
    }

    try {
      const mp3 = await synthesise(token, card.target);
      fs.writeFileSync(outFile, mp3);
      generated++;
    } catch (err) {
      errors++;
      const msg = `  ERROR card ${i} (${card.id}): ${err.message}`;
      console.error(msg);
      errorLog.push({ index: i, id: card.id, target: card.target, error: err.message });

      // On 429 (rate limit), wait longer and retry once
      if (err.message.includes('429')) {
        console.log('  Rate limited – waiting 30s before retry...');
        await sleep(30000);
        try {
          token = await fetchToken();
          const mp3 = await synthesise(token, card.target);
          fs.writeFileSync(outFile, mp3);
          generated++;
          errors--; // undo error count
          errorLog.pop();
          console.log('  Retry succeeded.');
        } catch (err2) {
          console.error(`  Retry also failed: ${err2.message}`);
        }
      }
    }

    // Progress log
    if (generated > 0 && generated % LOG_EVERY === 0) {
      const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
      const remaining = (((deck.length - i - 1) * DELAY_MS) / 1000 / 60).toFixed(1);
      console.log(`  [${generated}/${deck.length - startIdx}] ${elapsed}m elapsed, ~${remaining}m remaining, ${errors} errors`);
    }

    // Rate-limit delay (skip after last card)
    if (i < deck.length - 1) await sleep(DELAY_MS);
  }

  // Summary
  const totalMin = ((Date.now() - t0) / 1000 / 60).toFixed(1);
  console.log(`\nDone! Generated: ${generated}, Errors: ${errors}, Time: ${totalMin} min`);

  if (errorLog.length > 0) {
    const errPath = path.join(ROOT, 'scripts/output/cy-azure-audio-errors.json');
    fs.mkdirSync(path.dirname(errPath), { recursive: true });
    fs.writeFileSync(errPath, JSON.stringify(errorLog, null, 2));
    console.log(`Error log: ${errPath}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
