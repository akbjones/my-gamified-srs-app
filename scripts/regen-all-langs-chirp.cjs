#!/usr/bin/env node
/**
 * Regenerate every non-Welsh language's audio with Google Chirp 3 HD.
 *
 * Voice: <lang>-Chirp3-HD-Aoede (female, available in all 10 languages)
 * Cost:  ~$46 total at $30/1M chars × ~1.5M chars
 *
 * Handles Chirp 3 HD's tight rate limits with exponential backoff
 * (Google's default is ~5 requests/sec for HD voices).
 *
 *   node scripts/regen-all-langs-chirp.cjs                    # all 10 langs
 *   node scripts/regen-all-langs-chirp.cjs --lang=es          # one language
 *   node scripts/regen-all-langs-chirp.cjs --resume           # retry failures + continue
 *   node scripts/regen-all-langs-chirp.cjs --concurrency=3    # tune
 *   node scripts/regen-all-langs-chirp.cjs --dry-run          # preview
 *
 * Resume logic: persists which card IDs have been written successfully
 * per language to /tmp/regen-<lang>-done.json. On --resume, skips them
 * and retries everything else (including previous failures).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) {
  console.error('ERROR: Set GOOGLE_TTS_KEY');
  process.exit(1);
}

const LANGS = {
  spanish:    { code: 'es-US', voice: 'es-US-Chirp3-HD-Aoede', prefix: 'es' },
  italian:    { code: 'it-IT', voice: 'it-IT-Chirp3-HD-Aoede', prefix: 'it' },
  french:     { code: 'fr-FR', voice: 'fr-FR-Chirp3-HD-Aoede', prefix: 'fr' },
  portuguese: { code: 'pt-BR', voice: 'pt-BR-Chirp3-HD-Aoede', prefix: 'pt' },
  german:     { code: 'de-DE', voice: 'de-DE-Chirp3-HD-Aoede', prefix: 'de' },
  dutch:      { code: 'nl-NL', voice: 'nl-NL-Chirp3-HD-Aoede', prefix: 'nl' },
  swedish:    { code: 'sv-SE', voice: 'sv-SE-Chirp3-HD-Aoede', prefix: 'sv' },
  turkish:    { code: 'tr-TR', voice: 'tr-TR-Chirp3-HD-Aoede', prefix: 'tr' },
  hindi:      { code: 'hi-IN', voice: 'hi-IN-Chirp3-HD-Aoede', prefix: 'hi' },
  russian:    { code: 'ru-RU', voice: 'ru-RU-Chirp3-HD-Aoede', prefix: 'ru' },
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const resume = args.includes('--resume');
const langArg = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const targetLangs = langArg ? langArg.split(',') : Object.keys(LANGS);
const CONCURRENCY = parseInt((args.find(a => a.startsWith('--concurrency=')) || '').split('=')[1]) || 3;
const CHECKPOINT_EVERY = 25;
const LOG_EVERY = 50;
const MAX_RETRIES = 6;          // exponential backoff: 1s,2s,4s,8s,16s,32s
const BASE_BACKOFF_MS = 1000;

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Synthesize with retry on 429/500 (transient errors)
async function synthesize(text, voiceCfg, retryAttempt = 0) {
  try {
    return await synthesizeOnce(text, voiceCfg);
  } catch (err) {
    const msg = err.message;
    const isRateLimit = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
    const isServer = msg.includes('500') || msg.includes('503') || msg.includes('502');
    if ((isRateLimit || isServer) && retryAttempt < MAX_RETRIES) {
      const wait = BASE_BACKOFF_MS * Math.pow(2, retryAttempt) + Math.floor(Math.random() * 500);
      await sleep(wait);
      return synthesize(text, voiceCfg, retryAttempt + 1);
    }
    throw err;
  }
}

function synthesizeOnce(text, voiceCfg) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { text },
      voice: { languageCode: voiceCfg.code, name: voiceCfg.voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 0 },
    });
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      path: '/v1/text:synthesize?key=' + API_KEY,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try {
          const j = JSON.parse(data);
          resolve(Buffer.from(j.audioContent, 'base64'));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function processLang(langName) {
  const cfg = LANGS[langName];
  if (!cfg) throw new Error(`Unknown lang: ${langName}`);
  const deckPath = path.join(ROOT, 'src/data', langName, 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const donePath = `/tmp/regen-${langName}-done.json`;
  const failPath = `/tmp/regen-${langName}-fail.json`;

  let doneSet = new Set();
  if (resume && fs.existsSync(donePath)) {
    doneSet = new Set(JSON.parse(fs.readFileSync(donePath, 'utf8')));
    console.log(`  Resume: ${doneSet.size} cards already done, will skip`);
  }

  const work = deck.filter(c => c.audio && c.target && !doneSet.has(c.id));
  console.log(`\n=== ${langName} (${cfg.voice}): ${work.length} cards to process ===`);

  if (dryRun) {
    const totalChars = work.reduce((a, c) => a + c.target.length, 0);
    console.log(`  [dry-run] would regenerate ${work.length} cards`);
    console.log(`  Total chars: ${totalChars}  Est. cost: $${(totalChars / 1e6 * 30).toFixed(2)}`);
    return null;
  }

  let inFlight = 0;
  let cursor = 0;
  let done = 0;
  let failed = 0;
  const failures = [];
  const newlyDone = [];

  const persistDone = () => {
    const all = [...doneSet, ...newlyDone];
    fs.writeFileSync(donePath, JSON.stringify(all));
    fs.writeFileSync(failPath, JSON.stringify(failures, null, 2));
  };

  await new Promise((resolveAll) => {
    const launch = () => {
      while (inFlight < CONCURRENCY && cursor < work.length) {
        const card = work[cursor++];
        inFlight++;
        (async () => {
          try {
            const buf = await synthesize(card.target, cfg);
            fs.writeFileSync(path.join(AUDIO_DIR, card.audio), buf);
            done++;
            newlyDone.push(card.id);
          } catch (err) {
            failed++;
            failures.push({ id: card.id, audio: card.audio, target: card.target.slice(0, 60), error: err.message.slice(0, 150) });
            if (failed <= 5) console.log(`  ✗ [${card.id}] ${err.message.slice(0, 100)}`);
          }
          inFlight--;
          const processed = done + failed;
          if (processed % LOG_EVERY === 0) {
            console.log(`  [${langName} ${processed}/${work.length}]  done=${done}  failed=${failed}`);
          }
          if (processed % CHECKPOINT_EVERY === 0) {
            persistDone();
          }
          if (cursor >= work.length && inFlight === 0) {
            resolveAll();
          } else {
            launch();
          }
        })();
      }
    };
    launch();
  });

  persistDone();
  console.log(`  ✅ ${langName} done. regenerated=${done}  failed=${failed}  (total now ${doneSet.size + newlyDone.length})`);
  return { done, failed };
}

(async () => {
  let totalDone = 0, totalFailed = 0;
  for (const lang of targetLangs) {
    const r = await processLang(lang);
    if (r) { totalDone += r.done; totalFailed += r.failed; }
  }
  console.log(`\n=== ALL DONE === regenerated=${totalDone}  failed=${totalFailed}`);
})();
