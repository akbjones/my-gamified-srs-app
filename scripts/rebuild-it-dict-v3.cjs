#!/usr/bin/env node
/**
 * Rebuild Italian dictionary v3 – uses shared pipeline utilities.
 *
 * Steps:
 *  1. Italian function word table (~180 entries, never sent to Google)
 *  2. Collect all words from deck, tokenize with Italian apostrophe handling
 *  3. Google Translate non-function words via translateBatch() with truncation retry
 *  4. Post-process every result via postProcess() (all 18 rules)
 *  5. Detect and remove bad lemma references (3-char prefix check)
 *  6. Lemma copy (only for verified lemmas)
 *  7. Card-context validation
 *  8. Apply to it.ts, preserve IPA/lemma
 *  9. 100-entry random review → scripts/output/it-v3-review.md
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, tokenize } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/italian/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/it.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Italian function word table (~180 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Articles (definite) ──
  'il': 'the', 'lo': 'the', 'la': 'the',
  'i': 'the', 'gli': 'the', 'le': 'the',
  'l': 'the',

  // ── Articles (indefinite) ──
  'un': 'a, one', 'uno': 'a, one', 'una': 'a, one',

  // ── Prepositions with articles (articulated) ──
  'del': 'of the', 'dello': 'of the', 'della': 'of the',
  'dei': 'of the', 'degli': 'of the', 'delle': 'of the',
  'al': 'to the', 'allo': 'to the', 'alla': 'to the',
  'ai': 'to the', 'agli': 'to the', 'alle': 'to the',
  'nel': 'in the', 'nello': 'in the', 'nella': 'in the',
  'nei': 'in the', 'negli': 'in the', 'nelle': 'in the',
  'sul': 'on the', 'sullo': 'on the', 'sulla': 'on the',
  'sui': 'on the', 'sugli': 'on the', 'sulle': 'on the',
  'dal': 'from the', 'dallo': 'from the', 'dalla': 'from the',
  'dai': 'from the', 'dagli': 'from the', 'dalle': 'from the',
  'col': 'with the',

  // ── Pronouns ──
  'io': 'I', 'tu': 'you', 'lui': 'he', 'lei': 'she, you (formal)',
  'noi': 'we', 'voi': 'you (pl.)', 'loro': 'they, them',
  'mi': 'me, myself', 'ti': 'you, yourself', 'ci': 'us, ourselves, there',
  'vi': 'you (pl.), yourselves', 'si': 'oneself, themselves',
  'lo': 'him, it', 'la': 'her, it', 'li': 'them (m.)', 'le': 'them (f.), to her',
  'ne': 'of it, some', 'me': 'me', 'te': 'you',
  'se': 'if, oneself',
  'chi': 'who', 'che': 'that, which, what',
  'cosa': 'what, thing', 'quale': 'which', 'quanto': 'how much',
  'dove': 'where', 'come': 'how, like, as', 'quando': 'when',
  'questo': 'this', 'questa': 'this', 'questi': 'these', 'queste': 'these',
  'quello': 'that', 'quella': 'that', 'quelli': 'those', 'quelle': 'those',
  'ogni': 'every, each', 'tutto': 'all, everything', 'tutta': 'all',
  'tutti': 'all, everyone', 'tutte': 'all',
  'niente': 'nothing', 'nulla': 'nothing',
  'nessuno': 'nobody, none', 'nessuna': 'none',
  'qualcuno': 'someone', 'qualcosa': 'something',
  'altro': 'other', 'altra': 'other', 'altri': 'others', 'altre': 'others',
  'stesso': 'same, self', 'stessa': 'same, self',
  'proprio': 'own, really',

  // ── Prepositions ──
  'di': 'of, from', 'a': 'to, at', 'da': 'from, by, since',
  'in': 'in, into', 'con': 'with', 'su': 'on, upon',
  'per': 'for, through', 'tra': 'between, among', 'fra': 'between, among',
  'verso': 'towards', 'contro': 'against', 'durante': 'during',
  'senza': 'without', 'dopo': 'after', 'prima': 'before, first',
  'sotto': 'under', 'sopra': 'above, on top of',
  'dentro': 'inside', 'fuori': 'outside',

  // ── Conjunctions ──
  'e': 'and', 'o': 'or', 'ma': 'but',
  'ed': 'and', 'od': 'or',
  'anche': 'also, too', 'pure': 'also, even',
  'sia': 'both, whether',
  'quindi': 'therefore, so', 'dunque': 'therefore',
  'oppure': 'or else',
  'mentre': 'while', 'sebbene': 'although',
  'affinche': 'so that',
  'eppure': 'and yet',
  'anzi': 'rather, on the contrary',

  // ── Adverbs ──
  'molto': 'very, much', 'troppo': 'too much', 'poco': 'little, few',
  'tanto': 'so much', 'cosi': 'so, thus',
  'gia': 'already', 'ancora': 'still, again', 'sempre': 'always',
  'mai': 'never', 'spesso': 'often',
  'qui': 'here', 'qua': 'here',
  'la': 'there', 'li': 'there',
  'oggi': 'today', 'ieri': 'yesterday', 'domani': 'tomorrow',
  'ora': 'now', 'adesso': 'now',
  'bene': 'well', 'male': 'badly',
  'piu': 'more', 'meno': 'less',
  'solo': 'only, alone', 'soltanto': 'only',
  'davvero': 'really, truly', 'veramente': 'truly',
  'forse': 'perhaps, maybe',
  'allora': 'then, so', 'poi': 'then, after',
  'subito': 'immediately', 'presto': 'soon, early',
  'tardi': 'late',
  'insieme': 'together',
  'appena': 'just, barely',
  'abbastanza': 'enough, fairly',
  'piuttosto': 'rather',

  // ── Negation ──
  'non': 'not', 'no': 'no',
  'ne': 'neither, nor',

  // ── Auxiliaries: essere (to be) ──
  'essere': 'to be',
  'sono': 'am, are, (they) are', 'sei': 'are (you)',
  'siamo': 'are (we)', 'siete': 'are (you pl.)',
  'ero': 'was (I)', 'era': 'was',
  'erano': 'were', 'eravamo': 'were (we)',
  'stato': 'been', 'stata': 'been',
  'stati': 'been (pl.)', 'state': 'been (f.pl.)',

  // ── Auxiliaries: avere (to have) ──
  'avere': 'to have',
  'ho': 'have (I)', 'hai': 'have (you)', 'ha': 'has',
  'abbiamo': 'have (we)', 'avete': 'have (you pl.)', 'hanno': 'have (they)',
  'avevo': 'had (I)', 'aveva': 'had',
  'avevamo': 'had (we)', 'avevano': 'had (they)',
  'avuto': 'had (p.p.)',

  // ── Common verb forms: fare (to do/make) ──
  'fare': 'to do, to make',
  'faccio': 'to do, to make', 'fai': 'to do, to make', 'fa': 'to do, to make',
  'facciamo': 'to do, to make', 'fate': 'to do, to make', 'fanno': 'to do, to make',
  'facevo': 'to do, to make', 'faceva': 'to do, to make', 'facevano': 'to do, to make',
  'fatto': 'done, made',

  // ── Common verb forms: andare (to go) ──
  'andare': 'to go',
  'vado': 'to go', 'vai': 'to go', 'va': 'to go',
  'andiamo': 'to go', 'andate': 'to go', 'vanno': 'to go',
  'andavo': 'to go', 'andava': 'to go', 'andavano': 'to go',
  'andato': 'to go', 'andata': 'to go', 'andati': 'to go', 'andate': 'to go',

  // ── Common verb forms: potere (can/to be able) ──
  'potere': 'to be able, can',
  'posso': 'to be able, can', 'puoi': 'to be able, can', 'puo': 'to be able, can',
  'possiamo': 'to be able, can', 'potete': 'to be able, can', 'possono': 'to be able, can',
  'potevo': 'to be able, can', 'poteva': 'to be able, can',
  'potuto': 'to be able, can',

  // ── Common verb forms: volere (to want) ──
  'volere': 'to want',
  'voglio': 'to want', 'vuoi': 'to want', 'vuole': 'to want',
  'vogliamo': 'to want', 'volete': 'to want', 'vogliono': 'to want',
  'volevo': 'to want', 'voleva': 'to want', 'volevano': 'to want',
  'voluto': 'to want',

  // ── Common verb forms: dovere (must/to have to) ──
  'dovere': 'to have to, must',
  'devo': 'to have to, must', 'devi': 'to have to, must', 'deve': 'to have to, must',
  'dobbiamo': 'to have to, must', 'dovete': 'to have to, must', 'devono': 'to have to, must',
  'dovevo': 'to have to, must', 'doveva': 'to have to, must',
  'dovuto': 'to have to, must',

  // ── Common verb forms: sapere (to know) ──
  'sapere': 'to know',
  'so': 'to know', 'sai': 'to know', 'sa': 'to know',
  'sappiamo': 'to know', 'sapete': 'to know', 'sanno': 'to know',
  'sapevo': 'to know', 'sapeva': 'to know',
  'saputo': 'to know',

  // ── Common verb forms: stare (to stay/be) ──
  'stare': 'to stay, to be',
  'sto': 'to stay, to be', 'stai': 'to stay, to be', 'sta': 'to stay, to be',
  'stiamo': 'to stay, to be', 'state': 'to stay, to be', 'stanno': 'to stay, to be',
  'stavo': 'to stay, to be', 'stava': 'to stay, to be',

  // ── Common verb forms: dare (to give) ──
  'dare': 'to give',
  'do': 'to give', 'dai': 'to give', 'da': 'from, by, since',
  'diamo': 'to give', 'date': 'to give', 'danno': 'to give',
  'dato': 'given',

  // ── Common verb forms: dire (to say/tell) ──
  'dire': 'to say, to tell',
  'dico': 'to say, to tell', 'dici': 'to say, to tell', 'dice': 'to say, to tell',
  'diciamo': 'to say, to tell', 'dite': 'to say, to tell', 'dicono': 'to say, to tell',
  'dicevo': 'to say, to tell', 'diceva': 'to say, to tell',
  'detto': 'said, told',

  // ── Common verb forms: venire (to come) ──
  'venire': 'to come',
  'vengo': 'to come', 'vieni': 'to come', 'viene': 'to come',
  'veniamo': 'to come', 'venite': 'to come', 'vengono': 'to come',
  'venivo': 'to come', 'veniva': 'to come',
  'venuto': 'to come', 'venuta': 'to come',

  // ── Common verb forms: vedere (to see) ──
  'vedere': 'to see',
  'vedo': 'to see', 'vedi': 'to see', 'vede': 'to see',
  'vediamo': 'to see', 'vedete': 'to see', 'vedono': 'to see',
  'vedevo': 'to see', 'vedeva': 'to see',
  'visto': 'seen', 'vista': 'view, sight',

  // ── Common verb forms: prendere (to take) ──
  'prendere': 'to take',
  'prendo': 'to take', 'prendi': 'to take', 'prende': 'to take',
  'prendiamo': 'to take', 'prendete': 'to take', 'prendono': 'to take',
  'preso': 'taken', 'presa': 'taken',

  // ── Common verb forms: mettere (to put) ──
  'mettere': 'to put',
  'metto': 'to put', 'metti': 'to put', 'mette': 'to put',
  'mettiamo': 'to put', 'mettete': 'to put', 'mettono': 'to put',
  'messo': 'put (p.p.)', 'messa': 'put (p.p.)',

  // ── Greetings / discourse ──
  'ciao': 'hello, bye', 'buongiorno': 'good morning', 'buonasera': 'good evening',
  'buonanotte': 'good night', 'arrivederci': 'goodbye',
  'grazie': 'thank you', 'prego': 'you\'re welcome, please',
  'scusa': 'excuse me (informal)', 'scusi': 'excuse me (formal)',
  'per favore': 'please', 'per piacere': 'please',

  // ── Numbers ──
  'uno': 'one', 'due': 'two', 'tre': 'three', 'quattro': 'four', 'cinque': 'five',
  'sei': 'six', 'sette': 'seven', 'otto': 'eight', 'nove': 'nine', 'dieci': 'ten',
  'venti': 'twenty', 'trenta': 'thirty', 'cento': 'hundred', 'mille': 'thousand',
  'primo': 'first', 'prima': 'first', 'ultimo': 'last', 'ultima': 'last',

  // ── Other common words ──
  "c'e": 'there is', "ci sono": 'there are',
  'ecco': 'here is, there is',
  'invece': 'instead',
};

// ──────────────────────────────────────────────────────────────
// Italian noun/verb ambiguity table
// ──────────────────────────────────────────────────────────────
const NOUN_VERB_AMBIGUITY = {
  'viaggio': 'trip; to travel',
  'lavoro': 'work; to work',
  'aiuto': 'help; to help',
  'cambio': 'change; to change',
  'costo': 'cost; to cost',
  'ballo': 'dance; to dance',
  'conto': 'account; to count',
  'controllo': 'control; to control',
  'cucina': 'kitchen; to cook',
  'domanda': 'question; to ask',
  'dubbio': 'doubt',
  'esame': 'exam',
  'forma': 'form, shape; to form',
  'gioco': 'game; to play',
  'guida': 'guide; to drive',
  'lotta': 'fight; to fight',
  'offerta': 'offer',
  'ordine': 'order',
  'parte': 'part',
  'passaggio': 'passage',
  'piano': 'plan, floor; slowly',
  'posto': 'place, seat',
  'pratica': 'practice; to practice',
  'progresso': 'progress',
  'ricerca': 'research; to search',
  'rischio': 'risk; to risk',
  'sogno': 'dream; to dream',
  'studio': 'study; to study',
  'visita': 'visit; to visit',
  'uso': 'use; to use',
  'taglio': 'cut; to cut',
  'giro': 'tour, turn',
  'passo': 'step; to pass',
  'spesa': 'expense, shopping',
  'commercio': 'trade, commerce',
  'disegno': 'drawing; to draw',
  'bisogno': 'need',
  'consiglio': 'advice; to advise',
  'scambio': 'exchange; to exchange',
  'sforzo': 'effort',
  'gusto': 'taste',
  'invito': 'invitation; to invite',
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all words from the deck
// ──────────────────────────────────────────────────────────────
function collectDeckWords() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const wordFreq = new Map();
  const wordCards = new Map(); // word → [{target, english}, ...]

  for (const card of deck) {
    const tokens = tokenize(card.target, 'italian');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '') // strip curly quotes, ZWJ
        .replace(/^[––\-]+|[––\-]+$/g, '')                  // strip leading/trailing dashes
        .trim();
      if (!w) continue;
      // Skip single-char tokens (except common Italian ones)
      if (w.length < 2 && !['a', 'e', 'i', 'o'].includes(w)) continue;
      // Only keep Latin-script tokens
      if (!/[a-zà-ÿ]/i.test(w)) continue;
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      if (!wordCards.has(w)) wordCards.set(w, []);
      wordCards.get(w).push({ target: card.target, english: card.english });
    }
  }

  console.log(`Deck has ${deck.length} cards, ${wordFreq.size} unique tokens`);
  return { wordFreq, wordCards };
}

// ──────────────────────────────────────────────────────────────
// Parse existing dictionary for IPA / POS / lemma
// ──────────────────────────────────────────────────────────────
function parseExistingDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const existing = {};

  // Match entries – handle both single-quoted and double-quoted keys
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

  // Extract header (everything before 'export const dictionary')
  const dictStartIdx = src.indexOf('export const dictionary: Record<string, DictEntry> = {');
  const header = dictStartIdx >= 0 ? src.slice(0, dictStartIdx) : '';

  // Check if there's anything meaningful after the last };
  const lastClose = src.lastIndexOf('};');
  let footer = '';
  if (lastClose >= 0) {
    const afterClose = src.slice(lastClose + 2).trim();
    if (afterClose.length > 0) {
      footer = '\n' + afterClose;
    }
  }

  console.log(`Parsed ${Object.keys(existing).length} existing entries`);
  return { existing, header, footer };
}

// ──────────────────────────────────────────────────────────────
// Common English stop words for card-context matching
// ──────────────────────────────────────────────────────────────
const COMMON_ENG_STOP = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
  'may', 'might', 'can', 'could', 'must', 'not', 'and', 'but', 'or', 'so',
  'if', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up',
  'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'over', 'that', 'this', 'these', 'those', 'it', 'its',
  'my', 'your', 'his', 'her', 'our', 'their', 'we', 'they', 'he', 'she',
  'you', 'me', 'him', 'us', 'them', 'who', 'whom', 'which', 'what', 'where',
  'when', 'how', 'very', 'just', 'also', 'too', 'only', 'than', 'then', 'now',
]);

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Italian Dictionary Rebuild v3 ===\n');

  // Step 2
  const { wordFreq, wordCards } = collectDeckWords();

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

  // Step 3: Google Translate with truncation retry
  console.log('\nStep 3: Translating via Google...');
  const googleRaw = await translateBatch(needTranslation, 'it');
  console.log(`Got ${Object.keys(googleRaw).length} translations from Google`);

  // Step 4: Post-process all 18 rules
  console.log('\nStep 4: Post-processing...');
  const stats = new PostProcessStats();
  const processed = {};

  // Process function words (hand-curated, no post-processing)
  for (const [word, def] of Object.entries(functionResults)) {
    processed[word] = { en: def, source: 'function_table' };
  }

  // Process Google results
  for (const [word, rawTrans] of Object.entries(googleRaw)) {
    const existingPos = existing[word]?.pos || 'n';
    const result = postProcess(rawTrans, existingPos, word, stats);
    processed[word] = { en: result.text, source: 'google', flagged: result.flagged, flagReasons: result.flagReasons };
  }

  console.log('\n' + stats.report());

  // Step 5: Detect and remove bad lemma references
  // Before lemma copy, check each lemma: does the word share at least 3 leading
  // characters with its lemma? If not, REMOVE the lemma field.
  console.log('\nStep 5: Detecting bad lemma references...');
  let badLemmasRemoved = 0;
  const cleanedExisting = {};
  for (const [word, ex] of Object.entries(existing)) {
    cleanedExisting[word] = { ...ex };
    if (ex.lemma) {
      const wordLower = word.toLowerCase();
      const lemmaLower = ex.lemma.toLowerCase();
      // Check: do they share at least 3 leading characters?
      let sharedPrefix = 0;
      for (let i = 0; i < Math.min(wordLower.length, lemmaLower.length); i++) {
        if (wordLower[i] === lemmaLower[i]) {
          sharedPrefix++;
        } else {
          break;
        }
      }
      if (sharedPrefix < 3) {
        console.log(`  Bad lemma: ${word} -> ${ex.lemma} (shared prefix: ${sharedPrefix} chars "${wordLower.slice(0, sharedPrefix)}")`);
        cleanedExisting[word].lemma = null;
        badLemmasRemoved++;
      }
    }
  }
  console.log(`Removed ${badLemmasRemoved} bad lemma references`);

  // Step 6: Lemma copy (only for verified lemmas)
  console.log('\nStep 6: Lemma copy...');
  let lemmaCopied = 0;
  for (const [word, ex] of Object.entries(cleanedExisting)) {
    if (ex.lemma && processed[ex.lemma] && processed[word]) {
      // Copy the lemma's NEW definition to this conjugated form
      processed[word].en = processed[ex.lemma].en;
      lemmaCopied++;
    }
  }
  console.log(`Copied lemma definitions for ${lemmaCopied} entries`);

  // Step 7: Card-context validation
  console.log('\nStep 7: Card-context validation...');
  let contextFixed = 0;
  for (const [word, entry] of Object.entries(processed)) {
    if (entry.source === 'function_table') continue;
    if (!wordCards.has(word)) continue;

    const cards = wordCards.get(word);
    const currentDef = entry.en.replace(/^to /, '').toLowerCase();

    // Check if current definition appears in any card's English
    let defFoundInCard = false;
    for (const card of cards) {
      if (card.english.toLowerCase().includes(currentDef)) {
        defFoundInCard = true;
        break;
      }
    }

    if (!defFoundInCard && cards.length > 0) {
      // If existing dictionary had a definition that fits cards better, prefer it
      if (existing[word]) {
        const oldDef = existing[word].en.replace(/^to /, '').toLowerCase();
        for (const card of cards) {
          if (card.english.toLowerCase().includes(oldDef)) {
            entry.en = existing[word].en;
            contextFixed++;
            break;
          }
        }
      }
    }
  }
  console.log(`Context-fixed ${contextFixed} entries`);

  // Noun/verb ambiguity
  console.log('\nApplying noun/verb ambiguity table...');
  let ambiguityFixed = 0;
  for (const [word, ambiguousDef] of Object.entries(NOUN_VERB_AMBIGUITY)) {
    if (processed[word]) {
      processed[word].en = ambiguousDef;
      ambiguityFixed++;
    }
  }
  console.log(`Applied ${ambiguityFixed} noun/verb ambiguity definitions`);

  // Step 8: Build and write dictionary
  console.log('\nStep 8: Writing dictionary...');
  const entries = [];
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'it'));

  // Also include existing dictionary words that aren't in the deck (preserve them)
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

  // Filter out garbled keys from old bad tokenization
  const knownGarbled = new Set(['lacqua', 'luomo', 'lamico', 'larte', 'linverno', 'lospite']);

  for (const word of dedupedWords) {
    if (knownGarbled.has(word)) {
      console.log(`  Skipping garbled key: ${word}`);
      continue;
    }

    const proc = processed[word];
    const ex = cleanedExisting[word] || existing[word] || {};
    const ipa = ex.ipa || '';
    const pos = ex.pos || (proc ? (proc.en.startsWith('to ') ? 'v' : 'n') : 'n');
    const lemma = ex.lemma || null;
    let en = proc ? proc.en : ex.en;

    if (!en) continue; // No definition available

    // Force lowercase for non-proper nouns
    if (en.length > 0 && en[0] === en[0].toUpperCase() && en[0] !== en[0].toLowerCase()) {
      const existingEn = ex.en || '';
      const existingWasCapitalized = existingEn.length > 0 && existingEn[0] === existingEn[0].toUpperCase() && existingEn[0] !== existingEn[0].toLowerCase();
      const isProperNoun = /^(Rome|Roma|Italy|Italian|Venice|Florence|Milan|Naples|Christmas|Easter|Europe|Mediterranean|Sicily)$/i.test(en);
      if (!existingWasCapitalized && !isProperNoun) {
        en = en[0].toLowerCase() + en.slice(1);
      }
    }

    // Ensure verbs have "to " prefix
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
      en = 'to ' + en;
    }
    // Ensure non-verbs don't have "to " prefix (unless it's an ambiguity entry or real phrase)
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
    + 'export const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};\n'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 9: 100-entry review
  console.log('\nStep 9: Running 100-entry review...');
  const reviewResults = [];
  const allEntryWords = dedupedWords.filter(w => processed[w] && !knownGarbled.has(w));
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
    const ex = cleanedExisting[word] || existing[word] || {};
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
    // 9. Garbled apostrophe key
    if (/^[a-z]{1,3}[a-zà-ÿ]{3,}$/.test(word) && word.length > 8 && !existing[word]) {
      problems.push('possible_garbled_key');
    }
    // 10. Italian sanity checks
    if (word === 'ciao' && !en.includes('hello') && !en.includes('bye')) {
      problems.push('ciao_wrong');
    }
    if (word === 'fare' && !en.includes('do') && !en.includes('make')) {
      problems.push('fare_wrong');
    }
    // 11. Wrong POS
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

  let md = `# Italian Dictionary v3 Rebuild - 100-Entry Review\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries written:** ${entries.length}\n`;
  md += `**Function words:** ${Object.keys(functionResults).length}\n`;
  md += `**Google translated:** ${Object.keys(googleRaw).length}\n`;
  md += `**Bad lemmas removed:** ${badLemmasRemoved}\n`;
  md += `**Lemma-copied:** ${lemmaCopied}\n`;
  md += `**Context-fixed:** ${contextFixed}\n`;
  md += `**Ambiguity-fixed:** ${ambiguityFixed}\n\n`;
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

  // Garbled keys removed
  md += `\n## Garbled Keys Removed\n\n`;
  for (const gk of knownGarbled) {
    if (existing[gk]) {
      md += `- \`${gk}\` (was: "${existing[gk].en}")\n`;
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'it-v3-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/it-v3-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
