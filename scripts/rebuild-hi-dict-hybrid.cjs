#!/usr/bin/env node
/**
 * Rebuild Hindi dictionary using hybrid approach with card-based validation.
 *
 * Priority order:
 * 1. FUNCTION_WORDS hand-verified table (~80+ entries)
 * 2. Lemma copy (if word has lemma and lemma is in dict)
 * 3. Wiktionary (from git commit 3b22b4c2) — validated against cards
 * 4. Google Translate API — validated against cards
 * 5. Current dictionary as fallback
 *
 * Output: scripts/output/hi-dict-rebuild-preview.json + .md
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');

// ─── Step 1: Function word table (hand-verified, ground truth) ───────────

const FUNCTION_WORDS = {
  // Pronouns
  'मैं': 'I', 'मुझे': 'me, to me', 'मुझसे': 'from me', 'मेरा': 'my', 'मेरी': 'my (f.)', 'मेरे': 'my (pl./obl.)',
  'तू': 'you (intimate)', 'तुम': 'you', 'तुम्हें': 'you (to)', 'तुम्हारा': 'your', 'तुम्हारी': 'your (f.)', 'तुम्हारे': 'your (pl.)',
  'आप': 'you (formal)', 'आपका': 'your (formal)', 'आपकी': 'your (formal f.)', 'आपके': 'your (formal pl.)',
  'आपको': 'to you (formal)', 'आपने': 'you (formal, erg.)',
  'वह': 'he/she/that', 'वो': 'he/she/that', 'वे': 'they/those', 'यह': 'this', 'ये': 'these/they',
  'हम': 'we', 'हमें': 'us, to us', 'हमारा': 'our', 'हमारी': 'our (f.)', 'हमारे': 'our (pl.)',
  'उसे': 'him/her (to)', 'उसने': 'he/she (erg.)', 'उसका': 'his/her', 'उसकी': 'his/her (f.)', 'उसके': 'his/her (pl.)',
  'उन्हें': 'them (to)', 'उन्होंने': 'they (erg.)', 'उनका': 'their', 'उनकी': 'their (f.)', 'उनके': 'their (pl.)',
  'इसे': 'this (to)', 'इसने': 'this (erg.)', 'इसका': 'its', 'इसकी': 'its (f.)', 'इसके': 'its (pl.)',
  'इन्हें': 'these (to)', 'इन्होंने': 'these (erg.)',
  'कौन': 'who', 'किसने': 'who (erg.)', 'किसे': 'whom', 'किसका': 'whose', 'किसकी': 'whose (f.)',
  'क्या': 'what', 'कहाँ': 'where', 'कब': 'when', 'कैसे': 'how', 'कैसा': 'how, what kind',
  'कैसी': 'how, what kind (f.)', 'क्यों': 'why',
  'कितना': 'how much', 'कितने': 'how many', 'कितनी': 'how much (f.)', 'कौनसा': 'which',
  'खुद': 'self', 'अपना': 'own, self', 'अपनी': 'own (f.)', 'अपने': 'own (pl.)',
  'जिसे': 'to whom/which', 'जिसका': 'whose', 'जिसकी': 'whose (f.)', 'जिन्हें': 'to whom (pl.)',

  // Postpositions
  'में': 'in', 'पर': 'on, at', 'को': 'to', 'से': 'from, with, by', 'का': 'of (m.)',
  'की': 'of (f.)', 'के': 'of (pl./obl.)', 'तक': 'until, up to', 'लिए': 'for',
  'बिना': 'without', 'साथ': 'with, together', 'बारे': 'about', 'बाद': 'after', 'पहले': 'before, first',
  'बीच': 'between, middle', 'ऊपर': 'above, up', 'नीचे': 'below, down', 'अंदर': 'inside, within', 'बाहर': 'outside',
  'पास': 'near', 'दूर': 'far', 'यहाँ': 'here', 'वहाँ': 'there', 'ने': 'ergative marker',
  'द्वारा': 'by, through', 'बजाय': 'instead of', 'ओर': 'toward, side',
  'सामने': 'in front of', 'पीछे': 'behind', 'आगे': 'ahead, forward',
  'करीब': 'near, approximately', 'तरफ़': 'toward', 'तरफ': 'toward',

  // Conjunctions & particles
  'और': 'and', 'या': 'or', 'लेकिन': 'but', 'मगर': 'but', 'कि': 'that',
  'अगर': 'if', 'तो': 'then', 'भी': 'also, too', 'ही': 'only, just',
  'न': 'not', 'ना': 'not, don\'t', 'नहीं': 'no, not', 'मत': 'don\'t',
  'हाँ': 'yes', 'जी': 'yes (polite)', 'बस': 'just, enough',
  'तभी': 'only then', 'इसलिए': 'therefore', 'क्योंकि': 'because',
  'जब': 'when', 'जहाँ': 'where', 'जैसे': 'like, as', 'जबकि': 'whereas, while',
  'जैसा': 'like, as', 'जिससे': 'so that, from which',
  'अगर': 'if', 'यदि': 'if', 'चाहे': 'whether', 'फिर': 'again, then',
  'तथा': 'and, as well as', 'एवं': 'and',
  'वरना': 'otherwise', 'परंतु': 'but, however',

  // Auxiliaries & verb forms
  'है': 'is', 'हैं': 'are', 'था': 'was (m.)', 'थी': 'was (f.)', 'थे': 'were',
  'हूँ': 'am', 'हो': 'are (you)', 'होता': 'happens (m.)', 'होती': 'happens (f.)',
  'होते': 'happens (pl.)', 'होगा': 'will be (m.)', 'होगी': 'will be (f.)', 'होंगे': 'will be (pl.)',
  'रहा': 'continuous (m.)', 'रही': 'continuous (f.)',
  'रहे': 'continuous (pl.)', 'रहो': 'stay (imperative)',
  'गया': 'went, done (m.)', 'गई': 'went, done (f.)',
  'गए': 'went, done (pl.)', 'गयी': 'went, done (f.)',
  'सकता': 'can (m.)', 'सकती': 'can (f.)', 'सकते': 'can (pl.)',
  'सकें': 'can (subjunctive pl.)', 'सके': 'could (m.)',
  'चाहिए': 'should', 'चाहता': 'want (m.)', 'चाहती': 'want (f.)', 'चाहते': 'want (pl.)',
  'दिया': 'gave (m.)', 'दी': 'gave (f.)', 'दिए': 'gave (pl.)',
  'लिया': 'took (m.)', 'ली': 'took (f.)', 'लिए': 'for, took (pl.)',
  'किया': 'did (m.)', 'किए': 'did (pl.)',
  'हुआ': 'happened (m.)', 'हुई': 'happened (f.)', 'हुए': 'happened (pl.)',
  'सका': 'could (m.)', 'सकी': 'could (f.)',
  'पाया': 'found, managed (m.)', 'पाई': 'found, managed (f.)',
  'डाला': 'put, done (m.)', 'डाली': 'put, done (f.)',
  'रहता': 'stays (m.)', 'रहती': 'stays (f.)', 'रहते': 'stays (pl.)',
  'करता': 'does (m.)', 'करती': 'does (f.)', 'करते': 'does (pl.)',
  'करो': 'do (imperative)', 'करें': 'do (formal/subjunctive)',
  'कीजिए': 'please do', 'कीजिये': 'please do',
  'दो': 'give, two', 'दें': 'give (formal)',

  // Common adverbs & adjectives
  'बहुत': 'very, much', 'कभी': 'ever, sometimes', 'हमेशा': 'always',
  'अभी': 'right now', 'आज': 'today', 'कल': 'yesterday/tomorrow', 'अक्सर': 'often',
  'सब': 'all, everyone', 'कुछ': 'some, something', 'कोई': 'someone, any',
  'ज़रा': 'a little', 'थोड़ा': 'a little', 'थोड़ी': 'a little (f.)', 'थोड़े': 'a few',
  'ज़्यादा': 'more', 'ज्यादा': 'more', 'कम': 'less',
  'अभी': 'right now', 'अब': 'now', 'तब': 'then',
  'पहले': 'before, first', 'बाद': 'after', 'जल्दी': 'quickly, soon',
  'धीरे': 'slowly', 'अचानक': 'suddenly',
  'फिर': 'again, then', 'सीधे': 'straight',
  'ठीक': 'fine, correct', 'सही': 'correct, right',
  'बड़ा': 'big (m.)', 'बड़ी': 'big (f.)', 'बड़े': 'big (pl.)',
  'छोटा': 'small (m.)', 'छोटी': 'small (f.)', 'छोटे': 'small (pl.)',
  'अच्छा': 'good (m.)', 'अच्छी': 'good (f.)', 'अच्छे': 'good (pl.)',
  'बुरा': 'bad (m.)', 'बुरी': 'bad (f.)', 'बुरे': 'bad (pl.)',
  'नया': 'new (m.)', 'नई': 'new (f.)', 'नए': 'new (pl.)',
  'पुराना': 'old (m.)', 'पुरानी': 'old (f.)', 'पुराने': 'old (pl.)',
  'सारा': 'all, whole (m.)', 'सारी': 'all, whole (f.)', 'सारे': 'all, whole (pl.)',
  'वाला': 'one who (m.)', 'वाली': 'one who (f.)', 'वाले': 'one who (pl.)',
  'ऐसा': 'such (m.)', 'ऐसी': 'such (f.)', 'ऐसे': 'such (pl.)',
  'वैसा': 'like that (m.)', 'वैसी': 'like that (f.)', 'वैसे': 'like that (pl.)',
  'जैसा': 'like, as (m.)', 'जैसी': 'like, as (f.)',

  // Determiners & numbers
  'एक': 'one, a', 'दो': 'two', 'तीन': 'three', 'चार': 'four', 'पाँच': 'five',
  'छह': 'six', 'सात': 'seven', 'आठ': 'eight', 'नौ': 'nine', 'दस': 'ten',
  'हर': 'every', 'सारे': 'all', 'कई': 'several', 'कुल': 'total',
  'इस': 'this (obl.)', 'उस': 'that (obl.)', 'जो': 'who, which', 'जिस': 'which (obl.)',
  'इन': 'these (obl.)', 'उन': 'those (obl.)', 'जिन': 'which (obl. pl.)',
  'किस': 'which (obl.)', 'किन': 'which (obl. pl.)',
  'ऐसा': 'such (m.)', 'कैसा': 'what kind (m.)',

  // Greetings & common expressions
  'नमस्ते': 'hello, namaste', 'धन्यवाद': 'thank you', 'शुक्रिया': 'thank you',
  'माफ़': 'sorry, pardon', 'माफ': 'sorry, pardon', 'कृपया': 'please',
  'स्वागत': 'welcome', 'अलविदा': 'goodbye',

  // Common nouns used as function-like words
  'बात': 'thing, matter, talk', 'काम': 'work', 'तरह': 'way, type',
  'वक्त': 'time', 'समय': 'time', 'जगह': 'place', 'लोग': 'people',
  'लोगों': 'people (obl.)', 'चीज़': 'thing', 'चीज़ें': 'things',
  'दिन': 'day', 'रात': 'night', 'साल': 'year', 'महीना': 'month',
  'घर': 'home, house', 'पानी': 'water', 'खाना': 'food, to eat',
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Parse dictionary .ts file content into a map of word -> entry
 */
