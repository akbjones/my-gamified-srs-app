import { conjugate } from '../../src/data/conjugation/tr';
const t = conjugate('etmek') as any;
console.log('Aorist row:', (t.tenses['Geniş Zaman (Aorist)'] || []).join(' / '));
console.log('geç lemma? add lemma to dict entry. And check geçmek imperative present:');
const g = conjugate('geçmek') as any;
for (const [k, v] of Object.entries(g.tenses)) {
  if ((v as string[]).some(f => f.toLowerCase().split(/[\s/]+/).includes('geç'))) console.log('geç found in:', k);
}
