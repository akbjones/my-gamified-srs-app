#!/usr/bin/env node
// फ across multiple Hindi voices — modern Chirp says "f", but older Wavenet/
// Neural2 voices may keep the aspirated "pʰa". Bare doubled+trimmed per voice.
//   GOOGLE_TTS_KEY=... node scripts/tmp/gen-pha-voices.cjs <outdir>
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https'), { execSync } = require('child_process');
const API_KEY = process.env.GOOGLE_TTS_KEY; if (!API_KEY) { console.error('Set GOOGLE_TTS_KEY'); process.exit(1); }
const SR = 24000, OUT = process.argv[2] || '/private/tmp/deva-pha'; fs.mkdirSync(OUT, { recursive: true });
const VOICES = [
  { id: 'aoede', name: 'hi-IN-Chirp3-HD-Aoede', note: 'current pack voice (modern, says "f")' },
  { id: 'wavenetA', name: 'hi-IN-Wavenet-A', note: 'Wavenet female' },
  { id: 'wavenetB', name: 'hi-IN-Wavenet-B', note: 'Wavenet male' },
  { id: 'neural2A', name: 'hi-IN-Neural2-A', note: 'Neural2 female' },
  { id: 'neural2C', name: 'hi-IN-Neural2-C', note: 'Neural2 male' },
  { id: 'standardA', name: 'hi-IN-Standard-A', note: 'Standard female' },
];
function tts(text, rate, name) { const body = JSON.stringify({ input: { text }, voice: { languageCode: 'hi-IN', name }, audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch: 0, sampleRateHertz: SR } }); return new Promise((res, rej) => { const r = https.request({ hostname: 'texttospeech.googleapis.com', path: `/v1/text:synthesize?key=${API_KEY}`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => resp.statusCode === 200 ? res(Buffer.from(JSON.parse(d).audioContent, 'base64')) : rej(new Error(`HTTP ${resp.statusCode}: ${d.slice(0,100)}`))); }); r.on('error', rej); r.write(body); r.end(); }); }
function dec(buf){const t=os.tmpdir()+'/pv-'+Math.random().toString(36).slice(2)+'.mp3',w=t+'.wav';fs.writeFileSync(t,buf);execSync(`afconvert -f WAVE -d LEI16@${SR} -c 1 "${t}" "${w}"`,{stdio:'pipe'});const d=fs.readFileSync(w).subarray(44);fs.unlinkSync(t);fs.unlinkSync(w);const s=new Int16Array(d.length>>1);for(let i=0;i<s.length;i++)s[i]=d.readInt16LE(i*2);return s;}
function spans(s){const win=Math.floor(SR*0.025),rms=[];for(let i=0;i+win<s.length;i+=win){let a=0;for(let j=0;j<win;j++){const v=s[i+j]/32768;a+=v*v;}rms.push(Math.sqrt(a/win));}const pk=Math.max(...rms,1e-9),th=Math.max(0.02,pk*0.12);const sp=[];let st=null;rms.forEach((r,i)=>{const v=r>th;if(v&&st===null)st=i;if(!v&&st!==null){sp.push([st,i]);st=null;}});if(st!==null)sp.push([st,rms.length]);const m=[];for(const x of sp){if(m.length&&x[0]-m[m.length-1][1]<3)m[m.length-1][1]=x[1];else m.push([...x]);}return{spans:m,win};}
function qc(s){const{spans:sp,win}=spans(s);let vc=0;for(const x of sp)vc+=x[1]-x[0];let pk=0;for(let i=0;i<s.length;i++){const a=Math.abs(s[i]);if(a>pk)pk=a;}return{voiced:+(vc*win/SR).toFixed(2),peak:+(20*Math.log10((pk||1)/32768)).toFixed(1),dur:+(s.length/SR).toFixed(2)};}
let Enc=null;
function enc(s){const e=new Enc(1,SR,48),ch=[];for(let i=0;i<s.length;i+=1152){const f=e.encodeBuffer(s.subarray(i,i+1152));if(f.length)ch.push(Buffer.from(f));}const t=e.flush();if(t.length)ch.push(Buffer.from(t));return Buffer.concat(ch);}
function refine(samples,targetPeak=-3.4){const{spans:sp,win}=spans(samples);if(!sp.length)return null;const maxLen=Math.max(...sp.map(s=>s[1]-s[0]));const first=sp.find(s=>(s[1]-s[0])>=Math.max(4,maxLen*0.4));if(!first)return null;const next=sp.find(s2=>s2[0]>first[1]&&(s2[1]-s2[0])>=Math.max(4,maxLen*0.4));const leadIn=Math.floor(SR*0.09),tail=Math.floor(SR*0.22);const start=Math.max(0,first[0]*win-leadIn),hardEnd=next?next[0]*win-Math.floor(SR*0.06):samples.length;const end=Math.min(samples.length,first[1]*win+tail,hardEnd);const cut=samples.slice(start,end);const fIn=Math.min(Math.floor(SR*0.012),cut.length>>2),fOut=Math.min(Math.floor(SR*0.045),cut.length>>2);for(let i=0;i<fIn;i++)cut[i]=Math.round(cut[i]*0.5*(1-Math.cos(Math.PI*i/fIn)));for(let i=0;i<fOut;i++){const k=cut.length-1-i;cut[k]=Math.round(cut[k]*0.5*(1-Math.cos(Math.PI*i/fOut)));}let pk=0;for(let i=0;i<cut.length;i++){const a=Math.abs(cut[i]);if(a>pk)pk=a;}const g=pk>0?Math.min(8,32768*Math.pow(10,targetPeak/20)/pk):1;const lead=Math.floor(SR*0.05),out=new Int16Array(lead+cut.length);for(let i=0;i<cut.length;i++)out[lead+i]=Math.max(-32768,Math.min(32767,Math.round(cut[i]*g)));return out;}

(async () => {
  Enc = (await import('@breezystack/lamejs')).Mp3Encoder;
  const manifest = [];
  for (const v of VOICES) {
    try {
      const proc = refine(dec(await tts('फ। फ।', 0.9, v.name)));
      if (!proc) { console.log(`  ${v.id}: refine failed`); continue; }
      const buf = enc(proc), q = qc(proc);
      manifest.push({ ...v, b64: buf.toString('base64'), qc: q });
      console.log(`  ${v.id} (${v.name}): voiced ${q.voiced}s dur ${q.dur}s`);
    } catch (e) { console.log(`  ${v.id}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 200));
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`\n✓ ${manifest.length} voices → ${OUT}/manifest.json`);
})();
