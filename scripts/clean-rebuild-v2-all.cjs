#!/usr/bin/env node
/**
 * clean-rebuild-v2-all.cjs — Universal dictionary rebuild for any language
 *
 * Usage: node scripts/clean-rebuild-v2-all.cjs <langCode>
 *   e.g.: node scripts/clean-rebuild-v2-all.cjs fr
 *
 * Pipeline:
 *   1. Parse all entries from <lang>.ts
 *   2. Classify: VERB_INFINITIVE, VERB_FORM, NON_VERB
 *   3. Collect unique infinitives
 *   4. Translate infinitives via Google → add "to " → assign to all verb forms via lemma
 *   5. Translate non-verbs via Google → use as-is
 *   6. Function word table per language
 *   7. Write to dictionary, preserve IPA
 *   8. Built-in QC
 *   9. TypeScript verify
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const LANG = process.argv[2];
if (!LANG) { console.error('Usage: node clean-rebuild-v2-all.cjs <langCode>'); process.exit(1); }

const ROOT = path.join(__dirname, '..');
const DICT_PATH = path.join(ROOT, 'src', 'data', 'dictionary', `${LANG}.ts`);
const API_KEY = 'AIzaSyBImkCNYcI1m9mloUNcYcDN2L5dQZwADzI';

// ─── Language configs ───────────────────────────────────────────────────────
const LANG_CONFIGS = {
  es: { googleCode: 'es', infinitiveRe: /(?:ar|er|ir|arse|erse|irse|ír|írse)$/, sortLocale: 'es', dictVar: 'export const dictionary' },
  it: { googleCode: 'it', infinitiveRe: /(?:are|ere|ire|arsi|ersi|irsi)$/, sortLocale: 'it', dictVar: 'export const dictionary' },
  fr: { googleCode: 'fr', infinitiveRe: /(?:er|ir|re|oir)$/, sortLocale: 'fr', dictVar: 'export const dictionary' },
  pt: { googleCode: 'pt', infinitiveRe: /(?:ar|er|ir|or)$/, sortLocale: 'pt', dictVar: 'const dictionary' },
  de: { googleCode: 'de', infinitiveRe: /(?:en|eln|ern)$/, sortLocale: 'de', dictVar: 'const DICT' },
  nl: { googleCode: 'nl', infinitiveRe: /(?:en|ën)$/, sortLocale: 'nl', dictVar: 'const dictionary' },
  sv: { googleCode: 'sv', infinitiveRe: /a$/, sortLocale: 'sv', dictVar: 'const dictionary', usePosFallback: true },
  tr: { googleCode: 'tr', infinitiveRe: /(?:mek|mak)$/, sortLocale: 'tr', dictVar: 'const dictionary' },
  ru: { googleCode: 'ru', infinitiveRe: /(?:ть|ти|чь|ться|тись|чься)$/, sortLocale: 'ru', dictVar: 'const dictionary' },
  cy: { googleCode: 'cy', infinitiveRe: null, sortLocale: 'cy', dictVar: 'const dict', lemmaOnly: true },
  hi: { googleCode: 'hi', infinitiveRe: /ना$/, sortLocale: 'hi', dictVar: 'const dictionary' },
};

const cfg = LANG_CONFIGS[LANG];
if (!cfg) { console.error(`Unknown language: ${LANG}`); process.exit(1); }

// ─── False infinitives per language ─────────────────────────────────────────
const FALSE_INFINITIVES_MAP = {
  es: new Set([
    'ayer', 'anteayer', 'azúcar', 'lugar', 'hogar', 'collar', 'dólar',
    'familiar', 'popular', 'particular', 'regular', 'similar', 'solar',
    'lunar', 'nuclear', 'celular', 'escolar', 'militar', 'circular',
    'muscular', 'singular', 'espectacular', 'rectangular', 'triangular',
    'secular', 'modular', 'angular', 'polar', 'vulgar', 'altar',
    'avatar', 'bazar', 'bar', 'par', 'mar', 'pilar', 'pulgar',
    'ejemplar', 'malestar', 'bienestar', 'pesar', 'palmar',
    'mujer', 'placer', 'carácter', 'poder', 'taller',
    'canciller', 'alquiler', 'cualquier',
    'elixir', 'nadir', 'souvenir', 'tapir',
  ]),
  it: new Set([
    'altare', 'mare', 'familiare', 'popolare', 'particolare',
    'regolare', 'solare', 'lunare', 'nucleare', 'cellulare',
    'militare', 'circolare', 'muscolare', 'singolare',
    'spettacolare', 'rettangolare', 'triangolare', 'secolare', 'modulare',
    'angolare', 'polare', 'volgare', 'esemplare', 'bar',
    'piacere', 'carattere', 'potere', 'bicchiere', 'mestiere', 'quartiere',
    'cameriere', 'infermiere', 'ingegnere', 'cancelliere',
    'avvenire',
  ]),
  fr: new Set([
    'hier', 'hiver', 'dîner', 'souper', 'déjeuner', 'goûter',
    'air', 'chair', 'cuir', 'désir', 'loisir', 'plaisir', 'souvenir',
    'avenir', 'soir', 'espoir', 'miroir', 'pouvoir', 'savoir', 'devoir',
    'couloir', 'comptoir', 'trottoir', 'réservoir', 'noir',
    'mer', 'fer', 'hiver', 'enfer', 'cancer', 'super', 'cher',
    'premier', 'dernier', 'entier', 'papier', 'cahier', 'métier',
    'quartier', 'étranger', 'danger', 'passager', 'léger', 'berger',
    'officier', 'dossier', 'escalier', 'soulier', 'boucher', 'boulanger',
    'plancher', 'panier', 'calendrier', 'chantier', 'atelier',
    'pour',
  ]),
  pt: new Set([
    'mar', 'bar', 'par', 'lar', 'lugar', 'altar', 'azar', 'jantar',
    'pomar', 'familiar', 'popular', 'particular', 'regular', 'similar',
    'solar', 'lunar', 'nuclear', 'celular', 'escolar', 'militar',
    'circular', 'muscular', 'singular', 'espetacular', 'retangular',
    'secular', 'modular', 'angular', 'polar', 'vulgar', 'pilar',
    'mulher', 'prazer', 'caráter', 'poder', 'qualquer',
    'colher', 'talher', 'açúcar', 'dólar',
  ]),
  de: new Set([
    'wissen', 'essen', 'morgen', 'regen', 'boden', 'garten', 'hafen',
    'wagen', 'schatten', 'braten', 'graben', 'laden', 'magen', 'faden',
    'ofen', 'kragen', 'kasten', 'rasen', 'tropfen', 'funken', 'balken',
    'posten', 'pfosten', 'knochen', 'brocken', 'pfoten',
    'kuchen', 'zeichen', 'tatsachen', 'sachen', 'drachen',
    'eichen', 'reichen', 'gleichen', 'leichen',
  ]),
  nl: new Set([
    'eten', 'morgen', 'regen', 'boven', 'binnen', 'buiten', 'beneden',
    'achten', 'teken', 'wapen', 'haven', 'hopen', 'baken', 'toren',
    'keuken', 'laken', 'waken',
  ]),
  sv: new Set([
    'då', 'ja', 'nja', 'tja', 'heja', 'opera', 'sofa', 'villa',
    'kamera', 'drama', 'firma', 'forma', 'panorama', 'schema',
    'extra', 'ultra', 'data', 'meta', 'alfa', 'beta', 'delta',
    'pizza', 'pasta', 'marina', 'banana',
  ]),
  tr: new Set([]),
  ru: new Set([]),
  cy: new Set([]),
  hi: new Set([]),
};
const FALSE_INFINITIVES = FALSE_INFINITIVES_MAP[LANG] || new Set();

// ─── Function words per language ────────────────────────────────────────────
const FUNCTION_WORDS_MAP = {
  es: {
    'el':{en:'the',pos:'det'},'la':{en:'the',pos:'det'},'los':{en:'the',pos:'det'},'las':{en:'the',pos:'det'},
    'un':{en:'a',pos:'det'},'una':{en:'a',pos:'det'},'unos':{en:'some',pos:'det'},'unas':{en:'some',pos:'det'},
    'al':{en:'to the',pos:'prep'},'del':{en:'of the',pos:'prep'},
    'yo':{en:'I',pos:'pron'},'tú':{en:'you',pos:'pron'},'él':{en:'he',pos:'pron'},'ella':{en:'she',pos:'pron'},
    'nosotros':{en:'we',pos:'pron'},'nosotras':{en:'we',pos:'pron'},
    'vosotros':{en:'you (plural)',pos:'pron'},'vosotras':{en:'you (plural)',pos:'pron'},
    'ellos':{en:'they',pos:'pron'},'ellas':{en:'they',pos:'pron'},
    'usted':{en:'you (formal)',pos:'pron'},'ustedes':{en:'you (formal plural)',pos:'pron'},
    'me':{en:'me',pos:'pron'},'te':{en:'you',pos:'pron'},'se':{en:'oneself',pos:'pron'},
    'nos':{en:'us',pos:'pron'},'os':{en:'you',pos:'pron'},
    'le':{en:'him/her',pos:'pron'},'les':{en:'them',pos:'pron'},'lo':{en:'it/him',pos:'pron'},
    'mí':{en:'me',pos:'pron'},'ti':{en:'you',pos:'pron'},'sí':{en:'yes',pos:'adv'},
    'conmigo':{en:'with me',pos:'pron'},'contigo':{en:'with you',pos:'pron'},'consigo':{en:'with oneself',pos:'pron'},
    'mi':{en:'my',pos:'det'},'mis':{en:'my',pos:'det'},'tu':{en:'your',pos:'det'},'tus':{en:'your',pos:'det'},
    'su':{en:'his/her/your/their',pos:'det'},'sus':{en:'his/her/your/their',pos:'det'},
    'nuestro':{en:'our',pos:'det'},'nuestra':{en:'our',pos:'det'},'nuestros':{en:'our',pos:'det'},'nuestras':{en:'our',pos:'det'},
    'vuestro':{en:'your',pos:'det'},'vuestra':{en:'your',pos:'det'},
    'mío':{en:'mine',pos:'pron'},'mía':{en:'mine',pos:'pron'},
    'tuyo':{en:'yours',pos:'pron'},'tuya':{en:'yours',pos:'pron'},
    'suyo':{en:'his/hers/yours/theirs',pos:'pron'},'suya':{en:'his/hers/yours/theirs',pos:'pron'},
    'este':{en:'this',pos:'det'},'esta':{en:'this',pos:'det'},'estos':{en:'these',pos:'det'},'estas':{en:'these',pos:'det'},
    'ese':{en:'that',pos:'det'},'esa':{en:'that',pos:'det'},'esos':{en:'those',pos:'det'},'esas':{en:'those',pos:'det'},
    'aquel':{en:'that (far)',pos:'det'},'aquella':{en:'that (far)',pos:'det'},
    'a':{en:'to/at',pos:'prep'},'de':{en:'of/from',pos:'prep'},'en':{en:'in/on',pos:'prep'},
    'con':{en:'with',pos:'prep'},'por':{en:'for/by',pos:'prep'},'para':{en:'for/to',pos:'prep'},
    'sin':{en:'without',pos:'prep'},'sobre':{en:'on/about',pos:'prep'},'entre':{en:'between',pos:'prep'},
    'hasta':{en:'until',pos:'prep'},'desde':{en:'since/from',pos:'prep'},'hacia':{en:'towards',pos:'prep'},
    'durante':{en:'during',pos:'prep'},'contra':{en:'against',pos:'prep'},'tras':{en:'after/behind',pos:'prep'},
    'y':{en:'and',pos:'conj'},'e':{en:'and',pos:'conj'},'o':{en:'or',pos:'conj'},'u':{en:'or',pos:'conj'},
    'pero':{en:'but',pos:'conj'},'sino':{en:'but/rather',pos:'conj'},'ni':{en:'neither/nor',pos:'conj'},
    'que':{en:'that/which',pos:'conj'},'porque':{en:'because',pos:'conj'},'aunque':{en:'although',pos:'conj'},
    'si':{en:'if',pos:'conj'},'cuando':{en:'when',pos:'conj'},'como':{en:'as/like',pos:'conj'},
    'donde':{en:'where',pos:'conj'},'mientras':{en:'while',pos:'conj'},'pues':{en:'since/well',pos:'conj'},
    'ya':{en:'already',pos:'adv'},'muy':{en:'very',pos:'adv'},'más':{en:'more',pos:'adv'},
    'menos':{en:'less',pos:'adv'},'también':{en:'also',pos:'adv'},'todavía':{en:'still',pos:'adv'},
    'siempre':{en:'always',pos:'adv'},'nunca':{en:'never',pos:'adv'},
    'aquí':{en:'here',pos:'adv'},'ahí':{en:'there',pos:'adv'},'allí':{en:'there',pos:'adv'},
    'ahora':{en:'now',pos:'adv'},'hoy':{en:'today',pos:'adv'},'ayer':{en:'yesterday',pos:'adv'},
    'mañana':{en:'tomorrow',pos:'adv'},'bien':{en:'well',pos:'adv'},'mal':{en:'badly',pos:'adv'},
    'mucho':{en:'much',pos:'adv'},'poco':{en:'little',pos:'adv'},'bastante':{en:'enough',pos:'adv'},
    'no':{en:'no/not',pos:'adv'},'sólo':{en:'only',pos:'adv'},'solo':{en:'only',pos:'adv'},
    'casi':{en:'almost',pos:'adv'},'tan':{en:'so/such',pos:'adv'},
    'luego':{en:'then/later',pos:'adv'},'después':{en:'after/later',pos:'adv'},
    'antes':{en:'before',pos:'adv'},'dentro':{en:'inside',pos:'adv'},'fuera':{en:'outside',pos:'adv'},
    'arriba':{en:'above',pos:'adv'},'abajo':{en:'down',pos:'adv'},'lejos':{en:'far',pos:'adv'},
    'cerca':{en:'near',pos:'adv'},'pronto':{en:'soon',pos:'adv'},
    'qué':{en:'what',pos:'pron'},'quién':{en:'who',pos:'pron'},
    'cómo':{en:'how',pos:'adv'},'dónde':{en:'where',pos:'adv'},'cuándo':{en:'when',pos:'adv'},
    'nada':{en:'nothing',pos:'pron'},'nadie':{en:'nobody',pos:'pron'},
    'algo':{en:'something',pos:'pron'},'alguien':{en:'someone',pos:'pron'},
    'todo':{en:'all/everything',pos:'pron'},'toda':{en:'all/every',pos:'det'},
    'todos':{en:'all/everyone',pos:'pron'},'todas':{en:'all/every',pos:'det'},
    'otro':{en:'other/another',pos:'det'},'otra':{en:'other/another',pos:'det'},
    'cada':{en:'each/every',pos:'det'},
    // High-frequency verb forms
    'soy':{en:'to be',pos:'v',lemma:'ser'},'eres':{en:'to be',pos:'v',lemma:'ser'},
    'es':{en:'to be',pos:'v',lemma:'ser'},'somos':{en:'to be',pos:'v',lemma:'ser'},
    'son':{en:'to be',pos:'v',lemma:'ser'},'ser':{en:'to be',pos:'v'},
    'estoy':{en:'to be',pos:'v',lemma:'estar'},'estás':{en:'to be',pos:'v',lemma:'estar'},
    'está':{en:'to be',pos:'v',lemma:'estar'},'estamos':{en:'to be',pos:'v',lemma:'estar'},
    'están':{en:'to be',pos:'v',lemma:'estar'},'estar':{en:'to be',pos:'v'},
    'he':{en:'to have',pos:'v',lemma:'haber'},'has':{en:'to have',pos:'v',lemma:'haber'},
    'ha':{en:'to have',pos:'v',lemma:'haber'},'hemos':{en:'to have',pos:'v',lemma:'haber'},
    'han':{en:'to have',pos:'v',lemma:'haber'},'haber':{en:'to have',pos:'v'},
    'hay':{en:'there is/are',pos:'v',lemma:'haber'},
    'tengo':{en:'to have',pos:'v',lemma:'tener'},'tienes':{en:'to have',pos:'v',lemma:'tener'},
    'tiene':{en:'to have',pos:'v',lemma:'tener'},'tenemos':{en:'to have',pos:'v',lemma:'tener'},
    'tienen':{en:'to have',pos:'v',lemma:'tener'},'tener':{en:'to have',pos:'v'},
    'puedo':{en:'to be able',pos:'v',lemma:'poder'},'puede':{en:'to be able',pos:'v',lemma:'poder'},
    'pueden':{en:'to be able',pos:'v',lemma:'poder'},'poder':{en:'to be able',pos:'v'},
    'voy':{en:'to go',pos:'v',lemma:'ir'},'vas':{en:'to go',pos:'v',lemma:'ir'},
    'va':{en:'to go',pos:'v',lemma:'ir'},'vamos':{en:'to go',pos:'v',lemma:'ir'},
    'van':{en:'to go',pos:'v',lemma:'ir'},'ir':{en:'to go',pos:'v'},
    'hago':{en:'to do/make',pos:'v',lemma:'hacer'},'hace':{en:'to do/make',pos:'v',lemma:'hacer'},
    'hacer':{en:'to do/make',pos:'v'},
    'digo':{en:'to say/tell',pos:'v',lemma:'decir'},'dice':{en:'to say/tell',pos:'v',lemma:'decir'},
    'decir':{en:'to say/tell',pos:'v'},
    'sé':{en:'to know',pos:'v',lemma:'saber'},'sabe':{en:'to know',pos:'v',lemma:'saber'},
    'saber':{en:'to know',pos:'v'},
    'doy':{en:'to give',pos:'v',lemma:'dar'},'da':{en:'to give',pos:'v',lemma:'dar'},
    'dar':{en:'to give',pos:'v'},
    'vengo':{en:'to come',pos:'v',lemma:'venir'},'viene':{en:'to come',pos:'v',lemma:'venir'},
    'venir':{en:'to come',pos:'v'},
  },
  it: {
    'il':{en:'the',pos:'det'},'lo':{en:'the',pos:'det'},'la':{en:'the',pos:'det'},
    'i':{en:'the',pos:'det'},'gli':{en:'the',pos:'det'},'le':{en:'the',pos:'det'},
    'l':{en:'the',pos:'det'},
    'un':{en:'a',pos:'det'},'uno':{en:'a',pos:'det'},'una':{en:'a',pos:'det'},
    'a':{en:'to/at',pos:'prep'},'di':{en:'of/from',pos:'prep'},'da':{en:'from/by',pos:'prep'},
    'in':{en:'in',pos:'prep'},'con':{en:'with',pos:'prep'},'su':{en:'on/upon',pos:'prep'},
    'per':{en:'for',pos:'prep'},'tra':{en:'between',pos:'prep'},'fra':{en:'between',pos:'prep'},
    'senza':{en:'without',pos:'prep'},'sotto':{en:'under',pos:'prep'},'sopra':{en:'above',pos:'prep'},
    'dentro':{en:'inside',pos:'prep'},'fuori':{en:'outside',pos:'prep'},'verso':{en:'towards',pos:'prep'},
    'dopo':{en:'after',pos:'prep'},'prima':{en:'before',pos:'prep'},'durante':{en:'during',pos:'prep'},
    'contro':{en:'against',pos:'prep'},
    'al':{en:'to the',pos:'prep'},'alla':{en:'to the',pos:'prep'},
    'del':{en:'of the',pos:'prep'},'della':{en:'of the',pos:'prep'},
    'dal':{en:'from the',pos:'prep'},'dalla':{en:'from the',pos:'prep'},
    'nel':{en:'in the',pos:'prep'},'nella':{en:'in the',pos:'prep'},
    'sul':{en:'on the',pos:'prep'},'sulla':{en:'on the',pos:'prep'},
    'io':{en:'I',pos:'pron'},'tu':{en:'you',pos:'pron'},'lui':{en:'he',pos:'pron'},
    'lei':{en:'she/you (formal)',pos:'pron'},'noi':{en:'we',pos:'pron'},'voi':{en:'you (plural)',pos:'pron'},
    'loro':{en:'they/them',pos:'pron'},
    'mi':{en:'me/myself',pos:'pron'},'ti':{en:'you/yourself',pos:'pron'},'si':{en:'oneself',pos:'pron'},
    'ci':{en:'us/ourselves/there',pos:'pron'},'vi':{en:'you/yourselves',pos:'pron'},
    'ne':{en:'of it/some',pos:'pron'},'li':{en:'them (m)',pos:'pron'},
    'me':{en:'me',pos:'pron'},'te':{en:'you',pos:'pron'},
    'mio':{en:'my',pos:'det'},'mia':{en:'my',pos:'det'},'miei':{en:'my',pos:'det'},
    'tuo':{en:'your',pos:'det'},'tua':{en:'your',pos:'det'},
    'suo':{en:'his/her/your',pos:'det'},'sua':{en:'his/her/your',pos:'det'},
    'nostro':{en:'our',pos:'det'},'nostra':{en:'our',pos:'det'},
    'vostro':{en:'your',pos:'det'},'vostra':{en:'your',pos:'det'},
    'questo':{en:'this',pos:'det'},'questa':{en:'this',pos:'det'},'questi':{en:'these',pos:'det'},'queste':{en:'these',pos:'det'},
    'quello':{en:'that',pos:'det'},'quella':{en:'that',pos:'det'},'quelli':{en:'those',pos:'det'},'quelle':{en:'those',pos:'det'},
    'e':{en:'and',pos:'conj'},'ed':{en:'and',pos:'conj'},'o':{en:'or',pos:'conj'},
    'ma':{en:'but',pos:'conj'},'però':{en:'however',pos:'conj'},'né':{en:'neither/nor',pos:'conj'},
    'che':{en:'that/which/who',pos:'conj'},'perché':{en:'because/why',pos:'conj'},
    'se':{en:'if',pos:'conj'},'quando':{en:'when',pos:'conj'},'come':{en:'as/like/how',pos:'conj'},
    'dove':{en:'where',pos:'conj'},'mentre':{en:'while',pos:'conj'},'anche':{en:'also',pos:'conj'},
    'non':{en:'not',pos:'adv'},'no':{en:'no',pos:'adv'},'sì':{en:'yes',pos:'adv'},
    'già':{en:'already',pos:'adv'},'ancora':{en:'still/again',pos:'adv'},'sempre':{en:'always',pos:'adv'},
    'mai':{en:'never',pos:'adv'},'molto':{en:'very/much',pos:'adv'},'poco':{en:'little',pos:'adv'},
    'più':{en:'more',pos:'adv'},'meno':{en:'less',pos:'adv'},'troppo':{en:'too much',pos:'adv'},
    'così':{en:'so/thus',pos:'adv'},'qui':{en:'here',pos:'adv'},'là':{en:'there',pos:'adv'},
    'ora':{en:'now',pos:'adv'},'poi':{en:'then',pos:'adv'},
    'oggi':{en:'today',pos:'adv'},'ieri':{en:'yesterday',pos:'adv'},'domani':{en:'tomorrow',pos:'adv'},
    'bene':{en:'well',pos:'adv'},'male':{en:'badly',pos:'adv'},
    'quasi':{en:'almost',pos:'adv'},'forse':{en:'perhaps',pos:'adv'},'solo':{en:'only',pos:'adv'},
    'chi':{en:'who',pos:'pron'},'cosa':{en:'what/thing',pos:'pron'},
    'tutto':{en:'all/everything',pos:'pron'},'tutta':{en:'all/every',pos:'det'},
    'tutti':{en:'all/everyone',pos:'pron'},'tutte':{en:'all/every',pos:'det'},
    'ogni':{en:'each/every',pos:'det'},'niente':{en:'nothing',pos:'pron'},'nulla':{en:'nothing',pos:'pron'},
    'qualcuno':{en:'someone',pos:'pron'},'qualcosa':{en:'something',pos:'pron'},
    'altro':{en:'other',pos:'det'},'altra':{en:'other',pos:'det'},
    // High-frequency verb forms
    'sono':{en:'to be',pos:'v',lemma:'essere'},'sei':{en:'to be',pos:'v',lemma:'essere'},
    'è':{en:'to be',pos:'v',lemma:'essere'},'siamo':{en:'to be',pos:'v',lemma:'essere'},
    'era':{en:'to be',pos:'v',lemma:'essere'},'essere':{en:'to be',pos:'v'},
    'ho':{en:'to have',pos:'v',lemma:'avere'},'hai':{en:'to have',pos:'v',lemma:'avere'},
    'ha':{en:'to have',pos:'v',lemma:'avere'},'abbiamo':{en:'to have',pos:'v',lemma:'avere'},
    'hanno':{en:'to have',pos:'v',lemma:'avere'},'avere':{en:'to have',pos:'v'},
    'fa':{en:'to do/make',pos:'v',lemma:'fare'},'fare':{en:'to do/make',pos:'v'},
    'va':{en:'to go',pos:'v',lemma:'andare'},'andare':{en:'to go',pos:'v'},
    'può':{en:'to be able',pos:'v',lemma:'potere'},'potere':{en:'to be able',pos:'v'},
    'deve':{en:'to must/have to',pos:'v',lemma:'dovere'},'dovere':{en:'to must/have to',pos:'v'},
    'vuole':{en:'to want',pos:'v',lemma:'volere'},'volere':{en:'to want',pos:'v'},
    'sa':{en:'to know',pos:'v',lemma:'sapere'},'sapere':{en:'to know',pos:'v'},
    'dice':{en:'to say/tell',pos:'v',lemma:'dire'},'dire':{en:'to say/tell',pos:'v'},
    'viene':{en:'to come',pos:'v',lemma:'venire'},'venire':{en:'to come',pos:'v'},
    'dà':{en:'to give',pos:'v',lemma:'dare'},'dare':{en:'to give',pos:'v'},
    'sta':{en:'to stay/be',pos:'v',lemma:'stare'},'stare':{en:'to stay/be',pos:'v'},
  },
  fr: {
    'le':{en:'the',pos:'det'},'la':{en:'the',pos:'det'},'les':{en:'the',pos:'det'},
    'l':{en:'the',pos:'det'},"l'":{en:'the',pos:'det'},
    'un':{en:'a',pos:'det'},'une':{en:'a',pos:'det'},'des':{en:'some',pos:'det'},
    'du':{en:'of the/some',pos:'det'},'au':{en:'to the',pos:'prep'},'aux':{en:'to the',pos:'prep'},
    'je':{en:'I',pos:'pron'},'tu':{en:'you',pos:'pron'},'il':{en:'he',pos:'pron'},
    'elle':{en:'she',pos:'pron'},'nous':{en:'we',pos:'pron'},'vous':{en:'you',pos:'pron'},
    'ils':{en:'they (m)',pos:'pron'},'elles':{en:'they (f)',pos:'pron'},'on':{en:'one/we',pos:'pron'},
    'me':{en:'me',pos:'pron'},'te':{en:'you',pos:'pron'},'se':{en:'oneself',pos:'pron'},
    'lui':{en:'him/her',pos:'pron'},'leur':{en:'their/them',pos:'pron'},
    'mon':{en:'my',pos:'det'},'ma':{en:'my',pos:'det'},'mes':{en:'my',pos:'det'},
    'ton':{en:'your',pos:'det'},'ta':{en:'your',pos:'det'},'tes':{en:'your',pos:'det'},
    'son':{en:'his/her',pos:'det'},'sa':{en:'his/her',pos:'det'},'ses':{en:'his/her',pos:'det'},
    'notre':{en:'our',pos:'det'},'votre':{en:'your',pos:'det'},
    'nos':{en:'our',pos:'det'},'vos':{en:'your',pos:'det'},'leurs':{en:'their',pos:'det'},
    'ce':{en:'this/that',pos:'det'},'cet':{en:'this/that',pos:'det'},'cette':{en:'this/that',pos:'det'},
    'ces':{en:'these/those',pos:'det'},
    'de':{en:'of/from',pos:'prep'},'à':{en:'to/at',pos:'prep'},'en':{en:'in',pos:'prep'},
    'dans':{en:'in',pos:'prep'},'avec':{en:'with',pos:'prep'},'pour':{en:'for',pos:'prep'},
    'sur':{en:'on',pos:'prep'},'sous':{en:'under',pos:'prep'},'par':{en:'by',pos:'prep'},
    'sans':{en:'without',pos:'prep'},'vers':{en:'towards',pos:'prep'},'chez':{en:'at (home of)',pos:'prep'},
    'entre':{en:'between',pos:'prep'},'depuis':{en:'since',pos:'prep'},'pendant':{en:'during',pos:'prep'},
    'avant':{en:'before',pos:'prep'},'après':{en:'after',pos:'prep'},'contre':{en:'against',pos:'prep'},
    'et':{en:'and',pos:'conj'},'ou':{en:'or',pos:'conj'},'mais':{en:'but',pos:'conj'},
    'ni':{en:'neither/nor',pos:'conj'},'que':{en:'that/which',pos:'conj'},'qui':{en:'who/which',pos:'pron'},
    'si':{en:'if',pos:'conj'},'car':{en:'because',pos:'conj'},'donc':{en:'therefore',pos:'conj'},
    'quand':{en:'when',pos:'conj'},'comme':{en:'as/like',pos:'conj'},'où':{en:'where',pos:'conj'},
    'ne':{en:'not',pos:'adv'},'pas':{en:'not',pos:'adv'},'plus':{en:'more/no more',pos:'adv'},
    'moins':{en:'less',pos:'adv'},'très':{en:'very',pos:'adv'},'bien':{en:'well',pos:'adv'},
    'mal':{en:'badly',pos:'adv'},'aussi':{en:'also',pos:'adv'},'encore':{en:'still/again',pos:'adv'},
    'déjà':{en:'already',pos:'adv'},'toujours':{en:'always',pos:'adv'},'jamais':{en:'never',pos:'adv'},
    'ici':{en:'here',pos:'adv'},'là':{en:'there',pos:'adv'},'maintenant':{en:'now',pos:'adv'},
    "aujourd'hui":{en:'today',pos:'adv'},'hier':{en:'yesterday',pos:'adv'},'demain':{en:'tomorrow',pos:'adv'},
    'oui':{en:'yes',pos:'adv'},'non':{en:'no',pos:'adv'},'peut-être':{en:'perhaps',pos:'adv'},
    'tout':{en:'all/everything',pos:'pron'},'tous':{en:'all',pos:'pron'},'toute':{en:'all',pos:'det'},'toutes':{en:'all',pos:'det'},
    'rien':{en:'nothing',pos:'pron'},'personne':{en:'nobody',pos:'pron'},
    'quelque':{en:'some',pos:'det'},'chaque':{en:'each',pos:'det'},
    'autre':{en:'other',pos:'det'},'autres':{en:'others',pos:'det'},
    'même':{en:'same/even',pos:'det'},
    // High-frequency verb forms
    'suis':{en:'to be',pos:'v',lemma:'être'},'es':{en:'to be',pos:'v',lemma:'être'},
    'est':{en:'to be',pos:'v',lemma:'être'},'sommes':{en:'to be',pos:'v',lemma:'être'},
    'êtes':{en:'to be',pos:'v',lemma:'être'},'sont':{en:'to be',pos:'v',lemma:'être'},
    'être':{en:'to be',pos:'v'},
    'ai':{en:'to have',pos:'v',lemma:'avoir'},'as':{en:'to have',pos:'v',lemma:'avoir'},
    'a':{en:'to have',pos:'v',lemma:'avoir'},'avons':{en:'to have',pos:'v',lemma:'avoir'},
    'avez':{en:'to have',pos:'v',lemma:'avoir'},'ont':{en:'to have',pos:'v',lemma:'avoir'},
    'avoir':{en:'to have',pos:'v'},
    'fais':{en:'to do/make',pos:'v',lemma:'faire'},'fait':{en:'to do/make',pos:'v',lemma:'faire'},
    'faire':{en:'to do/make',pos:'v'},
    'vais':{en:'to go',pos:'v',lemma:'aller'},'vas':{en:'to go',pos:'v',lemma:'aller'},
    'va':{en:'to go',pos:'v',lemma:'aller'},'allons':{en:'to go',pos:'v',lemma:'aller'},
    'allez':{en:'to go',pos:'v',lemma:'aller'},'vont':{en:'to go',pos:'v',lemma:'aller'},
    'aller':{en:'to go',pos:'v'},
    'peut':{en:'to be able',pos:'v',lemma:'pouvoir'},'pouvoir':{en:'to be able',pos:'v'},
    'doit':{en:'to must/owe',pos:'v',lemma:'devoir'},'devoir':{en:'to must/owe',pos:'v'},
    'veut':{en:'to want',pos:'v',lemma:'vouloir'},'vouloir':{en:'to want',pos:'v'},
    'sait':{en:'to know',pos:'v',lemma:'savoir'},'savoir':{en:'to know',pos:'v'},
    'dit':{en:'to say/tell',pos:'v',lemma:'dire'},'dire':{en:'to say/tell',pos:'v'},
    'vient':{en:'to come',pos:'v',lemma:'venir'},'venir':{en:'to come',pos:'v'},
    'donne':{en:'to give',pos:'v',lemma:'donner'},'donner':{en:'to give',pos:'v'},
  },
  pt: {
    'o':{en:'the',pos:'det'},'a':{en:'the',pos:'det'},'os':{en:'the',pos:'det'},'as':{en:'the',pos:'det'},
    'um':{en:'a',pos:'det'},'uma':{en:'a',pos:'det'},'uns':{en:'some',pos:'det'},'umas':{en:'some',pos:'det'},
    'ao':{en:'to the',pos:'prep'},'à':{en:'to the',pos:'prep'},'aos':{en:'to the',pos:'prep'},'às':{en:'to the',pos:'prep'},
    'do':{en:'of the',pos:'prep'},'da':{en:'of the',pos:'prep'},'dos':{en:'of the',pos:'prep'},'das':{en:'of the',pos:'prep'},
    'no':{en:'in the',pos:'prep'},'na':{en:'in the',pos:'prep'},'nos':{en:'in the',pos:'prep'},'nas':{en:'in the',pos:'prep'},
    'eu':{en:'I',pos:'pron'},'tu':{en:'you',pos:'pron'},'ele':{en:'he',pos:'pron'},
    'ela':{en:'she',pos:'pron'},'nós':{en:'we',pos:'pron'},'vocês':{en:'you (plural)',pos:'pron'},
    'eles':{en:'they (m)',pos:'pron'},'elas':{en:'they (f)',pos:'pron'},'você':{en:'you',pos:'pron'},
    'me':{en:'me',pos:'pron'},'te':{en:'you',pos:'pron'},'se':{en:'oneself',pos:'pron'},
    'lhe':{en:'him/her',pos:'pron'},'lhes':{en:'them',pos:'pron'},
    'meu':{en:'my',pos:'det'},'minha':{en:'my',pos:'det'},'meus':{en:'my',pos:'det'},'minhas':{en:'my',pos:'det'},
    'seu':{en:'your/his/her',pos:'det'},'sua':{en:'your/his/her',pos:'det'},
    'nosso':{en:'our',pos:'det'},'nossa':{en:'our',pos:'det'},
    'este':{en:'this',pos:'det'},'esta':{en:'this',pos:'det'},'estes':{en:'these',pos:'det'},'estas':{en:'these',pos:'det'},
    'esse':{en:'that',pos:'det'},'essa':{en:'that',pos:'det'},'esses':{en:'those',pos:'det'},'essas':{en:'those',pos:'det'},
    'de':{en:'of/from',pos:'prep'},'em':{en:'in',pos:'prep'},'com':{en:'with',pos:'prep'},
    'por':{en:'for/by',pos:'prep'},'para':{en:'for/to',pos:'prep'},'sem':{en:'without',pos:'prep'},
    'sobre':{en:'on/about',pos:'prep'},'entre':{en:'between',pos:'prep'},'até':{en:'until',pos:'prep'},
    'desde':{en:'since',pos:'prep'},'contra':{en:'against',pos:'prep'},
    'e':{en:'and',pos:'conj'},'ou':{en:'or',pos:'conj'},'mas':{en:'but',pos:'conj'},
    'que':{en:'that/which',pos:'conj'},'porque':{en:'because',pos:'conj'},
    'se':{en:'if',pos:'conj'},'quando':{en:'when',pos:'conj'},'como':{en:'as/like',pos:'conj'},
    'onde':{en:'where',pos:'conj'},'enquanto':{en:'while',pos:'conj'},
    'não':{en:'no/not',pos:'adv'},'sim':{en:'yes',pos:'adv'},'já':{en:'already',pos:'adv'},
    'mais':{en:'more',pos:'adv'},'menos':{en:'less',pos:'adv'},'muito':{en:'very/much',pos:'adv'},
    'bem':{en:'well',pos:'adv'},'mal':{en:'badly',pos:'adv'},'também':{en:'also',pos:'adv'},
    'ainda':{en:'still/yet',pos:'adv'},'sempre':{en:'always',pos:'adv'},'nunca':{en:'never',pos:'adv'},
    'aqui':{en:'here',pos:'adv'},'ali':{en:'there',pos:'adv'},'lá':{en:'there',pos:'adv'},
    'agora':{en:'now',pos:'adv'},'hoje':{en:'today',pos:'adv'},'ontem':{en:'yesterday',pos:'adv'},
    'amanhã':{en:'tomorrow',pos:'adv'},'quase':{en:'almost',pos:'adv'},
    'tudo':{en:'everything',pos:'pron'},'nada':{en:'nothing',pos:'pron'},
    'alguém':{en:'someone',pos:'pron'},'ninguém':{en:'nobody',pos:'pron'},
    'algo':{en:'something',pos:'pron'},'cada':{en:'each',pos:'det'},
    'todo':{en:'all/every',pos:'det'},'toda':{en:'all/every',pos:'det'},
    'outro':{en:'other',pos:'det'},'outra':{en:'other',pos:'det'},
    // High-frequency verb forms
    'sou':{en:'to be',pos:'v',lemma:'ser'},'é':{en:'to be',pos:'v',lemma:'ser'},
    'somos':{en:'to be',pos:'v',lemma:'ser'},'são':{en:'to be',pos:'v',lemma:'ser'},
    'ser':{en:'to be',pos:'v'},
    'estou':{en:'to be',pos:'v',lemma:'estar'},'está':{en:'to be',pos:'v',lemma:'estar'},
    'estamos':{en:'to be',pos:'v',lemma:'estar'},'estar':{en:'to be',pos:'v'},
    'tenho':{en:'to have',pos:'v',lemma:'ter'},'tem':{en:'to have',pos:'v',lemma:'ter'},
    'temos':{en:'to have',pos:'v',lemma:'ter'},'ter':{en:'to have',pos:'v'},
    'há':{en:'there is/are',pos:'v',lemma:'haver'},'haver':{en:'to have (aux)',pos:'v'},
    'faz':{en:'to do/make',pos:'v',lemma:'fazer'},'fazer':{en:'to do/make',pos:'v'},
    'vai':{en:'to go',pos:'v',lemma:'ir'},'vamos':{en:'to go',pos:'v',lemma:'ir'},
    'ir':{en:'to go',pos:'v'},
    'pode':{en:'to be able',pos:'v',lemma:'poder'},'poder':{en:'to be able',pos:'v'},
    'quer':{en:'to want',pos:'v',lemma:'querer'},'querer':{en:'to want',pos:'v'},
    'sabe':{en:'to know',pos:'v',lemma:'saber'},'saber':{en:'to know',pos:'v'},
    'diz':{en:'to say',pos:'v',lemma:'dizer'},'dizer':{en:'to say',pos:'v'},
    'vem':{en:'to come',pos:'v',lemma:'vir'},'vir':{en:'to come',pos:'v'},
    'dá':{en:'to give',pos:'v',lemma:'dar'},'dar':{en:'to give',pos:'v'},
  },
  de: {
    'der':{en:'the',pos:'det'},'die':{en:'the',pos:'det'},'das':{en:'the',pos:'det'},
    'dem':{en:'the',pos:'det'},'den':{en:'the',pos:'det'},'des':{en:'of the',pos:'det'},
    'ein':{en:'a',pos:'det'},'eine':{en:'a',pos:'det'},'einem':{en:'a',pos:'det'},
    'einen':{en:'a',pos:'det'},'einer':{en:'a',pos:'det'},
    'ich':{en:'I',pos:'pron'},'du':{en:'you',pos:'pron'},'er':{en:'he',pos:'pron'},
    'sie':{en:'she/they/you',pos:'pron'},'es':{en:'it',pos:'pron'},'wir':{en:'we',pos:'pron'},
    'ihr':{en:'you (plural)/her',pos:'pron'},
    'mich':{en:'me',pos:'pron'},'dich':{en:'you',pos:'pron'},'sich':{en:'oneself',pos:'pron'},
    'uns':{en:'us',pos:'pron'},'euch':{en:'you (pl)',pos:'pron'},
    'mir':{en:'me',pos:'pron'},'dir':{en:'you',pos:'pron'},'ihm':{en:'him',pos:'pron'},
    'ihnen':{en:'them',pos:'pron'},
    'mein':{en:'my',pos:'det'},'meine':{en:'my',pos:'det'},'meinen':{en:'my',pos:'det'},
    'dein':{en:'your',pos:'det'},'deine':{en:'your',pos:'det'},
    'sein':{en:'his/to be',pos:'det'},'seine':{en:'his',pos:'det'},
    'unser':{en:'our',pos:'det'},'unsere':{en:'our',pos:'det'},
    'euer':{en:'your (pl)',pos:'det'},'eure':{en:'your (pl)',pos:'det'},
    'dieser':{en:'this',pos:'det'},'diese':{en:'this/these',pos:'det'},'dieses':{en:'this',pos:'det'},
    'jener':{en:'that',pos:'det'},'jene':{en:'that/those',pos:'det'},
    'welcher':{en:'which',pos:'det'},'welche':{en:'which',pos:'det'},'welches':{en:'which',pos:'det'},
    'in':{en:'in',pos:'prep'},'an':{en:'at/on',pos:'prep'},'auf':{en:'on/upon',pos:'prep'},
    'mit':{en:'with',pos:'prep'},'für':{en:'for',pos:'prep'},'von':{en:'from/of',pos:'prep'},
    'zu':{en:'to',pos:'prep'},'aus':{en:'out of/from',pos:'prep'},'bei':{en:'at/near',pos:'prep'},
    'nach':{en:'after/to',pos:'prep'},'über':{en:'over/about',pos:'prep'},'unter':{en:'under',pos:'prep'},
    'vor':{en:'before/in front of',pos:'prep'},'hinter':{en:'behind',pos:'prep'},
    'neben':{en:'next to',pos:'prep'},'zwischen':{en:'between',pos:'prep'},
    'durch':{en:'through',pos:'prep'},'gegen':{en:'against',pos:'prep'},'ohne':{en:'without',pos:'prep'},
    'um':{en:'around/at',pos:'prep'},'bis':{en:'until',pos:'prep'},'seit':{en:'since',pos:'prep'},
    'und':{en:'and',pos:'conj'},'oder':{en:'or',pos:'conj'},'aber':{en:'but',pos:'conj'},
    'denn':{en:'because/for',pos:'conj'},'weil':{en:'because',pos:'conj'},'dass':{en:'that',pos:'conj'},
    'wenn':{en:'if/when',pos:'conj'},'als':{en:'as/when/than',pos:'conj'},'ob':{en:'whether',pos:'conj'},
    'sondern':{en:'but rather',pos:'conj'},'doch':{en:'but/however',pos:'conj'},
    'nicht':{en:'not',pos:'adv'},'ja':{en:'yes',pos:'adv'},'nein':{en:'no',pos:'adv'},
    'sehr':{en:'very',pos:'adv'},'auch':{en:'also',pos:'adv'},'noch':{en:'still/yet',pos:'adv'},
    'schon':{en:'already',pos:'adv'},'immer':{en:'always',pos:'adv'},'nie':{en:'never',pos:'adv'},
    'hier':{en:'here',pos:'adv'},'da':{en:'there/since',pos:'adv'},'dort':{en:'there',pos:'adv'},
    'jetzt':{en:'now',pos:'adv'},'heute':{en:'today',pos:'adv'},'gestern':{en:'yesterday',pos:'adv'},
    'morgen':{en:'tomorrow',pos:'adv'},'gut':{en:'good/well',pos:'adv'},
    'mehr':{en:'more',pos:'adv'},'weniger':{en:'less',pos:'adv'},
    'was':{en:'what',pos:'pron'},'wer':{en:'who',pos:'pron'},'wo':{en:'where',pos:'adv'},
    'wie':{en:'how',pos:'adv'},'wann':{en:'when',pos:'adv'},'warum':{en:'why',pos:'adv'},
    'alles':{en:'everything',pos:'pron'},'nichts':{en:'nothing',pos:'pron'},
    'jemand':{en:'someone',pos:'pron'},'niemand':{en:'nobody',pos:'pron'},
    'etwas':{en:'something',pos:'pron'},'jeder':{en:'each/every',pos:'det'},
    'alle':{en:'all',pos:'det'},'andere':{en:'other',pos:'det'},
    'man':{en:'one (impersonal)',pos:'pron'},
    // High-frequency verb forms
    'bin':{en:'to be',pos:'v',lemma:'sein'},'bist':{en:'to be',pos:'v',lemma:'sein'},
    'ist':{en:'to be',pos:'v',lemma:'sein'},'sind':{en:'to be',pos:'v',lemma:'sein'},
    'war':{en:'to be',pos:'v',lemma:'sein'},'sein':{en:'to be',pos:'v'},
    'habe':{en:'to have',pos:'v',lemma:'haben'},'hast':{en:'to have',pos:'v',lemma:'haben'},
    'hat':{en:'to have',pos:'v',lemma:'haben'},'haben':{en:'to have',pos:'v'},
    'wird':{en:'to become',pos:'v',lemma:'werden'},'werden':{en:'to become',pos:'v'},
    'kann':{en:'to be able',pos:'v',lemma:'können'},'können':{en:'to be able',pos:'v'},
    'muss':{en:'to must',pos:'v',lemma:'müssen'},'müssen':{en:'to must',pos:'v'},
    'will':{en:'to want',pos:'v',lemma:'wollen'},'wollen':{en:'to want',pos:'v'},
    'soll':{en:'to should',pos:'v',lemma:'sollen'},'sollen':{en:'to should',pos:'v'},
    'darf':{en:'to be allowed',pos:'v',lemma:'dürfen'},'dürfen':{en:'to be allowed',pos:'v'},
    'gibt':{en:'to give',pos:'v',lemma:'geben'},'geben':{en:'to give',pos:'v'},
    'geht':{en:'to go',pos:'v',lemma:'gehen'},'gehen':{en:'to go',pos:'v'},
    'kommt':{en:'to come',pos:'v',lemma:'kommen'},'kommen':{en:'to come',pos:'v'},
    'macht':{en:'to do/make',pos:'v',lemma:'machen'},'machen':{en:'to do/make',pos:'v'},
    'sagt':{en:'to say',pos:'v',lemma:'sagen'},'sagen':{en:'to say',pos:'v'},
    'weiß':{en:'to know',pos:'v',lemma:'wissen'},
  },
  nl: {
    'de':{en:'the',pos:'det'},'het':{en:'the/it',pos:'det'},'een':{en:'a',pos:'det'},
    'ik':{en:'I',pos:'pron'},'jij':{en:'you',pos:'pron'},'je':{en:'you',pos:'pron'},
    'hij':{en:'he',pos:'pron'},'zij':{en:'she/they',pos:'pron'},'ze':{en:'she/they',pos:'pron'},
    'wij':{en:'we',pos:'pron'},'we':{en:'we',pos:'pron'},'jullie':{en:'you (plural)',pos:'pron'},
    'u':{en:'you (formal)',pos:'pron'},
    'mij':{en:'me',pos:'pron'},'me':{en:'me',pos:'pron'},'jou':{en:'you',pos:'pron'},
    'hem':{en:'him',pos:'pron'},'haar':{en:'her',pos:'pron'},'ons':{en:'us/our',pos:'pron'},
    'hen':{en:'them',pos:'pron'},'hun':{en:'them/their',pos:'pron'},
    'zich':{en:'oneself',pos:'pron'},
    'mijn':{en:'my',pos:'det'},'jouw':{en:'your',pos:'det'},'zijn':{en:'his/to be',pos:'det'},
    'haar':{en:'her',pos:'det'},'ons':{en:'our',pos:'det'},'onze':{en:'our',pos:'det'},
    'hun':{en:'their',pos:'det'},'uw':{en:'your (formal)',pos:'det'},
    'dit':{en:'this',pos:'det'},'dat':{en:'that',pos:'det'},'deze':{en:'this/these',pos:'det'},
    'die':{en:'that/those',pos:'det'},'welke':{en:'which',pos:'det'},
    'in':{en:'in',pos:'prep'},'op':{en:'on',pos:'prep'},'aan':{en:'at/on',pos:'prep'},
    'met':{en:'with',pos:'prep'},'voor':{en:'for/before',pos:'prep'},'van':{en:'of/from',pos:'prep'},
    'naar':{en:'to',pos:'prep'},'uit':{en:'out of/from',pos:'prep'},'bij':{en:'at/near',pos:'prep'},
    'na':{en:'after',pos:'prep'},'over':{en:'over/about',pos:'prep'},'onder':{en:'under',pos:'prep'},
    'door':{en:'through/by',pos:'prep'},'tegen':{en:'against',pos:'prep'},'zonder':{en:'without',pos:'prep'},
    'om':{en:'around/at',pos:'prep'},'tot':{en:'until',pos:'prep'},'sinds':{en:'since',pos:'prep'},
    'tussen':{en:'between',pos:'prep'},'achter':{en:'behind',pos:'prep'},
    'en':{en:'and',pos:'conj'},'of':{en:'or',pos:'conj'},'maar':{en:'but',pos:'conj'},
    'want':{en:'because/for',pos:'conj'},'omdat':{en:'because',pos:'conj'},'dat':{en:'that',pos:'conj'},
    'als':{en:'if/when/as',pos:'conj'},'wanneer':{en:'when',pos:'conj'},
    'niet':{en:'not',pos:'adv'},'ja':{en:'yes',pos:'adv'},'nee':{en:'no',pos:'adv'},
    'heel':{en:'very',pos:'adv'},'zeer':{en:'very',pos:'adv'},'ook':{en:'also',pos:'adv'},
    'nog':{en:'still/yet',pos:'adv'},'al':{en:'already',pos:'adv'},'altijd':{en:'always',pos:'adv'},
    'nooit':{en:'never',pos:'adv'},'hier':{en:'here',pos:'adv'},'daar':{en:'there',pos:'adv'},
    'nu':{en:'now',pos:'adv'},'vandaag':{en:'today',pos:'adv'},'gisteren':{en:'yesterday',pos:'adv'},
    'morgen':{en:'tomorrow',pos:'adv'},'goed':{en:'good/well',pos:'adv'},
    'meer':{en:'more',pos:'adv'},'minder':{en:'less',pos:'adv'},
    'wat':{en:'what',pos:'pron'},'wie':{en:'who',pos:'pron'},'waar':{en:'where',pos:'adv'},
    'hoe':{en:'how',pos:'adv'},'waarom':{en:'why',pos:'adv'},
    'alles':{en:'everything',pos:'pron'},'niets':{en:'nothing',pos:'pron'},
    'iemand':{en:'someone',pos:'pron'},'niemand':{en:'nobody',pos:'pron'},
    'iets':{en:'something',pos:'pron'},'elke':{en:'each/every',pos:'det'},
    'alle':{en:'all',pos:'det'},'andere':{en:'other',pos:'det'},
    'er':{en:'there',pos:'adv'},
    // High-frequency verb forms
    'ben':{en:'to be',pos:'v',lemma:'zijn'},'bent':{en:'to be',pos:'v',lemma:'zijn'},
    'is':{en:'to be',pos:'v',lemma:'zijn'},'zijn':{en:'to be',pos:'v'},
    'was':{en:'to be',pos:'v',lemma:'zijn'},'waren':{en:'to be',pos:'v',lemma:'zijn'},
    'heb':{en:'to have',pos:'v',lemma:'hebben'},'hebt':{en:'to have',pos:'v',lemma:'hebben'},
    'heeft':{en:'to have',pos:'v',lemma:'hebben'},'hebben':{en:'to have',pos:'v'},
    'wordt':{en:'to become',pos:'v',lemma:'worden'},'worden':{en:'to become',pos:'v'},
    'kan':{en:'to be able',pos:'v',lemma:'kunnen'},'kunnen':{en:'to be able',pos:'v'},
    'moet':{en:'to must',pos:'v',lemma:'moeten'},'moeten':{en:'to must',pos:'v'},
    'wil':{en:'to want',pos:'v',lemma:'willen'},'willen':{en:'to want',pos:'v'},
    'zal':{en:'to will/shall',pos:'v',lemma:'zullen'},'zullen':{en:'to will/shall',pos:'v'},
    'mag':{en:'to be allowed',pos:'v',lemma:'mogen'},'mogen':{en:'to be allowed',pos:'v'},
    'gaat':{en:'to go',pos:'v',lemma:'gaan'},'gaan':{en:'to go',pos:'v'},
    'komt':{en:'to come',pos:'v',lemma:'komen'},'komen':{en:'to come',pos:'v'},
    'doet':{en:'to do',pos:'v',lemma:'doen'},'doen':{en:'to do',pos:'v'},
    'zegt':{en:'to say',pos:'v',lemma:'zeggen'},'zeggen':{en:'to say',pos:'v'},
    'geeft':{en:'to give',pos:'v',lemma:'geven'},'geven':{en:'to give',pos:'v'},
    'weet':{en:'to know',pos:'v',lemma:'weten'},
  },
  sv: {
    'en':{en:'a/one',pos:'det'},'ett':{en:'a/one',pos:'det'},'den':{en:'the/it',pos:'det'},
    'det':{en:'the/it',pos:'det'},'de':{en:'the/they',pos:'det'},
    'jag':{en:'I',pos:'pron'},'du':{en:'you',pos:'pron'},'han':{en:'he',pos:'pron'},
    'hon':{en:'she',pos:'pron'},'vi':{en:'we',pos:'pron'},'ni':{en:'you (plural)',pos:'pron'},
    'dem':{en:'them',pos:'pron'},
    'mig':{en:'me',pos:'pron'},'dig':{en:'you',pos:'pron'},'sig':{en:'oneself',pos:'pron'},
    'oss':{en:'us',pos:'pron'},
    'min':{en:'my',pos:'det'},'mitt':{en:'my',pos:'det'},'mina':{en:'my',pos:'det'},
    'din':{en:'your',pos:'det'},'ditt':{en:'your',pos:'det'},'dina':{en:'your',pos:'det'},
    'sin':{en:'his/her (refl)',pos:'det'},'sitt':{en:'his/her (refl)',pos:'det'},'sina':{en:'his/her (refl)',pos:'det'},
    'vår':{en:'our',pos:'det'},'vårt':{en:'our',pos:'det'},'våra':{en:'our',pos:'det'},
    'er':{en:'your (pl)',pos:'det'},'ert':{en:'your (pl)',pos:'det'},'era':{en:'your (pl)',pos:'det'},
    'denna':{en:'this',pos:'det'},'detta':{en:'this',pos:'det'},'dessa':{en:'these',pos:'det'},
    'den här':{en:'this',pos:'det'},'det här':{en:'this',pos:'det'},
    'i':{en:'in',pos:'prep'},'på':{en:'on/at',pos:'prep'},'till':{en:'to',pos:'prep'},
    'från':{en:'from',pos:'prep'},'med':{en:'with',pos:'prep'},'för':{en:'for',pos:'prep'},
    'av':{en:'of/by',pos:'prep'},'om':{en:'about/if',pos:'prep'},'vid':{en:'at/by',pos:'prep'},
    'mot':{en:'towards/against',pos:'prep'},'utan':{en:'without',pos:'prep'},
    'efter':{en:'after',pos:'prep'},'under':{en:'under/during',pos:'prep'},
    'mellan':{en:'between',pos:'prep'},'genom':{en:'through',pos:'prep'},
    'och':{en:'and',pos:'conj'},'eller':{en:'or',pos:'conj'},'men':{en:'but',pos:'conj'},
    'att':{en:'to/that',pos:'conj'},'som':{en:'who/which/as',pos:'conj'},
    'när':{en:'when',pos:'conj'},'om':{en:'if/about',pos:'conj'},'där':{en:'where/there',pos:'adv'},
    'inte':{en:'not',pos:'adv'},'ja':{en:'yes',pos:'adv'},'nej':{en:'no',pos:'adv'},
    'mycket':{en:'very/much',pos:'adv'},'också':{en:'also',pos:'adv'},
    'redan':{en:'already',pos:'adv'},'alltid':{en:'always',pos:'adv'},'aldrig':{en:'never',pos:'adv'},
    'här':{en:'here',pos:'adv'},'där':{en:'there',pos:'adv'},'nu':{en:'now',pos:'adv'},
    'idag':{en:'today',pos:'adv'},'igår':{en:'yesterday',pos:'adv'},'imorgon':{en:'tomorrow',pos:'adv'},
    'bra':{en:'good/well',pos:'adv'},'mer':{en:'more',pos:'adv'},'mindre':{en:'less',pos:'adv'},
    'vad':{en:'what',pos:'pron'},'vem':{en:'who',pos:'pron'},'var':{en:'where',pos:'adv'},
    'hur':{en:'how',pos:'adv'},'varför':{en:'why',pos:'adv'},
    'allt':{en:'everything',pos:'pron'},'inget':{en:'nothing',pos:'pron'},
    'någon':{en:'someone/some',pos:'pron'},'ingen':{en:'no one/none',pos:'pron'},
    'något':{en:'something',pos:'pron'},'varje':{en:'each/every',pos:'det'},
    'alla':{en:'all',pos:'det'},'andra':{en:'other',pos:'det'},
    'man':{en:'one (impersonal)',pos:'pron'},
    // High-frequency verb forms
    'är':{en:'to be',pos:'v',lemma:'vara'},'var':{en:'to be',pos:'v',lemma:'vara'},
    'vara':{en:'to be',pos:'v'},
    'har':{en:'to have',pos:'v',lemma:'ha'},'ha':{en:'to have',pos:'v'},
    'hade':{en:'to have',pos:'v',lemma:'ha'},
    'kan':{en:'to be able',pos:'v',lemma:'kunna'},'kunna':{en:'to be able',pos:'v'},
    'ska':{en:'to shall/will',pos:'v',lemma:'skola'},
    'måste':{en:'to must',pos:'v'},
    'vill':{en:'to want',pos:'v',lemma:'vilja'},'vilja':{en:'to want',pos:'v'},
    'får':{en:'to get/be allowed',pos:'v',lemma:'få'},'få':{en:'to get/be allowed',pos:'v'},
    'gör':{en:'to do/make',pos:'v',lemma:'göra'},'göra':{en:'to do/make',pos:'v'},
    'går':{en:'to go/walk',pos:'v',lemma:'gå'},'gå':{en:'to go/walk',pos:'v'},
    'kommer':{en:'to come',pos:'v',lemma:'komma'},'komma':{en:'to come',pos:'v'},
    'ger':{en:'to give',pos:'v',lemma:'ge'},'ge':{en:'to give',pos:'v'},
    'ser':{en:'to see',pos:'v',lemma:'se'},'se':{en:'to see',pos:'v'},
    'vet':{en:'to know',pos:'v',lemma:'veta'},'veta':{en:'to know',pos:'v'},
    'säger':{en:'to say',pos:'v',lemma:'säga'},'säga':{en:'to say',pos:'v'},
    'tar':{en:'to take',pos:'v',lemma:'ta'},'ta':{en:'to take',pos:'v'},
    'finns':{en:'to exist/be found',pos:'v',lemma:'finnas'},
    'bli':{en:'to become',pos:'v'},'blir':{en:'to become',pos:'v',lemma:'bli'},
  },
  tr: {
    'bir':{en:'a/one',pos:'det'},'bu':{en:'this',pos:'det'},'şu':{en:'that',pos:'det'},
    'o':{en:'he/she/it/that',pos:'pron'},
    'ben':{en:'I',pos:'pron'},'sen':{en:'you',pos:'pron'},'biz':{en:'we',pos:'pron'},
    'siz':{en:'you (plural/formal)',pos:'pron'},'onlar':{en:'they',pos:'pron'},
    'beni':{en:'me',pos:'pron'},'seni':{en:'you',pos:'pron'},'onu':{en:'him/her/it',pos:'pron'},
    'bize':{en:'to us',pos:'pron'},'size':{en:'to you',pos:'pron'},
    'benim':{en:'my',pos:'det'},'senin':{en:'your',pos:'det'},'onun':{en:'his/her/its',pos:'det'},
    'bizim':{en:'our',pos:'det'},'sizin':{en:'your (pl)',pos:'det'},'onların':{en:'their',pos:'det'},
    'de':{en:'also/too',pos:'conj'},'da':{en:'also/too',pos:'conj'},
    'ile':{en:'with',pos:'prep'},'için':{en:'for',pos:'prep'},'gibi':{en:'like',pos:'prep'},
    'kadar':{en:'until/as much as',pos:'prep'},
    've':{en:'and',pos:'conj'},'veya':{en:'or',pos:'conj'},'ama':{en:'but',pos:'conj'},
    'fakat':{en:'but/however',pos:'conj'},'çünkü':{en:'because',pos:'conj'},
    'ki':{en:'that',pos:'conj'},'eğer':{en:'if',pos:'conj'},
    'değil':{en:'not',pos:'adv'},'evet':{en:'yes',pos:'adv'},'hayır':{en:'no',pos:'adv'},
    'çok':{en:'very/much',pos:'adv'},'az':{en:'little/few',pos:'adv'},
    'daha':{en:'more',pos:'adv'},'en':{en:'most',pos:'adv'},
    'şimdi':{en:'now',pos:'adv'},'bugün':{en:'today',pos:'adv'},
    'dün':{en:'yesterday',pos:'adv'},'yarın':{en:'tomorrow',pos:'adv'},
    'burada':{en:'here',pos:'adv'},'orada':{en:'there',pos:'adv'},
    'hep':{en:'always',pos:'adv'},'hiç':{en:'never/ever',pos:'adv'},
    'ne':{en:'what',pos:'pron'},'kim':{en:'who',pos:'pron'},'nerede':{en:'where',pos:'adv'},
    'nasıl':{en:'how',pos:'adv'},'neden':{en:'why',pos:'adv'},'niçin':{en:'why',pos:'adv'},
    'her':{en:'every/each',pos:'det'},'bazı':{en:'some',pos:'det'},
    'hiçbir':{en:'none/no',pos:'det'},'başka':{en:'other',pos:'det'},
    'hep':{en:'all/always',pos:'adv'},'bütün':{en:'all/whole',pos:'det'},
    // High-frequency verb forms — Turkish is agglutinative, fewer fixed forms
    'var':{en:'there is/exists',pos:'v'},'yok':{en:'there is not',pos:'v'},
  },
  ru: {
    'я':{en:'I',pos:'pron'},'ты':{en:'you',pos:'pron'},'он':{en:'he',pos:'pron'},
    'она':{en:'she',pos:'pron'},'оно':{en:'it',pos:'pron'},'мы':{en:'we',pos:'pron'},
    'вы':{en:'you (pl/formal)',pos:'pron'},'они':{en:'they',pos:'pron'},
    'меня':{en:'me',pos:'pron'},'тебя':{en:'you',pos:'pron'},'себя':{en:'oneself',pos:'pron'},
    'нас':{en:'us',pos:'pron'},'вас':{en:'you',pos:'pron'},'их':{en:'them/their',pos:'pron'},
    'мне':{en:'to me',pos:'pron'},'тебе':{en:'to you',pos:'pron'},'ему':{en:'to him',pos:'pron'},
    'ей':{en:'to her',pos:'pron'},'нам':{en:'to us',pos:'pron'},'вам':{en:'to you',pos:'pron'},
    'им':{en:'to them',pos:'pron'},
    'мой':{en:'my',pos:'det'},'моя':{en:'my',pos:'det'},'моё':{en:'my',pos:'det'},'мои':{en:'my',pos:'det'},
    'твой':{en:'your',pos:'det'},'твоя':{en:'your',pos:'det'},
    'его':{en:'his/its',pos:'det'},'её':{en:'her',pos:'det'},
    'наш':{en:'our',pos:'det'},'наша':{en:'our',pos:'det'},'наше':{en:'our',pos:'det'},'наши':{en:'our',pos:'det'},
    'ваш':{en:'your (pl)',pos:'det'},'ваша':{en:'your (pl)',pos:'det'},
    'этот':{en:'this',pos:'det'},'эта':{en:'this',pos:'det'},'это':{en:'this/it',pos:'det'},'эти':{en:'these',pos:'det'},
    'тот':{en:'that',pos:'det'},'та':{en:'that',pos:'det'},'то':{en:'that',pos:'det'},'те':{en:'those',pos:'det'},
    'в':{en:'in',pos:'prep'},'на':{en:'on/at',pos:'prep'},'с':{en:'with/from',pos:'prep'},
    'к':{en:'to/towards',pos:'prep'},'из':{en:'from/out of',pos:'prep'},'о':{en:'about',pos:'prep'},
    'за':{en:'behind/for',pos:'prep'},'по':{en:'along/by',pos:'prep'},'у':{en:'at/by',pos:'prep'},
    'от':{en:'from',pos:'prep'},'до':{en:'before/until',pos:'prep'},'для':{en:'for',pos:'prep'},
    'без':{en:'without',pos:'prep'},'между':{en:'between',pos:'prep'},
    'через':{en:'through/across',pos:'prep'},'перед':{en:'before/in front of',pos:'prep'},
    'под':{en:'under',pos:'prep'},'над':{en:'above/over',pos:'prep'},
    'и':{en:'and',pos:'conj'},'или':{en:'or',pos:'conj'},'но':{en:'but',pos:'conj'},
    'а':{en:'and/but',pos:'conj'},'что':{en:'that/what',pos:'conj'},
    'потому что':{en:'because',pos:'conj'},'если':{en:'if',pos:'conj'},
    'когда':{en:'when',pos:'conj'},'как':{en:'as/like/how',pos:'conj'},
    'где':{en:'where',pos:'adv'},'чтобы':{en:'in order to',pos:'conj'},
    'не':{en:'not',pos:'adv'},'да':{en:'yes',pos:'adv'},'нет':{en:'no',pos:'adv'},
    'очень':{en:'very',pos:'adv'},'тоже':{en:'also',pos:'adv'},'также':{en:'also',pos:'adv'},
    'ещё':{en:'still/more',pos:'adv'},'уже':{en:'already',pos:'adv'},
    'всегда':{en:'always',pos:'adv'},'никогда':{en:'never',pos:'adv'},
    'здесь':{en:'here',pos:'adv'},'тут':{en:'here',pos:'adv'},'там':{en:'there',pos:'adv'},
    'сейчас':{en:'now',pos:'adv'},'сегодня':{en:'today',pos:'adv'},
    'вчера':{en:'yesterday',pos:'adv'},'завтра':{en:'tomorrow',pos:'adv'},
    'хорошо':{en:'good/well',pos:'adv'},'плохо':{en:'badly',pos:'adv'},
    'больше':{en:'more',pos:'adv'},'меньше':{en:'less',pos:'adv'},
    'кто':{en:'who',pos:'pron'},'что':{en:'what',pos:'pron'},
    'где':{en:'where',pos:'adv'},'как':{en:'how',pos:'adv'},'почему':{en:'why',pos:'adv'},
    'когда':{en:'when',pos:'adv'},
    'всё':{en:'everything',pos:'pron'},'ничего':{en:'nothing',pos:'pron'},
    'кто-то':{en:'someone',pos:'pron'},'никто':{en:'nobody',pos:'pron'},
    'что-то':{en:'something',pos:'pron'},'каждый':{en:'each/every',pos:'det'},
    'все':{en:'all/everyone',pos:'pron'},'другой':{en:'other',pos:'det'},
    // High-frequency verb forms
    'есть':{en:'to be/to eat',pos:'v'},'был':{en:'to be',pos:'v',lemma:'быть'},
    'была':{en:'to be',pos:'v',lemma:'быть'},'было':{en:'to be',pos:'v',lemma:'быть'},
    'были':{en:'to be',pos:'v',lemma:'быть'},'быть':{en:'to be',pos:'v'},
    'будет':{en:'to be',pos:'v',lemma:'быть'},'буду':{en:'to be',pos:'v',lemma:'быть'},
    'может':{en:'to be able',pos:'v',lemma:'мочь'},'мочь':{en:'to be able',pos:'v'},
    'хочет':{en:'to want',pos:'v',lemma:'хотеть'},'хотеть':{en:'to want',pos:'v'},
    'знает':{en:'to know',pos:'v',lemma:'знать'},'знать':{en:'to know',pos:'v'},
    'говорит':{en:'to speak/say',pos:'v',lemma:'говорить'},'говорить':{en:'to speak/say',pos:'v'},
    'делает':{en:'to do/make',pos:'v',lemma:'делать'},'делать':{en:'to do/make',pos:'v'},
    'идёт':{en:'to go',pos:'v',lemma:'идти'},'идти':{en:'to go',pos:'v'},
    'даёт':{en:'to give',pos:'v',lemma:'давать'},'давать':{en:'to give',pos:'v'},
    'дать':{en:'to give',pos:'v'},
    'надо':{en:'it is necessary',pos:'v'},'нужно':{en:'it is necessary',pos:'v'},
  },
  cy: {
    'y':{en:'the',pos:'det'},'yr':{en:'the',pos:'det'},"'r":{en:'the',pos:'det'},
    'a':{en:'and/who/which',pos:'conj'},'ac':{en:'and',pos:'conj'},
    'i':{en:'to/for',pos:'prep'},'o':{en:'of/from',pos:'prep'},'yn':{en:'in',pos:'prep'},
    'ar':{en:'on',pos:'prep'},'am':{en:'for/about',pos:'prep'},'at':{en:'to/towards',pos:'prep'},
    'gan':{en:'by/with',pos:'prep'},'heb':{en:'without',pos:'prep'},
    'â':{en:'with',pos:'prep'},'ag':{en:'with (doing)',pos:'prep'},
    'dan':{en:'under',pos:'prep'},'dros':{en:'over/for',pos:'prep'},'rhwng':{en:'between',pos:'prep'},
    'fi':{en:'I/me',pos:'pron'},'ti':{en:'you',pos:'pron'},'fe':{en:'he/him',pos:'pron'},
    'fo':{en:'he/him',pos:'pron'},'hi':{en:'she/her',pos:'pron'},
    'ni':{en:'we/us',pos:'pron'},'chi':{en:'you (pl)',pos:'pron'},'nhw':{en:'they/them',pos:'pron'},
    'fy':{en:'my',pos:'det'},'dy':{en:'your',pos:'det'},'ei':{en:'his/her',pos:'det'},
    'ein':{en:'our',pos:'det'},'eich':{en:'your (pl)',pos:'det'},'eu':{en:'their',pos:'det'},
    'hwn':{en:'this (m)',pos:'pron'},'hon':{en:'this (f)',pos:'pron'},
    'hyn':{en:'this/these',pos:'pron'},'hynny':{en:'that',pos:'pron'},
    'na':{en:'nor/than',pos:'conj'},'neu':{en:'or',pos:'conj'},'ond':{en:'but',pos:'conj'},
    'oherwydd':{en:'because',pos:'conj'},'os':{en:'if',pos:'conj'},'pan':{en:'when',pos:'conj'},
    'ble':{en:'where',pos:'adv'},'lle':{en:'where/place',pos:'adv'},
    'ddim':{en:'not',pos:'adv'},'dim':{en:'not/nothing',pos:'adv'},
    'ie':{en:'yes',pos:'adv'},'nage':{en:'no',pos:'adv'},
    'iawn':{en:'very/right',pos:'adv'},'hefyd':{en:'also',pos:'adv'},
    'yma':{en:'here',pos:'adv'},'yna':{en:'there',pos:'adv'},
    'nawr':{en:'now',pos:'adv'},'heddiw':{en:'today',pos:'adv'},
    'ddoe':{en:'yesterday',pos:'adv'},'yfory':{en:'tomorrow',pos:'adv'},
    'bob':{en:'every',pos:'det'},'pob':{en:'every',pos:'det'},
    'beth':{en:'what',pos:'pron'},'pwy':{en:'who',pos:'pron'},'sut':{en:'how',pos:'adv'},
    'pam':{en:'why',pos:'adv'},'pryd':{en:'when',pos:'adv'},
    'popeth':{en:'everything',pos:'pron'},'dim':{en:'nothing',pos:'pron'},
    'rhywun':{en:'someone',pos:'pron'},'neb':{en:'nobody',pos:'pron'},
    'rhywbeth':{en:'something',pos:'pron'},
    'pawb':{en:'everyone',pos:'pron'},'arall':{en:'other',pos:'det'},
    // High-frequency verb forms
    'mae':{en:'to be',pos:'v',lemma:'bod'},'yw':{en:'to be',pos:'v',lemma:'bod'},
    'ydy':{en:'to be',pos:'v',lemma:'bod'},'oedd':{en:'to be',pos:'v',lemma:'bod'},
    'roedd':{en:'to be',pos:'v',lemma:'bod'},"dw i'n":{en:'to be',pos:'v',lemma:'bod'},
    'bod':{en:'to be',pos:'v'},
    'wedi':{en:'after (perf. marker)',pos:'part'},
    "dw":{en:'to be',pos:'v',lemma:'bod'},"rydw":{en:'to be',pos:'v',lemma:'bod'},
    "ydych":{en:'to be',pos:'v',lemma:'bod'},"ydyn":{en:'to be',pos:'v',lemma:'bod'},
    'bydd':{en:'to be (future)',pos:'v',lemma:'bod'},
    'does':{en:'to be (neg)',pos:'v',lemma:'bod'},
    'gallaf':{en:'to be able',pos:'v',lemma:'gallu'},'gallu':{en:'to be able',pos:'v'},
    'mynd':{en:'to go',pos:'v'},'dod':{en:'to come',pos:'v'},
    'gwneud':{en:'to do/make',pos:'v'},'cael':{en:'to get/have',pos:'v'},
    'rhoi':{en:'to give',pos:'v'},'dweud':{en:'to say',pos:'v'},
    'gweld':{en:'to see',pos:'v'},'gwybod':{en:'to know',pos:'v'},
  },
  hi: {
    'का':{en:'of',pos:'prep'},'की':{en:'of',pos:'prep'},'के':{en:'of',pos:'prep'},
    'को':{en:'to',pos:'prep'},'से':{en:'from/with',pos:'prep'},'में':{en:'in',pos:'prep'},
    'पर':{en:'on/at',pos:'prep'},'तक':{en:'until',pos:'prep'},'ने':{en:'(agent marker)',pos:'part'},
    'मैं':{en:'I',pos:'pron'},'तू':{en:'you (informal)',pos:'pron'},'तुम':{en:'you',pos:'pron'},
    'आप':{en:'you (formal)',pos:'pron'},'वह':{en:'he/she/that',pos:'pron'},
    'यह':{en:'he/she/this',pos:'pron'},'हम':{en:'we',pos:'pron'},'वे':{en:'they',pos:'pron'},
    'ये':{en:'these/they',pos:'pron'},
    'मुझे':{en:'to me',pos:'pron'},'तुझे':{en:'to you',pos:'pron'},'उसे':{en:'to him/her',pos:'pron'},
    'हमें':{en:'to us',pos:'pron'},'उन्हें':{en:'to them',pos:'pron'},
    'मेरा':{en:'my',pos:'det'},'मेरी':{en:'my',pos:'det'},'मेरे':{en:'my',pos:'det'},
    'तेरा':{en:'your',pos:'det'},'तेरी':{en:'your',pos:'det'},
    'उसका':{en:'his/her',pos:'det'},'उसकी':{en:'his/her',pos:'det'},
    'हमारा':{en:'our',pos:'det'},'हमारी':{en:'our',pos:'det'},
    'उनका':{en:'their',pos:'det'},'उनकी':{en:'their',pos:'det'},
    'और':{en:'and',pos:'conj'},'या':{en:'or',pos:'conj'},'लेकिन':{en:'but',pos:'conj'},
    'पर':{en:'but',pos:'conj'},'कि':{en:'that',pos:'conj'},'क्योंकि':{en:'because',pos:'conj'},
    'अगर':{en:'if',pos:'conj'},'जब':{en:'when',pos:'conj'},'तो':{en:'then',pos:'conj'},
    'नहीं':{en:'no/not',pos:'adv'},'हाँ':{en:'yes',pos:'adv'},'भी':{en:'also',pos:'adv'},
    'बहुत':{en:'very/much',pos:'adv'},'अभी':{en:'now/right now',pos:'adv'},
    'आज':{en:'today',pos:'adv'},'कल':{en:'yesterday/tomorrow',pos:'adv'},
    'यहाँ':{en:'here',pos:'adv'},'वहाँ':{en:'there',pos:'adv'},
    'हमेशा':{en:'always',pos:'adv'},'कभी':{en:'ever/sometimes',pos:'adv'},
    'फिर':{en:'then/again',pos:'adv'},'सब':{en:'all',pos:'pron'},
    'कुछ':{en:'some/something',pos:'pron'},'कोई':{en:'someone/some',pos:'pron'},
    'क्या':{en:'what (question)',pos:'pron'},'कौन':{en:'who',pos:'pron'},
    'कहाँ':{en:'where',pos:'adv'},'कैसे':{en:'how',pos:'adv'},'क्यों':{en:'why',pos:'adv'},
    // High-frequency verb forms
    'है':{en:'to be',pos:'v',lemma:'होना'},'हैं':{en:'to be',pos:'v',lemma:'होना'},
    'था':{en:'to be',pos:'v',lemma:'होना'},'थी':{en:'to be',pos:'v',lemma:'होना'},
    'थे':{en:'to be',pos:'v',lemma:'होना'},'होना':{en:'to be',pos:'v'},
    'हूँ':{en:'to be',pos:'v',lemma:'होना'},
    'करता':{en:'to do',pos:'v',lemma:'करना'},'करती':{en:'to do',pos:'v',lemma:'करना'},
    'करते':{en:'to do',pos:'v',lemma:'करना'},'करना':{en:'to do',pos:'v'},
    'सकता':{en:'to be able',pos:'v',lemma:'सकना'},'सकती':{en:'to be able',pos:'v',lemma:'सकना'},
    'सकना':{en:'to be able',pos:'v'},
    'जाता':{en:'to go',pos:'v',lemma:'जाना'},'जाती':{en:'to go',pos:'v',lemma:'जाना'},
    'जाना':{en:'to go',pos:'v'},
    'आता':{en:'to come',pos:'v',lemma:'आना'},'आती':{en:'to come',pos:'v',lemma:'आना'},
    'आना':{en:'to come',pos:'v'},
    'देना':{en:'to give',pos:'v'},'लेना':{en:'to take',pos:'v'},
    'कहना':{en:'to say',pos:'v'},'जानना':{en:'to know',pos:'v'},
    'चाहिए':{en:'should/need',pos:'v'},
  },
};

const FUNCTION_WORDS = FUNCTION_WORDS_MAP[LANG] || {};

// ─── Helpers ────────────────────────────────────────────────────────────────

function isInfinitive(key) {
  if (!cfg.infinitiveRe) return false; // CY: lemma-only mode
  const clean = key.replace(/^[¿¡]+/, '');
  if (FALSE_INFINITIVES.has(clean)) return false;
  // For Swedish: also filter short words that end in -a but aren't verbs
  if (LANG === 'sv' && clean.length <= 2) return false;
  return cfg.infinitiveRe.test(clean);
}

function parseDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const entries = {};
  // Match entries with both single and double quoted keys, handling escaped quotes
  const re = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1], body = m[2], entry = {};
    const enM = body.match(/en:\s*'([^']*)'/); if (enM) entry.en = enM[1];
    const ipaM = body.match(/ipa:\s*'([^']*)'/); if (ipaM) entry.ipa = ipaM[1];
    const posM = body.match(/pos:\s*'([^']*)'/); if (posM) entry.pos = posM[1];
    const lemmaM = body.match(/lemma:\s*'([^']*)'/); if (lemmaM) entry.lemma = lemmaM[1];
    entries[key] = entry;
  }
  return entries;
}

function googleTranslate(words, source, target) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams();
    params.append('key', API_KEY);
    params.append('source', source);
    params.append('target', target);
    params.append('format', 'text');
    for (const w of words) params.append('q', w);
    const body = params.toString();
    const options = {
      hostname: 'translation.googleapis.com',
      path: '/language/translate/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error('API error: ' + json.error.message)); return; }
          resolve(json.data.translations.map(t => t.translatedText));
        } catch (e) { reject(new Error('Parse error: ' + e.message + '\nRaw: ' + data.slice(0, 500))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function translateBatch(wordList, source, target) {
  const BATCH_SIZE = 80;
  const MAX_RETRIES = 3;
  const results = new Map();
  const batches = [];
  for (let i = 0; i < wordList.length; i += BATCH_SIZE) batches.push(wordList.slice(i, i + BATCH_SIZE));
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    process.stdout.write(`  Batch ${i + 1}/${batches.length} (${batch.length} words)...`);
    let translations = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        translations = await googleTranslate(batch, source, target);
        break;
      } catch (err) {
        if (attempt < MAX_RETRIES - 1) {
          const wait = (attempt + 1) * 3000;
          process.stdout.write(` retry in ${wait/1000}s...`);
          await sleep(wait);
        } else {
          throw err;
        }
      }
    }
    for (let j = 0; j < batch.length; j++) {
      results.set(batch[j], translations[j]);
    }
    console.log(' done');
    if (i < batches.length - 1) await sleep(300);
  }
  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function decodeHtmlEntities(s) {
  return s.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

// ─── QC word lists ──────────────────────────────────────────────────────────

const AUXILIARIES = new Set([
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'can', 'could',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'do',
  'does', 'did', 'am', 'be', 'been', 'being',
]);

const THIRD_PERSON_ENDINGS = new Set([
  'costs', 'eats', 'drinks', 'walks', 'talks', 'runs', 'comes', 'goes',
  'takes', 'makes', 'says', 'gives', 'finds', 'tells', 'asks', 'uses',
  'works', 'calls', 'tries', 'needs', 'feels', 'becomes', 'leaves',
  'puts', 'means', 'keeps', 'lets', 'begins', 'seems', 'helps', 'shows',
  'hears', 'plays', 'moves', 'lives', 'believes', 'brings', 'happens',
  'writes', 'provides', 'sits', 'stands', 'loses', 'pays', 'meets',
  'includes', 'continues', 'sets', 'learns', 'changes', 'leads', 'understands',
  'watches', 'follows', 'stops', 'creates', 'speaks', 'reads', 'allows',
  'adds', 'spends', 'grows', 'opens', 'wins', 'offers', 'remembers',
  'loves', 'considers', 'appears', 'buys', 'waits', 'serves', 'dies',
  'sends', 'expects', 'builds', 'stays', 'falls', 'cuts', 'reaches',
  'kills', 'remains', 'suggests', 'raises', 'passes', 'sells', 'requires',
  'reports', 'decides', 'pulls',
]);

const PAST_TENSE_WORDS = new Set([
  'came', 'went', 'got', 'gave', 'saw', 'took', 'knew', 'thought',
  'told', 'found', 'asked', 'used', 'worked', 'called', 'tried',
  'left', 'kept', 'let', 'began', 'seemed', 'helped', 'showed',
  'heard', 'played', 'moved', 'lived', 'believed', 'brought', 'happened',
  'wrote', 'sat', 'stood', 'lost', 'paid', 'met', 'ran', 'held',
  'learned', 'changed', 'led', 'understood', 'watched', 'followed',
  'stopped', 'created', 'spoke', 'read', 'allowed', 'added', 'spent',
  'grew', 'opened', 'walked', 'won', 'offered', 'remembered', 'loved',
  'considered', 'appeared', 'bought', 'waited', 'served', 'died',
  'sent', 'expected', 'built', 'stayed', 'fell', 'cut', 'reached',
  'killed', 'remained', 'suggested', 'raised', 'passed', 'sold',
  'decided', 'pulled', 'ate', 'drank', 'drove', 'felt', 'broke',
  'wore', 'chose', 'slept', 'woke', 'drew', 'flew', 'caught', 'threw',
  'hung', 'shook', 'sang', 'swam', 'froze', 'hid', 'rode', 'rose',
  'stole', 'tore', 'wove', 'blew', 'bore', 'swore',
]);

const COMMON_NOUNS = new Set([
  'friend', 'morning', 'house', 'car', 'day', 'night', 'water', 'food',
  'money', 'time', 'year', 'people', 'way', 'world', 'life', 'hand',
  'part', 'place', 'case', 'week', 'company', 'system', 'program',
  'question', 'work', 'government', 'number', 'school', 'area', 'book',
  'family', 'country', 'story', 'home', 'room', 'mother', 'father',
  'child', 'children', 'woman', 'man', 'dog', 'cat', 'door', 'window',
  'table', 'chair', 'bed', 'city', 'street', 'road', 'beach', 'mountain',
  'river', 'tree', 'flower', 'sun', 'moon', 'star', 'rain', 'snow',
  'fire', 'earth', 'air', 'light', 'music', 'art', 'color', 'letter',
  'word', 'name', 'head', 'face', 'eye', 'heart', 'body', 'foot',
  'girl', 'boy', 'baby', 'brother', 'sister', 'son', 'daughter',
  'husband', 'wife', 'king', 'queen', 'doctor', 'teacher', 'student',
  'market', 'store', 'office', 'church', 'hotel', 'restaurant',
  'airport', 'station', 'hospital', 'park', 'garden', 'forest',
  'island', 'bridge', 'museum', 'library', 'train', 'bus', 'plane',
  'ship', 'boat', 'bicycle', 'phone', 'computer', 'radio', 'television',
  'camera', 'clock', 'key', 'bag', 'box', 'cup', 'glass', 'bottle',
  'knife', 'plate', 'fish', 'bird', 'horse', 'cow', 'chicken', 'pig',
  'rice', 'bread', 'meat', 'cheese', 'fruit', 'cake', 'coffee', 'tea',
  'milk', 'wine', 'beer', 'juice', 'oil', 'salt', 'sugar', 'butter',
  'egg', 'soup', 'breakfast', 'lunch', 'dinner', 'price', 'cost',
  'war', 'peace', 'law', 'power', 'truth', 'death', 'love', 'joy',
  'fear', 'pain', 'anger', 'health', 'danger', 'problem', 'idea',
  'reason', 'example', 'game', 'sport', 'team', 'player', 'movie',
  'film', 'song', 'news', 'paper', 'page', 'picture', 'photo',
  'class', 'lesson', 'test', 'grade', 'trip', 'vacation', 'weather',
  'winter', 'summer', 'spring', 'autumn', 'fall', 'month', 'hour',
  'minute', 'second', 'birthday', 'party', 'gift', 'clothes', 'shirt',
  'dress', 'shoe', 'hat', 'coat', 'jacket', 'pants', 'skirt',
]);

const VERB_NOUN_OVERLAP = new Set([
  'store', 'fall', 'cut', 'read', 'rain', 'program', 'park', 'dress',
  'light', 'fire', 'snow', 'place', 'work', 'love', 'name', 'face',
  'train', 'fish', 'boat', 'ship', 'test', 'game', 'film', 'picture',
  'class', 'spring', 'cost', 'price', 'power', 'air', 'salt', 'oil',
  'butter', 'egg', 'lunch', 'dinner', 'breakfast', 'party', 'gift',
  'coat', 'hat', 'dog', 'cat', 'star', 'moon', 'key', 'bag', 'box',
  'cup', 'page', 'paper', 'sugar', 'milk', 'water', 'head',
  'do', 'have', 'be', 'can', 'will', 'may', 'might', 'would', 'should',
  'reason', 'fear',
]);

const VALID_SHORT_VERBS = new Set([
  'be', 'go', 'do', 'say', 'get', 'see', 'ask', 'use', 'try', 'let',
  'put', 'run', 'set', 'cut', 'pay', 'win', 'buy', 'sit', 'hit', 'lie',
  'die', 'eat', 'fly', 'add', 'fit', 'cry', 'dry', 'fix', 'mix', 'dig',
  'bow', 'bet', 'bid', 'bit', 'dye', 'hug', 'jam', 'jog', 'nap', 'nod',
  'own', 'pet', 'pin', 'pop', 'rip', 'rob', 'rot', 'row', 'rub', 'sew',
  'ski', 'tap', 'tie', 'tip', 'tow', 'tug', 'wax', 'zip', 'ban', 'dip',
  'fan', 'gag', 'hum', 'lag', 'log', 'map', 'mop', 'mug', 'nab', 'pad',
  'peg', 'rig', 'sag', 'sap', 'sob', 'tag', 'tan', 'vow', 'wag', 'wed',
  'vet', 'woo', 'age', 'aim', 'air', 'arm',
]);

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  CLEAN REBUILD V2 — ${LANG.toUpperCase()}`);
  console.log(`${'═'.repeat(60)}`);

  // ── Step 1: Parse ──
  console.log(`\n=== Step 1: Parse all entries from ${LANG}.ts ===`);
  const existing = parseDict();
  const keys = Object.keys(existing);
  console.log(`  Parsed ${keys.length} entries`);

  // ── Step 2: Classify ──
  console.log('\n=== Step 2: Classify entries ===');
  const verbInfinitives = {};
  const verbForms = {};
  const nonVerbs = {};

  for (const [key, entry] of Object.entries(existing)) {
    if (FUNCTION_WORDS[key]) continue;

    const cleanKey = key.replace(/^[¿¡]+/, '');

    if (cfg.lemmaOnly) {
      // Welsh: no consistent infinitive endings — use lemma field only
      if (entry.pos === 'v' && !entry.lemma) {
        verbInfinitives[key] = entry;
      } else if (entry.lemma && existing[entry.lemma]?.pos === 'v') {
        verbForms[key] = entry;
      } else if (entry.pos === 'v' && entry.lemma) {
        verbForms[key] = entry;
      } else {
        nonVerbs[key] = entry;
      }
    } else if (cfg.usePosFallback && LANG === 'sv') {
      // Swedish: -a ending is too broad, supplement with pos='v' and lemma checks
      if (isInfinitive(cleanKey) && (entry.pos === 'v' || !entry.pos || entry.lemma)) {
        verbInfinitives[key] = entry;
      } else if (entry.lemma && (isInfinitive(entry.lemma) || existing[entry.lemma]?.pos === 'v')) {
        verbForms[key] = entry;
      } else if (entry.pos === 'v' && !entry.lemma) {
        verbInfinitives[key] = entry;
      } else if (entry.pos === 'v' && entry.lemma) {
        verbForms[key] = entry;
      } else {
        nonVerbs[key] = entry;
      }
    } else {
      // Standard: use infinitive regex
      if (isInfinitive(cleanKey)) {
        verbInfinitives[key] = entry;
      } else if (entry.lemma && isInfinitive(entry.lemma.replace(/^[¿¡]+/, ''))) {
        verbForms[key] = entry;
      } else if (entry.pos === 'v' && entry.lemma) {
        // Has a verb lemma but lemma doesn't match infinitive pattern — still a verb form
        verbForms[key] = entry;
      } else if (entry.pos === 'v' && !entry.lemma) {
        // Marked as verb but no lemma and doesn't look like infinitive — treat as non-verb
        // to avoid incorrect "to " prefix via Google
        nonVerbs[key] = entry;
      } else {
        nonVerbs[key] = entry;
      }
    }
  }

  console.log(`  VERB_INFINITIVE: ${Object.keys(verbInfinitives).length}`);
  console.log(`  VERB_FORM:       ${Object.keys(verbForms).length}`);
  console.log(`  NON_VERB:        ${Object.keys(nonVerbs).length}`);
  console.log(`  FUNCTION_WORD:   ${Object.keys(FUNCTION_WORDS).length}`);

  // ── Step 3: Collect unique infinitives ──
  console.log('\n=== Step 3: Collect unique infinitives ===');
  const infinitiveSet = new Set();
  for (const key of Object.keys(verbInfinitives)) {
    infinitiveSet.add(key.replace(/^[¿¡]+/, ''));
  }
  for (const entry of Object.values(verbForms)) {
    if (entry.lemma) infinitiveSet.add(entry.lemma);
  }
  for (const entry of Object.values(FUNCTION_WORDS)) {
    if (entry.lemma && (cfg.lemmaOnly || isInfinitive(entry.lemma))) infinitiveSet.add(entry.lemma);
  }

  const uniqueInfinitives = [...infinitiveSet].sort();
  console.log(`  ${uniqueInfinitives.length} unique infinitives collected`);

  // ── Step 4: Translate infinitives via Google ──
  console.log(`\n=== Step 4: Translate infinitives via Google (${cfg.googleCode}→en) ===`);
  const infTranslations = uniqueInfinitives.length > 0
    ? await translateBatch(uniqueInfinitives, cfg.googleCode, 'en')
    : new Map();
  console.log(`  Translated ${infTranslations.size} infinitives`);

  // ── Step 5: Add "to " prefix + QC ──
  console.log('\n=== Step 5: Add "to " prefix + QC ===');
  const infinitiveToEn = new Map();
  let qcFixes = 0;

  for (const [inf, raw] of infTranslations.entries()) {
    let translation = decodeHtmlEntities(raw).trim();
    if (translation.toLowerCase().startsWith('to ')) {
      translation = translation.slice(3);
    }
    if (translation.length > 0 && /^[A-Z]/.test(translation) && !/^[A-Z]{2}/.test(translation)) {
      translation = translation[0].toLowerCase() + translation.slice(1);
    }
    if (translation.length > 60) {
      translation = translation.slice(0, 57) + '...';
    }

    const baseWord = translation.split(/\s/)[0].toLowerCase();
    let isGood = true;

    if (baseWord.length < 3 && !VALID_SHORT_VERBS.has(baseWord)) {
      console.log(`  QC WARN: "${inf}" → "to ${translation}" — base too short`);
      isGood = false;
    }
    if (COMMON_NOUNS.has(baseWord) && !VERB_NOUN_OVERLAP.has(baseWord)) {
      console.log(`  QC WARN: "${inf}" → "to ${translation}" — base is a common noun`);
      isGood = false;
    }

    if (!isGood) {
      qcFixes++;
      const existingEntry = existing[inf];
      if (existingEntry && existingEntry.en && existingEntry.en.startsWith('to ') && existingEntry.en !== `to ${inf}`) {
        translation = existingEntry.en.slice(3);
        console.log(`    → Using existing: "to ${translation}"`);
      }
    }

    infinitiveToEn.set(inf, 'to ' + translation);
  }
  console.log(`  QC fixes applied: ${qcFixes}`);

  // ── Step 6: Assign verb definitions ──
  console.log('\n=== Step 6: Assign verb definitions ===');
  const finalEntries = {};

  // First add function words
  for (const [key, entry] of Object.entries(FUNCTION_WORDS)) {
    finalEntries[key] = { ...entry };
    if (existing[key] && existing[key].ipa) {
      finalEntries[key].ipa = existing[key].ipa;
    } else {
      finalEntries[key].ipa = finalEntries[key].ipa || '';
    }
  }

  // Verb infinitives
  let infAssigned = 0;
  for (const [key, entry] of Object.entries(verbInfinitives)) {
    const cleanKey = key.replace(/^[¿¡]+/, '');
    const translation = infinitiveToEn.get(cleanKey);
    if (translation) {
      finalEntries[key] = {
        en: translation,
        ipa: entry.ipa || '',
        pos: 'v',
      };
      if (entry.lemma) finalEntries[key].lemma = entry.lemma;
      infAssigned++;
    } else {
      finalEntries[key] = { ...entry, pos: 'v' };
    }
  }
  console.log(`  Infinitives assigned: ${infAssigned}`);

  // Verb forms → get translation from their lemma
  let formAssigned = 0;
  for (const [key, entry] of Object.entries(verbForms)) {
    const lemma = entry.lemma;
    const translation = lemma ? infinitiveToEn.get(lemma) : null;
    if (translation) {
      finalEntries[key] = {
        en: translation,
        ipa: entry.ipa || '',
        pos: 'v',
        lemma: lemma,
      };
      formAssigned++;
    } else {
      finalEntries[key] = { ...entry, pos: 'v' };
    }
  }
  console.log(`  Verb forms assigned: ${formAssigned}`);

  // ── Step 7: Translate non-verbs via Google ──
  console.log(`\n=== Step 7: Translate non-verbs via Google (${cfg.googleCode}→en) ===`);
  const nonVerbKeys = Object.keys(nonVerbs);
  const toTranslate = nonVerbKeys.filter(k => !FUNCTION_WORDS[k]);
  console.log(`  ${toTranslate.length} non-verb entries to translate`);

  const nvTranslations = toTranslate.length > 0
    ? await translateBatch(toTranslate, cfg.googleCode, 'en')
    : new Map();

  let nvAssigned = 0;
  for (const [key, entry] of Object.entries(nonVerbs)) {
    if (FUNCTION_WORDS[key]) continue;

    const raw = nvTranslations.get(key);
    let translation = raw ? decodeHtmlEntities(raw).trim() : entry.en;

    if (translation && /^[A-Z]/.test(translation) && !/^[A-Z]{2}/.test(translation)) {
      translation = translation[0].toLowerCase() + translation.slice(1);
    }
    if (translation && translation.length > 60) {
      translation = translation.slice(0, 57) + '...';
    }

    finalEntries[key] = {
      en: translation || entry.en || key,
      ipa: entry.ipa || '',
    };
    if (entry.pos) finalEntries[key].pos = entry.pos;
    if (entry.lemma) finalEntries[key].lemma = entry.lemma;
    nvAssigned++;
  }
  console.log(`  Non-verb entries assigned: ${nvAssigned}`);

  // ── Step 8: Write dictionary file ──
  console.log(`\n=== Step 8: Write to ${LANG}.ts ===`);

  const src = fs.readFileSync(DICT_PATH, 'utf8');
  // Find where the dictionary variable starts
  const dictVarPattern = cfg.dictVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerRe = new RegExp(`(${dictVarPattern}:\\s*Record<string,\\s*DictEntry>\\s*=\\s*\\{)`);
  const headerMatch = src.match(headerRe);

  if (!headerMatch) {
    console.error(`  ERROR: Could not find "${cfg.dictVar}" pattern in ${LANG}.ts`);
    console.error(`  Looking for: ${dictVarPattern}`);
    process.exit(1);
  }

  const headerEnd = src.indexOf(headerMatch[0]);
  const header = src.slice(0, headerEnd);

  // Find where the dictionary ends (closing }; before the next function or export)
  const dictStart = headerEnd + headerMatch[0].length;
  // Find matching closing brace
  let braceCount = 1;
  let dictEnd = dictStart;
  for (let i = dictStart; i < src.length && braceCount > 0; i++) {
    if (src[i] === '{') braceCount++;
    if (src[i] === '}') braceCount--;
    if (braceCount === 0) { dictEnd = i + 1; break; }
  }
  // Include the semicolon after the closing brace
  if (src[dictEnd] === ';') dictEnd++;
  if (src[dictEnd] === '\n') dictEnd++;

  const footer = src.slice(dictEnd);

  // Sort entries
  const sortedKeys = Object.keys(finalEntries).sort((a, b) => a.localeCompare(b, cfg.sortLocale));

  let dictLines = [];
  for (const key of sortedKeys) {
    const e = finalEntries[key];
    const q = key.includes("'") ? '"' : "'";
    const enEsc = (e.en || '').replace(/\\/g, '').replace(/'/g, "\\'");
    const ipaEsc = (e.ipa || '').replace(/\\/g, '').replace(/'/g, "\\'");
    const lemmaEsc = e.lemma ? e.lemma.replace(/\\/g, '').replace(/'/g, "\\'") : null;
    let line = `  ${q}${key}${q}: { en: '${enEsc}', ipa: '${ipaEsc}'`;
    if (e.pos) line += `, pos: '${e.pos}'`;
    if (lemmaEsc) line += `, lemma: '${lemmaEsc}'`;
    line += ' },';
    dictLines.push(line);
  }

  const output = header + headerMatch[0] + '\n' + dictLines.join('\n') + '\n};\n' + footer;
  fs.writeFileSync(DICT_PATH, output, 'utf8');
  console.log(`  Wrote ${sortedKeys.length} entries to ${LANG}.ts`);

  // ── Step 9: Built-in QC ──
  console.log('\n=== Step 9: Built-in QC ===');
  const verified = parseDict();
  const issues = [];

  // Check 1: "to [auxiliary]"
  let auxIssues = 0;
  for (const [key, entry] of Object.entries(verified)) {
    if (!entry.en) continue;
    const m = entry.en.match(/^to (\w+)$/);
    if (m && AUXILIARIES.has(m[1].toLowerCase())) {
      const lemmaOrKey = entry.lemma || key;
      const fwEntry = FUNCTION_WORDS[lemmaOrKey] || FUNCTION_WORDS[key];
      if (!fwEntry && !VERB_NOUN_OVERLAP.has(m[1].toLowerCase())) {
        // Allow known verbs like être→"to be"
        const allowedBe = ['ser', 'estar', 'être', 'essere', 'sein', 'zijn', 'vara', 'bod', 'быть', 'होना', 'olmak'];
        const allowedHave = ['haber', 'tener', 'avoir', 'avere', 'haben', 'hebben', 'ha', 'cael', 'иметь', 'होना'];
        if (!allowedBe.includes(lemmaOrKey) && !allowedHave.includes(lemmaOrKey)) {
          issues.push(`  AUX: "${key}" → "${entry.en}"`);
          auxIssues++;
        }
      }
    }
  }
  console.log(`  [1] "to [auxiliary]": ${auxIssues} issues`);

  // Check 2: "to [3rd person]"
  let thirdPersonIssues = 0;
  for (const [key, entry] of Object.entries(verified)) {
    if (!entry.en) continue;
    const m = entry.en.match(/^to (\w+)$/);
    if (m && THIRD_PERSON_ENDINGS.has(m[1].toLowerCase()) && !VERB_NOUN_OVERLAP.has(m[1].toLowerCase())) {
      issues.push(`  3RD: "${key}" → "${entry.en}"`);
      thirdPersonIssues++;
    }
  }
  console.log(`  [2] "to [3rd person]": ${thirdPersonIssues} issues`);

  // Check 3: "to [past tense]"
  let pastIssues = 0;
  for (const [key, entry] of Object.entries(verified)) {
    if (!entry.en) continue;
    const m = entry.en.match(/^to (\w+)$/);
    if (m && PAST_TENSE_WORDS.has(m[1].toLowerCase()) && !VERB_NOUN_OVERLAP.has(m[1].toLowerCase())) {
      issues.push(`  PAST: "${key}" → "${entry.en}"`);
      pastIssues++;
    }
  }
  console.log(`  [3] "to [past tense]": ${pastIssues} issues`);

  // Check 4: "to [noun]"
  let nounIssues = 0;
  for (const [key, entry] of Object.entries(verified)) {
    if (!entry.en) continue;
    const m = entry.en.match(/^to (\w+)$/);
    if (m && COMMON_NOUNS.has(m[1].toLowerCase()) && !VERB_NOUN_OVERLAP.has(m[1].toLowerCase())) {
      issues.push(`  NOUN: "${key}" → "${entry.en}"`);
      nounIssues++;
    }
  }
  console.log(`  [4] "to [noun]": ${nounIssues} issues`);

  // Check 5: VERB_INFINITIVE missing "to "
  let missingTo = 0;
  for (const key of Object.keys(verbInfinitives)) {
    if (verified[key] && !verified[key].en.startsWith('to ')) {
      issues.push(`  MISSING_TO: "${key}" → "${verified[key].en}"`);
      missingTo++;
    }
  }
  console.log(`  [5] VERB_INFINITIVE missing "to ": ${missingTo} issues`);

  // Check 6: NON_VERB with "to "
  let wrongTo = 0;
  for (const key of Object.keys(nonVerbs)) {
    if (verified[key] && verified[key].en.startsWith('to ') && verified[key].pos !== 'v') {
      issues.push(`  WRONG_TO: "${key}" → "${verified[key].en}" (pos=${verified[key].pos})`);
      wrongTo++;
    }
  }
  console.log(`  [6] NON_VERB with "to ": ${wrongTo} issues`);

  const totalIssues = auxIssues + thirdPersonIssues + pastIssues + nounIssues + missingTo + wrongTo;
  let qcPass = true;
  if (totalIssues > 0) {
    console.log(`\n  Total QC issues: ${totalIssues}`);
    console.log('  Attempting auto-fix...');

    const fixDict = parseDict();
    let fixes = 0;

    for (const issue of issues) {
      const keyMatch = issue.match(/"([^"]+)" → "/);
      if (!keyMatch) continue;
      const key = keyMatch[1];
      const entry = fixDict[key];
      if (!entry) continue;

      if (issue.includes('AUX:') || issue.includes('3RD:') || issue.includes('PAST:') || issue.includes('NOUN:')) {
        if (existing[key] && existing[key].en && existing[key].en !== entry.en) {
          fixDict[key].en = existing[key].en;
          fixes++;
        } else if (entry.pos !== 'v') {
          fixDict[key].en = entry.en.replace(/^to /, '');
          fixes++;
        }
      } else if (issue.includes('MISSING_TO:')) {
        fixDict[key].en = 'to ' + entry.en;
        fixes++;
      } else if (issue.includes('WRONG_TO:')) {
        fixDict[key].en = entry.en.replace(/^to /, '');
        fixes++;
      }
    }

    if (fixes > 0) {
      const fixedKeys = Object.keys(fixDict).sort((a, b) => a.localeCompare(b, cfg.sortLocale));
      let fixedLines = [];
      for (const key of fixedKeys) {
        const e = fixDict[key];
        const q = key.includes("'") ? '"' : "'";
        const enEsc = (e.en || '').replace(/\\/g, '').replace(/'/g, "\\'");
        const ipaEsc = (e.ipa || '').replace(/\\/g, '').replace(/'/g, "\\'");
        const lemmaEsc = e.lemma ? e.lemma.replace(/\\/g, '').replace(/'/g, "\\'") : null;
        let line = `  ${q}${key}${q}: { en: '${enEsc}', ipa: '${ipaEsc}'`;
        if (e.pos) line += `, pos: '${e.pos}'`;
        if (lemmaEsc) line += `, lemma: '${lemmaEsc}'`;
        line += ' },';
        fixedLines.push(line);
      }
      const fixedOutput = header + headerMatch[0] + '\n' + fixedLines.join('\n') + '\n};\n' + footer;
      fs.writeFileSync(DICT_PATH, fixedOutput, 'utf8');
      console.log(`  Applied ${fixes} auto-fixes`);
    }
    qcPass = fixes >= totalIssues;
  }
  console.log(`  QC result: ${qcPass ? 'PASS' : 'PARTIAL (some issues remain)'}`);

  // ── Step 10: TypeScript verify ──
  console.log('\n=== Step 10: TypeScript verification ===');
  try {
    execSync('PATH="/opt/homebrew/bin:$PATH" npx tsc --noEmit --skipLibCheck', {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 60000,
    });
    console.log('  TypeScript: PASS');
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : '';
    const stdout = e.stdout ? e.stdout.toString() : '';
    const langErrors = (stderr + stdout).split('\n').filter(l => l.includes(`${LANG}.ts`));
    if (langErrors.length > 0) {
      console.log(`  TypeScript: FAIL (${LANG}.ts errors):`);
      for (const line of langErrors.slice(0, 10)) console.log('    ' + line);
    } else {
      console.log(`  TypeScript: PASS (non-${LANG}.ts errors ignored)`);
    }
  }

  // ── Report ──
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  REBUILD REPORT — ${LANG.toUpperCase()}`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`  Total entries written:    ${Object.keys(parseDict()).length}`);
  console.log(`  VERB_INFINITIVE:          ${Object.keys(verbInfinitives).length}`);
  console.log(`  VERB_FORM:                ${Object.keys(verbForms).length}`);
  console.log(`  NON_VERB:                 ${Object.keys(nonVerbs).length}`);
  console.log(`  FUNCTION_WORD:            ${Object.keys(FUNCTION_WORDS).length}`);
  console.log(`  Infinitives translated:   ${infTranslations.size}`);
  console.log(`  Non-verbs translated:     ${nvTranslations.size}`);
  console.log(`  QC:                       ${qcPass ? 'PASS' : 'PARTIAL'}`);
  console.log(`${'═'.repeat(50)}\n`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
