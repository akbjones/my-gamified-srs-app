#!/usr/bin/env node
/**
 * restructure-goals.cjs
 *
 * Restructures the deck so that:
 * 1. Every goal gets ~2000 cards (evenly distributed across 20 nodes = ~100/node)
 * 2. Basic vocab (numbers, body, emotions, food, directions, introductions)
 *    appears in ALL 4 goals as a shared foundation
 * 3. Cards are interleaved by ID so every goal has even node coverage
 *
 * Current state: 7703 cards total
 *   - All 7703 tagged 'general' (too many)
 *   - ~1970 tagged 'travel', ~1990 'work', ~1980 'family'
 *   - Tags are clustered by ID range, causing empty nodes per goal
 *
 * Target state: 7703 cards total
 *   - ~2000 tagged 'general' (curated core curriculum)
 *   - ~2000 tagged 'travel' (core + travel-specific)
 *   - ~2000 tagged 'work' (core + work-specific)
 *   - ~2000 tagged 'family' (core + family-specific)
 *   - ~1000 "core" cards shared across all 4 goals (basic vocab)
 *   - Each goal has even distribution across all 20 nodes
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const NODES = 20;
const TARGET_PER_GOAL = 2000;
const CORE_SIZE = 1000; // shared foundation cards

// Load deck
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
console.log(`Loaded ${deck.length} cards`);

// ─── Step 1: Identify "core" basic vocab cards ──────────────────
// These are fundamental cards that every goal needs:
// numbers, body parts, emotions, food, directions, introductions,
// time, weather, colors, common verbs, basic questions

const CORE_KEYWORDS = [
  // Numbers & counting
  'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'veinte', 'treinta', 'cien', 'mil', 'número', 'primero', 'segundo',
  'tercero', 'último', 'mitad', 'doble', 'triple', 'par',

  // Body
  'cabeza', 'mano', 'pie', 'ojo', 'oreja', 'nariz', 'boca', 'brazo', 'pierna',
  'espalda', 'dedo', 'corazón', 'estómago', 'cuerpo', 'cara', 'pelo', 'diente',

  // Emotions & states
  'feliz', 'triste', 'enojado', 'cansado', 'contento', 'preocupado', 'nervioso',
  'tranquilo', 'emocionado', 'aburrido', 'enfermo', 'sano', 'hambre', 'sed',
  'sueño', 'miedo', 'dolor', 'alegría', 'amor', 'odio', 'vergüenza', 'orgulloso',

  // Food & drink
  'comida', 'agua', 'pan', 'carne', 'pollo', 'pescado', 'arroz', 'fruta', 'verdura',
  'leche', 'café', 'té', 'cerveza', 'vino', 'desayuno', 'almuerzo', 'cena',
  'cocina', 'plato', 'cuchara', 'tenedor', 'cuchillo', 'vaso', 'taza',
  'sal', 'azúcar', 'queso', 'huevo', 'ensalada', 'sopa', 'postre',

  // Directions & location
  'izquierda', 'derecha', 'arriba', 'abajo', 'cerca', 'lejos', 'norte', 'sur',
  'este', 'oeste', 'esquina', 'calle', 'avenida', 'cuadra', 'dirección',
  'adelante', 'atrás', 'aquí', 'allí', 'donde', 'dónde',

  // Introductions & basics
  'hola', 'adiós', 'gracias', 'favor', 'nombre', 'edad', 'año', 'país',
  'ciudad', 'idioma', 'hablar', 'entender', 'saber', 'conocer', 'llamar',
  'presentar', 'mucho gusto', 'encantado', 'bienvenido', 'perdón', 'disculpa',

  // Time
  'hora', 'minuto', 'segundo', 'día', 'semana', 'mes', 'mañana', 'tarde', 'noche',
  'hoy', 'ayer', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo',
  'enero', 'febrero', 'siempre', 'nunca', 'veces', 'temprano', 'pronto', 'después',

  // Weather
  'lluvia', 'sol', 'frío', 'calor', 'viento', 'nube', 'nieve', 'clima', 'temperatura',

  // Colors
  'rojo', 'azul', 'verde', 'amarillo', 'blanco', 'negro', 'gris', 'rosa', 'morado',

  // Common verbs (infinitives in sentences)
  'ser', 'estar', 'tener', 'hacer', 'ir', 'poder', 'querer', 'decir', 'dar',
  'ver', 'venir', 'poner', 'salir', 'llegar', 'pasar', 'creer', 'pensar',
];

function isCoreTopic(text) {
  const lower = text.toLowerCase();
  return CORE_KEYWORDS.some(kw => {
    // Match whole word (with possible punctuation)
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lower);
  });
}

// ─── Step 2: Categorize each card ───────────────────────────────
// Determine the "best fit" goal for each card based on content

const TRAVEL_KEYWORDS = [
  'hotel', 'vuelo', 'avión', 'aeropuerto', 'maleta', 'pasaporte', 'visa', 'reserva',
  'turista', 'playa', 'museo', 'monumento', 'excursión', 'equipaje', 'boleto',
  'viaje', 'viajar', 'vacaciones', 'mapa', 'guía', 'taxi', 'autobús', 'tren',
  'metro', 'estación', 'terminal', 'aduana', 'frontera', 'embajada', 'crucero',
  'hostal', 'albergue', 'recepción', 'habitación', 'piscina', 'restaurante',
  'menú', 'cuenta', 'propina', 'mesero', 'reservación', 'itinerario',
  'destino', 'ruta', 'sendero', 'montaña', 'lago', 'río', 'isla', 'bosque',
  'parque', 'catedral', 'castillo', 'ruina', 'mercado', 'tienda', 'souvenir',
  'foto', 'cámara', 'recuerdo', 'aventura', 'explorar',
];

const WORK_KEYWORDS = [
  'trabajo', 'trabajar', 'oficina', 'empresa', 'jefe', 'empleado', 'compañero',
  'reunión', 'proyecto', 'informe', 'correo', 'contrato', 'salario', 'sueldo',
  'curriculum', 'entrevista', 'puesto', 'cargo', 'departamento', 'cliente',
  'negocio', 'presupuesto', 'factura', 'meta', 'objetivo', 'plazo', 'fecha',
  'horario', 'turno', 'escritorio', 'computadora', 'pantalla', 'archivo',
  'presentación', 'conferencia', 'seminario', 'capacitación', 'ascenso',
  'despido', 'renuncia', 'vacante', 'solicitud', 'experiencia', 'profesional',
  'carrera', 'industria', 'sector', 'mercado', 'inversión', 'estrategia',
  'productividad', 'eficiencia', 'liderazgo', 'equipo', 'colaborar',
];

const FAMILY_KEYWORDS = [
  'familia', 'mamá', 'papá', 'madre', 'padre', 'hijo', 'hija', 'hermano', 'hermana',
  'abuelo', 'abuela', 'tío', 'tía', 'primo', 'prima', 'sobrino', 'sobrina',
  'esposo', 'esposa', 'novio', 'novia', 'pareja', 'boda', 'matrimonio', 'divorcio',
  'bebé', 'niño', 'niña', 'adolescente', 'joven', 'adulto', 'anciano',
  'hogar', 'casa', 'cuarto', 'cocina', 'baño', 'jardín', 'vecino', 'mascota',
  'perro', 'gato', 'embarazada', 'embarazo', 'nacimiento', 'cumpleaños',
  'navidad', 'fiesta', 'celebración', 'regalo', 'crianza', 'educación',
  'escuela', 'tarea', 'jugar', 'juguete', 'parque', 'paseo', 'cuidar',
  'emoción', 'sentimiento', 'relación', 'confianza', 'respeto', 'paciencia',
];

function getGoalScore(text, keywords) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score++;
  }
  return score;
}

// ─── Step 3: Assign tags ────────────────────────────────────────

// Sort deck by ID for consistent ordering
deck.sort((a, b) => a.id - b.id);

// Score every card
const scored = deck.map(card => {
  const text = card.target + ' ' + card.english;
  return {
    card,
    isCore: isCoreTopic(card.target),
    travelScore: getGoalScore(text, TRAVEL_KEYWORDS),
    workScore: getGoalScore(text, WORK_KEYWORDS),
    familyScore: getGoalScore(text, FAMILY_KEYWORDS),
  };
});

// Pick core cards (basic vocab that goes in all goals)
// Take cards that match core keywords, up to CORE_SIZE, spread across IDs
const coreEligible = scored.filter(s => s.isCore);
console.log(`Core-eligible cards: ${coreEligible.length}`);

// Evenly sample core cards across the ID range
const coreCards = new Set();
const step = Math.max(1, Math.floor(coreEligible.length / CORE_SIZE));
for (let i = 0; i < coreEligible.length && coreCards.size < CORE_SIZE; i += step) {
  coreCards.add(coreEligible[i].card.id);
}
// Fill remaining if needed
for (const s of coreEligible) {
  if (coreCards.size >= CORE_SIZE) break;
  coreCards.add(s.card.id);
}
console.log(`Core cards selected: ${coreCards.size}`);

// For each specialized goal, pick ~(TARGET - CORE) cards with highest relevance score
// Then fill remainder with general cards to reach target
function selectGoalCards(scored, goalScoreKey, coreCards, target) {
  const budget = target - coreCards.size;

  // Sort non-core cards by goal relevance
  const nonCore = scored
    .filter(s => !coreCards.has(s.card.id))
    .sort((a, b) => b[goalScoreKey] - a[goalScoreKey]);

  const selected = new Set(coreCards);

  // First add high-scoring cards
  for (const s of nonCore) {
    if (selected.size >= target) break;
    if (s[goalScoreKey] > 0) {
      selected.add(s.card.id);
    }
  }

  // Fill remaining evenly from leftover cards (to ensure node coverage)
  if (selected.size < target) {
    const remaining = nonCore.filter(s => !selected.has(s.card.id));
    const fillStep = Math.max(1, Math.floor(remaining.length / (target - selected.size)));
    for (let i = 0; i < remaining.length && selected.size < target; i += fillStep) {
      selected.add(remaining[i].card.id);
    }
    // Ensure we hit target
    for (const s of remaining) {
      if (selected.size >= target) break;
      if (!selected.has(s.card.id)) selected.add(s.card.id);
    }
  }

  return selected;
}

// Select general: core + evenly distributed sample of all remaining to reach ~2000
function selectGeneralCards(scored, coreCards, target) {
  const selected = new Set(coreCards);
  const nonCore = scored.filter(s => !coreCards.has(s.card.id));

  const fillStep = Math.max(1, Math.floor(nonCore.length / (target - selected.size)));
  for (let i = 0; i < nonCore.length && selected.size < target; i += fillStep) {
    selected.add(nonCore[i].card.id);
  }
  for (const s of nonCore) {
    if (selected.size >= target) break;
    if (!selected.has(s.card.id)) selected.add(s.card.id);
  }

  return selected;
}

const generalSet = selectGeneralCards(scored, coreCards, TARGET_PER_GOAL);
const travelSet = selectGoalCards(scored, 'travelScore', coreCards, TARGET_PER_GOAL);
const workSet = selectGoalCards(scored, 'workScore', coreCards, TARGET_PER_GOAL);
const familySet = selectGoalCards(scored, 'familyScore', coreCards, TARGET_PER_GOAL);

console.log(`\nGoal sizes:`);
console.log(`  General: ${generalSet.size}`);
console.log(`  Travel:  ${travelSet.size}`);
console.log(`  Work:    ${workSet.size}`);
console.log(`  Family:  ${familySet.size}`);

// ─── Step 4: Apply tags ─────────────────────────────────────────
// Distribute leftover cards (not in any goal set) round-robin across
// all 4 goals so every card is reachable and goals stay balanced.

const goalNames = ['general', 'travel', 'work', 'family'];
const goalSets = [generalSet, travelSet, workSet, familySet];
const goalExtraCounts = [0, 0, 0, 0]; // track extras per goal

for (const card of deck) {
  const tags = [];
  if (generalSet.has(card.id)) tags.push('general');
  if (travelSet.has(card.id)) tags.push('travel');
  if (workSet.has(card.id)) tags.push('work');
  if (familySet.has(card.id)) tags.push('family');

  // Distribute unassigned cards round-robin across goals (keeps them balanced)
  if (tags.length === 0) {
    // Find the goal with fewest extras so far
    let minIdx = 0;
    for (let g = 1; g < 4; g++) {
      if (goalExtraCounts[g] < goalExtraCounts[minIdx]) minIdx = g;
    }
    tags.push(goalNames[minIdx]);
    goalExtraCounts[minIdx]++;
  }

  card.tags = tags;
}

// ─── Step 5: Verify node distribution ───────────────────────────

const perNode = Math.ceil(deck.length / NODES);
console.log(`\nPer-node size: ${perNode} cards`);

function checkNodeDistribution(goalTag) {
  // App assigns nodes based on position within the FILTERED goal deck
  // (dynamic node slicing: perNode = ceil(filteredCount / 20))
  const goalCards = deck
    .filter(c => c.tags.includes(goalTag))
    .sort((a, b) => a.id - b.id);
  const perGoalNode = Math.ceil(goalCards.length / NODES);

  const nodeCounts = {};
  for (let i = 0; i < goalCards.length; i++) {
    const nodeIdx = Math.min(NODES - 1, Math.floor(i / perGoalNode));
    const nodeId = `node-${String(nodeIdx + 1).padStart(2, '0')}`;
    nodeCounts[nodeId] = (nodeCounts[nodeId] || 0) + 1;
  }

  const counts = Object.values(nodeCounts);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const empty = NODES - Object.keys(nodeCounts).length;

  return { total: goalCards.length, min, max, empty, nodeCounts };
}

for (const goal of ['general', 'travel', 'work', 'family']) {
  const dist = checkNodeDistribution(goal);
  const nodeVals = Object.entries(dist.nodeCounts).map(([n, c]) => `${n}:${c}`).join(' ');
  console.log(`\n  ${goal}: ${dist.total} cards, min=${dist.min}/node, max=${dist.max}/node, empty=${dist.empty}`);
  console.log(`    ${nodeVals}`);
}

// ─── Step 6: Save ───────────────────────────────────────────────

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');

// Overlap analysis
const allFour = deck.filter(c => c.tags.length === 4).length;
const threeTags = deck.filter(c => c.tags.length === 3).length;
const twoTags = deck.filter(c => c.tags.length === 2).length;
const oneTag = deck.filter(c => c.tags.length === 1).length;

console.log(`\nOverlap:`);
console.log(`  4 tags (all goals): ${allFour}`);
console.log(`  3 tags: ${threeTags}`);
console.log(`  2 tags: ${twoTags}`);
console.log(`  1 tag:  ${oneTag}`);
console.log(`\nDone! Deck saved.`);
