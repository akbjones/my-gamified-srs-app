/**
 * Grammar Node Classifier for Spanish Deck (v3 — 35 nodes)
 *
 * Assigns each card to one of 35 CEFR grammar nodes (A1→C2) based on
 * sentence structure analysis and grammar tip keywords.
 *
 * Node layout (35 nodes):
 *   A1  (8): 01-Regular present, 02-Irregular present, 03-Ser/estar,
 *            04-Questions, 05-Articles/gender, 06-Gustar/similar,
 *            07-Descriptions/adjectives, 08-Common expressions
 *   A2  (7): 09-Regular past, 10-Irregular past, 11-Imperfect,
 *            12-Past contrast, 13-Reflexive, 14-Por vs para,
 *            15-Object pronouns
 *   B1  (6): 16-Present subjunctive, 17-Imperative, 18-Conditional,
 *            19-Future, 20-Relative clauses, 21-Compound tenses
 *   B2  (6): 22-Imperfect subjunctive, 23-Complex conditionals,
 *            24-Passive/impersonal, 25-Advanced connectors,
 *            26-Verb phrases, 27-Reported speech
 *   C1  (4): 28-Subjunctive nuances, 29-Register/formal,
 *            30-Idiomatic, 31-Complex syntax
 *   C2  (4): 32-Literary tenses, 33-Academic discourse,
 *            34-Cultural fluency, 35-Advanced mixed
 *
 * Key design: Two text representations
 * - `t` = accent-stripped lowercase → for \b word boundary regex (JS \b only works with ASCII)
 * - `r` = lowercase WITH accents → for accent-critical patterns (using Spanish-aware boundaries)
 *
 * Spanish word boundary helper:
 *   Instead of \b (broken for ó/é/á/í/ú), we use:
 *   (?<![a-záéíóúüñ]) for word-start
 *   (?![a-záéíóúüñ])  for word-end
 */

import { readFileSync, writeFileSync } from 'fs';

const deckPath = new URL('../src/data/spanish/deck.json', import.meta.url).pathname;
const deck = JSON.parse(readFileSync(deckPath, 'utf8'));

