/**
 * Comprehensive card-by-card audit of ALL Turkish batches.
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 * duplicates, vocabulary appropriateness, audio existence.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_DIR = path.join(ROOT, 'scripts/output/audit-batches');
const DICT_FILE = path.join(ROOT, 'src/data/dictionary/tr.ts');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');
const OUTPUT = path.join(ROOT, 'scripts/output/audit-tr-cards-0.json');

// ── Load dictionary keys ──────────────────────────────────────
function loadDictionaryKeys() {
  const src = fs.readFileSync(DICT_FILE, 'utf8');
  const keys = new Set();
  // Match dictionary keys: 'word' or "word" at start of entries
  const re = /^\s+['"]([^'"]+)['"]\s*:/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    keys.add(m[1].toLowerCase());
  }
  return keys;
}

// ── Turkish tokenizer ─────────────────────────────────────────
// Strips punctuation, lowercases, splits on whitespace
function tokenize(sentence) {
  return sentence
    .replace(/[.,!?;:""''\"\'…\-––()[\]{}«»‹›""]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// ── Turkish suffix stripping (simplified) ─────────────────────
// Turkish is agglutinative, so we try multiple suffix removals
const BACK_VOWELS = new Set('aıou'.split(''));
const FRONT_VOWELS = new Set('eiöü'.split(''));

function lastVowel(word) {
  for (let i = word.length - 1; i >= 0; i--) {
    if (BACK_VOWELS.has(word[i]) || FRONT_VOWELS.has(word[i])) return word[i];
  }
  return 'a';
}

function isBackVowel(v) { return BACK_VOWELS.has(v); }

// Try to find the infinitive form of a conjugated verb
function tryFindInfinitive(word) {
  if (word.endsWith('mek') || word.endsWith('mak')) return [word];

  const candidates = [];

  // Common Turkish verb suffixes (most specific first)
  const suffixes = [
    // Present continuous (-yor + person)
    'ıyorum', 'iyorum', 'uyorum', 'üyorum',
    'ıyorsun', 'iyorsun', 'uyorsun', 'üyorsun',
    'ıyor', 'iyor', 'uyor', 'üyor',
    'ıyoruz', 'iyoruz', 'uyoruz', 'üyoruz',
    'ıyorsunuz', 'iyorsunuz', 'uyorsunuz', 'üyorsunuz',
    'ıyorlar', 'iyorlar', 'uyorlar', 'üyorlar',
    // Past tense
    'dım', 'dim', 'dum', 'düm', 'tım', 'tim', 'tum', 'tüm',
    'dın', 'din', 'dun', 'dün', 'tın', 'tin', 'tun', 'tün',
    'dı', 'di', 'du', 'dü', 'tı', 'ti', 'tu', 'tü',
    'dık', 'dik', 'duk', 'dük', 'tık', 'tik', 'tuk', 'tük',
    'dınız', 'diniz', 'dunuz', 'dünüz', 'tınız', 'tiniz', 'tunuz', 'tünüz',
    'dılar', 'diler', 'dular', 'düler', 'tılar', 'tiler', 'tular', 'tüler',
    // Future
    'acağım', 'eceğim', 'acaksın', 'eceksin', 'acak', 'ecek',
    'acağız', 'eceğiz', 'acaksınız', 'eceksiniz', 'acaklar', 'ecekler',
    // Aorist
    'arım', 'erim', 'ırım', 'irim', 'urum', 'ürüm',
    'arsın', 'ersin', 'ırsın', 'irsin', 'ursun', 'ürsün',
    'ar', 'er', 'ır', 'ir', 'ur', 'ür',
    'arız', 'eriz', 'ırız', 'iriz', 'uruz', 'ürüz',
    'arsınız', 'ersiniz', 'ırsınız', 'irsiniz', 'ursunuz', 'ürsünüz',
    'arlar', 'erler', 'ırlar', 'irler', 'urlar', 'ürler',
    // Reported past
    'mışım', 'mişim', 'muşum', 'müşüm',
    'mışsın', 'mişsin', 'muşsun', 'müşsün',
    'mış', 'miş', 'muş', 'müş',
    'mışız', 'mişiz', 'muşuz', 'müşüz',
    'mışsınız', 'mişsiniz', 'muşsunuz', 'müşsünüz',
    'mışlar', 'mişler', 'muşlar', 'müşler',
    // Conditional
    'sam', 'sem', 'san', 'sen',
    'sa', 'se',
    'sak', 'sek', 'sanız', 'seniz',
    'salar', 'seler',
    // Imperative/optative
    'sin', 'sın', 'sun', 'sün',
    'siniz', 'sınız', 'sunuz', 'sünüz',
    'sinler', 'sınlar', 'sunlar', 'sünler',
    'alım', 'elim',
    // Negative
    'ma', 'me',
    'maz', 'mez',
    'mıyor', 'miyor', 'muyor', 'müyor',
    // Ability
    'abil', 'ebil',
    // Necessity
    'malı', 'meli',
    'malıyım', 'meliyim', 'malısın', 'melisin',
    // Participles / verbal nouns
    'an', 'en', 'arak', 'erek',
    'dığı', 'diği', 'duğu', 'düğü', 'tığı', 'tiği', 'tuğu', 'tüğü',
    'dığım', 'diğim', 'duğum', 'düğüm',
    'dığın', 'diğin', 'duğun', 'düğün',
  ];

  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      const stem = word.slice(0, -suffix.length);
      if (stem.length >= 2) {
        const ending = isBackVowel(lastVowel(stem)) ? 'mak' : 'mek';
        candidates.push(stem + ending);
        // Also try with consonant softening reversed
        const lastChar = stem.slice(-1);
        const unsoft = { 'ğ': 'k', 'b': 'p', 'd': 't', 'c': 'ç' };
        if (unsoft[lastChar]) {
          candidates.push(stem.slice(0, -1) + unsoft[lastChar] + ending);
        }
      }
    }
  }

  return candidates;
}

// Turkish noun/adj suffixes to strip
const NOUN_SUFFIXES = [
  // Possessive
  'ım', 'im', 'um', 'üm', 'ın', 'in', 'un', 'ün',
  'ımız', 'imiz', 'umuz', 'ümüz', 'ınız', 'iniz', 'unuz', 'ünüz',
  'ları', 'leri', 'lar', 'ler',
  // Case
  'dan', 'den', 'tan', 'ten',
  'da', 'de', 'ta', 'te',
  'ya', 'ye', 'na', 'ne',
  'ı', 'i', 'u', 'ü',
  // Plural already covered above
  // Derivational
  'lık', 'lik', 'luk', 'lük',
  'lı', 'li', 'lu', 'lü',
  'sız', 'siz', 'suz', 'süz',
  'cı', 'ci', 'cu', 'cü', 'çı', 'çi', 'çu', 'çü',
  // With buffer n
  'nın', 'nin', 'nun', 'nün',
  'nda', 'nde',
  'ndan', 'nden',
];

function tryStemNoun(word) {
  const candidates = [word];
  for (const suffix of NOUN_SUFFIXES) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      candidates.push(word.slice(0, -suffix.length));
    }
  }
  return candidates;
}

// ── Common Turkish stop words / particles ─────────────────────
const STOP_WORDS = new Set([
  'bir', 'bu', 'şu', 'o', 'ben', 'sen', 'biz', 'siz', 'onlar',
  'benim', 'senin', 'onun', 'bizim', 'sizin', 'onların',
  'bana', 'sana', 'ona', 'bize', 'size', 'onlara',
  'beni', 'seni', 'onu', 'bizi', 'sizi', 'onları',
  'bende', 'sende', 'onda', 'bizde', 'sizde', 'onlarda',
  'benden', 'senden', 'ondan', 'bizden', 'sizden', 'onlardan',
  'benimle', 'seninle', 'onunla', 'bizimle', 'sizinle', 'onlarla',
  'ne', 'nere', 'nerede', 'nereden', 'nereye', 'nasıl', 'neden', 'niçin', 'niye',
  'kim', 'kime', 'kimi', 'kimde', 'kimden', 'kimin',
  'hangi', 'kaç', 'kaçıncı',
  'da', 'de', 'mi', 'mı', 'mu', 'mü',
  'ki', 'ile', 'ya', 'ye', 'için',
  've', 'ama', 'fakat', 'ancak', 'lakin', 'çünkü', 'hem', 'veya', 'ya da',
  'var', 'yok', 'daha', 'en', 'çok', 'az', 'hiç',
  'her', 'bazı', 'birçok', 'birkaç', 'tüm', 'bütün', 'hep',
  'şey', 'gibi', 'kadar', 'bile', 'sadece', 'yalnız', 'artık',
  'sonra', 'önce', 'şimdi', 'zaten', 'hâlâ', 'hala', 'henüz',
  'evet', 'hayır',
  'değil', 'mi', 'mı', 'mu', 'mü',
  'lütfen', 'teşekkürler', 'teşekkür', 'ederim',
  // Common short words
  'iyi', 'kötü', 'güzel', 'büyük', 'küçük',
]);

// ── Load audio file set ───────────────────────────────────────
function loadAudioSet() {
  const files = fs.readdirSync(AUDIO_DIR);
  return new Set(files.filter(f => f.startsWith('tr-tr-') && f.endsWith('.mp3')));
}

// ── English quality checks ────────────────────────────────────
function checkEnglish(eng) {
  const issues = [];
  if (!eng || eng.trim().length === 0) {
    issues.push('empty_english');
    return issues;
  }
  // Starts with capital letter
  if (eng[0] !== eng[0].toUpperCase() || /^[a-z]/.test(eng)) {
    issues.push('english_not_capitalized');
  }
  // Ends with punctuation
  if (!/[.!?…]$/.test(eng.trim())) {
    issues.push('english_no_punctuation');
  }
  // Contains placeholder patterns
  if (/\{.*?\}|\[.*?\]|___/.test(eng)) {
    issues.push('english_placeholder');
  }
  // Extremely short (likely incomplete)
  if (eng.trim().length < 3) {
    issues.push('english_too_short');
  }
  // Unnatural patterns (repeated consecutive words)
  if (/\b(the|a|an|is|are|was|were|in|on|to|of|and|the)\s+\1\b/i.test(eng)) {
    issues.push('english_repeated_words');
  }
  return issues;
}

// ── Grammar tip checks ────────────────────────────────────────
function checkGrammarTip(card) {
  const issues = [];
  if (!card.grammar) return issues;

  const tip = card.grammar;

  // Too short to be useful
  if (tip.length < 10) {
    issues.push('grammar_too_short');
  }
  // Too long (overwhelming)
  if (tip.length > 300) {
    issues.push('grammar_too_long');
  }
  // Boring conjugation pattern (should be contextual/usage-based)
  if (/^(The|In|For|A) (conjugation|declension|inflection)/i.test(tip)) {
    issues.push('grammar_boring_conjugation');
  }
  // Just lists forms without context
  if (/→.*→.*→/i.test(tip) && tip.length < 50) {
    issues.push('grammar_just_forms');
  }
  // Exact duplicate of English
  if (tip === card.english) {
    issues.push('grammar_equals_english');
  }

  return issues;
}

// ── Vocabulary appropriateness ────────────────────────────────
function checkVocab(card) {
  const issues = [];
  const target = card.target;
  const english = card.english;

  // Mad-libs garbage: target has weird template patterns
  if (/\{.*?\}|\[.*?\]|___/.test(target)) {
    issues.push('vocab_madlibs');
  }
  // Incomplete sentences ending abruptly
  if (/\.\.\.$/.test(target) && target.length < 15) {
    issues.push('vocab_incomplete');
  }
  // Just a single word (should be a sentence)
  if (target.split(/\s+/).length === 1 && !target.includes('.')) {
    issues.push('vocab_single_word');
  }
  // Target is entirely in Latin/English (no Turkish chars and sounds English)
  if (/^[a-zA-Z\s.,!?]+$/.test(target) && !/[çğıöşüÇĞİÖŞÜ]/.test(target)) {
    // Could be English masquerading as Turkish
    const commonEnglish = /\b(the|is|are|was|were|have|has|this|that|with|from|for)\b/i;
    if (commonEnglish.test(target)) {
      issues.push('vocab_english_as_target');
    }
  }
  // Exact same target and English
  if (target.toLowerCase().trim() === english.toLowerCase().trim()) {
    issues.push('vocab_target_equals_english');
  }

  return issues;
}

// ── Main Audit ────────────────────────────────────────────────
function main() {
  console.log('Loading dictionary...');
  const dictKeys = loadDictionaryKeys();
  console.log(`  ${dictKeys.size} dictionary entries`);

  console.log('Loading audio files...');
  const audioSet = loadAudioSet();
  console.log(`  ${audioSet.size} audio files`);

  // Load all batches
  const allCards = [];
  for (let i = 0; i <= 6; i++) {
    const batch = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, `tr-batch-${i}.json`), 'utf8'));
    allCards.push(...batch);
  }
  console.log(`Loaded ${allCards.length} cards across 7 batches`);

  // Track duplicates
  const targetMap = new Map(); // target → [ids]
  const englishMap = new Map(); // english → [ids]

  // Results
  const flaggedCards = [];
  const summaryCounts = {
    total: allCards.length,
    flagged: 0,
    dict_missing_words: 0,
    dict_low_coverage: 0,
    english_not_capitalized: 0,
    english_no_punctuation: 0,
    english_placeholder: 0,
    english_too_short: 0,
    english_repeated_words: 0,
    empty_english: 0,
    grammar_too_short: 0,
    grammar_too_long: 0,
    grammar_boring_conjugation: 0,
    grammar_just_forms: 0,
    grammar_equals_english: 0,
    vocab_madlibs: 0,
    vocab_incomplete: 0,
    vocab_single_word: 0,
    vocab_english_as_target: 0,
    vocab_target_equals_english: 0,
    duplicate_target: 0,
    duplicate_english: 0,
    audio_missing: 0,
    no_tags: 0,
    no_grammar_node: 0,
  };

  // First pass: build maps for duplicate detection
  for (const card of allCards) {
    const t = card.target.toLowerCase().trim();
    const e = card.english.toLowerCase().trim();
    if (!targetMap.has(t)) targetMap.set(t, []);
    targetMap.get(t).push(card.id);
    if (!englishMap.has(e)) englishMap.set(e, []);
    englishMap.get(e).push(card.id);
  }

  // Second pass: audit each card
  for (const card of allCards) {
    const issues = [];
    const details = {};

    // 1) Dictionary coverage
    const tokens = tokenize(card.target);
    const missingWords = [];
    let coveredCount = 0;

    for (const token of tokens) {
      if (STOP_WORDS.has(token)) {
        coveredCount++;
        continue;
      }
      if (token.length <= 2) {
        coveredCount++; // Skip very short tokens
        continue;
      }
      // Check direct match
      if (dictKeys.has(token)) {
        coveredCount++;
        continue;
      }
      // Try verb infinitive lookup
      const verbCandidates = tryFindInfinitive(token);
      let found = false;
      for (const c of verbCandidates) {
        if (dictKeys.has(c)) { found = true; break; }
      }
      if (found) { coveredCount++; continue; }

      // Try noun stem variants
      const nounCandidates = tryStemNoun(token);
      for (const c of nounCandidates) {
        if (dictKeys.has(c)) { found = true; break; }
      }
      if (found) { coveredCount++; continue; }

      missingWords.push(token);
    }

    const contentTokens = tokens.filter(t => !STOP_WORDS.has(t) && t.length > 2);
    const coverage = contentTokens.length > 0
      ? (contentTokens.length - missingWords.length) / contentTokens.length
      : 1;

    if (missingWords.length > 0) {
      details.missingWords = missingWords;
      details.coverage = Math.round(coverage * 100) + '%';
      if (coverage < 0.5) {
        issues.push('dict_low_coverage');
        summaryCounts.dict_low_coverage++;
      }
      summaryCounts.dict_missing_words++;
    }

    // 2) English quality
    const englishIssues = checkEnglish(card.english);
    for (const ei of englishIssues) {
      issues.push(ei);
      summaryCounts[ei] = (summaryCounts[ei] || 0) + 1;
    }

    // 3) Grammar tip alignment
    const grammarIssues = checkGrammarTip(card);
    for (const gi of grammarIssues) {
      issues.push(gi);
      summaryCounts[gi] = (summaryCounts[gi] || 0) + 1;
    }

    // 4) Vocabulary appropriateness
    const vocabIssues = checkVocab(card);
    for (const vi of vocabIssues) {
      issues.push(vi);
      summaryCounts[vi] = (summaryCounts[vi] || 0) + 1;
    }

    // 5) Duplicates
    const t = card.target.toLowerCase().trim();
    const e = card.english.toLowerCase().trim();
    if (targetMap.get(t).length > 1) {
      issues.push('duplicate_target');
      details.duplicateTargetIds = targetMap.get(t).filter(id => id !== card.id);
      summaryCounts.duplicate_target++;
    }
    if (englishMap.get(e).length > 1) {
      issues.push('duplicate_english');
      details.duplicateEnglishIds = englishMap.get(e).filter(id => id !== card.id);
      summaryCounts.duplicate_english++;
    }

    // 6) Audio
    if (card.audio) {
      if (!audioSet.has(card.audio)) {
        issues.push('audio_missing');
        details.audioFile = card.audio;
        summaryCounts.audio_missing++;
      }
    } else {
      issues.push('audio_missing');
      summaryCounts.audio_missing++;
    }

    // 7) Structural checks
    if (!card.tags || card.tags.length === 0) {
      issues.push('no_tags');
      summaryCounts.no_tags++;
    }
    if (!card.grammarNode) {
      issues.push('no_grammar_node');
      summaryCounts.no_grammar_node++;
    }

    if (issues.length > 0) {
      flaggedCards.push({
        id: card.id,
        target: card.target,
        english: card.english,
        grammarNode: card.grammarNode,
        issues,
        ...details,
      });
      summaryCounts.flagged++;
    }
  }

  // Build output
  const output = {
    audit: 'Turkish card-by-card audit',
    date: new Date().toISOString().slice(0, 10),
    summary: summaryCounts,
    flaggedCards,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));

  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Total cards: ${summaryCounts.total}`);
  console.log(`Flagged cards: ${summaryCounts.flagged}`);
  console.log(`\nDictionary:`);
  console.log(`  Cards with missing words: ${summaryCounts.dict_missing_words}`);
  console.log(`  Cards with <50% coverage: ${summaryCounts.dict_low_coverage}`);
  console.log(`\nEnglish quality:`);
  console.log(`  Not capitalized: ${summaryCounts.english_not_capitalized}`);
  console.log(`  No punctuation: ${summaryCounts.english_no_punctuation}`);
  console.log(`  Placeholder text: ${summaryCounts.english_placeholder}`);
  console.log(`  Too short: ${summaryCounts.english_too_short}`);
  console.log(`  Repeated words: ${summaryCounts.english_repeated_words}`);
  console.log(`  Empty: ${summaryCounts.empty_english}`);
  console.log(`\nGrammar tips:`);
  console.log(`  Too short: ${summaryCounts.grammar_too_short}`);
  console.log(`  Too long: ${summaryCounts.grammar_too_long}`);
  console.log(`  Boring conjugation: ${summaryCounts.grammar_boring_conjugation}`);
  console.log(`  Just forms: ${summaryCounts.grammar_just_forms}`);
  console.log(`  Equals English: ${summaryCounts.grammar_equals_english}`);
  console.log(`\nVocabulary:`);
  console.log(`  Mad-libs: ${summaryCounts.vocab_madlibs}`);
  console.log(`  Incomplete: ${summaryCounts.vocab_incomplete}`);
  console.log(`  Single word: ${summaryCounts.vocab_single_word}`);
  console.log(`  English as target: ${summaryCounts.vocab_english_as_target}`);
  console.log(`  Target = English: ${summaryCounts.vocab_target_equals_english}`);
  console.log(`\nDuplicates:`);
  console.log(`  Duplicate target: ${summaryCounts.duplicate_target}`);
  console.log(`  Duplicate English: ${summaryCounts.duplicate_english}`);
  console.log(`\nAudio missing: ${summaryCounts.audio_missing}`);
  console.log(`No tags: ${summaryCounts.no_tags}`);
  console.log(`No grammar node: ${summaryCounts.no_grammar_node}`);
  console.log(`\nOutput: ${OUTPUT}`);
}

main();
