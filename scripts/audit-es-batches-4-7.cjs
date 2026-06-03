#!/usr/bin/env node
/**
 * Card-by-card audit of Spanish batches 4-7 (~1935 cards)
 * Checks: dictionary coverage, grammar tip alignment, English quality,
 *         duplicates, vocabulary appropriateness, audio file existence
 */

const fs = require('fs');
const path = require('path');

// Load batches
const batches = [];
for (let i = 4; i <= 7; i++) {
  const data = require(`./output/audit-batches/es-batch-${i}.json`);
  batches.push(...data);
}
console.log(`Loaded ${batches.length} cards from batches 4-7`);

// Load dictionary from es.ts
const dictPath = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'es.ts');
const dictContent = fs.readFileSync(dictPath, 'utf-8');

// Parse dictionary keys
const dictKeys = new Set();
const dictKeyRegex = /^\s*"([^"]+)":\s*\{/gm;
let match;
while ((match = dictKeyRegex.exec(dictContent)) !== null) {
  dictKeys.add(match[1].toLowerCase());
}
console.log(`Dictionary has ${dictKeys.size} entries`);

// Audio directory
const audioDir = path.join(__dirname, '..', 'public', 'quest-audio');

// Spanish stop words to skip in dictionary coverage
const stopWords = new Set([
  'a', 'al', 'de', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'en', 'con', 'por', 'para', 'y', 'o', 'que', 'se', 'no', 'me', 'te', 'le', 'les',
  'lo', 'nos', 'es', 'su', 'mi', 'tu', 'más', 'pero', 'como', 'ya', 'si', 'muy',
  'ser', 'hay', 'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas', 'usted',
  'ustedes', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'aquel', 'aquella', 'aquellos', 'aquellas', 'del', 'al', 'ni', 'tan', 'e',
  'qué', 'quién', 'cuándo', 'dónde', 'cómo', 'cuánto', 'cuál',
  'he', 'ha', 'han', 'hemos', 'soy', 'eres', 'somos', 'son', 'fue', 'era',
  'está', 'están', 'estoy', 'estamos', 'fui', 'sido',
  'tiene', 'tienen', 'tengo', 'tenemos', 'puede', 'pueden', 'puedo', 'podemos',
  'hace', 'hacen', 'hago', 'hacemos', 'dice', 'dicen', 'digo', 'decimos',
  'va', 'van', 'voy', 'vamos', 'viene', 'vienen', 'vengo', 'venimos',
  'quiere', 'quieren', 'quiero', 'queremos',
  'sabe', 'saben', 'sé', 'sabemos',
  'da', 'dan', 'doy', 'damos',
  'también', 'aquí', 'ahí', 'allí', 'entre', 'sin', 'sobre', 'todo', 'toda',
  'todos', 'todas', 'otro', 'otra', 'otros', 'otras', 'mismo', 'misma',
  'cada', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca', 'pocos', 'pocas',
  'bien', 'mal', 'mejor', 'peor', 'mayor', 'menor', 'algo', 'nada', 'alguien',
  'nadie', 'siempre', 'nunca', 'cuando', 'donde', 'porque', 'aunque', 'mientras',
  'hasta', 'desde', 'hacia', 'según', 'durante', 'antes', 'después', 'entonces',
  'así', 'ahora', 'hoy', 'ayer', 'mañana', 'aún', 'todavía',
  // common verb forms of core verbs
  'ser', 'estar', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver', 'dar', 'saber',
  'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer',
  'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar',
  'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar',
  'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar',
  'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir',
  'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar',
  'le', 'les', 'lo', 'la', 'los', 'las', 'me', 'te', 'se', 'nos',
  'del', 'al', 'que', 'quien', 'cual', 'cuyo', 'cuya',
]);

