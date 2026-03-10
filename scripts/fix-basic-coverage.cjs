/**
 * fix-basic-coverage.cjs
 *
 * Ensures all essential A1 vocabulary exists in the deck across ALL goals
 * (general, travel, family, work). For general: strict coverage.
 * For specialized goals: ensure basics are present but be lenient on
 * domain-specific gaps.
 *
 * 1. Audits coverage of ~150 essential words across all goals
 * 2. Adds "general" tag to any beginner card missing it
 * 3. Adds missing basic sentences to the deck
 * 4. Reports remaining gaps per goal
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));
let nextId = Math.max(...deck.map(c => c.id)) + 1;
let added = 0;
let tagged = 0;

function addCard(c) {
  const key = c.target.toLowerCase().trim();
  if (existingTargets.has(key)) return false;
  existingTargets.add(key);
  deck.push({
    id: nextId++,
    target: c.target,
    english: c.english,
    audio: '',
    tags: c.tags || ['general'],
    grammarNode: c.grammarNode || 'node-01',
    ...(c.grammar ? { grammar: c.grammar } : {}),
  });
  added++;
  return true;
}

// ── Step 1: Ensure all basic 1-3 word cards have ALL goal tags ────
// These are universal phrases every learner needs regardless of goal
const universalPhrases = [
  'Hola.', 'Adiós.', 'Buenos días.', 'Buenas tardes.', 'Buenas noches.',
  'Sí.', 'No.', 'Por favor.', 'Gracias.', 'De nada.', 'Lo siento.',
  'Perdón.', 'Mucho gusto.', 'Hasta luego.', 'Hasta mañana.',
  'No entiendo.', 'Hablo un poco.', 'No sé.',
];

const allGoals = ['general', 'travel', 'family', 'work'];

for (const phrase of universalPhrases) {
  const card = deck.find(c => c.target === phrase);
  if (card) {
    for (const goal of allGoals) {
      if (!card.tags.includes(goal)) {
        card.tags.push(goal);
        tagged++;
      }
    }
  }
}

// ── Step 2: Add missing essential cards ────────────────────────
// These are basic words that don't exist in the deck at all

const missingCards = [
  // Colors
  { target: 'Mi color favorito es el amarillo.', english: 'My favorite color is yellow.', grammarNode: 'node-01', tags: ['general', 'family'] },
  { target: 'Las naranjas son de color naranja.', english: 'Oranges are orange in color.', grammarNode: 'node-04', tags: ['general'] },
  { target: 'Me gusta el color morado.', english: 'I like the color purple.', grammarNode: 'node-05', tags: ['general'] },
  { target: 'Las rosas son de color rosa.', english: 'Roses are pink.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'El sofá es marrón.', english: 'The sofa is brown.', grammarNode: 'node-01', tags: ['general', 'family'] },
  { target: 'El cielo está gris hoy.', english: 'The sky is gray today.', grammarNode: 'node-02', tags: ['general'], grammar: 'Estar for temporary states: the sky is gray today (not always).' },

  // Numbers
  { target: 'Necesito seis huevos.', english: 'I need six eggs.', grammarNode: 'node-01', tags: ['general', 'family'] },
  { target: 'Son las siete de la mañana.', english: "It's seven in the morning.", grammarNode: 'node-01', tags: ['general'] },
  { target: 'Tengo ocho primos.', english: 'I have eight cousins.', grammarNode: 'node-01', tags: ['general', 'family'] },
  { target: 'Faltan nueve días para las vacaciones.', english: 'There are nine days until the vacation.', grammarNode: 'node-01', tags: ['general', 'travel'] },

  // Days of week
  { target: 'El miércoles tengo una cita.', english: 'On Wednesday I have an appointment.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'Los jueves voy al gimnasio.', english: 'On Thursdays I go to the gym.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'El sábado vamos al mercado.', english: 'On Saturday we go to the market.', grammarNode: 'node-01', tags: ['general', 'family'] },
  { target: 'Los domingos descanso en casa.', english: 'On Sundays I rest at home.', grammarNode: 'node-01', tags: ['general', 'family'] },

  // Months
  { target: 'Marzo es un mes bonito.', english: 'March is a nice month.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'En abril llueve mucho.', english: 'In April it rains a lot.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'Mi cumpleaños es en mayo.', english: 'My birthday is in May.', grammarNode: 'node-01', tags: ['general', 'family'] },
  { target: 'En julio hace mucho calor.', english: 'In July it is very hot.', grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'Agosto es el mes de vacaciones.', english: 'August is the vacation month.', grammarNode: 'node-01', tags: ['general', 'travel', 'work'] },
  { target: 'En octubre empiezan las lluvias.', english: 'In October the rains start.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'Noviembre es un mes tranquilo.', english: 'November is a quiet month.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'En diciembre celebramos la Navidad.', english: 'In December we celebrate Christmas.', grammarNode: 'node-01', tags: ['general', 'family'] },

  // Weather
  { target: 'Está lloviendo.', english: "It's raining.", grammarNode: 'node-02', tags: ['general', 'travel'] },
  { target: 'Hace mucho sol hoy.', english: "It's very sunny today.", grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'Está nevando en la montaña.', english: "It's snowing in the mountains.", grammarNode: 'node-02', tags: ['general', 'travel'] },
  { target: 'Hace mucho viento.', english: "It's very windy.", grammarNode: 'node-01', tags: ['general', 'travel'] },

  // Common adjectives
  { target: 'Esta calle es muy larga.', english: 'This street is very long.', grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'La película es muy corta.', english: 'The movie is very short.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'Esta flor es muy bonita.', english: 'This flower is very pretty.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'Ese edificio es muy feo.', english: 'That building is very ugly.', grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'El español no es difícil.', english: "Spanish isn't difficult.", grammarNode: 'node-01', tags: ['general'] },
  { target: 'Este ejercicio es fácil.', english: 'This exercise is easy.', grammarNode: 'node-01', tags: ['general'] },

  // Body
  { target: 'Me duele la cabeza.', english: 'My head hurts.', grammarNode: 'node-05', tags: ['general', 'travel'], grammar: 'Doler works like gustar: me duele = it hurts me.' },
  { target: 'Levanta la mano.', english: 'Raise your hand.', grammarNode: 'node-12', tags: ['general', 'work'] },
  { target: 'Cierra los ojos.', english: 'Close your eyes.', grammarNode: 'node-12', tags: ['general', 'family'] },
  { target: 'Abre la boca.', english: 'Open your mouth.', grammarNode: 'node-12', tags: ['general'] },
  { target: 'Me duele el pie.', english: 'My foot hurts.', grammarNode: 'node-05', tags: ['general'] },
  { target: 'Me duele el brazo.', english: 'My arm hurts.', grammarNode: 'node-05', tags: ['general'] },
  { target: 'Me duele la pierna.', english: 'My leg hurts.', grammarNode: 'node-05', tags: ['general'] },
  { target: 'Tiene buen corazón.', english: 'He/she has a good heart.', grammarNode: 'node-01', tags: ['general', 'family'] },

  // Common verbs in basic sentences
  { target: 'Camino al trabajo todos los días.', english: 'I walk to work every day.', grammarNode: 'node-01', tags: ['general', 'work'] },
  { target: 'Corro por el parque.', english: 'I run in the park.', grammarNode: 'node-01', tags: ['general'] },

  // Food & Drink basics
  { target: 'Quiero pan, por favor.', english: 'I want bread, please.', grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'La leche está fría.', english: 'The milk is cold.', grammarNode: 'node-02', tags: ['general', 'family'] },
  { target: 'Un café con leche, por favor.', english: 'A coffee with milk, please.', grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'No como carne.', english: "I don't eat meat.", grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'La fruta está fresca.', english: 'The fruit is fresh.', grammarNode: 'node-02', tags: ['general'] },
  { target: 'Quiero una cerveza.', english: 'I want a beer.', grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'Una copa de vino tinto.', english: 'A glass of red wine.', grammarNode: 'node-04', tags: ['general', 'travel'] },
  { target: 'Comemos muchas verduras.', english: 'We eat a lot of vegetables.', grammarNode: 'node-01', tags: ['general', 'family'] },

  // Places
  { target: 'La escuela está cerca de mi casa.', english: 'The school is near my house.', grammarNode: 'node-02', tags: ['general', 'family'] },
  { target: 'Necesito ir al hospital.', english: 'I need to go to the hospital.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'La tienda cierra a las nueve.', english: 'The store closes at nine.', grammarNode: 'node-01', tags: ['general', 'travel'] },
  { target: 'Vamos al banco por la mañana.', english: "We're going to the bank in the morning.", grammarNode: 'node-01', tags: ['general'] },
  { target: 'Me gusta ir a la playa.', english: 'I like going to the beach.', grammarNode: 'node-05', tags: ['general', 'travel'] },
  { target: 'El aeropuerto está lejos del centro.', english: 'The airport is far from the center.', grammarNode: 'node-02', tags: ['general', 'travel'] },

  // Emotions / states
  { target: 'Estoy cansado.', english: 'I am tired.', grammarNode: 'node-02', tags: ['general', 'work'], grammar: 'Estar for temporary physical states.' },
  { target: 'Estoy contento.', english: 'I am happy.', grammarNode: 'node-02', tags: ['general'] },
  { target: 'Estoy triste.', english: 'I am sad.', grammarNode: 'node-02', tags: ['general'] },
  { target: 'Tengo hambre.', english: 'I am hungry.', grammarNode: 'node-01', tags: ['general', 'travel'], grammar: 'Spanish uses "tener hambre" (to have hunger), not "ser/estar".' },
  { target: 'Tengo miedo.', english: 'I am scared.', grammarNode: 'node-01', tags: ['general'] },
  { target: 'Estoy aburrido.', english: 'I am bored.', grammarNode: 'node-02', tags: ['general'] },
  { target: 'Estoy enfermo.', english: 'I am sick.', grammarNode: 'node-02', tags: ['general'] },
  { target: 'Estoy nervioso.', english: 'I am nervous.', grammarNode: 'node-02', tags: ['general', 'work'] },
  { target: 'Estoy ocupado ahora mismo.', english: 'I am busy right now.', grammarNode: 'node-02', tags: ['general', 'work'] },
];

console.log('Adding missing basic cards:');
for (const c of missingCards) {
  if (addCard(c)) {
    console.log('  + ' + c.target);
  }
}

// ── Step 3: Ensure travel/family/work goals also have basics ──
// For each specialized goal, ensure basic greetings & survival phrases exist.
// We do this by checking if cards with these words exist in each goal.

const survivalWords = {
  travel: ['hola', 'adiós', 'gracias', 'por favor', 'ayuda', 'baño', 'agua',
           'hotel', 'restaurante', 'hospital', 'aeropuerto', 'taxi',
           'cuánto cuesta', 'la cuenta', 'dónde está', 'no entiendo',
           'habla inglés', 'reserva', 'habitación'],
  family: ['hola', 'adiós', 'gracias', 'madre', 'padre', 'hermano', 'hermana',
           'hijo', 'hija', 'abuelo', 'abuela', 'cumpleaños', 'familia',
           'casa', 'cocina', 'cena', 'desayuno'],
  work: ['hola', 'adiós', 'gracias', 'por favor', 'reunión', 'oficina',
         'correo', 'informe', 'proyecto', 'jefe', 'compañero', 'trabajo',
         'horario', 'vacaciones', 'contrato'],
};

console.log('\n--- Specialized goal coverage ---');
for (const [goal, words] of Object.entries(survivalWords)) {
  const goalCards = deck.filter(c => (c.tags || []).includes(goal));
  const missing = words.filter(w => !goalCards.some(c => c.target.toLowerCase().includes(w)));
  if (missing.length > 0) {
    console.log(goal + ': missing ' + missing.join(', '));
  } else {
    console.log(goal + ': all basics covered');
  }
}

// ── Save ──────────────────────────────────────────────────────
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));

console.log('\n=== Summary ===');
console.log('Tags fixed: ' + tagged);
console.log('New cards added: ' + added);
console.log('New deck size: ' + deck.length);
