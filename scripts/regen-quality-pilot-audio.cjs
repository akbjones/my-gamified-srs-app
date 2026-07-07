#!/usr/bin/env node
/**
 * Regen audio for the quality-pilot cards (RU + TR) with Chirp3-HD-Aoede,
 * reading the staged pilot at /tmp/quality-pilot.json.
 * GOOGLE_TTS_KEY required.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = process.env.GOOGLE_TTS_KEY;
if (!KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }

const VOICES = {
  russian: { lc: 'ru-RU', name: 'ru-RU-Chirp3-HD-Aoede', prefix: 'ru' },
  turkish: { lc: 'tr-TR', name: 'tr-TR-Chirp3-HD-Aoede', prefix: 'tr' },
};
const AUDIO_DIR = path.resolve(__dirname, '..', 'public', 'quest-audio');
const pilot = JSON.parse(fs.readFileSync('/tmp/quality-pilot.json', 'utf8'));

function tts(text, v) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { text },
      voice: { languageCode: v.lc, name: v.name },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 0, sampleRateHertz: 24000 },
    });
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0,150)}`));
        resolve(Buffer.from(JSON.parse(d).audioContent, 'base64'));
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

(async () => {
  const files = [];
  for (const [lang, fixes] of Object.entries(pilot)) {
    const v = VOICES[lang];
    const deck = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'data', lang, 'deck.json'), 'utf8'));
    const byId = new Map(deck.map(c => [c.id, c]));
    for (const p of fixes) {
      const card = byId.get(p.id);
      const buf = await tts(card.target, v);
      const file = card.audio;  // e.g. ru-ru-0377.mp3
      fs.writeFileSync(path.join(AUDIO_DIR, file), buf);
      files.push(file);
      console.log(`  ✓ ${file}  (${buf.length}B)  ${card.target.slice(0, 40)}`);
    }
  }
  fs.writeFileSync('/tmp/quality-pilot-files.json', JSON.stringify(files));
  console.log(`\n${files.length} files regenerated`);
})();
