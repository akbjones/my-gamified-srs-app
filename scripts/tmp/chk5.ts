import { lookupWord } from '../../src/data/dictionary/el';
import { conjugate } from '../../src/data/conjugation/el';
for (const w of ['φυσάω','λάμπω','μαζεύω','κοκκινίζω','ακυρώνω','βάζω','απλώνω','κάθομαι','πηγαίνω']) {
  const l=lookupWord(w);
  console.log(w.padEnd(12), 'appDict:', l?('EN='+l.en):'ABSENT', '| conj?', conjugate(w)?'yes':'no');
}
// does conjugate(απλώνω) produce απλώστε? does conjugate(βάζω) produce βάλε?
const ap=conjugate('απλώνω')!; console.log('απλώνω IMP:', ap.tenses['Προστακτική (Imperative)']);
const bz=conjugate('βάζω')!; console.log('βάζω IMP:', bz.tenses['Προστακτική (Imperative)']||'(none)');
