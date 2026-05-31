/**
 * Curriculum Coherence Analysis
 * Analyzes within-node coherence, between-node progression,
 * grammar concept coverage, and vocabulary recycling across all 11 languages.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'src', 'data');
const LANGUAGES = [
  'spanish', 'italian', 'french', 'portuguese',
  'german', 'dutch', 'swedish', 'welsh',
  'hindi', 'turkish', 'russian'
];

const SAMPLED_NODES = ['node-01', 'node-05', 'node-10', 'node-15', 'node-20', 'node-25', 'node-30', 'node-35'];
const ALL_NODES = Array.from({ length: 35 }, (_, i) => `node-${String(i + 1).padStart(2, '0')}`);

// Node definitions from topicConfig.ts
const NODE_DEFS = {
  spanish: {
    'node-01': 'Regular present tense', 'node-02': 'Irregular present verbs',
    'node-03': 'Ser vs estar', 'node-04': 'Common questions',
    'node-05': 'Articles & gender', 'node-06': 'Gustar & similar',
    'node-07': 'Descriptions & adjectives', 'node-08': 'Common expressions',
    'node-09': 'Preterite: regular', 'node-10': 'Preterite: irregular',
    'node-11': 'Imperfect', 'node-12': 'Past contrast',
    'node-13': 'Reflexive verbs', 'node-14': 'Por vs para',
    'node-15': 'Object pronouns', 'node-16': 'Present subjunctive',
    'node-17': 'Commands', 'node-18': 'Conditional',
    'node-19': 'Future tense', 'node-20': 'Relative clauses',
    'node-21': 'Perfect & compound tenses', 'node-22': 'Imperfect subjunctive',
    'node-23': 'Complex conditionals', 'node-24': 'Passive & impersonal',
    'node-25': 'Advanced connectors', 'node-26': 'Verb phrases',
    'node-27': 'Reported speech', 'node-28': 'Subjunctive nuances',
    'node-29': 'Register & style', 'node-30': 'Idiomatic fluency',
    'node-31': 'Complex syntax', 'node-32': 'Literary tenses',
    'node-33': 'Academic discourse', 'node-34': 'Cultural fluency',
    'node-35': 'Advanced mastery'
  },
  german: {
    'node-01': 'Personal pronouns & present tense', 'node-02': 'Present tense regular verbs',
    'node-03': 'Sein vs haben', 'node-04': 'Articles & gender (der/die/das)',
    'node-05': 'Word order (V2 rule)', 'node-06': 'Accusative case',
    'node-07': 'Descriptions & adjectives', 'node-08': 'Separable verbs',
    'node-09': 'Perfekt (present perfect)', 'node-10': 'Dative case',
    'node-11': 'Modal verbs', 'node-12': 'Prateritum (simple past)',
    'node-13': 'Negation (nicht vs kein)', 'node-14': 'Wechselprapositionen',
    'node-15': 'Pronouns & reflexive verbs', 'node-16': 'Comparatives & superlatives',
    'node-17': 'Temporal expressions & conjunctions', 'node-18': 'Subordinate clauses (verb-final)',
    'node-19': 'Imperative', 'node-20': 'Adjective endings',
    'node-21': 'Genitive case', 'node-22': 'Relative clauses',
    'node-23': 'Passive voice', 'node-24': 'Konjunktiv II',
    'node-25': 'Indirect speech (Konjunktiv I)', 'node-26': 'Infinitive constructions',
    'node-27': 'Advanced connectors', 'node-28': 'Noun compounds',
    'node-29': 'Extended adjective constructions', 'node-30': 'Double infinitive & verb chains',
    'node-31': 'Formal writing & register', 'node-32': 'Idiomatic expressions',
    'node-33': 'Advanced subjunctive', 'node-34': 'Academic & professional German',
    'node-35': 'Nuance & modal particles'
  },
  hindi: {
    'node-01': 'Personal pronouns & present habitual', 'node-02': 'Present habitual tense',
    'node-03': 'Honaa vs karnaa (to be vs to do)', 'node-04': 'Gender & postpositions',
    'node-05': 'Numerals & oblique case', 'node-06': 'Accusative/dative (ko construction)',
    'node-07': 'Adjective agreement (gender/number)', 'node-08': 'Common expressions',
    'node-09': 'Simple past tense', 'node-10': 'Present continuous',
    'node-11': 'Modal verbs (saknaa/chaahiye)', 'node-12': 'Reflexive verbs',
    'node-13': 'Negation (nahiin/mat/na)', 'node-14': 'Postpositions (mein/par/ko/se)',
    'node-15': 'Adjective agreement & comparison', 'node-16': 'Past habitual tense',
    'node-17': 'Compound postpositions', 'node-18': 'Subordinate clauses (ki/jo/jab)',
    'node-19': 'Imperative (tuu/tum/aap)', 'node-20': 'Compound verbs',
    'node-21': 'Relative clauses (jo...vo)', 'node-22': 'Passive voice',
    'node-23': 'Ergative case (ne construction)', 'node-24': 'Future tense',
    'node-25': 'Advanced connectors', 'node-26': 'Conjunct verbs',
    'node-27': 'Reported speech', 'node-28': 'Idiomatic expressions',
    'node-29': 'Formal vs informal register', 'node-30': 'Sanskritized vs Persianized Hindi',
    'node-31': 'Complex sentence structures', 'node-32': 'Literary & written Hindi',
    'node-33': 'Academic discourse', 'node-34': 'Cultural fluency',
    'node-35': 'Advanced mixed mastery'
  },
  turkish: {
    'node-01': 'Personal pronouns & present tense', 'node-02': 'Present continuous (-yor)',
    'node-03': 'Var/yok (there is/there isnt)', 'node-04': 'Vowel harmony basics',
    'node-05': 'Nominative & accusative cases', 'node-06': 'Questions & interrogatives',
    'node-07': 'Adjectives & descriptions', 'node-08': 'Common expressions',
    'node-09': 'Simple past (-di/-di)', 'node-10': 'Aorist (general truths)',
    'node-11': 'Modal suffixes (-ebil/-abil)', 'node-12': 'Reflexive verbs & reciprocals',
    'node-13': 'Negation (-me/-ma)', 'node-14': 'Locative & ablative cases',
    'node-15': 'Adjectives & comparisons', 'node-16': 'Reported past (-mis/-mis)',
    'node-17': 'Dative case (-e/-a)', 'node-18': 'Subordinate clauses (-digi/-digi)',
    'node-19': 'Imperative & optative', 'node-20': 'Accusative & dative cases',
    'node-21': 'Relative clauses (-en/-an)', 'node-22': 'Passive voice (-il/-in)',
    'node-23': 'Causative (-dir/-tir)', 'node-24': 'Future tense (-ecek/-acak)',
    'node-25': 'Advanced connectors', 'node-26': 'Noun compounds (izafet)',
    'node-27': 'Reported speech', 'node-28': 'Idiomatic expressions',
    'node-29': 'Formal vs informal register', 'node-30': 'Word formation (suffixes)',
    'node-31': 'Complex sentence structures', 'node-32': 'Literary & written Turkish',
    'node-33': 'Academic discourse', 'node-34': 'Cultural fluency',
    'node-35': 'Advanced mixed mastery'
  },
  russian: {
    'node-01': 'Personal pronouns & present tense', 'node-02': 'Present tense (2nd conjugation)',
    'node-03': 'Byt & est (to be)', 'node-04': 'Gender & nominative case',
    'node-05': 'Numerals & genitive with numbers', 'node-06': 'Accusative case',
    'node-07': 'Adjective agreement', 'node-08': 'Common expressions',
    'node-09': 'Past tense (l-forms)', 'node-10': 'Present tense (2nd conjugation)',
    'node-11': 'Modal verbs', 'node-12': 'Reflexive verbs',
    'node-13': 'Negation', 'node-14': 'Prepositional case',
    'node-15': 'Adjective agreement & comparison', 'node-16': 'Accusative case (advanced)',
    'node-17': 'Dative case', 'node-18': 'Instrumental case',
    'node-19': 'Imperative mood', 'node-20': 'Genitive case',
    'node-21': 'Relative clauses', 'node-22': 'Instrumental case (advanced)',
    'node-23': 'Verbal aspect', 'node-24': 'Future tense',
    'node-25': 'Advanced connectors', 'node-26': 'Verbs of motion',
    'node-27': 'Reported speech', 'node-28': 'Idiomatic expressions',
    'node-29': 'Formal vs informal register', 'node-30': 'Participles & verbal adjectives',
    'node-31': 'Complex sentence structures', 'node-32': 'Literary & written Russian',
    'node-33': 'Academic discourse', 'node-34': 'Cultural fluency',
    'node-35': 'Advanced mixed mastery'
  }
};

// Copy Romance defaults for missing languages
['italian', 'french', 'portuguese'].forEach(lang => {
  if (!NODE_DEFS[lang]) NODE_DEFS[lang] = { ...NODE_DEFS.spanish };
});
['dutch', 'swedish'].forEach(lang => {
  if (!NODE_DEFS[lang]) NODE_DEFS[lang] = { ...NODE_DEFS.german };
});
if (!NODE_DEFS.welsh) {
  NODE_DEFS.welsh = {};
  for (let i = 1; i <= 35; i++) {
    const key = `node-${String(i).padStart(2, '0')}`;
    NODE_DEFS.welsh[key] = key; // placeholder
  }
}

function loadDeck(lang) {
  const deckPath = path.join(BASE, lang, 'deck.json');
  try {
    return JSON.parse(fs.readFileSync(deckPath, 'utf-8'));
  } catch (e) {
    console.error(`Failed to load ${deckPath}: ${e.message}`);
    return [];
  }
}

// Extract words from an English sentence
function extractWords(sentence) {
  return sentence.toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'his', 'how', 'its',
  'may', 'new', 'now', 'old', 'see', 'way', 'who', 'did', 'get', 'let',
  'say', 'she', 'too', 'use', 'with', 'this', 'that', 'from', 'they',
  'been', 'will', 'each', 'make', 'like', 'long', 'look', 'many', 'some',
  'than', 'them', 'then', 'were', 'what', 'when', 'your', 'into', 'does',
  "don't", "doesn't", "isn't", "aren't", "won't", "can't", "didn't"
]);

// Extract words from a target-language sentence (basic tokenization)
function extractTargetWords(sentence) {
  return sentence.toLowerCase()
    .replace(/[^\p{L}\s'-]/gu, '')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function analyzeWithinNodeCoherence(cards, nodeId, lang) {
  const nodeCards = cards.filter(c => c.grammarNode === nodeId);
  if (nodeCards.length === 0) return null;

  const expectedGrammar = NODE_DEFS[lang]?.[nodeId] || 'Unknown';
  const cardsWithTips = nodeCards.filter(c => c.grammar);
  const tipRate = cardsWithTips.length / nodeCards.length;

  // Check sentence variety (unique target sentences)
  const uniqueTargets = new Set(nodeCards.map(c => c.target));
  const uniquenessRate = uniqueTargets.size / nodeCards.length;

  // Check English variety
  const uniqueEnglish = new Set(nodeCards.map(c => c.english));
  const englishUniqueness = uniqueEnglish.size / nodeCards.length;

  // Analyze vocabulary coverage within node
  const allTargetWords = nodeCards.flatMap(c => extractTargetWords(c.target));
  const uniqueTargetVocab = new Set(allTargetWords);
  const wordFreq = {};
  allTargetWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const mostCommon = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Check if grammar tips match node topic (keyword-based heuristic)
  const topicKeywords = expectedGrammar.toLowerCase().split(/[\s&,/()]+/).filter(w => w.length > 2);
  let tipRelevanceCount = 0;
  cardsWithTips.forEach(c => {
    const tipLower = c.grammar.toLowerCase();
    if (topicKeywords.some(kw => tipLower.includes(kw))) {
      tipRelevanceCount++;
    }
  });
  const tipRelevance = cardsWithTips.length > 0 ? tipRelevanceCount / cardsWithTips.length : 0;

  // Check progressive complexity: are later cards longer / more complex?
  const firstHalf = nodeCards.slice(0, Math.floor(nodeCards.length / 2));
  const secondHalf = nodeCards.slice(Math.floor(nodeCards.length / 2));
  const avgLenFirst = firstHalf.reduce((s, c) => s + c.target.length, 0) / firstHalf.length;
  const avgLenSecond = secondHalf.reduce((s, c) => s + c.target.length, 0) / secondHalf.length;

  // Check vocabulary reuse within node (words appearing 2+ times)
  const reusedWords = Object.values(wordFreq).filter(f => f >= 2).length;
  const reuseRate = uniqueTargetVocab.size > 0 ? reusedWords / uniqueTargetVocab.size : 0;

  // Sample cards for qualitative review
  const sampleCards = nodeCards.slice(0, 3).concat(nodeCards.slice(-3)).map(c => ({
    target: c.target,
    english: c.english,
    grammar: c.grammar || null
  }));

  return {
    nodeId,
    expectedGrammar,
    totalCards: nodeCards.length,
    tipRate: Math.round(tipRate * 100),
    tipRelevance: Math.round(tipRelevance * 100),
    uniquenessRate: Math.round(uniquenessRate * 100),
    englishUniqueness: Math.round(englishUniqueness * 100),
    uniqueTargetVocab: uniqueTargetVocab.size,
    vocabReuseRate: Math.round(reuseRate * 100),
    avgSentenceLenFirst: Math.round(avgLenFirst),
    avgSentenceLenSecond: Math.round(avgLenSecond),
    progressiveComplexity: avgLenSecond > avgLenFirst,
    mostCommonWords: mostCommon.slice(0, 5).map(([w, f]) => `${w}(${f})`),
    sampleCards
  };
}

function analyzeVocabRecycling(cards) {
  // Group cards by node
  const byNode = {};
  ALL_NODES.forEach(n => { byNode[n] = []; });
  cards.forEach(c => {
    if (byNode[c.grammarNode]) byNode[c.grammarNode].push(c);
  });

  // Extract vocab by node range
  function vocabForRange(startNode, endNode) {
    const vocab = new Set();
    const startIdx = ALL_NODES.indexOf(startNode);
    const endIdx = ALL_NODES.indexOf(endNode);
    for (let i = startIdx; i <= endIdx; i++) {
      (byNode[ALL_NODES[i]] || []).forEach(c => {
        extractTargetWords(c.target).forEach(w => vocab.add(w));
      });
    }
    return vocab;
  }

  // Rate 1: % of nodes 01-05 vocab that reappears in 06-15
  const earlyVocab = vocabForRange('node-01', 'node-05');
  const midVocab = vocabForRange('node-06', 'node-15');
  let earlyInMid = 0;
  earlyVocab.forEach(w => { if (midVocab.has(w)) earlyInMid++; });
  const recycleEarlyToMid = earlyVocab.size > 0 ? Math.round((earlyInMid / earlyVocab.size) * 100) : 0;

  // Rate 2: % of nodes 01-10 vocab that reappears in 11-20
  const first10Vocab = vocabForRange('node-01', 'node-10');
  const second10Vocab = vocabForRange('node-11', 'node-20');
  let first10InSecond = 0;
  first10Vocab.forEach(w => { if (second10Vocab.has(w)) first10InSecond++; });
  const recycleFirst10ToSecond = first10Vocab.size > 0 ? Math.round((first10InSecond / first10Vocab.size) * 100) : 0;

  // Rate 3: % of nodes 01-15 vocab in 16-35
  const first15Vocab = vocabForRange('node-01', 'node-15');
  const laterVocab = vocabForRange('node-16', 'node-35');
  let first15InLater = 0;
  first15Vocab.forEach(w => { if (laterVocab.has(w)) first15InLater++; });
  const recycleFirst15ToLater = first15Vocab.size > 0 ? Math.round((first15InLater / first15Vocab.size) * 100) : 0;

  return {
    earlyVocabSize: earlyVocab.size,
    midVocabSize: midVocab.size,
    recycleEarlyToMid,
    first10VocabSize: first10Vocab.size,
    second10VocabSize: second10Vocab.size,
    recycleFirst10ToSecond,
    first15VocabSize: first15Vocab.size,
    laterVocabSize: laterVocab.size,
    recycleFirst15ToLater
  };
}

function analyzeGrammarCoverage(cards, lang) {
  // What grammar concepts are covered per node
  const byNode = {};
  ALL_NODES.forEach(n => { byNode[n] = []; });
  cards.forEach(c => {
    if (byNode[c.grammarNode]) byNode[c.grammarNode].push(c);
  });

  // Count cards per node
  const nodeCounts = {};
  ALL_NODES.forEach(n => { nodeCounts[n] = byNode[n].length; });

  // Check for essential grammar concept coverage using English translations as proxy
  const conceptChecks = {
    present_tense: c => /\b(am|is|are|do|does|have|has|go|goes|eat|eats|live|lives|work|works|speak|speaks|write|writes|read|reads)\b/i.test(c.english) && !/\b(was|were|did|had|will|would|could|should)\b/i.test(c.english),
    past_tense: c => /\b(was|were|went|ate|lived|worked|spoke|wrote|read|did|had|came|saw|took|made|bought|thought|knew|gave|found|told)\b/i.test(c.english) || /\b\w+ed\b/i.test(c.english),
    future_tense: c => /\b(will|shall|going to)\b/i.test(c.english),
    negation: c => /\b(not|n't|never|no one|nobody|nothing|neither|nor)\b/i.test(c.english) || /\b(don't|doesn't|didn't|won't|can't|couldn't|shouldn't|wouldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't)\b/i.test(c.english),
    questions: c => c.english.includes('?'),
    pronouns_subject: c => /\b(I|you|he|she|it|we|they)\b/.test(c.english),
    pronouns_object: c => /\b(me|him|her|us|them)\b/i.test(c.english),
    prepositions: c => /\b(in|on|at|to|from|with|for|about|between|under|over|through|during|before|after|without)\b/i.test(c.english),
    comparatives: c => /\b(more|less|better|worse|bigger|smaller|faster|slower|easier|harder|than)\b/i.test(c.english) || /\b\w+er\b.*\bthan\b/i.test(c.english),
    superlatives: c => /\b(most|least|best|worst|biggest|smallest|fastest|slowest)\b/i.test(c.english) || /\bthe\s+\w+est\b/i.test(c.english),
    conditional: c => /\b(would|could|if.*would|if.*could)\b/i.test(c.english),
    subjunctive: c => /\b(hope|wish|suggest|recommend|insist|demand|important that|necessary that|essential that)\b/i.test(c.english),
    passive: c => /\b(was|were|is|are|been|being)\s+\w+ed\b/i.test(c.english) || /\b(was|were|is|are)\s+(made|built|written|spoken|given|taken|done|seen|known|found|told|shown)\b/i.test(c.english),
    imperative: c => /^(Don't |Do |Let |Please |Go |Come |Take |Give |Put |Tell |Open |Close |Wait |Stop |Help |Try |Be )/i.test(c.english),
    reflexive: c => /\b(myself|yourself|himself|herself|itself|ourselves|themselves)\b/i.test(c.english),
  };

  const conceptNodeMap = {};
  Object.keys(conceptChecks).forEach(concept => {
    conceptNodeMap[concept] = {};
    ALL_NODES.forEach(node => {
      const count = byNode[node].filter(conceptChecks[concept]).length;
      if (count > 0) conceptNodeMap[concept][node] = count;
    });
  });

  // Find which concepts are missing or weak
  const conceptCoverage = {};
  Object.entries(conceptNodeMap).forEach(([concept, nodes]) => {
    const totalCards = Object.values(nodes).reduce((s, n) => s + n, 0);
    conceptCoverage[concept] = {
      totalCards,
      nodeCount: Object.keys(nodes).length,
      mainNodes: Object.entries(nodes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, c]) => `${n}(${c})`)
    };
  });

  return { nodeCounts, conceptCoverage };
}

function analyzeBetweenNodeProgression(cards) {
  const byNode = {};
  ALL_NODES.forEach(n => { byNode[n] = []; });
  cards.forEach(c => {
    if (byNode[c.grammarNode]) byNode[c.grammarNode].push(c);
  });

  const progression = [];
  for (let i = 0; i < ALL_NODES.length - 1; i++) {
    const currNode = ALL_NODES[i];
    const nextNode = ALL_NODES[i + 1];
    const currCards = byNode[currNode];
    const nextCards = byNode[nextNode];

    if (currCards.length === 0 || nextCards.length === 0) continue;

    // Avg sentence length
    const avgLenCurr = currCards.reduce((s, c) => s + c.target.length, 0) / currCards.length;
    const avgLenNext = nextCards.reduce((s, c) => s + c.target.length, 0) / nextCards.length;

    // Vocab overlap
    const currVocab = new Set(currCards.flatMap(c => extractTargetWords(c.target)));
    const nextVocab = new Set(nextCards.flatMap(c => extractTargetWords(c.target)));
    let overlap = 0;
    currVocab.forEach(w => { if (nextVocab.has(w)) overlap++; });
    const overlapRate = currVocab.size > 0 ? Math.round((overlap / currVocab.size) * 100) : 0;

    // Difficulty jump (sentence length change)
    const lenChange = Math.round(((avgLenNext - avgLenCurr) / avgLenCurr) * 100);

    progression.push({
      from: currNode,
      to: nextNode,
      fromCards: currCards.length,
      toCards: nextCards.length,
      avgLenFrom: Math.round(avgLenCurr),
      avgLenTo: Math.round(avgLenNext),
      lenChangePercent: lenChange,
      vocabOverlapPercent: overlapRate,
      abruptJump: Math.abs(lenChange) > 30 // >30% change is abrupt
    });
  }

  return progression;
}

// ── MAIN ──
const results = {};

LANGUAGES.forEach(lang => {
  console.log(`Analyzing ${lang}...`);
  const cards = loadDeck(lang);
  if (cards.length === 0) return;

  // 1. Within-node coherence for sampled nodes
  const withinNode = {};
  SAMPLED_NODES.forEach(nodeId => {
    const analysis = analyzeWithinNodeCoherence(cards, nodeId, lang);
    if (analysis) withinNode[nodeId] = analysis;
  });

  // 2. Between-node progression
  const progression = analyzeBetweenNodeProgression(cards);

  // 3. Grammar concept coverage
  const coverage = analyzeGrammarCoverage(cards, lang);

  // 4. Vocabulary recycling
  const recycling = analyzeVocabRecycling(cards);

  results[lang] = { withinNode, progression, coverage, recycling, totalCards: cards.length };
});

// ── GENERATE REPORT ──
let report = `# Curriculum Coherence Analysis\n\nGenerated: ${new Date().toISOString().split('T')[0]}\n\n`;
report += `## Overview\n\nAnalyzed ${LANGUAGES.length} languages across 35 grammar nodes each.\n`;
report += `Sampled nodes for detailed review: ${SAMPLED_NODES.join(', ')}\n\n`;

// Summary table
report += `## Summary Table\n\n`;
report += `| Language | Cards | Vocab Recycle (01-05 in 06-15) | Vocab Recycle (01-10 in 11-20) | Abrupt Jumps | Avg Tip Relevance |\n`;
report += `|----------|-------|-------------------------------|-------------------------------|--------------|-------------------|\n`;

LANGUAGES.forEach(lang => {
  const r = results[lang];
  if (!r) return;
  const abruptJumps = r.progression.filter(p => p.abruptJump).length;
  const tipRelevances = Object.values(r.withinNode).map(n => n.tipRelevance);
  const avgTipRelevance = tipRelevances.length > 0 ? Math.round(tipRelevances.reduce((s, v) => s + v, 0) / tipRelevances.length) : 0;
  report += `| ${lang} | ${r.totalCards} | ${r.recycling.recycleEarlyToMid}% | ${r.recycling.recycleFirst10ToSecond}% | ${abruptJumps} | ${avgTipRelevance}% |\n`;
});

// ── SECTION 1: WITHIN-NODE COHERENCE ──
report += `\n---\n\n## 1. Within-Node Coherence (Detailed)\n\n`;

LANGUAGES.forEach(lang => {
  const r = results[lang];
  if (!r) return;
  report += `### ${lang.charAt(0).toUpperCase() + lang.slice(1)}\n\n`;

  SAMPLED_NODES.forEach(nodeId => {
    const n = r.withinNode[nodeId];
    if (!n) {
      report += `#### ${nodeId}: No cards found\n\n`;
      return;
    }
    report += `#### ${nodeId}: ${n.expectedGrammar}\n`;
    report += `- **Cards**: ${n.totalCards} | **Tip rate**: ${n.tipRate}% | **Tip relevance**: ${n.tipRelevance}%\n`;
    report += `- **Sentence uniqueness**: ${n.uniquenessRate}% | **English uniqueness**: ${n.englishUniqueness}%\n`;
    report += `- **Unique target vocab**: ${n.uniqueTargetVocab} | **Vocab reuse within node**: ${n.vocabReuseRate}%\n`;
    report += `- **Avg sentence length**: first half=${n.avgSentenceLenFirst} chars, second half=${n.avgSentenceLenSecond} chars`;
    report += n.progressiveComplexity ? ' (PROGRESSIVE)' : ' (NOT progressive)';
    report += `\n- **Top words**: ${n.mostCommonWords.join(', ')}\n`;

    // Quality assessment
    const issues = [];
    if (n.tipRelevance < 40) issues.push(`LOW tip relevance (${n.tipRelevance}%) - tips may not match node topic`);
    if (n.uniquenessRate < 95) issues.push(`Duplicate sentences detected (${n.uniquenessRate}% unique)`);
    if (n.vocabReuseRate < 20) issues.push(`Low vocab reuse within node (${n.vocabReuseRate}%) - cards feel disconnected`);
    if (n.tipRate < 15) issues.push(`Very low tip coverage (${n.tipRate}%)`);

    if (issues.length > 0) {
      report += `- **ISSUES**: ${issues.join('; ')}\n`;
    } else {
      report += `- **Assessment**: OK\n`;
    }

    // Sample cards
    report += `- **Sample cards**:\n`;
    n.sampleCards.slice(0, 3).forEach(c => {
      report += `  - "${c.target}" = "${c.english}"${c.grammar ? ` [tip: ${c.grammar.substring(0, 60)}...]` : ''}\n`;
    });
    report += `\n`;
  });
});

// ── SECTION 2: BETWEEN-NODE PROGRESSION ──
report += `\n---\n\n## 2. Between-Node Progression\n\n`;

LANGUAGES.forEach(lang => {
  const r = results[lang];
  if (!r) return;
  report += `### ${lang.charAt(0).toUpperCase() + lang.slice(1)}\n\n`;

  const abruptJumps = r.progression.filter(p => p.abruptJump);
  const lowOverlaps = r.progression.filter(p => p.vocabOverlapPercent < 20);

  if (abruptJumps.length > 0) {
    report += `**Abrupt difficulty jumps** (>30% sentence length change):\n`;
    abruptJumps.forEach(p => {
      report += `- ${p.from} -> ${p.to}: ${p.lenChangePercent > 0 ? '+' : ''}${p.lenChangePercent}% length change (${p.avgLenFrom} -> ${p.avgLenTo} chars)\n`;
    });
    report += `\n`;
  } else {
    report += `No abrupt difficulty jumps detected. Progression is smooth.\n\n`;
  }

  if (lowOverlaps.length > 0) {
    report += `**Low vocab overlap** (<20% between adjacent nodes):\n`;
    lowOverlaps.forEach(p => {
      report += `- ${p.from} -> ${p.to}: only ${p.vocabOverlapPercent}% vocab overlap\n`;
    });
    report += `\n`;
  }

  // Overall progression summary
  const allLens = r.progression.map(p => p.avgLenTo);
  const monotonic = allLens.every((v, i) => i === 0 || v >= allLens[i - 1] - 5);
  report += `**Overall trend**: ${monotonic ? 'Generally increasing complexity' : 'Non-monotonic complexity (some nodes easier than previous)'}\n\n`;
});

// ── SECTION 3: GRAMMAR CONCEPT COVERAGE ──
report += `\n---\n\n## 3. Grammar Concept Coverage\n\n`;

const ESSENTIAL_CONCEPTS = [
  'present_tense', 'past_tense', 'future_tense', 'negation', 'questions',
  'pronouns_subject', 'pronouns_object', 'prepositions', 'comparatives',
  'superlatives', 'conditional', 'subjunctive', 'passive', 'imperative', 'reflexive'
];

LANGUAGES.forEach(lang => {
  const r = results[lang];
  if (!r) return;
  report += `### ${lang.charAt(0).toUpperCase() + lang.slice(1)}\n\n`;

  // Node card distribution
  const nodeCounts = r.coverage.nodeCounts;
  const nodeCountValues = ALL_NODES.map(n => nodeCounts[n] || 0);
  const emptyNodes = ALL_NODES.filter(n => (nodeCounts[n] || 0) === 0);
  const smallNodes = ALL_NODES.filter(n => (nodeCounts[n] || 0) > 0 && (nodeCounts[n] || 0) < 50);
  const largeNodes = ALL_NODES.filter(n => (nodeCounts[n] || 0) > 200);

  report += `**Node distribution**: min=${Math.min(...nodeCountValues.filter(v=>v>0))}, max=${Math.max(...nodeCountValues)}, avg=${Math.round(nodeCountValues.reduce((s,v)=>s+v,0)/35)}\n`;
  if (emptyNodes.length > 0) report += `- Empty nodes: ${emptyNodes.join(', ')}\n`;
  if (smallNodes.length > 0) report += `- Small nodes (<50 cards): ${smallNodes.join(', ')}\n`;
  if (largeNodes.length > 0) report += `- Large nodes (>200 cards): ${largeNodes.join(', ')}\n`;

  report += `\n**Concept coverage**:\n`;
  report += `| Concept | Cards | Nodes | Main nodes |\n`;
  report += `|---------|-------|-------|------------|\n`;

  ESSENTIAL_CONCEPTS.forEach(concept => {
    const c = r.coverage.conceptCoverage[concept];
    const status = c.totalCards < 10 ? ' ⚠ WEAK' : c.totalCards < 30 ? ' (low)' : '';
    report += `| ${concept} | ${c.totalCards}${status} | ${c.nodeCount} | ${c.mainNodes.join(', ')} |\n`;
  });
  report += `\n`;

  // Identify gaps
  const gaps = ESSENTIAL_CONCEPTS.filter(c => r.coverage.conceptCoverage[c].totalCards < 10);
  if (gaps.length > 0) {
    report += `**GAPS**: The following concepts have very weak coverage: ${gaps.join(', ')}\n\n`;
  }
});

// ── SECTION 4: VOCABULARY RECYCLING ──
report += `\n---\n\n## 4. Vocabulary Recycling Rates\n\n`;
report += `Target: 60-80% of earlier vocabulary should reappear in later nodes.\n\n`;
report += `| Language | Nodes 01-05 vocab | Recycled in 06-15 | Nodes 01-10 vocab | Recycled in 11-20 | Nodes 01-15 vocab | Recycled in 16-35 |\n`;
report += `|----------|-------------------|-------------------|-------------------|-------------------|-------------------|-------------------|\n`;

LANGUAGES.forEach(lang => {
  const r = results[lang];
  if (!r) return;
  const rec = r.recycling;
  report += `| ${lang} | ${rec.earlyVocabSize} | ${rec.recycleEarlyToMid}% | ${rec.first10VocabSize} | ${rec.recycleFirst10ToSecond}% | ${rec.first15VocabSize} | ${rec.recycleFirst15ToLater}% |\n`;
});

report += `\n### Assessment\n\n`;
LANGUAGES.forEach(lang => {
  const r = results[lang];
  if (!r) return;
  const rec = r.recycling;
  const issues = [];
  if (rec.recycleEarlyToMid < 40) issues.push(`Low early-to-mid recycling (${rec.recycleEarlyToMid}%)`);
  if (rec.recycleFirst10ToSecond < 40) issues.push(`Low first-half recycling (${rec.recycleFirst10ToSecond}%)`);
  if (rec.recycleFirst15ToLater < 30) issues.push(`Low foundation-to-advanced recycling (${rec.recycleFirst15ToLater}%)`);

  if (issues.length > 0) {
    report += `- **${lang}**: ${issues.join('; ')}\n`;
  } else {
    report += `- **${lang}**: Vocabulary recycling within acceptable range\n`;
  }
});

// ── SECTION 5: CROSS-LANGUAGE COMPARISON ──
report += `\n\n---\n\n## 5. Cross-Language Pedagogical Comparison\n\n`;

// Compare node sizing across languages
report += `### Node Size Distribution\n\n`;
report += `| Node | ${LANGUAGES.map(l => l.slice(0, 2).toUpperCase()).join(' | ')} |\n`;
report += `|------|${LANGUAGES.map(() => '----').join('|')}|\n`;

ALL_NODES.forEach(node => {
  const counts = LANGUAGES.map(lang => {
    const r = results[lang];
    return r ? (r.coverage.nodeCounts[node] || 0) : 0;
  });
  report += `| ${node} | ${counts.join(' | ')} |\n`;
});

// ── SECTION 6: OVERALL VERDICT ──
report += `\n\n---\n\n## 6. Overall Verdict & Recommendations\n\n`;

let totalIssues = 0;
const langIssues = {};

LANGUAGES.forEach(lang => {
  const r = results[lang];
  if (!r) return;
  const issues = [];

  // Tip relevance
  const tipRelevances = Object.values(r.withinNode).map(n => n.tipRelevance);
  const avgTipRel = tipRelevances.length > 0 ? tipRelevances.reduce((s, v) => s + v, 0) / tipRelevances.length : 0;
  if (avgTipRel < 40) issues.push(`Grammar tips poorly aligned with node topics (avg ${Math.round(avgTipRel)}% relevance)`);

  // Abrupt jumps
  const abruptJumps = r.progression.filter(p => p.abruptJump).length;
  if (abruptJumps > 5) issues.push(`${abruptJumps} abrupt difficulty jumps between nodes`);

  // Vocab recycling
  if (r.recycling.recycleEarlyToMid < 40) issues.push(`Poor vocabulary recycling from early to mid nodes (${r.recycling.recycleEarlyToMid}%)`);

  // Grammar gaps
  const gaps = ESSENTIAL_CONCEPTS.filter(c => r.coverage.conceptCoverage[c].totalCards < 10);
  if (gaps.length > 0) issues.push(`Grammar gaps: ${gaps.join(', ')}`);

  // Empty nodes
  const emptyNodes = ALL_NODES.filter(n => (r.coverage.nodeCounts[n] || 0) === 0);
  if (emptyNodes.length > 0) issues.push(`Empty nodes: ${emptyNodes.join(', ')}`);

  langIssues[lang] = issues;
  totalIssues += issues.length;
});

LANGUAGES.forEach(lang => {
  const issues = langIssues[lang];
  if (!issues) return;
  report += `### ${lang.charAt(0).toUpperCase() + lang.slice(1)}\n`;
  if (issues.length === 0) {
    report += `No major issues detected. Curriculum appears well-structured.\n\n`;
  } else {
    issues.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += `\n`;
  }
});

report += `\n### Overall Score\n\n`;
report += `Total issues found: ${totalIssues} across ${LANGUAGES.length} languages\n`;
report += `Average issues per language: ${(totalIssues / LANGUAGES.length).toFixed(1)}\n`;

// Write report
const outputPath = path.join(__dirname, 'output', 'coherence-analysis.md');
fs.writeFileSync(outputPath, report, 'utf-8');
console.log(`\nReport written to ${outputPath}`);
console.log(`Total issues: ${totalIssues}`);
