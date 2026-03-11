#!/usr/bin/env node
/**
 * Normalize Italian deck to match Spanish shape:
 * 1. Trim nodes 11-20 to match Spanish card counts
 * 2. Fix tag distribution to ~50% per goal (travel/work/family) with thematic distinction
 * 3. Resequence IDs
 */
const fs = require('fs');
const path = require('path');

const IT_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const ES_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');

let itDeck = JSON.parse(fs.readFileSync(IT_PATH, 'utf8'));
const esDeck = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

console.log('=== PHASE 1: TRIM BLOATED NODES ===\n');

// Get Spanish node counts as targets
const esNodeCounts = {};
esDeck.forEach(c => { esNodeCounts[c.grammarNode] = (esNodeCounts[c.grammarNode]||0)+1; });

const itNodeCounts = {};
itDeck.forEach(c => { itNodeCounts[c.grammarNode] = (itNodeCounts[c.grammarNode]||0)+1; });

// Trim nodes 11-20 to match Spanish
let totalTrimmed = 0;
for (let i = 11; i <= 20; i++) {
  const node = 'node-' + String(i).padStart(2, '0');
  const esCount = esNodeCounts[node] || 0;
  const itCount = itNodeCounts[node] || 0;

  if (itCount > esCount) {
    const excess = itCount - esCount;
    // Keep the first esCount cards for this node (they tend to be the originals / higher quality)
    const nodeCards = itDeck.filter(c => c.grammarNode === node);
    const keep = new Set(nodeCards.slice(0, esCount).map(c => c.id));
    const before = itDeck.length;
    itDeck = itDeck.filter(c => c.grammarNode !== node || keep.has(c.id));
    const removed = before - itDeck.length;
    totalTrimmed += removed;
    console.log(`  ${node}: ${itCount} → ${esCount} (trimmed ${removed})`);
  } else {
    console.log(`  ${node}: ${itCount} ≈ ${esCount} (ok)`);
  }
}

console.log(`\n  Total trimmed: ${totalTrimmed}`);
console.log(`  New deck size: ${itDeck.length}\n`);

console.log('=== PHASE 2: FIX TAG DISTRIBUTION ===\n');

// Italian keyword matchers for thematic tagging (like Spanish does)
const TRAVEL_KEYWORDS = [
  // places
  /\b(aeroporto|stazione|hotel|albergo|treno|volo|aereo|autobus|metro|taxi|porto|spiaggia|montagna|museo|ristorante|bar|caffè|piazza|centro|chiesa|castello|palazzo|mercato|farmacia|ospedale|banca|posta|biglietteria)\b/i,
  // travel actions
  /\b(viaggio|viaggio|viaggiare|viaggiamo|viaggiate|viaggiano|visitare|visitiamo|visitato|prenotare|prenotazione|turista|turismo|vacanza|vacanze|ferie|valigia|bagaglio|biglietto|passaporto|mappa|cartina|guida|escursione|gita|crociera|campeggio)\b/i,
  // transport
  /\b(partire|partenza|arrivo|arrivare|decollare|atterrare|imbarco|coincidenza|fermata|ritardo|orario|destinazione|dogana|frontiera|confine)\b/i,
  // countries/cities/directions
  /\b(Italia|Roma|Milano|Firenze|Venezia|Napoli|Spagna|Francia|Germania|Europa|America|paese|città|isola|costa|mare|lago|fiume|nord|sud|est|ovest)\b/i,
  // accommodation
  /\b(camera|stanza|reception|colazione|pensione|ostello|appartamento|affitto|soggiorno)\b/i,
  // food when eating out
  /\b(menù|conto|cameriere|ordinare|tavolo|piatto|specialità|antipasto|primo|secondo|dessert|vino|birra)\b/i,
];

