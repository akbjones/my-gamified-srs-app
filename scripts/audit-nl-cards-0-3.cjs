/**
 * Card-by-card audit of Dutch batches 0-3 (~2000 cards).
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 *         duplicates, vocabulary appropriateness, audio existence.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/nl.ts');

// ── Load batches ─────────────────────────────────────────────
const cards = [];
for (let i = 0; i <= 3; i++) {
  const batch = require(`./output/audit-batches/nl-batch-${i}.json`);
  cards.push(...batch);
}
console.log(`Loaded ${cards.length} cards from batches 0-3`);

// ── Build audio set ──────────────────────────────────────────
const audioFiles = new Set();
for (const f of fs.readdirSync(AUDIO_DIR)) {
  if (f.startsWith('nl-') && f.endsWith('.mp3')) {
    audioFiles.add(f);
  }
}
console.log(`Found ${audioFiles.size} Dutch audio files`);

// ── Build dictionary key set ─────────────────────────────────
const dictSrc = fs.readFileSync(DICT_PATH, 'utf8');

// Extract IRREGULAR_MAP keys
const irregSection = dictSrc.split('IRREGULAR_MAP')[1].split('};')[0];
const irregMap = {};
const irregRe = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
let m;
while ((m = irregRe.exec(irregSection)) !== null) {
  irregMap[m[1].toLowerCase()] = m[2].toLowerCase();
}

// Extract dictionary keys
const dictSection = dictSrc.substring(dictSrc.indexOf('const dictionary:'));
const dictKeys = new Set();
const dictRe = /^\s*['"]([^'"]+)['"]\s*:\s*\{/gm;
while ((m = dictRe.exec(dictSection)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
console.log(`Dictionary has ${dictKeys.size} entries, ${Object.keys(irregMap).length} irregular forms`);

// ── Common Dutch stop words (not expected in dictionary) ─────
const STOP_WORDS = new Set([
  'ik', 'je', 'jij', 'u', 'hij', 'zij', 'ze', 'het', 'we', 'wij', 'jullie',
  'de', 'een', 'het', 'en', 'of', 'maar', 'want', 'dus', 'dat', 'die',
  'er', 'in', 'op', 'aan', 'om', 'te', 'van', 'voor', 'met', 'tot',
  'naar', 'bij', 'uit', 'door', 'over', 'na', 'al', 'nog', 'ook', 'niet',
  'geen', 'wel', 'ja', 'nee', 'dan', 'als', 'zo', 'nu', 'hier', 'daar',
  'wat', 'wie', 'waar', 'hoe', 'wanneer', 'waarom', 'welk', 'welke',
  'me', 'mij', 'jou', 'hem', 'haar', 'ons', 'hen', 'hun',
  'mijn', 'jouw', 'zijn', 'hun', 'ons', 'onze', 'uw',
  'deze', 'dit', 'die', 'dat', 'elk', 'elke', 'alle', 'beide',
  'veel', 'meer', 'meest', 'weinig', 'minder', 'minst',
  'heel', 'erg', 'zeer', 'best', 'echt',
  // numbers
  'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'negen', 'tien',
  // common short words
  'is', 'was', 'ben', 'bent', 'zijn', 'heeft', 'heb', 'hebt', 'had',
  'kan', 'kun', 'kunt', 'wil', 'wilt', 'zal', 'zou', 'mag', 'moet',
  'ga', 'gaat', 'ging', 'kom', 'komt', 'kwam', 'doe', 'doet', 'deed',
  'word', 'wordt', 'werd', 'werd',
  'iets', 'niets', 'alles', 'iemand', 'niemand',
  'zelf', 'elkaar', 'zich',
  // particles
  'er', 'erop', 'eruit', 'eraan', 'erin', 'erover', 'ermee',
]);

// ── Tokenize Dutch sentence ─────────────────────────────────
function tokenize(sentence) {
  return sentence
    .replace(/[.,!?;:()"""''––\-\[\]\/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// Tokenize lowercased (for dict lookup)
function tokenizeLower(sentence) {
  return tokenize(sentence).map(w => w.toLowerCase());
}

// Get proper nouns (capitalized mid-sentence words, likely names)
function getProperNouns(sentence) {
  const words = tokenize(sentence);
  const proper = new Set();
  for (let i = 1; i < words.length; i++) {
    if (/^[A-Z][a-z]/.test(words[i])) {
      proper.add(words[i].toLowerCase());
    }
  }
  return proper;
}

// Check if a word is in dictionary (direct, via irregular, or via common derivation)
function isInDict(word) {
  const w = word.toLowerCase();
  if (dictKeys.has(w)) return true;
  if (irregMap[w] && dictKeys.has(irregMap[w])) return true;
  if (STOP_WORDS.has(w)) return true;
  // Simple number check
  if (/^\d+$/.test(w)) return true;
  // Check common prefixes
  for (const prefix of ['ge', 'be', 'ver', 'ont', 'her']) {
    if (w.startsWith(prefix) && dictKeys.has(w.slice(prefix.length))) return true;
  }
  // Check -s, -en, -e, -er, -ste plurals/inflections
  for (const suffix of ['s', 'en', 'e', 'er', 'ste', 'jes', 'tje', 'je', 'te', 'de', 'den', 'ten', 'heid', 'lijk', 'isch', 'ig']) {
    if (w.endsWith(suffix) && w.length > suffix.length + 2) {
      const stem = w.slice(0, -suffix.length);
      if (dictKeys.has(stem)) return true;
      // Double last consonant removal for -en/-e: e.g. "moetten" -> "moet"
      if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
        if (dictKeys.has(stem.slice(0, -1))) return true;
      }
    }
  }
  return false;
}

// ── Grammar node descriptions ────────────────────────────────
const NODE_TOPICS = {
  'node-01': 'basic greetings/introductions',
  'node-02': 'present tense regular verbs',
  'node-03': 'articles, gender, plurals',
  'node-04': 'adjectives, comparisons',
  'node-05': 'negation, questions',
  'node-06': 'modal verbs',
  'node-07': 'separable verbs',
  'node-08': 'past tense (imperfectum)',
  'node-09': 'perfect tense (perfectum)',
  'node-10': 'reflexive verbs',
  'node-11': 'word order, inversion',
  'node-12': 'prepositions, er-compounds',
  'node-13': 'relative clauses',
  'node-14': 'passive voice',
  'node-15': 'subjunctive, conditional',
  'node-16': 'diminutives',
  'node-17': 'compound words',
  'node-18': 'time expressions',
  'node-19': 'directions, location',
  'node-20': 'food, restaurant',
  'node-21': 'health, body',
  'node-22': 'travel, transport',
  'node-23': 'shopping, money',
  'node-24': 'work, office',
  'node-25': 'home, housing',
  'node-26': 'family, relationships',
  'node-27': 'hobbies, leisure',
  'node-28': 'weather, nature',
  'node-29': 'education, study',
  'node-30': 'culture, traditions',
  'node-31': 'technology, media',
  'node-32': 'politics, society',
  'node-33': 'emotions, opinions',
  'node-34': 'formal/business Dutch',
  'node-35': 'idioms, proverbs',
};

// ── English quality checks ───────────────────────────────────
function checkEnglishQuality(eng) {
  const issues = [];
  // Empty or too short
  if (!eng || eng.trim().length < 3) issues.push('english_too_short');
  // Untranslated Dutch in English
  if (/\b(de|het|een|en|dat|die|van|voor|met)\b/i.test(eng) &&
      !/\b(the|a|an|and|that|of|for|with|van)\b/i.test(eng)) {
    // Only flag if NO English words present
  }
  // Awkward patterns
  if (/\bthe the\b/i.test(eng)) issues.push('english_doubled_article');
  if (/\ba a\b/i.test(eng)) issues.push('english_doubled_article');
  // Trailing/leading whitespace
  if (eng !== eng.trim()) issues.push('english_whitespace');
  // Starts with lowercase (not expected for sentences)
  if (eng.length > 0 && /^[a-z]/.test(eng) && !eng.startsWith('e.g.')) {
    issues.push('english_lowercase_start');
  }
  // Contains raw Dutch
  if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(eng)) {
    // Check if it's just accented English - allow common ones
  }
  // Very long translation (possibly untrimmed)
  if (eng.length > 120) issues.push('english_too_long');
  // Contains placeholder patterns
  if (/\[.*\]/.test(eng) || /\{.*\}/.test(eng)) issues.push('english_has_placeholder');
  return issues;
}

// ── Grammar tip quality checks ───────────────────────────────
function checkGrammarTip(tip, node) {
  const issues = [];
  if (!tip) return issues;

  // Too short to be useful
  if (tip.length < 15) issues.push('tip_too_short');
  // Too long
  if (tip.length > 300) issues.push('tip_too_long');

  // Boring conjugation pattern (should be contextual)
  if (/^(ik|jij|hij|wij|zij|jullie)\s+\w+,\s*(jij|hij|wij|zij|jullie)\s+\w+/i.test(tip)) {
    issues.push('tip_conjugation_pattern');
  }

  // Just lists forms: "geven, geeft, gaf, gegeven"
  if (/^\w+,\s*\w+,\s*\w+,\s*\w+$/.test(tip)) {
    issues.push('tip_just_word_list');
  }

  // Duplicate tip text check happens globally
  return issues;
}

// ── Main audit loop ──────────────────────────────────────────
const issues = [];
const seenTargets = new Map(); // target sentence -> id (for duplicate detection)
const seenEnglish = new Map(); // english -> id
const seenTips = new Map(); // grammar tip -> [ids]
const allMissingWords = new Map(); // word -> count

const summary = {
  totalCards: cards.length,
  cardsWithIssues: 0,
  issueBreakdown: {},
  missingAudioCount: 0,
  dictCoverageGaps: 0,
  duplicateTargets: 0,
  duplicateEnglish: 0,
  englishQualityIssues: 0,
  grammarTipIssues: 0,
  topMissingWords: [],
};

for (const card of cards) {
  const cardIssues = [];

  // 1) Audio check
  if (!card.audio) {
    cardIssues.push({ type: 'missing_audio_field' });
  } else if (!audioFiles.has(card.audio)) {
    cardIssues.push({ type: 'audio_file_missing', audio: card.audio });
  }

  // 2) Dictionary coverage
  const words = tokenizeLower(card.target);
  const properNouns = getProperNouns(card.target);
  const missingWords = words.filter(w => !isInDict(w) && w.length > 2 && !properNouns.has(w));
  if (missingWords.length > 0) {
    cardIssues.push({ type: 'dict_coverage_gap', missing: missingWords });
    for (const w of missingWords) {
      allMissingWords.set(w, (allMissingWords.get(w) || 0) + 1);
    }
  }

  // 3) English quality
  const engIssues = checkEnglishQuality(card.english);
  if (engIssues.length > 0) {
    cardIssues.push({ type: 'english_quality', issues: engIssues });
  }

  // 4) Grammar tip checks
  if (card.grammar) {
    const tipIssues = checkGrammarTip(card.grammar, card.grammarNode);
    if (tipIssues.length > 0) {
      cardIssues.push({ type: 'grammar_tip_issue', issues: tipIssues });
    }
    // Track duplicates
    const tipKey = card.grammar.toLowerCase().trim();
    if (!seenTips.has(tipKey)) seenTips.set(tipKey, []);
    seenTips.get(tipKey).push(card.id);
  }

  // 5) Duplicate target sentence
  const targetKey = card.target.toLowerCase().trim();
  if (seenTargets.has(targetKey)) {
    cardIssues.push({ type: 'duplicate_target', duplicateOf: seenTargets.get(targetKey) });
  } else {
    seenTargets.set(targetKey, card.id);
  }

  // 6) Duplicate English
  const engKey = card.english.toLowerCase().trim();
  if (seenEnglish.has(engKey)) {
    cardIssues.push({ type: 'duplicate_english', duplicateOf: seenEnglish.get(engKey) });
  } else {
    seenEnglish.set(engKey, card.id);
  }

  // 7) Vocabulary appropriateness
  // Check for potentially obscure/offensive/irrelevant words
  const targetLower = card.target.toLowerCase();
  if (/\b(seks|pornografie|drugs|wapen|moord|nazi)\b/.test(targetLower)) {
    cardIssues.push({ type: 'inappropriate_vocab', target: card.target });
  }

  // 8) Node assignment sanity - check if card seems misplaced
  // node-01 should be simple greetings, not complex grammar
  if (card.grammarNode === 'node-01' && words.length > 12) {
    cardIssues.push({ type: 'possible_misplaced_node', reason: 'complex sentence in node-01' });
  }

  // 9) Missing required fields
  if (!card.id) cardIssues.push({ type: 'missing_id' });
  if (!card.target) cardIssues.push({ type: 'missing_target' });
  if (!card.english) cardIssues.push({ type: 'missing_english' });
  if (!card.grammarNode) cardIssues.push({ type: 'missing_grammar_node' });
  if (!card.tags || card.tags.length === 0) cardIssues.push({ type: 'missing_tags' });
  if (card.priority === undefined) cardIssues.push({ type: 'missing_priority' });

  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      target: card.target,
      english: card.english,
      grammarNode: card.grammarNode,
      issues: cardIssues,
    });

    // Update summary
    for (const issue of cardIssues) {
      summary.issueBreakdown[issue.type] = (summary.issueBreakdown[issue.type] || 0) + 1;
    }
  }
}

// ── Post-processing: duplicate grammar tips ──────────────────
const dupTipCards = [];
for (const [tip, ids] of seenTips) {
  if (ids.length > 3) {
    // More than 3 cards sharing exact same tip = over-reused
    for (const id of ids.slice(1)) {
      dupTipCards.push(id);
    }
  }
}
if (dupTipCards.length > 0) {
  // Add to existing issue entries or create new ones
  for (const id of dupTipCards) {
    const existing = issues.find(i => i.id === id);
    if (existing) {
      existing.issues.push({ type: 'overused_grammar_tip' });
    }
  }
  summary.issueBreakdown['overused_grammar_tip'] = dupTipCards.length;
}

// ── Build summary ────────────────────────────────────────────
summary.cardsWithIssues = issues.length;
summary.missingAudioCount = summary.issueBreakdown['audio_file_missing'] || 0;
summary.dictCoverageGaps = summary.issueBreakdown['dict_coverage_gap'] || 0;
summary.duplicateTargets = summary.issueBreakdown['duplicate_target'] || 0;
summary.duplicateEnglish = summary.issueBreakdown['duplicate_english'] || 0;
summary.englishQualityIssues = (summary.issueBreakdown['english_quality'] || 0);
summary.grammarTipIssues = (summary.issueBreakdown['grammar_tip_issue'] || 0) + (summary.issueBreakdown['overused_grammar_tip'] || 0);

// Top 50 missing words
const sortedMissing = [...allMissingWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
summary.topMissingWords = sortedMissing.map(([word, count]) => ({ word, count }));

// Most overused grammar tips
const overusedTips = [...seenTips.entries()]
  .filter(([, ids]) => ids.length > 3)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 20)
  .map(([tip, ids]) => ({ tip: tip.substring(0, 100), count: ids.length }));
summary.overusedGrammarTips = overusedTips;

// ── Write output ─────────────────────────────────────────────
const output = { summary, issues };
const outPath = path.join(__dirname, 'output/audit-nl-cards-0.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nAudit complete. ${issues.length} cards with issues out of ${cards.length}.`);
console.log(`Written to: ${outPath}`);
console.log('\nSummary:');
console.log(JSON.stringify(summary, null, 2));
