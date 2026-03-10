/**
 * expand-c1c2-v2.cjs
 *
 * Second-pass expansion for C1/C2 nodes (21-26) which are severely underpopulated.
 * Current counts: 21:38, 22:79, 23:65, 24:63, 25:73, 26:51  (total: 369)
 * Target: ~100 cards per node for meaningful SRS coverage.
 *
 * Adds ~250 new cards distributed across all four goals (general, travel, family, work).
 * ~30% include grammar explanations.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log(`Current deck: ${deck.length} cards`);

const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));
let nextId = Math.max(...deck.map(c => c.id)) + 1;
let added = 0;
let dupes = 0;

function addCards(cards) {
  for (const c of cards) {
    const key = c.target.toLowerCase().trim();
    if (existingTargets.has(key)) { dupes++; continue; }
    existingTargets.add(key);
    deck.push({
      id: nextId++,
      target: c.target,
      english: c.english,
      audio: '',
      ...(c.grammar ? { grammar: c.grammar } : {}),
      tags: c.tags || ['general'],
      grammarNode: c.grammarNode || ''
    });
    added++;
  }
}

// ═══════════════════════════════════════════════════════════════
// NODE 21: Subjunctive Nuances (C1)  — 38 → ~100 (+62 cards)
// Covers: negated belief, como si, el hecho de que, reduplicative,
//         indefinite antecedents, por más que, antes de que, etc.
// ═══════════════════════════════════════════════════════════════

addCards([
  // --- general ---
  { target: "No parece que vaya a mejorar el tiempo esta semana.", english: "It doesn't seem like the weather is going to improve this week.", grammarNode: "node-21", grammar: "No parece que + subjunctive for negated perception." },
  { target: "Dudo que alguien se haya dado cuenta del error.", english: "I doubt anyone has noticed the mistake.", grammarNode: "node-21" },
  { target: "Es posible que tengamos que cambiar de planes.", english: "It's possible that we'll have to change plans.", grammarNode: "node-21" },
  { target: "Aunque llueva, vamos a salir de todas formas.", english: "Even if it rains, we're going out anyway.", grammarNode: "node-21", grammar: "Aunque + subjunctive for hypothetical concessions (even if)." },
  { target: "No es que no quiera, es que no puedo.", english: "It's not that I don't want to, it's that I can't.", grammarNode: "node-21" },
  { target: "Haga lo que haga, siempre encuentra algo que criticar.", english: "Whatever he does, he always finds something to criticize.", grammarNode: "node-21", grammar: "Reduplicative subjunctive: Haga lo que haga = whatever X does." },
  { target: "Sea como sea, tenemos que tomar una decision.", english: "However it may be, we have to make a decision.", grammarNode: "node-21" },
  { target: "Por mucho que insistas, no voy a cambiar de opinion.", english: "No matter how much you insist, I'm not going to change my mind.", grammarNode: "node-21", grammar: "Por mucho que + subjunctive for futile emphasis." },
  { target: "A menos que me llames antes de las cinco, no espero.", english: "Unless you call me before five, I'm not waiting.", grammarNode: "node-21" },
  { target: "Puede que tenga razon, pero no estoy de acuerdo.", english: "He may be right, but I disagree.", grammarNode: "node-21" },
  { target: "Niego que eso sea verdad.", english: "I deny that that is true.", grammarNode: "node-21" },
  { target: "Busco a alguien que sepa hablar tres idiomas.", english: "I'm looking for someone who can speak three languages.", grammarNode: "node-21", grammar: "Subjunctive after indefinite antecedent: alguien que + subjunctive." },
  { target: "No conozco a nadie que haya estado en ese pais.", english: "I don't know anyone who has been to that country.", grammarNode: "node-21" },
  { target: "Antes de que te vayas, quiero decirte algo.", english: "Before you leave, I want to tell you something.", grammarNode: "node-21" },
  { target: "Para que entiendas la situacion, te lo voy a explicar desde el principio.", english: "So that you understand the situation, I'll explain it from the beginning.", grammarNode: "node-21" },
  { target: "Dondequiera que vayas, siempre te voy a recordar.", english: "Wherever you go, I'll always remember you.", grammarNode: "node-21" },
  { target: "Es una lastima que no puedas venir a la fiesta.", english: "It's a shame you can't come to the party.", grammarNode: "node-21" },
  { target: "No creo que haya suficiente tiempo para terminar.", english: "I don't think there's enough time to finish.", grammarNode: "node-21" },
  // --- travel ---
  { target: "Necesito un hotel que tenga piscina y este cerca del centro.", english: "I need a hotel that has a pool and is close to the center.", tags: ["general", "travel"], grammarNode: "node-21", grammar: "Subjunctive after indefinite antecedent: un hotel que + subjunctive." },
  { target: "Dudo que el vuelo salga a tiempo con esta tormenta.", english: "I doubt the flight will leave on time with this storm.", tags: ["general", "travel"], grammarNode: "node-21" },
  { target: "Aunque no hable el idioma, siempre me las arreglo cuando viajo.", english: "Even if I don't speak the language, I always manage when I travel.", tags: ["general", "travel"], grammarNode: "node-21" },
  { target: "Es mejor que reserves con anticipacion para conseguir buen precio.", english: "It's better that you book in advance to get a good price.", tags: ["general", "travel"], grammarNode: "node-21" },
  { target: "No parece que haya plazas disponibles en el tren de las diez.", english: "It doesn't seem like there are seats available on the ten o'clock train.", tags: ["general", "travel"], grammarNode: "node-21" },
  { target: "Pase lo que pase, no pierdas el pasaporte.", english: "Whatever happens, don't lose the passport.", tags: ["general", "travel"], grammarNode: "node-21" },
  { target: "Busco una ruta que no tenga demasiado trafico.", english: "I'm looking for a route that doesn't have too much traffic.", tags: ["general", "travel"], grammarNode: "node-21" },
  { target: "A menos que encontremos un taxi, vamos a perder el avion.", english: "Unless we find a taxi, we're going to miss the plane.", tags: ["general", "travel"], grammarNode: "node-21" },
  // --- family ---
  { target: "Es importante que los ninos aprendan a compartir desde pequenos.", english: "It's important that children learn to share from a young age.", tags: ["general", "family"], grammarNode: "node-21" },
  { target: "No creo que mi hermana sepa lo que le hemos preparado.", english: "I don't think my sister knows what we've prepared for her.", tags: ["general", "family"], grammarNode: "node-21" },
  { target: "Ojalá mis padres pudieran quedarse más tiempo.", english: "I wish my parents could stay longer.", tags: ["general", "family"], grammarNode: "node-21" },
  { target: "Aunque no estemos de acuerdo, es mi familia y la quiero.", english: "Even if we don't agree, it's my family and I love them.", tags: ["general", "family"], grammarNode: "node-21" },
  { target: "Quienquiera que haya hecho esa tarta, cocina de maravilla.", english: "Whoever made that cake cooks wonderfully.", tags: ["general", "family"], grammarNode: "node-21" },
  { target: "Antes de que los abuelos lleguen, vamos a preparar la casa.", english: "Before the grandparents arrive, let's get the house ready.", tags: ["general", "family"], grammarNode: "node-21" },
  { target: "Es posible que mi primo venga con toda su familia.", english: "It's possible that my cousin is coming with his whole family.", tags: ["general", "family"], grammarNode: "node-21" },
  { target: "No es que no me guste tu novio, es que apenas lo conozco.", english: "It's not that I don't like your boyfriend, it's that I barely know him.", tags: ["general", "family"], grammarNode: "node-21" },
  // --- work ---
  { target: "No creo que el proyecto este listo para la fecha limite.", english: "I don't think the project will be ready by the deadline.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "Es necesario que todos entreguen el informe antes del viernes.", english: "It's necessary that everyone submit the report before Friday.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "Aunque trabaje horas extra, no voy a poder terminarlo hoy.", english: "Even if I work overtime, I won't be able to finish it today.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "Dudo que nos aprueben el presupuesto sin mas datos.", english: "I doubt they'll approve the budget without more data.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "Es poco probable que cambien la politica de la empresa.", english: "It's unlikely they'll change the company policy.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "Necesitamos a alguien que domine las hojas de calculo.", english: "We need someone who is proficient in spreadsheets.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "Para que el equipo funcione, es esencial que haya buena comunicacion.", english: "For the team to work, good communication is essential.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "No niego que haya habido errores, pero estamos mejorando.", english: "I don't deny there have been mistakes, but we're improving.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "Hagan lo que hagan, no borren los archivos del servidor.", english: "Whatever you do, don't delete the files from the server.", tags: ["general", "work"], grammarNode: "node-21" },
  { target: "Por mas que revisemos los datos, siempre hay algo que se nos escapa.", english: "No matter how much we review the data, there's always something we miss.", tags: ["general", "work"], grammarNode: "node-21", grammar: "Por más que + subjunctive for emphasis on futility." },
]);

// ═══════════════════════════════════════════════════════════════
// NODE 22: Verb Phrases (C1)  — 79 → ~110 (+30 cards)
// Covers: llevar+gerund, acabar de, ponerse a, dejar de,
//         volver a, seguir+gerund, andar+gerund, estar a punto de
// ═══════════════════════════════════════════════════════════════

addCards([
  // --- general ---
  { target: "Llevo meses intentando encontrar un buen dentista.", english: "I've been trying to find a good dentist for months.", grammarNode: "node-22", grammar: "Llevar + time + gerund = have been doing for [duration]." },
  { target: "Se puso a cantar en medio del supermercado.", english: "He started singing in the middle of the supermarket.", grammarNode: "node-22" },
  { target: "Estoy a punto de terminar el ultimo capitulo.", english: "I'm about to finish the last chapter.", grammarNode: "node-22", grammar: "Estar a punto de + infinitive = to be about to do something." },
  { target: "Anda diciendo por ahi que se va a mudar.", english: "He's going around saying he's going to move.", grammarNode: "node-22" },
  { target: "No deja de sorprenderme lo rapido que pasa el tiempo.", english: "It never ceases to amaze me how fast time goes by.", grammarNode: "node-22" },
  { target: "Suele llegar tarde los lunes por el trafico.", english: "He usually arrives late on Mondays because of traffic.", grammarNode: "node-22", grammar: "Soler + infinitive = to usually do something (habitual)." },
  { target: "Ya lleva un rato esperando en la puerta.", english: "He's been waiting at the door for a while now.", grammarNode: "node-22" },
  { target: "Volvio a equivocarse con la misma palabra.", english: "He got the same word wrong again.", grammarNode: "node-22" },
  // --- travel ---
  { target: "Acabamos de aterrizar y ya estamos haciendo cola.", english: "We just landed and we're already waiting in line.", tags: ["general", "travel"], grammarNode: "node-22" },
  { target: "Llevo tres horas conduciendo sin parar.", english: "I've been driving for three hours without stopping.", tags: ["general", "travel"], grammarNode: "node-22" },
  { target: "Se puso a llover justo cuando salimos del museo.", english: "It started raining right when we left the museum.", tags: ["general", "travel"], grammarNode: "node-22" },
  { target: "Estamos a punto de perder el tren, date prisa.", english: "We're about to miss the train, hurry up.", tags: ["general", "travel"], grammarNode: "node-22" },
  { target: "Sigo sin encontrar mi tarjeta de embarque.", english: "I still can't find my boarding pass.", tags: ["general", "travel"], grammarNode: "node-22", grammar: "Seguir sin + infinitive = still haven't / still can't." },
  { target: "Suelen cerrar las tiendas a la hora de la siesta.", english: "They usually close the shops at siesta time.", tags: ["general", "travel"], grammarNode: "node-22" },
  { target: "Dejamos de buscar hotel y decidimos acampar.", english: "We stopped looking for a hotel and decided to camp.", tags: ["general", "travel"], grammarNode: "node-22" },
  // --- family ---
  { target: "Mi hijo lleva toda la manana jugando en el jardin.", english: "My son has been playing in the garden all morning.", tags: ["general", "family"], grammarNode: "node-22" },
  { target: "Acabo de hablar con mi madre y esta muy contenta.", english: "I just spoke to my mother and she's very happy.", tags: ["general", "family"], grammarNode: "node-22" },
  { target: "Mi abuela sigue tejiendo bufandas para toda la familia.", english: "My grandmother keeps knitting scarves for the whole family.", tags: ["general", "family"], grammarNode: "node-22" },
  { target: "El bebe esta a punto de dar sus primeros pasos.", english: "The baby is about to take his first steps.", tags: ["general", "family"], grammarNode: "node-22" },
  { target: "Mi hermano volvio a olvidarse del cumpleanos de mama.", english: "My brother forgot Mom's birthday again.", tags: ["general", "family"], grammarNode: "node-22" },
  { target: "Mis padres suelen cenar a las nueve de la noche.", english: "My parents usually have dinner at nine in the evening.", tags: ["general", "family"], grammarNode: "node-22" },
  // --- work ---
  { target: "Llevo dos semanas esperando una respuesta del cliente.", english: "I've been waiting two weeks for a reply from the client.", tags: ["general", "work"], grammarNode: "node-22" },
  { target: "Acabo de enviar el correo con los documentos adjuntos.", english: "I just sent the email with the attached documents.", tags: ["general", "work"], grammarNode: "node-22" },
  { target: "Se puso a gritar cuando vio los resultados trimestrales.", english: "He started shouting when he saw the quarterly results.", tags: ["general", "work"], grammarNode: "node-22" },
  { target: "Seguimos trabajando en la propuesta del nuevo proyecto.", english: "We keep working on the proposal for the new project.", tags: ["general", "work"], grammarNode: "node-22" },
  { target: "El jefe esta a punto de anunciar los cambios de departamento.", english: "The boss is about to announce the department changes.", tags: ["general", "work"], grammarNode: "node-22" },
  { target: "Dejo de responder correos a las seis para desconectar.", english: "I stop answering emails at six to disconnect.", tags: ["general", "work"], grammarNode: "node-22" },
  { target: "Suelo revisar el calendario a primera hora de la manana.", english: "I usually check the calendar first thing in the morning.", tags: ["general", "work"], grammarNode: "node-22" },
  { target: "Andan buscando un programador con experiencia en Python.", english: "They're looking for a programmer with experience in Python.", tags: ["general", "work"], grammarNode: "node-22", grammar: "Andar + gerund = to go around doing (ongoing search/activity)." },
]);

// ═══════════════════════════════════════════════════════════════
// NODE 23: Reported Speech (C1)  — 65 → ~100 (+35 cards)
// Covers: dijo que, pregunto si, pidio que + subj,
//         tense shifting, demonstrative shifts
// ═══════════════════════════════════════════════════════════════

addCards([
  // --- general ---
  { target: "Me dijo que no se encontraba bien y que preferia quedarse en casa.", english: "He told me he wasn't feeling well and preferred to stay home.", grammarNode: "node-23", grammar: "Reported speech: present → imperfect (se encuentra → se encontraba)." },
  { target: "Le pregunte si habia visto la pelicula y me dijo que no.", english: "I asked him if he had seen the movie and he said no.", grammarNode: "node-23" },
  { target: "Nos comento que estaba pensando en cambiar de coche.", english: "He mentioned he was thinking about changing cars.", grammarNode: "node-23" },
  { target: "Me aseguro que todo saldria bien al final.", english: "He assured me that everything would work out in the end.", grammarNode: "node-23" },
  { target: "Dijo que habia intentado llamarme pero que no le contestaba.", english: "He said he had tried to call me but I wasn't answering.", grammarNode: "node-23" },
  { target: "Le conte que ya no vivia en aquella ciudad.", english: "I told him I no longer lived in that city.", grammarNode: "node-23", grammar: "Demonstrative shift: esta ciudad → aquella ciudad in reported speech." },
  { target: "Me advirtio que tuviera cuidado con la carretera de noche.", english: "He warned me to be careful on the road at night.", grammarNode: "node-23", grammar: "Indirect command: advirtió que + imperfect subjunctive." },
  { target: "Segun ella, el restaurante era el mejor de la zona.", english: "According to her, the restaurant was the best in the area.", grammarNode: "node-23" },
  { target: "Me prometio que la proxima vez vendria antes.", english: "He promised me that next time he would come earlier.", grammarNode: "node-23" },
  { target: "Le explique que no podia quedarme porque tenia otro compromiso.", english: "I explained to him that I couldn't stay because I had another engagement.", grammarNode: "node-23" },
  { target: "Reconocio que se habia equivocado al tomar esa decision.", english: "He admitted he had been wrong to make that decision.", grammarNode: "node-23" },
  // --- travel ---
  { target: "El guia nos dijo que el museo cerraba a las cinco.", english: "The guide told us the museum closed at five.", tags: ["general", "travel"], grammarNode: "node-23" },
  { target: "Me informaron de que el vuelo se habia retrasado dos horas.", english: "They informed me that the flight had been delayed two hours.", tags: ["general", "travel"], grammarNode: "node-23" },
  { target: "Nos recomendo que probaramos los tacos de ese puesto.", english: "He recommended we try the tacos from that stall.", tags: ["general", "travel"], grammarNode: "node-23" },
  { target: "Preguntamos si habia habitaciones disponibles y nos dijeron que no.", english: "We asked if there were rooms available and they told us no.", tags: ["general", "travel"], grammarNode: "node-23" },
  { target: "El taxista me conto que llevaba veinte anos conduciendo.", english: "The taxi driver told me he'd been driving for twenty years.", tags: ["general", "travel"], grammarNode: "node-23" },
  { target: "Le dije al recepcionista que necesitaba una habitacion con vistas al mar.", english: "I told the receptionist I needed a room with a sea view.", tags: ["general", "travel"], grammarNode: "node-23" },
  { target: "Segun el camarero, aquel plato era la especialidad de la casa.", english: "According to the waiter, that dish was the house specialty.", tags: ["general", "travel"], grammarNode: "node-23" },
  { target: "Nos avisaron de que ibamos a llegar tarde si no saliamos ya.", english: "They warned us we would arrive late if we didn't leave right away.", tags: ["general", "travel"], grammarNode: "node-23" },
  // --- family ---
  { target: "Mi madre me dijo que mi hermano habia llamado mientras estaba fuera.", english: "My mother told me my brother had called while I was out.", tags: ["general", "family"], grammarNode: "node-23" },
  { target: "Mi padre me pregunto si iba a llevar a los ninos al parque.", english: "My father asked me if I was going to take the kids to the park.", tags: ["general", "family"], grammarNode: "node-23" },
  { target: "Mi abuela siempre decia que la paciencia era la madre de la ciencia.", english: "My grandmother always said that patience was the mother of science.", tags: ["general", "family"], grammarNode: "node-23" },
  { target: "Me pidio que le comprara pan de camino a casa.", english: "She asked me to buy bread on the way home.", tags: ["general", "family"], grammarNode: "node-23" },
  { target: "Mi tia nos conto que de joven habia vivido en Argentina.", english: "My aunt told us she had lived in Argentina when she was young.", tags: ["general", "family"], grammarNode: "node-23" },
  { target: "Les prometi a mis hijos que iriamos al zoo el fin de semana.", english: "I promised my children we would go to the zoo on the weekend.", tags: ["general", "family"], grammarNode: "node-23" },
  // --- work ---
  { target: "La directora anuncio que habria cambios importantes en la empresa.", english: "The director announced there would be important changes in the company.", tags: ["general", "work"], grammarNode: "node-23" },
  { target: "Mi companero me comento que estaba buscando otro trabajo.", english: "My colleague told me he was looking for another job.", tags: ["general", "work"], grammarNode: "node-23" },
  { target: "El cliente nos dijo que no estaba satisfecho con el servicio.", english: "The client told us he wasn't satisfied with the service.", tags: ["general", "work"], grammarNode: "node-23" },
  { target: "Me informaron de que la reunion se habia adelantado al martes.", english: "They informed me the meeting had been moved up to Tuesday.", tags: ["general", "work"], grammarNode: "node-23" },
  { target: "Le sugerimos que revisara los numeros antes de presentarlos.", english: "We suggested he review the numbers before presenting them.", tags: ["general", "work"], grammarNode: "node-23" },
  { target: "El jefe nos pregunto si habiamos terminado el informe mensual.", english: "The boss asked us if we had finished the monthly report.", tags: ["general", "work"], grammarNode: "node-23" },
  { target: "Segun recursos humanos, las vacaciones empezaban el dia quince.", english: "According to HR, the vacation started on the fifteenth.", tags: ["general", "work"], grammarNode: "node-23" },
  { target: "Me pidio que le reenviara el correo con las cifras actualizadas.", english: "She asked me to forward the email with the updated figures.", tags: ["general", "work"], grammarNode: "node-23" },
]);

// ═══════════════════════════════════════════════════════════════
// NODE 24: Register & Style (C2)  — 63 → ~105 (+42 cards)
// Covers: cabe + inf, de haber + participle, future of probability,
//         academic discourse markers, pretérito anterior patterns
// ═══════════════════════════════════════════════════════════════

addCards([
  // --- general ---
  { target: "Cabe senalar que estos datos no han sido verificados.", english: "It should be noted that this data has not been verified.", grammarNode: "node-24", grammar: "Cabe + infinitive = it is fitting/appropriate to (formal register)." },
  { target: "De no haber sido por tu ayuda, no lo habria conseguido.", english: "Had it not been for your help, I wouldn't have made it.", grammarNode: "node-24", grammar: "De no haber + participle: formal alternative to si no hubiera." },
  { target: "Seran las tres de la tarde, mas o menos.", english: "It must be around three in the afternoon.", grammarNode: "node-24", grammar: "Future tense for probability/conjecture about the present." },
  { target: "Habra que esperar a que nos confirmen la fecha exacta.", english: "It will be necessary to wait until they confirm the exact date for us.", grammarNode: "node-24" },
  { target: "Dicho esto, pasemos al siguiente punto del orden del dia.", english: "That said, let's move on to the next item on the agenda.", grammarNode: "node-24" },
  { target: "Conviene recordar que no siempre fue asi.", english: "It's worth remembering that it wasn't always like this.", grammarNode: "node-24" },
  { target: "No en vano se le considera uno de los mejores del pais.", english: "Not for nothing is he considered one of the best in the country.", grammarNode: "node-24" },
  { target: "Habria que analizar el asunto con mas detenimiento.", english: "The matter should be analyzed more carefully.", grammarNode: "node-24", grammar: "Habría que + infinitive = one should (impersonal, formal)." },
  { target: "En lo que respecta a la calidad, no hay queja alguna.", english: "As far as quality is concerned, there is no complaint whatsoever.", grammarNode: "node-24" },
  { target: "Bien es cierto que los resultados podrian haber sido mejores.", english: "It is certainly true that the results could have been better.", grammarNode: "node-24" },
  { target: "Estara cansado despues de tantas horas de viaje.", english: "He must be tired after so many hours of travel.", grammarNode: "node-24" },
  { target: "No seria descabellado pensar que hay otra explicacion.", english: "It wouldn't be far-fetched to think there's another explanation.", grammarNode: "node-24" },
  { target: "Huelga decir que la puntualidad es fundamental.", english: "It goes without saying that punctuality is essential.", grammarNode: "node-24", grammar: "Huelga decir que = it goes without saying that (very formal)." },
  // --- travel ---
  { target: "Cabe mencionar que la catedral data del siglo quince.", english: "It's worth mentioning that the cathedral dates from the fifteenth century.", tags: ["general", "travel"], grammarNode: "node-24" },
  { target: "De haber llegado antes, habriamos conseguido mejores asientos.", english: "Had we arrived earlier, we would have gotten better seats.", tags: ["general", "travel"], grammarNode: "node-24" },
  { target: "Tendran unos treinta grados en la costa esta semana.", english: "It must be about thirty degrees on the coast this week.", tags: ["general", "travel"], grammarNode: "node-24" },
  { target: "Conviene senalar que el acceso al monumento es gratuito los domingos.", english: "It's worth noting that access to the monument is free on Sundays.", tags: ["general", "travel"], grammarNode: "node-24" },
  { target: "Habra unas cien personas esperando en la cola del museo.", english: "There must be about a hundred people waiting in line at the museum.", tags: ["general", "travel"], grammarNode: "node-24" },
  { target: "En lo que a gastronomia se refiere, la region es excepcional.", english: "As far as gastronomy is concerned, the region is exceptional.", tags: ["general", "travel"], grammarNode: "node-24" },
  { target: "De no haber reservado con antelacion, nos habriamos quedado sin hotel.", english: "Had we not booked in advance, we would have been left without a hotel.", tags: ["general", "travel"], grammarNode: "node-24" },
  // --- family ---
  { target: "Habra cumplido sesenta anos ya, si no me equivoco.", english: "He must have turned sixty by now, if I'm not mistaken.", tags: ["general", "family"], grammarNode: "node-24" },
  { target: "De haber sabido que venias, habria preparado mas comida.", english: "Had I known you were coming, I would have prepared more food.", tags: ["general", "family"], grammarNode: "node-24" },
  { target: "Bien es cierto que mi abuelo siempre tuvo razon en estas cosas.", english: "It's certainly true that my grandfather was always right about these things.", tags: ["general", "family"], grammarNode: "node-24" },
  { target: "Cabe destacar el esfuerzo que hizo toda la familia durante aquellos anos.", english: "The effort the whole family made during those years is worth highlighting.", tags: ["general", "family"], grammarNode: "node-24" },
  { target: "Sera la una; los ninos ya deberian estar en el colegio.", english: "It must be one o'clock; the children should already be at school.", tags: ["general", "family"], grammarNode: "node-24" },
  { target: "No seria justo que los demas carguen con toda la responsabilidad.", english: "It wouldn't be fair for the others to bear all the responsibility.", tags: ["general", "family"], grammarNode: "node-24" },
  { target: "Conviene que los mas pequenos se acuesten a una hora razonable.", english: "It's advisable that the little ones go to bed at a reasonable time.", tags: ["general", "family"], grammarNode: "node-24" },
  // --- work ---
  { target: "Cabe senalar que el presupuesto fue aprobado por unanimidad.", english: "It should be noted that the budget was approved unanimously.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "En lo que respecta al rendimiento del equipo, los datos son alentadores.", english: "As far as team performance is concerned, the data is encouraging.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "Habria que reconsiderar la estrategia antes de invertir mas recursos.", english: "The strategy should be reconsidered before investing more resources.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "De haber actuado antes, habriamos evitado estas perdidas.", english: "Had we acted sooner, we would have avoided these losses.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "Huelga decir que la confidencialidad es prioritaria en este asunto.", english: "It goes without saying that confidentiality is a priority in this matter.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "Dicho lo cual, pasamos a tratar el tema de la reestructuracion.", english: "That being said, let's move on to the topic of restructuring.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "Conviene tener en cuenta que los plazos son inamovibles.", english: "It's important to keep in mind that the deadlines are non-negotiable.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "No en vano ha sido el departamento con mejores resultados este trimestre.", english: "Not for nothing has it been the department with the best results this quarter.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "Sera conveniente que presentemos las cifras antes de la junta.", english: "It would be advisable for us to present the figures before the board meeting.", tags: ["general", "work"], grammarNode: "node-24" },
  { target: "De no mediar inconveniente, la firma se realizaria el jueves.", english: "Barring any issues, the signing would take place on Thursday.", tags: ["general", "work"], grammarNode: "node-24", grammar: "De no mediar = barring / if there are no (very formal legal/business register)." },
]);

// ═══════════════════════════════════════════════════════════════
// NODE 25: Idiomatic Fluency (C2)  — 73 → ~105 (+32 cards)
// Covers: proverbs, body part idioms, colloquial expressions,
//         figurative language, common fixed phrases
// ═══════════════════════════════════════════════════════════════

addCards([
  // --- general ---
  { target: "Al mal tiempo, buena cara.", english: "When life gives you lemons, make lemonade.", grammarNode: "node-25", grammar: "Proverb: literally 'in bad weather, a good face' — stay positive." },
  { target: "Eso me suena a chino.", english: "That's all Greek to me.", grammarNode: "node-25" },
  { target: "No tiene ni pies ni cabeza lo que estas diciendo.", english: "What you're saying makes no sense at all.", grammarNode: "node-25", grammar: "No tener ni pies ni cabeza = to make no sense (literally: no feet or head)." },
  { target: "Le dio en el clavo con su analisis de la situacion.", english: "He hit the nail on the head with his analysis of the situation.", grammarNode: "node-25" },
  { target: "No hay que darle mas vueltas; la decision esta tomada.", english: "There's no point overthinking it; the decision is made.", grammarNode: "node-25" },
  { target: "Se me fue el santo al cielo y olvide la cita.", english: "I completely forgot and missed the appointment.", grammarNode: "node-25", grammar: "Irse el santo al cielo = to completely forget what you were doing." },
  { target: "A palabras necias, oidos sordos.", english: "Turn a deaf ear to foolish words.", grammarNode: "node-25" },
  { target: "Cada maestrillo tiene su librillo.", english: "Everyone has their own way of doing things.", grammarNode: "node-25" },
  { target: "No todo lo que brilla es oro.", english: "Not everything that glitters is gold.", grammarNode: "node-25" },
  { target: "Llueve sobre mojado; ya teniamos bastantes problemas.", english: "It never rains but it pours; we already had enough problems.", grammarNode: "node-25", grammar: "Llover sobre mojado = when bad things pile up on existing problems." },
  // --- travel ---
  { target: "Este sitio esta en el quinto pino; tardamos una hora en llegar.", english: "This place is in the middle of nowhere; it took us an hour to get there.", tags: ["general", "travel"], grammarNode: "node-25", grammar: "Estar en el quinto pino = to be very far away / in the middle of nowhere." },
  { target: "Nos tomamos las vacaciones a pecho y no hicimos nada en todo el dia.", english: "We took the vacation seriously and did nothing all day.", tags: ["general", "travel"], grammarNode: "node-25" },
  { target: "Fuimos con el agua al cuello para pillar el ultimo vuelo.", english: "We were really pressed to catch the last flight.", tags: ["general", "travel"], grammarNode: "node-25" },
  { target: "El viaje fue pan comido; todo salio a las mil maravillas.", english: "The trip was a piece of cake; everything went wonderfully.", tags: ["general", "travel"], grammarNode: "node-25" },
  { target: "Cuando vi las montanas me quede con la boca abierta.", english: "When I saw the mountains I was left speechless.", tags: ["general", "travel"], grammarNode: "node-25" },
  { target: "Habia gato encerrado con la oferta del hotel tan barato.", english: "There was something fishy about the hotel deal being so cheap.", tags: ["general", "travel"], grammarNode: "node-25" },
  { target: "Le echamos un ojo al mapa y nos pusimos en marcha.", english: "We took a look at the map and set off.", tags: ["general", "travel"], grammarNode: "node-25" },
  // --- family ---
  { target: "De tal palo, tal astilla; el hijo es identico al padre.", english: "Like father, like son; the son is identical to the father.", tags: ["general", "family"], grammarNode: "node-25", grammar: "De tal palo, tal astilla = the apple doesn't fall far from the tree." },
  { target: "Mi hermana tiene mucha mano izquierda para resolver conflictos.", english: "My sister is very tactful at resolving conflicts.", tags: ["general", "family"], grammarNode: "node-25" },
  { target: "Aqui no se casa nadie; cada uno va a su bola.", english: "Nobody commits here; everyone does their own thing.", tags: ["general", "family"], grammarNode: "node-25" },
  { target: "Mi madre me echo un rapapolvo por llegar tarde a cenar.", english: "My mother gave me a telling off for arriving late for dinner.", tags: ["general", "family"], grammarNode: "node-25" },
  { target: "Eramos una y carne; haciamos todo juntas.", english: "We were inseparable; we did everything together.", tags: ["general", "family"], grammarNode: "node-25" },
  { target: "Mi primo siempre esta en las nubes; nunca se entera de nada.", english: "My cousin always has his head in the clouds; he never knows what's going on.", tags: ["general", "family"], grammarNode: "node-25" },
  // --- work ---
  { target: "El nuevo proyecto es coser y cantar si nos organizamos bien.", english: "The new project is a breeze if we organize well.", tags: ["general", "work"], grammarNode: "node-25", grammar: "Ser coser y cantar = to be very easy / a piece of cake." },
  { target: "Me pillo el toro y no pude entregar el informe a tiempo.", english: "I got caught off guard and couldn't deliver the report on time.", tags: ["general", "work"], grammarNode: "node-25" },
  { target: "Vamos a ir al grano y no perdamos mas el tiempo.", english: "Let's get to the point and stop wasting time.", tags: ["general", "work"], grammarNode: "node-25" },
  { target: "El jefe nos dio carta blanca para redisenar la pagina web.", english: "The boss gave us carte blanche to redesign the website.", tags: ["general", "work"], grammarNode: "node-25" },
  { target: "Se quedo de piedra cuando le dijeron que lo habian ascendido.", english: "He was stunned when they told him he had been promoted.", tags: ["general", "work"], grammarNode: "node-25" },
  { target: "No me ando con rodeos: necesitamos mas personal.", english: "I don't beat around the bush: we need more staff.", tags: ["general", "work"], grammarNode: "node-25" },
  { target: "Esa propuesta tiene mucha tela que cortar.", english: "That proposal is a lot to unpack.", tags: ["general", "work"], grammarNode: "node-25", grammar: "Tener tela que cortar = to have a lot to discuss / be complex." },
  { target: "A buen entendedor, pocas palabras bastan.", english: "A word to the wise is sufficient.", tags: ["general", "work"], grammarNode: "node-25" },
]);

// ═══════════════════════════════════════════════════════════════
// NODE 26: Complex Syntax (C2)  — 51 → ~100 (+49 cards)
// Covers: absolute participial clauses, nominalized infinitives,
//         cleft sentences, comparative correlatives,
//         multiple subordination, complex relative clauses
// ═══════════════════════════════════════════════════════════════

addCards([
  // --- general ---
  { target: "Leido el comunicado, los periodistas empezaron a hacer preguntas.", english: "Once the statement was read, the journalists started asking questions.", grammarNode: "node-26", grammar: "Absolute participial clause: participle + noun = 'once X was done'." },
  { target: "El haber crecido en un pueblo pequeno le dio una vision diferente de la vida.", english: "Having grown up in a small town gave him a different view of life.", grammarNode: "node-26", grammar: "Nominalized infinitive: El haber + participle = 'Having done X'." },
  { target: "Fue precisamente alli donde descubri mi pasion por la pintura.", english: "It was precisely there that I discovered my passion for painting.", grammarNode: "node-26" },
  { target: "Cuanta mas informacion teniamos, mas confusa se volvia la situacion.", english: "The more information we had, the more confusing the situation became.", grammarNode: "node-26", grammar: "Comparative correlative: Cuanto más...más = the more...the more." },
  { target: "No es tanto lo que dijo como la forma en que lo dijo.", english: "It's not so much what he said as the way he said it.", grammarNode: "node-26" },
  { target: "El que no arriesga no gana, o eso dicen.", english: "Nothing ventured, nothing gained, or so they say.", grammarNode: "node-26" },
  { target: "Resulta dificil de creer que haya pasado tanto tiempo.", english: "It's hard to believe that so much time has passed.", grammarNode: "node-26" },
  { target: "Lo que me sorprende no es el resultado sino el proceso que siguieron.", english: "What surprises me isn't the result but the process they followed.", grammarNode: "node-26" },
  { target: "No fue sino despues de mucho pensarlo cuando tome la decision.", english: "It wasn't until after thinking about it a lot that I made the decision.", grammarNode: "node-26", grammar: "Cleft sentence: No fue sino...cuando = It wasn't until...that." },
  { target: "Dichas las palabras de despedida, se dio media vuelta y se fue.", english: "Once the farewell words were spoken, he turned around and left.", grammarNode: "node-26" },
  { target: "Lo importante no es ganar, sino saber perder con dignidad.", english: "The important thing isn't winning, but knowing how to lose with dignity.", grammarNode: "node-26" },
  { target: "Sea cual sea la razon, no justifica lo que hizo.", english: "Whatever the reason may be, it doesn't justify what he did.", grammarNode: "node-26" },
  { target: "Es en los momentos dificiles cuando se conoce a las personas de verdad.", english: "It's in the difficult moments that you truly get to know people.", grammarNode: "node-26" },
  { target: "El no haber estudiado lo suficiente fue lo que le costo el examen.", english: "Not having studied enough was what cost him the exam.", grammarNode: "node-26" },
  { target: "Cuanto menos se lo esperaba, mas sorprendido se quedo.", english: "The less he expected it, the more surprised he was.", grammarNode: "node-26" },
  // --- travel ---
  { target: "Recorridos los principales monumentos, decidimos explorar los barrios menos turisticos.", english: "Having visited the main monuments, we decided to explore the less touristy neighborhoods.", tags: ["general", "travel"], grammarNode: "node-26" },
  { target: "Lo que mas me impresiono no fue la arquitectura sino la luz del atardecer.", english: "What impressed me most wasn't the architecture but the evening light.", tags: ["general", "travel"], grammarNode: "node-26" },
  { target: "Fue alli, en aquel mercado, donde probe por primera vez la comida callejera.", english: "It was there, in that market, where I tried street food for the first time.", tags: ["general", "travel"], grammarNode: "node-26" },
  { target: "Cuanto mas al sur ibamos, mas calor hacia.", english: "The further south we went, the hotter it got.", tags: ["general", "travel"], grammarNode: "node-26" },
  { target: "El haber viajado tanto le permitio entender culturas muy diferentes.", english: "Having traveled so much allowed him to understand very different cultures.", tags: ["general", "travel"], grammarNode: "node-26" },
  { target: "Una vez pasada la frontera, el paisaje cambio por completo.", english: "Once the border was crossed, the landscape changed completely.", tags: ["general", "travel"], grammarNode: "node-26" },
  { target: "No es tanto la distancia lo que cansa como la espera en los aeropuertos.", english: "It's not so much the distance that's tiring as the waiting in airports.", tags: ["general", "travel"], grammarNode: "node-26" },
  { target: "Fue en ese viaje donde aprendi que lo mejor es no planificar demasiado.", english: "It was on that trip that I learned the best thing is not to plan too much.", tags: ["general", "travel"], grammarNode: "node-26" },
  // --- family ---
  { target: "Pasada la tormenta, los ninos salieron a jugar al jardin.", english: "Once the storm passed, the children went out to play in the garden.", tags: ["general", "family"], grammarNode: "node-26" },
  { target: "Lo que mis padres me ensenaron de pequeno es lo que me ha hecho quien soy.", english: "What my parents taught me as a child is what made me who I am.", tags: ["general", "family"], grammarNode: "node-26" },
  { target: "No fue hasta que tuve hijos cuando entendi de verdad a mis padres.", english: "It wasn't until I had children that I truly understood my parents.", tags: ["general", "family"], grammarNode: "node-26" },
  { target: "Cuantos mas anos pasan, mas se parecen los hermanos entre si.", english: "The more years go by, the more the siblings resemble each other.", tags: ["general", "family"], grammarNode: "node-26" },
  { target: "El haber crecido con tantos primos hizo que nunca me sintiera solo.", english: "Having grown up with so many cousins meant I never felt alone.", tags: ["general", "family"], grammarNode: "node-26" },
  { target: "Es en las reuniones familiares donde mas se nota la diferencia de generaciones.", english: "It's at family gatherings where the generational difference is most noticeable.", tags: ["general", "family"], grammarNode: "node-26" },
  { target: "Servida la cena, mi abuelo siempre contaba historias de su juventud.", english: "Once dinner was served, my grandfather always told stories from his youth.", tags: ["general", "family"], grammarNode: "node-26" },
  { target: "Sea lo que sea lo que decidan, los vamos a apoyar.", english: "Whatever they decide, we're going to support them.", tags: ["general", "family"], grammarNode: "node-26" },
  // --- work ---
  { target: "Analizado el problema, el equipo propuso tres soluciones posibles.", english: "Having analyzed the problem, the team proposed three possible solutions.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "Lo que diferencia a esta empresa de las demas es su cultura de innovacion.", english: "What sets this company apart from the others is its culture of innovation.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "No fue sino tras meses de negociacion cuando se firmo el acuerdo.", english: "It wasn't until after months of negotiation that the agreement was signed.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "Cuanto mas se invierte en formacion, mejores son los resultados a largo plazo.", english: "The more you invest in training, the better the long-term results are.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "El haber trabajado en equipo fue clave para el exito del proyecto.", english: "Having worked as a team was key to the project's success.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "Es en las situaciones de crisis donde se demuestra el verdadero liderazgo.", english: "It's in crisis situations where true leadership is demonstrated.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "Firmado el contrato, ambas partes se comprometieron a cumplir los plazos.", english: "Once the contract was signed, both parties committed to meeting the deadlines.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "No es tanto la cantidad de horas trabajadas como la productividad lo que cuenta.", english: "It's not so much the number of hours worked as the productivity that counts.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "Cuanto antes entreguemos el prototipo, antes recibiremos la financiacion.", english: "The sooner we deliver the prototype, the sooner we'll receive the funding.", tags: ["general", "work"], grammarNode: "node-26" },
  { target: "Lo dificil no fue encontrar el error sino convencer al equipo de que existia.", english: "The hard part wasn't finding the error but convincing the team it existed.", tags: ["general", "work"], grammarNode: "node-26" },
]);

// ═══════════════════════════════════════════════════════════════
// Save
// ═══════════════════════════════════════════════════════════════

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));

console.log(`\nDone! Added ${added} new cards (${dupes} duplicates skipped).`);
console.log(`New deck size: ${deck.length} cards\n`);

// Print per-node summary
const nodes = ['node-21','node-22','node-23','node-24','node-25','node-26'];
for (const n of nodes) {
  const count = deck.filter(c => c.grammarNode === n).length;
  console.log(`  ${n}: ${count} cards`);
}
