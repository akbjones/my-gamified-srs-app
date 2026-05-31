#!/usr/bin/env node
/**
 * Semantic verification of Italian dictionary via Google Translate API v2.
 * More selective: only replace when original is genuinely wrong, not synonyms.
 *
 * Strategy:
 * 1. Translate IT→EN via Google
 * 2. Also translate the DICT English back to Italian via Google (EN→IT)
 * 3. If round-trip matches original Italian word = dict translation is valid synonym
 * 4. If round-trip does NOT match = dict translation is likely wrong
 * 5. Only replace when both forward AND round-trip disagree
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ── Italian function words to skip ──────────────────────────────
const FUNCTION_WORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una',
  'a', 'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'e', 'ed', 'o', 'ma', 'però', 'che', 'se', 'né', 'oppure',
  'perché', 'quando', 'mentre', 'come', 'dove', 'anche', 'pure',
  'dunque', 'quindi', 'eppure', 'anzi', 'cioè', 'ossia',
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'esso', 'essa',
  'mi', 'ti', 'ci', 'vi', 'si', 'lo', 'la', 'li', 'le', 'ne',
  'me', 'te', 'sé', 'ce', 've',
  'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle',
  'chi', 'cui', 'quale', 'quali',
  'mio', 'mia', 'miei', 'mie',
  'tuo', 'tua', 'tuoi', 'tue',
  'suo', 'sua', 'suoi', 'sue',
  'nostro', 'nostra', 'nostri', 'nostre',
  'vostro', 'vostra', 'vostri', 'vostre',
  'non', 'no', 'sì', 'già', 'più', 'molto', 'poco', 'mai',
  'sempre', 'ancora', 'solo', 'proprio', 'così', 'qui', 'qua',
  'lì', 'là', 'ora', 'adesso', 'poi', 'prima', 'dopo',
  'c', 'n', 'd', 'ecco',
  'è', 'sono', 'sei', 'siamo', 'siete',
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno',
  'era', 'ero', 'eri', 'eravamo', 'eravate', 'erano',
  'sarà', 'sarò', 'sarai', 'saremo', 'sarete', 'saranno',
  'sia', 'siano', 'siate',
  'stato', 'stata', 'stati', 'state',
  'avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano',
  'avrà', 'avrò', 'avrai', 'avremo', 'avrete', 'avranno',
  'abbia', 'abbiano', 'abbiate', 'abbi',
  'fa', 'fai', 'fanno', 'facciamo', 'fate',
  'do', 'dai', 'dà', 'diamo', 'danno', 'date',
  'sta', 'stai', 'stanno', 'stiamo',
  'può', 'posso', 'puoi', 'possiamo', 'possono', 'potete',
  'vuoi', 'vuole', 'voglio', 'vogliamo', 'volete', 'vogliono',
  'deve', 'devo', 'devi', 'dobbiamo', 'devono', 'dovete',
  'va', 'vai', 'andiamo', 'vanno', 'andate',
  'viene', 'vengo', 'vieni', 'veniamo', 'vengono', 'venite',
]);

// ── Known valid synonym pairs (to avoid false positives) ────────
// Format: dictEn word → set of acceptable Google alternatives
const SYNONYM_PAIRS = {
  'attire': ['clothing', 'clothes', 'outfit'],
  'embrace': ['hug', 'hold'],
  'adolescent': ['teenager', 'teen'],
  'repair': ['fix', 'mend'],
  'lift': ['raise', 'pick up'],
  'schoolchild': ['student', 'pupil'],
  'broad': ['wide', 'ample', 'large'],
  'gift': ['present'],
  'present': ['gift'],
  'begin': ['start'],
  'start': ['begin'],
  'buy': ['purchase', 'acquire'],
  'purchase': ['buy', 'acquire'],
  'big': ['large', 'great'],
  'large': ['big', 'great'],
  'small': ['little', 'tiny'],
  'little': ['small', 'tiny'],
  'happy': ['glad', 'content', 'cheerful', 'joyful'],
  'sad': ['unhappy', 'sorrowful'],
  'fast': ['quick', 'rapid', 'swift'],
  'quick': ['fast', 'rapid', 'swift'],
  'beautiful': ['pretty', 'lovely', 'handsome', 'gorgeous'],
  'pretty': ['beautiful', 'lovely'],
  'ugly': ['hideous', 'unattractive'],
  'road': ['street', 'way', 'path'],
  'street': ['road', 'way'],
  'car': ['automobile', 'vehicle'],
  'job': ['work', 'occupation', 'employment'],
  'work': ['job', 'occupation', 'labor'],
  'home': ['house', 'dwelling'],
  'house': ['home', 'dwelling'],
};

// ── Parse dictionary ────────────────────────────────────────────
function parseDictionary(src) {
  const entries = {};
  const re = /^\s*'([^']+)':\s*\{([^}]+)\}/gm;
  const re2 = /^\s*"([^"]+)":\s*\{([^}]+)\}/gm;

  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    if (enMatch) {
      entries[key] = { en: enMatch[1], pos: posMatch ? posMatch[1] : '', raw: m[0].trim() };
    }
  }
  while ((m = re2.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const enMatch = body.match(/en:\s*'([^']*)'/) || body.match(/en:\s*"([^"]*)"/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    if (enMatch) {
      entries[key] = { en: enMatch[1], pos: posMatch ? posMatch[1] : '', raw: m[0].trim() };
    }
  }
  return entries;
}

// ── Google Translate batch ──────────────────────────────────────
function googleTranslateBatch(words, sourceLang, targetLang) {
  return new Promise((resolve, reject) => {
    const qParams = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${qParams}&source=${sourceLang}&target=${targetLang}&key=${API_KEY}&format=text`;

    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
            return;
          }
          const translations = json.data.translations.map(t => t.translatedText);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nResponse: ${data.slice(0, 500)}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Semantic comparison helpers ─────────────────────────────────
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'but',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'my', 'your',
  'his', 'her', 'their', 'our', 'us', 'them',
  'do', 'does', 'did', 'will', 'would', 'can', 'could', 'shall', 'should',
  'may', 'might', 'must', 'have', 'has', 'had',
  'not', 'no', 'up', 'out', 'off', 'by', 'with', 'from', 'as',
  'this', 'that', 'these', 'those', 'some', 'any', 'all', 'each', 'every',
  'very', 'so', 'too', 'also', 'just', 'more', 'most', 'own', 'other',
  'one', 'oneself', 'something', 'someone', 'thing',
]);

function extractContentWords(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[().,!?;:"""''\/\-–—]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function stemWord(w) {
  // Very basic English stemming
  w = w.toLowerCase();
  if (w.endsWith('ing')) w = w.slice(0, -3);
  if (w.endsWith('tion')) w = w.slice(0, -4) + 't';
  if (w.endsWith('sion')) w = w.slice(0, -4) + 'd';
  if (w.endsWith('ness')) w = w.slice(0, -4);
  if (w.endsWith('ment')) w = w.slice(0, -4);
  if (w.endsWith('able')) w = w.slice(0, -4);
  if (w.endsWith('ible')) w = w.slice(0, -4);
  if (w.endsWith('ly')) w = w.slice(0, -2);
  if (w.endsWith('ed')) w = w.slice(0, -2);
  if (w.endsWith('er')) w = w.slice(0, -2);
  if (w.endsWith('est')) w = w.slice(0, -3);
  if (w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  if (w.endsWith('es')) w = w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  return w;
}

function contentWordsMatch(text1, text2) {
  const words1 = extractContentWords(text1);
  const words2 = extractContentWords(text2);

  if (words1.length === 0 || words2.length === 0) return true;

  // Check for any shared content word (including stems)
  const stems1 = new Set(words1.map(stemWord));
  const stems2 = new Set(words2.map(stemWord));

  for (const s of stems1) {
    if (s.length < 3) continue;
    for (const s2 of stems2) {
      if (s2.length < 3) continue;
      if (s === s2) return true;
      // Prefix match (4+ chars)
      if (s.length >= 4 && s2.length >= 4 && s.slice(0, 4) === s2.slice(0, 4)) return true;
      // One contains the other
      if (s.length >= 4 && s2.length >= 4 && (s.includes(s2) || s2.includes(s))) return true;
    }
  }

  // Check known synonyms
  for (const w1 of words1) {
    const syns = SYNONYM_PAIRS[w1];
    if (syns) {
      for (const w2 of words2) {
        if (syns.includes(w2)) return true;
      }
    }
  }
  for (const w2 of words2) {
    const syns = SYNONYM_PAIRS[w2];
    if (syns) {
      for (const w1 of words1) {
        if (syns.includes(w1)) return true;
      }
    }
  }

  return false;
}

// Italian stem comparison for round-trip
function italianStemMatch(word1, word2) {
  const w1 = word1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const w2 = word2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (w1 === w2) return true;
  // Same first 4+ chars (handles verb conjugations, noun plurals)
  if (w1.length >= 4 && w2.length >= 4 && w1.slice(0, 4) === w2.slice(0, 4)) return true;
  if (w1.length >= 5 && w2.length >= 5 && w1.slice(0, 5) === w2.slice(0, 5)) return true;
  return false;
}

// ── Garbage filter ──────────────────────────────────────────────
function isGarbageTranslation(googleEn, italianWord) {
  if (!googleEn || googleEn.trim() === '') return true;
  if (googleEn.toLowerCase().trim() === italianWord.toLowerCase().trim()) return true;
  if (googleEn.length > 80) return true;
  return false;
}

function cleanGoogleTranslation(googleEn, pos) {
  let clean = googleEn.trim();
  if (clean.split(' ').length <= 3) {
    clean = clean.toLowerCase();
  } else {
    clean = clean.charAt(0).toLowerCase() + clean.slice(1);
  }
  if (pos === 'v' && !clean.startsWith('to ')) {
    clean = 'to ' + clean;
  }
  clean = clean.replace(/\.$/, '');
  return clean;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('Reading dictionary...');
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = parseDictionary(src);
  const allKeys = Object.keys(entries);
  console.log(`Parsed ${allKeys.length} entries`);

  const toCheck = allKeys.filter(k => !FUNCTION_WORDS.has(k));
  console.log(`Checking ${toCheck.length} content entries (skipped ${allKeys.length - toCheck.length} function words)`);

  // ── Phase 1: Forward translation (IT→EN) ──────────────────────
  const BATCH_SIZE = 80;
  const forwardTranslations = {};

  const batches = [];
  for (let i = 0; i < toCheck.length; i += BATCH_SIZE) {
    batches.push(toCheck.slice(i, i + BATCH_SIZE));
  }

  console.log(`\nPhase 1: Forward translation (IT→EN) in ${batches.length} batches...`);
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    try {
      const results = await googleTranslateBatch(batch, 'it', 'en');
      for (let j = 0; j < batch.length; j++) {
        forwardTranslations[batch[j]] = results[j];
      }
    } catch (err) {
      console.error(`  Batch ${bi + 1} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const results = await googleTranslateBatch(batch, 'it', 'en');
        for (let j = 0; j < batch.length; j++) {
          forwardTranslations[batch[j]] = results[j];
        }
      } catch (err2) {
        console.error(`  Batch ${bi + 1} retry failed: ${err2.message}`);
      }
    }
    if ((bi + 1) % 10 === 0 || bi === batches.length - 1) {
      console.log(`  ${bi + 1}/${batches.length} (${Object.keys(forwardTranslations).length} done)`);
    }
    if (bi < batches.length - 1) await new Promise(r => setTimeout(r, 80));
  }

  // ── Find forward mismatches ───────────────────────────────────
  console.log(`\nFinding forward mismatches...`);
  const forwardMismatches = [];

  for (const key of toCheck) {
    const dictEn = entries[key].en;
    const googleEn = forwardTranslations[key];
    if (!googleEn) continue;
    if (isGarbageTranslation(googleEn, key)) continue;
    if (dictEn === '?') {
      forwardMismatches.push({ word: key, dictEn, googleEn, pos: entries[key].pos });
      continue;
    }
    if (!contentWordsMatch(dictEn, googleEn)) {
      forwardMismatches.push({ word: key, dictEn, googleEn, pos: entries[key].pos });
    }
  }

  console.log(`Forward mismatches: ${forwardMismatches.length}`);

  // ── Phase 2: Round-trip verification ──────────────────────────
  // Translate the dict English back to Italian, see if it matches the Italian word
  console.log(`\nPhase 2: Round-trip verification (${forwardMismatches.length} entries)...`);

  const dictEnValues = forwardMismatches.map(m => {
    // Strip "to " prefix for verbs to get cleaner back-translation
    let en = m.dictEn;
    if (en.startsWith('to ')) en = en.slice(3);
    // Take first meaning if multiple
    en = en.split(',')[0].split(';')[0].trim();
    return en;
  });

  const roundTripResults = {};
  const rtBatches = [];
  for (let i = 0; i < dictEnValues.length; i += BATCH_SIZE) {
    rtBatches.push({
      words: dictEnValues.slice(i, i + BATCH_SIZE),
      indices: forwardMismatches.slice(i, i + BATCH_SIZE),
    });
  }

  console.log(`  Round-trip in ${rtBatches.length} batches...`);
  for (let bi = 0; bi < rtBatches.length; bi++) {
    const batch = rtBatches[bi];
    try {
      const results = await googleTranslateBatch(batch.words, 'en', 'it');
      for (let j = 0; j < batch.indices.length; j++) {
        roundTripResults[batch.indices[j].word] = results[j];
      }
    } catch (err) {
      console.error(`  RT Batch ${bi + 1} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const results = await googleTranslateBatch(batch.words, 'en', 'it');
        for (let j = 0; j < batch.indices.length; j++) {
          roundTripResults[batch.indices[j].word] = results[j];
        }
      } catch (err2) {
        console.error(`  RT Batch ${bi + 1} retry failed`);
      }
    }
    if ((bi + 1) % 5 === 0 || bi === rtBatches.length - 1) {
      console.log(`  ${bi + 1}/${rtBatches.length}`);
    }
    if (bi < rtBatches.length - 1) await new Promise(r => setTimeout(r, 80));
  }

  // ── Phase 3: Determine genuine errors ─────────────────────────
  console.log(`\nPhase 3: Determining genuine errors...`);
  const genuineErrors = [];
  let roundTripSaved = 0;

  for (const mm of forwardMismatches) {
    const rtItalian = roundTripResults[mm.word];

    // If round-trip of dict English produces same Italian word → dict is a valid synonym
    if (rtItalian && italianStemMatch(rtItalian, mm.word)) {
      roundTripSaved++;
      continue;
    }

    // Additional check: if dict entry has multiple meanings (comma/semicolon separated),
    // any one matching is enough
    const dictParts = mm.dictEn.split(/[,;]/).map(s => s.trim());
    if (dictParts.length > 1) {
      let anyPartMatches = false;
      for (const part of dictParts) {
        if (contentWordsMatch(part, mm.googleEn)) {
          anyPartMatches = true;
          break;
        }
      }
      if (anyPartMatches) {
        roundTripSaved++;
        continue;
      }
    }

    // It's a genuine error — Google forward and round-trip both disagree
    genuineErrors.push(mm);
  }

  console.log(`Round-trip saved ${roundTripSaved} valid synonyms`);
  console.log(`Genuine errors: ${genuineErrors.length}`);

  // Save for review
  const outputPath = path.join(__dirname, 'output', 'it-semantic-fixes.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(genuineErrors, null, 2));

  // ── Phase 4: Apply fixes ──────────────────────────────────────
  console.log(`\nPhase 4: Applying ${genuineErrors.length} fixes...`);
  let fixedSrc = src;
  let fixCount = 0;

  for (const mm of genuineErrors) {
    const key = mm.word;
    const dictEn = mm.dictEn;
    const pos = mm.pos;
    const newEn = cleanGoogleTranslation(mm.googleEn, pos);

    if (newEn === dictEn.toLowerCase().trim()) continue;
    if (newEn.toLowerCase() === dictEn.toLowerCase()) continue;

    const escapedDictEn = dictEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const entryRegex = new RegExp(
      `('${escapedKey}':\\s*\\{[^}]*en:\\s*')${escapedDictEn}(')`
    );
    const dqEntryRegex = new RegExp(
      `("${escapedKey}":\\s*\\{[^}]*en:\\s*')${escapedDictEn}(')`
    );

    const safeNewEn = newEn.replace(/'/g, "\\'");

    if (entryRegex.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(entryRegex, `$1${safeNewEn}$2`);
      fixCount++;
    } else if (dqEntryRegex.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(dqEntryRegex, `$1${safeNewEn}$2`);
      fixCount++;
    }
  }

  console.log(`Applied ${fixCount} fixes`);

  if (fixCount > 0) {
    fs.writeFileSync(DICT_PATH, fixedSrc);
    console.log(`Wrote updated dictionary to ${DICT_PATH}`);
  }

  // Print sample fixes
  console.log(`\n=== SAMPLE FIXES ===`);
  for (const e of genuineErrors.slice(0, 30)) {
    console.log(`  ${e.word}: "${e.dictEn}" → "${e.googleEn}"`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total entries: ${allKeys.length}`);
  console.log(`Checked: ${toCheck.length}`);
  console.log(`Forward mismatches: ${forwardMismatches.length}`);
  console.log(`Round-trip saved: ${roundTripSaved}`);
  console.log(`Genuine errors: ${genuineErrors.length}`);
  console.log(`Fixes applied: ${fixCount}`);

  return fixCount;
}

main().then(fixCount => {
  console.log(`\nITALIAN COMPLETE — ${fixCount} fixes`);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
