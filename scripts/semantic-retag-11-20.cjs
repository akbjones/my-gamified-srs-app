/**
 * semantic-retag-11-20.cjs
 *
 * Two-pass script for cards in nodes 11-20 (indices 2500-4999):
 *
 * PASS 1 — Semantic Retag:
 *   Read each card's Spanish + English content and assign correct goal tags
 *   based on what the sentence is actually about. Never removes tags, only adds.
 *
 * PASS 2 — Generate New Cards:
 *   For any node where a goal is below target count, generate new cards
 *   that teach the same grammar in the context of the needed goal.
 *
 * Targets:
 *   B1 (nodes 11-15): 113 cards per goal per node (45% of 250)
 *   B2 (nodes 16-20): 88 cards per goal per node (35% of 250)
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

const PER_NODE = 250;
const GOALS = ['travel', 'work', 'family'];

// Node definitions for 11-20 — startIdx/endIdx are 0-based array indices (inclusive start, exclusive end for slice)
const NODE_DEFS = {
  11: { name: 'Comparatives & Superlatives', tier: 'B1', startIdx: 2500, endIdx: 2750 },
  12: { name: 'Future & Conditional', tier: 'B1', startIdx: 2750, endIdx: 3000 },
  13: { name: 'Present Subjunctive', tier: 'B1', startIdx: 3000, endIdx: 3250 },
  14: { name: 'Commands & Imperatives', tier: 'B1', startIdx: 3250, endIdx: 3500 },
  15: { name: 'Relative Clauses', tier: 'B1', startIdx: 3500, endIdx: 3750 },
  16: { name: 'Imperfect Subjunctive', tier: 'B2', startIdx: 3750, endIdx: 4000 },
  17: { name: 'Conditionals II & III', tier: 'B2', startIdx: 4000, endIdx: 4250 },
  18: { name: 'Passive & Impersonal', tier: 'B2', startIdx: 4250, endIdx: 4500 },
  19: { name: 'Advanced Connectors', tier: 'B2', startIdx: 4500, endIdx: 4750 },
  20: { name: 'Mastery', tier: 'B2', startIdx: 4750, endIdx: 5000 },
};

const TARGET_COUNT = {
  B1: 113, // 45% of 250
  B2: 88,  // 35% of 250
};

// ─────────────────────────────────────────────────────────────────────
// PASS 1: SEMANTIC RETAGGING
// ─────────────────────────────────────────────────────────────────────

// Keyword lists for semantic tagging — match against combined target+english text
const TRAVEL_KEYWORDS = [
  // Transportation
  /\b(aeropuerto|airport|vuelo|flight|avión|plane|tren\b|train\b|autobús|bus\b|taxi|metro\b|subway|estación\b|station\b|terminal|equipaje|luggage|maleta|suitcase|pasaporte|passport|billete|ticket|boleto|embarque|boarding|aterriz|landing|despeg|takeoff|ferry|crucero|cruise)\b/i,
  // Accommodation
  /\b(hotel|hostal|hostel|alojamiento|accommodation|check.?in|check.?out|albergue)\b/i,
  // Food/dining out (specific to dining out, not cooking at home)
  /\b(restaurante|restaurant|camarero|waiter|propina.*restaur|menú del día|menu of the day)\b/i,
  // Directions/navigation (travel-specific compound phrases)
  /\b(mapa|map\b|siga recto|go straight|gire a la|turn (right|left)|perdid[oa].*ciudad|lost.*city)\b/i,
  // Tourism/sightseeing
  /\b(turismo|tourism|turista|tourist|museo|museum|catedral|cathedral|monument|monumento|playa|beach|montaña|mountain|isla\b|island\b|excursión|excursion|guía turístic|tour guide|viaj[aeo]|travel|vacacion|vacation|holiday|recorr|tour\b|mirador|lookout|ruina|ruin|faro|lighthouse|templo|temple)\b/i,
  // Booking/reservations in travel context
  /\b(reserv.*hotel|reserv.*vuelo|reserv.*habitación|book.*hotel|book.*flight|book.*room)\b/i,
  // Shopping abroad
  /\b(souvenir|recuerdo|duty.?free|cambio.*moneda|currency.*exchange)\b/i,
  // Countries/cities as destinations
  /\b(país.*visit|country.*visit|destino|destination|frontera|border|aduana|customs|visa\b)\b/i,
];

const WORK_KEYWORDS = [
  // Office/workplace
  /\b(oficina|office\b|empresa|company|negocio|business|corporativ|corporate|despacho)\b/i,
  // People at work
  /\b(jefe\b|boss\b|colega|colleague|compañero.*trabajo|coworker|empleado|employee|cliente|client\b|gerente|manager\b|supervisor|secretari)\b/i,
  // Work activities
  /\b(reunión|meeting\b|presentación|presentation|informe\b|report\b|contrato|contract|presupuesto|budget|plazo\b|deadline|factura|invoice)\b/i,
  // Communication at work
  /\b(correo|email|videoconferencia|conference call)\b/i,
  // Career
  /\b(entrevista|interview|curriculum|ascenso|promotion|despido|fired|sueldo|salary|nómina|payroll|turno\b|shift\b)\b/i,
  // Work tools
  /\b(impresora|printer|servidor|server\b|documento|document|formulario)\b/i,
  // Work verbs/contexts
  /\b(trabaj[aoe]|firmar\b|sign.*contract|contratar|hire\b|negociar|negotiate|invertir|invest\b|facturar)\b/i,
];

const FAMILY_KEYWORDS = [
  // Family members (strong indicators)
  /\b(madre|mother|padre|father|mamá|mom\b|papá|dad\b|hermano|brother|hermana|sister|hijo\b|son\b|hija\b|daughter|abuelo|grandfather|abuela|grandmother|tío\b|uncle|tía\b|aunt|primo\b|cousin|sobrino|nephew|sobrina|niece|nieto|grandchild|suegr|in-law|cuñad|brother-in-law|bebé|baby|familia|family)\b/i,
  // Children
  /\b(niño|niña|child|children|kid)\b/i,
  // Home life (compound phrases to avoid false positives)
  /\b(en casa|at home|hogar|jardín|garden\b|garaje|garage|sofá|couch)\b/i,
  // Domestic activities
  /\b(cocinar|cook\b|limpiar.*casa|clean.*house|barrer|sweep|fregar|wash.*dish|lavar.*ropa|laundry|planchar|iron\b|receta\b|recipe|cenar.*juntos|dinner.*together)\b/i,
  // Relationships/life events
  /\b(cumpleaños|birthday|boda|wedding|aniversario|anniversary|nacimiento|birth\b|embaraz|pregnan|crecer|grow.*up|infancia|childhood|mascota|pet\b|perro|dog\b|gato\b|cat\b|vecino|neighbor)\b/i,
  // Home care
  /\b(basura|trash|mudanza|moving|alquiler.*piso|rent.*apartment)\b/i,
];

function semanticTag(card) {
  const text = `${card.target} ${card.english}`.toLowerCase();
  const tags = new Set(card.tags || ['general']);
  let changed = false;

  // Check travel
  if (!tags.has('travel')) {
    for (const rx of TRAVEL_KEYWORDS) {
      if (rx.test(text)) {
        tags.add('travel');
        changed = true;
        break;
      }
    }
  }

  // Check work
  if (!tags.has('work')) {
    for (const rx of WORK_KEYWORDS) {
      if (rx.test(text)) {
        tags.add('work');
        changed = true;
        break;
      }
    }
  }

  // Check family
  if (!tags.has('family')) {
    for (const rx of FAMILY_KEYWORDS) {
      if (rx.test(text)) {
        tags.add('family');
        changed = true;
        break;
      }
    }
  }

  // Ensure 'general' is always present
  tags.add('general');

  if (changed) {
    card.tags = Array.from(tags);
  }
  return changed;
}

// ─────────────────────────────────────────────────────────────────────
// PASS 2: NEW CARD GENERATION (for gaps)
// ─────────────────────────────────────────────────────────────────────
// These are hand-written, natural Spanish sentences organized by node grammar + goal.
// Each entry: [target, english, goalTags]

const NEW_CARDS = {
  // ═══════════════════════════════════════════════════════════════════
  // NODE 11: Comparatives & Superlatives (B1)
  // ═══════════════════════════════════════════════════════════════════
  11: {
    travel: [
      ["Este hotel es más cómodo que el anterior.", "This hotel is more comfortable than the previous one."],
      ["La playa del sur es menos turística que la del norte.", "The southern beach is less touristy than the northern one."],
      ["El vuelo directo es más caro que el con escala.", "The direct flight is more expensive than the one with a layover."],
      ["Esta ciudad es la más bonita que he visitado.", "This city is the most beautiful I've visited."],
      ["El tren es tan rápido como el autobús, pero más cómodo.", "The train is as fast as the bus, but more comfortable."],
      ["La habitación doble es mejor que la individual.", "The double room is better than the single."],
      ["Este museo es el más interesante de toda la ciudad.", "This museum is the most interesting in the whole city."],
      ["El taxi es más rápido que el metro a esta hora.", "The taxi is faster than the subway at this hour."],
      ["La comida callejera es tan buena como la del restaurante.", "The street food is as good as the restaurant's."],
      ["Este aeropuerto es el peor en el que he estado.", "This airport is the worst I've been to."],
      ["La excursión de hoy fue más divertida que la de ayer.", "Today's excursion was more fun than yesterday's."],
      ["El hostal es menos caro pero más ruidoso que el hotel.", "The hostel is less expensive but noisier than the hotel."],
      ["Esta playa es la más limpia de la costa.", "This beach is the cleanest on the coast."],
      ["El guía habla mejor español que inglés.", "The guide speaks better Spanish than English."],
      ["Viajar en temporada baja es mucho más barato.", "Traveling in low season is much cheaper."],
      ["El mercado central es más auténtico que las tiendas turísticas.", "The central market is more authentic than the tourist shops."],
      ["Esta isla es más pequeña pero más tranquila que la otra.", "This island is smaller but quieter than the other."],
      ["El desayuno del hotel es el mejor que he probado.", "The hotel breakfast is the best I've tried."],
      ["La catedral es más antigua que el castillo.", "The cathedral is older than the castle."],
      ["Este vuelo es el más largo que he tomado.", "This flight is the longest I've taken."],
      ["El clima aquí es más seco que en mi país.", "The weather here is drier than in my country."],
      ["La estación de tren está más lejos de lo que pensaba.", "The train station is farther than I thought."],
      ["Este pueblo costero es el más encantador de la región.", "This coastal town is the most charming in the region."],
      ["El equipaje de mano es más práctico que facturar maletas.", "Carry-on luggage is more practical than checking bags."],
      ["La vista desde este mirador es la más espectacular.", "The view from this lookout is the most spectacular."],
    ],
    work: [
      ["Mi jefe es más exigente que el anterior.", "My boss is more demanding than the previous one."],
      ["Esta oficina es más grande que la de Madrid.", "This office is bigger than the one in Madrid."],
      ["El proyecto nuevo es tan importante como el anterior.", "The new project is as important as the previous one."],
      ["La reunión de hoy fue más productiva que la de la semana pasada.", "Today's meeting was more productive than last week's."],
      ["Este informe es el mejor que hemos presentado.", "This report is the best we've presented."],
      ["Mi sueldo es menor que el promedio del sector.", "My salary is lower than the sector average."],
      ["La empresa competidora es más grande que la nuestra.", "The competing company is bigger than ours."],
      ["Este candidato es el más cualificado de todos.", "This candidate is the most qualified of all."],
      ["El plazo es más corto de lo que esperábamos.", "The deadline is shorter than we expected."],
      ["Tu presentación fue mejor que la mía.", "Your presentation was better than mine."],
      ["La nueva impresora es más rápida que la antigua.", "The new printer is faster than the old one."],
      ["Este contrato es más favorable que el último.", "This contract is more favorable than the last one."],
      ["El departamento de ventas es el más eficiente.", "The sales department is the most efficient."],
      ["Mi colega tiene más experiencia que yo en este campo.", "My colleague has more experience than me in this field."],
      ["La versión final es mucho mejor que el borrador.", "The final version is much better than the draft."],
      ["Este software es el más fácil de usar.", "This software is the easiest to use."],
      ["El presupuesto de este año es mayor que el del año pasado.", "This year's budget is bigger than last year's."],
      ["La entrevista fue más difícil de lo que esperaba.", "The interview was harder than I expected."],
      ["El turno de noche es peor que el de día.", "The night shift is worse than the day shift."],
      ["Esta sucursal es la más rentable de la red.", "This branch is the most profitable in the network."],
      ["El nuevo sistema es tan complejo como el anterior.", "The new system is as complex as the previous one."],
      ["Mi escritorio es más pequeño que el de mi compañero.", "My desk is smaller than my coworker's."],
      ["El cliente está más satisfecho que el mes pasado.", "The client is more satisfied than last month."],
      ["La carga de trabajo es mayor en diciembre.", "The workload is higher in December."],
      ["Este producto es el más vendido de nuestro catálogo.", "This product is the best-selling in our catalog."],
    ],
    family: [
      ["Mi hermano mayor es más alto que mi padre.", "My older brother is taller than my father."],
      ["La casa nueva es más espaciosa que el apartamento.", "The new house is more spacious than the apartment."],
      ["Mi abuela cocina mejor que nadie.", "My grandmother cooks better than anyone."],
      ["El perro es más juguetón que el gato.", "The dog is more playful than the cat."],
      ["Mi hijo es el más pequeño de la clase.", "My son is the smallest in his class."],
      ["La sopa de mamá es la más rica del mundo.", "Mom's soup is the most delicious in the world."],
      ["Mi hermana es tan inteligente como mi padre.", "My sister is as smart as my father."],
      ["El jardín está más bonito que el año pasado.", "The garden looks nicer than last year."],
      ["Los domingos son más tranquilos que los sábados en casa.", "Sundays are calmer than Saturdays at home."],
      ["Tu hijo es más educado que la mayoría de los niños.", "Your child is more polite than most kids."],
      ["La habitación de mi hija es más ordenada que la de mi hijo.", "My daughter's room is tidier than my son's."],
      ["Mi vecino es el más amable del barrio.", "My neighbor is the friendliest in the neighborhood."],
      ["La tarta de cumpleaños era más grande que la del año pasado.", "The birthday cake was bigger than last year's."],
      ["Mi prima es mayor que yo pero parece más joven.", "My cousin is older than me but looks younger."],
      ["El bebé duerme mejor que antes.", "The baby sleeps better than before."],
      ["La casa de mis abuelos es la más acogedora.", "My grandparents' house is the coziest."],
      ["Mi padre es más paciente que mi madre.", "My father is more patient than my mother."],
      ["La cocina nueva es mucho más práctica que la anterior.", "The new kitchen is much more practical than the old one."],
      ["Mi tía es la mejor repostera de la familia.", "My aunt is the best baker in the family."],
      ["Los niños están más contentos en el jardín que dentro de casa.", "The kids are happier in the garden than inside the house."],
      ["Mi sobrino es el más travieso de todos los primos.", "My nephew is the naughtiest of all the cousins."],
      ["El sofá nuevo es más cómodo que el viejo.", "The new couch is more comfortable than the old one."],
      ["Mi hermana menor es más alta que mi hermana mayor.", "My younger sister is taller than my older sister."],
      ["El cumpleaños de este año fue mejor que el anterior.", "This year's birthday was better than last year's."],
      ["Nuestra mascota es la más mimada del vecindario.", "Our pet is the most spoiled in the neighborhood."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 12: Future & Conditional (B1)
  // ═══════════════════════════════════════════════════════════════════
  12: {
    travel: [
      ["Mañana visitaremos el casco antiguo.", "Tomorrow we'll visit the old town."],
      ["¿Reservarás el hotel o prefieres un hostal?", "Will you book the hotel or do you prefer a hostel?"],
      ["El vuelo saldrá a las siete de la mañana.", "The flight will leave at seven in the morning."],
      ["Si llueve, iríamos al museo en vez de a la playa.", "If it rains, we'd go to the museum instead of the beach."],
      ["Yo viajaría en primera clase si pudiera.", "I would travel first class if I could."],
      ["¿Cuánto costará el billete de tren?", "How much will the train ticket cost?"],
      ["Te enviaré las fotos del viaje cuando llegue.", "I'll send you the trip photos when I arrive."],
      ["El guía nos recogerá en el hotel a las nueve.", "The guide will pick us up at the hotel at nine."],
      ["Me encantaría conocer Japón algún día.", "I'd love to visit Japan someday."],
      ["El ferry tardará unas dos horas en llegar.", "The ferry will take about two hours to arrive."],
      ["Si tuviéramos más tiempo, visitaríamos más pueblos.", "If we had more time, we'd visit more villages."],
      ["Habrá que cambiar dinero antes de cruzar la frontera.", "We'll need to exchange money before crossing the border."],
      ["El próximo verano iremos a la costa mediterránea.", "Next summer we'll go to the Mediterranean coast."],
      ["¿Me recomendarías algún restaurante local?", "Would you recommend a local restaurant to me?"],
      ["Pasaremos tres noches en Barcelona.", "We'll spend three nights in Barcelona."],
      ["Si el tiempo mejora, alquilaremos una bicicleta.", "If the weather improves, we'll rent a bicycle."],
      ["El tren llegará con veinte minutos de retraso.", "The train will arrive twenty minutes late."],
      ["Me gustaría probar la comida típica de la zona.", "I'd like to try the local cuisine."],
      ["¿Necesitaremos visa para entrar en ese país?", "Will we need a visa to enter that country?"],
      ["Volveremos el domingo por la tarde.", "We'll come back Sunday afternoon."],
      ["El autobús turístico pasará por aquí cada media hora.", "The tourist bus will come by here every half hour."],
      ["Si no encuentro hotel, dormiría en un albergue.", "If I can't find a hotel, I'd sleep in a hostel."],
      ["La agencia nos confirmará la reserva mañana.", "The agency will confirm our reservation tomorrow."],
      ["¿Cuántos días necesitaríamos para recorrer el sur?", "How many days would we need to tour the south?"],
      ["Llegaremos al aeropuerto con tiempo de sobra.", "We'll get to the airport with plenty of time."],
    ],
    work: [
      ["Terminaré el informe antes del viernes.", "I'll finish the report before Friday."],
      ["¿Podrías enviarme el presupuesto por correo?", "Could you send me the budget by email?"],
      ["La empresa abrirá una nueva oficina en septiembre.", "The company will open a new office in September."],
      ["Si me ascienden, tendré más responsabilidades.", "If they promote me, I'll have more responsibilities."],
      ["Yo aceptaría la oferta sin dudarlo.", "I would accept the offer without hesitation."],
      ["El cliente confirmará el pedido mañana.", "The client will confirm the order tomorrow."],
      ["¿Cuándo publicarán los resultados del trimestre?", "When will they publish the quarterly results?"],
      ["Necesitaré más tiempo para terminar este proyecto.", "I'll need more time to finish this project."],
      ["¿Te importaría revisar mi presentación?", "Would you mind reviewing my presentation?"],
      ["La reunión será a las diez en la sala grande.", "The meeting will be at ten in the large room."],
      ["Si contratamos a alguien más, todo iría mejor.", "If we hired someone else, everything would go better."],
      ["El nuevo software facilitará mucho el trabajo.", "The new software will make work much easier."],
      ["Firmaré el contrato la próxima semana.", "I'll sign the contract next week."],
      ["¿Crees que nos aprobarán el presupuesto?", "Do you think they'll approve our budget?"],
      ["Mi jefe me dará la respuesta el lunes.", "My boss will give me the answer on Monday."],
      ["Haría horas extra si pagaran más.", "I'd work overtime if they paid more."],
      ["La empresa invertirá en nuevas tecnologías.", "The company will invest in new technologies."],
      ["¿Cuánto tardarás en preparar el informe?", "How long will it take you to prepare the report?"],
      ["El departamento crecerá el próximo año.", "The department will grow next year."],
      ["No creo que el jefe aceptaría esa propuesta.", "I don't think the boss would accept that proposal."],
      ["Entregaremos el proyecto a final de mes.", "We'll deliver the project at the end of the month."],
      ["La videoconferencia empezará en diez minutos.", "The video conference will start in ten minutes."],
      ["Si termino pronto, ayudaré con tu parte.", "If I finish early, I'll help with your part."],
      ["¿Convocarán una reunión extraordinaria?", "Will they call an extraordinary meeting?"],
      ["El director presentará los cambios en la asamblea.", "The director will present the changes at the assembly."],
    ],
    family: [
      ["Mis padres vendrán a cenar el domingo.", "My parents will come for dinner on Sunday."],
      ["¿Llamarás a tu hermana por su cumpleaños?", "Will you call your sister for her birthday?"],
      ["Los niños crecerán muy rápido.", "The kids will grow up very fast."],
      ["Si mi madre se entera, se enfadará.", "If my mother finds out, she'll be angry."],
      ["Yo le compraría un perro a mi hijo.", "I'd buy my son a dog."],
      ["Mi abuela cumplirá ochenta años en abril.", "My grandmother will turn eighty in April."],
      ["¿Cuándo pintaremos la habitación del bebé?", "When will we paint the baby's room?"],
      ["Los abuelos cuidarán a los niños este fin de semana.", "The grandparents will look after the kids this weekend."],
      ["¿Le dirás a papá lo que pasó?", "Will you tell dad what happened?"],
      ["Haríamos una fiesta sorpresa para mamá.", "We'd throw a surprise party for mom."],
      ["Mi hermano se mudará a un piso más grande.", "My brother will move to a bigger apartment."],
      ["Si ahorramos, podríamos reformar la cocina.", "If we save, we could remodel the kitchen."],
      ["El bebé caminará pronto.", "The baby will walk soon."],
      ["Prepararé la cena mientras tú bañas a los niños.", "I'll make dinner while you bathe the kids."],
      ["¿Vendrán tus primos a la boda?", "Will your cousins come to the wedding?"],
      ["La semana que viene celebraremos el aniversario.", "Next week we'll celebrate the anniversary."],
      ["Si tuviéramos jardín, adoptaríamos otro perro.", "If we had a garden, we'd adopt another dog."],
      ["Mi hija empezará el colegio en septiembre.", "My daughter will start school in September."],
      ["¿Necesitaremos una canguro para el sábado?", "Will we need a babysitter for Saturday?"],
      ["Tu madre te llamará cuando llegue a casa.", "Your mother will call you when she gets home."],
      ["El próximo verano haremos una barbacoa en el jardín.", "Next summer we'll have a barbecue in the garden."],
      ["Mi tío nos traerá algo del pueblo.", "My uncle will bring us something from the village."],
      ["¿Dejarías que tus hijos fueran solos al parque?", "Would you let your kids go to the park alone?"],
      ["Recogeré a mi sobrina del colegio.", "I'll pick up my niece from school."],
      ["Si llueve, jugaríamos a juegos de mesa en casa.", "If it rains, we'd play board games at home."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 13: Present Subjunctive (B1)
  // ═══════════════════════════════════════════════════════════════════
  13: {
    travel: [
      ["Espero que el vuelo no se retrase.", "I hope the flight isn't delayed."],
      ["Ojalá que haga buen tiempo en la playa.", "I hope the weather is nice at the beach."],
      ["Es mejor que reserves el hotel con antelación.", "It's better that you book the hotel in advance."],
      ["Dudo que encontremos entradas para el museo hoy.", "I doubt we'll find tickets for the museum today."],
      ["Quiero que me recomiendes un buen restaurante.", "I want you to recommend a good restaurant to me."],
      ["No creo que el autobús pase por aquí.", "I don't think the bus comes through here."],
      ["Es necesario que lleves el pasaporte.", "It's necessary that you bring your passport."],
      ["Espero que la habitación tenga vista al mar.", "I hope the room has a sea view."],
      ["Ojalá que el guía hable español.", "I hope the guide speaks Spanish."],
      ["Es importante que lleguemos temprano al aeropuerto.", "It's important that we arrive at the airport early."],
      ["No creo que haya plazas libres en ese tren.", "I don't think there are seats available on that train."],
      ["Quiero que visitemos el mercado local.", "I want us to visit the local market."],
      ["Espero que el taxi no tarde mucho.", "I hope the taxi doesn't take too long."],
      ["Es probable que llueva durante la excursión.", "It's likely that it'll rain during the excursion."],
      ["Ojalá que consigamos un vuelo barato.", "I hope we get a cheap flight."],
      ["Necesito que me ayudes con el equipaje.", "I need you to help me with the luggage."],
      ["Es raro que este monumento esté cerrado hoy.", "It's strange that this monument is closed today."],
      ["Quiero que probemos la comida típica de aquí.", "I want us to try the local cuisine here."],
      ["Espero que el hotel incluya desayuno.", "I hope the hotel includes breakfast."],
      ["Dudo que el ferry salga con esta tormenta.", "I doubt the ferry will leave in this storm."],
      ["Es mejor que cambiemos dinero en el centro.", "It's better that we exchange money downtown."],
      ["Ojalá que la playa no esté muy llena.", "I hope the beach isn't too crowded."],
      ["Quiero que el viaje sea inolvidable.", "I want the trip to be unforgettable."],
      ["No es seguro que abran la frontera mañana.", "It's not certain they'll open the border tomorrow."],
      ["Es imprescindible que confirmes la reserva.", "It's essential that you confirm the reservation."],
    ],
    work: [
      ["Espero que el jefe apruebe mi propuesta.", "I hope the boss approves my proposal."],
      ["Es necesario que terminemos el informe hoy.", "It's necessary that we finish the report today."],
      ["Dudo que nos den el contrato.", "I doubt they'll give us the contract."],
      ["Quiero que revises los números antes de la reunión.", "I want you to check the numbers before the meeting."],
      ["Es importante que todos asistan a la presentación.", "It's important that everyone attends the presentation."],
      ["No creo que el cliente acepte ese precio.", "I don't think the client will accept that price."],
      ["Ojalá que me asciendan este año.", "I hope they promote me this year."],
      ["Es mejor que envíes el correo antes de las cinco.", "It's better that you send the email before five."],
      ["Necesito que alguien me cubra el turno de mañana.", "I need someone to cover my shift tomorrow."],
      ["Es probable que la empresa contrate más personal.", "It's likely the company will hire more staff."],
      ["Espero que la reunión no se alargue demasiado.", "I hope the meeting doesn't go on too long."],
      ["Quiero que el equipo trabaje con más coordinación.", "I want the team to work with more coordination."],
      ["Dudo que aprueben el presupuesto completo.", "I doubt they'll approve the full budget."],
      ["Es raro que el sistema falle a esta hora.", "It's strange that the system crashes at this time."],
      ["Ojalá que resuelvan el problema del servidor pronto.", "I hope they fix the server problem soon."],
      ["No es seguro que haya puestos vacantes.", "It's not certain there are open positions."],
      ["Es imprescindible que firmemos el acuerdo hoy.", "It's essential that we sign the agreement today."],
      ["Espero que el nuevo empleado se adapte rápido.", "I hope the new employee adapts quickly."],
      ["Es necesario que actualicemos la base de datos.", "It's necessary that we update the database."],
      ["Quiero que me expliques el nuevo procedimiento.", "I want you to explain the new procedure to me."],
      ["No creo que el plazo sea suficiente.", "I don't think the deadline is enough."],
      ["Ojalá que la entrevista salga bien.", "I hope the interview goes well."],
      ["Es mejor que consultemos con el departamento legal.", "It's better that we consult with the legal department."],
      ["Dudo que podamos entregar el proyecto a tiempo.", "I doubt we can deliver the project on time."],
      ["Espero que todos contribuyan al proyecto por igual.", "I hope everyone contributes to the project equally."],
    ],
    family: [
      ["Espero que los niños se porten bien.", "I hope the kids behave well."],
      ["Quiero que mi hija estudie más.", "I want my daughter to study more."],
      ["Es importante que cenemos juntos en familia.", "It's important that we have dinner together as a family."],
      ["Ojalá que mi madre se recupere pronto.", "I hope my mother recovers soon."],
      ["Dudo que mi hermano venga a la reunión familiar.", "I doubt my brother will come to the family gathering."],
      ["Es mejor que los niños se acuesten temprano.", "It's better that the kids go to bed early."],
      ["Necesito que alguien cuide al bebé esta tarde.", "I need someone to take care of the baby this afternoon."],
      ["No creo que mi padre esté de acuerdo.", "I don't think my father will agree."],
      ["Es necesario que ordenemos la casa antes de que vengan.", "It's necessary that we tidy up the house before they come."],
      ["Quiero que mis hijos aprendan a cocinar.", "I want my kids to learn to cook."],
      ["Espero que la abuela pueda venir al cumpleaños.", "I hope grandma can come to the birthday."],
      ["Es raro que el perro no haya comido.", "It's strange that the dog hasn't eaten."],
      ["Ojalá que consigamos entradas para el parque.", "I hope we get tickets to the park."],
      ["Es probable que mi primo se case el próximo año.", "It's likely my cousin will get married next year."],
      ["No es bueno que los niños pasen tanto tiempo con la pantalla.", "It's not good for the kids to spend so much screen time."],
      ["Quiero que la cena de Navidad sea especial.", "I want Christmas dinner to be special."],
      ["Es imprescindible que el bebé duerma su siesta.", "It's essential that the baby takes his nap."],
      ["Espero que mi hermana me perdone.", "I hope my sister forgives me."],
      ["Dudo que mi tío venda la casa del pueblo.", "I doubt my uncle will sell the village house."],
      ["Es mejor que hablemos con los vecinos sobre el ruido.", "It's better that we talk to the neighbors about the noise."],
      ["Ojalá que los niños disfruten de las vacaciones.", "I hope the kids enjoy the vacation."],
      ["Necesito que mi marido me ayude con la compra.", "I need my husband to help me with the shopping."],
      ["Es importante que los abuelos pasen tiempo con los nietos.", "It's important that grandparents spend time with grandchildren."],
      ["No creo que el bebé tenga hambre.", "I don't think the baby is hungry."],
      ["Quiero que nuestra familia esté siempre unida.", "I want our family to always stay close."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 14: Commands & Imperatives (B1)
  // ═══════════════════════════════════════════════════════════════════
  14: {
    travel: [
      ["Pase por aquí, por favor.", "Come this way, please."],
      ["No olvides llevar protector solar.", "Don't forget to bring sunscreen."],
      ["Muéstreme su tarjeta de embarque.", "Show me your boarding pass."],
      ["Tome la segunda calle a la derecha.", "Take the second street on the right."],
      ["Ponga su equipaje en la cinta.", "Put your luggage on the belt."],
      ["No se aleje del grupo.", "Don't stray from the group."],
      ["Abroche su cinturón, por favor.", "Fasten your seatbelt, please."],
      ["Dime dónde está la parada de autobús.", "Tell me where the bus stop is."],
      ["Reserve la habitación con antelación.", "Book the room in advance."],
      ["Saque las fotos desde este mirador.", "Take the photos from this viewpoint."],
      ["No pierda el billete de vuelta.", "Don't lose the return ticket."],
      ["Cambie dinero en la oficina de cambio.", "Exchange money at the exchange office."],
      ["Siga las señales hacia la salida.", "Follow the signs to the exit."],
      ["Prueba la paella en este restaurante.", "Try the paella at this restaurant."],
      ["No dejes la maleta sin vigilar.", "Don't leave your suitcase unattended."],
      ["Confirma la reserva antes de ir.", "Confirm the reservation before going."],
      ["Apague su teléfono durante el vuelo.", "Turn off your phone during the flight."],
      ["Lleva un paraguas por si acaso.", "Bring an umbrella just in case."],
      ["Compra los souvenirs en el mercado local.", "Buy the souvenirs at the local market."],
      ["Suba al autobús por la puerta delantera.", "Get on the bus through the front door."],
      ["No te olvides de sellar el billete.", "Don't forget to stamp your ticket."],
      ["Enseñe el pasaporte en la aduana.", "Show your passport at customs."],
      ["Busca un hotel cerca de la estación.", "Look for a hotel near the station."],
      ["No coja un taxi sin taxímetro.", "Don't take a taxi without a meter."],
      ["Pregunta por el menú del día.", "Ask for the menu of the day."],
    ],
    work: [
      ["Envíe el informe antes de las cinco.", "Send the report before five."],
      ["No llegues tarde a la reunión.", "Don't be late to the meeting."],
      ["Revisa los datos otra vez.", "Check the data again."],
      ["Firme aquí, por favor.", "Sign here, please."],
      ["Prepare la presentación para mañana.", "Prepare the presentation for tomorrow."],
      ["No se olvide de copiar al director.", "Don't forget to copy the director."],
      ["Llama al cliente para confirmar.", "Call the client to confirm."],
      ["Guarde una copia del documento.", "Save a copy of the document."],
      ["Actualiza la hoja de cálculo.", "Update the spreadsheet."],
      ["No abra archivos de remitentes desconocidos.", "Don't open files from unknown senders."],
      ["Habla con tu supervisor sobre el problema.", "Talk to your supervisor about the problem."],
      ["Imprima diez copias del contrato.", "Print ten copies of the contract."],
      ["Convoca una reunión de emergencia.", "Call an emergency meeting."],
      ["No compartas la contraseña con nadie.", "Don't share the password with anyone."],
      ["Responda al correo del cliente hoy.", "Reply to the client's email today."],
      ["Organiza los archivos por fecha.", "Organize the files by date."],
      ["Tome notas durante la reunión.", "Take notes during the meeting."],
      ["Pide presupuesto a tres proveedores.", "Ask for quotes from three suppliers."],
      ["No modifiques el contrato sin permiso.", "Don't modify the contract without permission."],
      ["Agenda la videoconferencia para el jueves.", "Schedule the video conference for Thursday."],
      ["Cierre la sesión cuando termine.", "Log out when you finish."],
      ["Entrégame el expediente del caso.", "Hand me the case file."],
      ["No descuides los plazos de entrega.", "Don't neglect the delivery deadlines."],
      ["Registra las horas extra en el sistema.", "Log the overtime hours in the system."],
      ["Redacta un borrador del acuerdo.", "Draft a version of the agreement."],
    ],
    family: [
      ["Recoge tu cuarto antes de salir.", "Clean up your room before going out."],
      ["No te acuestes tan tarde.", "Don't go to bed so late."],
      ["Ayuda a tu hermana con la tarea.", "Help your sister with her homework."],
      ["Pon la mesa para la cena.", "Set the table for dinner."],
      ["Lávate las manos antes de comer.", "Wash your hands before eating."],
      ["No grites dentro de casa.", "Don't yell inside the house."],
      ["Llama a tu abuela, que está preocupada.", "Call your grandmother, she's worried."],
      ["Saca al perro a pasear.", "Take the dog for a walk."],
      ["No molestes a tu hermano.", "Don't bother your brother."],
      ["Cierra la puerta con llave.", "Lock the door."],
      ["Haz la cama antes de desayunar.", "Make the bed before breakfast."],
      ["Dale de comer al gato.", "Feed the cat."],
      ["No te olvides del cumpleaños de mamá.", "Don't forget mom's birthday."],
      ["Baja la basura antes de acostarte.", "Take the trash down before going to bed."],
      ["Apaga las luces cuando salgas.", "Turn off the lights when you leave."],
      ["Compra leche de camino a casa.", "Buy milk on the way home."],
      ["No comas tantas golosinas.", "Don't eat so many sweets."],
      ["Cuida a tu hermanito mientras salgo.", "Watch your little brother while I go out."],
      ["Ven a cenar, que ya está listo.", "Come to dinner, it's ready."],
      ["No toques el horno, está caliente.", "Don't touch the oven, it's hot."],
      ["Riega las plantas del balcón.", "Water the plants on the balcony."],
      ["Guarda los juguetes en su sitio.", "Put the toys back in their place."],
      ["Lleva la ropa sucia al cesto.", "Take the dirty clothes to the hamper."],
      ["No dejes el grifo abierto.", "Don't leave the faucet running."],
      ["Dile a papá que la cena está lista.", "Tell dad dinner is ready."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 15: Relative Clauses (B1)
  // ═══════════════════════════════════════════════════════════════════
  15: {
    travel: [
      ["El hotel en el que nos alojamos tenía piscina.", "The hotel we stayed at had a pool."],
      ["La ciudad que visitamos fue preciosa.", "The city we visited was beautiful."],
      ["El restaurante donde cenamos estaba muy lleno.", "The restaurant where we had dinner was very full."],
      ["El guía que nos atendió hablaba tres idiomas.", "The guide who helped us spoke three languages."],
      ["La playa a la que fuimos estaba desierta.", "The beach we went to was deserted."],
      ["El avión en el que volamos era muy nuevo.", "The plane we flew on was very new."],
      ["La calle por la que pasamos tenía muchas tiendas.", "The street we walked down had many shops."],
      ["El museo que más me gustó fue el de arte moderno.", "The museum I liked the most was the modern art one."],
      ["La excursión que hicimos duró todo el día.", "The excursion we went on lasted all day."],
      ["El pueblo al que llegamos estaba en la montaña.", "The village we arrived at was in the mountains."],
      ["El tren que tomamos iba con retraso.", "The train we took was running late."],
      ["La comida que probamos era deliciosa.", "The food we tried was delicious."],
      ["El taxi que cogimos nos cobró de más.", "The taxi we took overcharged us."],
      ["La isla a la que queremos ir tiene volcanes.", "The island we want to go to has volcanoes."],
      ["El mercado donde compramos recuerdos era enorme.", "The market where we bought souvenirs was huge."],
      ["El hostal en el que dormimos estaba muy limpio.", "The hostel we slept in was very clean."],
      ["La carretera por la que fuimos tenía curvas peligrosas.", "The road we drove on had dangerous curves."],
      ["El vuelo que reservé hace escala en Lisboa.", "The flight I booked has a layover in Lisbon."],
      ["La catedral que visitamos tiene quinientos años.", "The cathedral we visited is five hundred years old."],
      ["El barrio donde nos perdimos era muy pintoresco.", "The neighborhood where we got lost was very picturesque."],
      ["El bar al que fuimos tenía terraza.", "The bar we went to had a terrace."],
      ["La maleta que facturé no ha llegado.", "The suitcase I checked in hasn't arrived."],
      ["El viaje que planeamos será por toda la costa.", "The trip we're planning will be along the whole coast."],
      ["La torre desde la que sacamos fotos era altísima.", "The tower we took photos from was very tall."],
      ["El autobús que viene ahora va al centro.", "The bus that's coming now goes downtown."],
    ],
    work: [
      ["El colega que me ayudó es muy amable.", "The colleague who helped me is very kind."],
      ["La oficina donde trabajo tiene buena iluminación.", "The office where I work has good lighting."],
      ["El informe que escribí fue aprobado.", "The report I wrote was approved."],
      ["La empresa en la que trabajo tiene doscientos empleados.", "The company I work at has two hundred employees."],
      ["El cliente al que llamé quiere cambiar el pedido.", "The client I called wants to change the order."],
      ["La reunión que tuvimos fue muy útil.", "The meeting we had was very useful."],
      ["El software que usamos es bastante antiguo.", "The software we use is quite old."],
      ["La presentación que preparé duró veinte minutos.", "The presentation I prepared lasted twenty minutes."],
      ["El proyecto en el que estoy es muy interesante.", "The project I'm on is very interesting."],
      ["El jefe al que le entregué el informe está de viaje.", "The boss I handed the report to is traveling."],
      ["La sala donde hacemos las reuniones es pequeña.", "The room where we hold meetings is small."],
      ["El contrato que firmamos tiene tres años de duración.", "The contract we signed lasts three years."],
      ["El candidato que entrevistamos ayer tenía mucha experiencia.", "The candidate we interviewed yesterday had a lot of experience."],
      ["El departamento para el que trabajo necesita más gente.", "The department I work for needs more people."],
      ["La compañera con la que almuerzo es de contabilidad.", "The coworker I have lunch with is from accounting."],
      ["El correo que envié ayer no ha llegado.", "The email I sent yesterday hasn't arrived."],
      ["El plazo que nos dieron es demasiado corto.", "The deadline they gave us is too short."],
      ["La persona que me entrevistó fue muy profesional.", "The person who interviewed me was very professional."],
      ["El documento que necesitas está en la carpeta azul.", "The document you need is in the blue folder."],
      ["La empresa para la que trabajaba antes era más pequeña.", "The company I used to work for was smaller."],
      ["El ordenador que me asignaron va muy lento.", "The computer they assigned me is very slow."],
      ["El proveedor con el que negociamos ofrece buen precio.", "The supplier we negotiate with offers a good price."],
      ["La oferta que rechacé era mejor de lo que pensaba.", "The offer I turned down was better than I thought."],
      ["El turno que me toca esta semana es el de noche.", "The shift I have this week is the night one."],
      ["La formación que recibimos fue muy completa.", "The training we received was very thorough."],
    ],
    family: [
      ["La casa donde crecí ya no existe.", "The house where I grew up no longer exists."],
      ["Mi hermana, que vive en Madrid, vendrá a visitarnos.", "My sister, who lives in Madrid, will come visit us."],
      ["El perro que adoptamos es muy cariñoso.", "The dog we adopted is very affectionate."],
      ["La receta que me enseñó mi abuela es la mejor.", "The recipe my grandmother taught me is the best."],
      ["Los vecinos que se mudaron eran muy simpáticos.", "The neighbors who moved were very nice."],
      ["El regalo que le hicimos a mamá le encantó.", "The gift we gave mom she loved."],
      ["La habitación que pintamos es la del bebé.", "The room we painted is the baby's."],
      ["Mi primo, al que no veía desde hace años, está enorme.", "My cousin, whom I hadn't seen for years, has grown a lot."],
      ["La tarta que preparó mi tía estaba riquísima.", "The cake my aunt made was delicious."],
      ["El parque al que llevamos a los niños tiene columpios.", "The park we take the kids to has swings."],
      ["La mascota que teníamos de pequeños era un conejo.", "The pet we had as kids was a rabbit."],
      ["El sofá que compramos es muy cómodo.", "The couch we bought is very comfortable."],
      ["Mi abuelo, que fue pescador, nos contaba historias del mar.", "My grandfather, who was a fisherman, used to tell us sea stories."],
      ["Los juguetes que le regalaron al niño son educativos.", "The toys they gave the child are educational."],
      ["La cena que preparé no salió como esperaba.", "The dinner I prepared didn't turn out as I expected."],
      ["El barrio donde vivimos es muy tranquilo.", "The neighborhood where we live is very quiet."],
      ["La bicicleta que le compramos a mi hijo es roja.", "The bicycle we bought for my son is red."],
      ["El jardín que plantó mi madre tiene muchas flores.", "The garden my mother planted has many flowers."],
      ["La foto que tengo en el salón es de la boda.", "The photo I have in the living room is from the wedding."],
      ["Los primos con los que jugábamos viven lejos.", "The cousins we used to play with live far away."],
      ["El cuento que le leo a mi hija todas las noches.", "The story I read my daughter every night."],
      ["La silla en la que se sienta el abuelo es la suya.", "The chair grandpa sits in is his."],
      ["El colegio al que van mis hijos está cerca de casa.", "The school my kids go to is close to home."],
      ["La vecina que nos ayudó es enfermera.", "The neighbor who helped us is a nurse."],
      ["El plato que más le gusta a mi padre es la paella.", "The dish my father likes most is paella."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 16: Imperfect Subjunctive (B2)
  // ═══════════════════════════════════════════════════════════════════
  16: {
    travel: [
      ["Ojalá que el hotel tuviera piscina.", "I wish the hotel had a pool."],
      ["Si el vuelo no fuera tan caro, lo compraría.", "If the flight weren't so expensive, I'd buy it."],
      ["Quería que el guía nos llevara al casco antiguo.", "I wanted the guide to take us to the old town."],
      ["Dudaba que el tren llegara a tiempo.", "I doubted the train would arrive on time."],
      ["Esperaba que el restaurante estuviera abierto.", "I was hoping the restaurant would be open."],
      ["No había nadie que hablara español en el aeropuerto.", "There was no one who spoke Spanish at the airport."],
      ["Si pudiéramos quedarnos más días, visitaríamos más sitios.", "If we could stay longer, we'd visit more places."],
      ["Me pidieron que mostrara mi pasaporte.", "They asked me to show my passport."],
      ["Buscaba un hotel que estuviera cerca de la playa.", "I was looking for a hotel that was near the beach."],
      ["Era necesario que reserváramos con antelación.", "It was necessary that we book in advance."],
      ["Si la excursión no costara tanto, iríamos todos.", "If the excursion didn't cost so much, we'd all go."],
      ["Quería que nos recomendaran un restaurante auténtico.", "I wanted them to recommend an authentic restaurant."],
      ["No creía que el museo cerrara tan temprano.", "I didn't think the museum closed so early."],
      ["Ojalá que el clima fuera más cálido.", "I wish the weather were warmer."],
      ["Si tuviéramos un mapa, no nos habríamos perdido.", "If we had a map, we wouldn't have gotten lost."],
      ["Buscaba un vuelo que saliera por la mañana.", "I was looking for a flight that left in the morning."],
      ["Temía que la maleta se perdiera en la conexión.", "I was afraid the suitcase would get lost during the connection."],
      ["Si la playa no estuviera tan lejos, iríamos todos los días.", "If the beach weren't so far, we'd go every day."],
      ["Quería que el viaje durara para siempre.", "I wanted the trip to last forever."],
      ["Era importante que cambiáramos dinero antes de salir.", "It was important that we exchange money before leaving."],
    ],
    work: [
      ["Si tuviera más experiencia, me darían el ascenso.", "If I had more experience, they'd give me the promotion."],
      ["El jefe quería que termináramos el informe antes del viernes.", "The boss wanted us to finish the report before Friday."],
      ["Ojalá que me subieran el sueldo.", "I wish they'd raise my salary."],
      ["No había nadie que supiera usar el nuevo programa.", "There was no one who knew how to use the new software."],
      ["Si el plazo fuera más largo, haríamos mejor trabajo.", "If the deadline were longer, we'd do better work."],
      ["Dudaba que aprobaran el presupuesto.", "I doubted they'd approve the budget."],
      ["Buscaban a alguien que tuviera experiencia en ventas.", "They were looking for someone who had experience in sales."],
      ["Era necesario que todos asistieran a la formación.", "It was necessary for everyone to attend the training."],
      ["Si me ofrecieran ese puesto, lo aceptaría sin dudar.", "If they offered me that position, I'd accept without hesitation."],
      ["Quería que mi equipo trabajara con más autonomía.", "I wanted my team to work with more autonomy."],
      ["No creía que el cliente cancelara el contrato.", "I didn't think the client would cancel the contract."],
      ["Si la empresa invirtiera en tecnología, seríamos más eficientes.", "If the company invested in technology, we'd be more efficient."],
      ["Esperaba que la reunión se pospusiera.", "I was hoping the meeting would be postponed."],
      ["Ojalá que hubiera más oportunidades de teletrabajo.", "I wish there were more remote work opportunities."],
      ["Buscaba un trabajo que me permitiera viajar.", "I was looking for a job that allowed me to travel."],
      ["Si el jefe fuera más flexible, estaríamos más contentos.", "If the boss were more flexible, we'd be happier."],
      ["Me pidieron que redactara un borrador del acuerdo.", "They asked me to draft a version of the agreement."],
      ["Temía que me despidieran por el error.", "I was afraid they'd fire me because of the mistake."],
      ["No había ningún proveedor que cumpliera los requisitos.", "There was no supplier that met the requirements."],
      ["Si tuviera mi propia empresa, haría las cosas diferente.", "If I had my own company, I'd do things differently."],
    ],
    family: [
      ["Ojalá que mi hijo durmiera toda la noche.", "I wish my son would sleep through the night."],
      ["Si mi madre viviera más cerca, la vería más.", "If my mother lived closer, I'd see her more."],
      ["Quería que los niños se acostaran temprano.", "I wanted the kids to go to bed early."],
      ["Dudaba que mi hermano viniera a la boda.", "I doubted my brother would come to the wedding."],
      ["Esperaba que la abuela se recuperara pronto.", "I was hoping grandma would recover soon."],
      ["No había ningún vecino que pudiera cuidar al perro.", "There was no neighbor who could look after the dog."],
      ["Si tuviéramos una casa más grande, adoptaríamos otro gato.", "If we had a bigger house, we'd adopt another cat."],
      ["Me pidió que le leyera un cuento antes de dormir.", "He/she asked me to read a story before bed."],
      ["Buscaba un colegio que estuviera cerca de casa.", "I was looking for a school that was close to home."],
      ["Era necesario que ordenáramos el garaje.", "It was necessary for us to organize the garage."],
      ["Si el bebé no llorara tanto, dormiríamos mejor.", "If the baby didn't cry so much, we'd sleep better."],
      ["Quería que toda la familia cenara junta en Navidad.", "I wanted the whole family to have dinner together at Christmas."],
      ["No creía que mi padre se jubilara tan pronto.", "I didn't think my father would retire so soon."],
      ["Ojalá que mi hermana viviera en la misma ciudad.", "I wish my sister lived in the same city."],
      ["Si pudiéramos reformar la cocina, cocinaríamos más.", "If we could remodel the kitchen, we'd cook more."],
      ["Buscaba una casa que tuviera jardín para los niños.", "I was looking for a house with a garden for the kids."],
      ["Temía que mi hijo se hiciera daño en el parque.", "I was afraid my son would get hurt at the park."],
      ["Si mi abuelo estuviera aquí, estaría muy orgulloso.", "If my grandfather were here, he'd be very proud."],
      ["Me encantaría que mis padres conocieran a mis amigos.", "I'd love for my parents to meet my friends."],
      ["No quería que los vecinos se quejaran del ruido.", "I didn't want the neighbors to complain about the noise."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 17: Conditionals II & III (B2)
  // ═══════════════════════════════════════════════════════════════════
  17: {
    travel: [
      ["Si hubiera reservado antes, habría conseguido mejor precio.", "If I had booked earlier, I would have gotten a better price."],
      ["Si no hubiéramos perdido el tren, habríamos llegado a tiempo.", "If we hadn't missed the train, we would have arrived on time."],
      ["Si tuviera vacaciones ahora, me iría a la playa.", "If I had vacation now, I'd go to the beach."],
      ["Habría visitado más museos si hubiera tenido más tiempo.", "I would have visited more museums if I had had more time."],
      ["Si el hotel no fuera tan ruidoso, dormiría mejor.", "If the hotel weren't so noisy, I'd sleep better."],
      ["Si hubiéramos llevado paraguas, no nos habríamos mojado.", "If we had brought umbrellas, we wouldn't have gotten wet."],
      ["Habríamos ido a la isla si el ferry no se hubiera cancelado.", "We would have gone to the island if the ferry hadn't been canceled."],
      ["Si supiera hablar japonés, viajaría a Tokio.", "If I knew how to speak Japanese, I'd travel to Tokyo."],
      ["Si no hubiera hecho tanto frío, habríamos acampado.", "If it hadn't been so cold, we would have camped."],
      ["Habría probado la comida local si no fuera alérgico.", "I would have tried the local food if I weren't allergic."],
      ["Si el vuelo no costara mil euros, lo compraría hoy.", "If the flight didn't cost a thousand euros, I'd buy it today."],
      ["Si hubiera sabido que cerraba, habría ido antes al monumento.", "If I had known it was closing, I would have gone to the monument earlier."],
      ["Nos habríamos quedado más tiempo si no se nos acabara el dinero.", "We would have stayed longer if we hadn't run out of money."],
      ["Si pudiera elegir, viajaría en primera clase.", "If I could choose, I'd travel first class."],
      ["Habría alquilado un coche si tuviera carné de conducir.", "I would have rented a car if I had a driver's license."],
      ["Si no estuviera lloviendo, visitaríamos las ruinas.", "If it weren't raining, we'd visit the ruins."],
      ["Si hubiéramos cogido el mapa, no nos habríamos perdido.", "If we had taken the map, we wouldn't have gotten lost."],
      ["Habría sacado más fotos si no se me hubiera acabado la batería.", "I would have taken more photos if my battery hadn't died."],
      ["Si la playa estuviera más cerca del hotel, iría todos los días.", "If the beach were closer to the hotel, I'd go every day."],
      ["Si hubieras venido, habrías disfrutado del paisaje.", "If you had come, you would have enjoyed the scenery."],
    ],
    work: [
      ["Si hubiera preparado mejor la entrevista, me habrían contratado.", "If I had prepared better for the interview, they would have hired me."],
      ["Si tuviera más formación, aspiraría a un puesto más alto.", "If I had more training, I'd aim for a higher position."],
      ["Si no me hubieran interrumpido, habría terminado a tiempo.", "If they hadn't interrupted me, I would have finished on time."],
      ["Habría aceptado el puesto si el sueldo fuera mejor.", "I would have accepted the position if the salary were better."],
      ["Si la empresa invirtiera en nosotros, los resultados mejorarían.", "If the company invested in us, results would improve."],
      ["Si hubiera leído el correo, no habría cometido ese error.", "If I had read the email, I wouldn't have made that mistake."],
      ["Habríamos cerrado el trato si el cliente no hubiera cambiado de opinión.", "We would have closed the deal if the client hadn't changed their mind."],
      ["Si trabajara desde casa, ahorraría mucho tiempo.", "If I worked from home, I'd save a lot of time."],
      ["Si no hubiera presentado el proyecto, nunca lo habrían aprobado.", "If I hadn't presented the project, they would never have approved it."],
      ["Habría asistido a la conferencia si me lo hubieran dicho antes.", "I would have attended the conference if they had told me earlier."],
      ["Si el sistema no fallara tanto, seríamos más productivos.", "If the system didn't crash so much, we'd be more productive."],
      ["Si hubiera negociado mejor, las condiciones serían distintas.", "If I had negotiated better, the conditions would be different."],
      ["Habría pedido un aumento si tuviera más confianza.", "I would have asked for a raise if I had more confidence."],
      ["Si me ascendieran, me mudaría a la otra oficina.", "If they promoted me, I'd move to the other office."],
      ["Si hubiéramos contratado antes, no estaríamos tan agobiados.", "If we had hired earlier, we wouldn't be so overwhelmed."],
      ["Habría enviado el informe si hubiera tenido los datos.", "I would have sent the report if I had had the data."],
      ["Si la reunión no durara tanto, tendríamos más tiempo para trabajar.", "If the meeting didn't last so long, we'd have more time to work."],
      ["Si hubiera sabido del cambio, habría adaptado mi presentación.", "If I had known about the change, I would have adapted my presentation."],
      ["Habríamos ganado el cliente si hubiéramos bajado el precio.", "We would have won the client if we had lowered the price."],
      ["Si pudiera elegir mi horario, empezaría a las diez.", "If I could choose my schedule, I'd start at ten."],
    ],
    family: [
      ["Si hubiera llamado a mi madre, no se habría preocupado.", "If I had called my mother, she wouldn't have worried."],
      ["Si tuviéramos más espacio, invitaríamos a los abuelos a vivir con nosotros.", "If we had more space, we'd invite the grandparents to live with us."],
      ["Si no hubiera llovido, habríamos hecho una barbacoa.", "If it hadn't rained, we would have had a barbecue."],
      ["Habría cocinado algo especial si hubiera sabido que venías.", "I would have cooked something special if I had known you were coming."],
      ["Si mi hijo no estuviera enfermo, iría al colegio.", "If my son weren't sick, he'd go to school."],
      ["Si hubiéramos comprado la casa más grande, los niños tendrían su propio cuarto.", "If we had bought the bigger house, the kids would have their own room."],
      ["Habría ido a la boda si no hubiera tenido que cuidar al bebé.", "I would have gone to the wedding if I hadn't had to look after the baby."],
      ["Si viviera más cerca de mis padres, los visitaría cada semana.", "If I lived closer to my parents, I'd visit them every week."],
      ["Si no fuera por mi familia, me sentiría muy solo.", "If it weren't for my family, I'd feel very lonely."],
      ["Habríamos adoptado un perro si el piso fuera más grande.", "We would have adopted a dog if the apartment were bigger."],
      ["Si mi hermana hubiera venido, la fiesta habría sido mejor.", "If my sister had come, the party would have been better."],
      ["Si pudiera volver atrás, pasaría más tiempo con mis hijos.", "If I could go back, I'd spend more time with my kids."],
      ["Habría preparado más comida si hubiera sabido que venían tantos.", "I would have prepared more food if I had known so many were coming."],
      ["Si tuviéramos jardín, los niños jugarían más al aire libre.", "If we had a garden, the kids would play outside more."],
      ["Si no fuera tan tarde, llevaría a los niños al parque.", "If it weren't so late, I'd take the kids to the park."],
      ["Habría pintado la habitación si hubiera tenido tiempo.", "I would have painted the room if I had had time."],
      ["Si mi padre no trabajara tanto, descansaría más.", "If my father didn't work so much, he'd rest more."],
      ["Si hubiéramos salido antes, no nos habríamos perdido la función del colegio.", "If we had left earlier, we wouldn't have missed the school play."],
      ["Habría hecho la compra si no se me hubiera olvidado la lista.", "I would have done the grocery shopping if I hadn't forgotten the list."],
      ["Si la vecina no nos hubiera avisado, habríamos perdido al gato.", "If the neighbor hadn't warned us, we would have lost the cat."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 18: Passive & Impersonal (B2)
  // ═══════════════════════════════════════════════════════════════════
  18: {
    travel: [
      ["Se recomienda llegar al aeropuerto con dos horas de antelación.", "It's recommended to arrive at the airport two hours early."],
      ["El vuelo fue cancelado por la tormenta.", "The flight was canceled due to the storm."],
      ["Se habla español en más de veinte países.", "Spanish is spoken in more than twenty countries."],
      ["La catedral fue construida en el siglo quince.", "The cathedral was built in the fifteenth century."],
      ["Se prohíbe fumar en los aviones.", "Smoking is prohibited on airplanes."],
      ["Las maletas fueron encontradas en otra terminal.", "The suitcases were found in another terminal."],
      ["Se puede comer muy bien en este barrio.", "You can eat very well in this neighborhood."],
      ["El monumento fue restaurado el año pasado.", "The monument was restored last year."],
      ["Se necesita pasaporte para entrar en ese país.", "A passport is needed to enter that country."],
      ["La reserva fue confirmada por correo electrónico.", "The reservation was confirmed by email."],
      ["Se venden entradas en la taquilla del museo.", "Tickets are sold at the museum ticket office."],
      ["El hotel fue renovado completamente.", "The hotel was completely renovated."],
      ["Se aconseja no beber el agua del grifo.", "It's advised not to drink tap water."],
      ["La ruta fue diseñada para turistas.", "The route was designed for tourists."],
      ["Se ven los picos nevados desde la terraza del hotel.", "You can see the snowy peaks from the hotel terrace."],
      ["El puente fue declarado patrimonio de la humanidad.", "The bridge was declared a World Heritage Site."],
      ["Se ruega no tocar las obras de arte.", "Please do not touch the artworks."],
      ["La excursión fue organizada por la agencia.", "The excursion was organized by the agency."],
      ["Se oyen las campanas desde cualquier punto del pueblo.", "You can hear the bells from anywhere in the town."],
      ["El equipaje fue revisado en la aduana.", "The luggage was checked at customs."],
    ],
    work: [
      ["Se convocó una reunión urgente.", "An urgent meeting was called."],
      ["El proyecto fue aprobado por la dirección.", "The project was approved by management."],
      ["Se requiere experiencia previa para este puesto.", "Previous experience is required for this position."],
      ["Los contratos fueron firmados esta mañana.", "The contracts were signed this morning."],
      ["Se espera que las ventas aumenten este trimestre.", "Sales are expected to increase this quarter."],
      ["La decisión fue tomada sin consultar al equipo.", "The decision was made without consulting the team."],
      ["Se busca un programador con experiencia.", "A programmer with experience is being sought."],
      ["El informe fue entregado a tiempo.", "The report was delivered on time."],
      ["Se prohíbe el uso de teléfonos móviles en la sala.", "The use of mobile phones is prohibited in the room."],
      ["La empresa fue fundada hace treinta años.", "The company was founded thirty years ago."],
      ["Se necesitan voluntarios para el proyecto.", "Volunteers are needed for the project."],
      ["El presupuesto fue recortado un diez por ciento.", "The budget was cut by ten percent."],
      ["Se ruega confirmar asistencia antes del viernes.", "Please confirm attendance before Friday."],
      ["Los empleados fueron informados del cambio.", "The employees were informed of the change."],
      ["Se dice que habrá una reestructuración.", "It's said there will be a restructuring."],
      ["La oferta fue rechazada por el cliente.", "The offer was rejected by the client."],
      ["Se trabaja mucho en esta empresa.", "People work a lot at this company."],
      ["El expediente fue archivado por error.", "The file was archived by mistake."],
      ["Se recomienda actualizar el software regularmente.", "It's recommended to update the software regularly."],
      ["La factura fue pagada con retraso.", "The invoice was paid late."],
    ],
    family: [
      ["La casa fue construida por mi abuelo.", "The house was built by my grandfather."],
      ["Se nota que los niños están cansados.", "You can tell the kids are tired."],
      ["La cena fue preparada por mi padre.", "Dinner was prepared by my father."],
      ["Se oyen risas desde la habitación de los niños.", "You can hear laughter from the kids' room."],
      ["La tarta fue hecha en casa.", "The cake was homemade."],
      ["Se dice que los hijos se parecen a los padres.", "It's said that children resemble their parents."],
      ["El jardín fue plantado por la abuela.", "The garden was planted by grandmother."],
      ["Se espera que el bebé nazca en marzo.", "The baby is expected to be born in March."],
      ["La boda fue celebrada en el pueblo.", "The wedding was held in the village."],
      ["Se vive bien en este barrio.", "Life is good in this neighborhood."],
      ["La habitación fue decorada para el cumpleaños.", "The room was decorated for the birthday."],
      ["Se necesita paciencia con los niños pequeños.", "Patience is needed with small children."],
      ["Los regalos fueron envueltos por los niños.", "The gifts were wrapped by the children."],
      ["Se sabe que la familia es lo más importante.", "It's known that family is the most important thing."],
      ["La foto fue tomada en la boda de mis padres.", "The photo was taken at my parents' wedding."],
      ["Se come muy bien en casa de la abuela.", "You eat very well at grandma's house."],
      ["El mueble fue reparado por mi cuñado.", "The furniture was repaired by my brother-in-law."],
      ["Se nota mucho el cariño en esta familia.", "You can really feel the love in this family."],
      ["La mascota fue encontrada por los vecinos.", "The pet was found by the neighbors."],
      ["Se acostumbra cenar juntos los domingos.", "It's customary to have dinner together on Sundays."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 19: Advanced Connectors (B2)
  // ═══════════════════════════════════════════════════════════════════
  19: {
    travel: [
      ["A pesar de la lluvia, disfrutamos de la excursión.", "Despite the rain, we enjoyed the excursion."],
      ["Siempre que viajo, intento aprender algo del idioma local.", "Whenever I travel, I try to learn some of the local language."],
      ["En cuanto lleguemos al hotel, dejaremos las maletas.", "As soon as we get to the hotel, we'll leave our bags."],
      ["Aunque el vuelo se retrasó, llegamos a tiempo.", "Although the flight was delayed, we arrived on time."],
      ["No solo visitamos la capital, sino también la costa.", "We not only visited the capital, but also the coast."],
      ["Dado que el museo cierra temprano, iremos primero allí.", "Given that the museum closes early, we'll go there first."],
      ["Por mucho que busque, no encuentro un hotel barato.", "No matter how much I search, I can't find a cheap hotel."],
      ["A medida que recorríamos el pueblo, descubríamos rincones nuevos.", "As we walked through the town, we discovered new spots."],
      ["Puesto que no hay tren directo, tomaremos el autobús.", "Since there's no direct train, we'll take the bus."],
      ["Mientras tanto, podemos visitar el mercado.", "Meanwhile, we can visit the market."],
      ["Si bien el hostal era básico, estaba limpio.", "Although the hostel was basic, it was clean."],
      ["Con tal de que lleguemos antes de las ocho, cenaremos allí.", "As long as we arrive before eight, we'll have dinner there."],
      ["A raíz del cierre, tuvimos que cambiar de ruta.", "As a result of the closure, we had to change our route."],
      ["No bien aterrizamos, sentimos el calor tropical.", "As soon as we landed, we felt the tropical heat."],
      ["Más allá de los monumentos, lo que más me gustó fue la gente.", "Beyond the monuments, what I liked most was the people."],
      ["En caso de que se pierda la maleta, lleve objetos de valor a mano.", "In case the suitcase gets lost, carry valuables by hand."],
      ["Tan pronto como crucemos la frontera, cambiaremos dinero.", "As soon as we cross the border, we'll exchange money."],
      ["Pese a no hablar el idioma, nos entendíamos con gestos.", "Despite not speaking the language, we understood each other with gestures."],
      ["A fin de que no nos perdamos, llevaremos un mapa.", "So that we don't get lost, we'll bring a map."],
      ["De modo que el viaje resultó ser mejor de lo esperado.", "So the trip turned out to be better than expected."],
    ],
    work: [
      ["A pesar de los recortes, mantuvimos la calidad.", "Despite the cuts, we maintained quality."],
      ["Siempre que hay cambios, el equipo se adapta rápido.", "Whenever there are changes, the team adapts quickly."],
      ["En cuanto reciba la aprobación, empezaré el proyecto.", "As soon as I receive approval, I'll start the project."],
      ["Aunque el plazo es corto, lo conseguiremos.", "Although the deadline is short, we'll manage."],
      ["No solo aumentaron las ventas, sino también los beneficios.", "Not only did sales increase, but profits too."],
      ["Dado que el presupuesto es limitado, hay que priorizar.", "Given that the budget is limited, we need to prioritize."],
      ["Por mucho que trabajemos, nunca terminamos a tiempo.", "No matter how much we work, we never finish on time."],
      ["A medida que crecía la empresa, necesitábamos más personal.", "As the company grew, we needed more staff."],
      ["Puesto que el cliente no contestó, anulamos el pedido.", "Since the client didn't reply, we canceled the order."],
      ["Mientras tanto, revisa los datos del informe.", "Meanwhile, review the report data."],
      ["Si bien el proyecto es ambicioso, es viable.", "Although the project is ambitious, it's viable."],
      ["Con tal de que cumplas los plazos, puedes organizar tu horario.", "As long as you meet the deadlines, you can organize your schedule."],
      ["A raíz de la auditoría, se implementaron nuevos controles.", "As a result of the audit, new controls were implemented."],
      ["No bien empezó la reunión, surgió el primer desacuerdo.", "As soon as the meeting started, the first disagreement arose."],
      ["Más allá de los números, lo importante es la satisfacción del cliente.", "Beyond the numbers, what matters is client satisfaction."],
      ["En caso de que el sistema falle, contacte a soporte técnico.", "In case the system fails, contact technical support."],
      ["De ahí que necesitemos contratar a más gente.", "That's why we need to hire more people."],
      ["Pese a las dificultades, sacamos el proyecto adelante.", "Despite the difficulties, we pushed the project through."],
      ["A fin de que todos estén informados, enviaré un resumen.", "So that everyone is informed, I'll send a summary."],
      ["De modo que la reestructuración era inevitable.", "So the restructuring was inevitable."],
    ],
    family: [
      ["A pesar de vivir lejos, nos vemos a menudo.", "Despite living far away, we see each other often."],
      ["Siempre que mi madre cocina, me recuerda a la infancia.", "Whenever my mother cooks, it reminds me of childhood."],
      ["En cuanto lleguen los abuelos, comeremos.", "As soon as the grandparents arrive, we'll eat."],
      ["Aunque los niños protestaron, se fueron a la cama.", "Although the kids protested, they went to bed."],
      ["No solo es buen padre, sino también buen marido.", "He's not only a good father, but also a good husband."],
      ["Dado que el bebé tiene fiebre, no iremos al parque.", "Given that the baby has a fever, we won't go to the park."],
      ["Por mucho que insista, mi hijo no quiere comer verduras.", "No matter how much I insist, my son won't eat vegetables."],
      ["A medida que crecen, los niños se vuelven más independientes.", "As they grow, kids become more independent."],
      ["Puesto que mi hermana no puede venir, celebraremos otro día.", "Since my sister can't come, we'll celebrate another day."],
      ["Mientras tanto, los niños juegan en el jardín.", "Meanwhile, the kids are playing in the garden."],
      ["Si bien la casa es pequeña, es suficiente para nosotros.", "Although the house is small, it's enough for us."],
      ["Con tal de que los niños estén contentos, yo también lo estoy.", "As long as the kids are happy, I'm happy too."],
      ["A raíz de la mudanza, los niños cambiaron de colegio.", "As a result of the move, the kids changed schools."],
      ["No bien entró por la puerta, el perro saltó a saludarlo.", "As soon as he walked through the door, the dog jumped to greet him."],
      ["Más allá de las peleas, los hermanos se quieren mucho.", "Beyond the fights, the siblings love each other a lot."],
      ["En caso de que llueva, haremos la fiesta dentro de casa.", "In case it rains, we'll have the party inside."],
      ["De ahí que la familia decidiera mudarse al campo.", "That's why the family decided to move to the countryside."],
      ["Pese a las discusiones, siempre nos reconciliamos.", "Despite the arguments, we always make up."],
      ["A fin de que los niños aprendan, les leemos cada noche.", "So that the kids learn, we read to them every night."],
      ["De modo que el cumpleaños fue un éxito total.", "So the birthday was a total success."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 20: Mastery (B2)
  // ═══════════════════════════════════════════════════════════════════
  20: {
    travel: [
      ["De haber sabido que el museo cerraba, habríamos ido antes.", "Had I known the museum was closing, we would have gone earlier."],
      ["No es que no me guste viajar, sino que prefiero planificarlo bien.", "It's not that I don't like traveling, but I prefer to plan it well."],
      ["Sea como sea, conseguiremos llegar al pueblo antes de que anochezca.", "No matter what, we'll manage to get to the village before dark."],
      ["El hecho de que hablen otro idioma no debería ser un obstáculo.", "The fact that they speak another language shouldn't be an obstacle."],
      ["Por más que busqué, no encontré un vuelo directo a esa isla.", "No matter how much I searched, I couldn't find a direct flight to that island."],
      ["Habiendo recorrido toda la costa, puedo decir que el sur es lo mejor.", "Having traveled the whole coast, I can say the south is the best."],
      ["Cuanto más viajo, más me doy cuenta de lo grande que es el mundo.", "The more I travel, the more I realize how big the world is."],
      ["Con que lleguemos una hora antes al aeropuerto, será suficiente.", "As long as we arrive an hour early at the airport, it'll be enough."],
      ["El que no haya turistas a esta hora hace que el lugar sea más especial.", "The fact that there are no tourists at this hour makes the place more special."],
      ["Siendo realistas, no podremos verlo todo en tres días.", "Being realistic, we won't be able to see everything in three days."],
      ["Por mucho que me cueste admitirlo, ese hotel era un desastre.", "As much as it pains me to admit it, that hotel was a disaster."],
      ["A fin de cuentas, lo mejor del viaje fue la gente que conocimos.", "At the end of the day, the best part of the trip was the people we met."],
      ["Llegados a este punto, prefiero quedarme un día más.", "At this point, I'd rather stay one more day."],
      ["Pase lo que pase, no nos vamos sin ver el atardecer desde el faro.", "Whatever happens, we're not leaving without seeing the sunset from the lighthouse."],
      ["A juzgar por las opiniones, este hostal es de los mejores.", "Judging by the reviews, this hostel is one of the best."],
      ["De no ser por el mapa, nos habríamos perdido completamente.", "If it weren't for the map, we would have gotten completely lost."],
      ["Dicho sea de paso, la comida en el norte fue espectacular.", "By the way, the food in the north was spectacular."],
      ["En lo que respecta al transporte, el metro es la mejor opción.", "As far as transportation goes, the subway is the best option."],
      ["Habiéndolo pensado bien, creo que el tren es mejor que el avión para este viaje.", "Having thought about it carefully, I think the train is better than the plane for this trip."],
      ["Sea cual sea el destino, lo importante es disfrutar del camino.", "Whatever the destination, the important thing is to enjoy the journey."],
    ],
    work: [
      ["De haber anticipado el problema, habríamos actuado antes.", "Had we anticipated the problem, we would have acted sooner."],
      ["No es que el proyecto sea malo, sino que necesita más trabajo.", "It's not that the project is bad, but it needs more work."],
      ["Sea cual sea la decisión, el equipo la respetará.", "Whatever the decision, the team will respect it."],
      ["El hecho de que no haya respuesta indica desinterés.", "The fact that there's no reply indicates disinterest."],
      ["Por más que insistamos, el cliente no cambiará de opinión.", "No matter how much we insist, the client won't change their mind."],
      ["Habiendo analizado los datos, la conclusión es clara.", "Having analyzed the data, the conclusion is clear."],
      ["Cuanto más delegues, más eficiente será el equipo.", "The more you delegate, the more efficient the team will be."],
      ["Con que terminemos el informe hoy, cumpliremos el plazo.", "As long as we finish the report today, we'll meet the deadline."],
      ["El que la empresa crezca depende de la innovación.", "Whether the company grows depends on innovation."],
      ["Siendo francos, la estrategia actual no funciona.", "Being frank, the current strategy isn't working."],
      ["Por mucho que trabajemos, el resultado depende del presupuesto.", "No matter how much we work, the result depends on the budget."],
      ["A fin de cuentas, la satisfacción del cliente es lo que importa.", "At the end of the day, customer satisfaction is what matters."],
      ["Llegados a este punto, necesitamos replantear la estrategia.", "At this point, we need to rethink the strategy."],
      ["Pase lo que pase, entregaremos a tiempo.", "Whatever happens, we'll deliver on time."],
      ["A juzgar por los resultados, la campaña fue un éxito.", "Judging by the results, the campaign was a success."],
      ["De no ser por el apoyo del equipo, no lo habríamos logrado.", "If it weren't for the team's support, we wouldn't have managed."],
      ["Dicho esto, creo que necesitamos más recursos.", "That said, I think we need more resources."],
      ["En lo que respecta al presupuesto, no hay margen de maniobra.", "As far as the budget goes, there's no room for maneuver."],
      ["Habiéndose comprometido con el plazo, no hay vuelta atrás.", "Having committed to the deadline, there's no turning back."],
      ["Sea como sea, cerraremos el trimestre con beneficios.", "No matter what, we'll close the quarter with profits."],
    ],
    family: [
      ["De haber sabido que vendríais, habría preparado más comida.", "Had I known you were coming, I would have prepared more food."],
      ["No es que no quiera a mis suegros, sino que necesito mi espacio.", "It's not that I don't love my in-laws, but I need my space."],
      ["Sea lo que sea que decidan los niños, les apoyaremos.", "Whatever the kids decide, we'll support them."],
      ["El hecho de que seamos familia no significa que siempre estemos de acuerdo.", "The fact that we're family doesn't mean we always agree."],
      ["Por más que le diga a mi hijo, sigue dejando la ropa en el suelo.", "No matter how much I tell my son, he keeps leaving his clothes on the floor."],
      ["Habiendo crecido en un pueblo pequeño, valoro la tranquilidad.", "Having grown up in a small town, I value peace and quiet."],
      ["Cuanto más tiempo paso con mis hijos, más los entiendo.", "The more time I spend with my kids, the more I understand them."],
      ["Con que vengan mis padres el domingo, seré feliz.", "As long as my parents come on Sunday, I'll be happy."],
      ["El que los niños se peleen no significa que no se quieran.", "The fact that the kids fight doesn't mean they don't love each other."],
      ["Siendo padres primerizos, cometimos muchos errores.", "Being first-time parents, we made many mistakes."],
      ["Por mucho que cueste, la educación de los hijos es prioritaria.", "No matter how much it costs, children's education is a priority."],
      ["A fin de cuentas, la familia es lo que de verdad importa.", "At the end of the day, family is what truly matters."],
      ["Llegados a este punto, los niños ya son bastante independientes.", "At this point, the kids are quite independent already."],
      ["Pase lo que pase, siempre contarás con tu familia.", "Whatever happens, you can always count on your family."],
      ["A juzgar por cómo habla, mi hija será abogada.", "Judging by how she talks, my daughter will be a lawyer."],
      ["De no ser por mis padres, no habría podido estudiar.", "If it weren't for my parents, I wouldn't have been able to study."],
      ["Dicho sea de paso, mi hermana cocina mejor que yo.", "By the way, my sister cooks better than me."],
      ["En lo que respecta a la educación, somos bastante estrictos.", "As far as education goes, we're quite strict."],
      ["Habiéndose mudado los vecinos, el barrio está más tranquilo.", "The neighbors having moved, the neighborhood is quieter."],
      ["Sea como sea, resolveremos esto en familia.", "No matter what, we'll resolve this as a family."],
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────────────────────────────

console.log('=== SEMANTIC RETAG & GAP-FILL SCRIPT (Nodes 11-20) ===\n');
console.log(`Deck size: ${deck.length} cards\n`);

// Collect before stats
const beforeStats = {};
for (let nodeNum = 11; nodeNum <= 20; nodeNum++) {
  const def = NODE_DEFS[nodeNum];
  const nodeCards = deck.slice(def.startIdx, def.endIdx);
  beforeStats[nodeNum] = {};
  for (const goal of GOALS) {
    beforeStats[nodeNum][goal] = nodeCards.filter(c => (c.tags || []).includes(goal)).length;
  }
  beforeStats[nodeNum].total = nodeCards.length;
}

// PASS 1: Semantic retag
let retagCount = 0;
for (let nodeNum = 11; nodeNum <= 20; nodeNum++) {
  const def = NODE_DEFS[nodeNum];
  for (let i = def.startIdx; i < def.endIdx; i++) {
    if (i < deck.length && semanticTag(deck[i])) {
      retagCount++;
    }
  }
}
console.log(`PASS 1 — Retagged ${retagCount} cards based on content analysis.\n`);

// After retag stats
const afterRetagStats = {};
for (let nodeNum = 11; nodeNum <= 20; nodeNum++) {
  const def = NODE_DEFS[nodeNum];
  const nodeCards = deck.slice(def.startIdx, def.endIdx);
  afterRetagStats[nodeNum] = {};
  for (const goal of GOALS) {
    afterRetagStats[nodeNum][goal] = nodeCards.filter(c => (c.tags || []).includes(goal)).length;
  }
}

// PASS 2: Generate new cards to fill gaps
let nextId = deck.length + 1; // IDs continue after last card
let totalNewCards = 0;
const newCardsByNode = {};

for (let nodeNum = 11; nodeNum <= 20; nodeNum++) {
  const def = NODE_DEFS[nodeNum];
  const target = TARGET_COUNT[def.tier];
  const nodeCards = deck.slice(def.startIdx, def.endIdx);
  newCardsByNode[nodeNum] = [];

  for (const goal of GOALS) {
    const currentCount = nodeCards.filter(c => (c.tags || []).includes(goal)).length;
    const gap = target - currentCount;

    if (gap <= 0) continue;

    // Get available new cards for this node+goal
    const available = (NEW_CARDS[nodeNum] && NEW_CARDS[nodeNum][goal]) || [];
    const toAdd = Math.min(gap, available.length);

    for (let i = 0; i < toAdd; i++) {
      const [targetText, english] = available[i];
      const newCard = {
        id: nextId++,
        target: targetText,
        english: english,
        audio: '',
        tags: ['general', goal],
      };
      deck.push(newCard);
      newCardsByNode[nodeNum].push(newCard);
      totalNewCards++;
    }
  }
}

console.log(`PASS 2 — Generated ${totalNewCards} new cards to fill gaps.\n`);

// Final stats
console.log('─'.repeat(80));
console.log('PER-NODE STATS (Before retag → After retag → After new cards)');
console.log('─'.repeat(80));

for (let nodeNum = 11; nodeNum <= 20; nodeNum++) {
  const def = NODE_DEFS[nodeNum];
  const target = TARGET_COUNT[def.tier];
  console.log(`\nNode ${nodeNum}: ${def.name} (${def.tier}) — target: ${target} per goal`);

  for (const goal of GOALS) {
    const before = beforeStats[nodeNum][goal];
    const afterRetag = afterRetagStats[nodeNum][goal];
    const newForGoal = newCardsByNode[nodeNum].filter(c => c.tags.includes(goal)).length;
    const finalCount = afterRetag + newForGoal;
    const status = finalCount >= target ? 'OK' : `NEED ${target - finalCount} more`;

    console.log(`  ${goal.padEnd(8)}: ${String(before).padStart(3)} → ${String(afterRetag).padStart(3)} (retag) → ${String(finalCount).padStart(3)} (${status})`);
  }
  console.log(`  New cards added: ${newCardsByNode[nodeNum].length}`);
}

console.log(`\n${'─'.repeat(80)}`);
console.log(`TOTALS:`);
console.log(`  Cards retagged:   ${retagCount}`);
console.log(`  New cards added:  ${totalNewCards}`);
console.log(`  Final deck size:  ${deck.length}`);

for (const goal of GOALS) {
  const total = deck.filter(c => (c.tags || []).includes(goal)).length;
  console.log(`  ${goal}: ${total} cards (${(total / deck.length * 100).toFixed(1)}%)`);
}

// Write back
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf-8');
console.log(`\nDeck written to ${DECK_PATH}`);
