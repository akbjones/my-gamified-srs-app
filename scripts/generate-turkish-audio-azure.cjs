const fs = require('fs');
const https = require('https');
const path = require('path');

const AZURE_KEY = 'nAHo7lJTOlg23D7ZQVv9uysWAMeTnM3Utag0pnoGRhaFLvLLdB4XJQQJ99CDACmepeSXJ3w3AAAYACOGYniL';
const REGION = 'uksouth';
const VOICE = 'tr-TR-EmelNeural';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'quest-audio');
const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'turkish', 'deck.json');
const DELAY = 3000;

const startIdx = parseInt(process.argv.find(a => a.startsWith('--start='))?.split('=')[1] || '0');

let token = '';
async function refreshToken() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: `${REGION}.api.cognitive.microsoft.com`,
      path: '/sts/v1.0/issueToken',
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': AZURE_KEY, 'Content-Length': 0 }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { token = data; resolve(); });
    });
    req.on('error', reject);
    req.end();
  });
}

async function synthesize(text, outputPath) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="tr-TR"><voice name="${VOICE}">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</voice></speak>`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: `${REGION}.tts.speech.microsoft.com`,
      path: '/cognitiveservices/v1',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      }
    }, res => {
      if (res.statusCode === 429) { resolve('RATE_LIMITED'); return; }
      if (res.statusCode !== 200) { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve('ERROR:'+res.statusCode+':'+d)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length > 1000) { fs.writeFileSync(outputPath, buf); resolve('OK'); }
        else resolve('TOO_SMALL');
      });
    });
    req.on('error', e => resolve('ERROR:' + e.message));
    req.write(ssml);
    req.end();
  });
}

async function main() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  console.log(`Turkish Azure TTS: ${deck.length} cards, starting at index ${startIdx}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);
  console.log(`Delay: ${DELAY}ms (~20 req/min)`);
  const est = ((deck.length - startIdx) * DELAY / 1000 / 60).toFixed(1);
  console.log(`Estimated time: ~${est} minutes\n`);

  await refreshToken();
  console.log('Got initial Azure token.\n');

  let errors = 0;
  const startTime = Date.now();

  for (let i = startIdx; i < deck.length; i++) {
    const card = deck[i];
    const outPath = path.join(OUTPUT_DIR, card.audio);

    // Refresh token every 500 cards
    if (i > startIdx && (i - startIdx) % 500 === 0) {
      await refreshToken();
      console.log('  Refreshed Azure token.');
    }

    const result = await synthesize(card.target, outPath);
    if (result === 'RATE_LIMITED') {
      console.log(`  Rate limited at ${i}, waiting 30s...`);
      await new Promise(r => setTimeout(r, 30000));
      i--; continue;
    }
    if (result !== 'OK') { errors++; }

    if ((i - startIdx + 1) % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const remaining = (((deck.length - i - 1) * DELAY) / 1000 / 60).toFixed(1);
      console.log(`  [${i+1}/${deck.length}] ${elapsed}m elapsed, ~${remaining}m remaining, ${errors} errors`);
    }

    await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\nDone! ${deck.length - startIdx} cards processed, ${errors} errors.`);
}

main().catch(console.error);
