import * as fs from 'fs';
const src = fs.readFileSync('src/data/dictionary/ko.ts','utf8');
// extract keys: lines like  '단어': { ... }
const keys = new Set<string>();
const re = /^\s*'((?:[^'\\]|\\.)*)':\s*\{/gm;
let m;
while ((m = re.exec(src))) keys.add(m[1].replace(/\\'/g,"'"));
// also double-quoted keys
const re2 = /^\s*"((?:[^"\\]|\\.)*)":\s*\{/gm;
while ((m = re2.exec(src))) keys.add(m[1]);
fs.writeFileSync('scripts/tmp/_w4ko-existing-dictkeys.json', JSON.stringify([...keys]));
console.log('existing dict keys:', keys.size);
// check target vocab coverage
const want = ['취업','이력서','자기소개서','면접','면접관','지원','지원자','합격','불합격','채용','경력','경력직','신입','인턴','인턴십','스펙','자격증','연봉','협상','이직','퇴사','입사','부서','팀장','상사','동료','업무','야근','회의','승진','정규직','계약직','근무','출근','퇴근','월급','급여','보너스','성과','복지','휴가','연차','계좌','통장','적금','예금','대출','이자','세금','카드','신용카드','체크카드','이체','송금','가계부','재테크','투자','저축','환율','현금','수수료','잔액','비밀번호','은행','창구','예산','원','만원','퍼센트','이자율','대출금','생활비','월세','보험','연금','주식','펀드','비상금','용돈','지출','수입','소득','절약','통계','계약'];
const missing = want.filter(w=>!keys.has(w));
console.log('MISSING from dict ('+missing.length+'/'+want.length+'):', missing.join(' '));
