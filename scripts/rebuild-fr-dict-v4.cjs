#!/usr/bin/env node
/**
 * Rebuild French dictionary v4 – full-sentence validation approach.
 *
 * Steps:
 *  1. French function word table (~150 entries, never sent to Google)
 *  2. Collect all unique words from deck via tokenize(sentence, 'french')
 *  3. Google Translate individual words via translateBatch()
 *  4. Google Translate ALL unique sentences via translateSentences()
 *  5. For each word, validate against sentence translations via validateAndEnrich()
 *  6. Post-process every result via postProcess() (18-rule pipeline)
 *  7. Lemma copy – verified lemmas get their base word's definition
 *  8. Noun/verb dual entries (voyage, depense, etc.)
 *  9. Apply to fr.ts, preserve IPA/lemma/pos + lookupWord + reverseVerb
 * 10. 100-entry random review -> scripts/output/fr-v5-review.md
 *
 * COST NOTE: ~3,927 cards x ~55 chars = ~216K chars. Well within free tier.
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, translateSentences, tokenize, validateAndEnrich } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/french/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/fr.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: French function word table (~150 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Greetings / common expressions ──
  'bonjour': 'hello, good day', 'bonsoir': 'good evening',
  'merci': 'thank you', 'salut': 'hi, bye',
  'oui': 'yes', 'non': 'no', 'si': 'yes (contradicting negative)',

  // ── Articles ──
  'le': 'the (masc.)', 'la': 'the (fem.)', 'les': 'the (plural)',
  'un': 'a, one (masc.)', 'une': 'a, one (fem.)', 'des': 'some (plural)',
  'du': 'of the, some (masc.)', 'au': 'to the, at the (masc.)',
  'aux': 'to the, at the (plural)',

  // ── Personal pronouns ──
  'je': 'I', 'tu': 'you (informal)', 'il': 'he, it',
  'elle': 'she, it', 'on': 'one, we (informal)',
  'nous': 'we', 'vous': 'you (formal/plural)', 'ils': 'they (masc.)',
  'elles': 'they (fem.)',

  // ── Object pronouns ──
  'me': 'me, myself', 'te': 'you, yourself', 'se': 'oneself',
  'le': 'him, it (obj.)', 'la': 'her, it (obj.)',
  'lui': 'him, to him/her', 'leur': 'their, to them',
  'nous': 'us, ourselves', 'vous': 'you, yourselves',
  'en': 'of it, some', 'y': 'there, to it',

  // ── Possessive determiners ──
  'mon': 'my (masc.)', 'ma': 'my (fem.)', 'mes': 'my (plural)',
  'ton': 'your (masc.)', 'ta': 'your (fem.)', 'tes': 'your (plural)',
  'son': 'his/her (masc.)', 'sa': 'his/her (fem.)', 'ses': 'his/her (plural)',
  'notre': 'our', 'votre': 'your (formal)', 'nos': 'our (plural)',
  'vos': 'your (plural)', 'leurs': 'their (plural)',

  // ── Demonstratives ──
  'ce': 'this, that (masc.)', 'cet': 'this, that (masc. before vowel)',
  'cette': 'this, that (fem.)', 'ces': 'these, those',
  'ceci': 'this', 'cela': 'that', 'celui': 'the one (masc.)',
  'celle': 'the one (fem.)', 'ceux': 'those (masc.)',
  'celles': 'those (fem.)',

  // ── Interrogatives / relatives ──
  'qui': 'who, which', 'que': 'what, that', 'quoi': 'what',
  'dont': 'whose, of which', 'lequel': 'which one (masc.)',
  'laquelle': 'which one (fem.)', 'lesquels': 'which ones (masc.)',
  'lesquelles': 'which ones (fem.)',
  'quel': 'which, what (masc.)', 'quelle': 'which, what (fem.)',
  'quels': 'which, what (masc. pl.)', 'quelles': 'which, what (fem. pl.)',
  'comment': 'how', 'combien': 'how much, how many',
  'pourquoi': 'why', 'quand': 'when',

  // ── Prepositions ──
  'de': 'of, from', 'dans': 'in, into', 'sur': 'on, upon',
  'sous': 'under', 'avec': 'with', 'sans': 'without',
  'pour': 'for', 'par': 'by, through', 'entre': 'between',
  'vers': 'toward', 'chez': 'at (someone\'s place)',
  'contre': 'against', 'depuis': 'since, for (time)',
  'pendant': 'during, for (duration)', 'avant': 'before',
  'devant': 'in front of', 'derriere': 'behind',
  'parmi': 'among', 'malgre': 'despite, in spite of',
  'sauf': 'except',

  // ── Conjunctions ──
  'et': 'and', 'ou': 'or', 'mais': 'but',
  'donc': 'so, therefore', 'car': 'because, for',
  'ni': 'neither, nor', 'puisque': 'since, because',
  'lorsque': 'when', 'tandis': 'while, whereas',
  'quoique': 'although',

  // ── Adverbs ──
  'ne': 'not (first part)', 'pas': 'not, step',
  'plus': 'more, no more', 'moins': 'less, fewer',
  'bien': 'well, good', 'mal': 'badly, bad',
  'peu': 'little, few', 'beaucoup': 'a lot, much',
  'trop': 'too much', 'assez': 'enough, rather',
  'aussi': 'also, too', 'encore': 'again, still',
  'toujours': 'always, still', 'jamais': 'never, ever',
  'souvent': 'often', 'parfois': 'sometimes',
  'deja': 'already', 'ici': 'here', 'la': 'there',
  'maintenant': 'now', 'alors': 'then, so',
  'ensuite': 'then, next', 'enfin': 'finally',
  'tres': 'very', 'vraiment': 'really, truly',
  'peut-etre': 'maybe, perhaps', 'surtout': 'especially',
  'presque': 'almost', 'environ': 'about, approximately',

  // ── Auxiliaries: etre (to be) ──
  'suis': 'am', 'es': 'are (informal)',
  'est': 'is', 'sommes': 'are (we)',
  'etes': 'are (you pl.)', 'sont': 'are (they)',
  'etais': 'was/were', 'etait': 'was/were',
  'etions': 'were (we)', 'etiez': 'were (you pl.)',
  'etaient': 'were (they)', 'ete': 'been',
  'sera': 'will be', 'serai': 'will be (I)',
  'seras': 'will be (you)', 'serons': 'will be (we)',
  'serez': 'will be (you pl.)', 'seront': 'will be (they)',
  'serais': 'would be', 'serait': 'would be',
  'serions': 'would be (we)', 'seriez': 'would be (you pl.)',
  'seraient': 'would be (they)',
  'sois': 'be (subjunctive)', 'soit': 'be (subjunctive)',
  'soient': 'be (subjunctive pl.)',

  // ── Auxiliaries: avoir (to have) ──
  'ai': 'have (I)', 'as': 'have (you)',
  'avons': 'have (we)', 'avez': 'have (you pl.)',
  'ont': 'have (they)', 'avais': 'had (I/you)',
  'avait': 'had (he/she)', 'avions': 'had (we)',
  'aviez': 'had (you pl.)', 'avaient': 'had (they)',
  'eu': 'had (past participle)', 'aura': 'will have',
  'aurait': 'would have', 'aurais': 'would have (I)',
  'aurions': 'would have (we)', 'auraient': 'would have (they)',

  // ── Key verbs (infinitives) ──
  'etre': 'to be', 'avoir': 'to have',
  'faire': 'to do, to make', 'aller': 'to go',
  'pouvoir': 'to be able, can', 'vouloir': 'to want',
  'devoir': 'to have to, must', 'savoir': 'to know (fact)',
  'connaitre': 'to know (person/place)', 'venir': 'to come',
  'dire': 'to say, to tell', 'voir': 'to see',
  'prendre': 'to take', 'donner': 'to give',
  'mettre': 'to put', 'falloir': 'to be necessary',

  // ── Common function-like words ──
  'tout': 'all, every, everything', 'tous': 'all (masc. pl.)',
  'toute': 'all (fem.)', 'toutes': 'all (fem. pl.)',
  'autre': 'other', 'autres': 'others',
  'meme': 'same, even', 'chaque': 'each, every',
  'quelque': 'some', 'quelques': 'some, a few',
  'aucun': 'none, no', 'aucune': 'none, no (fem.)',
  'plusieurs': 'several', 'certain': 'certain, some',
  'certains': 'certain, some (pl.)',
  'rien': 'nothing', 'personne': 'no one; person',
  'quelqu': 'someone (contracted)',

  // ── Discourse markers ──
  'voici': 'here is', 'voila': 'there is',
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

    const tokens = tokenize(card.target, 'french');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '')
        .replace(/^[––\-]+|[––\-]+$/g, '')
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
  // French uses "export const dictionary"
  let dictStart = 'export const dictionary: Record<string, DictEntry> = {';
  let dictStartIdx = src.indexOf(dictStart);
  if (dictStartIdx < 0) {
    // Fallback: try without export
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
// Noun/verb dual entries – French words that are both noun and verb
// ──────────────────────────────────────────────────────────────
const NOUN_VERB_DUALS = {
  'voyage': { noun: 'trip, journey', verb: 'to travel' },
  'travail': { noun: 'work, job', verb: 'to work' },
  'marche': { noun: 'walk; market', verb: 'to walk' },
  'change': { noun: 'change, exchange', verb: 'to change' },
  'garde': { noun: 'guard', verb: 'to keep' },
  'commande': { noun: 'order', verb: 'to order' },
  'demande': { noun: 'request', verb: 'to ask' },
  'visite': { noun: 'visit', verb: 'to visit' },
  'aide': { noun: 'help, aid', verb: 'to help' },
  'cuisine': { noun: 'kitchen; cooking', verb: 'to cook' },
  'danse': { noun: 'dance', verb: 'to dance' },
  'promenade': { noun: 'walk, stroll', verb: 'to walk' },
  'appel': { noun: 'call', verb: 'to call' },
  'essai': { noun: 'attempt, trial', verb: 'to try' },
  'envoi': { noun: 'sending, shipment', verb: 'to send' },
  'reserve': { noun: 'reserve', verb: 'to reserve' },
  'depense': { noun: 'expense', verb: 'to spend' },
  'arret': { noun: 'stop', verb: 'to stop' },
  'retour': { noun: 'return', verb: 'to return' },
  'choix': { noun: 'choice', verb: 'to choose' },
  'dessin': { noun: 'drawing', verb: 'to draw' },
  'emploi': { noun: 'job, employment', verb: 'to employ' },
  'compte': { noun: 'account; count', verb: 'to count' },
  'gout': { noun: 'taste', verb: 'to taste' },
  'souci': { noun: 'worry, concern', verb: 'to worry' },
  'doute': { noun: 'doubt', verb: 'to doubt' },
  'place': { noun: 'place, seat', verb: 'to place' },
};

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== French Dictionary Rebuild v4 (Sentence Validation) ===\n');

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
  const googleRaw = await translateBatch(needTranslation, 'fr');
  console.log(`Got ${Object.keys(googleRaw).length} individual translations`);

  // Step 4: Google Translate ALL unique sentences
  console.log('\nStep 4: Translating all unique sentences via Google...');
  const sentenceList = [...uniqueSentences.keys()];
  console.log(`  ${sentenceList.length} unique sentences to translate (~${Math.round(sentenceList.reduce((s, t) => s + t.length, 0) / 1000)}K chars)`);
  const sentenceTranslations = await translateSentences(sentenceList, 'fr');
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
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'fr'));

  // Also include existing dictionary words not in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'fr'));

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
      const isProperNoun = /^(France|Paris|Lyon|Marseille|Bordeaux|Nice|Toulouse|Strasbourg|Normandy|Provence|Europe|Christmas|Easter|Mediterranean|Atlantic)$/i.test(en);
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

  // French dict uses `export const dictionary`
  const dictContent = header
    + 'export const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 10: 100-entry review -> fr-v5-review.md
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

  let md = `# French Dictionary v4 Rebuild (Sentence Validation) - 100-Entry Review\n\n`;
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

  fs.writeFileSync(path.join(OUTPUT_DIR, 'fr-v5-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/fr-v5-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