// Strip accents for regex matching (JS \w doesn't match á é í ó ú ñ ü)
function norm(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Lowercase but KEEP accents — for accent-critical patterns
function lower(s) {
  return s.toLowerCase();
}

// Spanish-aware word end boundary (lookbehind doesn't need escaping)
const E = '(?![a-záéíóúüñ])';  // word-end for accented text
const S = '(?<![a-záéíóúüñ])'; // word-start for accented text

const NUM_NODES = 35;

// ─── Classification ────────────────────────────────────────────────────

function classify(card) {
  const raw = card.target || '';
  const t = norm(raw);           // accent-stripped for \b regex
  const r = lower(raw);          // lowercase WITH accents for tense detection
  const g = norm(card.grammar || '');
  const words = raw.split(/\s+/).length;
  const isQuestion = raw.startsWith('¿');

  const scores = new Array(NUM_NODES).fill(0);
  const queCount = (t.match(/\bque\b/g) || []).length;

  // ── Node 23: Si clauses (Complex conditionals) ──
  if (/\bsi\s+\w+(iera|ara|iese|ase)\b/.test(t)) scores[22] += 12;
  if (/\bsi\b/.test(t) && /\w+(aria|eria|iria)\b/.test(t)) scores[22] += 10;
  if (/si clause|conditional.*si|si.*conditional|condicional.*si/i.test(g)) scores[22] += 14;
  if (/\bsi hubiera\b|\bsi pudiera\b|\bsi tuviera\b|\bsi fuera\b/.test(t)) scores[22] += 12;

  // ── Node 22: Imperfect subjunctive ──
  const impfSubjMatch = t.match(/\w+(iera|ieras|ieramos|ieran|iese|ieses|iesemos|iesen)\b/g);
  // Also catch -ara/-aras but NOT common words: para, cara, rara, clara, amara(love)
  const araMatch = t.match(/\w{3,}(ara|aras|aramos|aran)\b/g);
  const filteredAra = araMatch ? araMatch.filter(m => !/\b(para|cara|rara|clara|avara|prepara|compara|separa|repara|declara|dispara)\b/.test(m)) : [];
  const hasImpfSubj = (impfSubjMatch && impfSubjMatch.length > 0) || filteredAra.length > 0;
  if (hasImpfSubj && !(/\bsi\s/.test(t))) scores[21] += 8;
  if (/\bquisiera\b|\bpudiera\b|\bdebiera\b/.test(t)) scores[21] += 7;
  if (/imperfect subjunctive|past subjunctive|subjuntivo imperfecto|subjuntivo pasado/.test(g)) scores[21] += 14;
  if (hasImpfSubj && /\bque\b|\bpara que\b|\bcomo si\b|\bojala\b/.test(t)) scores[21] += 5;

  // ── Node 16: Present subjunctive ──
  const subjTriggerWords = /\b(espero que|quiero que|necesito que|es importante que|es necesario que|es posible que|dudo que|no creo que|ojala|para que|antes de que|despues de que|sin que|a menos que|con tal de que|hasta que|es mejor que|prefiero que|sugiero que|recomiendo que|pido que|dejo que|hace falta que|es probable que|es imprescindible que|es fundamental que|es vital que|es esencial que|no pienso que|puede que)\b/;
  if (subjTriggerWords.test(t) && !hasImpfSubj) scores[15] += 9;
  if (/\bojala\b/.test(t)) scores[15] += 8;
  if (/subjunctive|subjuntivo/.test(g) && !/imperfect|past|pasado/.test(g)) scores[15] += 12;
  if (/\bpara que\b/.test(t) && !hasImpfSubj) scores[15] += 6;
  if (subjTriggerWords.test(t)) scores[15] += 4;
  // "aunque" + present subjunctive context
  if (/\baunque\b/.test(t) && words >= 5) scores[15] += 4;

  // ── Node 18: Conditional ──
  // Accent-stripped: -aria/-eria/-iria endings
  if (/\w+(aria|arias|ariamos|arian|eria|erias|eriamos|erian|iria|irias|iriamos|irian)\b/.test(t) && !(/\bsi\s/.test(t))) scores[17] += 7;
  // Common conditional verbs (accent-stripped)
  if (/\b(seria|tendria|podria|haria|diria|querria|vendria|sabria|pondria|gustaria|deberia|habria|estaria|iria|daria|viviria|compraria|necesitaria|preferiria|me gustaria)\b/.test(t)) scores[17] += 8;
  if (/conditional|condicional/.test(g) && !/si clause/.test(g)) scores[17] += 12;
  if (/\bme gustaria\b/.test(t)) scores[17] += 6;

  // ── Node 19: Future tense ──
  // Future: accent-stripped known irregular future stems
  if (/\b(sera|tendra|podra|hara|dira|vendra|sabra|pondra|saldra|habra|querra|valdra|ira|tendre|podre|hare|dire|vendre|sabre|pondre|saldre|habre|querre|sere|estare|vivire|trabajare|estudiare|comprare|hablare|comere|ire|dare|vere|seras|tendras|podras|haras|diras|vendras|sabras|pondras|saldras|habras|iremos|seremos|tendremos|podremos|haremos|sabremos)\b/.test(t)) scores[18] += 8;
  // Ir a + infinitive (near future)
  if (/\b(voy a|vas a|va a|vamos a|van a)\s+\w+r\b/.test(t)) scores[18] += 6;
  if (/future|futuro/.test(g) && !/perfect|perfecto/.test(g)) scores[18] += 12;
  // Detect accented future endings in raw text with Spanish-aware boundary
  if (new RegExp(`[a-záéíóúüñ]+(aré|arás|ará|aremos|arán|eré|erás|erá|eremos|erán|iré|irás|irá|iremos|irán)${E}`).test(r)) scores[18] += 7;

  // ── Node 21: Compound tenses (perfect tenses) ──
  // Present perfect: haber + participle
  if (/\b(he|has|ha|hemos|han)\s+\w+(ado|ido|to|cho|so|sto|erto)\b/.test(t)) scores[20] += 9;
  // Pluperfect: habia + participle
  if (/\b(habia|habias|habiamos|habian)\s+\w+(ado|ido|to|cho|so|sto|erto)\b/.test(t)) scores[20] += 9;
  if (/perfect|perfecto|haber|compound/.test(g)) scores[20] += 12;

  // ── Node 09: Regular preterite ──
  // Time markers (shared between 09 and 10 — both benefit)
  const hasPretMarker = /\b(ayer|anoche|la semana pasada|el mes pasado|el ano pasado|hace\s+\w+\s+(anos|meses|dias|semanas)|una vez|de repente|entonces|el otro dia|la otra noche)\b/.test(t);
  if (hasPretMarker) { scores[8] += 4; scores[9] += 4; }
  // Regular preterite endings: -aron, -ieron (3rd plural)
  if (/\w+(aron|ieron)\b/.test(t)) { scores[8] += 4; scores[9] += 4; }
  // -aste, -iste (2nd person singular preterite)
  if (/\w+(aste|iste)\b/.test(t)) { scores[8] += 4; scores[9] += 4; }
  // ACCENT-AWARE: -ó ending = preterite 3rd person (habló, comió, vivió)
  if (new RegExp(`[a-záéíóúüñ]{2,}ó${E}`).test(r)) { scores[8] += 4; scores[9] += 4; }
  // ACCENT-AWARE: -é ending on verbs (hablé, comí) — 1st person preterite
  const hasAccentE = new RegExp(`[a-záéíóúüñ]{3,}é${E}`).test(r);
  if (hasAccentE && !/\b(tambien|despues|cafe|jose|bebe|pure|canape|que|porque)\b/.test(t)) { scores[8] += 3; scores[9] += 3; }
  // Regular preterite: verbs with predictable conjugations (-ar verbs: -é/-aste/-ó/-amos/-aron; -er/-ir: -í/-iste/-ió/-imos/-ieron)
  // Known 1st person plural preterite (regular)
  if (/\b(llegamos|empezamos|terminamos|encontramos|compramos|pagamos|cenamos|almorzamos|desayunamos|viajamos|visitamos|llamamos|mandamos|pasamos|tomamos|jugamos|bailamos|cantamos|caminamos)\b/.test(t)) scores[8] += 5;
  if (/preterit|preterito|indefinido/.test(g) && !/irregular/.test(g)) scores[8] += 10;
  if (/preterit|preterito|indefinido/.test(g)) scores[8] += 4;

  // ── Node 10: Irregular preterite ──
  // Irregular preterite verb forms (accent-stripped)
  if (/\b(fue|fui|fuiste|fuimos|fueron|dijo|hizo|tuvo|tuve|puso|puse|vino|vine|supo|supe|quiso|quise|pudo|pude|dio|vi|vio|estuvo|estuve|hubo|condujo|trajo|tradujo|produjo|dieron|dijeron|hicieron|tuvieron|pusieron|vinieron|supieron|quisieron|pudieron|estuvieron|condujeron|trajeron)\b/.test(t)) scores[9] += 8;
  // Known irregular 1st person plural preterite
  if (/\b(conocimos|salimos|hicimos|dijimos|pusimos|tuvimos|supimos|vinimos|fuimos|estuvimos|pudimos)\b/.test(t)) scores[9] += 6;
  if (/irregular.*preterit|irregular.*preterito|preterit.*irregular|preterito.*irregular/.test(g)) scores[9] += 14;

  // ── Node 11: Imperfect ──
  if (/\b(siempre|todos los dias|cada dia|a menudo|frecuentemente|de nino|de pequeno|cuando era|mientras|solia|normalmente|generalmente|habitualmente|en aquella epoca|en esa epoca)\b/.test(t)) scores[10] += 7;
  // Known imperfect forms (accent-stripped works for these)
  if (/\b(era|eras|eramos|eran|estaba|estabas|estabamos|estaban|tenia|tenias|teniamos|tenian|habia|hacia|decia|podia|queria|sabia|venia|iba|ibas|ibamos|iban|vivia|viviamos|vivian|parecia|creia|sentia|conocia|existia|necesitaba|trabajaba|estudiaba|jugaba|gustaba|llamaba|llevaba|pasaba|pensaba|hablaba|miraba|esperaba|caminaba|cantaba|bailaba|lloraba|sonaba|soñaba)\b/.test(t)) scores[10] += 6;
  // -aba endings (1st/3rd person imperfect -ar verbs)
  if (/\w{3,}(aba|abas|abamos|aban)\b/.test(t)) scores[10] += 6;
  // -ía endings: detect via accent-aware pattern on r
  if (new RegExp(`[a-záéíóúüñ]{3,}(ía|ías|íamos|ían)${E}`).test(r)) {
    // But exclude conditional -ría endings
    if (!new RegExp(`[a-záéíóúüñ]+(aría|ería|iría|arías|erías|irías|aríamos|eríamos|iríamos|arían|erían|irían)${E}`).test(r)) {
      scores[10] += 6;
    }
  }
  if (/imperfect|imperfecto/.test(g) && !/subjunctive|subjuntivo/.test(g)) scores[10] += 12;

  // ── Node 12: Past contrast (preterite vs imperfect in same sentence) ──
  const hasPretSignal = /\b(fue|fui|fuiste|fuimos|fueron|dijo|hizo|tuvo|tuve|puso|puse|vino|vine|supo|supe|quiso|quise|pudo|pude|dio|vi|vio|estuvo|estuve|hubo)\b/.test(t)
    || /\w+(aron|ieron)\b/.test(t)
    || /\w+(aste|iste)\b/.test(t)
    || (new RegExp(`[a-záéíóúüñ]{2,}ó${E}`).test(r));
  const hasImpfSignal = /\b(era|eras|eramos|eran|estaba|estabas|estabamos|estaban|tenia|tenias|teniamos|tenian|habia|hacia|decia|podia|queria|sabia|venia|iba|ibas|ibamos|iban)\b/.test(t)
    || /\w{3,}(aba|abas|abamos|aban)\b/.test(t);
  // Both tenses in same sentence — strong signal for past contrast
  if (hasPretSignal && hasImpfSignal) scores[11] += 14;
  if (/\bmientras\b/.test(t) && (hasPretSignal || hasImpfSignal)) scores[11] += 6;
  if (/\bcuando\b/.test(t) && hasPretSignal && hasImpfSignal) scores[11] += 6;
  if (/past contrast|contraste.*pasado|preterite.*imperfect|imperfect.*preterite|indefinido.*imperfecto|imperfecto.*indefinido/.test(g)) scores[11] += 14;

  // ── Node 13: Reflexive verbs ──
  // Broad reflexive: me/te/se/nos + common reflexive verbs
  if (/\b(me|te|se|nos)\s+(despierto|despiertas|despierta|levanto|levantas|levanta|acuesto|acuestas|acuesta|ducho|duchas|ducha|visto|vistes|viste|siento|sientes|siente|quedo|quedas|queda|llamo|llamas|llama|preocupo|preocupas|preocupa|lavo|lavas|lava|aburro|aburres|aburre|caso|casas|casa|encuentro|encuentras|encuentra|arrepiento|arrepientes|arrepiente|preparo|preparas|prepara|olvido|olvidas|olvida|quejo|quejas|queja|divierto|diviertes|divierte|pongo|pones|pone|peino|peinas|peina|maquillo|maquillas|maquilla|acerco|acercas|acerca|alejo|alejas|aleja|porto|portas|porta|comporto|comportas|comporta|dedico|dedicas|dedica|senti|sintio|levante|levanto|desperto|acosto|duche|vesti|cai|caigo|caes|cae|junto|juntas|junta|reuno|reunes|reune|relajo|relajas|relaja|concentro|concentras|concentra|equivoco|equivocas|equivoca)\b/.test(t)) scores[12] += 9;
  if (/\w+(arse|erse|irse)\b/.test(t)) scores[12] += 6;
  if (/reflexive|reflexivo|pronominal/.test(g)) scores[12] += 12;
  // me/te/nos + any verb-like pattern (broader catch)
  if (/\b(me|te|nos)\s+\w{3,}(o|as|a|amos|an)\b/.test(t)) scores[12] += 3;

  // ── Node 17: Commands (imperative) ──
  // Irregular imperative forms (accent-stripped)
  if (/\b(ven|haz|sal|pon|ten|ve|oye|dime|dame|hazme|ponme|digame|traigame|venga|vaya|haga|diga|ponga|tenga|traiga|salga|mire|espere|perdone|disculpe|sientese|callese|levantese)\b/.test(t)) scores[16] += 8;
  // Negative commands
  if (/\bno\s+(hagas|digas|vayas|pongas|tengas|salgas|vengas|comas|bebas|toques|olvides|te preocupes|te vayas|te olvides|lo hagas|la dejes|les digas|te rindas|abras|cierres|hables|corras|grites|llores|mires|saltes|te muevas|te acerques|te levantes)\b/.test(t)) scores[16] += 8;
  if (/command|imperative|imperativo/.test(g)) scores[16] += 12;
  // Sentence starts with verb in imperative form (much broader)
  const imperativeStart = /^(no\s+)?(ven|haz|sal|pon|ten|ve|mira|escucha|espera|toma|dime|dame|abre|cierra|saca|llama|pasa|sube|baja|lee|corre|para|busca|compra|trae|lleva|deja|prueba|intenta|recuerda|aprende|practica|camina|estudia|habla|come|bebe|prepara|limpia|lava|cocina|corta|mezcla|anade|sirve|enciende|apaga|revisa|verifica|confirma|envia|responde|contesta|pregunta|pide|ayuda|cuida|sigue|repite|termina|empieza|comienza|usa|utiliza|imagina|piensa|observa|fijate|escribe|anota|marca|indica|maneja|conduce|frena|gira|evita|agrega|coloca|mueve|guarda|cuelga|carga|instala|conecta|registra|rellena|disfruta|aprovecha|asegurate|informate|animate|levantate|acuestate)(\s|$|,|\.)/;
  if (imperativeStart.test(t)) scores[16] += 8;
  // "por favor" in short sentence often means polite command
  if (/\bpor favor\b/.test(t) && words <= 12) scores[16] += 3;

  // ── Node 3: Ser vs estar ──
  // Both in same sentence — strong signal
  if (/\b(es|son|soy|eres|somos)\b/.test(t) && /\b(esta|estan|estoy|estas|estamos)\b/.test(t)) scores[2] += 14;
  if (/\bser\b.*\bestar\b|\bestar\b.*\bser\b|ser vs|estar vs/.test(g)) scores[2] += 14;
  if (/\b(ser|estar)\b/.test(g) && /\b(temporary|permanent|location|state|characteristic|condition)\b/.test(g)) scores[2] += 10;
  // Ser for identity/description — only short sentences
  if (words <= 7 && /\b(soy|eres|es|somos|son)\b/.test(t) && /\b(un|una|el|la|de|muy|bastante)\b/.test(t)) scores[2] += 4;
  // Estar for states/location — only short sentences
  if (words <= 7 && /\b(estoy|estas|esta|estamos|estan)\b/.test(t) && /\b(bien|mal|contento|triste|cansado|enfermo|ocupado|listo|nervioso|preocupado|aqui|alli|ahi|cerca|lejos|en)\b/.test(t)) scores[2] += 5;
  // Short sentences with ser/estar as main verb
  if (words <= 6 && /\b(es|son|soy|eres|somos|esta|estan|estoy|estas|estamos)\b/.test(t)) scores[2] += 3;

  // ── Node 6: Gustar & similar ──
  if (/\b(me|te|le|nos|les)\s+(gusta|gustan|encanta|encantan|interesa|interesan|importa|importan|molesta|molestan|fascina|fascinan|preocupa|preocupan|parece|parecen|duele|duelen|falta|faltan|sobra|sobran|apetece|apetecen|conviene|queda|quedan|cuesta|cuestan|sorprende|sorprenden|aburre|aburren)\b/.test(t)) scores[5] += 10;
  if (/gustar|encantar|interesar|importar|parecer|doler|faltar/.test(g)) scores[5] += 12;

  // ── Node 14: Por vs para ──
  if (/\bpor\b/.test(t) && /\bpara\b/.test(t)) scores[13] += 12;
  if (/\bpor\b.*\bpara\b|\bpara\b.*\bpor\b|por vs|para vs/.test(g)) scores[13] += 14;
  if (/\b(por|para)\b/.test(g) && /\b(reason|purpose|exchange|duration|cause|goal|recipient|destinatario)\b/.test(g)) scores[13] += 8;
  // "por" with context clues
  if (/\bpor\s+(eso|favor|ejemplo|lo menos|supuesto|lo tanto|lo general|cierto|fin|suerte|desgracia|primera vez|ultima vez|lo visto|casualidad)\b/.test(t)) scores[13] += 5;
  if (/\bpor\s+(la manana|la tarde|la noche|la calle|el parque|el centro|el camino|aqui|alli|ahi)\b/.test(t)) scores[13] += 5;
  // "para" with purpose/deadline
  if (/\bpara\s+(mi|ti|el|ella|nosotros|ellos|que|siempre|manana|hoy|cuando)\b/.test(t)) scores[13] += 4;

  // ── Node 15: Object pronouns ──
  // Double object pronouns — very strong
  if (/\b(me lo|me la|me los|me las|te lo|te la|te los|te las|se lo|se la|se los|se las|nos lo|nos la|nos los|nos las)\b/.test(t)) scores[14] += 12;
  if (/object pronoun|pronombre|direct object|indirect object|lo\/la|le\/les|complemento/.test(g)) scores[14] += 12;
  // Single pronoun before verb (broad verb list)
  if (/\b(lo|la|los|las|le|les)\s+(dije|digo|di|doy|compre|traje|mande|envie|preste|regale|conte|explique|pedi|prometi|ofreci|mostre|ensene|presente|entregue|devolvi|quite|lleve|pregunte|respondi|dimos|dieron|damos|dan)\b/.test(t)) scores[14] += 8;
  // Pronoun attached to infinitive or gerund
  if (/\w+(arlo|arla|arlos|arlas|erlo|erla|irlo|irla|andolo|andola|iendolo|iendola)\b/.test(t)) scores[14] += 7;
  // lo/la/le before conjugated verb pattern
  if (/\b(lo|la|le|les)\s+\w{3,}(o|as|a|amos|an|e|es|emos|en)\b/.test(t) && words >= 4) scores[14] += 4;

  // ── Node 24: Passive & impersonal ──
  if (/\bse\s+(habla|vende|venden|necesita|necesitan|busca|buscan|dice|puede|pueden|ofrece|ofrecen|acepta|aceptan|permite|permiten|prohibe|prohiben|recomienda|recomiendan|alquila|alquilan|sirve|sirven|usa|usan|utiliza|utilizan|conoce|conocen|considera|consideran|cree|creen|espera|esperan|sabe|supone|requiere|requieren|exige|exigen|produce|producen|practica|practican|celebra|celebran|come|comen|bebe|beben|hablan|ven|escucha|escuchan)\b/.test(t)) scores[23] += 9;
  if (/\bfue\s+\w+(ado|ido|to|cho)\b/.test(t)) scores[23] += 9;
  if (/passive|pasiva|impersonal|se\s+(passive|impersonal)/.test(g)) scores[23] += 12;
  // "se" + 3rd person verb at start (impersonal)
  if (/^se\s+\w{3,}(a|e|an|en)\b/.test(t) && !/^se\s+(me|te|nos)\b/.test(t)) scores[23] += 5;

  // ── Node 20: Relative clauses ──
  if (/\b(lo que|el que|la que|los que|las que|en donde|en el que|en la que|con quien|para quien|por lo que|cuyo|cuya|cuyos|cuyas|a quien|de quien|con el que|con la que|en los que|en las que|del que|de la que|al que|a la que)\b/.test(t)) scores[19] += 9;
  if (/relative clause|relativo|relative pronoun|oracion de relativo/.test(g)) scores[19] += 12;
  // Descriptive "que" after nouns
  if (/\b(persona|cosa|lugar|momento|dia|vez|forma|manera|razon|motivo|libro|pelicula|cancion|ciudad|pais|casa|trabajo|problema|idea|proyecto)\s+que\b/.test(t)) scores[19] += 5;
  if (/\bdonde\b/.test(t) && !isQuestion && words >= 5) scores[19] += 4;

  // ── Node 25: Advanced connectors ──
  if (/\b(sin embargo|no obstante|por lo tanto|en consecuencia|a pesar de|pese a|en cambio|por el contrario|ademas|asimismo|de hecho|en efecto|es decir|o sea|en otras palabras|mientras que|dado que|puesto que|ya que|con el fin de|a fin de|siempre y cuando|siempre que|en cuanto|tan pronto como|a medida que|debido a|por otro lado|en primer lugar|en conclusion|en resumen|por consiguiente|con respecto a|en todo caso|de todos modos|al fin y al cabo|si bien|aun asi|con todo|dicho esto|por ende)\b/.test(t)) scores[24] += 10;
  if (/connector|conector|linking|discourse|marcador/.test(g)) scores[24] += 12;

  // ── Node 4: Common questions ──
  if (isQuestion) scores[3] += 5;
  if (isQuestion && /\b(como|cuando|donde|que|quien|cual|cuanto|cuantos|cuantas|por que|adonde|de donde)\b/.test(t)) scores[3] += 5;
  if (/question|interrogative|pregunta/.test(g)) scores[3] += 10;
  if (isQuestion && words <= 8) scores[3] += 3;

  // ── Node 5: Articles & gender ──
  if (/article|articulo|gender|genero|masculine|feminine|masculino|femenino|el\/la|un\/una|concordancia/.test(g)) scores[4] += 12;
  if (/\b(este|esta|estos|estas|ese|esa|esos|esas|aquel|aquella|aquellos|aquellas)\s+\w+\b/.test(t)) scores[4] += 3;
  if (words <= 6 && /\b(el|la|los|las|un|una|unos|unas)\s+\w+\b/.test(t)) scores[4] += 3;

  // ── Node 7: Descriptions / adjectives ──
  // Adjective agreement, descriptive sentences with ser/estar + adjective
  if (/adjective|adjetivo|description|descripcion|agreement|concordancia.*adjetivo/.test(g)) scores[6] += 12;
  // ser/estar + adjective pattern (descriptive)
  if (/\b(es|son|soy|eres|somos|esta|estan|estoy|estas|estamos)\s+(muy|bastante|un poco|demasiado|tan|realmente|increiblemente|extremadamente)?\s*(grande|pequeno|alto|bajo|largo|corto|gordo|delgado|flaco|viejo|joven|nuevo|bonito|feo|lindo|hermoso|guapo|rico|pobre|bueno|malo|fuerte|debil|rapido|lento|facil|dificil|importante|interesante|aburrido|divertido|tranquilo|ruidoso|limpio|sucio|caliente|frio|dulce|amargo|salado|caro|barato|comodo|incomodo|moderno|antiguo|feliz|triste|contento|enojado|cansado|enfermo|sano|ocupado|libre|lleno|vacio|abierto|cerrado|claro|oscuro|blanco|negro|rojo|azul|verde|amarillo|marron|gris|rosa|naranja|morado)\b/.test(t)) scores[6] += 6;
  if (words <= 8 && /\b(muy|bastante|demasiado|tan|mas|menos)\s+\w+(o|a|os|as|e|es)\b/.test(t)) scores[6] += 4;
  // Comparatives and superlatives
  if (/\b(mas|menos)\s+\w+\s+que\b/.test(t) && words <= 10) scores[6] += 5;
  if (/\b(el|la|los|las)\s+mas\s+\w+\b/.test(t)) scores[6] += 4;

  // ── Node 8: Common expressions ──
  if (/expression|expresion|greeting|saludo|farewell|despedida|polite|cortesia|common phrase|frase comun|basic|basico/.test(g)) scores[7] += 12;
  // Greetings, farewells, polite phrases
  if (/\b(hola|adios|buenos dias|buenas tardes|buenas noches|hasta luego|hasta manana|hasta pronto|nos vemos|que tal|como estas|como esta|mucho gusto|encantado|encantada|bienvenido|bienvenida|gracias|muchas gracias|de nada|por favor|lo siento|disculpa|disculpe|perdon|con permiso|salud|felicidades|enhorabuena|feliz cumpleanos|buen provecho|que aproveche|igualmente|con mucho gusto|a sus ordenes|mande)\b/.test(t)) scores[7] += 8;
  // Common short phrases / fixed expressions
  if (/\b(claro que si|claro que no|por supuesto|desde luego|sin duda|no hay problema|no te preocupes|no se preocupe|no pasa nada|que pena|que lastima|que bien|que bueno|que malo|me da igual|no importa|da lo mismo|vale la pena|tiene razon|tienes razon|esta bien|de acuerdo|por cierto|a proposito|en serio|de verdad|la verdad es que|que quieres decir|no me digas)\b/.test(t)) scores[7] += 7;
  // Very short everyday phrases (2-4 words)
  if (words <= 4 && /\b(claro|vale|venga|vamos|anda|oye|mira|oiga|bueno|pues|ya|genial|perfecto|exacto|correcto|verdad|seguro)\b/.test(t)) scores[7] += 5;

  // ── Node 26: Verb phrases (B2) ──
  if (new RegExp(`${S}llev(o|a|as|amos|an|aba|aban)\\s+[a-záéíóúüñ]*\\s*(años|meses|días|horas|semanas|rato|tiempo|toda)`, 'i').test(r)) scores[25] += 12;
  if (new RegExp(`${S}llev(o|a|as|amos|an|aba|aban)\\s+[a-záéíóúüñ]+(ando|iendo)${E}`).test(r)) scores[25] += 12;
  if (/\bacab(o|a|as|amos|an|aba|aban|e|es|amos)\s+de\s+\w+r\b/.test(t)) scores[25] += 12;
  if (/\bse\s+pus(o|ieron|e|imos)\s+a\b|\bponerse a\b/.test(t)) scores[25] += 12;
  if (/\bdej(o|a|e|aron|amos)\s+de\s+\w+(ar|er|ir)\b/.test(t)) scores[25] += 10;
  if (/\bvolv(io|ieron|i|imos|era|eras|emos)\s+a\s+\w+(ar|er|ir)\b/.test(t)) scores[25] += 10;
  if (new RegExp(`${S}volv(ió|ieron|í|imos|erá|erás|emos)\\s+a\\s+[a-záéíóúüñ]+(ar|er|ir)${E}`).test(r)) scores[25] += 10;
  if (/\bsigu(e|en|io|ieron|o|ieron)\s+\w+(ando|iendo)\b/.test(t)) scores[25] += 10;
  if (/\band(a|an|aba|aban)\s+\w+(ando|iendo)\b/.test(t)) scores[25] += 10;
  if (new RegExp(`est(á|aba|aban)\\s+a punto de${E}`).test(r)) scores[25] += 10;
  if (/\bno dej(a|o|e|es)\s+de\b/.test(t)) scores[25] += 8;
  if (/periphrastic|perífrasis|verb phrase|llevar.*gerund|acabar de|ponerse a|dejar de|volver a|seguir.*gerund|andar.*gerund/.test(g)) scores[25] += 14;

  // ── Node 27: Reported Speech (B2) ──
  if (/\b(dijo|dijeron|contó|contaron|comentó|comentaron|explicó|explicaron|aseguró|aseguraron|afirmó|afirmaron|confesó|confesaron|reconoció|reconocieron|mencionó|mencionaron|juró|juraron|negó|negaron)\s+que\b/.test(t)) scores[26] += 10;
  if (/\b(preguntó|preguntaron)\s+(si|que|por que|como|cuando|donde|cuanto)\b/.test(t)) scores[26] += 10;
  if (/\bme\s+pid(io|ieron)\s+que\b|\ble\s+pid(io|ieron)\s+que\b/.test(t)) scores[26] += 10;
  if (/\b(segun el|segun ella|segun mis|segun los|segun la|segun el medico|segun el periodico|segun la profesora)\b/.test(t)) scores[26] += 10;
  if (/\b(me|le|les|nos)\s+(advirtio|advirtieron|sugirió|sugirieron|recomendo|recomendaron|informo|informaron|comunico|comunicaron|aviso|avisaron|recordo|recordaron|reprochó|reprocharon|exigió|exigieron|rogó|rogaron|insistió|insistieron)\b/.test(t)) scores[26] += 9;
  if (new RegExp(`(dijo|contó|explicó|aseguró|prometió|afirmó|confesó|reconoció|mencionó|respondió|comentó|informó|advirtió|sugirió|recordó|negó|juró)\\s+que`, 'i').test(r)) scores[26] += 8;
  if (/reported speech|estilo indirecto|indirect speech|tense.*shift|backshift/.test(g)) scores[26] += 14;
  if (/\bal dia siguiente\b|\besa semana\b|\baquella\b/.test(t)) scores[26] += 5;

  // ── Node 28: Subjunctive nuances (C1) ──
  if (/\bcomo si\b/.test(t) && hasImpfSubj) scores[27] += 12;
  if (/\bel hecho de que\b/.test(t)) scores[27] += 12;
  if (new RegExp(`${S}sea como sea${E}`).test(r)) scores[27] += 12;
  if (/\bpor mas que\b|\bpor mucho que\b|\bpor muy\b/.test(t)) scores[27] += 10;
  if (/\bno es que\b/.test(t)) scores[27] += 10;
  if (/\bque yo sepa\b|\bque yo recuerde\b/.test(t)) scores[27] += 10;
  if (/\bquienquiera que\b|\bdondequiera que\b|\bcomoquiera que\b/.test(t)) scores[27] += 12;
  if (/\bhagas lo que hagas\b|\bpase lo que pase\b|\bdiga lo que diga\b|\bsea lo que sea\b/.test(t)) scores[27] += 12;
  if (/\bpor poco que\b/.test(t)) scores[27] += 10;
  if (/\bsin que\b/.test(t) && words >= 8) scores[27] += 5;
  if (/\ba pesar de que\b/.test(t) && hasImpfSubj) scores[27] += 6;
  if (/subjunctive nuance|mood contrast|indicative vs subjunctive/.test(g)) scores[27] += 14;

  // ── Node 29: Register & formal style (C1) ──
  if (/\bcabe\s+(destacar|senalar|preguntarse|la posibilidad|mencionar|recordar|anadir)\b/.test(t)) scores[28] += 12;
  if (/\bde haber\s+\w+(ado|ido|to|cho|so)\b/.test(t)) scores[28] += 12;
  if (/\bde no\s+(haber|ser|mediar)\b/.test(t)) scores[28] += 10;
  if (/\ben virtud de\b|\ben aras de\b|\ba tenor de\b|\bcon arreglo a\b|\bhuelga decir\b|\ben lo sucesivo\b|\ben lo tocante\b|\ben lo que respecta\b/.test(t)) scores[28] += 14;
  if (/\bdicho esto\b|\bdicho lo cual\b|\bvalga como\b|\bprocede\b/.test(t)) scores[28] += 8;
  if (/\ba mi juicio\b|\ba la luz de\b|\ben resumidas cuentas\b|\bconviene\s+(recordar|senalar|destacar)\b/.test(t)) scores[28] += 8;
  if (/register|formal.*style|registro|estilo formal/.test(g)) scores[28] += 14;

  // ── Node 30: Idiomatic Fluency (C1) ──
  if (/idiom|idiomatic|modismo|expression|expresion|slang|colloquial|refran|dicho|proverb/.test(g)) scores[29] += 14;
  if (/\b(me costo un ojo|llover a cantaros|meter la pata|echar una mano|pan comido|quedarse de piedra|quedarse en blanco|viento en popa|gato encerrado|harina de otro costal|tomarse el pelo|tomar el pelo|ir al grano|tirar la toalla|morderse la lengua|pasarse de la raya|dar gato por liebre|perder la cabeza|tener.*as bajo la manga|entre la espada y la pared)\b/.test(t)) scores[29] += 14;
  // Proverb patterns
  if (/\b(mas vale|no hay mal|quien mucho abarca|ojos que no ven|dime con quien|en boca cerrada|a quien madruga|no todo lo que brilla|cada maestrillo|al mal tiempo|cuando el rio suena|no muerdas la mano)\b/.test(t)) scores[29] += 14;
  // Colloquial expressions
  if (/\b(me lo pase bomba|me tiene hasta las narices|no me vengas con esas|no le des mas vueltas|me pillo por sorpresa|se le fue la lengua|con pelos y senales|me tienes en ascuas)\b/.test(t)) scores[29] += 12;

  // ── Node 31: Complex Syntax (C1) ──
  // Absolute participial clauses at start
  if (/^(terminada|resueltos|abierta|vistas|hechas|cumplidos|agotadas|analizada|concluida|sentados|llegados|puesto|dicho)\s/i.test(t)) scores[30] += 14;
  // Nominalized infinitives
  if (/\bel\s+(haber|vivir|saber|no haber|no saber|trabajar|escuchar)\b/.test(t) && words >= 8) scores[30] += 10;
  // Cleft sentences
  if (/\bes\s+(precisamente|solo|mediante|por eso)\s+(por|como|cuando)\b/.test(t)) scores[30] += 12;
  if (/\bno es sino\b/.test(t)) scores[30] += 12;
  // Multiple subordination (3+ "que")
  if (queCount >= 3 && words >= 15) scores[30] += 8;
  // Complex comparative correlations
  if (/\bcuantos? mas\b.*\b(mas|mejor|mayor|menor|peor)\b/.test(t)) scores[30] += 8;
  if (/\bcuanto (antes|mayor|menor|mas|menos)\b/.test(t)) scores[30] += 6;
  // Long formal sentences
  if (words >= 20 && /\b(sino que|no solo|lo cierto es|lo paradojico|lo realmente)\b/.test(t)) scores[30] += 6;
  if (/participial|nominalization|complex syntax|subordination|cleft/.test(g)) scores[30] += 14;

  // ── Node 32: Literary tenses (C2) ──
  // Preterito anterior (hubo + participle) and other literary verb forms
  if (/\bhubo\s+\w+(ado|ido|to|cho)\b/.test(t)) scores[31] += 14;
  // Future/conditional of probability
  if (new RegExp(`(será|habrá|tendrá|estará|serán|habrán)\\s+(las|unos|unas|como|más|menos|bastante|aproximadamente|alrededor)`, 'i').test(r)) scores[31] += 10;
  if (new RegExp(`(habría|tendría|estaría|sería)\\s+unos`, 'i').test(r)) scores[31] += 10;
  if (/literary|preterito anterior|literary tense|tiempo literario/.test(g)) scores[31] += 14;

  // ── Node 33: Academic discourse (C2) ──
  if (/academic|academico|discourse|discurso|thesis|tesis|essay|ensayo/.test(g)) scores[32] += 14;
  if (/\ben virtud de\b|\ben aras de\b|\ba tenor de\b|\bcon arreglo a\b|\bhuelga decir\b|\ben lo sucesivo\b/.test(t)) scores[32] += 10;
  // Highly formal/academic connectors and phrases
  if (/\b(cabe senalar que|es preciso senalar|resulta evidente|se desprende que|se infiere que|se pone de manifiesto|la presente investigacion|el presente estudio|a modo de conclusion|en definitiva|en suma|en ultimo termino|dicho de otro modo)\b/.test(t)) scores[32] += 14;
  if (/\bno obstante lo anterior\b|\ben lo que atane\b|\bcon independencia de\b|\ba la par que\b/.test(t)) scores[32] += 10;

  // ── Node 34: Cultural fluency (C2) ──
  if (/cultural|cultura|society|sociedad|tradition|tradicion|customs|costumbres|heritage|patrimonio/.test(g)) scores[33] += 14;
  // References to cultural/regional vocabulary
  if (/\b(tertulia|sobremesa|siesta|madrugada|tapas|botellón|chiringuito|verbena|romería|procesión|zarzuela|sainete|flamenco|corrida|plaza mayor|pueblo|feria|fiesta|villancico|tuna|paella)\b/.test(t)) scores[33] += 8;
  // Culturally loaded expressions
  if (/\b(quedar bien|quedar mal|hacer el ridiculo|guardar las formas|tener mano izquierda|echar de menos|dar cosa|tener morrina)\b/.test(t)) scores[33] += 8;

  // ── Node 35: Advanced mixed (C2 capstone) ──
  // Sentences that combine multiple C-level structures or are very long + complex
  const cSignals = [
    hasImpfSubj,
    /\bsi\s+\w+(iera|ara|iese|ase)\b/.test(t),
    /\bse\s+\w+(a|e|an|en)\b/.test(t) && words >= 8,
    /\b(sin embargo|no obstante|a pesar de|pese a|no solo.*sino)\b/.test(t),
    /\bfue\s+\w+(ado|ido|to|cho)\b/.test(t),
    queCount >= 2 && words >= 12,
    /\b(si bien|cuanto mas|cuanto antes|cuanto mayor)\b/.test(t),
    /\b(habria|hubiera|hubiese)\b/.test(t),
    /\b(imprescindible|indispensable|fundamental)\s+que\b/.test(t),
    /\b(no solo|pese a|a menos que|dado que|puesto que)\b/.test(t),
    words >= 16 && /\b(que|quien|donde|cual)\b/.test(t) && /\b(fue|era|seria|habria|haya)\b/.test(t),
  ].filter(Boolean).length;
  if (cSignals >= 3) scores[34] += 12;
  if (cSignals >= 4) scores[34] += 5;
  if (words >= 20 && cSignals >= 2) scores[34] += 8;
  if (words >= 25 && cSignals >= 1) scores[34] += 6;

  // ── A1/A2 dampening: if any B1+ node scores ≥5, reduce A1/A2 ──
  const maxB1Plus = Math.max(...scores.slice(15)); // nodes 16-35 (indices 15-34)
  if (maxB1Plus >= 5) {
    for (let i = 0; i < 15; i++) scores[i] = Math.round(scores[i] * 0.6);
  }

  // ── Node 1: Regular present tense ──
  if (/present tense|presente|indicative|indicativo/.test(g) && !/subjunctive|subjuntivo|irregular/.test(g)) scores[0] += 10;
  // Only boost present if no other node has meaningful score AND sentence is short
  const maxOther = Math.max(...scores.slice(1));
  if (maxOther < 5 && words <= 8) {
    // Regular present: -ar/-er/-ir conjugation patterns
    if (/\b(hablo|hablas|habla|hablamos|hablan|como|comes|come|comemos|comen|vivo|vives|vive|vivimos|viven|trabajo|trabajas|trabaja|estudio|estudias|estudia|necesito|llego|llega|tomo|toma|busco|busca|espero|paso|miro|mira|compro|compra|pago|paga|camino|camina|cocino|cocina|limpio|limpia|pregunto|pregunta|escucho|escucha|canto|canta|bailo|baila|nado|nada|descanso|descansa|viajo|viaja)\b/.test(t)) {
      scores[0] += 5;
    }
  }

  // ── Node 2: Irregular present tense ──
  if (/irregular.*present|presente.*irregular/.test(g)) scores[1] += 12;
  if (maxOther < 5 && words <= 8) {
    // Irregular present verbs: ser, ir, tener, hacer, decir, poder, querer, saber, venir, poner, salir, conocer, dar, ver, oír, traer, caer
    if (/\b(soy|eres|es|somos|son|tengo|tienes|tiene|tenemos|tienen|voy|vas|va|vamos|van|hago|hace|hacemos|hacen|digo|dice|dicen|puedo|puedes|puede|podemos|pueden|quiero|quieres|quiere|queremos|quieren|se|sabes|sabe|sabemos|saben|vengo|vienes|viene|venimos|vienen|pongo|pones|pone|ponemos|ponen|salgo|sales|sale|salimos|salen|conozco|conoce|conoces|conocemos|conocen|doy|das|da|damos|dan|veo|ves|ve|vemos|ven|oigo|oyes|oye|oimos|oyen|traigo|traes|trae|traemos|traen|caigo|caes|cae|caemos|caen|estoy|estas|esta|estamos|estan|hay|leo|lees|lee|leemos|leen|escribo|escribe|juego|juega|duermo|duerme|pienso|piensa|creo|cree|entiendo|entiende)\b/.test(t)) {
      scores[1] += 4;
    }
  }
  // If a card was going to node-01 (present) check if verbs are irregular
  if (scores[0] > 0 && /\b(soy|eres|es|somos|son|tengo|tienes|tiene|tenemos|tienen|voy|vas|va|vamos|van|hago|hace|digo|dice|puedo|puede|quiero|quiere|se|sabe|vengo|viene|pongo|pone|salgo|sale|conozco|conoce|doy|da|veo|ve|oigo|oye|hay|estoy|esta)\b/.test(t)) {
    scores[1] += scores[0]; // transfer score to irregular
    scores[0] = 0;
  }

  // ── Find winner ──
  const maxScore = Math.max(...scores);

  if (maxScore === 0) {
    return assignByFeatures(raw, r, t, words, isQuestion);
  }

  return scores.indexOf(maxScore) + 1;
}

/**
 * Smarter fallback when no grammar pattern scored.
 * Spreads cards across nodes based on sentence features
 * instead of dumping everything to node-01.
 *
 * Key principle: node-01/02 should ONLY get very basic 1-3 word phrases.
 * Everything else goes to a more specific node based on content clues.
 */
function assignByFeatures(raw, r, t, words, isQuestion) {
  // Questions → node 4
  if (isQuestion) return 4;

  // Very short (1-2 words) → node 8 (common expressions)
  if (words <= 2) return 8;

  // Check for accented preterite we might have missed
  if (new RegExp(`[a-záéíóúüñ]{2,}ó(?![a-záéíóúüñ])`).test(r)) return 9;

  // Ser/estar sentences (short) → node 3
  if (/\b(es|son|soy|eres|somos|esta|estan|estoy|estas|estamos)\b/.test(t) && words <= 6) return 3;

  // Sentences with por/para → node 14
  if (/\b(por|para)\b/.test(t) && words >= 5) return 14;

  // Reflexive pronouns → node 13
  if (/\b(me|te|se|nos)\s+\w{3,}(o|as|a|amos|an)\b/.test(t) && words >= 4) return 13;

  // Sentences with "que" connecting clauses (relative) → node 20
  if (/\w+\s+que\s+\w+/.test(t) && words >= 8 && !isQuestion) return 20;

  // Short with articles/demonstratives → node 5
  if (words <= 5 && /\b(el|la|los|las|un|una|este|esta|ese|esa)\b/.test(t)) return 5;

  // Short with adjectives → node 7
  if (words <= 6 && /\b(muy|bastante|tan|mas|menos)\b/.test(t)) return 7;

  // Short declarative (3-4 words) → node 8 (common expressions)
  if (words <= 4) return 8;

  // 5-6 words → node 7 (descriptions)
  if (words <= 6) return 7;

  // 7-8 words → spread: object pronouns if lo/la/le present, else node-15
  if (words <= 8) {
    if (/\b(lo|la|los|las|le|les)\s+\w{3,}/.test(t)) return 15;
    return 15;
  }

  // 9-11 words → node 19 (future — medium complexity)
  if (words <= 11) return 19;

  // 12-15 words → node 20 (relative clauses — complex sentences)
  if (words <= 15) return 20;

  // 16-18 words → node 24 (passive & impersonal)
  if (words <= 18) return 24;

  // 19-22 words → node 25 (advanced connectors)
  if (words <= 22) return 25;

  // 23+ words → C1/C2
  if (words <= 25) return 30; // C1 idiomatic
  if (words <= 28) return 31; // C1 complex syntax
  return 35; // C2 advanced mixed
}

// ─── Run ───────────────────────────────────────────────────────────────

console.log('Classifying', deck.length, 'cards...\n');

const nodeCounts = new Array(NUM_NODES).fill(0);

for (const card of deck) {
  const node = classify(card);
  card.grammarNode = `node-${String(node).padStart(2, '0')}`;
  nodeCounts[node - 1]++;
}

// ─── Post-classification: Capacity-based overflow redistribution ──────
// Some nodes (especially Preterite, Future) have strong grammar signals
// that correctly classify many cards. But when a node is too large relative
// to others, it creates a bad user experience (too many cards before progression).
//
// Solution: cap each node and redistribute overflow to the same-tier or
// adjacent-tier node with the lowest count.

// Soft caps: target max per node (total unique cards, not per goal)
// Goal: no single node dominates — keep largest nodes under ~400
const NODE_CAPS = [
  /* 01 */ 350, /* 02 */ 350, /* 03 */ 350, /* 04 */ 350, /* 05 */ 250,
  /* 06 */ 250, /* 07 */ 350, /* 08 */ 300,
  /* 09 */ 350, /* 10 */ 350, /* 11 */ 350, /* 12 */ 200, /* 13 */ 250,
  /* 14 */ 250, /* 15 */ 350,
  /* 16 */ 350, /* 17 */ 250, /* 18 */ 250, /* 19 */ 350, /* 20 */ 300,
  /* 21 */ 300,
  /* 22 */ 250, /* 23 */ 200, /* 24 */ 200, /* 25 */ 200, /* 26 */ 150,
  /* 27 */ 150,
  /* 28 */ 100, /* 29 */ 100, /* 30 */ 100, /* 31 */ 100,
  /* 32 */ 80,  /* 33 */ 80,  /* 34 */ 80,  /* 35 */ 80,
];

// Neighbours: same tier first, then adjacent tiers (broader redistribution)
const NODE_NEIGHBOURS = [
  /* 01 */ [1,2,3,4,6,7],         /* 02 */ [0,2,3,4,6,7],         /* 03 */ [0,1,3,4,6,7],
  /* 04 */ [0,1,2,4,6,7],         /* 05 */ [0,1,3,6,7],           /* 06 */ [0,4,5,7],
  /* 07 */ [0,1,4,5,6],           /* 08 */ [0,1,6,7],
  /* 09 */ [9,10,11,12,13,14],    /* 10 */ [8,10,11,12,13,14],    /* 11 */ [8,9,11,12,13,14],
  /* 12 */ [8,9,10,13,14],        /* 13 */ [8,9,10,11,14],        /* 14 */ [8,12,13,11],
  /* 15 */ [8,9,12,13,14],
  /* 16 */ [16,17,18,19,20],      /* 17 */ [15,17,18,19,20],      /* 18 */ [15,16,18,19,20],
  /* 19 */ [15,16,17,19,20],      /* 20 */ [15,16,18,19],         /* 21 */ [15,17,18,19],
  /* 22 */ [22,23,24,25,26],      /* 23 */ [21,23,24,25,26],      /* 24 */ [21,22,24,25,26],
  /* 25 */ [21,22,23,25,26],      /* 26 */ [21,22,23,24,26],      /* 27 */ [21,24,25,26],
  /* 28 */ [28,29,30],            /* 29 */ [27,29,30],            /* 30 */ [27,28,30],
  /* 31 */ [27,28,29],
  /* 32 */ [32,33,34],            /* 33 */ [31,33,34],            /* 34 */ [31,32,34],
  /* 35 */ [31,32,33],
];

// Run multiple passes so overflow cascades through tiers
let totalRedistributed = 0;
const MAX_PASSES = 5;

for (let pass = 0; pass < MAX_PASSES; pass++) {
  let passRedistributed = 0;

  for (let nodeIdx = 0; nodeIdx < NUM_NODES; nodeIdx++) {
    const cap = NODE_CAPS[nodeIdx];
    if (nodeCounts[nodeIdx] <= cap) continue;

    const nodeId = `node-${String(nodeIdx + 1).padStart(2, '0')}`;
    const nodeCards = deck.filter(c => c.grammarNode === nodeId);
    const overflow = nodeCounts[nodeIdx] - cap;

    // Sort by "weakest match" — cards without grammar tips, longest first
    const candidates = nodeCards
      .map(card => ({
        card,
        hasGrammar: !!card.grammar,
        words: card.target.split(/\s+/).length,
      }))
      .sort((a, b) => {
        if (a.hasGrammar !== b.hasGrammar) return a.hasGrammar ? 1 : -1;
        return b.words - a.words;
      });

    let moved = 0;
    for (const { card } of candidates) {
      if (moved >= overflow) break;

      // Find best neighbour (lowest count, under cap)
      const neighbours = NODE_NEIGHBOURS[nodeIdx] || [];
      let bestNeighbour = -1;
      let bestCount = Infinity;
      for (const n of neighbours) {
        if (nodeCounts[n] < NODE_CAPS[n] && nodeCounts[n] < bestCount) {
          bestCount = nodeCounts[n];
          bestNeighbour = n;
        }
      }

      if (bestNeighbour >= 0) {
        const newNodeId = `node-${String(bestNeighbour + 1).padStart(2, '0')}`;
        card.grammarNode = newNodeId;
        nodeCounts[nodeIdx]--;
        nodeCounts[bestNeighbour]++;
        moved++;
      }
    }

    if (moved > 0) {
      passRedistributed += moved;
      if (pass === 0) {
        console.log(`  Redistributed ${moved} cards from ${nodeId} (was ${nodeCounts[nodeIdx] + moved}, now ${nodeCounts[nodeIdx]})`);
      }
    }
  }

  totalRedistributed += passRedistributed;
  if (passRedistributed === 0) break; // no more moves possible
  if (pass > 0) console.log(`  Pass ${pass + 1}: moved ${passRedistributed} more cards`);
}

if (totalRedistributed > 0) {
  console.log(`Total redistributed: ${totalRedistributed}\n`);
}

const nodeNames = [
  'Regular present', 'Irregular present', 'Ser vs estar', 'Common questions',
  'Articles & gender', 'Gustar & similar', 'Descriptions/adjectives', 'Common expressions',
  'Regular past', 'Irregular past', 'Imperfect', 'Past contrast',
  'Reflexive verbs', 'Por vs para', 'Object pronouns',
  'Present subjunctive', 'Imperative', 'Conditional', 'Future', 'Relative clauses',
  'Compound tenses',
  'Imperfect subjunctive', 'Complex conditionals', 'Passive & impersonal',
  'Advanced connectors', 'Verb phrases', 'Reported speech',
  'Subjunctive nuances', 'Register & formal', 'Idiomatic fluency', 'Complex syntax',
  'Literary tenses', 'Academic discourse', 'Cultural fluency', 'Advanced mixed'
];

const tierLabels = [
  'A1','A1','A1','A1','A1','A1','A1','A1',
  'A2','A2','A2','A2','A2','A2','A2',
  'B1','B1','B1','B1','B1','B1',
  'B2','B2','B2','B2','B2','B2',
  'C1','C1','C1','C1',
  'C2','C2','C2','C2'
];

console.log('Node distribution (all cards):');
for (let i = 0; i < NUM_NODES; i++) {
  const pct = ((nodeCounts[i] / deck.length) * 100).toFixed(1);
  console.log(`  node-${String(i+1).padStart(2,'0')} ${tierLabels[i]} ${nodeNames[i].padEnd(24)} ${String(nodeCounts[i]).padStart(5)}  (${pct}%)`);
}
console.log(`  ${'TOTAL'.padEnd(34)} ${deck.length}`);

// Per-goal
console.log('\nPer-goal node counts:');
for (const goal of ['general', 'travel', 'work', 'family']) {
  const gc = deck.filter(c => (c.tags || []).includes(goal));
  const gn = new Array(NUM_NODES).fill(0);
  gc.forEach(c => gn[parseInt(c.grammarNode.replace('node-', '')) - 1]++);
  const line = gn.map(n => String(n).padStart(5)).join('');
  console.log(`  ${goal.padEnd(8)} (${String(gc.length).padStart(4)}): ${line}`);
}

// Samples — check classification of key cards
console.log('\nSample cards:');
for (const id of [1, 14, 100, 1205, 2770, 4923, 5083, 5260, 6171, 6548, 7000, 7704, 7800, 7900, 8000, 8100, 8200]) {
  const c = deck.find(d => d.id === id);
  if (c) {
    const nn = parseInt(c.grammarNode.replace('node-', '')) - 1;
    console.log(`  #${String(c.id).padStart(5)} → ${c.grammarNode} ${tierLabels[nn]} (${nodeNames[nn].padEnd(24)}) "${c.target.substring(0, 60)}"`);
  }
}

// Per-tier summary
console.log('\nPer-tier summary (general goal):');
const generalCards = deck.filter(c => (c.tags || []).includes('general'));
const tierCounts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
generalCards.forEach(c => {
  const nn = parseInt(c.grammarNode.replace('node-', '')) - 1;
  tierCounts[tierLabels[nn]]++;
});
for (const [tier, count] of Object.entries(tierCounts)) {
  console.log(`  ${tier}: ${count} cards`);
}
console.log(`  Total: ${generalCards.length}`);

writeFileSync(deckPath, JSON.stringify(deck, null, 2));
console.log('\n✓ Updated deck.json');
