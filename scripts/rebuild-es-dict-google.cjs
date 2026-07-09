#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const ROOT = path.join(__dirname, '..');
const API_KEY = process.env.GOOGLE_TTS_KEY;

// Step 1: Function words
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
  // High-frequency verbs with lemma
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
console.log('Step 1: ' + Object.keys(FUNCTION_WORDS).length + ' function words defined');

function extractDeckWords() {
  const deckPath = path.join(ROOT, 'src', 'data', 'spanish', 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const words = new Set();
  const wordContext = new Map();
  const wordCards = new Map();
  for (const card of deck) {
    const tokens = (card.target || '')
      .replace(/[\u00BF\u00A1.,!?;:"""\u2018\u2019()\u2014\u2013\u00AB\u00BB/\[\]{}0-9]/g, ' ')
      .split(/\s+/).map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    const englishWords = new Set(
      (card.english || '').toLowerCase().replace(/[.,!?;:"""\u2018\u2019()\u2014\u2013]/g, ' ')
        .split(/\s+/).filter(w => w.length > 2)
    );
    for (const t of tokens) {
      words.add(t);
      if (!wordContext.has(t)) wordContext.set(t, new Set());
      for (const ew of englishWords) wordContext.get(t).add(ew);
      if (!wordCards.has(t)) wordCards.set(t, []);
      wordCards.get(t).push(card);
    }
  }
  return { words, wordContext, wordCards, deck };
}

function loadExistingDict() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'dictionary', 'es.ts'), 'utf8');
  const entries = {};
  const re = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const word = m[1], body = m[2], entry = {};
    const enM = body.match(/en:\s*'([^']*)'/); if (enM) entry.en = enM[1];
    const ipaM = body.match(/ipa:\s*'([^']*)'/); if (ipaM) entry.ipa = ipaM[1];
    const posM = body.match(/pos:\s*'([^']*)'/); if (posM) entry.pos = posM[1];
    const lemmaM = body.match(/lemma:\s*'([^']*)'/); if (lemmaM) entry.lemma = lemmaM[1];
    entries[word] = entry;
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
      hostname: 'translation.googleapis.com', path: '/language/translate/v2',
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error('API error: ' + json.error.message)); return; }
          resolve(json.data.translations.map(t => t.translatedText));
        } catch (e) { reject(new Error('Parse error: ' + e.message + '\nRaw: ' + data.slice(0, 200))); }
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
  console.log('Step 2: Translating ' + wordList.length + ' words in ' + batches.length + ' batches...');
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const translations = await googleTranslate(batch, 'es', 'en');
      for (let j = 0; j < batch.length; j++) results.set(batch[j], translations[j]);
      if ((i + 1) % 10 === 0 || i === batches.length - 1)
        console.log('  Batch ' + (i+1) + '/' + batches.length + ' done (' + results.size + ' words translated)');
    } catch (err) {
      console.error('  Batch ' + (i+1) + ' failed: ' + err.message);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const translations = await googleTranslate(batch, 'es', 'en');
        for (let j = 0; j < batch.length; j++) results.set(batch[j], translations[j]);
        console.log('  Batch ' + (i+1) + ' retry succeeded');
      } catch (err2) {
        console.error('  Batch ' + (i+1) + ' retry failed: ' + err2.message);
        for (const w of batch) results.set(w, '?');
      }
    }
    if (i < batches.length - 1) await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

function validateWithCardContext(newDict, wordCards) {
  let flagged = 0;
  const STOP = new Set(['the','a','an','is','am','are','was','were','be','been','of','in','on','at','to','for','with','by','from','and','but','or','not','no','do','does','did','has','had','have','will','would','can','could','it','its','that','this','my','your','his','her','our','their']);
  for (const [word, entry] of Object.entries(newDict)) {
    const cards = wordCards.get(word);
    if (!cards || cards.length === 0) continue;
    const contextWords = new Set();
    for (const card of cards) {
      (card.english || '').toLowerCase().replace(/[.,!?;:()\u2014\u2013]/g, ' ')
        .split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)).forEach(w => contextWords.add(w));
    }
    if (contextWords.size === 0) continue;
    const enWords = entry.en.replace(/^to\s+/, '').toLowerCase().split(/[\s,/]+/).filter(w => w.length > 2);
    const hasOverlap = enWords.some(w => { for (const cw of contextWords) { if (cw.includes(w) || w.includes(cw)) return true; } return false; });
    if (!hasOverlap && cards.length >= 3 && enWords.length > 0) {
      entry._flagged = true;
      entry._contextHint = [...contextWords].slice(0, 5).join(', ');
      flagged++;
    }
  }
  return flagged;
}

