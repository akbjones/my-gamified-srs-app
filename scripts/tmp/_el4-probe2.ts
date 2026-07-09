import { conjugate } from '../../src/data/conjugation/el';
for (const v of ['κλέβω']) {
  const t = conjugate(v)!;
  for (const [k,f] of Object.entries(t.tenses)) console.log(v,k,f.join(' '));
}
