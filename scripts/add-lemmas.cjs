#!/usr/bin/env node
/**
 * Add `lemma` fields to conjugated verb entries across 9 language dictionaries.
 * For each verb entry without a lemma, tries to find the infinitive form
 * in the same dictionary by stripping suffixes and appending infinitive endings.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'src', 'data', 'dictionary');

// Language-specific infinitive endings
const LANG_CONFIG = {
  es: {
    infEndings: ['ar', 'er', 'ir', 'arse', 'erse', 'irse', 'ír'],
    isInfinitive(key) {
      return /(?:ar|er|ir|arse|erse|irse|ír)$/.test(key);
    },
  },
  it: {
    infEndings: ['are', 'ere', 'ire', 'rre', 'arsi', 'ersi', 'irsi', 'orre', 'urre', 'arre'],
    isInfinitive(key) {
      return /(?:are|ere|ire|rre|arsi|ersi|irsi|orre|urre|arre)$/.test(key);
    },
  },
  fr: {
    infEndings: ['er', 'ir', 're', 'oir', 'dre', 'tre', 'ire', 'vre', 'indre', 'endre', 'ondre', 'aître', 'oître'],
    isInfinitive(key) {
      return /(?:er|ir|re|oir)$/.test(key);
    },
  },
  pt: {
    infEndings: ['ar', 'er', 'ir', 'or', 'ôr', 'ar-se', 'er-se', 'ir-se'],
    isInfinitive(key) {
      return /(?:ar|er|ir|ôr|or|ar-se|er-se|ir-se)$/.test(key);
    },
  },
  de: {
    infEndings: ['en', 'ern', 'eln', 'n'],
    isInfinitive(key) {
      return /(?:en|ern|eln)$/.test(key);
    },
  },
  nl: {
    infEndings: ['en', 'ën', 'n'],
    isInfinitive(key) {
      return /(?:en|ën)$/.test(key);
    },
  },
  sv: {
    infEndings: ['a', 'as'],
    isInfinitive(key, enText) {
      // Swedish infinitives end in -a or -as (deponent); some irregular: 'gå', 'se', 'bli' etc
      if (/(?:a|as)$/.test(key)) return true;
      // Also use English translation to catch irregular infinitives
      if (enText && /^to\s/.test(enText)) return true;
      return false;
    },
  },
  cy: {
    infEndings: [],
    isInfinitive(_key, enText) {
      // Welsh has no consistent infinitive ending;
      // use the English translation to detect infinitives ("to X")
      if (enText && /^to\s/.test(enText)) return true;
      return false;
    },
  },
  ru: {
    infEndings: ['ать', 'ять', 'еть', 'ить', 'уть', 'оть', 'ыть', 'ти', 'чь', 'ться', 'сть', 'зть', 'зти', 'сти', 'авать', 'овать', 'евать', 'нуть'],
    isInfinitive(key) {
      return /(?:ать|ять|еть|ить|уть|оть|ыть|ти|чь|ться|сть|зть|зти|сти)$/.test(key);
    },
  },
};

/**
 * Parse the dictionary .ts file and extract all entries.
 * Handles both quoted and unquoted keys.
 */
function parseDictFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');

  const allKeys = new Set();
  const verbKeys = new Set();
  const verbEntries = new Map();

  // Match dictionary entries - handles:
  // "key": { ... }
  // 'key': { ... }
  // key: { ... }
  const entryRegex = /^(\s*)(?:(["'])((?:[^"'\\]|\\.)*)(\2)|([a-zA-ZÀ-ÿа-яА-ЯёЁ\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0B00-\u0B7F\u0C00-\u0C7F\u0D00-\u0D7F\u0E00-\u0E7F\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u0100-\u024F][\w\u0300-\u036fÀ-ÿà-ÿĀ-žа-яА-ЯёЁ\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F-]*))\s*:\s*\{(.+)\}/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(entryRegex);
    if (!match) continue;

    const quoteChar = match[2] || '';
    const key = match[3] || match[5]; // quoted key or unquoted key
    const content = match[6];

    if (!key || !content) continue;

    allKeys.add(key);

    const isVerb = /pos:\s*["']v["']/.test(content);
    if (!isVerb) continue;

    verbKeys.add(key);

    const hasLemma = /lemma:\s*["']/.test(content);
    verbEntries.set(key, {
      lineIndex: i,
      hasLemma,
      quoteChar,
      content,
    });
  }

  return { allKeys, verbKeys, verbEntries, lines };
}

/**
 * Accent-aware stem lookup: for Romance languages, strip accents from stem
 * and try candidates both with and without accents.
 */
function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
}

/**
 * For Portuguese: handle cedilla (ç→c, c→ç before a,o,u)
 */
function ptCedillaVariants(stem, ending) {
  const candidates = [stem + ending];
  // If stem ends with 'c' and ending starts with a/o/u, try ç
  if (stem.endsWith('c') && /^[aou]/.test(ending)) {
    candidates.push(stem.slice(0, -1) + 'ç' + ending);
  }
  // If stem ends with 'ç', try 'c' when followed by e/i
  if (stem.endsWith('ç') && /^[ei]/.test(ending)) {
    candidates.push(stem.slice(0, -1) + 'c' + ending);
  }
  return candidates;
}

/**
 * For Spanish: handle accent variants in stems
 */
function esAccentVariants(stem, ending) {
  const candidates = [stem + ending];
  // Accented vowel → unaccented: á→a, é→e, í→i, ó→o, ú→u
  const accentMap = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
  const unaccentMap = { 'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú' };

  // Try removing accents from stem
  let unaccented = stem;
  for (const [acc, plain] of Object.entries(accentMap)) {
    unaccented = unaccented.replace(new RegExp(acc, 'g'), plain);
  }
  if (unaccented !== stem) candidates.push(unaccented + ending);

  return candidates;
}

/**
 * Try to find the infinitive for a conjugated verb key.
 */
function findLemma(key, verbKeys, lang) {
  const config = LANG_CONFIG[lang];
  const infEndings = config.infEndings;

  // Language-specific handlers
  if (lang === 'de') return findGermanLemma(key, verbKeys);
  if (lang === 'nl') return findDutchLemma(key, verbKeys);
  if (lang === 'sv') return findSwedishLemma(key, verbKeys);
  if (lang === 'cy') return findWelshLemma(key, verbKeys);

  // Minimum stem length: must share at least 2 chars (3 for Russian/Cyrillic)
  const minStem = lang === 'ru' ? 3 : 2;

  // For Romance languages and Russian: progressive trimming
  for (let trim = 1; trim <= Math.min(8, key.length - 1); trim++) {
    const stem = key.slice(0, -trim);
    if (stem.length < minStem) continue;

    for (const ending of infEndings) {
      let candidates = [stem + ending];

      // Language-specific accent/cedilla variants
      if (lang === 'es') {
        candidates = esAccentVariants(stem, ending);
      } else if (lang === 'pt') {
        candidates = ptCedillaVariants(stem, ending);
      } else if (lang === 'fr') {
        // French accent variants: è→e, é→e, ê→e, ë→e etc.
        const plainStem = stripAccents(stem);
        if (plainStem !== stem) candidates.push(plainStem + ending);
      }

      for (const candidate of candidates) {
        if (candidate !== key && verbKeys.has(candidate)) return candidate;
      }
    }
  }

  // For Spanish: also handle diphthong changes (ue→o, ie→e)
  if (lang === 'es') {
    return findSpanishDiphthongLemma(key, verbKeys, infEndings);
  }

  // For Russian: try vowel alternation patterns
  if (lang === 'ru') {
    return findRussianLemma(key, verbKeys, infEndings);
  }

  return null;
}

function findSpanishDiphthongLemma(key, verbKeys, infEndings) {
  // Common diphthong changes in conjugation:
  // ue→o (puedo→poder), ie→e (quiero→querer), ie→i (pido→pedir)
  const diphthongs = [
    { conj: 'ue', base: 'o' },
    { conj: 'ie', base: 'e' },
    { conj: 'ie', base: 'i' },
    { conj: 'ué', base: 'o' },
    { conj: 'ié', base: 'e' },
  ];

  for (const { conj, base } of diphthongs) {
    const idx = key.indexOf(conj);
    if (idx >= 0) {
      const modifiedKey = key.slice(0, idx) + base + key.slice(idx + conj.length);
      for (let trim = 1; trim <= Math.min(6, modifiedKey.length - 1); trim++) {
        const stem = modifiedKey.slice(0, -trim);
        if (stem.length < 1) continue;
        for (const ending of infEndings) {
          const candidates = esAccentVariants(stem, ending);
          for (const candidate of candidates) {
            if (candidate !== key && verbKeys.has(candidate)) return candidate;
          }
        }
      }
    }
  }
  return null;
}

function findRussianLemma(key, verbKeys, infEndings) {
  // Russian consonant alternation patterns in conjugations
  // ж→г (могу→мочь), ш→с, щ→ск/ст, ч→к/т, д→ж, т→ч, з→ж, с→ш
  const alternations = [
    { conj: 'ж', bases: ['г', 'д', 'з'] },
    { conj: 'ш', bases: ['с', 'х'] },
    { conj: 'щ', bases: ['ск', 'ст', 'т'] },
    { conj: 'ч', bases: ['к', 'т'] },
  ];

  for (let trim = 1; trim <= Math.min(6, key.length - 1); trim++) {
    const stem = key.slice(0, -trim);
    if (stem.length < 3) continue;

    for (const { conj, bases } of alternations) {
      if (stem.endsWith(conj)) {
        const baseStem = stem.slice(0, -conj.length);
        if (baseStem.length < 2) continue;
        for (const base of bases) {
          for (const ending of infEndings) {
            const candidate = baseStem + base + ending;
            if (candidate !== key && verbKeys.has(candidate)) return candidate;
          }
        }
      }
    }
  }

  // Also try ё→е replacement
  if (key.includes('ё')) {
    const altKey = key.replace(/ё/g, 'е');
    for (let trim = 1; trim <= Math.min(6, altKey.length - 1); trim++) {
      const stem = altKey.slice(0, -trim);
      if (stem.length < 3) continue;
      for (const ending of infEndings) {
        const candidate = stem + ending;
        if (candidate !== key && verbKeys.has(candidate)) return candidate;
      }
    }
  }

  return null;
}

function findGermanLemma(key, verbKeys) {
  const infEndings = ['en', 'ern', 'eln', 'n'];
  const sepPrefixes = ['an', 'auf', 'aus', 'bei', 'ein', 'mit', 'nach', 'vor', 'zu', 'ab', 'um', 'weg', 'her', 'hin', 'los', 'fest', 'teil', 'statt', 'fern', 'fort', 'heim', 'dar', 'herum', 'zusammen', 'zurück', 'durch', 'über', 'unter', 'wieder', 'heraus', 'herein', 'herunter'];

  // Handle ge- participle: gesagt → sagen
  if (key.startsWith('ge')) {
    const withoutGe = key.slice(2);
    for (let trim = 0; trim <= Math.min(5, withoutGe.length - 1); trim++) {
      const stem = trim === 0 ? withoutGe : withoutGe.slice(0, -trim);
      if (stem.length < 1) continue;
      for (const ending of infEndings) {
        const candidate = stem + ending;
        if (candidate !== key && verbKeys.has(candidate)) return candidate;
      }
    }
  }

  // Handle separable prefix + ge- infix: angefangen → anfangen
  for (const prefix of sepPrefixes) {
    if (key.startsWith(prefix + 'ge')) {
      const rest = key.slice(prefix.length + 2);
      for (let trim = 0; trim <= Math.min(5, rest.length - 1); trim++) {
        const stem = trim === 0 ? rest : rest.slice(0, -trim);
        if (stem.length < 1) continue;
        for (const ending of infEndings) {
          const candidate = prefix + stem + ending;
          if (candidate !== key && verbKeys.has(candidate)) return candidate;
        }
      }
    }
  }

  // Umlaut reversion: ä→a, ö→o, ü→u (conjugated forms often have umlaut)
  const umlautMap = { 'ä': 'a', 'ö': 'o', 'ü': 'u' };
  let deUmlaut = key;
  for (const [uml, plain] of Object.entries(umlautMap)) {
    deUmlaut = deUmlaut.replace(new RegExp(uml, 'g'), plain);
  }

  // Standard trimming (with and without umlaut)
  for (const k of [key, ...(deUmlaut !== key ? [deUmlaut] : [])]) {
    for (let trim = 1; trim <= Math.min(6, k.length - 1); trim++) {
      const stem = k.slice(0, -trim);
      if (stem.length < 1) continue;
      for (const ending of infEndings) {
        const candidate = stem + ending;
        if (candidate !== key && verbKeys.has(candidate)) return candidate;
      }
    }
  }

  return null;
}

function findDutchLemma(key, verbKeys) {
  const infEndings = ['en', 'ën', 'n'];

  // ge- participle
  if (key.startsWith('ge')) {
    const withoutGe = key.slice(2);
    for (let trim = 0; trim <= Math.min(5, withoutGe.length - 1); trim++) {
      const stem = trim === 0 ? withoutGe : withoutGe.slice(0, -trim);
      if (stem.length < 1) continue;
      for (const ending of infEndings) {
        const candidate = stem + ending;
        if (candidate !== key && verbKeys.has(candidate)) return candidate;
      }
    }
  }

  // Dutch vowel doubling/shortening: single→double in open syllables
  // e.g. maak→maken (a→aa), loop→lopen (oo→o)

  // Standard trimming
  for (let trim = 1; trim <= Math.min(6, key.length - 1); trim++) {
    const stem = key.slice(0, -trim);
    if (stem.length < 1) continue;
    for (const ending of infEndings) {
      const candidate = stem + ending;
      if (candidate !== key && verbKeys.has(candidate)) return candidate;

      // Try vowel doubling: if stem ends in single vowel+consonant, try doubling the vowel
      // maak → mak + en = maken? No, maakt → stem maak, trim t, maak+en=maaken (wrong)
      // Actually: maakt → stem maak, need to go to mak → maken
      // So try removing double vowel → single: maakt → maak → trim 1 → maa → maa+ken? No
      // Better: if stem has double vowel, try single
      const dvMatch = stem.match(/^(.*)([aeiou])\2(.*)$/);
      if (dvMatch) {
        const shortStem = dvMatch[1] + dvMatch[2] + dvMatch[3];
        const candidate2 = shortStem + ending;
        if (candidate2 !== key && verbKeys.has(candidate2)) return candidate2;
      }
    }
  }

  return null;
}

function findSwedishLemma(key, verbKeys) {
  const infEndings = ['a', 'as'];

  // Swedish: -ar → -a, -er → -a, -ade → -a, -de → -a, -te → -a, -at → -a, -t → -a, -s → base
  for (let trim = 1; trim <= Math.min(6, key.length - 1); trim++) {
    const stem = key.slice(0, -trim);
    if (stem.length < 1) continue;
    for (const ending of infEndings) {
      const candidate = stem + ending;
      if (candidate !== key && verbKeys.has(candidate)) return candidate;
    }
    // Also try stem directly (some group 3 verbs: bor → bo)
    if (verbKeys.has(stem) && stem !== key) return stem;
  }

  return null;
}

function findWelshLemma(key, verbKeys) {
  // Welsh conjugations: person endings on verb stems
  // Try trimming endings and looking up the base form
  const endings = ['af', 'i', 'a', 'wn', 'wch', 'an', 'ais', 'aist', 'odd', 'on', 'och', 'ith',
    'wyd', 'ir', 'id', 'ent', 'oedd', 'em', 'et', 'es', 'ed', 'iff', 'ech', 'en',
    'ais', 'ai', 'asai', 'asen', 'asech', 'asent',
    'io', 'iodd', 'ion', 'ioch', 'iant'];

  for (const ending of endings) {
    if (key.endsWith(ending) && key.length > ending.length + 1) {
      const stem = key.slice(0, -ending.length);
      // Try stem + common infinitive shapes
      const infTries = [stem, stem + 'u', stem + 'i', stem + 'o', stem + 'io', stem + 'ed', stem + 'yd'];
      for (const candidate of infTries) {
        if (candidate !== key && verbKeys.has(candidate)) return candidate;
      }
    }
  }

  // Try soft mutation reversals
  const mutations = [
    [/^g(.+)/, 'c$1'],
    [/^b(.+)/, 'p$1'],
    [/^d(.+)/, 't$1'],
    [/^f(.+)/, 'b$1'],
    [/^f(.+)/, 'm$1'],
    [/^dd(.+)/, 'd$1'],
    [/^l(.+)/, 'll$1'],
    [/^r(.+)/, 'rh$1'],
  ];

  for (const [pattern, replacement] of mutations) {
    if (pattern.test(key)) {
      const candidate = key.replace(pattern, replacement);
      if (candidate !== key && verbKeys.has(candidate)) return candidate;
    }
  }

  // g-drop (vowel-initial = might have lost g-)
  if (/^[aeiouâêîôûŵŷ]/i.test(key)) {
    const candidate = 'g' + key;
    if (verbKeys.has(candidate)) return candidate;
  }

  return null;
}

/**
 * Extract lemma from English translation hint.
 * Many entries have patterns like "to X (infinitive)" in the en field.
 * Returns the hint even if the infinitive isn't in the dictionary,
 * since it's an explicit statement of the base form.
 */
function extractLemmaFromTranslation(enText, verbKeys, lang) {
  // Pattern: "(infinitive)" at the end, e.g. "to bore (aburrir)"
  const parenMatch = enText.match(/\(([^)]+)\)\s*$/);
  if (parenMatch) {
    let hint = parenMatch[1].trim();
    // Remove leading "to " if present
    hint = hint.replace(/^to\s+/, '');
    // Remove trailing qualifiers like "subj.", "past part.", etc
    hint = hint.replace(/\s+(subj\.|past\s+part\.|imp\.|cond\.|fut\.|pres\.|inf\.).*$/i, '');
    hint = hint.trim();

    if (!hint || hint.includes(' ')) return null; // multi-word hints are ambiguous

    // Validate: the hint should look like an infinitive for the language
    const config = LANG_CONFIG[lang];
    if (config.isInfinitive(hint) || verbKeys.has(hint)) {
      return hint;
    }
    // For Welsh, accept any hint that exists as a verb
    if (lang === 'cy' && verbKeys.has(hint)) return hint;
  }
  return null;
}

/**
 * Process a single language dictionary.
 */
function processLanguage(lang) {
  const filePath = path.join(BASE, `${lang}.ts`);
  if (!fs.existsSync(filePath)) {
    console.log(`  [${lang}] File not found, skipping.`);
    return null;
  }

  const { allKeys, verbKeys, verbEntries, lines } = parseDictFile(filePath);
  const config = LANG_CONFIG[lang];

  let totalVerbs = verbEntries.size;
  let infinitives = 0;
  let alreadyHasLemma = 0;
  let lemmasAdded = 0;
  let unresolved = 0;
  const unresolvedKeys = [];

  const modifications = [];

  for (const [key, info] of verbEntries) {
    if (info.hasLemma) {
      alreadyHasLemma++;
      continue;
    }

    // Check if this key IS an infinitive
    const enMatch = info.content.match(/en:\s*["']([^"']+)["']/);
    const enText = enMatch ? enMatch[1] : '';
    if (config.isInfinitive(key, enText)) {
      infinitives++;
      continue;
    }

    // Try extracting lemma from English translation hint first (most reliable)
    let lemma = null;
    if (enText) {
      lemma = extractLemmaFromTranslation(enText, verbKeys, lang);
    }

    // If no hint, try to find lemma by stem + ending lookup
    if (!lemma) {
      lemma = findLemma(key, verbKeys, lang);
    }

    if (lemma) {
      modifications.push({ lineIndex: info.lineIndex, key, lemma });
      lemmasAdded++;
    } else {
      unresolved++;
      if (unresolvedKeys.length < 20) unresolvedKeys.push(key);
    }
  }

  // Apply modifications to lines
  for (const mod of modifications) {
    const line = lines[mod.lineIndex];
    const posMatch = line.match(/(pos:\s*["']v["'])/);
    if (posMatch) {
      // Use same quote char as the pos field
      const quoteChar = line.includes("pos: '") ? "'" : '"';
      const lemmaStr = `, lemma: ${quoteChar}${mod.lemma}${quoteChar}`;
      lines[mod.lineIndex] = line.replace(
        posMatch[1],
        posMatch[1] + lemmaStr
      );
    }
  }

  // Write back
  fs.writeFileSync(filePath, lines.join('\n'));

  return {
    lang,
    totalVerbs,
    infinitives,
    alreadyHasLemma,
    lemmasAdded,
    unresolved,
    unresolvedSample: unresolvedKeys,
  };
}

// ── Main ──────────────────────────────────────────────────────
const languages = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'ru'];

console.log('Adding lemma fields to conjugated verb entries...\n');

const results = [];
for (const lang of languages) {
  console.log(`Processing ${lang.toUpperCase()}...`);
  const stats = processLanguage(lang);
  if (stats) {
    results.push(stats);
    console.log(`  Total verbs: ${stats.totalVerbs}`);
    console.log(`  Infinitives (skipped): ${stats.infinitives}`);
    console.log(`  Already had lemma: ${stats.alreadyHasLemma}`);
    console.log(`  Lemmas added: ${stats.lemmasAdded}`);
    console.log(`  Unresolved: ${stats.unresolved}`);
    if (stats.unresolvedSample.length > 0) {
      console.log(`  Unresolved sample: ${stats.unresolvedSample.join(', ')}`);
    }
    console.log();
  }
}

console.log('\n=== SUMMARY ===');
console.log('Lang  | Total | Infinit | Existing | Added | Unresolved');
console.log('------+-------+---------+----------+-------+-----------');
let totalAdded = 0;
for (const r of results) {
  totalAdded += r.lemmasAdded;
  console.log(
    `${r.lang.toUpperCase().padEnd(5)} | ${String(r.totalVerbs).padStart(5)} | ${String(r.infinitives).padStart(7)} | ${String(r.alreadyHasLemma).padStart(8)} | ${String(r.lemmasAdded).padStart(5)} | ${r.unresolved}`
  );
}
console.log(`\nTotal lemmas added: ${totalAdded}`);