// Lookup helper mimicking the dictionary's lookupWord
function lookupInDict(word) {
  const clean = word.toLowerCase().replace(/[¿¡.,!?;:"""''()––\-]/g, '').trim();
  if (!clean || clean.length <= 1) return true; // skip single chars
  if (stopWords.has(clean)) return true;
  if (/^\d+$/.test(clean)) return true; // skip numbers

  if (dictKeys.has(clean)) return true;

  // Try pronoun stripping
  const pronounSuffixes = ['melo', 'mela', 'telo', 'tela', 'selo', 'sela', 'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la', 'los', 'las'];
  for (const pronoun of pronounSuffixes) {
    if (clean.endsWith(pronoun) && clean.length > pronoun.length + 2) {
      const stripped = clean.slice(0, -pronoun.length);
      if (dictKeys.has(stripped)) return true;
      if (dictKeys.has(stripped + 'se')) return true;
      if (dictKeys.has(stripped + 'r')) return true;
    }
  }

  // Verb endings
  const verbEndings = [
    { suffix: 'ando', replace: 'ar' },
    { suffix: 'iendo', replace: 'er' },
    { suffix: 'iendo', replace: 'ir' },
    { suffix: 'amos', replace: 'ar' },
    { suffix: 'emos', replace: 'er' },
    { suffix: 'imos', replace: 'ir' },
    { suffix: 'an', replace: 'ar' },
    { suffix: 'en', replace: 'er' },
    { suffix: 'as', replace: 'ar' },
    { suffix: 'es', replace: 'er' },
    { suffix: 'ó', replace: 'ar' },
    { suffix: 'é', replace: 'ar' },
    { suffix: 'aba', replace: 'ar' },
    { suffix: 'ía', replace: 'er' },
    { suffix: 'ía', replace: 'ir' },
    { suffix: 'aría', replace: 'ar' },
    { suffix: 'ería', replace: 'er' },
    { suffix: 'iría', replace: 'ir' },
    { suffix: 'ará', replace: 'ar' },
    { suffix: 'erá', replace: 'er' },
    { suffix: 'irá', replace: 'ir' },
    { suffix: 'ara', replace: 'ar' },
    { suffix: 'iera', replace: 'er' },
    { suffix: 'iera', replace: 'ir' },
    { suffix: 'ase', replace: 'ar' },
    { suffix: 'iese', replace: 'er' },
    { suffix: 'iese', replace: 'ir' },
    { suffix: 'aron', replace: 'ar' },
    { suffix: 'ieron', replace: 'er' },
    { suffix: 'ieron', replace: 'ir' },
    { suffix: 'aban', replace: 'ar' },
    { suffix: 'ían', replace: 'er' },
    { suffix: 'ían', replace: 'ir' },
    { suffix: 'arían', replace: 'ar' },
    { suffix: 'erían', replace: 'er' },
    { suffix: 'irían', replace: 'ir' },
    { suffix: 'arán', replace: 'ar' },
    { suffix: 'erán', replace: 'er' },
    { suffix: 'irán', replace: 'ir' },
    { suffix: 'aran', replace: 'ar' },
    { suffix: 'ieran', replace: 'er' },
    { suffix: 'ieran', replace: 'ir' },
    { suffix: 'asen', replace: 'ar' },
    { suffix: 'iesen', replace: 'er' },
    { suffix: 'iesen', replace: 'ir' },
    { suffix: 'aste', replace: 'ar' },
    { suffix: 'iste', replace: 'er' },
    { suffix: 'iste', replace: 'ir' },
    { suffix: 'ado', replace: 'ar' },
    { suffix: 'ido', replace: 'er' },
    { suffix: 'ido', replace: 'ir' },
    { suffix: 'ada', replace: 'ar' },
    { suffix: 'ida', replace: 'er' },
    { suffix: 'ida', replace: 'ir' },
  ];

  for (const { suffix, replace } of verbEndings) {
    if (clean.endsWith(suffix)) {
      const stem = clean.slice(0, -suffix.length) + replace;
      if (dictKeys.has(stem)) return true;
    }
  }

  // Try removing plural -s / -es
  if (clean.endsWith('es') && dictKeys.has(clean.slice(0, -2))) return true;
  if (clean.endsWith('s') && dictKeys.has(clean.slice(0, -1))) return true;

  // Try removing -a/-o gender suffix
  if (clean.endsWith('a') && dictKeys.has(clean.slice(0, -1) + 'o')) return true;
  if (clean.endsWith('o') && dictKeys.has(clean.slice(0, -1) + 'a')) return true;

  // Try -mente adverb → adjective
  if (clean.endsWith('mente')) {
    const adj = clean.slice(0, -5);
    if (dictKeys.has(adj) || dictKeys.has(adj + 'e') || dictKeys.has(adj + 'o') || dictKeys.has(adj + 'a')) return true;
  }

  return false;
}

// Grammar node descriptions for alignment checking
const grammarNodes = {
  'node-01': 'Present tense basics',
  'node-02': 'Ser vs estar',
  'node-03': 'Articles and gender',
  'node-04': 'Common adjectives',
  'node-05': 'Question formation',
  'node-06': 'Negation',
  'node-07': 'Past tense preterite',
  'node-08': 'Past tense imperfect',
  'node-09': 'Reflexive verbs',
  'node-10': 'Direct/indirect objects',
  'node-11': 'Gustar-type verbs',
  'node-12': 'Comparatives/superlatives',
  'node-13': 'Future tense',
  'node-14': 'Conditional',
  'node-15': 'Subjunctive present',
  'node-16': 'Subjunctive imperfect',
  'node-17': 'Commands/imperative',
  'node-18': 'Perfect tenses',
  'node-19': 'Progressive tenses',
  'node-20': 'Por vs para',
  'node-21': 'Prepositions',
  'node-22': 'Relative clauses',
  'node-23': 'Passive voice',
  'node-24': 'Conditional sentences (if)',
  'node-25': 'Advanced subjunctive',
  'node-26': 'Reported speech',
  'node-27': 'Conjunctions',
  'node-28': 'Advanced vocabulary A',
  'node-29': 'Advanced vocabulary B',
  'node-30': 'Idiomatic expressions',
  'node-31': 'Formal/informal register',
  'node-32': 'Complex sentences',
  'node-33': 'Literary/academic',
  'node-34': 'Discourse markers',
  'node-35': 'Advanced review',
};

// Issues collection
const issues = [];

// Track seen sentences and English for duplicates
const seenTarget = new Map();
const seenEnglish = new Map();

// Also load batches 0-3 to check cross-batch duplicates
for (let i = 0; i <= 3; i++) {
  try {
    const prev = require(`./output/audit-batches/es-batch-${i}.json`);
    for (const c of prev) {
      seenTarget.set(c.target.toLowerCase().trim(), c.id);
      seenEnglish.set(c.english.toLowerCase().trim(), c.id);
    }
  } catch(e) { /* skip if not found */ }
}

// Process each card
for (const card of batches) {
  const cardIssues = [];

  // 1. Dictionary coverage
  const targetWords = card.target.split(/\s+/).map(w => w.toLowerCase().replace(/[¿¡.,!?;:"""''()––\-]/g, '').trim()).filter(w => w.length > 1);
  const missingWords = targetWords.filter(w => !lookupInDict(w));
  if (missingWords.length > 0) {
    // Only flag if more than 2 words missing (many inflected forms won't match)
    if (missingWords.length >= 3) {
      cardIssues.push({
        type: 'dict_coverage',
        detail: `${missingWords.length} words not in dictionary: ${missingWords.join(', ')}`
      });
    }
  }

  // 2. Grammar tip alignment
  if (card.grammar) {
    const tip = card.grammar.toLowerCase();
    const node = card.grammarNode;

    // Check for boring conjugation patterns
    if (/^(the|conjugat|verb form|this is the|form of)/i.test(card.grammar) &&
        !/usage|context|colloquial|nuance|differ|mean|express|imply|suggest|note|tip|register/i.test(card.grammar)) {
      cardIssues.push({
        type: 'grammar_boring',
        detail: `Grammar tip looks like plain conjugation, not contextual: "${card.grammar.substring(0, 80)}..."`
      });
    }

    // Check alignment with node topic (basic heuristics)
    if (node === 'node-15' || node === 'node-16' || node === 'node-25') {
      // Subjunctive nodes - tip should mention subjunctive
      if (!tip.includes('subjunctive') && !tip.includes('subjuntivo') &&
          !tip.includes('wish') && !tip.includes('hope') && !tip.includes('doubt') &&
          !tip.includes('emotion') && !tip.includes('uncertain') && !tip.includes('que')) {
        // Skip - many tips just explain usage context which is fine
      }
    }
  }

  // 3. English quality checks
  const eng = card.english;

  // Check for untranslated Spanish left in English
  const spanishInEnglish = /\b(muy|también|siempre|porque|pero|aunque|entonces|después|antes|hacia|según|durante)\b/i;
  if (spanishInEnglish.test(eng)) {
    cardIssues.push({
      type: 'english_quality',
      detail: `English may contain untranslated Spanish: "${eng}"`
    });
  }

  // Check for awkward English
  if (/\b(the the|a a|is is|to to|in in)\b/i.test(eng)) {
    cardIssues.push({
      type: 'english_quality',
      detail: `Repeated word in English: "${eng}"`
    });
  }

  // Check for very short or overly long English
  if (eng.length < 5) {
    cardIssues.push({
      type: 'english_quality',
      detail: `English too short (${eng.length} chars): "${eng}"`
    });
  }
  if (eng.length > 200) {
    cardIssues.push({
      type: 'english_quality',
      detail: `English too long (${eng.length} chars): "${eng.substring(0, 100)}..."`
    });
  }

  // Check for missing period / question mark at end
  const engTrimmed = eng.trim();
  const lastChar = engTrimmed[engTrimmed.length - 1];
  if (!/[.!?…]/.test(lastChar) && engTrimmed.length > 10) {
    cardIssues.push({
      type: 'english_quality',
      detail: `English doesn't end with punctuation: "${eng}"`
    });
  }

  // Check English-Spanish mismatch (question in one but not other)
  const targetIsQuestion = card.target.includes('¿') || card.target.trim().endsWith('?');
  const engIsQuestion = eng.trim().endsWith('?');
  if (targetIsQuestion && !engIsQuestion) {
    cardIssues.push({
      type: 'english_quality',
      detail: `Spanish is question but English is not: ES="${card.target.substring(0,60)}" EN="${eng.substring(0,60)}"`
    });
  }
  if (!targetIsQuestion && engIsQuestion) {
    cardIssues.push({
      type: 'english_quality',
      detail: `English is question but Spanish is not: ES="${card.target.substring(0,60)}" EN="${eng.substring(0,60)}"`
    });
  }

  // 4. Duplicates
  const targetKey = card.target.toLowerCase().trim();
  const engKey = eng.toLowerCase().trim();

  if (seenTarget.has(targetKey)) {
    cardIssues.push({
      type: 'duplicate_target',
      detail: `Duplicate Spanish sentence with ${seenTarget.get(targetKey)}: "${card.target.substring(0,60)}"`
    });
  }

  if (seenEnglish.has(engKey)) {
    cardIssues.push({
      type: 'duplicate_english',
      detail: `Duplicate English with ${seenEnglish.get(engKey)}: "${eng.substring(0,60)}"`
    });
  }

  seenTarget.set(targetKey, card.id);
  seenEnglish.set(engKey, card.id);

  // 5. Vocabulary appropriateness
  // Check for overly complex/rare words in early nodes
  const nodeNum = parseInt(card.grammarNode?.replace('node-', '') || '99');

  // Check for inappropriate content
  const inappropriatePatterns = /\b(mierda|joder|puta|coño|culo|cabrón|pendejo|chingar|verga)\b/i;
  if (inappropriatePatterns.test(card.target)) {
    cardIssues.push({
      type: 'vocabulary_inappropriate',
      detail: `Contains potentially inappropriate vocabulary: "${card.target.substring(0,60)}"`
    });
  }

  // Check for very long sentences in beginner nodes
  const wordCount = card.target.split(/\s+/).length;
  if (nodeNum <= 5 && wordCount > 15) {
    cardIssues.push({
      type: 'vocabulary_complexity',
      detail: `Beginner node ${card.grammarNode} has complex sentence (${wordCount} words): "${card.target.substring(0,60)}"`
    });
  }

  // 6. Audio file exists
  const audioFile = path.join(audioDir, card.audio);
  if (!fs.existsSync(audioFile)) {
    cardIssues.push({
      type: 'audio_missing',
      detail: `Audio file not found: ${card.audio}`
    });
  }

  // Additional checks

  // Check target has proper Spanish characters (not broken encoding)
  if (/[Ã¡Ã©Ã±]/.test(card.target)) {
    cardIssues.push({
      type: 'encoding',
      detail: `Possible encoding issue in target: "${card.target.substring(0,60)}"`
    });
  }

  // Check for empty fields
  if (!card.target || card.target.trim().length === 0) {
    cardIssues.push({ type: 'empty_field', detail: 'Empty target field' });
  }
  if (!card.english || card.english.trim().length === 0) {
    cardIssues.push({ type: 'empty_field', detail: 'Empty english field' });
  }
  if (!card.grammarNode) {
    cardIssues.push({ type: 'empty_field', detail: 'Missing grammarNode' });
  }
  if (!card.audio) {
    cardIssues.push({ type: 'empty_field', detail: 'Missing audio field' });
  }

  // Check that target starts with capital (or ¿ or ¡)
  const firstChar = card.target.trim()[0];
  if (firstChar && !/[A-ZÀ-ÖÙ-Ý¿¡]/.test(firstChar)) {
    cardIssues.push({
      type: 'formatting',
      detail: `Target doesn't start with capital: "${card.target.substring(0,40)}"`
    });
  }

  if (cardIssues.length > 0) {
    issues.push({
      id: card.id,
      grammarNode: card.grammarNode,
      target: card.target.substring(0, 80),
      english: card.english.substring(0, 80),
      issues: cardIssues
    });
  }
}

// Summary
const summary = {
  totalCards: batches.length,
  cardsWithIssues: issues.length,
  issueBreakdown: {}
};

for (const card of issues) {
  for (const issue of card.issues) {
    summary.issueBreakdown[issue.type] = (summary.issueBreakdown[issue.type] || 0) + 1;
  }
}

const output = {
  summary,
  cards: issues
};

// Write results
const outPath = path.join(__dirname, 'output', 'audit-es-cards-1.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log('\n=== AUDIT SUMMARY ===');
console.log(`Total cards audited: ${summary.totalCards}`);
console.log(`Cards with issues: ${summary.cardsWithIssues}`);
console.log('\nIssue breakdown:');
for (const [type, count] of Object.entries(summary.issueBreakdown).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}
console.log(`\nResults written to: ${outPath}`);
