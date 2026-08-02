#!/usr/bin/env node
// Regenerate audio for the cards whose sentence changed in the QC pass.
const fs=require('fs'),path=require('path'),https=require('https');
const API_KEY=process.env.GOOGLE_TTS_KEY; if(!API_KEY){console.error('Set GOOGLE_TTS_KEY');process.exit(1);}
const VOICE='hi-IN-Chirp3-HD-Aoede',SR=24000,AUDIO='public/quest-audio';
const deck=JSON.parse(fs.readFileSync('src/data/hindi/deck.json','utf8'));
const byId=new Map(deck.map(c=>[String(c.id),c]));
const list=JSON.parse(fs.readFileSync('docs/hi-quality/regen-list.json','utf8'));
function tts(text){const body=JSON.stringify({input:{text},voice:{languageCode:'hi-IN',name:VOICE},audioConfig:{audioEncoding:'MP3',speakingRate:1.0,pitch:0,sampleRateHertz:SR}});
 return new Promise((res,rej)=>{const r=https.request({hostname:'texttospeech.googleapis.com',path:`/v1/text:synthesize?key=${API_KEY}`,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},resp=>{let d='';resp.on('data',c=>d+=c);resp.on('end',()=>resp.statusCode===200?res(Buffer.from(JSON.parse(d).audioContent,'base64')):rej(new Error(`HTTP ${resp.statusCode}: ${d.slice(0,100)}`)));});r.on('error',rej);r.write(body);r.end();});}
(async()=>{
  let ok=0,fail=0; const failed=[];
  const CONC=6;
  for(let i=0;i<list.length;i+=CONC){
    await Promise.all(list.slice(i,i+CONC).map(async it=>{
      const c=byId.get(String(it.id)); if(!c)return;
      try{ const buf=await tts(c.ttsText||c.target); fs.writeFileSync(path.join(AUDIO,c.audio),buf); ok++; }
      catch(e){ fail++; failed.push(it.id); }
    }));
    if((i+CONC)%120<CONC) process.stdout.write(`\r  ${ok}/${list.length}`);
  }
  console.log(`\ndone: ${ok} regenerated, ${fail} failed${failed.length?' → '+failed.slice(0,10).join(' '):''}`);
  fs.writeFileSync('/private/tmp/regen-failed.json',JSON.stringify(failed));
})();
