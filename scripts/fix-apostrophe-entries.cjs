#!/usr/bin/env node
/**
 * Fix broken apostrophe/quote entries across all 11 dictionaries.
 *
 * The problem: Google Translate returned values like "I'm glad" which,
 * when naively inserted into single-quoted JS strings, produce:
 *   en: 'i\'m glad'm glad'
 * The backslash-escaped apostrophe works, but the SECOND unescaped
 * apostrophe (from the curly-quote or raw copy) terminates the string
 * early, leaving garbage after it.
 *
 * Detection: any line where the en: '...' value contains \' and
 * the text after it duplicates part of the text before.
 *
 * Strategy per pattern:
 *   'i\'m X'm X'           -> 'X'              (drop "I'm")
 *   'i\'ll X'll X'         -> 'to X'           (drop "I'll", add "to")
 *   'i\'d X'd X'd X'       -> 'X'              (drop "I'd")
 *   'we\'re X're X'        -> 'X'              (drop "we're")
 *   'we\'ll X'll X'        -> 'to X'           (drop "we'll", add "to")
 *   'you\'re X're X'       -> 'X'              (drop "you're")
 *   'you\'ll X'll X'       -> 'to X'           (drop "you'll", add "to")
 *   'it\'s X's X'          -> 'X'              (drop "it's")
 *   'he\'s X's X'          -> 'X'              (drop "he's")
 *   'that\'s X's X'        -> 'X'              (drop "that's")
 *   'don\'t X't X'         -> 'don\'t X'       (keep don't, remove dup)
 *   'can\'t X't X'         -> 'can\'t X'       (keep can't, remove dup)
 *   'won\'t X't X'         -> 'won\'t X'       (keep won't, remove dup)
 *   'couldn\'t X't X'      -> 'couldn\'t X'    (keep couldn't, remove dup)
 *   'hasn\'t X't X'        -> 'hasn\'t X'      (keep hasn't, remove dup)
 *   'o\'clock'clock'       -> 'o\'clock'
 *   'new year\'s's'        -> 'new year\'s'
 *   'reader\'s's'          -> 'reader\'s'
 *   'tomorrow\'s's'        -> 'tomorrow\'s'
 *   'all\'anno'anno'       -> 'year'           (special case)
 *   'let\'s X's X'         -> 'to X'           (drop "let's", add "to")
 *
 * For verb entries with a lemma field, we look up the lemma's en value
 * and use that if available.
 */

const fs = require('fs');
const path = require('path');

const DICT_DIR = path.join(__dirname, '..', 'src', 'data', 'dictionary');
const LANGUAGES = ['cy', 'de', 'es', 'fr', 'hi', 'it', 'nl', 'pt', 'ru', 'sv', 'tr'];

let totalFixes = 0;

for (const lang of LANGUAGES) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fixes = 0;

  // First pass: build a map of word -> en value for lemma lookups
  const enMap = {};
  for (const line of lines) {
    // Match lines like:   'word': { en: 'value', ...
    const m = line.match(/^\s+'([^']+)':\s*\{\s*en:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/);
    if (m) {
      enMap[m[1]] = m[2];
    }
  }

  // Second pass: fix broken lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Quick check: does this line have an en: value with a backslash-escaped quote?
    if (!line.includes("en: '") || !line.includes("\\'")) continue;

    // Match the en: value portion - we need to capture the FULL raw text including broken parts
    // Pattern: en: 'STUFF' where STUFF may contain \' sequences
    // But the broken lines have unescaped ' that terminates early
    // So we match: en: '...\'.....'.....', or en: '...\'.....'.....'.....', etc.

    // Extract everything from en: ' to the next valid field separator
    const enMatch = line.match(/en:\s*'(.*?)',\s*(ipa:|pos:|lemma:)/);
    if (!enMatch) continue;

    const rawEnValue = enMatch[1];

    // Check if this value is broken: it should contain an unescaped ' within it
    // A valid escaped value only has \' sequences
    // A broken value has a bare ' that's not preceded by \
    // Let's check: after removing all \' sequences, are there still ' characters?
    const withoutEscaped = rawEnValue.replace(/\\'/g, '');
    if (!withoutEscaped.includes("'")) continue; // Not broken

    // This line IS broken. Now fix it.
    let fixedEn = fixBrokenValue(rawEnValue, line);

    // If this entry has a lemma, try to use the lemma's definition
    const lemmaMatch = line.match(/lemma:\s*'([^']+)'/);
    if (lemmaMatch && enMap[lemmaMatch[1]]) {
      const lemmaEn = enMap[lemmaMatch[1]];
      // Use lemma definition if it looks clean (no broken quotes)
      if (!lemmaEn.includes("'") || lemmaEn.includes("\\'")) {
        // Only replace with lemma def if our fix looks like a bare conjugation
        // Actually, use lemma def as a preference
        fixedEn = lemmaEn;
      }
    }

    // Rebuild the line
    const before = line.substring(0, line.indexOf("en: '") + 5);
    const afterEnValue = line.substring(line.indexOf("en: '") + 5);
    // Find where the broken en value ends - it's at the ', before ipa:/pos:/lemma:
    const fieldMatch = afterEnValue.match(/^.*?',\s*(?=ipa:|pos:|lemma:)/);
    if (!fieldMatch) continue;

    const rest = afterEnValue.substring(fieldMatch[0].length);
    const newLine = before + fixedEn + "', " + rest;

    if (newLine !== line) {
      lines[i] = newLine;
      fixes++;
      console.log(`[${lang}] L${i + 1}: ${line.trim()}`);
      console.log(`       -> ${newLine.trim()}`);
    }
  }

  if (fixes > 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`\n${lang}.ts: ${fixes} fixes applied\n`);
    totalFixes += fixes;
  }
}

