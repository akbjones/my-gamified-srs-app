import { conjugate } from '../../src/data/conjugation/tr';
const cases: [string, string[]][] = [
  ['etmek',  ['ederim', 'eder', 'ederler', 'ettiler', 'edecekler']],
  ['gitmek', ['giderim', 'gider', 'giderler', 'gittiler']],
  ['gelmek', ['gelirler', 'geldiler', 'gelmişler', 'gelecekler', 'gelseler', 'gelmezler', 'gelmediler']],
  ['yapmak', ['yaparlar', 'yaptılar', 'yapmışlar', 'yapacaklar', 'yapsalar', 'yapmazlar']],
];
let bad = 0;
for (const [inf, expected] of cases) {
  const t = conjugate(inf) as any;
  const forms = new Set((Object.values(t.tenses) as string[][]).flat().flatMap(f => f.toLowerCase().split(/[\s/]+/)));
  for (const e of expected) {
    const ok = forms.has(e);
    if (!ok) { bad++; console.log(`  MISSING ${inf}: ${e}`); }
  }
  console.log(`${inf}: ${expected.filter(e => forms.has(e)).length}/${expected.length} expected forms present`);
}
console.log(bad === 0 ? 'ALL CORRECT' : `${bad} still wrong`);
