#!/usr/bin/env node
/**
 * Comprehensive Structural Audit of the Spanish Deck
 * Covers: priority weighting, level appropriateness, tag accuracy,
 * essential vocabulary, and node transitions.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const deck = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/spanish/deck.json'), 'utf8'));

// ─── 1. Priority Weighting ──────────────────────────────────────────────────
function auditPriorities() {
  const nodes = {};
  for (const card of deck) {
    const n = card.grammarNode || 'unknown';
    if (!nodes[n]) nodes[n] = { P1: 0, P2: 0, P3: 0, total: 0 };
    const p = card.priority || 2;
    nodes[n][`P${p}`]++;
    nodes[n].total++;
  }

  const flags = [];
  const nodeNames = Object.keys(nodes).sort();
  const table = {};

  for (const n of nodeNames) {
    const d = nodes[n];
    table[n] = { P1: d.P1, P2: d.P2, P3: d.P3, total: d.total };
    const num = parseInt(n.replace('node-', ''));

    // Early nodes (01-10): flag if P3 > P1
    if (num >= 1 && num <= 10 && d.P3 > d.P1) {
      flags.push({ node: n, issue: `Early node has P3(${d.P3}) > P1(${d.P1})` });
    }
    // Late nodes (30-35): flag if P1 > P3
    if (num >= 30 && num <= 35 && d.P1 > d.P3) {
      flags.push({ node: n, issue: `Late node has P1(${d.P1}) > P3(${d.P3})` });
    }
  }

  return { table, flags };
}

// ─── 2. Level Appropriateness ────────────────────────────────────────────────
function auditLevelAppropriateness() {
  // Organize cards by node
  const byNode = {};
  for (const card of deck) {
    const n = card.grammarNode || 'unknown';
    if (!byNode[n]) byNode[n] = [];
    byNode[n].push(card);
  }

  // Difficulty indicators
  const basicWords = /\b(hello|hi|goodbye|bye|yes|no|please|thank|sorry|my name|i am|you are|is|are|the|a |water|food|house|dog|cat|good|bad|big|small|where|what|how|eat|drink|want|like|have|go|come|say|name|family|mother|father|brother|sister|friend|today|tomorrow|morning|night|day|color|number|one|two|three|four|five|old|new|happy|sad|hot|cold|nice|street|money|store|car|book|school)\b/i;

  const advancedWords = /\b(notwithstanding|albeit|furthermore|whereas|inasmuch|subjunctive|pluperfect|conditional perfect|irony|rhetoric|nuance|bureaucra|legislature|geopolit|hypothetical|philosophical|metaphor|paradox|ambiguity|connotation|discourse|presuppos|undermin|infrastructure|sovereignty|sustainable|accountability|stakeholder|paradigm|cognitive|trajectory|mitigat|unprecedented|contingent|jurisdiction|diplomatic|constitutional)\b/i;

  const intermediateIndicators = /\b(would have|could have|should have|might have|if i were|had been|were to|unless|although|despite|nevertheless|however|therefore|regardless|in order to|as long as|provided that|assumption|consequence|implication|regardless)\b/i;

  const misplaced = [];
  const nodeSamples = {};

  const nodeNames = Object.keys(byNode).sort();
  for (const n of nodeNames) {
    const cards = byNode[n];
    const num = parseInt(n.replace('node-', ''));
    // Sample at least 15 cards, or all if fewer
    const sampleSize = Math.min(cards.length, Math.max(15, Math.floor(cards.length * 0.15)));
    // Deterministic spread sample
    const step = cards.length / sampleSize;
    const sampled = [];
    for (let i = 0; i < sampleSize; i++) {
      sampled.push(cards[Math.floor(i * step)]);
    }

    nodeSamples[n] = { total: cards.length, sampled: sampled.length, issues: [] };

    for (const card of sampled) {
      const eng = card.english || '';
      const tgt = card.target || '';
      const wordCount = eng.split(/\s+/).length;

      // Check for misplacement
      if (num <= 5) {
        // Very early nodes: flag complex sentences
        if (wordCount > 12 && !basicWords.test(eng)) {
          misplaced.push({ id: card.id, node: n, english: eng, reason: 'Complex sentence in beginner node' });
          nodeSamples[n].issues.push(card.id);
        }
        if (advancedWords.test(eng)) {
          misplaced.push({ id: card.id, node: n, english: eng, reason: 'Advanced vocabulary in beginner node' });
          nodeSamples[n].issues.push(card.id);
        }
      } else if (num >= 30) {
        // Late nodes: flag trivially simple sentences
        if (wordCount <= 3 && basicWords.test(eng) && !intermediateIndicators.test(eng)) {
          misplaced.push({ id: card.id, node: n, english: eng, reason: 'Trivially simple sentence in advanced node' });
          nodeSamples[n].issues.push(card.id);
        }
      }

      // Mid-range checks
      if (num <= 10 && intermediateIndicators.test(eng)) {
        misplaced.push({ id: card.id, node: n, english: eng, reason: 'Intermediate grammar construct in early node' });
        nodeSamples[n].issues.push(card.id);
      }
    }
  }

  const totalSampled = Object.values(nodeSamples).reduce((s, v) => s + v.sampled, 0);
  return { totalSampled, misplaced, nodeSamples };
}

// ─── 3. Tag Coverage Accuracy ────────────────────────────────────────────────
function auditTagAccuracy() {
  const travelKeywords = /\b(travel|trip|flight|airport|hotel|suitcase|passport|ticket|train|bus|taxi|plane|boat|beach|mountain|city|country|tour|vacat|visit|map|reserv|book|luggage|station|departure|arrival|border|visa|guide|museum|monument|temple|church|park|restaurant|abroad|foreign|journey|destina|route|drive|road|highway|room|check.?in|check.?out|explore|adventure|backpack|cruise|souvenir|landmark|exchange|currency|customs|terminal|gate|boarding|seat|window|aisle)\b/i;

  const workKeywords = /\b(work|job|office|boss|colleague|meeting|project|deadline|salary|company|business|interview|resume|career|manage|employ|schedule|report|client|customer|email|phone|computer|budget|profit|market|sell|buy|contract|negotiate|present|strategy|team|department|hire|fire|retire|promot|task|assign|product|service|industry|profession|skill|experience|training|conference|workshop)\b/i;

  const familyKeywords = /\b(family|mother|father|brother|sister|son|daughter|parent|child|children|kid|baby|grandm|grandf|grandp|uncle|aunt|cousin|nephew|niece|husband|wife|spouse|married|wedding|home|house|birthday|holiday|celebrat|together|relative|sibling|twin|adopt|pregnan|born|grew up|raise|care|love|pet|dog|cat)\b/i;

  function sampleTagged(tag, keywords, count) {
    const tagged = deck.filter(c => (c.tags || []).includes(tag));
    // Sample up to `count` cards spread evenly
    const step = Math.max(1, Math.floor(tagged.length / count));
    const sampled = [];
    for (let i = 0; i < tagged.length && sampled.length < count; i += step) {
      sampled.push(tagged[i]);
    }

    let correct = 0;
    const mismatches = [];
    for (const card of sampled) {
      const eng = card.english || '';
      if (keywords.test(eng)) {
        correct++;
      } else {
        mismatches.push({ id: card.id, english: eng });
      }
    }
    return {
      totalTagged: tagged.length,
      sampled: sampled.length,
      correct,
      accuracy: sampled.length > 0 ? ((correct / sampled.length) * 100).toFixed(1) + '%' : 'N/A',
      mismatches: mismatches.slice(0, 15) // show up to 15 mismatches
    };
  }

  return {
    travel: sampleTagged('travel', travelKeywords, 50),
    work: sampleTagged('work', workKeywords, 50),
    family: sampleTagged('family', familyKeywords, 50),
    general: { totalTagged: deck.filter(c => (c.tags || []).includes('general')).length }
  };
}

// ─── 4. Essential Vocabulary Coverage ────────────────────────────────────────
function auditVocabCoverage() {
  const allEnglish = deck.map(c => (c.english || '').toLowerCase()).join(' ||| ');

  const categories = {
    numbers: {
      items: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
              'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
      found: [], missing: []
    },
    colors: {
      items: ['red', 'blue', 'green', 'yellow', 'white', 'black', 'brown', 'orange'],
      found: [], missing: []
    },
    directions: {
      items: ['left', 'right', 'straight', 'near', 'far', 'north', 'south'],
      found: [], missing: []
    },
    bodyParts: {
      items: ['head', 'hand', 'eye', 'mouth', 'leg', 'arm', 'stomach', 'heart', 'foot'],
      found: [], missing: []
    },
    animals: {
      items: ['dog', 'cat', 'bird', 'fish', 'horse', 'cow'],
      found: [], missing: []
    },
    family: {
      items: ['mother', 'father', 'brother', 'sister', 'son', 'daughter', 'husband', 'wife', 'grandmother', 'grandfather'],
      found: [], missing: []
    },
    days: {
      items: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      found: [], missing: []
    },
    months: {
      items: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
      found: [], missing: []
    },
    foodDrink: {
      items: ['water', 'bread', 'rice', 'meat', 'fish', 'fruit', 'coffee', 'tea', 'milk', 'egg'],
      found: [], missing: []
    },
    basicPhrases: {
      items: ['hello', 'goodbye', 'please', 'thank you', 'sorry', 'yes', 'no', 'help'],
      found: [], missing: []
    }
  };

  for (const [cat, data] of Object.entries(categories)) {
    for (const word of data.items) {
      // Use word boundary regex
      const re = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (re.test(allEnglish)) {
        data.found.push(word);
      } else {
        data.missing.push(word);
      }
    }
  }

  // Summary
  const summary = {};
  for (const [cat, data] of Object.entries(categories)) {
    summary[cat] = {
      total: data.items.length,
      found: data.found.length,
      missing: data.missing,
      coverage: ((data.found.length / data.items.length) * 100).toFixed(0) + '%'
    };
  }
  return summary;
}

// ─── 5. Node Transition Analysis ─────────────────────────────────────────────
function auditNodeTransitions() {
  const byNode = {};
  for (const card of deck) {
    const n = card.grammarNode || 'unknown';
    if (!byNode[n]) byNode[n] = [];
    byNode[n].push(card);
  }

  const nodeInfo = {};
  const nodeNames = Object.keys(byNode).sort();

  for (const n of nodeNames) {
    const cards = byNode[n];
    // Collect grammar tips to infer the node concept
    const tips = cards.filter(c => c.grammar).map(c => c.grammar);

    // Count topic keywords in tips
    const tipText = tips.join(' ').toLowerCase();

    // Try to detect the main grammar concept
    const concepts = [];
    const conceptPatterns = [
      [/\bpresent\s+tense\b/i, 'present tense'],
      [/\bpresent\s+indicative\b/i, 'present indicative'],
      [/\bpast\s+tense\b|\bpret[eé]rit/i, 'preterite/past tense'],
      [/\bimperfect\b/i, 'imperfect tense'],
      [/\bfuture\s+tense\b|\bfutur[eo]\b/i, 'future tense'],
      [/\bconditional\b/i, 'conditional'],
      [/\bsubjunctive\b/i, 'subjunctive'],
      [/\bimperative\b|\bcommand/i, 'imperative/commands'],
      [/\bser\b.*\bestar\b|\bestar\b.*\bser\b/i, 'ser vs estar'],
      [/\breflexive\b/i, 'reflexive verbs'],
      [/\bpronoun/i, 'pronouns'],
      [/\bpossessive\b/i, 'possessives'],
      [/\bdemonstrative\b/i, 'demonstratives'],
      [/\barticle/i, 'articles'],
      [/\bgender\b/i, 'gender'],
      [/\bplural/i, 'plurals'],
      [/\badjective/i, 'adjectives'],
      [/\badverb/i, 'adverbs'],
      [/\bpreposition/i, 'prepositions'],
      [/\bconjunction/i, 'conjunctions'],
      [/\bgustar\b|\blike\b.*\bverb/i, 'gustar-type verbs'],
      [/\bnegati/i, 'negation'],
      [/\bquestion/i, 'questions'],
      [/\bcompar/i, 'comparatives'],
      [/\bsuperla/i, 'superlatives'],
      [/\bperfect\b/i, 'perfect tenses'],
      [/\bgerund\b|\bprogressive\b|\b-ando\b|\b-iendo\b/i, 'gerund/progressive'],
      [/\binfinitive\b/i, 'infinitive usage'],
      [/\bpor\b.*\bpara\b|\bpara\b.*\bpor\b/i, 'por vs para'],
      [/\bdirect\s+object\b|\bindirect\s+object\b/i, 'object pronouns'],
      [/\birregular\b/i, 'irregular verbs'],
      [/\bstem.?chang/i, 'stem-changing verbs'],
      [/\brelative\s+clause\b|\brelative\s+pronoun/i, 'relative clauses'],
      [/\bpassive\b/i, 'passive voice'],
      [/\bperipher/i, 'verbal periphrasis'],
    ];

    for (const [re, label] of conceptPatterns) {
      const matches = (tipText.match(new RegExp(re.source, 'gi')) || []).length;
      if (matches > 0) concepts.push({ concept: label, count: matches });
    }
    concepts.sort((a, b) => b.count - a.count);

    // Sample English sentences to understand difficulty
    const sampleEnglish = cards.slice(0, 5).map(c => c.english);
    const avgWordCount = cards.reduce((s, c) => s + (c.english || '').split(/\s+/).length, 0) / cards.length;

    nodeInfo[n] = {
      cardCount: cards.length,
      tipsCount: tips.length,
      tipsPercent: ((tips.length / cards.length) * 100).toFixed(1) + '%',
      topConcepts: concepts.slice(0, 3),
      avgWordCount: avgWordCount.toFixed(1),
      sampleEnglish
    };
  }

  // Check logical progression
  const progressionIssues = [];
  // We expect average word count / complexity to generally increase
  const nodeNums = nodeNames.filter(n => n.startsWith('node-')).sort();
  for (let i = 1; i < nodeNums.length; i++) {
    const prev = nodeInfo[nodeNums[i - 1]];
    const curr = nodeInfo[nodeNums[i]];
    // Big drops in complexity might indicate issues
    if (parseFloat(curr.avgWordCount) < parseFloat(prev.avgWordCount) - 2) {
      progressionIssues.push({
        from: nodeNums[i - 1],
        to: nodeNums[i],
        issue: `Average word count drops from ${prev.avgWordCount} to ${curr.avgWordCount}`
      });
    }
  }

  return { nodeInfo, progressionIssues };
}

// ─── RUN ALL AUDITS ──────────────────────────────────────────────────────────
console.log(`Spanish Deck: ${deck.length} cards`);
console.log('Running comprehensive structural audit...\n');

const priorities = auditPriorities();
const levels = auditLevelAppropriateness();
const tags = auditTagAccuracy();
const vocab = auditVocabCoverage();
const transitions = auditNodeTransitions();

const report = {
  metadata: {
    deck: 'Spanish',
    totalCards: deck.length,
    auditDate: new Date().toISOString(),
    nodesCount: Object.keys(priorities.table).length
  },
  priorityWeighting: priorities,
  levelAppropriateness: levels,
  tagAccuracy: tags,
  vocabularyCoverage: vocab,
  nodeTransitions: transitions
};

// Write JSON
const outDir = path.join(ROOT, 'scripts/output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'audit-es-structural.json'), JSON.stringify(report, null, 2));
console.log('JSON report written to scripts/output/audit-es-structural.json\n');

// ─── HUMAN-READABLE SUMMARY ─────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════');
console.log('  SPANISH DECK – COMPREHENSIVE STRUCTURAL AUDIT');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Priority Weighting
console.log('── 1. PRIORITY WEIGHTING BY NODE ──────────────────────────────');
console.log('Node       │ P1   P2   P3  │ Total │ Distribution');
console.log('───────────┼────────────────┼───────┼─────────────');
for (const [n, d] of Object.entries(priorities.table).sort((a, b) => a[0].localeCompare(b[0]))) {
  const pct1 = ((d.P1 / d.total) * 100).toFixed(0);
  const pct2 = ((d.P2 / d.total) * 100).toFixed(0);
  const pct3 = ((d.P3 / d.total) * 100).toFixed(0);
  console.log(`${n.padEnd(10)} │ ${String(d.P1).padStart(3)}  ${String(d.P2).padStart(3)}  ${String(d.P3).padStart(3)} │ ${String(d.total).padStart(5)} │ ${pct1}% / ${pct2}% / ${pct3}%`);
}
console.log('\nPriority flags:');
if (priorities.flags.length === 0) {
  console.log('  ✓ No priority weighting issues detected');
} else {
  for (const f of priorities.flags) {
    console.log(`  ⚠ ${f.node}: ${f.issue}`);
  }
}

// 2. Level Appropriateness
console.log('\n── 2. LEVEL APPROPRIATENESS ────────────────────────────────────');
console.log(`Total cards sampled: ${levels.totalSampled}`);
console.log(`Misplaced cards found: ${levels.misplaced.length}`);
if (levels.misplaced.length > 0) {
  console.log('\nMisplaced cards:');
  for (const m of levels.misplaced.slice(0, 30)) {
    console.log(`  ${m.id} (${m.node}): "${m.english}"`);
    console.log(`    Reason: ${m.reason}`);
  }
  if (levels.misplaced.length > 30) {
    console.log(`  ... and ${levels.misplaced.length - 30} more`);
  }
}

// 3. Tag Accuracy
console.log('\n── 3. TAG COVERAGE ACCURACY ────────────────────────────────────');
for (const [tag, data] of Object.entries(tags)) {
  if (tag === 'general') {
    console.log(`${tag}: ${data.totalTagged} cards tagged`);
    continue;
  }
  console.log(`${tag}: ${data.totalTagged} tagged, ${data.sampled} sampled, ${data.correct} matched keywords → ${data.accuracy} accuracy`);
  if (data.mismatches.length > 0) {
    console.log(`  Non-obvious matches (may still be valid, just not keyword-matched):`);
    for (const m of data.mismatches.slice(0, 5)) {
      console.log(`    ${m.id}: "${m.english}"`);
    }
    if (data.mismatches.length > 5) console.log(`    ... and ${data.mismatches.length - 5} more`);
  }
}

// 4. Vocabulary Coverage
console.log('\n── 4. ESSENTIAL VOCABULARY COVERAGE ────────────────────────────');
for (const [cat, data] of Object.entries(vocab)) {
  const status = data.missing.length === 0 ? '✓ COMPLETE' : `⚠ MISSING ${data.missing.length}`;
  console.log(`${cat.padEnd(14)}: ${data.coverage} (${data.found}/${data.total}) ${status}`);
  if (data.missing.length > 0) {
    console.log(`  Missing: ${data.missing.join(', ')}`);
  }
}

// 5. Node Transitions
console.log('\n── 5. NODE TRANSITION ANALYSIS ─────────────────────────────────');
for (const [n, info] of Object.entries(transitions.nodeInfo).sort((a, b) => a[0].localeCompare(b[0]))) {
  const concepts = info.topConcepts.map(c => c.concept).join(', ') || '(no clear concept from tips)';
  console.log(`${n}: ${info.cardCount} cards, ${info.tipsPercent} tips, avg ${info.avgWordCount} words`);
  console.log(`  Concepts: ${concepts}`);
}

if (transitions.progressionIssues.length > 0) {
  console.log('\nProgression issues:');
  for (const p of transitions.progressionIssues) {
    console.log(`  ⚠ ${p.from} → ${p.to}: ${p.issue}`);
  }
} else {
  console.log('\n  ✓ No major progression issues detected');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  AUDIT COMPLETE');
console.log('═══════════════════════════════════════════════════════════════');
