#!/usr/bin/env node
/**
 * Comprehensive structural audit for Turkish and Russian decks.
 * Checks: priority balance, level appropriateness, tag accuracy,
 * essential vocab coverage, node transition logic.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const OUTPUT = path.join(__dirname, 'output');

const LANGUAGES = [
  { code: 'tr', name: 'Turkish', file: 'src/data/turkish/deck.json' },
  { code: 'ru', name: 'Russian', file: 'src/data/russian/deck.json' },
];

// Essential vocabulary categories with expected words
const ESSENTIAL_VOCAB = {
  numbers: {
    tr: ['bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'yüz', 'bin', 'sıfır', 'yirmi', 'otuz', 'kırk', 'elli'],
    ru: ['один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять', 'сто', 'тысяча', 'ноль', 'двадцать', 'тридцать'],
  },
  colors: {
    tr: ['kırmızı', 'mavi', 'yeşil', 'sarı', 'beyaz', 'siyah', 'turuncu', 'mor', 'kahverengi', 'pembe', 'gri'],
    ru: ['красный', 'синий', 'зелёный', 'зеленый', 'жёлтый', 'желтый', 'белый', 'чёрный', 'черный', 'оранжевый', 'розовый', 'серый', 'голубой'],
  },
  directions: {
    tr: ['sağ', 'sol', 'düz', 'ileri', 'geri', 'kuzey', 'güney', 'doğu', 'batı', 'yukarı', 'aşağı'],
    ru: ['направо', 'налево', 'прямо', 'вперёд', 'вперед', 'назад', 'север', 'юг', 'восток', 'запад', 'вверх', 'вниз', 'право', 'лево'],
  },
  body_parts: {
    tr: ['baş', 'göz', 'kulak', 'burun', 'ağız', 'el', 'ayak', 'bacak', 'kol', 'parmak', 'diş', 'saç', 'kalp', 'karın', 'omuz', 'diz', 'boyun'],
    ru: ['голова', 'глаз', 'ухо', 'нос', 'рот', 'рука', 'нога', 'палец', 'зуб', 'волос', 'сердце', 'живот', 'плечо', 'колено', 'шея', 'спина'],
  },
  animals: {
    tr: ['kedi', 'köpek', 'kuş', 'balık', 'at', 'inek', 'koyun', 'tavuk', 'arı', 'kaplumbağa', 'aslan', 'fil', 'ayı', 'tavşan', 'fare'],
    ru: ['кошка', 'кот', 'собака', 'птица', 'рыба', 'лошадь', 'корова', 'овца', 'курица', 'медведь', 'лев', 'слон', 'заяц', 'мышь', 'волк'],
  },
  family: {
    tr: ['anne', 'baba', 'kardeş', 'abla', 'ağabey', 'dede', 'nine', 'amca', 'hala', 'teyze', 'dayı', 'oğul', 'kız', 'eş', 'çocuk', 'aile'],
    ru: ['мать', 'мама', 'отец', 'папа', 'брат', 'сестра', 'дедушка', 'бабушка', 'дядя', 'тётя', 'тетя', 'сын', 'дочь', 'муж', 'жена', 'ребёнок', 'ребенок', 'семья'],
  },
  days: {
    tr: ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar', 'hafta', 'gün', 'bugün', 'yarın', 'dün'],
    ru: ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье', 'неделя', 'день', 'сегодня', 'завтра', 'вчера'],
  },
  food: {
    tr: ['ekmek', 'su', 'çay', 'kahve', 'süt', 'et', 'peynir', 'pilav', 'yumurta', 'meyve', 'sebze', 'balık', 'şeker', 'tuz', 'yemek'],
    ru: ['хлеб', 'вода', 'чай', 'кофе', 'молоко', 'мясо', 'сыр', 'рис', 'яйцо', 'фрукт', 'овощ', 'рыба', 'сахар', 'соль', 'еда', 'суп'],
  },
  basic_phrases: {
    tr: ['merhaba', 'günaydın', 'hoşça kal', 'teşekkür', 'lütfen', 'evet', 'hayır', 'özür', 'pardon', 'nasılsınız', 'iyi', 'tamam', 'hoş geldiniz'],
    ru: ['привет', 'здравствуйте', 'спасибо', 'пожалуйста', 'да', 'нет', 'извините', 'хорошо', 'ладно', 'до свидания', 'пока', 'добро пожаловать'],
  },
};

// Node descriptions for transition logic analysis
const NODE_PROGRESSION = [
  { id: 'node-01', level: 'A1', desc: 'Basic greetings, introductions' },
  { id: 'node-02', level: 'A1', desc: 'Simple present tense' },
  { id: 'node-03', level: 'A1', desc: 'Questions and negation' },
  { id: 'node-04', level: 'A1', desc: 'Numbers, time, dates' },
  { id: 'node-05', level: 'A1', desc: 'Basic nouns and articles' },
  { id: 'node-06', level: 'A1', desc: 'Possessives and pronouns' },
  { id: 'node-07', level: 'A1', desc: 'Adjectives and descriptions' },
  { id: 'node-08', level: 'A1', desc: 'Prepositions and locations' },
  { id: 'node-09', level: 'A1+', desc: 'Daily routines, habits' },
  { id: 'node-10', level: 'A1+', desc: 'Food, ordering, shopping' },
  { id: 'node-11', level: 'A2', desc: 'Past tense basics' },
  { id: 'node-12', level: 'A2', desc: 'Future tense basics' },
  { id: 'node-13', level: 'A2', desc: 'Modal verbs, ability' },
  { id: 'node-14', level: 'A2', desc: 'Comparatives, superlatives' },
  { id: 'node-15', level: 'A2', desc: 'Travel and directions' },
  { id: 'node-16', level: 'A2', desc: 'Health and body' },
  { id: 'node-17', level: 'A2', desc: 'Weather and nature' },
  { id: 'node-18', level: 'A2+', desc: 'Compound sentences' },
  { id: 'node-19', level: 'A2+', desc: 'Adverbs and frequency' },
  { id: 'node-20', level: 'A2+', desc: 'Work and professions' },
  { id: 'node-21', level: 'B1', desc: 'Relative clauses' },
  { id: 'node-22', level: 'B1', desc: 'Reported speech' },
  { id: 'node-23', level: 'B1', desc: 'Conditional sentences' },
  { id: 'node-24', level: 'B1', desc: 'Passive voice' },
  { id: 'node-25', level: 'B1', desc: 'Abstract vocabulary' },
  { id: 'node-26', level: 'B1', desc: 'Formal register' },
  { id: 'node-27', level: 'B1+', desc: 'Subjunctive / wishes' },
  { id: 'node-28', level: 'B1+', desc: 'Advanced connectors' },
  { id: 'node-29', level: 'B1+', desc: 'Idiomatic expressions' },
  { id: 'node-30', level: 'B2', desc: 'Complex tenses' },
  { id: 'node-31', level: 'B2', desc: 'Nuanced vocabulary' },
  { id: 'node-32', level: 'B2', desc: 'Academic/professional' },
  { id: 'node-33', level: 'B2', desc: 'Literature and culture' },
  { id: 'node-34', level: 'B2+', desc: 'Advanced constructions' },
  { id: 'node-35', level: 'B2+', desc: 'Mastery and fluency' },
];

function auditDeck(langConfig) {
  const { code, name, file } = langConfig;
  const deckPath = path.join(BASE, file);
  const cards = JSON.parse(fs.readFileSync(deckPath, 'utf8'));

  const report = {
    language: name,
    code,
    totalCards: cards.length,
    timestamp: new Date().toISOString(),
    sections: {},
  };

  // ========== 1. PRIORITY BALANCE PER NODE ==========
  const nodeMap = {};
  for (const card of cards) {
    const node = card.grammarNode || 'unknown';
    if (!nodeMap[node]) nodeMap[node] = { total: 0, byPriority: {}, cards: [], tags: {} };
    nodeMap[node].total++;
    const p = card.priority || 0;
    nodeMap[node].byPriority[p] = (nodeMap[node].byPriority[p] || 0) + 1;
    nodeMap[node].cards.push(card);
    for (const tag of (card.tags || [])) {
      nodeMap[node].tags[tag] = (nodeMap[node].tags[tag] || 0) + 1;
    }
  }

  const priorityBalance = {};
  const priorityIssues = [];
  for (const [node, data] of Object.entries(nodeMap).sort()) {
    const { byPriority, total } = data;
    const p1 = byPriority[1] || 0;
    const p2 = byPriority[2] || 0;
    const p3 = byPriority[3] || 0;
    const p1pct = ((p1 / total) * 100).toFixed(1);
    const p2pct = ((p2 / total) * 100).toFixed(1);
    const p3pct = ((p3 / total) * 100).toFixed(1);

    priorityBalance[node] = { total, p1, p2, p3, p1pct: +p1pct, p2pct: +p2pct, p3pct: +p3pct };

    // Flag if any priority is missing or wildly unbalanced
    if (p1 === 0) priorityIssues.push(`${node}: NO priority-1 cards`);
    if (p2 === 0) priorityIssues.push(`${node}: NO priority-2 cards`);
    if (p3 === 0) priorityIssues.push(`${node}: NO priority-3 cards`);
    if (total > 50 && p1 > total * 0.7) priorityIssues.push(`${node}: p1 is ${p1pct}% — too front-heavy`);
    if (total > 50 && p3 > total * 0.6) priorityIssues.push(`${node}: p3 is ${p3pct}% — too back-heavy`);
  }

  report.sections.priorityBalance = {
    summary: `${Object.keys(nodeMap).length} nodes, ${priorityIssues.length} issues`,
    perNode: priorityBalance,
    issues: priorityIssues,
  };

  // ========== 2. LEVEL APPROPRIATENESS ==========
  // Cards in nodes 15+ should have average word count >= 5 (more complex sentences)
  const levelIssues = [];
  const levelStats = {};
  for (const [node, data] of Object.entries(nodeMap).sort()) {
    const nodeNum = parseInt(node.replace('node-', ''));
    const avgWords = data.cards.reduce((s, c) => s + c.target.split(/\s+/).length, 0) / data.total;
    const avgEnglishWords = data.cards.reduce((s, c) => s + c.english.split(/\s+/).length, 0) / data.total;
    const tipsCount = data.cards.filter(c => c.grammar && c.grammar.trim()).length;
    const tipsPct = ((tipsCount / data.total) * 100).toFixed(1);

    levelStats[node] = {
      total: data.total,
      avgTargetWords: +avgWords.toFixed(1),
      avgEnglishWords: +avgEnglishWords.toFixed(1),
      grammarTips: tipsCount,
      tipsPct: +tipsPct,
    };

    // Check sentence complexity grows with level
    if (nodeNum >= 15 && data.total >= 15 && avgWords < 4) {
      levelIssues.push(`${node} (level ${nodeNum}): avg only ${avgWords.toFixed(1)} words — too simple for this level`);
    }
    if (nodeNum >= 25 && data.total >= 10 && avgWords < 5) {
      levelIssues.push(`${node} (level ${nodeNum}): avg only ${avgWords.toFixed(1)} words — expected B1+ complexity`);
    }
    // Nodes should have enough cards
    if (data.total < 50) {
      levelIssues.push(`${node}: only ${data.total} cards — below minimum 50`);
    }
  }

  report.sections.levelAppropriateness = {
    summary: `${levelIssues.length} issues found`,
    perNode: levelStats,
    issues: levelIssues,
  };

  // ========== 3. TAG ACCURACY ==========
  const tagCounts = {};
  for (const card of cards) {
    for (const tag of (card.tags || [])) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const tagIssues = [];
  const expectedTags = ['general', 'travel', 'work', 'family'];
  for (const tag of expectedTags) {
    const count = tagCounts[tag] || 0;
    if (count < 50) {
      tagIssues.push(`Tag "${tag}": only ${count} cards — below minimum 50`);
    }
  }

  // Check general tag coverage
  const noGeneral = cards.filter(c => !(c.tags || []).includes('general'));
  if (noGeneral.length > 0) {
    tagIssues.push(`${noGeneral.length} cards missing "general" tag`);
  }

  // Check cards with no tags
  const noTags = cards.filter(c => !c.tags || c.tags.length === 0);
  if (noTags.length > 0) {
    tagIssues.push(`${noTags.length} cards have NO tags at all`);
  }

  // Check tag distribution per node (each node should have some tag variety)
  const tagDistPerNode = {};
  for (const [node, data] of Object.entries(nodeMap)) {
    const nodeTags = data.tags;
    tagDistPerNode[node] = nodeTags;
    const nonGeneralTags = Object.keys(nodeTags).filter(t => t !== 'general');
    if (nonGeneralTags.length === 0 && data.total > 20) {
      tagIssues.push(`${node}: only "general" tag — needs travel/work/family variety`);
    }
  }

  // Spot-check: are travel-tagged cards actually travel-related?
  const travelCards = cards.filter(c => (c.tags || []).includes('travel'));
  const travelKeywords = code === 'tr'
    ? ['otel', 'bilet', 'uçak', 'tren', 'otobüs', 'bavul', 'pasaport', 'yol', 'harita', 'tur', 'gez', 'seyahat', 'tatil', 'rezerv', 'valiz', 'ulaş', 'araba', 'taksi', 'oto', 'havalimanı', 'gar', 'istasyon']
    : ['отель', 'гостиниц', 'билет', 'самолёт', 'самолет', 'поезд', 'автобус', 'чемодан', 'паспорт', 'дорог', 'карт', 'тур', 'путешеств', 'отпуск', 'бронир', 'такси', 'аэропорт', 'вокзал', 'станци'];

  const suspiciousTravel = travelCards.filter(c => {
    const text = (c.target + ' ' + c.english).toLowerCase();
    return !travelKeywords.some(kw => text.includes(kw)) &&
           !text.includes('travel') && !text.includes('trip') && !text.includes('visit') &&
           !text.includes('hotel') && !text.includes('flight') && !text.includes('train') &&
           !text.includes('bus') && !text.includes('restaurant') && !text.includes('city') &&
           !text.includes('country') && !text.includes('abroad') && !text.includes('airport') &&
           !text.includes('ticket') && !text.includes('book') && !text.includes('reserv');
  });

  report.sections.tagAccuracy = {
    summary: `${tagIssues.length} issues, ${Object.keys(tagCounts).length} distinct tags`,
    tagCounts,
    tagDistPerNode,
    issues: tagIssues,
    suspiciousTravelCount: suspiciousTravel.length,
    suspiciousTravelSample: suspiciousTravel.slice(0, 10).map(c => ({ id: c.id, target: c.target, english: c.english })),
  };

  // ========== 4. ESSENTIAL VOCAB COVERAGE ==========
  const allText = cards.map(c => c.target.toLowerCase()).join(' ');
  const vocabReport = {};

  for (const [category, words] of Object.entries(ESSENTIAL_VOCAB)) {
    const langWords = words[code] || [];
    const found = [];
    const missing = [];

    for (const word of langWords) {
      // Use word boundary-ish check (space/start/end/punctuation around the word)
      const regex = new RegExp(`(?:^|[\\s,.!?;:'"()])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[\\s,.!?;:'"()])`, 'i');
      if (regex.test(' ' + allText + ' ') || allText.includes(word.toLowerCase())) {
        found.push(word);
      } else {
        missing.push(word);
      }
    }

    vocabReport[category] = {
      total: langWords.length,
      found: found.length,
      missing: missing.length,
      foundWords: found,
      missingWords: missing,
      coverage: langWords.length > 0 ? +((found.length / langWords.length) * 100).toFixed(1) : 0,
    };
  }

  report.sections.essentialVocab = {
    summary: Object.entries(vocabReport).map(([cat, r]) => `${cat}: ${r.found}/${r.total} (${r.coverage}%)`).join(', '),
    categories: vocabReport,
  };

  // ========== 5. NODE TRANSITION LOGIC ==========
  const transitionIssues = [];
  const nodeOrder = Object.keys(nodeMap).sort();

  // Check for monotonically increasing complexity
  let prevAvgWords = 0;
  let decreaseStreak = 0;
  for (const node of nodeOrder) {
    const data = nodeMap[node];
    const avgWords = data.cards.reduce((s, c) => s + c.target.split(/\s+/).length, 0) / data.total;
    const nodeNum = parseInt(node.replace('node-', ''));

    if (avgWords < prevAvgWords - 1.5 && nodeNum > 5) {
      decreaseStreak++;
      if (decreaseStreak >= 2) {
        transitionIssues.push(`Complexity drop at ${node}: ${avgWords.toFixed(1)} words vs previous ${prevAvgWords.toFixed(1)}`);
      }
    } else {
      decreaseStreak = 0;
    }
    prevAvgWords = avgWords;
  }

  // Check ID ordering matches node ordering
  let lastIdInPrevNode = 0;
  for (const node of nodeOrder) {
    const data = nodeMap[node];
    const ids = data.cards.map(c => {
      const match = c.id.match(/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }).sort((a, b) => a - b);

    const minId = ids[0];
    const maxId = ids[ids.length - 1];

    // IDs don't need to be sequential, but priority ordering within node should make sense
    const p1Cards = data.cards.filter(c => c.priority === 1);
    const p2Cards = data.cards.filter(c => c.priority === 2);
    const p3Cards = data.cards.filter(c => c.priority === 3);

    // Within each priority, check if there's a reasonable spread
    if (p1Cards.length > 0 && p3Cards.length > 0) {
      const p1AvgWords = p1Cards.reduce((s, c) => s + c.target.split(/\s+/).length, 0) / p1Cards.length;
      const p3AvgWords = p3Cards.reduce((s, c) => s + c.target.split(/\s+/).length, 0) / p3Cards.length;
      // p1 should generally be simpler or equal to p3 within same node
      if (p1AvgWords > p3AvgWords + 2) {
        transitionIssues.push(`${node}: p1 cards (${p1AvgWords.toFixed(1)} avg words) MORE complex than p3 (${p3AvgWords.toFixed(1)}) — priority inversion`);
      }
    }
  }

  // Check for gaps in node numbering
  const nodeNums = nodeOrder.map(n => parseInt(n.replace('node-', ''))).sort((a, b) => a - b);
  for (let i = 1; i < nodeNums.length; i++) {
    if (nodeNums[i] - nodeNums[i - 1] > 1) {
      transitionIssues.push(`Gap in node numbering: node-${String(nodeNums[i - 1]).padStart(2, '0')} to node-${String(nodeNums[i]).padStart(2, '0')}`);
    }
  }

  // Check first node starts at 01
  if (nodeNums[0] !== 1) {
    transitionIssues.push(`First node is node-${String(nodeNums[0]).padStart(2, '0')}, expected node-01`);
  }

  report.sections.nodeTransition = {
    summary: `${transitionIssues.length} transition issues across ${nodeOrder.length} nodes`,
    nodeRange: `node-${String(nodeNums[0]).padStart(2, '0')} to node-${String(nodeNums[nodeNums.length - 1]).padStart(2, '0')}`,
    issues: transitionIssues,
  };

  // ========== OVERALL SUMMARY ==========
  const totalIssues = priorityIssues.length + levelIssues.length + tagIssues.length + transitionIssues.length;
  report.overallSummary = {
    totalCards: cards.length,
    totalNodes: Object.keys(nodeMap).length,
    totalIssues,
    priorityIssues: priorityIssues.length,
    levelIssues: levelIssues.length,
    tagIssues: tagIssues.length,
    transitionIssues: transitionIssues.length,
    vocabCoverage: Object.entries(vocabReport).reduce((acc, [cat, r]) => {
      acc[cat] = `${r.found}/${r.total}`;
      return acc;
    }, {}),
  };

  return report;
}

// Run audits
for (const lang of LANGUAGES) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  STRUCTURAL AUDIT: ${lang.name.toUpperCase()}`);
  console.log('='.repeat(60));

  const report = auditDeck(lang);
  const outputFile = path.join(OUTPUT, `audit-${lang.code}-structural.json`);
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`Written to: ${outputFile}`);

  // Print summary
  console.log(`\nTotal cards: ${report.totalCards}`);
  console.log(`Total nodes: ${report.overallSummary.totalNodes}`);
  console.log(`Total issues: ${report.overallSummary.totalIssues}`);

  // Priority
  console.log(`\n--- PRIORITY BALANCE (${report.sections.priorityBalance.issues.length} issues) ---`);
  for (const [node, data] of Object.entries(report.sections.priorityBalance.perNode)) {
    console.log(`  ${node}: ${data.total} cards | p1=${data.p1}(${data.p1pct}%) p2=${data.p2}(${data.p2pct}%) p3=${data.p3}(${data.p3pct}%)`);
  }
  if (report.sections.priorityBalance.issues.length > 0) {
    console.log('  ISSUES:');
    for (const issue of report.sections.priorityBalance.issues) {
      console.log(`    - ${issue}`);
    }
  }

  // Level
  console.log(`\n--- LEVEL APPROPRIATENESS (${report.sections.levelAppropriateness.issues.length} issues) ---`);
  for (const [node, data] of Object.entries(report.sections.levelAppropriateness.perNode)) {
    console.log(`  ${node}: ${data.total} cards, avg ${data.avgTargetWords} words, tips ${data.tipsPct}%`);
  }
  if (report.sections.levelAppropriateness.issues.length > 0) {
    console.log('  ISSUES:');
    for (const issue of report.sections.levelAppropriateness.issues) {
      console.log(`    - ${issue}`);
    }
  }

  // Tags
  console.log(`\n--- TAG ACCURACY (${report.sections.tagAccuracy.issues.length} issues) ---`);
  console.log(`  Tag counts: ${JSON.stringify(report.sections.tagAccuracy.tagCounts)}`);
  console.log(`  Suspicious travel-tagged cards: ${report.sections.tagAccuracy.suspiciousTravelCount}`);
  if (report.sections.tagAccuracy.issues.length > 0) {
    console.log('  ISSUES:');
    for (const issue of report.sections.tagAccuracy.issues) {
      console.log(`    - ${issue}`);
    }
  }

  // Vocab
  console.log(`\n--- ESSENTIAL VOCAB COVERAGE ---`);
  for (const [cat, data] of Object.entries(report.sections.essentialVocab.categories)) {
    const status = data.coverage >= 80 ? 'OK' : data.coverage >= 50 ? 'PARTIAL' : 'LOW';
    console.log(`  ${cat}: ${data.found}/${data.total} (${data.coverage}%) [${status}]`);
    if (data.missingWords.length > 0) {
      console.log(`    Missing: ${data.missingWords.join(', ')}`);
    }
  }

  // Transitions
  console.log(`\n--- NODE TRANSITIONS (${report.sections.nodeTransition.issues.length} issues) ---`);
  console.log(`  Range: ${report.sections.nodeTransition.nodeRange}`);
  if (report.sections.nodeTransition.issues.length > 0) {
    for (const issue of report.sections.nodeTransition.issues) {
      console.log(`    - ${issue}`);
    }
  }
}

console.log('\nDone.');
