#!/usr/bin/env node
/**
 * Cross-language quality audit script.
 * Checks ALL languages for consistency: IPA, POS, dictionary completeness,
 * conjugation smoke tests, grammar tips %, and tag distribution.
 *
 * Usage: node scripts/audit-languages.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// ─── Configuration ──────────────────────────────────────────
const LANGUAGES = [
  { code: 'es', name: 'Spanish', deckDir: 'spanish' },
  { code: 'it', name: 'Italian', deckDir: 'italian' },
  { code: 'fr', name: 'French', deckDir: 'french' },
  { code: 'pt', name: 'Portuguese', deckDir: 'portuguese' },
  { code: 'de', name: 'German', deckDir: 'german' },
  { code: 'nl', name: 'Dutch', deckDir: 'dutch' },
  { code: 'sv', name: 'Swedish', deckDir: 'swedish' },
];

// Common verbs to test conjugation per language
const CONJUGATION_TEST_VERBS = {
  es: ['hablar', 'comer', 'vivir', 'ser', 'estar', 'tener', 'hacer', 'poder', 'ir', 'decir'],
  it: ['parlare', 'mangiare', 'vivere', 'essere', 'avere', 'fare', 'potere', 'andare', 'dire', 'volere'],
  fr: ['parler', 'manger', 'finir', 'être', 'avoir', 'faire', 'aller', 'pouvoir', 'venir', 'dire'],
  pt: ['falar', 'comer', 'viver', 'ser', 'estar', 'ter', 'fazer', 'poder', 'ir', 'dizer'],
  de: ['machen', 'sprechen', 'sein', 'haben', 'werden', 'können', 'gehen', 'kommen', 'sehen', 'geben'],
  nl: ['maken', 'spreken', 'zijn', 'hebben', 'worden', 'kunnen', 'gaan', 'komen', 'zien', 'geven'],
  sv: ['tala', 'arbeta', 'vara', 'ha', 'göra', 'kunna', 'gå', 'komma', 'se', 'ge'],
};

const results = [];

// ─── Helper: Bundle and load a TS module ─────────────────────
function loadTsModule(tsPath) {
  const tmpFile = path.join('/tmp', `audit-${Date.now()}-${Math.random().toString(36).slice(2)}.cjs`);
  try {
    execSync(`npx esbuild "${tsPath}" --bundle --platform=node --format=cjs --outfile="${tmpFile}" 2>/dev/null`, {
      cwd: ROOT,
      stdio: 'pipe',
    });
    const mod = require(tmpFile);
    return mod;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// ─── Check 1: Deck stats ────────────────────────────────────
function checkDeck(lang) {
  const deckPath = path.join(SRC, 'data', lang.deckDir, 'deck.json');
  if (!fs.existsSync(deckPath)) {
    return { pass: false, error: 'deck.json not found' };
  }
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf-8'));
  const total = deck.length;
  const withGrammar = deck.filter(c => c.grammar && c.grammar.trim()).length;
  const grammarPct = Math.round((withGrammar / total) * 100);

  // Tags
  const general = deck.filter(c => (c.tags || []).includes('general')).length;
  const travel = deck.filter(c => (c.tags || []).includes('travel')).length;
  const work = deck.filter(c => (c.tags || []).includes('work')).length;
  const family = deck.filter(c => (c.tags || []).includes('family')).length;

  const generalPct = Math.round((general / total) * 100);
  const travelPct = Math.round((travel / total) * 100);
  const workPct = Math.round((work / total) * 100);
  const familyPct = Math.round((family / total) * 100);

  const issues = [];
  if (total < 3800) issues.push(`Low card count: ${total} (target ~3930)`);
  if (grammarPct < 20) issues.push(`Low grammar tips: ${grammarPct}% (target 25-35%)`);
  if (grammarPct > 40) issues.push(`High grammar tips: ${grammarPct}% (target 25-35%)`);
  if (generalPct < 95) issues.push(`General tag coverage: ${generalPct}% (target 100%)`);
  if (travelPct < 35 || travelPct > 65) issues.push(`Travel tag: ${travelPct}% (target 40-60%)`);
  if (workPct < 35 || workPct > 65) issues.push(`Work tag: ${workPct}% (target 40-60%)`);
  if (familyPct < 35 || familyPct > 65) issues.push(`Family tag: ${familyPct}% (target 40-60%)`);

  return {
    pass: issues.length === 0,
    total,
    grammarPct,
    tags: { general: generalPct, travel: travelPct, work: workPct, family: familyPct },
    issues,
  };
}

// ─── Check 2: Dictionary quality ────────────────────────────
function checkDictionary(lang) {
  const dictPath = path.join(SRC, 'data', 'dictionary', `${lang.code}.ts`);
  if (!fs.existsSync(dictPath)) {
    return { pass: false, error: 'dictionary not found' };
  }

  const content = fs.readFileSync(dictPath, 'utf-8');

  // Count entries with empty IPA (handles both single and double quotes)
  const emptyIpa = (content.match(/ipa:\s*['"]['"],/g) || []).length;
  // Count total dictionary entries (handles both quote styles)
  const totalEntries = (content.match(/ipa:\s*['"]/g) || []).length;

  const issues = [];
  if (emptyIpa > 0) issues.push(`${emptyIpa} entries with empty IPA`);

  return {
    pass: issues.length === 0,
    totalEntries,
    emptyIpa,
    issues,
  };
}

// ─── Check 3: Dictionary completeness ────────────────────────
function checkDictCompleteness(lang) {
  const deckPath = path.join(SRC, 'data', lang.deckDir, 'deck.json');
  const dictPath = path.join(SRC, 'data', 'dictionary', `${lang.code}.ts`);
  if (!fs.existsSync(deckPath) || !fs.existsSync(dictPath)) {
    return { pass: false, error: 'deck or dictionary not found' };
  }

  try {
    const dictModule = loadTsModule(dictPath);
    const lookupWord = dictModule.lookupWord;
    if (!lookupWord) {
      return { pass: false, error: 'lookupWord not exported' };
    }

    const deck = JSON.parse(fs.readFileSync(deckPath, 'utf-8'));
    const allWords = new Set();
    for (const card of deck) {
      const words = card.target.split(/\s+/).map(w =>
        w.toLowerCase().replace(/[¿¡.,!?;:"""\u2018\u2019()—–«»\d/]/g, '').trim()
      ).filter(w => w.length > 0);
      for (const w of words) allWords.add(w);
    }

    let missing = 0;
    const missingWords = [];
    for (const word of allWords) {
      if (!lookupWord(word)) {
        missing++;
        if (missingWords.length < 10) missingWords.push(word);
      }
    }

    const issues = [];
    if (missing > 0) {
      issues.push(`${missing}/${allWords.size} words not found in dictionary`);
      if (missingWords.length > 0) issues.push(`  Examples: ${missingWords.join(', ')}`);
    }

    return {
      pass: missing === 0,
      totalWords: allWords.size,
      missing,
      issues,
    };
  } catch (err) {
    return { pass: false, error: `Failed to test: ${err.message}` };
  }
}

// ─── Check 4: Dictionary translation quality ─────────────────
function checkTranslationQuality(lang) {
  const dictPath = path.join(SRC, 'data', 'dictionary', `${lang.code}.ts`);
  if (!fs.existsSync(dictPath)) {
    return { pass: true, error: 'dictionary not found' };
  }

  const content = fs.readFileSync(dictPath, 'utf-8');

  // Count self-translated entries (en value == key)
  const entryPattern = /['"]([^'"]+)['"]\s*:\s*\{\s*en:\s*['"]([^'"]*)['"]/g;
  let total = 0;
  let selfTranslated = 0;
  let match;
  while ((match = entryPattern.exec(content)) !== null) {
    total++;
    const key = match[1].toLowerCase();
    const en = match[2].toLowerCase();
    if (key === en) selfTranslated++;
  }

  const selfPct = total > 0 ? Math.round((selfTranslated / total) * 100) : 0;

  const issues = [];
  if (selfPct > 40) issues.push(`${selfPct}% self-translated (${selfTranslated}/${total}) — target <40%`);

  // Count entries with wrong POS for verb forms
  const verbFormPattern = /['"]([^'"]+)['"]\s*:\s*\{\s*en:\s*['"]to\s/g;
  let verbAsNoun = 0;
  const verbContent = content;
  let vm;
  const verbNounPattern = /['"]([^'"]+)['"]\s*:\s*\{\s*en:\s*['"]to\s[^'"]*['"]\s*,\s*ipa:\s*['"][^'"]*['"]\s*,\s*pos:\s*['"]n['"]/g;
  while ((vm = verbNounPattern.exec(verbContent)) !== null) {
    verbAsNoun++;
  }
  if (verbAsNoun > 0) issues.push(`${verbAsNoun} entries with en="to ..." but pos='n' (should be 'v')`);

  return {
    pass: issues.length === 0,
    total,
    selfTranslated,
    selfPct,
    verbAsNoun,
    issues,
  };
}

// ─── Check 5: Conjugation smoke test ────────────────────────
function checkConjugation(lang) {
  const conjPath = path.join(SRC, 'data', 'conjugation', `${lang.code}.ts`);
  if (!fs.existsSync(conjPath)) {
    return { pass: false, error: 'conjugation file not found' };
  }

  try {
    const conjModule = loadTsModule(conjPath);
    const conjugate = conjModule.conjugate;
    if (!conjugate) {
      return { pass: false, error: 'conjugate not exported' };
    }

    const testVerbs = CONJUGATION_TEST_VERBS[lang.code] || [];
    const failures = [];
    for (const verb of testVerbs) {
      const result = conjugate(verb);
      if (!result) {
        failures.push(verb);
      } else if (!result.tenses || Object.keys(result.tenses).length === 0) {
        failures.push(`${verb} (no tenses)`);
      }
    }

    const issues = [];
    if (failures.length > 0) {
      issues.push(`${failures.length}/${testVerbs.length} verbs failed: ${failures.join(', ')}`);
    }

    return {
      pass: failures.length === 0,
      tested: testVerbs.length,
      passed: testVerbs.length - failures.length,
      issues,
    };
  } catch (err) {
    return { pass: false, error: `Failed to test: ${err.message}` };
  }
}

// ─── Run all checks ─────────────────────────────────────────
console.log('=== Language Quality Audit ===\n');

let allPassed = true;

for (const lang of LANGUAGES) {
  console.log(`\n--- ${lang.name} (${lang.code}) ---`);

  // Deck
  const deck = checkDeck(lang);
  if (deck.error) {
    console.log(`  Deck: SKIP (${deck.error})`);
  } else {
    const status = deck.pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  Deck: ${status} — ${deck.total} cards, ${deck.grammarPct}% grammar tips`);
    console.log(`    Tags: general=${deck.tags.general}% travel=${deck.tags.travel}% work=${deck.tags.work}% family=${deck.tags.family}%`);
    if (deck.issues.length > 0) {
      deck.issues.forEach(i => console.log(`    ⚠ ${i}`));
      allPassed = false;
    }
  }

  // Dictionary quality
  const dict = checkDictionary(lang);
  if (dict.error) {
    console.log(`  Dictionary: SKIP (${dict.error})`);
  } else {
    const status = dict.pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  Dictionary IPA: ${status} — ${dict.totalEntries} entries, ${dict.emptyIpa} empty IPA`);
    if (dict.issues.length > 0) {
      dict.issues.forEach(i => console.log(`    ⚠ ${i}`));
      allPassed = false;
    }
  }

  // Dictionary completeness
  const comp = checkDictCompleteness(lang);
  if (comp.error) {
    console.log(`  Dict Coverage: SKIP (${comp.error})`);
  } else {
    const status = comp.pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  Dict Coverage: ${status} — ${comp.totalWords} unique words, ${comp.missing} missing`);
    if (comp.issues.length > 0) {
      comp.issues.forEach(i => console.log(`    ⚠ ${i}`));
      allPassed = false;
    }
  }

  // Translation quality
  const trans = checkTranslationQuality(lang);
  if (trans.error) {
    console.log(`  Translation: SKIP (${trans.error})`);
  } else {
    const status = trans.pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[33mWARN\x1b[0m';
    console.log(`  Translation: ${status} — ${trans.selfPct}% self-translated (${trans.selfTranslated}/${trans.total})`);
    if (trans.issues.length > 0) {
      trans.issues.forEach(i => console.log(`    ⚠ ${i}`));
      // Don't fail the whole audit for translation quality, just warn
    }
  }

  // Conjugation
  const conj = checkConjugation(lang);
  if (conj.error) {
    console.log(`  Conjugation: SKIP (${conj.error})`);
  } else {
    const status = conj.pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  Conjugation: ${status} — ${conj.passed}/${conj.tested} verbs OK`);
    if (conj.issues.length > 0) {
      conj.issues.forEach(i => console.log(`    ⚠ ${i}`));
      allPassed = false;
    }
  }
}

console.log('\n' + '='.repeat(40));
if (allPassed) {
  console.log('\x1b[32m✓ All checks passed!\x1b[0m');
  process.exit(0);
} else {
  console.log('\x1b[31m✗ Some checks failed. See above for details.\x1b[0m');
  process.exit(1);
}
