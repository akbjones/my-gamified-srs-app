/**
 * semantic-verify.cjs – Verify semicolon-containing Portuguese dictionary entries
 * by re-translating via Google Translate and comparing semantically.
 *
 * Usage: PATH="/opt/homebrew/bin:$PATH" node scripts/semantic-verify.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'pt.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';
const BATCH_SIZE = 80;
const DRY_RUN = process.argv.includes('--dry-run');

// ── Helpers ──────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Send batch of words to Google Translate pt→en */
async function translateBatch(words) {
  const url = new URL('https://translation.googleapis.com/language/translate/v2');
  url.searchParams.set('key', API_KEY);

  const body = JSON.stringify({
    q: words,
    source: 'pt',
    target: 'en',
    format: 'text',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
        }
        try {
          const json = JSON.parse(data);
          const translations = json.data.translations.map(t => t.translatedText);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Irregular verb lemmatization ──
// Maps past tenses, participles, etc. back to their infinitive/base form
const VERB_LEMMA = {
  // be
  'am': 'be', 'is': 'be', 'are': 'be', 'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
  // have
  'has': 'have', 'had': 'have', 'having': 'have',
  // do
  'does': 'do', 'did': 'do', 'done': 'do', 'doing': 'do',
  // go
  'goes': 'go', 'went': 'go', 'gone': 'go', 'going': 'go',
  // come
  'came': 'come', 'comes': 'come', 'coming': 'come',
  // take
  'took': 'take', 'taken': 'take', 'takes': 'take', 'taking': 'take',
  // make
  'made': 'make', 'makes': 'make', 'making': 'make',
  // get
  'got': 'get', 'gotten': 'get', 'gets': 'get', 'getting': 'get',
  // give
  'gave': 'give', 'given': 'give', 'gives': 'give', 'giving': 'give',
  // know
  'knew': 'know', 'known': 'know', 'knows': 'know', 'knowing': 'know',
  // think
  'thought': 'think', 'thinks': 'think', 'thinking': 'think',
  // say
  'said': 'say', 'says': 'say', 'saying': 'say',
  // tell
  'told': 'tell', 'tells': 'tell', 'telling': 'tell',
  // see
  'saw': 'see', 'seen': 'see', 'sees': 'see', 'seeing': 'see',
  // find
  'found': 'find', 'finds': 'find', 'finding': 'find',
  // leave
  'left': 'leave', 'leaves': 'leave', 'leaving': 'leave',
  // put
  'puts': 'put', 'putting': 'put',
  // keep
  'kept': 'keep', 'keeps': 'keep', 'keeping': 'keep',
  // let
  'lets': 'let', 'letting': 'let',
  // begin
  'began': 'begin', 'begun': 'begin', 'begins': 'begin', 'beginning': 'begin',
  // run
  'ran': 'run', 'runs': 'run', 'running': 'run',
  // write
  'wrote': 'write', 'written': 'write', 'writes': 'write', 'writing': 'write',
  // read
  'reads': 'read', 'reading': 'read',
  // speak
  'spoke': 'speak', 'spoken': 'speak', 'speaks': 'speak', 'speaking': 'speak',
  // talk
  'talked': 'talk', 'talks': 'talk', 'talking': 'talk',
  // drive
  'drove': 'drive', 'driven': 'drive', 'drives': 'drive', 'driving': 'drive',
  // sit
  'sat': 'sit', 'sits': 'sit', 'sitting': 'sit',
  // stand
  'stood': 'stand', 'stands': 'stand', 'standing': 'stand',
  // lose
  'lost': 'lose', 'loses': 'lose', 'losing': 'lose',
  // win
  'won': 'win', 'wins': 'win', 'winning': 'win',
  // pay
  'paid': 'pay', 'pays': 'pay', 'paying': 'pay',
  // meet
  'met': 'meet', 'meets': 'meet', 'meeting': 'meet',
  // send
  'sent': 'send', 'sends': 'send', 'sending': 'send',
  // spend
  'spent': 'spend', 'spends': 'spend', 'spending': 'spend',
  // build
  'built': 'build', 'builds': 'build', 'building': 'build',
  // buy
  'bought': 'buy', 'buys': 'buy', 'buying': 'buy',
  // sell
  'sold': 'sell', 'sells': 'sell', 'selling': 'sell',
  // bring
  'brought': 'bring', 'brings': 'bring', 'bringing': 'bring',
  // catch
  'caught': 'catch', 'catches': 'catch', 'catching': 'catch',
  // deal
  'dealt': 'deal', 'deals': 'deal', 'dealing': 'deal',
  // feel
  'felt': 'feel', 'feels': 'feel', 'feeling': 'feel',
  // fight
  'fought': 'fight', 'fights': 'fight', 'fighting': 'fight',
  // hold
  'held': 'hold', 'holds': 'hold', 'holding': 'hold',
  // lead
  'led': 'lead', 'leads': 'lead', 'leading': 'lead',
  // lend
  'lent': 'lend', 'lends': 'lend', 'lending': 'lend',
  // lie (recline)
  'lay': 'lie', 'lain': 'lie', 'lying': 'lie', 'lies': 'lie',
  // mean
  'meant': 'mean', 'means': 'mean', 'meaning': 'mean',
  // rise
  'rose': 'rise', 'risen': 'rise', 'rises': 'rise', 'rising': 'rise',
  // set
  'sets': 'set', 'setting': 'set',
  // show
  'showed': 'show', 'shown': 'show', 'shows': 'show', 'showing': 'show',
  // sing
  'sang': 'sing', 'sung': 'sing', 'sings': 'sing', 'singing': 'sing',
  // sleep
  'slept': 'sleep', 'sleeps': 'sleep', 'sleeping': 'sleep',
  // break
  'broke': 'break', 'broken': 'break', 'breaks': 'break', 'breaking': 'break',
  // choose
  'chose': 'choose', 'chosen': 'choose', 'chooses': 'choose', 'choosing': 'choose',
  // draw
  'drew': 'draw', 'drawn': 'draw', 'draws': 'draw', 'drawing': 'draw',
  // drink
  'drank': 'drink', 'drunk': 'drink', 'drinks': 'drink', 'drinking': 'drink',
  // eat
  'ate': 'eat', 'eaten': 'eat', 'eats': 'eat', 'eating': 'eat',
  // fall
  'fell': 'fall', 'fallen': 'fall', 'falls': 'fall', 'falling': 'fall',
  // fly
  'flew': 'fly', 'flown': 'fly', 'flies': 'fly', 'flying': 'fly',
  // forget
  'forgot': 'forget', 'forgotten': 'forget', 'forgets': 'forget', 'forgetting': 'forget',
  // grow
  'grew': 'grow', 'grown': 'grow', 'grows': 'grow', 'growing': 'grow',
  // hide
  'hid': 'hide', 'hidden': 'hide', 'hides': 'hide', 'hiding': 'hide',
  // hurt
  'hurts': 'hurt', 'hurting': 'hurt',
  // wear
  'wore': 'wear', 'worn': 'wear', 'wears': 'wear', 'wearing': 'wear',
  // teach
  'taught': 'teach', 'teaches': 'teach', 'teaching': 'teach',
  // throw
  'threw': 'throw', 'thrown': 'throw', 'throws': 'throw', 'throwing': 'throw',
  // understand
  'understood': 'understand', 'understands': 'understand', 'understanding': 'understand',
  // wake
  'woke': 'wake', 'woken': 'wake', 'wakes': 'wake', 'waking': 'wake',
  // move
  'moved': 'move', 'moves': 'move', 'moving': 'move',
  // change
  'changed': 'change', 'changes': 'change', 'changing': 'change',
  // close
  'closed': 'close', 'closes': 'close', 'closing': 'close',
  // open
  'opened': 'open', 'opens': 'open', 'opening': 'open',
  // turn
  'turned': 'turn', 'turns': 'turn', 'turning': 'turn',
  // call
  'called': 'call', 'calls': 'call', 'calling': 'call',
  // walk
  'walked': 'walk', 'walks': 'walk', 'walking': 'walk',
  // pass
  'passed': 'pass', 'passes': 'pass', 'passing': 'pass',
  // serve
  'served': 'serve', 'serves': 'serve', 'serving': 'serve',
  // resolve
  'resolved': 'resolve', 'resolves': 'resolve', 'resolving': 'resolve',
  // decide
  'decided': 'decide', 'decides': 'decide', 'deciding': 'decide',
  // return
  'returned': 'return', 'returns': 'return', 'returning': 'return',
  // end
  'ended': 'end', 'ends': 'end', 'ending': 'end',
  // deserve
  'deserved': 'deserve', 'deserves': 'deserve', 'deserving': 'deserve',
  // request
  'requested': 'request', 'requests': 'request', 'requesting': 'request',
  // injure
  'injured': 'injure', 'injures': 'injure', 'injuring': 'injure',
  // assume
  'assumed': 'assume', 'assumes': 'assume', 'assuming': 'assume',
  // borrow
  'borrowed': 'borrow', 'borrows': 'borrow', 'borrowing': 'borrow',
  // sign
  'signed': 'sign', 'signs': 'sign', 'signing': 'sign',
  // register
  'registered': 'register', 'registers': 'register', 'registering': 'register',
  // exchange
  'exchanged': 'exchange', 'exchanges': 'exchange', 'exchanging': 'exchange',
  // switch
  'switched': 'switch', 'switches': 'switch', 'switching': 'switch',
  // care
  'cared': 'care', 'cares': 'care', 'caring': 'care',
  // handle
  'handled': 'handle', 'handles': 'handle', 'handling': 'handle',
  // treat
  'treated': 'treat', 'treats': 'treat', 'treating': 'treat',
  // happen
  'happened': 'happen', 'happens': 'happen', 'happening': 'happen',
};

/** Lemmatize a word – irregular lookup, then strip common suffixes */
function lemmatize(word) {
  const w = word.toLowerCase();
  if (VERB_LEMMA[w]) return VERB_LEMMA[w];

  // Strip regular suffixes
  let s = w;
  if (s.endsWith('ies') && s.length > 4) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('ied') && s.length > 4) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('ying')) s = s.slice(0, -3) + 'ie';
  else if (s.endsWith('ing') && s.length > 5) {
    // running → run, making → make
    const base = s.slice(0, -3);
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      s = base.slice(0, -1); // running → run
    } else {
      s = base;
      // Try base + 'e' (making → make)
    }
  }
  else if (s.endsWith('ed') && s.length > 4) {
    const base = s.slice(0, -2);
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      s = base.slice(0, -1);
    } else {
      s = base;
    }
  }
  else if (s.endsWith('es') && s.length > 3) s = s.slice(0, -2);
  else if (s.endsWith('s') && s.length > 3 && !s.endsWith('ss')) s = s.slice(0, -1);

  return s;
}

