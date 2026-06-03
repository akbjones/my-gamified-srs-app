#!/usr/bin/env node
/**
 * Rebuild German dictionary v4 – full-sentence validation approach.
 *
 * Steps:
 *  1. German function word table (~200 entries, never sent to Google)
 *  2. Collect all unique words from deck via tokenize(sentence, 'german')
 *  3. Google Translate individual words via translateBatch()
 *  4. Google Translate ALL unique sentences via translateSentences()
 *  5. For each word, validate against sentence translations via validateAndEnrich()
 *  6. Post-process every result via postProcess() (18-rule pipeline)
 *  7. Lemma copy – verified lemmas get their base word's definition
 *  8. Noun/verb dual entries (German words that are both noun and verb)
 *  9. Apply to de.ts, preserve IPA/lemma/pos + CONTRACTION_MAP + IRREGULAR_MAP + lookupWord + reverseVerb
 * 10. 100-entry random review -> scripts/output/de-v5-review.md
 *
 * NOTE: German dict uses `const DICT` (uppercase), NOT `export const dictionary`.
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, translateSentences, tokenize, validateAndEnrich } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/german/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/de.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: German function word table (~200 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Articles ──
  'der': 'the (m. nom.)', 'die': 'the (f./pl.)', 'das': 'the (n.)',
  'den': 'the (m. acc.)', 'dem': 'the (dat.)', 'des': 'the (gen.)',
  'ein': 'a, one', 'eine': 'a (f.)', 'einen': 'a (m. acc.)',
  'einem': 'a (dat.)', 'einer': 'a (f. dat./gen.)', 'eines': 'a (n. gen.)',

  // ── Personal pronouns ──
  'ich': 'I', 'du': 'you (informal)', 'er': 'he',
  'sie': 'she, they, you (formal)', 'es': 'it', 'wir': 'we', 'ihr': 'you (pl.)',

  // ── Accusative/dative pronouns ──
  'mich': 'me (acc.)', 'dich': 'you (acc.)', 'sich': 'oneself',
  'uns': 'us', 'euch': 'you (pl. acc./dat.)',
  'mir': 'me (dat.)', 'dir': 'you (dat.)',
  'ihm': 'him (dat.)', 'ihnen': 'them (dat.)',

  // ── Possessive pronouns ──
  'mein': 'my', 'meine': 'my (f./pl.)', 'meinen': 'my (acc.)',
  'meinem': 'my (dat.)', 'meiner': 'my (gen./dat. f.)',
  'meines': 'my (n. gen.)',
  'dein': 'your (informal)', 'deine': 'your (f./pl.)',
  'deinen': 'your (acc.)', 'deinem': 'your (dat.)',
  'sein': 'his, its; to be', 'seine': 'his (f./pl.)', 'seinem': 'his (dat.)',
  'seiner': 'his (gen.)', 'seinen': 'his (acc.)',
  'ihr': 'her, their; you (pl.)', 'ihre': 'her/their (f./pl.)',
  'ihrem': 'her/their (dat.)', 'ihren': 'her/their (acc.)', 'ihrer': 'her/their (gen.)',
  'unser': 'our', 'unsere': 'our (f./pl.)', 'unserem': 'our (dat.)',
  'unseren': 'our (acc.)', 'unserer': 'our (gen.)',
  'euer': 'your (pl.)', 'eure': 'your (pl. f.)',

  // ── Interrogative pronouns ──
  'wer': 'who', 'wen': 'whom (acc.)', 'wem': 'whom (dat.)', 'wessen': 'whose',
  'was': 'what', 'wo': 'where', 'wann': 'when',
  'wie': 'how', 'warum': 'why', 'wieso': 'why',
  'welch': 'which', 'welche': 'which (f./pl.)', 'welchen': 'which (acc.)',
  'welchem': 'which (dat.)', 'welches': 'which (n.)',
  'wohin': 'where to', 'woher': 'where from',

  // ── Demonstrative pronouns ──
  'dieser': 'this (m.)', 'diese': 'this (f.), these', 'dieses': 'this (n.)',
  'diesem': 'this (dat.)', 'diesen': 'this (acc.)',
  'jener': 'that (m.)', 'jene': 'that (f.), those', 'jenes': 'that (n.)',
  'jeder': 'every, each (m.)', 'jede': 'every, each (f.)', 'jedes': 'every, each (n.)',
  'jeden': 'every (acc.)', 'jedem': 'every (dat.)',

  // ── Relative pronouns ──
  'dessen': 'whose (m./n.)', 'deren': 'whose (f./pl.)',
  'denen': 'whom (dat. pl.)',

  // ── Negative / indefinite ──
  'kein': 'no, none', 'keine': 'no, none (f./pl.)', 'keinen': 'no, none (acc.)',
  'keinem': 'no, none (dat.)', 'keiner': 'no, none (gen.)',
  'man': 'one, you (generic)', 'nicht': 'not', 'nichts': 'nothing',
  'niemand': 'nobody', 'etwas': 'something, somewhat',
  'alles': 'everything', 'alle': 'all', 'aller': 'all (gen.)',
  'allem': 'all (dat.)', 'allen': 'all (dat. pl.)',
  'jemand': 'someone', 'irgendwo': 'somewhere',

  // ── Prepositions ──
  'in': 'in, into', 'an': 'at, on', 'auf': 'on, onto', 'über': 'over, about',
  'unter': 'under, among', 'vor': 'before, in front of', 'hinter': 'behind',
  'neben': 'next to, beside', 'zwischen': 'between',
  'zu': 'to, at', 'nach': 'to, after', 'von': 'from, of', 'mit': 'with',
  'bei': 'at, near', 'aus': 'from, out of', 'für': 'for',
  'um': 'around, at', 'durch': 'through', 'gegen': 'against',
  'ohne': 'without', 'bis': 'until, to', 'seit': 'since, for',
  'während': 'during, while', 'trotz': 'despite', 'wegen': 'because of',
  'statt': 'instead of', 'außer': 'except, besides',
  'entlang': 'along', 'gegenüber': 'opposite',
  'innerhalb': 'within', 'außerhalb': 'outside of',

  // ── Conjunctions ──
  'und': 'and', 'oder': 'or', 'aber': 'but', 'denn': 'because, for',
  'weil': 'because', 'dass': 'that', 'wenn': 'if, when',
  'als': 'when, as, than', 'ob': 'whether', 'sondern': 'but rather',
  'doch': 'but, however, yet', 'jedoch': 'however', 'sonst': 'otherwise',
  'damit': 'so that', 'obwohl': 'although', 'sowohl': 'as well as',
  'weder': 'neither', 'noch': 'still, yet; nor', 'bevor': 'before',
  'nachdem': 'after', 'sobald': 'as soon as', 'solange': 'as long as',
  'indem': 'by (doing)', 'falls': 'in case',

  // ── Adverbs ──
  'sehr': 'very', 'auch': 'also, too', 'schon': 'already',
  'nie': 'never', 'niemals': 'never',
  'immer': 'always', 'oft': 'often', 'hier': 'here',
  'da': 'there, since', 'dort': 'there', 'heute': 'today',
  'morgen': 'tomorrow; morning', 'gestern': 'yesterday', 'jetzt': 'now',
  'dann': 'then', 'gern': 'gladly, willingly', 'gerne': 'gladly',
  'eigentlich': 'actually', 'vielleicht': 'maybe, perhaps',
  'natürlich': 'naturally, of course', 'wirklich': 'really',
  'leider': 'unfortunately', 'trotzdem': 'nevertheless',
  'deshalb': 'therefore', 'daher': 'therefore, hence',
  'außerdem': 'moreover, besides', 'zuerst': 'first, at first',
  'danach': 'after that', 'schließlich': 'finally',
  'ganz': 'quite, entirely', 'nur': 'only', 'so': 'so, thus',
  'ja': 'yes', 'nein': 'no', 'mal': 'once, time',
  'wieder': 'again', 'zusammen': 'together',
  'ziemlich': 'quite, fairly', 'fast': 'almost',
  'bald': 'soon', 'bereits': 'already', 'sogar': 'even',
  'kaum': 'hardly, barely', 'genug': 'enough',
  'besonders': 'especially', 'ungefähr': 'approximately',
  'plötzlich': 'suddenly', 'endlich': 'finally',
  'allerdings': 'however, admittedly', 'übrigens': 'by the way',
  'überhaupt': 'at all', 'irgendwie': 'somehow',
  'meistens': 'mostly', 'normalerweise': 'normally',
  'wahrscheinlich': 'probably', 'bestimmt': 'certainly, definitely',
  'tatsächlich': 'actually, indeed', 'offenbar': 'apparently',
  'anscheinend': 'apparently', 'vermutlich': 'presumably',
  'hoffentlich': 'hopefully', 'glücklicherweise': 'fortunately',
  'leider': 'unfortunately', 'selbst': 'self, even',
  'oben': 'above, upstairs', 'unten': 'below, downstairs',
  'draußen': 'outside', 'drinnen': 'inside',
  'links': 'left', 'rechts': 'right', 'geradeaus': 'straight ahead',

  // ── Auxiliaries: sein ──
  'bin': 'am', 'bist': 'are (you)', 'ist': 'is',
  'sind': 'are', 'seid': 'are (you pl.)',
  'war': 'was', 'warst': 'were (you)', 'waren': 'were', 'wart': 'were (you pl.)',
  'gewesen': 'been', 'sei': 'be (subjunctive)',
  'wäre': 'would be', 'wären': 'would be (pl.)',

  // ── Auxiliaries: haben ──
  'habe': 'have', 'hast': 'have (you)', 'hat': 'has',
  'haben': 'to have', 'habt': 'have (you pl.)',
  'hatte': 'had', 'hattest': 'had (you)', 'hatten': 'had (pl.)',
  'hätte': 'would have', 'hätten': 'would have (pl.)',
  'gehabt': 'had (past part.)',

  // ── Auxiliaries: werden ──
  'werde': 'will, become', 'wirst': 'will (you)', 'wird': 'will, becomes',
  'werden': 'to become', 'werdet': 'will (you pl.)',
  'wurde': 'became', 'würde': 'would', 'würden': 'would (pl.)',
  'geworden': 'become (past part.)',

  // ── Modals: können ──
  'kann': 'can', 'kannst': 'can (you)', 'können': 'to be able to', 'könnt': 'can (you pl.)',
  'konnte': 'could', 'könnte': 'could (subj.)', 'könnten': 'could (pl.)',

  // ── Modals: müssen ──
  'muss': 'must', 'musst': 'must (you)', 'müssen': 'to have to', 'müsst': 'must (you pl.)',
  'musste': 'had to', 'müsste': 'would have to',

  // ── Modals: dürfen ──
  'darf': 'may', 'darfst': 'may (you)', 'dürfen': 'to be allowed to',
  'durfte': 'was allowed to', 'dürfte': 'might, probably',

  // ── Modals: sollen ──
  'soll': 'should, shall', 'sollst': 'should (you)', 'sollen': 'should, shall',
  'sollte': 'should (subj.)', 'sollten': 'should (pl.)',

  // ── Modals: wollen ──
  'will': 'want to', 'willst': 'want to (you)', 'wollen': 'to want to',
  'wollte': 'wanted to', 'wollten': 'wanted to (pl.)',

  // ── Modals: mögen ──
  'mag': 'like, may', 'mögen': 'to like',
  'möchte': 'would like', 'möchten': 'would like (pl.)',

  // ── Key verbs (infinitives) ──
  'sein': 'to be', 'haben': 'to have',
  'machen': 'to do, to make', 'gehen': 'to go',
  'kommen': 'to come', 'sagen': 'to say',
  'wissen': 'to know (fact)', 'kennen': 'to know (person/place)',
  'sehen': 'to see', 'geben': 'to give',
  'nehmen': 'to take', 'finden': 'to find',
  'denken': 'to think', 'lassen': 'to let, to leave',
  'stehen': 'to stand', 'bringen': 'to bring',

  // ── Common greetings/expressions ──
  'hallo': 'hello', 'tschüss': 'bye', 'bitte': 'please; you\'re welcome',
  'danke': 'thank you', 'prost': 'cheers',
  'entschuldigung': 'excuse me, sorry', 'genau': 'exactly',

  // ── Numbers as words ──
  'eins': 'one', 'zwei': 'two', 'drei': 'three', 'vier': 'four',
  'fünf': 'five', 'sechs': 'six', 'sieben': 'seven', 'acht': 'eight',
  'neun': 'nine', 'zehn': 'ten', 'elf': 'eleven', 'zwölf': 'twelve',
  'hundert': 'hundred', 'tausend': 'thousand',

  // ── Discourse markers / fillers ──
  'also': 'so, well', 'eben': 'just, exactly', 'halt': 'just (filler)',
  'doch': 'but, indeed, yes (contradicting)', 'wohl': 'probably, well',
  'zwar': 'indeed, admittedly', 'nämlich': 'namely, because',
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all unique words and sentences from the deck
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

    const tokens = tokenize(card.target, 'german');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '')
        .replace(/^[––\-]+|[––\-]+$/g, '')
        .trim();
      if (!w) continue;
      if (w.length < 2) continue;
      if (!/[a-zà-ÿäöüß]/i.test(w)) continue;
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

  // German dict uses `const DICT` – extract everything before it
  const dictStart = 'const DICT: Record<string, DictEntry> = {';
  const dictStartIdx = src.indexOf(dictStart);
  const header = dictStartIdx >= 0 ? src.slice(0, dictStartIdx) : '';

  // Extract footer: everything after the DICT's closing `};`
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
// Noun/verb dual entries – German words that are both noun and verb
// ──────────────────────────────────────────────────────────────
const NOUN_VERB_DUALS = {
  'besuch': { noun: 'visit', verb: 'to visit' },
  'wechsel': { noun: 'change, exchange', verb: 'to change' },
  'kampf': { noun: 'fight, struggle', verb: 'to fight' },
  'tanz': { noun: 'dance', verb: 'to dance' },
  'traum': { noun: 'dream', verb: 'to dream' },
  'schlaf': { noun: 'sleep', verb: 'to sleep' },
  'lauf': { noun: 'run, course', verb: 'to run' },
  'ruf': { noun: 'call, reputation', verb: 'to call' },
  'sprung': { noun: 'jump', verb: 'to jump' },
  'druck': { noun: 'pressure; print', verb: 'to press; to print' },
  'flug': { noun: 'flight', verb: 'to fly' },
  'griff': { noun: 'grip, handle', verb: 'to grab' },
  'schnitt': { noun: 'cut', verb: 'to cut' },
  'biss': { noun: 'bite', verb: 'to bite' },
  'schlag': { noun: 'blow, hit', verb: 'to hit' },
  'wurf': { noun: 'throw', verb: 'to throw' },
  'stich': { noun: 'sting, stab', verb: 'to stab' },
  'zug': { noun: 'train; pull; move', verb: 'to pull' },
  'gang': { noun: 'walk; corridor; course', verb: 'to walk' },
  'halt': { noun: 'stop, hold', verb: 'to stop' },
  'kauf': { noun: 'purchase', verb: 'to buy' },
  'verband': { noun: 'bandage; association', verb: 'to bandage' },
};

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== German Dictionary Rebuild v4 (Sentence Validation) ===\n');

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
  const googleRaw = await translateBatch(needTranslation, 'de');
  console.log(`Got ${Object.keys(googleRaw).length} individual translations`);

  // Step 4: Google Translate ALL unique sentences
  console.log('\nStep 4: Translating all unique sentences via Google...');
  const sentenceList = [...uniqueSentences.keys()];
  console.log(`  ${sentenceList.length} unique sentences to translate (~${Math.round(sentenceList.reduce((s, t) => s + t.length, 0) / 1000)}K chars)`);
  const sentenceTranslations = await translateSentences(sentenceList, 'de');
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
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'de'));

  // Also include existing dictionary words not in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'de'));

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
      const isProperNoun = /^(Germany|Berlin|Munich|Hamburg|Frankfurt|Cologne|Stuttgart|Dresden|Vienna|Zurich|Switzerland|Austria|Europe|Christmas|Easter|Bavaria|Rhine|Alps|Mediterranean|Atlantic|Oktoberfest)$/i.test(en);
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

  // German dict uses `const DICT` (not export const dictionary)
  const dictContent = header
    + 'const DICT: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 10: 100-entry review -> de-v5-review.md
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

  let md = `# German Dictionary v4 Rebuild (Sentence Validation) - 100-Entry Review\n\n`;
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

  fs.writeFileSync(path.join(OUTPUT_DIR, 'de-v5-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/de-v5-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
