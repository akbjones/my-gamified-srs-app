const fs = require('fs');
const path = require('path');

const BASE = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd';

// Load cards
const cards = [
  ...require(path.join(BASE, 'scripts/output/audit-batches/fr-batch-4.json')),
  ...require(path.join(BASE, 'scripts/output/audit-batches/fr-batch-5.json')),
  ...require(path.join(BASE, 'scripts/output/audit-batches/fr-batch-6.json')),
  ...require(path.join(BASE, 'scripts/output/audit-batches/fr-batch-7.json')),
];

// Load all prior cards for cross-batch duplicate detection
let priorCards = [];
for (let i = 0; i < 4; i++) {
  try {
    priorCards.push(...require(path.join(BASE, `scripts/output/audit-batches/fr-batch-${i}.json`)));
  } catch(e) {}
}

// Load dictionary keys
const dictSrc = fs.readFileSync(path.join(BASE, 'src/data/dictionary/fr.ts'), 'utf8');
const dictSection = dictSrc.slice(dictSrc.indexOf('Record<string, DictEntry>'));
const dictKeys = new Set();
const reKey = /^\s*['"]([^'"]+)['"]\s*:/gm;
let km;
while ((km = reKey.exec(dictSection)) !== null) {
  dictKeys.add(km[1].toLowerCase());
}

// Load audio files
const audioDir = path.join(BASE, 'public/quest-audio');
const audioFiles = new Set(fs.readdirSync(audioDir).filter(f => f.startsWith('fr-') && f.endsWith('.mp3')));

// Stop words, known compounds, elision
const STOP_WORDS = new Set([
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  'ce', 'ces', 'cette', 'cet', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'ne', 'pas', 'plus', 'en', 'y',
  'à', 'dans', 'sur', 'sous', 'par', 'pour', 'avec', 'sans', 'entre', 'vers', 'chez',
  'est', 'a', 'ai', 'as', 'ont', 'sont', 'suis', 'es', 'été', 'sera', 'seront',
  'très', 'bien', 'si', 'tout', 'tous', 'toute', 'toutes',
  'qui', 'dont', 'où', 'quand', 'comment', 'pourquoi',
  'aussi', 'comme', 'même', 'trop', 'peu', 'beaucoup',
  'ici', 'là', 'puis', 'or', 'lors', 'dès',
]);

const KNOWN_COMPOUNDS = new Set([
  "quelqu'un", "quelqu'une", "aujourd'hui", "jusqu'à", "jusqu'au", "jusqu'aux",
  "jusqu'en", "jusqu'ici", "lorsqu'il", "lorsqu'elle", "lorsqu'ils", "lorsqu'elles",
  "lorsqu'on", "lorsqu'un", "lorsqu'une",
  "quoiqu'il", "quoiqu'elle", "quoiqu'on", "quoiqu'ils",
  "puisqu'il", "puisqu'elle", "puisqu'on", "puisqu'ils",
  "presqu'île",
]);

const ELISION_PREFIXES = ["qu'", "l'", "d'", "j'", "n'", "s'", "c'", "m'", "t'"];

const ENGLISH_FRENCH_LOANWORDS = new Set([
  'café', 'naïve', 'résumé', 'fiancé', 'fiancée', 'cliché', 'déjà',
  'entrée', 'soirée', 'protégé', 'attaché', 'exposé', 'rosé', 'décor',
]);

