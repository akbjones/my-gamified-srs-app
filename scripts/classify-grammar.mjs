/**
 * Grammar Node Classifier for Spanish Deck (v2)
 *
 * Assigns each card to one of 26 CEFR grammar nodes (A1→C2) based on
 * sentence structure analysis and grammar tip keywords.
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

// ─── Classification ────────────────────────────────────────────────────

function classify(card) {
  const raw = card.target || '';
  const t = norm(raw);           // accent-stripped for \b regex
  const r = lower(raw);          // lowercase WITH accents for tense detection
  const g = norm(card.grammar || '');
  const words = raw.split(/\s+/).length;
  const isQuestion = raw.startsWith('¿');

  const scores = new Array(26).fill(0);
  const queCount = (t.match(/\bque\b/g) || []).length;

  // ── Node 17: Si clauses (Complex conditionals) ──
  if (/\bsi\s+\w+(iera|ara|iese|ase)\b/.test(t)) scores[16] += 12;
  if (/\bsi\b/.test(t) && /\w+(aria|eria|iria)\b/.test(t)) scores[16] += 10;
  if (/si clause|conditional.*si|si.*conditional|condicional.*si/i.test(g)) scores[16] += 14;
  if (/\bsi hubiera\b|\bsi pudiera\b|\bsi tuviera\b|\bsi fuera\b/.test(t)) scores[16] += 12;

  // ── Node 16: Imperfect subjunctive ──
  const impfSubjMatch = t.match(/\w+(iera|ieras|ieramos|ieran|iese|ieses|iesemos|iesen)\b/g);
  // Also catch -ara/-aras but NOT common words: para, cara, rara, clara, amara(love)
  const araMatch = t.match(/\w{3,}(ara|aras|aramos|aran)\b/g);
  const filteredAra = araMatch ? araMatch.filter(m => !/\b(para|cara|rara|clara|avara|prepara|compara|separa|repara|declara|dispara)\b/.test(m)) : [];
  const hasImpfSubj = (impfSubjMatch && impfSubjMatch.length > 0) || filteredAra.length > 0;
  if (hasImpfSubj && !(/\bsi\s/.test(t))) scores[15] += 8;
  if (/\bquisiera\b|\bpudiera\b|\bdebiera\b/.test(t)) scores[15] += 7;
  if (/imperfect subjunctive|past subjunctive|subjuntivo imperfecto|subjuntivo pasado/.test(g)) scores[15] += 14;
  if (hasImpfSubj && /\bque\b|\bpara que\b|\bcomo si\b|\bojala\b/.test(t)) scores[15] += 5;

  // ── Node 11: Present subjunctive ──
  const subjTriggerWords = /\b(espero que|quiero que|necesito que|es importante que|es necesario que|es posible que|dudo que|no creo que|ojala|para que|antes de que|despues de que|sin que|a menos que|con tal de que|hasta que|es mejor que|prefiero que|sugiero que|recomiendo que|pido que|dejo que|hace falta que|es probable que|es imprescindible que|es fundamental que|es vital que|es esencial que|no pienso que|puede que)\b/;
  if (subjTriggerWords.test(t) && !hasImpfSubj) scores[10] += 9;
  if (/\bojala\b/.test(t)) scores[10] += 8;
  if (/subjunctive|subjuntivo/.test(g) && !/imperfect|past|pasado/.test(g)) scores[10] += 12;
  if (/\bpara que\b/.test(t) && !hasImpfSubj) scores[10] += 6;
  if (subjTriggerWords.test(t)) scores[10] += 4;
  // "aunque" + present subjunctive context
  if (/\baunque\b/.test(t) && words >= 5) scores[10] += 4;

  // ── Node 13: Conditional ──
  // Accent-stripped: -aria/-eria/-iria endings
  if (/\w+(aria|arias|ariamos|arian|eria|erias|eriamos|erian|iria|irias|iriamos|irian)\b/.test(t) && !(/\bsi\s/.test(t))) scores[12] += 7;
  // Common conditional verbs (accent-stripped)
  if (/\b(seria|tendria|podria|haria|diria|querria|vendria|sabria|pondria|gustaria|deberia|habria|estaria|iria|daria|viviria|compraria|necesitaria|preferiria|me gustaria)\b/.test(t)) scores[12] += 8;
  if (/conditional|condicional/.test(g) && !/si clause/.test(g)) scores[12] += 12;
  if (/\bme gustaria\b/.test(t)) scores[12] += 6;

  // ── Node 14: Future & perfect tenses ──
  // Future: accent-stripped endings -are/-ara/-ire/-ira (careful: "para" is not future)
  // Use specific known future verbs (accent-stripped) to avoid ambiguity
  if (/\b(sera|tendra|podra|hara|dira|vendra|sabra|pondra|saldra|habra|querra|valdra|ira|tendre|podre|hare|dire|vendre|sabre|pondre|saldre|habre|querre|sere|estare|vivire|trabajare|estudiare|comprare|hablare|comere|ire|dare|vere|seras|tendras|podras|haras|diras|vendras|sabras|pondras|saldras|habras|iremos|seremos|tendremos|podremos|haremos|sabremos)\b/.test(t)) scores[13] += 8;
  // Ir a + infinitive (near future)
  if (/\b(voy a|vas a|va a|vamos a|van a)\s+\w+r\b/.test(t)) scores[13] += 6;
  // Perfect tenses: haber + participle (accent-stripped works fine)
  if (/\b(he|has|ha|hemos|han)\s+\w+(ado|ido|to|cho|so|sto|erto)\b/.test(t)) scores[13] += 9;
  if (/\b(habia|habias|habiamos|habian)\s+\w+(ado|ido|to|cho|so|sto|erto)\b/.test(t)) scores[13] += 9;
  if (/future|futuro|perfect|perfecto|haber/.test(g)) scores[13] += 12;
  // Detect accented future endings in raw text with Spanish-aware boundary
  if (new RegExp(`[a-záéíóúüñ]+(aré|arás|ará|aremos|arán|eré|erás|erá|eremos|erán|iré|irás|irá|iremos|irán)${E}`).test(r)) scores[13] += 7;

  // ── Node 6: Preterite ──
  // Time markers
  if (/\b(ayer|anoche|la semana pasada|el mes pasado|el ano pasado|hace\s+\w+\s+(anos|meses|dias|semanas)|una vez|de repente|entonces|el otro dia|la otra noche)\b/.test(t)) scores[5] += 7;
  // Irregular preterite verbs (accent-stripped, all work fine with \b)
  if (/\b(fue|fui|fuiste|fuimos|fueron|dijo|hizo|tuvo|tuve|puso|puse|vino|vine|supo|supe|quiso|quise|pudo|pude|dio|vi|vio|estuvo|estuve|hubo|condujo|trajo|tradujo|produjo|dieron|dijeron|hicieron|tuvieron|pusieron|vinieron|supieron|quisieron|pudieron|estuvieron|condujeron|trajeron)\b/.test(t)) scores[5] += 7;
  // ACCENT-AWARE: -ó ending = preterite 3rd person (habló, comió, vivió)
  // Using Spanish-aware boundary instead of broken \b
  if (new RegExp(`[a-záéíóúüñ]{2,}ó${E}`).test(r)) scores[5] += 7;
  // ACCENT-AWARE: -é ending on verbs (hablé, comí) — 1st person preterite
  // Exclude common non-verb words ending in é
  const hasAccentE = new RegExp(`[a-záéíóúüñ]{3,}é${E}`).test(r);
  if (hasAccentE && !/\b(tambien|despues|cafe|jose|bebe|pure|canape|que|porque)\b/.test(t)) scores[5] += 5;
  // -aron, -ieron endings (3rd person plural preterite)
  if (/\w+(aron|ieron)\b/.test(t)) scores[5] += 6;
  // -aste, -iste (2nd person singular preterite)
  if (/\w+(aste|iste)\b/.test(t)) scores[5] += 6;
  // Known 1st person plural preterite
  if (/\b(conocimos|salimos|comimos|vivimos|hicimos|dijimos|pusimos|tuvimos|supimos|vinimos|fuimos|estuvimos|pudimos|llegamos|empezamos|terminamos|encontramos|compramos|pagamos|cenamos|almorzamos|desayunamos|viajamos|visitamos|llamamos|mandamos|pasamos|tomamos|jugamos|bailamos|cantamos|caminamos)\b/.test(t)) scores[5] += 5;
  if (/preterit|preterito|indefinido/.test(g)) scores[5] += 12;

  // ── Node 7: Imperfect ──
  if (/\b(siempre|todos los dias|cada dia|a menudo|frecuentemente|de nino|de pequeno|cuando era|mientras|solia|normalmente|generalmente|habitualmente|en aquella epoca|en esa epoca)\b/.test(t)) scores[6] += 7;
  // Known imperfect forms (accent-stripped works for these)
  if (/\b(era|eras|eramos|eran|estaba|estabas|estabamos|estaban|tenia|tenias|teniamos|tenian|habia|hacia|decia|podia|queria|sabia|venia|iba|ibas|ibamos|iban|vivia|viviamos|vivian|parecia|creia|sentia|conocia|existia|necesitaba|trabajaba|estudiaba|jugaba|gustaba|llamaba|llevaba|pasaba|pensaba|hablaba|miraba|esperaba|caminaba|cantaba|bailaba|lloraba|sonaba|soñaba)\b/.test(t)) scores[6] += 6;
  // -aba endings (1st/3rd person imperfect -ar verbs)
  if (/\w{3,}(aba|abas|abamos|aban)\b/.test(t)) scores[6] += 6;
  // -ía endings: detect via accent-aware pattern on r
  if (new RegExp(`[a-záéíóúüñ]{3,}(ía|ías|íamos|ían)${E}`).test(r)) {
    // But exclude conditional -ría endings
    if (!new RegExp(`[a-záéíóúüñ]+(aría|ería|iría|arías|erías|irías|aríamos|eríamos|iríamos|arían|erían|irían)${E}`).test(r)) {
      scores[6] += 6;
    }
  }
  if (/imperfect|imperfecto/.test(g) && !/subjunctive|subjuntivo/.test(g)) scores[6] += 12;

  // ── Node 8: Reflexive verbs ──
  // Broad reflexive: me/te/se/nos + common reflexive verbs
  if (/\b(me|te|se|nos)\s+(despierto|despiertas|despierta|levanto|levantas|levanta|acuesto|acuestas|acuesta|ducho|duchas|ducha|visto|vistes|viste|siento|sientes|siente|quedo|quedas|queda|llamo|llamas|llama|preocupo|preocupas|preocupa|lavo|lavas|lava|aburro|aburres|aburre|caso|casas|casa|encuentro|encuentras|encuentra|arrepiento|arrepientes|arrepiente|preparo|preparas|prepara|olvido|olvidas|olvida|quejo|quejas|queja|divierto|diviertes|divierte|pongo|pones|pone|peino|peinas|peina|maquillo|maquillas|maquilla|acerco|acercas|acerca|alejo|alejas|aleja|porto|portas|porta|comporto|comportas|comporta|dedico|dedicas|dedica|senti|sintio|levante|levanto|desperto|acosto|duche|vesti|cai|caigo|caes|cae|junto|juntas|junta|reuno|reunes|reune|relajo|relajas|relaja|concentro|concentras|concentra|equivoco|equivocas|equivoca)\b/.test(t)) scores[7] += 9;
  if (/\w+(arse|erse|irse)\b/.test(t)) scores[7] += 6;
  if (/reflexive|reflexivo|pronominal/.test(g)) scores[7] += 12;
  // me/te/nos + any verb-like pattern (broader catch)
  if (/\b(me|te|nos)\s+\w{3,}(o|as|a|amos|an)\b/.test(t)) scores[7] += 3;

  // ── Node 12: Commands (imperative) ──
  // Irregular imperative forms (accent-stripped)
  if (/\b(ven|haz|sal|pon|ten|ve|oye|dime|dame|hazme|ponme|digame|traigame|venga|vaya|haga|diga|ponga|tenga|traiga|salga|mire|espere|perdone|disculpe|sientese|callese|levantese)\b/.test(t)) scores[11] += 8;
  // Negative commands
  if (/\bno\s+(hagas|digas|vayas|pongas|tengas|salgas|vengas|comas|bebas|toques|olvides|te preocupes|te vayas|te olvides|lo hagas|la dejes|les digas|te rindas|abras|cierres|hables|corras|grites|llores|mires|saltes|te muevas|te acerques|te levantes)\b/.test(t)) scores[11] += 8;
  if (/command|imperative|imperativo/.test(g)) scores[11] += 12;
  // Sentence starts with verb in imperative form (much broader)
  const imperativeStart = /^(no\s+)?(ven|haz|sal|pon|ten|ve|mira|escucha|espera|toma|dime|dame|abre|cierra|saca|llama|pasa|sube|baja|lee|corre|para|busca|compra|trae|lleva|deja|prueba|intenta|recuerda|aprende|practica|camina|estudia|habla|come|bebe|prepara|limpia|lava|cocina|corta|mezcla|anade|sirve|enciende|apaga|revisa|verifica|confirma|envia|responde|contesta|pregunta|pide|ayuda|cuida|sigue|repite|termina|empieza|comienza|usa|utiliza|imagina|piensa|observa|fijate|escribe|anota|marca|indica|maneja|conduce|frena|gira|evita|agrega|coloca|mueve|guarda|cuelga|carga|instala|conecta|registra|rellena|disfruta|aprovecha|asegurate|informate|animate|levantate|acuestate)(\s|$|,|\.)/;
  if (imperativeStart.test(t)) scores[11] += 8;
  // "por favor" in short sentence often means polite command
  if (/\bpor favor\b/.test(t) && words <= 12) scores[11] += 3;

  // ── Node 2: Ser vs estar ──
  // Both in same sentence — strong signal
  if (/\b(es|son|soy|eres|somos)\b/.test(t) && /\b(esta|estan|estoy|estas|estamos)\b/.test(t)) scores[1] += 14;
  if (/\bser\b.*\bestar\b|\bestar\b.*\bser\b|ser vs|estar vs/.test(g)) scores[1] += 14;
  if (/\b(ser|estar)\b/.test(g) && /\b(temporary|permanent|location|state|characteristic|condition)\b/.test(g)) scores[1] += 10;
  // Ser for identity/description — only short sentences
  if (words <= 7 && /\b(soy|eres|es|somos|son)\b/.test(t) && /\b(un|una|el|la|de|muy|bastante)\b/.test(t)) scores[1] += 4;
  // Estar for states/location — only short sentences
  if (words <= 7 && /\b(estoy|estas|esta|estamos|estan)\b/.test(t) && /\b(bien|mal|contento|triste|cansado|enfermo|ocupado|listo|nervioso|preocupado|aqui|alli|ahi|cerca|lejos|en)\b/.test(t)) scores[1] += 5;
  // Short sentences with ser/estar as main verb
  if (words <= 6 && /\b(es|son|soy|eres|somos|esta|estan|estoy|estas|estamos)\b/.test(t)) scores[1] += 3;

  // ── Node 5: Gustar & similar ──
  if (/\b(me|te|le|nos|les)\s+(gusta|gustan|encanta|encantan|interesa|interesan|importa|importan|molesta|molestan|fascina|fascinan|preocupa|preocupan|parece|parecen|duele|duelen|falta|faltan|sobra|sobran|apetece|apetecen|conviene|queda|quedan|cuesta|cuestan|sorprende|sorprenden|aburre|aburren)\b/.test(t)) scores[4] += 10;
  if (/gustar|encantar|interesar|importar|parecer|doler|faltar/.test(g)) scores[4] += 12;

  // ── Node 9: Por vs para ──
  if (/\bpor\b/.test(t) && /\bpara\b/.test(t)) scores[8] += 12;
  if (/\bpor\b.*\bpara\b|\bpara\b.*\bpor\b|por vs|para vs/.test(g)) scores[8] += 14;
  if (/\b(por|para)\b/.test(g) && /\b(reason|purpose|exchange|duration|cause|goal|recipient|destinatario)\b/.test(g)) scores[8] += 8;
  // "por" with context clues
  if (/\bpor\s+(eso|favor|ejemplo|lo menos|supuesto|lo tanto|lo general|cierto|fin|suerte|desgracia|primera vez|ultima vez|lo visto|casualidad)\b/.test(t)) scores[8] += 5;
  if (/\bpor\s+(la manana|la tarde|la noche|la calle|el parque|el centro|el camino|aqui|alli|ahi)\b/.test(t)) scores[8] += 5;
  // "para" with purpose/deadline
  if (/\bpara\s+(mi|ti|el|ella|nosotros|ellos|que|siempre|manana|hoy|cuando)\b/.test(t)) scores[8] += 4;

  // ── Node 10: Object pronouns ──
  // Double object pronouns — very strong
  if (/\b(me lo|me la|me los|me las|te lo|te la|te los|te las|se lo|se la|se los|se las|nos lo|nos la|nos los|nos las)\b/.test(t)) scores[9] += 12;
  if (/object pronoun|pronombre|direct object|indirect object|lo\/la|le\/les|complemento/.test(g)) scores[9] += 12;
  // Single pronoun before verb (broad verb list)
  if (/\b(lo|la|los|las|le|les)\s+(dije|digo|di|doy|compre|traje|mande|envie|preste|regale|conte|explique|pedi|prometi|ofreci|mostre|ensene|presente|entregue|devolvi|quite|lleve|pregunte|respondi|dimos|dieron|damos|dan)\b/.test(t)) scores[9] += 8;
  // Pronoun attached to infinitive or gerund
  if (/\w+(arlo|arla|arlos|arlas|erlo|erla|irlo|irla|andolo|andola|iendolo|iendola)\b/.test(t)) scores[9] += 7;
  // lo/la/le before conjugated verb pattern
  if (/\b(lo|la|le|les)\s+\w{3,}(o|as|a|amos|an|e|es|emos|en)\b/.test(t) && words >= 4) scores[9] += 4;

  // ── Node 18: Passive & impersonal ──
  if (/\bse\s+(habla|vende|venden|necesita|necesitan|busca|buscan|dice|puede|pueden|ofrece|ofrecen|acepta|aceptan|permite|permiten|prohibe|prohiben|recomienda|recomiendan|alquila|alquilan|sirve|sirven|usa|usan|utiliza|utilizan|conoce|conocen|considera|consideran|cree|creen|espera|esperan|sabe|supone|requiere|requieren|exige|exigen|produce|producen|practica|practican|celebra|celebran|come|comen|bebe|beben|hablan|ven|escucha|escuchan)\b/.test(t)) scores[17] += 9;
  if (/\bfue\s+\w+(ado|ido|to|cho)\b/.test(t)) scores[17] += 9;
  if (/passive|pasiva|impersonal|se\s+(passive|impersonal)/.test(g)) scores[17] += 12;
  // "se" + 3rd person verb at start (impersonal)
  if (/^se\s+\w{3,}(a|e|an|en)\b/.test(t) && !/^se\s+(me|te|nos)\b/.test(t)) scores[17] += 5;

  // ── Node 15: Relative clauses ──
  if (/\b(lo que|el que|la que|los que|las que|en donde|en el que|en la que|con quien|para quien|por lo que|cuyo|cuya|cuyos|cuyas|a quien|de quien|con el que|con la que|en los que|en las que|del que|de la que|al que|a la que)\b/.test(t)) scores[14] += 9;
  if (/relative clause|relativo|relative pronoun|oracion de relativo/.test(g)) scores[14] += 12;
  // Descriptive "que" after nouns
  if (/\b(persona|cosa|lugar|momento|dia|vez|forma|manera|razon|motivo|libro|pelicula|cancion|ciudad|pais|casa|trabajo|problema|idea|proyecto)\s+que\b/.test(t)) scores[14] += 5;
  if (/\bdonde\b/.test(t) && !isQuestion && words >= 5) scores[14] += 4;

  // ── Node 19: Advanced connectors ──
  if (/\b(sin embargo|no obstante|por lo tanto|en consecuencia|a pesar de|pese a|en cambio|por el contrario|ademas|asimismo|de hecho|en efecto|es decir|o sea|en otras palabras|mientras que|dado que|puesto que|ya que|con el fin de|a fin de|siempre y cuando|siempre que|en cuanto|tan pronto como|a medida que|debido a|por otro lado|en primer lugar|en conclusion|en resumen|por consiguiente|con respecto a|en todo caso|de todos modos|al fin y al cabo|si bien|aun asi|con todo|dicho esto|por ende)\b/.test(t)) scores[18] += 10;
  if (/connector|conector|linking|discourse|marcador/.test(g)) scores[18] += 12;

  // ── Node 3: Common questions ──
  if (isQuestion) scores[2] += 5;
  if (isQuestion && /\b(como|cuando|donde|que|quien|cual|cuanto|cuantos|cuantas|por que|adonde|de donde)\b/.test(t)) scores[2] += 5;
  if (/question|interrogative|pregunta/.test(g)) scores[2] += 10;
  if (isQuestion && words <= 8) scores[2] += 3;

  // ── Node 4: Articles & gender ──
  if (/article|articulo|gender|genero|masculine|feminine|masculino|femenino|el\/la|un\/una|concordancia/.test(g)) scores[3] += 12;
  if (/\b(este|esta|estos|estas|ese|esa|esos|esas|aquel|aquella|aquellos|aquellas)\s+\w+\b/.test(t)) scores[3] += 3;
  if (words <= 6 && /\b(el|la|los|las|un|una|unos|unas)\s+\w+\b/.test(t)) scores[3] += 3;

  // ── Node 20: Mixed advanced (B2 capstone) ──
  // Sentences that combine multiple B2-level structures or are long + complex
  const b2Signals = [
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
  if (b2Signals >= 2) scores[19] += 10;
  if (b2Signals >= 3) scores[19] += 5;
  if (words >= 15 && b2Signals >= 1) scores[19] += 5;
  if (words >= 18 && b2Signals >= 1) scores[19] += 4;

  // ── Node 21: Subjunctive nuances (C1) ──
  if (/\bcomo si\b/.test(t) && hasImpfSubj) scores[20] += 12;
  if (/\bel hecho de que\b/.test(t)) scores[20] += 12;
  if (new RegExp(`${S}sea como sea${E}`).test(r)) scores[20] += 12;
  if (/\bpor mas que\b|\bpor mucho que\b|\bpor muy\b/.test(t)) scores[20] += 10;
  if (/\bno es que\b/.test(t)) scores[20] += 10;
  if (/\bque yo sepa\b|\bque yo recuerde\b/.test(t)) scores[20] += 10;
  if (/\bquienquiera que\b|\bdondequiera que\b|\bcomoquiera que\b/.test(t)) scores[20] += 12;
  if (/\bhagas lo que hagas\b|\bpase lo que pase\b|\bdiga lo que diga\b|\bsea lo que sea\b/.test(t)) scores[20] += 12;
  if (/\bpor poco que\b/.test(t)) scores[20] += 10;
  if (/\bsin que\b/.test(t) && words >= 8) scores[20] += 5;
  if (/\ba pesar de que\b/.test(t) && hasImpfSubj) scores[20] += 6;
  if (/subjunctive nuance|mood contrast|indicative vs subjunctive/.test(g)) scores[20] += 14;

  // ── Node 22: Verb Phrases (C1) ──
  if (new RegExp(`${S}llev(o|a|as|amos|an|aba|aban)\\s+[a-záéíóúüñ]*\\s*(años|meses|días|horas|semanas|rato|tiempo|toda)`, 'i').test(r)) scores[21] += 12;
  if (new RegExp(`${S}llev(o|a|as|amos|an|aba|aban)\\s+[a-záéíóúüñ]+(ando|iendo)${E}`).test(r)) scores[21] += 12;
  if (/\bacab(o|a|as|amos|an|aba|aban|e|es|amos)\s+de\s+\w+r\b/.test(t)) scores[21] += 12;
  if (/\bse\s+pus(o|ieron|e|imos)\s+a\b|\bponerse a\b/.test(t)) scores[21] += 12;
  if (/\bdej(o|a|e|aron|amos)\s+de\s+\w+(ar|er|ir)\b/.test(t)) scores[21] += 10;
  if (/\bvolv(io|ieron|i|imos|era|eras|emos)\s+a\s+\w+(ar|er|ir)\b/.test(t)) scores[21] += 10;
  if (new RegExp(`${S}volv(ió|ieron|í|imos|erá|erás|emos)\\s+a\\s+[a-záéíóúüñ]+(ar|er|ir)${E}`).test(r)) scores[21] += 10;
  if (/\bsigu(e|en|io|ieron|o|ieron)\s+\w+(ando|iendo)\b/.test(t)) scores[21] += 10;
  if (/\band(a|an|aba|aban)\s+\w+(ando|iendo)\b/.test(t)) scores[21] += 10;
  if (new RegExp(`est(á|aba|aban)\\s+a punto de${E}`).test(r)) scores[21] += 10;
  if (/\bno dej(a|o|e|es)\s+de\b/.test(t)) scores[21] += 8;
  if (/periphrastic|perífrasis|verb phrase|llevar.*gerund|acabar de|ponerse a|dejar de|volver a|seguir.*gerund|andar.*gerund/.test(g)) scores[21] += 14;

  // ── Node 23: Reported Speech (C1) ──
  if (/\b(dijo|dijeron|contó|contaron|comentó|comentaron|explicó|explicaron|aseguró|aseguraron|afirmó|afirmaron|confesó|confesaron|reconoció|reconocieron|mencionó|mencionaron|juró|juraron|negó|negaron)\s+que\b/.test(t)) scores[22] += 10;
  if (/\b(preguntó|preguntaron)\s+(si|que|por que|como|cuando|donde|cuanto)\b/.test(t)) scores[22] += 10;
  if (/\bme\s+pid(io|ieron)\s+que\b|\ble\s+pid(io|ieron)\s+que\b/.test(t)) scores[22] += 10;
  if (/\b(segun el|segun ella|segun mis|segun los|segun la|segun el medico|segun el periodico|segun la profesora)\b/.test(t)) scores[22] += 10;
  if (/\b(me|le|les|nos)\s+(advirtio|advirtieron|sugirió|sugirieron|recomendo|recomendaron|informo|informaron|comunico|comunicaron|aviso|avisaron|recordo|recordaron|reprochó|reprocharon|exigió|exigieron|rogó|rogaron|insistió|insistieron)\b/.test(t)) scores[22] += 9;
  if (new RegExp(`(dijo|contó|explicó|aseguró|prometió|afirmó|confesó|reconoció|mencionó|respondió|comentó|informó|advirtió|sugirió|recordó|negó|juró)\\s+que`, 'i').test(r)) scores[22] += 8;
  if (/reported speech|estilo indirecto|indirect speech|tense.*shift|backshift/.test(g)) scores[22] += 14;
  if (/\bal dia siguiente\b|\besa semana\b|\baquella\b/.test(t)) scores[22] += 5;

  // ── Node 24: Register & Style (C2) ──
  if (/\bcabe\s+(destacar|senalar|preguntarse|la posibilidad|mencionar|recordar|anadir)\b/.test(t)) scores[23] += 12;
  if (/\bde haber\s+\w+(ado|ido|to|cho|so)\b/.test(t)) scores[23] += 12;
  if (/\bde no\s+(haber|ser|mediar)\b/.test(t)) scores[23] += 10;
  if (/\ben virtud de\b|\ben aras de\b|\ba tenor de\b|\bcon arreglo a\b|\bhuelga decir\b|\ben lo sucesivo\b|\ben lo tocante\b|\ben lo que respecta\b/.test(t)) scores[23] += 14;
  if (/\bhubo\s+\w+(ado|ido|to|cho)\b/.test(t)) scores[23] += 12;
  if (/\bdicho esto\b|\bdicho lo cual\b|\bvalga como\b|\bprocede\b/.test(t)) scores[23] += 8;
  // Future/conditional of probability
  if (new RegExp(`(será|habrá|tendrá|estará|serán|habrán)\\s+(las|unos|unas|como|más|menos|bastante|aproximadamente|alrededor)`, 'i').test(r)) scores[23] += 10;
  if (new RegExp(`(habría|tendría|estaría|sería)\\s+unos`, 'i').test(r)) scores[23] += 10;
  if (/\ba mi juicio\b|\ba la luz de\b|\ben resumidas cuentas\b|\bconviene\s+(recordar|senalar|destacar)\b/.test(t)) scores[23] += 8;
  if (/register|formal.*style|literary|preterito anterior|future.*probability|academic.*discourse/.test(g)) scores[23] += 14;

  // ── Node 25: Idiomatic Fluency (C2) ──
  if (/idiom|idiomatic|modismo|expression|expresion|slang|colloquial|refran|dicho|proverb/.test(g)) scores[24] += 14;
  if (/\b(me costo un ojo|llover a cantaros|meter la pata|echar una mano|pan comido|quedarse de piedra|quedarse en blanco|viento en popa|gato encerrado|harina de otro costal|tomarse el pelo|tomar el pelo|ir al grano|tirar la toalla|morderse la lengua|pasarse de la raya|dar gato por liebre|perder la cabeza|tener.*as bajo la manga|entre la espada y la pared)\b/.test(t)) scores[24] += 14;
  // Proverb patterns
  if (/\b(mas vale|no hay mal|quien mucho abarca|ojos que no ven|dime con quien|en boca cerrada|a quien madruga|no todo lo que brilla|cada maestrillo|al mal tiempo|cuando el rio suena|no muerdas la mano)\b/.test(t)) scores[24] += 14;
  // Colloquial expressions
  if (/\b(me lo pase bomba|me tiene hasta las narices|no me vengas con esas|no le des mas vueltas|me pillo por sorpresa|se le fue la lengua|con pelos y senales|me tienes en ascuas)\b/.test(t)) scores[24] += 12;

  // ── Node 26: Complex Syntax (C2) ──
  // Absolute participial clauses at start
  if (/^(terminada|resueltos|abierta|vistas|hechas|cumplidos|agotadas|analizada|concluida|sentados|llegados|puesto|dicho)\s/i.test(t)) scores[25] += 14;
  // Nominalized infinitives
  if (/\bel\s+(haber|vivir|saber|no haber|no saber|trabajar|escuchar)\b/.test(t) && words >= 8) scores[25] += 10;
  // Cleft sentences
  if (/\bes\s+(precisamente|solo|mediante|por eso)\s+(por|como|cuando)\b/.test(t)) scores[25] += 12;
  if (/\bno es sino\b/.test(t)) scores[25] += 12;
  // Multiple subordination (3+ "que")
  if (queCount >= 3 && words >= 15) scores[25] += 8;
  // Complex comparative correlations
  if (/\bcuantos? mas\b.*\b(mas|mejor|mayor|menor|peor)\b/.test(t)) scores[25] += 8;
  if (/\bcuanto (antes|mayor|menor|mas|menos)\b/.test(t)) scores[25] += 6;
  // Long formal sentences
  if (words >= 20 && /\b(sino que|no solo|lo cierto es|lo paradojico|lo realmente)\b/.test(t)) scores[25] += 6;
  if (/participial|nominalization|complex syntax|subordination|cleft/.test(g)) scores[25] += 14;

  // ── A1/A2 dampening: if any B1+ node scores ≥5, reduce A1/A2 ──
  const maxB1Plus = Math.max(...scores.slice(10)); // nodes 11-26 (indices 10-25)
  if (maxB1Plus >= 5) {
    for (let i = 0; i < 10; i++) scores[i] = Math.round(scores[i] * 0.6);
  }

  // ── Node 1: Present tense (genuinely present tense, not catchall) ──
  if (/present tense|presente|indicative|indicativo/.test(g) && !/subjunctive|subjuntivo/.test(g)) scores[0] += 10;
  // Only boost present if no other node has meaningful score AND sentence is short
  const maxOther = Math.max(...scores.slice(1));
  if (maxOther < 5 && words <= 8) {
    if (/\b(soy|eres|es|somos|son|tengo|tienes|tiene|tenemos|tienen|hablo|hablas|habla|hablamos|hablan|como|comes|come|comemos|comen|vivo|vives|vive|vivimos|viven|trabajo|trabajas|trabaja|estudio|estudias|estudia|quiero|puedo|necesito|hay|voy|vas|va|vamos|van|hago|hace|digo|dice|pongo|salgo|conozco|conoce|leo|lees|lee|escribo|escribe|juego|juega|duermo|duerme|pienso|piensa|creo|cree|entiendo|entiende|llego|llega|tomo|toma|busco|busca|espero|paso|miro|mira)\b/.test(t)) {
      scores[0] += 4;
    }
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
 * Key principle: node-01 should ONLY get very basic 1-3 word phrases.
 * Everything else goes to a more specific node based on content clues.
 */
