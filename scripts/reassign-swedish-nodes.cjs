#!/usr/bin/env node
/**
 * reassign-swedish-nodes.cjs
 *
 * Strategy:
 * 1. The 5 renamed theme nodes (01, 06, 07, 12, 17) had thematic content
 *    that now needs grammar-based reassignment.
 * 2. The other 30 nodes already have grammar-appropriate cards — keep those.
 * 3. Score cards from ALL nodes, but only force-reassign the 5 renamed nodes.
 *    For the other 30, only move a card if it scores drastically better elsewhere.
 * 4. After initial pass, rebalance to ensure 80–200 cards per node.
 *
 * Renamed nodes:
 *   01: "Greetings"       → "Personal pronouns & present tense"
 *   06: "Numbers & time"  → "Questions & interrogatives"
 *   07: "Food & ordering" → "Descriptions & adjectives"
 *   12: "Daily routine"   → "Reflexive verbs (sig)"
 *   17: "Directions"      → "Temporal expressions & adverbs"
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'swedish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
const originalDeck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// The 5 nodes that changed meaning
const RENAMED_NODES = new Set(['node-01', 'node-06', 'node-07', 'node-12', 'node-17']);

// ── Helpers ──────────────────────────────────────────────────────────────

function words(text) {
  return text.replace(/[.,!?;:'"()\-–—…«»""'']/g, ' ').split(/\s+/).filter(Boolean);
}

function countWords(text, re) {
  return words(text).filter(w => re.test(w)).length;
}

// ── Scoring ──────────────────────────────────────────────────────────────

function scoreCard(card) {
  const t = card.target || '';
  const e = card.english || '';
  const g = (card.grammar || '').toLowerCase();
  const tw = words(t);
  const tl = t.toLowerCase();
  const el = e.toLowerCase();

  const scores = {};
  for (let i = 1; i <= 35; i++) {
    scores[`node-${String(i).padStart(2, '0')}`] = 0;
  }
  const s = (n, pts) => { scores[n] += pts; };

  // ═══════════════════════════════════════════════════════════════════════
  // GRAMMAR TIP — strongest signal (20 pts)
  // ═══════════════════════════════════════════════════════════════════════
  if (g) {
    if (/\bpronoun|\bpresent\s+tense/.test(g) && !/perfect|perfekt/.test(g)) s('node-01', 20);
    if (/\bpresent\s+tense|regular\s+verb|-r\s+ending/.test(g) && !/perfect|perfekt/.test(g)) s('node-02', 18);
    if (/\bvara\b|\bha\b|\bto be\b|\bto have\b|\bär\b|\bhar\b/.test(g)) s('node-03', 20);
    if (/\barticle|\bgender|\ben\b|\bett\b/.test(g) && !/definite/.test(g)) s('node-04', 20);
    if (/\bword\s+order|\bV2\b|\binversion/.test(g)) s('node-05', 20);
    if (/\bquestion|\binterrogat|\bfråg/.test(g)) s('node-06', 20);
    if (/\badjective|\bdescription/.test(g) && !/compar|superlat/.test(g)) s('node-07', 18);
    if (/\bcommon\s+(express|phrase)|everyday|greeting|farewell/.test(g)) s('node-08', 18);
    if (/\bpreterit|\bsimple\s+past|\b-de\b|\b-te\b/.test(g)) s('node-09', 20);
    if (/\bobject\s+pronoun|\bhon[oa]m\b|\bdig\b|\bmig\b/.test(g)) s('node-10', 20);
    if (/\bmodal|\bkan\b|\bmåste\b|\bska\b|\bvill\b|\bbör\b|\bfår\b/.test(g)) s('node-11', 20);
    if (/\breflexive|\bsig\b/.test(g)) s('node-12', 20);
    if (/\bnegat|\binte\b/.test(g)) s('node-13', 20);
    if (/\bpreposition/.test(g)) s('node-14', 20);
    if (/\bcompar|\bsuperlat|\b-are\b|\b-ast\b/.test(g)) s('node-15', 20);
    if (/\bperfekt|\bsupinum|\bhar\s+/.test(g)) s('node-16', 20);
    if (/\btemporal|\badverb|\btime\s+express/.test(g)) s('node-17', 20);
    if (/\bsubordinat|\batt\b|\bom\b|\bnär\b/.test(g) && !/reported/.test(g)) s('node-18', 20);
    if (/\bimperative|\bcommand/.test(g)) s('node-19', 20);
    if (/\bdefinite|\bbestämd|\bdouble\s+definite/.test(g)) s('node-20', 20);
    if (/\brelative\s+clause|\bsom\b/.test(g)) s('node-21', 20);
    if (/\bpassive|\bpassiv/.test(g)) s('node-22', 20);
    if (/\bdeponent|\bs-verb/.test(g)) s('node-23', 20);
    if (/\bfuture|\bconditional|\bskulle\b|\bkommer\s+att\b/.test(g)) s('node-24', 20);
    if (/\bconnector|\bconjunction|\blinking/.test(g)) s('node-25', 20);
    if (/\bparticip/.test(g)) s('node-26', 20);
    if (/\breported\s+speech|\bindirect\s+speech/.test(g)) s('node-27', 20);
    if (/\bidiom/.test(g)) s('node-28', 20);
    if (/\bregister|\bformal|\binformal/.test(g)) s('node-29', 18);
    if (/\bparticle\s+verb|\bphrasal/.test(g)) s('node-30', 20);
    if (/\bcomplex\s+sentence|\badvanced\s+word\s+order/.test(g)) s('node-31', 18);
    if (/\bliterary|\barchaic|\bwritten/.test(g)) s('node-32', 18);
    if (/\bacademic|\bscientific|\bresearch/.test(g)) s('node-33', 18);
    if (/\bcultur|\btradition|\bcustom/.test(g)) s('node-34', 18);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SWEDISH MORPHOLOGY (target text) — 6–12 pts per feature
  // ═══════════════════════════════════════════════════════════════════════

  // ── Present tense: -r ending on verbs ──
  const PRESENT_RE = /^(arbetar|läser|skriver|pratar|äter|dricker|sover|springer|tycker|gillar|älskar|hatar|behöver|förstår|vet|ser|hör|känner|tänker|tror|börjar|slutar|stannar|sitter|står|ligger|går|kommer|bor|lever|spelar|sjunger|dansar|målar|lagar|bakar|tvättar|städar|handlar|köper|säljer|betalar|kostar|öppnar|stänger|väntar|hjälper|frågar|svarar|berättar|visar|tittar|lyssnar|vaknar|somnar|ringer|skickar|hämtar|lämnar|fyller|saknar|minns|glömmer|lovar|bestämmer|planerar|reser|flyger|åker|cyklar|promenerar|simmar|klättrar|studerar|undervisar|tränar|jobbar|fungerar|använder|försöker|klarar|lyckas|misslyckas|råkar|händer|finns|verkar|kallas|heter|betyder)$/i;
  const presentCount = tw.filter(w => PRESENT_RE.test(w)).length;
  if (presentCount >= 2) s('node-02', 8);
  else if (presentCount >= 1) s('node-02', 4);
  // Also: any verb ending in -ar, -er, -r (but not -de, -te, etc.)
  const genericPresent = tw.filter(w => w.length >= 4 && /[ae]r$/i.test(w) && !/der$|ter$|ner$/i.test(w)).length;
  if (genericPresent >= 3) s('node-02', 4);

  // ── Preteritum: -de/-te/-dde ──
  const PRETERIT_RE = /^(arbetade|läste|skrev|pratade|åt|drack|sov|sprang|tyckte|gillade|älskade|hatade|behövde|förstod|visste|såg|hörde|kände|tänkte|trodde|började|slutade|stannade|satt|stod|låg|gick|kom|bodde|levde|spelade|sjöng|dansade|målade|lagade|bakade|tvättade|städade|handlade|köpte|sålde|betalade|kostade|öppnade|stängde|väntade|hjälpte|frågade|svarade|berättade|visade|tittade|lyssnade|vaknade|somnade|ringde|skickade|hämtade|lämnade|fyllde|saknade|mindes|glömde|lovade|bestämde|planerade|reste|flög|åkte|cyklade|promenerade|simmade|klättrade|studerade|undervisade|tränade|jobbade|fungerade|använde|försökte|klarade|lyckades|misslyckades|råkade|hände|fanns|verkade|kallades)$/i;
  const pretCount = tw.filter(w => PRETERIT_RE.test(w)).length;
  if (pretCount >= 2) s('node-09', 8);
  else if (pretCount >= 1) s('node-09', 5);
  // Generic preteritum: -ade, -de, -te endings
  const genericPret = tw.filter(w => w.length >= 5 && /ade$|(?<=[^s])de$|(?<=[^in])te$/i.test(w)).length;
  if (genericPret >= 2) s('node-09', 4);
  else if (genericPret >= 1) s('node-09', 2);

  // ── Perfekt: har + supinum ──
  if (/\bhar\s+(arbetat|läst|skrivit|pratat|ätit|druckit|sovit|sprungit|tyckt|gillat|älskat|hatat|behövt|förstått|vetat|sett|hört|känt|tänkt|trott|börjat|slutat|stannat|suttit|stått|legat|gått|kommit|bott|levt|spelat|sjungit|dansat|målat|lagat|bakat|tvättat|städat|handlat|köpt|sålt|betalat|kostat|öppnat|stängt|väntat|hjälpt|frågat|svarat|berättat|visat|tittat|lyssnat|vaknat|somnat|ringt|skickat|hämtat|lämnat|fyllt|saknat|minns|glömt|lovat|bestämt|planerat|rest|flugit|åkt|cyklat|promenerat|simmat|klättrat|studerat|undervisat|tränat|jobbat|fungerat|använt|försökt|klarat|lyckats|misslyckats|råkat|hänt|funnits|verkats)\b/i.test(tl)) {
    s('node-16', 10);
  }
  // Broader: "har" followed by supinum-like words (-at, -it, -tt)
  if (/\bhar\s+\w+(at|it|tt)\b/i.test(tl)) s('node-16', 5);

  // ── Future: ska/kommer att + infinitive ──
  if (/\bska\s+/i.test(tl) && !/\bska\s+(jag|du|vi|ni|hon|han|de|man)\b/i.test(tl)) s('node-24', 4);
  if (/\bska\b/i.test(tl)) s('node-24', 3);
  if (/\bkommer\s+att\b/i.test(tl)) s('node-24', 8);

  // ── Conditional: skulle + infinitive ──
  if (/\bskulle\b/i.test(tl)) s('node-24', 8);

  // ── Modal: kan/måste/ska/vill/bör/får ──
  const MODAL_RE = /^(kan|kunde|måste|ska|skulle|vill|ville|bör|borde|får|fick)$/i;
  const modalCount = tw.filter(w => MODAL_RE.test(w)).length;
  if (modalCount >= 1) s('node-11', 6 + Math.min(modalCount, 2) * 2);

  // ── Passive: -s form or bli + participle ──
  const passiveSVerbs = tw.filter(w => w.length >= 5 && /[aeiouåäö][a-zåäö]*s$/i.test(w) &&
    /^(bygges|görs|säljs|köps|ges|tas|ses|hörs|öppnas|stängs|kallas|används|tillverkas|produceras|erbjuds|betalas|skrivs|läses|dricks|äts|visas|skickas|hämtas|lämnas|bestäms|planeras|skapas|utvecklas|utförs|betraktas|anses|uppfattas|beskrivs|förklaras|diskuteras|presenteras|analyseras|bedöms|godkänns|avvisas|publiceras|distribueras|levereras|installeras|repareras|underhålls|organiseras|finansieras|investeras)$/i.test(w)).length;
  if (passiveSVerbs > 0) s('node-22', 8);
  // bli + past participle
  if (/\b(bli|blev|blivit)\s+(byggd|gjord|såld|köpt|given|tagen|sedd|hörd|öppnad|stängd|kallad|använd|skriven|läst|drucken|äten|visad|skickad|hämtad|lämnad|bestämd|planerad|skapad|utvecklad|utförd|betraktad|ansedd|uppfattad|beskriven|förklarad|diskuterad|presenterad|analyserad|bedömd|godkänd|avvisad|publicerad)/i.test(tl)) {
    s('node-22', 10);
  }

  // ── Imperative: bare stem ──
  if (t.endsWith('!')) {
    s('node-19', 5);
    if (tw.length <= 4) s('node-19', 3);
  }
  // Imperatives often start with bare verb stems
  if (/^(arbeta|läs|skriv|prata|ät|drick|sov|spring|titta|lyssna|vakna|ring|skicka|hämta|lämna|fyll|stanna|öppna|stäng|vänta|hjälp|fråga|svara|berätta|visa|kom|gå|åk|spring|sitt|stå|ligg|ta|ge|var|ha|sluta|börja|kör|flytta|res|sätt|lägg|häng|håll)\s/i.test(tl)) {
    s('node-19', 5);
  }

  // ── Definite suffix: -en/-et/-na ──
  const DEF_SUFFIXES = /^(boken|huset|barnen|mannen|kvinnan|flickan|pojken|stolen|bordet|fönstret|golvet|taket|rummet|köket|badrummet|sovrummet|trädgården|gatan|vägen|bilen|bussen|tåget|flygplanet|sjukhuset|skolan|universitetet|biblioteket|museet|kyrkan|slottet|havet|sjön|floden|berget|skogen|parken|stranden|ön|staden|landet|världen|familjen|vännen|grannen|chefen|läraren|läkaren|polisen|kocken|konstnären|författaren|musikern|politikern|journalisten|forskaren|doktorn|professorn|studenten|patienten|kunden|gästen|ägaren|vinnaren|förloraren|ledaren|dörren|nyckeln|telefonen|datorn|tidningen|brevet|paketet|pengarna|maten|katten|hunden|fågeln|fisken|hästen|blomman|trädet|solen|månen|stjärnan|vädret|regnet|snön|vinden|morgonen|kvällen|natten|dagen|veckan|månaden|året)$/i;
  const defCount = tw.filter(w => DEF_SUFFIXES.test(w)).length;
  if (defCount >= 2) s('node-20', 6);
  else if (defCount >= 1) s('node-20', 3);
  // Generic definite: -en, -et, -na endings on longer words
  const genericDef = tw.filter(w => w.length >= 5 && /(en|et|na|erna|orna)$/i.test(w)).length;
  if (genericDef >= 3) s('node-20', 4);

  // ── Double definite: den/det/de + adj-a + noun-en/et ──
  if (/\b(den|det|de)\s+\w+a\s+\w+(en|et|na|erna|orna)\b/i.test(tl)) s('node-20', 8);

  // ── S-verbs (deponent): -s ending with active meaning ──
  const DEPONENT_RE = /^(minnas|finnas|hoppas|lyckas|misslyckas|låtsas|andas|kräkas|umgås|svettas|synas|trivas|töras|brottas|slåss|träffas|ses|höras|kännas|verkas|tyckas|fattas|behövas)$/i;
  const deponentCount = tw.filter(w => DEPONENT_RE.test(w)).length;
  if (deponentCount > 0) s('node-23', 8 + Math.min(deponentCount, 2) * 2);

  // ── Subordinate clauses ──
  if (/\batt\s+(jag|du|han|hon|vi|ni|de|man)\s+/i.test(tl)) s('node-18', 6);
  if (/\b(om|när|medan|eftersom|innan|efter\s+att|trots\s+att|för\s+att|så\s+att)\b/i.test(tl)) s('node-18', 6);

  // ── Relative clauses: som ──
  if (/\bsom\s+(jag|du|han|hon|vi|ni|de|man)\b/i.test(tl)) s('node-21', 7);
  if (/\w+\s+som\s+\w+/i.test(tl) && tw.length >= 5) s('node-21', 4);

  // ── Comparative: -are + än, mer + adj ──
  if (/\bän\b/i.test(tl)) s('node-15', 6);
  if (/\b\w+are\s+än\b/i.test(tl)) s('node-15', 8);
  if (/\bmer\s+\w+/i.test(tl) && /\bän\b/i.test(tl)) s('node-15', 6);
  // Superlative: -ast, mest + adj
  if (/\b\w+ast(e|a)?\b/i.test(tl) && tw.length >= 4) s('node-15', 5);
  if (/\bmest\b/i.test(tl)) s('node-15', 5);

  // ── Reflexive: sig ──
  if (/\bsig\b/i.test(tl)) s('node-12', 10);
  // Common reflexive verbs with sig
  if (/\b(tvättar sig|klär sig|känner sig|sätter sig|lägger sig|bestämmer sig|gifter sig|intresserar sig|beter sig|skyndar sig|oroar sig|förbereder sig|anmäler sig|föreställer sig|uttrycker sig|ägnar sig|anpassar sig)\b/i.test(tl)) {
    s('node-12', 12);
  }

  // ── Particle verbs: verb + particle ──
  const PARTICLE_VERBS = /\b(ta hand om|gå ut|komma in|komma tillbaka|ge upp|ta av|ta på|sätta på|stänga av|gå med|stå ut|ta reda på|se ut|komma ihåg|bryta ut|gå sönder|hålla med|gå igenom|se fram emot|ta itu med|hålla på|slå upp|titta upp|ta emot|ge sig av|stå kvar|gå vidare|bli av|ta bort|fylla i|ta upp|lägga ner|ställa till|dra åt|säga till|räkna ut|tänka efter|passa på|komma på|se efter|ta över|ge tillbaka|hålla fast|sätta igång|lägga till|ta med|stå för|gå före|komma fram|gå bort|se till|ta slut)\b/i;
  if (PARTICLE_VERBS.test(tl)) s('node-30', 10);

  // ── Questions ──
  if (t.includes('?')) s('node-06', 6);
  if (/\b(vad|var|vem|vilken|vilka|vilket|hur|varför|när|vart)\b/i.test(tl)) s('node-06', 4);

  // ── Personal pronouns (for node-01) ──
  const PRONOUN_RE = /^(jag|du|han|hon|vi|ni|de|den|det|mig|dig|honom|henne|oss|er|dem|min|mitt|mina|din|ditt|dina|hans|hennes|vår|vårt|våra|er|ert|era|deras|sin|sitt|sina|man|sig|ens)$/i;
  const pronCount = tw.filter(w => PRONOUN_RE.test(w)).length;
  if (pronCount >= 3) s('node-01', 6);
  else if (pronCount >= 2) s('node-01', 3);

  // ── Adjectives ──
  const ADJ_RE = /\b(stor|liten|stor|gammal|ung|ny|vacker|ful|lång|kort|bred|smal|hög|låg|tung|lätt|snabb|långsam|varm|kall|het|sval|ren|smutsig|ljus|mörk|glad|ledsen|arg|lugn|trött|pigg|sjuk|frisk|stark|svag|rik|fattig|billig|dyr|enkel|svår|bra|dålig|fin|rolig|tråkig|intressant|viktig|farlig|säker|bekväm|obekväm|populär|modern|gammalmodig|djup|grund|sött|salt|bitter|sur|mjuk|hård|varm|kall|torr|våt|full|tom|tidig|sen)\b/i;
  const adjCount = countWords(tl, ADJ_RE);
  if (adjCount >= 2) s('node-07', 7);
  else if (adjCount >= 1) s('node-07', 3);

  // ── Negation ──
  if (/\binte\b/i.test(tl)) s('node-13', 5);
  if (/\baldrig\b|\bingen\b|\binget\b|\binga\b|\bvarken\b/i.test(tl)) s('node-13', 6);

  // ── Prepositions ──
  const PREP_RE = /^(i|på|till|från|med|utan|för|om|av|under|över|vid|hos|mot|genom|mellan|bakom|framför|bredvid|utanför|innanför)$/i;
  const prepCount = tw.filter(w => PREP_RE.test(w)).length;
  if (prepCount >= 3) s('node-14', 5);
  else if (prepCount >= 2) s('node-14', 3);

  // ── Temporal expressions & adverbs ──
  const TEMPORAL_RE = /\b(igår|idag|imorgon|förr|sedan|snart|alltid|aldrig|ofta|sällan|ibland|nu|redan|fortfarande|nyligen|genast|strax|plötsligt|äntligen|så\s+småningom|förut|hittills|häromdagen|i\s+förrgår|i\s+övermorgon|förr\s+i\s+tiden|nuförtiden|på\s+den\s+tiden|då|i\s+morgon\s+bitti|i\s+kväll|i\s+morse|i\s+natt|i\s+fjol|i\s+år|förra\s+veckan|nästa\s+vecka|förra\s+året|nästa\s+år|hela\s+tiden|under\s+tiden|medan|just\s+nu|senast|nästan|ungefär|ständigt|dagligen|varje\s+dag|varje\s+vecka)\b/i;
  if (TEMPORAL_RE.test(tl)) s('node-17', 7);
  // Adverbs of manner/degree
  const ADVERB_RE = /\b(mycket|ganska|lite|väldigt|extremt|otroligt|fantastiskt|verkligen|absolut|helt|nästan|knappt|säkert|troligen|antagligen|kanske|faktiskt|egentligen|tydligen|uppenbarligen|dessvärre|tyvärr|förhoppningsvis|lyckligtvis|naturligtvis|självklart|vanligtvis|normalt)\b/i;
  if (ADVERB_RE.test(tl)) s('node-17', 5);
  // Multiple temporal/adverb markers
  const tempCount = (tl.match(new RegExp(TEMPORAL_RE.source, 'gi')) || []).length;
  const advCount = (tl.match(new RegExp(ADVERB_RE.source, 'gi')) || []).length;
  if (tempCount + advCount >= 2) s('node-17', 4);

  // ── Connectors ──
  if (/\b(dock|emellertid|dessutom|däremot|visserligen|likväl|nämligen|följaktligen|sålunda|i\s+stället|å\s+andra\s+sidan|trots\s+det|med\s+andra\s+ord|i\s+synnerhet|framför\s+allt|i\s+alla\s+fall|hur\s+som\s+helst)\b/i.test(tl)) {
    s('node-25', 8);
  }
  if (/\b(men|och|eller|för|utan|så|både|varken|antingen|vare\s+sig)\b/i.test(tl) && tw.length >= 8) {
    s('node-25', 2);
  }

  // ── Formal register ──
  if (/\b(Ni|eder|Ers|benägen|tacksam|härmed|undertecknad)\b/.test(t)) s('node-29', 8);

  // ── Reported speech ──
  if (/\b(sa|sade|berättade|förklarade|påstod|meddelade|uppgav)\s+att\b/i.test(tl)) s('node-27', 10);
  if (/\b(sa|sade)\b/i.test(tl)) s('node-27', 4);

  // ── Idioms ──
  if (/\b(gå\s+i\s+kvav|slå\s+i\s+bordet|ha\s+tummen|ta\s+sig\s+i\s+kragen|hålla\s+tummarna|ge\s+järnet|ha\s+is\s+i\s+magen|kasta\s+in\s+handduken|vara\s+ute\s+och\s+cyklar|ha\s+en\s+räv\s+bakom\s+örat)\b/i.test(tl)) {
    s('node-28', 10);
  }

  // ── Academic ──
  if (/\b(forskning|vetenskap|hypotes|analys|syntes|begrepp|teori|metod|resultat|slutsats|experiment|observation|avhandling|uppsats|studie)\b/i.test(tl)) {
    s('node-33', 7);
  }

  // ── Literary/archaic ──
  if (/\b(härav|varav|emedan|ehuruväl|förvisso|allena|ävenledes|jämväl)\b/i.test(tl)) s('node-32', 8);

  // ── Vara vs ha (node-03) ──
  if (/\b(är|var|varit|vara)\b/i.test(tl)) s('node-03', 3);
  if (/\b(har|hade|haft|ha)\b/i.test(tl)) s('node-03', 2);

  // ── Articles (node-04) ──
  if (/\b(en|ett|den|det|de)\b/i.test(tl) && tw.length <= 6) s('node-04', 2);

  // ═══════════════════════════════════════════════════════════════════════
  // ENGLISH-SIDE (light, 2–3 pts)
  // ═══════════════════════════════════════════════════════════════════════
  if (e) {
    if (/\b(will|going to)\b/i.test(e)) s('node-24', 2);
    if (/\b(can|could|must|should|may|might)\b/i.test(e)) s('node-11', 2);
    if (/\bthan\b/i.test(e)) s('node-15', 3);
    if (/\b(said that|told me|mentioned|claimed|stated)\b/i.test(e)) s('node-27', 3);
    if (e.endsWith('?')) s('node-06', 2);
    if (/\bhimself\b|\bherself\b|\bmyself\b|\bthemselves\b|\bourselves\b/i.test(e)) s('node-12', 4);
    if (/\byesterday\b|\blast\s+(week|month|year)\b/i.test(e) && !/have|has/i.test(e)) s('node-09', 2);
    if (/\bhave\s+(been|had|done|gone|seen|made|taken|come|known|given)\b/i.test(e)) s('node-16', 2);
    if (/\balways\b|\bnever\b|\boften\b|\bsometimes\b|\bsoon\b|\balready\b|\bstill\b/i.test(e)) s('node-17', 3);
  }

  // Short expressions bias
  if (tw.length <= 3) s('node-08', 4);

  return scores;
}

// ── Assignment logic ─────────────────────────────────────────────────────

function getBestNode(scores) {
  let best = 'node-08';
  let bestScore = -1;
  for (const [node, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }
  return { node: best, score: bestScore };
}

// ── Phase 1: Score and assign ────────────────────────────────────────────

const originalDist = {};
deck.forEach(c => { originalDist[c.grammarNode] = (originalDist[c.grammarNode] || 0) + 1; });

let phase1Changes = 0;
const sampleChanges = [];

// Pre-compute all scores
const allScores = deck.map(c => scoreCard(c));

deck.forEach((card, i) => {
  const scores = allScores[i];
  const { node: bestNode, score: bestScore } = getBestNode(scores);
  const origNode = card.grammarNode;
  const origScore = scores[origNode] || 0;

  if (RENAMED_NODES.has(origNode)) {
    // Card is in a renamed node — MUST reassign based on grammar
    if (bestScore > 0) {
      if (bestNode !== origNode) {
        if (sampleChanges.length < 50) {
          sampleChanges.push({
            id: card.id, target: card.target.substring(0, 60),
            english: card.english.substring(0, 50),
            old: origNode, new: bestNode, score: bestScore,
          });
        }
        card.grammarNode = bestNode;
        phase1Changes++;
      }
    } else {
      // No strong signal — keep in original (now grammar-named) node
    }
  } else {
    // Card is in an unchanged grammar node — only move if MUCH better elsewhere
    // and original score is weak (< 3)
    if (origScore < 3 && bestScore >= origScore + 12 && bestNode !== origNode) {
      if (sampleChanges.length < 50) {
        sampleChanges.push({
          id: card.id, target: card.target.substring(0, 60),
          english: card.english.substring(0, 50),
          old: origNode, new: bestNode, score: bestScore,
        });
      }
      card.grammarNode = bestNode;
      phase1Changes++;
    }
  }
});

const afterPhase1 = {};
deck.forEach(c => { afterPhase1[c.grammarNode] = (afterPhase1[c.grammarNode] || 0) + 1; });

// ── Phase 2: Rebalance (80–200 cards) ────────────────────────────────────

const MIN_CARDS = 80;
const MAX_CARDS = 200;
let rebalanceMoves = 0;

function getDist() {
  const d = {};
  deck.forEach(c => { d[c.grammarNode] = (d[c.grammarNode] || 0) + 1; });
  for (let i = 1; i <= 35; i++) {
    const id = `node-${String(i).padStart(2, '0')}`;
    if (!d[id]) d[id] = 0;
  }
  return d;
}

// CEFR tiers for each node
const nodeTier = {};
for (let i = 1; i <= 8; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'A1';
for (let i = 9; i <= 15; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'A2';
for (let i = 16; i <= 21; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'B1';
for (let i = 22; i <= 27; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'B2';
for (let i = 28; i <= 31; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'C1';
for (let i = 32; i <= 35; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'C2';

for (let round = 0; round < 20; round++) {
  let moved = 0;
  const dist = getDist();

  // Fix overflow
  for (let n = 1; n <= 35; n++) {
    const nodeId = `node-${String(n).padStart(2, '0')}`;
    if (dist[nodeId] <= MAX_CARDS) continue;

    const indices = [];
    deck.forEach((c, i) => { if (c.grammarNode === nodeId) indices.push(i); });
    // Sort by score for this node ascending (weakest first)
    indices.sort((a, b) => allScores[a][nodeId] - allScores[b][nodeId]);

    const excess = dist[nodeId] - MAX_CARDS;
    let cnt = 0;
    for (const idx of indices) {
      if (cnt >= excess) break;
      // Find best alt under MAX
      let bestAlt = null, bestAltScore = -1;
      for (const [an, as] of Object.entries(allScores[idx])) {
        if (an === nodeId) continue;
        if (dist[an] >= MAX_CARDS) continue;
        if (as > bestAltScore) { bestAltScore = as; bestAlt = an; }
      }
      if (bestAlt) {
        dist[nodeId]--;
        dist[bestAlt]++;
        deck[idx].grammarNode = bestAlt;
        cnt++;
        moved++;
        rebalanceMoves++;
      }
    }
  }

  // Fix underflow
  for (let n = 1; n <= 35; n++) {
    const nodeId = `node-${String(n).padStart(2, '0')}`;
    if (dist[nodeId] >= MIN_CARDS) continue;

    const needed = MIN_CARDS - dist[nodeId];
    const tier = nodeTier[nodeId];

    // Pass 1: candidates with score > 0 for this node
    const scored = [];
    deck.forEach((c, i) => {
      if (c.grammarNode === nodeId) return;
      if (dist[c.grammarNode] <= MIN_CARDS) return;
      if (allScores[i][nodeId] > 0) {
        scored.push({ idx: i, score: allScores[i][nodeId], srcNode: c.grammarNode });
      }
    });
    scored.sort((a, b) => b.score - a.score);

    let filled = 0;
    for (const c of scored) {
      if (filled >= needed) break;
      if (dist[c.srcNode] <= MIN_CARDS) continue;
      dist[c.srcNode]--;
      dist[nodeId]++;
      deck[c.idx].grammarNode = nodeId;
      filled++;
      moved++;
      rebalanceMoves++;
    }

    // Pass 2: if still under, pull from same-tier or adjacent overflowing nodes
    if (filled < needed) {
      // Use a lower steal threshold for severely underfilled nodes
      const stealThreshold = dist[nodeId] < 60 ? MIN_CARDS : 100;
      const sameTierOverflow = [];
      deck.forEach((c, i) => {
        if (c.grammarNode === nodeId) return;
        if (dist[c.grammarNode] <= stealThreshold) return;
        const srcTier = nodeTier[c.grammarNode];
        const tierDist = Math.abs('A1A2B1B2C1C2'.indexOf(tier) - 'A1A2B1B2C1C2'.indexOf(srcTier));
        if (tierDist <= 6) { // wider tier range for hard-to-fill nodes
          sameTierOverflow.push({
            idx: i,
            srcScore: allScores[i][c.grammarNode],
            srcNode: c.grammarNode,
            tierDist,
          });
        }
      });
      sameTierOverflow.sort((a, b) => a.tierDist - b.tierDist || a.srcScore - b.srcScore);

      for (const c of sameTierOverflow) {
        if (filled >= needed) break;
        if (dist[c.srcNode] <= stealThreshold) continue;
        dist[c.srcNode]--;
        dist[nodeId]++;
        deck[c.idx].grammarNode = nodeId;
        filled++;
        moved++;
        rebalanceMoves++;
      }
    }
  }

  if (moved === 0) break;
}

// ── Stats ────────────────────────────────────────────────────────────────

const finalDist = getDist();

let totalChanged = 0;
deck.forEach((c, i) => {
  if (c.grammarNode !== originalDeck[i].grammarNode) totalChanged++;
});

const nodeNames = {
  'node-01': 'Personal pronouns & present tense',
  'node-02': 'Present tense regular verbs',
  'node-03': 'Vara vs ha',
  'node-04': 'Articles & gender (en/ett)',
  'node-05': 'Word order (V2 rule)',
  'node-06': 'Questions & interrogatives',
  'node-07': 'Descriptions & adjectives',
  'node-08': 'Common expressions',
  'node-09': 'Preteritum (simple past)',
  'node-10': 'Object pronouns',
  'node-11': 'Modal verbs',
  'node-12': 'Reflexive verbs (sig)',
  'node-13': 'Negation (inte)',
  'node-14': 'Prepositions',
  'node-15': 'Adjective agreement & comparison',
  'node-16': 'Perfekt (har + supinum)',
  'node-17': 'Temporal expressions & adverbs',
  'node-18': 'Subordinate clauses',
  'node-19': 'Imperative',
  'node-20': 'Definite forms & double definite',
  'node-21': 'Relative clauses (som)',
  'node-22': 'Passive voice (-s / bli)',
  'node-23': 'S-verbs (deponent verbs)',
  'node-24': 'Future & conditional',
  'node-25': 'Advanced connectors',
  'node-26': 'Participle constructions',
  'node-27': 'Reported speech',
  'node-28': 'Idiomatic expressions',
  'node-29': 'Formal vs informal',
  'node-30': 'Particle verbs',
  'node-31': 'Advanced word order',
  'node-32': 'Literary Swedish',
  'node-33': 'Academic discourse',
  'node-34': 'Cultural fluency',
  'node-35': 'Advanced mastery',
};

console.log('=== SWEDISH GRAMMAR NODE REASSIGNMENT ===\n');
console.log('Cards per node (BEFORE → phase1 → FINAL):');
console.log('-'.repeat(80));

for (let i = 1; i <= 35; i++) {
  const id = `node-${String(i).padStart(2, '0')}`;
  const before = originalDist[id] || 0;
  const mid = afterPhase1[id] || 0;
  const after = finalDist[id] || 0;
  const delta = after - before;
  const deltaStr = delta > 0 ? `+${delta}` : delta === 0 ? '  0' : `${delta}`;
  const bar = '#'.repeat(Math.round(after / 5));
  const renamed = RENAMED_NODES.has(id) ? ' *' : '';
  const warn = after < MIN_CARDS ? ' LOW' : after > MAX_CARDS ? ' HIGH' : '';
  console.log(`  ${id} ${String(before).padStart(3)} → ${String(mid).padStart(3)} → ${String(after).padStart(3)} (${deltaStr.padStart(4)}) ${bar}${warn}${renamed}  ${nodeNames[id]}`);
}

console.log('-'.repeat(80));
console.log(`Total cards: ${deck.length}`);
console.log(`Phase 1 changes: ${phase1Changes}`);
console.log(`Phase 2 rebalance moves: ${rebalanceMoves}`);
console.log(`Total changed from original: ${totalChanged}`);
console.log(`Distribution: ${Math.min(...Object.values(finalDist))} – ${Math.max(...Object.values(finalDist))}`);
console.log(`* = renamed node`);

console.log('\n=== SAMPLE REASSIGNMENTS ===\n');
sampleChanges.slice(0, 20).forEach(ch => {
  console.log(`  ${ch.id}: ${ch.old} → ${ch.new} (score=${ch.score})`);
  console.log(`    SV: ${ch.target}`);
  console.log(`    EN: ${ch.english}`);
  console.log();
});

// Write
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log(`Updated deck written to ${DECK_PATH}`);
