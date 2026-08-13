// True dictionary coverage for the mum deck: every word of every sentence
// through the real lookup (so lemma links and inflection handling count).
// Run: npx tsx scripts/scan-mum-dict-coverage.ts
import fs from 'fs';
import { lookupWord as lookupEs } from '../src/data/dictionary/es';

const deck = JSON.parse(fs.readFileSync('src/data/mum/deck.json', 'utf8'));
const PROPER = new Set(['brannagh','beni','papylou','magali','véro','twig','scout','pierre','anna','béa','josselin','latour','pulborough','newbury','marescot','storrington','lyon','swonky','bey','papy','ken','antoine','bretaña','sussex','francia','inglaterra','londres','bolivia','georgia','japón','nara','kioto','nagano','airbnb','brexit','gales','swansea','portsmouth','egremont','lassie','dave','henri','gilles','benoit','floppy','alavanille','courtpartout','sautepartout','bea','whatsapp','jaguar','hell','angel','gta','pokemon','pokémon','wild','brooks','raf','glace','biengue','worry','duck','to','not','my','señor']);

const missing = new Map<string, { count: number; example: string }>();
let total = 0, hits = 0;
for (const card of deck) {
  const words = (card.target as string)
    .replace(/[.,:!?¿¡()"«»–…]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^['’]+|['’]+$/g, ''))
    .filter(w => w.length > 1 && !/\d/.test(w));
  for (const w of words) {
    const lw = w.toLowerCase();
    if (PROPER.has(lw)) continue;
    total++;
    if (lookupEs(w) || lookupEs(lw)) { hits++; continue; }
    const cur = missing.get(lw);
    if (cur) cur.count++;
    else missing.set(lw, { count: 1, example: card.id });
  }
}
const sorted = [...missing.entries()].sort((a, b) => b[1].count - a[1].count);
console.log(`tokens checked: ${total}, resolved: ${hits}, distinct missing: ${sorted.length}`);
fs.writeFileSync('docs/mum-deck/dict-missing.json', JSON.stringify(
  sorted.map(([w, m]) => ({ word: w, count: m.count, example: m.example })), null, 1));
for (const [w, m] of sorted.slice(0, 30)) console.log(w, m.count, m.example);
