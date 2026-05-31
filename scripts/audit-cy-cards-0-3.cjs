#!/usr/bin/env node
/**
 * Card-by-card audit of Welsh batches 0-3 (~2000 cards).
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 * duplicates, vocabulary appropriateness, audio existence.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'quest-audio');
const DICT_PATH = path.join(ROOT, 'src', 'data', 'dictionary', 'cy.ts');

// ── Load dictionary keys ──────────────────────────────────────────────
function loadDictKeys() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const keys = new Set();
  // Match both 'key': and "key":
  const re = /^\s*(['"])(.*?)\1\s*:\s*\{/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    keys.add(m[2].toLowerCase());
  }
  return keys;
}

const dictKeys = loadDictKeys();
console.log(`Dictionary: ${dictKeys.size} keys loaded`);

// ── Welsh mutation system for lookup ──────────────────────────────────
const softReverse = {
  'g': ['c'], 'b': ['p'], 'd': ['t'], 'f': ['b', 'm'], 'dd': ['d'], 'l': ['ll'], 'r': ['rh'],
};

function clean(w) {
  return w.toLowerCase().replace(/[¿¡.,!?;:"""''()—–«»\d/]/g, '').trim();
}

// Welsh stop words that don't need dictionary entries
const STOP_WORDS = new Set([
  // pronouns
  'i', 'ti', 'chi', 'e', 'fe', 'hi', 'ni', 'nhw', 'fi',
  // particles/connectors
  'yn', "'n", 'y', 'yr', "'r", 'a', 'ac', 'o', 'i', 'ar', 'am', 'at', 'gan',
  'gyda', 'heb', 'er', 'mewn', 'trwy', 'wrth', 'dan', 'dros', 'rhwng',
  // determiners/demonstratives
  'ei', 'eu', 'fy', 'dy', 'ein', 'eich', 'un', 'na', 'nag', 'nad',
  // question words
  'beth', 'pwy', 'ble', 'pryd', 'sut', 'pam', 'faint',
  // common verb forms
  'mae', "mae'r", 'dw', "dw'n", "dw'i", 'wyt', 'yw', 'ydy', 'oes', 'oedd',
  'roedd', "roedd'n", 'bydd', 'byddwn', 'bydda', "bydda'i",
  'does', 'dyw', 'nid', 'dim', 'ddim',
  'wedi', 'bod', 'yn', "i'n",
  // auxiliary/misc
  'sy', "sy'n", 'sydd', 'pe', 'os', 'pan', 'ond', 'neu', 'hefyd', 'iawn',
  'mor', 'rhy', 'go', 'gweddol', 'yna', 'yma', 'nawr', 'heddiw',
  // very common mutations of common words
  "dw'i'n", "dydw", "dydy", "ro'n", "ro'n'i", "ro'n'i'n",
  'mi', 'fe', 'do', 'naddo', 'ie',
  // contractions
  "i'n", "i'r", "i'w", "o'r", "a'r", "a'i", "â'r", "â'i",
  "mae'n", "maen", "dych", "ydych",
  // misc particles
  'fod', 'mod', 'mai', 'taw', 'lle', 'tan', 'hyd', 'ers',
  // more common forms
  'wedi', 'newydd', 'wneud', 'mynd', 'dod', 'cael', 'gwneud',
  'gallu', 'moyn', 'eisiau', 'rhaid', 'angen',
  'fo', 'nhw', 'ni', 'chi', 'ti', 'fi',
  'dyma', 'dyna', 'dacw',
  'yng', 'yng', 'ym',
]);

function lookupWord(raw) {
  const w = clean(raw);
  if (!w || w.length <= 1) return true; // skip single-char
  if (STOP_WORDS.has(w)) return true;
  if (STOP_WORDS.has(raw.toLowerCase())) return true;
  if (dictKeys.has(w)) return true;

  // Handle apostrophe contractions
  if (w.includes("'")) {
    const parts = w.split("'");
    const base = parts[0];
    if (base && dictKeys.has(base)) return true;
    for (const p of parts) {
      if (p && dictKeys.has(p)) return true;
    }
    if (base && lookupMutated(base)) return true;
    // Try the whole thing through mutations
    const noApost = w.replace(/'/g, '');
    if (dictKeys.has(noApost)) return true;
  }

  // Soft mutation
  for (const [mut, originals] of Object.entries(softReverse)) {
    if (w.startsWith(mut)) {
      for (const orig of originals) {
        const cand = orig + w.slice(mut.length);
        if (dictKeys.has(cand)) return true;
      }
    }
  }

  // G-drop
  if (w.length > 1) {
    const cand = 'g' + w;
    if (dictKeys.has(cand)) return true;
  }

  // H-prothesis
  if (w.startsWith('h') && w.length > 2 && 'aeiouwyâêîôûŵŷ'.includes(w[1])) {
    if (dictKeys.has(w.slice(1))) return true;
  }

  // Nasal mutation
  const nasalReverse = [['ngh', 'c'], ['mh', 'p'], ['nh', 't'], ['ng', 'g'], ['m', 'b'], ['n', 'd']];
  for (const [mut, orig] of nasalReverse) {
    if (w.startsWith(mut)) {
      const cand = orig + w.slice(mut.length);
      if (dictKeys.has(cand)) return true;
    }
  }

  // Aspirate mutation
  const aspReverse = [['ch', 'c'], ['ph', 'p'], ['th', 't']];
  for (const [mut, orig] of aspReverse) {
    if (w.startsWith(mut)) {
      const cand = orig + w.slice(mut.length);
      if (dictKeys.has(cand)) return true;
    }
  }

  // Verb suffix stripping
  const verbSuffixes = ['ais', 'aist', 'odd', 'oedd', 'on', 'och', 'wyd', 'wch', 'ir', 'wn', 'ith',
    'iff', 'asom', 'asoch', 'ason', 'ent', 'ant', 'af', 'iff', 'id', 'em', 'ech', 'en'];
  for (const suf of verbSuffixes) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const base = w.slice(0, -suf.length);
      if (dictKeys.has(base)) return true;
      for (const inf of ['u', 'i', 'o', 'io', 'ed', 'yd', 'a', 'eg']) {
        if (dictKeys.has(base + inf)) return true;
      }
      // Try soft mutation reversal on base
      for (const [mut, originals] of Object.entries(softReverse)) {
        if (base.startsWith(mut)) {
          for (const orig of originals) {
            const cand = orig + base.slice(mut.length);
            if (dictKeys.has(cand)) return true;
            for (const inf of ['u', 'i', 'o', 'io', 'ed', 'yd', 'a']) {
              if (dictKeys.has(cand + inf)) return true;
            }
          }
        }
      }
    }
  }

  // Noun suffixes
  const nounSuffixes = ['au', 'iau', 'oedd', 'od', 'ion', 'ydd', 'wr', 'wyr', 'es',
    'iadau', 'iant', 'iaeth', 'ad', 'edd', 'eg', 'ach', 'af', 'iad', 'aeth'];
  for (const suf of nounSuffixes) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const base = w.slice(0, -suf.length);
      if (dictKeys.has(base)) return true;
      // try with common endings
      for (const end of ['', 'n', 'r', 'd', 'dd', 'th', 'g', 'l', 's']) {
        if (dictKeys.has(base + end)) return true;
      }
    }
  }

  // Prepositional pronouns
  const prepBases = {
    'arnaf': 'ar', 'arna': 'ar', 'arnat': 'ar', 'arno': 'ar', 'arni': 'ar', 'arnon': 'ar', 'arnoch': 'ar', 'arnyn': 'ar',
    'amdana': 'am', 'amdanat': 'am', 'amdano': 'am', 'amdani': 'am', 'amdanon': 'am', 'amdanoch': 'am', 'amdanyn': 'am',
    'wrtha': 'wrth', 'wrthat': 'wrth', 'wrtho': 'wrth', 'wrthi': 'wrth', 'wrthon': 'wrth', 'wrthoch': 'wrth', 'wrthyn': 'wrth',
    'ohona': 'o', 'ohoni': 'o', 'ohonon': 'o', 'ohonoch': 'o', 'ohonyn': 'o',
    'iddo': 'i', 'iddi': 'i', 'iddyn': 'i',
    'ynoch': 'yn', 'ynof': 'yn',
    'gennym': 'gan', 'gennych': 'gan', 'ganddyn': 'gan',
    'ata': 'at', 'atat': 'at', 'ato': 'at', 'ati': 'at', 'aton': 'at', 'atoch': 'at', 'atyn': 'at',
    'ohono': 'o', 'gennyf': 'gan', 'gennyt': 'gan', 'ganddo': 'gan', 'ganddi': 'gan',
    'oddi': 'o',
    'ynddo': 'yn', 'ynddi': 'yn', 'ynddyn': 'yn',
    'drosto': 'dros', 'drosti': 'dros', 'droson': 'dros', 'drosoch': 'dros', 'drosyn': 'dros',
    'dano': 'dan', 'dani': 'dan', 'danon': 'dan', 'danoch': 'dan', 'danyn': 'dan',
    'rhyngom': 'rhwng', 'rhyngoch': 'rhwng', 'rhyngddyn': 'rhwng',
    'hebddo': 'heb', 'hebddi': 'heb', 'hebddon': 'heb', 'hebddoch': 'heb', 'hebddyn': 'heb',
    'trwyddo': 'trwy', 'trwyddi': 'trwy', 'trwyddon': 'trwy', 'trwyddoch': 'trwy', 'trwyddyn': 'trwy',
  };
  if (prepBases[w]) return true;

  // Soft mutation + suffix stripping combination
  for (const [mut, originals] of Object.entries(softReverse)) {
    if (w.startsWith(mut)) {
      for (const orig of originals) {
        const cand = orig + w.slice(mut.length);
        for (const suf of [...nounSuffixes, ...verbSuffixes]) {
          if (cand.endsWith(suf) && cand.length > suf.length + 2) {
            const base = cand.slice(0, -suf.length);
            if (dictKeys.has(base)) return true;
            for (const inf of ['u', 'i', 'o']) {
              if (dictKeys.has(base + inf)) return true;
            }
          }
        }
      }
    }
  }

  // G-drop + suffix stripping
  if (w.length > 2 && 'aeiouwyâêîôûŵŷ'.includes(w[0])) {
    const gCand = 'g' + w;
    for (const suf of [...nounSuffixes, ...verbSuffixes]) {
      if (gCand.endsWith(suf) && gCand.length > suf.length + 2) {
        const base = gCand.slice(0, -suf.length);
        if (dictKeys.has(base)) return true;
        for (const inf of ['u', 'i', 'o']) {
          if (dictKeys.has(base + inf)) return true;
        }
      }
    }
    // Also try g-drop without suffix stripping but with the full word
    if (dictKeys.has(gCand)) return true;
  }

  // Comparative/superlative: -ach, -af
  for (const suf of ['ach', 'af']) {
    if (w.endsWith(suf) && w.length > suf.length + 1) {
      const stem = w.slice(0, -suf.length);
      if (dictKeys.has(stem)) return true;
      for (const end of ['', 'n', 's', 'd', 'dd', 'b', 'th', 'g', 'l', 'r']) {
        if (dictKeys.has(stem + end)) return true;
      }
      for (const [mut2, originals2] of Object.entries(softReverse)) {
        if (stem.startsWith(mut2)) {
          for (const orig2 of originals2) {
            const cand = orig2 + stem.slice(mut2.length);
            if (dictKeys.has(cand)) return true;
          }
        }
      }
    }
  }

  return false;
}

function lookupMutated(w) {
  if (dictKeys.has(w)) return true;
  for (const [mut, originals] of Object.entries(softReverse)) {
    if (w.startsWith(mut)) {
      for (const orig of originals) {
        if (dictKeys.has(orig + w.slice(mut.length))) return true;
      }
    }
  }
  if (w.length > 1 && dictKeys.has('g' + w)) return true;
  return false;
}

// ── Tokenize Welsh target sentence ────────────────────────────────────
function tokenize(target) {
  return target
    .replace(/[.,!?;:"""''()—–«»]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

// ── Audio check ───────────────────────────────────────────────────────
const audioFiles = new Set();
const files = fs.readdirSync(AUDIO_DIR);
for (const f of files) {
  if (f.startsWith('cy-') && f.endsWith('.mp3')) {
    audioFiles.add(f);
  }
}
console.log(`Audio files: ${audioFiles.size}`);

// ── English quality checks ────────────────────────────────────────────
function checkEnglishQuality(eng) {
  const issues = [];
  if (!eng || eng.trim().length === 0) {
    issues.push('empty_english');
    return issues;
  }
  // Starts with lowercase
  if (eng[0] && eng[0] === eng[0].toLowerCase() && /[a-z]/.test(eng[0])) {
    issues.push('lowercase_start');
  }
  // No terminal punctuation (allow trailing register annotations like "(formal)")
  const engTrimmed = eng.trim().replace(/\s*\((formal|informal|polite|singular|plural|lit\.?|literally)\)\s*$/i, '');
  if (!/[.!?]$/.test(engTrimmed)) {
    issues.push('no_terminal_punctuation');
  }
  // Double spaces
  if (/  /.test(eng)) issues.push('double_space');
  // Very short
  if (eng.replace(/[^a-zA-Z]/g, '').length < 3) {
    issues.push('too_short');
  }
  // Awkward phrasing
  if (/\bdo\s+be\b/i.test(eng)) issues.push('awkward_phrasing');
  if (/\bdoes\s+be\b/i.test(eng)) issues.push('awkward_phrasing');
  if (/\bis\s+being\s+been\b/i.test(eng)) issues.push('awkward_phrasing');
  // Unbalanced quotes
  const dq = (eng.match(/"/g) || []).length;
  if (dq % 2 !== 0) issues.push('unbalanced_quotes');
  // Unbalanced parens
  const lp = (eng.match(/\(/g) || []).length;
  const rp = (eng.match(/\)/g) || []).length;
  if (lp !== rp) issues.push('unbalanced_parens');
  return issues;
}

// ── Grammar tip quality ───────────────────────────────────────────────
function checkGrammarTip(card) {
  const issues = [];
  const tip = card.grammar || '';
  if (!tip) return issues;

  // Empty quotes in tip
  if (tip.includes('""') || tip.includes("''")) {
    issues.push('empty_quotes_in_tip');
  }
  // Tip is way too long
  if (tip.length > 300) {
    issues.push('tip_too_long');
  }
  // Tip is a duplicate of the english
  if (tip.toLowerCase().trim() === card.english.toLowerCase().trim()) {
    issues.push('tip_is_english');
  }
  // Tip contains just a conjugation table
  if (/^\s*(I|you|he|she|we|they)\s*[:=]\s/i.test(tip) && (tip.match(/[:=]/g) || []).length >= 3) {
    issues.push('conjugation_table_tip');
  }
  return issues;
}

// ── Vocabulary appropriateness ────────────────────────────────────────
function checkVocabAppropriateness(card) {
  const issues = [];
  const eng = card.english.toLowerCase();
  // Check for placeholder text
  if (/\bplaceholder\b|\bTODO\b|\bFIXME\b|\bXXX\b/i.test(eng)) {
    issues.push('placeholder_text');
  }
  return issues;
}

// ── Main audit ────────────────────────────────────────────────────────
function auditCards() {
  const batches = [0, 1, 2, 3];
  const allCards = [];
  for (const b of batches) {
    const batchPath = path.join(ROOT, 'scripts', 'output', 'audit-batches', `cy-batch-${b}.json`);
    const cards = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
    allCards.push(...cards);
  }
  console.log(`Total cards to audit: ${allCards.length}`);

  const issues = [];
  const targetMap = new Map();
  const englishMap = new Map();

  const summary = {
    totalCards: allCards.length,
    cardsWithIssues: 0,
    dictCoverageIssues: 0,
    grammarTipIssues: 0,
    englishQualityIssues: 0,
    duplicateTarget: 0,
    duplicateEnglish: 0,
    vocabIssues: 0,
    audioMissing: 0,
    missingWords: {},
  };

  // Build duplicate maps
  for (const card of allCards) {
    const normTarget = card.target.toLowerCase().trim();
    const normEnglish = card.english.toLowerCase().trim();
    if (!targetMap.has(normTarget)) targetMap.set(normTarget, []);
    targetMap.get(normTarget).push(card.id);
    if (!englishMap.has(normEnglish)) englishMap.set(normEnglish, []);
    englishMap.get(normEnglish).push(card.id);
  }

  // Audit each card
  for (const card of allCards) {
    const cardIssues = [];

    // 1. Dictionary coverage
    const tokens = tokenize(card.target);
    const missingWords = [];
    for (const tok of tokens) {
      if (!lookupWord(tok)) {
        missingWords.push(clean(tok));
      }
    }
    // Deduplicate missing words per card
    const uniqueMissing = [...new Set(missingWords.filter(Boolean))];
    if (uniqueMissing.length > 0) {
      cardIssues.push({
        type: 'missing_dict_words',
        words: uniqueMissing,
        severity: uniqueMissing.length >= 3 ? 'high' : uniqueMissing.length >= 2 ? 'medium' : 'low'
      });
      for (const w of uniqueMissing) {
        summary.missingWords[w] = (summary.missingWords[w] || 0) + 1;
      }
    }

    // 2. Grammar tip alignment
    const tipIssues = checkGrammarTip(card);
    if (tipIssues.length > 0) {
      cardIssues.push({
        type: 'grammar_tip_issue',
        details: tipIssues,
        severity: 'low'
      });
    }

    // 3. English quality
    const engIssues = checkEnglishQuality(card.english);
    if (engIssues.length > 0) {
      cardIssues.push({
        type: 'english_quality',
        details: engIssues,
        severity: engIssues.includes('empty_english') ? 'high' : 'low'
      });
    }

    // 4. Duplicates
    const normTarget = card.target.toLowerCase().trim();
    const normEnglish = card.english.toLowerCase().trim();
    const dupTargets = targetMap.get(normTarget);
    if (dupTargets && dupTargets.length > 1) {
      cardIssues.push({
        type: 'duplicate_target',
        duplicateOf: dupTargets.filter(id => id !== card.id),
        severity: 'high'
      });
    }
    const dupEnglish = englishMap.get(normEnglish);
    if (dupEnglish && dupEnglish.length > 1) {
      const otherIds = dupEnglish.filter(id => id !== card.id);
      const otherCards = allCards.filter(c => otherIds.includes(c.id));
      const hasDifferentTarget = otherCards.some(c => c.target.toLowerCase().trim() !== normTarget);
      if (hasDifferentTarget) {
        cardIssues.push({
          type: 'duplicate_english',
          duplicateOf: otherIds,
          severity: 'medium'
        });
      }
    }

    // 5. Vocabulary appropriateness
    const vocabIssues = checkVocabAppropriateness(card);
    if (vocabIssues.length > 0) {
      cardIssues.push({
        type: 'vocab_issue',
        details: vocabIssues,
        severity: 'medium'
      });
    }

    // 6. Audio exists
    if (!audioFiles.has(card.audio)) {
      cardIssues.push({
        type: 'audio_missing',
        audio: card.audio,
        severity: 'high'
      });
    }

    if (cardIssues.length > 0) {
      issues.push({
        id: card.id,
        target: card.target,
        english: card.english,
        grammarNode: card.grammarNode,
        grammar: card.grammar || '',
        audio: card.audio,
        issues: cardIssues,
      });
      summary.cardsWithIssues++;
      for (const issue of cardIssues) {
        switch (issue.type) {
          case 'missing_dict_words': summary.dictCoverageIssues++; break;
          case 'grammar_tip_issue': summary.grammarTipIssues++; break;
          case 'english_quality': summary.englishQualityIssues++; break;
          case 'duplicate_target': summary.duplicateTarget++; break;
          case 'duplicate_english': summary.duplicateEnglish++; break;
          case 'vocab_issue': summary.vocabIssues++; break;
          case 'audio_missing': summary.audioMissing++; break;
        }
      }
    }
  }

  // Sort missing words by frequency
  const topMissing = Object.entries(summary.missingWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100);

  const result = {
    summary: {
      totalCards: summary.totalCards,
      cardsWithIssues: summary.cardsWithIssues,
      passRate: ((allCards.length - summary.cardsWithIssues) / allCards.length * 100).toFixed(1) + '%',
      dictCoverageIssues: summary.dictCoverageIssues,
      grammarTipIssues: summary.grammarTipIssues,
      englishQualityIssues: summary.englishQualityIssues,
      duplicateTarget: summary.duplicateTarget,
      duplicateEnglish: summary.duplicateEnglish,
      vocabIssues: summary.vocabIssues,
      audioMissing: summary.audioMissing,
      topMissingWords: topMissing,
    },
    issues,
  };

  return result;
}

const result = auditCards();

const outPath = path.join(ROOT, 'scripts', 'output', 'audit-cy-cards-0.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`\nAudit complete. Written to ${outPath}`);
console.log(`Total cards: ${result.summary.totalCards}`);
console.log(`Cards with issues: ${result.summary.cardsWithIssues}`);
console.log(`Pass rate: ${result.summary.passRate}`);
console.log(`\nBreakdown:`);
console.log(`  Dict coverage issues: ${result.summary.dictCoverageIssues}`);
console.log(`  Grammar tip issues: ${result.summary.grammarTipIssues}`);
console.log(`  English quality issues: ${result.summary.englishQualityIssues}`);
console.log(`  Duplicate targets: ${result.summary.duplicateTarget}`);
console.log(`  Duplicate English: ${result.summary.duplicateEnglish}`);
console.log(`  Vocab issues: ${result.summary.vocabIssues}`);
console.log(`  Audio missing: ${result.summary.audioMissing}`);
console.log(`\nTop 20 missing words:`);
for (const [word, count] of result.summary.topMissingWords.slice(0, 20)) {
  console.log(`  ${word}: ${count}`);
}
