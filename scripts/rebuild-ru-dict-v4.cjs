#!/usr/bin/env node
/**
 * Rebuild Russian dictionary v4 – full-sentence validation approach.
 *
 * Steps:
 *  1. Russian function word table (~150 entries, never sent to Google)
 *  2. Collect all unique words from deck via tokenize()
 *  3. Google Translate individual words via translateBatch()
 *  4. Google Translate ALL unique sentences via translateSentences()
 *  5. For each word, validate against sentence translations via validateAndEnrich()
 *  6. Post-process every result via postProcess() (18-rule pipeline)
 *  7. Lemma copy – verified lemmas get their base word's definition
 *  8. Apply to ru.ts, preserve IPA/lemma/pos + lookupWord + findInfinitive
 *  9. 100-entry random review -> scripts/output/ru-v5-review.md
 *
 * Russian has ~3,359 cards. ~3,200 unique sentences x ~50 chars = ~160K chars.
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, translateSentences, tokenize, validateAndEnrich } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/russian/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/ru.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Russian function word table (~150 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Personal pronouns ──
  'я': 'I', 'ты': 'you (singular)', 'он': 'he', 'она': 'she', 'оно': 'it',
  'мы': 'we', 'вы': 'you (plural/formal)', 'они': 'they',

  // ── Accusative / Genitive / Dative / Instrumental / Prepositional pronouns ──
  'меня': 'me (acc./gen.)', 'тебя': 'you (acc./gen.)', 'его': 'him/his',
  'её': 'her/hers', 'нас': 'us', 'вас': 'you (pl. acc./gen.)', 'их': 'them/their',
  'мне': 'to me', 'тебе': 'to you', 'ему': 'to him', 'ей': 'to her',
  'нам': 'to us', 'вам': 'to you (pl.)', 'им': 'to them',
  'мной': 'with me', 'тобой': 'with you', 'ним': 'with him', 'ней': 'with her',
  'нами': 'with us', 'вами': 'with you (pl.)', 'ними': 'with them',
  'мне': 'to me', 'тебе': 'to you',

  // ── Possessive pronouns ──
  'мой': 'my', 'моя': 'my (f.)', 'моё': 'my (n.)', 'мои': 'my (pl.)',
  'моего': 'my (gen.)', 'моей': 'my (gen. f.)', 'моих': 'my (gen. pl.)',
  'моему': 'my (dat.)', 'моим': 'my (dat./instr.)', 'моими': 'my (instr. pl.)',
  'твой': 'your', 'твоя': 'your (f.)', 'твоё': 'your (n.)', 'твои': 'your (pl.)',
  'свой': 'one\'s own', 'своя': 'one\'s own (f.)', 'своё': 'one\'s own (n.)',
  'свои': 'one\'s own (pl.)', 'своей': 'one\'s own (gen. f.)',
  'своего': 'one\'s own (gen.)', 'своих': 'one\'s own (gen. pl.)',
  'своему': 'one\'s own (dat.)', 'своим': 'one\'s own (dat./instr.)',
  'своими': 'one\'s own (instr. pl.)', 'свою': 'one\'s own (acc. f.)',
  'наш': 'our', 'наша': 'our (f.)', 'наше': 'our (n.)', 'наши': 'our (pl.)',
  'нашей': 'our (gen. f.)', 'нашего': 'our (gen.)', 'наших': 'our (gen. pl.)',
  'нашим': 'our (dat./instr.)', 'нашу': 'our (acc. f.)', 'нашем': 'our (prep.)',
  'ваш': 'your (pl.)', 'ваша': 'your (pl. f.)', 'ваше': 'your (pl. n.)', 'ваши': 'your (pl. pl.)',

  // ── Demonstratives ──
  'этот': 'this', 'эта': 'this (f.)', 'это': 'this (n.)/it is',
  'эти': 'these', 'этого': 'this (gen.)', 'этой': 'this (gen. f.)',
  'этих': 'these (gen.)', 'этому': 'this (dat.)', 'этом': 'this (prep.)',
  'этим': 'this (instr./dat.)', 'эту': 'this (acc. f.)',
  'тот': 'that', 'та': 'that (f.)', 'то': 'that (n.)', 'те': 'those',
  'того': 'that (gen.)', 'той': 'that (gen. f.)', 'тех': 'those (gen.)',
  'тому': 'that (dat.)', 'том': 'that (prep.)', 'тем': 'that (instr.)',

  // ── Interrogatives / Relatives ──
  'кто': 'who', 'что': 'what/that', 'где': 'where', 'куда': 'where (to)',
  'откуда': 'from where', 'когда': 'when', 'как': 'how', 'почему': 'why',
  'зачем': 'what for', 'какой': 'which, what kind', 'какая': 'which (f.)',
  'какое': 'which (n.)', 'какие': 'which (pl.)', 'какого': 'which (gen.)',
  'какую': 'which (acc. f.)', 'каком': 'which (prep.)',
  'чей': 'whose', 'чья': 'whose (f.)', 'чьё': 'whose (n.)',
  'сколько': 'how much/many', 'который': 'which/who (relative)',
  'которая': 'which (f. relative)', 'которое': 'which (n. relative)',
  'которые': 'which (pl. relative)', 'которого': 'which (gen. relative)',
  'которой': 'which (gen. f. relative)', 'которых': 'which (gen. pl. relative)',
  'которому': 'which (dat. relative)', 'котором': 'which (prep. relative)',
  'которым': 'which (instr. relative)', 'которую': 'which (acc. f. relative)',

  // ── Prepositions ──
  'в': 'in, into', 'на': 'on, onto', 'с': 'with, from', 'из': 'from, out of',
  'к': 'to, toward', 'у': 'at, near, by', 'о': 'about', 'об': 'about',
  'по': 'along, by', 'за': 'behind, for', 'от': 'from', 'до': 'before, until',
  'для': 'for', 'без': 'without', 'при': 'at, in the presence of',
  'через': 'through, across', 'между': 'between', 'над': 'above, over',
  'под': 'under', 'перед': 'in front of', 'после': 'after',
  'около': 'near, about', 'вокруг': 'around', 'вместо': 'instead of',
  'кроме': 'except, besides', 'против': 'against',

  // ── Conjunctions ──
  'и': 'and', 'а': 'and/but (contrast)', 'но': 'but', 'или': 'or',
  'что': 'that', 'чтобы': 'in order to', 'если': 'if', 'когда': 'when',
  'потому': 'because', 'поэтому': 'therefore', 'хотя': 'although',
  'пока': 'while, for now', 'ни': 'neither, nor', 'либо': 'either, or',
  'тоже': 'also, too', 'также': 'also', 'зато': 'but then, on the other hand',
  'ведь': 'after all', 'же': 'emphasis particle',

  // ── Adverbs ──
  'очень': 'very', 'уже': 'already', 'ещё': 'still, yet, more',
  'еще': 'still, yet, more', 'тоже': 'also, too',
  'тут': 'here', 'там': 'there', 'здесь': 'here',
  'сейчас': 'now', 'потом': 'then, later', 'тогда': 'then',
  'всегда': 'always', 'никогда': 'never', 'иногда': 'sometimes',
  'часто': 'often', 'редко': 'rarely', 'обычно': 'usually',
  'сначала': 'at first', 'наконец': 'finally', 'снова': 'again',
  'опять': 'again', 'вместе': 'together', 'отдельно': 'separately',
  'быстро': 'quickly', 'медленно': 'slowly', 'хорошо': 'well, good',
  'плохо': 'badly', 'много': 'much, many', 'мало': 'little, few',
  'больше': 'more', 'меньше': 'less', 'лучше': 'better',
  'хуже': 'worse', 'только': 'only', 'даже': 'even',
  'именно': 'precisely, exactly', 'просто': 'simply, just',
  'совсем': 'completely, at all', 'довольно': 'quite, rather',
  'слишком': 'too (excessively)', 'почти': 'almost',
  'конечно': 'of course', 'наверное': 'probably', 'может': 'maybe',
  'действительно': 'really, indeed', 'обязательно': 'necessarily, definitely',
  'вдруг': 'suddenly', 'сразу': 'immediately, at once',

  // ── Negation / Affirmation ──
  'не': 'not', 'нет': 'no', 'да': 'yes', 'ни': 'not (emphatic)',

  // ── Common auxiliaries / particles ──
  'быть': 'to be', 'есть': 'is/there is', 'был': 'was',
  'была': 'was (f.)', 'было': 'was (n.)', 'были': 'were',
  'будет': 'will be', 'будут': 'will be (pl.)',
  'бы': 'would (conditional)', 'ли': 'whether (question particle)',
  'вот': 'here is', 'ну': 'well', 'так': 'so, thus',

  // ── Numbers ──
  'один': 'one', 'одна': 'one (f.)', 'одно': 'one (n.)',
  'два': 'two', 'две': 'two (f.)', 'три': 'three', 'четыре': 'four',
  'пять': 'five', 'шесть': 'six', 'семь': 'seven', 'восемь': 'eight',
  'девять': 'nine', 'десять': 'ten', 'сто': 'hundred', 'тысяча': 'thousand',

  // ── Reflexive / indefinite ──
  'себя': 'oneself (acc./gen.)', 'себе': 'oneself (dat./prep.)',
  'собой': 'oneself (instr.)', 'сам': 'oneself, himself',
  'сама': 'herself', 'само': 'itself', 'сами': 'themselves',
  'весь': 'all, whole', 'вся': 'all (f.)', 'всё': 'everything, all',
  'все': 'everyone, all (pl.)', 'всего': 'of all, total',
  'каждый': 'each, every', 'каждая': 'each (f.)', 'каждое': 'each (n.)',
  'каждые': 'every (pl.)', 'другой': 'other, another',
  'другая': 'other (f.)', 'другое': 'other (n.)', 'другие': 'other (pl.)',
  'некоторые': 'some', 'несколько': 'several',
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

    const tokens = tokenize(card.target, 'russian');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '')
        .replace(/^[––\-]+|[––\-]+$/g, '')
        .trim();
      if (!w) continue;
      if (w.length < 2) continue;
      // Russian uses Cyrillic – keep only tokens with at least one Cyrillic char
      if (!/[а-яёА-ЯЁ]/i.test(w)) continue;
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

  const entryRe = /^\s*(?:'([^']+)'|"([^"]+)"):\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'\s*(?:,\s*lemma:\s*'([^']*)')?\s*\}/gm;
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    const key = m[1] || m[2];
    existing[key] = {
      en: m[3],
      ipa: m[4],
      pos: m[5],
      lemma: m[6] || null,
    };
  }

  // Extract header: everything before `const dictionary: Record<string, DictEntry> = {`
  const dictStart = 'const dictionary: Record<string, DictEntry> = {';
  const dictStartIdx = src.indexOf(dictStart);
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
  console.log('=== Russian Dictionary Rebuild v4 (Sentence Validation) ===\n');

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
  const googleRaw = await translateBatch(needTranslation, 'ru');
  console.log(`Got ${Object.keys(googleRaw).length} individual translations`);

  // Step 4: Google Translate ALL unique sentences
  console.log('\nStep 4: Translating all unique sentences via Google...');
  const sentenceList = [...uniqueSentences.keys()];
  console.log(`  ${sentenceList.length} unique sentences to translate (~${Math.round(sentenceList.reduce((s, t) => s + t.length, 0) / 1000)}K chars)`);
  const sentenceTranslations = await translateSentences(sentenceList, 'ru', 20);
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

  // Step 8: Build and write dictionary
  console.log('\nStep 8: Writing dictionary...');
  const entries = [];
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'ru'));

  // Also include existing dictionary words not in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'ru'));

  // Deduplicate
  const seenWords = new Set();
  const dedupedWords = [];
  for (const w of allWords) {
    if (!seenWords.has(w)) {
      seenWords.add(w);
      dedupedWords.push(w);
    }
  }

  // Russian proper nouns to preserve capitalization
  const RUSSIAN_PROPER_NOUNS = /^(Russia|Moscow|Petersburg|Siberia|Baikal|Kremlin|Volga|Ural|Caucasus|Crimea|Kiev|Kazan|Europe|Asia|Christmas|Easter|Arctic|Antarctic|Soviet|Bolshoi|Hermitage)$/i;

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
      const isProperNoun = RUSSIAN_PROPER_NOUNS.test(en);
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

  const dictContent = header
    + 'const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 9: 100-entry review -> ru-v5-review.md
  console.log('\nStep 9: Running 100-entry review...');
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

  let md = `# Russian Dictionary v4 Rebuild (Sentence Validation) - 100-Entry Review\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries written:** ${entries.length}\n`;
  md += `**Function words:** ${Object.keys(functionResults).length}\n`;
  md += `**Google translated (individual):** ${Object.keys(googleRaw).length}\n`;
  md += `**Sentences translated:** ${Object.keys(sentenceTranslations).length}\n`;
  md += `**Enriched by sentence validation:** ${enrichedCount}\n`;
  md += `**Lemma-copied:** ${lemmaCopied}\n`;
  md += `**Bad lemmas removed:** ${badLemmaCount}\n\n`;
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

  fs.writeFileSync(path.join(OUTPUT_DIR, 'ru-v5-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/ru-v5-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
