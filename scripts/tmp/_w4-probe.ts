import { conjugate, haeyo, past, future, findInfinitive } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';

const verbs = ['지원하다','합격하다','붙다','떨어지다','뽑다','뽑히다','내다','쓰다','받다','준비하다',
  '옮기다','바꾸다','넣다','찾다','모으다','갚다','빌리다','벌다','아끼다','들다','오르다','내리다',
  '되다','시작하다','끝나다','맡다','맡기다','내리다','계시다','드리다','여쭤보다','말씀하다','챙기다'];
for (const v of verbs) {
  const h = haeyo(v);
  const p = past(v);
  const f = future(v);
  console.log(v, '=>', 'present:', h, '| past:', p, '| future:', f, '| findInf(present):', h?findInfinitive(h):null);
}
console.log('--- lookup samples ---');
for (const t of ['월급을','회사에서','면접을','붙었어요','떨어졌어요','받았어요','냈어요','모아요','저축해요']) {
  console.log(t, '=>', JSON.stringify(lookupWord(t)));
}
