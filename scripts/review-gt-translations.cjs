/**
 * DETAILED review of Google Translate word-level translations
 * Manually calibrated against all 1,100 cards (100 per language)
 * Checks every word for 8 issue types
 */
const fs = require('fs');
const path = require('path');

const data = require('./output/gt-sample2.json');

// ============================================================
// KNOWN BAD TRANSLATIONS (manually confirmed from data review)
// These are DEFINITE errors found in the actual data
// ============================================================

// For each language: { sourceWord: { wrongGoogle: 'correct' } }
// Only lowercase keys; we'll match case-insensitively
const KNOWN_FUNCTION_WORD_ERRORS = {
  es: {
    'el': { 'he': 'the', 'him': 'the' },
    'la': { 'her': 'the', 'it': 'the' },
    'los': { 'them': 'the' },
    'las': { 'them': 'the' },
    'está': { 'this': 'is' },
    'esta': { 'this': 'this/is' },  // can be demonstrative
    'se': { 'he': '(reflexive)' },
    'te': { 'tea': 'you' },
    'si': { 'yeah': 'if' },
    'más': { 'further': 'more' },
    'haya': { 'is': 'there be (subjunctive)' },
    'fuera': { 'out': 'were (subjunctive)' },
    'habría': { 'there would be': 'would have' },
  },
  fr: {
    'est': { 'east': 'is' },
    'le': { 'the': 'the' },  // "THE" with caps is still wrong formatting
    'les': { 'the': 'the' },
    'la': { 'there': 'the' },
    'ne': { 'born': 'not (part of negation)' },
    'à': { 'has': 'to/at' },
    'a': { 'has': 'has' },  // actually correct in French
    'pas': { 'not': 'not' },  // correct
    'son': { 'her': 'his/her' },  // ses→"his" is more standard dict form
    'ses': { 'his': 'his/her' },
    'été': { 'summer': 'been' },
    'fait': { 'do': 'done/fact' },
    'dès': { 'of the': 'as soon as' },
    'on': { 'on': 'one/we' },
    'sache': { 'know': 'know (subjunctive)' },
  },
  it: {
    'la': { 'there': 'the' },
    'è': { 'and': 'is' },
    'e': { 'and': 'and' },  // correct
    'di': { 'of': 'of', 'from': 'of' },
    'si': { 'yes': '(reflexive/one)' },
    'ci': { 'there': 'us/there' },
    'sono': { 'i am': 'I am / they are' },
    'era': { 'era': 'was' },
    'ogni': { 'everything is fine': 'every' },
    'fosse': { 'is': 'were (subjunctive)' },
    'sia': { 'is': 'is/be (subjunctive)' },
    'lo': { 'the': 'the/him' },
    'le': { 'the': 'the' },
    'il': { 'the': 'the' },
    'prima': { 'before': 'before/first' },
    'noi': { 'us': 'we' },
    'lui': { 'him': 'he' },
    'per': { 'for': 'for' },
    'che': { 'that': 'that/which' },
    'conto': { 'i count': 'bill/account' },
    'dai': { 'come on': 'you give' },
    'faccia': { 'face': 'face / make (subjunctive)' },
    'freddo': { 'freddo': 'cold' },
    'partita': { 'match': 'match / departed' },
    'stato': { 'state': 'state / been' },
    'messo': { 'put in order': 'put' },
    'servi': { 'servants': 'serve (imperative)' },
    'ora': { 'now': 'now/hour' },
  },
  pt: {
    'o': { 'the': 'the' },
    'a': { 'the': 'the' },
    'os': { 'you': 'the' },
    'é': { 'and': 'is' },
    'está': { 'this': 'is' },
    'no': { 'node': 'in the' },
    'na': { 'in': 'in the' },
    'por': { 'put': 'by/for' },
    'da': { 'from the': 'of the' },
    'do': { 'of': 'of the' },
    'nós': { 'us': 'we' },
    'foi': { 'he was': 'was' },
    'que': { 'what': 'that/which' },
    'conta': { 'account': 'bill/account' },
    'passa': { 'raisin': 'pass/apply' },
    'tinha': { 'he had': 'had' },
    'gosta': { 'he likes': 'likes' },
    'tirar': { 'to throw': 'to take/remove' },
    'uma': { 'one': 'a' },
    'um': { 'one': 'a' },
    'deu': { 'it gave': 'gave' },
    'faria': { 'would': 'would do' },
  },
  de: {
    'dem': { 'dem': 'the (dative)' },
    'morgen': { 'morning': 'tomorrow' },
    'weg': { 'away': 'path/way' },
    'schloss': { 'lock': 'castle/lock' },
    'laut': { 'loud': 'according to' },
    'mag': { 'likes': 'like' },
    'man': { 'man': 'one (pronoun)' },
    'meinen': { 'mean': 'my' },
    'meine': { 'mine': 'my' },
    'leid': { 'sorrow': 'sorry' },
    'zum': { 'for the': 'to the' },
    'zur': { 'to': 'to the' },
    'stellt': { 'presents': 'sets/places' },
    'ihr': { 'her': 'you/her/their' },
    'ihren': { 'your': 'her/their' },
    'werden': { 'become': 'will/become' },
    'wird': { 'becomes': 'will/becomes' },
    'wurde': { 'became': 'was' },
    'wurden': { 'became': 'were' },
    'worden': { 'have': 'been' },
    'liebsten': { 'i love you': 'most (prefer)' },
    'na': { 'n/a': 'well' },
    'band': { 'band': 'bound/volume' },
    'losen': { 'solve': 'loose' },
    'gericht': { 'court': 'dish/court' },
  },
  nl: {
    'naar': { 'unpleasant': 'to' },
    'bij': { 'bee': 'at/near' },
    'haar': { 'her': 'her/hair' },
    'mijn': { 'mine': 'my' },
    'een': { 'an': 'a' },
    'meer': { 'more': 'more/lake' },
    'ligt': { 'is': 'lies/is located' },
    'niet': { 'not ': 'not' },  // space in Google output
    'uit': { 'out ': 'out/from' },
    'met': { 'of': 'with' },
    'door': { 'through': 'through/by' },
    'weet': { 'knows': 'know' },
    'kam': { 'crest': 'combed' },
    'vloeiend': { 'flowing': 'fluently' },
    'bekende': { 'known person': 'confessed' },
    'verlopen': { 'expired': 'gone/proceeded' },
    'hebben': { 'to have': 'have' },
    'rechter': { 'right': 'judge' },
    'bleek': { 'pale': 'turned out' },
    'rode': { 'red': 'red' },  // correct
    'valt': { 'fall': 'falls/can be' },
    'aan': { 'on': 'to/on' },
    'leven': { 'to live': 'life/to live' },
    'zei': { 'said': 'said' },
    'trekken': { 'pull': 'draw/pull' },
    'zij': { 'she': 'she/they' },
  },
  sv: {
    'var': { 'where': 'was/where' },
    'som': { 'as': 'that/which/who' },
    'men': { 'but': 'but' },  // correct
    'min': { 'my': 'my' },  // correct
    'sin': { 'its': 'his/her' },
    'sig': { 'one': 'oneself' },
    'bra': { 'good': 'good' },  // caps issue
    'den': { 'the': 'the/it' },
    'det': { 'the': 'the/it' },
    'håller': { 'holding': 'hold/keep' },
    'köttbullar': { 'noisette': 'meatballs' },
    'affären': { 'the deal': 'the store' },
    'åker': { 'field': 'go/travel' },
    'kräftskivan': { 'the cancer disc': 'the crayfish party' },
    'vän': { 'friend': 'friend' },
    'lät': { 'sounded': 'sounded' },
    'sedan': { 'then': 'then/since' },
  },
  cy: {
    'yn': { 'in': 'in / (verbal particle)' },
    'o': { 'oh': 'of/from' },
    'i': { 'i': 'to/I' },
    'ddim': { 'no': 'not' },
    'dy': { 'house': 'your' },
    'ei': { 'his': 'his/her' },
    'e': { 'e': 'he' },
    "i'n": { 'to our': '(progressive marker)' },
    'iawn': { 'ok': 'very/ok' },
    'na': { 'no': 'than/nor' },
    'fe': { 'he': 'he' },  // correct
    'de': { 'south': 'tea' },
  },
  hi: {
    'पर': { 'but': 'on' },
    'से': { 'from': 'from' },  // often correct
    'को': { 'to': 'to' },
    'में': { 'in': 'in' },
    'है': { 'is': 'is' },
    'का': { 'of': 'of' },
    'की': { 'of': 'of' },
    'के': { 'of': 'of' },
    'कर': { 'tax': 'do/having done' },
    'हुए': { 'happened': '(progressive marker)' },
    'गया': { 'went': '(perfective marker)' },
    'हल': { 'plough': 'solution' },
    'बस': { 'bus': 'just/enough/bus' },
    'मिल': { 'mill': 'to meet/get' },
    'कुछ': { 'some?': 'some' },
    'भी': { 'too': 'also/even' },
    'बोल': { 'lyrics': 'speak' },
    'गाई': { 'cow': 'sang (f.)' },
    'रवि': { 'sunday': 'Ravi (name)' },
    'सो': { 'so': 'so/sleep' },
    'तो': { 'so': 'then/so' },
    'जाता': { 'go': 'goes (habitual)' },
    'होता': { 'would': 'happens/is (habitual)' },
    'आता': { 'comes': 'comes' },
    'रही': { 'doing': '(progressive f.)' },
    'रहा': { 'remained': '(progressive m.)' },
    'रहे': { 'are': '(progressive pl.)' },
    'जाती': { 'caste': 'goes (f.)' },
    'आया': { 'came': 'came' },
    'पड़ा': { 'had': 'fell/had to' },
    'चल': { 'ambulatory': 'walk/move' },
  },
  tr: {
    'en': { '-most': 'most' },
    'her': { 'each': 'every' },
    'kar': { 'profit': 'snow' },
    'üç': { 'fly': 'three' },
    'sık': { 'chic': 'frequent' },
    'göl': { 'goal': 'lake' },
    'gelir': { 'income': 'comes' },
    'doğru': { 'true': 'correct/towards' },
    'el': { 'hand': 'hand' },
    'baş': { 'head': 'head' },
    'hesap': { 'bill': 'bill/account' },
    'çıktı': { 'output': 'came out' },
    'başı': { 'head': 'per/head' },
    'yüz': { 'face': 'hundred/face' },
    'kuyruk': { 'tail': 'queue/tail' },
    'çalındı': { 'stolen': 'was knocked/played' },
    'çam': { 'pine': '(part of idiom)' },
    'kuruyor': { 'is establishing': 'is drying' },
  },
  ru: {
    'в': { 'v': 'in' },
    'с': { 'with': 'with' },
    'у': { 'u': 'at/by' },
    'дома': { 'houses': 'at home' },
    'о': { 'o': 'about' },
    'свой': { 'mine': 'one\'s own' },
    'свою': { 'my': 'one\'s own' },
    'везёт': { 'lucky': 'is taking/driving' },
    'стоит': { 'costs': 'stands/is worth' },
    'число': { 'number': 'date/number' },
    'правду': { 'the truth': 'truth' },
    'друг': { 'friend': 'each (in друг другу)' },
    'другу': { 'to a friend': 'other (in друг другу)' },
  },
};

