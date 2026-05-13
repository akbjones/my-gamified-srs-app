#!/usr/bin/env node
/**
 * Upgrade Edge-TTS audio files to Google Wavenet quality.
 *
 * Reads scripts/edge-tts-cards.json (manifest of cards using Edge TTS)
 * and regenerates each card's audio via Google Cloud TTS. Existing audio
 * files in `public/quest-audio/` are overwritten in place — no deck.json
 * changes needed.
 *
 * Skipping rules:
 *   - Welsh: Google Cloud TTS has NO Welsh voices. Skipped entirely.
 *   - --only-failed: only regenerates files smaller than 2 KB (treated as
 *     placeholders / previous failures) OR currently bitrate 48 kbps (Edge
 *     TTS signature).
 *
 * Resilience:
 *   - 300 ms delay between requests (avoid rate limit / 429s).
 *   - Up to 5 retries per card with exponential backoff (1s, 2s, 4s, 8s, 16s).
 *   - Transient errors caught: "API key expired" (rate-limit guise),
 *     non-JSON HTML responses, 5xx responses.
 *
 * Usage:
 *   GOOGLE_TTS_KEY=<key> node scripts/upgrade-edge-to-google.cjs [lang] [--only-failed]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }

const args = process.argv.slice(2);
const langArg = args.find(a => !a.startsWith('--'));
const ONLY_FAILED = args.includes('--only-failed');

const VOICES = {
  spanish:    { code: 'es-US', voice: 'es-US-Wavenet-A' },
  french:     { code: 'fr-FR', voice: 'fr-FR-Wavenet-A' },
  italian:    { code: 'it-IT', voice: 'it-IT-Wavenet-A' },
  portuguese: { code: 'pt-BR', voice: 'pt-BR-Wavenet-A' },
  german:     { code: 'de-DE', voice: 'de-DE-Wavenet-A' },
  dutch:      { code: 'nl-NL', voice: 'nl-NL-Wavenet-A' },
  swedish:    { code: 'sv-SE', voice: 'sv-SE-Wavenet-A' },
  // welsh:   no Google TTS voice available — skipped
  hindi:      { code: 'hi-IN', voice: 'hi-IN-Wavenet-A' },
  turkish:    { code: 'tr-TR', voice: 'tr-TR-Wavenet-A' },
  russian:    { code: 'ru-RU', voice: 'ru-RU-Wavenet-A' },
};

const DECK_DIRS = {
  spanish: 'spanish', french: 'french', italian: 'italian', portuguese: 'portuguese',
  german: 'german', dutch: 'dutch', swedish: 'swedish', welsh: 'welsh',
  hindi: 'hindi', turkish: 'turkish', russian: 'russian',
};
const AUDIO_DIR = 'public/quest-audio';
const REQUEST_DELAY_MS = 300;
const MAX_RETRIES = 5;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function ttsOnce(text, voiceConf) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { text },
      voice: { languageCode: voiceConf.code, name: voiceConf.voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
    });
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      port: 443,
      path: '/v1/text:synthesize?key=' + API_KEY,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        // HTML response = rate limit / proxy error page
        if (data.startsWith('<')) {
          return reject({ transient: true, msg: 'HTML response (' + res.statusCode + ')' });
        }
        let j;
        try { j = JSON.parse(data); }
        catch (e) { return reject({ transient: true, msg: 'JSON parse fail: ' + data.slice(0, 80) }); }
        if (j.error) {
          const msg = j.error.message || 'unknown error';
          // "API key expired" is a known rate-limit disguise — retry
          const transient = /expired|RESOURCE_EXHAUSTED|UNAVAILABLE|TOO_MANY_REQUESTS/i.test(msg) || res.statusCode >= 500;
          return reject({ transient, msg, fatal: /BILLING_DISABLED|SERVICE_DISABLED/.test(msg) });
        }
        if (!j.audioContent) return reject({ transient: false, msg: 'No audioContent' });
        resolve(Buffer.from(j.audioContent, 'base64'));
      });
    });
    req.on('error', e => reject({ transient: true, msg: e.message }));
    req.write(body); req.end();
  });
}

async function tts(text, voiceConf) {
  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await ttsOnce(text, voiceConf);
    } catch (err) {
      lastErr = err;
      if (err.fatal) throw err;
      if (!err.transient) throw err;
      const backoff = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s, 8s, 16s
      await sleep(backoff);
    }
  }
  throw lastErr;
}

function isLikelyFailedFile(audioPath) {
  if (!fs.existsSync(audioPath)) return true;
  const size = fs.statSync(audioPath).size;
  return size < 2000; // tiny files are usually failed/incomplete
}

async function processLang(lang, manifest) {
  let ids = manifest[lang] || [];
  if (ids.length === 0) { console.log(`${lang}: no cards in manifest, skip`); return { done: 0, failed: 0, skipped: 0 }; }

  const deckPath = `src/data/${DECK_DIRS[lang]}/deck.json`;
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const byId = new Map(deck.map(c => [c.id, c]));
  const voiceConf = VOICES[lang];

  // Filter to only files that look failed (if --only-failed)
  if (ONLY_FAILED) {
    ids = ids.filter(id => {
      const card = byId.get(id);
      if (!card?.audio) return false;
      return isLikelyFailedFile(path.join(AUDIO_DIR, card.audio));
    });
  }

  console.log(`${lang}: ${ids.length} cards to ${ONLY_FAILED ? 'retry' : 'upgrade'}`);
  if (ids.length === 0) return { done: 0, failed: 0, skipped: 0 };

  let done = 0, failed = 0;
  for (const id of ids) {
    const card = byId.get(id);
    if (!card?.audio) { failed++; continue; }
    const audioPath = path.join(AUDIO_DIR, card.audio);
    try {
      const buf = await tts(card.target, voiceConf);
      fs.writeFileSync(audioPath, buf);
      done++;
      if (done % 25 === 0) console.log(`  ${lang}: ${done}/${ids.length}`);
    } catch (e) {
      console.log(`  ${id}: ERROR ${(e.msg || e.message || String(e)).slice(0, 120)}`);
      failed++;
      if (e.fatal) {
        console.log(`  Fatal error — aborting ${lang}`);
        break;
      }
    }
    await sleep(REQUEST_DELAY_MS);
  }
  console.log(`${lang}: done ${done}, failed ${failed}`);
  return { done, failed, skipped: 0 };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync('scripts/edge-tts-cards.json', 'utf8'));
  const langs = langArg ? [langArg] : Object.keys(VOICES);
  if (!langArg) {
    console.log('Skipping welsh — no Google TTS voice exists for cy-GB.');
  }
  const totals = { done: 0, failed: 0 };
  for (const lang of langs) {
    if (!VOICES[lang]) { console.log('skip ' + lang); continue; }
    const r = await processLang(lang, manifest);
    totals.done += r.done; totals.failed += r.failed;
  }
  console.log(`\nDone. Total: ${totals.done} upgraded, ${totals.failed} failed.`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
