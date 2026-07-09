import { lookupWord } from '../../src/data/dictionary/ko';
for (const t of ['만','원','오만','십','퍼센트','개월','한','두','세','번','달','다음','이번','지난','제','저','명','몇','정도','쯤','만큼']) {
  const r = lookupWord(t); console.log(t, '=>', r?('OK '+r.en):'MISSING');
}
