#!/usr/bin/env node
/**
 * Pre-flight for register cleanup — verify deck ordering matches difficulty
 * curve before we commit to tier-by-position rules.
 *
 * Three checks:
 *   1. Split deck into Q1/Q2/Q3/Q4 by position
 *   2. Report avg sentence length + avg word length per quartile
 *   3. Sample 5 cards from each quartile so a human can eyeball difficulty
 *
 * Report at the end tells us whether tier-by-position holds.
 */
const fs = require('fs');
const path = require('path');

const langs = process.argv.slice(2).filter(a => !a.startsWith('-'));
if (!langs.length) langs.push('russian', 'turkish');

const OFFENDERS = {
  russian: [
    'является', 'осуществлять', 'обеспечивать', 'реализовывать', 'при условии',
    'в качестве', 'на данный момент', 'поскольку', 'вследствие', 'данный',
    'следует', 'необходимо', 'иметь', 'настоящий', 'указанный',
    'ущий', 'ющий', 'ащий', 'ящий', 'вший', 'ший',   // participle stems
    'вши', 'учи', 'ючи',                              // gerund stems
  ],
  turkish: [
    'müracaat', 'iştirak', 'ifade et', 'tebliğ', 'talep et', 'tayin et',
    'husus', 'lüzum', 'muhtelif', 'ekseriyet', 'keyfiyet', 'vaziyet',
    'temin et', 'tanzim et', 'vasıl ol', 'ihraz et', 'mürur',
    'müddet', 'esnasında', 'akabinde',
  ],
};

function tokenize(s) {
  return s.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
}

function offenderHits(text, list) {
  const lower = text.toLowerCase();
  let n = 0;
  for (const o of list) if (lower.includes(o)) n++;
  return n;
}

for (const lang of langs) {
  const deck = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'src', 'data', lang, 'deck.json'), 'utf8'));
  const offenders = OFFENDERS[lang] || [];

  console.log(`\n\x1b[1m${lang.toUpperCase()}\x1b[0m  ${deck.length} cards\n`);

  // Split into quartiles by position
  const q = 4;
  const perQ = Math.ceil(deck.length / q);
  const quartiles = [0, 1, 2, 3].map(i =>
    deck.slice(i * perQ, Math.min((i + 1) * perQ, deck.length))
  );

  // Report per-quartile metrics
  console.log('  Quartile   Cards   AvgWords   AvgChars   Offenders   OffenderRate');
  for (let i = 0; i < 4; i++) {
    const cards = quartiles[i];
    const wc = cards.reduce((s, c) => s + tokenize(c.target).length, 0) / cards.length;
    const cc = cards.reduce((s, c) => s + c.target.length, 0) / cards.length;
    const off = cards.reduce((s, c) => s + offenderHits(c.target, offenders), 0);
    const offRate = (off / cards.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(wc));
    console.log(`  Q${i + 1}         ${String(cards.length).padStart(4)}   ${wc.toFixed(1).padStart(6)} ${bar}`.padEnd(52) +
      `   ${cc.toFixed(1).padStart(6)}   ${String(off).padStart(6)}   ${offRate}%`);
  }

  // Sample cards
  console.log('\n  Sample cards per quartile:');
  for (let i = 0; i < 4; i++) {
    const cards = quartiles[i];
    console.log(`\n  \x1b[36mQ${i + 1} sample:\x1b[0m`);
    const samples = [
      cards[0],
      cards[Math.floor(cards.length * 0.33)],
      cards[Math.floor(cards.length * 0.66)],
      cards[cards.length - 1],
    ];
    for (const c of samples) {
      const off = offenderHits(c.target, offenders);
      const flag = off > 0 ? ` \x1b[33m[${off} offender${off > 1 ? 's' : ''}]\x1b[0m` : '';
      console.log(`    ${c.id.padEnd(10)} ${c.target}${flag}`);
      console.log(`               \x1b[2m${c.english}\x1b[0m`);
    }
  }

  // Outliers: Q1 cards with any offenders (immediate concern)
  const q1Offenders = quartiles[0].filter(c => offenderHits(c.target, offenders) > 0);
  const q4Trivial = quartiles[3].filter(c => tokenize(c.target).length <= 3);
  console.log(`\n  \x1b[33mOutliers:\x1b[0m`);
  console.log(`    Q1 cards with seed offenders: ${q1Offenders.length}`);
  if (q1Offenders.length) {
    for (const c of q1Offenders.slice(0, 5)) {
      console.log(`      ${c.id}: ${c.target}`);
    }
    if (q1Offenders.length > 5) console.log(`      … +${q1Offenders.length - 5} more`);
  }
  console.log(`    Q4 cards ≤3 words (suspiciously easy): ${q4Trivial.length}`);
  if (q4Trivial.length && q4Trivial.length < 20) {
    for (const c of q4Trivial.slice(0, 5)) {
      console.log(`      ${c.id}: ${c.target}`);
    }
  }
}

console.log('\n\x1b[2mCorrelation check: if AvgWords and AvgChars monotonically increase Q1→Q4,\ntier-by-position holds. If not, we need to re-order.\x1b[0m\n');
