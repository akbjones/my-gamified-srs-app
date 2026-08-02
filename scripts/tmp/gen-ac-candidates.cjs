#!/usr/bin/env node
// The AC sentence (hi-0217) reads wrong. The clip is technically healthy, so
// the fault is how the voice pronounces एसी. Generate the SAME sentence with
// different spellings of "AC" so the user can pick the one that sounds right.
// Whatever wins becomes a ttsText override (deck text stays एसी).
//   GOOGLE_TTS_KEY=... node scripts/tmp/gen-ac-candidates.cjs
const fs = require('fs'), path = require('path'), https = require('https');
const API_KEY = process.env.GOOGLE_TTS_KEY; if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }
const SR = 24000, voice = 'hi-IN-Chirp3-HD-Aoede';
const OUT = '/private/tmp/ac-candidates'; fs.mkdirSync(OUT, { recursive: true });

const BASE = 'कमरे में एसी काम नहीं कर रहा है।';
const CANDS = [
  { id: 'A_current', label: 'CURRENT — एसी as written', text: BASE },
  { id: 'B_dotted',  label: 'ए.सी. (letters with dots)', text: 'कमरे में ए.सी. काम नहीं कर रहा है।' },
  { id: 'C_spaced',  label: 'ए सी (letters spaced)',      text: 'कमरे में ए सी काम नहीं कर रहा है।' },
  { id: 'D_full',    label: 'एयर कंडीशनर (full word)',    text: 'कमरे में एयर कंडीशनर काम नहीं कर रहा है।' },
  { id: 'E_latin',   label: 'AC in Latin letters',        text: 'कमरे में AC काम नहीं कर रहा है।' },
];

function tts(text) {
  const body = JSON.stringify({ input: { text }, voice: { languageCode: 'hi-IN', name: voice },
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
  const manifest = [];
  for (const c of CANDS) {
    const buf = await tts(c.text);
    fs.writeFileSync(path.join(OUT, `${c.id}.mp3`), buf);
    manifest.push({ ...c, b64: buf.toString('base64'), bytes: buf.length });
    console.log(`  ${c.id}: ${c.text}  (${buf.length}B)`);
    await new Promise(r => setTimeout(r, 250));
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`\n✓ ${manifest.length} candidates → ${OUT}/manifest.json`);
})();
