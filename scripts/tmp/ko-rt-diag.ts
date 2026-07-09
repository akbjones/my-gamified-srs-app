import deck from '../../src/data/korean/deck.json';
import { lookupWord } from '../../src/data/dictionary/ko';
import { conjugate, findInfinitive } from '../../src/data/conjugation/ko';
// formMatches from registry hangul descriptor
const fm = (token:string, form:string) =>
  token === form || (form.length >= 2 && token.endsWith(form)) ||
  (form.includes(' ') && form.split(' ').some(p => p === token || (p.length>=2 && token.endsWith(p))));
const fails: Record<string, number> = {};
let verbs=0, ok=0;
for (const c of deck as any[]) {
  for (const raw of (c.target as string).split(/\s+/)) {
    const tok = raw.replace(/[^가-힣]/g,'');
    if (!tok) continue;
    const e = lookupWord(tok);
    if (!e || e.pos !== 'v') continue;
    verbs++;
    const lemma = (e as any).lemma || findInfinitive(tok);
    const t = lemma ? conjugate(lemma) : null;
    if (!t) { const k='NO-TABLE'; fails[k]=(fails[k]||0)+1; continue; }
    const forms = new Set<string>();
    for (const arr of Object.values(t.tenses)) for (const f of arr) { forms.add(f); for (const w of f.split(/[\s/]+/)) forms.add(w); }
    const matched = tok === lemma || [...forms].some(f => fm(tok, f));
    if (matched) ok++;
    else {
      // bucket by trailing 2-3 chars
      const suf = tok.length>=3 ? tok.slice(-3) : tok;
      fails[suf]=(fails[suf]||0)+1;
    }
  }
}
console.log('verbs',verbs,'ok',ok,'fail',verbs-ok,'pct',(ok*100/verbs).toFixed(2));
console.log('top failing suffixes:');
Object.entries(fails).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([k,v])=>console.log('  ',k,v));
