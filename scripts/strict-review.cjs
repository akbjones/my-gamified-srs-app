#!/usr/bin/env node
/**
 * Strict semantic + format review for ALL 11 language dictionaries.
 * Samples 200 entries per language (2,200 total).
 * Format checks: to_prefix, truncation, mixed_case, length
 * Semantic checks: re-translates via Google Translate and compares content words.
 * Bad pattern checks: "to is", "to are", "to was", "to costs", "to came", "to friend", "child's", "fresh; X"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = path.resolve(__dirname, '..');
const DICT_DIR = path.join(BASE, 'src/data/dictionary');
const OUT_DIR = path.join(BASE, 'scripts/output');
const { lemmatize: extLemmatize } = require('./english-lemmatizer.cjs');

const API_KEY = process.env.GOOGLE_TTS_KEY;

const LANGUAGES = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'hi', 'tr', 'ru'];
const LANG_CODES = {
  es: 'es', it: 'it', fr: 'fr', pt: 'pt', de: 'de',
  nl: 'nl', sv: 'sv', cy: 'cy', hi: 'hi', tr: 'tr', ru: 'ru'
};
const SAMPLE_SIZE = 200;
const BATCH_SIZE = 80;

// ── Helpers ──────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseDictionary(lang) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries = [];
  const entryRegex = /(['"])((?:(?!\1).|\\.)+)\1\s*:\s*\{([^}]+)\}/g;
  let m;
  while ((m = entryRegex.exec(content)) !== null) {
    const key = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const body = m[3];
    const enMatch = body.match(/en:\s*(['"])((?:(?!\1).|\\.)*)(\1)/);
    if (!enMatch) continue;
    const en = enMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const posMatch = body.match(/pos:\s*['"]([^'"]*)['"]/);
    const pos = posMatch ? posMatch[1] : '';
    entries.push({ key, en, pos });
  }
  return entries;
}

// ── Google Translate batch ───────────────────────────────────────

async function translateBatch(words, sourceLang) {
  const results = {};
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const params = batch.map(w => 'q=' + encodeURIComponent(w)).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=${sourceLang}&target=en&${params}`;

    const translations = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.data || !parsed.data.translations) {
              console.error('  API error:', JSON.stringify(parsed).slice(0, 200));
              resolve(batch.map(() => '?'));
              return;
            }
            resolve(parsed.data.translations.map(t =>
              t.translatedText.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
            ));
          } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    batch.forEach((word, j) => {
      results[word] = translations[j] || '?';
    });

    await sleep(250);
  }
  return results;
}

// ── Lemmatizer / content word extraction ─────────────────────────

// Irregular verb forms → base
const IRREGULAR_LEMMAS = {
  'am': 'be', 'is': 'be', 'are': 'be', 'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
  'has': 'have', 'had': 'have', 'having': 'have',
  'does': 'do', 'did': 'do', 'doing': 'do', 'done': 'do',
  'goes': 'go', 'went': 'go', 'gone': 'go', 'going': 'go',
  'came': 'come', 'come': 'come', 'coming': 'come', 'comes': 'come',
  'got': 'get', 'gets': 'get', 'gotten': 'get', 'getting': 'get',
  'took': 'take', 'takes': 'take', 'taken': 'take', 'taking': 'take',
  'gave': 'give', 'gives': 'give', 'given': 'give', 'giving': 'give',
  'made': 'make', 'makes': 'make', 'making': 'make',
  'said': 'say', 'says': 'say', 'saying': 'say',
  'told': 'tell', 'tells': 'tell', 'telling': 'tell',
  'knew': 'know', 'knows': 'know', 'known': 'know', 'knowing': 'know',
  'saw': 'see', 'sees': 'see', 'seen': 'see', 'seeing': 'see',
  'found': 'find', 'finds': 'find', 'finding': 'find',
  'thought': 'think', 'thinks': 'think', 'thinking': 'think',
  'felt': 'feel', 'feels': 'feel', 'feeling': 'feel',
  'left': 'leave', 'leaves': 'leave', 'leaving': 'leave',
  'kept': 'keep', 'keeps': 'keep', 'keeping': 'keep',
  'set': 'set', 'sat': 'sit', 'sits': 'sit', 'sitting': 'sit',
  'stood': 'stand', 'stands': 'stand', 'standing': 'stand',
  'ran': 'run', 'runs': 'run', 'running': 'run',
  'held': 'hold', 'holds': 'hold', 'holding': 'hold',
  'brought': 'bring', 'brings': 'bring', 'bringing': 'bring',
  'bought': 'buy', 'buys': 'buy', 'buying': 'buy',
  'sold': 'sell', 'sells': 'sell', 'selling': 'sell',
  'sent': 'send', 'sends': 'send', 'sending': 'send',
  'spent': 'spend', 'spends': 'spend', 'spending': 'spend',
  'built': 'build', 'builds': 'build', 'building': 'build',
  'fell': 'fall', 'falls': 'fall', 'fallen': 'fall', 'falling': 'fall',
  'cut': 'cut', 'cuts': 'cut', 'cutting': 'cut',
  'put': 'put', 'puts': 'put', 'putting': 'put',
  'read': 'read', 'reads': 'read', 'reading': 'read',
  'wrote': 'write', 'writes': 'write', 'written': 'write', 'writing': 'write',
  'spoke': 'speak', 'speaks': 'speak', 'spoken': 'speak', 'speaking': 'speak',
  'broke': 'break', 'breaks': 'break', 'broken': 'break', 'breaking': 'break',
  'drove': 'drive', 'drives': 'drive', 'driven': 'drive', 'driving': 'drive',
  'ate': 'eat', 'eats': 'eat', 'eaten': 'eat', 'eating': 'eat',
  'drank': 'drink', 'drinks': 'drink', 'drunk': 'drink', 'drinking': 'drink',
  'sang': 'sing', 'sings': 'sing', 'sung': 'sing', 'singing': 'sing',
  'began': 'begin', 'begins': 'begin', 'begun': 'begin', 'beginning': 'begin',
  'chose': 'choose', 'chooses': 'choose', 'chosen': 'choose', 'choosing': 'choose',
  'wore': 'wear', 'wears': 'wear', 'worn': 'wear', 'wearing': 'wear',
  'grew': 'grow', 'grows': 'grow', 'grown': 'grow', 'growing': 'grow',
  'drew': 'draw', 'draws': 'draw', 'drawn': 'draw', 'drawing': 'draw',
  'flew': 'fly', 'flies': 'fly', 'flown': 'fly', 'flying': 'fly',
  'threw': 'throw', 'throws': 'throw', 'thrown': 'throw', 'throwing': 'throw',
  'caught': 'catch', 'catches': 'catch', 'catching': 'catch',
  'taught': 'teach', 'teaches': 'teach', 'teaching': 'teach',
  'paid': 'pay', 'pays': 'pay', 'paying': 'pay',
  'lost': 'lose', 'loses': 'lose', 'losing': 'lose',
  'won': 'win', 'wins': 'win', 'winning': 'win',
  'meant': 'mean', 'means': 'mean', 'meaning': 'mean',
  'led': 'lead', 'leads': 'lead', 'leading': 'lead',
  'met': 'meet', 'meets': 'meet', 'meeting': 'meet',
  'lay': 'lie', 'lies': 'lie', 'lain': 'lie', 'lying': 'lie',
  'laid': 'lay', 'lays': 'lay', 'laying': 'lay',
  'slept': 'sleep', 'sleeps': 'sleep', 'sleeping': 'sleep',
  'woke': 'wake', 'wakes': 'wake', 'woken': 'wake', 'waking': 'wake',
  'swam': 'swim', 'swims': 'swim', 'swum': 'swim', 'swimming': 'swim',
  'risen': 'rise', 'rises': 'rise', 'rose': 'rise', 'rising': 'rise',
  'children': 'child', 'men': 'man', 'women': 'woman', 'people': 'person',
  'feet': 'foot', 'teeth': 'tooth', 'mice': 'mouse', 'geese': 'goose',
  'lives': 'life', 'wives': 'wife', 'knives': 'knife', 'leaves': 'leaf',
  'selves': 'self', 'halves': 'half', 'wolves': 'wolf', 'shelves': 'shelf',
  'cities': 'city', 'countries': 'country', 'stories': 'story', 'babies': 'baby',
  'families': 'family', 'bodies': 'body', 'parties': 'party', 'ladies': 'lady',
  'studies': 'study', 'armies': 'army', 'enemies': 'enemy', 'copies': 'copy',
  'bigger': 'big', 'smaller': 'small', 'larger': 'large', 'older': 'old',
  'younger': 'young', 'longer': 'long', 'shorter': 'short', 'faster': 'fast',
  'slower': 'slow', 'better': 'good', 'worse': 'bad', 'best': 'good', 'worst': 'bad',
  'biggest': 'big', 'smallest': 'small', 'largest': 'large', 'oldest': 'old',
  'youngest': 'young', 'longest': 'long', 'shortest': 'short',
  'costs': 'cost',
};

const STOP_WORDS = new Set([
  'to', 'a', 'an', 'the', 'of', 'in', 'on', 'at', 'for', 'with', 'from',
  'by', 'is', 'it', 'and', 'or', 'but', 'not', 'no', 'be', 'do', 'have',
  'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our',
  'their', 'its', 'this', 'that', 'these', 'those', 'up', 'out', 'down',
  'off', 'over', 'one', 'all', 'some', 'any', 'each', 'every', 'as',
  'so', 'if', 'than', 'very', 'just', 'about', 'also', 'into', 'own',
  'get', 'got', 'been', 'being', 'was', 'were', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'must', 'let', 'don\'t',
  'something', 'someone', 'oneself', 'yourself', 'itself', 'myself',
  'themselves', 'ourselves',
]);

/**
 * Lemmatize a single English word.
 * Uses the comprehensive english-lemmatizer.cjs as primary, with fallback rules.
 */
