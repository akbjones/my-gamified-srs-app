#!/usr/bin/env node
/**
 * Italian dictionary semantic verification – comprehensive final version.
 * Uses Google Translate for forward + dual back-translation.
 * Applies only validated fixes with manual overrides for edge cases.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const API_KEY = process.env.GOOGLE_TTS_KEY;

// ── Function words to skip ──────────────────────────────────────
const FUNCTION_WORDS = new Set([
  'il','lo','la','i','gli','le','l','un','uno','una',
  'a','di','da','in','con','su','per','tra','fra',
  'al','allo','alla','ai','agli','alle',
  'del','dello','della','dei','degli','delle',
  'dal','dallo','dalla','dai','dagli','dalle',
  'nel','nello','nella','nei','negli','nelle',
  'sul','sullo','sulla','sui','sugli','sulle',
  'e','ed','o','ma','però','che','se','né','oppure',
  'perché','quando','mentre','come','dove','anche','pure',
  'dunque','quindi','eppure','anzi','cioè','ossia',
  'io','tu','lui','lei','noi','voi','loro','esso','essa',
  'mi','ti','ci','vi','si','lo','la','li','le','ne',
  'me','te','sé','ce','ve',
  'questo','questa','questi','queste',
  'quello','quella','quelli','quelle',
  'chi','cui','quale','quali',
  'mio','mia','miei','mie','tuo','tua','tuoi','tue',
  'suo','sua','suoi','sue',
  'nostro','nostra','nostri','nostre',
  'vostro','vostra','vostri','vostre',
  'non','no','sì','già','più','molto','poco','mai',
  'sempre','ancora','solo','proprio','così','qui','qua',
  'lì','là','ora','adesso','poi','prima','dopo',
  'c','n','d','ecco',
  'è','sono','sei','siamo','siete',
  'ho','hai','ha','abbiamo','avete','hanno',
  'era','ero','eri','eravamo','eravate','erano',
  'sarà','sarò','sarai','saremo','sarete','saranno',
  'sia','siano','siate',
  'stato','stata','stati','state',
  'avevo','avevi','aveva','avevamo','avevate','avevano',
  'avrà','avrò','avrai','avremo','avrete','avranno',
  'abbia','abbiano','abbiate','abbi',
  'fa','fai','fanno','facciamo','fate',
  'do','dai','dà','diamo','danno','date',
  'sta','stai','stanno','stiamo',
  'può','posso','puoi','possiamo','possono','potete',
  'vuoi','vuole','voglio','vogliamo','volete','vogliono',
  'deve','devo','devi','dobbiamo','devono','dovete',
  'va','vai','andiamo','vanno','andate',
  'viene','vengo','vieni','veniamo','vengono','venite',
]);

// ── Parse dictionary (handles escaped quotes) ───────────────────
function parseDictionary(src) {
  const entries = {};
  // Match entries like: 'key': { en: 'value', ipa: '...', pos: '...' }
  // The en value may contain escaped single quotes: i\'ll
  const lines = src.split('\n');
  for (const line of lines) {
    // Match single-quoted key
    let m = line.match(/^\s*'([^']+)':\s*\{(.+)\}/);
    if (!m) m = line.match(/^\s*"([^"]+)":\s*\{(.+)\}/);
    if (!m) continue;

    const key = m[1];
    const body = m[2];

    // Extract en value (may have escaped quotes)
    let enVal = null;
    const enMatch = body.match(/en:\s*'((?:[^'\\]|\\.)*?)'/);
    if (enMatch) {
      enVal = enMatch[1].replace(/\\'/g, "'");
    } else {
      const enMatch2 = body.match(/en:\s*"((?:[^"\\]|\\.)*)"/);
      if (enMatch2) enVal = enMatch2[1].replace(/\\"/g, '"');
    }

    const posMatch = body.match(/pos:\s*'([^']*)'/);
    const lemmaMatch = body.match(/lemma:\s*'([^']*)'/);

    if (enVal !== null) {
      entries[key] = {
        en: enVal,
        pos: posMatch ? posMatch[1] : '',
        lemma: lemmaMatch ? lemmaMatch[1] : null,
      };
    }
  }
  return entries;
}

// ── Google Translate ────────────────────────────────────────────
function googleTranslateBatch(words, src, tgt) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${qParams}&source=${src}&target=${tgt}&key=${API_KEY}&format=text`;
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) { reject(new Error(j.error.message)); return; }
          resolve(j.data.translations.map(t => t.translatedText));
        } catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function batchTranslate(words, src, tgt, label) {
  const BS = 80, results = {};
  const batches = [];
  for (let i = 0; i < words.length; i += BS) batches.push(words.slice(i, i + BS));
  console.log(`  ${label}: ${batches.length} batches (${words.length} words)`);
  for (let bi = 0; bi < batches.length; bi++) {
    const b = batches[bi];
    try {
      const r = await googleTranslateBatch(b, src, tgt);
      for (let j = 0; j < b.length; j++) results[b[j]] = r[j];
    } catch (err) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const r = await googleTranslateBatch(b, src, tgt);
        for (let j = 0; j < b.length; j++) results[b[j]] = r[j];
      } catch (e2) { console.error(`    Batch ${bi+1} failed twice`); }
    }
    if ((bi+1)%10===0||bi===batches.length-1) console.log(`    ${bi+1}/${batches.length}`);
    if (bi < batches.length-1) await new Promise(r => setTimeout(r, 80));
  }
  return results;
}

// ── Comparison ──────────────────────────────────────────────────
const STOP = new Set(['a','an','the','to','of','in','on','at','for','and','or','but',
  'is','are','was','were','be','been','being','it','its','he','she','they','we','you',
  'i','me','my','your','his','her','their','our','us','them','do','does','did','will',
  'would','can','could','shall','should','may','might','must','have','has','had',
  'not','no','up','out','off','by','with','from','as','this','that','these','those',
  'some','any','all','each','every','very','so','too','also','just','more','most',
  'own','other','one','oneself','something','someone','thing']);

function contentWords(t) {
  if (!t) return [];
  return t.toLowerCase().replace(/[().,!?;:"""''\/\-––]/g,' ')
    .split(/\s+/).filter(w => w.length > 1 && !STOP.has(w));
}

function stem(w) {
  w = w.toLowerCase();
  for (const s of ['ation','tion','sion','ness','ment','able','ible','ing','ous','ive','ful','less','ally','ly','ed','er','est','ies','es','s']) {
    if (w.endsWith(s) && w.length > s.length + 2) { w = w.slice(0, -s.length); break; }
  }
  return w;
}

function wordsMatch(t1, t2) {
  const w1 = contentWords(t1), w2 = contentWords(t2);
  if (w1.length===0 || w2.length===0) return true;
  const s1 = new Set(w1.map(stem)), s2 = new Set(w2.map(stem));
  for (const a of s1) {
    if (a.length<3) continue;
    for (const b of s2) {
      if (b.length<3) continue;
      if (a===b) return true;
      if (a.length>=4 && b.length>=4 && a.slice(0,4)===b.slice(0,4)) return true;
      if (a.length>=4 && b.length>=4 && (a.includes(b)||b.includes(a))) return true;
    }
  }
  return false;
}

function normalize(it) {
  return it.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
}

function italianCloseness(backIt, originalIt) {
  const a = normalize(backIt), b = normalize(originalIt);
  if (a === b) return 1.0;
  let shared = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) shared++; else break;
  }
  if (shared >= 5) return 0.9;
  if (shared >= 4) return 0.8;
  if (shared >= 3) return 0.6;
  return shared / Math.max(a.length, b.length);
}

function isGarbage(en, itWord) {
  if (!en || !en.trim()) return true;
  const cl = en.toLowerCase().replace(/[^a-zàèéìòù]/g,'');
  const it = itWord.toLowerCase().replace(/[^a-zàèéìòù]/g,'');
  if (cl === it) return true;
  if (/[àèéìòùА-я]/.test(en)) return true;
  if (en.length > 60) return true;
  return false;
}

function isDictGarbled(en) {
  if (en === '?') return true;
  // i'll; X or i'd; X patterns
  if (/^i'(ll|d|m|ve); /i.test(en)) return true;
  if (/^(he|she|we|they|you|it|can|let|won|don|didn|wouldn|shouldn|couldn|isn|aren|wasn|weren)'(ll|d|t|s|ve|re|m); /i.test(en)) return true;
  if (/^[a-z]{1,2}$/.test(en.trim())) return true;
  if (/\b(form of|variant of|plural of|diminutive of)\b/i.test(en)) return true;
  if (/\b(town|city|village|municipality|commune) (in|of|near)\b/i.test(en)) return true;
  if (/\bSiena\b|\bTuscany\b|\bLombardy\b|\bVeneto\b|\bCampania\b/i.test(en)) return true;
  if (/^(nonstandard|colloquial|archaic|obsolete|dialectal)/i.test(en)) return true;
  if (/apocopic/i.test(en)) return true;
  if (/^a (female|male) given/i.test(en)) return true;
  return false;
}

function isVerbConjNoise(dictEn, googleEn, pos) {
  if (!dictEn.startsWith('to ') || pos !== 'v') return false;
  const g = googleEn.toLowerCase();
  if (/^(i |he |she |we |they |you |it |let'?s? |was |were |am |are |had |has |have |will |would |could |should |going )/i.test(g)) return true;
  if (g.split(' ').length === 1 && /^[a-z]+(ed|es|s|ing|en|nt)$/.test(g)) return true;
  const pp = ['sung','hit','bought','sold','won','flown','sworn','held','paid','gone',
    'left','driven','worn','written','spoken','taken','given','seen','done','known',
    'brought','chosen','fallen','grown','hidden','led','lost','met','read','risen',
    'sat','sent','shut','slept','stood','thrown','woken','wound','caught','dealt',
    'drawn','drunk','eaten','forgotten','frozen','hung','hurt','kept','laid','lent',
    'let','lit','meant','put','quit','said','set','shaken','shone','shot','shown',
    'slung','sped','spent','split','spread','stuck','stung','struck','strung','sunk',
    'swept','sworn','swung','torn','woven','wept','wrung'];
  if (pp.includes(g.trim())) return true;
  return false;
}

// ── Dict-is-better synonyms ─────────────────────────────────────
const DICT_BETTER = new Set([
  'abitare','aggiustare','addirittura','alzare','ampio',
  'annullare','badare','cancellare','compiere','compilare','concentrare',
  'condurre','confondere','cogliere','elaborare','ferire','molti',
  'principalmente','raccogliere','avvenire','richiedere','ordinato',
  'accomodi','condannare','recitare','congresso',
  'avvertire','discreto','porre','risultare','sostenere','tendere',
  'guarire','passeggiare','passeggiata','ricorrere',
  'successivamente','ricercare','provocare','distrarre',
  'incomodare','realizzare','indossare','svolgere',
  'valutare','subire','legale','processo',
  'rivivere','ragionevole','miseria','orientale','generare',
  'esaurire','ferita','assomigliare','relativo','globale','pungente',
  'allora', 'subito',
]);

// ── Google-wrong translations ───────────────────────────────────
const GOOGLE_WRONG = new Set([
  'farò',     // = I will do, not lighthouse
  'egli',     // = he, not they
  'verrò',    // = I will come, not boar (in v4 fixes)
  'foss',     // fossi/fosse, not ditch
  'meta',     // = destination, not half (that's metà)
  'moto',     // both movement and motorcycle valid
  'sugo',     // tomato sauce better than juice
  'piste',    // track/trail both valid
  'unaria',   // = air, not unary
]);

// ── Translation overrides for tricky entries ────────────────────
const OVERRIDES = {
  // Garbled i'll/i'd entries
  'gliela': 'to her/him (object pronoun)',
  'macchiato': 'stained',
  'maggiori': 'major, larger',
  'padrone': 'master, owner',
  'patto': 'pact, agreement',
  'promesso': 'promised',
  'racconto': 'tale, story',
  'regalo': 'gift, present',
  'riservati': 'reserved',
  'servirebbe': 'would be useful',
  'te': 'tea',
  'occupo': "I'm busy",
  'temo': "I'm afraid",
  'sto': 'I am',
  'do': 'I give',
  // ? entries with obvious answers
  'aires': 'Aires',
  'album': 'album',
  'auto': 'car',
  'automobile': 'car',
  'benzina': 'gasoline, fuel',
  'diploma': 'diploma',
  'euro': 'euro',
  'fragile': 'fragile',
  'garage': 'garage',
  'gas': 'gas',
  'led': 'LED',
  'poster': 'poster',
  'pisa': 'Pisa',
  'michelin': 'Michelin',
  // Garbled wiktionary entries
  'cè': 'there is',
  'cinquant': 'fifty',
  'qualcos': 'something',
  'quarant': 'forty',
  'senz': 'without',
  'sara': 'will be',
  'assunta': 'hired, assumed',
  // Key wrong translations
  'divano': 'sofa, couch',
  'stadio': 'stadium',
  'stagione': 'season',
  'stanotte': 'tonight',
  'statua': 'statue',
  'stazione': 'station',
  'finestra': 'window',
  'fino': 'until, up to',
  'finora': 'until now',
  'notte': 'night',
  'pagina': 'page',
  'pagella': 'report card',
  'passaporto': 'passport',
  'passato': 'past',
  'passeggero': 'passenger',
  'portavoce': 'spokesperson',
  'ritratto': 'portrait',
  'entrambe': 'both (fem.)',
  'entrambi': 'both',
  'entrata': 'entrance',
  'entro': 'within, by',
  'uscita': 'exit',
  'principio': 'principle, beginning',
  'unica': 'unique, only (fem.)',
  'unico': 'unique, only',
  'vento': 'wind',
  'vent': 'wind',
  'venerdì': 'Friday',
  'venerdi': 'Friday',
  'venezia': 'Venice',
  'ventitré': 'twenty-three',
  'suono': 'sound',
  'tessuto': 'fabric, tissue',
  'testo': 'text',
  'tiramisù': 'tiramisu',
  'salute': 'health',
  'salario': 'salary, wage',
  'credito': 'credit',
  'climatico': 'climatic',
  'chiusi': 'closed',
  'presa': 'socket, grip',
  'stessi': 'same',
  'legato': 'bound, tied',
  'sinistra': 'left (direction)',
  // Elided forms
  'laffitto': 'the rent',
  'lanima': 'the soul',
  'lerrore': 'the error',
  'lidraulico': 'the plumber',
  'lingresso': 'the entrance',
  'limpatto': 'the impact',
  'limportanza': 'the importance',
  'linvestimento': 'the investment',
  'lobiettivo': 'the goal',
  'lorologio': 'the clock',
  'lunica': 'the only one (fem.)',
  'lapertura': 'the opening',
  'lesperienza': 'the experience',
  'unalternativa': 'an alternative',
  'unapplicazione': 'an application',
  'uninsalata': 'a salad',
  'unofferta': 'an offer',
  'unultima': 'one last',
  'unitalia': 'united Italy',
  'deuropa': 'of Europe',
  'ditalia': 'of Italy',
  'didentità': 'of identity',
  // Let's forms
  'addormentiamo': "let's fall asleep",
  'ascoltiamo': "let's listen",
  'assicuriamoci': "let's make sure",
  'concentriamoci': "let's focus",
  'divertiamo': "let's have fun",
  'preghiamo': "let's pray",
  'sediamo': "let's sit down",
  'separiamo': "let's separate",
  // Misc fixes
  'morire': 'to die',
  'ascoltava': 'was listening',
  'riusciremo': 'we will succeed',
  'boh': "I don't know",
  'essenziale': 'essential',
  'corso': 'course',
  'dovere': 'duty, must',
  'proviene': 'comes from',
  'valutala': 'evaluate it',
  'presentarmi': 'to introduce myself',
  'guardandola': 'looking at her',
  'inseguilo': 'chase him',
};

// POS corrections
const POS_FIXES = {
  'chiusi': 'adj', 'climatico': 'adj', 'credito': 'n', 'divano': 'n',
  'entrambe': 'pron', 'entrambi': 'pron', 'entrata': 'n', 'entro': 'prep',
  'finestra': 'n', 'fino': 'prep', 'finora': 'adv', 'notte': 'n',
  'pagella': 'n', 'pagina': 'n', 'passaporto': 'n', 'passato': 'n',
  'passeggero': 'n', 'portavoce': 'n', 'presa': 'n', 'principio': 'n',
  'ritratto': 'n', 'salario': 'n', 'salute': 'n', 'stadio': 'n',
  'stagione': 'n', 'stanotte': 'adv', 'statua': 'n', 'suono': 'n',
  'tessuto': 'n', 'testo': 'n', 'tiramisù': 'n', 'unica': 'adj',
  'unico': 'adj', 'uscita': 'n', 'venerdi': 'n', 'venerdì': 'n',
  'venezia': 'n', 'vent': 'n', 'ventitré': 'n', 'vento': 'n',
  'stessi': 'adj', 'legato': 'adj', 'stazione': 'n', 'sinistra': 'n',
  'corso': 'n', 'dovere': 'n', 'essenziale': 'adj', 'boh': 'interj',
  'auto': 'n', 'automobile': 'n', 'laffitto': 'n', 'lanima': 'n',
  'lerrore': 'n', 'lidraulico': 'n', 'lingresso': 'n', 'limpatto': 'n',
  'limportanza': 'n', 'linvestimento': 'n', 'lobiettivo': 'n',
  'lorologio': 'n', 'lunica': 'adj', 'lapertura': 'n', 'lesperienza': 'n',
  'unalternativa': 'n', 'unapplicazione': 'n', 'uninsalata': 'n',
  'unofferta': 'n', 'unultima': 'adj', 'unitalia': 'n', 'deuropa': 'n',
  'ditalia': 'n', 'didentità': 'n',
};

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('Reading dictionary...');
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = parseDictionary(src);
  const allKeys = Object.keys(entries);
  console.log(`Parsed ${allKeys.length} entries`);

  const toCheck = allKeys.filter(k => !FUNCTION_WORDS.has(k));
  console.log(`Checking ${toCheck.length} entries\n`);

  // Phase 1: Forward IT→EN
  console.log('Phase 1: Forward (IT→EN)');
  const forward = await batchTranslate(toCheck, 'it', 'en', 'IT→EN');

  // Find candidates
  const garbled = [];
  const mismatches = [];
  let matched = 0;

  for (const key of toCheck) {
    const dictEn = entries[key].en;
    const googleEn = forward[key];

    // If we have a manual override, check it
    if (OVERRIDES[key]) {
      if (OVERRIDES[key] !== dictEn) {
        garbled.push({ word: key, dictEn, googleEn: googleEn || '', pos: entries[key].pos, override: OVERRIDES[key] });
      } else {
        matched++;
      }
      continue;
    }

    if (!googleEn) continue;
    if (isGarbage(googleEn, key)) continue;

    if (isDictGarbled(dictEn)) {
      garbled.push({ word: key, dictEn, googleEn, pos: entries[key].pos });
      continue;
    }

    if (wordsMatch(dictEn, googleEn)) { matched++; continue; }
    if (isVerbConjNoise(dictEn, googleEn, entries[key].pos)) { matched++; continue; }

    mismatches.push({ word: key, dictEn, googleEn, pos: entries[key].pos });
  }

  console.log(`\nMatched: ${matched}`);
  console.log(`Garbled/override: ${garbled.length}`);
  console.log(`Mismatches: ${mismatches.length}`);

  // Phase 2: Dual back-translation
  console.log(`\nPhase 2: Back-translation for ${mismatches.length} mismatches`);

  const dictEnInputs = mismatches.map(m => {
    let en = m.dictEn;
    if (en.startsWith('to ')) en = en.slice(3);
    return en.split(',')[0].split(';')[0].trim();
  });
  const googleEnInputs = mismatches.map(m => {
    let en = m.googleEn;
    if (en.startsWith('to ')) en = en.slice(3);
    return en.split(',')[0].split(';')[0].trim();
  });

  const allBackInputs = [...new Set([...dictEnInputs, ...googleEnInputs])];
  const backResults = await batchTranslate(allBackInputs, 'en', 'it', 'EN→IT (back)');

  // Phase 3: Compare
  console.log(`\nPhase 3: Deciding...`);
  let savedBySynonym = 0, googleBetter = 0;

  const googleCloserFixes = [];
  for (let i = 0; i < mismatches.length; i++) {
    const mm = mismatches[i];
    if (DICT_BETTER.has(mm.word)) { savedBySynonym++; continue; }
    if (GOOGLE_WRONG.has(mm.word)) { savedBySynonym++; continue; }

    const dictBack = backResults[dictEnInputs[i]];
    const googleBack = backResults[googleEnInputs[i]];

    const dictClose = dictBack ? italianCloseness(dictBack, mm.word) : 0;
    const googleClose = googleBack ? italianCloseness(googleBack, mm.word) : 0;

    if (googleClose > dictClose + 0.05) {
      googleCloserFixes.push(mm);
      googleBetter++;
    } else {
      savedBySynonym++;
    }
  }

  console.log(`Google closer: ${googleBetter}`);
  console.log(`Dict kept: ${savedBySynonym}`);

  // Phase 4: Apply all fixes
  console.log(`\nPhase 4: Applying...`);
  let fixedSrc = src;
  let applied = 0;
  const appliedList = [];

  // Helper to apply a fix
  function applyFix(key, dictEn, newEn, newPos) {
    if (newEn === dictEn || newEn.toLowerCase() === dictEn.toLowerCase()) return false;
    if (newEn.length < 2) return false;

    // Escape the dictEn for regex (including backslashes and single quotes)
    const eDictEn = dictEn.replace(/\\/g, '\\\\').replace(/'/g, "\\\\'").replace(/[.*+?^${}()|[\]]/g, '\\$&');
    const eKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match the entry line and replace en value
    const re1 = new RegExp(`('${eKey}':\\s*\\{[^}]*en:\\s*')${eDictEn}(')`);
    const re2 = new RegExp(`("${eKey}":\\s*\\{[^}]*en:\\s*')${eDictEn}(')`);

    const safe = newEn.replace(/'/g, "\\'");

    let found = false;
    if (re1.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(re1, `$1${safe}$2`);
      found = true;
    } else if (re2.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(re2, `$1${safe}$2`);
      found = true;
    }

    // Also fix POS if needed
    if (found && newPos) {
      const posRe1 = new RegExp(`('${eKey}':\\s*\\{[^}]*pos:\\s*')([^']*)(')`);
      const posRe2 = new RegExp(`("${eKey}":\\s*\\{[^}]*pos:\\s*')([^']*)(')`);
      if (posRe1.test(fixedSrc)) {
        fixedSrc = fixedSrc.replace(posRe1, `$1${newPos}$3`);
      } else if (posRe2.test(fixedSrc)) {
        fixedSrc = fixedSrc.replace(posRe2, `$1${newPos}$3`);
      }
    }

    return found;
  }

  // Apply garbled/override fixes
  for (const fix of garbled) {
    const key = fix.word;
    let newEn = fix.override || fix.googleEn;

    // Clean Google translation
    if (!fix.override) {
      newEn = newEn.trim();
      newEn = newEn.replace(/^(He |She |It |I |We |They |You )/i, '');
      // Determine actual POS
      const actualPos = POS_FIXES[key] || fix.pos;
      if (actualPos === 'v' && !newEn.toLowerCase().startsWith('to ') && !newEn.toLowerCase().startsWith("let'")) {
        newEn = 'to ' + newEn.toLowerCase();
      } else {
        newEn = newEn.toLowerCase();
      }
      newEn = newEn.replace(/\.$/, '');
    }

    const newPos = POS_FIXES[key] || null;
    if (applyFix(key, fix.dictEn, newEn, newPos)) {
      applied++;
      appliedList.push({ word: key, old: fix.dictEn, new: newEn, pos: newPos || fix.pos, reason: 'garbled/override' });
    }
  }

  // Apply google-closer fixes
  for (const fix of googleCloserFixes) {
    const key = fix.word;
    let newEn = fix.googleEn.trim();
    newEn = newEn.replace(/^(He |She |It |I |We |They |You )/i, '');

    const actualPos = POS_FIXES[key] || fix.pos;
    if (actualPos === 'v' && !newEn.toLowerCase().startsWith('to ') && !newEn.toLowerCase().startsWith("let'")) {
      newEn = 'to ' + newEn.toLowerCase();
    } else {
      newEn = newEn.toLowerCase();
    }
    newEn = newEn.replace(/\.$/, '');

    const newPos = POS_FIXES[key] || null;
    if (applyFix(key, fix.dictEn, newEn, newPos)) {
      applied++;
      appliedList.push({ word: key, old: fix.dictEn, new: newEn, pos: newPos || fix.pos, reason: 'google-closer' });
    }
  }

  // Write
  if (applied > 0) {
    fs.writeFileSync(DICT_PATH, fixedSrc);
    console.log(`Wrote ${applied} fixes to ${DICT_PATH}`);
  }

  // Save report
  const outPath = path.join(__dirname, 'output', 'it-semantic-final-fixes.json');
  fs.writeFileSync(outPath, JSON.stringify(appliedList, null, 2));

  // Print
  console.log(`\n=== ALL ${applied} FIXES ===`);
  appliedList.forEach(f => console.log(`  ${f.word} (${f.pos}): "${f.old}" → "${f.new}" [${f.reason}]`));

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total entries: ${allKeys.length}`);
  console.log(`Checked: ${toCheck.length}`);
  console.log(`Matched: ${matched}`);
  console.log(`Garbled/override fixed: ${garbled.length}`);
  console.log(`Google-closer fixed: ${googleBetter}`);
  console.log(`Saved by synonym: ${savedBySynonym}`);
  console.log(`Applied: ${applied}`);

  return applied;
}

main().then(n => {
  console.log(`\nITALIAN COMPLETE – ${n} fixes`);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
