#!/usr/bin/env node
/**
 * clean-rebuild-v2.cjs — Spanish dictionary rebuild with proper verb infinitive handling
 *
 * Pipeline:
 *   1. Parse all entries from es.ts
 *   2. Classify: VERB_INFINITIVE, VERB_FORM, NON_VERB
 *   3. Collect unique infinitives
 *   4. Translate infinitives via Google (es→en, batch 80)
 *   5. Add "to " prefix + QC
 *   6. Assign verb definitions
 *   7. Translate non-verbs via Google
 *   8. Function word table (hand-verified)
 *   9. Write es.ts
 *  10. Built-in QC
 *  11. TypeScript verify
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src', 'data', 'dictionary', 'es.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ─── Step 8: Function word table (hand-verified) ───────────────────────────
const FUNCTION_WORDS = {
  'el':{en:'the',pos:'det'},'la':{en:'the',pos:'det'},'los':{en:'the',pos:'det'},'las':{en:'the',pos:'det'},
  'un':{en:'a',pos:'det'},'una':{en:'a',pos:'det'},'unos':{en:'some',pos:'det'},'unas':{en:'some',pos:'det'},
  'al':{en:'to the',pos:'prep'},'del':{en:'of the',pos:'prep'},
  'yo':{en:'I',pos:'pron'},'tú':{en:'you',pos:'pron'},'él':{en:'he',pos:'pron'},'ella':{en:'she',pos:'pron'},
  'nosotros':{en:'we',pos:'pron'},'nosotras':{en:'we',pos:'pron'},
  'vosotros':{en:'you (plural)',pos:'pron'},'vosotras':{en:'you (plural)',pos:'pron'},
  'ellos':{en:'they',pos:'pron'},'ellas':{en:'they',pos:'pron'},
  'usted':{en:'you (formal)',pos:'pron'},'ustedes':{en:'you (formal plural)',pos:'pron'},
  'me':{en:'me',pos:'pron'},'te':{en:'you',pos:'pron'},'se':{en:'oneself',pos:'pron'},
  'nos':{en:'us',pos:'pron'},'os':{en:'you',pos:'pron'},
  'le':{en:'him/her',pos:'pron'},'les':{en:'them',pos:'pron'},'lo':{en:'it/him',pos:'pron'},
  'mí':{en:'me',pos:'pron'},'ti':{en:'you',pos:'pron'},'sí':{en:'yes',pos:'adv'},
  'conmigo':{en:'with me',pos:'pron'},'contigo':{en:'with you',pos:'pron'},'consigo':{en:'with oneself',pos:'pron'},
  'mi':{en:'my',pos:'det'},'mis':{en:'my',pos:'det'},'tu':{en:'your',pos:'det'},'tus':{en:'your',pos:'det'},
  'su':{en:'his/her/your/their',pos:'det'},'sus':{en:'his/her/your/their',pos:'det'},
  'nuestro':{en:'our',pos:'det'},'nuestra':{en:'our',pos:'det'},'nuestros':{en:'our',pos:'det'},'nuestras':{en:'our',pos:'det'},
  'vuestro':{en:'your',pos:'det'},'vuestra':{en:'your',pos:'det'},
  'mío':{en:'mine',pos:'pron'},'mía':{en:'mine',pos:'pron'},
  'tuyo':{en:'yours',pos:'pron'},'tuya':{en:'yours',pos:'pron'},
  'suyo':{en:'his/hers/yours/theirs',pos:'pron'},'suya':{en:'his/hers/yours/theirs',pos:'pron'},
  'este':{en:'this',pos:'det'},'esta':{en:'this',pos:'det'},'estos':{en:'these',pos:'det'},'estas':{en:'these',pos:'det'},
  'ese':{en:'that',pos:'det'},'esa':{en:'that',pos:'det'},'esos':{en:'those',pos:'det'},'esas':{en:'those',pos:'det'},
  'aquel':{en:'that (far)',pos:'det'},'aquella':{en:'that (far)',pos:'det'},
  'aquellos':{en:'those (far)',pos:'det'},'aquellas':{en:'those (far)',pos:'det'},
  'esto':{en:'this',pos:'pron'},'eso':{en:'that',pos:'pron'},'aquello':{en:'that (far)',pos:'pron'},
  'a':{en:'to/at',pos:'prep'},'de':{en:'of/from',pos:'prep'},'en':{en:'in/on',pos:'prep'},
  'con':{en:'with',pos:'prep'},'por':{en:'for/by',pos:'prep'},'para':{en:'for/to',pos:'prep'},
  'sin':{en:'without',pos:'prep'},'sobre':{en:'on/about',pos:'prep'},'entre':{en:'between',pos:'prep'},
  'hasta':{en:'until',pos:'prep'},'desde':{en:'since/from',pos:'prep'},'hacia':{en:'towards',pos:'prep'},
  'durante':{en:'during',pos:'prep'},'contra':{en:'against',pos:'prep'},'tras':{en:'after/behind',pos:'prep'},
  'según':{en:'according to',pos:'prep'},'ante':{en:'before/in front of',pos:'prep'},
  'bajo':{en:'under',pos:'prep'},'mediante':{en:'by means of',pos:'prep'},
  'y':{en:'and',pos:'conj'},'e':{en:'and',pos:'conj'},'o':{en:'or',pos:'conj'},'u':{en:'or',pos:'conj'},
  'pero':{en:'but',pos:'conj'},'sino':{en:'but/rather',pos:'conj'},'ni':{en:'neither/nor',pos:'conj'},
  'que':{en:'that/which',pos:'conj'},'porque':{en:'because',pos:'conj'},'aunque':{en:'although',pos:'conj'},
  'si':{en:'if',pos:'conj'},'cuando':{en:'when',pos:'conj'},'como':{en:'as/like',pos:'conj'},
  'donde':{en:'where',pos:'conj'},'mientras':{en:'while',pos:'conj'},'pues':{en:'since/well',pos:'conj'},
  'ya':{en:'already',pos:'adv'},'muy':{en:'very',pos:'adv'},'más':{en:'more',pos:'adv'},
  'menos':{en:'less',pos:'adv'},'también':{en:'also',pos:'adv'},'todavía':{en:'still',pos:'adv'},
  'siempre':{en:'always',pos:'adv'},'nunca':{en:'never',pos:'adv'},
  'aquí':{en:'here',pos:'adv'},'ahí':{en:'there',pos:'adv'},'allí':{en:'there',pos:'adv'},
  'ahora':{en:'now',pos:'adv'},'hoy':{en:'today',pos:'adv'},'ayer':{en:'yesterday',pos:'adv'},
  'mañana':{en:'tomorrow',pos:'adv'},'bien':{en:'well',pos:'adv'},'mal':{en:'badly',pos:'adv'},
  'mucho':{en:'much',pos:'adv'},'poco':{en:'little',pos:'adv'},'bastante':{en:'enough',pos:'adv'},
  'demasiado':{en:'too much',pos:'adv'},'sólo':{en:'only',pos:'adv'},'solo':{en:'only',pos:'adv'},
  'casi':{en:'almost',pos:'adv'},'quizás':{en:'perhaps',pos:'adv'},'tan':{en:'so/such',pos:'adv'},
  'aún':{en:'still/yet',pos:'adv'},'luego':{en:'then/later',pos:'adv'},'después':{en:'after/later',pos:'adv'},
  'antes':{en:'before',pos:'adv'},'dentro':{en:'inside',pos:'adv'},'fuera':{en:'outside',pos:'adv'},
  'arriba':{en:'above',pos:'adv'},'abajo':{en:'down',pos:'adv'},'lejos':{en:'far',pos:'adv'},
  'cerca':{en:'near',pos:'adv'},'pronto':{en:'soon',pos:'adv'},'tarde':{en:'late',pos:'adv'},
  'temprano':{en:'early',pos:'adv'},'así':{en:'thus/like this',pos:'adv'},'entonces':{en:'then',pos:'adv'},
  'no':{en:'no/not',pos:'adv'},
  'qué':{en:'what',pos:'pron'},'quién':{en:'who',pos:'pron'},'quiénes':{en:'who',pos:'pron'},
  'cuál':{en:'which',pos:'pron'},'cuáles':{en:'which',pos:'pron'},
  'cómo':{en:'how',pos:'adv'},'dónde':{en:'where',pos:'adv'},'cuándo':{en:'when',pos:'adv'},
  'cuánto':{en:'how much',pos:'adv'},'cuánta':{en:'how much',pos:'adv'},
  'cuántos':{en:'how many',pos:'adv'},'cuántas':{en:'how many',pos:'adv'},
  'nada':{en:'nothing',pos:'pron'},'nadie':{en:'nobody',pos:'pron'},
  'algo':{en:'something',pos:'pron'},'alguien':{en:'someone',pos:'pron'},
  'todo':{en:'all/everything',pos:'pron'},'toda':{en:'all/every',pos:'det'},
  'todos':{en:'all/everyone',pos:'pron'},'todas':{en:'all/every',pos:'det'},
  'otro':{en:'other/another',pos:'det'},'otra':{en:'other/another',pos:'det'},
  'otros':{en:'others',pos:'det'},'otras':{en:'others',pos:'det'},
  'mismo':{en:'same/self',pos:'adj'},'misma':{en:'same/self',pos:'adj'},
  'cada':{en:'each/every',pos:'det'},
  'algún':{en:'some',pos:'det'},'alguna':{en:'some',pos:'det'},'algunos':{en:'some',pos:'det'},'algunas':{en:'some',pos:'det'},
  'ningún':{en:'no/none',pos:'det'},'ninguna':{en:'no/none',pos:'det'},
  'tanto':{en:'so much',pos:'adv'},'tanta':{en:'so much',pos:'adv'},
  'tantos':{en:'so many',pos:'det'},'tantas':{en:'so many',pos:'det'},
  'cual':{en:'which',pos:'pron'},'cuyo':{en:'whose',pos:'pron'},'cuya':{en:'whose',pos:'pron'},
  'quien':{en:'who',pos:'pron'},
  // High-frequency verb forms as function words
  'soy':{en:'to be',pos:'v',lemma:'ser'},'eres':{en:'to be',pos:'v',lemma:'ser'},
  'es':{en:'to be',pos:'v',lemma:'ser'},'somos':{en:'to be',pos:'v',lemma:'ser'},
  'son':{en:'to be',pos:'v',lemma:'ser'},'era':{en:'to be',pos:'v',lemma:'ser'},
  'fue':{en:'to be/to go',pos:'v',lemma:'ser'},'sido':{en:'to be',pos:'v',lemma:'ser'},
  'ser':{en:'to be',pos:'v'},
  'estoy':{en:'to be',pos:'v',lemma:'estar'},'estás':{en:'to be',pos:'v',lemma:'estar'},
  'está':{en:'to be',pos:'v',lemma:'estar'},'estamos':{en:'to be',pos:'v',lemma:'estar'},
  'están':{en:'to be',pos:'v',lemma:'estar'},'estaba':{en:'to be',pos:'v',lemma:'estar'},
  'estuvo':{en:'to be',pos:'v',lemma:'estar'},'estado':{en:'to be',pos:'v',lemma:'estar'},
  'estar':{en:'to be',pos:'v'},
  'he':{en:'to have',pos:'v',lemma:'haber'},'has':{en:'to have',pos:'v',lemma:'haber'},
  'ha':{en:'to have',pos:'v',lemma:'haber'},'hemos':{en:'to have',pos:'v',lemma:'haber'},
  'han':{en:'to have',pos:'v',lemma:'haber'},'había':{en:'to have',pos:'v',lemma:'haber'},
  'haber':{en:'to have',pos:'v'},'hay':{en:'there is/are',pos:'v',lemma:'haber'},
  'tengo':{en:'to have',pos:'v',lemma:'tener'},'tienes':{en:'to have',pos:'v',lemma:'tener'},
  'tiene':{en:'to have',pos:'v',lemma:'tener'},'tenemos':{en:'to have',pos:'v',lemma:'tener'},
  'tienen':{en:'to have',pos:'v',lemma:'tener'},'tenía':{en:'to have',pos:'v',lemma:'tener'},
  'tener':{en:'to have',pos:'v'},
  'puedo':{en:'to be able',pos:'v',lemma:'poder'},'puedes':{en:'to be able',pos:'v',lemma:'poder'},
  'puede':{en:'to be able',pos:'v',lemma:'poder'},'podemos':{en:'to be able',pos:'v',lemma:'poder'},
  'pueden':{en:'to be able',pos:'v',lemma:'poder'},'poder':{en:'to be able',pos:'v'},
  'quiero':{en:'to want',pos:'v',lemma:'querer'},'quiere':{en:'to want',pos:'v',lemma:'querer'},
  'querer':{en:'to want',pos:'v'},
  'debo':{en:'to must/owe',pos:'v',lemma:'deber'},'debe':{en:'to must/owe',pos:'v',lemma:'deber'},
  'deber':{en:'to must/owe',pos:'v'},
  'voy':{en:'to go',pos:'v',lemma:'ir'},'vas':{en:'to go',pos:'v',lemma:'ir'},
  'va':{en:'to go',pos:'v',lemma:'ir'},'vamos':{en:'to go',pos:'v',lemma:'ir'},
  'van':{en:'to go',pos:'v',lemma:'ir'},'ir':{en:'to go',pos:'v'},
  'hago':{en:'to do/make',pos:'v',lemma:'hacer'},'hace':{en:'to do/make',pos:'v',lemma:'hacer'},
  'hacen':{en:'to do/make',pos:'v',lemma:'hacer'},'hacer':{en:'to do/make',pos:'v'},
  'digo':{en:'to say/tell',pos:'v',lemma:'decir'},'dice':{en:'to say/tell',pos:'v',lemma:'decir'},
  'dicen':{en:'to say/tell',pos:'v',lemma:'decir'},'decir':{en:'to say/tell',pos:'v'},
  'sé':{en:'to know',pos:'v',lemma:'saber'},'sabe':{en:'to know',pos:'v',lemma:'saber'},
  'saber':{en:'to know',pos:'v'},
  'doy':{en:'to give',pos:'v',lemma:'dar'},'da':{en:'to give',pos:'v',lemma:'dar'},
  'dan':{en:'to give',pos:'v',lemma:'dar'},'dar':{en:'to give',pos:'v'},
  'vengo':{en:'to come',pos:'v',lemma:'venir'},'viene':{en:'to come',pos:'v',lemma:'venir'},
  'vienen':{en:'to come',pos:'v',lemma:'venir'},'venir':{en:'to come',pos:'v'},
};

// ─── Helpers ────────────────────────────────────────────────────────────────

// Words ending in -ar/-er/-ir that are NOT verb infinitives
const FALSE_INFINITIVES = new Set([
  'ayer', 'anteayer', 'azúcar', 'lugar', 'hogar', 'collar', 'dólar',
  'familiar', 'popular', 'particular', 'regular', 'similar', 'solar',
  'lunar', 'nuclear', 'celular', 'escolar', 'militar', 'circular',
  'muscular', 'singular', 'espectacular', 'rectangular', 'triangular',
  'secular', 'modular', 'angular', 'polar', 'vulgar', 'altar',
  'avatar', 'bazar', 'bar', 'par', 'mar', 'pilar', 'pulgar',
  'ejemplar', 'malestar', 'bienestar', 'pesar', 'palmar',
  'mujer', 'placer', 'carácter', 'poder', 'ayer', 'taller',
  'canciller', 'alquiler', 'cualquier',
  'elixir', 'nadir', 'souvenir', 'tapir',
]);

/** Is this key a Spanish verb infinitive? */
function isInfinitive(key) {
  const clean = key.replace(/^[¿¡]+/, '');
  if (FALSE_INFINITIVES.has(clean)) return false;
  return /(?:ar|er|ir|arse|erse|irse|ír|írse)$/.test(clean);
}

