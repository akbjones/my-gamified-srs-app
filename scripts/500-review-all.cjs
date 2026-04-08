#!/usr/bin/env node
/**
 * 500-entry quality review for ALL 11 language dictionaries.
 * Checks: to_prefix, pos_match, truncation, self-ref, grammar-desc, mixed-case, real-english, length
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const DICT_DIR = path.join(BASE, 'src/data/dictionary');
const OUT_DIR = path.join(BASE, 'scripts/output');

const LANGUAGES = ['es', 'it', 'fr', 'pt', 'de', 'nl', 'sv', 'cy', 'hi', 'tr', 'ru'];
const SAMPLE_SIZE = 500;

// Known cognates that are the same in English and the source language
const COGNATES = new Set([
  'hotel', 'taxi', 'piano', 'pasta', 'park', 'bus', 'chocolate', 'radio',
  'yoga', 'safari', 'banana', 'karate', 'tsunami', 'guru', 'karma',
  'pizza', 'café', 'coffee', 'visa', 'sofa', 'opera', 'drama', 'album',
  'video', 'internet', 'email', 'blog', 'menu', 'tennis', 'golf', 'rugby',
  'football', 'volleyball', 'basketball', 'cricket', 'hockey', 'polo',
  'metro', 'auto', 'casino', 'studio', 'disco', 'salsa', 'tango', 'samba',
  'lemon', 'mango', 'kiwi', 'champagne', 'whisky', 'vodka', 'gin', 'rum',
  'hamburger', 'sandwich', 'kebab', 'sushi', 'tofu', 'curry',
  'avatar', 'mantra', 'nirvana', 'zen', 'chai', 'jungle',
  'cotton', 'silk', 'denim', 'nylon', 'polyester',
  'algebra', 'algorithm', 'zero', 'chemistry',
  'normal', 'digital', 'modern', 'musical', 'social', 'final', 'central',
  'general', 'global', 'local', 'total', 'legal', 'fatal', 'formal',
  'natural', 'cultural', 'personal', 'original', 'national', 'international',
  'universal', 'liberal', 'federal', 'criminal', 'animal', 'hospital',
  'festival', 'festival', 'canal', 'metal', 'crystal', 'coral',
  'computer', 'scanner', 'printer', 'router', 'server',
  'test', 'data', 'system', 'program', 'format',
  'bar', 'pub', 'club', 'grill', 'brunch',
  'web', 'wifi', 'app', 'spam', 'kit',
  'sport', 'team', 'goal', 'fan', 'match',
  'stop', 'start', 'plus', 'minus',
  'zen', 'yin', 'yang', 'chi',
  'ok', 'cool', 'super', 'extra', 'ultra',
  'minimum', 'maximum', 'premium', 'medium',
  'status', 'campus', 'virus', 'bonus', 'focus', 'genius',
  'robot', 'pilot', 'talent', 'moment', 'concert', 'accent',
  'tourist', 'artist', 'pianist',
  'routine', 'magazine', 'machine', 'regime',
  'garage', 'massage', 'sabotage', 'camouflage', 'mirage',
  'ballet', 'beret', 'buffet', 'bouquet', 'parquet', 'croquet',
  'chef', 'fiancé', 'résumé', 'cliché', 'naïve', 'début',
  'coup', 'faux', 'genre', 'noir', 'elite',
  'guru', 'panda', 'cobra', 'gorilla', 'jaguar',
  'yoga', 'nirvana', 'avatar', 'jungle', 'loot', 'thug',
]);

// Grammar description starters
const GRAMMAR_STARTERS = [
  'oblique', 'nominative', 'accusative', 'dative', 'genitive', 'vocative',
  'strong inflection', 'weak inflection', 'inflection of', 'form of',
  'past participle', 'present participle', 'gerund of',
  'plural of', 'singular of', 'feminine of', 'masculine of',
  'diminutive of', 'augmentative of', 'superlative of', 'comparative of',
];

// Common English words for basic "real english" check
const COMMON_EN_WORDS = new Set([
  'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'from',
  'by', 'is', 'it', 'and', 'or', 'but', 'not', 'no', 'be', 'do', 'have',
  'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our',
  'this', 'that', 'up', 'out', 'down', 'off', 'over', 'one', 'all',
]);

function parseDictionary(lang) {
  const filePath = path.join(DICT_DIR, `${lang}.ts`);
  const content = fs.readFileSync(filePath, 'utf-8');

  const entries = [];
  // Match dictionary entries: 'key': { en: '...', ... pos: '...' }
  // Handle both single and double-quoted keys
  const entryRegex = /(['"])((?:(?!\1).|\\.)+)\1\s*:\s*\{([^}]+)\}/g;
  let m;
  while ((m = entryRegex.exec(content)) !== null) {
    const key = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    const body = m[3];

    // Extract en
    const enMatch = body.match(/en:\s*(['"])((?:(?!\1).|\\.)*)(\1)/);
    if (!enMatch) continue;
    const en = enMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"');

    // Extract pos
    const posMatch = body.match(/pos:\s*['"]([^'"]*)['"]/);
    const pos = posMatch ? posMatch[1] : '';

    entries.push({ key, en, pos });
  }

  return entries;
}

function shuffleArray(arr) {
  // Fisher-Yates
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function checkEntry(entry) {
  const { key, en, pos } = entry;
  const enLower = en.toLowerCase().trim();
  const keyLower = key.toLowerCase().trim();
  const failures = [];

  // a. to_prefix_correct
  if (pos === 'v') {
    if (!enLower.startsWith('to ') && !enLower.includes('; to ') && !enLower.includes(', to ')) {
      // Allow some verb forms that don't need "to": gerunds, "I am", etc.
      if (!/^(i |he |she |we |they |it |let |don't |can |will |would |could |should |may |might |must )/.test(enLower)) {
        failures.push('to_prefix');
      }
    }
  } else if (pos && pos !== 'v') {
    // Non-verbs shouldn't start with "to " (unless it's like "to the left")
    if (enLower.startsWith('to ') && !enLower.startsWith('to the ') && !enLower.startsWith('to a ')) {
      // Check if it's a common phrasal usage
      const afterTo = enLower.slice(3);
      // If what follows "to" looks like a verb infinitive, flag it
      if (!/^(the |a |an |this |that |some |each |every |one |two |three )/.test(afterTo)) {
        failures.push('to_prefix');
      }
    }
  }

  // b. pos_matches_en (light check)
  if (pos === 'v' && enLower.startsWith('to ')) {
    // Good - verb with "to"
  } else if (pos === 'adj' && enLower.startsWith('to ')) {
    failures.push('pos_mismatch');
  } else if (pos === 'n' && enLower.startsWith('to ') && !enLower.startsWith('to the ') && !enLower.startsWith('to a ')) {
    const afterTo = enLower.slice(3);
    if (!/^(the |a |an |this |that )/.test(afterTo)) {
      failures.push('pos_mismatch');
    }
  }

  // c. not_truncated
  if (en.endsWith('...') || en.endsWith('…')) {
    failures.push('truncated');
  }
  // Suspiciously short for non-function words
  const functionWords = new Set(['a', 'i', 'o', 'an', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'ok', 'on', 'or', 'ox', 'so', 'to', 'up', 'us', 'we']);
  if (en.length < 2 && !functionWords.has(enLower)) {
    failures.push('truncated');
  }

  // d. not_self_referencing
  if (enLower === keyLower && !COGNATES.has(enLower)) {
    // Check if it's a proper noun (capitalized en)
    if (en[0] !== en[0].toUpperCase() || en === en.toLowerCase()) {
      failures.push('self_ref');
    }
  }

  // e. not_grammar_desc
  for (const starter of GRAMMAR_STARTERS) {
    if (enLower.startsWith(starter)) {
      failures.push('grammar_desc');
      break;
    }
  }

  // f. not_mixed_case (weird case patterns)
  if (/[a-z][A-Z]/.test(en.slice(1)) && !en.includes('-') && !en.includes("'")) {
    // Allow camelCase-looking things only if they look intentional
    if (!/^(WiFi|iPhone|iPad|YouTube|WhatsApp|LinkedIn|JavaScript|TypeScript)$/i.test(en)) {
      failures.push('mixed_case');
    }
  }
  // Check for specifically weird patterns like "tO" or "dO"
  if (/\b[a-z][A-Z]/.test(en)) {
    if (!/^(WiFi|iPhone|iPad|YouTube|WhatsApp|LinkedIn)$/i.test(en)) {
      // Already caught above, skip double-counting
      if (!failures.includes('mixed_case')) {
        failures.push('mixed_case');
      }
    }
  }

  // g. is_real_english
  // Simple heuristic: split into words, at least one should be a recognizable English word
  // or the whole thing should be alphabetic (proper nouns, etc.)
  const words = enLower.replace(/[;,()]/g, ' ').split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) {
    failures.push('not_english');
  } else if (words.length === 1 && words[0].length > 2) {
    // Single word - check it's not pure gibberish (has vowels)
    if (!/[aeiou]/i.test(words[0])) {
      failures.push('not_english');
    }
  }

  // h. reasonable_length
  if (en.length < 1 || en.length > 60) {
    failures.push('bad_length');
  }

  return failures;
}

function getGrade(passRate) {
  if (passRate >= 95) return 'A';
  if (passRate >= 85) return 'B';
  if (passRate >= 75) return 'C';
  if (passRate >= 65) return 'D';
  return 'F';
}

// Main
const results = {};

for (const lang of LANGUAGES) {
  console.log(`\nProcessing ${lang.toUpperCase()}...`);
  const entries = parseDictionary(lang);
  console.log(`  Parsed ${entries.length} entries`);

  const sample = shuffleArray(entries).slice(0, SAMPLE_SIZE);
  console.log(`  Sampled ${sample.length} entries`);

  const failuresByType = {};
  const failureExamples = [];
  let passed = 0;
  let failed = 0;

  for (const entry of sample) {
    const issues = checkEntry(entry);
    if (issues.length === 0) {
      passed++;
    } else {
      failed++;
      for (const issue of issues) {
        failuresByType[issue] = (failuresByType[issue] || 0) + 1;
      }
      if (failureExamples.length < 30) {
        failureExamples.push({
          word: entry.key,
          en: entry.en,
          pos: entry.pos,
          issues: issues.join(', ')
        });
      }
    }
  }

  const passRate = (passed / sample.length * 100).toFixed(1);
  const grade = getGrade(parseFloat(passRate));

  const result = {
    language: lang,
    total_entries: entries.length,
    total_checked: sample.length,
    passed,
    failed,
    pass_rate: `${passRate}%`,
    grade,
    failures_by_type: failuresByType,
    failure_examples: failureExamples
  };

  results[lang] = result;
  console.log(`  Result: ${passed}/${sample.length} passed (${passRate}%) — Grade ${grade}`);

  // Write individual JSON
  fs.writeFileSync(
    path.join(OUT_DIR, `${lang}-500-review.json`),
    JSON.stringify(result, null, 2)
  );
}

// Write summary markdown
const summaryLines = [
  '# 500-Entry Dictionary Review Summary',
  '',
  `Date: ${new Date().toISOString().split('T')[0]}`,
  `Sample size: ${SAMPLE_SIZE} random entries per language`,
  '',
  '## Results',
  '',
  '| Language | Entries | Checked | Passed | Failed | Rate | Grade |',
  '|----------|---------|---------|--------|--------|------|-------|',
];

for (const lang of LANGUAGES) {
  const r = results[lang];
  summaryLines.push(
    `| ${lang.toUpperCase()} | ${r.total_entries} | ${r.total_checked} | ${r.passed} | ${r.failed} | ${r.pass_rate} | ${r.grade} |`
  );
}

summaryLines.push('');
summaryLines.push('## Failure Breakdown by Type');
summaryLines.push('');
summaryLines.push('| Language | to_prefix | pos_mismatch | truncated | self_ref | grammar_desc | mixed_case | not_english | bad_length |');
summaryLines.push('|----------|-----------|--------------|-----------|----------|--------------|------------|-------------|------------|');

for (const lang of LANGUAGES) {
  const f = results[lang].failures_by_type;
  summaryLines.push(
    `| ${lang.toUpperCase()} | ${f.to_prefix||0} | ${f.pos_mismatch||0} | ${f.truncated||0} | ${f.self_ref||0} | ${f.grammar_desc||0} | ${f.mixed_case||0} | ${f.not_english||0} | ${f.bad_length||0} |`
  );
}

summaryLines.push('');
summaryLines.push('## Top Failure Examples per Language');
summaryLines.push('');

for (const lang of LANGUAGES) {
  const r = results[lang];
  if (r.failure_examples.length > 0) {
    summaryLines.push(`### ${lang.toUpperCase()} (Grade ${r.grade}, ${r.pass_rate})`);
    summaryLines.push('');
    const top = r.failure_examples.slice(0, 10);
    for (const ex of top) {
      summaryLines.push(`- **${ex.word}**: "${ex.en}" (pos=${ex.pos}) -- ${ex.issues}`);
    }
    summaryLines.push('');
  }
}

summaryLines.push('---');
summaryLines.push('Grading: A=95%+, B=85-94%, C=75-84%, D=65-74%, F=<65%');

fs.writeFileSync(
  path.join(OUT_DIR, '500-review-summary.md'),
  summaryLines.join('\n')
);

console.log('\n=== SUMMARY ===');
console.log('| Lang | Passed | Failed | Rate   | Grade |');
console.log('|------|--------|--------|--------|-------|');
for (const lang of LANGUAGES) {
  const r = results[lang];
  console.log(`| ${lang.toUpperCase().padEnd(4)} | ${String(r.passed).padEnd(6)} | ${String(r.failed).padEnd(6)} | ${r.pass_rate.padEnd(6)} | ${r.grade}     |`);
}
console.log('\nDone! Results in scripts/output/');
