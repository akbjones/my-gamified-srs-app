#!/usr/bin/env node
// Regenerate audio for cards still pending (docs/hi-quality/pending-regen.json).
// Low concurrency + exponential backoff: a 6-wide burst previously tripped a
// rate limit that Google reports as API_KEY_INVALID, which looks like a dead key.
const fs=require('fs'),path=require('path'),https=require('https');
const API_KEY=process.env.GOOGLE_TTS_KEY; if(!API_KEY){console.error('Set GOOGLE_TTS_KEY');process.exit(1);}
const VOICE='hi-IN-Chirp3-HD-Aoede',SR=24000,AUDIO='public/quest-audio';
const deck=JSON.parse(fs.readFileSync('src/data/hindi/deck.json','utf8'));
const byId=new Map(deck.map(c=>[String(c.id),c]));
const pending=JSON.parse(fs.readFileSync('docs/hi-quality/pending-regen.json','utf8')).map(String);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function call(text){const body=JSON.stringify({input:{text},voice:{languageCode:'hi-IN',name:VOICE},audioConfig:{audioEncoding:'MP3',speakingRate:1.0,pitch:0,sampleRateHertz:SR}});
 return new Promise((res,rej)=>{const r=https.request({hostname:'texttospeech.googleapis.com',path:`/v1/text:synthesize?key=${API_KEY}`,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},resp=>{let d='';resp.on('data',c=>d+=c);resp.on('end',()=>resp.statusCode===200?res(Buffer.from(JSON.parse(d).audioContent,'base64')):rej(new Error(`HTTP ${resp.statusCode}`)));});r.on('error',rej);r.write(body);r.end();});}
async function withRetry(text,tries=5){let wait=800;
 for(let i=0;i<tries;i++){ try{ return await call(text);}catch(e){ if(i===tries-1)throw e; await sleep(wait); wait*=2; } }}
(async()=>{
  let ok=0,fail=0; const failed=[]; const CONC=2;
  for(let i=0;i<pending.length;i+=CONC){
    await Promise.all(pending.slice(i,i+CONC).map(async id=>{
      const c=byId.get(id); if(!c)return;
      try{ fs.writeFileSync(path.join(AUDIO,c.audio), await withRetry(c.ttsText||c.target)); ok++; }
      catch(e){ fail++; failed.push(id); }
    }));
    await sleep(120);
    if(ok%50===0) process.stdout.write(`\r  ${ok}/${pending.length}`);
  }
  console.log(`\ndone: ${ok} regenerated, ${fail} failed`);
  fs.writeFileSync('/private/tmp/regen-failed2.json',JSON.stringify(failed));
})();
