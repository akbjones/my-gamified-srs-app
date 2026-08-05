#!/usr/bin/env node
// Regenerate audio for a deck's de-clump regen list (docs/declump/<deck>/regen-list.json).
// Generic version of the Hindi regen-pending script: same 2-wide concurrency +
// exponential backoff (a 6-wide burst trips a rate limit Google reports as
// API_KEY_INVALID, which looks exactly like a dead key).
// Usage: GOOGLE_TTS_KEY=... node scripts/regen-declump-audio.cjs --deck=indonesian
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.join(__dirname, '..');
const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }

const deckArg = (process.argv.find(a => a.startsWith('--deck=')) || '').split('=')[1];
if (!deckArg) { console.error('Use --deck=<deckDir>'); process.exit(1); }

// Canonical voice per language (mirrors scripts/generate-audio.cjs; Welsh is
// deliberately absent — its audio is Azure NiaNeural on a different pipeline).
const VOICES = {
  spanish: 'es-US-Neural2-A', italian: 'it-IT-Neural2-A', german: 'de-DE-Neural2-G',
  french: 'fr-FR-Neural2-F', portuguese: 'pt-BR-Neural2-A', dutch: 'nl-NL-Wavenet-F',
  swedish: 'sv-SE-Wavenet-A', hindi: 'hi-IN-Chirp3-HD-Aoede', turkish: 'tr-TR-Wavenet-A',
  russian: 'ru-RU-Wavenet-A', indonesian: 'id-ID-Chirp3-HD-Aoede', greek: 'el-GR-Chirp3-HD-Aoede',
  korean: 'ko-KR-Chirp3-HD-Aoede', japanese: 'ja-JP-Chirp3-HD-Aoede',
};
const VOICE = VOICES[deckArg];
if (!VOICE) { console.error(`No canonical Google voice for "${deckArg}" (Welsh uses the Azure pipeline)`); process.exit(1); }

const AUDIO = path.join(ROOT, 'public/quest-audio');
const deck = JSON.parse(fs.readFileSync(path.join(ROOT, `src/data/${deckArg}/deck.json`), 'utf8'));
const byId = new Map(deck.map(c => [String(c.id), c]));
const list = JSON.parse(fs.readFileSync(path.join(ROOT, `docs/declump/${deckArg}/regen-list.json`), 'utf8'));

const sleep = ms => new Promise(r => setTimeout(r, ms));
function call(text) {
  const body = JSON.stringify({
    input: { text },
    voice: { languageCode: VOICE.split('-').slice(0, 2).join('-'), name: VOICE },
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
  let ok = 0, fail = 0; const failed = []; const CONC = 2;
  for (let i = 0; i < list.length; i += CONC) {
    await Promise.all(list.slice(i, i + CONC).map(async e => {
      const c = byId.get(String(e.id)); if (!c || !c.audio) { fail++; failed.push(e.id); return; }
      try { fs.writeFileSync(path.join(AUDIO, c.audio), await withRetry(c.ttsText || c.target)); ok++; }
      catch (err) { fail++; failed.push(e.id); }
    }));
    await sleep(120);
    if ((ok + fail) % 50 < CONC) process.stdout.write(`\r  ${ok + fail}/${list.length}`);
  }
  console.log(`\n${deckArg}: ${ok} regenerated, ${fail} failed`);
  if (failed.length) fs.writeFileSync(path.join(ROOT, `docs/declump/${deckArg}/regen-failed.json`), JSON.stringify(failed));
  process.exit(fail ? 1 : 0);
})();
