#!/usr/bin/env node
// Regenerate candidates for the letters the user flagged as mis-vowelled /
// mispronounced. Root cause: bare "C। C।" lets Chirp3 pick a random inherent
// vowel (che/cche/nyi/fo). Fixes offered per letter: the aa-matra form (Cा =
// deterministic C+a, slightly long) + bare re-rolls (nondeterministic; can land
// a clean short-a like ங did) + a slower take. Reuses the production refine.
//   GOOGLE_TTS_KEY=... node scripts/tmp/gen-deva-flagged.cjs <outdir>
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https'), { execSync } = require('child_process');
const API_KEY = process.env.GOOGLE_TTS_KEY; if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }
const SR = 24000, voiceName = 'hi-IN-Chirp3-HD-Aoede';
const OUT = process.argv[2] || '/private/tmp/deva-flagged'; fs.mkdirSync(OUT, { recursive: true });
const pack = require(path.resolve('src/data/scripts/devanagari.json'));

function tts(text, rate) {
  const body = JSON.stringify({ input: { text }, voice: { languageCode: 'hi-IN', name: voiceName }, audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch: 0, sampleRateHertz: SR } });
  return new Promise((res, rej) => { const r = https.request({ hostname: 'texttospeech.googleapis.com', path: `/v1/text:synthesize?key=${API_KEY}`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => resp.statusCode === 200 ? res(Buffer.from(JSON.parse(d).audioContent, 'base64')) : rej(new Error(`HTTP ${resp.statusCode}: ${d.slice(0, 120)}`))); }); r.on('error', rej); r.write(body); r.end(); });
}
function dec(buf) { const t = os.tmpdir() + '/fl-' + Math.random().toString(36).slice(2) + '.mp3', w = t + '.wav'; fs.writeFileSync(t, buf); execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${t}" "${w}"`, { stdio: 'pipe' }); const d = fs.readFileSync(w).subarray(44); fs.unlinkSync(t); fs.unlinkSync(w); const s = new Int16Array(d.length >> 1); for (let i = 0; i < s.length; i++) s[i] = d.readInt16LE(i * 2); return s; }
function spans(s) { const win = Math.floor(SR * 0.025), rms = []; for (let i = 0; i + win < s.length; i += win) { let a = 0; for (let j = 0; j < win; j++) { const v = s[i + j] / 32768; a += v * v; } rms.push(Math.sqrt(a / win)); } const pk = Math.max(...rms, 1e-9), th = Math.max(0.02, pk * 0.12); const sp = []; let st = null; rms.forEach((r, i) => { const v = r > th; if (v && st === null) st = i; if (!v && st !== null) { sp.push([st, i]); st = null; } }); if (st !== null) sp.push([st, rms.length]); const m = []; for (const x of sp) { if (m.length && x[0] - m[m.length - 1][1] < 3) m[m.length - 1][1] = x[1]; else m.push([...x]); } return { spans: m, win }; }
function qc(s) { const { spans: sp, win } = spans(s); let vc = 0; for (const x of sp) vc += x[1] - x[0]; let pk = 0; for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > pk) pk = a; } return { voiced: +(vc * win / SR).toFixed(2), peak: +(20 * Math.log10((pk || 1) / 32768)).toFixed(1), dur: +(s.length / SR).toFixed(2) }; }
let Enc = null;
function enc(s) { const e = new Enc(1, SR, 48), ch = []; for (let i = 0; i < s.length; i += 1152) { const f = e.encodeBuffer(s.subarray(i, i + 1152)); if (f.length) ch.push(Buffer.from(f)); } const t = e.flush(); if (t.length) ch.push(Buffer.from(t)); return Buffer.concat(ch); }
function refine(samples, targetPeak = -3.4) {
  const { spans: sp, win } = spans(samples); if (!sp.length) return null;
  const maxLen = Math.max(...sp.map(s => s[1] - s[0]));
  const first = sp.find(s => (s[1] - s[0]) >= Math.max(4, maxLen * 0.4)); if (!first) return null;
  const next = sp.find(s2 => s2[0] > first[1] && (s2[1] - s2[0]) >= Math.max(4, maxLen * 0.4));
  const leadIn = Math.floor(SR * 0.09), tail = Math.floor(SR * 0.22);
  const start = Math.max(0, first[0] * win - leadIn), hardEnd = next ? next[0] * win - Math.floor(SR * 0.06) : samples.length;
  const end = Math.min(samples.length, first[1] * win + tail, hardEnd);
  const cut = samples.slice(start, end);
  const fIn = Math.min(Math.floor(SR * 0.012), cut.length >> 2), fOut = Math.min(Math.floor(SR * 0.045), cut.length >> 2);
  for (let i = 0; i < fIn; i++) cut[i] = Math.round(cut[i] * 0.5 * (1 - Math.cos(Math.PI * i / fIn)));
  for (let i = 0; i < fOut; i++) { const k = cut.length - 1 - i; cut[k] = Math.round(cut[k] * 0.5 * (1 - Math.cos(Math.PI * i / fOut))); }
  let pk = 0; for (let i = 0; i < cut.length; i++) { const a = Math.abs(cut[i]); if (a > pk) pk = a; }
  const g = pk > 0 ? Math.min(8, 32768 * Math.pow(10, targetPeak / 20) / pk) : 1;
  const lead = Math.floor(SR * 0.05), out = new Int16Array(lead + cut.length);
  for (let i = 0; i < cut.length; i++) out[lead + i] = Math.max(-32768, Math.min(32767, Math.round(cut[i] * g)));
  return out;
}

