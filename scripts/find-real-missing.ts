/**
 * For each language, use the REAL lookupWord function (same as the app uses)
 * to find ALL unique missing tokens across the entire deck.
 * Saves to scripts/missing-words-real.json for downstream AI generation.
 */
import * as fs from 'fs';
import { lookupWord as lookupEs } from '../src/data/dictionary/es';
import { lookupWord as lookupFr } from '../src/data/dictionary/fr';
import { lookupWord as lookupIt } from '../src/data/dictionary/it';
import { lookupWord as lookupPt } from '../src/data/dictionary/pt';
import { lookupWord as lookupDe } from '../src/data/dictionary/de';
import { lookupWord as lookupNl } from '../src/data/dictionary/nl';
import { lookupWord as lookupSv } from '../src/data/dictionary/sv';
import { lookupWord as lookupCy } from '../src/data/dictionary/cy';
import { lookupWord as lookupHi } from '../src/data/dictionary/hi';
import { lookupWord as lookupTr } from '../src/data/dictionary/tr';
import { lookupWord as lookupRu } from '../src/data/dictionary/ru';

const CONFIGS = [
  { code: 'es', deck: 'src/data/spanish/deck.json',    lookup: lookupEs },
  { code: 'fr', deck: 'src/data/french/deck.json',     lookup: lookupFr },
  { code: 'it', deck: 'src/data/italian/deck.json',    lookup: lookupIt },
  { code: 'pt', deck: 'src/data/portuguese/deck.json', lookup: lookupPt },
  { code: 'de', deck: 'src/data/german/deck.json',     lookup: lookupDe },
  { code: 'nl', deck: 'src/data/dutch/deck.json',      lookup: lookupNl },
  { code: 'sv', deck: 'src/data/swedish/deck.json',    lookup: lookupSv },
  { code: 'cy', deck: 'src/data/welsh/deck.json',      lookup: lookupCy },
  { code: 'hi', deck: 'src/data/hindi/deck.json',      lookup: lookupHi },
  { code: 'tr', deck: 'src/data/turkish/deck.json',    lookup: lookupTr },
  { code: 'ru', deck: 'src/data/russian/deck.json',    lookup: lookupRu },
];

function tokenize(sentence: string): string[] {
  return sentence.split(/[\s।,!?;:""''()—–…¿¡«»]+/).filter(w => w && w.length > 0);
}

const result: Record<string, Array<{ word: string; count: number; cards: string[] }>> = {};

for (const config of CONFIGS) {
  const deck = JSON.parse(fs.readFileSync(config.deck, 'utf8'));
  const missingMap = new Map<string, { count: number; cards: Set<string> }>();
  let total = 0, hits = 0;
  for (const card of deck) {
    if (!card.target) continue;
    const tokens = tokenize(card.target);
    for (const t of tokens) {
      if (t.length < 2 || /^\d+$/.test(t)) continue;
      total++;
      const entry = config.lookup(t);
      if (entry) { hits++; continue; }
      // Strip trailing punctuation
      const stripped = t.replace(/[.,;:!?'"]+$/, '');
      if (stripped !== t && config.lookup(stripped)) { hits++; continue; }
      const key = stripped.toLowerCase();
      if (!missingMap.has(key)) missingMap.set(key, { count: 0, cards: new Set() });
      const m = missingMap.get(key)!;
      m.count++;
      if (m.cards.size < 5) m.cards.add(card.id);
    }
  }
  const sorted = [...missingMap.entries()]
    .map(([word, v]) => ({ word, count: v.count, cards: [...v.cards] }))
    .sort((a, b) => b.count - a.count);
  result[config.code] = sorted;
  console.log(`${config.code}: ${missingMap.size} unique missing (${total - hits}/${total} = ${((total - hits) / total * 100).toFixed(2)}% misses)`);
}

fs.writeFileSync('scripts/missing-words-real.json', JSON.stringify(result, null, 2));
console.log('\nSaved: scripts/missing-words-real.json');
const grand = Object.values(result).reduce((s, a) => s + a.length, 0);
console.log(`Grand total unique missing: ${grand}`);