function parseDictTS(content) {
  const dict = {};
  // Match entries like: 'word': { en: 'def', ipa: 'ipa', pos: 'pos' }
  // or with lemma: 'word': { en: 'def', ipa: 'ipa', pos: 'pos', lemma: 'lemma' }
  const regex = /^\s*'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'/gm;
  const lemmaRegex = /^\s*'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)',\s*lemma:\s*'([^']*)'/gm;

  let match;
  // First pass: entries with lemma
  while ((match = lemmaRegex.exec(content)) !== null) {
    dict[match[1]] = {
      en: match[2],
      ipa: match[3],
      pos: match[4],
      lemma: match[5],
    };
  }
  // Second pass: entries without lemma (won't overwrite lemma entries)
  regex.lastIndex = 0;
  while ((match = regex.exec(content)) !== null) {
    if (!dict[match[1]]) {
      dict[match[1]] = {
        en: match[2],
        ipa: match[3],
        pos: match[4],
      };
    }
  }
  return dict;
}

/**
 * Parse deck.json and build word -> card mapping
 */
function loadDeck() {
  const deckPath = path.join(ROOT, 'src', 'data', 'hindi', 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  // word -> Set of card IDs
  const wordToCards = new Map();
  // word -> Set of English content words from all cards containing it
  const wordToEnglish = new Map();
  // card ID -> english text
  const cardEnglish = new Map();

  for (const card of deck) {
    const tokens = card.target
      .replace(/[.,!?;:"""\u2018\u2019()—–«»\u0964\u0965/\[\]{}।]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const engWords = new Set(
      (card.english || '').toLowerCase()
        .replace(/[.,!?;:"""\u2018\u2019()—–«»/\[\]{}]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );

    cardEnglish.set(card.id, card.english || '');

    for (const t of tokens) {
      if (!wordToCards.has(t)) wordToCards.set(t, new Set());
      wordToCards.get(t).add(card.id);

      if (!wordToEnglish.has(t)) wordToEnglish.set(t, new Set());
      for (const ew of engWords) wordToEnglish.get(t).add(ew);
    }
  }

  return { wordToCards, wordToEnglish, cardEnglish, deckSize: deck.length };
}

/**
 * Check if a definition validates against card English translations.
 * Returns { validated: boolean, matchingCards: string[] }
 */
function validateAgainstCards(word, definition, wordToCards, wordToEnglish, cardEnglish) {
  const cards = wordToCards.get(word);
  if (!cards || cards.size === 0) {
    return { validated: false, matchingCards: [] };
  }

  // Extract content words from definition (strip articles, prepositions)
  const stopWords = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'by', 'for',
    'with', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'and', 'or']);

  const defWords = definition.toLowerCase()
    .replace(/[.,;:!?()[\]{}]/g, ' ')
    .split(/[\s,\/]+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  if (defWords.length === 0) {
    // For very short definitions (1-2 char words like "if"), try exact match
    const shortDef = definition.toLowerCase().trim();
    for (const cardId of cards) {
      const eng = (cardEnglish.get(cardId) || '').toLowerCase();
      if (eng.includes(shortDef)) {
        return { validated: true, matchingCards: [cardId] };
      }
    }
    return { validated: false, matchingCards: [] };
  }

  const matchingCards = [];
  for (const cardId of cards) {
    const eng = (cardEnglish.get(cardId) || '').toLowerCase();
    const engTokens = eng.replace(/[.,;:!?()[\]{}]/g, ' ').split(/\s+/);

    for (const dw of defWords) {
      // Check for word stem matches (>= 4 chars)
      const found = engTokens.some(et => {
        if (dw === et) return true;
        if (dw.length >= 4 && et.length >= 4) {
          const stem = dw.slice(0, Math.min(dw.length, 5));
          return et.startsWith(stem) || dw.startsWith(et.slice(0, Math.min(et.length, 5)));
        }
        return false;
      });
      if (found) {
        matchingCards.push(cardId);
        break;
      }
    }
  }

  return { validated: matchingCards.length > 0, matchingCards: matchingCards.slice(0, 5) };
}

