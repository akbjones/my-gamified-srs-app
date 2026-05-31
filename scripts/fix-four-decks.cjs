const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'src', 'data');

// ============================================================
// HINDI: Fix gender agreement for female names
// ============================================================
function fixHindi() {
  const deckPath = path.join(BASE, 'hindi', 'deck.json');
  let cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const origCount = cards.length;

  const femaleNames = [
    'Sunita', 'Anita', 'Sita', 'Priya', 'Kavita', 'Asha', 'Sheela', 'Neeta',
    'Pooja', 'Kiran', 'Meena', 'Geeta', 'Meera', 'Nisha', 'Radha', 'Sapna',
    'Rekha', 'Ruby', 'Swati', 'Seema', 'Sarita', 'Gita', 'Lata', 'Reena',
    'Rani', 'Sushma', 'Shobha', 'Rashmi', 'Sarla', 'Kamala', 'Aarti', 'Neha',
    'Deepa', 'Jaya', 'Mala', 'Poonam', 'Renu', 'Savita', 'Usha', 'Vandana'
  ];

  // Build regex to detect female name as subject
  const femNamePattern = new RegExp(`\\b(${femaleNames.join('|')})\\b`, 'i');
  // Also match possessive forms like "Sheela's"
  const femNamePossPattern = new RegExp(`\\b(${femaleNames.join('|')})'s\\b`, 'i');

  let genderFixes = 0;
  let prRiyaFixes = 0;

  cards.forEach(card => {
    const eng = card.english;

    // Fix PrRiya -> Priya
    if (eng.includes('PrRiya') || eng.includes('Prriya') || eng.includes('PRiya')) {
      card.english = card.english.replace(/PrRiya|Prriya|PRiya/g, 'Priya');
      prRiyaFixes++;
    }

    // Check if a female name is the subject (appears before the verb/action)
    const hasFemName = femNamePattern.test(eng);
    const hasFemPoss = femNamePossPattern.test(eng);

    if (hasFemName || hasFemPoss) {
      // Determine which female name is in the sentence
      const match = eng.match(femNamePattern) || eng.match(femNamePossPattern);
      if (!match) return;
      const name = match[1];

      // Only fix if there's a male pronoun issue
      let changed = false;
      let newEng = eng;

      // "by himself" -> "by herself" when female name is subject
      if (/\bhimself\b/.test(newEng)) {
        newEng = newEng.replace(/\bhimself\b/g, 'herself');
        changed = true;
      }

      // " his " -> " her " in context (but NOT in grammar tips or possessive like "his parents" when referring to someone else)
      // Only fix when the female name is clearly the subject
      if (/ his /.test(newEng)) {
        // Check if the name appears before " his " - if so, it's the subject
        const nameIdx = newEng.indexOf(name);
        const hisIdx = newEng.indexOf(' his ');
        if (nameIdx < hisIdx || newEng.startsWith(name)) {
          newEng = newEng.replace(/ his /g, ' her ');
          changed = true;
        }
      }

      // Fix grammar field too
      if (card.grammar) {
        let newGram = card.grammar;
        if (/\bhimself\b/.test(newGram) && hasFemName) {
          newGram = newGram.replace(/\(he\) himself/g, '(she) herself');
          newGram = newGram.replace(/\bhimself\b/g, 'herself');
        }
        if (newGram !== card.grammar) {
          card.grammar = newGram;
        }
      }

      if (changed) {
        card.english = newEng;
        genderFixes++;
      }
    }
  });

  console.log(`\n=== HINDI ===`);
  console.log(`Gender fixes: ${genderFixes}`);
  console.log(`PrRiya fixes: ${prRiyaFixes}`);
  console.log(`Cards before: ${origCount}, after: ${cards.length}`);

  return { cards, deckPath, origCount, genderFixes, prRiyaFixes };
}

