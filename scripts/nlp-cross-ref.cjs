#!/usr/bin/env node
/**
 * Cross-reference Stanza NLP results with our dictionaries.
 *
 * Reads: scripts/nlp-qc-results.json (from nlp-qc.py)
 * Reads: src/data/dictionary/*.ts (our dictionaries)
 * Outputs: corrections to apply via fix-dictionaries.cjs overrides
 */

const fs = require('fs');
const vm = require('vm');

// Load NLP results
const nlpResults = JSON.parse(fs.readFileSync('scripts/nlp-qc-results.json', 'utf8'));

// Stanza UPOS → our POS
const UPOS_MAP = {
  'NOUN': 'n', 'PROPN': 'n',
  'VERB': 'v', 'AUX': 'v',
  'ADJ': 'adj', 'ADV': 'adv',
  'ADP': 'prep', 'DET': 'det',
  'PRON': 'pron', 'NUM': 'num',
  'CONJ': 'conj', 'CCONJ': 'conj', 'SCONJ': 'conj',
  'PART': 'part', 'INTJ': 'intj',
};

// Dict config
const DICT_CONFIG = {
  hi: { file: 'src/data/dictionary/hi.ts', varPattern: /=\s*\{([\s\S]*)\};/ },
  de: { file: 'src/data/dictionary/de.ts', varName: 'DICT' },
  fr: { file: 'src/data/dictionary/fr.ts' },
  es: { file: 'src/data/dictionary/es.ts' },
  it: { file: 'src/data/dictionary/it.ts' },
  pt: { file: 'src/data/dictionary/pt.ts' },
  ru: { file: 'src/data/dictionary/ru.ts' },
  tr: { file: 'src/data/dictionary/tr.ts' },
  sv: { file: 'src/data/dictionary/sv.ts' },
  nl: { file: 'src/data/dictionary/nl.ts' },
};

function loadDict(config) {
  const content = fs.readFileSync(config.file, 'utf8');

  // Find dict declaration
  const varName = config.varName || 'dictionary';
  const patterns = [
    new RegExp(`(?:export\\s+)?const\\s+${varName}\\s*:\\s*Record<[^>]+>\\s*=\\s*\\{`, 'm'),
    new RegExp(`(?:export\\s+)?const\\s+${varName}\\s*=\\s*\\{`, 'm'),
  ];

  let match = null;
  for (const pat of patterns) { match = content.match(pat); if (match) break; }
  if (!match) throw new Error(`Can't find dict in ${config.file}`);

  const declEnd = match.index + match[0].length;
  let depth = 1, i = declEnd;
  while (i < content.length && depth > 0) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (ch === "'" || ch === '"') {
      const q = ch; i++;
      while (i < content.length) { if (content[i] === '\\') { i += 2; continue; } if (content[i] === q) break; i++; }
    }
    i++;
  }

  const body = content.slice(declEnd, i - 1);
  return vm.runInNewContext('({' + body + '})', {}, { timeout: 10000 });
}

