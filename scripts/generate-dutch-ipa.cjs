#!/usr/bin/env node
/**
 * generate-dutch-ipa.cjs
 * ---------------------
 * Adds rule-based IPA pronunciations to every entry in the Dutch dictionary
 * (src/data/dictionary/nl.ts) that currently has ipa: ''.
 *
 * Usage:  node scripts/generate-dutch-ipa.cjs
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'nl.ts');

// ─── Dutch → IPA converter ─────────────────────────────────────

function dutchToIPA(word) {
  let w = word.toLowerCase().trim();

  // ----- Pre-processing: handle known suffixes first as flags -----
  // We'll work through the word left-to-right with ordered replacements.

  let result = w;

  // ── Pass 1: Multi-char replacements (order matters!) ──

  // Suffix patterns (apply before general rules)
  // -tion → sjɔn
  result = result.replace(/tion$/g, 'TION');
  // -lijk → lək
  result = result.replace(/elijk$/g, 'ELIJK');
  result = result.replace(/lijk$/g, 'LIJK');
  // -heid → ɦɛit
  result = result.replace(/heid$/g, 'HEID');
  // -tje → tjə (diminutive)
  result = result.replace(/tje$/g, 'TJE');
  // -je → jə (diminutive, after tje)
  result = result.replace(/([^t])je$/g, '$1JE');

  // Word-final -en → ən
  result = result.replace(/en$/g, 'EN_END');
  // Word-final -er → ər
  result = result.replace(/([^e])er$/g, '$1ER_END');
  // Word-final -e → ə (but not after another vowel digraph replacement)
  // We'll handle this later

  // ── Pass 2: Digraphs and trigraphs (longest first) ──

  // sch → sx
  result = result.replace(/sch/g, 'SX');

  // Diphthongs before consonant digraphs
  // ij → ɛi
  result = result.replace(/ij/g, 'EI_D');
  // ei → ɛi
  result = result.replace(/ei/g, 'EI_D');
  // ui → œy
  result = result.replace(/ui/g, 'UI_D');
  // ou → ɑu
  result = result.replace(/ou/g, 'OU_D');
  // au → ɑu
  result = result.replace(/au/g, 'AU_D');

  // Long vowel digraphs
  // oe → u
  result = result.replace(/oe/g, 'OE_D');
  // eu → ø
  result = result.replace(/eu/g, 'EU_D');
  // ie → i (long)
  result = result.replace(/ie/g, 'IE_D');
  // aa → aː
  result = result.replace(/aa/g, 'AA_D');
  // ee → eː
  result = result.replace(/ee/g, 'EE_D');
  // oo → oː
  result = result.replace(/oo/g, 'OO_D');
  // uu → yː
  result = result.replace(/uu/g, 'UU_D');

  // Consonant digraphs
  // ch → x
  result = result.replace(/ch/g, 'CH_D');
  // ng → ŋ (but not before k, handled by nk)
  result = result.replace(/nk/g, 'NK_D');
  result = result.replace(/ng/g, 'NG_D');
  // sj → ʃ
  result = result.replace(/sj/g, 'SJ_D');
  // tj → tʃ (but only NOT as part of TJE diminutive already handled)
  result = result.replace(/tj/g, 'TJ_D');
  // ph → f
  result = result.replace(/ph/g, 'PH_D');
  // th → t
  result = result.replace(/th/g, 'TH_D');
  // qu → kʋ
  result = result.replace(/qu/g, 'QU_D');

  // ── Pass 3: Single character replacements ──

  // Now we convert remaining single characters.
  // We need to be careful about vowels in open vs closed syllables.
  // For simplicity, we'll do a rough heuristic:
  // - A vowel followed by a single consonant then another vowel (or end) = open syllable
  // - A vowel followed by two consonants or at word end = closed syllable

  // First, let's convert all tokens to final IPA in one pass.
  // Build the output by scanning the result string.

  let output = '';
  let i = 0;
  const r = result;

  while (i < r.length) {
    // Check for multi-char tokens first
    if (r.startsWith('TION', i)) {
      output += 'sjɔn'; i += 4; continue;
    }
    if (r.startsWith('ELIJK', i)) {
      output += 'ələk'; i += 5; continue;
    }
    if (r.startsWith('LIJK', i)) {
      output += 'lək'; i += 4; continue;
    }
    if (r.startsWith('HEID', i)) {
      output += 'ɦɛit'; i += 4; continue;
    }
    if (r.startsWith('TJE', i)) {
      output += 'tjə'; i += 3; continue;
    }
    if (r.startsWith('JE', i) && i > 0) {
      output += 'jə'; i += 2; continue;
    }
    if (r.startsWith('EN_END', i)) {
      output += 'ən'; i += 6; continue;
    }
    if (r.startsWith('ER_END', i)) {
      output += 'ər'; i += 6; continue;
    }
    if (r.startsWith('SX', i)) {
      output += 'sx'; i += 2; continue;
    }
    if (r.startsWith('EI_D', i)) {
      output += 'ɛi'; i += 4; continue;
    }
    if (r.startsWith('UI_D', i)) {
      output += 'œy'; i += 4; continue;
    }
    if (r.startsWith('OU_D', i)) {
      output += 'ɑu'; i += 4; continue;
    }
    if (r.startsWith('AU_D', i)) {
      output += 'ɑu'; i += 4; continue;
    }
    if (r.startsWith('OE_D', i)) {
      output += 'u'; i += 4; continue;
    }
    if (r.startsWith('EU_D', i)) {
      output += 'ø'; i += 4; continue;
    }
    if (r.startsWith('IE_D', i)) {
      output += 'i'; i += 4; continue;
    }
    if (r.startsWith('AA_D', i)) {
      output += 'aː'; i += 4; continue;
    }
    if (r.startsWith('EE_D', i)) {
      output += 'eː'; i += 4; continue;
    }
    if (r.startsWith('OO_D', i)) {
      output += 'oː'; i += 4; continue;
    }
    if (r.startsWith('UU_D', i)) {
      output += 'yː'; i += 4; continue;
    }
    if (r.startsWith('CH_D', i)) {
      output += 'x'; i += 4; continue;
    }
    if (r.startsWith('NK_D', i)) {
      output += 'ŋk'; i += 4; continue;
    }
    if (r.startsWith('NG_D', i)) {
      output += 'ŋ'; i += 4; continue;
    }
    if (r.startsWith('SJ_D', i)) {
      output += 'ʃ'; i += 4; continue;
    }
    if (r.startsWith('TJ_D', i)) {
      output += 'tʃ'; i += 4; continue;
    }
    if (r.startsWith('PH_D', i)) {
      output += 'f'; i += 4; continue;
    }
    if (r.startsWith('TH_D', i)) {
      output += 't'; i += 4; continue;
    }
    if (r.startsWith('QU_D', i)) {
      output += 'kʋ'; i += 4; continue;
    }

    // Single characters
    const ch = r[i];
    const remaining = r.slice(i);

    switch (ch) {
      case 'a': {
        // Check if open syllable: a + single consonant + vowel/token
        if (isOpenSyllable(r, i)) {
          output += 'aː';
        } else {
          output += 'ɑ';
        }
        i++; continue;
      }
      case 'e': {
        // Check if word-final e (and it's the actual last char after all tokens resolved)
        if (i === r.length - 1) {
          output += 'ə';
        } else if (isOpenSyllable(r, i)) {
          output += 'eː';
        } else if (isLikelySchwa(r, i)) {
          output += 'ə';
        } else {
          output += 'ɛ';
        }
        i++; continue;
      }
      case 'i': {
        output += 'ɪ';
        i++; continue;
      }
      case 'o': {
        if (isOpenSyllable(r, i)) {
          output += 'oː';
        } else {
          output += 'ɔ';
        }
        i++; continue;
      }
      case 'u': {
        output += 'ʏ';
        i++; continue;
      }
      case 'y': {
        output += 'i';
        i++; continue;
      }
      // Consonants
      case 'g': {
        // At end of remaining real characters → x (voiceless)
        if (isWordFinal(r, i)) {
          output += 'x';
        } else {
          output += 'ɣ';
        }
        i++; continue;
      }
      case 'v': {
        if (isWordFinal(r, i)) {
          output += 'f';
        } else {
          output += 'v';
        }
        i++; continue;
      }
      case 'z': {
        if (isWordFinal(r, i)) {
          output += 's';
        } else {
          output += 'z';
        }
        i++; continue;
      }
      case 'b': {
        if (isWordFinal(r, i)) {
          output += 'p';
        } else {
          output += 'b';
        }
        i++; continue;
      }
      case 'd': {
        if (isWordFinal(r, i)) {
          output += 't';
        } else {
          output += 'd';
        }
        i++; continue;
      }
      case 'w': {
        output += 'ʋ';
        i++; continue;
      }
      case 'j': {
        output += 'j';
        i++; continue;
      }
      case 'c': {
        // c before e, i → s; otherwise → k
        const next = r[i + 1];
        if (next === 'e' || next === 'i') {
          output += 's';
        } else {
          output += 'k';
        }
        i++; continue;
      }
      case 'x': {
        output += 'ks';
        i++; continue;
      }
      case 'q': {
        output += 'k';
        i++; continue;
      }
      // Pass through unchanged
      case 'f': case 'h': case 'k': case 'l': case 'm':
      case 'n': case 'p': case 'r': case 's': case 't': {
        output += ch;
        i++; continue;
      }
      default: {
        // Skip non-alpha (hyphens, spaces, etc.)
        // but keep them for multi-word entries
        if (ch === ' ' || ch === '-') {
          output += ch;
        }
        i++; continue;
      }
    }
  }

  // Final cleanup
  // Remove any remaining underscores from tokens that didn't match
  output = output.replace(/_/g, '');

  return output;
}

/**
 * Rough check: is the vowel at position `pos` in an open syllable?
 * Open syllable = vowel + single consonant + vowel (or vowel-token).
 * This is a simplification but works for most Dutch words.
 */
