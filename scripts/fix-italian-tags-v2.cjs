/**
 * fix-italian-tags-v2.cjs
 * Aggressive goal tag assignment for Italian deck.
 * For cards that don't match specific keywords, distribute evenly.
 */
const fs = require('fs');
const path = require('path');
const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// Broad keyword detection on BOTH target and English
function detectTags(target, english) {
  const text = (target + ' ' + english).toLowerCase();
  const tags = new Set();

  // Travel — broad patterns
  if (/\b(travel|trip|flight|airport|hotel|beach|tourist|train|bus|station|taxi|city|town|country|mountain|restaurant|food|eat|dinner|lunch|breakfast|menu|bill|shop|buy|market|price|street|car|drive|fly|arrive|leave|walk|far|near|park|garden|river|lake|sea|ocean|vacation|holiday|route|guide|coast|island|passport|customs|boat|plane|weather|sun|rain|cold|hot|snow|bridge|forest|map|museum|church|monument|square|visit|explore|tour|book|reserve|ticket|luggage|suitcase)\b/.test(text)) tags.add('travel');
  if (/\b(viagg|aeroporto|spiaggi|treno|museo|alberg|hotel|bigliett|valigia|turis|stazion|taxi|metro|montagna|ristorante|mangiar|cenar|pranzar|piatt|conto|negozi|comprar|mercato|prezzo|strada|macchina|guidar|volar|arrivar|partir|camminar|parco|lago|mare|vacanz|ferie|costa|isola|passaporto|barca|aereo|sole|pioggia|freddo|caldo|neve|bicicletta|autobus|fermata|piazza|fontana|chiesa|porto|prenotazion|camera|colazione|pranzo|cena|vino|birra|caff[eè]|gelat|pizz|panino)/.test(text)) tags.add('travel');

  // Work — broad patterns
  if (/\b(work|job|office|boss|employee|meeting|project|report|contract|salary|schedule|team|colleague|business|client|budget|deadline|manager|director|career|experience|presentation|conference|email|document|technology|software|problem|decide|interview|resume|position|department|industry|certificate|diploma|degree|responsibility|computer|printer|productivity|efficiency|investment|benefit|result|goal|company|professional|task|assignment)\b/.test(text)) tags.add('work');
  if (/\b(lavor|aziend|uffici|capo|impiegat|riunion|progett|rapport|contratt|stipendio|orari|squadra|colleg|affar|client|budget|scadenz|dirett|profession|carrier|esperienza|conferenz|email|document|tecnolog|software|sistema|problema|colloquio|curriculum|dipartiment|settor|industria|diploma|laurea|responsabilit|computer|stampante|obiettiv|fattura|compagnia|consulente|impresa|professor|insegnante|medico|avvocato|ingegnere|sviluppat|programma|organizzar|gestir)/.test(text)) tags.add('work');

  // Family — broad patterns
  if (/\b(family|son|daughter|father|mother|brother|sister|grandpa|grandma|uncle|aunt|cousin|nephew|niece|baby|child|children|kid|husband|wife|spouse|partner|wedding|marriage|home|house|kitchen|pet|dog|cat|neighbor|school|education|grow|teach|play|celebrate|christmas|birthday|party|tradition|mom|dad|love|feel|emotion|happy|sad|worry|help|life|memory|photo|story|sleep|wake|wash|clean|cook|drink|sing|dance|laugh|cry|hug|kiss|forgive|parent)\b/.test(text)) tags.add('family');
  if (/\b(famigli|figlio|figlia|padre|madre|fratello|sorella|nonno|nonna|zio|zia|cugino|nipot|bambino|bambina|bimbo|sposo|sposa|marito|moglie|coppia|fidanzat|matrimonio|casa|cucina|animale|cane|gatto|vicin|scuola|crescer|insegnar|giocar|celebr|natale|compleanno|festa|tradizion|mamma|pap[aà]|amor|amar|sentir|emozion|felice|triste|preoccup|aiutar|vita|ricord|foto|storia|dormir|svegliar|lavar|pulir|cucinar|bere|cantar|ballar|rider|pianger|abbracciar|baciar|perdonar|genitore|parente|nascere|giocattolo|camera|stanza|bagno|letto|divano)/.test(text)) tags.add('family');

  return [...tags];
}

// Apply tags
let fixed = 0;
for (const c of deck) {
  if (!c.tags || c.tags.length === 0) c.tags = ['general'];

  const detected = detectTags(c.target, c.english);
  for (const tag of detected) {
    if (!c.tags.includes(tag)) {
      c.tags.push(tag);
      fixed++;
    }
  }
}
console.log(`Added ${fixed} tags via keyword detection`);

// For remaining single-tag cards, distribute evenly across tags
// Round-robin assignment based on card ID for determinism
const tagCycle = ['travel', 'work', 'family'];
let distributed = 0;
for (const c of deck) {
  if (c.tags.length >= 2) continue;
  const tag = tagCycle[c.id % 3];
  if (!c.tags.includes(tag)) {
    c.tags.push(tag);
    distributed++;
  }
}
console.log(`Distributed ${distributed} remaining single-tag cards (round-robin)`);

// Stats
const goalStats = { general: 0, travel: 0, work: 0, family: 0 };
for (const c of deck) for (const t of c.tags) if (goalStats[t] !== undefined) goalStats[t]++;
console.log('\nGoal tags:');
Object.entries(goalStats).forEach(([g, cnt]) =>
  console.log(`  ${g}: ${cnt} (${Math.round(cnt / deck.length * 100)}%)`)
);

const singleTag = deck.filter(c => c.tags.length === 1).length;
console.log('\nSingle-tag remaining:', singleTag);
console.log('Total cards:', deck.length);

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('Written to', DECK_PATH);
