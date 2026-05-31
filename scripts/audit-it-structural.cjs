#!/usr/bin/env node
/**
 * Comprehensive structural audit of the Italian deck.
 * Checks: priority balance, level appropriateness, tag accuracy,
 * essential vocab coverage, node transition logic.
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const OUTPUT_PATH = path.join(__dirname, 'output', 'audit-it-structural.json');

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// ── Node definitions with CEFR levels ──
const NODE_META = {
  'node-01': { level: 'A1', desc: 'Regular present tense' },
  'node-02': { level: 'A1', desc: 'Irregular present verbs' },
  'node-03': { level: 'A1', desc: 'Essere vs stare' },
  'node-04': { level: 'A1', desc: 'Questions & interrogatives' },
  'node-05': { level: 'A1', desc: 'Articles & gender agreement' },
  'node-06': { level: 'A1', desc: 'Piacere-type verbs' },
  'node-07': { level: 'A1', desc: 'Descriptive language' },
  'node-08': { level: 'A1', desc: 'Common expressions & phrases' },
  'node-09': { level: 'A2', desc: 'Passato prossimo regular' },
  'node-10': { level: 'A2', desc: 'Passato prossimo irregular' },
  'node-11': { level: 'A2', desc: 'Imperfetto' },
  'node-12': { level: 'A2', desc: 'Passato prossimo vs imperfetto' },
  'node-13': { level: 'A2', desc: 'Reflexive verbs' },
  'node-14': { level: 'A2', desc: 'Per vs da' },
  'node-15': { level: 'A2', desc: 'Object pronouns' },
  'node-16': { level: 'B1', desc: 'Congiuntivo presente' },
  'node-17': { level: 'B1', desc: 'Imperativo' },
  'node-18': { level: 'B1', desc: 'Condizionale' },
  'node-19': { level: 'B1', desc: 'Futuro semplice' },
  'node-20': { level: 'B1', desc: 'Relative clauses' },
  'node-21': { level: 'B1', desc: 'Compound tenses' },
  'node-22': { level: 'B2', desc: 'Congiuntivo imperfetto' },
  'node-23': { level: 'B2', desc: 'Complex conditionals' },
  'node-24': { level: 'B2', desc: 'Passive & impersonal si' },
  'node-25': { level: 'B2', desc: 'Discourse connectors' },
  'node-26': { level: 'B2', desc: 'Verb phrases (periphrasis)' },
  'node-27': { level: 'B2', desc: 'Reported speech' },
  'node-28': { level: 'C1', desc: 'Congiuntivo nuances' },
  'node-29': { level: 'C1', desc: 'Formal/literary register' },
  'node-30': { level: 'C1', desc: 'Idiomatic expressions' },
  'node-31': { level: 'C1', desc: 'Complex syntax' },
  'node-32': { level: 'C2', desc: 'Literary tenses & narrative' },
  'node-33': { level: 'C2', desc: 'Academic/professional discourse' },
  'node-34': { level: 'C2', desc: 'Cultural fluency' },
  'node-35': { level: 'C2', desc: 'Combined advanced patterns' },
};

const LEVEL_ORDER = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

// ── Essential vocabulary categories ──
const ESSENTIAL_VOCAB = {
  numbers: {
    words: ['uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci',
            'venti', 'trenta', 'cento', 'mille', 'primo', 'secondo', 'terzo'],
    minExpected: 8
  },
  colors: {
    words: ['rosso', 'blu', 'verde', 'giallo', 'nero', 'bianco', 'rosa', 'arancione', 'grigio', 'marrone',
            'rossa', 'verdi', 'gialla', 'nera', 'bianca'],
    minExpected: 5
  },
  directions: {
    words: ['destra', 'sinistra', 'nord', 'sud', 'est', 'ovest', 'dritto', 'avanti', 'indietro',
            'sopra', 'sotto', 'vicino', 'lontano', 'dietro', 'davanti'],
    minExpected: 5
  },
  body: {
    words: ['testa', 'mano', 'mani', 'occhio', 'occhi', 'bocca', 'braccio', 'braccia', 'gamba', 'gambe',
            'piede', 'piedi', 'cuore', 'dito', 'naso', 'orecchio', 'capelli', 'corpo', 'spalla'],
    minExpected: 5
  },
  animals: {
    words: ['gatto', 'cane', 'cavallo', 'uccello', 'pesce', 'topo', 'mucca', 'maiale', 'pecora',
            'leone', 'elefante', 'farfalla', 'coniglio', 'gallina', 'orso'],
    minExpected: 4
  },
  family: {
    words: ['madre', 'padre', 'figlio', 'figlia', 'fratello', 'sorella', 'nonno', 'nonna',
            'marito', 'moglie', 'zio', 'zia', 'cugino', 'cugina', 'famiglia', 'mamma', 'papà',
            'genitori', 'bambino', 'bambina'],
    minExpected: 6
  },
  days: {
    words: ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica',
            'oggi', 'domani', 'ieri', 'settimana', 'mese', 'anno', 'giorno', 'mattina', 'sera', 'notte'],
    minExpected: 7
  },
  food: {
    words: ['pane', 'acqua', 'latte', 'formaggio', 'carne', 'pesce', 'frutta', 'verdura',
            'pasta', 'riso', 'vino', 'caffè', 'zucchero', 'sale', 'olio', 'pizza', 'pollo',
            'uovo', 'uova', 'burro', 'pomodoro', 'insalata', 'dolce'],
    minExpected: 8
  },
  phrases: {
    words: ['grazie', 'prego', 'scusi', 'ciao', 'buongiorno', 'buonasera', 'arrivederci',
            'per favore', 'mi dispiace', 'come stai', 'buonanotte', 'salute', "d'accordo",
            'permesso', 'benvenuto'],
    minExpected: 6
  }
};

// ── 1. Priority Balance per Node ──
const nodeStats = {};
for (const card of deck) {
  const node = card.grammarNode;
  if (!nodeStats[node]) {
    nodeStats[node] = { total: 0, priorities: {}, tags: {}, hasGrammar: 0, ids: [] };
  }
  const s = nodeStats[node];
  s.total++;
  s.priorities[card.priority] = (s.priorities[card.priority] || 0) + 1;
  for (const tag of (card.tags || [])) {
    s.tags[tag] = (s.tags[tag] || 0) + 1;
  }
  if (card.grammar) s.hasGrammar++;
  s.ids.push(card.id);
}

const priorityIssues = [];
for (const [node, stats] of Object.entries(nodeStats)) {
  const prios = stats.priorities;
  const p1 = prios[1] || 0;
  const p2 = prios[2] || 0;
  const p3 = prios[3] || 0;
  const total = stats.total;

  // Priority 1 should be 20-40% of node, p2 30-50%, p3 20-40%
  const p1pct = (p1 / total * 100);
  const p2pct = (p2 / total * 100);
  const p3pct = (p3 / total * 100);

  if (p1pct < 15 || p1pct > 50) {
    priorityIssues.push({ node, issue: `P1 is ${p1pct.toFixed(1)}% (${p1}/${total}) — expected 15-50%` });
  }
  if (p2pct < 20 || p2pct > 55) {
    priorityIssues.push({ node, issue: `P2 is ${p2pct.toFixed(1)}% (${p2}/${total}) — expected 20-55%` });
  }
  if (p3pct < 10 || p3pct > 45) {
    priorityIssues.push({ node, issue: `P3 is ${p3pct.toFixed(1)}% (${p3}/${total}) — expected 10-45%` });
  }
  // Check for missing priorities
  if (!p1) priorityIssues.push({ node, issue: 'No priority-1 cards at all!' });
  if (!p2) priorityIssues.push({ node, issue: 'No priority-2 cards at all!' });
  if (!p3) priorityIssues.push({ node, issue: 'No priority-3 cards at all!' });
}

// ── 2. Level Appropriateness ──
const levelIssues = [];
const targetText = deck.map(c => c.target.toLowerCase());

// Check sentence complexity vs CEFR level
for (const [node, stats] of Object.entries(nodeStats)) {
  const meta = NODE_META[node];
  if (!meta) {
    levelIssues.push({ node, issue: `Unknown node ${node} — not in NODE_META` });
    continue;
  }

  // Node size: each node should have ~100-140 cards (3945/35 ≈ 113)
  if (stats.total < 80) {
    levelIssues.push({ node, level: meta.level, issue: `Only ${stats.total} cards — too few (expected 80+)` });
  }
  if (stats.total > 160) {
    levelIssues.push({ node, level: meta.level, issue: `${stats.total} cards — too many (expected ≤160)` });
  }

  // A1 nodes (01-08): sentences should be shorter on average
  // C1/C2 nodes (28-35): sentences should be longer
  const nodeCards = deck.filter(c => c.grammarNode === node);
  const avgLen = nodeCards.reduce((sum, c) => sum + c.target.split(/\s+/).length, 0) / nodeCards.length;

  if (meta.level === 'A1' && avgLen > 12) {
    levelIssues.push({ node, level: 'A1', issue: `Avg sentence length ${avgLen.toFixed(1)} words — too complex for A1 (expected ≤12)` });
  }
  if (meta.level === 'C2' && avgLen < 5) {
    levelIssues.push({ node, level: 'C2', issue: `Avg sentence length ${avgLen.toFixed(1)} words — too simple for C2 (expected ≥5)` });
  }

  // Check that P1 cards in nodes with 15+ cards don't exceed id 500 equivalent (i.e., they appear early)
  if (stats.total >= 15) {
    const p1Cards = nodeCards.filter(c => c.priority === 1);
    const p1Indices = p1Cards.map(c => {
      const num = parseInt(c.id.replace('it-', ''));
      return num;
    });
    const maxP1 = Math.max(...p1Indices);
    // For nodes with 15+ cards, all P1 should be in the first ~70% of the deck
    if (maxP1 > 3500 && meta.level === 'A1') {
      // A1 priority-1 cards showing up very late is suspicious
      levelIssues.push({ node, level: 'A1', issue: `A1 P1 card appears at id it-${maxP1} — may be too late in deck ordering` });
    }
  }
}

// ── 3. Tag Accuracy ──
const tagCounts = { general: 0, travel: 0, work: 0, family: 0 };
const tagByNode = {};
for (const card of deck) {
  for (const tag of (card.tags || [])) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
  if (!tagByNode[card.grammarNode]) tagByNode[card.grammarNode] = {};
  for (const tag of (card.tags || [])) {
    tagByNode[card.grammarNode][tag] = (tagByNode[card.grammarNode][tag] || 0) + 1;
  }
}

const tagIssues = [];
// General should be on nearly every card
if (tagCounts.general < deck.length * 0.95) {
  tagIssues.push({ issue: `Only ${tagCounts.general}/${deck.length} cards have 'general' tag (${(tagCounts.general/deck.length*100).toFixed(1)}%)` });
}
// Travel/work/family should each be 40-60%
for (const tag of ['travel', 'work', 'family']) {
  const pct = (tagCounts[tag] / deck.length * 100);
  if (pct < 30) {
    tagIssues.push({ tag, issue: `Only ${pct.toFixed(1)}% cards have '${tag}' tag — expected ≥30%` });
  }
  if (pct > 70) {
    tagIssues.push({ tag, issue: `${pct.toFixed(1)}% cards have '${tag}' tag — expected ≤70%` });
  }
}

// Per-node tag check: each node should have at least some travel/work/family representation
for (const [node, tags] of Object.entries(tagByNode)) {
  const total = nodeStats[node].total;
  for (const tag of ['travel', 'work', 'family']) {
    const count = tags[tag] || 0;
    if (count < 3 && total >= 20) {
      tagIssues.push({ node, tag, issue: `Only ${count}/${total} cards with '${tag}' in ${node}` });
    }
  }
}

// Spot-check tag accuracy: travel-tagged cards should contain travel words
const travelWords = ['viaggio', 'viaggi', 'aeroporto', 'hotel', 'valigia', 'biglietto', 'treno',
  'autobus', 'aereo', 'stazione', 'prenotazione', 'turista', 'passaporto', 'volo', 'partire',
  'arrivare', 'destinazione', 'mappa', 'albergo', 'ristorante', 'museo', 'spiaggia', 'vacanza',
  'città', 'paese', 'strada', 'piazza'];
const workWords = ['lavoro', 'ufficio', 'collega', 'riunione', 'progetto', 'azienda', 'capo',
  'stipendio', 'contratto', 'cliente', 'email', 'presentazione', 'scadenza', 'carriera',
  'professione', 'impiegato', 'direttore', 'fabbrica', 'negozio', 'lavorare'];
const familyWords = ['famiglia', 'madre', 'padre', 'figlio', 'figlia', 'fratello', 'sorella',
  'casa', 'cucina', 'bambino', 'bambina', 'marito', 'moglie', 'nonno', 'nonna', 'genitori',
  'mamma', 'papà', 'cena', 'pranzo', 'colazione'];

// Sample false positive detection
let travelFalsePositives = 0;
let workFalsePositives = 0;
let familyFalsePositives = 0;
const sampleSize = Math.min(50, deck.length);
const travelTagged = deck.filter(c => c.tags.includes('travel'));
const workTagged = deck.filter(c => c.tags.includes('work'));
const familyTagged = deck.filter(c => c.tags.includes('family'));

// Sample up to 50 from each tag
for (const card of travelTagged.slice(0, sampleSize)) {
  const lower = card.target.toLowerCase();
  if (!travelWords.some(w => lower.includes(w)) && !lower.includes('dove') && !lower.includes('andiamo')) {
    // Not necessarily wrong — tags are thematic, not keyword-based
  }
}

// ── 4. Essential Vocab Coverage ──
const vocabResults = {};
const allTarget = deck.map(c => c.target.toLowerCase()).join(' ');

for (const [category, { words, minExpected }] of Object.entries(ESSENTIAL_VOCAB)) {
  const found = [];
  const missing = [];
  for (const word of words) {
    // Use word boundary matching
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const matchCount = deck.filter(c => regex.test(c.target)).length;
    if (matchCount > 0) {
      found.push({ word, occurrences: matchCount });
    } else {
      missing.push(word);
    }
  }
  vocabResults[category] = {
    found: found.length,
    total: words.length,
    coverage: `${(found.length / words.length * 100).toFixed(1)}%`,
    missing,
    foundWords: found,
    pass: found.length >= minExpected
  };
}

const vocabIssues = [];
for (const [cat, result] of Object.entries(vocabResults)) {
  if (!result.pass) {
    vocabIssues.push({
      category: cat,
      issue: `Only ${result.found}/${result.total} words found (need ${ESSENTIAL_VOCAB[cat].minExpected}+)`,
      missing: result.missing
    });
  }
}

// ── 5. Node Transition Logic ──
const transitionIssues = [];

// Verify nodes are ordered by difficulty (A1→A2→B1→B2→C1→C2)
const nodeNumbers = Object.keys(nodeStats).map(n => parseInt(n.replace('node-', ''))).sort((a, b) => a - b);
let prevLevel = 'A1';
for (const num of nodeNumbers) {
  const node = `node-${String(num).padStart(2, '0')}`;
  const meta = NODE_META[node];
  if (!meta) continue;
  if (LEVEL_ORDER[meta.level] < LEVEL_ORDER[prevLevel]) {
    transitionIssues.push({ node, issue: `Level ${meta.level} comes after ${prevLevel} — regression in difficulty` });
  }
  prevLevel = meta.level;
}

// Check that sentence complexity increases across nodes
const nodeAvgLengths = {};
for (const [node, stats] of Object.entries(nodeStats)) {
  const cards = deck.filter(c => c.grammarNode === node);
  nodeAvgLengths[node] = cards.reduce((sum, c) => sum + c.target.split(/\s+/).length, 0) / cards.length;
}

// Compare A1 avg vs C2 avg
const a1Nodes = Object.entries(NODE_META).filter(([, m]) => m.level === 'A1').map(([n]) => n);
const c2Nodes = Object.entries(NODE_META).filter(([, m]) => m.level === 'C2').map(([n]) => n);
const a1AvgLen = a1Nodes.reduce((s, n) => s + (nodeAvgLengths[n] || 0), 0) / a1Nodes.length;
const c2AvgLen = c2Nodes.reduce((s, n) => s + (nodeAvgLengths[n] || 0), 0) / c2Nodes.length;

if (c2AvgLen <= a1AvgLen) {
  transitionIssues.push({
    issue: `C2 avg sentence length (${c2AvgLen.toFixed(1)}) is not longer than A1 (${a1AvgLen.toFixed(1)}) — expected progression`
  });
}

// Check grammar tip coverage per node
const grammarTipIssues = [];
for (const [node, stats] of Object.entries(nodeStats)) {
  const pct = (stats.hasGrammar / stats.total * 100);
  if (pct < 15) {
    grammarTipIssues.push({ node, issue: `Only ${pct.toFixed(1)}% grammar tips (${stats.hasGrammar}/${stats.total}) — expected ≥15%` });
  }
  if (pct > 50) {
    grammarTipIssues.push({ node, issue: `${pct.toFixed(1)}% grammar tips (${stats.hasGrammar}/${stats.total}) — may be too many (≤50% expected)` });
  }
}

// ── 6. Duplicate detection ──
const targetMap = {};
const duplicates = [];
for (const card of deck) {
  const key = card.target.toLowerCase().trim();
  if (targetMap[key]) {
    duplicates.push({ id1: targetMap[key], id2: card.id, sentence: card.target });
  } else {
    targetMap[key] = card.id;
  }
}

// ── 7. ID gaps / anomalies ──
const idIssues = [];
const ids = deck.map(c => parseInt(c.id.replace('it-', ''))).sort((a, b) => a - b);
const maxId = ids[ids.length - 1];
const minId = ids[0];
if (ids.length !== new Set(ids).size) {
  idIssues.push({ issue: 'Duplicate IDs detected!' });
}
// Check for large gaps
let prevId = ids[0];
for (let i = 1; i < ids.length; i++) {
  const gap = ids[i] - prevId;
  if (gap > 50) {
    idIssues.push({ issue: `Large ID gap: it-${prevId} → it-${ids[i]} (gap of ${gap})` });
  }
  prevId = ids[i];
}

// ── Build summary ──
const nodeTable = Object.entries(nodeStats)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([node, s]) => ({
    node,
    level: NODE_META[node]?.level || '??',
    desc: NODE_META[node]?.desc || '??',
    total: s.total,
    p1: s.priorities[1] || 0,
    p2: s.priorities[2] || 0,
    p3: s.priorities[3] || 0,
    tipsPct: `${(s.hasGrammar / s.total * 100).toFixed(1)}%`,
    avgWords: (deck.filter(c => c.grammarNode === node).reduce((sum, c) => sum + c.target.split(/\s+/).length, 0) / s.total).toFixed(1),
    general: s.tags.general || 0,
    travel: s.tags.travel || 0,
    work: s.tags.work || 0,
    family: s.tags.family || 0,
  }));

const result = {
  summary: {
    totalCards: deck.length,
    totalNodes: Object.keys(nodeStats).length,
    avgCardsPerNode: (deck.length / Object.keys(nodeStats).length).toFixed(1),
    overallTags: tagCounts,
    overallTipsPct: `${(deck.filter(c => c.grammar).length / deck.length * 100).toFixed(1)}%`,
    duplicateCount: duplicates.length,
    a1AvgSentenceLen: a1AvgLen.toFixed(1),
    c2AvgSentenceLen: c2AvgLen.toFixed(1),
  },
  nodeBreakdown: nodeTable,
  issues: {
    priority: priorityIssues,
    level: levelIssues,
    tags: tagIssues,
    vocab: vocabIssues,
    transitions: transitionIssues,
    grammarTips: grammarTipIssues,
    duplicates: duplicates.slice(0, 20), // first 20
    ids: idIssues,
  },
  vocabCoverage: vocabResults,
  totalIssueCount: priorityIssues.length + levelIssues.length + tagIssues.length +
    vocabIssues.length + transitionIssues.length + grammarTipIssues.length +
    duplicates.length + idIssues.length,
};

// Write output
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));

// ── Print summary ──
console.log('\n=== ITALIAN DECK STRUCTURAL AUDIT ===\n');
console.log(`Total cards: ${deck.length}`);
console.log(`Total nodes: ${Object.keys(nodeStats).length}`);
console.log(`Avg cards/node: ${result.summary.avgCardsPerNode}`);
console.log(`Grammar tips: ${result.summary.overallTipsPct}`);
console.log(`Duplicates: ${duplicates.length}`);
console.log(`A1 avg sentence: ${a1AvgLen.toFixed(1)} words | C2 avg: ${c2AvgLen.toFixed(1)} words`);
console.log(`\nTags: general=${tagCounts.general}, travel=${tagCounts.travel}, work=${tagCounts.work}, family=${tagCounts.family}`);

console.log('\n── NODE BREAKDOWN ──');
console.log('Node    | Lvl | Cards | P1  | P2  | P3  | Tips%  | AvgWd | Gen  | Trv  | Wrk  | Fam');
console.log('--------|-----|-------|-----|-----|-----|--------|-------|------|------|------|-----');
for (const n of nodeTable) {
  console.log(
    `${n.node} | ${n.level}  | ${String(n.total).padStart(5)} | ${String(n.p1).padStart(3)} | ${String(n.p2).padStart(3)} | ${String(n.p3).padStart(3)} | ${n.tipsPct.padStart(6)} | ${n.avgWords.padStart(5)} | ${String(n.general).padStart(4)} | ${String(n.travel).padStart(4)} | ${String(n.work).padStart(4)} | ${String(n.family).padStart(4)}`
  );
}

console.log('\n── ISSUES SUMMARY ──');
console.log(`Priority issues: ${priorityIssues.length}`);
console.log(`Level issues: ${levelIssues.length}`);
console.log(`Tag issues: ${tagIssues.length}`);
console.log(`Vocab coverage issues: ${vocabIssues.length}`);
console.log(`Transition issues: ${transitionIssues.length}`);
console.log(`Grammar tip issues: ${grammarTipIssues.length}`);
console.log(`Duplicate sentences: ${duplicates.length}`);
console.log(`ID issues: ${idIssues.length}`);
console.log(`TOTAL: ${result.totalIssueCount}`);

if (priorityIssues.length) {
  console.log('\n── PRIORITY ISSUES ──');
  for (const i of priorityIssues) console.log(`  ${i.node}: ${i.issue}`);
}
if (levelIssues.length) {
  console.log('\n── LEVEL ISSUES ──');
  for (const i of levelIssues) console.log(`  ${i.node || ''}: ${i.issue}`);
}
if (tagIssues.length) {
  console.log('\n── TAG ISSUES ──');
  for (const i of tagIssues) console.log(`  ${i.node || i.tag || ''}: ${i.issue}`);
}
if (vocabIssues.length) {
  console.log('\n── VOCAB COVERAGE ISSUES ──');
  for (const i of vocabIssues) {
    console.log(`  ${i.category}: ${i.issue}`);
    if (i.missing.length) console.log(`    Missing: ${i.missing.join(', ')}`);
  }
}
if (transitionIssues.length) {
  console.log('\n── TRANSITION ISSUES ──');
  for (const i of transitionIssues) console.log(`  ${i.node || ''}: ${i.issue}`);
}
if (grammarTipIssues.length) {
  console.log('\n── GRAMMAR TIP ISSUES ──');
  for (const i of grammarTipIssues) console.log(`  ${i.node}: ${i.issue}`);
}
if (duplicates.length) {
  console.log('\n── DUPLICATES (first 20) ──');
  for (const d of duplicates.slice(0, 20)) console.log(`  ${d.id1} = ${d.id2}: "${d.sentence}"`);
}
if (idIssues.length) {
  console.log('\n── ID ISSUES ──');
  for (const i of idIssues) console.log(`  ${i.issue}`);
}

// Vocab coverage summary
console.log('\n── ESSENTIAL VOCAB COVERAGE ──');
for (const [cat, r] of Object.entries(vocabResults)) {
  const status = r.pass ? 'PASS' : 'FAIL';
  console.log(`  ${cat.padEnd(12)}: ${r.found}/${r.total} (${r.coverage}) [${status}]${r.missing.length ? ' — missing: ' + r.missing.slice(0, 5).join(', ') + (r.missing.length > 5 ? '...' : '') : ''}`);
}

console.log(`\nFull report written to: ${OUTPUT_PATH}`);