function isOpenSyllable(str, pos) {
  // Look ahead: need exactly one consonant-like char, then a vowel or vowel-token
  const after = str.slice(pos + 1);
  if (after.length < 2) return false;

  const firstAfter = after[0];
  // Must be a single lowercase consonant letter
  if (!/^[bcdfghjklmnpqrstvwxz]$/.test(firstAfter)) return false;

  // The char after that consonant must be a vowel or start of a vowel token
  const secondAfter = after[1];
  if (/^[aeiou]$/.test(secondAfter)) return true;
  // Check for uppercase vowel tokens (AA_D, EE_D, etc.)
  if (/^[A-Z]/.test(secondAfter)) return true;

  return false;
}

/**
 * Rough check: is the 'e' at position `pos` likely a schwa?
 * Heuristic: 'e' in unstressed prefix (be-, ge-, ver-) or before final consonant cluster.
 */
function isLikelySchwa(str, pos) {
  const before = str.slice(0, pos);
  // ge- prefix
  if (pos === 1 && str[0] === 'g') return true;
  // be- prefix
  if (pos === 1 && str[0] === 'b') return true;
  // ver- prefix
  if (pos === 2 && str.startsWith('ver')) return true;
  // her- prefix
  if (pos === 2 && str.startsWith('her')) return true;

  return false;
}

