#!/usr/bin/env node
/**
 * Apply semantic fixes to Welsh dictionary.
 * Filters out:
 * - Verb conjugation form differences (dict=infinitive, google=conjugated)
 * - Close synonyms that don't need fixing
 * - Garbage Google results (returns Welsh word, single char, etc.)
 * - Plural vs singular differences (acceptable)
 * - US vs UK spelling differences
 *
 * Applies genuine semantic corrections.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'cy.ts');
const FIXES_PATH = path.join(__dirname, 'output', 'cy-semantic-fixes.json');

const fixes = JSON.parse(fs.readFileSync(FIXES_PATH, 'utf8'));

// ── Filtering logic ──

function isVerbFormDiff(old, goog) {
  const o = old.toLowerCase();
  const g = goog.toLowerCase();
  // dict=infinitive, google=conjugated form
  if (o.startsWith('to ') && /^(he |she |i |we |you |they |it |one )/.test(g)) return true;
  if (g.startsWith('to ') && /^(he |she |i |we |you |they |it |one )/.test(o)) return true;
  return false;
}

function isPluralDiff(old, goog) {
  const o = old.toLowerCase().replace(/^to /, '');
  const g = goog.toLowerCase().replace(/^to /, '');
  // One is plural of the other
  if (o + 's' === g || o + 'es' === g || g + 's' === o || g + 'es' === o) return true;
  if (o + 'ies' === g && o.endsWith('y')) return false; // check properly
  if (o.replace(/y$/, 'ies') === g) return true;
  if (g.replace(/y$/, 'ies') === o) return true;
  return false;
}

function isSpellingVariant(old, goog) {
  const o = old.toLowerCase();
  const g = goog.toLowerCase();
  // UK vs US
  const pairs = [
    ['colour', 'color'], ['honour', 'honor'], ['favourite', 'favorite'],
    ['organise', 'organize'], ['recognise', 'recognize'], ['realise', 'realize'],
    ['centre', 'center'], ['theatre', 'theater'], ['defence', 'defense'],
    ['aluminium', 'aluminum'], ['honourable', 'honorable'], ['behaviour', 'behavior'],
    ['analyse', 'analyze'], ['catalogue', 'catalog'], ['programme', 'program'],
    ['licence', 'license'], ['practise', 'practice'],
  ];
  for (const [uk, us] of pairs) {
    if ((o.includes(uk) && g.includes(us)) || (o.includes(us) && g.includes(uk))) return true;
  }
  return false;
}

function isCloseEnoughSynonym(old, goog) {
  const synonymPairs = [
    // These are close enough in meaning
    ['refund', 'reimbursement'],
    ['uncommon', 'extraordinary'],
    ['diversity', 'variety'],
    ['breathe', 'breathing'],
    ['distant', 'far'],
    ['tired', 'angry'],  // Actually this IS wrong - blin means tired/annoyed
    ['renovate', 'refresh'],
    ['reveal', 'manifest'],
    ['suitable', 'appropriate'],
    ['honourable', 'honorable'],
    ['respectable', 'honorable'],
  ];
  const o = old.toLowerCase();
  const g = goog.toLowerCase();
  for (const [a, b] of synonymPairs) {
    if ((o.includes(a) && g.includes(b)) || (o.includes(b) && g.includes(a))) return true;
  }
  return false;
}

function isGarbageGoogle(key, googleEn) {
  const g = googleEn.toLowerCase().trim();
  const k = key.toLowerCase();
  // Google returned the Welsh word or similar
  if (g === k) return true;
  if (g.replace(/[^a-z]/g, '') === k.replace(/[^a-z]/g, '')) return true;
  // Very short garbage
  if (g.length <= 2 && key.length > 3) return true;
  // Known garbage patterns
  if (['basi', 'basin', 'bassoon'].includes(g) && key.startsWith('bas')) return true;
  return false;
}

function shouldApplyFix(f) {
  const old = f.oldEn.toLowerCase();
  const goog = f.googleEn.toLowerCase();

  // Skip garbage Google
  if (isGarbageGoogle(f.key, f.googleEn)) return false;

  // Skip verb form differences where dict has correct infinitive
  if (isVerbFormDiff(f.oldEn, f.googleEn)) return false;

  // Skip plural vs singular (both acceptable)
  if (isPluralDiff(f.oldEn, f.googleEn)) return false;

  // Skip UK/US spelling variants
  if (isSpellingVariant(f.oldEn, f.googleEn)) return false;

  // Skip where dict already has a reasonable translation and Google is just different phrasing
  // e.g., "to build" vs "construction" – both valid for "adeiladu"
  if (old.startsWith('to ') && !goog.startsWith('to ') && f.pos === 'v') {
    // Dict has verb form, Google returned noun form – keep dict version for verbs
    const verbStem = old.replace(/^to /, '');
    if (goog.includes(verbStem) || goog.endsWith('ing') || goog.endsWith('tion')) return false;
  }

  // Skip gerund vs infinitive for verbs: "to X" vs "Xing"
  if (f.pos === 'v' && old.startsWith('to ')) {
    const stem = old.replace(/^to /, '').replace(/e$/, '');
    if (goog === stem + 'ing' || goog === old.replace(/^to /, '') + 'ing') return false;
  }

  // These are REAL errors that need fixing:
  // 1. Completely wrong meanings (e.g., "white water lily" → "melodies" for alawon)
  // 2. Wrong POS meaning (e.g., "to promise" for an adjective "addawol" = "promising")
  // 3. Garbled entries (e.g., "to boxe", "to pas", "relatif")

  return true;
}

// Format the google translation nicely for the dictionary
function formatTranslation(googleEn, pos, oldEn) {
  let g = googleEn.toLowerCase().trim();

  // For verbs, ensure "to " prefix
  if (pos === 'v' && !g.startsWith('to ')) {
    // If Google gave a gerund, convert to infinitive
    if (g.endsWith('ing')) {
      const stem = g.replace(/ing$/, '');
      // Handle doubled consonants: "running" → "run"
      if (stem.match(/(.)\1$/) && stem.length > 3) {
        g = 'to ' + stem.slice(0, -1);
      } else if (stem.endsWith('e')) {
        g = 'to ' + stem; // "skating" → "to skate"
      } else {
        g = 'to ' + stem + 'e'; // Some need trailing e
        // Actually just use the gerund as-is converted
        g = 'to ' + g.replace(/ing$/, '');
        // Fix common patterns
        if (g.endsWith('at')) g = g + 'e';
        if (g.endsWith('yz')) g = g + 'e';
      }
      // Simpler: just prefix "to " and let it be the gerund-based form
      g = 'to ' + googleEn.toLowerCase().replace(/ing$/, '').trim();
      // Remove double consonants at end
      if (g.match(/([a-z])\1$/)) g = g.slice(0, -1);
    } else if (/^(he |she |i |we |you |they |it )/.test(g)) {
      // Conjugated form – try to get infinitive
      // "he built" → "to build" is hard automatically, keep as-is with "to" prefix
      // Actually, for these it's better to keep the old if it had "to"
      if (oldEn.toLowerCase().startsWith('to ')) return oldEn.toLowerCase();
      g = 'to ' + g.replace(/^(he |she |i |we |you |they |it )/, '');
    } else {
      g = 'to ' + g;
    }
  }

  // Capitalize first letter of each meaning
  // Actually, dict uses lowercase
  return g;
}

// ── Main ──
const toApply = fixes.filter(f => shouldApplyFix(f));

console.log(`Filtered: ${fixes.length} total → ${toApply.length} to apply`);

// Now, let's do a more careful review of what we're applying
// Print the first 50 for inspection
console.log('\n=== FIXES TO APPLY (sample) ===');
toApply.slice(0, 60).forEach(f => {
  const newEn = formatTranslation(f.googleEn, f.pos, f.oldEn);
  console.log(`  ${f.key}: "${f.oldEn}" → "${newEn}"`);
});

// Read the dictionary file
let src = fs.readFileSync(DICT_PATH, 'utf8');

let applied = 0;
let skipped = 0;

for (const f of toApply) {
  const newEn = formatTranslation(f.googleEn, f.pos, f.oldEn);

  // Skip if new translation is same as old
  if (newEn.toLowerCase() === f.oldEn.toLowerCase()) { skipped++; continue; }

  // Skip if new translation looks wrong
  if (newEn.length <= 1) { skipped++; continue; }
  if (newEn === 'to ') { skipped++; continue; }

  // Build the regex to find and replace just the 'en' value for this entry
  // Handle both single and double quoted keys
  const keyEscaped = f.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const oldEnEscaped = f.oldEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match the entry with this exact key and old en value
  const pattern = new RegExp(
    `(['"])${keyEscaped}\\1:\\s*\\{\\s*en:\\s*'${oldEnEscaped}'`,
    'g'
  );

  const newEnEscaped = newEn.replace(/'/g, "\\'");
  const replacement = src.replace(pattern, (match) => {
    return match.replace(`en: '${f.oldEn}'`, `en: '${newEnEscaped}'`);
  });

  if (replacement !== src) {
    src = replacement;
    applied++;
  } else {
    skipped++;
  }
}

console.log(`\nApplied: ${applied}, Skipped: ${skipped}`);

// Write back
fs.writeFileSync(DICT_PATH, src, 'utf8');
console.log('Written to', DICT_PATH);