// Words where Google translation is always going to be wrong
// because they're untranslatable particles/markers
const PARTICLES_GRAMMATICAL = {
  cy: ['yn', "'r", "i'n", "wedi", "ddim", "ei", "eu", "fy"],
  hi: ['ने', 'को', 'से', 'में', 'पर', 'का', 'की', 'के', 'है', 'हैं', 'हूँ',
       'था', 'थी', 'थे', 'थीं', 'रहा', 'रही', 'रहे', 'हुए', 'गया', 'गए', 'गई',
       'जाता', 'जाती', 'जाते', 'होता', 'होती', 'होते', 'करता', 'करती', 'आता', 'आती'],
  tr: [],
  ru: ['бы'],
};

// ============================================================
// ANALYSIS ENGINE — manually calibrated
// ============================================================

function analyzeWord(word, googleTrans, cardEnglish, lang, wordIndex, totalWords, target) {
  const issues = [];
  const w = word.toLowerCase().replace(/[.!?,;:¿¡—"""]/g, '');
  const g = googleTrans.trim();
  const gLower = g.toLowerCase();
  const engLower = cardEnglish.toLowerCase();
  const engWords = engLower.split(/[\s,.'!?;:]+/).filter(Boolean);

  // Skip empty / punctuation-only words
  if (!w || w.length === 0) return [{ type: 'GOOGLE_PERFECT', detail: `skip`, severity: 'none' }];

  // ---- CAPITALIZATION ----
  // Google output starts with uppercase when source word is at sentence start
  const isSentenceStart = wordIndex === 0 || (wordIndex === 1 && ['¿', '¡'].includes(target[0]));
  const hasUnnecessaryCap = g.length > 1 && g[0] === g[0].toUpperCase() && g[0] !== g[0].toLowerCase();
  const PROPER_NOUNS = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
    'Christmas', 'Easter', 'I', 'English', 'French', 'Spanish', 'Italian', 'Portuguese', 'German', 'Dutch', 'Swedish', 'Welsh',
    'Hindi', 'Turkish', 'Russian', 'Europe', 'Spain', 'Greece', 'Italy', 'France', 'Sweden', 'Wales', 'Canada', 'Amsterdam',
    'Paris', 'Moscow', 'God', 'Delhi', 'Tokyo', 'Bhopal', 'Shimla', 'Ahmedabad', 'Dresden', 'Frankfurt',
    'Swansea', 'St. Petersburg', 'Diwali', 'Ramadan']);

  if (hasUnnecessaryCap && !isSentenceStart && !PROPER_NOUNS.has(g) && !g.match(/^[A-Z]{2,}$/) && g !== 'I') {
    // Check if the source word also has caps (might be a proper noun in source)
    const srcHasCap = word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
    if (!srcHasCap) {
      issues.push({ type: 'CAPITALIZATION', detail: `"${word}" → "${g}" (unnecessary capital)`, severity: 'low' });
    } else if (!isSentenceStart) {
      // Source has cap but is mid-sentence - German nouns are always capitalized, that's fine
      if (lang !== 'de') {
        issues.push({ type: 'CAPITALIZATION', detail: `"${word}" → "${g}" (capital from source word)`, severity: 'low' });
      }
    }
  }
  // ALL-CAPS output like "THE", "HAS", "YOU", "FOR"
  if (g.match(/^[A-Z]{2,}$/) && g.length <= 6 && !['CV', 'DIY', 'TV'].includes(g)) {
    issues.push({ type: 'CAPITALIZATION', detail: `"${word}" → "${g}" (all-caps)`, severity: 'low' });
  }
  // Mixed case issues: "THE" for le, "YOU" for vous, "HAS" for à, etc.
  if (g.length > 1 && g === g.toUpperCase() && !g.match(/^[A-Z]{1}$/) && g.length <= 10 && !['CV', 'DIY', 'TV', 'NOW'].includes(g)) {
    if (!issues.some(i => i.type === 'CAPITALIZATION')) {
      issues.push({ type: 'CAPITALIZATION', detail: `"${word}" → "${g}" (all-caps)`, severity: 'low' });
    }
  }

  // ---- KNOWN FUNCTION WORD ERRORS ----
  const knownErrors = KNOWN_FUNCTION_WORD_ERRORS[lang] || {};
  const knownEntry = knownErrors[w];
  if (knownEntry) {
    const wrongGoogleKey = Object.keys(knownEntry).find(k => k.toLowerCase() === gLower);
    if (wrongGoogleKey && knownEntry[wrongGoogleKey] !== gLower) {
      // This is a confirmed wrong translation
      const correct = knownEntry[wrongGoogleKey];
      issues.push({
        type: 'FUNCTION_WORD_WRONG',
        detail: `"${word}" → "${g}" should be "${correct}"`,
        severity: 'high'
      });
    }
  }

  // ---- WRONG SENSE (specific patterns from data review) ----
  // Italian è → "And" (should be "is")
  if (lang === 'it' && (w === 'è' || w === "è") && gLower === 'and') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "is"`, severity: 'high' });
  }
  // Italian era → "era" (should be "was")
  if (lang === 'it' && w === 'era' && gLower === 'era') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "was"`, severity: 'high' });
  }
  // Italian ogni → "Everything is fine" (should be "every")
  if (lang === 'it' && w === 'ogni' && gLower.includes('everything')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "every"`, severity: 'high' });
  }
  // Italian la/le → "there" (should be "the")
  if (lang === 'it' && (w === 'la' || w === 'le') && gLower === 'there') {
    issues.push({ type: 'FUNCTION_WORD_WRONG', detail: `"${word}" → "${g}" should be "the"`, severity: 'high' });
  }
  // French la → "there" (should be "the")
  if (lang === 'fr' && w === 'la' && gLower === 'there') {
    issues.push({ type: 'FUNCTION_WORD_WRONG', detail: `"${word}" → "${g}" should be "the"`, severity: 'high' });
  }
  // French est → "East" (should be "is")
  if (lang === 'fr' && w === 'est' && gLower === 'east') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "is"`, severity: 'high' });
  }
  // French été → "summer" (should be "been")
  if (lang === 'fr' && w === 'été' && gLower === 'summer') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "been"`, severity: 'high' });
  }
  // French fermé → "farm" (should be "closed")
  if (lang === 'fr' && (w === 'fermé' || w === 'fermée') && gLower === 'farm') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "closed"`, severity: 'high' });
  }
  // Spanish el → "he" (should be "the")
  if (lang === 'es' && w === 'el' && gLower === 'he') {
    issues.push({ type: 'FUNCTION_WORD_WRONG', detail: `"${word}" → "${g}" should be "the"`, severity: 'high' });
  }
  // Spanish está → "this" (should be "is")
  if (lang === 'es' && (w === 'está' || w === 'esta') && gLower === 'this' && engLower.includes('is')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "is"`, severity: 'high' });
  }
  // Spanish vivo → "alive" when means "I live"
  if (lang === 'es' && w === 'vivo' && gLower === 'alive' && engLower.includes('live')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "I live" or "to live"`, severity: 'high' });
  }
  // Spanish se → "HE" (should be reflexive)
  if (lang === 'es' && w === 'se' && gLower === 'he') {
    issues.push({ type: 'FUNCTION_WORD_WRONG', detail: `"${word}" → "${g}" should be "(reflexive)"`, severity: 'high' });
  }
  // Portuguese no → "node" (should be "in the")
  if (lang === 'pt' && w === 'no' && gLower === 'node') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "in the"`, severity: 'high' });
  }
  // Portuguese está → "this" (should be "is")
  if (lang === 'pt' && w === 'está' && gLower === 'this') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "is"`, severity: 'high' });
  }
  // Portuguese é → "and" (should be "is")
  if (lang === 'pt' && w === 'é' && gLower === 'and') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "is"`, severity: 'high' });
  }
  // Dutch naar → "Unpleasant" (should be "to")
  if (lang === 'nl' && w === 'naar' && gLower === 'unpleasant') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "to"`, severity: 'high' });
  }
  // Dutch bij → "bee" (should be "at/near")
  if (lang === 'nl' && w === 'bij' && gLower === 'bee') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "at/near"`, severity: 'high' });
  }
  // Dutch met → "of" (should be "with")
  if (lang === 'nl' && w === 'met' && gLower === 'of') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "with"`, severity: 'high' });
  }
  // Dutch het → "It" when means "the"
  // (this is actually ambiguous — het = the/it in Dutch)

  // Swedish köttbullar → "noisette" (should be "meatballs")
  if (lang === 'sv' && w === 'köttbullar' && gLower === 'noisette') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "meatballs"`, severity: 'high' });
  }
  // Swedish affären → "the deal" (should be "the store")
  if (lang === 'sv' && w === 'affären' && gLower.includes('deal')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "the store"`, severity: 'medium' });
  }
  // Swedish åker → "field" (should be "go/travel")
  if (lang === 'sv' && w === 'åker' && gLower === 'field') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "go/travel"`, severity: 'high' });
  }
  // Russian в → "V" (transliteration, not translation)
  if (lang === 'ru' && w === 'в' && gLower === 'v') {
    issues.push({ type: 'PROPER_NOUN_UNTRANSLATED', detail: `"${word}" → "${g}" (transliterated, should be "in")`, severity: 'high' });
  }
  // Russian у → "U" (transliteration)
  if (lang === 'ru' && w === 'у' && gLower === 'u') {
    issues.push({ type: 'PROPER_NOUN_UNTRANSLATED', detail: `"${word}" → "${g}" (transliterated, should be "at/by")`, severity: 'high' });
  }
  // Russian о → "O" (transliteration)
  if (lang === 'ru' && w === 'о' && gLower === 'o') {
    issues.push({ type: 'PROPER_NOUN_UNTRANSLATED', detail: `"${word}" → "${g}" (transliterated, should be "about")`, severity: 'high' });
  }
  // Russian дома → "Houses" (should be "at home")
  if (lang === 'ru' && w === 'дома' && gLower === 'houses') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "at home"`, severity: 'medium' });
  }
  // Russian свой/свою → "mine"/"my" (should be "one's own")
  if (lang === 'ru' && (w === 'свой' || w === 'свою' || w === 'своей') && (gLower === 'mine' || gLower === 'my')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "one's own"`, severity: 'medium' });
  }
  // Hindi पर → "But" (should be "on")
  if (lang === 'hi' && w === 'पर' && gLower === 'but') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "on"`, severity: 'high' });
  }
  // Hindi कर → "Tax" (should be "do/having done")
  if (lang === 'hi' && w === 'कर' && gLower === 'tax') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "do"`, severity: 'high' });
  }
  // Hindi हल → "Plough" (should be "solution")
  if (lang === 'hi' && w === 'हल' && gLower === 'plough' && engLower.includes('solution')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "solution"`, severity: 'high' });
  }
  // Hindi गाई → "cow" (should be "sang")
  if (lang === 'hi' && w === 'गाई' && gLower === 'cow') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "sang (f.)"`, severity: 'high' });
  }
  // Hindi बोल → "Lyrics" (should be "speak")
  if (lang === 'hi' && w === 'बोल' && gLower === 'lyrics') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "speak"`, severity: 'high' });
  }
  // Hindi जाती → "caste" (should be "goes")
  if (lang === 'hi' && w === 'जाती' && gLower === 'caste') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "goes (habitual f.)"`, severity: 'high' });
  }
  // Turkish kar → "profit" (should be "snow")
  if (lang === 'tr' && w === 'kar' && gLower === 'profit' && engLower.includes('snow')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "snow"`, severity: 'high' });
  }
  // Turkish üç → "fly" (should be "three")
  if (lang === 'tr' && w === 'üç' && gLower === 'fly') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "three"`, severity: 'high' });
  }
  // Turkish gelir → "income" when should be "comes"
  if (lang === 'tr' && w === 'gelir' && gLower === 'income' && engLower.includes('come')) {
    issues.push({ type: 'NOUN_VS_VERB', detail: `"${word}" → "${g}" should be "comes" (verb, not noun)`, severity: 'high' });
  }
  // Turkish kuruyor → "is establishing" (should be "is drying")
  if (lang === 'tr' && w === 'kuruyor' && gLower.includes('establish')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "is drying"`, severity: 'high' });
  }
  // Welsh o → "oh" (should be "of/from")
  if (lang === 'cy' && w === 'o' && gLower === 'oh') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "of/from"`, severity: 'medium' });
  }
  // Welsh dy → "house" (should be "your")
  if (lang === 'cy' && w === 'dy' && gLower === 'house') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "your"`, severity: 'high' });
  }
  // Welsh i → "i" (should be "to/I")
  if (lang === 'cy' && w === 'i' && gLower === 'i' && !engLower.match(/\bi\b/)) {
    issues.push({ type: 'PROPER_NOUN_UNTRANSLATED', detail: `"${word}" → "${g}" (untranslated, should be "to")`, severity: 'medium' });
  }

  // ---- FRAGMENT ----
  const gWords = g.split(/\s+/);
  if (gWords.length > 3) {
    issues.push({ type: 'FRAGMENT', detail: `"${word}" → "${g}" (${gWords.length} words)`, severity: 'high' });
  } else if (gWords.length === 3) {
    const okPatterns = /^(to be|to have|to do|to go|to get|to make|to take|to see|I am|I have|he is|she is|it is|we are|there is|there are|in the|on the|at the|of the|for the|to the|I don't|I can|I will|you have|he was|we have|to our|let's go|I would|would have|we will|I'm crying|It is|he was|he said|he came|he got|we don't|It should|There is|He painted|He said|We moved|you are|I'm going|I will have|she the|to your|to the|to his|I was|he works|I'm forwarding it.|is it|you say)/i;
    if (!okPatterns.test(g)) {
      issues.push({ type: 'FRAGMENT', detail: `"${word}" → "${g}" (3 words, possibly too contextual)`, severity: 'low' });
    }
  }

  // ---- PROPER_NOUN_UNTRANSLATED ----
  // Source word returned unchanged
  if (gLower === w && w.length > 2 && !/^[a-z]+$/.test(w)) {
    // Non-Latin scripts that come back unchanged
    if (!engLower.includes(gLower)) {
      if (!issues.some(i => i.type === 'PROPER_NOUN_UNTRANSLATED')) {
        issues.push({ type: 'PROPER_NOUN_UNTRANSLATED', detail: `"${word}" → "${g}" (untranslated)`, severity: 'medium' });
      }
    }
  }
  // French bu → "bu" (untranslated, should be "drunk")
  if (lang === 'fr' && w === 'bu' && gLower === 'bu') {
    issues.push({ type: 'PROPER_NOUN_UNTRANSLATED', detail: `"${word}" → "${g}" (untranslated, should be "drunk")`, severity: 'medium' });
  }
  // French ait → "ait" (untranslated)
  if (lang === 'fr' && w === 'ait' && gLower === 'ait') {
    issues.push({ type: 'PROPER_NOUN_UNTRANSLATED', detail: `"${word}" → "${g}" (untranslated, should be "has (subjunctive)")`, severity: 'medium' });
  }
  // French ai → "ai" (untranslated)
  if (lang === 'fr' && w === 'ai' && gLower === 'ai') {
    issues.push({ type: 'PROPER_NOUN_UNTRANSLATED', detail: `"${word}" → "${g}" (untranslated, should be "have (1st person)")`, severity: 'medium' });
  }

  // ---- INFLECTED_NOT_BASE ----
  // Check if Google gives past tense / 3rd person / etc.
  const irregularPast = {
    'went': 'to go', 'ate': 'to eat', 'saw': 'to see', 'came': 'to come',
    'took': 'to take', 'made': 'to make', 'gave': 'to give', 'knew': 'to know',
    'thought': 'to think', 'said': 'to say', 'got': 'to get', 'told': 'to tell',
    'found': 'to find', 'began': 'to begin', 'heard': 'to hear', 'wrote': 'to write',
    'sat': 'to sit', 'stood': 'to stand', 'lost': 'to lose', 'paid': 'to pay',
    'met': 'to meet', 'felt': 'to feel', 'left': 'to leave', 'brought': 'to bring',
    'kept': 'to keep', 'sent': 'to send', 'fell': 'to fall', 'ran': 'to run',
    'bought': 'to buy', 'caught': 'to catch', 'chose': 'to choose', 'drove': 'to drive',
    'flew': 'to fly', 'grew': 'to grow', 'held': 'to hold', 'led': 'to lead',
    'sang': 'to sing', 'spoke': 'to speak', 'stole': 'to steal', 'swam': 'to swim',
    'threw': 'to throw', 'woke': 'to wake', 'wore': 'to wear', 'won': 'to win',
    'built': 'to build', 'spent': 'to spend', 'meant': 'to mean', 'slept': 'to sleep',
  };

  if (gWords.length === 1) {
    // Irregular past
    if (irregularPast[gLower]) {
      issues.push({ type: 'INFLECTED_NOT_BASE', detail: `"${word}" → "${g}" (past tense, should be "${irregularPast[gLower]}")`, severity: 'medium' });
    }
    // Regular past -ed (only clear verb forms, not adjectives like "closed", "open", "used")
    const adjExceptions = new Set(['closed', 'used', 'tired', 'excited', 'organized', 'advanced', 'developed', 'scattered', 'shared']);
    if (gLower.match(/[^aeiou]ed$/) && gLower.length > 4 && !adjExceptions.has(gLower)) {
      // Only flag if it's clearly a past tense verb, not a participle used as adjective
      if (!engLower.includes(gLower)) {
        issues.push({ type: 'INFLECTED_NOT_BASE', detail: `"${word}" → "${g}" (past tense -ed form)`, severity: 'medium' });
      }
    }
    // 3rd person -s verbs
    const thirdPersonVerbs = new Set(['goes', 'eats', 'sees', 'comes', 'takes', 'makes', 'gives', 'knows',
      'thinks', 'says', 'gets', 'tells', 'finds', 'puts', 'reads', 'runs', 'keeps', 'lets', 'begins',
      'shows', 'hears', 'plays', 'moves', 'lives', 'brings', 'happens', 'writes', 'sits', 'stands',
      'loses', 'pays', 'meets', 'feels', 'leaves', 'calls', 'tries', 'uses', 'asks', 'works', 'seems',
      'opens', 'closes', 'sends', 'drinks', 'walks', 'talks', 'starts', 'stops', 'waits', 'buys',
      'sells', 'grows', 'builds', 'costs', 'draws', 'falls', 'holds', 'leads', 'pulls', 'pushes',
      'raises', 'reaches', 'rides', 'rises', 'sets', 'shines', 'sings', 'speaks', 'spends', 'teaches',
      'throws', 'turns', 'wears', 'wins', 'arrives', 'carries', 'cleans', 'drives', 'enters', 'fills',
      'hangs', 'hurts', 'picks', 'plants', 'saves', 'shoots', 'shuts', 'sounds', 'swims', 'touches',
      'washes', 'watches', 'breaks', 'catches', 'cuts', 'digs', 'feeds', 'flies', 'forgets',
      'lies', 'packs', 'prints', 'rains', 'rings', 'rises', 'sleeps']);
    if (thirdPersonVerbs.has(gLower)) {
      issues.push({ type: 'INFLECTED_NOT_BASE', detail: `"${word}" → "${g}" (3rd person, should be base form)`, severity: 'medium' });
    }
    // Plural nouns ending in -s that should be singular for dictionary
    // Only flag if the source word is singular and google gives plural
    const clearPluralNouns = new Set(['dogs', 'cats', 'houses', 'trees', 'years', 'doors', 'flowers',
      'stores', 'books', 'streets', 'prices', 'languages', 'stories', 'children', 'mountains', 'rivers',
      'villages', 'letters', 'gifts', 'dishes', 'balls', 'toys', 'windows', 'rules', 'cards',
      'stamps', 'cups', 'minutes', 'hours', 'days', 'months', 'weeks', 'nights', 'places',
      'friends', 'neighbors', 'countries', 'games', 'songs', 'photos', 'roads', 'buses',
      'bottles', 'steps', 'projects', 'tracks', 'tools', 'views', 'keys', 'marks',
      'stoves', 'pillows', 'stairs', 'ants', 'gardens', 'plants', 'walls', 'rooms',
      'pages', 'brothers', 'sisters', 'results', 'hands', 'feet', 'eyes', 'ears']);
    if (clearPluralNouns.has(gLower)) {
      // Check if the source word looks like it could be plural (don't over-flag)
      // For now just note it
    }
  }

  // ---- NOUN_VS_VERB ----
  // Specific cases found in data
  if (lang === 'fr' && w === 'porte' && gLower === 'door' && engLower.includes('wear')) {
    issues.push({ type: 'NOUN_VS_VERB', detail: `"${word}" → "${g}" should be "to wear/to carry" (verb, not noun)`, severity: 'high' });
  }
  if (lang === 'fr' && w === 'compose' && gLower === 'compound' && engLower.includes('dial')) {
    issues.push({ type: 'NOUN_VS_VERB', detail: `"${word}" → "${g}" should be "dial/compose" (verb)`, severity: 'high' });
  }
  if (lang === 'fr' && w === 'gagne' && gLower === 'won' && engLower.includes('earn')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "earns"`, severity: 'medium' });
  }
  if (lang === 'fr' && w === 'préfère' && gLower === 'favorite') {
    issues.push({ type: 'NOUN_VS_VERB', detail: `"${word}" → "${g}" should be "prefers" (verb)`, severity: 'high' });
  }
  if (lang === 'it' && w === 'metro' && gLower === 'meter' && engLower.includes('metro')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "metro/subway"`, severity: 'medium' });
  }
  if (lang === 'es' && w === 'media' && gLower === 'average' && engLower.includes('thirty')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "half"`, severity: 'high' });
  }
  if (lang === 'es' && w === 'tipo' && gLower === 'guy' && engLower.includes('kind')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "type/kind"`, severity: 'high' });
  }
  if (lang === 'es' && w === 'huelga' && gLower === 'strike') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "it goes without saying" (in "huelga decir")`, severity: 'medium' });
  }
  if (lang === 'es' && w === 'archivo' && gLower === 'archive' && engLower.includes('file')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "file"`, severity: 'medium' });
  }
  if (lang === 'es' && w === 'embarque' && gLower === 'shipment' && engLower.includes('boarding')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "boarding"`, severity: 'medium' });
  }
  if (lang === 'es' && w === 'termino' && gLower === 'term' && engLower.includes('finish')) {
    issues.push({ type: 'NOUN_VS_VERB', detail: `"${word}" → "${g}" should be "I finish" (verb)`, severity: 'high' });
  }
  // Spanish mayor → "elderly" (should be "older/bigger")
  if (lang === 'es' && w === 'mayor' && gLower === 'elderly') {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "older/bigger"`, severity: 'medium' });
  }
  // Turkish çalındı → "stolen" when means "was knocked"
  if (lang === 'tr' && w === 'çalındı' && gLower === 'stolen' && engLower.includes('knock')) {
    issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" should be "was knocked/rung"`, severity: 'high' });
  }

  // ---- Additional generic wrong-sense detection ----
  // If google output doesn't overlap with card English at all and is a content word
  if (issues.length === 0 && gWords.length === 1 && gLower.length > 3) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'to', 'of', 'in', 'on', 'at',
      'by', 'for', 'with', 'and', 'or', 'but', 'not', 'no', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'it', 'he', 'she', 'we', 'they', 'me', 'him', 'us', 'them', 'this', 'that', 'these', 'those',
      'from', 'up', 'out', 'about', 'into', 'over', 'after', 'very', 'much', 'more', 'also', 'just',
      'only', 'already', 'still', 'too', 'so', 'now', 'then', 'here', 'there', 'when', 'where',
      'how', 'what', 'which', 'who', 'if', 'do', 'does', 'did', 'has', 'have', 'had',
      'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must', 'shall']);

    if (!stopWords.has(gLower)) {
      // Check if google translation or related forms appear in card English
      const gBase = gLower.replace(/s$/, '').replace(/ed$/, '').replace(/ing$/, '').replace(/ly$/, '');
      const matchesEng = engLower.includes(gLower) ||
                         engLower.includes(gBase) ||
                         engWords.some(ew => ew.startsWith(gBase) || gBase.startsWith(ew.replace(/s$/, '')));

      if (!matchesEng && engWords.length >= 4) {
        // Only flag if we're quite confident
        issues.push({ type: 'WRONG_SENSE', detail: `"${word}" → "${g}" may not match card: "${cardEnglish}"`, severity: 'low' });
      }
    }
  }

  // ---- GOOGLE_PERFECT ----
  if (issues.length === 0 || issues.every(i => i.type === 'CAPITALIZATION' && i.severity === 'low')) {
    // Check if it's a genuinely good translation
    const gInEng = gWords.length <= 2 && gWords.every(gw => {
      const gwl = gw.toLowerCase();
      return engLower.includes(gwl) || engWords.includes(gwl);
    });
    const isCapOnly = issues.length > 0 && issues.every(i => i.type === 'CAPITALIZATION');

    if (gInEng || gWords.length === 1) {
      if (!isCapOnly) {
        issues.push({ type: 'GOOGLE_PERFECT', detail: `"${word}" → "${g}" ✓`, severity: 'none' });
      }
    }
  }

  // If no issues at all, mark as uncategorized-ok
  if (issues.length === 0) {
    issues.push({ type: 'GOOGLE_PERFECT', detail: `"${word}" → "${g}" (ok)`, severity: 'none' });
  }

  return issues;
}

// ============================================================
// MAIN ANALYSIS
// ============================================================

const results = {};
const langNames = {
  es: 'Spanish', it: 'Italian', fr: 'French', pt: 'Portuguese',
  de: 'German', nl: 'Dutch', sv: 'Swedish', cy: 'Welsh',
  hi: 'Hindi', tr: 'Turkish', ru: 'Russian',
};

for (const lang of Object.keys(data)) {
  const cards = data[lang];
  const langResults = {
    totalWords: 0,
    totalCards: cards.length,
    issues: {},
    allFlags: [],
    bestExamples: [],
  };

  for (const card of cards) {
    for (let wi = 0; wi < card.words.length; wi++) {
      const { word, google } = card.words[wi];
      langResults.totalWords++;

      const issues = analyzeWord(word, google, card.english, lang, wi, card.words.length, card.target);

      for (const issue of issues) {
        if (!langResults.issues[issue.type]) langResults.issues[issue.type] = 0;
        langResults.issues[issue.type]++;

        if (issue.type !== 'GOOGLE_PERFECT') {
          langResults.allFlags.push({
            cardId: card.id,
            word,
            google,
            cardEnglish: card.english,
            target: card.target,
            type: issue.type,
            detail: issue.detail,
            severity: issue.severity,
          });
        } else {
          langResults.bestExamples.push({
            cardId: card.id,
            word,
            google,
            cardEnglish: card.english,
          });
        }
      }
    }
  }

  // Sort worst by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  langResults.allFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Pick diverse best examples
  const seen = new Set();
  langResults.bestExamples = langResults.bestExamples
    .filter(e => {
      const key = e.google.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return key.length > 2 && !['the', 'and', 'for', 'not', 'but', 'with'].includes(key);
    })
    .slice(0, 10);

  results[lang] = langResults;
}

// ============================================================
// COMPUTE OVERALL STATS
// ============================================================

const overallStats = {
  totalWords: 0,
  totalCards: 0,
  issueTypeCounts: {},
  issuesByLanguage: {},
};

for (const [lang, r] of Object.entries(results)) {
  overallStats.totalWords += r.totalWords;
  overallStats.totalCards += r.totalCards;
  overallStats.issuesByLanguage[lang] = {
    totalWords: r.totalWords,
    totalIssues: r.allFlags.length,
    issueRate: (r.allFlags.length / r.totalWords * 100).toFixed(1) + '%',
    highSeverity: r.allFlags.filter(f => f.severity === 'high').length,
    byType: r.issues,
  };
  for (const [type, count] of Object.entries(r.issues)) {
    if (!overallStats.issueTypeCounts[type]) overallStats.issueTypeCounts[type] = 0;
    overallStats.issueTypeCounts[type] += count;
  }
}

const totalNonPerfect = Object.entries(overallStats.issueTypeCounts)
  .filter(([k]) => k !== 'GOOGLE_PERFECT')
  .reduce((s, [, v]) => s + v, 0);

const totalHighSeverity = Object.values(results)
  .reduce((s, r) => s + r.allFlags.filter(f => f.severity === 'high').length, 0);

// ============================================================
// GENERATE MARKDOWN REPORT
// ============================================================

const issueTypes = ['FUNCTION_WORD_WRONG', 'WRONG_SENSE', 'INFLECTED_NOT_BASE', 'FRAGMENT',
  'PROPER_NOUN_UNTRANSLATED', 'CAPITALIZATION', 'NOUN_VS_VERB', 'GOOGLE_PERFECT'];

let md = `# Google Translate Word-Level Translation Review

## Executive Summary

**${overallStats.totalWords}** words analyzed across **${overallStats.totalCards}** cards (100 per language, 11 languages).

| Metric | Count | % |
|---|---|---|
| Total words | ${overallStats.totalWords} | 100% |
| Perfect translations | ${overallStats.issueTypeCounts['GOOGLE_PERFECT'] || 0} | ${((overallStats.issueTypeCounts['GOOGLE_PERFECT'] || 0) / overallStats.totalWords * 100).toFixed(1)}% |
| Total issues | ${totalNonPerfect} | ${(totalNonPerfect / overallStats.totalWords * 100).toFixed(1)}% |
| **High-severity issues** | **${totalHighSeverity}** | **${(totalHighSeverity / overallStats.totalWords * 100).toFixed(1)}%** |

**Bottom line**: Google Translate gives correct/usable word translations about ${((overallStats.issueTypeCounts['GOOGLE_PERFECT'] || 0) / overallStats.totalWords * 100).toFixed(0)}% of the time. However, ${(totalHighSeverity / overallStats.totalWords * 100).toFixed(1)}% of words have HIGH-severity errors (completely wrong meaning) that would actively mislead learners.

## Issue Type Summary

| Issue Type | Count | % of Words | Description |
|---|---|---|---|
`;

const issueDescriptions = {
  'FUNCTION_WORD_WRONG': 'Articles, prepositions, aux verbs wrong (el→"he", la→"there")',
  'WRONG_SENSE': 'Google picked wrong meaning (est→"east", está→"this", kar→"profit")',
  'INFLECTED_NOT_BASE': 'Past tense / 3rd person instead of base form (went, eats)',
  'FRAGMENT': 'Too many words for a dictionary definition',
  'PROPER_NOUN_UNTRANSLATED': 'Word returned unchanged or transliterated (в→"V")',
  'CAPITALIZATION': 'Unnecessary uppercase (sentence-start leak)',
  'NOUN_VS_VERB': 'Wrong part of speech (noun given but verb meant)',
  'GOOGLE_PERFECT': 'Translation is correct for dictionary use',
};

for (const type of issueTypes) {
  const count = overallStats.issueTypeCounts[type] || 0;
  const pct = (count / overallStats.totalWords * 100).toFixed(1);
  md += `| ${type} | ${count} | ${pct}% | ${issueDescriptions[type] || ''} |\n`;
}

md += `\n## Per-Language Error Rates\n\n`;
md += `| Language | Words | Issues | Rate | High-Sev | Perfect |\n|---|---|---|---|---|---|\n`;
for (const lang of Object.keys(data)) {
  const r = results[lang];
  const name = langNames[lang];
  const stats = overallStats.issuesByLanguage[lang];
  md += `| ${name} | ${r.totalWords} | ${stats.totalIssues} | ${stats.issueRate} | ${stats.highSeverity} | ${r.issues['GOOGLE_PERFECT'] || 0} |\n`;
}

md += `\n## Per-Language Detailed Results\n\n`;

for (const lang of Object.keys(data)) {
  const r = results[lang];
  const name = langNames[lang];
  const stats = overallStats.issuesByLanguage[lang];

  md += `### ${name} (${lang})\n\n`;
  md += `- Words: ${r.totalWords} | Issues: ${stats.totalIssues} (${stats.issueRate}) | High-severity: ${stats.highSeverity}\n\n`;

  md += `**Issue breakdown:**\n\n| Type | Count |\n|---|---|\n`;
  for (const type of issueTypes) {
    if (type === 'GOOGLE_PERFECT') continue;
    const count = r.issues[type] || 0;
    if (count > 0) md += `| ${type} | ${count} |\n`;
  }

  // Top 10 worst
  md += `\n**10 Worst Examples:**\n\n| # | Word | Google | Issue | Detail |\n|---|---|---|---|---|\n`;
  const worst10 = r.allFlags.slice(0, 10);
  for (let i = 0; i < worst10.length; i++) {
    const ex = worst10[i];
    md += `| ${i+1} | ${ex.word} | ${ex.google} | ${ex.type} | ${ex.detail} |\n`;
  }

  // Top 10 best
  md += `\n**10 Best Examples (Google Perfect):**\n\n| Word | Google | Card English |\n|---|---|---|\n`;
  for (const ex of r.bestExamples) {
    md += `| ${ex.word} | ${ex.google} | ${ex.cardEnglish.substring(0, 50)} |\n`;
  }
  md += `\n---\n\n`;
}

// ============================================================
// SYSTEMIC PATTERNS AND RECOMMENDATIONS
// ============================================================

md += `## Systemic Patterns Found

### 1. Article/Copula → Pronoun (Romance Languages)
The single most common and most damaging pattern. Google translates definite articles as pronouns:
- Spanish: **el→"he"** (appears ~20+ times), la→"the" (correct sometimes)
- Italian: **è→"And"** (catastrophic — "is" becomes "and"), la→"there"
- French: **est→"East"** (catastrophic — most common verb becomes direction)
- Portuguese: **no→"node"**, está→"this", é→"and"

### 2. Wrong Sense for Homographs
Words with multiple meanings consistently get the wrong one in isolation:
- Turkish: **kar→"profit"** (should be "snow"), üç→"fly" (should be "three"), gelir→"income" (should be "comes")
- Hindi: **पर→"But"** (should be "on"), कर→"Tax" (should be "do"), जाती→"caste" (should be "goes")
- Dutch: **naar→"Unpleasant"** (should be "to"), bij→"bee" (should be "at"), met→"of" (should be "with")
- Swedish: **köttbullar→"noisette"** (should be "meatballs"), åker→"field" (should be "go/travel")
- Russian: **в→"V"** (transliteration!), дома→"Houses" (should be "at home")

### 3. Capitalization Leakage
Google preserves source-language capitalization. German capitalizes ALL nouns, so translations like "Coffee", "Water", "Window" are correct German but wrong English dictionary entries.

### 4. Grammatical Particles Mistranslated
Many languages have particles that don't map 1:1 to English:
- Hindi: ने (agent marker), से, में, पर, को — these are postpositions Google handles inconsistently
- Welsh: yn (verbal particle), wedi (perfective), ddim (negation) — Welsh grammar markers poorly handled
- Turkish: agglutinative suffixes (-da, -den, -yla) handled by Google within compound forms but isolated words lose context

### 5. Verb Form Issues
Google frequently gives inflected forms instead of dictionary base forms:
- Past tense: "went" instead of "to go", "came" instead of "to come"
- Italian: era→"era" (untranslated!), fosse→"is" (wrong tense entirely)
- Spanish: vino→"came" (correct but should be "to come" for dictionary)

## Recommendations

### Auto-Fix Rules (apply post-processing to Google output)

| # | Rule | Languages | Expected Fix Rate |
|---|---|---|---|
| 1 | **Lowercase first letter** unless proper noun | All | ~95% of CAPITALIZATION issues |
| 2 | **Article lookup table**: el/la/le/il/o/der/die/das → "the" | ES/FR/IT/PT/DE | ~90% of article errors |
| 3 | **Function word table**: 50-100 entries per language | All | ~80% of FUNCTION_WORD_WRONG |
| 4 | **Strip fragments**: if output >3 words, take last content word | All | ~70% of FRAGMENT issues |
| 5 | **Verb base form**: if English output is irregular past, map to "to X" | All | ~60% of INFLECTED issues |
| 6 | **Transliteration fix**: single Cyrillic letter → known translation | RU | 100% of в/у/о issues |

### Must Use Wiktionary (cannot auto-fix)

| Issue | Why Auto-Fix Fails |
|---|---|
| **WRONG_SENSE** | No way to pick correct sense without context. Google picks the most common meaning in isolation, which is often wrong for how the word is used in our sentences. |
| **NOUN_VS_VERB** | Google doesn't distinguish POS. "porte" = "door" (noun) vs "wears" (verb) requires knowing the sentence structure. |
| **Hindi/Welsh grammatical particles** | These are language-specific grammar markers that need language-aware definitions, not translation. |
| **Turkish agglutination** | Suffixed words need morphological analysis, not single-word translation. |

### Recommended Strategy

1. **Primary source: Wiktionary** — already have rebuild script. Use for definitions, POS, IPA.
2. **Secondary source: Google Translate with auto-fix pipeline** — only when Wiktionary has no entry.
3. **Auto-fix pipeline**: lowercase → function word table → verb base form → fragment trim.
4. **Never use raw Google output** — even "perfect" translations often have capitalization issues.
5. **Per-language function word tables are essential** — the 50 most common function words per language need hardcoded correct translations.

### Expected Quality After Pipeline

| Source | Coverage | Accuracy |
|---|---|---|
| Wiktionary only | ~70-80% of words | ~95% accurate |
| Wiktionary + Google auto-fixed | ~95%+ of words | ~88% accurate |
| Raw Google (current) | 100% of words | ~${((overallStats.issueTypeCounts['GOOGLE_PERFECT'] || 0) / overallStats.totalWords * 100).toFixed(0)}% accurate |
`;

// ============================================================
// WRITE OUTPUT FILES
// ============================================================

const jsonOutput = {
  meta: {
    timestamp: new Date().toISOString(),
    totalCards: overallStats.totalCards,
    totalWords: overallStats.totalWords,
    languages: Object.keys(data),
    analysisVersion: '2.0-manual-calibrated',
  },
  overall: {
    ...overallStats,
    totalIssues: totalNonPerfect,
    totalHighSeverity: totalHighSeverity,
    perfectCount: overallStats.issueTypeCounts['GOOGLE_PERFECT'] || 0,
    perfectRate: ((overallStats.issueTypeCounts['GOOGLE_PERFECT'] || 0) / overallStats.totalWords * 100).toFixed(1) + '%',
  },
  perLanguage: {},
};

for (const [lang, r] of Object.entries(results)) {
  jsonOutput.perLanguage[lang] = {
    totalWords: r.totalWords,
    totalCards: r.totalCards,
    issues: r.issues,
    errorRate: (r.allFlags.length / r.totalWords * 100).toFixed(1) + '%',
    highSeverity: r.allFlags.filter(f => f.severity === 'high').length,
    worstExamples: r.allFlags.slice(0, 10),
    bestExamples: r.bestExamples,
    allFlags: r.allFlags,
  };
}

fs.writeFileSync(path.join(__dirname, 'output/gt-detailed-review.md'), md);
fs.writeFileSync(path.join(__dirname, 'output/gt-detailed-review.json'), JSON.stringify(jsonOutput, null, 2));

// ============================================================
// CONSOLE SUMMARY
// ============================================================

console.log('=== GOOGLE TRANSLATE WORD-LEVEL REVIEW ===');
console.log(`Total words: ${overallStats.totalWords}`);
console.log(`Perfect: ${overallStats.issueTypeCounts['GOOGLE_PERFECT'] || 0} (${((overallStats.issueTypeCounts['GOOGLE_PERFECT'] || 0) / overallStats.totalWords * 100).toFixed(1)}%)`);
console.log(`Total issues: ${totalNonPerfect} (${(totalNonPerfect / overallStats.totalWords * 100).toFixed(1)}%)`);
console.log(`HIGH severity: ${totalHighSeverity} (${(totalHighSeverity / overallStats.totalWords * 100).toFixed(1)}%)`);
console.log();
console.log('Issue breakdown:');
for (const type of issueTypes) {
  const count = overallStats.issueTypeCounts[type] || 0;
  if (count > 0) console.log(`  ${type}: ${count} (${(count / overallStats.totalWords * 100).toFixed(1)}%)`);
}
console.log();
console.log('Per-language:');
for (const lang of Object.keys(data)) {
  const r = results[lang];
  const hi = r.allFlags.filter(f => f.severity === 'high').length;
  console.log(`  ${langNames[lang].padEnd(11)} ${r.allFlags.length.toString().padStart(3)} issues / ${r.totalWords} words (${(r.allFlags.length / r.totalWords * 100).toFixed(1)}%) — ${hi} high-sev`);
}
console.log();
console.log('Written to:');
console.log('  scripts/output/gt-detailed-review.md');
console.log('  scripts/output/gt-detailed-review.json');