/**
 * Is the character at `pos` effectively at the end of the word?
 * (no more lowercase letters after it)
 */
function isWordFinal(str, pos) {
  const after = str.slice(pos + 1);
  // No more lowercase letters = word-final
  return !/[a-z]/.test(after);
}

// ─── Main ────────────────────────────────────────────────────────

function main() {
  console.log('Reading Dutch dictionary...');
  let src = fs.readFileSync(DICT_PATH, 'utf8');

  // Match dictionary entry lines:
  // 'word': { en: '...', ipa: '', pos: '...' },
  // or "word": { en: '...', ipa: '', pos: '...' },
  // Match dictionary entry lines (word must be on single line, no quotes inside):
  // 'word': { en: '...', ipa: '', pos: '...' },
  // "word": { en: "...", ipa: '', pos: '...' },
  const entryRegex = /^(\s*)(['"])([^'"\n]+)\2(:\s*\{[^}]*ipa:\s*)''/gm;

  let count = 0;
  const updated = src.replace(entryRegex, (match, indent, quote, word, prefix) => {
    const ipa = dutchToIPA(word);
    count++;
    return `${indent}${quote}${word}${quote}${prefix}'${ipa}'`;
  });

  if (count === 0) {
    console.log('No empty IPA entries found. Nothing to do.');
    return;
  }

  fs.writeFileSync(DICT_PATH, updated, 'utf8');
  console.log(`Done! Updated ${count} entries with IPA pronunciations.`);

  // Print some examples
  console.log('\nSample outputs:');
  const samples = [
    'aan', 'aankomen', 'aardig', 'school', 'schrijven', 'goed',
    'huis', 'mooi', 'oud', 'licht', 'gezellig', 'straat',
    'vrouw', 'dochter', 'mogelijk', 'uitstekend', 'schijnt',
    'eigenlijk', 'natuurlijk', 'vrijheid', 'gemeente'
  ];
  for (const s of samples) {
    console.log(`  ${s} → ${dutchToIPA(s)}`);
  }
}

main();