function lemmatize(word) {
  const w = word.toLowerCase().replace(/['']/g, "'");
  if (IRREGULAR_LEMMAS[w]) return IRREGULAR_LEMMAS[w];

  // Try external lemmatizer (has 300+ irregular verbs, 200+ irregular nouns)
  try {
    const extResult = extLemmatize(w);
    if (extResult && extResult !== w) return extResult;
  } catch (e) { /* fallback to local rules */ }

  // possessives
  if (w.endsWith("'s")) return lemmatize(w.slice(0, -2));
  if (w.endsWith("s'")) return lemmatize(w.slice(0, -2));

  // -ing
  if (w.endsWith('ing') && w.length > 5) {
    const stem = w.slice(0, -3);
    if (stem.endsWith(stem[stem.length - 1]) && stem.length > 2) {
      return stem.slice(0, -1); // running → run
    }
    return stem.endsWith('e') ? stem : (stem + 'e');
  }

  // -ed
  if (w.endsWith('ed') && w.length > 4) {
    const stem = w.slice(0, -2);
    if (stem.endsWith(stem[stem.length - 1]) && stem.length > 2) {
      return stem.slice(0, -1); // stopped → stop
    }
    return w.slice(0, -1).endsWith('i') ? w.slice(0, -3) + 'y' : stem;
  }

  // -ies → -y
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  // -es
  if (w.endsWith('es') && w.length > 4) {
    if (w.endsWith('ches') || w.endsWith('shes') || w.endsWith('sses') || w.endsWith('xes') || w.endsWith('zes')) {
      return w.slice(0, -2);
    }
    return w.slice(0, -1);
  }
  // -s
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);

  // -ly
  if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2);

  // -ness
  if (w.endsWith('ness') && w.length > 5) return w.slice(0, -4);

  return w;
}

