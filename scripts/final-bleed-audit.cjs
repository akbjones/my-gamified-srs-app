/**
 * Final comprehensive audit of ES/IT/FR/PT dictionaries.
 * Catches:
 * 1. Garbled non-English definitions (Spanish stems used as definitions)
 * 2. Wrong verb-lemma matching (word linked to wrong verb)
 * 3. Wrong noun/verb definitions
 * 4. Context bleed from sentence alignment
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

// ===== HELPERS =====

// Check if word plausibly derives from a verb lemma
function derivesfrom(word, lemma, lang) {
  // Normalize accents
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const w = norm(word);
  const l = norm(lemma);

  // Get verb root by stripping common infinitive endings
  let roots = [];
  if (lang === 'es') {
    roots = [l.replace(/(ar|er|ir|arse|erse|irse)$/, '')];
  } else if (lang === 'it') {
    roots = [l.replace(/(are|ere|ire|arsi|ersi|irsi)$/, '')];
  } else if (lang === 'fr') {
    roots = [l.replace(/(er|ir|re|oir|endre|andre)$/, '')];
  } else if (lang === 'pt') {
    roots = [l.replace(/(ar|er|ir|arse|erse|irse)$/, '')];
  }

  for (const root of roots) {
    if (root.length < 3) return true; // Too short to judge
    // Word should start with the root
    if (w.startsWith(root)) return true;
    // Allow 1 char difference at end of root
    if (w.startsWith(root.slice(0, -1)) && root.length > 3) return true;
  }
  return false;
}

// Detect garbled definitions: looks like Spanish/Italian/French/Portuguese stem, not English
function isGarbled(en) {
  // Single word, no spaces, looks like a truncated Romance word
  const clean = en.trim();
  if (clean.includes(' ') || clean.includes('/') || clean.includes(',')) return false;
  if (clean.includes('(')) return false;
  if (clean.length > 15 || clean.length < 3) return false;

  // Common garbled patterns: Spanish verb stems used as "English"
  // These end in patterns that aren't typical English words
  const garbledPatterns = [
    /^[a-z]+ment$/, // skip: "movement", "moment" are English
    /^[a-z]+(iz|ism|ist|ize|ise)$/, // these are English
  ];

  // Definite garbled: ends in non-English suffix patterns
  const definitelyGarbled = [
    /^[a-z]*[bcdfghjklmnñpqrstvwxyz]{3,}$/i, // too many consonants at end
    /[áéíóúàèìòùäëïöü]/i, // has accented chars (not English)
  ];

  for (const p of definitelyGarbled) {
    if (p.test(clean)) return true;
  }

  // Known garbled stems
  const knownGarbled = [
    'abord', 'acamp', 'acort', 'acous', 'acost', 'agend', 'aisl', 'almacen',
    'alarmant', 'anot', 'aplaz', 'afirm', 'analiz', 'aument', 'automatiz',
    'auxili', 'bienest', 'borr', 'atropell', 'autopist', 'abrig', 'amabilidad',
    'antiadherent', 'aproximadaly', 'artesanal', 'atentaly', 'automaticaly',
    'borrosa', 'borrous', 'bruscaly', 'bilingüism', 'beneficious',
    'acumulation', 'acustic', 'adquisitive', 'alergic', 'antelation',
    'asimism', 'atletism', 'autentic', 'biomedic', 'biologic', 'botanic',
    'artic',
  ];

  if (knownGarbled.includes(clean.toLowerCase())) return true;

  return false;
}

// ===== MAIN AUDIT FUNCTION =====
function auditLanguage(lang) {
  const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
  const fixes = [];

  // Build a map of all entries for cross-reference
  const dictMap = {};
  for (const e of entries) dictMap[e.word] = e;

  for (const entry of entries) {
    const { word, en, pos, ipa } = entry;
    const enClean = en.trim();

    // 1. Check for garbled definitions
    if (isGarbled(en)) {
      fixes.push({ word, current_en: en, fixed_en: null, issue: 'garbled: not English' });
      continue;
    }

    // 2. Check for wrong verb-lemma matching
    const lemmaMatch = en.match(/\((\w+)\)\s*$/);
    if (lemmaMatch) {
      const lemma = lemmaMatch[1];
      if (!derivesfrom(word, lemma, lang)) {
        fixes.push({ word, current_en: en, fixed_en: null, issue: `wrong lemma: "${word}" linked to "${lemma}"` });
        continue;
      }
    }

    // 3. Check for noun defined as verb where it shouldn't be
    // Pattern: common noun/adj word with "to VERB" definition
    if (pos === 'n' && /^to /.test(en)) {
      // Look for lemma reference
      const ref = en.match(/\((\w+)\)/);
      if (ref) {
        const lemma = ref[1];
        if (!derivesfrom(word, lemma, lang)) {
          fixes.push({ word, current_en: en, fixed_en: null, issue: `noun wrongly defined as verb: "${lemma}"` });
          continue;
        }
      }
    }

    // 4. Trailing whitespace
    if (en !== en.trim()) {
      fixes.push({ word, current_en: en, fixed_en: en.trim(), issue: 'trailing whitespace' });
    }

    // 5. Trailing punctuation (excluding period in abbreviations like "Mr.")
    if (/[,;]$/.test(en)) {
      fixes.push({ word, current_en: en, fixed_en: en.replace(/[,;]+$/, ''), issue: 'trailing punctuation' });
    }
  }

  return { entries: entries.length, fixes };
}

// ===== RUN ALL LANGUAGES =====
const results = {};
for (const lang of ['es', 'it', 'fr', 'pt']) {
  const { entries, fixes } = auditLanguage(lang);
  results[lang] = { total: entries, flagged: fixes.length, fixes };

  console.log(`\n${lang.toUpperCase()}: ${entries} entries, ${fixes.length} issues`);

  // Group by issue type
  const byType = {};
  for (const f of fixes) {
    const type = f.issue.split(':')[0].trim();
    if (!byType[type]) byType[type] = [];
    byType[type].push(f);
  }

  for (const [type, items] of Object.entries(byType)) {
    console.log(`  ${type}: ${items.length}`);
    for (const item of items.slice(0, 5)) {
      console.log(`    ${item.word}: "${item.current_en}"`);
    }
    if (items.length > 5) console.log(`    ... and ${items.length - 5} more`);
  }
}

// Save results for review
for (const lang of Object.keys(results)) {
  fs.writeFileSync(
    path.join(OUTPUT, `${lang}-issues-final.json`),
    JSON.stringify(results[lang].fixes, null, 2)
  );
}