// user complaints keyed by glyph
const FLAGS = [
  { g: 'फ', want: 'pha (p + breath), not "fo"' },
  { g: 'ञ', want: 'nya (ny in canyon), not "nyi"' },
  { g: 'छ', want: 'chha (ch + breath), not "cche"' },
  { g: 'च', want: 'cha (as in chat), not "che"' },
  { g: 'ऐ', want: 'ai / a-in-bat held long, not "eh"' },
  { g: 'फ़', want: 'fa (as in fan), not "fe"' },
  { g: 'ज़', want: 'za (as in zoo), not breathy' },
  { g: 'ह', want: 'ha, not "phooee"' },
  { g: 'त', want: 'ta (dental), not "tuh"' },
];

function recipes(it) {
  const g = it.glyph;
  if (it.romanization === 'ai') { // vowel — re-rolls + slower/faster to shape the diphthong
    return [
      { id: 'r1', label: 'bare, re-roll 1', text: `${g}। ${g}।`, rate: 1.0 },
      { id: 'r2', label: 'bare, re-roll 2', text: `${g}। ${g}।`, rate: 1.0 },
      { id: 'slow', label: 'bare, slower 0.8', text: `${g}। ${g}।`, rate: 0.8 },
      { id: 'r3', label: 'bare, re-roll 3', text: `${g}। ${g}।`, rate: 0.95 },
    ];
  }
  return [ // consonant — deterministic aa-matra + bare re-rolls
    { id: 'aa', label: `aa-matra (${g}ा = reliable C+a, long)`, text: `${g}ा। ${g}ा।`, rate: 0.92 },
    { id: 'r1', label: 'bare, re-roll 1', text: `${g}। ${g}।`, rate: 1.0 },
    { id: 'r2', label: 'bare, re-roll 2', text: `${g}। ${g}।`, rate: 1.0 },
    { id: 'slow', label: 'bare, slower 0.88', text: `${g}। ${g}।`, rate: 0.88 },
  ];
}

(async () => {
  Enc = (await import('@breezystack/lamejs')).Mp3Encoder;
  const manifest = [];
  for (const fl of FLAGS) {
    const it = pack.items.find(i => i.glyph === fl.g);
    if (!it) { console.log('MISSING', fl.g); continue; }
    const cands = [];
    for (const rc of recipes(it)) {
      let proc = null, buf = null, q = null;
      try { proc = refine(dec(await tts(rc.text, rc.rate))); } catch (e) { console.log(`  ${it.id} ${rc.id}: ${e.message}`); }
      if (proc) { buf = enc(proc); q = qc(proc); cands.push({ ...rc, b64: buf.toString('base64'), qc: q }); }
      await new Promise(r => setTimeout(r, 200));
    }
    manifest.push({ id: it.id, glyph: it.glyph, roman: it.romanization, sound: it.sound, want: fl.want, audio: it.audio, cands });
    console.log(`${it.id} ${it.glyph} (${it.romanization}): ${cands.length} cands [${cands.map(c => `${c.id} ${c.qc.voiced}s`).join(', ')}]`);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`\n✓ ${manifest.length} letters → ${OUT}/manifest.json`);
})();
