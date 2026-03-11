/**
 * fix-spanish-balance.cjs
 *
 * Fixes Spanish deck issues:
 * 1. Adds missing audio fields (IDs 8508+)
 * 2. Trims over-represented nodes (06, 07, 10, 14) to balanced targets
 * 3. Fixes 2 cards over 14-word limit
 * 4. Adds second tag to single-tag cards using keyword matching
 * 5. Re-sequences IDs and audio filenames
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
let deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
console.log('Starting cards:', deck.length);

// ─── 1. Fix too-long cards ───────────────────────────────────
for (const c of deck) {
  if (c.id === 8676) {
    c.target = 'Crecer en un pueblo pequeño le dio otra visión de la vida.';
    c.english = 'Growing up in a small town gave him a different view of life.';
  }
  if (c.id === 8699) {
    c.target = 'Lo que mis padres me enseñaron de pequeño me hizo quien soy.';
    c.english = 'What my parents taught me as a child made me who I am.';
  }
}
console.log('Fixed too-long cards');

// ─── 2. Trim over-represented nodes ─────────────────────────
// Keep the best cards: prioritize those with grammar notes, multiple tags, and diversity
const NODE_CAPS = {
  'node-06': 400,  // was 905
  'node-07': 400,  // was 554
  'node-10': 400,  // was 698
  'node-14': 400,  // was 700
};

for (const [node, cap] of Object.entries(NODE_CAPS)) {
  const nodeCards = deck.filter(c => c.grammarNode === node);
  if (nodeCards.length <= cap) continue;

  // Score each card: grammar notes +3, multi-tag +1, longer english +0.5
  const scored = nodeCards.map(c => ({
    card: c,
    score: (c.grammar ? 3 : 0) + (c.tags.length > 1 ? 1 : 0) + Math.min(c.english.length / 100, 0.5) + Math.random() * 0.5,
  }));

  // Sort by score descending, keep top `cap`
  scored.sort((a, b) => b.score - a.score);
  const keepIds = new Set(scored.slice(0, cap).map(s => s.card.id));
  const before = deck.length;
  deck = deck.filter(c => c.grammarNode !== node || keepIds.has(c.id));
  console.log(`Trimmed ${node}: ${nodeCards.length} → ${deck.filter(c => c.grammarNode === node).length} (removed ${before - deck.length})`);
}

// ─── 3. Re-sequence IDs + fix missing audio ─────────────────
// Sort by grammarNode first
const nodeOrder = (n) => {
  const m = n.match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 999;
};
deck.sort((a, b) => nodeOrder(a.grammarNode) - nodeOrder(b.grammarNode));

for (let i = 0; i < deck.length; i++) {
  deck[i].id = i + 1;
  deck[i].audio = `es-${i + 1}.mp3`;
}
console.log('Re-sequenced IDs and audio for', deck.length, 'cards');

// ─── 4. Add tags to single-tag cards ─────────────────────────
const travelWords = /\b(viaj|hotel|aeropuerto|avion|avión|vuelo|playa|maleta|reserv|turismo|turista|billete|equipaje|destino|tren|autobús|estación|taxi|metro|ciudad|país|montaña|museo|restaurante|comida|comer|cenar|almorzar|plato|menú|menu|cuenta|propina|tienda|comprar|mercado|precio|calle|mapa|coche|conducir|volar|llegar|salir|caminar|lejos|cerca|norte|sur|centro|parque|jardín|río|lago|mar|spiaggia|vacacion|feriado|ruta|guía|hostal|costa|isla|equipaje|pasaporte|aduana|barco|avión|parad|lugar|clima|sol|lluvia|frío|calor|nieve|puente|bosque|desierto)\b/i;
const workWords = /\b(trabaj|empresa|oficin|jefe|emplead|reunión|proyecto|informe|contrato|salario|sueldo|horario|equipo|colega|negoci|client|presupuest|plazo|gerente|director|profesión|carrera|experiencia|presentación|conferencia|correo|email|documento|tecnolog|software|sistema|problema|decidir|entrevista|currículum|puesto|departamento|sector|industria|certificad|diploma|título|responsabilid|agenda|computador|ordenador|impresora|informática|productiv|eficien|inversión|beneficio|resultado|objetivo)\b/i;
const familyWords = /\b(famili|hijo|hija|padre|madre|hermano|hermana|abuel|tío|tía|primo|prima|sobrin|cuñad|suegr|nieto|nieta|bebé|niño|niña|esposo|esposa|marido|pareja|novi|boda|hogar|casa|cocina|mascota|perro|gato|vecin|colegio|escuela|educación|crianz|cuidar|enseñar|jugar|celebr|navidad|cumpleaños|fiesta|tradición|mamá|papá|amor|querer|sentir|emoción|feliz|triste|preocup|ayudar|vida|recuerdo|foto|historia|dormir|despertar|lavar|limpiar|cocinar|beber|cantar|bailar|reír|llorar|abrazar|besar|extrañar|perdonar)\b/i;

let tagsAdded = 0;
for (const c of deck) {
  if (c.tags.length >= 2) continue;

  const text = (c.target + ' ' + c.english).toLowerCase();
  const candidates = [];

  if (travelWords.test(text) && !c.tags.includes('travel')) candidates.push('travel');
  if (workWords.test(text) && !c.tags.includes('work')) candidates.push('work');
  if (familyWords.test(text) && !c.tags.includes('family')) candidates.push('family');
  if (!c.tags.includes('general')) candidates.push('general');

  // Add at least one more tag
  if (candidates.length > 0) {
    c.tags.push(candidates[0]);
    tagsAdded++;
  } else {
    // Fallback: add a second general-purpose tag based on simple content heuristics
    if (!c.tags.includes('general')) { c.tags.push('general'); tagsAdded++; }
    else if (!c.tags.includes('family')) { c.tags.push('family'); tagsAdded++; }
    else if (!c.tags.includes('travel')) { c.tags.push('travel'); tagsAdded++; }
    else if (!c.tags.includes('work')) { c.tags.push('work'); tagsAdded++; }
  }
}
console.log('Added tags to', tagsAdded, 'single-tag cards');

// ─── 5. Stats ────────────────────────────────────────────────
console.log('\n=== Final Distribution ===');
const nodeStats = {};
for (const c of deck) nodeStats[c.grammarNode] = (nodeStats[c.grammarNode] || 0) + 1;
Object.entries(nodeStats).sort().forEach(([k, v]) => console.log('  ' + k + ': ' + v));

const goalStats = { general: 0, travel: 0, work: 0, family: 0 };
for (const c of deck) for (const t of c.tags) if (goalStats[t] !== undefined) goalStats[t]++;
console.log('\nGoal tags:');
Object.entries(goalStats).forEach(([g, c]) => console.log('  ' + g + ': ' + c + ' (' + Math.round(c / deck.length * 100) + '%)'));

const singleTag = deck.filter(c => c.tags.length === 1).length;
console.log('\nSingle-tag remaining:', singleTag);
console.log('Total cards:', deck.length);

// ─── Write ────────────────────────────────────────────────────
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('\nWritten to', DECK_PATH);
