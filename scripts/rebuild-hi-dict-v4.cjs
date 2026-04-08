#!/usr/bin/env node
/**
 * Rebuild Hindi dictionary v4 — full-sentence validation approach.
 *
 * Steps:
 *  1. Hindi function word table (300+ entries, never sent to Google)
 *  2. Collect all unique words + ALL sentences from deck via tokenize()
 *  3. Google Translate individual words via translateBatch()
 *  4. Google Translate ALL unique sentences via translateSentences()
 *  5. For each word, validate against sentence translations via validateAndEnrich()
 *  6. Post-process every result via postProcess() (18-rule pipeline)
 *  7. Lemma copy — verified lemmas get their base word's definition
 *  8. Apply to hi.ts, preserve IPA/lemma/pos + footer (VERB_SUFFIX_PATTERNS, lookupWord, etc.)
 *  9. 100-entry random review -> scripts/output/hi-v5-review.md
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { translateBatch, tokenize, validateAndEnrich } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Translate sentences via POST (needed for Hindi/Devanagari which is too large for GET URLs).
 */
async function translateSentencesPost(sentences, sourceLang, batchSize = 25) {
  const results = {};

  for (let i = 0; i < sentences.length; i += batchSize) {
    const batch = sentences.slice(i, i + batchSize);
    const postData = JSON.stringify({
      q: batch,
      source: sourceLang,
      target: 'en',
      format: 'text',
    });

    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

    const translations = await new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.data || !parsed.data.translations) {
              console.error('  API error at batch', Math.floor(i / batchSize), ':', data.slice(0, 200));
              resolve(batch.map(() => '?'));
              return;
            }
            resolve(parsed.data.translations.map(t =>
              t.translatedText
                .replace(/&#39;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
            ));
          } catch (e) {
            console.error('  JSON parse error at batch', Math.floor(i / batchSize), ':', e.message);
            resolve(batch.map(() => '?'));
          }
        });
      });
      req.on('error', (e) => {
        console.error('  Request error at batch', Math.floor(i / batchSize), ':', e.message);
        resolve(batch.map(() => '?'));
      });
      req.write(postData);
      req.end();
    });

    batch.forEach((sentence, j) => {
      results[sentence] = translations[j];
    });

    if (i % (batchSize * 10) === 0 && i > 0) {
      console.log(`  Translated ${i}/${sentences.length} sentences...`);
    }

    await sleep(200);
  }

  return results;
}

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/hindi/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/hi.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Hindi function word table (300+ entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Pronouns ──
  'मैं': 'I', 'मैंने': 'I', 'मुझे': 'me', 'मुझसे': 'from me', 'मुझमें': 'in me',
  'मेरा': 'my', 'मेरी': 'my', 'मेरे': 'my',
  'हम': 'we', 'हमने': 'we', 'हमें': 'us', 'हमसे': 'from us', 'हमारा': 'our', 'हमारी': 'our', 'हमारे': 'our',
  'तू': 'you', 'तूने': 'you', 'तुझे': 'you', 'तेरा': 'your', 'तेरी': 'your', 'तेरे': 'your',
  'तुम': 'you', 'तुमने': 'you', 'तुम्हें': 'you', 'तुम्हारा': 'your', 'तुम्हारी': 'your', 'तुम्हारे': 'your',
  'आप': 'you', 'आपने': 'you', 'आपको': 'you', 'आपसे': 'from you', 'आपका': 'your', 'आपकी': 'your', 'आपके': 'your',
  'यह': 'this', 'ये': 'these', 'इसने': 'this', 'इसे': 'this', 'इसका': 'its', 'इसकी': 'its', 'इसके': 'its',
  'इससे': 'from this', 'इसमें': 'in this', 'इसपर': 'on this', 'इन्हें': 'these', 'इन्होंने': 'these',
  'इनका': 'their', 'इनकी': 'their', 'इनके': 'their',
  'वह': 'that', 'वे': 'those', 'उसने': 'he/she', 'उसे': 'him/her', 'उसका': 'his/her', 'उसकी': 'his/her', 'उसके': 'his/her',
  'उससे': 'from him/her', 'उसमें': 'in that', 'उसपर': 'on that',
  'उन्हें': 'them', 'उन्होंने': 'they', 'उनका': 'their', 'उनकी': 'their', 'उनके': 'their',
  'कौन': 'who', 'किसने': 'who', 'किसे': 'whom', 'किसका': 'whose', 'किसकी': 'whose', 'किसके': 'whose',
  'क्या': 'what', 'कहाँ': 'where', 'कब': 'when', 'कैसे': 'how', 'कैसा': 'how', 'कैसी': 'how',
  'कितना': 'how much', 'कितनी': 'how much', 'कितने': 'how many',
  'कोई': 'someone', 'कुछ': 'some', 'कोई-न-कोई': 'someone or other',
  'जो': 'who/which', 'जिसने': 'who', 'जिसे': 'whom', 'जिसका': 'whose', 'जिसकी': 'whose',
  'जिसके': 'whose', 'जिन्हें': 'whom', 'जिनका': 'whose', 'जिनकी': 'whose', 'जिनके': 'whose',
  'खुद': 'self', 'स्वयं': 'self', 'अपना': 'own', 'अपनी': 'own', 'अपने': 'own',
  'सब': 'all', 'सभी': 'all', 'हर': 'every', 'प्रत्येक': 'each',
  'दूसरा': 'other', 'दूसरी': 'other', 'दूसरे': 'other',

  // ── Postpositions ──
  'का': 'of', 'की': 'of', 'के': 'of',
  'को': 'to', 'से': 'from', 'में': 'in', 'पर': 'on', 'तक': 'until',
  'ने': '(ergative)', 'पास': 'near', 'लिए': 'for', 'लिये': 'for',
  'बिना': 'without', 'बारे': 'about', 'साथ': 'with', 'बाद': 'after',
  'पहले': 'before', 'बीच': 'between', 'ऊपर': 'above', 'नीचे': 'below',
  'आगे': 'ahead', 'पीछे': 'behind', 'बाहर': 'outside', 'अंदर': 'inside',
  'दौरान': 'during', 'अनुसार': 'according to', 'द्वारा': 'by',
  'तरफ़': 'towards', 'तरफ': 'towards', 'ओर': 'towards', 'वजह': 'because of',
  'कारण': 'reason', 'बदले': 'in exchange', 'ज़रिए': 'through', 'ज़रिये': 'through',
  'सामने': 'in front of', 'विरुद्ध': 'against', 'बजाय': 'instead of',
  'बगल': 'beside', 'निकट': 'near', 'समीप': 'near', 'परे': 'beyond',
  'भीतर': 'within', 'मध्य': 'middle', 'प्रति': 'towards/per',

  // ── Conjunctions ──
  'और': 'and', 'या': 'or', 'लेकिन': 'but', 'मगर': 'but', 'परंतु': 'but',
  'पर': 'but/on', 'कि': 'that', 'क्योंकि': 'because', 'चूँकि': 'since',
  'इसलिए': 'therefore', 'इसीलिए': 'that is why', 'तो': 'then',
  'अगर': 'if', 'यदि': 'if', 'नहीं': 'no/not', 'तब': 'then',
  'जब': 'when', 'जबकि': 'whereas', 'ताकि': 'so that', 'चाहे': 'whether',
  'हालाँकि': 'although', 'हालांकि': 'although', 'फिर': 'again/then',
  'बल्कि': 'rather', 'अथवा': 'or', 'एवं': 'and', 'तथा': 'and',
  'वरना': 'otherwise', 'अन्यथा': 'otherwise', 'जैसे': 'like',
  'जैसा': 'like', 'जैसी': 'like', 'वैसा': 'like that', 'वैसी': 'like that', 'वैसे': 'like that',
  'नहींतो': 'otherwise', 'चूंकि': 'since', 'जिससे': 'so that',
  'जबतक': 'until', 'जैसेही': 'as soon as',

  // ── Auxiliaries / copula ──
  'है': 'is', 'हैं': 'are', 'हूँ': 'am', 'था': 'was', 'थी': 'was',
  'थे': 'were', 'थीं': 'were', 'हो': 'be', 'होगा': 'will be', 'होगी': 'will be',
  'होंगे': 'will be', 'होंगी': 'will be', 'हुआ': 'happened', 'हुई': 'happened', 'हुए': 'happened',
  'रहा': 'ongoing', 'रही': 'ongoing', 'रहे': 'ongoing',
  'गया': 'went', 'गई': 'went', 'गए': 'went',
  'सकता': 'can', 'सकती': 'can', 'सकते': 'can',
  'चाहिए': 'should', 'चाहिये': 'should',
  'दिया': 'gave', 'दी': 'gave', 'दिए': 'gave', 'दीजिए': 'please give',
  'लिया': 'took', 'ली': 'took', 'लिए': 'for', 'लिये': 'for',
  'करना': 'to do', 'करता': 'does', 'करती': 'does', 'करते': 'do',
  'करो': 'do', 'करें': 'do', 'किया': 'did', 'किए': 'did', 'करेगा': 'will do',
  'होना': 'to be', 'जाना': 'to go', 'आना': 'to come', 'देना': 'to give', 'लेना': 'to take',
  'पड़ना': 'to have to', 'चुका': 'already', 'चुकी': 'already', 'चुके': 'already',
  'लगा': 'started', 'लगी': 'started', 'लगे': 'started',
  'सका': 'could', 'सकी': 'could', 'सके': 'could',
  'पाया': 'could', 'पाई': 'could', 'पाए': 'could',
  'रखा': 'kept', 'रखी': 'kept', 'रखे': 'kept',
  'जा': 'go', 'आ': 'come', 'दे': 'give', 'ले': 'take',
  'कर': 'doing', 'जाता': 'goes', 'जाती': 'goes', 'जाते': 'go',
  'आता': 'comes', 'आती': 'comes', 'आते': 'come',
  'देता': 'gives', 'देती': 'gives', 'देते': 'give',
  'लेता': 'takes', 'लेती': 'takes', 'लेते': 'take',
  'करेगी': 'will do', 'करूँगा': 'will do', 'करूँगी': 'will do',
  'करेंगे': 'will do', 'करेंगी': 'will do',
  'होता': 'happens', 'होती': 'happens', 'होते': 'happen',
  'जाएगा': 'will go', 'जाएगी': 'will go', 'जाएँगे': 'will go',
  'आएगा': 'will come', 'आएगी': 'will come', 'आएँगे': 'will come',
  'देगा': 'will give', 'देगी': 'will give', 'देंगे': 'will give',
  'लेगा': 'will take', 'लेगी': 'will take', 'लेंगे': 'will take',
  'पड़ा': 'had to', 'पड़ी': 'had to', 'पड़े': 'had to',
  'पड़ेगा': 'will have to', 'पड़ेगी': 'will have to',
  'रहूँगा': 'will be (cont.)', 'रहूँगी': 'will be (cont.)',
  'रहेगा': 'will be (cont.)', 'रहेगी': 'will be (cont.)',
  'रहेंगे': 'will be (cont.)', 'रहेंगी': 'will be (cont.)',

  // ── Negation / affirmation ──
  'नहीं': 'not', 'न': 'not', 'ना': "not/don't", 'मत': "don't",
  'हाँ': 'yes', 'जी': 'yes/sir', 'जी_हाँ': 'yes', 'जी_नहीं': 'no',
  'बिल्कुल': 'absolutely', 'ज़रूर': 'surely', 'शायद': 'maybe',
  'अवश्य': 'certainly', 'निश्चित': 'certain',

  // ── Common adverbs ──
  'बहुत': 'very', 'ज़्यादा': 'more', 'ज्यादा': 'more', 'कम': 'less',
  'अभी': 'now', 'अब': 'now', 'तभी': 'only then', 'कभी': 'ever',
  'यहाँ': 'here', 'वहाँ': 'there', 'कहीं': 'somewhere', 'जहाँ': 'where',
  'ऐसे': 'like this', 'वैसे': 'like that', 'कैसे': 'how',
  'हमेशा': 'always', 'कभी-कभी': 'sometimes', 'अक्सर': 'often',
  'फिर': 'again', 'भी': 'also', 'ही': 'only/just', 'सिर्फ़': 'only', 'सिर्फ': 'only',
  'बस': 'just', 'काफ़ी': 'enough', 'काफी': 'enough', 'थोड़ा': 'a little',
  'थोड़ी': 'a little', 'थोड़े': 'a little',
  'पहले': 'first/before', 'बाद': 'later', 'जल्दी': 'quickly', 'धीरे': 'slowly',
  'अचानक': 'suddenly', 'तुरंत': 'immediately', 'धीरे-धीरे': 'slowly',
  'ज़ोर': 'forcefully', 'ठीक': 'okay/right', 'सही': 'correct',
  'ग़लत': 'wrong', 'गलत': 'wrong', 'ख़ास': 'special', 'खास': 'special',
  'सच': 'true', 'झूठ': 'lie', 'वापस': 'back', 'दोबारा': 'again',
  'आज': 'today', 'कल': 'yesterday/tomorrow',
  'परसों': 'day after/before', 'रोज़': 'daily', 'रोज': 'daily',
  'सुबह': 'morning', 'शाम': 'evening', 'रात': 'night', 'दिन': 'day', 'दोपहर': 'afternoon',
  'जल्द': 'soon', 'देर': 'late',
  'ऊपर': 'up', 'नीचे': 'down', 'दाएँ': 'right', 'बाएँ': 'left',
  'सीधे': 'straight', 'साथ-साथ': 'along with', 'अलग': 'separate',
  'एक_साथ': 'together', 'बार-बार': 'repeatedly',
  'ज़रा': 'a bit', 'बिल्कुल': 'completely', 'पूरी_तरह': 'completely',
  'लगभग': 'approximately', 'करीब': 'close/approximately',
  'यूँ': 'just like that', 'ऐसेही': 'just like that',
  'आमतौर': 'usually', 'सामान्यतः': 'generally',
  'वास्तव': 'actually', 'सचमुच': 'really', 'वाकई': 'truly',

  // ── Common adjectives ──
  'अच्छा': 'good', 'अच्छी': 'good', 'अच्छे': 'good',
  'बुरा': 'bad', 'बुरी': 'bad', 'बुरे': 'bad',
  'बड़ा': 'big', 'बड़ी': 'big', 'बड़े': 'big',
  'छोटा': 'small', 'छोटी': 'small', 'छोटे': 'small',
  'नया': 'new', 'नई': 'new', 'नए': 'new',
  'पुराना': 'old', 'पुरानी': 'old', 'पुराने': 'old',
  'ज़रूरी': 'necessary', 'ज़रूरत': 'need',
  'सुंदर': 'beautiful', 'ख़ूबसूरत': 'beautiful', 'खूबसूरत': 'beautiful',
  'लंबा': 'tall/long', 'लंबी': 'tall/long', 'लंबे': 'tall/long',
  'ऊँचा': 'high', 'ऊँची': 'high', 'ऊँचे': 'high',
  'गहरा': 'deep', 'गहरी': 'deep', 'गहरे': 'deep',
  'मोटा': 'thick/fat', 'मोटी': 'thick/fat', 'मोटे': 'thick/fat',
  'पतला': 'thin', 'पतली': 'thin', 'पतले': 'thin',
  'सफ़ेद': 'white', 'सफेद': 'white', 'काला': 'black', 'काली': 'black', 'काले': 'black',
  'लाल': 'red', 'हरा': 'green', 'हरी': 'green', 'हरे': 'green',
  'नीला': 'blue', 'नीली': 'blue', 'नीले': 'blue',
  'पीला': 'yellow', 'पीली': 'yellow', 'पीले': 'yellow',
  'गर्म': 'hot/warm', 'ठंडा': 'cold', 'ठंडी': 'cold', 'ठंडे': 'cold',
  'साफ़': 'clean', 'साफ': 'clean', 'गंदा': 'dirty', 'गंदी': 'dirty', 'गंदे': 'dirty',
  'भारी': 'heavy', 'हल्का': 'light', 'हल्की': 'light', 'हल्के': 'light',
  'तेज़': 'fast/sharp', 'तेज': 'fast/sharp', 'धीमा': 'slow', 'धीमी': 'slow', 'धीमे': 'slow',
  'मज़बूत': 'strong', 'मजबूत': 'strong', 'कमज़ोर': 'weak', 'कमजोर': 'weak',
  'सूखा': 'dry', 'सूखी': 'dry', 'गीला': 'wet', 'गीली': 'wet',
  'खुश': 'happy', 'दुखी': 'sad', 'नाराज़': 'angry', 'नाराज': 'angry',
  'पूरा': 'complete/full', 'पूरी': 'complete/full', 'पूरे': 'complete/full',
  'खाली': 'empty', 'भरा': 'full/filled', 'भरी': 'full/filled',
  'गरीब': 'poor', 'अमीर': 'rich',
  'सस्ता': 'cheap', 'सस्ती': 'cheap', 'सस्ते': 'cheap',
  'महंगा': 'expensive', 'महंगी': 'expensive', 'महंगे': 'expensive',
  'आसान': 'easy', 'मुश्किल': 'difficult', 'कठिन': 'difficult',
  'ताज़ा': 'fresh', 'ताजा': 'fresh',

  // ── Greetings / discourse ──
  'नमस्ते': 'hello', 'नमस्कार': 'greetings', 'अलविदा': 'goodbye',
  'धन्यवाद': 'thank you', 'शुक्रिया': 'thank you', 'माफ़': 'sorry', 'माफ': 'sorry',
  'कृपया': 'please', 'स्वागत': 'welcome', 'बधाई': 'congratulations',
  'शुभकामनाएँ': 'best wishes',

  // ── Numbers ──
  'एक': 'one', 'दो': 'two', 'तीन': 'three', 'चार': 'four', 'पाँच': 'five',
  'छह': 'six', 'सात': 'seven', 'आठ': 'eight', 'नौ': 'nine', 'दस': 'ten',
  'ग्यारह': 'eleven', 'बारह': 'twelve', 'तेरह': 'thirteen', 'चौदह': 'fourteen', 'पंद्रह': 'fifteen',
  'सोलह': 'sixteen', 'सत्रह': 'seventeen', 'अठारह': 'eighteen', 'उन्नीस': 'nineteen', 'बीस': 'twenty',
  'तीस': 'thirty', 'चालीस': 'forty', 'पचास': 'fifty', 'साठ': 'sixty',
  'सत्तर': 'seventy', 'अस्सी': 'eighty', 'नब्बे': 'ninety', 'सौ': 'hundred',
  'हज़ार': 'thousand', 'हजार': 'thousand', 'लाख': 'hundred thousand', 'करोड़': 'ten million',
  'पहला': 'first', 'पहली': 'first', 'पहले': 'first',
  'दूसरा': 'second', 'दूसरी': 'second', 'दूसरे': 'second',
  'तीसरा': 'third', 'तीसरी': 'third', 'तीसरे': 'third',
  'आधा': 'half', 'आधी': 'half', 'चौथाई': 'quarter',
  'दोनों': 'both', 'कई': 'several', 'बहुत-से': 'many', 'ज़्यादातर': 'most',

  // ── Demonstratives / determiners ──
  'इस': 'this', 'उस': 'that', 'इन': 'these', 'उन': 'those',
  'हर': 'every', 'कोई': 'any/some', 'कुछ': 'some', 'सारा': 'all', 'सारी': 'all', 'सारे': 'all',
  'कम-से-कम': 'at least', 'ज़्यादा-से-ज़्यादा': 'at most',

  // ── Common relators / particles ──
  'तो': 'so/then', 'भी': 'also', 'ही': 'only', 'वाला': 'one who', 'वाली': 'one who', 'वाले': 'ones who',
  'ऐसा': 'such', 'ऐसी': 'such', 'ऐसे': 'such',
  'जैसा': 'like', 'जैसी': 'like', 'जैसे': 'like',
  'कहाँ': 'where', 'कब': 'when', 'क्यों': 'why', 'कैसे': 'how',
  'जहाँ': 'where', 'जब': 'when', 'जितना': 'as much as',
  'जितनी': 'as much as', 'जितने': 'as many as', 'उतना': 'that much',
  'उतनी': 'that much', 'उतने': 'that many',
  'वहीं': 'right there', 'यहीं': 'right here', 'अभी': 'right now',

  // ── Honorifics / titles ──
  'जी': 'honorific', 'श्री': 'Mr.', 'श्रीमती': 'Mrs.', 'सुश्री': 'Ms.',
  'साहब': 'sir', 'साहिब': 'sir', 'मैडम': 'madam', 'बाबू': 'sir/mister',
  'भाई': 'brother', 'बहन': 'sister', 'दीदी': 'elder sister', 'भैया': 'elder brother',

  // ── Time words ──
  'अब': 'now', 'तब': 'then', 'जब': 'when', 'कब': 'when',
  'आज': 'today', 'कल': 'yesterday/tomorrow', 'परसों': 'day before/after',
  'अभी': 'right now', 'तुरंत': 'immediately', 'जल्दी': 'quickly',
  'हमेशा': 'always', 'कभी': 'ever', 'अक्सर': 'often',
  'कभी-कभी': 'sometimes', 'रोज़': 'daily',

  // ── Common verbs (compound verb helpers) ──
  'रहना': 'to stay', 'बैठना': 'to sit', 'उठना': 'to get up',
  'पड़ना': 'to fall/have to', 'लगना': 'to seem/feel',
  'चलना': 'to walk', 'रुकना': 'to stop', 'बोलना': 'to speak',
  'सुनना': 'to listen', 'देखना': 'to see', 'समझना': 'to understand',
  'सोचना': 'to think', 'पढ़ना': 'to read/study', 'लिखना': 'to write',
  'खाना': 'food; to eat', 'पीना': 'to drink', 'सोना': 'gold; to sleep',
  'जगना': 'to wake up', 'बनना': 'to become', 'बनाना': 'to make',
  'रखना': 'to keep/put', 'भेजना': 'to send', 'मिलना': 'to meet/find',
  'खेलना': 'to play', 'गाना': 'song; to sing', 'नाचना': 'to dance',
  'हँसना': 'to laugh', 'रोना': 'to cry', 'मारना': 'to hit/kill',
  'काटना': 'to cut', 'तोड़ना': 'to break', 'जोड़ना': 'to join',
  'धोना': 'to wash', 'पकाना': 'to cook', 'खोलना': 'to open',
  'बंद': 'closed', 'मालूम': 'known', 'पता': 'address; known',

  // ── Compounding light verbs ──
  'डालना': 'to put/pour', 'डाल': 'pour', 'उठा': 'lifted',
  'बैठ': 'sat', 'जाओ': 'go', 'आओ': 'come', 'दो': 'give (imperative)',
  'लो': 'take', 'करो': 'do', 'बोलो': 'speak', 'बताओ': 'tell',
  'सुनो': 'listen', 'देखो': 'look', 'चलो': 'let\'s go',
  'बताना': 'to tell', 'बता': 'tell', 'बतायी': 'told', 'बताया': 'told',
  'बताई': 'told', 'बताए': 'told', 'बताती': 'tells', 'बताता': 'tells',

  // ── Relative correlative pairs ──
  'जिधर': 'whichever direction', 'उधर': 'that direction',
  'जब-जब': 'whenever', 'तब-तब': 'then (each time)',
  'जहाँ-जहाँ': 'wherever', 'वहाँ-वहाँ': 'there (each place)',
  'जो-जो': 'whoever', 'सो-सो': 'they (correlative)',
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all unique words and sentences from the deck
// ──────────────────────────────────────────────────────────────
function collectDeckData() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const wordFreq = new Map();
  const wordCards = new Map(); // word -> [{target, english}, ...]
  const uniqueSentences = new Map(); // target sentence -> card english

  // Devanagari Unicode range
  const DEVANAGARI_RE = /[\u0900-\u097F\u0900-\u094D\u0950-\u0954\u0958-\u0970]/;

  for (const card of deck) {
    // Collect unique sentences
    if (card.target && !uniqueSentences.has(card.target)) {
      uniqueSentences.set(card.target, card.english);
    }

    const tokens = tokenize(card.target, 'hindi');
    for (const tok of tokens) {
      const w = tok.trim()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '') // strip curly quotes, ZWJ, etc.
        .replace(/^[—–\-]+|[—–\-]+$/g, '')                  // strip leading/trailing dashes
        .trim();
      if (!w) continue;
      // Only keep tokens that contain at least one Devanagari character
      if (!DEVANAGARI_RE.test(w)) continue;
      // Skip single-char tokens (usually noise)
      if (w.length < 2) continue;
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      if (!wordCards.has(w)) wordCards.set(w, []);
      wordCards.get(w).push({ target: card.target, english: card.english });
    }
  }

  console.log(`Deck has ${deck.length} cards, ${wordFreq.size} unique tokens, ${uniqueSentences.size} unique sentences`);
  return { wordFreq, wordCards, uniqueSentences };
}

