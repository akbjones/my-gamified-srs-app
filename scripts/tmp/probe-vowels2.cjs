const https=require('https'),fs=require('fs'),os=require('os'),{execSync}=require('child_process');
const API_KEY=process.env.GOOGLE_TTS_KEY, SR=24000, VOICE='hi-IN-Chirp3-HD-Aoede';
function tts(text,rate){const body=JSON.stringify({input:{text},voice:{languageCode:'hi-IN',name:VOICE},audioConfig:{audioEncoding:'MP3',speakingRate:rate,sampleRateHertz:SR}});
 return new Promise((res,rej)=>{const r=https.request({hostname:'texttospeech.googleapis.com',path:`/v1/text:synthesize?key=${API_KEY}`,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode===200?res(Buffer.from(JSON.parse(d).audioContent,'base64')):rej(d.slice(0,120)));});r.on('error',rej);r.write(body);r.end();});}
function decode(mp3){const t=os.tmpdir()+`/p2-${process.pid}.mp3`,w=t+'.wav';fs.writeFileSync(t,mp3);execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${t}" "${w}"`,{stdio:'pipe'});const d=fs.readFileSync(w).subarray(44);fs.unlinkSync(t);fs.unlinkSync(w);const s=new Int16Array(d.length>>1);for(let i=0;i<s.length;i++)s[i]=d.readInt16LE(i*2);return s;}
function spans(s){const win=Math.floor(SR*0.025),rms=[];for(let i=0;i+win<s.length;i+=win){let a=0;for(let j=0;j<win;j++){const v=s[i+j]/32768;a+=v*v;}rms.push(Math.sqrt(a/win));}const peak=Math.max(...rms,1e-9),th=Math.max(0.02,peak*0.12);const sp=[];let st=null;rms.forEach((r,i)=>{const v=r>th;if(v&&st===null)st=i;if(!v&&st!==null){sp.push([st,i]);st=null;}});if(st!==null)sp.push([st,rms.length]);const m=[];for(const x of sp){if(m.length&&x[0]-m[m.length-1][1]<3)m[m.length-1][1]=x[1];else m.push([...x]);}return {m,win};}
// first substantial utterance voiced length (seconds)
async function firstLen(text,rate){const buf=await tts(text,rate);const s=decode(buf);const{m,win}=spans(s);if(!m.length)return 0;const maxL=Math.max(...m.map(x=>x[1]-x[0]));const f=m.find(x=>(x[1]-x[0])>=Math.max(4,maxL*0.4));return f?+((f[1]-f[0])*win/SR).toFixed(3):0;}
(async()=>{
 const pairs=[['अ','आ','a/aa'],['इ','ई','i/ee'],['उ','ऊ','u/oo'],['ए','ऐ','e/ai']];
 console.log('BARE DOUBLED (आ। आ।) rate 1.0 — first-utterance voiced:');
 for(const[s,l,n]of pairs){const a=await firstLen(`${s}। ${s}।`,1.0),b=await firstLen(`${l}। ${l}।`,1.0);console.log(`  ${n.padEnd(6)} ${s} ${a}s | ${l} ${b}s  ratio ${a?(b/a).toFixed(2):'inf'} ${b>a*1.3?'OK':'FLAT'}`);}
 console.log('\nCARRIED ON क (क + independent-vowel-as-matra), doubled, rate 1.0:');
 // independent vowel -> its matra on क: अ→क, आ→का, इ→कि, ई→की, उ→कु, ऊ→कू, ए→के, ऐ→कै
 const carr=[['क','का','ka/kaa'],['कि','की','ki/kee'],['कु','कू','ku/koo'],['के','कै','ke/kai']];
 for(const[s,l,n]of carr){const a=await firstLen(`${s}। ${s}।`,1.0),b=await firstLen(`${l}। ${l}।`,1.0);console.log(`  ${n.padEnd(8)} ${s} ${a}s | ${l} ${b}s  ratio ${a?(b/a).toFixed(2):'inf'} ${b>a*1.3?'OK':'FLAT'}`);}
})();