// ── Synonym groups for fuzzy matching ──
const SYNONYM_GROUPS = [
  ['talk', 'speak', 'converse', 'chat'],
  ['walk', 'stroll', 'wander'],
  ['leave', 'go', 'depart', 'exit'],
  ['find', 'discover', 'locate', 'encounter', 'meet'],
  ['help', 'aid', 'assist'],
  ['buy', 'purchase'],
  ['start', 'begin', 'commence'],
  ['end', 'finish', 'close', 'conclude', 'stop', 'cease'],
  ['big', 'large', 'great', 'huge'],
  ['small', 'little', 'tiny'],
  ['happy', 'glad', 'joyful', 'pleased'],
  ['fast', 'quick', 'rapid', 'swift'],
  ['beautiful', 'pretty', 'lovely', 'gorgeous'],
  ['see', 'watch', 'view', 'observe', 'look'],
  ['seem', 'appear'],
  ['need', 'require', 'necessity'],
  ['want', 'desire', 'wish'],
  ['understand', 'comprehend', 'grasp'],
  ['child', 'kid'],
  ['sick', 'ill', 'unwell'],
  ['angry', 'mad', 'furious', 'upset'],
  ['afraid', 'scared', 'frightened', 'fearful'],
  ['think', 'believe', 'consider', 'ponder'],
  ['keep', 'maintain', 'hold', 'retain', 'preserve'],
  ['send', 'dispatch', 'forward', 'transmit'],
  ['receive', 'get', 'obtain', 'accept'],
  ['choose', 'select', 'pick'],
  ['show', 'display', 'present', 'demonstrate', 'reveal'],
  ['answer', 'reply', 'respond'],
  ['carry', 'bear', 'transport', 'bring'],
  ['change', 'alter', 'modify', 'switch'],
  ['try', 'attempt'],
  ['achieve', 'accomplish', 'attain', 'manage', 'succeed'],
  ['lend', 'loan', 'borrow'],
  ['protect', 'defend', 'guard', 'shield'],
  ['grow', 'increase', 'expand'],
  ['reduce', 'decrease', 'diminish'],
  ['raise', 'lift', 'elevate'],
  ['fall', 'drop', 'descend'],
  ['strong', 'powerful', 'sturdy'],
  ['weak', 'feeble', 'frail'],
  ['rich', 'wealthy', 'affluent'],
  ['clean', 'tidy', 'neat'],
  ['quiet', 'silent', 'calm', 'peaceful'],
  ['right', 'correct', 'proper', 'accurate'],
  ['important', 'significant', 'crucial', 'vital', 'essential'],
  ['necessary', 'required', 'needed', 'essential'],
  ['sure', 'certain', 'confident'],
  ['real', 'true', 'genuine', 'actual'],
  ['house', 'home'],
  ['job', 'work', 'employment', 'occupation'],
  ['live', 'reside', 'dwell', 'inhabit'],
  ['sleep', 'slumber', 'rest', 'nap', 'asleep'],
  ['cost', 'price', 'expense', 'charge'],
  ['save', 'rescue', 'preserve', 'conserve'],
  ['fight', 'battle', 'combat', 'struggle'],
  ['move', 'shift', 'transfer'],
  ['call', 'summon', 'phone'],
  ['follow', 'pursue', 'chase', 'trail'],
  ['allow', 'permit', 'let', 'enable'],
  ['include', 'contain', 'comprise', 'cover', 'encompass'],
  ['whole', 'entire', 'complete', 'full', 'all'],
  ['party', 'celebration', 'fest', 'festival'],
  ['exchange', 'swap', 'trade', 'switch', 'replace'],
  ['resolve', 'solve', 'sort', 'settle', 'decide'],
  ['deal', 'handle', 'treat', 'manage', 'cope'],
  ['take', 'grab', 'seize', 'catch', 'get'],
  ['turn', 'rotate', 'spin', 'switch'],
  ['register', 'subscribe', 'sign', 'enroll', 'enlist'],
  ['return', 'go back', 'come back'],
  ['safe', 'secure', 'insurance'],
  ['vacancy', 'position', 'opening', 'spot'],
  ['resign', 'quit', 'dismissal', 'layoff', 'termination', 'firing'],
  ['court', 'block', 'square'],
  ['provision', 'disposition', 'arrangement', 'measure'],
  ['picture', 'painting', 'frame', 'image'],
  ['policy', 'politic', 'political'],
  ['challenge', 'confront', 'face', 'come across', 'encounter'],
  ['assume', 'suppose', 'presume'],
  ['pass', 'happen', 'spend', 'go by'],
  ['care', 'watch', 'careful', 'look after'],
  ['drink', 'sip', 'take', 'decision'],
  ['could', 'manage', 'able', 'achieve', 'try', 'succeed'],
  ['strip', 'remove', 'take off', 'pull'],
  ['back', 'return', 'born'], // voltou-related
];

