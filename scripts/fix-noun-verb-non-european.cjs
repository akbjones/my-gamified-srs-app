#!/usr/bin/env node
/**
 * Hunt the same noun ↔ verb polysemy bug in the non-Romance dicts:
 *
 *   German  : 1sg present of -en verbs = verb stem (drop -en, sometimes also
 *             drop final -e of stem). Many nouns share that spelling.
 *             e.g.  arbeite (1sg of arbeiten) – distinct from noun "Arbeit"
 *             but lowercase form arbeite is sometimes still confused.
 *   Dutch   : 1sg present = verb stem (drop -en). e.g. werken → werk (and noun
 *             werk = "work" – same as Italian lavoro pattern).
 *   Swedish : less common, present tense ends in -ar/-er/-r, but the
 *             imperative form (often = noun) ends in -a or stem alone.
 *   Welsh   : multiple irregular conjugation patterns – skip the broad rule.
 *   Hindi   : 1sg present continuous ends in हूँ. Forms are very different
 *             from noun, low false-positive risk.
 *   Turkish : agglutinative; 1sg present is verb-stem + -iyorum. Looks
 *             nothing like the bare noun, so the noun==1sg overlap is rare.
 *             We instead check the lighter pattern: verb-stem alone equals
 *             a noun entry (e.g. "iş" noun "work" vs "iş-le-mek" verb).
 *   Russian : 1sg present ends in -ю/-у. Nouns rarely match exactly.
 *
 * Strategy per language: define the 1sg derivation function. If the noun
 * spelling matches `derive1sg(lemma)` AND the noun's en doesn't already
 * include "I X", append the verb sense to the noun's English.
 */
const fs = require('fs');

function parseDict(path) {
  const text = fs.readFileSync(path, 'utf8');
  const re = /^\s*'([^']+)':\s*\{[^}]*en:\s*'([^']*)'[^}]*pos:\s*'([^']+)'(?:[^}]*lemma:\s*'([^']+)')?[^}]*\},?\s*$/gm;
  const out = {};
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, word, en, pos, lemma] = m;
    out[word] = { en, pos, lemma };
  }
  return out;
}

function englishVerbStem(verbEn) {
  const first = verbEn.split(/[;,]/)[0].trim();
  return first.replace(/^to\s+/, '');
}

// Per-language derive1sg rules.
const LANG_RULES = {
  german: {
    path: 'src/data/dictionary/de.ts',
    label: '1sg of',
    derive1sg(inf) {
      // German: drop -en or -n to get stem, then 1sg = stem + 'e'
      // (arbeiten → arbeit → arbeite; lieben → lieb → liebe)
      // Note: spelling reform – verbs ending -eln/-ern drop -n only (sammeln → sammle).
      if (inf.endsWith('eln')) return inf.slice(0, -3) + 'le';
      if (inf.endsWith('ern')) return inf.slice(0, -3) + 'ere';
      if (inf.endsWith('en'))  return inf.slice(0, -2) + 'e';
      if (inf.endsWith('n'))   return inf.slice(0, -1) + 'e';
      return null;
    },
  },
  dutch: {
    path: 'src/data/dictionary/nl.ts',
    label: '1sg of',
    derive1sg(inf) {
      // Dutch: drop -en to get stem; 1sg = stem. Also collapse double vowels
      // and devoice final consonants per spelling rules (we keep it simple).
      // werken → werk; lopen → loop (long vowel doubles) – skip vowel
      // doubling for now; reasonable hit rate even without.
      if (inf.endsWith('en')) return inf.slice(0, -2);
      return null;
    },
  },
  swedish: {
    path: 'src/data/dictionary/sv.ts',
    label: 'imperative / stem of',
    derive1sg(inf) {
      // Swedish: infinitive ends in -a (most). Imperative = stem (drop -a).
      // Also matches some nouns spelled the same.
      // arbeta → arbet (imperative-like). Most noun matches occur on -a infs.
      if (inf.endsWith('a')) return inf.slice(0, -1);
      return null;
    },
  },
  turkish: {
    path: 'src/data/dictionary/tr.ts',
    label: 'stem of',
    derive1sg(inf) {
      // Turkish infinitives end -mak / -mek. Stem = without that suffix.
      // çalışmak → çalış (stem; noun çalışma "work" close but not identical).
      // We use bare stem here – many noun homonyms.
      if (inf.endsWith('mak') || inf.endsWith('mek')) return inf.slice(0, -3);
      return null;
    },
  },
  russian: {
    path: 'src/data/dictionary/ru.ts',
    label: '1sg of',
    derive1sg(inf) {
      // Russian infinitives end in -ть/-ться. 1sg pattern is harder
      // (consonant alternation, -у/-ю ending). For now, derive a candidate
      // by replacing -ать → -аю / -ять → -яю / -ить → -ю / -еть → -ею.
      // This catches a fair number of the regular cases.
      if (inf.endsWith('аться')) return inf.slice(0, -5) + 'аюсь';
      if (inf.endsWith('ять'))   return inf.slice(0, -3) + 'яю';
      if (inf.endsWith('ать'))   return inf.slice(0, -3) + 'аю';
      if (inf.endsWith('еть'))   return inf.slice(0, -3) + 'ею';
      if (inf.endsWith('ить'))   return inf.slice(0, -3) + 'ю';
      return null;
    },
  },
  hindi: {
    path: 'src/data/dictionary/hi.ts',
    label: '1sg of',
    derive1sg(inf) {
      // Hindi infinitives end in ना. 1sg = stem + ता हूँ (m) – multi-word and
      // unlikely to match a single noun entry. Skip – return null so nothing
      // matches here. Hindi noun-verb polysemy is much rarer in dict shape.
      return null;
    },
  },
};

