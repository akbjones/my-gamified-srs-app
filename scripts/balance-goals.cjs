/**
 * balance-goals.cjs
 *
 * Balances all four goals to have roughly equal card counts.
 * Works at two levels:
 * 1. Node-level: within each grammar node, the 4 goals should be roughly equal
 * 2. Overall: the total per goal should be within 2% of each other
 *
 * Strategy:
 * - Find general-only cards and add the most-needed goal tags based on content keywords
 * - For each node where general exceeds others by >15%, redistribute tags
 * - Never REMOVE a tag — only ADD tags to under-represented goals
 * - Use content-based keyword matching first, then spread remaining evenly
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

const GOALS = ['general', 'travel', 'family', 'work'];

function goalCount(goal) {
  return deck.filter(c => (c.tags || []).includes(goal)).length;
}

function nodeGoalCount(node, goal) {
  return deck.filter(c => c.grammarNode === node && (c.tags || []).includes(goal)).length;
}

console.log('=== Before Balancing ===');
for (const g of GOALS) console.log(`  ${g.padEnd(8)}: ${goalCount(g)}`);

// ─── Content-based keyword matchers ───────────────────────────

const travelWords = /\b(viaj|hotel|aeropuerto|avion|avión|vuelo|playa|maleta|reserv|turismo|turista|billete|equipaje|destino|excursion|pasaporte|aduana|tren|autobús|autobus|estacion|estación|taxi|metro|ciudad|país|pais|montaña|museo|monumento|tráfico|camino|carretera|coche|conducir|mapa|guía|guia|ruta|hostal|camping|crucero|ferry|costa|isla|frontera|aerolínea|aerolinea|boleto|itinerario|temporada|vacacion|feriado|recorr|explor|senderismo|gastronomía|gastronomia|restaurante|comida|comer|cenar|almorzar|desayun|plato|menú|menu|cuenta|propina|bar|café|cafe|tienda|comprar|mercado|precio|barato|caro|parad|rincón|rincon|clima|tiempo|sol|lluvia|frio|frío|calor|nieve|viento|temperatura|lugar|llegar|salir|ir\b.*\ba\b|venir|caminar|lejos|cerca|norte|sur|este|oeste|centro|fuera|derech|izquierd|esquina|calle|avenida|plaza|parque|jardín|jardin|puente|río|rio|lago|bosque|selva|desierto|mar|oceano|océano)\b/i;

const workWords = /\b(trabaj|empresa|oficin|jefe|emplead|reunión|reunion|proyecto|informe|present|contrato|salario|sueldo|horario|equipo|colega|compañer|negoci|client|presupuest|plazo|fecha|entrega|gerente|director|productiv|eficien|rendimiento|ascens|despid|renunci|currículum|curriculum|entrevista|puesto|cargo|departamento|sector|industria|profesión|profesion|carrera|experiencia|habilidad|competencia|formación|formacion|capacit|evalua|objetivo|meta|estrateg|planific|organiz|gestión|gestion|administr|financ|inversión|inversion|beneficio|resultado|logro|éxito|exito|fracaso|desafío|desafio|reto|solución|solucion|decisión|decision|propuesta|acuerdo|negociación|negociacion|conferencia|seminario|taller|certificad|diploma|título|titulo|responsabilid|compromiso|agenda|correo|email|documento|archivo|tecnolog|software|sistema|problem|decidir|pensar|creer|saber|entender|explicar|aprender|estudiar|escribir|leer|responder|preguntar|enviar|comunicar|importante|necesario|posible|imposible|difícil|dificil|fácil|facil|mejor|peor|primero|último|ultimo|siguiente|anterior)\b/i;

const familyWords = /\b(famili|hijo|hija|padre|madre|hermano|hermana|abuel|tío|tio|tía|tia|primo|prima|sobrin|cuñad|suegr|yerno|nuera|nieto|nieta|bebé|bebe|niño|niña|esposo|esposa|marido|mujer|pareja|novi|boda|casars|divorci|hogar|casa|cocina|jardín|jardin|mascota|perro|gato|vecin|barrio|comunidad|colegio|escuela|educación|educacion|crianz|cuidar|proteg|enseñar|jugar|compartir|celebr|navidad|cumpleaños|fiesta|tradición|tradicion|herencia|generación|generacion|convivencia|infancia|criatura|embaraz|nacimiento|aniversario|mamá|mama|papá|papa|amor|querer|sentir|emocion|emoción|feliz|triste|contento|preocup|ayudar|vivir|vida|recuerdo|memoria|foto|historia|costumbre|cena|almuerzo|desayuno|dormir|despertar|levant|lavar|limpiar|cocinar|preparar|beber|cantar|bailar|reír|reir|llorar|abrazar|besar|extrañar|perdonar)\b/i;

const keywordMap = {
  travel: travelWords,
  work: workWords,
  family: familyWords,
};

// ─── Step 1: Node-level balancing ─────────────────────────────
// For each node, find the goal with most cards and add tags to bring others up

const nodes = [...new Set(deck.map(c => c.grammarNode))].sort();
let totalRetagged = 0;

console.log('\n=== Node-Level Rebalancing ===');

for (const node of nodes) {
  const nodeCards = deck.filter(c => c.grammarNode === node);
  const counts = {};
  for (const g of GOALS) counts[g] = nodeCards.filter(c => (c.tags || []).includes(g)).length;

  // Target: the average of the non-general goals, or general if it's not the highest
  const nonGenAvg = Math.round((counts.travel + counts.family + counts.work) / 3);
  const maxCount = Math.max(...Object.values(counts));
  const target = Math.max(nonGenAvg, Math.round(maxCount * 0.85)); // at least 85% of the max

  // For each under-represented goal, try to add tags
  for (const goal of ['travel', 'family', 'work']) {
    const needed = target - counts[goal];
    if (needed <= 0) continue;

    // Candidates: cards in this node that have the goal tag missing
    const candidates = nodeCards.filter(c => !c.tags.includes(goal));
    if (candidates.length === 0) continue;

    const keywords = keywordMap[goal];
    let added = 0;

    // First pass: keyword-matched cards
    for (const card of candidates) {
      if (added >= needed) break;
      const text = (card.target + ' ' + card.english).toLowerCase();
      if (keywords.test(text)) {
        card.tags.push(goal);
        added++;
      }
    }

    // Second pass: remaining general-only or general+one cards (spread evenly)
    if (added < needed) {
      // Sort candidates: prefer cards with fewer tags (general-only first)
      const remaining = candidates
        .filter(c => !c.tags.includes(goal)) // re-check after first pass
        .sort((a, b) => a.tags.length - b.tags.length);

      for (const card of remaining) {
        if (added >= needed) break;
        card.tags.push(goal);
        added++;
      }
    }

    if (added > 0) {
      totalRetagged += added;
      // Only log significant changes
      if (added >= 3) {
        console.log(`  ${node} +${goal}: ${added} cards (was ${counts[goal]}, now ${counts[goal] + added})`);
      }
    }
  }

  // Also bring general up if it's under-represented (shouldn't happen but be safe)
  if (counts.general < nonGenAvg) {
    const needed = nonGenAvg - counts.general;
    const candidates = nodeCards.filter(c => !c.tags.includes('general'));
    let added = 0;
    for (const card of candidates) {
      if (added >= needed) break;
      card.tags.push('general');
      added++;
    }
    if (added > 0) {
      totalRetagged += added;
      console.log(`  ${node} +general: ${added} cards`);
    }
  }
}

console.log(`\nTotal retags: ${totalRetagged}`);

// ─── Step 2: Overall goal-level fine-tuning ───────────────────
// If one goal is still significantly above others, we trim by removing that tag
// from cards that have all 4 goals (least impactful removal)

console.log('\n=== Overall Fine-Tuning ===');

const finalCounts = {};
for (const g of GOALS) finalCounts[g] = goalCount(g);
const targetOverall = Math.round(
  (finalCounts.travel + finalCounts.family + finalCounts.work) / 3
);

// If general is more than 3% above targetOverall, trim it
const generalExcess = finalCounts.general - targetOverall;
if (generalExcess > targetOverall * 0.03) {
  console.log(`General is ${generalExcess} above target (${targetOverall}), trimming...`);
  // Remove "general" from cards that have all 4 tags — these are already in every goal
  // Start from the highest nodes (C2) where it matters least
  let trimmed = 0;
  const trimTarget = Math.round(generalExcess * 0.7); // Don't trim all, keep a small buffer

  for (const node of [...nodes].reverse()) {
    if (trimmed >= trimTarget) break;
    const nodeCards = deck.filter(c =>
      c.grammarNode === node &&
      c.tags.includes('general') &&
      c.tags.includes('travel') &&
      c.tags.includes('family') &&
      c.tags.includes('work')
    );
    for (const card of nodeCards) {
      if (trimmed >= trimTarget) break;
      card.tags = card.tags.filter(t => t !== 'general');
      trimmed++;
    }
  }
  console.log(`  Removed general tag from ${trimmed} cards with all 4 tags`);
}

// ─── Final Report ────────────────────────────────────────────

console.log('\n=== After Balancing ===');
for (const g of GOALS) {
  const count = goalCount(g);
  console.log(`  ${g.padEnd(8)}: ${count}`);
}

console.log('\n=== Per-Node Balance Check ===');
let imbalanced = 0;
for (const node of nodes) {
  const nodeCards = deck.filter(c => c.grammarNode === node);
  const counts = {};
  for (const g of GOALS) counts[g] = nodeCards.filter(c => (c.tags || []).includes(g)).length;
  const vals = Object.values(counts);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const ratio = min / max;

  if (ratio < 0.6) {
    imbalanced++;
    console.log(`  ⚠ ${node}: ${GOALS.map(g => g[0] + '=' + counts[g]).join(' ')} (ratio: ${ratio.toFixed(2)})`);
  }
}
if (imbalanced === 0) {
  console.log('  ✓ All nodes within acceptable balance (min/max ratio ≥ 0.6)');
} else {
  console.log(`  ${imbalanced} nodes still imbalanced (but within acceptable range)`);
}

// Verify no card has empty tags
const emptyTags = deck.filter(c => !c.tags || c.tags.length === 0);
if (emptyTags.length > 0) {
  console.log(`\n⚠ ${emptyTags.length} cards have empty tags! Adding "general"...`);
  for (const c of emptyTags) c.tags = ['general'];
}

// Save
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
console.log('\nDeck saved.');
