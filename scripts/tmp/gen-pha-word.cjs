#!/usr/bin/env node
// Test the user's insight: Aoede aspirates फ in real WORDS (deck audio) but says
// "f" for the bare/isolated letter. Compare a real deck clip (फल sentence) to
// Aoede word-takes of फल / फूल, a syllable-trim of फल (→ "pʰa" letter clip), and
// the bare फा control. User picks which gives a proper "pha".
const fs=require('fs'),os=require('os'),path=require('path'),https=require('https'),{execSync}=require('child_process');
const API_KEY=process.env.GOOGLE_TTS_KEY; if(!API_KEY){console.error('Set GOOGLE_TTS_KEY');process.exit(1);}
const SR=24000,voiceName='hi-IN-Chirp3-HD-Aoede';
const OUT='/private/tmp/deva-pha-word'; fs.mkdirSync(OUT,{recursive:true});
const AUDIO=path.resolve('public/quest-audio');

function tts(text,rate){const body=JSON.stringify({input:{text},voice:{languageCode:'hi-IN',name:voiceName},audioConfig:{audioEncoding:'MP3',speakingRate:rate,pitch:0,sampleRateHertz:SR}});return new Promise((res,rej)=>{const r=https.request({hostname:'texttospeech.googleapis.com',path:`/v1/text:synthesize?key=${API_KEY}`,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},resp=>{let d='';resp.on('data',c=>d+=c);resp.on('end',()=>resp.statusCode===200?res(Buffer.from(JSON.parse(d).audioContent,'base64')):rej(new Error(`HTTP ${resp.statusCode}: ${d.slice(0,100)}`)));});r.on('error',rej);r.write(body);r.end();});}
function dec(buf){const t=os.tmpdir()+'/pw-'+Math.random().toString(36).slice(2)+'.mp3',w=t+'.wav';fs.writeFileSync(t,buf);execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${t}" "${w}"`,{stdio:'pipe'});const d=fs.readFileSync(w).subarray(44);fs.unlinkSync(t);fs.unlinkSync(w);const s=new Int16Array(d.length>>1);for(let i=0;i<s.length;i++)s[i]=d.readInt16LE(i*2);return s;}
function spans(s){const win=Math.floor(SR*0.025),rms=[];for(let i=0;i+win<s.length;i+=win){let a=0;for(let j=0;j<win;j++){const v=s[i+j]/32768;a+=v*v;}rms.push(Math.sqrt(a/win));}const pk=Math.max(...rms,1e-9),th=Math.max(0.02,pk*0.12);const sp=[];let st=null;rms.forEach((r,i)=>{const v=r>th;if(v&&st===null)st=i;if(!v&&st!==null){sp.push([st,i]);st=null;}});if(st!==null)sp.push([st,rms.length]);const m=[];for(const x of sp){if(m.length&&x[0]-m[m.length-1][1]<3)m[m.length-1][1]=x[1];else m.push([...x]);}return{spans:m,win};}
let Enc=null;
function enc(s){const e=new Enc(1,SR,48),ch=[];for(let i=0;i<s.length;i+=1152){const f=e.encodeBuffer(s.subarray(i,i+1152));if(f.length)ch.push(Buffer.from(f));}const t=e.flush();if(t.length)ch.push(Buffer.from(t));return Buffer.concat(ch);}
function fade(cut){const fIn=Math.min(Math.floor(SR*0.012),cut.length>>2),fOut=Math.min(Math.floor(SR*0.045),cut.length>>2);for(let i=0;i<fIn;i++)cut[i]=Math.round(cut[i]*0.5*(1-Math.cos(Math.PI*i/fIn)));for(let i=0;i<fOut;i++){const k=cut.length-1-i;cut[k]=Math.round(cut[k]*0.5*(1-Math.cos(Math.PI*i/fOut)));}return cut;}
function norm(cut,tp=-3.4){let pk=0;for(let i=0;i<cut.length;i++){const a=Math.abs(cut[i]);if(a>pk)pk=a;}const g=pk>0?Math.min(8,32768*Math.pow(10,tp/20)/pk):1;const lead=Math.floor(SR*0.05),out=new Int16Array(lead+cut.length);for(let i=0;i<cut.length;i++)out[lead+i]=Math.max(-32768,Math.min(32767,Math.round(cut[i]*g)));return out;}
function firstUtterance(samples){const{spans:sp,win}=spans(samples);if(!sp.length)return null;const maxLen=Math.max(...sp.map(s=>s[1]-s[0]));const first=sp.find(s=>(s[1]-s[0])>=Math.max(4,maxLen*0.4));if(!first)return null;const next=sp.find(s2=>s2[0]>first[1]&&(s2[1]-s2[0])>=Math.max(4,maxLen*0.4));const start=Math.max(0,first[0]*win-Math.floor(SR*0.09));const hardEnd=next?next[0]*win-Math.floor(SR*0.06):samples.length;const end=Math.min(samples.length,first[1]*win+Math.floor(SR*0.22),hardEnd);return {cut:samples.slice(start,end),start,end,win,first};}
// keep only the first ~syllable: from onset to onset + capMs
function syllable(samples,capMs){const u=firstUtterance(samples);if(!u)return null;const len=Math.min(u.cut.length,Math.floor(SR*(0.09+capMs/1000)));return norm(fade(u.cut.slice(0,len)));}

(async()=>{
  Enc=(await import('@breezystack/lamejs')).Mp3Encoder;
  const man=[];
  // reference deck clip (फल in a sentence) — copy as-is
  const ref='hi-hi-0452.mp3';
  man.push({id:'DECK_ref',label:'REAL deck clip — "मीठे फल..." (your pʰ evidence)',b64:fs.readFileSync(path.join(AUDIO,ref)).toString('base64')});
  // word takes
  for(const [id,word,label] of [['W_phal','फल','word फल (phal = fruit), whole'],['W_phool','फूल','word फूल (phool = flower), whole']]){
    const u=firstUtterance(dec(await tts(`${word}। ${word}।`,0.9)));
    man.push({id,label,b64:enc(norm(fade(u.cut))).toString('base64')});
    await new Promise(r=>setTimeout(r,200));
  }
  // syllable trims of फल -> "pʰa"
  for(const [id,capMs,label] of [['S_phal_short',150,'फल trimmed to "pʰa" (~0.24s)'],['S_phal_med',230,'फल trimmed to "pʰa" (~0.32s)']]){
    const syl=syllable(dec(await tts('फल। फल।',0.9)),capMs);
    man.push({id,label,b64:enc(syl).toString('base64')});
    await new Promise(r=>setTimeout(r,200));
  }
  // control: bare फा (they said this = f)
  { const u=firstUtterance(dec(await tts('फा। फा।',0.9))); man.push({id:'C_phaa',label:'फा control (you heard this as "f")',b64:enc(norm(fade(u.cut))).toString('base64')}); }
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(man,null,1));
  console.log('takes:',man.map(m=>m.id).join(', '));
})();