const WORK_KEYWORDS = [
  // workplace
  /\b(ufficio|azienda|impresa|ditta|fabbrica|laboratorio|sede|filiale|reparto|dipartimento)\b/i,
  // roles
  /\b(capo|direttore|manager|collega|dipendente|impiegato|segretaria|presidente|responsabile|coordinatore|assistente|consulente|professionista|lavoratore|operaio|ingegnere|avvocato|medico|professore|dottore)\b/i,
  // work activities
  /\b(lavorare|lavoro|lavori|riunione|progetto|rapporto|relazione|presentazione|contratto|stipendio|salario|scadenza|consegna|obiettivo|risultato|bilancio|budget|profitto|fattura|preventivo)\b/i,
  // business
  /\b(cliente|fornitore|investimento|strategia|mercato|commercio|vendita|acquisto|produzione|gestione|amministrazione|contabilità|marketing|pubblicità|negoziare|proposta|offerta|candidatura|colloquio|assunzione|licenziamento|dimissioni|pensione|promozione|carriera)\b/i,
  // office items
  /\b(computer|email|documento|archivio|stampante|telefono|scrivania|agenda|calendario|appuntamento|pratica|fascicolo)\b/i,
  // professional
  /\b(professionale|aziendale|commerciale|industriale|economico|finanziario)\b/i,
];

const FAMILY_KEYWORDS = [
  // family members
  /\b(famiglia|familiare|famiglie|madre|padre|mamma|papà|figlio|figlia|figli|fratello|sorella|nonno|nonna|nonni|zio|zia|cugino|cugina|nipote|suocero|suocera|cognato|cognata|genitori|parenti|marito|moglie|sposo|sposa|bambino|bambina|bambini|neonato|bebè)\b/i,
  // home life
  /\b(casa|appartamento|cucina|camera|soggiorno|bagno|giardino|terrazza|balcone|garage|cantina|soffitta|divano|letto|tavola|pranzo|cena|colazione|cucinare|pulire|lavare|stirare)\b/i,
  // family events
  /\b(compleanno|matrimonio|battesimo|anniversario|Natale|Pasqua|festa|celebrare|celebrazione|regalo|invitare|invitati|riunione.?di.?famiglia)\b/i,
  // parenting/growing up
  /\b(crescere|educare|educazione|scuola|compiti|asilo|culla|pannolino|giocattolo|giocare|piccolo|grande|giovane|vecchio|infanzia|adolescenza)\b/i,
  // emotions/relationships
  /\b(amore|amare|volere.?bene|abbracciare|abbraccio|bacio|baciare|prendersi.?cura|proteggere|litigare|perdonare|riconciliare|mancare|nostalgia)\b/i,
];

function matchesTheme(text, patterns) {
  return patterns.some(p => p.test(text));
}

// Reset all tags to just general, then assign based on content
let travelCount = 0, workCount = 0, familyCount = 0;

itDeck.forEach(card => {
  const text = card.target + ' ' + card.english;
  const newTags = ['general'];

  const isTravel = matchesTheme(text, TRAVEL_KEYWORDS);
  const isWork = matchesTheme(text, WORK_KEYWORDS);
  const isFamily = matchesTheme(text, FAMILY_KEYWORDS);

  if (isTravel) { newTags.push('travel'); travelCount++; }
  if (isWork) { newTags.push('work'); workCount++; }
  if (isFamily) { newTags.push('family'); familyCount++; }

  card.tags = newTags;
});

console.log('After keyword-based tagging:');
console.log(`  travel: ${travelCount} (${(travelCount/itDeck.length*100).toFixed(1)}%)`);
console.log(`  work:   ${workCount} (${(workCount/itDeck.length*100).toFixed(1)}%)`);
console.log(`  family: ${familyCount} (${(familyCount/itDeck.length*100).toFixed(1)}%)`);

// Target: ~50% per goal. Fill up to target by randomly assigning untagged cards
const TARGET_PCT = 0.52; // slightly above 50% to match Spanish
const target = Math.round(itDeck.length * TARGET_PCT);

function fillGoal(deck, goalTag, currentCount, target) {
  if (currentCount >= target) return currentCount;

  // Get cards that DON'T have this tag yet, shuffled
  const candidates = deck.filter(c => !c.tags.includes(goalTag));
  // Shuffle deterministically
  candidates.sort((a, b) => {
    const ha = (a.id * 2654435761) & 0xFFFFFFFF;
    const hb = (b.id * 2654435761) & 0xFFFFFFFF;
    return ha - hb;
  });

  let added = 0;
  const need = target - currentCount;
  for (let i = 0; i < candidates.length && added < need; i++) {
    candidates[i].tags.push(goalTag);
    added++;
  }
  return currentCount + added;
}

