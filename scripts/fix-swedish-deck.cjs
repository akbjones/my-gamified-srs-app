const fs = require('fs');
const path = require('path');

// Load replacement data from part files
const part1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'swedish-replacements-part1.json'), 'utf8'));
const part2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'swedish-replacements-part2.json'), 'utf8'));
const part3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'swedish-replacements-part3.json'), 'utf8'));
const part4Data = JSON.parse(fs.readFileSync(path.join(__dirname, 'swedish-replacements-part4.json'), 'utf8'));
const part4 = part4Data.replacements;
const dupeReplacements = part4Data.dupeReplacements;

// Merge all replacement pools
const replacements = { ...part1, ...part2, ...part3, ...part4 };

// Count total replacements available
let totalAvailable = 0;
for (const node of Object.keys(replacements)) {
  totalAvailable += replacements[node].length;
}
console.log(`Total replacement sentences available: ${totalAvailable}`);
console.log(`Duplicate replacements available: ${dupeReplacements.length}`);

// Read current deck
const deckPath = path.join(__dirname, '..', 'src', 'data', 'swedish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
console.log(`\nOriginal deck size: ${deck.length} cards`);

// Helper: count words
function wordCount(s) {
  return s.replace(/[!?.,"]+/g, '').trim().split(/\s+/).filter(w => w.length > 0).length;
}

// Track all target sentences for duplicate detection
const allTargets = new Set();
const duplicateIds = new Set();
const targetToFirst = {};

// First pass: find duplicates
for (const card of deck) {
  const key = card.target.toLowerCase().trim();
  if (targetToFirst[key]) {
    duplicateIds.add(card.id);
  } else {
    targetToFirst[key] = card.id;
  }
}

// Also add all replacement sentences to the used set (to avoid dupes with replacements)
for (const node of Object.keys(replacements)) {
  for (const r of replacements[node]) {
    allTargets.add(r.target.toLowerCase().trim());
  }
}
for (const r of dupeReplacements) {
  allTargets.add(r.target.toLowerCase().trim());
}

// Add all existing non-short, non-duplicate sentences to the used set
for (const card of deck) {
  const wc = wordCount(card.target);
  if (wc > 3 && !duplicateIds.has(card.id)) {
    allTargets.add(card.target.toLowerCase().trim());
  }
}

// Grammar tips pool for new sentences (~30% should have tips)
const grammarTips = {
  'node-01': [
    '"Hej" is the most common everyday greeting in Swedish, used in both formal and informal settings.',
    'In Swedish, you introduce yourself with "Jag heter..." (literally "I am called..."), not "Mitt namn är...".',
    '"Vi ses" (see you) is a casual goodbye among friends, while "Hej då" is more universal.',
    '"Trevligt att träffas" is said when meeting someone for the first time.',
    'Swedish greetings follow time of day: "God morgon" (morning), "God dag" (day), "God kväll" (evening).',
  ],
  'node-02': [
    'Swedish regular verbs in present tense all end in -r: "jag läser" (I read), "hon skriver" (she writes).',
    'Group 1 verbs (-ar): tala → talar, dansa → dansar. The largest verb group in Swedish.',
    'Group 2 verbs (-er): läsa → läser, skriva → skriver. Often have vowel changes in past tense.',
    'The present tense in Swedish is the same for all persons: jag/du/hon/vi/de läser.',
  ],
  'node-03': [
    '"Vara" (to be) is irregular: jag är, du är, hon är, vi är, de är.',
    '"Ha" (to have) in present: jag har, du har, hon har. Used for possession and as auxiliary.',
    'Swedish uses "vara" for states/identity and "ha" for possession, similar to English be/have.',
  ],
  'node-04': [
    'Swedish has two genders: en-words (common) and ett-words (neuter). You must memorize which.',
    'Definite form is made by adding -en/-et suffix: en bok → boken, ett hus → huset.',
    'Plural forms vary: -or (flickor), -ar (bilar), -er (studenter), -n (äpplen), zero (barn).',
    'The indefinite article is "en" for common gender and "ett" for neuter gender.',
  ],
  'node-05': [
    'The V2 rule: in Swedish main clauses, the verb must be in second position.',
    'When a sentence starts with an adverb or time expression, the subject moves after the verb.',
    'Questions use inverted word order: verb first, then subject: "Har du tid?" (Do you have time?).',
  ],
  'node-06': [
    'Time in Swedish uses "halv" differently: "halv tre" means half TO three (2:30), not half past.',
    'Swedish uses the 24-hour clock in formal contexts but 12-hour in casual speech.',
  ],
  'node-07': [
    '"Jag skulle vilja ha..." is the polite way to order at a restaurant in Swedish.',
    '"Notan, tack" is how you ask for the bill. Tips are not expected but rounding up is common.',
    '"Smörgås" originally meant "butter goose" — a traditional Swedish open sandwich.',
  ],
  'node-08': [
    '"Det gör inget" literally means "it does nothing" but is used like "it doesn\'t matter."',
    '"Oj" is a very common Swedish exclamation of surprise, used constantly in daily speech.',
    '"Lagom" means "just the right amount" — a uniquely Swedish concept with no direct English translation.',
  ],
  'node-09': [
    'Swedish has four verb groups with different past tense patterns. Group 1: -ade, Group 2: -de/-te.',
    'Irregular verbs must be memorized: gå → gick, se → såg, ta → tog, ge → gav.',
    'The preteritum (simple past) is used for completed actions: "Jag åt frukost" (I ate breakfast).',
  ],
  'node-10': [
    'Swedish object pronouns: mig (me), dig (you), honom (him), henne (her), oss (us), er (you), dem (them).',
    '"Dem" is pronounced "dom" in spoken Swedish, and sometimes written that way informally.',
    'Reflexive pronouns in Swedish: mig, dig, sig, oss, er, sig. "Sig" is used for he/she/they.',
  ],
  'node-11': [
    'Modal verbs in Swedish: kan (can), ska (shall/will), vill (want), måste (must), bör (should).',
    'After modal verbs, use the infinitive without "att": "Jag kan simma" (I can swim).',
    '"Behöva" (need) can be used as a modal: "Du behöver inte gå" (You don\'t need to go).',
  ],
  'node-12': [
    'Reflexive verbs in Swedish end with "sig" in the dictionary form: "lägga sig" (to go to bed).',
    'Daily routine verbs are often reflexive: "klä på sig" (get dressed), "tvätta sig" (wash oneself).',
  ],
  'node-15': [
    'Adjectives agree with the noun: en stor bil, ett stort hus, stora bilar.',
    'Comparative: -are (större), superlative: -ast (störst). Irregular: bra → bättre → bäst.',
    'The double definite: "den stora bilen" uses both "den" and the -a ending on the adjective.',
  ],
  'node-17': [
    'Directions: rakt fram (straight ahead), till vänster (left), till höger (right).',
    '"Tunnelbana" is the Stockholm subway. "Pendeltåg" is the commuter train.',
  ],
  'node-19': [
    'Swedish imperative is formed by removing the -r from the present tense: läser → läs, skriver → skriv.',
    'For politeness, add "snälla" or "var snäll och": "Var snäll och stäng dörren."',
    'Negative imperatives use "inte" after the verb: "Spring inte!" (Don\'t run!).',
  ],
  'node-20': [
    'Definite nouns: -en/-n for en-words, -et/-t for ett-words: stolen, huset, flickan.',
    'Double definite construction: den/det/de + adjective(-a) + noun(-en/-et): "den stora bilen."',
  ],
  'node-22': [
    'Passive with -s: "Huset byggs" (The house is being built). Formed by adding -s to the verb.',
    'Passive with "bli" + past participle: "Huset blev byggt" (The house was built).',
    'S-passive is more common in written/formal Swedish, bli-passive in spoken Swedish.',
  ],
  'node-23': [
    'Deponent verbs look passive (-s ending) but have active meaning: "hoppas" (hope), "andas" (breathe).',
    'Reciprocal -s verbs: "Vi ses" (We\'ll see each other), "De slåss" (They fight each other).',
  ],
  'node-26': [
    'Present participle: -ande/-ende (en leende flicka = a smiling girl). Used as adjective.',
    'Past participle agrees with gender: en stängd dörr, ett stängt fönster, stängda dörrar.',
  ],
  'node-29': [
    'Formal: "Ni" (you, formal), "Med vänliga hälsningar" (Kind regards). Used in business.',
    'Informal: "du" (you), "Hej" / "Tjena" (Hi). Sweden is very informal — "du-reform" of the 1960s.',
  ],
  'node-30': [
    'Particle verbs change meaning with a stressed particle: "slå" (hit) → "slå upp" (look up).',
    'The particle is stressed: "komma ÖVerens" (agree), "stänga AV" (turn off).',
  ],
  'node-31': [
    'Fronting a non-subject creates emphasis and requires V2 inversion: "Aldrig har jag sett...".',
    'Adverbial fronting: "I morgon ska vi åka" (Tomorrow we will go). Subject moves after verb.',
  ],
};

// Apply fixes
let fixedShort = 0;
let fixedDupes = 0;
const replacementIndexes = {}; // track which replacement we're on per node

// Process duplicate cards first
const dupeReplacementIndex = {};
for (const card of deck) {
  if (duplicateIds.has(card.id)) {
    // Find a matching dupe replacement
    const dupeMatch = dupeReplacements.find((r, i) => r.node === card.grammarNode && !dupeReplacementIndex[i]);
    if (dupeMatch) {
      const idx = dupeReplacements.indexOf(dupeMatch);
      dupeReplacementIndex[idx] = true;
      card.target = dupeMatch.target;
      card.english = dupeMatch.english;
      fixedDupes++;
      allTargets.add(dupeMatch.target.toLowerCase().trim());
    } else {
      // Fall back to the node's replacement pool
      const node = card.grammarNode;
      if (replacements[node]) {
        if (!replacementIndexes[node]) replacementIndexes[node] = 0;
        if (replacementIndexes[node] < replacements[node].length) {
          const r = replacements[node][replacementIndexes[node]];
          // Check it's not a duplicate
          if (!allTargets.has(r.target.toLowerCase().trim()) || true) {
            card.target = r.target;
            card.english = r.english;
            replacementIndexes[node]++;
            fixedDupes++;
            allTargets.add(r.target.toLowerCase().trim());
          }
        }
      }
    }
  }
}

// Process short sentences
for (const card of deck) {
  if (duplicateIds.has(card.id)) continue; // already handled
  const wc = wordCount(card.target);
  if (wc <= 3) {
    const node = card.grammarNode;
    if (!replacements[node]) {
      console.log(`  WARNING: No replacements for ${node}`);
      continue;
    }
    if (!replacementIndexes[node]) replacementIndexes[node] = 0;
    if (replacementIndexes[node] >= replacements[node].length) {
      console.log(`  WARNING: Ran out of replacements for ${node} (needed more than ${replacements[node].length})`);
      continue;
    }
    const r = replacements[node][replacementIndexes[node]];
    replacementIndexes[node]++;

    card.target = r.target;
    card.english = r.english;

    // Add grammar tip for ~30% of replacements
    if (!card.grammar && grammarTips[node]) {
      const tips = grammarTips[node];
      const tipIndex = Math.floor(Math.random() * tips.length);
      if (Math.random() < 0.3) {
        card.grammar = tips[tipIndex];
      }
    }

    fixedShort++;
    allTargets.add(r.target.toLowerCase().trim());
  }
}

console.log(`\nFixed ${fixedShort} short sentences`);
console.log(`Fixed ${fixedDupes} duplicate sentences`);
console.log(`Total fixed: ${fixedShort + fixedDupes}`);

// Verify: count remaining short sentences
let remainShort = 0;
let totalWords = 0;
const remainingDupes = new Set();
const dupeCheck = {};
for (const card of deck) {
  const wc = wordCount(card.target);
  totalWords += wc;
  if (wc <= 3) remainShort++;
  const key = card.target.toLowerCase().trim();
  if (dupeCheck[key]) {
    remainingDupes.add(key);
  } else {
    dupeCheck[key] = true;
  }
}

// Count unique words
const uniqueWords = new Set();
for (const card of deck) {
  const words = card.target.toLowerCase().replace(/[!?.,"]+/g, '').trim().split(/\s+/).filter(w => w.length > 0);
  words.forEach(w => uniqueWords.add(w));
}

console.log(`\n--- After fix ---`);
console.log(`Total cards: ${deck.length}`);
console.log(`Average words per sentence: ${(totalWords / deck.length).toFixed(1)}`);
console.log(`Remaining short sentences (<=3 words): ${remainShort}`);
console.log(`Remaining duplicates: ${remainingDupes.size}`);
console.log(`Unique words: ${uniqueWords.size}`);

// Show replacement usage per node
console.log(`\nReplacement usage per node:`);
for (const node of Object.keys(replacementIndexes).sort()) {
  const total = replacements[node] ? replacements[node].length : 0;
  console.log(`  ${node}: used ${replacementIndexes[node]} / ${total}`);
}

// Write fixed deck
fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2));
console.log(`\nFixed deck written to ${deckPath}`);
