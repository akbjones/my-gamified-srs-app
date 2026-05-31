#!/usr/bin/env node
/**
 * Welsh word-level alignment script.
 * For every clean card, tokenize the Welsh sentence and provide English meanings.
 * Uses the existing cy.ts dictionary + a comprehensive built-in Welsh word map.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'welsh', 'deck.json');
const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'cy.ts');
const VALIDATION_PATH = path.join(__dirname, 'output', 'cy-card-validation.json');
const OUTPUT_PATH = path.join(__dirname, 'output', 'cy-alignments.json');

// ── Load deck ──
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// ── Load flagged card IDs ──
const validation = JSON.parse(fs.readFileSync(VALIDATION_PATH, 'utf8'));
const flaggedIds = new Set(validation.flagged.map(f => String(f.id)));
console.log(`Total cards: ${deck.length}, Flagged: ${flaggedIds.size}`);

// ── Parse dictionary from .ts file ──
function parseDictionary() {
  const raw = fs.readFileSync(DICT_PATH, 'utf8');
  const dict = {};
  // Match lines like 'word': { en: 'meaning', ... } or "word": { en: 'meaning', ... }
  const re = /['"]([^'"]+)['"]\s*:\s*\{[^}]*en:\s*'([^']*)'[^}]*(?:pos:\s*'([^']*)')?/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const word = m[1].toLowerCase();
    const en = m[2];
    const pos = m[3] || '';
    if (!dict[word]) {
      dict[word] = { en, pos };
    }
  }
  return dict;
}

const cyDict = parseDictionary();
console.log(`Dictionary entries loaded: ${Object.keys(cyDict).length}`);

// ── Welsh mutation tables ──
// Soft mutation (treiglad meddal)
const softMutation = {
  'p': 'b', 'b': 'f', 't': 'd', 'd': 'dd', 'c': 'g', 'g': '',
  'm': 'f', 'rh': 'r', 'll': 'l'
};
// Nasal mutation (treiglad trwynol)
const nasalMutation = {
  'p': 'mh', 'b': 'm', 't': 'nh', 'd': 'n', 'c': 'ngh', 'g': 'ng'
};
// Aspirate mutation (treiglad llaes)
const aspirateMutation = {
  'p': 'ph', 'b': 'b', 't': 'th', 'd': 'd', 'c': 'ch', 'g': 'g'
};

// Build reverse mutation maps: mutated form -> possible unmutated starts
function buildReverseMutations() {
  const rev = {};
  for (const [orig, mut] of Object.entries(softMutation)) {
    if (!rev[mut]) rev[mut] = [];
    rev[mut].push({ type: 'soft', orig });
  }
  for (const [orig, mut] of Object.entries(nasalMutation)) {
    if (!rev[mut]) rev[mut] = [];
    rev[mut].push({ type: 'nasal', orig });
  }
  for (const [orig, mut] of Object.entries(aspirateMutation)) {
    if (!rev[mut]) rev[mut] = [];
    rev[mut].push({ type: 'aspirate', orig });
  }
  return rev;
}

const reverseMutations = buildReverseMutations();

// Try to find unmutated form in dictionary
function lookupUnmutated(word) {
  // Try each possible mutation reversal
  for (const [mutStart, originals] of Object.entries(reverseMutations)) {
    if (word.startsWith(mutStart)) {
      for (const { orig } of originals) {
        const candidate = orig + word.slice(mutStart.length);
        if (cyDict[candidate]) {
          return { ...cyDict[candidate], unmutated: candidate };
        }
      }
    }
  }
  // Special: soft mutation drops initial 'g'
  if (cyDict['g' + word]) {
    return { ...cyDict['g' + word], unmutated: 'g' + word };
  }
  return null;
}

// ── Comprehensive Welsh word map ──
// This covers the most common words that appear in sentences
const welshWords = {
  // ── Articles & Particles ──
  'y': 'the',
  'yr': 'the',
  "'r": 'the',
  'r': 'the',
  'un': 'one',
  'rhai': 'some',

  // ── Pronouns ──
  'i': 'I / to',
  'fi': 'me',
  'ti': 'you (informal)',
  'chi': 'you (formal)',
  'e': 'he',
  'fe': 'he',
  'fo': 'he',
  'o': 'he / him / of',
  'hi': 'she / her',
  'ni': 'we / us',
  'nhw': 'they / them',
  'hwy': 'they',
  'fy': 'my',
  'dy': 'your (informal)',
  'ei': 'his / her',
  'ein': 'our',
  'eich': 'your (formal)',
  'eu': 'their',
  'fy hun': 'myself',
  'hun': 'self',
  'hunan': 'self',

  // ── Demonstratives ──
  'hwn': 'this (m)',
  'hon': 'this (f)',
  'hyn': 'this / these',
  'hynny': 'that',
  'hwnnw': 'that (m)',
  'honno': 'that (f)',
  "'ma": 'this / these',
  "'na": 'that',
  'yna': 'there / then',
  'yma': 'here / this',
  'yno': 'there',
  'acw': 'over there',

  // ── Prepositions ──
  'yn': 'in / (particle)',
  'i': 'to / for',
  "i'r": 'to the',
  'ar': 'on',
  'am': 'about / for',
  'o': 'from / of',
  "o'r": 'from the',
  'dan': 'under',
  'tan': 'under / until',
  'at': 'to / towards',
  'gan': 'by / with',
  'heb': 'without',
  'er': 'since / despite',
  'ers': 'since',
  'rhwng': 'between',
  'dros': 'over / for',
  'tros': 'over',
  'trwy': 'through',
  'drwy': 'through',
  'wrth': 'by / at',
  'gyda': 'with',
  'efo': 'with',
  'hefo': 'with',
  'mewn': 'in (a)',
  'cyn': 'before',
  'wedi': 'after / (perfect)',
  'erbyn': 'by / against',
  'tuag': 'towards',
  'uwch': 'above',
  'uwchben': 'above',
  'islaw': 'below',
  'ynghylch': 'about',
  'oherwydd': 'because of',
  'heblaw': 'besides',
  'ymhlith': 'among',

  // ── Prepositional pronouns ──
  'arno': 'on him',
  'arni': 'on her',
  'arnon': 'on us',
  'arnoch': 'on you',
  'arnyn': 'on them',
  'arna': 'on me',
  'iddo': 'to him',
  'iddi': 'to her',
  'iddyn': 'to them',
  'imi': 'to me',
  'inni': 'to us',
  'ichi': 'to you',
  'ganddo': 'with him',
  'ganddi': 'with her',
  'gennych': 'with you',
  'gen': 'with',
  'gennym': 'with us',
  'ganddyn': 'with them',
  'gyda': 'with',
  'amdano': 'about him',
  'amdani': 'about her',
  'amdanyn': 'about them',
  'amdanoch': 'about you',
  'ohono': 'of him',
  'ohoni': 'of her',
  'ohonyn': 'of them',
  'ohonoch': 'of you',
  'wrtho': 'to him',
  'wrthi': 'to her / at it',
  'wrthyn': 'to them',
  'wrthoch': 'to you',
  'drosto': 'over him',
  'drosti': 'over her',
  'droston': 'over us',
  'drostyn': 'over them',
  'ato': 'to him',
  'ati': 'to her',
  'atoch': 'to you',
  'atyn': 'to them',
  'rhyngddyn': 'between them',
  'rhyngddon': 'between us',
  'trwyddo': 'through him/it',
  'trwyddi': 'through her/it',
  'hynny': 'that',

  // ── Conjunctions ──
  'a': 'and / who',
  'ac': 'and',
  'neu': 'or',
  'ond': 'but',
  'os': 'if',
  'pe': 'if (conditional)',
  'petai': 'if (he) were',
  'petawn': 'if I were',
  'petaech': 'if you were',
  'petaen': 'if they were',
  'pan': 'when',
  'pryd': 'when / time',
  'tra': 'while / very',
  'er': 'although',
  'achos': 'because',
  'oherwydd': 'because',
  'felly': 'therefore / so',
  'hefyd': 'also / too',
  'chwaith': 'either / neither',
  'bod': 'that (conj) / to be',
  'mai': 'that (focus)',
  'taw': 'that (focus)',
  'na': 'not / than / nor',
  'nag': 'not / than',

  // ── Question words ──
  'beth': 'what',
  'be': 'what',
  'pwy': 'who',
  'sut': 'how',
  'ble': 'where',
  'lle': 'where / place',
  'pryd': 'when',
  'pam': 'why',
  'pa': 'which / what',
  'faint': 'how much/many',
  'sawl': 'how many',
  'oes': 'is there?',

  // ── Negation ──
  'ddim': 'not',
  'dim': 'not / no / nothing',
  'nid': 'not (literary)',
  'nad': 'not (relative)',
  'nac': 'not / nor',
  'mo': 'not (+ definite)',
  'byth': 'never / ever',
  'erioed': 'ever / never',

  // ── Common verbs (bod = to be) ──
  'mae': 'is / are',
  "mae'n": 'is',
  "mae'r": 'the ... is',
  'maen': 'are (they)',
  "maen nhw'n": 'they are',
  'yw': 'is',
  'ydy': 'is',
  'ydw': 'am (I)',
  'wyt': 'are (you)',
  'ydych': 'are (you pl)',
  'ydyn': 'are (they)',
  'oedd': 'was / were',
  'oeddwn': 'I was',
  'oeddet': 'you were',
  'oedden': 'they were',
  'oeddech': 'you were (pl)',
  'roedd': 'was / were',
  "roedd hi'n": 'she was',
  'roeddwn': 'I was',
  "roeddwn i'n": 'I was',
  'roedden': 'they were',
  'roeddech': 'you were (pl)',
  'bydd': 'will be',
  'bydda': 'I will be',
  'byddaf': 'I will be',
  "bydda i'n": 'I will be',
  'byddi': 'you will be',
  'byddwn': 'we will be',
  'byddwch': 'you will be (pl)',
  'byddan': 'they will be',
  'fydd': 'will be (soft mut)',
  'fydda': 'I will be',
  "fydda i'n": 'I will be',
  'fyddwn': 'we will be',
  'bues': 'I was (preterite)',
  'buodd': 'was (preterite)',
  'bu': 'was (preterite)',
  'buon': 'were (preterite)',
  'buoch': 'you were (pret)',
  'dw': 'am (I)',
  "dw i": 'I am',
  "dw i'n": 'I am',
  "dw i ddim": 'I am not',
  'dwi': 'I am',
  "dwi'n": 'I am',
  'dych': 'are (you)',
  "dych chi": 'you are',
  "dych chi'n": 'you are',
  'dan': 'are (we)',
  "dan ni'n": 'we are',
  'dyn': 'are (they/we)',
  "dyn ni'n": 'we are',
  "dyn ni ddim": 'we are not',
  'sy': 'who is / that is',
  "sy'n": 'who is / that is',
  'sydd': 'who is / that is',
  'does': 'there is not',
  'nac': 'not / nor',

  // ── Common verb forms ──
  'mynd': 'to go',
  'dod': 'to come',
  'gwneud': 'to do / make',
  'cael': 'to get / have',
  'gallu': 'to be able',
  'gwybod': 'to know (fact)',
  'adnabod': 'to know (person)',
  'dweud': 'to say',
  'gweld': 'to see',
  'clywed': 'to hear',
  'rhoi': 'to give',
  'cymryd': 'to take',
  'byw': 'to live',
  'gweithio': 'to work',
  'hoffi': 'to like',
  'caru': 'to love',
  'meddwl': 'to think',
  'credu': 'to believe',
  'siarad': 'to speak',
  'dysgu': 'to learn/teach',
  'darllen': 'to read',
  'ysgrifennu': 'to write',
  'bwyta': 'to eat',
  'yfed': 'to drink',
  'coginio': 'to cook',
  'cerdded': 'to walk',
  'rhedeg': 'to run',
  'nofio': 'to swim',
  'chwarae': 'to play',
  'gyrru': 'to drive',
  'teithio': 'to travel',
  'aros': 'to wait / stay',
  'gorffen': 'to finish',
  'dechrau': 'to begin',
  'helpu': 'to help',
  'ceisio': 'to try',
  'gobeithio': 'to hope',
  'mwynhau': 'to enjoy',
  'prynu': 'to buy',
  'gwerthu': 'to sell',
  'talu': 'to pay',
  'defnyddio': 'to use',
  'dangos': 'to show',
  'edrych': 'to look',
  'chwilio': 'to search',
  'cysgu': 'to sleep',
  'deffro': 'to wake',
  'gadael': 'to leave',
  'cyrraedd': 'to arrive',
  'troi': 'to turn',
  'cadw': 'to keep',
  'newid': 'to change',
  'torri': 'to cut / break',
  'codi': 'to rise / lift',
  'cwympo': 'to fall',
  'anfon': 'to send',
  'derbyn': 'to receive',
  'ateb': 'to answer',
  'gofyn': 'to ask',
  'colli': 'to lose / miss',
  'ennill': 'to win / earn',
  'deall': 'to understand',
  'cofio': 'to remember',
  'anghofio': 'to forget',
  'paratoi': 'to prepare',
  'glanhau': 'to clean',
  'golchi': 'to wash',
  'peintio': 'to paint',
  'canu': 'to sing',
  'dawnsio': 'to dance',
  'gwenu': 'to smile',
  'chwerthin': 'to laugh',
  'crio': 'to cry',
  'poeni': 'to worry',
  'ymlacio': 'to relax',
  'ymarfer': 'to practice',
  'symud': 'to move',
  'stopio': 'to stop',
  'parcio': 'to park',
  'ffonio': 'to phone',
  'gweithredu': 'to act',
  'cyfarfod': 'to meet',
  'priodi': 'to marry',
  'cwyno': 'to complain',
  'archebu': 'to order',
  'argymell': 'to recommend',
  'cynnig': 'to offer',
  'addurno': 'to decorate',
  'trefnu': 'to arrange',
  'cyflwyno': 'to present',
  'perfformio': 'to perform',
  'recordio': 'to record',
  'ailgylchu': 'to recycle',
  'arbed': 'to save (money)',
  'arwain': 'to lead',
  'achub': 'to save / rescue',
  'amddiffyn': 'to defend',
  'dathlu': 'to celebrate',
  'blasu': 'to taste',
  'arogli': 'to smell',
  'teimlo': 'to feel',
  'cyffwrdd': 'to touch',
  'gwisgo': 'to wear / dress',
  'newid': 'to change',
  'hedfan': 'to fly',
  'hwylio': 'to sail',
  'pysgota': 'to fish',
  'garddio': 'to garden',
  'pobi': 'to bake',
  'rhostio': 'to roast',
  'ffrio': 'to fry',
  'berwi': 'to boil',
  'toddi': 'to melt',
  'rhewi': 'to freeze',
  'sychu': 'to dry',
  'gwlychu': 'to wet',
  'cynhesu': 'to warm',
  'oeri': 'to cool',
  'llosgi': 'to burn',
  'plannu': 'to plant',
  'tyfu': 'to grow',
  'torri': 'to cut',
  'casglu': 'to collect',
  'rhannu': 'to share / divide',
  'tynnu': 'to pull / draw',
  'gwthio': 'to push',
  'cario': 'to carry',
  'cludo': 'to transport',
  'llenwi': 'to fill',
  'gwagio': 'to empty',
  'agor': 'to open',
  'cau': 'to close',
  'adeiladu': 'to build',
  'dinistrio': 'to destroy',
  'trwsio': 'to repair',
  'cynllunio': 'to plan/design',
  'penderfynu': 'to decide',
  'dewis': 'to choose',
  'caniatáu': 'to allow',
  'gwahardd': 'to forbid',
  'llwyddo': 'to succeed',
  'methu': 'to fail',
  'trio': 'to try',
  'gobeithio': 'to hope',
  'ofni': 'to fear',
  'dioddef': 'to suffer',
  'gwella': 'to improve/heal',
  'gwaethygu': 'to worsen',

  // ── Verb inflection prefixes/particles ──
  "wnes i": 'I did',
  "wnest ti": 'you did',
  "wnaeth e": 'he did',
  "wnaethon ni": 'we did',
  'wnes': 'I did',
  'wnest': 'you did',
  'wnaeth': 'he/she did',
  'wnaethon': 'we/they did',
  'wnaethoch': 'you did (pl)',
  'ges': 'I got',
  'gest': 'you got',
  'gafodd': 'got / had',
  'gawson': 'we got',
  'gaeth': 'got (colloq)',
  'ces': 'I got',
  'cafodd': 'got / had',
  'cawson': 'we got',
  'cewch': 'you will get',
  'gawn': 'we will get',
  'ga': 'I will get',
  "ga i": 'may I',
  'aeth': 'went',
  'es': 'I went',
  'est': 'you went',
  'aethon': 'they went',
  'daeth': 'came',
  'des': 'I came',
  'dest': 'you came',
  'daethon': 'they came',
  'ddaeth': 'came (soft mut)',
  'ddaethon': 'they came',
  'gwnaethon': 'they did',
  'gwnaeth': 'he/she did',
  'gwnaf': 'I will do',
  'gwnawn': 'we will do',
  'gwna': 'do! / make!',

  // ── Past tense markers ──
  'wedi': '(perfect marker)',
  "wedi'i": 'has been',
  "wedi'u": 'have been',

  // ── Verb particles ──
  "'n": '(linking particle)',
  'n': '(particle)',
  'yn': '(linking particle)',
  "'i": 'his/her/to',

  // ── Modal / auxiliary ──
  'gallaf': 'I can',
  'galli': 'you can',
  'gall': 'can',
  'gallwn': 'we can / could',
  'gallwch': 'you can (pl)',
  'gallan': 'they can',
  'allaf': 'I can',
  'alli': 'you can',
  'all': 'can',
  'allwn': 'we can / could',
  'allwch': 'you can (pl)',
  'allan': 'they can / out',
  'alla': 'I can',
  "alla i": 'I can',
  'dylwn': 'I should',
  'dylet': 'you should',
  'dylai': 'should',
  'dylen': 'they should',
  'dylech': 'you should (pl)',
  'ddylwn': 'I should',
  'ddylai': 'should',
  'ddylen': 'they should',
  'hoffwn': 'I would like',
  'hoffet': 'you would like',
  'hoffai': 'would like',
  'hoffen': 'they would like',
  'hoffech': 'you would like',

  // ── Conditional (baswn etc.) ──
  'baswn': 'I would',
  "baswn i'n": 'I would',
  'baset': 'you would',
  'basai': 'would',
  'basen': 'they would',
  'basech': 'you would (pl)',
  'byddwn': 'I would / we will',
  'byddet': 'you would',
  'byddai': 'would',
  'bydden': 'they would',
  'byddech': 'you would (pl)',
  'faswn': 'I would',
  "faswn i'n": 'I would',
  'fasai': 'would',
  'fasen': 'they would',
  'fasech': 'you would (pl)',

  // ── Imperative ──
  'dewch': 'come! (pl)',
  'ewch': 'go! (pl)',
  'gwnewch': 'do! (pl)',
  'peidiwch': "don't! (pl)",
  'peidio': 'to not do',

  // ── Common nouns ──
  'dyn': 'man',
  'dynes': 'woman',
  'merch': 'girl / daughter',
  'bachgen': 'boy',
  'plentyn': 'child',
  'plant': 'children',
  'babi': 'baby',
  'teulu': 'family',
  'tad': 'father',
  'mam': 'mother',
  'brawd': 'brother',
  'chwaer': 'sister',
  'mab': 'son',
  'taid': 'grandfather',
  'nain': 'grandmother',
  'ewythr': 'uncle',
  'modryb': 'aunt',
  'cefnder': 'cousin (m)',
  'cyfnither': 'cousin (f)',
  'ffrind': 'friend',
  'cariad': 'love / partner',
  'gwr': 'husband / man',
  'gwraig': 'wife / woman',
  'priod': 'spouse',
  'cymdoges': 'neighbour (f)',
  'cymydog': 'neighbour',

  'ty': 'house',
  "tŷ": 'house',
  'cartref': 'home',
  'ystafell': 'room',
  'cegin': 'kitchen',
  'lolfa': 'living room',
  'gardd': 'garden',
  'drws': 'door',
  'ffenest': 'window',
  'ffenestr': 'window',
  'llawr': 'floor',
  'to': 'roof',
  'wal': 'wall',
  'grisiau': 'stairs',
  'car': 'car',
  'bws': 'bus',
  'trên': 'train',
  'tren': 'train',
  'beic': 'bicycle',
  'llong': 'ship',
  'awyren': 'plane',
  'ffordd': 'road / way',
  'stryd': 'street',
  'pont': 'bridge',
  'maes': 'field',
  'cae': 'field',
  'parc': 'park',
  'coedwig': 'forest',
  'coed': 'trees / wood',
  'mynydd': 'mountain',
  'bryn': 'hill',
  'dyffryn': 'valley',
  'cwm': 'valley',
  'afon': 'river',
  'llyn': 'lake',
  'môr': 'sea',
  'mor': 'sea / so',
  'traeth': 'beach',
  'craig': 'rock / crag',
  'ynys': 'island',
  'tywod': 'sand',
  'glan': 'bank / shore',

  'dŵr': 'water',
  'dwr': 'water',
  'bwyd': 'food',
  'bara': 'bread',
  'caws': 'cheese',
  'llaeth': 'milk',
  'cig': 'meat',
  'pysgod': 'fish',
  'pysgodyn': 'fish (single)',
  'ffrwyth': 'fruit',
  'ffrwythau': 'fruits',
  'llysiau': 'vegetables',
  'afal': 'apple',
  'oren': 'orange',
  'te': 'tea',
  'coffi': 'coffee',
  'cwrw': 'beer',
  'gwin': 'wine',
  'sudd': 'juice',
  'cacen': 'cake',
  'bisgedi': 'biscuits',
  'tatws': 'potatoes',
  'moron': 'carrots',
  'nionod': 'onions',
  'salad': 'salad',
  'reis': 'rice',
  'pasta': 'pasta',
  'cawl': 'soup / broth',
  'selsig': 'sausages',
  'wy': 'egg',
  'wyau': 'eggs',
  'menyn': 'butter',
  'halen': 'salt',
  'pupur': 'pepper',
  'siwgr': 'sugar',
  'hufen': 'cream',
  'iogwrt': 'yoghurt',
  'cinio': 'lunch / dinner',
  'swper': 'supper',
  'brecwast': 'breakfast',
  'pryd': 'meal / time',

  'ysgol': 'school',
  'prifysgol': 'university',
  'coleg': 'college',
  'dosbarth': 'class',
  'gwers': 'lesson',
  'athro': 'teacher (m)',
  'athrawes': 'teacher (f)',
  'myfyriwr': 'student',
  'disgybl': 'pupil',
  'llyfr': 'book',
  'papur': 'paper',
  'pensil': 'pencil',
  'beiro': 'pen',
  'cyfrifiadur': 'computer',
  'ffôn': 'phone',
  'ffon': 'phone / stick',

  'gwaith': 'work',
  'swydd': 'job',
  'swyddfa': 'office',
  'siop': 'shop',
  'marchnad': 'market',
  'arian': 'money / silver',
  'cyflog': 'salary',
  'busnes': 'business',
  'cwmni': 'company',
  'cyfarfod': 'meeting',

  'amser': 'time',
  'awr': 'hour',
  'munud': 'minute',
  'eiliad': 'second',
  'diwrnod': 'day',
  'dydd': 'day',
  'bore': 'morning',
  'prynhawn': 'afternoon',
  'noswaith': 'evening',
  'nos': 'night',
  'wythnos': 'week',
  'mis': 'month',
  'blwyddyn': 'year',
  'blynedd': 'years',
  'heddiw': 'today',
  'yfory': 'tomorrow',
  'ddoe': 'yesterday',
  'nawr': 'now',
  'rwan': 'now',

  // Days
  'llun': 'Monday',
  'mawrth': 'Tuesday / March',
  'mercher': 'Wednesday',
  'iau': 'Thursday',
  'gwener': 'Friday',
  'sadwrn': 'Saturday',
  'sul': 'Sunday',

  // Months
  'ionawr': 'January',
  'chwefror': 'February',
  'mawrth': 'March',
  'ebrill': 'April',
  'mai': 'May',
  'mehefin': 'June',
  'gorffennaf': 'July',
  'awst': 'August',
  'medi': 'September',
  'hydref': 'October / autumn',
  'tachwedd': 'November',
  'rhagfyr': 'December',

  // Seasons
  'gwanwyn': 'spring',
  'haf': 'summer',
  'hydref': 'autumn',
  'gaeaf': 'winter',

  // Weather
  'tywydd': 'weather',
  'haul': 'sun',
  'glaw': 'rain',
  'eira': 'snow',
  'gwynt': 'wind',
  'cwmwl': 'cloud',
  'cymylau': 'clouds',
  'niwl': 'fog',
  'storm': 'storm',
  'enfys': 'rainbow',
  'rhew': 'frost / ice',

  // Body
  'pen': 'head',
  'wyneb': 'face',
  'llygad': 'eye',
  'llygaid': 'eyes',
  'clust': 'ear',
  'clustiau': 'ears',
  'trwyn': 'nose',
  'ceg': 'mouth',
  'gwefus': 'lip',
  'tafod': 'tongue',
  'dant': 'tooth',
  'dannedd': 'teeth',
  'gwallt': 'hair',
  'bys': 'finger',
  'llaw': 'hand',
  'braich': 'arm',
  'coes': 'leg',
  'troed': 'foot',
  'traed': 'feet',
  'calon': 'heart',
  'corff': 'body',
  'cefn': 'back',
  'brest': 'chest',
  'bol': 'stomach / belly',
  'stumog': 'stomach',
  'ysgwydd': 'shoulder',
  'penelin': 'elbow',
  'pen-glin': 'knee',
  'gwddf': 'neck / throat',
  'croen': 'skin',
  'asgwrn': 'bone',

  // ── Common adjectives ──
  'da': 'good',
  'drwg': 'bad',
  'mawr': 'big',
  'bach': 'small / little',
  'fach': 'small (soft mut)',
  'hen': 'old',
  'newydd': 'new',
  'ifanc': 'young',
  'tal': 'tall',
  'byr': 'short',
  'hir': 'long',
  'llydan': 'wide',
  'cul': 'narrow',
  'trwm': 'heavy',
  'ysgafn': 'light (weight)',
  'cryf': 'strong',
  'gwan': 'weak',
  'cyflym': 'fast',
  'araf': 'slow',
  'hawdd': 'easy',
  'anodd': 'difficult',
  'poeth': 'hot',
  'oer': 'cold',
  'cynnes': 'warm',
  'sych': 'dry',
  'gwlyb': 'wet',
  'tywyll': 'dark',
  'golau': 'light / bright',
  'prydferth': 'beautiful',
  'hardd': 'beautiful',
  'hyll': 'ugly',
  'hapus': 'happy',
  'trist': 'sad',
  'blinedig': 'tired',
  'prysur': 'busy',
  'rhydd': 'free',
  'parod': 'ready',
  'barod': 'ready (soft mut)',
  'pwysig': 'important',
  'diddorol': 'interesting',
  'diflas': 'boring / miserable',
  'hyfryd': 'lovely',
  'braf': 'fine / nice',
  'iawn': 'very / OK / right',
  'gwych': 'excellent',
  'perffaith': 'perfect',
  'arbennig': 'special',
  'enwog': 'famous',
  'cyfoethog': 'rich',
  'tlawd': 'poor',
  'iach': 'healthy',
  'sal': 'ill',
  'tost': 'ill / sore',
  'agos': 'near / close',
  'pell': 'far',
  'llawn': 'full',
  'gwag': 'empty',
  'glân': 'clean / holy',
  'glan': 'clean',
  'budr': 'dirty',
  'twp': 'stupid',
  'clyfar': 'clever',
  'dewr': 'brave',
  'caredig': 'kind',
  'creulon': 'cruel',
  'tawel': 'quiet',
  'swnllyd': 'noisy',
  'doniol': 'funny',
  'rhyfedd': 'strange',
  'aml': 'often / frequent',
  'prin': 'scarce / hardly',
  'gwahanol': 'different',
  'tebyg': 'similar',
  'sicr': 'sure / certain',
  'posib': 'possible',
  'amhosib': 'impossible',
  'anodd': 'hard / difficult',
  'syml': 'simple',
  'cymhleth': 'complex',

  // Colors
  'coch': 'red',
  'glas': 'blue',
  'gwyrdd': 'green',
  'melyn': 'yellow',
  'du': 'black',
  'gwyn': 'white',
  'brown': 'brown',
  'oren': 'orange',
  'pinc': 'pink',
  'porffor': 'purple',
  'llwyd': 'grey',

  // ── Numbers ──
  'un': 'one',
  'dau': 'two (m)',
  'dwy': 'two (f)',
  'tri': 'three (m)',
  'tair': 'three (f)',
  'pedwar': 'four (m)',
  'pedair': 'four (f)',
  'pump': 'five',
  'pum': 'five',
  'chwech': 'six',
  'chwe': 'six',
  'saith': 'seven',
  'wyth': 'eight',
  'naw': 'nine',
  'deg': 'ten',
  'un ar ddeg': 'eleven',
  'deuddeg': 'twelve',
  'ugain': 'twenty',
  'cant': 'hundred',
  'mil': 'thousand',
  'cyntaf': 'first',
  'ail': 'second',
  'trydydd': 'third',
  'olaf': 'last',

  // ── Adverbs & misc ──
  'iawn': 'very / right',
  'yn': 'in / (adv particle)',
  'rhy': 'too (excessive)',
  'mwy': 'more',
  'llai': 'less',
  'mwyaf': 'most',
  'lleiaf': 'least',
  'gwell': 'better',
  'gwaeth': 'worse',
  'gorau': 'best',
  'gwaethaf': 'worst',
  'eto': 'again / yet',
  'bob': 'every',
  'pob': 'every',
  'dim': 'nothing / no',
  'rhywbeth': 'something',
  'rhywun': 'someone',
  'pawb': 'everyone',
  'popeth': 'everything',
  'neb': 'nobody',
  'lle': 'place / where',
  'ffordd': 'way / road',
  'beth': 'thing / what',
  'peth': 'thing',
  'pethau': 'things',
  'math': 'kind / type',
  'ochr': 'side',
  'tu': 'side',
  'blaen': 'front',
  'canol': 'middle / centre',
  'pen': 'end / head / top',
  'gwaelod': 'bottom',
  'top': 'top',

  // ── Place-related ──
  'cymru': 'Wales',
  'gymru': 'Wales (soft mut)',
  'lloegr': 'England',
  'caerdydd': 'Cardiff',
  'bangor': 'Bangor',
  'abertawe': 'Swansea',
  'wrecsam': 'Wrexham',
  'eryri': 'Snowdonia',
  'eisteddfod': 'eisteddfod',
  'tref': 'town',
  'dinas': 'city',
  'pentref': 'village',
  'gwlad': 'country',
  'sir': 'county / shire',

  // ── Welsh-specific vocabulary ──
  'croeso': 'welcome',
  'diolch': 'thank you',
  'plîs': 'please',
  'os gwelwch yn dda': 'please',
  'gwelwch': 'you see',
  'da iawn': 'very good',
  'bore da': 'good morning',
  'prynhawn da': 'good afternoon',
  'noswaith dda': 'good evening',
  'nos da': 'good night',
  'hwyl fawr': 'goodbye',
  'hwyl': 'goodbye / fun',
  'helo': 'hello',
  'shwmae': 'hello (south)',
  "sut mae": 'how is',
  'iechyd': 'health',
  'pob lwc': 'good luck',
  'lwc': 'luck',
  'llongyfarchiadau': 'congratulations',
  'penblwydd': 'birthday',

  // Apostrophe suffixes (from contractions)
  "'r": 'the',
  "'n": '(particle)',
  "'i": 'his / her',
  "'w": 'his / her',
  "'u": 'their',
  "'ch": 'your',
  "'th": 'your',
  "'m": 'my',
  "'d": 'your',

  // More common words
  'blwydd': 'years old',
  'ymchwil': 'research',
  'cu': 'dear / beloved',
  'gu': 'dear (soft mut)',
  'rwy': 'I am (literary)',
  "rwy'n": 'I am',
  'dyma': 'here is / this is',
  'dyna': 'there is / that is',
  'dacw': 'there is (far)',
  'bai': 'fault / if (were)',
  'petai': 'if (were)',
  'mai': 'that (focus)',
  'taw': 'that (focus)',
  'di': 'you (informal)',

  // Additional common words
  'bob': 'every',
  'dim ond': 'only',
  'bron': 'almost',
  'efallai': 'perhaps',
  'ella': 'perhaps',
  'siwr': 'sure',
  'wrth gwrs': 'of course',
  'gwrs': 'course',
  'o leiaf': 'at least',
  'leiaf': 'least',
  'weithiau': 'sometimes',
  'wastad': 'always',
  'bob amser': 'always',
  'ar unwaith': 'at once',
  'unwaith': 'once',
  'dwywaith': 'twice',
  'fel': 'like / as',
  'gyda': 'with',
  'hyd yn oed': 'even',
  'hyd': 'length / until',
  'oed': 'age',

  // More nouns
  'enw': 'name',
  'iaith': 'language',
  'cymraeg': 'Welsh (language)',
  'saesneg': 'English (lang)',
  'gair': 'word',
  'geiriau': 'words',
  'stori': 'story',
  'straeon': 'stories',
  'cân': 'song',
  'cerddoriaeth': 'music',
  'ffilm': 'film',
  'llun': 'picture / Monday',
  'lluniau': 'pictures',
  'darlun': 'picture',
  'taith': 'journey',
  'gwyliau': 'holiday',
  'gêm': 'game',
  'gem': 'game',
  'camp': 'feat / sport',
  'chwaraeon': 'sport',
  'pêl': 'ball',
  'pel': 'ball',
  'tim': 'team',
  'tîm': 'team',
  'clwb': 'club',
  'castell': 'castle',
  'eglwys': 'church',
  'capel': 'chapel',
  'ysbyty': 'hospital',
  'meddyg': 'doctor',
  'nyrs': 'nurse',
  'deintydd': 'dentist',
  'cyfreithiwr': 'lawyer',
  'heddlu': 'police',
  'milwr': 'soldier',
  'ffermwr': 'farmer',
  'cogydd': 'chef',
  'cigydd': 'butcher',
  'pobydd': 'baker',
  'garddwr': 'gardener',
  'pensaer': 'architect',
  'peiriannydd': 'engineer',
  'gwyddonydd': 'scientist',
  'artist': 'artist',
  'cerddor': 'musician',
  'canwr': 'singer (m)',
  'cantores': 'singer (f)',
  'actwr': 'actor',
  'actores': 'actress',
  'awdur': 'author',
  'bardd': 'poet',

  // Animals
  'ci': 'dog',
  'cath': 'cat',
  'ceffyl': 'horse',
  'buwch': 'cow',
  'dafad': 'sheep',
  'defaid': 'sheep (pl)',
  'mochyn': 'pig',
  'cyw': 'chick',
  'iâr': 'hen',
  'ceiliog': 'cockerel',
  'cwningen': 'rabbit',
  'llwynog': 'fox',
  'arth': 'bear',
  'aderyn': 'bird',
  'adar': 'birds',
  'pysgodyn': 'fish',
  'draig': 'dragon',
  'anifail': 'animal',
  'anifeiliaid': 'animals',

  // Clothes
  'dillad': 'clothes',
  'crys': 'shirt',
  'trowsus': 'trousers',
  'sgert': 'skirt',
  'ffrog': 'dress',
  'cot': 'coat',
  'het': 'hat',
  'esgidiau': 'shoes',
  'sanau': 'socks',
  'siwmper': 'jumper',

  // House items
  'cadair': 'chair',
  'bwrdd': 'table',
  'gwely': 'bed',
  'soffa': 'sofa',
  'cwpwrdd': 'cupboard',
  'silff': 'shelf',
  'lamp': 'lamp',
  'drych': 'mirror',
  'cwilt': 'quilt',
  'blanced': 'blanket',
  'gobennydd': 'pillow',
  'teledu': 'television',
  'radio': 'radio',
  'popty': 'oven',
  'oergell': 'fridge',
  'peiriant': 'machine',
  'tegell': 'kettle',
  'cwpan': 'cup',
  'plât': 'plate',
  'platiau': 'plates',
  'cyllell': 'knife',
  'fforc': 'fork',
  'llwy': 'spoon',

  // Abstract
  'bywyd': 'life',
  'marwolaeth': 'death',
  'cariad': 'love',
  'gobaith': 'hope',
  'ofn': 'fear',
  'hapusrwydd': 'happiness',
  'tristwch': 'sadness',
  'heddwch': 'peace',
  'rhyfel': 'war',
  'rhyddid': 'freedom',
  'cyfiawnder': 'justice',
  'gwirionedd': 'truth',
  'celwydd': 'lie',
  'problem': 'problem',
  'ateb': 'answer',
  'cwestiwn': 'question',
  'syniad': 'idea',
  'barn': 'opinion',
  'profiad': 'experience',
  'addysg': 'education',
  'hanes': 'history',
  'dyfodol': 'future',
  'gorffennol': 'past',
  'presennol': 'present',

  // Technology
  'rhyngrwyd': 'internet',
  'gwefan': 'website',
  'ap': 'app',
  'neges': 'message',
  'e-bost': 'email',
  'data': 'data',
  'signal': 'signal',
  'sgrin': 'screen',

  // Misc
  'dim': 'nothing / not',
  'lot': 'lot',
  'tipyn': 'a bit',
  'digon': 'enough',
  'gormod': 'too much',
  'llawer': 'much / many',
  'ychydig': 'a little / few',
  'rhagor': 'more',
  'arall': 'other / another',
  'eraill': 'others',
  'gweddill': 'remainder',
  'cyfan': 'whole',
  'hanner': 'half',
  'chwarter': 'quarter',
  'dechrau': 'beginning',
  'diwedd': 'end',
  'achlysur': 'occasion',
  'digwyddiad': 'event',
  'parti': 'party',
  'dathliad': 'celebration',
  'gwobr': 'prize',
  'cystadleuaeth': 'competition',
  'rheol': 'rule',
  'deddf': 'law',
  'hawl': 'right',
  'dyletswydd': 'duty',
  'cyfrifoldeb': 'responsibility',

  // Common soft-mutated forms
  'dda': 'good (soft mut)',
  'ddrwg': 'bad (soft mut)',
  'fawr': 'big (soft mut)',
  'fach': 'small (soft mut)',
  'lan': 'up / clean (mut)',
  'lawr': 'down / floor (mut)',
  'gath': 'cat (soft mut)',
  'gi': 'dog (soft mut)',
  'geffyl': 'horse (soft mut)',
  'fuwch': 'cow (soft mut)',
  'ddŵr': 'water (soft mut)',
  'ddwr': 'water (soft mut)',
  'fwyd': 'food (soft mut)',
  'waith': 'work (soft mut)',
  'le': 'place (soft mut)',
  'lyfr': 'book (soft mut)',
  'bobl': 'people (soft mut)',
  'bobol': 'people (soft mut)',

  // Common contractions
  "dw i'n": 'I am',
  "mae'n": 'it is',
  "mae'r": 'the ... is',
  "i'r": 'to the',
  "o'r": 'from the',
  "sy'n": 'who is',
  "chi'n": 'you (particle)',
  "ni'n": 'we (particle)',
  "nhw'n": 'they (particle)',
  "hi'n": 'she (particle)',
  "e'n": 'he (particle)',
  "fe'n": 'he (particle)',
  "ti'n": 'you (particle)',
  "i'w": 'to his/her',
  "dych chi'n": 'you are',

  // More common words found in decks
  'croeso': 'welcome',
  'galw': 'to call',
  'ceisio': 'to try',
  'rhaid': 'must / need',
  'eisiau': 'want / need',
  'angen': 'need',
  'moyn': 'to want',
  'isio': 'to want',
  'licio': 'to like',
  'joio': 'to enjoy',
  'trio': 'to try',
  'gofalu': 'to care',
  'golygu': 'to mean / edit',
  'olygu': 'to mean (mut)',
  'cymaint': 'so much',
  'llai': 'less',
  'nôl': 'back / to fetch',
  'ymlaen': 'forward / on',
  'allan': 'out',
  'lan': 'up',
  'lawr': 'down',
  'i mewn': 'in / into',
  'i ffwrdd': 'away',
  'ffwrdd': 'away',
  'adref': 'homeward',
  'nôl': 'back',
  'draw': 'over / yonder',
  'drosodd': 'over',

  // Extra vocab
  'tywysog': 'prince',
  'tywysoges': 'princess',
  'brenin': 'king',
  'brenhines': 'queen',
  'senedd': 'parliament',
  'llywodraeth': 'government',
  'cyngor': 'council / advice',
  'etholiad': 'election',
  'plaid': 'party (political)',
  'aelod': 'member',
  'cadeirydd': 'chairman',
  'ysgrifennydd': 'secretary',
  'trysorydd': 'treasurer',
  'pwyllgor': 'committee',
  'cymuned': 'community',
  'cymdeithas': 'society',
  'diwylliant': 'culture',
  'traddodiad': 'tradition',
  'gwyl': 'festival',
  'gŵyl': 'festival',
  'crefydd': 'religion',
  'capel': 'chapel',
  'eglwys': 'church',

  // Nature
  'blodyn': 'flower',
  'blodau': 'flowers',
  'glaswellt': 'grass',
  'deilen': 'leaf',
  'dail': 'leaves',
  'coeden': 'tree',
  'gwreiddiau': 'roots',
  'hadau': 'seeds',
  'pridd': 'soil',
  'carreg': 'stone',
  'cerrig': 'stones',

  // More missing words (round 2)
  'po': 'the (+ comparative)',
  'canoloesol': 'medieval',
  'goleuo': 'to light / illuminate',
  'gitâr': 'guitar',
  'annisgwyl': 'unexpected',
  'fyny': 'up (soft mut)',
  'fedal': 'medal (soft mut)',
  'ysgoloriaeth': 'scholarship',
  'twristiaeth': 'tourism',
  'hamdden': 'leisure',
  'tirlun': 'landscape',
  'tirluniau': 'landscapes',
  'dyfrio': 'to water',
  'ystadegau': 'statistics',
  'sleifio': 'to sneak',
  'fâs': 'vase (soft mut)',
  'bedwaredd': 'fourth (f)',
  'hongian': 'to hang',
  'gwneuthurwr': 'maker / manufacturer',
  'dirwedd': 'landscape',
  'cyfathrebu': 'to communicate',
  'pwysedd': 'pressure',
  'cynaliadwy': 'sustainable',
  'coffáu': 'to commemorate',
  'farddonol': 'poetic (soft mut)',
  'dwyffordd': 'two-way',
  'swnio': 'to sound',
  'bwysicach': 'more important',
  'mhobman': 'everywhere (nasal)',
  'pobman': 'everywhere',

  'pensaernïol': 'architectural',
  'treiddgar': 'piercing',
  'llenyddiaeth': 'literature',
  'llysgenhadaeth': 'embassy',
  'ymwybyddiaeth': 'awareness',
  'bioamrywiaeth': 'biodiversity',
  'seremoni': 'ceremony',
  'treftadaeth': 'heritage',
  'pensaernïaeth': 'architecture',
  'archaeoleg': 'archaeology',
  'gwirfoddolwr': 'volunteer',
  'gwirfoddolwyr': 'volunteers',
  'gorwelion': 'horizons',
  'gwirfoddoli': 'to volunteer',
  'cynllunio': 'to plan',
  'hyfforddiant': 'training',
  'hyfforddi': 'to train',
  'hyfforddwr': 'trainer / coach',
  'myfyrdod': 'meditation',
  'myfyrio': 'to meditate',
  'barddonol': 'poetic',
  'barddoniaeth': 'poetry',
  'adnewyddadwy': 'renewable',
  'fferyllfa': 'pharmacy',
  'fferyllydd': 'pharmacist',
  'deunydd': 'material',
  'deunyddiau': 'materials',
  'nodwedd': 'feature',
  'nodweddion': 'features',
  'seilwaith': 'infrastructure',
  'ardal': 'area / district',
  'ardaloedd': 'areas / districts',
  'cenhadaeth': 'mission',
  'amgylchedd': 'environment',
  'amgylcheddol': 'environmental',
  'allyriadau': 'emissions',
  'cynhwysion': 'ingredients',
  'cynhwysol': 'inclusive',
  'arddangosfa': 'exhibition',
  'arddangos': 'to display',
  'canolfan': 'centre',
  'adnoddau': 'resources',
  'asesiad': 'assessment',
  'ymgynghoriad': 'consultation',

  // More verb forms
  'gwrando': 'to listen',
  'cynnal': 'to hold / support',
  'cynnwys': 'to include / contain',
  'cynyddu': 'to increase',
  'lleihau': 'to reduce',
  'sicrhau': 'to ensure',
  'datblygu': 'to develop',
  'darparu': 'to provide',
  'gweithredu': 'to act / implement',
  'cefnogi': 'to support',
  'cyflawni': 'to achieve',
  'ymuno': 'to join',
  'ymweld': 'to visit',
  'ymddangos': 'to appear',
  'annog': 'to encourage',
  'ymddeol': 'to retire',
  'ymgyrch': 'campaign',
  'ymdrech': 'effort',
  'ymgeisydd': 'candidate',
  'goroesi': 'to survive',
  'gorchfygu': 'to conquer',
  'gorsaf': 'station',
  'datgan': 'to declare',
  'datgelu': 'to reveal',
  'parhau': 'to continue',
  'gohirio': 'to postpone',
  'canolbwyntio': 'to focus',
  'buddsoddi': 'to invest',
  'buddsoddiad': 'investment',
  'arloesi': 'to innovate',
  'arwyddo': 'to sign',
  'arwydd': 'sign',
  'pwyllgor': 'committee',
  'ystyried': 'to consider',
  'disgwyl': 'to expect / wait',
  'darganfod': 'to discover',
  'ychwanegu': 'to add',
  'sylwi': 'to notice',
  'sylw': 'attention / comment',
  'cyhoeddi': 'to publish / announce',
  'cynhyrchu': 'to produce',
  'cynhyrchydd': 'producer',
  'perswadio': 'to persuade',
  'gwahodd': 'to invite',
  'gwahoddiad': 'invitation',
  'llongyfarch': 'to congratulate',
  'canmol': 'to praise',
  'beirniadu': 'to judge / criticise',
  'cyfweld': 'to interview',
  'cyfweliad': 'interview',

  // More adjectives
  'proffesiynol': 'professional',
  'rhyngwladol': 'international',
  'cenedlaethol': 'national',
  'lleol': 'local',
  'traddodiadol': 'traditional',
  'modern': 'modern',
  'hanesyddol': 'historical',
  'creadigol': 'creative',
  'ymarferol': 'practical',
  'cymdeithasol': 'social',
  'economaidd': 'economic',
  'gwleidyddol': 'political',
  'swyddogol': 'official',
  'naturiol': 'natural',
  'emosiynol': 'emotional',
  'corfforol': 'physical',
  'meddyliol': 'mental',
  'ysbytty': 'hospital',
  'gwerthfawr': 'valuable',
  'pwerus': 'powerful',
  'effeithiol': 'effective',
  'cadarnhaol': 'positive',
  'negyddol': 'negative',

  // More nouns
  'cerddorfa': 'orchestra',
  'theatr': 'theatre',
  'sinema': 'cinema',
  'amgueddfa': 'museum',
  'llyfrgell': 'library',
  'oriel': 'gallery',
  'stadiwm': 'stadium',
  'maes awyr': 'airport',
  'porthladd': 'port / harbour',
  'glan y môr': 'seaside',

  'olrhain': 'to trace',
  'cyfarwyddwr': 'director',
  'cadeirydd': 'chairman',
  'rheolwr': 'manager',
  'cyfarwyddyd': 'instruction',
  'canllawiau': 'guidelines',

  // Numbers
  'pymtheg': 'fifteen',
  'deunaw': 'eighteen',
  'un ar hugain': 'twenty-one',
  'hugain': 'twenty (after)',
  'deg ar hugain': 'thirty',
  'hanner cant': 'fifty',
  'trigain': 'sixty',

  // Soft mutations of common words not caught
  'weld': 'to see (soft mut)',
  'wneud': 'to do (soft mut)',
  'fynd': 'to go (soft mut)',
  'ddod': 'to come (soft mut)',
  'gael': 'to get (soft mut)',
  'allu': 'to be able (soft mut)',
  'wybod': 'to know (soft mut)',
  'ddweud': 'to say (soft mut)',
  'glywed': 'to hear (soft mut)',
  'roi': 'to give (soft mut)',
  'gymryd': 'to take (soft mut)',
  'fyw': 'to live (soft mut)',
  'weithio': 'to work (soft mut)',
  'hoffi': 'to like',
  'garu': 'to love (soft mut)',
  'feddwl': 'to think (soft mut)',
  'gredu': 'to believe (soft mut)',
  'ddarllen': 'to read (soft mut)',
  'fwyta': 'to eat (soft mut)',
  'yrru': 'to drive (soft mut)',
  'deithio': 'to travel (soft mut)',
  'aros': 'to wait / stay',
  'orffen': 'to finish (soft mut)',
  'ddechrau': 'to begin (soft mut)',
  'helpu': 'to help',
  'obeithio': 'to hope (soft mut)',
  'fwynhau': 'to enjoy (soft mut)',
  'brynu': 'to buy (soft mut)',
  'werthu': 'to sell (soft mut)',
  'dalu': 'to pay (soft mut)',
  'ddefnyddio': 'to use (soft mut)',
  'ddangos': 'to show (soft mut)',
  'adael': 'to leave (soft mut)',
  'gyrraedd': 'to arrive (soft mut)',
  'droi': 'to turn (soft mut)',
  'gadw': 'to keep (soft mut)',
  'newid': 'to change',
  'dorri': 'to cut (soft mut)',
  'godi': 'to rise (soft mut)',
  'gwympo': 'to fall (soft mut)',
  'ddeall': 'to understand (soft mut)',
  'gofio': 'to remember (soft mut)',
  'anghofio': 'to forget',
  'baratoi': 'to prepare (soft mut)',
  'lanhau': 'to clean (soft mut)',
  'olchi': 'to wash (soft mut)',
  'beintio': 'to paint (soft mut)',
  'ganu': 'to sing (soft mut)',
  'ddawnsio': 'to dance (soft mut)',
  'wenu': 'to smile (soft mut)',
  'chwerthin': 'to laugh',
  'grio': 'to cry (soft mut)',
  'boeni': 'to worry (soft mut)',

  // Mutated forms of common nouns
  'dŷ': 'house (soft mut)',
  'gartref': 'home (soft mut)',
  'gar': 'car (soft mut)',
  'fws': 'bus (soft mut)',
  'drên': 'train (soft mut)',
  'feic': 'bicycle (soft mut)',
  'long': 'ship (soft mut)',
  'barc': 'park (soft mut)',
  'goedwig': 'forest (soft mut)',
  'fynydd': 'mountain (soft mut)',
  'fryn': 'hill (soft mut)',
  'ddyffryn': 'valley (soft mut)',

  // Common phrases/particles
  'wrth gwrs': 'of course',
  'o gwbl': 'at all',
  'gwbl': 'all / complete',
  'o gwmpas': 'around',
  'gwmpas': 'around',
  'ar gyfer': 'for',
  'gyfer': 'for / purpose',
  'ar ôl': 'after',
  'ôl': 'after / back / trace',
  'ol': 'after',
  'yn ôl': 'ago / back',
  'i gyd': 'all',
  'gyd': 'all / together',
  'wrth': 'by / at',
  'o flaen': 'in front of',
  'blaen': 'front',
  'er mwyn': 'in order to',
  'mwyn': 'gentle / sake',
  'ar hyd': 'along',
  'hyd': 'length / until',
  'yn ystod': 'during',
  'ystod': 'period / range',

  'nifer': 'number / several',
  'rhestr': 'list',
  'manylion': 'details',
  'gwybodaeth': 'information',
  'cyngor': 'advice / council',
  'cynllun': 'plan',
  'prosiect': 'project',
  'rhaglen': 'programme',
  'rhaglenni': 'programmes',
  'sianel': 'channel',
  'darlledu': 'to broadcast',
  'darllediad': 'broadcast',
  'fideo': 'video',
  'podlediad': 'podcast',
  'digidol': 'digital',
  'technoleg': 'technology',
  'ap': 'app',
  'meddalwedd': 'software',
  'caledwedd': 'hardware',

  // Round 3 - remaining frequent unknowns
  'tacluso': 'to tidy',
  'cymysgu': 'to mix',
  'fflamenco': 'flamenco',
  'anarferol': 'unusual',
  'meindio': 'to mind',
  'egsotig': 'exotic',
  'ngheredigion': 'Ceredigion (nasal)',
  'ieuengaf': 'youngest',
  'betrol': 'petrol (soft mut)',
  'ohona': 'of me',
  'pitsa': 'pizza',
  'dimensiwn': 'dimension',
  'cyrhaeddon': 'they arrived',
  'lein': 'line',
  'ffowc': 'fork',
  'syrpreis': 'surprise',
  'nodweddiadol': 'characteristic',
  'arloesol': 'innovative',
  'gweundir': 'moorland',
  'arweinyddiaeth': 'leadership',
  'angerddol': 'passionate',
  'ganoloesol': 'medieval (soft mut)',
  'tanddwr': 'underwater',
  'oedran': 'age',
  'ariannu': 'to fund',
  'meddai': 'said (he/she)',
  'fitaminau': 'vitamins',
  'ynddi': 'in her / in it',
  'alergedd': 'allergy',
  'wrtha': 'to me',
  'ddyfnach': 'deeper (soft mut)',
  'budd': 'benefit / profit',
  'bwcio': 'to book',
  'dyrchafiad': 'promotion',
  'hysbysebu': 'to advertise',
  'folcanig': 'volcanic (soft mut)',
  'gynted': 'as soon (soft mut)',
  'grombil': 'belly / depths',
  'mhatagonia': 'Patagonia (nasal)',
  'wrthot': 'to you',
  'gyfranogwyr': 'participants (soft mut)',
  'gwarchodfa': 'reserve / sanctuary',
  'swatio': 'to snuggle',
  'cwantwm': 'quantum',
  'pwyntio': 'to point',
  'twnnel': 'tunnel',
  'herio': 'to challenge',
  'henebion': 'monuments',
  'erydiad': 'erosion',
  'dinasyddion': 'citizens',
  'ymdrin': 'to deal with',
  'ddata': 'data (soft mut)',
  'ryddiaith': 'prose (soft mut)',
  'arfaethedig': 'proposed / planned',
  'darllennais': 'I read (past)',
  'williams': 'Williams (name)',
  'croesawu': 'to welcome',
  'cerddorol': 'musical',
  'creigiog': 'rocky',
  'casáu': 'to hate',
  'clecian': 'to click / crack',
  'meddygol': 'medical',
  'swyddogion': 'officials',
  'blaenoriaeth': 'priority',
  'blaenoriaethau': 'priorities',
  'gwaddol': 'endowment / legacy',
  'rhagolygon': 'forecasts',
  'sgiliau': 'skills',
  'galwedigaeth': 'vocation',
  'rhagfarn': 'prejudice',
  'cydraddoldeb': 'equality',

  // Round 4 - remaining singletons batch
  'addasu': 'to adapt',
  'addawol': 'promising',
  'adlewyrchu': 'to reflect',
  'ailagor': 'to reopen',
  'ailsefyll': 'to retake',
  'allech': 'you could',
  'amddiffyniadau': 'defences',
  'amffitheatr': 'amphitheatre',
  'amlygu': 'to highlight',
  'aneddiadau': 'settlements',
  'angori': 'to anchor',
  'anturus': 'adventurous',
  'arbenigol': 'specialist',
  'arfwisg': 'armour',
  'argraffwasg': 'printing press',
  'arsylwi': 'to observe',
  'art': 'art',
  'arwahanrwydd': 'isolation',
  'arwyddocaol': 'significant',
  'aseiniad': 'assignment',
  'atgyweirio': 'to repair',
  'athroniaeth': 'philosophy',
  'athronydd': 'philosopher',
  'atig': 'attic',
  'acwedwct': 'aqueduct',
  'bariwn': 'baron',
  'bartneriaeth': 'partnership (soft)',
  'bat': 'bat',
  'beintiadau': 'paintings (soft)',
  'belled': 'as far (soft)',
  'benthyca': 'to borrow (soft)',
  'benthycais': 'I borrowed (soft)',
  'benthycodd': 'he borrowed (soft)',
  'betalau': 'petals (soft)',
  'bicnic': 'picnic (soft)',
  'bili': 'bill',
  'boa': 'boa',
  'boda': 'buzzard',
  'bolisio': 'to polish (soft)',
  'boreol': 'morning (adj, soft)',
  'bositif': 'positive (soft)',
  'braslunio': 'to sketch',
  'breichled': 'bracelet',
  'brentisiaethau': 'apprenticeships (soft)',
  'bresenoldeb': 'presence (soft)',
  'brint': 'print (soft)',
  'brodwaith': 'embroidery',
  'brodwraig': 'embroideress',
  'bronfraith': 'song thrush',
  'brycheiniog': 'Brecon',
  'brydfertha': 'most beautiful (soft)',
  'buddugolaethus': 'victorious',
  'bunnoedd': 'pounds (soft)',
  'bwcia': 'to book (imp)',
  'bwtres': 'buttress',
  'bwydo': 'to feed',
  'bwysedd': 'pressure (soft)',
  'bygythiodd': 'he threatened',
  'bynciau': 'bunks (soft)',
  'cadeirio': 'to chair',
  'caodd': 'he closed',
  'celfyddydol': 'artistic',
  'cenhadwr': 'missionary',
  'ceunant': 'gorge / ravine',
  'chroesawgar': 'welcoming (aspirate)',
  'chweil': 'tale',
  'chwerthais': 'I laughed',
  'chwerthon': 'they laughed',
  'chwilfrydedd': 'curiosity',
  'chwistrell': 'syringe / spray',
  'chwynnu': 'to weed',
  'chwyrlio': 'to swirl',
  'chydweithwyr': 'colleagues (aspirate)',
  'cilo': 'kilo',
  'coedwigwr': 'forester',
  'corawl': 'choral',
  'crensian': 'to crunch',
  'crochenwaith': 'pottery',
  'crochenwraig': 'potter (f)',
  'crochenydd': 'potter',
  'cronomedr': 'chronometer',
  'crwsibl': 'crucible',
  'crymbl': 'crumble',
  'crynodau': 'summaries',
  'cv': 'CV',
  'cwiltio': 'to quilt',
  'cwmin': 'cumin',
  'cwrel': 'coral',
  'cwscws': 'couscous',
  'cwteri': 'gutter',
  'cydbwyso': 'to balance',
  'cydrannau': 'components',
  'cyfansoddiadol': 'constitutional',
  'cyfarwyddwraig': 'director (f)',
  'cyfeilio': 'to accompany (music)',
  'cyffyrddiad': 'touch / contact',
  'cyflyrau': 'conditions',
  'cyfranddaliadau': 'shares / stocks',
  'cyfrifiadureg': 'computer science',
  'cyfrifo': 'to calculate',
  'cylchdroi': 'to rotate',
  'cymdeithasegydd': 'sociologist',
  'cynffonwen': 'white-tail',
  'cynhesrwydd': 'warmth',
  'cynhwysydd': 'container',
  'cynhyrchwyr': 'producers',
  'cysga': 'sleep! (imp)',
  'cytbwys': 'balanced',
  'dadeni': 'renaissance / rebirth',
  'daearyddwr': 'geographer',
  'darfu': 'it ended',
  'dargyfeirio': 'to divert',
  'dauddegau': 'twenties',
  'dawelach': 'quieter (soft)',
  'dawnsiwr': 'dancer',
  'ddanteithfwyd': 'delicacy (soft)',
  'ddelfrydol': 'ideal (soft)',
  'ddiet': 'diet (soft)',
  'ddieuog': 'not guilty (soft)',
  'ddiferion': 'drops (soft)',
  'ddisgyblion': 'pupils (soft)',
  'ddocio': 'to dock (soft)',
  'ddofn': 'deep (soft)',
  'ddramatig': 'dramatic (soft)',
  'ddyrchafiad': 'promotion (soft)',
  'deiet': 'diet',
  'deifwraig': 'diver (f)',
  'delfrydol': 'ideal',
  'delynegol': 'lyrical',
  'derbyneb': 'receipt',
  'deuocsid': 'dioxide',
  'dialedd': 'vengeance',
  'diflastod': 'boredom',
  'digymlau': 'cloudless',
  'diwydiannu': 'to industrialise',
  'diwygiadau': 'reforms',
  'diwygio': 'to reform',
  'diystyru': 'to disregard',
  'dj': 'DJ',
  'dlysach': 'prettier (soft)',
  'dna': 'DNA',
  'dramodydd': 'playwright',
  'dre': 'town (soft mut)',
  'driniodd': 'he climbed (soft)',
  'droediwr': 'walker (soft)',
  'dwbl': 'double',
  'dwyieithrwydd': 'bilingualism',
  'dychymyg': 'imagination',
  'dyfeisiodd': 'he invented',
  'dyfrlliw': 'watercolour',
  'dyrannu': 'to allocate',
  'edmygedd': 'admiration',
  'eitem': 'item',
  'enedigol': 'native / born',
  'enlli': 'Bardsey',
  'enwebiad': 'nomination',
  'euogrwydd': 'guilt',
  'fadam': 'madam (soft)',
  'farddol': 'poetic (soft)',
  'feddalach': 'softer (soft)',
  'feinyl': 'vinyl (soft)',
  'fenis': 'Venice (soft)',
  'fethodoleg': 'methodology (soft)',
  'ffan': 'fan',
  'ffarmacolegydd': 'pharmacologist',
  'ffermdy': 'farmhouse',
  'ffilmiwyd': 'was filmed',
  'ffitrwydd': 'fitness',
  'fflebotomydd': 'phlebotomist',
  'fflip': 'flip',
  'fforensig': 'forensic',
  'fforwm': 'forum',
  'ffotograffeg': 'photography',
  'ffotosynthesis': 'photosynthesis',
  'ffresgo': 'fresco',
  'ffridd': 'mountain pasture',
  'ffrwythwr': 'fruiterer',
  'ffurfafen': 'firmament / sky',
  'fictorianaidd': 'Victorian',
  'fila': 'villa (soft)',
  'flasusach': 'tastier (soft)',
  'foreol': 'morning (soft)',
  'frwdfrydig': 'enthusiastic (soft)',
  'fwyfwy': 'more and more (soft)',
  'fydden': 'they would (soft)',
  'fygythiad': 'threat (soft)',
  'fytholeg': 'mythology (soft)',
  'fywoliaeth': 'livelihood (soft)',
  'gadwraeth': 'conservation',
  'gallet': 'you could',
  'gamlesi': 'canals (soft)',
  'ganmlwydd': 'centenary (soft)',
  'garameleiddio': 'to caramelise (soft)',
  'geiser': 'geyser',
  'gilo': 'kilo (soft)',
  'glaear': 'lukewarm',
  'glowyr': 'miners',
  'glywch': 'you hear!',
  'gnociodd': 'he knocked (soft)',
  'godidog': 'magnificent',
  'godro': 'to milk',
  'golchdy': 'laundry',
  'golchwr': 'washer',
  'goleuwr': 'lighter / lamp man',
  'golygfaol': 'scenic',
  'gonestrwydd': 'honesty (soft)',
  'gordewdra': 'obesity',
  'gorfodi': 'to enforce',
  'gorsen': 'reed',
  'goruchwylio': 'to supervise',
  'grawnfwyd': 'cereal',
  'greaduriaid': 'creatures (soft)',
  'greithiau': 'scars (soft)',
  'gwahododd': 'he invited',
  'gwasanaethu': 'to serve',
  'gwastadedd': 'plain / flatland',
  'gwawrio': 'to dawn',
  'gwehyddu': 'to weave',
  'gweithdrefnau': 'procedures',
  'gweithle': 'workplace',
  'gwersylla': 'to camp',
  'gwerthusir': 'is evaluated',
  'gwerthuso': 'to evaluate',
  'gwibio': 'to dart / dash',
  'gwlyptir': 'wetland',
  'gwniyddes': 'seamstress',
  'gwrandewais': 'I listened',
  'gwrel': 'coral (soft)',
  'gwydredd': 'glaze / glassiness',
  'gwydrwr': 'glazier',
  'gwydyr': 'glass',
  'gydol': 'throughout (soft)',
  'gydweithwyr': 'colleagues (soft)',
  'gyfrinachol': 'secret (soft)',
  'gyfrolau': 'volumes (soft)',
  'gymwysiadau': 'applications (soft)',
  'gynaliadwy': 'sustainable (soft)',
  'gyngherddau': 'concerts (soft)',
  'gyrhaedda': 'he arrives',
  'gyrwr': 'driver',
  'ham': 'ham',
  'hambwrdd': 'tray',
  'hamcanion': 'objectives',
  'hardda': 'most beautiful',
  'hebdda': 'without her',
  'heddychlon': 'peaceful',
  'heneb': 'monument',
  'heneiddio': 'to age',
  'heriol': 'challenging',
  'heriwraig': 'challenger (f)',
  'hidlo': 'to filter',
  'hindda': 'fine weather',
  'hwfro': 'to hoover',
  'hwyliwr': 'sailor',
  'hygyrchedd': 'accessibility',
  'hymagwedd': 'approach',
  'hymchwil': 'research (aspirate)',
  'hynna': 'that (colloquial)',
  'hysbysu': 'to notify',
  'iachtau': 'yachts',
  'iaspis': 'jasper',
  'jar': 'jar',
  'jig': 'jig',
  'jiráff': 'giraffe',
  'jiwdo': 'judo',
  'lafa': 'lava',
  'lanwol': 'tidal (soft)',
  'ledu': 'to spread (soft)',
  'lledaeniad': 'spread / distribution',
  'lledaenu': 'to spread',
  'lleisiau': 'voices',
  'lleithder': 'moisture / humidity',
  'llinynol': 'string (adj)',
  'llithograff': 'lithograph',
  'lluchio': 'to throw',
  'llysgennad': 'ambassador',
  'llywiwr': 'navigator',
  'lofnodion': 'signatures (soft)',
  'lwyddiannau': 'successes (soft)',
  'maddeuodd': 'he forgave',
  'maethegydd': 'nutritionist',
  'maethlon': 'nutritious',
  'malu': 'to grind',
  'mawreddog': 'grand / majestic',
  'meindwr': 'spire',
  'mentergarwch': 'enterprise',
  'menynnog': 'buttery',
  'mewnfudo': 'to immigrate',
  'mhenglin': 'knee (nasal)',
  'mhwysedd': 'pressure (nasal)',
  'miwsig': 'music',
  'mohoni': 'of her (neg)',
  'morglawdd': 'sea wall / harbour',
  'moryd': 'estuary',
  'mowldio': 'to mould',
  'mwdlyd': 'muddy',
  'mynyddwr': 'mountaineer',
  'myrddin': 'Merlin',
  'nabyddais': 'I recognised',
  'nawdeg': 'ninety',
  'neidwraig': 'jumper (f)',
  'newyddiadurwraig': 'journalist (f)',
  'nghanopi': 'canopy (nasal)',
  'nghydweithwyr': 'colleagues (nasal)',
  'niwrowyddonydd': 'neuroscientist',
  'niwtor': 'tutor (nasal)',
  'niwtral': 'neutral',
  'nodi': 'to note',
  'noswyl': 'eve (of feast)',
  'nyddu': 'to spin (yarn)',
  'nytiau': 'nuts',
  'obo': 'oboe',
  'oraf': 'coldest',
  'orsedd': 'throne (soft)',
  'osôn': 'ozone',
  'paentiwr': 'painter',
  'pala': 'spade',
  'peiriaint': 'machines',
  'peirianydd': 'engineer',
  'peldroedwraig': 'footballer (f)',
  'pelydr': 'ray / beam',
  'perygius': 'dangerous',
  'phatagonia': 'Patagonia (aspirate)',
  'phd': 'PhD',
  'pherlysiau': 'herbs (aspirate)',
  'phibyddion': 'pipers (aspirate)',
  'phwerus': 'powerful (aspirate)',
  'pibyydd': 'piper',
  'ping': 'ping',
  'piramid': 'pyramid',
  'pleidleisio': 'to vote',
  'plentyndod': 'childhood',
  'poetha': 'hottest',
  'pos': 'puzzle',
  'potiau': 'pots',
  'profiadol': 'experienced',
  'pryfaid': 'insects',
  'purfa': 'refinery',
  'pwmpio': 'to pump',
  'pymtheng': 'fifteen (before noun)',
  'ranbarthol': 'regional (soft)',
  'rhaffu': 'to rope',
  'rheithor': 'rector',
  'rhestru': 'to list',
  'rhewlifol': 'glacial',
  'rhidyll': 'sieve',
  'rhithwir': 'virtual',
  'rhywiau': 'genders / sexes',
  'riff': 'riff',
  'riffiau': 'reefs',
  'ro': 'row / turn',
  'rugieir': 'grouse (aspirate)',
  'saethwraig': 'archer (f)',
  'safana': 'savanna',
  'sarjant': 'sergeant',
  'sbectrwm': 'spectrum',
  'sbrowts': 'sprouts',
  'seiciatrydd': 'psychiatrist',
  'sgandal': 'scandal',
  'sgidiau': 'shoes (colloq)',
  'sgiwr': 'skier',
  'sgon': 'scone',
  'sgriptio': 'to script',
  'sgriptiwraig': 'scriptwriter (f)',
  'sgwlptiwraig': 'sculptor (f)',
  'sgwter': 'scooter',
  'sialc': 'chalk',
  'siarcol': 'charcoal',
  'silio': 'to retreat',
  'siomi': 'to disappoint',
  'sipsiwn': 'gypsies',
  'siwrne': 'journey',
  'so': 'so',
  'soffren': 'saffron',
  'stadau': 'estates',
  'steddfod': 'eisteddfod (colloquial)',
  'stiw': 'stew',
  'sugnwr': 'vacuum / sucker',
  'suo': 'to hum / lull',
  'syfrdandod': 'amazement',
  'syr': 'sir',
  'syrffio': 'to surf',
  'syrffwyr': 'surfers',
  'syfrdandod': 'amazement',
  'tasai': 'if (were, colloq)',
  'teipio': 'to type',
  'thad': 'father (aspirate)',
  'thimau': 'themes (aspirate)',
  'tincian': 'to tinkle',
  'tinwyn': 'wheatear (bird)',
  'tirlithriad': 'landslide',
  'tirwedd': 'terrain / landscape',
  'tlodi': 'poverty',
  'tocsinau': 'toxins',
  'tosturi': 'pity / compassion',
  'towr': 'tower',
  'trac': 'track',
  'traddodi': 'to deliver / hand down',
  'trochol': 'immersive',
  'troedlе': 'treadle',
  'trowsiwr': 'trouser maker',
  'trwbwl': 'trouble',
  'trysordy': 'treasury',
  'tswnami': 'tsunami',
  'twndr': 'tundra',
  'twnelau': 'tunnels',
  'twrnament': 'tournament',
  'tymhestlog': 'stormy',
  'tywelion': 'towels',
  'tywodlyd': 'sandy',
  'tywyllu': 'to darken',
  'tywysydd': 'guide',
  'udo': 'to howl',
  'uniondeb': 'integrity',
  'up': 'up',
  'uwchfioled': 'ultraviolet',
  'waethygu': 'to worsen (soft)',
  'warchodfa': 'reserve (soft)',
  'wasgu': 'to press (soft)',
  'weles': 'I saw (colloq)',
  'wnawn': 'we will do',
  'wrthfiotigau': 'antibiotics',
  'wyrddni': 'greenery (soft)',
  'x': 'x',
  'yfon': 'river (soft)',
  'ymchwilwyr': 'researchers',
  'ymddiriedolaeth': 'trust (org)',
  'ymladodd': 'he fought',
  'ymreolaeth': 'autonomy',
  'ymwrthedd': 'resistance',
  'ypsetio': 'to upset',
  'ysbiwr': 'spy',
  'baratödd': 'he prepared (soft)',
  'coginiáis': 'I cooked',
  'cangŵr': 'cancer',
  'ffagan': 'St Fagans',
  'goconymau': 'coconuts (soft)',
  'hastudiaethau': 'studies (aspirate)',
  'slêd': 'sled',
  'stêc': 'steak',
  'stôf': 'stove',
  'gâr': 'car (soft)',
  'sosioieitheg': 'sociolinguistics',
  'sbeleothegwyr': 'speleologists',
  'sesnin': 'session',
  'sffyncs': 'sphinx',
  'sgôriodd': 'he scored',
  'troedle': 'treadle',
  'nîl': 'Nile',
  'grëwyd': 'was created',
  'gwobrowywyd': 'was awarded',
  'ffilmiwyd': 'was filmed',
  'pobobd': 'people (colloq)',
  'gyngherddau': 'concerts (soft)',

  'wela': 'I will see (soft)',
  // Round 5 - final remaining
  'enwirydd': 'engraver',
  'cerddor': 'musician',
  "trwbadŵr": 'troubadour',
  "shw'": 'how (colloq)',
  "nhadau'": 'my fathers',
  'syrfio': 'to surf',
  'sgyscraper': 'skyscraper',
  "ma'": 'this / here',
  "twîd": 'tweed',
  'dringon': 'they climbed',
  'ymddiheuron': 'they apologised',

  // Numbers as words in text
  'first': 'first',
  'second': 'second',
};

// ── Tokenizer ──
function tokenize(sentence) {
  // Replace smart quotes with regular apostrophes
  let s = sentence.replace(/[\u2018\u2019\u201A\u201B]/g, "'");

  // Lowercase
  s = s.toLowerCase();

  // Normalize Cyrillic/Greek lookalikes to Latin
  s = s.replace(/\u043E/g, 'o')  // Cyrillic о -> Latin o
       .replace(/\u0430/g, 'a')   // Cyrillic а -> Latin a
       .replace(/\u0435/g, 'e')   // Cyrillic е -> Latin e
       .replace(/\u0441/g, 'c')   // Cyrillic с -> Latin c
       .replace(/\u0440/g, 'p')   // Cyrillic р -> Latin p
       .replace(/\u0443/g, 'y')   // Cyrillic у -> Latin y
       .replace(/\u043D/g, 'n')   // Cyrillic н -> Latin n
       .replace(/\u0438/g, 'i')   // Cyrillic и -> Latin i
       .replace(/\u0433/g, 'g')   // Cyrillic г -> Latin g
       .replace(/\u03BF/g, 'o')   // Greek ο -> Latin o
       .replace(/\u03B1/g, 'a');  // Greek α -> Latin a

  // Remove punctuation but keep apostrophes that are part of words
  s = s.replace(/[.,;:!?"""()—–\-\[\]{}…«»]/g, ' ');

  // Split on whitespace
  let rawTokens = s.split(/\s+/).filter(t => t.length > 0);

  // Split apostrophe contractions into components
  const tokens = [];
  for (const tok of rawTokens) {
    const parts = splitContraction(tok);
    tokens.push(...parts);
  }

  return tokens;
}

// Split Welsh contractions at apostrophes into meaningful parts
function splitContraction(token) {
  // Known whole contractions we keep together
  const keepWhole = new Set([
    "dw", "mae'n", "mae'r", "sy'n", "dw i'n", "'r", "'n", "'i", "'w",
    "'ma", "'na", "i'r", "o'r",
  ]);
  if (keepWhole.has(token)) return [token];

  // If no apostrophe, return as-is
  if (!token.includes("'")) return [token];

  // Split on apostrophe: "drwy'r" -> ["drwy", "'r"]
  // "byddai'n" -> ["byddai", "'n"]
  // "cymru'n" -> ["cymru", "'n"]
  // "â'r" -> ["â", "'r"]
  // "â'i" -> ["â", "'i"]
  const idx = token.indexOf("'");

  // If apostrophe is at start, keep whole: 'r, 'n, 'ma, 'na
  if (idx === 0) return [token];

  const before = token.slice(0, idx);
  const after = "'" + token.slice(idx + 1);

  // Common suffixes: 'r (the), 'n (particle), 'i (his/her), 'w (his/her),
  // 'u (their), 'ch (your), 'th (your)
  if (["'r", "'n", "'i", "'w", "'u", "'ch", "'th", "'m", "'d"].includes(after)) {
    return [before, after];
  }

  // Otherwise keep as one token
  return [token];
}

// ── Smart lookup with context ──
function lookupWord(token, englishSentence) {
  const eng = englishSentence.toLowerCase();

  // 1. Check our comprehensive word map first
  if (welshWords[token]) {
    return shortenMeaning(welshWords[token], token);
  }

  // 2. Check the dictionary
  if (cyDict[token]) {
    return shortenDictMeaning(cyDict[token].en, token);
  }

  // 3. Try unmutated lookup
  const unmutated = lookupUnmutated(token);
  if (unmutated) {
    return shortenDictMeaning(unmutated.en, token);
  }

  // 4. Try removing common suffixes for inflected forms
  const stripped = tryStripInflection(token);
  if (stripped) return stripped;

  // 5. Context-based guessing from the English sentence
  const contextGuess = guessFromContext(token, eng);
  if (contextGuess) return contextGuess;

  // 6. Return the token itself if it looks like a proper noun
  if (token.length > 0 && token[0] === token[0].toUpperCase()) {
    return token + ' (name)';
  }

  return '?';
}

function shortenMeaning(meaning, token) {
  // If meaning has slashes or commas, take the most relevant one
  if (meaning.includes('/')) {
    const parts = meaning.split('/').map(p => p.trim());
    return parts[0]; // Take first
  }
  // Truncate to first 4 words
  const words = meaning.split(' ');
  if (words.length > 4) return words.slice(0, 4).join(' ');
  return meaning;
}

function shortenDictMeaning(meaning, token) {
  // Dictionary entries can be verbose. Shorten.
  if (!meaning) return '?';

  // Remove parenthetical info
  let m = meaning.replace(/\([^)]*\)/g, '').trim();

  // If comma separated, take first
  if (m.includes(',')) {
    m = m.split(',')[0].trim();
  }

  // Truncate
  const words = m.split(' ');
  if (words.length > 4) m = words.slice(0, 4).join(' ');

  return m || '?';
}

function tryStripInflection(token) {
  // Try common Welsh verb/noun suffixes
  const suffixes = [
    { suf: 'ais', base: 'to ' }, // past 1s
    { suf: 'aist', base: 'to ' },
    { suf: 'odd', base: 'to ' }, // past 3s
    { suf: 'on', base: 'to ' },  // past 1p
    { suf: 'och', base: 'to ' }, // past 2p
    { suf: 'wyd', base: 'to ' }, // passive
    { suf: 'ir', base: 'to ' },  // habitual passive
    { suf: 'af', base: 'to ' },  // future 1s
    { suf: 'wn', base: 'to ' },  // conditional/1p
    { suf: 'ith', base: 'to ' }, // future 3s
    { suf: 'wch', base: 'to ' }, // imperative 2p
    { suf: 'iad', base: '' },    // verbal noun suffix
    { suf: 'iant', base: '' },
    { suf: 'au', base: '' },     // plural
    { suf: 'iau', base: '' },    // plural
    { suf: 'oedd', base: '' },   // plural
    { suf: 'ydd', base: '' },    // plural/agent
    { suf: 'ion', base: '' },    // plural
    { suf: 'iaid', base: '' },   // plural
    { suf: 'od', base: '' },     // plural
  ];

  for (const { suf, base } of suffixes) {
    if (token.endsWith(suf) && token.length > suf.length + 2) {
      const stem = token.slice(0, -suf.length);
      // Try stem and stem+various endings in dictionary
      for (const tryEnd of ['', 'u', 'o', 'i', 'io', 'a', 'ed', 'yn']) {
        const candidate = stem + tryEnd;
        if (cyDict[candidate]) {
          return shortenDictMeaning(cyDict[candidate].en, token);
        }
        if (welshWords[candidate]) {
          return shortenMeaning(welshWords[candidate], token);
        }
      }
      // Try unmutated stem
      const unmut = lookupUnmutated(stem);
      if (unmut) return shortenDictMeaning(unmut.en, token);
      for (const tryEnd of ['u', 'o', 'i', 'a']) {
        const unmut2 = lookupUnmutated(stem + tryEnd);
        if (unmut2) return shortenDictMeaning(unmut2.en, token);
      }
    }
  }

  return null;
}

function guessFromContext(welshToken, engSentence) {
  // Try to see if the Welsh token closely matches any English word (loanwords/cognates)
  const engWords = engSentence.replace(/[.,;:!?'"()]/g, '').split(/\s+/);

  // Check for cognates (Welsh word similar to English)
  for (const ew of engWords) {
    if (ew.length > 3 && welshToken.length > 3) {
      // Simple similarity: starts with same 3+ letters
      if (welshToken.slice(0, 3) === ew.slice(0, 3).toLowerCase()) {
        return ew;
      }
    }
  }

  // Check if it's a proper noun (name)
  if (isLikelyName(welshToken)) {
    return welshToken + ' (name)';
  }

  return null;
}

function isLikelyName(token) {
  // Common Welsh name patterns
  const names = new Set([
    'siân', 'sian', 'rhys', 'owen', 'gwen', 'megan', 'elin', 'mari',
    'gareth', 'dafydd', 'iwan', 'aled', 'llŷr', 'llyr', 'emyr', 'gethin',
    'cerys', 'ffion', 'carys', 'lowri', 'angharad', 'catrin', 'eleri',
    'gwyneth', 'bronwen', 'delyth', 'eira', 'enfys', 'glenda', 'gwenllian',
    'hefin', 'huw', 'idris', 'iolo', 'llewelyn', 'madog', 'maldwyn',
    'nerys', 'olwen', 'owain', 'padrig', 'prys', 'rhodri', 'steffan',
    'taliesin', 'tudur', 'waldo', 'alun', 'bethan', 'bryn', 'cadi',
    'dewi', 'dylan', 'eifion', 'glyn', 'gruffydd', 'harri', 'heledd',
    'iago', 'jac', 'leri', 'liwsi', 'marc', 'mared', 'mostyn',
    'non', 'nia', 'osian', 'peredur', 'sara', 'seren', 'tomos',
    'mair', 'gwilym', 'wyn', 'arwel', 'tegwen', 'elan', 'hedd',
    'ceri', 'dilys', 'eurwen', 'geraint', 'ieuan', 'llinos',
    'myfanwy', 'nest', 'rees', 'tegid', 'trefor', 'vaughan',
    'anwen', 'bedwyr', 'caio', 'dai', 'einion', 'guto',
  ]);
  return names.has(token);
}

// ── Main processing ──
function processAllCards() {
  const alignments = {};
  let cleanCount = 0;
  let skippedCount = 0;
  let unknownCount = 0;
  let totalTokens = 0;

  for (const card of deck) {
    const cardId = String(card.id);

    // Skip flagged cards
    if (flaggedIds.has(cardId)) {
      skippedCount++;
      continue;
    }

    cleanCount++;
    const tokens = tokenize(card.target);

    for (const token of tokens) {
      if (token.length === 0) continue;
      totalTokens++;

      const meaning = lookupWord(token, card.english);

      if (meaning === '?') unknownCount++;

      if (!alignments[token]) {
        alignments[token] = [];
      }

      alignments[token].push({
        en: meaning,
        card: cardId
      });
    }
  }

  console.log(`\nProcessed ${cleanCount} clean cards (skipped ${skippedCount} flagged)`);
  console.log(`Total tokens: ${totalTokens}`);
  console.log(`Unique words: ${Object.keys(alignments).length}`);
  console.log(`Unknown tokens: ${unknownCount} (${(unknownCount/totalTokens*100).toFixed(1)}%)`);

  return alignments;
}

const alignments = processAllCards();

// Write output
const output = { alignments };
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
console.log(`\nOutput written to ${OUTPUT_PATH}`);

// Show some stats about unknown words
const unknowns = {};
for (const [word, entries] of Object.entries(alignments)) {
  if (entries[0].en === '?') {
    unknowns[word] = entries.length;
  }
}
const sortedUnknowns = Object.entries(unknowns).sort((a, b) => b[1] - a[1]);
console.log(`\nTop 30 unknown words (by frequency):`);
for (const [word, count] of sortedUnknowns.slice(0, 30)) {
  console.log(`  ${word}: ${count} occurrences`);
}
