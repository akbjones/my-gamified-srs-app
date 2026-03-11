#!/usr/bin/env node
/**
 * audit-punctuation-it.cjs
 *
 * Italian punctuation and accent validation.
 * Checks for: missing accents, Spanish punctuation marks, double periods, etc.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

const issues = [];

function flag(card, issue) {
  issues.push({ id: card.id, issue, target: card.target });
}

// Common Italian words that MUST have accents
const ACCENT_REQUIRED = [
  { wrong: /\bperche\b/g, correct: 'perché', note: 'perche → perché' },
  { wrong: /\bcitta\b/g, correct: 'città', note: 'citta → città' },
  { wrong: /\bpuo\b/g, correct: 'può', note: 'puo → può' },
  { wrong: /\bpiu\b/g, correct: 'più', note: 'piu → più' },
  { wrong: /\bgiu\b/g, correct: 'giù', note: 'giu → giù' },
  { wrong: /\bgia\b/g, correct: 'già', note: 'gia → già' },
  { wrong: /\bcosi\b/g, correct: 'così', note: 'cosi → così' },
  { wrong: /\bpero\b/g, correct: 'però', note: 'pero → però' },
  { wrong: /\bcio\b/g, correct: 'ciò', note: 'cio → ciò' },
  { wrong: /\bne\b/g, correct: 'né', note: 'ne → né (conjunction)' },  // careful: "ne" as pronoun is valid
  { wrong: /\buniversita\b/g, correct: 'università', note: 'universita → università' },
  { wrong: /\bcaffe\b/g, correct: 'caffè', note: 'caffe → caffè' },
  { wrong: /\bmeta\b/g, correct: 'metà', note: 'meta → metà' },
  { wrong: /\bvirtù\b/g, correct: 'virtù', note: 'virtu → virtù' },
];

let autoFixed = 0;

for (const card of deck) {
  const t = card.target;
  const tLower = t.toLowerCase();

  // 1. Spanish punctuation should not appear in Italian
  if (t.includes('¿') || t.includes('¡')) {
    flag(card, 'Spanish punctuation (¿/¡) found in Italian');
    // Auto-fix: remove Spanish marks
    card.target = card.target.replace(/[¿¡]/g, '');
    autoFixed++;
  }

  // 2. Double period (not ellipsis)
  if (/\.\.(?!\.)/.test(t)) {
    flag(card, 'Double period found (not ellipsis)');
  }

  // 3. Missing closing punctuation
  if (t.length > 0 && !/[.?!…]$/.test(t.trim())) {
    flag(card, 'Missing end punctuation');
  }

  // 4. Double spaces
  if (/  /.test(t)) {
    flag(card, 'Double space');
    card.target = card.target.replace(/  +/g, ' ');
    autoFixed++;
  }

  // 5. Leading/trailing whitespace
  if (t !== t.trim()) {
    flag(card, 'Leading/trailing whitespace');
    card.target = card.target.trim();
    autoFixed++;
  }

  // 6. Accent checks (only flag, skip "ne" as pronoun which is very common)
  for (const rule of ACCENT_REQUIRED) {
    if (rule.wrong.test(tLower)) {
      // Skip "ne" check — too many false positives (ne as partitive pronoun)
      if (rule.note.startsWith('ne →')) continue;
      flag(card, `Missing accent: ${rule.note}`);
    }
    // Reset regex lastIndex
    rule.wrong.lastIndex = 0;
  }

  // 7. English-only target (no Italian characters)
  const italianChars = /[àèéìòùa-z]/i;
  if (!italianChars.test(t)) {
    flag(card, 'Target may not be Italian');
  }

  // 8. Unclosed parentheses or quotes
  const openParens = (t.match(/\(/g) || []).length;
  const closeParens = (t.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    flag(card, 'Unclosed parentheses');
  }

  const openQuotes = (t.match(/[""«]/g) || []).length;
  const closeQuotes = (t.match(/[""»]/g) || []).length;
  if (openQuotes !== closeQuotes) {
    flag(card, 'Unclosed quotes');
  }
}

// Save auto-fixes
if (autoFixed > 0) {
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
  console.log(`Auto-fixed ${autoFixed} issues\n`);
}

// Report
const byIssue = {};
for (const i of issues) {
  byIssue[i.issue] = byIssue[i.issue] || [];
  byIssue[i.issue].push(i);
}

console.log(`=== ITALIAN PUNCTUATION AUDIT ===`);
console.log(`Total cards: ${deck.length}`);
console.log(`Total issues: ${issues.length}\n`);

for (const [issue, cards] of Object.entries(byIssue).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`── ${issue}: ${cards.length} ──`);
  cards.slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.target.substring(0, 80)}`));
  if (cards.length > 5) console.log(`  ... and ${cards.length - 5} more`);
  console.log('');
}

if (issues.length === 0) {
  console.log('No issues found!');
}
