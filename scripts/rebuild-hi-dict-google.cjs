#!/usr/bin/env node
/**
 * Rebuild Hindi dictionary using Google Translate as PRIMARY source.
 * Hand-verified function words are never sent to Google.
 * Output: scripts/output/hi-google-rebuild.json + hi-google-rebuild-preview.md
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/hi.ts');
const DECK_PATH = path.join(ROOT, 'src/data/hindi/deck.json');
const OUT_DIR = path.join(ROOT, 'scripts/output');
const API_KEY = process.env.GOOGLE_TTS_KEY;

// ── Step 1: Hand-verified function words ─────────────────────
const FUNCTION_WORDS = {
  'मैं': 'I', 'मुझे': 'me, to me', 'मेरा': 'my', 'मेरी': 'my', 'मेरे': 'my',
  'तुम': 'you', 'तुम्हें': 'you, to you', 'तुम्हारा': 'your', 'तुम्हारी': 'your', 'तुम्हारे': 'your',
  'आप': 'you (formal)', 'आपका': 'your', 'आपकी': 'your', 'आपके': 'your',
  'वह': 'he, she, that', 'वे': 'they, those', 'यह': 'this', 'ये': 'these, they',
  'हम': 'we', 'हमारा': 'our', 'हमारी': 'our', 'हमारे': 'our',
  'उसका': 'his, her', 'उसकी': 'his, her', 'उसके': 'his, her',
  'उनका': 'their', 'उनकी': 'their', 'उनके': 'their',
  'इसका': 'its', 'इसकी': 'its', 'इसके': 'its',
  'कौन': 'who', 'क्या': 'what', 'कहाँ': 'where', 'कब': 'when', 'कैसे': 'how', 'क्यों': 'why',
  'कितना': 'how much', 'कितने': 'how many', 'कितनी': 'how much',
  'में': 'in', 'पर': 'on, at', 'को': 'to', 'से': 'from, by, with', 'का': 'of',
  'की': 'of', 'के': 'of', 'तक': 'until, up to', 'लिए': 'for',
  'बिना': 'without', 'साथ': 'with, together', 'बारे': 'about', 'बाद': 'after',
  'पहले': 'before, first', 'बीच': 'between, middle', 'ऊपर': 'above, up',
  'नीचे': 'below, down', 'अंदर': 'inside', 'बाहर': 'outside',
  'पास': 'near, have', 'दूर': 'far', 'यहाँ': 'here', 'वहाँ': 'there',
  'और': 'and', 'या': 'or', 'लेकिन': 'but', 'मगर': 'but', 'कि': 'that',
  'अगर': 'if', 'तो': 'then', 'भी': 'also, too', 'ही': 'only, just, itself',
  'न': 'not', 'नहीं': 'no, not', 'मत': 'don\'t', 'हाँ': 'yes', 'जी': 'yes, sir/ma\'am',
  'है': 'is', 'हैं': 'are', 'था': 'was', 'थी': 'was', 'थे': 'were', 'थीं': 'were',
  'हूँ': 'am', 'हो': 'are',
  'रहा': '-ing (m.)', 'रही': '-ing (f.)', 'रहे': '-ing (pl.)',
  'गया': 'gone, did (m.)', 'गई': 'gone, did (f.)', 'गए': 'gone, did (pl.)',
  'सकता': 'can (m.)', 'सकती': 'can (f.)', 'सकते': 'can (pl.)',
  'चाहिए': 'should, need', 'वाला': '-er, one who', 'वाली': '-er (f.)', 'वाले': '-ers',
  'बहुत': 'very, much', 'हमेशा': 'always', 'कभी': 'ever, sometimes',
  'अभी': 'right now', 'आज': 'today', 'कल': 'yesterday, tomorrow',
  'अक्सर': 'often', 'फिर': 'then, again', 'सिर्फ़': 'only', 'बस': 'just, enough',
  'सब': 'all, everyone', 'कुछ': 'some, something', 'कोई': 'someone, any',
  'एक': 'one, a', 'दो': 'two', 'तीन': 'three', 'चार': 'four', 'पाँच': 'five',
  'छह': 'six', 'सात': 'seven', 'आठ': 'eight', 'नौ': 'nine', 'दस': 'ten',
  'सौ': 'hundred', 'हज़ार': 'thousand', 'लाख': 'hundred thousand',
  'हर': 'every', 'सारे': 'all', 'इस': 'this', 'उस': 'that',
  'जो': 'who, which', 'कई': 'several', 'ज़रा': 'a little, please',
  'अच्छा': 'good, nice', 'बुरा': 'bad', 'बड़ा': 'big', 'छोटा': 'small',
  'नया': 'new', 'पुराना': 'old', 'ज़्यादा': 'more', 'कम': 'less',
  'तभी': 'only then', 'इसलिए': 'therefore',
  'शायद': 'maybe', 'ज़रूर': 'definitely', 'अचानक': 'suddenly',
  'धीरे': 'slowly', 'जल्दी': 'quickly',
  'वापस': 'back', 'सीधे': 'straight', 'ठीक': 'fine, correct',
};

// ── Parse dictionary from .ts file ───────────────────────────
function parseDictionary() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};

  // Match each entry: 'key': { en: '...', ipa: '...', pos: '...'[, lemma: '...'] }
  const entryRe = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  // Also match double-quoted keys
  const entryRe2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;

  function parseBody(body) {
    const obj = {};
    // en
    const enM = body.match(/en:\s*'([^']*)'/);
    if (enM) obj.en = enM[1];
    else {
      const enM2 = body.match(/en:\s*"([^"]*)"/);
      if (enM2) obj.en = enM2[1];
    }
    // ipa
    const ipaM = body.match(/ipa:\s*'([^']*)'/);
    if (ipaM) obj.ipa = ipaM[1];
    else {
      const ipaM2 = body.match(/ipa:\s*"([^"]*)"/);
      if (ipaM2) obj.ipa = ipaM2[1];
    }
    // pos
    const posM = body.match(/pos:\s*'([^']*)'/);
    if (posM) obj.pos = posM[1];
    else {
      const posM2 = body.match(/pos:\s*"([^"]*)"/);
      if (posM2) obj.pos = posM2[1];
    }
    // lemma
    const lemmaM = body.match(/lemma:\s*'([^']*)'/);
    if (lemmaM) obj.lemma = lemmaM[1];
    else {
      const lemmaM2 = body.match(/lemma:\s*"([^"]*)"/);
      if (lemmaM2) obj.lemma = lemmaM2[1];
    }
    return obj;
  }

  let m;
  while ((m = entryRe.exec(src)) !== null) {
    entries[m[1]] = parseBody(m[2]);
  }
  while ((m = entryRe2.exec(src)) !== null) {
    entries[m[1]] = parseBody(m[2]);
  }

  return entries;
}

// ── Load deck ────────────────────────────────────────────────
function loadDeck() {
  return JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
}

// ── Google Translate batch ───────────────────────────────────
function googleTranslateBatch(words) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=hi&target=en&${qParams}`;

    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Google API error: ${json.error.message}`));
            return;
          }
          const translations = json.data.translations.map(t => t.translatedText);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nBody: ${data.slice(0, 500)}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Post-processing ──────────────────────────────────────────
function decodeHtmlEntities(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// Irregular past → base verb mappings
const IRREGULAR_VERBS = {
  'went': 'go', 'gone': 'go', 'goes': 'go', 'going': 'go',
  'came': 'come', 'comes': 'come', 'coming': 'come',
  'made': 'make', 'makes': 'make', 'making': 'make',
  'ate': 'eat', 'eats': 'eat', 'eaten': 'eat', 'eating': 'eat',
  'drank': 'drink', 'drinks': 'drink', 'drunk': 'drink', 'drinking': 'drink',
  'slept': 'sleep', 'sleeps': 'sleep', 'sleeping': 'sleep',
  'sat': 'sit', 'sits': 'sit', 'sitting': 'sit',
  'ran': 'run', 'runs': 'run', 'running': 'run',
  'spoke': 'speak', 'speaks': 'speak', 'spoken': 'speak', 'speaking': 'speak',
  'wrote': 'write', 'writes': 'write', 'written': 'write', 'writing': 'write',
  'read': 'read', 'reads': 'read', 'reading': 'read',
  'saw': 'see', 'sees': 'see', 'seen': 'see', 'seeing': 'see',
  'did': 'do', 'does': 'do', 'done': 'do', 'doing': 'do',
  'gave': 'give', 'gives': 'give', 'given': 'give', 'giving': 'give',
  'took': 'take', 'takes': 'take', 'taken': 'take', 'taking': 'take',
  'got': 'get', 'gets': 'get', 'gotten': 'get', 'getting': 'get',
  'knew': 'know', 'knows': 'know', 'known': 'know', 'knowing': 'know',
  'thought': 'think', 'thinks': 'think', 'thinking': 'think',
  'told': 'tell', 'tells': 'tell', 'telling': 'tell',
  'said': 'say', 'says': 'say', 'saying': 'say',
  'found': 'find', 'finds': 'find', 'finding': 'find',
  'kept': 'keep', 'keeps': 'keep', 'keeping': 'keep',
  'left': 'leave', 'leaves': 'leave', 'leaving': 'leave',
  'brought': 'bring', 'brings': 'bring', 'bringing': 'bring',
  'sent': 'send', 'sends': 'send', 'sending': 'send',
  'built': 'build', 'builds': 'build', 'building': 'build',
  'fell': 'fall', 'falls': 'fall', 'fallen': 'fall', 'falling': 'fall',
  'stood': 'stand', 'stands': 'stand', 'standing': 'stand',
  'put': 'put', 'puts': 'put', 'putting': 'put',
  'held': 'hold', 'holds': 'hold', 'holding': 'hold',
  'began': 'begin', 'begins': 'begin', 'begun': 'begin', 'beginning': 'begin',
  'broke': 'break', 'breaks': 'break', 'broken': 'break', 'breaking': 'break',
  'bought': 'buy', 'buys': 'buy', 'buying': 'buy',
  'sold': 'sell', 'sells': 'sell', 'selling': 'sell',
  'caught': 'catch', 'catches': 'catch', 'catching': 'catch',
  'taught': 'teach', 'teaches': 'teach', 'teaching': 'teach',
  'chose': 'choose', 'chooses': 'choose', 'chosen': 'choose', 'choosing': 'choose',
  'drew': 'draw', 'draws': 'draw', 'drawn': 'draw', 'drawing': 'draw',
  'drove': 'drive', 'drives': 'drive', 'driven': 'drive', 'driving': 'drive',
  'flew': 'fly', 'flies': 'fly', 'flown': 'fly', 'flying': 'fly',
  'forgot': 'forget', 'forgets': 'forget', 'forgotten': 'forget', 'forgetting': 'forget',
  'grew': 'grow', 'grows': 'grow', 'grown': 'grow', 'growing': 'grow',
  'heard': 'hear', 'hears': 'hear', 'hearing': 'hear',
  'hid': 'hide', 'hides': 'hide', 'hidden': 'hide', 'hiding': 'hide',
  'hit': 'hit', 'hits': 'hit', 'hitting': 'hit',
  'hung': 'hang', 'hangs': 'hang', 'hanging': 'hang',
  'led': 'lead', 'leads': 'lead', 'leading': 'lead',
  'lent': 'lend', 'lends': 'lend', 'lending': 'lend',
  'lost': 'lose', 'loses': 'lose', 'losing': 'lose',
  'met': 'meet', 'meets': 'meet', 'meeting': 'meet',
  'paid': 'pay', 'pays': 'pay', 'paying': 'pay',
  'rode': 'ride', 'rides': 'ride', 'ridden': 'ride', 'riding': 'ride',
  'rose': 'rise', 'rises': 'rise', 'risen': 'rise', 'rising': 'rise',
  'sang': 'sing', 'sings': 'sing', 'sung': 'sing', 'singing': 'sing',
  'sank': 'sink', 'sinks': 'sink', 'sunk': 'sink', 'sinking': 'sink',
  'shook': 'shake', 'shakes': 'shake', 'shaken': 'shake', 'shaking': 'shake',
  'shot': 'shoot', 'shoots': 'shoot', 'shooting': 'shoot',
  'showed': 'show', 'shows': 'show', 'shown': 'show', 'showing': 'show',
  'shut': 'shut', 'shuts': 'shut', 'shutting': 'shut',
  'spent': 'spend', 'spends': 'spend', 'spending': 'spend',
  'stole': 'steal', 'steals': 'steal', 'stolen': 'steal', 'stealing': 'steal',
  'struck': 'strike', 'strikes': 'strike', 'striking': 'strike',
  'swam': 'swim', 'swims': 'swim', 'swum': 'swim', 'swimming': 'swim',
  'threw': 'throw', 'throws': 'throw', 'thrown': 'throw', 'throwing': 'throw',
  'understood': 'understand', 'understands': 'understand', 'understanding': 'understand',
  'woke': 'wake', 'wakes': 'wake', 'woken': 'wake', 'waking': 'wake',
  'wore': 'wear', 'wears': 'wear', 'worn': 'wear', 'wearing': 'wear',
  'won': 'win', 'wins': 'win', 'winning': 'win',
  'lived': 'live', 'lives': 'live', 'living': 'live',
  'played': 'play', 'plays': 'play', 'played': 'play', 'playing': 'play',
  'worked': 'work', 'works': 'work', 'working': 'work',
  'walked': 'walk', 'walks': 'walk', 'walking': 'walk',
  'talked': 'talk', 'talks': 'talk', 'talking': 'talk',
  'looked': 'look', 'looks': 'look', 'looking': 'look',
  'asked': 'ask', 'asks': 'ask', 'asking': 'ask',
  'wanted': 'want', 'wants': 'want', 'wanting': 'want',
  'used': 'use', 'uses': 'use', 'using': 'use',
  'tried': 'try', 'tries': 'try', 'trying': 'try',
  'needed': 'need', 'needs': 'need', 'needing': 'need',
  'moved': 'move', 'moves': 'move', 'moving': 'move',
  'opened': 'open', 'opens': 'open', 'opening': 'open',
  'closed': 'close', 'closes': 'close', 'closing': 'close',
  'turned': 'turn', 'turns': 'turn', 'turning': 'turn',
  'started': 'start', 'starts': 'start', 'starting': 'start',
  'called': 'call', 'calls': 'call', 'calling': 'call',
  'helped': 'help', 'helps': 'help', 'helping': 'help',
  'stopped': 'stop', 'stops': 'stop', 'stopping': 'stop',
  'changed': 'change', 'changes': 'change', 'changing': 'change',
  'followed': 'follow', 'follows': 'follow', 'following': 'follow',
  'believed': 'believe', 'believes': 'believe', 'believing': 'believe',
  'carried': 'carry', 'carries': 'carry', 'carrying': 'carry',
  'picked': 'pick', 'picks': 'pick', 'picking': 'pick',
  'waited': 'wait', 'waits': 'wait', 'waiting': 'wait',
  'served': 'serve', 'serves': 'serve', 'serving': 'serve',
  'died': 'die', 'dies': 'die', 'dying': 'die',
  'raised': 'raise', 'raises': 'raise', 'raising': 'raise',
  'passed': 'pass', 'passes': 'pass', 'passing': 'pass',
  'reached': 'reach', 'reaches': 'reach', 'reaching': 'reach',
  'cut': 'cut', 'cuts': 'cut', 'cutting': 'cut',
  'set': 'set', 'sets': 'set', 'setting': 'set',
  'washed': 'wash', 'washes': 'wash', 'washing': 'wash',
  'cooked': 'cook', 'cooks': 'cook', 'cooking': 'cook',
  'cleaned': 'clean', 'cleans': 'clean', 'cleaning': 'clean',
  'danced': 'dance', 'dances': 'dance', 'dancing': 'dance',
  'filled': 'fill', 'fills': 'fill', 'filling': 'fill',
  'saved': 'save', 'saves': 'save', 'saving': 'save',
  'feared': 'fear', 'fears': 'fear', 'fearing': 'fear',
  'laughed': 'laugh', 'laughs': 'laugh', 'laughing': 'laugh',
  'cried': 'cry', 'cries': 'cry', 'crying': 'cry',
  'burned': 'burn', 'burns': 'burn', 'burnt': 'burn', 'burning': 'burn',
};

function toBaseVerb(word) {
  const lower = word.toLowerCase();
  if (IRREGULAR_VERBS[lower]) return IRREGULAR_VERBS[lower];
  // Regular -ed, -ing, -s
  if (lower.endsWith('ing')) {
    const base = lower.slice(0, -3);
    if (base.length >= 3) return base.endsWith('e') ? base : base;
    // try adding 'e': dancing -> danc -> dance
    return base + 'e';
  }
  if (lower.endsWith('ed')) {
    const base = lower.slice(0, -2);
    if (base.length >= 3) return base;
    return base + 'e';
  }
  if (lower.endsWith('es') && !lower.endsWith('ses')) {
    return lower.slice(0, -2);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    return lower.slice(0, -1);
  }
  return lower;
}

function postProcess(translation, hindiWord, pos, isProperNounInCards) {
  let t = decodeHtmlEntities(translation).trim();

  // If Google returned the Hindi word unchanged → transliteration / proper noun
  if (t === hindiWord || /^[\u0900-\u097F]/.test(t)) {
    return { text: t, isTransliteration: true };
  }

  // Lowercase first letter unless proper noun
  if (!isProperNounInCards && t.length > 0) {
    t = t[0].toLowerCase() + t.slice(1);
  }

  // For verbs: ensure starts with "to "
  if (pos === 'v') {
    if (!t.startsWith('to ')) {
      // Try to convert conjugated form to base
      const words = t.split(/\s+/);
      const firstWord = words[0];
      const base = toBaseVerb(firstWord);
      if (words.length === 1) {
        t = 'to ' + base;
      } else {
        // Multi-word: take first meaningful verb
        t = 'to ' + base;
      }
    }
  }

  // If >3 words, trim to core meaning
  const wordCount = t.split(/\s+/).length;
  if (wordCount > 3 && pos !== 'v') {
    // Remove articles and prepositions from start
    const trimmed = t.replace(/^(the|a|an|in|on|at|of|to|for|with|by|from|it is|it's|i am|i'm)\s+/gi, '');
    if (trimmed.split(/\s+/).length <= 3) {
      t = trimmed[0].toLowerCase() + trimmed.slice(1);
    } else {
      // Take first 2-3 meaningful words
      const meaningful = trimmed.split(/\s+/).filter(w =>
        !['the', 'a', 'an', 'in', 'on', 'at', 'of', 'is', 'are', 'was', 'were', 'it', 'i'].includes(w.toLowerCase())
      );
      if (meaningful.length > 0) {
        t = meaningful.slice(0, 2).join(' ');
        t = t[0].toLowerCase() + t.slice(1);
      }
    }
  }

  // For verbs, also trim "to X Y Z" → "to X" if too many words after "to"
  if (pos === 'v' && t.startsWith('to ')) {
    const afterTo = t.slice(3).split(/\s+/);
    if (afterTo.length > 2) {
      t = 'to ' + afterTo[0];
    }
  }

  // Cap at 50 chars
  if (t.length > 50) {
    t = t.slice(0, 47) + '...';
  }

  return { text: t, isTransliteration: false };
}

// ── Validation against card English ──────────────────────────
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'has', 'have', 'had', 'do', 'does', 'did',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  'and', 'or', 'but', 'not', 'no', 'yes',
  'if', 'then', 'so', 'as', 'than', 'very', 'too', 'also',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'shall',
  'up', 'out', 'about', 'into', 'over', 'after', 'before',
]);

function extractContentWords(text) {
  return text.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function buildWordToCardsIndex(deck) {
  // Build index: hindi word → list of cards containing it
  const index = {};
  for (const card of deck) {
    const hindiWords = card.target.replace(/[।,?!\.;:'"()]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    for (const w of hindiWords) {
      if (!index[w]) index[w] = [];
      index[w].push(card);
    }
  }
  return index;
}

function validateEntry(newEn, hindiWord, wordCardsIndex) {
  const cards = wordCardsIndex[hindiWord] || [];
  if (cards.length < 2) return false;

  const contentWords = extractContentWords(newEn);
  if (contentWords.length === 0) return false;

  // Each content word must appear in at least 2 different cards' English
  for (const cw of contentWords) {
    let matchCount = 0;
    for (const card of cards) {
      const cardWords = card.english.toLowerCase().split(/\s+/);
      if (cardWords.some(w => w.replace(/[^a-z]/g, '').includes(cw) || cw.includes(w.replace(/[^a-z]/g, '')))) {
        matchCount++;
        if (matchCount >= 2) break;
      }
    }
    if (matchCount >= 2) return true;
  }
  return false;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('Parsing dictionary...');
  const dict = parseDictionary();
  const allKeys = Object.keys(dict);
  console.log(`  ${allKeys.length} entries found`);

  // Filter out non-Devanagari entries (English words at top of dict)
  const devanagariKeys = allKeys.filter(k => /[\u0900-\u097F]/.test(k));
  const nonDevanagariKeys = allKeys.filter(k => !/[\u0900-\u097F]/.test(k));
  console.log(`  ${devanagariKeys.length} Devanagari entries, ${nonDevanagariKeys.length} non-Devanagari (skipped)`);

  console.log('Loading deck...');
  const deck = loadDeck();
  console.log(`  ${deck.length} cards`);

  const wordCardsIndex = buildWordToCardsIndex(deck);

  // Separate function words from Google words
  const functionWordEntries = [];
  const googleWordEntries = [];

  for (const key of devanagariKeys) {
    if (FUNCTION_WORDS[key] !== undefined) {
      functionWordEntries.push(key);
    } else {
      googleWordEntries.push(key);
    }
  }

  console.log(`  ${functionWordEntries.length} function word entries (hand-verified)`);
  console.log(`  ${googleWordEntries.length} entries to send to Google Translate`);

  // Step 1: Process function words
  const results = [];
  for (const key of functionWordEntries) {
    const entry = dict[key];
    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: FUNCTION_WORDS[key],
      source: 'function_table',
      validated: true,
      pos: entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  // Step 2: Google Translate in batches
  const BATCH_SIZE = 80;
  const DELAY = 200;
  const googleResults = {}; // word → translation

  console.log(`\nSending ${googleWordEntries.length} words to Google Translate in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < googleWordEntries.length; i += BATCH_SIZE) {
    const batch = googleWordEntries.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(googleWordEntries.length / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} words)...`);

    try {
      const translations = await googleTranslateBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        googleResults[batch[j]] = translations[j];
      }
      console.log(' done');
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      // Mark these as failed
      for (const w of batch) {
        googleResults[w] = null;
      }
    }

    if (i + BATCH_SIZE < googleWordEntries.length) {
      await sleep(DELAY);
    }
  }

  // Step 3: Post-process Google results
  console.log('\nPost-processing Google results...');

  // Build a set of proper nouns from cards (capitalized words in target that have capitalized English)
  const properNouns = new Set();
  for (const card of deck) {
    const targetWords = card.target.split(/\s+/);
    const engWords = card.english.split(/\s+/);
    // Check if any English word is capitalized (not first word)
    for (let i = 1; i < engWords.length; i++) {
      if (/^[A-Z]/.test(engWords[i])) {
        // Try to find corresponding Hindi word
        for (const tw of targetWords) {
          if (dict[tw]) properNouns.add(tw);
        }
      }
    }
  }

  const googleProcessed = {};
  for (const key of googleWordEntries) {
    const entry = dict[key];
    const rawTranslation = googleResults[key];

    if (rawTranslation === null || rawTranslation === undefined) {
      // API failed – keep old
      googleProcessed[key] = { text: entry.en || '?', isTransliteration: false, failed: true };
      continue;
    }

    const processed = postProcess(rawTranslation, key, entry.pos, properNouns.has(key));
    googleProcessed[key] = processed;
  }

  // Step 4 & 5: Build results for Google words, handle lemma entries
  // First pass: collect lemma base translations
  const lemmaTranslations = {};
  for (const key of googleWordEntries) {
    if (!dict[key].lemma) {
      lemmaTranslations[key] = googleProcessed[key].text;
    }
  }
  // Also add function words as potential lemma bases
  for (const key of functionWordEntries) {
    lemmaTranslations[key] = FUNCTION_WORDS[key];
  }

  for (const key of googleWordEntries) {
    const entry = dict[key];
    const processed = googleProcessed[key];

    let newEn = processed.text;
    let source = processed.failed ? 'google_failed' : 'google';

    // Step 5: If has lemma, try to copy from lemma's translation
    if (entry.lemma && lemmaTranslations[entry.lemma]) {
      newEn = lemmaTranslations[entry.lemma];
      source = 'lemma_copy';
    }

    // Step 4: Validate against cards
    const validated = validateEntry(newEn, key, wordCardsIndex);

    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: newEn,
      source,
      validated,
      pos: entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  // Also add non-Devanagari entries unchanged
  for (const key of nonDevanagariKeys) {
    const entry = dict[key];
    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: entry.en || '?',
      source: 'skipped_non_devanagari',
      validated: false,
      pos: entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  // ── Step 7: Output ──────────────────────────────────────────
  console.log('\nWriting output files...');

  // JSON output
  const jsonPath = path.join(OUT_DIR, 'hi-google-rebuild.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`  ${jsonPath}`);

  // Stats
  const sourceBreakdown = {};
  let validatedCount = 0;
  let flaggedCount = 0;
  let changedCount = 0;

  for (const r of results) {
    sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
    if (r.validated) validatedCount++;
    if (!r.validated && r.source !== 'skipped_non_devanagari' && r.source !== 'function_table') flaggedCount++;
    if (r.old_en !== r.new_en) changedCount++;
  }

  // Preview: 200 random samples
  const devanagariResults = results.filter(r => r.source !== 'skipped_non_devanagari');
  const shuffled = [...devanagariResults].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, 200);

  let md = `# Hindi Dictionary Google Rebuild – Preview (200 random samples)\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries:** ${results.length}\n`;
  md += `**Changed:** ${changedCount}\n`;
  md += `**Source breakdown:**\n`;
  for (const [src, count] of Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])) {
    md += `- ${src}: ${count}\n`;
  }
  md += `**Validated:** ${validatedCount} / ${devanagariResults.length} (${(100 * validatedCount / devanagariResults.length).toFixed(1)}%)\n`;
  md += `**Flagged (not validated, non-function):** ${flaggedCount}\n\n`;

  md += `| # | Word | Old EN | New EN | Source | Valid |\n`;
  md += `|---|------|--------|--------|--------|-------|\n`;
  sample.forEach((r, i) => {
    const oldE = r.old_en.replace(/\|/g, '\\|');
    const newE = r.new_en.replace(/\|/g, '\\|');
    md += `| ${i + 1} | ${r.word} | ${oldE} | ${newE} | ${r.source} | ${r.validated ? 'Y' : 'N'} |\n`;
  });

  const mdPath = path.join(OUT_DIR, 'hi-google-rebuild-preview.md');
  fs.writeFileSync(mdPath, md);
  console.log(`  ${mdPath}`);

  // Print summary
  console.log('\n═══ SUMMARY ═══');
  console.log(`Total entries: ${results.length}`);
  console.log(`Changed: ${changedCount}`);
  console.log('Source breakdown:');
  for (const [src, count] of Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${count}`);
  }
  console.log(`Validated: ${validatedCount} / ${devanagariResults.length} (${(100 * validatedCount / devanagariResults.length).toFixed(1)}%)`);
  console.log(`Flagged: ${flaggedCount}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
