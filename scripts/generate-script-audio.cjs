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
  // Letters say their demo syllable TWICE ("아, 아"): Chirp3-HD collapses on
  // ultra-short single-syllable inputs (pilot: ㅏ and ㅋ came back as 0.31s
  // near-silence), and hearing a new letter twice is better drill audio anyway.
  const syllable =
    item.glyph === 'ㅇ' ? '응'
    : CHO.includes(item.glyph) ? compose(item.glyph, 'ㅏ')
    : JUNG.includes(item.glyph) ? compose('ㅇ', item.glyph)
    : item.glyph;
  return `${syllable}, ${syllable}`;
}

// ── Google TTS (same call shape as generate-audio.cjs) ───────────────────────
function callGoogleTTS(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { text },
      voice: { languageCode: voiceName.split('-').slice(0, 2).join('-'), name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9, pitch: 0, sampleRateHertz: 24000 },
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

async function main() {
  // Pilot: a representative slice — bare-vowel carrier, plain/aspirated/tense
  // consonants, the ㅇ special case, a 2-jamo block, a 3-jamo batchim block,
  // a glide vowel, and a real word.
  const PILOT_GLYPHS = ['ㄱ', 'ㅏ', 'ㅇ', 'ㅋ', 'ㄲ', 'ㅘ', '가', '물', '강', '안녕히'];
  const items = pilot ? pack.items.filter(i => PILOT_GLYPHS.includes(i.glyph)) : pack.items;
  console.log(`${pilot ? 'PILOT' : 'FULL'} — ${items.length} clips, voice ${voiceName}`);
  let done = 0, skipped = 0;
  for (const item of items) {
    const name = pilot ? `pilot-${item.id}.mp3` : `${item.id}.mp3`;
    const out = path.join(AUDIO_DIR, name);
    if (resume && fs.existsSync(out)) { skipped++; continue; }
    const text = synthText(item);
    const buf = await callGoogleTTS(text);
    fs.writeFileSync(out, buf);
    done++;
    console.log(`  ${name}  "${text}"  ${buf.length}b`);
    await new Promise(r => setTimeout(r, 300)); // gentle on quota
  }
  console.log(`done: ${done} written, ${skipped} skipped`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
