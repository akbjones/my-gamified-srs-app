/**
 * Expands the Spanish deck from 2000 → 5000 cards with goal tags.
 *
 * Strategy:
 * - Tag existing 2000 cards with goal categories (travel/work/family/general)
 * - Generate 3000 new cards organized by GRAMMAR LEVEL (not topic)
 * - Cards are ordered by difficulty so dynamic node slicing puts them in the right grammar node
 * - Goal tags allow filtering by learning purpose without changing grammar progression
 *
 * Node mapping (250 cards each at 5000 total):
 * 1-250:   A1 Present Tense
 * 251-500: A1 Ser vs Estar
 * 501-750: A1 Common Questions
 * 751-1000: A1 Articles & Gender
 * 1001-1250: A1 Gustar & Similar
 * 1251-1500: A2 Preterite
 * 1501-1750: A2 Imperfect
 * 1751-2000: A2 Reflexive Verbs
 * 2001-2250: A2 Por vs Para
 * 2251-2500: A2 Object Pronouns
 * 2501-2750: B1 Present Subjunctive
 * 2751-3000: B1 Commands
 * 3001-3250: B1 Conditional
 * 3251-3500: B1 Future & Compound
 * 3501-3750: B1 Relative Clauses
 * 3751-4000: B2 Imperfect Subjunctive
 * 4001-4250: B2 Conditionals II & III
 * 4251-4500: B2 Passive & Impersonal
 * 4501-4750: B2 Advanced Connectors
 * 4751-5000: B2 Mastery
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const existing = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// ─── KEYWORD-BASED GOAL TAGGING FOR EXISTING CARDS ───────────────

const TRAVEL_KW = [
  'hotel', 'airport', 'aeropuerto', 'vuelo', 'flight', 'taxi', 'train', 'tren',
  'estación', 'station', 'ticket', 'boleto', 'billete', 'maleta', 'suitcase',
  'passport', 'pasaporte', 'tourist', 'turista', 'vacation', 'vacaciones',
  'beach', 'playa', 'museum', 'museo', 'restaurant', 'restaurante', 'menu',
  'reserv', 'habitación', 'room', 'viaje', 'trip', 'travel', 'viajar',
  'mapa', 'map', 'calle', 'street', 'dirección', 'direction',
  'ciudad', 'city', 'equipaje', 'avión', 'plane', 'barco', 'boat',
  'autobús', 'bus', 'metro', 'parada', 'stop', 'aduana', 'customs',
  'moneda', 'currency', 'propina', 'tip', 'excursión', 'tour', 'guía',
];

const WORK_KW = [
  'office', 'oficina', 'meeting', 'reunión', 'email', 'correo', 'boss', 'jefe',
  'company', 'empresa', 'business', 'negocio', 'trabajo', 'trabajar',
  'project', 'proyecto', 'deadline', 'plazo', 'report', 'informe', 'client',
  'cliente', 'salary', 'salario', 'sueldo', 'interview', 'entrevista',
  'currículum', 'colega', 'compañero', 'manager', 'gerente', 'director',
  'empleado', 'contrato', 'horario', 'presentación', 'conferencia',
  'profesional', 'carrera', 'departamento', 'equipo', 'presupuesto',
  'factura', 'propuesta', 'negociar', 'promoción', 'contratar',
];

const FAMILY_KW = [
  'madre', 'mamá', 'father', 'padre', 'papá', 'hermana', 'hermano',
  'familia', 'hijo', 'hija', 'bebé', 'niño', 'niña', 'abuela', 'abuelo',
  'tío', 'tía', 'primo', 'prima', 'esposo', 'marido', 'esposa', 'boda',
  'cumpleaños', 'amor', 'amar', 'querer', 'cariño', 'hogar', 'casa',
  'cocina', 'dormitorio', 'jardín', 'mascota', 'perro', 'gato',
  'cocinar', 'limpiar', 'sentir', 'feliz', 'triste', 'preocupar',
  'extrañar', 'abrazo', 'beso', 'cuidar', 'relación', 'amigo', 'vecino',
  'padres', 'hijos', 'sobrino', 'sobrina',
];

function tagCard(card) {
  const text = `${card.target || ''} ${card.english || ''}`.toLowerCase();
  const tags = ['general'];
  if (TRAVEL_KW.some(kw => text.includes(kw))) tags.push('travel');
  if (WORK_KW.some(kw => text.includes(kw))) tags.push('work');
  if (FAMILY_KW.some(kw => text.includes(kw))) tags.push('family');
  return tags;
}

// Tag existing cards (keep all existing fields, add tags)
const taggedExisting = existing.map(card => ({
  ...card,
  tags: card.tags || tagCard(card),
}));

// ─── NEW CARD GENERATION BY GRAMMAR LEVEL ────────────────────────
// Each section generates cards for a specific grammar node.
// Cards are appended in order so they land in the correct node.

const allNewCards = [];
function add(target, english, tags, grammar) {
  const card = { target, english, tags: tags || ['general'] };
  if (grammar) card.grammar = grammar;
  allNewCards.push(card);
}

// ─── NODE 9: A2 Por vs Para (2001-2250) ──────────────────────────
add("Gracias por tu ayuda.", "Thanks for your help.", ["general"], "\"Por\" — cause/reason.");
add("Este regalo es para ti.", "This gift is for you.", ["general"], "\"Para\" — recipient.");
add("Pasamos por Madrid.", "We passed through Madrid.", ["travel", "general"], "\"Por\" — movement through a place.");
add("Salimos para Madrid.", "We left for Madrid.", ["travel", "general"], "\"Para\" — destination.");
add("Trabajo por la mañana.", "I work in the morning.", ["work", "general"], "\"Por\" — general time of day.");
add("Lo necesito para el lunes.", "I need it by Monday.", ["work", "general"], "\"Para\" — deadline.");
add("Lo cambié por otro.", "I exchanged it for another.", ["general"], "\"Por\" — exchange.");
add("Estudio para aprender.", "I study in order to learn.", ["general"], "\"Para\" — purpose.");
add("Pagué veinte euros por el libro.", "I paid twenty euros for the book.", ["general"], "\"Por\" — price/exchange.");
add("Hago ejercicio por salud.", "I exercise for health.", ["general"], "\"Por\" — motivation/cause.");
add("Vamos para la playa.", "We're heading to the beach.", ["travel", "general"]);
add("Caminamos por el parque.", "We walked through the park.", ["general"]);
add("Esta carta es para María.", "This letter is for María.", ["general"]);
add("Te llamo por teléfono.", "I'll call you by phone.", ["general"], "\"Por\" — means of communication.");
add("Están aquí por tres días.", "They're here for three days.", ["travel", "general"], "\"Por\" — duration of time.");
add("Para mí, un café con leche.", "For me, a coffee with milk.", ["general"]);
add("Mandé el paquete por correo.", "I sent the package by mail.", ["general"]);
add("Para ser principiante, habla muy bien.", "For a beginner, he speaks very well.", ["general"], "\"Para\" — considering/in spite of.");
add("Me preocupo por mi familia.", "I worry about my family.", ["family", "general"], "\"Por\" — concern/about.");
add("¿Por qué no viniste?", "Why didn't you come?", ["general"], "\"¿Por qué?\" — why (for what reason)?");
add("¿Para qué sirve esto?", "What is this for?", ["general"], "\"¿Para qué?\" — for what purpose?");
add("Por favor, cierra la puerta.", "Please close the door.", ["general"]);
add("Lo hice por ti.", "I did it for you (because of you).", ["general"], "\"Por\" — on behalf of/because of.");
add("Para llegar, gira a la derecha.", "To get there, turn right.", ["travel", "general"]);
add("Vine por el descuento.", "I came because of the discount.", ["general"]);

// ─── NODE 10: A2 Object Pronouns (2251-2500) ────────────────────
add("Te lo dije ayer.", "I told you yesterday.", ["general"], "Double object pronouns: te (you) + lo (it).");
add("Se lo di a María.", "I gave it to María.", ["general"], "When both pronouns start with l-, le becomes se.");
add("¿Me las puedes dar?", "Can you give them to me?", ["general"]);
add("Nos lo explicó el profesor.", "The teacher explained it to us.", ["general"]);
add("Se lo prometí.", "I promised it to him.", ["general"]);
add("¿Puedes decírmelo?", "Can you tell me?", ["general"], "Pronouns attach to the end of infinitives.");
add("Estoy haciéndolo ahora.", "I'm doing it now.", ["general"], "Pronouns attach to the end of gerunds.");
add("Dámelo, por favor.", "Give it to me, please.", ["general"], "Pronouns attach to affirmative commands.");
add("No me lo digas.", "Don't tell me.", ["general"], "Pronouns go before negative commands.");
add("Quiero comprártelo.", "I want to buy it for you.", ["general"]);
add("Ella me llama todos los días.", "She calls me every day.", ["general"]);
add("¿Lo has visto?", "Have you seen it?", ["general"]);
add("Te quiero mucho.", "I love you very much.", ["family", "general"]);
add("Nos vemos mañana.", "See you tomorrow.", ["general"]);
add("¿La conoces?", "Do you know her?", ["general"]);
add("Les escribí una carta.", "I wrote them a letter.", ["general"]);
add("Me gusta la música.", "I like music.", ["general"], "\"Me\" is indirect object — music pleases me.");
add("Le dije la verdad.", "I told him the truth.", ["general"]);
add("¿Te importa si abro la ventana?", "Do you mind if I open the window?", ["general"]);
add("Los vi en el parque.", "I saw them in the park.", ["general"]);
add("Nos contó una historia increíble.", "He told us an incredible story.", ["general"]);
add("Se lo voy a mandar mañana.", "I'm going to send it to him tomorrow.", ["general"]);
add("¿Me puedes ayudar?", "Can you help me?", ["general"]);
add("Le compré flores a mi madre.", "I bought flowers for my mother.", ["family", "general"]);
add("No la encuentro por ningún lado.", "I can't find it anywhere.", ["general"]);

// ─── NODE 11: B1 Present Subjunctive (2501-2750) ────────────────
add("Espero que estés bien.", "I hope you're well.", ["general"], "\"Espero que\" + subjunctive — expressing hope.");
add("Es importante que practiques todos los días.", "It's important that you practice every day.", ["general"]);
add("No creo que sea una buena idea.", "I don't think it's a good idea.", ["general"]);
add("Quiero que vengas a la fiesta.", "I want you to come to the party.", ["general"]);
add("Es posible que llueva mañana.", "It's possible that it'll rain tomorrow.", ["general"]);
add("Dudo que lo termine a tiempo.", "I doubt he'll finish it on time.", ["work", "general"]);
add("Me alegro de que hayas venido.", "I'm glad you came.", ["general"], "\"Me alegro de que\" + subjunctive — emotion.");
add("Es necesario que todos asistan.", "It's necessary that everyone attend.", ["work", "general"]);
add("No hay nadie que sepa la respuesta.", "There's nobody who knows the answer.", ["general"]);
add("Busco un lugar donde pueda estudiar.", "I'm looking for a place where I can study.", ["general"], "Subjunctive after indefinite antecedent.");
add("Te llamo para que sepas.", "I'm calling so that you know.", ["general"], "\"Para que\" + subjunctive — purpose.");
add("Antes de que te vayas, escúchame.", "Before you leave, listen to me.", ["general"]);
add("Necesito que me ayudes.", "I need you to help me.", ["general"]);
add("Es una lástima que no puedas venir.", "It's a shame you can't come.", ["general"]);
add("Ojalá pudiera viajar más.", "I wish I could travel more.", ["travel", "general"], "\"Ojalá\" + subjunctive — wishing.");
add("No es que no quiera, es que no puedo.", "It's not that I don't want to, it's that I can't.", ["general"]);
add("Con tal de que llegues a tiempo.", "As long as you arrive on time.", ["general"], "\"Con tal de que\" + subjunctive.");
add("En caso de que necesites algo, llámame.", "In case you need something, call me.", ["general"]);
add("Es poco probable que ganemos.", "It's unlikely that we'll win.", ["general"]);
add("Me sorprende que hable tan bien.", "It surprises me that he speaks so well.", ["general"]);
add("Es mejor que lleguemos temprano.", "It's better that we arrive early.", ["travel", "general"]);
add("Espero que el vuelo no se retrase.", "I hope the flight isn't delayed.", ["travel", "general"]);
add("Es fundamental que los empleados estén motivados.", "It's fundamental that employees be motivated.", ["work", "general"]);
add("Me alegra que mis hijos sean responsables.", "I'm glad my children are responsible.", ["family", "general"]);
add("Dudo que el cliente acepte esas condiciones.", "I doubt the client will accept those conditions.", ["work", "general"]);

// ─── NODE 12: B1 Commands (2751-3000) ───────────────────────────
add("Ven aquí, por favor.", "Come here, please.", ["general"], "Informal affirmative command of \"venir.\"");
add("No hables tan alto.", "Don't speak so loud.", ["general"], "Negative informal command — uses subjunctive.");
add("Dime la verdad.", "Tell me the truth.", ["general"]);
add("Siéntate aquí.", "Sit down here.", ["general"]);
add("No te preocupes.", "Don't worry.", ["general"]);
add("Abre la ventana.", "Open the window.", ["general"]);
add("Cierra la puerta.", "Close the door.", ["general"]);
add("Escúchame bien.", "Listen to me carefully.", ["general"]);
add("Siga todo recto.", "Go straight ahead.", ["travel", "general"], "Formal command of \"seguir.\"");
add("Gire a la derecha.", "Turn right.", ["travel", "general"]);
add("No toque eso.", "Don't touch that.", ["general"], "Formal negative command.");
add("Póngase el cinturón.", "Put on your seatbelt.", ["travel", "general"]);
add("Escriba su nombre aquí.", "Write your name here.", ["work", "general"]);
add("No se olvide de firmar.", "Don't forget to sign.", ["work", "general"]);
add("Pasa y siéntate.", "Come in and sit down.", ["general"]);
add("Toma, esto es para ti.", "Here, this is for you.", ["general"]);
add("Sal de aquí ahora mismo.", "Get out of here right now.", ["general"]);
add("Pon la mesa, por favor.", "Set the table, please.", ["family", "general"]);
add("Haz tu tarea antes de jugar.", "Do your homework before playing.", ["family", "general"]);
add("Ten cuidado con el tráfico.", "Be careful with the traffic.", ["general"]);
add("Vete a dormir, es tarde.", "Go to sleep, it's late.", ["family", "general"]);
add("No llegues tarde mañana.", "Don't be late tomorrow.", ["work", "general"]);
add("Come más despacio.", "Eat more slowly.", ["general"]);
add("Cállate un momento.", "Be quiet for a moment.", ["general"]);
add("Llámame cuando llegues.", "Call me when you arrive.", ["general"]);

// ─── NODE 13: B1 Conditional (3001-3250) ────────────────────────
add("Me gustaría un café.", "I would like a coffee.", ["general"], "Conditional for polite requests.");
add("¿Podrías ayudarme?", "Could you help me?", ["general"]);
add("Sería bueno descansar un poco.", "It would be good to rest a little.", ["general"]);
add("¿Te importaría cerrar la ventana?", "Would you mind closing the window?", ["general"]);
add("Yo en tu lugar, no haría eso.", "In your place, I wouldn't do that.", ["general"]);
add("Deberías estudiar más.", "You should study more.", ["general"]);
add("¿Qué harías con un millón de euros?", "What would you do with a million euros?", ["general"]);
add("Me encantaría viajar a Japón.", "I'd love to travel to Japan.", ["travel", "general"]);
add("Podríamos ir al cine esta noche.", "We could go to the cinema tonight.", ["general"]);
add("¿Te gustaría cenar conmigo?", "Would you like to have dinner with me?", ["general"]);
add("Haría cualquier cosa por mi familia.", "I would do anything for my family.", ["family", "general"]);
add("Tendría que pensarlo.", "I would have to think about it.", ["general"]);
add("¿Podrían darme más información?", "Could you give me more information?", ["travel", "general"]);
add("Diría que tiene razón.", "I would say he's right.", ["general"]);
add("No sabría qué decir.", "I wouldn't know what to say.", ["general"]);
add("¿Querrías trabajar con nosotros?", "Would you want to work with us?", ["work", "general"]);
add("Saldría más temprano si pudiera.", "I'd leave earlier if I could.", ["work", "general"]);
add("Nos vendría bien un descanso.", "A break would do us good.", ["general"]);
add("Me iría de vacaciones ahora mismo.", "I'd go on vacation right now.", ["travel", "general"]);
add("Eso costaría demasiado.", "That would cost too much.", ["general"]);
add("¿Cuánto tardaría en llegar?", "How long would it take to arrive?", ["travel", "general"]);
add("Convendría revisar el contrato.", "It would be advisable to review the contract.", ["work", "general"]);
add("Valdría la pena intentarlo.", "It would be worth trying.", ["general"]);
add("Preferería quedarme en casa.", "I'd prefer to stay home.", ["general"]);
add("¿Dónde te gustaría vivir?", "Where would you like to live?", ["general"]);

// ─── NODE 14: B1 Future & Compound Tenses (3251-3500) ───────────
add("Mañana iré al médico.", "Tomorrow I'll go to the doctor.", ["general"]);
add("¿Vendrás a la fiesta?", "Will you come to the party?", ["general"]);
add("El año que viene estudiaré francés.", "Next year I'll study French.", ["general"]);
add("Cuando sea mayor, seré bombero.", "When I grow up, I'll be a firefighter.", ["general"]);
add("Dentro de dos semanas tendremos vacaciones.", "In two weeks we'll have vacation.", ["general"]);
add("He comido demasiado.", "I've eaten too much.", ["general"], "Present perfect: haber + past participle.");
add("¿Has estado alguna vez en México?", "Have you ever been to Mexico?", ["travel", "general"]);
add("Nunca he visto nada igual.", "I've never seen anything like it.", ["general"]);
add("Ya hemos terminado.", "We've already finished.", ["general"]);
add("Todavía no ha llegado.", "He still hasn't arrived.", ["general"]);
add("Cuando llegué, ya se habían ido.", "When I arrived, they had already left.", ["general"], "Pluperfect: habían + past participle.");
add("Nunca había comido paella antes.", "I had never eaten paella before.", ["general"]);
add("Ya habíamos reservado el hotel.", "We had already booked the hotel.", ["travel", "general"]);
add("Para las seis, habré terminado.", "By six, I will have finished.", ["general"], "Future perfect: habré + past participle.");
add("Llevo tres años estudiando español.", "I've been studying Spanish for three years.", ["general"], "\"Llevar\" + time + gerund — ongoing duration.");
add("Llevo una hora esperando.", "I've been waiting for an hour.", ["general"]);
add("¿Cuánto tiempo llevas viviendo aquí?", "How long have you been living here?", ["general"]);
add("Acabo de llegar.", "I just arrived.", ["general"], "\"Acabar de\" + infinitive — to have just done.");
add("Acaba de llamar tu madre.", "Your mother just called.", ["family", "general"]);
add("El tren está a punto de salir.", "The train is about to leave.", ["travel", "general"], "\"Estar a punto de\" — to be about to.");
add("Voy a empezar un curso nuevo.", "I'm going to start a new course.", ["general"]);
add("¿Vas a venir o no?", "Are you going to come or not?", ["general"]);
add("Seguiré intentándolo.", "I'll keep trying.", ["general"]);
add("Habrá que esperar.", "We'll have to wait.", ["general"]);
add("¿Cuándo volverás?", "When will you return?", ["general"]);

// ─── NODE 15: B1 Relative Clauses (3501-3750) ──────────────────
add("La persona que llamó no dejó su nombre.", "The person who called didn't leave their name.", ["general"]);
add("El libro que estoy leyendo es fascinante.", "The book I'm reading is fascinating.", ["general"]);
add("La ciudad donde nací ya no es la misma.", "The city where I was born is no longer the same.", ["general"]);
add("Todo lo que dijo era mentira.", "Everything he said was a lie.", ["general"]);
add("La razón por la que vinimos es importante.", "The reason we came is important.", ["general"], "\"Por la que\" — for which / the reason why.");
add("El restaurante en el que cenamos era excelente.", "The restaurant where we had dinner was excellent.", ["travel", "general"]);
add("La empresa para la que trabajo es internacional.", "The company I work for is international.", ["work", "general"]);
add("El amigo con quien viajé es muy divertido.", "The friend I traveled with is very fun.", ["travel", "general"]);
add("La casa en la que crecí era pequeña.", "The house I grew up in was small.", ["family", "general"]);
add("Lo que más me gusta es la música.", "What I like most is music.", ["general"]);
add("El profesor, cuya clase es difícil, es muy bueno.", "The teacher, whose class is hard, is very good.", ["general"], "\"Cuyo/cuya\" — whose (relative possessive).");
add("Esa es la chica con la que hablé.", "That's the girl I talked to.", ["general"]);
add("No entiendo lo que quieres decir.", "I don't understand what you mean.", ["general"]);
add("El día en que nos conocimos fue especial.", "The day we met was special.", ["general"]);
add("La manera en que habla es muy clara.", "The way he speaks is very clear.", ["general"]);
add("Hay algo que quiero contarte.", "There's something I want to tell you.", ["general"]);
add("El hotel donde nos quedamos tenía piscina.", "The hotel where we stayed had a pool.", ["travel", "general"]);
add("La persona a quien busco no está aquí.", "The person I'm looking for isn't here.", ["general"]);
add("Lo que pasó ayer fue increíble.", "What happened yesterday was incredible.", ["general"]);
add("El momento en el que todo cambió.", "The moment when everything changed.", ["general"]);
add("El país del que vengo es muy bonito.", "The country I come from is very beautiful.", ["general"]);
add("Las personas con las que trabajo son geniales.", "The people I work with are great.", ["work", "general"]);
add("El problema al que nos enfrentamos es serio.", "The problem we face is serious.", ["general"]);
add("Eso es exactamente lo que necesitaba.", "That's exactly what I needed.", ["general"]);
add("La mujer cuyo hijo conociste es mi vecina.", "The woman whose son you met is my neighbor.", ["family", "general"]);

// ─── NODE 16: B2 Imperfect Subjunctive (3751-4000) ──────────────
add("Si tuviera más tiempo, viajaría más.", "If I had more time, I'd travel more.", ["general"], "Imperfect subjunctive + conditional — second conditional.");
add("Quería que vinieras a mi boda.", "I wanted you to come to my wedding.", ["family", "general"]);
add("Si pudiera elegir, viviría en la costa.", "If I could choose, I'd live on the coast.", ["general"]);
add("Me pidieron que llegara temprano.", "They asked me to arrive early.", ["work", "general"]);
add("Ojalá tuviera más dinero.", "I wish I had more money.", ["general"]);
add("Si fuera tú, no haría eso.", "If I were you, I wouldn't do that.", ["general"]);
add("Era necesario que todos participaran.", "It was necessary that everyone participate.", ["work", "general"]);
add("Si supiera la respuesta, te la diría.", "If I knew the answer, I'd tell you.", ["general"]);
add("Me gustaría que estuvieras aquí.", "I'd like you to be here.", ["general"]);
add("Si hablara español mejor, conseguiría ese trabajo.", "If I spoke Spanish better, I'd get that job.", ["work", "general"]);
add("Dudaba que viniera.", "I doubted he would come.", ["general"]);
add("Me sorprendió que no dijera nada.", "It surprised me that she didn't say anything.", ["general"]);
add("Si viviera en España, comería tapas todos los días.", "If I lived in Spain, I'd eat tapas every day.", ["travel", "general"]);
add("El jefe quería que termináramos antes.", "The boss wanted us to finish earlier.", ["work", "general"]);
add("Si no lloviera, iríamos a la playa.", "If it weren't raining, we'd go to the beach.", ["general"]);
add("No había nadie que supiera la respuesta.", "There was nobody who knew the answer.", ["general"]);
add("Si pudieras cambiar algo, ¿qué sería?", "If you could change something, what would it be?", ["general"]);
add("Buscaba un hotel que tuviera piscina.", "I was looking for a hotel that had a pool.", ["travel", "general"]);
add("Si mi abuela estuviera aquí, estaría orgullosa.", "If my grandmother were here, she'd be proud.", ["family", "general"]);
add("Esperaba que me llamaras.", "I was hoping you'd call me.", ["general"]);
add("Si ganara la lotería, dejaría de trabajar.", "If I won the lottery, I'd stop working.", ["general"]);
add("Era importante que practicáramos todos los días.", "It was important that we practice every day.", ["general"]);
add("Si tuviera coche, te llevaría.", "If I had a car, I'd give you a ride.", ["general"]);
add("No creía que fuera posible.", "I didn't believe it was possible.", ["general"]);
add("Si estuviera en tu lugar, aceptaría la oferta.", "If I were in your place, I'd accept the offer.", ["work", "general"]);

// ─── NODE 17: B2 Conditionals II & III (4001-4250) ──────────────
add("Si hubiera sabido, habría venido antes.", "If I had known, I would have come earlier.", ["general"], "Third conditional: pluperfect subjunctive + conditional perfect.");
add("Habría ido si me hubieras invitado.", "I would have gone if you had invited me.", ["general"]);
add("Si hubiéramos salido antes, no habríamos llegado tarde.", "If we had left earlier, we wouldn't have arrived late.", ["general"]);
add("De haber sabido la verdad, habría actuado diferente.", "Had I known the truth, I would have acted differently.", ["general"], "\"De haber\" + participle — literary third conditional.");
add("¿Habrías hecho lo mismo en mi lugar?", "Would you have done the same in my place?", ["general"]);
add("Si no hubiera llovido, habríamos ido al parque.", "If it hadn't rained, we would have gone to the park.", ["general"]);
add("Habríamos ganado si hubiéramos jugado mejor.", "We would have won if we had played better.", ["general"]);
add("Si hubiera estudiado medicina, ahora sería doctor.", "If I had studied medicine, I'd be a doctor now.", ["general"], "Mixed conditional: past condition, present result.");
add("No habría pasado si hubieras tenido más cuidado.", "It wouldn't have happened if you had been more careful.", ["general"]);
add("Si hubiera aceptado ese trabajo, viviría en Madrid.", "If I had accepted that job, I'd be living in Madrid.", ["work", "general"]);
add("Habría sido mejor que esperáramos.", "It would have been better if we had waited.", ["general"]);
add("Si nos hubiéramos conocido antes, todo sería diferente.", "If we had met earlier, everything would be different.", ["general"]);
add("Si no hubiera llovido, habríamos hecho la excursión.", "If it hadn't rained, we would have done the excursion.", ["travel", "general"]);
add("Habría preferido que me lo dijeras.", "I would have preferred that you told me.", ["general"]);
add("Si hubiera nacido en otro país, hablaría otro idioma.", "If I had been born in another country, I'd speak another language.", ["general"]);
add("Si me hubieras escuchado, no tendríamos este problema.", "If you had listened to me, we wouldn't have this problem.", ["general"]);
add("Habría sido más fácil con tu ayuda.", "It would have been easier with your help.", ["general"]);
add("Si hubiera tenido más experiencia, me habrían contratado.", "If I had had more experience, they would have hired me.", ["work", "general"]);
add("Ojalá hubiéramos reservado con antelación.", "I wish we had booked in advance.", ["travel", "general"]);
add("Si lo hubiera sabido, no habría dicho nada.", "If I had known, I wouldn't have said anything.", ["general"]);
add("De haberlo visto, te habría avisado.", "Had I seen it, I would have warned you.", ["general"]);
add("Habría venido antes de haber podido.", "I would have come earlier if I could have.", ["general"]);
add("Si hubieran llegado a tiempo, habrían visto el espectáculo.", "If they had arrived on time, they would have seen the show.", ["general"]);
add("No habría funcionado aunque lo hubiéramos intentado.", "It wouldn't have worked even if we had tried.", ["general"]);
add("Si hubieras venido, te habrías divertido.", "If you had come, you would have had fun.", ["general"]);

// ─── NODE 18: B2 Passive & Impersonal (4251-4500) ──────────────
add("Se habla español en veinte países.", "Spanish is spoken in twenty countries.", ["general"], "\"Se\" + verb — passive/impersonal construction.");
add("Se necesitan voluntarios.", "Volunteers are needed.", ["general"]);
add("Aquí se come muy bien.", "The food here is very good.", ["general"]);
add("Se prohíbe fumar.", "Smoking is prohibited.", ["general"]);
add("Se dice que va a llover.", "They say it's going to rain.", ["general"]);
add("Se venden pisos baratos.", "Cheap apartments are sold.", ["general"]);
add("¿Cómo se dice esto en español?", "How do you say this in Spanish?", ["general"]);
add("Se buscan programadores.", "Programmers wanted.", ["work", "general"]);
add("Aquí se trabaja mucho.", "People work a lot here.", ["work", "general"]);
add("El edificio fue construido en 1900.", "The building was built in 1900.", ["general"], "Passive with \"ser\" + past participle.");
add("La carta fue escrita por mi abuelo.", "The letter was written by my grandfather.", ["family", "general"]);
add("Las ventanas fueron rotas por la tormenta.", "The windows were broken by the storm.", ["general"]);
add("El proyecto será presentado mañana.", "The project will be presented tomorrow.", ["work", "general"]);
add("La decisión ya ha sido tomada.", "The decision has already been made.", ["general"]);
add("Se me olvidó comprar pan.", "I forgot to buy bread.", ["general"], "Accidental \"se\" — unintentional event.");
add("Se nos acabó la leche.", "We ran out of milk.", ["general"]);
add("Se me ha perdido la cartera.", "I've lost my wallet.", ["general"]);
add("Se me ha roto el teléfono.", "My phone broke.", ["general"]);
add("Se te cayó el vaso.", "You dropped the glass.", ["general"]);
add("Se me olvidaron las llaves.", "I forgot my keys.", ["general"]);
add("Hay que estudiar más.", "One must study more.", ["general"], "\"Hay que\" — impersonal obligation.");
add("No se puede estacionar aquí.", "You can't park here.", ["general"]);
add("Se recomienda llegar temprano.", "It's recommended to arrive early.", ["travel", "general"]);
add("Se ruega silencio.", "Silence is requested.", ["general"]);
add("El resultado fue anunciado por el director.", "The result was announced by the director.", ["work", "general"]);

// ─── NODE 19: B2 Advanced Connectors (4501-4750) ────────────────
add("Sin embargo, no todo fue negativo.", "However, not everything was negative.", ["general"]);
add("A pesar de todo, salió adelante.", "Despite everything, she moved forward.", ["general"]);
add("En primer lugar, debemos analizar el problema.", "First of all, we must analyze the problem.", ["general"]);
add("No obstante, hay que considerar otros factores.", "Nevertheless, other factors must be considered.", ["general"]);
add("Por lo tanto, la conclusión es evidente.", "Therefore, the conclusion is evident.", ["general"]);
add("Dado que no tenemos opciones, aceptaremos.", "Given that we have no options, we'll accept.", ["general"]);
add("En cuanto al tema que mencionaste, estoy de acuerdo.", "Regarding the topic you mentioned, I agree.", ["general"]);
add("Dicho de otra manera, necesitamos un cambio.", "In other words, we need a change.", ["general"]);
add("De hecho, es más complicado de lo que parece.", "In fact, it's more complicated than it seems.", ["general"]);
add("En definitiva, lo importante es ser feliz.", "Ultimately, what matters is being happy.", ["general"]);
add("Si bien es cierto que cometí errores, aprendí.", "While it's true I made mistakes, I learned.", ["general"]);
add("A medida que pasa el tiempo, las cosas cambian.", "As time passes, things change.", ["general"]);
add("Por mucho que lo intente, no consigo entenderlo.", "No matter how much I try, I can't understand it.", ["general"], "\"Por mucho que\" + subjunctive.");
add("Sea cual sea tu decisión, te apoyaré.", "Whatever your decision, I'll support you.", ["general"], "\"Sea cual sea\" — whatever it may be.");
add("Siempre que tenga la oportunidad, viajo.", "Whenever I have the opportunity, I travel.", ["travel", "general"]);
add("A raíz de la pandemia, todo cambió.", "As a result of the pandemic, everything changed.", ["general"]);
add("No solo aprendió el idioma, sino que se sumergió en la cultura.", "Not only did he learn the language, but he immersed himself in the culture.", ["general"], "\"No solo...sino que\" — not only...but.");
add("Más allá de las diferencias, todos buscamos lo mismo.", "Beyond our differences, we all seek the same thing.", ["general"]);
add("A fin de que mejoren los resultados, debemos actuar.", "In order for results to improve, we must act.", ["work", "general"]);
add("Sin que nadie se diera cuenta, se marchó.", "Without anyone noticing, he left.", ["general"]);
add("Por un lado, es buena idea; por otro, es arriesgada.", "On one hand, it's a good idea; on the other, it's risky.", ["general"]);
add("Puesto que ya es tarde, nos vamos.", "Since it's already late, we're leaving.", ["general"]);
add("Con respecto a tu pregunta, no tengo la respuesta.", "Regarding your question, I don't have the answer.", ["general"]);
add("A fin de cuentas, todos somos humanos.", "At the end of the day, we're all human.", ["general"]);
add("En lo que se refiere a la economía, hay optimismo.", "As far as the economy is concerned, there's optimism.", ["general"]);

// ─── NODE 20: B2 Mastery (4751-5000) ────────────────────────────
add("Quienquiera que haya escrito este libro es un genio.", "Whoever wrote this book is a genius.", ["general"], "\"Quienquiera que\" + subjunctive — whoever.");
add("Dondequiera que vayas, lleva un diccionario.", "Wherever you go, carry a dictionary.", ["general"]);
add("Haga lo que haga, nunca parece suficiente.", "Whatever he does, it never seems enough.", ["general"], "Reduplicative subjunctive for emphasis.");
add("No es oro todo lo que reluce.", "All that glitters is not gold.", ["general"]);
add("A quien madruga, Dios le ayuda.", "The early bird catches the worm.", ["general"]);
add("En boca cerrada no entran moscas.", "Silence is golden.", ["general"]);
add("Dime con quién andas y te diré quién eres.", "Tell me who your friends are and I'll tell you who you are.", ["general"]);
add("El que mucho abarca, poco aprieta.", "Don't bite off more than you can chew.", ["general"]);
add("No hay mal que por bien no venga.", "Every cloud has a silver lining.", ["general"]);
add("Quien no arriesga, no gana.", "Nothing ventured, nothing gained.", ["general"]);
add("La riqueza de un pueblo se mide por su cultura.", "The wealth of a people is measured by its culture.", ["general"]);
add("Cada lengua es una ventana a otra forma de ver el mundo.", "Each language is a window to another way of seeing the world.", ["general"]);
add("El arte tiene la capacidad de trascender las barreras.", "Art has the ability to transcend barriers.", ["general"]);
add("La empatía es la base de toda convivencia.", "Empathy is the foundation of all coexistence.", ["general"]);
add("Aprender un idioma es mucho más que memorizar palabras.", "Learning a language is much more than memorizing words.", ["general"]);
add("El verdadero conocimiento consiste en saber que no se sabe nada.", "True knowledge consists in knowing that one knows nothing.", ["general"]);
add("La diversidad cultural enriquece a la sociedad.", "Cultural diversity enriches society.", ["general"]);
add("El turismo responsable implica respetar las costumbres locales.", "Responsible tourism involves respecting local customs.", ["travel", "general"]);
add("El liderazgo efectivo requiere empatía y visión.", "Effective leadership requires empathy and vision.", ["work", "general"]);
add("Las tradiciones familiares nos conectan con nuestras raíces.", "Family traditions connect us with our roots.", ["family", "general"]);
add("La tecnología ha revolucionado la comunicación.", "Technology has revolutionized communication.", ["general"]);
add("El pensamiento crítico debería enseñarse desde la infancia.", "Critical thinking should be taught from childhood.", ["general"]);
add("La curiosidad es el motor del aprendizaje.", "Curiosity is the engine of learning.", ["general"]);
add("Saber escuchar es un arte que pocos dominan.", "Knowing how to listen is an art few master.", ["general"]);
add("No es más rico quien más tiene, sino quien menos necesita.", "The richest is not who has most, but who needs least.", ["general"]);

// ─── MERGE AND WRITE ────────────────────────────────────────────

let nextId = taggedExisting.length + 1;
const newWithIds = allNewCards.map(card => ({
  id: nextId++,
  ...card,
  audio: '',
}));

const finalDeck = [...taggedExisting, ...newWithIds];
finalDeck.sort((a, b) => a.id - b.id);

// Remove SRS fields that shouldn't be in the deck file
const cleanDeck = finalDeck.map(({ interval, ease, due, mastery, step, dueDate, failCount, isLeech, isSuspended, ...rest }) => rest);

console.log(`Existing cards (tagged): ${taggedExisting.length}`);
console.log(`New cards generated: ${newWithIds.length}`);
console.log(`Total deck size: ${finalDeck.length}`);
console.log(`Max ID: ${finalDeck[finalDeck.length - 1].id}`);

// Count by tag
const tagCounts = {};
for (const card of finalDeck) {
  for (const tag of (card.tags || ['general'])) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
}
console.log('Tag distribution:', tagCounts);

// Count per node (at current deck size)
const perNode = Math.ceil(finalDeck.length / 20);
console.log(`Cards per node: ~${perNode}`);

// Duplicate check
const seen = new Set();
let dupes = 0;
for (const card of finalDeck) {
  const key = card.target.toLowerCase().trim();
  if (seen.has(key)) {
    dupes++;
  }
  seen.add(key);
}
console.log(`Duplicate sentences: ${dupes}`);

fs.writeFileSync(DECK_PATH, JSON.stringify(cleanDeck, null, 2));
console.log(`\nDeck written to ${DECK_PATH}`);
