/**
 * Apply the 14-card register-pilot rewrites to src/data/hindi/deck.json.
 *
 * The proposed_target values come from docs/hindi-register-full-audit.json
 * for the 10 cards the audit committed to. The 4 Mughal-era cards
 * (मशालची, सूबेदार, राजा...फ़रमान, जागीरदार) are modernised here to
 * teach the same grammar patterns with vocabulary urban Hindi speakers
 * actually use day-to-day (चौकीदार, मैनेजर, बॉस, मालिक).
 *
 * Also updates the English gloss to match the new target sentence.
 */
const fs = require('fs');
const path = require('path');

const DECK = path.resolve(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));

const PILOT = [
  { id: 'hi-0028', target: 'यह मेरी पत्नी मीना है।',
    english: 'This is my wife Meena.' },
  { id: 'hi-0215', target: 'छोटे कारोबार गाँव की अर्थव्यवस्था का आधार हैं।',
    english: 'Small businesses are the foundation of the village economy.' },
  { id: 'hi-0436', target: 'इस स्कूल को १९५० में खोला गया था।',
    english: 'This school was opened in 1950.' },
  { id: 'hi-0483', target: 'कंप्यूटर की गति को मेगाहर्ट्ज़ में मापा जाता है।',
    english: "A computer's speed is measured in megahertz." },
  { id: 'hi-0623', target: 'डेंटिस्ट ने दाँत में भर दिया।',
    english: 'The dentist filled the tooth.' },
  { id: 'hi-0648', target: 'छत की कास्टिंग में कंक्रीट डाली गई।',
    english: 'Concrete was poured into the roof casting.' },
  { id: 'hi-0680', target: 'एनवायरनमेंट की रक्षा हमारी ज़िम्मेदारी है।',
    english: 'Protecting the environment is our responsibility.' },
  { id: 'hi-1810', target: 'टैक्स देना हर आदमी की ज़िम्मेदारी है।',
    english: "Paying tax is everyone's responsibility." },
  // Mughal-era modernizations
  { id: 'hi-2282', target: 'चौकीदार ने बंगले की बत्तियाँ जला दीं।',
    english: 'The watchman turned on the bungalow lights.' },
  { id: 'hi-2284', target: 'मैनेजर ने ऑफिस का काम सँभाला।',
    english: 'The manager handled the office work.' },
  { id: 'hi-2295', target: 'बॉस ने ऑफिस में नया आदेश दिया।',
    english: 'The boss gave a new order in the office.' },
  { id: 'hi-2388', target: 'मालिक ने गाँव वालों को ज़मीन दे दी।',
    english: 'The owner gave land to the villagers.' },
  { id: 'hi-2732', target: 'टेलीफोन का आविष्कार संचार में बहुत बड़ा कदम था।',
    english: 'The invention of the telephone was a huge step in communication.' },
  { id: 'hi-3171', target: 'टॉयलेट कहाँ है?',
    english: 'Where is the toilet?' },
];

const byId = new Map(deck.map(c => [c.id, c]));
let applied = 0;
const before = [];
for (const p of PILOT) {
  const card = byId.get(p.id);
  if (!card) { console.warn(`MISSING: ${p.id}`); continue; }
  before.push({ id: p.id, oldTarget: card.target, oldEnglish: card.english });
  card.target = p.target;
  card.english = p.english;
  applied++;
}

fs.writeFileSync(DECK, JSON.stringify(deck, null, 2) + '\n');
console.log(`Applied ${applied}/${PILOT.length} pilot rewrites`);
console.log('\nDiff summary:');
for (let i = 0; i < before.length; i++) {
  console.log(`  [${before[i].id}]`);
  console.log(`    OLD: ${before[i].oldTarget}`);
  console.log(`         "${before[i].oldEnglish}"`);
  console.log(`    NEW: ${PILOT[i].target}`);
  console.log(`         "${PILOT[i].english}"`);
}