// ──────────────────────────────────────────────────────────────
// Parse existing dictionary for IPA / POS / lemma
// ──────────────────────────────────────────────────────────────
function parseExistingDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const existing = {};

  // Match entries like: 'word': { en: 'x', ipa: 'y', pos: 'z' },
  // or with lemma: 'word': { en: 'x', ipa: 'y', pos: 'z', lemma: 'w' },
  const entryRe = /^\s*'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'\s*(?:,\s*lemma:\s*'([^']*)')?\s*\}/gm;
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    existing[m[1]] = {
      en: m[2],
      ipa: m[3],
      pos: m[4],
      lemma: m[5] || null,
    };
  }

  // Also extract footer: everything after the dictionary object (VERB_SUFFIX_PATTERNS, lookupWord, etc.)
  const closingIdx = src.indexOf('\n};\n\n\n// ── Verb form resolution');
  let footer = '';
  if (closingIdx >= 0) {
    footer = src.slice(closingIdx + 4); // after '};\n'
  } else {
    // Fallback: find last '};\n' before VERB_SUFFIX
    const altIdx = src.indexOf('\n};\n');
    if (altIdx >= 0) {
      const afterClose = src.slice(altIdx + 4);
      if (afterClose.includes('VERB_SUFFIX_PATTERNS') || afterClose.includes('lookupWord') || afterClose.includes('findInfinitive')) {
        footer = afterClose;
      }
    }
  }

  // Extract header (everything before the dictionary object)
  const dictStartIdx = src.indexOf('const dictionary: Record<string, DictEntry> = {');
  const header = dictStartIdx >= 0 ? src.slice(0, dictStartIdx) : '';

  console.log(`Parsed ${Object.keys(existing).length} existing entries`);
  return { existing, header, footer };
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Hindi Dictionary Rebuild v4 (Sentence Validation) ===\n');

  // Step 2: Collect deck words and sentences
  const { wordFreq, wordCards, uniqueSentences } = collectDeckData();

  // Read existing dictionary for IPA/POS/lemma preservation
  const { existing, header, footer } = parseExistingDict();

  // Separate function words from words needing translation
  const needTranslation = [];
  const functionResults = {};

  for (const [word] of wordFreq) {
    if (FUNCTION_WORDS[word]) {
      functionResults[word] = FUNCTION_WORDS[word];
    } else {
      needTranslation.push(word);
    }
  }

  console.log(`Function words: ${Object.keys(functionResults).length}`);
  console.log(`Words needing Google translation: ${needTranslation.length}`);

  // Step 3: Google Translate individual words
  console.log('\nStep 3: Translating individual words via Google...');
  const googleRaw = await translateBatch(needTranslation, 'hi');
  console.log(`Got ${Object.keys(googleRaw).length} individual translations`);

  // Step 4: Google Translate ALL unique sentences
  console.log('\nStep 4: Translating all unique sentences via Google...');
  const sentenceList = [...uniqueSentences.keys()];
  console.log(`  ${sentenceList.length} unique sentences to translate (~${Math.round(sentenceList.reduce((s, t) => s + t.length, 0) / 1000)}K chars)`);
  const sentenceTranslations = await translateSentencesPost(sentenceList, 'hi', 25);
  console.log(`Got ${Object.keys(sentenceTranslations).length} sentence translations`);

  // Step 5: Validate each word against sentence translations
  console.log('\nStep 5: Validating words against sentence contexts...');
  let enrichedCount = 0;
  const enrichedDefs = {};

  for (const [word, rawTrans] of Object.entries(googleRaw)) {
    const cards = wordCards.get(word);
    if (!cards || cards.length === 0) {
      enrichedDefs[word] = rawTrans;
      continue;
    }

    // Build contexts: each card's English + Google's sentence translation
    const contexts = cards.map(card => ({
      cardEnglish: card.english,
      sentenceTranslation: sentenceTranslations[card.target] || '',
    }));

    const enriched = validateAndEnrich(word, rawTrans, contexts);
    enrichedDefs[word] = enriched;

    if (enriched !== rawTrans) {
      enrichedCount++;
    }
  }
  console.log(`Enriched ${enrichedCount} definitions with sentence-validated senses`);

  // Step 6: Post-process all 18 rules
  console.log('\nStep 6: Post-processing (18-rule pipeline)...');
  const stats = new PostProcessStats();
  const processed = {};

  // Process function words (hand-curated, no post-processing)
  for (const [word, def] of Object.entries(functionResults)) {
    processed[word] = { en: def, source: 'function_table' };
  }

  // Process enriched Google results
  for (const [word, enrichedTrans] of Object.entries(enrichedDefs)) {
    const existingPos = existing[word]?.pos || 'n';
    const result = postProcess(enrichedTrans, existingPos, word, stats);
    processed[word] = { en: result.text, source: 'google', flagged: result.flagged, flagReasons: result.flagReasons };
  }

  console.log('\n' + stats.report());

  // Step 7: Lemma copy — verified lemmas get base word's definition
  console.log('\nStep 7: Lemma copy...');

  // 7a: Bad lemma removal first
  let badLemmaCount = 0;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && !existing[ex.lemma] && !processed[ex.lemma]) {
      ex.lemma = null;
      badLemmaCount++;
    }
  }
  console.log(`  Removed ${badLemmaCount} bad lemma references`);

  // 7b: Strict lemma copy
  let lemmaCopied = 0;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && processed[ex.lemma] && processed[word]) {
      processed[word].en = processed[ex.lemma].en;
      lemmaCopied++;
    }
  }
  console.log(`  Copied lemma definitions for ${lemmaCopied} entries`);

  // Step 8: Build and write dictionary
  console.log('\nStep 8: Writing dictionary...');
  const entries = [];
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'hi'));

  // Also include existing dictionary words not in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'hi'));

  // Deduplicate
  const seenWords = new Set();
  const dedupedWords = [];
  for (const w of allWords) {
    if (!seenWords.has(w)) {
      seenWords.add(w);
      dedupedWords.push(w);
    }
  }

  for (const word of dedupedWords) {
    const proc = processed[word];
    const ex = existing[word] || {};
    const ipa = ex.ipa || '';
    const pos = ex.pos || (proc ? (proc.en.startsWith('to ') ? 'v' : 'n') : 'n');
    const lemma = ex.lemma || null;
    let en = proc ? proc.en : ex.en;

    if (!en) continue;

    // The post-process proper noun detector is too aggressive for Hindi (all non-Latin source)
    // Strategy: only keep capitalized if the EXISTING dictionary had it capitalized
    if (en.length > 0 && en[0] === en[0].toUpperCase() && en[0] !== en[0].toLowerCase()) {
      const existingEn = ex.en || '';
      const existingWasCapitalized = existingEn.length > 0 && existingEn[0] === existingEn[0].toUpperCase() && existingEn[0] !== existingEn[0].toLowerCase();
      const isProperNoun = /^(India|Hindi|English|Delhi|Mumbai|Kolkata|Chennai|Bangalore|Hyderabad|Jaipur|Varanasi|Agra|Lucknow|Diwali|Holi|Eid|Ramadan|Ganesh|Krishna|Shiva|Vishnu|Brahma|Ganga|Yamuna|Himalaya|Rajasthan|Gujarat|Kerala|Punjab|Bengal|Bihar|Maharashtra|Ambedkar|Gandhi|Nehru|Ajanta|Bollywood)$/i.test(en);
      if (!existingWasCapitalized && !isProperNoun) {
        en = en[0].toLowerCase() + en.slice(1);
      }
    }

    // Ensure verbs have "to " prefix
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
      en = 'to ' + en;
    }
    // Ensure non-verbs don't have "to " prefix
    if (pos !== 'v' && en.startsWith('to ') && !en.startsWith('to the') && !en.includes(';')) {
      en = en.replace(/^to /, '');
    }

    // Escape single quotes in values
    const enEsc = en.replace(/'/g, "\\'");
    const ipaEsc = ipa.replace(/'/g, "\\'");

    // Use double quotes for word keys that contain single quotes or special chars
    const wordHasQuote = word.includes("'") || word.includes('\u2019') || word.includes('\u2018');
    const wordQuote = wordHasQuote ? '"' : "'";
    let line = `  ${wordQuote}${word}${wordQuote}: { en: '${enEsc}', ipa: '${ipaEsc}', pos: '${pos}'`;
    if (lemma) {
      line += `, lemma: '${lemma}'`;
    }
    line += ' },';
    entries.push(line);
  }

  const dictContent = header
    + 'const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};\n'
    + '\n'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 9: 100-entry review -> hi-v5-review.md
  console.log('\nStep 9: Running 100-entry review...');
  const reviewResults = [];
  const allEntryWords = dedupedWords.filter(w => processed[w]);
  const sampleSize = Math.min(100, allEntryWords.length);
  const sample = [];

  // Random sample
  const indices = new Set();
  while (indices.size < sampleSize) {
    indices.add(Math.floor(Math.random() * allEntryWords.length));
  }
  for (const idx of indices) {
    sample.push(allEntryWords[idx]);
  }

  let pass = 0, fail = 0;
  const issues = [];

  for (const word of sample) {
    const proc = processed[word];
    const ex = existing[word] || {};
    const pos = ex.pos || (proc.en.startsWith('to ') ? 'v' : 'n');
    const en = proc.en;
    const problems = [];

    // 1. Wrong "to " prefix on nouns
    if (pos === 'n' && en.startsWith('to ') && !en.startsWith('to the') && !en.includes(';')) {
      problems.push('wrong_to_on_noun');
    }
    // 2. Missing "to " on verbs
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
      problems.push('missing_to_on_verb');
    }
    // 3. Conjugated English forms
    if (/\b(eats|goes|comes|reads|writes|runs|sees|gives|takes|makes|knows|thinks|says|gets|wants|works|plays|lives|loves|feels|finds|tells|asks|uses|tries|needs|keeps|brings|starts|moves|pays|meets|calls|shows|helps)\b/i.test(en)) {
      problems.push('conjugated_english');
    }
    if (/\b\w+ing\b/.test(en.replace(/^to /, '')) && !/(thing|morning|evening|ring|king|spring|string|sing|bring|nothing|something|anything|everything|ceiling|feeling|building|wedding|clothing|warning|opening|meaning|meeting|setting|beginning|during|amazing|interesting|willing|missing|fishing|cooking|swimming|parking|reading|living|working|shopping|nursing|banking|housing)/.test(en)) {
      problems.push('conjugated_english_ing');
    }
    if (/\b(went|came|saw|gave|took|made|knew|thought|told|found|left|kept|brought|bought|sold|caught|taught|built|sent|spent|lost|won|met|led|heard|felt|stood|sat|ran|hung|held|lay|paid|said|wore|ate|drank|drove|wrote|broke|spoke|chose|grew|threw|drew|flew|froze|rode|rose|shook|stole|swore|tore|woke)\b/.test(en.replace(/^to /, ''))) {
      problems.push('conjugated_english_past');
    }
    // 4. Mixed case in definition
    if (/[a-z][A-Z]/.test(en)) {
      problems.push('mixed_case');
    }
    // 5. ALL CAPS
    if (/^[A-Z]{2,}$/.test(en)) {
      problems.push('all_caps');
    }
    // 6. Self-referencing
    if (proc.flagReasons && proc.flagReasons.includes('self_referencing')) {
      problems.push('self_referencing');
    }
    // 7. Grammar descriptions in definitions
    if (/\b(conjugat|declens|tense|plural|singular|masculine|feminine|suffix|prefix|inflect|grammar)\b/i.test(en)) {
      problems.push('grammar_description');
    }
    // 8. Truncated / placeholder
    if (en === '?' || en.length < 2) {
      problems.push('truncated');
    }
    // 9. "?" placeholder
    if (en.includes('?')) {
      problems.push('question_mark');
    }
    // 10. Wrong POS
    if (proc.flagReasons && proc.flagReasons.includes('wrong_pos')) {
      problems.push('wrong_pos');
    }

    if (problems.length === 0) {
      pass++;
      reviewResults.push({ word, en, pos, status: 'PASS' });
    } else {
      fail++;
      reviewResults.push({ word, en, pos, status: 'FAIL', problems });
      issues.push({ word, en, pos, problems });
    }
  }

  const grade = pass >= 90 ? 'A' : pass >= 80 ? 'B' : pass >= 70 ? 'C' : pass >= 60 ? 'D' : 'F';

  // Write review
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let md = `# Hindi Dictionary v4 Rebuild (Sentence Validation) - 100-Entry Review\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries written:** ${entries.length}\n`;
  md += `**Function words:** ${Object.keys(functionResults).length}\n`;
  md += `**Google translated (individual):** ${Object.keys(googleRaw).length}\n`;
  md += `**Sentences translated:** ${Object.keys(sentenceTranslations).length}\n`;
  md += `**Enriched by sentence validation:** ${enrichedCount}\n`;
  md += `**Lemma-copied:** ${lemmaCopied}\n`;
  md += `**Bad lemmas removed:** ${badLemmaCount}\n\n`;
  md += `## Review Results\n\n`;
  md += `**Pass:** ${pass} / ${sampleSize}\n`;
  md += `**Fail:** ${fail} / ${sampleSize}\n`;
  md += `**Grade:** ${grade}\n\n`;

  if (issues.length > 0) {
    md += `## Issues Found\n\n`;
    md += `| Word | English | POS | Problems |\n`;
    md += `|------|---------|-----|----------|\n`;
    for (const i of issues) {
      md += `| ${i.word} | ${i.en} | ${i.pos} | ${i.problems.join(', ')} |\n`;
    }
    md += '\n';
  }

  md += `## Full Sample\n\n`;
  md += `| # | Word | English | POS | Status |\n`;
  md += `|---|------|---------|-----|--------|\n`;
  for (let i = 0; i < reviewResults.length; i++) {
    const r = reviewResults[i];
    md += `| ${i + 1} | ${r.word} | ${r.en} | ${r.pos} | ${r.status} |\n`;
  }

  md += `\n## Post-Processing Stats\n\n\`\`\`\n${stats.report()}\n\`\`\`\n`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'hi-v5-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/hi-v5-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
