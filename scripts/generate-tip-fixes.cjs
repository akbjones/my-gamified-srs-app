/**
 * Generate replacement grammar tips for all flagged mismatched/irrelevant tips.
 * Reads the raw flagged files, analyzes each card's actual grammar,
 * and produces a contextually appropriate replacement tip.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'src', 'data');
const OUT = path.join(__dirname, 'output');

// Load decks for context
const es = JSON.parse(fs.readFileSync(path.join(BASE, 'spanish', 'deck.json'), 'utf-8'));
const it = JSON.parse(fs.readFileSync(path.join(BASE, 'italian', 'deck.json'), 'utf-8'));
const fr = JSON.parse(fs.readFileSync(path.join(BASE, 'french', 'deck.json'), 'utf-8'));

const esMap = Object.fromEntries(es.map(c => [c.id, c]));
const itMap = Object.fromEntries(it.map(c => [c.id, c]));
const frMap = Object.fromEntries(fr.map(c => [c.id, c]));

// Load flagged
const esFlagged = JSON.parse(fs.readFileSync(path.join(OUT, 'es-flagged-raw.json'), 'utf-8'));
const itFlagged = JSON.parse(fs.readFileSync(path.join(OUT, 'it-flagged-raw.json'), 'utf-8'));
const frFlagged = JSON.parse(fs.readFileSync(path.join(OUT, 'fr-flagged-raw.json'), 'utf-8'));

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ============================================================
// SPANISH TIP GENERATOR
// ============================================================

function generateSpanishTip(card) {
  const t = card.target;
  const e = card.english;
  const tN = normalize(t);

  // "Se me hace tarde" - impersonal 'hacerse'
  if (tN.includes('se me hace') || tN.includes('se te hace') || tN.includes('se le hace') || tN.includes('se nos hace')) {
    return "'Hacerse' in impersonal expressions: 'se me hace tarde' = it's getting late for me. The indirect object pronoun shows who is affected.";
  }

  // Sentences with 'tener' for age/states
  if (/\btien(e|es|en|o)\b/.test(tN) && /anos|years/.test(normalize(e))) {
    return "Spanish uses 'tener' (to have) for age: 'tiene X años' = is X years old. English uses 'to be' but Spanish literally 'has' years.";
  }
  if (/\btien(e|es|en|o)\b/.test(tN)) {
    return "'Tener' expresses possession and many states: tener hambre (hungry), tener frío (cold), tener razón (right). Here it means 'to have'.";
  }

  // Gustar-like verbs ACTUALLY in the sentence
  if (/\bduele\b|\bduelen\b/.test(tN)) return "'Doler' works like 'gustar': the body part is the subject. 'Me duele la cabeza' = the head hurts to me. Plural: 'me duelen los pies'.";
  if (/\bencant(a|o|ó)\b/.test(tN)) return "'Encantar' works like 'gustar' – the thing loved is the grammatical subject: 'me encanta' = it delights me.";
  if (/\bsobra\b|\bsobran\b/.test(tN)) return "'Sobrar' follows the gustar pattern: the leftover thing is the subject. 'Le sobra dinero' = money is left over for him.";
  if (/\bqueda\b|\bquedan\b/.test(tN)) return "'Quedar' follows the gustar pattern: the remaining thing is the subject. 'Nos queda una semana' = one week remains for us.";
  if (/\bfascina\b|\bfascinan\b/.test(tN)) return "'Fascinar' follows the gustar pattern: the fascinating thing is the subject. 'Le fascina la cocina' = cooking fascinates her.";
  if (/\bpreocupa\b|\bpreocupan\b/.test(tN)) return "'Preocupar' follows the gustar pattern: the worrying thing is the subject. 'Le preocupa el examen' = the exam worries her.";
  if (/\btoca\b/.test(tN) && /turn|our/.test(normalize(e))) return "'Tocar' in the gustar pattern means 'it's someone's turn': 'nos toca pagar' = it's our turn to pay.";
  if (/\bhacen gracia\b|\bhace gracia\b/.test(tN)) return "'Hacer gracia' follows the gustar pattern: 'me hacen gracia sus chistes' = his jokes amuse me (lit. make grace to me).";
  if (/\bda vergu\b/.test(tN)) return "'Dar vergüenza' follows the gustar pattern: the embarrassing thing is the subject. 'Le da vergüenza' = it embarrasses him/her.";
  if (/\bparece\b|\bparecen\b/.test(tN) && /\bme\b|\bte\b|\ble\b|\bnos\b/.test(tN)) return "'Parecer' follows the gustar pattern: 'me parece bien' = it seems good to me. The thing being judged is the subject.";
  if (/\bsale\b/.test(tN) && /\bme\b|\bte\b|\ble\b/.test(tN)) return "'Salir + adjective' in the gustar pattern: 'me sale más barato' = it comes out cheaper for me.";
  if (/\bsuena\b/.test(tN) && /\bme\b|\bte\b|\ble\b/.test(tN)) return "'Sonar' in the gustar pattern: 'me suena' = it sounds familiar to me / rings a bell.";

  // Stem-changing verbs actually in the sentence
  if (/\bduerme\b/.test(tN)) return "'Dormir' stem-changes o→ue in stressed syllables: duermo, duermes, duerme. The 'nosotros' form keeps the 'o': dormimos.";
  if (/\bjuega\b/.test(tN)) return "'Jugar' is the only u→ue stem-changing verb in Spanish: juego, juegas, juega. It's used with 'a' for sports: jugar al fútbol.";
  if (/\bprefiere\b|\bprefieres\b|\bprefiero\b/.test(tN)) return "'Preferir' stem-changes e→ie: prefiero, prefieres, prefiere. The 'nosotros' form keeps the 'e': preferimos.";
  if (/\bvuelve\b|\bvuelves\b|\bvuelvo\b/.test(tN)) return "'Volver' stem-changes o→ue: vuelvo, vuelves, vuelve. Past participle is irregular: 'vuelto'.";
  if (/\bcuesta\b|\bcuestan\b/.test(tN)) return "'Costar' stem-changes o→ue: cuesta/cuestan. Used for prices: '¿Cuánto cuesta?' = How much does it cost?";
  if (/\bpuede\b|\bpuedes\b|\bpuedo\b/.test(tN)) return "'Poder' stem-changes o→ue: puedo, puedes, puede. Used for ability and polite requests: '¿puede traer...?'";

  // Reflexive verbs
  if (/\bse\b/.test(tN) && /\bparecen\b/.test(tN)) return "'Parecerse' (reflexive) = to resemble each other. 'Se parecen mucho' = they look very alike. Without 'se', 'parecer' means 'to seem'.";
  if (/\bse\b.*\bdespedimos\b/.test(tN) || /\bnos despedimos\b/.test(tN)) return "'Despedirse' is reflexive: nos despedimos = we said goodbye. The reflexive marks the action affects the subject.";
  if (/\bse me\b|\bse te\b|\bse le\b|\bse nos\b/.test(tN)) return "The 'se + indirect object' pattern expresses unplanned events: 'se me olvidó' = it slipped my mind (lit. it forgot itself on me).";

  // Imperative forms
  if (/\brecoge\b/.test(tN) && /clean|tidy/.test(normalize(e))) return "Informal imperative of 'recoger': 'recoge' (tú). 'Antes de + infinitive' = before doing something.";
  if (/\bllega\b/.test(tN) && /arrive|early/.test(normalize(e))) return "Informal commands: 'llega' looks like third-person present, but here it's a tú imperative. 'Con antelación' = in advance.";

  // Subjunctive with 'que descanses'
  if (/\bque\b.*\b\w+es\b/.test(tN) && /descanses|duermas|comas|salgas/.test(tN)) {
    return "'Que + subjunctive' expresses wishes: 'que descanses' = may you rest / rest well. The subjunctive conveys hope or desire.";
  }

  // 'como' = I eat
  if (/\bcomo\b/.test(tN) && /\beat\b/.test(normalize(e))) {
    return "'Comer' (to eat) is a regular -er verb. 'Como' = I eat. 'Demasiado' (too much) can modify verbs or adjectives.";
  }

  // Escribir
  if (/\bescribo\b|\bescribes\b|\bescribe\b/.test(tN)) return "'Escribir' is a regular -ir verb in present tense: escribo, escribes, escribe. Its past participle is irregular: 'escrito'.";

  // Crear
  if (/\bcreo\b/.test(tN) && /creat|make/.test(normalize(e))) return "'Crear' (to create) is a regular -ar verb. Don't confuse with 'creer' (to believe): creo una lista vs. creo que sí.";

  // Conocer
  if (/\bconozco\b|\bconoces\b|\bconoce\b/.test(tN)) return "'Conocer' has an irregular yo form: conozco (c→zc). 'Conocer' = to know a person or place; 'saber' = to know facts.";
  if (/\bconocemos\b/.test(tN)) return "'Conocer' = to know people/places personally. 'Nos conocemos desde...' = We've known each other since... The 'c→zc' change only appears in 'yo': conozco.";

  // Question words
  if (/\bdonde\b/.test(tN) && t.includes('¿')) return "Question words carry accents: '¿dónde?' (where?). Without accent, 'donde' is a relative pronoun: 'el lugar donde vivo'.";
  if (/\bcuanto\b|\bcuantos\b/.test(tN) && t.includes('¿')) return "'¿Cuánto/a?' (how much) and '¿cuántos/as?' (how many) carry accents in questions and agree in gender/number.";
  if (/\bque\b/.test(tN) && t.includes('¿')) return "'¿Qué?' with accent = what?/which? Without accent, 'que' = that/which (relative pronoun or conjunction).";

  // Ordinals
  if (/\bprimero\b|\bsegundo\b|\btercero\b|\bprimera\b/.test(tN)) return "Ordinal numbers agree in gender: primero/primera. 'Primero' shortens to 'primer' before masculine singular nouns.";

  // Possessives
  if (/\bnuestra\b|\bnuestro\b/.test(tN)) return "'Nuestro/nuestra' agrees with the thing possessed, not the possessor: 'nuestra oficina' (fem.) vs. 'nuestro equipo' (masc.).";

  // Trabajar / Vivir
  if (/\btrabaja\b|\btrabajo\b|\btrabajan\b/.test(tN)) {
    if (/\bpara\b/.test(tN)) return "'Trabajar para' = to work for (employer). 'Trabajar en' = to work at/in (location). The preposition changes the meaning.";
    if (/\ben\b/.test(tN)) return "'Trabajar en' = to work at/in a place. 'En' before an indefinite article: 'en un hospital' = at a hospital.";
    return "'Trabajar' conjugates like all -ar verbs. Spanish often drops the subject pronoun when the verb ending makes it clear who's acting.";
  }
  if (/\bvive\b|\bviven\b|\bvivo\b|\bvives\b/.test(tN)) {
    if (/\bcerca\b/.test(tN)) return "'Cerca de' = near/close to. 'Lejos de' = far from. These are adverbs of place followed by the preposition 'de'.";
    if (/\ben\b/.test(tN)) return "'Vivir en' = to live in. Use 'en' for cities, countries, floors: 'vivo en Madrid', 'vivo en el segundo piso'.";
    return "'Vivir' is a regular -ir verb. In present tense: vivo, vives, vive, vivimos, vivís, viven.";
  }

  // Necesitar
  if (/\bnecesito\b|\bnecesita\b|\bnecesitas\b/.test(tN)) {
    if (/\bcomprar\b|\bpedir\b/.test(tN)) return "'Necesitar + infinitive' chains two verbs: the first conjugates, the second stays in infinitive. Very common pattern in Spanish.";
    return "'Necesitar' (to need) is a regular -ar verb. It works with nouns: 'necesito agua' or verbs: 'necesito comprar'.";
  }

  // Relative clauses with 'que'
  if (/\ben quien\b/.test(tN)) return "'En quien' = in whom. After prepositions, use 'quien' for people: 'el compañero en quien confío' = the colleague I trust in.";
  if (/\bque\b/.test(tN) && !t.includes('¿') && /el\s+\w+\s+que|la\s+\w+\s+que/.test(tN)) {
    return "'Que' as a relative pronoun connects clauses: 'el hombre que trabaja aquí' = the man who works here. It works for both people and things.";
  }

  // Buenos/Buenas greetings
  if (/\bbuenas noches\b|\bbuenas tardes\b|\bbuenos dias\b/.test(tN)) return "Spanish greetings match gender: 'buenos días' (masc.), 'buenas tardes/noches' (fem.). The adjective agrees with the noun.";

  // Por/Para
  if (/\bpor\b/.test(tN) && /\btrabajo\b/.test(tN)) return "'Por' here means 'because of' or 'for the sake of' (reason): 'viajan por trabajo' = they travel for work (because of work).";
  if (/\bpor\b/.test(tN)) return "'Por' has many uses: cause/reason (por trabajo), through/along (por la calle), exchange (gracias por), duration (por dos horas).";
  if (/\bpara\b/.test(tN)) return "'Para' expresses purpose, destination, or recipient: 'para descansar' (in order to rest), 'para ti' (for you).";

  // Adjective agreement visible
  if (/\bprecioso\b|\bnueva\b|\bnuevo\b|\bpequeña\b|\bprecioso\b/.test(tN)) return "Spanish adjectives agree in gender and number. Most follow the noun: 'terminal nueva', 'jardín precioso'. Some like 'buen/gran' precede it.";

  // Estar + emotion/state
  if (/\bestoy\b|\bestas\b/.test(tN)) {
    if (/\bharto\b/.test(tN)) return "'Estar harto de' = to be fed up with. 'Estar' is used for emotional/temporary states, not 'ser'.";
    return "'Estar' for temporary states and conditions: feelings, locations, situations. Here it describes a current state.";
  }

  // Ser for identity/events
  if (/\bes\b/.test(tN) && /\bmes\b|\bagosto\b|\bviernes\b/.test(tN)) return "'Ser' for dates and events: 'agosto es el mes de...' Dates and scheduled events always use 'ser', not 'estar'.";
  if (/\bes\b/.test(tN) && /\bamable\b|\beficiente\b/.test(tN)) return "'Ser' + adjective describes inherent qualities: 'es amable' (is kind), 'es eficiente' (is efficient). 'Estar' would imply a temporary state.";
  if (/\bes\b/.test(tN) && /\bmorena\b/.test(tN)) return "'Ser' for inherent physical traits: 'es morena' = has dark hair (permanent feature). Use 'llevar' for things worn: 'lleva gafas' (wears glasses).";

  // Hablar con
  if (/\bhablo\b|\bhablas\b|\bhabla\b/.test(tN) && /\bcon\b/.test(tN)) return "'Hablar con' = to talk to/with. 'Hablar de' = to talk about. The preposition changes the meaning completely.";

  // Study
  if (/\bestudio\b/.test(tN)) return "'Estudiar' is regular -ar. 'En' before institutions means 'at': 'estudio en la universidad' = I study at the university.";

  // Perder
  if (/\bperdi\b/.test(tN)) return "Preterite of 'perder': perdí, perdiste, perdió. The preterite describes completed past actions: 'perdí mi cartera' = I lost my wallet.";

  // Construir
  if (/\bconstruyeron\b/.test(tN)) return "'Construir' changes i→y in third person preterite: construyó, construyeron. This affects all -uir verbs: destruir, contribuir.";

  // Cortar
  if (/\bcorto\b/.test(tN) && /\bcut\b/.test(normalize(e))) return "'Cortar' (to cut) is regular -ar. 'Con este cuchillo' = with this knife. 'Este/esta' are demonstratives meaning 'this'.";

  // Contractions del/al
  if (/\bdel\b/.test(tN)) return "'Del' is the mandatory contraction of 'de + el': never write 'de el'. 'De la' stays separate (no contraction for feminine).";
  if (/\bal\b/.test(tN) && !/\bal\w/.test(tN)) return "'Al' is the mandatory contraction of 'a + el': 'al parque', 'al cine'. It only happens with masculine singular 'el'.";

  // Claro que sí
  if (/\bclaro que si\b/.test(tN)) return "'Claro que sí' = of course / absolutely. 'Con mucho gusto' = with great pleasure. Both are common polite expressions.";

  // Avisar
  if (/\bavisame\b/.test(tN)) return "'Avísame' = let me know / notify me. Imperative of 'avisar' + pronoun 'me' attached. 'Cuando + subjunctive' for future events.";

  // Time
  if (/\bson las\b/.test(tN)) return "Telling time uses 'ser': 'Son las dos' (plural for 2+). 'Y media' = half past. 'Es la una' uses singular for 1:00.";

  // Hay
  if (/\bhay\b/.test(tN)) return "'Hay' = there is / there are. Unlike 'ser/estar', 'hay' is the same for singular and plural. Comes from 'haber'.";

  // Se impersonal
  if (/\bse\b.*\b(habla|vive|dice|come|puede|necesita|vende)\b/.test(tN)) return "'Se' + third person verb for impersonal statements: 'se habla español' = Spanish is spoken (here). No specific subject needed.";

  // Dar + emotion expressions
  if (/\bda pena\b/.test(tN)) return "'Dar pena' follows the gustar pattern: the sad thing is the subject. 'Me da pena que se vaya' = it saddens me that he/she is leaving.";
  if (/\bda miedo\b/.test(tN)) return "'Dar miedo' follows the gustar pattern: the scary thing is the subject. 'Me da miedo' = it scares me.";
  if (/\benoja\b/.test(tN)) return "'Enojar' follows the gustar pattern: the annoying thing is the subject. 'Me enoja que...' = it angers me that...";
  if (/\bentristece\b/.test(tN)) return "'Entristecer' follows the gustar pattern: the sad thing is the subject. 'Me entristece ver...' = it saddens me to see...";

  // Gustaría
  if (/\bgustaria\b/.test(tN)) return "'Me gustaría' = I would like. Conditional of 'gustar'. More polite than 'quiero'. Used for wishes and polite requests.";

  // Preterite forms
  if (/\bexplico\b/.test(tN) && /\bprofesora\b/.test(tN)) return "Preterite for completed past actions: 'explicó' (she explained). Regular -ar preterite: -é, -aste, -ó, -amos, -asteis, -aron.";
  if (/\bencendi\b/.test(tN)) return "Preterite of 'encender': 'encendí' (I turned on). 'Porque' + imperfect (estaba) explains the reason in the background.";
  if (/\bsali\b.*\bcorriendo\b/.test(tN)) return "Gerund after motion verbs describes manner: 'salí corriendo' = I left running (I ran out). Very common pattern.";
  if (/\baviso\b/.test(tN)) return "'Avisar de que' = to warn/notify that. Formal: 'nos avisó de que habría retrasos' = he warned us there would be delays.";

  // Conditional
  if (/\bvisitaremos\b/.test(tN)) return "Future tense: infinitive + endings (-é, -ás, -á, -emos, -éis, -án). 'Visitaremos' = we will visit.";

  // Subjunctive
  if (/\bsea cual sea\b/.test(tN)) return "'Sea cual sea' = whatever/whichever. Reduplicative subjunctive for emphasis: 'sea cual sea tu decisión' = whatever your decision.";
  if (/\bhasta que no\b/.test(tN)) return "'Hasta que + subjunctive' for future events: 'hasta que no encuentre' = until I find. The 'no' is expletive (doesn't negate).";

  // General fallback based on sentence features
  if (t.includes('¿')) return "Spanish questions can use inversion or just intonation. Written questions always need both ¿ and ? marks.";
  if (/\bmucho\b|\bmucha\b|\bmuchos\b|\bmuchas\b/.test(tN)) return "'Mucho' agrees when adjective (muchos amigos) but is invariable as adverb (trabaja mucho). Gender/number match only with nouns.";
  if (/\btodo\b|\btoda\b|\btodos\b|\btodas\b/.test(tN)) return "'Todo/toda/todos/todas' agrees in gender and number: 'todo el día' (all day), 'todas las mañanas' (every morning).";
  if (/\bcada\b/.test(tN)) return "'Cada' (each/every) is invariable – it never changes form: 'cada día', 'cada semana', 'cada persona'.";
  if (/\buna\b|\bun\b/.test(tN)) return "Indefinite articles match gender: 'un' (masc.), 'una' (fem.). 'Un sitio' but 'una botella'. Plural 'unos/unas' means 'some'.";

  // Broader fallbacks based on grammar node and sentence features
  if (/\b\w+aba\b|\b\w+ía\b/.test(card.target)) return "The imperfect tense describes ongoing or habitual past actions, settings, and background descriptions. It contrasts with the preterite (completed actions).";
  if (/\b\w+(ó|aron|ieron)\b/.test(card.target) && !/\b(él|ella|usted)\b/.test(tN)) return "The preterite describes completed past actions with a clear beginning or end. It contrasts with the imperfect (ongoing/habitual).";
  if (/\bhabría\b|\bhabríamos\b|\bhabrían\b/.test(tN)) return "The conditional perfect (habría + participle) expresses what would have happened. Used for hypothetical past situations.";
  if (/\b\w+ría\b|\b\w+rían\b|\b\w+ríamos\b/.test(card.target)) return "The conditional tense (-ría endings) expresses would/could. Used for polite requests, hypotheticals, and reported future.";
  if (/\b\w+rá\b|\b\w+rán\b|\b\w+remos\b/.test(card.target)) return "The future tense (infinitive + endings) expresses will. Can also express probability: '¿Dónde estará?' = Where could he be?";
  if (/\bque\b.*\b\w+(e|es|en|a|as|an)\b/.test(tN) && /subjunctive|subjuntivo/.test((card.grammarNode || '').toLowerCase())) return "The subjunctive expresses doubt, wishes, emotions, or hypothetical situations. It appears after 'que' with verbs of emotion, desire, or doubt.";
  if (/\bse\b/.test(tN)) return "'Se' has multiple uses in Spanish: reflexive (se lava), reciprocal (se quieren), impersonal (se habla), and passive (se venden).";
  if (/\bdel\b/.test(tN)) return "'Del' = de + el (mandatory contraction). 'De la/de los/de las' stay separate. Never write 'de el'.";
  if (/\bal\b/.test(tN)) return "'Al' = a + el (mandatory contraction). 'A la/a los/a las' stay separate. Never write 'a el'.";

  return null;
}

// ============================================================
// ITALIAN TIP GENERATOR
// ============================================================

function generateItalianTip(card) {
  const t = card.target;
  const e = card.english;
  const tN = normalize(t);

  // Present progressive (stare + gerund) actually in sentence
  if (/\bsta\b.*\b\w+ando\b|\bsta\b.*\b\w+endo\b|\bstai\b.*\b\w+ando\b|\bstai\b.*\b\w+endo\b/.test(tN)) {
    return "'Stare + gerundio' for actions in progress right now. Gerund: -are→-ando, -ere→-endo, -ire→-endo.";
  }

  // Anche actually in sentence
  if (/\banche\b|\banch\b/.test(tN)) return "'Anche' (also/too) goes before the word it modifies. Contracts before vowels: 'anch'io' (me too).";

  // Molto actually in sentence
  if (/\bmolto\b|\bmolta\b|\bmolti\b|\bmolte\b/.test(tN)) return "'Molto' as adverb is invariable: 'lavoro molto' (I work a lot). As adjective it agrees: 'molte persone' (many people).";

  // Di + article contractions actually present
  if (/\bdel\b|\bdella\b|\bdello\b|\bdegli\b|\bdelle\b|\bdei\b/.test(tN)) return "'Di' contracts with articles: di+il=del, di+la=della, di+i=dei, di+le=delle. These 'preposizioni articolate' are mandatory.";

  // In + article contractions
  if (/\bnel\b|\bnella\b|\bnello\b|\bnegli\b|\bnelle\b/.test(tN)) return "'In' contracts with articles: in+il=nel, in+la=nella. 'Nel giardino' = in the garden. Mandatory with definite articles.";

  // Essere for origin/state
  if (/\bsono\b.*\bdi\b/.test(tN) && /from/.test(normalize(e))) return "'Essere di' expresses origin: 'Sono di Roma' = I'm from Rome. Use 'essere' for permanent identity traits.";
  if (/\bsiamo\b/.test(tN) && /\bin ritardo\b/.test(tN)) return "'Essere in ritardo' = to be late. Opposite: 'in anticipo' (early) or 'in orario' (on time).";

  // Ogni in sentence
  if (/\bogni\b/.test(tN)) return "'Ogni' (every/each) is always singular: 'ogni cinque minuti' = every five minutes. Never changes form.";

  // Prepositions with places
  if (/\ba roma\b|\ba milano\b/.test(tN)) return "'A' before cities: 'abitano a Roma'. Use 'in' before countries: 'in Italia'. The preposition depends on city vs. country.";
  if (/\bin italia\b/.test(tN)) return "'In' before countries: 'vive in Italia'. Use 'a' before cities. No article needed with 'in' + country name.";
  if (/\ba casa\b/.test(tN)) return "'A casa' = at home / homeward. 'Tornare a casa' = to go back home. No article needed with 'casa' in this set phrase.";

  // Verso
  if (/\bverso\b/.test(tN)) return "'Verso' means 'toward': 'cammina verso la piazza' = walks toward the square. Indicates direction.";

  // Lungo
  if (/\blungo\b/.test(tN)) return "'Lungo' as preposition means 'along': 'cammino lungo il fiume' = I walk along the river.";

  // Vicino a
  if (/\bvicino\b/.test(tN)) return "'Vicino a' = near/close to: 'abitiamo vicino al parco'. Note 'a+il' contracts to 'al'. Opposite: 'lontano da'.";

  // In + un/una
  if (/\bin un\b|\bin una\b/.test(tN)) return "'In' + indefinite article for workplaces: 'lavoro in un ristorante'. 'In' doesn't contract with indefinite articles.";

  // Articles
  if (/\blo\b/.test(tN) && /\bstudente\b|\bzaino\b|\bspecchio\b|\bsport\b/.test(tN)) return "'Lo' replaces 'il' before s+consonant, z, gn, ps: 'lo studente', 'lo zaino'. Plural: 'gli'.";
  if (/\bgli\b/.test(tN)) return "'Gli' is the masculine plural article before vowels and s+consonant/z: 'gli amici', 'gli studenti'. Otherwise use 'i'.";

  // Con attenzione
  if (/\bcon attenzione\b/.test(tN)) return "'Con + noun' forms adverbial phrases: 'con attenzione' (carefully), 'con calma' (calmly). Alternative to -mente adverbs.";

  // Subject pronouns
  if (/^io\b/.test(tN)) {
    if (/\bmangio\b/.test(tN)) return "Italian usually drops subject pronouns: 'mangio la pasta' is more natural than 'io mangio'. Use 'io' only for emphasis or contrast.";
    if (/\bamo\b/.test(tN)) return "'Amare' = to love (stronger than 'piacere'). 'La musica' uses the article – Italian uses definite articles with abstract nouns.";
    if (/\bgioco\b/.test(tN)) return "'Giocare a' + sport: 'gioco a tennis'. Use 'a' before sports. 'Giocare' has a soft g before -o: 'gioco'.";
    if (/\bascolto\b/.test(tN)) return "'Ascoltare' = to listen to. The 'to' is built in: 'ascolto la musica'. No preposition needed.";
    if (/\babito\b/.test(tN)) return "'Abitare' = to live (somewhere). 'In centro' = downtown/in the center. 'In' without article before general areas.";
    if (/\bcammino\b/.test(tN)) return "'Camminare' = to walk. Regular -are verb. 'Lungo il fiume' = along the river.";
    if (/\blavoro\b/.test(tN)) return "'Lavorare' = to work. Regular -are verb. 'In un ristorante' = in a restaurant.";
    if (/\bbevo\b/.test(tN)) return "'Bere' (to drink) is irregular: bevo, bevi, beve, beviamo, bevete, bevono. One of the most common irregular verbs.";
    return "Italian often drops subject pronouns since verb endings indicate the person. 'Io' is used mainly for emphasis.";
  }
  if (/^lui\b/.test(tN)) {
    if (/\bguarda\b/.test(tN)) return "'Guardare' = to watch/look at. No preposition needed: 'guarda la televisione'. Regular -are verb.";
    if (/\bmangia\b/.test(tN)) return "'Mangiare' keeps the -i- before -a: 'mangia' (he eats). But drops it before -i: 'mangi' (you eat).";
    if (/\bvive\b/.test(tN)) return "'Vivere' = to live. Regular -ere verb: vivo, vivi, vive. 'In Italia' – use 'in' before countries.";
    if (/\bsta\b/.test(tN) && /\bcucinando\b/.test(tN)) return "'Stare + gerundio' for actions happening now: 'sta cucinando' = he's cooking right now. Gerund of -are: -ando.";
    return "'Lui' = he (subject). The verb ending (-a for third person -are, -e for -ere/-ire) already shows the person.";
  }
  if (/^lei\b/.test(tN)) {
    if (/\bascolta\b/.test(tN)) return "'Ascoltare' = to listen to. The 'to' is built in: 'ascolta la musica'. No preposition needed.";
    if (/\briceve\b/.test(tN)) return "'Ricevere' is a regular -ere verb: ricevo, ricevi, riceve. The -ere conjugation: -o, -i, -e, -iamo, -ete, -ono.";
    if (/\bsi prepara\b/.test(tN)) return "Reflexive verbs use 'si' for third person: 'si prepara' = she gets (herself) ready. Full pattern: mi, ti, si, ci, vi, si.";
    if (/\bcammina\b/.test(tN)) return "'Camminare' = to walk. Regular -are verb. 'Verso la piazza' = toward the square.";
    if (/\bpuo\b/.test(tN)) return "'Potere' + infinitive = can/to be able to: 'può venire' = she can come. Irregular: posso, puoi, può.";
    if (/\bsta\b.*\blavorando\b/.test(tN)) return "'Stare + gerundio' for ongoing actions: 'sta lavorando' = she is working right now.";
    return "'Lei' = she (or formal 'you'). Context determines which meaning. The verb form is the same for both.";
  }
  if (/^noi\b/.test(tN)) {
    if (/\bprepariamo\b/.test(tN)) return "The 'noi' form always ends in -iamo: prepariamo, corriamo, partiamo. This is consistent across all verb types.";
    if (/\bcamminiamo\b/.test(tN)) return "'Camminare al parco' = to walk to the park. 'Al' = a+il (contraction). All -are 'noi' forms: -iamo.";
    if (/\babitiamo\b/.test(tN)) return "'Abitare' = to live. 'Vicino al parco' = near the park. 'Al' = a+il (mandatory contraction).";
    if (/\bpassiamo\b/.test(tN)) return "'Passare le vacanze' = to spend holidays. 'Al mare' = at the seaside. 'Al' = a+il (contraction).";
    if (/\bcorriamo\b/.test(tN)) return "'Correre' = to run. Irregular past participle: 'corso'. 'Al parco' = to/at the park.";
    if (/\bsiamo\b/.test(tN)) return "'Essere' noi form: 'siamo'. 'In ritardo' = late. Opposite: 'in anticipo' (early).";
    return "'Noi' form always ends in -iamo across all verb groups. Very regular and easy to remember.";
  }
  if (/^voi\b/.test(tN)) {
    if (/\bleggete\b/.test(tN)) return "'Leggere' = to read. Irregular -ere verb: leggo, leggi, legge, leggiamo, leggete, leggono. Double 'g' throughout.";
    return "'Voi' form: -ate (-are), -ete (-ere), -ite (-ire). It's both informal and formal plural 'you'.";
  }
  if (/^loro\b/.test(tN)) {
    if (/\babitano\b/.test(tN)) return "'Abitare' third person plural: 'abitano'. 'A Roma' – use 'a' before cities. Subject 'loro' is often dropped.";
    return "'Loro' (they) is often dropped since the verb ending (-ano/-ono) already indicates third person plural.";
  }
  if (/^tu\b/.test(tN)) {
    if (/\bcucini\b/.test(tN)) return "'-Are' verbs with 'tu': cucinare → cucini. The -i ending is the same for all three verb types with 'tu'.";
    if (/\bcredi\b/.test(tN)) return "'Credere in' = to believe in. 'Credere a' = to believe someone. The preposition changes the meaning.";
    if (/\btorni\b/.test(tN)) return "'Tornare a casa' = to go back home. 'Tornare' uses 'essere' in passato prossimo: 'sono tornato/a'.";
    if (/\bvivi\b/.test(tN)) return "'Vivere' = to live. Regular -ere: vivo, vivi, vive. 'In periferia' = in the suburbs.";
    if (/\bstai\b/.test(tN)) return "'Stare' with 'tu': 'stai'. Used in progressive: 'stai mangiando' = you're eating. Also for health: 'come stai?'";
    return "'Tu' form: informal singular 'you'. Verb ending (-i for all groups) makes it clear, so 'tu' is often dropped.";
  }

  // La sera / Il lunedì (time expressions)
  if (/\bil lunedi\b|\bla sera\b|\bil martedi\b|\bla mattina\b/.test(tN)) return "Definite article with days/times for habits: 'il lunedì lavoro' = on Mondays I work. No article = one specific day.";

  // Passato prossimo
  if (/\bha\b.*\b\w+ato\b|\bha\b.*\b\w+uto\b|\bha\b.*\b\w+ito\b/.test(tN)) return "Passato prossimo: avere/essere + past participle. -are→-ato, -ere→-uto, -ire→-ito.";

  // Può + infinitive
  if (/\bpuo\b/.test(tN)) return "'Potere' + infinitive = can: 'può venire' = she can come. Irregular: posso, puoi, può, possiamo, potete, possono.";

  // In fretta
  if (/\bin fretta\b/.test(tN)) return "'In fretta' = in a hurry / quickly. Common set phrase with 'in'.";

  // Il tempo passa
  if (/\btempo\b.*\bpassa\b/.test(tN)) return "'Il tempo passa in fretta' = time flies (lit. time passes in haste). 'Passare' = to pass/go by.";

  // Stare per
  if (/\bsta per\b|\bsto per\b/.test(tN)) return "'Stare per + infinitive' = about to: 'sto per uscire' = I'm about to leave.";

  // C'è / ci sono
  if (/\bc e\b|\bci sono\b/.test(tN)) return "'C'è' (there is) and 'ci sono' (there are). 'Ci' = there. Essential existential construction.";

  // Essere for capital/facts
  if (/\bcapitale\b/.test(tN)) return "'Essere' for permanent facts: 'Roma è la capitale d'Italia'. 'D'Italia' = di + Italia (elision before vowel).";

  // Words ending in -zione
  if (/\b\w+zione\b/.test(tN)) return "Nouns ending in '-zione' are always feminine: 'la stazione', 'la situazione'. Correspond to English '-tion'.";

  // Per favore
  if (/\bper favore\b/.test(tN)) return "'Per favore' (please) and 'per piacere' are interchangeable. 'Per favore' is slightly more common.";

  // Possessives with articles
  if (/\bmio\b|\bmia\b|\btuo\b|\btua\b|\bsuo\b|\bsua\b|\bnostro\b|\bnostra\b/.test(tN)) {
    if (/\bmadre\b|\bpadre\b|\bfratello\b|\bsorella\b|\bfiglio\b|\bfiglia\b/.test(tN)) {
      return "Singular family members drop the article with possessives: 'mia madre' (not 'la mia madre'). Plural keeps it: 'i miei fratelli'.";
    }
    return "Italian uses articles with possessives: 'il mio libro', 'la mia casa'. Only singular family members are exceptions.";
  }

  // Arrivare
  if (/\barriva\b|\barrivano\b/.test(tN)) return "'Arrivare' is regular -are but uses 'essere' in passato prossimo: 'è arrivato/a'. Here in present tense.";

  // General Italian present tense note
  if (/\babita\b|\bmangia\b|\bascolta\b|\bcammina\b|\bguarda\b/.test(tN)) return "Italian present tense covers both 'he speaks' and 'he is speaking'. Context determines the ongoing vs. habitual meaning.";

  // Sapere/Conoscere
  if (/\bsapere\b|\bso\b|\bsai\b|\bsa\b|\bsappiamo\b/.test(tN)) return "'Sapere' = to know facts/how to. 'Conoscere' = to know people/places. 'So' = I know (a fact).";
  if (/\bconosc/.test(tN)) return "'Conoscere' = to know/be familiar with people and places. Different from 'sapere' (knowing facts/how to).";

  // Fare
  if (/\bfaccio\b|\bfai\b|\bfa\b|\bfacciamo\b|\bfate\b|\bfanno\b/.test(tN)) return "'Fare' (to do/make) is highly irregular: faccio, fai, fa, facciamo, fate, fanno. Used in many expressions.";

  // Ci pronoun
  if (/\bci\b/.test(tN) && !/\bci sono\b/.test(tN)) return "'Ci' can mean 'there', 'us', 'each other', or 'about it': 'ci penso' = I think about it. Context determines meaning.";

  // Broader Italian fallbacks
  if (/\b(ho|hai|ha|abbiamo|avete|hanno)\b/.test(tN) && /\b\w+(ato|uto|ito)\b/.test(tN)) return "Passato prossimo: auxiliary 'avere' + past participle (-ato, -uto, -ito). Most transitive verbs use 'avere'.";
  if (/\b(sono|sei|è|siamo|siete)\b/.test(tN) && /\b\w+(ato|uto|ito)\b/.test(tN)) return "Passato prossimo with 'essere': the past participle agrees in gender/number with the subject: 'è arrivata' (she arrived).";
  if (/\b\w+(avo|ava|avano|evo|eva|evano|ivo|iva|ivano)\b/.test(tN)) return "The imperfetto describes ongoing, habitual, or background past actions. It sets the scene: 'il ristorante era sempre pieno'.";
  if (/\b(mi|ti|si|ci|vi)\b/.test(tN)) return "Reflexive pronouns (mi, ti, si, ci, vi) indicate the action reflects back on the subject. Many Italian verbs are reflexive that aren't in English.";
  if (/\bdel\b|\bdella\b|\bdei\b|\bdelle\b/.test(tN)) return "Preposizioni articolate: prepositions contract with articles. 'Di+il=del', 'di+la=della', 'in+il=nel', 'a+il=al'.";
  if (/\bnel\b|\bnella\b|\bnei\b|\bnelle\b/.test(tN)) return "'In' contracts with articles: nel (in+il), nella (in+la), nei (in+i), nelle (in+le). Mandatory with definite articles.";
  if (/\bal\b|\balla\b|\bai\b|\balle\b/.test(tN)) return "'A' contracts with articles: al (a+il), alla (a+la), ai (a+i), alle (a+le). Mandatory with definite articles.";
  if (/\bvorrei\b|\bpotrei\b|\bdovrei\b|\bsarebbe\b/.test(tN)) return "The conditional (condizionale) expresses wishes, polite requests, or hypotheticals. Formed from the future stem + imperfect endings.";
  if (/\bche\b/.test(tN) && card.grammarNode && parseInt(card.grammarNode.replace('node-', '')) >= 15) return "'Che' connects clauses. After verbs of emotion, opinion, or doubt, it introduces the subjunctive (congiuntivo).";
  if (/\bgli\b|\ble\b|\blo\b|\bla\b/.test(tN)) return "Italian object pronouns go before the verb: 'lo vedo' (I see him/it), 'gli parlo' (I talk to him). They attach to infinitives: 'vederlo'.";

  return null;
}

// ============================================================
// FRENCH TIP GENERATOR
// ============================================================

function generateFrenchTip(card) {
  const t = card.target;
  const e = card.english;
  const tN = normalize(t);

  // Specific verbs actually in the sentence
  if (/\badorent\b|\badore\b/.test(tN)) return "'Adorer' = to love/adore. Stronger than 'aimer'. With general nouns, use the article: 'adorent le chocolat'.";
  if (/\bdeteste\b|\bdetestent\b/.test(tN)) return "'Détester' = to hate. With abstract nouns, French requires the article: 'il déteste le bruit' (he hates noise).";
  if (/\bpreparons\b/.test(tN)) return "'Nous' form of -er verbs: drop -er, add -ons. 'Préparons le petit déjeuner' = we prepare breakfast.";
  if (/\bportent\b|\bporte\b/.test(tN) && /wear|carry/.test(normalize(e))) return "'Porter' means both 'to carry' and 'to wear': context determines. 'Portent des lunettes' = they wear glasses.";
  if (/\barrives?\b/.test(tN)) return "'Arriver' uses 'être' in passé composé: 'je suis arrivé(e)'. 'En retard' = late. Regular -er in present.";
  if (/\bobeit\b/.test(tN)) return "'Obéir à' = to obey. Regular -ir verb with -iss- in plural. Requires 'à': 'il obéit à ses parents'.";
  if (/\bentrez\b|\bentre\b/.test(tN)) return "'Entrer dans' = to enter. Requires 'dans': 'vous entrez dans le magasin'. Uses 'être' in passé composé.";
  if (/\bgare\b/.test(tN) && /park/.test(normalize(e))) return "'Garer' = to park. 'Garer la voiture' = to park the car. Reflexive 'se garer' = to park/find parking.";
  if (/\btouches?\b/.test(tN)) return "'Toucher' = to touch. Regular -er verb. 'Le mur' = the wall.";
  if (/\bpartagent\b/.test(tN)) return "'Partager' = to share/split. Keeps 'e' before -ons: 'nous partageons'. 'L'addition' = the bill.";
  if (/\bnage\b/.test(tN)) return "'Nager' = to swim. Like 'partager', keeps 'e' before -ons: 'nous nageons'. 'Dans la piscine' = in the pool.";
  if (/\breflechis\b|\breflechit\b/.test(tN)) return "'Réfléchir à' = to think about. Regular -ir with -iss-. Requires 'à': 'je réfléchis à la question'.";
  if (/\bbavardons\b/.test(tN)) return "'Bavarder' = to chat. Regular -er. 'Au café' = at the café ('au' = à+le contraction).";
  if (/\ballume\b/.test(tN)) return "'Allumer' = to turn on (light/device). Opposite: 'éteindre' (to turn off). Regular -er verb.";
  if (/\binvitez\b/.test(tN)) return "'Inviter' is regular -er. 'Des amis' uses partitive 'des' = some. French requires this where English omits 'some'.";
  if (/\bfinis\b|\bfinit\b/.test(tN)) return "'-Ir' verbs like 'finir' add '-iss-' in plural: finissons, finissez, finissent. Singular has no '-iss-'.";
  if (/\bremplissons\b/.test(tN)) return "'Remplir' = to fill out. Regular -ir with -iss-: 'nous remplissons'. Same pattern as 'finir'.";

  // Avoir in sentence
  if (/\ba\b.*\bans\b/.test(tN) && /years|old|is \d+/.test(normalize(e))) return "French uses 'avoir' for age: 'il a trente ans' = he is thirty (lit. 'he has thirty years').";
  if (/\ba\b.*\byeux\b|\ba\b.*\bcheveux\b/.test(tN)) return "Physical descriptions use 'avoir': 'elle a les yeux bleus' = she has blue eyes. Note 'les' with body parts.";
  if (/\ba tort\b/.test(tN)) return "'Avoir tort' = to be wrong (lit. 'to have wrong'). Opposite: 'avoir raison' = to be right.";
  if (/\bavez\b/.test(tN)) return "'Avoir' in inversion: 'avez-vous des enfants?' Formal question form. 'Des' = some (partitive).";

  // Aller in sentence
  if (/\bvas\b|\bvais\b|\bva\b|\ballez\b|\bvont\b|\ballons\b/.test(tN)) {
    if (/\bbien\b/.test(tN)) return "'Aller' for wellbeing: 'tu vas bien?' = are you doing well? (lit. 'you go well?'). Common greeting.";
    if (/\bau\b/.test(tN)) return "'Aller à' = to go to. 'Au' = à+le: 'vous allez au marché' = you go to the market.";
    return "'Aller' is irregular: je vais, tu vas, il va, nous allons, vous allez, ils vont.";
  }

  // Vouloir/Pouvoir
  if (/\bveulent\b|\bveut\b|\bveux\b/.test(tN)) {
    if (/\bje veux bien\b/.test(tN)) return "'Je veux bien' = yes please / I'd like that. Softer and more polite than 'oui'.";
    return "'Vouloir' + infinitive = to want to. Irregular: je veux, tu veux, il veut, nous voulons, vous voulez, ils veulent.";
  }
  if (/\bpeux\b|\bpeut\b|\bpouvez\b/.test(tN)) return "'Pouvoir' + infinitive = can/able to. 'Tu peux venir?' = Can you come? Informal question via intonation.";

  // Mettre
  if (/\bmets\b|\bmet\b/.test(tN)) return "'Mettre' = to put/set. Irregular: je mets, tu mets, il met. 'Mettre la table' = to set the table.";

  // Conduire
  if (/\bconduis\b/.test(tN)) return "'Conduire' = to drive. Irregular: je conduis, tu conduis, il conduit. 'Trop vite' = too fast.";

  // Croire
  if (/\bcroit\b|\bcrois\b/.test(tN)) return "'Croire' = to believe. Irregular: je crois, tu crois, il croit, nous croyons, ils croient.";

  // Faire
  if (/\bfont\b|\bfais\b|\bfait\b|\bfaites\b|\bfaisons\b/.test(tN)) return "'Faire' = to do/make. Irregular: je fais, il fait, nous faisons, ils font. Used in many fixed expressions.";

  // Rendre
  if (/\brends?\b|\brend\b/.test(tN)) return "'Rendre' = to return/give back. Regular -re: je rends, tu rends, il rend. 'À la bibliothèque' = to the library.";

  // Sortir
  if (/\bsort\b|\bsors\b/.test(tN)) return "'Sortir' = to go out/leave. Irregular -ir: je sors, il sort. 'Du' = de+le: 'sort du bureau' = leaves the office.";

  // Habiter
  if (/\bhabitons?\b|\bhabite\b/.test(tN)) return "'Habiter à' + city: 'habitons à Paris'. For countries: 'habiter en' (fem.) or 'habiter au' (masc.).";

  // Écouter
  if (/\becoutent\b/.test(tN)) return "'Écouter' = to listen to. 'To' is built in. 'De la musique' uses partitive 'de la' = some.";

  // L' elision
  if (/l hotel\b|\bl ecole\b|\bl aeroport\b/.test(tN.replace(/'/g, ' '))) return "'L'' replaces 'le/la' before vowels or silent 'h': 'l'hôtel', 'l'aéroport'. Mandatory elision.";

  // Contractions
  if (/\bau\b|\baux\b/.test(tN)) return "'Au' = à+le, 'aux' = à+les. Mandatory contractions. 'À la' and 'à l'' don't contract.";
  if (/\bdu\b/.test(tN)) return "'Du' = de+le (contraction). 'De la' stays separate. 'Des' = de+les. 'Du bureau' = from/of the office.";

  // Demander
  if (/\bdemandez?\b/.test(tN)) return "'Demander' = to ask for. No extra preposition: 'demandez l'addition' = you ask for the bill.";

  // Bienvenue
  if (/\bbienvenue\b/.test(tN)) return "'Bienvenue dans' = welcome to. 'Notre' = our (invariable). 'Nouveau' before masculine noun = new.";

  // D'accord
  if (/\bd accord\b/.test(tN)) return "'D'accord' = OK/agreed. Common in conversation. 'Disponible' = available.";

  // Excusez-moi
  if (/\bexcusez\b/.test(tN)) return "'Excusez-moi' (formal) / 'excuse-moi' (informal). Hyphen links verb and pronoun in imperative.";

  // Comment allez-vous
  if (/\bcomment allez\b/.test(tN)) return "'Comment allez-vous?' = How are you? (formal). Inversion 'allez-vous' marks formal register.";

  // Est-ce que
  if (/\best.ce qu\b/.test(tN)) return "'Est-ce que' turns statements into questions: add it before the statement. 'Est-ce qu'il reste...?' = Are there... left?";

  // À l'aéroport
  if (/\ba l aeroport\b/.test(tN.replace(/'/g, ' '))) return "'À l'aéroport' = at the airport. 'À' for location, 'l'' = elision of 'le' before vowel.";

  // Bonjour
  if (/\bbonjour\b/.test(tN)) return "'Bonjour à tous' = hello everyone. 'À tous' = to all. Works from morning until late afternoon.";

  // Coller
  if (/\bcollent\b/.test(tN)) return "'Coller' = to glue/stick. Regular -er. 'Dans l'album' = in the album.";

  // Être in sentence
  if (/\best\b|\bsont\b|\bsuis\b|\bsommes\b|\betes\b/.test(tN)) {
    if (/\bpres de\b/.test(tN)) return "'Près de' = near. 'L'hôtel est près de la gare' = the hotel is near the station.";
    if (/\bdisponible\b/.test(tN)) return "'Être disponible' = to be available. Adjectives follow 'être' directly in French.";
    if (/\ba l\b/.test(tN.replace(/'/g, ' '))) return "'Être à' for location: 'ils sont à l'aéroport' = they are at the airport.";
    return "'Être' (to be): je suis, tu es, il est, nous sommes, vous êtes, ils sont.";
  }

  // Questions
  if (t.includes('?')) {
    if (/\b\w+-\w+\b/.test(t)) return "Inversion questions: verb-subject with hyphen. 'Avez-vous' (have you). Formal register.";
    return "Three question forms: intonation ('Tu viens?'), 'est-ce que', or inversion ('Viens-tu?').";
  }

  // Articles with abstracts
  if (/\ble\b|\bla\b|\bles\b/.test(tN) && /\bchocolat\b|\bmusique\b|\bbruit\b/.test(tN)) return "French uses definite articles with general concepts: 'le chocolat' (chocolate in general), 'la musique' (music in general).";

  // Nouveau
  if (/\bnouveau\b|\bnouvelle\b/.test(tN)) return "'Nouveau/nouvelle' (new) precedes the noun: 'nouveau restaurant'. Masc. before vowel: 'nouvel ami'.";

  // Des (partitive)
  if (/\bdes\b/.test(tN)) return "'Des' = some (partitive plural). French requires it where English uses no article: 'des enfants' = children.";

  // Que/Qu' contractions
  if (/\bce qu on\b|\bce qu il\b/.test(tN.replace(/'/g, ' '))) return "'Que' becomes 'qu'' before vowels: 'ce qu'on' = what one. Mandatory elision.";

  // Broader French fallbacks
  if (/\b(ai|as|a|avons|avez|ont)\b/.test(tN) && /\b\w+(é|i|u|is|it|ert)\b/.test(tN)) return "Passé composé: auxiliary 'avoir' + past participle. Most verbs use 'avoir'. The participle normally doesn't agree.";
  if (/\b(suis|es|est|sommes|etes|sont)\b/.test(tN) && /\b\w+(é|ée|i|ie|u|ue)\b/.test(tN)) return "Some verbs use 'être' in passé composé (DR MRS VANDERTRAMP verbs + reflexives). The participle agrees with the subject.";
  if (/\b\w+(ais|ait|ions|iez|aient)\b/.test(tN)) return "The imparfait describes ongoing, habitual, or background past actions. Formed from the 'nous' present stem + -ais, -ais, -ait, -ions, -iez, -aient.";
  if (/\b\w+(rai|ras|ra|rons|rez|ront)\b/.test(tN)) return "The futur simple (will): infinitive + endings (-ai, -as, -a, -ons, -ez, -ont). Some verbs have irregular stems.";
  if (/\b\w+(rais|rait|rions|riez|raient)\b/.test(tN)) return "The conditionnel (would): infinitive + imparfait endings (-ais, -ais, -ait, -ions, -iez, -aient). For polite requests and hypotheticals.";
  if (/\b(me|m|te|t|se|s|nous|vous)\b/.test(tN) && /\b\w+(er|ir|re)\b/.test(tN)) return "Reflexive verbs use 'se' + verb: 'se laver' (to wash oneself). The pronoun changes: je me, tu te, il se, nous nous, vous vous.";
  if (/\bne\b.*\bpas\b|\bn /.test(tN.replace(/'/g, ' '))) return "French negation wraps the verb: 'ne...pas' (not), 'ne...plus' (no more), 'ne...jamais' (never), 'ne...rien' (nothing).";
  if (/\bdu\b|\bde la\b|\bde l /.test(tN.replace(/'/g, ' '))) return "Partitive articles (du, de la, de l', des) mean 'some'. French requires them where English uses no article.";
  if (/\bil faut\b/.test(tN)) return "'Il faut' = it is necessary / one must. Impersonal construction. Followed by infinitive or 'que' + subjunctive.";
  if (/\bque\b/.test(tN) && card.grammarNode && parseInt(card.grammarNode.replace('node-', '')) >= 15) return "'Que' after verbs of emotion/doubt/will triggers the subjonctif: 'je veux que tu viennes' (I want you to come).";

  return null;
}

// ============================================================
// FALSE POSITIVE FILTERING
// ============================================================

function isFalsePositive(card, flagged) {
  const t = card.target;
  const tN = normalize(t);
  const tip = flagged.current_tip;
  const tipLower = tip.toLowerCase();

  // Spanish false positives – tip IS relevant because conjugated form of mentioned verb is in sentence
  // tomar → tomo
  if (/\btomo\b|\btomas\b|\btoma\b|\btoman\b/.test(tN) && /tomar/i.test(tipLower)) return true;
  // querer → quiero
  if (/\bquiero\b|\bquiere\b|\bquieres\b|\bquieren\b/.test(tN) && /querer/i.test(tipLower)) return true;
  // dormir → duerme
  if (/\bduerme\b|\bduermo\b|\bduermes\b/.test(tN) && /dormir/i.test(tipLower)) return true;
  // poder → puede
  if (/\bpuede\b|\bpuedes\b|\bpuedo\b|\bpueden\b/.test(tN) && /poder/i.test(tipLower)) return true;
  // volver → vuelve
  if (/\bvuelve\b|\bvuelvo\b/.test(tN) && /volver/i.test(tipLower)) return true;
  // jugar → juega
  if (/\bjuega\b|\bjuego\b/.test(tN) && /jugar/i.test(tipLower)) return true;
  // costar → cuesta
  if (/\bcuesta\b|\bcuestan\b/.test(tN) && /costar/i.test(tipLower)) return true;
  // preferir → prefieres
  if (/\bprefiere\b|\bprefieres\b|\bprefiero\b/.test(tN) && /preferir/i.test(tipLower)) return true;
  // tener → tiene
  if (/\btiene\b|\btienes\b|\btengo\b|\btienen\b/.test(tN) && /tener/i.test(tipLower)) return true;
  // doler → duele
  if (/\bduele\b|\bduelen\b/.test(tN) && /doler/i.test(tipLower)) return true;
  // encantar → encanta/encantó
  if (/\bencant/.test(tN) && /encantar/i.test(tipLower)) return true;
  // fascinar → fascina
  if (/\bfascina\b/.test(tN) && /fascinar/i.test(tipLower)) return true;
  // sentar → sienta
  if (/\bsienta\b/.test(tN) && /sentar/i.test(tipLower)) return true;
  // quedar → queda
  if (/\bqueda\b|\bquedan\b/.test(tN) && /quedar/i.test(tipLower)) return true;
  // preocupar → preocupa
  if (/\bpreocupa\b/.test(tN) && /preocupar/i.test(tipLower)) return true;
  // tocar → toca
  if (/\btoca\b/.test(tN) && /tocar/i.test(tipLower)) return true;
  // hacer gracia → hacen gracia
  if (/\bhacen gracia\b|\bhace gracia\b/.test(tN) && /hacer gracia/i.test(tipLower)) return true;
  // parecer → parece
  if (/\bparece\b/.test(tN) && /\bme\b|\bte\b|\ble\b/.test(tN) && /parecer/i.test(tipLower)) return true;
  // dar vergüenza → da vergüenza
  if (/\bda\b/.test(tN) && /vergu/.test(tN) && /dar verg/i.test(tipLower)) return true;
  // salir → sale
  if (/\bsale\b/.test(tN) && /\bme\b|\bte\b|\ble\b/.test(tN) && /salir/i.test(tipLower)) return true;
  // sonar → suena
  if (/\bsuena\b/.test(tN) && /sonar/i.test(tipLower)) return true;
  // parecerse → parecen
  if (/\bparecen\b/.test(tN) && /\bse\b/.test(tN) && /parecer/i.test(tipLower)) return true;
  // sobrar → sobra
  if (/\bsobra\b/.test(tN) && /sobrar/i.test(tipLower)) return true;

  // es-0407: desayunáis IS in sentence
  if (/\bdesayunais\b/.test(tN) && /desayun/i.test(tipLower)) return true;
  // es-0574: cómo IS in sentence and tip is about cómo
  if (/\bcomo\b/.test(tN) && t.includes('¿') && /cómo/i.test(tipLower)) return true;
  // es-0417: time telling – son las IS in sentence
  if (/\bson las\b/.test(tN) && /telling time/i.test(tipLower)) return true;

  // More gustar-pattern verbs where conjugated form IS in sentence
  if (/\bextrañ/.test(tN) && /extrañar/i.test(tipLower)) return true;
  if (/\baburr/.test(tN) && /aburrir/i.test(tipLower)) return true;
  if (/\bllama\b/.test(tN) && /llamar la atención/i.test(tipLower)) return true;
  if (/\bhace ilusion\b|\bhace ilusión\b/.test(card.target.toLowerCase()) && /hacer ilusión/i.test(tipLower)) return true;
  if (/\bconviene\b/.test(tN) && /convenir/i.test(tipLower)) return true;
  if (/\bda miedo\b/.test(tN) && /dar miedo/i.test(tipLower)) return true;
  if (/\bresulta\b/.test(tN) && /resultar/i.test(tipLower)) return true;
  if (/\bsorprende\b/.test(tN) && /sorprender/i.test(tipLower)) return true;
  if (/\bcae\b/.test(tN) && /caer/i.test(tipLower)) return true;

  // More verb forms present in sentence
  if (/\bempieza\b/.test(tN) && /empezar/i.test(tipLower)) return true;
  if (/\bhay\b/.test(tN) && /hay/i.test(tipLower)) return true;
  if (/\bacord/.test(tN) && /acordar/i.test(tipLower)) return true;
  if (/\bse lo\b/.test(tN) && /se lo/i.test(tipLower)) return true;
  if (/\bpongo\b/.test(tN) && /ponerse/i.test(tipLower)) return true;
  if (/\bvamos\b/.test(tN) && /irse/i.test(tipLower)) return true;
  if (/\bquedo\b/.test(tN) && /quedarse/i.test(tipLower)) return true;
  if (/\bequivoc/.test(tN) && /equivocarse/i.test(tipLower)) return true;
  if (/\bbaj/.test(tN) && /bajarse/i.test(tipLower)) return true;
  if (/\bprometi/.test(tN) && /se lo|le.*lo/i.test(tipLower)) return true;
  if (/\bse\b|\bsé\b/.test(card.target) && /saber/i.test(tipLower)) return true;
  if (/\blo siento\b/.test(tN) && /siento|sentir/i.test(tipLower)) return true;

  // Imperfect/Preterite contrast actually demonstrated (broader check)
  if (/imperfect|preterit|imperfecto|pretérito|todavía/i.test(tipLower)) {
    // Check for imperfect forms (-aba, -ía endings)
    const hasImperfect = /\b\w+(aba|abas|ábamos|aban|ía|ías|íamos|ían)\b/.test(card.target);
    const hasPreterite = /\b\w+(é|aste|ó|amos|aron|ieron|iste|imos)\b/.test(card.target);
    if (hasImperfect || hasPreterite) return true;
  }

  // Spanish "se" impersonal construction
  if (/\bse\b.*\b(habla|vive|dice|come|puede|sabe|necesita)\b/.test(tN) && /se.*impersonal/i.test(tipLower)) return true;
  // Spanish gustaría
  if (/\bgustaria\b/.test(tN) && /gustar/i.test(tipLower)) return true;
  // Spanish dar + noun expressions
  if (/\bda\b.*\b(pena|miedo|igual|vergüenza|asco)\b/.test(tN) && /dar/i.test(tipLower)) return true;
  // Spanish "hay" construction
  if (/\bhay\b/.test(tN) && /hay/i.test(tipLower)) return true;
  // Spanish reported speech
  if (/\baviso\b|\bdijo\b|\bcomento\b/.test(tN) && /reported speech|indirect speech/i.test(tipLower)) return true;
  // Spanish saber
  if (/\bse\b/.test(card.target) && /saber/i.test(tipLower)) return true;
  // Caer bien/mal
  if (/\bcae\b/.test(tN) && /caer/i.test(tipLower)) return true;

  // Tip about construction that IS in the sentence (broader check)
  // If tip's main quoted term (first one) has its stem in the sentence, it's likely relevant
  const firstQuote = tipLower.match(/[""'](\w+)[""']/);
  if (firstQuote) {
    const term = firstQuote[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (term.length >= 4) {
      const stem = term.endsWith('ar') || term.endsWith('er') || term.endsWith('ir') ? term.slice(0, -2) :
                   term.endsWith('are') || term.endsWith('ere') || term.endsWith('ire') ? term.slice(0, -3) : term;
      if (stem.length >= 3 && tN.includes(stem)) return true;
    }
  }

  // Italian false positives
  // stare+gerundio – sta/stai IS in sentence
  if (/\bsta\b.*\b\w+(ando|endo)\b|\bstai\b.*\b\w+(ando|endo)\b/.test(tN) && /stare/i.test(tipLower)) return true;
  // essere – sono/siamo/sei IS in sentence
  if (/\bsiamo\b|\bsono\b|\bsei\b/.test(tN) && /essere/i.test(tipLower)) return true;
  // venire IS in sentence for it-0111
  if (/\bvenire\b/.test(tN) && /venire/i.test(tipLower)) return true;

  // Italian - passato prossimo tips for passato prossimo sentences
  if (/\b(ho|hai|ha|abbiamo|avete|hanno)\b/.test(tN) && /\b\w+(ato|uto|ito|eso|esto|etto|otto|erto|into|orso|esso|sto|tto|nto|lto|rso)\b/.test(tN) && /passato prossimo|avere.*auxiliary|essere.*auxiliary|past participle|participio/i.test(tipLower)) return true;
  // Italian - imperfetto tips for imperfetto sentences
  if (/\b\w+(avo|avi|ava|avamo|avate|avano|evo|evi|eva|evamo|evate|evano|ivo|ivi|iva|ivamo|ivate|ivano)\b/.test(tN) && /imperfett|imperfect/i.test(tipLower)) return true;
  // Italian - essere in passato prossimo (è arrivato, sono partiti, etc.)
  if (/\b(è|sono|sei|siamo|siete)\b/.test(tN) && /\b\w+(ato|uto|ito|eso|esto|etto|into|erto)\b/.test(tN) && /essere.*particip|past participle.*agrees|passato prossimo/i.test(tipLower)) return true;
  // Italian - trapassato prossimo
  if (/\b(era|ero|eri|eravamo|erano|avevo|avevi|aveva|avevamo|avevate|avevano)\b/.test(tN) && /trapassato/i.test(tipLower)) return true;
  // Italian - reflexive verbs with si/mi/ti
  if (/\b(mi|ti|si|ci|vi)\b/.test(tN) && /riflessiv|reflexive/i.test(tipLower)) return true;
  // Italian - combined pronouns (gliela, glielo, me lo, etc.)
  if (/\b(gliela|glielo|gliele|glieli|melo|telo|selo|celo|velo)\b/.test(tN) && /combined pronoun|indirect.*direct/i.test(tipLower)) return true;

  // Italian - broader stem matching for verbs
  // andare forms
  if (/\bvado\b|\bvai\b|\bvanno\b|\bandiamo\b/.test(tN) && /andare/i.test(tipLower)) return true;
  // piacere forms
  if (/\bpiace\b|\bpiacciono\b/.test(tN) && /piacere/i.test(tipLower)) return true;
  // fare forms
  if (/\bfaccio\b|\bfai\b|\bfa\b|\bfanno\b/.test(tN) && /fare/i.test(tipLower)) return true;
  // sapere forms
  if (/\bso\b|\bsai\b|\bsa\b|\bsappiamo\b/.test(tN) && /sapere/i.test(tipLower)) return true;
  // conoscere forms
  if (/\bconosc/.test(tN) && /conoscere/i.test(tipLower)) return true;

  // French false positives
  // habiter – habitons IS in sentence
  if (/\bhabitons?\b/.test(tN) && /habiter/i.test(tipLower)) return true;
  // écouter – écoutent IS in sentence
  if (/\becoutent?\b/.test(tN) && /couter/i.test(tipLower)) return true;
  // téléphoner – téléphone IS in sentence
  if (/\btelephon/.test(tN) && /téléphoner/i.test(tipLower)) return true;
  // finir – finis IS in sentence
  if (/\bfinis\b|\bfinit\b/.test(tN) && /finir/i.test(tipLower)) return true;
  // demander – demandez IS in sentence
  if (/\bdemandez?\b/.test(tN) && /demander/i.test(tipLower)) return true;
  // avoir for age – a ... ans IS in sentence
  if (/\ba\b.*\bans\b/.test(tN) && /avoir/i.test(tipLower) && /age|ans/i.test(tipLower)) return true;
  // je veux bien IS in sentence
  if (/\bje veux bien\b/.test(tN) && /je veux bien/i.test(tipLower)) return true;
  // l' elision IS demonstrated
  if (/l hotel|l aeroport|l ecole/.test(tN.replace(/'/g, ' ')) && /l'/i.test(tipLower)) return true;
  // aller for health – vas IS in sentence
  if (/\bvas\b/.test(tN) && /aller/i.test(tipLower)) return true;
  // avoir for physical features – a les yeux IS in sentence
  if (/\ba\b.*\byeux\b/.test(tN) && /avoir/i.test(tipLower)) return true;
  // à l'aéroport IS in sentence
  if (/\ba l/.test(tN.replace(/'/g, ' ')) && /à l/i.test(tipLower)) return true;
  // que→qu' IS demonstrated
  if (/qu /.test(tN.replace(/'/g, ' ')) && /qu'/i.test(tipLower)) return true;
  // arriver IS in sentence (arrives)
  if (/\barriv/.test(tN) && /arriver/i.test(tipLower)) return true;
  // avoir expressions with forms present
  if (/\bai\b|\ba\b|\bavons\b|\bavez\b|\bont\b/.test(tN) && /avoir/i.test(tipLower)) return true;
  // faire forms
  if (/\bfais\b|\bfait\b|\bfont\b|\bfaisons\b|\bfaites\b/.test(tN) && /faire/i.test(tipLower)) return true;
  // devoir forms
  if (/\bdois\b|\bdoit\b|\bdevons\b|\bdevez\b|\bdoivent\b/.test(tN) && /devoir/i.test(tipLower)) return true;
  // savoir forms
  if (/\bsais\b|\bsait\b|\bsavons\b|\bsavez\b|\bsavent\b/.test(tN) && /savoir/i.test(tipLower)) return true;
  // connaître forms
  if (/\bconnais\b|\bconnait\b|\bconnaissons\b/.test(tN) && /connaître/i.test(tipLower)) return true;
  // être forms
  if (/\bsuis\b|\bes\b|\best\b|\bsommes\b|\betes\b|\bsont\b/.test(tN) && /être/i.test(tipLower)) return true;
  // prendre forms
  if (/\bprends\b|\bprend\b|\bprenons\b|\bprenez\b|\bprennent\b/.test(tN) && /prendre/i.test(tipLower)) return true;
  // mettre forms
  if (/\bmets\b|\bmet\b|\bmettons\b/.test(tN) && /mettre/i.test(tipLower)) return true;
  // sortir forms
  if (/\bsors\b|\bsort\b|\bsortent\b/.test(tN) && /sortir/i.test(tipLower)) return true;

  // French - partitive articles present
  if (/\bde l |\bde la |\bdu |\bdes /.test(tN.replace(/'/g, ' ')) && /partitiv/i.test(tipLower)) return true;
  if (/\bd /.test(tN.replace(/'/g, ' ')) && /negat.*d'|d'.*negat/i.test(tipLower)) return true;
  if (/\bles\b/.test(tN) && /les.*general|les.*plural/i.test(tipLower)) return true;
  // French - il faut / falloir
  if (/\bil faut\b|\bil lui faut\b|\bil vous faut\b/.test(tN) && /falloir|il faut/i.test(tipLower)) return true;
  // French - manquer
  if (/\bmanque\b/.test(tN) && /manquer/i.test(tipLower)) return true;
  // French - plaire/déplaire
  if (/\bplai|\bdeplai/.test(tN) && /plaire|déplaire/i.test(tipLower)) return true;
  // French - reste
  if (/\breste\b/.test(tN) && /rest/i.test(tipLower)) return true;
  // French - je vous en prie
  if (/\bje vous en prie\b/.test(tN) && /je vous en prie/i.test(tipLower)) return true;
  // French - répondre
  if (/\brepond/.test(tN) && /répondre/i.test(tipLower)) return true;
  // French - past participles in tips that match sentence
  if (/\bmis\b/.test(tN) && /mettre.*mis/i.test(tipLower)) return true;
  if (/\bouvert/.test(tN) && /ouvrir.*ouvert/i.test(tipLower)) return true;

  // French - passé composé tips for passé composé sentences
  if (/\b(ai|as|a|avons|avez|ont|suis|es|est|sommes|etes|sont)\b/.test(tN) && /\b\w+(é|ée|és|ées|i|ie|is|ies|u|ue|us|ues|it|ite|its|ites|ert|erte|erts|ertes)\b/.test(tN) && /passé composé|past participle|participe passé|auxiliary|auxiliaire/i.test(tipLower)) return true;
  // French - imparfait tips for imparfait sentences
  if (/\b\w+(ais|ait|ions|iez|aient)\b/.test(tN) && /imparfait/i.test(tipLower)) return true;
  // French - futur tips for futur sentences
  if (/\b\w+(rai|ras|ra|rons|rez|ront)\b/.test(tN) && /futur/i.test(tipLower)) return true;
  // French - conditionnel tips for conditionnel sentences
  if (/\b\w+(rais|rait|rions|riez|raient)\b/.test(tN) && /conditionnel|conditional/i.test(tipLower)) return true;
  // French - reflexive verbs
  if (/\b(me|m|te|t|se|s|nous|vous)\b/.test(tN) && /réfléchi|reflexi|pronominal/i.test(tipLower)) return true;

  // Broader French stem check
  const frFirstQuote = tipLower.match(/[""'](\w+)[""']/);
  if (frFirstQuote) {
    const term = frFirstQuote[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (term.length >= 4) {
      const stem = term.endsWith('er') || term.endsWith('ir') ? term.slice(0, -2) :
                   term.endsWith('re') ? term.slice(0, -2) : term;
      if (stem.length >= 3 && tN.includes(stem)) return true;
    }
  }

  return false;
}

// ============================================================
// PROCESS AND GENERATE FIXES
// ============================================================

function processFixes(flaggedList, deckMap, generateTipFn) {
  const finalFixes = [];
  let falsePositives = 0;

  for (const f of flaggedList) {
    const card = deckMap[f.id];
    if (!card) continue;

    if (isFalsePositive(card, f)) {
      falsePositives++;
      continue;
    }

    const newTip = generateTipFn(card);

    if (newTip) {
      finalFixes.push({
        id: f.id,
        current_tip: f.current_tip,
        fixed_tip: newTip,
        issue: f.issue
      });
    } else {
      finalFixes.push({
        id: f.id,
        current_tip: f.current_tip,
        fixed_tip: `[NEEDS REVIEW] ${f.details}`,
        issue: f.issue
      });
    }
  }

  return { fixes: finalFixes, falsePositives };
}

const esResult = processFixes(esFlagged, esMap, generateSpanishTip);
const itResult = processFixes(itFlagged, itMap, generateItalianTip);
const frResult = processFixes(frFlagged, frMap, generateFrenchTip);

// Write output files
fs.writeFileSync(path.join(OUT, 'es-tip-fixes.json'), JSON.stringify(esResult.fixes, null, 2));
fs.writeFileSync(path.join(OUT, 'it-tip-fixes.json'), JSON.stringify(itResult.fixes, null, 2));
fs.writeFileSync(path.join(OUT, 'fr-tip-fixes.json'), JSON.stringify(frResult.fixes, null, 2));

console.log('=== FINAL RESULTS ===\n');

const esTotal = es.filter(c => c.grammar).length;
const itTotal = it.filter(c => c.grammar).length;
const frTotal = fr.filter(c => c.grammar).length;

console.log(`Spanish: ${esTotal} tips checked, ${esFlagged.length} initially flagged, ${esResult.falsePositives} false positives removed, ${esResult.fixes.length} fixes generated`);
console.log(`Italian: ${itTotal} tips checked, ${itFlagged.length} initially flagged, ${itResult.falsePositives} false positives removed, ${itResult.fixes.length} fixes generated`);
console.log(`French:  ${frTotal} tips checked, ${frFlagged.length} initially flagged, ${frResult.falsePositives} false positives removed, ${frResult.fixes.length} fixes generated`);

for (const [label, fixes] of [['Spanish', esResult.fixes], ['Italian', itResult.fixes], ['French', frResult.fixes]]) {
  const manual = fixes.filter(f => f.fixed_tip.startsWith('[NEEDS'));
  const auto = fixes.filter(f => !f.fixed_tip.startsWith('[NEEDS'));
  const byIssue = {};
  for (const f of fixes) {
    byIssue[f.issue] = (byIssue[f.issue] || 0) + 1;
  }
  console.log(`\n  ${label}: ${auto.length} auto-fixed, ${manual.length} need manual review`);
  console.log(`    Breakdown: ${JSON.stringify(byIssue)}`);
}
