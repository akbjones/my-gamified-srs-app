#!/usr/bin/env node
// TTS for script-teacher packs (docs/script-teacher-scoping.md §2.5).
//
// Chirp3-HD collapses SHORT inputs stochastically (bare 아 comes back as 0.3s
// near-silence on most calls), but doubled inputs ("아. 아.") synthesize
// reliably. Users, however, want to hear the sound ONCE. So short items are
// synthesized as a double and then TRIMMED to the first utterance locally
// (afconvert decode → voiced-span detection → cut → lamejs re-encode).
//   - consonant letters demo as C+ㅏ syllables (ㄱ → "ga")
//   - vowel letters ride the silent ㅇ carrier (ㅏ → "a")
//   - ㅇ itself demos as 응 (eung — the ng it makes at syllable end)
//   - single-syllable composed blocks get the same treatment; identical synth
//     text reuses the identical take (letter ㄱ ≡ block 가, byte-identical)
//   - multi-syllable words synthesize as plain single takes
// Every clip passes a windowed-RMS QC gate (voiced ≥0.15s, peak ≥ −18dB) with
// up to 3 full retries; failures are reported and fail the run.
//
// Voice: the language's canonical deck voice. NO AUDIO_VERSION bump (net-new
// filenames). Pilot discipline: --pilot writes pilot-*.mp3 only.
//
// Usage:
//   GOOGLE_TTS_KEY=... node scripts/generate-script-audio.cjs --pack=hangul --pilot
//   GOOGLE_TTS_KEY=... node scripts/generate-script-audio.cjs --pack=hangul [--resume]

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { execSync } = require('child_process');

const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }

const args = process.argv.slice(2);
const packName = (args.find(a => a.startsWith('--pack=')) || '').split('=')[1] || 'hangul';
const pilot = args.includes('--pilot');
const resume = args.includes('--resume');

const PACK_VOICE = { hangul: 'ko-KR-Chirp3-HD-Aoede', kana: 'ja-JP-Chirp3-HD-Aoede', cyrillic: 'ru-RU-Wavenet-A', devanagari: 'hi-IN-Chirp3-HD-Aoede' };
const voiceName = PACK_VOICE[packName];
if (!voiceName) { console.error(`No voice mapping for pack ${packName}`); process.exit(1); }

const pack = JSON.parse(fs.readFileSync(path.join(__dirname, `../src/data/scripts/${packName}.json`), 'utf8'));
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'quest-audio');
const SR = 24000;

// ── synthesis text ───────────────────────────────────────────────────────────
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const compose = (cho, jung) => String.fromCodePoint(0xAC00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28);

