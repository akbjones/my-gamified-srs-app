#!/usr/bin/env node
// Regenerate the 5 एसी clips from their ttsText override (canonical Hindi
// voice, same settings as the main deck generator).
//   GOOGLE_TTS_KEY=... node scripts/tmp/regen-ac-clips.cjs
const fs = require('fs'), path = require('path'), https = require('https');
const API_KEY = process.env.GOOGLE_TTS_KEY; if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }
const VOICE = 'hi-IN-Chirp3-HD-Aoede', SR = 24000;
const AUDIO_DIR = 'public/quest-audio';
const deck = JSON.parse(fs.readFileSync('src/data/hindi/deck.json', 'utf8'));

function tts(text) {
  const body = JSON.stringify({ input: { text }, voice: { languageCode: 'hi-IN', name: VOICE },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0, sampleRateHertz: SR } });
  return new Promise((res, rej) => {
    const r = https.request({ hostname: 'texttospeech.googleapis.com', path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, resp => {
      let d = ''; resp.on('data', c => d += c);
      resp.on('end', () => resp.statusCode === 200 ? res(Buffer.from(JSON.parse(d).audioContent, 'base64'))
        : rej(new Error(`HTTP ${resp.statusCode}: ${d.slice(0, 120)}`)));
    });
    r.on('error', rej); r.write(body); r.end();
  });
}

(async () => {
  const cards = deck.filter(c => c.ttsText);
  console.log(`regenerating ${cards.length} clips from ttsText…`);
  for (const c of cards) {
    const buf = await tts(c.ttsText);
    const f = path.join(AUDIO_DIR, c.audio);
    fs.writeFileSync(f, buf);
    console.log(`  ✓ ${c.audio}  (${buf.length}B)  "${c.ttsText}"`);
    await new Promise(r => setTimeout(r, 250));
  }
  console.log('done');
})();
