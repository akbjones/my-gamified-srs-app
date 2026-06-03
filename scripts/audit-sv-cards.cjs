/**
 * Card-by-card audit of Swedish batches 0-3 (~2000 cards).
 * Checks: dictionary coverage, grammar tip quality, English quality,
 * duplicates, vocabulary appropriateness, audio existence.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');

// ── Load batches ──
const cards = [];
for (let b = 0; b <= 3; b++) {
  const batch = require(path.join(ROOT, `scripts/output/audit-batches/sv-batch-${b}.json`));
  cards.push(...batch);
}
console.log(`Loaded ${cards.length} cards from batches 0-3`);

// ── Load dictionary (extract DICT keys from .ts file) ──
const dictSrc = fs.readFileSync(path.join(ROOT, 'src/data/dictionary/sv.ts'), 'utf8');

// Extract all dictionary keys from the DICT object
const dictKeys = new Set();
// Match lines like:  'word': { en: ... }
const keyRe = /^\s+'([^']+)':\s*\{/gm;
let m;
while ((m = keyRe.exec(dictSrc)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
console.log(`Dictionary has ${dictKeys.size} entries`);

// Extract irregular map keys (entries can be multiple per line)
const irregKeys = new Set();
const irregSection = dictSrc.match(/const IRREGULAR_MAP[\s\S]*?\n\};\n/);
if (irregSection) {
  const irregRe2 = /'([^']+)':\s*'([^']+)'/g;
  while ((m = irregRe2.exec(irregSection[0])) !== null) {
    irregKeys.add(m[1].toLowerCase());
    // Also add the target (infinitive)
    dictKeys.add(m[2].toLowerCase());
  }
}
console.log(`Irregular map has ${irregKeys.size} forms`);

// Merge: a word is "covered" if it's in DICT or IRREGULAR_MAP or can be resolved via suffix stripping
const allKnown = new Set([...dictKeys, ...irregKeys]);

// Simple suffix stripping to simulate lookupSV
function canResolve(word) {
  const w = word.toLowerCase().replace(/[.,!?;:'"()…\-––]/g, '');
  if (!w || w.length < 2) return true; // skip punctuation/tiny
  if (/^\d+$/.test(w)) return true; // numbers
  if (allKnown.has(w)) return true;

  // Common Swedish suffixes
  const suffixes = ['s', 'en', 'et', 'erna', 'arna', 'orna', 'na', 'ar', 'er', 'or',
    'n', 'a', 't', 'de', 'te', 'ade', 'at', 'ande', 'ning', 'ningen',
    'igt', 'lig', 'liga', 'ligt', 'are', 'ast', 'aste'];
  for (const suf of suffixes) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const stem = w.slice(0, -suf.length);
      if (allKnown.has(stem)) return true;
      if (allKnown.has(stem + 'a')) return true; // verb infinitive
      if (allKnown.has(stem + 'e')) return true;
    }
  }

  // Try common prefixes (compound words)
  const prefixes = ['för', 'be', 'ge', 'an', 'av', 'in', 'om', 'upp', 'ut', 'på', 'till', 'under', 'över', 'sam', 'miss'];
  for (const pfx of prefixes) {
    if (w.startsWith(pfx) && w.length > pfx.length + 2) {
      const rest = w.slice(pfx.length);
      if (allKnown.has(rest)) return true;
    }
  }

  return false;
}

// ── Build audio set ──
const audioFiles = new Set();
try {
  const files = fs.readdirSync(AUDIO_DIR);
  for (const f of files) {
    if (f.startsWith('sv-sv-') && f.endsWith('.mp3')) {
      audioFiles.add(f);
    }
  }
} catch (e) {
  console.error('Could not read audio directory');
}
console.log(`Found ${audioFiles.size} Swedish audio files`);

// ── Common Swedish stop words (skip in dict check) ──
const STOP_WORDS = new Set([
  'jag', 'du', 'han', 'hon', 'den', 'det', 'vi', 'ni', 'de', 'dom',
  'en', 'ett', 'och', 'i', 'på', 'av', 'med', 'för', 'till', 'om',
  'är', 'var', 'att', 'inte', 'som', 'men', 'så', 'kan', 'ska', 'har',
  'hade', 'min', 'mitt', 'mina', 'din', 'ditt', 'dina', 'sin', 'sitt', 'sina',
  'sig', 'mig', 'dig', 'oss', 'er', 'dem', 'där', 'här', 'då', 'nu',
  'nog', 'ju', 'ja', 'nej', 'om', 'hur', 'vad', 'vem', 'var', 'när',
  'från', 'ut', 'in', 'upp', 'ner', 'över', 'under', 'efter', 'före',
  'varför', 'vilken', 'vilket', 'vilka', 'denna', 'detta', 'dessa',
  'alla', 'allt', 'andra', 'annat', 'varje', 'egen', 'egna', 'eget',
  'bara', 'redan', 'igen', 'sedan', 'nog', 'ganska', 'mycket', 'lite',
  'mer', 'mest', 'mindre', 'minst', 'många', 'få', 'liten', 'stor',
  'ny', 'gammal', 'ung', 'bra', 'god', 'dålig', 'hel', 'hela',
  'samma', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio',
  'första', 'andra', 'tredje', 'fjärde', 'femte',
  'vara', 'bli', 'ha', 'gå', 'ta', 'se', 'ge', 'få', 'göra', 'komma',
  'vill', 'ville', 'veta', 'vet', 'visste', 'tror', 'tycker',
  'hans', 'hennes', 'deras', 'vår', 'vårt', 'våra', 'ert', 'era',
  'nog', 'väl', 'jo', 'dock', 'helt', 'riktigt',
  'skulle', 'kunde', 'ville', 'blev', 'fick', 'tog', 'såg', 'gick',
  'sade', 'sa', 'henne', 'honom', 'ens'
]);

// ── Audit each card ──
const issues = [];
const seenTargets = new Map(); // target → id (for duplicate detection)
const seenEnglish = new Map(); // english → id

const summary = {
  totalCards: cards.length,
  dictCoverageIssues: 0,
  grammarTipIssues: 0,
  englishQualityIssues: 0,
  duplicateIssues: 0,
  vocabIssues: 0,
  audioMissing: 0,
  cardsWithIssues: 0,
};

for (const card of cards) {
  const cardIssues = [];

  // ── 1. Dictionary coverage ──
  const words = card.target
    .replace(/[.,!?;:'"()…\-––\d]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w.toLowerCase());

  const missingWords = [];
  for (const w of words) {
    if (STOP_WORDS.has(w)) continue;
    if (w.length <= 2) continue;
    if (!canResolve(w)) {
      missingWords.push(w);
    }
  }
  if (missingWords.length > 0) {
    cardIssues.push({ type: 'dict_coverage', words: missingWords });
    summary.dictCoverageIssues++;
  }

  // ── 2. Grammar tip alignment ──
  if (card.grammar) {
    const tip = card.grammar;
    // Check for boring conjugation pattern tips
    if (/^(This|The) verb (takes|uses|has|is) -(ar|er|r) /.test(tip) && tip.length < 80) {
      cardIssues.push({ type: 'grammar_boring', tip });
      summary.grammarTipIssues++;
    }
    // Check for tips that don't relate to the sentence content
    else if (tip.length < 20) {
      cardIssues.push({ type: 'grammar_too_short', tip });
      summary.grammarTipIssues++;
    }
    // Check for very generic tips
    else if (/^Swedish (word order|has|uses|is)/.test(tip) && !tip.includes(card.target.split(' ')[0])) {
      // Generic tip that doesn't reference specific words in the sentence - only flag if very generic
      if (tip.length < 60) {
        cardIssues.push({ type: 'grammar_generic', tip });
        summary.grammarTipIssues++;
      }
    }
    // Check for tips about wrong grammar concept
    else if (card.grammarNode === 'node-01' && /subjunctive|passive|conditional/.test(tip.toLowerCase())) {
      cardIssues.push({ type: 'grammar_mismatch', tip, node: card.grammarNode });
      summary.grammarTipIssues++;
    }
  }

  // ── 3. English quality ──
  const eng = card.english;
  // Check for untranslated Swedish left in English
  // But allow proper nouns (place names, cultural terms) that legitimately contain Swedish chars
  // Remove any word containing åäö that starts with uppercase (proper nouns)
  // Also remove known cultural terms
  const engWords = eng.split(/\s+/);
  const suspectSwedish = engWords.filter(w => {
    if (!/[åäöÅÄÖ]/.test(w)) return false;
    // Allow if capitalized (proper noun / place name)
    if (/^[A-ZÅÄÖ]/.test(w)) return false;
    // Allow known cultural terms
    if (/^(surströmming|smörgåsbord|fika|lagerlöf|björk)$/i.test(w.replace(/[.,!?;:'"()]/g, ''))) return false;
    return true;
  });
  if (suspectSwedish.length > 0) {
    cardIssues.push({ type: 'english_swedish_chars', english: eng, words: suspectSwedish });
    summary.englishQualityIssues++;
  }
  // Check for empty or very short English
  else if (!eng || eng.trim().length < 3) {
    cardIssues.push({ type: 'english_empty', english: eng });
    summary.englishQualityIssues++;
  }
  // Check for leading/trailing whitespace
  else if (eng !== eng.trim()) {
    cardIssues.push({ type: 'english_whitespace', english: eng });
    summary.englishQualityIssues++;
  }
  // Check for double spaces
  else if (/  /.test(eng)) {
    cardIssues.push({ type: 'english_double_space', english: eng });
    summary.englishQualityIssues++;
  }
  // Check for English that's identical or near-identical to target (untranslated)
  else if (eng.toLowerCase() === card.target.toLowerCase()) {
    cardIssues.push({ type: 'english_untranslated', english: eng });
    summary.englishQualityIssues++;
  }
  // Check for grammatically awkward English
  else if (/\b(is are|the the|a a|to to)\b/i.test(eng)) {
    cardIssues.push({ type: 'english_grammar', english: eng });
    summary.englishQualityIssues++;
  }
  // Check for missing terminal punctuation where target has it
  else if (/[.!?]$/.test(card.target) && !/[.!?]$/.test(eng)) {
    cardIssues.push({ type: 'english_missing_punctuation', english: eng });
    summary.englishQualityIssues++;
  }

  // ── 4. Duplicates ──
  const targetNorm = card.target.toLowerCase().replace(/[.,!?;:'"()…\-––]/g, '').trim();
  if (seenTargets.has(targetNorm)) {
    cardIssues.push({ type: 'duplicate_target', duplicateOf: seenTargets.get(targetNorm) });
    summary.duplicateIssues++;
  } else {
    seenTargets.set(targetNorm, card.id);
  }

  const engNorm = eng.toLowerCase().replace(/[.,!?;:'"()…\-––]/g, '').trim();
  if (seenEnglish.has(engNorm)) {
    cardIssues.push({ type: 'duplicate_english', duplicateOf: seenEnglish.get(engNorm) });
    // Don't count as separate issue if target is also duplicate
    if (!cardIssues.some(i => i.type === 'duplicate_target')) {
      summary.duplicateIssues++;
    }
  } else {
    seenEnglish.set(engNorm, card.id);
  }

  // ── 5. Vocabulary appropriateness ──
  // Check for overly obscure/archaic words (heuristic: very long compound words)
  const longWords = words.filter(w => w.length > 20);
  if (longWords.length > 0) {
    cardIssues.push({ type: 'vocab_very_long_word', words: longWords });
    summary.vocabIssues++;
  }

  // Check for inappropriate content
  const targetLower = card.target.toLowerCase();
  if (/\b(skit|fan|jävla|helvete|hora)\b/.test(targetLower)) {
    cardIssues.push({ type: 'vocab_inappropriate', target: card.target });
    summary.vocabIssues++;
  }

  // Check for culturally inappropriate or overly niche vocabulary in early nodes
  if (card.grammarNode === 'node-01' || card.grammarNode === 'node-02') {
    const advancedPatterns = /\b(metempsykos|kvantfysik|paradigm|epistemologi|ontologi)\b/i;
    if (advancedPatterns.test(targetLower)) {
      cardIssues.push({ type: 'vocab_too_advanced_for_node', target: card.target, node: card.grammarNode });
      summary.vocabIssues++;
    }
  }

  // ── 6. Audio exists ──
  if (card.audio) {
    if (!audioFiles.has(card.audio)) {
      cardIssues.push({ type: 'audio_missing', audio: card.audio });
      summary.audioMissing++;
    }
  } else {
    cardIssues.push({ type: 'audio_field_empty' });
    summary.audioMissing++;
  }

  // ── Collect ──
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

// ── Write output ──
const output = {
  audit: 'Swedish cards audit (batches 0-3)',
  date: new Date().toISOString().slice(0, 10),
  summary,
  issuesByType: {
    dict_coverage: issues.filter(c => c.issues.some(i => i.type === 'dict_coverage')).length,
    grammar_issues: issues.filter(c => c.issues.some(i => i.type.startsWith('grammar_'))).length,
    english_issues: issues.filter(c => c.issues.some(i => i.type.startsWith('english_'))).length,
    duplicates: issues.filter(c => c.issues.some(i => i.type.startsWith('duplicate_'))).length,
    vocab_issues: issues.filter(c => c.issues.some(i => i.type.startsWith('vocab_'))).length,
    audio_issues: issues.filter(c => c.issues.some(i => i.type.startsWith('audio'))).length,
  },
  cards: issues,
};

const outPath = path.join(ROOT, 'scripts/output/audit-sv-cards-0.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWrote ${issues.length} cards with issues to ${outPath}`);
console.log('\nSummary:', JSON.stringify(summary, null, 2));
console.log('By type:', JSON.stringify(output.issuesByType, null, 2));
