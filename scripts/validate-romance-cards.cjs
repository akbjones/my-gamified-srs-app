/**
 * Romance language card validator
 * Checks for: GARBAGE, MISMATCH, MIXED, AWKWARD
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'output');

// Common French words that should NOT appear in target if it's supposed to be French
const ENGLISH_COMMON = new Set([
  'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would',
  'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'do', 'does',
  'did', 'been', 'being', 'having', 'this', 'that', 'these', 'those',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'because', 'since', 'while', 'although', 'though', 'after', 'before',
  'until', 'unless', 'whether', 'however', 'therefore', 'moreover',
  'furthermore', 'nevertheless', 'meanwhile', 'otherwise', 'instead',
  'about', 'above', 'across', 'against', 'along', 'among', 'around',
  'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'during',
  'except', 'inside', 'outside', 'through', 'toward', 'towards',
  'under', 'within', 'without', 'with', 'from', 'into', 'onto', 'upon',
  'and', 'but', 'or', 'nor', 'not', 'yet', 'both', 'either', 'neither',
  'also', 'too', 'very', 'really', 'quite', 'rather', 'enough',
  'already', 'always', 'never', 'often', 'sometimes', 'usually',
  'here', 'there', 'everywhere', 'anywhere', 'nowhere', 'somewhere',
  'today', 'tomorrow', 'yesterday', 'now', 'then', 'soon', 'later',
  'every', 'each', 'some', 'any', 'many', 'much', 'few', 'little',
  'other', 'another', 'such', 'same', 'different', 'next', 'last',
  'only', 'just', 'still', 'even', 'again', 'once', 'twice',
  'away', 'back', 'down', 'off', 'out', 'over', 'together',
  'she', 'he', 'they', 'them', 'their', 'her', 'him', 'his',
  'its', 'our', 'your', 'my', 'we', 'you', 'me', 'us',
  'for', 'at', 'by', 'to', 'of', 'in', 'on', 'up',
  'going', 'getting', 'making', 'taking', 'coming', 'looking',
  'think', 'know', 'want', 'need', 'like', 'love', 'hate',
  'say', 'tell', 'ask', 'give', 'take', 'make', 'go', 'come',
  'see', 'look', 'find', 'get', 'put', 'keep', 'let', 'begin',
  'seem', 'help', 'show', 'hear', 'play', 'run', 'move', 'live',
  'believe', 'bring', 'happen', 'write', 'provide', 'sit', 'stand',
  'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn',
  'change', 'lead', 'understand', 'watch', 'follow', 'stop',
  'create', 'speak', 'read', 'spend', 'grow', 'open', 'walk',
  'win', 'teach', 'offer', 'remember', 'consider', 'appear',
  'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build',
  'stay', 'fall', 'cut', 'reach', 'kill', 'remain',
  'beautiful', 'important', 'different', 'possible', 'necessary',
  'strong', 'happy', 'big', 'small', 'old', 'young', 'new',
  'good', 'bad', 'great', 'long', 'high', 'low', 'right', 'wrong'
]);

// Words that are legitimately shared between English and Romance languages
const FALSE_POSITIVES = new Set([
  // French-English shared words
  'restaurant', 'menu', 'table', 'route', 'image', 'page', 'face',
  'place', 'simple', 'possible', 'double', 'couple', 'stable', 'noble',
  'angle', 'triangle', 'rectangle', 'machine', 'magazine', 'routine',
  'orange', 'massage', 'garage', 'village', 'voyage', 'courage',
  'passage', 'message', 'stage', 'cage', 'page', 'rage', 'sage',
  'unique', 'technique', 'boutique', 'antique', 'critique',
  'surprise', 'excuse', 'pause', 'cause', 'rose', 'dose',
  'visible', 'possible', 'terrible', 'horrible', 'flexible',
  'original', 'national', 'international', 'normal', 'final',
  'important', 'constant', 'instant', 'distant', 'elegant',
  'date', 'note', 'minute', 'tube', 'cube', 'globe',
  'piano', 'radio', 'video', 'studio', 'photo', 'metro',
  'taxi', 'ski', 'pizza', 'pasta', 'opera', 'visa', 'sofa',
  'concert', 'sport', 'port', 'transport', 'support', 'effort',
  'client', 'agent', 'patient', 'president', 'accident', 'incident',
  'service', 'police', 'justice', 'office', 'commerce', 'practice',
  'nature', 'culture', 'structure', 'temperature', 'adventure',
  'festival', 'animal', 'capital', 'total', 'general', 'special',
  'digital', 'local', 'social', 'commercial', 'musical', 'tropical',
  'certain', 'train', 'pain', 'gain', 'main', 'terrain',
  'situation', 'information', 'education', 'tradition', 'solution',
  'question', 'condition', 'position', 'direction', 'collection',
  'attention', 'action', 'reaction', 'production', 'construction',
  'change', 'chance', 'dance', 'balance', 'distance', 'instance',
  'silence', 'violence', 'science', 'experience', 'difference',
  'presence', 'absence', 'influence', 'intelligence', 'patience',
  'film', 'album', 'forum', 'maximum', 'minimum', 'premium',
  'hotel', 'tunnel', 'canal', 'signal', 'journal', 'festival',
  'internet', 'tennis', 'campus', 'bus', 'plus', 'virus',
  'avenue', 'continue', 'statue', 'revenue', 'dialogue', 'catalogue',
  'zone', 'telephone', 'cologne', 'costume', 'volume',
  // Italian shared
  'solo', 'momento', 'tempo', 'via', 'cosa', 'casa', 'sera',
  'bella', 'bene', 'come', 'dove', 'mare', 'fine', 'prima',
  'bambino', 'cappuccino', 'espresso', 'bravo', 'ciao',
  // Portuguese shared
  'real', 'ideal', 'material', 'federal', 'central', 'universal',
  // Common proper nouns / places
  'paris', 'london', 'rome', 'roma', 'berlin', 'madrid', 'lyon',
  'marseille', 'bordeaux', 'nice', 'monaco', 'florence', 'venice',
  'milan', 'naples', 'lisbon', 'porto', 'rio',
  // Music/art terms
  'jazz', 'rock', 'pop', 'rap', 'hip-hop', 'blues', 'reggae',
  // Tech
  'email', 'blog', 'site', 'web', 'app', 'wifi',
  // Food
  'croissant', 'baguette', 'champagne', 'brie', 'camembert',
  'cappuccino', 'espresso', 'latte', 'gelato', 'risotto',
  // Other international
  'yoga', 'zen', 'karma', 'guru', 'mantra',
  'football', 'volleyball', 'basketball', 'handball', 'baseball',
]);

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[.,!?;:'"()\-––…«»""'']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// Check for English words leaking into target text
function checkMixed(target, lang) {
  const words = tokenize(target);
  const englishWords = [];

  for (const word of words) {
    if (word.length <= 2) continue; // Skip short words (a, le, la, il, etc.)
    if (FALSE_POSITIVES.has(word)) continue;
    if (ENGLISH_COMMON.has(word)) {
      // Some words are legitimate in Romance languages
      if (lang === 'fr' && ['possible', 'simple', 'important', 'original', 'place', 'change', 'chance', 'distance', 'balance', 'silence', 'science', 'patience', 'continue', 'orange', 'village', 'message', 'courage', 'arrive', 'surprise'].includes(word)) continue;
      if (lang === 'it' && ['come', 'mare', 'fine', 'solo', 'tempo', 'via', 'sera', 'prima', 'dove'].includes(word)) continue;
      if (lang === 'pt' && ['come', 'real', 'total', 'general', 'final', 'local', 'social', 'special'].includes(word)) continue;
      englishWords.push(word);
    }
  }

  return englishWords;
}

// Check for gibberish / garbage
function checkGarbage(target, lang) {
  // Check for very short sentences (suspicious)
  if (target.length < 5) return 'Extremely short sentence';

  // Check for repeated words
  const words = tokenize(target);
  if (words.length >= 4) {
    const uniqueRatio = new Set(words).size / words.length;
    if (uniqueRatio < 0.3) return 'Excessive word repetition';
  }

  // Check for number-heavy "sentences"
  const numCount = (target.match(/\d/g) || []).length;
  if (numCount > target.length * 0.4 && target.length > 10) return 'Mostly numbers, not a real sentence';

  // Check for excessive punctuation
  const punctCount = (target.match(/[^a-zA-ZàáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞßœŒ\s\d]/g) || []).length;
  if (punctCount > target.length * 0.3 && target.length > 10) return 'Excessive punctuation';

  // Check for random character sequences (no vowels in long stretches)
  if (lang === 'fr' || lang === 'it' || lang === 'pt') {
    // Romance languages have lots of vowels
    const vowelCount = (target.match(/[aeiouàáâãäåæèéêëìíîïòóôõöùúûüýÿœ]/gi) || []).length;
    const letterCount = (target.match(/[a-zA-ZàáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞßœŒ]/g) || []).length;
    if (letterCount > 10 && vowelCount / letterCount < 0.15) return 'Too few vowels for a Romance language';
  }

  return null;
}

// Check for obvious mismatches between target and english
function checkMismatch(target, english, lang) {
  const tWords = tokenize(target);
  const eWords = tokenize(english);

  // Check if english is empty or target is empty
  if (!target || target.trim() === '') return 'Empty target sentence';
  if (!english || english.trim() === '') return 'Empty English translation';

  // Check if target IS English (same as english)
  if (target.toLowerCase().trim() === english.toLowerCase().trim()) return 'Target is identical to English';

  // Check if target looks entirely English
  const engWordCount = tWords.filter(w => w.length > 2 && ENGLISH_COMMON.has(w) && !FALSE_POSITIVES.has(w)).length;
  if (tWords.length > 3 && engWordCount / tWords.length > 0.7) return 'Target appears to be English, not ' + lang;

  // Check question/statement mismatch
  const targetIsQuestion = target.trim().endsWith('?');
  const englishIsQuestion = english.trim().endsWith('?');
  // Don't flag this as it's common for formatting differences

  // Check for wildly different lengths (could indicate mismatch)
  // But be lenient - languages vary in verbosity
  if (tWords.length > 1 && eWords.length > 1) {
    const ratio = tWords.length / eWords.length;
    if (ratio > 4 || ratio < 0.2) return `Suspicious length ratio (${ratio.toFixed(1)}:1)`;
  }

  return null;
}

// Check for awkward phrasing (basic heuristics)
function checkAwkward(target, english, lang) {
  const tWords = tokenize(target);

  // Repeated adjacent words (not counting legitimate ones like "très très")
  for (let i = 0; i < tWords.length - 2; i++) {
    if (tWords[i] === tWords[i+1] && tWords[i] === tWords[i+2] && tWords[i].length > 2) {
      return `Triple word repetition: "${tWords[i]}"`;
    }
  }

  // Check for sentences that are just a list of disconnected nouns
  // (This is hard to detect programmatically, so we keep it simple)

  return null;
}

function validateDeck(deckPath, lang) {
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf-8'));
  const flagged = [];

  for (const card of deck) {
    const id = card.id;
    const target = card.target || '';
    const english = card.english || '';

    // Check GARBAGE first
    const garbageReason = checkGarbage(target, lang);
    if (garbageReason) {
      flagged.push({ id, issue: 'GARBAGE', reason: garbageReason, target, english });
      continue;
    }

    // Check MISMATCH
    const mismatchReason = checkMismatch(target, english, lang);
    if (mismatchReason) {
      flagged.push({ id, issue: 'MISMATCH', reason: mismatchReason, target, english });
      continue;
    }

    // Check MIXED
    const mixedWords = checkMixed(target, lang);
    if (mixedWords.length >= 2) {  // Need at least 2 English words to flag
      flagged.push({ id, issue: 'MIXED', reason: `English words found: ${mixedWords.join(', ')}`, target, english });
      continue;
    }

    // Check AWKWARD
    const awkwardReason = checkAwkward(target, english, lang);
    if (awkwardReason) {
      flagged.push({ id, issue: 'AWKWARD', reason: awkwardReason, target, english });
      continue;
    }
  }

  return {
    total: deck.length,
    flagged: flagged.map(f => ({ id: f.id, issue: f.issue, reason: f.reason })),
    ok_count: deck.length - flagged.length,
    // Also output details for manual review
    _details: flagged
  };
}

// Run validation
const langs = [
  { code: 'fr', name: 'french', file: 'fr-card-validation.json' },
  { code: 'it', name: 'italian', file: 'it-card-validation.json' },
  { code: 'pt', name: 'portuguese', file: 'pt-card-validation.json' },
];

for (const lang of langs) {
  const deckPath = path.join(BASE, 'src/data', lang.name, 'deck.json');
  console.log(`\nValidating ${lang.name}...`);
  const result = validateDeck(deckPath, lang.code);

  // Print details for manual review
  console.log(`  Total: ${result.total}, Flagged: ${result.flagged.length}`);
  for (const f of result._details) {
    console.log(`  [${f.issue}] id=${f.id}: ${f.reason}`);
    console.log(`    T: ${f.target}`);
    console.log(`    E: ${f.english}`);
  }

  // Write output (without _details)
  const output = { total: result.total, flagged: result.flagged, ok_count: result.ok_count };
  fs.writeFileSync(path.join(OUT, lang.file), JSON.stringify(output, null, 2));
}
