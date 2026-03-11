/**
 * expand-spanish-35.cjs
 *
 * Adds 109 expansion cards to the Spanish deck for 3 under-target nodes:
 *   - node-02: Irregular present verbs        (+68 cards)
 *   - node-12: Past contrast (pret vs imperf) (+18 cards)
 *   - node-27: Reported speech                (+23 cards)
 *
 * Steps:
 *   1. Read existing deck
 *   2. Collect existing target sentences (lowercased) for dedup
 *   3. Append new cards (skip duplicates)
 *   4. Sort all cards by grammarNode
 *   5. Re-assign sequential IDs and audio (es-{id}.mp3)
 *   6. Write back to deck.json
 *   7. Print stats
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log(`Existing deck: ${deck.length} cards`);

// ─── Collect existing targets for dedup ──────────────────────
const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));

// ═════════════════════════════════════════════════════════════
// NEW CARDS
// ═════════════════════════════════════════════════════════════

const newCards = [];

// ─────────────────────────────────────────────────────────────
// NODE-02: Irregular present verbs (+68 cards)
// ─────────────────────────────────────────────────────────────

const node02Cards = [
  // --- ser (soy, eres, somos) ---
  { target: "Soy el responsable del proyecto.", english: "I am the person in charge of the project.", tags: ["work", "general"], grammar: "Ser: 1st person singular = soy. Used for identity and roles." },
  { target: "Eres muy buena cocinera.", english: "You are a very good cook.", tags: ["family", "general"], grammar: "Ser: 2nd person singular = eres. For inherent qualities." },
  { target: "Somos vecinos desde hace años.", english: "We have been neighbors for years.", tags: ["family", "general"], grammar: "Ser: 1st person plural = somos. For identity/relationships." },
  { target: "Eres la persona más puntual del equipo.", english: "You are the most punctual person on the team.", tags: ["work", "general"] },
  { target: "Somos cinco en mi familia.", english: "There are five of us in my family.", tags: ["family", "general"] },

  // --- ir (voy, vas, va, vamos, van) ---
  { target: "Voy a la farmacia antes de cenar.", english: "I'm going to the pharmacy before dinner.", tags: ["general", "family"], grammar: "Ir: 1st person = voy. Ir a + infinitive = near future." },
  { target: "¿Vas al centro esta tarde?", english: "Are you going downtown this afternoon?", tags: ["travel", "general"], grammar: "Ir: 2nd person = vas." },
  { target: "Mi madre va al mercado los viernes.", english: "My mother goes to the market on Fridays.", tags: ["family", "general"], grammar: "Ir: 3rd person = va." },
  { target: "Vamos a celebrar tu cumpleaños en casa.", english: "We are going to celebrate your birthday at home.", tags: ["family", "general"], grammar: "Ir: 1st person plural = vamos. Also used for \"let's.\"" },
  { target: "Los niños van al parque después de clase.", english: "The children go to the park after school.", tags: ["family", "general"], grammar: "Ir: 3rd person plural = van." },

  // --- tener (tengo, tienes) ---
  { target: "Tengo una idea para el nuevo diseño.", english: "I have an idea for the new design.", tags: ["work", "general"], grammar: "Tener: 1st person = tengo (irregular -go form)." },
  { target: "¿Tienes tiempo para hablar un momento?", english: "Do you have time to talk for a moment?", tags: ["work", "general"], grammar: "Tener: 2nd person = tienes." },
  { target: "Tengo sed después de correr.", english: "I'm thirsty after running.", tags: ["general", "travel"], grammar: "Tener + noun for physical states: tener sed (be thirsty), tener hambre (be hungry)." },

  // --- hacer (hago, haces) ---
  { target: "Hago la cena para toda la familia.", english: "I make dinner for the whole family.", tags: ["family", "general"], grammar: "Hacer: 1st person = hago (irregular -go form)." },
  { target: "¿Qué haces los fines de semana?", english: "What do you do on weekends?", tags: ["general", "family"], grammar: "Hacer: 2nd person = haces." },
  { target: "Hago deporte tres veces por semana.", english: "I exercise three times a week.", tags: ["general", "work"] },

  // --- decir (digo, dices, dice) ---
  { target: "Siempre digo la verdad a mis amigos.", english: "I always tell the truth to my friends.", tags: ["general", "family"], grammar: "Decir: 1st person = digo (irregular -go form + stem change e→i)." },
  { target: "¿Qué dices de ir al cine esta noche?", english: "What do you say about going to the movies tonight?", tags: ["general", "family"], grammar: "Decir: 2nd person = dices." },
  { target: "Mi jefe dice que el informe está bien.", english: "My boss says the report is fine.", tags: ["work", "general"], grammar: "Decir: 3rd person = dice." },

  // --- venir (vengo, vienes) ---
  { target: "Vengo del supermercado con las bolsas.", english: "I'm coming from the supermarket with the bags.", tags: ["general", "family"], grammar: "Venir: 1st person = vengo (irregular -go form + stem change e→ie)." },
  { target: "¿Vienes a la fiesta del sábado?", english: "Are you coming to the party on Saturday?", tags: ["general", "family"], grammar: "Venir: 2nd person = vienes (stem change e→ie)." },
  { target: "Vengo cansado del trabajo todos los días.", english: "I come home tired from work every day.", tags: ["work", "general"] },

  // --- poder (puedo, puedes, puede) ---
  { target: "No puedo dormir con tanto ruido.", english: "I can't sleep with so much noise.", tags: ["travel", "family"], grammar: "Poder: 1st person = puedo. Stem change: o→ue." },
  { target: "¿Puedes repetir eso más despacio?", english: "Can you repeat that more slowly?", tags: ["travel", "general"], grammar: "Poder: 2nd person = puedes. Stem change: o→ue." },
  { target: "Mi abuela puede caminar sin ayuda.", english: "My grandmother can walk without help.", tags: ["family", "general"], grammar: "Poder: 3rd person = puede. Stem change: o→ue." },

  // --- querer (quiero, quieres, quiere) ---
  { target: "Quiero aprender a tocar la guitarra.", english: "I want to learn to play the guitar.", tags: ["general", "family"], grammar: "Querer: 1st person = quiero. Stem change: e→ie." },
  { target: "¿Quieres que te ayude con la mudanza?", english: "Do you want me to help you with the move?", tags: ["family", "general"], grammar: "Querer: 2nd person = quieres. Stem change: e→ie." },
  { target: "Mi hijo quiere ser astronauta.", english: "My son wants to be an astronaut.", tags: ["family", "general"], grammar: "Querer: 3rd person = quiere. Stem change: e→ie." },

  // --- saber (sé, sabes, sabe) ---
  { target: "No sé dónde está la estación de tren.", english: "I don't know where the train station is.", tags: ["travel", "general"], grammar: "Saber: 1st person = sé (irregular). For facts/information." },
  { target: "¿Sabes cocinar paella?", english: "Do you know how to cook paella?", tags: ["general", "travel"], grammar: "Saber: 2nd person = sabes. Saber + infinitive = to know how to." },
  { target: "Mi padre sabe arreglar cualquier cosa.", english: "My father knows how to fix anything.", tags: ["family", "general"], grammar: "Saber: 3rd person = sabe." },

  // --- poner (pongo, pones) ---
  { target: "Siempre pongo la alarma a las seis.", english: "I always set the alarm for six.", tags: ["work", "general"], grammar: "Poner: 1st person = pongo (irregular -go form)." },
  { target: "¿Dónde pones las llaves cuando llegas?", english: "Where do you put the keys when you arrive?", tags: ["family", "general"], grammar: "Poner: 2nd person = pones." },
  { target: "Pongo música mientras cocino.", english: "I play music while I cook.", tags: ["general", "family"] },

  // --- salir (salgo, sales, sale) ---
  { target: "Salgo de casa a las siete y media.", english: "I leave the house at seven thirty.", tags: ["work", "general"], grammar: "Salir: 1st person = salgo (irregular -go form)." },
  { target: "¿A qué hora sales del trabajo?", english: "What time do you leave work?", tags: ["work", "general"], grammar: "Salir: 2nd person = sales." },
  { target: "El tren sale en quince minutos.", english: "The train leaves in fifteen minutes.", tags: ["travel", "general"], grammar: "Salir: 3rd person = sale." },
  { target: "Salgo a correr por las mañanas.", english: "I go out for a run in the mornings.", tags: ["general", "family"] },

  // --- dar (doy, das, da) ---
  { target: "Te doy mi número de teléfono.", english: "I'll give you my phone number.", tags: ["general", "travel"], grammar: "Dar: 1st person = doy (irregular)." },
  { target: "¿Me das un vaso de agua, por favor?", english: "Can you give me a glass of water, please?", tags: ["family", "general"], grammar: "Dar: 2nd person = das." },
  { target: "El profesor da la clase a las nueve.", english: "The teacher gives the class at nine.", tags: ["work", "general"], grammar: "Dar: 3rd person = da." },

  // --- ver (veo, ves, ve) ---
  { target: "Veo a mis abuelos todos los domingos.", english: "I see my grandparents every Sunday.", tags: ["family", "general"], grammar: "Ver: 1st person = veo. Note \"a\" before people (personal a)." },
  { target: "¿Ves esa montaña a lo lejos?", english: "Do you see that mountain in the distance?", tags: ["travel", "general"], grammar: "Ver: 2nd person = ves." },
  { target: "Desde mi ventana se ve todo el valle.", english: "From my window you can see the whole valley.", tags: ["travel", "family"], grammar: "Ver: 3rd person = ve. \"Se ve\" = impersonal \"one can see.\"" },

  // --- conocer (conozco, conoces) ---
  { target: "Conozco un restaurante muy bueno por aquí.", english: "I know a very good restaurant around here.", tags: ["travel", "general"], grammar: "Conocer: 1st person = conozco (-zco form). For familiarity/acquaintance." },
  { target: "¿Conoces a mi hermana mayor?", english: "Do you know my older sister?", tags: ["family", "general"], grammar: "Conocer: 2nd person = conoces. Note personal \"a\" before people." },

  // --- oír (oigo, oyes) ---
  { target: "No oigo bien con tanto ruido.", english: "I can't hear well with so much noise.", tags: ["travel", "general"], grammar: "Oír: 1st person = oigo (irregular -go form + y insertion)." },
  { target: "¿Oyes esa música que viene de afuera?", english: "Do you hear that music coming from outside?", tags: ["general", "family"], grammar: "Oír: 2nd person = oyes (y insertion)." },

  // --- Stem-changing: jugar (juego) ---
  { target: "Juego al tenis con mi vecino los martes.", english: "I play tennis with my neighbor on Tuesdays.", tags: ["general", "family"], grammar: "Jugar: stem change u→ue. The only u→ue verb in Spanish." },
  { target: "Mi sobrino juega con los juguetes nuevos.", english: "My nephew plays with the new toys.", tags: ["family", "general"] },

  // --- dormir (duermo) ---
  { target: "Duermo muy mal cuando hace calor.", english: "I sleep very badly when it's hot.", tags: ["travel", "general"], grammar: "Dormir: stem change o→ue. Duermo, duermes, duerme, dormimos." },

  // --- sentir (siento) ---
  { target: "Siento un dolor fuerte en la espalda.", english: "I feel a strong pain in my back.", tags: ["general", "work"], grammar: "Sentir: stem change e→ie. Siento, sientes, siente, sentimos." },
  { target: "Lo siento mucho, llego tarde al trabajo.", english: "I'm very sorry, I'm late to work.", tags: ["work", "general"] },

  // --- preferir (prefiero) ---
  { target: "Prefiero viajar en tren que en avión.", english: "I prefer to travel by train rather than by plane.", tags: ["travel", "general"], grammar: "Preferir: stem change e→ie. Prefiero, prefieres, prefiere." },
  { target: "Mi esposa prefiere la playa a la montaña.", english: "My wife prefers the beach to the mountains.", tags: ["family", "travel"] },

  // --- pensar (pienso) ---
  { target: "Pienso que este proyecto tiene futuro.", english: "I think this project has a future.", tags: ["work", "general"], grammar: "Pensar: stem change e→ie. Pienso, piensas, piensa, pensamos." },
  { target: "¿Qué piensas de la nueva oficina?", english: "What do you think about the new office?", tags: ["work", "general"] },

  // --- entender (entiendo) ---
  { target: "No entiendo esta parte del contrato.", english: "I don't understand this part of the contract.", tags: ["work", "general"], grammar: "Entender: stem change e→ie. Entiendo, entiendes, entiende." },

  // --- encontrar (encuentro) ---
  { target: "No encuentro mis gafas de sol.", english: "I can't find my sunglasses.", tags: ["travel", "general"], grammar: "Encontrar: stem change o→ue. Encuentro, encuentras, encuentra." },
  { target: "Siempre encuentro algo interesante en este mercado.", english: "I always find something interesting at this market.", tags: ["travel", "general"] },

  // --- volver (vuelvo) ---
  { target: "Vuelvo a casa después de las ocho.", english: "I come back home after eight.", tags: ["work", "family"], grammar: "Volver: stem change o→ue. Vuelvo, vuelves, vuelve, volvemos." },
  { target: "Mi padre vuelve del viaje el jueves.", english: "My father comes back from the trip on Thursday.", tags: ["family", "travel"] },

  // --- cerrar (cierro) ---
  { target: "Cierro la ventana porque hace frío.", english: "I close the window because it's cold.", tags: ["general", "family"], grammar: "Cerrar: stem change e→ie. Cierro, cierras, cierra, cerramos." },
  { target: "La tienda cierra a las nueve de la noche.", english: "The store closes at nine at night.", tags: ["travel", "general"] },

  // --- pedir (pido) ---
  { target: "Siempre pido lo mismo en este restaurante.", english: "I always order the same thing at this restaurant.", tags: ["travel", "general"], grammar: "Pedir: stem change e→i. Pido, pides, pide, pedimos." },
  { target: "Mi hija pide helado después de cada comida.", english: "My daughter asks for ice cream after every meal.", tags: ["family", "general"] },

  // --- seguir (sigo) ---
  { target: "Sigo las instrucciones del manual paso a paso.", english: "I follow the instructions in the manual step by step.", tags: ["work", "general"], grammar: "Seguir: stem change e→i + gu→g before -o. Sigo, sigues, sigue." },
  { target: "¿Sigues trabajando en la misma empresa?", english: "Are you still working at the same company?", tags: ["work", "general"] },
];

// ─────────────────────────────────────────────────────────────
// NODE-12: Past contrast — preterite vs imperfect (+18 cards)
// ─────────────────────────────────────────────────────────────

const node12Cards = [
  { target: "Mientras llovía, llegamos al hotel.", english: "While it was raining, we arrived at the hotel.", tags: ["travel", "general"], grammar: "Imperfect (llovía) for background weather + preterite (llegamos) for completed action." },
  { target: "Cuando era niño, vivía cerca del mar.", english: "When I was a child, I lived near the sea.", tags: ["family", "general"], grammar: "Both imperfect: era + vivía. Habitual past — describes how things used to be." },
  { target: "Estudiaba en la biblioteca cuando sonó mi teléfono.", english: "I was studying in the library when my phone rang.", tags: ["work", "general"], grammar: "Imperfect (estudiaba) for ongoing action + preterite (sonó) for sudden interruption." },
  { target: "De repente se apagaron las luces y todos gritaron.", english: "Suddenly the lights went out and everyone screamed.", tags: ["general", "travel"], grammar: "\"De repente\" triggers preterite: both actions (apagaron, gritaron) are sudden, completed events." },
  { target: "Mientras caminábamos por la playa, encontramos unas conchas.", english: "While we were walking on the beach, we found some shells.", tags: ["travel", "family"], grammar: "Imperfect (caminábamos) for background + preterite (encontramos) for the specific event." },
  { target: "Ya sabía la noticia cuando me llamaste.", english: "I already knew the news when you called me.", tags: ["general", "family"], grammar: "\"Ya\" + imperfect (sabía) for prior state + preterite (llamaste) for the moment of calling." },
  { target: "Todavía dormía cuando empezó a llover.", english: "I was still sleeping when it started to rain.", tags: ["general", "travel"], grammar: "\"Todavía\" + imperfect (dormía) for ongoing state + preterite (empezó) for interruption." },
  { target: "Cuando vivíamos en el campo, teníamos un huerto grande.", english: "When we lived in the countryside, we had a big garden.", tags: ["family", "general"], grammar: "Both imperfect: vivíamos + teníamos. Describes a habitual past situation, not a single event." },
  { target: "Mientras mi madre cocinaba, mi padre puso la mesa.", english: "While my mother was cooking, my father set the table.", tags: ["family", "general"], grammar: "Imperfect (cocinaba) for ongoing background + preterite (puso) for completed action." },
  { target: "Hacía mucho sol cuando salimos de excursión.", english: "It was very sunny when we went on the excursion.", tags: ["travel", "general"], grammar: "Imperfect (hacía) for weather backdrop + preterite (salimos) for the specific departure." },
  { target: "Cuando tenía veinte años, viajé a México por primera vez.", english: "When I was twenty, I traveled to Mexico for the first time.", tags: ["travel", "general"], grammar: "Imperfect (tenía) for age/background + preterite (viajé) for the one-time event." },
  { target: "Mientras esperaba el autobús, vi a un viejo amigo.", english: "While I was waiting for the bus, I saw an old friend.", tags: ["general", "travel"], grammar: "Imperfect (esperaba) for ongoing wait + preterite (vi) for the sudden encounter." },
  { target: "De repente el perro salió corriendo y cruzó la calle.", english: "Suddenly the dog ran out and crossed the street.", tags: ["general", "family"], grammar: "\"De repente\" + two preterites (salió, cruzó) — both sudden completed actions." },
  { target: "Cuando era joven, quería ser médico.", english: "When I was young, I wanted to be a doctor.", tags: ["family", "work"], grammar: "Both imperfect: era + quería. Describes a past desire that lasted over time." },
  { target: "Mientras leía el periódico, alguien tocó la puerta.", english: "While I was reading the newspaper, someone knocked on the door.", tags: ["general", "family"], grammar: "Imperfect (leía) for ongoing activity + preterite (tocó) for the interruption." },
  { target: "Ya estaba dormido cuando llegó mi esposa.", english: "I was already asleep when my wife arrived.", tags: ["family", "general"], grammar: "\"Ya\" + imperfect (estaba) for existing state + preterite (llegó) for arrival." },
  { target: "Todos los veranos íbamos a la casa de mis abuelos.", english: "Every summer we used to go to my grandparents' house.", tags: ["family", "travel"], grammar: "Imperfect (íbamos) for repeated habitual action. \"Todos los veranos\" signals repetition." },
  { target: "Mientras hablaba por teléfono, el gato se subió a la mesa.", english: "While I was talking on the phone, the cat jumped on the table.", tags: ["family", "general"], grammar: "Imperfect (hablaba) for background action + preterite (se subió) for the sudden event." },
];

// ─────────────────────────────────────────────────────────────
// NODE-27: Reported speech (+23 cards)
// ─────────────────────────────────────────────────────────────

const node27Cards = [
  { target: "Mi madre dijo que vendría a visitarnos el domingo.", english: "My mother said she would come visit us on Sunday.", tags: ["family", "general"], grammar: "Reported speech: present \"vendrá\" → imperfect \"vendría\" after \"dijo que.\"" },
  { target: "El profesor preguntó si habíamos entendido la lección.", english: "The teacher asked if we had understood the lesson.", tags: ["work", "general"], grammar: "Reported question with \"si\" (if/whether). Preterite perfect → pluperfect." },
  { target: "Mi jefe explicó que el proyecto cambiaría de fecha.", english: "My boss explained that the project would change dates.", tags: ["work", "general"], grammar: "Reported speech: \"cambiará\" → \"cambiaría\" (future → conditional) after \"explicó que.\"" },
  { target: "Laura comentó que estaba pensando en mudarse.", english: "Laura mentioned that she was thinking about moving.", tags: ["general", "family"], grammar: "Reported speech: \"estoy pensando\" → \"estaba pensando\" (present → imperfect)." },
  { target: "El médico respondió que los resultados eran normales.", english: "The doctor replied that the results were normal.", tags: ["general", "family"], grammar: "Reported speech: \"son normales\" → \"eran normales\" (present → imperfect)." },
  { target: "Mi hermano afirmó que no sabía nada del tema.", english: "My brother claimed he didn't know anything about the topic.", tags: ["family", "general"], grammar: "Reported speech with \"afirmó que.\" \"No sé\" → \"no sabía\" (present → imperfect)." },
  { target: "La vecina aseguró que había oído un ruido extraño.", english: "The neighbor assured us she had heard a strange noise.", tags: ["general", "family"], grammar: "Reported speech: \"he oído\" → \"había oído\" (present perfect → pluperfect)." },
  { target: "El guía mencionó que el museo cerraba a las cinco.", english: "The guide mentioned that the museum closed at five.", tags: ["travel", "general"], grammar: "Reported speech: \"cierra\" → \"cerraba\" (present → imperfect) after \"mencionó que.\"" },
  { target: "Mi amiga contó que había viajado sola por Asia.", english: "My friend told us she had traveled alone through Asia.", tags: ["travel", "general"], grammar: "Reported speech: \"viajé\" → \"había viajado\" (preterite → pluperfect) after \"contó que.\"" },
  { target: "El recepcionista dijo que no quedaban habitaciones.", english: "The receptionist said there were no rooms left.", tags: ["travel", "general"], grammar: "Reported speech: \"no quedan\" → \"no quedaban\" (present → imperfect)." },
  { target: "Mi padre preguntó qué hora era.", english: "My father asked what time it was.", tags: ["family", "general"], grammar: "Reported question with \"qué.\" \"¿Qué hora es?\" → \"qué hora era.\"" },
  { target: "La profesora preguntó cómo se escribía esa palabra.", english: "The teacher asked how that word was spelled.", tags: ["work", "general"], grammar: "Reported question with \"cómo.\" \"¿Cómo se escribe?\" → \"cómo se escribía.\"" },
  { target: "El piloto explicó que aterrizaríamos con retraso.", english: "The pilot explained that we would land late.", tags: ["travel", "general"], grammar: "Reported speech: \"aterrizaremos\" → \"aterrizaríamos\" (future → conditional)." },
  { target: "Mi compañero comentó que necesitaba más tiempo para el informe.", english: "My colleague mentioned that he needed more time for the report.", tags: ["work", "general"], grammar: "Reported speech: \"necesito\" → \"necesitaba\" (present → imperfect)." },
  { target: "La directora afirmó que los sueldos subirían el próximo año.", english: "The director stated that salaries would go up next year.", tags: ["work", "general"], grammar: "Reported speech: \"subirán\" → \"subirían\" (future → conditional) after \"afirmó que.\"" },
  { target: "El camarero preguntó si queríamos postre.", english: "The waiter asked if we wanted dessert.", tags: ["travel", "general"], grammar: "Reported question with \"si\": \"¿Quieren postre?\" → \"si queríamos postre.\"" },
  { target: "Mi abuela contó que de joven trabajaba en una fábrica.", english: "My grandmother told us that when she was young she worked in a factory.", tags: ["family", "work"], grammar: "Reported speech: both verbs stay imperfect for habitual past narration." },
  { target: "El mecánico aseguró que el coche estaría listo el viernes.", english: "The mechanic assured us the car would be ready on Friday.", tags: ["general", "travel"], grammar: "Reported speech: \"estará\" → \"estaría\" (future → conditional) after \"aseguró que.\"" },
  { target: "Mi hijo dijo que quería un perro para su cumpleaños.", english: "My son said he wanted a dog for his birthday.", tags: ["family", "general"], grammar: "Reported speech: \"quiero\" → \"quería\" (present → imperfect) after \"dijo que.\"" },
  { target: "La enfermera respondió que el doctor llegaría en diez minutos.", english: "The nurse replied that the doctor would arrive in ten minutes.", tags: ["general", "work"], grammar: "Reported speech: \"llegará\" → \"llegaría\" (future → conditional)." },
  { target: "El taxista mencionó que conocía un atajo para evitar el tráfico.", english: "The taxi driver mentioned he knew a shortcut to avoid traffic.", tags: ["travel", "general"], grammar: "Reported speech: \"conozco\" → \"conocía\" (present → imperfect) after \"mencionó que.\"" },
  { target: "Mi esposa preguntó si yo había comprado la leche.", english: "My wife asked if I had bought the milk.", tags: ["family", "general"], grammar: "Reported question: \"¿Has comprado?\" → \"si había comprado\" (pres. perf. → pluperfect)." },
  { target: "El entrenador explicó que debíamos calentar antes de correr.", english: "The coach explained that we had to warm up before running.", tags: ["general", "work"], grammar: "Reported speech: \"deben\" → \"debíamos\" (present → imperfect) after \"explicó que.\"" },
];

// ═════════════════════════════════════════════════════════════
// MERGE: append new cards, skip duplicates
// ═════════════════════════════════════════════════════════════

const allNew = [
  ...node02Cards.map(c => ({ ...c, grammarNode: 'node-02' })),
  ...node12Cards.map(c => ({ ...c, grammarNode: 'node-12' })),
  ...node27Cards.map(c => ({ ...c, grammarNode: 'node-27' })),
];

let addedCount = 0;
let skippedDupes = 0;
const addedPerNode = { 'node-02': 0, 'node-12': 0, 'node-27': 0 };

for (const card of allNew) {
  const key = card.target.toLowerCase().trim();
  if (existingTargets.has(key)) {
    skippedDupes++;
    console.log(`  SKIP duplicate: ${card.target}`);
    continue;
  }
  existingTargets.add(key);
  deck.push({
    id: 0,          // will be reassigned
    target: card.target,
    english: card.english,
    audio: '',       // will be reassigned
    ...(card.grammar ? { grammar: card.grammar } : {}),
    tags: card.tags,
    grammarNode: card.grammarNode,
  });
  addedCount++;
  addedPerNode[card.grammarNode]++;
}

console.log(`\nAdded ${addedCount} new cards (skipped ${skippedDupes} duplicates)`);
console.log('  node-02:', addedPerNode['node-02']);
console.log('  node-12:', addedPerNode['node-12']);
console.log('  node-27:', addedPerNode['node-27']);

// ═════════════════════════════════════════════════════════════
// SORT by grammarNode
// ═════════════════════════════════════════════════════════════

const nodeOrder = (n) => {
  const m = n.match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 999;
};
deck.sort((a, b) => nodeOrder(a.grammarNode) - nodeOrder(b.grammarNode));

// ═════════════════════════════════════════════════════════════
// RE-ASSIGN sequential IDs and audio
// ═════════════════════════════════════════════════════════════

for (let i = 0; i < deck.length; i++) {
  deck[i].id = i + 1;
  deck[i].audio = `es-${i + 1}.mp3`;
}

// ═════════════════════════════════════════════════════════════
// WRITE
// ═════════════════════════════════════════════════════════════

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));

// ═════════════════════════════════════════════════════════════
// STATS
// ═════════════════════════════════════════════════════════════

console.log(`\nNew total: ${deck.length} cards`);

// Per-node counts
const nodeCounts = {};
for (const c of deck) {
  nodeCounts[c.grammarNode] = (nodeCounts[c.grammarNode] || 0) + 1;
}
const sortedNodes = Object.entries(nodeCounts).sort((a, b) =>
  nodeOrder(a[0]) - nodeOrder(b[0])
);
console.log('\nCards per node:');
for (const [node, count] of sortedNodes) {
  console.log(`  ${node}: ${count}`);
}

// Tag distribution
const tagCounts = {};
for (const c of deck) {
  for (const tag of c.tags) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
}
console.log('\nTag distribution:');
for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${tag}: ${count} (${(count / deck.length * 100).toFixed(1)}%)`);
}

// Grammar notes
const grammarCount = deck.filter(c => c.grammar).length;
console.log(`\nCards with grammar notes: ${grammarCount}/${deck.length} (${(grammarCount / deck.length * 100).toFixed(1)}%)`);

console.log('\nDone! Wrote expanded deck to', DECK_PATH);
