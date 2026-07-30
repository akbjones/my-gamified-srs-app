#!/usr/bin/env node
// Sweep EVERY Devanagari script clip for silence + local/R2 staleness.
// The phone plays R2, so a clip can be fine locally yet silent on R2 (e.g. a
// local regen that never got uploaded). Reports: silent-local, silent-R2,
// stale (voiced-length mismatch), and missing-on-R2.
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https'), { execSync } = require('child_process');
const SR = 24000;
const AUDIO_DIR = path.resolve('public/quest-audio');
const R2 = 'https://pub-fa9d7e83944246fcb9a03f217e1dd0c9.r2.dev/quest-audio';
const pack = require(path.resolve('src/data/scripts/devanagari.json'));
const items = pack.items;

function decode(buf) {
  const t = path.join(os.tmpdir(), `sw-${Math.random().toString(36).slice(2)}.mp3`), w = t + '.wav';
  fs.writeFileSync(t, buf);
  try { execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${t}" "${w}"`, { stdio: 'pipe' }); }
  catch (e) { fs.unlinkSync(t); return null; }
  const d = fs.readFileSync(w).subarray(44); fs.unlinkSync(t); fs.unlinkSync(w);
  const s = new Int16Array(d.length >> 1);
  for (let i = 0; i < s.length; i++) s[i] = d.readInt16LE(i * 2);
  return s;
}
function qc(s) {
  if (!s || !s.length) return { voiced: 0, peak: -99, dur: 0 };
  const win = Math.floor(SR * 0.025); const rms = [];
  for (let i = 0; i + win < s.length; i += win) { let a = 0; for (let j = 0; j < win; j++) { const v = s[i + j] / 32768; a += v * v; } rms.push(Math.sqrt(a / win)); }
  const pk = Math.max(...rms, 1e-9), th = Math.max(0.02, pk * 0.12);
  let vc = 0; for (const r of rms) if (r > th) vc++;
  let peak = 0; for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > peak) peak = a; }
  return { voiced: +(vc * win / SR).toFixed(2), peak: +(20 * Math.log10((peak || 1) / 32768)).toFixed(1), dur: +(s.length / SR).toFixed(2) };
}
function fetchR2(file) {
  return new Promise(res => {
    https.get(`${R2}/${file}?v=21`, r => {
      if (r.statusCode !== 200) { r.resume(); return res({ status: r.statusCode, buf: null }); }
      const ch = []; r.on('data', c => ch.push(c)); r.on('end', () => res({ status: 200, buf: Buffer.concat(ch) }));
    }).on('error', () => res({ status: -1, buf: null }));
  });
}

(async () => {
  const SILENT = 0.10; // voiced seconds below this = effectively no sound
  const rows = [];
  for (const it of items) {
    const file = it.audio; // e.g. sc-hi-0003.mp3
    const lp = path.join(AUDIO_DIR, file);
    const local = fs.existsSync(lp) ? qc(decode(fs.readFileSync(lp))) : null;
    const r2r = await fetchR2(file);
    const r2 = r2r.buf ? qc(decode(r2r.buf)) : null;
    const flags = [];
    if (!local) flags.push('MISSING-LOCAL');
    else if (local.voiced < SILENT) flags.push('SILENT-LOCAL');
    if (r2r.status !== 200) flags.push(`R2-${r2r.status}`);
    else if (!r2 || r2.voiced < SILENT) flags.push('SILENT-R2');
    if (local && r2 && Math.abs(local.voiced - r2.voiced) > 0.15) flags.push('STALE(local≠R2)');
    rows.push({ id: it.id, glyph: it.glyph, kind: it.kind, file, local, r2, flags });
  }
  const bad = rows.filter(r => r.flags.length);
  console.log(`swept ${rows.length} clips — ${bad.length} flagged\n`);
  for (const r of bad) {
    const L = r.local ? `L:voiced ${r.local.voiced}s/pk ${r.local.peak}` : 'L:—';
    const R = r.r2 ? `R2:voiced ${r.r2.voiced}s/pk ${r.r2.peak}` : 'R2:—';
    console.log(`  ${r.id} ${r.glyph} (${r.kind})  [${r.flags.join(', ')}]  ${L}  ${R}`);
  }
  fs.writeFileSync('/private/tmp/deva-audio-sweep.json', JSON.stringify(rows, null, 1));
  console.log(`\nfull table → /private/tmp/deva-audio-sweep.json`);
})();
