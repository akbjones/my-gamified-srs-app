#!/usr/bin/env node
/**
 * Card-by-card audit of German batches 0-3 (~2000 cards).
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 *         duplicates, vocabulary appropriateness, audio existence.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_DIR = path.join(ROOT, 'scripts/output/audit-batches');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/de.ts');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');

// ── Load batches ───────────────────────────────────────────
const cards = [];
for (let i = 0; i <= 3; i++) {
  const batch = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, `de-batch-${i}.json`), 'utf8'));
  cards.push(...batch);
}
console.log(`Loaded ${cards.length} cards from batches 0-3`);

// ── Parse dictionary ───────────────────────────────────────
const dictContent = fs.readFileSync(DICT_PATH, 'utf8');

// Extract DICT keys
const DICT = new Set();
const dictRe = /^\s+['"]([^'"]+)['"]\s*:\s*\{/gm;
let m;
while ((m = dictRe.exec(dictContent)) !== null) {
  DICT.add(m[1].toLowerCase());
}

// Extract IRREGULAR_MAP
const IRREGULAR_MAP = {};
const irregSection = dictContent.match(/const IRREGULAR_MAP[^}]+\{([^}]+)\}/s);
if (irregSection) {
  const irregRe = /'([^']+)':\s*'([^']+)'/g;
  let im;
  while ((im = irregRe.exec(irregSection[1])) !== null) {
    IRREGULAR_MAP[im[1].toLowerCase()] = im[2].toLowerCase();
  }
}

// Extract CONTRACTION_MAP
const CONTRACTION_MAP = {};
const contractSection = dictContent.match(/const CONTRACTION_MAP[^}]+\{([^}]+)\}/s);
if (contractSection) {
  const cRe = /'([^']+)':\s*\[/g;
  let cm;
  while ((cm = cRe.exec(contractSection[1])) !== null) {
    CONTRACTION_MAP[cm[1].toLowerCase()] = true;
  }
}

console.log(`Dictionary: ${DICT.size} entries, ${Object.keys(IRREGULAR_MAP).length} irregular forms, ${Object.keys(CONTRACTION_MAP).length} contractions`);

// ── German stop words (functional words that don't need dict entries) ──
const STOP_WORDS = new Set([
  // articles
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  // pronouns
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'mir', 'dich', 'dir', 'ihm', 'ihn',
  'uns', 'euch', 'ihnen', 'sich', 'man', 'wer', 'was', 'wen', 'wem', 'wessen',
  // possessives (all forms)
  'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines',
  'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines',
  'sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres',
  'unser', 'unsere', 'unseren', 'unserem', 'unserer', 'unseres', 'unserm', 'unsern',
  'euer', 'eure', 'euren', 'eurem', 'eurer', 'eures',
  // demonstratives
  'dieser', 'diese', 'dieses', 'diesem', 'diesen',
  'jener', 'jene', 'jenes', 'jenem', 'jenen',
  'jeder', 'jede', 'jedes', 'jedem', 'jeden',
  // prepositions
  'in', 'an', 'auf', 'für', 'mit', 'von', 'zu', 'bei', 'nach', 'aus',
  'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen', 'durch', 'gegen',
  'ohne', 'um', 'bis', 'seit', 'ab', 'außer', 'gegenüber', 'statt', 'trotz',
  'während', 'wegen', 'innerhalb', 'außerhalb',
  // conjunctions
  'und', 'oder', 'aber', 'denn', 'sondern', 'dass', 'weil', 'wenn', 'ob',
  'als', 'obwohl', 'damit', 'bevor', 'nachdem', 'sobald', 'solange',
  'doch', 'sonst', 'also', 'deshalb', 'daher', 'jedoch', 'trotzdem',
  'sowohl', 'weder', 'noch', 'entweder',
  // adverbs / particles
  'nicht', 'auch', 'so', 'da', 'hier', 'dort', 'dann', 'schon', 'noch',
  'ja', 'nein', 'mal', 'eben', 'halt', 'nur', 'sehr', 'ganz',
  'viel', 'mehr', 'zu', 'immer', 'nie', 'oft', 'manchmal', 'jetzt', 'heute',
  'morgen', 'gestern', 'bald', 'gerade', 'wieder', 'nun', 'erst', 'etwa',
  'wohl', 'zwar', 'gar', 'ziemlich', 'fast', 'kaum', 'sogar', 'etwas',
  'viele', 'einige', 'alle', 'alles', 'andere', 'anderen', 'anderem', 'anderer', 'anderes',
  // kein
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines',
  // misc functional
  'wie', 'wo', 'wann', 'warum', 'welcher', 'welche', 'welches', 'welchem', 'welchen',
  'dass', 'ob', 'damit', 'weil', 'wenn', 'falls', 'bevor', 'nachdem',
]);

// ── Tokenize German sentence ──────────────────────────────
function tokenize(sentence) {
  return sentence
    .replace(/[.,!?;:"""«»()––…''„"‚'\-]/g, ' ')
    .split(/\s+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length >= 2);
}

// ── Faithfully replicate lookupWord logic ─────────────────
function reverseVerb(word) {
  if (IRREGULAR_MAP[word]) return IRREGULAR_MAP[word];

  const endings = [
    ['st', 2], ['t', 1], ['e', 1], ['en', 2], ['et', 2], ['est', 3],
    ['te', 2], ['test', 4], ['ten', 3], ['tet', 3],
  ];

  // ge- past participles
  if (word.startsWith('ge') && (word.endsWith('t') || word.endsWith('en'))) {
    let stem;
    if (word.endsWith('en')) {
      stem = word.slice(2, -2);
    } else {
      stem = word.slice(2, -1);
    }
    for (const end of ['en', 'ern', 'eln', 'n']) {
      const candidate = stem + end;
      if (DICT.has(candidate)) return candidate;
    }
  }

  // Strip conjugation endings
  for (const [ending, len] of endings) {
    if (word.endsWith(ending) && word.length > len + 2) {
      const stem = word.slice(0, -len);
      for (const end of ['en', 'ern', 'eln', 'n']) {
        const candidate = stem + end;
        if (DICT.has(candidate)) return candidate;
      }
    }
  }

  return null;
}

function lookupWord(raw) {
  const word = raw.toLowerCase().replace(/[.,!?;:""«»()––…'']/g, '').trim();
  if (word.length < 2) return true; // skip short words

  // 1. Direct
  if (DICT.has(word)) return true;

  // 2. Contraction
  if (CONTRACTION_MAP[word]) return true;

  // 3. Irregular
  if (IRREGULAR_MAP[word]) {
    const inf = IRREGULAR_MAP[word];
    if (DICT.has(inf)) return true;
  }

  // 4. Reverse verb
  const verbInf = reverseVerb(word);
  if (verbInf && DICT.has(verbInf)) return true;

  // 5. Case/plural suffix strip
  for (const suffix of ['en', 'er', 'em', 'es', 'e', 'n', 's']) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const stem = word.slice(0, -suffix.length);
      if (DICT.has(stem)) return true;
    }
  }

  // 6. Umlaut reduction
  const deUmlaut = word.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
  if (deUmlaut !== word) {
    if (DICT.has(deUmlaut)) return true;
    for (const suffix of ['er', 'e', 'en', 'n']) {
      if (deUmlaut.endsWith(suffix) && deUmlaut.length > suffix.length + 2) {
        const stem = deUmlaut.slice(0, -suffix.length);
        if (DICT.has(stem)) return true;
      }
    }
  }

  // 7. Compound word splitting
  for (let i = 3; i < word.length - 3; i++) {
    const right = word.slice(i);
    if (DICT.has(right)) return true;
    if (right.startsWith('s') && DICT.has(right.slice(1))) return true;
    if (right.startsWith('n') && DICT.has(right.slice(1))) return true;
    if (right.startsWith('en') && right.length > 4 && DICT.has(right.slice(2))) return true;
  }

  return false;
}

// ── Check if word is findable (stop words + dictionary) ───
function isInDict(word) {
  if (STOP_WORDS.has(word)) return true;
  return lookupWord(word);
}

// ── Grammar node descriptions for German ──────────────────
const NODE_GRAMMAR = {
  'node-01': { level: 'A1', topic: 'personal pronouns + present tense' },
  'node-02': { level: 'A1', topic: 'regular present tense' },
  'node-03': { level: 'A1', topic: 'sein vs haben' },
  'node-04': { level: 'A1', topic: 'grammatical gender (der/die/das)' },
  'node-05': { level: 'A1', topic: 'V2 word order' },
  'node-06': { level: 'A1', topic: 'accusative case' },
  'node-07': { level: 'A1', topic: 'descriptive / es gibt' },
  'node-08': { level: 'A1', topic: 'separable verbs' },
  'node-09': { level: 'A2', topic: 'Perfekt (present perfect)' },
  'node-10': { level: 'A2', topic: 'dative case' },
};

// ── Grammar tip alignment check ──────────────────────────
function checkGrammarAlignment(card) {
  if (!card.grammar) return null;
  const tip = card.grammar.toLowerCase();
  const node = card.grammarNode;
  const nodeInfo = NODE_GRAMMAR[node];
  if (!nodeInfo) return null; // nodes 11+ not checked for alignment here

  const issues = [];
  const target = card.target.toLowerCase();

  // Check for tips that discuss grammar concepts mismatched with the node
  const wrongConcepts = {
    'node-01': [
      { term: 'dative', except: [] },
      { term: 'accusative', except: [] },
      { term: 'genitive', except: [] },
      { term: 'perfekt', except: [] },
      { term: 'past participle', except: [] },
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
      { term: 'imperative', except: [] },
      { term: 'separable', except: [] },
    ],
    'node-02': [
      { term: 'dative', except: [] },
      { term: 'accusative', except: [] },
      { term: 'genitive', except: [] },
      { term: 'perfekt', except: [] },
      { term: 'past participle', except: [] },
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
      { term: 'imperative', except: [] },
    ],
    'node-03': [
      { term: 'accusative', except: [] },
      { term: 'dative', except: [] },
      { term: 'genitive', except: [] },
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
    ],
    'node-04': [
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
      { term: 'perfekt', except: [] },
    ],
    'node-05': [
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
      { term: 'genitive', except: [] },
    ],
    'node-06': [
      { term: 'dative', except: ['accusative and dative', 'dative or accusative'] },
      { term: 'genitive', except: [] },
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
    ],
    'node-07': [
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
      { term: 'perfekt', except: [] },
    ],
    'node-08': [
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
      { term: 'genitive', except: [] },
    ],
    'node-09': [
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
      { term: 'genitive', except: [] },
    ],
    'node-10': [
      { term: 'accusative case', except: ['dative and accusative'] },
      { term: 'genitive', except: [] },
      { term: 'subjunctive', except: [] },
      { term: 'konjunktiv', except: [] },
      { term: 'passive voice', except: [] },
    ],
  };

  const concepts = wrongConcepts[node] || [];
  for (const { term, except } of concepts) {
    if (tip.includes(term)) {
      const excluded = except.some(ex => tip.includes(ex));
      if (!excluded) {
        issues.push(`tip mentions "${term}" but card is ${node} (${nodeInfo.topic})`);
      }
    }
  }

  // Check for conjugation-pattern-only tips (boring/unhelpful)
  // Pattern: "'verb' is regular/irregular: ich X, du X, ..."
  if (/^'[a-zäöüß]+' is (regular|irregular):\s*(ich|du|er|sie|es|wir|ihr)\b/.test(card.grammar)) {
    // Only flag if the tip is ONLY about conjugation and nothing else
    const afterColon = card.grammar.split(':').slice(1).join(':').trim();
    // If after the colon it's just "ich X, du X, er X" type patterns with no contextual info
    if (/^(ich|du|er|sie|es|wir|ihr|man)\s+\w+,?\s*(du\s+\w+,?\s*)?(er|sie|es)\s+\w+/i.test(afterColon)) {
      const hasContext = /\b(use|means|expresses?|indicates?|implies?|context|situation|colloquial|formal|polite|casual|everyday|common|typical|often|always|never|usually|note that|remember|important|careful|unlike|similar|different)\b/i.test(afterColon);
      if (!hasContext) {
        issues.push('tip is pure conjugation pattern without contextual usage info');
      }
    }
  }

  return issues.length > 0 ? issues : null;
}

// ── English quality check ─────────────────────────────────
function checkEnglish(english) {
  const issues = [];

  // Common typos / awkward patterns
  if (/\s{2,}/.test(english)) issues.push('double spaces');
  if (/[.!?],/.test(english)) issues.push('punctuation error');
  if (/,,/.test(english)) issues.push('double comma');
  if (/\.{2}(?!\.)/.test(english)) issues.push('two dots (not ellipsis)');

  // Starts with lowercase
  if (/^[a-z]/.test(english) && !/^(e\.g\.|i\.e\.)/.test(english)) {
    issues.push('starts with lowercase');
  }

  // Very short
  if (english.length < 5 && !['Yes.', 'No.', 'Why?', 'Hi!', 'Bye!', 'No!', 'Yes!'].includes(english)) {
    issues.push(`very short translation: "${english}"`);
  }

  // Unnatural patterns
  if (/\bhe\/she\b/i.test(english) && !/\bthey\b/i.test(english)) {
    // he/she is fine for gendered languages, only flag if excessive
  }

  // Trailing/leading whitespace
  if (english !== english.trim()) {
    issues.push('leading/trailing whitespace');
  }

  // Missing terminal punctuation
  if (english.length > 10 && !/[.!?]$/.test(english.trim())) {
    issues.push('missing terminal punctuation');
  }

  return issues.length > 0 ? issues : null;
}

// ── Vocabulary appropriateness for node level ─────────────
function checkVocabAppropriateness(card) {
  const node = parseInt(card.grammarNode.replace('node-', ''));
  if (node > 10) return null;

  const english = card.english.toLowerCase();
  const issues = [];

  // Advanced academic vocabulary in A1 nodes (1-8)
  if (node <= 8) {
    const advancedTerms = [
      'dissertation', 'philosophical', 'metaphysical', 'jurisprudence',
      'bureaucratic', 'geopolitical', 'infrastructure', 'constitutional',
      'paradigm', 'ontological', 'epistemological', 'hermeneutic',
    ];
    for (const term of advancedTerms) {
      if (english.includes(term)) {
        issues.push(`advanced vocabulary "${term}" in ${card.grammarNode} (A1)`);
      }
    }
  }

  // Overly long sentences in early nodes
  if (node <= 3) {
    const words = tokenize(card.target);
    if (words.length > 15) {
      issues.push(`long sentence for ${card.grammarNode}: ${words.length} words`);
    }
  }

  return issues.length > 0 ? issues : null;
}

// ── Main audit ─────────────────────────────────────────────
const auditIssues = [];
const summary = {
  totalCards: cards.length,
  cardsWithIssues: 0,
  dictCoverage: { missingWordInstances: 0, cardsAffected: 0 },
  grammarAlignment: 0,
  englishQuality: 0,
  duplicates: 0,
  vocabAppropriateness: 0,
  audioMissing: 0,
};

// Build audio set
const audioFiles = new Set();
try { fs.readdirSync(AUDIO_DIR).forEach(f => audioFiles.add(f)); } catch (e) {}
try { fs.readdirSync(path.join(ROOT, 'public/audio')).forEach(f => audioFiles.add(f)); } catch (e) {}
console.log(`Audio files found: ${audioFiles.size}`);

// Duplicate detection
const targetMap = new Map();
for (const card of cards) {
  const t = card.target.toLowerCase().trim();
  if (!targetMap.has(t)) targetMap.set(t, []);
  targetMap.get(t).push(card.id);
}

const duplicateIds = new Set();
for (const [target, ids] of targetMap) {
  if (ids.length > 1) ids.forEach(id => duplicateIds.add(id));
}

// Missing word tracker
const allMissingWords = {};

for (const card of cards) {
  const cardIssues = [];

  // 1. Dictionary coverage
  const words = tokenize(card.target);
  const missingWords = words.filter(w => !isInDict(w));
  if (missingWords.length > 0) {
    cardIssues.push({
      type: 'dict_missing',
      words: missingWords,
      detail: `${missingWords.length}/${words.length} words not in dictionary: ${missingWords.join(', ')}`
    });
    summary.dictCoverage.cardsAffected++;
    summary.dictCoverage.missingWordInstances += missingWords.length;
    for (const w of missingWords) {
      allMissingWords[w] = (allMissingWords[w] || 0) + 1;
    }
  }

  // 2. Grammar tip alignment
  const grammarIssues = checkGrammarAlignment(card);
  if (grammarIssues) {
    cardIssues.push({
      type: 'grammar_misalign',
      detail: grammarIssues.join('; ')
    });
    summary.grammarAlignment++;
  }

  // 3. English quality
  const englishIssues = checkEnglish(card.english);
  if (englishIssues) {
    cardIssues.push({
      type: 'english_quality',
      detail: englishIssues.join('; ')
    });
    summary.englishQuality++;
  }

  // 4. Duplicates
  if (duplicateIds.has(card.id)) {
    const t = card.target.toLowerCase().trim();
    const dupes = targetMap.get(t).filter(id => id !== card.id);
    cardIssues.push({
      type: 'duplicate_target',
      detail: `duplicate of: ${dupes.join(', ')}`
    });
    summary.duplicates++;
  }

  // 5. Vocabulary appropriateness
  const vocabIssues = checkVocabAppropriateness(card);
  if (vocabIssues) {
    cardIssues.push({
      type: 'vocab_inappropriate',
      detail: vocabIssues.join('; ')
    });
    summary.vocabAppropriateness++;
  }

  // 6. Audio existence
  if (!audioFiles.has(card.audio)) {
    cardIssues.push({
      type: 'audio_missing',
      detail: `audio file not found: ${card.audio}`
    });
    summary.audioMissing++;
  }

  if (cardIssues.length > 0) {
    auditIssues.push({
      id: card.id,
      node: card.grammarNode,
      target: card.target,
      english: card.english,
      grammar: card.grammar || null,
      issues: cardIssues
    });
    summary.cardsWithIssues++;
  }
}

// Top missing words
const topMissing = Object.entries(allMissingWords)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 100);

const output = {
  audit: 'German cards batches 0-3 (nodes 01-18 approx)',
  date: new Date().toISOString().split('T')[0],
  summary: {
    ...summary,
    issueRate: `${((summary.cardsWithIssues / summary.totalCards) * 100).toFixed(1)}%`,
    uniqueMissingWords: Object.keys(allMissingWords).length,
  },
  topMissingWords: topMissing,
  cards: auditIssues
};

const outPath = path.join(ROOT, 'scripts/output/audit-de-cards-0.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nAudit complete. Results written to: ${outPath}`);
console.log(`Cards with issues: ${summary.cardsWithIssues}/${summary.totalCards} (${((summary.cardsWithIssues / summary.totalCards) * 100).toFixed(1)}%)`);
console.log(`  Dict coverage: ${summary.dictCoverage.cardsAffected} cards, ${summary.dictCoverage.missingWordInstances} missing word instances, ${Object.keys(allMissingWords).length} unique missing words`);
console.log(`  Grammar alignment: ${summary.grammarAlignment}`);
console.log(`  English quality: ${summary.englishQuality}`);
console.log(`  Duplicates: ${summary.duplicates}`);
console.log(`  Vocab appropriateness: ${summary.vocabAppropriateness}`);
console.log(`  Audio missing: ${summary.audioMissing}`);
console.log(`\nTop 30 missing words:`);
topMissing.slice(0, 30).forEach(([w, c]) => console.log(`  ${w}: ${c}`));
