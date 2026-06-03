#!/usr/bin/env node
/**
 * Card-by-card audit of German batches 4-7 (~1933 cards)
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 *         duplicates, vocabulary appropriateness, audio existence.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'quest-audio');
const DICT_FILE = path.join(ROOT, 'src', 'data', 'dictionary', 'de.ts');

// ─── Load batches ────────────────────────────────────────────
const batches = [4, 5, 6, 7];
let allCards = [];
for (const b of batches) {
  const fp = path.join(ROOT, 'scripts', 'output', 'audit-batches', `de-batch-${b}.json`);
  const cards = JSON.parse(fs.readFileSync(fp, 'utf8'));
  allCards = allCards.concat(cards);
}
console.log(`Loaded ${allCards.length} cards from batches ${batches.join(',')}`);

// ─── Load dictionary keys ────────────────────────────────────
const dictSrc = fs.readFileSync(DICT_FILE, 'utf8');
// Extract the DICT object body
const dictStart = dictSrc.indexOf('const DICT: Record<string, DictEntry> = {');
const dictBody = dictSrc.slice(dictStart);
const dictKeys = new Set();
const keyRe = /^\s*'([^']+)':/gm;
let m;
while ((m = keyRe.exec(dictBody)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
// Also get double-quoted keys
const keyRe2 = /^\s*"([^"]+)":/gm;
while ((m = keyRe2.exec(dictBody)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
console.log(`Dictionary has ${dictKeys.size} entries`);

// ─── Load irregular map ──────────────────────────────────────
const irregStart = dictSrc.indexOf('const IRREGULAR_MAP');
const irregEnd = dictSrc.indexOf('};', irregStart) + 2;
const irregBody = dictSrc.slice(irregStart, irregEnd);
const irregMap = {};
const irregRe = /'([^']+)':\s*'([^']+)'/g;
while ((m = irregRe.exec(irregBody)) !== null) {
  irregMap[m[1]] = m[2];
}

// ─── Load contraction map ────────────────────────────────────
const contrStart = dictSrc.indexOf('const CONTRACTION_MAP');
const contrEnd = dictSrc.indexOf('};', contrStart) + 2;
const contrBody = dictSrc.slice(contrStart, contrEnd);
const contrMap = {};
const contrRe = /'([^']+)':\s*\['([^']+)'/g;
while ((m = contrRe.exec(contrBody)) !== null) {
  contrMap[m[1]] = m[2];
}

// ─── Load audio files ────────────────────────────────────────
const audioFiles = new Set(fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('de-de-')));
console.log(`Audio files: ${audioFiles.size}`);

// ─── Helper: check if a German word is "covered" by dictionary ──
function isWordCovered(word) {
  const w = word.toLowerCase().replace(/[.,!?;:""«»()––…''„"]/g, '').trim();
  if (!w || w.length <= 1) return true; // skip single chars
  if (/^\d+$/.test(w)) return true; // numbers

  // Direct lookup
  if (dictKeys.has(w)) return true;

  // Contraction
  if (contrMap[w]) return true;

  // Irregular
  if (irregMap[w]) return true;

  // Common verb endings - try many combinations
  const verbSuffixes = ['e', 'st', 't', 'en', 'et', 'te', 'tet', 'ten', 'test', 'est'];
  for (const suffix of verbSuffixes) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, -suffix.length);
      if (dictKeys.has(stem + 'en')) return true;
      if (dictKeys.has(stem + 'n')) return true;
      if (dictKeys.has(stem + 'ern')) return true;
      if (dictKeys.has(stem + 'eln')) return true;
    }
  }

  // Adjective/noun endings
  for (const suffix of ['er', 'es', 'em', 'en', 'e', 'n', 's']) {
    if (w.endsWith(suffix) && w.length > suffix.length + 2) {
      const stem = w.slice(0, -suffix.length);
      if (dictKeys.has(stem)) return true;
      // Also try with common noun/adj suffixes on the stem
      for (const ext of ['e', 'en', 'er']) {
        if (dictKeys.has(stem + ext)) return true;
      }
    }
  }

  // past participle ge-...-t / ge-...-en / ge-...-et
  if (w.startsWith('ge')) {
    const withoutGe = w.slice(2);
    if (dictKeys.has(withoutGe)) return true;
    // ge-X-t -> X-en
    for (const ending of ['t', 'et', 'en', 'ten']) {
      if (withoutGe.endsWith(ending)) {
        const stem = withoutGe.slice(0, -ending.length);
        if (dictKeys.has(stem + 'en')) return true;
        if (dictKeys.has(stem + 'n')) return true;
        if (dictKeys.has(stem + 'ern')) return true;
        if (dictKeys.has(stem + 'eln')) return true;
        if (dictKeys.has(stem + 'ieren')) return true;
      }
    }
  }

  // Separable verb past participles: prefix-ge-stem-t (e.g., aufgeräumt -> aufräumen)
  const sepPrefixes = ['ab', 'an', 'auf', 'aus', 'bei', 'ein', 'mit', 'nach', 'vor', 'zu', 'hin', 'her', 'um', 'weg', 'fest', 'frei', 'los', 'statt', 'teil', 'zurück', 'zusammen'];
  for (const prefix of sepPrefixes) {
    if (w.startsWith(prefix + 'ge')) {
      const inner = w.slice(prefix.length + 2);
      for (const ending of ['t', 'et', 'en']) {
        if (inner.endsWith(ending)) {
          const stem = inner.slice(0, -ending.length);
          if (dictKeys.has(prefix + stem + 'en')) return true;
          if (dictKeys.has(prefix + stem + 'n')) return true;
        }
      }
    }
    // Also check for separable verb forms without ge (present tense forms)
    if (w.startsWith(prefix)) {
      const rest = w.slice(prefix.length);
      for (const suffix of verbSuffixes) {
        if (rest.endsWith(suffix)) {
          const stem = rest.slice(0, -suffix.length);
          if (dictKeys.has(prefix + stem + 'en')) return true;
          if (dictKeys.has(prefix + stem + 'n')) return true;
        }
      }
    }
  }

  // Umlaut reversal
  const deUmlaut = w.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
  if (deUmlaut !== w) {
    if (dictKeys.has(deUmlaut)) return true;
    for (const suffix of ['er', 'e', 'en', 'n', 'es', 'em', 's']) {
      if (deUmlaut.endsWith(suffix) && deUmlaut.length > suffix.length + 2) {
        const stem = deUmlaut.slice(0, -suffix.length);
        if (dictKeys.has(stem)) return true;
        if (dictKeys.has(stem + 'e')) return true;
      }
    }
    // Umlaut verb stems
    for (const suffix of verbSuffixes) {
      if (deUmlaut.endsWith(suffix)) {
        const stem = deUmlaut.slice(0, -suffix.length);
        if (dictKeys.has(stem + 'en')) return true;
      }
    }
    // Also try umlaut-reversed forms for compound analysis
    if (isCompoundCovered(deUmlaut)) return true;
  }

  // German compound word analysis: try splitting at various points
  if (isCompoundCovered(w)) return true;

  // -ung, -heit, -keit, -schaft, -lich, -isch nominalization
  const derivSuffixes = [
    ['ung', 'en'], ['heit', ''], ['keit', ''], ['schaft', ''],
    ['lich', ''], ['isch', ''], ['ische', ''], ['ischen', ''],
    ['licher', ''], ['liches', ''], ['lichem', ''], ['lichen', ''],
    ['igung', 'igen'], ['ierung', 'ieren'],
  ];
  for (const [suf, repl] of derivSuffixes) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const stem = w.slice(0, -suf.length) + repl;
      if (dictKeys.has(stem)) return true;
      if (repl === '' && dictKeys.has(w.slice(0, -suf.length))) return true;
      if (repl === '' && dictKeys.has(w.slice(0, -suf.length) + 'e')) return true;
      if (repl === '' && dictKeys.has(w.slice(0, -suf.length) + 'en')) return true;
    }
  }

  return false;
}

function isCompoundCovered(w) {
  // Try splitting compound at various points (min 3 chars each part)
  for (let i = 3; i <= w.length - 3; i++) {
    const left = w.slice(0, i);
    const right = w.slice(i);
    // Check if both parts exist, or left exists and right is coverable
    const leftOk = dictKeys.has(left) || dictKeys.has(left + 'e') || dictKeys.has(left + 'en');
    if (leftOk && dictKeys.has(right)) return true;
    // Also try with linking 's' or 'n' or 'en'
    if (i < w.length - 3) {
      for (const link of ['s', 'n', 'en', 'er', 'es']) {
        if (w.slice(i).startsWith(link)) {
          const rightPart = w.slice(i + link.length);
          if (rightPart.length >= 3 && leftOk && dictKeys.has(rightPart)) return true;
        }
      }
    }
  }
  return false;
}

// ─── Common German stop words that don't need dictionary entry ──
const STOP_WORDS = new Set([
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'der', 'die', 'das',
  'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'und', 'oder', 'aber', 'denn', 'weil', 'wenn', 'als', 'ob', 'dass',
  'nicht', 'kein', 'keine', 'keinen', 'keinem', 'keiner',
  'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines',
  'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines',
  'sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres',
  'unser', 'unsere', 'unseren', 'unserem', 'unserer', 'unseres',
  'euer', 'eure', 'euren', 'eurem', 'eurer', 'eures',
  'zu', 'von', 'mit', 'für', 'auf', 'an', 'in', 'um', 'bei',
  'nach', 'vor', 'über', 'unter', 'zwischen', 'durch', 'gegen', 'ohne',
  'bis', 'aus', 'seit', 'während', 'trotz', 'wegen', 'statt',
  'hier', 'da', 'dort', 'wo', 'hin', 'her', 'so', 'wie', 'was',
  'wer', 'wen', 'wem', 'wessen', 'welch', 'welche', 'welcher', 'welches',
  'dieser', 'diese', 'dieses', 'diesen', 'diesem',
  'jeder', 'jede', 'jedes', 'jeden', 'jedem',
  'alle', 'aller', 'allem', 'allen', 'alles',
  'sich', 'mir', 'dir', 'uns', 'euch', 'mich', 'dich',
  'ja', 'nein', 'schon', 'noch', 'auch', 'nur', 'sehr', 'viel',
  'mehr', 'ganz', 'immer', 'nie', 'oft', 'mal', 'doch', 'eben',
  'also', 'dann', 'nun', 'jetzt', 'heute', 'morgen', 'gestern',
  'am', 'im', 'vom', 'zum', 'zur', 'ins', 'ans', 'beim',
  'hab', 'habe', 'hat', 'hatte', 'hast', 'hatten', 'haben',
  'bin', 'bist', 'ist', 'sind', 'seid', 'war', 'waren', 'warst',
  'wird', 'wirst', 'werden', 'wurde', 'wurden',
  'kann', 'kannst', 'könnt', 'können', 'konnte', 'konnten',
  'muss', 'musst', 'müssen', 'müsst', 'musste', 'mussten',
  'soll', 'sollst', 'sollen', 'sollt', 'sollte', 'sollten',
  'will', 'willst', 'wollen', 'wollt', 'wollte', 'wollten',
  'darf', 'darfst', 'dürfen', 'dürft', 'durfte', 'durften',
  'mag', 'magst', 'mögen', 'mögt', 'möchte', 'möchten',
  'wäre', 'wären', 'hätte', 'hätten', 'würde', 'würden',
  'dem', 'deren', 'dessen', 'denen',
  'man', 'etwas', 'nichts', 'viele', 'wenig', 'andere',
  'andere', 'anderen', 'anderem', 'anderer', 'anderes',
  'einige', 'einigen', 'einiger', 'einiges',
  'erste', 'ersten', 'erster', 'erstes',
  'neue', 'neuen', 'neuer', 'neues', 'neuem',
  'letzten', 'letzte', 'letzter', 'letztes',
  'gleich', 'gleiche', 'gleichen', 'gleicher',
  'selbst', 'selber',
  'ab', 'an', 'auf', 'aus', 'bei', 'mit', 'nach', 'seit',
  'über', 'um', 'unter', 'von', 'vor', 'zu', 'zwischen',
  'gar', 'dazu', 'dabei', 'damit', 'dafür', 'davon', 'darum',
  'daher', 'dahin', 'darauf', 'daraus', 'daran', 'darin',
  'darüber', 'darunter', 'daneben', 'dagegen',
  'es', 'ihm', 'ihn', 'ihnen',
  'wann', 'warum', 'wieso', 'weshalb', 'woher', 'wohin',
  'nämlich', 'außerdem', 'trotzdem', 'deshalb', 'deswegen',
  'beide', 'beiden', 'beides', 'beider',
  'solch', 'solche', 'solchen', 'solcher', 'solches',
  'welchem', 'welchen',
  'meistens', 'manchmal', 'irgendwo', 'irgendwann', 'irgendwie',
  'oben', 'unten', 'links', 'rechts', 'vorne', 'hinten',
  'innen', 'außen', 'überall', 'nirgends', 'nirgendwo',
  'genug', 'fast', 'ungefähr', 'etwa', 'kaum', 'ziemlich',
  'sofort', 'bald', 'früher', 'später', 'zuerst', 'zuletzt',
  'sonst', 'stattdessen', 'hingegen', 'jedoch', 'dennoch',
  'obwohl', 'sobald', 'nachdem', 'bevor', 'seitdem', 'solange',
  'falls', 'sofern', 'damit', 'sodass', 'indem',
  'weder', 'noch', 'sowohl', 'entweder',
  'erst', 'sogar', 'bloß', 'halt', 'wohl', 'recht',
  'gerade', 'bereits', 'längst', 'jemals', 'niemals',
  'worden', 'geworden', 'gewesen', 'gehabt',
  'könnte', 'könnten', 'müsste', 'müssten', 'dürfte', 'dürften',
  'sollte', 'sollten', 'möchte', 'möchten', 'würde', 'würden',
  'sei', 'seien',
]);

// ─── Audit logic ─────────────────────────────────────────────
const issues = [];
const issueCounts = {};
const seenTargets = new Map(); // target -> id for duplicate detection
const seenEnglish = new Map(); // english -> id for duplicate detection
const globalMissingWords = {};

// Grammar node expected topics (rough mapping)
const NODE_TOPICS = {
  'node-01': 'greetings, basics',
  'node-02': 'numbers, dates, time',
  'node-03': 'articles, gender',
  'node-04': 'present tense',
  'node-05': 'accusative case',
  'node-06': 'dative case',
  'node-07': 'modal verbs',
  'node-08': 'separable verbs',
  'node-09': 'past tense (Perfekt)',
  'node-10': 'prepositions',
  'node-11': 'adjective declension',
  'node-12': 'comparison',
  'node-13': 'genitive case',
  'node-14': 'Präteritum',
  'node-15': 'reflexive verbs',
  'node-16': 'passive voice',
  'node-17': 'future tense',
  'node-18': 'subjunctive (Konjunktiv II)',
  'node-19': 'relative clauses',
  'node-20': 'infinitive clauses',
  'node-21': 'conditional',
  'node-22': 'word order',
  'node-23': 'Konjunktiv I',
  'node-24': 'advanced prepositions',
  'node-25': 'participles as adjectives',
  'node-26': 'nominalizations',
  'node-27': 'double infinitive',
  'node-28': 'advanced word order',
  'node-29': 'idiomatic expressions',
  'node-30': 'formal register',
  'node-31': 'academic language',
  'node-32': 'colloquial German',
  'node-33': 'regional variation',
  'node-34': 'literary German',
  'node-35': 'specialized vocabulary',
};

function addIssue(card, type, detail) {
  if (!issueCounts[type]) issueCounts[type] = 0;
  issueCounts[type]++;

  // Find or create issue entry for this card
  let entry = issues.find(e => e.id === card.id);
  if (!entry) {
    entry = {
      id: card.id,
      grammarNode: card.grammarNode,
      target: card.target,
      english: card.english,
      issues: []
    };
    issues.push(entry);
  }
  entry.issues.push({ type, detail });
}

// ─── Process each card ───────────────────────────────────────
for (const card of allCards) {
  const { id, target, english, audio, grammar, grammarNode, tags, priority } = card;

  // 1. DICTIONARY COVERAGE
  const words = target.split(/\s+/).map(w => w.toLowerCase().replace(/[.,!?;:""«»()––…''„"]/g, '').trim()).filter(Boolean);
  const uncoveredWords = [];
  for (const w of words) {
    if (STOP_WORDS.has(w)) continue;
    if (w.length <= 2) continue;
    if (!isWordCovered(w)) {
      uncoveredWords.push(w);
    }
  }
  // Flag if 3+ missing words or >50% of content words missing
  const contentWords = words.filter(w => !STOP_WORDS.has(w) && w.length > 2);
  if (uncoveredWords.length >= 3 || (contentWords.length > 0 && uncoveredWords.length / contentWords.length > 0.5)) {
    addIssue(card, 'dict_coverage', `Missing ${uncoveredWords.length}/${contentWords.length} content words: ${uncoveredWords.join(', ')}`);
  }
  // Track all missing words for summary even if not flagged per-card
  for (const uw of uncoveredWords) {
    if (!globalMissingWords[uw]) globalMissingWords[uw] = 0;
    globalMissingWords[uw]++;
  }

  // 2. GRAMMAR TIP ALIGNMENT
  if (grammar && grammar.length > 0) {
    // Check for boring conjugation-pattern tips
    const boringPatterns = [
      /^(the|german|all|regular)\s+\w+\s+(tense|verbs?)\s+(adds?|uses?|forms?|endings?)/i,
      /^(to form|forming) the .+ tense/i,
      /endings?:\s*ich\s/i,
      /conjugat(e|ion|ing)\s/i,
      /ich\s+-\w+,\s+du\s+-\w+/i,
    ];
    for (const pat of boringPatterns) {
      if (pat.test(grammar)) {
        addIssue(card, 'grammar_boring', `Grammar tip looks like plain conjugation: "${grammar.slice(0, 100)}..."`);
        break;
      }
    }

    // Check if grammar tip is a duplicate/repeated pattern across many cards
    // (we check this globally after the loop)

    // Check if grammar tip is empty string
    if (grammar.trim() === '') {
      // Not an issue per se, just no tip
    }
  }

  // 3. ENGLISH QUALITY
  // Check for common English issues
  if (english) {
    // Untranslated German left in English
    const germanInEnglish = english.match(/\b(der|die|das|ein|eine|und|oder|ich|ist|nicht|mit|von|für|auf)\b/gi);
    if (germanInEnglish && germanInEnglish.length >= 2) {
      // Filter out false positives (English words that happen to match)
      const realGerman = germanInEnglish.filter(w => {
        const low = w.toLowerCase();
        return !['die', 'an', 'hat', 'in', 'man'].includes(low); // these are also English words
      });
      if (realGerman.length >= 2) {
        addIssue(card, 'english_untranslated', `Possible German words in English: ${realGerman.join(', ')}`);
      }
    }

    // Very short/unhelpful English
    if (english.length < 5) {
      addIssue(card, 'english_too_short', `English translation very short: "${english}"`);
    }

    // English same as target (not translated)
    if (english.trim().toLowerCase() === target.trim().toLowerCase()) {
      addIssue(card, 'english_same_as_target', 'English is identical to German target');
    }

    // Broken English patterns
    if (/\b(the the|a a|is is|to to|and and)\b/i.test(english)) {
      addIssue(card, 'english_stuttered', `Repeated words in English: "${english}"`);
    }

    // Missing punctuation at end
    if (target.endsWith('.') && !english.endsWith('.') && !english.endsWith('!') && !english.endsWith('?')) {
      addIssue(card, 'punctuation_minor', 'Target ends with period but English does not');
    }
    if (target.endsWith('?') && !english.endsWith('?')) {
      addIssue(card, 'punctuation_question', 'Target is question but English lacks question mark');
    }
    if (target.endsWith('!') && !english.endsWith('!') && !english.endsWith('.')) {
      addIssue(card, 'punctuation_exclamation', 'Target ends with ! but English does not');
    }
  }

  // 4. DUPLICATES
  if (seenTargets.has(target)) {
    addIssue(card, 'duplicate_target', `Duplicate target sentence (also ${seenTargets.get(target)})`);
  } else {
    seenTargets.set(target, id);
  }

  // Check near-duplicate English
  const engNorm = english.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
  if (seenEnglish.has(engNorm)) {
    addIssue(card, 'duplicate_english', `Duplicate English translation (also ${seenEnglish.get(engNorm)})`);
  } else {
    seenEnglish.set(engNorm, id);
  }

  // 5. VOCABULARY APPROPRIATENESS
  // Check for overly obscure/impractical vocabulary for language learners
  const obscurePatterns = [
    /Dompteur/i, /Alchimist/i, /Hieroglyph/i,
  ];
  for (const pat of obscurePatterns) {
    if (pat.test(target)) {
      addIssue(card, 'vocab_obscure', `Potentially obscure vocabulary: ${target.match(pat)[0]}`);
    }
  }

  // Check for sentences that are too long (>120 chars) or too short (<10 chars)
  if (target.length > 140) {
    addIssue(card, 'sentence_too_long', `Target is ${target.length} chars (may be hard to study)`);
  }
  if (target.length < 10) {
    addIssue(card, 'sentence_too_short', `Target is only ${target.length} chars`);
  }

  // 6. AUDIO EXISTS
  if (audio) {
    const audioFile = audio.replace(/^de\//, ''); // normalize path
    if (!audioFiles.has(audioFile)) {
      addIssue(card, 'audio_missing', `Audio file not found: ${audio}`);
    }
  } else {
    addIssue(card, 'audio_missing', 'No audio field on card');
  }

  // Check for grammar tip that doesn't match the node topic
  if (grammar && grammar.length > 0 && grammarNode) {
    const tipLow = grammar.toLowerCase();

    // Flag grammar tips that talk about conjugation tables
    if (/\bich\b.*\bdu\b.*\ber\/sie\b/i.test(grammar) || /\bwir\b.*\bihr\b.*\bsie\b/i.test(grammar)) {
      addIssue(card, 'grammar_conjugation_table', `Grammar tip contains conjugation table pattern: "${grammar.slice(0, 80)}..."`);
    }

    // Node-specific misalignment checks
    // node-15: Object pronouns - tips about comparatives are misaligned
    if (grammarNode === 'node-15' && (tipLow.includes('comparative') || tipLow.includes('superlative'))) {
      addIssue(card, 'grammar_misaligned', `Comparative/superlative tip on Object Pronouns node (node-15): "${grammar.slice(0, 60)}..."`);
    }
    // node-16: Present subjunctive - tips about comparatives are misaligned
    if (grammarNode === 'node-16' && (tipLow.includes('comparative') || tipLow.includes('superlative'))) {
      addIssue(card, 'grammar_misaligned', `Comparative/superlative tip on Subjunctive node (node-16): "${grammar.slice(0, 60)}..."`);
    }
    // node-19: Future tense - tips about imperatives are misaligned
    if (grammarNode === 'node-19' && tipLow.includes('imperative')) {
      addIssue(card, 'grammar_misaligned', `Imperative tip on Future Tense node (node-19): "${grammar.slice(0, 60)}..."`);
    }
    // node-20: Relative clauses - adjective-only tips misaligned
    if (grammarNode === 'node-20' && tipLow.includes('adjective') && !tipLow.includes('relat')) {
      addIssue(card, 'grammar_misaligned', `Adjective declension tip on Relative Clauses node (node-20): "${grammar.slice(0, 60)}..."`);
    }
    // node-21: Perfect & compound tenses - genitive tips misaligned
    if (grammarNode === 'node-21' && tipLow.includes('genitive') && !tipLow.includes('perfect') && !tipLow.includes('compound')) {
      addIssue(card, 'grammar_misaligned', `Genitive tip on Perfect/Compound Tenses node (node-21): "${grammar.slice(0, 60)}..."`);
    }
    // Passive tips on non-passive nodes
    if (grammarNode !== 'node-24' && tipLow.startsWith('passive construction')) {
      addIssue(card, 'grammar_misaligned', `Passive construction tip on non-passive node (${grammarNode}): "${grammar.slice(0, 60)}..."`);
    }
    // Reflexive pronoun tips on non-reflexive nodes (node-13 is reflexive, node-15 may include them too)
    if (!['node-13', 'node-15'].includes(grammarNode) && /reflexive pronoun/i.test(tipLow.slice(0, 30))) {
      addIssue(card, 'grammar_misaligned', `Reflexive pronoun tip on ${grammarNode}: "${grammar.slice(0, 60)}..."`);
    }
  }

  // Check: priority should be 1-3
  if (priority !== undefined && (priority < 1 || priority > 3)) {
    addIssue(card, 'invalid_priority', `Priority ${priority} outside 1-3 range`);
  }

  // Check: tags should include 'general'
  if (!tags || !tags.includes('general')) {
    addIssue(card, 'missing_general_tag', 'Card missing "general" tag');
  }
}

// ─── Check for grammar tip repetition (same tip on many cards) ──
const tipCounts = {};
for (const card of allCards) {
  if (card.grammar && card.grammar.trim()) {
    const tipKey = card.grammar.trim().slice(0, 100);
    if (!tipCounts[tipKey]) tipCounts[tipKey] = [];
    tipCounts[tipKey].push(card.id);
  }
}
for (const [tip, ids] of Object.entries(tipCounts)) {
  if (ids.length > 8) {
    // Flag the first card only, noting the count
    const firstCard = allCards.find(c => c.id === ids[0]);
    if (firstCard) {
      addIssue(firstCard, 'grammar_overused', `This grammar tip appears on ${ids.length} cards (may be too repetitive): "${tip}..."`);
    }
  }
}

// ─── Write output ────────────────────────────────────────────
// Compute top missing dictionary words
const sortedMissing = Object.entries(globalMissingWords)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 100)
  .map(([w, c]) => ({ word: w, count: c }));

const output = {
  summary: {
    totalCards: allCards.length,
    cardsWithIssues: issues.length,
    issueBreakdown: issueCounts,
    topMissingDictWords: sortedMissing,
    uniqueMissingWords: Object.keys(globalMissingWords).length,
  },
  cards: issues
};

const outPath = path.join(ROOT, 'scripts', 'output', 'audit-de-cards-1.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nAudit complete.`);
console.log(`Total cards: ${allCards.length}`);
console.log(`Cards with issues: ${issues.length}`);
console.log(`Issue breakdown:`, JSON.stringify(issueCounts, null, 2));
console.log(`Output: ${outPath}`);
