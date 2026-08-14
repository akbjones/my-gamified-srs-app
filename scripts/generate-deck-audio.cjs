#!/usr/bin/env node
// Generic deck-audio generator. Reads a {file, text}[] list and synthesises
// each clip into public/quest-audio/. 2-wide with exponential backoff: a
// 6-wide burst trips a rate limit Google reports as API_KEY_INVALID, which
// looks exactly like a dead key. Resumes: existing non-trivial files skip.
//
//   GOOGLE_TTS_KEY=... TTS_LIST=docs/hindi/tts-list.json \
//   TTS_VOICE=hi-IN-Chirp3-HD-Aoede TTS_LANG=hi-IN node scripts/generate-deck-audio.cjs
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.join(__dirname, '..');
const API_KEY = process.env.GOOGLE_TTS_KEY;
const LIST = process.env.TTS_LIST;
const VOICE = process.env.TTS_VOICE;
const LANG = process.env.TTS_LANG;
if (!API_KEY || !LIST || !VOICE || !LANG) {
  console.error('Need GOOGLE_TTS_KEY, TTS_LIST, TTS_VOICE, TTS_LANG');
  process.exit(1);
}
const AUDIO = path.join(ROOT, 'public/quest-audio');
const list = JSON.parse(fs.readFileSync(path.join(ROOT, LIST), 'utf8'));

const sleep = ms => new Promise(r => setTimeout(r, ms));
function call(text) {
  const body = JSON.stringify({
    input: { text },
    voice: { languageCode: LANG, name: VOICE },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0, sampleRateHertz: 24000 },
  });
  return new Promise((res, rej) => {
    const r = https.request({ hostname: 'texttospeech.googleapis.com', path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () =>
        resp.statusCode === 200 ? res(Buffer.from(JSON.parse(d).audioContent, 'base64')) : rej(new Error(`HTTP ${resp.statusCode} ${d.slice(0, 120)}`))); });
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
  const pending = list.filter(e => {
    try { return fs.statSync(path.join(AUDIO, e.file)).size < 2000; } catch { return true; }
  });
  console.log(`voice ${VOICE} | ${pending.length} pending of ${list.length}`);
  let ok = 0, fail = 0; const failed = []; const CONC = 2;
  for (let i = 0; i < pending.length; i += CONC) {
    await Promise.all(pending.slice(i, i + CONC).map(async e => {
      try { fs.writeFileSync(path.join(AUDIO, e.file), await withRetry(e.text)); ok++; }
      catch (err) { fail++; failed.push({ file: e.file, err: String(err.message).slice(0, 80) }); }
    }));
    await sleep(120);
    if ((ok + fail) % 100 < CONC) console.log(`  ${ok + fail}/${pending.length}`);
  }
  console.log(`done: ${ok} generated, ${fail} failed`);
  if (failed.length) { fs.writeFileSync(path.join(ROOT, 'docs/audio-failed.json'), JSON.stringify(failed, null, 1)); console.log(failed.slice(0, 5)); }
  process.exit(fail ? 1 : 0);
})();
