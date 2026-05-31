#!/usr/bin/env node
/**
 * Comprehensive structural audit for Welsh (cy) and Hindi (hi) decks.
 * Checks: priority balance, level appropriateness, tag accuracy,
 * essential vocab coverage, node transition logic.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CY_DECK = path.join(ROOT, 'src/data/welsh/deck.json');
const HI_DECK = path.join(ROOT, 'src/data/hindi/deck.json');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// Essential vocabulary categories with search terms (English side)
const ESSENTIAL_VOCAB = {
  numbers: {
    terms: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'zero', 'twenty', 'thirty', 'first', 'second', 'third'],
    minimum: 8
  },
  colors: {
    terms: ['red', 'blue', 'green', 'yellow', 'white', 'black', 'brown', 'pink', 'orange', 'purple', 'grey', 'gray'],
    minimum: 6
  },
  directions: {
    terms: ['left', 'right', 'north', 'south', 'east', 'west', 'straight', 'turn', 'direction', 'up', 'down', 'near', 'far', 'behind', 'front', 'next to', 'opposite'],
    minimum: 5
  },
  body_parts: {
    terms: ['head', 'hand', 'eye', 'ear', 'nose', 'mouth', 'foot', 'leg', 'arm', 'heart', 'face', 'hair', 'tooth', 'finger', 'stomach', 'back', 'knee', 'shoulder'],
    minimum: 6
  },
  animals: {
    terms: ['dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'sheep', 'chicken', 'rabbit', 'pig', 'lion', 'elephant', 'mouse', 'duck', 'snake', 'bear', 'wolf'],
    minimum: 5
  },
  family: {
    terms: ['mother', 'father', 'sister', 'brother', 'son', 'daughter', 'grandmother', 'grandfather', 'uncle', 'aunt', 'cousin', 'husband', 'wife', 'parent', 'child', 'baby', 'family', 'mom', 'dad', 'mum'],
    minimum: 6
  },
  days_time: {
    terms: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'today', 'tomorrow', 'yesterday', 'morning', 'evening', 'night', 'week', 'month', 'year', 'afternoon', 'hour', 'minute'],
    minimum: 8
  },
  food: {
    terms: ['bread', 'water', 'milk', 'rice', 'meat', 'fruit', 'vegetable', 'egg', 'cheese', 'tea', 'coffee', 'sugar', 'salt', 'butter', 'apple', 'chicken', 'fish', 'soup', 'cake', 'chocolate'],
    minimum: 8
  },
  basic_phrases: {
    terms: ['hello', 'goodbye', 'please', 'thank', 'sorry', 'yes', 'no', 'how are you', 'my name', 'excuse me', 'good morning', 'good night', 'welcome', 'help'],
    minimum: 6
  }
};

// Node descriptions for transition logic analysis
const NODE_PROGRESSION = [
  { node: 'node-01', desc: 'Present tense basics / Introductions', level: 'beginner' },
  { node: 'node-02', desc: 'Nouns & articles / Gender', level: 'beginner' },
  { node: 'node-03', desc: 'Adjectives / Descriptions', level: 'beginner' },
  { node: 'node-04', desc: 'Plurals / Quantifiers', level: 'beginner' },
  { node: 'node-05', desc: 'Basic questions', level: 'beginner' },
  { node: 'node-06', desc: 'Negation', level: 'beginner' },
  { node: 'node-07', desc: 'Possessives', level: 'beginner' },
  { node: 'node-08', desc: 'Prepositions / Location', level: 'elementary' },
  { node: 'node-09', desc: 'Numbers / Time', level: 'elementary' },
  { node: 'node-10', desc: 'Past tense intro', level: 'elementary' },
  { node: 'node-11', desc: 'Past tense continued', level: 'elementary' },
  { node: 'node-12', desc: 'Future tense', level: 'elementary' },
  { node: 'node-13', desc: 'Modal verbs', level: 'elementary' },
  { node: 'node-14', desc: 'Comparatives', level: 'elementary' },
  { node: 'node-15', desc: 'Adverbs', level: 'intermediate' },
  { node: 'node-16', desc: 'Conjunctions / Complex sentences', level: 'intermediate' },
  { node: 'node-17', desc: 'Reflexive / Reciprocal', level: 'intermediate' },
  { node: 'node-18', desc: 'Conditional', level: 'intermediate' },
  { node: 'node-19', desc: 'Passive voice', level: 'intermediate' },
  { node: 'node-20', desc: 'Relative clauses', level: 'intermediate' },
  { node: 'node-21', desc: 'Imperative / Commands', level: 'intermediate' },
  { node: 'node-22', desc: 'Subjunctive / Wishes', level: 'upper-intermediate' },
  { node: 'node-23', desc: 'Reported speech', level: 'upper-intermediate' },
  { node: 'node-24', desc: 'Advanced tenses', level: 'upper-intermediate' },
  { node: 'node-25', desc: 'Idiomatic expressions', level: 'upper-intermediate' },
  { node: 'node-26', desc: 'Formal register', level: 'upper-intermediate' },
  { node: 'node-27', desc: 'Advanced vocabulary 1', level: 'advanced' },
  { node: 'node-28', desc: 'Advanced vocabulary 2', level: 'advanced' },
  { node: 'node-29', desc: 'Advanced grammar 1', level: 'advanced' },
  { node: 'node-30', desc: 'Advanced grammar 2', level: 'advanced' },
  { node: 'node-31', desc: 'Literary / Archaic forms', level: 'advanced' },
  { node: 'node-32', desc: 'Technical vocabulary', level: 'advanced' },
  { node: 'node-33', desc: 'Nuance & register', level: 'advanced' },
  { node: 'node-34', desc: 'Complex structures', level: 'advanced' },
  { node: 'node-35', desc: 'Mastery & review', level: 'advanced' },
];

function auditDeck(deck, lang) {
  const result = {
    language: lang,
    totalCards: deck.length,
    timestamp: new Date().toISOString(),
    sections: {}
  };

  // ── 1. PRIORITY BALANCE PER NODE ──
  const nodes = {};
  for (const card of deck) {
    const n = card.grammarNode;
    if (!nodes[n]) nodes[n] = { total: 0, priorities: {}, cards: [], tags: {} };
    nodes[n].total++;
    const p = card.priority || 0;
    nodes[n].priorities[p] = (nodes[n].priorities[p] || 0) + 1;
    nodes[n].cards.push(card);
    for (const t of (card.tags || [])) {
      nodes[n].tags[t] = (nodes[n].tags[t] || 0) + 1;
    }
  }

  const priorityBalance = {};
  const priorityIssues = [];
  const sortedNodes = Object.keys(nodes).sort();

  for (const n of sortedNodes) {
    const nd = nodes[n];
    const prios = nd.priorities;
    const p1 = prios[1] || 0;
    const p2 = prios[2] || 0;
    const p3 = prios[3] || 0;
    const total = nd.total;
    priorityBalance[n] = {
      total,
      p1, p2, p3,
      p1_pct: Math.round(p1 / total * 100),
      p2_pct: Math.round(p2 / total * 100),
      p3_pct: Math.round(p3 / total * 100),
    };

    // Flag issues: p1 should be ~40-60%, p2 ~25-40%, p3 ~10-25%
    if (p1 / total < 0.30) priorityIssues.push(`${n}: P1 too low (${Math.round(p1/total*100)}%) — only ${p1}/${total}`);
    if (p1 / total > 0.70) priorityIssues.push(`${n}: P1 too high (${Math.round(p1/total*100)}%) — ${p1}/${total}`);
    if (p3 / total > 0.35) priorityIssues.push(`${n}: P3 too high (${Math.round(p3/total*100)}%) — ${p3}/${total}`);
    if (p3 === 0 && total > 20) priorityIssues.push(`${n}: No P3 cards at all (${total} cards)`);
    if (p2 === 0 && total > 20) priorityIssues.push(`${n}: No P2 cards at all (${total} cards)`);

    // Check for unknown priorities
    for (const pk of Object.keys(prios)) {
      if (![1,2,3].includes(Number(pk))) {
        priorityIssues.push(`${n}: Unknown priority ${pk} (${prios[pk]} cards)`);
      }
    }
  }

  result.sections.priorityBalance = {
    perNode: priorityBalance,
    issues: priorityIssues,
    issueCount: priorityIssues.length
  };

  // ── 2. LEVEL APPROPRIATENESS ──
  // Nodes with 15+ cards = cumulative level should be 500+
  // Check: early nodes shouldn't have advanced vocab, late nodes shouldn't be too simple
  const levelIssues = [];
  const nodeSizes = {};
  let cumulative = 0;

  for (const n of sortedNodes) {
    const nd = nodes[n];
    cumulative += nd.total;
    nodeSizes[n] = { count: nd.total, cumulative };

    // Check min cards per node
    if (nd.total < 50) {
      levelIssues.push(`${n}: Only ${nd.total} cards (minimum recommended: 50)`);
    }
    if (nd.total > 200) {
      levelIssues.push(`${n}: ${nd.total} cards (unusually large, consider splitting)`);
    }

    // Check for sentence length appropriateness
    const avgLen = nd.cards.reduce((s, c) => s + c.english.length, 0) / nd.total;
    const nodeNum = parseInt(n.replace('node-', ''));

    // Early nodes (1-7) should have shorter sentences
    if (nodeNum <= 7 && avgLen > 80) {
      levelIssues.push(`${n}: Avg English length ${Math.round(avgLen)} chars — too complex for beginner node`);
    }
  }

  // Check cumulative at node-15 should be ~500+
  const mid = nodeSizes['node-15'];
  if (mid && mid.cumulative < 400) {
    levelIssues.push(`Cumulative at node-15: only ${mid.cumulative} cards (target: 500+)`);
  }

  result.sections.levelAppropriateness = {
    nodeSizes,
    issues: levelIssues,
    issueCount: levelIssues.length,
    totalNodes: sortedNodes.length
  };

  // ── 3. TAG ACCURACY ──
  const tagCounts = {};
  const tagIssues = [];
  for (const card of deck) {
    for (const t of (card.tags || [])) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }

  const REQUIRED_TAGS = ['general', 'travel', 'work', 'family'];
  for (const t of REQUIRED_TAGS) {
    const count = tagCounts[t] || 0;
    if (count < 50) {
      tagIssues.push(`Tag "${t}": only ${count} cards (minimum: 50)`);
    }
  }

  // Check no-tag cards
  const noTag = deck.filter(c => !c.tags || c.tags.length === 0);
  if (noTag.length > 0) {
    tagIssues.push(`${noTag.length} cards have no tags`);
  }

  // Check general tag coverage
  const generalPct = Math.round((tagCounts['general'] || 0) / deck.length * 100);
  if (generalPct < 95) {
    tagIssues.push(`"general" tag only on ${generalPct}% of cards (expected ~100%)`);
  }

  // Check tag distribution per node (each node should have mix)
  const tagPerNode = {};
  for (const n of sortedNodes) {
    const nd = nodes[n];
    tagPerNode[n] = nd.tags;
    const travel = nd.tags['travel'] || 0;
    const work = nd.tags['work'] || 0;
    const family = nd.tags['family'] || 0;
    const themed = travel + work + family;
    const pct = Math.round(themed / nd.total * 100);
    // At least some themed tags per node
    if (themed === 0 && nd.total >= 30) {
      tagIssues.push(`${n}: No themed tags (travel/work/family) across ${nd.total} cards`);
    }
  }

  // Detect suspicious tags
  const knownTags = new Set(['general', 'travel', 'work', 'family']);
  for (const t of Object.keys(tagCounts)) {
    if (!knownTags.has(t)) {
      tagIssues.push(`Unknown tag "${t}": ${tagCounts[t]} cards`);
    }
  }

  result.sections.tagAccuracy = {
    tagCounts,
    tagDistributionPerNode: tagPerNode,
    issues: tagIssues,
    issueCount: tagIssues.length
  };

  // ── 4. ESSENTIAL VOCAB COVERAGE ──
  const vocabCoverage = {};

  for (const [category, config] of Object.entries(ESSENTIAL_VOCAB)) {
    const found = [];
    const missing = [];

    for (const term of config.terms) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      const matches = deck.filter(c => regex.test(c.english));
      if (matches.length > 0) {
        found.push({ term, count: matches.length, sampleId: matches[0].id, sampleNode: matches[0].grammarNode });
      } else {
        missing.push(term);
      }
    }

    const score = found.length;
    const total = config.terms.length;
    const status = score >= config.minimum ? 'PASS' : 'FAIL';

    vocabCoverage[category] = {
      status,
      found: found.length,
      total: total,
      minimum: config.minimum,
      foundTerms: found,
      missingTerms: missing
    };
  }

  const vocabIssues = [];
  for (const [cat, data] of Object.entries(vocabCoverage)) {
    if (data.status === 'FAIL') {
      vocabIssues.push(`${cat}: ${data.found}/${data.total} found (need ${data.minimum}) — missing: ${data.missingTerms.join(', ')}`);
    }
  }

  result.sections.essentialVocab = {
    coverage: vocabCoverage,
    issues: vocabIssues,
    issueCount: vocabIssues.length,
    overallPass: vocabIssues.length === 0
  };

  // ── 5. NODE TRANSITION LOGIC ──
  const transitionIssues = [];

  // Check nodes are sequential
  const nodeNums = sortedNodes.map(n => parseInt(n.replace('node-', '')));
  for (let i = 1; i < nodeNums.length; i++) {
    if (nodeNums[i] !== nodeNums[i-1] + 1) {
      transitionIssues.push(`Gap in node sequence: node-${String(nodeNums[i-1]).padStart(2,'0')} -> node-${String(nodeNums[i]).padStart(2,'0')}`);
    }
  }

  // Check grammar tip density progression (should increase then plateau)
  const tipDensity = {};
  for (const n of sortedNodes) {
    const nd = nodes[n];
    const withTips = nd.cards.filter(c => c.grammar && c.grammar.trim() !== '');
    tipDensity[n] = {
      total: nd.total,
      withTips: withTips.length,
      pct: Math.round(withTips.length / nd.total * 100)
    };

    // First few nodes should have decent tip density for learners
    const nodeNum = parseInt(n.replace('node-', ''));
    if (nodeNum <= 5 && withTips.length / nd.total < 0.15) {
      transitionIssues.push(`${n}: Grammar tip density too low for beginner node (${Math.round(withTips.length/nd.total*100)}%)`);
    }
  }

  // Check that card IDs are unique
  const idSet = new Set();
  const dupeIds = [];
  for (const card of deck) {
    if (idSet.has(card.id)) dupeIds.push(card.id);
    idSet.add(card.id);
  }
  if (dupeIds.length > 0) {
    transitionIssues.push(`Duplicate card IDs found: ${dupeIds.slice(0, 10).join(', ')}${dupeIds.length > 10 ? ` (+${dupeIds.length - 10} more)` : ''}`);
  }

  // Check audio field populated
  const noAudio = deck.filter(c => !c.audio || c.audio.trim() === '');
  if (noAudio.length > 0) {
    transitionIssues.push(`${noAudio.length} cards missing audio field`);
  }

  // Check duplicate sentences
  const sentSet = new Map();
  const dupeSentences = [];
  for (const card of deck) {
    const key = card.target.toLowerCase().trim();
    if (sentSet.has(key)) {
      dupeSentences.push({ id1: sentSet.get(key), id2: card.id, sentence: card.target });
    }
    sentSet.set(key, card.id);
  }
  if (dupeSentences.length > 0) {
    transitionIssues.push(`${dupeSentences.length} duplicate target sentences found`);
  }

  // Check English duplicates
  const engSet = new Map();
  const dupeEnglish = [];
  for (const card of deck) {
    const key = card.english.toLowerCase().trim();
    if (engSet.has(key)) {
      dupeEnglish.push({ id1: engSet.get(key), id2: card.id, english: card.english });
    }
    engSet.set(key, card.id);
  }
  if (dupeEnglish.length > 0) {
    transitionIssues.push(`${dupeEnglish.length} duplicate English sentences found`);
  }

  result.sections.nodeTransition = {
    tipDensity,
    nodeSequence: nodeNums,
    issues: transitionIssues,
    issueCount: transitionIssues.length,
    duplicateTargets: dupeSentences.slice(0, 20),
    duplicateEnglish: dupeEnglish.slice(0, 20)
  };

  // ── SUMMARY ──
  const totalIssues = priorityIssues.length + levelIssues.length + tagIssues.length + vocabIssues.length + transitionIssues.length;
  result.summary = {
    totalIssues,
    priorityIssueCount: priorityIssues.length,
    levelIssueCount: levelIssues.length,
    tagIssueCount: tagIssues.length,
    vocabIssueCount: vocabIssues.length,
    transitionIssueCount: transitionIssues.length,
    grade: totalIssues <= 5 ? 'A' : totalIssues <= 15 ? 'B' : totalIssues <= 30 ? 'C' : 'D'
  };

  return result;
}

function printSummary(audit) {
  const lang = audit.language.toUpperCase();
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  STRUCTURAL AUDIT: ${lang} (${audit.totalCards} cards)`);
  console.log(`${'='.repeat(70)}`);
  console.log(`  Grade: ${audit.summary.grade} | Total issues: ${audit.summary.totalIssues}`);
  console.log(`${'─'.repeat(70)}`);

  // Priority Balance
  const pb = audit.sections.priorityBalance;
  console.log(`\n  1. PRIORITY BALANCE (${pb.issueCount} issues)`);
  console.log(`  ${'─'.repeat(50)}`);
  const nodeKeys = Object.keys(pb.perNode).sort();
  console.log(`  ${'Node'.padEnd(10)} ${'Total'.padEnd(7)} ${'P1'.padEnd(5)} ${'P2'.padEnd(5)} ${'P3'.padEnd(5)} P1%  P2%  P3%`);
  for (const n of nodeKeys) {
    const d = pb.perNode[n];
    console.log(`  ${n.padEnd(10)} ${String(d.total).padEnd(7)} ${String(d.p1).padEnd(5)} ${String(d.p2).padEnd(5)} ${String(d.p3).padEnd(5)} ${String(d.p1_pct).padStart(3)}% ${String(d.p2_pct).padStart(3)}% ${String(d.p3_pct).padStart(3)}%`);
  }
  if (pb.issues.length > 0) {
    console.log(`\n  Issues:`);
    for (const i of pb.issues) console.log(`    - ${i}`);
  }

  // Level
  const la = audit.sections.levelAppropriateness;
  console.log(`\n  2. LEVEL APPROPRIATENESS (${la.issueCount} issues)`);
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Total nodes: ${la.totalNodes}`);
  if (la.issues.length > 0) {
    for (const i of la.issues) console.log(`    - ${i}`);
  } else {
    console.log(`    All OK`);
  }

  // Tags
  const ta = audit.sections.tagAccuracy;
  console.log(`\n  3. TAG ACCURACY (${ta.issueCount} issues)`);
  console.log(`  ${'─'.repeat(50)}`);
  for (const [t, c] of Object.entries(ta.tagCounts)) {
    console.log(`    ${t}: ${c} cards (${Math.round(c/audit.totalCards*100)}%)`);
  }
  if (ta.issues.length > 0) {
    console.log(`  Issues:`);
    for (const i of ta.issues) console.log(`    - ${i}`);
  }

  // Vocab
  const ev = audit.sections.essentialVocab;
  console.log(`\n  4. ESSENTIAL VOCAB COVERAGE (${ev.issueCount} issues)`);
  console.log(`  ${'─'.repeat(50)}`);
  for (const [cat, d] of Object.entries(ev.coverage)) {
    const icon = d.status === 'PASS' ? 'PASS' : 'FAIL';
    console.log(`    [${icon}] ${cat.padEnd(15)} ${d.found}/${d.total} found (need ${d.minimum})${d.missingTerms.length > 0 ? ' | missing: ' + d.missingTerms.join(', ') : ''}`);
  }

  // Transitions
  const nt = audit.sections.nodeTransition;
  console.log(`\n  5. NODE TRANSITION LOGIC (${nt.issueCount} issues)`);
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Tip density per node:`);
  for (const [n, d] of Object.entries(nt.tipDensity)) {
    const bar = '#'.repeat(Math.round(d.pct / 3));
    console.log(`    ${n}: ${String(d.pct).padStart(3)}% (${d.withTips}/${d.total}) ${bar}`);
  }
  if (nt.issues.length > 0) {
    console.log(`  Issues:`);
    for (const i of nt.issues) console.log(`    - ${i}`);
  }

  if (nt.duplicateTargets && nt.duplicateTargets.length > 0) {
    console.log(`\n  Sample duplicate targets (first 5):`);
    for (const d of nt.duplicateTargets.slice(0, 5)) {
      console.log(`    ${d.id1} / ${d.id2}: "${d.sentence.substring(0, 60)}"`);
    }
  }

  console.log(`\n${'='.repeat(70)}\n`);
}

// Main
const cyDeck = JSON.parse(fs.readFileSync(CY_DECK, 'utf-8'));
const hiDeck = JSON.parse(fs.readFileSync(HI_DECK, 'utf-8'));

const cyAudit = auditDeck(cyDeck, 'welsh');
const hiAudit = auditDeck(hiDeck, 'hindi');

// Write outputs
fs.writeFileSync(path.join(OUTPUT_DIR, 'audit-cy-structural.json'), JSON.stringify(cyAudit, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'audit-hi-structural.json'), JSON.stringify(hiAudit, null, 2));

printSummary(cyAudit);
printSummary(hiAudit);

console.log(`\nAudit files written to:`);
console.log(`  scripts/output/audit-cy-structural.json`);
console.log(`  scripts/output/audit-hi-structural.json`);
