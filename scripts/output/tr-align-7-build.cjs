const fs = require('fs');
const data = require('./tr-align-7-data.json');
const alignments = {};

function add(word, en, cardId) {
  word = word.toLowerCase().replace(/[.,!?;:\u201C\u201D\u201E\u201F\u00AB\u00BB()\u2013\u2014\u2026""]/g, '').trim();
  if (!word) return;
  if (!alignments[word]) alignments[word] = [];
  alignments[word].push({ en, card: cardId });
}

for (const [cardId, words] of data) {
  for (const [word, meaning] of words) {
    add(word, meaning, cardId);
  }
}

const sorted = {};
for (const key of Object.keys(alignments).sort((a, b) => a.localeCompare(b, 'tr'))) {
  sorted[key] = alignments[key];
}

fs.writeFileSync(
  __dirname + '/tr-alignments-7.json',
  JSON.stringify({ alignments: sorted }, null, 2),
  'utf8'
);

console.log('Done. ' + Object.keys(sorted).length + ' unique words, ' + data.length + ' cards processed.');