/**
 * Check if a Wiktionary definition is clean/usable
 */
function isCleanDefinition(def) {
  if (!def || def === '?') return false;
  if (def.length > 60) return false;
  // Self-referencing grammar descriptions
  if (/oblique|masculine|feminine|plural|singular|participle|infinitive|genitive|dative|accusative/i.test(def)
      && !/to /.test(def)) return false;
  // Wiki markup
  if (/\[\[|\]\]|\{\{|\}\}|<[a-z]|&[a-z]+;/i.test(def)) return false;
  // Truncated
  if (def.endsWith('...') || def.endsWith('…')) return false;
  // Pure grammar description
  if (/^(the |a )?(third|first|second|nominative|accusative)/i.test(def)) return false;
  // Contains the target word transliterated
  if (/^[a-z]+ form of /i.test(def)) return false;
  return true;
}

/**
 * Post-process a Google Translate result
 */
function postProcessTranslation(text, pos) {
  if (!text) return text;
  // Decode HTML entities
  text = text.replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  // Lowercase first letter always (Google often capitalizes incorrectly)
  // Exception: known proper noun patterns won't appear here since these are common words
  if (text.length > 0 && text[0] === text[0].toUpperCase()) {
    text = text[0].toLowerCase() + text.slice(1);
  }
  // Add "to " for verbs
  if (pos === 'v' && !text.startsWith('to ')) {
    text = 'to ' + text;
  }
  // If too wordy, take key content
  const words = text.split(/\s+/);
  if (words.length > 5) {
    // Keep first meaningful phrase
    text = words.slice(0, 4).join(' ');
  }
  // Cap at 60 chars
  if (text.length > 60) {
    text = text.slice(0, 57) + '...';
  }
  return text.trim();
}

