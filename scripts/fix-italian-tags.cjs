/**
 * fix-italian-tags.cjs
 * Fix goal tag distribution for Italian deck.
 * Uses prefix-matching (no trailing \b) for Italian word stems.
 */
const fs = require('fs');
const path = require('path');
const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// Italian keyword patterns (prefix match — no trailing \b)
const travelRe = /\b(viagg|aeroporto|spiaggi|treno|treni|museo|ristorante|albergo|hotel|bigliett|valigia|turism|stazion|taxi|metro|città|citt[aà]|paese|paes|montagna|cibo|mangiar|cenar|pranzar|piatt|conto|negozio|comprar|mercato|prezzo|strada|strade|macchina|guidar|volar|arrivar|partir|camminar|lontano|vicino|nord|sud|centro|parco|giardino|fiume|lago|mare|vacanz|ferie|percors|guida|costa|isola|passaporto|dogana|barca|aereo|luogo|clima|sole|pioggia|freddo|caldo|neve|ponte|bosco|deserto|piscina|spiaggia|pizz|gelat|cappuccino|espresso|bar|caffè|caffetteria|panino|trattoria|osteria|pensione|porto|tram|autobus|fermata|mappa|monumento|cattedrale|chiesa|piazza|fontana|colosseo|gondola|bicicletta|scooter|weekend|prenotazion|camera|letto|colazione|pranzo|cena|menu|cucina|ricetta|vino|birra|acqua)\b/i;

const workRe = /\b(lavor|aziend|ufficio|uffici|capo|impiegat|riunion|progett|rapport|contratt|stipendio|salario|orario|squadra|colleg|affar|client|budget|scadenz|dirigent|direttor|profession|carrier|esperienza|presentazion|conferenz|email|posta|document|tecnolog|software|sistema|problema|decider|colloquio|curriculum|posizion|dipartiment|settore|industria|certificat|diploma|laurea|responsabilit|agenda|computer|stampante|informatica|produttiv|efficien|investiment|beneficio|risultat|obiettiv|fattura|vendita|acquisto|compagnia|sede|azione|borsa|economica|finanza|commercio|marketing|strategia|management|consulente|impresa|professore|insegnante|medico|avvocato|ingegnere|architetto|giornalista|sviluppatore|programma|riunirsi|lavoratore|collaborar|organizzar|gestir|coordinare)\b/i;

const familyRe = /\b(famigli|figlio|figlia|padre|madre|fratello|sorella|nonno|nonna|zio|zia|cugino|cugina|nipot|cognato|suocero|bambino|bambina|bimbo|bimba|sposo|sposa|marito|moglie|coppia|fidanzat|matrimonio|nozze|casa|cucina|animale|cane|gatto|vicin|scuola|educazion|crescer|insegnar|giocar|celebr|natale|compleanno|festa|tradizion|mamma|papà|pap[aà]|amor|amar|sentir|emozion|felice|triste|preoccup|aiutar|vita|ricord|foto|storia|dormir|svegliar|lavar|pulir|cucinar|bere|cantar|ballar|rider|pianger|abbracciar|baciar|perdonar|neonato|genitore|genitor|parente|parent|nascere|nascit|bimbi|figli|compito|compiti|scuol|maestr|pannolino|passeggino|culla|giocattolo|giochi|cartone|tv|libro|lettura|legger|raccont|favola|picnic|giardino|cortile|camera|stanza|bagno|letto|divano|televisione|famiglia)\b/i;

let fixed = 0;
for (const c of deck) {
  if (!c.tags || c.tags.length === 0) c.tags = ['general'];
  if (c.tags.length >= 2) continue;

  const text = (c.target + ' ' + c.english).toLowerCase();
  const candidates = [];

  if (travelRe.test(text) && !c.tags.includes('travel')) candidates.push('travel');
  if (workRe.test(text) && !c.tags.includes('work')) candidates.push('work');
  if (familyRe.test(text) && !c.tags.includes('family')) candidates.push('family');

  if (candidates.length > 0) {
    c.tags.push(candidates[0]);
    fixed++;
  } else if (!c.tags.includes('general')) {
    c.tags.push('general');
    fixed++;
  }
}

// Second pass: try to add a third tag for cards that still only have 2
let extraFixed = 0;
for (const c of deck) {
  if (c.tags.length >= 3) continue;
  const text = (c.target + ' ' + c.english).toLowerCase();
  if (travelRe.test(text) && !c.tags.includes('travel')) { c.tags.push('travel'); extraFixed++; continue; }
  if (workRe.test(text) && !c.tags.includes('work')) { c.tags.push('work'); extraFixed++; continue; }
  if (familyRe.test(text) && !c.tags.includes('family')) { c.tags.push('family'); extraFixed++; continue; }
}

console.log(`Fixed ${fixed} single-tag cards, added extra tag to ${extraFixed} two-tag cards`);

// Stats
const goalStats = { general: 0, travel: 0, work: 0, family: 0 };
for (const c of deck) for (const t of c.tags) if (goalStats[t] !== undefined) goalStats[t]++;
console.log('\nGoal tags:');
Object.entries(goalStats).forEach(([g, cnt]) =>
  console.log(`  ${g}: ${cnt} (${Math.round(cnt / deck.length * 100)}%)`)
);

const singleTag = deck.filter(c => c.tags.length === 1).length;
console.log('\nSingle-tag remaining:', singleTag);

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('Written to', DECK_PATH);
