import { conjugate } from '../../src/data/conjugation/ru';
const cases: [string, string, string[]][] = [
  ['стоять', 'present', ['стою', 'стоишь', 'стоит', 'стоим', 'стоите', 'стоят']],
  ['бояться', 'present', ['боюсь', 'боишься', 'боится', 'боимся', 'боитесь', 'боятся']],
  ['танцевать', 'present', ['танцую', 'танцуешь', 'танцует', 'танцуем', 'танцуете', 'танцуют']],
  ['рисовать', 'present', ['рисую', 'рисуешь', 'рисует', 'рисуем', 'рисуете', 'рисуют']],
  ['чувствовать', 'present', ['чувствую', 'чувствуешь', 'чувствует', 'чувствуем', 'чувствуете', 'чувствуют']],
  ['читать', 'present', ['читаю', 'читаешь', 'читает', 'читаем', 'читаете', 'читают']],
  ['говорить', 'present', ['говорю', 'говоришь', 'говорит', 'говорим', 'говорите', 'говорят']],
];
let bad = 0;
for (const [inf, tense, want] of cases) {
  const t = conjugate(inf) as any;
  const got: string[] = t?.tenses?.[Object.keys(t?.tenses || {}).find((k: string) => k.toLowerCase().includes(tense)) || ''] || [];
  const ok = want.every((w, i) => (got[i] || '').includes(w));
  if (!ok) { bad++; console.log(`FAIL ${inf}: got [${got.join(', ')}]`); }
  else console.log(`ok   ${inf}: ${got.slice(0,3).join(', ')}...`);
}
const byt = conjugate('быть') as any;
const pastKey = Object.keys(byt?.tenses || {}).find((k: string) => k.toLowerCase().includes('past') || k.includes('Прошед'));
const past = byt?.tenses?.[pastKey || ''] || [];
console.log('быть past:', past.join(' | '));
if (!past.some((f: string) => f.includes('было'))) { bad++; console.log('FAIL: было missing'); }
console.log(bad === 0 ? 'ALL CORRECT' : `${bad} FAILURES`);
