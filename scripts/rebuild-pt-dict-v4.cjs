#!/usr/bin/env node
/**
 * Rebuild Portuguese dictionary v4 – full-sentence validation approach.
 *
 * Steps:
 *  1. Portuguese function word table (~180 entries, never sent to Google)
 *  2. Collect all unique words from deck via tokenize(sentence, 'portuguese')
 *  3. Google Translate individual words via translateBatch()
 *  4. Google Translate ALL unique sentences via translateSentences()
 *  5. For each word, validate against sentence translations via validateAndEnrich()
 *  6. Post-process every result via postProcess() (18-rule pipeline)
 *  7. Lemma copy – verified lemmas get their base word's definition
 *  8. Noun/verb dual entries
 *  9. Apply to pt.ts, preserve IPA/lemma/pos + lookupWord + reverseVerb
 * 10. 100-entry random review -> scripts/output/pt-v5-review.md
 *
 * ~3,923 cards.
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, translateSentences, tokenize, validateAndEnrich } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/portuguese/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/pt.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Portuguese function word table (~180 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Greetings / common expressions ──
  'oi': 'hi', 'olá': 'hello',
  'bom': 'good', 'boa': 'good (fem.)',
  'obrigado': 'thank you (masc.)', 'obrigada': 'thank you (fem.)',
  'sim': 'yes', 'não': 'no, not',
  'tchau': 'bye', 'adeus': 'goodbye',
  'por favor': 'please', 'desculpe': 'excuse me, sorry',

  // ── Articles ──
  'o': 'the (masc.)', 'a': 'the (fem.)',
  'os': 'the (masc. pl.)', 'as': 'the (fem. pl.)',
  'um': 'a, one (masc.)', 'uma': 'a, one (fem.)',
  'uns': 'some (masc.)', 'umas': 'some (fem.)',

  // ── Contractions ──
  'do': 'of the (masc.)', 'da': 'of the (fem.)',
  'dos': 'of the (masc. pl.)', 'das': 'of the (fem. pl.)',
  'no': 'in the (masc.)', 'na': 'in the (fem.)',
  'nos': 'in the (masc. pl.)', 'nas': 'in the (fem. pl.)',
  'ao': 'to the (masc.)', 'aos': 'to the (masc. pl.)',
  'pelo': 'by the (masc.)', 'pela': 'by the (fem.)',
  'pelos': 'by the (masc. pl.)', 'pelas': 'by the (fem. pl.)',
  'num': 'in a (masc.)', 'numa': 'in a (fem.)',
  'neste': 'in this (masc.)', 'nesta': 'in this (fem.)',
  'nesse': 'in that (masc.)', 'nessa': 'in that (fem.)',
  'naquele': 'in that (masc.)', 'naquela': 'in that (fem.)',
  'deste': 'of this (masc.)', 'desta': 'of this (fem.)',
  'desse': 'of that (masc.)', 'dessa': 'of that (fem.)',
  'daquele': 'of that (masc.)', 'daquela': 'of that (fem.)',
  'nisso': 'in that', 'nisto': 'in this', 'naquilo': 'in that (thing)',
  'disso': 'of that', 'disto': 'of this', 'daquilo': 'of that (thing)',

  // ── Personal pronouns ──
  'eu': 'I', 'tu': 'you (informal)',
  'ele': 'he, it', 'ela': 'she, it',
  'nós': 'we', 'eles': 'they (masc.)',
  'elas': 'they (fem.)',
  'você': 'you (formal sg.)', 'vocês': 'you (pl.)',
  'a gente': 'we (informal)',

  // ── Object pronouns ──
  'me': 'me, myself', 'te': 'you, yourself',
  'se': 'oneself, himself, herself',
  'lhe': 'him, her, you (indirect obj.)',
  'lhes': 'them (indirect obj.)',
  'mim': 'me (after prep.)', 'ti': 'you (after prep.)',
  'si': 'oneself (after prep.)',
  'comigo': 'with me', 'contigo': 'with you',
  'consigo': 'with oneself',

  // ── Possessive determiners ──
  'meu': 'my (masc.)', 'minha': 'my (fem.)',
  'meus': 'my (masc. pl.)', 'minhas': 'my (fem. pl.)',
  'teu': 'your (masc.)', 'tua': 'your (fem.)',
  'teus': 'your (masc. pl.)', 'tuas': 'your (fem. pl.)',
  'seu': 'his/her/your (masc.)', 'sua': 'his/her/your (fem.)',
  'seus': 'his/her/your (masc. pl.)', 'suas': 'his/her/your (fem. pl.)',
  'nosso': 'our (masc.)', 'nossa': 'our (fem.)',
  'nossos': 'our (masc. pl.)', 'nossas': 'our (fem. pl.)',
  'dele': 'his', 'dela': 'her',
  'deles': 'their (masc.)', 'delas': 'their (fem.)',

  // ── Demonstratives ──
  'este': 'this (masc.)', 'esta': 'this (fem.)',
  'estes': 'these (masc.)', 'estas': 'these (fem.)',
  'esse': 'that (masc.)', 'essa': 'that (fem.)',
  'esses': 'those (masc.)', 'essas': 'those (fem.)',
  'aquele': 'that (masc., far)', 'aquela': 'that (fem., far)',
  'aqueles': 'those (masc., far)', 'aquelas': 'those (fem., far)',
  'isto': 'this (thing)', 'isso': 'that (thing)', 'aquilo': 'that (thing, far)',

  // ── Interrogatives / relatives ──
  'quem': 'who', 'que': 'what, that, which',
  'qual': 'which, what', 'quais': 'which (pl.)',
  'onde': 'where', 'como': 'how, like',
  'quando': 'when', 'quanto': 'how much',
  'quantos': 'how many (masc.)', 'quantas': 'how many (fem.)',
  'porque': 'because', 'por que': 'why',
  'cujo': 'whose (masc.)', 'cuja': 'whose (fem.)',

  // ── Prepositions ──
  'de': 'of, from', 'em': 'in, on, at',
  'para': 'for, to', 'por': 'by, for, through',
  'com': 'with', 'sem': 'without',
  'sobre': 'on, about, over', 'entre': 'between, among',
  'contra': 'against', 'desde': 'since, from',
  'até': 'until, up to, even', 'durante': 'during',
  'após': 'after', 'antes': 'before',
  'sob': 'under', 'perante': 'before, in front of',
  'segundo': 'according to; second',

  // ── Conjunctions ──
  'e': 'and', 'ou': 'or', 'mas': 'but',
  'nem': 'neither, nor', 'porém': 'however',
  'pois': 'because, so', 'embora': 'although',
  'enquanto': 'while', 'se': 'if',
  'caso': 'in case', 'logo': 'soon, therefore',
  'então': 'then, so', 'portanto': 'therefore',
  'todavia': 'however', 'contudo': 'however',

  // ── Adverbs ──
  'muito': 'very, much', 'muita': 'much, a lot (fem.)',
  'muitos': 'many (masc.)', 'muitas': 'many (fem.)',
  'pouco': 'little, few', 'poucos': 'few',
  'mais': 'more, most', 'menos': 'less, fewer',
  'bem': 'well', 'mal': 'badly',
  'tão': 'so, as', 'tanto': 'so much',
  'também': 'also, too', 'ainda': 'still, yet',
  'sempre': 'always', 'nunca': 'never',
  'já': 'already, now', 'agora': 'now',
  'aqui': 'here', 'ali': 'there',
  'lá': 'there (far)', 'cá': 'here',
  'hoje': 'today', 'ontem': 'yesterday',
  'amanhã': 'tomorrow', 'depois': 'after, later',
  'talvez': 'maybe, perhaps', 'realmente': 'really',
  'bastante': 'quite, enough',
  'quase': 'almost', 'demais': 'too much',
  'aí': 'there', 'assim': 'like this, so',
  'só': 'only, just', 'apenas': 'only, just',
  'principalmente': 'mainly',

  // ── Auxiliaries: ser (to be, permanent) ──
  'sou': 'am', 'és': 'are (informal)',
  'somos': 'are (we)', 'são': 'are (they)',
  'era': 'was/were', 'eras': 'were (informal)',
  'éramos': 'were (we)', 'eram': 'were (they)',
  'fui': 'was (I)', 'foi': 'was (he/she)',
  'fomos': 'were (we)', 'foram': 'were (they)',
  'seria': 'would be', 'seríamos': 'would be (we)',
  'seriam': 'would be (they)', 'serão': 'will be (they)',
  'seja': 'be (subjunctive)', 'sejam': 'be (subjunctive pl.)',
  'sejamos': 'be (subjunctive we)',
  'fosse': 'were (subjunctive)', 'fossem': 'were (subjunctive pl.)',
  'sido': 'been', 'sendo': 'being',

  // ── Auxiliaries: estar (to be, temporary) ──
  'estou': 'am (temporary)', 'está': 'is (temporary)',
  'estamos': 'are (temporary, we)', 'estão': 'are (temporary, they)',
  'estava': 'was (temporary)', 'estavam': 'were (temporary)',
  'estive': 'was (temporary, past)', 'esteve': 'was (temporary, past)',
  'estivemos': 'were (temporary, past)', 'estiveram': 'were (temporary, past)',
  'estaria': 'would be (temporary)',
  'esteja': 'be (subjunctive, temporary)',
  'estejam': 'be (subjunctive pl., temporary)',

  // ── Auxiliaries: ter (to have) ──
  'tenho': 'have (I)', 'tens': 'have (you)',
  'tem': 'has', 'temos': 'have (we)', 'têm': 'have (they)',
  'tinha': 'had', 'tinham': 'had (they)',
  'tive': 'had (I)', 'teve': 'had (he/she)',
  'tivemos': 'had (we)', 'tiveram': 'had (they)',
  'teria': 'would have', 'teriam': 'would have (they)',
  'tenha': 'have (subjunctive)', 'tenham': 'have (subjunctive pl.)',
  'tendo': 'having', 'tido': 'had (past participle)',

  // ── Auxiliaries: haver (to have, existential) ──
  'há': 'there is/are', 'havia': 'there was/were',
  'houve': 'there was/were (past)',
  'haverá': 'there will be', 'haveria': 'there would be',
  'haja': 'there be (subjunctive)',

  // ── Auxiliaries: ir (to go) ──
  'vou': 'go (I)', 'vai': 'goes',
  'vamos': 'go (we), let\'s go', 'vão': 'go (they)',

  // ── Key verbs (infinitives) ──
  'ser': 'to be (permanent)', 'estar': 'to be (temporary)',
  'ter': 'to have', 'haver': 'to have (existential)',
  'ir': 'to go', 'fazer': 'to do, to make',
  'poder': 'to be able, can', 'querer': 'to want',
  'dever': 'must, to owe', 'saber': 'to know (fact)',
  'conhecer': 'to know (person/place)', 'vir': 'to come',
  'dizer': 'to say, to tell', 'ver': 'to see',
  'dar': 'to give', 'pôr': 'to put',
  'ficar': 'to stay, to become', 'precisar': 'to need',

  // ── Common function-like words ──
  'todo': 'all, every (masc.)', 'toda': 'all, every (fem.)',
  'todos': 'all, every (masc. pl.)', 'todas': 'all, every (fem. pl.)',
  'outro': 'other (masc.)', 'outra': 'other (fem.)',
  'outros': 'others (masc.)', 'outras': 'others (fem.)',
  'mesmo': 'same, even (masc.)', 'mesma': 'same (fem.)',
  'cada': 'each, every',
  'algum': 'some (masc.)', 'alguma': 'some (fem.)',
  'alguns': 'some (masc. pl.)', 'algumas': 'some (fem. pl.)',
  'nenhum': 'none, no (masc.)', 'nenhuma': 'none, no (fem.)',
  'vários': 'several (masc.)', 'várias': 'several (fem.)',
  'certo': 'certain, right (masc.)', 'certa': 'certain (fem.)',
  'nada': 'nothing', 'ninguém': 'nobody, no one',
  'alguém': 'someone', 'tudo': 'everything',
  'algo': 'something',

  // ── Discourse markers ──
  'eis': 'here is, behold',
};

// ──────────────────────────────────────────────────────────────
// Noun/verb dual entries – Portuguese words that are both
// ──────────────────────────────────────────────────────────────
const NOUN_VERB_DUALS = {
  'viagem': { noun: 'trip, journey', verb: 'to travel' },
  'trabalho': { noun: 'work, job', verb: 'to work' },
  'caminhada': { noun: 'walk, hike', verb: 'to walk' },
  'mudança': { noun: 'change, move', verb: 'to change' },
  'guarda': { noun: 'guard', verb: 'to keep' },
  'pedido': { noun: 'order, request', verb: 'to order' },
  'visita': { noun: 'visit', verb: 'to visit' },
  'ajuda': { noun: 'help, aid', verb: 'to help' },
  'cozinha': { noun: 'kitchen', verb: 'to cook' },
  'dança': { noun: 'dance', verb: 'to dance' },
  'passeio': { noun: 'walk, stroll', verb: 'to walk' },
  'chamada': { noun: 'call', verb: 'to call' },
  'reserva': { noun: 'reserve', verb: 'to reserve' },
  'gasto': { noun: 'expense', verb: 'to spend' },
  'parada': { noun: 'stop', verb: 'to stop' },
  'volta': { noun: 'return; turn', verb: 'to return' },
  'escolha': { noun: 'choice', verb: 'to choose' },
  'desenho': { noun: 'drawing', verb: 'to draw' },
  'emprego': { noun: 'job, employment', verb: 'to employ' },
  'conta': { noun: 'account; bill', verb: 'to count' },
  'gosto': { noun: 'taste', verb: 'to like' },
  'dúvida': { noun: 'doubt', verb: 'to doubt' },
  'lugar': { noun: 'place, seat', verb: 'to place' },
  'busca': { noun: 'search', verb: 'to search' },
  'compra': { noun: 'purchase', verb: 'to buy' },
  'venda': { noun: 'sale', verb: 'to sell' },
  'troca': { noun: 'exchange', verb: 'to exchange' },
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all unique words from the deck
// ──────────────────────────────────────────────────────────────
function collectDeckData() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const wordFreq = new Map();
  const wordCards = new Map(); // word -> [{target, english}, ...]
  const uniqueSentences = new Map(); // target sentence -> card english

  for (const card of deck) {
    // Collect unique sentences
    if (card.target && !uniqueSentences.has(card.target)) {
      uniqueSentences.set(card.target, card.english);
    }

    const tokens = tokenize(card.target, 'portuguese');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '')
        .replace(/^[––\-]+|[––\-]+$/g, '')
        .trim();
      if (!w) continue;
      if (w.length < 2) continue;
      if (!/[a-zà-ÿçãõ]/i.test(w)) continue;
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      if (!wordCards.has(w)) wordCards.set(w, []);
      wordCards.get(w).push({ target: card.target, english: card.english });
    }
  }

  console.log(`Deck has ${deck.length} cards, ${wordFreq.size} unique tokens, ${uniqueSentences.size} unique sentences`);
  return { wordFreq, wordCards, uniqueSentences };
}

// ──────────────────────────────────────────────────────────────
// Parse existing dictionary for IPA / POS / lemma
// ──────────────────────────────────────────────────────────────
function parseExistingDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const existing = {};

  const entryRe = /^\s*(?:'([^']+)'|"([^"]+)"):\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',?\s*(?:pos:\s*'([^']*)')?\s*(?:,\s*lemma:\s*'([^']*)')?\s*\}/gm;
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    const key = m[1] || m[2];
    existing[key] = {
      en: m[3],
      ipa: m[4],
      pos: m[5] || '',
      lemma: m[6] || null,
    };
  }

  // Extract header: everything before `const dictionary: Record<string, DictEntry> = {`
  // Portuguese uses "const dictionary" (no export keyword on dictionary)
  let dictStart = 'const dictionary: Record<string, DictEntry> = {';
  let dictStartIdx = src.indexOf(dictStart);

  const header = dictStartIdx >= 0 ? src.slice(0, dictStartIdx) : '';

  // Extract footer: everything after the dictionary's closing `};`
  let footer = '';
  if (dictStartIdx >= 0) {
    const afterDict = src.slice(dictStartIdx);
    const lines = afterDict.split('\n');
    let braceDepth = 0;
    let dictEndLine = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      if (braceDepth === 0 && i > 0) {
        dictEndLine = i;
        break;
      }
    }
    if (dictEndLine >= 0) {
      footer = '\n' + lines.slice(dictEndLine + 1).join('\n');
    }
  }

  console.log(`Parsed ${Object.keys(existing).length} existing entries`);
  return { existing, header, footer };
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Portuguese Dictionary Rebuild v4 (Sentence Validation) ===\n');

  // Step 2: Collect deck words and sentences
  const { wordFreq, wordCards, uniqueSentences } = collectDeckData();

  // Read existing dictionary for IPA/POS/lemma preservation
  const { existing, header, footer } = parseExistingDict();

  // Separate function words from words needing translation
  const needTranslation = [];
  const functionResults = {};

  for (const [word] of wordFreq) {
    if (FUNCTION_WORDS[word]) {
      functionResults[word] = FUNCTION_WORDS[word];
    } else {
      needTranslation.push(word);
    }
  }

  console.log(`Function words: ${Object.keys(functionResults).length}`);
  console.log(`Words needing Google translation: ${needTranslation.length}`);

  // Step 3: Google Translate individual words
  console.log('\nStep 3: Translating individual words via Google...');
  const googleRaw = await translateBatch(needTranslation, 'pt');
  console.log(`Got ${Object.keys(googleRaw).length} individual translations`);

  // Step 4: Google Translate ALL unique sentences
  console.log('\nStep 4: Translating all unique sentences via Google...');
  const sentenceList = [...uniqueSentences.keys()];
  console.log(`  ${sentenceList.length} unique sentences to translate (~${Math.round(sentenceList.reduce((s, t) => s + t.length, 0) / 1000)}K chars)`);
  const sentenceTranslations = await translateSentences(sentenceList, 'pt');
  console.log(`Got ${Object.keys(sentenceTranslations).length} sentence translations`);

  // Step 5: Validate each word against sentence translations
  console.log('\nStep 5: Validating words against sentence contexts...');
  let enrichedCount = 0;
  const enrichedDefs = {};

  for (const [word, rawTrans] of Object.entries(googleRaw)) {
    const cards = wordCards.get(word);
    if (!cards || cards.length === 0) {
      enrichedDefs[word] = rawTrans;
      continue;
    }

    // Build contexts: each card's English + Google's sentence translation
    const contexts = cards.map(card => ({
      cardEnglish: card.english,
      sentenceTranslation: sentenceTranslations[card.target] || '',
    }));

    const enriched = validateAndEnrich(word, rawTrans, contexts);
    enrichedDefs[word] = enriched;

    if (enriched !== rawTrans) {
      enrichedCount++;
    }
  }
  console.log(`Enriched ${enrichedCount} definitions with sentence-validated senses`);

  // Step 6: Post-process all 18 rules
  console.log('\nStep 6: Post-processing (18-rule pipeline)...');
  const stats = new PostProcessStats();
  const processed = {};

  // Process function words (hand-curated, no post-processing)
  for (const [word, def] of Object.entries(functionResults)) {
    processed[word] = { en: def, source: 'function_table' };
  }

  // Process enriched Google results
  for (const [word, enrichedTrans] of Object.entries(enrichedDefs)) {
    const existingPos = existing[word]?.pos || 'n';
    const result = postProcess(enrichedTrans, existingPos, word, stats);
    processed[word] = { en: result.text, source: 'google', flagged: result.flagged, flagReasons: result.flagReasons };
  }

  console.log('\n' + stats.report());

  // Step 7: Lemma copy – verified lemmas get base word's definition
  console.log('\nStep 7: Lemma copy...');

  // 7a: Bad lemma removal first
  let badLemmaCount = 0;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && !existing[ex.lemma] && !processed[ex.lemma]) {
      ex.lemma = null;
      badLemmaCount++;
    }
  }
  console.log(`  Removed ${badLemmaCount} bad lemma references`);

  // 7b: Strict lemma copy
  let lemmaCopied = 0;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && processed[ex.lemma] && processed[word]) {
      processed[word].en = processed[ex.lemma].en;
      lemmaCopied++;
    }
  }
  console.log(`  Copied lemma definitions for ${lemmaCopied} entries`);

  // Step 8: Noun/verb dual entries
  console.log('\nStep 8: Applying noun/verb dual entries...');
  let dualCount = 0;
  for (const [word, defs] of Object.entries(NOUN_VERB_DUALS)) {
    if (processed[word]) {
      const ex = existing[word] || {};
      const pos = ex.pos || 'n';
      if (pos === 'n') {
        processed[word].en = defs.noun + '; ' + defs.verb.replace(/^to /, '');
      } else if (pos === 'v') {
        processed[word].en = defs.verb;
      } else {
        processed[word].en = defs.noun + '; ' + defs.verb.replace(/^to /, '');
      }
      dualCount++;
    }
  }
  console.log(`  Applied ${dualCount} noun/verb dual entries`);

  // Step 9: Build and write dictionary
  console.log('\nStep 9: Writing dictionary...');
  const entries = [];
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'pt'));

  // Also include existing dictionary words not in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'pt'));

  // Deduplicate
  const seenWords = new Set();
  const dedupedWords = [];
  for (const w of allWords) {
    if (!seenWords.has(w)) {
      seenWords.add(w);
      dedupedWords.push(w);
    }
  }

  for (const word of dedupedWords) {
    const proc = processed[word];
    const ex = existing[word] || {};
    const ipa = ex.ipa || '';
    const pos = ex.pos || (proc ? (proc.en.startsWith('to ') ? 'v' : 'n') : 'n');
    const lemma = ex.lemma || null;
    let en = proc ? proc.en : ex.en;

    if (!en) continue;

    // Force lowercase for non-proper nouns
    if (en.length > 0 && en[0] === en[0].toUpperCase() && en[0] !== en[0].toLowerCase()) {
      const existingEn = ex.en || '';
      const existingWasCapitalized = existingEn.length > 0 && existingEn[0] === existingEn[0].toUpperCase() && existingEn[0] !== existingEn[0].toLowerCase();
      const isProperNoun = /^(Brazil|Brasil|Portugal|Lisbon|Lisboa|Rio|S[aã]o Paulo|Brasília|Europe|Christmas|Easter|Atlantic|Amazon)$/i.test(en);
      if (!existingWasCapitalized && !isProperNoun) {
        en = en[0].toLowerCase() + en.slice(1);
      }
    }

    // Ensure verbs have "to " prefix
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
      en = 'to ' + en;
    }
    // Ensure non-verbs don't have "to " prefix
    if (pos !== 'v' && en.startsWith('to ') && !en.startsWith('to the') && !en.includes(';')) {
      en = en.replace(/^to /, '');
    }

    // Escape single quotes in values
    const enEsc = en.replace(/'/g, "\\'");
    const ipaEsc = ipa.replace(/'/g, "\\'");

    // Use double quotes for word keys that contain apostrophes
    const wordHasQuote = word.includes("'") || word.includes('\u2019') || word.includes('\u2018');
    const wordQuote = wordHasQuote ? '"' : "'";
    let line = `  ${wordQuote}${word}${wordQuote}: { en: '${enEsc}', ipa: '${ipaEsc}', pos: '${pos}'`;
    if (lemma) {
      line += `, lemma: '${lemma}'`;
    }
    line += ' },';
    entries.push(line);
  }

  // Portuguese dict uses `const dictionary` (no export on dictionary itself)
  const dictContent = header
    + 'const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 10: 100-entry review -> pt-v5-review.md
  console.log('\nStep 10: Running 100-entry review...');
  const reviewResults = [];
  const allEntryWords = dedupedWords.filter(w => processed[w]);
  const sampleSize = Math.min(100, allEntryWords.length);
  const sample = [];

  // Random sample
  const indices = new Set();
  while (indices.size < sampleSize) {
    indices.add(Math.floor(Math.random() * allEntryWords.length));
  }
  for (const idx of indices) {
    sample.push(allEntryWords[idx]);
  }

  let pass = 0, fail = 0;
  const issues = [];

  for (const word of sample) {
    const proc = processed[word];
    const ex = existing[word] || {};
    const pos = ex.pos || (proc.en.startsWith('to ') ? 'v' : 'n');
    const en = proc.en;
    const problems = [];

    // 1. Wrong "to " prefix on nouns
    if (pos === 'n' && en.startsWith('to ') && !en.startsWith('to the') && !en.includes(';')) {
      problems.push('wrong_to_on_noun');
    }
    // 2. Missing "to " on verbs
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
      problems.push('missing_to_on_verb');
    }
    // 3. Conjugated English forms
    if (/\b(eats|goes|comes|reads|writes|runs|sees|gives|takes|makes|knows|thinks|says|gets|wants|works|plays|lives|loves|feels|finds|tells|asks|uses|tries|needs|keeps|brings|starts|moves|pays|meets|calls|shows|helps)\b/i.test(en)) {
      problems.push('conjugated_english');
    }
    if (/\b\w+ing\b/.test(en.replace(/^to /, '')) && !/(thing|morning|evening|ring|king|spring|string|sing|bring|nothing|something|anything|everything|ceiling|feeling|building|wedding|clothing|warning|opening|meaning|meeting|setting|beginning|during|amazing|interesting|willing|missing|fishing|cooking|swimming|parking|reading|living|working|shopping|nursing|banking|housing)/.test(en)) {
      problems.push('conjugated_english_ing');
    }
    if (/\b(went|came|saw|gave|took|made|knew|thought|told|found|left|kept|brought|bought|sold|caught|taught|built|sent|spent|lost|won|met|led|heard|felt|stood|sat|ran|hung|held|lay|paid|said|wore|ate|drank|drove|wrote|broke|spoke|chose|grew|threw|drew|flew|froze|rode|rose|shook|stole|swore|tore|woke)\b/.test(en.replace(/^to /, ''))) {
      problems.push('conjugated_english_past');
    }
    // 4. Mixed case in definition
    if (/[a-z][A-Z]/.test(en)) {
      problems.push('mixed_case');
    }
    // 5. ALL CAPS
    if (/^[A-Z]{2,}$/.test(en)) {
      problems.push('all_caps');
    }
    // 6. Self-referencing
    if (proc.flagReasons && proc.flagReasons.includes('self_referencing')) {
      problems.push('self_referencing');
    }
    // 7. Grammar descriptions in definitions
    if (/\b(conjugat|declens|tense|plural|singular|masculine|feminine|suffix|prefix|inflect|grammar)\b/i.test(en)) {
      problems.push('grammar_description');
    }
    // 8. Truncated / placeholder
    if (en === '?' || en.length < 2) {
      problems.push('truncated');
    }
    // 9. Wrong POS
    if (proc.flagReasons && proc.flagReasons.includes('wrong_pos')) {
      problems.push('wrong_pos');
    }

    if (problems.length === 0) {
      pass++;
      reviewResults.push({ word, en, pos, status: 'PASS' });
    } else {
      fail++;
      reviewResults.push({ word, en, pos, status: 'FAIL', problems });
      issues.push({ word, en, pos, problems });
    }
  }

  const grade = pass >= 90 ? 'A' : pass >= 80 ? 'B' : pass >= 70 ? 'C' : pass >= 60 ? 'D' : 'F';

  // Write review
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let md = `# Portuguese Dictionary v4 Rebuild (Sentence Validation) - 100-Entry Review\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries written:** ${entries.length}\n`;
  md += `**Function words:** ${Object.keys(functionResults).length}\n`;
  md += `**Google translated (individual):** ${Object.keys(googleRaw).length}\n`;
  md += `**Sentences translated:** ${Object.keys(sentenceTranslations).length}\n`;
  md += `**Enriched by sentence validation:** ${enrichedCount}\n`;
  md += `**Lemma-copied:** ${lemmaCopied}\n`;
  md += `**Bad lemmas removed:** ${badLemmaCount}\n`;
  md += `**Noun/verb duals applied:** ${dualCount}\n\n`;
  md += `## Review Results\n\n`;
  md += `**Pass:** ${pass} / ${sampleSize}\n`;
  md += `**Fail:** ${fail} / ${sampleSize}\n`;
  md += `**Grade:** ${grade}\n\n`;

  if (issues.length > 0) {
    md += `## Issues Found\n\n`;
    md += `| Word | English | POS | Problems |\n`;
    md += `|------|---------|-----|----------|\n`;
    for (const i of issues) {
      md += `| ${i.word} | ${i.en} | ${i.pos} | ${i.problems.join(', ')} |\n`;
    }
    md += '\n';
  }

  md += `## Full Sample\n\n`;
  md += `| # | Word | English | POS | Status |\n`;
  md += `|---|------|---------|-----|--------|\n`;
  for (let i = 0; i < reviewResults.length; i++) {
    const r = reviewResults[i];
    md += `| ${i + 1} | ${r.word} | ${r.en} | ${r.pos} | ${r.status} |\n`;
  }

  md += `\n## Post-Processing Stats\n\n\`\`\`\n${stats.report()}\n\`\`\`\n`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'pt-v5-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/pt-v5-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
