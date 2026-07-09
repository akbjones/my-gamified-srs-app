import { conjugate, findInfinitive } from '../../src/data/conjugation/el';
for (const v of ['ταξιδεύω','προσγειώνομαι','καθυστερώ','χάνω','περιμένω','συμφωνώ','διαφωνώ','θεωρώ','νοσταλγώ','εξαρτάται']) {
  const t = conjugate(v);
  console.log(v, t ? 'OK ['+ (t.tenses['Αόριστος (Past)']?.[0] ?? '—') +']' : 'NULL');
}
console.log('find προσγειώθηκε ->', findInfinitive('προσγειώθηκε'));