// ============================================================
// SWEDISH: Remove "before it becomes too late..." suffix, nonsense cards
// ============================================================
function fixSwedish() {
  const deckPath = path.join(BASE, 'swedish', 'deck.json');
  let cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const origCount = cards.length;

  let suffixFixes = 0;
  let removedNonsense = 0;

  // Remove the "before it becomes too late to change your mind!!" suffix
  const suffixPattern = /,?\s*before it becomes too late to change your mind!*$/i;

  // Nonsense cards to remove
  const nonsensePatterns = [
    /^Travel there in the summer for a long time at home/i,
    /^To get cold feet in the evening too/i,
  ];

  cards = cards.filter(card => {
    for (const pat of nonsensePatterns) {
      if (pat.test(card.english)) {
        console.log(`  REMOVE (nonsense): "${card.english}"`);
        removedNonsense++;
        return false;
      }
    }
    return true;
  });

  cards.forEach(card => {
    if (suffixPattern.test(card.english)) {
      const before = card.english;
      card.english = card.english.replace(suffixPattern, '').trim();
      // If it was an imperative, add back appropriate punctuation
      if (!card.english.endsWith('.') && !card.english.endsWith('!') && !card.english.endsWith('?')) {
        card.english += '.';
      }
      suffixFixes++;
    }
  });

  console.log(`\n=== SWEDISH ===`);
  console.log(`Suffix fixes: ${suffixFixes}`);
  console.log(`Nonsense removed: ${removedNonsense}`);
  console.log(`Cards before: ${origCount}, after: ${cards.length}`);

  return { cards, deckPath, origCount, suffixFixes, removedNonsense };
}

// ============================================================
// WELSH: Remove word-salad cards
// ============================================================
function fixWelsh() {
  const deckPath = path.join(BASE, 'welsh', 'deck.json');
  let cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const origCount = cards.length;

  const wordSaladPatterns = [
    /brother is shaking horse/i,
    /brother is shaking wedding/i,
    /painting waiter by the wide cucumber/i,
    /shaking gown by the blunt pins/i,
    /shaking sprouts and fat planet/i,
    /vice and the gloomy bottle.*shaken/i,
    /shy figs or sculpture/i,
    /healthy cucumber by the jack/i,
    /I am writing regarding\.$/i,
    // Additional generic word-salad detection
    /shaking.*balcony/i,
    /shaking.*clouds/i,
  ];

  let removed = 0;
  cards = cards.filter(card => {
    for (const pat of wordSaladPatterns) {
      if (pat.test(card.english)) {
        console.log(`  REMOVE (word-salad): "${card.english}"`);
        removed++;
        return false;
      }
    }
    return true;
  });

  console.log(`\n=== WELSH ===`);
  console.log(`Word-salad removed: ${removed}`);
  console.log(`Cards before: ${origCount}, after: ${cards.length}`);

  return { cards, deckPath, origCount, removed };
}

// ============================================================
// TURKISH: Remove garbage cards
// ============================================================
function fixTurkish() {
  const deckPath = path.join(BASE, 'turkish', 'deck.json');
  let cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const origCount = cards.length;

  // Patterns for garbage cards
  const garbagePatterns = [
    // Incomplete sentences missing objects
    /^(You|They|We|He|She|I) will (do|buy|sell|make|take|give|get|find|bring|put|see|read|write|eat|drink|cook|clean|wash|learn|teach|build|play|run|swim|drive|walk|sing|dance|paint|draw|study|watch|listen|open|close|start|begin|end|finish) (at|in) the (library|cinema|hospital|school|park|market|museum|station|airport|office|hotel|restaurant|garden|kitchen|bathroom|bedroom|garage|balcony) (tonight|today|tomorrow|yesterday|always|sometimes|often|rarely|never|every day|every week)\.*$/i,

    // "They/You/We [verb] in the [place] [adverb]" - unnatural
    /^(You|They|We|He|She|I) (love|hate|like|read|write|eat|drink|cook|clean|wash|learn|teach|play|run|swim|sing|dance|study|watch|listen|sleep) (at|in) the (library|cinema|hospital|school|park|market|museum|station|airport|office|hotel|restaurant) (always|sometimes|often|rarely|never|every day)\.*$/i,

    // Weird lone-adverb sentences
    /^We (run|walk|swim|learn|read|write|eat|drink|cook|clean|teach|play|sing|dance|study) (angrily|curiously|sadly|happily|loudly|quietly|slowly|quickly|nervously|proudly|lazily|rudely)\.*$/i,
    /^They (run|walk|swim|learn|read|write|eat|drink|cook|clean|teach|play|sing|dance|study) (angrily|curiously|sadly|happily|loudly|quietly|slowly|quickly|nervously|proudly|lazily|rudely)\.*$/i,
    /^You (run|walk|swim|learn|read|write|eat|drink|cook|clean|teach|play|sing|dance|study) (angrily|curiously|sadly|happily|loudly|quietly|slowly|quickly|nervously|proudly|lazily|rudely)\.*$/i,
  ];

  let removed = 0;
  const removedCards = [];

  cards = cards.filter(card => {
    const eng = card.english;

    for (const pat of garbagePatterns) {
      if (pat.test(eng)) {
        removedCards.push(eng);
        removed++;
        return false;
      }
    }
    return true;
  });

  // Print what we found
  console.log(`\n=== TURKISH ===`);
  console.log(`Garbage removed: ${removed}`);
  if (removed > 0) {
    removedCards.slice(0, 20).forEach(e => console.log(`  REMOVE: "${e}"`));
    if (removed > 20) console.log(`  ... and ${removed - 20} more`);
  }
  console.log(`Cards before: ${origCount}, after: ${cards.length}`);

  return { cards, deckPath, origCount, removed };
}

