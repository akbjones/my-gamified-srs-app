#!/usr/bin/env node
/**
 * Statistical Anomaly Detection across all 11 language decks.
 * Finds problems we don't know to look for.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
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

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'of',
  'for', 'and', 'or', 'but', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'with',
  'from', 'not', 'do', 'does', 'did', 'have', 'has', 'had', 'be', 'been',
  'will', 'would', 'can', 'could', 'should', 'very', 'also', 'just', 'so',
  'if', 'then', 'when', 'how', 'what', 'who', 'where', 'which',
]);

function loadDeck(lang) {
  const deckPath = path.join(ROOT, 'src/data', lang.dir, 'deck.json');
  return JSON.parse(fs.readFileSync(deckPath, 'utf8'));
}

function getEnglishWords(english) {
  return english.toLowerCase().replace(/[^a-z' -]/g, '').split(/\s+/).filter(w => w.length > 0);
}

function getContentWords(english) {
  return getEnglishWords(english).filter(w => !STOP_WORDS.has(w) && w.length > 1);
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ===== ANALYSIS 1: Sentence Length Distribution Per Node =====
function analyzeSentenceLength(deck, lang) {
  const nodeCards = {};
  for (const card of deck) {
    const node = card.grammarNode || 'unknown';
    if (!nodeCards[node]) nodeCards[node] = [];
    nodeCards[node].push(card);
  }

  const flagged = [];
  const nodeStats = {};

  for (const [node, cards] of Object.entries(nodeCards)) {
    const wordCounts = cards.map(c => getEnglishWords(c.english).length);
    const med = median(wordCounts);
    const sd = stddev(wordCounts);
    nodeStats[node] = { median: med, stddev: parseFloat(sd.toFixed(2)), count: cards.length };

    if (sd > 0) {
      for (let i = 0; i < cards.length; i++) {
        const wc = wordCounts[i];
        const zScore = Math.abs(wc - med) / sd;
        if (zScore > 2) {
          flagged.push({
            id: cards[i].id,
            node,
            wordCount: wc,
            nodeMedian: med,
            nodeStddev: parseFloat(sd.toFixed(2)),
            zScore: parseFloat(zScore.toFixed(2)),
            english: cards[i].english,
          });
        }
      }
    }
  }

  return { nodeStats, flagged: flagged.sort((a, b) => b.zScore - a.zScore) };
}

// ===== ANALYSIS 2: Word Frequency Outliers =====
function analyzeWordFrequency(deck, lang) {
  // Count how many cards each content word appears in
  const wordCardCount = {};
  for (const card of deck) {
    const words = new Set(getContentWords(card.english));
    for (const w of words) {
      wordCardCount[w] = (wordCardCount[w] || 0) + 1;
    }
  }

  // Find rare words (appear in only 1 card)
  const rareWords = new Set(Object.keys(wordCardCount).filter(w => wordCardCount[w] === 1));

  // Count rare words per node
  const nodeRareRatio = {};
  const nodeCards = {};
  for (const card of deck) {
    const node = card.grammarNode || 'unknown';
    if (!nodeCards[node]) nodeCards[node] = [];
    nodeCards[node].push(card);
  }

  const flaggedNodes = [];
  for (const [node, cards] of Object.entries(nodeCards)) {
    let totalContentWords = 0;
    let rareContentWords = 0;
    for (const card of cards) {
      const words = getContentWords(card.english);
      totalContentWords += words.length;
      rareContentWords += words.filter(w => rareWords.has(w)).length;
    }
    const ratio = totalContentWords > 0 ? rareContentWords / totalContentWords : 0;
    nodeRareRatio[node] = { totalContentWords, rareContentWords, ratio: parseFloat(ratio.toFixed(3)) };
    if (ratio > 0.5) {
      flaggedNodes.push({ node, ratio: parseFloat(ratio.toFixed(3)), rareContentWords, totalContentWords });
    }
  }

  return {
    totalUniqueWords: Object.keys(wordCardCount).length,
    rareWordCount: rareWords.size,
    rareWordRatio: parseFloat((rareWords.size / Object.keys(wordCardCount).length).toFixed(3)),
    nodeRareRatio,
    flaggedNodes,
  };
}

// ===== ANALYSIS 3: Grammar Tip Repetition =====
function analyzeGrammarTips(deck, lang) {
  const tips = deck.filter(c => c.grammar && c.grammar.trim().length > 0).map(c => c.grammar.trim());
  const totalTips = tips.length;
  if (totalTips === 0) return { totalTips: 0, uniqueTips: 0, diversity: 0, repeatedTips: [], flagged: false };

  const tipCounts = {};
  for (const tip of tips) {
    tipCounts[tip] = (tipCounts[tip] || 0) + 1;
  }

  const uniqueTips = Object.keys(tipCounts).length;
  const diversity = parseFloat((uniqueTips / totalTips).toFixed(3));

  const repeatedTips = Object.entries(tipCounts)
    .filter(([, count]) => count >= 20)
    .sort((a, b) => b[1] - a[1])
    .map(([tip, count]) => ({ tip: tip.substring(0, 100) + (tip.length > 100 ? '...' : ''), count }));

  return {
    totalTips,
    uniqueTips,
    diversity,
    repeatedTips,
    flagged: diversity < 0.3,
  };
}

// ===== ANALYSIS 4: Node Transition Smoothness =====
function analyzeNodeTransitions(deck, lang) {
  const nodeCards = {};
  for (const card of deck) {
    const node = card.grammarNode || 'unknown';
    if (!nodeCards[node]) nodeCards[node] = [];
    nodeCards[node].push(card);
  }

  const nodes = Object.keys(nodeCards).filter(n => n.startsWith('node-')).sort();
  const nodeComplexity = {};

  for (const node of nodes) {
    const cards = nodeCards[node];
    const wordCounts = cards.map(c => getEnglishWords(c.english).length);
    const avgWordCount = mean(wordCounts);

    // Unique word ratio: unique content words / total content words
    let totalContent = 0;
    const allContentWords = new Set();
    for (const card of cards) {
      const words = getContentWords(card.english);
      totalContent += words.length;
      words.forEach(w => allContentWords.add(w));
    }
    const uniqueRatio = totalContent > 0 ? allContentWords.size / totalContent : 0;
    const complexity = avgWordCount + uniqueRatio * 10; // weighted

    nodeComplexity[node] = {
      avgWordCount: parseFloat(avgWordCount.toFixed(2)),
      uniqueWordRatio: parseFloat(uniqueRatio.toFixed(3)),
      complexity: parseFloat(complexity.toFixed(2)),
    };
  }

  const regressions = [];
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodeComplexity[nodes[i - 1]];
    const curr = nodeComplexity[nodes[i]];
    if (curr.complexity < prev.complexity) {
      regressions.push({
        from: nodes[i - 1],
        to: nodes[i],
        fromComplexity: prev.complexity,
        toComplexity: curr.complexity,
        drop: parseFloat((prev.complexity - curr.complexity).toFixed(2)),
      });
    }
  }

  return { nodeComplexity, regressions };
}

// ===== ANALYSIS 5: Tag Coverage Balance =====
function analyzeTagCoverage(deck, lang) {
  const tagCounts = {};
  for (const card of deck) {
    for (const tag of (card.tags || [])) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const total = deck.length;
  const tagPcts = {};
  for (const [tag, count] of Object.entries(tagCounts)) {
    tagPcts[tag] = { count, pct: parseFloat((count / total * 100).toFixed(1)) };
  }

  const flagged = [];
  const supplementaryTags = ['travel', 'work', 'family'];
  for (const tag of supplementaryTags) {
    const pct = tagPcts[tag]?.pct || 0;
    if (pct < 10) flagged.push({ tag, pct, issue: 'too low (<10%)' });
    if (pct > 70) flagged.push({ tag, pct, issue: 'too high (>70%)' });
  }

  return { tagPcts, flagged };
}

// ===== ANALYSIS 6: English Translation Quality Signals =====
function analyzeEnglishQuality(deck, lang) {
  const issues = {
    didYouUsedTo: [],
    unclosedQuotesOrParens: [],
    noCapitalStart: [],
    noPunctEnd: [],
    doubleSpaces: [],
    tooShort: [],
    tooLong: [],
  };

  for (const card of deck) {
    const eng = card.english;
    if (!eng) continue;

    // "Did you used to" pattern
    if (/did\s+\w+\s+used\s+to/i.test(eng)) {
      issues.didYouUsedTo.push({ id: card.id, english: eng });
    }

    // Unclosed quotes or parentheses
    const dqCount = (eng.match(/"/g) || []).length;
    const sqCount = (eng.match(/'/g) || []).length;
    // Only flag double quotes (single quotes are ambiguous with apostrophes)
    if (dqCount % 2 !== 0) {
      issues.unclosedQuotesOrParens.push({ id: card.id, english: eng, type: 'quote' });
    }
    const openP = (eng.match(/\(/g) || []).length;
    const closeP = (eng.match(/\)/g) || []).length;
    if (openP !== closeP) {
      issues.unclosedQuotesOrParens.push({ id: card.id, english: eng, type: 'paren' });
    }

    // No capital start
    if (/^[a-z]/.test(eng)) {
      issues.noCapitalStart.push({ id: card.id, english: eng });
    }

    // No punctuation end
    if (!/[.!?…"]$/.test(eng.trim())) {
      issues.noPunctEnd.push({ id: card.id, english: eng });
    }

    // Double spaces
    if (/  /.test(eng)) {
      issues.doubleSpaces.push({ id: card.id, english: eng });
    }

    // Too short
    const wc = getEnglishWords(eng).length;
    if (wc < 3) {
      issues.tooShort.push({ id: card.id, english: eng, wordCount: wc });
    }

    // Too long
    if (wc > 25) {
      issues.tooLong.push({ id: card.id, english: eng, wordCount: wc });
    }
  }

  const totalIssues = Object.values(issues).reduce((s, arr) => s + arr.length, 0);
  return { issues, totalIssues };
}

// ===== MAIN =====
function main() {
  const results = {};
  const summary = {};

  console.log('=== Statistical Anomaly Detection Across All 11 Languages ===\n');

  for (const lang of LANGUAGES) {
    console.log(`Processing ${lang.name}...`);
    const deck = loadDeck(lang);

    const sentenceLength = analyzeSentenceLength(deck, lang);
    const wordFrequency = analyzeWordFrequency(deck, lang);
    const grammarTips = analyzeGrammarTips(deck, lang);
    const nodeTransitions = analyzeNodeTransitions(deck, lang);
    const tagCoverage = analyzeTagCoverage(deck, lang);
    const englishQuality = analyzeEnglishQuality(deck, lang);

    results[lang.code] = {
      language: lang.name,
      cardCount: deck.length,
      sentenceLength,
      wordFrequency,
      grammarTips,
      nodeTransitions,
      tagCoverage,
      englishQuality,
    };

    summary[lang.code] = {
      language: lang.name,
      cards: deck.length,
      sentenceLengthOutliers: sentenceLength.flagged.length,
      rareWordFlaggedNodes: wordFrequency.flaggedNodes.length,
      grammarTipDiversity: grammarTips.diversity,
      grammarTipsFlagged: grammarTips.flagged,
      repeatedTipsCount: grammarTips.repeatedTips.length,
      nodeRegressions: nodeTransitions.regressions.length,
      tagCoverageFlags: tagCoverage.flagged.length,
      englishQualityIssues: englishQuality.totalIssues,
    };
  }

  // ===== Print Summary =====
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY OF ANOMALIES');
  console.log('='.repeat(80));

  // Category totals
  const catTotals = {
    sentenceLengthOutliers: 0,
    rareWordFlaggedNodes: 0,
    grammarTipDiversityFlags: 0,
    repeatedTips: 0,
    nodeRegressions: 0,
    tagCoverageFlags: 0,
    englishQualityIssues: 0,
  };

  for (const s of Object.values(summary)) {
    catTotals.sentenceLengthOutliers += s.sentenceLengthOutliers;
    catTotals.rareWordFlaggedNodes += s.rareWordFlaggedNodes;
    catTotals.grammarTipDiversityFlags += s.grammarTipsFlagged ? 1 : 0;
    catTotals.repeatedTips += s.repeatedTipsCount;
    catTotals.nodeRegressions += s.nodeRegressions;
    catTotals.tagCoverageFlags += s.tagCoverageFlags;
    catTotals.englishQualityIssues += s.englishQualityIssues;
  }

  console.log('\n--- Total Anomalies Per Category ---');
  console.log(`  1. Sentence length outliers (>2σ):     ${catTotals.sentenceLengthOutliers}`);
  console.log(`  2. Nodes with >50% rare words:         ${catTotals.rareWordFlaggedNodes}`);
  console.log(`  3. Languages with tip diversity <0.3:   ${catTotals.grammarTipDiversityFlags}`);
  console.log(`  4. Tips repeated 20+ times (types):     ${catTotals.repeatedTips}`);
  console.log(`  5. Node complexity regressions:         ${catTotals.nodeRegressions}`);
  console.log(`  6. Tag coverage imbalances:             ${catTotals.tagCoverageFlags}`);
  console.log(`  7. English quality issues:              ${catTotals.englishQualityIssues}`);

  // Per-language breakdown
  console.log('\n--- Per-Language Breakdown ---');
  console.log(
    'Lang'.padEnd(12) +
    'Cards'.padStart(6) +
    'LenOut'.padStart(8) +
    'RareN'.padStart(7) +
    'TipDiv'.padStart(8) +
    'RepTip'.padStart(8) +
    'Regr'.padStart(6) +
    'TagF'.padStart(6) +
    'EngQ'.padStart(7)
  );
  console.log('-'.repeat(68));
  for (const [code, s] of Object.entries(summary)) {
    console.log(
      s.language.padEnd(12) +
      String(s.cards).padStart(6) +
      String(s.sentenceLengthOutliers).padStart(8) +
      String(s.rareWordFlaggedNodes).padStart(7) +
      s.grammarTipDiversity.toFixed(3).padStart(8) +
      String(s.repeatedTipsCount).padStart(8) +
      String(s.nodeRegressions).padStart(6) +
      String(s.tagCoverageFlags).padStart(6) +
      String(s.englishQualityIssues).padStart(7)
    );
  }

  // Worst offenders
  console.log('\n--- Worst Offenders ---');

  // Sentence length: top 5 most extreme z-scores across all languages
  console.log('\n  [1] Sentence Length - Top 10 Most Extreme Z-Scores:');
  const allLenFlagged = [];
  for (const [code, r] of Object.entries(results)) {
    for (const f of r.sentenceLength.flagged) {
      allLenFlagged.push({ lang: code, ...f });
    }
  }
  allLenFlagged.sort((a, b) => b.zScore - a.zScore);
  for (const f of allLenFlagged.slice(0, 10)) {
    console.log(`    ${f.lang} ${f.id} (${f.node}): ${f.wordCount} words (median=${f.nodeMedian}, z=${f.zScore}) "${f.english.substring(0, 60)}..."`);
  }

  // Grammar tip repetition: worst offenders
  console.log('\n  [3] Grammar Tips - Most Repeated Tips Across All Languages:');
  const allRepeated = [];
  for (const [code, r] of Object.entries(results)) {
    for (const t of r.grammarTips.repeatedTips) {
      allRepeated.push({ lang: code, ...t });
    }
  }
  allRepeated.sort((a, b) => b.count - a.count);
  for (const t of allRepeated.slice(0, 10)) {
    console.log(`    ${t.lang}: ${t.count}x "${t.tip}"`);
  }

  // Grammar tip diversity
  console.log('\n  [3b] Grammar Tip Diversity (unique/total):');
  for (const [code, r] of Object.entries(results)) {
    const g = r.grammarTips;
    const flag = g.flagged ? ' *** FLAGGED ***' : '';
    console.log(`    ${r.language}: ${g.uniqueTips}/${g.totalTips} = ${g.diversity}${flag}`);
  }

  // Node regressions
  console.log('\n  [4] Node Complexity Regressions (biggest drops):');
  const allRegr = [];
  for (const [code, r] of Object.entries(results)) {
    for (const reg of r.nodeTransitions.regressions) {
      allRegr.push({ lang: code, ...reg });
    }
  }
  allRegr.sort((a, b) => b.drop - a.drop);
  for (const r of allRegr.slice(0, 15)) {
    console.log(`    ${r.lang}: ${r.from} → ${r.to}: complexity dropped ${r.fromComplexity} → ${r.toComplexity} (Δ${r.drop})`);
  }

  // Tag coverage flags
  console.log('\n  [5] Tag Coverage Flags:');
  for (const [code, r] of Object.entries(results)) {
    for (const f of r.tagCoverage.flagged) {
      console.log(`    ${r.language}: ${f.tag} = ${f.pct}% – ${f.issue}`);
    }
  }
  if (Object.values(results).every(r => r.tagCoverage.flagged.length === 0)) {
    console.log('    (none)');
  }

  // English quality: per-category breakdown
  console.log('\n  [6] English Quality Issues Per Language:');
  for (const [code, r] of Object.entries(results)) {
    const iss = r.englishQuality.issues;
    const counts = [];
    if (iss.didYouUsedTo.length) counts.push(`didUsedTo=${iss.didYouUsedTo.length}`);
    if (iss.unclosedQuotesOrParens.length) counts.push(`unclosed=${iss.unclosedQuotesOrParens.length}`);
    if (iss.noCapitalStart.length) counts.push(`noCap=${iss.noCapitalStart.length}`);
    if (iss.noPunctEnd.length) counts.push(`noPunct=${iss.noPunctEnd.length}`);
    if (iss.doubleSpaces.length) counts.push(`dblSpace=${iss.doubleSpaces.length}`);
    if (iss.tooShort.length) counts.push(`short=${iss.tooShort.length}`);
    if (iss.tooLong.length) counts.push(`long=${iss.tooLong.length}`);
    if (counts.length) {
      console.log(`    ${r.language}: ${counts.join(', ')}`);
    }
  }

  // Tag coverage details for all languages
  console.log('\n  [5b] Full Tag Coverage:');
  for (const [code, r] of Object.entries(results)) {
    const tags = r.tagCoverage.tagPcts;
    const parts = Object.entries(tags).map(([t, v]) => `${t}=${v.pct}%`).join(', ');
    console.log(`    ${r.language}: ${parts}`);
  }

  // Write results
  const outputDir = path.join(ROOT, 'scripts/output');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'statistical-anomalies.json');
  fs.writeFileSync(outputPath, JSON.stringify({ summary, results }, null, 2));
  console.log(`\nFull results written to: ${outputPath}`);
}

main();
