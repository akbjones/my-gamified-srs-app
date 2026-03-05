/**
 * semantic-retag-1-10.cjs
 *
 * Two-pass script for cards in nodes 1-10 (indices 0-2499):
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
 *   A1 (nodes 1-5):  200 cards per goal per node (80% of 250)
 *   A2 (nodes 6-10): 163 cards per goal per node (65% of 250)
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

const PER_NODE = 250;
const GOALS = ['travel', 'work', 'family'];

// Node definitions for 1-10 — startIdx/endIdx are 0-based array indices (inclusive start, exclusive end for slice)
const NODE_DEFS = {
  1:  { name: 'Present Tense',      tier: 'A1', startIdx: 0,    endIdx: 250 },
  2:  { name: 'Ser vs Estar',       tier: 'A1', startIdx: 250,  endIdx: 500 },
  3:  { name: 'Common Questions',    tier: 'A1', startIdx: 500,  endIdx: 750 },
  4:  { name: 'Articles & Gender',   tier: 'A1', startIdx: 750,  endIdx: 1000 },
  5:  { name: 'Gustar & Similar',    tier: 'A1', startIdx: 1000, endIdx: 1250 },
  6:  { name: 'Pretérito',           tier: 'A2', startIdx: 1250, endIdx: 1500 },
  7:  { name: 'Imperfecto',          tier: 'A2', startIdx: 1500, endIdx: 1750 },
  8:  { name: 'Reflexive Verbs',     tier: 'A2', startIdx: 1750, endIdx: 2000 },
  9:  { name: 'Por vs Para',         tier: 'A2', startIdx: 2000, endIdx: 2250 },
  10: { name: 'Object Pronouns',     tier: 'A2', startIdx: 2250, endIdx: 2500 },
};

const TARGET_COUNT = {
  A1: 200, // 80% of 250
  A2: 163, // 65% of 250
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
// Each entry: [target, english]

const NEW_CARDS = {
  // ═══════════════════════════════════════════════════════════════════
  // NODE 1: Present Tense (A1) — regular -ar/-er/-ir verbs
  // ═══════════════════════════════════════════════════════════════════
  1: {
    travel: [
      ["Compro un billete de tren.", "I buy a train ticket."],
      ["Camino por la playa todas las mañanas.", "I walk along the beach every morning."],
      ["Hablamos con el guía turístico.", "We talk to the tour guide."],
      ["Tomo fotos del monumento.", "I take photos of the monument."],
      ["Viajamos en autobús al centro.", "We travel by bus downtown."],
      ["Miras el mapa para encontrar el museo.", "You look at the map to find the museum."],
      ["Llego al aeropuerto a las ocho.", "I arrive at the airport at eight."],
      ["Reservo una habitación de hotel.", "I book a hotel room."],
      ["Comemos en un restaurante cerca de la playa.", "We eat at a restaurant near the beach."],
      ["Espero el tren en la estación.", "I wait for the train at the station."],
      ["Visito la catedral del pueblo.", "I visit the village cathedral."],
      ["Preparamos las maletas para el viaje.", "We prepare the suitcases for the trip."],
      ["Necesito un mapa de la ciudad.", "I need a map of the city."],
      ["Buscamos un hotel barato.", "We look for a cheap hotel."],
      ["Caminas por el centro histórico.", "You walk through the historic center."],
      ["Mando una postal a mi familia.", "I send a postcard to my family."],
      ["Nado en la playa por la tarde.", "I swim at the beach in the afternoon."],
      ["Preguntamos dónde está la estación.", "We ask where the station is."],
      ["Paso tres días en Barcelona.", "I spend three days in Barcelona."],
      ["Llevo mucho equipaje.", "I carry a lot of luggage."],
      ["Recorro la ciudad a pie.", "I tour the city on foot."],
      ["Usamos un taxi para ir al hotel.", "We use a taxi to go to the hotel."],
      ["Entro en el museo a las diez.", "I enter the museum at ten."],
      ["Descansamos en el hotel después de la excursión.", "We rest at the hotel after the excursion."],
      ["Cruzo la frontera en coche.", "I cross the border by car."],
    ],
    work: [
      ["Trabajo en una oficina grande.", "I work in a big office."],
      ["Llego a la oficina a las nueve.", "I arrive at the office at nine."],
      ["Envío un correo a mi jefe.", "I send an email to my boss."],
      ["Hablamos con el cliente por teléfono.", "We talk to the client on the phone."],
      ["Preparo una presentación para la reunión.", "I prepare a presentation for the meeting."],
      ["Leo el informe antes de la reunión.", "I read the report before the meeting."],
      ["Firmo el contrato hoy.", "I sign the contract today."],
      ["Mi colega trabaja mucho.", "My colleague works a lot."],
      ["Necesito terminar el documento.", "I need to finish the document."],
      ["Tomamos un café en la oficina.", "We have a coffee at the office."],
      ["Escribo un correo electrónico.", "I write an email."],
      ["Organizo los documentos del proyecto.", "I organize the project documents."],
      ["Asistimos a la reunión de las diez.", "We attend the ten o'clock meeting."],
      ["Imprimo el informe para el jefe.", "I print the report for the boss."],
      ["Llamo al cliente para confirmar.", "I call the client to confirm."],
      ["Termino el trabajo a las seis.", "I finish work at six."],
      ["Uso la impresora nueva.", "I use the new printer."],
      ["Estudiamos el presupuesto del proyecto.", "We study the project budget."],
      ["Reviso el contrato con cuidado.", "I review the contract carefully."],
      ["Tomo notas durante la reunión.", "I take notes during the meeting."],
      ["Busco un trabajo nuevo.", "I look for a new job."],
      ["Hablo con mi supervisor cada semana.", "I talk to my supervisor every week."],
      ["Creo una lista de tareas.", "I create a task list."],
      ["Respondo a los correos del día.", "I reply to the day's emails."],
      ["Presento las cifras al equipo.", "I present the numbers to the team."],
    ],
    family: [
      ["Cocino la cena para mi familia.", "I cook dinner for my family."],
      ["Mi madre llama todos los domingos.", "My mother calls every Sunday."],
      ["Los niños juegan en el jardín.", "The kids play in the garden."],
      ["Ceno con mis padres los viernes.", "I have dinner with my parents on Fridays."],
      ["Mi hermana estudia en la universidad.", "My sister studies at the university."],
      ["Limpio la casa los sábados.", "I clean the house on Saturdays."],
      ["Mi padre lee el periódico por la mañana.", "My father reads the newspaper in the morning."],
      ["Ayudo a mi hijo con la tarea.", "I help my son with homework."],
      ["Mi abuela prepara una sopa deliciosa.", "My grandmother makes a delicious soup."],
      ["Paseo al perro después de cenar.", "I walk the dog after dinner."],
      ["Mi hermano vive cerca de nosotros.", "My brother lives near us."],
      ["Lavamos la ropa los domingos.", "We do laundry on Sundays."],
      ["Mi hija dibuja muy bien.", "My daughter draws very well."],
      ["Celebramos los cumpleaños en casa.", "We celebrate birthdays at home."],
      ["Mi tío trabaja en el campo.", "My uncle works in the countryside."],
      ["Jugamos con los niños en el parque.", "We play with the kids in the park."],
      ["Mi prima viene a visitarnos.", "My cousin comes to visit us."],
      ["Preparo el desayuno para los niños.", "I make breakfast for the kids."],
      ["El gato duerme en el sofá.", "The cat sleeps on the couch."],
      ["Mi abuelo cuenta historias por la noche.", "My grandfather tells stories at night."],
      ["Compro comida para toda la familia.", "I buy food for the whole family."],
      ["Mi vecino saluda todas las mañanas.", "My neighbor says hello every morning."],
      ["Baño al bebé antes de dormir.", "I bathe the baby before bed."],
      ["Mi esposa planta flores en el jardín.", "My wife plants flowers in the garden."],
      ["Recojo a los niños del colegio.", "I pick up the kids from school."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 2: Ser vs Estar (A1) — permanent vs temporary states
  // ═══════════════════════════════════════════════════════════════════
  2: {
    travel: [
      ["El hotel está cerca de la playa.", "The hotel is near the beach."],
      ["La estación de tren es muy moderna.", "The train station is very modern."],
      ["Estoy en el aeropuerto esperando mi vuelo.", "I'm at the airport waiting for my flight."],
      ["La catedral es el monumento más famoso.", "The cathedral is the most famous monument."],
      ["El museo está cerrado hoy.", "The museum is closed today."],
      ["La playa es muy bonita.", "The beach is very beautiful."],
      ["Estamos en un hotel del centro.", "We're at a hotel downtown."],
      ["El restaurante es bastante caro.", "The restaurant is quite expensive."],
      ["Mi maleta está en la habitación.", "My suitcase is in the room."],
      ["El vuelo es directo a Madrid.", "The flight is direct to Madrid."],
      ["El autobús está lleno de turistas.", "The bus is full of tourists."],
      ["La ciudad es muy antigua.", "The city is very old."],
      ["Estoy perdido, necesito un mapa.", "I'm lost, I need a map."],
      ["El billete es para el tren de las cuatro.", "The ticket is for the four o'clock train."],
      ["La excursión es muy interesante.", "The excursion is very interesting."],
      ["Estamos de vacaciones en la costa.", "We're on vacation at the coast."],
      ["El monumento está en la plaza principal.", "The monument is in the main square."],
      ["La habitación del hotel es pequeña.", "The hotel room is small."],
      ["El taxi está fuera del hotel.", "The taxi is outside the hotel."],
      ["La isla es un destino tropical.", "The island is a tropical destination."],
      ["El pasaporte está en mi bolso.", "The passport is in my bag."],
      ["El guía turístico es muy simpático.", "The tour guide is very friendly."],
      ["La montaña es impresionante.", "The mountain is impressive."],
      ["Estamos listos para el viaje.", "We're ready for the trip."],
      ["El equipaje está en el taxi.", "The luggage is in the taxi."],
    ],
    work: [
      ["Mi oficina es grande y luminosa.", "My office is big and bright."],
      ["El jefe está en una reunión.", "The boss is in a meeting."],
      ["La empresa es líder en su sector.", "The company is a leader in its sector."],
      ["Estoy ocupado con el informe.", "I'm busy with the report."],
      ["El contrato es para un año.", "The contract is for one year."],
      ["Mi colega está enfermo hoy.", "My colleague is sick today."],
      ["La reunión es a las tres.", "The meeting is at three."],
      ["Estamos preparados para la presentación.", "We're prepared for the presentation."],
      ["El trabajo es interesante pero difícil.", "The work is interesting but difficult."],
      ["El documento está en mi escritorio.", "The document is on my desk."],
      ["La entrevista es mañana a las diez.", "The interview is tomorrow at ten."],
      ["Estoy nervioso por la reunión.", "I'm nervous about the meeting."],
      ["El sueldo es bueno para empezar.", "The salary is good for starting out."],
      ["Mi supervisor está de viaje esta semana.", "My supervisor is away this week."],
      ["La impresora está en la sala de al lado.", "The printer is in the next room."],
      ["El proyecto es urgente.", "The project is urgent."],
      ["Estamos contentos con los resultados.", "We're happy with the results."],
      ["El cliente es muy exigente.", "The client is very demanding."],
      ["El correo está en tu bandeja de entrada.", "The email is in your inbox."],
      ["La oficina está en el centro de la ciudad.", "The office is in the city center."],
      ["Mi compañero de trabajo es muy eficiente.", "My coworker is very efficient."],
      ["Estoy cansado después de la presentación.", "I'm tired after the presentation."],
      ["El presupuesto es limitado este trimestre.", "The budget is limited this quarter."],
      ["El plazo es la semana que viene.", "The deadline is next week."],
      ["La empresa está creciendo mucho.", "The company is growing a lot."],
    ],
    family: [
      ["Mi madre es muy cariñosa.", "My mother is very caring."],
      ["Los niños están jugando en el jardín.", "The kids are playing in the garden."],
      ["Mi padre es profesor.", "My father is a teacher."],
      ["La casa está limpia y ordenada.", "The house is clean and tidy."],
      ["Mi hermano es el mayor de todos.", "My brother is the oldest of all."],
      ["Estamos en casa de mis abuelos.", "We're at my grandparents' house."],
      ["Mi hija es muy inteligente.", "My daughter is very smart."],
      ["El bebé está dormido.", "The baby is asleep."],
      ["Mi abuela es la mejor cocinera.", "My grandmother is the best cook."],
      ["El perro está en el jardín.", "The dog is in the garden."],
      ["Mi tío es mecánico.", "My uncle is a mechanic."],
      ["Estoy en la cocina preparando la cena.", "I'm in the kitchen making dinner."],
      ["La familia es lo más importante.", "Family is the most important thing."],
      ["Mi vecino es muy amable.", "My neighbor is very kind."],
      ["Los abuelos están de visita.", "The grandparents are visiting."],
      ["Mi primo es muy divertido.", "My cousin is very funny."],
      ["El gato está en el sofá.", "The cat is on the couch."],
      ["Mi hermana es enfermera.", "My sister is a nurse."],
      ["Estamos contentos con la casa nueva.", "We're happy with the new house."],
      ["El cumpleaños de mi hijo es en marzo.", "My son's birthday is in March."],
      ["La mascota está enferma.", "The pet is sick."],
      ["Mi sobrina es muy simpática.", "My niece is very nice."],
      ["El jardín está lleno de flores.", "The garden is full of flowers."],
      ["Mi cuñado es abogado.", "My brother-in-law is a lawyer."],
      ["Estoy orgulloso de mis hijos.", "I'm proud of my children."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 3: Common Questions (A1) — question words, basic queries
  // ═══════════════════════════════════════════════════════════════════
  3: {
    travel: [
      ["¿Dónde está el aeropuerto?", "Where is the airport?"],
      ["¿Cuánto cuesta el billete de tren?", "How much is the train ticket?"],
      ["¿A qué hora sale el vuelo?", "What time does the flight leave?"],
      ["¿Hay un hotel cerca de aquí?", "Is there a hotel near here?"],
      ["¿Cómo llego a la playa?", "How do I get to the beach?"],
      ["¿Cuántos días dura la excursión?", "How many days does the excursion last?"],
      ["¿Dónde puedo comprar un mapa?", "Where can I buy a map?"],
      ["¿Tiene habitaciones libres?", "Do you have any rooms available?"],
      ["¿Cuál es el mejor restaurante de la zona?", "Which is the best restaurant in the area?"],
      ["¿De dónde sale el autobús turístico?", "Where does the tourist bus leave from?"],
      ["¿Necesito pasaporte para cruzar la frontera?", "Do I need a passport to cross the border?"],
      ["¿Qué monumentos hay en esta ciudad?", "What monuments are there in this city?"],
      ["¿Cuánto tiempo tarda el tren?", "How long does the train take?"],
      ["¿Dónde está la estación de metro?", "Where is the subway station?"],
      ["¿Puede recomendar un hotel bueno?", "Can you recommend a good hotel?"],
      ["¿Está lejos el museo?", "Is the museum far?"],
      ["¿A qué hora cierra la catedral?", "What time does the cathedral close?"],
      ["¿Hay excursiones en español?", "Are there excursions in Spanish?"],
      ["¿Dónde puedo cambiar dinero?", "Where can I exchange money?"],
      ["¿Cuánto cuesta una noche en el hotel?", "How much is one night at the hotel?"],
      ["¿Qué incluye el desayuno del hotel?", "What does the hotel breakfast include?"],
      ["¿Hay WiFi en la habitación?", "Is there WiFi in the room?"],
      ["¿Cuándo llega el próximo tren?", "When does the next train arrive?"],
      ["¿Por dónde se va a la playa?", "Which way to the beach?"],
      ["¿Es seguro nadar aquí?", "Is it safe to swim here?"],
    ],
    work: [
      ["¿A qué hora es la reunión?", "What time is the meeting?"],
      ["¿Dónde está la oficina del jefe?", "Where is the boss's office?"],
      ["¿Cuándo es la fecha límite?", "When is the deadline?"],
      ["¿Quién es el nuevo empleado?", "Who is the new employee?"],
      ["¿Tiene el informe listo?", "Do you have the report ready?"],
      ["¿Cómo funciona la impresora?", "How does the printer work?"],
      ["¿Cuántos clientes tenemos este mes?", "How many clients do we have this month?"],
      ["¿Hay una reunión hoy?", "Is there a meeting today?"],
      ["¿Cuál es el presupuesto del proyecto?", "What is the project budget?"],
      ["¿Quién lleva el contrato?", "Who is handling the contract?"],
      ["¿A qué hora terminas de trabajar?", "What time do you finish work?"],
      ["¿Dónde está la sala de reuniones?", "Where is the meeting room?"],
      ["¿Cuánto es el sueldo?", "How much is the salary?"],
      ["¿Puedo enviar el correo ahora?", "Can I send the email now?"],
      ["¿Qué dice el contrato?", "What does the contract say?"],
      ["¿Cuándo empieza la entrevista?", "When does the interview start?"],
      ["¿Hay plazas vacantes en la empresa?", "Are there job openings at the company?"],
      ["¿Quién es el gerente de ventas?", "Who is the sales manager?"],
      ["¿Cómo va el proyecto?", "How is the project going?"],
      ["¿Necesitas ayuda con la presentación?", "Do you need help with the presentation?"],
      ["¿Cuándo pagan la nómina?", "When do they pay the payroll?"],
      ["¿Dónde está el documento firmado?", "Where is the signed document?"],
      ["¿Por qué se canceló la reunión?", "Why was the meeting canceled?"],
      ["¿Qué departamento necesita más personal?", "Which department needs more staff?"],
      ["¿Hay videoconferencia mañana?", "Is there a video conference tomorrow?"],
    ],
    family: [
      ["¿Cómo están tus padres?", "How are your parents?"],
      ["¿Cuántos hermanos tienes?", "How many siblings do you have?"],
      ["¿Dónde viven tus abuelos?", "Where do your grandparents live?"],
      ["¿Qué prepara tu madre para cenar?", "What is your mother making for dinner?"],
      ["¿Cuántos años tiene tu hijo?", "How old is your son?"],
      ["¿Quién cuida a los niños?", "Who looks after the kids?"],
      ["¿Cuándo es el cumpleaños de tu hermana?", "When is your sister's birthday?"],
      ["¿Tienes mascotas en casa?", "Do you have pets at home?"],
      ["¿Dónde juegan los niños?", "Where do the kids play?"],
      ["¿Cómo se llama tu perro?", "What is your dog's name?"],
      ["¿A qué hora cenan en tu casa?", "What time do they have dinner at your house?"],
      ["¿Viene tu primo a la boda?", "Is your cousin coming to the wedding?"],
      ["¿Qué quiere tu hija de cumpleaños?", "What does your daughter want for her birthday?"],
      ["¿Cuántas habitaciones tiene tu casa?", "How many rooms does your house have?"],
      ["¿Quién limpia la casa?", "Who cleans the house?"],
      ["¿Tu hermano vive solo?", "Does your brother live alone?"],
      ["¿Cómo está tu abuela?", "How is your grandmother?"],
      ["¿Hay jardín en tu casa?", "Is there a garden at your house?"],
      ["¿Quién cocina en tu familia?", "Who cooks in your family?"],
      ["¿Cuándo viene tu tía de visita?", "When is your aunt coming to visit?"],
      ["¿Qué hace tu padre los domingos?", "What does your father do on Sundays?"],
      ["¿Dónde está el gato?", "Where is the cat?"],
      ["¿Por qué llora el bebé?", "Why is the baby crying?"],
      ["¿Tu vecino tiene hijos?", "Does your neighbor have children?"],
      ["¿Cómo se llama tu sobrina?", "What is your niece's name?"],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 4: Articles & Gender (A1) — el/la/los/las, masculine/feminine
  // ═══════════════════════════════════════════════════════════════════
  4: {
    travel: [
      ["El aeropuerto tiene una terminal nueva.", "The airport has a new terminal."],
      ["La maleta está en el autobús.", "The suitcase is on the bus."],
      ["Los turistas visitan las ruinas.", "The tourists visit the ruins."],
      ["El hotel tiene una piscina grande.", "The hotel has a big pool."],
      ["La estación está al lado del museo.", "The station is next to the museum."],
      ["Los billetes cuestan diez euros.", "The tickets cost ten euros."],
      ["La playa tiene arena blanca.", "The beach has white sand."],
      ["El monumento es una iglesia antigua.", "The monument is an old church."],
      ["Las habitaciones del hotel son cómodas.", "The hotel rooms are comfortable."],
      ["Un restaurante con una terraza bonita.", "A restaurant with a nice terrace."],
      ["El mapa muestra las calles principales.", "The map shows the main streets."],
      ["La excursión dura todo el día.", "The excursion lasts all day."],
      ["Los aviones salen de la terminal dos.", "The planes depart from terminal two."],
      ["Una catedral con las puertas enormes.", "A cathedral with enormous doors."],
      ["El pasaporte y la tarjeta de embarque.", "The passport and the boarding pass."],
      ["Las montañas tienen un paisaje increíble.", "The mountains have an incredible landscape."],
      ["Un taxi desde el aeropuerto al hotel.", "A taxi from the airport to the hotel."],
      ["La frontera entre los dos países.", "The border between the two countries."],
      ["El tren pasa por las ciudades principales.", "The train passes through the main cities."],
      ["Los museos abren a las diez de la mañana.", "The museums open at ten in the morning."],
      ["Una isla con las playas más bonitas.", "An island with the most beautiful beaches."],
      ["El crucero sale del puerto a las seis.", "The cruise departs from the port at six."],
      ["La guía tiene un mapa del centro.", "The guide has a map of downtown."],
      ["Los souvenirs de la tienda del museo.", "The souvenirs from the museum shop."],
      ["El equipaje está en la cinta número tres.", "The luggage is on belt number three."],
    ],
    work: [
      ["La oficina tiene un escritorio nuevo.", "The office has a new desk."],
      ["El informe está en la carpeta azul.", "The report is in the blue folder."],
      ["Los empleados tienen una reunión a las tres.", "The employees have a meeting at three."],
      ["La empresa abre una sucursal nueva.", "The company opens a new branch."],
      ["El jefe firma los contratos.", "The boss signs the contracts."],
      ["Una presentación sobre el proyecto nuevo.", "A presentation about the new project."],
      ["Las oficinas están en el centro.", "The offices are downtown."],
      ["El correo electrónico tiene un archivo adjunto.", "The email has an attachment."],
      ["La reunión es en la sala grande.", "The meeting is in the large room."],
      ["Los clientes quieren los resultados.", "The clients want the results."],
      ["Un documento con las cifras del mes.", "A document with the month's figures."],
      ["El presupuesto incluye los gastos del viaje.", "The budget includes the travel expenses."],
      ["La impresora está al lado de la ventana.", "The printer is next to the window."],
      ["Los supervisores revisan los informes.", "The supervisors review the reports."],
      ["El contrato tiene una cláusula importante.", "The contract has an important clause."],
      ["Una factura para el cliente.", "An invoice for the client."],
      ["La empresa tiene los mejores empleados.", "The company has the best employees."],
      ["El departamento necesita un servidor nuevo.", "The department needs a new server."],
      ["Las entrevistas son por la mañana.", "The interviews are in the morning."],
      ["Un ascenso después de dos años.", "A promotion after two years."],
      ["El turno de la noche empieza a las diez.", "The night shift starts at ten."],
      ["La nómina sale el día quince.", "Payroll comes out on the fifteenth."],
      ["Los documentos están en el cajón.", "The documents are in the drawer."],
      ["Una videoconferencia con los socios.", "A video conference with the partners."],
      ["El formulario tiene los datos del candidato.", "The form has the candidate's data."],
    ],
    family: [
      ["La madre prepara el desayuno.", "The mother makes breakfast."],
      ["El padre lleva a los niños al colegio.", "The father takes the kids to school."],
      ["Los hermanos comparten la habitación.", "The siblings share the room."],
      ["La abuela tiene un jardín precioso.", "The grandmother has a lovely garden."],
      ["El bebé necesita una manta nueva.", "The baby needs a new blanket."],
      ["Las hijas ayudan en la cocina.", "The daughters help in the kitchen."],
      ["Un cumpleaños con los primos.", "A birthday with the cousins."],
      ["El perro tiene una caseta en el jardín.", "The dog has a house in the garden."],
      ["La vecina trae un pastel los domingos.", "The neighbor brings a cake on Sundays."],
      ["Los abuelos cuentan las historias de antes.", "The grandparents tell the old stories."],
      ["Una cena con toda la familia.", "A dinner with the whole family."],
      ["El gato duerme en la cama del niño.", "The cat sleeps on the boy's bed."],
      ["La casa tiene un garaje grande.", "The house has a big garage."],
      ["Los tíos viven en las afueras.", "The aunt and uncle live in the suburbs."],
      ["Una mascota para los niños.", "A pet for the kids."],
      ["El sobrino tiene los ojos de su madre.", "The nephew has his mother's eyes."],
      ["La cocina es la habitación más grande.", "The kitchen is the biggest room."],
      ["Los vecinos tienen un perro enorme.", "The neighbors have a huge dog."],
      ["Una boda en el jardín de los abuelos.", "A wedding in the grandparents' garden."],
      ["El hijo juega con las pelotas en el parque.", "The son plays with balls in the park."],
      ["La prima vive en la casa de al lado.", "The cousin lives in the house next door."],
      ["Los niños tienen un cuarto de juegos.", "The kids have a playroom."],
      ["Una receta de la abuela.", "A recipe from grandmother."],
      ["El sofá del salón es muy cómodo.", "The living room couch is very comfortable."],
      ["La familia cena en el comedor.", "The family has dinner in the dining room."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 5: Gustar & Similar (A1) — verbs with indirect object pronouns
  // ═══════════════════════════════════════════════════════════════════
  5: {
    travel: [
      ["Me gusta viajar en tren.", "I like traveling by train."],
      ["Nos encanta la playa.", "We love the beach."],
      ["¿Te gusta este hotel?", "Do you like this hotel?"],
      ["Me interesa la historia de esta ciudad.", "I'm interested in this city's history."],
      ["Nos fascina el monumento.", "The monument fascinates us."],
      ["Me molesta el ruido del aeropuerto.", "The airport noise bothers me."],
      ["¿Te apetece visitar el museo?", "Do you feel like visiting the museum?"],
      ["Me encanta la comida de este restaurante.", "I love the food at this restaurant."],
      ["Nos falta un mapa de la ciudad.", "We're missing a map of the city."],
      ["Me gustan los vuelos directos.", "I like direct flights."],
      ["¿Te importa llevar la maleta?", "Do you mind carrying the suitcase?"],
      ["Nos parece un destino increíble.", "It seems like an incredible destination to us."],
      ["Me aburren los viajes largos en autobús.", "Long bus trips bore me."],
      ["¿Te gustan las excursiones en barco?", "Do you like boat excursions?"],
      ["Me sorprende lo barato que es el hotel.", "I'm surprised how cheap the hotel is."],
      ["Nos conviene tomar el tren temprano.", "Taking the early train suits us."],
      ["Me interesan los museos de arte.", "I'm interested in art museums."],
      ["¿Te apetece ir a la playa hoy?", "Do you feel like going to the beach today?"],
      ["Nos encantan las islas del Mediterráneo.", "We love the Mediterranean islands."],
      ["Me fascinan las catedrales antiguas.", "Ancient cathedrals fascinate me."],
      ["¿Te molesta el calor de la playa?", "Does the beach heat bother you?"],
      ["Me faltan tres días de vacaciones.", "I'm missing three vacation days."],
      ["Nos gustan los hoteles con desayuno.", "We like hotels with breakfast."],
      ["Me parece caro este restaurante.", "This restaurant seems expensive to me."],
      ["¿Te interesan las ruinas romanas?", "Are you interested in the Roman ruins?"],
    ],
    work: [
      ["Me gusta mi trabajo.", "I like my job."],
      ["Nos interesa el nuevo proyecto.", "The new project interests us."],
      ["¿Te molesta el ruido de la oficina?", "Does the office noise bother you?"],
      ["Me encanta trabajar en equipo.", "I love working in a team."],
      ["Nos falta terminar el informe.", "We still need to finish the report."],
      ["Me parece buena la propuesta del jefe.", "The boss's proposal seems good to me."],
      ["¿Te gusta la oficina nueva?", "Do you like the new office?"],
      ["Me aburren las reuniones largas.", "Long meetings bore me."],
      ["Nos conviene firmar el contrato pronto.", "It's convenient for us to sign the contract soon."],
      ["Me sorprende el sueldo que ofrecen.", "The salary they offer surprises me."],
      ["¿Te importa enviar el correo?", "Do you mind sending the email?"],
      ["Me fascina este sector.", "This sector fascinates me."],
      ["Nos gustan los clientes nuevos.", "We like new clients."],
      ["Me interesan los cursos de formación.", "Training courses interest me."],
      ["¿Te apetece un café antes de la reunión?", "Do you feel like a coffee before the meeting?"],
      ["Me falta experiencia en negociación.", "I lack experience in negotiation."],
      ["Nos molesta la impresora vieja.", "The old printer bothers us."],
      ["Me parece urgente este plazo.", "This deadline seems urgent to me."],
      ["¿Te gustan las presentaciones?", "Do you like presentations?"],
      ["Me encanta el ambiente de la empresa.", "I love the company's atmosphere."],
      ["Nos conviene cambiar de proveedor.", "It's convenient for us to change suppliers."],
      ["Me sorprende la decisión del gerente.", "The manager's decision surprises me."],
      ["¿Te interesa el puesto de supervisor?", "Are you interested in the supervisor position?"],
      ["Me aburre el papeleo.", "Paperwork bores me."],
      ["Nos falta presupuesto para el proyecto.", "We lack budget for the project."],
    ],
    family: [
      ["Me gusta cocinar para mi familia.", "I like cooking for my family."],
      ["A mi madre le encanta el jardín.", "My mother loves the garden."],
      ["¿Te gustan los perros o los gatos?", "Do you like dogs or cats?"],
      ["A los niños les gusta jugar en casa.", "The kids like playing at home."],
      ["Me interesa la receta de mi abuela.", "I'm interested in my grandmother's recipe."],
      ["A mi padre le molesta el desorden.", "Mess bothers my father."],
      ["Nos encanta cenar juntos los domingos.", "We love having dinner together on Sundays."],
      ["A mi hermana le fascina la repostería.", "My sister is fascinated by baking."],
      ["Me falta tiempo para estar con mis hijos.", "I lack time to be with my kids."],
      ["¿A tu hijo le gusta el fútbol?", "Does your son like soccer?"],
      ["A mi abuela le parece importante la familia.", "Family seems important to my grandmother."],
      ["Nos aburre quedarnos en casa todo el día.", "Staying home all day bores us."],
      ["A mi tío le conviene vivir cerca.", "Living nearby suits my uncle."],
      ["Me sorprende lo rápido que crecen los niños.", "I'm surprised how fast kids grow."],
      ["A los vecinos les molesta el ruido.", "The noise bothers the neighbors."],
      ["¿Te apetece una cena en familia?", "Do you feel like a family dinner?"],
      ["A mi primo le gustan los videojuegos.", "My cousin likes video games."],
      ["Me encanta la sopa de mi abuela.", "I love my grandmother's soup."],
      ["A mi hija le interesan los animales.", "My daughter is interested in animals."],
      ["Nos importa mucho la educación de los niños.", "We care a lot about the kids' education."],
      ["A mi hermano le fascina la historia.", "History fascinates my brother."],
      ["Me parece bien que los niños ayuden en casa.", "I think it's good that the kids help at home."],
      ["A mi cuñada le gusta organizar cumpleaños.", "My sister-in-law likes organizing birthdays."],
      ["Me falta paciencia con el bebé.", "I lack patience with the baby."],
      ["A los abuelos les encanta ver a los nietos.", "The grandparents love seeing the grandchildren."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 6: Pretérito (A2) — completed past actions
  // ═══════════════════════════════════════════════════════════════════
  6: {
    travel: [
      ["Llegué al aeropuerto a las seis de la mañana.", "I arrived at the airport at six in the morning."],
      ["Reservamos una habitación con vista al mar.", "We booked a room with a sea view."],
      ["El avión despegó con media hora de retraso.", "The plane took off half an hour late."],
      ["Visitamos tres museos en un solo día.", "We visited three museums in a single day."],
      ["Perdí mi maleta en el aeropuerto.", "I lost my suitcase at the airport."],
      ["Comimos en un restaurante típico del puerto.", "We ate at a typical restaurant at the port."],
      ["El guía nos enseñó la catedral.", "The guide showed us the cathedral."],
      ["Tomé el tren de las cuatro a Madrid.", "I took the four o'clock train to Madrid."],
      ["Caminamos por la playa al atardecer.", "We walked along the beach at sunset."],
      ["Compré un souvenir para mi madre.", "I bought a souvenir for my mother."],
      ["El autobús nos dejó en el centro.", "The bus dropped us off downtown."],
      ["Crucé la frontera sin problemas.", "I crossed the border without problems."],
      ["Sacamos muchas fotos del monumento.", "We took many photos of the monument."],
      ["Alquilé un coche para recorrer la costa.", "I rented a car to drive along the coast."],
      ["El hotel nos dio una habitación más grande.", "The hotel gave us a bigger room."],
      ["Pasamos dos noches en un hostal.", "We spent two nights at a hostel."],
      ["Nadé en el mar por primera vez.", "I swam in the sea for the first time."],
      ["El ferry tardó tres horas en llegar.", "The ferry took three hours to arrive."],
      ["Pregunté por el camino a la estación.", "I asked for the way to the station."],
      ["Descubrimos una playa escondida.", "We discovered a hidden beach."],
      ["Cambié dinero en el aeropuerto.", "I exchanged money at the airport."],
      ["El taxista nos cobró demasiado.", "The taxi driver charged us too much."],
      ["Subimos a la montaña en teleférico.", "We went up the mountain by cable car."],
      ["Probé la comida local y me encantó.", "I tried the local food and loved it."],
      ["Volamos directo desde Londres.", "We flew direct from London."],
    ],
    work: [
      ["Terminé el informe antes de las cinco.", "I finished the report before five."],
      ["El jefe aprobó el presupuesto.", "The boss approved the budget."],
      ["Envié el correo a todos los clientes.", "I sent the email to all clients."],
      ["Firmamos el contrato ayer.", "We signed the contract yesterday."],
      ["La reunión duró dos horas.", "The meeting lasted two hours."],
      ["Presenté los resultados al equipo.", "I presented the results to the team."],
      ["Mi colega renunció la semana pasada.", "My colleague resigned last week."],
      ["Entregamos el proyecto a tiempo.", "We delivered the project on time."],
      ["El cliente aceptó nuestra propuesta.", "The client accepted our proposal."],
      ["Contraté a un nuevo empleado.", "I hired a new employee."],
      ["Recibí un ascenso el mes pasado.", "I got a promotion last month."],
      ["La empresa ganó un contrato importante.", "The company won an important contract."],
      ["Organicé una reunión con el departamento.", "I organized a meeting with the department."],
      ["El supervisor revisó mi trabajo.", "The supervisor reviewed my work."],
      ["Preparamos la presentación en tres días.", "We prepared the presentation in three days."],
      ["Llamé al cliente para cerrar el trato.", "I called the client to close the deal."],
      ["Imprimí cincuenta copias del documento.", "I printed fifty copies of the document."],
      ["El gerente canceló la reunión.", "The manager canceled the meeting."],
      ["Trabajé hasta las nueve de la noche.", "I worked until nine at night."],
      ["Negociamos las condiciones del contrato.", "We negotiated the contract terms."],
      ["El equipo cumplió todos los plazos.", "The team met all the deadlines."],
      ["Pedí un aumento de sueldo.", "I asked for a salary raise."],
      ["La videoconferencia empezó tarde.", "The video conference started late."],
      ["Revisamos las cifras del trimestre.", "We reviewed the quarterly figures."],
      ["Mi jefe me felicitó por el proyecto.", "My boss congratulated me on the project."],
    ],
    family: [
      ["Mi madre cocinó una paella enorme.", "My mother cooked a huge paella."],
      ["Los niños jugaron en el jardín toda la tarde.", "The kids played in the garden all afternoon."],
      ["Mi padre arregló la puerta del garaje.", "My father fixed the garage door."],
      ["Celebramos el cumpleaños de mi abuela.", "We celebrated my grandmother's birthday."],
      ["Mi hermana tuvo un bebé el martes.", "My sister had a baby on Tuesday."],
      ["Limpiamos toda la casa el sábado.", "We cleaned the whole house on Saturday."],
      ["El perro rompió un jarrón.", "The dog broke a vase."],
      ["Cené con mis padres anoche.", "I had dinner with my parents last night."],
      ["Mi hijo sacó buenas notas.", "My son got good grades."],
      ["Mi abuelo contó una historia muy divertida.", "My grandfather told a very funny story."],
      ["Preparé un pastel para el aniversario.", "I made a cake for the anniversary."],
      ["Los vecinos nos invitaron a cenar.", "The neighbors invited us for dinner."],
      ["Mi primo se mudó a otra ciudad.", "My cousin moved to another city."],
      ["Lavé toda la ropa el domingo.", "I washed all the clothes on Sunday."],
      ["Mi hija pintó un cuadro precioso.", "My daughter painted a beautiful picture."],
      ["Compramos un sofá nuevo para el salón.", "We bought a new couch for the living room."],
      ["Mi tía nos visitó el fin de semana.", "My aunt visited us over the weekend."],
      ["El gato se escapó de casa.", "The cat escaped from the house."],
      ["Plantamos árboles en el jardín.", "We planted trees in the garden."],
      ["Mi hermano y yo jugamos al fútbol.", "My brother and I played soccer."],
      ["Mi sobrina empezó a caminar ayer.", "My niece started walking yesterday."],
      ["Organizamos una barbacoa en el jardín.", "We organized a barbecue in the garden."],
      ["Mi esposo cocinó por primera vez.", "My husband cooked for the first time."],
      ["Los abuelos nos regalaron un perro.", "The grandparents gave us a dog as a gift."],
      ["Pasamos la Navidad en casa de mis padres.", "We spent Christmas at my parents' house."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 7: Imperfecto (A2) — habitual/ongoing past
  // ═══════════════════════════════════════════════════════════════════
  7: {
    travel: [
      ["Cuando era niño, viajábamos a la playa cada verano.", "When I was a child, we would travel to the beach every summer."],
      ["El hotel donde nos alojábamos tenía una piscina enorme.", "The hotel where we stayed had a huge pool."],
      ["Siempre tomábamos el tren de las ocho.", "We always took the eight o'clock train."],
      ["Los turistas paseaban por la plaza todas las tardes.", "The tourists walked around the square every afternoon."],
      ["El restaurante del puerto cerraba muy tarde.", "The restaurant at the port closed very late."],
      ["Antes, los vuelos eran mucho más caros.", "Before, flights were much more expensive."],
      ["Visitábamos la catedral cada vez que íbamos.", "We visited the cathedral every time we went."],
      ["El autobús pasaba cada veinte minutos.", "The bus came every twenty minutes."],
      ["Mientras esperaba el avión, leía un libro.", "While I waited for the plane, I read a book."],
      ["De pequeño, soñaba con viajar por el mundo.", "As a kid, I dreamed of traveling the world."],
      ["La playa estaba siempre llena en agosto.", "The beach was always full in August."],
      ["Antes no necesitábamos pasaporte para ir allí.", "Before, we didn't need a passport to go there."],
      ["El tren llegaba tarde todos los días.", "The train arrived late every day."],
      ["Siempre nos perdíamos en esa ciudad.", "We always got lost in that city."],
      ["El museo abría solo por las mañanas.", "The museum was only open in the mornings."],
      ["Llevábamos maletas enormes en cada viaje.", "We carried huge suitcases on every trip."],
      ["El guía contaba historias muy interesantes.", "The guide told very interesting stories."],
      ["Cada verano alquilábamos la misma casa.", "Every summer we rented the same house."],
      ["Las excursiones duraban todo el día.", "The excursions lasted all day."],
      ["Mientras cruzábamos la frontera, llovía mucho.", "While we crossed the border, it rained a lot."],
      ["Recorríamos los mercados buscando recuerdos.", "We wandered through markets looking for souvenirs."],
      ["El barco salía del puerto al amanecer.", "The boat left the port at dawn."],
      ["Comíamos en restaurantes diferentes cada noche.", "We ate at different restaurants every night."],
      ["El hotel tenía una vista increíble de las montañas.", "The hotel had an incredible view of the mountains."],
      ["Siempre sacábamos muchas fotos de los monumentos.", "We always took many photos of the monuments."],
    ],
    work: [
      ["Antes trabajaba en una oficina pequeña.", "Before, I worked in a small office."],
      ["Mi jefe anterior era muy estricto.", "My previous boss was very strict."],
      ["Teníamos reuniones todos los lunes.", "We had meetings every Monday."],
      ["Cuando empecé, no sabía usar la impresora.", "When I started, I didn't know how to use the printer."],
      ["Los clientes llamaban constantemente.", "The clients called constantly."],
      ["Siempre terminaba de trabajar a las seis.", "I always finished work at six."],
      ["El presupuesto era más limitado antes.", "The budget was more limited before."],
      ["Preparaba informes cada semana.", "I prepared reports every week."],
      ["Mi colega llegaba tarde todos los días.", "My colleague arrived late every day."],
      ["La empresa tenía menos empleados.", "The company had fewer employees."],
      ["Mientras redactaba el contrato, sonó el teléfono.", "While I was drafting the contract, the phone rang."],
      ["El supervisor revisaba todo antes de enviar.", "The supervisor reviewed everything before sending."],
      ["Antes no teníamos videoconferencias.", "Before, we didn't have video conferences."],
      ["Yo ganaba menos cuando empecé.", "I earned less when I started."],
      ["La oficina cerraba a las siete de la tarde.", "The office closed at seven in the evening."],
      ["Trabajábamos los sábados en temporada alta.", "We worked Saturdays during peak season."],
      ["El gerente siempre pedía más datos.", "The manager always asked for more data."],
      ["Enviaba correos a los clientes cada mañana.", "I sent emails to clients every morning."],
      ["Antes, el turno de noche era obligatorio.", "Before, the night shift was mandatory."],
      ["La impresora se rompía constantemente.", "The printer broke down constantly."],
      ["Mis compañeros de trabajo eran muy amables.", "My coworkers were very kind."],
      ["El jefe nos daba poco tiempo para los plazos.", "The boss gave us little time for deadlines."],
      ["La empresa pagaba bien pero exigía mucho.", "The company paid well but demanded a lot."],
      ["Cada trimestre presentábamos los resultados.", "Every quarter we presented the results."],
      ["Mientras preparaba la presentación, mi colega me ayudaba.", "While I prepared the presentation, my colleague helped me."],
    ],
    family: [
      ["Cuando era pequeño, mi madre me leía cuentos.", "When I was little, my mother read me stories."],
      ["Mi abuela siempre hacía sopa los domingos.", "My grandmother always made soup on Sundays."],
      ["Los niños jugaban en la calle hasta las nueve.", "The kids played in the street until nine."],
      ["Mi padre llegaba a casa a las siete.", "My father got home at seven."],
      ["Todos los veranos íbamos a casa de los abuelos.", "Every summer we went to the grandparents' house."],
      ["Mi hermana y yo compartíamos habitación.", "My sister and I shared a room."],
      ["El perro nos esperaba siempre en la puerta.", "The dog always waited for us at the door."],
      ["Mi tía vivía al lado de nuestra casa.", "My aunt lived next door to our house."],
      ["De niña, mi prima venía a jugar todos los sábados.", "As a girl, my cousin came to play every Saturday."],
      ["Mi madre cocinaba una paella enorme los domingos.", "My mother cooked a huge paella on Sundays."],
      ["Limpiábamos la casa entre todos.", "We all cleaned the house together."],
      ["Mi padre nos contaba chistes en la cena.", "My father told us jokes at dinner."],
      ["El gato dormía en la cama de mi hermano.", "The cat slept on my brother's bed."],
      ["Los vecinos nos traían fruta del huerto.", "The neighbors brought us fruit from the orchard."],
      ["Cenábamos siempre a las nueve en punto.", "We always had dinner at nine sharp."],
      ["Mi abuelo nos enseñaba a pescar.", "My grandfather taught us to fish."],
      ["De pequeños, mis primos y yo jugábamos al fútbol.", "As kids, my cousins and I played soccer."],
      ["Mi hermano rompía todo lo que tocaba.", "My brother broke everything he touched."],
      ["Celebrábamos la Navidad con toda la familia.", "We celebrated Christmas with the whole family."],
      ["Mi madre nos despertaba temprano para el colegio.", "My mother woke us up early for school."],
      ["El bebé lloraba todas las noches.", "The baby cried every night."],
      ["Mi padre cuidaba el jardín los fines de semana.", "My father took care of the garden on weekends."],
      ["Mientras mi madre cocinaba, yo ponía la mesa.", "While my mother cooked, I set the table."],
      ["Mi sobrina era muy tímida de pequeña.", "My niece was very shy as a little girl."],
      ["Teníamos un perro que se llamaba Toby.", "We had a dog named Toby."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 8: Reflexive Verbs (A2) — daily routines
  // ═══════════════════════════════════════════════════════════════════
  8: {
    travel: [
      ["Me despierto temprano para coger el vuelo.", "I wake up early to catch the flight."],
      ["Nos alojamos en un hotel cerca de la playa.", "We stay at a hotel near the beach."],
      ["Me ducho antes de salir a explorar la ciudad.", "I shower before going out to explore the city."],
      ["Se nota mucho la diferencia con el otro hotel.", "You can really notice the difference with the other hotel."],
      ["Nos sentamos en una terraza del puerto.", "We sit at a terrace by the port."],
      ["Me visto rápido para no perder el autobús.", "I get dressed quickly so I don't miss the bus."],
      ["Se aburren los niños en el aeropuerto.", "The kids get bored at the airport."],
      ["Nos quedamos tres días en la montaña.", "We stay three days in the mountains."],
      ["Me pierdo siempre en las ciudades grandes.", "I always get lost in big cities."],
      ["Se acuesta tarde porque sale por la noche.", "He goes to bed late because he goes out at night."],
      ["Nos levantamos al amanecer para ver el templo.", "We get up at dawn to see the temple."],
      ["Me preparo para la excursión del día.", "I get ready for the day's excursion."],
      ["Se siente cansado después del vuelo.", "He feels tired after the flight."],
      ["Nos divertimos mucho en la playa.", "We have a lot of fun at the beach."],
      ["Me pongo protector solar antes de salir.", "I put on sunscreen before going out."],
      ["Se pierden los turistas en el mercado.", "The tourists get lost in the market."],
      ["Nos acostumbramos rápido al clima tropical.", "We get used to the tropical climate quickly."],
      ["Me relajo en la piscina del hotel.", "I relax at the hotel pool."],
      ["Se despiertan con la luz del sol en la isla.", "They wake up with the sunlight on the island."],
      ["Nos encontramos en la estación a las ocho.", "We meet at the station at eight."],
      ["Me afeito en el baño del hotel.", "I shave in the hotel bathroom."],
      ["Se sientan en la arena a ver el atardecer.", "They sit on the sand to watch the sunset."],
      ["Nos arreglamos para cenar en el restaurante.", "We get ready to have dinner at the restaurant."],
      ["Me quedo una semana más de vacaciones.", "I stay an extra week on vacation."],
      ["Se marchó del hotel sin pagar.", "He left the hotel without paying."],
    ],
    work: [
      ["Me levanto a las seis para ir a la oficina.", "I get up at six to go to the office."],
      ["Se reúne el equipo cada lunes.", "The team meets every Monday."],
      ["Me preparo para la presentación de mañana.", "I get ready for tomorrow's presentation."],
      ["Nos sentamos alrededor de la mesa grande.", "We sit around the big table."],
      ["Se queja el cliente del servicio.", "The client complains about the service."],
      ["Me concentro mejor por las mañanas.", "I concentrate better in the mornings."],
      ["Se organiza una fiesta de despedida.", "A farewell party is organized."],
      ["Nos despedimos del colega que se va.", "We say goodbye to the colleague who's leaving."],
      ["Me pongo el traje para la entrevista.", "I put on a suit for the interview."],
      ["Se estresa mucho con los plazos.", "He gets very stressed with deadlines."],
      ["Me siento satisfecho con el resultado.", "I feel satisfied with the result."],
      ["Nos adaptamos al nuevo horario.", "We adapt to the new schedule."],
      ["Se dedica a atender clientes.", "She dedicates herself to serving clients."],
      ["Me comprometo a terminar antes del viernes.", "I commit to finishing before Friday."],
      ["Se encarga del informe mensual.", "He takes care of the monthly report."],
      ["Nos comunicamos por correo electrónico.", "We communicate by email."],
      ["Me aburro en las reuniones largas.", "I get bored in long meetings."],
      ["Se disculpa por llegar tarde.", "He apologizes for arriving late."],
      ["Me despierto preocupado por el proyecto.", "I wake up worried about the project."],
      ["Nos turnamos para cubrir el turno de noche.", "We take turns covering the night shift."],
      ["Se marcha temprano los viernes.", "He leaves early on Fridays."],
      ["Me cambio de ropa en la oficina.", "I change clothes at the office."],
      ["Se incorpora un nuevo empleado mañana.", "A new employee starts tomorrow."],
      ["Nos esforzamos por cumplir los plazos.", "We make an effort to meet the deadlines."],
      ["Me quedo hasta tarde para terminar el contrato.", "I stay late to finish the contract."],
    ],
    family: [
      ["Los niños se despiertan a las siete.", "The kids wake up at seven."],
      ["Me ducho mientras los niños desayunan.", "I shower while the kids have breakfast."],
      ["Mi madre se levanta la primera en casa.", "My mother gets up first in the house."],
      ["Nos sentamos juntos a cenar.", "We sit together for dinner."],
      ["El bebé se duerme en mis brazos.", "The baby falls asleep in my arms."],
      ["Mi padre se afeita cada mañana.", "My father shaves every morning."],
      ["Los niños se visten solos para el colegio.", "The kids get dressed by themselves for school."],
      ["Me preocupo cuando mi hijo llega tarde.", "I worry when my son arrives late."],
      ["Mi hermana se peina frente al espejo.", "My sister does her hair in front of the mirror."],
      ["Nos acostamos temprano entre semana.", "We go to bed early on weekdays."],
      ["El perro se esconde debajo de la cama.", "The dog hides under the bed."],
      ["Mi abuela se queda dormida en el sofá.", "My grandmother falls asleep on the couch."],
      ["Los niños se pelean por los juguetes.", "The kids fight over toys."],
      ["Me arreglo para ir a la boda de mi primo.", "I get ready to go to my cousin's wedding."],
      ["Mi hijo se lava las manos antes de comer.", "My son washes his hands before eating."],
      ["Nos divertimos mucho en las reuniones familiares.", "We have a lot of fun at family gatherings."],
      ["Mi hija se enfada cuando no puede salir.", "My daughter gets angry when she can't go out."],
      ["Mi padre se relaja viendo la televisión.", "My father relaxes watching TV."],
      ["Los abuelos se acuestan a las diez.", "The grandparents go to bed at ten."],
      ["Mi hermano se muda de casa la próxima semana.", "My brother moves house next week."],
      ["El gato se sube al sofá cuando nadie mira.", "The cat gets on the couch when no one's looking."],
      ["Nos reunimos en casa de mis padres.", "We get together at my parents' house."],
      ["Mi vecina se ofrece a cuidar a los niños.", "My neighbor offers to look after the kids."],
      ["Me alegro de ver a toda la familia junta.", "I'm glad to see the whole family together."],
      ["Los niños se bañan antes de cenar.", "The kids bathe before dinner."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 9: Por vs Para (A2) — preposition distinction
  // ═══════════════════════════════════════════════════════════════════
  9: {
    travel: [
      ["Vamos para el aeropuerto.", "We're heading to the airport."],
      ["Pagamos veinte euros por la excursión.", "We paid twenty euros for the excursion."],
      ["El tren pasa por la estación central.", "The train passes through the central station."],
      ["Para llegar al hotel, gira a la derecha.", "To get to the hotel, turn right."],
      ["Caminamos por la playa durante dos horas.", "We walked along the beach for two hours."],
      ["El vuelo sale por la mañana.", "The flight leaves in the morning."],
      ["Compré un billete para el museo.", "I bought a ticket for the museum."],
      ["Gracias por la recomendación del restaurante.", "Thanks for the restaurant recommendation."],
      ["Para un turista, esta ciudad es perfecta.", "For a tourist, this city is perfect."],
      ["El autobús pasa por el centro histórico.", "The bus goes through the historic center."],
      ["Pagué mucho por la habitación del hotel.", "I paid a lot for the hotel room."],
      ["Salimos para la montaña a las ocho.", "We set off for the mountains at eight."],
      ["Viajamos por toda la costa.", "We traveled along the whole coast."],
      ["Para reservar, necesitas tu pasaporte.", "To book, you need your passport."],
      ["El guía trabaja por la mañana.", "The guide works in the morning."],
      ["Este mapa es para los turistas.", "This map is for tourists."],
      ["Fuimos al museo por curiosidad.", "We went to the museum out of curiosity."],
      ["Para visitar las ruinas, hay que caminar mucho.", "To visit the ruins, you have to walk a lot."],
      ["Compré un souvenir por cinco euros.", "I bought a souvenir for five euros."],
      ["Tomamos el tren para Barcelona.", "We took the train to Barcelona."],
      ["Pasamos por la catedral de camino al hotel.", "We passed by the cathedral on the way to the hotel."],
      ["El equipaje es para el viaje de mañana.", "The luggage is for tomorrow's trip."],
      ["Por la tarde visitamos las ruinas.", "In the afternoon we visited the ruins."],
      ["Este barco es para cruzar a la isla.", "This boat is for crossing to the island."],
      ["Gracias por llevar mi maleta.", "Thanks for carrying my suitcase."],
    ],
    work: [
      ["Trabajo para una empresa internacional.", "I work for an international company."],
      ["El informe es para el jefe.", "The report is for the boss."],
      ["Hablé por teléfono con el cliente.", "I spoke on the phone with the client."],
      ["Para terminar el proyecto, necesitamos más tiempo.", "To finish the project, we need more time."],
      ["Enviaron el contrato por correo.", "They sent the contract by email."],
      ["La reunión es para discutir el presupuesto.", "The meeting is to discuss the budget."],
      ["Gracias por enviar el documento.", "Thanks for sending the document."],
      ["Trabajo por la noche los martes.", "I work at night on Tuesdays."],
      ["Para un empleado nuevo, lo haces muy bien.", "For a new employee, you're doing very well."],
      ["Cambié mi turno por el de mi compañero.", "I swapped my shift for my colleague's."],
      ["Firmé el contrato por tres años.", "I signed the contract for three years."],
      ["Para conseguir el ascenso, hay que esforzarse.", "To get the promotion, you have to work hard."],
      ["El documento fue revisado por el supervisor.", "The document was reviewed by the supervisor."],
      ["Para la entrevista, prepara un buen currículum.", "For the interview, prepare a good resume."],
      ["Paso por la oficina del gerente cada mañana.", "I pass by the manager's office every morning."],
      ["Esta impresora es para todo el departamento.", "This printer is for the whole department."],
      ["Gano mil euros por mes.", "I earn one thousand euros per month."],
      ["Para cumplir el plazo, trabajamos el fin de semana.", "To meet the deadline, we worked the weekend."],
      ["Negociamos el precio por dos horas.", "We negotiated the price for two hours."],
      ["El correo es para confirmar la reunión.", "The email is to confirm the meeting."],
      ["Mandaron el presupuesto por fax.", "They sent the budget by fax."],
      ["Para mejorar las ventas, contratamos más personal.", "To improve sales, we hired more staff."],
      ["Gracias por tu ayuda con la presentación.", "Thanks for your help with the presentation."],
      ["El formulario es para los nuevos empleados.", "The form is for new employees."],
      ["Fui despedido por llegar tarde.", "I was fired for arriving late."],
    ],
    family: [
      ["Cocino para toda la familia.", "I cook for the whole family."],
      ["Gracias por cuidar a los niños.", "Thanks for looking after the kids."],
      ["Pasé por casa de mis padres.", "I stopped by my parents' house."],
      ["Para el cumpleaños, compramos un pastel.", "For the birthday, we bought a cake."],
      ["Llamé a mi madre por teléfono.", "I called my mother by phone."],
      ["Este regalo es para mi abuela.", "This gift is for my grandmother."],
      ["Los niños corren por el jardín.", "The kids run around the garden."],
      ["Para preparar la cena, necesito ayuda.", "To make dinner, I need help."],
      ["Mi hermana vino por la tarde.", "My sister came in the afternoon."],
      ["Para los niños, lo más importante es jugar.", "For kids, the most important thing is playing."],
      ["Compré flores por el aniversario.", "I bought flowers for the anniversary."],
      ["Pasamos por el parque de camino a casa.", "We went through the park on the way home."],
      ["Para mi hijo, esta bicicleta es perfecta.", "For my son, this bike is perfect."],
      ["Mi padre trabaja por la familia.", "My father works for the family."],
      ["Gracias por la cena, mamá.", "Thanks for dinner, mom."],
      ["Limpiamos la casa para la visita de los abuelos.", "We clean the house for the grandparents' visit."],
      ["El perro ladra por la noche.", "The dog barks at night."],
      ["Para mi hija, compré un vestido nuevo.", "For my daughter, I bought a new dress."],
      ["Fui al supermercado por la leche.", "I went to the supermarket for the milk."],
      ["Para la boda de mi primo, necesito un traje.", "For my cousin's wedding, I need a suit."],
      ["Mi tía hizo un pastel por nosotros.", "My aunt made a cake for us."],
      ["Para vivir bien, hay que estar cerca de la familia.", "To live well, you need to be close to family."],
      ["Pasamos por la casa de los vecinos.", "We stopped by the neighbors' house."],
      ["Este sofá es para el salón nuevo.", "This couch is for the new living room."],
      ["Gracias por venir a la cena.", "Thanks for coming to dinner."],
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE 10: Object Pronouns (A2) — me/te/lo/la/nos/les
  // ═══════════════════════════════════════════════════════════════════
  10: {
    travel: [
      ["El guía nos explicó la historia del monumento.", "The guide explained the monument's history to us."],
      ["¿Me puede indicar dónde está el museo?", "Can you tell me where the museum is?"],
      ["La recepcionista nos dio las llaves.", "The receptionist gave us the keys."],
      ["Lo compré en la tienda del aeropuerto.", "I bought it at the airport shop."],
      ["Te recomiendo este restaurante.", "I recommend this restaurant to you."],
      ["Les cobran más a los turistas.", "They charge tourists more."],
      ["La vi desde el mirador.", "I saw it from the lookout."],
      ["Nos mostraron la habitación del hotel.", "They showed us the hotel room."],
      ["¿Te gustó la excursión?", "Did you like the excursion?"],
      ["Lo perdí en la estación de tren.", "I lost it at the train station."],
      ["Me dijeron que el museo cierra a las cinco.", "They told me the museum closes at five."],
      ["La reservamos por internet.", "We booked it online."],
      ["Nos llevaron al aeropuerto en taxi.", "They took us to the airport by taxi."],
      ["¿Te dieron el mapa en la recepción?", "Did they give you the map at reception?"],
      ["Les pregunté por el camino a la playa.", "I asked them the way to the beach."],
      ["Lo encontré en el autobús.", "I found it on the bus."],
      ["Me ayudó a cargar el equipaje.", "He helped me load the luggage."],
      ["La visitamos el último día del viaje.", "We visited it on the last day of the trip."],
      ["Nos enseñaron las ruinas del castillo.", "They showed us the castle ruins."],
      ["Te mando las fotos del viaje.", "I'll send you the trip photos."],
      ["Los vi en la estación esperando el tren.", "I saw them at the station waiting for the train."],
      ["Me cobraron extra por el equipaje.", "They charged me extra for the luggage."],
      ["La catedral, la vimos al atardecer.", "The cathedral, we saw it at sunset."],
      ["Nos vendió unos souvenirs muy bonitos.", "He sold us some very nice souvenirs."],
      ["¿Le preguntaste al guía por la catedral?", "Did you ask the guide about the cathedral?"],
    ],
    work: [
      ["Mi jefe me pidió el informe.", "My boss asked me for the report."],
      ["Te envío el contrato por correo.", "I'll send you the contract by email."],
      ["Los clientes nos llamaron esta mañana.", "The clients called us this morning."],
      ["Lo imprimí antes de la reunión.", "I printed it before the meeting."],
      ["Le presenté la propuesta al gerente.", "I presented the proposal to the manager."],
      ["La terminé anoche, la presentación.", "I finished it last night, the presentation."],
      ["Me ascendieron el mes pasado.", "They promoted me last month."],
      ["Nos pidieron más datos del proyecto.", "They asked us for more project data."],
      ["¿Te dieron feedback sobre el informe?", "Did they give you feedback about the report?"],
      ["Les explicamos las condiciones del contrato.", "We explained the contract terms to them."],
      ["Lo revisé tres veces antes de enviarlo.", "I reviewed it three times before sending it."],
      ["Me contrataron hace dos meses.", "They hired me two months ago."],
      ["Nos informaron del cambio de horario.", "They informed us of the schedule change."],
      ["¿Le dijiste al supervisor?", "Did you tell the supervisor?"],
      ["La empresa nos paga bien.", "The company pays us well."],
      ["Te recomiendo para el puesto.", "I recommend you for the position."],
      ["Lo firmó el director esta mañana.", "The director signed it this morning."],
      ["Me dieron el turno de noche.", "They gave me the night shift."],
      ["Les mandé la factura a los clientes.", "I sent the invoice to the clients."],
      ["La reunión, la cancelaron a última hora.", "The meeting, they canceled it at the last minute."],
      ["Nos asignaron un nuevo proyecto.", "They assigned us a new project."],
      ["¿Te explicó el gerente los cambios?", "Did the manager explain the changes to you?"],
      ["Lo necesito antes del viernes.", "I need it before Friday."],
      ["Me comunicaron la decisión por correo.", "They communicated the decision to me by email."],
      ["Le pregunté al jefe por mi sueldo.", "I asked the boss about my salary."],
    ],
    family: [
      ["Mi madre me llamó esta mañana.", "My mother called me this morning."],
      ["Les preparé la cena a los niños.", "I made dinner for the kids."],
      ["¿Te contó tu hermana la noticia?", "Did your sister tell you the news?"],
      ["Lo encontré debajo del sofá.", "I found it under the couch."],
      ["Mi abuela nos enseñó a cocinar.", "My grandmother taught us to cook."],
      ["La llevé al veterinario, a la gata.", "I took her to the vet, the cat."],
      ["Me regalaron un perro por mi cumpleaños.", "They gave me a dog for my birthday."],
      ["Le dije a mi padre la verdad.", "I told my father the truth."],
      ["Nos visitaron los vecinos el domingo.", "The neighbors visited us on Sunday."],
      ["Los niños me pidieron un cuento.", "The kids asked me for a story."],
      ["Te ayudo con la limpieza de la casa.", "I'll help you with cleaning the house."],
      ["Le compramos un regalo a la abuela.", "We bought a gift for grandmother."],
      ["Me preocupa mi hijo cuando sale tarde.", "I worry about my son when he's out late."],
      ["La vi en el jardín plantando flores.", "I saw her in the garden planting flowers."],
      ["Nos invitaron a la boda de mi primo.", "They invited us to my cousin's wedding."],
      ["¿Le diste de comer al perro?", "Did you feed the dog?"],
      ["Los abuelos nos traen dulces.", "The grandparents bring us sweets."],
      ["Le conté a mi hermano lo que pasó.", "I told my brother what happened."],
      ["Me despertó el bebé a las tres.", "The baby woke me up at three."],
      ["La receta, me la dio mi tía.", "The recipe, my aunt gave it to me."],
      ["Nos cuidaba la vecina cuando éramos niños.", "The neighbor looked after us when we were kids."],
      ["Te dejo la basura para que la saques.", "I leave you the trash to take out."],
      ["Les prometí a mis hijos ir al parque.", "I promised my kids we'd go to the park."],
      ["Lo arregló mi padre en cinco minutos.", "My father fixed it in five minutes."],
      ["Mi hermana me prestó su coche.", "My sister lent me her car."],
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────────────────────────────

console.log('=== SEMANTIC RETAG & GAP-FILL SCRIPT (Nodes 1-10) ===\n');
console.log(`Deck size: ${deck.length} cards\n`);

// Collect before stats
const beforeStats = {};
for (let nodeNum = 1; nodeNum <= 10; nodeNum++) {
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
for (let nodeNum = 1; nodeNum <= 10; nodeNum++) {
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
for (let nodeNum = 1; nodeNum <= 10; nodeNum++) {
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

for (let nodeNum = 1; nodeNum <= 10; nodeNum++) {
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
console.log('\u2500'.repeat(80));
console.log('PER-NODE STATS (Before retag \u2192 After retag \u2192 After new cards)');
console.log('\u2500'.repeat(80));

for (let nodeNum = 1; nodeNum <= 10; nodeNum++) {
  const def = NODE_DEFS[nodeNum];
  const target = TARGET_COUNT[def.tier];
  console.log(`\nNode ${nodeNum}: ${def.name} (${def.tier}) \u2014 target: ${target} per goal`);

  for (const goal of GOALS) {
    const before = beforeStats[nodeNum][goal];
    const afterRetag = afterRetagStats[nodeNum][goal];
    const newForGoal = newCardsByNode[nodeNum].filter(c => c.tags.includes(goal)).length;
    const finalCount = afterRetag + newForGoal;
    const status = finalCount >= target ? 'OK' : `NEED ${target - finalCount} more`;

    console.log(`  ${goal.padEnd(8)}: ${String(before).padStart(3)} \u2192 ${String(afterRetag).padStart(3)} (retag) \u2192 ${String(finalCount).padStart(3)} (${status})`);
  }
  console.log(`  New cards added: ${newCardsByNode[nodeNum].length}`);
}

console.log(`\n${'\u2500'.repeat(80)}`);
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
