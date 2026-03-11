const deck = require('../src/data/spanish/deck.json');

// Cards missing audio
const noAudio = deck.filter(c => c.audio === undefined || c.audio === null || c.audio === '');
console.log('Cards missing audio (' + noAudio.length + '):');
if (noAudio.length > 0) {
  console.log('  ID range:', Math.min(...noAudio.map(c=>c.id)), '-', Math.max(...noAudio.map(c=>c.id)));
  console.log('  Nodes:', [...new Set(noAudio.map(c=>c.grammarNode))].sort().join(', '));
  console.log('  Samples:');
  noAudio.slice(0, 5).forEach(c => console.log('    id=' + c.id + ': ' + c.target.slice(0, 60)));
}

// Too long
const long = deck.filter(c => c.target.split(/\s+/).length > 14);
console.log('\nToo long (' + long.length + '):');
long.forEach(c => console.log('  id=' + c.id + ' (' + c.target.split(/\s+/).length + 'w): ' + c.target));

// Single-tag breakdown by node
console.log('\nSingle-tag cards by node:');
const nodes = [...new Set(deck.map(c => c.grammarNode))].sort();
for (const n of nodes) {
  const nodeCards = deck.filter(c => c.grammarNode === n);
  const single = nodeCards.filter(c => c.tags.length === 1);
  if (single.length > 0) {
    console.log('  ' + n + ': ' + single.length + '/' + nodeCards.length + ' (' + Math.round(single.length/nodeCards.length*100) + '%)');
  }
}

// Node distribution with proposed balanced targets
console.log('\n=== Spanish Node Balance Analysis ===');
const balanced = {
  'node-01':400,'node-02':400,'node-03':400,'node-04':400,'node-05':300,
  'node-06':400,'node-07':400,'node-08':300,'node-09':250,'node-10':400,
  'node-11':380,'node-12':300,'node-13':300,'node-14':400,'node-15':380,
  'node-16':280,'node-17':230,'node-18':220,'node-19':220,'node-20':120,
  'node-21':90,'node-22':95,'node-23':80,'node-24':80,'node-25':75,'node-26':65,
};

let totalOver = 0;
let totalUnder = 0;
for (const n of nodes) {
  const cur = deck.filter(c => c.grammarNode === n).length;
  const target = balanced[n] || cur;
  const diff = cur - target;
  if (diff > 50) {
    totalOver += diff;
    console.log('  ' + n + ': ' + cur + ' (OVER by ' + diff + ', target ' + target + ')');
  } else if (diff < -20) {
    totalUnder += Math.abs(diff);
    console.log('  ' + n + ': ' + cur + ' (UNDER by ' + Math.abs(diff) + ', target ' + target + ')');
  } else {
    console.log('  ' + n + ': ' + cur + ' ✓');
  }
}
console.log('\nTotal over-represented:', totalOver, '| Under-represented:', totalUnder);
