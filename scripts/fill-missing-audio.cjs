#!/usr/bin/env node
/**
 * Generate audio for cards with empty audio field, using Google Cloud TTS Wavenet voices
 * (matching original audio quality). Updates deck.json to reference the new file.
 *
 * Filename pattern: <lang>-fill-<id>.mp3
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_TTS_KEY;
if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }

const VOICES = {
  es: 'es-US-Wavenet-A', it: 'it-IT-Wavenet-A', de: 'de-DE-Wavenet-A',
  fr: 'fr-FR-Wavenet-A', pt: 'pt-BR-Wavenet-A', nl: 'nl-NL-Wavenet-A',
  sv: 'sv-SE-Wavenet-A', cy: 'cy-GB-Standard-A', hi: 'hi-IN-Wavenet-A',
  tr: 'tr-TR-Wavenet-A', ru: 'ru-RU-Wavenet-A',
};
const LANG_CODES = {
  es: 'es-US', it: 'it-IT', de: 'de-DE', fr: 'fr-FR', pt: 'pt-BR',
  nl: 'nl-NL', sv: 'sv-SE', cy: 'cy-GB', hi: 'hi-IN', tr: 'tr-TR', ru: 'ru-RU',
};
const DECK_DIRS = {
  es: 'spanish', fr: 'french', it: 'italian', pt: 'portuguese',
  de: 'german', nl: 'dutch', sv: 'swedish', cy: 'welsh',
  hi: 'hindi', tr: 'turkish', ru: 'russian',
};

const AUDIO_DIR = 'public/quest-audio';
fs.mkdirSync(AUDIO_DIR, { recursive: true });

function generateAudio(text, voice, langCode) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { text },
      voice: { languageCode: langCode, name: voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
    });
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      port: 443,
      path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          if (!json.audioContent) return reject(new Error('No audio: ' + data.slice(0, 200)));
          resolve(Buffer.from(json.audioContent, 'base64'));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function main() {
  let total = 0;
  for (const [lang, dir] of Object.entries(DECK_DIRS)) {
    const deckPath = `src/data/${dir}/deck.json`;
    const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
    const noAudio = deck.filter(c => !c.audio || !c.audio.trim());
    if (noAudio.length === 0) continue;
    console.log(`${lang}: ${noAudio.length} cards need audio`);

    for (const card of noAudio) {
      const filename = `${lang}-fill-${card.id}.mp3`;
      const filepath = path.join(AUDIO_DIR, filename);
      if (fs.existsSync(filepath)) {
        card.audio = filename;
        total++;
        continue;
      }
      try {
        const buf = await generateAudio(card.target, VOICES[lang], LANG_CODES[lang]);
        fs.writeFileSync(filepath, buf);
        card.audio = filename;
        total++;
        console.log(`  Generated: ${filename} ("${card.target.slice(0, 40)}")`);
      } catch (e) {
        console.log(`  ERROR ${filename}: ${e.message}`);
      }
    }
    fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + '\n');
  }
  console.log(`\nTOTAL GENERATED: ${total}`);
}

main();
