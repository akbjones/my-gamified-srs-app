#!/usr/bin/env node
/**
 * Card-by-card audit of ALL Hindi batches.
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 * duplicates, vocabulary appropriateness, audio existence.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_DIR = path.join(ROOT, 'scripts/output/audit-batches');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/hi.ts');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');

// ── Load all cards ──────────────────────────────────────────
const allCards = [];
for (let i = 0; i <= 6; i++) {
  const batch = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, `hi-batch-${i}.json`), 'utf8'));
  allCards.push(...batch);
}
console.log(`Loaded ${allCards.length} cards`);

// ── Load dictionary keys ────────────────────────────────────
const dictSrc = fs.readFileSync(DICT_PATH, 'utf8');
const dictKeys = new Set();
// Single-quoted keys
for (const m of dictSrc.matchAll(/^\s*'([^']+)'\s*:/gm)) dictKeys.add(m[1]);
// Double-quoted keys
for (const m of dictSrc.matchAll(/^\s*"([^"]+)"\s*:/gm)) dictKeys.add(m[1]);
console.log(`Dictionary has ${dictKeys.size} entries`);

// ── Load audio file list ────────────────────────────────────
const audioFiles = new Set();
try {
  const files = fs.readdirSync(AUDIO_DIR);
  for (const f of files) {
    if (f.startsWith('hi-hi-') && f.endsWith('.mp3')) audioFiles.add(f);
  }
} catch (e) { /* ignore */ }
console.log(`Found ${audioFiles.size} Hindi audio files`);

// ── Hindi tokenizer ─────────────────────────────────────────
// Hindi postpositions and particles to skip during dictionary lookup
const HINDI_STOP_WORDS = new Set([
  'है', 'हैं', 'हूँ', 'हो', 'था', 'थी', 'थे', 'थीं',
  'में', 'पर', 'से', 'को', 'का', 'की', 'के', 'ने',
  'और', 'या', 'भी', 'तो', 'ही', 'न', 'नहीं', 'मत',
  'यह', 'वह', 'ये', 'वे', 'इस', 'उस', 'इन', 'उन',
  'मैं', 'तू', 'तुम', 'आप', 'हम', 'वो',
  'मुझे', 'तुझे', 'तुम्हें', 'आपको', 'हमें', 'उसे', 'उन्हें', 'इसे',
  'मेरा', 'मेरी', 'मेरे', 'तेरा', 'तेरी', 'तेरे',
  'तुम्हारा', 'तुम्हारी', 'तुम्हारे', 'आपका', 'आपकी', 'आपके',
  'हमारा', 'हमारी', 'हमारे', 'उसका', 'उसकी', 'उसके', 'उनका', 'उनकी', 'उनके', 'इसका', 'इसकी', 'इसके',
  'कि', 'जो', 'जब', 'तब', 'अगर', 'क्या', 'कैसे', 'कहाँ', 'कब', 'क्यों', 'कौन', 'किस', 'किसी', 'कुछ',
  'एक', 'दो', 'तीन', 'चार', 'पाँच',
  'बहुत', 'कम', 'ज़्यादा', 'सब', 'कोई', 'हर',
  'अपना', 'अपनी', 'अपने', 'खुद',
  'लिए', 'साथ', 'बाद', 'पहले', 'बीच', 'ऊपर', 'नीचे', 'अंदर', 'बाहर',
  'जी', 'हाँ', 'नहीं', 'ना',
  'रहा', 'रही', 'रहे', 'गया', 'गई', 'गए',
  'कर', 'हुआ', 'हुई', 'हुए', 'होता', 'होती', 'होते',
  'सकता', 'सकती', 'सकते', 'चाहिए',
  'वाला', 'वाली', 'वाले',
  'रहा', 'रही', 'रहे',
  'दिया', 'दी', 'दिए', 'लिया', 'ली', 'लिए',
  'जा', 'आ', 'ले', 'दे', 'कर',
  'तक', 'बिना', 'जैसे', 'जहाँ', 'वहाँ', 'यहाँ',
]);

// Common Hindi verb suffixes to strip for stem matching
const VERB_SUFFIXES = ['ता', 'ती', 'ते', 'ना', 'ने', 'नी', 'आ', 'ई', 'ए', 'ो', 'ें', 'ूँ', 'ेगा', 'ेगी', 'ेंगे', 'ूँगा', 'ूँगी', 'ोगे', 'ोगी'];

function tokenizeHindi(text) {
  // Remove punctuation, split on spaces
  const cleaned = text.replace(/[।,?!;:'"()—–\-\.0-9]/g, ' ').trim();
  return cleaned.split(/\s+/).filter(w => w.length > 0);
}

function isInDict(word) {
  if (dictKeys.has(word)) return true;
  // Try stripping common suffixes to find infinitive
  for (const suffix of VERB_SUFFIXES) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      const stem = word.slice(0, -suffix.length);
      if (dictKeys.has(stem + 'ना')) return true;
      if (dictKeys.has(stem + 'ा')) return true;
      if (dictKeys.has(stem)) return true;
    }
  }
  // Try adding ना (infinitive form)
  if (dictKeys.has(word + 'ना')) return true;
  return false;
}