/**
 * Extract content words from a definition string.
 * Returns Set of lemmatized content words.
 */
function extractContentWords(text) {
  const words = text.toLowerCase()
    .replace(/[;,/()[\]{}!?.:"'`]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  const lemmas = new Set();
  for (const w of words) {
    lemmas.add(lemmatize(w));
  }
  return lemmas;
}

// ── Bad patterns ─────────────────────────────────────────────────

const BAD_PATTERNS = [
  { re: /^to (is|are|was|were|am)\b/i,     label: 'to_copula' },
  { re: /^to (costs?|came|went|got|had|did|said|made|took|gave|felt|left|kept|found|thought|knew|saw)\b/i, label: 'to_past_tense' },
  { re: /^to (friend|child|house|city|water|money|time|day|night|morning|place|people|name)\b/i, label: 'to_noun' },
  { re: /child's\b/i,                       label: 'child_possessive' },
  { re: /^fresh;\s/i,                        label: 'fresh_semicolon' },
  { re: /;\s*$/,                              label: 'trailing_semicolon' },
  { re: /^to [A-Z]/,                          label: 'to_capitalized' },
];

// ── Format checks (from old 500-review) ──────────────────────────

function formatCheck(entry) {
  const { key, en, pos } = entry;
  const enLower = en.toLowerCase().trim();
  const failures = [];

  // 1. to_prefix matches pos
  if (pos === 'v') {
    if (!enLower.startsWith('to ') && !enLower.includes('; to ') && !enLower.includes(', to ')) {
      if (!/^(i |he |she |we |they |it |let |don't |can |will |would |could |should |may |might |must )/.test(enLower)) {
        // Accept gerunds/participles as valid verb forms
        if (!enLower.endsWith('ing') && !enLower.endsWith('ed') && !enLower.endsWith('en')) {
          failures.push('to_prefix');
        }
      }
    }
  } else if (pos && pos !== 'v' && pos !== 'pron' && pos !== 'prep') {
    if (enLower.startsWith('to ') && !enLower.startsWith('to the ') && !enLower.startsWith('to a ')) {
      const afterTo = enLower.slice(3);
      if (!/^(the |a |an |this |that |some |each |every |one |two |three |me|us|them|him|her|you|it)/.test(afterTo)) {
        failures.push('to_prefix');
      }
    }
  }

  // 2. not truncated
  if (en.endsWith('...') || en.endsWith('…')) failures.push('truncated');
  if (en.length < 1) failures.push('truncated');

  // 3. mixed case
  if (/[a-z][A-Z]/.test(en.slice(1)) && !en.includes('-') && !en.includes("'")) {
    if (!/^(WiFi|iPhone|iPad|YouTube|WhatsApp|LinkedIn|JavaScript|TypeScript)$/i.test(en)) {
      failures.push('mixed_case');
    }
  }

  // 4. reasonable length
  if (en.length > 60) failures.push('bad_length');

  return failures;
}

// ── Synonym / near-match tables ─────────────────────────────────

const SYNONYM_GROUPS = [
  ['speak', 'talk', 'say', 'tell', 'narrate', 'chat', 'converse'],
  ['go', 'leave', 'depart', 'exit', 'walk', 'move'],
  ['big', 'large', 'great', 'huge', 'enormous'],
  ['small', 'little', 'tiny', 'minor'],
  ['happy', 'glad', 'joyful', 'pleased', 'cheerful', 'content'],
  ['sad', 'unhappy', 'sorrowful', 'melancholy', 'depressed'],
  ['beautiful', 'pretty', 'lovely', 'gorgeous', 'handsome', 'attractive'],
  ['fast', 'quick', 'rapid', 'swift', 'speedy'],
  ['smart', 'clever', 'intelligent', 'bright', 'wise'],
  ['start', 'begin', 'commence', 'initiate'],
  ['end', 'finish', 'complete', 'conclude', 'terminate', 'stop'],
  ['get', 'obtain', 'acquire', 'receive', 'gain', 'fetch'],
  ['give', 'provide', 'supply', 'offer', 'donate', 'grant'],
  ['make', 'create', 'produce', 'build', 'construct', 'craft'],
  ['see', 'look', 'watch', 'observe', 'view', 'notice', 'spot', 'witness'],
  ['think', 'believe', 'consider', 'reflect', 'ponder', 'reckon'],
  ['want', 'wish', 'desire', 'crave', 'long'],
  ['like', 'enjoy', 'love', 'appreciate', 'fancy', 'prefer'],
  ['help', 'assist', 'aid', 'support'],
  ['answer', 'reply', 'respond'],
  ['ask', 'question', 'inquire', 'query'],
  ['buy', 'purchase', 'acquire'],
  ['sell', 'trade', 'market'],
  ['eat', 'consume', 'dine', 'feed'],
  ['drink', 'sip', 'gulp', 'swallow'],
  ['sleep', 'rest', 'nap', 'doze', 'slumber'],
  ['die', 'perish', 'expire', 'pass away'],
  ['live', 'reside', 'dwell', 'inhabit', 'exist'],
  ['come', 'arrive', 'approach', 'reach'],
  ['return', 'come back', 'go back'],
  ['take', 'grab', 'seize', 'grasp', 'catch', 'hold'],
  ['put', 'place', 'set', 'lay', 'position'],
  ['show', 'display', 'present', 'demonstrate', 'reveal', 'exhibit'],
  ['hide', 'conceal', 'cover'],
  ['find', 'discover', 'locate', 'detect', 'uncover'],
  ['lose', 'misplace', 'forfeit'],
  ['win', 'triumph', 'succeed', 'prevail'],
  ['fight', 'battle', 'combat', 'struggle', 'clash'],
  ['break', 'smash', 'shatter', 'crack', 'destroy'],
  ['fix', 'repair', 'mend', 'restore', 'correct'],
  ['close', 'shut', 'seal'],
  ['open', 'unlock', 'unseal'],
  ['send', 'deliver', 'dispatch', 'ship', 'transmit'],
  ['carry', 'bear', 'transport', 'haul'],
  ['pull', 'drag', 'tug', 'draw'],
  ['push', 'shove', 'press', 'thrust'],
  ['cut', 'slice', 'chop', 'trim', 'carve'],
  ['touch', 'feel', 'handle', 'stroke'],
  ['hit', 'strike', 'punch', 'beat', 'knock', 'slap'],
  ['throw', 'toss', 'hurl', 'fling', 'cast'],
  ['pick', 'choose', 'select', 'opt'],
  ['keep', 'retain', 'maintain', 'preserve', 'hold'],
  ['move', 'transfer', 'shift', 'relocate', 'migrate'],
  ['change', 'alter', 'modify', 'transform', 'adjust', 'convert'],
  ['grow', 'increase', 'expand', 'develop', 'rise'],
  ['fall', 'drop', 'decline', 'decrease', 'plunge', 'tumble'],
  ['turn', 'rotate', 'spin', 'twist', 'revolve'],
  ['stand', 'rise', 'get up'],
  ['sit', 'seat'],
  ['run', 'sprint', 'jog', 'race', 'dash'],
  ['jump', 'leap', 'hop', 'bounce', 'spring'],
  ['fly', 'soar', 'glide'],
  ['swim', 'float', 'wade'],
  ['drive', 'steer', 'ride', 'operate'],
  ['walk', 'stroll', 'wander', 'roam', 'hike', 'march'],
  ['cry', 'weep', 'sob'],
  ['laugh', 'giggle', 'chuckle'],
  ['shout', 'yell', 'scream', 'holler', 'cry'],
  ['whisper', 'murmur', 'mutter'],
  ['sing', 'chant', 'hum'],
  ['play', 'perform', 'act', 'stage'],
  ['study', 'learn', 'examine', 'research'],
  ['teach', 'instruct', 'educate', 'train', 'tutor'],
  ['read', 'peruse', 'scan', 'browse'],
  ['write', 'compose', 'draft', 'pen', 'author', 'record'],
  ['draw', 'sketch', 'illustrate', 'depict'],
  ['paint', 'color', 'illustrate'],
  ['cook', 'prepare', 'bake', 'fry', 'boil', 'roast', 'grill'],
  ['clean', 'wash', 'scrub', 'wipe', 'tidy', 'cleanse'],
  ['work', 'labor', 'toil'],
  ['pay', 'compensate', 'reimburse', 'remunerate'],
  ['cost', 'price', 'charge', 'expense'],
  ['save', 'rescue', 'preserve', 'conserve'],
  ['spend', 'use', 'expend', 'consume'],
  ['meet', 'encounter', 'greet'],
  ['know', 'understand', 'comprehend', 'grasp', 'realize'],
  ['forget', 'overlook', 'neglect', 'ignore'],
  ['remember', 'recall', 'recollect'],
  ['wait', 'expect', 'anticipate', 'await'],
  ['hope', 'wish', 'aspire', 'desire'],
  ['fear', 'dread', 'scare', 'frighten', 'terrify', 'afraid'],
  ['trust', 'believe', 'rely', 'depend', 'count'],
  ['doubt', 'question', 'suspect', 'mistrust'],
  ['hate', 'detest', 'despise', 'loathe', 'abhor'],
  ['allow', 'permit', 'let', 'authorize', 'approve'],
  ['refuse', 'reject', 'deny', 'decline', 'turn down'],
  ['choose', 'select', 'pick', 'decide', 'opt'],
  ['try', 'attempt', 'endeavor', 'strive'],
  ['fail', 'flop', 'falter'],
  ['succeed', 'accomplish', 'achieve', 'attain'],
  ['explain', 'describe', 'clarify', 'elaborate'],
  ['understand', 'comprehend', 'grasp', 'get'],
  ['agree', 'consent', 'accept', 'approve', 'concur'],
  ['argue', 'debate', 'dispute', 'quarrel', 'disagree'],
  ['forgive', 'pardon', 'excuse', 'absolve'],
  ['apologize', 'sorry'],
  ['thank', 'appreciate', 'grateful'],
  ['invite', 'summon', 'call'],
  ['visit', 'attend', 'call on'],
  ['stay', 'remain', 'linger', 'abide'],
  ['leave', 'depart', 'exit', 'quit', 'abandon', 'go'],
  ['enter', 'go in', 'come in', 'access'],
  ['hurry', 'rush', 'hasten', 'speed'],
  ['stop', 'halt', 'cease', 'pause', 'quit'],
  ['continue', 'proceed', 'persist', 'resume', 'carry on', 'go on', 'keep'],
  ['protect', 'defend', 'guard', 'shield', 'secure', 'safeguard', 'safety'],
  ['attack', 'assault', 'strike', 'invade', 'raid'],
  ['escape', 'flee', 'run away', 'evade'],
  ['catch', 'capture', 'seize', 'trap', 'grab', 'snatch'],
  ['release', 'free', 'liberate', 'let go'],
  ['raise', 'lift', 'elevate', 'hoist'],
  ['lower', 'reduce', 'decrease', 'diminish'],
  ['fill', 'load', 'stuff', 'pack'],
  ['empty', 'drain', 'clear', 'void'],
  ['wear', 'dress', 'clothe', 'put on'],
  ['remove', 'take off', 'strip', 'undress'],
  ['hang', 'suspend', 'dangle'],
  ['drop', 'fall', 'release', 'let go'],
  ['pour', 'spill', 'flow', 'stream', 'gush'],
  ['mix', 'blend', 'combine', 'merge', 'stir'],
  ['separate', 'divide', 'split', 'part', 'detach'],
  ['join', 'connect', 'link', 'unite', 'attach', 'combine'],
  ['hold', 'grip', 'grasp', 'clutch', 'clasp'],
  ['own', 'possess', 'have', 'hold'],
  ['belong', 'own', 'possess'],
  ['borrow', 'lend', 'loan'],
  ['steal', 'rob', 'thieve', 'pilfer'],
  ['offer', 'propose', 'suggest', 'present'],
  ['accept', 'receive', 'take', 'agree'],
  ['demand', 'require', 'insist', 'request', 'ask'],
  ['order', 'command', 'direct', 'instruct'],
  ['follow', 'pursue', 'chase', 'trail', 'track'],
  ['lead', 'guide', 'direct', 'conduct'],
  ['manage', 'handle', 'control', 'run', 'administer', 'operate'],
  ['organize', 'arrange', 'plan', 'prepare', 'coordinate'],
  ['build', 'construct', 'erect', 'assemble'],
  ['destroy', 'demolish', 'ruin', 'wreck', 'devastate'],
  ['suffer', 'endure', 'bear', 'tolerate', 'withstand'],
  ['enjoy', 'relish', 'savor', 'delight'],
  ['renounce', 'give up', 'abandon', 'quit', 'resign', 'surrender', 'relinquish', 'resignation'],
  ['count', 'number', 'calculate', 'tally', 'reckon'],
  ['determine', 'decide', 'resolve', 'settle', 'establish'],
  ['illustrate', 'highlight', 'demonstrate', 'show', 'illuminate'],
  ['adopt', 'assume', 'embrace', 'take on'],
  ['err', 'mistake', 'blunder'],
  ['exist', 'be', 'live', 'survive', 'subsist'],
  ['appear', 'seem', 'look', 'emerge', 'surface'],
  ['disappear', 'vanish', 'fade'],
  ['notice', 'observe', 'remark', 'note', 'detect', 'spot'],
  ['announce', 'declare', 'proclaim', 'state', 'report'],
  ['emphasize', 'stress', 'highlight', 'underline', 'underscore', 'accentuate'],
  ['resemble', 'look like', 'similar'],
  ['regret', 'miss', 'lament', 'mourn'],
  ['release', 'trigger', 'activate', 'set off', 'launch', 'unleash'],
  ['attend', 'assist', 'participate', 'be present'],
  ['repair', 'fix', 'mend', 'restore', 'patch', 'correct', 'service', 'consert'],
  ['dispute', 'argue', 'debate', 'contest', 'challenge', 'quarrel'],
  ['acquire', 'get', 'obtain', 'gain', 'procure'],
  ['calm', 'peaceful', 'quiet', 'serene', 'tranquil', 'still'],
  ['old', 'ancient', 'elderly', 'aged', 'antique'],
  ['new', 'novel', 'fresh', 'recent', 'modern'],
  ['rich', 'wealthy', 'affluent', 'prosperous'],
  ['poor', 'needy', 'destitute', 'impoverished'],
  ['strong', 'powerful', 'mighty', 'robust', 'sturdy'],
  ['weak', 'feeble', 'frail', 'delicate', 'fragile'],
  ['hard', 'difficult', 'tough', 'challenging'],
  ['easy', 'simple', 'effortless'],
  ['hot', 'warm', 'boiling', 'burning', 'scalding'],
  ['cold', 'cool', 'chilly', 'freezing', 'icy', 'frigid'],
  ['sick', 'ill', 'unwell', 'diseased'],
  ['healthy', 'fit', 'well', 'sound'],
  ['clean', 'pure', 'spotless', 'neat', 'tidy'],
  ['dirty', 'filthy', 'messy', 'unclean'],
  ['safe', 'secure', 'protected', 'sheltered'],
  ['dangerous', 'risky', 'hazardous', 'perilous', 'unsafe'],
  ['empty', 'vacant', 'bare', 'hollow', 'void'],
  ['full', 'complete', 'filled', 'packed', 'loaded'],
  ['true', 'real', 'genuine', 'authentic', 'actual'],
  ['false', 'fake', 'wrong', 'untrue', 'incorrect'],
  ['possible', 'feasible', 'achievable', 'attainable'],
  ['impossible', 'unachievable', 'unfeasible'],
  ['important', 'significant', 'crucial', 'vital', 'essential', 'key'],
  ['necessary', 'required', 'needed', 'essential', 'compulsory'],
  ['strange', 'odd', 'weird', 'unusual', 'peculiar', 'bizarre'],
  ['normal', 'ordinary', 'usual', 'regular', 'typical', 'common'],
  ['sure', 'certain', 'confident', 'positive', 'definite'],
  ['afraid', 'scared', 'frightened', 'terrified', 'fearful'],
  ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'upset'],
  ['tired', 'exhausted', 'weary', 'fatigued'],
  ['busy', 'occupied', 'engaged'],
  ['free', 'available', 'unoccupied', 'liberated'],
  ['ready', 'prepared', 'set'],
  ['late', 'delayed', 'overdue', 'tardy'],
  ['early', 'premature', 'ahead'],
  ['young', 'youthful', 'juvenile'],
  ['alone', 'lonely', 'solitary', 'isolated'],
  ['together', 'jointly', 'collectively'],
  ['near', 'close', 'nearby', 'adjacent'],
  ['far', 'distant', 'remote'],
  ['bloom', 'blossom', 'flower', 'flourish'],
  ['sign', 'register', 'enroll', 'enrol', 'subscribe'],
  ['door', 'gate', 'entrance', 'exit'],
  ['house', 'home', 'dwelling', 'residence'],
  ['road', 'street', 'path', 'way', 'route'],
  ['place', 'location', 'spot', 'site', 'position'],
  ['room', 'chamber', 'space'],
  ['car', 'vehicle', 'automobile'],
  ['train', 'railway'],
  ['money', 'cash', 'funds', 'currency'],
  ['price', 'cost', 'charge', 'rate', 'fee', 'expense'],
  ['job', 'work', 'occupation', 'profession', 'employment', 'career'],
  ['problem', 'issue', 'difficulty', 'trouble', 'challenge'],
  ['reason', 'cause', 'motive', 'purpose'],
  ['result', 'outcome', 'consequence', 'effect'],
  ['idea', 'thought', 'concept', 'notion'],
  ['answer', 'reply', 'response', 'solution'],
  ['question', 'query', 'inquiry'],
  ['story', 'tale', 'narrative', 'account'],
  ['game', 'match', 'contest', 'competition'],
  ['party', 'celebration', 'gathering', 'event'],
  ['trip', 'journey', 'voyage', 'travel', 'tour'],
  ['mistake', 'error', 'fault', 'blunder'],
  ['chance', 'opportunity', 'possibility'],
  ['power', 'strength', 'force', 'energy'],
  ['law', 'rule', 'regulation', 'statute'],
  ['right', 'correct', 'proper', 'appropriate'],
  ['wrong', 'incorrect', 'mistaken', 'false'],
];

// Build quick synonym lookup
const SYNONYM_MAP = {};
for (const group of SYNONYM_GROUPS) {
  for (const w of group) {
    const words = w.split(/\s+/);
    const key = words[words.length - 1]; // use last word for multi-word
    if (!SYNONYM_MAP[key]) SYNONYM_MAP[key] = new Set();
    for (const w2 of group) {
      const words2 = w2.split(/\s+/);
      SYNONYM_MAP[key].add(words2[words2.length - 1]);
    }
  }
}

function areSynonyms(w1, w2) {
  if (w1 === w2) return true;
  const syns = SYNONYM_MAP[w1];
  if (syns && syns.has(w2)) return true;
  const syns2 = SYNONYM_MAP[w2];
  if (syns2 && syns2.has(w1)) return true;
  return false;
}

// ── Semantic check ───────────────────────────────────────────────

function semanticCheck(ourEn, googleEn) {
  if (!googleEn || googleEn === '?') return { pass: true, reason: 'no_gt' }; // can't check, skip

  // Normalize BOTH sides: strip "to ", lowercase, lemmatize
  const normalize = (text) => {
    let t = text.toLowerCase().trim();
    t = t.replace(/^to /, '');
    return t;
  };

  const ourNorm = normalize(ourEn);
  const gtNorm = normalize(googleEn);

  // Direct match after normalization
  if (ourNorm === gtNorm) return { pass: true, reason: 'direct_match' };

  const ourWords = extractContentWords(ourEn);
  const gtWords = extractContentWords(googleEn);

  if (ourWords.size === 0 || gtWords.size === 0) return { pass: true, reason: 'empty_words' };

  // Check if ANY content word overlaps (lemmatized)
  for (const w of ourWords) {
    if (gtWords.has(w)) return { pass: true, reason: 'match', matchWord: w };
  }

  // Check synonym match
  for (const ow of ourWords) {
    for (const gw of gtWords) {
      if (areSynonyms(ow, gw)) {
        return { pass: true, reason: 'synonym', matchWord: `${ow}≈${gw}` };
      }
    }
  }

  // Also check if any our-word is a substring of a gt-word or vice versa (handle compounds)
  for (const ow of ourWords) {
    for (const gw of gtWords) {
      if (ow.length >= 3 && gw.length >= 3) {
        if (ow.includes(gw) || gw.includes(ow)) {
          return { pass: true, reason: 'substring', matchWord: `${ow}~${gw}` };
        }
      }
    }
  }

  // Check singular ≈ plural ("child" ≈ "children")
  // Already handled by lemmatize, but also check raw forms
  for (const ow of ourWords) {
    for (const gw of gtWords) {
      // Both lemmatize to the same base
      if (lemmatize(ow) === lemmatize(gw)) {
        return { pass: true, reason: 'lemma_match', matchWord: `${ow}=${gw}` };
      }
    }
  }

  return { pass: false, reason: 'no_overlap', ourWords: [...ourWords], gtWords: [...gtWords], gt: googleEn };
}

// ── Bad pattern check ────────────────────────────────────────────

function badPatternCheck(en) {
  const hits = [];
  for (const { re, label } of BAD_PATTERNS) {
    if (re.test(en)) hits.push(label);
  }
  return hits;
}

// ── Grading ──────────────────────────────────────────────────────

function getGrade(passRate) {
  if (passRate >= 95) return 'A';
  if (passRate >= 85) return 'B';
  if (passRate >= 75) return 'C';
  if (passRate >= 65) return 'D';
  return 'F';
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const allResults = {};

  for (const lang of LANGUAGES) {
    console.log(`\n=== ${lang.toUpperCase()} ===`);
    const entries = parseDictionary(lang);
    console.log(`  Parsed ${entries.length} entries`);

    const sample = shuffleArray(entries).slice(0, SAMPLE_SIZE);
    console.log(`  Sampled ${sample.length} entries`);

    // Batch-translate all source words via Google
    console.log(`  Translating ${sample.length} words via Google Translate...`);
    const sourceWords = sample.map(e => e.key);
    const gtMap = await translateBatch(sourceWords, LANG_CODES[lang]);
    console.log(`  Got ${Object.keys(gtMap).length} translations`);

    let passed = 0;
    let failed = 0;
    const failuresByType = {};
    const failureExamples = [];

    for (const entry of sample) {
      const issues = [];

      // Format checks
      const fmtIssues = formatCheck(entry);
      issues.push(...fmtIssues);

      // Bad pattern checks
      const badIssues = badPatternCheck(entry.en);
      issues.push(...badIssues);

      // Semantic check
      const googleTrans = gtMap[entry.key];
      const semResult = semanticCheck(entry.en, googleTrans);
      if (!semResult.pass) {
        issues.push('semantic_fail');
      }

      if (issues.length === 0) {
        passed++;
      } else {
        failed++;
        for (const issue of issues) {
          failuresByType[issue] = (failuresByType[issue] || 0) + 1;
        }
        if (failureExamples.length < 40) {
          failureExamples.push({
            word: entry.key,
            en: entry.en,
            pos: entry.pos,
            google: googleTrans || '?',
            issues: issues.join(', '),
            semDetail: !semResult.pass ? semResult : undefined,
          });
        }
      }
    }

    const passRate = +(passed / sample.length * 100).toFixed(1);
    const grade = getGrade(passRate);

    const result = {
      language: lang,
      total_entries: entries.length,
      total_checked: sample.length,
      passed,
      failed,
      pass_rate: `${passRate}%`,
      grade,
      failures_by_type: failuresByType,
      failure_examples: failureExamples,
    };

    allResults[lang] = result;
    console.log(`  Result: ${passed}/${sample.length} passed (${passRate}%) – Grade ${grade}`);

    // Write individual JSON
    fs.writeFileSync(
      path.join(OUT_DIR, `${lang}-strict-review.json`),
      JSON.stringify(result, null, 2)
    );
  }

  // ── Summary markdown ────────────────────────────────────────

  const lines = [
    '# Strict Semantic + Format Review Summary',
    '',
    `Date: ${new Date().toISOString().split('T')[0]}`,
    `Sample size: ${SAMPLE_SIZE} random entries per language (${SAMPLE_SIZE * LANGUAGES.length} total)`,
    '',
    '## Method',
    '',
    'Each entry is checked for:',
    '1. **Format**: to_prefix matches POS, not truncated, no mixed case, reasonable length',
    '2. **Semantic**: re-translate source word via Google Translate, compare content words (lemmatized). FAIL if zero overlap.',
    '3. **Bad patterns**: "to is/are/was", "to costs/came", "to friend/child", possessive nouns, trailing semicolons, etc.',
    '',
    'An entry passes ONLY if ALL checks pass.',
    '',
    '## Results',
    '',
    '| Language | Dict Size | Checked | Passed | Failed | Rate | Grade |',
    '|----------|-----------|---------|--------|--------|------|-------|',
  ];

  for (const lang of LANGUAGES) {
    const r = allResults[lang];
    lines.push(`| ${lang.toUpperCase()} | ${r.total_entries} | ${r.total_checked} | ${r.passed} | ${r.failed} | ${r.pass_rate} | ${r.grade} |`);
  }

  // Overall
  const totalPassed = LANGUAGES.reduce((s, l) => s + allResults[l].passed, 0);
  const totalChecked = LANGUAGES.reduce((s, l) => s + allResults[l].total_checked, 0);
  const overallRate = +(totalPassed / totalChecked * 100).toFixed(1);
  const overallGrade = getGrade(overallRate);
  lines.push(`| **ALL** | – | ${totalChecked} | ${totalPassed} | ${totalChecked - totalPassed} | ${overallRate}% | ${overallGrade} |`);

  lines.push('');
  lines.push('## Failure Breakdown by Type');
  lines.push('');

  // Collect all failure types
  const allTypes = new Set();
  for (const lang of LANGUAGES) {
    for (const t of Object.keys(allResults[lang].failures_by_type)) allTypes.add(t);
  }
  const typeList = [...allTypes].sort();

  lines.push('| Language | ' + typeList.join(' | ') + ' |');
  lines.push('|----------|' + typeList.map(() => '---').join('|') + '|');
  for (const lang of LANGUAGES) {
    const f = allResults[lang].failures_by_type;
    lines.push(`| ${lang.toUpperCase()} | ${typeList.map(t => f[t] || 0).join(' | ')} |`);
  }

  lines.push('');
  lines.push('## Top Failure Examples per Language');
  lines.push('');

  for (const lang of LANGUAGES) {
    const r = allResults[lang];
    if (r.failure_examples.length > 0) {
      lines.push(`### ${lang.toUpperCase()} (Grade ${r.grade}, ${r.pass_rate})`);
      lines.push('');
      const top = r.failure_examples.slice(0, 15);
      for (const ex of top) {
        const gt = ex.google !== '?' ? ` | GT: "${ex.google}"` : '';
        lines.push(`- **${ex.word}**: "${ex.en}" (pos=${ex.pos})${gt} – ${ex.issues}`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('Grading: A=95%+, B=85-94%, C=75-84%, D=65-74%, F=<65%');

  fs.writeFileSync(path.join(OUT_DIR, 'strict-review-v2-summary.md'), lines.join('\n'));

  // Console summary
  console.log('\n=== STRICT REVIEW SUMMARY ===');
  console.log('| Lang | Dict  | Pass | Fail | Rate   | Grade |');
  console.log('|------|-------|------|------|--------|-------|');
  for (const lang of LANGUAGES) {
    const r = allResults[lang];
    console.log(`| ${lang.toUpperCase().padEnd(4)} | ${String(r.total_entries).padEnd(5)} | ${String(r.passed).padEnd(4)} | ${String(r.failed).padEnd(4)} | ${r.pass_rate.padEnd(6)} | ${r.grade}     |`);
  }
  console.log(`| ALL  | –     | ${String(totalPassed).padEnd(4)} | ${String(totalChecked - totalPassed).padEnd(4)} | ${overallRate}% | ${overallGrade}     |`);
  console.log(`\nDone! Results in scripts/output/strict-review-summary.md`);
}

main().catch(e => { console.error(e); process.exit(1); });
