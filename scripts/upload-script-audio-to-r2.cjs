#!/usr/bin/env node
/**
 * Upload script-teacher clips (sc-<code>-NNNN.mp3) to R2 langlab-srs-audio
 * under quest-audio/. Net-new filenames → no CDN staleness, no cache bump.
 * PUT overwrites. Usage: CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… \
 *   node scripts/upload-script-audio-to-r2.cjs [--prefix=sc-ko]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCT = process.env.CLOUDFLARE_ACCOUNT_ID;
const BUCKET = process.env.CF_BUCKET || 'langlab-srs-audio';
const KEY_PREFIX = 'quest-audio/';
if (!TOKEN || !ACCT) { console.error('Set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID'); process.exit(1); }

const filePrefix = (process.argv.find(a => a.startsWith('--prefix=')) || '--prefix=sc-').split('=')[1];
const AUDIO_DIR = path.resolve('public/quest-audio');
const files = fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith(filePrefix) && f.endsWith('.mp3') && !f.startsWith('pilot-'));
const bytes = files.reduce((s, f) => s + fs.statSync(path.join(AUDIO_DIR, f)).size, 0);
console.log(`Uploading ${files.length} files (${(bytes / 1024).toFixed(0)} KB) → ${BUCKET}/${KEY_PREFIX}`);

const sleep = ms => new Promise(r => setTimeout(r, ms));
function uploadOne(filename) {
  return new Promise(resolve => {
    const fp = path.join(AUDIO_DIR, filename);
    const req = https.request({
      hostname: 'api.cloudflare.com', port: 443, method: 'PUT',
      path: `/client/v4/accounts/${ACCT}/r2/buckets/${BUCKET}/objects/${encodeURI(KEY_PREFIX + filename)}`,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'audio/mpeg', 'Content-Length': fs.statSync(fp).size },
    }, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(res.statusCode === 200 ? { ok: true } : { ok: false, status: res.statusCode, body: b.slice(0, 150) })); });
    req.on('error', e => resolve({ ok: false, status: -1, body: e.message }));
    fs.createReadStream(fp).pipe(req);
  });
}
async function withRetry(f, max = 6) {
  for (let i = 0; i < max; i++) { const r = await uploadOne(f); if (r.ok) return r; await sleep(500 * 2 ** i + Math.random() * 300); }
  return { ok: false, status: 'gaveup' };
}
(async () => {
  let ok = 0; const failed = [];
  const CONC = 16;
  for (let i = 0; i < files.length; i += CONC) {
    const batch = files.slice(i, i + CONC);
    const res = await Promise.all(batch.map(withRetry));
    res.forEach((r, j) => r.ok ? ok++ : failed.push(batch[j]));
    process.stdout.write(`\r  ${ok}/${files.length}`);
  }
  console.log(`\ndone: ${ok} uploaded${failed.length ? `, ${failed.length} FAILED: ${failed.join(' ')}` : ''}`);
  process.exit(failed.length ? 1 : 0);
})();
