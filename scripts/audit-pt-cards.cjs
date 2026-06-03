#!/usr/bin/env node
/**
 * Comprehensive card-by-card audit of Portuguese batches 0-3 (~2000 cards).
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 *         duplicates, vocabulary appropriateness, audio existence.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'quest-audio');
const DICT_FILE = path.join(ROOT, 'src', 'data', 'dictionary', 'pt.ts');
const BATCH_DIR = path.join(ROOT, 'scripts', 'output', 'audit-batches');

// ─── Load batches ───
const cards = [];
for (let i = 0; i <= 3; i++) {
  const batch = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, `pt-batch-${i}.json`), 'utf8'));
  cards.push(...batch);
}
console.log(`Loaded ${cards.length} cards from batches 0-3`);

// ─── Parse dictionary from TS file ───
const dictSrc = fs.readFileSync(DICT_FILE, 'utf8');

// Extract dictionary keys (words)
const dictKeys = new Set();
// Match patterns like:  word: { or  'word': { or  "word": {
const keyRegex = /^\s+(?:'([^']+)'|"([^"]+)"|([\wÀ-ÿ][\wÀ-ÿ-]*)):\s*\{/gm;
let m;
while ((m = keyRegex.exec(dictSrc)) !== null) {
  const key = m[1] || m[2] || m[3];
  if (key && key !== 'en' && key !== 'ipa' && key !== 'pos' && key !== 'lemma') {
    dictKeys.add(key.toLowerCase());
  }
}
console.log(`Dictionary has ${dictKeys.size} entries`);

// Extract contraction map keys
const contractionKeys = new Set();
const cMapRegex = /'(\w+)':\s*\[/g;
const cMapSection = dictSrc.match(/CONTRACTION_MAP[^}]*\{([^}]+)\}/s);
if (cMapSection) {
  let cm;
  while ((cm = cMapRegex.exec(cMapSection[0])) !== null) {
    contractionKeys.add(cm[1].toLowerCase());
  }
}

// Extract irregular map keys
const irregularKeys = new Set();
const iMapSection = dictSrc.match(/IRREGULAR_MAP[^}]*\{([\s\S]*?)\n\};\s*$/m);
if (iMapSection) {
  const iRegex = /([\wÀ-ÿ][\wÀ-ÿ]*)\s*:/g;
  let im;
  while ((im = iRegex.exec(iMapSection[0])) !== null) {
    const k = im[1].toLowerCase();
    if (k !== 'record' && k !== 'string') {
      irregularKeys.add(k);
    }
  }
}
console.log(`Contractions: ${contractionKeys.size}, Irregulars: ${irregularKeys.size}`);

// ─── Build audio file set ───
const audioFiles = new Set();
try {
  const files = fs.readdirSync(AUDIO_DIR);
  for (const f of files) {
    if (f.startsWith('pt-') && f.endsWith('.mp3')) {
      audioFiles.add(f);
    }
  }
} catch (e) { /* no audio dir */ }
console.log(`Audio files: ${audioFiles.size}`);

// ─── Utility functions ───

