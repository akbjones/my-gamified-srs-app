const https=require('https'),fs=require('fs'),os=require('os'),{execSync}=require('child_process');
const API_KEY=process.env.GOOGLE_TTS_KEY,SR=24000,VOICE='hi-IN-Chirp3-HD-Aoede';
function tts(text,rate){const body=JSON.stringify({input:{text},voice:{languageCode:'hi-IN',name:VOICE},audioConfig:{audioEncoding:'MP3',speakingRate:rate,sampleRateHertz:SR}});return new Promise((res,rej)=>{const r=https.request({hostname:'texttospeech.googleapis.com',path:`/v1/text:synthesize?key=${API_KEY}`,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode===200?res(Buffer.from(JSON.parse(d).audioContent,'base64')):rej(d.slice(0,120)));});r.on('error',rej);r.write(body);r.end();});}
function decode(mp3){const t=os.tmpdir()+`/pr-${process.pid}.mp3`,w=t+'.wav';fs.writeFileSync(t,mp3);execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${t}" "${w}"`,{stdio:'pipe'});const d=fs.readFileSync(w).subarray(44);fs.unlinkSync(t);fs.unlinkSync(w);const s=new Int16Array(d.length>>1);for(let i=0;i<s.length;i++)s[i]=d.readInt16LE(i*2);return s;}
function spans(s){const win=Math.floor(SR*0.025),rms=[];for(let i=0;i+win<s.length;i+=win){let a=0;for(let j=0;j<win;j++){const v=s[i+j]/32768;a+=v*v;}rms.push(Math.sqrt(a/win));}const peak=Math.max(...rms,1e-9),th=Math.max(0.02,peak*0.12);const sp=[];let st=null;rms.forEach((r,i)=>{const v=r>th;if(v&&st===null)st=i;if(!v&&st!==null){sp.push([st,i]);st=null;}});if(st!==null)sp.push([st,rms.length]);const m=[];for(const x of sp){if(m.length&&x[0]-m[m.length-1][1]<3)m[m.length-1][1]=x[1];else m.push([...x]);}return{m,win};}
async function firstLen(text,rate){const buf=await tts(text,rate);const s=decode(buf);const{m,win}=spans(s);if(!m.length)return 0;const maxL=Math.max(...m.map(x=>x[1]-x[0]));const f=m.find(x=>(x[1]-x[0])>=Math.max(4,maxL*0.4));return f?+((f[1]-f[0])*win/SR).toFixed(3):0;}
(async()=>{
 // short vowels at 1.05, long at 0.72  (bare doubled)
 const shortR=1.05, longR=0.72;
 const pairs=[['अ',shortR,'a'],['आ',longR,'aa'],['इ',shortR,'i'],['ई',longR,'ee'],['उ',shortR,'u'],['ऊ',longR,'oo'],['ए',longR,'e'],['ऐ',longR,'ai'],['ओ',longR,'o'],['औ',longR,'au']];
 console.log('RATE-CONTROLLED bare doubled (short@1.05, long@0.72):');
 const res={};
 for(const[g,r,n]of pairs){const d=await firstLen(`${g}। ${g}।`,r);res[n]=d;console.log(`  ${n.padEnd(4)} ${g} @${r}  ${d}s`);}
 console.log('\nPAIR CHECK (long must exceed short):');
 for(const[s,l]of[['a','aa'],['i','ee'],['u','oo']]) console.log(`  ${s} ${res[s]}s vs ${l} ${res[l]}s  ${res[l]>res[s]*1.25?'OK ✓':'STILL FLAT ✗'}`);
})();
