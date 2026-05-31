#!/usr/bin/env node
/**
 * Phase 2: Filter the 710 mismatches to find REAL errors vs synonyms/valid alternates.
 * Then apply fixes to nl.ts.
 *
 * A mismatch is a REAL ERROR when:
 * - The dict translation is clearly wrong (totally different meaning)
 * - The dict translation contains garbage (wrong POS, scrambled)
 * - Google's translation makes much more sense for the Dutch word
 *
 * A mismatch is a FALSE POSITIVE when:
 * - Dict and Google are synonyms (gherkin/pickle, civil servant/official)
 * - Dict is more specific but valid (lean-to vs canopy)
 * - Dict has the base form and Google has conjugated (bake vs bakes)
 * - Both are valid translations of polysemous words
 */

const fs = require('fs');
const path = require('path');

const NL_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'nl.ts');
const MISMATCHES_PATH = path.join(__dirname, 'output', 'nl-semantic-verify.json');

const mismatches = JSON.parse(fs.readFileSync(MISMATCHES_PATH, 'utf8'));

// ── Synonym sets (both directions are synonyms, don't replace) ──
const SYNONYM_PAIRS = [
  // Near-synonyms that are both valid
  ['gherkin', 'pickle'], ['civil servant', 'official'], ['lean-to', 'canopy'],
  ['shelter', 'canopy'], ['adaptation', 'amendment'], ['adjusted', 'amended'],
  ['adapted', 'amended'], ['revolutionary', 'groundbreaking'],
  ['earthshaking', 'groundbreaking'], ['appointment', 'date'],
  ['agreement', 'date'], ['biggest', 'largest'], ['feel', 'sense'],
  ['listen', 'hear'], ['complete', 'round'], ['wash', 'clean'],
  ['pay', 'settle'], ['install', 'lay out'], ['construct', 'lay out'],
  ['dawn', 'arrive'], ['start', 'begin'], ['happen', 'occur'],
  ['big', 'large'], ['small', 'little'], ['fast', 'quick'],
  ['happy', 'glad'], ['sad', 'unhappy'], ['nice', 'pleasant'],
  ['pretty', 'beautiful'], ['ugly', 'unattractive'], ['old', 'ancient'],
  ['new', 'novel'], ['good', 'well'], ['bad', 'poor'],
  ['hard', 'difficult'], ['easy', 'simple'], ['clever', 'smart'],
  ['stupid', 'dumb'], ['rich', 'wealthy'], ['poor', 'impoverished'],
  ['handle', 'deal with'], ['perhaps', 'maybe'], ['also', 'too'],
  ['whole', 'entire'], ['sure', 'certain'], ['careful', 'cautious'],
  ['gentle', 'mild'], ['strong', 'powerful'], ['weak', 'feeble'],
  ['thick', 'fat'], ['thin', 'slim'], ['wide', 'broad'],
  ['narrow', 'tight'], ['wet', 'moist'], ['dry', 'arid'],
  ['bright', 'light'], ['dark', 'dim'], ['loud', 'noisy'],
  ['quiet', 'silent'], ['mean', 'intend'], ['allow', 'permit'],
  ['grab', 'seize'], ['throw', 'toss'], ['pull', 'drag'],
  ['push', 'shove'], ['cut', 'slice'], ['jump', 'leap'],
  ['run', 'sprint'], ['walk', 'stroll'], ['sit', 'seat'],
  ['stand', 'rise'], ['lie', 'recline'], ['fall', 'drop'],
  ['raise', 'lift'], ['hold', 'grip'], ['catch', 'capture'],
  ['reach', 'achieve'], ['try', 'attempt'], ['choose', 'select'],
  ['desire', 'wish'], ['fear', 'dread'], ['worry', 'concern'],
  ['surprise', 'astonish'], ['enjoy', 'relish'],
  ['celebrate', 'festive'], ['prepare', 'ready'],
  ['protect', 'guard'], ['attack', 'assault'],
  ['destroy', 'demolish'], ['create', 'make'],
  ['change', 'alter'], ['keep', 'retain'], ['lose', 'misplace'],
  ['find', 'discover'], ['show', 'display'], ['hide', 'conceal'],
  ['connect', 'link'], ['separate', 'divide'],
  ['gather', 'collect'], ['spread', 'distribute'],
  ['street', 'road'], ['path', 'trail'], ['town', 'city'],
  ['house', 'home'], ['room', 'chamber'], ['shop', 'store'],
  ['car', 'automobile'], ['boat', 'ship'], ['airplane', 'plane'],
  ['clothes', 'clothing'], ['sick', 'ill'], ['doctor', 'physician'],
  ['job', 'work'], ['colleague', 'coworker'], ['boss', 'manager'],
  ['money', 'cash'], ['price', 'cost'], ['cheap', 'inexpensive'],
  ['expensive', 'costly'], ['buy', 'purchase'], ['sell', 'trade'],
  ['frighten', 'scare'], ['annoy', 'irritate'], ['bother', 'disturb'],
  ['continue', 'proceed'], ['stop', 'halt'], ['finish', 'end'],
  ['region', 'area'], ['landscape', 'scenery'], ['countryside', 'rural'],
  ['custom', 'tradition'], ['festival', 'celebration'],
];

