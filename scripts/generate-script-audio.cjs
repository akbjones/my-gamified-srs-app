#!/usr/bin/env node
// TTS for script-teacher packs (docs/script-teacher-scoping.md §2.5).
//
// Per-script synthesis strategy — Hangul letters CANNOT be spoken in
// isolation (a bare jamo clips or gets read as its letter NAME), so:
//   - consonant letters synthesize as C+ㅏ syllables (ㄱ → 가 "ga")
//   - vowel letters ride the silent ㅇ carrier (ㅏ → 아 "a")
//   - ㅇ itself synthesizes as 응 (eung — demonstrates the ng it makes)
//   - composed blocks and word items synthesize as their own glyph
// The drill engine keeps letters and composed blocks in separate choice
// families precisely because ㄱ and 가 share the sound "ga".
//
// Voice: the language's canonical deck voice (ko = Chirp3-HD-Aoede).
// NO AUDIO_VERSION / audio-cache-vN bump: these are net-new filenames.
// Pilot discipline: --pilot writes pilot-*.mp3 (never final names) so nothing
// can reach R2 under a final name before the clips are approved by ear.
//
// Usage:
//   GOOGLE_TTS_KEY=... node scripts/generate-script-audio.cjs --pack=hangul --pilot
//   GOOGLE_TTS_KEY=... node scripts/generate-script-audio.cjs --pack=hangul

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }

const args = process.argv.slice(2);
const packName = (args.find(a => a.startsWith('--pack=')) || '').split('=')[1] || 'hangul';
const pilot = args.includes('--pilot');
const resume = args.includes('--resume');

const PACK_VOICE = { hangul: 'ko-KR-Chirp3-HD-Aoede', cyrillic: 'ru-RU-Wavenet-A', devanagari: 'hi-IN-Chirp3-HD-Aoede' };
const voiceName = PACK_VOICE[packName];
if (!voiceName) { console.error(`No voice mapping for pack ${packName}`); process.exit(1); }

const pack = JSON.parse(fs.readFileSync(path.join(__dirname, `../src/data/scripts/${packName}.json`), 'utf8'));
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'quest-audio');

// ── synthesis text per item ──────────────────────────────────────────────────
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const compose = (cho, jung) => String.fromCodePoint(0xAC00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28);
function synthText(item) {
  if (packName !== 'hangul' || item.kind === 'composed' || item.kind === 'word') return item.glyph;
  // Letters say their demo syllable TWICE with a SENTENCE boundary between:
  // "아. 아." – Chirp3-HD collapses ultra-short single-syllable inputs (pilot:
  // ㅏ came back 0.4s at -26dB), and comma-doubles run together ("kkakka" –
  // user's ear + measured 0ms gap). Period-doubles measure 600-825ms gaps.
  const syllable =
    item.glyph === 'ㅇ' ? '응'
    : CHO.includes(item.glyph) ? compose(item.glyph, 'ㅏ')
    : JUNG.includes(item.glyph) ? compose('ㅇ', item.glyph)
    : item.glyph;
  return `${syllable}. ${syllable}.`;
}

// ── Google TTS (same call shape as generate-audio.cjs) ───────────────────────
function callGoogleTTS(text, rate, volumeGainDb = 0) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { text },
      voice: { languageCode: voiceName.split('-').slice(0, 2).join('-'), name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch: 0, sampleRateHertz: 24000, volumeGainDb },
    });
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        try { resolve(Buffer.from(JSON.parse(data).audioContent, 'base64')); }
        catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Windowed-RMS QC via afconvert→WAV (macOS; returns null elsewhere). Sample
// peak is NOT enough – a collapsed clip can still contain one loud click
// (물 regen: 0.35s, -27dB RMS, but -2dB sample peak). We gate on RMS peak
// AND total voiced time.
const { execSync } = require('child_process');
function qcAnalyze(mp3Path) {
  try {
    const wav = mp3Path + '.qc.wav';
    execSync(`afconvert -f WAVE -d LEI16@24000 -c 1 "${mp3Path}" "${wav}"`, { stdio: 'pipe' });
    const data = fs.readFileSync(wav).subarray(44);
    fs.unlinkSync(wav);
    const samples = data.length / 2, win = Math.floor(24000 * 0.025), rms = [];
    for (let i = 0; i + win < samples; i += win) {
      let acc = 0;
      for (let j = 0; j < win; j++) { const v = data.readInt16LE((i + j) * 2) / 32768; acc += v * v; }
      rms.push(Math.sqrt(acc / win));
    }
    const peak = Math.max(...rms);
    const thresh = Math.max(0.02, peak * 0.12);
    const voicedSec = rms.filter(r => r > thresh).length * 0.025;
    return { rmsPeakDb: Math.round(20 * Math.log10(peak || 1e-9)), voicedSec: +voicedSec.toFixed(2) };
  } catch { return null; }
}

async function main() {
  // Pilot: a representative slice — bare-vowel carrier, plain/aspirated/tense
  // consonants, the ㅇ special case, a 2-jamo block, a 3-jamo batchim block,
  // a glide vowel, and a real word.
  const PILOT_GLYPHS = ['ㄱ', 'ㅏ', 'ㅇ', 'ㅋ', 'ㄲ', 'ㅘ', '가', '물', '강', '안녕히'];
  const items = pilot ? pack.items.filter(i => PILOT_GLYPHS.includes(i.glyph)) : pack.items;
  console.log(`${pilot ? 'PILOT' : 'FULL'} — ${items.length} clips, voice ${voiceName}`);
  let done = 0, skipped = 0;
  const failed = [];
  for (const item of items) {
    const name = pilot ? `pilot-${item.id}.mp3` : `${item.id}.mp3`;
    const out = path.join(AUDIO_DIR, name);
    if (resume && fs.existsSync(out)) { skipped++; continue; }
    const text = synthText(item);
    // Letters: rate 1.0 (0.9 doubles drag – "the a is reaaally long"); blocks/words: 0.9.
    const rate = item.kind === 'letter' || item.kind === 'modifier' ? 1.0 : 0.9;
    // Chirp3-HD collapses short inputs STOCHASTICALLY (same text can succeed
    // or come back as 0.3s near-silence on different calls) – retry up to 3x,
    // adding volume gain on later attempts for genuinely quiet syntheses.
    let qc = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const gain = attempt === 0 ? 0 : Math.min(16, 8 * attempt);
      const buf = await callGoogleTTS(text, rate, gain);
      fs.writeFileSync(out, buf);
      qc = qcAnalyze(out);
      if (!qc || (qc.rmsPeakDb >= -18 && qc.voicedSec >= 0.15)) break;
      console.log(`    retry ${attempt + 1} for ${name} (rms ${qc.rmsPeakDb}dB, voiced ${qc.voicedSec}s)`);
      await new Promise(r => setTimeout(r, 400));
    }
    if (qc && (qc.rmsPeakDb < -18 || qc.voicedSec < 0.15)) {
      console.error(`  ✗ ${name} STILL BAD after retries – needs ears/manual fix`);
      failed.push(name);
    }
    done++;
    console.log(`  ${name}  "${text}"  rms ${qc ? qc.rmsPeakDb + 'dB' : 'n/a'}  voiced ${qc ? qc.voicedSec + 's' : 'n/a'}`);
    await new Promise(r => setTimeout(r, 300)); // gentle on quota
  }
  console.log(`done: ${done} written, ${skipped} skipped${failed.length ? `, ${failed.length} FAILED QC: ${failed.join(' ')}` : ''}`);
  if (failed.length) process.exit(1);
}

main().catch(e => { console.error(e.message); process.exit(1); });
