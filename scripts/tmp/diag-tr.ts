import { conjugate } from '../../src/data/conjugation/tr';
for (const [tok, lemma] of [['geç','geçmek'], ['ederim','etmek']] as const) {
  const t = conjugate(lemma) as any;
  const forms = t ? (Object.values(t.tenses || {}) as string[][]).flat() : [];
  console.log(tok, '→', lemma, '| inTable:', forms.some(f => f.toLowerCase().split(/[\s/]+/).includes(tok)));
  if (t) console.log('   tenses:', Object.keys(t.tenses || {}).join(', ').slice(0, 120));
}