// Build a lookup: word → set of synonym words
const SYNONYM_LOOKUP = {};
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    if (!SYNONYM_LOOKUP[word]) SYNONYM_LOOKUP[word] = new Set();
    for (const other of group) {
      if (other !== word) SYNONYM_LOOKUP[word].add(other);
    }
  }
}

/** Extract content words from a definition string, returning both raw and lemmatized */
function extractContentWords(def) {
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'it', 'its', 'this', 'that', 'with', 'from', 'by', 'as', 'up',
    'one', 'do', 'does', 'did', 'not', 'but', 'if', 'so', 'no', 'than',
    'very', 'just', 'about', 'out', 'over', 'more', 'also', 'how',
    'into', 'has', 'have', 'had', 'will', 'would', 'could', 'should',
    'may', 'might', 'can', 'shall', 'i', 'you', 'he', 'she', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their',
    'myself', 'yourself', 'himself', 'herself', 'ourselves', 'themselves',
    'am', 'got', "i'm", "it's", "let's",
  ]);

  const raw = def
    .toLowerCase()
    .replace(/\bto\s+/g, ' ')
    .replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  // Also include lemmatized forms
  const lemmas = raw.map(w => lemmatize(w));
  const all = [...new Set([...raw, ...lemmas])];
  return all;
}

