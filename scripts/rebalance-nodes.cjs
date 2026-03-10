/**
 * rebalance-nodes.cjs — Smart node size rebalancing
 *
 * Problem: Some nodes (esp. node-01, node-06) have far too many cards because
 * the classifier uses node-01 as a catch-all and preterite markers are common.
 *
 * Solution: For oversized nodes, reclassify cards that have weak affinity to
 * their current node into better-fitting nearby nodes based on content analysis.
 *
 * Rules:
 * - Never move cards that have a grammar tip confirming their node
 * - Move longest sentences first (they're more likely misclassified)
 * - Respect node progression: don't move a simple sentence to a C2 node
 * - Target: no node should have more than ~400 unique cards per goal
 *
 * Run: node scripts/rebalance-nodes.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// Strip accents
function norm(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ── Target sizes per node (per goal) ──
// We want smooth progression: A1 ~200/goal, A2 ~250, B1 ~200, B2 ~120, C1 ~50, C2 ~50
// Total per goal: ~3500
const MAX_PER_GOAL = {
  'node-01': 250, 'node-02': 230, 'node-03': 200, 'node-04': 200, 'node-05': 110,
  'node-06': 300, 'node-07': 250, 'node-08': 130, 'node-09': 90, 'node-10': 220,
  'node-11': 170, 'node-12': 120, 'node-13': 120, 'node-14': 260, 'node-15': 120,
  'node-16': 150, 'node-17': 110, 'node-18': 100, 'node-19': 100, 'node-20': 60,
  'node-21': 50, 'node-22': 80, 'node-23': 60, 'node-24': 60, 'node-25': 50, 'node-26': 50,
};

// Grammar tip keywords that CONFIRM a card belongs in its current node
const NODE_CONFIRMERS = {
  'node-01': /present tense|presente|indicativo|regular verb/i,
  'node-02': /ser vs|estar|temporary|permanent|location|state|characteristic/i,
  'node-03': /question|interrogative|pregunta/i,
  'node-04': /article|gender|genero|masculin|feminin|concordancia/i,
  'node-05': /gustar|encantar|interesar|doler|parecer|faltar/i,
  'node-06': /preterit|indefinido|past.*action|completed|completado/i,
  'node-07': /imperfect|imperfecto|habitual|background/i,
  'node-08': /reflexiv|pronominal|se\b/i,
  'node-09': /por vs|para vs|por\/para/i,
  'node-10': /object pronoun|pronombre|complemento|lo\/la/i,
  'node-11': /subjunctive|subjuntivo/i,
  'node-12': /command|imperative|imperativo/i,
  'node-13': /conditional|condicional/i,
  'node-14': /future|futuro|perfect|perfecto|haber/i,
  'node-15': /relative|relativo|clause/i,
  'node-16': /imperfect subjunctive|subjuntivo imperfecto|pasado/i,
  'node-17': /si clause|conditional.*si/i,
  'node-18': /passive|pasiva|impersonal/i,
  'node-19': /connector|conector|discourse|marcador/i,
  'node-20': /advanced|mixed|complex/i,
};

// Content patterns to determine better node placement for displaced cards
const RECLASSIFY_PATTERNS = [
  { node: 'node-02', test: (t) => /\b(es|son|soy|eres|somos|esta|estan|estoy|estas|estamos)\b/.test(t) && t.split(/\s+/).length <= 8 },
  { node: 'node-03', test: (t, raw) => raw.startsWith('¿') },
  { node: 'node-04', test: (t) => t.split(/\s+/).length <= 6 && /\b(el|la|los|las|un|una|unos|unas|este|esta|ese|esa|estos|estas|esos|esas)\s+\w+/.test(t) },
  { node: 'node-05', test: (t) => /\b(me|te|le|nos|les)\s+(gusta|gustan|encanta|encantan|interesa|interesan|importa|importan|parece|parecen|duele|duelen|falta|faltan)\b/.test(t) },
  { node: 'node-08', test: (t) => /\b(me|te|se|nos)\s+(despierto|despiertas|despierta|levanto|levantas|levanta|acuesto|ducho|visto|siento|quedo|llamo|lavo|preparo|olvido|divierto|relajo|concentro)/.test(t) },
  { node: 'node-09', test: (t) => /\b(por|para)\b/.test(t) && t.split(/\s+/).length >= 5 },
  { node: 'node-10', test: (t) => /\b(me lo|me la|te lo|se lo|se la|nos lo)\b/.test(t) || /\b(lo|la|los|las|le|les)\s+\w{3,}(o|a|as|amos|an)\b/.test(t) },
  { node: 'node-12', test: (t) => /^(no\s+)?(ven|haz|sal|pon|ten|ve|mira|escucha|espera|toma|dime|dame|abre|cierra|llama|compra|trae|busca|lee|come|bebe|prepara|prueba|intenta|recuerda|practica|habla|estudia|cocina|limpia|sigue|repite)\b/.test(t) },
  { node: 'node-15', test: (t) => /\b(lo que|el que|la que|los que|las que|en donde|con quien|cuyo|cuya)\b/.test(t) },
  { node: 'node-19', test: (t) => /\b(sin embargo|no obstante|por lo tanto|en consecuencia|a pesar de|pese a|en cambio|ademas|asimismo|de hecho|es decir|en otras palabras|dado que|puesto que|ya que|mientras que)\b/.test(t) },
];

// Fallback: for cards with no strong signal, distribute by sentence length
function fallbackNode(words) {
  if (words <= 2) return 'node-01';
  if (words <= 4) return 'node-02';
  if (words <= 5) return 'node-04';
  if (words <= 7) return 'node-03';
  if (words <= 10) return 'node-10';
  if (words <= 13) return 'node-14';
  if (words <= 16) return 'node-15';
  if (words <= 20) return 'node-18';
  return 'node-20';
}

// ── Find oversized nodes ──

const goals = ['general', 'travel', 'family', 'work'];
let totalMoved = 0;

console.log('=== Before Rebalancing ===');
const nodes = Object.keys(MAX_PER_GOAL);
for (const n of nodes) {
  const total = deck.filter(c => c.grammarNode === n).length;
  const genCount = deck.filter(c => c.grammarNode === n && c.tags.includes('general')).length;
  const maxTarget = MAX_PER_GOAL[n];
  if (genCount > maxTarget) {
    console.log(`  ${n}: ${genCount}/gen (max ${maxTarget}, over by ${genCount - maxTarget})`);
  }
}

// ── Process each oversized node ──

for (const srcNode of nodes) {
  const maxTarget = MAX_PER_GOAL[srcNode];
  const confirmer = NODE_CONFIRMERS[srcNode];

  // Get cards in this node sorted: longest first (most likely misclassified)
  const nodeCards = deck.filter(c => c.grammarNode === srcNode);

  // Check how many per goal
  const goalCounts = {};
  for (const g of goals) {
    goalCounts[g] = nodeCards.filter(c => c.tags.includes(g)).length;
  }
  const maxGoalCount = Math.max(...Object.values(goalCounts));
  if (maxGoalCount <= maxTarget) continue;

  // How many to move (total unique cards to remove from this node)
  const excess = nodeCards.length - Math.round(maxTarget * 1.3); // 30% buffer above per-goal target
  if (excess <= 0) continue;

  console.log(`\n--- ${srcNode}: ${nodeCards.length} cards, moving up to ${excess} ---`);

  // Score each card for "should it stay?"
  const candidates = nodeCards
    .map(card => {
      const t = norm(card.target);
      const words = card.target.split(/\s+/).length;
      let stayScore = 0;

      // Grammar tip confirms this node → stays
      if (card.grammar && confirmer && confirmer.test(card.grammar)) {
        stayScore += 100;
      }

      // Very short simple sentences in node-01 should stay
      if (srcNode === 'node-01' && words <= 3) stayScore += 50;

      // Basic vocab greetings etc. in node-01 should stay
      if (srcNode === 'node-01' && /^(hola|adios|gracias|de nada|si|no|perdon|lo siento|buenos|buenas|hasta|por favor|mucho gusto)/i.test(t)) {
        stayScore += 100;
      }

      // Longer sentences are more likely misclassified
      stayScore -= words * 2;

      return { card, stayScore, words, t };
    })
    .sort((a, b) => a.stayScore - b.stayScore); // lowest stayScore = most likely to move

  let moved = 0;
  for (const { card, stayScore, words, t } of candidates) {
    if (moved >= excess) break;
    if (stayScore >= 50) continue; // confirmed to stay

    // Try to find a better node
    let newNode = null;

    for (const pattern of RECLASSIFY_PATTERNS) {
      if (pattern.node === srcNode) continue;
      // Don't move to an even more overloaded node
      const destCount = deck.filter(c => c.grammarNode === pattern.node).length;
      const destMax = MAX_PER_GOAL[pattern.node] * 1.5;
      if (destCount >= destMax) continue;

      if (pattern.test(t, card.target)) {
        newNode = pattern.node;
        break;
      }
    }

    // If no pattern match, use fallback based on sentence length
    if (!newNode) {
      const fb = fallbackNode(words);
      if (fb !== srcNode) {
        const destCount = deck.filter(c => c.grammarNode === fb).length;
        const destMax = (MAX_PER_GOAL[fb] || 200) * 1.5;
        if (destCount < destMax) {
          newNode = fb;
        }
      }
    }

    if (newNode && newNode !== srcNode) {
      if (!DRY_RUN) {
        card.grammarNode = newNode;
      }
      moved++;
      totalMoved++;
      if (moved <= 5) {
        console.log(`  → ${newNode}: "${card.target.substring(0, 60)}..." (${words}w)`);
      }
    }
  }

  if (moved > 5) console.log(`  ... and ${moved - 5} more`);
  console.log(`  Moved ${moved} cards from ${srcNode}`);
}

// ── Final report ──

console.log(`\n=== After Rebalancing ===`);
console.log(`Total cards moved: ${totalMoved}\n`);

console.log('Node sizes (per goal: general):');
for (const n of nodes) {
  const genCount = deck.filter(c => c.grammarNode === n && c.tags.includes('general')).length;
  const total = deck.filter(c => c.grammarNode === n).length;
  const max = MAX_PER_GOAL[n];
  const status = genCount > max ? '⚠ over' : '✓';
  console.log(`  ${n}: gen=${genCount} total=${total} (max=${max}) ${status}`);
}

// Per-tier summary
const tierLabels = ['A1','A1','A1','A1','A1','A2','A2','A2','A2','A2','B1','B1','B1','B1','B1','B2','B2','B2','B2','B2','C1','C1','C1','C2','C2','C2'];
const tierCounts = {};
for (const card of deck) {
  if (!card.tags.includes('general')) continue;
  const nn = parseInt(card.grammarNode.replace('node-', '')) - 1;
  const tier = tierLabels[nn];
  tierCounts[tier] = (tierCounts[tier] || 0) + 1;
}
console.log('\nPer-tier (general goal):');
for (const [tier, count] of Object.entries(tierCounts)) {
  console.log(`  ${tier}: ${count}`);
}

if (!DRY_RUN) {
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
  console.log('\nDeck saved.');
} else {
  console.log('\n(dry run — no changes)');
}
