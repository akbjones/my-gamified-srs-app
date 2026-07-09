/**
 * semantic-verify-all.cjs – Verify semicolon-containing dictionary entries
 * for ANY language by re-translating via Google Translate and comparing semantically.
 *
 * Usage: node scripts/semantic-verify-all.cjs <lang> [--dry-run]
 * Example: node scripts/semantic-verify-all.cjs hi
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const LANG = process.argv[2];
if (!LANG) {
  console.error('Usage: node scripts/semantic-verify-all.cjs <lang> [--dry-run]');
  process.exit(1);
}

// Google Translate language codes
const GT_LANG_MAP = {
  es: 'es', it: 'it', fr: 'fr', pt: 'pt', de: 'de',
  nl: 'nl', sv: 'sv', cy: 'cy', hi: 'hi', tr: 'tr', ru: 'ru',
};

const GT_SOURCE = GT_LANG_MAP[LANG];
if (!GT_SOURCE) {
  console.error(`Unknown language: ${LANG}`);
  process.exit(1);
}

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', `${LANG}.ts`);
const API_KEY = process.env.GOOGLE_TTS_KEY;
const BATCH_SIZE = 80;
const DRY_RUN = process.argv.includes('--dry-run');

// ── Helpers ──────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Send batch of words to Google Translate lang→en */
async function translateBatch(words) {
  const url = new URL('https://translation.googleapis.com/language/translate/v2');
  url.searchParams.set('key', API_KEY);

  const body = JSON.stringify({
    q: words,
    source: GT_SOURCE,
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
const VERB_LEMMA = {
  'am': 'be', 'is': 'be', 'are': 'be', 'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
  'has': 'have', 'had': 'have', 'having': 'have',
  'does': 'do', 'did': 'do', 'done': 'do', 'doing': 'do',
  'goes': 'go', 'went': 'go', 'gone': 'go', 'going': 'go',
  'came': 'come', 'comes': 'come', 'coming': 'come',
  'took': 'take', 'taken': 'take', 'takes': 'take', 'taking': 'take',
  'made': 'make', 'makes': 'make', 'making': 'make',
  'got': 'get', 'gotten': 'get', 'gets': 'get', 'getting': 'get',
  'gave': 'give', 'given': 'give', 'gives': 'give', 'giving': 'give',
  'knew': 'know', 'known': 'know', 'knows': 'know', 'knowing': 'know',
  'thought': 'think', 'thinks': 'think', 'thinking': 'think',
  'said': 'say', 'says': 'say', 'saying': 'say',
  'told': 'tell', 'tells': 'tell', 'telling': 'tell',
  'saw': 'see', 'seen': 'see', 'sees': 'see', 'seeing': 'see',
  'found': 'find', 'finds': 'find', 'finding': 'find',
  'left': 'leave', 'leaves': 'leave', 'leaving': 'leave',
  'puts': 'put', 'putting': 'put',
  'kept': 'keep', 'keeps': 'keep', 'keeping': 'keep',
  'lets': 'let', 'letting': 'let',
  'began': 'begin', 'begun': 'begin', 'begins': 'begin', 'beginning': 'begin',
  'ran': 'run', 'runs': 'run', 'running': 'run',
  'wrote': 'write', 'written': 'write', 'writes': 'write', 'writing': 'write',
  'reads': 'read', 'reading': 'read',
  'spoke': 'speak', 'spoken': 'speak', 'speaks': 'speak', 'speaking': 'speak',
  'talked': 'talk', 'talks': 'talk', 'talking': 'talk',
  'drove': 'drive', 'driven': 'drive', 'drives': 'drive', 'driving': 'drive',
  'sat': 'sit', 'sits': 'sit', 'sitting': 'sit',
  'stood': 'stand', 'stands': 'stand', 'standing': 'stand',
  'lost': 'lose', 'loses': 'lose', 'losing': 'lose',
  'won': 'win', 'wins': 'win', 'winning': 'win',
  'paid': 'pay', 'pays': 'pay', 'paying': 'pay',
  'met': 'meet', 'meets': 'meet', 'meeting': 'meet',
  'sent': 'send', 'sends': 'send', 'sending': 'send',
  'spent': 'spend', 'spends': 'spend', 'spending': 'spend',
  'built': 'build', 'builds': 'build', 'building': 'build',
  'bought': 'buy', 'buys': 'buy', 'buying': 'buy',
  'sold': 'sell', 'sells': 'sell', 'selling': 'sell',
  'brought': 'bring', 'brings': 'bring', 'bringing': 'bring',
  'caught': 'catch', 'catches': 'catch', 'catching': 'catch',
  'dealt': 'deal', 'deals': 'deal', 'dealing': 'deal',
  'felt': 'feel', 'feels': 'feel', 'feeling': 'feel',
  'fought': 'fight', 'fights': 'fight', 'fighting': 'fight',
  'held': 'hold', 'holds': 'hold', 'holding': 'hold',
  'led': 'lead', 'leads': 'lead', 'leading': 'lead',
  'lent': 'lend', 'lends': 'lend', 'lending': 'lend',
  'lay': 'lie', 'lain': 'lie', 'lying': 'lie', 'lies': 'lie',
  'meant': 'mean', 'means': 'mean', 'meaning': 'mean',
  'rose': 'rise', 'risen': 'rise', 'rises': 'rise', 'rising': 'rise',
  'sets': 'set', 'setting': 'set',
  'showed': 'show', 'shown': 'show', 'shows': 'show', 'showing': 'show',
  'sang': 'sing', 'sung': 'sing', 'sings': 'sing', 'singing': 'sing',
  'slept': 'sleep', 'sleeps': 'sleep', 'sleeping': 'sleep',
  'broke': 'break', 'broken': 'break', 'breaks': 'break', 'breaking': 'break',
  'chose': 'choose', 'chosen': 'choose', 'chooses': 'choose', 'choosing': 'choose',
  'drew': 'draw', 'drawn': 'draw', 'draws': 'draw', 'drawing': 'draw',
  'drank': 'drink', 'drunk': 'drink', 'drinks': 'drink', 'drinking': 'drink',
  'ate': 'eat', 'eaten': 'eat', 'eats': 'eat', 'eating': 'eat',
  'fell': 'fall', 'fallen': 'fall', 'falls': 'fall', 'falling': 'fall',
  'flew': 'fly', 'flown': 'fly', 'flies': 'fly', 'flying': 'fly',
  'forgot': 'forget', 'forgotten': 'forget', 'forgets': 'forget', 'forgetting': 'forget',
  'grew': 'grow', 'grown': 'grow', 'grows': 'grow', 'growing': 'grow',
  'hid': 'hide', 'hidden': 'hide', 'hides': 'hide', 'hiding': 'hide',
  'hurts': 'hurt', 'hurting': 'hurt',
  'wore': 'wear', 'worn': 'wear', 'wears': 'wear', 'wearing': 'wear',
  'taught': 'teach', 'teaches': 'teach', 'teaching': 'teach',
  'threw': 'throw', 'thrown': 'throw', 'throws': 'throw', 'throwing': 'throw',
  'understood': 'understand', 'understands': 'understand', 'understanding': 'understand',
  'woke': 'wake', 'woken': 'wake', 'wakes': 'wake', 'waking': 'wake',
  'moved': 'move', 'moves': 'move', 'moving': 'move',
  'changed': 'change', 'changes': 'change', 'changing': 'change',
  'closed': 'close', 'closes': 'close', 'closing': 'close',
  'opened': 'open', 'opens': 'open', 'opening': 'open',
  'turned': 'turn', 'turns': 'turn', 'turning': 'turn',
  'called': 'call', 'calls': 'call', 'calling': 'call',
  'walked': 'walk', 'walks': 'walk', 'walking': 'walk',
  'passed': 'pass', 'passes': 'pass', 'passing': 'pass',
  'served': 'serve', 'serves': 'serve', 'serving': 'serve',
  'resolved': 'resolve', 'resolves': 'resolve', 'resolving': 'resolve',
  'decided': 'decide', 'decides': 'decide', 'deciding': 'decide',
  'returned': 'return', 'returns': 'return', 'returning': 'return',
  'ended': 'end', 'ends': 'end', 'ending': 'end',
  'deserved': 'deserve', 'deserves': 'deserve', 'deserving': 'deserve',
  'requested': 'request', 'requests': 'request', 'requesting': 'request',
  'injured': 'injure', 'injures': 'injure', 'injuring': 'injure',
  'assumed': 'assume', 'assumes': 'assume', 'assuming': 'assume',
  'borrowed': 'borrow', 'borrows': 'borrow', 'borrowing': 'borrow',
  'signed': 'sign', 'signs': 'sign', 'signing': 'sign',
  'registered': 'register', 'registers': 'register', 'registering': 'register',
  'exchanged': 'exchange', 'exchanges': 'exchange', 'exchanging': 'exchange',
  'switched': 'switch', 'switches': 'switch', 'switching': 'switch',
  'cared': 'care', 'cares': 'care', 'caring': 'care',
  'handled': 'handle', 'handles': 'handle', 'handling': 'handle',
  'treated': 'treat', 'treats': 'treat', 'treating': 'treat',
  'happened': 'happen', 'happens': 'happen', 'happening': 'happen',
};

/** Lemmatize a word – irregular lookup, then strip common suffixes */
function lemmatize(word) {
  const w = word.toLowerCase();
  if (VERB_LEMMA[w]) return VERB_LEMMA[w];

  let s = w;
  if (s.endsWith('ies') && s.length > 4) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('ied') && s.length > 4) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('ying')) s = s.slice(0, -3) + 'ie';
  else if (s.endsWith('ing') && s.length > 5) {
    const base = s.slice(0, -3);
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      s = base.slice(0, -1);
    } else {
      s = base;
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
  ['back', 'return', 'born'],
  // Additional synonyms useful across languages
  ['street', 'road', 'way', 'path'],
  ['store', 'shop', 'market'],
  ['eat', 'dine', 'consume', 'feed'],
  ['cry', 'weep', 'sob'],
  ['laugh', 'giggle', 'chuckle'],
  ['piece', 'part', 'portion', 'bit', 'section'],
  ['clothes', 'clothing', 'garment', 'outfit', 'dress'],
  ['letter', 'mail', 'message', 'note'],
  ['fix', 'repair', 'mend'],
  ['own', 'possess'],
  ['ask', 'request', 'inquire', 'question', 'query'],
  ['wait', 'expect', 'anticipate', 'await'],
  ['old', 'ancient', 'elderly', 'aged'],
  ['young', 'youthful', 'juvenile'],
  ['new', 'fresh', 'novel', 'recent'],
  ['empty', 'vacant', 'hollow'],
  ['car', 'vehicle', 'automobile'],
  ['hate', 'detest', 'loathe', 'despise'],
  ['love', 'adore', 'cherish'],
  ['room', 'chamber', 'space'],
  ['fear', 'dread', 'terror', 'fright'],
  ['teach', 'instruct', 'educate', 'train'],
  ['learn', 'study'],
  ['destroy', 'demolish', 'ruin', 'wreck'],
  ['create', 'make', 'produce', 'generate', 'build'],
  ['close', 'shut', 'seal'],
  ['open', 'unfold', 'unlock'],
  ['steal', 'rob', 'thief'],
  ['kill', 'murder', 'slay'],
  ['injure', 'hurt', 'wound', 'harm', 'damage'],
  ['correct', 'right', 'proper', 'accurate'],
  ['wrong', 'incorrect', 'false', 'mistaken'],
  ['clear', 'obvious', 'evident', 'apparent'],
  ['dark', 'dim', 'gloomy', 'murky'],
  ['light', 'bright', 'brilliant', 'radiant'],
  ['soft', 'gentle', 'tender', 'mild'],
  ['hard', 'difficult', 'tough', 'challenging'],
  ['easy', 'simple', 'effortless'],
  ['wide', 'broad', 'vast', 'spacious'],
  ['narrow', 'thin', 'slim', 'slender'],
  ['deep', 'profound'],
  ['heavy', 'weighty', 'hefty'],
  ['dry', 'arid', 'parched'],
  ['wet', 'moist', 'damp', 'humid'],
  ['hot', 'warm', 'heated'],
  ['cold', 'cool', 'chilly', 'frigid', 'icy'],
  ['long', 'lengthy', 'extended', 'prolonged'],
  ['short', 'brief', 'concise'],
  ['late', 'delayed', 'tardy'],
  ['early', 'premature', 'prompt'],
  ['glad', 'pleased', 'delighted', 'thrilled'],
  ['sad', 'sorrowful', 'melancholy', 'unhappy', 'gloomy'],
  ['clean', 'pure', 'spotless'],
  ['dirty', 'filthy', 'soiled', 'grimy'],
  ['polite', 'courteous', 'civil', 'respectful'],
  ['rude', 'impolite', 'discourteous'],
  ['brave', 'courageous', 'bold', 'fearless', 'valiant'],
  ['coward', 'timid', 'shy'],
  ['lazy', 'idle', 'sluggish', 'slothful'],
  ['busy', 'occupied', 'engaged'],
  ['cheap', 'inexpensive', 'affordable'],
  ['expensive', 'costly', 'pricey', 'dear'],
  ['enough', 'sufficient', 'adequate', 'plenty'],
  ['together', 'jointly', 'collectively'],
  ['alone', 'solo', 'solitary', 'lonely'],
  ['foreign', 'alien', 'exotic', 'strange'],
  ['near', 'close', 'nearby', 'adjacent'],
  ['far', 'distant', 'remote'],
  ['free', 'liberate', 'release'],
  ['prison', 'jail', 'cell'],
  ['jump', 'leap', 'bounce', 'hop'],
  ['pull', 'drag', 'tug', 'haul'],
  ['push', 'shove', 'press'],
  ['cut', 'slice', 'chop', 'trim'],
  ['fill', 'stuff', 'pack', 'cram'],
  ['pour', 'spill', 'flow'],
  ['mix', 'blend', 'combine', 'stir'],
  ['cook', 'bake', 'roast', 'fry', 'boil'],
  ['wash', 'clean', 'rinse', 'scrub'],
  ['dress', 'cloth', 'gown', 'garment', 'robe'],
  ['thin', 'slim', 'slender', 'lean', 'skinny'],
  ['thick', 'dense', 'bulky'],
  ['sharp', 'keen', 'acute'],
  ['dull', 'blunt', 'boring'],
  ['sweet', 'sugary'],
  ['bitter', 'sour', 'tart'],
  ['smooth', 'even', 'flat', 'level'],
  ['rough', 'coarse', 'uneven'],
  ['loud', 'noisy', 'boisterous'],
  ['pray', 'worship', 'devotion'],
  ['trust', 'faith', 'confidence', 'belief', 'rely'],
  ['doubt', 'suspect', 'question', 'uncertainty'],
  ['hope', 'wish', 'desire', 'aspire'],
  ['promise', 'pledge', 'vow', 'swear', 'commit'],
  ['forgive', 'pardon', 'excuse'],
  ['blame', 'accuse', 'fault'],
  ['praise', 'compliment', 'commend', 'applaud'],
  ['warn', 'caution', 'alert', 'advise'],
  ['forbid', 'prohibit', 'ban', 'bar'],
  ['announce', 'declare', 'proclaim', 'state'],
  ['complain', 'grumble', 'protest', 'object'],
  ['agree', 'consent', 'approve', 'accept'],
  ['refuse', 'reject', 'decline', 'deny'],
  ['invite', 'summon', 'call'],
  ['greet', 'welcome', 'salute'],
  ['introduce', 'present'],
  ['celebrate', 'rejoice', 'commemorate'],
  ['suffer', 'endure', 'bear', 'tolerate'],
  ['enjoy', 'relish', 'savor', 'pleasure', 'delight'],
  ['smell', 'scent', 'aroma', 'odor', 'fragrance', 'stink'],
  ['taste', 'flavor', 'savor'],
  ['touch', 'feel', 'contact'],
  ['hear', 'listen'],
  ['tie', 'bind', 'fasten', 'knot'],
  ['hang', 'suspend', 'dangle'],
  ['fold', 'bend', 'crease'],
  ['wrap', 'cover', 'envelop'],
  ['gather', 'collect', 'assemble', 'accumulate'],
  ['scatter', 'spread', 'disperse', 'distribute'],
  ['hide', 'conceal', 'cover'],
  ['search', 'seek', 'look for', 'hunt'],
  ['count', 'calculate', 'compute', 'reckon'],
  ['measure', 'gauge', 'assess', 'evaluate'],
  ['guess', 'estimate', 'reckon', 'suppose'],
  ['remember', 'recall', 'recollect', 'remind'],
  ['forget', 'neglect', 'overlook'],
  ['notice', 'observe', 'spot', 'detect'],
  ['recognize', 'identify', 'distinguish'],
  ['compare', 'contrast', 'liken'],
  ['add', 'sum', 'total', 'combine'],
  ['remove', 'eliminate', 'delete', 'erase', 'discard'],
  ['improve', 'enhance', 'upgrade', 'better'],
  ['spread', 'extend', 'expand', 'stretch'],
  ['avoid', 'evade', 'dodge', 'escape', 'shun'],
  ['separate', 'divide', 'split', 'part'],
  ['connect', 'join', 'link', 'attach', 'unite'],
  ['surround', 'encircle', 'enclose'],
  ['cross', 'traverse', 'pass'],
  ['enter', 'access', 'penetrate'],
  ['exit', 'leave', 'depart', 'withdraw'],
  ['climb', 'ascend', 'scale', 'mount'],
  ['descend', 'go down', 'drop', 'fall'],
  ['arrive', 'reach', 'come', 'get to'],
  ['hurry', 'rush', 'hasten', 'speed'],
  ['slow', 'decelerate', 'delay', 'retard'],
  ['remain', 'stay', 'linger', 'abide'],
  ['place', 'put', 'set', 'position', 'locate'],
  ['shape', 'form', 'figure', 'mold'],
  ['gift', 'present', 'donation'],
  ['game', 'play', 'match', 'contest'],
  ['news', 'report', 'information', 'update'],
  ['sign', 'signal', 'mark', 'symbol'],
  ['rule', 'law', 'regulation', 'norm'],
  ['choose', 'elect', 'opt', 'vote'],
  ['prepare', 'ready', 'arrange', 'organize'],
  ['explain', 'clarify', 'elucidate', 'describe'],
  ['beg', 'plead', 'implore', 'entreat'],
  ['order', 'command', 'direct', 'instruct'],
  ['obey', 'comply', 'follow', 'abide'],
  ['happen', 'occur', 'take place'],
  ['owe', 'debt', 'due', 'indebted'],
  ['belong', 'own', 'possess', 'property'],
  ['lack', 'miss', 'absence', 'shortage', 'deficiency'],
  ['risk', 'danger', 'hazard', 'peril', 'threat'],
  ['opportunity', 'chance', 'possibility', 'prospect'],
  ['tradition', 'custom', 'practice', 'ritual', 'heritage'],
  ['religion', 'faith', 'belief', 'creed'],
  ['culture', 'civilization', 'heritage'],
  ['power', 'strength', 'force', 'energy', 'might'],
  ['success', 'achievement', 'triumph', 'victory'],
  ['failure', 'defeat', 'loss', 'setback'],
  ['peace', 'harmony', 'tranquility', 'serenity'],
  ['war', 'conflict', 'battle', 'combat'],
  ['health', 'wellness', 'fitness'],
  ['illness', 'disease', 'sickness', 'ailment'],
  ['medicine', 'drug', 'remedy', 'cure', 'treatment'],
  ['pain', 'ache', 'agony', 'suffering', 'torment'],
  ['pleasure', 'joy', 'delight', 'happiness', 'bliss'],
  ['knowledge', 'wisdom', 'understanding', 'insight'],
  ['skill', 'ability', 'talent', 'aptitude', 'competence'],
  ['mistake', 'error', 'blunder', 'fault'],
  ['problem', 'issue', 'trouble', 'difficulty'],
  ['solution', 'answer', 'resolution', 'remedy'],
  ['reason', 'cause', 'motive', 'purpose'],
  ['result', 'outcome', 'consequence', 'effect'],
  ['opinion', 'view', 'perspective', 'standpoint'],
  ['idea', 'thought', 'concept', 'notion'],
  ['plan', 'strategy', 'scheme', 'blueprint'],
  ['goal', 'aim', 'objective', 'target'],
  ['effort', 'attempt', 'endeavor', 'exertion'],
  ['share', 'portion', 'part', 'divide', 'distribute'],
  ['develop', 'evolve', 'progress', 'advance'],
  ['support', 'assist', 'back', 'uphold'],
  ['country', 'nation', 'state', 'land'],
  ['city', 'town', 'village', 'urban'],
  ['field', 'meadow', 'pasture', 'ground', 'area'],
  ['forest', 'wood', 'jungle', 'grove'],
  ['river', 'stream', 'creek', 'brook'],
  ['mountain', 'hill', 'peak', 'summit'],
  ['ocean', 'sea', 'lake', 'pond'],
  ['earth', 'ground', 'soil', 'land', 'dirt'],
  ['sky', 'heaven', 'firmament'],
  ['wind', 'breeze', 'gust', 'gale'],
  ['rain', 'shower', 'drizzle', 'downpour'],
  ['snow', 'frost', 'ice', 'blizzard'],
  ['flower', 'blossom', 'bloom'],
  ['tree', 'plant', 'bush', 'shrub'],
  ['animal', 'beast', 'creature'],
  ['bird', 'fowl', 'poultry'],
  ['fish', 'seafood'],
  ['dog', 'hound', 'puppy', 'canine'],
  ['cat', 'kitten', 'feline'],
  ['horse', 'stallion', 'mare', 'pony'],
  ['cow', 'ox', 'bull', 'cattle', 'beef'],
  ['pig', 'swine', 'hog', 'pork'],
  ['sheep', 'lamb', 'ram', 'ewe'],
  ['chicken', 'hen', 'rooster', 'cock'],
  ['bread', 'loaf'],
  ['milk', 'dairy', 'cream'],
  ['rice', 'grain', 'cereal'],
  ['fruit', 'berry'],
  ['meat', 'flesh'],
  ['wife', 'spouse', 'partner'],
  ['husband', 'spouse', 'partner'],
  ['father', 'dad', 'papa', 'daddy'],
  ['mother', 'mom', 'mama', 'mommy', 'mum', 'mummy'],
  ['brother', 'sibling'],
  ['sister', 'sibling'],
  ['son', 'boy', 'lad'],
  ['daughter', 'girl', 'lass'],
  ['friend', 'companion', 'buddy', 'pal', 'mate'],
  ['enemy', 'foe', 'adversary', 'opponent', 'rival'],
  ['king', 'monarch', 'ruler', 'sovereign'],
  ['queen', 'monarch', 'ruler'],
  ['doctor', 'physician', 'medic'],
  ['soldier', 'warrior', 'fighter', 'troop'],
  ['money', 'cash', 'currency', 'fund'],
  ['stone', 'rock', 'pebble', 'boulder'],
  ['iron', 'steel', 'metal'],
  ['wood', 'timber', 'lumber'],
  ['cloth', 'fabric', 'textile', 'material'],
  ['glass', 'crystal'],
  ['gold', 'golden'],
  ['silver', 'metallic'],
  ['ship', 'boat', 'vessel'],
  ['train', 'railway', 'railroad'],
  ['plane', 'aircraft', 'airplane'],
  ['weapon', 'arm', 'gun', 'sword'],
  ['tool', 'instrument', 'device', 'implement'],
  ['door', 'gate', 'entrance', 'entry'],
  ['window', 'pane'],
  ['wall', 'barrier', 'fence'],
  ['floor', 'ground', 'pavement'],
  ['roof', 'ceiling', 'top'],
  ['chair', 'seat', 'bench', 'stool'],
  ['table', 'desk', 'counter'],
  ['bed', 'couch', 'sofa'],
  ['book', 'volume', 'text'],
  ['paper', 'sheet', 'page'],
  ['pen', 'pencil'],
  ['language', 'tongue', 'speech'],
  ['word', 'term', 'expression'],
  ['name', 'title', 'label'],
  ['number', 'figure', 'digit'],
  ['time', 'hour', 'moment', 'period'],
  ['day', 'date'],
  ['night', 'evening', 'dusk'],
  ['morning', 'dawn', 'sunrise'],
  ['noon', 'midday'],
  ['week', 'fortnight'],
  ['month', 'lunar'],
  ['year', 'annual', 'annum'],
  ['century', 'era', 'age', 'epoch'],
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

  const lemmas = raw.map(w => lemmatize(w));
  const all = [...new Set([...raw, ...lemmas])];
  return all;
}

/** Check if two word sets have semantic overlap */
function hasSemanticOverlap(ourWords, googleWords) {
  const ourSet = new Set(ourWords);
  for (const gw of googleWords) {
    if (ourSet.has(gw)) return true;
    const gl = lemmatize(gw);
    if (ourSet.has(gl)) return true;
  }

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

  result = result.replace(/^(I|you|he|she|it|we|they)\s+/i, '');
  result = result.replace(/^(am|is|are|was|were|have|has|had|would|could|can|will|shall|should|might|may|do|does|did)\s+/i, '');
  result = result.replace(/^(been|not|able\s+to)\s+/i, '');
  result = result.replace(/^be\s+able\s+to\s+/i, '');

  result = result
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/'/g, '\\\'')  // Escape single quotes for TS string
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

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading ${LANG.toUpperCase()} dictionary from ${DICT_PATH}...`);
  let src = fs.readFileSync(DICT_PATH, 'utf8');

  // Parse dictionary entries – handle both single-quote and double-quote keys
  const entryRe = /^\s+['"]([^'"]+)['"]\s*:\s*\{\s*en:\s*'([^']*)'(.*?)\}/gm;
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

  if (semiEntries.length === 0) {
    console.log('No semicolon entries found. Nothing to verify.');
    return;
  }

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
  const skipped = [];

  // Common English words set for detecting transliterations
  const COMMON_EN_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'come', 'could', 'than', 'look', 'day', 'also', 'some', 'then', 'into',
    'think', 'tell', 'give', 'more', 'many', 'well', 'only', 'new', 'now',
    'way', 'may', 'each', 'good', 'very', 'year', 'back', 'should', 'work',
    'first', 'even', 'still', 'own', 'two', 'how', 'our', 'after', 'here',
    'right', 'see', 'find', 'long', 'where', 'much', 'thing', 'great', 'before',
    'hand', 'high', 'keep', 'last', 'let', 'turn', 'move', 'most', 'old',
    'run', 'put', 'same', 'call', 'end', 'set', 'live', 'hard', 'play',
    'small', 'big', 'part', 'place', 'point', 'want', 'help', 'home', 'house',
    'world', 'head', 'stand', 'light', 'off', 'too', 'down', 'leave', 'city',
    'between', 'open', 'close', 'side', 'ask', 'need', 'line', 'again',
    'start', 'stop', 'read', 'write', 'eat', 'drink', 'sleep', 'walk', 'run',
    'sit', 'cut', 'hit', 'hold', 'bring', 'send', 'pay', 'buy', 'sell',
    'show', 'hear', 'speak', 'talk', 'fall', 'pick', 'pull', 'push', 'put',
    'grow', 'try', 'break', 'build', 'carry', 'catch', 'clean', 'clear',
    'cover', 'draw', 'drive', 'drop', 'fill', 'fit', 'fly', 'follow',
    'forget', 'hang', 'hide', 'hurt', 'jump', 'kill', 'lay', 'lead',
    'learn', 'lift', 'lose', 'meet', 'miss', 'pass', 'raise', 'reach',
    'remain', 'rise', 'save', 'serve', 'shut', 'sing', 'spend', 'spread',
    'stay', 'stick', 'strike', 'swim', 'teach', 'throw', 'touch', 'wear',
    'win', 'wish', 'wait', 'watch', 'water', 'fire', 'air', 'land', 'sea',
    'sun', 'moon', 'star', 'tree', 'door', 'wall', 'bed', 'book', 'paper',
    'table', 'food', 'eye', 'face', 'child', 'man', 'woman', 'boy', 'girl',
    'people', 'family', 'friend', 'money', 'love', 'life', 'death',
    'yes', 'no', 'not', 'up', 'down', 'in', 'out', 'over', 'under',
    'feet', 'foot', 'tooth', 'teeth', 'mice', 'mouse', 'leaves', 'leaf',
    'calves', 'calf', 'wolves', 'wolf', 'knives', 'knife', 'halves', 'half',
    'account', 'accounts', 'apart', 'denied', 'bases', 'nerves', 'people',
    'tolerate', 'value', 'terrain', 'cartons', 'cisterns', 'reflux',
  ]);

  /** Check if Google's translation is likely a transliteration (not a real English word) */
  function isLikelyTransliteration(googleEn) {
    const cleaned = googleEn.trim().toLowerCase().replace(/[^a-z\s]/g, '');
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return true;

    // Single word that starts with uppercase in original and isn't a common English word
    if (words.length === 1 && !COMMON_EN_WORDS.has(words[0])) {
      // Check if the original Google response was capitalized (proper noun / transliteration)
      const origWords = googleEn.trim().split(/\s+/);
      if (origWords.length === 1 && origWords[0][0] === origWords[0][0].toUpperCase()
          && origWords[0] !== origWords[0].toUpperCase()) {
        // Looks like a proper noun / transliteration
        return true;
      }
    }

    return false;
  }

  /** Check if new translation is actually worse (too generic or obviously wrong) */
  function isWorseThanOriginal(r) {
    const newEn = r.newEn;
    const oldEn = r.en;

    // Don't replace multi-meaning with single stop word
    if (['to', 'by', 'so', 'its', 'more', 'our', 'that', 'yes', 'no'].includes(newEn)) return true;
    if (newEn.startsWith('to ') && ['to to', 'to be', 'to by'].includes(newEn)) return true;

    // Don't replace if new is just a single very short word and old has real meanings
    const oldParts = oldEn.split(';').map(s => s.trim()).filter(s => s.length > 0);
    if (oldParts.length >= 2 && newEn.length <= 3) return true;

    return false;
  }

  for (const r of results) {
    if (!r.googleEn) { matches.push(r); continue; }

    // Skip transliterations (Google just echoed the word back)
    if (isLikelyTransliteration(r.googleEn)) {
      skipped.push(r);
      continue;
    }

    const ourWords = extractContentWords(r.en);
    const googleWords = extractContentWords(r.googleEn);

    if (hasSemanticOverlap(ourWords, googleWords)) {
      matches.push(r);
    } else {
      r.newEn = postProcess(r.googleEn, r.pos);

      // Check if replacement is actually worse
      if (isWorseThanOriginal(r)) {
        skipped.push(r);
      } else {
        mismatches.push(r);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`[${LANG.toUpperCase()}] Semantic verification results`);
  console.log('='.repeat(50));
  console.log(`Total checked:      ${results.length}`);
  console.log(`Matches (keep):     ${matches.length}`);
  console.log(`Skipped (bad GT):   ${skipped.length}`);
  console.log(`Mismatches (fix):   ${mismatches.length}`);
  console.log('='.repeat(50) + '\n');

  // Show up to 30 examples
  const examples = mismatches.slice(0, 30);
  if (examples.length > 0) {
    console.log('Sample fixes (up to 30):');
    console.log('-'.repeat(80));
    for (const e of examples) {
      console.log(`  ${e.word}`);
      console.log(`    OLD: ${e.en}`);
      console.log(`    GOOGLE: ${e.googleEn}`);
      console.log(`    NEW: ${e.newEn}`);
      console.log();
    }
  }

  if (mismatches.length > 30) {
    console.log(`\nRemaining ${mismatches.length - 30} fixes:`);
    for (const e of mismatches.slice(30)) {
      console.log(`  ${e.word}: "${e.en}" -> "${e.newEn}"`);
    }
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No changes written.');
    return;
  }

  if (mismatches.length === 0) {
    console.log('No fixes to apply.');
    return;
  }

  console.log(`\nApplying ${mismatches.length} fixes to dictionary...`);
  let fixCount = 0;

  for (const mm of mismatches) {
    const oldEnEscaped = mm.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordEscaped = mm.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Handle both single-quote and double-quote keys
    const lineRe = new RegExp(
      `(['"]${wordEscaped}['"]:\\s*\\{\\s*en:\\s*')${oldEnEscaped}(')`
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
