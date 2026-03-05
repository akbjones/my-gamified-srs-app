/**
 * expand-final-a.cjs
 *
 * Add ~540 new cards for nodes 1-10 (A1-A2 grammar) to the Spanish deck.
 * ~54 cards per node covering:
 *   Node 1: Ser vs Estar (A1)
 *   Node 2: Present Tense Regulars (A1)
 *   Node 3: Articles & Gender (A1)
 *   Node 4: Common Phrases & Questions (A1)
 *   Node 5: Present Irregular Verbs (A1)
 *   Node 6: Past Tense – Pretérito (A2)
 *   Node 7: Past Tense – Imperfecto (A2)
 *   Node 8: Reflexive Verbs & Daily Routine (A2)
 *   Node 9: Object Pronouns (A2)
 *   Node 10: Prepositions & Directions (A2)
 *
 * Tags boosted for "work" to address underrepresentation (~35% work).
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
  // NODE 1: Ser vs Estar (A1)
  // Identity/origin/traits (ser) vs state/location/feelings (estar)
  // ═══════════════════════════════════════════════════════════════
  1: [
    { target: "Soy de un pueblo pequeño cerca de Valencia.", english: "I'm from a small town near Valencia.", tags: ["general", "travel"], grammar: "Ser + de for origin" },
    { target: "Mi hermana es profesora en un colegio público.", english: "My sister is a teacher at a public school.", tags: ["general", "family", "work"] },
    { target: "Estoy cansado después de la reunión.", english: "I'm tired after the meeting.", tags: ["general", "work"], grammar: "Estar for temporary physical states" },
    { target: "La oficina está en el tercer piso.", english: "The office is on the third floor.", tags: ["general", "work"] },
    { target: "Es importante llegar a tiempo al trabajo.", english: "It's important to arrive on time to work.", tags: ["general", "work"] },
    { target: "¿Estás listo para salir?", english: "Are you ready to go out?", tags: ["general"] },
    { target: "Mi padre es alto y tiene el pelo oscuro.", english: "My father is tall and has dark hair.", tags: ["general", "family"], grammar: "Ser for permanent physical traits" },
    { target: "Estamos contentos con la nueva casa.", english: "We're happy with the new house.", tags: ["general", "family"] },
    { target: "Es un día perfecto para ir a la playa.", english: "It's a perfect day to go to the beach.", tags: ["general", "travel"] },
    { target: "Estoy preocupado por el examen de mañana.", english: "I'm worried about tomorrow's exam.", tags: ["general"] },
    { target: "Mi jefe es muy exigente pero justo.", english: "My boss is very demanding but fair.", tags: ["general", "work"], grammar: "Ser for inherent personality traits" },
    { target: "El hotel está bastante lejos del centro.", english: "The hotel is quite far from the center.", tags: ["general", "travel"] },
    { target: "¿De dónde eres tú?", english: "Where are you from?", tags: ["general", "travel"] },
    { target: "Estoy en casa de mis padres este fin de semana.", english: "I'm at my parents' house this weekend.", tags: ["general", "family"] },
    { target: "Ella es muy buena en su trabajo.", english: "She's very good at her job.", tags: ["general", "work"] },
    { target: "El café está frío, ¿me traes otro?", english: "The coffee is cold, can you bring me another one?", tags: ["general"], grammar: "Estar for temporary state of things" },
    { target: "Somos cinco hermanos en total.", english: "We're five siblings in total.", tags: ["general", "family"] },
    { target: "Estoy ocupado ahora mismo, te llamo luego.", english: "I'm busy right now, I'll call you later.", tags: ["general", "work"] },
    { target: "Mi abuela es una persona muy generosa.", english: "My grandmother is a very generous person.", tags: ["general", "family"] },
    { target: "¿Están abiertas las tiendas los domingos?", english: "Are the stores open on Sundays?", tags: ["general", "travel"], grammar: "Estar for states that can change (open/closed)" },
    { target: "Es difícil encontrar aparcamiento en el centro.", english: "It's hard to find parking downtown.", tags: ["general", "travel"] },
    { target: "Estoy nervioso por la entrevista de trabajo.", english: "I'm nervous about the job interview.", tags: ["general", "work"] },
    { target: "Mi compañero de trabajo es de Argentina.", english: "My coworker is from Argentina.", tags: ["general", "work"] },
    { target: "La paella está riquísima hoy.", english: "The paella is delicious today.", tags: ["general"], grammar: "Estar for food taste (temporary experience)" },
    { target: "Ser puntual es fundamental en los negocios.", english: "Being punctual is essential in business.", tags: ["general", "work"] },
    { target: "Estamos perdidos, ¿nos puede ayudar?", english: "We're lost, can you help us?", tags: ["general", "travel"] },
    { target: "Mi tío es médico en un hospital grande.", english: "My uncle is a doctor at a big hospital.", tags: ["general", "family", "work"] },
    { target: "Hoy estoy de buen humor.", english: "Today I'm in a good mood.", tags: ["general"], grammar: "Estar de + noun for mood/state" },
    { target: "Es normal sentirse así los primeros días.", english: "It's normal to feel that way the first few days.", tags: ["general", "work"] },
    { target: "La comida ya está lista.", english: "The food is ready.", tags: ["general", "family"] },
    { target: "Somos un equipo muy unido en la oficina.", english: "We're a very close team at the office.", tags: ["general", "work"] },
    { target: "¿Dónde está la parada de autobús más cercana?", english: "Where is the nearest bus stop?", tags: ["general", "travel"] },
    { target: "Mi madre es la mejor cocinera del mundo.", english: "My mother is the best cook in the world.", tags: ["general", "family"] },
    { target: "Estoy encantado de conocerte.", english: "I'm delighted to meet you.", tags: ["general", "work"] },
    { target: "Es imposible terminar todo esto hoy.", english: "It's impossible to finish all of this today.", tags: ["general", "work"] },
    { target: "Estamos de vacaciones hasta el lunes.", english: "We're on vacation until Monday.", tags: ["general", "travel"], grammar: "Estar de + noun for temporary situations" },
    { target: "La reunión es a las diez en la sala grande.", english: "The meeting is at ten in the big room.", tags: ["general", "work"], grammar: "Ser for scheduled events" },
    { target: "Está lloviendo desde esta mañana.", english: "It's been raining since this morning.", tags: ["general"] },
    { target: "Es mi primer viaje a España.", english: "It's my first trip to Spain.", tags: ["general", "travel"] },
    { target: "Mi hijo está enfermo y no puede ir al colegio.", english: "My son is sick and can't go to school.", tags: ["general", "family"] },
    { target: "Son las tres y media de la tarde.", english: "It's three thirty in the afternoon.", tags: ["general"], grammar: "Ser for telling time" },
    { target: "Estoy seguro de que va a salir bien.", english: "I'm sure it's going to go well.", tags: ["general", "work"] },
    { target: "Mi vecino es muy simpático y siempre saluda.", english: "My neighbor is very friendly and always says hello.", tags: ["general"] },
    { target: "La puerta está cerrada con llave.", english: "The door is locked.", tags: ["general"] },
    { target: "Es mejor que hablemos en persona.", english: "It's better that we talk in person.", tags: ["general", "work"] },
    { target: "Estoy aquí desde las ocho de la mañana.", english: "I've been here since eight in the morning.", tags: ["general", "work"] },
    { target: "Mi prima es periodista y viaja mucho.", english: "My cousin is a journalist and travels a lot.", tags: ["general", "family", "work"] },
    { target: "El agua de la piscina está muy fría.", english: "The pool water is very cold.", tags: ["general", "travel"] },
    { target: "Es un placer trabajar contigo.", english: "It's a pleasure to work with you.", tags: ["general", "work"] },
    { target: "¿Estás de acuerdo con la propuesta?", english: "Do you agree with the proposal?", tags: ["general", "work"], grammar: "Estar de acuerdo — to agree (fixed expression with estar)" },
    { target: "Mi familia es bastante grande.", english: "My family is quite big.", tags: ["general", "family"] },
    { target: "El tren está a punto de salir.", english: "The train is about to leave.", tags: ["general", "travel"], grammar: "Estar a punto de + infinitive — to be about to" },
    { target: "No estoy de humor para bromas ahora.", english: "I'm not in the mood for jokes right now.", tags: ["general"] },
    { target: "Es la una y cuarto.", english: "It's a quarter past one.", tags: ["general"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 2: Present Tense Regulars (A1)
  // -ar, -er, -ir regular verb conjugations
  // ═══════════════════════════════════════════════════════════════
  2: [
    { target: "Trabajo desde casa los viernes.", english: "I work from home on Fridays.", tags: ["general", "work"], grammar: "Trabajar — regular -ar verb: trabajo, trabajas, trabaja..." },
    { target: "¿Hablas español con tu familia?", english: "Do you speak Spanish with your family?", tags: ["general", "family"] },
    { target: "Comemos juntos todos los domingos.", english: "We eat together every Sunday.", tags: ["general", "family"], grammar: "Comer — regular -er verb: como, comes, come, comemos..." },
    { target: "Mi compañera escribe informes muy claros.", english: "My colleague writes very clear reports.", tags: ["general", "work"] },
    { target: "Siempre llego temprano a la oficina.", english: "I always arrive early to the office.", tags: ["general", "work"] },
    { target: "¿Vives cerca de aquí?", english: "Do you live near here?", tags: ["general"], grammar: "Vivir — regular -ir verb: vivo, vives, vive, vivimos..." },
    { target: "Los niños estudian mucho este trimestre.", english: "The kids are studying a lot this term.", tags: ["general", "family"] },
    { target: "Necesito enviar este correo antes de las cinco.", english: "I need to send this email before five.", tags: ["general", "work"] },
    { target: "Ella corre por el parque todas las mañanas.", english: "She runs in the park every morning.", tags: ["general"] },
    { target: "¿Compráis la fruta en el mercado o en el súper?", english: "Do you guys buy fruit at the market or the supermarket?", tags: ["general", "family"], grammar: "Vosotros form of comprar: compráis (common in Spain)" },
    { target: "Leo el periódico mientras desayuno.", english: "I read the newspaper while I have breakfast.", tags: ["general"] },
    { target: "Mis padres viajan a la costa cada verano.", english: "My parents travel to the coast every summer.", tags: ["general", "family", "travel"] },
    { target: "Hablamos con clientes de todo el mundo.", english: "We talk to clients from all over the world.", tags: ["general", "work"] },
    { target: "¿Abres tú la tienda por las mañanas?", english: "Do you open the store in the mornings?", tags: ["general", "work"] },
    { target: "Bebo demasiado café cuando estoy estresado.", english: "I drink too much coffee when I'm stressed.", tags: ["general", "work"] },
    { target: "Mi madre cocina una tortilla buenísima.", english: "My mother makes an amazing tortilla.", tags: ["general", "family"] },
    { target: "Vendemos productos locales en nuestra empresa.", english: "We sell local products at our company.", tags: ["general", "work"] },
    { target: "¿Aprendes español por trabajo o por gusto?", english: "Are you learning Spanish for work or for fun?", tags: ["general", "work"] },
    { target: "Mi hermano camina al trabajo todos los días.", english: "My brother walks to work every day.", tags: ["general", "family", "work"] },
    { target: "Recibo muchos correos al día.", english: "I get a lot of emails a day.", tags: ["general", "work"] },
    { target: "Los estudiantes practican en clase.", english: "The students practice in class.", tags: ["general"] },
    { target: "Cenamos bastante tarde, sobre las nueve.", english: "We have dinner quite late, around nine.", tags: ["general", "family"] },
    { target: "Ella diseña páginas web para empresas.", english: "She designs websites for companies.", tags: ["general", "work"] },
    { target: "¿Tomáis algo antes de irnos?", english: "Are you guys having something before we leave?", tags: ["general"] },
    { target: "Comprendo perfectamente lo que quieres decir.", english: "I completely understand what you mean.", tags: ["general", "work"] },
    { target: "Mi abuelo lee un libro cada semana.", english: "My grandfather reads a book every week.", tags: ["general", "family"] },
    { target: "Preparamos la presentación juntos esta tarde.", english: "We're preparing the presentation together this afternoon.", tags: ["general", "work"] },
    { target: "¿Llamáis a la abuela por su cumpleaños?", english: "Are you all calling grandma for her birthday?", tags: ["general", "family"] },
    { target: "Lavo la ropa los sábados por la mañana.", english: "I do the laundry on Saturday mornings.", tags: ["general"] },
    { target: "Respondo a los mensajes lo antes posible.", english: "I reply to messages as soon as possible.", tags: ["general", "work"] },
    { target: "Ella canta muy bien pero nunca en público.", english: "She sings very well but never in public.", tags: ["general", "family"] },
    { target: "Tomamos un café después de comer, ¿vienes?", english: "We're having a coffee after lunch, are you coming?", tags: ["general", "work"] },
    { target: "Subo las escaleras porque el ascensor no funciona.", english: "I take the stairs because the elevator isn't working.", tags: ["general"] },
    { target: "Mi jefa habla tres idiomas.", english: "My boss speaks three languages.", tags: ["general", "work"] },
    { target: "Los vecinos escuchan música muy alta por la noche.", english: "The neighbors play loud music at night.", tags: ["general"] },
    { target: "¿Mandas tú el informe o lo mando yo?", english: "Are you sending the report or should I?", tags: ["general", "work"] },
    { target: "Escribo todo en mi agenda para no olvidarme.", english: "I write everything in my planner so I don't forget.", tags: ["general"] },
    { target: "Mis hijos comen en el colegio entre semana.", english: "My kids eat at school on weekdays.", tags: ["general", "family"] },
    { target: "Sacamos fotos de todo cuando viajamos.", english: "We take photos of everything when we travel.", tags: ["general", "travel"] },
    { target: "¿Usas transporte público para ir al trabajo?", english: "Do you use public transport to get to work?", tags: ["general", "work", "travel"] },
    { target: "Pintamos la casa este fin de semana.", english: "We're painting the house this weekend.", tags: ["general", "family"] },
    { target: "Mi padre cultiva tomates en el jardín.", english: "My father grows tomatoes in the garden.", tags: ["general", "family"] },
    { target: "Consulto con mi equipo antes de tomar decisiones.", english: "I check with my team before making decisions.", tags: ["general", "work"], grammar: "Consultar — regular -ar: consulto, consultas, consulta..." },
    { target: "Compartimos oficina con otro departamento.", english: "We share an office with another department.", tags: ["general", "work"] },
    { target: "¿Bailas salsa o prefieres bachata?", english: "Do you dance salsa or do you prefer bachata?", tags: ["general", "travel"] },
    { target: "Busco un restaurante bueno por esta zona.", english: "I'm looking for a good restaurant around here.", tags: ["general", "travel"] },
    { target: "Ella enseña matemáticas en la universidad.", english: "She teaches math at the university.", tags: ["general", "work"] },
    { target: "Paseo al perro dos veces al día.", english: "I walk the dog twice a day.", tags: ["general"] },
    { target: "Entrego los proyectos siempre antes de la fecha límite.", english: "I always hand in projects before the deadline.", tags: ["general", "work"] },
    { target: "¿Cocinas tú esta noche o pedimos comida?", english: "Are you cooking tonight or should we order food?", tags: ["general", "family"] },
    { target: "Mi prima vive en Madrid desde hace tres años.", english: "My cousin has been living in Madrid for three years.", tags: ["general", "family", "travel"] },
    { target: "Hablamos mucho por videollamada con la familia.", english: "We talk a lot on video calls with the family.", tags: ["general", "family"] },
    { target: "Creo que es una buena idea.", english: "I think it's a good idea.", tags: ["general", "work"] },
    { target: "Ellos corren una maratón cada año.", english: "They run a marathon every year.", tags: ["general"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 3: Articles & Gender (A1)
  // el/la/los/las, un/una/unos/unas, gender rules
  // ═══════════════════════════════════════════════════════════════
  3: [
    { target: "La reunión de hoy es a las cuatro.", english: "Today's meeting is at four.", tags: ["general", "work"], grammar: "La + feminine noun: la reunión (nouns ending in -ión are feminine)" },
    { target: "Necesito un bolígrafo para firmar.", english: "I need a pen to sign.", tags: ["general", "work"] },
    { target: "Las llaves están en el cajón de la cocina.", english: "The keys are in the kitchen drawer.", tags: ["general", "family"] },
    { target: "¿Tienes una tarjeta de visita?", english: "Do you have a business card?", tags: ["general", "work"], grammar: "Una + feminine noun: una tarjeta" },
    { target: "El problema es que no hay suficiente espacio.", english: "The problem is that there isn't enough space.", tags: ["general", "work"], grammar: "El + masculine noun: el problema (irregular — ends in -a but is masculine)" },
    { target: "Los domingos vamos a casa de los abuelos.", english: "On Sundays we go to our grandparents' house.", tags: ["general", "family"] },
    { target: "Hay una farmacia al final de la calle.", english: "There's a pharmacy at the end of the street.", tags: ["general", "travel"] },
    { target: "El agua está muy fría para bañarse.", english: "The water is too cold to swim.", tags: ["general", "travel"], grammar: "El agua — feminine noun but uses el (singular) to avoid 'la a-' sound" },
    { target: "Las oficinas nuevas son más grandes.", english: "The new offices are bigger.", tags: ["general", "work"] },
    { target: "Necesitamos unos días más para terminar.", english: "We need a few more days to finish.", tags: ["general", "work"], grammar: "Unos + masculine plural = some/a few" },
    { target: "La mano me duele desde ayer.", english: "My hand has been hurting since yesterday.", tags: ["general"], grammar: "La mano — feminine despite ending in -o (irregular)" },
    { target: "¿Dónde está el supermercado más cercano?", english: "Where is the nearest supermarket?", tags: ["general", "travel"] },
    { target: "Los lunes siempre son complicados.", english: "Mondays are always complicated.", tags: ["general", "work"] },
    { target: "Tiene una sonrisa muy bonita.", english: "She has a very pretty smile.", tags: ["general"] },
    { target: "El ordenador no funciona bien desde ayer.", english: "The computer hasn't been working well since yesterday.", tags: ["general", "work"] },
    { target: "¿Hay un cajero automático por aquí?", english: "Is there an ATM around here?", tags: ["general", "travel"] },
    { target: "La ciudad tiene unos parques preciosos.", english: "The city has some beautiful parks.", tags: ["general", "travel"] },
    { target: "Los documentos están en la carpeta azul.", english: "The documents are in the blue folder.", tags: ["general", "work"] },
    { target: "Quiero una habitación con vistas al mar.", english: "I want a room with a sea view.", tags: ["general", "travel"] },
    { target: "El clima de aquí es muy agradable.", english: "The weather here is very pleasant.", tags: ["general", "travel"], grammar: "El clima — masculine (words from Greek ending in -ma are masculine)" },
    { target: "Las vacaciones son en agosto este año.", english: "The vacation is in August this year.", tags: ["general", "travel"] },
    { target: "¿Me pasas la sal, por favor?", english: "Can you pass me the salt, please?", tags: ["general", "family"] },
    { target: "El mapa está en la guantera del coche.", english: "The map is in the car's glove compartment.", tags: ["general", "travel"], grammar: "El mapa — masculine (Greek origin, ends in -a but masculine)" },
    { target: "Una amiga mía trabaja en ese hospital.", english: "A friend of mine works at that hospital.", tags: ["general", "work"] },
    { target: "Los precios han subido mucho este mes.", english: "Prices have gone up a lot this month.", tags: ["general"] },
    { target: "La noche está muy tranquila hoy.", english: "The night is very quiet today.", tags: ["general"] },
    { target: "El informe tiene unas tablas muy útiles.", english: "The report has some very useful tables.", tags: ["general", "work"] },
    { target: "Las maletas pesan demasiado para el avión.", english: "The suitcases are too heavy for the plane.", tags: ["general", "travel"] },
    { target: "Necesito un momento para pensarlo.", english: "I need a moment to think about it.", tags: ["general", "work"] },
    { target: "La estación de tren está a diez minutos.", english: "The train station is ten minutes away.", tags: ["general", "travel"] },
    { target: "El día de la madre es el primer domingo de mayo.", english: "Mother's Day is the first Sunday of May.", tags: ["general", "family"], grammar: "El día — masculine (exception: ends in -a but is masculine)" },
    { target: "¿Tienes las entradas para el concierto?", english: "Do you have the tickets for the concert?", tags: ["general"] },
    { target: "Un compañero me ha ayudado con el proyecto.", english: "A colleague helped me with the project.", tags: ["general", "work"] },
    { target: "La canción que suena me gusta mucho.", english: "I really like the song that's playing.", tags: ["general"] },
    { target: "Los niños juegan en el parque después del colegio.", english: "The kids play in the park after school.", tags: ["general", "family"] },
    { target: "Hay unos bares muy buenos en esta calle.", english: "There are some very good bars on this street.", tags: ["general", "travel"] },
    { target: "La empresa tiene unas normas muy claras.", english: "The company has very clear rules.", tags: ["general", "work"], grammar: "Unas + feminine plural = some" },
    { target: "El viaje dura unas tres horas.", english: "The trip takes about three hours.", tags: ["general", "travel"] },
    { target: "¿Dónde están los servicios?", english: "Where are the restrooms?", tags: ["general", "travel"] },
    { target: "La mesa del comedor es de madera.", english: "The dining table is made of wood.", tags: ["general", "family"] },
    { target: "Un café con leche, por favor.", english: "A coffee with milk, please.", tags: ["general", "travel"] },
    { target: "Los correos importantes van a una carpeta aparte.", english: "Important emails go to a separate folder.", tags: ["general", "work"] },
    { target: "La cena de Navidad es en casa de mi tía.", english: "Christmas dinner is at my aunt's house.", tags: ["general", "family"] },
    { target: "El hotel tiene un restaurante muy bueno.", english: "The hotel has a very good restaurant.", tags: ["general", "travel"] },
    { target: "Las flores del jardín son preciosas.", english: "The flowers in the garden are gorgeous.", tags: ["general", "family"] },
    { target: "Un amigo me recomendó este sitio.", english: "A friend recommended this place to me.", tags: ["general", "travel"] },
    { target: "La contraseña del wifi está en la recepción.", english: "The wifi password is at the front desk.", tags: ["general", "travel"] },
    { target: "El sistema se ha actualizado esta noche.", english: "The system was updated tonight.", tags: ["general", "work"], grammar: "El sistema — masculine (Greek origin ending in -ma)" },
    { target: "Los vecinos de arriba tienen un perro muy grande.", english: "The upstairs neighbors have a very big dog.", tags: ["general"] },
    { target: "¿Hay una gasolinera cerca de aquí?", english: "Is there a gas station near here?", tags: ["general", "travel"] },
    { target: "La situación económica ha mejorado un poco.", english: "The economic situation has improved a little.", tags: ["general", "work"] },
    { target: "El programa funciona bien en el nuevo ordenador.", english: "The program works well on the new computer.", tags: ["general", "work"], grammar: "El programa — masculine (Greek origin ending in -ma)" },
    { target: "Las notas de la reunión están en tu correo.", english: "The meeting notes are in your email.", tags: ["general", "work"] },
    { target: "Tenemos una terraza pequeña pero muy acogedora.", english: "We have a small but very cozy terrace.", tags: ["general", "family"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 4: Common Phrases & Questions (A1)
  // Everyday expressions, question words, polite phrases
  // ═══════════════════════════════════════════════════════════════
  4: [
    { target: "¿Cuánto cuesta una noche en el hotel?", english: "How much is one night at the hotel?", tags: ["general", "travel"], grammar: "Cuánto — how much (agrees in gender: cuánta/cuántos/cuántas)" },
    { target: "Perdona, ¿sabes dónde está la calle Mayor?", english: "Excuse me, do you know where Main Street is?", tags: ["general", "travel"] },
    { target: "¿A qué hora terminas de trabajar?", english: "What time do you finish work?", tags: ["general", "work"] },
    { target: "No me importa, elige tú.", english: "I don't mind, you choose.", tags: ["general"] },
    { target: "¿Me puedes echar una mano con esto?", english: "Can you give me a hand with this?", tags: ["general", "work"], grammar: "Echar una mano — to give a hand/help out" },
    { target: "Claro, sin problema.", english: "Of course, no problem.", tags: ["general", "work"] },
    { target: "¿Cómo se llama tu hijo?", english: "What's your son's name?", tags: ["general", "family"] },
    { target: "Mucho gusto, encantado de conocerte.", english: "Nice to meet you.", tags: ["general", "work"] },
    { target: "¿Qué tal el fin de semana?", english: "How was the weekend?", tags: ["general", "work"], grammar: "¿Qué tal...? — informal way to ask how something was" },
    { target: "No te preocupes, no pasa nada.", english: "Don't worry, it's fine.", tags: ["general"] },
    { target: "¿Cuántos años tiene tu hija?", english: "How old is your daughter?", tags: ["general", "family"] },
    { target: "Oye, ¿quedamos para tomar algo?", english: "Hey, want to meet up for a drink?", tags: ["general"] },
    { target: "Lo siento mucho, ha sido culpa mía.", english: "I'm so sorry, it was my fault.", tags: ["general", "work"] },
    { target: "¿Qué quieres hacer esta tarde?", english: "What do you want to do this afternoon?", tags: ["general", "family"] },
    { target: "¿Dónde has aparcado el coche?", english: "Where did you park the car?", tags: ["general", "travel"] },
    { target: "¡Qué bien! Me alegro mucho por ti.", english: "Great! I'm so happy for you.", tags: ["general", "family"] },
    { target: "¿Por qué no vienes a cenar con nosotros?", english: "Why don't you come to dinner with us?", tags: ["general", "family"], grammar: "¿Por qué? — why (two words, not porque)" },
    { target: "Vale, quedamos a las ocho entonces.", english: "Okay, let's meet at eight then.", tags: ["general"] },
    { target: "¿Cuándo es tu cumpleaños?", english: "When is your birthday?", tags: ["general", "family"] },
    { target: "Bueno, yo me voy ya que es tarde.", english: "Well, I'm leaving now since it's late.", tags: ["general"] },
    { target: "¿Quién viene a la fiesta de mañana?", english: "Who's coming to the party tomorrow?", tags: ["general", "family"] },
    { target: "No estoy seguro, déjame comprobarlo.", english: "I'm not sure, let me check.", tags: ["general", "work"] },
    { target: "¿Cómo vas al trabajo, en metro o en coche?", english: "How do you get to work, by metro or by car?", tags: ["general", "work", "travel"] },
    { target: "Hasta luego, nos vemos mañana.", english: "See you later, see you tomorrow.", tags: ["general", "work"] },
    { target: "¿De qué trata la película?", english: "What's the movie about?", tags: ["general"] },
    { target: "Pues a mí me parece bien.", english: "Well, that sounds good to me.", tags: ["general", "work"] },
    { target: "¿Cuánto tardas en llegar a la oficina?", english: "How long does it take you to get to the office?", tags: ["general", "work", "travel"] },
    { target: "Te presento a mi mujer, Ana.", english: "Let me introduce you to my wife, Ana.", tags: ["general", "family", "work"] },
    { target: "¿Qué te apetece comer?", english: "What do you feel like eating?", tags: ["general"], grammar: "Apetecer — to feel like/fancy (like gustar, indirect object)" },
    { target: "¿Me deja la cuenta, por favor?", english: "Can I have the check, please?", tags: ["general", "travel"] },
    { target: "¿A qué te dedicas?", english: "What do you do for a living?", tags: ["general", "work"], grammar: "¿A qué te dedicas? — standard way to ask someone's profession" },
    { target: "Depende de lo que prefieras tú.", english: "It depends on what you prefer.", tags: ["general"] },
    { target: "¿Por dónde se va a la estación?", english: "How do you get to the station?", tags: ["general", "travel"] },
    { target: "Me da igual, cualquier sitio me vale.", english: "I don't mind, anywhere works for me.", tags: ["general"] },
    { target: "¿Tienes hora? Se me ha parado el reloj.", english: "Do you have the time? My watch stopped.", tags: ["general"] },
    { target: "Disculpe, ¿puede hablar más despacio?", english: "Excuse me, can you speak more slowly?", tags: ["general", "travel"], grammar: "Disculpe — formal usted form of disculpar" },
    { target: "¿Qué tal está tu madre? Dale recuerdos.", english: "How's your mother? Send her my regards.", tags: ["general", "family"] },
    { target: "¿Hay algún sitio bueno para comer por aquí?", english: "Is there any good place to eat around here?", tags: ["general", "travel"] },
    { target: "¿Qué opinas del nuevo proyecto?", english: "What do you think about the new project?", tags: ["general", "work"] },
    { target: "Que tengas un buen día.", english: "Have a nice day.", tags: ["general", "work"] },
    { target: "¿Cuál es la diferencia entre estos dos?", english: "What's the difference between these two?", tags: ["general", "work"], grammar: "Cuál — which/what (used before ser when asking for a choice)" },
    { target: "¿Podrías repetir eso, por favor?", english: "Could you repeat that, please?", tags: ["general", "work"] },
    { target: "Me encantaría, pero no puedo este viernes.", english: "I'd love to, but I can't this Friday.", tags: ["general"] },
    { target: "¿Dónde se compra la tarjeta de transporte?", english: "Where do you buy the transit card?", tags: ["general", "travel"] },
    { target: "¿Cómo ha ido el día?", english: "How was your day?", tags: ["general", "family"] },
    { target: "Menos mal que hemos llegado a tiempo.", english: "Thank goodness we arrived on time.", tags: ["general", "travel"], grammar: "Menos mal — thank goodness/luckily" },
    { target: "¿Qué planes tienes para el puente?", english: "What plans do you have for the long weekend?", tags: ["general", "family"], grammar: "Puente — lit. bridge; a long weekend when a holiday falls near a weekend" },
    { target: "Con mucho gusto, faltaría más.", english: "With pleasure, of course.", tags: ["general", "work"] },
    { target: "¿De verdad? No tenía ni idea.", english: "Really? I had no idea.", tags: ["general"] },
    { target: "¿Para cuántas personas es la reserva?", english: "How many people is the reservation for?", tags: ["general", "travel"] },
    { target: "Ya te digo, es increíble.", english: "I know, right? It's incredible.", tags: ["general"] },
    { target: "¿Desde cuándo vives aquí?", english: "How long have you been living here?", tags: ["general", "travel"] },
    { target: "Oye, ¿me prestas tu cargador un momento?", english: "Hey, can I borrow your charger for a moment?", tags: ["general", "work"] },
    { target: "¿Nos sentamos dentro o en la terraza?", english: "Shall we sit inside or on the terrace?", tags: ["general", "travel"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 5: Present Irregular Verbs (A1)
  // ir, tener, hacer, poder, querer, saber, decir, venir, poner, salir
  // ═══════════════════════════════════════════════════════════════
  5: [
    { target: "Voy al gimnasio después del trabajo.", english: "I go to the gym after work.", tags: ["general", "work"], grammar: "Ir — irregular: voy, vas, va, vamos, vais, van" },
    { target: "Tengo una reunión a las tres.", english: "I have a meeting at three.", tags: ["general", "work"] },
    { target: "¿Qué haces este fin de semana?", english: "What are you doing this weekend?", tags: ["general"], grammar: "Hacer — irregular: hago, haces, hace, hacemos..." },
    { target: "¿Puedes cerrar la ventana? Hace frío.", english: "Can you close the window? It's cold.", tags: ["general", "work"] },
    { target: "Quiero aprender a cocinar comida mexicana.", english: "I want to learn to cook Mexican food.", tags: ["general"] },
    { target: "No sé cómo llegar al aeropuerto desde aquí.", english: "I don't know how to get to the airport from here.", tags: ["general", "travel"], grammar: "Saber — irregular: sé, sabes, sabe, sabemos..." },
    { target: "¿Qué dice el correo que te mandaron?", english: "What does the email they sent you say?", tags: ["general", "work"] },
    { target: "Mi madre viene a visitarnos este mes.", english: "My mother is coming to visit us this month.", tags: ["general", "family"] },
    { target: "¿Dónde pongo estas cajas?", english: "Where do I put these boxes?", tags: ["general", "work"], grammar: "Poner — irregular in yo: pongo" },
    { target: "Salgo de casa a las siete de la mañana.", english: "I leave the house at seven in the morning.", tags: ["general", "work"], grammar: "Salir — irregular in yo: salgo" },
    { target: "Tenemos que entregar el informe el viernes.", english: "We have to submit the report on Friday.", tags: ["general", "work"] },
    { target: "Vamos de vacaciones a Italia en junio.", english: "We're going on vacation to Italy in June.", tags: ["general", "travel"] },
    { target: "No puedo quedarme más, tengo que irme.", english: "I can't stay longer, I have to go.", tags: ["general"] },
    { target: "¿Sabes dónde hay una panadería por aquí?", english: "Do you know where there's a bakery around here?", tags: ["general", "travel"] },
    { target: "Hago deporte tres veces a la semana.", english: "I exercise three times a week.", tags: ["general"] },
    { target: "¿Quieres que te ayude con la mudanza?", english: "Do you want me to help you with the move?", tags: ["general", "family"] },
    { target: "Mis hijos van al colegio andando.", english: "My kids walk to school.", tags: ["general", "family"] },
    { target: "¿Tienes cambio de veinte euros?", english: "Do you have change for twenty euros?", tags: ["general", "travel"] },
    { target: "Dice mi jefe que la reunión se aplaza.", english: "My boss says the meeting is postponed.", tags: ["general", "work"], grammar: "Decir — irregular: digo, dices, dice, decimos..." },
    { target: "Vengo en metro porque es más rápido.", english: "I come by metro because it's faster.", tags: ["general", "work", "travel"], grammar: "Venir — irregular: vengo, vienes, viene, venimos..." },
    { target: "Pongo la mesa mientras tú cocinas.", english: "I'll set the table while you cook.", tags: ["general", "family"] },
    { target: "Salimos a cenar los viernes por la noche.", english: "We go out for dinner on Friday nights.", tags: ["general", "family"] },
    { target: "¿Puedes quedarte un rato más?", english: "Can you stay a little longer?", tags: ["general"] },
    { target: "Quiero cambiar la fecha de mi vuelo.", english: "I want to change the date of my flight.", tags: ["general", "travel"] },
    { target: "¿Sabes usar este programa nuevo?", english: "Do you know how to use this new software?", tags: ["general", "work"] },
    { target: "No tengo ni idea de qué regalarle.", english: "I have no idea what to get him as a gift.", tags: ["general", "family"] },
    { target: "Vamos al mercado a comprar fruta fresca.", english: "Let's go to the market to buy fresh fruit.", tags: ["general", "travel"] },
    { target: "Hacemos una pausa para comer, ¿vale?", english: "Let's take a break to eat, okay?", tags: ["general", "work"] },
    { target: "¿Puedo pagar con tarjeta?", english: "Can I pay by card?", tags: ["general", "travel"] },
    { target: "No quiero llegar tarde al concierto.", english: "I don't want to be late for the concert.", tags: ["general"] },
    { target: "¿Viene tu hermano a la cena?", english: "Is your brother coming to dinner?", tags: ["general", "family"] },
    { target: "Hago las compras por internet casi siempre.", english: "I almost always shop online.", tags: ["general"] },
    { target: "Tienen un piso nuevo cerca del centro.", english: "They have a new apartment near downtown.", tags: ["general", "family"] },
    { target: "¿Adónde vas tan temprano?", english: "Where are you going so early?", tags: ["general", "family"] },
    { target: "No digo que sea fácil, pero merece la pena.", english: "I'm not saying it's easy, but it's worth it.", tags: ["general", "work"] },
    { target: "¿Podemos hablar un momento en privado?", english: "Can we talk for a moment in private?", tags: ["general", "work"] },
    { target: "Salen de viaje mañana por la mañana.", english: "They're leaving on a trip tomorrow morning.", tags: ["general", "travel"] },
    { target: "Ponen una película buena esta noche en la tele.", english: "They're showing a good movie on TV tonight.", tags: ["general", "family"] },
    { target: "¿Sabes a qué hora abre el museo?", english: "Do you know what time the museum opens?", tags: ["general", "travel"] },
    { target: "Tengo mucha hambre, ¿comemos algo?", english: "I'm really hungry, shall we eat something?", tags: ["general"] },
    { target: "Mi empresa va muy bien este trimestre.", english: "My company is doing very well this quarter.", tags: ["general", "work"] },
    { target: "¿Puedo sentarme aquí?", english: "Can I sit here?", tags: ["general", "travel"] },
    { target: "Quiero presentarte a mis padres.", english: "I want to introduce you to my parents.", tags: ["general", "family"] },
    { target: "No sé si puedo ir, déjame mirar mi agenda.", english: "I don't know if I can go, let me check my schedule.", tags: ["general", "work"] },
    { target: "¿Hacéis algo especial por Año Nuevo?", english: "Are you guys doing anything special for New Year's?", tags: ["general", "family"] },
    { target: "Venimos a recoger las entradas que reservamos.", english: "We're here to pick up the tickets we reserved.", tags: ["general", "travel"] },
    { target: "Dice que llega un poco tarde.", english: "She says she'll arrive a bit late.", tags: ["general"] },
    { target: "Ponemos la calefacción cuando hace mucho frío.", english: "We turn on the heating when it's very cold.", tags: ["general", "family"] },
    { target: "¿Tiene usted mesa para dos?", english: "Do you have a table for two?", tags: ["general", "travel"] },
    { target: "Voy a pedir un taxi, ¿vienes?", english: "I'm going to get a taxi, are you coming?", tags: ["general", "travel"] },
    { target: "Hago lo que puedo, pero necesito más tiempo.", english: "I'm doing what I can, but I need more time.", tags: ["general", "work"] },
    { target: "Salgo con mis amigos los sábados por la noche.", english: "I go out with my friends on Saturday nights.", tags: ["general"] },
    { target: "¿Quieren ustedes algo de beber?", english: "Would you like something to drink?", tags: ["general", "travel"] },
    { target: "Tengo mucho sueño, me voy a dormir.", english: "I'm very sleepy, I'm going to bed.", tags: ["general", "family"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 6: Past Tense – Pretérito (A2)
  // Completed actions, specific time references
  // ═══════════════════════════════════════════════════════════════
  6: [
    { target: "Ayer terminé el informe a las seis de la tarde.", english: "Yesterday I finished the report at six in the evening.", tags: ["general", "work"], grammar: "Pretérito of -ar verbs: terminé, terminaste, terminó..." },
    { target: "¿Dónde comiste ayer al mediodía?", english: "Where did you eat yesterday at noon?", tags: ["general"] },
    { target: "Viajamos a Barcelona el mes pasado.", english: "We traveled to Barcelona last month.", tags: ["general", "travel"] },
    { target: "Mi hermana tuvo un niño la semana pasada.", english: "My sister had a baby last week.", tags: ["general", "family"], grammar: "Tener pretérito: tuve, tuviste, tuvo, tuvimos..." },
    { target: "¿Hiciste la compra o la hago yo?", english: "Did you do the shopping or should I?", tags: ["general", "family"], grammar: "Hacer pretérito: hice, hiciste, hizo, hicimos..." },
    { target: "El cliente llamó tres veces esta mañana.", english: "The client called three times this morning.", tags: ["general", "work"] },
    { target: "Fui al dentista y me sacaron una muela.", english: "I went to the dentist and they pulled a tooth.", tags: ["general"], grammar: "Ir pretérito: fui, fuiste, fue, fuimos... (same as ser)" },
    { target: "Conocí a mi mujer en la universidad.", english: "I met my wife at university.", tags: ["general", "family"] },
    { target: "¿Recibiste mi mensaje de anoche?", english: "Did you get my message from last night?", tags: ["general", "work"] },
    { target: "Estuve en París hace dos años.", english: "I was in Paris two years ago.", tags: ["general", "travel"], grammar: "Estar pretérito: estuve, estuviste, estuvo, estuvimos..." },
    { target: "Perdí el tren por cinco minutos.", english: "I missed the train by five minutes.", tags: ["general", "travel"] },
    { target: "No pude dormir anoche por el ruido.", english: "I couldn't sleep last night because of the noise.", tags: ["general"], grammar: "Poder pretérito: pude, pudiste, pudo, pudimos..." },
    { target: "Mi padre se jubiló el año pasado.", english: "My father retired last year.", tags: ["general", "family", "work"] },
    { target: "¿Qué pasó en la reunión de ayer?", english: "What happened at yesterday's meeting?", tags: ["general", "work"] },
    { target: "Conseguí el trabajo que quería.", english: "I got the job I wanted.", tags: ["general", "work"] },
    { target: "Fuimos a la playa el fin de semana pasado.", english: "We went to the beach last weekend.", tags: ["general", "travel"] },
    { target: "El vuelo se retrasó dos horas.", english: "The flight was delayed two hours.", tags: ["general", "travel"] },
    { target: "Le dije a mi jefa que necesito vacaciones.", english: "I told my boss that I need a vacation.", tags: ["general", "work"], grammar: "Decir pretérito: dije, dijiste, dijo, dijimos..." },
    { target: "¿Cuándo empezaste a trabajar aquí?", english: "When did you start working here?", tags: ["general", "work"] },
    { target: "Mi abuela nos preparó una cena increíble.", english: "My grandmother made us an incredible dinner.", tags: ["general", "family"] },
    { target: "No entendí lo que me explicó.", english: "I didn't understand what he explained to me.", tags: ["general", "work"] },
    { target: "Reservé una mesa para cuatro personas.", english: "I booked a table for four people.", tags: ["general", "travel"] },
    { target: "Puse las llaves encima de la mesa.", english: "I put the keys on the table.", tags: ["general"], grammar: "Poner pretérito: puse, pusiste, puso, pusimos..." },
    { target: "¿Viste el correo que te mandé ayer?", english: "Did you see the email I sent you yesterday?", tags: ["general", "work"] },
    { target: "Llegamos al hotel a medianoche.", english: "We arrived at the hotel at midnight.", tags: ["general", "travel"] },
    { target: "Me olvidé por completo de la cita.", english: "I completely forgot about the appointment.", tags: ["general", "work"] },
    { target: "Ella vivió en Londres durante tres años.", english: "She lived in London for three years.", tags: ["general", "travel"] },
    { target: "¿Quién ganó el partido anoche?", english: "Who won the game last night?", tags: ["general"] },
    { target: "Le regalé un libro a mi padre por su cumpleaños.", english: "I gave my father a book for his birthday.", tags: ["general", "family"] },
    { target: "Vendí el coche viejo la semana pasada.", english: "I sold the old car last week.", tags: ["general"] },
    { target: "¿Qué tal te fue en la entrevista?", english: "How did the interview go for you?", tags: ["general", "work"] },
    { target: "Nos mudamos a esta casa hace cinco años.", english: "We moved to this house five years ago.", tags: ["general", "family"] },
    { target: "El tren salió con retraso esta mañana.", english: "The train left late this morning.", tags: ["general", "travel"] },
    { target: "Firmé el contrato ayer por la tarde.", english: "I signed the contract yesterday afternoon.", tags: ["general", "work"] },
    { target: "Encontré un billete muy barato a Lisboa.", english: "I found a very cheap ticket to Lisbon.", tags: ["general", "travel"] },
    { target: "¿Quién te dijo eso?", english: "Who told you that?", tags: ["general"] },
    { target: "Me caí en la calle y me hice daño en la rodilla.", english: "I fell on the street and hurt my knee.", tags: ["general"] },
    { target: "Pedí una pizza porque no quería cocinar.", english: "I ordered a pizza because I didn't want to cook.", tags: ["general"] },
    { target: "¿Pudiste hablar con el cliente?", english: "Were you able to talk to the client?", tags: ["general", "work"] },
    { target: "Abrieron un restaurante nuevo en mi barrio.", english: "They opened a new restaurant in my neighborhood.", tags: ["general", "travel"] },
    { target: "Le mandé un regalo a mi sobrina.", english: "I sent a gift to my niece.", tags: ["general", "family"] },
    { target: "Tuve un día horrible en el trabajo.", english: "I had a horrible day at work.", tags: ["general", "work"] },
    { target: "¿Cuánto pagaste por esos zapatos?", english: "How much did you pay for those shoes?", tags: ["general"] },
    { target: "Salimos del cine a las once de la noche.", english: "We left the cinema at eleven at night.", tags: ["general"] },
    { target: "Aprendí mucho en el curso de la semana pasada.", english: "I learned a lot in last week's course.", tags: ["general", "work"] },
    { target: "¿Te gustó la comida del restaurante?", english: "Did you like the food at the restaurant?", tags: ["general", "travel"] },
    { target: "No supe qué decir en ese momento.", english: "I didn't know what to say at that moment.", tags: ["general"], grammar: "Saber pretérito: supe, supiste, supo... (implies finding out)" },
    { target: "Caminamos por el centro durante toda la tarde.", english: "We walked around downtown all afternoon.", tags: ["general", "travel"] },
    { target: "Mi madre me llamó esta mañana temprano.", english: "My mother called me early this morning.", tags: ["general", "family"] },
    { target: "Leí el artículo que me recomendaste.", english: "I read the article you recommended.", tags: ["general", "work"] },
    { target: "¿Dónde dejaste los documentos del proyecto?", english: "Where did you leave the project documents?", tags: ["general", "work"] },
    { target: "Nos divertimos mucho en la boda de mi primo.", english: "We had a great time at my cousin's wedding.", tags: ["general", "family"] },
    { target: "Compré los billetes de avión esta mañana.", english: "I bought the plane tickets this morning.", tags: ["general", "travel"] },
    { target: "El jefe nos dio una semana más de plazo.", english: "The boss gave us one more week for the deadline.", tags: ["general", "work"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 7: Past Tense – Imperfecto (A2)
  // Habitual past, descriptions, ongoing past actions
  // ═══════════════════════════════════════════════════════════════
  7: [
    { target: "Cuando era niño, iba al parque todos los días.", english: "When I was a kid, I went to the park every day.", tags: ["general", "family"], grammar: "Imperfecto for habitual past: iba, ibas, iba, íbamos..." },
    { target: "Mi abuela siempre hacía una sopa riquísima.", english: "My grandmother always made the most delicious soup.", tags: ["general", "family"] },
    { target: "Antes vivíamos en un piso más pequeño.", english: "We used to live in a smaller apartment.", tags: ["general", "family"], grammar: "Imperfecto of -ir verbs: vivía, vivías, vivía, vivíamos..." },
    { target: "¿Dónde trabajabas antes de venir aquí?", english: "Where did you work before coming here?", tags: ["general", "work"] },
    { target: "De pequeña quería ser astronauta.", english: "When I was little, I wanted to be an astronaut.", tags: ["general", "family"] },
    { target: "El restaurante tenía unas vistas increíbles al mar.", english: "The restaurant had incredible sea views.", tags: ["general", "travel"], grammar: "Imperfecto for descriptions: tenía, tenías, tenía..." },
    { target: "Siempre desayunábamos juntos los sábados.", english: "We always had breakfast together on Saturdays.", tags: ["general", "family"] },
    { target: "Cuando era estudiante, no tenía mucho dinero.", english: "When I was a student, I didn't have much money.", tags: ["general"] },
    { target: "En mi antiguo trabajo, viajaba mucho por Europa.", english: "At my old job, I used to travel a lot around Europe.", tags: ["general", "work", "travel"] },
    { target: "Mi abuelo contaba unas historias geniales.", english: "My grandfather used to tell great stories.", tags: ["general", "family"] },
    { target: "Antes no había tantas tiendas en este barrio.", english: "There didn't use to be so many stores in this neighborhood.", tags: ["general"] },
    { target: "¿Qué hacías los veranos cuando eras joven?", english: "What did you use to do in the summers when you were young?", tags: ["general", "family"] },
    { target: "El hotel donde nos alojábamos era muy acogedor.", english: "The hotel where we were staying was very cozy.", tags: ["general", "travel"] },
    { target: "Mi madre me leía un cuento todas las noches.", english: "My mother used to read me a story every night.", tags: ["general", "family"] },
    { target: "Íbamos a la playa cada fin de semana en verano.", english: "We used to go to the beach every weekend in summer.", tags: ["general", "family", "travel"] },
    { target: "En esa época ganaba muy poco.", english: "At that time I was earning very little.", tags: ["general", "work"] },
    { target: "El cielo estaba naranja cuando salimos de la oficina.", english: "The sky was orange when we left the office.", tags: ["general", "work"], grammar: "Imperfecto for background descriptions" },
    { target: "Todos los años visitábamos a mis tíos en el pueblo.", english: "Every year we used to visit my aunt and uncle in the village.", tags: ["general", "family", "travel"] },
    { target: "Antes cogía el autobús, pero ahora voy en bici.", english: "I used to take the bus, but now I cycle.", tags: ["general", "travel"] },
    { target: "¿Conocías a alguien en la empresa antes de empezar?", english: "Did you know anyone at the company before starting?", tags: ["general", "work"] },
    { target: "Mientras esperaba, me tomé un café.", english: "While I was waiting, I had a coffee.", tags: ["general"], grammar: "Imperfecto for ongoing action + pretérito for interrupting action" },
    { target: "Mi padre jugaba al fútbol de joven.", english: "My father used to play soccer when he was young.", tags: ["general", "family"] },
    { target: "Antes se comía mejor y más barato por aquí.", english: "You used to eat better and cheaper around here.", tags: ["general", "travel"] },
    { target: "El vecino tenía un perro que ladraba toda la noche.", english: "The neighbor had a dog that barked all night.", tags: ["general"] },
    { target: "Cuando llovía, nos quedábamos en casa jugando.", english: "When it rained, we stayed at home playing.", tags: ["general", "family"] },
    { target: "Antes salíamos a correr juntos por las mañanas.", english: "We used to go running together in the mornings.", tags: ["general"] },
    { target: "En la universidad estudiaba Derecho.", english: "In college I was studying Law.", tags: ["general"] },
    { target: "El mercado cerraba a las dos los sábados.", english: "The market used to close at two on Saturdays.", tags: ["general", "travel"] },
    { target: "Mi hermana mayor siempre me ayudaba con los deberes.", english: "My older sister always helped me with homework.", tags: ["general", "family"] },
    { target: "Cuando vivía en México, comía tacos casi todos los días.", english: "When I lived in Mexico, I ate tacos almost every day.", tags: ["general", "travel"] },
    { target: "Mis compañeros y yo almorzábamos juntos todos los días.", english: "My coworkers and I used to have lunch together every day.", tags: ["general", "work"] },
    { target: "En aquella casa siempre hacía mucho frío en invierno.", english: "In that house it was always very cold in winter.", tags: ["general", "family"] },
    { target: "Antes no sabía cocinar nada.", english: "Before, I didn't know how to cook at all.", tags: ["general"] },
    { target: "El autobús pasaba cada quince minutos por mi calle.", english: "The bus used to come every fifteen minutes on my street.", tags: ["general", "travel"] },
    { target: "Pensaba que iba a ser más difícil.", english: "I thought it was going to be harder.", tags: ["general", "work"] },
    { target: "Mi tía nos hacía galletas cada vez que íbamos a verla.", english: "My aunt used to make us cookies every time we visited her.", tags: ["general", "family"] },
    { target: "En mi primer trabajo, compartía oficina con tres personas.", english: "At my first job, I shared an office with three people.", tags: ["general", "work"] },
    { target: "Eran casi las diez cuando llegamos al restaurante.", english: "It was almost ten when we got to the restaurant.", tags: ["general", "travel"], grammar: "Imperfecto of ser for time in the past: eran las..." },
    { target: "Antes teníamos un gato muy cariñoso.", english: "We used to have a very affectionate cat.", tags: ["general", "family"] },
    { target: "De niño no me gustaban las verduras.", english: "As a child I didn't like vegetables.", tags: ["general", "family"], grammar: "Imperfecto of gustar for past preferences" },
    { target: "Siempre llevaba una libreta para apuntar todo.", english: "He always carried a notebook to write everything down.", tags: ["general", "work"] },
    { target: "El profesor hablaba muy rápido y no entendía nada.", english: "The teacher spoke very fast and I didn't understand anything.", tags: ["general"] },
    { target: "Antes podía correr diez kilómetros sin parar.", english: "Before, I could run ten kilometers without stopping.", tags: ["general"] },
    { target: "En vacaciones nos levantábamos tardísimo.", english: "On vacation we used to get up really late.", tags: ["general", "family", "travel"] },
    { target: "El cine antiguo costaba solo tres euros.", english: "The old cinema used to cost only three euros.", tags: ["general"] },
    { target: "Mis primos venían a casa en Navidad.", english: "My cousins used to come to our house at Christmas.", tags: ["general", "family"] },
    { target: "En esa empresa había muy buen ambiente.", english: "At that company there was a very good atmosphere.", tags: ["general", "work"], grammar: "Había — imperfecto of haber, always singular for 'there was/were'" },
    { target: "El barrio donde crecí era muy tranquilo.", english: "The neighborhood where I grew up was very quiet.", tags: ["general", "family"] },
    { target: "Antes me costaba mucho hablar en público.", english: "Before, I found it very difficult to speak in public.", tags: ["general", "work"] },
    { target: "Mientras cocinaba, mi hijo me contaba su día.", english: "While I was cooking, my son told me about his day.", tags: ["general", "family"] },
    { target: "Los fines de semana siempre salíamos a pasear.", english: "On weekends we always used to go for walks.", tags: ["general", "family"] },
    { target: "Cuando trabajaba de noche, dormía muy mal.", english: "When I worked nights, I slept very badly.", tags: ["general", "work"] },
    { target: "El pueblo donde veraneábamos tenía una plaza preciosa.", english: "The town where we used to spend summers had a beautiful square.", tags: ["general", "family", "travel"] },
    { target: "Antes no existían los móviles y no pasaba nada.", english: "Before, mobile phones didn't exist and nothing happened.", tags: ["general"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 8: Reflexive Verbs & Daily Routine (A2)
  // se verbs, daily routines, getting ready
  // ═══════════════════════════════════════════════════════════════
  8: [
    { target: "Me levanto a las seis y media entre semana.", english: "I get up at six thirty on weekdays.", tags: ["general", "work"], grammar: "Levantarse — reflexive: me levanto, te levantas, se levanta..." },
    { target: "¿A qué hora te acuestas normalmente?", english: "What time do you normally go to bed?", tags: ["general", "family"] },
    { target: "Me ducho rápido y salgo corriendo al trabajo.", english: "I shower quickly and rush off to work.", tags: ["general", "work"] },
    { target: "Mi hija se viste sola desde los cuatro años.", english: "My daughter has been dressing herself since she was four.", tags: ["general", "family"], grammar: "Vestirse — reflexive with stem change: me visto, te vistes..." },
    { target: "Nos sentamos siempre en la misma mesa de la cafetería.", english: "We always sit at the same table in the cafeteria.", tags: ["general", "work"] },
    { target: "¿Te quedas a dormir o te vas a tu casa?", english: "Are you staying over or going home?", tags: ["general", "family"] },
    { target: "Mi marido se afeita todas las mañanas.", english: "My husband shaves every morning.", tags: ["general", "family"] },
    { target: "Me pongo nerviosa cuando tengo que hablar en público.", english: "I get nervous when I have to speak in public.", tags: ["general", "work"], grammar: "Ponerse + adjective — to become/get (emotional change)" },
    { target: "Los niños se lavan los dientes antes de dormir.", english: "The kids brush their teeth before bed.", tags: ["general", "family"] },
    { target: "Me llamo Andrea, ¿y tú?", english: "My name is Andrea, and yours?", tags: ["general"], grammar: "Llamarse — reflexive: me llamo = I call myself / my name is" },
    { target: "Nos despertamos con el ruido de la calle.", english: "We woke up from the street noise.", tags: ["general"] },
    { target: "¿Os preparáis para la reunión de mañana?", english: "Are you guys getting ready for tomorrow's meeting?", tags: ["general", "work"] },
    { target: "Me siento muy cansada después de la jornada.", english: "I feel very tired after the workday.", tags: ["general", "work"], grammar: "Sentirse — to feel (reflexive with stem change: me siento, te sientes...)" },
    { target: "Se peina delante del espejo durante diez minutos.", english: "He combs his hair in front of the mirror for ten minutes.", tags: ["general"] },
    { target: "Me relajo leyendo un rato antes de dormir.", english: "I relax by reading a bit before bed.", tags: ["general"] },
    { target: "Mi madre se preocupa demasiado por todo.", english: "My mother worries too much about everything.", tags: ["general", "family"], grammar: "Preocuparse — to worry (reflexive)" },
    { target: "Nos reunimos cada lunes para revisar los objetivos.", english: "We meet every Monday to review the goals.", tags: ["general", "work"] },
    { target: "¿Te acuerdas de lo que hablamos ayer?", english: "Do you remember what we talked about yesterday?", tags: ["general", "work"], grammar: "Acordarse de — to remember (reflexive)" },
    { target: "Se quita los zapatos en cuanto llega a casa.", english: "He takes off his shoes as soon as he gets home.", tags: ["general"] },
    { target: "Me arreglo en quince minutos como mucho.", english: "I get ready in fifteen minutes at most.", tags: ["general"] },
    { target: "Nos marchamos temprano para evitar el tráfico.", english: "We leave early to avoid traffic.", tags: ["general", "work", "travel"] },
    { target: "¿Te diviertes en tu nuevo trabajo?", english: "Are you having fun at your new job?", tags: ["general", "work"], grammar: "Divertirse — to have fun (reflexive with stem change: e→ie)" },
    { target: "Mi padre se duerme viendo la tele.", english: "My father falls asleep watching TV.", tags: ["general", "family"], grammar: "Dormirse — to fall asleep (reflexive with stem change: o→ue)" },
    { target: "Me concentro mejor cuando trabajo desde casa.", english: "I concentrate better when I work from home.", tags: ["general", "work"] },
    { target: "Se maquilla muy poco, prefiere lo natural.", english: "She wears very little makeup, she prefers the natural look.", tags: ["general"] },
    { target: "Nos conocemos desde el colegio.", english: "We've known each other since school.", tags: ["general"] },
    { target: "¿A qué hora se levantan tus hijos?", english: "What time do your kids get up?", tags: ["general", "family"] },
    { target: "Me quedo trabajando hasta tarde los jueves.", english: "I stay working late on Thursdays.", tags: ["general", "work"] },
    { target: "Se enfadó porque llegamos tarde a su fiesta.", english: "He got angry because we arrived late to his party.", tags: ["general", "family"], grammar: "Enfadarse — to get angry (reflexive)" },
    { target: "Me cambio de ropa en cuanto llego del trabajo.", english: "I change clothes as soon as I get home from work.", tags: ["general", "work"] },
    { target: "Nos encontramos a las cinco en la entrada.", english: "We'll meet at five at the entrance.", tags: ["general", "work"] },
    { target: "Se seca el pelo con secador porque tiene prisa.", english: "She blow-dries her hair because she's in a hurry.", tags: ["general"] },
    { target: "Me aburro mucho en las reuniones largas.", english: "I get very bored in long meetings.", tags: ["general", "work"], grammar: "Aburrirse — to get bored (reflexive)" },
    { target: "¿Te apuntas a la clase de yoga de los martes?", english: "Are you signing up for the Tuesday yoga class?", tags: ["general"] },
    { target: "Se despierta siempre antes de que suene la alarma.", english: "She always wakes up before the alarm goes off.", tags: ["general"] },
    { target: "Me paso el día entero delante del ordenador.", english: "I spend the whole day in front of the computer.", tags: ["general", "work"] },
    { target: "Nos vamos de la oficina a las seis en punto.", english: "We leave the office at six sharp.", tags: ["general", "work"] },
    { target: "¿Te sientes mejor hoy?", english: "Do you feel better today?", tags: ["general", "family"] },
    { target: "Se olvida siempre de cerrar la puerta con llave.", english: "He always forgets to lock the door.", tags: ["general", "family"], grammar: "Olvidarse de — to forget (reflexive)" },
    { target: "Me matriculé en un curso de inglés por la noche.", english: "I signed up for an evening English course.", tags: ["general", "work"] },
    { target: "Se adaptan muy bien a los cambios.", english: "They adapt very well to changes.", tags: ["general", "work"] },
    { target: "Nos turnamos para llevar a los niños al colegio.", english: "We take turns taking the kids to school.", tags: ["general", "family"] },
    { target: "Me organizo el domingo para toda la semana.", english: "I organize myself on Sunday for the whole week.", tags: ["general", "work"] },
    { target: "Se queja de la comida del comedor todos los días.", english: "She complains about the cafeteria food every day.", tags: ["general", "work"], grammar: "Quejarse de — to complain about (reflexive)" },
    { target: "¿Te mudas pronto al piso nuevo?", english: "Are you moving to the new apartment soon?", tags: ["general", "family"] },
    { target: "Me pongo crema después de ducharme.", english: "I put on lotion after showering.", tags: ["general"] },
    { target: "Se incorpora al equipo la semana que viene.", english: "She's joining the team next week.", tags: ["general", "work"] },
    { target: "Me despido ya, que tengo que irme.", english: "I'll say goodbye now, I have to go.", tags: ["general"], grammar: "Despedirse — to say goodbye (reflexive with stem change: e→i)" },
    { target: "Nos acostumbramos rápido al nuevo horario.", english: "We got used to the new schedule quickly.", tags: ["general", "work"] },
    { target: "Se aburren si no tienen algo que hacer.", english: "They get bored if they don't have something to do.", tags: ["general", "family"] },
    { target: "Me inscribí en un maratón sin pensarlo mucho.", english: "I signed up for a marathon without thinking about it much.", tags: ["general"] },
    { target: "¿Os quedáis a cenar con nosotros?", english: "Are you guys staying for dinner with us?", tags: ["general", "family"] },
    { target: "Me noto el cuello cargado de estar tanto rato sentado.", english: "My neck feels stiff from sitting for so long.", tags: ["general", "work"] },
    { target: "Se jubila en junio después de treinta años.", english: "He's retiring in June after thirty years.", tags: ["general", "work"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 9: Object Pronouns (A2)
  // me/te/le/nos/os/les, lo/la/los/las, combined pronouns
  // ═══════════════════════════════════════════════════════════════
  9: [
    { target: "Te mando el documento por correo ahora mismo.", english: "I'll send you the document by email right now.", tags: ["general", "work"], grammar: "Te — indirect object pronoun (to you)" },
    { target: "¿Me puedes pasar la dirección del restaurante?", english: "Can you give me the restaurant's address?", tags: ["general", "travel"] },
    { target: "Se lo dije ayer, pero no me hizo caso.", english: "I told him yesterday, but he didn't listen to me.", tags: ["general", "work"], grammar: "Se lo — combined pronouns: le + lo becomes se lo" },
    { target: "No la encuentro por ningún lado.", english: "I can't find it anywhere.", tags: ["general"], grammar: "La — direct object pronoun (feminine: her/it)" },
    { target: "¿Le has dado las llaves al portero?", english: "Have you given the keys to the doorman?", tags: ["general"] },
    { target: "Nos lo explicaron todo en la orientación.", english: "They explained everything to us at the orientation.", tags: ["general", "work"] },
    { target: "Lo sé, lo sé, pero no tuve tiempo.", english: "I know, I know, but I didn't have time.", tags: ["general", "work"] },
    { target: "¿Os apetece que os lleve en coche?", english: "Would you guys like me to give you a ride?", tags: ["general", "family"] },
    { target: "Le compré un regalo a mi madre por su cumpleaños.", english: "I bought my mother a gift for her birthday.", tags: ["general", "family"] },
    { target: "Los vi en el supermercado esta mañana.", english: "I saw them at the supermarket this morning.", tags: ["general"] },
    { target: "Me lo contó todo con mucho detalle.", english: "She told me everything in great detail.", tags: ["general"], grammar: "Me lo — combined pronouns: indirect me + direct lo" },
    { target: "¿Le dijiste a tu jefa que llegas tarde?", english: "Did you tell your boss you're arriving late?", tags: ["general", "work"] },
    { target: "No nos avisaron del cambio de horario.", english: "They didn't notify us about the schedule change.", tags: ["general", "work"] },
    { target: "La conozco desde que éramos pequeñas.", english: "I've known her since we were little.", tags: ["general", "family"] },
    { target: "Te lo prometo, esta vez voy a llegar a tiempo.", english: "I promise you, this time I'll arrive on time.", tags: ["general"] },
    { target: "Les mandé un mensaje para confirmar la hora.", english: "I sent them a message to confirm the time.", tags: ["general", "work"] },
    { target: "Lo tengo todo controlado, no te preocupes.", english: "I have everything under control, don't worry.", tags: ["general", "work"] },
    { target: "¿Me dejas tu bolígrafo un momento?", english: "Can you lend me your pen for a moment?", tags: ["general", "work"] },
    { target: "Se la presenté a mi familia el domingo.", english: "I introduced her to my family on Sunday.", tags: ["general", "family"], grammar: "Se la — combined pronouns: le + la becomes se la" },
    { target: "No lo veo claro, necesito más información.", english: "I don't see it clearly, I need more information.", tags: ["general", "work"] },
    { target: "Le pedí el número al técnico de mantenimiento.", english: "I asked the maintenance technician for the number.", tags: ["general", "work"] },
    { target: "Nos vemos mañana a primera hora.", english: "We'll see each other tomorrow first thing in the morning.", tags: ["general", "work"] },
    { target: "Las dejé en la mesa de tu despacho.", english: "I left them on your office desk.", tags: ["general", "work"] },
    { target: "Te lo digo en serio, no estoy bromeando.", english: "I'm telling you seriously, I'm not joking.", tags: ["general"] },
    { target: "Le encanta el chocolate, regálale una caja.", english: "She loves chocolate, give her a box.", tags: ["general", "family"], grammar: "Le — indirect object with gustar-type verbs" },
    { target: "Nos invitaron a la boda de su hija.", english: "They invited us to their daughter's wedding.", tags: ["general", "family"] },
    { target: "Lo preparé todo para la presentación de mañana.", english: "I prepared everything for tomorrow's presentation.", tags: ["general", "work"] },
    { target: "¿Te lo paso por email o te lo imprimo?", english: "Should I send it to you by email or print it for you?", tags: ["general", "work"] },
    { target: "Le sugerí que hablara con recursos humanos.", english: "I suggested that she talk to human resources.", tags: ["general", "work"] },
    { target: "Me encanta tu jersey, ¿dónde lo compraste?", english: "I love your sweater, where did you buy it?", tags: ["general"] },
    { target: "Nos lo pasamos genial en la excursión.", english: "We had a great time on the trip.", tags: ["general", "travel"], grammar: "Pasárselo — to have a time (reflexive + lo)" },
    { target: "Le doy clase a un grupo de seis personas.", english: "I teach a group of six people.", tags: ["general", "work"] },
    { target: "Los llamé pero no me cogieron el teléfono.", english: "I called them but they didn't pick up.", tags: ["general"] },
    { target: "¿Le has pedido permiso a tu padre?", english: "Have you asked your father for permission?", tags: ["general", "family"] },
    { target: "Te mando la ubicación por WhatsApp.", english: "I'll send you the location on WhatsApp.", tags: ["general", "travel"] },
    { target: "Me la recomendó un compañero de trabajo.", english: "A coworker recommended it to me.", tags: ["general", "work"] },
    { target: "Nos ayudaron a llevar las maletas al coche.", english: "They helped us carry the suitcases to the car.", tags: ["general", "travel"] },
    { target: "Le pregunté si podía cambiar mi turno.", english: "I asked him if I could switch my shift.", tags: ["general", "work"] },
    { target: "Lo dejé en la mesilla de noche, estoy segura.", english: "I left it on the nightstand, I'm sure.", tags: ["general"] },
    { target: "Me cuesta mucho madrugar en invierno.", english: "It's really hard for me to get up early in winter.", tags: ["general"], grammar: "Costar + indirect object — to be hard for someone" },
    { target: "Les preparé café a todos los del equipo.", english: "I made coffee for everyone on the team.", tags: ["general", "work"] },
    { target: "Te la devuelvo mañana sin falta.", english: "I'll return it to you tomorrow without fail.", tags: ["general"] },
    { target: "¿Se lo has contado a alguien más?", english: "Have you told anyone else about it?", tags: ["general"] },
    { target: "Le llevo el almuerzo a mi abuela todos los martes.", english: "I bring lunch to my grandmother every Tuesday.", tags: ["general", "family"] },
    { target: "Nos quedamos sin palabras cuando lo vimos.", english: "We were speechless when we saw it.", tags: ["general", "travel"] },
    { target: "Me falta una hora para terminar este proyecto.", english: "I need one more hour to finish this project.", tags: ["general", "work"], grammar: "Faltar + indirect object — to be missing/to need" },
    { target: "Se los envié por mensajería certificada.", english: "I sent them by certified mail.", tags: ["general", "work"] },
    { target: "Les gustaría mucho conocer a tu familia.", english: "They would really like to meet your family.", tags: ["general", "family"] },
    { target: "Lo abrieron delante de mí y estaba vacío.", english: "They opened it in front of me and it was empty.", tags: ["general"] },
    { target: "¿Me traes un vaso de agua, por favor?", english: "Can you bring me a glass of water, please?", tags: ["general", "family"] },
    { target: "Te los dejo en tu escritorio esta tarde.", english: "I'll leave them on your desk this afternoon.", tags: ["general", "work"] },
    { target: "Le avisé con una semana de antelación.", english: "I gave her a week's notice.", tags: ["general", "work"] },
    { target: "Nos sentó fatal que no nos invitaran.", english: "We were really hurt that they didn't invite us.", tags: ["general", "family"], grammar: "Sentar fatal — to sit very badly with someone (idiom)" },
    { target: "Me lo pienso y te digo algo mañana.", english: "I'll think about it and tell you something tomorrow.", tags: ["general", "work"] },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NODE 10: Prepositions & Directions (A2)
  // a, en, de, por, para, hacia, entre, desde, hasta, contra
  // ═══════════════════════════════════════════════════════════════
  10: [
    { target: "Voy a la oficina en metro por las mañanas.", english: "I go to the office by metro in the mornings.", tags: ["general", "work", "travel"], grammar: "A — to (destination); en — by (means of transport)" },
    { target: "El parque está entre el banco y la biblioteca.", english: "The park is between the bank and the library.", tags: ["general", "travel"] },
    { target: "Salimos de casa a las ocho para llegar a tiempo.", english: "We leave home at eight to arrive on time.", tags: ["general", "work"] },
    { target: "Caminé por el centro durante toda la mañana.", english: "I walked through downtown all morning.", tags: ["general", "travel"], grammar: "Por — through/along (movement through a space)" },
    { target: "Este regalo es para mi sobrina.", english: "This gift is for my niece.", tags: ["general", "family"], grammar: "Para — for (recipient/purpose)" },
    { target: "Desde aquí se ve toda la ciudad.", english: "From here you can see the whole city.", tags: ["general", "travel"], grammar: "Desde — from (starting point in space or time)" },
    { target: "La farmacia está al final de la calle, a la derecha.", english: "The pharmacy is at the end of the street, on the right.", tags: ["general", "travel"] },
    { target: "No vayas por esa calle, está en obras.", english: "Don't go along that street, it's under construction.", tags: ["general", "travel"] },
    { target: "Trabajo para una empresa de tecnología.", english: "I work for a technology company.", tags: ["general", "work"] },
    { target: "Vengo de la reunión con el cliente.", english: "I'm coming from the meeting with the client.", tags: ["general", "work"], grammar: "De — from (origin/source)" },
    { target: "Sigue todo recto hasta el semáforo.", english: "Go straight ahead until the traffic light.", tags: ["general", "travel"], grammar: "Hasta — until/up to" },
    { target: "Quiero pasar por tu casa de camino al trabajo.", english: "I want to stop by your house on the way to work.", tags: ["general", "family", "work"] },
    { target: "El hotel está a cinco minutos andando de la playa.", english: "The hotel is five minutes' walk from the beach.", tags: ["general", "travel"] },
    { target: "¿Para qué necesitas tantas cajas?", english: "What do you need so many boxes for?", tags: ["general"], grammar: "Para qué — what for (purpose)" },
    { target: "El colegio de los niños está cerca de la estación.", english: "The kids' school is near the station.", tags: ["general", "family", "travel"] },
    { target: "Me voy hacia el aeropuerto, ¿necesitas algo?", english: "I'm heading toward the airport, do you need anything?", tags: ["general", "travel"], grammar: "Hacia — toward (direction without specific destination)" },
    { target: "Hemos quedado en la puerta del cine a las siete.", english: "We've arranged to meet at the cinema entrance at seven.", tags: ["general"] },
    { target: "Envíalo por correo certificado, por favor.", english: "Send it by certified mail, please.", tags: ["general", "work"], grammar: "Por — by (means of sending/communication)" },
    { target: "La tienda está entre la panadería y el quiosco.", english: "The store is between the bakery and the newsstand.", tags: ["general", "travel"] },
    { target: "Estudio español para comunicarme mejor en el trabajo.", english: "I study Spanish to communicate better at work.", tags: ["general", "work"], grammar: "Para + infinitive — in order to" },
    { target: "Tienes que girar a la izquierda en la segunda calle.", english: "You have to turn left on the second street.", tags: ["general", "travel"] },
    { target: "El paquete llega de Alemania en tres días.", english: "The package arrives from Germany in three days.", tags: ["general", "work"] },
    { target: "Cruza el puente y la estación está al otro lado.", english: "Cross the bridge and the station is on the other side.", tags: ["general", "travel"] },
    { target: "Estoy a favor de cambiar el horario de trabajo.", english: "I'm in favor of changing the work schedule.", tags: ["general", "work"], grammar: "A favor de — in favor of; en contra de — against" },
    { target: "De Madrid a Barcelona son unas dos horas y media en AVE.", english: "From Madrid to Barcelona it's about two and a half hours by high-speed train.", tags: ["general", "travel"] },
    { target: "El museo está por aquí cerca, ¿no?", english: "The museum is around here somewhere, right?", tags: ["general", "travel"], grammar: "Por aquí — around here (approximate location)" },
    { target: "Vamos a comer a ese restaurante de la esquina.", english: "Let's go eat at that restaurant on the corner.", tags: ["general", "travel"] },
    { target: "Paso por la panadería de camino a casa.", english: "I stop by the bakery on the way home.", tags: ["general"] },
    { target: "Llevo viviendo en este barrio desde hace diez años.", english: "I've been living in this neighborhood for ten years.", tags: ["general"], grammar: "Desde hace — for (duration continuing to present)" },
    { target: "La sala de reuniones está al fondo del pasillo.", english: "The meeting room is at the end of the hallway.", tags: ["general", "work"] },
    { target: "La propuesta debe estar lista para el viernes.", english: "The proposal must be ready by Friday.", tags: ["general", "work"], grammar: "Para — by (deadline)" },
    { target: "¿Por dónde se sale de aquí?", english: "How do you get out of here?", tags: ["general", "travel"] },
    { target: "La conferencia es en el auditorio del tercer piso.", english: "The conference is in the auditorium on the third floor.", tags: ["general", "work"] },
    { target: "Estoy entre aceptar la oferta o esperar otra.", english: "I'm between accepting the offer or waiting for another one.", tags: ["general", "work"] },
    { target: "¿Puedes venir hacia las cuatro de la tarde?", english: "Can you come around four in the afternoon?", tags: ["general", "work"], grammar: "Hacia — around/approximately (with time)" },
    { target: "El supermercado más grande está a dos calles de aquí.", english: "The biggest supermarket is two streets from here.", tags: ["general", "travel"] },
    { target: "Llamé por teléfono para reservar una habitación.", english: "I called by phone to book a room.", tags: ["general", "travel"] },
    { target: "La carta es de parte de toda la familia.", english: "The letter is from the whole family.", tags: ["general", "family"], grammar: "De parte de — on behalf of/from" },
    { target: "Baja por estas escaleras y gira a la derecha.", english: "Go down these stairs and turn right.", tags: ["general", "travel"] },
    { target: "Hicimos la mudanza entre mi hermano y yo.", english: "My brother and I did the move between us.", tags: ["general", "family"], grammar: "Entre — between/among (also used for shared effort)" },
    { target: "Los documentos están en la carpeta de proyectos.", english: "The documents are in the projects folder.", tags: ["general", "work"] },
    { target: "Quedamos en vernos a las cinco en la plaza.", english: "We agreed to meet at five in the square.", tags: ["general", "travel"] },
    { target: "¿Vienes en coche o vas a coger el autobús?", english: "Are you driving or taking the bus?", tags: ["general", "travel"] },
    { target: "Salgo del trabajo a las seis y voy directo a casa.", english: "I get off work at six and go straight home.", tags: ["general", "work"] },
    { target: "Envié el paquete a la dirección de tu empresa.", english: "I sent the package to your company's address.", tags: ["general", "work"] },
    { target: "¿Pasamos por casa de los abuelos de camino?", english: "Shall we stop by the grandparents' house on the way?", tags: ["general", "family"] },
    { target: "La tienda de ropa está justo enfrente del banco.", english: "The clothing store is right across from the bank.", tags: ["general", "travel"], grammar: "Enfrente de — across from/opposite" },
    { target: "Trabajo desde las nueve hasta las seis.", english: "I work from nine to six.", tags: ["general", "work"], grammar: "Desde...hasta — from...to (time range)" },
    { target: "La cafetería está debajo de nuestra oficina.", english: "The cafeteria is below our office.", tags: ["general", "work"], grammar: "Debajo de — below/under" },
    { target: "Vamos por buen camino con el proyecto.", english: "We're on the right track with the project.", tags: ["general", "work"] },
    { target: "¿Hay un parque infantil cerca de aquí para los niños?", english: "Is there a playground near here for the kids?", tags: ["general", "family", "travel"] },
    { target: "Las instrucciones están dentro del paquete.", english: "The instructions are inside the package.", tags: ["general"], grammar: "Dentro de — inside of" },
    { target: "Sigue por esta avenida hasta llegar a la rotonda.", english: "Continue along this avenue until you reach the roundabout.", tags: ["general", "travel"] },
    { target: "Me apoyé contra la pared porque estaba muy cansado.", english: "I leaned against the wall because I was very tired.", tags: ["general"], grammar: "Contra — against" },
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

// Per-node breakdown
console.log('\nCards per node in this batch:');
for (const [node, cards] of Object.entries(newCardsByNode)) {
  console.log(`  Node ${node}: ${cards.length} defined`);
}
