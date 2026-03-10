/**
 * fill-travel.cjs
 *
 * Adds ~520 NEW travel-tagged Spanish flashcards to the deck.
 * Distributed across A1/A2/B1/B2 grammar levels (~130 each).
 * Every card is genuinely about travel situations.
 *
 * Usage: node scripts/fill-travel.cjs
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');

// ─────────────────────────────────────────────────────────────────────
// A1 CARDS (~130): Simple present, ser/estar, basic questions, articles
// ─────────────────────────────────────────────────────────────────────
const A1_CARDS = [
  // Airports & flights
  { target: "¿Dónde está el aeropuerto?", english: "Where is the airport?" },
  { target: "El avión sale a las ocho.", english: "The plane leaves at eight.", grammar: "\"Sale\" is the present tense of \"salir\" (to leave). Irregular: salgo, sales, sale, salimos, salís, salen." },
  { target: "Necesito mi pasaporte.", english: "I need my passport." },
  { target: "¿Cuál es la puerta de embarque?", english: "What is the boarding gate?" },
  { target: "El vuelo es directo.", english: "The flight is direct.", grammar: "\"Ser\" is used for inherent characteristics. The flight IS direct — it's a defining feature of this flight." },
  { target: "Mi asiento está cerca de la ventana.", english: "My seat is near the window.", grammar: "\"Estar\" for location. The seat IS (located) near the window." },
  { target: "¿A qué hora llega el avión?", english: "What time does the plane arrive?" },
  { target: "La maleta es grande.", english: "The suitcase is big." },
  { target: "Tengo una mochila pequeña.", english: "I have a small backpack." },
  { target: "¿Hay wifi en el avión?", english: "Is there wifi on the plane?" },
  { target: "El aeropuerto es muy grande.", english: "The airport is very big." },
  { target: "Quiero un asiento de pasillo.", english: "I want an aisle seat." },
  { target: "La puerta de embarque está lejos.", english: "The boarding gate is far." },
  { target: "¿Dónde recojo el equipaje?", english: "Where do I pick up the luggage?" },
  { target: "El vuelo dura tres horas.", english: "The flight lasts three hours." },

  // Hotels & accommodation
  { target: "¿Dónde está el hotel?", english: "Where is the hotel?" },
  { target: "Tengo una reserva.", english: "I have a reservation." },
  { target: "La habitación es cómoda.", english: "The room is comfortable." },
  { target: "¿Hay habitaciones libres?", english: "Are there available rooms?" },
  { target: "Necesito una toalla.", english: "I need a towel." },
  { target: "¿A qué hora es el desayuno?", english: "What time is breakfast?", grammar: "\"Ser\" is used for scheduled events. Breakfast IS at a fixed time." },
  { target: "La cama es muy blanda.", english: "The bed is very soft." },
  { target: "¿Tiene habitación doble?", english: "Do you have a double room?" },
  { target: "El baño está limpio.", english: "The bathroom is clean.", grammar: "\"Estar\" for conditions/states. Clean is a current state, not an inherent quality." },
  { target: "¿Cuánto cuesta la noche?", english: "How much does one night cost?" },
  { target: "La llave no funciona.", english: "The key doesn't work." },
  { target: "¿Hay piscina en el hotel?", english: "Is there a pool at the hotel?" },
  { target: "La vista es increíble.", english: "The view is incredible." },
  { target: "Quiero una habitación con balcón.", english: "I want a room with a balcony." },
  { target: "El hotel está en el centro.", english: "The hotel is in the center." },

  // Restaurants & food
  { target: "¿Tiene una mesa para dos?", english: "Do you have a table for two?" },
  { target: "Quiero la carta, por favor.", english: "I want the menu, please.", grammar: "\"La carta\" is the menu in a restaurant. \"El menú\" often refers to a fixed-price meal (menú del día)." },
  { target: "¿Qué recomienda?", english: "What do you recommend?" },
  { target: "La cuenta, por favor.", english: "The check, please." },
  { target: "La comida está deliciosa.", english: "The food is delicious." },
  { target: "Soy alérgico al marisco.", english: "I'm allergic to seafood.", grammar: "\"Ser\" for permanent traits. An allergy is a lasting condition, so use \"soy\" (I am)." },
  { target: "¿Tiene platos vegetarianos?", english: "Do you have vegetarian dishes?" },
  { target: "Quiero agua sin gas.", english: "I want still water." },
  { target: "La sopa del día es de tomate.", english: "The soup of the day is tomato." },
  { target: "¿Está incluida la propina?", english: "Is the tip included?" },
  { target: "Un café con leche, por favor.", english: "A coffee with milk, please." },
  { target: "¿Tiene menú del día?", english: "Do you have a set menu?" },
  { target: "La paella es para dos personas.", english: "The paella is for two people." },
  { target: "Quiero probar algo típico.", english: "I want to try something typical." },
  { target: "El restaurante abre a las siete.", english: "The restaurant opens at seven." },

  // Directions & getting around
  { target: "¿Dónde está la estación de tren?", english: "Where is the train station?" },
  { target: "¿Cómo llego al museo?", english: "How do I get to the museum?", grammar: "\"Llego\" from \"llegar\" (to arrive). \"¿Cómo llego a...?\" is the standard way to ask for directions." },
  { target: "Está a la derecha.", english: "It's on the right." },
  { target: "Sigue recto dos calles.", english: "Go straight two blocks." },
  { target: "¿Está lejos de aquí?", english: "Is it far from here?" },
  { target: "La playa está cerca del hotel.", english: "The beach is close to the hotel." },
  { target: "Gira a la izquierda.", english: "Turn left." },
  { target: "¿Hay una farmacia por aquí?", english: "Is there a pharmacy around here?" },
  { target: "El metro está en la esquina.", english: "The metro is on the corner." },
  { target: "¿Dónde hay un cajero?", english: "Where is there an ATM?" },
  { target: "El centro está a diez minutos.", english: "The center is ten minutes away." },
  { target: "¿Es esta la calle principal?", english: "Is this the main street?" },

  // Transport
  { target: "¿Cuánto cuesta un taxi al centro?", english: "How much does a taxi to the center cost?" },
  { target: "El tren sale del andén tres.", english: "The train leaves from platform three." },
  { target: "¿Dónde compro los billetes?", english: "Where do I buy the tickets?" },
  { target: "Quiero un billete de ida y vuelta.", english: "I want a round-trip ticket.", grammar: "\"Ida y vuelta\" literally means \"going and return.\" A one-way ticket is \"billete de ida.\"" },
  { target: "El autobús pasa cada veinte minutos.", english: "The bus comes every twenty minutes." },
  { target: "¿Hay un mapa de la ciudad?", english: "Is there a map of the city?" },
  { target: "El tren es rápido.", english: "The train is fast." },
  { target: "¿A qué hora sale el último tren?", english: "What time does the last train leave?" },
  { target: "El taxi es caro aquí.", english: "Taxis are expensive here." },
  { target: "Necesito un taxi para el aeropuerto.", english: "I need a taxi to the airport." },

  // Sightseeing & activities
  { target: "¿Dónde está el museo de arte?", english: "Where is the art museum?" },
  { target: "¿Cuánto cuesta la entrada?", english: "How much does the entrance cost?" },
  { target: "La catedral es muy antigua.", english: "The cathedral is very old." },
  { target: "¿A qué hora abre el museo?", english: "What time does the museum open?" },
  { target: "La plaza está llena de gente.", english: "The square is full of people.", grammar: "\"Estar\" for temporary states. The square is full now, but it won't always be." },
  { target: "Quiero visitar la ciudad vieja.", english: "I want to visit the old town." },
  { target: "¿Hay tours en inglés?", english: "Are there tours in English?" },
  { target: "La iglesia es del siglo quince.", english: "The church is from the fifteenth century." },
  { target: "Las fotos están prohibidas aquí.", english: "Photos are prohibited here." },
  { target: "El parque es bonito.", english: "The park is pretty." },

  // Shopping & basics
  { target: "¿Cuánto cuesta esto?", english: "How much does this cost?" },
  { target: "¿Acepta tarjeta?", english: "Do you accept card?" },
  { target: "Es muy caro.", english: "It's very expensive." },
  { target: "¿Tiene talla mediana?", english: "Do you have a medium size?" },
  { target: "Quiero un recuerdo.", english: "I want a souvenir." },
  { target: "¿Dónde hay un supermercado?", english: "Where is there a supermarket?" },
  { target: "La tienda cierra a las nueve.", english: "The store closes at nine." },

  // Weather & general travel
  { target: "Hoy hace mucho calor.", english: "It's very hot today.", grammar: "Weather uses \"hacer\" in Spanish: hace calor (it's hot), hace frío (it's cold), hace sol (it's sunny), hace viento (it's windy)." },
  { target: "¿Llueve mucho aquí?", english: "Does it rain a lot here?" },
  { target: "El clima es agradable.", english: "The weather is pleasant." },
  { target: "Hace sol todos los días.", english: "It's sunny every day." },

  // Emergencies & help
  { target: "Necesito ayuda.", english: "I need help." },
  { target: "¿Dónde está el hospital más cercano?", english: "Where is the nearest hospital?" },
  { target: "Estoy perdido.", english: "I'm lost.", grammar: "\"Estar\" for temporary states. Being lost is a current condition, not a permanent trait." },
  { target: "No hablo mucho español.", english: "I don't speak much Spanish." },
  { target: "¿Habla inglés?", english: "Do you speak English?" },
  { target: "¿Puede hablar más despacio?", english: "Can you speak more slowly?" },
  { target: "¿Dónde hay una comisaría?", english: "Where is there a police station?" },

  // Booking & reservations
  { target: "Quiero reservar una habitación.", english: "I want to book a room." },
  { target: "¿Tiene disponibilidad para mañana?", english: "Do you have availability for tomorrow?" },
  { target: "La reserva es a nombre de García.", english: "The reservation is under the name García." },
  { target: "¿Puedo cancelar la reserva?", english: "Can I cancel the reservation?" },
  { target: "Quiero tres noches.", english: "I want three nights." },
  { target: "¿El desayuno está incluido?", english: "Is breakfast included?" },
  { target: "¿Tiene wifi gratis?", english: "Do you have free wifi?" },
  { target: "La habitación tiene aire acondicionado.", english: "The room has air conditioning." },
  { target: "¿A qué hora es la salida?", english: "What time is checkout?" },
  { target: "Necesito una cuna para el bebé.", english: "I need a crib for the baby." },
  { target: "¿Hay aparcamiento en el hotel?", english: "Is there parking at the hotel?" },
  { target: "El ascensor está al fondo del pasillo.", english: "The elevator is at the end of the hall." },
  { target: "¿Puedo dejar las maletas aquí?", english: "Can I leave my suitcases here?" },
  { target: "¿Tienen servicio de lavandería?", english: "Do you have laundry service?" },
  { target: "El agua caliente no funciona.", english: "The hot water doesn't work." },
  { target: "¿Puede llamar un taxi?", english: "Can you call a taxi?" },
  { target: "¿Hay restaurantes cerca del hotel?", english: "Are there restaurants near the hotel?" },

  // More A1 — beach, daily travel, numbers
  { target: "La playa es bonita.", english: "The beach is pretty." },
  { target: "El agua está fría.", english: "The water is cold.", grammar: "\"Estar\" for temporary conditions. The water IS cold right now." },
  { target: "¿Hay sombrillas en la playa?", english: "Are there umbrellas on the beach?" },
  { target: "Necesito una botella de agua.", english: "I need a bottle of water." },
  { target: "¿Dónde está la parada de autobús?", english: "Where is the bus stop?" },
  { target: "El tren llega a las tres.", english: "The train arrives at three." },
  { target: "¿Cuántas personas son?", english: "How many people are there?" },
  { target: "Son dos adultos y un niño.", english: "It's two adults and one child." },
  { target: "¿Tiene una habitación individual?", english: "Do you have a single room?" },
  { target: "La calle está cerrada.", english: "The street is closed." },
  { target: "¿Dónde está la oficina de turismo?", english: "Where is the tourist office?" },
  { target: "El museo cierra los lunes.", english: "The museum closes on Mondays." },
  { target: "Necesito cambiar dinero.", english: "I need to exchange money." },
  { target: "¿Hay cajeros automáticos cerca?", english: "Are there ATMs nearby?" },
  { target: "La comida es barata aquí.", english: "Food is cheap here." },
  { target: "¿Puedo pagar en efectivo?", english: "Can I pay in cash?" },
  { target: "¿Tiene habitación con desayuno?", english: "Do you have a room with breakfast?" },
  { target: "El puerto está al sur de la ciudad.", english: "The port is south of the city." },
  { target: "¿Hay un banco por aquí?", english: "Is there a bank around here?" },
  { target: "El mercado abre los sábados.", english: "The market opens on Saturdays." },
  { target: "Quiero alquilar una bicicleta.", english: "I want to rent a bicycle." },
  { target: "¿Es seguro caminar de noche?", english: "Is it safe to walk at night?" },
  { target: "La estación de autobuses está lejos.", english: "The bus station is far." },
  { target: "¿Dónde puedo cargar el teléfono?", english: "Where can I charge my phone?" },
  { target: "El hostal tiene cocina compartida.", english: "The hostel has a shared kitchen." },
  { target: "¿Cuánto tarda el autobús?", english: "How long does the bus take?" },
  { target: "La cerveza es muy barata aquí.", english: "Beer is very cheap here." },
  { target: "¿Tienen menú en inglés?", english: "Do you have a menu in English?" },
];

// ─────────────────────────────────────────────────────────────────────
// A2 CARDS (~130): Past tenses, reflexives, object pronouns, por/para
// ─────────────────────────────────────────────────────────────────────
const A2_CARDS = [
  // Past tense — airports & flights
  { target: "Perdí mi maleta en el aeropuerto.", english: "I lost my suitcase at the airport.", grammar: "\"Perdí\" is pretérito of \"perder.\" Irregular stem change only in present tense; pretérito is regular for -er verbs: perdí, perdiste, perdió." },
  { target: "El vuelo se retrasó dos horas.", english: "The flight was delayed two hours." },
  { target: "Llegamos al aeropuerto muy temprano.", english: "We arrived at the airport very early." },
  { target: "Facturé la maleta en el mostrador.", english: "I checked the suitcase at the counter." },
  { target: "El avión aterrizó sin problemas.", english: "The plane landed without problems." },
  { target: "Pasamos por el control de seguridad.", english: "We went through security." },
  { target: "Compré los billetes por internet.", english: "I bought the tickets online.", grammar: "\"Por internet\" — \"por\" indicates the means/medium through which something is done." },
  { target: "Perdimos la conexión en Madrid.", english: "We missed the connection in Madrid." },
  { target: "Me senté en el asiento equivocado.", english: "I sat in the wrong seat.", grammar: "\"Sentarse\" is reflexive: me senté (I sat down). The pretérito of sentarse: me senté, te sentaste, se sentó." },
  { target: "El auxiliar de vuelo nos ayudó.", english: "The flight attendant helped us." },

  // Past tense — hotels
  { target: "Nos quedamos en un hostal muy barato.", english: "We stayed at a very cheap hostel.", grammar: "\"Quedarse\" is reflexive: nos quedamos (we stayed). Without \"se,\" quedar means \"to remain\" or \"to meet up.\"" },
  { target: "La habitación no estaba lista cuando llegamos.", english: "The room wasn't ready when we arrived." },
  { target: "Dejé las llaves en la recepción.", english: "I left the keys at the reception." },
  { target: "El hotel no tenía piscina.", english: "The hotel didn't have a pool." },
  { target: "Me desperté tarde y perdí el desayuno.", english: "I woke up late and missed breakfast.", grammar: "\"Despertarse\" is reflexive. In pretérito: me desperté, te despertaste, se despertó." },
  { target: "Reservé la habitación para tres noches.", english: "I booked the room for three nights.", grammar: "\"Para\" indicates purpose/destination. \"For three nights\" = the intended duration of the stay." },
  { target: "El recepcionista nos dio un mapa.", english: "The receptionist gave us a map." },
  { target: "Pagamos con tarjeta de crédito.", english: "We paid with a credit card." },
  { target: "El aire acondicionado no funcionaba.", english: "The air conditioning wasn't working." },
  { target: "Pedí una habitación con vistas al mar.", english: "I asked for a room with a sea view." },

  // Past tense — restaurants & food
  { target: "Probé la paella por primera vez.", english: "I tried paella for the first time.", grammar: "\"Por primera vez\" — \"por\" here indicates \"for\" in the sense of occasion/circumstance." },
  { target: "El camarero nos recomendó el pescado.", english: "The waiter recommended the fish to us." },
  { target: "Pedimos una botella de vino tinto.", english: "We ordered a bottle of red wine." },
  { target: "La cena costó cuarenta euros.", english: "Dinner cost forty euros." },
  { target: "Comimos tapas en el mercado.", english: "We ate tapas at the market." },
  { target: "Me encantó la comida local.", english: "I loved the local food.", grammar: "\"Encantar\" works like \"gustar\": the thing loved is the subject. \"Me encantó\" = it enchanted me." },
  { target: "Dejé propina en la mesa.", english: "I left a tip on the table." },
  { target: "No entendí el menú porque estaba en catalán.", english: "I didn't understand the menu because it was in Catalan." },
  { target: "Desayunamos en una cafetería cerca del hotel.", english: "We had breakfast at a cafe near the hotel." },
  { target: "El postre estaba riquísimo.", english: "The dessert was really delicious." },

  // Past tense — transport & directions
  { target: "Tomamos el metro para ir al centro.", english: "We took the metro to go downtown.", grammar: "\"Para ir\" — \"para\" + infinitive expresses purpose: in order to go." },
  { target: "El taxi tardó veinte minutos en llegar.", english: "The taxi took twenty minutes to arrive." },
  { target: "Me bajé en la parada equivocada.", english: "I got off at the wrong stop.", grammar: "\"Bajarse\" is reflexive: me bajé (I got off). \"Subirse\" = to get on, \"bajarse\" = to get off." },
  { target: "Alquilamos un coche por una semana.", english: "We rented a car for a week.", grammar: "\"Por una semana\" — \"por\" for duration of time. How long the rental lasted." },
  { target: "El autobús nos dejó en la plaza.", english: "The bus dropped us off at the square." },
  { target: "Caminamos por el casco antiguo toda la tarde.", english: "We walked through the old town all afternoon.", grammar: "\"Por\" for movement through a place. \"Caminamos por\" = we walked through/around." },
  { target: "Cogí el tren equivocado.", english: "I took the wrong train." },
  { target: "El GPS nos llevó por una ruta más larga.", english: "The GPS took us on a longer route." },
  { target: "Cruzamos el puente para llegar a la otra orilla.", english: "We crossed the bridge to get to the other side." },
  { target: "Me perdí en las callejuelas del centro.", english: "I got lost in the narrow streets of the center." },

  // Past tense — sightseeing
  { target: "Visitamos tres museos en un día.", english: "We visited three museums in one day." },
  { target: "Saqué muchas fotos del paisaje.", english: "I took many photos of the landscape." },
  { target: "La guía nos contó la historia del castillo.", english: "The guide told us the history of the castle." },
  { target: "Subimos a la torre y vimos toda la ciudad.", english: "We climbed the tower and saw the whole city." },
  { target: "Entramos a la catedral y estaba vacía.", english: "We entered the cathedral and it was empty." },
  { target: "Hicimos una excursión a las montañas.", english: "We did an excursion to the mountains." },
  { target: "El tour duró dos horas y media.", english: "The tour lasted two and a half hours." },
  { target: "Vimos un espectáculo de flamenco.", english: "We saw a flamenco show." },
  { target: "Nos sacamos una foto delante de la fuente.", english: "We took a photo in front of the fountain." },
  { target: "Recorrimos el barrio gótico a pie.", english: "We explored the Gothic Quarter on foot." },

  // Past tense — shopping
  { target: "Compré regalos para toda la familia.", english: "I bought gifts for the whole family.", grammar: "\"Para\" indicates the recipient/beneficiary: gifts FOR the family." },
  { target: "Encontré una tienda de artesanías local.", english: "I found a local crafts shop." },
  { target: "Regateé el precio y me hicieron un descuento.", english: "I haggled the price and they gave me a discount." },
  { target: "Gasté demasiado en recuerdos.", english: "I spent too much on souvenirs." },
  { target: "Le compré una camiseta a mi hermano.", english: "I bought a t-shirt for my brother.", grammar: "\"Le\" is an indirect object pronoun (to/for him). \"Le compré\" = I bought for him." },

  // Reflexives in travel
  { target: "Me levanté temprano para ver el amanecer.", english: "I got up early to see the sunrise." },
  { target: "Nos preparamos rápido para no perder el tren.", english: "We got ready quickly so we wouldn't miss the train." },
  { target: "Se me cayó el teléfono en la piscina.", english: "I dropped my phone in the pool.", grammar: "\"Se me cayó\" — accidental reflexive construction. Literally: \"it fell itself on me.\" Used when something happens unintentionally." },
  { target: "Me quemé con el sol en la playa.", english: "I got sunburned on the beach." },
  { target: "Nos divertimos mucho en el parque temático.", english: "We had a lot of fun at the theme park." },
  { target: "Me aburrí en el museo de historia.", english: "I got bored at the history museum." },
  { target: "Se me olvidó el protector solar.", english: "I forgot the sunscreen.", grammar: "\"Se me olvidó\" — another accidental reflexive. \"It forgot itself on me.\" Common way to say you forgot something unintentionally." },
  { target: "Me vestí rápido para la cena.", english: "I got dressed quickly for dinner." },

  // Object pronouns in travel
  { target: "Se lo dije al recepcionista.", english: "I told it to the receptionist.", grammar: "\"Se lo dije\" — when \"le\" comes before \"lo/la,\" it becomes \"se\": le + lo → se lo." },
  { target: "La habitación me gustó mucho.", english: "I really liked the room." },
  { target: "El guía nos lo explicó todo.", english: "The guide explained everything to us." },
  { target: "Te lo recomiendo, el hotel es genial.", english: "I recommend it to you, the hotel is great." },
  { target: "Me lo pasé muy bien en Barcelona.", english: "I had a great time in Barcelona." },
  { target: "Nos las arreglamos sin hablar español.", english: "We managed without speaking Spanish." },
  { target: "Les pedí indicaciones a unos locales.", english: "I asked some locals for directions." },
  { target: "Me la enseñó desde la terraza.", english: "She showed it to me from the terrace." },

  // Por vs para in travel
  { target: "Salimos para el aeropuerto a las cinco.", english: "We left for the airport at five.", grammar: "\"Para\" indicates destination: we left heading toward the airport." },
  { target: "Viajamos por toda la costa.", english: "We traveled along the whole coast.", grammar: "\"Por\" for movement through/along a place." },
  { target: "Pagué treinta euros por la excursión.", english: "I paid thirty euros for the excursion.", grammar: "\"Por\" for exchange: money IN EXCHANGE FOR a service." },
  { target: "Compré un regalo para el guía.", english: "I bought a gift for the guide." },
  { target: "Pasamos por el centro de la ciudad.", english: "We passed through the city center." },
  { target: "Para mí, lo mejor fue la comida.", english: "For me, the best part was the food." },
  { target: "Caminamos por la orilla del río.", english: "We walked along the riverbank." },
  { target: "Esto es para llevar.", english: "This is to go.", grammar: "\"Para llevar\" = for taking away. Standard phrase for takeout food." },

  // Mixed A2
  { target: "El vuelo fue cancelado por la tormenta.", english: "The flight was canceled because of the storm.", grammar: "\"Por\" for cause/reason: because of the storm." },
  { target: "Nos mudamos a un hotel mejor.", english: "We moved to a better hotel." },
  { target: "Me tocó el asiento del medio.", english: "I got the middle seat.", grammar: "\"Tocar\" used impersonally: \"me tocó\" = it was my turn/I ended up with." },
  { target: "El taxista nos cobró de más.", english: "The taxi driver overcharged us." },
  { target: "Me hice amigo de otros viajeros.", english: "I became friends with other travelers." },
  { target: "Nos levantamos a las seis para coger el autobús.", english: "We got up at six to catch the bus." },
  { target: "El hotel estaba decorado para Navidad.", english: "The hotel was decorated for Christmas." },
  { target: "Pasamos por la aduana sin problemas.", english: "We went through customs without problems." },
  { target: "El piloto anunció turbulencias.", english: "The pilot announced turbulence." },
  { target: "Hicimos las maletas la noche anterior.", english: "We packed our bags the night before." },
  { target: "Busqué mi equipaje por toda la cinta.", english: "I looked for my luggage all along the belt." },
  { target: "El hostal estaba lleno y fuimos a otro.", english: "The hostel was full and we went to another one." },
  { target: "Me acosté tarde porque salimos de fiesta.", english: "I went to bed late because we went out partying." },
  { target: "Nos encontramos con otros turistas españoles.", english: "We ran into other Spanish tourists." },
  { target: "Le pregunté al camarero por el wifi.", english: "I asked the waiter about the wifi." },
  { target: "Fuimos al mercado y compramos fruta.", english: "We went to the market and bought fruit." },
  { target: "Cambié euros por pesos en el aeropuerto.", english: "I exchanged euros for pesos at the airport.", grammar: "\"Por\" for exchange: swapping one currency for another." },
  { target: "Nos sentamos en la terraza para cenar.", english: "We sat on the terrace to have dinner." },
  { target: "El conserje me recomendó un restaurante.", english: "The concierge recommended a restaurant to me." },
  { target: "Volví al hotel caminando.", english: "I walked back to the hotel." },
  { target: "Nos perdimos intentando encontrar el restaurante.", english: "We got lost trying to find the restaurant." },
  { target: "El barco salió del puerto a las diez.", english: "The boat left the port at ten." },
  { target: "Alquilé una bicicleta para recorrer la isla.", english: "I rented a bicycle to explore the island." },

  // More A2 — additional past tense, reflexive, por/para travel
  { target: "Me duché y bajé a desayunar.", english: "I showered and went down to have breakfast." },
  { target: "El tren se averió a mitad de camino.", english: "The train broke down halfway." },
  { target: "Reservamos una visita guiada por internet.", english: "We booked a guided tour online." },
  { target: "Me quedé dormido en el autobús.", english: "I fell asleep on the bus.", grammar: "\"Quedarse dormido\" — reflexive construction meaning to fall asleep (unintentionally)." },
  { target: "El taxista nos cobró por persona.", english: "The taxi driver charged us per person." },
  { target: "Nos alojamos en una casa rural.", english: "We stayed in a rural house." },
  { target: "Me compré un sombrero para el sol.", english: "I bought myself a sun hat.", grammar: "\"Me compré\" — the reflexive here adds emphasis: I bought FOR MYSELF." },
  { target: "Hicimos escala en Lisboa.", english: "We had a layover in Lisbon." },
  { target: "El guía nos llevó por las calles más bonitas.", english: "The guide took us through the prettiest streets." },
  { target: "Cenamos en un chiringuito en la playa.", english: "We had dinner at a beach bar." },
  { target: "Me olvidé de confirmar la reserva.", english: "I forgot to confirm the reservation." },
  { target: "Salimos del hotel a las siete de la mañana.", english: "We left the hotel at seven in the morning." },
  { target: "Le pedimos la cuenta al camarero.", english: "We asked the waiter for the check." },
  { target: "Viajamos en primera clase por primera vez.", english: "We traveled in first class for the first time." },
  { target: "Me caí en una calle mojada.", english: "I fell on a wet street." },
  { target: "Nos bañamos en una cala escondida.", english: "We swam in a hidden cove." },
  { target: "Tardamos dos horas en llegar al pueblo.", english: "It took us two hours to get to the town." },
  { target: "Nos hicimos una foto con la torre de fondo.", english: "We took a photo with the tower in the background." },
  { target: "El hotel estaba rodeado de montañas.", english: "The hotel was surrounded by mountains." },
  { target: "Me corté el pelo en una peluquería local.", english: "I got a haircut at a local barber shop." },
  { target: "Llamamos al hotel para confirmar la hora.", english: "We called the hotel to confirm the time." },
  { target: "El vuelo iba lleno y no pudimos sentarnos juntos.", english: "The flight was full and we couldn't sit together." },
  { target: "Comimos en un restaurante que encontramos por casualidad.", english: "We ate at a restaurant we found by chance." },
  { target: "Nos despedimos del guía al final del tour.", english: "We said goodbye to the guide at the end of the tour." },
  { target: "Me puse crema solar antes de salir.", english: "I put on sunscreen before going out." },
  { target: "La aduana nos hizo abrir todas las maletas.", english: "Customs made us open all the suitcases." },
  { target: "Dormimos en un albergue juvenil.", english: "We slept in a youth hostel." },
  { target: "Me acordé de traer el cargador del teléfono.", english: "I remembered to bring the phone charger." },
  { target: "Compramos billetes para el espectáculo.", english: "We bought tickets for the show." },
  { target: "Nos subimos al teleférico para ver las vistas.", english: "We took the cable car to see the views." },
  { target: "Pedí un plato sin gluten y lo prepararon enseguida.", english: "I ordered a gluten-free dish and they prepared it right away." },
  { target: "Me robaron la cartera en el metro.", english: "My wallet was stolen on the metro." },
];

// ─────────────────────────────────────────────────────────────────────
// B1 CARDS (~130): Subjunctive, future, conditional, commands, relative clauses
// ─────────────────────────────────────────────────────────────────────
const B1_CARDS = [
  // Subjunctive in travel
  { target: "Espero que el vuelo no se retrase.", english: "I hope the flight isn't delayed.", grammar: "\"Espero que\" triggers subjunctive. \"Se retrase\" is the present subjunctive of \"retrasarse.\"" },
  { target: "Ojalá encontremos un buen restaurante.", english: "I hope we find a good restaurant.", grammar: "\"Ojalá\" always triggers subjunctive. Expresses a wish or hope." },
  { target: "No creo que haya habitaciones disponibles.", english: "I don't think there are rooms available.", grammar: "\"No creo que\" triggers subjunctive because it expresses doubt. \"Haya\" is the subjunctive of \"haber.\"" },
  { target: "Es importante que lleguemos temprano al aeropuerto.", english: "It's important that we arrive early at the airport." },
  { target: "Quiero que me cambien de habitación.", english: "I want them to change my room." },
  { target: "Dudo que el tren llegue a tiempo.", english: "I doubt the train will arrive on time." },
  { target: "Es posible que llueva durante la excursión.", english: "It's possible that it will rain during the excursion." },
  { target: "No creo que acepten tarjeta en ese mercado.", english: "I don't think they accept card at that market." },
  { target: "Espero que la comida esté incluida en el tour.", english: "I hope the food is included in the tour." },
  { target: "Necesito un hotel que tenga aparcamiento.", english: "I need a hotel that has parking.", grammar: "Subjunctive in relative clauses: \"que tenga\" because the hotel is hypothetical/unknown. If the hotel were known, you'd use indicative." },
  { target: "Busco un vuelo que salga por la mañana.", english: "I'm looking for a flight that leaves in the morning." },
  { target: "No hay ningún taxi que pueda llevarme ahora.", english: "There's no taxi that can take me now." },
  { target: "Quiero un guía que hable inglés.", english: "I want a guide who speaks English." },
  { target: "Es una lástima que el museo esté cerrado hoy.", english: "It's a shame that the museum is closed today." },
  { target: "Me alegra que hayamos llegado a tiempo.", english: "I'm glad we arrived on time." },

  // Future tense in travel
  { target: "Mañana visitaremos la Alhambra.", english: "Tomorrow we will visit the Alhambra." },
  { target: "El avión llegará a las cuatro de la tarde.", english: "The plane will arrive at four in the afternoon." },
  { target: "¿Cuánto tiempo estaremos en Barcelona?", english: "How long will we be in Barcelona?" },
  { target: "Reservaré el hotel esta noche.", english: "I will book the hotel tonight." },
  { target: "El guía nos recogerá en la puerta del hotel.", english: "The guide will pick us up at the hotel door." },
  { target: "Saldremos temprano para evitar el tráfico.", english: "We will leave early to avoid traffic.", grammar: "\"Saldremos\" — irregular future of \"salir\": saldré, saldrás, saldrá, saldremos, saldréis, saldrán." },
  { target: "¿A qué hora volveremos al hotel?", english: "What time will we return to the hotel?" },
  { target: "Habrá tiempo libre por la tarde.", english: "There will be free time in the afternoon.", grammar: "\"Habrá\" is the future of \"haber\" (there is/are). Irregular: habrá, not haberá." },
  { target: "Tendremos que madrugar para coger el vuelo.", english: "We will have to get up early to catch the flight.", grammar: "\"Tendremos\" — irregular future of \"tener\": tendré, tendrás, tendrá, tendremos, tendréis, tendrán." },
  { target: "El viaje durará unas cinco horas.", english: "The trip will last about five hours." },
  { target: "Podremos ver el atardecer desde la terraza.", english: "We will be able to see the sunset from the terrace." },
  { target: "Necesitaré un adaptador de enchufe.", english: "I will need a plug adapter." },

  // Conditional in travel
  { target: "Me gustaría reservar una mesa para las ocho.", english: "I would like to reserve a table for eight.", grammar: "\"Gustaría\" is the conditional of \"gustar.\" \"Me gustaría\" is the polite way to say \"I would like.\"" },
  { target: "¿Podría darme un mapa de la ciudad?", english: "Could you give me a map of the city?" },
  { target: "Sería mejor tomar el tren en vez del autobús.", english: "It would be better to take the train instead of the bus." },
  { target: "¿Le importaría hablar más despacio?", english: "Would you mind speaking more slowly?" },
  { target: "Me encantaría visitar las islas Canarias.", english: "I would love to visit the Canary Islands." },
  { target: "¿Podríamos cambiar la fecha de la reserva?", english: "Could we change the reservation date?" },
  { target: "Preferiría una habitación más tranquila.", english: "I would prefer a quieter room." },
  { target: "¿Sería posible salir más temprano?", english: "Would it be possible to leave earlier?" },
  { target: "Yo en tu lugar iría al sur.", english: "If I were you, I would go south." },
  { target: "Deberíamos probar la comida callejera.", english: "We should try the street food." },
  { target: "¿Tendría una habitación con vistas al mar?", english: "Would you have a room with a sea view?" },
  { target: "Valdría la pena visitar ese pueblo.", english: "It would be worth visiting that town." },

  // Commands in travel
  { target: "No te olvides el pasaporte.", english: "Don't forget the passport.", grammar: "Negative tú commands use subjunctive: \"no olvides.\" With reflexive: \"no te olvides.\"" },
  { target: "Lleva protector solar, hace mucho sol.", english: "Bring sunscreen, it's very sunny." },
  { target: "Pregunta en recepción por los horarios.", english: "Ask at the reception about the schedules." },
  { target: "No comas en esos puestos, son caros.", english: "Don't eat at those stalls, they're expensive." },
  { target: "Reserva con antelación, se llena rápido.", english: "Book in advance, it fills up quickly." },
  { target: "Confirme su vuelo veinticuatro horas antes.", english: "Confirm your flight twenty-four hours in advance.", grammar: "Formal command (usted): \"confirme\" — subjunctive form used as imperative." },
  { target: "No dejes las maletas sin vigilar.", english: "Don't leave the suitcases unattended." },
  { target: "Pide el menú del día, es más barato.", english: "Order the set menu, it's cheaper." },
  { target: "No cambies dinero en el aeropuerto.", english: "Don't exchange money at the airport." },
  { target: "Llega con dos horas de antelación.", english: "Arrive two hours early." },
  { target: "Prueba las croquetas, están buenísimas.", english: "Try the croquetas, they're really good." },

  // Relative clauses in travel
  { target: "El hotel donde nos quedamos era increíble.", english: "The hotel where we stayed was incredible.", grammar: "\"Donde\" introduces a relative clause of place. \"El hotel donde...\" = the hotel where..." },
  { target: "La playa que más me gustó fue la del norte.", english: "The beach I liked the most was the one in the north." },
  { target: "El restaurante al que fuimos tenía buenas vistas.", english: "The restaurant we went to had good views.", grammar: "\"Al que\" = to which. When the relative pronoun is preceded by a preposition: a + el que = al que." },
  { target: "La ciudad en la que vivimos un mes es preciosa.", english: "The city where we lived for a month is beautiful." },
  { target: "El pueblo que visitamos ayer no tenía turistas.", english: "The town we visited yesterday had no tourists." },
  { target: "La persona que nos atendió fue muy amable.", english: "The person who served us was very kind." },
  { target: "La excursión que hicimos al volcán fue agotadora.", english: "The excursion we did to the volcano was exhausting." },
  { target: "El sitio del que te hablé está cerrado.", english: "The place I told you about is closed." },
  { target: "Los turistas con los que viajamos eran alemanes.", english: "The tourists we traveled with were German." },

  // Mixed B1 travel
  { target: "Cuando llegues al hotel, avísame.", english: "When you arrive at the hotel, let me know.", grammar: "\"Cuando\" + future action uses subjunctive: \"cuando llegues\" (not \"cuando llegas\")." },
  { target: "Aunque llueva, iremos a la playa.", english: "Even if it rains, we'll go to the beach." },
  { target: "Antes de que salgas, revisa tu equipaje.", english: "Before you leave, check your luggage.", grammar: "\"Antes de que\" always triggers subjunctive." },
  { target: "Si tenemos tiempo, visitaremos el mercado.", english: "If we have time, we'll visit the market." },
  { target: "Tan pronto como aterricemos, te llamo.", english: "As soon as we land, I'll call you." },
  { target: "No iremos a menos que mejore el tiempo.", english: "We won't go unless the weather improves." },
  { target: "Mientras estemos en Sevilla, probaremos el gazpacho.", english: "While we're in Seville, we'll try the gazpacho." },
  { target: "Después de que cierre el museo, iremos a cenar.", english: "After the museum closes, we'll go to dinner." },
  { target: "Es necesario que confirmemos la reserva.", english: "It's necessary that we confirm the reservation." },
  { target: "Si hubiera tren directo, llegaríamos antes.", english: "If there were a direct train, we would arrive sooner." },
  { target: "Viajaremos en cuanto consigamos los billetes.", english: "We'll travel as soon as we get the tickets." },
  { target: "Hace falta que reservemos ya porque se agotan.", english: "We need to book now because they sell out." },
  { target: "Me han dicho que ese barrio es muy seguro.", english: "They've told me that neighborhood is very safe." },
  { target: "Llevo viajando por España tres semanas.", english: "I've been traveling around Spain for three weeks.", grammar: "\"Llevar\" + gerund expresses duration: \"I've been doing something for X time.\"" },
  { target: "Todavía no hemos decidido adónde ir mañana.", english: "We still haven't decided where to go tomorrow." },
  { target: "¿Sabes si el museo abre los lunes?", english: "Do you know if the museum opens on Mondays?" },
  { target: "El conserje sugirió que fuéramos al castillo.", english: "The concierge suggested we go to the castle." },
  { target: "Si hace buen tiempo, haremos senderismo.", english: "If the weather is good, we'll go hiking." },
  { target: "Hemos recorrido toda la costa en una semana.", english: "We've traveled the whole coast in one week." },
  { target: "Me dijeron que el mejor restaurante está en la plaza.", english: "They told me the best restaurant is in the square." },

  // More B1 — additional subjunctive, future, conditional, commands
  { target: "Ojalá no haga demasiado calor mañana.", english: "I hope it's not too hot tomorrow." },
  { target: "Es probable que el museo esté lleno a esa hora.", english: "It's likely that the museum will be full at that time." },
  { target: "No creo que encontremos aparcamiento en el centro.", english: "I don't think we'll find parking in the center." },
  { target: "Quiero que nos sentemos cerca de la ventana.", english: "I want us to sit near the window." },
  { target: "Será mejor que lleves chaqueta por si refresca.", english: "You'd better bring a jacket in case it gets cool." },
  { target: "Si reservamos ahora, nos saldrá más barato.", english: "If we book now, it will be cheaper for us.", grammar: "\"Salir\" used impersonally: \"nos saldrá\" = it will come out to / it will cost us." },
  { target: "El año que viene viajaremos a México.", english: "Next year we will travel to Mexico." },
  { target: "¿Cuándo sabremos si el vuelo ha sido cancelado?", english: "When will we know if the flight has been canceled?" },
  { target: "Podríamos alquilar un apartamento en vez de un hotel.", english: "We could rent an apartment instead of a hotel." },
  { target: "No toques las obras de arte del museo.", english: "Don't touch the artwork in the museum." },
  { target: "Venid con nosotros a la excursión.", english: "Come with us on the excursion.", grammar: "\"Venid\" — affirmative vosotros command. Used in Spain for informal plural." },
  { target: "No pierdas el billete, lo necesitas para volver.", english: "Don't lose the ticket, you need it to return." },
  { target: "El vuelo que cogimos hacía escala en Roma.", english: "The flight we took had a layover in Rome." },
  { target: "La isla a la que queremos ir está muy lejos.", english: "The island we want to go to is very far." },
  { target: "Cuando lleguemos al hotel, descansaremos un rato.", english: "When we arrive at the hotel, we'll rest for a while." },
  { target: "Si no reservamos ya, nos quedaremos sin sitio.", english: "If we don't book now, we'll run out of spots." },
  { target: "Antes de que anochezca, visitemos el mirador.", english: "Before it gets dark, let's visit the viewpoint." },
  { target: "Me recomendaron que probara el marisco fresco.", english: "They recommended that I try the fresh seafood." },
  { target: "Es mejor que compremos los billetes con antelación.", english: "It's better that we buy the tickets in advance." },
  { target: "Habré terminado de hacer las maletas para las diez.", english: "I will have finished packing by ten.", grammar: "Future perfect: \"habré terminado\" = I will have finished. Expresses completion before a future point." },
  { target: "Si pudiéramos, nos quedaríamos una semana más.", english: "If we could, we would stay one more week." },
  { target: "Sugiero que cenemos en el restaurante del puerto.", english: "I suggest we have dinner at the port restaurant." },
  { target: "No vayáis por esa calle de noche.", english: "Don't go down that street at night." },
  { target: "Deberías probar el vino de la región.", english: "You should try the wine from the region." },
  { target: "Ojalá hubiera más tiempo para visitar todo.", english: "I wish there were more time to visit everything." },
  { target: "El recepcionista nos pidió que dejáramos la habitación antes de las once.", english: "The receptionist asked us to leave the room before eleven." },
  { target: "Si el tren llega tarde, cogeremos un taxi.", english: "If the train arrives late, we'll take a taxi." },
  { target: "La agencia nos dijo que las excursiones se llenarían pronto.", english: "The agency told us the excursions would fill up soon." },
  { target: "Necesitamos un coche que tenga GPS.", english: "We need a car that has GPS." },
  { target: "Habremos visitado cinco ciudades para cuando termine el viaje.", english: "We will have visited five cities by the time the trip ends." },
  { target: "Si no te importa, me gustaría ir a la playa.", english: "If you don't mind, I'd like to go to the beach." },
  { target: "¿Podrías decirme cómo llegar a la estación?", english: "Could you tell me how to get to the station?" },
  { target: "Es fundamental que llevemos agua si vamos a hacer senderismo.", english: "It's essential that we bring water if we're going hiking." },
  { target: "Aunque el hotel esté lejos del centro, merece la pena.", english: "Even if the hotel is far from the center, it's worth it." },
  { target: "Siempre que viajamos en avión, reservamos con antelación.", english: "Whenever we fly, we book in advance." },
  { target: "El tour incluirá una visita a la bodega.", english: "The tour will include a visit to the winery." },
  { target: "Deberías llevar zapatos cómodos para la excursión.", english: "You should wear comfortable shoes for the excursion." },
  { target: "Me han contado que ese pueblo tiene unas playas preciosas.", english: "I've been told that town has beautiful beaches." },
];

// ─────────────────────────────────────────────────────────────────────
// B2 CARDS (~130): Imperfect subjunctive, conditionals II/III, passive, advanced connectors
// ─────────────────────────────────────────────────────────────────────
const B2_CARDS = [
  // Imperfect subjunctive
  { target: "Si hubiéramos reservado antes, habría sido más barato.", english: "If we had booked earlier, it would have been cheaper.", grammar: "Conditional III (past unreal): si + pluperfect subjunctive + conditional perfect. Expresses a hypothetical past that didn't happen." },
  { target: "Me habría gustado que nos quedáramos más tiempo.", english: "I would have liked us to stay longer." },
  { target: "Si tuviera más vacaciones, viajaría por toda Sudamérica.", english: "If I had more vacation, I would travel all over South America.", grammar: "Conditional II (present unreal): si + imperfect subjunctive + conditional. A hypothetical that's unlikely but possible." },
  { target: "Ojalá hubiéramos podido ver las ruinas mayas.", english: "I wish we could have seen the Mayan ruins." },
  { target: "Si el hotel fuera más céntrico, no necesitaríamos taxi.", english: "If the hotel were more central, we wouldn't need a taxi." },
  { target: "No pensé que el viaje fuera a ser tan agotador.", english: "I didn't think the trip was going to be so exhausting." },
  { target: "Si pudiera elegir, me quedaría en un pueblo pequeño.", english: "If I could choose, I would stay in a small town." },
  { target: "Habría preferido que nos alojáramos en un apartamento.", english: "I would have preferred that we stayed in an apartment." },
  { target: "Si hubiera sabido que estaba cerrado, no habríamos ido.", english: "If I had known it was closed, we wouldn't have gone." },
  { target: "Ojalá existiera un vuelo directo a esa isla.", english: "I wish there were a direct flight to that island." },
  { target: "Si el tren no se hubiera retrasado, habríamos llegado a tiempo.", english: "If the train hadn't been delayed, we would have arrived on time." },
  { target: "Me encantaría que organizaran más tours nocturnos.", english: "I would love it if they organized more nighttime tours." },
  { target: "Si no fuera por la barrera del idioma, habría sido más fácil.", english: "If it weren't for the language barrier, it would have been easier." },
  { target: "Habría sido mejor que hubiéramos alquilado un coche.", english: "It would have been better if we had rented a car." },
  { target: "Si viajara solo, tendría más flexibilidad.", english: "If I traveled alone, I would have more flexibility." },

  // Passive voice in travel
  { target: "El vuelo fue cancelado debido a la niebla.", english: "The flight was canceled due to the fog.", grammar: "Passive with \"ser\" + past participle: \"fue cancelado.\" Used for specific completed actions." },
  { target: "La catedral fue construida en el siglo trece.", english: "The cathedral was built in the thirteenth century." },
  { target: "Los billetes pueden ser comprados en línea.", english: "The tickets can be purchased online." },
  { target: "La reserva fue confirmada por correo electrónico.", english: "The reservation was confirmed by email." },
  { target: "El equipaje fue revisado en la aduana.", english: "The luggage was inspected at customs." },
  { target: "Se recomienda reservar con antelación.", english: "It is recommended to book in advance.", grammar: "Passive \"se\" construction: \"se recomienda\" = it is recommended. Very common in formal/impersonal travel language." },
  { target: "Se prohíbe fumar en todo el aeropuerto.", english: "Smoking is prohibited throughout the airport." },
  { target: "La excursión fue organizada por una agencia local.", english: "The excursion was organized by a local agency." },
  { target: "Se esperan retrasos en todos los vuelos.", english: "Delays are expected on all flights." },
  { target: "El monumento fue declarado Patrimonio de la Humanidad.", english: "The monument was declared a World Heritage Site." },

  // Advanced connectors
  { target: "A pesar de la lluvia, visitamos todos los monumentos.", english: "Despite the rain, we visited all the monuments.", grammar: "\"A pesar de\" (despite/in spite of) — an advanced concessive connector." },
  { target: "Dado que el vuelo se canceló, tuvimos que buscar otro.", english: "Given that the flight was canceled, we had to find another one." },
  { target: "No obstante las malas críticas, el hotel estaba bien.", english: "Notwithstanding the bad reviews, the hotel was fine.", grammar: "\"No obstante\" (nevertheless/notwithstanding) — formal concessive connector." },
  { target: "Puesto que no había metro, tomamos un taxi.", english: "Since there was no metro, we took a taxi." },
  { target: "En cuanto a la gastronomía, fue lo mejor del viaje.", english: "As for the cuisine, it was the best part of the trip." },
  { target: "Si bien el hotel era caro, la ubicación lo compensaba.", english: "Although the hotel was expensive, the location made up for it.", grammar: "\"Si bien\" (although/even though) — a formal concessive that introduces a contrasting idea." },
  { target: "Por más que intentamos, no conseguimos entradas.", english: "No matter how much we tried, we couldn't get tickets." },
  { target: "A medida que avanzaba el viaje, nos sentíamos más cómodos.", english: "As the trip progressed, we felt more comfortable." },
  { target: "Tanto si llueve como si hace sol, iremos de excursión.", english: "Whether it rains or shines, we'll go on the excursion." },
  { target: "En lugar de ir en avión, decidimos ir en tren.", english: "Instead of flying, we decided to go by train." },
  { target: "A diferencia de otros turistas, preferimos la comida local.", english: "Unlike other tourists, we prefer local food." },
  { target: "Con respecto al alojamiento, fue una experiencia inolvidable.", english: "Regarding the accommodation, it was an unforgettable experience." },
  { target: "No solo visitamos la capital, sino también el interior.", english: "We not only visited the capital, but also the interior.", grammar: "\"No solo... sino también\" = not only... but also. Correlative connector for adding information." },

  // Complex travel scenarios
  { target: "De haber tenido más tiempo, habríamos explorado la selva.", english: "Had we had more time, we would have explored the jungle.", grammar: "\"De haber + participle\" is a formal alternative to \"si hubiéramos + participle\" for past unreal conditions." },
  { target: "El viaje habría sido imposible sin la ayuda de los lugareños.", english: "The trip would have been impossible without the locals' help." },
  { target: "Por mucho que investigue, no encuentro vuelos baratos.", english: "No matter how much I research, I can't find cheap flights." },
  { target: "Cuanto más viajo, más aprecio la cultura española.", english: "The more I travel, the more I appreciate Spanish culture.", grammar: "\"Cuanto más... más\" = the more... the more. Comparative correlative construction." },
  { target: "Según nos acercábamos a la costa, el paisaje cambiaba.", english: "As we got closer to the coast, the landscape changed." },
  { target: "El hecho de que hablara español facilitó mucho el viaje.", english: "The fact that I spoke Spanish made the trip much easier." },
  { target: "No fue hasta que llegamos que nos dimos cuenta del error.", english: "It wasn't until we arrived that we realized the mistake." },
  { target: "A no ser que cancelemos ahora, perderemos el depósito.", english: "Unless we cancel now, we'll lose the deposit." },
  { target: "Siempre que viajo a un lugar nuevo, me informo antes.", english: "Whenever I travel to a new place, I do research beforehand." },
  { target: "El que no hayamos tenido problemas fue pura suerte.", english: "The fact that we didn't have problems was pure luck." },

  // Cultural & nuanced travel
  { target: "Los horarios españoles me resultaron desconcertantes al principio.", english: "Spanish schedules were confusing to me at first." },
  { target: "Habiendo viajado por toda Europa, puedo decir que España es única.", english: "Having traveled all over Europe, I can say that Spain is unique.", grammar: "\"Habiendo + participle\" — the compound gerund, used to express a completed action before the main clause." },
  { target: "Lo que más me impresionó fue la arquitectura modernista.", english: "What impressed me the most was the modernist architecture." },
  { target: "A pesar de no hablar el idioma, logramos comunicarnos.", english: "Despite not speaking the language, we managed to communicate." },
  { target: "Conviene que sepas algunas frases básicas antes de viajar.", english: "It's advisable that you know some basic phrases before traveling." },
  { target: "El turismo masivo ha hecho que muchos pueblos pierdan su encanto.", english: "Mass tourism has caused many towns to lose their charm." },
  { target: "Resulta que el monasterio solo se puede visitar con cita previa.", english: "It turns out the monastery can only be visited by appointment." },
  { target: "Si no fuera por los turistas, esa zona estaría desierta.", english: "If it weren't for the tourists, that area would be deserted." },
  { target: "Lejos de ser una decepción, el viaje superó todas mis expectativas.", english: "Far from being a disappointment, the trip exceeded all my expectations." },
  { target: "El guía insistió en que visitáramos la bodega subterránea.", english: "The guide insisted that we visit the underground winery." },

  // Travel planning & logistics (B2)
  { target: "Habría que tener en cuenta la diferencia horaria.", english: "One should take the time difference into account." },
  { target: "Es imprescindible que contrates un seguro de viaje.", english: "It's essential that you get travel insurance." },
  { target: "En caso de que pierdas el pasaporte, acude al consulado.", english: "In case you lose your passport, go to the consulate.", grammar: "\"En caso de que\" always takes subjunctive — it introduces a hypothetical/future possibility." },
  { target: "A fin de ahorrar, decidimos viajar en temporada baja.", english: "In order to save money, we decided to travel in the off-season.", grammar: "\"A fin de\" (in order to) — formal purpose connector, equivalent to \"para\" but more literary." },
  { target: "Salvo que surja un imprevisto, llegaremos el jueves.", english: "Unless something unexpected comes up, we'll arrive on Thursday." },
  { target: "El visado fue tramitado a través de la embajada.", english: "The visa was processed through the embassy." },
  { target: "Convendría que reserváramos los vuelos cuanto antes.", english: "It would be advisable for us to book the flights as soon as possible." },
  { target: "En lo que respecta al presupuesto, nos ajustamos bastante bien.", english: "As far as the budget is concerned, we managed quite well." },
  { target: "El seguro cubre cualquier gasto médico en el extranjero.", english: "The insurance covers any medical expenses abroad." },
  { target: "Sería conveniente que lleváramos algo de efectivo.", english: "It would be convenient if we brought some cash." },

  // Reflective travel narratives (B2)
  { target: "Nunca habría imaginado que un pueblo tan pequeño tuviera tanta vida.", english: "I never would have imagined that such a small town had so much life." },
  { target: "De todos los sitios que hemos visitado, este es el que más me ha marcado.", english: "Of all the places we've visited, this is the one that has marked me the most." },
  { target: "Por más preparado que estés, siempre habrá imprevistos.", english: "No matter how prepared you are, there will always be unexpected things." },
  { target: "Lo más gratificante de viajar es salir de tu zona de confort.", english: "The most rewarding thing about traveling is leaving your comfort zone." },
  { target: "A medida que ibas conociendo el barrio, te sentías más como en casa.", english: "As you got to know the neighborhood, you felt more at home." },
  { target: "Si me hubieran preguntado antes, habría dicho que no me interesaba.", english: "If they had asked me before, I would have said I wasn't interested." },
  { target: "Cabe destacar que la hospitalidad fue lo mejor del viaje.", english: "It's worth noting that the hospitality was the best part of the trip.", grammar: "\"Cabe destacar que\" (it's worth noting that) — formal connector used in written/spoken narratives." },
  { target: "Cada vez que vuelvo a ese lugar, descubro algo nuevo.", english: "Every time I go back to that place, I discover something new." },
  { target: "El hecho de haber viajado solo me hizo más independiente.", english: "The fact of having traveled alone made me more independent." },
  { target: "No hay nada como perderse por las calles de una ciudad desconocida.", english: "There's nothing like getting lost in the streets of an unknown city." },
  { target: "Si no hubiera sido por aquella tormenta, no habríamos descubierto esa cueva.", english: "If it hadn't been for that storm, we wouldn't have discovered that cave." },
  { target: "Me arrepiento de no haber visitado el norte cuando tuve la oportunidad.", english: "I regret not having visited the north when I had the chance." },
  { target: "A pesar de todos los contratiempos, repetiría el viaje sin dudarlo.", english: "Despite all the setbacks, I would repeat the trip without hesitation." },
  { target: "Lo que empezó como unas vacaciones se convirtió en una aventura.", english: "What started as a vacation turned into an adventure." },
  { target: "Si alguna vez tienes la oportunidad, no te lo pienses dos veces.", english: "If you ever have the opportunity, don't think twice." },
  { target: "Fue tal la impresión que nos causó que decidimos quedarnos una semana más.", english: "The impression it made on us was such that we decided to stay one more week.", grammar: "\"Tal... que\" (such... that) — consecutive construction expressing result/consequence." },
  { target: "Por poco perdemos el avión de vuelta.", english: "We almost missed the return flight.", grammar: "\"Por poco\" + present tense = almost (did something). A near-miss construction." },
  { target: "Habríamos disfrutado más de no haber estado tan cansados.", english: "We would have enjoyed it more had we not been so tired." },
  { target: "Todo lo que nos habían contado sobre ese lugar era cierto.", english: "Everything they had told us about that place was true." },
  { target: "Nada más llegar, supimos que habíamos elegido bien.", english: "As soon as we arrived, we knew we had chosen well.", grammar: "\"Nada más\" + infinitive = as soon as. A concise way to express immediacy." },

  // More B2 — additional complex travel
  { target: "Aun cuando el tiempo no acompañó, la experiencia fue memorable.", english: "Even though the weather didn't cooperate, the experience was memorable." },
  { target: "De no ser por la huelga de pilotos, habríamos viajado la semana pasada.", english: "Were it not for the pilots' strike, we would have traveled last week." },
  { target: "Cuanto antes reservemos, mejores asientos conseguiremos.", english: "The sooner we book, the better seats we'll get." },
  { target: "Si bien el vuelo fue largo, valió la pena por el destino.", english: "Although the flight was long, it was worth it for the destination." },
  { target: "En el supuesto de que cancelen el vuelo, nos reembolsarán.", english: "In the event that they cancel the flight, they will reimburse us.", grammar: "\"En el supuesto de que\" (in the event that) — formal conditional connector, always takes subjunctive." },
  { target: "Ni siquiera habiendo reservado con meses de antelación conseguimos mesa.", english: "Not even having booked months in advance did we get a table." },
  { target: "Siendo como es temporada alta, los precios están por las nubes.", english: "Being peak season as it is, the prices are sky-high." },
  { target: "Con tal de que el hotel esté limpio, no me importa que sea pequeño.", english: "As long as the hotel is clean, I don't mind it being small.", grammar: "\"Con tal de que\" (as long as / provided that) — always triggers subjunctive." },
  { target: "A juzgar por las reseñas, ese restaurante es excelente.", english: "Judging by the reviews, that restaurant is excellent." },
  { target: "El viaje en sí no fue caro, pero el alojamiento disparó el presupuesto.", english: "The trip itself wasn't expensive, but the accommodation blew the budget." },
  { target: "Si hubiéramos cogido el avión de las seis, ya estaríamos allí.", english: "If we had taken the six o'clock plane, we would already be there.", grammar: "Mixed conditional: past unreal condition (pluperfect subjunctive) + present unreal result (conditional). \"Already would be\" refers to now." },
  { target: "A raíz de aquella experiencia, siempre contrato seguro de viaje.", english: "As a result of that experience, I always get travel insurance." },
  { target: "Por mucho que le insistí, el recepcionista se negó a devolverme el dinero.", english: "No matter how much I insisted, the receptionist refused to refund me." },
  { target: "Habida cuenta de la situación, decidimos acortar el viaje.", english: "Given the situation, we decided to shorten the trip.", grammar: "\"Habida cuenta de\" (given/considering) — very formal causal connector." },
  { target: "Es poco probable que encontremos vuelos a ese precio de nuevo.", english: "It's unlikely that we'll find flights at that price again." },
  { target: "Dicho esto, el viaje superó con creces mis expectativas.", english: "That said, the trip far exceeded my expectations." },
  { target: "En vista de que el ferry se canceló, alquilamos un barco privado.", english: "In view of the fact that the ferry was canceled, we rented a private boat." },
  { target: "Quienquiera que haya diseñado este itinerario hizo un trabajo increíble.", english: "Whoever designed this itinerary did an incredible job.", grammar: "\"Quienquiera que\" (whoever) + subjunctive. Always takes subjunctive because the person is unknown/unspecified." },
  { target: "A falta de transporte público, tuvimos que ir andando.", english: "For lack of public transport, we had to go on foot." },
  { target: "Si no llega a ser por ese mapa, nos habríamos perdido.", english: "If it hadn't been for that map, we would have gotten lost.", grammar: "\"Si no llega a ser por\" — colloquial alternative to \"si no hubiera sido por\" for past counterfactuals." },
  { target: "Al margen de las quejas sobre el hotel, el viaje fue perfecto.", english: "Apart from the complaints about the hotel, the trip was perfect." },
  { target: "Para cuando quisimos comprar las entradas, ya se habían agotado.", english: "By the time we wanted to buy the tickets, they had already sold out." },
  { target: "El que hayamos podido viajar con tan poco presupuesto fue todo un logro.", english: "The fact that we were able to travel on such a small budget was quite an achievement." },
  { target: "Se rumorea que van a abrir una nueva ruta aérea directa.", english: "It is rumored that they are going to open a new direct air route." },
  { target: "Cuantas más ciudades visitábamos, más difícil era elegir una favorita.", english: "The more cities we visited, the harder it was to choose a favorite." },
  { target: "Sin que nadie nos lo advirtiera, terminamos en una zona peligrosa.", english: "Without anyone warning us, we ended up in a dangerous area.", grammar: "\"Sin que\" (without) + subjunctive. Always triggers subjunctive." },
  { target: "Lo cierto es que viajar en temporada baja tiene muchas ventajas.", english: "The truth is that traveling in the off-season has many advantages." },
  { target: "No bien habíamos desembarcado cuando empezó a llover a cántaros.", english: "No sooner had we disembarked than it started pouring.", grammar: "\"No bien... cuando\" (no sooner... than) — literary construction expressing immediate succession." },
  { target: "Pese a las advertencias, decidimos aventurarnos por la selva.", english: "Despite the warnings, we decided to venture into the jungle." },
  { target: "Suponiendo que el tiempo mejore, podríamos hacer la ruta costera.", english: "Assuming the weather improves, we could do the coastal route." },
  { target: "Difícilmente habríamos encontrado un lugar más pintoresco.", english: "We would hardly have found a more picturesque place." },
  { target: "Sea como sea, el viaje nos cambió la perspectiva.", english: "Be that as it may, the trip changed our perspective.", grammar: "\"Sea como sea\" (be that as it may) — concessive expression with duplicated subjunctive." },
  { target: "En tanto que turistas, debemos respetar las costumbres locales.", english: "As tourists, we must respect local customs." },
  { target: "El haber conocido a gente local enriqueció enormemente la experiencia.", english: "Having met local people enormously enriched the experience." },
  { target: "A sabiendas de que llovería, decidimos ir igualmente.", english: "Knowing full well that it would rain, we decided to go anyway.", grammar: "\"A sabiendas de que\" (knowing full well that) — concessive expression implying deliberate awareness." },
  { target: "Más allá de los paisajes, lo que hace único a este destino es su gente.", english: "Beyond the landscapes, what makes this destination unique is its people." },
  { target: "De haber podido, nos habríamos quedado todo el verano.", english: "Had we been able to, we would have stayed the whole summer." },
  { target: "Si bien es cierto que la comida era cara, la calidad era excepcional.", english: "While it's true that the food was expensive, the quality was exceptional." },
  { target: "Independientemente de la época en que viajes, siempre habrá algo que ver.", english: "Regardless of the time of year you travel, there will always be something to see." },
  { target: "Quien no haya visitado esa región se está perdiendo algo extraordinario.", english: "Anyone who hasn't visited that region is missing out on something extraordinary." },
  { target: "Por mucho que planifiques, siempre surgirá algo inesperado.", english: "No matter how much you plan, something unexpected will always come up." },
];


// ─────────────────────────────────────────────────────────────────────
// MAIN SCRIPT
// ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('Reading deck...');
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
  console.log(`Current deck size: ${deck.length} cards`);

  // Build set of existing sentences (lowercased) for dedup
  const existingSet = new Set(deck.map(c => c.target.toLowerCase()));

  // Combine all new cards with their level labels
  const allNew = [
    ...A1_CARDS.map(c => ({ ...c, level: 'A1' })),
    ...A2_CARDS.map(c => ({ ...c, level: 'A2' })),
    ...B1_CARDS.map(c => ({ ...c, level: 'B1' })),
    ...B2_CARDS.map(c => ({ ...c, level: 'B2' })),
  ];

  console.log(`\nNew cards defined: ${allNew.length}`);
  console.log(`  A1: ${A1_CARDS.length}`);
  console.log(`  A2: ${A2_CARDS.length}`);
  console.log(`  B1: ${B1_CARDS.length}`);
  console.log(`  B2: ${B2_CARDS.length}`);

  // Dedup against existing deck AND within the new batch itself
  const seenInBatch = new Set();
  let dupes = 0;
  const deduped = [];

  for (const card of allNew) {
    const key = card.target.toLowerCase();
    if (existingSet.has(key) || seenInBatch.has(key)) {
      dupes++;
      console.log(`  SKIP duplicate: "${card.target}"`);
    } else {
      seenInBatch.add(key);
      deduped.push(card);
    }
  }

  console.log(`\nDuplicates skipped: ${dupes}`);
  console.log(`Cards to add: ${deduped.length}`);

  if (deduped.length === 0) {
    console.log('Nothing to add.');
    return;
  }

  // Find max existing ID
  const maxId = Math.max(...deck.map(c => c.id));
  console.log(`Max existing ID: ${maxId}`);

  // Build new card objects (field order matches existing deck: id, target, english, audio, grammar?, tags)
  const newCards = deduped.map((card, i) => {
    const obj = {
      id: maxId + 1 + i,
      target: card.target,
      english: card.english,
      audio: '',
    };
    if (card.grammar) {
      obj.grammar = card.grammar;
    }
    obj.tags = ['general', 'travel'];
    return obj;
  });

  // Append to deck
  const updatedDeck = [...deck, ...newCards];

  // Write back
  console.log(`\nWriting ${updatedDeck.length} total cards to deck...`);
  fs.writeFileSync(DECK_PATH, JSON.stringify(updatedDeck, null, 2) + '\n', 'utf-8');

  // Stats
  const withGrammar = newCards.filter(c => c.grammar).length;
  const grammarPct = ((withGrammar / newCards.length) * 100).toFixed(1);

  console.log('\n── STATS ──');
  console.log(`Cards added: ${newCards.length}`);
  console.log(`  A1: ${deduped.filter(c => c.level === 'A1').length}`);
  console.log(`  A2: ${deduped.filter(c => c.level === 'A2').length}`);
  console.log(`  B1: ${deduped.filter(c => c.level === 'B1').length}`);
  console.log(`  B2: ${deduped.filter(c => c.level === 'B2').length}`);
  console.log(`Cards with grammar notes: ${withGrammar} (${grammarPct}%)`);
  console.log(`New ID range: ${maxId + 1} - ${maxId + newCards.length}`);
  console.log(`New deck total: ${updatedDeck.length}`);
  console.log('\nDone!');
}

main();