function checkDictCoverage(card) {
  const tokens = tokenizeHindi(card.target);
  const missing = [];
  for (const tok of tokens) {
    if (HINDI_STOP_WORDS.has(tok)) continue;
    if (tok.length <= 1) continue;
    if (!isInDict(tok)) {
      missing.push(tok);
    }
  }
  return missing;
}

// ── English quality checks ──────────────────────────────────
function checkEnglishQuality(eng) {
  const issues = [];

  // Check for PrRiya or name formatting errors
  if (/Pr[A-Z]/.test(eng)) issues.push('PrName formatting error');
  if (/[A-Z]{2,}/.test(eng) && !/\b(TV|UK|US|CEO|NGO|HR|IT|AI|GPS|ATM|SIM|ID|EMI|OPD|ICU|IQ|PhD|MBA|MRI|AC|DC|FM|AM|PM|DNA|RNA|HIV|AIDS|UNESCO|WHO|UN|EU|FIFA|BMW|USB|LED|LCD|DVD|CD|SMS|OTP|PIN|IELTS|TOEFL)\b/.test(eng)) {
    // Check if it's not a valid acronym
    const caps = eng.match(/[A-Z]{2,}/g);
    if (caps) {
      for (const c of caps) {
        if (c.length > 4 && !/^[A-Z]{2,5}$/.test(c)) issues.push(`Suspicious capitals: ${c}`);
      }
    }
  }

  // Gender/article errors - strict check to avoid false positives
  // "She ... her" is fine (same person), flag "he ... her" or "she ... his" only when clearly wrong
  if (/\bhe\b.*\b(her|she)\b/i.test(eng) && !/\bhe\b.*\b(her|his)\b/i.test(eng.replace(/\bher\b/gi, 'POSSESSIVE'))) {
    // Only flag if "her" is not possessive (hard to detect)
  }
  // Flag actual mismatches: "PrRiya ... his" (Riya is female)
  if (/\bPrRiya\b/.test(eng) && /\bhis\b/i.test(eng)) {
    issues.push('PrRiya (female name) with masculine pronoun "his"');
  }

  // Unnatural English patterns
  if (/\bis doing the\s+\w+ing\b/i.test(eng)) issues.push('Unnatural English phrasing');
  if (/\bI am having\b/i.test(eng) && !/I am having (a|an|my|the|some|lunch|dinner|breakfast|fun|trouble|difficulty)/i.test(eng)) {
    issues.push('Unnatural "I am having" usage');
  }

  // Missing articles before singular countable nouns
  // This is hard to detect perfectly, so just flag obvious cases

  // Trailing/leading whitespace
  if (eng !== eng.trim()) issues.push('Whitespace issue');

  // Empty or too short
  if (eng.length < 3) issues.push('Too short');

  // Very long (possibly run-on)
  if (eng.length > 150) issues.push('Very long sentence');

  // Repeated words
  const words = eng.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1] && words[i].length > 2) {
      issues.push(`Repeated word: "${words[i]}"`);
      break;
    }
  }

  // Untranslated Hindi in English
  if (/[\u0900-\u097F]/.test(eng)) issues.push('Hindi characters in English text');

  return issues;
}

// ── Grammar tip checks ──────────────────────────────────────
function checkGrammarTip(card) {
  const issues = [];
  if (!card.grammar) return issues;

  const tip = card.grammar;

  // Check for boring conjugation patterns
  if (/\b(conjugat|suffix|ending|prefix)\b/i.test(tip) && /→|->|changes to|becomes/.test(tip)) {
    issues.push('Grammar tip looks like conjugation pattern');
  }

  // Check alignment with grammar node
  const node = card.grammarNode;
  // Not checking strict alignment since we don't have node definitions here

  // Too short to be useful
  if (tip.length < 15) issues.push('Grammar tip too short');

  // Too long
  if (tip.length > 300) issues.push('Grammar tip very long');

  // Duplicate with another card (checked in main loop)

  return issues;
}

