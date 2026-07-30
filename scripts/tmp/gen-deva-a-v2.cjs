#!/usr/bin/env node
// अ (sc-hi-0001) take 2. Verdict on v1: A's method (doubled "अ। अ।", trim,
// natural rate) is right, but the clip has (1) a boundary CLICK, (2) slight
// CLIPPING of the tail, (3) it's QUIETER than its siblings. So: keep the method,
// generate several fresh rate~1.0 takes, and process each with de-click fades +
// generous tail + peak-normalization to the sibling-vowel loudness target.
//   GOOGLE_TTS_KEY=... node scripts/tmp/gen-deva-a-v2.cjs

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { execSync } = require('child_process');

const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }
const SR = 24000;
const voiceName = 'hi-IN-Chirp3-HD-Aoede';
const AUDIO_DIR = path.join(__dirname, '../../public/quest-audio');
const OUT = process.argv[2] || '/private/tmp/deva-a-candidates';
fs.mkdirSync(OUT, { recursive: true });

function callGoogleTTS(text, rate, volumeGainDb = 0) {
  const body = JSON.stringify({
    input: { text },
    voice: { languageCode: 'hi-IN', name: voiceName },
    audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch: 0, sampleRateHertz: SR, volumeGainDb },
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'texttospeech.googleapis.com', path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => { let d = ''; res.on('data', c => d += c);
      res.on('end', () => res.statusCode === 200
        ? resolve(Buffer.from(JSON.parse(d).audioContent, 'base64'))
        : reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0, 140)}`))); });
    req.on('error', reject); req.write(body); req.end();
  });
}
function decodeSamples(mp3Buf) {
  const tmp = path.join(os.tmpdir(), `a2-${process.pid}-${Math.floor(performance.now())}.mp3`);
  const wav = tmp + '.wav';
  fs.writeFileSync(tmp, mp3Buf);
  execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${tmp}" "${wav}"`, { stdio: 'pipe' });
  const data = fs.readFileSync(wav).subarray(44);
  fs.unlinkSync(tmp); fs.unlinkSync(wav);
  const s = new Int16Array(data.length >> 1);
  for (let i = 0; i < s.length; i++) s[i] = data.readInt16LE(i * 2);
  return s;
}
function voicedSpans(samples) {
  const win = Math.floor(SR * 0.025); const rms = [];
  for (let i = 0; i + win < samples.length; i += win) {
    let acc = 0; for (let j = 0; j < win; j++) { const v = samples[i + j] / 32768; acc += v * v; }
    rms.push(Math.sqrt(acc / win));
  }
  const peak = Math.max(...rms, 1e-9); const thresh = Math.max(0.02, peak * 0.12);
  const spans = []; let st = null;
  rms.forEach((r, i) => { const v = r > thresh; if (v && st === null) st = i; if (!v && st !== null) { spans.push([st, i]); st = null; } });
  if (st !== null) spans.push([st, rms.length]);
  const merged = [];
  for (const sp of spans) { if (merged.length && sp[0] - merged[merged.length - 1][1] < 3) merged[merged.length - 1][1] = sp[1]; else merged.push([...sp]); }
  return { spans: merged, win, rms, peakRms: peak };
}
function sampleStats(s) {
  let peak = 0, acc = 0;
  for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > peak) peak = a; const v = s[i] / 32768; acc += v * v; }
  const rms = Math.sqrt(acc / s.length);
  return { peakDbfs: +(20 * Math.log10((peak || 1) / 32768)).toFixed(1), rmsDbfs: +(20 * Math.log10((rms || 1e-9))).toFixed(1), dur: +(s.length / SR).toFixed(2), clipped: peak >= 32767 };
}

let Mp3Encoder = null;
function encodeMp3(samples) {
  const enc = new Mp3Encoder(1, SR, 48); const chunks = []; const BLOCK = 1152;
  for (let i = 0; i < samples.length; i += BLOCK) { const f = enc.encodeBuffer(samples.subarray(i, i + BLOCK)); if (f.length) chunks.push(Buffer.from(f)); }
  const t = enc.flush(); if (t.length) chunks.push(Buffer.from(t));
  return Buffer.concat(chunks);
}