travelCount = fillGoal(itDeck, 'travel', travelCount, target);
workCount = fillGoal(itDeck, 'work', workCount, target);
familyCount = fillGoal(itDeck, 'family', familyCount, target);

console.log('\nAfter fill-up to ~52%:');
console.log(`  travel: ${travelCount} (${(travelCount/itDeck.length*100).toFixed(1)}%)`);
console.log(`  work:   ${workCount} (${(workCount/itDeck.length*100).toFixed(1)}%)`);
console.log(`  family: ${familyCount} (${(familyCount/itDeck.length*100).toFixed(1)}%)`);

// Verify per-node minimum coverage
console.log('\nPer-node goal coverage check:');
const goals = ['travel', 'work', 'family'];
let lowNodes = 0;
for (let i = 1; i <= 35; i++) {
  const n = 'node-' + String(i).padStart(2, '0');
  const nodeCards = itDeck.filter(c => c.grammarNode === n);
  const pcts = goals.map(g => {
    const count = nodeCards.filter(c => c.tags.includes(g)).length;
    return Math.round(count / nodeCards.length * 100);
  });
  const min = Math.min(...pcts);
  if (min < 30) {
    console.log(`  ⚠️ ${n}: travel=${pcts[0]}% work=${pcts[1]}% family=${pcts[2]}%`);
    lowNodes++;
  }
}
if (lowNodes === 0) console.log('  All nodes ≥ 30% per goal ✓');

console.log('\n=== PHASE 3: RESEQUENCE IDS ===\n');

// Sort by grammarNode then preserve relative order
itDeck.sort((a, b) => {
  const na = parseInt(a.grammarNode.replace('node-', ''));
  const nb = parseInt(b.grammarNode.replace('node-', ''));
  if (na !== nb) return na - nb;
  return a.id - b.id;
});

// Resequence
itDeck.forEach((c, i) => {
  c.id = i + 1;
  c.audio = `it-${i + 1}.mp3`;
});

console.log(`Final deck: ${itDeck.length} cards`);
console.log(`ID range: 1-${itDeck.length}`);

// Final stats
console.log('\n=== FINAL DISTRIBUTION ===\n');
console.log('Node     Count   travel   work    family');
console.log('─'.repeat(50));
for (let i = 1; i <= 35; i++) {
  const n = 'node-' + String(i).padStart(2, '0');
  const nodeCards = itDeck.filter(c => c.grammarNode === n);
  const t = nodeCards.filter(c => c.tags.includes('travel')).length;
  const w = nodeCards.filter(c => c.tags.includes('work')).length;
  const f = nodeCards.filter(c => c.tags.includes('family')).length;
  console.log(`${n}  ${String(nodeCards.length).padStart(5)}   ${String(t).padStart(4)}(${Math.round(t/nodeCards.length*100)}%)  ${String(w).padStart(4)}(${Math.round(w/nodeCards.length*100)}%)  ${String(f).padStart(4)}(${Math.round(f/nodeCards.length*100)}%)`);
}

const totT = itDeck.filter(c => c.tags.includes('travel')).length;
const totW = itDeck.filter(c => c.tags.includes('work')).length;
const totF = itDeck.filter(c => c.tags.includes('family')).length;
console.log('─'.repeat(50));
console.log(`TOTAL  ${String(itDeck.length).padStart(5)}   ${String(totT).padStart(4)}(${Math.round(totT/itDeck.length*100)}%)  ${String(totW).padStart(4)}(${Math.round(totW/itDeck.length*100)}%)  ${String(totF).padStart(4)}(${Math.round(totF/itDeck.length*100)}%)`);

// Save
fs.writeFileSync(IT_PATH, JSON.stringify(itDeck, null, 2));
console.log(`\n✅ Saved to ${IT_PATH}`);
