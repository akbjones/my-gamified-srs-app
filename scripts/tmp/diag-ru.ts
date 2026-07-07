import { lookupWord } from '../../src/data/dictionary/ru';
import { conjugate, findInfinitive } from '../../src/data/conjugation/ru';
for (const tok of ['было', 'была', 'стоит', 'танцует']) {
  const e = lookupWord(tok);
  const lemma = e?.lemma || findInfinitive(tok);
  const table = lemma ? conjugate(lemma) : null;
  const forms = table ? Object.values((table as any).tenses || {}).flat() : [];
  console.log(tok, '| entry.lemma:', e?.lemma, '| resolved:', lemma,
    '| table:', !!table, '| formInTable:', (forms as string[]).some(f => f.toLowerCase().split(/\s+/).includes(tok)));
  if (table && !((forms as string[]).some(f => f.toLowerCase().split(/\s+/).includes(tok)))) {
    console.log('   sample forms:', (forms as string[]).slice(0, 8).join(' / '));
  }
}
