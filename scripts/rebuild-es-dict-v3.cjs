#!/usr/bin/env node
/**
 * Rebuild Spanish dictionary v3 — uses shared pipeline utilities.
 *
 * Steps:
 *  1. Spanish function word table (~200 entries, never sent to Google)
 *  2. Collect all words from deck, tokenize with tokenize(sentence, 'spanish')
 *  3. Google Translate non-function words via translateBatch() with truncation retry
 *  4. Post-process every result via postProcess() (all 18 rules)
 *     CRITICAL: Rule 8c determines verb from English output — prevents carro="to fall"
 *  5. Detect and remove bad lemma references (3-char prefix check)
 *  6. Lemma copy (only for verified lemmas)
 *  7. Card-context validation
 *  8. Apply to es.ts, preserve IPA
 *  9. 100-entry review → scripts/output/es-v4-review.md
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, tokenize } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/spanish/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/es.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Spanish function word table (~200 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Articles / determiners ──
  'el': 'the', 'la': 'the', 'los': 'the', 'las': 'the',
  'un': 'a, one', 'una': 'a, one', 'unos': 'some', 'unas': 'some',
  'del': 'of the', 'al': 'to the',
  'lo': 'the, it, him',

  // ── Demonstratives ──
  'este': 'this', 'esta': 'this', 'estos': 'these', 'estas': 'these',
  'ese': 'that', 'esa': 'that', 'esos': 'those', 'esas': 'those',
  'aquel': 'that (far)', 'aquella': 'that (far)',
  'aquellos': 'those (far)', 'aquellas': 'those (far)',
  'esto': 'this (neut.)', 'eso': 'that (neut.)', 'aquello': 'that (far, neut.)',

  // ── Possessives ──
  'mi': 'my', 'mis': 'my',
  'tu': 'your', 'tus': 'your',
  'su': 'his/her/your', 'sus': 'his/her/your',
  'nuestro': 'our', 'nuestra': 'our', 'nuestros': 'our', 'nuestras': 'our',
  'vuestro': 'your (pl.)', 'vuestra': 'your (pl.)',
  'mío': 'mine', 'mía': 'mine', 'míos': 'mine', 'mías': 'mine',
  'tuyo': 'yours', 'tuya': 'yours', 'tuyos': 'yours', 'tuyas': 'yours',
  'suyo': 'his/hers/yours', 'suya': 'his/hers/yours',

  // ── Pronouns ──
  'yo': 'I', 'tú': 'you', 'él': 'he', 'ella': 'she',
  'nosotros': 'we', 'nosotras': 'we (f.)',
  'ellos': 'they (m.)', 'ellas': 'they (f.)',
  'usted': 'you (formal)', 'ustedes': 'you (pl. formal)',
  'me': 'me, myself', 'te': 'you, yourself', 'se': 'oneself',
  'nos': 'us, ourselves', 'os': 'you, yourselves',
  'le': 'him/her/you (indirect)', 'les': 'them/you (indirect)',
  'lo': 'the, it, him', 'la': 'the, her, it',
  'mí': 'me', 'ti': 'you', 'sí': 'himself/herself',
  'conmigo': 'with me', 'contigo': 'with you', 'consigo': 'with himself/herself',
  'algo': 'something', 'alguien': 'someone', 'nada': 'nothing', 'nadie': 'nobody',
  'todo': 'all, everything', 'toda': 'all (f.)', 'todos': 'all, everyone', 'todas': 'all (f.)',
  'cada': 'each, every',
  'otro': 'other, another', 'otra': 'other, another',
  'otros': 'others', 'otras': 'others (f.)',
  'mismo': 'same, self', 'misma': 'same, self',

  // ── Relative / interrogative pronouns ──
  'que': 'that, which, what', 'quien': 'who', 'quienes': 'who (pl.)',
  'cual': 'which', 'cuál': 'which', 'cuáles': 'which (pl.)',
  'cuyo': 'whose', 'cuya': 'whose (f.)',
  'donde': 'where', 'dónde': 'where',
  'cuando': 'when', 'cuándo': 'when',
  'como': 'as, like, how', 'cómo': 'how',
  'qué': 'what, which', 'quién': 'who', 'quiénes': 'who (pl.)',
  'cuánto': 'how much', 'cuánta': 'how much (f.)',
  'cuántos': 'how many', 'cuántas': 'how many (f.)',
  'por qué': 'why',

  // ── Prepositions ──
  'a': 'to, at', 'de': 'of, from', 'en': 'in, on, at',
  'con': 'with', 'sin': 'without', 'por': 'for, by, through',
  'para': 'for, in order to', 'sobre': 'on, about, over',
  'entre': 'between, among', 'hasta': 'until, up to',
  'desde': 'since, from', 'hacia': 'towards',
  'según': 'according to', 'durante': 'during',
  'contra': 'against', 'tras': 'after, behind',
  'ante': 'before, in front of', 'bajo': 'under',
  'mediante': 'by means of',

  // ── Conjunctions ──
  'y': 'and', 'e': 'and (before i-)', 'o': 'or', 'u': 'or (before o-)',
  'pero': 'but', 'sino': 'but rather', 'ni': 'neither, nor',
  'si': 'if', 'aunque': 'although, even though',
  'porque': 'because', 'pues': 'since, well',
  'mientras': 'while', 'cuando': 'when',
  'ya': 'already, now', 'que': 'that, which, what',
  'como': 'as, like, how', 'así': 'thus, so',
  'entonces': 'then, so', 'sin embargo': 'however',
  'además': 'moreover, besides', 'tampoco': 'neither, not either',

  // ── Adverbs ──
  'no': 'no, not', 'sí': 'yes', 'muy': 'very',
  'más': 'more', 'menos': 'less', 'tan': 'so, as',
  'también': 'also, too', 'tampoco': 'neither, not either',
  'bien': 'well, good', 'mal': 'badly, bad',
  'mucho': 'much, a lot', 'poco': 'little, few',
  'bastante': 'enough, quite', 'demasiado': 'too much',
  'siempre': 'always', 'nunca': 'never', 'jamás': 'never, ever',
  'todavía': 'still, yet', 'aún': 'still, yet',
  'aquí': 'here', 'ahí': 'there', 'allí': 'there (far)',
  'acá': 'here', 'allá': 'over there',
  'ahora': 'now', 'hoy': 'today', 'ayer': 'yesterday', 'mañana': 'tomorrow',
  'antes': 'before', 'después': 'after, later',
  'pronto': 'soon', 'tarde': 'late', 'temprano': 'early',
  'casi': 'almost', 'apenas': 'barely, scarcely',
  'solo': 'only, alone', 'sólo': 'only',
  'quizás': 'perhaps, maybe', 'tal vez': 'perhaps',
  'realmente': 'really', 'verdaderamente': 'truly',
  'incluso': 'even, including', 'aun': 'even',
  'luego': 'then, later', 'ya': 'already, now',
  'arriba': 'up, above', 'abajo': 'down, below',
  'dentro': 'inside', 'fuera': 'outside',
  'cerca': 'near', 'lejos': 'far',
  'juntos': 'together', 'juntas': 'together (f.)',

  // ── Question words ──
  'qué': 'what, which', 'cuál': 'which', 'quién': 'who',
  'dónde': 'where', 'cuándo': 'when', 'cómo': 'how',
  'por qué': 'why', 'cuánto': 'how much',

  // ── ser (to be) ──
  'ser': 'to be', 'soy': 'to be', 'eres': 'to be', 'es': 'is, to be',
  'somos': 'to be', 'son': 'to be',
  'era': 'was, to be', 'eras': 'to be', 'éramos': 'to be', 'eran': 'to be',
  'fui': 'was, to be', 'fue': 'was, to be', 'fuimos': 'to be', 'fueron': 'to be',
  'seré': 'will be', 'será': 'will be', 'seremos': 'will be', 'serán': 'will be',
  'sería': 'would be', 'serías': 'would be', 'seríamos': 'would be', 'serían': 'would be',
  'sea': 'to be (subj.)', 'seas': 'to be (subj.)', 'seamos': 'to be (subj.)', 'sean': 'to be (subj.)',
  'fuera': 'were (subj.)', 'fueras': 'were (subj.)', 'fuéramos': 'were (subj.)', 'fueran': 'were (subj.)',
  'sido': 'been',

  // ── estar (to be) ──
  'estar': 'to be (state)', 'estoy': 'to be (state)', 'estás': 'to be (state)',
  'está': 'to be (state)', 'estamos': 'to be (state)', 'están': 'to be (state)',
  'estaba': 'was (state)', 'estabas': 'was (state)',
  'estábamos': 'were (state)', 'estaban': 'were (state)',
  'estuvo': 'was (state)', 'estuvimos': 'were (state)', 'estuvieron': 'were (state)',
  'estuve': 'was (state)',
  'estaré': 'will be (state)', 'estará': 'will be (state)',
  'estaremos': 'will be (state)', 'estarán': 'will be (state)',
  'estaría': 'would be (state)', 'estarían': 'would be (state)',
  'esté': 'to be (subj.)', 'estén': 'to be (subj.)',
  'estuviera': 'were (subj.)', 'estuvieran': 'were (subj.)',
  'estado': 'been, state',

  // ── haber (auxiliary: to have) ──
  'haber': 'to have (aux.)', 'he': 'have (I)',
  'has': 'have (you)', 'ha': 'has',
  'hemos': 'have (we)', 'han': 'have (they)',
  'había': 'had', 'habías': 'had (you)',
  'habíamos': 'had (we)', 'habían': 'had (they)',
  'hubo': 'there was/were',
  'habrá': 'will have, there will be', 'habrán': 'will have',
  'habría': 'would have', 'habrían': 'would have',
  'haya': 'have (subj.)', 'hayan': 'have (subj.)',
  'hubiera': 'had (subj.)', 'hubieran': 'had (subj.)',
  'hay': 'there is/are',

  // ── tener (to have) ──
  'tener': 'to have', 'tengo': 'to have', 'tienes': 'to have',
  'tiene': 'to have', 'tenemos': 'to have', 'tienen': 'to have',
  'tenía': 'had, to have', 'tenías': 'had', 'teníamos': 'had', 'tenían': 'had',
  'tuve': 'had', 'tuvo': 'had', 'tuvimos': 'had', 'tuvieron': 'had',
  'tendré': 'will have', 'tendrá': 'will have', 'tendremos': 'will have', 'tendrán': 'will have',
  'tendría': 'would have', 'tendrían': 'would have',
  'tenga': 'to have (subj.)', 'tengan': 'to have (subj.)',
  'tuviera': 'had (subj.)', 'tuvieran': 'had (subj.)',
  'tenido': 'had (p.p.)',

  // ── ir (to go) ──
  'ir': 'to go', 'voy': 'to go', 'vas': 'to go', 'va': 'to go',
  'vamos': 'to go, let\'s go', 'van': 'to go',
  'iba': 'was going, to go', 'ibas': 'to go', 'íbamos': 'to go', 'iban': 'to go',
  'iré': 'will go', 'irá': 'will go', 'iremos': 'will go', 'irán': 'will go',
  'iría': 'would go', 'irían': 'would go',
  'vaya': 'to go (subj.)', 'vayan': 'to go (subj.)',
  'fuera': 'were (subj.)', 'ido': 'gone',

  // ── poder (to be able, can) ──
  'poder': 'to be able, can', 'puedo': 'to be able, can', 'puedes': 'to be able, can',
  'puede': 'to be able, can', 'podemos': 'to be able, can', 'pueden': 'to be able, can',
  'podía': 'could', 'podías': 'could', 'podíamos': 'could', 'podían': 'could',
  'pude': 'could', 'pudo': 'could', 'pudimos': 'could', 'pudieron': 'could',
  'podré': 'will be able', 'podrá': 'will be able', 'podremos': 'will be able', 'podrán': 'will be able',
  'podría': 'could, would be able', 'podrían': 'could, would be able',
  'pueda': 'can (subj.)', 'puedan': 'can (subj.)',
  'pudiera': 'could (subj.)', 'pudieran': 'could (subj.)',
  'podido': 'been able',

  // ── querer (to want) ──
  'querer': 'to want', 'quiero': 'to want', 'quieres': 'to want',
  'quiere': 'to want', 'queremos': 'to want', 'quieren': 'to want',
  'quería': 'wanted, to want', 'querías': 'wanted', 'queríamos': 'wanted', 'querían': 'wanted',
  'quise': 'wanted', 'quiso': 'wanted', 'quisimos': 'wanted', 'quisieron': 'wanted',
  'querré': 'will want', 'querrá': 'will want',
  'querría': 'would want', 'querrían': 'would want',
  'quiera': 'to want (subj.)', 'quieran': 'to want (subj.)',
  'quisiera': 'would want (subj.)', 'quisieran': 'would want (subj.)',
  'querido': 'wanted, dear',

  // ── deber (to must, to owe) ──
  'deber': 'to must, to owe', 'debo': 'to must', 'debes': 'to must',
  'debe': 'to must', 'debemos': 'to must', 'deben': 'to must',
  'debía': 'had to, should', 'debías': 'should',
  'debería': 'should', 'deberían': 'should',
  'debido': 'due, owed',

  // ── hacer (to do, to make) ──
  'hacer': 'to do, to make', 'hago': 'to do, to make', 'haces': 'to do, to make',
  'hace': 'to do, to make, ago', 'hacemos': 'to do, to make', 'hacen': 'to do, to make',
  'hacía': 'to do, to make', 'hacías': 'to do, to make', 'hacíamos': 'to do, to make', 'hacían': 'to do, to make',
  'hice': 'did, made', 'hizo': 'did, made', 'hicimos': 'did, made', 'hicieron': 'did, made',
  'haré': 'will do/make', 'hará': 'will do/make', 'haremos': 'will do/make', 'harán': 'will do/make',
  'haría': 'would do/make', 'harían': 'would do/make',
  'haga': 'to do (subj.)', 'hagan': 'to do (subj.)',
  'hiciera': 'did (subj.)', 'hicieran': 'did (subj.)',
  'hecho': 'done, made, fact',

  // ── decir (to say, to tell) ──
  'decir': 'to say, to tell', 'digo': 'to say', 'dices': 'to say',
  'dice': 'to say', 'decimos': 'to say', 'dicen': 'to say',
  'decía': 'to say', 'decían': 'to say',
  'dije': 'said', 'dijo': 'said', 'dijimos': 'said', 'dijeron': 'said',
  'diré': 'will say', 'dirá': 'will say',
  'diría': 'would say', 'dirían': 'would say',
  'diga': 'to say (subj.)', 'digan': 'to say (subj.)',
  'dijera': 'said (subj.)', 'dijeran': 'said (subj.)',
  'dicho': 'said, told',

  // ── dar (to give) ──
  'dar': 'to give', 'doy': 'to give', 'das': 'to give',
  'da': 'to give', 'damos': 'to give', 'dan': 'to give',
  'daba': 'to give', 'daban': 'to give',
  'di': 'gave', 'dio': 'gave', 'dimos': 'gave', 'dieron': 'gave',
  'daré': 'will give', 'dará': 'will give',
  'daría': 'would give', 'darían': 'would give',
  'dé': 'to give (subj.)', 'den': 'to give (subj.)',
  'diera': 'gave (subj.)', 'dieran': 'gave (subj.)',
  'dado': 'given',

  // ── saber (to know) ──
  'saber': 'to know', 'sé': 'I know',
  'sabes': 'to know', 'sabe': 'to know',
  'sabemos': 'to know', 'saben': 'to know',
  'sabía': 'knew', 'sabían': 'knew',
  'supe': 'knew', 'supo': 'knew',
  'sabré': 'will know', 'sabrá': 'will know',
  'sabría': 'would know',
  'sepa': 'to know (subj.)', 'sepan': 'to know (subj.)',
  'supiera': 'knew (subj.)',
  'sabido': 'known',

  // ── venir (to come) ──
  'venir': 'to come', 'vengo': 'to come', 'vienes': 'to come',
  'viene': 'to come', 'venimos': 'to come', 'vienen': 'to come',
  'venía': 'came, to come', 'venían': 'to come',
  'vine': 'came', 'vino': 'came, wine',
  'vendré': 'will come', 'vendrá': 'will come',
  'vendría': 'would come',
  'venga': 'to come (subj.)', 'vengan': 'to come (subj.)',
  'viniera': 'came (subj.)',
  'venido': 'come (p.p.)',

  // ── poner (to put) ──
  'poner': 'to put', 'pongo': 'to put', 'pones': 'to put',
  'pone': 'to put', 'ponemos': 'to put', 'ponen': 'to put',
  'ponía': 'to put', 'ponían': 'to put',
  'puse': 'put (past)', 'puso': 'put (past)',
  'pondré': 'will put', 'pondrá': 'will put',
  'pondría': 'would put',
  'ponga': 'to put (subj.)', 'pongan': 'to put (subj.)',
  'pusiera': 'put (subj.)',
  'puesto': 'put, placed',

  // ── salir (to go out, to leave) ──
  'salir': 'to go out, to leave', 'salgo': 'to leave',
  'sales': 'to leave', 'sale': 'to leave',
  'salimos': 'to leave', 'salen': 'to leave',
  'salía': 'to leave', 'salían': 'to leave',
  'salí': 'left', 'salió': 'left',
  'saldré': 'will leave', 'saldrá': 'will leave',
  'saldría': 'would leave',
  'salga': 'to leave (subj.)', 'salgan': 'to leave (subj.)',
  'salido': 'left, gone out',

  // ── ver (to see) ──
  'ver': 'to see', 'veo': 'to see', 'ves': 'to see',
  've': 'to see', 'vemos': 'to see', 'ven': 'to see, to come',
  'veía': 'to see', 'veían': 'to see',
  'vi': 'saw', 'vio': 'saw', 'vimos': 'saw', 'vieron': 'saw',
  'veré': 'will see', 'verá': 'will see',
  'vería': 'would see',
  'vea': 'to see (subj.)', 'vean': 'to see (subj.)',
  'viera': 'saw (subj.)',
  'visto': 'seen',

  // ── Greetings / discourse ──
  'hola': 'hello', 'adiós': 'goodbye',
  'gracias': 'thank you', 'por favor': 'please',
  'perdón': 'sorry, pardon', 'disculpe': 'excuse me',
  'bueno': 'good, well', 'buena': 'good (f.)',
  'buenos': 'good (m. pl.)', 'buenas': 'good (f. pl.)',
  'señor': 'sir, Mr.', 'señora': 'Mrs., madam',

  // ── Numbers ──
  'uno': 'one', 'dos': 'two', 'tres': 'three', 'cuatro': 'four', 'cinco': 'five',
  'seis': 'six', 'siete': 'seven', 'ocho': 'eight', 'nueve': 'nine', 'diez': 'ten',
  'veinte': 'twenty', 'treinta': 'thirty', 'cien': 'hundred', 'mil': 'thousand',
  'primero': 'first', 'primera': 'first (f.)', 'segundo': 'second',
  'último': 'last', 'última': 'last (f.)',
};

// ──────────────────────────────────────────────────────────────
// Spanish noun/verb ambiguity table
// ──────────────────────────────────────────────────────────────
const NOUN_VERB_AMBIGUITY = {
  'viaje': 'trip; to travel',
  'trabajo': 'work; to work',
  'ayuda': 'help; to help',
  'cambio': 'change; to change',
  'cuidado': 'care; to care',
  'carga': 'load; to load',
  'cocina': 'kitchen; to cook',
  'compra': 'purchase; to buy',
  'cuenta': 'account, bill; to count',
  'demanda': 'demand; to demand',
  'deseo': 'desire; to desire',
  'duda': 'doubt; to doubt',
  'estudio': 'study; to study',
  'forma': 'form, shape; to form',
  'guía': 'guide; to guide',
  'juego': 'game; to play',
  'lucha': 'fight; to fight',
  'marcha': 'march; to march',
  'oferta': 'offer',
  'orden': 'order',
  'parte': 'part',
  'paso': 'step; to pass',
  'pesca': 'fishing; to fish',
  'plan': 'plan',
  'práctica': 'practice',
  'pregunta': 'question; to ask',
  'regla': 'rule',
  'resultado': 'result',
  'riesgo': 'risk',
  'sueño': 'dream; to dream',
  'vista': 'view',
  'visita': 'visit; to visit',
  'vuelta': 'turn, return',
  'baile': 'dance; to dance',
  'canto': 'song; to sing',
  'corte': 'cut; to cut',
  'gasto': 'expense; to spend',
  'gusto': 'taste, pleasure',
  'intento': 'attempt; to try',
  'paseo': 'walk, stroll',
  'pago': 'payment; to pay',
  'peso': 'weight; to weigh',
  'recuerdo': 'memory; to remember',
  'respuesta': 'answer',
  'toque': 'touch; to touch',
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all words from the deck
// ──────────────────────────────────────────────────────────────
function collectDeckWords() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const wordFreq = new Map();
  const wordCards = new Map(); // word → [{target, english}, ...]

  for (const card of deck) {
    const tokens = tokenize(card.target, 'spanish');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '') // strip curly quotes, ZWJ
        .replace(/^[—–\-]+|[—–\-]+$/g, '')                  // strip leading/trailing dashes
        .trim();
      if (!w) continue;
      // Skip single-char tokens (except common Spanish ones)
      if (w.length < 2 && !['a', 'y', 'e', 'o', 'u'].includes(w)) continue;
      // Only keep Latin-script tokens
      if (!/[a-záéíóúñü]/i.test(w)) continue;
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

  // Check for footer after closing };
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
  console.log('=== Spanish Dictionary Rebuild v3 ===\n');

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
  const googleRaw = await translateBatch(needTranslation, 'es');
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
  // characters with its lemma? If not (like carro->caer sharing only "ca"),
  // REMOVE the lemma field. This prevents the ca-/le-/am- over-matching bug.
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
      if (cleanedExisting[word]) {
        const oldDef = cleanedExisting[word].en.replace(/^to /, '').toLowerCase();
        for (const card of cards) {
          if (card.english.toLowerCase().includes(oldDef)) {
            entry.en = cleanedExisting[word].en;
            contextFixed++;
            break;
          }
        }
      }
    }
  }
  console.log(`Context-fixed ${contextFixed} entries`);

  // Apply noun/verb ambiguity table
  console.log('\nApplying noun/verb ambiguity...');
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
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'es'));

  // Also include existing dictionary words that aren't in the deck (preserve them)
  for (const word of Object.keys(cleanedExisting)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'es'));

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
    const ex = cleanedExisting[word] || {};
    const ipa = ex.ipa || '';
    const pos = ex.pos || (proc ? (proc.en.startsWith('to ') ? 'v' : 'n') : 'n');
    const lemma = ex.lemma || null; // Already cleaned in step 5
    let en = proc ? proc.en : ex.en;

    if (!en) continue; // No definition available

    // Force lowercase for non-proper nouns
    if (en.length > 0 && en[0] === en[0].toUpperCase() && en[0] !== en[0].toLowerCase()) {
      const existingEn = ex.en || '';
      const existingWasCapitalized = existingEn.length > 0 && existingEn[0] === existingEn[0].toUpperCase() && existingEn[0] !== existingEn[0].toLowerCase();
      const isProperNoun = /^(Madrid|Spain|Spanish|Christmas|Easter|Mexico|Europe|Mediterranean|Barcelona|Navidad)$/i.test(en);
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
    const ex = cleanedExisting[word] || {};
    const pos = ex.pos || (proc.en.startsWith('to ') ? 'v' : 'n');
    const en = proc.en;
    const problems = [];

    // Check if pipeline flagged wrong_pos (meaning deck POS is unreliable)
    const hasWrongPos = proc.flagReasons && proc.flagReasons.includes('wrong_pos');

    // 1. Wrong "to " prefix on nouns — but only if pipeline didn't already flag wrong_pos
    if (pos === 'n' && en.startsWith('to ') && !en.startsWith('to the') && !en.includes(';') && !hasWrongPos) {
      problems.push('wrong_to_on_noun');
    }
    // 2. Missing "to " on verbs — but only if pipeline didn't flag wrong_pos
    // (pipeline detected English output is not a verb, so omitting "to" is correct)
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';') && !hasWrongPos) {
      problems.push('missing_to_on_verb');
    }
    // 3. Conjugated English forms
    if (/\b(eats|goes|comes|reads|writes|runs|sees|gives|takes|makes|knows|thinks|says|gets|wants|works|plays|lives|loves|feels|finds|tells|asks|uses|tries|needs|keeps|brings|starts|moves|pays|meets|calls|shows|helps)\b/i.test(en)) {
      problems.push('conjugated_english');
    }
    if (/\b\w+ing\b/.test(en.replace(/^to /, '')) && !/(thing|morning|evening|ring|king|spring|string|sing|bring|nothing|something|anything|everything|ceiling|feeling|building|wedding|clothing|warning|opening|meaning|meeting|setting|beginning|during|amazing|interesting|willing|missing|fishing|cooking|swimming|parking|reading|living|working|shopping|nursing|banking|housing|beijing|pudding|darling|sterling|sibling|offspring|stocking|stuffing|blessing|offering|landing|standing|hanging|crossing|frosting|casting|listing|posting|hosting|seating|heating|lighting|writing|drawing|painting|carving|packing|backing|tracking|blocking|locking|picking|sticking|rocking|shocking|checking|stacking|ducking|sucking|kicking|ticking|clicking|flicking|pricking|slicking|bricking|wicking|nicking|billing|filling|killing|milling|rolling|selling|telling|willing|falling|calling|pulling|spelling|dwelling|yelling|ceiling|peeling|feeling|dealing|healing|sealing|stealing|appealing|revealing|concealing|underling|yearling|spelling|fledgling|dumpling|sampling|trembling|gambling|crumbling|rumbling|assembling|resembling|stumbling|grumbling|humbling|fumbling|bungling|mingling|singling|tingling|dangling|tangling|wrangling|mangling|angling|strangling|puzzling|dazzling|sizzling|drizzling|fizzling|guzzling|muzzling|nuzzling|puzzling|bustling|rustling|whistling|wrestling|nestling|startling|sparkling|twinkling|sprinkling|crackling|tickling|prickling|buckling|chuckling|duckling|trekking|shocking|charming|alarming|disarming|farming|warming|swarming|forming|performing|conforming|informing|reforming|transforming|storming|brainstorming|accounting|disgusting|exhausting|everlasting|broadcasting|outstanding|understanding|commanding|demanding|expanding|outstanding|surrounding|corresponding|overwhelming|underlying)/.test(en)) {
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
    // 10. Bad lemma reference (word still has lemma that shares < 3 chars)
    if (cleanedExisting[word]?.lemma) {
      const wl = word.toLowerCase();
      const ll = cleanedExisting[word].lemma.toLowerCase();
      let sp = 0;
      for (let i = 0; i < Math.min(wl.length, ll.length); i++) {
        if (wl[i] === ll[i]) sp++; else break;
      }
      if (sp < 3) problems.push('bad_lemma');
    }

    // wrong_pos alone is a deck issue (POS mismatch), not a translation error
    // Don't count it as a failure if it's the only problem
    const criticalProblems = problems.filter(p => p !== 'wrong_pos');
    if (criticalProblems.length === 0) {
      pass++;
      reviewResults.push({ word, en, pos, status: 'PASS', problems: problems.length > 0 ? problems : undefined });
    } else {
      fail++;
      reviewResults.push({ word, en, pos, status: 'FAIL', problems });
      issues.push({ word, en, pos, problems });
    }
  }

  const grade = pass >= 90 ? 'A' : pass >= 80 ? 'B' : pass >= 70 ? 'C' : pass >= 60 ? 'D' : 'F';

  // Write review
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let md = `# Spanish Dictionary v3 Rebuild - 100-Entry Review\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries written:** ${entries.length}\n`;
  md += `**Function words:** ${Object.keys(functionResults).length}\n`;
  md += `**Google translated:** ${Object.keys(googleRaw).length}\n`;
  md += `**Lemma-copied:** ${lemmaCopied}\n`;
  md += `**Context-fixed:** ${contextFixed}\n`;
  md += `**Ambiguity-fixed:** ${ambiguityFixed}\n`;
  md += `**Bad lemmas removed:** ${badLemmasRemoved}\n\n`;
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

  md += `\n## Bad Lemmas Removed\n\n`;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && cleanedExisting[word] && !cleanedExisting[word].lemma) {
      md += `- \`${word}\` -> \`${ex.lemma}\` (removed)\n`;
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'es-v4-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/es-v4-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
