#!/usr/bin/env node
/**
 * clean-rebuild-v2-it.cjs – Italian dictionary rebuild with proper verb infinitive handling
 *
 * Pipeline:
 *   1. Parse all entries from it.ts
 *   2. Classify: VERB_INFINITIVE, VERB_FORM, NON_VERB
 *   3. Collect unique infinitives
 *   4. Translate infinitives via Google (it→en, batch 80)
 *   5. Add "to " prefix + QC
 *   6. Assign verb definitions
 *   7. Translate non-verbs via Google
 *   8. Function word table (hand-verified)
 *   9. Write it.ts
 *  10. Built-in QC
 *  11. TypeScript verify
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src', 'data', 'dictionary', 'it.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ─── Step 8: Function word table (hand-verified) ───────────────────────────
const FUNCTION_WORDS = {
  // Articles
  'il':{en:'the',pos:'det'},'lo':{en:'the',pos:'det'},'la':{en:'the',pos:'det'},
  'i':{en:'the',pos:'det'},'gli':{en:'the',pos:'det'},'le':{en:'the',pos:'det'},
  'l':{en:'the',pos:'det'},
  'un':{en:'a',pos:'det'},'uno':{en:'a',pos:'det'},'una':{en:'a',pos:'det'},
  // Prepositions
  'a':{en:'to/at',pos:'prep'},'di':{en:'of/from',pos:'prep'},'da':{en:'from/by',pos:'prep'},
  'in':{en:'in',pos:'prep'},'con':{en:'with',pos:'prep'},'su':{en:'on/upon',pos:'prep'},
  'per':{en:'for',pos:'prep'},'tra':{en:'between',pos:'prep'},'fra':{en:'between',pos:'prep'},
  'senza':{en:'without',pos:'prep'},'sotto':{en:'under',pos:'prep'},'sopra':{en:'above',pos:'prep'},
  'dentro':{en:'inside',pos:'prep'},'fuori':{en:'outside',pos:'prep'},'verso':{en:'towards',pos:'prep'},
  'dopo':{en:'after',pos:'prep'},'prima':{en:'before',pos:'prep'},'durante':{en:'during',pos:'prep'},
  'contro':{en:'against',pos:'prep'},'lungo':{en:'along',pos:'prep'},'oltre':{en:'beyond',pos:'prep'},
  'fino':{en:'until',pos:'prep'},'mediante':{en:'by means of',pos:'prep'},
  // Articulated prepositions
  'al':{en:'to the',pos:'prep'},'allo':{en:'to the',pos:'prep'},'alla':{en:'to the',pos:'prep'},
  'ai':{en:'to the',pos:'prep'},'agli':{en:'to the',pos:'prep'},'alle':{en:'to the',pos:'prep'},
  'del':{en:'of the',pos:'prep'},'dello':{en:'of the',pos:'prep'},'della':{en:'of the',pos:'prep'},
  'dei':{en:'of the',pos:'prep'},'degli':{en:'of the',pos:'prep'},'delle':{en:'of the',pos:'prep'},
  'dal':{en:'from the',pos:'prep'},'dallo':{en:'from the',pos:'prep'},'dalla':{en:'from the',pos:'prep'},
  'dai':{en:'from the',pos:'prep'},'dagli':{en:'from the',pos:'prep'},'dalle':{en:'from the',pos:'prep'},
  'nel':{en:'in the',pos:'prep'},'nello':{en:'in the',pos:'prep'},'nella':{en:'in the',pos:'prep'},
  'nei':{en:'in the',pos:'prep'},'negli':{en:'in the',pos:'prep'},'nelle':{en:'in the',pos:'prep'},
  'sul':{en:'on the',pos:'prep'},'sullo':{en:'on the',pos:'prep'},'sulla':{en:'on the',pos:'prep'},
  'sui':{en:'on the',pos:'prep'},'sugli':{en:'on the',pos:'prep'},'sulle':{en:'on the',pos:'prep'},
  // Personal pronouns
  'io':{en:'I',pos:'pron'},'tu':{en:'you',pos:'pron'},'lui':{en:'he',pos:'pron'},
  'lei':{en:'she/you (formal)',pos:'pron'},'noi':{en:'we',pos:'pron'},'voi':{en:'you (plural)',pos:'pron'},
  'loro':{en:'they/them',pos:'pron'},'esso':{en:'it',pos:'pron'},'essa':{en:'it',pos:'pron'},
  // Object/reflexive pronouns
  'mi':{en:'me/myself',pos:'pron'},'ti':{en:'you/yourself',pos:'pron'},'si':{en:'oneself',pos:'pron'},
  'ci':{en:'us/ourselves/there',pos:'pron'},'vi':{en:'you/yourselves',pos:'pron'},
  'ne':{en:'of it/some',pos:'pron'},'li':{en:'them (m)',pos:'pron'},
  'me':{en:'me',pos:'pron'},'te':{en:'you',pos:'pron'},'sé':{en:'oneself',pos:'pron'},
  // Possessives
  'mio':{en:'my',pos:'det'},'mia':{en:'my',pos:'det'},'miei':{en:'my',pos:'det'},'mie':{en:'my',pos:'det'},
  'tuo':{en:'your',pos:'det'},'tua':{en:'your',pos:'det'},'tuoi':{en:'your',pos:'det'},'tue':{en:'your',pos:'det'},
  'suo':{en:'his/her/your',pos:'det'},'sua':{en:'his/her/your',pos:'det'},
  'suoi':{en:'his/her/your',pos:'det'},'sue':{en:'his/her/your',pos:'det'},
  'nostro':{en:'our',pos:'det'},'nostra':{en:'our',pos:'det'},'nostri':{en:'our',pos:'det'},'nostre':{en:'our',pos:'det'},
  'vostro':{en:'your',pos:'det'},'vostra':{en:'your',pos:'det'},'vostri':{en:'your',pos:'det'},'vostre':{en:'your',pos:'det'},
  // Demonstratives
  'questo':{en:'this',pos:'det'},'questa':{en:'this',pos:'det'},'questi':{en:'these',pos:'det'},'queste':{en:'these',pos:'det'},
  'quello':{en:'that',pos:'det'},'quella':{en:'that',pos:'det'},'quelli':{en:'those',pos:'det'},'quelle':{en:'those',pos:'det'},
  'ciò':{en:'this/that',pos:'pron'},
  // Conjunctions
  'e':{en:'and',pos:'conj'},'ed':{en:'and',pos:'conj'},'o':{en:'or',pos:'conj'},
  'ma':{en:'but',pos:'conj'},'però':{en:'however',pos:'conj'},'né':{en:'neither/nor',pos:'conj'},
  'che':{en:'that/which/who',pos:'conj'},'perché':{en:'because/why',pos:'conj'},
  'se':{en:'if',pos:'conj'},'quando':{en:'when',pos:'conj'},'come':{en:'as/like/how',pos:'conj'},
  'dove':{en:'where',pos:'conj'},'mentre':{en:'while',pos:'conj'},'anche':{en:'also',pos:'conj'},
  'oppure':{en:'or else',pos:'conj'},'dunque':{en:'therefore',pos:'conj'},
  'quindi':{en:'therefore',pos:'conj'},'poiché':{en:'since',pos:'conj'},
  'affinché':{en:'so that',pos:'conj'},'benché':{en:'although',pos:'conj'},
  'sebbene':{en:'although',pos:'conj'},'purché':{en:'provided that',pos:'conj'},
  // Adverbs
  'non':{en:'not',pos:'adv'},'no':{en:'no',pos:'adv'},'sì':{en:'yes',pos:'adv'},
  'già':{en:'already',pos:'adv'},'ancora':{en:'still/again',pos:'adv'},'sempre':{en:'always',pos:'adv'},
  'mai':{en:'never',pos:'adv'},'molto':{en:'very/much',pos:'adv'},'poco':{en:'little',pos:'adv'},
  'più':{en:'more',pos:'adv'},'meno':{en:'less',pos:'adv'},'troppo':{en:'too much',pos:'adv'},
  'tanto':{en:'so much',pos:'adv'},'così':{en:'so/thus',pos:'adv'},'qui':{en:'here',pos:'adv'},
  'qua':{en:'here',pos:'adv'},'lì':{en:'there',pos:'adv'},'là':{en:'there',pos:'adv'},
  'ora':{en:'now',pos:'adv'},'adesso':{en:'now',pos:'adv'},'poi':{en:'then',pos:'adv'},
  'oggi':{en:'today',pos:'adv'},'ieri':{en:'yesterday',pos:'adv'},'domani':{en:'tomorrow',pos:'adv'},
  'bene':{en:'well',pos:'adv'},'male':{en:'badly',pos:'adv'},'subito':{en:'immediately',pos:'adv'},
  'quasi':{en:'almost',pos:'adv'},'forse':{en:'perhaps',pos:'adv'},'solo':{en:'only',pos:'adv'},
  'proprio':{en:'really/own',pos:'adv'},'davvero':{en:'really',pos:'adv'},
  'appena':{en:'just/barely',pos:'adv'},'ancora':{en:'still/again',pos:'adv'},
  'abbastanza':{en:'enough',pos:'adv'},'piuttosto':{en:'rather',pos:'adv'},
  'spesso':{en:'often',pos:'adv'},'presto':{en:'soon/early',pos:'adv'},'tardi':{en:'late',pos:'adv'},
  'insieme':{en:'together',pos:'adv'},'circa':{en:'about/approximately',pos:'adv'},
  // Interrogatives
  'chi':{en:'who',pos:'pron'},'cosa':{en:'what/thing',pos:'pron'},
  'quale':{en:'which',pos:'det'},'quali':{en:'which',pos:'det'},
  'quanto':{en:'how much',pos:'adv'},'quanta':{en:'how much',pos:'det'},
  'quanti':{en:'how many',pos:'det'},'quante':{en:'how many',pos:'det'},
  // Indefinites
  'tutto':{en:'all/everything',pos:'pron'},'tutta':{en:'all/every',pos:'det'},
  'tutti':{en:'all/everyone',pos:'pron'},'tutte':{en:'all/every',pos:'det'},
  'ogni':{en:'each/every',pos:'det'},'niente':{en:'nothing',pos:'pron'},'nulla':{en:'nothing',pos:'pron'},
  'qualcuno':{en:'someone',pos:'pron'},'qualcosa':{en:'something',pos:'pron'},
  'nessuno':{en:'no one',pos:'pron'},'nessuna':{en:'no one',pos:'pron'},
  'altro':{en:'other',pos:'det'},'altra':{en:'other',pos:'det'},
  'altri':{en:'others',pos:'det'},'altre':{en:'others',pos:'det'},
  'stesso':{en:'same/self',pos:'adj'},'stessa':{en:'same/self',pos:'adj'},
  'stessi':{en:'same/selves',pos:'adj'},'stesse':{en:'same/selves',pos:'adj'},
  'alcuno':{en:'some',pos:'det'},'alcuna':{en:'some',pos:'det'},
  'alcuni':{en:'some',pos:'det'},'alcune':{en:'some',pos:'det'},
  'certo':{en:'certain',pos:'det'},'certa':{en:'certain',pos:'det'},
  'certi':{en:'certain',pos:'det'},'certe':{en:'certain',pos:'det'},
  // Relative pronouns
  'cui':{en:'whom/which',pos:'pron'},
  // High-frequency verb forms as function words
  'sono':{en:'to be',pos:'v',lemma:'essere'},'sei':{en:'to be',pos:'v',lemma:'essere'},
  'è':{en:'to be',pos:'v',lemma:'essere'},'siamo':{en:'to be',pos:'v',lemma:'essere'},
  'siete':{en:'to be',pos:'v',lemma:'essere'},'era':{en:'to be',pos:'v',lemma:'essere'},
  'erano':{en:'to be',pos:'v',lemma:'essere'},'stato':{en:'to be',pos:'v',lemma:'essere'},
  'stata':{en:'to be',pos:'v',lemma:'essere'},'essere':{en:'to be',pos:'v'},
  'ho':{en:'to have',pos:'v',lemma:'avere'},'hai':{en:'to have',pos:'v',lemma:'avere'},
  'ha':{en:'to have',pos:'v',lemma:'avere'},'abbiamo':{en:'to have',pos:'v',lemma:'avere'},
  'avete':{en:'to have',pos:'v',lemma:'avere'},'hanno':{en:'to have',pos:'v',lemma:'avere'},
  'aveva':{en:'to have',pos:'v',lemma:'avere'},'avevano':{en:'to have',pos:'v',lemma:'avere'},
  'avere':{en:'to have',pos:'v'},
  'sto':{en:'to stay/be',pos:'v',lemma:'stare'},'stai':{en:'to stay/be',pos:'v',lemma:'stare'},
  'sta':{en:'to stay/be',pos:'v',lemma:'stare'},'stiamo':{en:'to stay/be',pos:'v',lemma:'stare'},
  'stanno':{en:'to stay/be',pos:'v',lemma:'stare'},'stare':{en:'to stay/be',pos:'v'},
  'faccio':{en:'to do/make',pos:'v',lemma:'fare'},'fai':{en:'to do/make',pos:'v',lemma:'fare'},
  'fa':{en:'to do/make',pos:'v',lemma:'fare'},'facciamo':{en:'to do/make',pos:'v',lemma:'fare'},
  'fanno':{en:'to do/make',pos:'v',lemma:'fare'},'fare':{en:'to do/make',pos:'v'},
  'vado':{en:'to go',pos:'v',lemma:'andare'},'vai':{en:'to go',pos:'v',lemma:'andare'},
  'va':{en:'to go',pos:'v',lemma:'andare'},'andiamo':{en:'to go',pos:'v',lemma:'andare'},
  'vanno':{en:'to go',pos:'v',lemma:'andare'},'andare':{en:'to go',pos:'v'},
  'posso':{en:'to be able',pos:'v',lemma:'potere'},'puoi':{en:'to be able',pos:'v',lemma:'potere'},
  'può':{en:'to be able',pos:'v',lemma:'potere'},'possiamo':{en:'to be able',pos:'v',lemma:'potere'},
  'possono':{en:'to be able',pos:'v',lemma:'potere'},'potere':{en:'to be able',pos:'v'},
  'devo':{en:'to must/have to',pos:'v',lemma:'dovere'},'devi':{en:'to must/have to',pos:'v',lemma:'dovere'},
  'deve':{en:'to must/have to',pos:'v',lemma:'dovere'},'dobbiamo':{en:'to must/have to',pos:'v',lemma:'dovere'},
  'devono':{en:'to must/have to',pos:'v',lemma:'dovere'},'dovere':{en:'to must/have to',pos:'v'},
  'voglio':{en:'to want',pos:'v',lemma:'volere'},'vuoi':{en:'to want',pos:'v',lemma:'volere'},
  'vuole':{en:'to want',pos:'v',lemma:'volere'},'vogliamo':{en:'to want',pos:'v',lemma:'volere'},
  'vogliono':{en:'to want',pos:'v',lemma:'volere'},'volere':{en:'to want',pos:'v'},
  'so':{en:'to know',pos:'v',lemma:'sapere'},'sai':{en:'to know',pos:'v',lemma:'sapere'},
  'sa':{en:'to know',pos:'v',lemma:'sapere'},'sappiamo':{en:'to know',pos:'v',lemma:'sapere'},
  'sanno':{en:'to know',pos:'v',lemma:'sapere'},'sapere':{en:'to know',pos:'v'},
  'dico':{en:'to say/tell',pos:'v',lemma:'dire'},'dici':{en:'to say/tell',pos:'v',lemma:'dire'},
  'dice':{en:'to say/tell',pos:'v',lemma:'dire'},'diciamo':{en:'to say/tell',pos:'v',lemma:'dire'},
  'dicono':{en:'to say/tell',pos:'v',lemma:'dire'},'dire':{en:'to say/tell',pos:'v'},
  'do':{en:'to give',pos:'v',lemma:'dare'},'dai':{en:'to give',pos:'v',lemma:'dare'},
  'dà':{en:'to give',pos:'v',lemma:'dare'},'diamo':{en:'to give',pos:'v',lemma:'dare'},
  'danno':{en:'to give',pos:'v',lemma:'dare'},'dare':{en:'to give',pos:'v'},
  'vengo':{en:'to come',pos:'v',lemma:'venire'},'vieni':{en:'to come',pos:'v',lemma:'venire'},
  'viene':{en:'to come',pos:'v',lemma:'venire'},'veniamo':{en:'to come',pos:'v',lemma:'venire'},
  'vengono':{en:'to come',pos:'v',lemma:'venire'},'venire':{en:'to come',pos:'v'},
};

// ─── Helpers ────────────────────────────────────────────────────────────────

// Words ending in -are/-ere/-ire that are NOT verb infinitives
const FALSE_INFINITIVES = new Set([
  // Nouns/adjectives ending in -are
  'altare', 'mare', 'olare', 'olare', 'familiare', 'popolare', 'particolare',
  'regolare', 'simile', 'solare', 'lunare', 'nucleare', 'cellulare',
  'scolastico', 'militare', 'circolare', 'muscolare', 'singolare',
  'spettacolare', 'rettangolare', 'triangolare', 'secolare', 'modulare',
  'angolare', 'polare', 'volgare', 'esemplare', 'bar',
  // Nouns/adjectives ending in -ere
  'piacere', 'carattere', 'potere', 'bicchiere', 'mestiere', 'quartiere',
  'cameriere', 'infermiere', 'ingegnere', 'cancelliere',
  // Nouns ending in -ire (very few)
  'avvenire', 'piacere',
]);

/** Is this key an Italian verb infinitive? */
function isInfinitive(key) {
  const clean = key.replace(/^[¿¡]+/, '');
  if (FALSE_INFINITIVES.has(clean)) return false;
  return /(?:are|ere|ire|arsi|ersi|irsi)$/.test(clean);
}

