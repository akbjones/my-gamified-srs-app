#!/usr/bin/env node
// Re-gain the chosen अ take so its DECODED mp3 peak matches आ (~-2.4 dBFS).
// MP3 encode overshoots the PCM peak, so binary-search the PCM target until the
// re-decoded output lands in range. Pure gain change — preserves V1's take.
const fs = require('fs'), os = require('os'), path = require('path'), { execSync } = require('child_process');
const SR = 24000;
const SRC = path.resolve('public/quest-audio/sc-hi-0001.mp3');
const TARGET = -2.4, TOL = 0.2;

function dec(buf) {
  const t = path.join(os.tmpdir(), `nf-${process.pid}-${Math.floor(performance.now())}.mp3`), w = t + '.wav';
  fs.writeFileSync(t, buf);
  execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${t}" "${w}"`, { stdio: 'pipe' });
  const d = fs.readFileSync(w).subarray(44); fs.unlinkSync(t); fs.unlinkSync(w);
  const s = new Int16Array(d.length >> 1);
  for (let i = 0; i < s.length; i++) s[i] = d.readInt16LE(i * 2);
  return s;
}
function peakDbfs(s) { let p = 0; for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > p) p = a; } return 20 * Math.log10((p || 1) / 32768); }
let Mp3Encoder = null;
function enc(s) { const e = new Mp3Encoder(1, SR, 48), ch = []; for (let i = 0; i < s.length; i += 1152) { const f = e.encodeBuffer(s.subarray(i, i + 1152)); if (f.length) ch.push(Buffer.from(f)); } const t = e.flush(); if (t.length) ch.push(Buffer.from(t)); return Buffer.concat(ch); }
function gained(base, pcmTargetDb) {
  const cur = peakDbfs(base);
  const g = Math.pow(10, (pcmTargetDb - cur) / 20);
  const out = new Int16Array(base.length);
  for (let i = 0; i < base.length; i++) out[i] = Math.max(-32768, Math.min(32767, Math.round(base[i] * g)));
  return out;
}

(async () => {
  Mp3Encoder = (await import('@breezystack/lamejs')).Mp3Encoder;
  const base = dec(fs.readFileSync(SRC));
  console.log(`start decoded peak: ${peakDbfs(base).toFixed(2)} dBFS  (target ${TARGET})`);
  // Binary-search the PCM target that yields a decoded peak ≈ TARGET.
  let lo = -8, hi = 0, best = null, bestErr = 9;
  for (let iter = 0; iter < 8; iter++) {
    const pcmT = (lo + hi) / 2;
    const buf = enc(gained(base, pcmT));
    const measured = peakDbfs(dec(buf));
    const err = measured - TARGET;
    console.log(`  pcmTarget ${pcmT.toFixed(2)} → decoded ${measured.toFixed(2)} dBFS`);
    if (Math.abs(err) < Math.abs(bestErr)) { bestErr = err; best = buf; }
    if (Math.abs(err) <= TOL) { best = buf; break; }
    if (measured > TARGET) hi = pcmT; else lo = pcmT;
  }
  fs.writeFileSync(SRC, best);
  console.log(`\nfinal decoded peak: ${peakDbfs(dec(best)).toFixed(2)} dBFS → wrote ${SRC} (${best.length}B)`);
})();
