import { lookupWord } from '../../src/data/dictionary/ru';
import { conjugate, findInfinitive } from '../../src/data/conjugation/ru';
for (const tok of ['написал','смотрит','учит','поёт','находится','сделал','переехали','зовут']) {
  const e = lookupWord(tok) || lookupWord(tok.toLowerCase());
  const lemma = e?.lemma || findInfinitive(tok);
  const t = lemma ? conjugate(lemma) as any : null;
  const forms = new Set<string>();
  for (const arr of Object.values(t?.tenses || {}) as string[][])
    for (const f of arr) for (const w of f.split(/[\s/]+/)) forms.add(w.toLowerCase());
  console.log(`${tok} | entry:${e ? (e.lemma||'no-lemma') : 'MISS'} | lemma:${lemma || 'NONE'} | table:${t?'yes':'no'} | inTable:${forms.has(tok.toLowerCase())}`);
  if (t && !forms.has(tok.toLowerCase())) {
    const past = Object.entries(t.tenses).find(([k]) => k.includes('Прошед'));
    const pres = Object.entries(t.tenses).find(([k]) => k.includes('Настоя'));
    console.log(`   pres: ${(pres?.[1] as string[])?.join(',')}`);
    console.log(`   past: ${(past?.[1] as string[])?.join(',')}`);
  }
}