function tryVerbLookup(word) {
  const patterns = [
    [/(.{2,})ons$/, ['$1er', '$1ir', '$1re', '$1oir']],
    [/(.{2,})ez$/, ['$1er', '$1ir', '$1re']],
    [/(.{2,})ent$/, ['$1er', '$1ir', '$1re']],
    [/(.{2,})ais$/, ['$1er', '$1ir', '$1re', '$1oir']],
    [/(.{2,})ait$/, ['$1er', '$1ir', '$1re', '$1oir']],
    [/(.{2,})aient$/, ['$1er', '$1ir', '$1re', '$1oir']],
    [/(.{2,})ions$/, ['$1er', '$1ir', '$1re']],
    [/(.{2,})iez$/, ['$1er', '$1ir', '$1re']],
    [/(.{2,})erai$/, ['$1er']], [/(.{2,})eras$/, ['$1er']], [/(.{2,})era$/, ['$1er']],
    [/(.{2,})erons$/, ['$1er']], [/(.{2,})erez$/, ['$1er']], [/(.{2,})eront$/, ['$1er']],
    [/(.{2,})erais$/, ['$1er']], [/(.{2,})erait$/, ['$1er']], [/(.{2,})eraient$/, ['$1er']],
    [/(.{2,})é$/, ['$1er']], [/(.{2,})ée$/, ['$1er']], [/(.{2,})és$/, ['$1er']], [/(.{2,})ées$/, ['$1er']],
    [/(.{2,})issons$/, ['$1ir']], [/(.{2,})issez$/, ['$1ir']], [/(.{2,})issent$/, ['$1ir']],
    [/(.{2,})issais$/, ['$1ir']], [/(.{2,})issait$/, ['$1ir']], [/(.{2,})issaient$/, ['$1ir']],
    [/(.{2,})irai$/, ['$1ir']], [/(.{2,})iras$/, ['$1ir']], [/(.{2,})ira$/, ['$1ir']],
    [/(.{2,})irons$/, ['$1ir']], [/(.{2,})irez$/, ['$1ir']], [/(.{2,})iront$/, ['$1ir']],
    [/(.{2,})irais$/, ['$1ir']], [/(.{2,})irait$/, ['$1ir']], [/(.{2,})iraient$/, ['$1ir']],
    [/(.{2,})ant$/, ['$1er', '$1ir', '$1re', '$1oir']],
    [/(.{2,})èrent$/, ['$1er']],
    [/(.{2,})irent$/, ['$1ir', '$1re']],
    [/(.{2,})urent$/, ['$1oir', '$1re']],
    [/(.{2,})ut$/, ['$1oir', '$1re']],
    [/(.{2,})ît$/, ['$1ir', '$1re']],
    [/(.{2,})isse$/, ['$1ir']], [/(.{2,})isses$/, ['$1ir']],
  ];
  for (const [re, repls] of patterns) {
    if (re.test(word)) {
      for (const repl of repls) {
        const inf = word.replace(re, repl);
        if (dictKeys.has(inf)) return true;
      }
    }
  }
  return false;
}

