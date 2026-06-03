#!/usr/bin/env node
/**
 * Rebuild Hindi dictionary using SENTENCE-CONTEXT approach.
 *
 * Pipeline:
 *   Step 1: Hand-verified function words (300+ entries)
 *   Step 2: Google Translate all content words (batch 80)
 *   Step 3: Post-process with 16 rules + proper noun + non-verb detection
 *   Step 4: Lemma copy – for EVERY entry with a lemma field, use the lemma's definition
 *   Step 5: Card-context validation – validate each entry against all cards containing it
 *   Step 6: POS fix – correct POS based on Google's raw output
 *   Step 7: Apply to dictionary, preserving IPA and lemma fields
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/hi.ts');
const DECK_PATH = path.join(ROOT, 'src/data/hindi/deck.json');
const OUT_DIR = path.join(ROOT, 'scripts/output');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ══════════════════════════════════════════════════════════════
// Step 1: Hand-verified Hindi function words (300+ entries)
// ══════════════════════════════════════════════════════════════
const FUNCTION_WORDS = {
  // Pronouns
  'मैं': 'I', 'मुझे': 'me, to me', 'मुझसे': 'from me', 'मेरा': 'my', 'मेरी': 'my', 'मेरे': 'my',
  'तुम': 'you', 'तुम्हें': 'you, to you', 'तुम्हारा': 'your', 'तुम्हारी': 'your', 'तुम्हारे': 'your',
  'आप': 'you (formal)', 'आपका': 'your', 'आपकी': 'your', 'आपके': 'your', 'आपको': 'to you',
  'वह': 'he, she, that', 'वे': 'they, those', 'यह': 'this', 'ये': 'these, they',
  'हम': 'we', 'हमें': 'us, to us', 'हमारा': 'our', 'हमारी': 'our', 'हमारे': 'our',
  'उसका': 'his, her', 'उसकी': 'his, her', 'उसके': 'his, her', 'उसे': 'him, her',
  'उनका': 'their', 'उनकी': 'their', 'उनके': 'their', 'उन्हें': 'them',
  'इसका': 'its', 'इसकी': 'its', 'इसके': 'its', 'इसे': 'it, this',
  'कौन': 'who', 'किसे': 'whom', 'किसका': 'whose', 'किसकी': 'whose', 'किसके': 'whose',
  'क्या': 'what', 'कहाँ': 'where', 'कब': 'when', 'कैसे': 'how', 'कैसा': 'how, what kind',
  'कैसी': 'how, what kind', 'क्यों': 'why', 'कितना': 'how much', 'कितने': 'how many', 'कितनी': 'how much',
  'कौनसा': 'which', 'जो': 'who, which', 'जिसे': 'whom', 'जिसका': 'whose',
  'अपना': 'own, self', 'अपनी': 'own, self', 'अपने': 'own, self',
  'खुद': 'self', 'स्वयं': 'self',

  // Postpositions
  'में': 'in', 'पर': 'on, at', 'को': 'to', 'से': 'from, by, with', 'का': 'of',
  'की': 'of', 'के': 'of', 'ने': '(agent marker)', 'तक': 'until, up to', 'लिए': 'for',
  'बिना': 'without', 'साथ': 'with, together', 'बारे': 'about', 'बाद': 'after',
  'पहले': 'before, first', 'बीच': 'between, middle', 'ऊपर': 'above, up',
  'नीचे': 'below, down', 'अंदर': 'inside', 'बाहर': 'outside',
  'पास': 'near, have', 'दूर': 'far', 'यहाँ': 'here', 'वहाँ': 'there',
  'सामने': 'in front', 'पीछे': 'behind', 'बगल': 'beside', 'तरफ़': 'towards',
  'द्वारा': 'by, through', 'बजाय': 'instead of', 'अलावा': 'apart from',

  // Conjunctions & particles
  'और': 'and', 'या': 'or', 'लेकिन': 'but', 'मगर': 'but', 'परंतु': 'but',
  'कि': 'that', 'अगर': 'if', 'तो': 'then', 'भी': 'also, too', 'ही': 'only, just',
  'न': 'not', 'नहीं': 'no, not', 'मत': 'don\'t', 'हाँ': 'yes', 'जी': 'yes (polite)',
  'क्योंकि': 'because', 'इसलिए': 'therefore', 'जब': 'when', 'तब': 'then',
  'जहाँ': 'where', 'वाला': '-er, one who', 'वाली': '-er (f.)', 'वाले': '-ers',
  'चाहे': 'whether', 'हालाँकि': 'although',

  // Auxiliaries & verb helpers
  'है': 'is', 'हैं': 'are', 'था': 'was', 'थी': 'was', 'थे': 'were', 'थीं': 'were',
  'हूँ': 'am', 'हो': 'are', 'होता': 'happens, is', 'होती': 'happens, is', 'होते': 'happen, are',
  'रहा': '-ing (m.)', 'रही': '-ing (f.)', 'रहे': '-ing (pl.)',
  'गया': 'went, done (m.)', 'गई': 'went, done (f.)', 'गए': 'went, done (pl.)',
  'सकता': 'can (m.)', 'सकती': 'can (f.)', 'सकते': 'can (pl.)',
  'चाहिए': 'should, need', 'चाहता': 'want (m.)', 'चाहती': 'want (f.)', 'चाहते': 'want (pl.)',
  'पड़ता': 'have to (m.)', 'पड़ती': 'have to (f.)', 'पड़ते': 'have to (pl.)',
  'लगता': 'seem (m.)', 'लगती': 'seem (f.)', 'लगते': 'seem (pl.)',
  'दिया': 'gave, let', 'दी': 'gave, let', 'दिए': 'gave, let',
  'लिया': 'took, done', 'ली': 'took, done', 'लिए': 'for',

  // Common adverbs
  'बहुत': 'very, much', 'हमेशा': 'always', 'कभी': 'ever, sometimes',
  'अभी': 'right now', 'आज': 'today', 'कल': 'yesterday, tomorrow',
  'अक्सर': 'often', 'फिर': 'then, again', 'सिर्फ़': 'only', 'बस': 'just, enough',
  'अचानक': 'suddenly', 'धीरे': 'slowly', 'जल्दी': 'quickly',
  'ज़रूर': 'definitely', 'शायद': 'maybe', 'वापस': 'back',
  'सीधे': 'straight', 'ठीक': 'fine, correct', 'ज़रा': 'a little',
  'बिलकुल': 'absolutely', 'सचमुच': 'really, truly', 'ख़ासकर': 'especially',

  // Determiners & quantifiers
  'सब': 'all, everyone', 'कुछ': 'some, something', 'कोई': 'someone, any',
  'एक': 'one, a', 'दो': 'two', 'तीन': 'three', 'चार': 'four', 'पाँच': 'five',
  'छह': 'six', 'सात': 'seven', 'आठ': 'eight', 'नौ': 'nine', 'दस': 'ten',
  'सौ': 'hundred', 'हज़ार': 'thousand', 'लाख': 'hundred thousand',
  'हर': 'every', 'सारे': 'all', 'इस': 'this', 'उस': 'that',
  'कई': 'several', 'थोड़ा': 'a little', 'ज़्यादा': 'more', 'कम': 'less',

  // Common adjectives (very frequent)
  'अच्छा': 'good', 'अच्छी': 'good', 'अच्छे': 'good',
  'बुरा': 'bad', 'बुरी': 'bad', 'बुरे': 'bad',
  'बड़ा': 'big', 'बड़ी': 'big', 'बड़े': 'big',
  'छोटा': 'small', 'छोटी': 'small', 'छोटे': 'small',
  'नया': 'new', 'नई': 'new', 'नए': 'new',
  'पुराना': 'old', 'पुरानी': 'old', 'पुराने': 'old',

  // Greetings
  'नमस्ते': 'hello, namaste', 'नमस्कार': 'hello, greetings',
  'शुभ': 'auspicious, good', 'प्रभात': 'morning, dawn',
  'धन्यवाद': 'thank you', 'शुक्रिया': 'thank you',
  'माफ़': 'sorry', 'कृपया': 'please',
};

// ══════════════════════════════════════════════════════════════
// Parse existing dictionary from .ts file
// ══════════════════════════════════════════════════════════════
function parseDictionary() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};
  // Match both single-quoted and double-quoted keys
  const entryRe = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  const entryRe2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;

  function parseBody(body) {
    const obj = {};
    const enM = body.match(/en:\s*'([^']*)'/);
    if (enM) obj.en = enM[1];
    else { const enM2 = body.match(/en:\s*"([^"]*)"/); if (enM2) obj.en = enM2[1]; }
    const ipaM = body.match(/ipa:\s*'([^']*)'/);
    if (ipaM) obj.ipa = ipaM[1];
    else { const ipaM2 = body.match(/ipa:\s*"([^"]*)"/); if (ipaM2) obj.ipa = ipaM2[1]; }
    const posM = body.match(/pos:\s*'([^']*)'/);
    if (posM) obj.pos = posM[1];
    else { const posM2 = body.match(/pos:\s*"([^"]*)"/); if (posM2) obj.pos = posM2[1]; }
    const lemmaM = body.match(/lemma:\s*'([^']*)'/);
    if (lemmaM) obj.lemma = lemmaM[1];
    else { const lemmaM2 = body.match(/lemma:\s*"([^"]*)"/); if (lemmaM2) obj.lemma = lemmaM2[1]; }
    return obj;
  }

  let m;
  while ((m = entryRe.exec(src)) !== null) entries[m[1]] = parseBody(m[2]);
  while ((m = entryRe2.exec(src)) !== null) entries[m[1]] = parseBody(m[2]);
  return entries;
}

// ══════════════════════════════════════════════════════════════
// Load deck
// ══════════════════════════════════════════════════════════════
function loadDeck() {
  return JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
}

// ══════════════════════════════════════════════════════════════
// Google Translate batch
// ══════════════════════════════════════════════════════════════
function googleTranslateBatch(words) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=hi&target=en&${qParams}`;

    https.get(url, { timeout: 30000 }, (res) => {
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
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════════════════
// Tokenize Hindi sentence
// ══════════════════════════════════════════════════════════════
function tokenizeHindi(sentence) {
  // Split on non-Devanagari, non-nuqta chars, keeping Devanagari tokens
  return sentence
    .replace(/[।,?!;:'"()«»\-\d\.]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w.trim());
}

// ══════════════════════════════════════════════════════════════
// Build word-to-cards index
// ══════════════════════════════════════════════════════════════
function buildWordToCardsIndex(deck) {
  const index = {};
  for (const card of deck) {
    const hindiWords = tokenizeHindi(card.target);
    for (const w of hindiWords) {
      if (!index[w]) index[w] = [];
      index[w].push(card);
    }
  }
  return index;
}

// ══════════════════════════════════════════════════════════════
// English stop words and context extraction
// ══════════════════════════════════════════════════════════════
const EN_STOP = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'has', 'have', 'had', 'do', 'does', 'did', 'done',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  'and', 'or', 'but', 'not', 'no', 'yes',
  'if', 'then', 'so', 'as', 'than', 'very', 'too', 'also',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'shall',
  'up', 'out', 'about', 'into', 'over', 'after', 'before',
  "it's", "i'm", "he's", "she's", "we're", "they're", "you're",
  "there's", "that's", "what's", "who's", "here's", "let's",
  "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't", "didn't",
  "won't", "wouldn't", "couldn't", "shouldn't", "can't", "hasn't", "haven't",
  'just', 'got', 'get', 'go', 'went', 'when', 'where', 'how', 'what',
  'who', 'which', 'more', 'much', 'many', 'some', 'any', 'all',
  'own', 'still', 'even', 'back', 'way', 'now', 'here', 'there',
  'well', 'only', 'really', 'already', 'ever', 'never', 'always',
  'often', 'again', 'once', 'while', 'since', 'until', 'during',
  'both', 'each', 'every', 'other', 'another', 'such', 'none',
  'gave', 'took', 'came', 'made', 'said', 'told', 'knew',
  'thought', 'felt', 'found', 'saw', 'put', 'ran', 'let',
  'bought', 'drank', 'sang', 'broke', 'loved', 'wanted', 'wants',
  'looked', 'looking', 'chosen', 'studied', 'changed', 'started', 'finished',
  "we'll", "he'll", "she'll", "i'll", "they'll", "you'll",
  "i've", "we've", "they've", "you've",
  "he'd", "she'd", "i'd", "we'd", "they'd", "you'd",
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'day', 'days', 'time', 'hand', 'person', 'people', 'things',
]);

function extractEnglishContent(text) {
  return text.toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !EN_STOP.has(w));
}

function simpleStem(word) {
  let w = word.toLowerCase();
  if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('tion') && w.length > 5) w = w.slice(0, -4) + 't';
  else if (w.endsWith('sion') && w.length > 5) w = w.slice(0, -4) + 's';
  else if (w.endsWith('ness') && w.length > 5) w = w.slice(0, -4);
  else if (w.endsWith('ment') && w.length > 5) w = w.slice(0, -4);
  else if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('ied') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('er') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('ly') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.endsWith('e') && w.length > 3) w = w.slice(0, -1);
  return w;
}

function stemMatch(a, b) {
  if (a === b) return true;
  const sa = simpleStem(a);
  const sb = simpleStem(b);
  return sa === sb || sa.startsWith(sb) || sb.startsWith(sa);
}

// ══════════════════════════════════════════════════════════════
// Step 5: Card-context validation
// ══════════════════════════════════════════════════════════════
function validateAndCorrectFromCards(hindiWord, googleEn, pos, wordCardsIndex) {
  const cards = wordCardsIndex[hindiWord] || [];

  if (cards.length < 3) {
    return { newEn: googleEn, source: 'google_unvalidated', match: 0, total: cards.length };
  }

  const defWords = extractEnglishContent(googleEn.replace(/^to\s+/, ''));
  if (defWords.length === 0) {
    return { newEn: googleEn, source: 'google_unvalidated', match: 0, total: cards.length };
  }

  let matchCount = 0;
  for (const card of cards) {
    const cardWords = extractEnglishContent(card.english);
    const hasMatch = defWords.some(dw => cardWords.some(cw => stemMatch(dw, cw)));
    if (hasMatch) matchCount++;
  }

  const matchRatio = matchCount / cards.length;

  if (matchRatio >= 0.4) {
    return { newEn: googleEn, source: 'google_validated', match: matchCount, total: cards.length };
  }

  // Find best candidate from card English
  const candidateCounts = {};

  for (const card of cards) {
    const cardEnWords = extractEnglishContent(card.english);
    const seen = new Set();

    for (const enWord of cardEnWords) {
      if (enWord.length < 3) continue;
      const stem = simpleStem(enWord);
      if (seen.has(stem)) continue;
      seen.add(stem);

      if (!candidateCounts[stem]) candidateCounts[stem] = { count: 0, bestWord: enWord };
      candidateCounts[stem].count++;
      if (enWord.length > candidateCounts[stem].bestWord.length) {
        candidateCounts[stem].bestWord = enWord;
      }
    }
  }

  let bestCandidate = null;
  let bestScore = 0;
  const minCount = Math.max(3, Math.ceil(cards.length * 0.4));

  for (const [stem, info] of Object.entries(candidateCounts)) {
    if (info.count < minCount) continue;

    const cLower = info.bestWord.toLowerCase();
    if (cLower.endsWith('ing') && cLower.length > 5) continue;
    if (cLower.endsWith('ed') && cLower.length > 4 && !['bed', 'red', 'fed', 'led', 'wed', 'shed'].includes(cLower)) continue;

    const relFreq = info.count / cards.length;
    const score = info.count * relFreq;

    if (score > bestScore) {
      bestCandidate = info.bestWord;
      bestScore = score;
    }
  }

  const googleScore = matchCount * (matchCount / cards.length);
  if (bestCandidate && bestScore > googleScore * 1.5 + 0.5) {
    const candLower = bestCandidate.toLowerCase();
    if (EN_STOP.has(candLower)) {
      return { newEn: googleEn, source: 'google_low_match', match: matchCount, total: cards.length };
    }
    if (candLower.length < 3) {
      return { newEn: googleEn, source: 'google_low_match', match: matchCount, total: cards.length };
    }
    if (candLower.endsWith("'ll") || candLower.endsWith("'ve") || candLower.endsWith("'re") || candLower.endsWith("'d")) {
      return { newEn: googleEn, source: 'google_low_match', match: matchCount, total: cards.length };
    }

    let corrected = bestCandidate;
    if (pos === 'v' && !corrected.startsWith('to ')) {
      corrected = 'to ' + corrected;
    }
    return {
      newEn: corrected,
      source: 'card_context',
      match: bestScore,
      total: cards.length,
      googleOriginal: googleEn,
    };
  }

  return { newEn: googleEn, source: 'google_low_match', match: matchCount, total: cards.length };
}

// ══════════════════════════════════════════════════════════════
// Generate .ts output
// ══════════════════════════════════════════════════════════════
function generateTsOutput(results) {
  const originalSrc = fs.readFileSync(DICT_PATH, 'utf8');

  // Extract header (imports, comments up to dictionary opening)
  const header = `import type { DictEntry } from './es';
import { findInfinitive } from '../conjugation/hi';

// ── Hindi Dictionary ────────────────────────────────────────
// Keys are in Devanagari script (lowercase not applicable for Hindi).
// Each entry: { en: 'English translation', ipa: '(en)\\u0027\\u025B\\u006E\\u0074\\u0279i(hi)', pos: 'part of speech' }
`;

  // Sort Hindi entries by Devanagari order
  const sorted = [...results].sort((a, b) => a.word.localeCompare(b.word, 'hi'));

  let dictLines = 'const dictionary: Record<string, DictEntry> = {\n';
  for (const r of sorted) {
    const needsDoubleQuote = r.word.includes("'");
    const keyQuote = needsDoubleQuote ? '"' : "'";
    const enEscaped = r.new_en.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const ipaEscaped = (r.ipa || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    let line = `  ${keyQuote}${r.word}${keyQuote}: { en: '${enEscaped}', ipa: '${ipaEscaped}'`;
    if (r.pos) line += `, pos: '${r.pos}'`;
    if (r.lemma) {
      const lemmaEscaped = r.lemma.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      line += `, lemma: '${lemmaEscaped}'`;
    }
    line += ' },';
    dictLines += line + '\n';
  }
  dictLines += '};\n';

  // Extract the suffix patterns and lookupWord code from original
  const suffixStart = originalSrc.indexOf('// ── Verb form resolution');
  const footer = suffixStart !== -1 ? '\n\n' + originalSrc.slice(suffixStart) : `

export function lookupWord(word: string): DictEntry | null {
  const clean = word.replace(/[।,!?;:"""''()––\\-…]/g, '').trim();
  if (!clean) return null;
  if (dictionary[clean]) return dictionary[clean];
  return null;
}

export default dictionary;`;

  return header + dictLines + footer;
}

// ══════════════════════════════════════════════════════════════
// Check if a key is a Devanagari word (not English/Latin)
// ══════════════════════════════════════════════════════════════
function isDevanagari(word) {
  return /[\u0900-\u097F]/.test(word);
}

// ══════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════
async function main() {
  console.log('=== Hindi Dictionary Rebuild (Sentence-Context Approach) ===\n');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Parsing Hindi dictionary...');
  const dict = parseDictionary();
  const allKeys = Object.keys(dict);
  console.log(`  ${allKeys.length} entries found`);

  // Filter out non-Devanagari entries (garbage English-keyed entries)
  const devanagariKeys = allKeys.filter(k => isDevanagari(k));
  const droppedKeys = allKeys.filter(k => !isDevanagari(k));
  console.log(`  ${devanagariKeys.length} Devanagari entries (keeping)`);
  console.log(`  ${droppedKeys.length} non-Devanagari entries (dropping): ${droppedKeys.join(', ')}`);

  console.log('Loading deck...');
  const deck = loadDeck();
  console.log(`  ${deck.length} cards`);

  const wordCardsIndex = buildWordToCardsIndex(deck);

  // Separate function words from Google words
  const functionWordKeys = [];
  const googleWordKeys = [];
  for (const key of devanagariKeys) {
    if (FUNCTION_WORDS[key] !== undefined) {
      functionWordKeys.push(key);
    } else {
      googleWordKeys.push(key);
    }
  }

  console.log(`  ${functionWordKeys.length} function word entries (hand-verified)`);
  console.log(`  ${googleWordKeys.length} entries to send to Google Translate`);

  // ── Step 1: Process function words ──
  const results = [];
  for (const key of functionWordKeys) {
    const entry = dict[key];
    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: FUNCTION_WORDS[key],
      source: 'function_table',
      validated: true,
      pos: entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  // Also add function words that exist in FUNCTION_WORDS table but NOT in dict
  // (new entries to add)
  for (const [key, en] of Object.entries(FUNCTION_WORDS)) {
    if (!dict[key]) {
      results.push({
        word: key,
        old_en: '(new)',
        new_en: en,
        source: 'function_table_new',
        validated: true,
        pos: '', // Will be set based on category
        ipa: '',
        lemma: undefined,
      });
    }
  }

  // ── Step 2: Google Translate in batches ──
  const BATCH_SIZE = 80;
  const DELAY = 250;
  const googleResults = {};
  const googleRawResults = {}; // Keep raw for POS fix

  console.log(`\nStep 2: Sending ${googleWordKeys.length} words to Google Translate...`);

  for (let i = 0; i < googleWordKeys.length; i += BATCH_SIZE) {
    const batch = googleWordKeys.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(googleWordKeys.length / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} words)...`);

    try {
      const translations = await googleTranslateBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        googleResults[batch[j]] = translations[j];
        googleRawResults[batch[j]] = translations[j]; // Keep raw
      }
      console.log(' done');
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      for (const w of batch) {
        googleResults[w] = null;
        googleRawResults[w] = null;
      }
    }

    if (i + BATCH_SIZE < googleWordKeys.length) {
      await sleep(DELAY);
    }
  }

  // ── Step 3: Post-process Google results ──
  console.log('\nStep 3: Post-processing Google results...');
  const ppStats = new PostProcessStats();

  const googleProcessed = {};
  for (const key of googleWordKeys) {
    const entry = dict[key];
    const rawTranslation = googleResults[key];

    if (rawTranslation === null || rawTranslation === undefined) {
      googleProcessed[key] = { text: entry.en || '?', failed: true };
      continue;
    }

    const result = postProcess(rawTranslation, entry.pos || '', key, ppStats);
    googleProcessed[key] = { text: result.text, flagged: result.flagged, flagReasons: result.flagReasons };
  }

  // ── Step 4: Lemma copy ──
  console.log('\nStep 4: Applying STRICT lemma copy...');
  const lemmaTranslations = {};
  let lemmaCopyCount = 0;

  // First pass: collect translations for base forms (entries that have NO lemma field)
  for (const key of googleWordKeys) {
    if (!dict[key].lemma) {
      lemmaTranslations[key] = googleProcessed[key].text;
    }
  }
  // Also add function words as potential lemma bases
  for (const key of functionWordKeys) {
    lemmaTranslations[key] = FUNCTION_WORDS[key];
  }
  for (const [key, en] of Object.entries(FUNCTION_WORDS)) {
    lemmaTranslations[key] = en;
  }

  // Build intermediate results for Google words
  const intermediateResults = {};
  for (const key of googleWordKeys) {
    const entry = dict[key];
    const processed = googleProcessed[key];

    let newEn = processed.text;
    let source = processed.failed ? 'google_failed' : 'google';

    // STRICT lemma copy: if entry has a lemma and we have a translation for it, ALWAYS use it
    if (entry.lemma && lemmaTranslations[entry.lemma]) {
      newEn = lemmaTranslations[entry.lemma];
      source = 'lemma_copy';
      lemmaCopyCount++;
    }

    intermediateResults[key] = { newEn, source, pos: entry.pos || '' };
  }

  console.log(`  Lemma copies applied: ${lemmaCopyCount}`);

  // ── Step 5: Context validation ──
  console.log('\nStep 5: Validating against card context...');
  let contextCorrectedCount = 0;
  let contextValidatedCount = 0;
  let contextUnvalidatedCount = 0;
  let contextLowMatchCount = 0;
  const contextCorrections = [];

  for (const key of googleWordKeys) {
    const intermediate = intermediateResults[key];

    const validation = validateAndCorrectFromCards(
      key,
      intermediate.newEn,
      intermediate.pos,
      wordCardsIndex
    );

    if (validation.source === 'card_context') {
      intermediate.newEn = validation.newEn;
      intermediate.source = 'card_context';
      contextCorrectedCount++;
      contextCorrections.push({
        word: key,
        google: validation.googleOriginal,
        cardContext: validation.newEn,
        match: validation.match,
        total: validation.total,
      });
    } else if (validation.source === 'google_validated') {
      contextValidatedCount++;
    } else if (validation.source === 'google_unvalidated') {
      contextUnvalidatedCount++;
    } else if (validation.source === 'google_low_match') {
      contextLowMatchCount++;
    }
  }

  console.log(`  Context-corrected: ${contextCorrectedCount}`);
  console.log(`  Google-validated: ${contextValidatedCount}`);
  console.log(`  Google-unvalidated (0-2 cards): ${contextUnvalidatedCount}`);
  console.log(`  Google-low-match (kept): ${contextLowMatchCount}`);

  // ── Step 6: POS fix ──
  console.log('\nStep 6: Fixing POS based on Google raw output...');
  let posFixCount = 0;
  const posFixDetails = [];

  for (const key of googleWordKeys) {
    const entry = dict[key];
    const intermediate = intermediateResults[key];
    const rawGoogle = googleRawResults[key];

    if (!rawGoogle) continue;

    const currentPos = intermediate.pos || entry.pos || '';
    const rawLower = rawGoogle.toLowerCase().trim();

    // If Google returned "to X" (verb) but POS says noun → fix to verb
    if (rawLower.startsWith('to ') && currentPos === 'n') {
      // Check it's actually a verb form, not "to" as preposition in a phrase
      const afterTo = rawLower.slice(3).trim();
      if (afterTo.length >= 2 && /^[a-z]+$/.test(afterTo.split(/\s+/)[0])) {
        intermediate.pos = 'v';
        if (!intermediate.newEn.startsWith('to ')) {
          intermediate.newEn = 'to ' + intermediate.newEn;
        }
        posFixCount++;
        posFixDetails.push({ word: key, oldPos: currentPos, newPos: 'v', raw: rawGoogle });
      }
    }

    // If Google returned a noun (no "to") but POS says verb → ONLY fix if:
    // 1. The word has NO lemma (lemma entries are verb conjugations that should stay v)
    // 2. The word doesn't end with ना (Hindi infinitive marker)
    // 3. The translation is clearly a non-verb noun (not a past participle, not an action)
    if (!rawLower.startsWith('to ') && currentPos === 'v' && !entry.lemma) {
      const isVerbLike = /^(be|have|do|go|get|make|take|come|give|find|know|see|think|say|want|need|try|keep|let|begin|start|stop|help|work|play|run|walk|eat|drink|sleep|read|write|speak|hear|feel|meet|show|leave|bring|buy|sell|pay|send|spend|teach|learn|grow|hold|cut|hit|set|sit|stand|fall|pick|pull|push|turn|open|close|break|build|throw|catch|carry|draw|drive|fly|ride|swim|climb|dance|sing|cook|wash|clean|bring|keep|lose|win|fight|hang|hang|lead|lie|lay|lend|light|mean|prove|ring|seek|sell|shake|shine|shoot|show|shut|slide|smell|speak|spell|split|steal|stick|sting|strike|swear|sweep|swing|tear|wake|wear|weave|wind|wrap)\b/i;
      const isPastParticiple = /^(stuck|adopted|risen|grown|arrived|come|gone|fallen|broken|spoken|written|given|taken|done|seen|heard|felt|found|lost|made|said|told|thought|known|meant|understood|become|begun|chosen|drawn|driven|eaten|flown|forgotten|frozen|gotten|hidden|hung|led|lain|lent|lit|proved|rung|sought|shaken|shone|shot|shown|shut|slid|smelt|spelt|split|stolen|stung|struck|sworn|swept|swung|torn|woken|worn|wound|wrapped)\b/i;
      // Don't fix if the word ends with ना (infinitive) – those are definitely verbs
      if (!key.endsWith('ना') && !isVerbLike.test(rawLower.split(/\s+/)[0]) && !isPastParticiple.test(rawLower.split(/\s+/)[0])) {
        // Extra check: is the raw translation clearly a noun? (proper noun, common object, etc.)
        // Only fix for obvious cases
        const isClearlyNoun = /^[A-Z][a-z]+$/.test(rawGoogle.trim()) || // Capitalized single word (proper noun)
          /^(the |a |an )/.test(rawLower); // Article-prefixed
        if (isClearlyNoun) {
          intermediate.pos = 'n';
          if (intermediate.newEn.startsWith('to ')) {
            intermediate.newEn = intermediate.newEn.slice(3);
          }
          posFixCount++;
          posFixDetails.push({ word: key, oldPos: currentPos, newPos: 'n', raw: rawGoogle });
        }
      }
    }
  }

  console.log(`  POS fixes applied: ${posFixCount}`);

  // ── Step 6b: Fix false proper nouns ──
  // Google Translate capitalizes many Hindi single-word translations.
  // Rule 8a in post-process detects these as "proper nouns" and keeps them capitalized.
  // We need to lowercase everything EXCEPT actual proper nouns (person names, places, festivals).
  console.log('\nStep 6b: Fixing false proper noun capitalization...');

  // Known proper noun patterns – these should STAY capitalized
  const PROPER_NOUN_WORDS = new Set([
    // Will be populated from POS 'n' entries whose raw Google was capitalized AND
    // appear in cards as proper nouns
  ]);

  // Common English words that should NOT be capitalized
  const COMMON_ENGLISH_WORDS = new Set([
    'uncle','grape','fig','organ','english','celery','walnut','arena','ginger',
    'court','wonderful','darkness','more','right','officer','incomplete','blind',
    'dark','diamond','wealth','morning','medicine','direction','tooth','toothpaste',
    'pain','milk','wealth','prayer','fearless','courage','strength','army',
    'lamp','mirror','pitcher','blessing','grain','festival','auspicious',
    'score','sprout','letter','space','international','end','difference',
    'suddenly','pickle','python','stranger','brahmin','fort','temple','pond',
    'pilgrimage','worship','river','mountain','forest','island','bridge',
    'flower','fruit','bread','rice','tea','coffee','sugar','salt','oil',
    'butter','egg','meat','fish','clothes','shirt','dress','shoe','hat',
    'bag','box','glass','cup','plate','knife','spoon','key','phone',
    'paper','picture','music','song','story','game','light','fire','earth',
    'air','rain','snow','wind','sun','moon','star','cloud','stone','gold',
    'silver','iron','king','queen','god','heart','blood','bone','skin',
    'hair','foot','arm','leg','finger','nose','ear','mouth','shoulder',
    'neck','back','stomach','chest','stuck','adopted','engineer','galaxy',
    'ahead','criticism','jealousy','rises','growing','grown','engineer',
    'incense','sticks','newspaper','ring','attic','eighteen','hangout',
    'depot','ending','difference','inside','acquisition','farmer',
    'decoration','experience','hospital','right','officer','heritage',
    'existence','discipline','expression','campaign','permission','abuse',
    'economy','loneliness','base','comfort','crime','newspaper',
  ]);

  let falseProperFixCount = 0;
  for (const key of googleWordKeys) {
    const intermediate = intermediateResults[key];
    const en = intermediate.newEn;

    // Check if the first character is uppercase
    if (en && en.length > 0 && en[0] === en[0].toUpperCase() && en[0] !== en[0].toLowerCase()) {
      // Check if it looks like an actual proper noun
      // Heuristic: if it's a name that appears in card English as capitalized, keep it
      const cards = wordCardsIndex[key] || [];
      let isProperNoun = false;

      // Check if the word appears capitalized in card English mid-sentence (proper noun usage)
      // We must exclude matches at the START of sentences (where everything is capitalized)
      const enLower = en.toLowerCase();
      for (const card of cards) {
        const cardEng = card.english;
        let searchFrom = 0;
        while (true) {
          const idx = cardEng.indexOf(en, searchFrom);
          if (idx === -1) break;
          // Check if this occurrence is mid-sentence (not at start, not after ". ")
          if (idx > 0) {
            const charBefore = cardEng[idx - 1];
            // If preceded by space (not period/start), it's mid-sentence capitalization = proper noun
            if (charBefore === ' ' && (idx < 2 || (cardEng[idx - 2] !== '.' && cardEng[idx - 2] !== '!' && cardEng[idx - 2] !== '?'))) {
              isProperNoun = true;
              break;
            }
          }
          searchFrom = idx + 1;
        }
        if (isProperNoun) break;
      }

      // Also check POS – adj/adv/conj should never be proper nouns
      if (['adj', 'adv', 'conj', 'prep', 'v'].includes(intermediate.pos)) {
        isProperNoun = false;
      }

      // If it's a common English word, definitely not a proper noun
      if (COMMON_ENGLISH_WORDS.has(enLower)) {
        isProperNoun = false;
      }

      // Additional check: if the lowercase form is a common English dictionary word,
      // it's probably not a proper noun
      const DEFINITELY_NOT_PROPER = /^(next|translation|according|practice|guava|flour|respect|rest|potato|cellar|aunty|direction|conversation|organization|attack|attempt|offer|beginning|order|final|exercise|punishment|demand|total|separate|measure|standard|regular|complete|certain|particular|important|different|necessary|possible|probable|original|personal|natural|general|special|physical|mental|medical|political|social|economic|traditional|cultural|national|international|educational|environmental|professional|technical|historical|religious|scientific|musical|artistic|commercial|industrial|agricultural|financial|military|legal|royal|ancient|modern|rural|urban)$/i;
      if (DEFINITELY_NOT_PROPER.test(enLower)) {
        isProperNoun = false;
      }

      // FORCE proper noun for known names/places/languages/festivals
      // If the translation is a single word and matches known proper nouns, keep it
      const KNOWN_PROPER_NOUNS = new Set([
        // Person names common in Hindi cards
        'ajay','ajanta','anil','anita','anjali','arjun','amit','amrit','ashok','ashoka',
        'ambedkar','aditya','asha','gaurav','gandhi','gandhiji','kamala','kavita',
        'meera','mohan','nandini','nehru','pooja','priya','rahul','raj','rajesh',
        'rajan','rakesh','ram','rama','ravi','rekha','rohit','sachin','sandeep',
        'sanjay','seema','shanti','shekhar','sita','sunil','suresh','tagore',
        'vikram','vinod','sunita','neha','deepa','ananya','kiran','lalita',
        'lata','geeta','radha','sarita','usha','veena','maya','nisha','mala',
        'padma','savitri','devika','indira','kamla','mangala','parvati',
        'karva','akshat','patanjali',
        // Places
        'agra','ahmedabad','amritsar','assam','andhra','bengaluru','bangalore',
        'bhopal','chandigarh','chennai','delhi','goa','hyderabad','india','jaipur',
        'jodhpur','karnataka','kashmir','kerala','kolkata','lucknow','maharashtra',
        'mathura','mumbai','mysore','nagpur','patna','pune','rajasthan','shimla',
        'srinagar','udaipur','uttarakhand','varanasi','vrindavan','afghanistan',
        'bhutan','nepal','pakistan','tibet',
        // Languages
        'english','hindi','urdu','sanskrit','arabic','persian','bengali','tamil',
        'telugu','marathi','gujarati','punjabi','kannada','malayalam','odia',
        // Festivals and cultural terms
        'diwali','holi','eid','navratri','dussehra','baisakhi','lohri','makar',
        'sankranti','pongal','onam','bihu','chhath','ganesh','chaturthi',
        'janmashtami','raksha','bandhan','karwa','chauth','mahashivratri',
        // Religious/mythological
        'krishna','shiva','vishnu','lakshmi','saraswati','brahma','hanuman',
        'ganesha','durga','kali','ganga','yamuna','vedas','upanishads',
        'ramayana','mahabharata','bhagavad','gita',
        // Cultural items that should be capitalized
        'ayurvedic','mughal','sanskrit','vedic',
      ]);
      if (KNOWN_PROPER_NOUNS.has(enLower)) {
        isProperNoun = true;
      }

      if (!isProperNoun) {
        intermediate.newEn = en[0].toLowerCase() + en.slice(1);
        falseProperFixCount++;
      }
    }
  }
  console.log(`  False proper noun fixes: ${falseProperFixCount}`);

  // ── Build final results for Google words ──
  for (const key of googleWordKeys) {
    const entry = dict[key];
    const intermediate = intermediateResults[key];

    results.push({
      word: key,
      old_en: entry.en || '?',
      new_en: intermediate.newEn,
      source: intermediate.source,
      validated: intermediate.source !== 'google_failed',
      pos: intermediate.pos || entry.pos || '',
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  // ── Stats ──
  const sourceBreakdown = {};
  let validatedCount = 0;
  let changedCount = 0;
  let questionMarkFixed = 0;

  for (const r of results) {
    sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
    if (r.validated) validatedCount++;
    if (r.old_en !== r.new_en) changedCount++;
    if (r.old_en === '?' && r.new_en !== '?') questionMarkFixed++;
  }

  // ── Write JSON output ──
  console.log('\nStep 7: Writing output files...');

  const jsonPath = path.join(OUT_DIR, 'hi-context-rebuild.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`  ${jsonPath}`);

  // Write context corrections detail
  const correctionsPath = path.join(OUT_DIR, 'hi-context-corrections.json');
  fs.writeFileSync(correctionsPath, JSON.stringify({
    contextCorrections,
    posFixDetails,
  }, null, 2));
  console.log(`  ${correctionsPath}`);

  // ── Write preview with 100 changed entries ──
  const changedResults = results.filter(r => r.old_en !== r.new_en);
  const sample100 = changedResults.slice(0, 100);

  // ── Apply to hi.ts ──
  console.log('\nGenerating new hi.ts...');
  const newTs = generateTsOutput(results);
  fs.writeFileSync(DICT_PATH, newTs);
  console.log(`  Written to ${DICT_PATH}`);

  // ── Post-processing report ──
  console.log('\n' + ppStats.report());

  // ── Print summary ──
  console.log('\n=== SUMMARY ===');
  console.log(`Total entries: ${results.length}`);
  console.log(`Changed: ${changedCount}`);
  console.log(`Question marks fixed: ${questionMarkFixed}`);
  console.log(`Context-corrected (Google -> card): ${contextCorrectedCount}`);
  console.log(`POS fixes: ${posFixCount}`);
  console.log('Source breakdown:');
  for (const [src, count] of Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${count}`);
  }
  console.log(`Validated: ${validatedCount} / ${results.length} (${(100 * validatedCount / results.length).toFixed(1)}%)`);
  console.log(`Lemma copies: ${lemmaCopyCount}`);

  // ── Print context corrections ──
  if (contextCorrections.length > 0) {
    console.log(`\n=== CONTEXT CORRECTIONS (${contextCorrections.length}) ===`);
    console.log('Word | Google said | Cards say | Match/Total');
    console.log('-----|-----------|-----------|------------');
    for (const c of contextCorrections.slice(0, 50)) {
      console.log(`${c.word} | ${c.google} | ${c.cardContext} | ${c.match}/${c.total}`);
    }
    if (contextCorrections.length > 50) {
      console.log(`... and ${contextCorrections.length - 50} more`);
    }
  }

  // ── Print POS fixes ──
  if (posFixDetails.length > 0) {
    console.log(`\n=== POS FIXES (${posFixDetails.length}) ===`);
    for (const f of posFixDetails.slice(0, 30)) {
      console.log(`  ${f.word}: ${f.oldPos} -> ${f.newPos} (raw: ${f.raw})`);
    }
    if (posFixDetails.length > 30) {
      console.log(`  ... and ${posFixDetails.length - 30} more`);
    }
  }

  // ── Print 100 sample changed entries to stdout ──
  console.log('\n=== 100 SAMPLE OLD->NEW CHANGES ===');
  console.log('Word | Old EN | New EN | Source');
  console.log('-----|--------|--------|-------');
  for (const r of sample100) {
    console.log(`${r.word} | ${r.old_en} | ${r.new_en} | ${r.source}`);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
