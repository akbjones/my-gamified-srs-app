import { haeyo, past, future } from '../../src/data/conjugation/ko';
import * as fs from 'fs';
const verbs = JSON.parse(fs.readFileSync('/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones/scripts/tmp/wave4-ko-verbs-C.json','utf8'));
console.log('== plain-string verbs: engine haeyo / past / future ==');
for (const v of verbs) {
  if (typeof v === 'string') console.log(`${v}  ->  ${haeyo(v)} | ${past(v)} | ${future(v)}`);
}
console.log('\n== irregular objects (my haeyo vs engine haeyo) ==');
for (const v of verbs) {
  if (typeof v !== 'string') {
    const eng = haeyo(v.dict);
    const flag = eng === v.haeyo ? 'ENGINE-MATCHES' : (eng ? `ENGINE-DIFFERS(${eng})` : 'engine-null(needs IRREGULARS entry)');
    console.log(`${v.dict} -> mine:${v.haeyo}  [${flag}]`);
  }
}
