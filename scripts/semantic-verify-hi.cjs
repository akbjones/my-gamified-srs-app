#!/usr/bin/env node
/**
 * Semantic verification of EVERY entry in the Hindi dictionary.
 * Sends each source word to Google Translate (hi→en), compares to stored `en`,
 * and replaces mismatches.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src', 'data', 'dictionary', 'hi.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ── Hindi function words to skip (hand-verified pronouns, postpositions, conjunctions, etc.) ──
const FUNCTION_WORDS = new Set([
  // personal pronouns
  'मैं', 'मैंने', 'मुझे', 'मुझको', 'मुझसे', 'मेरा', 'मेरी', 'मेरे',
  'तू', 'तुम', 'तुमने', 'तुम्हें', 'तुम्हारा', 'तुम्हारी', 'तुम्हारे',
  'आप', 'आपने', 'आपको', 'आपका', 'आपकी', 'आपके',
  'वह', 'वो', 'उसने', 'उसे', 'उसको', 'उसका', 'उसकी', 'उसके',
  'यह', 'इसने', 'इसे', 'इसको', 'इसका', 'इसकी', 'इसके',
  'हम', 'हमने', 'हमें', 'हमारा', 'हमारी', 'हमारे',
  'वे', 'उन्होंने', 'उन्हें', 'उनको', 'उनका', 'उनकी', 'उनके',
  'ये', 'इन्होंने', 'इन्हें', 'इनको', 'इनका', 'इनकी', 'इनके',
  // postpositions
  'का', 'की', 'के', 'को', 'से', 'में', 'पर', 'तक', 'ने', 'पे',
  'के लिए', 'की ओर', 'के बारे', 'के साथ', 'के बाद', 'के पहले',
  // conjunctions
  'और', 'या', 'लेकिन', 'पर', 'मगर', 'किन्तु', 'परन्तु',
  'कि', 'जो', 'क्योंकि', 'ताकि', 'अगर', 'जब', 'तब',
  // question words
  'क्या', 'कौन', 'कहाँ', 'कब', 'कैसे', 'क्यों', 'कितना', 'कितनी', 'कितने',
  // demonstratives
  'यह', 'वह', 'ये', 'वे', 'इस', 'उस', 'इन', 'उन',
  // basic particles & auxiliaries
  'है', 'हैं', 'था', 'थी', 'थे', 'थीं', 'हूँ', 'हो',
  'होगा', 'होगी', 'होंगे', 'होता', 'होती', 'होते',
  'सकता', 'सकती', 'सकते',
  'करना', 'करता', 'करती', 'करते', 'करें', 'किया', 'किये',
  'होना', 'रहना', 'जाना', 'देना', 'लेना',
  // negation / affirmation
  'नहीं', 'ना', 'न', 'मत', 'हाँ', 'जी',
  // adverbs / misc function words
  'भी', 'ही', 'तो', 'बस', 'अब', 'फिर', 'सब',
  'बहुत', 'कुछ', 'काफ़ी', 'बिल्कुल',
  'यहाँ', 'वहाँ', 'कहाँ', 'अभी',
  'आज', 'कल', 'अभी', 'पहले', 'बाद',
  // numbers (Hindi digits as words)
  'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
]);

// ── Simple English lemmatizer ──
const IRREGULAR_VERBS = {
  ate: 'eat', eaten: 'eat', eating: 'eat', eats: 'eat',
  ran: 'run', running: 'run', runs: 'run',
  went: 'go', goes: 'go', going: 'go', gone: 'go',
  came: 'come', comes: 'come', coming: 'come',
  took: 'take', takes: 'take', taking: 'take', taken: 'take',
  gave: 'give', gives: 'give', giving: 'give', given: 'give',
  made: 'make', makes: 'make', making: 'make',
  said: 'say', says: 'say', saying: 'say',
  told: 'tell', tells: 'tell', telling: 'tell',
  got: 'get', gets: 'get', getting: 'get', gotten: 'get',
  knew: 'know', knows: 'know', knowing: 'know', known: 'know',
  thought: 'think', thinks: 'think', thinking: 'think',
  found: 'find', finds: 'find', finding: 'find',
  left: 'leave', leaves: 'leave', leaving: 'leave',
  felt: 'feel', feels: 'feel', feeling: 'feel', feelings: 'feeling',
  put: 'put', puts: 'put', putting: 'put',
  brought: 'bring', brings: 'bring', bringing: 'bring',
  began: 'begin', begins: 'begin', beginning: 'begin', begun: 'begin',
  kept: 'keep', keeps: 'keep', keeping: 'keep',
  held: 'hold', holds: 'hold', holding: 'hold',
  wrote: 'write', writes: 'write', writing: 'write', written: 'write',
  stood: 'stand', stands: 'stand', standing: 'stand',
  heard: 'hear', hears: 'hear', hearing: 'hear',
  let: 'let', lets: 'let', letting: 'let',
  meant: 'mean', means: 'mean', meaning: 'mean',
  set: 'set', sets: 'set', setting: 'set',
  met: 'meet', meets: 'meet', meeting: 'meet',
  paid: 'pay', pays: 'pay', paying: 'pay',
  sat: 'sit', sits: 'sit', sitting: 'sit',
  spoke: 'speak', speaks: 'speak', speaking: 'speak', spoken: 'speak',
  led: 'lead', leads: 'lead', leading: 'lead',
  grew: 'grow', grows: 'grow', growing: 'grow', grown: 'grow',
  lost: 'lose', loses: 'lose', losing: 'lose',
  fell: 'fall', falls: 'fall', falling: 'fall', fallen: 'fall',
  sent: 'send', sends: 'send', sending: 'send',
  built: 'build', builds: 'build', building: 'build',
  understood: 'understand', understands: 'understand', understanding: 'understand',
  learned: 'learn', learns: 'learn', learning: 'learn', learnt: 'learn',
  drawn: 'draw', draws: 'draw', drawing: 'draw', drew: 'draw',
  broken: 'break', breaks: 'break', breaking: 'break', broke: 'break',
  spent: 'spend', spends: 'spend', spending: 'spend',
  cut: 'cut', cuts: 'cut', cutting: 'cut',
  caught: 'catch', catches: 'catch', catching: 'catch',
  chosen: 'choose', chooses: 'choose', choosing: 'choose', chose: 'choose',
  worn: 'wear', wears: 'wear', wearing: 'wear', wore: 'wear',
  taught: 'teach', teaches: 'teach', teaching: 'teach',
  bought: 'buy', buys: 'buy', buying: 'buy',
  sold: 'sell', sells: 'sell', selling: 'sell',
  fought: 'fight', fights: 'fight', fighting: 'fight',
  thrown: 'throw', throws: 'throw', throwing: 'throw', threw: 'throw',
  driven: 'drive', drives: 'drive', driving: 'drive', drove: 'drive',
  eaten: 'eat', ridden: 'ride', rides: 'ride', riding: 'ride', rode: 'ride',
  slept: 'sleep', sleeps: 'sleep', sleeping: 'sleep',
  woken: 'wake', wakes: 'wake', waking: 'wake', woke: 'wake',
  swum: 'swim', swims: 'swim', swimming: 'swim', swam: 'swim',
  sung: 'sing', sings: 'sing', singing: 'sing', sang: 'sing',
  drunk: 'drink', drinks: 'drink', drinking: 'drink', drank: 'drink',
  flown: 'fly', flies: 'fly', flying: 'fly', flew: 'fly',
  hidden: 'hide', hides: 'hide', hiding: 'hide', hid: 'hide',
  risen: 'rise', rises: 'rise', rising: 'rise', rose: 'rise',
  shaken: 'shake', shakes: 'shake', shaking: 'shake', shook: 'shake',
  beaten: 'beat', beats: 'beat', beating: 'beat',
  bitten: 'bite', bites: 'bite', biting: 'bite', bit: 'bite',
  blown: 'blow', blows: 'blow', blowing: 'blow', blew: 'blow',
  forgave: 'forgive', forgives: 'forgive', forgiving: 'forgive', forgiven: 'forgive',
  froze: 'freeze', freezes: 'freeze', freezing: 'freeze', frozen: 'freeze',
  hung: 'hang', hangs: 'hang', hanging: 'hang',
  laid: 'lay', lays: 'lay', laying: 'lay',
  lit: 'light', lights: 'light', lighting: 'light',
  rang: 'ring', rings: 'ring', ringing: 'ring', rung: 'ring',
  sought: 'seek', seeks: 'seek', seeking: 'seek',
  shot: 'shoot', shoots: 'shoot', shooting: 'shoot',
  shut: 'shut', shuts: 'shut', shutting: 'shut',
  struck: 'strike', strikes: 'strike', striking: 'strike', stricken: 'strike',
  stuck: 'stick', sticks: 'stick', sticking: 'stick',
  stole: 'steal', steals: 'steal', stealing: 'steal', stolen: 'steal',
  swept: 'sweep', sweeps: 'sweep', sweeping: 'sweep',
  swore: 'swear', swears: 'swear', swearing: 'swear', sworn: 'swear',
  tore: 'tear', tears: 'tear', tearing: 'tear', torn: 'tear',
  wound: 'wind', winds: 'wind', winding: 'wind',
  wove: 'weave', weaves: 'weave', weaving: 'weave', woven: 'weave',
  // common be/have/do
  is: 'be', am: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  does: 'do', did: 'do', done: 'do', doing: 'do',
  // misc
  children: 'child', women: 'woman', men: 'man', people: 'person', mice: 'mouse', teeth: 'tooth', feet: 'foot',
};

function lemmatize(word) {
  word = word.toLowerCase().trim();
  if (IRREGULAR_VERBS[word]) return IRREGULAR_VERBS[word];
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ied') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ing') && word.length > 5) {
    const stem = word.slice(0, -3);
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    if (!word.endsWith('ting') || word.length > 6) {
      const plusE = stem + 'e';
      return plusE;
    }
    return stem;
  }
  if (word.endsWith('ed') && word.length > 4) {
    const stem = word.slice(0, -2);
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    if (!stem.endsWith('e')) {
      const plusE = stem + 'e';
      return stem;
    }
    return stem;
  }
  if (word.endsWith('es') && word.length > 3) {
    if (word.endsWith('shes') || word.endsWith('ches') || word.endsWith('xes') || word.endsWith('sses') || word.endsWith('zzes')) {
      return word.slice(0, -2);
    }
  }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    return word.slice(0, -1);
  }
  if (word.endsWith('ly') && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith('ness') && word.length > 5) {
    return word.slice(0, -4);
  }
  if (word.endsWith('ment') && word.length > 5) {
    return word.slice(0, -4);
  }
  return word;
}

// ── Extract content words (lowercase, strip articles, lemmatize) ──
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up', 'out',
  'and', 'but', 'or', 'not', 'no', 'do', 'does', 'did',
  'has', 'had', 'have', 'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  'it', 'its', 'that', 'this', 'my', 'your', 'his', 'her', 'our', 'their', 'them',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'us',
  'what', 'which', 'who', 'whom', 'whose',
  'so', 'if', 'than', 'then', 'just', 'also', 'very', 'too',
  'as', 'about', 'into', 'through', 'over', 'under', 'between',
  'each', 'every', 'all', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'only', 'own', 'same', 'well', 'how', 'when', 'where', 'why',
  'oneself', 'itself', 'yourself', 'himself', 'herself', 'themselves', 'ourselves',
]);

function extractContentWords(text) {
  const raw = text.toLowerCase()
    .replace(/^to\s+/, '')
    .replace(/[.,;:!?()\/\-"'`]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  const result = new Set();
  for (const w of raw) {
    result.add(w);
    const lem = lemmatize(w);
    if (lem !== w) result.add(lem);
  }
  return result;
}

// ── Parse dictionary entries from hi.ts ──
function parseDictionary() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};
  // Match entries like: 'word': { en: 'translation', ipa: '...', pos: '...' }
  const re = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const word = m[1];
    const body = m[2];
    const entry = {};
    // Handle escaped quotes in en values: en: 'daughter\'s; grandson'
    const enM = body.match(/en:\s*'((?:[^'\\]|\\.)*)'/);
    if (enM) entry.en = enM[1].replace(/\\'/g, "'");
    entry.rawEn = enM ? enM[1] : null; // keep raw (escaped) form for matching
    const ipaM = body.match(/ipa:\s*'([^']*)'/);
    if (ipaM) entry.ipa = ipaM[1];
    const posM = body.match(/pos:\s*'([^']*)'/);
    if (posM) entry.pos = posM[1];
    const lemmaM = body.match(/lemma:\s*'([^']*)'/);
    if (lemmaM) entry.lemma = lemmaM[1];
    entries[word] = entry;
  }
  return { entries, src };
}

// ── Google Translate API ──
function googleTranslate(words, source, target) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams();
    params.append('key', API_KEY);
    params.append('source', source);
    params.append('target', target);
    params.append('format', 'text');
    for (const w of words) params.append('q', w);
    const body = params.toString();
    const options = {
      hostname: 'translation.googleapis.com',
      path: '/language/translate/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error('API error: ' + json.error.message)); return; }
          resolve(json.data.translations.map(t => t.translatedText));
        } catch (e) { reject(new Error('Parse error: ' + e.message + '\nRaw: ' + data.slice(0, 300))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function translateBatches(wordList) {
  const BATCH_SIZE = 80;
  const results = new Map();
  const batches = [];
  for (let i = 0; i < wordList.length; i += BATCH_SIZE) batches.push(wordList.slice(i, i + BATCH_SIZE));
  console.log('Translating ' + wordList.length + ' words in ' + batches.length + ' batches...');
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const translations = await googleTranslate(batch, 'hi', 'en');
      for (let j = 0; j < batch.length; j++) results.set(batch[j], translations[j]);
      if ((i + 1) % 10 === 0 || i === batches.length - 1)
        console.log('  Batch ' + (i + 1) + '/' + batches.length + ' done (' + results.size + ' words)');
    } catch (err) {
      console.error('  Batch ' + (i + 1) + ' failed: ' + err.message);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const translations = await googleTranslate(batch, 'hi', 'en');
        for (let j = 0; j < batch.length; j++) results.set(batch[j], translations[j]);
        console.log('  Batch ' + (i + 1) + ' retry succeeded');
      } catch (err2) {
        console.error('  Batch ' + (i + 1) + ' retry failed: ' + err2.message);
        for (const w of batch) results.set(w, null);
      }
    }
    if (i < batches.length - 1) await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

// ── Compare stored vs Google translation ──
function isSemanticMatch(storedEn, googleEn) {
  const storedWords = extractContentWords(storedEn);
  const googleWords = extractContentWords(googleEn);

  if (storedWords.size === 0 || googleWords.size === 0) return true;

  for (const gw of googleWords) {
    for (const sw of storedWords) {
      if (gw === sw) return true;
      if (gw.length >= 4 && sw.length >= 4) {
        if (gw.startsWith(sw) || sw.startsWith(gw)) return true;
      }
    }
  }
  return false;
}

// ── Proper names and words to skip ──
const SKIP_WORDS = new Set([
  // Hindi proper names commonly in dictionaries
  'अजय', 'अनिल', 'अमित', 'अरुण', 'राम', 'सीता', 'कृष्ण', 'गणेश',
  'राजू', 'रामू', 'मोहन', 'सोहन', 'गीता', 'रीता', 'सुनीता', 'अनीता',
  'दिल्ली', 'मुंबई', 'कोलकाता', 'चेन्नई', 'जयपुर', 'लखनऊ',
  'अंजलि', 'अंबेडकर', 'अजंता', 'गंगा', 'हिमालय',
  'शिव', 'विष्णु', 'ब्रह्मा', 'हनुमान', 'दुर्गा', 'लक्ष्मी', 'पार्वती',
  'दिवाली', 'होली', 'ईद', 'क्रिसमस',
  'भारत', 'हिन्दुस्तान', 'पाकिस्तान', 'नेपाल',
]);

// ── Words where Google Translate gives wrong/worse translations — keep stored definition ──
const DO_NOT_FIX = new Set([
  // Google gives literal translations worse than stored
  'अधजल',     // half-filled (Google: semi-water)
  'अव्वल',    // first; top (Google: topper)
  'कठिनाइयाँ', // difficulty (Google: odds)
  // Hindi verb forms where Google returns English conjugated/wrong forms
  'उतरा',     // descend (Google: landed — past tense)
  'कहती',     // tell (Google: says — 3rd person)
  'कहते',     // tell (Google: says — 3rd person)
  'कही',      // tell — past of कहना (Google: somewhere — confuses with कहीं)
  'गाई',      // to sing — past fem of गाना (Google: cow — confuses with गाय)
  'जाती',     // to go — fem habitual (Google: caste — confuses with जाति)
  'जीता',     // win (Google: won — past tense)
  'जीती',     // win (Google: won — past tense)
  'चुका',     // already — auxiliary (Google: paid — different word)
  'ज़रा',     // a bit (Google: please — wrong)
  'तरफ़',     // towards (Google: on the side — worse)
  'डाली',     // to put/pour — verb form (Google: branch — confuses with noun)
  'पाती',     // to get — verb form (Google: leaf — confuses with noun)
  'गाए',      // cow — plural of गाय (Google: sang — confuses with verb गाना)
]);

// ── Quality filter: reject bad Google translations ──
function isGarbageTranslation(word, googleEn, pos, storedEn) {
  const gLow = googleEn.toLowerCase().trim();
  const wLow = word.toLowerCase();

  // 0. Word is in skip list or do-not-fix list
  if (SKIP_WORDS.has(wLow)) return 'skip-list';
  if (DO_NOT_FIX.has(wLow)) return 'do-not-fix';

  // 1. Google just echoed back the Hindi word (transliteration)
  if (gLow === wLow || gLow.replace(/\s+/g, '') === wLow) return 'echo';

  // 2. Translation starts with pronouns (Google translated a conjugated sentence context)
  if (/^(he |she |i |they |we |it |you |i'm |he's |she's |they're |we're |it's |you're |i am |it is )/i.test(gLow)) return 'pronoun-prefix';

  // 3. Translation contains a period (full sentence, not a word definition)
  if (gLow.includes('.') && gLow.length > 15) return 'sentence';

  // 4. Unreasonably long translation (>60 chars)
  if (gLow.length > 60) return 'too-long';

  // 5. Translation is a proper noun / capitalized (Google sometimes returns place names)
  if (/^[A-Z][a-z]+$/.test(googleEn.trim()) && googleEn.trim().length < 10) {
    return 'proper-noun';
  }

  // 6. Translation is just a number
  if (/^\d+$/.test(gLow)) return 'number';

  // 7. Google returned a past/conjugated form for a verb
  if (pos === 'v') {
    const PAST_FORMS = /^(to )?([\w]+ed|wrote|broke|spoke|drove|gave|took|went|came|got|knew|thought|felt|left|brought|found|told|said|made|sat|stood|met|paid|sent|built|caught|chose|wore|taught|bought|sold|fought|threw|grew|lost|fell|kept|held|began|meant|set|let|heard|led|drew|risen|shaken|beaten|bitten|blown|forgave|froze|hung|laid|lit|rang|sought|shot|shut|struck|stuck|stole|swept|swore|tore|wound|wove)$/i;
    if (PAST_FORMS.test(gLow) && storedEn.startsWith('to ')) return 'past-tense';

    if (/^(took |was |were |had |got |went |came |made |did |gave |said |felt |found |told |kept |held |began |wrote |spoke |drove |knew |thought|left |brought |built |caught |paid |met |sent |sat |stood )/i.test(gLow)) {
      if (storedEn.startsWith('to ')) return 'past-phrase';
    }
  }

  // 8. Very short (1-2 char) translation
  if (gLow.length <= 2) return 'too-short';

  // 9. Google returned Devanagari/Hindi text (not actually translated)
  if (/[\u0900-\u097F]/.test(gLow)) return 'not-translated';

  // 10. Google returned "will [verb]" / "let's [verb]" for Hindi future/subjunctive forms
  if (/^(will |let's |let us |won't |can't )/i.test(gLow)) return 'future-form';

  // 11. Google returned a gerund/participle for a non-gerund entry
  if (/^(by |while )/i.test(gLow)) return 'participle-phrase';

  // 12. Single past-tense word (not already caught by rule 7)
  if (/^(won|sang|ran|sat|dug|led|lay|saw|met|got|had|cut|set|let|bit|hit|put|did|ate|swam|flew|hid|rose|fell|grew|drew|hung|rang|froze|shook|stole|wove|swore|tore|wore|sang|drank|came|gave|bore|rode|blew|spoke|chose|drove|wrote)$/i.test(gLow)) return 'past-single';

  // 13. Google returned "is [adjective/noun]" pattern
  if (/^is /i.test(gLow)) return 'is-prefix';

  // 14. Stored en has apostrophes — complex multi-meaning entries that often break
  if (storedEn.includes("'")) return 'has-apostrophe';

  return null;
}

// ── Post-process a Google translation for dictionary use ──
function postProcess(googleEn, pos, storedEn) {
  let en = googleEn
    .toLowerCase()
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  // Strip leading articles
  en = en.replace(/^(the|a|an)\s+/i, '');

  // Strip leading pronouns
  en = en.replace(/^(he |she |it |they |we |you |i )/i, '');

  // Strip leading "it's " / "that's "
  en = en.replace(/^(it's |that's |it is |that is )/i, '');

  // For verbs, add "to " prefix
  if (pos === 'v' && !en.startsWith('to ')) {
    en = 'to ' + en;
  }

  // For non-verbs, strip "to " if present
  if (pos && pos !== 'v' && en.startsWith('to ')) {
    en = en.replace(/^to\s+/, '');
  }

  // Truncate overly long translations
  if (en.includes(',')) {
    const parts = en.split(',').map(p => p.trim());
    if (parts.length > 2) {
      en = parts.slice(0, 2).join(', ');
    }
  }

  // Strip trailing period
  en = en.replace(/\.\s*$/, '');

  // Clean up
  en = en.replace(/\s+/g, ' ').trim();

  return en;
}

// ── Apply fixes to the actual file ──
function applyFixes(src, fixes) {
  let result = src;
  let applied = 0;

  for (const { word, oldEn, newEn, rawOldEn } of fixes) {
    // Use the raw (escaped) form from the file for matching
    const matchEn = rawOldEn || oldEn;
    const escWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escOldEn = matchEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const pattern = new RegExp(
      `(['"]${escWord}['"]\\s*:\\s*\\{\\s*en:\\s*')${escOldEn}(')`
    );

    if (pattern.test(result)) {
      const safeNewEn = newEn.replace(/'/g, "\\'");
      result = result.replace(pattern, `$1${safeNewEn}$2`);
      applied++;
    } else {
      console.log('  WARNING: Could not find entry for "' + word + '" with en="' + oldEn + '"');
    }
  }

  return { result, applied };
}

// ── Main ──
async function main() {
  console.log('=== Hindi Dictionary: Full Semantic Verification ===\n');

  // Step 1: Parse dictionary
  const { entries, src } = parseDictionary();
  const allWords = Object.keys(entries);
  console.log('Total dictionary entries parsed: ' + allWords.length);

  // Step 2: Filter out function words
  const wordsToCheck = [];
  let skippedFunc = 0;
  let skippedNoEn = 0;
  for (const word of allWords) {
    if (FUNCTION_WORDS.has(word)) { skippedFunc++; continue; }
    if (!entries[word].en) { skippedNoEn++; continue; }
    wordsToCheck.push(word);
  }
  console.log('Function words skipped: ' + skippedFunc);
  console.log('Entries without en skipped: ' + skippedNoEn);
  console.log('Entries to verify: ' + wordsToCheck.length + '\n');

  // Step 3: Translate ALL remaining words via Google
  const translations = await translateBatches(wordsToCheck);
  console.log('\nTranslation complete: ' + translations.size + ' results\n');

  // Step 4: Compare and find mismatches
  const fixes = [];
  let matches = 0;
  let mismatches = 0;
  let skippedNull = 0;
  let skippedGarbage = 0;
  const garbageReasons = {};

  for (const word of wordsToCheck) {
    const googleRaw = translations.get(word);
    if (!googleRaw) { skippedNull++; continue; }

    const storedEn = entries[word].en;
    const pos = entries[word].pos || '';

    if (isSemanticMatch(storedEn, googleRaw)) {
      matches++;
    } else {
      const garbageReason = isGarbageTranslation(word, googleRaw, pos, storedEn);
      if (garbageReason) {
        skippedGarbage++;
        garbageReasons[garbageReason] = (garbageReasons[garbageReason] || 0) + 1;
        continue;
      }

      mismatches++;
      const newEn = postProcess(googleRaw, pos, storedEn);

      // Additional post-process quality check
      if (newEn === storedEn.toLowerCase() || newEn.replace(/^to /, '') === storedEn.replace(/^to /, '').toLowerCase() || newEn.length < 2) {
        matches++; mismatches--;
        continue;
      }

      // Reject bad verb translations after post-processing
      if (pos === 'v') {
        if (/^to (took|was|were|had|got|went|came|made|did|gave|said|felt|found|told|kept|held|began|wrote|spoke|drove|knew|thought|left|brought|built|caught|paid|met|sent|sat|stood|saw|became|would|ran|lost|fell|won|bore|chose|drank|flew|grew|hid|rode|rose|sang|swam|threw|woke|broke|drew|froze|shook|stole|swore|tore)($| )/i.test(newEn)) {
          skippedGarbage++;
          garbageReasons['post-past-phrase'] = (garbageReasons['post-past-phrase'] || 0) + 1;
          mismatches--;
          continue;
        }
        if (/^to \w+ing(\s|$)/i.test(newEn)) {
          skippedGarbage++;
          garbageReasons['post-gerund'] = (garbageReasons['post-gerund'] || 0) + 1;
          mismatches--;
          continue;
        }
        if (/^to \w+s$/i.test(newEn) && !/(ss|us|ous|ious|ness)$/i.test(newEn)) {
          skippedGarbage++;
          garbageReasons['post-3rd-person'] = (garbageReasons['post-3rd-person'] || 0) + 1;
          mismatches--;
          continue;
        }
      }

      // Reject if Google's raw result is a proper noun
      if (/^[A-Z][a-z]+$/.test(googleRaw.trim()) || /prometheus|amman|amara/i.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-proper-raw'] = (garbageReasons['post-proper-raw'] || 0) + 1;
        mismatches--;
        continue;
      }

      // Reject if result looks like a proper noun
      if (/^(to )?[A-Z]/.test(newEn) && !/^(to )?[A-Z][a-z]+ [a-z]/.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-proper'] = (garbageReasons['post-proper'] || 0) + 1;
        mismatches--;
        continue;
      }

      // Reject conditionals
      if (/^(to )?(would |could |should )/i.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-conditional'] = (garbageReasons['post-conditional'] || 0) + 1;
        mismatches--;
        continue;
      }

      // Reject "to will ...", "to let's ...", "to let us ..."
      if (/^to (will |let's |let us |won't |can't |don't |didn't |doesn't |isn't |aren't )/i.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-future-modal'] = (garbageReasons['post-future-modal'] || 0) + 1;
        mismatches--;
        continue;
      }

      // Reject "to [past participle]" patterns like "to dug", "to seen", "to bit", "to drunk"
      if (/^to (dug|seen|bit|bitten|drunk|sung|swum|flown|drawn|worn|torn|born|borne|sewn|sown|shown|known|grown|blown|thrown|frozen|chosen|spoken|stolen|broken|woken|risen|driven|ridden|written|hidden|shaken|beaten|eaten|fallen|forgotten|gotten|given|taken|begun|done|gone|come|become|run|hung|sat|set|cut|put|shut|hit|let|shed|split|spread|quit|rid|burst|cost|cast|hurt)$/i.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-past-participle'] = (garbageReasons['post-past-participle'] || 0) + 1;
        mismatches--;
        continue;
      }

      // Reject "to by ..." (e.g. "to by purchasing")
      if (/^to by /i.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-by-phrase'] = (garbageReasons['post-by-phrase'] || 0) + 1;
        mismatches--;
        continue;
      }

      // Reject if newEn contains "'s" (corrupted apostrophe from stored en)
      if (newEn.includes("'s") && !/ 's /.test(newEn)) {
        // Check if this looks like a possessive artifact
        if (/\w+'s$/.test(newEn) || /\w+'s;/.test(newEn)) {
          skippedGarbage++;
          garbageReasons['post-possessive-artifact'] = (garbageReasons['post-possessive-artifact'] || 0) + 1;
          mismatches--;
          continue;
        }
      }

      fixes.push({ word, oldEn: storedEn, newEn, googleRaw, rawOldEn: entries[word].rawEn });
    }
  }

  console.log('=== Comparison Results ===');
  console.log('Matches (stored definition OK): ' + matches);
  console.log('Mismatches (will fix): ' + mismatches);
  console.log('Skipped (translation failed): ' + skippedNull);
  console.log('Skipped (garbage Google translation): ' + skippedGarbage);
  if (Object.keys(garbageReasons).length > 0) {
    console.log('  Garbage reasons: ' + JSON.stringify(garbageReasons));
  }

  if (fixes.length > 0) {
    // Show sample fixes
    console.log('\n--- Sample fixes (first 30) ---');
    for (const f of fixes.slice(0, 30)) {
      console.log('  ' + f.word + ': "' + f.oldEn + '" -> "' + f.newEn + '" (Google: "' + f.googleRaw + '")');
    }

    // Step 5: Apply fixes to file
    console.log('\nApplying ' + fixes.length + ' fixes to hi.ts...');
    const { result, applied } = applyFixes(src, fixes);
    console.log('Successfully applied: ' + applied + '/' + fixes.length);

    fs.writeFileSync(DICT_PATH, result, 'utf8');
    console.log('File written: ' + DICT_PATH);
  }

  console.log('\n=== SUMMARY ===');
  console.log('Total entries checked: ' + wordsToCheck.length);
  console.log('Semantic matches: ' + matches);
  console.log('Mismatches fixed: ' + fixes.length);
  console.log('\nHINDI COMPLETE — ' + fixes.length + ' fixes');
}

main().catch(err => {
  console.error('FATAL: ' + err.message);
  console.error(err.stack);
  process.exit(1);
});
