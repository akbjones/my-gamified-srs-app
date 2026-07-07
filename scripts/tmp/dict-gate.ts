import { readFileSync, writeFileSync } from 'fs';
import { lookupWord as lookupRu } from '../../src/data/dictionary/ru';
import { lookupWord as lookupTr } from '../../src/data/dictionary/tr';

const batch = JSON.parse(readFileSync('/tmp/quality-batch-full.json', 'utf8'));
const lookups: Record<string, (w: string) => unknown> = { russian: lookupRu, turkish: lookupTr };

for (const [lang, fixes] of Object.entries(batch) as [string, any[]][]) {
  const lookup = lookups[lang];
  const missing = new Map<string, number>();
  let total = 0, hit = 0;
  for (const p of fixes) {
    const toks = p.target.replace(/[^\p{L}\s-]/gu, ' ').split(/\s+/).filter(Boolean);
    for (const t of toks) {
      total++;
      if (lookup(t) || lookup(t.toLowerCase())) hit++;
      else missing.set(t, (missing.get(t) || 0) + 1);
    }
  }
  console.log(`${lang}: ${hit}/${total} tokens resolve (${(hit*100/total).toFixed(1)}%)`);
  const top = [...missing.entries()].sort((a,b)=>b[1]-a[1]);
  for (const [t,n] of top.slice(0, 20)) console.log(`   ${String(n).padStart(3)}  ${t}`);
  writeFileSync(`/tmp/dict-missing-${lang}.json`, JSON.stringify(top.map(([t])=>t)));
}
