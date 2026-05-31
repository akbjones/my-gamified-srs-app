#!/usr/bin/env node
/**
 * Italian dictionary semantic verification — FINAL version.
 * Uses v4 fixes JSON as input, applies only validated fixes.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'it.ts');

// Load the v4 fixes
const fixes = require('./output/it-semantic-v4-fixes.json');

// ── Filters ─────────────────────────────────────────────────────

// Words where Google gave a WRONG translation (manual blacklist)
const GOOGLE_WRONG = new Set([
  'farò',       // farò = I will do, NOT lighthouse (that's faro)
  'allora',     // "then, so" is better than "at that time"
  'egli',       // egli = he, Google said "they" which is wrong
  'buenos',     // not Italian
  'verrò',      // Google said "boar" - wrong (verrò = I will come)
]);

// Verb past participle/conjugation replacements to skip
// (dict convention: give infinitive meaning for conjugated forms)
function isVerbFormNoise(fix) {
  if (fix.pos !== 'v') return false;
  const g = fix.googleEn.toLowerCase();

  // Google returned a conjugated English form while dict has "to X"
  if (fix.dictEn.startsWith('to ')) {
    // Past participles: sung, hit, bought, sold, won, etc.
    const pastParticiples = ['sung','hit','bought','sold','won','flown','sworn',
      'held','paid','gone','left','driven','worn','written','spoken','taken',
      'given','seen','done','known','brought','chosen','fallen','grown',
      'hidden','led','lost','met','read','risen','sat','sent','shut','slept',
      'stood','thrown','woken','wound','caught','dealt','drawn','drunk',
      'eaten','forgotten','frozen','hung','hurt','kept','laid','lent','let',
      'lit','meant','put','quit','said','set','shaken','shone','shot',
      'shown','slung','sped','spent','split','spread','stuck','stung',
      'struck','strung','sunk','swept','sworn','swung','torn','woven',
      'wept','wrung','inhaled'];
    if (pastParticiples.includes(g)) return true;

    // "I/he/she/we/they + verb" patterns
    if (/^(i |he |she |we |they |you |it |was |were |am |are |let'?s )/i.test(g)) return true;

    // Single word ending in -ed/-s/-ing
    if (g.split(' ').length === 1 && /^[a-z]+(ed|es|s|ing|en)$/.test(g)) return true;
  }

  return false;
}

// Cases where dict already has a good/better translation
function dictIsBetter(fix) {
  const d = fix.dictEn.toLowerCase();
  const g = fix.googleEn.toLowerCase();

  // Dict has a more descriptive multi-meaning entry, Google gives just one word
  // e.g., "to sit down, make yourself comfortable" is better than "come in"
  if (d.includes(',') && d.length > 20 && g.split(' ').length <= 2) return true;

  // Specific cases where dict is clearly better
  const dictBetter = {
    'abitare': true,     // "to live" is perfectly fine
    'addirittura': true, // "even, actually" better than "really"
    'alzare': true,      // "to lift" and "raise" both fine, keep original
    'annullare': true,   // "to cancel" better than "delete"
    'badare': true,      // "to look after" is fine
    'cancellare': true,  // "to delete" is a valid primary meaning
    'compiere': true,    // "to finish" is fine
    'concentrare': true, // "to gather" is fine
    'condurre': true,    // "to lead" is fine
    'confondere': true,  // "to mix up" is fine
    'cogliere': true,    // "to pick" is fine
    'elaborare': true,   // "to work out" is fine
    'ferire': true,      // "to wound" is fine
    'molti': true,       // "very, much, a lot" covers all senses
    'principalmente': true, // "firstly" is fine
    'raccogliere': true, // "to pick up" is fine
    'avvenire': true,    // "to happen" is primary meaning
    'compilare': true,   // "to fill in" is correct Italian sense (not English "compile")
    'addormentiamo': true, // garbled but keep
    'richiedere': true,  // "to ask for" is fine
    'ordinato': true,    // "to put in order" is fine
    'accomodi': true,    // "to sit down" is fine
  };
  if (dictBetter[fix.word]) return true;

  return false;
}

// ── Clean translation ───────────────────────────────────────────
function cleanTranslation(en, pos) {
  let c = en.trim();
  c = c.replace(/^(he|she|it|i|we|they|you|let'?s?)\s+/i, '');
  c = c.toLowerCase();
  if (pos === 'v' && !c.startsWith('to ')) c = 'to ' + c;
  c = c.replace(/\.$/, '');
  return c;
}

// ── Main ────────────────────────────────────────────────────────
function main() {
  console.log(`Processing ${fixes.length} candidate fixes...`);

  const src = fs.readFileSync(DICT_PATH, 'utf8');
  let fixedSrc = src;
  let applied = 0;
  let skippedGoogleWrong = 0;
  let skippedVerbNoise = 0;
  let skippedDictBetter = 0;
  let skippedRegex = 0;

  const appliedFixes = [];

  for (const fix of fixes) {
    // Skip Google-wrong entries
    if (GOOGLE_WRONG.has(fix.word)) { skippedGoogleWrong++; continue; }

    // Skip verb conjugation noise (for non-garbled)
    if (fix.reason !== 'garbled' && isVerbFormNoise(fix)) { skippedVerbNoise++; continue; }

    // Skip where dict is better (for non-garbled)
    if (fix.reason !== 'garbled' && dictIsBetter(fix)) { skippedDictBetter++; continue; }

    const key = fix.word;
    const dictEn = fix.dictEn;
    let newEn = cleanTranslation(fix.googleEn, fix.pos);

    if (newEn === dictEn || newEn.toLowerCase() === dictEn.toLowerCase()) continue;
    if (newEn.length < 2) continue;

    const eDictEn = dictEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const eKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const re1 = new RegExp(`('${eKey}':\\s*\\{[^}]*en:\\s*')${eDictEn}(')`);
    const re2 = new RegExp(`("${eKey}":\\s*\\{[^}]*en:\\s*')${eDictEn}(')`);

    const safe = newEn.replace(/'/g, "\\'");

    if (re1.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(re1, `$1${safe}$2`);
      applied++;
      appliedFixes.push({ word: key, old: dictEn, new: newEn, reason: fix.reason });
    } else if (re2.test(fixedSrc)) {
      fixedSrc = fixedSrc.replace(re2, `$1${safe}$2`);
      applied++;
      appliedFixes.push({ word: key, old: dictEn, new: newEn, reason: fix.reason });
    } else {
      skippedRegex++;
    }
  }

  console.log(`\nSkipped:`);
  console.log(`  Google wrong: ${skippedGoogleWrong}`);
  console.log(`  Verb noise: ${skippedVerbNoise}`);
  console.log(`  Dict better: ${skippedDictBetter}`);
  console.log(`  Regex miss: ${skippedRegex}`);
  console.log(`Applied: ${applied}`);

  if (applied > 0) {
    fs.writeFileSync(DICT_PATH, fixedSrc);
    console.log(`\nWrote to ${DICT_PATH}`);
  }

  // Print all applied fixes
  console.log(`\n=== ALL ${applied} APPLIED FIXES ===`);
  for (const f of appliedFixes) {
    console.log(`  ${f.word}: "${f.old}" → "${f.new}" [${f.reason}]`);
  }

  return applied;
}

const n = main();
console.log(`\nITALIAN COMPLETE — ${n} fixes`);
