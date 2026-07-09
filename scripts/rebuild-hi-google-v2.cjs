#!/usr/bin/env node
/**
 * Hindi Dictionary Rebuild v2 – Google Translate + 16-rule post-processing
 *
 * 1. Parse current hi.ts dictionary for entries (word, en, pos, ipa, lemma)
 * 2. Use function word table for common words
 * 3. Translate remaining via Google Translate API
 * 4. Apply all 16 post-processing rules
 * 5. Validate against card English (strict: 2+ card matches)
 * 6. Handle lemma entries (copy base word's definition)
 * 7. Output JSON + preview MD
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'scripts', 'output');
const API_KEY = process.env.GOOGLE_TTS_KEY;

// ─── Function word table (common Hindi → English) ─────────────────────────

const FUNCTION_TABLE = {
  // Pronouns
  'मैं': 'I', 'मैंने': 'I', 'मुझे': 'me', 'मुझसे': 'from me', 'मुझको': 'to me',
  'मेरा': 'my', 'मेरी': 'my', 'मेरे': 'my',
  'हम': 'we', 'हमने': 'we', 'हमें': 'us', 'हमसे': 'from us', 'हमारा': 'our', 'हमारी': 'our', 'हमारे': 'our',
  'तू': 'you (informal)', 'तुम': 'you', 'तुमने': 'you', 'तुम्हें': 'to you', 'तुम्हारा': 'your', 'तुम्हारी': 'your', 'तुम्हारे': 'your',
  'आप': 'you (formal)', 'आपने': 'you', 'आपको': 'to you', 'आपका': 'your', 'आपकी': 'your', 'आपके': 'your', 'आपसे': 'from you',
  'वह': 'he/she/that', 'वो': 'he/she/that', 'उसने': 'he/she', 'उसे': 'him/her', 'उसको': 'to him/her', 'उससे': 'from him/her',
  'उसका': 'his/her', 'उसकी': 'his/her', 'उसके': 'his/her',
  'वे': 'they/those', 'उन्होंने': 'they', 'उन्हें': 'them', 'उनको': 'to them', 'उनसे': 'from them',
  'उनका': 'their', 'उनकी': 'their', 'उनके': 'their',
  'यह': 'this', 'ये': 'these/they', 'इसने': 'this one', 'इसे': 'this', 'इसको': 'to this', 'इससे': 'from this',
  'इसका': 'its', 'इसकी': 'its', 'इसके': 'its',
  'इन्होंने': 'these (erg.)', 'इन्हें': 'to these', 'इनका': 'of these', 'इनकी': 'of these', 'इनके': 'of these',
  'कौन': 'who', 'किसने': 'who (erg.)', 'किसे': 'whom', 'किसको': 'to whom', 'किससे': 'from whom',
  'किसका': 'whose', 'किसकी': 'whose', 'किसके': 'whose',
  'क्या': 'what', 'कहाँ': 'where', 'कब': 'when', 'कैसे': 'how', 'कैसा': 'how/what kind',
  'कैसी': 'how/what kind', 'कितना': 'how much', 'कितनी': 'how much', 'कितने': 'how many',
  'क्यों': 'why', 'कौनसा': 'which',
  'जो': 'who/which (relative)', 'जिसने': 'who (rel. erg.)', 'जिसे': 'whom (rel.)', 'जिसका': 'whose (rel.)',
  'कोई': 'someone', 'कुछ': 'some/something', 'सब': 'all/everyone', 'सभी': 'all/everyone',
  'ख़ुद': 'self', 'खुद': 'self', 'अपना': 'own (m.)', 'अपनी': 'own (f.)', 'अपने': 'own (pl.)',

  // Postpositions
  'में': 'in', 'पर': 'on', 'को': 'to', 'से': 'from/with', 'का': 'of (m.)', 'की': 'of (f.)', 'के': 'of (pl.)',
  'ने': '(ergative marker)', 'तक': 'until/up to', 'लिए': 'for', 'बारे': 'about',
  'साथ': 'with/together', 'बिना': 'without', 'बाद': 'after', 'पहले': 'before/first',
  'बीच': 'between/middle', 'ऊपर': 'above/up', 'नीचे': 'below/down',
  'आगे': 'ahead/forward', 'पीछे': 'behind/back', 'बाहर': 'outside', 'अंदर': 'inside',
  'पास': 'near', 'दूर': 'far', 'यहाँ': 'here', 'वहाँ': 'there',
  'सामने': 'in front of', 'बग़ल': 'beside', 'तरफ़': 'towards', 'ओर': 'towards',
  'द्वारा': 'by/through', 'अनुसार': 'according to',

  // Conjunctions
  'और': 'and', 'या': 'or', 'लेकिन': 'but', 'मगर': 'but', 'पर': 'but/on',
  'परंतु': 'but', 'कि': 'that', 'अगर': 'if', 'अगर': 'if', 'तो': 'then',
  'जब': 'when', 'जहाँ': 'where', 'जैसे': 'like/as', 'जैसा': 'like/as',
  'इसलिए': 'therefore', 'क्योंकि': 'because', 'हालाँकि': 'although',
  'ताकि': 'so that', 'चाहे': 'whether', 'फिर': 'then/again',

  // Adverbs
  'बहुत': 'very/much', 'ज़्यादा': 'more', 'कम': 'less', 'अधिक': 'more',
  'अभी': 'right now', 'अब': 'now', 'तब': 'then', 'कभी': 'ever/sometimes',
  'हमेशा': 'always', 'कभीकभी': 'sometimes', 'अक्सर': 'often',
  'रोज़': 'daily', 'आज': 'today', 'कल': 'tomorrow/yesterday', 'परसों': 'day after/before',
  'जल्दी': 'quickly/early', 'धीरे': 'slowly', 'अचानक': 'suddenly',
  'सिर्फ़': 'only', 'बस': 'just/enough', 'भी': 'also/too', 'ही': 'only/just (emphasis)',
  'फिर': 'again/then', 'शायद': 'perhaps/maybe', 'ज़रूर': 'certainly',
  'बिलकुल': 'absolutely', 'सच': 'truth/truly', 'सचमुच': 'really/truly',
  'वाक़ई': 'really', 'ठीक': 'okay/correct', 'सही': 'correct/right',
  'यहीं': 'right here', 'वहीं': 'right there',

  // Common adjectives
  'अच्छा': 'good, nice', 'अच्छी': 'good (f.)', 'अच्छे': 'good (pl.)',
  'बुरा': 'bad', 'बुरी': 'bad (f.)', 'बुरे': 'bad (pl.)',
  'बड़ा': 'big', 'बड़ी': 'big (f.)', 'बड़े': 'big (pl.)',
  'छोटा': 'small', 'छोटी': 'small (f.)', 'छोटे': 'small (pl.)',
  'नया': 'new', 'नई': 'new (f.)', 'नए': 'new (pl.)',
  'पुराना': 'old', 'पुरानी': 'old (f.)', 'पुराने': 'old (pl.)',
  'सुंदर': 'beautiful', 'ख़ूबसूरत': 'beautiful', 'खूबसूरत': 'beautiful',
  'लंबा': 'tall/long', 'लंबी': 'tall/long (f.)',
  'ज़रूरी': 'necessary/important',

  // Common verbs (infinitive)
  'है': 'is', 'हैं': 'are', 'था': 'was (m.)', 'थी': 'was (f.)', 'थे': 'were', 'थीं': 'were (f.pl.)',
  'होना': 'to be', 'करना': 'to do', 'जाना': 'to go', 'आना': 'to come',
  'देना': 'to give', 'लेना': 'to take', 'बोलना': 'to speak',
  'कहना': 'to say', 'सुनना': 'to listen/hear', 'देखना': 'to see/look',
  'पढ़ना': 'to read/study', 'लिखना': 'to write', 'खाना': 'to eat',
  'पीना': 'to drink', 'सोना': 'to sleep', 'उठना': 'to get up',
  'बैठना': 'to sit', 'चलना': 'to walk', 'रहना': 'to stay/live',
  'मिलना': 'to meet/find', 'समझना': 'to understand',
  'सीखना': 'to learn', 'सिखाना': 'to teach', 'खेलना': 'to play',
  'गाना': 'to sing', 'नाचना': 'to dance', 'हँसना': 'to laugh',
  'रोना': 'to cry', 'मरना': 'to die', 'जीना': 'to live',
  'बनाना': 'to make', 'तोड़ना': 'to break', 'खोलना': 'to open',
  'बंद': 'closed', 'खुला': 'open',
  'रखना': 'to keep/put', 'भेजना': 'to send', 'लाना': 'to bring',
  'बेचना': 'to sell', 'ख़रीदना': 'to buy', 'खरीदना': 'to buy',
  'धोना': 'to wash', 'पकाना': 'to cook', 'काटना': 'to cut',
  'चाहना': 'to want', 'सोचना': 'to think', 'जानना': 'to know',
  'पूछना': 'to ask', 'बताना': 'to tell', 'दिखाना': 'to show',
  'भूलना': 'to forget', 'याद': 'memory/remember',
  'हो': 'be/happen', 'कर': 'do', 'जा': 'go', 'आ': 'come',
  'ले': 'take', 'दे': 'give', 'बोल': 'speak', 'कह': 'say',

  // Negation
  'नहीं': 'no/not', 'न': 'not', 'मत': 'do not',
  'ना': 'not/no',

  // Numbers
  'एक': 'one', 'दो': 'two', 'तीन': 'three', 'चार': 'four', 'पाँच': 'five',
  'छह': 'six', 'सात': 'seven', 'आठ': 'eight', 'नौ': 'nine', 'दस': 'ten',
  'ग्यारह': 'eleven', 'बारह': 'twelve', 'तेरह': 'thirteen', 'चौदह': 'fourteen', 'पंद्रह': 'fifteen',
  'सोलह': 'sixteen', 'सत्रह': 'seventeen', 'अठारह': 'eighteen', 'उन्नीस': 'nineteen', 'बीस': 'twenty',
  'सौ': 'hundred', 'हज़ार': 'thousand', 'लाख': 'hundred thousand', 'करोड़': 'ten million',
  'पहला': 'first', 'दूसरा': 'second/other', 'तीसरा': 'third',

  // Common nouns
  'घर': 'house/home', 'पानी': 'water', 'खाना': 'food', 'दूध': 'milk', 'चाय': 'tea',
  'रोटी': 'bread', 'चावल': 'rice', 'दाल': 'lentils', 'सब्ज़ी': 'vegetable', 'फल': 'fruit',
  'आदमी': 'man', 'औरत': 'woman', 'बच्चा': 'child (m.)', 'बच्ची': 'child (f.)', 'बच्चे': 'children',
  'लड़का': 'boy', 'लड़की': 'girl', 'लड़के': 'boys', 'लड़कियाँ': 'girls',
  'माँ': 'mother', 'पिता': 'father', 'भाई': 'brother', 'बहन': 'sister',
  'दोस्त': 'friend', 'परिवार': 'family', 'लोग': 'people', 'लोगों': 'people',
  'देश': 'country', 'शहर': 'city', 'गाँव': 'village',
  'सड़क': 'road', 'रास्ता': 'path/way', 'दरवाज़ा': 'door',
  'कमरा': 'room', 'स्कूल': 'school', 'बाज़ार': 'market',
  'किताब': 'book', 'किताबें': 'books', 'कागज़': 'paper',
  'पेड़': 'tree', 'फूल': 'flower', 'नदी': 'river', 'पहाड़': 'mountain',
  'सूरज': 'sun', 'चाँद': 'moon', 'तारा': 'star', 'बारिश': 'rain',
  'हवा': 'air/wind', 'आग': 'fire', 'मिट्टी': 'soil/clay',
  'दिन': 'day', 'रात': 'night', 'सुबह': 'morning', 'शाम': 'evening', 'दोपहर': 'afternoon',
  'साल': 'year', 'महीना': 'month', 'हफ़्ता': 'week', 'घंटा': 'hour',
  'समय': 'time', 'ज़िंदगी': 'life', 'मौत': 'death', 'दुनिया': 'world',
  'काम': 'work', 'पैसा': 'money', 'पैसे': 'money', 'नाम': 'name',
  'बात': 'thing/matter/talk', 'तरह': 'kind/way', 'जगह': 'place',
  'हाथ': 'hand', 'सिर': 'head', 'आँख': 'eye', 'आँखें': 'eyes',
  'कान': 'ear', 'नाक': 'nose', 'मुँह': 'mouth', 'दिल': 'heart',
  'पैर': 'foot/leg', 'उँगली': 'finger',
};

// ─── Parse Hindi dictionary TS file ──────────────────────────────────────

function parseDictionary() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'dictionary', 'hi.ts'), 'utf8');
  const entries = [];

  // Match entries like:  'word': { en: 'translation', ipa: 'ipa', pos: 'pos' },
  // Also handle optional lemma field
  const entryRegex = /^\s+'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'(?:,\s*lemma:\s*'([^']*)')?\s*\}/gm;
  // Also try double-quoted keys
  const entryRegex2 = /^\s+"([^"]+)":\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'(?:,\s*lemma:\s*'([^']*)')?\s*\}/gm;

  let match;
  while ((match = entryRegex.exec(src)) !== null) {
    entries.push({
      word: match[1],
      en: match[2],
      ipa: match[3],
      pos: match[4],
      lemma: match[5] || null,
    });
  }
  while ((match = entryRegex2.exec(src)) !== null) {
    entries.push({
      word: match[1],
      en: match[2],
      ipa: match[3],
      pos: match[4],
      lemma: match[5] || null,
    });
  }

  return entries;
}

// ─── Extract card English for validation ──────────────────────────────────

function loadCardEnglish() {
  const deckPath = path.join(ROOT, 'src', 'data', 'hindi', 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  // Build word → set of english sentence words
  const wordToEnglish = new Map();
  for (const card of deck) {
    const hiTokens = card.target
      .replace(/[.,!?;:"""\u2018\u2019()––«»\u0964\u0965/\[\]{}]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const enWords = new Set(
      (card.english || '').toLowerCase()
        .replace(/[.,!?;:"""\u2018\u2019()––«»/\[\]{}]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1)
    );

    for (const t of hiTokens) {
      if (!wordToEnglish.has(t)) wordToEnglish.set(t, []);
      wordToEnglish.get(t).push(enWords);
    }
  }

  return wordToEnglish;
}

/**
 * Validate a translation against card English.
 * Returns true if 2+ cards containing this Hindi word have the English translation
 * word somewhere in their English sentence.
 */
