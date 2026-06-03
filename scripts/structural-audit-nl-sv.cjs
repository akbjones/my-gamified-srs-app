#!/usr/bin/env node
/**
 * Comprehensive structural audit for Dutch and Swedish decks.
 * Checks: priority balance, level appropriateness, tag accuracy,
 * essential vocab coverage, node transition logic.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const DECKS = {
  nl: { file: path.join(BASE, 'src/data/dutch/deck.json'), label: 'Dutch' },
  sv: { file: path.join(BASE, 'src/data/swedish/deck.json'), label: 'Swedish' },
};

// Essential vocabulary categories with terms in English that should appear somewhere in the deck
const ESSENTIAL_VOCAB = {
  numbers: {
    terms: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'zero', 'twenty', 'thirty'],
    minExpected: 8,
  },
  colors: {
    terms: ['red', 'blue', 'green', 'yellow', 'white', 'black', 'brown', 'orange', 'pink', 'purple', 'grey', 'gray'],
    minExpected: 6,
  },
  directions: {
    terms: ['left', 'right', 'north', 'south', 'east', 'west', 'straight', 'up', 'down', 'forward', 'behind', 'next to', 'near', 'far'],
    minExpected: 5,
  },
  bodyParts: {
    terms: ['head', 'hand', 'arm', 'leg', 'foot', 'eye', 'ear', 'nose', 'mouth', 'heart', 'back', 'finger', 'hair', 'face', 'tooth', 'teeth'],
    minExpected: 6,
  },
  animals: {
    terms: ['dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'chicken', 'pig', 'sheep', 'rabbit', 'mouse', 'bear', 'snake', 'duck', 'lion'],
    minExpected: 5,
  },
  family: {
    terms: ['mother', 'father', 'sister', 'brother', 'son', 'daughter', 'grandmother', 'grandfather', 'aunt', 'uncle', 'parents', 'children', 'wife', 'husband', 'family'],
    minExpected: 8,
  },
  days: {
    terms: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'today', 'tomorrow', 'yesterday', 'week', 'month', 'year'],
    minExpected: 7,
  },
  food: {
    terms: ['bread', 'water', 'milk', 'coffee', 'tea', 'rice', 'meat', 'fruit', 'cheese', 'egg', 'sugar', 'salt', 'butter', 'fish', 'wine', 'beer', 'cake', 'soup'],
    minExpected: 8,
  },
  basicPhrases: {
    terms: ['hello', 'goodbye', 'please', 'thank you', 'thanks', 'sorry', 'excuse me', 'yes', 'no', 'good morning', 'good night', 'how are you', 'my name is', 'nice to meet', 'welcome'],
    minExpected: 8,
  },
};

// Target language essential vocab for direct target-text matching
const TARGET_VOCAB = {
  nl: {
    numbers: ['een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'honderd', 'duizend', 'nul', 'twintig', 'dertig'],
    colors: ['rood', 'blauw', 'groen', 'geel', 'wit', 'zwart', 'bruin', 'oranje', 'roze', 'paars', 'grijs'],
    days: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag', 'vandaag', 'morgen', 'gisteren', 'week', 'maand', 'jaar'],
    family: ['moeder', 'vader', 'zus', 'broer', 'zoon', 'dochter', 'oma', 'opa', 'tante', 'oom', 'ouders', 'kinderen', 'vrouw', 'man', 'familie', 'gezin'],
    food: ['brood', 'water', 'melk', 'koffie', 'thee', 'rijst', 'vlees', 'fruit', 'kaas', 'ei', 'suiker', 'zout', 'boter', 'vis', 'wijn', 'bier', 'taart', 'soep'],
    bodyParts: ['hoofd', 'hand', 'arm', 'been', 'voet', 'oog', 'oor', 'neus', 'mond', 'hart', 'rug', 'vinger', 'haar', 'gezicht', 'tand'],
    animals: ['hond', 'kat', 'vogel', 'vis', 'paard', 'koe', 'kip', 'varken', 'schaap', 'konijn', 'muis', 'beer', 'slang', 'eend', 'leeuw'],
  },
  sv: {
    numbers: ['en', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'hundra', 'tusen', 'noll', 'tjugo', 'trettio'],
    colors: ['röd', 'blå', 'grön', 'gul', 'vit', 'svart', 'brun', 'orange', 'rosa', 'lila', 'grå'],
    days: ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag', 'idag', 'imorgon', 'igår', 'vecka', 'månad', 'år'],
    family: ['mamma', 'pappa', 'syster', 'bror', 'son', 'dotter', 'mormor', 'farmor', 'morfar', 'farfar', 'tant', 'farbror', 'föräldrar', 'barn', 'fru', 'man', 'familj'],
    food: ['bröd', 'vatten', 'mjölk', 'kaffe', 'te', 'ris', 'kött', 'frukt', 'ost', 'ägg', 'socker', 'salt', 'smör', 'fisk', 'vin', 'öl', 'tårta', 'soppa'],
    bodyParts: ['huvud', 'hand', 'arm', 'ben', 'fot', 'öga', 'öra', 'näsa', 'mun', 'hjärta', 'rygg', 'finger', 'hår', 'ansikte', 'tand'],
    animals: ['hund', 'katt', 'fågel', 'fisk', 'häst', 'ko', 'kyckling', 'gris', 'får', 'kanin', 'mus', 'björn', 'orm', 'anka', 'lejon'],
  },
};

// Node difficulty expectations: node number -> expected difficulty level
function getExpectedLevel(nodeNum) {
  if (nodeNum <= 5) return 'beginner';
  if (nodeNum <= 15) return 'intermediate';
  if (nodeNum <= 25) return 'upper-intermediate';
  return 'advanced';
}

function getNodeNumber(nodeStr) {
  return parseInt(nodeStr.replace('node-', ''), 10);
}

// Estimate sentence complexity
function estimateComplexity(english) {
  const words = english.split(/\s+/).length;
  const hasSubordinateClause = /\b(because|although|if|when|while|since|unless|that|which|who|whom|whose|where|after|before)\b/i.test(english);
  const hasComplexTense = /\b(would have|could have|should have|had been|will have been|would be|might have)\b/i.test(english);
  const hasPassive = /\b(was|were|been|being)\s+(made|done|given|taken|seen|known|found|said|told|called)\b/i.test(english);

  let score = 0;
  score += Math.min(words / 3, 5); // word count contribution (max 5)
  if (hasSubordinateClause) score += 2;
  if (hasComplexTense) score += 3;
  if (hasPassive) score += 1;

  if (score <= 3) return 'beginner';
  if (score <= 5) return 'intermediate';
  if (score <= 7) return 'upper-intermediate';
  return 'advanced';
}

function auditDeck(langCode) {
  const config = DECKS[langCode];
  const deck = JSON.parse(fs.readFileSync(config.file, 'utf8'));

  const report = {
    language: config.label,
    code: langCode,
    totalCards: deck.length,
    timestamp: new Date().toISOString(),
    sections: {},
  };

  // ============================================================
  // 1. PRIORITY BALANCE PER NODE
  // ============================================================
  const nodeMap = {};
  for (const card of deck) {
    const node = card.grammarNode;
    if (!nodeMap[node]) nodeMap[node] = { total: 0, priorities: {}, cards: [] };
    nodeMap[node].total++;
    const p = card.priority || 0;
    nodeMap[node].priorities[p] = (nodeMap[node].priorities[p] || 0) + 1;
    nodeMap[node].cards.push(card);
  }

  const priorityBalance = {};
  const priorityIssues = [];
  const sortedNodes = Object.keys(nodeMap).sort((a, b) => getNodeNumber(a) - getNodeNumber(b));

  for (const node of sortedNodes) {
    const data = nodeMap[node];
    const pDist = data.priorities;
    const p1 = pDist[1] || 0;
    const p2 = pDist[2] || 0;
    const p3 = pDist[3] || 0;
    const p1pct = ((p1 / data.total) * 100).toFixed(1);
    const p2pct = ((p2 / data.total) * 100).toFixed(1);
    const p3pct = ((p3 / data.total) * 100).toFixed(1);

    priorityBalance[node] = {
      total: data.total,
      p1: { count: p1, pct: parseFloat(p1pct) },
      p2: { count: p2, pct: parseFloat(p2pct) },
      p3: { count: p3, pct: parseFloat(p3pct) },
    };

    // Flag issues
    if (p1 < 5) priorityIssues.push({ node, issue: `Too few priority-1 cards: ${p1}` });
    if (p1 > data.total * 0.7) priorityIssues.push({ node, issue: `Priority-1 overloaded: ${p1pct}%` });
    if (p3 === 0 && data.total > 50) priorityIssues.push({ node, issue: `No priority-3 cards in large node (${data.total})` });
    if (p2 === 0 && data.total > 30) priorityIssues.push({ node, issue: `No priority-2 cards` });
    // Check for unknown priorities
    for (const pk of Object.keys(pDist)) {
      if (![1, 2, 3].includes(parseInt(pk))) {
        priorityIssues.push({ node, issue: `Unknown priority value: ${pk} (${pDist[pk]} cards)` });
      }
    }
  }

  report.sections.priorityBalance = {
    perNode: priorityBalance,
    issues: priorityIssues,
    summary: {
      totalNodes: sortedNodes.length,
      issueCount: priorityIssues.length,
    },
  };

  // ============================================================
  // 2. LEVEL APPROPRIATENESS
  // ============================================================
  const levelIssues = [];
  const levelBreakdown = {};

  for (const node of sortedNodes) {
    const nodeNum = getNodeNumber(node);
    const expectedLevel = getExpectedLevel(nodeNum);
    const cards = nodeMap[node].cards;
    const complexityCounts = { beginner: 0, intermediate: 0, 'upper-intermediate': 0, advanced: 0 };

    for (const card of cards) {
      const complexity = estimateComplexity(card.english);
      complexityCounts[complexity]++;
    }

    // Check if node has >= 15 cards that are at the 500+ level threshold
    const highComplexity = complexityCounts['upper-intermediate'] + complexityCounts['advanced'];
    const lowComplexity = complexityCounts['beginner'];

    levelBreakdown[node] = {
      expected: expectedLevel,
      distribution: complexityCounts,
      totalCards: cards.length,
    };

    // Flag mismatches
    if (expectedLevel === 'beginner' && highComplexity > cards.length * 0.4) {
      levelIssues.push({ node, issue: `Beginner node has ${highComplexity} high-complexity cards (${((highComplexity / cards.length) * 100).toFixed(0)}%)` });
    }
    if (expectedLevel === 'advanced' && lowComplexity > cards.length * 0.5) {
      levelIssues.push({ node, issue: `Advanced node has ${lowComplexity} beginner-level cards (${((lowComplexity / cards.length) * 100).toFixed(0)}%)` });
    }
    // 15+ cards at high level in beginner nodes
    if (nodeNum <= 5 && highComplexity >= 15) {
      levelIssues.push({ node, issue: `Beginner node has 15+ upper/advanced cards: ${highComplexity}` });
    }
  }

  report.sections.levelAppropriateness = {
    perNode: levelBreakdown,
    issues: levelIssues,
    summary: {
      issueCount: levelIssues.length,
    },
  };

  // ============================================================
  // 3. TAG ACCURACY
  // ============================================================
  const tagCounts = {};
  const tagIssues = [];
  const expectedTags = ['general', 'travel', 'work', 'family'];

  for (const card of deck) {
    if (!card.tags || !Array.isArray(card.tags)) {
      tagIssues.push({ id: card.id, issue: 'Missing or invalid tags field' });
      continue;
    }
    for (const tag of card.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
    if (!card.tags.includes('general')) {
      tagIssues.push({ id: card.id, issue: 'Missing "general" tag' });
    }
  }

  // Check minimum 50 per tag
  const tagMinimums = {};
  for (const tag of expectedTags) {
    const count = tagCounts[tag] || 0;
    tagMinimums[tag] = { count, meetsMin50: count >= 50 };
    if (count < 50) {
      tagIssues.push({ tag, issue: `Tag "${tag}" has only ${count} cards (minimum: 50)` });
    }
  }

  // Check per-node tag distribution
  const nodeTagDist = {};
  for (const node of sortedNodes) {
    const cards = nodeMap[node].cards;
    const nodeTags = {};
    for (const card of cards) {
      if (card.tags) {
        for (const tag of card.tags) {
          nodeTags[tag] = (nodeTags[tag] || 0) + 1;
        }
      }
    }
    nodeTagDist[node] = nodeTags;
  }

  // Unexpected tags
  const unexpectedTags = Object.keys(tagCounts).filter(t => !expectedTags.includes(t));
  if (unexpectedTags.length > 0) {
    tagIssues.push({ issue: `Unexpected tags found: ${unexpectedTags.join(', ')}` });
  }

  report.sections.tagAccuracy = {
    globalCounts: tagCounts,
    tagMinimums,
    perNode: nodeTagDist,
    issues: tagIssues.slice(0, 50), // limit output
    summary: {
      totalTagIssues: tagIssues.length,
      unexpectedTags,
      allTagsMeetMin50: expectedTags.every(t => (tagCounts[t] || 0) >= 50),
    },
  };

  // ============================================================
  // 4. ESSENTIAL VOCAB COVERAGE
  // ============================================================
  const vocabCoverage = {};
  const allEnglish = deck.map(c => c.english.toLowerCase()).join(' ||| ');
  const allTarget = deck.map(c => c.target.toLowerCase()).join(' ||| ');

  for (const [category, config2] of Object.entries(ESSENTIAL_VOCAB)) {
    const found = [];
    const missing = [];

    for (const term of config2.terms) {
      const termLower = term.toLowerCase();
      // Check in English translations
      const inEnglish = new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(allEnglish);

      // Check in target language
      let inTarget = false;
      const targetTerms = (TARGET_VOCAB[langCode] && TARGET_VOCAB[langCode][category]) || [];
      // For target, check if any corresponding target term appears
      const termIndex = config2.terms.indexOf(term);
      if (targetTerms[termIndex]) {
        const tTerm = targetTerms[termIndex].toLowerCase();
        inTarget = allTarget.includes(tTerm);
      }

      if (inEnglish || inTarget) {
        found.push(term);
      } else {
        missing.push(term);
      }
    }

    vocabCoverage[category] = {
      found: found.length,
      missing: missing.length,
      total: config2.terms.length,
      minExpected: config2.minExpected,
      meetsMinimum: found.length >= config2.minExpected,
      foundTerms: found,
      missingTerms: missing,
    };
  }

  const vocabIssues = [];
  for (const [cat, data] of Object.entries(vocabCoverage)) {
    if (!data.meetsMinimum) {
      vocabIssues.push({ category: cat, issue: `Only ${data.found}/${data.minExpected} minimum found. Missing: ${data.missingTerms.join(', ')}` });
    }
  }

  report.sections.essentialVocab = {
    coverage: vocabCoverage,
    issues: vocabIssues,
    summary: {
      categoriesChecked: Object.keys(vocabCoverage).length,
      categoriesMeetingMinimum: Object.values(vocabCoverage).filter(v => v.meetsMinimum).length,
      categoriesFailing: vocabIssues.length,
    },
  };

  // ============================================================
  // 5. NODE TRANSITION LOGIC
  // ============================================================
  const transitionIssues = [];
  const nodeTransitions = {};

  for (let i = 0; i < sortedNodes.length; i++) {
    const node = sortedNodes[i];
    const nodeNum = getNodeNumber(node);
    const cards = nodeMap[node].cards;
    const nextNode = sortedNodes[i + 1];
    const prevNode = sortedNodes[i - 1];

    // Check node size balance
    const nodeSize = cards.length;
    const avgSize = deck.length / sortedNodes.length;

    nodeTransitions[node] = {
      size: nodeSize,
      avgSize: Math.round(avgSize),
      sizeRatio: parseFloat((nodeSize / avgSize).toFixed(2)),
    };

    if (nodeSize < avgSize * 0.3) {
      transitionIssues.push({ node, issue: `Very small node: ${nodeSize} cards (avg: ${Math.round(avgSize)})` });
    }
    if (nodeSize > avgSize * 2) {
      transitionIssues.push({ node, issue: `Very large node: ${nodeSize} cards (avg: ${Math.round(avgSize)})` });
    }

    // Check priority-1 card count (should have enough for initial learning)
    const p1Count = (nodeMap[node].priorities[1] || 0);
    if (p1Count < 10) {
      transitionIssues.push({ node, issue: `Insufficient priority-1 cards for initial learning: ${p1Count}` });
    }

    // Check grammar tip availability across nodes
    const tipsCount = cards.filter(c => c.grammar && c.grammar.trim().length > 0).length;
    const tipsPct = ((tipsCount / nodeSize) * 100).toFixed(1);
    nodeTransitions[node].grammarTips = { count: tipsCount, pct: parseFloat(tipsPct) };

    if (tipsCount < 5 && nodeSize > 30) {
      transitionIssues.push({ node, issue: `Too few grammar tips: ${tipsCount}/${nodeSize}` });
    }

    // Check complexity progression
    if (nextNode) {
      const currAvgWords = cards.reduce((s, c) => s + c.english.split(/\s+/).length, 0) / cards.length;
      const nextCards = nodeMap[nextNode].cards;
      const nextAvgWords = nextCards.reduce((s, c) => s + c.english.split(/\s+/).length, 0) / nextCards.length;
      nodeTransitions[node].avgEnglishWords = parseFloat(currAvgWords.toFixed(1));

      // Significant regression in complexity
      if (nextAvgWords < currAvgWords * 0.7 && getNodeNumber(nextNode) > 10) {
        transitionIssues.push({
          node: `${node} → ${nextNode}`,
          issue: `Complexity regression: avg words ${currAvgWords.toFixed(1)} → ${nextAvgWords.toFixed(1)}`,
        });
      }
    }

    // Check for duplicate English sentences within node
    const englishSet = new Set();
    const dupes = [];
    for (const card of cards) {
      const eng = card.english.toLowerCase().trim();
      if (englishSet.has(eng)) {
        dupes.push(eng);
      }
      englishSet.add(eng);
    }
    if (dupes.length > 0) {
      transitionIssues.push({ node, issue: `${dupes.length} duplicate English sentence(s)`, examples: dupes.slice(0, 3) });
    }
  }

  // Check for missing node numbers (gaps in sequence)
  const nodeNums = sortedNodes.map(getNodeNumber);
  const maxNode = Math.max(...nodeNums);
  for (let n = 1; n <= maxNode; n++) {
    const padded = `node-${String(n).padStart(2, '0')}`;
    if (!nodeMap[padded]) {
      transitionIssues.push({ node: padded, issue: 'Missing node in sequence' });
    }
  }

  // Global duplicate check across entire deck
  const globalEngSet = new Set();
  let globalDupes = 0;
  for (const card of deck) {
    const eng = card.english.toLowerCase().trim();
    if (globalEngSet.has(eng)) globalDupes++;
    globalEngSet.add(eng);
  }

  report.sections.nodeTransition = {
    perNode: nodeTransitions,
    issues: transitionIssues,
    summary: {
      totalNodes: sortedNodes.length,
      issueCount: transitionIssues.length,
      globalDuplicateEnglish: globalDupes,
      nodeSizeRange: { min: Math.min(...Object.values(nodeTransitions).map(n => n.size)), max: Math.max(...Object.values(nodeTransitions).map(n => n.size)) },
    },
  };

  // ============================================================
  // OVERALL SUMMARY
  // ============================================================
  const totalIssues = priorityIssues.length + levelIssues.length +
    tagIssues.length + vocabIssues.length + transitionIssues.length;

  report.overallSummary = {
    totalCards: deck.length,
    totalNodes: sortedNodes.length,
    totalIssues,
    breakdown: {
      priority: priorityIssues.length,
      level: levelIssues.length,
      tags: tagIssues.length,
      vocab: vocabIssues.length,
      transition: transitionIssues.length,
    },
    grade: totalIssues <= 5 ? 'A' : totalIssues <= 15 ? 'B' : totalIssues <= 30 ? 'C' : 'D',
  };

  return report;
}

function printSummary(report) {
  const sep = '='.repeat(60);
  console.log(`\n${sep}`);
  console.log(`  ${report.language} (${report.code}) – STRUCTURAL AUDIT`);
  console.log(`${sep}`);
  console.log(`  Total cards: ${report.totalCards} | Nodes: ${report.overallSummary.totalNodes}`);
  console.log(`  Grade: ${report.overallSummary.grade} (${report.overallSummary.totalIssues} total issues)\n`);

  // Priority
  const ps = report.sections.priorityBalance;
  console.log(`--- PRIORITY BALANCE (${ps.issues.length} issues) ---`);
  for (const issue of ps.issues) {
    console.log(`  [${issue.node || ''}] ${issue.issue}`);
  }

  // Level
  const ls = report.sections.levelAppropriateness;
  console.log(`\n--- LEVEL APPROPRIATENESS (${ls.issues.length} issues) ---`);
  for (const issue of ls.issues) {
    console.log(`  [${issue.node}] ${issue.issue}`);
  }

  // Tags
  const ts = report.sections.tagAccuracy;
  console.log(`\n--- TAG ACCURACY (${ts.summary.totalTagIssues} issues) ---`);
  console.log(`  Tag counts: ${JSON.stringify(ts.globalCounts)}`);
  console.log(`  All meet min 50: ${ts.summary.allTagsMeetMin50}`);
  if (ts.summary.unexpectedTags.length > 0) {
    console.log(`  Unexpected: ${ts.summary.unexpectedTags.join(', ')}`);
  }

  // Vocab
  const vs = report.sections.essentialVocab;
  console.log(`\n--- ESSENTIAL VOCAB (${vs.summary.categoriesMeetingMinimum}/${vs.summary.categoriesChecked} pass) ---`);
  for (const [cat, data] of Object.entries(vs.coverage)) {
    const status = data.meetsMinimum ? 'OK' : 'FAIL';
    console.log(`  ${cat}: ${data.found}/${data.total} found [${status}]${data.missingTerms.length > 0 ? ' Missing: ' + data.missingTerms.join(', ') : ''}`);
  }

  // Transitions
  const ns = report.sections.nodeTransition;
  console.log(`\n--- NODE TRANSITIONS (${ns.issues.length} issues) ---`);
  console.log(`  Node size range: ${ns.summary.nodeSizeRange.min}–${ns.summary.nodeSizeRange.max}`);
  console.log(`  Global duplicate English sentences: ${ns.summary.globalDuplicateEnglish}`);
  for (const issue of ns.issues.slice(0, 15)) {
    console.log(`  [${issue.node}] ${issue.issue}`);
  }
  if (ns.issues.length > 15) console.log(`  ... and ${ns.issues.length - 15} more`);

  console.log('');
}

// Run audits
const outDir = path.join(BASE, 'scripts/output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const langCode of ['nl', 'sv']) {
  const report = auditDeck(langCode);
  const outFile = path.join(outDir, `audit-${langCode}-structural.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`Written: ${outFile}`);
  printSummary(report);
}