// ── Vocabulary appropriateness ──────────────────────────────
function checkVocabAppropriateness(card) {
  const issues = [];
  const eng = card.english.toLowerCase();
  const target = card.target;

  // Overly obscure/cultural for early nodes
  const node = card.grammarNode;
  const nodeNum = parseInt(node.replace('node-', ''));

  // Slang or very informal in formal contexts
  if (nodeNum <= 5 && /\b(gonna|wanna|gotta|ain't|dunno)\b/.test(eng)) {
    issues.push('Informal English in early node');
  }

  // Potentially inappropriate content
  if (/\b(kill|murder|death|suicide|weapon|gun|bomb|drug|alcohol|sex|naked|racist|slur)\b/i.test(eng)) {
    // Allow some in context
    if (!/\b(deadline|drugstore|drug store|alcohol-free|death penalty|killed time)\b/i.test(eng)) {
      issues.push('Potentially sensitive vocabulary');
    }
  }

  return issues;
}

// ── Audio check ─────────────────────────────────────────────
function checkAudio(card) {
  if (!card.audio) return ['No audio field'];
  const audioFile = card.audio;
  if (!audioFiles.has(audioFile)) return [`Audio file missing: ${audioFile}`];
  return [];
}

// ── Main audit ──────────────────────────────────────────────
const issues = [];
const seenTargets = new Map(); // target -> card id
const seenEnglish = new Map(); // english -> card id
const seenIds = new Map(); // id -> count
const grammarTipCounts = new Map(); // tip text -> [ids]

const summary = {
  totalCards: allCards.length,
  cardsWithIssues: 0,
  dictCoverageMissing: 0,
  grammarTipIssues: 0,
  englishQualityIssues: 0,
  duplicateTargets: 0,
  duplicateEnglish: 0,
  duplicateIds: 0,
  vocabIssues: 0,
  audioMissing: 0,
  missingWordsFreq: {},
};

for (const card of allCards) {
  const cardIssues = [];

  // 1. Dictionary coverage
  const missingWords = checkDictCoverage(card);
  if (missingWords.length > 0) {
    cardIssues.push({ type: 'dict_coverage', missing: missingWords });
    summary.dictCoverageMissing++;
    for (const w of missingWords) {
      summary.missingWordsFreq[w] = (summary.missingWordsFreq[w] || 0) + 1;
    }
  }

  // 2. Grammar tip
  if (card.grammar) {
    const tipIssues = checkGrammarTip(card);
    if (tipIssues.length > 0) {
      cardIssues.push({ type: 'grammar_tip', issues: tipIssues });
      summary.grammarTipIssues++;
    }
    // Track for duplicates
    const tipKey = card.grammar.trim().toLowerCase();
    if (!grammarTipCounts.has(tipKey)) grammarTipCounts.set(tipKey, []);
    grammarTipCounts.get(tipKey).push(card.id);
  }

  // 3. English quality
  const engIssues = checkEnglishQuality(card.english);
  if (engIssues.length > 0) {
    cardIssues.push({ type: 'english_quality', issues: engIssues });
    summary.englishQualityIssues++;
  }

  // 4. Duplicates
  const targetNorm = card.target.trim();
  if (seenTargets.has(targetNorm)) {
    cardIssues.push({ type: 'duplicate_target', duplicateOf: seenTargets.get(targetNorm) });
    summary.duplicateTargets++;
  } else {
    seenTargets.set(targetNorm, card.id);
  }

  const engNorm = card.english.trim().toLowerCase();
  if (seenEnglish.has(engNorm)) {
    cardIssues.push({ type: 'duplicate_english', duplicateOf: seenEnglish.get(engNorm) });
    summary.duplicateEnglish++;
  } else {
    seenEnglish.set(engNorm, card.id);
  }

  if (seenIds.has(card.id)) {
    cardIssues.push({ type: 'duplicate_id' });
    summary.duplicateIds++;
  }
  seenIds.set(card.id, (seenIds.get(card.id) || 0) + 1);

  // 5. Vocabulary appropriateness
  const vocabIssues = checkVocabAppropriateness(card);
  if (vocabIssues.length > 0) {
    cardIssues.push({ type: 'vocab', issues: vocabIssues });
    summary.vocabIssues++;
  }

  // 6. Audio
  const audioIssues = checkAudio(card);
  if (audioIssues.length > 0) {
    cardIssues.push({ type: 'audio', issues: audioIssues });
    summary.audioMissing++;
  }

  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      target: card.target,
      english: card.english,
      grammarNode: card.grammarNode,
      issues: cardIssues,
    });
    summary.cardsWithIssues++;
  }
}

// Find duplicate grammar tips (used 3+ times)
const dupTips = [];
for (const [tip, ids] of grammarTipCounts) {
  if (ids.length >= 3) {
    dupTips.push({ tip: tip.substring(0, 80) + (tip.length > 80 ? '...' : ''), count: ids.length, sampleIds: ids.slice(0, 5) });
  }
}
summary.duplicateGrammarTips = dupTips.length;

// Top missing words
const topMissing = Object.entries(summary.missingWordsFreq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50)
  .map(([word, count]) => ({ word, count }));

// Remove the full freq map from output (too large)
delete summary.missingWordsFreq;
summary.topMissingWords = topMissing;
summary.duplicateGrammarTipsList = dupTips.sort((a, b) => b.count - a.count).slice(0, 20);

const output = {
  summary,
  cards: issues,
};

const outPath = path.join(ROOT, 'scripts/output/audit-hi-cards-0.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nAudit complete. ${summary.cardsWithIssues}/${summary.totalCards} cards have issues.`);
console.log(`Written to ${outPath}`);
console.log('\nSummary:');
console.log(JSON.stringify(summary, null, 2));
