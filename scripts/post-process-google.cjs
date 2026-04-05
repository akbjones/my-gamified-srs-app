#!/usr/bin/env node
/**
 * Post-processing pipeline for Google Translate output.
 *
 * 16 rules applied in sequence:
 *  1. HTML entity decoding
 *  2. Truncated output detection
 *  3. Romanization detection
 *  4. Lowercase first letter
 *  5. Strip leading articles
 *  6. Strip leading pronouns
 *  7. Strip negation (don't/doesn't/didn't)
 *  8. Lemmatize verbs (+ prepend "to ")
 *  9. Lemmatize nouns (singularize)
 * 10. Fragment trim (>3 words → keep first 2 content words)
 * 11. Wrong POS detection
 * 12. Function word as definition
 * 13. Duplicate detection
 * 14. Length sanity (cap 50 chars)
 * 15. Source language chars in output
 * 16. Very long relative to source
 *
 * Usage:
 *   const { postProcess, PostProcessStats } = require('./post-process-google.cjs');
 *   const result = postProcess(rawTranslation, pos, sourceWord, stats);
 */

const { lemmatize } = require('./english-lemmatizer.cjs');

// ─── HTML entity map ────────────────────────────────────────────────────────

const HTML_ENTITIES = {
  '&#39;': "'", '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>',
  '&#x27;': "'", '&apos;': "'", '&nbsp;': ' ', '&#34;': '"',
  '&#38;': '&', '&#60;': '<', '&#62;': '>', '&#160;': ' ',
  '&ldquo;': '\u201C', '&rdquo;': '\u201D', '&lsquo;': '\u2018',
  '&rsquo;': '\u2019', '&mdash;': '\u2014', '&ndash;': '\u2013',
  '&hellip;': '\u2026', '&copy;': '\u00A9', '&reg;': '\u00AE',
  '&trade;': '\u2122', '&deg;': '\u00B0', '&plusmn;': '\u00B1',
  '&times;': '\u00D7', '&divide;': '\u00F7', '&micro;': '\u00B5',
  '&cent;': '\u00A2', '&pound;': '\u00A3', '&euro;': '\u20AC',
  '&yen;': '\u00A5',
};

// ─── Known function words ───────────────────────────────────────────────────

const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'under', 'over', 'and', 'but', 'or', 'nor', 'so', 'yet', 'if', 'than',
  'that', 'this', 'these', 'those', 'it', 'its', 'do', 'does', 'did',
  'has', 'had', 'have', 'will', 'would', 'shall', 'should', 'may', 'might',
  'can', 'could', 'must', 'not', 'no', 'as', 'very', 'much', 'more', 'most',
  'just', 'also', 'too', 'quite', 'rather', 'really', 'still', 'even',
  'only', 'well', 'then', 'now', 'here', 'there', 'when', 'where', 'how',
  'all', 'each', 'every', 'both', 'few', 'many', 'some', 'any', 'such',
]);

// Known common nouns (for wrong-POS detection)
const KNOWN_NOUNS = new Set([
  'house', 'car', 'dog', 'cat', 'book', 'tree', 'water', 'food', 'man',
  'woman', 'child', 'day', 'night', 'time', 'year', 'people', 'way',
  'thing', 'place', 'hand', 'head', 'eye', 'face', 'room', 'door',
  'table', 'chair', 'bed', 'floor', 'wall', 'window', 'road', 'street',
  'city', 'town', 'world', 'country', 'school', 'family', 'mother',
  'father', 'brother', 'sister', 'friend', 'money', 'work', 'life',
  'name', 'word', 'number', 'part', 'group', 'problem', 'fact',
  'morning', 'evening', 'garden', 'kitchen', 'market', 'office',
  'village', 'river', 'mountain', 'forest', 'island', 'bridge',
  'temple', 'church', 'mosque', 'hospital', 'station', 'field',
  'flower', 'fruit', 'milk', 'bread', 'rice', 'tea', 'coffee',
  'sugar', 'salt', 'oil', 'butter', 'egg', 'meat', 'fish',
  'clothes', 'shirt', 'dress', 'shoe', 'hat', 'bag', 'box',
  'glass', 'cup', 'plate', 'knife', 'spoon', 'key', 'phone',
  'letter', 'paper', 'picture', 'music', 'song', 'story', 'game',
  'light', 'fire', 'earth', 'air', 'rain', 'snow', 'wind', 'sun',
  'moon', 'star', 'cloud', 'stone', 'gold', 'silver', 'iron',
  'king', 'queen', 'god', 'heart', 'blood', 'bone', 'skin',
  'hair', 'tooth', 'foot', 'arm', 'leg', 'finger', 'nose', 'ear',
  'mouth', 'shoulder', 'neck', 'back', 'stomach', 'chest',
]);