function assignByFeatures(raw, r, t, words, isQuestion) {
  // Questions → node 3
  if (isQuestion) return 3;

  // Very short (1-2 words) → node 1 (these are genuinely beginner)
  if (words <= 2) return 1;

  // Check for accented preterite we might have missed
  if (new RegExp(`[a-záéíóúüñ]{2,}ó(?![a-záéíóúüñ])`).test(r)) return 6;

  // Ser/estar sentences (short) → node 2
  if (/\b(es|son|soy|eres|somos|esta|estan|estoy|estas|estamos)\b/.test(t) && words <= 6) return 2;

  // Sentences with por/para → node 9
  if (/\b(por|para)\b/.test(t) && words >= 5) return 9;

  // Reflexive pronouns → node 8
  if (/\b(me|te|se|nos)\s+\w{3,}(o|as|a|amos|an)\b/.test(t) && words >= 4) return 8;

  // Sentences with "que" connecting clauses (relative) → node 15
  if (/\w+\s+que\s+\w+/.test(t) && words >= 8 && !isQuestion) return 15;

  // Short with articles/demonstratives → node 4
  if (words <= 5 && /\b(el|la|los|las|un|una|este|esta|ese|esa)\b/.test(t)) return 4;

  // Short declarative (3-5 words) → node 2 (basic description)
  if (words <= 4) return 2;

  // 5-6 words → node 4 (articles & gender / short descriptions)
  if (words <= 6) return 4;

  // 7-8 words → spread: object pronouns if lo/la/le present, else node-10
  if (words <= 8) {
    if (/\b(lo|la|los|las|le|les)\s+\w{3,}/.test(t)) return 10;
    return 10;
  }

  // 9-11 words → node 14 (future & perfect — medium complexity)
  if (words <= 11) return 14;

  // 12-15 words → node 15 (relative clauses — complex sentences)
  if (words <= 15) return 15;

  // 16-18 words → node 18 (passive & impersonal)
  if (words <= 18) return 18;

  // 19-22 words → node 19 (advanced connectors)
  if (words <= 22) return 19;

  // 23+ words → C1/C2
  if (words <= 25) return 22; // C1 verb phrases
  return 24; // C2 register & style
}

