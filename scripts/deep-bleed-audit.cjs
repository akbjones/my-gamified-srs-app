/**
 * Deep context-bleed audit: checks each entry against known word meanings
 * and looks for patterns that strongly indicate context bleed vs. genuine definitions.
 *
 * True context bleed patterns:
 * 1. Wrong meaning entirely (noun defined as verb it's not related to)
 * 2. Adjacent English words leaked in ("morning, good" for "buenos")
 * 3. Definition includes words from adjacent sentence context
 * 4. "the X" where the article clearly leaked from sentence
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

// Load all entries
const langs = ['es', 'it', 'fr', 'pt'];
const allEntries = {};
for (const lang of langs) {
  allEntries[lang] = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
}

// REAL context bleed detection
function detectRealBleed(entry, lang) {
  const { word, en, pos } = entry;
  const enLower = en.toLowerCase().trim();

  // ====== CATEGORY 1: Wrong meaning entirely ======
  // Nouns with verb definitions they shouldn't have
  const wrongMeaningChecks = getWrongMeaningChecks(lang);
  for (const check of wrongMeaningChecks) {
    if (check.word === word && check.test(en)) {
      return check;
    }
  }

  // ====== CATEGORY 2: Generic wrong-meaning detection ======
  // Noun ending in -tion/-ción/-zione/-ção defined as verb "to X"
  if (lang === 'fr') {
    if (pos === 'n' && /^to /.test(en)) {
      // French nouns ending in -tion, -ence, -ation defined as verbs
      if (/tion$|ence$|ation$|ment$|ure$/.test(word)) {
        return { word, issue: 'noun_as_verb', detail: `French noun "${word}" defined as "${en}" – should be the noun form` };
      }
    }
    // Check for specific known wrong entries
    if (word === 'allusion' && en.includes('over')) {
      return { word, issue: 'context_bleed', detail: `"allusion" means "allusion/reference", not "${en}"` };
    }
    if (word === 'collaboration' && en === 'to stick') {
      return { word, issue: 'wrong_meaning', detail: `"collaboration" means "collaboration/cooperation", not "to stick"` };
    }
    if (word === 'convergence' && en === 'to suit') {
      return { word, issue: 'wrong_meaning', detail: `"convergence" means "convergence", not "to suit"` };
    }
    if (word === 'camping' && en === 'to camp') {
      return { word, issue: 'wrong_meaning', detail: `"camping" (n) means "campsite/camping", not "to camp"` };
    }
    if (word === 'excuse' && en === 'to excuse') {
      return { word, issue: 'wrong_meaning', detail: `"excuse" (n) means "excuse/apology", not "to excuse"` };
    }
    if (word === 'fatigue' && en.includes('after')) {
      return { word, issue: 'context_bleed', detail: `"fatigue" means "fatigue/tiredness", not "${en}"` };
    }
    if (word === 'impatience' && en === 'to grow impatient') {
      return { word, issue: 'wrong_meaning', detail: `"impatience" means "impatience", not "to grow impatient"` };
    }
    if (word === 'intervention' && en === 'to intervene') {
      return { word, issue: 'wrong_meaning', detail: `"intervention" means "intervention/speech", not "to intervene"` };
    }
    if (word === 'parent' && en === 'by, through') {
      return { word, issue: 'wrong_meaning', detail: `"parent" means "parent/relative", not "by, through"` };
    }
    if (word === 'rat' && en.includes('to miss')) {
      return { word, issue: 'wrong_meaning', detail: `"rat" means "rat", not "to miss, to fail"` };
    }
    if (word === 'regret' && en === 'to regret') {
      return { word, issue: 'wrong_meaning', detail: `"regret" (n) means "regret", not "to regret"` };
    }
    if (word === 'vote' && en === 'to vote') {
      return { word, issue: 'wrong_meaning', detail: `"vote" (n) means "vote", not "to vote"` };
    }
    if (word === 'invitations' && en === 'to invite') {
      return { word, issue: 'wrong_meaning', detail: `"invitations" means "invitations", not "to invite"` };
    }
    if (word === 'modifications' && en === 'to modify') {
      return { word, issue: 'wrong_meaning', detail: `"modifications" means "modifications/changes", not "to modify"` };
    }
    if (word === 'variables' && en === 'to vary') {
      return { word, issue: 'wrong_meaning', detail: `"variables" means "variables/changeable", not "to vary"` };
    }
    if (word === 'combien' && en === 'how much, many') {
      return { word, issue: 'context_bleed', detail: `"combien" means "how much, how many" – "many" alone is truncated` };
    }
  }

  if (lang === 'it') {
    if (word === 'nuotatore' && en.includes('to swim')) {
      return { word, issue: 'wrong_meaning', detail: `"nuotatore" means "swimmer", not "to swim"` };
    }
    if (word === 'nutrienti' && en.includes('to nourish')) {
      return { word, issue: 'wrong_meaning', detail: `"nutrienti" means "nutrients", not "to nourish"` };
    }
    if (word === 'parmigiana' && en.includes('to seem')) {
      return { word, issue: 'wrong_meaning', detail: `"parmigiana" means "Parmigiana (eggplant dish)", not "to seem"` };
    }
    if (word === 'programmatore' && en.includes('to plan')) {
      return { word, issue: 'wrong_meaning', detail: `"programmatore" means "programmer", not "to plan"` };
    }
    if (word === 'rivestito' && en.includes('to reveal')) {
      return { word, issue: 'wrong_meaning', detail: `"rivestito" means "covered/coated", not "to reveal"` };
    }
    if (word === 'spinse' && en === 'to push') {
      return { word, issue: 'wrong_pos', detail: `"spinse" is past tense "pushed/pushed", not infinitive "to push"` };
    }
  }

  if (lang === 'es') {
    if (word === 'ahorros' && en.includes('to save')) {
      return { word, issue: 'wrong_meaning', detail: `"ahorros" means "savings", not "to save (money)"` };
    }
    if (word === 'seres' && en.includes('to be')) {
      return { word, issue: 'wrong_meaning', detail: `"seres" means "beings/creatures", not "to be"` };
    }
    if (word === 'cometerlos' && en === 'to commit them') {
      return { word, issue: 'context_bleed', detail: `"cometerlos" = "to commit them" has leaked pronoun; definition should just be "to commit"` };
    }
  }

  return null;
}

function getWrongMeaningChecks(lang) {
  return []; // Handled inline above
}

// Now scan ALL entries for a broader set of issues
function fullScan(entries, lang) {
  const issues = [];

  for (const entry of entries) {
    const { word, en, pos, ipa } = entry;

    // Check for real context bleed
    const bleed = detectRealBleed(entry, lang);
    if (bleed) {
      issues.push({ word, current_en: en, issue: bleed.issue || bleed.detail, pos, ipa });
      continue;
    }

    // Additional generic checks across all languages

    // 1. Definition starts with "the " for a non-determiner
    // Only flag specific cases where "the" clearly leaked
    if (/^the /i.test(en) && !['det', 'art'].includes(pos)) {
      // "the rest" for "demás" is actually correct – "the rest" IS the meaning
      // "the one" for "celui" is correct
      // But "the X" for a regular noun is suspicious
      const afterThe = en.replace(/^the /i, '');
      // Skip known valid "the X" patterns
      const validThePatterns = ['rest', 'one', 'other', 'same', 'following', 'former', 'latter'];
      if (!validThePatterns.some(p => afterThe.toLowerCase().startsWith(p))) {
        issues.push({ word, current_en: en, issue: `leaked "the": should be "${afterThe}"`, pos, ipa });
      }
    }

    // 2. Trailing whitespace/punctuation
    if (en !== en.trim()) {
      issues.push({ word, current_en: en, issue: 'trailing/leading whitespace', pos, ipa });
    }
    if (/[,;]$/.test(en)) {
      issues.push({ word, current_en: en, issue: 'trailing punctuation', pos, ipa });
    }

    // 3. Definition contains parenthetical lemma reference that's wrong
    // e.g., "to seem, to opinion(parere)" – broken definition
    if (/to \w+\(/.test(en)) {
      // Might be ok like "to swim (nuotare)" – check if noun with verb def
      if (pos === 'n' && /^to /.test(en)) {
        issues.push({ word, current_en: en, issue: 'noun defined as verb', pos, ipa });
      }
    }
  }

  return issues;
}

// Run full scan
for (const lang of langs) {
  const results = fullScan(allEntries[lang], lang);
  console.log(`\n${lang.toUpperCase()}: ${allEntries[lang].length} entries, ${results.length} real issues found`);
  for (const r of results) {
    console.log(`  ${r.word}: "${r.current_en}" – ${r.issue}`);
  }
}
