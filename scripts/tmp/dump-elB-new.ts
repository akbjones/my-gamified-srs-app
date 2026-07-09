import { conjugate } from '../../src/data/conjugation/el';
const verbs = ['στρώνω','φωτίζω','πλημμυρίζω','μαυρίζω','ρίχνω','ανεμίζω','ανθίζω','μικραίνω','γλυκαίνω','δυναμώνω','επιτρέπω','ταιριάζω','συμβολίζω','ζυμώνω','λύνω','σπάζω','σουβλίζω','μοιράζω','κρύβω','εύχομαι','κρεμάω','βουτάω','πιάνω','διασκεδάζω','νηστεύω','καίω','βασιλεύω'];
for (const v of verbs) {
  const t = conjugate(v);
  if (!t) { console.log(v, '=> NULL'); continue; }
  const g = (n:string)=> (t.tenses[n]||[]).slice(0,3).join(', ');
  console.log(`${v}  P[${g('Ενεστώτας (Present)')}] I[${g('Παρατατικός (Imperfect)')}] A[${g('Αόριστος (Past)')}] F[${g('Μέλλοντας (Future)')}] IMP[${(t.tenses['Προστακτική (Imperative)']||[]).join('/')}]`);
}
