const https = require('https'); const fs = require('fs'); const os = require('os');
const { execSync } = require('child_process');
const API_KEY = process.env.GOOGLE_TTS_KEY;
const SR = 24000, VOICE = 'hi-IN-Chirp3-HD-Aoede';
function tts(text, rate) {
  const body = JSON.stringify({ input:{text}, voice:{languageCode:'hi-IN', name:VOICE},
    audioConfig:{audioEncoding:'LINEAR16', speakingRate:rate, sampleRateHertz:SR} });
  return new Promise((res,rej)=>{ const r=https.request({hostname:'texttospeech.googleapis.com',
    path:`/v1/text:synthesize?key=${API_KEY}`,method:'POST',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},x=>{
    let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode===200?res(Buffer.from(JSON.parse(d).audioContent,'base64')):rej(d.slice(0,120)));});
    r.on('error',rej);r.write(body);r.end();});
}
function voicedSec(wavPcm){
  const s=new Int16Array(wavPcm.length>>1); for(let i=0;i<s.length;i++) s[i]=wavPcm.readInt16LE(i*2);
  const win=Math.floor(SR*0.025), rms=[];
  for(let i=0;i+win<s.length;i+=win){let a=0;for(let j=0;j<win;j++){const v=s[i+j]/32768;a+=v*v;}rms.push(Math.sqrt(a/win));}
  const peak=Math.max(...rms,1e-9), th=Math.max(0.02,peak*0.12);
  let v=0; for(const r of rms) if(r>th) v++; return +(v*win/SR).toFixed(3);
}
async function measure(text, rate){
  const mp3='no'; const raw=await tts(text,rate);
  const tmp=os.tmpdir()+`/pv-${process.pid}.wav`; fs.writeFileSync(tmp,raw);
  // LINEAR16 already WAV with 44-byte header
  const pcm=fs.readFileSync(tmp).subarray(44); fs.unlinkSync(tmp);
  return voicedSec(pcm);
}
(async()=>{
  const pairs=[['अ','आ','a/aa'],['इ','ई','i/ee'],['उ','ऊ','u/oo']];
  for(const rate of [1.0, 0.85]){
    console.log(`\n=== rate ${rate} ===`);
    for(const [s,l,n] of pairs){
      const ds=await measure(s,rate), dl=await measure(l,rate);
      console.log(`  ${n.padEnd(6)}  ${s} ${ds}s  |  ${l} ${dl}s   ratio ${(dl/ds).toFixed(2)} ${dl>ds*1.3?'OK':'FLAT/INVERTED'}`);
    }
  }
})();
