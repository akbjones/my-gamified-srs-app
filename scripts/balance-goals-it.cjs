/**
 * balance-goals-it.cjs
 *
 * Balances all four goals (general, travel, work, family) for the Italian deck.
 * Works at two levels:
 * 1. Node-level: within each grammar node, the 4 goals should be roughly equal
 * 2. Overall: the total per goal should be within 2% of each other
 *
 * Strategy:
 * - Find general-only cards and add the most-needed goal tags based on Italian content keywords
 * - For each node where general exceeds others by >15%, redistribute tags
 * - Never REMOVE a tag — only ADD tags to under-represented goals
 * - Use content-based keyword matching first, then spread remaining evenly
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
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

// ─── Content-based keyword matchers (Italian) ─────────────────

const travelWords = /\b(viaggi|viaggio|hotel|albergo|aeroporto|aereo|volo|spiaggia|valigia|prenotare|prenotazione|turismo|turista|biglietto|bagaglio|destinazione|escursione|passaporto|dogana|treno|autobus|stazione|taxi|metro|città|paese|montagna|museo|monumento|traffico|strada|macchina|guidare|mappa|guida|percorso|ostello|campeggio|crociera|traghetto|costa|isola|frontiera|compagnia|itinerario|stagione|vacanza|ferie|esplorare|sentiero|gastronomia|ristorante|cibo|mangiare|cenare|pranzare|colazione|piatto|menù|conto|mancia|bar|caffè|negozio|comprare|mercato|prezzo|economico|caro|fermata|angolo|clima|tempo|sole|pioggia|freddo|caldo|neve|vento|temperatura|luogo|posto|arrivare|partire|andare|venire|camminare|lontano|vicino|nord|sud|est|ovest|centro|fuori|destra|sinistra|incrocio|via|viale|piazza|parco|giardino|ponte|fiume|lago|bosco|foresta|deserto|mare|oceano|porto|nave|barca|alloggio|soggiorno|cartolina|souvenir|panorama|paesaggio)\b/i;

const workWords = /\b(lavorare|lavoro|azienda|ufficio|capo|direttore|impiegato|riunione|progetto|rapporto|relazione|presentazione|contratto|stipendio|orario|squadra|collega|compagno|affari|cliente|budget|scadenza|data|consegna|gerente|direttrice|produttività|efficienza|rendimento|promozione|licenziare|dimissioni|curriculum|colloquio|posizione|incarico|dipartimento|settore|industria|professione|carriera|esperienza|abilità|competenza|formazione|qualifica|valutazione|obiettivo|traguardo|strategia|pianificazione|organizzazione|gestione|amministrazione|finanza|investimento|profitto|risultato|successo|fallimento|sfida|soluzione|decisione|proposta|accordo|negoziazione|conferenza|seminario|laboratorio|certificato|diploma|laurea|responsabilità|impegno|agenda|email|posta|documento|archivio|tecnologia|software|sistema|problema|decidere|pensare|credere|sapere|capire|spiegare|imparare|studiare|scrivere|leggere|rispondere|chiedere|inviare|comunicare|importante|necessario|possibile|impossibile|difficile|facile|migliore|peggiore|primo|ultimo|prossimo|precedente)\b/i;

const familyWords = /\b(famiglia|figlio|figlia|padre|madre|fratello|sorella|nonno|nonna|zio|zia|cugino|cugina|nipote|cognato|cognata|suocero|suocera|genero|nuora|bambino|bambina|neonato|marito|moglie|coppia|fidanzato|fidanzata|matrimonio|sposarsi|divorzio|casa|cucina|giardino|animale|cane|gatto|vicino|quartiere|comunità|scuola|educazione|crescere|curare|proteggere|insegnare|giocare|condividere|festeggiare|natale|compleanno|festa|tradizione|eredità|generazione|convivenza|infanzia|gravidanza|nascita|anniversario|mamma|papà|amore|amare|volere|sentire|emozione|felice|triste|contento|preoccupare|aiutare|vivere|vita|ricordo|memoria|foto|storia|abitudine|cena|pranzo|colazione|dormire|svegliare|alzarsi|lavare|pulire|cucinare|preparare|bere|cantare|ballare|ridere|piangere|abbracciare|baciare|mancare|perdonare|parente|parentela)\b/i;

const keywordMap = {
  travel: travelWords,
  work: workWords,
  family: familyWords,
};

// ─── Step 1: Node-level balancing ─────────────────────────────

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
      const remaining = candidates
        .filter(c => !c.tags.includes(goal))
        .sort((a, b) => a.tags.length - b.tags.length);

      for (const card of remaining) {
        if (added >= needed) break;
        card.tags.push(goal);
        added++;
      }
    }

    if (added > 0) {
      totalRetagged += added;
      if (added >= 3) {
        console.log(`  ${node} +${goal}: ${added} cards (was ${counts[goal]}, now ${counts[goal] + added})`);
      }
    }
  }

  // Also bring general up if it's under-represented
  if (counts.general < nonGenAvg) {
    const needed = nonGenAvg - counts.general;
    const candidates = nodeCards.filter(c => !c.tags.includes('general'));
    let added = 0;
    for (const card of candidates) {
      if (added >= needed) break;
      card.tags.push('general');
      added++;
    }
    if (added > 0) totalRetagged += added;
  }
}

console.log(`\nTotal retagged at node level: ${totalRetagged}`);

// ─── Step 2: Global balancing (fine-tune) ─────────────────────

console.log('\n=== After Node-Level ===');
for (const g of GOALS) console.log(`  ${g.padEnd(8)}: ${goalCount(g)}`);

// Find the overall target (avg of the max)
const globalCounts = GOALS.map(g => goalCount(g));
const globalMax = Math.max(...globalCounts);
const globalTarget = Math.round(globalMax * 0.95);

let globalRetagged = 0;

for (const goal of GOALS) {
  const current = goalCount(goal);
  if (current >= globalTarget) continue;

  const needed = globalTarget - current;
  // Find cards without this tag, prefer those with fewer tags
  const candidates = deck
    .filter(c => !c.tags.includes(goal))
    .sort((a, b) => a.tags.length - b.tags.length);

  let added = 0;

  // First pass: keyword match
  if (goal !== 'general') {
    const keywords = keywordMap[goal];
    for (const card of candidates) {
      if (added >= needed) break;
      const text = (card.target + ' ' + card.english).toLowerCase();
      if (keywords.test(text)) {
        card.tags.push(goal);
        added++;
      }
    }
  }

  // Second pass: spread remaining
  if (added < needed) {
    const remaining = candidates.filter(c => !c.tags.includes(goal));
    for (const card of remaining) {
      if (added >= needed) break;
      card.tags.push(goal);
      added++;
    }
  }

  globalRetagged += added;
}

console.log(`\nGlobal retagged: ${globalRetagged}`);

console.log('\n=== Final Counts ===');
for (const g of GOALS) console.log(`  ${g.padEnd(8)}: ${goalCount(g)}`);

// ─── Write ────────────────────────────────────────────────────

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log(`\nWrote ${deck.length} cards to ${DECK_PATH}`);
