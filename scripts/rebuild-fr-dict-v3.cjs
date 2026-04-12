#!/usr/bin/env node
/**
 * Rebuild French dictionary v3 — uses shared pipeline utilities.
 *
 * Steps:
 *  1. French function word table (~150 entries, never sent to Google)
 *  2. Collect all words from deck, tokenize with French apostrophe handling
 *  3. Google Translate non-function words via translateBatch() with truncation retry
 *  4. Post-process every result via postProcess() (all 18 rules)
 *  5. Strict lemma copy: conjugated forms get lemma's definition
 *  6. Card-context validation: check definition against card English
 *  7. Handle noun/verb ambiguity (voyage, depense, marche, etc.)
 *  8. Apply to fr.ts, preserve IPA/lemma
 *  9. 100-entry random review → scripts/output/fr-v3-review.md
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, tokenize } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/french/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/fr.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: French function word table (~150 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Articles / determiners ──
  'le': 'the', 'la': 'the', 'les': 'the',
  'un': 'a, one', 'une': 'a, one', 'des': 'some, of the',
  'du': 'of the, some', 'de': 'of, from', 'd': 'of, from',
  'l': 'the', 'au': 'to the, at the', 'aux': 'to the, at the',
  'ce': 'this', 'cet': 'this', 'cette': 'this', 'ces': 'these',
  'mon': 'my', 'ma': 'my', 'mes': 'my',
  'ton': 'your', 'ta': 'your', 'tes': 'your',
  'son': 'his/her', 'sa': 'his/her', 'ses': 'his/her',
  'notre': 'our', 'nos': 'our',
  'votre': 'your', 'vos': 'your',
  'leur': 'their', 'leurs': 'their',
  'quel': 'which', 'quelle': 'which', 'quels': 'which', 'quelles': 'which',
  'chaque': 'each', 'tout': 'all, every', 'toute': 'all, every',
  'tous': 'all', 'toutes': 'all',

  // ── Pronouns ──
  'je': 'I', 'tu': 'you', 'il': 'he, it', 'elle': 'she, it',
  'on': 'one, we', 'nous': 'we, us', 'vous': 'you (formal/pl.)',
  'ils': 'they (m.)', 'elles': 'they (f.)',
  'me': 'me, myself', 'te': 'you, yourself', 'se': 'oneself',
  'lui': 'him, to him/her', 'moi': 'me', 'toi': 'you',
  'en': 'of it, some', 'y': 'there, to it',
  'ça': 'that, it', 'cela': 'that',
  'qui': 'who, which', 'que': 'that, which, what',
  'quoi': 'what', 'dont': 'whose, of which',
  'où': 'where',
  'rien': 'nothing', 'personne': 'nobody, person',
  'quelqu\'un': 'someone', 'quelque': 'some',

  // ── Prepositions ──
  'à': 'to, at', 'dans': 'in, into', 'sur': 'on',
  'sous': 'under', 'avec': 'with', 'sans': 'without',
  'pour': 'for', 'par': 'by, through', 'vers': 'towards',
  'chez': 'at the home of', 'entre': 'between',
  'contre': 'against', 'pendant': 'during',
  'depuis': 'since, for', 'avant': 'before',
  'après': 'after', 'devant': 'in front of',
  'derrière': 'behind', 'autour': 'around',
  'près': 'near', 'loin': 'far',

  // ── Conjunctions ──
  'et': 'and', 'ou': 'or', 'mais': 'but',
  'car': 'because', 'donc': 'therefore', 'ni': 'neither, nor',
  'si': 'if', 'quand': 'when', 'comme': 'as, like',
  'parce': 'because', 'puisque': 'since',
  'lorsque': 'when', 'tandis': 'while',
  'alors': 'then, so', 'cependant': 'however',
  'pourtant': 'however, yet', 'néanmoins': 'nevertheless',

  // ── Adverbs ──
  'très': 'very', 'aussi': 'also, too', 'bien': 'well, good',
  'mal': 'badly', 'plus': 'more', 'moins': 'less',
  'trop': 'too much', 'assez': 'enough', 'encore': 'still, again',
  'toujours': 'always', 'jamais': 'never', 'souvent': 'often',
  'déjà': 'already', 'ici': 'here', 'là': 'there',
  'maintenant': 'now', 'hier': 'yesterday', 'demain': 'tomorrow',
  "aujourd'hui": 'today',
  'vraiment': 'really', 'seulement': 'only',
  'surtout': 'especially', 'peut-être': 'maybe, perhaps',
  'ensuite': 'then, next', 'enfin': 'finally',
  'même': 'same, even', 'plutôt': 'rather',
  'beaucoup': 'a lot, much', 'peu': 'little, few',
  'pas': 'not', 'ne': 'not', 'non': 'no', 'oui': 'yes',

  // ── Auxiliaries: être ──
  'suis': 'am', 'es': 'are (tu)', 'est': 'is',
  'sommes': 'are (nous)', 'êtes': 'are (vous)', 'sont': 'are (they)',
  'étais': 'was (je/tu)', 'était': 'was',
  'étaient': 'were', 'étions': 'were (nous)', 'étiez': 'were (vous)',
  'serai': 'will be', 'sera': 'will be',
  'serons': 'will be (nous)', 'serez': 'will be (vous)', 'seront': 'will be',
  'serais': 'would be', 'serait': 'would be',
  'serions': 'would be', 'seriez': 'would be', 'seraient': 'would be',
  'été': 'been',
  'être': 'to be',

  // ── Auxiliaries: avoir ──
  'ai': 'have (I)', 'as': 'have (tu)', 'a': 'has',
  'avons': 'have (nous)', 'avez': 'have (vous)', 'ont': 'have (they)',
  'avais': 'had (je/tu)', 'avait': 'had',
  'avaient': 'had', 'avions': 'had (nous)', 'aviez': 'had (vous)',
  'aurai': 'will have', 'aura': 'will have',
  'aurons': 'will have', 'aurez': 'will have', 'auront': 'will have',
  'aurais': 'would have', 'aurait': 'would have',
  'aurions': 'would have', 'auriez': 'would have', 'auraient': 'would have',
  'eu': 'had (p.p.)',
  'avoir': 'to have',

  // ── Common verb forms: faire ──
  'faire': 'to do, to make', 'fais': 'to do, to make', 'fait': 'to do, to make',
  'faisons': 'to do, to make', 'faites': 'to do, to make', 'font': 'to do, to make',
  'faisais': 'to do, to make', 'faisait': 'to do, to make', 'faisaient': 'to do, to make',
  'ferai': 'to do, to make', 'fera': 'to do, to make', 'ferons': 'to do, to make',
  'ferais': 'to do, to make', 'ferait': 'to do, to make',
  'fasse': 'to do, to make', 'fassent': 'to do, to make',

  // ── Common verb forms: aller ──
  'aller': 'to go', 'vais': 'to go', 'vas': 'to go', 'va': 'to go',
  'allons': 'to go', 'allez': 'to go', 'vont': 'to go',
  'allais': 'to go', 'allait': 'to go', 'allaient': 'to go',
  'irai': 'to go', 'ira': 'to go', 'irons': 'to go', 'iront': 'to go',
  'irais': 'to go', 'irait': 'to go',
  'aille': 'to go', 'aillent': 'to go',
  'allé': 'to go', 'allée': 'to go', 'allés': 'to go', 'allées': 'to go',

  // ── Common verb forms: pouvoir ──
  'pouvoir': 'to be able, can', 'peux': 'to be able, can', 'peut': 'to be able, can',
  'pouvons': 'to be able, can', 'pouvez': 'to be able, can', 'peuvent': 'to be able, can',
  'pouvais': 'to be able, can', 'pouvait': 'to be able, can', 'pouvaient': 'to be able, can',
  'pourrai': 'to be able, can', 'pourra': 'to be able, can',
  'pourrais': 'to be able, can', 'pourrait': 'to be able, can',
  'puisse': 'to be able, can', 'puissent': 'to be able, can',
  'pu': 'to be able, can',

  // ── Common verb forms: devoir ──
  'devoir': 'to have to, must', 'dois': 'to have to, must', 'doit': 'to have to, must',
  'devons': 'to have to, must', 'devez': 'to have to, must', 'doivent': 'to have to, must',
  'devais': 'to have to, must', 'devait': 'to have to, must',
  'devrai': 'to have to, must', 'devra': 'to have to, must',
  'devrais': 'to have to, must', 'devrait': 'to have to, must',
  'dû': 'to have to, must',

  // ── Common verb forms: vouloir ──
  'vouloir': 'to want', 'veux': 'to want', 'veut': 'to want',
  'voulons': 'to want', 'voulez': 'to want', 'veulent': 'to want',
  'voulais': 'to want', 'voulait': 'to want',
  'voudrais': 'to want', 'voudrait': 'to want',
  'voulu': 'to want',

  // ── Common verb forms: savoir ──
  'savoir': 'to know', 'sais': 'to know', 'sait': 'to know',
  'savons': 'to know', 'savez': 'to know', 'savent': 'to know',
  'savais': 'to know', 'savait': 'to know',
  'saurai': 'to know', 'saura': 'to know',
  'saurais': 'to know', 'saurait': 'to know',
  'su': 'to know',

  // ── Common verb forms: dire ──
  'dire': 'to say, to tell', 'dis': 'to say, to tell', 'dit': 'to say, to tell',
  'disons': 'to say, to tell', 'dites': 'to say, to tell', 'disent': 'to say, to tell',
  'disais': 'to say, to tell', 'disait': 'to say, to tell',

  // ── Common verb forms: venir ──
  'venir': 'to come', 'viens': 'to come', 'vient': 'to come',
  'venons': 'to come', 'venez': 'to come', 'viennent': 'to come',
  'venais': 'to come', 'venait': 'to come',
  'viendrai': 'to come', 'viendra': 'to come',
  'viendrais': 'to come', 'viendrait': 'to come',
  'venu': 'to come', 'venue': 'to come', 'venus': 'to come', 'venues': 'to come',

  // ── Common verb forms: voir ──
  'voir': 'to see', 'vois': 'to see', 'voit': 'to see',
  'voyons': 'to see', 'voyez': 'to see', 'voient': 'to see',
  'voyais': 'to see', 'voyait': 'to see',
  'verrai': 'to see', 'verra': 'to see',
  'verrais': 'to see', 'verrait': 'to see',
  'vu': 'to see', 'vue': 'view',

  // ── Common verb forms: prendre ──
  'prendre': 'to take', 'prends': 'to take', 'prend': 'to take',
  'prenons': 'to take', 'prenez': 'to take', 'prennent': 'to take',
  'prenais': 'to take', 'prenait': 'to take',
  'prendrai': 'to take', 'prendra': 'to take',
  'pris': 'to take', 'prise': 'to take',

  // ── Common verb forms: mettre ──
  'mettre': 'to put', 'mets': 'to put', 'met': 'to put',
  'mettons': 'to put', 'mettez': 'to put', 'mettent': 'to put',
  'mis': 'to put', 'mise': 'to put',

  // ── Greetings / discourse ──
  'bonjour': 'hello, good day', 'bonsoir': 'good evening',
  'bonne': 'good (f.)', 'bon': 'good',
  'merci': 'thank you', 'salut': 'hi, bye',
  'excusez': 'excuse', 'pardon': 'sorry, pardon',
  'oui': 'yes', 'non': 'no', 'si': 'yes (contradicting)',

  // ── Numbers ──
  'un': 'a, one', 'deux': 'two', 'trois': 'three', 'quatre': 'four', 'cinq': 'five',
  'six': 'six', 'sept': 'seven', 'huit': 'eight', 'neuf': 'nine', 'dix': 'ten',
  'vingt': 'twenty', 'trente': 'thirty', 'cent': 'hundred', 'mille': 'thousand',
  'premier': 'first', 'première': 'first', 'dernier': 'last', 'dernière': 'last',

  // ── Other common words ──
  'voici': 'here is', 'voilà': 'there is',
  'comment': 'how', 'pourquoi': 'why', 'combien': 'how much/many',
  'quand': 'when', 'où': 'where',
  "c'est": 'it is', "n'est": 'is not',
  "qu'il": 'that he', "qu'elle": 'that she', "qu'on": 'that one',
};

// ──────────────────────────────────────────────────────────────
// Step 7: French noun/verb ambiguity table
// Words that are both a noun and a verb in French
// ──────────────────────────────────────────────────────────────
const NOUN_VERB_AMBIGUITY = {
  'voyage': 'trip; to travel',
  'dépense': 'expense; to spend',
  'marche': 'walk, step; to walk',
  'travail': 'work; to work',
  'aide': 'help; to help',
  'appel': 'call; to call',
  'arrêt': 'stop; to stop',
  'attaque': 'attack; to attack',
  'besoin': 'need; to need',
  'baisse': 'decrease; to lower',
  'bruit': 'noise',
  'change': 'change; to change',
  'charge': 'load; to load',
  'choix': 'choice',
  'commande': 'order; to order',
  'compte': 'account; to count',
  'combat': 'fight; to fight',
  'conseil': 'advice; to advise',
  'contrôle': 'control; to control',
  'cours': 'course; to run',
  'coût': 'cost',
  'cuisine': 'kitchen; to cook',
  'danse': 'dance; to dance',
  'demande': 'request; to ask',
  'désir': 'desire',
  'doute': 'doubt; to doubt',
  'échange': 'exchange; to exchange',
  'emploi': 'job',
  'envie': 'desire; to envy',
  'essai': 'try, attempt',
  'étude': 'study',
  'examen': 'exam',
  'forme': 'form, shape; to form',
  'goût': 'taste',
  'garde': 'guard; to keep',
  'guide': 'guide; to guide',
  'hausse': 'increase; to raise',
  'jeu': 'game',
  'lutte': 'fight; to fight',
  'manque': 'lack; to miss',
  'offre': 'offer; to offer',
  'ordre': 'order',
  'part': 'share, part',
  'passage': 'passage',
  'passe': 'pass; to pass',
  'peine': 'penalty, difficulty',
  'perte': 'loss',
  'place': 'place, seat; to place',
  'plan': 'plan',
  'plaisir': 'pleasure',
  'pratique': 'practice; to practice',
  'prise': 'grip; to take',
  'progrès': 'progress',
  'promenade': 'walk, stroll',
  'recette': 'recipe',
  'recherche': 'research; to search',
  'recul': 'retreat',
  'regard': 'look, gaze',
  'règle': 'rule; to settle',
  'rêve': 'dream; to dream',
  'risque': 'risk; to risk',
  'souci': 'worry',
  'soutien': 'support',
  'suite': 'continuation, sequel',
  'taille': 'size; to cut',
  'tour': 'tour, turn; tower',
  'visite': 'visit; to visit',
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all words from the deck
// ──────────────────────────────────────────────────────────────
function collectDeckWords() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const wordFreq = new Map();
  const wordCards = new Map(); // word → [{target, english}, ...]

  for (const card of deck) {
    const tokens = tokenize(card.target, 'french');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '') // strip curly quotes, ZWJ
        .replace(/^[—–\-]+|[—–\-]+$/g, '')                  // strip leading/trailing dashes
        .trim();
      if (!w) continue;
      // Skip single-char tokens (except common French ones)
      if (w.length < 2 && !['à', 'a', 'y'].includes(w)) continue;
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

  // Match entries — handle both single-quoted and double-quoted keys
  // Single-quoted: 'word': { en: 'x', ipa: 'y', pos: 'z' },
  // Double-quoted: "aujourd'hui": { en: 'x', ipa: 'y', pos: 'z' },
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

  // French dict has no footer after closing };
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
  console.log('=== French Dictionary Rebuild v3 ===\n');

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
  const googleRaw = await translateBatch(needTranslation, 'fr');
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

  // Step 5: Strict lemma copy
  console.log('\nStep 5: Lemma copy...');
  let lemmaCopied = 0;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && processed[ex.lemma] && processed[word]) {
      // Copy the lemma's NEW definition to this conjugated form
      processed[word].en = processed[ex.lemma].en;
      lemmaCopied++;
    }
  }
  console.log(`Copied lemma definitions for ${lemmaCopied} entries`);

  // Step 6: Card-context validation
  console.log('\nStep 6: Card-context validation...');
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

  // Step 7: Noun/verb ambiguity
  console.log('\nStep 7: Noun/verb ambiguity...');
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
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'fr'));

  // Also include existing dictionary words that aren't in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'fr'));

  // Deduplicate (in case sort introduced dupes)
  const seenWords = new Set();
  const dedupedWords = [];
  for (const w of allWords) {
    if (!seenWords.has(w)) {
      seenWords.add(w);
      dedupedWords.push(w);
    }
  }

  // Filter out garbled keys from old bad tokenization
  const GARBLED_KEY_RE = /^[a-z]{2,3}[a-zà-ÿ]{4,}$/; // e.g., "lattention", "saméliore"
  const knownGarbled = new Set(['lattention', 'saméliore', 'saméliorent', 'voudriezvous', 'voulezvous']);

  for (const word of dedupedWords) {
    if (knownGarbled.has(word)) {
      console.log(`  Skipping garbled key: ${word}`);
      continue;
    }

    const proc = processed[word];
    const ex = existing[word] || {};
    const ipa = ex.ipa || '';
    const pos = ex.pos || (proc ? (proc.en.startsWith('to ') ? 'v' : 'n') : 'n');
    const lemma = ex.lemma || null;
    let en = proc ? proc.en : ex.en;

    if (!en) continue; // No definition available

    // Force lowercase for non-proper nouns
    // French doesn't have non-Latin source chars, so proper noun detection is simpler:
    // Only keep capitalized if existing dictionary already had it capitalized
    if (en.length > 0 && en[0] === en[0].toUpperCase() && en[0] !== en[0].toLowerCase()) {
      const existingEn = ex.en || '';
      const existingWasCapitalized = existingEn.length > 0 && existingEn[0] === existingEn[0].toUpperCase() && existingEn[0] !== existingEn[0].toLowerCase();
      // Exception: known proper nouns
      const isProperNoun = /^(Paris|France|French|Christmas|Easter|Diwali|Europe|Mediterranean)$/i.test(en);
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
    // 5. ALL CAPS (like TRUE, Really)
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
    // 10. "bonjour" sanity check
    if (word === 'bonjour' && !en.includes('hello') && !en.includes('good day')) {
      problems.push('bonjour_wrong');
    }
    // 11. "faire" sanity check
    if (word === 'faire' && !en.includes('do') && !en.includes('make')) {
      problems.push('faire_wrong');
    }
    // 12. Wrong POS
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

  let md = `# French Dictionary v3 Rebuild - 100-Entry Review\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries written:** ${entries.length}\n`;
  md += `**Function words:** ${Object.keys(functionResults).length}\n`;
  md += `**Google translated:** ${Object.keys(googleRaw).length}\n`;
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

  fs.writeFileSync(path.join(OUTPUT_DIR, 'fr-v3-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/fr-v3-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
