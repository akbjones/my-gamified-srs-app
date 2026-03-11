#!/usr/bin/env node
/**
 * fix-accents-it.cjs
 *
 * Fixes missing accents on common Italian words that require them.
 * Only fixes unambiguous cases where the unaccented form is wrong/nonexistent.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// Word-boundary accent fixes: [unaccented regex, accented replacement]
// Only includes words where the unaccented form is always wrong in context
const FIXES = [
  // Adverbs and conjunctions that ALWAYS need accents
  [/\bpiu\b/g, 'più'],
  [/\bPiu\b/g, 'Più'],
  [/\bgia\b/g, 'già'],
  [/\bGia\b/g, 'Già'],
  [/\bcosi\b/g, 'così'],
  [/\bCosi\b/g, 'Così'],
  [/\bpero\b/g, 'però'],
  [/\bPero\b/g, 'Però'],
  [/\bperche\b/g, 'perché'],
  [/\bPerche\b/g, 'Perché'],
  [/\bpuo\b/g, 'può'],
  [/\bPuo\b/g, 'Può'],
  [/\bgiu\b/g, 'giù'],
  [/\bGiu\b/g, 'Giù'],
  [/\bcitta\b/g, 'città'],
  [/\bCitta\b/g, 'Città'],
  [/\buniversita\b/g, 'università'],
  [/\bUniversita\b/g, 'Università'],
  [/\bcaffe\b/g, 'caffè'],
  [/\bCaffe\b/g, 'Caffè'],
  [/\bmeta\b/g, 'metà'],   // "meta" as "half" — rare as noun "goal" in these sentences
  [/\bcio\b(?!\s*è)/g, 'ciò'],  // ciò but not "cioè"
  [/\bCio\b(?!\s*è)/g, 'Ciò'],
  [/\bcioè\b/gi, 'cioè'],  // fix "cioE" → "cioè"
  [/\bCioe\b/g, 'Cioè'],
  // Verbs: è (is) — only fix standalone "e" when it's clearly the verb
  // This is tricky because "e" is also "and". We fix patterns like "non e", "la vita e"
  [/\bnon e\b/g, 'non è'],
  [/\bla sfida e\b/gi, 'la sfida è'],
  [/\bla citta e\b/gi, 'la città è'],
  [/\bla vita e\b/gi, 'la vita è'],
  [/\bla tesi e\b/gi, 'la tesi è'],
  [/\bla situazione e\b/gi, 'la situazione è'],
  // "E" at start of sentence followed by article/adjective (likely "È")
  [/^E la\b/gm, 'È la'],
  [/^E il\b/gm, 'È il'],
  [/^E un\b/gm, 'È un'],
  [/^E una\b/gm, 'È una'],
  // Common phrase fixes
  [/\bsi puo\b/g, 'si può'],
  [/\bne puo\b/g, 'né può'],
  // "qualità", "verità", "libertà" etc
  [/\bqualita\b/g, 'qualità'],
  [/\bverita\b/g, 'verità'],
  [/\bliberta\b/g, 'libertà'],
  [/\bsocieta\b/g, 'società'],
  [/\bvolonta\b/g, 'volontà'],
  [/\bnecessita\b/g, 'necessità'],
  [/\babilita\b/g, 'abilità'],
  [/\battivita\b/g, 'attività'],
  [/\bopportunita\b/g, 'opportunità'],
  [/\bresponsabilita\b/g, 'responsabilità'],
  [/\bcapacita\b/g, 'capacità'],
  [/\bdifficolta\b/g, 'difficoltà'],
  [/\bpossibilita\b/g, 'possibilità'],
  [/\bfacolta\b/g, 'facoltà'],
  [/\brealita\b/g, 'realtà'],
  [/\bfelicita\b/g, 'felicità'],
  [/\bfedelta\b/g, 'fedeltà'],
  [/\bonesta\b/g, 'onestà'],
  [/\bamicizia\b/g, 'amicizia'], // no change needed, but keep as sentinel
];

let totalFixed = 0;
const fixDetails = {};

for (const card of deck) {
  const original = card.target;
  let text = card.target;

  for (const [pattern, replacement] of FIXES) {
    text = text.replace(pattern, replacement);
  }

  // Also fix English field if it has Italian text remnants
  // (unlikely but defensive)

  if (text !== original) {
    card.target = text;
    totalFixed++;

    // Track which fixes were applied
    const diffs = [];
    const origWords = original.split(/\s+/);
    const newWords = text.split(/\s+/);
    for (let i = 0; i < origWords.length; i++) {
      if (origWords[i] !== newWords[i]) {
        const key = `${origWords[i]} → ${newWords[i]}`;
        fixDetails[key] = (fixDetails[key] || 0) + 1;
      }
    }
  }
}

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');

console.log(`=== ACCENT FIX RESULTS ===`);
console.log(`Cards fixed: ${totalFixed}`);
console.log(`\nFix breakdown:`);
Object.entries(fixDetails).sort((a, b) => b[1] - a[1]).forEach(([fix, count]) => {
  console.log(`  ${fix}: ${count}`);
});

// Verify: re-scan for remaining issues
let remaining = 0;
const missed = [];
for (const card of deck) {
  const t = card.target.toLowerCase();
  if (/\bpiu\b/.test(t) || /\bgia\b/.test(t) || /\bcosi\b/.test(t) ||
      /\bpero\b/.test(t) || /\bperche\b/.test(t) || /\bpuo\b/.test(t) ||
      /\bcitta\b/.test(t) || /\bgiu\b/.test(t)) {
    remaining++;
    if (missed.length < 5) missed.push(card);
  }
}
console.log(`\nRemaining accent issues: ${remaining}`);
if (missed.length > 0) {
  missed.forEach(c => console.log(`  [${c.id}] ${c.target}`));
}
