#!/usr/bin/env node
/**
 * Cleanup pass for Turkish dictionary fixes:
 * 1. Revert entries where lemma exists and the new translation contradicts the lemma
 * 2. Fix Google misspellings
 * 3. Revert cases where original was better
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
let src = fs.readFileSync(DICT_PATH, 'utf8');

let revertCount = 0;
let fixCount = 0;

// ── Fix Google misspellings ──
const SPELLING_FIXES = {
  'mediterrenian': 'Mediterranean',
  'istambul': 'Istanbul',
  'turkiye': 'Turkey',
  'turkısh': 'Turkish',
};

for (const [wrong, right] of Object.entries(SPELLING_FIXES)) {
  const re = new RegExp(`en: '${wrong}'`, 'gi');
  const matches = src.match(re);
  if (matches) {
    src = src.replace(re, `en: '${right}'`);
    fixCount += matches.length;
    console.log(`Fixed spelling: "${wrong}" → "${right}" (${matches.length})`);
  }
}

// ── Revert entries where lemma relationship was broken ──
// Parse all entries with their lemmas
const entryRe = /^\s+['"](.+?)['"]\s*:\s*\{\s*en:\s*'([^']*)'.*?(?:lemma:\s*'([^']*)')?/gm;
const entriesWithLemma = [];
let m;
while ((m = entryRe.exec(src)) !== null) {
  if (m[3]) {
    entriesWithLemma.push({ word: m[1], en: m[2], lemma: m[3] });
  }
}

// Get lemma translations
const lemmaTranslations = {};
const allEntryRe = /^\s+['"](.+?)['"]\s*:\s*\{\s*en:\s*'([^']*)'/gm;
while ((m = allEntryRe.exec(src)) !== null) {
  lemmaTranslations[m[1]] = m[2];
}

// Check if inflected form translation contradicts lemma
// E.g., if lemma 'ada' = 'island' but 'adayı' (lemma: ada) now says 'candidate'
const REVERTS = [];

for (const entry of entriesWithLemma) {
  const lemmaEn = lemmaTranslations[entry.lemma];
  if (!lemmaEn) continue;

  const lemmaStems = lemmaEn.toLowerCase().replace(/^to /, '').split(/[,\s]+/).filter(w => w.length > 2);
  const entryStem = entry.en.toLowerCase().replace(/^to /, '').split(/[,\s]+/).filter(w => w.length > 2);

  // If none of the entry's content words overlap with lemma, it might be wrong
  let hasOverlap = false;
  for (const es of entryStem) {
    for (const ls of lemmaStems) {
      if (es === ls) { hasOverlap = true; break; }
      // Stem comparison
      const minLen = Math.min(es.length, ls.length);
      if (minLen >= 3 && es.slice(0, minLen - 1) === ls.slice(0, minLen - 1)) {
        hasOverlap = true; break;
      }
    }
    if (hasOverlap) break;
  }

  // Also check if the translation is a valid conjugation/case form
  // Allow possessive/case markers on nouns, conjugated verbs
  const isVerbForm = /^(I |you |he |she |it |we |they |will |would |should |could |can |may |let|if )/i.test(entry.en);
  const isNounForm = /(my |your |his |her |its |our |their |the |from |in |on |at |with |of |to )/i.test(entry.en);

  if (!hasOverlap && !isVerbForm && !isNounForm) {
    // This entry's translation has nothing to do with its lemma
    // But only revert if this looks like a case where original was correct
    REVERTS.push(entry);
  }
}

console.log(`\nEntries where translation contradicts lemma: ${REVERTS.length}`);
REVERTS.slice(0, 20).forEach(r => {
  console.log(`  ${r.word} (lemma: ${r.lemma}='${lemmaTranslations[r.lemma]}'): en='${r.en}'`);
});

// Don't auto-revert - just report. The reverse-verification should have caught most issues.
// Only revert clearly wrong ones.

// ── Specific known reverts ──
const SPECIFIC_REVERTS = {
  // akdeniz = Mediterranean (Google returned misspelling)
  // Already fixed above via spelling fix

  // adayı has lemma 'ada' (island), Google said 'candidate' which is wrong for this context
  // 'adayı': 'island', -- actually 'aday' means candidate and 'ada' means island
  // adayı could be either "the island" (ada+yı) or "the candidate" (aday+ı)
  // Since it has lemma: 'ada', it means island form
  'adayı': 'the island',

  // alın with lemma almak should be 'take' not 'forehead'
  // (alın as noun = forehead, as verb form of almak = take!)
  'alın': 'take',
};

for (const [word, correctEn] of Object.entries(SPECIFIC_REVERTS)) {
  const wordEsc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`('${wordEsc}'\\s*:\\s*\\{\\s*en:\\s*')([^']*?)(')`);
  const match = src.match(re);
  if (match && match[2] !== correctEn) {
    src = src.replace(re, `$1${correctEn}$3`);
    revertCount++;
    console.log(`\nReverted: ${word}: "${match[2]}" → "${correctEn}"`);
  }
}

fs.writeFileSync(DICT_PATH, src);
console.log(`\nCleanup: ${fixCount} spelling fixes, ${revertCount} reverts`);