// ============================================================
// Common: re-sort and reassign IDs
// ============================================================
function resortAndReassign(cards, prefix, deckPath) {
  // Sort by (grammarNode, word count in english)
  cards.sort((a, b) => {
    const nodeA = a.grammarNode || '';
    const nodeB = b.grammarNode || '';
    if (nodeA !== nodeB) return nodeA.localeCompare(nodeB);
    const wcA = a.english.split(/\s+/).length;
    const wcB = b.english.split(/\s+/).length;
    return wcA - wcB;
  });

  // Reassign IDs
  cards.forEach((card, i) => {
    card.id = `${prefix}-${String(i + 1).padStart(4, '0')}`;
  });

  fs.writeFileSync(deckPath, JSON.stringify(cards, null, 2) + '\n');
  console.log(`  Written ${cards.length} cards to ${path.basename(deckPath)}`);
}

// ============================================================
// MAIN
// ============================================================
const hindi = fixHindi();
const swedish = fixSwedish();
const welsh = fixWelsh();
const turkish = fixTurkish();

// Now let's do a more thorough scan of Turkish for "mad-libs" style
console.log('\n--- Scanning Turkish for additional garbage patterns ---');
let trExtra = 0;
const trExtraRemoved = [];
turkish.cards = turkish.cards.filter(card => {
  const eng = card.english;

  // Pattern: "[Profession] [past verb]ed [adjective] a [noun] at the [location]"
  // e.g. "The teacher cooked delicious a cake at the school."
  if (/^The \w+ \w+ed \w+ a \w+ at the \w+\.$/.test(eng)) {
    trExtraRemoved.push(eng);
    trExtra++;
    return false;
  }

  // Very short incomplete: "You will do in the library tonight."
  if (/^(You|They|We|He|She|I) will \w+ (at|in) the \w+ (tonight|today|tomorrow)\.$/.test(eng)) {
    trExtraRemoved.push(eng);
    trExtra++;
    return false;
  }

  return true;
});
if (trExtra > 0) {
  console.log(`Additional Turkish garbage: ${trExtra}`);
  trExtraRemoved.slice(0, 10).forEach(e => console.log(`  REMOVE: "${e}"`));
}

// Re-sort and reassign IDs for all four
console.log('\n--- Re-sorting and reassigning IDs ---');
resortAndReassign(hindi.cards, 'hi', hindi.deckPath);
resortAndReassign(swedish.cards, 'sv', swedish.deckPath);
resortAndReassign(welsh.cards, 'cy', welsh.deckPath);
resortAndReassign(turkish.cards, 'tr', turkish.deckPath);

console.log('\n=== SUMMARY ===');
console.log(`Hindi: ${hindi.origCount} → ${hindi.cards.length} (${hindi.genderFixes} gender fixes, ${hindi.prRiyaFixes} PrRiya fixes)`);
console.log(`Swedish: ${swedish.origCount} → ${swedish.cards.length} (${swedish.suffixFixes} suffix fixes, ${swedish.removedNonsense} nonsense removed)`);
console.log(`Welsh: ${welsh.origCount} → ${welsh.cards.length} (${welsh.removed} word-salad removed)`);
console.log(`Turkish: ${turkish.origCount} → ${turkish.cards.length} (${turkish.removed + trExtra} garbage removed)`);
