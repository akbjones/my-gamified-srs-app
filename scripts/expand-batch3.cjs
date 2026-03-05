/**
 * expand-batch3.cjs
 *
 * Add ~330 new cards for nodes 15-20 (B1-B2 advanced grammar) to the Spanish deck.
 * ~55 cards per node covering:
 *   Node 15: Relative Clauses (B1)
 *   Node 16: Imperfect Subjunctive (B2)
 *   Node 17: Conditionals II & III (B2)
 *   Node 18: Passive & Impersonal (B2)
 *   Node 19: Advanced Connectors (B2)
 *   Node 20: Mastery (B2)
 *
 * Tags boosted for "work" to address underrepresentation.
 * ~20% of cards include a grammar explanation field.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log(`Current deck: ${deck.length} cards`);

// Track existing sentences to avoid duplicates
const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));

// Find the highest existing ID
let nextId = Math.max(...deck.map(c => c.id)) + 1;

// ─── NEW CARDS BY GRAMMAR NODE ───────────────────────────────────

const newCardsByNode = {

  // ═══════════════════════════════════════════════════════════════
  // NODE 15: Relative Clauses (B1)
  // que, quien, donde, lo que, el/la cual, cuyo
  // ═══════════════════════════════════════════════════════════════
  15: [
    { target: "La chica que trabaja aquí es mi prima.", english: "The girl who works here is my cousin.", tags: ["general", "family", "work"], grammar: "Que as relative pronoun referring to people" },
    { target: "El libro que me prestaste es muy bueno.", english: "The book you lent me is very good.", tags: ["general"] },
    { target: "La tienda donde compro la fruta está cerrada.", english: "The store where I buy fruit is closed.", tags: ["general"] },
    { target: "El hombre que vive al lado es muy amable.", english: "The man who lives next door is very kind.", tags: ["general"] },
    { target: "Lo que me dijiste ayer me sorprendió.", english: "What you told me yesterday surprised me.", tags: ["general"], grammar: "Lo que — what/that which, for abstract ideas" },
    { target: "La empresa donde trabajo tiene oficinas en Madrid.", english: "The company where I work has offices in Madrid.", tags: ["general", "work"] },
    { target: "El restaurante que te recomendé está en esa calle.", english: "The restaurant I recommended to you is on that street.", tags: ["general", "travel"] },
    { target: "La persona con quien hablé me dio buena información.", english: "The person I spoke with gave me good information.", tags: ["general", "work"], grammar: "Con quien — with whom, used after prepositions" },
    { target: "Los estudiantes que aprobaron el examen están contentos.", english: "The students who passed the exam are happy.", tags: ["general"] },
    { target: "La ciudad donde crecí ha cambiado mucho.", english: "The city where I grew up has changed a lot.", tags: ["general", "travel"] },
    { target: "Lo que necesitas es descansar un poco.", english: "What you need is to rest a little.", tags: ["general"] },
    { target: "El profesor que nos enseña historia es muy divertido.", english: "The teacher who teaches us history is very fun.", tags: ["general"] },
    { target: "La casa que compraron mis padres tiene jardín.", english: "The house my parents bought has a garden.", tags: ["general", "family"] },
    { target: "El médico que me atendió fue muy profesional.", english: "The doctor who treated me was very professional.", tags: ["general"] },
    { target: "La película que vimos anoche me encantó.", english: "The movie we watched last night, I loved it.", tags: ["general"] },
    { target: "El cliente con quien tengo la reunión llega a las tres.", english: "The client I have the meeting with arrives at three.", tags: ["general", "work"], grammar: "Con quien — preposition + quien for people" },
    { target: "La calle donde aparqué el coche está lejos.", english: "The street where I parked the car is far away.", tags: ["general", "travel"] },
    { target: "Lo que más me gusta de mi trabajo es el equipo.", english: "What I like most about my job is the team.", tags: ["general", "work"] },
    { target: "La vecina que tiene gatos siempre es muy simpática.", english: "The neighbor who has cats is always very nice.", tags: ["general"] },
    { target: "El hotel donde nos quedamos tenía una piscina enorme.", english: "The hotel where we stayed had a huge pool.", tags: ["general", "travel"] },
    { target: "La razón por la que llegué tarde fue el tráfico.", english: "The reason I arrived late was the traffic.", tags: ["general", "work"], grammar: "Por la que — for which, compound relative" },
    { target: "El compañero que me ayudó es nuevo en la oficina.", english: "The coworker who helped me is new in the office.", tags: ["general", "work"] },
    { target: "La mujer cuyo hijo estudia conmigo es abogada.", english: "The woman whose son studies with me is a lawyer.", tags: ["general"], grammar: "Cuyo — whose, agrees with the possessed noun" },
    { target: "El parque donde corremos está muy bien cuidado.", english: "The park where we run is very well maintained.", tags: ["general"] },
    { target: "Lo que dijo el jefe no tenía sentido.", english: "What the boss said didn't make sense.", tags: ["general", "work"] },
    { target: "El proyecto en el que estoy trabajando es complicado.", english: "The project I'm working on is complicated.", tags: ["general", "work"], grammar: "En el que — in which, preposition + article + que" },
    { target: "La canción que está sonando me recuerda a mi infancia.", english: "The song that's playing reminds me of my childhood.", tags: ["general"] },
    { target: "El país donde nací tiene playas hermosas.", english: "The country where I was born has beautiful beaches.", tags: ["general", "travel"] },
    { target: "Las personas que conocí en el viaje eran muy agradables.", english: "The people I met on the trip were very nice.", tags: ["general", "travel"] },
    { target: "Lo que me preocupa es que no tenemos suficiente tiempo.", english: "What worries me is that we don't have enough time.", tags: ["general", "work"] },
    { target: "El barrio donde vivo es muy tranquilo.", english: "The neighborhood where I live is very quiet.", tags: ["general"] },
    { target: "La amiga que me presentaste es muy graciosa.", english: "The friend you introduced me to is very funny.", tags: ["general"] },
    { target: "El informe que escribí ayer tiene un error.", english: "The report I wrote yesterday has an error.", tags: ["general", "work"] },
    { target: "La playa donde fuimos el verano pasado estaba limpia.", english: "The beach where we went last summer was clean.", tags: ["general", "travel"] },
    { target: "El tema del que hablamos ayer es importante.", english: "The topic we talked about yesterday is important.", tags: ["general", "work"], grammar: "Del que — about which, contraction de + el + que" },
    { target: "La mesa que reservé es para cuatro personas.", english: "The table I reserved is for four people.", tags: ["general", "travel"] },
    { target: "El chico con quien sale mi hermana es muy simpático.", english: "The guy my sister is dating is very nice.", tags: ["general", "family"] },
    { target: "Lo que pasó ayer no puede volver a pasar.", english: "What happened yesterday cannot happen again.", tags: ["general", "work"] },
    { target: "La familia que vive arriba tiene dos niños pequeños.", english: "The family that lives upstairs has two small children.", tags: ["general", "family"] },
    { target: "El dentista que me recomendaste es muy bueno.", english: "The dentist you recommended to me is very good.", tags: ["general"] },
    { target: "La forma en que habla me recuerda a mi abuelo.", english: "The way he speaks reminds me of my grandfather.", tags: ["general", "family"], grammar: "En que — in which, relative with preposition" },
    { target: "El autobús que tomo sale a las siete y media.", english: "The bus I take leaves at seven thirty.", tags: ["general", "travel"] },
    { target: "Lo que más echo de menos es la comida de mi madre.", english: "What I miss the most is my mother's cooking.", tags: ["general", "family"] },
    { target: "La empresa para la que trabajo es internacional.", english: "The company I work for is international.", tags: ["general", "work"], grammar: "Para la que — for which, preposition + la que" },
    { target: "El lugar donde cenamos anoche era bastante caro.", english: "The place where we had dinner last night was quite expensive.", tags: ["general", "travel"] },
    { target: "Los colegas con quienes almuerzo son de otro departamento.", english: "The colleagues I have lunch with are from another department.", tags: ["general", "work"], grammar: "Con quienes — with whom, plural" },
    { target: "La carta que recibí del banco me pone nervioso.", english: "The letter I received from the bank makes me nervous.", tags: ["general"] },
    { target: "El pueblo donde veranea mi familia es precioso.", english: "The town where my family spends summers is lovely.", tags: ["general", "family", "travel"] },
    { target: "Lo que no entiendo es por qué no me llamaron.", english: "What I don't understand is why they didn't call me.", tags: ["general", "work"] },
    { target: "La receta que encontré en internet salió muy bien.", english: "The recipe I found online turned out very well.", tags: ["general"] },
    { target: "El día en que nos conocimos llovía mucho.", english: "The day we met it was raining a lot.", tags: ["general"] },
    { target: "La oficina donde trabajaba antes era más pequeña.", english: "The office where I used to work was smaller.", tags: ["general", "work"] },
    { target: "El problema que tenemos es la falta de presupuesto.", english: "The problem we have is the lack of budget.", tags: ["general", "work"] },
    { target: "La persona a quien llamé no me contestó.", english: "The person I called didn't answer me.", tags: ["general"], grammar: "A quien — whom, direct object with preposition a" },
    { target: "El regalo que le compré a mi madre le gustó mucho.", english: "The gift I bought my mother, she liked it a lot.", tags: ["general", "family"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 16: Imperfect Subjunctive (B2)
  // Past subjunctive triggers, wishes, hypotheticals
  // ═══════════════════════════════════════════════════════════════
  16: [
    { target: "Si tuviera más tiempo, aprendería a tocar la guitarra.", english: "If I had more time, I would learn to play guitar.", tags: ["general"], grammar: "Si + imperfect subjunctive + conditional — hypothetical" },
    { target: "Me gustaría que vinieras a mi fiesta de cumpleaños.", english: "I'd like you to come to my birthday party.", tags: ["general", "family"] },
    { target: "Si pudiera elegir, viviría cerca del mar.", english: "If I could choose, I would live near the sea.", tags: ["general", "travel"] },
    { target: "El jefe quería que termináramos el informe antes del viernes.", english: "The boss wanted us to finish the report before Friday.", tags: ["general", "work"], grammar: "Quería que + imperfect subjunctive — past wish/demand" },
    { target: "Si ganara la lotería, dejaría mi trabajo.", english: "If I won the lottery, I would quit my job.", tags: ["general", "work"] },
    { target: "Ojalá tuviera más vacaciones.", english: "I wish I had more vacation time.", tags: ["general", "work"], grammar: "Ojalá + imperfect subjunctive — wish unlikely to come true" },
    { target: "Si hablara mejor inglés, buscaría trabajo en el extranjero.", english: "If I spoke better English, I would look for work abroad.", tags: ["general", "work"] },
    { target: "Me pidió que le ayudara con la mudanza.", english: "He asked me to help him with the move.", tags: ["general"] },
    { target: "Si no lloviera, iríamos a la playa.", english: "If it weren't raining, we would go to the beach.", tags: ["general", "travel"] },
    { target: "Quería que supieran la verdad antes de tomar una decisión.", english: "I wanted them to know the truth before making a decision.", tags: ["general", "work"] },
    { target: "Si fuera más joven, viajaría por todo el mundo.", english: "If I were younger, I would travel around the world.", tags: ["general", "travel"] },
    { target: "Mi madre me dijo que no saliera tan tarde.", english: "My mother told me not to go out so late.", tags: ["general", "family"] },
    { target: "Si supiera cocinar mejor, invitaría a mis amigos a cenar.", english: "If I knew how to cook better, I would invite my friends over for dinner.", tags: ["general"] },
    { target: "Les pedimos que llegaran puntuales a la reunión.", english: "We asked them to arrive on time to the meeting.", tags: ["general", "work"] },
    { target: "Si tuviera coche, no tardaría tanto en llegar.", english: "If I had a car, I wouldn't take so long to get there.", tags: ["general", "travel"] },
    { target: "Ojalá pudiera quedarme más tiempo.", english: "I wish I could stay longer.", tags: ["general", "travel"] },
    { target: "Si viviera más cerca, iría andando al trabajo.", english: "If I lived closer, I would walk to work.", tags: ["general", "work"] },
    { target: "El profesor nos recomendó que leyéramos ese libro.", english: "The teacher recommended that we read that book.", tags: ["general"] },
    { target: "Si no tuviera que trabajar mañana, me quedaría despierto.", english: "If I didn't have to work tomorrow, I would stay up.", tags: ["general", "work"] },
    { target: "Me sorprendió que nadie dijera nada.", english: "It surprised me that nobody said anything.", tags: ["general"], grammar: "Emotion + que + imperfect subjunctive in past" },
    { target: "Si hiciera buen tiempo, haríamos una barbacoa.", english: "If the weather were nice, we would have a barbecue.", tags: ["general", "family"] },
    { target: "Necesitábamos que alguien nos tradujera el documento.", english: "We needed someone to translate the document for us.", tags: ["general", "work"] },
    { target: "Si fuera tú, aceptaría esa oferta de trabajo.", english: "If I were you, I would accept that job offer.", tags: ["general", "work"], grammar: "Si fuera tú — if I were you, common advice pattern" },
    { target: "Dudaba que el paquete llegara a tiempo.", english: "I doubted the package would arrive on time.", tags: ["general"] },
    { target: "Si pudiera cambiar algo de mi vida, estudiaría otra carrera.", english: "If I could change something about my life, I would study a different degree.", tags: ["general"] },
    { target: "Mi abuela quería que la visitáramos más a menudo.", english: "My grandmother wanted us to visit her more often.", tags: ["general", "family"] },
    { target: "Si no costara tanto, compraría un piso en el centro.", english: "If it didn't cost so much, I would buy an apartment downtown.", tags: ["general"] },
    { target: "Era importante que todos estuvieran de acuerdo.", english: "It was important that everyone agreed.", tags: ["general", "work"], grammar: "Impersonal expression + que + imperfect subjunctive" },
    { target: "Si tuviera tu número, te habría llamado.", english: "If I had your number, I would have called you.", tags: ["general"] },
    { target: "No creía que fuera tan difícil encontrar aparcamiento.", english: "I didn't think it would be so hard to find parking.", tags: ["general", "travel"] },
    { target: "Si supiera la respuesta, te la diría.", english: "If I knew the answer, I would tell you.", tags: ["general"] },
    { target: "Quería que mi hijo estudiara en una buena universidad.", english: "I wanted my son to study at a good university.", tags: ["general", "family"] },
    { target: "Si me pagaran más, no buscaría otro empleo.", english: "If they paid me more, I wouldn't look for another job.", tags: ["general", "work"] },
    { target: "Le sugerí que hablara con su jefe sobre el problema.", english: "I suggested he talk to his boss about the problem.", tags: ["general", "work"] },
    { target: "Si tuviera jardín, plantaría un huerto.", english: "If I had a garden, I would plant a vegetable patch.", tags: ["general"] },
    { target: "No pensaba que fuera posible terminar a tiempo.", english: "I didn't think it was possible to finish on time.", tags: ["general", "work"] },
    { target: "Si pudiera volver atrás, haría las cosas de otra manera.", english: "If I could go back, I would do things differently.", tags: ["general"] },
    { target: "Era necesario que presentáramos los resultados el lunes.", english: "It was necessary for us to present the results on Monday.", tags: ["general", "work"] },
    { target: "Si no existiera internet, la vida sería muy distinta.", english: "If the internet didn't exist, life would be very different.", tags: ["general"] },
    { target: "Mi hermano me pidió que le prestara dinero.", english: "My brother asked me to lend him money.", tags: ["general", "family"] },
    { target: "Si tuviera talento para la música, tocaría el piano.", english: "If I had a talent for music, I would play the piano.", tags: ["general"] },
    { target: "Esperaba que me llamaran para la entrevista.", english: "I was hoping they would call me for the interview.", tags: ["general", "work"], grammar: "Esperaba que + subjunctive — hoping for uncertain outcome" },
    { target: "Si conociera a alguien en esa ciudad, me mudaría allí.", english: "If I knew someone in that city, I would move there.", tags: ["general", "travel"] },
    { target: "Me alegré de que encontrara trabajo tan rápido.", english: "I was glad he found a job so quickly.", tags: ["general", "work"] },
    { target: "Si no hiciera tanto frío, saldríamos a pasear.", english: "If it weren't so cold, we would go for a walk.", tags: ["general"] },
    { target: "Nos pidieron que no hiciéramos ruido después de las diez.", english: "They asked us not to make noise after ten.", tags: ["general", "travel"] },
    { target: "Si fuera posible, trabajaría desde casa todos los días.", english: "If it were possible, I would work from home every day.", tags: ["general", "work"] },
    { target: "No esperaba que la película fuera tan buena.", english: "I didn't expect the movie to be so good.", tags: ["general"] },
    { target: "Si tuviera un día libre, dormiría hasta tarde.", english: "If I had a day off, I would sleep in.", tags: ["general"] },
    { target: "Mi padre siempre quiso que fuéramos a la universidad.", english: "My father always wanted us to go to university.", tags: ["general", "family"] },
    { target: "Si pudiera hablar con mi yo del pasado, le daría muchos consejos.", english: "If I could talk to my past self, I would give him a lot of advice.", tags: ["general"] },
    { target: "Era raro que no contestara al teléfono.", english: "It was strange that he didn't answer the phone.", tags: ["general"] },
    { target: "Si viviera en otro país, extrañaría la comida de aquí.", english: "If I lived in another country, I would miss the food from here.", tags: ["general", "travel"] },
    { target: "Le dije que se tomara las cosas con calma.", english: "I told him to take things easy.", tags: ["general", "family"] },
    { target: "Si me dieran a elegir, preferiría la oficina grande.", english: "If they let me choose, I would prefer the big office.", tags: ["general", "work"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 17: Conditionals II & III (B2)
  // Si clauses with imperfect/pluperfect subjunctive + conditional/conditional perfect
  // ═══════════════════════════════════════════════════════════════
  17: [
    { target: "Si hubiera estudiado más, habría aprobado el examen.", english: "If I had studied more, I would have passed the exam.", tags: ["general"], grammar: "Si + pluperfect subjunctive + conditional perfect — Type III conditional" },
    { target: "Si hubiéramos salido antes, no habríamos perdido el tren.", english: "If we had left earlier, we wouldn't have missed the train.", tags: ["general", "travel"] },
    { target: "Si no hubiera llovido, habríamos ido a la montaña.", english: "If it hadn't rained, we would have gone to the mountains.", tags: ["general", "travel"] },
    { target: "Si me lo hubieras dicho antes, habría podido ayudarte.", english: "If you had told me earlier, I could have helped you.", tags: ["general"] },
    { target: "Si hubiera aceptado ese trabajo, ahora viviría en Barcelona.", english: "If I had accepted that job, I would now be living in Barcelona.", tags: ["general", "work"], grammar: "Mixed conditional — past condition, present result" },
    { target: "Si no hubiera conocido a mi mujer, mi vida sería muy diferente.", english: "If I hadn't met my wife, my life would be very different.", tags: ["general", "family"] },
    { target: "Si hubieras llegado a tiempo, habrías visto el principio.", english: "If you had arrived on time, you would have seen the beginning.", tags: ["general"] },
    { target: "Si hubiera hecho caso a mi padre, no tendría estas deudas.", english: "If I had listened to my father, I wouldn't have these debts.", tags: ["general", "family"], grammar: "Mixed conditional — past condition + present consequence" },
    { target: "Si no hubiéramos reservado, no habríamos encontrado mesa.", english: "If we hadn't booked, we wouldn't have found a table.", tags: ["general", "travel"] },
    { target: "Si hubiera sabido que estabas aquí, habría venido antes.", english: "If I had known you were here, I would have come sooner.", tags: ["general"] },
    { target: "Si me hubieran ofrecido el puesto, lo habría aceptado.", english: "If they had offered me the position, I would have accepted it.", tags: ["general", "work"] },
    { target: "Si no hubiera comido tanto, no me sentiría mal ahora.", english: "If I hadn't eaten so much, I wouldn't feel bad now.", tags: ["general"] },
    { target: "Si hubiéramos comprado los billetes antes, habrían sido más baratos.", english: "If we had bought the tickets earlier, they would have been cheaper.", tags: ["general", "travel"] },
    { target: "Si hubiera dormido más, no estaría tan cansado.", english: "If I had slept more, I wouldn't be so tired.", tags: ["general", "work"] },
    { target: "Si no te hubieras ido, habríamos terminado el proyecto a tiempo.", english: "If you hadn't left, we would have finished the project on time.", tags: ["general", "work"] },
    { target: "Si hubiera aprendido inglés de pequeño, ahora lo hablaría perfectamente.", english: "If I had learned English as a child, I would speak it perfectly now.", tags: ["general"] },
    { target: "Si hubieras seguido mi consejo, no estarías en esta situación.", english: "If you had followed my advice, you wouldn't be in this situation.", tags: ["general"] },
    { target: "Si hubiera tenido más experiencia, me habrían contratado.", english: "If I had had more experience, they would have hired me.", tags: ["general", "work"], grammar: "Pluperfect subjunctive + conditional perfect — unrealized past" },
    { target: "Si no hubiera nevado, habríamos llegado a tiempo.", english: "If it hadn't snowed, we would have arrived on time.", tags: ["general", "travel"] },
    { target: "Si hubiera preparado mejor la presentación, habría salido mejor.", english: "If I had prepared the presentation better, it would have gone better.", tags: ["general", "work"] },
    { target: "Si hubiéramos sabido la dirección, no nos habríamos perdido.", english: "If we had known the address, we wouldn't have gotten lost.", tags: ["general", "travel"] },
    { target: "Si no hubiera gastado tanto dinero, podría irme de vacaciones.", english: "If I hadn't spent so much money, I could go on vacation.", tags: ["general", "travel"] },
    { target: "Si hubiera traído el paraguas, no me habría mojado.", english: "If I had brought my umbrella, I wouldn't have gotten wet.", tags: ["general"] },
    { target: "Si me hubieran avisado con tiempo, habría cambiado mis planes.", english: "If they had warned me in time, I would have changed my plans.", tags: ["general", "work"] },
    { target: "Si no hubieras insistido, nunca habría probado ese plato.", english: "If you hadn't insisted, I never would have tried that dish.", tags: ["general"] },
    { target: "Si hubiera ido al médico antes, se habría curado más rápido.", english: "If he had gone to the doctor earlier, he would have recovered faster.", tags: ["general"] },
    { target: "Si no hubiera empezado a llover, habríamos seguido caminando.", english: "If it hadn't started to rain, we would have kept walking.", tags: ["general", "travel"] },
    { target: "Si hubiera leído las instrucciones, no habría roto la máquina.", english: "If I had read the instructions, I wouldn't have broken the machine.", tags: ["general", "work"] },
    { target: "Si hubiéramos pedido ayuda, habríamos acabado antes.", english: "If we had asked for help, we would have finished earlier.", tags: ["general", "work"] },
    { target: "Si no hubiera olvidado las llaves, no habría tenido que llamar al cerrajero.", english: "If I hadn't forgotten my keys, I wouldn't have had to call the locksmith.", tags: ["general"] },
    { target: "Si hubieras venido a la cena, habrías conocido a mi hermano.", english: "If you had come to dinner, you would have met my brother.", tags: ["general", "family"] },
    { target: "Si me hubiera levantado antes, habría llegado puntual.", english: "If I had gotten up earlier, I would have arrived on time.", tags: ["general", "work"] },
    { target: "Si no hubiera habido tráfico, el viaje habría sido más corto.", english: "If there hadn't been traffic, the trip would have been shorter.", tags: ["general", "travel"] },
    { target: "Si hubieras guardado el archivo, no lo habrías perdido.", english: "If you had saved the file, you wouldn't have lost it.", tags: ["general", "work"] },
    { target: "Si hubiera invertido en esa empresa, ahora sería rico.", english: "If I had invested in that company, I would be rich now.", tags: ["general", "work"], grammar: "Mixed conditional — past unrealized + present hypothetical result" },
    { target: "Si no hubiera aceptado la invitación, no habría conocido a nadie.", english: "If I hadn't accepted the invitation, I wouldn't have met anyone.", tags: ["general"] },
    { target: "Si hubiera tenido más cuidado, no se habría caído.", english: "If he had been more careful, he wouldn't have fallen.", tags: ["general"] },
    { target: "Si hubiéramos hablado antes, habríamos evitado este problema.", english: "If we had talked earlier, we would have avoided this problem.", tags: ["general", "work"] },
    { target: "Si no me hubiera mudado, seguiría trabajando en la misma empresa.", english: "If I hadn't moved, I would still be working at the same company.", tags: ["general", "work"] },
    { target: "Si hubiera nacido en otro país, hablaría otro idioma.", english: "If I had been born in another country, I would speak another language.", tags: ["general"] },
    { target: "Si hubieras llamado antes, todavía habría quedado sitio.", english: "If you had called earlier, there would still have been room.", tags: ["general"] },
    { target: "Si no hubiéramos discutido, seguiríamos siendo amigos.", english: "If we hadn't argued, we would still be friends.", tags: ["general"] },
    { target: "Si hubiera cogido un taxi, habría llegado mucho antes.", english: "If I had taken a taxi, I would have arrived much earlier.", tags: ["general", "travel"] },
    { target: "Si hubieras revisado el correo, habrías visto mi mensaje.", english: "If you had checked your email, you would have seen my message.", tags: ["general", "work"] },
    { target: "Si hubiera hecho sol, habríamos comido en la terraza.", english: "If it had been sunny, we would have eaten on the terrace.", tags: ["general"] },
    { target: "Si no hubiera sido tan tímido, le habría pedido su número.", english: "If I hadn't been so shy, I would have asked for her number.", tags: ["general"] },
    { target: "Si hubiéramos empezado antes, ya habríamos terminado.", english: "If we had started earlier, we would have already finished.", tags: ["general", "work"] },
    { target: "Si me hubiera quedado en casa, no habría gastado tanto.", english: "If I had stayed home, I wouldn't have spent so much.", tags: ["general"] },
    { target: "Si hubiera tenido tu apoyo, todo habría sido más fácil.", english: "If I had had your support, everything would have been easier.", tags: ["general", "family"] },
    { target: "Si no hubieras cambiado de tema, habríamos resuelto el asunto.", english: "If you hadn't changed the subject, we would have resolved the matter.", tags: ["general", "work"] },
    { target: "Si hubiera elegido otra carrera, no estaría tan estresado.", english: "If I had chosen a different career, I wouldn't be so stressed.", tags: ["general", "work"] },
    { target: "Si hubiera hecho la maleta la noche anterior, no se me habría olvidado nada.", english: "If I had packed my suitcase the night before, I wouldn't have forgotten anything.", tags: ["general", "travel"] },
    { target: "Si hubiéramos ido en coche, habríamos tardado menos.", english: "If we had gone by car, it would have taken us less time.", tags: ["general", "travel"] },
    { target: "Si no hubiera confiado en él, no me habría engañado.", english: "If I hadn't trusted him, he wouldn't have deceived me.", tags: ["general"] },
    { target: "Si hubiera practicado más, habría jugado mejor en el partido.", english: "If I had practiced more, I would have played better in the match.", tags: ["general"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 18: Passive & Impersonal (B2)
  // Se pasiva, se impersonal, passive voice, impersonal expressions
  // ═══════════════════════════════════════════════════════════════
  18: [
    { target: "Aquí se habla español.", english: "Spanish is spoken here.", tags: ["general", "travel"], grammar: "Se impersonal — no specific subject" },
    { target: "Se necesitan camareros con experiencia.", english: "Experienced waiters are needed.", tags: ["general", "work"], grammar: "Se pasiva — passive se with plural noun" },
    { target: "Se venden pisos en esta zona.", english: "Apartments are sold in this area.", tags: ["general"] },
    { target: "No se permite fumar en el edificio.", english: "Smoking is not allowed in the building.", tags: ["general", "work"] },
    { target: "Se dice que va a llover mañana.", english: "They say it's going to rain tomorrow.", tags: ["general"], grammar: "Se dice que — impersonal 'they say that'" },
    { target: "Se busca personal para la temporada de verano.", english: "Staff is being sought for the summer season.", tags: ["general", "work"] },
    { target: "Aquí se come muy bien.", english: "You eat very well here.", tags: ["general", "travel"] },
    { target: "Se alquilan habitaciones por meses.", english: "Rooms are rented by the month.", tags: ["general", "travel"] },
    { target: "El proyecto fue aprobado por el director.", english: "The project was approved by the director.", tags: ["general", "work"], grammar: "Passive voice with ser + participle + por" },
    { target: "Se recomienda llegar quince minutos antes.", english: "It is recommended to arrive fifteen minutes early.", tags: ["general", "work"] },
    { target: "La reunión fue cancelada por falta de asistentes.", english: "The meeting was canceled due to lack of attendees.", tags: ["general", "work"] },
    { target: "Se prohíbe el paso a personas no autorizadas.", english: "Entry is prohibited for unauthorized persons.", tags: ["general", "work"] },
    { target: "Se puede pagar con tarjeta aquí.", english: "You can pay by card here.", tags: ["general", "travel"], grammar: "Se puede + infinitive — impersonal 'one can'" },
    { target: "El puente fue construido en el siglo dieciocho.", english: "The bridge was built in the eighteenth century.", tags: ["general", "travel"] },
    { target: "Se aceptan reservas por teléfono.", english: "Reservations are accepted by phone.", tags: ["general", "travel"] },
    { target: "Se sabe que el ejercicio es bueno para la salud.", english: "It is known that exercise is good for health.", tags: ["general"] },
    { target: "La carta fue enviada ayer por la tarde.", english: "The letter was sent yesterday afternoon.", tags: ["general", "work"] },
    { target: "Se ofrecen cursos gratuitos de idiomas.", english: "Free language courses are offered.", tags: ["general"] },
    { target: "No se sabe cuándo van a empezar las obras.", english: "It is not known when the construction will start.", tags: ["general"] },
    { target: "Se espera que el problema se resuelva pronto.", english: "It is expected that the problem will be solved soon.", tags: ["general", "work"] },
    { target: "La decisión fue tomada sin consultarnos.", english: "The decision was made without consulting us.", tags: ["general", "work"], grammar: "Passive with ser — emphasizes the action done to us" },
    { target: "Se nota que has estudiado mucho.", english: "You can tell you've studied a lot.", tags: ["general"] },
    { target: "Se ruega silencio en la biblioteca.", english: "Silence is requested in the library.", tags: ["general"] },
    { target: "El pedido fue entregado esta mañana.", english: "The order was delivered this morning.", tags: ["general", "work"] },
    { target: "Se cree que habrá cambios en la empresa.", english: "It is believed there will be changes in the company.", tags: ["general", "work"], grammar: "Se cree que — impersonal belief" },
    { target: "Se pueden comprar entradas por internet.", english: "Tickets can be bought online.", tags: ["general", "travel"] },
    { target: "Los resultados fueron publicados la semana pasada.", english: "The results were published last week.", tags: ["general", "work"] },
    { target: "Se come bien en este restaurante.", english: "The food is good at this restaurant.", tags: ["general", "travel"] },
    { target: "Se ha demostrado que dormir bien es importante.", english: "It has been shown that sleeping well is important.", tags: ["general"] },
    { target: "La propuesta fue rechazada por la mayoría.", english: "The proposal was rejected by the majority.", tags: ["general", "work"] },
    { target: "Se vive bien en esta ciudad.", english: "Life is good in this city.", tags: ["general", "travel"], grammar: "Se vive — impersonal se with intransitive verb" },
    { target: "Se solicitan candidatos con experiencia en ventas.", english: "Candidates with sales experience are being sought.", tags: ["general", "work"] },
    { target: "El contrato fue firmado por ambas partes.", english: "The contract was signed by both parties.", tags: ["general", "work"] },
    { target: "Se pide a los pasajeros que se abrochen el cinturón.", english: "Passengers are asked to fasten their seatbelts.", tags: ["general", "travel"] },
    { target: "La obra fue inaugurada por el alcalde.", english: "The project was inaugurated by the mayor.", tags: ["general"] },
    { target: "Se trabaja mucho en este país.", english: "People work a lot in this country.", tags: ["general", "work"], grammar: "Se trabaja — impersonal se, general statement" },
    { target: "Se han recibido muchas quejas sobre el servicio.", english: "Many complaints about the service have been received.", tags: ["general", "work"] },
    { target: "El informe fue escrito por todo el equipo.", english: "The report was written by the whole team.", tags: ["general", "work"] },
    { target: "Se aconseja no viajar de noche por esa zona.", english: "It is advised not to travel at night through that area.", tags: ["general", "travel"] },
    { target: "Se hablan varios idiomas en esta oficina.", english: "Several languages are spoken in this office.", tags: ["general", "work"] },
    { target: "La exposición fue visitada por miles de personas.", english: "The exhibition was visited by thousands of people.", tags: ["general", "travel"] },
    { target: "Se tarda una hora en llegar al aeropuerto.", english: "It takes one hour to get to the airport.", tags: ["general", "travel"], grammar: "Se tarda — impersonal for duration" },
    { target: "Se necesita más inversión en educación.", english: "More investment in education is needed.", tags: ["general"] },
    { target: "El museo fue renovado el año pasado.", english: "The museum was renovated last year.", tags: ["general", "travel"] },
    { target: "Se debe respetar el horario de trabajo.", english: "Work hours must be respected.", tags: ["general", "work"] },
    { target: "La ley fue aprobada por unanimidad.", english: "The law was approved unanimously.", tags: ["general"] },
    { target: "Se ven muchos turistas en verano.", english: "You see many tourists in summer.", tags: ["general", "travel"] },
    { target: "Se agradece cualquier tipo de colaboración.", english: "Any type of collaboration is appreciated.", tags: ["general", "work"] },
    { target: "El edificio fue diseñado por un arquitecto famoso.", english: "The building was designed by a famous architect.", tags: ["general", "travel"] },
    { target: "Se comenta que van a subir los precios.", english: "People are saying prices are going to go up.", tags: ["general"] },
    { target: "Se deben entregar los informes antes del viernes.", english: "Reports must be submitted before Friday.", tags: ["general", "work"] },
    { target: "La empresa fue fundada en mil novecientos noventa.", english: "The company was founded in 1990.", tags: ["general", "work"] },
    { target: "Se aprende mucho viajando.", english: "You learn a lot by traveling.", tags: ["general", "travel"], grammar: "Se aprende — impersonal se + gerund" },
    { target: "Se han hecho muchos avances en los últimos años.", english: "A lot of progress has been made in recent years.", tags: ["general"] },
    { target: "El acuerdo fue alcanzado después de largas negociaciones.", english: "The agreement was reached after long negotiations.", tags: ["general", "work"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 19: Advanced Connectors (B2)
  // Sin embargo, no obstante, a pesar de, por lo tanto, en cambio, etc.
  // ═══════════════════════════════════════════════════════════════
  19: [
    { target: "Estaba cansado; sin embargo, siguió trabajando.", english: "He was tired; however, he kept working.", tags: ["general", "work"], grammar: "Sin embargo — however, introduces contrast" },
    { target: "No tengo mucho tiempo; no obstante, intentaré ayudarte.", english: "I don't have much time; nevertheless, I'll try to help you.", tags: ["general"], grammar: "No obstante — nevertheless, formal contrast" },
    { target: "A pesar de la lluvia, salimos a caminar.", english: "Despite the rain, we went out for a walk.", tags: ["general"], grammar: "A pesar de + noun — despite/in spite of" },
    { target: "El hotel era caro; en cambio, el servicio era excelente.", english: "The hotel was expensive; on the other hand, the service was excellent.", tags: ["general", "travel"] },
    { target: "Llegué tarde; por lo tanto, me perdí el principio.", english: "I arrived late; therefore, I missed the beginning.", tags: ["general"], grammar: "Por lo tanto — therefore, introduces consequence" },
    { target: "No me gusta el calor; en cambio, me encanta el frío.", english: "I don't like the heat; on the other hand, I love the cold.", tags: ["general"] },
    { target: "El proyecto es ambicioso; sin embargo, creo que podemos lograrlo.", english: "The project is ambitious; however, I think we can achieve it.", tags: ["general", "work"] },
    { target: "A pesar de que estudió mucho, no aprobó el examen.", english: "Even though he studied a lot, he didn't pass the exam.", tags: ["general"], grammar: "A pesar de que + verb — even though" },
    { target: "No tenemos presupuesto; por consiguiente, el viaje se cancela.", english: "We don't have budget; consequently, the trip is canceled.", tags: ["general", "work", "travel"] },
    { target: "Hacía mucho frío; no obstante, fuimos a la playa.", english: "It was very cold; nevertheless, we went to the beach.", tags: ["general", "travel"] },
    { target: "El trabajo es difícil; sin embargo, la paga es buena.", english: "The work is hard; however, the pay is good.", tags: ["general", "work"] },
    { target: "A pesar de su edad, corre todos los días.", english: "Despite his age, he runs every day.", tags: ["general"] },
    { target: "No me ascendieron; por lo tanto, busqué otro trabajo.", english: "I didn't get promoted; therefore, I looked for another job.", tags: ["general", "work"] },
    { target: "Ella prefiere el campo; en cambio, él prefiere la ciudad.", english: "She prefers the countryside; on the other hand, he prefers the city.", tags: ["general"] },
    { target: "Aunque llovía mucho, decidimos salir de excursión.", english: "Although it was raining a lot, we decided to go on a trip.", tags: ["general", "travel"], grammar: "Aunque + indicative — although (stating a fact)" },
    { target: "El restaurante estaba lleno; sin embargo, conseguimos mesa.", english: "The restaurant was full; however, we got a table.", tags: ["general", "travel"] },
    { target: "A pesar de los problemas, el equipo terminó el proyecto.", english: "Despite the problems, the team finished the project.", tags: ["general", "work"] },
    { target: "Tengo experiencia; por lo tanto, confío en que me contratarán.", english: "I have experience; therefore, I'm confident they'll hire me.", tags: ["general", "work"] },
    { target: "Mi hermano es muy extrovertido; en cambio, yo soy bastante tímido.", english: "My brother is very extroverted; on the other hand, I'm quite shy.", tags: ["general", "family"] },
    { target: "No le gustaba su trabajo; sin embargo, nunca se quejaba.", english: "He didn't like his job; however, he never complained.", tags: ["general", "work"] },
    { target: "A pesar de que no hablaba español, se hizo entender.", english: "Even though he didn't speak Spanish, he made himself understood.", tags: ["general", "travel"] },
    { target: "El vuelo se retrasó dos horas; por consiguiente, perdimos la conexión.", english: "The flight was delayed two hours; consequently, we missed the connection.", tags: ["general", "travel"], grammar: "Por consiguiente — consequently, formal cause-effect" },
    { target: "Además de hablar español, también habla francés.", english: "Besides speaking Spanish, he also speaks French.", tags: ["general", "work"] },
    { target: "No solo llegó tarde, sino que además no pidió disculpas.", english: "Not only did he arrive late, but he also didn't apologize.", tags: ["general", "work"], grammar: "No solo... sino que además — not only... but also" },
    { target: "Por un lado quiero ir; por otro lado, estoy muy cansado.", english: "On the one hand I want to go; on the other hand, I'm very tired.", tags: ["general"], grammar: "Por un lado... por otro lado — on one hand... on the other" },
    { target: "Siempre que puedo, viajo en tren en vez de en avión.", english: "Whenever I can, I travel by train instead of by plane.", tags: ["general", "travel"] },
    { target: "A pesar de todo, sigo pensando que fue buena idea.", english: "Despite everything, I still think it was a good idea.", tags: ["general"] },
    { target: "No me llamó; es más, ni siquiera me mandó un mensaje.", english: "He didn't call me; what's more, he didn't even send me a message.", tags: ["general"], grammar: "Es más — what's more, escalation connector" },
    { target: "Dado que no hay quórum, aplazamos la reunión.", english: "Given that there's no quorum, we'll postpone the meeting.", tags: ["general", "work"], grammar: "Dado que — given that, formal cause" },
    { target: "Mientras tanto, puedes ir preparando la presentación.", english: "In the meantime, you can start preparing the presentation.", tags: ["general", "work"] },
    { target: "En cuanto al presupuesto, todavía estamos esperando aprobación.", english: "Regarding the budget, we're still waiting for approval.", tags: ["general", "work"], grammar: "En cuanto a — regarding, topic introduction" },
    { target: "A menos que me avisen, iré al evento.", english: "Unless they notify me, I'll go to the event.", tags: ["general"] },
    { target: "Por más que intenté, no pude convencerlo.", english: "No matter how much I tried, I couldn't convince him.", tags: ["general", "work"], grammar: "Por más que — no matter how much" },
    { target: "Tanto mi jefe como mis compañeros están de acuerdo.", english: "Both my boss and my coworkers agree.", tags: ["general", "work"] },
    { target: "En lugar de quejarte, busca una solución.", english: "Instead of complaining, look for a solution.", tags: ["general", "work"] },
    { target: "Puesto que ya terminamos, podemos irnos.", english: "Since we already finished, we can leave.", tags: ["general", "work"], grammar: "Puesto que — since, formal cause" },
    { target: "Con tal de que llegues a tiempo, no hay problema.", english: "As long as you arrive on time, there's no problem.", tags: ["general"] },
    { target: "Ya que estamos aquí, aprovechemos para visitar el museo.", english: "Since we're here, let's take the opportunity to visit the museum.", tags: ["general", "travel"] },
    { target: "El plan parecía bueno; ahora bien, necesitamos más datos.", english: "The plan seemed good; now then, we need more data.", tags: ["general", "work"], grammar: "Ahora bien — now then/however, introduces reservation" },
    { target: "A diferencia de su hermano, ella es muy organizada.", english: "Unlike her brother, she is very organized.", tags: ["general", "family"] },
    { target: "Así que al final decidimos quedarnos en casa.", english: "So in the end we decided to stay home.", tags: ["general"] },
    { target: "De hecho, es la mejor propuesta que hemos recibido.", english: "In fact, it's the best proposal we've received.", tags: ["general", "work"], grammar: "De hecho — in fact, emphasis connector" },
    { target: "En definitiva, fue un viaje que mereció la pena.", english: "All in all, it was a trip that was worth it.", tags: ["general", "travel"], grammar: "En definitiva — all in all, concluding connector" },
    { target: "Ni siquiera me preguntó cómo estaba.", english: "He didn't even ask me how I was.", tags: ["general", "family"] },
    { target: "Dicho de otro modo, no estamos preparados.", english: "In other words, we're not ready.", tags: ["general", "work"], grammar: "Dicho de otro modo — in other words, rephrasing" },
    { target: "Siempre y cuando cumplas con tu parte, no habrá problemas.", english: "As long as you do your part, there won't be any problems.", tags: ["general", "work"] },
    { target: "A fin de cuentas, lo importante es que estamos todos bien.", english: "At the end of the day, what matters is that we're all fine.", tags: ["general", "family"] },
    { target: "Cada vez que viajo, descubro algo nuevo.", english: "Every time I travel, I discover something new.", tags: ["general", "travel"] },
    { target: "De todos modos, gracias por intentarlo.", english: "Anyway, thanks for trying.", tags: ["general"] },
    { target: "En primer lugar, quiero agradecer a todos por venir.", english: "First of all, I want to thank everyone for coming.", tags: ["general", "work"], grammar: "En primer lugar — first of all, sequence connector" },
    { target: "A raíz de la pandemia, muchas empresas cambiaron al teletrabajo.", english: "As a result of the pandemic, many companies switched to remote work.", tags: ["general", "work"] },
    { target: "A medida que pasa el tiempo, todo mejora.", english: "As time goes by, everything gets better.", tags: ["general"], grammar: "A medida que — as (gradual progression)" },
    { target: "En resumen, necesitamos más recursos y menos burocracia.", english: "In summary, we need more resources and less bureaucracy.", tags: ["general", "work"] },
    { target: "No bien llegamos, empezó a llover.", english: "As soon as we arrived, it started raining.", tags: ["general", "travel"] },
    { target: "Con respecto a tu pregunta, la respuesta es sí.", english: "With regard to your question, the answer is yes.", tags: ["general", "work"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 20: Mastery (B2)
  // Mixed advanced grammar — idioms, complex sentences, register
  // ═══════════════════════════════════════════════════════════════
  20: [
    { target: "Se me cayó el alma al suelo cuando me enteré.", english: "My heart sank when I found out.", tags: ["general"], grammar: "Idiomatic: se me cayó el alma al suelo — my heart sank" },
    { target: "No me cabe en la cabeza que haya dicho eso.", english: "I can't wrap my head around the fact that he said that.", tags: ["general"], grammar: "Idiomatic: no me cabe en la cabeza — I can't believe/understand" },
    { target: "Me costó un ojo de la cara arreglar el coche.", english: "It cost me an arm and a leg to fix the car.", tags: ["general"], grammar: "Idiomatic: costar un ojo de la cara — very expensive" },
    { target: "Estoy hasta las narices de que no me hagan caso.", english: "I'm fed up with being ignored.", tags: ["general", "work"], grammar: "Idiomatic: estar hasta las narices — to be fed up" },
    { target: "Dice una cosa y hace otra; no me fío de él.", english: "He says one thing and does another; I don't trust him.", tags: ["general", "work"] },
    { target: "Por mucho que lo intente, no consigo entender este programa.", english: "No matter how much I try, I can't understand this program.", tags: ["general", "work"] },
    { target: "Menos mal que llegamos a tiempo para el vuelo.", english: "Thank goodness we arrived in time for the flight.", tags: ["general", "travel"], grammar: "Menos mal que — thank goodness that, relief expression" },
    { target: "Se las arregla muy bien sola.", english: "She manages very well on her own.", tags: ["general"], grammar: "Arreglárselas — to manage/cope, reflexive idiom" },
    { target: "Me da igual dónde cenemos, tú decides.", english: "I don't care where we have dinner, you decide.", tags: ["general"] },
    { target: "Nos llevamos de maravilla desde el primer día.", english: "We've gotten along wonderfully since day one.", tags: ["general", "work"] },
    { target: "A ver si quedamos un día de estos para tomar algo.", english: "Let's see if we can get together one of these days for a drink.", tags: ["general"] },
    { target: "Llevo años intentando que me asciendan.", english: "I've been trying to get promoted for years.", tags: ["general", "work"], grammar: "Llevar + time + gerund — ongoing duration" },
    { target: "Si no fuera por mi familia, no habría seguido adelante.", english: "If it weren't for my family, I wouldn't have kept going.", tags: ["general", "family"] },
    { target: "No viene a cuento hablar de eso ahora.", english: "It's not relevant to talk about that now.", tags: ["general", "work"], grammar: "Venir a cuento — to be relevant/pertinent" },
    { target: "Le eché una mano con la mudanza el fin de semana.", english: "I gave him a hand with the move this weekend.", tags: ["general"], grammar: "Echar una mano — to give a hand, help out" },
    { target: "Más vale tarde que nunca, ¿no?", english: "Better late than never, right?", tags: ["general"] },
    { target: "Al fin y al cabo, lo que cuenta es la intención.", english: "At the end of the day, what counts is the intention.", tags: ["general"], grammar: "Al fin y al cabo — at the end of the day, after all" },
    { target: "No tengo ni idea de cómo funcionan estas cosas.", english: "I have no idea how these things work.", tags: ["general"] },
    { target: "Me pilla un poco lejos, pero merece la pena.", english: "It's a bit far for me, but it's worth it.", tags: ["general", "travel"], grammar: "Pillar lejos — colloquial for 'to be far away from someone'" },
    { target: "Que yo sepa, la reunión sigue en pie.", english: "As far as I know, the meeting is still on.", tags: ["general", "work"], grammar: "Que yo sepa — as far as I know, epistemic marker" },
    { target: "Lo hizo a propósito para molestarme.", english: "He did it on purpose to annoy me.", tags: ["general"] },
    { target: "Le tomé el pelo y se lo creyó todo.", english: "I pulled his leg and he believed everything.", tags: ["general"], grammar: "Tomar el pelo — to pull someone's leg, joke" },
    { target: "Me da la impresión de que no le cae bien mi jefe.", english: "I get the impression he doesn't like my boss.", tags: ["general", "work"] },
    { target: "Estamos en las mismas; no ha cambiado nada.", english: "We're in the same place; nothing has changed.", tags: ["general", "work"], grammar: "Estar en las mismas — no change, stuck in same situation" },
    { target: "Hay que echarle ganas si quieres que salga bien.", english: "You have to put in the effort if you want it to go well.", tags: ["general", "work"] },
    { target: "Se me pasó por alto ese detalle en el contrato.", english: "I overlooked that detail in the contract.", tags: ["general", "work"], grammar: "Pasársele por alto — to overlook something" },
    { target: "Me hizo gracia lo que dijo tu hermano.", english: "What your brother said was funny to me.", tags: ["general", "family"] },
    { target: "Es pan comido, no te preocupes.", english: "It's a piece of cake, don't worry.", tags: ["general"], grammar: "Ser pan comido — to be a piece of cake, very easy" },
    { target: "No pude pegar ojo en toda la noche.", english: "I couldn't sleep a wink all night.", tags: ["general"], grammar: "No pegar ojo — not to sleep a wink" },
    { target: "Me suena tu cara, pero no sé de qué.", english: "Your face looks familiar, but I don't know from where.", tags: ["general"] },
    { target: "No me queda más remedio que aceptar la oferta.", english: "I have no choice but to accept the offer.", tags: ["general", "work"], grammar: "No quedar más remedio que — to have no choice but to" },
    { target: "A estas alturas, ya deberías saber cómo funciona.", english: "At this point, you should already know how it works.", tags: ["general", "work"], grammar: "A estas alturas — at this point/stage" },
    { target: "Me quedé en blanco durante la presentación.", english: "My mind went blank during the presentation.", tags: ["general", "work"], grammar: "Quedarse en blanco — to go blank, forget everything" },
    { target: "No le des más vueltas; lo hecho, hecho está.", english: "Don't overthink it; what's done is done.", tags: ["general"], grammar: "Dar vueltas — to overthink; lo hecho, hecho está — what's done is done" },
    { target: "Tiene mucha mano izquierda para resolver conflictos.", english: "He's very tactful when resolving conflicts.", tags: ["general", "work"], grammar: "Tener mano izquierda — to be tactful/diplomatic" },
    { target: "Me cae muy bien tu compañera de trabajo.", english: "I really like your coworker.", tags: ["general", "work"] },
    { target: "Se me fue el santo al cielo y olvidé la cita.", english: "It completely slipped my mind and I forgot the appointment.", tags: ["general"], grammar: "Irse el santo al cielo — to completely forget, mind goes blank" },
    { target: "Si por mí fuera, nos iríamos de viaje mañana.", english: "If it were up to me, we'd go on a trip tomorrow.", tags: ["general", "travel"], grammar: "Si por mí fuera — if it were up to me" },
    { target: "Hablando del rey de Roma, mira quién viene.", english: "Speak of the devil, look who's coming.", tags: ["general"], grammar: "Hablando del rey de Roma — speak of the devil" },
    { target: "Le puso verde delante de todos en la oficina.", english: "She badmouthed him in front of everyone at the office.", tags: ["general", "work"], grammar: "Poner verde — to badmouth, criticize harshly" },
    { target: "No me apetece salir; estoy hecho polvo.", english: "I don't feel like going out; I'm exhausted.", tags: ["general"], grammar: "Estar hecho polvo — to be exhausted/destroyed" },
    { target: "Cada maestrillo tiene su librillo.", english: "Everyone has their own way of doing things.", tags: ["general"], grammar: "Proverb: cada maestrillo tiene su librillo — to each their own method" },
    { target: "No te andes con rodeos y dime qué pasó.", english: "Don't beat around the bush and tell me what happened.", tags: ["general"], grammar: "Andarse con rodeos — to beat around the bush" },
    { target: "Por si acaso, llévate un paraguas.", english: "Just in case, take an umbrella.", tags: ["general", "travel"] },
    { target: "A lo mejor deberíamos plantearnos otra estrategia.", english: "Maybe we should consider another strategy.", tags: ["general", "work"] },
    { target: "Se me hace bola tener que leer todo este informe.", english: "Reading this whole report feels like a drag.", tags: ["general", "work"], grammar: "Hacérsele bola — to feel overwhelming/tedious" },
    { target: "Le dieron gato por liebre en esa tienda.", english: "They ripped him off at that store.", tags: ["general"], grammar: "Dar gato por liebre — to rip someone off, deceive" },
    { target: "Me importa un bledo lo que piensen los demás.", english: "I couldn't care less what others think.", tags: ["general"], grammar: "Importar un bledo — to not care at all" },
    { target: "A ver si nos ponemos las pilas y terminamos esto.", english: "Let's get our act together and finish this.", tags: ["general", "work"], grammar: "Ponerse las pilas — to get one's act together, buckle down" },
    { target: "Me quedé de piedra cuando me dieron la noticia.", english: "I was stunned when they gave me the news.", tags: ["general"], grammar: "Quedarse de piedra — to be stunned/shocked" },
    { target: "Si te digo la verdad, no me lo esperaba para nada.", english: "To be honest, I didn't expect it at all.", tags: ["general"] },
    { target: "Vamos a ir al grano: necesitamos más presupuesto.", english: "Let's get to the point: we need more budget.", tags: ["general", "work"], grammar: "Ir al grano — to get to the point" },
    { target: "No hay mal que por bien no venga.", english: "Every cloud has a silver lining.", tags: ["general"], grammar: "Proverb: no hay mal que por bien no venga — every setback has a positive side" },
    { target: "Eso me suena a chino, explícamelo de otra forma.", english: "That sounds like Greek to me, explain it another way.", tags: ["general"], grammar: "Sonar a chino — to be incomprehensible (like Greek in English)" },
    { target: "Con las manos en la masa lo pillaron copiando.", english: "They caught him red-handed cheating.", tags: ["general"], grammar: "Con las manos en la masa — red-handed, caught in the act" },
  ],
};

// ─── MERGE NEW CARDS ─────────────────────────────────────────────

let added = 0;
let skipped = 0;

for (const [node, cards] of Object.entries(newCardsByNode)) {
  for (const card of cards) {
    const key = card.target.toLowerCase().trim();
    if (existingTargets.has(key)) {
      skipped++;
      continue;
    }

    const newCard = {
      id: nextId++,
      target: card.target,
      english: card.english,
      audio: "",
      tags: card.tags,
    };

    if (card.grammar) {
      newCard.grammar = card.grammar;
    }

    deck.push(newCard);
    existingTargets.add(key);
    added++;
  }
}

// ─── WRITE UPDATED DECK ─────────────────────────────────────────

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf-8');

console.log(`Added: ${added} cards`);
console.log(`Skipped (duplicates): ${skipped}`);
console.log(`New total: ${deck.length} cards`);

// Tag distribution summary
const tagCounts = {};
deck.forEach(c => (c.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
const total = deck.length;
console.log('\nTag distribution:');
for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${tag}: ${count} (${(count / total * 100).toFixed(1)}%)`);
}

const grammarCount = deck.filter(c => c.grammar).length;
console.log(`\nCards with grammar: ${grammarCount} (${(grammarCount / total * 100).toFixed(1)}%)`);