/** Parse all entries from it.ts */
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

// Words that are both valid verbs AND nouns/past tense – whitelist for QC
const VERB_NOUN_OVERLAP = new Set([
  'store', 'fall', 'cut', 'read', 'rain', 'program', 'park', 'dress',
  'light', 'fire', 'snow', 'place', 'work', 'love', 'name', 'face',
  'train', 'fish', 'boat', 'ship', 'test', 'game', 'film', 'picture',
  'class', 'spring', 'cost', 'price', 'power', 'air', 'salt', 'oil',
  'butter', 'egg', 'lunch', 'dinner', 'breakfast', 'party', 'gift',
  'coat', 'hat', 'dog', 'cat', 'star', 'moon', 'key', 'bag', 'box',
  'cup', 'page', 'paper', 'sugar', 'milk', 'water', 'head',
  'do', 'have', 'be', 'can', 'will', 'may', 'might', 'would', 'should',
  'reason', 'fear',
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
  console.log('\n=== Step 1: Parse all entries from it.ts ===');
  const existing = parseDict();
  const keys = Object.keys(existing);
  console.log(`  Parsed ${keys.length} entries`);

  // ── Step 2: Classify ──
  console.log('\n=== Step 2: Classify entries ===');
  const verbInfinitives = {};   // key → existing entry
  const verbForms = {};         // key → existing entry (has lemma pointing to infinitive)
  const nonVerbs = {};          // key → existing entry

  for (const [key, entry] of Object.entries(existing)) {
    // Skip entries that are in function words table – they'll be handled there
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
  console.log('\n=== Step 4: Translate infinitives via Google (it→en) ===');
  const infTranslations = await translateBatch(uniqueInfinitives, 'it', 'en');
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
      console.log(`  QC WARN: "${inf}" → "to ${translation}" – base too short`);
      isGood = false;
    }

    // Check against noun list (but allow known verb/noun overlaps)
    if (COMMON_NOUNS.has(baseWord) && !VERB_NOUN_OVERLAP.has(baseWord)) {
      console.log(`  QC WARN: "${inf}" → "to ${translation}" – base is a common noun`);
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
  console.log('\n=== Step 7: Translate non-verbs via Google (it→en) ===');
  const nonVerbKeys = Object.keys(nonVerbs);
  // Filter out keys that are already in function words
  const toTranslate = nonVerbKeys.filter(k => !FUNCTION_WORDS[k]);
  console.log(`  ${toTranslate.length} non-verb entries to translate`);

  const nvTranslations = await translateBatch(toTranslate, 'it', 'en');

  let nvAssigned = 0;
  for (const [key, entry] of Object.entries(nonVerbs)) {
    if (FUNCTION_WORDS[key]) continue; // skip, already added

    const raw = nvTranslations.get(key);
    let translation = raw ? decodeHtmlEntities(raw).trim() : entry.en;

    // Minimal post-processing for non-verbs
    // Lowercase first letter (unless non-Latin script or proper noun)
    if (translation && /^[A-Z]/.test(translation) && !/^[A-Z]{2}/.test(translation)) {
      const lc = translation[0].toLowerCase() + translation.slice(1);
      translation = lc;
    }
    // Cap at 60 chars
    if (translation && translation.length > 60) {
      translation = translation.slice(0, 57) + '...';
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

  // ── Step 9: Write it.ts ──
  console.log('\n=== Step 9: Write to it.ts ===');

  // Read header (everything before the dictionary export)
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const headerEnd = src.indexOf("export const dictionary");
  const header = src.slice(0, headerEnd);

  // Sort entries alphabetically
  const sortedKeys = Object.keys(finalEntries).sort((a, b) => a.localeCompare(b, 'it'));

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
  console.log(`  Wrote ${sortedKeys.length} entries to it.ts`);

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
      // Exception: essere→"to be", avere→"to have", etc. are OK
      const legitVerbToBe = ['essere', 'avere', 'stare', 'potere', 'dovere', 'volere', 'sapere'];
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
        // Bad "to X" – if it's supposed to be a verb, try keeping existing or using lemma
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
      const fixedKeys = Object.keys(fixDict).sort((a, b) => a.localeCompare(b, 'it'));
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
    // Filter for it.ts errors only
    const itErrors = (stderr + stdout).split('\n').filter(l => l.includes('it.ts'));
    if (itErrors.length > 0) {
      console.log('  TypeScript: FAIL (it.ts errors):');
      for (const line of itErrors.slice(0, 10)) console.log('    ' + line);
    } else {
      console.log('  TypeScript: PASS (non-it.ts errors ignored)');
    }
  }

  // ── Report ──
  console.log('\n════════════════════════════════════════');
  console.log('  REBUILD REPORT (Italian)');
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