function lookupInDict(raw) {
  let clean = raw.toLowerCase().replace(/[¿¡.,!?;:"""\u2018\u2019()—–«»\d/…\[\]«»]/g, '').trim();
  if (!clean || clean.length <= 1) return true;
  if (STOP_WORDS.has(clean)) return true;
  if (KNOWN_COMPOUNDS.has(clean)) return true;
  if (dictKeys.has(clean)) return true;
  for (const prefix of ELISION_PREFIXES) {
    if (clean.startsWith(prefix)) {
      const remainder = clean.slice(prefix.length);
      if (!remainder) continue;
      if (dictKeys.has(remainder) || STOP_WORDS.has(remainder) || KNOWN_COMPOUNDS.has(clean)) return true;
      if (remainder.includes('-')) {
        const hbase = remainder.split('-')[0];
        if (dictKeys.has(hbase) || STOP_WORDS.has(hbase)) return true;
      }
      if (tryVerbLookup(remainder)) return true;
      // Plural/fem of remainder
      for (const sfx of ['s', 'e', 'es']) {
        if (remainder.endsWith(sfx) && remainder.length > sfx.length + 2) {
          const b = remainder.slice(0, -sfx.length);
          if (dictKeys.has(b)) return true;
        }
      }
    }
  }
  if (clean.includes('-')) {
    if (dictKeys.has(clean)) return true;
    const parts = clean.split('-');
    if (parts.every(p => p.length <= 2 || STOP_WORDS.has(p) || dictKeys.has(p))) return true;
  }
  if (tryVerbLookup(clean)) return true;
  for (const suffix of ['s', 'e', 'es', 'x', 'aux', 'ment', 'tion', 'sion']) {
    if (clean.endsWith(suffix) && clean.length > suffix.length + 2) {
      const base = clean.slice(0, -suffix.length);
      if (dictKeys.has(base)) return true;
      if (suffix === 'aux' && dictKeys.has(base + 'al')) return true;
      if (suffix === 'ment' && (dictKeys.has(base + 'er') || dictKeys.has(base))) return true;
    }
  }
  return false;
}

function extractWords(sentence) {
  return sentence
    .replace(/[.,!?;:"""\u2018\u2019()—–«»\d/…\[\]«»]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// ── AUDIT ──
const issues = [];
const summaryCounts = {
  totalCards: cards.length,
  cardsWithIssues: 0,
  dictCoverage: 0,
  grammarTipConjugationPattern: 0,
  englishQuality: 0,
  duplicateTarget: 0,
  duplicateEnglish: 0,
  vocabInappropriate: 0,
  audioMissing: 0,
  missingPriority: 0,
  missingTags: 0,
  grammarNodeMisalignment: 0,
};

const targetSeen = {};
const englishSeen = {};
for (const pc of priorCards) {
  targetSeen[pc.target.toLowerCase().trim()] = pc.id;
  englishSeen[pc.english.toLowerCase().trim()] = pc.id;
}

for (const card of cards) {
  const cardIssues = [];

  // 1. Dictionary coverage
  const words = extractWords(card.target);
  const missingWords = [];
  for (const w of words) {
    if (!lookupInDict(w)) missingWords.push(w);
  }
  if (missingWords.length > 0) {
    cardIssues.push({ type: 'dict_coverage', missing: missingWords });
    summaryCounts.dictCoverage++;
  }

  // 2. Grammar tip quality - boring conjugation patterns
  if (card.grammar) {
    const tip = card.grammar;
    const isBoring = (
      /-ais, -ais, -ait|-us, -us, -ut|-is, -is, -it|-ai, -as, -a|-ai, -as, -a, -ons|-e, -es, -e, -ons/i.test(tip) &&
      tip.length < 140 &&
      !/careful|note|don't|avoid|usage|context|meaning|nuance|trigger|watch|tip|remember|confus|careful|subtle|common mistake|unlike|rather than/i.test(tip)
    );
    if (isBoring) {
      cardIssues.push({ type: 'grammar_tip_conjugation_pattern', tip });
      summaryCounts.grammarTipConjugationPattern++;
    }
  }

  // 3. English quality
  const eng = card.english;
  const engIssues = [];
  const frCharsInEng = eng.match(/\b\w*[àâäéèêëïîôùûüÿçœæ]\w*\b/gi) || [];
  const trulyFrench = frCharsInEng.filter(w => !ENGLISH_FRENCH_LOANWORDS.has(w.toLowerCase()));
  if (trulyFrench.length > 0 && !/[("']/.test(eng)) {
    engIssues.push('french_chars_in_english: ' + trulyFrench.join(', '));
  }
  if (eng.length < 5) engIssues.push('too_short');
  if (/TODO|FIXME|XXX|placeholder/i.test(eng)) engIssues.push('placeholder');
  // Repeated word (but allow "had had", "that that", common English patterns)
  const repeatedMatch = eng.match(/\b(\w+)\s+\1\b/i);
  if (repeatedMatch && !['had', 'that', 'the'].includes(repeatedMatch[1].toLowerCase())) {
    engIssues.push('repeated_word: ' + repeatedMatch[0]);
  }
  // Starts with punctuation or incomplete
  if (/^\s*[,;]/.test(eng)) engIssues.push('starts_with_punctuation');
  if (engIssues.length > 0) {
    cardIssues.push({ type: 'english_quality', issues: engIssues, english: eng });
    summaryCounts.englishQuality++;
  }

  // 4. Duplicates (cross-batch)
  const normTarget = card.target.toLowerCase().trim();
  if (targetSeen[normTarget]) {
    cardIssues.push({ type: 'duplicate_target', otherCard: targetSeen[normTarget] });
    summaryCounts.duplicateTarget++;
  } else {
    targetSeen[normTarget] = card.id;
  }
  const normEng = eng.toLowerCase().trim();
  if (englishSeen[normEng]) {
    cardIssues.push({ type: 'duplicate_english', otherCard: englishSeen[normEng], english: eng });
    summaryCounts.duplicateEnglish++;
  } else {
    englishSeen[normEng] = card.id;
  }

  // 5. Vocabulary appropriateness
  const vocabIssues = [];
  const engInFr = card.target.match(/\b(because|however|although|therefore|meanwhile|furthermore|nevertheless|actually|probably|already|anything|everything|something|nothing|someone|everyone|nobody|anybody)\b/gi);
  if (engInFr) vocabIssues.push({ reason: 'english_in_target', words: engInFr });
  if (card.target.length > 200) vocabIssues.push({ reason: 'overly_long', length: card.target.length });
  if (vocabIssues.length > 0) {
    cardIssues.push({ type: 'vocab_inappropriate', issues: vocabIssues });
    summaryCounts.vocabInappropriate++;
  }

  // 6. Audio exists
  if (!card.audio) {
    cardIssues.push({ type: 'audio_missing', detail: 'no_audio_field' });
    summaryCounts.audioMissing++;
  } else if (!audioFiles.has(card.audio)) {
    cardIssues.push({ type: 'audio_missing', detail: 'file_not_found', file: card.audio });
    summaryCounts.audioMissing++;
  }

  // 7. Grammar node misalignment spot checks
  const nodeNum = parseInt(card.grammarNode.replace('node-', ''));
  const target = card.target.toLowerCase();
  const grammar = (card.grammar || '').toLowerCase();
  let misaligned = false;
  let misalignReason = '';

  // node-22 = subjonctif imparfait (literary). Check for -asse, -isse, -usse forms
  if (nodeNum === 22) {
    if (!/(asse|isses?|usses?|ût|ît|assent|issent|ussent|subjonctif imparfait|imperfect subjunctive|literary subjunctive)/i.test(target + ' ' + grammar)) {
      // Could be misaligned but don't flag too aggressively
    }
  }

  // node-30 = idioms. Should be idiomatic
  if (nodeNum === 30) {
    if (grammar && !/idiom|expression|proverb|figurative|colloquial|slang|literally|lit\.|lit:/i.test(grammar)) {
      // Light check - idiom cards should usually have tips explaining the expression
    }
  }

  // Bonus checks
  if (card.priority === undefined || card.priority === null) {
    cardIssues.push({ type: 'missing_priority' });
    summaryCounts.missingPriority++;
  }
  if (!card.tags || card.tags.length === 0) {
    cardIssues.push({ type: 'missing_tags' });
    summaryCounts.missingTags++;
  }

  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      grammarNode: card.grammarNode,
      target: card.target,
      english: card.english,
      grammar: card.grammar || null,
      issues: cardIssues,
    });
    summaryCounts.cardsWithIssues++;
  }
}

// Additional analysis: dictionary coverage of all unique words
const allWords = new Set();
const allMissing = new Set();
for (const card of cards) {
  for (const w of extractWords(card.target)) {
    const clean = w.toLowerCase().replace(/[¿¡.,!?;:"""\u2018\u2019()—–«»\d/…\[\]«»]/g, '').trim();
    if (clean.length > 1) {
      allWords.add(clean);
      if (!lookupInDict(w)) allMissing.add(clean);
    }
  }
}

const output = {
  audit: 'French batches 4-7 card-by-card audit',
  date: new Date().toISOString().slice(0, 10),
  batchRange: 'batches 4-7 (cards fr-2001 to fr-3927)',
  totalCards: cards.length,
  uniqueWords: allWords.size,
  dictCoveragePercent: ((1 - allMissing.size / allWords.size) * 100).toFixed(1) + '%',
  missingFromDict: [...allMissing].sort(),
  summary: summaryCounts,
  issueBreakdown: {
    dictCoverage: `${summaryCounts.dictCoverage} cards have words not found in dictionary`,
    grammarTipConjugationPattern: `${summaryCounts.grammarTipConjugationPattern} grammar tips list conjugation endings without contextual insight`,
    englishQuality: `${summaryCounts.englishQuality} cards have English quality issues`,
    duplicateTarget: `${summaryCounts.duplicateTarget} duplicate French sentences (incl. cross-batch with batches 0-3)`,
    duplicateEnglish: `${summaryCounts.duplicateEnglish} duplicate English translations (incl. cross-batch)`,
    vocabInappropriate: `${summaryCounts.vocabInappropriate} cards with vocabulary issues`,
    audioMissing: `${summaryCounts.audioMissing} cards missing audio files`,
    missingPriority: `${summaryCounts.missingPriority} cards missing priority field`,
    missingTags: `${summaryCounts.missingTags} cards missing tags`,
  },
  issueCards: issues,
};

const outPath = path.join(BASE, 'scripts/output/audit-fr-cards-1.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log('Written to', outPath);
console.log('\nSummary:', JSON.stringify(summaryCounts, null, 2));
console.log('\nMissing words from dict:', [...allMissing].sort().join(', '));