// Known English verbs (abbreviated set for checking)
const KNOWN_VERBS = new Set(fs.readFileSync('scripts/fix-dictionaries.cjs', 'utf8')
  .match(/KNOWN_ENGLISH_VERBS = new Set\(\[([\s\S]*?)\]\)/)?.[1]
  ?.match(/'(\w+)'/g)?.map(s => s.replace(/'/g, '')) || []);

const allCorrections = {};
const stats = { totalMismatches: 0, verbLemmaFixes: 0, posFixes: 0, nameFixes: 0 };

for (const [lang, nlpData] of Object.entries(nlpResults)) {
  const config = DICT_CONFIG[lang];
  if (!config) continue;

  let dict;
  try { dict = loadDict(config); }
  catch (e) { console.log(`${lang}: ${e.message}`); continue; }

  const corrections = {};

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Cross-referencing: ${lang.toUpperCase()}`);
  console.log('='.repeat(60));

  // 1. Verb lemma corrections: Stanza knows the correct infinitive
  let verbFixes = 0;
  for (const [word, info] of Object.entries(nlpData.verb_lemmas || {})) {
    const entry = dict[word];
    if (!entry) continue;

    const stanzaLemma = info.lemma;

    // Check if our entry is missing a lemma or has wrong one
    if (entry.pos === 'n' && info.verb_pct > 0.7) {
      // Word is used as verb >70% of time but we have it as noun
      corrections[word] = {
        en: entry.en.startsWith('to ') ? entry.en : `to ${entry.en}`,
        pos: 'v',
        ...(stanzaLemma && dict[stanzaLemma] ? { lemma: stanzaLemma } : {}),
        _reason: `Stanza: ${info.verb_pct.toFixed(0)}% verb, lemma=${stanzaLemma}`,
      };
      verbFixes++;
    }
    else if (entry.pos === 'v' && !entry.lemma && stanzaLemma && dict[stanzaLemma]) {
      // Entry is a verb but missing lemma – Stanza provides it
      corrections[word] = {
        ...entry,
        lemma: stanzaLemma,
        _reason: `Missing lemma, Stanza says: ${stanzaLemma}`,
      };
      verbFixes++;
    }
    else if (entry.pos === 'v' && entry.en && !entry.en.startsWith('to ') && !entry.en.includes(';')) {
      // Verb without "to" prefix
      if (stanzaLemma && dict[stanzaLemma] && dict[stanzaLemma].en) {
        corrections[word] = {
          ...entry,
          en: dict[stanzaLemma].en,
          lemma: stanzaLemma,
          _reason: `Verb missing 'to', using lemma translation`,
        };
        verbFixes++;
      }
    }
  }

  // 2. POS mismatches: where Stanza disagrees with our dictionary
  let posFixes = 0;
  for (const [word, info] of Object.entries(nlpData.pos_analysis || {})) {
    if (corrections[word]) continue; // already corrected
    const entry = dict[word];
    if (!entry) continue;
    if (info.confidence < 0.8) continue; // only fix high-confidence mismatches

    const stanzaPos = UPOS_MAP[info.stanza_pos];
    if (!stanzaPos) continue;

    // Only flag significant mismatches
    if (entry.pos === stanzaPos) continue;

    // Don't change verbs to nouns (Stanza sometimes gets auxiliary verbs wrong)
    if (entry.pos === 'v' && stanzaPos === 'n') continue;

    // Don't change entries that have lemma (they're inflected forms, POS is intentional)
    if (entry.lemma) continue;

    // Noun→Verb is significant
    if (entry.pos === 'n' && stanzaPos === 'v' && info.confidence > 0.9) {
      corrections[word] = {
        ...entry,
        pos: 'v',
        _reason: `POS mismatch: ours=${entry.pos}, Stanza=${info.stanza_pos} (${(info.confidence*100).toFixed(0)}% conf, ${info.count}x)`,
      };
      posFixes++;
    }
  }

  // 3. Name detection
  let nameFixes = 0;
  for (const [word, info] of Object.entries(nlpData.names || {})) {
    const entry = dict[word];
    if (!entry) continue;
    if (entry.en && entry.en.includes(';')) continue; // already has dual meaning

    // Check if the entry just shows the meaning without the name
    const currentEn = entry.en || '';
    const isJustMeaning = !currentEn.match(/^[A-Z][a-z]/); // doesn't start with capitalised name

    if (isJustMeaning && info.per_count >= 2) {
      // Create "Name; meaning" format
      // Capitalize the word as a romanized name
      const romanName = word.charAt(0).toUpperCase() + word.slice(1);
      corrections[word] = {
        ...entry,
        en: `${romanName}; ${currentEn}`,
        _reason: `NER: used as name ${info.per_count}/${info.count}x`,
      };
      nameFixes++;
    }
  }

  allCorrections[lang] = corrections;

  console.log(`  Verb lemma fixes: ${verbFixes}`);
  console.log(`  POS fixes: ${posFixes}`);
  console.log(`  Name fixes: ${nameFixes}`);
  console.log(`  Total corrections: ${Object.keys(corrections).length}`);

  // Print sample corrections
  const samples = Object.entries(corrections).slice(0, 15);
  if (samples.length) {
    console.log(`  Samples:`);
    samples.forEach(([word, corr]) => {
      console.log(`    '${word}': en='${corr.en}' pos=${corr.pos} ${corr.lemma ? 'lemma=' + corr.lemma : ''} [${corr._reason}]`);
    });
  }

  stats.totalMismatches += Object.keys(corrections).length;
  stats.verbLemmaFixes += verbFixes;
  stats.posFixes += posFixes;
  stats.nameFixes += nameFixes;
}

// Save corrections
const outputPath = 'scripts/nlp-corrections.json';
// Strip _reason fields for clean output
const cleanCorrections = {};
for (const [lang, corrs] of Object.entries(allCorrections)) {
  cleanCorrections[lang] = {};
  for (const [word, corr] of Object.entries(corrs)) {
    const { _reason, ...clean } = corr;
    cleanCorrections[lang][word] = clean;
  }
}
fs.writeFileSync(outputPath, JSON.stringify(cleanCorrections, null, 2));

console.log(`\n${'='.repeat(60)}`);
console.log('GRAND TOTALS');
console.log('='.repeat(60));
console.log(`  Total corrections: ${stats.totalMismatches}`);
console.log(`  Verb lemma fixes: ${stats.verbLemmaFixes}`);
console.log(`  POS fixes: ${stats.posFixes}`);
console.log(`  Name fixes: ${stats.nameFixes}`);
console.log(`\nCorrections saved to ${outputPath}`);