/**
 * Batch translate words via Google Translate API
 */
async function batchTranslate(words, apiKey) {
  const results = {};
  const batchSize = 80;

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const progress = Math.floor((i / words.length) * 100);
    process.stderr.write(`\r  Google Translate: ${progress}% (${i}/${words.length})`);

    try {
      const url = new URL('https://translation.googleapis.com/language/translate/v2');
      url.searchParams.set('key', apiKey);

      const body = JSON.stringify({
        q: batch,
        source: 'hi',
        target: 'en',
        format: 'text',
      });

      const data = await new Promise((resolve, reject) => {
        const req = https.request(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error(`Parse error: ${data.slice(0, 200)}`)); }
          });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });

      if (data.data && data.data.translations) {
        for (let j = 0; j < batch.length; j++) {
          if (data.data.translations[j]) {
            results[batch[j]] = data.data.translations[j].translatedText;
          }
        }
      } else if (data.error) {
        console.error(`\nAPI error: ${data.error.message}`);
        // Wait and retry on rate limit
        if (data.error.code === 429) {
          console.error('Rate limited, waiting 10s...');
          await new Promise(r => setTimeout(r, 10000));
          i -= batchSize; // retry
          continue;
        }
      }
    } catch (err) {
      console.error(`\nTranslation error at batch ${i}: ${err.message}`);
    }

    // Small delay between batches
    if (i + batchSize < words.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  process.stderr.write(`\r  Google Translate: 100% (${words.length}/${words.length})\n`);
  return results;
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const API_KEY = process.argv[2] || process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!API_KEY) {
    console.error('Usage: node scripts/rebuild-hi-dict-hybrid.cjs <google-api-key>');
    process.exit(1);
  }

  console.log('=== Hindi Dictionary Hybrid Rebuild ===\n');

  // Load current dictionary
  console.log('1. Loading current dictionary...');
  const currentContent = fs.readFileSync(
    path.join(ROOT, 'src', 'data', 'dictionary', 'hi.ts'), 'utf8'
  );
  const currentDict = parseDictTS(currentContent);
  console.log(`   Current entries: ${Object.keys(currentDict).length}`);

  // Load Wiktionary dictionary
  console.log('2. Loading Wiktionary dictionary (3b22b4c2)...');
  const { execSync } = require('child_process');
  let wiktContent;
  try {
    wiktContent = execSync('git show 3b22b4c2:src/data/dictionary/hi.ts', {
      cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
    });
  } catch (e) {
    console.error('   Failed to get Wiktionary version, using empty');
    wiktContent = '';
  }
  const wiktDict = parseDictTS(wiktContent);
  console.log(`   Wiktionary entries: ${Object.keys(wiktDict).length}`);

  // Load deck
  console.log('3. Loading Hindi deck...');
  const { wordToCards, wordToEnglish, cardEnglish, deckSize } = loadDeck();
  console.log(`   Deck: ${deckSize} cards, ${wordToCards.size} unique tokens`);

  // ─── Process each entry ──────────────────────────────

  console.log('\n4. Processing entries...\n');

  const results = [];
  const stats = { function_table: 0, lemma_copy: 0, wiktionary: 0, google: 0, current_fallback: 0, unresolved: 0 };

  // Collect words needing Google Translate
  const needsGoogle = [];

  // First pass: resolve what we can without Google
  const entries = Object.keys(currentDict);
  const firstPassResults = {};

  for (const word of entries) {
    const entry = currentDict[word];

    // Skip non-Hindi keys (English words that crept into the dict)
    if (/^[a-zA-Z]/.test(word) && !/[^\x00-\x7F]/.test(word)) {
      // English word - skip from rebuild
      continue;
    }

    // (a) Function word table
    if (FUNCTION_WORDS[word]) {
      firstPassResults[word] = {
        word,
        source: 'function_table',
        old_en: entry.en,
        new_en: FUNCTION_WORDS[word],
        validated: true,
        validation_cards: [],
        pos: entry.pos,
        ipa: entry.ipa,
        lemma: entry.lemma,
      };
      continue;
    }

    // (b) Lemma copy
    if (entry.lemma && currentDict[entry.lemma]) {
      const lemmaEntry = currentDict[entry.lemma];
      // Use lemma's definition, but check if it's good
      let lemmaDef = lemmaEntry.en;
      // If lemma itself is in function words, use that
      if (FUNCTION_WORDS[entry.lemma]) {
        lemmaDef = FUNCTION_WORDS[entry.lemma];
      }
      // Check if lemma definition is not garbage
      if (lemmaDef && lemmaDef !== '?' && isCleanDefinition(lemmaDef)) {
        firstPassResults[word] = {
          word,
          source: 'lemma_copy',
          old_en: entry.en,
          new_en: lemmaDef,
          validated: true,
          validation_cards: [],
          pos: entry.pos,
          ipa: entry.ipa,
          lemma: entry.lemma,
        };
        continue;
      }
    }

    // (c) Wiktionary check
    const wiktEntry = wiktDict[word];
    if (wiktEntry && isCleanDefinition(wiktEntry.en)) {
      const validation = validateAgainstCards(word, wiktEntry.en, wordToCards, wordToEnglish, cardEnglish);
      if (validation.validated) {
        firstPassResults[word] = {
          word,
          source: 'wiktionary',
          old_en: entry.en,
          new_en: wiktEntry.en,
          validated: true,
          validation_cards: validation.matchingCards,
          pos: entry.pos || wiktEntry.pos,
          ipa: entry.ipa || wiktEntry.ipa,
          lemma: entry.lemma,
        };
        continue;
      }
      // Wiktionary exists but didn't validate — still save it as candidate
      firstPassResults[word] = {
        word,
        source: 'wiktionary_unvalidated',
        old_en: entry.en,
        new_en: wiktEntry.en,
        wiktCandidate: wiktEntry.en,
        validated: false,
        validation_cards: [],
        pos: entry.pos || wiktEntry.pos,
        ipa: entry.ipa || wiktEntry.ipa,
        lemma: entry.lemma,
      };
      needsGoogle.push(word);
      continue;
    }

    // (d) Need Google Translate
    needsGoogle.push(word);
    firstPassResults[word] = {
      word,
      source: 'pending_google',
      old_en: entry.en,
      new_en: null,
      wiktCandidate: wiktEntry ? wiktEntry.en : null,
      validated: false,
      validation_cards: [],
      pos: entry.pos,
      ipa: entry.ipa,
      lemma: entry.lemma,
    };
  }

  console.log(`   First pass complete:`);
  const fpDone = Object.values(firstPassResults).filter(r => r.source !== 'pending_google' && r.source !== 'wiktionary_unvalidated').length;
  console.log(`   - Resolved without Google: ${fpDone}`);
  console.log(`   - Need Google Translate: ${needsGoogle.length}`);

  // ─── Google Translate pass ──────────────────────────

  console.log('\n5. Running Google Translate...');
  const translations = await batchTranslate(needsGoogle, API_KEY);
  console.log(`   Got ${Object.keys(translations).length} translations`);

  // ─── Merge Google results ──────────────────────────

  console.log('\n6. Merging and validating...');

  for (const word of needsGoogle) {
    const result = firstPassResults[word];
    const entry = currentDict[word];
    const googleRaw = translations[word];
    const pos = entry ? entry.pos : 'n';

    if (googleRaw) {
      const googleDef = postProcessTranslation(googleRaw, pos);
      const googleValidation = validateAgainstCards(word, googleDef, wordToCards, wordToEnglish, cardEnglish);

      if (result.source === 'wiktionary_unvalidated') {
        // Both Wiktionary and Google available — pick the better one
        const wiktValidation = validateAgainstCards(word, result.wiktCandidate, wordToCards, wordToEnglish, cardEnglish);

        if (googleValidation.validated && !wiktValidation.validated) {
          result.source = 'google';
          result.new_en = googleDef;
          result.validated = true;
          result.validation_cards = googleValidation.matchingCards;
        } else if (wiktValidation.validated) {
          result.source = 'wiktionary';
          result.new_en = result.wiktCandidate;
          result.validated = true;
          result.validation_cards = wiktValidation.matchingCards;
        } else if (googleValidation.matchingCards.length >= wiktValidation.matchingCards.length) {
          result.source = 'google';
          result.new_en = googleDef;
          result.validated = false;
          result.validation_cards = googleValidation.matchingCards;
        } else {
          result.source = 'wiktionary';
          result.new_en = result.wiktCandidate;
          result.validated = false;
          result.validation_cards = wiktValidation.matchingCards;
        }
      } else {
        // Only Google available
        result.source = 'google';
        result.new_en = googleDef;
        result.validated = googleValidation.validated;
        result.validation_cards = googleValidation.matchingCards;
      }
    } else if (result.source === 'wiktionary_unvalidated') {
      // No Google, use Wiktionary anyway
      result.source = 'wiktionary';
      result.new_en = result.wiktCandidate;
    } else {
      // Neither Google nor Wiktionary — use current if it's not garbage
      if (entry && entry.en && entry.en !== '?' && isCleanDefinition(entry.en)) {
        result.source = 'current_fallback';
        result.new_en = entry.en;
        const val = validateAgainstCards(word, entry.en, wordToCards, wordToEnglish, cardEnglish);
        result.validated = val.validated;
        result.validation_cards = val.matchingCards;
      } else {
        result.source = 'unresolved';
        result.new_en = entry ? entry.en : '?';
        result.validated = false;
      }
    }

    // Clean up temp fields
    delete result.wiktCandidate;
  }

  // ─── Lemma second pass ──────────────────────────
  // Now that we've resolved all entries, do a second lemma copy pass
  // for entries that have lemmas pointing to now-resolved entries

  console.log('\n7. Second lemma-copy pass...');
  let lemmaCopies2 = 0;
  for (const word of Object.keys(firstPassResults)) {
    const result = firstPassResults[word];
    if (result.source === 'unresolved' || (!result.validated && result.new_en === '?')) {
      const entry = currentDict[word];
      if (entry && entry.lemma && firstPassResults[entry.lemma]) {
        const lemmaResult = firstPassResults[entry.lemma];
        if (lemmaResult.new_en && lemmaResult.new_en !== '?' && lemmaResult.validated) {
          result.source = 'lemma_copy';
          result.new_en = lemmaResult.new_en;
          result.validated = true;
          result.validation_cards = [];
          lemmaCopies2++;
        }
      }
    }
  }
  console.log(`   Additional lemma copies: ${lemmaCopies2}`);

  // ─── Compile final results ──────────────────────────

  for (const word of Object.keys(firstPassResults)) {
    const r = firstPassResults[word];
    // Count stats
    const src = r.source.replace('_unvalidated', '');
    if (stats[src] !== undefined) stats[src]++;
    else stats[src] = (stats[src] || 0) + 1;
    results.push(r);
  }

  // ─── Step 4: Output ──────────────────────────────────

  console.log('\n8. Writing output files...');

  const outputDir = path.join(ROOT, 'scripts', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // JSON output
  const jsonPath = path.join(outputDir, 'hi-dict-rebuild-preview.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`   Written: ${jsonPath}`);

  // Markdown preview (200 random entries)
  const shuffled = [...results].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, 200);

  let md = `# Hindi Dictionary Rebuild Preview\n\n`;
  md += `**Date:** ${new Date().toISOString().slice(0, 10)}\n`;
  md += `**Total entries:** ${results.length}\n\n`;
  md += `## Source Breakdown\n\n`;
  md += `| Source | Count | % |\n|--------|-------|---|\n`;
  for (const [src, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    md += `| ${src} | ${count} | ${(count / results.length * 100).toFixed(1)}% |\n`;
  }

  const validatedCount = results.filter(r => r.validated).length;
  const unresolvedCount = results.filter(r => r.new_en === '?' || r.source === 'unresolved').length;
  const changedCount = results.filter(r => r.old_en !== r.new_en).length;

  md += `\n## Summary\n\n`;
  md += `- **Total entries:** ${results.length}\n`;
  md += `- **Validated against cards:** ${validatedCount} (${(validatedCount / results.length * 100).toFixed(1)}%)\n`;
  md += `- **Changed from current:** ${changedCount}\n`;
  md += `- **Unresolved (still ?):** ${unresolvedCount}\n\n`;

  md += `## Random Sample (200 entries)\n\n`;
  md += `| Word | Old Definition | New Definition | Source | Validated? |\n`;
  md += `|------|---------------|---------------|--------|------------|\n`;
  for (const r of sample) {
    const old = (r.old_en || '').replace(/\|/g, '\\|');
    const newDef = (r.new_en || '').replace(/\|/g, '\\|');
    md += `| ${r.word} | ${old} | ${newDef} | ${r.source} | ${r.validated ? 'Y' : 'N'} |\n`;
  }

  // Also show all unresolved entries
  const unresolved = results.filter(r => r.new_en === '?' || r.source === 'unresolved');
  if (unresolved.length > 0) {
    md += `\n## Unresolved Entries (${unresolved.length})\n\n`;
    md += `| Word | Old Definition | Source |\n`;
    md += `|------|---------------|--------|\n`;
    for (const r of unresolved) {
      md += `| ${r.word} | ${(r.old_en || '').replace(/\|/g, '\\|')} | ${r.source} |\n`;
    }
  }

  // Show entries where definition changed significantly
  const bigChanges = results.filter(r => r.old_en !== r.new_en && r.old_en !== '?' && r.new_en !== '?').slice(0, 100);
  if (bigChanges.length > 0) {
    md += `\n## Notable Changes (first 100)\n\n`;
    md += `| Word | Old | New | Source | Validated? |\n`;
    md += `|------|-----|-----|--------|------------|\n`;
    for (const r of bigChanges) {
      const old = (r.old_en || '').replace(/\|/g, '\\|');
      const newDef = (r.new_en || '').replace(/\|/g, '\\|');
      md += `| ${r.word} | ${old} | ${newDef} | ${r.source} | ${r.validated ? 'Y' : 'N'} |\n`;
    }
  }

  const mdPath = path.join(outputDir, 'hi-dict-rebuild-preview.md');
  fs.writeFileSync(mdPath, md);
  console.log(`   Written: ${mdPath}`);

  // ─── Report ──────────────────────────────────────────

  console.log('\n=== REPORT ===\n');
  console.log(`Total entries:          ${results.length}`);
  console.log(`Source breakdown:`);
  for (const [src, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src.padEnd(20)} ${String(count).padStart(5)} (${(count / results.length * 100).toFixed(1)}%)`);
  }
  console.log(`\nValidation rate:        ${validatedCount}/${results.length} (${(validatedCount / results.length * 100).toFixed(1)}%)`);
  console.log(`Changed from current:   ${changedCount}`);
  console.log(`Unresolved:             ${unresolvedCount}`);
  console.log(`\nDone!`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
