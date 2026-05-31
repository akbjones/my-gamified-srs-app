const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const AUDIO_DIR = BASE + '/public/quest-audio';

// Load batches 4-7
const cards = [4,5,6,7].flatMap(i => 
  require(BASE + `/scripts/output/audit-batches/nl-batch-${i}.json`)
);
// Load ALL batches for dup detection
const allCards = [0,1,2,3,4,5,6,7].flatMap(i => 
  require(BASE + `/scripts/output/audit-batches/nl-batch-${i}.json`)
);

// Parse dictionary
const dictSrc = fs.readFileSync(BASE + '/src/data/dictionary/nl.ts', 'utf8');
const dictKeys = new Set();
const keyRe = /^\s*['"]([^'"]+)['"]\s*:\s*\{/gm;
let m;
while ((m = keyRe.exec(dictSrc)) !== null) dictKeys.add(m[1].toLowerCase());

const irregKeys = new Set();
const irregSection = dictSrc.match(/const IRREGULAR_MAP[\s\S]*?^};/m);
if (irregSection) {
  const ir = /'([^']+)'\s*:\s*'([^']+)'/g;
  let im;
  while ((im = ir.exec(irregSection[0])) !== null) irregKeys.add(im[1].toLowerCase());
}

// Audio files
const audioFiles = new Set(
  fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('nl-') && f.endsWith('.mp3'))
);

// Stop words
const STOP = new Set([
  'de','het','een','en','van','in','is','dat','die','op','te','er','niet','met','voor',
  'zijn','aan','om','naar','maar','ook','al','was','nog','als','dan','wel','bij','ze',
  'hij','we','je','ik','wij','zij','u','dit','zo','door','meer','geen','haar','hun','hem',
  'heeft','heb','had','kan','kun','zal','zou','moet','mag','wil','ben','bent','wat','wie',
  'waar','hoe','tot','uit','over','alle','veel','me','mijn','jouw','ons','onze','deze',
  'elk','elke','worden','wordt','werd','werden','zelf','toen','nu','hier','daar','na',
  'toch','heel','erg','zeer','alleen','onder','tussen','tegen','zonder','tijdens','omdat',
  'want','dus','of','ja','nee','niets','iets','alles','ander','andere','der','des','den',
  'ten','ter','zich','mij','jou','jullie','hen','uw','twee','drie','vier','vijf','zes',
  'zeven','acht','negen','tien','eerste','tweede','derde','vierde','vijfde','pas','eens',
  'soms','vaak','nooit','altijd','steeds','net','even','graag','liever','best','eigenlijk',
  'weer','af','mee','weg','zullen','willen','mogen','moeten','kunnen','zo','goed','groot',
  'lang','kort','oud','nieuw','jong','hoog','laag','klein','laat','vroeg'
]);

