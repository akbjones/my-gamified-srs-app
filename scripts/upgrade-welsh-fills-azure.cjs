#!/usr/bin/env node
/**
 * Regenerate ONLY the Welsh fill audio files (the 11 cards in
 * scripts/edge-tts-cards.json) using Azure TTS with cy-GB-NiaNeural –
 * matching the rest of the Welsh deck's encoding.
 *
 * Usage:  node scripts/upgrade-welsh-fills-azure.cjs
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const AZURE_KEY    = 'nAHo7lJTOlg23D7ZQVv9uysWAMeTnM3Utag0pnoGRhaFLvLLdB4XJQQJ99CDACmepeSXJ3w3AAAYACOGYniL';
const AZURE_REGION = 'uksouth';
const VOICE        = 'cy-GB-NiaNeural';
const OUTPUT_FMT   = 'audio-24khz-48kbitrate-mono-mp3'; // try matching the fill bitrate first
const DELAY_MS     = 3000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function fetchToken() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: `${AZURE_REGION}.api.cognitive.microsoft.com`,
      path: '/sts/v1.0/issueToken', method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': AZURE_KEY, 'Content-Length': '0' },
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => res.statusCode === 200 ? resolve(body) : reject(new Error(`Token ${res.statusCode}: ${body}`)));
    });
    req.on('error', reject);
    req.end();
  });
}

function synth(token, text) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="cy-GB"><voice name="${VOICE}">${escaped}</voice></speak>`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: `${AZURE_REGION}.tts.speech.microsoft.com`,
      path: '/cognitiveservices/v1', method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': OUTPUT_FMT,
        'User-Agent': 'SRSAppAudioGen',
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => res.statusCode === 200
        ? resolve(Buffer.concat(chunks))
        : reject(new Error(`TTS ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0, 200)}`)));
    });
    req.on('error', reject);
    req.write(ssml);
    req.end();
  });
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync('scripts/edge-tts-cards.json', 'utf8'));
  const ids = manifest.welsh || [];
  if (ids.length === 0) { console.log('No Welsh fill cards.'); return; }

  const deck = JSON.parse(fs.readFileSync('src/data/welsh/deck.json', 'utf8'));
  const byId = new Map(deck.map(c => [c.id, c]));

  console.log(`Welsh Azure TTS upgrade: ${ids.length} fill cards (using ${VOICE})`);
  const token = await fetchToken();
  console.log('Got Azure token.\n');

  let done = 0, failed = 0;
  for (const id of ids) {
    const c = byId.get(id);
    if (!c?.audio) { failed++; continue; }
    const out = path.join('public/quest-audio', c.audio);
    try {
      const buf = await synth(token, c.target);
      fs.writeFileSync(out, buf);
      done++;
      console.log(`  ${id} → ${c.audio} (${buf.length} bytes)`);
    } catch (e) {
      console.log(`  ${id}: ERROR ${e.message}`);
      failed++;
    }
    await sleep(DELAY_MS);
  }
  console.log(`\nDone: ${done} regenerated, ${failed} failed.`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
