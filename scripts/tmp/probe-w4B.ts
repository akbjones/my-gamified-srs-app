import { conjugate, findInfinitive, normalizeGreek, stripAccents } from '../../src/data/conjugation/el';

// [surface form as used, candidate lemma]
const probes: [string, string][] = [
  ['εξηγεί','εξηγώ'], ['εξηγήσεις','εξηγώ'],
  ['κόπηκα','κόβομαι'], ['κόπηκε','κόβομαι'], ['κόβεται','κόβομαι'],
  ['δανείστηκα','δανείζομαι'], ['δάνεισε','δανείζω'],
  ['μελετάω','μελετάω'], ['μελετάμε','μελετάω'],
  ['δυσκολεύεται','δυσκολεύομαι'],
  ['παρουσιάζω','παρουσιάζω'], ['ξενυχτάω','ξενυχτάω'],
  ['εγγράφηκα','εγγράφομαι'], ['έπιασε','πιάνω'],
  ['αντέγραψα','αντιγράφω'], ['συγκεντρωθώ','συγκεντρώνομαι'],
  ['παρακολουθώ','παρακολουθώ'], ['διδάσκει','διδάσκω'], ['δίδασκα','διδάσκω'],
  ['άλλαξε','αλλάζω'], ['άλλαξα','αλλάζω'],
  ['βαρέθηκα','βαριέμαι'], ['χάλασε','χαλάω'],
  ['αποσυνδεθώ','αποσυνδέομαι'], ['συνδέθηκα','συνδέομαι'],
  ['μετάνιωσα','μετανιώνω'], ['μπλόκαρα','μπλοκάρω'],
  ['κρέμασε','κρεμάω'], ['έφτιαξε','φτιάχνω'], ['φτιάχνεται','φτιάχνω'],
  ['έβγαλε','βγάζω'], ['έβγαλα','βγάζω'],
  ['παρήγγειλα','παραγγέλνω'], ['ησυχάσω','ησυχάζω'],
  ['μειώσω','μειώνω'], ['κοινοποιείς','κοινοποιώ'], ['κοινοποίησα','κοινοποιώ'],
  ['μετέφρασα','μεταφράζω'], ['μεταφέρω','μεταφέρω'], ['προσθέτω','προσθέτω'],
  ['δουλέψω','δουλεύω'], ['χρέωσαν','χρεώνω'], ['διέρρευσε','διαρρέω'],
  ['φτιάχνεται','φτιάχνομαι'],
];

const produces = (lemma: string, form: string): string[] => {
  const t = conjugate(lemma);
  if (!t) return [];
  const w = stripAccents(normalizeGreek(form));
  const hits: string[] = [];
  for (const [tense, forms] of Object.entries(t.tenses))
    for (const f of forms as string[])
      if (stripAccents(normalizeGreek(f.replace(/^θα /,''))) === w) hits.push(`${tense}:${f}`);
  return hits;
};

for (const [form, lemma] of probes) {
  const fi = findInfinitive(form);
  const conj = conjugate(lemma) ? 'OK' : 'NULL';
  const p = produces(lemma, form);
  const exact = p.length ? p.some(x => normalizeGreek(x.split(':')[1].replace(/^θα /,'')) === normalizeGreek(form)) : false;
  console.log(`${form.padEnd(16)} <- ${lemma.padEnd(16)} conj=${conj} findInf=${fi ?? '-'} prod=${p.length?p.join(' | '):'NONE'} exactAccent=${exact}`);
}
