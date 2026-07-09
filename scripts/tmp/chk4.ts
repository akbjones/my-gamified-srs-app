import { findInfinitive, conjugate } from '../../src/data/conjugation/el';
import { lookupWord } from '../../src/data/dictionary/el';
for (const w of ['φυσάει','λάμπει','μαζεύουμε','κοκκίνισαν','ακυρώσαμε','κρατάνε','αγαπάνε','φοράνε','βάλε','απλώστε','κάτσε']) {
  console.log(w, '| findInf:', findInfinitive(w), '| lookup:', lookupWord(w)?('yes lemma='+(lookupWord(w) as any).lemma):'null');
}
