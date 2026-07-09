import { conjugate, findInfinitive } from '../../src/data/conjugation/ko';
for (const v of ['내다','받다','모으다','되다','합격하다','넣다','오르다','다니다','나가다','벌다','뽑다','지원하다','맡다']) {
  const t = conjugate(v);
  if (!t) { console.log(v,'NULL'); continue; }
  console.log('=== '+v+' ===');
  for (const [k,forms] of Object.entries(t.tenses)) console.log('  '+k+': '+forms.join(' / '));
}
// verify known-ness of some verbs
for (const v of ['나가다','다니다','벌다','뽑다','붙다','오르다','내다','넣다','모으다','맡기다']) {
  const t = conjugate(v);
  console.log('findInf present', v, '->', findInfinitive(t!.tenses['해요체 (Polite present)'][0]));
}