const HINDI_VERB_NOUNS_NEED_MANUAL_REVIEW = true; // placeholder doc

const allFixes = {};

for (const [lang, rule] of Object.entries(LANG_RULES)) {
  if (!fs.existsSync(rule.path)) continue;
  const entries = parseDict(rule.path);
  const fixes = [];

  for (const word of Object.keys(entries)) {
    const e = entries[word];
    if (e.pos !== 'n') continue;          // only fix nouns; adj past participles are fine
    if (!e.lemma) continue;
    const lemmaEntry = entries[e.lemma];
    if (!lemmaEntry || lemmaEntry.pos !== 'v') continue;

    const expected = rule.derive1sg(e.lemma);
    if (!expected || expected !== word) continue;

    if (/\bI\s+\w/.test(e.en)) continue; // already mentions an I-form

    const stem = englishVerbStem(lemmaEntry.en);
    if (!stem) continue;

    const newEn = `${e.en}; I ${stem} (${rule.label} ${e.lemma})`;
    fixes.push({ word, oldEn: e.en, newEn, lemma: e.lemma });
  }

  allFixes[lang] = fixes;
  console.log(`${lang.padEnd(10)} ${fixes.length} fixes`);
}

console.log('');
for (const [lang, fixes] of Object.entries(allFixes)) {
  if (fixes.length === 0) continue;
  console.log(`--- ${lang.toUpperCase()} ---`);
  fixes.slice(0, 8).forEach(f => {
    console.log(`  ${f.word.padEnd(18)} "${f.oldEn}" → "${f.newEn}"`);
  });
  if (fixes.length > 8) console.log(`  ... and ${fixes.length - 8} more`);
  console.log();
}

const APPLY = process.argv.includes('--apply');
if (APPLY) {
  for (const [lang, fixes] of Object.entries(allFixes)) {
    if (fixes.length === 0) continue;
    let text = fs.readFileSync(LANG_RULES[lang].path, 'utf8');
    let applied = 0;
    for (const f of fixes) {
      const escWord = f.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escOldEn = f.oldEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Skip entries with apostrophes in en (avoid the prego-style mishap)
      if (/\\['"]/.test(f.oldEn) || f.oldEn.includes("'")) continue;
      const re = new RegExp(`(^\\s*'${escWord}':\\s*\\{\\s*en:\\s*')${escOldEn}('[^}]*\\})`, 'm');
      const next = text.replace(re, `$1${f.newEn}$2`);
      if (next !== text) { text = next; applied++; }
    }
    fs.writeFileSync(LANG_RULES[lang].path, text);
    console.log(`${lang}: applied ${applied} / ${fixes.length}`);
  }
}

fs.mkdirSync('scripts/output', { recursive: true });
fs.writeFileSync('scripts/output/noun-verb-non-european-fixes.json', JSON.stringify(allFixes, null, 2));
console.log('\nReport: scripts/output/noun-verb-non-european-fixes.json');
if (!APPLY) console.log('Run with --apply to write changes.');
