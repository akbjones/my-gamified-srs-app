#!/usr/bin/env node
/**
 * audit-all-languages.cjs
 *
 * Comprehensive cross-language quality audit for the SRS app.
 * Checks ALL 11 languages across 12 quality dimensions.
 *
 * Usage: node scripts/audit-all-languages.cjs
 */

const fs = require('fs');
const path = require('path');

// ── Configuration ──────────────────────────────────────────────
const LANGUAGES = [
  { code: 'es', name: 'Spanish', dir: 'spanish' },
  { code: 'it', name: 'Italian', dir: 'italian' },
  { code: 'fr', name: 'French', dir: 'french' },
  { code: 'pt', name: 'Portuguese', dir: 'portuguese' },
  { code: 'de', name: 'German', dir: 'german' },
  { code: 'nl', name: 'Dutch', dir: 'dutch' },
  { code: 'sv', name: 'Swedish', dir: 'swedish' },
  { code: 'cy', name: 'Welsh', dir: 'welsh' },
  { code: 'hi', name: 'Hindi', dir: 'hindi' },
  { code: 'tr', name: 'Turkish', dir: 'turkish' },
  { code: 'ru', name: 'Russian', dir: 'russian' },
];

const TARGETS = {
  totalCards: { min: 3900, max: 3950, label: 'Total cards' },
  uniqueWords: { min: 4000, max: Infinity, label: 'Unique words' },
  avgWordsPerSentence: { min: 6.0, max: 12.0, label: 'Avg words/sentence' },
  duplicates: { min: 0, max: 0, label: 'Duplicate sentences' },
  grammarTipsPct: { min: 25, max: 35, label: 'Grammar tips %' },
  nodeCount: { min: 35, max: 35, label: 'Grammar nodes' },
  cardsPerNode: { min: 100, max: 120, label: 'Cards per node (avg)' },
  travelTagPct: { min: 40, max: 60, label: 'Travel tag %' },
  workTagPct: { min: 40, max: 60, label: 'Work tag %' },
  familyTagPct: { min: 40, max: 60, label: 'Family tag %' },
  generalTagPct: { min: 99, max: 100, label: 'General tag %' },
};

const BASE = path.join(__dirname, '..', 'src', 'data');

