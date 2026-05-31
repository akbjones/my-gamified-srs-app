#!/usr/bin/env node
/**
 * expand-dict-smart.cjs
 *
 * Expands dictionaries using a comprehensive word-translation map
 * plus rule-based IPA generation. Much more accurate than position-alignment.
 *
 * Usage: node scripts/expand-dict-smart.cjs --lang=de --write
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const lang = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const doWrite = args.includes('--write');

if (!lang) {
  console.error('Usage: node scripts/expand-dict-smart.cjs --lang=CODE [--write]');
  process.exit(1);
}

const LANG_MAP = {
  es: 'spanish', it: 'italian', fr: 'french', pt: 'portuguese',
  de: 'german', nl: 'dutch', sv: 'swedish', cy: 'welsh',
  hi: 'hindi', tr: 'turkish', ru: 'russian',
};
const langDir = LANG_MAP[lang];
if (!langDir) { console.error('Unknown lang: ' + lang); process.exit(1); }

const BASE = path.join(__dirname, '..', 'src', 'data');
const deckPath = path.join(BASE, langDir, 'deck.json');
const dictPath = path.join(BASE, 'dictionary', `${lang}.ts`);

// Load deck and dictionary
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
const dictContent = fs.readFileSync(dictPath, 'utf8');

// Extract existing dict keys
const dictKeys = new Set();
const keyPattern = /(?:^|\n)\s*(?:['"]([^'"]+)['"]|(\w[\w\u00C0-\u024F\u0400-\u04FF\u0900-\u097F]*)):\s*\{\s*en:/g;
let match;
while ((match = keyPattern.exec(dictContent)) !== null) {
  const key = (match[1] || match[2] || '').toLowerCase();
  if (key) dictKeys.add(key);
}

// Extract deck words
const deckWords = new Map();
for (const card of deck) {
  for (const w of (card.target || '').split(/\s+/).filter(Boolean)) {
    const clean = w.replace(/[.,!?;:""''()—–\-…¿¡«»\[\]{}]/g, '').trim().toLowerCase();
    if (clean && clean.length > 0) {
      deckWords.set(clean, (deckWords.get(clean) || 0) + 1);
    }
  }
}

// Find missing
const missing = [];
for (const [word, count] of deckWords) {
  if (!dictKeys.has(word)) missing.push({ word, count });
}
missing.sort((a, b) => b.count - a.count);

console.log(`Deck: ${deck.length} cards, ${deckWords.size} unique words`);
console.log(`Dict: ${dictKeys.size} entries`);
console.log(`Missing: ${missing.length} words`);

// ═══════════════════════════════════════════════════════════
// COMPREHENSIVE TRANSLATION MAPS
// ═══════════════════════════════════════════════════════════

const DE_TRANSLATIONS = {
  // ── Pronouns & determiners ─────────────────────────────
  ich: ['I', 'pron'], du: ['you (informal)', 'pron'], er: ['he', 'pron'], sie: ['she/they/you (formal)', 'pron'],
  es: ['it', 'pron'], wir: ['we', 'pron'], ihr: ['you (plural)/her', 'pron'], man: ['one/you (generic)', 'pron'],
  mich: ['me (acc)', 'pron'], mir: ['me (dat)', 'pron'], dich: ['you (acc)', 'pron'], dir: ['you (dat)', 'pron'],
  sich: ['oneself', 'pron'], uns: ['us', 'pron'], euch: ['you all', 'pron'], ihnen: ['them (dat)', 'pron'],
  ihn: ['him (acc)', 'pron'], ihm: ['him (dat)', 'pron'],
  mein: ['my', 'det'], dein: ['your (informal)', 'det'], sein: ['his/to be', 'det'],
  meine: ['my (fem/pl)', 'det'], deine: ['your (fem/pl)', 'det'], seine: ['his (fem/pl)', 'det'],
  meinen: ['my (acc masc)', 'det'], meiner: ['my (gen/dat fem)', 'det'], meinem: ['my (dat masc/neut)', 'det'],
  unsere: ['our', 'det'], unserer: ['our (gen/dat)', 'det'], unserem: ['our (dat)', 'det'], unseren: ['our (acc/dat pl)', 'det'],
  ihre: ['her/their/your', 'det'], ihrem: ['her/their (dat)', 'det'], ihren: ['her/their (acc/dat)', 'det'], ihrer: ['her/their (gen/dat)', 'det'],
  dieser: ['this (masc/gen fem)', 'det'], diese: ['this (fem/pl)', 'det'], dieses: ['this (neut/gen)', 'det'], diesem: ['this (dat)', 'det'], diesen: ['this (acc masc/dat pl)', 'det'],
  jeder: ['every (masc)', 'det'], jede: ['every (fem)', 'det'], jedes: ['every (neut)', 'det'], jedem: ['every (dat)', 'det'], jeden: ['every (acc)', 'det'],
  alle: ['all', 'det'], aller: ['all (gen)', 'det'], allem: ['all (dat)', 'det'], allen: ['all (dat pl)', 'det'],
  welcher: ['which (masc)', 'det'], welche: ['which (fem/pl)', 'det'], welches: ['which (neut)', 'det'],
  kein: ['no/not a', 'det'], keine: ['no (fem/pl)', 'det'], keinen: ['no (acc masc)', 'det'], keinem: ['no (dat)', 'det'], keiner: ['no (gen/dat fem)', 'det'],
  // ── Articles ──────────────────────────────────────────
  der: ['the (masc)', 'art'], die: ['the (fem/pl)', 'art'], das: ['the (neut)', 'art'],
  den: ['the (acc masc/dat pl)', 'art'], dem: ['the (dat)', 'art'], des: ['the (gen)', 'art'],
  ein: ['a/an (masc/neut)', 'art'], eine: ['a/an (fem)', 'art'], einem: ['a/an (dat)', 'art'],
  einer: ['a/an (gen/dat fem)', 'art'], eines: ['a/an (gen)', 'art'], einen: ['a/an (acc masc)', 'art'],
  // ── Conjunctions ──────────────────────────────────────
  und: ['and', 'conj'], oder: ['or', 'conj'], aber: ['but', 'conj'], denn: ['because/for', 'conj'],
  sondern: ['but rather', 'conj'], weil: ['because', 'conj'], dass: ['that', 'conj'],
  wenn: ['when/if', 'conj'], als: ['when (past)/than/as', 'conj'], ob: ['whether', 'conj'],
  obwohl: ['although', 'conj'], während: ['while/during', 'conj'], bevor: ['before', 'conj'],
  nachdem: ['after', 'conj'], seit: ['since', 'conj'], bis: ['until', 'conj'],
  damit: ['so that', 'conj'], falls: ['in case', 'conj'], sobald: ['as soon as', 'conj'],
  solange: ['as long as', 'conj'], sodass: ['so that', 'conj'], indem: ['by (doing)', 'conj'],
  anstatt: ['instead of', 'conj'], sowohl: ['both (sowohl...als auch)', 'conj'],
  weder: ['neither (weder...noch)', 'conj'], entweder: ['either (entweder...oder)', 'conj'],
  zwar: ['indeed/admittedly', 'adv'], dennoch: ['nevertheless', 'adv'], trotzdem: ['nevertheless', 'adv'],
  allerdings: ['however', 'adv'], außerdem: ['moreover', 'adv'], deshalb: ['therefore', 'adv'],
  deswegen: ['because of that', 'adv'], darum: ['therefore', 'adv'], daher: ['therefore', 'adv'],
  folglich: ['consequently', 'adv'], stattdessen: ['instead', 'adv'], insofern: ['insofar', 'adv'],
  nichtsdestotrotz: ['nevertheless', 'adv'], gleichwohl: ['nevertheless', 'adv'],
  zudem: ['additionally', 'adv'], überdies: ['moreover', 'adv'], hingegen: ['on the other hand', 'adv'],
  // ── Prepositions ──────────────────────────────────────
  in: ['in', 'prep'], an: ['at/on', 'prep'], auf: ['on/upon', 'prep'], über: ['over/about', 'prep'],
  unter: ['under', 'prep'], vor: ['before/in front of', 'prep'], hinter: ['behind', 'prep'],
  neben: ['next to', 'prep'], zwischen: ['between', 'prep'], mit: ['with', 'prep'],
  von: ['from/of', 'prep'], zu: ['to', 'prep'], aus: ['out of/from', 'prep'],
  bei: ['at/near', 'prep'], nach: ['after/to', 'prep'], für: ['for', 'prep'],
  durch: ['through', 'prep'], gegen: ['against', 'prep'], ohne: ['without', 'prep'],
  um: ['around/at', 'prep'], trotz: ['despite', 'prep'], wegen: ['because of', 'prep'],
  statt: ['instead of', 'prep'], während: ['during', 'prep'], innerhalb: ['within', 'prep'],
  außerhalb: ['outside of', 'prep'], laut: ['according to', 'prep'], gemäß: ['according to', 'prep'],
  bezüglich: ['regarding', 'prep'], gegenüber: ['opposite/towards', 'prep'],
  // ── Common verbs (conjugated forms) ───────────────────
  ist: ['is', 'v'], hat: ['has', 'v'], war: ['was', 'v'], sind: ['are', 'v'],
  wird: ['becomes/will', 'v'], kann: ['can', 'v'], muss: ['must', 'v'], soll: ['should', 'v'],
  will: ['wants', 'v'], darf: ['may', 'v'], mag: ['likes/may', 'v'],
  habe: ['have', 'v'], hast: ['have (you)', 'v'], habt: ['have (you pl)', 'v'],
  hatte: ['had', 'v'], wurden: ['were (passive)', 'v'], wurde: ['was (passive)', 'v'],
  wäre: ['would be', 'v'], hätte: ['would have', 'v'], könnte: ['could', 'v'],
  müsste: ['would have to', 'v'], sollte: ['should', 'v'], würde: ['would', 'v'],
  käme: ['would come', 'v'], ginge: ['would go', 'v'], wüsste: ['would know', 'v'],
  gäbe: ['would give', 'v'], stünde: ['would stand', 'v'], ließe: ['would let', 'v'],
  bin: ['am', 'v'], bist: ['are (you)', 'v'], seid: ['are (you pl)', 'v'],
  waren: ['were', 'v'], sei: ['be (subjunctive)', 'v'], seien: ['be (pl subj)', 'v'],
  wären: ['would be (pl)', 'v'], hätten: ['would have (pl)', 'v'], könnten: ['could (pl)', 'v'],
  gibt: ['gives/there is', 'v'], geht: ['goes', 'v'], kommt: ['comes', 'v'],
  macht: ['makes/does', 'v'], sagt: ['says', 'v'], steht: ['stands', 'v'],
  liegt: ['lies', 'v'], bleibt: ['stays', 'v'], fährt: ['drives', 'v'],
  nimmt: ['takes', 'v'], spricht: ['speaks', 'v'], liest: ['reads', 'v'],
  sieht: ['sees', 'v'], läuft: ['runs', 'v'], fällt: ['falls', 'v'],
  hält: ['holds', 'v'], schläft: ['sleeps', 'v'], trägt: ['carries/wears', 'v'],
  weiß: ['knows', 'v'], kennt: ['knows (person)', 'v'], findet: ['finds', 'v'],
  braucht: ['needs', 'v'], bringt: ['brings', 'v'], denkt: ['thinks', 'v'],
  glaubt: ['believes', 'v'], hilft: ['helps', 'v'], beginnt: ['begins', 'v'],
  gefällt: ['pleases', 'v'], gehört: ['belongs/heard', 'v'], heißt: ['is called', 'v'],
  // Past participles
  gewesen: ['been', 'v'], gehabt: ['had', 'v'], gemacht: ['made/done', 'v'],
  gesagt: ['said', 'v'], gegeben: ['given', 'v'], gekommen: ['come', 'v'],
  gegangen: ['gone', 'v'], gesehen: ['seen', 'v'], gefunden: ['found', 'v'],
  genommen: ['taken', 'v'], geschrieben: ['written', 'v'], gelesen: ['read', 'v'],
  gesprochen: ['spoken', 'v'], getrunken: ['drunk', 'v'], gegessen: ['eaten', 'v'],
  gefahren: ['driven', 'v'], gelaufen: ['run', 'v'], geschlafen: ['slept', 'v'],
  gestorben: ['died', 'v'], geboren: ['born', 'v'], geblieben: ['stayed', 'v'],
  geworden: ['become', 'v'], vergessen: ['forgotten', 'v'], verstanden: ['understood', 'v'],
  bekommen: ['received', 'v'], angefangen: ['started', 'v'], aufgehört: ['stopped', 'v'],
  // ── Common adverbs ────────────────────────────────────
  nicht: ['not', 'adv'], sehr: ['very', 'adv'], schon: ['already', 'adv'],
  noch: ['still/yet', 'adv'], auch: ['also', 'adv'], hier: ['here', 'adv'],
  dort: ['there', 'adv'], heute: ['today', 'adv'], morgen: ['tomorrow', 'adv'],
  gestern: ['yesterday', 'adv'], immer: ['always', 'adv'], nie: ['never', 'adv'],
  oft: ['often', 'adv'], fast: ['almost', 'adv'], nur: ['only', 'adv'],
  ganz: ['quite/whole', 'adv'], wirklich: ['really', 'adv'], besonders: ['especially', 'adv'],
  vielleicht: ['perhaps', 'adv'], wahrscheinlich: ['probably', 'adv'], ziemlich: ['quite', 'adv'],
  leider: ['unfortunately', 'adv'], gern: ['gladly', 'adv'], gerne: ['gladly', 'adv'],
  lieber: ['rather', 'adv'], sofort: ['immediately', 'adv'], bald: ['soon', 'adv'],
  endlich: ['finally', 'adv'], plötzlich: ['suddenly', 'adv'], eigentlich: ['actually', 'adv'],
  natürlich: ['naturally', 'adv'], selbstverständlich: ['of course', 'adv'],
  bereits: ['already', 'adv'], mindestens: ['at least', 'adv'], höchstens: ['at most', 'adv'],
  ungefähr: ['approximately', 'adv'], etwa: ['about/approximately', 'adv'],
  sogar: ['even', 'adv'], trotzdem: ['nevertheless', 'adv'], einfach: ['simply', 'adv'],
  genau: ['exactly', 'adv'], richtig: ['correctly', 'adv'], lang: ['long', 'adv'],
  kurz: ['briefly/short', 'adv'], oben: ['above', 'adv'], unten: ['below', 'adv'],
  links: ['left', 'adv'], rechts: ['right', 'adv'], geradeaus: ['straight ahead', 'adv'],
  draußen: ['outside', 'adv'], drinnen: ['inside', 'adv'],
  zusammen: ['together', 'adv'], allein: ['alone', 'adv'], gemeinsam: ['together/jointly', 'adv'],
  zunächst: ['first/initially', 'adv'], damals: ['back then', 'adv'],
  seitdem: ['since then', 'adv'], inzwischen: ['meanwhile', 'adv'],
  manchmal: ['sometimes', 'adv'], meistens: ['mostly', 'adv'], selten: ['rarely', 'adv'],
  // ── Question words ────────────────────────────────────
  was: ['what', 'pron'], wer: ['who', 'pron'], wo: ['where', 'adv'],
  wie: ['how', 'adv'], warum: ['why', 'adv'], wann: ['when', 'adv'],
  wohin: ['where to', 'adv'], woher: ['where from', 'adv'],
  welch: ['which', 'det'], wessen: ['whose', 'pron'],
  // ── Common nouns ──────────────────────────────────────
  zeit: ['time', 'n'], jahr: ['year', 'n'], tag: ['day', 'n'], woche: ['week', 'n'],
  monat: ['month', 'n'], stunde: ['hour', 'n'], minute: ['minute', 'n'],
  morgen: ['morning', 'n'], abend: ['evening', 'n'], nacht: ['night', 'n'],
  menschen: ['people', 'n'], mensch: ['person', 'n'], frau: ['woman/Mrs.', 'n'], mann: ['man', 'n'],
  kind: ['child', 'n'], kinder: ['children', 'n'], leute: ['people', 'n'],
  haus: ['house', 'n'], wohnung: ['apartment', 'n'], stadt: ['city', 'n'],
  land: ['country/land', 'n'], straße: ['street', 'n'], platz: ['place/square', 'n'],
  schule: ['school', 'n'], universität: ['university', 'n'], büro: ['office', 'n'],
  arbeit: ['work', 'n'], geld: ['money', 'n'], weg: ['way/path', 'n'],
  wasser: ['water', 'n'], essen: ['food/to eat', 'n'], brot: ['bread', 'n'],
  auto: ['car', 'n'], tür: ['door', 'n'], fenster: ['window', 'n'],
  tisch: ['table', 'n'], stuhl: ['chair', 'n'], bett: ['bed', 'n'],
  buch: ['book', 'n'], brief: ['letter', 'n'], zeitung: ['newspaper', 'n'],
  sprache: ['language', 'n'], wort: ['word', 'n'], frage: ['question', 'n'],
  antwort: ['answer', 'n'], problem: ['problem', 'n'], lösung: ['solution', 'n'],
  freund: ['friend', 'n'], familie: ['family', 'n'], eltern: ['parents', 'n'],
  mutter: ['mother', 'n'], vater: ['father', 'n'], bruder: ['brother', 'n'],
  schwester: ['sister', 'n'], tochter: ['daughter', 'n'], sohn: ['son', 'n'],
  arzt: ['doctor', 'n'], lehrer: ['teacher', 'n'], schüler: ['student', 'n'],
  kollege: ['colleague', 'n'], nachbar: ['neighbor', 'n'], chef: ['boss', 'n'],
  hund: ['dog', 'n'], katze: ['cat', 'n'], baum: ['tree', 'n'], blume: ['flower', 'n'],
  garten: ['garden', 'n'], park: ['park', 'n'], wald: ['forest', 'n'],
  berg: ['mountain', 'n'], see: ['lake/sea', 'n'], fluss: ['river', 'n'],
  meer: ['sea', 'n'], strand: ['beach', 'n'], insel: ['island', 'n'],
  hotel: ['hotel', 'n'], restaurant: ['restaurant', 'n'], geschäft: ['shop/business', 'n'],
  markt: ['market', 'n'], kirche: ['church', 'n'], museum: ['museum', 'n'],
  bahnhof: ['train station', 'n'], flughafen: ['airport', 'n'],
  zug: ['train', 'n'], bus: ['bus', 'n'], fahrrad: ['bicycle', 'n'],
  reise: ['trip/journey', 'n'], urlaub: ['vacation', 'n'], ferien: ['holidays', 'n'],
  küche: ['kitchen', 'n'], schlafzimmer: ['bedroom', 'n'], wohnzimmer: ['living room', 'n'],
  // ── Common adjectives ─────────────────────────────────
  gut: ['good', 'adj'], schlecht: ['bad', 'adj'], groß: ['big/tall', 'adj'],
  klein: ['small', 'adj'], alt: ['old', 'adj'], neu: ['new', 'adj'],
  jung: ['young', 'adj'], schön: ['beautiful', 'adj'], hübsch: ['pretty', 'adj'],
  lang: ['long', 'adj'], kurz: ['short', 'adj'], hoch: ['high/tall', 'adj'],
  tief: ['deep', 'adj'], breit: ['wide', 'adj'], schnell: ['fast', 'adj'],
  langsam: ['slow', 'adj'], warm: ['warm', 'adj'], kalt: ['cold', 'adj'],
  heiß: ['hot', 'adj'], schwer: ['heavy/difficult', 'adj'], leicht: ['light/easy', 'adj'],
  wichtig: ['important', 'adj'], richtig: ['correct', 'adj'], falsch: ['wrong/false', 'adj'],
  möglich: ['possible', 'adj'], nötig: ['necessary', 'adj'], frei: ['free', 'adj'],
  voll: ['full', 'adj'], leer: ['empty', 'adj'], offen: ['open', 'adj'],
  geschlossen: ['closed', 'adj'], teuer: ['expensive', 'adj'], billig: ['cheap', 'adj'],
  freundlich: ['friendly', 'adj'], nett: ['nice', 'adj'], ruhig: ['calm/quiet', 'adj'],
  laut: ['loud', 'adj'], dunkel: ['dark', 'adj'], hell: ['bright/light', 'adj'],
  stark: ['strong', 'adj'], schwach: ['weak', 'adj'], gesund: ['healthy', 'adj'],
  krank: ['sick', 'adj'], müde: ['tired', 'adj'], glücklich: ['happy', 'adj'],
  traurig: ['sad', 'adj'], böse: ['angry/evil', 'adj'], lustig: ['funny', 'adj'],
  interessant: ['interesting', 'adj'], langweilig: ['boring', 'adj'],
  // ── Common inflected forms ────────────────────────────
  neue: ['new', 'adj'], neuen: ['new (inflected)', 'adj'], neues: ['new (neut)', 'adj'], neuem: ['new (dat)', 'adj'], neuer: ['new (comp/masc)', 'adj'],
  guten: ['good (inflected)', 'adj'], guter: ['good (masc/comp)', 'adj'], gutes: ['good (neut)', 'adj'], gutem: ['good (dat)', 'adj'],
  große: ['big (inflected)', 'adj'], großen: ['big (inflected)', 'adj'], großer: ['big (masc/comp)', 'adj'], großes: ['big (neut)', 'adj'],
  kleine: ['small (inflected)', 'adj'], kleinen: ['small (inflected)', 'adj'], kleiner: ['small (masc/comp)', 'adj'], kleines: ['small (neut)', 'adj'],
  alte: ['old (inflected)', 'adj'], alten: ['old (inflected)', 'adj'], alter: ['old (masc/comp)', 'adj'], altes: ['old (neut)', 'adj'],
  letzten: ['last (inflected)', 'adj'], letzte: ['last', 'adj'], letzter: ['last (masc)', 'adj'], letztes: ['last (neut)', 'adj'],
  ersten: ['first (inflected)', 'adj'], erste: ['first', 'adj'], erster: ['first (masc)', 'adj'], erstes: ['first (neut)', 'adj'],
  schöne: ['beautiful', 'adj'], schönen: ['beautiful (inflected)', 'adj'], schöner: ['more beautiful', 'adj'],
  anderen: ['other (inflected)', 'adj'], andere: ['other', 'adj'], anderer: ['other (masc)', 'adj'], anderes: ['other (neut)', 'adj'],
  // ── Numbers ───────────────────────────────────────────
  eins: ['one', 'num'], zwei: ['two', 'num'], drei: ['three', 'num'], vier: ['four', 'num'],
  fünf: ['five', 'num'], sechs: ['six', 'num'], sieben: ['seven', 'num'], acht: ['eight', 'num'],
  neun: ['nine', 'num'], zehn: ['ten', 'num'], elf: ['eleven', 'num'], zwölf: ['twelve', 'num'],
  hundert: ['hundred', 'num'], tausend: ['thousand', 'num'],
  // ── Common verbs (infinitive) ─────────────────────────
  gehen: ['to go', 'v'], kommen: ['to come', 'v'], machen: ['to make/do', 'v'],
  sagen: ['to say', 'v'], geben: ['to give', 'v'], nehmen: ['to take', 'v'],
  fahren: ['to drive', 'v'], lesen: ['to read', 'v'], schreiben: ['to write', 'v'],
  sprechen: ['to speak', 'v'], trinken: ['to drink', 'v'], essen: ['to eat', 'v'],
  schlafen: ['to sleep', 'v'], laufen: ['to run/walk', 'v'], spielen: ['to play', 'v'],
  arbeiten: ['to work', 'v'], lernen: ['to learn', 'v'], wohnen: ['to live/reside', 'v'],
  leben: ['to live', 'v'], kaufen: ['to buy', 'v'], verkaufen: ['to sell', 'v'],
  suchen: ['to search', 'v'], finden: ['to find', 'v'], bringen: ['to bring', 'v'],
  helfen: ['to help', 'v'], denken: ['to think', 'v'], glauben: ['to believe', 'v'],
  wissen: ['to know', 'v'], kennen: ['to know (person)', 'v'], verstehen: ['to understand', 'v'],
  brauchen: ['to need', 'v'], beginnen: ['to begin', 'v'], anfangen: ['to start', 'v'],
  aufhören: ['to stop', 'v'], bleiben: ['to stay', 'v'], stehen: ['to stand', 'v'],
  sitzen: ['to sit', 'v'], liegen: ['to lie', 'v'], fallen: ['to fall', 'v'],
  tragen: ['to carry/wear', 'v'], halten: ['to hold/stop', 'v'], lassen: ['to let/leave', 'v'],
  rufen: ['to call', 'v'], fragen: ['to ask', 'v'], antworten: ['to answer', 'v'],
  erzählen: ['to tell/narrate', 'v'], erklären: ['to explain', 'v'], zeigen: ['to show', 'v'],
  versuchen: ['to try', 'v'], vergessen: ['to forget', 'v'], erinnern: ['to remember', 'v'],
  möchten: ['would like to', 'v'], müssen: ['must/to have to', 'v'], können: ['can/to be able to', 'v'],
  sollen: ['should/to be supposed to', 'v'], dürfen: ['may/to be allowed to', 'v'],
  wollen: ['to want', 'v'], werden: ['to become/will', 'v'], haben: ['to have', 'v'],
  sein: ['to be', 'v'],
  // ── More everyday words ───────────────────────────────
  ja: ['yes', 'adv'], nein: ['no', 'adv'], bitte: ['please', 'adv'], danke: ['thanks', 'adv'],
  so: ['so/thus', 'adv'], da: ['there/since', 'adv'], dann: ['then', 'adv'],
  doch: ['yet/indeed', 'part'], mal: ['once/time', 'part'], eben: ['just/simply', 'part'],
  halt: ['just (particle)', 'part'], wohl: ['probably/well', 'part'],
  dazu: ['in addition/to that', 'adv'], dabei: ['at the same time', 'adv'],
  davon: ['of it/from that', 'adv'], dafür: ['for it', 'adv'], dagegen: ['against it', 'adv'],
  darauf: ['on it/thereupon', 'adv'], darüber: ['about it', 'adv'], darunter: ['under it', 'adv'],
  damit: ['with it/so that', 'adv'], darin: ['in it', 'adv'], daraus: ['from it', 'adv'],
  worüber: ['about what', 'adv'], woran: ['at what', 'adv'], wofür: ['for what', 'adv'],
  // ── More nouns ────────────────────────────────────────
  beispiel: ['example', 'n'], ergebnis: ['result', 'n'], entscheidung: ['decision', 'n'],
  erfahrung: ['experience', 'n'], möglichkeit: ['possibility', 'n'], bedeutung: ['meaning/significance', 'n'],
  entwicklung: ['development', 'n'], verantwortung: ['responsibility', 'n'],
  vorschlag: ['suggestion', 'n'], versuch: ['attempt', 'n'], erfolg: ['success', 'n'],
  eindruck: ['impression', 'n'], zukunft: ['future', 'n'], vergangenheit: ['past', 'n'],
  anfang: ['beginning', 'n'], ende: ['end', 'n'], mitte: ['middle', 'n'],
  seite: ['side/page', 'n'], stelle: ['place/position', 'n'], grund: ['reason/ground', 'n'],
  recht: ['right/law', 'n'], pflicht: ['duty', 'n'], aufgabe: ['task', 'n'],
  ziel: ['goal', 'n'], richtung: ['direction', 'n'], ordnung: ['order', 'n'],
  sicherheit: ['safety/security', 'n'], freiheit: ['freedom', 'n'], gesundheit: ['health', 'n'],
  bildung: ['education', 'n'], wissenschaft: ['science', 'n'], forschung: ['research', 'n'],
  technik: ['technology', 'n'], kultur: ['culture', 'n'], kunst: ['art', 'n'],
  musik: ['music', 'n'], sport: ['sport', 'n'], natur: ['nature', 'n'],
  umwelt: ['environment', 'n'], wetter: ['weather', 'n'], sonne: ['sun', 'n'],
  regen: ['rain', 'n'], schnee: ['snow', 'n'], wind: ['wind', 'n'],
  licht: ['light', 'n'], farbe: ['color', 'n'], form: ['form/shape', 'n'],
  // ── Useful phrases/particles ──────────────────────────
  viel: ['much/a lot', 'adj'], wenig: ['little/few', 'adj'], mehr: ['more', 'adj'],
  weniger: ['less/fewer', 'adj'], viele: ['many', 'adj'], einige: ['some/several', 'adj'],
  jemand: ['someone', 'pron'], niemand: ['nobody', 'pron'], etwas: ['something', 'pron'],
  nichts: ['nothing', 'pron'], alles: ['everything', 'pron'],
  selbst: ['self/even', 'pron'], wieder: ['again', 'adv'],
};

// IPA generator for German
function generateGermanIPA(word) {
  let ipa = word.toLowerCase();
  ipa = ipa
    .replace(/tsch/g, 'tʃ')
    .replace(/sch/g, 'ʃ')
    .replace(/^st/g, 'ʃt').replace(/^sp/g, 'ʃp')
    .replace(/ck/g, 'k')
    .replace(/tz/g, 'ts')
    .replace(/pf/g, 'pf')
    .replace(/ß/g, 's')
    .replace(/ei/g, 'aɪ')
    .replace(/ie/g, 'iː')
    .replace(/eu/g, 'ɔʏ').replace(/äu/g, 'ɔʏ')
    .replace(/au/g, 'aʊ')
    .replace(/ä/g, 'ɛ').replace(/ö/g, 'ø').replace(/ü/g, 'y')
    .replace(/aa/g, 'aː').replace(/ee/g, 'eː').replace(/oo/g, 'oː')
    .replace(/z/g, 'ts')
    .replace(/v/g, 'f')
    .replace(/w/g, 'v')
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/qu/g, 'kv')
    .replace(/ch/g, (m, i, s) => {
      const prev = s[i - 1];
      return /[aouAOU]/.test(prev) ? 'x' : 'ç';
    })
    .replace(/er$/, 'ɐ')
    .replace(/en$/, 'ən')
    .replace(/el$/, 'əl')
    .replace(/em$/, 'əm')
    .replace(/e$/, 'ə')
    .replace(/ng/g, 'ŋ')
    .replace(/nk/g, 'ŋk')
    .replace(/j/g, 'j');
  return ipa;
}

// For the translation map, just use DE_TRANSLATIONS for now. Other languages would have their own maps.
const TRANSLATION_MAPS = { de: DE_TRANSLATIONS };
const transMap = TRANSLATION_MAPS[lang] || {};

// Generate entries
const newEntries = [];
let fromMap = 0, fromInfer = 0;

for (const { word, count } of missing) {
  if (/^\d+$/.test(word) || word.length < 2) continue;

  let en, pos;
  if (transMap[word]) {
    [en, pos] = transMap[word];
    fromMap++;
  } else {
    // Try to detect POS from word patterns
    if (lang === 'de') {
      if (/en$/.test(word) && word.length > 4) { pos = 'v'; en = 'to ' + word; }
      else if (/(ung|heit|keit|schaft|nis|tum)$/.test(word)) { pos = 'n'; en = word; }
      else if (/(lich|ig|isch|bar|sam|haft|los)$/.test(word)) { pos = 'adj'; en = word; }
      else { pos = 'n'; en = word; }
    } else {
      pos = 'n'; en = word;
    }
    fromInfer++;
  }

  const ipa = lang === 'de' ? generateGermanIPA(word) : word;
  newEntries.push({ word, en, ipa, pos });
}

console.log(`\nGenerated ${newEntries.length} entries (${fromMap} from map, ${fromInfer} inferred)`);

if (doWrite) {
  // Find insertion point
  const insertPoint = dictContent.lastIndexOf('};');
  if (insertPoint === -1) {
    console.error('Could not find DICT closing brace');
    process.exit(1);
  }

  const lines = newEntries.map(e => {
    const key = /['\s\-]/.test(e.word) || /^\d/.test(e.word) ? `'${e.word}'` : e.word;
    const enVal = e.en.replace(/'/g, "\\'");
    return `  ${key}: { en: '${enVal}', ipa: '${e.ipa}', pos: '${e.pos}' },`;
  });

  const newContent = dictContent.slice(0, insertPoint) +
    '\n  // ── Auto-expanded entries ──────────────────────────────\n' +
    lines.join('\n') + '\n' +
    dictContent.slice(insertPoint);

  fs.writeFileSync(dictPath, newContent);
  console.log(`Written ${newEntries.length} entries to ${dictPath}`);
} else {
  console.log('\nSample entries:');
  for (const e of newEntries.slice(0, 30)) {
    console.log(`  ${e.word}: { en: '${e.en}', pos: '${e.pos}' }`);
  }
}

const projected = (dictKeys.size + newEntries.length) / deckWords.size * 100;
console.log(`\nProjected coverage: ${projected.toFixed(1)}% (${dictKeys.size + newEntries.length}/${deckWords.size})`);
