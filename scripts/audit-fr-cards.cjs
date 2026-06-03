/**
 * Card-by-card audit of French deck batches 0-3 (~first 2000 cards).
 *
 * Checks: 1) Dictionary coverage, 2) Grammar tip alignment,
 * 3) English quality, 4) Duplicates, 5) Vocabulary appropriateness, 6) Audio exists.
 *
 * Output: scripts/output/audit-fr-cards-0.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/french/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/fr.ts');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');
const OUTPUT_PATH = path.join(ROOT, 'scripts/output/audit-fr-cards-0.json');

// ── Load deck ──────────────────────────────────────────────
const deckRaw = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const allCards = Object.values(deckRaw);
console.log(`Total cards in deck: ${allCards.length}`);

// Batches 0-3 = first ~2000 cards (by index order)
const BATCH_SIZE = 500;
const cards = allCards.slice(0, BATCH_SIZE * 4); // first 2000
console.log(`Auditing cards: ${cards.length} (batches 0-3)`);

// ── Load dictionary keys ───────────────────────────────────
const dictSrc = fs.readFileSync(DICT_PATH, 'utf8');
const dictKeys = new Set();

// Extract all dictionary keys from the TypeScript source
const keyRegex = /^\s*['"]([^'"]+)['"]\s*:\s*\{/gm;
let m;
while ((m = keyRegex.exec(dictSrc)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
console.log(`Dictionary entries: ${dictKeys.size}`);

// ── Build audio file set ───────────────────────────────────
const audioFiles = new Set(fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('fr-') && f.endsWith('.mp3')));
console.log(`Audio files: ${audioFiles.size}`);

// ── Compound words (handled as whole unit, not split) ──────
const COMPOUND_WORDS = new Set([
  "aujourd'hui", "jusqu'à", "jusqu'au", "jusqu'aux", "jusqu'ici",
  "quelqu'un", "quelqu'une", "lorsqu'il", "lorsqu'elle", "lorsqu'on",
  "quoiqu'il", "quoiqu'elle", "puisqu'il", "puisqu'elle", "puisqu'on",
]);

// ── French stopwords (don't need dict entries) ─────────────
const STOPWORDS = new Set([
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'dont', 'où',
  'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  'me', 'te', 'se', 'en', 'y', 'ne', 'pas', 'plus', 'très', 'bien',
  'est', 'sont', 'a', 'ont', 'suis', 'es', 'sommes', 'êtes',
  'ai', 'as', 'avons', 'avez',
  'dans', 'sur', 'sous', 'avec', 'pour', 'par', 'chez', 'entre',
  'vers', 'sans', 'depuis', 'pendant', 'avant', 'après',
  'si', 'quand', 'comme', 'tout', 'toute', 'tous', 'toutes',
  'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir',
  'pouvoir', 'vouloir', 'devoir', 'falloir', 'venir',
  'été', 'fait', 'dit', 'vu', 'su', 'pu', 'dû', 'eu',
  'était', 'avait', 'serait', 'aurait', 'sera', 'aura',
  'fais', 'fait', 'faisons', 'faites', 'font',
  'va', 'vais', 'vas', 'allons', 'allez', 'vont',
  'dit', 'dis', 'disons', 'dites', 'disent',
  'vois', 'voit', 'voyons', 'voyez', 'voient',
  'sais', 'sait', 'savons', 'savez', 'savent',
  'peux', 'peut', 'pouvons', 'pouvez', 'peuvent',
  'veux', 'veut', 'voulons', 'voulez', 'veulent',
  'dois', 'doit', 'devons', 'devez', 'doivent',
  'viens', 'vient', 'venons', 'venez', 'viennent',
  'aussi', 'même', 'autre', 'autres', 'chaque',
  'ici', 'là', 'oui', 'non', 'merci',
]);

// ── Elision prefixes ───────────────────────────────────────
const ELISION_PREFIXES = ["qu'", "l'", "d'", "j'", "n'", "s'", "c'", "m'", "t'"];

// ── Verb suffix patterns for reversal ──────────────────────
const ER_SUFFIXES = ['ons', 'ez', 'ent', 'es', 'e', 'é', 'ée', 'és', 'ées', 'ais', 'ait', 'aient', 'ions', 'iez', 'ai', 'as', 'a', 'erai', 'eras', 'era', 'erons', 'erez', 'eront', 'erais', 'erait', 'erions', 'eriez', 'eraient'];
const IR_SUFFIXES = ['issons', 'issez', 'issent', 'issais', 'issait', 'issaient', 'is', 'it', 'i', 'irai', 'iras', 'ira', 'irons', 'irez', 'iront'];
const RE_SUFFIXES = ['ons', 'ez', 'ent', 'u', 'ue', 'us', 'ues', 's'];

function canLookup(word, sentenceLC) {
  let clean = word.toLowerCase().replace(/[¿¡.,!?;:"""\u2018\u2019()––«»\d/?]/g, '');
  if (!clean) return true; // empty after cleaning = skip

  // Check if this word is part of a known compound in the sentence
  for (const comp of COMPOUND_WORDS) {
    if (sentenceLC.includes(comp) && comp.includes(clean)) return true;
  }

  // Direct match
  if (dictKeys.has(clean)) return true;

  // Stopword
  if (STOPWORDS.has(clean)) return true;

  // Handle elisions
  for (const prefix of ELISION_PREFIXES) {
    if (clean.startsWith(prefix)) {
      const remainder = clean.slice(prefix.length);
      if (dictKeys.has(remainder)) return true;
      if (STOPWORDS.has(remainder)) return true;
      // Try verb reversal on remainder
      if (tryVerbReversal(remainder)) return true;
      // hyphen combo
      if (remainder.includes('-')) {
        const hbase = remainder.split('-')[0];
        if (dictKeys.has(hbase)) return true;
        if (STOPWORDS.has(hbase)) return true;
        if (tryVerbReversal(hbase)) return true;
      }
    }
  }

  // Strip apostrophes
  clean = clean.replace(/'/g, '');
  if (dictKeys.has(clean)) return true;
  if (STOPWORDS.has(clean)) return true;

  // Hyphenated
  if (clean.includes('-')) {
    const base = clean.split('-')[0];
    if (dictKeys.has(base)) return true;
    if (STOPWORDS.has(base)) return true;
    if (tryVerbReversal(base)) return true;
    clean = clean.replace(/-/g, '');
    if (dictKeys.has(clean)) return true;
  }

  // Verb reversal
  if (tryVerbReversal(clean)) return true;

  // Plural stripping
  if (clean.endsWith('aux')) {
    const sg = clean.slice(0, -3) + 'al';
    if (dictKeys.has(sg)) return true;
  }
  if (clean.endsWith('s') && clean.length > 2) {
    const sg = clean.slice(0, -1);
    if (dictKeys.has(sg)) return true;
    if (tryVerbReversal(sg)) return true;
  }
  if (clean.endsWith('x') && clean.length > 2) {
    const sg = clean.slice(0, -1);
    if (dictKeys.has(sg)) return true;
  }

  // Feminine → masculine
  if (clean.endsWith('euse')) {
    if (dictKeys.has(clean.slice(0, -4) + 'eur')) return true;
  }
  if (clean.endsWith('ive')) {
    if (dictKeys.has(clean.slice(0, -3) + 'if')) return true;
  }
  if (clean.endsWith('e') && clean.length > 3) {
    if (dictKeys.has(clean.slice(0, -1))) return true;
  }

  return false;
}

function tryVerbReversal(form) {
  for (const suffix of ER_SUFFIXES) {
    if (form.endsWith(suffix) && form.length > suffix.length + 1) {
      if (dictKeys.has(form.slice(0, -suffix.length) + 'er')) return true;
    }
  }
  for (const suffix of IR_SUFFIXES) {
    if (form.endsWith(suffix) && form.length > suffix.length + 1) {
      if (dictKeys.has(form.slice(0, -suffix.length) + 'ir')) return true;
    }
  }
  for (const suffix of RE_SUFFIXES) {
    if (form.endsWith(suffix) && form.length > suffix.length + 2) {
      if (dictKeys.has(form.slice(0, -suffix.length) + 're')) return true;
    }
  }
  return false;
}

function tokenize(sentence) {
  // Split on spaces, then handle apostrophes
  return sentence
    .replace(/[.,!?;:"""\u2018\u2019()––«»]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// ── English quality checks ─────────────────────────────────
function checkEnglishQuality(english) {
  const issues = [];

  // Very short / unhelpful
  if (english.length < 3) issues.push('english_too_short');

  // Untranslated (French left in English)
  const frenchPatterns = /\b(est|les|des|une|dans|avec|pour|sur|sont|ont|cette|très|aussi|mais|comme|peut|faire|tout|bien|nous|vous|ils|elles|qui|que|quand|leur|même|entre|avant|après|chez|depuis|sans|encore)\b/i;
  // Be careful not to match English words that overlap: "a", "on", "or", "en", etc.

  // Check for unnatural English
  if (/\bof the the\b/i.test(english)) issues.push('double_article');
  if (/\bit is it\b/i.test(english)) issues.push('stuttered_english');

  // Missing period or ends with space
  if (english.endsWith(' ')) issues.push('trailing_space');
  if (english.startsWith(' ')) issues.push('leading_space');

  // Very long English (possible run-on)
  if (english.length > 150) issues.push('english_very_long');

  // Contains French characters in English
  if (/[éèêëàâäùûüôöîïçœæ]/i.test(english) && !/(café|cliché|résumé|fiancé|fiancée|naïve|naïveté|crème|née|soirée|entrée|protégé|décor|exposé)/i.test(english)) {
    issues.push('french_chars_in_english');
  }

  // Awkward phrasing patterns
  if (/\bhe\/she\b/i.test(english) || /\bone\s+one\b/i.test(english)) {
    issues.push('awkward_phrasing');
  }

  // Missing subject (only for declarative sentences, not questions)
  if (/^(is|are|was|were|has|have|had)\s/i.test(english) && !english.includes('?')) {
    issues.push('possible_missing_subject');
  }

  return issues;
}

// ── French sentence quality checks ─────────────────────────
function checkFrenchQuality(target) {
  const issues = [];

  // Accent errors: common misspellings
  if (/\bla garé\b/i.test(target)) {
    issues.push('accent_error:garé→gare');
  }
  if (/\bla porté\b/i.test(target)) {
    issues.push('accent_error:porté→porte');
  }
  if (/\ba frappe\b/.test(target) && !/\ba frappé\b/.test(target)) {
    issues.push('accent_error:frappe→frappé');
  }
  // Common spelling errors
  if (/\bcollegue\b/i.test(target)) {
    issues.push('spelling_error:collegue→collègue');
  }
  if (/\bdansé\b/.test(target) && /\bde dansé\b/i.test(target)) {
    issues.push('accent_error:dansé→danse');
  }
  if (/\bpoeme\b/i.test(target)) {
    issues.push('accent_error:poeme→poème');
  }

  // Trailing/leading spaces
  if (target.endsWith(' ') || target.endsWith('  ')) issues.push('trailing_space_fr');
  if (target.startsWith(' ')) issues.push('leading_space_fr');

  // Double spaces
  if (/  /.test(target)) issues.push('double_space_fr');

  return issues;
}

// ── Grammar tip quality checks ─────────────────────────────
function checkGrammarTip(card) {
  const issues = [];
  if (!card.grammar) return issues;

  const tip = card.grammar;

  // Conjugation pattern (boring, not wanted per conventions)
  if (/^(je|tu|il|elle|nous|vous|ils|elles)\s+\w+,\s*(tu|il|elle|nous|vous|ils|elles)\s+\w+/i.test(tip)) {
    issues.push('grammar_conjugation_pattern');
  }
  // Also catch: 'Être' (to be): je suis, tu es, il est...
  if (/:\s*(je|tu|il|elle|nous|vous|ils|elles)\s+\w+,\s*(tu|il|elle|nous|vous|ils|elles)\s+\w+/i.test(tip)) {
    issues.push('grammar_conjugation_pattern');
  }

  // Too short to be useful
  if (tip.length < 15) issues.push('grammar_tip_too_short');

  // Too long
  if (tip.length > 300) issues.push('grammar_tip_too_long');

  // Check alignment: does the tip relate to words in the sentence?
  const targetLC = card.target.toLowerCase();
  const targetWords = new Set(tokenize(card.target).map(w => w.toLowerCase().replace(/['-]/g, '')));
  // Also keep raw words with apostrophes for compound matching
  const targetRawWords = tokenize(card.target).map(w => w.toLowerCase());

  const tipLC = tip.toLowerCase();

  // Extract quoted French words/phrases from tip
  // Use a robust approach: find all French vocabulary in the tip
  const tipTokens = tipLC.replace(/[''"".,!?;:()\-––=+/\\]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  const tipSkipEN = new Set(['the', 'is', 'are', 'was', 'were', 'a', 'an', 'in', 'of', 'to', 'and', 'or', 'not', 'for', 'it', 'this', 'that', 'with', 'from', 'but', 'by', 'as', 'on', 'be', 'at', 'use', 'note', 'means', 'used', 'always', 'before', 'after', 'example', 'like', 'just', 'only', 'can', 'same', 'way', 'when', 'than', 'more', 'very', 'goes', 'between', 'two', 'you', 'your', 'has', 'have', 'had', 'they', 'them', 'their', 'its', 'his', 'her', 'she', 'him', 'will', 'would', 'could', 'should', 'might', 'must', 'shall', 'may', 'about', 'into', 'over', 'did', 'does', 'been', 'being', 'each', 'which', 'there', 'then', 'here', 'all', 'any', 'some', 'most', 'other', 'what', 'how', 'who', 'where', 'why', 'also', 'both', 'own', 'such', 'need', 'keep', 'let', 'say', 'take', 'make', 'come', 'got', 'get', 'put', 'still', 'never', 'often', 'form', 'sound', 'hear', 'ending', 'last', 'irregular', 'regular', 'common', 'french', 'english', 'literally', 'literally', 'rather', 'instead', 'literally']);

  // Check if the grammar concept in the tip relates to the sentence
  let hasConnection = false;

  // 1. Check if any non-trivial tip token (likely French) appears in the sentence
  for (const tipW of tipTokens) {
    if (tipSkipEN.has(tipW)) continue;
    if (tipW.length < 3) continue;
    // Direct match
    if (targetLC.includes(tipW)) { hasConnection = true; break; }
    // Stem match (4+ chars) against target words
    if (tipW.length >= 4) {
      for (const tw of targetWords) {
        if (tw.length >= 4 && tw.slice(0, 4) === tipW.slice(0, 4)) {
          hasConnection = true; break;
        }
      }
    }
    if (hasConnection) break;
  }

  // 2. Check target words directly against tip text
  if (!hasConnection) {
    for (const tw of targetWords) {
      if (tw.length < 4 || STOPWORDS.has(tw)) continue;
      if (tipLC.includes(tw)) { hasConnection = true; break; }
    }
  }

  // 3. Check raw words with apostrophes
  if (!hasConnection) {
    for (const rw of targetRawWords) {
      if (rw.length < 4) continue;
      if (tipLC.includes(rw)) { hasConnection = true; break; }
    }
  }

  // 4. Check grammar concept keywords
  if (!hasConnection) {
    const generalConcepts = ['article', 'gender', 'plural', 'subject', 'pronoun', 'adjective', 'adverb', 'preposition', 'negation', 'question', 'inversion'];
    if (generalConcepts.some(c => tipLC.includes(c))) {
      hasConnection = true;
    }
    if (tipLC.includes('imparfait') && (targetLC.includes('ais') || targetLC.includes('ait') || targetLC.includes('aient') || targetLC.includes('ions') || targetLC.includes('iez'))) {
      hasConnection = true;
    }
    if (tipLC.includes('passé composé') && (targetLC.includes(' a ') || targetLC.includes(' ai ') || targetLC.includes(' as ') || targetLC.includes(' ont ') || targetLC.includes(' avons ') || targetLC.includes(' avez ') || targetLC.includes(' est ') || targetLC.includes(' sont ') || targetLC.includes(' suis '))) {
      hasConnection = true;
    }
    if (tipLC.includes('futur') && (targetLC.includes('rai') || targetLC.includes('ras') || targetLC.includes('rons') || targetLC.includes('rez') || targetLC.includes('ront'))) {
      hasConnection = true;
    }
    if (tipLC.includes('subjonctif') && (targetLC.includes('que ') || targetLC.includes("qu'"))) {
      hasConnection = true;
    }
    if (tipLC.includes('conditionnel') && (targetLC.includes('rais') || targetLC.includes('rait') || targetLC.includes('rions') || targetLC.includes('riez') || targetLC.includes('raient'))) {
      hasConnection = true;
    }
    if (tipLC.includes('possessi') && /\b(mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|leur|leurs)\b/.test(targetLC)) {
      hasConnection = true;
    }
    if (tipLC.includes('-er verb') && /\b\w+e[sz]?\b/.test(targetLC)) {
      hasConnection = true;
    }
  }

  if (!hasConnection) {
    issues.push('grammar_tip_misaligned');
  }

  return issues;
}

// ── Vocabulary appropriateness ─────────────────────────────
function checkVocabAppropriateness(card) {
  const issues = [];
  const target = card.target.toLowerCase();
  const english = card.english.toLowerCase();

  // Obscure/literary/archaic vocabulary for a learning app
  const obscurePatterns = [
    /\bquoiqu'/i, /\blorsqu'/i, /\bnéanmoins\b/i,
  ];
  // Only flag if in node-01 to node-05 (beginner nodes)
  const nodeNum = parseInt(card.grammarNode?.replace('node-', '') || '99');
  if (nodeNum <= 5) {
    // Check for advanced vocab in beginner nodes
    const advancedWords = ['nonobstant', 'susmentionné', 'précédemment', 'néanmoins',
      'conséquemment', 'dorénavant', 'préalablement', 'subséquemment'];
    for (const w of advancedWords) {
      if (target.includes(w)) issues.push(`advanced_vocab_in_beginner_node:${w}`);
    }
  }

  // Impractical/cultural obscurity
  if (/\bparchemi[n]/i.test(target) && nodeNum <= 10) issues.push('obscure_vocab_early');

  return issues;
}

// ── Main audit ─────────────────────────────────────────────
const issues = [];
const summary = {
  totalAudited: cards.length,
  cardsWithIssues: 0,
  dictCoverageGaps: 0,
  grammarTipIssues: 0,
  englishQualityIssues: 0,
  duplicateTargets: 0,
  duplicateEnglish: 0,
  vocabIssues: 0,
  frenchQualityIssues: 0,
  audioMissing: 0,
  missingWords: {},   // word → count
};

// Duplicate detection
const targetMap = {};   // target → [ids]
const englishMap = {};  // english → [ids]

for (const card of cards) {
  const t = card.target.toLowerCase().trim();
  const e = card.english.toLowerCase().trim();
  if (!targetMap[t]) targetMap[t] = [];
  targetMap[t].push(card.id);
  if (!englishMap[e]) englishMap[e] = [];
  englishMap[e].push(card.id);
}

for (const card of cards) {
  const cardIssues = [];

  // 1. Dictionary coverage
  const words = tokenize(card.target);
  const sentenceLC = card.target.toLowerCase();
  const missingWords = [];
  for (const w of words) {
    if (w.length <= 1) continue; // skip single chars
    if (!canLookup(w, sentenceLC)) {
      missingWords.push(w);
      summary.missingWords[w.toLowerCase()] = (summary.missingWords[w.toLowerCase()] || 0) + 1;
    }
  }
  if (missingWords.length > 0) {
    cardIssues.push({ type: 'dict_coverage', words: missingWords });
    summary.dictCoverageGaps++;
  }

  // 2. Grammar tip alignment
  const grammarIssues = checkGrammarTip(card);
  if (grammarIssues.length > 0) {
    cardIssues.push({ type: 'grammar_tip', issues: grammarIssues });
    summary.grammarTipIssues++;
  }

  // 3. English quality
  const englishIssues = checkEnglishQuality(card.english);
  if (englishIssues.length > 0) {
    cardIssues.push({ type: 'english_quality', issues: englishIssues });
    summary.englishQualityIssues++;
  }

  // 4. Duplicates
  const t = card.target.toLowerCase().trim();
  const e = card.english.toLowerCase().trim();
  if (targetMap[t] && targetMap[t].length > 1) {
    cardIssues.push({ type: 'duplicate_target', duplicateOf: targetMap[t].filter(id => id !== card.id) });
    summary.duplicateTargets++;
  }
  if (englishMap[e] && englishMap[e].length > 1) {
    // Only flag if exact same English AND different French
    const otherIds = englishMap[e].filter(id => id !== card.id);
    const otherCards = otherIds.map(id => allCards.find(c => c.id === id)).filter(Boolean);
    const hasDifferentFrench = otherCards.some(c => c.target.toLowerCase().trim() !== t);
    if (hasDifferentFrench) {
      cardIssues.push({ type: 'duplicate_english', duplicateOf: otherIds });
      summary.duplicateEnglish++;
    }
  }

  // 5a. French sentence quality
  const frenchIssues = checkFrenchQuality(card.target);
  if (frenchIssues.length > 0) {
    cardIssues.push({ type: 'french_quality', issues: frenchIssues });
    summary.frenchQualityIssues++;
  }

  // 5. Vocabulary appropriateness
  const vocabIssues = checkVocabAppropriateness(card);
  if (vocabIssues.length > 0) {
    cardIssues.push({ type: 'vocab_appropriateness', issues: vocabIssues });
    summary.vocabIssues++;
  }

  // 6. Audio exists
  if (card.audio) {
    if (!audioFiles.has(card.audio)) {
      cardIssues.push({ type: 'audio_missing', file: card.audio });
      summary.audioMissing++;
    }
  } else {
    cardIssues.push({ type: 'audio_missing', file: null });
    summary.audioMissing++;
  }

  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      target: card.target,
      english: card.english,
      grammarNode: card.grammarNode,
      hasGrammarTip: !!card.grammar,
      issues: cardIssues,
    });
  }
}

summary.cardsWithIssues = issues.length;

// Sort missing words by frequency
const sortedMissing = Object.entries(summary.missingWords)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 100);
summary.topMissingWords = sortedMissing;
delete summary.missingWords; // too large for output

const output = { summary, issues };

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log(`\nAudit complete. Cards with issues: ${issues.length}/${cards.length}`);
console.log(`Output: ${OUTPUT_PATH}`);
console.log('\nSummary:');
console.log(JSON.stringify(summary, null, 2));
