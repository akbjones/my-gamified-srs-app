const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const AUDIO_DIR = BASE + '/public/quest-audio';

// Load batches
const batches = [4,5,6,7].map(i => 
  require(BASE + `/scripts/output/audit-batches/nl-batch-${i}.json`)
);
const cards = batches.flat();
console.log(`Total cards to audit: ${cards.length}`);

// Load ALL batches for cross-batch duplicate detection
const allBatches = [0,1,2,3,4,5,6,7].map(i => 
  require(BASE + `/scripts/output/audit-batches/nl-batch-${i}.json`)
);
const allCards = allBatches.flat();

// Parse dictionary from TS source
const dictSrc = fs.readFileSync(BASE + '/src/data/dictionary/nl.ts', 'utf8');

// Extract all dictionary keys
const dictKeys = new Set();
const keyRe = /^\s*['"]([^'"]+)['"]\s*:\s*\{/gm;
let m;
while ((m = keyRe.exec(dictSrc)) !== null) {
  dictKeys.add(m[1].toLowerCase());
}
console.log(`Dictionary entries: ${dictKeys.size}`);

// Extract irregular map keys
const irregKeys = new Map(); // form -> lemma
const irregSection = dictSrc.match(/const IRREGULAR_MAP[\s\S]*?^};/m);
if (irregSection) {
  const irregRe = /'([^']+)'\s*:\s*'([^']+)'/g;
  let im;
  while ((im = irregRe.exec(irregSection[0])) !== null) {
    irregKeys.set(im[1].toLowerCase(), im[2].toLowerCase());
  }
}
console.log(`Irregular map entries: ${irregKeys.size}`);

// Build audio file set
const audioFiles = new Set();
try {
  const files = fs.readdirSync(AUDIO_DIR);
  for (const f of files) {
    if (f.startsWith('nl-') && f.endsWith('.mp3')) {
      audioFiles.add(f);
    }
  }
} catch(e) {}
console.log(`Audio files: ${audioFiles.size}`);

// Common Dutch function words / stop words
const STOP_WORDS = new Set([
  'de', 'het', 'een', 'en', 'van', 'in', 'is', 'dat', 'die', 'op', 'te',
  'er', 'niet', 'met', 'voor', 'zijn', 'aan', 'om', 'naar', 'maar', 'ook',
  'al', 'was', 'nog', 'als', 'dan', 'wel', 'bij', 'ze', 'hij', 'we', 'je',
  'ik', 'wij', 'zij', 'u', 'dit', 'zo', 'door', 'meer', 'geen', 'haar',
  'hun', 'hem', 'heeft', 'heb', 'had', 'kan', 'kun', 'zal', 'zou', 'moet',
  'mag', 'wil', 'ben', 'bent', 'wat', 'wie', 'waar', 'hoe', 'tot', 'uit',
  'over', 'alle', 'veel', 'me', 'mijn', 'jouw', 'ons', 'onze', 'deze',
  'elk', 'elke', 'worden', 'wordt', 'werd', 'werden', 'zelf', 'toen',
  'nu', 'hier', 'daar', 'na', 'toch', 'heel', 'erg', 'zeer', 'alleen',
  'onder', 'tussen', 'tegen', 'zonder', 'tijdens', 'omdat', 'want', 'dus',
  'of', 'ja', 'nee', 'niets', 'iets', 'alles', 'ander', 'andere',
  'der', 'des', 'den', 'ten', 'ter', 'het', 'er', 'naar', 'toe',
  'zich', 'mij', 'jou', 'jullie', 'hen', 'haar', 'uw',
  'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien',
  'eerste', 'tweede', 'derde', 'vierde', 'vijfde',
  'pas', 'eens', 'soms', 'vaak', 'nooit', 'altijd', 'steeds',
  'net', 'even', 'graag', 'liever', 'best', 'eigenlijk',
  'weer', 'af', 'op', 'aan', 'uit', 'mee', 'weg',
  'worden', 'wordt', 'werd', 'zullen', 'willen', 'mogen', 'moeten', 'kunnen',
]);

// Tokenize Dutch sentence
function tokenize(sentence) {
  return sentence
    .replace(/[.,!?;:"""''…––\-\(\)\[\]\/]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// More comprehensive Dutch morphology check
function inDict(word) {
  if (dictKeys.has(word)) return true;
  if (irregKeys.has(word)) return true;
  if (STOP_WORDS.has(word)) return true;
  if (/^\d+[a-z]*$/.test(word)) return true; // numbers, ordinals like 3e
  
  // Try direct stem variations
  const candidates = new Set();
  
  // Verb conjugation: remove -t, -en, -e, -s, -de, -te, -den, -ten, -d
  for (const suffix of ['t', 'en', 'e', 's', 'de', 'te', 'den', 'ten', 'd', 'n', 'dt']) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      candidates.add(word.slice(0, -suffix.length));
    }
  }
  
  // stem -> infinitive (add -en, -n)
  candidates.add(word + 'en');
  candidates.add(word + 'n');
  candidates.add(word + 'e');
  candidates.add(word + 'er');
  
  // Adjective: -e ending (mooi -> mooie)
  if (word.endsWith('e')) {
    candidates.add(word.slice(0, -1));
  }
  // -ste, -ste (superlative)
  if (word.endsWith('ste')) {
    candidates.add(word.slice(0, -3));
    candidates.add(word.slice(0, -2));
  }
  // -er (comparative)
  if (word.endsWith('er')) {
    candidates.add(word.slice(0, -2));
    candidates.add(word.slice(0, -2) + 'en');
  }
  // -lijk, -ig, -isch, -baar
  for (const suf of ['lijk', 'ig', 'isch', 'baar', 'heid', 'ing', 'schap', 'tje', 'tjes', 'pje', 'pjes', 'je', 'jes']) {
    if (word.endsWith(suf) && word.length > suf.length + 2) {
      candidates.add(word.slice(0, -suf.length));
      candidates.add(word.slice(0, -suf.length) + 'en');
    }
  }
  
  // ge- prefix (past participle)
  if (word.startsWith('ge')) {
    const base = word.slice(2);
    candidates.add(base);
    candidates.add(base + 'en');
    candidates.add(base + 'n');
    // ge...d, ge...t
    if (base.endsWith('d') || base.endsWith('t')) {
      const b2 = base.slice(0, -1);
      candidates.add(b2);
      candidates.add(b2 + 'en');
      candidates.add(b2 + 'n');
    }
    // ge...eerd (gepubliceerd -> publiceren)
    if (base.endsWith('eerd')) {
      candidates.add(base.slice(0, -4) + 'eren');
    }
  }
  
  // ver-, be-, ont-, her- prefixes
  for (const prefix of ['ver', 'be', 'ont', 'her', 'aan', 'op', 'uit', 'af', 'mee', 'toe']) {
    if (word.startsWith(prefix) && word.length > prefix.length + 2) {
      const rest = word.slice(prefix.length);
      candidates.add(rest);
      candidates.add(rest + 'en');
      if (rest.endsWith('t') || rest.endsWith('d') || rest.endsWith('e')) {
        candidates.add(rest.slice(0, -1));
        candidates.add(rest.slice(0, -1) + 'en');
      }
    }
  }
  
  // Plural: -en, -s, -'s
  if (word.endsWith('en') && word.length > 3) {
    // Double vowel simplification: molen -> mool? No, just check stem
    candidates.add(word.slice(0, -2));
    candidates.add(word.slice(0, -1)); // -n only
  }
  if (word.endsWith('s') && word.length > 2) {
    candidates.add(word.slice(0, -1));
  }
  
  // Double consonant simplification: verband -> verb + and
  // Check stem with doubled last consonant removed
  
  for (const c of candidates) {
    if (c.length > 1 && (dictKeys.has(c) || irregKeys.has(c))) return true;
  }
  
  return false;
}

// Grammar node descriptions (what they should cover)
const GRAMMAR_NODES = {
  'node-15': { topic: 'adjective declension', keywords: ['adjective', 'declension', '-e', 'het-word', 'de-word', 'inflection'] },
  'node-16': { topic: 'prepositions', keywords: ['preposition', 'aan', 'op', 'in', 'met', 'voor', 'naar', 'spatial'] },
  'node-17': { topic: 'adverbs', keywords: ['adverb', 'position', 'manner', 'time', 'frequency'] },
  'node-18': { topic: 'comparatives & superlatives', keywords: ['comparative', 'superlative', '-er', '-st', 'meer', 'meest', 'comparison'] },
  'node-19': { topic: 'diminutives', keywords: ['diminutive', '-tje', '-pje', '-je', '-etje', '-kje', 'small'] },
  'node-20': { topic: 'er-construction', keywords: ['er', 'daar', 'hier', 'existential', 'prepositional', 'locative'] },
  'node-21': { topic: 'perfect tense', keywords: ['perfect', 'participle', 'hebben', 'zijn', 'ge-', 'auxiliary'] },
  'node-22': { topic: 'word formation', keywords: ['compound', 'prefix', 'suffix', 'word formation', 'combining'] },
  'node-23': { topic: 'idioms & expressions', keywords: ['idiom', 'expression', 'saying', 'fixed phrase', 'colloquial'] },
  'node-24': { topic: 'formal vs informal', keywords: ['formal', 'informal', 'u', 'je', 'register', 'polite'] },
  'node-25': { topic: 'subjunctive & wishes', keywords: ['subjunctive', 'wish', 'conditional', 'would', 'als', 'mocht'] },
  'node-26': { topic: 'numbers & time', keywords: ['number', 'time', 'date', 'clock', 'ordinal', 'half'] },
  'node-27': { topic: 'question formation', keywords: ['question', 'interrogative', 'inversion', 'wie', 'wat', 'waar'] },
  'node-28': { topic: 'negation', keywords: ['negation', 'niet', 'geen', 'nooit', 'nergens', 'nobody'] },
  'node-29': { topic: 'possession', keywords: ['possessive', 'van', "'s", 'mijn', 'jouw', 'zijn', 'haar', 'ownership'] },
  'node-30': { topic: 'imperatives', keywords: ['imperative', 'command', 'order', 'instruction'] },
  'node-31': { topic: 'infinitive constructions', keywords: ['infinitive', 'om te', 'te', 'verb chain'] },
  'node-32': { topic: 'er-verbs & daar-compounds', keywords: ['er', 'daar', 'hier', 'waar', 'compound', 'pronominal'] },
  'node-33': { topic: 'advanced word order', keywords: ['word order', 'inversion', 'subclause', 'V2', 'verb-final'] },
  'node-34': { topic: 'register & style', keywords: ['register', 'style', 'formal', 'literary', 'spoken'] },
  'node-35': { topic: 'advanced grammar review', keywords: ['advanced', 'complex', 'review'] },
};

// Check grammar tip relevance to node
function isGrammarTipRelevant(tip, node) {
  const nodeInfo = GRAMMAR_NODES[node];
  if (!nodeInfo) return true; // unknown node, skip
  const tipLower = tip.toLowerCase();
  // Check if any keyword appears
  return nodeInfo.keywords.some(k => tipLower.includes(k));
}

// Check for boring/conjugation-pattern grammar tips
function isBoringTip(tip) {
  // Conjugation table patterns
  if (/^(ik|jij|hij|wij|zij|u)\s+\w+,?\s+(jij|hij|wij|zij|u)\s+\w+/i.test(tip)) return true;
  // Just listing verb forms
  if (/^\w+\s*[→>]\s*\w+\s*[→>]\s*\w+/.test(tip)) return true;
  // "X means Y" single word definitions
  if (/^'\w+'\s+(means|is)\s+'?\w+'?\.?$/.test(tip)) return true;
  return false;
}

// Issues collection
const issues = [];
const issueCounts = {
  missingDictWords: 0,
  grammarTipIssues: 0,
  englishQuality: 0,
  duplicates: 0,
  vocabIssues: 0,
  audioMissing: 0,
};

// Build maps for duplicate detection
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

// Similarity check for near-duplicates
function jaccardSim(a, b) {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  const inter = new Set([...sa].filter(x => sb.has(x)));
  const union = new Set([...sa, ...sb]);
  return union.size > 0 ? inter.size / union.size : 0;
}

// Build array for near-dup detection within batches 4-7
const cardTargets = cards.map(c => ({ id: c.id, tokens: tokenize(c.target) }));

// Audit each card
for (const card of cards) {
  const cardIssues = [];
  
  // 1. Dictionary coverage
  const words = tokenize(card.target);
  const missingWords = [];
  for (const w of words) {
    if (!inDict(w) && w.length > 1) {
      missingWords.push(w);
    }
  }
  if (missingWords.length > 0) {
    cardIssues.push({
      type: 'missingDictWords',
      detail: `Missing: ${missingWords.join(', ')}`,
      words: missingWords
    });
    issueCounts.missingDictWords++;
  }
  
  // 2. Grammar tip alignment & quality
  if (card.grammar) {
    const tip = card.grammar;
    
    if (isBoringTip(tip)) {
      cardIssues.push({
        type: 'grammarTipBoring',
        detail: 'Grammar tip looks like conjugation pattern',
        tip
      });
      issueCounts.grammarTipIssues++;
    }
    
    if (tip.length < 15) {
      cardIssues.push({
        type: 'grammarTipShort',
        detail: `Grammar tip too short (${tip.length} chars)`,
        tip
      });
      issueCounts.grammarTipIssues++;
    }
    
    // Check for misaligned tips (tip about different grammar topic)
    if (!isGrammarTipRelevant(tip, card.grammarNode)) {
      // Only flag if clearly about a DIFFERENT node's topic
      const otherNodes = Object.entries(GRAMMAR_NODES).filter(([n, info]) => 
        n !== card.grammarNode && info.keywords.some(k => tip.toLowerCase().includes(k))
      );
      if (otherNodes.length > 0 && otherNodes[0][0] !== card.grammarNode) {
        // Don't flag - many tips are cross-cutting. Only flag egregious mismatches.
      }
    }
    
    // Check for duplicate/generic tips
    if (/^(Dutch|In Dutch|Note that|Remember)/i.test(tip) && tip.split(' ').length < 6) {
      cardIssues.push({
        type: 'grammarTipGeneric',
        detail: 'Grammar tip is generic/trivial',
        tip
      });
      issueCounts.grammarTipIssues++;
    }
  }
  
  // 3. English quality
  const eng = card.english;
  
  // Missing terminal punctuation
  if (card.target.endsWith('.') && !eng.endsWith('.') && !eng.endsWith('!') && !eng.endsWith('?')) {
    cardIssues.push({ type: 'englishPunctuation', detail: 'Missing final period in English' });
    issueCounts.englishQuality++;
  }
  if (card.target.endsWith('?') && !eng.endsWith('?')) {
    cardIssues.push({ type: 'englishPunctuation', detail: 'Dutch is question but English missing ?' });
    issueCounts.englishQuality++;
  }
  if (card.target.endsWith('!') && !eng.endsWith('!') && !eng.endsWith('.')) {
    cardIssues.push({ type: 'englishPunctuation', detail: 'Dutch exclamation but English missing !' });
    issueCounts.englishQuality++;
  }
  
  // Capitalization
  if (eng[0] && eng[0] !== eng[0].toUpperCase()) {
    cardIssues.push({ type: 'englishCapitalization', detail: 'English not capitalized' });
    issueCounts.englishQuality++;
  }
  
  // Very long English
  if (eng.length > 120) {
    cardIssues.push({ type: 'englishTooLong', detail: `English very long (${eng.length} chars)` });
    issueCounts.englishQuality++;
  }
  
  // Awkward literal translations (check for typical markers)
  if (/\b(oneself|one's)\b/i.test(eng) && !/\b(himself|herself|themselves|yourself)\b/i.test(eng)) {
    // "oneself" is often overly formal
  }
  
  // Check English has actual content
  if (eng.trim().length < 5) {
    cardIssues.push({ type: 'englishEmpty', detail: 'English translation too short' });
    issueCounts.englishQuality++;
  }
  
  // 4. Duplicates
  const nt = card.target.toLowerCase().replace(/[.,!?;:]/g, '').trim();
  const ne = card.english.toLowerCase().replace(/[.,!?;:]/g, '').trim();
  const targetDups = targetMap.get(nt) || [];
  if (targetDups.length > 1) {
    cardIssues.push({
      type: 'duplicateTarget',
      detail: `Exact duplicate target with: ${targetDups.filter(id => id !== card.id).join(', ')}`
    });
    issueCounts.duplicates++;
  }
  // Same English can be ok (different Dutch expressions) - only flag exact match
  const engDups = englishMap.get(ne) || [];
  if (engDups.length > 1) {
    cardIssues.push({
      type: 'duplicateEnglish',
      detail: `Same English translation as: ${engDups.filter(id => id !== card.id).join(', ')}`
    });
    issueCounts.duplicates++;
  }
  
  // 5. Vocabulary appropriateness
  // Check for English words in Dutch sentence
  const engWordsInDutch = words.filter(w => 
    /^(the|and|or|but|with|from|this|that|these|those|there|their|they|them|have|has|will|would|could|should|because|about|which|while|when|where|before|after)$/.test(w)
  );
  if (engWordsInDutch.length > 0) {
    cardIssues.push({
      type: 'vocabEnglishInDutch',
      detail: `English words in Dutch: ${engWordsInDutch.join(', ')}`
    });
    issueCounts.vocabIssues++;
  }
  
  // Check for very obscure/academic vocabulary
  const obscurePatterns = [
    /koopvaardijkapitein/, /rijksmonument/, /grachtenpand/,
  ];
  for (const pat of obscurePatterns) {
    if (pat.test(card.target.toLowerCase())) {
      cardIssues.push({
        type: 'vocabObscure',
        detail: `Potentially obscure vocabulary: ${pat.source}`
      });
      issueCounts.vocabIssues++;
    }
  }
  
  // 6. Audio exists
  if (!audioFiles.has(card.audio)) {
    cardIssues.push({
      type: 'audioMissing',
      detail: `Audio file missing: ${card.audio}`
    });
    issueCounts.audioMissing++;
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

// Collect all missing words with frequencies
const allMissingWords = {};
for (const card of issues) {
  for (const iss of card.issues) {
    if (iss.type === 'missingDictWords' && iss.words) {
      for (const w of iss.words) {
        allMissingWords[w] = (allMissingWords[w] || 0) + 1;
      }
    }
  }
}
const sortedMissing = Object.entries(allMissingWords).sort((a,b) => b[1] - a[1]);

// Summary
const summary = {
  totalCardsAudited: cards.length,
  cardsWithIssues: issues.length,
  cardsClean: cards.length - issues.length,
  issueCounts,
  totalIssueInstances: Object.values(issueCounts).reduce((a,b) => a+b, 0),
  issuesByNode: {},
  uniqueMissingWords: sortedMissing.length,
  topMissingWords: sortedMissing.slice(0, 100).map(([w, c]) => ({ word: w, count: c })),
};

// Group by node
for (const card of issues) {
  const node = card.grammarNode;
  if (!summary.issuesByNode[node]) summary.issuesByNode[node] = { total: 0, types: {} };
  summary.issuesByNode[node].total++;
  for (const iss of card.issues) {
    const t = iss.type;
    summary.issuesByNode[node].types[t] = (summary.issuesByNode[node].types[t] || 0) + 1;
  }
}

const output = { summary, issues };
const outPath = BASE + '/scripts/output/audit-nl-cards-1.json';
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWritten to ${outPath}`);
console.log('\n=== SUMMARY ===');
console.log(`Cards audited: ${summary.totalCardsAudited}`);
console.log(`Cards with issues: ${summary.cardsWithIssues}`);
console.log(`Cards clean: ${summary.cardsClean}`);
console.log(`Issue counts:`, JSON.stringify(summary.issueCounts, null, 2));
console.log(`Unique missing dict words: ${summary.uniqueMissingWords}`);
console.log(`Top 20 missing words:`, sortedMissing.slice(0, 20));