// ─── Devanagari / Arabic / CJK / Cyrillic ranges for source char detection ─

const NON_LATIN_RANGES = [
  /[\u0900-\u097F]/,  // Devanagari
  /[\u0600-\u06FF]/,  // Arabic
  /[\u0400-\u04FF]/,  // Cyrillic
  /[\u4E00-\u9FFF]/,  // CJK
  /[\u3040-\u309F]/,  // Hiragana
  /[\u30A0-\u30FF]/,  // Katakana
  /[\uAC00-\uD7AF]/,  // Korean
  /[\u0980-\u09FF]/,  // Bengali
  /[\u0A80-\u0AFF]/,  // Gujarati
  /[\u0B00-\u0B7F]/,  // Oriya
  /[\u0B80-\u0BFF]/,  // Tamil
  /[\u0C00-\u0C7F]/,  // Telugu
  /[\u0C80-\u0CFF]/,  // Kannada
  /[\u0D00-\u0D7F]/,  // Malayalam
  /[\u0E00-\u0E7F]/,  // Thai
];

/**
 * Stats tracker for post-processing rules.
 */
class PostProcessStats {
  constructor() {
    this.counts = {
      html_entities: 0,
      truncated: 0,
      romanization: 0,
      lowercased: 0,
      stripped_article: 0,
      stripped_pronoun: 0,
      stripped_negation: 0,
      lemmatized_verb: 0,
      lemmatized_noun: 0,
      fragment_trimmed: 0,
      wrong_pos: 0,
      function_word_def: 0,
      duplicate: 0,
      length_capped: 0,
      source_chars: 0,
      too_long: 0,
    };
    this.flagged = new Set();
    this.translationCounts = new Map(); // track duplicates
    this.details = {}; // rule → [word, ...]
    for (const key of Object.keys(this.counts)) {
      this.details[key] = [];
    }
  }

  hit(rule, word) {
    this.counts[rule]++;
    if (this.details[rule].length < 20) { // keep up to 20 examples
      this.details[rule].push(word);
    }
  }

  flag(word, reason) {
    this.flagged.add(word + '|' + reason);
  }

  trackTranslation(word, translation) {
    const t = translation.toLowerCase().trim();
    if (!this.translationCounts.has(t)) this.translationCounts.set(t, []);
    this.translationCounts.get(t).push(word);
  }

  getDuplicates(threshold = 10) {
    const dupes = [];
    for (const [trans, words] of this.translationCounts.entries()) {
      if (words.length >= threshold) {
        dupes.push({ translation: trans, count: words.length, sample: words.slice(0, 5) });
      }
    }
    return dupes;
  }

  report() {
    const lines = ['=== Post-Processing Report ==='];
    for (const [rule, count] of Object.entries(this.counts)) {
      if (count > 0) {
        lines.push(`  ${rule}: ${count}`);
        if (this.details[rule].length > 0) {
          lines.push(`    examples: ${this.details[rule].slice(0, 5).join(', ')}`);
        }
      }
    }
    lines.push(`  total_flagged: ${this.flagged.size}`);
    const dupes = this.getDuplicates();
    if (dupes.length > 0) {
      lines.push(`  duplicate_translations (10+): ${dupes.length}`);
      for (const d of dupes.slice(0, 5)) {
        lines.push(`    "${d.translation}" → ${d.count} entries`);
      }
    }
    return lines.join('\n');
  }
}

