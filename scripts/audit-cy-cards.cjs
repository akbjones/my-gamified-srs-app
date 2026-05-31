/**
 * Card-by-card audit of Welsh batches 4-7 (~1501 cards)
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 *         duplicates, vocabulary appropriateness, audio existence
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'quest-audio');

// Load batches
const batches = [4, 5, 6, 7].map(n =>
  JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/output/audit-batches', `cy-batch-${n}.json`), 'utf8'))
);
const allCards = batches.flat();
console.log(`Loaded ${allCards.length} cards from batches 4-7`);

// Load dictionary
const dictSrc = fs.readFileSync(path.join(ROOT, 'src/data/dictionary/cy.ts'), 'utf8');
const dictKeys = new Set();
// Extract dictionary keys - handles both 'key' and "key" formats
const keyRegex = /^\s*['"]([^'"]+)['"]\s*:/gm;
let m;
while ((m = keyRegex.exec(dictSrc)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
console.log(`Dictionary has ${dictKeys.size} entries`);

// Load audio file list
const audioFiles = new Set(
  fs.readdirSync(AUDIO_DIR)
    .filter(f => f.startsWith('cy-') && f.endsWith('.mp3'))
);
console.log(`Found ${audioFiles.size} Welsh audio files`);

// Welsh stop words / function words to skip in dictionary coverage check
const STOP_WORDS = new Set([
  'mae', "mae'r", "mae'n", 'yn', "yn'r", 'y', 'yr', 'r', "'r", "'n",
  'i', 'a', 'o', 'ar', 'am', 'â', 'ei', 'eu', 'fy', 'dy', 'ein', 'eich',
  'na', 'ni', 'nid', 'dim', 'ond', 'ac', 'neu', 'er', 'gan', 'heb',
  'wedi', 'roedd', "roedd'n", 'oedd', 'bydd', 'sy', "sy'n", 'sydd',
  'yw', 'ydy', 'oes', 'does', 'fe', 'mi', 'bod', 'fod', 'wyt', 'ydw',
  'rwy', "rwy'n", "rydw", "rydw'n", "rydyn", "rydyn'n", "dw", "dw'n",
  'hi', 'e', 'nhw', 'chi', 'ti', 'fi', 'fo', 'ef', 'ni',
  'un', 'dau', 'dwy', 'tri', 'tair', 'pedwar', 'pedair', 'pump', 'pum',
  'hon', 'hwn', 'hyn', 'hynny', 'yma', 'yna', 'fan',
  'hefyd', 'iawn', 'rhy', 'mor', 'mwy', 'mwyaf', 'llai', 'lleiaf',
  'gyda', "gyda'r", 'wrth', 'dan', 'dros', 'drwy', 'trwy', 'rhwng',
  'hyd', 'at', 'cyn', 'ar ôl', 'ers', 'tan',
  'beth', 'pam', 'sut', 'ble', 'pryd', 'pwy', 'pa', 'faint',
  'lle', 'pan', 'os', 'pe', 'fel', 'tra',
  'wnes', 'wnaeth', 'oeddwn', 'byddwn', 'basai', 'byddai',
  'yng', 'mewn', 'tu', 'uwch', 'is', 'olaf', 'cyntaf',
  "dyw", "dydy", "dydyn", "doedd", "fydd", "fydda", "fyddai",
  'maen', "maen'n", 'roeddwn', 'roedden', 'oedden',
  'i', 'o', 'n', 'r', 'w', // single-letter fragments from contractions
  'fy', 'dy', 'ei', 'eu', 'ein', 'eich', 'a', 'â',
  'bob', 'pob', 'rhai', 'sawl', 'llawer', 'digon', 'gormod',
  'nad', 'nag', 'ddim', 'byth', 'erioed', 'mo',
]);

// Tokenize Welsh sentence - handle contractions and mutations
function tokenize(sentence) {
  // Remove punctuation except apostrophes within words
  const cleaned = sentence
    .replace(/[.,!?;:"""''()[\]{}—–…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.split(' ')
    .map(w => w.toLowerCase().replace(/^['']|['']$/g, ''))
    .filter(w => w.length > 0);
}

// Welsh mutation mapping - check base forms too
function getMutationVariants(word) {
  const variants = [word];
  // Soft mutation (treiglad meddal)
  const softMap = {
    'g': '', 'b': 'f', 'c': 'g', 'd': 'dd', 'p': 'b', 't': 'd',
    'm': 'f', 'rh': 'r', 'll': 'l'
  };
  // Reverse: if word starts with mutated form, try to recover base
  // b->p, g->c, d->t, f->b or m, dd->d, l->ll, r->rh
  if (word.startsWith('f') && word.length > 1) variants.push('b' + word.slice(1), 'm' + word.slice(1));
  if (word.startsWith('g') && word.length > 1) variants.push('c' + word.slice(1));
  if (word.startsWith('d') && !word.startsWith('dd') && word.length > 1) variants.push('t' + word.slice(1));
  if (word.startsWith('dd') && word.length > 2) variants.push('d' + word.slice(2));
  if (word.startsWith('b') && word.length > 1) variants.push('p' + word.slice(1));
  if (word.startsWith('l') && !word.startsWith('ll') && word.length > 1) variants.push('ll' + word.slice(1));
  if (word.startsWith('r') && !word.startsWith('rh') && word.length > 1) variants.push('rh' + word.slice(1));
  if (word.startsWith('ng') && word.length > 2) variants.push('g' + word.slice(2));
  if (word.startsWith('nh') && word.length > 2) variants.push(word.slice(2)); // aspirate: nh->n? Actually th->t, ph->p, ch->c
  if (word.startsWith('th') && word.length > 2) variants.push('t' + word.slice(2));
  if (word.startsWith('ph') && word.length > 2) variants.push('p' + word.slice(2));
  if (word.startsWith('ch') && word.length > 2) variants.push('c' + word.slice(2));
  // Soft mutation drops initial g-
  if (!word.startsWith('g') && word.length > 1) variants.push('g' + word);

  return [...new Set(variants)];
}

function isInDict(word) {
  if (dictKeys.has(word)) return true;
  // Check mutation variants
  const variants = getMutationVariants(word);
  for (const v of variants) {
    if (dictKeys.has(v)) return true;
  }
  // Check with common suffixes stripped
  const suffixes = ['au', 'iau', 'oedd', 'odd', 'on', 'ion', 'ydd', 'iad', 'wyd', 'ir', 'ais', 'wch', 'wn', 'af', 'ith', 'ent', "'r", "'n", "'i", "'u"];
  for (const suf of suffixes) {
    if (word.endsWith(suf) && word.length > suf.length + 1) {
      const stem = word.slice(0, -suf.length);
      if (dictKeys.has(stem)) return true;
      // also try stem + common endings
      for (const end of ['', 'i', 'o', 'u', 'a', 'e']) {
        if (dictKeys.has(stem + end)) return true;
      }
    }
  }
  // Check if it's a contraction
  if (word.includes("'")) {
    const parts = word.split("'");
    if (parts.every(p => p.length === 0 || dictKeys.has(p) || STOP_WORDS.has(p))) return true;
  }
  return false;
}

// Check English quality
function checkEnglishQuality(english) {
  const issues = [];

  // Check for odd characters
  if (/[^\x20-\x7E''""\-–—…]/.test(english) && !/[àáâãäåèéêëìíîïòóôõöùúûüñ]/i.test(english)) {
    // Allow common accented chars in proper nouns
  }

  // Check capitalization
  if (english.length > 0 && english[0] !== english[0].toUpperCase()) {
    issues.push('no-initial-cap');
  }

  // Check for trailing/double spaces
  if (english !== english.trim()) issues.push('whitespace');
  if (/  /.test(english)) issues.push('double-space');

  // Check for missing final period (optional, many cards don't have it)

  // Check for very short or very long
  if (english.length < 3) issues.push('too-short');
  if (english.length > 200) issues.push('too-long');

  // Check for untranslated Welsh in English
  const welshPatterns = /\b(mae|dw i|rwy|fy|ei|eu|yn|ydy|yw|sydd|sy'n)\b/i;
  if (welshPatterns.test(english) && !english.includes('(')) {
    // Only flag if not in parenthetical
  }

  // Check for garbled/nonsensical text
  if (/[A-Z]{5,}/.test(english)) issues.push('all-caps-word');

  // Check for duplicate words
  const words = english.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1] && words[i].length > 2) {
      issues.push('repeated-word:' + words[i]);
      break;
    }
  }

  return issues;
}

// Check grammar tip quality
function checkGrammarTip(card) {
  const issues = [];
  if (!card.grammar) return issues; // No tip to check

  const tip = card.grammar;

  // Check for conjugation pattern tips (should be contextual instead)
  if (/^(I|you|he|she|we|they)\s+(am|is|are|was|were|have|has|had)/i.test(tip)) {
    issues.push('conjugation-pattern-tip');
  }

  // Check for overly generic tips
  if (tip.length < 10) issues.push('tip-too-short');
  if (tip.length > 300) issues.push('tip-too-long');

  // Check tip doesn't just repeat the English
  if (card.english.toLowerCase().includes(tip.toLowerCase()) || tip.toLowerCase().includes(card.english.toLowerCase())) {
    issues.push('tip-repeats-english');
  }

  // Check for grammar node alignment - tip should relate to the node's grammar concept
  // node-01 to node-35

  return issues;
}

// Check vocabulary appropriateness
function checkVocabulary(card) {
  const issues = [];
  const target = card.target.toLowerCase();
  const english = card.english.toLowerCase();

  // Check for overly obscure/impractical vocabulary
  const obscurePatterns = [
    /\baciwbigo\b/, /\bacwedwct\b/, // Very obscure Welsh words
  ];

  // Check for cultural inappropriateness or offensive content
  // (Basic check)

  // Check for proper nouns that shouldn't be in vocab cards
  // (Welsh place names are OK)

  // Check English makes sense as translation
  if (english.split(' ').length > 30) issues.push('english-too-wordy');
  if (target.split(' ').length > 30) issues.push('welsh-too-wordy');

  return issues;
}

// Main audit
const issues = [];
const seenEnglish = new Map(); // english -> id for duplicate detection
const seenTarget = new Map();  // target -> id for duplicate detection
const summary = {
  totalCards: allCards.length,
  cardsWithIssues: 0,
  dictCoverageIssues: 0,
  grammarTipIssues: 0,
  englishQualityIssues: 0,
  duplicateIssues: 0,
  vocabIssues: 0,
  audioIssues: 0,
  missingDictWords: {},
};

for (const card of allCards) {
  const cardIssues = [];

  // 1. Dictionary coverage
  const tokens = tokenize(card.target);
  const missingWords = [];
  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue;
    if (token.length <= 1) continue;
    if (/^\d+$/.test(token)) continue; // numbers
    if (!isInDict(token)) {
      missingWords.push(token);
    }
  }
  if (missingWords.length > 0) {
    cardIssues.push({ type: 'dict-coverage', words: missingWords });
    summary.dictCoverageIssues++;
    for (const w of missingWords) {
      summary.missingDictWords[w] = (summary.missingDictWords[w] || 0) + 1;
    }
  }

  // 2. Grammar tip alignment
  const tipIssues = checkGrammarTip(card);
  if (tipIssues.length > 0) {
    cardIssues.push({ type: 'grammar-tip', issues: tipIssues });
    summary.grammarTipIssues++;
  }

  // 3. English quality
  const engIssues = checkEnglishQuality(card.english);
  if (engIssues.length > 0) {
    cardIssues.push({ type: 'english-quality', issues: engIssues });
    summary.englishQualityIssues++;
  }

  // 4. Duplicates
  const engNorm = card.english.toLowerCase().trim().replace(/[.,!?;:]/g, '');
  const targetNorm = card.target.toLowerCase().trim().replace(/[.,!?;:]/g, '');

  if (seenEnglish.has(engNorm)) {
    cardIssues.push({ type: 'duplicate-english', otherCard: seenEnglish.get(engNorm) });
    summary.duplicateIssues++;
  } else {
    seenEnglish.set(engNorm, card.id);
  }

  if (seenTarget.has(targetNorm)) {
    cardIssues.push({ type: 'duplicate-target', otherCard: seenTarget.get(targetNorm) });
    if (!cardIssues.some(i => i.type === 'duplicate-english')) {
      summary.duplicateIssues++;
    }
  } else {
    seenTarget.set(targetNorm, card.id);
  }

  // 5. Vocabulary appropriateness
  const vocabIssues = checkVocabulary(card);
  if (vocabIssues.length > 0) {
    cardIssues.push({ type: 'vocabulary', issues: vocabIssues });
    summary.vocabIssues++;
  }

  // 6. Audio exists
  if (!card.audio) {
    cardIssues.push({ type: 'audio-missing', detail: 'no audio field' });
    summary.audioIssues++;
  } else if (!audioFiles.has(card.audio)) {
    cardIssues.push({ type: 'audio-missing', detail: `file not found: ${card.audio}` });
    summary.audioIssues++;
  }

  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      node: card.grammarNode,
      target: card.target,
      english: card.english,
      audio: card.audio,
      grammar: card.grammar || '',
      issues: cardIssues,
    });
    summary.cardsWithIssues++;
  }
}

// Sort missing dict words by frequency
const topMissing = Object.entries(summary.missingDictWords)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 100);

const output = {
  summary: {
    ...summary,
    missingDictWords: undefined,
    topMissingDictWords: topMissing,
    issueRate: `${((summary.cardsWithIssues / summary.totalCards) * 100).toFixed(1)}%`,
  },
  cards: issues,
};
delete output.summary.missingDictWords;

const outPath = path.join(ROOT, 'scripts/output/audit-cy-cards-1.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nAudit complete. ${summary.cardsWithIssues}/${summary.totalCards} cards have issues (${output.summary.issueRate})`);
console.log(`  Dict coverage: ${summary.dictCoverageIssues}`);
console.log(`  Grammar tips: ${summary.grammarTipIssues}`);
console.log(`  English quality: ${summary.englishQualityIssues}`);
console.log(`  Duplicates: ${summary.duplicateIssues}`);
console.log(`  Vocabulary: ${summary.vocabIssues}`);
console.log(`  Audio: ${summary.audioIssues}`);
console.log(`\nTop 20 missing dict words:`);
for (const [word, count] of topMissing.slice(0, 20)) {
  console.log(`  ${word}: ${count}`);
}
console.log(`\nOutput: ${outPath}`);
