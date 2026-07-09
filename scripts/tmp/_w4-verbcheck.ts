import { KNOWN_VERBS, haeyo, past, future, conjugate } from '../../src/data/conjugation/ko';
const cand = ['가입하다','개설하다','관리하다','긁다','존경하다','대답하다','따다','떨리다','맡다','부담되다','붙다','뽑다','빠지다','살리다','설명하다','송금하다','승진하다','신고하다','신청하다','아쉬워하다','여쭤보다','옮기다','요청하다','익숙해지다','이체하다','이직하다','입금하다','입사하다','저축하다','정해지다','지원하다','취직하다','칭찬하다','투자하다','퇴사하다','후회하다','환급받다','환전하다','인정받다','적응하다','포기하다','쌓다','쏟다','쌓이다','차다','들어오다','들어가다','협상하다'];
const known = new Set(KNOWN_VERBS);
const newRegs: string[] = [];
const already: string[] = [];
for (const v of cand) {
  if (known.has(v)) { already.push(v); continue; }
  newRegs.push(v);
}
console.log('ALREADY in KNOWN_VERBS ('+already.length+'):', already.join(' '));
console.log('NEW regular verbs ('+newRegs.length+'):');
for (const v of newRegs) {
  console.log('  '+v+' => present '+haeyo(v)+' | past '+past(v)+' | fut '+future(v));
}
// irregular check
console.log('IRREGULAR 부담스럽다: engine(wrong regular)=', haeyo('부담스럽다'), ' want 부담스러워요');