// Tokenize Portuguese sentence into words
function tokenize(sentence) {
  return sentence
    .replace(/[.,!?;:"""''()––…\-\/\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w.toLowerCase());
}

// Check if word is in dictionary (direct, contraction, irregular, or number)
function isWordCovered(word) {
  if (!word || word.length === 0) return true;
  if (/^\d+$/.test(word)) return true; // numbers
  if (dictKeys.has(word)) return true;
  if (contractionKeys.has(word)) return true;
  if (irregularKeys.has(word)) return true;
  // Common suffixed forms - check lemma patterns
  // -s, -es, -mos, -m, -ram, -va, etc.
  return false;
}

// Check English quality issues
function checkEnglishQuality(english) {
  const issues = [];

  // Untranslated Portuguese words in English (whole word match only)
  const ptWords = ['não', 'sim', 'muito', 'pouco', 'também', 'aqui', 'ali', 'agora'];
  const engLower = english.toLowerCase();
  for (const w of ptWords) {
    const re = new RegExp(`\\b${w}\\b`, 'i');
    if (re.test(engLower) && !engLower.includes(`"${w}"`) && !engLower.includes(`'${w}'`)) {
      issues.push(`possible-untranslated: "${w}"`);
    }
  }

  // Awkward/unnatural English patterns
  if (/\bhe\/she\b/i.test(english)) issues.push('awkward: he/she');
  if (/\byou \(formal\)/i.test(english)) {} // acceptable
  if (/\bone \b/i.test(english) && /^One [a-z]/.test(english)) {} // acceptable

  // Missing period or punctuation at end
  const trimmed = english.trim();
  if (trimmed.length > 0 && !/[.!?)]$/.test(trimmed)) {
    issues.push('missing-end-punctuation');
  }

  // Double spaces
  if (/  /.test(english)) issues.push('double-space');

  // Leading/trailing spaces
  if (english !== english.trim()) issues.push('whitespace');

  // Very short English (likely incomplete)
  if (trimmed.length < 3) issues.push('too-short');

  // Repeated words
  const words = english.toLowerCase().split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i-1] && words[i].length > 2) {
      issues.push(`repeated-word: "${words[i]}"`);
      break;
    }
  }

  // Starts with lowercase (unless it's a special case)
  if (/^[a-z]/.test(trimmed) && !trimmed.startsWith('e.g.') && !trimmed.startsWith('i.e.')) {
    issues.push('starts-lowercase');
  }

  return issues;
}

// Check grammar tip quality
function checkGrammarTip(card) {
  const issues = [];
  if (!card.grammar) return issues;

  const tip = card.grammar;

  // Conjugation pattern tips (should be contextual/usage-based)
  if (/\b(conjugat|conjugação)\b/i.test(tip) && !/\b(when|use|means|context|common|colloquial|spoken)\b/i.test(tip)) {
    issues.push('grammar-tip-conjugation-pattern');
  }

  // Very short tips (likely unhelpful)
  if (tip.length < 15) issues.push('grammar-tip-too-short');

  // Very long tips (hard to read on card)
  if (tip.length > 300) issues.push('grammar-tip-too-long');

  // Tip doesn't relate to card content (basic check)
  // Check if tip mentions a grammar concept matching the node

  // Duplicate tip text check will be done separately

  return issues;
}

// Check vocabulary appropriateness
function checkVocab(card) {
  const issues = [];
  const target = card.target.toLowerCase();

  // Obscure/archaic vocabulary
  const obscurePatterns = [
    /\bpercalço\b/, /\bálacre\b/, /\bcontumélia\b/, /\bproceloso\b/,
    /\bluzídio\b/, /\btacanhez\b/, /\bprefulgente\b/
  ];
  for (const p of obscurePatterns) {
    if (p.test(target)) issues.push('obscure-vocabulary');
  }

  // Check for cultural-specific references that may be impractical
  // (mild check - just flagging unusual proper nouns)

  return issues;
}

// ─── Main audit ───
const issues = [];
const seenTargets = new Map(); // target → card id (for duplicates)
const seenEnglish = new Map(); // english → card id
const grammarTips = new Map(); // tip text → [card ids]

const summary = {
  totalCards: cards.length,
  cardsWithIssues: 0,
  dictCoverageIssues: 0,
  grammarTipIssues: 0,
  englishQualityIssues: 0,
  duplicateTarget: 0,
  duplicateEnglish: 0,
  vocabIssues: 0,
  audioMissing: 0,
  missingEndPunctuation: 0,
  duplicateGrammarTips: 0,
  byCategory: {},
};

for (const card of cards) {
  const cardIssues = [];

  // 1. Dictionary coverage
  const words = tokenize(card.target);
  const uncovered = words.filter(w => !isWordCovered(w));
  if (uncovered.length > 0) {
    cardIssues.push({
      type: 'dict-coverage',
      detail: `Uncovered words: ${uncovered.join(', ')}`,
      words: uncovered
    });
    summary.dictCoverageIssues++;
  }

  // 2. Grammar tip alignment
  const grammarIssues = checkGrammarTip(card);
  if (grammarIssues.length > 0) {
    cardIssues.push({
      type: 'grammar-tip',
      detail: grammarIssues.join('; ')
    });
    summary.grammarTipIssues++;
  }

  // Track grammar tip duplicates
  if (card.grammar) {
    const tipKey = card.grammar.trim().toLowerCase();
    if (!grammarTips.has(tipKey)) grammarTips.set(tipKey, []);
    grammarTips.get(tipKey).push(card.id);
  }

  // 3. English quality
  const engIssues = checkEnglishQuality(card.english);
  if (engIssues.length > 0) {
    cardIssues.push({
      type: 'english-quality',
      detail: engIssues.join('; ')
    });
    summary.englishQualityIssues++;
    for (const ei of engIssues) {
      if (ei === 'missing-end-punctuation') summary.missingEndPunctuation++;
    }
  }

  // 4. Duplicates
  const targetKey = card.target.trim().toLowerCase();
  if (seenTargets.has(targetKey)) {
    cardIssues.push({
      type: 'duplicate-target',
      detail: `Duplicate of ${seenTargets.get(targetKey)}`
    });
    summary.duplicateTarget++;
  } else {
    seenTargets.set(targetKey, card.id);
  }

  const engKey = card.english.trim().toLowerCase();
  if (seenEnglish.has(engKey)) {
    cardIssues.push({
      type: 'duplicate-english',
      detail: `Same English as ${seenEnglish.get(engKey)}`
    });
    summary.duplicateEnglish++;
  } else {
    seenEnglish.set(engKey, card.id);
  }

  // 5. Vocabulary appropriateness
  const vocabIssues = checkVocab(card);
  if (vocabIssues.length > 0) {
    cardIssues.push({
      type: 'vocab',
      detail: vocabIssues.join('; ')
    });
    summary.vocabIssues++;
  }

  // 6. Audio exists
  if (card.audio) {
    if (!audioFiles.has(card.audio)) {
      cardIssues.push({
        type: 'audio-missing',
        detail: `Audio file not found: ${card.audio}`
      });
      summary.audioMissing++;
    }
  } else {
    cardIssues.push({
      type: 'audio-missing',
      detail: 'No audio field'
    });
    summary.audioMissing++;
  }

  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      target: card.target,
      english: card.english,
      grammarNode: card.grammarNode,
      grammar: card.grammar || null,
      issues: cardIssues
    });
    summary.cardsWithIssues++;

    // Count by category
    for (const ci of cardIssues) {
      summary.byCategory[ci.type] = (summary.byCategory[ci.type] || 0) + 1;
    }
  }
}

// Check for grammar tip overuse (same tip on too many cards)
const overusedTips = [];
for (const [tip, ids] of grammarTips.entries()) {
  if (ids.length > 10) {
    overusedTips.push({ tip: tip.substring(0, 80) + '...', count: ids.length, sampleIds: ids.slice(0, 5) });
    summary.duplicateGrammarTips++;
  }
}

// ─── Collect most common uncovered words ───
const uncoveredWordCounts = {};
for (const iss of issues) {
  for (const i of iss.issues) {
    if (i.type === 'dict-coverage' && i.words) {
      for (const w of i.words) {
        uncoveredWordCounts[w] = (uncoveredWordCounts[w] || 0) + 1;
      }
    }
  }
}
const topUncovered = Object.entries(uncoveredWordCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50)
  .map(([word, count]) => ({ word, count }));

// ─── Output ───
const output = {
  audit: 'Portuguese batches 0-3 card-by-card audit',
  date: new Date().toISOString(),
  summary: {
    ...summary,
    cleanCards: cards.length - summary.cardsWithIssues,
    cleanPct: ((cards.length - summary.cardsWithIssues) / cards.length * 100).toFixed(1) + '%',
  },
  topUncoveredWords: topUncovered,
  overusedGrammarTips: overusedTips,
  cardIssues: issues
};

const outPath = path.join(ROOT, 'scripts', 'output', 'audit-pt-cards-0.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nAudit complete. ${summary.cardsWithIssues}/${cards.length} cards with issues.`);
console.log(`Written to: ${outPath}`);
console.log('\nSummary:');
console.log(JSON.stringify(summary, null, 2));
console.log('\nTop 20 uncovered words:');
for (const {word, count} of topUncovered.slice(0, 20)) {
  console.log(`  ${word}: ${count}`);
}
if (overusedTips.length > 0) {
  console.log(`\nOverused grammar tips (>10 cards): ${overusedTips.length}`);
}
