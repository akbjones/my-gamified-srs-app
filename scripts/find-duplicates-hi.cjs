#!/usr/bin/env node
/**
 * Find near-duplicate clusters in the Hindi deck.
 *
 * Strategy: replace named entities (names, place names, numbers) with placeholders,
 * then group cards by their normalized "skeleton". Skeletons appearing in ≥ 2
 * cards are duplicate clusters.
 */
const fs = require('fs');

const deck = JSON.parse(fs.readFileSync('src/data/hindi/deck.json', 'utf8'));

// Common Hindi first names and place names (extend as needed)
const HINDI_NAMES = new Set([
  'राहुल','रमेश','सुनील','मनोज','नरेश','मोहन','कुणाल','धीरज','कमल','भारत',
  'विकास','रवि','अनिल','आदित्य','रोहित','अमन','दीपक','हरीश','प्रदीप','गोपाल',
  'श्याम','अजय','संजय','प्रशांत','सचिन','गौरव','ललित','सुरेश','उमेश','शरद',
  'अकबर','अमिताभ','नितिन','राजेश','नीरज','तरुण','यश','अरुण','हेमंत','अरविन्द',
  'राम','कृष्ण','अर्जुन','हिमांशु','मनु','अनिकेत',
  'प्रिया','सुनीता','पूजा','नेहा','दिव्या','आशा','कविता','कमला','रश्मि','उषा',
  'सीमा','मीना','राधा','सीता','गीता','पद्मा','रीना','सोनिया','मीरा','अंजलि',
  'श्वेता','ज्योति','रेखा','आरती','मनीषा','रिया','शोभा','ममता','किरण','सरला',
  'जयंती','तारा','चित्रा','लता','सरोज','नीना','सरिता','उमा','दीपा','रत्ना',
  'नंदिनी','सुषमा','सोनम','सोनाली','सोनाक्षी','भारती','सरस्वती','पार्वती','दुर्गा'
]);

const HINDI_PLACES = new Set([
  'दिल्ली','मुंबई','कोलकाता','चेन्नई','बैंगलोर','हैदराबाद','पुणे','अहमदाबाद','जयपुर',
  'चंडीगढ़','लखनऊ','कानपुर','आगरा','वाराणसी','बनारस','गोवा','केरल','उत्तराखंड',
  'गुजरात','पंजाब','हरियाणा','राजस्थान','महाराष्ट्र','कर्नाटक','तमिलनाडु','बिहार',
  'झारखंड','ओडिशा','उड़ीसा','छत्तीसगढ़','उत्तर','दक्षिण','पूर्व','पश्चिम',
  'शिमला','मनाली','नैनीताल','उदयपुर','जोधपुर','मसूरी','दार्जिलिंग','हरिद्वार',
  'ऋषिकेश','अमृतसर','सूरत','नागपुर','भोपाल','ग्वालियर','इंदौर','रांची','पटना',
  'कोची','मैसूर','तिरुपति','अजमेर','अलवर','देहरादून','अमरावती'
]);

// Hindi numbers (words)
const HINDI_NUMBERS = new Set([
  'एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस',
  'ग्यारह','बारह','तेरह','चौदह','पंद्रह','सोलह','सत्रह','अठारह','उन्नीस','बीस',
  'इक्कीस','बाईस','तेईस','चौबीस','पच्चीस','छब्बीस','सत्ताईस','अट्ठाईस','उनतीस','तीस',
  'इकतीस','बत्तीस','तैंतीस','चौंतीस','पैंतीस','छत्तीस','सैंतीस','अड़तीस','उनतालीस','चालीस',
  'पचास','साठ','सत्तर','अस्सी','नब्बे','सौ','हज़ार','लाख','करोड़'
]);

function tokenizeHindi(s) {
  return s.replace(/[।,!?;:।'""''()––…]/g, ' ').split(/\s+/).filter(t => t.length > 0);
}

function skeletonize(target) {
  const tokens = tokenizeHindi(target);
  const skel = tokens.map(t => {
    if (HINDI_NAMES.has(t)) return '[NAME]';
    if (HINDI_PLACES.has(t)) return '[PLACE]';
    if (HINDI_NUMBERS.has(t)) return '[NUM]';
    if (/^[०-९]+$/.test(t)) return '[NUM]';
    if (/^[0-9]+$/.test(t)) return '[NUM]';
    return t;
  });
  return skel.join(' ');
}

const groups = new Map();
for (const card of deck) {
  const skel = skeletonize(card.target);
  if (!groups.has(skel)) groups.set(skel, []);
  groups.get(skel).push(card);
}

// Filter to clusters with ≥ 2 cards AND at least one placeholder (otherwise it's just identical sentences)
const clusters = [];
for (const [skel, cards] of groups) {
  if (cards.length < 2) continue;
  if (!skel.includes('[NAME]') && !skel.includes('[PLACE]') && !skel.includes('[NUM]')) continue;
  clusters.push({ skel, cards });
}
clusters.sort((a, b) => b.cards.length - a.cards.length);

console.log('Found ' + clusters.length + ' near-duplicate clusters in Hindi');
console.log('Total cards in clusters: ' + clusters.reduce((s, c) => s + c.cards.length, 0));
console.log();
console.log('Top 20 clusters by size:');
console.log();

for (const c of clusters.slice(0, 20)) {
  console.log('▸ ' + c.cards.length + 'x – skeleton: ' + c.skel);
  for (const card of c.cards.slice(0, 6)) {
    console.log('    ' + card.id + '  [pri ' + (card.priority || '?') + ']  ' + card.target);
  }
  if (c.cards.length > 6) console.log('    … + ' + (c.cards.length - 6) + ' more');
  console.log();
}

// Save full report
fs.writeFileSync('/tmp/hi-duplicates.json', JSON.stringify({
  totalClusters: clusters.length,
  totalCardsInClusters: clusters.reduce((s, c) => s + c.cards.length, 0),
  clusters: clusters.map(c => ({
    skeleton: c.skel,
    count: c.cards.length,
    cards: c.cards.map(card => ({ id: card.id, priority: card.priority, target: card.target, english: card.english })),
  })),
}, null, 2));
console.log('Saved /tmp/hi-duplicates.json');