console.log(`\nTotal fixes: ${totalFixes}`);

function fixBrokenValue(raw, fullLine) {
  // Special cases first
  if (raw === "all\\'anno'anno") return 'year';

  // Handle: o'clock'clock -> o\'clock
  if (raw.includes("o\\'clock'clock")) return "o\\'clock";

  // Generic pattern: the raw value is like "PREFIX\\'SUFFIX'SUFFIX"
  // where the part after the unescaped ' duplicates the part after the escaped \'
  //
  // Examples:
  //   "i\\'m glad'm glad"  - prefix="i", escaped_tail="m glad", dup_tail="m glad"
  //   "i\\'ll start'll start" - prefix="i", escaped_tail="ll start", dup_tail="ll start"
  //   "new year\\'s's" - prefix="new year", escaped_tail="s", dup_tail="s"
  //   "tomorrow\\'s's" - prefix="tomorrow", escaped_tail="s", dup_tail="s"

  // Split at the FIRST unescaped ' (which is after the \' sequence)
  // The escaped \' is at some position. After it, find the next bare '
  const escIdx = raw.indexOf("\\'");
  if (escIdx === -1) return raw;

  // Content after the escaped apostrophe marker (after \')
  const afterEsc = raw.substring(escIdx + 2);
  // Find the bare ' in afterEsc
  const bareIdx = afterEsc.indexOf("'");
  if (bareIdx === -1) return raw;

  // The valid part of the en value (before the bare ')
  const validPart = raw.substring(0, escIdx + 2 + bareIdx);
  // validPart is like: "i\\'m glad" or "new year\\'s" or "o\\'clock"

  // Now decide what to output based on the prefix
  const prefix = raw.substring(0, escIdx).toLowerCase().trim();
  const contraction = raw.substring(escIdx + 2, escIdx + 2 + bareIdx); // "m glad", "ll start", "s", etc.

  // Determine the core meaning (everything after the contraction suffix)
  // e.g., for "i\\'m glad", contraction = "m glad", suffix = "m", meaning = "glad"
  // e.g., for "i\\'ll start", contraction = "ll start", suffix = "ll", meaning = "start"

  // Patterns where we drop the subject + contraction:
  // i'm X -> X
  // i'll X -> to X
  // i'd X -> X
  // we're X -> X
  // we'll X -> to X
  // you're X -> X
  // you'll X -> to X
  // it's X -> X
  // he's X -> X
  // she's X -> X
  // that's X -> X
  // let's X -> to X

  // Patterns where we keep the negation:
  // don't X -> don't X
  // can't X -> can't X
  // won't X -> won't X
  // couldn't X -> couldn't X
  // hasn't X -> hasn't X
  // wasn't X -> wasn't X

  // Possessive/special patterns:
  // X's (possessive, like "new year's", "reader's", "tomorrow's") -> keep as is

  // Check if it's a possessive 's (the prefix is a noun/word, not a pronoun/subject)
  const possessiveSubjects = ['it', 'he', 'she', 'that', 'what', 'there'];
  const pronounSubjects = ['i', 'we', 'you', 'they'];

  if (contraction === 's' || contraction === 's.') {
    // Could be possessive or "it's"/"he's" etc.
    if (possessiveSubjects.includes(prefix) || pronounSubjects.includes(prefix)) {
      // It's a contraction: "it's X" -> "X", but we need the X part
      // Actually for just "'s" with no space after, it's like "new year's" -> keep
      // For "it's X's X" the contraction would be "s X" not just "s"
      // If contraction is just 's' it means the value was like "new year\\'s's"
      return validPart; // Keep as is: "new year\\'s"
    }
    // It's possessive: "tomorrow's" -> keep
    return validPart;
  }

  // Extract the contraction type and the rest
  let cType, meaning;
  if (contraction.startsWith('m ')) {
    cType = "'m"; meaning = contraction.substring(2);
  } else if (contraction.startsWith('m.')) {
    cType = "'m"; meaning = contraction.substring(2).replace(/^\.?\s*/, '');
  } else if (contraction.startsWith('ll ')) {
    cType = "'ll"; meaning = contraction.substring(3);
  } else if (contraction.startsWith('d ')) {
    cType = "'d"; meaning = contraction.substring(2);
  } else if (contraction.startsWith('re ')) {
    cType = "'re"; meaning = contraction.substring(3);
  } else if (contraction.startsWith('re')) {
    cType = "'re"; meaning = contraction.substring(2).trim();
  } else if (contraction.startsWith('t ')) {
    cType = "'t"; meaning = contraction.substring(2);
  } else if (contraction.startsWith('s ')) {
    cType = "'s"; meaning = contraction.substring(2);
  } else if (contraction.startsWith('s.')) {
    cType = "'s"; meaning = contraction.substring(2).replace(/^\.?\s*/, '');
  } else {
    // Unknown pattern, just return the valid part
    return validPart;
  }

  meaning = meaning.trim().replace(/\.$/, '').trim();

  // Now decide based on prefix + contraction type
  const negations = ["don", "can", "won", "couldn", "hasn", "wasn", "isn", "doesn", "didn", "shouldn", "weren", "aren", "haven"];

  if (negations.includes(prefix)) {
    // Keep the negation: "don't X"
    return prefix + "\\'" + cType.substring(1) + ' ' + meaning;
  }

  if (prefix === 'let' && cType === "'s") {
    return 'to ' + meaning;
  }

  // For "i'll", "we'll", "you'll" -> "to X"
  if (cType === "'ll") {
    return 'to ' + meaning;
  }

  // For "i'm", "we're", "you're", "it's", "he's", etc. -> just the meaning
  if (["'m", "'re", "'s", "'d"].includes(cType)) {
    return meaning;
  }

  // Fallback
  return validPart;
}
