#!/usr/bin/env node
/**
 * Greetings register fix — अलविदा + बहुमूल्य sweep.
 *
 * - अलविदा implies finality ("farewell"); everyday goodbyes are बाय /
 *   चलता हूँ / फिर मिलेंगे. Both अलविदा cards fixed.
 * - बहुमूल्य ("valuable") in the thank-you-for-your-time cards is stiff
 *   corporate register; dropped, धन्यवाद itself stays (correct polite use).
 * - hi-3224/3225 (धन्यवाद survival cards) intentionally kept.
 * - New card hi-3280 शुक्रिया added so the deck reflects the warmer
 *   everyday register alongside formal धन्यवाद.
 */
const fs = require('fs');
const path = require('path');

const DECK = path.resolve(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));

const REWRITES = [
  { id: 'hi-3228', target: 'बाय!', english: 'Bye!' },
  { id: 'hi-2320', target: 'बाय दोस्तों, अगली बार ज़रूर मिलेंगे।',
    english: 'Bye friends, we will definitely meet next time.' },
  { id: 'hi-2730', target: 'मनीष जी, समय देने के लिए धन्यवाद।',
    english: 'Manish ji, thank you for giving your time.' },
  { id: 'hi-2731', target: 'कविता जी, समय देने के लिए धन्यवाद।',
    english: 'Kavita ji, thank you for giving your time.' },
];

const NEW_CARDS = [
  { id: 'hi-3280', target: 'शुक्रिया!', english: 'Thanks!',
    audio: 'hi-hi-3280.mp3', tags: ['general'], grammarNode: 'node-01', priority: 4 },
];

const byId = new Map(deck.map(c => [c.id, c]));
let applied = 0;
for (const p of REWRITES) {
  const card = byId.get(p.id);
  if (!card) { console.warn(`MISSING: ${p.id}`); continue; }
  console.log(`[${p.id}]`);
  console.log(`  was: ${card.target}`);
  console.log(`  now: ${p.target}`);
  card.target = p.target;
  card.english = p.english;
  applied++;
}
for (const c of NEW_CARDS) {
  if (byId.has(c.id)) { console.warn(`EXISTS, skipping: ${c.id}`); continue; }
  deck.push(c);
  console.log(`[+${c.id}] ${c.target} | ${c.english}`);
  applied++;
}
fs.writeFileSync(DECK, JSON.stringify(deck, null, 2) + '\n');
console.log(`\nApplied ${applied}/${REWRITES.length + NEW_CARDS.length}`);
