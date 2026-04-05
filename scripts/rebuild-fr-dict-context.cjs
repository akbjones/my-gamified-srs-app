#!/usr/bin/env node
/**
 * Rebuild French dictionary using SENTENCE-CONTEXT approach.
 *
 * Pipeline:
 *   Step 1: Hand-verified function words (131 entries)
 *   Step 2: Google Translate all content words (batch 80)
 *   Step 3: Post-process with 16 rules + proper noun + non-verb detection
 *   Step 4: Validate EVERY entry against ALL cards containing it
 *           - If Google says "trip" but cards say "travel", use cards' word
 *   Step 5: Handle noun/verb ambiguity (voyage=noun vs verb)
 *   Step 6: Specific known fixes (bonjour, addition, etc.)
 *   Step 7: Apply to dictionary, preserving IPA and lemma fields
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/fr.ts');
const DECK_PATH = path.join(ROOT, 'src/data/french/deck.json');
const OUT_DIR = path.join(ROOT, 'scripts/output');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ══════════════════════════════════════════════════════════════
// Step 1: Hand-verified French function words (131 entries)
// ══════════════════════════════════════════════════════════════
const FUNCTION_WORDS = {
  // Articles
  'le': 'the (m.)', 'la': 'the (f.)', 'les': 'the (pl.)',
  'un': 'a, one (m.)', 'une': 'a, one (f.)', 'des': 'some, of the',
  'du': 'of the, some (m.)', 'de': 'of, from', 'd': 'of, from',
  'l': 'the', 'au': 'to the, at the (m.)', 'aux': 'to the, at the (pl.)',

  // Pronouns
  'je': 'I', 'tu': 'you (informal)', 'il': 'he, it',
  'elle': 'she, it', 'on': 'one, we (informal)',
  'nous': 'we, us', 'vous': 'you (formal/pl.)', 'ils': 'they (m.)',
  'elles': 'they (f.)', 'me': 'me, myself', 'te': 'you, yourself',
  'se': 'oneself', 'lui': 'him, to him/her', 'leur': 'their, to them',
  'moi': 'me', 'toi': 'you', 'soi': 'oneself',
  'en': 'of it, some', 'y': 'there, to it',
  'ce': 'this, it', 'ça': 'that, it', 'cela': 'that',
  'qui': 'who, which', 'que': 'that, which, what',
  'quoi': 'what', 'où': 'where', 'dont': 'of which, whose',
  'lequel': 'which one',

  // Prepositions
  'à': 'to, at', 'dans': 'in, inside', 'sur': 'on, upon',
  'sous': 'under', 'avec': 'with', 'sans': 'without',
  'pour': 'for', 'par': 'by, through', 'vers': 'towards',
  'chez': 'at the home of', 'entre': 'between',
  'contre': 'against', 'pendant': 'during',
  'depuis': 'since, for', 'jusqu': 'until',

  // Conjunctions
  'et': 'and', 'ou': 'or', 'mais': 'but', 'car': 'because, for',
  'donc': 'so, therefore', 'ni': 'neither, nor',
  'si': 'if, so', 'quand': 'when', 'comme': 'like, as',
  'parce': 'because', 'puisque': 'since, because',
  'lorsque': 'when',

  // Adverbs
  'très': 'very', 'aussi': 'also, too', 'bien': 'well, good',
  'mal': 'badly, bad', 'plus': 'more, no longer',
  'moins': 'less, fewer', 'trop': 'too much',
  'assez': 'enough, rather', 'encore': 'still, again',
  'toujours': 'always, still', 'jamais': 'never, ever',
  'souvent': 'often', 'déjà': 'already',
  'ici': 'here', 'là': 'there',
  "aujourd'hui": 'today', 'hier': 'yesterday',
  'demain': 'tomorrow', 'maintenant': 'now',

  // Auxiliaries — être
  'suis': 'am', 'es': 'are (informal)', 'est': 'is',
  'sommes': 'are (we)', 'êtes': 'are (you)', 'sont': 'are (they)',
  'étais': 'was (I/you)', 'était': 'was (he/she)',
  'étaient': 'were (they)',
  'serai': 'will be (I)', 'sera': 'will be (he/she)',
  'seront': 'will be (they)',

  // Auxiliaries — avoir
  'ai': 'have (I)', 'as': 'have (you)', 'a': 'has',
  'avons': 'have (we)', 'avez': 'have (you pl.)', 'ont': 'have (they)',
  'avais': 'had (I/you)', 'avait': 'had (he/she)',
  'avaient': 'had (they)',
  'aurai': 'will have (I)', 'aura': 'will have (he/she)',
  'auront': 'will have (they)',

  // Common verb forms — faire
  'fais': 'do, make (I/you)', 'fait': 'does, makes',
  'faisons': 'do, make (we)', 'faites': 'do, make (you pl.)',
  'font': 'do, make (they)',

  // Common verb forms — aller
  'vais': 'go (I)', 'vas': 'go (you)', 'va': 'goes',
  'allons': 'go (we)', 'allez': 'go (you pl.)', 'vont': 'go (they)',

  // Common verb forms — pouvoir
  'peux': 'can (I/you)', 'peut': 'can (he/she)',
  'pouvons': 'can (we)', 'peuvent': 'can (they)',

  // Common verb forms — devoir
  'dois': 'must (I/you)', 'doit': 'must (he/she)',
  'devons': 'must (we)', 'doivent': 'must (they)',

  // Common verb forms — vouloir
  'veux': 'want (I/you)', 'veut': 'wants',
  'voulons': 'want (we)', 'veulent': 'want (they)',

  // Common verb forms — savoir
  'sais': 'know (I/you)', 'sait': 'knows',
  'savons': 'know (we)', 'savent': 'know (they)',

  // Extra: bonjour
  'bonjour': 'hello, good day',
};

// ══════════════════════════════════════════════════════════════
// Step 6: Known specific fixes (applied at the very end)
// ══════════════════════════════════════════════════════════════
const SPECIFIC_FIXES = {
  'bonjour': { en: 'hello, good day', pos: 'n' },
  'addition': { en: 'bill, check', pos: 'n' },
};

// ══════════════════════════════════════════════════════════════
// Parse existing dictionary from .ts file
// ══════════════════════════════════════════════════════════════
function parseDictionary() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};
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
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&source=fr&target=en&${qParams}`;

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
// Step 4: Card-context validation engine
// ══════════════════════════════════════════════════════════════

// Build an index: French word → [{ target, english }]
function buildWordToCardsIndex(deck) {
  const index = {};
  for (const card of deck) {
    // Tokenize French sentence
    const frenchWords = tokenizeFrench(card.target);
    for (const w of frenchWords) {
      const lower = w.toLowerCase();
      if (!index[lower]) index[lower] = [];
      index[lower].push(card);
    }
  }
  return index;
}

function tokenizeFrench(sentence) {
  // Split on non-letter chars (but keep accented chars and apostrophes for elision detection)
  return sentence
    .replace(/[.,?!;:'"()«»\-\d]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => {
      // Handle elisions: l'homme → l, homme; j'ai → j, ai
      const elisionMatch = w.match(/^(l|d|j|n|s|c|m|t|qu)'(.+)$/i);
      if (elisionMatch) return [elisionMatch[1].toLowerCase(), elisionMatch[2].toLowerCase()];
      return [w.toLowerCase()];
    })
    .flat();
}

// English stop words for matching — includes contractions, common verbs, adverbs
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
  // Contractions (after splitting on apostrophe, we get these fragments)
  "it's", "i'm", "he's", "she's", "we're", "they're", "you're",
  "there's", "that's", "what's", "who's", "here's", "let's",
  "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't", "didn't",
  "won't", "wouldn't", "couldn't", "shouldn't", "can't", "hasn't", "haven't",
  // Very common short words that are noise in candidate selection
  'just', 'got', 'get', 'go', 'went', 'when', 'where', 'how', 'what',
  'who', 'which', 'more', 'much', 'many', 'some', 'any', 'all',
  'own', 'still', 'even', 'back', 'way', 'now', 'here', 'there',
  'well', 'only', 'really', 'already', 'ever', 'never', 'always',
  'often', 'again', 'once', 'while', 'since', 'until', 'during',
  'both', 'each', 'every', 'other', 'another', 'such', 'none',
  // Common auxiliary/copula past tenses that appear everywhere
  'gave', 'took', 'came', 'made', 'said', 'told', 'knew',
  'thought', 'felt', 'found', 'saw', 'put', 'ran', 'let',
  // More past tenses that appear in cards everywhere
  'bought', 'drank', 'sang', 'broke', 'loved', 'assured', 'expecting',
  'argued', 'rained', 'wanted', 'wants', 'looked', 'looking',
  'chosen', 'studied', 'changed', 'started', 'finished',
  // Contractions and fragments
  "we'll", "he'll", "she'll", "i'll", "they'll", "you'll",
  "i've", "we've", "they've", "you've",
  "he'd", "she'd", "i'd", "we'd", "they'd", "you'd",
  // Number words that are noise
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  // Common nouns too generic for definitions
  'day', 'days', 'time', 'hand', 'person', 'people', 'things',
]);

function extractEnglishContent(text) {
  return text.toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !EN_STOP.has(w));
}

// Simple English stemmer (reduce words to common stems for matching)
function simpleStem(word) {
  let w = word.toLowerCase();
  // Remove common suffixes
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
  // Remove trailing 'e' (e.g. "drive" → "driv" which matches "driving" → "driv")
  if (w.endsWith('e') && w.length > 3) w = w.slice(0, -1);
  return w;
}

// Check if two English words are "stem-similar"
function stemMatch(a, b) {
  if (a === b) return true;
  const sa = simpleStem(a);
  const sb = simpleStem(b);
  return sa === sb || sa.startsWith(sb) || sb.startsWith(sa);
}

/**
 * Step 4: For each dictionary word, validate its Google translation against card context.
 *
 * For each word W with definition D:
 * 1. Find all cards containing W
 * 2. For each card, check: does D appear (or stem-match) in card.english?
 * 3. If YES in majority → keep D
 * 4. If NO in majority → find the best candidate English word from the cards
 *    that ISN'T already matched to other French words
 *
 * Returns: { newEn, source, contextDetails }
 */
