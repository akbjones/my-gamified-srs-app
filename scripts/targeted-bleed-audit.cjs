/**
 * Targeted audit: only flag entries that are DEFINITELY wrong.
 * Very conservative – only catches clear-cut errors.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'scripts/output');

// ===== KNOWN GARBLED PATTERNS =====
// These are definitely not English words
const GARBLED_RE = /^(abord|acamp|acort|acous|acost|agend|aisl|almacen|anot|aplaz|afirm|analiz|atropell|aument|automatiz|auxili|bienest|borr|autopist)$/i;

// ===== KNOWN MISSPELLED ENGLISH DEFINITIONS =====
const MISSPELLED = {
  // ES
  'aproximadaly': 'approximately',
  'atentaly': 'attentively',
  'automaticaly': 'automatically',
  'borrous': 'blurry',
  'bruscaly': 'abruptly',
  'beneficious': 'beneficial',
  'acumulation': 'accumulation',
  'acustic': 'acoustic',
  'adquisitive': 'acquisitive',
  'alergic': 'allergic',
  'antelation': 'advance notice',
  'asimism': 'likewise',
  'atletism': 'athletics',
  'autentic': 'authentic',
  'biomedic': 'biomedical',
  'biologic': 'biological',
  'botanic': 'botanical',
  'artic': 'arctic',
  'alarmant': 'alarming',
  'amabilidad': 'kindness',
  'artesanal': 'artisanal',
  'antiadherent': 'non-stick',
  'bilingüism': 'bilingualism',
  'adicional': 'additional',
};

function auditAll() {
  const allFixes = {};

  for (const lang of ['es', 'it', 'fr', 'pt']) {
    const entries = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${lang}-dict-entries.json`)));
    const fixes = [];

    for (const entry of entries) {
      const { word, en, pos, ipa } = entry;

      // 1. Garbled stems used as definitions
      if (GARBLED_RE.test(en.trim())) {
        fixes.push({ word, current_en: en, fixed_en: null, issue: 'garbled stem, not English' });
        continue;
      }

      // 2. Known misspelled definitions
      const enClean = en.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
      const parts = enClean.split(/[,/]/).map(p => p.trim());
      for (const part of parts) {
        if (MISSPELLED[part]) {
          fixes.push({ word, current_en: en, fixed_en: null, issue: `misspelled: "${part}" should be "${MISSPELLED[part]}"` });
          break;
        }
      }

      // 3. Trailing whitespace
      if (en !== en.trim() && en.trim().length > 0) {
        fixes.push({ word, current_en: en, fixed_en: en.trim(), issue: 'trailing whitespace' });
      }
    }

    allFixes[lang] = { total: entries.length, fixes };
    console.log(`${lang.toUpperCase()}: ${entries.length} entries, ${fixes.length} definite issues`);
  }

  return allFixes;
}

const results = auditAll();
for (const lang of Object.keys(results)) {
  for (const f of results[lang].fixes) {
    console.log(`  ${lang} | ${f.word}: "${f.current_en}" – ${f.issue}`);
  }
}
