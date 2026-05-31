#!/usr/bin/env node
/**
 * Sample 10 random cards per (CEFR tier, focus tag) combo for given languages.
 */
const fs = require('fs');

const TIERS = {
  A1: ['node-01','node-02','node-03','node-04','node-05','node-06','node-07','node-08'],
  A2: ['node-09','node-10','node-11','node-12','node-13','node-14','node-15'],
  B1: ['node-16','node-17','node-18','node-19','node-20','node-21'],
  B2: ['node-22','node-23','node-24','node-25','node-26','node-27'],
  C1: ['node-28','node-29','node-30','node-31'],
  C2: ['node-32','node-33','node-34','node-35'],
};

const FOCUSES = ['general', 'travel', 'work', 'family'];

const LANG_DECKS = {
  german:     'src/data/german/deck.json',
  french:     'src/data/french/deck.json',
  italian:    'src/data/italian/deck.json',
  spanish:    'src/data/spanish/deck.json',
  portuguese: 'src/data/portuguese/deck.json',
  dutch:      'src/data/dutch/deck.json',
  swedish:    'src/data/swedish/deck.json',
  welsh:      'src/data/welsh/deck.json',
  hindi:      'src/data/hindi/deck.json',
  turkish:    'src/data/turkish/deck.json',
  russian:    'src/data/russian/deck.json',
};

function pick(arr, n) {
  const a = [...arr];
  const out = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

const langs = process.argv.slice(2);
if (!langs.length) { console.error('usage: random-samples.cjs <lang> [<lang>...]'); process.exit(1); }

for (const lang of langs) {
  const path = LANG_DECKS[lang];
  if (!path) { console.error('unknown lang:', lang); continue; }
  const deck = JSON.parse(fs.readFileSync(path, 'utf8'));
  console.log('\n' + '═'.repeat(80));
  console.log('  ' + lang.toUpperCase());
  console.log('═'.repeat(80));

  for (const focus of FOCUSES) {
    console.log('\n┌─ FOCUS: ' + focus + ' ' + '─'.repeat(70 - focus.length));
    for (const [tier, nodeIds] of Object.entries(TIERS)) {
      const candidates = deck.filter(c =>
        nodeIds.includes(c.grammarNode) &&
        (c.tags || []).includes(focus)
      );
      const sampled = pick(candidates, 10);
      console.log('\n  ── ' + tier + ' (' + sampled.length + ' of ' + candidates.length + ' available) ──');
      for (const c of sampled) {
        console.log('    ' + c.id + '  ' + c.target);
        console.log('         → ' + c.english);
      }
    }
  }
}
