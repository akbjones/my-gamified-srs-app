const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public/quest-audio');

// Load cards
const cards = [];
for (let i = 0; i < 4; i++) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, `scripts/output/audit-batches/it-batch-${i}.json`), 'utf8'));
  cards.push(...d);
}

// Load dictionary
const dictSrc = fs.readFileSync(path.join(ROOT, 'src/data/dictionary/it.ts'), 'utf8');
const dictKeys = new Set();
const keyRegex = /^\s+['"]([^'"]+)['"]\s*:/gm;
let m;
while ((m = keyRegex.exec(dictSrc)) !== null) dictKeys.add(m[1].toLowerCase());

// Audio files
const audioFiles = new Set();
fs.readdirSync(AUDIO_DIR).forEach(f => {
  if (f.startsWith('it-') && f.endsWith('.mp3')) audioFiles.add(f);
});

// Italian idiomatic repeated-word patterns (NOT errors)
const IDIOMATIC_REPEATS = ['piano piano', 'poco a poco', 'a poco a poco', 'man mano', 'via via', 'quasi quasi', 'adagio adagio'];

// Extended stop words
const STOP_WORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una',
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'e', 'o', 'ma', 'che', 'se', 'anche', 'né', 'perché',
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
  'mi', 'ti', 'ci', 'vi', 'si', 'me', 'te', 'ce', 've',
  'ne', 'lo', 'la', 'li', 'le', 'gli',
  'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle',
  'è', 'sono', 'sei', 'siamo', 'siete', 'era', 'ero', 'erano', 'eravamo',
  'ho', 'ha', 'hai', 'abbiamo', 'avete', 'hanno', 'avevo', 'aveva', 'avevamo', 'avevano',
  'sto', 'sta', 'stai', 'stiamo', 'state', 'stanno',
  'faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno',
  'vado', 'vai', 'va', 'andiamo', 'andate', 'vanno',
  'vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono',
  'posso', 'puoi', 'può', 'possiamo', 'potete', 'possono',
  'devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono',
  'voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono',
  'non', 'no', 'sì', 'più', 'molto', 'come', 'dove', 'quando',
  'cosa', 'chi', 'quale', 'quanto', 'quanta', 'quanti', 'quante',
  'c', 'com', 'cos', 'dov', 'po', 'già', 'ancora', 'sempre', 'mai', 'tanto', 'così',
  'stato', 'stata', 'stati', 'state', 'fatto', 'fatta', 'fatti', 'fatte',
  'avuto', 'avuta', 'essere', 'avere', 'fare', 'andare', 'dire', 'stare',
  'cui', 'proprio', 'ogni', 'tutto', 'tutta', 'tutti', 'tutte', 'altro', 'altra', 'altri', 'altre',
]);

