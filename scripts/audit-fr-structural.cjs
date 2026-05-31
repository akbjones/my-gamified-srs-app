#!/usr/bin/env node
/**
 * Comprehensive structural audit of the French deck.
 * Checks: priority balance, level appropriateness, tag accuracy,
 * essential vocab coverage, node transition logic.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const deck = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/french/deck.json'), 'utf8'));

// ── Node metadata ──────────────────────────────────────────────────────
const NODE_LEVELS = {
  'node-01': 'A1', 'node-02': 'A1', 'node-03': 'A1', 'node-04': 'A1',
  'node-05': 'A1', 'node-06': 'A1', 'node-07': 'A1', 'node-08': 'A1',
  'node-09': 'A2', 'node-10': 'A2', 'node-11': 'A2', 'node-12': 'A2',
  'node-13': 'A2', 'node-14': 'A2', 'node-15': 'A2',
  'node-16': 'B1', 'node-17': 'B1', 'node-18': 'B1', 'node-19': 'B1',
  'node-20': 'B1', 'node-21': 'B1',
  'node-22': 'B2', 'node-23': 'B2', 'node-24': 'B2', 'node-25': 'B2',
  'node-26': 'B2', 'node-27': 'B2',
  'node-28': 'C1', 'node-29': 'C1', 'node-30': 'C1', 'node-31': 'C1',
  'node-32': 'C2', 'node-33': 'C2', 'node-34': 'C2', 'node-35': 'C2',
};

const NODE_TOPICS = {
  'node-01': 'Present tense regular',
  'node-02': 'Present tense irregular',
  'node-03': 'Être vs Avoir distinctions',
  'node-04': 'Questions & interrogatives',
  'node-05': 'Gender & articles',
  'node-06': 'Reverse-construction verbs (plaire/falloir)',
  'node-07': 'Descriptions & il y a',
  'node-08': 'Common expressions',
  'node-09': 'Passé composé regular',
  'node-10': 'Passé composé irregular',
  'node-11': 'Imparfait',
  'node-12': 'Passé composé vs Imparfait',
  'node-13': 'Reflexive verbs',
  'node-14': 'Pour vs Par / Prepositions',
  'node-15': 'Object pronouns',
  'node-16': 'Present subjunctive',
  'node-17': 'Imperative',
  'node-18': 'Conditional',
  'node-19': 'Simple future',
  'node-20': 'Relative clauses',
  'node-21': 'Compound tenses',
  'node-22': 'Imperfect subjunctive',
  'node-23': 'Complex conditionals',
  'node-24': 'Passive & impersonal',
  'node-25': 'Discourse connectors',
  'node-26': 'Verb phrases (periphrases)',
  'node-27': 'Reported speech',
  'node-28': 'Subjunctive nuances',
  'node-29': 'Formal/literary register',
  'node-30': 'Idiomatic expressions',
  'node-31': 'Complex syntax',
  'node-32': 'Literary tenses',
  'node-33': 'Academic/professional discourse',
  'node-34': 'Cultural fluency',
  'node-35': 'Mastery: combined patterns',
};

// Essential vocab by CEFR level
const ESSENTIAL_VOCAB = {
  A1: ['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'être', 'avoir',
       'faire', 'aller', 'venir', 'manger', 'boire', 'parler', 'maison', 'école',
       'livre', 'eau', 'homme', 'femme', 'enfant', 'jour', 'nuit', 'bon', 'petit',
       'grand', 'nouveau', 'oui', 'non', 'merci', 'bonjour', 'comment', 'pourquoi',
       'quand', 'temps', 'famille', 'ami', 'travail', 'ville'],
  A2: ['acheter', 'vendre', 'attendre', 'comprendre', 'apprendre', 'écrire',
       'lire', 'dormir', 'courir', 'prendre', 'mettre', 'voir', 'savoir',
       'pouvoir', 'vouloir', 'devoir', 'hier', 'demain', 'souvent', 'jamais',
       'toujours', 'parfois', 'argent', 'voyage', 'magasin', 'hôtel', 'restaurant',
       'médecin', 'voiture', 'train'],
  B1: ['réussir', 'essayer', 'expliquer', 'proposer', 'accepter', 'refuser',
       'permettre', 'interdire', 'conseiller', 'souhaiter', 'craindre', 'douter',
       'opinion', 'société', 'gouvernement', 'entreprise', 'environnement',
       'santé', 'éducation', 'culture'],
  B2: ['analyser', 'évaluer', 'contribuer', 'influencer', 'négocier', 'convaincre',
       'cependant', 'néanmoins', 'toutefois', 'en revanche', 'par conséquent',
       'malgré', 'quoique', 'bien que', 'afin que', 'pourvu que'],
  C1: ['nuancer', 'approfondir', 'sous-jacent', 'paradoxalement', 'corrélation',
       'en l\'occurrence', 'force est de constater', 'il n\'en demeure pas moins'],
  C2: ['nonobstant', 'susmentionné', 'en l\'espèce', 'ipso facto',
       'autrui', 'naguère', 'en amont', 'en aval'],
};

// ── Collect stats ──────────────────────────────────────────────────────
const issues = [];
const nodeStats = {};
const tagCounts = { general: 0, travel: 0, work: 0, family: 0 };
const priorityCounts = {};
const allTargets = deck.map(c => c.target.toLowerCase());
const allTargetsJoined = allTargets.join(' ');
const uniqueIds = new Set();
const duplicateIds = [];
const duplicateSentences = {};

for (const card of deck) {
  // ID duplicates
  if (uniqueIds.has(card.id)) duplicateIds.push(card.id);
  uniqueIds.add(card.id);

  // Sentence duplicates
  const normSentence = card.target.toLowerCase().trim();
  if (!duplicateSentences[normSentence]) duplicateSentences[normSentence] = [];
  duplicateSentences[normSentence].push(card.id);

  // Node stats
  const node = card.grammarNode;
  if (!nodeStats[node]) {
    nodeStats[node] = {
      total: 0, priorities: {}, tags: { general: 0, travel: 0, work: 0, family: 0 },
      withGrammar: 0, level: NODE_LEVELS[node] || '??',
      topic: NODE_TOPICS[node] || 'Unknown',
    };
  }
  const ns = nodeStats[node];
  ns.total++;
  ns.priorities[card.priority] = (ns.priorities[card.priority] || 0) + 1;
  if (card.grammar) ns.withGrammar++;

  // Tags
  for (const tag of (card.tags || [])) {
    if (ns.tags[tag] !== undefined) ns.tags[tag]++;
    if (tagCounts[tag] !== undefined) tagCounts[tag]++;
  }

  // Global priority
  priorityCounts[card.priority] = (priorityCounts[card.priority] || 0) + 1;
}

// ── 1) Priority balance per node ───────────────────────────────────────
const priorityIssues = [];
for (const [node, stats] of Object.entries(nodeStats).sort()) {
  const prios = stats.priorities;
  const p1 = prios[1] || 0;
  const p2 = prios[2] || 0;
  const p3 = prios[3] || 0;
  const total = stats.total;

  // Check distribution: p1 should be ~40-50%, p2 ~30-35%, p3 ~20-25%
  const p1pct = (p1 / total * 100);
  const p2pct = (p2 / total * 100);
  const p3pct = (p3 / total * 100);

  const nodeIssues = [];
  if (p1pct < 30) nodeIssues.push(`P1 too low: ${p1pct.toFixed(1)}% (${p1}/${total})`);
  if (p1pct > 60) nodeIssues.push(`P1 too high: ${p1pct.toFixed(1)}% (${p1}/${total})`);
  if (p2pct < 15) nodeIssues.push(`P2 too low: ${p2pct.toFixed(1)}% (${p2}/${total})`);
  if (p2pct > 50) nodeIssues.push(`P2 too high: ${p2pct.toFixed(1)}% (${p2}/${total})`);
  if (p3pct < 10) nodeIssues.push(`P3 too low: ${p3pct.toFixed(1)}% (${p3}/${total})`);
  if (p3pct > 40) nodeIssues.push(`P3 too high: ${p3pct.toFixed(1)}% (${p3}/${total})`);

  if (nodeIssues.length > 0) {
    priorityIssues.push({
      node, level: stats.level, topic: stats.topic,
      distribution: { p1, p2, p3, total },
      percentages: { p1: p1pct.toFixed(1), p2: p2pct.toFixed(1), p3: p3pct.toFixed(1) },
      issues: nodeIssues,
    });
  }
}

// ── 2) Level appropriateness ───────────────────────────────────────────
const levelIssues = [];
const LEVEL_WORD_LIMITS = {
  A1: { maxWords: 8, maxChars: 60 },
  A2: { maxWords: 12, maxChars: 90 },
  B1: { maxWords: 16, maxChars: 120 },
  B2: { maxWords: 20, maxChars: 150 },
  C1: { maxWords: 25, maxChars: 200 },
  C2: { maxWords: 35, maxChars: 280 },
};

const levelStats = {};
for (const card of deck) {
  const level = NODE_LEVELS[card.grammarNode] || '??';
  if (!levelStats[level]) levelStats[level] = { cards: 0, tooLong: 0, tooShort: 0, examples: [] };
  levelStats[level].cards++;

  const words = card.target.split(/\s+/).length;
  const chars = card.target.length;
  const limits = LEVEL_WORD_LIMITS[level];
  if (!limits) continue;

  if (words > limits.maxWords + 5) {
    levelStats[level].tooLong++;
    if (levelStats[level].examples.length < 3) {
      levelStats[level].examples.push({
        id: card.id, target: card.target, words, node: card.grammarNode,
        issue: `Too long for ${level}: ${words} words`,
      });
    }
  }
  // A1/A2 cards that are suspiciously short (1-2 words) may be fragments
  if ((level === 'A1' || level === 'A2') && words <= 1) {
    levelStats[level].tooShort++;
  }
}

for (const [level, stats] of Object.entries(levelStats)) {
  if (stats.tooLong > 0 || stats.tooShort > 0) {
    levelIssues.push({
      level, total: stats.cards, tooLong: stats.tooLong, tooShort: stats.tooShort,
      examples: stats.examples,
    });
  }
}

// Check minimum cards per node (should be 15+)
const smallNodes = [];
for (const [node, stats] of Object.entries(nodeStats).sort()) {
  if (stats.total < 15) {
    smallNodes.push({ node, count: stats.total, level: stats.level, topic: stats.topic });
  }
}

// ── 3) Tag accuracy ────────────────────────────────────────────────────
const tagIssues = [];
const MIN_TAG_PER_NODE = 3; // each tag should appear at least 3 times per node

// Check global tag minimums (50 per tag)
for (const [tag, count] of Object.entries(tagCounts)) {
  if (count < 50) {
    tagIssues.push({ tag, count, issue: `Global count below 50: ${count}` });
  }
}

// Check tags per node — travel/work/family should each appear in reasonable %
const tagNodeIssues = [];
for (const [node, stats] of Object.entries(nodeStats).sort()) {
  for (const tag of ['travel', 'work', 'family']) {
    const pct = (stats.tags[tag] / stats.total * 100).toFixed(1);
    if (stats.tags[tag] < MIN_TAG_PER_NODE) {
      tagNodeIssues.push({
        node, tag, count: stats.tags[tag], total: stats.total,
        pct, issue: `${tag} underrepresented: ${stats.tags[tag]}/${stats.total}`,
      });
    }
  }
  // general should be on all cards
  if (stats.tags.general < stats.total) {
    tagNodeIssues.push({
      node, tag: 'general', count: stats.tags.general, total: stats.total,
      issue: `Not all cards tagged 'general': ${stats.tags.general}/${stats.total}`,
    });
  }
}

// ── 4) Essential vocab coverage ────────────────────────────────────────
const vocabIssues = {};
for (const [level, words] of Object.entries(ESSENTIAL_VOCAB)) {
  const missing = [];
  for (const word of words) {
    // Check if word appears in any target sentence for this level's nodes
    const levelNodes = Object.entries(NODE_LEVELS)
      .filter(([_, l]) => l === level)
      .map(([n]) => n);

    const inLevel = deck.some(c =>
      levelNodes.includes(c.grammarNode) &&
      c.target.toLowerCase().includes(word.toLowerCase())
    );
    const inAny = allTargetsJoined.includes(word.toLowerCase());

    if (!inLevel && !inAny) {
      missing.push({ word, inLevel: false, inAnyLevel: false });
    } else if (!inLevel) {
      missing.push({ word, inLevel: false, inAnyLevel: true });
    }
  }
  if (missing.length > 0) {
    vocabIssues[level] = { total: words.length, missing: missing.length, words: missing };
  }
}

// ── 5) Node transition logic ──────────────────────────────────────────
// Cards should be ordered so that node-01 cards come before node-02, etc.
const transitionIssues = [];
let lastNode = 'node-01';
let outOfOrderCount = 0;
for (let i = 0; i < deck.length; i++) {
  const card = deck[i];
  const nodeNum = parseInt(card.grammarNode.replace('node-', ''));
  const lastNum = parseInt(lastNode.replace('node-', ''));
  if (nodeNum < lastNum) {
    outOfOrderCount++;
    if (transitionIssues.length < 5) {
      transitionIssues.push({
        index: i, id: card.id, node: card.grammarNode,
        previousNode: lastNode, issue: 'Card appears after higher node',
      });
    }
  }
  lastNode = card.grammarNode;
}

// Check cards are sorted by priority within each node
const priorityOrderIssues = [];
for (const [node, _] of Object.entries(nodeStats).sort()) {
  const nodeCards = deck.filter(c => c.grammarNode === node);
  let lastPrio = 0;
  let misordered = 0;
  for (const card of nodeCards) {
    if (card.priority < lastPrio) misordered++;
    lastPrio = card.priority;
  }
  if (misordered > 0) {
    priorityOrderIssues.push({ node, misorderedCards: misordered, total: nodeCards.length });
  }
}

// ── 6) Additional checks ──────────────────────────────────────────────
// Duplicate sentences
const dupes = Object.entries(duplicateSentences)
  .filter(([_, ids]) => ids.length > 1)
  .map(([sentence, ids]) => ({ sentence: sentence.substring(0, 80), ids }));

// Grammar tip coverage per node
const grammarCoverage = {};
for (const [node, stats] of Object.entries(nodeStats).sort()) {
  const pct = (stats.withGrammar / stats.total * 100).toFixed(1);
  grammarCoverage[node] = {
    total: stats.total, withTips: stats.withGrammar, pct,
    level: stats.level, topic: stats.topic,
  };
}

// Cards missing audio
const missingAudio = deck.filter(c => !c.audio).length;

// Cards with empty target/english
const emptyFields = deck.filter(c => !c.target || !c.english).length;

// ── Build report ───────────────────────────────────────────────────────
const report = {
  meta: {
    language: 'French',
    totalCards: deck.length,
    timestamp: new Date().toISOString(),
    uniqueIds: uniqueIds.size,
    duplicateIds: duplicateIds.length,
    duplicateSentences: dupes.length,
    missingAudio,
    emptyFields,
  },
  summary: {
    priorityDistribution: priorityCounts,
    tagDistribution: tagCounts,
    nodesCount: Object.keys(nodeStats).length,
    cardsPerLevel: {},
    grammarTipRate: (deck.filter(c => c.grammar).length / deck.length * 100).toFixed(1) + '%',
  },
  nodeBreakdown: Object.entries(nodeStats).sort().map(([node, s]) => ({
    node, level: s.level, topic: s.topic, total: s.total,
    priorities: s.priorities,
    tags: s.tags,
    grammarTips: s.withGrammar,
    grammarPct: (s.withGrammar / s.total * 100).toFixed(1) + '%',
  })),
  issues: {
    priorityBalance: {
      count: priorityIssues.length,
      details: priorityIssues,
    },
    levelAppropriateness: {
      levelIssues,
      smallNodes,
    },
    tagAccuracy: {
      globalIssues: tagIssues,
      perNodeIssues: tagNodeIssues.length,
      topIssues: tagNodeIssues.slice(0, 20),
    },
    essentialVocab: vocabIssues,
    nodeTransition: {
      outOfOrderCards: outOfOrderCount,
      examples: transitionIssues,
      priorityOrderIssues: priorityOrderIssues.length,
      priorityOrderDetails: priorityOrderIssues,
    },
    duplicateSentences: {
      count: dupes.length,
      examples: dupes.slice(0, 10),
    },
  },
};

// Compute cards per level
for (const [node, stats] of Object.entries(nodeStats)) {
  const level = stats.level;
  report.summary.cardsPerLevel[level] = (report.summary.cardsPerLevel[level] || 0) + stats.total;
}

// ── Write output ───────────────────────────────────────────────────────
const outPath = path.join(ROOT, 'scripts/output/audit-fr-structural.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

// ── Print summary ──────────────────────────────────────────────────────
console.log('=== FRENCH DECK STRUCTURAL AUDIT ===');
console.log(`Total cards: ${deck.length}`);
console.log(`Unique IDs: ${uniqueIds.size} | Duplicate IDs: ${duplicateIds.length}`);
console.log(`Duplicate sentences: ${dupes.length}`);
console.log(`Missing audio: ${missingAudio} | Empty fields: ${emptyFields}`);
console.log(`Grammar tip rate: ${report.summary.grammarTipRate}`);
console.log('');

console.log('--- Cards per level ---');
for (const [level, count] of Object.entries(report.summary.cardsPerLevel).sort()) {
  console.log(`  ${level}: ${count}`);
}

console.log('');
console.log('--- Priority distribution (global) ---');
for (const [p, count] of Object.entries(priorityCounts).sort()) {
  console.log(`  P${p}: ${count} (${(count / deck.length * 100).toFixed(1)}%)`);
}

console.log('');
console.log(`--- Priority balance issues: ${priorityIssues.length} nodes ---`);
for (const issue of priorityIssues.slice(0, 10)) {
  console.log(`  ${issue.node} (${issue.level} ${issue.topic}): P1=${issue.percentages.p1}% P2=${issue.percentages.p2}% P3=${issue.percentages.p3}% — ${issue.issues.join('; ')}`);
}

console.log('');
console.log(`--- Level appropriateness ---`);
for (const li of levelIssues) {
  console.log(`  ${li.level}: ${li.tooLong} too long, ${li.tooShort} too short (of ${li.total})`);
}
if (smallNodes.length > 0) {
  console.log(`  Small nodes (<15 cards): ${smallNodes.map(n => `${n.node}(${n.count})`).join(', ')}`);
} else {
  console.log('  All nodes have 15+ cards.');
}

console.log('');
console.log(`--- Tag issues ---`);
console.log(`  Global shortfalls: ${tagIssues.length}`);
console.log(`  Per-node issues: ${tagNodeIssues.length}`);
if (tagIssues.length > 0) {
  for (const ti of tagIssues) console.log(`    ${ti.tag}: ${ti.count} (need 50+)`);
}

console.log('');
console.log(`--- Essential vocab coverage ---`);
for (const [level, data] of Object.entries(vocabIssues)) {
  const missingInLevel = data.words.filter(w => !w.inAnyLevel).length;
  const wrongLevel = data.words.filter(w => w.inAnyLevel).length;
  console.log(`  ${level}: ${data.missing}/${data.total} issues (${missingInLevel} missing entirely, ${wrongLevel} in wrong level)`);
  const missingEntirely = data.words.filter(w => !w.inAnyLevel).map(w => w.word);
  if (missingEntirely.length > 0) {
    console.log(`    Missing entirely: ${missingEntirely.join(', ')}`);
  }
}

console.log('');
console.log(`--- Node transition ---`);
console.log(`  Out-of-order cards: ${outOfOrderCount}`);
console.log(`  Priority misordered nodes: ${priorityOrderIssues.length}`);
if (priorityOrderIssues.length > 0) {
  for (const po of priorityOrderIssues.slice(0, 5)) {
    console.log(`    ${po.node}: ${po.misorderedCards} misordered of ${po.total}`);
  }
}

console.log('');
console.log(`--- Node breakdown ---`);
for (const nb of report.nodeBreakdown) {
  const p1 = nb.priorities[1] || 0;
  const p2 = nb.priorities[2] || 0;
  const p3 = nb.priorities[3] || 0;
  console.log(`  ${nb.node} ${nb.level} [${nb.topic}]: ${nb.total} cards, P1/2/3=${p1}/${p2}/${p3}, tips=${nb.grammarPct}, tags=G${nb.tags.general}/T${nb.tags.travel}/W${nb.tags.work}/F${nb.tags.family}`);
}

console.log('');
console.log(`Report written to: scripts/output/audit-fr-structural.json`);
