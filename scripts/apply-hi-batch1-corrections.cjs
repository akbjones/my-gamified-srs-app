/**
 * Corrections to batch 1 after native-speaker review:
 *
 * - hi-0157: I over-modernized — "fair decision" lost the specific meaning of
 *   "justice / citizen's right". Restore न्याय + नागरिक; just clean phrasing.
 * - hi-1558: अंडरग्राउंड + सुरंग is redundant (a tunnel is already underground).
 *   And दौड़ती is too dramatic; neutral चलती.
 * - hi-2417: कमंडल is the actual cultural noun for an ascetic's water vessel.
 *   Don't replace with "water bottle" — just fix word order.
 *
 * LESSON for future batches: register fixes are vocabulary/construction changes,
 * NOT meaning changes. Keep culturally-specific nouns when they're the
 * accurate word; clean up surrounding syntax instead.
 */
const fs = require('fs');
const path = require('path');

const DECK = path.resolve(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));

const CORRECTIONS = [
  { id: 'hi-0157', target: 'हर नागरिक को न्याय पाने का अधिकार है।',
    english: "Every citizen has the right to obtain justice." },
  { id: 'hi-1558', target: 'सुरंग में ट्रेन चलती है।',
    english: 'The train runs through the tunnel.' },
  { id: 'hi-2417', target: 'साधु कमंडल में पानी लेकर चले।',
    english: 'The sadhu walked carrying water in his kamandal.' },
];

const byId = new Map(deck.map(c => [c.id, c]));
let applied = 0;
for (const p of CORRECTIONS) {
  const card = byId.get(p.id);
  if (!card) { console.warn(`MISSING: ${p.id}`); continue; }
  console.log(`[${p.id}]`);
  console.log(`  was: ${card.target}`);
  console.log(`       "${card.english}"`);
  console.log(`  now: ${p.target}`);
  console.log(`       "${p.english}"`);
  card.target = p.target;
  card.english = p.english;
  applied++;
}
fs.writeFileSync(DECK, JSON.stringify(deck, null, 2) + '\n');
console.log(`\nApplied ${applied}/${CORRECTIONS.length}`);