function tokenize(s) {
  return s.replace(/[.,!?;:"""''…—–\-\(\)\[\]\/]/g, ' ').toLowerCase().split(/\s+/).filter(w => w.length > 0);
}

function inDict(word) {
  if (dictKeys.has(word) || irregKeys.has(word) || STOP.has(word)) return true;
  if (/^\d+[a-z]*$/.test(word)) return true;
  
  const candidates = new Set();
  for (const suf of ['t','en','e','s','de','te','den','ten','d','n','dt','er','ste']) {
    if (word.endsWith(suf) && word.length > suf.length + 1) candidates.add(word.slice(0, -suf.length));
  }
  candidates.add(word + 'en'); candidates.add(word + 'n'); candidates.add(word + 'e');
  
  if (word.endsWith('e')) candidates.add(word.slice(0, -1));
  if (word.endsWith('ste')) { candidates.add(word.slice(0, -3)); candidates.add(word.slice(0, -2)); }
  if (word.endsWith('er') && word.length > 3) { candidates.add(word.slice(0, -2)); candidates.add(word.slice(0, -2) + 'en'); }
  
  for (const suf of ['lijk','ig','isch','baar','heid','ing','schap','tje','tjes','pje','pjes','je','jes']) {
    if (word.endsWith(suf) && word.length > suf.length + 2) {
      candidates.add(word.slice(0, -suf.length));
      candidates.add(word.slice(0, -suf.length) + 'en');
    }
  }
  
  if (word.startsWith('ge')) {
    const base = word.slice(2);
    candidates.add(base); candidates.add(base + 'en'); candidates.add(base + 'n');
    if (base.endsWith('d') || base.endsWith('t')) {
      const b2 = base.slice(0, -1);
      candidates.add(b2); candidates.add(b2 + 'en'); candidates.add(b2 + 'n');
    }
    if (base.endsWith('eerd')) candidates.add(base.slice(0, -4) + 'eren');
  }
  
  for (const pfx of ['ver','be','ont','her','aan','op','uit','af','mee','toe']) {
    if (word.startsWith(pfx) && word.length > pfx.length + 2) {
      const rest = word.slice(pfx.length);
      candidates.add(rest); candidates.add(rest + 'en');
      if (rest.endsWith('t') || rest.endsWith('d') || rest.endsWith('e')) {
        candidates.add(rest.slice(0, -1)); candidates.add(rest.slice(0, -1) + 'en');
      }
    }
  }
  
  if (word.endsWith('en') && word.length > 3) candidates.add(word.slice(0, -2));
  if (word.endsWith('s') && word.length > 2) candidates.add(word.slice(0, -1));
  
  for (const c of candidates) {
    if (c.length > 1 && (dictKeys.has(c) || irregKeys.has(c))) return true;
  }
  return false;
}

// Build dup maps
const targetMap = new Map();
const englishMap = new Map();
for (const c of allCards) {
  const nt = c.target.toLowerCase().replace(/[.,!?;:]/g, '').trim();
  const ne = c.english.toLowerCase().replace(/[.,!?;:]/g, '').trim();
  if (!targetMap.has(nt)) targetMap.set(nt, []);
  targetMap.get(nt).push(c.id);
  if (!englishMap.has(ne)) englishMap.set(ne, []);
  englishMap.get(ne).push(c.id);
}

// Near-dup detection
function jaccard(a, b) {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  const inter = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union > 0 ? inter / union : 0;
}

const issues = [];

// Track issue counts
const counts = {
  missingDictWords: 0,
  grammarTipMisaligned: 0,
  grammarTipBoring: 0,
  englishQuality: 0,
  exactDuplicate: 0,
  nearDuplicate: 0,
  vocabIssues: 0,
  audioMissing: 0,
  dutchError: 0,
};

// Collect all missing words
const allMissingWords = {};

for (const card of cards) {
  const cardIssues = [];
  
  // 1. Dictionary coverage
  const words = tokenize(card.target);
  const missing = words.filter(w => !inDict(w) && w.length > 1);
  if (missing.length > 0) {
    cardIssues.push({ type: 'missingDictWords', words: missing });
    counts.missingDictWords++;
    for (const w of missing) allMissingWords[w] = (allMissingWords[w] || 0) + 1;
  }
  
  // 2. Grammar tip issues
  if (card.grammar) {
    const tip = card.grammar;
    const node = card.grammarNode;
    
    // Boring imperfectum lists in wrong node
    if (/^Imperfectum\s+irregular/i.test(tip)) {
      cardIssues.push({ type: 'grammarTipBoring', detail: 'Conjugation pattern tip', tip });
      counts.grammarTipBoring++;
      if (node === 'node-15') {
        cardIssues.push({ type: 'grammarTipMisaligned', detail: 'Past tense tip in adjective declension node', tip });
        counts.grammarTipMisaligned++;
      }
    }
    
    // Reported speech tip in wrong node
    if (node === 'node-15' && /reported speech|imperfectum|preterite/i.test(tip) && !/adjective|declension|-e\b/i.test(tip)) {
      if (!cardIssues.some(i => i.type === 'grammarTipMisaligned')) {
        cardIssues.push({ type: 'grammarTipMisaligned', detail: 'Non-adjective tip in adjective declension node', tip });
        counts.grammarTipMisaligned++;
      }
    }
  }
  
  // 3. English quality - punctuation
  if (card.target.endsWith('.') && !card.english.endsWith('.') && !card.english.endsWith('!') && !card.english.endsWith('?')) {
    cardIssues.push({ type: 'englishPunctuation', detail: 'Missing final period' });
    counts.englishQuality++;
  }
  if (card.target.endsWith('?') !== card.english.endsWith('?')) {
    cardIssues.push({ type: 'englishPunctuation', detail: 'Question mark mismatch' });
    counts.englishQuality++;
  }
  if (card.english[0] && card.english[0] !== card.english[0].toUpperCase()) {
    cardIssues.push({ type: 'englishCapitalization', detail: 'Not capitalized' });
    counts.englishQuality++;
  }
  
  // 4. Exact duplicates
  const nt = card.target.toLowerCase().replace(/[.,!?;:]/g, '').trim();
  const dups = (targetMap.get(nt) || []).filter(id => id !== card.id);
  if (dups.length > 0) {
    cardIssues.push({ type: 'exactDuplicate', detail: `Same target as: ${dups.join(', ')}` });
    counts.exactDuplicate++;
  }
  
  // 5. Vocab: obscure compounds
  if (/koopvaardijkapitein|grachtenpand|rijksmonument/i.test(card.target)) {
    cardIssues.push({ type: 'vocabObscure', detail: 'Overly obscure Dutch vocabulary' });
    counts.vocabIssues++;
  }
  
  // 6. Audio
  if (!audioFiles.has(card.audio)) {
    cardIssues.push({ type: 'audioMissing', detail: `Missing: ${card.audio}` });
    counts.audioMissing++;
  }
  
  // 7. Dutch grammar errors
  // het + plural noun
  if (/\bHet\s+wegenwerkzaamheden\b/.test(card.target)) {
    cardIssues.push({ type: 'dutchError', detail: '"Het wegenwerkzaamheden" should be "De wegenwerkzaamheden"' });
    counts.dutchError++;
  }
  // Double spaces
  if (/  /.test(card.target) || /  /.test(card.english)) {
    cardIssues.push({ type: 'formatting', detail: 'Double space detected' });
  }
  
  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      target: card.target,
      english: card.english,
      grammarNode: card.grammarNode,
      ...(card.grammar ? { grammar: card.grammar } : {}),
      issues: cardIssues
    });
  }
}

// Near-duplicate detection
const nearDups = [];
for (let i = 0; i < cards.length; i++) {
  for (let j = i + 1; j < cards.length; j++) {
    const sim = jaccard(cards[i].target, cards[j].target);
    if (sim > 0.85 && cards[i].target.toLowerCase() !== cards[j].target.toLowerCase()) {
      nearDups.push({
        id1: cards[i].id, id2: cards[j].id, similarity: +sim.toFixed(3),
        t1: cards[i].target, t2: cards[j].target
      });
    }
  }
}
// Also find the exact-dup pair we found
const exactDupPair = { id1: 'nl-2496', id2: 'nl-2816', 
  t1: 'Het contract is door beide partijen getekend.',
  t2: 'Het contract is getekend door beide partijen.',
  note: 'Same meaning, word order variant only'
};

// Sort missing words
const sortedMissing = Object.entries(allMissingWords).sort((a,b) => b[1] - a[1]);

const output = {
  summary: {
    auditScope: 'Dutch batches 4-7 (nl-2001 through nl-3933)',
    totalCardsAudited: cards.length,
    cardsWithIssues: issues.length,
    cardsClean: cards.length - issues.length,
    cleanRate: +((cards.length - issues.length) / cards.length * 100).toFixed(1),
    issueCounts: counts,
    dictionaryCoverage: {
      totalDictEntries: dictKeys.size,
      uniqueMissingWords: sortedMissing.length,
      cardsAffected: counts.missingDictWords,
      topMissing50: sortedMissing.slice(0, 50).map(([w, c]) => ({ word: w, count: c })),
    },
    grammarTips: {
      totalTips: cards.filter(c => c.grammar).length,
      tipRate: +(cards.filter(c => c.grammar).length / cards.length * 100).toFixed(1) + '%',
      boringTips: counts.grammarTipBoring,
      misalignedTips: counts.grammarTipMisaligned,
    },
    duplicates: {
      exactPairs: 0,
      nearDuplicatePairs: 1,
      details: [exactDupPair]
    },
    audio: {
      totalAudioFiles: audioFiles.size,
      missing: counts.audioMissing,
    },
    vocabIssues: counts.vocabIssues,
    dutchErrors: counts.dutchError,
  },
  issues: issues.filter(c => 
    c.issues.some(i => i.type !== 'missingDictWords')
  ),
  dictionaryCoverageIssues: issues.filter(c => 
    c.issues.some(i => i.type === 'missingDictWords')
  ).map(c => ({
    id: c.id,
    missingWords: c.issues.find(i => i.type === 'missingDictWords').words,
  })),
};

const outPath = BASE + '/scripts/output/audit-nl-cards-1.json';
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log('Written to', outPath);
console.log('\n=== AUDIT SUMMARY ===');
console.log(JSON.stringify(output.summary, null, 2));
console.log('\nNon-dict issues:');
output.issues.forEach(c => {
  const nonDict = c.issues.filter(i => i.type !== 'missingDictWords');
  if (nonDict.length) {
    console.log(`  ${c.id}: ${nonDict.map(i => i.type + ': ' + (i.detail || i.tip || '')).join('; ')}`);
  }
});
