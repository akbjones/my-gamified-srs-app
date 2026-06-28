#!/usr/bin/env node
/**
 * Retry the failed uploads from /tmp/r2-upload-fails.json with lower
 * concurrency (8 vs 24) and more aggressive backoff.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCT = process.env.CLOUDFLARE_ACCOUNT_ID;
const BUCKET = 'langlab-srs-audio';
const KEY_PREFIX = 'quest-audio/';
if (!TOKEN || !ACCT) { console.error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID'); process.exit(1); }

const CONCURRENCY = 8;
const AUDIO_DIR = path.resolve('public/quest-audio');
const files = JSON.parse(fs.readFileSync('/tmp/r2-upload-fails.json', 'utf8'));
console.log(`Retrying ${files.length} files with concurrency=${CONCURRENCY}`);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function uploadOne(filename) {
  return new Promise(resolve => {
    const fp = path.join(AUDIO_DIR, filename);
    if (!fs.existsSync(fp)) return resolve({ ok: false, status: -1, body: 'missing file' });
    const sz = fs.statSync(fp).size;
    const req = https.request({
      hostname: 'api.cloudflare.com', port: 443, method: 'PUT',
      path: `/client/v4/accounts/${ACCT}/r2/buckets/${BUCKET}/objects/${encodeURI(KEY_PREFIX + filename)}`,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'audio/mpeg',
        'Content-Length': sz,
      },
    }, res => {
      let body = ''; res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode === 200) return resolve({ ok: true });
        resolve({ ok: false, status: res.statusCode, body: body.slice(0, 150) });
      });
    });
    req.on('error', e => resolve({ ok: false, status: -1, body: e.message }));
    fs.createReadStream(fp).pipe(req);
  });
}

async function withRetry(f, max = 10) {
  for (let i = 0; i < max; i++) {
    const r = await uploadOne(f);
    if (r.ok) return r;
    // Aggressive backoff: start at 1s, exponential to 30s cap
    const wait = Math.min(30000, 1000 * Math.pow(2, i)) + Math.random() * 500;
    await sleep(wait);
  }
  return { ok: false };
}

(async () => {
  let done = 0, failed = 0, idx = 0;
  const t0 = Date.now();
  const fails = [];
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= files.length) return;
      const r = await withRetry(files[i]);
      if (r.ok) done++; else { failed++; fails.push(files[i]); }
      const total = done + failed;
      if (total % 100 === 0 || total === files.length) {
        const dt = (Date.now() - t0) / 1000;
        const eta = Math.round((files.length - total) / (total / dt));
        console.log(`  ${total}/${files.length}  ✓${done} ✗${failed}  ${(total/dt).toFixed(1)}/s  ETA ${eta}s`);
      }
    }
  }
  await Promise.all(Array.from({length: CONCURRENCY}, () => worker()));
  console.log(`\nDone: ${done} ok, ${failed} failed in ${((Date.now()-t0)/1000).toFixed(1)}s`);
  if (fails.length) {
    fs.writeFileSync('/tmp/r2-upload-fails-retry.json', JSON.stringify(fails, null, 2));
    console.log('Remaining failures → /tmp/r2-upload-fails-retry.json');
  }
})();
