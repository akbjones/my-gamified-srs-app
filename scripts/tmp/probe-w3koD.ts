import { findInfinitive } from '../../src/data/conjugation/ko';
import { lookupWord } from '../../src/data/dictionary/ko';
for (const w of ['앉아','가르쳐','층','앉다','가르치다','마지막','계속','꿈','별','강','샤워','수건','최고','열한','두','세','시예요','더블','뭐예요','직원','주스','한복','책','미리','벌써','꼭','푹','잠깐','아직','예약','다시','날짜','준비','점심시간','회의실','노란색이에요','중이에요','거예요','보름달']) {
  console.log(w, '|', findInfinitive(w), '|', JSON.stringify(lookupWord(w)));
}
