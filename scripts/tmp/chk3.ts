import { conjugate } from '../../src/data/conjugation/el';
for (const v of ['ιδρώνω','κρυώνω','χαίρομαι']) {
  const t=conjugate(v)!; const g=(n:string)=>(t.tenses[n]||[]).slice(0,3).join(', ');
  console.log(v,'P['+g('Ενεστώτας (Present)')+'] A['+g('Αόριστος (Past)')+']');
}