/** Returns { text, trim } — trim=true means "synthesize doubled, keep first utterance". */
function synthPlan(item) {
  if (packName === 'kana') {
    if (item.kind === 'word') return { text: item.glyph, trim: false };
    // Marks with no isolated pronunciation get a demonstration sound:
    // small kana speak their full-size sound; ゛/゜ speak their worked
    // example; っ and ー are audible only inside a 2-mora carrier (which
    // is also collapse-proof, so no doubling needed).
    const KANA_SPEAK = { 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ' };
    if (item.glyph === 'っ') return { text: 'あっ', trim: false };
    if (item.glyph === 'ー') return { text: 'アー', trim: false };
    if (item.glyph === '゛') return { text: 'が。が。', trim: true };
    if (item.glyph === '゜') return { text: 'ぱ。ぱ。', trim: true };
    const speak = KANA_SPEAK[item.glyph] ?? item.glyph;
    // Single kana collapse to silence exactly like Hangul syllables —
    // synthesize doubled with the ja full stop, trim to the first take.
    return { text: `${speak}。${speak}。`, trim: true };
  }
  if (packName !== 'hangul' || item.kind === 'word') return { text: item.glyph, trim: false };
  let syllable = item.glyph;
  if (item.kind !== 'composed') {
    syllable = item.glyph === 'ㅇ' ? '응'
      : CHO.includes(item.glyph) ? compose(item.glyph, 'ㅏ')
      : JUNG.includes(item.glyph) ? compose('ㅇ', item.glyph)
      : item.glyph;
  }
  if ([...syllable].length === 1) return { text: `${syllable}. ${syllable}.`, trim: true };
  return { text: syllable, trim: false };
}

// ── Google TTS ───────────────────────────────────────────────────────────────
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

// ── decode / analyze / trim / encode ─────────────────────────────────────────
function decodeSamples(mp3Buf) {
  const tmp = path.join(os.tmpdir(), `sc-audio-${process.pid}.mp3`);
  const wav = tmp + '.wav';
  fs.writeFileSync(tmp, mp3Buf);
  execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${tmp}" "${wav}"`, { stdio: 'pipe' });
  const data = fs.readFileSync(wav).subarray(44);
  fs.unlinkSync(tmp); fs.unlinkSync(wav);
  const samples = new Int16Array(data.length >> 1);
  for (let i = 0; i < samples.length; i++) samples[i] = data.readInt16LE(i * 2);
  return samples;
}

/** Voiced spans over 25ms RMS windows (merged across <60ms dips), in window units. */
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

/** Cut a doubled take down to its first REAL utterance (plus gentle padding).
 *  spans[0] is often a millisecond click, not the syllable — keep the first
 *  span that's substantial relative to the longest one. */
function trimFirstUtterance(mp3Buf) {
  const samples = decodeSamples(mp3Buf);
  const { spans, win } = voicedSpans(samples);
  if (spans.length < 2) return null; // nothing to cut — caller keeps the original
  const maxLen = Math.max(...spans.map(s => s[1] - s[0]));
  const first = spans.find(s => (s[1] - s[0]) >= Math.max(4, maxLen * 0.4));
  if (!first) return null;
  const padHead = Math.floor(SR * 0.10), padTail = Math.floor(SR * 0.18);
  const nextSubstantial = spans.find(s2 => s2[0] > first[1] && (s2[1] - s2[0]) >= Math.max(4, maxLen * 0.4));
  const start = Math.max(0, first[0] * win - padHead);
  const hardEnd = nextSubstantial ? nextSubstantial[0] * win - Math.floor(SR * 0.05) : samples.length;
  const end = Math.min(samples.length, first[1] * win + padTail, hardEnd);
  const cut = new Int16Array(end - start + padHead + padTail);
  cut.set(samples.subarray(start, end), padHead); // zero-padded head/tail
  return encodeMp3(cut);
}

// ── clip production with QC + retries + text-level cache ─────────────────────
const clipCache = new Map(); // text@rate -> approved buffer (ㄱ ≡ 가, byte-identical)

async function makeClip(text, rate, trim) {
  const key = `${text}@${rate}`;
  if (clipCache.has(key)) {
    const buf = clipCache.get(key);
    return { buf, qc: qcOf(decodeSamples(buf)), cached: true };
  }
  let last = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const gain = attempt === 0 ? 0 : Math.min(16, 8 * attempt);
    let buf = await callGoogleTTS(text, rate, gain);
    if (trim) {
      const cut = trimFirstUtterance(buf);
      if (cut) buf = cut;
    }
    const qc = qcOf(decodeSamples(buf));
    last = { buf, qc };
    // One-utterance check by DURATION: a stop+vowel syllable legitimately
    // shows 2 RMS spans (burst + vowel), but a leftover double runs ~2s+
    // while a trimmed single is ~1s. Also cap the utterance itself at 0.6s –
    // Chirp3 sometimes streeetches a bare vowel ("aaaa"); a shorter take is
    // always one retry away.
    const singleOk = !trim || (qc.durSec <= 1.4 && qc.voicedSec <= 0.6);
    if (qc.rmsPeakDb >= -18 && qc.voicedSec >= 0.15 && singleOk) {
      clipCache.set(key, buf);
      return { buf, qc };
    }
    console.log(`    retry ${attempt + 1} ("${text}": rms ${qc.rmsPeakDb}dB, voiced ${qc.voicedSec}s, spans ${qc.spans})`);
    await new Promise(r => setTimeout(r, 400));
  }
  return { ...last, failed: true };
}

async function main() {
  Mp3Encoder = (await import('@breezystack/lamejs')).Mp3Encoder;
  // Pilot: the risky cases — bare-vowel carrier, plain/aspirated/tense
  // consonants, ㅇ, a glide, 2- and 3-jamo blocks, a real word.
  const PILOT_GLYPHS = ['ㄱ', 'ㅏ', 'ㅇ', 'ㅋ', 'ㄲ', 'ㅘ', '가', '물', '강', '안녕히'];
  const items = pilot ? pack.items.filter(i => PILOT_GLYPHS.includes(i.glyph)) : pack.items;
  console.log(`${pilot ? 'PILOT' : 'FULL'} — ${items.length} clips, voice ${voiceName}`);
  let done = 0, skipped = 0;
  const failed = [];
  for (const item of items) {
    const name = pilot ? `pilot-${item.id}.mp3` : `${item.id}.mp3`;
    const out = path.join(AUDIO_DIR, name);
    if (resume && fs.existsSync(out)) { skipped++; continue; }
    const { text, trim } = synthPlan(item);
    const rate = trim ? 1.0 : 0.9; // doubles at natural speed; single takes at deck pace
    const { buf, qc, failed: bad, cached } = await makeClip(text, rate, trim);
    fs.writeFileSync(out, buf);
    if (bad) { console.error(`  ✗ ${name} FAILED QC after retries`); failed.push(name); }
    done++;
    console.log(`  ${name}  "${text}"${trim ? ' →1st' : ''}${cached ? ' (shared take)' : ''}  rms ${qc.rmsPeakDb}dB  voiced ${qc.voicedSec}s`);
    if (!cached) await new Promise(r => setTimeout(r, 300));
  }
  console.log(`done: ${done} written, ${skipped} skipped${failed.length ? `, ${failed.length} FAILED QC: ${failed.join(' ')}` : ''}`);
  if (failed.length) process.exit(1);
}

main().catch(e => { console.error(e.message); process.exit(1); });
