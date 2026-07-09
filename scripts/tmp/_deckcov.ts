import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive } from '../../src/data/conjugation/ko';
import * as fs from 'fs';
const deck = JSON.parse(fs.readFileSync('/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones/src/data/korean/deck.json','utf8'));
function covered(tok:string){ const w=tok.replace(/[^가-힣]/g,''); if(!w) return true; if(lookupWord(tok))return true; if(lookupWord(w))return true; if(findInfinitive(w))return true; return false; }
const unc=new Map<string,number>(); let tot=0, unctot=0;
for(const c of deck){ for(const raw of String(c.target).split(/\s+/).filter(Boolean)){ const w=raw.replace(/[^가-힣]/g,''); if(!w)continue; tot++; if(!covered(raw)){ unctot++; unc.set(w,(unc.get(w)||0)+1);} } }
console.log('total hangul tokens',tot,'uncovered occurrences',unctot,'unique uncovered',unc.size, 'coverage%', (100*(tot-unctot)/tot).toFixed(1));
const top=[...unc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,40);
console.log('TOP UNCOVERED:'); for(const [w,n] of top) console.log(' ',w,n);
