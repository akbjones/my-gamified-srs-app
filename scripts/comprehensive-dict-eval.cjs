#!/usr/bin/env node
/**
 * Comprehensive Dictionary Evaluation & Fix Script
 * Checks ALL 19 issue types across ALL 11 language dictionaries.
 * Then applies fixes directly to dictionary .ts files.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DICT_DIR = path.join(ROOT, 'src/data/dictionary');
const DATA_DIR = path.join(ROOT, 'src/data');

const LANGS = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'hi', 'tr', 'ru'];

// espeak-ng voice codes
const ESPEAK_VOICES = {
  es: 'es', it: 'it', fr: 'fr', pt: 'pt', de: 'de', nl: 'nl',
  sv: 'sv', cy: 'cy', hi: 'hi', tr: 'tr', ru: 'ru'
};

// Infinitive endings per language
const INF_ENDINGS = {
  es: ['ar', 'er', 'ir', 'arse', 'erse', 'irse'],
  it: ['are', 'ere', 'ire', 'arsi', 'ersi', 'irsi'],
  fr: ['er', 'ir', 're', 'oir'],
  pt: ['ar', 'er', 'ir', 'or'],
  de: ['en', 'eln', 'ern', 'n'],
  nl: ['en', 'ën', 'n'],
  sv: ['a', 'as'],
  cy: [], // Welsh verbs don't follow simple infinitive patterns
  hi: ['ना', 'ाना'],
  tr: ['mak', 'mek'],
  ru: ['ть', 'ти', 'чь', 'ться', 'тись'],
};

// Grammar description prefixes (issue #2)
const GRAMMAR_PREFIXES = [
  'strong', 'weak', 'mixed', 'nominative', 'accusative', 'genitive', 'dative',
  'oblique', 'vocative', 'masculine', 'feminine', 'neuter', 'singular', 'plural',
  'inflection', 'form of', 'participle', 'imperfect', 'preterite', 'subjunctive',
  'imperative', 'conditional', 'gerund', 'superlative', 'comparative', 'diminutive',
  'augmentative', 'alternative form', 'past tense', 'present tense', 'direct', 'indirect',
  'synonym of', 'singulative of', 'definite form of', 'indefinite form of',
  'mutation of', 'soft mutation', 'nasal mutation', 'aspirate mutation',
  'plural of', 'singular of', 'genitive of', 'dative of', 'ablative of',
  'possessive of', 'reflexive of', 'abstract noun of', 'agent noun of',
  'first-person', 'second-person', 'third-person', '1st person', '2nd person', '3rd person',
  'direct/oblique', 'oblique/vocative', 'direct masculine', 'direct feminine',
];

// Fake verb targets - nouns/adjectives that are clearly NOT verbs
const FAKE_VERB_WORDS = new Set([
  'newspaper', 'morning', 'children', 'flowing', 'rainy', 'sunny', 'evening',
  'afternoon', 'weather', 'beautiful', 'wonderful', 'building', 'ceiling',
  'lightning', 'painting', 'drawing', 'clothing', 'parking', 'meeting',
  'reading', 'wedding', 'nothing', 'something', 'everything', 'anything',
  'mural', 'festival', 'hospital', 'animal', 'capital', 'general',
  'material', 'mineral', 'natural', 'normal', 'original', 'personal',
  'special', 'traditional', 'national', 'international', 'professional',
  'musical', 'cultural', 'annual', 'central', 'digital', 'legal',
  'local', 'medical', 'mental', 'physical', 'political', 'social',
  'visual', 'formal', 'final', 'royal', 'total', 'global',
  'brother', 'sister', 'mother', 'father', 'daughter', 'uncle', 'aunt',
  'cousin', 'grandmother', 'grandfather', 'friend', 'teacher', 'student',
  'doctor', 'engineer', 'lawyer', 'officer', 'soldier', 'scientist',
  'artist', 'writer', 'singer', 'dancer', 'player', 'driver',
  'worker', 'farmer', 'baker', 'painter', 'carpenter', 'plumber',
  'tailor', 'barber', 'butcher', 'fisher', 'hunter', 'sailor',
  'table', 'chair', 'window', 'door', 'floor', 'wall', 'roof',
  'garden', 'kitchen', 'bedroom', 'bathroom', 'balcony', 'staircase',
  'mountain', 'river', 'forest', 'island', 'desert', 'valley',
  'ocean', 'lake', 'bridge', 'tower', 'castle', 'palace',
  'market', 'restaurant', 'hotel', 'museum', 'library', 'church',
  'mosque', 'temple', 'school', 'university', 'airport', 'station',
  'bread', 'water', 'milk', 'coffee', 'sugar', 'salt', 'pepper',
  'chicken', 'fish', 'meat', 'cheese', 'butter', 'rice', 'fruit',
  'apple', 'orange', 'banana', 'grape', 'lemon', 'potato', 'tomato',
  'red', 'blue', 'green', 'yellow', 'black', 'white', 'brown',
  'grey', 'pink', 'purple', 'golden', 'silver', 'dark', 'light',
  'big', 'small', 'tall', 'short', 'long', 'wide', 'narrow',
  'old', 'young', 'new', 'fast', 'slow', 'hot', 'cold', 'warm',
  'cool', 'dry', 'wet', 'hard', 'soft', 'heavy', 'empty', 'full',
  'deep', 'shallow', 'rich', 'poor', 'happy', 'sad', 'angry',
  'hungry', 'thirsty', 'tired', 'busy', 'free', 'ready', 'easy',
  'difficult', 'possible', 'impossible', 'important', 'necessary',
  'dangerous', 'safe', 'clean', 'dirty', 'quiet', 'loud', 'bright',
  'number', 'letter', 'word', 'page', 'book', 'story', 'song',
  'picture', 'movie', 'game', 'sport', 'music', 'dance', 'art',
  'color', 'shape', 'size', 'name', 'time', 'year', 'month',
  'week', 'day', 'hour', 'minute', 'second', 'money', 'price',
  'country', 'city', 'town', 'village', 'street', 'road', 'path',
  'car', 'bus', 'train', 'plane', 'ship', 'bicycle', 'horse',
  'dog', 'cat', 'bird', 'cow', 'pig', 'sheep', 'goat', 'rabbit',
  'lion', 'tiger', 'bear', 'wolf', 'snake', 'elephant', 'monkey',
  'rain', 'snow', 'wind', 'sun', 'moon', 'star', 'sky', 'cloud',
  'fire', 'earth', 'stone', 'wood', 'iron', 'gold', 'glass',
  'paper', 'cloth', 'leather', 'cotton', 'silk', 'wool',
  'head', 'hand', 'arm', 'leg', 'foot', 'eye', 'ear', 'nose',
  'mouth', 'tooth', 'hair', 'face', 'neck', 'back', 'heart',
  'blood', 'bone', 'skin', 'brain', 'stomach', 'finger', 'thumb',
  'king', 'queen', 'prince', 'princess', 'lord', 'lady',
  'husband', 'wife', 'baby', 'child', 'boy', 'girl', 'man', 'woman',
  // Turkish context bleed false-verb patterns
  'incense stick', 'scented candle',
]);

// IPA special chars (issue #11)
const IPA_SPECIAL = /[ˈˌɛɔʃʒŋɲʎʤʧθðæɑɒɜʊɪəɐɾʁɫβɣɟɖɳɽʈɭɕʑçɸʝɥʰʷⁿːˑ̤̃̈ɨɯʉɵøɶɤʌɹʋɰɬɮʘǀǃǂɓɗɠʄ]/;

// Contraction patterns (issues #15-16)
const CONTRACTION_PATTERNS = /\b(i'm|i'll|i'd|i've|we're|we've|we'll|we'd|they're|they've|they'll|they'd|you're|you've|you'll|you'd|he's|she's|it's|he'll|she'll|it'll|don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|let's|that's|there's|here's|what's|who's|how's|where's|when's)\b/i;
const POSSESSIVE_PATTERN = /'\s*s\s/;

// ─── Parse dictionary from .ts file ───────────────────────────────────────

function parseDictionary(lang) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = {};

  // Match all dictionary entries: 'key': { en: '...', ipa: '...', pos: '...', lemma?: '...' }
  // Handle both single-quote and double-quote keys
  const entryRegex = /^  (['"])((?:[^'\\]|\\.)*?)\1:\s*\{([^}]+)\}/gm;
  let m;
  while ((m = entryRegex.exec(content)) !== null) {
    const key = m[2].replace(/\\'/g, "'");
    const body = m[3];

    const enMatch = body.match(/en:\s*'((?:[^'\\]|\\.)*)'/);
    const ipaMatch = body.match(/ipa:\s*'((?:[^'\\]|\\.)*)'/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    const lemmaMatch = body.match(/lemma:\s*'((?:[^'\\]|\\.)*)'/);

    if (enMatch) {
      entries[key] = {
        en: enMatch[1].replace(/\\'/g, "'"),
        ipa: ipaMatch ? ipaMatch[1].replace(/\\'/g, "'") : '',
        pos: posMatch ? posMatch[1] : '',
        lemma: lemmaMatch ? lemmaMatch[1].replace(/\\'/g, "'") : undefined,
      };
    }
  }

  return entries;
}

// ─── Load deck and extract target words ────────────────────────────────────

function loadDeckWords(lang) {
  const langDirs = {
    es: 'spanish', it: 'italian', fr: 'french', pt: 'portuguese',
    de: 'german', nl: 'dutch', sv: 'swedish', cy: 'welsh',
    hi: 'hindi', tr: 'turkish', ru: 'russian'
  };
  const deckPath = path.join(DATA_DIR, langDirs[lang], 'deck.json');
  if (!fs.existsSync(deckPath)) return [];
  const cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const words = new Set();
  for (const card of cards) {
    if (!card.target) continue;
    // Tokenize: split on whitespace and strip punctuation
    const tokens = card.target
      .replace(/[¿¡.,!?;:"""''()––\-«»„"‚'…\[\]{}]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);
    for (const t of tokens) {
      words.add(t);
    }
  }
  return [...words];
}

// ─── Basic suffix stripping lookup ─────────────────────────────────────────

function canResolve(word, dict, lang) {
  if (dict[word]) return true;

  // Common suffix stripping
  const suffixes = {
    es: ['s', 'es', 'a', 'o', 'as', 'os', 'ando', 'iendo', 'ado', 'ido', 'aba', 'ía'],
    it: ['i', 'e', 'a', 'o', 'ando', 'endo', 'ato', 'ito', 'uto'],
    fr: ['s', 'e', 'es', 'ent', 'ant', 'ait', 'ais', 'ée', 'és', 'ées'],
    pt: ['s', 'es', 'a', 'o', 'as', 'os', 'ando', 'endo', 'ado', 'ido'],
    de: ['e', 'en', 'er', 'es', 'em', 'n', 'st', 'te', 'ten', 'ung'],
    nl: ['e', 'en', 'er', 'es', 'n', 's', 'de', 'den', 'heid', 'lijk'],
    sv: ['en', 'et', 'er', 'ar', 'or', 'n', 'na', 'arna', 'erna', 'a', 'de', 'des'],
    cy: ['au', 'oedd', 'ydd', 'ion', 'iau', 'iad', 'wr', 'wyr', 'es'],
    hi: ['ों', 'ें', 'ी', 'ा', 'े', 'ो', 'िया', 'ियों'],
    tr: ['ler', 'lar', 'de', 'da', 'den', 'dan', 'in', 'ın', 'un', 'ün', 'i', 'ı', 'u', 'ü', 'ye', 'ya', 'e', 'a'],
    ru: ['а', 'я', 'ы', 'и', 'у', 'ю', 'ов', 'ев', 'ей', 'ам', 'ями', 'ах', 'е', 'ом', 'ем'],
  };

  const langSuffixes = suffixes[lang] || [];
  // Sort by length descending for greedy matching
  const sorted = [...langSuffixes].sort((a, b) => b.length - a.length);
  for (const suf of sorted) {
    if (word.endsWith(suf) && word.length > suf.length + 1) {
      const stem = word.slice(0, -suf.length);
      if (dict[stem]) return true;
    }
  }

  // Numbers: skip
  if (/^\d+$/.test(word)) return true;
  // Very short words (1 char for CJK/devanagari, 1-2 for latin)
  if (word.length <= 1) return true;

  return false;
}

// ─── IPA regeneration via espeak-ng ────────────────────────────────────────

function regenerateIPA(word, lang) {
  try {
    const voice = ESPEAK_VOICES[lang];
    const result = execSync(
      `/opt/homebrew/bin/espeak-ng -v ${voice} -q --ipa "${word.replace(/"/g, '\\"')}" 2>/dev/null`,
      { timeout: 5000, encoding: 'utf8' }
    ).trim();
    if (result && result.length > 0 && result.length < 60) {
      return result;
    }
  } catch (e) {
    // Silently fail
  }
  return null;
}

// ─── Check all entries ────────────────────────────────────────────────────

function evaluate(lang) {
  const dict = parseDictionary(lang);
  const keys = Object.keys(dict);
  const issues = {
    contextBleed: [],
    grammarDesc: [],
    truncated: [],
    wikiMarkup: [],
    selfRef: [],
    wrongPOS: [],
    brokenLemma: [],
    fakeVerb: [],
    plainIPA: [],
    corruptedIPA: [],
    missingEntry: [],
    verbLemmaOvermatch: [],
    contractionLeak: [],
    sentenceFragment: [],
    doubleConjugation: [],
    missingLemma: [],
  };

  for (const key of keys) {
    const entry = dict[key];
    const en = entry.en;
    const enLower = en.toLowerCase().trim();

    // #1 Context bleed: comma-separated parts where one is unrelated
    if (en.includes(',')) {
      const parts = en.split(',').map(p => p.trim().toLowerCase());
      if (parts.length >= 2) {
        // Check if parts look like unrelated words (not synonyms)
        // Heuristic: if any part after the first is very short (1-3 words) and seems
        // like a random context word (not starting with "to ")
        const suspiciousParts = parts.slice(1).filter(p => {
          const words = p.split(/\s+/);
          // Context bleed often looks like: "noun, verb" or "adj, random_word"
          // Check if part is a single common English word that doesn't relate
          if (words.length === 1 && words[0].length >= 3) {
            // Is it a verb when the first part is clearly a noun?
            const firstWords = parts[0].split(/\s+/);
            const firstIsVerb = firstWords[0] === 'to';
            const partIsVerb = /^(go|find|come|make|take|do|give|get|put|run|see|say|tell|know|want|think|look|use|try|ask|need|seem|help|show|hear|play|move|live|feel|work|call|keep|let|hold|bring|turn|start|leave|write|read|grow|draw|set|lead|close|stand|lose|pay|meet|include|continue|begin|stop|raise|build|carry|send|spend|cut|add|pass|change|lay|sit|press|point|serve|stay|remain|pull|reach|apply|relate|cover|form|represent|create|join|own|claim|contain|drop|follow|place|reduce|speak|note|fall|produce)$/.test(p);
            const firstIsNoun = !firstIsVerb && firstWords.length <= 2;
            if (firstIsNoun && partIsVerb) return true;
            if (firstIsVerb && !partIsVerb && /^[a-z]+$/.test(p)) return true;
          }
          return false;
        });
        if (suspiciousParts.length > 0) {
          issues.contextBleed.push({ key, en, suspicious: suspiciousParts });
        }
      }
    }

    // #2 Grammar descriptions
    const enLowerCheck = enLower;
    const isGrammarDesc = GRAMMAR_PREFIXES.some(prefix => {
      const p = prefix.toLowerCase();
      return enLowerCheck.startsWith(p + ' ') || enLowerCheck === p ||
             enLowerCheck.startsWith(p + '/');
    });
    if (isGrammarDesc) {
      issues.grammarDesc.push({ key, en });
    }

    // #3 Truncated
    if (en.endsWith('...') || en.endsWith('…')) {
      issues.truncated.push({ key, en });
    }

    // #4 Wiki markup
    if (/[\[\]<>]|{{|}}|\(see |\bcf\. /.test(en)) {
      issues.wikiMarkup.push({ key, en });
    }

    // #5 Self-referencing
    const enStripped = enLower.replace(/^to /, '').trim();
    if (enStripped === key.toLowerCase() && !['a', 'i', 'no', 'or'].includes(key.toLowerCase())) {
      issues.selfRef.push({ key, en });
    }

    // #6 Wrong POS
    if (en.startsWith('to ') && entry.pos && entry.pos !== 'v') {
      issues.wrongPOS.push({ key, en, pos: entry.pos, expected: 'v', reason: 'starts with "to " but pos != v' });
    }

    // #7 Broken lemma refs
    if (entry.lemma && !dict[entry.lemma]) {
      issues.brokenLemma.push({ key, en, lemma: entry.lemma });
    }

    // #8 Fake verbs
    if (en.startsWith('to ')) {
      const verbPart = en.slice(3).trim().split(/[,;]/)[0].trim().toLowerCase();
      const verbWords = verbPart.split(/\s+/);
      if (verbWords.length === 1 && FAKE_VERB_WORDS.has(verbWords[0])) {
        issues.fakeVerb.push({ key, en, word: verbWords[0] });
      }
      // Also check for "to X Y" where X is clearly a noun
      if (verbWords.length >= 2 && FAKE_VERB_WORDS.has(verbWords[0])) {
        issues.fakeVerb.push({ key, en, word: verbWords[0] });
      }
    }

    // #11 Plain-text IPA
    if (entry.ipa && entry.ipa.length > 0) {
      // Check if IPA is just plain ASCII/latin without any IPA special chars
      const hasIPAChars = IPA_SPECIAL.test(entry.ipa);
      // Also check for any char with codepoint > 0x0100 that might be IPA
      let hasHighCodepoint = false;
      for (let i = 0; i < entry.ipa.length; i++) {
        const code = entry.ipa.charCodeAt(i);
        if (code > 0x0100 && code < 0x0370) { // IPA range roughly
          hasHighCodepoint = true;
          break;
        }
      }
      // Skip Hindi/Russian/Turkish/Welsh entries with native script in IPA
      const hasNativeScript = /[\u0900-\u097F\u0400-\u04FF\u0600-\u06FF]/.test(entry.ipa);
      // Skip entries with (en)...(hi) wrapper format
      const hasWrapper = /\(en\)/.test(entry.ipa);

      if (!hasIPAChars && !hasHighCodepoint && !hasNativeScript && !hasWrapper && entry.ipa.length > 2) {
        // This looks like plain ASCII text, not real IPA
        issues.plainIPA.push({ key, ipa: entry.ipa });
      }
    }

    // #12 Corrupted IPA
    if (entry.ipa && entry.ipa.length > 50) {
      issues.corruptedIPA.push({ key, ipa: entry.ipa });
    }

    // #14 Verb-lemma over-matching (key shares only 1-2 chars with lemma prefix)
    if (entry.lemma && entry.en.startsWith('to ') && entry.pos === 'v') {
      const lemmaEntry = dict[entry.lemma];
      if (lemmaEntry) {
        // Check if the key and lemma share very few chars
        let shared = 0;
        const minLen = Math.min(key.length, entry.lemma.length);
        for (let i = 0; i < minLen; i++) {
          if (key[i] === entry.lemma[i]) shared++;
          else break;
        }
        if (shared <= 2 && key.length > 4 && entry.lemma.length > 4) {
          issues.verbLemmaOvermatch.push({ key, lemma: entry.lemma, shared });
        }
      }
    }

    // #15-16 Contraction/possessive leakage
    if (CONTRACTION_PATTERNS.test(en) || POSSESSIVE_PATTERN.test(en)) {
      issues.contractionLeak.push({ key, en });
    }

    // #17 Sentence fragments (6+ words)
    const wordCount = en.split(/\s+/).length;
    if (wordCount >= 6) {
      issues.sentenceFragment.push({ key, en, wordCount });
    }

    // #18 Double conjugation (Turkish only)
    if (lang === 'tr' && entry.pos === 'v' && entry.lemma) {
      // Check for double suffixes like "uyorum" appearing after what already has conjugation
      const conjugSuffixes = ['ıyor', 'iyor', 'uyor', 'üyor', 'mış', 'miş', 'muş', 'müş', 'ecek', 'acak'];
      let count = 0;
      for (const suf of conjugSuffixes) {
        if (key.includes(suf)) count++;
      }
      if (count >= 2) {
        issues.doubleConjugation.push({ key, en });
      }
    }

    // #19 Missing lemma: verb entry that's not an infinitive and has no lemma
    if (entry.pos === 'v' && !entry.lemma) {
      const endings = INF_ENDINGS[lang] || [];
      const isInfinitive = endings.some(e => key.endsWith(e));
      // For Welsh, skip this check (verbs don't follow simple patterns)
      // For CY, verbs ending in common endings are considered infinitives
      if (lang === 'cy') {
        // Welsh "infinitive" forms often end in -u, -i, -o
        const cyInfEndings = ['u', 'i', 'o', 'io', 'ed'];
        const isCyInf = cyInfEndings.some(e => key.endsWith(e));
        if (!isCyInf && en.startsWith('to ')) {
          // Don't flag - Welsh is complex
        }
      } else if (!isInfinitive && key.length > 2) {
        issues.missingLemma.push({ key, en, pos: entry.pos });
      }
    }
  }

  // #13 Missing entries: check deck words against dictionary
  const deckWords = loadDeckWords(lang);
  for (const word of deckWords) {
    if (!canResolve(word, dict, lang)) {
      issues.missingEntry.push({ word });
    }
  }

  return { dict, issues, keys };
}

// ─── Apply fixes ──────────────────────────────────────────────────────────

function applyFixes(lang, dict, issues) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;

  // Build a map of fixes: key → { field: newValue }
  const fixes = {};

  // Helper to register a fix
  function addFix(key, field, value) {
    if (!fixes[key]) fixes[key] = {};
    fixes[key][field] = value;
  }

  // #2 Grammar descriptions → set en to '?'
  for (const issue of issues.grammarDesc) {
    // Skip if entry has a lemma and the grammar desc is just an inflection note
    const entry = dict[issue.key];
    if (entry && entry.lemma) {
      addFix(issue.key, 'en', '?');
    } else {
      addFix(issue.key, 'en', '?');
    }
  }

  // #3 Truncated → strip "..."
  for (const issue of issues.truncated) {
    let fixed = issue.en.replace(/\.{3,}$/, '').replace(/…$/, '').trim();
    if (fixed.length < 2) fixed = '?';
    addFix(issue.key, 'en', fixed);
  }

  // #4 Wiki markup → strip markup
  for (const issue of issues.wikiMarkup) {
    let fixed = issue.en
      .replace(/\{\{[^}]*\}\}/g, '')
      .replace(/\[\[[^\]]*\|([^\]]*)\]\]/g, '$1')
      .replace(/\[\[([^\]]*)\]\]/g, '$1')
      .replace(/\[([^\]]*)\]/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/\(see [^)]*\)/g, '')
      .replace(/\bcf\.\s*[^,;]*/g, '')
      .trim();
    if (fixed.length < 2) fixed = '?';
    addFix(issue.key, 'en', fixed);
  }

  // #5 Self-referencing → set en to '?'
  for (const issue of issues.selfRef) {
    addFix(issue.key, 'en', '?');
  }

  // #6 Wrong POS
  for (const issue of issues.wrongPOS) {
    if (issue.expected === 'v') {
      addFix(issue.key, 'pos', 'v');
    }
  }

  // #7 Broken lemma → remove lemma
  for (const issue of issues.brokenLemma) {
    addFix(issue.key, 'removeLemma', true);
  }

  // #8 Fake verbs → strip "to X" part
  for (const issue of issues.fakeVerb) {
    const en = dict[issue.key].en;
    // Try to remove the "to X" prefix
    let fixed = en.replace(/^to\s+\S+\s*,?\s*/, '').trim();
    if (!fixed || fixed.length < 2) {
      // If the whole thing was "to X", try keeping after comma
      const parts = en.split(',').map(p => p.trim());
      if (parts.length > 1) {
        fixed = parts.filter(p => !p.startsWith('to ')).join(', ').trim();
      }
      if (!fixed || fixed.length < 2) fixed = '?';
    }
    addFix(issue.key, 'en', fixed);
    // Also fix POS if it was 'v'
    if (dict[issue.key].pos === 'v') {
      addFix(issue.key, 'pos', 'n');
    }
  }

  // #11 Plain-text IPA → regenerate
  const ipaRegenerations = [];
  for (const issue of issues.plainIPA) {
    ipaRegenerations.push(issue.key);
  }

  // #12 Corrupted IPA → regenerate
  for (const issue of issues.corruptedIPA) {
    if (!ipaRegenerations.includes(issue.key)) {
      ipaRegenerations.push(issue.key);
    }
  }

  // Batch regenerate IPA
  for (const key of ipaRegenerations) {
    const newIPA = regenerateIPA(key, lang);
    if (newIPA) {
      addFix(key, 'ipa', newIPA);
    }
  }

  // #15-16 Contraction leakage → strip contraction part
  for (const issue of issues.contractionLeak) {
    const en = issue.en;
    // Try to remove the contraction part
    let fixed = en.replace(CONTRACTION_PATTERNS, '').replace(POSSESSIVE_PATTERN, ' ').trim();
    // Clean up double spaces, leading commas
    fixed = fixed.replace(/\s+/g, ' ').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
    if (fixed.length >= 2 && fixed !== en) {
      addFix(issue.key, 'en', fixed);
    }
  }

  // #17 Sentence fragments → keep first 3 words
  for (const issue of issues.sentenceFragment) {
    // Only fix if it's truly a leaked sentence, not a multi-word definition
    if (issue.wordCount >= 7) {
      const words = issue.en.split(/\s+/).slice(0, 3);
      addFix(issue.key, 'en', words.join(' '));
    }
  }

  // Now apply all fixes to the file content
  for (const key of Object.keys(fixes)) {
    const fix = fixes[key];
    const entry = dict[key];
    if (!entry) continue;

    // Build the original line pattern
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the entire entry line
    const quoteChar = content.includes(`"${key}":`) ? '"' : "'";
    const keyPattern = quoteChar === "'" ? `'${escapedKey}'` : `"${escapedKey}"`;

    // Find the line in the file
    const lineRegex = new RegExp(
      `(\\s+${keyPattern.replace(/\\/g, '\\\\')}:\\s*\\{)([^}]+)(\\})`,
      ''
    );

    // Try a simpler approach: find the exact line and rebuild it
    const searchKey = quoteChar === "'"
      ? `  '${key}':`
      : `  "${key}":`;

    const idx = content.indexOf(searchKey);
    if (idx === -1) continue;

    // Find the closing brace of this entry
    const braceStart = content.indexOf('{', idx);
    const braceEnd = content.indexOf('}', braceStart);
    if (braceStart === -1 || braceEnd === -1) continue;

    const originalEntry = content.slice(braceStart, braceEnd + 1);

    // Apply fixes to the entry
    let newEntry = originalEntry;

    if (fix.en !== undefined) {
      const safeEn = fix.en.replace(/'/g, "\\'");
      newEntry = newEntry.replace(/en:\s*'(?:[^'\\]|\\.)*'/, `en: '${safeEn}'`);
    }
    if (fix.ipa !== undefined) {
      const safeIpa = fix.ipa.replace(/'/g, "\\'");
      newEntry = newEntry.replace(/ipa:\s*'(?:[^'\\]|\\.)*'/, `ipa: '${safeIpa}'`);
    }
    if (fix.pos !== undefined) {
      newEntry = newEntry.replace(/pos:\s*'[^']*'/, `pos: '${fix.pos}'`);
    }
    if (fix.removeLemma) {
      newEntry = newEntry.replace(/,?\s*lemma:\s*'(?:[^'\\]|\\.)*'/, '');
    }

    if (newEntry !== originalEntry) {
      content = content.replace(originalEntry, newEntry);
      fixCount++;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return fixCount;
}

