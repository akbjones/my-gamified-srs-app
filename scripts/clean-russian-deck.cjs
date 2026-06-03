#!/usr/bin/env node
/**
 * Clean Russian deck: remove template garbage, double-location nonsense, node-01 duplicates
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'russian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

console.log(`Starting deck: ${deck.length} cards`);

// Build audio lookup: target sentence -> audio path (before any modifications)
const audioByTarget = new Map();
deck.forEach(c => {
  if (c.audio) audioByTarget.set(c.target, c.audio);
});

const removeIds = new Set();
const removeReasons = {};

function markRemove(card, reason) {
  removeIds.add(card.id);
  removeReasons[card.id] = reason;
}

// === 1. Node-01 "My name is X" duplicates: keep first 2, remove the rest (except ru-0209 which is different) ===
const nameCards = deck.filter(c => c.grammarNode === 'node-01' && /^My name is \w+\.$/.test(c.english));
console.log(`\nNode-01 "My name is X" cards: ${nameCards.length}`);
// Keep first 2 (Viktor, Oleg), remove 9 others
nameCards.slice(2).forEach(c => markRemove(c, 'node-01 duplicate: My name is X'));

// === 2. Double-location nonsense ===
// Cards with 2+ location prepositions where meaning is absurd
const locationWords = ['park','office','market','library','hospital','station','restaurant','museum','pool','gym','school','university','theater','cinema','airport','store','shop','hotel','church','bank','cafe','garden','street','square','stadium','factory','clinic','pharmacy','beach','work'];

function countLocationPhrases(english) {
  const e = english.toLowerCase();
  let count = 0;
  // Match "in/at the [location]" or "at school/work" patterns
  const matches = e.matchAll(/(?:in the |at the |near the |next to the )(\w+)/g);
  for (const m of matches) {
    if (locationWords.includes(m[1])) count++;
  }
  // Also count "at school", "at work" etc without "the"
  if (/\bat school\b/.test(e)) count++;
  if (/\bat work\b/.test(e)) count++;
  return count;
}

deck.forEach(c => {
  if (removeIds.has(c.id)) return;
  const e = c.english.toLowerCase();
  const locCount = countLocationPhrases(c.english);

  // Cards with 2+ locations that are clearly nonsensical combos
  if (locCount >= 2) {
    // Whitelist natural double-location cards
    const natural = [
      'pharmacy next to the store',
      'university in the third',
      'at the university in the',
      'office every day',  // "works in the office" is the location, time phrase isn't
      'from the office to the',
      'from the park to the',
    ];
    if (natural.some(n => e.includes(n))) return;

    // If it has locations like "in the park at the airport" or "in the office at the market", it's garbage
    markRemove(c, 'double-location nonsense');
  }
});

// === 3. Template profession cards ===
// Pattern: "The [profession/person] [action] [time]" where the combination is absurd
const professionSubjects = [
  'policeman', 'journalist', 'architect', 'farmer', 'teacher', 'librarian',
  'engineer', 'doctor', 'artist', 'musician', 'cook', 'driver', 'pilot',
  'sailor', 'soldier', 'chef', 'athlete', 'student', 'programmer',
  'director', 'salesman', 'writer', 'neighbor', 'friend', 'boy', 'girl', 'child'
];

const templateActions = [
  'reads a book', 'writes a letter', 'watches a movie', 'buys groceries',
  'cleans the apartment', 'listens to music', 'cooks lunch', 'does laundry',
  'studies a language', 'commutes to work', 'swims in the pool',
  'walks in the park', 'runs in the morning', 'helps a friend', 'sings a song',
  'works in the office', 'plays chess'
];

const templateTimes = [
  'now', 'tomorrow', 'on monday', 'on tuesday', 'on wednesday', 'on thursday',
  'on friday', 'on weekends', 'before bed', 'after lunch', 'in the evening',
  'in the morning', 'this morning', 'soon', 'every day', 'every morning',
  'last week', 'on saturday', 'on sunday'
];

// Natural profession+action combos that should NOT be removed
const naturalCombos = new Set([
  'teacher-studies a language',
  'teacher-reads a book',
  'writer-reads a book',
  'writer-writes a letter',
  'doctor-commutes to work',
  'doctor-works in the office',
  'student-studies a language',
  'student-reads a book',
  'programmer-works in the office',
  'programmer-commutes to work',
  'chef-cooks lunch',
  'musician-listens to music',
  'musician-sings a song',
  'athlete-runs in the morning',
  'athlete-swims in the pool',
  'driver-commutes to work',
  'child-watches a movie',
  'child-reads a book',
  'child-plays chess',
  'boy-reads a book',
  'boy-plays chess',
  'girl-reads a book',
  'girl-plays chess',
  'friend-helps a friend',  // a bit weird but okay
  'neighbor-works in the office',
]);

deck.forEach(c => {
  if (removeIds.has(c.id)) return;
  const e = c.english.toLowerCase();

  // Must start with "The [profession] "
  const profMatch = e.match(/^the (\w+) /);
  if (!profMatch) return;
  const prof = profMatch[1];
  if (!professionSubjects.includes(prof)) return;

  // Must have a template action
  const action = templateActions.find(a => e.includes(a));
  if (!action) return;

  // Must have a template time marker
  const time = templateTimes.find(t => e.endsWith(t + '.') || e.includes(t + ' '));
  if (!time) return;

  // Check if natural combo
  const combo = `${prof}-${action}`;
  if (naturalCombos.has(combo)) return;

  // This is template garbage
  markRemove(c, `template: ${prof} + ${action} + ${time}`);
});

// === 4. Also catch family member template cards ===
const familySubjects = ['brother', 'sister', 'mom', 'dad', 'grandmother', 'grandfather'];

deck.forEach(c => {
  if (removeIds.has(c.id)) return;
  const e = c.english.toLowerCase();

  // Check family + action + time with the same template pattern
  const famMatch = familySubjects.find(f => e.startsWith(f + ' '));
  if (!famMatch) return;

  const action = templateActions.find(a => e.includes(a));
  if (!action) return;

  const time = templateTimes.find(t => e.endsWith(t + '.') || e.includes(t + ' '));
  if (!time) return;

  // For family members, keep natural combos
  const naturalFamily = new Set([
    'grandmother-cooks lunch',
    'mom-cooks lunch',
    'dad-cooks lunch',
    'brother-reads a book',
    'sister-reads a book',
    'grandfather-reads a book',
    'grandmother-reads a book',
    'brother-runs in the morning',
    'sister-runs in the morning',
    'mom-listens to music',
    'dad-works in the office',
    'mom-watches a movie',
    'grandfather-watches a movie',
  ]);

  if (naturalFamily.has(`${famMatch}-${action}`)) return;

  // If it's been repeated (same family+action with different times), remove extras
  // But also remove clearly silly ones like "Grandmother runs in the morning at work"
  // or "Sister commutes to work before bed"
  const sillyFamilyCombos = [
    'grandmother-runs in the morning',
    'grandmother-swims in the pool',
    'grandmother-works in the office',
    'grandmother-commutes to work',
    'grandfather-swims in the pool',
    'grandfather-runs in the morning',
    'sister-commutes to work',
    'brother-does laundry',
    'brother-cleans the apartment',
    'sister-cleans the apartment',
    'mom-cleans the apartment',
    'dad-cleans the apartment',
    'grandmother-cleans the apartment',
    'grandmother-does laundry',
    'brother-buys groceries',
    'sister-buys groceries',
    'mom-buys groceries',
    'dad-buys groceries',
    'grandmother-buys groceries',
    'grandfather-buys groceries',
    'brother-walks in the park',
    'sister-walks in the park',
    'grandmother-walks in the park',
    'grandfather-walks in the park',
    'brother-studies a language',
    'sister-studies a language',
    'grandmother-studies a language',
    'grandfather-studies a language',
    'brother-sings a song',
    'sister-sings a song',
    'mom-sings a song',
    'brother-writes a letter',
    'sister-writes a letter',
    'brother-helps a friend',
    'sister-helps a friend',
    'brother-listens to music',
    'sister-listens to music',
    'mom-does laundry',
    'dad-does laundry',
    'mom-runs in the morning',
    'dad-runs in the morning',
    'grandfather-does laundry',
    'grandfather-cleans the apartment',
    'dad-listens to music',
    'dad-watches a movie',
    'dad-reads a book',
    'dad-writes a letter',
    'mom-writes a letter',
    'mom-walks in the park',
    'dad-walks in the park',
    'dad-swims in the pool',
    'mom-swims in the pool',
    'brother-watches a movie',
    'sister-watches a movie',
    'brother-commutes to work',
  ];

  if (sillyFamilyCombos.includes(`${famMatch}-${action}`)) {
    markRemove(c, `family template: ${famMatch} + ${action} + ${time}`);
  }
});

// === 5. Node-01 specific: too many cards with same action verb, keep max 2 per action ===
const node01 = deck.filter(c => c.grammarNode === 'node-01' && !removeIds.has(c.id));
const node01ActionGroups = {};
node01.forEach(c => {
  const e = c.english.toLowerCase();
  const action = templateActions.find(a => e.includes(a));
  if (action) {
    if (!node01ActionGroups[action]) node01ActionGroups[action] = [];
    node01ActionGroups[action].push(c);
  }
});

Object.entries(node01ActionGroups).forEach(([action, cards]) => {
  if (cards.length > 3) {
    // Keep first 3, remove the rest
    cards.slice(3).forEach(c => markRemove(c, `node-01 excess: too many "${action}" cards`));
  }
});

// === 6. Specific nonsense patterns ===
deck.forEach(c => {
  if (removeIds.has(c.id)) return;
  const e = c.english.toLowerCase();

  // "before it becomes too late"
  if (e.includes('before it becomes too late') || e.includes('before it is too late')) {
    markRemove(c, 'nonsense: before it becomes too late');
  }

  // Profession at completely wrong location
  const wrongCombos = [
    { pattern: /policeman.*(pool|museum|library|restaurant|cinema|theater)/, reason: 'policeman at wrong location' },
    { pattern: /farmer.*(museum|cinema|theater|airport|office)/, reason: 'farmer at wrong location' },
    { pattern: /architect.*(pool|market|hospital|gym)/, reason: 'architect at wrong location' },
    { pattern: /sailor.*(park|library|museum|school)/, reason: 'sailor at wrong location' },
  ];

  wrongCombos.forEach(({ pattern, reason }) => {
    if (pattern.test(e)) markRemove(c, `nonsense: ${reason}`);
  });
});

// === Report ===
console.log(`\nTotal cards to remove: ${removeIds.size}`);

// Group by reason
const reasonCounts = {};
Object.values(removeReasons).forEach(r => {
  // Simplify reason
  const simple = r.startsWith('template:') ? 'template profession cards' :
                 r.startsWith('family template:') ? 'family template cards' :
                 r.startsWith('node-01 excess:') ? 'node-01 excess same-action' :
                 r.startsWith('nonsense:') ? 'nonsense patterns' :
                 r;
  reasonCounts[simple] = (reasonCounts[simple] || 0) + 1;
});
console.log('\nRemoval breakdown:');
Object.entries(reasonCounts).sort((a,b) => b[1] - a[1]).forEach(([r, c]) => {
  console.log(`  ${r}: ${c}`);
});

// Show some examples being removed
console.log('\nSample removed cards:');
const removed = deck.filter(c => removeIds.has(c.id));
removed.slice(0, 20).forEach(c => {
  console.log(`  ${c.id} [${c.grammarNode}] "${c.english}" – ${removeReasons[c.id]}`);
});

// === Apply removal ===
const kept = deck.filter(c => !removeIds.has(c.id));
console.log(`\nKept: ${kept.length} cards`);

// === Sort by (node number, word count) ===
kept.sort((a, b) => {
  const nodeA = parseInt(a.grammarNode.replace('node-', ''));
  const nodeB = parseInt(b.grammarNode.replace('node-', ''));
  if (nodeA !== nodeB) return nodeA - nodeB;
  const wordsA = a.target.split(/\s+/).length;
  const wordsB = b.target.split(/\s+/).length;
  return wordsA - wordsB;
});

// === Reassign IDs, preserve audio ===
const result = kept.map((c, i) => {
  const newId = `ru-${String(i + 1).padStart(4, '0')}`;
  // Audio is matched by target sentence (already preserved since we didn't change target)
  const audio = audioByTarget.get(c.target) || c.audio;
  return {
    id: newId,
    target: c.target,
    english: c.english,
    audio: audio,
    grammar: c.grammar || '',
    tags: c.tags,
    grammarNode: c.grammarNode,
  };
});

// === Write ===
fs.writeFileSync(DECK_PATH, JSON.stringify(result, null, 2) + '\n');
console.log(`\nWrote ${result.length} cards to deck.json`);

// === Show first 10 node-01 cards ===
const finalNode01 = result.filter(c => c.grammarNode === 'node-01');
console.log(`\nFinal node-01 cards: ${finalNode01.length}`);
console.log('First 10:');
finalNode01.slice(0, 10).forEach(c => {
  console.log(`  ${c.id} "${c.english}"`);
});

// === Per-node summary ===
const finalNodes = {};
result.forEach(c => {
  finalNodes[c.grammarNode] = (finalNodes[c.grammarNode] || 0) + 1;
});
console.log('\nFinal cards per node:');
Object.entries(finalNodes).sort((a,b) => a[0].localeCompare(b[0])).forEach(([k,v]) => {
  console.log(`  ${k}: ${v}`);
});
