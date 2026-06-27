/**
 * Batch 1 — apply 28 rating ≤3 register rewrites to src/data/hindi/deck.json.
 *
 * These are the remaining high-priority cards from docs/hindi-register-full-audit.json
 * after the 14-card pilot was shipped. Each rewrite was either taken from the
 * audit's proposed_target field (13 cards) or authored here (15 cards) following
 * docs/hindi-register-policy.md. English glosses updated to match.
 */
const fs = require('fs');
const path = require('path');

const DECK = path.resolve(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));

const BATCH = [
  { id: 'hi-0157', target: 'हर किसी को सही फ़ैसला पाने का हक है।',
    english: 'Everyone has the right to a fair decision.' },
  { id: 'hi-0522', target: 'नमस्ते! आज का दिन अच्छा रहे।',
    english: 'Hello! Hope your day goes well.' },
  { id: 'hi-0529', target: 'नमस्ते, आज मौसम बहुत अच्छा है।',
    english: 'Hi, the weather is really nice today.' },
  { id: 'hi-0542', target: 'यह नई सड़क चालीस किलोमीटर की है।',
    english: 'This new road is forty kilometers long.' },
  { id: 'hi-0649', target: 'लिखते समय वाक्य का सही क्रम रखो।',
    english: 'Keep the correct word order when writing.' },
  { id: 'hi-0657', target: 'राजस्थान में लोग ऊँटनी का दूध पीते हैं।',
    english: "In Rajasthan, people drink camel's milk." },
  { id: 'hi-0682', target: 'नौटंकी एक तरह का लोक नाटक है।',
    english: 'Nautanki is a kind of folk drama.' },
  { id: 'hi-0691', target: 'खंभे पर की गई नक्काशी बहुत बारीक है।',
    english: 'The carving on the pillar is very intricate.' },
  { id: 'hi-0693', target: 'फॉसिल से पुराने जानवरों के बारे में पता चलता है।',
    english: 'Fossils tell us about ancient animals.' },
  { id: 'hi-0907', target: 'कमांडर ने सैनिकों को हिम्मत दी।',
    english: 'The commander encouraged the soldiers.' },
  { id: 'hi-0909', target: 'दूसरों की मदद करने से बड़ा कोई धर्म नहीं।',
    english: 'There is no greater virtue than helping others.' },
  { id: 'hi-1063', target: 'सरकारी योजनाओं का मूल्यांकन सही तरीके से होना चाहिए।',
    english: 'Government schemes should be evaluated fairly.' },
  { id: 'hi-1066', target: 'बिबलियोग्राफी में सभी कोट किए गए स्रोतों की जानकारी होनी चाहिए।',
    english: 'The bibliography should list all cited sources.' },
  { id: 'hi-1100', target: 'मुझे अपने देश की बहुत याद आती है।',
    english: 'I miss my country a lot.' },
  { id: 'hi-1147', target: 'नाशुक्र छात्र ने टीचर की बेइज़्ज़ती की।',
    english: 'The ungrateful student insulted the teacher.' },
  { id: 'hi-1184', target: 'आकाश से गिरा तारा हवा में जलकर टूट जाता है।',
    english: 'A meteor burns up and breaks apart in the sky.' },
  { id: 'hi-1258', target: 'शाम को गाँव शांत हो जाता है।',
    english: 'The village gets quiet in the evening.' },
  { id: 'hi-1373', target: 'हवाई जहाज़ ट्रेन से तेज़ चलता है।',
    english: 'An airplane goes faster than a train.' },
  { id: 'hi-1543', target: 'पिताजी हर वीकेंड हमें पार्क ले जाते थे।',
    english: 'Father used to take us to the park every weekend.' },
  { id: 'hi-1558', target: 'अंडरग्राउंड सुरंग में ट्रेन दौड़ती है।',
    english: 'The train runs through the underground tunnel.' },
  { id: 'hi-1726', target: 'यह जगह टूरिस्ट के लिए बहुत अच्छी है।',
    english: 'This place is very good for tourists.' },
  { id: 'hi-2230', target: 'इस रास्ते पर भारी गाड़ियों को जाने से मना है।',
    english: 'Heavy vehicles are not allowed on this road.' },
  { id: 'hi-2417', target: 'साधु पानी की बोतल लेकर चले।',
    english: 'The sadhu walked carrying a water bottle.' },
  { id: 'hi-2425', target: 'लोग रोज़ अख़बार की हेडलाइन पढ़ते हैं।',
    english: 'People read the newspaper headlines every day.' },
  { id: 'hi-2437', target: 'हालाँकि वह बीमार था, फिर भी उसने काम पूरा कर दिया।',
    english: 'Although he was sick, he still finished the work.' },
  { id: 'hi-2479', target: 'हालाँकि ज़मीन बंजर थी, फिर भी किसान ने बीज बोया।',
    english: 'Although the land was barren, the farmer still sowed seeds.' },
  { id: 'hi-2496', target: 'पानी वाले ने बाल्टी से पानी छिड़का।',
    english: 'The water carrier sprinkled water from a bucket.' },
  { id: 'hi-2534', target: 'ऋषि ने जंगल में बहुत कठिन तपस्या की।',
    english: 'The sage did intense meditation in the forest.' },
];

const byId = new Map(deck.map(c => [c.id, c]));
let applied = 0;
const diffs = [];
for (const p of BATCH) {
  const card = byId.get(p.id);
  if (!card) { console.warn(`MISSING: ${p.id}`); continue; }
  diffs.push({ id: p.id, oldT: card.target, oldE: card.english, newT: p.target, newE: p.english });
  card.target = p.target;
  card.english = p.english;
  applied++;
}
fs.writeFileSync(DECK, JSON.stringify(deck, null, 2) + '\n');
console.log(`Applied ${applied}/${BATCH.length}`);
for (const d of diffs) {
  console.log(`\n[${d.id}]`);
  console.log(`  OLD: ${d.oldT}`);
  console.log(`       "${d.oldE}"`);
  console.log(`  NEW: ${d.newT}`);
  console.log(`       "${d.newE}"`);
}
