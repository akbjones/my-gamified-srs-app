#!/usr/bin/env node
/**
 * Upload all non-Welsh language MP3s to R2 langlab-srs-audio with
 * quest-audio/ prefix. PUT overwrites existing keys.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCT = process.env.CLOUDFLARE_ACCOUNT_ID;
const BUCKET = process.env.CF_BUCKET || 'langlab-srs-audio';
const KEY_PREFIX = 'quest-audio/';

if (!TOKEN || !ACCT) { console.error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID'); process.exit(1); }

const CONCURRENCY = 24;
const AUDIO_DIR = path.resolve('public/quest-audio');

// Match all `<lang>-<lang>-NNNN.mp3` patterns where lang is one of the 10 Chirp3 langs.
// Exclude Welsh (cy-N.mp3 single prefix) and any orphans.
const LANGS = ['es','it','fr','pt','de','nl','sv','hi','tr','ru'];
const PATTERN = new RegExp(`^(?:${LANGS.join('|')})-(?:${LANGS.join('|')})-\\d+\\.mp3$`);

const all = fs.readdirSync(AUDIO_DIR);
const files = all.filter(f => PATTERN.test(f));
const bytes = files.reduce((s,f) => s + fs.statSync(path.join(AUDIO_DIR,f)).size, 0);
console.log(`Uploading ${files.length} files (${(bytes/1024/1024).toFixed(1)} MB) → ${BUCKET}/${KEY_PREFIX}`);

const sleep = ms => new Promise(r=>setTimeout(r,ms));

function uploadOne(filename) {
  return new Promise(resolve => {
    const fp = path.join(AUDIO_DIR, filename);
    const sz = fs.statSync(fp).size;
    const req = https.request({
      hostname:'api.cloudflare.com', port:443, method:'PUT',
      path: `/client/v4/accounts/${ACCT}/r2/buckets/${BUCKET}/objects/${encodeURI(KEY_PREFIX + filename)}`,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type':'audio/mpeg',
        'Content-Length': sz,
      },
    }, res => {
      let body=''; res.on('data',c=>body+=c);
      res.on('end',()=>{
        if (res.statusCode===200) return resolve({ok:true});
        resolve({ok:false, status:res.statusCode, body:body.slice(0,150)});
      });
    });
    req.on('error', e => resolve({ok:false, status:-1, body:e.message}));
    fs.createReadStream(fp).pipe(req);
  });
}

async function withRetry(f, max=6) {
  for (let i=0; i<max; i++) {
    const r = await uploadOne(f);
    if (r.ok) return r;
    await sleep(500 * Math.pow(2,i) + Math.random()*300);
  }
  return {ok:false};
}

(async () => {
  let done=0, failed=0, idx=0; const t0=Date.now(); const fails=[];
  async function worker(){
    while (true) {
      const i = idx++;
      if (i >= files.length) return;
      const r = await withRetry(files[i]);
      if (r.ok) done++; else { failed++; fails.push(files[i]); }
      const total = done + failed;
      if (total % 500 === 0 || total === files.length) {
        const dt = (Date.now()-t0)/1000;
        const eta = Math.round((files.length-total) / (total/dt));
        console.log(`  ${total}/${files.length}  ✓${done} ✗${failed}  ${(total/dt).toFixed(1)}/s  ETA ${eta}s`);
      }
    }
  }
  await Promise.all(Array.from({length:CONCURRENCY},()=>worker()));
  console.log(`\nDone: ${done} ok, ${failed} failed in ${((Date.now()-t0)/1000).toFixed(1)}s`);
  if (fails.length) fs.writeFileSync('/tmp/r2-upload-fails.json', JSON.stringify(fails));
})();
