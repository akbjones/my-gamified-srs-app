/**
 * Swedish Dictionary Semantic Verification — v2 (strict)
 *
 * Strategy:
 * 1. Parse ALL entries from sv.ts
 * 2. Skip function words (~140)
 * 3. Translate ALL remaining via Google (sv→en), batch 80
 * 4. Compare with STRICT overlap — zero content word match → candidate
 * 5. Apply heavy filtering to avoid false positives:
 *    - Skip verb forms where existing has infinitive (correct) and Google gave conjugated
 *    - Skip where existing is a valid synonym (semantic similarity)
 *    - Skip style-only differences (century names, article variants, etc.)
 *    - Skip where Google returned garbage
 * 6. For TRUE mismatches only: replace
 * 7. Preserve IPA/POS/lemma
 */

const fs = require('fs');
const https = require('https');

const DICT_PATH = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd/src/data/dictionary/sv.ts';
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// Swedish function words to skip
const FUNCTION_WORDS = new Set([
  'och', 'i', 'att', 'det', 'som', 'en', 'på', 'är', 'av', 'för',
  'med', 'till', 'den', 'har', 'de', 'inte', 'ett', 'om', 'vi', 'från',
  'eller', 'men', 'så', 'kan', 'ska', 'var', 'ha', 'jag', 'du', 'han',
  'hon', 'vi', 'ni', 'dem', 'sig', 'sin', 'sitt', 'sina', 'min', 'mitt',
  'mina', 'din', 'ditt', 'dina', 'hans', 'hennes', 'dess', 'deras', 'vår',
  'vårt', 'våra', 'er', 'ert', 'era', 'denna', 'detta', 'dessa', 'den',
  'det', 'de', 'här', 'där', 'nog', 'ju', 'väl', 'nog', 'ändå', 'dock',
  'då', 'när', 'om', 'hur', 'vad', 'vem', 'var', 'vilken', 'vilket',
  'vilka', 'vars', 'alla', 'allt', 'andra', 'annat', 'annan', 'varje',
  'ingen', 'inget', 'inga', 'någon', 'något', 'några', 'man', 'ens',
  'redan', 'bara', 'också', 'sedan', 'efter', 'innan', 'under', 'över',
  'mellan', 'genom', 'mot', 'vid', 'hos', 'utan', 'samt', 'än', 'varken',
  'antingen', 'dels', 'både', 'heller', 'alltså', 'därför', 'eftersom',
  'emellertid', 'fast', 'ifall', 'medan', 'nämligen', 'trots',
  'ja', 'nej', 'inte', 'mer', 'mest', 'mycket', 'lite', 'här', 'där',
  'upp', 'ner', 'ut', 'in', 'hem', 'bort', 'fram', 'tillbaka',
]);

// Known synonym sets — words that are different but mean similar things
const SYNONYM_SETS = [
  ['shop', 'store', 'business', 'affair'],
  ['begin', 'start', 'commence'],
  ['end', 'finish', 'close', 'conclude', 'cancel'],
  ['tell', 'say', 'narrate', 'relate', 'recount'],
  ['information', 'message', 'news', 'notice'],
  ['decide', 'determine', 'resolve'],
  ['significant', 'considerable', 'considerably', 'substantially'],
  ['aid', 'support', 'assistance', 'help'],
  ['alternative', 'option', 'choice'],
  ['everyone', 'everybody', 'all'],
  ['pull', 'drag', 'draw'],
  ['bicycle', 'bike', 'cycle'],
  ['fog', 'mist', 'haze'],
  ['wet', 'damp', 'moist', 'wetter'],
  ['good', 'well', 'better', 'best', 'top'],
  ['child', 'kid', 'children', 'kids'],
  ['big', 'large', 'great'],
  ['small', 'little', 'tiny'],
  ['happy', 'glad', 'pleased', 'joyful'],
  ['sad', 'unhappy', 'sorrowful'],
  ['beautiful', 'pretty', 'lovely', 'handsome'],
  ['fast', 'quick', 'rapid', 'swift', 'quickly'],
  ['old', 'ancient', 'elderly', 'aged'],
  ['new', 'novel', 'fresh', 'recent'],
  ['look', 'see', 'watch', 'view', 'gaze'],
  ['talk', 'speak', 'chat', 'converse'],
  ['walk', 'stroll', 'go', 'move'],
  ['think', 'believe', 'consider', 'suppose'],
  ['want', 'desire', 'wish'],
  ['like', 'enjoy', 'love', 'appreciate'],
  ['make', 'create', 'produce', 'build'],
  ['place', 'location', 'spot', 'site', 'position'],
  ['road', 'street', 'path', 'way', 'route'],
  ['house', 'home', 'dwelling', 'residence'],
  ['money', 'cash', 'funds', 'currency'],
  ['work', 'job', 'employment', 'labor', 'labour'],
  ['power', 'authority', 'right', 'strength', 'force'],
  ['carry', 'wear', 'bear', 'worn'],
  ['blind', 'dazzle', 'dazzled', 'blinding'],
  ['shine', 'glow', 'gleam', 'shone'],
  ['leaf', 'blade', 'leaves'],
  ['become', 'be', 'get', 'turn'],
  ['flower', 'bloom', 'blossom', 'blooms'],
  ['wide', 'broad', 'width', 'breadth'],
  ['break', 'broke', 'shatter', 'crack'],
  ['bun', 'roll', 'buns', 'rolls'],
  ['bed', 'sleep', 'rest'],
  ['data', 'datum', 'information'],
  ['share', 'divide', 'split', 'distribute', 'divided'],
  ['drive', 'drove', 'push', 'pushed'],
  ['drink', 'drank', 'drunk'],
  ['day', 'days'],
  ['café', 'cafe', 'coffee shop'],
  ['storyteller', 'narrator'],
  ['century', '1800s', '1900s', '1200s', 'nineteenth', 'twentieth', '13th', '19th', '20th'],
  ['disregard', 'aside', 'apart'],
  ['idle', 'linger', 'lingered'],
  ['should', 'ought'],
];

