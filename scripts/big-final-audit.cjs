#!/usr/bin/env node
/**
 * Big final audit: 100 random sentences per language, stratified across the
 * 4 focus areas (general / travel / work / family). This produces ~1100 cards
 * we can eyeball to assess overall deck quality after all the cleanup work.
 *
 * Output: scripts/big-final-audit.txt
 */
const fs = require('fs');

const DECKS = {
  spanish:    'src/data/spanish/deck.json',
  french:     'src/data/french/deck.json',
  italian:    'src/data/italian/deck.json',
  portuguese: 'src/data/portuguese/deck.json',
  german:     'src/data/german/deck.json',
  dutch:      'src/data/dutch/deck.json',
  swedish:    'src/data/swedish/deck.json',
  welsh:      'src/data/welsh/deck.json',
  hindi:      'src/data/hindi/deck.json',
  turkish:    'src/data/turkish/deck.json',
  russian:    'src/data/russian/deck.json',
};

const FOCUSES = ['general', 'travel', 'work', 'family'];
const PER_FOCUS = 25;  // 25 × 4 = 100 per language

function pick(arr, n) {
  const a = [...arr];
  const out = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

const lines = [];
function P(s = '') { lines.push(s); }

P('═'.repeat(80));
P('  BIG FINAL AUDIT — 100 random cards per language across 4 focus slices');
P('═'.repeat(80));
P();

const stats = {};

for (const [lang, deckPath] of Object.entries(DECKS)) {
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  P('═'.repeat(80));
  P('  ' + lang.toUpperCase() + '  (' + deck.length + ' cards)');
  P('═'.repeat(80));
  stats[lang] = { total: deck.length, samples: 0 };

  for (const focus of FOCUSES) {
    const inFocus = deck.filter(c => (c.tags || []).includes(focus));
    inFocus.sort((a, b) => (a.priority || 999999) - (b.priority || 999999));
    const sampled = pick(inFocus, PER_FOCUS);
    sampled.sort((a, b) => (a.priority || 999999) - (b.priority || 999999));
    P();
    P('── FOCUS: ' + focus + '  (' + inFocus.length + ' total, ' + sampled.length + ' sampled) ──');
    for (const c of sampled) {
      P('  [pri ' + String(c.priority).padStart(4) + ']  ' + c.target);
      P('              → ' + c.english);
    }
    stats[lang].samples += sampled.length;
  }
  P();
}

P('═'.repeat(80));
P('  SUMMARY');
P('═'.repeat(80));
for (const [lang, s] of Object.entries(stats)) {
  P('  ' + lang.padEnd(11) + ' ' + s.total + ' total, ' + s.samples + ' sampled');
}

fs.writeFileSync('scripts/big-final-audit.txt', lines.join('\n'));
console.log('Saved scripts/big-final-audit.txt — ' + lines.length + ' lines');
console.log('Total samples: ~' + Object.values(stats).reduce((a, s) => a + s.samples, 0));
