#!/usr/bin/env node
// One-off: generate several candidate takes for अ (sc-hi-0001), whose current
// production clip (bare "अ।" at rate 1.0) is mis-synthesized ("te hue"). Reuses
// the exact generate-script-audio.cjs pipeline (afconvert decode → voiced-span
// trim → lamejs encode) so the chosen take is byte-format-identical to prod.
// Writes candidates to scratchpad + a base64 manifest for the review artifact.
//   GOOGLE_TTS_KEY=... node scripts/tmp/gen-deva-a-candidates.cjs

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { execSync } = require('child_process');

const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }
const SR = 24000;
const voiceName = 'hi-IN-Chirp3-HD-Aoede';
const OUT = process.argv[2] || '/private/tmp/deva-a-candidates';
fs.mkdirSync(OUT, { recursive: true });

// ── pipeline (copied verbatim from scripts/generate-script-audio.cjs) ─────────
function callGoogleTTS(text, rate, volumeGainDb = 0) {
  const body = JSON.stringify({
    input: { text },
    voice: { languageCode: voiceName.split('-').slice(0, 2).join('-'), name: voiceName },
    audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch: 0, sampleRateHertz: SR, volumeGainDb },
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
function decodeSamples(mp3Buf) {
  const tmp = path.join(os.tmpdir(), `sc-audio-${process.pid}-${Math.floor(performance.now())}.mp3`);
  const wav = tmp + '.wav';
  fs.writeFileSync(tmp, mp3Buf);
  execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${tmp}" "${wav}"`, { stdio: 'pipe' });
  const data = fs.readFileSync(wav).subarray(44);
  fs.unlinkSync(tmp); fs.unlinkSync(wav);
  const samples = new Int16Array(data.length >> 1);
  for (let i = 0; i < samples.length; i++) samples[i] = data.readInt16LE(i * 2);
  return samples;
}
function voicedSpans(samples) {
  const win = Math.floor(SR * 0.025);
  const rms = [];
  for (let i = 0; i + win < samples.length; i += win) {
    let acc = 0;
    for (let j = 0; j < win; j++) { const v = samples[i + j] / 32768; acc += v * v; }
    rms.push(Math.sqrt(acc / win));
  }
  const peak = Math.max(...rms, 1e-9);
  const thresh = Math.max(0.02, peak * 0.12);
  const spans = [];
  let st = null;
  rms.forEach((r, i) => {
    const v = r > thresh;
    if (v && st === null) st = i;
    if (!v && st !== null) { spans.push([st, i]); st = null; }
  });
  if (st !== null) spans.push([st, rms.length]);
  const merged = [];
  for (const sp of spans) {
    if (merged.length && sp[0] - merged[merged.length - 1][1] < 3) merged[merged.length - 1][1] = sp[1];
    else merged.push([...sp]);
  }
  return { spans: merged, win, peakDb: Math.round(20 * Math.log10(peak)) };
}
function qcOf(samples) {
  const { spans, win, peakDb } = voicedSpans(samples);
  const voicedSec = spans.reduce((a, s) => a + s[1] - s[0], 0) * win / SR;
  return { rmsPeakDb: peakDb, voicedSec: +voicedSec.toFixed(2), spans: spans.length, durSec: +(samples.length / SR).toFixed(2) };
}
let Mp3Encoder = null;
function encodeMp3(samples) {
  const enc = new Mp3Encoder(1, SR, 48);
  const chunks = [];
  const BLOCK = 1152;
  for (let i = 0; i < samples.length; i += BLOCK) {
    const frame = enc.encodeBuffer(samples.subarray(i, i + BLOCK));
    if (frame.length) chunks.push(Buffer.from(frame));
  }
  const tail = enc.flush();
  if (tail.length) chunks.push(Buffer.from(tail));
  return Buffer.concat(chunks);
}
function trimFirstUtterance(mp3Buf) {
  const samples = decodeSamples(mp3Buf);
  const { spans, win } = voicedSpans(samples);
  if (spans.length < 2) return null;
  const maxLen = Math.max(...spans.map(s => s[1] - s[0]));
  const first = spans.find(s => (s[1] - s[0]) >= Math.max(4, maxLen * 0.4));
  if (!first) return null;
  const padHead = Math.floor(SR * 0.10), padTail = Math.floor(SR * 0.18);
  const nextSubstantial = spans.find(s2 => s2[0] > first[1] && (s2[1] - s2[0]) >= Math.max(4, maxLen * 0.4));
  const start = Math.max(0, first[0] * win - padHead);
  const hardEnd = nextSubstantial ? nextSubstantial[0] * win - Math.floor(SR * 0.05) : samples.length;
  const end = Math.min(samples.length, first[1] * win + padTail, hardEnd);
  const cut = new Int16Array(end - start + padHead + padTail);
  cut.set(samples.subarray(start, end), padHead);
  return encodeMp3(cut);
}

// ── candidate matrix ─────────────────────────────────────────────────────────
// The schwa अ is the reduced inherent vowel = the "u" in "fun". Isolated, Chirp3
// stochastically mangles it. Spread across rate / doubling / separator / carrier.
const CANDIDATES = [
  { id: 'A_current',     label: 'CURRENT (the wrong one) — "अ।" doubled, rate 1.0', text: 'अ। अ।', rate: 1.0, trim: true },
  { id: 'B_slow_danda',  label: 'Doubled + danda, slower (rate 0.72)',              text: 'अ। अ।', rate: 0.72, trim: true },
  { id: 'C_bare_norm',   label: 'Bare glyph, no danda, natural rate',               text: 'अ',      rate: 1.0, trim: false },
  { id: 'D_bare_slow',   label: 'Bare glyph, no danda, slower (rate 0.75)',         text: 'अ',      rate: 0.75, trim: false },
  { id: 'E_double_space',label: 'Doubled, space separator (no danda), rate 0.85',   text: 'अ अ',    rate: 0.85, trim: true },
  { id: 'F_period',      label: 'Doubled with Latin period, rate 0.8',              text: 'अ. अ.',  rate: 0.8, trim: true },
  { id: 'G_carrier_ab',  label: 'Word carrier "अब" (ab = now), rate 0.9',           text: 'अब। अब।',rate: 0.9, trim: true },
];

(async () => {
  Mp3Encoder = (await import('@breezystack/lamejs')).Mp3Encoder;
  const manifest = [];
  for (const c of CANDIDATES) {
    process.stdout.write(`  ${c.id} … `);
    let buf = await callGoogleTTS(c.text, c.rate, 0);
    if (c.trim) { const cut = trimFirstUtterance(buf); if (cut) buf = cut; }
    const qc = qcOf(decodeSamples(buf));
    const file = path.join(OUT, `${c.id}.mp3`);
    fs.writeFileSync(file, buf);
    manifest.push({ ...c, file, b64: buf.toString('base64'), qc, bytes: buf.length });
    console.log(`dur ${qc.durSec}s voiced ${qc.voicedSec}s peak ${qc.rmsPeakDb}dB (${buf.length}B)`);
    await new Promise(r => setTimeout(r, 300));
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`\n✓ ${manifest.length} candidates → ${OUT}/manifest.json`);
})();
