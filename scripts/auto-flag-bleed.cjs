/**
 * Automated heuristic flagging for context-bleed in dictionary entries.
 * Flags entries where `en` looks like leaked context rather than a clean definition.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

// Common English articles/prepositions/pronouns that shouldn't appear as standalone defs
// unless the source word IS an article/preposition
const LEAKED_ARTICLES = /^(the|a|an) /i;
const SENTENCE_FRAGMENTS = /\b(is |are |was |were |has |have |had |will |would |could |should |can |do |does |did |i |you |we |they |he |she |it |my |your |his |her |our |their |there |this |that |these |those |what |when |where |how |why |who |which )/i;

// Words that are clearly not definitions when appearing in en field
const JUNK_WORDS = ['good morning', 'good night', 'good afternoon', 'good evening', 'how are you', 'thank you', 'excuse me', 'of course', 'let\'s go'];

// POS-based checks: these POS should NOT have articles in their en definition
const NO_ARTICLE_POS = ['v', 'adj', 'adv', 'prep', 'conj', 'det', 'pron'];

function flagEntry(entry, lang) {
  const { word, en, pos } = entry;
  const issues = [];
  const enLower = en.toLowerCase();
  const enParts = en.split(',').map(p => p.trim());

  // 1. Definition starts with leaked article (but source word is not a det/article)
  if (LEAKED_ARTICLES.test(en) && pos !== 'det' && pos !== 'art') {
    // Allow "the" for some nouns that need it – skip if it's like "the + one word"
    // Flag if it's "the X" where X alone would be the definition
    const withoutArticle = en.replace(/^(the|a|an)\s+/i, '');
    if (withoutArticle !== en) {
      issues.push({ type: 'leaked_article', detail: `starts with article: "${en}"` });
    }
  }

  // 2. Comma parts are NOT synonyms – check for sentence-fragment-like comma splits
  if (enParts.length >= 2) {
    // Check if parts look like unrelated words (not synonyms)
    // Heuristic: if one part is a common function word and the other is a content word
    const functionWords = new Set(['the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'is', 'are', 'was', 'it', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'his', 'her', 'our', 'their', 'this', 'that', 'not', 'do', 'does', 'did', 'has', 'have', 'had', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'shall', 'must', 'be', 'been', 'being', 'up', 'out', 'off', 'over', 'under', 'after', 'before', 'between', 'through', 'about', 'into', 'during', 'very', 'too', 'also', 'just', 'only', 'now', 'then', 'here', 'there', 'still', 'already', 'yet', 'again', 'back', 'away', 'down', 'more', 'less', 'much', 'many', 'some', 'any', 'no', 'all', 'each', 'every', 'both', 'few', 'several', 'own', 'same', 'other', 'another', 'new', 'old', 'big', 'small', 'long', 'short', 'good', 'bad', 'great', 'high', 'low', 'right', 'wrong', 'next', 'last', 'first', 'second', 'third']);

    for (let i = 0; i < enParts.length; i++) {
      const part = enParts[i].toLowerCase();
      if (functionWords.has(part) && enParts.length <= 3) {
        // A comma-separated list with a lone function word is suspicious
        issues.push({ type: 'comma_function_word', detail: `comma part "${enParts[i]}" is a function word` });
        break;
      }
    }
  }

  // 3. Definition is very long (>60 chars) – likely a phrase/sentence
  if (en.length > 60) {
    issues.push({ type: 'too_long', detail: `definition is ${en.length} chars` });
  }

  // 4. Definition contains pronouns/verbs suggesting a sentence fragment
  // Only flag if the source word is NOT a pronoun/verb
  if (pos !== 'pron' && pos !== 'v') {
    if (/^(i |you |we |they |he |she |it )/i.test(en)) {
      issues.push({ type: 'sentence_fragment', detail: `starts with pronoun: "${en}"` });
    }
  }

  // 5. Definition repeats the source word's language (Spanish/Italian/French/Portuguese words in en)
  // This is hard to detect generically, skip for now

  // 6. Empty or trivially short definition
  if (en.length <= 1) {
    issues.push({ type: 'empty', detail: 'definition too short' });
  }

  // 7. Definition has "to" prefix for non-verbs
  if (/^to /i.test(en) && pos && pos !== 'v') {
    issues.push({ type: 'wrong_pos_to', detail: `"to X" but pos=${pos}` });
  }

  // 8. Definition ends with trailing comma or has leading/trailing spaces
  if (en.endsWith(',') || en.startsWith(' ') || en.endsWith(' ')) {
    issues.push({ type: 'formatting', detail: 'trailing comma or whitespace' });
  }

  // 9. Multiple commas with diverse semantic fields (heuristic: >3 comma parts)
  if (enParts.length > 4) {
    issues.push({ type: 'too_many_meanings', detail: `${enParts.length} comma parts` });
  }

  // 10. Check for leaked "not" – common in context bleed
  if (/^not /i.test(en) && pos !== 'adv' && pos !== 'adj' && !word.match(/^(no|ni|ne|non|sin|sem|ohne|niet)/)) {
    issues.push({ type: 'leaked_not', detail: `starts with "not"` });
  }

  return issues.length > 0 ? issues : null;
}

for (const lang of ['es', 'it', 'fr', 'pt']) {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  const flagged = [];

  for (const entry of entries) {
    const issues = flagEntry(entry, lang);
    if (issues) {
      flagged.push({ ...entry, issues });
    }
  }

  fs.writeFileSync(
    path.join(OUTPUT, `${lang}-flagged.json`),
    JSON.stringify(flagged, null, 2)
  );
  console.log(`${lang}: ${entries.length} total, ${flagged.length} flagged`);
}
