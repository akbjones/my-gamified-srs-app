#!/usr/bin/env node
// Upload the Indonesian pilot deck's audio (deck-referenced set) to R2.
// Bucket langlab-srs-audio, key prefix quest-audio/ — the SERVED bucket.
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCT = process.env.CLOUDFLARE_ACCOUNT_ID;
const BUCKET = 'langlab-srs-audio';
const KEY_PREFIX = 'quest-audio/';
if (!TOKEN || !ACCT) { console.error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID'); process.exit(1); }

const AUDIO_DIR = path.resolve('public/quest-audio');
const deck = JSON.parse(fs.readFileSync('src/data/indonesian/deck.json', 'utf8'));
const files = deck.map(c => c.audio);
const missing = files.filter(f => !fs.existsSync(path.join(AUDIO_DIR, f)));
if (missing.length) { console.error('missing local files:', missing.slice(0, 5)); process.exit(1); }

function put(file) {
  return new Promise((resolve) => {
    const buf = fs.readFileSync(path.join(AUDIO_DIR, file));
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${ACCT}/r2/buckets/${BUCKET}/objects/${encodeURI(KEY_PREFIX + file)}`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'audio/mpeg', 'Content-Length': buf.length },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ file, ok: res.statusCode === 200, status: res.statusCode, body: d.slice(0, 120) }));
    });
    req.on('error', e => resolve({ file, ok: false, err: String(e) }));
    req.end(buf);
  });
}

(async () => {
  let ok = 0, failed = [];
  const queue = [...files];
  async function worker() {
    while (queue.length) {
      const f = queue.shift();
      let r = await put(f);
      if (!r.ok) r = await put(f); // one retry
      if (r.ok) ok++; else failed.push(r);
      if ((ok + failed.length) % 100 === 0) console.log(`${ok + failed.length}/${files.length}`);
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  console.log(`uploaded ${ok}/${files.length}; failed: ${failed.length}`);
  failed.slice(0, 5).forEach(f => console.log('FAIL', f.file, f.status, f.body || f.err));
  process.exit(failed.length ? 1 : 0);
})();