// ── refined trim: first utterance, de-clicked with fades, generous tail ───────
function refineFirstUtterance(samples, targetPeak) {
  const { spans, win } = voicedSpans(samples);
  if (!spans.length) return null;
  const maxLen = Math.max(...spans.map(s => s[1] - s[0]));
  const first = spans.find(s => (s[1] - s[0]) >= Math.max(4, maxLen * 0.4));
  if (!first) return null;
  const next = spans.find(s2 => s2[0] > first[1] && (s2[1] - s2[0]) >= Math.max(4, maxLen * 0.4));
  // Generous tail so the schwa isn't clipped: 90ms head lead-in, 220ms tail.
  const leadIn = Math.floor(SR * 0.09), tail = Math.floor(SR * 0.22);
  const rawStart = Math.max(0, first[0] * win - leadIn);
  const hardEnd = next ? next[0] * win - Math.floor(SR * 0.06) : samples.length;
  const rawEnd = Math.min(samples.length, first[1] * win + tail, hardEnd);
  const cut = samples.slice(rawStart, rawEnd);
  // De-click: cosine fades guarantee both boundaries sit exactly at zero,
  // regardless of where the raw cut landed (the source of the click).
  const fIn = Math.min(Math.floor(SR * 0.012), cut.length >> 2);   // 12ms in
  const fOut = Math.min(Math.floor(SR * 0.045), cut.length >> 2);  // 45ms out
  for (let i = 0; i < fIn; i++) cut[i] = Math.round(cut[i] * 0.5 * (1 - Math.cos(Math.PI * i / fIn)));
  for (let i = 0; i < fOut; i++) { const k = cut.length - 1 - i; cut[k] = Math.round(cut[k] * 0.5 * (1 - Math.cos(Math.PI * i / fOut))); }
  // Level-match to the sibling vowels (peak-normalize to targetPeak dBFS).
  let peak = 0; for (let i = 0; i < cut.length; i++) { const a = Math.abs(cut[i]); if (a > peak) peak = a; }
  const targetAmp = 32768 * Math.pow(10, targetPeak / 20);
  const gain = peak > 0 ? Math.min(8, targetAmp / peak) : 1;
  const outN = Math.floor(SR * 0.05) + cut.length; // 50ms leading digital silence
  const out = new Int16Array(outN);
  const lead = Math.floor(SR * 0.05);
  for (let i = 0; i < cut.length; i++) out[lead + i] = Math.max(-32768, Math.min(32767, Math.round(cut[i] * gain)));
  return out;
}

(async () => {
  Mp3Encoder = (await import('@breezystack/lamejs')).Mp3Encoder;

  // 1. Sibling loudness target (आ इ ई उ ऊ = sc-hi-0002..0006).
  console.log('── sibling vowels (the "aligned" target) ──');
  const sibPeaks = [];
  for (const n of [2, 3, 4, 5, 6]) {
    const id = `sc-hi-000${n}`;
    const st = sampleStats(decodeSamples(fs.readFileSync(path.join(AUDIO_DIR, `${id}.mp3`))));
    sibPeaks.push(st.peakDbfs);
    console.log(`  ${id}: peak ${st.peakDbfs} dBFS | rms ${st.rmsDbfs} | ${st.dur}s${st.clipped ? ' CLIPPED' : ''}`);
  }
  const targetPeak = +(sibPeaks.reduce((a, b) => a + b, 0) / sibPeaks.length).toFixed(1);
  console.log(`  → target peak ≈ ${targetPeak} dBFS`);

  // Current shipped अ, for reference.
  const cur = sampleStats(decodeSamples(fs.readFileSync(path.join(AUDIO_DIR, 'sc-hi-0001.mp3'))));
  console.log(`  current sc-hi-0001 (अ): peak ${cur.peakDbfs} dBFS | rms ${cur.rmsDbfs} | ${cur.dur}s\n`);

  // 2. Several fresh rate~1.0 takes (Chirp3 is nondeterministic — pick clean ones).
  console.log('── refined अ takes (doubled + trim + de-click + level-match) ──');
  const TAKES = [
    { id: 'V1', text: 'अ। अ।', rate: 1.0 },
    { id: 'V2', text: 'अ। अ।', rate: 1.0 },
    { id: 'V3', text: 'अ। अ।', rate: 0.92 },
    { id: 'V4', text: 'अ। अ।', rate: 0.92 },
    { id: 'V5', text: 'अ। अ।', rate: 1.0 },
    { id: 'V6', text: 'अ। अ।', rate: 0.95 },
  ];
  const manifest = [];
  for (const t of TAKES) {
    const raw = decodeSamples(await callGoogleTTS(t.text, t.rate, 0));
    const proc = refineFirstUtterance(raw, targetPeak);
    if (!proc) { console.log(`  ${t.id}: trim failed`); continue; }
    const buf = encodeMp3(proc);
    const st = sampleStats(proc);
    fs.writeFileSync(path.join(OUT, `${t.id}.mp3`), buf);
    manifest.push({ id: t.id, rate: t.rate, b64: buf.toString('base64'), st, bytes: buf.length });
    console.log(`  ${t.id} (rate ${t.rate}): peak ${st.peakDbfs} dBFS | ${st.dur}s | ${buf.length}B`);
    await new Promise(r => setTimeout(r, 300));
  }
  fs.writeFileSync(path.join(OUT, 'manifest-v2.json'), JSON.stringify({ targetPeak, current: cur, takes: manifest }, null, 1));
  console.log(`\n✓ ${manifest.length} refined takes → ${OUT}/manifest-v2.json`);
})();
