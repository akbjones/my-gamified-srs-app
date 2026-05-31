#!/usr/bin/env node
/**
 * Exhaustive QC Engine — checks EVERY card and EVERY dictionary entry
 * across all 11 languages. Not sampling — full coverage.
 *
 * Usage: node scripts/exhaustive-qc.cjs
 * Output: scripts/output/exhaustive-qc-report.json + stdout summary
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'quest-audio');

// ── Language config ──────────────────────────────────────────
const LANGUAGES = [
  { code: 'es', folder: 'spanish',    dictFile: 'es.ts', dictVar: 'dictionary' },
  { code: 'it', folder: 'italian',    dictFile: 'it.ts', dictVar: 'dictionary' },
  { code: 'fr', folder: 'french',     dictFile: 'fr.ts', dictVar: 'dictionary' },
  { code: 'pt', folder: 'portuguese', dictFile: 'pt.ts', dictVar: 'dictionary' },
  { code: 'de', folder: 'german',     dictFile: 'de.ts', dictVar: 'DICT' },
  { code: 'nl', folder: 'dutch',      dictFile: 'nl.ts', dictVar: 'dictionary' },
  { code: 'sv', folder: 'swedish',    dictFile: 'sv.ts', dictVar: 'dictionary' },
  { code: 'cy', folder: 'welsh',      dictFile: 'cy.ts', dictVar: 'dict' },
  { code: 'hi', folder: 'hindi',      dictFile: 'hi.ts', dictVar: 'dictionary' },
  { code: 'tr', folder: 'turkish',    dictFile: 'tr.ts', dictVar: 'dictionary' },
  { code: 'ru', folder: 'russian',    dictFile: 'ru.ts', dictVar: 'dictionary' },
];

// Valid POS tags
const VALID_POS = new Set(['n', 'v', 'adj', 'adv', 'prep', 'conj', 'det', 'pron', 'intj', 'num', 'part', 'postp', 'phrase', '']);

// IPA-specific characters (beyond basic Latin)
const IPA_CHARS = /[ˈˌɛɔʃʒŋɲʎʤʧθðæɑɒɜʊɪəɾɹɫɬβɣɥɸʁχʝçɟɖɳɭɽʈɻʂʐɕʑɰɮʔɐʌœøɵʉɤɯɨʘǃǂǁɓɗʄɠʛɦɧɡɢɴʀʙʜɱɰɝɚɘɞɶɑ̃ɔ̃ɛ̃ːˑ̥̤̰̊̈̽ˆˇ˘˙˜˞]/;
// Also count characters with code > 0x0100 as potential IPA
function hasIPAChars(s) {
  if (!s || s.trim() === '') return false;
  if (IPA_CHARS.test(s)) return true;
  // Check for any char above basic Latin (IPA extensions, Cyrillic, Devanagari, etc.)
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code > 0x0100) return true;
  }
  // Check for brackets commonly used in IPA transcriptions
  if (/[\[\]\/]/.test(s)) return true;
  // Check for common IPA diacritics and length marks
  if (/[ː̃̂̀́]/.test(s)) return true;
  return false;
}

// ── Parse dictionary .ts file ────────────────────────────────
function parseDictionary(filePath, varName) {
  const src = fs.readFileSync(filePath, 'utf8');
  const entries = {};

  // Find the dictionary object declaration
  // Match patterns like:  'word': { en: '...', ipa: '...', pos: '...', lemma: '...' }
  // or:                   "word": { en: "...", ipa: "...", pos: "...", lemma: "..." }
  const entryRegex = /^\s*(?:'([^']+)'|"([^"]+)")\s*:\s*\{([^}]*)\}/gm;

  // We need to find the section after the dictionary variable declaration
  // Find the line that declares the dictionary
  const varPatterns = [
    new RegExp(`(?:export )?(?:const )${varName}\\s*(?::\\s*Record<[^>]+>)?\\s*=\\s*\\{`, 'm'),
  ];

  let dictStart = -1;
  for (const pat of varPatterns) {
    const m = src.match(pat);
    if (m) {
      dictStart = src.indexOf(m[0]);
      break;
    }
  }

  if (dictStart === -1) {
    console.error(`  [WARN] Could not find dictionary variable '${varName}' in ${filePath}`);
    return entries;
  }

  // Extract from dictStart to end (or to the closing of the object)
  const dictSection = src.slice(dictStart);

  let match;
  while ((match = entryRegex.exec(dictSection)) !== null) {
    const key = match[1] || match[2];
    const body = match[3];

    const entry = {};

    // Parse en
    const enMatch = body.match(/en\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    if (enMatch) entry.en = enMatch[1] || enMatch[2] || '';

    // Parse ipa
    const ipaMatch = body.match(/ipa\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    if (ipaMatch) entry.ipa = ipaMatch[1] || ipaMatch[2] || '';

    // Parse pos
    const posMatch = body.match(/pos\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    if (posMatch) entry.pos = posMatch[1] || posMatch[2] || '';
    else entry.pos = '';

    // Parse lemma
    const lemmaMatch = body.match(/lemma\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
    if (lemmaMatch) entry.lemma = lemmaMatch[1] || lemmaMatch[2];

    entries[key] = entry;
  }

  return entries;
}

// ── Tokenize target sentence ─────────────────────────────────
function tokenize(sentence, langCode) {
  if (!sentence) return [];

  // For Hindi/Russian (non-Latin scripts), split on whitespace and strip punctuation
  // For Latin scripts, also handle apostrophes and hyphens
  let cleaned = sentence;

  // Remove common punctuation but keep apostrophes and hyphens within words
  // First, normalize various quote/apostrophe characters
  cleaned = cleaned.replace(/[\u2018\u2019\u201A\u201B]/g, "'"); // smart quotes → '
  cleaned = cleaned.replace(/[\u2013\u2014]/g, '-'); // en/em dash → -

  // Remove sentence-level punctuation
  cleaned = cleaned.replace(/[¿¡.,!?;:"""«»()…\[\]{}~@#$%^&*_+=<>|\\\/\u0964\u0965]/g, ' ');

  // Split on whitespace
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  // Lowercase (works for Latin scripts; Devanagari/Cyrillic don't have case)
  return tokens.map(t => t.toLowerCase().trim()).filter(t => t.length > 0);
}

// ── Simple suffix stripping for lookup simulation ────────────
function tryLookup(word, dict) {
  if (!word) return false;
  const w = word.toLowerCase();

  // Direct match
  if (dict[w]) return true;

  // Try removing common suffixes (1-4 chars) and check
  for (let i = 1; i <= Math.min(4, w.length - 1); i++) {
    const stem = w.slice(0, -i);
    if (stem.length >= 2 && dict[stem]) return true;
  }

  // Try common plural/gender variations
  if (w.endsWith('s') && dict[w.slice(0, -1)]) return true;
  if (w.endsWith('es') && dict[w.slice(0, -2)]) return true;
  if (w.endsWith('en') && dict[w.slice(0, -2)]) return true;
  if (w.endsWith('e') && dict[w.slice(0, -1)]) return true;

  // Try gender swap (Romance languages)
  if (w.endsWith('a') && dict[w.slice(0, -1) + 'o']) return true;
  if (w.endsWith('o') && dict[w.slice(0, -1) + 'a']) return true;

  // Try with apostrophe contractions (French: l', d', n', j', etc.)
  if (w.includes("'")) {
    const parts = w.split("'");
    // Check both parts
    let allFound = true;
    for (const p of parts) {
      if (p.length > 0 && !dict[p]) {
        // Also try suffix stripping on parts
        let partFound = false;
        for (let i = 1; i <= Math.min(3, p.length - 1); i++) {
          if (dict[p.slice(0, -i)]) { partFound = true; break; }
        }
        if (!partFound) allFound = false;
      }
    }
    if (allFound) return true;
  }

  return false;
}

// ── Check 1: Word ↔ Dictionary Coverage ──────────────────────
function checkWordCoverage(deck, dict, langCode) {
  const wordFreq = {};

  for (const card of deck) {
    const tokens = tokenize(card.target, langCode);
    for (const tok of tokens) {
      wordFreq[tok] = (wordFreq[tok] || 0) + 1;
    }
  }

  const uniqueWords = Object.keys(wordFreq);
  let found = 0;
  const missing = {};

  for (const word of uniqueWords) {
    if (tryLookup(word, dict)) {
      found++;
    } else {
      missing[word] = wordFreq[word];
    }
  }

  // Sort missing by frequency (descending)
  const topMissing = Object.entries(missing)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, freq]) => ({ word, freq }));

  return {
    totalUnique: uniqueWords.length,
    found,
    missing: Object.keys(missing).length,
    missingPct: ((Object.keys(missing).length / uniqueWords.length) * 100).toFixed(1) + '%',
    topMissing,
  };
}

// ── Check 2: Dictionary Self-Consistency ─────────────────────
function checkDictConsistency(dict) {
  const keys = Object.keys(dict);
  let brokenLemmas = 0;
  let plainTextIPA = 0;
  let invalidPOS = 0;
  let untranslated = 0;

  const brokenLemmaList = [];
  const plainIPAList = [];
  const invalidPOSList = [];
  const untranslatedList = [];

  for (const key of keys) {
    const entry = dict[key];

    // Check lemma references
    if (entry.lemma) {
      // Clean lemma (remove accent marks that might be in reference form)
      const lemmaClean = entry.lemma.replace(/[\u0301\u0300\u0302\u0308]/g, '');
      if (!dict[entry.lemma] && !dict[lemmaClean] && !dict[entry.lemma.toLowerCase()]) {
        brokenLemmas++;
        if (brokenLemmaList.length < 20) brokenLemmaList.push({ key, lemma: entry.lemma });
      }
    }

    // Check IPA
    if (entry.ipa !== undefined) {
      if (!hasIPAChars(entry.ipa)) {
        plainTextIPA++;
        if (plainIPAList.length < 20) plainIPAList.push({ key, ipa: entry.ipa });
      }
    }

    // Check POS
    const pos = (entry.pos || '').trim();
    if (!VALID_POS.has(pos)) {
      invalidPOS++;
      if (invalidPOSList.length < 20) invalidPOSList.push({ key, pos });
    }

    // Check untranslated (en same as key)
    if (entry.en && entry.en.toLowerCase().trim() === key.toLowerCase().trim()) {
      untranslated++;
      if (untranslatedList.length < 20) untranslatedList.push(key);
    }
  }

  return {
    totalEntries: keys.length,
    brokenLemmas,
    brokenLemmaList,
    plainTextIPA,
    plainIPAList,
    invalidPOS,
    invalidPOSList,
    untranslated,
    untranslatedList,
  };
}

// ── Check 3: Duplicate/Template Detection ────────────────────
function checkDuplicates(deck) {
  // Exact English duplicates
  const engMap = {};
  for (const card of deck) {
    const eng = (card.english || '').trim();
    if (!engMap[eng]) engMap[eng] = [];
    engMap[eng].push(card.id);
  }

  const exactDupeGroups = [];
  for (const [eng, ids] of Object.entries(engMap)) {
    if (ids.length >= 2) {
      exactDupeGroups.push({ english: eng, ids, count: ids.length });
    }
  }

  // Near-duplicates: replace capitalized words with X
  const normalizedMap = {};
  for (const card of deck) {
    const eng = (card.english || '').trim();
    // Replace capitalized words (except first word of sentence) with X
    const words = eng.split(/\s+/);
    const normalized = words.map((w, i) => {
      // If it starts with uppercase and is not the first word, or if it's a proper noun
      // (starts with uppercase and isn't common English word)
      if (i > 0 && /^[A-Z]/.test(w)) return 'X';
      // First word: check if it's a name (not a common English starter)
      if (i === 0 && /^[A-Z][a-z]+$/.test(w)) {
        const commonStarters = new Set(['I', 'The', 'A', 'An', 'My', 'We', 'You', 'He', 'She', 'It', 'They', 'Our', 'Your', 'His', 'Her', 'Its', 'Their', 'This', 'That', 'These', 'Those', 'There', 'Here', 'What', 'Where', 'When', 'Who', 'How', 'Why', 'Which', 'Do', 'Does', 'Did', 'Is', 'Are', 'Was', 'Were', 'Have', 'Has', 'Had', 'Can', 'Could', 'Would', 'Should', 'Will', 'Shall', 'May', 'Might', 'Must', 'Let', 'Please', 'Every', 'Each', 'Some', 'No', 'Not', 'All', 'Both', 'Either', 'Neither', 'If', 'After', 'Before', 'During', 'Since', 'Until', 'While', 'Although', 'Because', 'So', 'But', 'And', 'Or', 'Nor', 'For', 'Yet', 'Still', 'Most', 'Many', 'Much', 'Few', 'Several', 'Only', 'Just', 'Even', 'Also', 'Too', 'Very', 'Really', 'Quite', 'Rather', 'Almost', 'Nearly', 'Hardly', 'Barely', 'Absolutely', 'Actually', 'Apparently', 'Certainly', 'Clearly', 'Definitely', 'Fortunately', 'Generally', 'Honestly', 'Hopefully', 'Ideally', 'Incidentally', 'Luckily', 'Obviously', 'Personally', 'Possibly', 'Presumably', 'Probably', 'Recently', 'Strangely', 'Supposedly', 'Surprisingly', 'Traditionally', 'Typically', 'Unfortunately', 'Usually', 'Sometimes', 'Always', 'Never', 'Often', 'Rarely', 'Seldom', 'Suddenly', 'Immediately', 'Eventually', 'Finally', 'First', 'Last', 'Next', 'Then', 'Now', 'Today', 'Tomorrow', 'Yesterday', 'Already', 'Soon']);
        if (!commonStarters.has(w)) return 'X';
      }
      return w;
    }).join(' ');

    if (!normalizedMap[normalized]) normalizedMap[normalized] = [];
    normalizedMap[normalized].push(card.id);
  }

  const templateGroups = [];
  for (const [normalized, ids] of Object.entries(normalizedMap)) {
    if (ids.length >= 3) {
      templateGroups.push({ normalized, ids, count: ids.length });
    }
  }

  return {
    exactDupes: exactDupeGroups.length,
    exactDupeCards: exactDupeGroups.reduce((sum, g) => sum + g.count, 0),
    templateGroups: templateGroups.length,
    groups: [
      ...exactDupeGroups.slice(0, 20).map(g => ({ type: 'exact', ...g })),
      ...templateGroups.slice(0, 20).map(g => ({ type: 'template', ...g })),
    ],
  };
}

// ── Check 4: Structural Rules ────────────────────────────────
function checkStructural(deck, langCode) {
  const issues = {
    node01TooLong: 0,
    node01TooLongCards: [],
    emptyFields: 0,
    emptyFieldCards: [],
    missingGeneralTag: 0,
    missingGeneralTagCards: [],
    idGaps: 0,
    idGapDetails: [],
    nodeOrderViolations: 0,
    nodeOrderDetails: [],
    audioMissing: 0,
    audioMissingCards: [],
  };

  // Check node-01 sentence length
  for (const card of deck) {
    if (card.grammarNode === 'node-01') {
      const wordCount = (card.english || '').split(/\s+/).filter(Boolean).length;
      if (wordCount > 15) {
        issues.node01TooLong++;
        if (issues.node01TooLongCards.length < 10) {
          issues.node01TooLongCards.push({ id: card.id, english: card.english, words: wordCount });
        }
      }
    }
  }

  // Check empty fields
  const requiredFields = ['target', 'english', 'audio', 'grammarNode', 'tags'];
  for (const card of deck) {
    for (const field of requiredFields) {
      const val = card[field];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        issues.emptyFields++;
        if (issues.emptyFieldCards.length < 20) {
          issues.emptyFieldCards.push({ id: card.id, field });
        }
      }
    }
  }

  // Check "general" tag
  for (const card of deck) {
    if (!card.tags || !card.tags.includes('general')) {
      issues.missingGeneralTag++;
      if (issues.missingGeneralTagCards.length < 10) {
        issues.missingGeneralTagCards.push(card.id);
      }
    }
  }

  // Check ID sequentiality
  // IDs can be "es-0001" or numeric
  const ids = deck.map(c => {
    const id = String(c.id);
    const numMatch = id.match(/(\d+)$/);
    return numMatch ? parseInt(numMatch[1]) : null;
  }).filter(n => n !== null);

  if (ids.length > 0) {
    const sorted = [...ids].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        issues.idGaps++;
        if (issues.idGapDetails.length < 10) {
          issues.idGapDetails.push({ after: sorted[i - 1], before: sorted[i], gap: sorted[i] - sorted[i - 1] - 1 });
        }
      }
    }
  }

  // Check node ordering is monotonic
  let lastNodeNum = 0;
  for (let i = 0; i < deck.length; i++) {
    const card = deck[i];
    const nodeMatch = (card.grammarNode || '').match(/node-(\d+)/);
    if (nodeMatch) {
      const nodeNum = parseInt(nodeMatch[1]);
      if (nodeNum < lastNodeNum) {
        issues.nodeOrderViolations++;
        if (issues.nodeOrderDetails.length < 10) {
          issues.nodeOrderDetails.push({
            id: card.id,
            index: i,
            node: card.grammarNode,
            prevNode: `node-${String(lastNodeNum).padStart(2, '0')}`,
          });
        }
      }
      lastNodeNum = Math.max(lastNodeNum, nodeNum);
    }
  }

  // Check audio files exist
  for (const card of deck) {
    if (card.audio) {
      const audioPath = path.join(AUDIO_DIR, card.audio);
      if (!fs.existsSync(audioPath)) {
        issues.audioMissing++;
        if (issues.audioMissingCards.length < 20) {
          issues.audioMissingCards.push({ id: card.id, audio: card.audio });
        }
      }
    }
  }

  return issues;
}

// ── Check 5: Grammar Tip Quality ─────────────────────────────
function checkGrammarTips(deck) {
  let withTip = 0;
  let withoutTip = 0;

  const tipCounts = {};
  let conjugationPatterns = 0;
  const conjugationExamples = [];

  // Patterns that suggest conjugation tables
  const conjPatterns = [
    /[-–]\s*[aeiouyáéíóúàèìòùäöü]{1,3}\s*,\s*[-–]?\s*[aeiouyáéíóúàèìòùäöü]{1,3}\s*,\s*[-–]?\s*[aeiouyáéíóúàèìòùäöü]{1,3}/i,
    /\b(yo|tú|él|ella|nosotros|vosotros|ellos)\b.*[-–>→]\s/i,
    /\b(io|tu|lui|lei|noi|voi|loro)\b.*[-–>→]\s/i,
    /\b(je|tu|il|elle|nous|vous|ils|elles)\b.*[-–>→]\s/i,
    /\b(eu|tu|ele|ela|nós|vós|eles|elas)\b.*[-–>→]\s/i,
    /endings?:?\s+[-–]?\w{1,4}\s*,\s*[-–]?\w{1,4}\s*,\s*[-–]?\w{1,4}/i,
    /1st\s+(?:person|pers).*2nd\s+(?:person|pers)/i,
  ];

  for (const card of deck) {
    const tip = card.grammar || card.grammarTip || '';
    if (tip && tip.trim().length > 0) {
      withTip++;
      tipCounts[tip.trim()] = (tipCounts[tip.trim()] || 0) + 1;

      // Check for conjugation patterns
      for (const pat of conjPatterns) {
        if (pat.test(tip)) {
          conjugationPatterns++;
          if (conjugationExamples.length < 10) {
            conjugationExamples.push({ id: card.id, tip: tip.slice(0, 120) });
          }
          break;
        }
      }
    } else {
      withoutTip++;
    }
  }

  const total = deck.length;
  const coverage = ((withTip / total) * 100).toFixed(1) + '%';

  // Top repeated tips
  const topRepeated = Object.entries(tipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tip, count]) => ({ tip: tip.slice(0, 150), count }));

  return {
    total,
    withTip,
    withoutTip,
    coverage,
    topRepeated,
    conjugationPatterns,
    conjugationExamples,
  };
}

// ── Main ─────────────────────────────────────────────────────
function main() {
  console.log('='.repeat(70));
  console.log('  EXHAUSTIVE QC ENGINE — Checking all cards & dictionaries');
  console.log('='.repeat(70));
  console.log();

  const report = {
    timestamp: new Date().toISOString(),
    languages: {},
  };

  const summaryRows = [];

  for (const lang of LANGUAGES) {
    const code = lang.code;
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  Processing: ${code.toUpperCase()} (${lang.folder})`);
    console.log(`${'─'.repeat(50)}`);

    // Load deck
    const deckPath = path.join(ROOT, 'src', 'data', lang.folder, 'deck.json');
    let deck;
    try {
      deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
      console.log(`  Deck loaded: ${deck.length} cards`);
    } catch (e) {
      console.error(`  ERROR loading deck: ${e.message}`);
      continue;
    }

    // Load dictionary
    const dictPath = path.join(ROOT, 'src', 'data', 'dictionary', lang.dictFile);
    let dict;
    try {
      dict = parseDictionary(dictPath, lang.dictVar);
      const dictSize = Object.keys(dict).length;
      console.log(`  Dictionary loaded: ${dictSize} entries`);
      if (dictSize === 0) {
        console.error(`  WARNING: Dictionary is empty! Check parser.`);
      }
    } catch (e) {
      console.error(`  ERROR loading dictionary: ${e.message}`);
      dict = {};
    }

    // Run all checks
    console.log('  Running Check 1: Word ↔ Dictionary Coverage...');
    const wordCoverage = checkWordCoverage(deck, dict, code);

    console.log('  Running Check 2: Dictionary Self-Consistency...');
    const dictConsistency = checkDictConsistency(dict);

    console.log('  Running Check 3: Duplicate/Template Detection...');
    const duplicates = checkDuplicates(deck);

    console.log('  Running Check 4: Structural Rules...');
    const structural = checkStructural(deck, code);

    console.log('  Running Check 5: Grammar Tip Quality...');
    const grammarTips = checkGrammarTips(deck);

    // Print quick summary
    console.log(`\n  Results for ${code.toUpperCase()}:`);
    console.log(`    Words: ${wordCoverage.found}/${wordCoverage.totalUnique} covered (${wordCoverage.missingPct} missing)`);
    console.log(`    Dict: ${dictConsistency.totalEntries} entries, ${dictConsistency.brokenLemmas} broken lemmas, ${dictConsistency.plainTextIPA} plain IPA`);
    console.log(`    Dupes: ${duplicates.exactDupes} exact, ${duplicates.templateGroups} template groups`);
    console.log(`    Structure: ${structural.audioMissing} audio missing, ${structural.emptyFields} empty fields, ${structural.nodeOrderViolations} order violations`);
    console.log(`    Grammar: ${grammarTips.coverage} coverage, ${grammarTips.conjugationPatterns} conjugation patterns`);

    report.languages[code] = {
      wordCoverage,
      dictConsistency,
      duplicates,
      structural,
      grammarTips,
    };

    summaryRows.push({
      lang: code.toUpperCase(),
      cards: deck.length,
      dictEntries: dictConsistency.totalEntries,
      wordsCov: `${wordCoverage.found}/${wordCoverage.totalUnique}`,
      missingPct: wordCoverage.missingPct,
      brokenLemmas: dictConsistency.brokenLemmas,
      plainIPA: dictConsistency.plainTextIPA,
      invalidPOS: dictConsistency.invalidPOS,
      exactDupes: duplicates.exactDupes,
      templateGrps: duplicates.templateGroups,
      audioMissing: structural.audioMissing,
      emptyFields: structural.emptyFields,
      nodeOrder: structural.nodeOrderViolations,
      tipCoverage: grammarTips.coverage,
      conjPatterns: grammarTips.conjugationPatterns,
    });
  }

  // Write JSON report
  const outputPath = path.join(ROOT, 'scripts', 'output', 'exhaustive-qc-report.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to: ${outputPath}`);

  // Print summary table
  console.log('\n' + '='.repeat(140));
  console.log('  SUMMARY TABLE');
  console.log('='.repeat(140));

  const header = [
    'Lang', 'Cards', 'Dict', 'Words Cov', 'Miss%', 'BrkLem', 'PlnIPA', 'BadPOS',
    'ExDup', 'TplGrp', 'NoAudio', 'Empty', 'NodeOrd', 'Tips%', 'ConjPat'
  ];
  const widths = [6, 6, 6, 14, 7, 7, 7, 7, 6, 7, 8, 6, 8, 7, 8];

  const padCell = (val, width) => String(val).padStart(width);
  console.log(header.map((h, i) => h.padStart(widths[i])).join(' | '));
  console.log(widths.map(w => '─'.repeat(w)).join('─┼─'));

  for (const row of summaryRows) {
    const vals = [
      row.lang, row.cards, row.dictEntries, row.wordsCov, row.missingPct,
      row.brokenLemmas, row.plainIPA, row.invalidPOS,
      row.exactDupes, row.templateGrps, row.audioMissing, row.emptyFields,
      row.nodeOrder, row.tipCoverage, row.conjPatterns,
    ];
    console.log(vals.map((v, i) => padCell(v, widths[i])).join(' | '));
  }

  console.log('='.repeat(140));

  // Print top issues
  console.log('\n' + '='.repeat(70));
  console.log('  TOP ISSUES PER LANGUAGE');
  console.log('='.repeat(70));

  for (const lang of LANGUAGES) {
    const code = lang.code;
    const data = report.languages[code];
    if (!data) continue;

    console.log(`\n── ${code.toUpperCase()} ──`);

    // Top 10 missing words
    if (data.wordCoverage.topMissing.length > 0) {
      console.log(`  Top missing words: ${data.wordCoverage.topMissing.slice(0, 10).map(m => `${m.word}(${m.freq})`).join(', ')}`);
    }

    // Broken lemmas
    if (data.dictConsistency.brokenLemmaList.length > 0) {
      console.log(`  Broken lemmas: ${data.dictConsistency.brokenLemmaList.slice(0, 5).map(l => `${l.key}→${l.lemma}`).join(', ')}`);
    }

    // Exact duplicate examples
    if (data.duplicates.groups.length > 0) {
      const exactGroups = data.duplicates.groups.filter(g => g.type === 'exact');
      if (exactGroups.length > 0) {
        console.log(`  Exact dupe examples: ${exactGroups.slice(0, 3).map(g => `"${g.english.slice(0, 50)}" (${g.count}x)`).join('; ')}`);
      }
    }

    // Audio missing
    if (data.structural.audioMissing > 0) {
      console.log(`  Audio missing: ${data.structural.audioMissing} files (e.g. ${data.structural.audioMissingCards.slice(0, 3).map(c => c.audio).join(', ')})`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('  QC COMPLETE');
  console.log('='.repeat(70));
}

main();