// ── Helpers ─────────────────────────────────────────────────────
function cleanWord(word) {
  return word.replace(/[.,!?;:"""''()––\-…¿¡«»\[\]{}]/g, '').trim().toLowerCase();
}

function countDictEntries(code) {
  const dictPath = path.join(BASE, 'dictionary', `${code}.ts`);
  if (!fs.existsSync(dictPath)) return { entries: 0, emptyIpa: 0, missingPos: 0 };
  const content = fs.readFileSync(dictPath, 'utf8');
  const entries = (content.match(/: \{ en:/g) || []).length;
  const emptyIpa = (content.match(/ipa: ''/g) || []).length;
  // Count entries missing pos field (have en: and ipa: but no pos:)
  const withPos = (content.match(/pos: '/g) || []).length;
  return { entries, emptyIpa, missingPos: Math.max(0, entries - withPos) };
}

function checkConjugation(code) {
  // We can't easily import TS modules, so just check file exists and has content
  const conjPath = path.join(BASE, 'conjugation', `${code}.ts`);
  if (!fs.existsSync(conjPath)) return { exists: false, lines: 0 };
  const content = fs.readFileSync(conjPath, 'utf8');
  const lines = content.split('\n').length;
  const hasConjugate = content.includes('export function conjugate') || content.includes('export function conjugateHindi');
  const hasFindInfinitive = content.includes('findInfinitive');
  return { exists: true, lines, hasConjugate, hasFindInfinitive };
}

// ── Main audit ──────────────────────────────────────────────────
function auditLanguage(lang) {
  const results = { name: lang.name, code: lang.code, checks: {}, pass: true };
  const deckPath = path.join(BASE, lang.dir, 'deck.json');

  // Check if deck exists
  if (!fs.existsSync(deckPath)) {
    results.checks.deckExists = { pass: false, value: 'MISSING', target: 'exists' };
    results.pass = false;
    return results;
  }

  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  if (deck.length === 0) {
    results.checks.deckExists = { pass: false, value: 'EMPTY', target: '3900-3950 cards' };
    results.pass = false;
    return results;
  }

  // 1. Total cards
  const total = deck.length;
  results.checks.totalCards = {
    value: total,
    pass: total >= TARGETS.totalCards.min && total <= TARGETS.totalCards.max,
    target: `${TARGETS.totalCards.min}-${TARGETS.totalCards.max}`,
  };

  // 2. Unique words
  const words = new Set();
  let totalWords = 0;
  for (const card of deck) {
    const sentence = card.target || '';
    const ws = sentence.split(/\s+/).filter(Boolean);
    totalWords += ws.length;
    for (const w of ws) {
      const clean = cleanWord(w);
      if (clean) words.add(clean);
    }
  }
  results.checks.uniqueWords = {
    value: words.size,
    pass: words.size >= TARGETS.uniqueWords.min,
    target: `≥${TARGETS.uniqueWords.min}`,
  };

  // 3. Avg words per sentence
  const avg = totalWords / deck.length;
  results.checks.avgWordsPerSentence = {
    value: avg.toFixed(1),
    pass: avg >= TARGETS.avgWordsPerSentence.min && avg <= TARGETS.avgWordsPerSentence.max,
    target: `${TARGETS.avgWordsPerSentence.min}-${TARGETS.avgWordsPerSentence.max}`,
  };

  // 4. Duplicates
  const seen = new Set();
  let dupes = 0;
  for (const card of deck) {
    const s = card.target || '';
    if (seen.has(s)) dupes++;
    seen.add(s);
  }
  results.checks.duplicates = {
    value: dupes,
    pass: dupes === 0,
    target: '0',
  };

  // 5. Grammar tips
  const tipsCount = deck.filter(c => c.grammar && c.grammar.trim().length > 0).length;
  const tipsPct = (tipsCount / deck.length) * 100;
  results.checks.grammarTipsPct = {
    value: `${tipsPct.toFixed(1)}% (${tipsCount}/${deck.length})`,
    pass: tipsPct >= TARGETS.grammarTipsPct.min && tipsPct <= TARGETS.grammarTipsPct.max,
    target: `${TARGETS.grammarTipsPct.min}-${TARGETS.grammarTipsPct.max}%`,
  };

  // 6. Node count and distribution
  const nodeCounts = {};
  for (const card of deck) {
    const node = card.grammarNode || 'unknown';
    nodeCounts[node] = (nodeCounts[node] || 0) + 1;
  }
  const nodeKeys = Object.keys(nodeCounts).filter(k => k !== 'unknown');
  const avgPerNode = deck.length / nodeKeys.length;
  results.checks.nodeCount = {
    value: nodeKeys.length,
    pass: nodeKeys.length >= TARGETS.nodeCount.min && nodeKeys.length <= TARGETS.nodeCount.max,
    target: `${TARGETS.nodeCount.min}`,
  };

  const minNode = Math.min(...Object.values(nodeCounts));
  const maxNode = Math.max(...Object.values(nodeCounts));
  results.checks.nodeDistribution = {
    value: `min=${minNode}, max=${maxNode}, avg=${avgPerNode.toFixed(0)}`,
    pass: minNode >= 45 && maxNode <= 210,
    target: 'min≥45, max≤210',
  };

  // 7. Tag distribution
  const tagCounts = { general: 0, travel: 0, work: 0, family: 0 };
  for (const card of deck) {
    for (const tag of (card.tags || [])) {
      if (tag in tagCounts) tagCounts[tag]++;
    }
  }
  for (const [tag, count] of Object.entries(tagCounts)) {
    const pct = (count / deck.length) * 100;
    const targetKey = `${tag}TagPct`;
    if (TARGETS[targetKey]) {
      results.checks[targetKey] = {
        value: `${pct.toFixed(1)}% (${count})`,
        pass: pct >= TARGETS[targetKey].min && pct <= TARGETS[targetKey].max,
        target: `${TARGETS[targetKey].min}-${TARGETS[targetKey].max}%`,
      };
    }
  }

  // 8. Dictionary coverage
  const dict = countDictEntries(lang.code);
  results.checks.dictionaryEntries = {
    value: dict.entries,
    pass: dict.entries >= 400,
    target: '≥400',
  };
  results.checks.emptyIpa = {
    value: dict.emptyIpa,
    pass: dict.emptyIpa === 0,
    target: '0',
  };

  // 9. Conjugation engine
  const conj = checkConjugation(lang.code);
  results.checks.conjugationEngine = {
    value: conj.exists ? `${conj.lines} lines, conjugate=${conj.hasConjugate}, findInf=${conj.hasFindInfinitive}` : 'MISSING',
    pass: conj.exists && conj.hasConjugate,
    target: 'exists + conjugate()',
  };

  // 10. Card format validation
  let formatErrors = 0;
  for (const card of deck) {
    if (!card.id || !card.target || !card.english || !card.grammarNode || !card.tags) {
      formatErrors++;
    }
  }
  results.checks.cardFormat = {
    value: `${formatErrors} errors`,
    pass: formatErrors === 0,
    target: '0 errors',
  };

  // 11. Short sentences (≤3 words)
  const shortCount = deck.filter(c => (c.target || '').split(/\s+/).length <= 3).length;
  const shortPct = (shortCount / deck.length) * 100;
  results.checks.shortSentences = {
    value: `${shortCount} (${shortPct.toFixed(1)}%)`,
    pass: shortPct < 5,
    target: '<5%',
  };

  // 12. Grammar tip quality (check for boring conjugation patterns)
  const boringPatterns = [
    /verbs? (end|become|change|conjugat)/i,
    /^(for|in) \w+ (verbs?|nouns?|adjectives?), (add|use|change)/i,
    /regular \w+ verbs? follow/i,
  ];
  let boringTips = 0;
  for (const card of deck) {
    if (card.grammar) {
      for (const pattern of boringPatterns) {
        if (pattern.test(card.grammar)) {
          boringTips++;
          break;
        }
      }
    }
  }
  const boringPct = tipsCount > 0 ? (boringTips / tipsCount) * 100 : 0;
  results.checks.boringTips = {
    value: `${boringTips} (${boringPct.toFixed(1)}% of tips)`,
    pass: boringPct < 10,
    target: '<10% of tips',
  };

  // Overall pass
  results.pass = Object.values(results.checks).every(c => c.pass);
  return results;
}

// ── Output ──────────────────────────────────────────────────────
function printResults(allResults) {
  const W = 100;

  console.log('\n' + '═'.repeat(W));
  console.log('  CROSS-LANGUAGE QUALITY AUDIT – ' + new Date().toISOString().slice(0, 10));
  console.log('═'.repeat(W));

  let totalPasses = 0;
  let totalFails = 0;

  for (const r of allResults) {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${'─'.repeat(W)}`);
    console.log(`  ${r.name.toUpperCase()} (${r.code}) – ${status}`);
    console.log(`${'─'.repeat(W)}`);

    for (const [key, check] of Object.entries(r.checks)) {
      const icon = check.pass ? '  ✓' : '  ✗';
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
      const padLabel = label.padEnd(30);
      const padValue = String(check.value).padEnd(35);
      console.log(`${icon}  ${padLabel} ${padValue} [target: ${check.target}]`);
    }

    const passes = Object.values(r.checks).filter(c => c.pass).length;
    const fails = Object.values(r.checks).filter(c => !c.pass).length;
    totalPasses += passes;
    totalFails += fails;
    console.log(`  → ${passes} pass, ${fails} fail`);
  }

  console.log(`\n${'═'.repeat(W)}`);
  console.log(`  SUMMARY: ${totalPasses} checks passed, ${totalFails} checks failed`);

  const passingLangs = allResults.filter(r => r.pass);
  const failingLangs = allResults.filter(r => !r.pass);

  if (passingLangs.length > 0) {
    console.log(`  ✅ Passing: ${passingLangs.map(r => r.name).join(', ')}`);
  }
  if (failingLangs.length > 0) {
    console.log(`  ❌ Failing: ${failingLangs.map(r => r.name).join(', ')}`);
  }
  console.log('═'.repeat(W) + '\n');

  // Comparison table
  console.log('  COMPARISON TABLE');
  console.log('─'.repeat(W));
  const header = '  Language     │ Cards │ Uniq W │ W/S  │ Dupes │ Tips% │ Nodes │ Dict  │ IPA=0 │ Pass';
  console.log(header);
  console.log('─'.repeat(W));

  for (const r of allResults) {
    const c = r.checks;
    const cards = (c.totalCards?.value ?? '?').toString().padStart(5);
    const uniq = (c.uniqueWords?.value ?? '?').toString().padStart(6);
    const wps = (c.avgWordsPerSentence?.value ?? '?').toString().padStart(4);
    const dupes = (c.duplicates?.value ?? '?').toString().padStart(5);
    const tips = (c.grammarTipsPct?.value ?? '?').toString().split(' ')[0].padStart(5);
    const nodes = (c.nodeCount?.value ?? '?').toString().padStart(5);
    const dict = (c.dictionaryEntries?.value ?? '?').toString().padStart(5);
    const ipa = (c.emptyIpa?.value ?? '?').toString().padStart(5);
    const pass = r.pass ? '  ✅' : '  ❌';

    console.log(`  ${r.name.padEnd(12)} │${cards} │${uniq} │${wps} │${dupes} │${tips} │${nodes} │${dict} │${ipa} │${pass}`);
  }
  console.log('─'.repeat(W));

  return failingLangs.length === 0;
}

// ── Run ─────────────────────────────────────────────────────────
const results = LANGUAGES.map(auditLanguage);
const allPass = printResults(results);
process.exit(allPass ? 0 : 1);
