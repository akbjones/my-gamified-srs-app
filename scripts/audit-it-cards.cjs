const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');

// ─── Load cards ──────────────────────────────────────────────────
const cards = [];
for (let i = 0; i < 4; i++) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, `scripts/output/audit-batches/it-batch-${i}.json`), 'utf8'));
  cards.push(...d);
}
console.log(`Loaded ${cards.length} cards`);

// ─── Load dictionary keys ────────────────────────────────────────
const dictSrc = fs.readFileSync(path.join(ROOT, 'src/data/dictionary/it.ts'), 'utf8');
const dictKeys = new Set();
const keyRegex = /^\s+['"]([^'"]+)['"]\s*:/gm;
let m;
while ((m = keyRegex.exec(dictSrc)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
console.log(`Dictionary: ${dictKeys.size} entries`);

// ─── Load audio file set ─────────────────────────────────────────
const audioFiles = new Set();
try {
  fs.readdirSync(AUDIO_DIR).forEach(f => {
    if (f.startsWith('it-') && f.endsWith('.mp3')) audioFiles.add(f);
  });
} catch (e) {}
console.log(`Audio files: ${audioFiles.size}`);

// ─── Italian stop words (no dictionary entry needed) ─────────────
const STOP_WORDS = new Set([
  // Articles
  'il', 'lo', 'la', 'i', 'gli', 'le', 'l',
  'un', 'uno', 'una',
  // Prepositions + contractions
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  // Conjunctions
  'e', 'o', 'ma', 'che', 'se', 'anche', 'né', 'perché',
  // Pronouns
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
  'mi', 'ti', 'ci', 'vi', 'si', 'me', 'te', 'ce', 've',
  'ne', 'lo', 'la', 'li', 'le', 'gli',
  'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle',
  // Essere / avere / stare / fare common forms
  'è', 'sono', 'sei', 'siamo', 'siete', 'era', 'ero',
  'ho', 'ha', 'hai', 'abbiamo', 'avete', 'hanno', 'avevo', 'aveva',
  'sto', 'sta', 'stai', 'stiamo', 'state', 'stanno',
  'faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno',
  // Andare / venire / potere / dovere / volere common forms
  'vado', 'vai', 'va', 'andiamo', 'andate', 'vanno',
  'vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono',
  'posso', 'puoi', 'può', 'possiamo', 'potete', 'possono',
  'devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono',
  'voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono',
  // Misc very common
  'non', 'no', 'sì', 'più', 'molto', 'come', 'dove', 'quando',
  'cosa', 'chi', 'quale', 'quanto', 'quanta', 'quanti', 'quante',
  'c', 'com', 'cos', 'dov', 'po',
  // Past participle helpers
  'stato', 'stata', 'stati', 'state', 'fatto', 'fatta', 'fatti', 'fatte',
  'avuto', 'avuta',
]);

// ─── Tokenize Italian text ───────────────────────────────────────
function tokenize(text) {
  // Remove punctuation, lowercase, split
  let clean = text.toLowerCase()
    .replace(/[.,!?;:"""''()—–\-…\u200b]/g, ' ')
    .replace(/'/g, "'"); // normalize apostrophe
  
  // Split on whitespace
  const rawTokens = clean.split(/\s+/).filter(Boolean);
  
  // Expand elisions
  const tokens = [];
  for (const tok of rawTokens) {
    if (tok.includes("'")) {
      const parts = tok.split("'");
      // Add each non-empty part
      parts.forEach(p => { if (p) tokens.push(p); });
    } else {
      tokens.push(tok);
    }
  }
  return tokens;
}

// ─── Check if word is in dictionary ──────────────────────────────
function inDict(word) {
  if (dictKeys.has(word)) return true;
  // Try common Italian suffix stripping
  // -mente adverbs
  if (word.endsWith('mente') && word.length > 7) {
    const base = word.slice(0, -5);
    if (dictKeys.has(base) || dictKeys.has(base + 'e') || dictKeys.has(base + 'o') || dictKeys.has(base + 'a')) return true;
  }
  // Verb conjugation patterns: try infinitive forms
  const suffixes = ['o', 'i', 'a', 'e', 'iamo', 'ete', 'ono', 'ano', 'ino', 'ato', 'ata', 'ati', 'ate',
    'ito', 'ita', 'iti', 'ite', 'uto', 'uta', 'uti', 'ute', 'ando', 'endo', 'ava', 'avo', 'avi',
    'evo', 'evi', 'eva', 'ivo', 'iva', 'ivi', 'erò', 'erai', 'erà', 'irò', 'irai', 'irà',
    'erei', 'erebbe', 'irei', 'irebbe', 'asse', 'assi', 'esse', 'essi', 'isse', 'issi'];
  for (const suf of suffixes) {
    if (word.endsWith(suf) && word.length > suf.length + 2) {
      const stem = word.slice(0, -suf.length);
      if (dictKeys.has(stem + 'are') || dictKeys.has(stem + 'ere') || dictKeys.has(stem + 'ire')) return true;
    }
  }
  // Plurals: -i -> -o/-e, -e -> -a, -he -> -a (check feminine/masculine)
  if (word.endsWith('i') && dictKeys.has(word.slice(0,-1) + 'o')) return true;
  if (word.endsWith('i') && dictKeys.has(word.slice(0,-1) + 'e')) return true;
  if (word.endsWith('e') && dictKeys.has(word.slice(0,-1) + 'a')) return true;
  if (word.endsWith('he') && dictKeys.has(word.slice(0,-2) + 'a')) return true;
  if (word.endsWith('hi') && dictKeys.has(word.slice(0,-2) + 'o')) return true;
  if (word.endsWith('chi') && dictKeys.has(word.slice(0,-3) + 'co')) return true;
  if (word.endsWith('ghi') && dictKeys.has(word.slice(0,-3) + 'go')) return true;
  if (word.endsWith('che') && dictKeys.has(word.slice(0,-3) + 'ca')) return true;
  if (word.endsWith('ghe') && dictKeys.has(word.slice(0,-3) + 'ga')) return true;
  
  return false;
}

// ─── Grammar nodes and expected topics ───────────────────────────
const NODE_TOPICS = {
  'node-01': { name: 'Basics / Greetings', maxComplexity: 'simple', badPatterns: /\b(congiuntivo|trapassato|condizionale passato|gerundio composto)\b/i },
  'node-02': { name: 'Present tense regular', maxComplexity: 'simple' },
  'node-03': { name: 'Present tense irregular', maxComplexity: 'moderate' },
  'node-04': { name: 'Negation & Questions', maxComplexity: 'moderate' },
  'node-05': { name: 'Articles & Gender', maxComplexity: 'moderate' },
  'node-06': { name: 'Prepositions', maxComplexity: 'moderate' },
  'node-07': { name: 'Adjectives', maxComplexity: 'moderate' },
  'node-08': { name: 'Passato prossimo', maxComplexity: 'intermediate' },
  'node-09': { name: 'Imperfetto', maxComplexity: 'intermediate' },
  'node-10': { name: 'Future', maxComplexity: 'intermediate' },
};

// ─── Vocabulary appropriateness for early nodes ──────────────────
const ADVANCED_VOCAB = /\b(ippopotamo|neurochirurgo|paleontolog|epistemolog|giurisprudenz|psicoanalis|biochimic|termodinam|elettromagnetis|microbiolog|astrofis|geopolitic)\b/i;

// ─── English quality checks ──────────────────────────────────────
function checkEnglish(eng) {
  const issues = [];
  // Empty or too short
  if (!eng || eng.trim().length < 3) issues.push('english_too_short');
  // Untranslated (Italian in English field)
  if (/\b(sono|mangio|voglio|posso|devo|facciamo|andiamo)\b/.test(eng) && !/\b(I |the |is |are |we |they )\b/.test(eng)) {
    issues.push('possible_untranslated');
  }
  // Bad grammar patterns
  if (/\b(i am|i have|i was)\b/.test(eng) && eng[0] !== 'I' && !eng.includes('"') && !eng.includes("'")) {
    // lowercase "i" as subject — only if not mid-sentence quote
  }
  // Double spaces
  if (/  /.test(eng)) issues.push('double_space');
  // Trailing/leading whitespace
  if (eng !== eng.trim()) issues.push('whitespace');
  // Unmatched quotes
  const dq = (eng.match(/"/g) || []).length;
  if (dq % 2 !== 0) issues.push('unmatched_quotes');
  return issues;
}

// ─── Grammar tip quality ─────────────────────────────────────────
function checkGrammarTip(tip, node) {
  const issues = [];
  if (!tip) return issues;
  // Too short to be useful
  if (tip.length < 15) issues.push('tip_too_short');
  // Too long (walls of text)
  if (tip.length > 300) issues.push('tip_too_long');
  // Boring conjugation pattern (should be contextual)
  if (/\b(conjugat|io .+, tu .+, lui\/lei|first person|second person|third person)\b/i.test(tip) && 
      !/\b(instead|rather|prefer|natural|common|usage|tip|note|careful)\b/i.test(tip)) {
    issues.push('tip_conjugation_pattern');
  }
  // Tip mentions wrong grammar node concept
  // e.g. tip about subjunctive on node-01
  if (node === 'node-01' && /\b(subjunctive|congiuntivo|conditional perfect|trapassato)\b/i.test(tip)) {
    issues.push('tip_too_advanced_for_node');
  }
  return issues;
}

// ─── Main audit ──────────────────────────────────────────────────
const issues = [];
const seen = new Map(); // target -> id for duplicate detection
const seenEnglish = new Map(); // english -> id

const summary = {
  totalCards: cards.length,
  cardsWithIssues: 0,
  missingAudio: 0,
  dictCoverageGaps: 0,
  duplicateTarget: 0,
  duplicateEnglish: 0,
  englishIssues: 0,
  grammarTipIssues: 0,
  vocabIssues: 0,
  missingWords: {},  // word -> count
};

for (const card of cards) {
  const cardIssues = [];
  
  // 1. Audio check
  if (!card.audio || !audioFiles.has(card.audio)) {
    cardIssues.push({ type: 'missing_audio', audio: card.audio || 'none' });
    summary.missingAudio++;
  }
  
  // 2. Dictionary coverage
  const tokens = tokenize(card.target);
  const missingWords = [];
  for (const tok of tokens) {
    if (STOP_WORDS.has(tok)) continue;
    if (tok.length <= 1) continue; // single letters
    if (/^\d+$/.test(tok)) continue; // numbers
    if (!inDict(tok)) {
      missingWords.push(tok);
      summary.missingWords[tok] = (summary.missingWords[tok] || 0) + 1;
    }
  }
  if (missingWords.length > 0) {
    cardIssues.push({ type: 'dict_gap', words: missingWords });
    summary.dictCoverageGaps++;
  }
  
  // 3. Duplicate target
  const normTarget = card.target.toLowerCase().trim();
  if (seen.has(normTarget)) {
    cardIssues.push({ type: 'duplicate_target', otherCard: seen.get(normTarget) });
    summary.duplicateTarget++;
  } else {
    seen.set(normTarget, card.id);
  }
  
  // 3b. Duplicate English
  const normEng = card.english.toLowerCase().trim();
  if (seenEnglish.has(normEng)) {
    cardIssues.push({ type: 'duplicate_english', otherCard: seenEnglish.get(normEng) });
    summary.duplicateEnglish++;
  } else {
    seenEnglish.set(normEng, card.id);
  }
  
  // 4. English quality
  const engIssues = checkEnglish(card.english);
  if (engIssues.length > 0) {
    cardIssues.push({ type: 'english_quality', details: engIssues });
    summary.englishIssues++;
  }
  
  // 5. Grammar tip
  if (card.grammar) {
    const tipIssues = checkGrammarTip(card.grammar, card.grammarNode);
    if (tipIssues.length > 0) {
      cardIssues.push({ type: 'grammar_tip', details: tipIssues });
      summary.grammarTipIssues++;
    }
  }
  
  // 6. Vocabulary appropriateness
  if (ADVANCED_VOCAB.test(card.target) && ['node-01', 'node-02', 'node-03'].includes(card.grammarNode)) {
    cardIssues.push({ type: 'vocab_too_advanced', node: card.grammarNode });
    summary.vocabIssues++;
  }
  
  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      node: card.grammarNode,
      target: card.target,
      english: card.english,
      issues: cardIssues,
    });
  }
}

summary.cardsWithIssues = issues.length;

// Top missing words
const topMissing = Object.entries(summary.missingWords)
  .sort((a,b) => b[1] - a[1])
  .slice(0, 100)
  .map(([w, c]) => ({ word: w, count: c }));

const output = {
  summary: {
    ...summary,
    missingWords: undefined,
    topMissingWords: topMissing,
    issueRate: (issues.length / cards.length * 100).toFixed(1) + '%',
  },
  cards: issues,
};
delete output.summary.missingWords;

fs.mkdirSync(path.join(ROOT, 'scripts/output'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'scripts/output/audit-it-cards-0.json'), JSON.stringify(output, null, 2));
console.log('\n=== AUDIT SUMMARY ===');
console.log(`Total cards: ${summary.totalCards}`);
console.log(`Cards with issues: ${summary.cardsWithIssues} (${(summary.cardsWithIssues/summary.totalCards*100).toFixed(1)}%)`);
console.log(`Missing audio: ${summary.missingAudio}`);
console.log(`Dict coverage gaps: ${summary.dictCoverageGaps}`);
console.log(`Duplicate targets: ${summary.duplicateTarget}`);
console.log(`Duplicate English: ${summary.duplicateEnglish}`);
console.log(`English quality: ${summary.englishIssues}`);
console.log(`Grammar tip issues: ${summary.grammarTipIssues}`);
console.log(`Vocab appropriateness: ${summary.vocabIssues}`);
console.log(`\nTop 30 missing words:`);
topMissing.slice(0, 30).forEach(({word, count}) => console.log(`  ${word}: ${count}`));
