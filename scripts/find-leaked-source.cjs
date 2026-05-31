#!/usr/bin/env node
/**
 * Find cards where the English translation contains words from the source language.
 * Indicates AI translation gave up partially or used loanwords without translating.
 *
 * Heuristic: split English into tokens; find any token (>=4 letters) that is also
 * a frequent word in the source language's dictionary. Flag cards with such leaked
 * source-language tokens.
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
const FREQ = {
  spanish: 'scripts/frequency-es.json', french: 'scripts/frequency-fr.json',
  italian: 'scripts/frequency-it.json', portuguese: 'scripts/frequency-pt.json',
  german: 'scripts/frequency-de.json', dutch: 'scripts/frequency-nl.json',
  swedish: 'scripts/frequency-sv.json', welsh: 'scripts/frequency-cy.json',
  hindi: 'scripts/frequency-hi.json', turkish: 'scripts/frequency-tr.json',
  russian: 'scripts/frequency-ru.json',
};

// English stopwords + common loanwords that legitimately appear (don't flag)
const COMMON_EN = new Set('the a an and or but in on at to from of for with by as is are was were be been being have has had do does did will would could should may might must can a so if then than but'.split(/\s+/));
// Cross-lang loanwords that are fine to leave (these appear in many decks)
const ALLOWED_LOANS = new Set([
  // Italian / French food
  'pizza','pasta','spaghetti','risotto','espresso','cappuccino','tiramisu','baguette','croissant','crepe','crepes','souffle',
  // Cultural concepts
  'siesta','samurai','sushi','origami','fjord','sauna','pho','tofu','wasabi',
  // Common cognates
  'piano','guitar','radio','taxi','metro','sushi','chocolate','banana','tomato','potato',
  // Currency / units
  'lira','euro','dollar','peso','rupee','ruble','rouble','yen',
  // Place words
  'paris','berlin','madrid','rome','moscow','beijing','tokyo','london',
  // Proper nouns + culture
  'ramadan','diwali','holi','navratri','onam','bihu','lohri','baisakhi','chai','dolma','kebab','mezze','tapas','paella',
  'borek','baklava','simit','raki','meze','ayran','salep','testi','iftar','sahur','köfte','dolma','manti','lahmacun','pide',
  'kvass','pelmeni','borscht','blini','pirog','kasha','khinkali','dacha',
  'matcha','kombucha','onigiri','ramen','udon','chai','lassi','samosa','idli','dosa','paratha','khichdi','jamun','ghee',
  'sari','dhoti','khadi','sari','salwar','kurta','dupatta','rupee','crore','lakh',
]);

const summary = {};

for (const [lang, deckPath] of Object.entries(DECKS)) {
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const freq = JSON.parse(fs.readFileSync(FREQ[lang], 'utf8'));
  // Build a set of common source-language words (top 2000 most-frequent)
  const top2k = new Set(freq.slice(0, 2000).map(e => e.key.toLowerCase()));

  const flagged = [];
  for (const card of deck) {
    const en = (card.english || '').toLowerCase();
    // Tokenize English (simple word split)
    const tokens = en.split(/[\s,!?;:.()'"’‘]+/).filter(t => t.length >= 4);
    const leaked = [];
    for (const t of tokens) {
      // Skip English common words and known loanwords
      if (COMMON_EN.has(t)) continue;
      if (ALLOWED_LOANS.has(t)) continue;
      // Flag if token appears in top-2000 source-lang frequency
      if (top2k.has(t)) {
        // Extra check: ignore if token is also a real English word
        // (heuristic: avoid pure-Latin tokens that are likely English)
        // For Cyrillic/Devanagari, they wouldn't pass this filter anyway
        if (lang === 'german' && /^[a-z]{4,}$/.test(t)) {
          // Many short German words look like English. Skip too noisy.
          continue;
        }
        leaked.push(t);
      }
    }
    if (leaked.length > 0) {
      flagged.push({ id: card.id, target: card.target, english: card.english, leaked });
    }
  }

  summary[lang] = flagged.length;
  fs.writeFileSync(`/tmp/leaked-${lang}.json`, JSON.stringify(flagged, null, 2));
}

console.log('Untranslated source-language words leaked into English translation:');
console.log();
for (const [lang, n] of Object.entries(summary)) {
  console.log('  ' + lang.padEnd(11) + ' ' + n + ' cards');
}
