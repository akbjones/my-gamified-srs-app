import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo } from '../../src/data/conjugation/ko';
const tests = ['좋아하는','사귀는','결혼하는','보는','만난','좋은','예쁜','슬퍼해요','부러워해요','유명한','신나는','좋아하는','재미있는','다니는','친한','같이','너무','정말','드라마','콘서트','전시회'];
for (const t of tests) {
  const lw = lookupWord(t); const fi = findInfinitive(t.replace(/[^가-힣]/g,''));
  console.log(t, '| lookupWord:', lw? 'Y':'-', '| findInf:', fi ?? '-');
}
console.log('haeyo 슬퍼하다 ->', haeyo('슬퍼하다'));
console.log('haeyo 부러워하다 ->', haeyo('부러워하다'));
