#!/usr/bin/env node
/**
 * semantic-verify-es-full.cjs — Full semantic verification of ALL entries
 * in the Spanish dictionary. Translates every non-function-word via Google
 * Translate (es→en), compares semantically, replaces zero-overlap entries.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src', 'data', 'dictionary', 'es.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';
const BATCH_SIZE = 80;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Spanish function words to skip ─────────────────────────────────────
const FUNCTION_WORDS = new Set([
  // Articles
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al', 'del',
  // Pronouns
  'yo', 'tú', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras',
  'ellos', 'ellas', 'usted', 'ustedes', 'me', 'te', 'se', 'nos', 'os',
  'le', 'les', 'lo', 'la', 'los', 'las', 'mí', 'ti', 'sí',
  'conmigo', 'contigo', 'consigo',
  // Possessives
  'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras',
  'vuestro', 'vuestra', 'mío', 'mía', 'tuyo', 'tuya', 'suyo', 'suya',
  // Demonstratives
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'aquel', 'aquella', 'aquellos', 'aquellas', 'esto', 'eso', 'aquello',
  // Prepositions
  'a', 'de', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre',
  'hasta', 'desde', 'hacia', 'durante', 'contra', 'tras', 'según',
  'ante', 'bajo', 'mediante',
  // Conjunctions
  'y', 'e', 'o', 'u', 'pero', 'sino', 'ni', 'que', 'porque', 'aunque',
  'si', 'cuando', 'como', 'donde', 'mientras', 'pues',
  // Adverbs (function-like)
  'ya', 'muy', 'más', 'menos', 'también', 'todavía', 'siempre', 'nunca',
  'aquí', 'ahí', 'allí', 'ahora', 'hoy', 'ayer', 'mañana', 'bien', 'mal',
  'mucho', 'poco', 'bastante', 'demasiado', 'sólo', 'solo', 'casi',
  'quizás', 'tan', 'aún', 'luego', 'después', 'antes', 'dentro', 'fuera',
  'arriba', 'abajo', 'lejos', 'cerca', 'pronto', 'tarde', 'temprano',
  'así', 'entonces', 'no',
  // Interrogatives
  'qué', 'quién', 'quiénes', 'cuál', 'cuáles', 'cómo', 'dónde', 'cuándo',
  'cuánto', 'cuánta', 'cuántos', 'cuántas',
  // Indefinites
  'nada', 'nadie', 'algo', 'alguien', 'todo', 'toda', 'todos', 'todas',
  'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'cada',
  'algún', 'alguna', 'algunos', 'algunas', 'ningún', 'ninguna',
  'tanto', 'tanta', 'tantos', 'tantas', 'cual', 'cuyo', 'cuya', 'quien',
  // High-freq verb forms (ser/estar/haber/tener/ir/hacer/decir/poder/saber/dar/venir)
  'soy', 'eres', 'es', 'somos', 'son', 'era', 'fue', 'sido', 'ser',
  'estoy', 'estás', 'está', 'estamos', 'están', 'estaba', 'estuvo', 'estado', 'estar',
  'he', 'has', 'ha', 'hemos', 'han', 'había', 'haber', 'hay',
  'tengo', 'tienes', 'tiene', 'tenemos', 'tienen', 'tenía', 'tener',
  'puedo', 'puedes', 'puede', 'podemos', 'pueden', 'poder',
  'quiero', 'quiere', 'querer',
  'debo', 'debe', 'deber',
  'voy', 'vas', 'va', 'vamos', 'van', 'ir',
  'hago', 'hace', 'hacen', 'hacer',
  'digo', 'dice', 'dicen', 'decir',
  'sé', 'sabe', 'saber',
  'doy', 'da', 'dan', 'dar',
  'vengo', 'viene', 'vienen', 'venir',
]);

// Also skip words starting with ¿ or ¡ (question/exclamation fragments)
function shouldSkip(word) {
  if (FUNCTION_WORDS.has(word)) return true;
  if (word.startsWith('¿') || word.startsWith('¡')) return true;
  return false;
}

// ── Google Translate ────────────────────────────────────────────────────
async function translateBatch(words) {
  const url = new URL('https://translation.googleapis.com/language/translate/v2');
  url.searchParams.set('key', API_KEY);

  const body = JSON.stringify({
    q: words,
    source: 'es',
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
  'forgot': 'forget', 'forgotten': 'forget', 'forgets': 'forget',
  'grew': 'grow', 'grown': 'grow', 'grows': 'grow', 'growing': 'grow',
  'hid': 'hide', 'hidden': 'hide', 'hides': 'hide', 'hiding': 'hide',
  'hurts': 'hurt', 'hurting': 'hurt',
  'wore': 'wear', 'worn': 'wear', 'wears': 'wear', 'wearing': 'wear',
  'taught': 'teach', 'teaches': 'teach', 'teaching': 'teach',
  'threw': 'throw', 'thrown': 'throw', 'throws': 'throw', 'throwing': 'throw',
  'understood': 'understand', 'understands': 'understand',
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
  'decided': 'decide', 'decides': 'decide', 'deciding': 'decide',
  'returned': 'return', 'returns': 'return', 'returning': 'return',
  'ended': 'end', 'ends': 'end', 'ending': 'end',
};

function lemmatize(word) {
  const w = word.toLowerCase();
  if (VERB_LEMMA[w]) return VERB_LEMMA[w];
  let s = w;
  if (s.endsWith('ies') && s.length > 4) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('ied') && s.length > 4) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('ying')) s = s.slice(0, -3) + 'ie';
  else if (s.endsWith('ing') && s.length > 5) {
    const base = s.slice(0, -3);
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) s = base.slice(0, -1);
    else s = base;
  }
  else if (s.endsWith('ed') && s.length > 4) {
    const base = s.slice(0, -2);
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) s = base.slice(0, -1);
    else s = base;
  }
  else if (s.endsWith('es') && s.length > 3) s = s.slice(0, -2);
  else if (s.endsWith('s') && s.length > 3 && !s.endsWith('ss')) s = s.slice(0, -1);
  return s;
}

// ── Synonym groups ──
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
  ['resign', 'quit', 'dismissal', 'layoff'],
  ['court', 'block', 'square'],
  ['picture', 'painting', 'frame', 'image'],
  ['challenge', 'confront', 'face', 'encounter'],
  ['assume', 'suppose', 'presume'],
  ['pass', 'happen', 'spend'],
  ['care', 'watch', 'careful', 'look after'],
  ['drink', 'sip', 'beverage'],
  ['could', 'manage', 'able', 'achieve'],
  ['back', 'return', 'born'],
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
  ['sad', 'sorrowful', 'melancholy', 'unhappy', 'gloomy'],
  ['dirty', 'filthy', 'soiled', 'grimy'],
  ['polite', 'courteous', 'civil', 'respectful'],
  ['brave', 'courageous', 'bold', 'fearless', 'valiant'],
  ['lazy', 'idle', 'sluggish'],
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
  ['arrive', 'reach', 'come', 'get to'],
  ['hurry', 'rush', 'hasten', 'speed'],
  ['remain', 'stay', 'linger', 'abide'],
  ['place', 'put', 'set', 'position', 'locate'],
  ['shape', 'form', 'figure', 'mold'],
  ['gift', 'present', 'donation'],
  ['game', 'play', 'match', 'contest'],
  ['news', 'report', 'information', 'update'],
  ['sign', 'signal', 'mark', 'symbol'],
  ['rule', 'law', 'regulation', 'norm'],
  ['prepare', 'ready', 'arrange', 'organize'],
  ['explain', 'clarify', 'elucidate', 'describe'],
  ['order', 'command', 'direct', 'instruct'],
  ['obey', 'comply', 'follow', 'abide'],
  ['happen', 'occur', 'take place'],
  ['owe', 'debt', 'due', 'indebted'],
  ['belong', 'own', 'possess', 'property'],
  ['lack', 'miss', 'absence', 'shortage'],
  ['risk', 'danger', 'hazard', 'peril', 'threat'],
  ['opportunity', 'chance', 'possibility', 'prospect'],
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
  ['wind', 'breeze', 'gust', 'gale'],
  ['rain', 'shower', 'drizzle', 'downpour'],
  ['flower', 'blossom', 'bloom'],
  ['tree', 'plant', 'bush', 'shrub'],
  ['animal', 'beast', 'creature'],
  ['dog', 'hound', 'puppy', 'canine'],
  ['cat', 'kitten', 'feline'],
  ['horse', 'stallion', 'mare', 'pony'],
  ['cow', 'ox', 'bull', 'cattle', 'beef'],
  ['pig', 'swine', 'hog', 'pork'],
  ['bread', 'loaf'],
  ['wife', 'spouse', 'partner'],
  ['husband', 'spouse', 'partner'],
  ['father', 'dad', 'papa', 'daddy'],
  ['mother', 'mom', 'mama', 'mommy', 'mum', 'mummy'],
  ['friend', 'companion', 'buddy', 'pal', 'mate'],
  ['enemy', 'foe', 'adversary', 'opponent', 'rival'],
  ['doctor', 'physician', 'medic'],
  ['money', 'cash', 'currency', 'fund'],
  ['stone', 'rock', 'pebble', 'boulder'],
  ['ship', 'boat', 'vessel'],
  ['tool', 'instrument', 'device', 'implement'],
  ['door', 'gate', 'entrance', 'entry'],
  ['chair', 'seat', 'bench', 'stool'],
  ['table', 'desk', 'counter'],
  ['bed', 'couch', 'sofa'],
  ['book', 'volume', 'text'],
  ['language', 'tongue', 'speech'],
  ['word', 'term', 'expression'],
  ['number', 'figure', 'digit'],
  ['time', 'hour', 'moment', 'period'],
  ['night', 'evening', 'dusk'],
  ['morning', 'dawn', 'sunrise'],
  // Spanish-specific synonym expansions
  ['rent', 'hire', 'lease'],
  ['throw', 'toss', 'hurl', 'cast', 'fling'],
  ['grab', 'seize', 'grasp', 'clutch', 'snatch'],
  ['warn', 'alert', 'notify', 'advise'],
  ['suggest', 'propose', 'recommend'],
  ['complain', 'protest', 'object'],
  ['translate', 'interpret', 'convert'],
  ['shout', 'yell', 'scream', 'cry'],
  ['whisper', 'murmur', 'mutter'],
  ['wave', 'ripple', 'surge'],
  ['environment', 'surroundings', 'setting', 'atmosphere'],
  ['neighborhood', 'district', 'quarter', 'area'],
  ['schedule', 'timetable', 'agenda', 'calendar'],
  ['bill', 'invoice', 'check', 'receipt', 'account'],
  ['trip', 'journey', 'travel', 'voyage', 'tour'],
  ['beach', 'shore', 'coast', 'seaside'],
  ['corner', 'angle', 'edge'],
  ['ceiling', 'roof', 'top'],
  ['stairs', 'staircase', 'steps', 'ladder'],
  ['bridge', 'crossing', 'overpass'],
  ['garden', 'yard', 'park', 'orchard'],
  ['kitchen', 'cookery'],
  ['bathroom', 'restroom', 'toilet', 'lavatory'],
  ['bedroom', 'chamber'],
  ['office', 'bureau', 'workplace'],
  ['factory', 'plant', 'mill', 'workshop'],
  ['church', 'temple', 'chapel', 'cathedral'],
  ['school', 'academy', 'institute', 'college', 'university'],
  ['library', 'archive'],
  ['museum', 'gallery', 'exhibition'],
  ['theater', 'theatre', 'cinema', 'playhouse'],
  ['airport', 'terminal', 'airfield'],
  ['station', 'terminal', 'depot', 'stop'],
  ['hospital', 'clinic', 'infirmary'],
  ['pharmacy', 'drugstore', 'chemist'],
  ['bank', 'vault'],
  ['market', 'bazaar', 'fair'],
  ['restaurant', 'diner', 'eatery', 'cafe'],
  ['hotel', 'inn', 'lodge', 'motel'],
  ['newspaper', 'journal', 'periodical', 'press'],
  ['screen', 'monitor', 'display'],
  ['button', 'switch', 'knob'],
  ['key', 'lock', 'unlock'],
  ['ring', 'band', 'circle', 'loop'],
  ['box', 'case', 'container', 'chest', 'crate'],
  ['bag', 'sack', 'pouch', 'purse'],
  ['cup', 'mug', 'glass', 'goblet'],
  ['plate', 'dish', 'platter', 'tray'],
  ['fork', 'spoon', 'knife'],
  ['towel', 'cloth', 'rag'],
  ['soap', 'detergent', 'cleanser'],
  ['mirror', 'reflection', 'glass'],
  ['carpet', 'rug', 'mat'],
  ['curtain', 'drape', 'blind'],
  ['pillow', 'cushion'],
  ['blanket', 'cover', 'quilt', 'comforter'],
  ['noise', 'sound', 'racket', 'din'],
  ['voice', 'tone', 'speech'],
  ['song', 'tune', 'melody', 'hymn'],
  ['dance', 'ball'],
  ['painting', 'drawing', 'sketch', 'portrait'],
  ['story', 'tale', 'narrative', 'account', 'history'],
  ['scene', 'sight', 'spectacle', 'panorama'],
  ['crowd', 'mob', 'throng', 'multitude'],
  ['team', 'group', 'crew', 'squad'],
  ['leader', 'chief', 'head', 'boss', 'captain'],
  ['member', 'participant', 'associate'],
  ['guest', 'visitor', 'patron', 'client', 'customer'],
  ['neighbor', 'neighbour', 'resident'],
  ['citizen', 'inhabitant', 'dweller', 'resident'],
  ['worker', 'employee', 'laborer', 'staff'],
  ['owner', 'proprietor', 'landlord'],
  ['student', 'pupil', 'learner', 'scholar'],
  ['teacher', 'instructor', 'professor', 'tutor'],
  ['judge', 'justice', 'referee', 'arbiter'],
  ['lawyer', 'attorney', 'counsel', 'advocate'],
  ['author', 'writer', 'novelist'],
  ['singer', 'vocalist', 'performer'],
  ['driver', 'chauffeur', 'motorist'],
  ['cook', 'chef'],
  ['farmer', 'peasant', 'rancher'],
  ['thief', 'burglar', 'robber', 'bandit'],
  ['soldier', 'warrior', 'fighter', 'troop'],
  ['prize', 'award', 'reward', 'trophy'],
  ['danger', 'risk', 'hazard', 'peril', 'threat'],
  ['damage', 'harm', 'injury', 'hurt'],
  ['advantage', 'benefit', 'gain', 'profit'],
  ['disadvantage', 'drawback', 'setback'],
  ['sample', 'example', 'specimen', 'instance'],
  ['custom', 'tradition', 'habit', 'practice'],
  ['fashion', 'style', 'trend', 'mode'],
  ['size', 'dimension', 'measure', 'extent'],
  ['weight', 'mass', 'heaviness'],
  ['speed', 'velocity', 'pace', 'rate'],
  ['distance', 'length', 'range', 'span'],
  ['height', 'altitude', 'elevation'],
  ['width', 'breadth', 'span'],
  ['depth', 'deepness', 'profundity'],
  ['surface', 'face', 'exterior', 'outside'],
  ['border', 'boundary', 'edge', 'limit', 'frontier'],
  ['center', 'centre', 'middle', 'core', 'heart'],
  ['aim', 'goal', 'target', 'objective', 'purpose'],
  ['doubt', 'uncertainty', 'hesitation', 'suspicion'],
  ['choice', 'option', 'selection', 'alternative'],
  ['demand', 'request', 'claim', 'require'],
  ['supply', 'provide', 'furnish', 'equip'],
  ['profit', 'gain', 'benefit', 'earnings'],
  ['tax', 'duty', 'levy', 'tariff'],
  ['salary', 'wage', 'pay', 'income', 'earnings'],
  ['debt', 'loan', 'liability'],
  ['invest', 'fund', 'finance'],
  ['advertise', 'promote', 'market', 'publicize'],
  ['weather', 'climate', 'forecast'],
  ['storm', 'tempest', 'hurricane', 'typhoon'],
  ['flood', 'deluge', 'overflow'],
  ['earthquake', 'tremor', 'quake'],
  ['fire', 'blaze', 'flame', 'inferno'],
  ['smoke', 'fume', 'haze'],
  ['dust', 'dirt', 'grime', 'soil'],
  ['mud', 'clay', 'mire'],
  ['sand', 'gravel', 'grit'],
  ['steel', 'iron', 'metal'],
  ['wood', 'timber', 'lumber'],
  ['cotton', 'fabric', 'textile'],
  ['wool', 'fleece', 'yarn'],
  ['leather', 'hide', 'skin'],
  ['rubber', 'elastic'],
  ['plastic', 'synthetic'],
  ['fuel', 'gas', 'petrol', 'diesel'],
  ['oil', 'grease', 'lubricant'],
  ['electricity', 'power', 'current'],
  ['battery', 'cell', 'accumulator'],
  ['engine', 'motor', 'machine'],
  ['wheel', 'tire', 'tyre'],
  ['brake', 'stop'],
  ['aircraft', 'airplane', 'plane', 'jet'],
  ['truck', 'lorry', 'van'],
  ['bicycle', 'bike', 'cycle'],
  ['phone', 'telephone', 'mobile', 'cell'],
  ['computer', 'laptop', 'desktop', 'pc'],
  ['camera', 'lens'],
  ['television', 'tv', 'screen'],
  ['apartment', 'flat', 'unit', 'condo'],
  ['floor', 'story', 'storey', 'level'],
  ['ticket', 'pass', 'voucher', 'coupon'],
  ['map', 'chart', 'atlas'],
  ['flag', 'banner', 'standard'],
  ['stamp', 'seal', 'mark'],
  ['coin', 'token'],
  ['newspaper', 'journal', 'gazette', 'press'],
  ['magazine', 'periodical', 'publication'],
];

const SYNONYM_LOOKUP = {};
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    if (!SYNONYM_LOOKUP[word]) SYNONYM_LOOKUP[word] = new Set();
    for (const other of group) {
      if (other !== word) SYNONYM_LOOKUP[word].add(other);
    }
  }
}

// ── Cognates (same word in both languages) ──
const COGNATES = new Set([
  'hotel', 'taxi', 'piano', 'pasta', 'park', 'bus', 'chocolate', 'radio',
  'yoga', 'banana', 'pizza', 'café', 'visa', 'sofa', 'opera', 'drama', 'album',
  'video', 'internet', 'email', 'blog', 'menu', 'tennis', 'golf', 'rugby',
  'football', 'metro', 'casino', 'studio', 'disco', 'salsa', 'tango',
  'normal', 'digital', 'modern', 'musical', 'social', 'final', 'central',
  'general', 'global', 'local', 'total', 'legal', 'fatal', 'formal',
  'natural', 'cultural', 'personal', 'original', 'national', 'international',
  'universal', 'liberal', 'federal', 'criminal', 'animal', 'hospital',
  'festival', 'canal', 'metal', 'test', 'data', 'system', 'program', 'format',
  'bar', 'club', 'web', 'wifi', 'app', 'sport', 'team', 'fan',
  'stop', 'plus', 'super', 'extra', 'ultra', 'ok', 'cool',
  'minimum', 'maximum', 'premium', 'medium', 'status', 'virus', 'bonus', 'focus',
  'robot', 'tourist', 'artist', 'routine', 'garage', 'ballet', 'chef',
  'zoo', 'yogur', 'yoga',
]);

// ── Content word extraction ──
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
  return [...new Set([...raw, ...lemmas])];
}

// ── Semantic overlap check ──
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

// ── Post-process Google translation ──
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
    .replace(/'/g, "\\'")
    .replace(/\.$/, '')
    .trim();

  // Lemmatize the main verb
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

// ── Garbage filter ──
const COMMON_EN = new Set([
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
]);

function isLikelyTransliteration(googleEn) {
  const cleaned = googleEn.trim().toLowerCase().replace(/[^a-z\s]/g, '');
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return true;
  if (words.length === 1 && !COMMON_EN.has(words[0])) {
    const origWords = googleEn.trim().split(/\s+/);
    if (origWords.length === 1 && origWords[0][0] === origWords[0][0].toUpperCase()
        && origWords[0] !== origWords[0].toUpperCase()) {
      return true;
    }
  }
  return false;
}

function isGarbageReplacement(newEn, oldEn) {
  // Don't replace with stop words
  if (['to', 'by', 'so', 'its', 'more', 'our', 'that', 'yes', 'no'].includes(newEn)) return true;
  if (newEn.startsWith('to ') && ['to to', 'to be', 'to by'].includes(newEn)) return true;
  // Don't replace multi-meaning with very short
  const oldParts = oldEn.split(/[;,]/).map(s => s.trim()).filter(s => s.length > 0);
  if (oldParts.length >= 2 && newEn.length <= 3) return true;
  // Empty or question mark
  if (!newEn || newEn === '?' || newEn.length === 0) return true;
  return false;
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Spanish Full Semantic Verification ===\n');
  let src = fs.readFileSync(DICT_PATH, 'utf8');

  // Parse ALL dictionary entries
  const entryRe = /^\s+(['"])([^'"]+)\1\s*:\s*\{\s*en:\s*'([^']*)'(.*?)\}/gm;
  const allEntries = [];
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    const word = m[2];
    const en = m[3];
    const rest = m[4];
    const posMatch = rest.match(/pos:\s*'([^']+)'/);
    const pos = posMatch ? posMatch[1] : '';
    allEntries.push({ word, en, pos, fullMatch: m[0] });
  }

  console.log(`Total entries parsed: ${allEntries.length}`);

  // Filter: skip function words and ¿/¡ prefixed words
  const contentEntries = allEntries.filter(e => !shouldSkip(e.word));
  const skippedCount = allEntries.length - contentEntries.length;
  console.log(`Function words skipped: ${skippedCount}`);
  console.log(`Content words to verify: ${contentEntries.length}\n`);

  // Batch translate ALL content words
  const results = [];
  for (let i = 0; i < contentEntries.length; i += BATCH_SIZE) {
    const batch = contentEntries.slice(i, i + BATCH_SIZE);
    const words = batch.map(e => e.word);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(contentEntries.length / BATCH_SIZE);
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${words.length} words)...`);

    try {
      const translations = await translateBatch(words);
      for (let j = 0; j < batch.length; j++) {
        results.push({ ...batch[j], googleEn: translations[j] });
      }
      console.log(' OK');
    } catch (err) {
      console.error(` ERROR: ${err.message}`);
      // Retry once
      await sleep(2000);
      try {
        const translations = await translateBatch(words);
        for (let j = 0; j < batch.length; j++) {
          results.push({ ...batch[j], googleEn: translations[j] });
        }
        console.log(' OK (retry)');
      } catch (err2) {
        console.error(` FAILED: ${err2.message}`);
        for (const entry of batch) {
          results.push({ ...entry, googleEn: '' });
        }
      }
    }

    if (i + BATCH_SIZE < contentEntries.length) await sleep(120);
  }

  console.log(`\nTranslation complete: ${results.length} words\n`);

  // Compare semantically
  const matches = [];
  const mismatches = [];
  const skipped = [];

  for (const r of results) {
    if (!r.googleEn) { skipped.push(r); continue; }

    // Skip transliterations
    if (isLikelyTransliteration(r.googleEn)) { skipped.push(r); continue; }

    // Skip cognates (word same in both languages)
    const wordClean = r.word.toLowerCase().replace(/[^a-z]/g, '');
    const googleClean = r.googleEn.toLowerCase().replace(/[^a-z]/g, '');
    if (wordClean === googleClean && COGNATES.has(wordClean)) { matches.push(r); continue; }

    const ourWords = extractContentWords(r.en);
    const googleWords = extractContentWords(r.googleEn);

    // If our definition has no content words (e.g., just "?"), always flag
    if (ourWords.length === 0 && googleWords.length > 0) {
      r.newEn = postProcess(r.googleEn, r.pos);
      if (!isGarbageReplacement(r.newEn, r.en)) {
        mismatches.push(r);
      } else {
        skipped.push(r);
      }
      continue;
    }

    if (hasSemanticOverlap(ourWords, googleWords)) {
      matches.push(r);
    } else {
      r.newEn = postProcess(r.googleEn, r.pos);
      if (isGarbageReplacement(r.newEn, r.en)) {
        skipped.push(r);
      } else {
        mismatches.push(r);
      }
    }
  }

  console.log('='.repeat(60));
  console.log('[ES] Semantic verification results');
  console.log('='.repeat(60));
  console.log(`Total checked:       ${results.length}`);
  console.log(`Matches (keep):      ${matches.length}`);
  console.log(`Skipped (bad GT):    ${skipped.length}`);
  console.log(`Mismatches (fix):    ${mismatches.length}`);
  console.log('='.repeat(60) + '\n');

  // Show first 50 examples
  const examples = mismatches.slice(0, 50);
  if (examples.length > 0) {
    console.log('Sample fixes (up to 50):');
    console.log('-'.repeat(80));
    for (const e of examples) {
      console.log(`  ${e.word}: "${e.en}" -> "${e.newEn}"  [Google: ${e.googleEn}]`);
    }
    console.log();
  }

  if (mismatches.length === 0) {
    console.log('No fixes needed.');
    return;
  }

  // Apply fixes
  console.log(`Applying ${mismatches.length} fixes to dictionary...`);
  let fixCount = 0;

  for (const mm of mismatches) {
    const oldEnEscaped = mm.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordEscaped = mm.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const lineRe = new RegExp(
      `(['"]${wordEscaped}['"]:\\s*\\{\\s*en:\\s*')${oldEnEscaped}(')`
    );

    if (lineRe.test(src)) {
      src = src.replace(lineRe, `$1${mm.newEn}$2`);
      fixCount++;
    } else {
      console.warn(`  Could not find entry: ${mm.word}`);
    }
  }

  fs.writeFileSync(DICT_PATH, src);
  console.log(`\nWrote ${fixCount} fixes to ${DICT_PATH}`);
  console.log(`\nSPANISH COMPLETE — ${fixCount} fixes`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