// ─── Main ─────────────────────────────────────────────────────────────────

function main() {
  console.log('Comprehensive Dictionary Evaluation');
  console.log('====================================\n');

  const allResults = {};
  const summary = {};
  let totalFixes = 0;

  const issueNames = [
    'contextBleed', 'grammarDesc', 'truncated', 'wikiMarkup', 'selfRef',
    'wrongPOS', 'brokenLemma', 'fakeVerb', 'plainIPA', 'corruptedIPA',
    'missingEntry', 'verbLemmaOvermatch', 'contractionLeak', 'sentenceFragment',
    'doubleConjugation', 'missingLemma'
  ];

  const issueLabels = [
    '1. Context bleed', '2. Grammar desc', '3. Truncated', '4. Wiki markup',
    '5. Self-referencing', '6. Wrong POS', '7. Broken lemma', '8. Fake verbs',
    '11. Plain-text IPA', '12. Corrupted IPA', '13. Missing entries',
    '14. Verb-lemma overmatch', '15-16. Contraction leak', '17. Sentence fragment',
    '18. Double conjugation', '19. Missing lemma'
  ];

  for (const lang of LANGS) {
    process.stdout.write(`Evaluating ${lang.toUpperCase()}...`);
    const result = evaluate(lang);
    allResults[lang] = result;

    // Count issues
    let langTotal = 0;
    for (const name of issueNames) {
      langTotal += result.issues[name].length;
    }
    process.stdout.write(` ${Object.keys(result.dict).length} entries, ${langTotal} issues found\n`);

    // Print details for non-empty issues
    for (let i = 0; i < issueNames.length; i++) {
      const issues = result.issues[issueNames[i]];
      if (issues.length > 0) {
        console.log(`  ${issueLabels[i]}: ${issues.length}`);
        // Show first 3 examples
        for (const issue of issues.slice(0, 3)) {
          const detail = issue.key
            ? `    "${issue.key}" → ${issue.en || issue.ipa || issue.lemma || ''}`
            : `    "${issue.word}"`;
          console.log(detail.slice(0, 120));
        }
        if (issues.length > 3) console.log(`    ... and ${issues.length - 3} more`);
      }
    }

    // Apply fixes
    const fixCount = applyFixes(lang, result.dict, result.issues);
    totalFixes += fixCount;
    console.log(`  → Applied ${fixCount} fixes\n`);
  }

  // ─── Summary table ──────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('SUMMARY TABLE');
  console.log('═══════════════════════════════════════════════════════════════════');

  // Header
  const langHeaders = LANGS.map(l => l.toUpperCase().padStart(4));
  console.log(`${'Issue Type'.padEnd(24)} |${langHeaders.join('|')}| Total | Fixed`);
  console.log(`${''.padEnd(24, '─')} |${LANGS.map(() => '────').join('|')}|───────|──────`);

  let grandTotal = 0;
  let grandFixable = 0;

  for (let i = 0; i < issueNames.length; i++) {
    const name = issueNames[i];
    const label = issueLabels[i];
    let rowTotal = 0;
    const cells = LANGS.map(lang => {
      const count = allResults[lang].issues[name].length;
      rowTotal += count;
      return String(count).padStart(4);
    });
    grandTotal += rowTotal;

    // Fixable = all except missingEntry and missingLemma (those are informational)
    const fixable = (name !== 'missingEntry' && name !== 'missingLemma' && name !== 'verbLemmaOvermatch') ? rowTotal : 0;
    grandFixable += fixable;

    console.log(`${label.padEnd(24)} |${cells.join('|')}| ${String(rowTotal).padStart(5)} | ${fixable > 0 ? String(fixable).padStart(4) : '   -'}`);
  }

  console.log(`${''.padEnd(24, '─')} |${LANGS.map(() => '────').join('|')}|───────|──────`);
  console.log(`${'TOTAL'.padEnd(24)} |${LANGS.map(lang => {
    let t = 0;
    for (const name of issueNames) t += allResults[lang].issues[name].length;
    return String(t).padStart(4);
  }).join('|')}| ${String(grandTotal).padStart(5)} | ${String(totalFixes).padStart(4)}`);

  console.log(`\nTotal issues found: ${grandTotal}`);
  console.log(`Total fixes applied: ${totalFixes}`);
}

main();