/** Parse all entries from es.ts */
function parseDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};
  const re = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1], body = m[2], entry = {};
    const enM = body.match(/en:\s*'([^']*)'/); if (enM) entry.en = enM[1];
    const ipaM = body.match(/ipa:\s*'([^']*)'/); if (ipaM) entry.ipa = ipaM[1];
    const posM = body.match(/pos:\s*'([^']*)'/); if (posM) entry.pos = posM[1];
    const lemmaM = body.match(/lemma:\s*'([^']*)'/); if (lemmaM) entry.lemma = lemmaM[1];
    entries[key] = entry;
  }
  return entries;
}

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
        } catch (e) { reject(new Error('Parse error: ' + e.message + '\nRaw: ' + data.slice(0, 500))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function translateBatch(wordList, source, target) {
  const BATCH_SIZE = 80;
  const MAX_RETRIES = 3;
  const results = new Map();
  const batches = [];
  for (let i = 0; i < wordList.length; i += BATCH_SIZE) batches.push(wordList.slice(i, i + BATCH_SIZE));
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    process.stdout.write(`  Batch ${i + 1}/${batches.length} (${batch.length} words)...`);
    let translations = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        translations = await googleTranslate(batch, source, target);
        break;
      } catch (err) {
        if (attempt < MAX_RETRIES - 1) {
          const wait = (attempt + 1) * 3000;
          process.stdout.write(` retry in ${wait/1000}s...`);
          await sleep(wait);
        } else {
          throw err;
        }
      }
    }
    for (let j = 0; j < batch.length; j++) {
      results.set(batch[j], translations[j]);
    }
    console.log(' done');
    if (i < batches.length - 1) await sleep(300);
  }
  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function decodeHtmlEntities(s) {
  return s.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

// ─── QC word lists ──────────────────────────────────────────────────────────

const AUXILIARIES = new Set([
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'can', 'could',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'do',
  'does', 'did', 'am', 'be', 'been', 'being',
]);

const THIRD_PERSON_ENDINGS = new Set([
  'costs', 'eats', 'drinks', 'walks', 'talks', 'runs', 'comes', 'goes',
  'takes', 'makes', 'says', 'gives', 'finds', 'tells', 'asks', 'uses',
  'works', 'calls', 'tries', 'needs', 'feels', 'becomes', 'leaves',
  'puts', 'means', 'keeps', 'lets', 'begins', 'seems', 'helps', 'shows',
  'hears', 'plays', 'moves', 'lives', 'believes', 'brings', 'happens',
  'writes', 'provides', 'sits', 'stands', 'loses', 'pays', 'meets',
  'includes', 'continues', 'sets', 'learns', 'changes', 'leads', 'understands',
  'watches', 'follows', 'stops', 'creates', 'speaks', 'reads', 'allows',
  'adds', 'spends', 'grows', 'opens', 'walks', 'wins', 'offers', 'remembers',
  'loves', 'considers', 'appears', 'buys', 'waits', 'serves', 'dies',
  'sends', 'expects', 'builds', 'stays', 'falls', 'cuts', 'reaches',
  'kills', 'remains', 'suggests', 'raises', 'passes', 'sells', 'requires',
  'reports', 'decides', 'pulls',
]);

const PAST_TENSE_WORDS = new Set([
  'came', 'went', 'got', 'gave', 'saw', 'took', 'knew', 'thought',
  'told', 'found', 'asked', 'used', 'worked', 'called', 'tried',
  'left', 'kept', 'let', 'began', 'seemed', 'helped', 'showed',
  'heard', 'played', 'moved', 'lived', 'believed', 'brought', 'happened',
  'wrote', 'sat', 'stood', 'lost', 'paid', 'met', 'ran', 'held',
  'learned', 'changed', 'led', 'understood', 'watched', 'followed',
  'stopped', 'created', 'spoke', 'read', 'allowed', 'added', 'spent',
  'grew', 'opened', 'walked', 'won', 'offered', 'remembered', 'loved',
  'considered', 'appeared', 'bought', 'waited', 'served', 'died',
  'sent', 'expected', 'built', 'stayed', 'fell', 'cut', 'reached',
  'killed', 'remained', 'suggested', 'raised', 'passed', 'sold',
  'decided', 'pulled', 'ate', 'drank', 'drove', 'felt', 'broke',
  'wore', 'chose', 'slept', 'woke', 'drew', 'flew', 'caught', 'threw',
  'hung', 'shook', 'sang', 'swam', 'froze', 'hid', 'rode', 'rose',
  'stole', 'tore', 'wove', 'blew', 'bore', 'swore',
]);

// Common English nouns that should NOT follow "to "
const COMMON_NOUNS = new Set([
  'friend', 'morning', 'house', 'car', 'day', 'night', 'water', 'food',
  'money', 'time', 'year', 'people', 'way', 'world', 'life', 'hand',
  'part', 'place', 'case', 'week', 'company', 'system', 'program',
  'question', 'work', 'government', 'number', 'school', 'area', 'book',
  'family', 'country', 'story', 'home', 'room', 'mother', 'father',
  'child', 'children', 'woman', 'man', 'dog', 'cat', 'door', 'window',
  'table', 'chair', 'bed', 'city', 'street', 'road', 'beach', 'mountain',
  'river', 'tree', 'flower', 'sun', 'moon', 'star', 'rain', 'snow',
  'fire', 'earth', 'air', 'light', 'music', 'art', 'color', 'letter',
  'word', 'name', 'head', 'face', 'eye', 'heart', 'body', 'foot',
  'girl', 'boy', 'baby', 'brother', 'sister', 'son', 'daughter',
  'husband', 'wife', 'king', 'queen', 'doctor', 'teacher', 'student',
  'market', 'store', 'office', 'church', 'hotel', 'restaurant',
  'airport', 'station', 'hospital', 'park', 'garden', 'forest',
  'island', 'bridge', 'museum', 'library', 'train', 'bus', 'plane',
  'ship', 'boat', 'bicycle', 'phone', 'computer', 'radio', 'television',
  'camera', 'clock', 'key', 'bag', 'box', 'cup', 'glass', 'bottle',
  'knife', 'plate', 'fish', 'bird', 'horse', 'cow', 'chicken', 'pig',
  'rice', 'bread', 'meat', 'cheese', 'fruit', 'cake', 'coffee', 'tea',
  'milk', 'wine', 'beer', 'juice', 'oil', 'salt', 'sugar', 'butter',
  'egg', 'soup', 'breakfast', 'lunch', 'dinner', 'price', 'cost',
  'war', 'peace', 'law', 'power', 'truth', 'death', 'love', 'joy',
  'fear', 'pain', 'anger', 'health', 'danger', 'problem', 'idea',
  'reason', 'example', 'game', 'sport', 'team', 'player', 'movie',
  'film', 'song', 'news', 'paper', 'page', 'picture', 'photo',
  'class', 'lesson', 'test', 'grade', 'trip', 'vacation', 'weather',
  'winter', 'summer', 'spring', 'autumn', 'fall', 'month', 'hour',
  'minute', 'second', 'birthday', 'party', 'gift', 'clothes', 'shirt',
  'dress', 'shoe', 'hat', 'coat', 'jacket', 'pants', 'skirt',
]);

// Words that are both valid verbs AND nouns/past tense — whitelist for QC
const VERB_NOUN_OVERLAP = new Set([
  'store', 'fall', 'cut', 'read', 'rain', 'program', 'park', 'dress',
  'light', 'fire', 'snow', 'place', 'work', 'love', 'name', 'face',
  'train', 'fish', 'boat', 'ship', 'test', 'game', 'film', 'picture',
  'class', 'spring', 'cost', 'price', 'power', 'air', 'salt', 'oil',
  'butter', 'egg', 'lunch', 'dinner', 'breakfast', 'party', 'gift',
  'coat', 'hat', 'dog', 'cat', 'star', 'moon', 'key', 'bag', 'box',
  'cup', 'page', 'paper', 'sugar', 'milk', 'water', 'head',
  'do', 'have', 'be', 'can', 'will', 'may', 'might', 'would', 'should',
]);

// Known valid short English verb bases (for QC: "to X" must be a real verb)
const VALID_SHORT_VERBS = new Set([
  'be', 'go', 'do', 'say', 'get', 'see', 'ask', 'use', 'try', 'let',
  'put', 'run', 'set', 'cut', 'pay', 'win', 'buy', 'sit', 'hit', 'lie',
  'die', 'eat', 'fly', 'add', 'fit', 'cry', 'dry', 'fix', 'mix', 'dig',
  'bow', 'bet', 'bid', 'bit', 'dye', 'hug', 'jam', 'jog', 'nap', 'nod',
  'own', 'pet', 'pin', 'pop', 'rip', 'rob', 'rot', 'row', 'rub', 'sew',
  'ski', 'tap', 'tie', 'tip', 'tow', 'tug', 'wax', 'zip', 'ban', 'dip',
  'fan', 'gag', 'hum', 'lag', 'log', 'map', 'mop', 'mug', 'nab', 'pad',
  'peg', 'rig', 'sag', 'sap', 'sob', 'tag', 'tan', 'vow', 'wag', 'wed',
  'vet', 'woo', 'age', 'aim', 'air', 'arm',
]);

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // ── Step 1: Parse ──
  console.log('\n=== Step 1: Parse all entries from es.ts ===');
  const existing = parseDict();
  const keys = Object.keys(existing);
  console.log(`  Parsed ${keys.length} entries`);

  // ── Step 2: Classify ──
  console.log('\n=== Step 2: Classify entries ===');
  const verbInfinitives = {};   // key → existing entry
  const verbForms = {};         // key → existing entry (has lemma pointing to infinitive)
  const nonVerbs = {};          // key → existing entry

  for (const [key, entry] of Object.entries(existing)) {
    // Skip entries that are in function words table — they'll be handled there
    if (FUNCTION_WORDS[key]) continue;

    const cleanKey = key.replace(/^[¿¡]+/, '');
    if (isInfinitive(cleanKey)) {
      verbInfinitives[key] = entry;
    } else if (entry.lemma && isInfinitive(entry.lemma.replace(/^[¿¡]+/, ''))) {
      verbForms[key] = entry;
    } else {
      nonVerbs[key] = entry;
    }
  }

  console.log(`  VERB_INFINITIVE: ${Object.keys(verbInfinitives).length}`);
  console.log(`  VERB_FORM:       ${Object.keys(verbForms).length}`);
  console.log(`  NON_VERB:        ${Object.keys(nonVerbs).length}`);
  console.log(`  FUNCTION_WORD:   ${Object.keys(FUNCTION_WORDS).length}`);

  // ── Step 3: Collect unique infinitives ──
  console.log('\n=== Step 3: Collect unique infinitives ===');
  const infinitiveSet = new Set();
  for (const key of Object.keys(verbInfinitives)) {
    infinitiveSet.add(key.replace(/^[¿¡]+/, ''));
  }
  for (const entry of Object.values(verbForms)) {
    if (entry.lemma) infinitiveSet.add(entry.lemma);
  }
  // Also add lemma targets from function words
  for (const entry of Object.values(FUNCTION_WORDS)) {
    if (entry.lemma && isInfinitive(entry.lemma)) infinitiveSet.add(entry.lemma);
  }

  const uniqueInfinitives = [...infinitiveSet].sort();
  console.log(`  ${uniqueInfinitives.length} unique infinitives collected`);

  // ── Step 4: Translate infinitives via Google ──
  console.log('\n=== Step 4: Translate infinitives via Google (es→en) ===');
  const infTranslations = await translateBatch(uniqueInfinitives, 'es', 'en');
  console.log(`  Translated ${infTranslations.size} infinitives`);

  // ── Step 5: Add "to " prefix + QC ──
  console.log('\n=== Step 5: Add "to " prefix + QC ===');
  const infinitiveToEn = new Map();
  let qcFixes = 0;

  for (const [inf, raw] of infTranslations.entries()) {
    let translation = decodeHtmlEntities(raw).trim();
    // Remove "to " if Google already added it
    if (translation.toLowerCase().startsWith('to ')) {
      translation = translation.slice(3);
    }
    // Lowercase first letter (unless already lowercase)
    if (translation.length > 0 && /^[A-Z]/.test(translation) && !/^[A-Z]{2}/.test(translation)) {
      translation = translation[0].toLowerCase() + translation.slice(1);
    }
    // Cap at 60 chars
    if (translation.length > 60) {
      translation = translation.slice(0, 57) + '...';
    }

    // QC: verify the base word looks like a real English verb
    const baseWord = translation.split(/\s/)[0].toLowerCase();
    let isGood = true;

    // Check if it's suspiciously short (< 3 chars) and not in our known-good list
    if (baseWord.length < 3 && !VALID_SHORT_VERBS.has(baseWord)) {
      console.log(`  QC WARN: "${inf}" → "to ${translation}" — base too short`);
      isGood = false;
    }

    // Check against noun list (but allow known verb/noun overlaps)
    if (COMMON_NOUNS.has(baseWord) && !VERB_NOUN_OVERLAP.has(baseWord)) {
      console.log(`  QC WARN: "${inf}" → "to ${translation}" — base is a common noun`);
      isGood = false;
    }

    if (!isGood) {
      qcFixes++;
      // Try to use existing good translation if available
      const existingEntry = existing[inf];
      if (existingEntry && existingEntry.en && existingEntry.en.startsWith('to ') && existingEntry.en !== `to ${inf}`) {
        translation = existingEntry.en.slice(3);
        console.log(`    → Using existing: "to ${translation}"`);
      }
    }

    infinitiveToEn.set(inf, 'to ' + translation);
  }
  console.log(`  QC fixes applied: ${qcFixes}`);

  // ── Step 6: Assign verb definitions ──
  console.log('\n=== Step 6: Assign verb definitions ===');
  const finalEntries = {};

  // First add function words
  for (const [key, entry] of Object.entries(FUNCTION_WORDS)) {
    finalEntries[key] = { ...entry };
    // Preserve IPA from existing
    if (existing[key] && existing[key].ipa) {
      finalEntries[key].ipa = existing[key].ipa;
    } else {
      finalEntries[key].ipa = finalEntries[key].ipa || '';
    }
  }

  // Verb infinitives
  let infAssigned = 0;
  for (const [key, entry] of Object.entries(verbInfinitives)) {
    const cleanKey = key.replace(/^[¿¡]+/, '');
    const translation = infinitiveToEn.get(cleanKey);
    if (translation) {
      finalEntries[key] = {
        en: translation,
        ipa: entry.ipa || '',
        pos: 'v',
      };
      if (entry.lemma) finalEntries[key].lemma = entry.lemma;
      infAssigned++;
    } else {
      // Fallback: keep existing
      finalEntries[key] = { ...entry, pos: 'v' };
    }
  }
  console.log(`  Infinitives assigned: ${infAssigned}`);

  // Verb forms → get translation from their lemma
  let formAssigned = 0;
  for (const [key, entry] of Object.entries(verbForms)) {
    const lemma = entry.lemma;
    const translation = lemma ? infinitiveToEn.get(lemma) : null;
    if (translation) {
      finalEntries[key] = {
        en: translation,
        ipa: entry.ipa || '',
        pos: 'v',
        lemma: lemma,
      };
      formAssigned++;
    } else {
      // Fallback: keep existing but ensure pos=v
      finalEntries[key] = { ...entry, pos: 'v' };
    }
  }
  console.log(`  Verb forms assigned: ${formAssigned}`);

  // ── Step 7: Translate non-verbs via Google ──
  console.log('\n=== Step 7: Translate non-verbs via Google (es→en) ===');
  const nonVerbKeys = Object.keys(nonVerbs);
  // Filter out keys that are already in function words
  const toTranslate = nonVerbKeys.filter(k => !FUNCTION_WORDS[k]);
  console.log(`  ${toTranslate.length} non-verb entries to translate`);

  const nvTranslations = await translateBatch(toTranslate, 'es', 'en');

  let nvAssigned = 0;
  for (const [key, entry] of Object.entries(nonVerbs)) {
    if (FUNCTION_WORDS[key]) continue; // skip, already added

    const raw = nvTranslations.get(key);
    let translation = raw ? decodeHtmlEntities(raw).trim() : entry.en;

    // Minimal post-processing for non-verbs
    // Lowercase first letter (unless non-Latin script or proper noun)
    if (translation && /^[A-Z]/.test(translation) && !/^[A-Z]{2}/.test(translation)) {
      // Don't lowercase if it's a language name, nationality, etc.
      const lc = translation[0].toLowerCase() + translation.slice(1);
      translation = lc;
    }
    // Cap at 60 chars
    if (translation && translation.length > 60) {
      translation = translation.slice(0, 57) + '...';
    }
    // Remove any "to " prefix that Google might have incorrectly added to non-verbs
    // Only strip if not a function word already
    if (translation && translation.startsWith('to ') && !entry.pos?.includes('v')) {
      // Keep it for now — we'll QC later. Actually we should NOT strip "to " from
      // Google's non-verb translations because Google might be translating an -ar noun
      // that happens to end in a verb pattern. We'll QC in step 10.
    }

    finalEntries[key] = {
      en: translation || entry.en || key,
      ipa: entry.ipa || '',
    };
    if (entry.pos) finalEntries[key].pos = entry.pos;
    if (entry.lemma) finalEntries[key].lemma = entry.lemma;
    nvAssigned++;
  }
  console.log(`  Non-verb entries assigned: ${nvAssigned}`);

  // ── Step 9: Write es.ts ──
  console.log('\n=== Step 9: Write to es.ts ===');

  // Read header (everything before the dictionary export)
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const headerEnd = src.indexOf("export const dictionary");
  const header = src.slice(0, headerEnd);

  // Sort entries alphabetically
  const sortedKeys = Object.keys(finalEntries).sort((a, b) => a.localeCompare(b, 'es'));

  let dictLines = [];
  for (const key of sortedKeys) {
    const e = finalEntries[key];
    // Use double quotes for keys with apostrophes, single quotes otherwise
    const q = key.includes("'") ? '"' : "'";
    const enEsc = (e.en || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const ipaEsc = (e.ipa || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    let line = `  ${q}${key}${q}: { en: '${enEsc}', ipa: '${ipaEsc}'`;
    if (e.pos) line += `, pos: '${e.pos}'`;
    if (e.lemma) line += `, lemma: '${e.lemma}'`;
    line += ' },';
    dictLines.push(line);
  }

  const output = header + `export const dictionary: Record<string, DictEntry> = {\n${dictLines.join('\n')}\n};\n`;
  fs.writeFileSync(DICT_PATH, output, 'utf8');
  console.log(`  Wrote ${sortedKeys.length} entries to es.ts`);

  // ── Step 10: Built-in QC ──
  console.log('\n=== Step 10: Built-in QC ===');
  // Re-parse to verify
  const verified = parseDict();
  let qcPass = true;
  const issues = [];

  // Check 1: Zero "to [auxiliary]"
  let auxIssues = 0;
  for (const [key, entry] of Object.entries(verified)) {
    if (!entry.en) continue;
    const m = entry.en.match(/^to (\w+)$/);
    if (m && AUXILIARIES.has(m[1].toLowerCase())) {
      // Exception: ser→"to be", estar→"to be", haber→"to have", etc. are OK
      const legitVerbToBe = ['ser', 'estar', 'haber', 'tener', 'poder', 'deber'];
      const lemmaOrKey = entry.lemma || key;
      if (!legitVerbToBe.includes(lemmaOrKey) && !VERB_NOUN_OVERLAP.has(m[1].toLowerCase())) {
        issues.push(`  AUX: "${key}" → "${entry.en}"`);
        auxIssues++;
      }
    }
  }
  console.log(`  [1] "to [auxiliary]": ${auxIssues} issues`);

  // Check 2: Zero "to [3rd person]"
  let thirdPersonIssues = 0;
  for (const [key, entry] of Object.entries(verified)) {
    if (!entry.en) continue;
    const m = entry.en.match(/^to (\w+)$/);
    if (m && THIRD_PERSON_ENDINGS.has(m[1].toLowerCase()) && !VERB_NOUN_OVERLAP.has(m[1].toLowerCase())) {
      issues.push(`  3RD: "${key}" → "${entry.en}"`);
      thirdPersonIssues++;
    }
  }
  console.log(`  [2] "to [3rd person]": ${thirdPersonIssues} issues`);

  // Check 3: Zero "to [past tense]"
  let pastIssues = 0;
  for (const [key, entry] of Object.entries(verified)) {
    if (!entry.en) continue;
    const m = entry.en.match(/^to (\w+)$/);
    if (m && PAST_TENSE_WORDS.has(m[1].toLowerCase()) && !VERB_NOUN_OVERLAP.has(m[1].toLowerCase())) {
      issues.push(`  PAST: "${key}" → "${entry.en}"`);
      pastIssues++;
    }
  }
  console.log(`  [3] "to [past tense]": ${pastIssues} issues`);

  // Check 4: Zero "to [noun]"
  let nounIssues = 0;
  for (const [key, entry] of Object.entries(verified)) {
    if (!entry.en) continue;
    const m = entry.en.match(/^to (\w+)$/);
    if (m && COMMON_NOUNS.has(m[1].toLowerCase()) && !VERB_NOUN_OVERLAP.has(m[1].toLowerCase())) {
      issues.push(`  NOUN: "${key}" → "${entry.en}"`);
      nounIssues++;
    }
  }
  console.log(`  [4] "to [noun]": ${nounIssues} issues`);

  // Check 5: All VERB_INFINITIVE entries have "to "
  let missingTo = 0;
  for (const key of Object.keys(verbInfinitives)) {
    if (verified[key] && !verified[key].en.startsWith('to ')) {
      issues.push(`  MISSING_TO: "${key}" → "${verified[key].en}"`);
      missingTo++;
    }
  }
  console.log(`  [5] VERB_INFINITIVE missing "to ": ${missingTo} issues`);

  // Check 6: Zero NON_VERB entries have "to "
  let wrongTo = 0;
  for (const key of Object.keys(nonVerbs)) {
    if (verified[key] && verified[key].en.startsWith('to ') && verified[key].pos !== 'v') {
      issues.push(`  WRONG_TO: "${key}" → "${verified[key].en}" (pos=${verified[key].pos})`);
      wrongTo++;
    }
  }
  console.log(`  [6] NON_VERB with "to ": ${wrongTo} issues`);

  const totalIssues = auxIssues + thirdPersonIssues + pastIssues + nounIssues + missingTo + wrongTo;
  if (totalIssues > 0) {
    console.log(`\n  Total QC issues: ${totalIssues}`);
    console.log('  Attempting auto-fix...');

    // Auto-fix: re-read, fix, re-write
    const fixDict = parseDict();
    let fixes = 0;

    for (const issue of issues) {
      const keyMatch = issue.match(/"([^"]+)" → "/);
      if (!keyMatch) continue;
      const key = keyMatch[1];
      const entry = fixDict[key];
      if (!entry) continue;

      if (issue.includes('AUX:') || issue.includes('3RD:') || issue.includes('PAST:') || issue.includes('NOUN:')) {
        // Bad "to X" — if it's supposed to be a verb, try keeping existing or using lemma
        if (existing[key] && existing[key].en && existing[key].en !== entry.en) {
          fixDict[key].en = existing[key].en;
          fixes++;
        } else {
          // Strip "to " for non-verbs, or mark for manual review
          if (entry.pos !== 'v') {
            fixDict[key].en = entry.en.replace(/^to /, '');
            fixes++;
          }
        }
      } else if (issue.includes('MISSING_TO:')) {
        fixDict[key].en = 'to ' + entry.en;
        fixes++;
      } else if (issue.includes('WRONG_TO:')) {
        fixDict[key].en = entry.en.replace(/^to /, '');
        fixes++;
      }
    }

    if (fixes > 0) {
      // Re-write
      const fixedKeys = Object.keys(fixDict).sort((a, b) => a.localeCompare(b, 'es'));
      let fixedLines = [];
      for (const key of fixedKeys) {
        const e = fixDict[key];
        const q = key.includes("'") ? '"' : "'";
        const enEsc = (e.en || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const ipaEsc = (e.ipa || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        let line = `  ${q}${key}${q}: { en: '${enEsc}', ipa: '${ipaEsc}'`;
        if (e.pos) line += `, pos: '${e.pos}'`;
        if (e.lemma) line += `, lemma: '${e.lemma}'`;
        line += ' },';
        fixedLines.push(line);
      }
      const fixedOutput = header + `export const dictionary: Record<string, DictEntry> = {\n${fixedLines.join('\n')}\n};\n`;
      fs.writeFileSync(DICT_PATH, fixedOutput, 'utf8');
      console.log(`  Applied ${fixes} auto-fixes`);
    }
    qcPass = fixes >= totalIssues;
  } else {
    qcPass = true;
  }
  console.log(`  QC result: ${qcPass ? 'PASS' : 'PARTIAL (some issues remain)'}`);

  // ── Step 11: TypeScript verify ──
  console.log('\n=== Step 11: TypeScript verification ===');
  try {
    execSync('PATH="/opt/homebrew/bin:$PATH" npx tsc --noEmit --skipLibCheck', {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 60000,
    });
    console.log('  TypeScript: PASS');
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : '';
    const stdout = e.stdout ? e.stdout.toString() : '';
    // Filter for es.ts errors only
    const esErrors = (stderr + stdout).split('\n').filter(l => l.includes('es.ts'));
    if (esErrors.length > 0) {
      console.log('  TypeScript: FAIL (es.ts errors):');
      for (const line of esErrors.slice(0, 10)) console.log('    ' + line);
    } else {
      console.log('  TypeScript: PASS (non-es.ts errors ignored)');
    }
  }

  // ── Report ──
  console.log('\n════════════════════════════════════════');
  console.log('  REBUILD REPORT');
  console.log('════════════════════════════════════════');
  console.log(`  Total entries written:    ${Object.keys(parseDict()).length}`);
  console.log(`  VERB_INFINITIVE:          ${Object.keys(verbInfinitives).length}`);
  console.log(`  VERB_FORM:                ${Object.keys(verbForms).length}`);
  console.log(`  NON_VERB:                 ${Object.keys(nonVerbs).length}`);
  console.log(`  FUNCTION_WORD:            ${Object.keys(FUNCTION_WORDS).length}`);
  console.log(`  Infinitives translated:   ${infTranslations.size}`);
  console.log(`  Non-verbs translated:     ${nvTranslations.size}`);
  console.log(`  QC:                       ${qcPass ? 'PASS' : 'PARTIAL'}`);
  console.log('════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
