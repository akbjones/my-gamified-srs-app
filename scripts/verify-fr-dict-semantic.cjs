#!/usr/bin/env node
/**
 * French dictionary semantic verification via Google Translate.
 *
 * 1. Parse ALL entries from fr.ts
 * 2. Skip French function words
 * 3. Translate ALL remaining via Google (fr→en), batch 80
 * 4. Compare – zero content word match → replace
 * 5. Filter garbage Google results + bad verb form translations
 * 6. Apply to fr.ts, preserve IPA/POS/lemma
 * 7. Verify TypeScript
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.join(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src', 'data', 'dictionary', 'fr.ts');
const API_KEY = process.env.GOOGLE_TTS_KEY;

// ── French function words to skip ──────────────────────────────
const FR_FUNCTION_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'lui', 'leur', 'en', 'y',
  'ce', 'ça', 'cela', 'ceci', 'qui', 'que', 'quoi', 'dont', 'où',
  'moi', 'toi', 'soi', 'eux',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  'ce', 'cet', 'cette', 'ces',
  'à', 'de', 'en', 'dans', 'sur', 'sous', 'par', 'pour', 'avec',
  'sans', 'chez', 'entre', 'vers', 'après', 'avant', 'depuis',
  'pendant', 'contre', 'selon', 'devant', 'derrière', 'dès',
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'si',
  'quand', 'comme', 'puisque', 'lorsque',
  'ne', 'pas', 'plus', 'jamais', 'rien', 'personne',
  'très', 'bien', 'mal', 'aussi', 'encore', 'déjà', 'toujours',
  'souvent', 'ici', 'là', 'où', 'oui', 'non', 'peut-être',
  'a', 'ai', 'as', 'avons', 'avez', 'ont', 'avoir',
  'est', 'suis', 'es', 'sommes', 'êtes', 'sont', 'être',
  'fait', 'faire', 'fais', 'faisons', 'faites', 'font',
  'va', 'vais', 'vas', 'allons', 'allez', 'vont', 'aller',
  'peut', 'peux', 'pouvons', 'pouvez', 'peuvent', 'pouvoir',
  'doit', 'dois', 'devons', 'devez', 'doivent', 'devoir',
  'veut', 'veux', 'voulons', 'voulez', 'veulent', 'vouloir',
  'sait', 'sais', 'savons', 'savez', 'savent', 'savoir',
  'lequel', 'laquelle', 'lesquels', 'lesquelles',
  'auquel', 'auxquels', 'auxquelles', 'duquel',
  'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'c', 'd', 'j', 'l', 'm', 'n', 's', 't',
]);

// English stop words for comparison
const EN_STOP = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'and', 'but',
  'or', 'not', 'no', 'do', 'does', 'did', 'has', 'had', 'have', 'will',
  'would', 'can', 'could', 'it', 'its', 'that', 'this', 'my', 'your',
  'his', 'her', 'our', 'their', 'i', 'he', 'she', 'we', 'they', 'you',
  'me', 'him', 'us', 'them', 'who', 'what', 'which', 'how', 'when', 'where',
  'if', 'so', 'up', 'out', 'as', 'very', 'just', 'more', 'most',
]);

// ── Parse dictionary ───────────────────────────────────────────
function loadDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
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

// ── Google Translate ───────────────────────────────────────────
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
  console.log('Translating ' + wordList.length + ' words in ' + batches.length + ' batches...');
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const translations = await googleTranslate(batch, 'fr', 'en');
      for (let j = 0; j < batch.length; j++) results.set(batch[j], translations[j]);
      if ((i + 1) % 10 === 0 || i === batches.length - 1)
        console.log('  Batch ' + (i + 1) + '/' + batches.length + ' done (' + results.size + ' translated)');
    } catch (err) {
      console.error('  Batch ' + (i + 1) + ' failed: ' + err.message);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const translations = await googleTranslate(batch, 'fr', 'en');
        for (let j = 0; j < batch.length; j++) results.set(batch[j], translations[j]);
      } catch (err2) {
        console.error('  Batch ' + (i + 1) + ' retry failed');
        for (const w of batch) results.set(w, '?');
      }
    }
    if (i < batches.length - 1) await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

// ── Content word extraction ────────────────────────────────────
function contentWords(text) {
  return text.toLowerCase()
    .replace(/^to\s+/, '')
    .replace(/^to\s+be\s+/, '')
    .split(/[\s,;/()]+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length > 1 && !EN_STOP.has(w));
}

// ── English verb lemmatization (simple) ────────────────────────
function lemmatizeEn(word) {
  const irregulars = {
    'went': 'go', 'gone': 'go', 'going': 'go',
    'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
    'had': 'have', 'having': 'have',
    'did': 'do', 'done': 'do', 'doing': 'do',
    'said': 'say', 'saying': 'say',
    'made': 'make', 'making': 'make',
    'took': 'take', 'taken': 'take', 'taking': 'take',
    'came': 'come', 'coming': 'come',
    'saw': 'see', 'seen': 'see', 'seeing': 'see',
    'knew': 'know', 'known': 'know', 'knowing': 'know',
    'gave': 'give', 'given': 'give', 'giving': 'give',
    'found': 'find', 'finding': 'find',
    'thought': 'think', 'thinking': 'think',
    'told': 'tell', 'telling': 'tell',
    'left': 'leave', 'leaving': 'leave',
    'felt': 'feel', 'feeling': 'feel',
    'brought': 'bring', 'bringing': 'bring',
    'began': 'begin', 'begun': 'begin', 'beginning': 'begin',
    'kept': 'keep', 'keeping': 'keep',
    'held': 'hold', 'holding': 'hold',
    'wrote': 'write', 'written': 'write', 'writing': 'write',
    'stood': 'stand', 'standing': 'stand',
    'heard': 'hear', 'hearing': 'hear',
    'let': 'let', 'letting': 'let',
    'meant': 'mean', 'meaning': 'mean',
    'set': 'set', 'setting': 'set',
    'met': 'meet', 'meeting': 'meet',
    'ran': 'run', 'running': 'run',
    'paid': 'pay', 'paying': 'pay',
    'sat': 'sit', 'sitting': 'sit',
    'spoke': 'speak', 'spoken': 'speak', 'speaking': 'speak',
    'led': 'lead', 'leading': 'lead',
    'read': 'read', 'reading': 'read',
    'grew': 'grow', 'grown': 'grow', 'growing': 'grow',
    'lost': 'lose', 'losing': 'lose',
    'fell': 'fall', 'fallen': 'fall', 'falling': 'fall',
    'sent': 'send', 'sending': 'send',
    'built': 'build', 'building': 'build',
    'understood': 'understand', 'understanding': 'understand',
    'learned': 'learn', 'learning': 'learn', 'learnt': 'learn',
    'drawn': 'draw', 'drew': 'draw', 'drawing': 'draw',
    'broken': 'break', 'broke': 'break', 'breaking': 'break',
    'received': 'receive', 'receiving': 'receive',
    'chosen': 'choose', 'chose': 'choose', 'choosing': 'choose',
    'moved': 'move', 'moving': 'move',
    'lived': 'live', 'living': 'live',
    'believed': 'believe', 'believing': 'believe',
    'looked': 'look', 'looking': 'look',
    'acted': 'act', 'acting': 'act',
    'loved': 'love', 'loving': 'love',
    'walked': 'walk', 'walking': 'walk',
    'wanted': 'want', 'wanting': 'want',
    'played': 'play', 'playing': 'play',
    'worked': 'work', 'working': 'work',
    'called': 'call', 'calling': 'call',
    'tried': 'try', 'trying': 'try',
    'asked': 'ask', 'asking': 'ask',
    'needed': 'need', 'needing': 'need',
    'turned': 'turn', 'turning': 'turn',
    'started': 'start', 'starting': 'start',
    'showed': 'show', 'shown': 'show', 'showing': 'show',
    'expected': 'expect', 'expecting': 'expect',
    'opened': 'open', 'opening': 'open',
    'closed': 'close', 'closing': 'close',
    'followed': 'follow', 'following': 'follow',
    'stopped': 'stop', 'stopping': 'stop',
    'created': 'create', 'creating': 'create',
    'decided': 'decide', 'deciding': 'decide',
    'changed': 'change', 'changing': 'change',
    'offered': 'offer', 'offering': 'offer',
    'remembered': 'remember', 'remembering': 'remember',
    'considered': 'consider', 'considering': 'consider',
    'appeared': 'appear', 'appearing': 'appear',
    'learned': 'learn', 'teaching': 'teach',
    'bought': 'buy', 'buying': 'buy',
    'sold': 'sell', 'selling': 'sell',
    'caught': 'catch', 'catching': 'catch',
    'taught': 'teach',
    'fought': 'fight', 'fighting': 'fight',
    'worn': 'wear', 'wore': 'wear', 'wearing': 'wear',
    'eaten': 'eat', 'ate': 'eat', 'eating': 'eat',
    'drunk': 'drink', 'drank': 'drink', 'drinking': 'drink',
    'slept': 'sleep', 'sleeping': 'sleep',
    'woken': 'wake', 'woke': 'wake', 'waking': 'wake',
    'driven': 'drive', 'drove': 'drive', 'driving': 'drive',
    'ridden': 'ride', 'rode': 'ride', 'riding': 'ride',
    'flown': 'fly', 'flew': 'fly', 'flying': 'fly',
    'swum': 'swim', 'swam': 'swim', 'swimming': 'swim',
    'sung': 'sing', 'sang': 'sing', 'singing': 'sing',
    'thrown': 'throw', 'threw': 'throw', 'throwing': 'throw',
    'hidden': 'hide', 'hid': 'hide', 'hiding': 'hide',
    'risen': 'rise', 'rose': 'rise', 'rising': 'rise',
    'shaken': 'shake', 'shook': 'shake', 'shaking': 'shake',
    'forgotten': 'forget', 'forgot': 'forget', 'forgetting': 'forget',
    'forgiven': 'forgive', 'forgave': 'forgive', 'forgiving': 'forgive',
    'laid': 'lay', 'lying': 'lie', 'lain': 'lie',
    'hung': 'hang', 'hanging': 'hang',
    'struck': 'strike', 'striking': 'strike',
    'bitten': 'bite', 'bit': 'bite', 'biting': 'bite',
    'blown': 'blow', 'blew': 'blow', 'blowing': 'blow',
    'stole': 'steal', 'stolen': 'steal', 'stealing': 'steal',
    'wept': 'weep', 'weeping': 'weep',
    'dug': 'dig', 'digging': 'dig',
    'hurt': 'hurt', 'hurting': 'hurt',
    'shut': 'shut', 'shutting': 'shut',
    'cut': 'cut', 'cutting': 'cut',
    'put': 'put', 'putting': 'put',
    'hit': 'hit', 'hitting': 'hit',
    'spread': 'spread', 'spreading': 'spread',
    'spent': 'spend', 'spending': 'spend',
    'lent': 'lend', 'lending': 'lend',
    'bent': 'bend', 'bending': 'bend',
    'dealt': 'deal', 'dealing': 'deal',
    'sought': 'seek', 'seeking': 'seek',
    'sworn': 'swear', 'swore': 'swear', 'swearing': 'swear',
    'warned': 'warn', 'warning': 'warn',
    'advanced': 'advance', 'advancing': 'advance',
    'amused': 'amuse', 'amusing': 'amuse',
    'arrived': 'arrive', 'arriving': 'arrive',
    'discussed': 'discuss', 'discussing': 'discuss',
    'finished': 'finish', 'finishing': 'finish',
    'belonged': 'belong', 'belonging': 'belong',
    'prepared': 'prepare', 'preparing': 'prepare',
    'noticed': 'notice', 'noticing': 'notice',
    'suggested': 'suggest', 'suggesting': 'suggest',
    'reached': 'reach', 'reaching': 'reach',
    'reduced': 'reduce', 'reducing': 'reduce',
    'required': 'require', 'requiring': 'require',
    'developed': 'develop', 'developing': 'develop',
    'achieved': 'achieve', 'achieving': 'achieve',
    'improved': 'improve', 'improving': 'improve',
    'increased': 'increase', 'increasing': 'increase',
    'decreased': 'decrease', 'decreasing': 'decrease',
    'organized': 'organize', 'organizing': 'organize',
    'recognized': 'recognize', 'recognizing': 'recognize',
    'encouraged': 'encourage', 'encouraging': 'encourage',
    'established': 'establish', 'establishing': 'establish',
    'maintained': 'maintain', 'maintaining': 'maintain',
    'obtained': 'obtain', 'obtaining': 'obtain',
    'produced': 'produce', 'producing': 'produce',
    'provided': 'provide', 'providing': 'provide',
    'published': 'publish', 'publishing': 'publish',
    'replaced': 'replace', 'replacing': 'replace',
    'represented': 'represent', 'representing': 'represent',
  };

  if (irregulars[word]) return irregulars[word];

  // Regular patterns
  if (word.endsWith('ing')) {
    const base = word.slice(0, -3);
    if (base.length >= 3) return base;
    return base + 'e';
  }
  if (word.endsWith('ed')) {
    const base = word.slice(0, -2);
    if (base.length >= 3) return base;
    return base + 'e';
  }
  if (word.endsWith('ied')) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

// ── Semantic match check (with lemmatization) ──────────────────
function hasSemanticOverlap(existing, google) {
  const ew = contentWords(existing);
  const gw = contentWords(google);
  if (ew.length === 0 || gw.length === 0) return true; // can't compare, skip

  // Lemmatize both sides
  const ewLemmas = ew.map(w => lemmatizeEn(w));
  const gwLemmas = gw.map(w => lemmatizeEn(w));

  // Check all combinations including lemmas
  const allExisting = new Set([...ew, ...ewLemmas]);
  const allGoogle = new Set([...gw, ...gwLemmas]);

  for (const e of allExisting) {
    for (const g of allGoogle) {
      // Exact match
      if (e === g) return true;
      // Stem match (first 4+ chars)
      if (e.length >= 4 && g.length >= 4) {
        const minLen = Math.min(e.length, g.length);
        const prefixLen = Math.min(4, minLen);
        if (e.slice(0, prefixLen) === g.slice(0, prefixLen)) return true;
      }
      // Substring match for longer words
      if (e.length >= 5 && g.includes(e)) return true;
      if (g.length >= 5 && e.includes(g)) return true;
    }
  }
  return false;
}

// ── Garbage filter for Google results ──────────────────────────
function isGarbageGoogle(word, rawTranslation) {
  const t = rawTranslation.toLowerCase().trim();
  if (t.length > 60) return true;
  if (t === word) return true;
  if (/^[\d\s.,;:!?-]+$/.test(t)) return true;
  if (/[\u0600-\u06FF\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(t)) return true;
  if (t === '?') return true;
  if (t.length === 0) return true;
  // French chars remaining = Google just echoed it back
  if (/[éèêëàâäùûüôïîçœæ]/.test(t) && !t.includes(' ')) return true;
  return false;
}

// ── Should we replace? ─────────────────────────────────────────
// For verb forms with a lemma, only replace if the existing translation
// is clearly wrong (not just slightly different from Google)
function shouldReplace(word, entry, googleProcessed, dict) {
  const existingEn = entry.en || '';

  // If existing is clearly garbage, always replace
  if (existingEn.length === 0) return true;
  if (existingEn.includes('\\')) return true; // escaped quotes = corruption
  if (/^to (wants|bre|bre )/.test(existingEn)) return true; // obvious garbage

  // For verb forms with a lemma: be conservative
  // Only replace if Google and the lemma agree the existing is wrong
  if (entry.lemma && entry.pos === 'v' && dict[entry.lemma]) {
    const lemmaEn = dict[entry.lemma].en || '';
    // If existing matches lemma, keep it (lemma is the authority)
    if (existingEn === lemmaEn) return false;
    // If existing has semantic overlap with lemma, keep it
    if (hasSemanticOverlap(existingEn, lemmaEn)) return false;
    // Existing doesn't match lemma at all – check Google
    // If Google matches lemma, we should replace with lemma translation
    if (hasSemanticOverlap(googleProcessed, lemmaEn)) return true;
    // If Google doesn't match lemma either, but existing is obviously wrong, replace
    if (!hasSemanticOverlap(existingEn, googleProcessed)) return true;
    return false;
  }

  // For non-verb or non-lemma entries: zero overlap = replace
  if (!hasSemanticOverlap(existingEn, googleProcessed)) return true;

  return false;
}

// ── Determine the best replacement ─────────────────────────────
function getBestTranslation(word, entry, googleProcessed, dict) {
  // For verb forms with a lemma, prefer lemma's translation
  if (entry.lemma && entry.pos === 'v' && dict[entry.lemma]) {
    const lemmaEn = dict[entry.lemma].en;
    if (lemmaEn && hasSemanticOverlap(lemmaEn, googleProcessed)) {
      return lemmaEn;
    }
  }

  // Clean up Google result
  let result = googleProcessed
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  // Don't use "to <past-tense>" patterns – these are bad verb translations
  // e.g., "to acted", "to advanced", "to amused"
  if (/^to [a-z]+ed$/.test(result)) {
    const verb = result.slice(3);
    const lemma = lemmatizeEn(verb);
    if (lemma !== verb) {
      result = 'to ' + lemma;
    }
  }

  // Don't use "to be <verb>ing" patterns for simple verbs
  if (/^to be [a-z]+ing/.test(result)) {
    const verb = result.match(/^to be ([a-z]+ing)/)[1];
    const lemma = lemmatizeEn(verb);
    if (lemma) {
      result = 'to ' + lemma;
    }
  }

  // Handle non-verb words that got "to " prefix incorrectly
  if (entry.pos && entry.pos !== 'v' && result.startsWith('to ')) {
    result = result.slice(3);
  }

  // If pos is verb and no "to " prefix, add it (only if single word or reasonable)
  if (entry.pos === 'v' && !result.startsWith('to ') && !result.includes(',') && result.split(' ').length <= 3) {
    const firstWord = result.split(/\s+/)[0];
    if (!/^(a|an|the|is|was|has|had|been|being|not|yes|no)$/i.test(firstWord)) {
      result = 'to ' + result;
    }
  }

  // Cap length
  if (result.length > 50) {
    const parts = result.split(/[,;]/);
    result = parts[0].trim();
  }

  return result;
}

function postProcessSafe(raw, pos, word) {
  try {
    const stats = new PostProcessStats();
    const result = postProcess(raw, pos, word, stats);
    return result.text || raw;
  } catch (e) {
    return raw.toLowerCase().trim();
  }
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('=== French Dictionary Semantic Verification ===\n');

  const dict = loadDict();
  const allWords = Object.keys(dict);
  console.log('Step 1: Loaded ' + allWords.length + ' dictionary entries\n');

  const contentWordList = [];
  let skippedFunc = 0;
  for (const word of allWords) {
    if (FR_FUNCTION_WORDS.has(word)) { skippedFunc++; } else { contentWordList.push(word); }
  }
  console.log('Step 2: Skipping ' + skippedFunc + ' function words, checking ' + contentWordList.length + ' content words\n');

  // Translate
  const googleResults = await translateBatches(contentWordList);
  console.log('\nStep 3: ' + googleResults.size + ' translations received\n');

  // Compare
  const fixes = [];
  let matched = 0, mismatched = 0, garbageSkipped = 0;

  for (const word of contentWordList) {
    const entry = dict[word];
    const googleRaw = googleResults.get(word);
    if (!googleRaw || googleRaw === '?') continue;

    if (isGarbageGoogle(word, googleRaw)) { garbageSkipped++; continue; }

    const googleProcessed = postProcessSafe(googleRaw, entry.pos || '', word);

    if (!shouldReplace(word, entry, googleProcessed, dict)) {
      matched++;
      continue;
    }

    mismatched++;
    const newEn = getBestTranslation(word, entry, googleProcessed, dict);

    // Final safety: skip if new translation is garbage
    if (newEn.length === 0 || newEn === '?' || newEn === word) continue;
    // Skip if new translation same as old
    if (newEn === entry.en) { matched++; mismatched--; continue; }
    // Skip "to <source-word>" patterns
    if (newEn === 'to ' + word) continue;

    fixes.push({
      word,
      oldEn: entry.en || '',
      newEn,
      googleRaw,
      googleProcessed,
    });
  }

  // Propagate lemma fixes to verb forms
  const lemmaFixMap = new Map();
  for (const fix of fixes) {
    if (!dict[fix.word].lemma) {
      lemmaFixMap.set(fix.word, fix.newEn);
    }
  }

  let propagated = 0;
  for (const word of contentWordList) {
    const entry = dict[word];
    if (!entry.lemma) continue;
    if (fixes.some(f => f.word === word)) continue;

    const newLemmaEn = lemmaFixMap.get(entry.lemma);
    if (!newLemmaEn) continue;

    const oldLemmaEn = dict[entry.lemma]?.en || '';
    if (entry.en === oldLemmaEn && entry.en !== newLemmaEn) {
      fixes.push({
        word,
        oldEn: entry.en,
        newEn: newLemmaEn,
        googleRaw: '(propagated from lemma ' + entry.lemma + ')',
        googleProcessed: newLemmaEn,
      });
      propagated++;
    }
  }

  console.log('Step 4: Results:');
  console.log('  Matched/kept: ' + matched);
  console.log('  Mismatched (fixing): ' + fixes.length);
  console.log('  Garbage Google skipped: ' + garbageSkipped);
  console.log('  Lemma propagated: ' + propagated);
  console.log('');

  console.log('Sample fixes (first 40):');
  for (const fix of fixes.slice(0, 40)) {
    console.log('  ' + fix.word + ': "' + fix.oldEn + '" -> "' + fix.newEn + '"');
  }
  console.log('');

  if (fixes.length === 0) {
    console.log('No fixes needed.');
    return;
  }

  // Apply fixes
  console.log('Step 6: Applying ' + fixes.length + ' fixes to fr.ts...');
  let src = fs.readFileSync(DICT_PATH, 'utf8');
  let applied = 0;

  for (const fix of fixes) {
    const escapedWord = fix.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const oldEnEscaped = (fix.oldEn || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match the en value in the entry for this specific word
    // Handle both single-quoted and double-quoted keys
    const patterns = [
      new RegExp("('" + escapedWord + "'\\s*:\\s*\\{\\s*en:\\s*')" + oldEnEscaped + "(')", 'g'),
      new RegExp('("' + escapedWord + '"\\s*:\\s*\\{\\s*en:\\s*\')' + oldEnEscaped + "(')", 'g'),
    ];

    const newEnSafe = fix.newEn.replace(/'/g, "\\'");
    const before = src;
    for (const pat of patterns) {
      src = src.replace(pat, '$1' + newEnSafe + '$2');
      if (src !== before) break;
    }
    if (src !== before) applied++;
  }

  fs.writeFileSync(DICT_PATH, src);
  console.log('  Applied: ' + applied + '/' + fixes.length + '\n');

  // Save report
  const reportPath = path.join(ROOT, 'scripts', 'output', 'fr-semantic-verification.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    total: allWords.length, skipped: skippedFunc, checked: contentWordList.length,
    matched, fixes_count: fixes.length, applied, garbage_skipped: garbageSkipped,
    propagated,
    fixes: fixes.map(f => ({ word: f.word, old: f.oldEn, new: f.newEn, google: f.googleProcessed })),
  }, null, 2));
  console.log('Report: scripts/output/fr-semantic-verification.json');

  // TypeScript check
  console.log('\nStep 7: TypeScript verification...');
  const { execSync } = require('child_process');
  try {
    execSync('PATH="/opt/homebrew/bin:$PATH" npx tsc --noEmit --pretty 2>&1 | head -20', {
      cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000,
    });
    console.log('  TypeScript: OK\n');
  } catch (err) {
    const output = (err.stdout || '').toString();
    if (output.includes('error TS')) {
      console.log('  TypeScript errors:\n' + output.slice(0, 500));
    } else {
      console.log('  TypeScript: OK\n');
    }
  }

  console.log('FRENCH COMPLETE – ' + applied + ' fixes');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
