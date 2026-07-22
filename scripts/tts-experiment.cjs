#!/usr/bin/env node
// One-off synthesis experiment for script-teacher letter clips (Hangul).
// Problem: comma-doubled "까, 까" runs together ("kkakka", long vowel);
// single "아" collapsed to near-silence in the first pilot.
// Tries variants per letter and measures objectively (duration + loudest/gap
// profile via afconvert→WAV): we want ~2 clean repetitions with a real gap,
// or a healthy single. Writes to the scratchpad only — never final names.
// Usage: GOOGLE_TTS_KEY=... node scripts/tts-experiment.cjs <outdir>

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const API_KEY = process.env.GOOGLE_TTS_KEY;
const OUT = process.argv[2];
if (!API_KEY || !OUT) { console.error('need GOOGLE_TTS_KEY and outdir'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const VOICE = 'ko-KR-Chirp3-HD-Aoede';
const LETTERS = { kka: '까', wa: '와', a: '아', ka: '카' };
const VARIANTS = [
  { key: 'single', text: s => s, rate: 0.9 },
  { key: 'single-period', text: s => `${s}.`, rate: 0.9 },
  { key: 'double-period', text: s => `${s}. ${s}.`, rate: 0.9 },
  { key: 'double-period-r1', text: s => `${s}. ${s}.`, rate: 1.0 },
  { key: 'markup-pause', markup: s => `${s} [pause long] ${s}`, rate: 0.9 },
];

function tts(input, rate) {
  const body = JSON.stringify({
    input,
    voice: { languageCode: 'ko-KR', name: VOICE },
    audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch: 0, sampleRateHertz: 24000 },
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'texttospeech.googleapis.com', path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => res.statusCode === 200
        ? resolve(Buffer.from(JSON.parse(d).audioContent, 'base64'))
        : reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0, 140)}`)));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

// WAV analysis: 25ms RMS windows → duration, peak dB, voiced spans, longest
// internal gap between voiced spans (the "did the two syllables separate" test).
function analyze(mp3Path) {
  const wav = mp3Path.replace(/\.mp3$/, '.wav');
  execSync(`afconvert -f WAVE -d LEI16@24000 -c 1 "${mp3Path}" "${wav}"`, { stdio: 'pipe' });
  const buf = fs.readFileSync(wav);
  const data = buf.subarray(44); // pragmatic: standard 44-byte header from afconvert
  const samples = data.length / 2;
  const win = Math.floor(24000 * 0.025);
  const rms = [];
  for (let i = 0; i + win < samples; i += win) {
    let s = 0;
    for (let j = 0; j < win; j++) { const v = data.readInt16LE((i + j) * 2) / 32768; s += v * v; }
    rms.push(Math.sqrt(s / win));
  }
  const peak = Math.max(...rms);
  const thresh = Math.max(0.02, peak * 0.12);
  const voiced = rms.map(r => r > thresh);
  // trim leading/trailing silence, find voiced spans
  const spans = [];
  let start = null;
  voiced.forEach((v, i) => {
    if (v && start === null) start = i;
    if (!v && start !== null) { spans.push([start, i]); start = null; }
  });
  if (start !== null) spans.push([start, voiced.length]);
  // merge spans separated by < 60ms (intra-syllable dips)
  const merged = [];
  for (const sp of spans) {
    if (merged.length && sp[0] - merged[merged.length - 1][1] < 3) merged[merged.length - 1][1] = sp[1];
    else merged.push([...sp]);
  }
  const gaps = [];
  for (let i = 1; i < merged.length; i++) gaps.push((merged[i][0] - merged[i - 1][1]) * 0.025);
  return {
    dur: +(samples / 24000).toFixed(2),
    peakDb: +(20 * Math.log10(peak || 1e-9)).toFixed(0),
    voicedSpans: merged.length,
    voicedSec: +(merged.reduce((a, s) => a + s[1] - s[0], 0) * 0.025).toFixed(2),
    maxGapMs: gaps.length ? Math.round(Math.max(...gaps) * 1000) : 0,
  };
}

(async () => {
  const rows = [];
  for (const [roman, syl] of Object.entries(LETTERS)) {
    for (const v of VARIANTS) {
      const name = `${roman}--${v.key}.mp3`;
      const out = path.join(OUT, name);
      try {
        const input = v.markup ? { markup: v.markup(syl) } : { text: v.text(syl) };
        const buf = await tts(input, v.rate);
        fs.writeFileSync(out, buf);
        rows.push({ roman, variant: v.key, ...analyze(out) });
      } catch (e) {
        rows.push({ roman, variant: v.key, error: e.message.slice(0, 90) });
      }
      await new Promise(r => setTimeout(r, 250));
    }
  }
  console.table(rows);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(rows, null, 1));
})();