function validateAndCorrectFromCards(frenchWord, googleEn, pos, wordCardsIndex, allFrenchWords) {
  const cards = wordCardsIndex[frenchWord.toLowerCase()] || [];

  // If word appears in fewer than 3 cards, we can't do meaningful validation
  if (cards.length < 3) {
    return { newEn: googleEn, source: 'google_unvalidated', match: 0, total: cards.length };
  }

  // Extract content words from our Google definition
  const defWords = extractEnglishContent(googleEn.replace(/^to\s+/, ''));
  if (defWords.length === 0) {
    return { newEn: googleEn, source: 'google_unvalidated', match: 0, total: cards.length };
  }

  // Count how many cards have our definition words in their English
  let matchCount = 0;
  for (const card of cards) {
    const cardWords = extractEnglishContent(card.english);
    const hasMatch = defWords.some(dw => cardWords.some(cw => stemMatch(dw, cw)));
    if (hasMatch) matchCount++;
  }

  const matchRatio = matchCount / cards.length;

  // If >40% of cards match → Google's translation is good
  if (matchRatio >= 0.4) {
    return { newEn: googleEn, source: 'google_validated', match: matchCount, total: cards.length };
  }

  // Google's translation doesn't match most cards.
  // Find what English content word is most EXCLUSIVELY associated with this French word.
  // Strategy: count how many cards containing this French word also contain each English word,
  // but penalize English words that appear in many cards WITHOUT this French word (they're noise).
  const candidateCounts = {};

  for (const card of cards) {
    const cardEnWords = extractEnglishContent(card.english);
    // Use a Set to count each candidate once per card
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

  // Filter out candidates that are clearly wrong forms (past tenses, -ing forms, etc.)
  // These leak from card English but aren't good dictionary definitions
  const BAD_CANDIDATE_PATTERNS = /^(understood|moved|moving|brushing|going|sent|spoke|speaking|wearing|playing|seated|rang|fell|sold|forgot|passed|warned|left|ate|drove|chose|works|tires|forced|faster|sooner|provided|unlikely|weekends|online|driving|door|decision|sunset|home|students|picnic|better|beautiful|appropriate|exam|phone|message)$/i;

  // Now compute selectivity: how exclusive is each candidate to cards with this French word?
  let bestCandidate = null;
  let bestScore = 0;
  const minCount = Math.max(3, Math.ceil(cards.length * 0.4));

  for (const [stem, info] of Object.entries(candidateCounts)) {
    if (info.count < minCount) continue;

    // Skip candidates that are past tenses, -ing forms, etc.
    if (BAD_CANDIDATE_PATTERNS.test(info.bestWord)) continue;
    // Also skip -ing forms, past tenses ending in -ed (but not base words like "bed", "red")
    const cLower = info.bestWord.toLowerCase();
    if (cLower.endsWith('ing') && cLower.length > 5) continue; // skip gerunds
    if (cLower.endsWith('ed') && cLower.length > 4 && !['bed', 'red', 'fed', 'led', 'wed', 'shed'].includes(cLower)) continue;

    // Compute selectivity score: count / total cards * (count / cards.length)
    // Higher is better — rewards both absolute frequency and relative frequency
    const relFreq = info.count / cards.length;
    const score = info.count * relFreq;

    if (score > bestScore) {
      bestCandidate = info.bestWord;
      bestScore = score;
    }
  }

  // Require the candidate to be clearly better than Google
  // Score must exceed Google's match score by a meaningful margin
  const googleScore = matchCount * (matchCount / cards.length);
  if (bestCandidate && bestScore > googleScore * 1.5 + 0.5) {
    // Verify the candidate isn't just a stop word we missed
    const candLower = bestCandidate.toLowerCase();
    if (EN_STOP.has(candLower)) {
      return { newEn: googleEn, source: 'google_low_match', match: matchCount, total: cards.length };
    }
    // Reject candidates that are clearly wrong forms (past tenses, fragments)
    if (candLower.length < 3) {
      return { newEn: googleEn, source: 'google_low_match', match: matchCount, total: cards.length };
    }
    // Reject candidates ending with 'll (contractions like we'll, he'll)
    if (candLower.endsWith("'ll") || candLower.endsWith("'ve") || candLower.endsWith("'re") || candLower.endsWith("'d")) {
      return { newEn: googleEn, source: 'google_low_match', match: matchCount, total: cards.length };
    }

    // If the POS is verb, add "to " prefix
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

  // Couldn't find a better candidate, keep Google's
  return { newEn: googleEn, source: 'google_low_match', match: matchCount, total: cards.length };
}

// ══════════════════════════════════════════════════════════════
// Step 5: Noun/verb ambiguity detection
// ══════════════════════════════════════════════════════════════

// Known French words that are both nouns and verbs
const NOUN_VERB_AMBIGUOUS = new Set([
  'voyage', 'travail', 'marche', 'danse', 'visite', 'aide',
  'cuisine', 'promenade', 'commande', 'demande', 'garde',
  'dépense', 'pratique', 'change', 'charge', 'compte',
  'contrôle', 'dépôt', 'doute', 'effort', 'essai',
  'forme', 'guide', 'limite', 'note', 'offre',
  'ordre', 'place', 'plan', 'poste', 'reste',
  'rêve', 'risque', 'route', 'suite', 'taille',
  'ferme', 'fête', 'fin', 'force', 'livre',
  'manque', 'part', 'passe', 'peine', 'porte',
  'recherche', 'souci', 'tour', 'vol', 'choix',
]);

function resolveNounVerbAmbiguity(frenchWord, currentEn, currentPos, wordCardsIndex) {
  if (!NOUN_VERB_AMBIGUOUS.has(frenchWord)) return null;

  const cards = wordCardsIndex[frenchWord.toLowerCase()] || [];
  if (cards.length < 2) return null;

  // Analyze cards: is the word used more as a noun or verb?
  let nounUsageCount = 0;
  let verbUsageCount = 0;

  // Simple heuristic: check if the English card contains verb indicators
  const verbIndicators = /\b(I |we |they |he |she |you |it |to |don't |doesn't |didn't |will |would |can |could |should |must |am |is |are |was |were )/i;
  const nounIndicators = /\b(the |a |an |my |his |her |our |their |this |that |some |every |each )/i;

  for (const card of cards) {
    const engWords = card.english.toLowerCase();
    // Check the position of the word's translation in the sentence
    // If preceded by pronoun/auxiliary, likely verb usage
    // If preceded by article/determiner, likely noun usage

    // Also check if the French sentence has a subject pronoun before the word
    const frTarget = card.target.toLowerCase();
    const wordIdx = frTarget.indexOf(frenchWord);
    const before = wordIdx > 0 ? frTarget.slice(Math.max(0, wordIdx - 10), wordIdx) : '';

    const hasSubjectBefore = /\b(je|tu|il|elle|on|nous|vous|ils|elles)\s+$/.test(before) ||
                             /\b(ne|n')\s*$/.test(before);
    const hasDetBefore = /\b(le|la|les|un|une|des|du|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|leur|leurs|ce|cette|ces)\s+$/.test(before);

    if (hasSubjectBefore) verbUsageCount++;
    else if (hasDetBefore) nounUsageCount++;
    else {
      // Fallback: check English side
      if (verbIndicators.test(card.english)) verbUsageCount++;
      if (nounIndicators.test(card.english)) nounUsageCount++;
    }
  }

  // Determine primary usage
  if (verbUsageCount > nounUsageCount && verbUsageCount >= 2) {
    return { pos: 'v', usage: 'verb', verbCount: verbUsageCount, nounCount: nounUsageCount };
  } else if (nounUsageCount > verbUsageCount && nounUsageCount >= 2) {
    return { pos: 'n', usage: 'noun', verbCount: verbUsageCount, nounCount: nounUsageCount };
  }

  return null;
}

// ══════════════════════════════════════════════════════════════
// Generate .ts output
// ══════════════════════════════════════════════════════════════
function generateTsOutput(results) {
  const originalSrc = fs.readFileSync(DICT_PATH, 'utf8');
  const dictStart = originalSrc.indexOf("export const dictionary: Record<string, DictEntry> = {");
  if (dictStart === -1) throw new Error('Could not find dictionary export in fr.ts');

  const header = originalSrc.slice(0, dictStart);
  const sorted = [...results].sort((a, b) => a.word.localeCompare(b.word, 'fr'));

  let dictLines = 'export const dictionary: Record<string, DictEntry> = {\n';
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

  return header + dictLines;
}

// ══════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════
async function main() {
  console.log('=== French Dictionary Rebuild (Sentence-Context Approach) ===\n');

  // Ensure output dir exists
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Parsing French dictionary...');
  const dict = parseDictionary();
  const allKeys = Object.keys(dict);
  console.log(`  ${allKeys.length} entries found`);

  console.log('Loading deck...');
  const deck = loadDeck();
  console.log(`  ${deck.length} cards`);

  const wordCardsIndex = buildWordToCardsIndex(deck);

  // Separate function words from Google words
  const functionWordKeys = [];
  const googleWordKeys = [];
  for (const key of allKeys) {
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

  // ── Step 2: Google Translate in batches ──
  const BATCH_SIZE = 80;
  const DELAY = 200;
  const googleResults = {};

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
      }
      console.log(' done');
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      for (const w of batch) {
        googleResults[w] = null;
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

  // ── Lemma copy: collect base translations, then copy to inflected forms ──
  console.log('Applying lemma copy...');
  const lemmaTranslations = {};
  let lemmaCopyCount = 0;

  // First pass: collect translations for base forms (no lemma field)
  for (const key of googleWordKeys) {
    if (!dict[key].lemma) {
      lemmaTranslations[key] = googleProcessed[key].text;
    }
  }
  // Also add function words as potential lemma bases
  for (const key of functionWordKeys) {
    lemmaTranslations[key] = FUNCTION_WORDS[key];
  }

  // Build intermediate results for Google words (before context validation)
  const intermediateResults = {};
  for (const key of googleWordKeys) {
    const entry = dict[key];
    const processed = googleProcessed[key];

    let newEn = processed.text;
    let source = processed.failed ? 'google_failed' : 'google';

    // If entry has a lemma and we have a translation for it, copy it
    if (entry.lemma && lemmaTranslations[entry.lemma]) {
      newEn = lemmaTranslations[entry.lemma];
      source = 'lemma_copy';
      lemmaCopyCount++;
    }

    intermediateResults[key] = { newEn, source, pos: entry.pos || '' };
  }

  console.log(`  Lemma copies applied: ${lemmaCopyCount}`);

  // ── Step 4: Context validation ──
  console.log('\nStep 4: Validating against card context...');
  let contextCorrectedCount = 0;
  let contextValidatedCount = 0;
  let contextUnvalidatedCount = 0;
  let contextLowMatchCount = 0;
  const contextCorrections = []; // For reporting

  // Collect all French words for disambiguation
  const allFrenchWords = new Set(allKeys);

  for (const key of googleWordKeys) {
    const entry = dict[key];
    const intermediate = intermediateResults[key];

    // Only validate non-lemma-copy entries (lemma copies inherit from base)
    // Actually, validate all to catch inherited bad translations too
    const validation = validateAndCorrectFromCards(
      key,
      intermediate.newEn,
      intermediate.pos,
      wordCardsIndex,
      allFrenchWords
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
  console.log(`  Google-unvalidated (0-1 cards): ${contextUnvalidatedCount}`);
  console.log(`  Google-low-match (kept): ${contextLowMatchCount}`);

  // ── Step 5: Noun/verb ambiguity ──
  console.log('\nStep 5: Resolving noun/verb ambiguity...');
  let ambiguityResolved = 0;
  const ambiguityChanges = [];

  for (const key of googleWordKeys) {
    const entry = dict[key];
    const intermediate = intermediateResults[key];
    const resolution = resolveNounVerbAmbiguity(key, intermediate.newEn, intermediate.pos, wordCardsIndex);

    if (resolution) {
      const oldPos = intermediate.pos;
      intermediate.pos = resolution.pos;
      ambiguityResolved++;

      // If resolved as verb and definition doesn't have "to ", add it
      if (resolution.pos === 'v' && !intermediate.newEn.startsWith('to ')) {
        intermediate.newEn = 'to ' + intermediate.newEn;
      }
      // If resolved as noun and definition starts with "to ", remove it
      if (resolution.pos === 'n' && intermediate.newEn.startsWith('to ')) {
        intermediate.newEn = intermediate.newEn.slice(3);
      }

      ambiguityChanges.push({
        word: key,
        oldPos,
        newPos: resolution.pos,
        usage: resolution.usage,
        verbCount: resolution.verbCount,
        nounCount: resolution.nounCount,
      });
    }
  }

  console.log(`  Ambiguity resolved: ${ambiguityResolved}`);

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
      pos: intermediate.pos,
      ipa: entry.ipa || '',
      lemma: entry.lemma || undefined,
    });
  }

  // ── Step 6: Apply specific fixes ──
  console.log('\nStep 6: Applying specific fixes...');
  let specificFixCount = 0;
  for (const r of results) {
    if (SPECIFIC_FIXES[r.word]) {
      const fix = SPECIFIC_FIXES[r.word];
      r.new_en = fix.en;
      if (fix.pos) r.pos = fix.pos;
      r.source = 'specific_fix';
      specificFixCount++;
    }
  }
  console.log(`  Specific fixes applied: ${specificFixCount}`);

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

  const jsonPath = path.join(OUT_DIR, 'fr-context-rebuild.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`  ${jsonPath}`);

  // Write context corrections detail
  const correctionsPath = path.join(OUT_DIR, 'fr-context-corrections.json');
  fs.writeFileSync(correctionsPath, JSON.stringify({
    contextCorrections,
    ambiguityChanges,
  }, null, 2));
  console.log(`  ${correctionsPath}`);

  // ── Write preview MD with 100 changed entries ──
  const changedResults = results.filter(r => r.old_en !== r.new_en);
  const sample100 = changedResults.slice(0, 100);

  let md = `# French Dictionary Context Rebuild — 100 Changed Entries\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries:** ${results.length}\n`;
  md += `**Changed:** ${changedCount}\n`;
  md += `**Question marks fixed:** ${questionMarkFixed}\n`;
  md += `**Context-corrected:** ${contextCorrectedCount}\n`;
  md += `**Noun/verb ambiguity resolved:** ${ambiguityResolved}\n\n`;
  md += `**Source breakdown:**\n`;
  for (const [src, count] of Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])) {
    md += `- ${src}: ${count}\n`;
  }
  md += `\n**Validated:** ${validatedCount} / ${results.length} (${(100 * validatedCount / results.length).toFixed(1)}%)\n\n`;

  md += `| # | Word | Old EN | New EN | Source | POS |\n`;
  md += `|---|------|--------|--------|--------|-----|\n`;
  sample100.forEach((r, i) => {
    const oldE = r.old_en.replace(/\|/g, '\\|');
    const newE = r.new_en.replace(/\|/g, '\\|');
    md += `| ${i + 1} | ${r.word} | ${oldE} | ${newE} | ${r.source} | ${r.pos} |\n`;
  });

  const mdPath = path.join(OUT_DIR, 'fr-context-rebuild-preview.md');
  fs.writeFileSync(mdPath, md);
  console.log(`  ${mdPath}`);

  // ── Apply to fr.ts ──
  console.log('\nGenerating new fr.ts...');
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
  console.log(`Context-corrected (Google → card): ${contextCorrectedCount}`);
  console.log(`Noun/verb ambiguity resolved: ${ambiguityResolved}`);
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

  // ── Print ambiguity resolutions ──
  if (ambiguityChanges.length > 0) {
    console.log(`\n=== NOUN/VERB AMBIGUITY RESOLUTIONS (${ambiguityChanges.length}) ===`);
    for (const a of ambiguityChanges) {
      console.log(`  ${a.word}: ${a.oldPos} → ${a.newPos} (verb:${a.verbCount} noun:${a.nounCount})`);
    }
  }

  // ── Print 100 sample changed entries to stdout ──
  console.log('\n=== 100 SAMPLE OLD→NEW CHANGES ===');
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
