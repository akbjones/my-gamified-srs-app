/**
 * Deep audit of Romance-language dictionaries for context-bleed errors.
 * Focuses on REAL context bleed, not just POS mismatches.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

// Known good patterns for comma-separated definitions
// These are synonym patterns that are fine
function areCommaSynonyms(parts) {
  // If all parts are similar length single words/short phrases, likely synonyms
  if (parts.every(p => p.split(' ').length <= 3)) return true;
  return false;
}

function auditEntry(entry, lang) {
  const { word, en, pos, ipa } = entry;
  const enLower = en.toLowerCase().trim();
  const parts = en.split(',').map(p => p.trim()).filter(p => p);

  const issues = [];

  // ===== CONTEXT BLEED CHECKS =====

  // 1. Comma parts that look like adjacent leaked words (not synonyms)
  // Bad pattern: "morning, good" "house, the" "of, the" "time, at"
  if (parts.length >= 2) {
    const functionWords = new Set(['the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'it', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'his', 'her', 'our', 'their', 'this', 'that', 'not', 'do', 'does', 'did', 'has', 'have', 'had', 'will', 'would', 'can', 'could', 'up', 'out', 'off', 'over', 'under', 'after', 'before', 'very', 'too', 'also', 'just', 'only', 'now', 'then', 'here', 'there', 'still', 'already', 'yet', 'again', 'more', 'less', 'much', 'many', 'some', 'any', 'no', 'all', 'each', 'every', 'both', 'few', 'same', 'other', 'so', 'if', 'but', 'or', 'and', 'as', 'be', 'been', 'being']);

    for (const part of parts) {
      const trimmed = part.trim().toLowerCase();
      if (functionWords.has(trimmed)) {
        issues.push(`comma_function: "${en}" – one part is just "${trimmed}"`);
      }
    }

    // Check for inverted/scrambled patterns: "morning, good" instead of "good morning"
    // Where two adjacent parts make a common phrase in reverse
    for (let i = 0; i < parts.length - 1; i++) {
      const combined = parts[i+1].trim().toLowerCase() + ' ' + parts[i].trim().toLowerCase();
      const commonPhrases = ['good morning', 'good night', 'good afternoon', 'good evening', 'too much', 'at least', 'at all', 'even though', 'of course', 'right now', 'each other', 'so much', 'as well', 'how much', 'how many', 'too many', 'after all', 'in front', 'on top'];
      if (commonPhrases.includes(combined)) {
        issues.push(`reversed_phrase: "${en}" – should be "${combined}"`);
      }
    }
  }

  // 2. Definition starts with article "the" for non-determiner words
  // This is context bleed when the alignment grabbed "the house" instead of just "house"
  if (/^the /i.test(en) && pos !== 'det' && pos !== 'art') {
    // Allow "the" for some legitimate cases
    const afterThe = en.replace(/^the /i, '');
    // If pos is noun, "the X" suggests context bleed – should just be "X"
    issues.push(`leaked_the: "${en}" – should be "${afterThe}"`);
  }

  // 3. Definition starts with "a/an" for non-determiner words (nouns are borderline OK)
  if (/^(a|an) /i.test(en) && pos !== 'det' && pos !== 'art' && pos !== 'n') {
    issues.push(`leaked_article: "${en}"`);
  }

  // 4. Definition is a sentence fragment with subject + verb
  // "I go to the store" is not a definition
  if (/^(i|you|we|they|he|she|it) (am|are|is|was|were|have|has|had|go|went|come|came|do|did|make|made|take|took|get|got|see|saw|know|knew|think|thought|want|wanted|need|needed|like|liked|say|said|tell|told|give|gave|put|keep|kept|let|begin|began|seem|seemed|help|helped|show|showed|turn|turned|play|played|run|ran|move|moved|live|lived|believe|believed|hold|held|bring|brought|happen|happened|write|wrote|sit|sat|stand|stood|lose|lost|pay|paid|meet|met|include|included|continue|continued|set|learn|learned|change|changed|lead|led|understand|understood|watch|watched|follow|followed|stop|stopped|create|created|speak|spoke|read|allow|allowed|add|added|grow|grew|open|opened|walk|walked|win|won|offer|offered|remember|remembered|love|loved|consider|considered|appear|appeared|buy|bought|wait|waited|serve|served|die|died|send|sent|expect|expected|build|built|stay|stayed|fall|fell|cut|reach|reached|kill|killed|remain|remained|suggest|suggested|raise|raised|pass|passed|sell|sold|require|required|report|reported|decide|decided|pull|pulled|develop|developed|eat|ate|drive|drove|spend|spent|thank|thanked)\b/i.test(enLower)) {
    // This is likely a verb conjugation definition, which is actually OK for verb forms
    // Only flag if it's not a verb and the definition is clearly a sentence
    if (pos !== 'v' && en.split(' ').length > 4) {
      issues.push(`sentence_fragment: "${en}"`);
    }
  }

  // 5. Definition has clearly wrong meaning based on common words
  // Cross-check known word↔meaning pairs
  const knownBad = checkKnownErrors(word, en, lang);
  if (knownBad) issues.push(knownBad);

  // 6. Empty/too-short definitions
  if (en.length === 0) {
    issues.push('empty definition');
  }

  // 7. Trailing/leading whitespace or punctuation issues
  if (en !== en.trim()) {
    issues.push(`whitespace: "${en}"`);
  }
  if (en.endsWith(',') || en.endsWith('.') || en.endsWith(';')) {
    issues.push(`trailing_punct: "${en}"`);
  }

  // 8. Definition too long (likely a phrase, not a word definition)
  if (en.length > 80) {
    issues.push(`very_long: "${en}" (${en.length} chars)`);
  }

  // 9. "to" prefix for nouns (wrong POS or wrong def)
  if (/^to /i.test(en) && pos === 'n') {
    // Check if the word is actually a noun – "ahorros" means "savings" not "to save"
    issues.push(`noun_with_to: "${word}" has en="${en}" but pos=n`);
  }

  return issues.length > 0 ? { word, en, pos, ipa, issues } : null;
}

function checkKnownErrors(word, en, lang) {
  // Spanish known-good checks
  if (lang === 'es') {
    const checks = {
      'hola': ['hello', 'hi'],
      'casa': ['house', 'home'],
      'agua': ['water'],
      'comida': ['food', 'meal'],
      'perro': ['dog'],
      'gato': ['cat'],
      'libro': ['book'],
      'bueno': ['good'],
      'malo': ['bad'],
      'grande': ['big', 'large', 'great'],
      'pequeño': ['small', 'little'],
    };
    if (checks[word]) {
      const enLower = en.toLowerCase();
      if (!checks[word].some(c => enLower.includes(c))) {
        return `wrong_meaning: "${word}" should contain one of [${checks[word].join(', ')}] but has "${en}"`;
      }
    }
  }
  return null;
}

for (const lang of ['es', 'it', 'fr', 'pt']) {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  const flagged = [];

  for (const entry of entries) {
    const result = auditEntry(entry, lang);
    if (result) flagged.push(result);
  }

  fs.writeFileSync(
    path.join(OUTPUT, `${lang}-flagged-v2.json`),
    JSON.stringify(flagged, null, 2)
  );
  console.log(`${lang}: ${entries.length} total, ${flagged.length} flagged`);

  // Print summary of issue types
  const issueCounts = {};
  for (const f of flagged) {
    for (const issue of f.issues) {
      const type = issue.split(':')[0];
      issueCounts[type] = (issueCounts[type] || 0) + 1;
    }
  }
  console.log(`  Issue types:`, issueCounts);
}
