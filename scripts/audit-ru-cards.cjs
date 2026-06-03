#!/usr/bin/env node
/**
 * Card-by-card audit of ALL Russian batches.
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 *         duplicates, vocabulary appropriateness, audio existence.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'quest-audio');

// ── Load all batches ────────────────────────────────────────
const cards = [];
for (let i = 0; i <= 6; i++) {
  const f = path.join(ROOT, 'scripts', 'output', 'audit-batches', `ru-batch-${i}.json`);
  const batch = JSON.parse(fs.readFileSync(f, 'utf8'));
  cards.push(...batch);
}
console.log(`Loaded ${cards.length} cards`);

// ── Load dictionary keys ────────────────────────────────────
const dictSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'dictionary', 'ru.ts'), 'utf8');
const dictKeys = new Set();
const re = /^\s*['"]([^'"]+)['"]\s*:/gm;
let m;
while ((m = re.exec(dictSrc)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
console.log(`Dictionary: ${dictKeys.size} entries`);

// ── Load audio file list ────────────────────────────────────
const audioFiles = new Set();
try {
  const files = fs.readdirSync(AUDIO_DIR);
  for (const f of files) {
    if (f.startsWith('ru-') && f.endsWith('.mp3')) {
      audioFiles.add(f);
    }
  }
} catch (e) {}
console.log(`Audio files: ${audioFiles.size}`);

// ── Russian stop words (particles, pronouns, prepositions, etc.) ──
const STOP_WORDS = new Set([
  // Pronouns
  'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они',
  'меня', 'тебя', 'его', 'её', 'нас', 'вас', 'их',
  'мне', 'тебе', 'ему', 'ей', 'нам', 'вам', 'им',
  'мной', 'тобой', 'ним', 'ней', 'нами', 'вами', 'ними',
  'себя', 'себе', 'собой',
  'мой', 'моя', 'моё', 'мои', 'моего', 'моей', 'моих', 'моим', 'моими', 'моему', 'моём',
  'твой', 'твоя', 'твоё', 'твои', 'твоего', 'твоей', 'твоих', 'твоим', 'твоими', 'твоему', 'твоём',
  'наш', 'наша', 'наше', 'наши', 'нашего', 'нашей', 'наших', 'нашим', 'нашими', 'нашему', 'нашем',
  'ваш', 'ваша', 'ваше', 'ваши', 'вашего', 'вашей', 'ваших', 'вашим', 'вашими', 'вашему', 'вашем',
  'свой', 'своя', 'своё', 'свои', 'своего', 'своей', 'своих', 'своим', 'своими', 'своему', 'своём',
  'этот', 'эта', 'это', 'эти', 'этого', 'этой', 'этих', 'этим', 'этими', 'этому', 'этом',
  'тот', 'та', 'то', 'те', 'того', 'той', 'тех', 'тем', 'теми', 'тому', 'том',
  'что', 'кто', 'который', 'которая', 'которое', 'которые', 'которого', 'которой', 'которых',
  'которому', 'которым', 'которыми', 'котором',
  'какой', 'какая', 'какое', 'какие', 'какого', 'какой', 'каких',
  'чей', 'чья', 'чьё', 'чьи',
  'все', 'всё', 'всех', 'всем', 'всеми', 'всего',
  'весь', 'вся', 'всю',
  'сам', 'сама', 'само', 'сами', 'самого', 'самой', 'самих',
  'каждый', 'каждая', 'каждое', 'каждые',
  // Prepositions
  'в', 'на', 'с', 'за', 'к', 'по', 'из', 'о', 'об', 'от', 'до', 'у', 'для', 'без', 'при',
  'над', 'под', 'между', 'через', 'перед', 'после', 'около', 'вокруг', 'про',
  'ко', 'во', 'со', 'обо',
  // Conjunctions
  'и', 'а', 'но', 'или', 'что', 'если', 'когда', 'потому', 'чтобы', 'хотя', 'пока',
  'как', 'где', 'куда', 'откуда', 'зачем', 'почему',
  'ни', 'ведь', 'даже', 'только', 'уже', 'ещё', 'еще', 'также', 'тоже',
  // Particles
  'не', 'нет', 'да', 'ли', 'бы', 'же', 'ну', 'вот', 'вон', 'лишь',
  // Adverbs (very common)
  'очень', 'тут', 'там', 'здесь', 'сейчас', 'теперь', 'потом', 'тогда',
  'сегодня', 'завтра', 'вчера',
  // Short adjective forms / copula
  'был', 'была', 'было', 'были', 'будет', 'будут', 'буду', 'будем', 'будете', 'будешь',
  'есть', 'нет',
  // Numerals
  'один', 'одна', 'одно', 'одни', 'два', 'две', 'три', 'четыре', 'пять',
  // Misc
  'надо', 'нужно', 'можно', 'нельзя',
]);

// ── Tokenize Cyrillic text ──────────────────────────────────
function tokenize(text) {
  // Remove punctuation, keep Cyrillic
  return text
    .toLowerCase()
    .replace(/[^а-яёА-ЯЁ\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^-+|-+$/g, ''))
    .filter(w => w.length > 0);
}

// ── Check if word is in dictionary (with basic stemming) ────
function isInDict(word) {
  if (dictKeys.has(word)) return true;

  // Try common Russian endings removal for nouns/adjectives
  const suffixes = [
    // Noun case endings
    'ом', 'ам', 'ами', 'ах', 'ой', 'ей', 'ью', 'ем', 'ём',
    'ов', 'ев', 'ёв',
    // Adjective endings
    'ого', 'его', 'ому', 'ему', 'ым', 'им', 'ой', 'ей',
    'ую', 'юю', 'ые', 'ие', 'ых', 'их', 'ыми', 'ими',
    // Noun plurals
    'ы', 'и', 'а', 'я', 'е',
    // Verb endings (conjugated forms)
    'ю', 'у', 'ешь', 'ёшь', 'ишь', 'ет', 'ёт', 'ит',
    'ем', 'ём', 'им', 'ете', 'ёте', 'ите', 'ют', 'ут', 'ят', 'ат',
    // Past tense
    'ла', 'ло', 'ли', 'л',
    // Short adjectives
    'о', 'а', 'ы',
  ];

  // Try removing suffixes and checking
  for (const suf of suffixes) {
    if (word.length > suf.length + 2 && word.endsWith(suf)) {
      const stem = word.slice(0, -suf.length);
      // Check stem + common infinitive endings
      for (const inf of ['', 'ть', 'ать', 'ить', 'еть', 'ять', 'уть', 'ый', 'ий', 'ой']) {
        if (dictKeys.has(stem + inf)) return true;
      }
      // Check stem as-is (some words might be listed as stems)
      if (dictKeys.has(stem)) return true;
    }
  }

  // Try reflexive -ся/-сь variants
  if (word.endsWith('ся') || word.endsWith('сь')) {
    const base = word.slice(0, -2);
    if (dictKeys.has(base) || dictKeys.has(base + 'ся') || dictKeys.has(base + 'ться') || dictKeys.has(base + 'ть')) return true;
    // Try with -т ending (conjugated reflexive)
    if (base.endsWith('т') || base.endsWith('ю') || base.endsWith('е')) {
      for (const inf of ['ться', 'ся']) {
        // try base minus last char + ться
        if (dictKeys.has(base.slice(0, -1) + 'ться')) return true;
        if (dictKeys.has(base.slice(0, -1) + 'ся')) return true;
      }
    }
  }

  // Prefixed verb check: common prefixes
  const prefixes = ['по', 'на', 'за', 'вы', 'от', 'при', 'пере', 'у', 'с', 'до', 'про', 'об', 'раз', 'рас', 'из', 'ис', 'под', 'воз', 'вос', 'вз', 'вс'];
  for (const pref of prefixes) {
    if (word.startsWith(pref) && word.length > pref.length + 2) {
      const rest = word.slice(pref.length);
      if (dictKeys.has(rest)) return true;
      // Try common forms of the unprefixed verb
      for (const suf of ['ть', 'ать', 'ить', 'еть', 'ять']) {
        if (dictKeys.has(rest + suf)) return true;
      }
    }
  }

  return false;
}

// ── Grammar node to expected topic mapping ──────────────────
const GRAMMAR_NODES = {
  'node-01': 'Basic greetings & introductions',
  'node-02': 'Simple present tense',
  'node-03': 'Nouns & gender',
  'node-04': 'Basic adjectives',
  'node-05': 'Questions & negation',
  'node-06': 'Numbers & time',
  'node-07': 'Prepositions of place',
  'node-08': 'Past tense',
  'node-09': 'Food & drink vocabulary',
  'node-10': 'Family & relationships',
  'node-11': 'Daily routines',
  'node-12': 'Future tense',
  'node-13': 'Comparatives & superlatives',
  'node-14': 'Weather & seasons',
  'node-15': 'Travel & directions',
  'node-16': 'Health & body',
  'node-17': 'Shopping & money',
  'node-18': 'Imperatives',
  'node-19': 'Reflexive verbs',
  'node-20': 'Conditional mood',
  'node-21': 'Passive voice',
  'node-22': 'Relative clauses',
  'node-23': 'Work & professions',
  'node-24': 'Education & learning',
  'node-25': 'Sports & hobbies',
  'node-26': 'Nature & environment',
  'node-27': 'Technology & media',
  'node-28': 'Culture & arts',
  'node-29': 'Politics & society',
  'node-30': 'Advanced connectors',
  'node-31': 'Subjunctive / hypotheticals',
  'node-32': 'Idioms & expressions',
  'node-33': 'Formal vs informal',
  'node-34': 'Abstract concepts',
  'node-35': 'Advanced vocabulary',
};

// ── English quality checks ──────────────────────────────────
function checkEnglishQuality(english) {
  const issues = [];

  // Check for empty
  if (!english || !english.trim()) {
    issues.push('empty_english');
    return issues;
  }

  // Check for untranslated (Cyrillic in English)
  if (/[а-яёА-ЯЁ]/.test(english)) {
    issues.push('cyrillic_in_english');
  }

  // Check for unnatural English
  if (/\b(the the|a a|is is|are are)\b/i.test(english)) {
    issues.push('repeated_words');
  }

  // Check for missing capitalization at start
  if (english.length > 0 && /^[a-z]/.test(english)) {
    issues.push('lowercase_start');
  }

  // Check for very short (likely incomplete)
  if (english.trim().length < 3) {
    issues.push('too_short');
  }

  // Check for garbled text
  if (/[{}[\]<>\\]/.test(english)) {
    issues.push('garbled_text');
  }

  // Check for placeholder patterns
  if (/\b(TODO|FIXME|XXX|placeholder)\b/i.test(english)) {
    issues.push('placeholder');
  }

  return issues;
}

// ── Grammar tip quality checks ──────────────────────────────
function checkGrammarTip(grammar, grammarNode) {
  const issues = [];
  if (!grammar) return issues;

  // Check for conjugation table patterns (not useful as tips)
  if (/^(я|ты|он|она|мы|вы|они)\s*[-––=:]/i.test(grammar)) {
    issues.push('conjugation_table_tip');
  }

  // Check for very short tips
  if (grammar.length < 10) {
    issues.push('tip_too_short');
  }

  // Check for tips that are just the word translation
  if (/^[a-zA-Z]+ = [a-zA-Z]+$/.test(grammar)) {
    issues.push('tip_just_translation');
  }

  // Check for tips with Cyrillic that don't explain anything
  if (/^[а-яёА-ЯЁ\s,]+$/.test(grammar)) {
    issues.push('tip_cyrillic_only');
  }

  return issues;
}

// ── Vocabulary appropriateness ──────────────────────────────
function checkVocabAppropriateness(target, english) {
  const issues = [];

  // Check for offensive/inappropriate content
  const inappropriate = /\b(kill|murder|suicide|hate|racist|sexist|slur|curse|damn|hell|shit|fuck|ass|bitch)\b/i;
  if (inappropriate.test(english)) {
    issues.push('inappropriate_english');
  }

  // Check if target is excessively long (>100 chars suggests a paragraph, not a card)
  if (target.length > 120) {
    issues.push('target_too_long');
  }

  // Check if target is empty or whitespace only
  if (!target || !target.trim()) {
    issues.push('empty_target');
  }

  return issues;
}

// ── Main audit ──────────────────────────────────────────────
const issues = [];
const seenTargets = new Map(); // target -> id for duplicate check
const seenEnglish = new Map(); // english -> id
const templatePatterns = new Map(); // pattern -> [ids]

const summary = {
  totalCards: cards.length,
  cardsWithIssues: 0,
  issueBreakdown: {},
  missingDictWords: new Map(), // word -> count
};

for (const card of cards) {
  const cardIssues = [];

  // 1) Dictionary coverage
  const tokens = tokenize(card.target);
  const missingWords = [];
  for (const word of tokens) {
    if (STOP_WORDS.has(word)) continue;
    if (word.length <= 1) continue;
    if (!isInDict(word)) {
      missingWords.push(word);
      summary.missingDictWords.set(word, (summary.missingDictWords.get(word) || 0) + 1);
    }
  }
  if (missingWords.length > 0) {
    cardIssues.push({ type: 'missing_dict_words', words: missingWords });
  }

  // 2) Grammar tip alignment
  const tipIssues = checkGrammarTip(card.grammar, card.grammarNode);
  if (tipIssues.length > 0) {
    cardIssues.push({ type: 'grammar_tip_issues', details: tipIssues });
  }

  // 3) English quality
  const engIssues = checkEnglishQuality(card.english);
  if (engIssues.length > 0) {
    cardIssues.push({ type: 'english_quality', details: engIssues });
  }

  // 4) Duplicates
  const normTarget = card.target.toLowerCase().trim().replace(/[.!?,;:'"]/g, '');
  if (seenTargets.has(normTarget)) {
    cardIssues.push({ type: 'duplicate_target', duplicateOf: seenTargets.get(normTarget) });
  } else {
    seenTargets.set(normTarget, card.id);
  }

  const normEnglish = card.english.toLowerCase().trim().replace(/[.!?,;:'"]/g, '');
  if (seenEnglish.has(normEnglish)) {
    cardIssues.push({ type: 'duplicate_english', duplicateOf: seenEnglish.get(normEnglish) });
  } else {
    seenEnglish.set(normEnglish, card.id);
  }

  // Template pattern detection: replace names/specific words with placeholders
  const templateTarget = normTarget
    .replace(/[а-яё]+\s+(зовут|зовёт)\s+[а-яё]+/g, 'NAME_PATTERN')
    .replace(/\d+/g, 'NUM');
  const tplKey = `${card.grammarNode}:${templateTarget}`;
  if (!templatePatterns.has(tplKey)) {
    templatePatterns.set(tplKey, []);
  }
  templatePatterns.get(tplKey).push(card.id);

  // 5) Vocabulary appropriateness
  const vocabIssues = checkVocabAppropriateness(card.target, card.english);
  if (vocabIssues.length > 0) {
    cardIssues.push({ type: 'vocab_issues', details: vocabIssues });
  }

  // 6) Audio exists
  if (card.audio) {
    const audioFile = card.audio; // e.g., "ru-ru-0051.mp3"
    if (!audioFiles.has(audioFile)) {
      cardIssues.push({ type: 'missing_audio', file: audioFile });
    }
  } else {
    cardIssues.push({ type: 'no_audio_field' });
  }

  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      target: card.target,
      english: card.english,
      grammarNode: card.grammarNode,
      issues: cardIssues,
    });
    // Count issue types
    for (const iss of cardIssues) {
      const key = iss.type;
      summary.issueBreakdown[key] = (summary.issueBreakdown[key] || 0) + 1;
    }
  }
}

// Check for template patterns (groups > 3 using same template)
const templateDuplicates = [];
for (const [pattern, ids] of templatePatterns) {
  if (ids.length > 5) {
    templateDuplicates.push({ pattern: pattern.slice(0, 80), count: ids.length, sampleIds: ids.slice(0, 5) });
  }
}

summary.cardsWithIssues = issues.length;

// Top missing dictionary words
const topMissing = [...summary.missingDictWords.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 100)
  .map(([word, count]) => ({ word, count }));

// Output
const output = {
  summary: {
    totalCards: summary.totalCards,
    cardsWithIssues: summary.cardsWithIssues,
    cleanCards: summary.totalCards - summary.cardsWithIssues,
    issueBreakdown: summary.issueBreakdown,
    topMissingDictWords: topMissing,
    templateDuplicateGroups: templateDuplicates.length,
    templateDuplicates: templateDuplicates.slice(0, 20),
  },
  cards: issues,
};

const outPath = path.join(ROOT, 'scripts', 'output', 'audit-ru-cards-0.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nAudit complete.`);
console.log(`Total cards: ${summary.totalCards}`);
console.log(`Cards with issues: ${summary.cardsWithIssues}`);
console.log(`Clean cards: ${summary.totalCards - summary.cardsWithIssues}`);
console.log(`\nIssue breakdown:`);
for (const [k, v] of Object.entries(summary.issueBreakdown).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log(`\nTop 20 missing dict words:`);
for (const { word, count } of topMissing.slice(0, 20)) {
  console.log(`  ${word}: ${count}`);
}
console.log(`\nTemplate duplicate groups (>5 same pattern): ${templateDuplicates.length}`);
console.log(`\nOutput written to: ${outPath}`);