// ─── Run ───────────────────────────────────────────────────────────────

console.log('Classifying', deck.length, 'cards...\n');

const nodeCounts = new Array(26).fill(0);

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
// Goal: no single node dominates — keep largest nodes under ~500
const NODE_CAPS = [
  /* 01 */ 470, /* 02 */ 470, /* 03 */ 470, /* 04 */ 470, /* 05 */ 300,
  /* 06 */ 500, /* 07 */ 500, /* 08 */ 300, /* 09 */ 250, /* 10 */ 500,
  /* 11 */ 430, /* 12 */ 300, /* 13 */ 300, /* 14 */ 500, /* 15 */ 400,
  /* 16 */ 300, /* 17 */ 250, /* 18 */ 250, /* 19 */ 250, /* 20 */ 200,
  /* 21 */ 100, /* 22 */ 150, /* 23 */ 100, /* 24 */ 100, /* 25 */ 100, /* 26 */ 100,
];

// Neighbours: same tier first, then adjacent tiers (broader redistribution)
// For oversized A2 nodes, allow overflow into B1 to avoid bottleneck
const NODE_NEIGHBOURS = [
  /* 01 */ [1,2,3,4],            /* 02 */ [0,2,3,4],            /* 03 */ [0,1,3,4],            /* 04 */ [0,2,3,4],   /* 05 */ [0,3,7,8],
  /* 06 */ [6,7,8,9,10,11,12],   /* 07 */ [5,8,9,6,10,11],      /* 08 */ [5,6,7,9],            /* 09 */ [5,7,8,6],   /* 10 */ [6,7,8,9,11,12,13],
  /* 11 */ [12,13,14,10,15],     /* 12 */ [10,11,13,14],        /* 13 */ [10,11,12,14],        /* 14 */ [10,12,13,11,15], /* 15 */ [10,13,14,11],
  /* 16 */ [17,18,19,14],        /* 17 */ [15,16,18,19],        /* 18 */ [15,16,17,19],        /* 19 */ [15,17,18,16], /* 20 */ [15,17,18,19],
  /* 21 */ [22,20,19,23],        /* 22 */ [20,21,23,19],        /* 23 */ [20,21,22,19],
  /* 24 */ [25,22,23,21],        /* 25 */ [23,24,22,21],        /* 26 */ [23,24,25,22],
];

