// Hindi dictionary coverage: every word of every deck sentence through the
// real lookup. Run: npx tsx scripts/scan-hi-dict-coverage.ts
import fs from 'fs';
import { lookupWord as lookupHi } from '../src/data/dictionary/hi';

const deck = JSON.parse(fs.readFileSync('src/data/hindi/deck.json', 'utf8'));
const missing = new Map<string, { count: number; example: string }>();
let total = 0, hits = 0;
for (const card of deck) {
  const words = (card.target as string)
    .replace(/[।.,:!?"'()–…-]/g, ' ')
    .split(/\s+/)
    .filter(w => /[ऀ-ॿ]/.test(w) && w.length > 1);
  for (const w of words) {
    total++;
    if (lookupHi(w)) { hits++; continue; }
    const cur = missing.get(w);
    if (cur) cur.count++;
    else missing.set(w, { count: 1, example: card.id });
  }
}
const sorted = [...missing.entries()].sort((a, b) => b[1].count - a[1].count);
console.log(`tokens: ${total}, resolved: ${hits} (${(hits / total * 100).toFixed(1)}%), distinct missing: ${sorted.length}`);
fs.writeFileSync('docs/hi-dict-missing.json', JSON.stringify(
  sorted.map(([w, m]) => ({ word: w, count: m.count, example: m.example })), null, 1));
for (const [w, m] of sorted.slice(0, 25)) console.log(w, m.count, m.example);