function tokenize(text) {
  let clean = text.toLowerCase()
    .replace(/[.,!?;:"""''()—–\-…\u200b\u00ab\u00bb]/g, ' ')
    .replace(/'/g, "'");
  const rawTokens = clean.split(/\s+/).filter(Boolean);
  const tokens = [];
  for (const tok of rawTokens) {
    if (tok.includes("'")) {
      tok.split("'").forEach(p => { if (p) tokens.push(p); });
    } else {
      tokens.push(tok);
    }
  }
  return tokens;
}

function inDict(word) {
  if (dictKeys.has(word)) return true;
  if (word.endsWith('mente') && word.length > 7) {
    const base = word.slice(0, -5);
    if (dictKeys.has(base) || dictKeys.has(base + 'e') || dictKeys.has(base + 'o') || dictKeys.has(base + 'a')) return true;
  }
  const suffixes = ['o', 'i', 'a', 'e', 'iamo', 'ete', 'ono', 'ano', 'ino',
    'ato', 'ata', 'ati', 'ate', 'ito', 'ita', 'iti', 'ite', 'uto', 'uta', 'uti', 'ute',
    'ando', 'endo', 'ava', 'avo', 'avi', 'avano', 'avamo',
    'evo', 'evi', 'eva', 'evano', 'evamo',
    'ivo', 'iva', 'ivi', 'ivano', 'ivamo',
    'erò', 'erai', 'erà', 'eremo', 'erete', 'eranno',
    'irò', 'irai', 'irà', 'iremo', 'irete', 'iranno',
    'erei', 'eresti', 'erebbe', 'eremmo', 'ereste', 'erebbero',
    'irei', 'iresti', 'irebbe', 'iremmo', 'ireste', 'irebbero',
    'asse', 'assi', 'assimo', 'assero',
    'esse', 'essi', 'essimo', 'essero',
    'isse', 'issi', 'issimo', 'issero',
    'ai', 'asti', 'ammo', 'aste', 'arono',
    'ei', 'esti', 'ette', 'emmo', 'este', 'ettero',
    'ii', 'isti', 'immo', 'iste', 'irono'];
  for (const suf of suffixes) {
    if (word.endsWith(suf) && word.length > suf.length + 2) {
      const stem = word.slice(0, -suf.length);
      if (dictKeys.has(stem + 'are') || dictKeys.has(stem + 'ere') || dictKeys.has(stem + 'ire')) return true;
    }
  }
  if (word.endsWith('i') && (dictKeys.has(word.slice(0,-1) + 'o') || dictKeys.has(word.slice(0,-1) + 'e'))) return true;
  if (word.endsWith('e') && dictKeys.has(word.slice(0,-1) + 'a')) return true;
  if (word.endsWith('he') && dictKeys.has(word.slice(0,-2) + 'a')) return true;
  if (word.endsWith('hi') && dictKeys.has(word.slice(0,-2) + 'o')) return true;
  if (word.endsWith('chi') && dictKeys.has(word.slice(0,-3) + 'co')) return true;
  if (word.endsWith('ghi') && dictKeys.has(word.slice(0,-3) + 'go')) return true;
  if (word.endsWith('che') && dictKeys.has(word.slice(0,-3) + 'ca')) return true;
  if (word.endsWith('ghe') && dictKeys.has(word.slice(0,-3) + 'ga')) return true;
  for (const dim of ['ino', 'ina', 'ini', 'ine', 'one', 'ona', 'oni', 'etto', 'etta', 'etti', 'ette', 'ello', 'ella']) {
    if (word.endsWith(dim) && word.length > dim.length + 2) {
      const base = word.slice(0, -dim.length);
      if (dictKeys.has(base + 'o') || dictKeys.has(base + 'a') || dictKeys.has(base + 'e')) return true;
    }
  }
  return false;
}

const issues = [];
const seen = new Map();
const seenEnglish = new Map();

const summary = {
  totalCards: cards.length,
  cardsWithIssues: 0,
  byType: {
    missing_audio: 0,
    dict_gap: 0,
    duplicate_target: 0,
    duplicate_english: 0,
    english_quality: 0,
    target_quality: 0,
    grammar_tip: 0,
    vocab_too_advanced: 0,
    question_mismatch: 0,
    grammar_tip_mismatch: 0,
  },
};

const missingWordsMap = {};

for (const card of cards) {
  const cardIssues = [];
  
  // 1. Audio
  if (!card.audio || !audioFiles.has(card.audio)) {
    cardIssues.push({ type: 'missing_audio', audio: card.audio || 'none' });
    summary.byType.missing_audio++;
  }
  
  // 2. Dictionary coverage
  const tokens = tokenize(card.target);
  const missing = [];
  for (const tok of tokens) {
    if (STOP_WORDS.has(tok) || tok.length <= 1 || /^\d+$/.test(tok)) continue;
    if (!inDict(tok)) {
      missing.push(tok);
      missingWordsMap[tok] = (missingWordsMap[tok] || 0) + 1;
    }
  }
  if (missing.length > 0) {
    cardIssues.push({ type: 'dict_gap', words: missing });
    summary.byType.dict_gap++;
  }
  
  // 3. Duplicate target (normalized: strip punctuation & collapse spaces)
  const normT = card.target.toLowerCase().replace(/[.,!?;:"""''()—–\-…]/g, '').replace(/\s+/g, ' ').trim();
  if (seen.has(normT)) {
    cardIssues.push({ type: 'duplicate_target', otherCard: seen.get(normT) });
    summary.byType.duplicate_target++;
  } else {
    seen.set(normT, card.id);
  }
  
  // 3b. Duplicate English
  const normE = card.english.toLowerCase().replace(/[.,!?;:"""''()—–\-…]/g, '').replace(/\s+/g, ' ').trim();
  if (seenEnglish.has(normE)) {
    cardIssues.push({ type: 'duplicate_english', otherCard: seenEnglish.get(normE) });
    summary.byType.duplicate_english++;
  } else {
    seenEnglish.set(normE, card.id);
  }
  
  // 4. English quality
  const eng = card.english;
  const engIssues = [];
  if (!eng || eng.trim().length < 3) engIssues.push('too_short');
  if (/  /.test(eng)) engIssues.push('double_space');
  if (eng !== eng.trim()) engIssues.push('whitespace');
  if ((eng.match(/"/g) || []).length % 2 !== 0) engIssues.push('unmatched_quotes');
  if (eng[0] && /[a-z]/.test(eng[0]) && eng[0] !== '"' && eng[0] !== "'") engIssues.push('lowercase_start');
  // True repeated words (not English idioms)
  const engRepeats = eng.match(/\b(\w{3,})\s+\1\b/gi);
  if (engRepeats) {
    const nonIdiomatic = engRepeats.filter(r => !/\b(that that|had had|very very)\b/i.test(r));
    if (nonIdiomatic.length > 0) engIssues.push('repeated_word');
  }
  if (engIssues.length > 0) {
    cardIssues.push({ type: 'english_quality', details: engIssues });
    summary.byType.english_quality++;
  }
  
  // 5. Target quality
  const tgt = card.target;
  const tgtIssues = [];
  if (/  /.test(tgt)) tgtIssues.push('double_space');
  if (tgt !== tgt.trim()) tgtIssues.push('whitespace');
  if (tgt[0] && /[a-zà-ö]/.test(tgt[0])) tgtIssues.push('lowercase_start');
  if (!/[.!?…]$/.test(tgt.trim())) tgtIssues.push('no_ending_punctuation');
  // Repeated words (excluding Italian idiomatic expressions)
  const repeats = tgt.match(/\b(\w{3,})\s+\1\b/gi);
  if (repeats) {
    const tgtLower = tgt.toLowerCase();
    const genuineRepeats = repeats.filter(r => {
      return !IDIOMATIC_REPEATS.some(idiom => tgtLower.includes(idiom));
    });
    if (genuineRepeats.length > 0) tgtIssues.push('repeated_word');
  }
  if (tgtIssues.length > 0) {
    cardIssues.push({ type: 'target_quality', details: tgtIssues });
    summary.byType.target_quality++;
  }
  
  // 6. Grammar tip issues
  if (card.grammar) {
    const tip = card.grammar;
    const tipIssues = [];
    if (tip.length < 15) tipIssues.push('too_short');
    if (tip.length > 350) tipIssues.push('too_long');
    if (/\b(io .+, tu .+, lui)/i.test(tip)) tipIssues.push('conjugation_table');
    if (/first person.+second person|1st person.+2nd person/i.test(tip)) tipIssues.push('conjugation_table');
    if (/^-\w+ verb:/i.test(tip) && tip.length < 60 && !/\b(note|careful|unlike|exception|common|natural|tip|remember)\b/i.test(tip)) {
      tipIssues.push('bare_pattern');
    }
    if (['node-01', 'node-02'].includes(card.grammarNode) && 
        /\bsubjunctive|congiuntivo\b/i.test(tip)) {
      tipIssues.push('too_advanced_for_node');
    }
    // Tip content doesn't match card content at all
    if (tip.includes("'è importante che'") && !tgt.includes('importante')) {
      tipIssues.push('tip_content_mismatch');
    }
    if (tipIssues.length > 0) {
      cardIssues.push({ type: 'grammar_tip', details: tipIssues, tip: tip.slice(0, 150) });
      summary.byType.grammar_tip++;
    }
  }
  
  // 7. Vocab appropriateness
  const advancedForEarly = /\b(neurochirurgo|paleontolog|epistemolog|giurisprudenz|psicoanalis|biochimic|termodinam|elettromagnet|microbiolog)\b/i;
  if (advancedForEarly.test(tgt) && ['node-01', 'node-02', 'node-03'].includes(card.grammarNode)) {
    cardIssues.push({ type: 'vocab_too_advanced', node: card.grammarNode });
    summary.byType.vocab_too_advanced++;
  }
  
  // 8. Question mismatch
  const tgtQ = tgt.includes('?');
  const engQ = eng.includes('?');
  if (tgtQ !== engQ) {
    cardIssues.push({ type: 'question_mismatch', target_has_q: tgtQ, english_has_q: engQ });
    summary.byType.question_mismatch++;
  }
  
  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      node: card.grammarNode,
      target: card.target,
      english: card.english,
      ...(card.grammar ? { grammar: card.grammar.slice(0, 200) } : {}),
      issues: cardIssues,
    });
  }
}

summary.cardsWithIssues = issues.length;

const topMissing = Object.entries(missingWordsMap)
  .sort((a,b) => b[1] - a[1]).slice(0, 80)
  .map(([w, c]) => ({ word: w, count: c }));

const output = {
  summary: {
    ...summary,
    topMissingWords: topMissing,
    issueRate: (issues.length / cards.length * 100).toFixed(1) + '%',
    dictionarySize: dictKeys.size,
    audioFileCount: audioFiles.size,
  },
  cards: issues,
};

fs.writeFileSync(path.join(ROOT, 'scripts/output/audit-it-cards-0.json'), JSON.stringify(output, null, 2));

console.log('\n=== FINAL AUDIT SUMMARY ===');
console.log(`Total cards audited: ${summary.totalCards}`);
console.log(`Cards with issues: ${summary.cardsWithIssues} (${output.summary.issueRate})`);
console.log(`Dictionary: ${dictKeys.size} entries | Audio files: ${audioFiles.size}`);
console.log('');
Object.entries(summary.byType).forEach(([k,v]) => {
  if (v > 0) console.log(`  ${k}: ${v}`);
});
if (topMissing.length > 0) {
  console.log(`\nTop missing dictionary words:`);
  topMissing.slice(0, 20).forEach(({word, count}) => console.log(`  ${word}: ${count}`));
}
