#!/usr/bin/env node
/**
 * Regenerate Hindi audio for the cards changed in the register-cleanup
 * pilot + batches 1-5. Reads the union of changed IDs from
 * /tmp/hi-changed-ids.txt and regenerates only those.
 *
 * Usage:
 *   GOOGLE_TTS_KEY=xxx node scripts/regen-hi-changed.cjs
 *   GOOGLE_TTS_KEY=xxx node scripts/regen-hi-changed.cjs --dry-run
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) {
  console.error('Error: Set GOOGLE_TTS_KEY environment variable');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const VOICE = 'hi-IN-Neural2-A';
const SPEAKING_RATE = 0.95;
const CONCURRENCY = 8;

const DECK = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'src', 'data', 'hindi', 'deck.json'), 'utf8'));
const CHANGED_IDS = new Set(fs.readFileSync('/tmp/hi-changed-ids.txt', 'utf8')
  .split('\n').map(s => s.trim()).filter(Boolean));
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'quest-audio');

const cards = DECK.filter(c => CHANGED_IDS.has(c.id));
console.log(`Found ${cards.length} cards to regenerate (out of ${CHANGED_IDS.size} requested IDs)`);

if (DRY_RUN) {
  cards.slice(0, 5).forEach(c => console.log(`  ${c.id}: ${c.target}`));
  console.log('... (dry run; no API calls)');
  process.exit(0);
}

function call(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { text },
      voice: { languageCode: 'hi-IN', name: VOICE },
      audioConfig: { audioEncoding: 'MP3', speakingRate: SPEAKING_RATE, pitch: 0, sampleRateHertz: 24000 },
    });
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        try {
          resolve(Buffer.from(JSON.parse(data).audioContent, 'base64'));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function retry(text, n = 4) {
  for (let i = 0; i <= n; i++) {
    try { return await call(text); }
    catch (e) {
      if (i === n) throw e;
      const wait = 1000 * Math.pow(2, i) + Math.random() * 500;
      console.warn(`  retry ${i+1} in ${Math.round(wait/1000)}s: ${e.message.slice(0,60)}`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

async function pmap(items, fn, limit) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) { const idx = i++; results[idx] = await fn(items[idx], idx); }
  }
  await Promise.all(Array.from({length: Math.min(limit, items.length)}, () => worker()));
  return results;
}

(async () => {
  let ok = 0, fail = 0;
  await pmap(cards, async (card, idx) => {
    try {
      const buf = await retry(card.target);
      const file = path.join(AUDIO_DIR, `hi-${card.id}.mp3`);
      fs.writeFileSync(file, buf);
      ok++;
      if ((ok + fail) % 20 === 0) console.log(`  ${ok+fail}/${cards.length}  ✓${ok} ✗${fail}`);
    } catch (e) {
      console.error(`  FAIL ${card.id}: ${e.message.slice(0, 100)}`);
      fail++;
    }
  }, CONCURRENCY);
  console.log(`\nDone: ${ok} ok, ${fail} failed`);
})();