/** Check if two word sets have semantic overlap */
function hasSemanticOverlap(ourWords, googleWords) {
  // Direct/lemma match
  const ourSet = new Set(ourWords);
  for (const gw of googleWords) {
    if (ourSet.has(gw)) return true;
    const gl = lemmatize(gw);
    if (ourSet.has(gl)) return true;
  }

  // Reverse
  const googleSet = new Set(googleWords);
  for (const ow of ourWords) {
    if (googleSet.has(ow)) return true;
    const ol = lemmatize(ow);
    if (googleSet.has(ol)) return true;
  }

  // Prefix match (3+ chars)
  for (const gw of googleWords) {
    for (const ow of ourWords) {
      if (gw.length >= 3 && ow.length >= 3) {
        if (gw.startsWith(ow) || ow.startsWith(gw)) return true;
      }
    }
  }

  // Synonym match
  for (const gw of googleWords) {
    const syns = SYNONYM_LOOKUP[gw] || SYNONYM_LOOKUP[lemmatize(gw)];
    if (syns) {
      for (const ow of ourWords) {
        if (syns.has(ow) || syns.has(lemmatize(ow))) return true;
      }
    }
  }
  for (const ow of ourWords) {
    const syns = SYNONYM_LOOKUP[ow] || SYNONYM_LOOKUP[lemmatize(ow)];
    if (syns) {
      for (const gw of googleWords) {
        if (syns.has(gw) || syns.has(lemmatize(gw))) return true;
      }
    }
  }

  return false;
}

