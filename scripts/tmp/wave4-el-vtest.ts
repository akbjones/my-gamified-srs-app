/** Verb tester: print full tables for lemmas passed as argv. */
import { conjugate } from '../../src/data/conjugation/el';

for (const lemma of process.argv.slice(2)) {
  const t = conjugate(lemma);
  if (!t) { console.log(`\n### ${lemma}  --> NULL (no table)`); continue; }
  console.log(`\n### ${lemma}`);
  for (const [tense, forms] of Object.entries(t.tenses)) {
    console.log(`  ${tense}: ${forms.join(' | ')}`);
  }
}
