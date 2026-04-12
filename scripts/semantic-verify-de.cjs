#!/usr/bin/env node
/**
 * Semantic verification of EVERY entry in the German dictionary.
 * Sends each source word to Google Translate (de→en), compares to stored `en`,
 * and replaces mismatches.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src', 'data', 'dictionary', 'de.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ── German function words to skip (~200: articles, pronouns, prepositions, auxiliaries, modals, conjunctions) ──
const FUNCTION_WORDS = new Set([
  // articles / determiners
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines',
  // contractions (from CONTRACTION_MAP in de.ts)
  'im', 'am', 'vom', 'zum', 'zur', 'ins', 'ans', 'aufs', 'fürs', 'ums',
  'beim', 'durchs', 'übers', 'unters', 'vors', 'hinters',
  // personal pronouns
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
  'mich', 'dich', 'ihn', 'uns', 'euch',
  'mir', 'dir', 'ihm', 'ihnen',
  // reflexive
  'sich',
  // possessives
  'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines',
  'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines',
  'sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines',
  'unser', 'unsere', 'unseren', 'unserem', 'unserer', 'unseres',
  'euer', 'eure', 'euren', 'eurem', 'eurer', 'eures',
  // demonstratives
  'dieser', 'diese', 'dieses', 'diesen', 'diesem',
  'jener', 'jene', 'jenes', 'jenen', 'jenem',
  'solcher', 'solche', 'solches', 'solchen', 'solchem',
  'derselbe', 'dieselbe', 'dasselbe',
  // interrogatives / relatives
  'wer', 'wen', 'wem', 'wessen',
  'was', 'welcher', 'welche', 'welches', 'welchen', 'welchem',
  'wo', 'wie', 'wann', 'warum', 'weshalb', 'wieso', 'woher', 'wohin',
  'wozu', 'wobei', 'woran', 'worauf', 'woraus', 'worin', 'worüber', 'wovon',
  // indefinites
  'man', 'jemand', 'niemand',
  'alle', 'alles', 'aller', 'allen', 'allem',
  'jeder', 'jede', 'jedes', 'jeden', 'jedem',
  'einige', 'einiger', 'einiges', 'einigen', 'einigem',
  'manche', 'mancher', 'manches', 'manchen', 'manchem',
  'mehrere', 'beide',
  'etwas', 'nichts',
  // prepositions
  'ab', 'an', 'auf', 'aus', 'bei', 'bis', 'durch', 'für', 'gegen',
  'hinter', 'in', 'mit', 'nach', 'neben', 'ohne', 'seit', 'über',
  'um', 'unter', 'von', 'vor', 'während', 'wegen', 'zu', 'zwischen',
  'statt', 'trotz', 'außer', 'gegenüber', 'gemäß', 'laut', 'samt',
  'entlang', 'innerhalb', 'außerhalb', 'oberhalb', 'unterhalb',
  'diesseits', 'jenseits', 'anstatt', 'anhand', 'aufgrund', 'infolge',
  'mittels', 'zwecks', 'bezüglich', 'hinsichtlich',
  // conjunctions
  'und', 'oder', 'aber', 'denn', 'sondern', 'doch', 'jedoch', 'weder',
  'noch', 'sowohl', 'als', 'ob', 'wenn', 'weil', 'dass', 'damit',
  'obwohl', 'obgleich', 'obschon', 'falls', 'sofern', 'bevor', 'nachdem',
  'sobald', 'solange', 'seitdem', 'indem', 'sodass', 'zumal',
  'je', 'desto', 'umso', 'entweder',
  // auxiliaries / modals (infinitives + key conjugated forms)
  'haben', 'habe', 'hast', 'hat', 'habt', 'hatte', 'hätte',
  'sein', 'bin', 'bist', 'ist', 'sind', 'seid', 'war', 'wäre',
  'werden', 'werde', 'wirst', 'wird', 'werdet', 'wurde', 'würde',
  'können', 'kann', 'kannst', 'könnt', 'konnte', 'könnte',
  'müssen', 'muss', 'musst', 'müsst', 'musste', 'müsste',
  'dürfen', 'darf', 'darfst', 'dürft', 'durfte', 'dürfte',
  'sollen', 'soll', 'sollst', 'sollt', 'sollte',
  'wollen', 'will', 'willst', 'wollt', 'wollte',
  'mögen', 'mag', 'magst', 'mögt', 'mochte', 'möchte', 'möchten',
  // high-frequency adverbs / particles
  'nicht', 'ja', 'nein', 'schon', 'noch', 'auch', 'nur', 'sehr',
  'hier', 'da', 'dort', 'hin', 'her', 'oben', 'unten',
  'jetzt', 'heute', 'gestern', 'morgen', 'immer', 'nie', 'niemals',
  'viel', 'wenig', 'mehr', 'weniger', 'ganz', 'gar',
  'so', 'dann', 'also', 'zwar', 'mal', 'eben', 'halt',
  'wohl', 'vielleicht', 'bitte', 'danke',
  'fast', 'kaum', 'genug', 'ziemlich', 'bereits', 'bald',
  // numbers
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf',
  'sechs', 'sieben', 'acht', 'neun', 'zehn',
  // misc
  'es', 'selbst', 'sogar',
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
  is: 'be', am: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  does: 'do', did: 'do', done: 'do', doing: 'do',
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
      return stem + 'e';
    }
    return stem;
  }
  if (word.endsWith('ed') && word.length > 4) {
    const stem = word.slice(0, -2);
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    if (!stem.endsWith('e')) {
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

// ── Parse dictionary entries from de.ts (uses `const DICT`) ──
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
    const enM = body.match(/en:\s*'([^']*)'/);
    if (enM) entry.en = enM[1];
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
      const translations = await googleTranslate(batch, 'de', 'en');
      for (let j = 0; j < batch.length; j++) results.set(batch[j], translations[j]);
      if ((i + 1) % 10 === 0 || i === batches.length - 1)
        console.log('  Batch ' + (i + 1) + '/' + batches.length + ' done (' + results.size + ' words)');
    } catch (err) {
      console.error('  Batch ' + (i + 1) + ' failed: ' + err.message);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const translations = await googleTranslate(batch, 'de', 'en');
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

// ── German-specific skip words (proper nouns, short ambiguous words) ──
const SKIP_WORDS = new Set([
  // Very short ambiguous words where Google is unreliable
  'da', 'so', 'ja', 'oh', 'na', 'eh', 'nu', 'je', 'ob',
  // Common German words that are also English words (Google may just echo)
  'arm', 'ball', 'brief', 'bus', 'chance', 'chef', 'chip', 'clan',
  'clip', 'club', 'code', 'deal', 'design', 'display', 'doping', 'drama',
  'drink', 'ego', 'elite', 'event', 'extra', 'fan', 'film', 'fit',
  'fix', 'form', 'forum', 'gang', 'gel', 'generation', 'genre',
  'global', 'golf', 'grill', 'hand', 'image', 'interview', 'jazz',
  'job', 'kick', 'laptop', 'laser', 'last', 'limit', 'live', 'logo',
  'manager', 'marketing', 'medium', 'menu', 'meter', 'mobbing', 'mode',
  'moment', 'monitor', 'motto', 'museum', 'name', 'natur', 'note',
  'okay', 'online', 'option', 'organ', 'partner', 'party', 'pause',
  'person', 'phase', 'plan', 'plus', 'port', 'position', 'post',
  'power', 'problem', 'profil', 'programm', 'projekt', 'protest',
  'quiz', 'radio', 'rap', 'reform', 'region', 'reporter', 'ring',
  'risiko', 'rolle', 'routine', 'show', 'signal', 'single', 'ski',
  'slogan', 'snack', 'software', 'solo', 'sport', 'star', 'start',
  'station', 'status', 'stress', 'studio', 'stunt', 'style', 'system',
  'talent', 'team', 'technik', 'test', 'theater', 'thema', 'ticket',
  'timer', 'ton', 'top', 'tour', 'trainer', 'training', 'trend',
  'trick', 'typ', 'version', 'video', 'virus', 'yoga', 'zone',
]);

// ── Quality filter: reject bad Google translations ──
function isGarbageTranslation(word, googleEn, pos, storedEn) {
  const gLow = googleEn.toLowerCase().trim();
  const wLow = word.toLowerCase();

  if (SKIP_WORDS.has(wLow)) return 'skip-list';

  // Google echoed back the German word
  if (gLow === wLow || gLow.replace(/\s+/g, '') === wLow) return 'echo';

  // Translation starts with pronouns
  if (/^(he |she |i |they |we |it |you |i'm |he's |she's |they're |we're |it's |you're |i am |it is )/i.test(gLow)) return 'pronoun-prefix';

  // Translation contains a period (full sentence)
  if (gLow.includes('.') && gLow.length > 15) return 'sentence';

  // Unreasonably long
  if (gLow.length > 60) return 'too-long';

  // Proper noun
  if (/^[A-Z][a-z]+$/.test(googleEn.trim()) && googleEn.trim().length < 10) return 'proper-noun';

  // Just a number
  if (/^\d+$/.test(gLow)) return 'number';

  // Past tense for verbs
  if (pos === 'v') {
    const PAST_FORMS = /^(to )?([\w]+ed|wrote|broke|spoke|drove|gave|took|went|came|got|knew|thought|felt|left|brought|found|told|said|made|sat|stood|met|paid|sent|built|caught|chose|wore|taught|bought|sold|fought|threw|grew|lost|fell|kept|held|began|meant|set|let|heard|led|drew|risen|shaken|beaten|bitten|blown|forgave|froze|hung|laid|lit|rang|sought|shot|shut|struck|stuck|stole|swept|swore|tore|wound|wove)$/i;
    if (PAST_FORMS.test(gLow) && storedEn.startsWith('to ')) return 'past-tense';

    if (/^(took |was |were |had |got |went |came |made |did |gave |said |felt |found |told |kept |held |began |wrote |spoke |drove |knew |thought|left |brought |built |caught |paid |met |sent |sat |stood )/i.test(gLow)) {
      if (storedEn.startsWith('to ')) return 'past-phrase';
    }
  }

  // Very short
  if (gLow.length <= 2) return 'too-short';

  return null;
}

// ── Post-process a Google translation ──
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

  // Strip "it's " / "that's "
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

  en = en.replace(/\s+/g, ' ').trim();

  return en;
}

// ── Apply fixes to the actual file ──
function applyFixes(src, fixes) {
  let result = src;
  let applied = 0;

  for (const { word, oldEn, newEn } of fixes) {
    const escWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escOldEn = oldEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  console.log('=== German Dictionary: Full Semantic Verification ===\n');

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

      // Post-process quality check
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

      // Reject proper nouns
      if (/^[A-Z][a-z]+$/.test(googleRaw.trim()) || /prometheus|amman|amara/i.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-proper-raw'] = (garbageReasons['post-proper-raw'] || 0) + 1;
        mismatches--;
        continue;
      }

      if (/^(to )?[A-Z]/.test(newEn) && !/^(to )?[A-Z][a-z]+ [a-z]/.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-proper'] = (garbageReasons['post-proper'] || 0) + 1;
        mismatches--;
        continue;
      }

      // Reject conditional
      if (/^(to )?(would |could |should )/i.test(newEn)) {
        skippedGarbage++;
        garbageReasons['post-conditional'] = (garbageReasons['post-conditional'] || 0) + 1;
        mismatches--;
        continue;
      }

      fixes.push({ word, oldEn: storedEn, newEn, googleRaw });
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
    console.log('\n--- Sample fixes (first 30) ---');
    for (const f of fixes.slice(0, 30)) {
      console.log('  ' + f.word + ': "' + f.oldEn + '" -> "' + f.newEn + '" (Google: "' + f.googleRaw + '")');
    }

    // Step 5: Apply fixes to file
    console.log('\nApplying ' + fixes.length + ' fixes to de.ts...');
    const { result, applied } = applyFixes(src, fixes);
    console.log('Successfully applied: ' + applied + '/' + fixes.length);

    fs.writeFileSync(DICT_PATH, result, 'utf8');
    console.log('File written: ' + DICT_PATH);
  }

  console.log('\n=== SUMMARY ===');
  console.log('Total entries checked: ' + wordsToCheck.length);
  console.log('Semantic matches: ' + matches);
  console.log('Mismatches fixed: ' + fixes.length);
  console.log('\nGERMAN COMPLETE — ' + fixes.length + ' fixes');
}

main().catch(err => {
  console.error('FATAL: ' + err.message);
  console.error(err.stack);
  process.exit(1);
});