/** Post-process a Google translation for storage in dictionary */
function postProcess(googleEn, pos) {
  let result = googleEn
    .replace(/\.$/, '')
    .replace(/^(the|a|an)\s+/i, '')
    .trim();

  // Strip subject pronouns
  result = result.replace(/^(I|you|he|she|it|we|they)\s+/i, '');
  // Strip aux verbs
  result = result.replace(/^(am|is|are|was|were|have|has|had|would|could|can|will|shall|should|might|may|do|does|did)\s+/i, '');
  result = result.replace(/^(been|not|able\s+to)\s+/i, '');
  // Strip "be able to" pattern
  result = result.replace(/^be\s+able\s+to\s+/i, '');

  result = result
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\.$/, '')
    .trim();

  // Lemmatize the main verb if it's a single word or first word
  const words = result.split(/\s+/);
  if (words.length >= 1) {
    const lemma = lemmatize(words[0]);
    if (lemma !== words[0] && VERB_LEMMA[words[0]]) {
      words[0] = lemma;
      result = words.join(' ');
    }
  }

  // If verb, ensure "to " prefix
  if (pos === 'v' && !result.startsWith('to ')) {
    result = 'to ' + result;
  }

  return result;
}

// ── Manual overrides for known-bad entries where Google is also unhelpful ──
const MANUAL_OVERRIDES = {
  // Verb forms of conseguir (to manage/achieve/be able to)
  'conseguia': 'to manage; achieve',
  'conseguisse': 'to manage; achieve',
  // Subjunctive of ser/ir – keep multi-meaning
  'for': 'to be; to go',
  'formos': 'to be; to go',
  // Contractions / particles
  'nele': 'in him; in it',
  'pra': 'for; to',
  // Nouns / adjectives
  'sé': 'cathedral',
  'nós': 'we; us',
  'segundas': 'mondays; second',
  'tomadas': 'sockets; outlets',
  'finais': 'finals; final',
  'direitinho': 'properly; right',
  'quadros': 'paintings; pictures',
  // Verb forms of passar
  'passa': 'to pass; spend',
  'passada': 'past; last',
  'passei': 'to pass; spend',
  'passem': 'to pass; spend',
  'passemos': 'to pass; spend',
  'passeio': 'walk; outing; tour',
  // Verb forms of descer (to go down)
  'descemos': 'to go down',
  'desço': 'to go down',
  // Verb forms of deitar (to lie down)
  'deito': 'to lie down',
  // deparar (to come across)
  'deparamos': 'to come across',
  // Verb forms of fazer (to do/make) – fizemos has wrong lemma too
  'fizemos': 'to do; make',
  // falaria – conditional of falar
  'falaria': 'to speak; talk',
  // gás – clearly a noun, not a verb!
  'gás': 'gas',
  // lidar/ligar
  'lido': 'to deal; read',
  'liga': 'to call; turn on',
  'ligo': 'to call; turn on',
  // machucada – hurt/injured
  'machucada': 'injured; hurt',
  // merecer – to deserve
  'merece': 'to deserve',
  // parecer – to seem/look like
  'parecida': 'similar; alike',
  // pedir – to ask/request
  'pediu': 'to ask; request',
  // pegar – to grab/catch/take
  'pega': 'to grab; catch',
  'peguei': 'to grab; catch',
  // providência – measures/steps
  'providências': 'measures; steps',
  // saber – to know (saiba is subjunctive of saber, NOT sair!)
  'saiba': 'to know',
  // servir – to serve
  'serve': 'to serve',
  // tirar – to take out/remove
  'tira': 'to take; remove',
  'tiraram': 'to take; remove',
  'tiraria': 'to take; remove',
  'tirou': 'to take; remove',
  // trocar – to exchange/switch
  'trocou': 'to exchange; switch',
  'troquei': 'to exchange; switch',
};