function validateAgainstCards(hiWord, enTranslation, wordToEnglish) {
  const cardSets = wordToEnglish.get(hiWord);
  if (!cardSets || cardSets.length === 0) return false;

  // Extract content words from the translation
  const transWords = enTranslation.toLowerCase()
    .replace(/^to\s+/, '')
    .replace(/[.,!?;:()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (transWords.length === 0) return false;

  let matchCount = 0;
  for (const enWords of cardSets) {
    for (const tw of transWords) {
      if (enWords.has(tw)) {
        matchCount++;
        break;
      }
      // Also try stemmed matches
      for (const ew of enWords) {
        if (ew.startsWith(tw) || tw.startsWith(ew)) {
          matchCount++;
          break;
        }
      }
      if (matchCount > cardSets.length) break;
    }
    if (matchCount >= 2) return true;
  }
  return matchCount >= 2;
}

// ─── Google Translate API ────────────────────────────────────────────────

function googleTranslateBatch(texts, sourceLang = 'hi', targetLang = 'en') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      q: texts,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    });

    const options = {
      hostname: 'translation.googleapis.com',
      port: 443,
      path: `/language/translate/v2?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Google API error: ${json.error.message}`));
            return;
          }
          const translations = json.data.translations.map(t => t.translatedText);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nBody: ${data.slice(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Sleep helper
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Main rebuild logic ──────────────────────────────────────────────────

async function main() {
  console.log('=== Hindi Dictionary Rebuild v2 ===\n');

  // 1. Parse dictionary
  console.log('Parsing dictionary...');
  const entries = parseDictionary();
  console.log(`  ${entries.length} entries found`);

  // 2. Load card data for validation
  console.log('Loading card data...');
  const wordToEnglish = loadCardEnglish();
  console.log(`  ${wordToEnglish.size} unique Hindi words in deck`);

  // 3. Separate entries by source
  const results = [];
  const toTranslate = [];
  const lemmaEntries = [];
  const nonDevanagari = [];
  const stats = new PostProcessStats();

  for (const entry of entries) {
    // Skip non-Devanagari entries
    if (!/[\u0900-\u097F]/.test(entry.word)) {
      nonDevanagari.push(entry);
      results.push({
        word: entry.word,
        old_en: entry.en,
        new_en: entry.en,
        source: 'skipped_non_devanagari',
        validated: false,
        pos: entry.pos,
        ipa: entry.ipa,
      });
      continue;
    }

    // Lemma entries → handle after base words are translated
    if (entry.lemma) {
      lemmaEntries.push(entry);
      continue;
    }

    // Function table
    if (FUNCTION_TABLE[entry.word]) {
      const ft = FUNCTION_TABLE[entry.word];
      const validated = validateAgainstCards(entry.word, ft, wordToEnglish);
      results.push({
        word: entry.word,
        old_en: entry.en,
        new_en: ft,
        source: 'function_table',
        validated,
        pos: entry.pos,
        ipa: entry.ipa,
      });
      continue;
    }

    // Everything else → Google Translate
    toTranslate.push(entry);
  }

  console.log(`  function_table: ${results.filter(r => r.source === 'function_table').length}`);
  console.log(`  lemma_entries: ${lemmaEntries.length}`);
  console.log(`  non_devanagari: ${nonDevanagari.length}`);
  console.log(`  to_translate: ${toTranslate.length}`);

  // 4. Translate in batches of 100
  console.log('\nTranslating via Google Translate...');
  const BATCH_SIZE = 100;
  const googleResults = new Map(); // word → translation

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    const texts = batch.map(e => e.word);

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toTranslate.length / BATCH_SIZE);
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${texts.length} words)...`);

    try {
      const translations = await googleTranslateBatch(texts);
      for (let j = 0; j < batch.length; j++) {
        googleResults.set(batch[j].word, translations[j]);
      }
      console.log(' done');
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      // Mark failed entries
      for (const e of batch) {
        googleResults.set(e.word, '?');
      }
    }

    // Rate limit: 100ms between batches
    if (i + BATCH_SIZE < toTranslate.length) {
      await sleep(150);
    }
  }

  // 5. Post-process all Google translations
  console.log('\nPost-processing translations...');
  const wordToResult = new Map(); // for lemma lookups

  for (const entry of toTranslate) {
    const raw = googleResults.get(entry.word) || '?';
    const processed = postProcess(raw, entry.pos, entry.word, stats);
    const validated = validateAgainstCards(entry.word, processed.text, wordToEnglish);

    const result = {
      word: entry.word,
      old_en: entry.en,
      new_en: processed.text,
      raw_google: raw,
      source: 'google',
      validated,
      pos: entry.pos,
      ipa: entry.ipa,
      flagged: processed.flagged,
      flagReasons: processed.flagReasons,
    };
    results.push(result);
    wordToResult.set(entry.word, result);
  }

  // 6. Handle lemma entries
  console.log('Processing lemma entries...');
  for (const entry of lemmaEntries) {
    const baseResult = wordToResult.get(entry.lemma);
    // Also check function table results
    const ftResult = results.find(r => r.word === entry.lemma && r.source === 'function_table');
    const baseEn = baseResult ? baseResult.new_en : ftResult ? ftResult.new_en : null;

    if (baseEn && baseEn !== '?') {
      const validated = validateAgainstCards(entry.word, baseEn, wordToEnglish);
      results.push({
        word: entry.word,
        old_en: entry.en,
        new_en: baseEn,
        source: 'lemma_copy',
        validated,
        pos: entry.pos,
        ipa: entry.ipa,
        lemma: entry.lemma,
      });
    } else {
      // Base word not found or failed – translate directly
      try {
        const [translation] = await googleTranslateBatch([entry.word]);
        const processed = postProcess(translation, entry.pos, entry.word, stats);
        const validated = validateAgainstCards(entry.word, processed.text, wordToEnglish);
        results.push({
          word: entry.word,
          old_en: entry.en,
          new_en: processed.text,
          raw_google: translation,
          source: 'google_lemma_fallback',
          validated,
          pos: entry.pos,
          ipa: entry.ipa,
          lemma: entry.lemma,
          flagged: processed.flagged,
          flagReasons: processed.flagReasons,
        });
      } catch (err) {
        results.push({
          word: entry.word,
          old_en: entry.en,
          new_en: '?',
          source: 'lemma_failed',
          validated: false,
          pos: entry.pos,
          ipa: entry.ipa,
          lemma: entry.lemma,
        });
      }
      await sleep(50);
    }
  }

  // 7. Check for duplicates (Rule 13 post-hoc)
  const duplicates = stats.getDuplicates();
  if (duplicates.length > 0) {
    for (const dup of duplicates) {
      for (const word of dup.sample) {
        stats.flag(word, `duplicate:${dup.translation}(${dup.count})`);
      }
    }
  }

  // 8. Output
  console.log('\nWriting output...');

  // Sort results by word
  results.sort((a, b) => a.word.localeCompare(b.word, 'hi'));

  // JSON output
  const jsonPath = path.join(OUTPUT_DIR, 'hi-google-rebuild-v2.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`  ${jsonPath}`);

  // Preview MD (200 random samples)
  const mdPath = path.join(OUTPUT_DIR, 'hi-google-rebuild-v2-preview.md');
  const shuffled = [...results].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, 200);
  const mdLines = [
    '# Hindi Dictionary Rebuild v2 – Preview (200 random samples)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| # | Word | Old EN | New EN | Source | Validated | POS | Flags |',
    '|---|------|--------|--------|--------|-----------|-----|-------|',
  ];
  sample.forEach((r, i) => {
    const flags = r.flagReasons ? r.flagReasons.join(', ') : '';
    mdLines.push(
      `| ${i + 1} | ${r.word} | ${r.old_en} | ${r.new_en} | ${r.source} | ${r.validated ? 'Y' : 'N'} | ${r.pos} | ${flags} |`
    );
  });
  fs.writeFileSync(mdPath, mdLines.join('\n'));
  console.log(`  ${mdPath}`);

  // 9. Report
  console.log('\n' + '='.repeat(60));
  console.log('REBUILD REPORT');
  console.log('='.repeat(60));

  const bySource = {};
  for (const r of results) {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
  }
  console.log(`\nTotal entries: ${results.length}`);
  console.log('\nBy source:');
  for (const [src, count] of Object.entries(bySource)) {
    console.log(`  ${src}: ${count}`);
  }

  const validatedCount = results.filter(r => r.validated).length;
  const flaggedCount = results.filter(r => r.flagged).length;
  const qMarkCount = results.filter(r => r.new_en === '?').length;
  const changedCount = results.filter(r => r.old_en !== r.new_en).length;

  console.log(`\nValidated (2+ card matches): ${validatedCount} (${(validatedCount / results.length * 100).toFixed(1)}%)`);
  console.log(`Flagged: ${flaggedCount}`);
  console.log(`Still '?': ${qMarkCount}`);
  console.log(`Changed from old: ${changedCount}`);

  console.log('\n' + stats.report());

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
