import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/tr';
const deck = JSON.parse(readFileSync('src/data/turkish/deck.json', 'utf8'));
const missing = new Map<string, number>();
for (const c of deck) {
  for (const raw of c.target.split(/\s+/)) {
    const tok = raw.replace(/[^\p{L}\p{M}-]/gu, '');
    if (!tok) continue;
    if (!lookupWord(tok) && !lookupWord(tok.toLocaleLowerCase('tr'))) {
      missing.set(tok, (missing.get(tok) || 0) + 1);
    }
  }
}
console.log(JSON.stringify([...missing.keys()], null, 0));
console.log('total unique:', missing.size);
