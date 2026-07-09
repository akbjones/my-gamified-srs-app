import { haeyo, past, future, findInfinitive, KNOWN_VERBS } from '../../src/data/conjugation/ko';
const cands = ['기쁘다','슬프다','무섭다','부럽다','긴장되다','걱정되다','신나다','놀라다','속상하다','답답하다','창피하다','설레다','심심하다','우울하다','외롭다','즐겁다','그립다','아쉽다','부끄럽다','놀랍다','행복하다','지루하다','나다','괜찮다','맞다','그렇다','같다','싶다','생각하다','축하하다','성묘하다','세다','받다','드리다','축하드리다','감사하다','미역국','끓이다','만들다','입다','빚다','절하다','모이다','차리다','기다리다','걱정하다','이해하다','동의하다','추천하다','긴장하다','안심하다','감동하다','후회하다','기대하다','웃다','울다','떨리다','풀리다'];
for (const v of cands) {
  const known = KNOWN_VERBS.includes(v);
  console.log(v, '| known:', known, '| haeyo:', haeyo(v), '| past:', past(v), '| fut:', future(v));
}
// probe some future-stem / connective resolutions
for (const w of ['올','갈','먹을','좋을','비쌀','늦을','어려울','맛있을','재미있을','있을','없을','같을','걸릴','올까요','같아요','맞아요','그래요','와서','때문에','계세요','드세요','거예요']) {
  console.log('resolve', w, '→', findInfinitive(w));
}
