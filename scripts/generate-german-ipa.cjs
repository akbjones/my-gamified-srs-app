#!/usr/bin/env node
'use strict';

/**
 * generate-german-ipa.cjs
 *
 * Generates rule-based IPA transcriptions for all German dictionary entries
 * in src/data/dictionary/de.ts that have ipa: ''.
 *
 * Usage: node scripts/generate-german-ipa.cjs
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'de.ts');

// ── Foreign words where v = /v/ instead of /f/ ──────────────────
const V_AS_V_WORDS = new Set([
  'vase', 'verb', 'villa', 'visum', 'video', 'vision', 'violine', 'vulkan',
  'vitamin', 'variante', 'vakuum', 'vegan', 'vegetation', 'ventil', 'ventilator',
  'veranda', 'veteran', 'violett', 'virtuell', 'virus', 'vital', 'vokal',
  'volumen', 'votum', 'vagabund', 'vokabel', 'november', 'oval', 'olive',
  'universal', 'universität', 'privat', 'provinz', 'november', 'revolution',
  'festival', 'nerven', 'niveau', 'silvester', 'klavier', 'motiv', 'aktiv',
  'passiv', 'positiv', 'negativ', 'relativ', 'kreativ', 'alternativ',
  'intensiv', 'exklusiv', 'impulsiv', 'aggressiv', 'attraktiv', 'effektiv',
  'kollektiv', 'progressiv', 'produktiv', 'reaktiv', 'sportiv', 'subjektiv',
  'objektiv', 'perspektive', 'initiative', 'detektiv', 'advent', 'evangelisch',
  'interview', 'investition', 'inventar', 'invalid', 'invasion',
]);

// ── Check if v should be /v/ in this word ──────────────────────
function isVForeign(word) {
  // Words ending in -iv, -ive are foreign
  if (/iv(e)?$/.test(word)) return true;
  // Check the foreign words set
  if (V_AS_V_WORDS.has(word)) return true;
  // v between vowels in loanwords is typically /v/
  return false;
}

// ── Determine if a vowel is "long" based on context ─────────────
// German vowel length heuristic: vowel is long if:
//   - followed by a single consonant + vowel (open syllable)
//   - doubled (aa, ee, oo)
//   - followed by h + vowel
//   - at end of word (usually)
// Vowel is short if:
//   - followed by double consonant
//   - followed by ck, tz, pf, etc.

// ── Main IPA generation function ────────────────────────────────
function germanToIPA(word) {
  if (!word || word.length === 0) return '';

  // Handle pure numbers
  if (/^\d+$/.test(word)) return word;

  let w = word.toLowerCase();
  let result = '';
  let i = 0;

  // Helper: is character a vowel?
  const isVowel = (ch) => 'aeiouyäöü'.includes(ch);

  // Helper: is character a consonant letter?
  const isConsonant = (ch) => ch && /[bcdfghjklmnpqrstvwxyz]/.test(ch);

  // Helper: check what's ahead
  const peek = (n) => w.substring(i, i + n);
  const peekAt = (pos) => w[pos] || '';
  const remaining = () => w.substring(i);

  // Helper: is this position a word start or after a prefix boundary?
  const isWordStart = () => i === 0;

  // Helper: count consonants after current position
  const countFollowingConsonants = (pos) => {
    let count = 0;
    for (let j = pos; j < w.length; j++) {
      if (isConsonant(w[j])) count++;
      else break;
    }
    return count;
  };

  // Helper: is the previous IPA output a front vowel context? (for ch → ç vs x)
  const lastVowelIsFront = () => {
    // Scan backward through result for the most recent vowel
    for (let j = result.length - 1; j >= 0; j--) {
      const ch = result[j];
      if ('eiɪɛøyʏœaɪɔʏaʊ'.includes(ch)) {
        return 'eiɪɛøyʏœ'.includes(ch);
      }
      if ('aouʊɔ'.includes(ch)) {
        return false;
      }
    }
    return true; // default to front (ç) if ambiguous
  };

  // Pre-scan for double consonants to mark short vowels
  // Build a set of positions where a vowel is followed by double consonants
  const shortVowelPositions = new Set();
  for (let j = 0; j < w.length; j++) {
    if (isVowel(w[j]) && j + 2 < w.length) {
      const c1 = w[j + 1];
      const c2 = w[j + 2];
      if (isConsonant(c1) && c1 === c2) {
        shortVowelPositions.add(j);
      }
      // ck, tz, pf also signal short vowel
      if ((c1 === 'c' && c2 === 'k') || (c1 === 't' && c2 === 'z') || (c1 === 'p' && c2 === 'f')) {
        shortVowelPositions.add(j);
      }
    }
  }

  while (i < w.length) {
    const ch = w[i];
    const rem = remaining();

    // ── Multi-character sequences (longest first) ─────────────

    // tsch → tʃ
    if (rem.startsWith('tsch')) {
      result += 'tʃ';
      i += 4;
      continue;
    }

    // sch → ʃ
    if (rem.startsWith('sch')) {
      result += 'ʃ';
      i += 3;
      continue;
    }

    // Diphthongs: check these before individual vowels
    if (rem.startsWith('äu')) {
      result += 'ɔʏ';
      i += 2;
      continue;
    }
    if (rem.startsWith('eu')) {
      result += 'ɔʏ';
      i += 2;
      continue;
    }
    if (rem.startsWith('ei')) {
      result += 'aɪ';
      i += 2;
      continue;
    }
    if (rem.startsWith('ai')) {
      result += 'aɪ';
      i += 2;
      continue;
    }
    if (rem.startsWith('au')) {
      result += 'aʊ';
      i += 2;
      continue;
    }
    // ie → iː (but not in -ieren which is iːʁən)
    if (rem.startsWith('ie')) {
      result += 'iː';
      i += 2;
      continue;
    }

    // Double vowels
    if (rem.startsWith('aa')) {
      result += 'aː';
      i += 2;
      continue;
    }
    if (rem.startsWith('ee')) {
      result += 'eː';
      i += 2;
      continue;
    }
    if (rem.startsWith('oo')) {
      result += 'oː';
      i += 2;
      continue;
    }

    // ch → ç or x
    if (rem.startsWith('ch')) {
      // ch at very start of word
      if (i === 0) {
        result += 'k';
        i += 2;
        continue;
      }
      // After front vowels/consonants: ç, after back vowels: x
      if (lastVowelIsFront()) {
        result += 'ç';
      } else {
        result += 'x';
      }
      i += 2;
      continue;
    }

    // ck → k
    if (rem.startsWith('ck')) {
      result += 'k';
      i += 2;
      continue;
    }

    // th → t
    if (rem.startsWith('th')) {
      result += 't';
      i += 2;
      continue;
    }

    // dt → t
    if (rem.startsWith('dt')) {
      result += 't';
      i += 2;
      continue;
    }

    // ph → f
    if (rem.startsWith('ph')) {
      result += 'f';
      i += 2;
      continue;
    }

    // qu → kv
    if (rem.startsWith('qu')) {
      result += 'kv';
      i += 2;
      continue;
    }

    // ng → ŋ (but not n + g where g starts a new syllable)
    if (rem.startsWith('ng') && !(i + 2 < w.length && isVowel(w[i + 2]) && i > 0 && isVowel(w[i - 1]))) {
      // Check if this is really ng at end or before consonant
      if (i + 2 >= w.length || !isVowel(w[i + 2]) || (i + 2 < w.length && w.substring(i).match(/^ng[^aeiouyäöü]/))) {
        result += 'ŋ';
        i += 2;
        continue;
      }
    }

    // nk → ŋk
    if (rem.startsWith('nk')) {
      result += 'ŋk';
      i += 2;
      continue;
    }

    // pf → pf
    if (rem.startsWith('pf')) {
      result += 'pf';
      i += 2;
      continue;
    }

    // tz → ts
    if (rem.startsWith('tz')) {
      result += 'ts';
      i += 2;
      continue;
    }

    // sp at word start → ʃp
    if (rem.startsWith('sp') && isWordStart()) {
      result += 'ʃp';
      i += 2;
      continue;
    }

    // st at word start → ʃt
    if (rem.startsWith('st') && isWordStart()) {
      result += 'ʃt';
      i += 2;
      continue;
    }

    // ss → s
    if (rem.startsWith('ss')) {
      result += 's';
      i += 2;
      continue;
    }

    // ── Word-end patterns ─────────────────────────────────────

    // -ig at word end → ɪç
    if (ch === 'i' && i + 2 === w.length && w[i + 1] === 'g') {
      result += 'ɪç';
      i += 2;
      continue;
    }

    // -ig before suffix -lich, -keit, -ung, -er, -e, -en, -em, -es, -st
    if (ch === 'i' && peekAt(i + 1) === 'g' && i + 2 < w.length) {
      const after = w.substring(i + 2);
      if (/^(lich|keit|ung|st|er|en|em|es|e)/.test(after)) {
        result += 'ɪç';
        i += 2;
        continue;
      }
    }

    // -er at word end → ɐ
    if (ch === 'e' && i + 2 === w.length && w[i + 1] === 'r') {
      result += 'ɐ';
      i += 2;
      continue;
    }

    // -ern at word end → ɐn
    if (ch === 'e' && i + 3 === w.length && w[i + 1] === 'r' && w[i + 2] === 'n') {
      result += 'ɐn';
      i += 3;
      continue;
    }

    // -en at word end → ən
    if (ch === 'e' && i + 2 === w.length && w[i + 1] === 'n') {
      result += 'ən';
      i += 2;
      continue;
    }

    // -em at word end → əm
    if (ch === 'e' && i + 2 === w.length && w[i + 1] === 'm') {
      result += 'əm';
      i += 2;
      continue;
    }

    // -el at word end → əl
    if (ch === 'e' && i + 2 === w.length && w[i + 1] === 'l') {
      result += 'əl';
      i += 2;
      continue;
    }

    // -e at word end → ə
    if (ch === 'e' && i + 1 === w.length) {
      result += 'ə';
      i += 1;
      continue;
    }

    // ── Single consonants ─────────────────────────────────────

    if (ch === 'z') {
      result += 'ts';
      i++;
      continue;
    }

    if (ch === 'ß') {
      result += 's';
      i++;
      continue;
    }

    if (ch === 'v') {
      if (isVForeign(w)) {
        result += 'v';
      } else {
        result += 'f';
      }
      i++;
      continue;
    }

    if (ch === 'w') {
      result += 'v';
      i++;
      continue;
    }

    if (ch === 'j') {
      result += 'j';
      i++;
      continue;
    }

    if (ch === 's') {
      // s before a vowel → z (voiced)
      if (i + 1 < w.length && isVowel(w[i + 1])) {
        result += 'z';
      } else {
        result += 's';
      }
      i++;
      continue;
    }

    // Final devoicing: b/d/g at word end
    if (ch === 'b' && (i + 1 === w.length || (i + 1 < w.length && !isVowel(w[i + 1]) && w[i + 1] !== 'l' && w[i + 1] !== 'r'))) {
      // b at end or before consonant (not l/r) → p
      if (i + 1 === w.length) {
        result += 'p';
        i++;
        continue;
      }
    }

    if (ch === 'd') {
      if (i + 1 === w.length) {
        result += 't';
        i++;
        continue;
      }
    }

    if (ch === 'g') {
      if (i + 1 === w.length) {
        result += 'k';
        i++;
        continue;
      }
    }

    // r → ʁ
    if (ch === 'r') {
      result += 'ʁ';
      i++;
      continue;
    }

    // x → ks
    if (ch === 'x') {
      result += 'ks';
      i++;
      continue;
    }

    // y as vowel
    if (ch === 'y') {
      // y is often like ü in German words
      if (!isConsonant(peekAt(i + 1)) || i + 1 === w.length) {
        result += 'y';
      } else {
        result += 'ʏ';
      }
      i++;
      continue;
    }

    // ── Single vowels with length rules ───────────────────────

    if (ch === 'ä') {
      // ä before h + vowel → long
      if (peekAt(i + 1) === 'h' && i + 2 < w.length && isVowel(w[i + 2])) {
        result += 'ɛː';
        i++;
        continue;
      }
      // Short if followed by double consonant
      if (shortVowelPositions.has(i)) {
        result += 'ɛ';
      } else if (i + 1 < w.length && isConsonant(w[i + 1]) && i + 2 < w.length && isVowel(w[i + 2])) {
        result += 'ɛː'; // open syllable → long
      } else {
        result += 'ɛ'; // default short
      }
      i++;
      continue;
    }

    if (ch === 'ö') {
      if (peekAt(i + 1) === 'h' && i + 2 < w.length && isVowel(w[i + 2])) {
        result += 'øː';
        i++;
        continue;
      }
      if (shortVowelPositions.has(i)) {
        result += 'œ';
      } else if (i + 1 < w.length && isConsonant(w[i + 1]) && i + 2 < w.length && isVowel(w[i + 2])) {
        result += 'øː';
      } else if (i + 1 === w.length) {
        result += 'øː'; // word-final ö is long
      } else {
        result += 'œ';
      }
      i++;
      continue;
    }

    if (ch === 'ü') {
      if (peekAt(i + 1) === 'h' && i + 2 < w.length && isVowel(w[i + 2])) {
        result += 'yː';
        i++;
        continue;
      }
      if (shortVowelPositions.has(i)) {
        result += 'ʏ';
      } else if (i + 1 < w.length && isConsonant(w[i + 1]) && i + 2 < w.length && isVowel(w[i + 2])) {
        result += 'yː';
      } else if (i + 1 === w.length) {
        result += 'yː';
      } else {
        result += 'ʏ';
      }
      i++;
      continue;
    }

    // Vowel + h before another vowel → long vowel (h is silent lengthening)
    if (isVowel(ch) && peekAt(i + 1) === 'h' && i + 2 < w.length && isVowel(w[i + 2])) {
      const longMap = { a: 'aː', e: 'eː', i: 'iː', o: 'oː', u: 'uː' };
      result += longMap[ch] || ch + 'ː';
      i += 2; // skip the h
      continue;
    }

    // Vowel + h at word end or before consonant → long vowel
    if (isVowel(ch) && peekAt(i + 1) === 'h' && (i + 2 >= w.length || isConsonant(w[i + 2]))) {
      const longMap = { a: 'aː', e: 'eː', i: 'iː', o: 'oː', u: 'uː' };
      result += longMap[ch] || ch + 'ː';
      i += 2; // skip the h
      continue;
    }

    // Regular vowels: a, e, i, o, u
    if ('aeiou'.includes(ch)) {
      const longMap = { a: 'aː', e: 'eː', i: 'iː', o: 'oː', u: 'uː' };
      const shortMap = { a: 'a', e: 'ɛ', i: 'ɪ', o: 'ɔ', u: 'ʊ' };

      // Short if double consonant follows
      if (shortVowelPositions.has(i)) {
        result += shortMap[ch];
        i++;
        continue;
      }

      // Long if open syllable (single consonant + vowel follows)
      if (i + 1 < w.length && isConsonant(w[i + 1])) {
        const consCount = countFollowingConsonants(i + 1);
        if (consCount === 1 && i + 2 < w.length && isVowel(w[i + 2])) {
          result += longMap[ch];
          i++;
          continue;
        }
        // Before multiple consonants → short
        if (consCount >= 2) {
          result += shortMap[ch];
          i++;
          continue;
        }
        // Single consonant at end → could be either, default to short
        if (i + 2 >= w.length) {
          // Monosyllabic words with single final consonant are often long
          // but this is hard to determine; default short for safety
          // Exception: common long patterns
          result += shortMap[ch];
          i++;
          continue;
        }
      }

      // Vowel at word end → long
      if (i + 1 === w.length) {
        result += longMap[ch];
        i++;
        continue;
      }

      // Default to short
      result += shortMap[ch];
      i++;
      continue;
    }

    // h (not already consumed as part of vowel lengthening, ch, sch, th, ph)
    if (ch === 'h') {
      // h at word start is pronounced
      if (i === 0) {
        result += 'h';
      }
      // h after a vowel is silent (lengthening) - already handled above
      // h between vowels can be silent
      // h at start of a syllable (after consonant) is pronounced
      else if (i > 0 && isConsonant(w[i - 1])) {
        result += 'h';
      }
      // Otherwise silent (vowel lengthening handled above)
      i++;
      continue;
    }

    // ── Pass-through consonants ───────────────────────────────
    if ('bdfgklmnpt'.includes(ch)) {
      // Skip doubled consonants (second one)
      if (i + 1 < w.length && w[i + 1] === ch) {
        result += ch;
        i += 2;
        continue;
      }
      result += ch;
      i++;
      continue;
    }

    if (ch === 'c') {
      // c without h - rare in German, usually in foreign words
      if (i + 1 < w.length && 'ei'.includes(w[i + 1])) {
        result += 'ts'; // ce, ci in foreign words
      } else {
        result += 'k';
      }
      i++;
      continue;
    }

    // Skip any non-alphabetic characters
    i++;
  }

  return result;
}

// ── Main ─────────────────────────────────────────────────────────
function main() {
  const content = fs.readFileSync(DICT_PATH, 'utf8');

  let count = 0;
  let errors = 0;

  // Match lines like:  'word': { en: '...', ipa: '', pos: '...' },
  // Regex: capture everything up to and including "ipa: ", then match the empty '',
  // and capture everything after (pos: '...' etc.)
  const updated = content.replace(
    /^(\s*'([^']+)':\s*\{[^}]*ipa:\s*)''/gm,
    (match, prefix, word) => {
      try {
        const ipa = germanToIPA(word);
        if (ipa) {
          count++;
          return `${prefix}'${ipa}'`;
        }
        return match;
      } catch (e) {
        errors++;
        console.error(`Error processing '${word}':`, e.message);
        return match;
      }
    }
  );

  fs.writeFileSync(DICT_PATH, updated, 'utf8');

  console.log(`Done! Updated ${count} entries.`);
  if (errors > 0) console.log(`Errors: ${errors}`);

  // Print some samples
  console.log('\nSample IPA transcriptions:');
  const samples = [
    'abend', 'sprechen', 'schreiben', 'freundlich', 'wichtig',
    'mädchen', 'brötchen', 'gemütlich', 'straße', 'zwanzig',
    'entschuldigung', 'frühstück', 'wunderbar', 'glücklich', 'natürlich',
    'deutschland', 'flugzeug', 'schwierig', 'übernachten', 'zusammen',
  ];
  for (const s of samples) {
    console.log(`  ${s} → ${germanToIPA(s)}`);
  }
}

main();
