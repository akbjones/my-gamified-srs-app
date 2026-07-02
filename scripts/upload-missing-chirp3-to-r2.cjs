#!/usr/bin/env node
/**
 * Sweep-up uploader: catches all `<lang>-<lang>-*.mp3` files whose R2
 * copy is stale (different size) or missing. Fixes the S-XXX / Q-XXX
 * survival phrases that the original upload-chirp3-regen-to-r2.cjs
 * script's `\d+` regex silently skipped.
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
const LANGS = ['es','it','fr','pt','de','nl','sv','hi','tr','ru'];

// Match any <lang>-<lang>-<anything>.mp3 (permissive — captures S-, Q-,
// and any other suffix patterns we might introduce). Excludes Welsh
// which uses cy-<n>.mp3 (single prefix).
const PATTERN = new RegExp(`^(?:${LANGS.join('|')})-(?:${LANGS.join('|')})-.+\\.mp3$`);

const localFiles = fs.readdirSync(AUDIO_DIR).filter(f => PATTERN.test(f));
console.log(`Local candidates: ${localFiles.length}`);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function headOne(filename) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: 'api.cloudflare.com', port: 443, method: 'HEAD',
      path: `/client/v4/accounts/${ACCT}/r2/buckets/${BUCKET}/objects/${encodeURI(KEY_PREFIX + filename)}`,
      headers: { Authorization: `Bearer ${TOKEN}` },
    }, res => {
      resolve({
        status: res.statusCode,
        size: parseInt(res.headers['content-length'] || '0', 10),
      });
      res.on('data', () => {});
    });
    req.on('error', () => resolve({ status: -1, size: 0 }));
    req.end();
  });
}

function putOne(filename) {
  return new Promise(resolve => {
    const fp = path.join(AUDIO_DIR, filename);
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
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode }));
    });
    req.on('error', e => resolve({ ok: false, err: e.message }));
    fs.createReadStream(fp).pipe(req);
  });
}

async function withRetry(fn, filename, max = 5) {
  for (let i = 0; i < max; i++) {
    const r = await fn(filename);
    if (r.ok || r.status < 400) return r;
    await sleep(500 * Math.pow(2, i) + Math.random() * 300);
  }
  return { ok: false };
}

(async () => {
  console.log('\nStep 1: Discover R2 size vs local size (parallel HEAD)...');
  const toUpload = [];
  let idx = 0, checked = 0;
  async function checker() {
    while (idx < localFiles.length) {
      const i = idx++;
      const f = localFiles[i];
      const localSize = fs.statSync(path.join(AUDIO_DIR, f)).size;
      const r2 = await headOne(f);
      checked++;
      if (r2.status !== 200 || r2.size !== localSize) toUpload.push(f);
      if (checked % 500 === 0) console.log(`  checked ${checked}/${localFiles.length}, ${toUpload.length} out-of-sync so far`);
    }
  }
  await Promise.all(Array.from({length: CONCURRENCY}, () => checker()));
  console.log(`  Done. ${toUpload.length} files out-of-sync.`);

  if (!toUpload.length) { console.log('Nothing to do.'); return; }

  console.log(`\nStep 2: Upload ${toUpload.length} files...`);
  let ok = 0, fail = 0, up = 0;
  const fails = [];
  async function uploader() {
    while (up < toUpload.length) {
      const i = up++;
      const f = toUpload[i];
      const r = await withRetry(putOne, f);
      if (r.ok) ok++; else { fail++; fails.push(f); }
      if ((ok + fail) % 20 === 0) console.log(`  ${ok+fail}/${toUpload.length} ✓${ok} ✗${fail}`);
    }
  }
  await Promise.all(Array.from({length: CONCURRENCY}, () => uploader()));
  console.log(`\nDone: ${ok} ok, ${fail} failed`);
  if (fails.length) fs.writeFileSync('/tmp/missing-upload-fails.json', JSON.stringify(fails, null, 2));
})();
