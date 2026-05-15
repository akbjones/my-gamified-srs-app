#!/usr/bin/env node
/**
 * Parallel uploader for public/quest-audio/*.mp3 → Cloudflare R2.
 * Uses Cloudflare's REST API directly (no S3 credentials needed; just the
 * regular API token with R2:Edit permission).
 *
 * Env vars required:
 *   CLOUDFLARE_API_TOKEN
 *   CLOUDFLARE_ACCOUNT_ID
 *   CF_BUCKET   (default: langlab-audio)
 *
 * Flags:
 *   --concurrency=N   parallel uploads (default 32)
 *   --resume          skip files already in the bucket (slower start, no waste)
 *   --dry-run         list what would upload, do nothing
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCT = process.env.CLOUDFLARE_ACCOUNT_ID;
const BUCKET = process.env.CF_BUCKET || 'langlab-audio';
if (!TOKEN || !ACCT) {
  console.error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID');
  process.exit(1);
}

const args = process.argv.slice(2);
const CONCURRENCY = parseInt((args.find(a => a.startsWith('--concurrency=')) || '').split('=')[1]) || 32;
const RESUME = args.includes('--resume');
const DRY_RUN = args.includes('--dry-run');

const AUDIO_DIR = path.resolve('public/quest-audio');
const allFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
console.log(`Files in ${AUDIO_DIR}: ${allFiles.length}`);

const TOTAL_BYTES = allFiles.reduce((s, f) => s + fs.statSync(path.join(AUDIO_DIR, f)).size, 0);
console.log(`Total bytes: ${(TOTAL_BYTES / 1024 / 1024).toFixed(1)} MB`);
console.log(`Concurrency: ${CONCURRENCY} | Resume: ${RESUME} | Dry run: ${DRY_RUN}`);

if (DRY_RUN) {
  console.log('First 5 files:', allFiles.slice(0, 5));
  process.exit(0);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** List ALL keys in the bucket (paginated). Returns a Set of keys. */
async function r2ListAll() {
  const keys = new Set();
  let cursor;
  while (true) {
    const data = await new Promise((resolve, reject) => {
      const params = new URLSearchParams({ per_page: '1000' });
      if (cursor) params.set('cursor', cursor);
      const req = https.request({
        hostname: 'api.cloudflare.com',
        port: 443,
        method: 'GET',
        path: `/client/v4/accounts/${ACCT}/r2/buckets/${BUCKET}/objects?${params}`,
        headers: { Authorization: `Bearer ${TOKEN}` },
      }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.end();
    });
    if (!data.success) throw new Error('List failed: ' + JSON.stringify(data.errors));
    for (const obj of data.result || []) keys.add(obj.key);
    cursor = data.result_info?.cursor;
    if (!cursor) break;
  }
  return keys;
}

/** Upload one file. Returns { ok, status, retries }. */
function uploadOne(filename) {
  return new Promise((resolve) => {
    const filepath = path.join(AUDIO_DIR, filename);
    const stat = fs.statSync(filepath);
    const stream = fs.createReadStream(filepath);
    const req = https.request({
      hostname: 'api.cloudflare.com',
      port: 443,
      method: 'PUT',
      path: `/client/v4/accounts/${ACCT}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(filename)}`,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size,
      },
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode === 200) return resolve({ ok: true });
        const transient = res.statusCode >= 500 || res.statusCode === 429;
        resolve({ ok: false, status: res.statusCode, body: body.slice(0, 100), transient });
      });
    });
    req.on('error', e => resolve({ ok: false, status: -1, body: e.message, transient: true }));
    stream.pipe(req);
  });
}

async function uploadWithRetry(filename, maxRetries = 8) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const r = await uploadOne(filename);
    if (r.ok) return r;
    // Treat any non-2xx as potentially transient on Cloudflare's REST API;
    // the actual rate-limit responses can be 4xx (10000, 401, 403, 1100).
    // Better to retry generously and let truly broken uploads fall through.
    const backoff = Math.min(30000, 500 * Math.pow(2, attempt)) + Math.random() * 500;
    await sleep(backoff);
  }
  return { ok: false, status: -1, body: 'max retries' };
}

async function main() {
  // Optional resume: filter out already-uploaded by listing bucket once
  let queue = allFiles.slice();
  if (RESUME) {
    console.log('Listing existing bucket keys...');
    const existing = await r2ListAll();
    console.log(`Bucket already has ${existing.size} keys`);
    queue = queue.filter(f => !existing.has(f));
    console.log(`After resume filter: ${queue.length} files still need upload`);
  }

  let done = 0, failed = 0;
  const failures = [];
  const t0 = Date.now();
  let idx = 0;

  // Pool of `CONCURRENCY` workers pulling from the queue.
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= queue.length) return;
      const f = queue[i];
      const r = await uploadWithRetry(f);
      if (r.ok) {
        done++;
      } else {
        failed++;
        failures.push({ file: f, status: r.status, body: r.body });
      }
      const total = done + failed;
      if (total % 200 === 0 || total === queue.length) {
        const elapsed = (Date.now() - t0) / 1000;
        const rate = total / elapsed;
        const eta = Math.round((queue.length - total) / rate);
        console.log(`  ${total}/${queue.length} (${(total / queue.length * 100).toFixed(1)}%) | ${rate.toFixed(1)}/s | ETA ${eta}s | failed ${failed}`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone: ${done} uploaded, ${failed} failed in ${elapsed}s`);

  if (failures.length) {
    fs.writeFileSync('/tmp/r2-upload-failures.json', JSON.stringify(failures, null, 2));
    console.log('Failures saved to /tmp/r2-upload-failures.json');
    console.log('First 5 failures:');
    failures.slice(0, 5).forEach(f => console.log(' ', JSON.stringify(f)));
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
