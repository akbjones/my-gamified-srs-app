const fs = require('fs');
const deckPath = 'src/data/turkish/deck.json';
let cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
const origCount = cards.length;
let removed = 0;
const removedList = [];

const madAdjs = ['clean', 'noisy', 'cowardly', 'smart', 'thick', 'expensive', 'stale', 'free'];

cards = cards.filter(c => {
  const e = c.english;

  // Mad-libs: [subject] [verb] [mad-adj] [a] [noun] [prep] the [place] [time]
  for (const adj of madAdjs) {
    // Pattern: verb + adj + noun phrase
    const verbs = ['wrote', 'read', 'said', 'sewed', 'collected', 'painted', 'cleaned', 'made', 'left'];
    for (const v of verbs) {
      if (e.includes(v + ' ' + adj + ' ')) {
        removedList.push(e);
        removed++;
        return false;
      }
    }
  }

  return true;
});

// Reassign IDs
cards.sort((a, b) => {
  const nA = a.grammarNode || '';
  const nB = b.grammarNode || '';
  if (nA !== nB) return nA.localeCompare(nB);
  return a.english.split(/\s+/).length - b.english.split(/\s+/).length;
});
cards.forEach((c, i) => {
  c.id = 'tr-' + String(i + 1).padStart(4, '0');
});

fs.writeFileSync(deckPath, JSON.stringify(cards, null, 2) + '\n');
console.log('Removed:', removed);
removedList.forEach(e => console.log('  ' + e));
console.log('Cards:', origCount, '->', cards.length);