// Build synonym lookup
const synonymMap = new Map();
for (const set of SYNONYM_SETS) {
  for (const word of set) {
    const lower = word.toLowerCase();
    if (!synonymMap.has(lower)) synonymMap.set(lower, new Set());
    for (const other of set) {
      synonymMap.get(lower).add(other.toLowerCase());
    }
  }
}

// ── Parse dictionary entries from sv.ts ──
function parseDictionary(src) {
  const entries = {};
  const re = /^\s*(['"])(.*?)\1\s*:\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[2];
    const body = m[3];
    const enMatch = body.match(/en:\s*'((?:[^'\\]|\\.)*)'/);
    if (!enMatch) continue;
    const en = enMatch[1];
    const ipaMatch = body.match(/ipa:\s*'((?:[^'\\]|\\.)*)'/);
    const posMatch = body.match(/pos:\s*'([^']*)'/);
    const lemmaMatch = body.match(/lemma:\s*'((?:[^'\\]|\\.)*)'/);
    entries[key] = {
      en,
      ipa: ipaMatch ? ipaMatch[1] : '',
      pos: posMatch ? posMatch[1] : undefined,
      lemma: lemmaMatch ? lemmaMatch[1] : undefined,
    };
  }
  return entries;
}

// ── Google Translate batch ──
function translateBatch(words, sourceLang, targetLang) {
  return new Promise((resolve, reject) => {
    const queryParts = words.map(w => `q=${encodeURIComponent(w)}`).join('&');
    const url = `https://translation.googleapis.com/language/translate/v2?${queryParts}&source=${sourceLang}&target=${targetLang}&key=${API_KEY}&format=text`;
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error(`API error: ${json.error.message}`)); return; }
          resolve(json.data.translations.map(t => t.translatedText));
        } catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

// ── Normalize ──
function normalize(s) {
  return s.toLowerCase().replace(/^to\s+/, '').replace(/[^a-z0-9\s]/g, '').trim();
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'it',
  'its', 'this', 'that', 'or', 'and', 'not', 'no', 'but', 'as', 'if',
  'do', 'does', 'did', 'has', 'have', 'had', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'up', 'out', 'off', 'over',
  'so', 'one', 'oneself', 'get', 'got',
]);