// Run multiple passes so overflow cascades through tiers
let totalRedistributed = 0;
const MAX_PASSES = 5;

for (let pass = 0; pass < MAX_PASSES; pass++) {
  let passRedistributed = 0;

  for (let nodeIdx = 0; nodeIdx < 26; nodeIdx++) {
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
  'Present tense', 'Ser vs estar', 'Common questions', 'Articles & gender',
  'Gustar & similar', 'Preterite', 'Imperfect', 'Reflexive verbs',
  'Por vs para', 'Object pronouns', 'Present subjunctive', 'Commands',
  'Conditional', 'Future & perfect', 'Relative clauses', 'Imperfect subjunctive',
  'Complex conditionals', 'Passive & impersonal', 'Advanced connectors', 'Mixed advanced',
  'Subjunctive nuances', 'Verb phrases', 'Reported speech',
  'Register & style', 'Idiomatic fluency', 'Complex syntax'
];

const tierLabels = ['A1','A1','A1','A1','A1','A2','A2','A2','A2','A2','B1','B1','B1','B1','B1','B2','B2','B2','B2','B2','C1','C1','C1','C2','C2','C2'];

console.log('Node distribution (all cards):');
for (let i = 0; i < 26; i++) {
  const pct = ((nodeCounts[i] / deck.length) * 100).toFixed(1);
  console.log(`  node-${String(i+1).padStart(2,'0')} ${tierLabels[i]} ${nodeNames[i].padEnd(24)} ${String(nodeCounts[i]).padStart(5)}  (${pct}%)`);
}
console.log(`  ${'TOTAL'.padEnd(34)} ${deck.length}`);

// Per-goal
console.log('\nPer-goal node counts:');
for (const goal of ['general', 'travel', 'work', 'family']) {
  const gc = deck.filter(c => (c.tags || []).includes(goal));
  const gn = new Array(26).fill(0);
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
