import { conjugate, findInfinitive, normalizeGreek } from '../../src/data/conjugation/el';

// List all engine-covered lemmas by re-importing the module source is hard;
// instead we accept a list of lemmas on argv and dump their tables.
const lemmas = process.argv.slice(2);
for (const l of lemmas) {
  const t = conjugate(l);
  if (!t) { console.log(`\n### ${l} => NULL (NOT engine-covered)`); continue; }
  console.log(`\n### ${l}`);
  for (const [tense, forms] of Object.entries(t.tenses)) {
    console.log(`  ${tense}: ${forms.join(', ')}`);
  }
}