function getContentWords(s) {
  return normalize(s).split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function hasContentOverlap(existingEn, googleEn) {
  const existWords = getContentWords(existingEn);
  const googWords = getContentWords(googleEn);
  if (existWords.length === 0 && googWords.length === 0) return true;
  if (existWords.length === 0 || googWords.length === 0) return false;

  const googSet = new Set(googWords);
  for (const w of existWords) {
    if (googSet.has(w)) return true;
    for (const g of googWords) {
      const minLen = Math.min(w.length, g.length);
      if (minLen >= 4 && w.slice(0, 4) === g.slice(0, 4)) return true;
      if (w.length >= 4 && g.length >= 4 && (w.includes(g) || g.includes(w))) return true;
    }
  }
  return false;
}

function hasSynonymOverlap(existingEn, googleEn) {
  const existWords = getContentWords(existingEn);
  const googWords = getContentWords(googleEn);
  for (const ew of existWords) {
    const syns = synonymMap.get(ew);
    if (syns) {
      for (const gw of googWords) {
        if (syns.has(gw)) return true;
      }
    }
  }
  // Also check Google words' synonyms
  for (const gw of googWords) {
    const syns = synonymMap.get(gw);
    if (syns) {
      for (const ew of existWords) {
        if (syns.has(ew)) return true;
      }
    }
  }
  return false;
}

function isGarbageTranslation(svWord, googleEn) {
  const g = googleEn.toLowerCase().trim();
  if (g === svWord.toLowerCase()) return true;
  if (g.length === 0) return true;
  if (g.length === 1) return true;
  if (/[åäöÅÄÖ]/.test(g)) return true;
  return false;
}

function cleanGoogleTranslation(svWord, googleEn, pos) {
  let clean = googleEn.trim().toLowerCase();
  if (pos === 'v' && !clean.startsWith('to ')) {
    clean = 'to ' + clean;
  }
  if (pos && pos !== 'v' && clean.startsWith('to ')) {
    clean = clean.replace(/^to\s+/, '');
  }
  return clean;
}

// Check if a Google translation for a verb is just a conjugated form (not infinitive)
function isConjugatedVerbForm(googleEn) {
  const g = googleEn.toLowerCase().replace(/^to\s+/, '').trim();
  // Common past tense / conjugated patterns
  if (/ed$/.test(g) && g.length > 4) return true;
  if (/^(was|were|been|had|has|did|does|went|came|took|gave|made|said|got|ran|saw|knew|found|thought|told|became|left|felt|put|brought|began|showed|heard|played|moved|paid|met|set|kept|held|stood|lost|wrote|sat|spoke|led|read|grew|drew|broke|drove|rode|chose|fell|ate|drank|sang|swam|threw|caught|taught|built|sent|spent|lent|meant|dealt|hung|spun|struck|shook|froze|woke|wore|bore|tore|swore|hid|bit|blew|flew|knew|grew|drew|slew|withdrew|arose|overcame|forgave|forgot|forbade)\b/.test(g)) return true;
  // Present third person -s
  if (/[^s]s$/.test(g) && g.length > 3 && !/ss$/.test(g)) {
    // Probably third person singular - skip unless it could be a noun
    return true;
  }
  // Past participles
  if (/en$/.test(g) && /^(brok|chos|driv|giv|tak|writ|rid|bit|eat|fall|forgiv|forgott|hid|mistaken|proven|risen|shak|spoken|stolen|sworn|wok|worn|torn|frozen|woven)/.test(g)) return true;
  if (/ung$|unk$|own$|orn$|oken$/.test(g)) return true;
  return false;
}

// ── Do a reverse translation (en→sv) to validate ──
function reverseTranslateBatch(words) {
  return translateBatch(words, 'en', 'sv');
}

async function main() {
  console.log('Reading sv.ts...');
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = parseDictionary(src);
  const keys = Object.keys(entries);
  console.log(`Parsed ${keys.length} dictionary entries`);

  const contentWords = [];
  const skipped = [];
  for (const key of keys) {
    if (FUNCTION_WORDS.has(key)) {
      skipped.push(key);
    } else {
      contentWords.push(key);
    }
  }
  console.log(`Content words to verify: ${contentWords.length}`);
  console.log(`Function words skipped: ${skipped.length}`);

  // Batch translate sv→en
  const BATCH_SIZE = 80;
  const googleTranslations = {};
  const batches = [];
  for (let i = 0; i < contentWords.length; i += BATCH_SIZE) {
    batches.push(contentWords.slice(i, i + BATCH_SIZE));
  }
  console.log(`Processing ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const translations = await translateBatch(batch, 'sv', 'en');
      for (let j = 0; j < batch.length; j++) {
        googleTranslations[batch[j]] = translations[j];
      }
    } catch (err) {
      console.error(`  Batch ${i + 1} FAILED: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const translations = await translateBatch(batch, 'sv', 'en');
        for (let j = 0; j < batch.length; j++) {
          googleTranslations[batch[j]] = translations[j];
        }
      } catch (err2) {
        console.error(`  Batch ${i + 1} retry failed: ${err2.message}`);
      }
    }
    if ((i + 1) % 10 === 0 || i === batches.length - 1) {
      console.log(`  Batch ${i + 1}/${batches.length} done`);
    }
    if (i < batches.length - 1) await new Promise(r => setTimeout(r, 100));
  }

  console.log(`Google translated ${Object.keys(googleTranslations).length} words`);

  // ── Phase 1: Find zero-overlap candidates ──
  const candidates = [];
  for (const key of contentWords) {
    const googleEn = googleTranslations[key];
    if (!googleEn) continue;
    const existing = entries[key];
    if (isGarbageTranslation(key, googleEn)) continue;
    if (!hasContentOverlap(existing.en, googleEn) && !hasSynonymOverlap(existing.en, googleEn)) {
      candidates.push({
        key,
        existing: existing.en,
        google: googleEn.toLowerCase().trim(),
        pos: existing.pos,
        lemma: existing.lemma,
      });
    }
  }
  console.log(`\nZero-overlap candidates (after synonym filter): ${candidates.length}`);

  // ── Phase 2: Heavy filtering ──
  const filtered = [];
  for (const c of candidates) {
    // SKIP: verb entries where existing has infinitive and Google gave conjugated form
    if (c.pos === 'v') {
      const googClean = c.google.replace(/^to\s+/, '').trim();
      if (isConjugatedVerbForm(c.google)) {
        // The existing infinitive is likely correct; Google translated the conjugated Swedish form
        // Only flag if the BASE meaning is different
        // e.g. "bröt" existing="bread" google="broke" — HERE the existing is WRONG
        // vs "betalade" existing="to pay" google="paid" — existing is correct
        const existClean = c.existing.replace(/^to\s+/, '').trim();
        // If existing already starts with "to " it means it has the infinitive — probably correct
        if (c.existing.startsWith('to ')) continue;
      }
    }

    // SKIP: entries where existing has a lemma and the word is an inflected form
    // These naturally won't match Google because Google translates the form, not the lemma
    if (c.lemma && c.lemma !== c.key) {
      // This is an inflected form — Google will translate the form, but our dict has lemma meaning
      // Only flag if meanings are VERY different (not just inflection)
      const existClean = normalize(c.existing);
      const googClean = normalize(c.google);
      // Skip if the existing meaning could be the base form of what Google returned
      // e.g., existing="to pay", google="paid" — skip, same meaning
      if (c.pos === 'v') continue; // Skip all inflected verb forms
    }

    // SKIP: number/century style differences
    if (/^\d/.test(c.key) || /century|hundra|talet/i.test(c.key)) continue;

    // SKIP: proper nouns / place names
    if (/^[A-Z]/.test(c.existing) && (c.pos === 'n' || !c.pos)) continue;

    // SKIP: where Google gave a multi-word phrase and existing is a simple word (might be valid alternate)
    // Actually let's keep these since they could be real errors

    // SKIP: café/cafe style differences
    if (normalize(c.existing) === normalize(c.google)) continue;

    // SKIP: entries that are inflected forms of another entry (have lemma)
    // For non-verbs too, if they have a lemma, the translation is for the base form
    if (c.lemma && c.lemma !== c.key && c.pos !== 'v') {
      // Check if Google's translation is just the inflected/article form of existing
      const existWords = getContentWords(c.existing);
      const googWords = getContentWords(c.google);
      // If Google adds "the" or pluralizes, that's expected for definite/plural Swedish forms
      // e.g., existing="leaf" google="the leaves" — existing is base form, Google got inflected
      // Only flag if completely different meaning
      const existBase = existWords.join(' ');
      const googBase = googWords.join(' ');
      // Check stem similarity
      if (existWords.length > 0 && googWords.length > 0) {
        const e0 = existWords[0];
        const g0 = googWords[googWords.length - 1]; // last content word often the noun
        if (e0.length >= 3 && g0.length >= 3 && e0.slice(0, 3) === g0.slice(0, 3)) continue;
        // Also try all pairs
        let stemMatch = false;
        for (const ew of existWords) {
          for (const gw of googWords) {
            if (ew.length >= 3 && gw.length >= 3 && ew.slice(0, 3) === gw.slice(0, 3)) stemMatch = true;
          }
        }
        if (stemMatch) continue;
      }
    }

    filtered.push(c);
  }

  console.log(`After heavy filtering: ${filtered.length}`);

  // ── Phase 3: Reverse translate to double-check ──
  // Translate existing English → Swedish and see if it matches the key
  // Also translate Google English → Swedish
  // If Google's reverse matches better, it's likely the correct translation
  console.log('\nReverse-translating to validate...');

  const existingEnWords = filtered.map(f => f.existing.replace(/^to\s+/, ''));
  const googleEnWords = filtered.map(f => f.google.replace(/^to\s+/, ''));

  const revBatches1 = [];
  for (let i = 0; i < existingEnWords.length; i += BATCH_SIZE) {
    revBatches1.push({ start: i, words: existingEnWords.slice(i, i + BATCH_SIZE) });
  }
  const revBatches2 = [];
  for (let i = 0; i < googleEnWords.length; i += BATCH_SIZE) {
    revBatches2.push({ start: i, words: googleEnWords.slice(i, i + BATCH_SIZE) });
  }

  const existingReverse = [];
  const googleReverse = [];

  for (const batch of revBatches1) {
    try {
      const trans = await reverseTranslateBatch(batch.words);
      existingReverse.push(...trans);
    } catch (err) {
      console.error(`Reverse batch failed: ${err.message}`);
      existingReverse.push(...batch.words.map(() => ''));
    }
    await new Promise(r => setTimeout(r, 100));
  }

  for (const batch of revBatches2) {
    try {
      const trans = await reverseTranslateBatch(batch.words);
      googleReverse.push(...trans);
    } catch (err) {
      console.error(`Reverse batch failed: ${err.message}`);
      googleReverse.push(...batch.words.map(() => ''));
    }
    await new Promise(r => setTimeout(r, 100));
  }

  // Score: does reverse translation match the Swedish word?
  const finalFixes = [];
  for (let i = 0; i < filtered.length; i++) {
    const f = filtered[i];
    const existRev = (existingReverse[i] || '').toLowerCase();
    const googRev = (googleReverse[i] || '').toLowerCase();
    const svKey = f.key.toLowerCase();

    // Check if existing-reverse matches the Swedish key
    const existRevMatch = existRev === svKey || existRev.includes(svKey) || svKey.includes(existRev);
    // Check if google-reverse matches the Swedish key
    const googRevMatch = googRev === svKey || googRev.includes(svKey) || svKey.includes(googRev);

    // If existing reverse-translates back to the Swedish word, it's probably fine
    if (existRevMatch && !googRevMatch) continue;

    // If neither matches, skip (ambiguous)
    if (!existRevMatch && !googRevMatch) {
      // Still include if Google gave a clear, specific answer
      // But be conservative — skip
      continue;
    }

    // If Google reverse-translates back but existing doesn't, this is likely a real error
    if (googRevMatch && !existRevMatch) {
      const cleanedGoogle = cleanGoogleTranslation(f.key, f.google, f.pos);
      finalFixes.push({
        ...f,
        cleaned: cleanedGoogle,
        existReverse: existRev,
        googleReverse: googRev,
        confidence: 'high',
      });
      continue;
    }

    // Both match — ambiguous, could be synonym. Include only if very different
    // Skip these to be conservative
  }

  console.log(`\nFinal fixes (reverse-validated): ${finalFixes.length}`);

  // Show all fixes
  console.log('\n── All fixes ──');
  for (const fix of finalFixes) {
    console.log(`  ${fix.key}: "${fix.existing}" → "${fix.cleaned}" [rev: exist="${fix.existReverse}" goog="${fix.googleReverse}"]`);
  }

  // Apply fixes
  if (finalFixes.length > 0) {
    console.log(`\nApplying ${finalFixes.length} fixes to sv.ts...`);
    let modified = src;
    let appliedCount = 0;

    for (const fix of finalFixes) {
      const escapedExisting = fix.existing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedKey = fix.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `(['"]${escapedKey}['"]\\s*:\\s*\\{\\s*en:\\s*')${escapedExisting}(')`
      );
      if (pattern.test(modified)) {
        const safeClean = fix.cleaned.replace(/'/g, "\\'");
        modified = modified.replace(pattern, `$1${safeClean}$2`);
        appliedCount++;
      }
    }

    console.log(`Applied ${appliedCount}/${finalFixes.length} replacements`);

    if (appliedCount > 0) {
      fs.writeFileSync(DICT_PATH, modified, 'utf8');
      console.log('File written successfully');
    }
  }

  // Save report
  const reportPath = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd/scripts/output/sv-semantic-verify.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    totalEntries: keys.length,
    contentWordsChecked: contentWords.length,
    functionWordsSkipped: skipped.length,
    googleTranslated: Object.keys(googleTranslations).length,
    zeroOverlapCandidates: candidates.length,
    afterHeavyFiltering: filtered.length,
    finalFixes: finalFixes.length,
    fixes: finalFixes,
  }, null, 2));
  console.log(`Report saved to ${reportPath}`);

  return finalFixes.length;
}

main().then(n => {
  console.log(`\nSWEDISH COMPLETE — ${n} fixes`);
}).catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