async function main() {
  console.log('=== Rebuilding Spanish Dictionary ===\n');
  const { words: deckWords, wordContext, wordCards, deck } = extractDeckWords();
  console.log('Deck has ' + deck.length + ' cards with ' + deckWords.size + ' unique words\n');
  const existing = loadExistingDict();
  console.log('Existing dictionary has ' + Object.keys(existing).length + ' entries\n');

  // Step 1
  const newDict = {};
  let funcCount = 0;
  for (const [word, entry] of Object.entries(FUNCTION_WORDS)) {
    if (deckWords.has(word)) { newDict[word] = { ...entry }; funcCount++; }
  }
  console.log('Step 1: ' + funcCount + ' function words matched deck words\n');

  // Step 2
  const wordsToTranslate = [];
  for (const word of deckWords) { if (!newDict[word]) wordsToTranslate.push(word); }
  console.log('Step 2: ' + wordsToTranslate.length + ' words need translation\n');
  const translations = await translateBatches(wordsToTranslate);
  console.log('\nStep 2 complete: ' + translations.size + ' translations received\n');

  // Step 3
  const stats = new PostProcessStats();
  for (const [word, rawTrans] of translations.entries()) {
    const existingEntry = existing[word];
    let pos = existingEntry?.pos || '';
    const result = postProcess(rawTrans, pos, word, stats);
    newDict[word] = { en: result.text, pos: pos || '' };
    if (result.flagged) { newDict[word]._flagged = true; newDict[word]._flagReasons = result.flagReasons; }
  }
  console.log('Step 3: Post-processing complete');
  console.log(stats.report());
  console.log('');

  // Step 4: Strict lemma copy -- only if Google's translation confirms it's a verb form
  // If Google returned a non-verb translation (no "to " prefix), the lemma assignment was probably wrong
  let lemmaCopies = 0;
  let lemmaSkipped = 0;
  let lemmaDropped = 0;
  for (const word of deckWords) {
    const existingEntry = existing[word];
    if (!existingEntry?.lemma) continue;
    // Skip function words (they have their own lemma definitions)
    if (FUNCTION_WORDS[word]) continue;
    const lemma = existingEntry.lemma;
    if (!newDict[lemma]) continue;

    const googleTranslation = translations.get(word) || '';
    const googleProcessed = newDict[word]?.en || '';
    const lemmaEn = newDict[lemma].en;

    // Only copy lemma definition if Google's output looks like a verb form:
    // 1. Google raw starts with a verb-like word, OR
    // 2. Google processed starts with "to ", OR
    // 3. Google returned the same root word as the lemma translation
    const googleIsVerb = googleProcessed.startsWith('to ');
    const lemmaIsVerb = lemmaEn.startsWith('to ');

    if (lemmaIsVerb && googleIsVerb) {
      // Both agree it's a verb -- copy lemma definition
      newDict[word] = { ...newDict[word], en: lemmaEn, pos: newDict[word]?.pos || newDict[lemma].pos };
      lemmaCopies++;
    } else if (lemmaIsVerb && !googleIsVerb) {
      // Lemma says verb but Google says not -- Google is probably right, DROP the bad lemma
      lemmaDropped++;
      // Mark that we should NOT write the lemma field for this word
      newDict[word]._dropLemma = true;
    } else {
      // Non-verb lemma (e.g., noun variant) -- copy
      newDict[word] = { ...newDict[word], en: lemmaEn, pos: newDict[word]?.pos || newDict[lemma].pos };
      lemmaCopies++;
    }
  }
  console.log('Step 4: ' + lemmaCopies + ' entries copied definition from their lemma');
  console.log('Step 4: ' + lemmaDropped + ' bad lemma assignments dropped (Google disagreed)\n');

  // Step 5
  const flaggedCount = validateWithCardContext(newDict, wordCards);
  console.log('Step 5: ' + flaggedCount + ' entries flagged for context mismatch\n');

  // Step 6: Merge
  const finalDict = {};
  const sortedWords = [...deckWords].sort();
  for (const word of sortedWords) {
    const newEntry = newDict[word];
    const oldEntry = existing[word];
    if (!newEntry) continue;
    const entry = { en: newEntry.en, ipa: oldEntry?.ipa || '', pos: newEntry.pos || oldEntry?.pos || '' };
    if (newEntry._dropLemma) { /* bad lemma dropped */ }
    else if (newEntry.lemma) entry.lemma = newEntry.lemma;
    else if (oldEntry?.lemma && !FUNCTION_WORDS[word]) entry.lemma = oldEntry.lemma;
    finalDict[word] = entry;
  }

  // Generate output
  const existingSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'dictionary', 'es.ts'), 'utf8');
  const headerEnd = existingSrc.indexOf('export const dictionary');
  const header = existingSrc.slice(0, headerEnd);
  const lines = ['export const dictionary: Record<string, DictEntry> = {'];
  for (const word of sortedWords) {
    const entry = finalDict[word];
    if (!entry) continue;
    const quote = word.includes("'") ? '"' : "'";
    const key = quote + word + quote;
    let fields = "en: '" + entry.en.replace(/'/g, "\\'") + "'";
    fields += ", ipa: '" + (entry.ipa || '').replace(/'/g, "\\'") + "'";
    if (entry.pos) fields += ", pos: '" + entry.pos + "'";
    if (entry.lemma) fields += ", lemma: '" + entry.lemma.replace(/'/g, "\\'") + "'";
    lines.push('  ' + key + ': { ' + fields + ' },');
  }
  lines.push('};');
  lines.push('');
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'dictionary', 'es.ts'), header + lines.join('\n'), 'utf8');
  console.log('Step 6: Wrote ' + Object.keys(finalDict).length + ' entries to es.ts\n');

  // Sample report
  console.log('=== 50 Sample Comparisons (old -> new) ===\n');
  const changedWords = sortedWords.filter(w => existing[w] && finalDict[w] && existing[w].en !== finalDict[w].en);
  const unchangedWords = sortedWords.filter(w => existing[w] && finalDict[w] && existing[w].en === finalDict[w].en);
  const sampleChanged = changedWords.sort(() => Math.random() - 0.5).slice(0, 35);
  const sampleUnchanged = unchangedWords.sort(() => Math.random() - 0.5).slice(0, 15);
  const sampleWords = [...sampleChanged, ...sampleUnchanged].sort();
  for (const word of sampleWords) {
    const oldEn = existing[word]?.en || '(none)';
    const newEn = finalDict[word]?.en || '(none)';
    const changed = oldEn !== newEn ? ' << CHANGED' : '';
    console.log('  ' + word + ': "' + oldEn + '" -> "' + newEn + '"' + changed);
  }

  console.log('\n=== Final Statistics ===');
  console.log('Total entries: ' + Object.keys(finalDict).length);
  const toVerbs = Object.values(finalDict).filter(e => e.en.startsWith('to ')).length;
  console.log('Entries with "to ": ' + toVerbs + ' (' + (toVerbs/Object.keys(finalDict).length*100).toFixed(1) + '%)');
  console.log('Entries with IPA: ' + Object.values(finalDict).filter(e => e.ipa).length);
  console.log('Entries with lemma: ' + Object.values(finalDict).filter(e => e.lemma).length);
  console.log('\nKey fix verification:');
  for (const w of ['carro','casa','perro','gato','libro','agua','comida','ciudad','mundo','vida']) {
    if (finalDict[w]) console.log('  ' + w + ': "' + finalDict[w].en + '" (was "' + (existing[w]?.en||'?') + '")');
  }
  let changedCount = 0;
  for (const word of sortedWords) {
    if (existing[word] && finalDict[word] && existing[word].en !== finalDict[word].en) changedCount++;
  }
  console.log('\nTotal changed definitions: ' + changedCount);
  const oldToVerbs = Object.values(existing).filter(e => e.en && e.en.startsWith('to ')).length;
  console.log('Old "to " count: ' + oldToVerbs + ', New "to " count: ' + toVerbs);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