/**
 * Apply all 16 post-processing rules to a Google Translate output.
 *
 * @param {string} raw - Raw translation from Google
 * @param {string} pos - Part of speech ('n', 'v', 'adj', 'adv', etc.)
 * @param {string} sourceWord - Original source-language word
 * @param {PostProcessStats} stats - Stats tracker
 * @returns {{ text: string, flagged: boolean, flagReasons: string[] }}
 */
function postProcess(raw, pos, sourceWord, stats) {
  if (!raw || typeof raw !== 'string') {
    return { text: '?', flagged: true, flagReasons: ['empty_input'] };
  }

  let text = raw.trim();
  const flagReasons = [];

  // ── Rule 1: HTML entities ──
  let hadEntity = false;
  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    if (text.includes(entity)) {
      text = text.split(entity).join(replacement);
      hadEntity = true;
    }
  }
  // Also decode numeric entities
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  if (hadEntity) {
    stats.hit('html_entities', sourceWord);
  }

  // ── Rule 2: Truncated output ──
  if (text.length < 4 && !/^[a-z]{2,3}$/i.test(text)) {
    stats.hit('truncated', sourceWord);
    stats.flag(sourceWord, 'truncated');
    flagReasons.push('truncated');
    // Don't return yet — still apply other rules
  }

  // ── Rule 3: Romanization detection ──
  if (sourceWord && text.length >= 3) {
    const srcLower = sourceWord.toLowerCase().replace(/[^a-z]/g, '');
    const txtLower = text.toLowerCase().replace(/[^a-z]/g, '');
    if (srcLower.length >= 3 && txtLower.length >= 3) {
      // Check character overlap
      const srcChars = new Set(srcLower.split(''));
      const txtChars = new Set(txtLower.split(''));
      let overlap = 0;
      for (const c of txtChars) {
        if (srcChars.has(c)) overlap++;
      }
      const overlapRatio = overlap / Math.max(txtChars.size, 1);
      // Also check if they look very similar (Levenshtein-like)
      if (overlapRatio > 0.7 && Math.abs(srcLower.length - txtLower.length) < 3) {
        stats.hit('romanization', sourceWord);
        stats.flag(sourceWord, 'romanization');
        flagReasons.push('romanization');
      }
    }
  }

  // ── Rule 5: Strip leading articles (before lowercasing so "The X" → "X") ──
  const articleMatch = text.match(/^(the|a|an)\s+(.+)$/i);
  if (articleMatch) {
    text = articleMatch[2];
    stats.hit('stripped_article', sourceWord);
  }

  // ── Rule 4: Lowercase first letter ──
  if (text.length > 0 && text[0] !== text[0].toLowerCase()) {
    // Don't lowercase proper nouns (very simple heuristic: single capitalized word that looks like a name)
    // Only keep capitalization for explicit proper nouns (person/place names)
    // Google Translate capitalizes all single-word responses, so we aggressively lowercase
    const isProperNoun = false; // We always lowercase; proper nouns can be handled manually
    if (!isProperNoun) {
      text = text[0].toLowerCase() + text.slice(1);
      stats.hit('lowercased', sourceWord);
    }
  }

  // ── Rule 6: Strip leading pronouns ──
  const pronounMatch = text.match(/^(i|we|they|he|she|you|it)\s+(.+)$/i);
  if (pronounMatch) {
    text = pronounMatch[2];
    stats.hit('stripped_pronoun', sourceWord);
  }

  // ── Rule 7: Strip negation ──
  const negMatch = text.match(/^(don'?t|doesn'?t|didn'?t|cannot|can'?t|won'?t|wouldn'?t|shouldn'?t|couldn'?t|isn'?t|aren'?t|wasn'?t|weren'?t)\s+(.+)$/i);
  if (negMatch) {
    text = negMatch[2];
    stats.hit('stripped_negation', sourceWord);
  }

  // ── Rule 8: Lemmatize verbs ──
  // ── Rule 8a: Proper noun detection ──
  // If Google returned a single word that looks like a proper noun (city, name, festival)
  // AND it matches the source word transliterated, capitalize it and skip verb processing
  const singleWord = text.replace(/^to\s+/, '').trim();
  if (singleWord.length >= 3 && /^[a-z]+$/i.test(singleWord)) {
    const rawTrimmed = raw.trim();
    if (rawTrimmed.charAt(0) === rawTrimmed.charAt(0).toUpperCase() && rawTrimmed === singleWord.charAt(0).toUpperCase() + singleWord.slice(1)) {
      text = singleWord.charAt(0).toUpperCase() + singleWord.slice(1);
      flagReasons.push('proper_noun');
      return { text, flagged: flagReasons.length > 0, flagReasons };
    }
  }


  // ── Rule 8b: Non-verb word detection ──
  // If Google returned a word that's clearly not a verb, don't add 'to '
  const NOT_VERB_WORDS = new Set([
    'together','morning','evening','afternoon','night','today','tomorrow','yesterday',
    'always','never','often','sometimes','usually','here','there','now','then',
    'very','much','more','less','also','too','just','only','still','already',
    'quickly','slowly','carefully','loudly','quietly','suddenly','immediately',
    'forward','backward','inside','outside','nearby','home','away','back',
    'above','below','between','behind','beside','around','across','along',
    'early','late','fast','hard','well','badly','enough','really','quite',
    'perhaps','maybe','definitely','certainly','probably','unfortunately',
    'approximately','completely','absolutely','exactly','especially','particularly',
    'separately','directly','properly','seriously','honestly','meanwhile',
    'otherwise','instead','however','therefore','moreover','apart','everywhere',
    'daily','weekly','monthly','yearly','regularly','occasionally','finally',
  ]);
  const googleWord = text.replace(/^to\s+/, '').trim().toLowerCase();
  if (NOT_VERB_WORDS.has(googleWord)) {
    text = text.replace(/^to\s+/, '');
    stats.hit('stripped_false_to', sourceWord);
  }

  if (pos === 'v') {
    // Remove "to " prefix if already present
    let verbText = text.replace(/^to\s+/, '');
    const words = verbText.split(/\s+/);
    if (words.length <= 3) {
      const lemma = lemmatize(words[0], 'v');
      if (lemma !== words[0].toLowerCase()) {
        words[0] = lemma;
        stats.hit('lemmatized_verb', sourceWord);
      }
      verbText = words.join(' ');
    }
    text = 'to ' + verbText;
  }

  // ── Rule 9: Lemmatize nouns ──
  if (pos === 'n') {
    const words = text.split(/\s+/);
    // Singularize the last content word (the head noun)
    const lastIdx = words.length - 1;
    const lemma = lemmatize(words[lastIdx], 'n');
    if (lemma !== words[lastIdx].toLowerCase()) {
      words[lastIdx] = lemma;
      stats.hit('lemmatized_noun', sourceWord);
    }
    text = words.join(' ');
  }

  // ── Rule 10: Fragment trim ──
  {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    // For verbs, exclude the leading "to" from the word count
    const countableWords = (pos === 'v' && words[0] === 'to') ? words.slice(1) : words;
    if (countableWords.length > 3) {
      // Keep content words (skip function words)
      const contentWords = countableWords.filter(w => !FUNCTION_WORDS.has(w.toLowerCase()));
      if (contentWords.length > 2) {
        // For verbs, keep "to" + first 2 content words
        if (pos === 'v' && words[0] === 'to') {
          text = 'to ' + contentWords.slice(0, 2).join(' ');
        } else {
          text = contentWords.slice(0, 2).join(' ');
        }
        stats.hit('fragment_trimmed', sourceWord);
      }
    }
  }

  // ── Rule 11: Wrong POS detection ──
  if (pos === 'v') {
    // If output (minus "to ") is a known noun
    const verbCore = text.replace(/^to\s+/, '').toLowerCase();
    if (KNOWN_NOUNS.has(verbCore) && verbCore.length > 3) {
      stats.hit('wrong_pos', sourceWord);
      stats.flag(sourceWord, 'wrong_pos:verb_but_noun');
      flagReasons.push('wrong_pos');
    }
  }
  if (pos === 'n') {
    if (text.startsWith('to ')) {
      stats.hit('wrong_pos', sourceWord);
      stats.flag(sourceWord, 'wrong_pos:noun_but_verb');
      flagReasons.push('wrong_pos');
    }
  }

  // ── Rule 12: Function word as definition ──
  {
    const cleanText = text.replace(/^to\s+/, '').toLowerCase().trim();
    const allWords = cleanText.split(/\s+/);
    const isAllFunction = allWords.every(w => FUNCTION_WORDS.has(w));
    if (isAllFunction && !FUNCTION_WORDS.has(sourceWord)) {
      stats.hit('function_word_def', sourceWord);
      stats.flag(sourceWord, 'function_word_def');
      flagReasons.push('function_word_def');
    }
  }

  // ── Rule 13: Duplicate detection ──
  // (tracked in stats, flagging happens post-hoc via getDuplicates())
  stats.trackTranslation(sourceWord, text);

  // ── Rule 14: Length sanity ──
  if (text.length > 50) {
    text = text.slice(0, 47) + '...';
    // Actually, spec says no trailing "..."
    text = text.replace(/\.{3}$/, '').trim();
    if (text.length > 50) text = text.slice(0, 50);
    stats.hit('length_capped', sourceWord);
  }

  // ── Rule 15: Source language chars in output ──
  for (const pattern of NON_LATIN_RANGES) {
    if (pattern.test(text)) {
      stats.hit('source_chars', sourceWord);
      stats.flag(sourceWord, 'source_chars');
      flagReasons.push('source_chars');
      break;
    }
  }

  // ── Rule 16: Very long relative to source ──
  if (sourceWord && text.length > sourceWord.length * 5 && text.length > 15) {
    // Trim to reasonable length
    const words = text.split(/\s+/);
    if (words.length > 4) {
      if (pos === 'v' && words[0] === 'to') {
        text = words.slice(0, 4).join(' ');
      } else {
        text = words.slice(0, 3).join(' ');
      }
    }
    stats.hit('too_long', sourceWord);
  }

  // Final cleanup
  text = text.trim();
  if (!text || text === 'to') {
    text = '?';
    flagReasons.push('empty_result');
  }

  return {
    text,
    flagged: flagReasons.length > 0,
    flagReasons,
  };
}

