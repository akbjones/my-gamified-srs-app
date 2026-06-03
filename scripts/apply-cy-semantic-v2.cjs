#!/usr/bin/env node
/**
 * Apply semantic fixes to Welsh dictionary – careful version.
 *
 * Categories:
 * 1. REAL ERRORS: old meaning is genuinely wrong (apply Google)
 * 2. GARBLED: old has typos/nonsense (apply Google if Google is good)
 * 3. VERB FORMS: dict=infinitive, google=conjugated → SKIP (keep dict)
 * 4. PLURAL/SING: minor difference → SKIP
 * 5. SYNONYM: close meaning → SKIP
 * 6. GARBAGE GOOGLE: Google returned nonsense → SKIP
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'cy.ts');
const FIXES_PATH = path.join(__dirname, 'output', 'cy-semantic-fixes.json');

const fixes = JSON.parse(fs.readFileSync(FIXES_PATH, 'utf8'));

// ── Helper functions ──

function norm(s) {
  return s.toLowerCase().replace(/^to /, '').replace(/[^a-z ]/g, '').trim();
}

function getWords(s) {
  const stops = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'was', 'were', 'be', 'it', 'and', 'or', 'but', 'not', 'by', 'with', 'from', 'up', 'out', 'off']);
  return norm(s).split(/\s+/).filter(w => w.length > 1 && !stops.has(w));
}

function stem(w) {
  return w.replace(/(ing|ed|er|est|tion|sion|ment|ness|able|ible|ful|less|ous|ive|ly|ity|al|ial|ise|ize|ence|ance|ent|ant|ure)$/, '');
}

// ── Build curated fix list ──

const approved = [];
const rejected = [];

for (const f of fixes) {
  const old = f.oldEn;
  const goog = f.googleEn;
  const oldL = old.toLowerCase();
  const googL = goog.toLowerCase();
  const key = f.key;
  const pos = f.pos;

  // ── REJECT: Garbage Google results ──
  if (googL === key.toLowerCase()) { rejected.push({...f, reason: 'google=welsh'}); continue; }
  if (googL.replace(/[^a-z]/g, '') === key.toLowerCase().replace(/[^a-z]/g, '')) { rejected.push({...f, reason: 'google≈welsh'}); continue; }
  if (googL.length <= 2 && key.length > 3) { rejected.push({...f, reason: 'google too short'}); continue; }
  // Known garbage Google responses
  if (['basi', 'casute', 'cryoven', 'gorgimwch', 'llaes', 'rhaglen'].includes(googL)) { rejected.push({...f, reason: 'garbage google'}); continue; }

  // ── REJECT: Verb conjugation differences (dict has infinitive, google has conjugated) ──
  if (pos === 'v' && oldL.startsWith('to ') && /^(he |she |i |we |you |they |it |one |was )/.test(googL)) {
    rejected.push({...f, reason: 'verb form diff'});
    continue;
  }

  // ── REJECT: Gerund vs infinitive for verbs ──
  if (pos === 'v' && oldL.startsWith('to ')) {
    const verbWord = oldL.replace(/^to /, '');
    const googVerb = googL.replace(/ing$/, '').replace(/(.)\1$/, '$1');
    if (googL.endsWith('ing')) {
      // "to breathe" vs "breathing" – same verb
      if (verbWord.replace(/e$/, '') === googVerb || verbWord === googVerb || stem(verbWord) === stem(googVerb)) {
        rejected.push({...f, reason: 'gerund≈infinitive'});
        continue;
      }
    }
    // "to build" vs "construction" – if they share a root
    if (stem(verbWord).length >= 3 && stem(googL).length >= 3 && stem(verbWord) === stem(googL)) {
      rejected.push({...f, reason: 'same root'});
      continue;
    }
  }

  // ── REJECT: Plural vs singular ──
  const oW = norm(old);
  const gW = norm(goog);
  if (oW + 's' === gW || oW + 'es' === gW || oW.replace(/y$/, 'ies') === gW ||
      gW + 's' === oW || gW + 'es' === oW || gW.replace(/y$/, 'ies') === oW) {
    rejected.push({...f, reason: 'plural/singular'});
    continue;
  }

  // ── REJECT: UK/US spelling ──
  const spPairs = [['colour','color'],['honour','honor'],['favourite','favorite'],['aluminium','aluminum'],['honourable','honorable'],['centre','center'],['organise','organize'],['recognise','recognize'],['defence','defense'],['analyse','analyze'],['behaviour','behavior']];
  let isSpelling = false;
  for (const [uk,us] of spPairs) {
    if ((oldL.includes(uk) && googL.includes(us)) || (oldL.includes(us) && googL.includes(uk))) { isSpelling = true; break; }
  }
  if (isSpelling) { rejected.push({...f, reason: 'UK/US spelling'}); continue; }

  // ── REJECT: Close synonyms ──
  const synSets = [
    ['uncommon', 'unusual', 'extraordinary', 'remarkable', 'rare'],
    ['diversity', 'variety', 'range'],
    ['reveal', 'manifest', 'show', 'display', 'expose'],
    ['renovate', 'refresh', 'renew', 'restore'],
    ['distant', 'far', 'remote'],
    ['cockerel', 'rooster', 'cock'],
    ['bound', 'captive', 'trapped', 'confined'],
    ['sheltered', 'cozy', 'cosy', 'snug'],
    ['collection', 'conclusion', 'gathering'],  // actually different
    ['scrutinise', 'scrutinize', 'scrutiny', 'examine'],
    ['application', 'request', 'petition'],
    ['arena', 'gym', 'gymnasium', 'playground'],
    ['reinforcing', 'strengthening', 'positive'],  // actually different
    ['recall', 'commemorate', 'remember'],
    ['choral', 'choir', 'chorus'],
    ['fast', 'quick', 'swift', 'soon'],
    ['refund', 'reimbursement', 'repayment'],
    ['weight', 'importance', 'burden'],  // actually different for bwys
  ];
  let isSyn = false;
  const oWords = getWords(old);
  const gWords = getWords(goog);
  for (const set of synSets) {
    const oIn = oWords.some(w => set.includes(w));
    const gIn = gWords.some(w => set.includes(w));
    if (oIn && gIn) { isSyn = true; break; }
  }
  if (isSyn) { rejected.push({...f, reason: 'synonym'}); continue; }

  // ── Everything else: APPROVE ──
  approved.push(f);
}

console.log(`Total: ${fixes.length}, Approved: ${approved.length}, Rejected: ${rejected.length}`);

// Categorize rejections
const rejReasons = {};
for (const r of rejected) {
  rejReasons[r.reason] = (rejReasons[r.reason] || 0) + 1;
}
console.log('Rejection reasons:', rejReasons);

// ── Now further filter approved list for quality ──
// Remove cases where Google translation is bad or where dict translation is fine

const finalFixes = [];

for (const f of approved) {
  const old = f.oldEn;
  const goog = f.googleEn;
  const oldL = old.toLowerCase();
  const googL = goog.toLowerCase();
  const pos = f.pos;

  // Format the new translation
  let newEn = googL;

  // For verbs, ensure "to " prefix
  if (pos === 'v') {
    if (!newEn.startsWith('to ')) {
      // If it's a past tense from Google ("he built", "was sung"), skip – keep dict
      if (/^(he |she |i |we |you |they |it |was |were |been )/.test(newEn)) {
        continue; // Keep the dict version
      }
      // Gerund → infinitive
      if (newEn.endsWith('ing')) {
        let stem = newEn.replace(/ing$/, '');
        // running → run, sitting → sit
        if (stem.match(/([bcdfghjklmnpqrstvwxyz])\1$/) && stem.length > 3) {
          stem = stem.slice(0, -1);
        }
        newEn = 'to ' + stem;
        // Fix some common issues
        if (newEn.endsWith('to smok')) newEn = 'to smoke';
        if (newEn.endsWith('to danc')) newEn = 'to dance';
        if (newEn.endsWith('to cycl')) newEn = 'to cycle';
        if (newEn.endsWith('to writ')) newEn = 'to write';
        if (newEn.endsWith('to driv')) newEn = 'to drive';
        if (newEn.endsWith('to giv')) newEn = 'to give';
        if (newEn.endsWith('to mak')) newEn = 'to make';
        if (newEn.endsWith('to tak')) newEn = 'to take';
        if (newEn.endsWith('to pac')) newEn = 'to pack';
        if (newEn.endsWith('to hav')) newEn = 'to have';
        if (newEn.endsWith('to liv')) newEn = 'to live';
        if (newEn.endsWith('to mov')) newEn = 'to move';
        if (newEn.endsWith('to box')) newEn = 'to box';
      } else {
        newEn = 'to ' + newEn;
      }
    }
  }

  // Clean up
  newEn = newEn.replace(/\s+/g, ' ').trim();

  // Skip if same as old after formatting
  if (newEn === oldL || newEn === old) continue;

  // Skip if new translation is nonsensical
  if (newEn.length <= 2) continue;
  if (newEn === 'to ' || newEn === 'to  ') continue;
  if (newEn.includes("don't") && pos === 'v') continue; // "to don't" is garbage
  if (newEn.startsWith('to to ')) continue;

  // Skip where old translation is actually correct and Google is wrong/different
  // These need manual review – skip borderline cases
  // E.g., "to, toward" entries for ato/atoch/atyn – these are prepositions
  if (oldL.includes('toward') && ['prep', 'adv'].includes(pos)) continue;

  finalFixes.push({
    key: f.key,
    oldEn: f.oldEn,
    newEn,
    ipa: f.ipa,
    pos: f.pos,
    lemma: f.lemma,
  });
}

console.log(`Final fixes to apply: ${finalFixes.length}`);

// Print all fixes for review
console.log('\n=== ALL FIXES ===');
finalFixes.forEach(f => {
  console.log(`  ${f.key}: "${f.oldEn}" → "${f.newEn}"`);
});

// ── Apply fixes ──
let src = fs.readFileSync(DICT_PATH, 'utf8');
let applied = 0;
let failed = 0;

for (const f of finalFixes) {
  const oldEnForRegex = f.oldEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const newEnEscaped = f.newEn.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  // Find and replace the en value
  const before = src;
  src = src.replace(
    new RegExp(`(['"]${f.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]:\\s*\\{[^}]*?)en:\\s*'${oldEnForRegex}'`),
    `$1en: '${newEnEscaped}'`
  );

  if (src !== before) {
    applied++;
  } else {
    failed++;
    // Try with double-quoted key
    const before2 = src;
    src = src.replace(
      new RegExp(`(["']${f.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']:\\s*\\{[^}]*?)en:\\s*'${oldEnForRegex}'`),
      `$1en: '${newEnEscaped}'`
    );
    if (src !== before2) {
      applied++;
      failed--;
    } else {
      console.log(`  FAILED: ${f.key}`);
    }
  }
}

console.log(`\nApplied: ${applied}, Failed: ${failed}`);

fs.writeFileSync(DICT_PATH, src, 'utf8');
console.log('Written to', DICT_PATH);
