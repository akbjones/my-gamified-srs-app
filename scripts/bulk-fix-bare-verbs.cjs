#!/usr/bin/env node
/**
 * Bulk fix bare verbs across all dictionaries.
 *
 * For every entry where pos:'v' but en doesn't start with "to ":
 * 1. If has lemma in dict → copy lemma's en (with "to " prefix added if missing)
 * 2. If no lemma but has Stanza lemma → try lemma + suffix variations to find infinitive
 * 3. If still no luck → just prefix "to " to the existing translation, ensuring it's lowercase
 *
 * Skip if en contains ; (dual meaning intentional)
 */

const fs = require('fs');
const vm = require('vm');

const NLP_DATA = (() => {
  try { return JSON.parse(fs.readFileSync('scripts/nlp-qc-results.json', 'utf8')); }
  catch { return {}; }
})();

const LANGS = [
  { code: 'es', file: 'src/data/dictionary/es.ts', varName: 'dictionary' },
  { code: 'fr', file: 'src/data/dictionary/fr.ts', varName: 'dictionary' },
  { code: 'it', file: 'src/data/dictionary/it.ts', varName: 'dictionary' },
  { code: 'pt', file: 'src/data/dictionary/pt.ts', varName: 'dictionary' },
  { code: 'de', file: 'src/data/dictionary/de.ts', varName: 'DICT' },
  { code: 'nl', file: 'src/data/dictionary/nl.ts', varName: 'dictionary' },
  { code: 'sv', file: 'src/data/dictionary/sv.ts', varName: 'dictionary' },
  { code: 'cy', file: 'src/data/dictionary/cy.ts', varName: 'dict' },
  { code: 'hi', file: 'src/data/dictionary/hi.ts', varName: 'dictionary' },
  { code: 'tr', file: 'src/data/dictionary/tr.ts', varName: 'dictionary' },
  { code: 'ru', file: 'src/data/dictionary/ru.ts', varName: 'dictionary' },
];

// Known patterns to convert to infinitive
const SUBJECT_PREFIXES = /^(I|he|she|it|we|they|you|one|someone|there) /i;
const AUX_PREFIXES = /^(am|is|are|was|were|been|be|being|have|has|had|do|does|did|will|would|shall|should|can|could|may|might|must)\s+/i;
const ING_VERBS_AS_NOUNS = /^(meeting|building|writing|painting|drawing|reading|swimming|running|walking|cooking|cleaning|warning|opening|ending|beginning|feeling|meaning|saying|hearing|setting|showing|teaching|learning|earning)$/i;

