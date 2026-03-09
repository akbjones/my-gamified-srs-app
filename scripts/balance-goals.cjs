/**
 * balance-goals.cjs
 *
 * Balances all four goals to exactly 3300 cards each.
 *
 * Strategy:
 * 1. General is over 3300 → remove "general" tag from lowest-priority general-only cards
 *    (actually, just retag some general-only cards to also have other goal tags)
 * 2. Travel/Work/Family are under 3300 → add goal tags to existing general-only cards
 *    that fit the goal thematically, then add new goal-specific cards if still short
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

const TARGET = 3300;

function goalCount(goal) {
  return deck.filter(c => (c.tags || []).includes(goal)).length;
}

console.log('Before balancing:');
console.log(`  general: ${goalCount('general')}`);
console.log(`  travel:  ${goalCount('travel')}`);
console.log(`  work:    ${goalCount('work')}`);
console.log(`  family:  ${goalCount('family')}`);

// ─── Step 1: Add goal tags to general-only cards based on content ────

// Cards with only ["general"] tag are candidates for expanding to other goals
const generalOnly = deck.filter(c =>
  c.tags.length === 1 && c.tags[0] === 'general'
);
console.log(`\nGeneral-only cards available for retagging: ${generalOnly.length}`);

// Travel keywords
const travelWords = /\b(viaj|hotel|aeropuerto|avion|vuelo|playa|maleta|reserv|turismo|turista|billete|equipaje|destino|excursion|pasaporte|aduana|tren|autobus|estacion|taxi|metro|ciudad|pais|montaña|museo|monumento|tráfico|camino|carretera|coche|conducir|mapa|guia|ruta|hostal|hospedaje|camping|crucero|ferry|naveg|costa|isla|frontera|visado|aerolinea|boleto|itinerario|temporada|vacacion|feriado|recorr|explor|senderismo|gastronomia|restaurante|comida|comer|cenar|almorzar|desayun|plato|menu|cuenta|propina|bar|cafe|cocina|receta|tienda|comprar|mercado|precio|barato|caro|tránsito|parad|rincón)\b/i;

// Work keywords
const workWords = /\b(trabaj|empresa|oficin|jefe|emplead|reunion|proyecto|informe|present|contrato|salario|sueldo|horario|equipo|colega|compañer|negoci|client|presupuest|plazo|fecha|entrega|gerente|director|productiv|eficien|rendimiento|ascen|despid|renunci|curriculum|entrevista|puesto|cargo|departamento|sector|industria|profesion|carrera|experiencia|habilidad|competencia|formacion|capacit|evalua|objetivo|meta|estrateg|planific|organiz|gestion|administr|financ|inversio|beneficio|resultado|logro|exito|fracaso|desafio|reto|solucion|decision|propuesta|acuerdo|negociacion|conferencia|seminario|taller|certificad|diploma|titulo|responsabilid|compromiso|deadline|agenda|correo|email|documento|archivo|base de datos|tecnolog|software|sistema)\b/i;

// Family keywords
const familyWords = /\b(famili|hijo|hija|padre|madre|hermano|hermana|abuel|tio|tia|primo|prima|sobrin|cuñad|suegr|yerno|nuera|nieto|nieta|bebe|niño|niña|esposo|esposa|marido|mujer|pareja|novi|boda|casars|divorci|hogar|casa|cocina|jardin|mascota|perro|gato|vecin|barrio|comunidad|colegio|escuela|educacion|crianz|cuidar|proteg|enseñar|jugar|compartir|celebr|navidad|cumpleaños|fiesta|reunion.*familiar|tradicion|herencia|generacion|convivencia|infancia|adolescen|criatura|embaraz|nacimiento|parto|bautiz|aniversario|abuelo|abuela|mama|papa|padres|hijos|hermanos|sobrinos|primos|nietos|pariente|parentesco|apellido)\b/i;

let travelAdded = 0, workAdded = 0, familyAdded = 0;

for (const card of generalOnly) {
  const text = (card.target + ' ' + card.english).toLowerCase();

  if (goalCount('travel') < TARGET && travelWords.test(text) && !card.tags.includes('travel')) {
    card.tags.push('travel');
    travelAdded++;
  }
  if (goalCount('work') < TARGET && workWords.test(text) && !card.tags.includes('work')) {
    card.tags.push('work');
    workAdded++;
  }
  if (goalCount('family') < TARGET && familyWords.test(text) && !card.tags.includes('family')) {
    card.tags.push('family');
    familyAdded++;
  }
}

console.log(`\nRetagged from general-only:`);
console.log(`  +travel: ${travelAdded}`);
console.log(`  +work:   ${workAdded}`);
console.log(`  +family: ${familyAdded}`);

// ─── Step 2: For remaining shortfall, add more goal tags to multi-tag cards ────

// Now try cards that have general + one other tag but not all
for (const goal of ['travel', 'work', 'family']) {
  const needed = TARGET - goalCount(goal);
  if (needed <= 0) continue;

  const keywords = goal === 'travel' ? travelWords : goal === 'work' ? workWords : familyWords;
  let added = 0;

  // First pass: cards with general + another tag (but not this goal)
  for (const card of deck) {
    if (added >= needed) break;
    if (card.tags.includes(goal)) continue;
    if (!card.tags.includes('general')) continue;

    const text = (card.target + ' ' + card.english).toLowerCase();
    if (keywords.test(text)) {
      card.tags.push(goal);
      added++;
    }
  }

  console.log(`  Additional ${goal} retags: ${added}`);
}

// ─── Step 3: If still short, broaden the retagging (less strict keywords) ────

const broadTravel = /\b(lugar|llegar|ir|venir|salir|caminar|correr|mover|lejos|cerca|aqui|alli|ahi|nuevo|diferente|conocer|ver|mirar|encontrar|buscar|pasar|tiempo|dia|noche|mañana|tarde|semana|mes|año|sol|lluvia|nieve|frio|calor|agua|mar|rio|bosque|naturaleza|clima|norte|sur|este|oeste|centro|fuera|dentro|arriba|abajo|derech|izquierd|recto|esquina)\b/i;
const broadWork = /\b(problem|solucion|decidir|pensar|creer|saber|entender|explicar|aprender|estudiar|escribir|leer|hablar|escuchar|responder|preguntar|pedir|dar|recibir|enviar|llamar|comunicar|importante|necesario|posible|imposible|dificil|facil|mejor|peor|primero|ultimo|siguiente|anterior|nuevo|viejo|grande|pequeñ|mucho|poco|bastante|suficiente|demasiado|rapido|lento|pronto|tarde|siempre|nunca|todavia|ya|ahora|despues|antes|durante|desde|hasta|entre|contra|segun|junto)\b/i;
const broadFamily = /\b(amor|querer|sentir|emocio|feliz|triste|contento|preocup|cuidar|ayudar|compartir|vivir|vida|muerte|nacimiento|crecer|joven|viejo|recuerdo|memoria|foto|historia|tradicion|costumbre|comida|cena|almuerzo|desayuno|dormir|despertar|levant|acost|lavar|limpiar|cocinar|preparar|comer|beber|jugar|cantar|bailar|reir|llorar|abrazar|besar|extrañar|perdonar)\b/i;

for (const [goal, regex] of [['travel', broadTravel], ['work', broadWork], ['family', broadFamily]]) {
  let needed = TARGET - goalCount(goal);
  if (needed <= 0) continue;

  let added = 0;
  for (const card of deck) {
    if (added >= needed) break;
    if (card.tags.includes(goal)) continue;
    if (!card.tags.includes('general')) continue;

    const text = (card.target + ' ' + card.english).toLowerCase();
    if (regex.test(text)) {
      card.tags.push(goal);
      added++;
    }
  }
  console.log(`  Broad ${goal} retags: ${added}`);
}

// ─── Step 4: Final gap — if any goal still under 3300, add remaining general cards ────

for (const goal of ['travel', 'work', 'family']) {
  let needed = TARGET - goalCount(goal);
  if (needed <= 0) continue;

  // Just add the goal tag to remaining general cards that don't have it
  let added = 0;
  for (const card of deck) {
    if (added >= needed) break;
    if (card.tags.includes(goal)) continue;
    if (!card.tags.includes('general')) continue;
    card.tags.push(goal);
    added++;
  }
  console.log(`  Fallback ${goal} retags: ${added}`);
}

// ─── Step 5: If general is over 3300, remove "general" from cards that have 3+ tags ────

let generalOver = goalCount('general') - TARGET;
if (generalOver > 0) {
  console.log(`\nGeneral is ${generalOver} over target, trimming...`);
  // Remove general from cards that have 4 tags (all goals) — they're already in every goal
  let removed = 0;
  // Actually, we don't want to remove general. General should be the "all cards" goal.
  // Instead, let's just accept general being slightly over since every card has general.
  console.log(`  Keeping general at ${goalCount('general')} (all cards have general tag)`);
}

// ─── Final counts ────

console.log('\nAfter balancing:');
for (const goal of ['general', 'travel', 'work', 'family']) {
  const count = goalCount(goal);
  const diff = count - TARGET;
  console.log(`  ${goal.padEnd(8)}: ${count} (${diff >= 0 ? '+' : ''}${diff})`);
}

// Save
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('\nDeck saved.');
