import { lookupWord } from '../../src/data/dictionary/ko';
for (const t of ['시간이나','시간','세','걸렸어요','이나','돈으로','돈보다','조금씩','자신','인터넷']) {
  const r = lookupWord(t); console.log(t, '=>', r?('OK: '+r.en):'MISSING');
}