// Build a lookup for quick synonym checking
const synonymMap = new Map();
for (const [a, b] of SYNONYM_PAIRS) {
  if (!synonymMap.has(a)) synonymMap.set(a, new Set());
  if (!synonymMap.has(b)) synonymMap.set(b, new Set());
  synonymMap.get(a).add(b);
  synonymMap.get(b).add(a);
}

function wordsOf(s) {
  return s.toLowerCase()
    .replace(/\b(to|a|an|the|of|it|is|are|be|in|on|at|for|with|by|up|out|as|or|and|no|not|so|do|my|me|we|he|she|one|has|had|was|were|been)\b/g, '')
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function isSynonymous(dictEn, googleEn) {
  const dw = wordsOf(dictEn);
  const gw = wordsOf(googleEn);

  // Check direct word overlap including stems
  for (const d of dw) {
    for (const g of gw) {
      // Exact match
      if (d === g) return true;
      // Stem match (share 4+ char prefix)
      if (d.length >= 4 && g.length >= 4) {
        const minLen = Math.min(d.length, g.length);
        const shared = Math.min(4, minLen);
        if (d.slice(0, shared) === g.slice(0, shared)) return true;
      }
      // Plural/singular (add/remove 's', 'es', 'ies')
      if (d + 's' === g || g + 's' === d) return true;
      if (d + 'es' === g || g + 'es' === d) return true;
      if (d + 'ed' === g || g + 'ed' === d) return true;
      if (d + 'ing' === g || g + 'ing' === d) return true;
      if (d + 'er' === g || g + 'er' === d) return true;
      if (d + 'est' === g || g + 'est' === d) return true;
      if (d + 'ly' === g || g + 'ly' === d) return true;
      if (d + 'tion' === g || g + 'tion' === d) return true;
      if (d + 'ment' === g || g + 'ment' === d) return true;
      if (d + 'ness' === g || g + 'ness' === d) return true;
      // Known synonyms
      if (synonymMap.has(d) && synonymMap.get(d).has(g)) return true;
    }
  }
  return false;
}

// ── Classify each mismatch ──────────────────────────────────────
function classifyMismatch(m) {
  const { word, dictEn, googleEn, pos } = m;
  const dLow = dictEn.toLowerCase().replace(/^to /, '');
  const gLow = googleEn.toLowerCase().replace(/^to /, '');

  // 1. If they're actually the same after normalization
  if (dLow === gLow) return 'same';

  // 2. Check synonym/stem overlap
  if (isSynonymous(dictEn, googleEn)) return 'synonym';

  // 3. Verb forms: dict says "bake" and google says "bakes/baked/baking"
  if (pos === 'v') {
    const dBase = dLow.replace(/;.*$/, '').trim();
    const gBase = gLow.replace(/;.*$/, '').trim();
    if (dBase + 's' === gBase || dBase + 'es' === gBase ||
        dBase + 'ed' === gBase || dBase + 'd' === gBase ||
        dBase + 'ing' === gBase ||
        gBase + 's' === dBase || gBase + 'es' === dBase) return 'verb-form';
  }

  // 4. Plural forms for nouns
  if (pos === 'n') {
    const dBase = dLow.replace(/;.*$/, '').trim();
    const gBase = gLow.replace(/;.*$/, '').trim();
    if (dBase + 's' === gBase || dBase + 'es' === gBase ||
        gBase + 's' === dBase || gBase + 'es' === dBase) return 'plural-form';
  }

  // 5. Dict entry has semicolon with multiple meanings — check each part
  if (dictEn.includes(';') || dictEn.includes(',')) {
    const parts = dictEn.split(/[;,]/).map(p => p.trim());
    for (const part of parts) {
      if (isSynonymous(part, googleEn)) return 'multi-meaning-match';
    }
  }
  if (googleEn.includes(';') || googleEn.includes(',')) {
    const parts = googleEn.split(/[;,]/).map(p => p.trim());
    for (const part of parts) {
      if (isSynonymous(dictEn, part)) return 'multi-meaning-match';
    }
  }

  // 6. Dict says something clearly wrong — these are real errors
  // Check for clear indicators of wrong translation:
  // - Dict says a totally unrelated word
  // - Dict has garbage characters
  // - Dict has wrong POS embedded

  return 'real-mismatch';
}

// ── Process all mismatches ──────────────────────────────────────
const classified = mismatches.map(m => ({
  ...m,
  classification: classifyMismatch(m),
}));

const realErrors = classified.filter(m => m.classification === 'real-mismatch');
const falsePos = classified.filter(m => m.classification !== 'real-mismatch');

console.log(`Total mismatches: ${mismatches.length}`);
console.log(`False positives (synonyms/forms): ${falsePos.length}`);
console.log(`Real errors to fix: ${realErrors.length}`);

// ── Additional filtering: remove cases where dict is actually better ──
// These are cases where Google gave a less precise or less common translation
const KEEP_DICT = new Set([
  // Place names, proper nouns — dict is probably fine
  // Words where dict has a more specific/accurate translation
]);

// Filter out entries where Google's translation is garbage for our context
const finalFixes = realErrors.filter(m => {
  const g = m.googleEn.toLowerCase();
  const d = m.dictEn.toLowerCase();

  // Skip if Google returned something very generic ("it", "that", single common word)
  if (g.length <= 2) return false;

  // Skip proper nouns / place names (dict likely correct)
  if (m.word[0] === m.word[0].toUpperCase() && m.word.length > 1) return false;
  if (m.pos === 'n' && /^[A-Z]/.test(m.dictEn)) return false;

  // Skip if dict entry already has multiple valid meanings
  if (d.includes(';') && d.split(';').length >= 3) return false;

  return true;
});

console.log(`After additional filtering: ${finalFixes.length} fixes to apply`);

// ── Print all fixes for review ──────────────────────────────────
console.log('\n── All fixes to apply ──');
for (const m of finalFixes) {
  console.log(`  ${m.word}: "${m.dictEn}" → "${m.googleEn}"`);
}

// ── Apply fixes to nl.ts ─────────────────────────────────────────
let src = fs.readFileSync(NL_PATH, 'utf8');
let fixCount = 0;

for (const m of finalFixes) {
  const { word, dictEn, googleEn, pos } = m;

  // Format the replacement translation
  let newEn = googleEn.trim();

  // For verbs, ensure "to " prefix
  if (pos === 'v') {
    // Remove any conjugation from Google's result
    let base = newEn.replace(/^to /, '');
    // If Google returned a conjugated form, we need the infinitive
    // Simple heuristic: if it ends in 's', 'ed', 'ing', strip
    if (!base.includes(' ')) {
      if (base.endsWith('ies')) base = base.slice(0, -3) + 'y';
      else if (base.endsWith('es') && base.length > 4) base = base.slice(0, -2);
      else if (base.endsWith('s') && !base.endsWith('ss')) base = base.slice(0, -1);
      else if (base.endsWith('ed') && base.length > 4) {
        if (base.endsWith('ied')) base = base.slice(0, -3) + 'y';
        else if (base[base.length - 3] === base[base.length - 4]) base = base.slice(0, -3); // stopped→stop
        else base = base.slice(0, -2);
      }
      else if (base.endsWith('ing') && base.length > 5) {
        if (base[base.length - 4] === base[base.length - 5]) base = base.slice(0, -4); // running→run
        else base = base.slice(0, -3);
      }
    }
    newEn = 'to ' + base;
  }

  // Escape single quotes in the new translation
  const escapedDictEn = dictEn.replace(/'/g, "\\'");
  const escapedNewEn = newEn.replace(/'/g, "\\'");

  // Find and replace the exact entry
  // Pattern: 'word': { en: 'old translation',
  const entryPattern = new RegExp(
    `('${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*\\{\\s*en:\\s*')${dictEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(')`
  );

  if (entryPattern.test(src)) {
    src = src.replace(entryPattern, `$1${escapedNewEn}$2`);
    fixCount++;
  } else {
    console.log(`  WARNING: Could not find pattern for "${word}": "${dictEn}"`);
  }
}

if (fixCount > 0) {
  fs.writeFileSync(NL_PATH, src);
  console.log(`\nApplied ${fixCount} fixes to nl.ts`);
} else {
  console.log('\nNo fixes applied');
}

// Write detailed report
const reportPath = path.join(__dirname, 'output', 'nl-semantic-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  totalEntries: 5998,
  contentWordsVerified: 5792,
  initialMismatches: mismatches.length,
  falsePositives: falsePos.length,
  realErrors: realErrors.length,
  fixesApplied: fixCount,
  classifications: {
    same: classified.filter(m => m.classification === 'same').length,
    synonym: classified.filter(m => m.classification === 'synonym').length,
    verbForm: classified.filter(m => m.classification === 'verb-form').length,
    pluralForm: classified.filter(m => m.classification === 'plural-form').length,
    multiMeaningMatch: classified.filter(m => m.classification === 'multi-meaning-match').length,
    realMismatch: realErrors.length,
  },
  fixes: finalFixes.map(m => ({ word: m.word, old: m.dictEn, new: m.googleEn })),
}, null, 2));
console.log(`Report written to ${reportPath}`);
