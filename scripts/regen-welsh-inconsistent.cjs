#!/usr/bin/env node
/**
 * Regenerate ONLY the 1,082 Welsh MP3s that don't match the canonical
 * Azure-NiaNeural encoder signature (0x80). Reads the file list from
 * /tmp/welsh-regen-list.txt (created by the auditor) so we never touch
 * the 2,862 already-good files.
 *
 * Usage:
 *   node scripts/regen-welsh-inconsistent.cjs [--start N] [--resume]
 *
 * Checkpoints to /tmp/welsh-regen-progress.json every 25 files so a
 * crash/abort can resume without redoing work.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const AZURE_KEY    = 'nAHo7lJTOlg23D7ZQVv9uysWAMeTnM3Utag0pnoGRhaFLvLLdB4XJQQJ99CDACmepeSXJ3w3AAAYACOGYniL';
const AZURE_REGION = 'uksouth';
const VOICE        = 'cy-GB-NiaNeural';
const OUTPUT_FMT   = 'audio-16khz-128kbitrate-mono-mp3';
const DELAY_MS     = 600;            // 600ms between requests = ~100/min (well within paid tier)
const TOKEN_REFRESH = 400;
const LOG_EVERY    = 25;
const CHECKPOINT_EVERY = 25;

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/welsh/deck.json');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');
const LIST_PATH = '/tmp/welsh-regen-list.txt';
const PROGRESS_PATH = '/tmp/welsh-regen-progress.json';

const args = process.argv.slice(2);
const RESUME = args.includes('--resume');
const startArg = args.find(a => a.startsWith('--start='));
let START = startArg ? parseInt(startArg.split('=')[1], 10) : 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchToken() {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: `${AZURE_REGION}.api.cognitive.microsoft.com`,
      path: '/sts/v1.0/issueToken',
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': AZURE_KEY, 'Content-Length': '0' },
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

function synthesise(token, text) {
  const escaped = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
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
        else reject(new Error(`TTS ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0, 200)}`));
      });
    });
    req.on('error', reject);
    req.write(ssml);
    req.end();
  });
}

(async () => {
  const fileList = fs.readFileSync(LIST_PATH, 'utf8').trim().split('\n');
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const audioToCard = new Map();
  for (const c of deck) if (c.audio) audioToCard.set(c.audio, c);

  // Build the work list as {audioFile, text}
  const work = [];
  for (const f of fileList) {
    const card = audioToCard.get(f);
    if (!card) {
      // Orphan MP3 with no matching card — keep but don't regenerate
      continue;
    }
    work.push({ file: f, text: card.target, id: card.id });
  }

  console.log(`Total work: ${work.length} files (${fileList.length - work.length} orphan files with no deck card)`);

  // Resume from checkpoint if requested
  if (RESUME && fs.existsSync(PROGRESS_PATH)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
    if (typeof progress.next === 'number') {
      START = progress.next;
      console.log(`Resuming from index ${START}`);
    }
  }

  let token = await fetchToken();
  let tokenAge = 0;
  let done = 0;
  let failed = 0;
  const failures = [];

  for (let i = START; i < work.length; i++) {
    const w = work[i];
    try {
      if (tokenAge >= TOKEN_REFRESH) {
        token = await fetchToken();
        tokenAge = 0;
      }
      const buf = await synthesise(token, w.text);
      fs.writeFileSync(path.join(AUDIO_DIR, w.file), buf);
      done++;
      tokenAge++;
    } catch (err) {
      failed++;
      failures.push({ file: w.file, id: w.id, error: err.message });
      console.log(`  ✗ [${w.id}] ${w.file}: ${err.message.slice(0, 80)}`);
      // Re-fetch token on auth errors
      if (err.message.includes('401') || err.message.includes('403')) {
        token = await fetchToken();
        tokenAge = 0;
      }
    }
    if ((i + 1) % LOG_EVERY === 0) {
      console.log(`  [${i + 1}/${work.length}]  done=${done}  failed=${failed}`);
    }
    if ((i + 1) % CHECKPOINT_EVERY === 0) {
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ next: i + 1, done, failed }, null, 2));
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ next: work.length, done, failed, failures }, null, 2));
  console.log(`\n✅ Done. Regenerated: ${done}  Failed: ${failed}`);
  if (failures.length) console.log(`Failures saved to ${PROGRESS_PATH}`);
})();
