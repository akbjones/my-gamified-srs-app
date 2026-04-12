#!/usr/bin/env node
/**
 * Rebuild Italian dictionary v4 — full-sentence validation approach.
 *
 * Steps:
 *  1. Italian function word table (~180 entries, never sent to Google)
 *  2. Collect all unique words from deck via tokenize(sentence, 'italian')
 *  3. Google Translate individual words via translateBatch()
 *  4. Google Translate ALL unique sentences via translateSentences()
 *  5. For each word, validate against sentence translations via validateAndEnrich()
 *  6. Post-process every result via postProcess() (18-rule pipeline)
 *  7. Lemma copy — verified lemmas get their base word's definition
 *  8. Noun/verb dual entries (viaggio, lavoro, etc.)
 *  9. Apply to it.ts, preserve IPA/lemma/pos + lookupWord + reverseVerb
 * 10. 100-entry random review -> scripts/output/it-v5-review.md
 *
 * COST NOTE: ~3,944 cards x ~55 chars = ~217K chars. Well within free tier.
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, translateSentences, tokenize, validateAndEnrich } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/italian/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/it.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Italian function word table (~180 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Greetings / common expressions ──
  'ciao': 'hello, bye', 'buongiorno': 'good morning, hello',
  'buonasera': 'good evening', 'buonanotte': 'good night',
  'grazie': 'thank you', 'prego': 'you\'re welcome, please',
  'scusa': 'excuse me, sorry', 'scusi': 'excuse me (formal)',
  'arrivederci': 'goodbye',

  // ── Articles ──
  'il': 'the (masc. sing.)', 'lo': 'the (masc. sing. before s+cons/z)',
  'la': 'the (fem. sing.)', 'le': 'the (fem. pl.)',
  'li': 'them (masc.)', 'gli': 'the (masc. pl.); to him',
  'un': 'a, one (masc.)', 'uno': 'a, one (masc. before s+cons/z)',
  'una': 'a, one (fem.)',

  // ── Prepositioned articles ──
  'al': 'to the (masc.)', 'allo': 'to the (masc. s+cons/z)',
  'alla': 'to the (fem.)', 'alle': 'to the (fem. pl.)',
  'agli': 'to the (masc. pl.)', 'ai': 'to the (masc. pl.)',
  'del': 'of the (masc.)', 'dello': 'of the (masc. s+cons/z)',
  'della': 'of the (fem.)', 'delle': 'of the (fem. pl.)',
  'degli': 'of the (masc. pl.)', 'dei': 'of the (masc. pl.)',
  'dal': 'from the (masc.)', 'dallo': 'from the (masc. s+cons/z)',
  'dalla': 'from the (fem.)', 'dalle': 'from the (fem. pl.)',
  'dagli': 'from the (masc. pl.)', 'dai': 'from the (masc. pl.)',
  'nel': 'in the (masc.)', 'nello': 'in the (masc. s+cons/z)',
  'nella': 'in the (fem.)', 'nelle': 'in the (fem. pl.)',
  'negli': 'in the (masc. pl.)', 'nei': 'in the (masc. pl.)',
  'sul': 'on the (masc.)', 'sullo': 'on the (masc. s+cons/z)',
  'sulla': 'on the (fem.)', 'sulle': 'on the (fem. pl.)',
  'sugli': 'on the (masc. pl.)', 'sui': 'on the (masc. pl.)',
  'col': 'with the (masc.)',

  // ── Personal pronouns ──
  'io': 'I', 'tu': 'you (informal)', 'lui': 'he',
  'lei': 'she; you (formal)', 'noi': 'we',
  'voi': 'you (plural)', 'loro': 'they, them',
  'esso': 'it (masc.)', 'essa': 'it (fem.)',

  // ── Object pronouns ──
  'me': 'me', 'mi': 'me, to me, myself',
  'ti': 'you, to you, yourself', 'ci': 'us, to us, there',
  'vi': 'you (pl.), to you', 'si': 'oneself, themselves',
  'ne': 'of it, some, about it',

  // ── Possessive determiners ──
  'mio': 'my (masc.)', 'mia': 'my (fem.)',
  'miei': 'my (masc. pl.)', 'mie': 'my (fem. pl.)',
  'tuo': 'your (masc.)', 'tua': 'your (fem.)',
  'tuoi': 'your (masc. pl.)', 'tue': 'your (fem. pl.)',
  'suo': 'his/her/your (masc.)', 'sua': 'his/her/your (fem.)',
  'suoi': 'his/her (masc. pl.)', 'sue': 'his/her (fem. pl.)',
  'nostro': 'our (masc.)', 'nostra': 'our (fem.)',
  'nostri': 'our (masc. pl.)', 'nostre': 'our (fem. pl.)',
  'vostro': 'your (masc. pl.)', 'vostra': 'your (fem. pl.)',
  'vostri': 'your (masc. pl.)', 'vostre': 'your (fem. pl.)',

  // ── Demonstratives ──
  'questo': 'this (masc.)', 'questa': 'this (fem.)',
  'questi': 'these (masc.)', 'queste': 'these (fem.)',
  'quello': 'that (masc.)', 'quella': 'that (fem.)',
  'quelli': 'those (masc.)', 'quelle': 'those (fem.)',
  'ciò': 'this, that (abstract)',

  // ── Interrogatives / relatives ──
  'chi': 'who', 'che': 'what, that, which',
  'cosa': 'what, thing', 'quale': 'which, what',
  'quali': 'which (pl.)', 'quanto': 'how much (masc.)',
  'quanta': 'how much (fem.)', 'quanti': 'how many (masc.)',
  'quante': 'how many (fem.)',
  'come': 'how, like', 'dove': 'where',
  'quando': 'when', 'perché': 'why, because',
  'cui': 'which, whom (relative)',

  // ── Prepositions ──
  'di': 'of, from', 'da': 'from, by, since',
  'in': 'in, into', 'con': 'with',
  'su': 'on, upon', 'per': 'for, through',
  'tra': 'between, among', 'fra': 'between, among',
  'verso': 'toward', 'contro': 'against',
  'senza': 'without', 'durante': 'during',
  'dopo': 'after', 'prima': 'before, first',
  'sotto': 'under', 'sopra': 'above, over',
  'davanti': 'in front of', 'dietro': 'behind',
  'dentro': 'inside', 'fuori': 'outside',
  'oltre': 'beyond, besides', 'lungo': 'along',
  'mediante': 'by means of', 'nonostante': 'despite',
  'secondo': 'according to; second',
  'presso': 'near, at',

  // ── Conjunctions ──
  'e': 'and', 'ed': 'and (before vowel)',
  'o': 'or', 'ma': 'but',
  'però': 'however, but', 'quindi': 'therefore, so',
  'dunque': 'therefore, so', 'oppure': 'or else',
  'né': 'neither, nor', 'sia': 'both; whether',
  'se': 'if', 'poiché': 'since, because',
  'affinché': 'so that', 'sebbene': 'although',
  'benché': 'although', 'anzi': 'rather, on the contrary',
  'eppure': 'and yet', 'purché': 'provided that',

  // ── Adverbs ──
  'non': 'not', 'no': 'no',
  'sì': 'yes', 'più': 'more, no more',
  'meno': 'less, fewer', 'molto': 'very, much, a lot',
  'poco': 'little, few', 'troppo': 'too much, too',
  'abbastanza': 'enough, fairly',
  'anche': 'also, too', 'ancora': 'still, again, yet',
  'sempre': 'always', 'mai': 'never, ever',
  'spesso': 'often', 'già': 'already',
  'qui': 'here', 'qua': 'here',
  'là': 'there', 'lì': 'there',
  'ora': 'now', 'adesso': 'now',
  'poi': 'then, later', 'allora': 'then, so',
  'subito': 'immediately', 'presto': 'soon, early',
  'tardi': 'late', 'oggi': 'today',
  'domani': 'tomorrow', 'ieri': 'yesterday',
  'bene': 'well', 'male': 'badly',
  'forse': 'maybe, perhaps', 'proprio': 'really, exactly; own',
  'solo': 'only, alone', 'insieme': 'together',
  'quasi': 'almost', 'circa': 'about, approximately',
  'davvero': 'really, truly', 'comunque': 'anyway, however',
  'soprattutto': 'especially, above all',
  'finalmente': 'finally', 'invece': 'instead',

  // ── Auxiliaries: essere (to be) ──
  'sono': 'am, are (I/they)', 'sei': 'are (you)',
  'è': 'is', 'siamo': 'are (we)',
  'siete': 'are (you pl.)', 'era': 'was, were',
  'ero': 'was (I)', 'eri': 'were (you)',
  'eravamo': 'were (we)', 'eravate': 'were (you pl.)',
  'erano': 'were (they)', 'stato': 'been (masc.)',
  'stata': 'been (fem.)', 'stati': 'been (masc. pl.)',
  'state': 'been (fem. pl.)',
  'sarà': 'will be', 'sarò': 'will be (I)',
  'sarai': 'will be (you)', 'saremo': 'will be (we)',
  'sarete': 'will be (you pl.)', 'saranno': 'will be (they)',
  'sarebbe': 'would be', 'sarei': 'would be (I)',
  'saresti': 'would be (you)',
  'saremmo': 'would be (we)', 'sarebbero': 'would be (they)',
  'sia': 'be (subjunctive)', 'siano': 'be (subjunctive pl.)',
  'fosse': 'were (subjunctive)', 'fossi': 'were (subj. I/you)',
  'fossero': 'were (subjunctive pl.)',
  'fu': 'was (historical)',

  // ── Auxiliaries: avere (to have) ──
  'ho': 'have (I)', 'hai': 'have (you)',
  'ha': 'has', 'abbiamo': 'have (we)',
  'avete': 'have (you pl.)', 'hanno': 'have (they)',
  'avevo': 'had (I)', 'avevi': 'had (you)',
  'aveva': 'had (he/she)', 'avevamo': 'had (we)',
  'avevate': 'had (you pl.)', 'avevano': 'had (they)',
  'avuto': 'had (past participle)',
  'avrà': 'will have', 'avrò': 'will have (I)',
  'avrai': 'will have (you)', 'avremo': 'will have (we)',
  'avranno': 'will have (they)',
  'avrebbe': 'would have', 'avrei': 'would have (I)',
  'avremmo': 'would have (we)', 'avrebbero': 'would have (they)',
  'abbia': 'have (subjunctive)', 'abbiano': 'have (subjunctive pl.)',
  'avesse': 'had (subjunctive)', 'avessi': 'had (subj. I/you)',
  'avessero': 'had (subjunctive pl.)',
  'ebbe': 'had (historical)',

  // ── Key verbs (infinitives) ──
  'essere': 'to be', 'avere': 'to have',
  'fare': 'to do, to make', 'andare': 'to go',
  'potere': 'to be able, can', 'volere': 'to want',
  'dovere': 'to have to, must', 'sapere': 'to know (fact)',
  'conoscere': 'to know (person/place)', 'venire': 'to come',
  'dire': 'to say, to tell', 'vedere': 'to see',
  'prendere': 'to take', 'dare': 'to give',
  'mettere': 'to put', 'stare': 'to stay, to be',

  // ── Common function-like words ──
  'tutto': 'all, everything (masc.)', 'tutta': 'all (fem.)',
  'tutti': 'all, everyone (masc. pl.)', 'tutte': 'all (fem. pl.)',
  'altro': 'other (masc.)', 'altra': 'other (fem.)',
  'altri': 'others (masc.)', 'altre': 'others (fem.)',
  'stesso': 'same, self (masc.)', 'stessa': 'same, self (fem.)',
  'ogni': 'every, each', 'qualche': 'some, a few',
  'nessuno': 'no one, none', 'nessuna': 'no one, none (fem.)',
  'qualcuno': 'someone', 'qualcosa': 'something',
  'niente': 'nothing', 'nulla': 'nothing',
  'alcuno': 'some, any', 'alcuna': 'some, any (fem.)',
  'alcuni': 'some (masc. pl.)', 'alcune': 'some (fem. pl.)',
  'ecco': 'here is, there is',
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

    const tokens = tokenize(card.target, 'italian');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '')
        .replace(/^[—–\-]+|[—–\-]+$/g, '')
        .trim();
      if (!w) continue;
      if (w.length < 2) continue;
      if (!/[a-zà-ÿœæ]/i.test(w)) continue;
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

  // Extract header: everything before `export const dictionary: Record<string, DictEntry> = {`
  let dictStart = 'export const dictionary: Record<string, DictEntry> = {';
  let dictStartIdx = src.indexOf(dictStart);
  if (dictStartIdx < 0) {
    dictStart = 'const dictionary: Record<string, DictEntry> = {';
    dictStartIdx = src.indexOf(dictStart);
  }
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
// Noun/verb dual entries — Italian words that are both noun and verb
// ──────────────────────────────────────────────────────────────
const NOUN_VERB_DUALS = {
  'viaggio': { noun: 'trip, journey', verb: 'to travel' },
  'lavoro': { noun: 'work, job', verb: 'to work' },
  'studio': { noun: 'study; studio', verb: 'to study' },
  'cambio': { noun: 'change, exchange', verb: 'to change' },
  'ballo': { noun: 'dance, ball', verb: 'to dance' },
  'gioco': { noun: 'game, play', verb: 'to play' },
  'sogno': { noun: 'dream', verb: 'to dream' },
  'disegno': { noun: 'drawing, design', verb: 'to draw' },
  'aiuto': { noun: 'help, aid', verb: 'to help' },
  'desiderio': { noun: 'desire, wish', verb: 'to desire' },
  'invito': { noun: 'invitation', verb: 'to invite' },
  'ordine': { noun: 'order', verb: 'to order' },
  'arrivo': { noun: 'arrival', verb: 'to arrive' },
  'ritorno': { noun: 'return', verb: 'to return' },
  'aumento': { noun: 'increase', verb: 'to increase' },
  'controllo': { noun: 'control, check', verb: 'to control' },
  'commento': { noun: 'comment', verb: 'to comment' },
  'contatto': { noun: 'contact', verb: 'to contact' },
  'gusto': { noun: 'taste, flavor', verb: 'to taste' },
  'saluto': { noun: 'greeting', verb: 'to greet' },
  'rispetto': { noun: 'respect', verb: 'to respect' },
  'costo': { noun: 'cost', verb: 'to cost' },
  'dubbio': { noun: 'doubt', verb: 'to doubt' },
  'acquisto': { noun: 'purchase', verb: 'to buy' },
  'pranzo': { noun: 'lunch', verb: 'to have lunch' },
  'spesa': { noun: 'expense; shopping', verb: 'to spend' },
  'visita': { noun: 'visit', verb: 'to visit' },
  'cucina': { noun: 'kitchen; cooking', verb: 'to cook' },
  'passeggiata': { noun: 'walk, stroll', verb: 'to walk' },
  'scelta': { noun: 'choice', verb: 'to choose' },
};

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Italian Dictionary Rebuild v4 (Sentence Validation) ===\n');

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
  const googleRaw = await translateBatch(needTranslation, 'it');
  console.log(`Got ${Object.keys(googleRaw).length} individual translations`);

  // Step 4: Google Translate ALL unique sentences
  console.log('\nStep 4: Translating all unique sentences via Google...');
  const sentenceList = [...uniqueSentences.keys()];
  console.log(`  ${sentenceList.length} unique sentences to translate (~${Math.round(sentenceList.reduce((s, t) => s + t.length, 0) / 1000)}K chars)`);
  const sentenceTranslations = await translateSentences(sentenceList, 'it');
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

  // Step 7: Lemma copy — verified lemmas get base word's definition
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
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'it'));

  // Also include existing dictionary words not in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'it'));

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
      const isProperNoun = /^(Italy|Rome|Milan|Florence|Venice|Naples|Turin|Genoa|Bologna|Palermo|Sicily|Sardinia|Tuscany|Europe|Christmas|Easter|Mediterranean)$/i.test(en);
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

  // Italian dict uses `export const dictionary`
  const dictContent = header
    + 'export const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 10: 100-entry review -> it-v5-review.md
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

  let md = `# Italian Dictionary v4 Rebuild (Sentence Validation) - 100-Entry Review\n\n`;
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

  fs.writeFileSync(path.join(OUTPUT_DIR, 'it-v5-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/it-v5-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
