import { lookupWord } from '../../src/data/dictionary/ko';
for (const t of ['이다','이시다','예요','이에요','뿌듯해요','결제해요','알렸어요','줄일','실수해도','들어왔어요','들어가는']) {
  const r = lookupWord(t); console.log(JSON.stringify(t), '=>', r?('OK: '+r.en+(r.lemma?' [lemma '+r.lemma+']':'')):'MISSING');
}