module.exports = { postProcess, PostProcessStats };

// Self-test
if (require.main === module) {
  const stats = new PostProcessStats();

  const tests = [
    // Rule 1: HTML entities
    { raw: "don&#39;t know", pos: 'v', src: 'test1', expect: 'to know' },
    // Rule 4+5: Lowercase + strip article
    { raw: "The House", pos: 'n', src: 'test2', expect: 'house' },
    // Rule 6: Strip pronoun
    { raw: "I eat", pos: 'v', src: 'test3', expect: 'to eat' },
    // Rule 7: Strip negation
    { raw: "don't go", pos: 'v', src: 'test4', expect: 'to go' },
    // Rule 8: Lemmatize verb
    { raw: "eaten", pos: 'v', src: 'test5', expect: 'to eat' },
    { raw: "running", pos: 'v', src: 'test6', expect: 'to run' },
    // Rule 9: Lemmatize noun
    { raw: "children", pos: 'n', src: 'test7', expect: 'child' },
    { raw: "countries", pos: 'n', src: 'test8', expect: 'country' },
    // Rule 10: Fragment trim
    { raw: "very large and important building", pos: 'n', src: 'test9', expect: 'large important' },
  ];

  let pass = 0, fail = 0;
  for (const t of tests) {
    const result = postProcess(t.raw, t.pos, t.src, stats);
    if (result.text === t.expect) {
      pass++;
    } else {
      fail++;
      console.log(`FAIL: "${t.raw}" (${t.pos}) → "${result.text}" (expected "${t.expect}")`);
    }
  }
  console.log(`\nResults: ${pass} passed, ${fail} failed out of ${tests.length} tests`);
  console.log('\n' + stats.report());
}