function loadDict(file, varName) {
  const c = fs.readFileSync(file, 'utf8');
  const re = new RegExp(`(?:export\\s+)?const\\s+${varName}\\s*(?::\\s*Record<[^>]+>\\s*)?=\\s*\\{`, 'm');
  const m = c.match(re);
  if (!m) throw new Error('No match');
  const declEnd = m.index + m[0].length;
  let depth = 1, i = declEnd;
  while (i < c.length && depth > 0) {
    const ch = c[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (ch === "'" || ch === '"') {
      const q = ch; i++;
      while (i < c.length) { if (c[i] === '\\') { i += 2; continue; } if (c[i] === q) break; i++; }
    }
    i++;
  }
  return { dict: vm.runInNewContext('({' + c.slice(declEnd, i - 1) + '})', {}, { timeout: 10000 }), preCode: c.slice(0, declEnd), postStart: i };
}

function tryInfinitiveFromStanza(stanzaLemma, dict, langCode) {
  // For Russian and Hindi, Stanza often gives "bare stem" – try to match dictionary infinitive
  const candidates = [stanzaLemma];

  // Russian verb endings
  if (langCode === 'ru') {
    candidates.push(stanzaLemma + 'ть', stanzaLemma + 'ти', stanzaLemma + 'чь', stanzaLemma + 'ться', stanzaLemma + 'тись');
  }
  // Romance language endings
  if (['es', 'pt', 'fr', 'it'].includes(langCode)) {
    candidates.push(stanzaLemma + 'ar', stanzaLemma + 'er', stanzaLemma + 'ir', stanzaLemma + 're');
  }
  // Germanic endings
  if (['de', 'nl', 'sv'].includes(langCode)) {
    candidates.push(stanzaLemma + 'en', stanzaLemma + 'eln', stanzaLemma + 'ern', stanzaLemma + 'a');
  }
  // Hindi
  if (langCode === 'hi') {
    candidates.push(stanzaLemma + 'ना');
  }
  // Turkish
  if (langCode === 'tr') {
    candidates.push(stanzaLemma + 'mek', stanzaLemma + 'mak');
  }
  // Welsh
  if (langCode === 'cy') {
    candidates.push(stanzaLemma + 'i', stanzaLemma + 'u', stanzaLemma + 'o');
  }

  for (const c of candidates) {
    if (dict[c] && dict[c].pos === 'v' && dict[c].en) return c;
  }
  return null;
}

function cleanVerbTranslation(en) {
  if (!en) return en;
  let cleaned = en.trim();

  // Strip subject pronouns
  cleaned = cleaned.replace(SUBJECT_PREFIXES, '');
  // Strip auxiliaries
  cleaned = cleaned.replace(AUX_PREFIXES, '');

  // Lowercase first letter
  if (cleaned[0]) cleaned = cleaned[0].toLowerCase() + cleaned.slice(1);

  // Strip -ing if it's not a noun-like meaning
  if (cleaned.match(/\w+ing$/) && !ING_VERBS_AS_NOUNS.test(cleaned)) {
    const base = cleaned.replace(/ing$/, '');
    if (base.match(/([bcdfgklmnprst])\1$/) && base.length > 3) {
      // running → run (double consonant)
      cleaned = base.slice(0, -1);
    } else {
      cleaned = base;
    }
  }

  // Strip -s/-es 3rd person if present (heuristic)
  // Don't strip from nouns like "duties", "buses"

  return cleaned;
}

const stats = { total: 0, fixedFromLemma: 0, fixedFromStanza: 0, fixedDirect: 0, errors: 0 };

for (const lang of LANGS) {
  console.log(`\n=== ${lang.code.toUpperCase()} ===`);
  let langStats = { fromLemma: 0, fromStanza: 0, direct: 0 };

  let dict;
  try {
    const result = loadDict(lang.file, lang.varName);
    dict = result.dict;
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    stats.errors++;
    continue;
  }

  const stanzaVerbLemmas = NLP_DATA[lang.code]?.verb_lemmas || {};

  // Find bare verbs (no "to " prefix, no semicolon)
  for (const [key, entry] of Object.entries(dict)) {
    if (entry.pos !== 'v') continue;
    if (!entry.en) continue;
    if (entry.en.startsWith('to ')) continue;
    if (entry.en.includes(';')) continue;

    let fixed = false;

    // Strategy 1: use existing lemma
    if (entry.lemma && dict[entry.lemma]) {
      const lemmaEntry = dict[entry.lemma];
      if (lemmaEntry.en) {
        if (lemmaEntry.en.startsWith('to ')) {
          entry.en = lemmaEntry.en;
          fixed = true;
          langStats.fromLemma++;
        } else if (lemmaEntry.en.includes(';')) {
          // Find "to X" part
          const toPart = lemmaEntry.en.split(';').map(s => s.trim()).find(s => s.startsWith('to '));
          if (toPart) {
            entry.en = toPart;
            fixed = true;
            langStats.fromLemma++;
          }
        } else {
          // Lemma also bare – clean it and prefix "to"
          const cleaned = cleanVerbTranslation(lemmaEntry.en);
          entry.en = 'to ' + cleaned;
          fixed = true;
          langStats.fromLemma++;
        }
      }
    }

    // Strategy 2: use Stanza lemma to find dict entry
    if (!fixed && stanzaVerbLemmas[key]) {
      const stanzaLemma = stanzaVerbLemmas[key].lemma;
      const matched = tryInfinitiveFromStanza(stanzaLemma, dict, lang.code);
      if (matched) {
        entry.lemma = matched;
        const lemmaEntry = dict[matched];
        if (lemmaEntry.en.startsWith('to ')) {
          entry.en = lemmaEntry.en;
        } else {
          entry.en = 'to ' + cleanVerbTranslation(lemmaEntry.en);
        }
        fixed = true;
        langStats.fromStanza++;
      }
    }

    // Strategy 3: just clean the existing en + prefix "to"
    if (!fixed) {
      const cleaned = cleanVerbTranslation(entry.en);
      if (cleaned && !cleaned.startsWith('to ')) {
        entry.en = 'to ' + cleaned;
        fixed = true;
        langStats.direct++;
      }
    }

    if (fixed) stats.total++;
  }

  console.log(`  Fixed: ${langStats.fromLemma + langStats.fromStanza + langStats.direct}`);
  console.log(`    From existing lemma: ${langStats.fromLemma}`);
  console.log(`    From Stanza lemma:   ${langStats.fromStanza}`);
  console.log(`    Direct prefix:        ${langStats.direct}`);

  stats.fixedFromLemma += langStats.fromLemma;
  stats.fixedFromStanza += langStats.fromStanza;
  stats.fixedDirect += langStats.direct;
}

console.log('\n=== GRAND TOTALS ===');
console.log(`Total fixes: ${stats.total}`);
console.log(`  From existing lemma: ${stats.fixedFromLemma}`);
console.log(`  From Stanza lemma:   ${stats.fixedFromStanza}`);
console.log(`  Direct prefix:        ${stats.fixedDirect}`);

console.log('\nNOTE: Changes are in memory only – run fix-dictionaries.cjs to write them.');
console.log('Better: Add the fixes to the OVERRIDES section of fix-dictionaries.cjs.');