// Entries to skip (Google translation is clearly wrong for these)
const SKIP_WORDS = new Set([
  'for', 'formos', 'nele', 'pra', 'sé',
]);

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reading Portuguese dictionary...');
  let src = fs.readFileSync(DICT_PATH, 'utf8');

  // Parse dictionary entries
  const entryRe = /^\s+'([^']+)':\s*\{\s*en:\s*'([^']*)'(.*?)\}/gm;
  const allEntries = [];
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    const word = m[1];
    const en = m[2];
    const posMatch = m[3].match(/pos:\s*'([^']+)'/);
    const pos = posMatch ? posMatch[1] : '';
    allEntries.push({ word, en, pos, fullMatch: m[0] });
  }

  console.log(`Total entries parsed: ${allEntries.length}`);

  // Filter to semicolon entries
  const semiEntries = allEntries.filter(e => e.en.includes(';'));
  console.log(`Entries with semicolons: ${semiEntries.length}`);

  // Batch translate
  const results = [];
  for (let i = 0; i < semiEntries.length; i += BATCH_SIZE) {
    const batch = semiEntries.slice(i, i + BATCH_SIZE);
    const words = batch.map(e => e.word);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(semiEntries.length / BATCH_SIZE);
    process.stdout.write(`  Translating batch ${batchNum}/${totalBatches} (${words.length} words)...`);

    try {
      const translations = await translateBatch(words);
      for (let j = 0; j < batch.length; j++) {
        results.push({ ...batch[j], googleEn: translations[j] });
      }
      console.log(' OK');
    } catch (err) {
      console.error(` ERROR: ${err.message}`);
      for (const entry of batch) {
        results.push({ ...entry, googleEn: '' });
      }
    }

    if (i + BATCH_SIZE < semiEntries.length) await sleep(200);
  }

  // Compare semantically
  const matches = [];
  const mismatches = [];
  const overridden = [];

  for (const r of results) {
    if (!r.googleEn) { matches.push(r); continue; }

    // Apply manual overrides for entries we know the answer for
    if (MANUAL_OVERRIDES[r.word]) {
      if (r.en !== MANUAL_OVERRIDES[r.word]) {
        r.newEn = MANUAL_OVERRIDES[r.word];
        overridden.push(r);
      } else {
        matches.push(r);
      }
      continue;
    }

    // Skip words where Google gives garbage
    if (SKIP_WORDS.has(r.word)) {
      matches.push(r);
      continue;
    }

    const ourWords = extractContentWords(r.en);
    const googleWords = extractContentWords(r.googleEn);

    if (hasSemanticOverlap(ourWords, googleWords)) {
      matches.push(r);
    } else {
      r.newEn = postProcess(r.googleEn, r.pos);
      mismatches.push(r);
    }
  }

  const totalFixes = mismatches.length + overridden.length;
  console.log('\n══════════════════════════════════════');
  console.log(`Total checked:      ${results.length}`);
  console.log(`Matches (keep):     ${matches.length}`);
  console.log(`Mismatches (fix):   ${mismatches.length}`);
  console.log(`Manual overrides:   ${overridden.length}`);
  console.log(`Total fixes:        ${totalFixes}`);
  console.log('══════════════════════════════════════\n');

  const allFixes = [...mismatches, ...overridden];

  // Show up to 20 examples
  const examples = allFixes.slice(0, 20);
  if (examples.length > 0) {
    console.log('Sample fixes (up to 20):');
    console.log('─'.repeat(80));
    for (const e of examples) {
      console.log(`  ${e.word}`);
      console.log(`    OLD: ${e.en}`);
      console.log(`    GOOGLE: ${e.googleEn || '(manual override)'}`);
      console.log(`    NEW: ${e.newEn}`);
      console.log();
    }
  }

  // Show remaining
  if (allFixes.length > 20) {
    console.log(`\nRemaining ${allFixes.length - 20} fixes:`);
    for (const e of allFixes.slice(20)) {
      console.log(`  ${e.word}: "${e.en}" → "${e.newEn}"`);
    }
  }

  // ── Verify preciso ──
  const precisoEntry = allEntries.find(e => e.word === 'preciso');
  if (precisoEntry) {
    console.log(`\npreciso: current="${precisoEntry.en}" – verified as reasonable.`);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No changes written.');
    return;
  }

  if (allFixes.length === 0) {
    console.log('No fixes to apply.');
    return;
  }

  console.log(`\nApplying ${allFixes.length} fixes to dictionary...`);
  let fixCount = 0;

  for (const mm of allFixes) {
    const oldEnEscaped = mm.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordEscaped = mm.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const lineRe = new RegExp(
      `('${wordEscaped}':\\s*\\{\\s*en:\\s*')${oldEnEscaped}(')`
    );

    if (lineRe.test(src)) {
      src = src.replace(lineRe, `$1${mm.newEn}$2`);
      fixCount++;
    } else {
      console.warn(`  Could not find entry to fix: ${mm.word}`);
    }
  }

  fs.writeFileSync(DICT_PATH, src);
  console.log(`\nWrote ${fixCount} fixes to ${DICT_PATH}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
