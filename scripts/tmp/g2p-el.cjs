// Greek grapheme->IPA with stress (v3).
function stripT(s){return s.normalize('NFD').replace(/[̀-̈́]/g,'').normalize('NFC');}
const ACC='άέήίόύώΐΰ';
const VOICEDNEXT=new Set(['v','ɣ','ð','z','m','n','r','l','b','d','ʝ','ɡ','ŋ','ŋɡ','mb','nd']);
function g2p(word){
  const raw=[...word.toLowerCase()];
  const G=raw.map(c=>({c:stripT(c), acc:ACC.includes(c)}));
  const isVowel=c=>c!==''&&'αεηιουω'.includes(c);
  function frontAfter(j){
    // palatalize only when the IMMEDIATELY next grapheme is a front vowel
    if(j>=G.length)return false;
    if(!isVowel(G[j].c))return false;
    const t=G[j].c+((G[j+1]&&G[j+1].c)||'');
    if(t==='ου'||t==='αυ')return false;
    if(t==='ευ')return true;
    if(t==='αι'||['ει','οι','υι'].includes(t))return true;
    return 'εηιυ'.includes(G[j].c);
  }
  const segs=[]; let i=0;
  while(i<G.length){
    const a=G[i], b=G[i+1]||{c:'',acc:false}, c2=G[i+2]||{c:'',acc:false};
    const two=a.c+b.c; const acc2=a.acc||b.acc;
    if(two==='ου'){segs.push({p:'u',v:1,s:acc2});i+=2;continue;}
    if(two==='αι'){segs.push({p:'e',v:1,s:acc2});i+=2;continue;}
    if(['ει','οι','υι'].includes(two)){segs.push({p:'i',v:1,s:acc2});i+=2;continue;}
    if(two==='αυ'||two==='ευ'){
      const base=two==='αυ'?'a':'e';
      const nx=c2.c; const voiced=isVowel(nx)||'βγδζλμνρ'.includes(nx);
      segs.push({p:base,v:1,s:acc2});
      segs.push({p:voiced?'v':'f',v:0,coda:1});
      i+=2;continue;
    }
    if(two==='γγ'||two==='γκ'){segs.push({p:i>0?'ŋɡ':'ɡ',v:0});i+=2;continue;}
    if(two==='γχ'){segs.push({p:'ŋx',v:0});i+=2;continue;}
    if(two==='μπ'){segs.push({p:i>0?'mb':'b',v:0});i+=2;continue;}
    if(two==='ντ'){segs.push({p:i>0?'nd':'d',v:0});i+=2;continue;}
    if(two==='τσ'){segs.push({p:'ts',v:0});i+=2;continue;}
    if(two==='τζ'){segs.push({p:'dz',v:0});i+=2;continue;}
    const vmap={α:'a',ε:'e',η:'i',ι:'i',ο:'o',υ:'i',ω:'o'};
    if(a.c in vmap){
      const prev=segs[segs.length-1];
      if(!a.acc && (a.c==='ι'||a.c==='η'||a.c==='υ') && isVowel(b.c) && prev && !prev.v){
        if(prev.p==='l'){prev.p='ʎ'; i++; continue;}
        if(prev.p==='n'){prev.p='ɲ'; i++; continue;}
        if(prev.p==='ɣ'||prev.p==='ʝ'){prev.p='ʝ'; i++; continue;}
        if(b.acc){ segs.push({p:'ʝ',v:0}); i++; continue; }
        // else keep as full vowel (careful pronunciation of -ιο/-ια)
      }
      segs.push({p:vmap[a.c],v:1,s:a.acc}); i++; continue;
    }
    const front=frontAfter(i+1);
    let p;
    switch(a.c){
      case 'β':p='v';break;case 'γ':p=front?'ʝ':'ɣ';break;case 'δ':p='ð';break;
      case 'ζ':p='z';break;case 'θ':p='θ';break;case 'κ':p=front?'c':'k';break;
      case 'λ':p='l';break;case 'μ':p='m';break;case 'ν':p='n';break;
      case 'ξ':p='ks';break;case 'π':p='p';break;case 'ρ':p='r';break;
      case 'σ':case 'ς':p='s';break;case 'τ':p='t';break;case 'φ':p='f';break;
      case 'χ':p=front?'ç':'x';break;case 'ψ':p='ps';break; default:p='';
    }
    if(p)segs.push({p,v:0}); i++;
  }
  const out=[];
  for(const s of segs){ const l=out[out.length-1]; if(l&&!s.v&&!l.v&&l.p===s.p)continue; out.push(s); }
  for(let k=0;k<out.length;k++) if(out[k].p==='s'&&out[k+1]&&!out[k+1].v&&VOICEDNEXT.has(out[k+1].p))out[k].p='z';
  let si=out.findIndex(s=>s.s&&s.v);
  const nV=out.filter(s=>s.v).length;
  let str='';
  if(si>=0&&nV>1){
    let start=si;
    const liquids=new Set(['l','r','ʎ','ɲ','ʝ','j']);
    const obstru=new Set(['p','t','k','c','b','d','ɡ','f','v','θ','ð','x','ç','ɣ','ps','ks','ts','dz']);
    if(start>0 && !out[start-1].v && !out[start-1].coda){
      start--; // mandatory onset consonant
      if(start>0 && !out[start-1].v && !out[start-1].coda){
        if(liquids.has(out[start].p) && obstru.has(out[start-1].p)) start--;
      }
    }
    // if no vowel precedes `start`, this is the first syllable -> onset takes all leading consonants
    let hasPrevVowel=false; for(let k=0;k<start;k++) if(out[k].v){hasPrevVowel=true;break;}
    if(!hasPrevVowel) start=0;
    out.forEach((s,idx)=>{if(idx===start)str+='ˈ';str+=s.p;});
  } else str=out.map(s=>s.p).join('');
  return str;
}
module.exports={g2p};
