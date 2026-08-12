#!/usr/bin/env node
// Generate audio for the mum deck from docs/mum-deck/tts-list.json.
// Canonical Spanish voice (CANONICAL-VOICES.md): es-US-Chirp3-HD-Aoede.
// 2-wide + exponential backoff (a 6-wide burst trips a rate limit Google
// reports as API_KEY_INVALID, which looks exactly like a dead key).
// Usage: GOOGLE_TTS_KEY=... node scripts/generate-mum-audio.cjs
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.join(__dirname, '..');
const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }

const VOICE = 'es-US-Chirp3-HD-Aoede';
const AUDIO = path.join(ROOT, 'public/quest-audio');
const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/mum-deck/tts-list.json'), 'utf8'));

const sleep = ms => new Promise(r => setTimeout(r, ms));
function call(text) {
  const body = JSON.stringify({
    input: { text },
    voice: { languageCode: 'es-US', name: VOICE },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0, sampleRateHertz: 24000 },
  });
  return new Promise((res, rej) => {
    const r = https.request({ hostname: 'texttospeech.googleapis.com', path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () =>
        resp.statusCode === 200 ? res(Buffer.from(JSON.parse(d).audioContent, 'base64')) : rej(new Error(`HTTP ${resp.statusCode}`))); });
    r.on('error', rej); r.write(body); r.end();
  });
}
async function withRetry(text, tries = 5) {
  let wait = 800;
  for (let i = 0; i < tries; i++) {
    try { return await call(text); } catch (e) { if (i === tries - 1) throw e; await sleep(wait); wait *= 2; }
  }
}

(async () => {
  // Resume support: skip clips already generated (a prior run may have been cut off).
  const pending = list.filter(e => {
    try { return fs.statSync(path.join(AUDIO, e.file)).size < 2000; } catch { return true; }
  });
  console.log(`pending ${pending.length} of ${list.length}`);
  let ok = 0, fail = 0; const failed = []; const CONC = 2;
  for (let i = 0; i < pending.length; i += CONC) {
    await Promise.all(pending.slice(i, i + CONC).map(async e => {
      try { fs.writeFileSync(path.join(AUDIO, e.file), await withRetry(e.text)); ok++; }
      catch (err) { fail++; failed.push(e.file); }
    }));
    await sleep(120);
    if ((ok + fail) % 100 < CONC) console.log(`  ${ok + fail}/${pending.length}`);
  }
  console.log(`mum audio: ${ok} generated, ${fail} failed`);
  if (failed.length) fs.writeFileSync(path.join(ROOT, 'docs/mum-deck/audio-failed.json'), JSON.stringify(failed));
  process.exit(fail ? 1 : 0);
})();
