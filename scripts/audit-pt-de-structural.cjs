#!/usr/bin/env node
/**
 * Comprehensive structural audit of Portuguese and German decks.
 * Checks: priority balance, level appropriateness, tag accuracy,
 * essential vocab coverage, node transition logic.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(__dirname, 'output');

function loadDeck(lang) {
  const p = path.join(ROOT, 'src', 'data', lang, 'deck.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Essential vocabulary categories with expected terms
const ESSENTIAL_VOCAB = {
  numbers: {
    pt: ['um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','zero','cem','mil','vinte','trinta','onze','doze'],
    de: ['eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','null','hundert','tausend','zwanzig','dreißig','elf','zwölf']
  },
  colors: {
    pt: ['vermelho','azul','verde','amarelo','preto','branco','rosa','laranja','roxo','cinza','marrom'],
    de: ['rot','blau','grün','gelb','schwarz','weiß','rosa','orange','lila','grau','braun']
  },
  directions: {
    pt: ['esquerda','direita','frente','trás','norte','sul','leste','oeste','cima','baixo'],
    de: ['links','rechts','geradeaus','Norden','Süden','Osten','Westen','oben','unten','vorne','hinten']
  },
  body_parts: {
    pt: ['cabeça','mão','braço','perna','olho','nariz','boca','orelha','dedo','pé','coração','costas','ombro','joelho'],
    de: ['Kopf','Hand','Arm','Bein','Auge','Nase','Mund','Ohr','Finger','Fuß','Herz','Rücken','Schulter','Knie']
  },
  animals: {
    pt: ['gato','cachorro','pássaro','peixe','cavalo','vaca','porco','galinha','rato','coelho'],
    de: ['Katze','Hund','Vogel','Fisch','Pferd','Kuh','Schwein','Huhn','Maus','Kaninchen','Hase']
  },
  family: {
    pt: ['mãe','pai','filho','filha','irmão','irmã','avó','avô','tio','tia','primo','prima','marido','esposa'],
    de: ['Mutter','Vater','Sohn','Tochter','Bruder','Schwester','Großmutter','Großvater','Onkel','Tante','Cousin','Cousine','Ehemann','Ehefrau','Mann','Frau']
  },
  days: {
    pt: ['segunda','terça','quarta','quinta','sexta','sábado','domingo','hoje','amanhã','ontem','semana','mês','ano'],
    de: ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag','heute','morgen','gestern','Woche','Monat','Jahr']
  },
  food: {
    pt: ['pão','água','leite','café','arroz','carne','frango','peixe','fruta','queijo','ovo','sal','açúcar','cerveja','vinho'],
    de: ['Brot','Wasser','Milch','Kaffee','Reis','Fleisch','Hähnchen','Fisch','Obst','Käse','Ei','Salz','Zucker','Bier','Wein']
  },
  basic_phrases: {
    pt: ['obrigado','por favor','desculpe','bom dia','boa noite','como vai','tchau','sim','não','ajuda','quanto','onde','quando'],
    de: ['danke','bitte','Entschuldigung','guten Morgen','gute Nacht','wie geht','tschüss','ja','nein','Hilfe','wie viel','wo','wann']
  }
};

// Expected node progression (grammar complexity)
const NODE_PROGRESSION = [
  { node: 'node-01', level: 'A1', desc: 'Basic present tense / greetings' },
  { node: 'node-02', level: 'A1', desc: 'Articles / gender basics' },
  { node: 'node-03', level: 'A1', desc: 'Plurals / basic nouns' },
  { node: 'node-04', level: 'A1', desc: 'Adjective agreement' },
  { node: 'node-05', level: 'A1', desc: 'Common prepositions' },
  { node: 'node-06', level: 'A1', desc: 'Question formation' },
  { node: 'node-07', level: 'A1', desc: 'Negation' },
  { node: 'node-08', level: 'A1', desc: 'Possessives' },
  { node: 'node-09', level: 'A1', desc: 'Basic past tense' },
  { node: 'node-10', level: 'A1-A2', desc: 'Irregular verbs' },
  { node: 'node-11', level: 'A2', desc: 'Reflexive verbs' },
  { node: 'node-12', level: 'A2', desc: 'Object pronouns' },
  { node: 'node-13', level: 'A2', desc: 'Comparatives/superlatives' },
  { node: 'node-14', level: 'A2', desc: 'Future tense' },
  { node: 'node-15', level: 'A2', desc: 'Conditional' },
  { node: 'node-16', level: 'A2', desc: 'Imperfect' },
  { node: 'node-17', level: 'A2-B1', desc: 'Compound tenses' },
  { node: 'node-18', level: 'B1', desc: 'Subjunctive basics' },
  { node: 'node-19', level: 'B1', desc: 'Relative clauses' },
  { node: 'node-20', level: 'B1', desc: 'Passive voice' },
  { node: 'node-21', level: 'B1', desc: 'Conjunctions/connectors' },
  { node: 'node-22', level: 'B1', desc: 'Reported speech' },
  { node: 'node-23', level: 'B1', desc: 'Advanced prepositions' },
  { node: 'node-24', level: 'B1', desc: 'Idiomatic expressions' },
  { node: 'node-25', level: 'B1-B2', desc: 'Complex sentences' },
  { node: 'node-26', level: 'B2', desc: 'Advanced subjunctive' },
  { node: 'node-27', level: 'B2', desc: 'Formal register' },
  { node: 'node-28', level: 'B2', desc: 'Advanced vocabulary' },
  { node: 'node-29', level: 'B2', desc: 'Literary/cultural' },
  { node: 'node-30', level: 'B2', desc: 'Technical language' },
  { node: 'node-31', level: 'B2-C1', desc: 'Nuanced expression' },
  { node: 'node-32', level: 'C1', desc: 'Advanced grammar' },
  { node: 'node-33', level: 'C1', desc: 'Stylistic variety' },
  { node: 'node-34', level: 'C1', desc: 'Academic register' },
  { node: 'node-35', level: 'C1', desc: 'Mastery' },
];

function auditDeck(deck, langCode, langName) {
  const result = {
    language: langName,
    langCode,
    totalCards: deck.length,
    timestamp: new Date().toISOString(),
    sections: {}
  };

  // ========== 1. PRIORITY BALANCE PER NODE ==========
  const nodeMap = {};
  for (const card of deck) {
    const node = card.grammarNode;
    if (!nodeMap[node]) nodeMap[node] = { total: 0, priorities: {}, cards: [], tags: {} };
    nodeMap[node].total++;
    const p = card.priority || 0;
    nodeMap[node].priorities[p] = (nodeMap[node].priorities[p] || 0) + 1;
    nodeMap[node].cards.push(card);
    for (const t of (card.tags || [])) {
      nodeMap[node].tags[t] = (nodeMap[node].tags[t] || 0) + 1;
    }
  }

  const priorityBalance = {};
  const priorityIssues = [];
  const allNodes = Object.keys(nodeMap).sort();

  for (const node of allNodes) {
    const info = nodeMap[node];
    const pDist = info.priorities;
    priorityBalance[node] = {
      total: info.total,
      priorities: pDist,
    };

    // Check: p1 should be ~40-50% for early nodes, acceptable range 25-60%
    const p1Count = pDist[1] || 0;
    const p1Pct = (p1Count / info.total * 100).toFixed(1);
    priorityBalance[node].p1Pct = parseFloat(p1Pct);

    if (p1Count < info.total * 0.15) {
      priorityIssues.push({ node, issue: `Very few P1 cards: ${p1Count}/${info.total} (${p1Pct}%)` });
    }
    if (p1Count > info.total * 0.70) {
      priorityIssues.push({ node, issue: `Too many P1 cards: ${p1Count}/${info.total} (${p1Pct}%)` });
    }

    // Check if any priority is missing entirely
    const expectedPriorities = [1, 2, 3];
    for (const ep of expectedPriorities) {
      if (!pDist[ep]) {
        priorityIssues.push({ node, issue: `Missing priority ${ep} entirely` });
      }
    }
  }

  result.sections.priorityBalance = {
    perNode: priorityBalance,
    issues: priorityIssues,
    summary: `${allNodes.length} nodes, ${priorityIssues.length} priority issues found`
  };

  // ========== 2. LEVEL APPROPRIATENESS ==========
  const levelIssues = [];

  for (const node of allNodes) {
    const info = nodeMap[node];
    const nodeNum = parseInt(node.replace('node-', ''));

    // Check card count: expect roughly 3933/35 ≈ 112 per node, flag if < 15 or very uneven
    if (info.total < 15) {
      levelIssues.push({ node, issue: `Too few cards: ${info.total} (minimum 15)` });
    }

    // For nodes 15+, check if sentences are complex enough (word count as proxy)
    if (nodeNum >= 15) {
      const avgWords = info.cards.reduce((sum, c) => sum + c.target.split(/\s+/).length, 0) / info.total;
      if (avgWords < 5) {
        levelIssues.push({ node, issue: `Avg word count too low for advanced node: ${avgWords.toFixed(1)} words` });
      }
    }

    // For early nodes (1-5), check if sentences are not too complex
    if (nodeNum <= 5) {
      const avgWords = info.cards.reduce((sum, c) => sum + c.target.split(/\s+/).length, 0) / info.total;
      if (avgWords > 12) {
        levelIssues.push({ node, issue: `Avg word count possibly too high for beginner node: ${avgWords.toFixed(1)} words` });
      }
    }

    // Check that later nodes have longer sentences on average than earlier ones
    // (sampled spot check)
  }

  // Word count progression across nodes
  const wordCountProgression = {};
  for (const node of allNodes) {
    const info = nodeMap[node];
    const avgWords = info.cards.reduce((sum, c) => sum + c.target.split(/\s+/).length, 0) / info.total;
    wordCountProgression[node] = parseFloat(avgWords.toFixed(1));
  }

  result.sections.levelAppropriateness = {
    cardCountPerNode: Object.fromEntries(allNodes.map(n => [n, nodeMap[n].total])),
    wordCountProgression,
    issues: levelIssues,
    summary: `${levelIssues.length} level appropriateness issues found`
  };

  // ========== 3. TAG ACCURACY ==========
  const tagCounts = {};
  const tagIssues = [];

  for (const card of deck) {
    for (const t of (card.tags || [])) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
    if (!card.tags || card.tags.length === 0) {
      tagIssues.push({ id: card.id, issue: 'No tags' });
    }
    if (card.tags && !card.tags.includes('general')) {
      // Not necessarily an issue, but track
    }
  }

  const expectedTags = ['general', 'travel', 'work', 'family'];
  for (const t of expectedTags) {
    const count = tagCounts[t] || 0;
    if (count < 50) {
      tagIssues.push({ tag: t, issue: `Tag '${t}' has only ${count} cards (expected >= 50)` });
    }
  }

  // Check per-node tag distribution
  const tagPerNode = {};
  for (const node of allNodes) {
    tagPerNode[node] = nodeMap[node].tags;
  }

  // Check for cards missing 'general' tag but having other tags
  let missingGeneral = 0;
  for (const card of deck) {
    if (card.tags && card.tags.length > 0 && !card.tags.includes('general')) {
      missingGeneral++;
    }
  }

  result.sections.tagAccuracy = {
    totalCounts: tagCounts,
    perNode: tagPerNode,
    missingGeneralTag: missingGeneral,
    noTagCards: tagIssues.filter(i => i.issue === 'No tags').length,
    issues: tagIssues.filter(i => i.tag), // only tag-level issues
    summary: `Tags: ${JSON.stringify(tagCounts)}. ${tagIssues.length} issues.`
  };

  // ========== 4. ESSENTIAL VOCAB COVERAGE ==========
  const allText = deck.map(c => c.target + ' ' + c.english).join(' ').toLowerCase();
  const vocabCoverage = {};

  for (const [category, terms] of Object.entries(ESSENTIAL_VOCAB)) {
    const langTerms = terms[langCode] || [];
    const found = [];
    const missing = [];

    for (const term of langTerms) {
      // Case-insensitive search in all card text
      const termLower = term.toLowerCase();
      if (allText.includes(termLower)) {
        found.push(term);
      } else {
        missing.push(term);
      }
    }

    vocabCoverage[category] = {
      total: langTerms.length,
      found: found.length,
      missing: missing.length,
      foundTerms: found,
      missingTerms: missing,
      coveragePct: langTerms.length > 0 ? parseFloat((found.length / langTerms.length * 100).toFixed(1)) : 0
    };
  }

  result.sections.essentialVocab = {
    categories: vocabCoverage,
    summary: Object.entries(vocabCoverage).map(([cat, info]) =>
      `${cat}: ${info.found}/${info.total} (${info.coveragePct}%) — missing: [${info.missingTerms.join(', ')}]`
    ).join('\n')
  };

  // ========== 5. NODE TRANSITION LOGIC ==========
  const transitionIssues = [];

  // Check that nodes are contiguous
  const nodeNums = allNodes.map(n => parseInt(n.replace('node-', ''))).sort((a, b) => a - b);
  for (let i = 0; i < nodeNums.length - 1; i++) {
    if (nodeNums[i + 1] - nodeNums[i] > 1) {
      transitionIssues.push({ issue: `Gap between node-${String(nodeNums[i]).padStart(2,'0')} and node-${String(nodeNums[i+1]).padStart(2,'0')}` });
    }
  }

  // Check that word count generally increases
  const sortedNodes = allNodes.sort();
  for (let i = 1; i < sortedNodes.length; i++) {
    const prevAvg = wordCountProgression[sortedNodes[i-1]];
    const currAvg = wordCountProgression[sortedNodes[i]];
    // Allow some variance but flag large drops
    if (currAvg < prevAvg - 2 && parseInt(sortedNodes[i].replace('node-','')) > 10) {
      transitionIssues.push({
        issue: `Word count drops from ${sortedNodes[i-1]} (${prevAvg}) to ${sortedNodes[i]} (${currAvg})`
      });
    }
  }

  // Check that P1 density decreases in later nodes (harder content = fewer essentials)
  // This is a soft check
  const earlyP1 = [];
  const lateP1 = [];
  for (const node of allNodes) {
    const num = parseInt(node.replace('node-', ''));
    const p1Pct = (nodeMap[node].priorities[1] || 0) / nodeMap[node].total;
    if (num <= 10) earlyP1.push(p1Pct);
    if (num >= 25) lateP1.push(p1Pct);
  }
  const avgEarlyP1 = earlyP1.reduce((a, b) => a + b, 0) / earlyP1.length;
  const avgLateP1 = lateP1.length > 0 ? lateP1.reduce((a, b) => a + b, 0) / lateP1.length : 0;

  // Check grammar tip coverage per node
  const tipCoverage = {};
  for (const node of allNodes) {
    const withTips = nodeMap[node].cards.filter(c => c.grammar).length;
    tipCoverage[node] = {
      total: nodeMap[node].total,
      withTips,
      tipPct: parseFloat((withTips / nodeMap[node].total * 100).toFixed(1))
    };
  }

  result.sections.nodeTransition = {
    nodeRange: `node-${String(nodeNums[0]).padStart(2,'0')} to node-${String(nodeNums[nodeNums.length-1]).padStart(2,'0')}`,
    totalNodes: allNodes.length,
    avgEarlyP1Pct: parseFloat((avgEarlyP1 * 100).toFixed(1)),
    avgLateP1Pct: parseFloat((avgLateP1 * 100).toFixed(1)),
    tipCoverage,
    issues: transitionIssues,
    summary: `${transitionIssues.length} transition issues. Early P1: ${(avgEarlyP1*100).toFixed(1)}%, Late P1: ${(avgLateP1*100).toFixed(1)}%`
  };

  // ========== OVERALL SUMMARY ==========
  const totalIssues = priorityIssues.length + levelIssues.length +
    tagIssues.filter(i => i.tag).length + transitionIssues.length;

  result.overallSummary = {
    totalCards: deck.length,
    totalNodes: allNodes.length,
    totalIssues,
    breakdown: {
      priorityIssues: priorityIssues.length,
      levelIssues: levelIssues.length,
      tagIssues: tagIssues.filter(i => i.tag).length,
      transitionIssues: transitionIssues.length
    }
  };

  return result;
}

function printSummary(audit) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  STRUCTURAL AUDIT: ${audit.language.toUpperCase()} (${audit.langCode})`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Total cards: ${audit.totalCards}`);
  console.log(`Total nodes: ${audit.overallSummary.totalNodes}`);
  console.log(`Total issues: ${audit.overallSummary.totalIssues}`);

  // 1. Priority
  console.log(`\n--- 1. PRIORITY BALANCE ---`);
  const pb = audit.sections.priorityBalance;
  console.log(`Issues: ${pb.issues.length}`);
  for (const node of Object.keys(pb.perNode).sort()) {
    const n = pb.perNode[node];
    const pStr = Object.entries(n.priorities).sort(([a],[b]) => a-b).map(([k,v]) => `P${k}:${v}`).join(' ');
    console.log(`  ${node}: ${n.total} cards — ${pStr} (P1: ${n.p1Pct}%)`);
  }
  if (pb.issues.length > 0) {
    console.log(`  ISSUES:`);
    for (const i of pb.issues) console.log(`    ⚠ ${i.node}: ${i.issue}`);
  }

  // 2. Level
  console.log(`\n--- 2. LEVEL APPROPRIATENESS ---`);
  const la = audit.sections.levelAppropriateness;
  console.log(`Issues: ${la.issues.length}`);
  console.log(`  Card counts: min=${Math.min(...Object.values(la.cardCountPerNode))}, max=${Math.max(...Object.values(la.cardCountPerNode))}, avg=${(audit.totalCards / audit.overallSummary.totalNodes).toFixed(0)}`);
  console.log(`  Word count progression (selected):`);
  const wcNodes = Object.keys(la.wordCountProgression).sort();
  for (const n of [wcNodes[0], wcNodes[4], wcNodes[9], wcNodes[14], wcNodes[19], wcNodes[24], wcNodes[29], wcNodes[wcNodes.length-1]].filter(Boolean)) {
    console.log(`    ${n}: ${la.wordCountProgression[n]} avg words`);
  }
  if (la.issues.length > 0) {
    for (const i of la.issues) console.log(`    ⚠ ${i.node}: ${i.issue}`);
  }

  // 3. Tags
  console.log(`\n--- 3. TAG ACCURACY ---`);
  const ta = audit.sections.tagAccuracy;
  console.log(`  Tag counts: ${JSON.stringify(ta.totalCounts)}`);
  console.log(`  Cards missing 'general' tag: ${ta.missingGeneralTag}`);
  console.log(`  Cards with no tags: ${ta.noTagCards}`);
  if (ta.issues.length > 0) {
    for (const i of ta.issues) console.log(`    ⚠ ${i.issue}`);
  }

  // 4. Essential vocab
  console.log(`\n--- 4. ESSENTIAL VOCAB COVERAGE ---`);
  const ev = audit.sections.essentialVocab;
  for (const [cat, info] of Object.entries(ev.categories)) {
    const status = info.coveragePct === 100 ? 'OK' : info.coveragePct >= 70 ? 'PARTIAL' : 'LOW';
    console.log(`  ${cat}: ${info.found}/${info.total} (${info.coveragePct}%) [${status}]`);
    if (info.missingTerms.length > 0) {
      console.log(`    Missing: ${info.missingTerms.join(', ')}`);
    }
  }

  // 5. Node transition
  console.log(`\n--- 5. NODE TRANSITION LOGIC ---`);
  const nt = audit.sections.nodeTransition;
  console.log(`  Range: ${nt.nodeRange} (${nt.totalNodes} nodes)`);
  console.log(`  Early nodes avg P1: ${nt.avgEarlyP1Pct}%`);
  console.log(`  Late nodes avg P1: ${nt.avgLateP1Pct}%`);

  // Tip coverage summary
  const tipNodes = Object.keys(nt.tipCoverage).sort();
  const tipPcts = tipNodes.map(n => nt.tipCoverage[n].tipPct);
  console.log(`  Grammar tip coverage: min=${Math.min(...tipPcts).toFixed(1)}%, max=${Math.max(...tipPcts).toFixed(1)}%, avg=${(tipPcts.reduce((a,b)=>a+b,0)/tipPcts.length).toFixed(1)}%`);

  if (nt.issues.length > 0) {
    for (const i of nt.issues) console.log(`    ⚠ ${i.issue}`);
  }

  console.log(`\n${'='.repeat(70)}\n`);
}

// Run audits
const ptDeck = loadDeck('portuguese');
const deDeck = loadDeck('german');

const ptAudit = auditDeck(ptDeck, 'pt', 'Portuguese');
const deAudit = auditDeck(deDeck, 'de', 'German');

// Write output files
fs.writeFileSync(
  path.join(OUTPUT, 'audit-pt-structural.json'),
  JSON.stringify(ptAudit, null, 2)
);
fs.writeFileSync(
  path.join(OUTPUT, 'audit-de-structural.json'),
  JSON.stringify(deAudit, null, 2)
);

console.log('Audit files written:');
console.log(`  ${path.join(OUTPUT, 'audit-pt-structural.json')}`);
console.log(`  ${path.join(OUTPUT, 'audit-de-structural.json')}`);

printSummary(ptAudit);
printSummary(deAudit);
