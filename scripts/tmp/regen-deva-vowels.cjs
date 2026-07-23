// Calibrated regeneration of Devanagari vowel + matra clips so LONG vowels
// are always audibly longer than their SHORT partner. Chirp3-HD does not
// reliably preserve Hindi vowel length in isolated citation form, so we take
// deterministic control: generate the short partner, then slow the long vowel
// (lower speakingRate) until its measured voiced length >= 1.35x the short's.
const https=require('https'),fs=require('fs'),os=require('os'),path=require('path'),{execSync}=require('child_process');
const API_KEY=process.env.GOOGLE_TTS_KEY,SR=24000,VOICE='hi-IN-Chirp3-HD-Aoede';
const AUDIO=path.join(__dirname,'../../public/quest-audio');
let Mp3Encoder;
function tts(text,rate,gain=0){const body=JSON.stringify({input:{text},voice:{languageCode:'hi-IN',name:VOICE},audioConfig:{audioEncoding:'MP3',speakingRate:rate,volumeGainDb:gain,sampleRateHertz:SR}});return new Promise((res,rej)=>{const r=https.request({hostname:'texttospeech.googleapis.com',path:`/v1/text:synthesize?key=${API_KEY}`,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode===200?res(Buffer.from(JSON.parse(d).audioContent,'base64')):rej(new Error(d.slice(0,120))));});r.on('error',rej);r.write(body);r.end();});}
function decode(mp3){const t=os.tmpdir()+`/rv-${process.pid}.mp3`,w=t+'.wav';fs.writeFileSync(t,mp3);execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${t}" "${w}"`,{stdio:'pipe'});const d=fs.readFileSync(w).subarray(44);fs.unlinkSync(t);fs.unlinkSync(w);const s=new Int16Array(d.length>>1);for(let i=0;i<s.length;i++)s[i]=d.readInt16LE(i*2);return s;}
function spans(s){const win=Math.floor(SR*0.025),rms=[];for(let i=0;i+win<s.length;i+=win){let a=0;for(let j=0;j<win;j++){const v=s[i+j]/32768;a+=v*v;}rms.push(Math.sqrt(a/win));}const peak=Math.max(...rms,1e-9),th=Math.max(0.02,peak*0.12);const sp=[];let st=null;rms.forEach((r,i)=>{const v=r>th;if(v&&st===null)st=i;if(!v&&st!==null){sp.push([st,i]);st=null;}});if(st!==null)sp.push([st,rms.length]);const m=[];for(const x of sp){if(m.length&&x[0]-m[m.length-1][1]<3)m[m.length-1][1]=x[1];else m.push([...x]);}return{m,win,peakDb:Math.round(20*Math.log10(peak))};}
function enc(s){const e=new Mp3Encoder(1,SR,48),ch=[],B=1152;for(let i=0;i<s.length;i+=B){const f=e.encodeBuffer(s.subarray(i,i+B));if(f.length)ch.push(Buffer.from(f));}const t=e.flush();if(t.length)ch.push(Buffer.from(t));return Buffer.concat(ch);}
// trim doubled take to first substantial utterance, return {buf, voicedSec}
function trimFirst(mp3){const s=decode(mp3);const{m,win,peakDb}=spans(s);if(m.length<1)return null;const maxL=Math.max(...m.map(x=>x[1]-x[0]));const f=m.find(x=>(x[1]-x[0])>=Math.max(4,maxL*0.4));if(!f)return null;const nx=m.find(x=>x[0]>f[1]&&(x[1]-x[0])>=Math.max(4,maxL*0.4));const pH=Math.floor(SR*0.10),pT=Math.floor(SR*0.18);const start=Math.max(0,f[0]*win-pH);const hardEnd=nx?nx[0]*win-Math.floor(SR*0.05):s.length;const end=Math.min(s.length,f[1]*win+pT,hardEnd);const cut=new Int16Array(end-start+pH+pT);cut.set(s.subarray(start,end),pH);return{buf:enc(cut),voicedSec:+((f[1]-f[0])*win/SR).toFixed(3),peakDb};}
async function makeVowel(glyph,rate){for(let att=0;att<3;att++){const gain=att?Math.min(16,8*att):0;const raw=await tts(`${glyph}। ${glyph}।`,rate,gain);const t=trimFirst(raw);if(t&&t.peakDb>=-18&&t.voicedSec>=0.12)return t;await new Promise(r=>setTimeout(r,300));}const raw=await tts(`${glyph}। ${glyph}।`,rate,8);return trimFirst(raw)||{buf:raw,voicedSec:0,peakDb:-99};}

(async()=>{
 Mp3Encoder=(await import('@breezystack/lamejs')).Mp3Encoder;
 const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'../../src/data/scripts/devanagari.json'),'utf8'));
 const byg=Object.fromEntries(pack.items.filter(i=>i.kind==='letter'||i.kind==='modifier').map(i=>[i.glyph,i]));
 // vowel-letter carriers on क for matras; independent vowels bare.
 // pairs: [short, long]; matra pairs use क-carrier for reliable voicing.
 const SHORT_RATE=1.0, START=0.72, STEP=0.12, FLOOR=0.42, NEED=1.35;
 const pairs=[
   {name:'a/aa',  short:{g:'अ',text:'अ'},  long:{g:'आ',text:'आ'}},
   {name:'i/ee',  short:{g:'इ',text:'इ'},  long:{g:'ई',text:'ई'}},
   {name:'u/oo',  short:{g:'उ',text:'उ'},  long:{g:'ऊ',text:'ऊ'}},
   {name:'imatra',short:{g:'ि',text:'कि'}, long:{g:'ी',text:'की'}},
   {name:'umatra',short:{g:'ु',text:'कु'}, long:{g:'ू',text:'कू'}},
 ];
 // unpaired long vowels/matras — just make them clearly long (fixed slow rate)
 const unpaired=[['ए','ए'],['ऐ','ऐ'],['ओ','ओ'],['औ','औ'],['ऋ','ऋ'],['ा','का'],['े','के'],['ै','कै'],['ो','को'],['ौ','कौ'],['ृ','कृ']];
 const results=[];
 for(const p of pairs){
   const s=await makeVowel(p.short.text,SHORT_RATE);
   let rate=START, l;
   for(;;){ l=await makeVowel(p.long.text,rate);
     if(l.voicedSec>=s.voicedSec*NEED || rate<=FLOOR) break;
     rate=+(rate-STEP).toFixed(2);
   }
   fs.writeFileSync(path.join(AUDIO,`${byg[p.short.g].id}.mp3`),s.buf);
   fs.writeFileSync(path.join(AUDIO,`${byg[p.long.g].id}.mp3`),l.buf);
   const ok=l.voicedSec>s.voicedSec*1.2;
   results.push(`${p.name.padEnd(8)} ${p.short.g} ${s.voicedSec}s | ${p.long.g}@${rate} ${l.voicedSec}s  ${ok?'OK ✓':'✗ '+(l.voicedSec/s.voicedSec).toFixed(2)}`);
   console.log('  '+results[results.length-1]);
 }
 for(const[g,text]of unpaired){ const c=await makeVowel(text,START); fs.writeFileSync(path.join(AUDIO,`${byg[g].id}.mp3`),c.buf); console.log(`  unpaired ${g} (${text})@${START} ${c.voicedSec}s`);}
 console.log('\nPAIR CHECK:'); results.forEach(r=>console.log('  '+r));
})();
