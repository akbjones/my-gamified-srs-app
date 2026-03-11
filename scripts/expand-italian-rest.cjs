/**
 * expand-italian-rest.cjs
 *
 * Adds ~1665 new cards to the Italian deck for nodes
 * 01, 02, 03, 04, 05, 08, 09, 14 to match Spanish distribution.
 *
 * Run:  node scripts/expand-italian-rest.cjs
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');

// ────────────────────────────────────────────
// Node 01 — Presente indicativo (~68 new cards)
// Less common verbs: correre, crescere, cadere, scendere, salire, nascere,
// morire, scegliere, spegnere, accendere, rompere, proteggere, raccogliere,
// proporre, produrre, tradurre, attrarre
// ────────────────────────────────────────────
const node01 = [
  // correre
  { target: "Corro ogni mattina al parco.", english: "I run every morning in the park.", tags: ["general", "travel"] },
  { target: "Tu corri troppo veloce.", english: "You run too fast.", tags: ["general", "family"] },
  { target: "Lui corre la maratona.", english: "He runs the marathon.", tags: ["general", "travel"] },
  { target: "Corriamo insieme dopo il lavoro.", english: "We run together after work.", tags: ["general", "work"] },
  // crescere
  { target: "I bambini crescono in fretta.", english: "Children grow up fast.", tags: ["general", "family"] },
  { target: "Cresco in una famiglia grande.", english: "I grow up in a big family.", tags: ["general", "family"] },
  { target: "Questa pianta cresce bene al sole.", english: "This plant grows well in the sun.", tags: ["general", "family"] },
  { target: "I prezzi crescono ogni anno.", english: "Prices go up every year.", tags: ["general", "work"] },
  // cadere
  { target: "Le foglie cadono in autunno.", english: "The leaves fall in autumn.", tags: ["general", "travel"] },
  { target: "Cado sempre sulle scale.", english: "I always fall on the stairs.", tags: ["general", "family"] },
  { target: "Il bicchiere cade dal tavolo.", english: "The glass falls off the table.", tags: ["general", "family"] },
  { target: "Non cadere sulla neve!", english: "Don't fall on the snow!", tags: ["general", "travel"] },
  // scendere
  { target: "Scendo le scale a piedi.", english: "I go down the stairs on foot.", tags: ["general", "family"] },
  { target: "Scendiamo alla prossima fermata.", english: "We get off at the next stop.", tags: ["general", "travel"] },
  { target: "Lui scende dal treno.", english: "He gets off the train.", tags: ["general", "travel"] },
  { target: "La temperatura scende di notte.", english: "The temperature drops at night.", tags: ["general", "travel"] },
  // salire
  { target: "Salgo sull'autobus ogni mattina.", english: "I get on the bus every morning.", tags: ["general", "travel"] },
  { target: "Saliamo al terzo piano.", english: "We go up to the third floor.", tags: ["general", "work"] },
  { target: "Lei sale le scale di corsa.", english: "She runs up the stairs.", tags: ["general", "family"] },
  { target: "I prezzi salgono troppo.", english: "Prices rise too much.", tags: ["general", "work"] },
  // nascere
  { target: "Mia figlia nasce a marzo.", english: "My daughter is born in March.", tags: ["general", "family"] },
  { target: "Nascono tanti bambini qui.", english: "Many babies are born here.", tags: ["general", "family"] },
  { target: "Dove nasci tu?", english: "Where are you born?", tags: ["general", "travel"] },
  { target: "Le idee nascono dalla curiosità.", english: "Ideas are born from curiosity.", tags: ["general", "work"] },
  // morire
  { target: "Muoio di fame!", english: "I'm starving!", tags: ["general", "family"] },
  { target: "Le piante muoiono senza acqua.", english: "Plants die without water.", tags: ["general", "family"] },
  { target: "Muoio dal caldo oggi.", english: "I'm dying from the heat today.", tags: ["general", "travel"] },
  { target: "Questo telefono muore sempre.", english: "This phone always dies.", tags: ["general", "work"] },
  // scegliere
  { target: "Scelgo sempre il gelato.", english: "I always choose ice cream.", tags: ["general", "travel"] },
  { target: "Tu scegli il ristorante stasera.", english: "You choose the restaurant tonight.", tags: ["general", "travel"] },
  { target: "Lei sceglie con cura.", english: "She chooses carefully.", tags: ["general", "work"] },
  { target: "Scegliamo il regalo insieme.", english: "We choose the gift together.", tags: ["general", "family"] },
  // spegnere
  { target: "Spengo la luce prima di dormire.", english: "I turn off the light before sleeping.", tags: ["general", "family"] },
  { target: "Spegni il telefono, per favore.", english: "Turn off your phone, please.", tags: ["general", "work"] },
  { target: "Lui spegne il computer.", english: "He turns off the computer.", tags: ["general", "work"] },
  { target: "Spegniamo la televisione.", english: "We turn off the television.", tags: ["general", "family"] },
  // accendere
  { target: "Accendo il forno per la cena.", english: "I turn on the oven for dinner.", tags: ["general", "family"] },
  { target: "Accendi la radio, per favore.", english: "Turn on the radio, please.", tags: ["general", "family"] },
  { target: "Lei accende il computer al lavoro.", english: "She turns on the computer at work.", tags: ["general", "work"] },
  { target: "Accendiamo le luci di Natale.", english: "We turn on the Christmas lights.", tags: ["general", "family"] },
  // rompere
  { target: "Rompo sempre i bicchieri.", english: "I always break glasses.", tags: ["general", "family"] },
  { target: "Il bambino rompe i giocattoli.", english: "The child breaks the toys.", tags: ["general", "family"] },
  { target: "Non rompere quella tazza!", english: "Don't break that cup!", tags: ["general", "family"] },
  { target: "Si rompono facilmente.", english: "They break easily.", tags: ["general", "work"] },
  // proteggere
  { target: "Proteggo la mia famiglia.", english: "I protect my family.", tags: ["general", "family"] },
  { target: "Questa crema protegge dal sole.", english: "This cream protects from the sun.", tags: ["general", "travel"] },
  { target: "Proteggiamo l'ambiente.", english: "We protect the environment.", tags: ["general", "work"] },
  { target: "Lui protegge i suoi amici.", english: "He protects his friends.", tags: ["general", "family"] },
  // raccogliere
  { target: "Raccolgo i fiori nel giardino.", english: "I pick flowers in the garden.", tags: ["general", "family"] },
  { target: "Raccogliamo le mele in autunno.", english: "We pick apples in autumn.", tags: ["general", "travel"] },
  { target: "Lui raccoglie i documenti.", english: "He collects the documents.", tags: ["general", "work"] },
  { target: "Raccolgono le firme per la petizione.", english: "They collect signatures for the petition.", tags: ["general", "work"] },
  // proporre
  { target: "Propongo un'idea nuova.", english: "I propose a new idea.", tags: ["general", "work"] },
  { target: "Lei propone un cambiamento.", english: "She proposes a change.", tags: ["general", "work"] },
  { target: "Proponiamo una soluzione diversa.", english: "We propose a different solution.", tags: ["general", "work"] },
  { target: "Cosa proponi per domani?", english: "What do you suggest for tomorrow?", tags: ["general", "travel"] },
  // produrre
  { target: "L'Italia produce vino eccellente.", english: "Italy produces excellent wine.", tags: ["general", "travel"] },
  { target: "Questa fabbrica produce scarpe.", english: "This factory produces shoes.", tags: ["general", "work"] },
  { target: "Produciamo troppi rifiuti.", english: "We produce too much waste.", tags: ["general", "work"] },
  { target: "Producono energia solare.", english: "They produce solar energy.", tags: ["general", "work"] },
  // tradurre
  { target: "Traduco dall'inglese all'italiano.", english: "I translate from English to Italian.", tags: ["general", "work"] },
  { target: "Lui traduce libri per lavoro.", english: "He translates books for a living.", tags: ["general", "work"] },
  { target: "Traduciamo questo documento.", english: "We translate this document.", tags: ["general", "work"] },
  { target: "Come si traduce questa parola?", english: "How do you translate this word?", tags: ["general", "travel"] },
  // attrarre
  { target: "Roma attrae milioni di turisti.", english: "Rome attracts millions of tourists.", tags: ["general", "travel"] },
  { target: "Questo museo attrae molte persone.", english: "This museum attracts many people.", tags: ["general", "travel"] },
  { target: "Mi attrae la cultura italiana.", english: "Italian culture attracts me.", tags: ["general", "travel"] },
  { target: "Attraiamo clienti nuovi ogni mese.", english: "We attract new clients every month.", tags: ["general", "work"] },
  // mixed extra
  { target: "I fiori crescono nel giardino.", english: "The flowers grow in the garden.", tags: ["general", "family"] },
  { target: "Scelgono il volo più economico.", english: "They choose the cheapest flight.", tags: ["general", "travel"] },
  { target: "Lui produce documentari.", english: "He produces documentaries.", tags: ["general", "work"] },
  { target: "Correte troppo in fretta!", english: "You all run too fast!", tags: ["general", "family"] },
];

// ────────────────────────────────────────────
// Node 02 — Essere vs stare (~260 new cards)
// ────────────────────────────────────────────
const node02 = [
  // ── Essere: identity ──
  { target: "È un professore di storia.", english: "He is a history professor.", tags: ["general", "work"] },
  { target: "Sei una persona speciale.", english: "You are a special person.", tags: ["general", "family"] },
  { target: "Sono un principiante.", english: "I am a beginner.", tags: ["general", "travel"] },
  { target: "Siamo studenti universitari.", english: "We are university students.", tags: ["general", "work"] },
  { target: "È un bravo cuoco.", english: "He is a good cook.", tags: ["general", "family"] },
  { target: "Siete i nuovi colleghi?", english: "Are you the new colleagues?", tags: ["general", "work"] },
  { target: "Sono il fratello di Marco.", english: "I am Marco's brother.", tags: ["general", "family"] },
  { target: "È la mia migliore amica.", english: "She is my best friend.", tags: ["general", "family"] },
  { target: "Siamo una coppia felice.", english: "We are a happy couple.", tags: ["general", "family"] },
  { target: "È un artista famoso.", english: "He is a famous artist.", tags: ["general", "work"] },

  // ── Essere: origin ──
  { target: "Siamo di Napoli.", english: "We are from Naples.", tags: ["general", "travel"] },
  { target: "Sono di Roma.", english: "I am from Rome.", tags: ["general", "travel"] },
  { target: "Di dove sei?", english: "Where are you from?", tags: ["general", "travel"] },
  { target: "Lui è di Milano.", english: "He is from Milan.", tags: ["general", "travel"] },
  { target: "Lei è di Firenze.", english: "She is from Florence.", tags: ["general", "travel"] },
  { target: "Siete di qui?", english: "Are you from here?", tags: ["general", "travel"] },
  { target: "Sono di un paese piccolo.", english: "I am from a small town.", tags: ["general", "travel"] },
  { target: "Non siamo di questa città.", english: "We are not from this city.", tags: ["general", "travel"] },
  { target: "È di Venezia originariamente.", english: "He is from Venice originally.", tags: ["general", "travel"] },
  { target: "Loro sono del sud Italia.", english: "They are from southern Italy.", tags: ["general", "travel"] },

  // ── Essere: nationality ──
  { target: "È francese.", english: "He is French.", tags: ["general", "travel"] },
  { target: "Sono americano.", english: "I am American.", tags: ["general", "travel"] },
  { target: "Siamo italiani.", english: "We are Italian.", tags: ["general", "travel"] },
  { target: "Lei è tedesca.", english: "She is German.", tags: ["general", "travel"] },
  { target: "Sei spagnolo?", english: "Are you Spanish?", tags: ["general", "travel"] },
  { target: "Sono giapponese.", english: "I am Japanese.", tags: ["general", "travel"] },
  { target: "Loro sono brasiliani.", english: "They are Brazilian.", tags: ["general", "travel"] },
  { target: "Siete inglesi?", english: "Are you English?", tags: ["general", "travel"] },
  { target: "Lui è canadese.", english: "He is Canadian.", tags: ["general", "travel"] },
  { target: "Lei è australiana.", english: "She is Australian.", tags: ["general", "travel"] },

  // ── Essere: profession ──
  { target: "Sono avvocato.", english: "I am a lawyer.", tags: ["general", "work"] },
  { target: "È medico.", english: "He is a doctor.", tags: ["general", "work"] },
  { target: "Siamo ingegneri.", english: "We are engineers.", tags: ["general", "work"] },
  { target: "Lei è architetto.", english: "She is an architect.", tags: ["general", "work"] },
  { target: "Sei insegnante?", english: "Are you a teacher?", tags: ["general", "work"] },
  { target: "Sono infermiera.", english: "I am a nurse.", tags: ["general", "work"] },
  { target: "Lui è giornalista.", english: "He is a journalist.", tags: ["general", "work"] },
  { target: "Siete musicisti?", english: "Are you musicians?", tags: ["general", "work"] },
  { target: "Loro sono commercianti.", english: "They are merchants.", tags: ["general", "work"] },
  { target: "È un poliziotto.", english: "He is a police officer.", tags: ["general", "work"] },

  // ── Essere: physical descriptions ──
  { target: "È alto e magro.", english: "He is tall and thin.", tags: ["general", "family"] },
  { target: "Sei molto bella oggi.", english: "You are very beautiful today.", tags: ["general", "family"] },
  { target: "I miei occhi sono verdi.", english: "My eyes are green.", tags: ["general", "family"] },
  { target: "Lui è basso e robusto.", english: "He is short and stocky.", tags: ["general", "family"] },
  { target: "Lei è bionda con gli occhi azzurri.", english: "She is blonde with blue eyes.", tags: ["general", "family"] },
  { target: "Sono troppo magra.", english: "I am too thin.", tags: ["general", "family"] },
  { target: "I capelli sono lunghi e neri.", english: "The hair is long and black.", tags: ["general", "family"] },
  { target: "Mio nonno è molto alto.", english: "My grandfather is very tall.", tags: ["general", "family"] },
  { target: "È giovane e sportivo.", english: "He is young and athletic.", tags: ["general", "family"] },
  { target: "Siamo tutti bruni in famiglia.", english: "We are all dark-haired in the family.", tags: ["general", "family"] },

  // ── Essere: personality ──
  { target: "Sono timido.", english: "I am shy.", tags: ["general", "family"] },
  { target: "Lei è molto gentile.", english: "She is very kind.", tags: ["general", "family"] },
  { target: "Sei troppo generoso.", english: "You are too generous.", tags: ["general", "family"] },
  { target: "Lui è testardo.", english: "He is stubborn.", tags: ["general", "family"] },
  { target: "Siamo curiosi di natura.", english: "We are curious by nature.", tags: ["general", "family"] },
  { target: "È una persona paziente.", english: "He is a patient person.", tags: ["general", "work"] },
  { target: "Sei coraggiosa.", english: "You are brave.", tags: ["general", "family"] },
  { target: "Sono pigro il fine settimana.", english: "I am lazy on weekends.", tags: ["general", "family"] },
  { target: "Lei è molto intelligente.", english: "She is very intelligent.", tags: ["general", "work"] },
  { target: "Loro sono simpatici.", english: "They are nice.", tags: ["general", "family"] },

  // ── Essere: time ──
  { target: "Sono le otto.", english: "It's eight o'clock.", tags: ["general", "work"] },
  { target: "È l'una.", english: "It's one o'clock.", tags: ["general", "work"] },
  { target: "Sono le dieci e mezza.", english: "It's ten thirty.", tags: ["general", "work"] },
  { target: "Che ora è?", english: "What time is it?", tags: ["general", "travel"] },
  { target: "Sono le tre del pomeriggio.", english: "It's three in the afternoon.", tags: ["general", "work"] },
  { target: "È mezzogiorno.", english: "It's noon.", tags: ["general", "work"] },
  { target: "È mezzanotte.", english: "It's midnight.", tags: ["general", "family"] },
  { target: "Sono le sette meno un quarto.", english: "It's a quarter to seven.", tags: ["general", "work"] },
  { target: "Sono le cinque e un quarto.", english: "It's a quarter past five.", tags: ["general", "work"] },
  { target: "È tardi, sono le undici.", english: "It's late, it's eleven.", tags: ["general", "family"] },

  // ── Essere: location of events ──
  { target: "Il concerto è al teatro.", english: "The concert is at the theater.", tags: ["general", "travel"] },
  { target: "La festa è a casa mia.", english: "The party is at my house.", tags: ["general", "family"] },
  { target: "La riunione è in ufficio.", english: "The meeting is in the office.", tags: ["general", "work"] },
  { target: "Il matrimonio è in chiesa.", english: "The wedding is in the church.", tags: ["general", "family"] },
  { target: "La lezione è nell'aula grande.", english: "The class is in the big room.", tags: ["general", "work"] },
  { target: "La partita è allo stadio.", english: "The game is at the stadium.", tags: ["general", "travel"] },
  { target: "La mostra è al museo.", english: "The exhibition is at the museum.", tags: ["general", "travel"] },
  { target: "Il corso è online.", english: "The course is online.", tags: ["general", "work"] },
  { target: "Dov'è la conferenza?", english: "Where is the conference?", tags: ["general", "work"] },
  { target: "La cena è al ristorante.", english: "The dinner is at the restaurant.", tags: ["general", "travel"] },

  // ── Essere: material ──
  { target: "È di legno.", english: "It's made of wood.", tags: ["general", "family"] },
  { target: "Questa borsa è di pelle.", english: "This bag is made of leather.", tags: ["general", "travel"] },
  { target: "Il tavolo è di vetro.", english: "The table is made of glass.", tags: ["general", "family"] },
  { target: "L'anello è d'oro.", english: "The ring is made of gold.", tags: ["general", "family"] },
  { target: "La camicia è di cotone.", english: "The shirt is made of cotton.", tags: ["general", "travel"] },

  // ── Essere: cost ──
  { target: "Quant'è?", english: "How much is it?", tags: ["general", "travel"] },
  { target: "Sono venti euro in tutto.", english: "It's twenty euros in total.", tags: ["general", "travel"] },
  { target: "Quant'è il conto?", english: "How much is the bill?", tags: ["general", "travel"] },
  { target: "È troppo caro.", english: "It's too expensive.", tags: ["general", "travel"] },
  { target: "Non è un prezzo giusto.", english: "It's not a fair price.", tags: ["general", "travel"] },

  // ── Essere: passive ──
  { target: "È stato costruito nel Medioevo.", english: "It was built in the Middle Ages.", tags: ["general", "travel"] },
  { target: "La cena è stata preparata da lei.", english: "Dinner was prepared by her.", tags: ["general", "family"] },
  { target: "Il libro è stato scritto in italiano.", english: "The book was written in Italian.", tags: ["general", "work"] },
  { target: "Le porte sono state chiuse.", english: "The doors were closed.", tags: ["general", "work"] },
  { target: "La lettera è stata spedita ieri.", english: "The letter was sent yesterday.", tags: ["general", "work"] },

  // ── Stare: health ──
  { target: "Sto bene, grazie.", english: "I'm fine, thanks.", tags: ["general", "travel"] },
  { target: "Come stai?", english: "How are you?", tags: ["general", "travel"] },
  { target: "Sto male oggi.", english: "I feel sick today.", tags: ["general", "family"] },
  { target: "Sta meglio adesso.", english: "He feels better now.", tags: ["general", "family"] },
  { target: "Sto peggio di ieri.", english: "I feel worse than yesterday.", tags: ["general", "family"] },
  { target: "Stanno tutti bene?", english: "Is everyone doing well?", tags: ["general", "family"] },
  { target: "Mia madre sta benissimo.", english: "My mother is doing great.", tags: ["general", "family"] },
  { target: "Non sto molto bene.", english: "I'm not doing very well.", tags: ["general", "family"] },
  { target: "Il nonno sta un po' meglio.", english: "Grandpa is a little better.", tags: ["general", "family"] },
  { target: "Come sta tuo padre?", english: "How is your father?", tags: ["general", "family"] },

  // ── Stare: progressive ──
  { target: "Sto cucinando la cena.", english: "I'm cooking dinner.", tags: ["general", "family"] },
  { target: "Stai studiando troppo.", english: "You're studying too much.", tags: ["general", "work"] },
  { target: "Sta leggendo un libro.", english: "He's reading a book.", tags: ["general", "family"] },
  { target: "Stiamo aspettando il treno.", english: "We're waiting for the train.", tags: ["general", "travel"] },
  { target: "State guardando la partita?", english: "Are you watching the game?", tags: ["general", "family"] },
  { target: "Stanno parlando al telefono.", english: "They're talking on the phone.", tags: ["general", "work"] },
  { target: "Sto lavorando da casa oggi.", english: "I'm working from home today.", tags: ["general", "work"] },
  { target: "Sta dormendo il bambino.", english: "The baby is sleeping.", tags: ["general", "family"] },
  { target: "Stiamo preparando tutto.", english: "We're preparing everything.", tags: ["general", "work"] },
  { target: "Stai ascoltando la musica?", english: "Are you listening to music?", tags: ["general", "family"] },
  { target: "Sto scrivendo una email.", english: "I'm writing an email.", tags: ["general", "work"] },
  { target: "Sta mangiando al ristorante.", english: "She's eating at the restaurant.", tags: ["general", "travel"] },
  { target: "Stiamo imparando l'italiano.", english: "We're learning Italian.", tags: ["general", "travel"] },
  { target: "Stanno giocando in giardino.", english: "They're playing in the garden.", tags: ["general", "family"] },
  { target: "Sto cercando le chiavi.", english: "I'm looking for the keys.", tags: ["general", "family"] },

  // ── Stare: temporary states ──
  { target: "Sta piovendo forte.", english: "It's raining hard.", tags: ["general", "travel"] },
  { target: "Sta nevicando fuori.", english: "It's snowing outside.", tags: ["general", "travel"] },
  { target: "Il tempo sta cambiando.", english: "The weather is changing.", tags: ["general", "travel"] },
  { target: "La situazione sta migliorando.", english: "The situation is improving.", tags: ["general", "work"] },
  { target: "Sta diventando buio.", english: "It's getting dark.", tags: ["general", "travel"] },

  // ── Stare: fixed expressions ──
  { target: "Stai attento alla strada!", english: "Watch out for the road!", tags: ["general", "travel"] },
  { target: "State zitti, per favore.", english: "Be quiet, please.", tags: ["general", "work"] },
  { target: "Stai fermo un momento.", english: "Stay still for a moment.", tags: ["general", "family"] },
  { target: "Stai tranquillo, va tutto bene.", english: "Don't worry, everything's fine.", tags: ["general", "family"] },
  { target: "Stai comodo qui?", english: "Are you comfortable here?", tags: ["general", "travel"] },
  { target: "State attenti ai bagagli.", english: "Be careful with the luggage.", tags: ["general", "travel"] },
  { target: "Sta' zitto un attimo.", english: "Be quiet for a second.", tags: ["general", "family"] },
  { target: "Stai calmo e ascolta.", english: "Stay calm and listen.", tags: ["general", "work"] },

  // ── Stare per (about to) ──
  { target: "Sto per uscire.", english: "I'm about to go out.", tags: ["general", "family"] },
  { target: "Sta per piovere.", english: "It's about to rain.", tags: ["general", "travel"] },
  { target: "Stiamo per partire.", english: "We're about to leave.", tags: ["general", "travel"] },
  { target: "Il film sta per iniziare.", english: "The movie is about to start.", tags: ["general", "travel"] },
  { target: "Stanno per arrivare.", english: "They're about to arrive.", tags: ["general", "family"] },
  { target: "Sto per finire il lavoro.", english: "I'm about to finish work.", tags: ["general", "work"] },
  { target: "Il treno sta per partire.", english: "The train is about to depart.", tags: ["general", "travel"] },
  { target: "Stai per mangiare?", english: "Are you about to eat?", tags: ["general", "family"] },
  { target: "Sta per chiudere il negozio.", english: "The shop is about to close.", tags: ["general", "travel"] },
  { target: "Stiamo per cenare.", english: "We're about to have dinner.", tags: ["general", "family"] },

  // ── C'è / ci sono ──
  { target: "C'è un problema.", english: "There is a problem.", tags: ["general", "work"] },
  { target: "Ci sono molte persone.", english: "There are many people.", tags: ["general", "travel"] },
  { target: "Non c'era nessuno.", english: "There was nobody.", tags: ["general", "travel"] },
  { target: "C'erano due gatti nel giardino.", english: "There were two cats in the garden.", tags: ["general", "family"] },
  { target: "C'è un ristorante qui vicino?", english: "Is there a restaurant nearby?", tags: ["general", "travel"] },
  { target: "Ci sono tre camere in casa.", english: "There are three rooms in the house.", tags: ["general", "family"] },
  { target: "C'è qualcuno in casa?", english: "Is anyone home?", tags: ["general", "family"] },
  { target: "Non ci sono biglietti.", english: "There are no tickets.", tags: ["general", "travel"] },
  { target: "C'è una farmacia in centro.", english: "There is a pharmacy downtown.", tags: ["general", "travel"] },
  { target: "Ci sono molti turisti in estate.", english: "There are many tourists in summer.", tags: ["general", "travel"] },
  { target: "C'è tempo per un caffè?", english: "Is there time for a coffee?", tags: ["general", "work"] },
  { target: "Ci sono novità?", english: "Is there any news?", tags: ["general", "work"] },
  { target: "C'era una volta un re.", english: "Once upon a time there was a king.", tags: ["general", "family"] },
  { target: "Non c'è problema.", english: "No problem.", tags: ["general", "travel"] },
  { target: "Ci sono ancora posti liberi?", english: "Are there still free seats?", tags: ["general", "travel"] },
  { target: "C'è molto traffico oggi.", english: "There is a lot of traffic today.", tags: ["general", "travel"] },
  { target: "Non ci sono scuse.", english: "There are no excuses.", tags: ["general", "work"] },
  { target: "C'è un supermercato vicino.", english: "There is a supermarket nearby.", tags: ["general", "travel"] },
  { target: "Ci sono dei biscotti in cucina.", english: "There are some cookies in the kitchen.", tags: ["general", "family"] },
  { target: "C'è una riunione alle tre.", english: "There is a meeting at three.", tags: ["general", "work"] },

  // ── Contrast sentences ──
  { target: "Sono stanco, ma sto bene.", english: "I'm tired, but I'm doing well.", tags: ["general", "family"] },
  { target: "È italiano ma sta in Francia.", english: "He's Italian but he's living in France.", tags: ["general", "travel"] },
  { target: "Sei pronto? Stiamo per uscire.", english: "Are you ready? We're about to leave.", tags: ["general", "family"] },
  { target: "È un bel posto, ci sto bene.", english: "It's a nice place, I'm happy here.", tags: ["general", "travel"] },
  { target: "Il concerto è domani e sto provando.", english: "The concert is tomorrow and I'm rehearsing.", tags: ["general", "work"] },
  { target: "È inverno ma oggi non sta facendo freddo.", english: "It's winter but it's not cold today.", tags: ["general", "travel"] },
  { target: "Siamo amici e stiamo bene insieme.", english: "We are friends and we get along well.", tags: ["general", "family"] },
  { target: "È una situazione difficile, sto cercando aiuto.", english: "It's a difficult situation, I'm looking for help.", tags: ["general", "work"] },
  { target: "Non sono di qui, sto solo visitando.", english: "I'm not from here, I'm just visiting.", tags: ["general", "travel"] },
  { target: "La lezione è alle dieci e sto arrivando.", english: "The class is at ten and I'm on my way.", tags: ["general", "work"] },

  // ── Extra essere sentences ──
  { target: "Questo vino è ottimo.", english: "This wine is excellent.", tags: ["general", "travel"] },
  { target: "È importante studiare ogni giorno.", english: "It's important to study every day.", tags: ["general", "work"] },
  { target: "Siamo pronti per la vacanza.", english: "We are ready for the vacation.", tags: ["general", "travel"] },
  { target: "Sei sicuro?", english: "Are you sure?", tags: ["general", "work"] },
  { target: "È il mio compleanno domani.", english: "It's my birthday tomorrow.", tags: ["general", "family"] },
  { target: "Non è colpa mia.", english: "It's not my fault.", tags: ["general", "family"] },
  { target: "È vero quello che dici.", english: "What you say is true.", tags: ["general", "work"] },
  { target: "Siamo fortunati.", english: "We are lucky.", tags: ["general", "family"] },
  { target: "Sono contento di vederti.", english: "I am happy to see you.", tags: ["general", "family"] },
  { target: "È il miglior ristorante della città.", english: "It's the best restaurant in the city.", tags: ["general", "travel"] },
  { target: "Sono d'accordo con te.", english: "I agree with you.", tags: ["general", "work"] },
  { target: "Non è facile imparare una lingua.", english: "It's not easy to learn a language.", tags: ["general", "work"] },
  { target: "Siete tutti invitati.", english: "You are all invited.", tags: ["general", "family"] },
  { target: "È un peccato.", english: "It's a shame.", tags: ["general", "family"] },
  { target: "Il problema è complicato.", english: "The problem is complicated.", tags: ["general", "work"] },

  // ── Extra stare sentences ──
  { target: "Come state?", english: "How are you all?", tags: ["general", "travel"] },
  { target: "Sto benissimo, grazie.", english: "I'm doing great, thanks.", tags: ["general", "travel"] },
  { target: "Sta studiando medicina.", english: "She's studying medicine.", tags: ["general", "work"] },
  { target: "Stiamo organizzando una festa.", english: "We're organizing a party.", tags: ["general", "family"] },
  { target: "Stai scherzando?", english: "Are you kidding?", tags: ["general", "family"] },
  { target: "Sta andando tutto bene.", english: "Everything is going well.", tags: ["general", "work"] },
  { target: "Sto pensando a te.", english: "I'm thinking about you.", tags: ["general", "family"] },
  { target: "Stanno costruendo un palazzo nuovo.", english: "They're building a new building.", tags: ["general", "work"] },
  { target: "Sto provando un vestito.", english: "I'm trying on a dress.", tags: ["general", "travel"] },
  { target: "Sta piovendo da due ore.", english: "It's been raining for two hours.", tags: ["general", "travel"] },
  { target: "Stiamo facendo colazione.", english: "We're having breakfast.", tags: ["general", "family"] },
  { target: "Sto guardando un film.", english: "I'm watching a movie.", tags: ["general", "family"] },
  { target: "Sta camminando verso casa.", english: "He's walking home.", tags: ["general", "travel"] },
  { target: "Stai lavorando troppo.", english: "You're working too much.", tags: ["general", "work"] },
  { target: "Stiamo risparmiando per le vacanze.", english: "We're saving for the holidays.", tags: ["general", "travel"] },

  // ── More c'è/ci sono ──
  { target: "C'è un pacco per te.", english: "There is a package for you.", tags: ["general", "work"] },
  { target: "Ci sono due bagni in casa.", english: "There are two bathrooms in the house.", tags: ["general", "family"] },
  { target: "C'è qualcosa che non va?", english: "Is something wrong?", tags: ["general", "family"] },
  { target: "Non c'è fretta.", english: "There's no rush.", tags: ["general", "work"] },
  { target: "Ci sono tante cose da fare.", english: "There are many things to do.", tags: ["general", "work"] },
  { target: "C'è un bel sole oggi.", english: "It's sunny today.", tags: ["general", "travel"] },
  { target: "Ci sono dei fiori sul balcone.", english: "There are some flowers on the balcony.", tags: ["general", "family"] },
  { target: "C'è posto per tutti.", english: "There is room for everyone.", tags: ["general", "travel"] },
  { target: "Non ci sono più soldi.", english: "There's no more money.", tags: ["general", "work"] },
  { target: "Ci sono le fragole al mercato.", english: "There are strawberries at the market.", tags: ["general", "travel"] },

  // ── More contrast ──
  { target: "Sono felice perché sto viaggiando.", english: "I'm happy because I'm traveling.", tags: ["general", "travel"] },
  { target: "Lei è malata e sta a letto.", english: "She is sick and she's in bed.", tags: ["general", "family"] },
  { target: "Il ristorante è chiuso, stiamo cercando un altro.", english: "The restaurant is closed, we're looking for another.", tags: ["general", "travel"] },
  { target: "È lunedì e sto già pensando al weekend.", english: "It's Monday and I'm already thinking about the weekend.", tags: ["general", "work"] },
  { target: "Sei in ritardo, ti stiamo aspettando.", english: "You're late, we're waiting for you.", tags: ["general", "work"] },
  { target: "È una giornata bella e sto passeggiando.", english: "It's a beautiful day and I'm taking a walk.", tags: ["general", "travel"] },
  { target: "Siamo stanchi ma stiamo continuando.", english: "We are tired but we're continuing.", tags: ["general", "work"] },
  { target: "La cena è pronta, stiamo apparecchiando.", english: "Dinner is ready, we're setting the table.", tags: ["general", "family"] },
  { target: "Non è giusto e lo sto dicendo.", english: "It's not fair and I'm saying it.", tags: ["general", "work"] },
  { target: "È un giorno importante, mi sto preparando.", english: "It's an important day, I'm getting ready.", tags: ["general", "family"] },
];

// ────────────────────────────────────────────
// PLACEHOLDER — remaining nodes added below
// ────────────────────────────────────────────
const node03 = [
  // ── Che / Cosa / Che cosa ──
  { target: "Che fai?", english: "What are you doing?", tags: ["general", "family"] },
  { target: "Cosa vuoi?", english: "What do you want?", tags: ["general", "family"] },
  { target: "Che cosa succede?", english: "What's happening?", tags: ["general", "work"] },
  { target: "Che dici?", english: "What are you saying?", tags: ["general", "family"] },
  { target: "Cosa mangi?", english: "What are you eating?", tags: ["general", "family"] },
  { target: "Che cosa pensi?", english: "What do you think?", tags: ["general", "work"] },
  { target: "Cosa studi?", english: "What do you study?", tags: ["general", "work"] },
  { target: "Che lavoro fai?", english: "What work do you do?", tags: ["general", "work"] },
  { target: "Cosa significa questa parola?", english: "What does this word mean?", tags: ["general", "travel"] },
  { target: "Che ore sono?", english: "What time is it?", tags: ["general", "travel"] },
  { target: "Cosa hai comprato?", english: "What did you buy?", tags: ["general", "travel"] },
  { target: "Che tempo fa?", english: "What's the weather like?", tags: ["general", "travel"] },
  { target: "Cosa cucini stasera?", english: "What are you cooking tonight?", tags: ["general", "family"] },
  { target: "Che cosa hai detto?", english: "What did you say?", tags: ["general", "family"] },
  { target: "Cosa leggi?", english: "What are you reading?", tags: ["general", "family"] },
  { target: "Che musica ascolti?", english: "What music do you listen to?", tags: ["general", "family"] },
  { target: "Cosa bevi?", english: "What are you drinking?", tags: ["general", "travel"] },
  { target: "Che film guardi?", english: "What movie are you watching?", tags: ["general", "family"] },
  { target: "Cosa fai nel tempo libero?", english: "What do you do in your free time?", tags: ["general", "family"] },
  { target: "Che cosa serve?", english: "What's needed?", tags: ["general", "work"] },
  { target: "Cosa c'è per cena?", english: "What's for dinner?", tags: ["general", "family"] },
  { target: "Che regalo vuoi?", english: "What gift do you want?", tags: ["general", "family"] },
  { target: "Cosa ti preoccupa?", english: "What worries you?", tags: ["general", "work"] },
  { target: "Che ne pensi?", english: "What do you think about it?", tags: ["general", "work"] },
  { target: "Cosa è cambiato?", english: "What has changed?", tags: ["general", "work"] },

  // ── Chi ──
  { target: "Chi è?", english: "Who is it?", tags: ["general", "family"] },
  { target: "Chi l'ha detto?", english: "Who said it?", tags: ["general", "work"] },
  { target: "Di chi è questo?", english: "Whose is this?", tags: ["general", "family"] },
  { target: "Con chi vai?", english: "Who are you going with?", tags: ["general", "travel"] },
  { target: "A chi scrivi?", english: "Who are you writing to?", tags: ["general", "work"] },
  { target: "Chi viene alla festa?", english: "Who's coming to the party?", tags: ["general", "family"] },
  { target: "Chi ha cucinato?", english: "Who cooked?", tags: ["general", "family"] },
  { target: "Per chi è questo regalo?", english: "Who is this gift for?", tags: ["general", "family"] },
  { target: "Chi ti ha chiamato?", english: "Who called you?", tags: ["general", "work"] },
  { target: "Di chi parli?", english: "Who are you talking about?", tags: ["general", "family"] },
  { target: "Chi è il tuo insegnante?", english: "Who is your teacher?", tags: ["general", "work"] },
  { target: "Chi vuole un caffè?", english: "Who wants a coffee?", tags: ["general", "travel"] },
  { target: "A chi devo chiedere?", english: "Who should I ask?", tags: ["general", "work"] },
  { target: "Con chi lavori?", english: "Who do you work with?", tags: ["general", "work"] },
  { target: "Chi paga il conto?", english: "Who's paying the bill?", tags: ["general", "travel"] },
  { target: "Chi è il responsabile?", english: "Who is the person in charge?", tags: ["general", "work"] },
  { target: "Di chi è questa macchina?", english: "Whose car is this?", tags: ["general", "family"] },
  { target: "Chi ha le chiavi?", english: "Who has the keys?", tags: ["general", "family"] },
  { target: "Chi lo sa?", english: "Who knows?", tags: ["general", "family"] },
  { target: "Chi ha vinto?", english: "Who won?", tags: ["general", "family"] },

  // ── Dove ──
  { target: "Dove vai?", english: "Where are you going?", tags: ["general", "travel"] },
  { target: "Dov'è il bagno?", english: "Where is the bathroom?", tags: ["general", "travel"] },
  { target: "Da dove vieni?", english: "Where do you come from?", tags: ["general", "travel"] },
  { target: "Dove abiti?", english: "Where do you live?", tags: ["general", "family"] },
  { target: "Dove posso trovare un taxi?", english: "Where can I find a taxi?", tags: ["general", "travel"] },
  { target: "Dove lavori?", english: "Where do you work?", tags: ["general", "work"] },
  { target: "Dove hai parcheggiato?", english: "Where did you park?", tags: ["general", "travel"] },
  { target: "Dove mangiamo stasera?", english: "Where are we eating tonight?", tags: ["general", "travel"] },
  { target: "Dove hai messo le chiavi?", english: "Where did you put the keys?", tags: ["general", "family"] },
  { target: "Dove sono i bambini?", english: "Where are the children?", tags: ["general", "family"] },
  { target: "Dove si comprano i biglietti?", english: "Where do you buy tickets?", tags: ["general", "travel"] },
  { target: "Dove è la stazione?", english: "Where is the station?", tags: ["general", "travel"] },
  { target: "Dove andiamo in vacanza?", english: "Where are we going on vacation?", tags: ["general", "travel"] },
  { target: "Dove hai studiato?", english: "Where did you study?", tags: ["general", "work"] },
  { target: "Dove posso sedermi?", english: "Where can I sit?", tags: ["general", "travel"] },
  { target: "Dove metto la valigia?", english: "Where do I put the suitcase?", tags: ["general", "travel"] },
  { target: "Dove ci incontriamo?", english: "Where do we meet?", tags: ["general", "travel"] },
  { target: "Dove hai imparato l'italiano?", english: "Where did you learn Italian?", tags: ["general", "travel"] },
  { target: "Dove sono le forbici?", english: "Where are the scissors?", tags: ["general", "family"] },
  { target: "Dove si trova il museo?", english: "Where is the museum located?", tags: ["general", "travel"] },

  // ── Quando ──
  { target: "Quando parti?", english: "When are you leaving?", tags: ["general", "travel"] },
  { target: "Quando è nato?", english: "When was he born?", tags: ["general", "family"] },
  { target: "Da quando vivi qui?", english: "Since when have you lived here?", tags: ["general", "travel"] },
  { target: "Fino a quando resti?", english: "Until when are you staying?", tags: ["general", "travel"] },
  { target: "Quando arrivi?", english: "When are you arriving?", tags: ["general", "travel"] },
  { target: "Quando inizia il film?", english: "When does the movie start?", tags: ["general", "travel"] },
  { target: "Quando hai tempo?", english: "When do you have time?", tags: ["general", "work"] },
  { target: "Quando torniamo a casa?", english: "When are we going home?", tags: ["general", "family"] },
  { target: "Quando chiude il negozio?", english: "When does the shop close?", tags: ["general", "travel"] },
  { target: "Quando ci vediamo?", english: "When do we see each other?", tags: ["general", "family"] },
  { target: "Quando finisci di lavorare?", english: "When do you finish working?", tags: ["general", "work"] },
  { target: "Quando è l'esame?", english: "When is the exam?", tags: ["general", "work"] },
  { target: "Quando hai prenotato?", english: "When did you book?", tags: ["general", "travel"] },
  { target: "Da quando lavori qui?", english: "Since when have you worked here?", tags: ["general", "work"] },
  { target: "Quando mangiamo?", english: "When do we eat?", tags: ["general", "family"] },
  { target: "Quando è il tuo compleanno?", english: "When is your birthday?", tags: ["general", "family"] },
  { target: "Quando è successo?", english: "When did it happen?", tags: ["general", "work"] },
  { target: "Quando posso chiamarti?", english: "When can I call you?", tags: ["general", "work"] },
  { target: "Quando apre il bar?", english: "When does the bar open?", tags: ["general", "travel"] },
  { target: "Quando ti sei sposato?", english: "When did you get married?", tags: ["general", "family"] },

  // ── Come ──
  { target: "Come stai?", english: "How are you?", tags: ["general", "travel"] },
  { target: "Come si dice in italiano?", english: "How do you say it in Italian?", tags: ["general", "travel"] },
  { target: "Com'è il tempo?", english: "What's the weather like?", tags: ["general", "travel"] },
  { target: "Come mai sei qui?", english: "How come you're here?", tags: ["general", "travel"] },
  { target: "Come funziona?", english: "How does it work?", tags: ["general", "work"] },
  { target: "Come ti chiami?", english: "What's your name?", tags: ["general", "travel"] },
  { target: "Come si arriva al centro?", english: "How do you get downtown?", tags: ["general", "travel"] },
  { target: "Come va il lavoro?", english: "How's work going?", tags: ["general", "work"] },
  { target: "Come hai dormito?", english: "How did you sleep?", tags: ["general", "family"] },
  { target: "Com'è il cibo qui?", english: "How's the food here?", tags: ["general", "travel"] },
  { target: "Come preferisci il caffè?", english: "How do you like your coffee?", tags: ["general", "travel"] },
  { target: "Come si scrive?", english: "How do you spell it?", tags: ["general", "work"] },
  { target: "Come sei arrivato?", english: "How did you get here?", tags: ["general", "travel"] },
  { target: "Come stanno i tuoi?", english: "How are your parents?", tags: ["general", "family"] },
  { target: "Come mai non rispondi?", english: "How come you don't answer?", tags: ["general", "family"] },
  { target: "Come è andato l'esame?", english: "How did the exam go?", tags: ["general", "work"] },
  { target: "Come fai a saperlo?", english: "How do you know that?", tags: ["general", "family"] },
  { target: "Come si apre questa porta?", english: "How do you open this door?", tags: ["general", "travel"] },
  { target: "Come vuoi pagare?", english: "How do you want to pay?", tags: ["general", "travel"] },
  { target: "Come è andata la giornata?", english: "How was your day?", tags: ["general", "work"] },

  // ── Perché ──
  { target: "Perché no?", english: "Why not?", tags: ["general", "family"] },
  { target: "Perché piangi?", english: "Why are you crying?", tags: ["general", "family"] },
  { target: "Perché non vieni?", english: "Why don't you come?", tags: ["general", "family"] },
  { target: "Perché ridi?", english: "Why are you laughing?", tags: ["general", "family"] },
  { target: "Perché sei in ritardo?", english: "Why are you late?", tags: ["general", "work"] },
  { target: "Perché hai cambiato idea?", english: "Why did you change your mind?", tags: ["general", "work"] },
  { target: "Perché non mangi?", english: "Why aren't you eating?", tags: ["general", "family"] },
  { target: "Perché studi l'italiano?", english: "Why do you study Italian?", tags: ["general", "travel"] },
  { target: "Perché non mi hai chiamato?", english: "Why didn't you call me?", tags: ["general", "family"] },
  { target: "Perché dici così?", english: "Why do you say that?", tags: ["general", "family"] },
  { target: "Perché è chiuso?", english: "Why is it closed?", tags: ["general", "travel"] },
  { target: "Perché non funziona?", english: "Why doesn't it work?", tags: ["general", "work"] },
  { target: "Perché hai scelto questo?", english: "Why did you choose this?", tags: ["general", "work"] },
  { target: "Perché ti arrabbi?", english: "Why are you getting angry?", tags: ["general", "family"] },
  { target: "Perché corri?", english: "Why are you running?", tags: ["general", "travel"] },

  // ── Quanto/a/i/e ──
  { target: "Quanto costa?", english: "How much does it cost?", tags: ["general", "travel"] },
  { target: "Quanti anni hai?", english: "How old are you?", tags: ["general", "family"] },
  { target: "Quanta acqua bevi al giorno?", english: "How much water do you drink a day?", tags: ["general", "family"] },
  { target: "Quante persone vengono?", english: "How many people are coming?", tags: ["general", "family"] },
  { target: "Quanto tempo ci vuole?", english: "How long does it take?", tags: ["general", "travel"] },
  { target: "Quanti fratelli hai?", english: "How many siblings do you have?", tags: ["general", "family"] },
  { target: "Quanta pasta vuoi?", english: "How much pasta do you want?", tags: ["general", "family"] },
  { target: "Quante lingue parli?", english: "How many languages do you speak?", tags: ["general", "travel"] },
  { target: "Quanto pesi?", english: "How much do you weigh?", tags: ["general", "family"] },
  { target: "Quanti giorni resti?", english: "How many days are you staying?", tags: ["general", "travel"] },
  { target: "Quante ore dormi?", english: "How many hours do you sleep?", tags: ["general", "family"] },
  { target: "Quanto dista la spiaggia?", english: "How far is the beach?", tags: ["general", "travel"] },
  { target: "Quanti studenti ci sono?", english: "How many students are there?", tags: ["general", "work"] },
  { target: "Quanto è grande la casa?", english: "How big is the house?", tags: ["general", "family"] },
  { target: "Quante volte alla settimana?", english: "How many times a week?", tags: ["general", "work"] },

  // ── Quale / Quali ──
  { target: "Quale preferisci?", english: "Which one do you prefer?", tags: ["general", "travel"] },
  { target: "Quali sono i tuoi hobby?", english: "What are your hobbies?", tags: ["general", "family"] },
  { target: "In quale via abiti?", english: "What street do you live on?", tags: ["general", "family"] },
  { target: "Quale ristorante scegli?", english: "Which restaurant do you choose?", tags: ["general", "travel"] },
  { target: "Quali lingue parli?", english: "Which languages do you speak?", tags: ["general", "travel"] },
  { target: "Quale autobus devo prendere?", english: "Which bus should I take?", tags: ["general", "travel"] },
  { target: "Quali film ti piacciono?", english: "Which movies do you like?", tags: ["general", "family"] },
  { target: "Quale è il tuo numero?", english: "What is your number?", tags: ["general", "work"] },
  { target: "Quali sono gli ingredienti?", english: "What are the ingredients?", tags: ["general", "family"] },
  { target: "Quale giorno va bene?", english: "Which day works?", tags: ["general", "work"] },
  { target: "Quali scarpe metto?", english: "Which shoes should I wear?", tags: ["general", "family"] },
  { target: "Quale colore preferisci?", english: "Which color do you prefer?", tags: ["general", "family"] },
  { target: "Quali libri consigli?", english: "Which books do you recommend?", tags: ["general", "work"] },
  { target: "Quale piatto vuoi assaggiare?", english: "Which dish do you want to try?", tags: ["general", "travel"] },
  { target: "Quali sono le regole?", english: "What are the rules?", tags: ["general", "work"] },

  // ── Tag questions ──
  { target: "Fa caldo, vero?", english: "It's hot, right?", tags: ["general", "travel"] },
  { target: "Ti piace, no?", english: "You like it, don't you?", tags: ["general", "family"] },
  { target: "È buono, non è vero?", english: "It's good, isn't it?", tags: ["general", "travel"] },
  { target: "Vieni anche tu, giusto?", english: "You're coming too, right?", tags: ["general", "family"] },
  { target: "Hai capito, vero?", english: "You understood, right?", tags: ["general", "work"] },
  { target: "Partiamo domani, no?", english: "We're leaving tomorrow, right?", tags: ["general", "travel"] },
  { target: "È lunedì oggi, giusto?", english: "It's Monday today, right?", tags: ["general", "work"] },
  { target: "Abiti qui vicino, vero?", english: "You live nearby, right?", tags: ["general", "family"] },
  { target: "Conosci Marco, no?", english: "You know Marco, don't you?", tags: ["general", "family"] },
  { target: "Lavori domani, giusto?", english: "You're working tomorrow, right?", tags: ["general", "work"] },
  { target: "Il treno è alle sei, vero?", english: "The train is at six, right?", tags: ["general", "travel"] },
  { target: "Hai fame, no?", english: "You're hungry, aren't you?", tags: ["general", "family"] },

  // ── Indirect questions ──
  { target: "Sai dov'è la banca?", english: "Do you know where the bank is?", tags: ["general", "travel"] },
  { target: "Mi chiedo perché non risponde.", english: "I wonder why he doesn't answer.", tags: ["general", "work"] },
  { target: "Non so cosa fare.", english: "I don't know what to do.", tags: ["general", "work"] },
  { target: "Sai quando arriva?", english: "Do you know when it arrives?", tags: ["general", "travel"] },
  { target: "Mi domando chi sia.", english: "I wonder who it is.", tags: ["general", "family"] },
  { target: "Non capisco perché è arrabbiato.", english: "I don't understand why he's angry.", tags: ["general", "family"] },
  { target: "Sai come si fa?", english: "Do you know how to do it?", tags: ["general", "work"] },
  { target: "Mi chiedo quanto costa.", english: "I wonder how much it costs.", tags: ["general", "travel"] },
  { target: "Non so dove ho messo il telefono.", english: "I don't know where I put the phone.", tags: ["general", "family"] },
  { target: "Sai chi è quel ragazzo?", english: "Do you know who that guy is?", tags: ["general", "family"] },
  { target: "Mi chiedo se viene anche lui.", english: "I wonder if he's coming too.", tags: ["general", "family"] },
  { target: "Non ricordo quando parte il volo.", english: "I don't remember when the flight leaves.", tags: ["general", "travel"] },
  { target: "Sai quale autobus prendere?", english: "Do you know which bus to take?", tags: ["general", "travel"] },
  { target: "Mi domando come ha fatto.", english: "I wonder how he did it.", tags: ["general", "work"] },
  { target: "Non so se è aperto.", english: "I don't know if it's open.", tags: ["general", "travel"] },

  // ── Extra mixed questions ──
  { target: "A che ora parti?", english: "What time are you leaving?", tags: ["general", "travel"] },
  { target: "Di che colore è?", english: "What color is it?", tags: ["general", "family"] },
  { target: "In che senso?", english: "In what sense?", tags: ["general", "work"] },
  { target: "Per quanto tempo?", english: "For how long?", tags: ["general", "travel"] },
  { target: "Da quanto tempo aspetti?", english: "How long have you been waiting?", tags: ["general", "travel"] },
  { target: "Che tipo di musica ascolti?", english: "What type of music do you listen to?", tags: ["general", "family"] },
  { target: "A che piano abiti?", english: "What floor do you live on?", tags: ["general", "family"] },
  { target: "Di che cosa hai bisogno?", english: "What do you need?", tags: ["general", "work"] },
  { target: "Con che cosa viaggi?", english: "What are you traveling with?", tags: ["general", "travel"] },
  { target: "Da che parte è l'uscita?", english: "Which way is the exit?", tags: ["general", "travel"] },
  { target: "Che cosa hai fatto ieri?", english: "What did you do yesterday?", tags: ["general", "family"] },
  { target: "Di che si tratta?", english: "What is it about?", tags: ["general", "work"] },
  { target: "Come mai non c'è nessuno?", english: "How come there's nobody?", tags: ["general", "travel"] },
  { target: "Dove posso cambiare i soldi?", english: "Where can I exchange money?", tags: ["general", "travel"] },
  { target: "Quand'è la prossima lezione?", english: "When is the next class?", tags: ["general", "work"] },
  { target: "Cosa ne sai tu?", english: "What do you know about it?", tags: ["general", "family"] },
  { target: "Chi altro viene?", english: "Who else is coming?", tags: ["general", "family"] },
  { target: "Dove posso comprare un biglietto?", english: "Where can I buy a ticket?", tags: ["general", "travel"] },
  { target: "Perché non hai studiato?", english: "Why didn't you study?", tags: ["general", "work"] },
  { target: "Come va la vita?", english: "How's life?", tags: ["general", "family"] },

  // ── More Che/Cosa ──
  { target: "Che cosa fai di bello?", english: "What are you up to?", tags: ["general", "family"] },
  { target: "Cosa prendi da bere?", english: "What are you having to drink?", tags: ["general", "travel"] },
  { target: "Che giorno è oggi?", english: "What day is it today?", tags: ["general", "work"] },
  { target: "Cosa hai fatto nel weekend?", english: "What did you do on the weekend?", tags: ["general", "family"] },
  { target: "Che taglia porti?", english: "What size do you wear?", tags: ["general", "travel"] },
  { target: "Cosa consigli?", english: "What do you recommend?", tags: ["general", "travel"] },
  { target: "Che lingua parlano?", english: "What language do they speak?", tags: ["general", "travel"] },
  { target: "Cosa guardi in televisione?", english: "What do you watch on TV?", tags: ["general", "family"] },
  { target: "Che profumo usi?", english: "What perfume do you use?", tags: ["general", "family"] },
  { target: "Cosa vuoi fare da grande?", english: "What do you want to be when you grow up?", tags: ["general", "family"] },

  // ── More Chi ──
  { target: "Chi porta il vino?", english: "Who's bringing the wine?", tags: ["general", "family"] },
  { target: "Per chi lavori?", english: "Who do you work for?", tags: ["general", "work"] },
  { target: "Chi ha rotto il piatto?", english: "Who broke the plate?", tags: ["general", "family"] },
  { target: "A chi somiglia?", english: "Who does he look like?", tags: ["general", "family"] },
  { target: "Chi ti ha insegnato a cucinare?", english: "Who taught you to cook?", tags: ["general", "family"] },

  // ── More Dove ──
  { target: "Dove posso caricare il telefono?", english: "Where can I charge my phone?", tags: ["general", "travel"] },
  { target: "Dove hai trovato questo?", english: "Where did you find this?", tags: ["general", "family"] },
  { target: "Dove posiamo le valigie?", english: "Where do we put the suitcases?", tags: ["general", "travel"] },
  { target: "Dove ti fa male?", english: "Where does it hurt?", tags: ["general", "family"] },
  { target: "Dove andate in vacanza?", english: "Where are you going on vacation?", tags: ["general", "travel"] },

  // ── More Quando ──
  { target: "Quando hai cominciato a lavorare?", english: "When did you start working?", tags: ["general", "work"] },
  { target: "Quando siete arrivati?", english: "When did you arrive?", tags: ["general", "travel"] },
  { target: "Quando ci rivedremo?", english: "When will we see each other again?", tags: ["general", "family"] },
  { target: "Quando devo pagare?", english: "When do I have to pay?", tags: ["general", "travel"] },
  { target: "Quando torni dal viaggio?", english: "When do you come back from the trip?", tags: ["general", "travel"] },

  // ── More Come ──
  { target: "Come è andato il colloquio?", english: "How did the interview go?", tags: ["general", "work"] },
  { target: "Come si chiama il tuo cane?", english: "What is your dog's name?", tags: ["general", "family"] },
  { target: "Come passi il tempo libero?", english: "How do you spend your free time?", tags: ["general", "family"] },
  { target: "Come sono i tuoi colleghi?", english: "What are your colleagues like?", tags: ["general", "work"] },
  { target: "Come ci arrivo da qui?", english: "How do I get there from here?", tags: ["general", "travel"] },

  // ── More Perché ──
  { target: "Perché non hai mangiato?", english: "Why didn't you eat?", tags: ["general", "family"] },
  { target: "Perché vuoi andare via?", english: "Why do you want to leave?", tags: ["general", "family"] },
  { target: "Perché fa così caldo?", english: "Why is it so hot?", tags: ["general", "travel"] },
  { target: "Perché non rispondi al telefono?", english: "Why don't you answer the phone?", tags: ["general", "work"] },
  { target: "Perché sorridi?", english: "Why are you smiling?", tags: ["general", "family"] },

  // ── More Quanto ──
  { target: "Quanto guadagni al mese?", english: "How much do you earn per month?", tags: ["general", "work"] },
  { target: "Quante sigarette fumi?", english: "How many cigarettes do you smoke?", tags: ["general", "family"] },
  { target: "Quanti piani ha il palazzo?", english: "How many floors does the building have?", tags: ["general", "travel"] },
  { target: "Quanta gente c'era?", english: "How many people were there?", tags: ["general", "travel"] },
  { target: "Quanto dura il film?", english: "How long is the movie?", tags: ["general", "travel"] },

  // ── More Quale ──
  { target: "Quale stagione preferisci?", english: "Which season do you prefer?", tags: ["general", "family"] },
  { target: "Quali materie studi?", english: "Which subjects do you study?", tags: ["general", "work"] },
  { target: "Quale treno prendiamo?", english: "Which train do we take?", tags: ["general", "travel"] },
  { target: "Quali sono i tuoi piani?", english: "What are your plans?", tags: ["general", "work"] },
  { target: "Quale pizza vuoi?", english: "Which pizza do you want?", tags: ["general", "travel"] },

  // ── More tag questions ──
  { target: "Hai finito, vero?", english: "You're done, right?", tags: ["general", "work"] },
  { target: "Stai bene, no?", english: "You're fine, right?", tags: ["general", "family"] },
  { target: "Ci vediamo alle otto, giusto?", english: "We meet at eight, right?", tags: ["general", "travel"] },

  // ── More indirect questions ──
  { target: "Sai a che ora apre?", english: "Do you know what time it opens?", tags: ["general", "travel"] },
  { target: "Non so come ringraziarti.", english: "I don't know how to thank you.", tags: ["general", "family"] },
  { target: "Mi chiedo dove sia andato.", english: "I wonder where he went.", tags: ["general", "family"] },
  { target: "Sai quanto costa il biglietto?", english: "Do you know how much the ticket costs?", tags: ["general", "travel"] },
];
const node04 = [
  // ── il + consonant ──
  { target: "Il libro è sul tavolo.", english: "The book is on the table.", tags: ["general", "family"] },
  { target: "Il ragazzo corre nel parco.", english: "The boy runs in the park.", tags: ["general", "family"] },
  { target: "Il telefono squilla sempre.", english: "The phone always rings.", tags: ["general", "work"] },
  { target: "Il gatto dorme sul divano.", english: "The cat sleeps on the couch.", tags: ["general", "family"] },
  { target: "Il treno parte alle nove.", english: "The train leaves at nine.", tags: ["general", "travel"] },
  { target: "Il mercato è aperto la mattina.", english: "The market is open in the morning.", tags: ["general", "travel"] },
  { target: "Il cane abbaia di notte.", english: "The dog barks at night.", tags: ["general", "family"] },
  { target: "Il vento soffia forte oggi.", english: "The wind blows hard today.", tags: ["general", "travel"] },
  { target: "Il dottore arriva fra poco.", english: "The doctor arrives soon.", tags: ["general", "work"] },
  { target: "Il giardino è molto grande.", english: "The garden is very big.", tags: ["general", "family"] },
  { target: "Il sole tramonta presto in inverno.", english: "The sun sets early in winter.", tags: ["general", "travel"] },
  { target: "Il biglietto costa dieci euro.", english: "The ticket costs ten euros.", tags: ["general", "travel"] },
  { target: "Il professore spiega bene.", english: "The professor explains well.", tags: ["general", "work"] },
  { target: "Il latte è nel frigorifero.", english: "The milk is in the fridge.", tags: ["general", "family"] },
  { target: "Il ponte è molto antico.", english: "The bridge is very old.", tags: ["general", "travel"] },

  // ── lo + s+consonant, z, gn, ps ──
  { target: "Lo studente studia in biblioteca.", english: "The student studies in the library.", tags: ["general", "work"] },
  { target: "Lo zaino è pesante.", english: "The backpack is heavy.", tags: ["general", "travel"] },
  { target: "Lo gnomo è nel giardino.", english: "The gnome is in the garden.", tags: ["general", "family"] },
  { target: "Lo psicologo lavora in ospedale.", english: "The psychologist works in the hospital.", tags: ["general", "work"] },
  { target: "Lo specchio è rotto.", english: "The mirror is broken.", tags: ["general", "family"] },
  { target: "Lo stadio è pieno.", english: "The stadium is full.", tags: ["general", "travel"] },
  { target: "Lo zucchero è finito.", english: "The sugar is finished.", tags: ["general", "family"] },
  { target: "Lo spettacolo inizia alle otto.", english: "The show starts at eight.", tags: ["general", "travel"] },
  { target: "Lo stipendio arriva a fine mese.", english: "The salary arrives at the end of the month.", tags: ["general", "work"] },
  { target: "Lo sbaglio è stato mio.", english: "The mistake was mine.", tags: ["general", "work"] },
  { target: "Lo sport fa bene alla salute.", english: "Sports are good for your health.", tags: ["general", "family"] },
  { target: "Lo sciroppo è dolce.", english: "The syrup is sweet.", tags: ["general", "family"] },

  // ── la + feminine ──
  { target: "La donna legge un romanzo.", english: "The woman reads a novel.", tags: ["general", "family"] },
  { target: "La ragazza studia medicina.", english: "The girl studies medicine.", tags: ["general", "work"] },
  { target: "La casa è vicino al mare.", english: "The house is near the sea.", tags: ["general", "travel"] },
  { target: "La macchina è parcheggiata fuori.", english: "The car is parked outside.", tags: ["general", "family"] },
  { target: "La scuola chiude alle tre.", english: "The school closes at three.", tags: ["general", "work"] },
  { target: "La pizza è pronta.", english: "The pizza is ready.", tags: ["general", "family"] },
  { target: "La spiaggia è bellissima.", english: "The beach is beautiful.", tags: ["general", "travel"] },
  { target: "La finestra è aperta.", english: "The window is open.", tags: ["general", "family"] },
  { target: "La cena è alle otto.", english: "Dinner is at eight.", tags: ["general", "family"] },
  { target: "La musica è troppo alta.", english: "The music is too loud.", tags: ["general", "family"] },
  { target: "La strada è lunga.", english: "The road is long.", tags: ["general", "travel"] },
  { target: "La luna è piena stasera.", english: "The moon is full tonight.", tags: ["general", "travel"] },

  // ── l' + vowel ──
  { target: "L'uomo cammina per strada.", english: "The man walks on the street.", tags: ["general", "travel"] },
  { target: "L'acqua è fredda.", english: "The water is cold.", tags: ["general", "travel"] },
  { target: "L'amico arriva domani.", english: "The friend arrives tomorrow.", tags: ["general", "family"] },
  { target: "L'idea è brillante.", english: "The idea is brilliant.", tags: ["general", "work"] },
  { target: "L'aereo parte alle dieci.", english: "The plane leaves at ten.", tags: ["general", "travel"] },
  { target: "L'estate è la mia stagione preferita.", english: "Summer is my favorite season.", tags: ["general", "travel"] },
  { target: "L'orologio è rotto.", english: "The watch is broken.", tags: ["general", "family"] },
  { target: "L'ufficio chiude alle sei.", english: "The office closes at six.", tags: ["general", "work"] },
  { target: "L'inverno è molto freddo qui.", english: "Winter is very cold here.", tags: ["general", "travel"] },
  { target: "L'isola è piccola ma bella.", english: "The island is small but beautiful.", tags: ["general", "travel"] },
  { target: "L'albero è alto.", english: "The tree is tall.", tags: ["general", "family"] },
  { target: "L'ospedale è lontano.", english: "The hospital is far away.", tags: ["general", "travel"] },

  // ── i + consonant plural ──
  { target: "I libri sono sullo scaffale.", english: "The books are on the shelf.", tags: ["general", "family"] },
  { target: "I ragazzi giocano a calcio.", english: "The boys play soccer.", tags: ["general", "family"] },
  { target: "I treni sono in ritardo.", english: "The trains are late.", tags: ["general", "travel"] },
  { target: "I bambini dormono presto.", english: "The children sleep early.", tags: ["general", "family"] },
  { target: "I negozi chiudono la domenica.", english: "The shops close on Sundays.", tags: ["general", "travel"] },
  { target: "I colleghi sono simpatici.", english: "The colleagues are nice.", tags: ["general", "work"] },
  { target: "I fiori sono nel vaso.", english: "The flowers are in the vase.", tags: ["general", "family"] },
  { target: "I prezzi sono aumentati.", english: "Prices have gone up.", tags: ["general", "travel"] },
  { target: "I documenti sono pronti.", english: "The documents are ready.", tags: ["general", "work"] },
  { target: "I vicini sono rumorosi.", english: "The neighbors are noisy.", tags: ["general", "family"] },

  // ── gli + vowel/s+cons/z ──
  { target: "Gli studenti ascoltano la lezione.", english: "The students listen to the lesson.", tags: ["general", "work"] },
  { target: "Gli amici vengono a cena.", english: "Friends are coming for dinner.", tags: ["general", "family"] },
  { target: "Gli zaini sono nello scaffale.", english: "The backpacks are on the shelf.", tags: ["general", "work"] },
  { target: "Gli occhi sono stanchi.", english: "The eyes are tired.", tags: ["general", "family"] },
  { target: "Gli spaghetti sono buonissimi.", english: "The spaghetti is delicious.", tags: ["general", "travel"] },
  { target: "Gli alberi perdono le foglie.", english: "The trees lose their leaves.", tags: ["general", "travel"] },
  { target: "Gli italiani mangiano tanta pasta.", english: "Italians eat a lot of pasta.", tags: ["general", "travel"] },
  { target: "Gli ospiti arrivano alle sette.", english: "The guests arrive at seven.", tags: ["general", "family"] },
  { target: "Gli esami sono a giugno.", english: "The exams are in June.", tags: ["general", "work"] },
  { target: "Gli spazi sono limitati.", english: "The spaces are limited.", tags: ["general", "work"] },

  // ── le + feminine plural ──
  { target: "Le donne parlano al parco.", english: "The women talk at the park.", tags: ["general", "family"] },
  { target: "Le ragazze studiano insieme.", english: "The girls study together.", tags: ["general", "work"] },
  { target: "Le scarpe sono sotto il letto.", english: "The shoes are under the bed.", tags: ["general", "family"] },
  { target: "Le vacanze finiscono domani.", english: "The holidays end tomorrow.", tags: ["general", "travel"] },
  { target: "Le strade sono strette.", english: "The streets are narrow.", tags: ["general", "travel"] },
  { target: "Le finestre sono chiuse.", english: "The windows are closed.", tags: ["general", "family"] },
  { target: "Le mele sono mature.", english: "The apples are ripe.", tags: ["general", "family"] },
  { target: "Le lezioni iniziano lunedì.", english: "The lessons start on Monday.", tags: ["general", "work"] },
  { target: "Le chiavi sono nella borsa.", english: "The keys are in the bag.", tags: ["general", "family"] },
  { target: "Le notizie non sono buone.", english: "The news is not good.", tags: ["general", "work"] },

  // ── un/uno/una/un' ──
  { target: "Ho un libro nuovo.", english: "I have a new book.", tags: ["general", "family"] },
  { target: "C'è uno studente alla porta.", english: "There is a student at the door.", tags: ["general", "work"] },
  { target: "Vedo una donna con un cane.", english: "I see a woman with a dog.", tags: ["general", "travel"] },
  { target: "Ho un'amica a Firenze.", english: "I have a friend in Florence.", tags: ["general", "travel"] },
  { target: "Cerco un lavoro nuovo.", english: "I'm looking for a new job.", tags: ["general", "work"] },
  { target: "Uno zaino costa trenta euro.", english: "A backpack costs thirty euros.", tags: ["general", "travel"] },
  { target: "Vuoi una birra?", english: "Do you want a beer?", tags: ["general", "travel"] },
  { target: "Ho un'idea fantastica.", english: "I have a fantastic idea.", tags: ["general", "work"] },
  { target: "Cerco un appartamento in centro.", english: "I'm looking for an apartment downtown.", tags: ["general", "travel"] },
  { target: "Ho uno zio in America.", english: "I have an uncle in America.", tags: ["general", "family"] },
  { target: "Conosco una ragazza simpatica.", english: "I know a nice girl.", tags: ["general", "family"] },
  { target: "Ho un'ora di tempo.", english: "I have one hour of time.", tags: ["general", "work"] },
  { target: "Prendo un caffè al bar.", english: "I get a coffee at the bar.", tags: ["general", "travel"] },
  { target: "Uno spettacolo bellissimo.", english: "A beautiful show.", tags: ["general", "travel"] },
  { target: "Ho comprato una giacca nuova.", english: "I bought a new jacket.", tags: ["general", "travel"] },

  // ── Partitives del/dello/della/dei/degli/delle ──
  { target: "Vuoi del pane?", english: "Do you want some bread?", tags: ["general", "family"] },
  { target: "Metti dello zucchero nel caffè?", english: "Do you put sugar in the coffee?", tags: ["general", "travel"] },
  { target: "Compro della frutta al mercato.", english: "I buy some fruit at the market.", tags: ["general", "travel"] },
  { target: "Ci sono dei libri interessanti.", english: "There are some interesting books.", tags: ["general", "work"] },
  { target: "Ho degli amici a Milano.", english: "I have some friends in Milan.", tags: ["general", "travel"] },
  { target: "Compro delle mele rosse.", english: "I buy some red apples.", tags: ["general", "family"] },
  { target: "Bevo del latte ogni mattina.", english: "I drink some milk every morning.", tags: ["general", "family"] },
  { target: "Metto dello zafferano nel risotto.", english: "I put some saffron in the risotto.", tags: ["general", "family"] },
  { target: "Voglio della cioccolata calda.", english: "I want some hot chocolate.", tags: ["general", "travel"] },
  { target: "Abbiamo dei vicini gentili.", english: "We have some kind neighbors.", tags: ["general", "family"] },
  { target: "Ci sono degli sconti oggi.", english: "There are some discounts today.", tags: ["general", "travel"] },
  { target: "Porto delle paste per tutti.", english: "I bring some pastries for everyone.", tags: ["general", "family"] },
  { target: "Vuoi del formaggio?", english: "Do you want some cheese?", tags: ["general", "family"] },
  { target: "Compro dell'olio extravergine.", english: "I buy some extra virgin oil.", tags: ["general", "travel"] },
  { target: "Ci sono dei posti liberi.", english: "There are some free seats.", tags: ["general", "travel"] },

  // ── Gender agreement with adjectives ──
  { target: "Il vestito rosso è mio.", english: "The red dress is mine.", tags: ["general", "family"] },
  { target: "La gonna rossa è elegante.", english: "The red skirt is elegant.", tags: ["general", "family"] },
  { target: "I pantaloni neri sono comodi.", english: "The black pants are comfortable.", tags: ["general", "travel"] },
  { target: "Le scarpe nere sono nuove.", english: "The black shoes are new.", tags: ["general", "travel"] },
  { target: "Il maglione bianco è sporco.", english: "The white sweater is dirty.", tags: ["general", "family"] },
  { target: "La camicia bianca è stirata.", english: "The white shirt is ironed.", tags: ["general", "work"] },
  { target: "I guanti grigi sono caldi.", english: "The gray gloves are warm.", tags: ["general", "travel"] },
  { target: "Le calze grigie sono nel cassetto.", english: "The gray socks are in the drawer.", tags: ["general", "family"] },
  { target: "Un cappello verde sta bene.", english: "A green hat looks good.", tags: ["general", "travel"] },
  { target: "Una borsa verde è al negozio.", english: "A green bag is at the store.", tags: ["general", "travel"] },
  { target: "Il ragazzo alto è mio cugino.", english: "The tall boy is my cousin.", tags: ["general", "family"] },
  { target: "La ragazza alta è la mia amica.", english: "The tall girl is my friend.", tags: ["general", "family"] },
  { target: "I palazzi antichi sono belli.", english: "The old buildings are beautiful.", tags: ["general", "travel"] },
  { target: "Le chiese antiche sono famose.", english: "The old churches are famous.", tags: ["general", "travel"] },
  { target: "Il cibo italiano è il migliore.", english: "Italian food is the best.", tags: ["general", "travel"] },
  { target: "La cucina italiana è famosa.", english: "Italian cuisine is famous.", tags: ["general", "travel"] },
  { target: "I vini italiani sono ottimi.", english: "Italian wines are excellent.", tags: ["general", "travel"] },
  { target: "Le città italiane sono uniche.", english: "Italian cities are unique.", tags: ["general", "travel"] },
  { target: "Un piatto caldo mi fa piacere.", english: "A hot dish would make me happy.", tags: ["general", "family"] },
  { target: "Una giornata calda in agosto.", english: "A hot day in August.", tags: ["general", "travel"] },

  // ── Tricky genders ──
  { target: "Il problema è serio.", english: "The problem is serious.", tags: ["general", "work"] },
  { target: "I problemi sono tanti.", english: "The problems are many.", tags: ["general", "work"] },
  { target: "Il sistema funziona bene.", english: "The system works well.", tags: ["general", "work"] },
  { target: "I sistemi sono complicati.", english: "The systems are complicated.", tags: ["general", "work"] },
  { target: "La mano è fredda.", english: "The hand is cold.", tags: ["general", "family"] },
  { target: "Le mani sono pulite.", english: "The hands are clean.", tags: ["general", "family"] },
  { target: "La radio è accesa.", english: "The radio is on.", tags: ["general", "family"] },
  { target: "Il cinema è chiuso oggi.", english: "The cinema is closed today.", tags: ["general", "travel"] },
  { target: "Il film è interessante.", english: "The movie is interesting.", tags: ["general", "travel"] },
  { target: "I film italiani mi piacciono.", english: "I like Italian movies.", tags: ["general", "travel"] },
  { target: "Il programma è lungo.", english: "The program is long.", tags: ["general", "work"] },
  { target: "I programmi sono cambiati.", english: "The programs have changed.", tags: ["general", "work"] },
  { target: "Il tema è difficile.", english: "The topic is difficult.", tags: ["general", "work"] },
  { target: "La foto è bella.", english: "The photo is beautiful.", tags: ["general", "family"] },
  { target: "Le foto sono pronte.", english: "The photos are ready.", tags: ["general", "family"] },
  { target: "L'auto è parcheggiata fuori.", english: "The car is parked outside.", tags: ["general", "travel"] },
  { target: "Il clima è mite in primavera.", english: "The climate is mild in spring.", tags: ["general", "travel"] },
  { target: "Il poeta scrive ogni giorno.", english: "The poet writes every day.", tags: ["general", "work"] },
  { target: "La crisi è globale.", english: "The crisis is global.", tags: ["general", "work"] },
  { target: "Il pigiama è comodo.", english: "The pajamas are comfortable.", tags: ["general", "family"] },

  // ── More article practice ──
  { target: "Leggo il giornale al bar.", english: "I read the newspaper at the bar.", tags: ["general", "travel"] },
  { target: "Lo sciatore scende dalla montagna.", english: "The skier comes down from the mountain.", tags: ["general", "travel"] },
  { target: "La nonna cucina ogni domenica.", english: "Grandma cooks every Sunday.", tags: ["general", "family"] },
  { target: "L'insegnante corregge i compiti.", english: "The teacher corrects the homework.", tags: ["general", "work"] },
  { target: "I turisti visitano il Colosseo.", english: "The tourists visit the Colosseum.", tags: ["general", "travel"] },
  { target: "Gli orari sono cambiati.", english: "The schedules have changed.", tags: ["general", "work"] },
  { target: "Le fragole sono dolci.", english: "The strawberries are sweet.", tags: ["general", "family"] },
  { target: "Un amico mi ha aiutato.", english: "A friend helped me.", tags: ["general", "family"] },
  { target: "Uno sbaglio capita a tutti.", english: "A mistake happens to everyone.", tags: ["general", "work"] },
  { target: "Una tazza di tè, per favore.", english: "A cup of tea, please.", tags: ["general", "travel"] },
  { target: "Un'arancia fresca è buona.", english: "A fresh orange is good.", tags: ["general", "family"] },
  { target: "Il mare è calmo oggi.", english: "The sea is calm today.", tags: ["general", "travel"] },
  { target: "Lo spazio è poco.", english: "The space is small.", tags: ["general", "family"] },
  { target: "La piazza è piena di gente.", english: "The square is full of people.", tags: ["general", "travel"] },
  { target: "L'arte italiana è unica.", english: "Italian art is unique.", tags: ["general", "travel"] },
  { target: "I musei sono gratuiti la domenica.", english: "Museums are free on Sundays.", tags: ["general", "travel"] },
  { target: "Gli uomini parlano forte.", english: "The men speak loudly.", tags: ["general", "family"] },
  { target: "Le rose sono rosse.", english: "The roses are red.", tags: ["general", "family"] },
  { target: "Voglio del gelato.", english: "I want some ice cream.", tags: ["general", "travel"] },
  { target: "Porto degli snack per il viaggio.", english: "I bring some snacks for the trip.", tags: ["general", "travel"] },

  // ── Extra mixed ──
  { target: "Ho comprato il pane e la frutta.", english: "I bought the bread and the fruit.", tags: ["general", "family"] },
  { target: "Dove sono i piatti e le posate?", english: "Where are the plates and utensils?", tags: ["general", "family"] },
  { target: "Lo zio porta dello spumante.", english: "The uncle brings some sparkling wine.", tags: ["general", "family"] },
  { target: "L'entrata è dall'altra parte.", english: "The entrance is on the other side.", tags: ["general", "travel"] },
  { target: "I genitori portano i figli a scuola.", english: "The parents take the kids to school.", tags: ["general", "family"] },
  { target: "Gli ingredienti sono freschi.", english: "The ingredients are fresh.", tags: ["general", "family"] },
  { target: "Le montagne sono coperte di neve.", english: "The mountains are covered in snow.", tags: ["general", "travel"] },
  { target: "Un bicchiere d'acqua, per favore.", english: "A glass of water, please.", tags: ["general", "travel"] },
  { target: "Delle persone aspettano fuori.", english: "Some people are waiting outside.", tags: ["general", "work"] },
  { target: "Il panorama è spettacolare.", english: "The view is spectacular.", tags: ["general", "travel"] },
  { target: "La biblioteca apre alle nove.", english: "The library opens at nine.", tags: ["general", "work"] },
  { target: "Lo stipendio non basta.", english: "The salary isn't enough.", tags: ["general", "work"] },
  { target: "Gli studenti preparano l'esame.", english: "The students prepare for the exam.", tags: ["general", "work"] },
  { target: "Un cappuccino e una brioche.", english: "A cappuccino and a pastry.", tags: ["general", "travel"] },
  { target: "Le vacanze estive sono lunghe.", english: "Summer vacations are long.", tags: ["general", "family"] },

  // ── More il/lo/la/l' practice ──
  { target: "Il cielo è azzurro oggi.", english: "The sky is blue today.", tags: ["general", "travel"] },
  { target: "Lo spazzolino è nel bagno.", english: "The toothbrush is in the bathroom.", tags: ["general", "family"] },
  { target: "La mattina bevo un caffè.", english: "In the morning I drink a coffee.", tags: ["general", "family"] },
  { target: "L'appartamento è al quarto piano.", english: "The apartment is on the fourth floor.", tags: ["general", "family"] },
  { target: "Il gioco è divertente.", english: "The game is fun.", tags: ["general", "family"] },
  { target: "Lo scaffale è pieno di libri.", english: "The shelf is full of books.", tags: ["general", "family"] },
  { target: "La borsa è troppo pesante.", english: "The bag is too heavy.", tags: ["general", "travel"] },
  { target: "L'ombrello è nell'armadio.", english: "The umbrella is in the closet.", tags: ["general", "family"] },
  { target: "Il cuscino è molto morbido.", english: "The pillow is very soft.", tags: ["general", "family"] },
  { target: "Lo zainetto è colorato.", english: "The little backpack is colorful.", tags: ["general", "travel"] },
  { target: "La colazione è pronta.", english: "Breakfast is ready.", tags: ["general", "family"] },
  { target: "L'autunno è la mia stagione preferita.", english: "Autumn is my favorite season.", tags: ["general", "travel"] },
  { target: "Il balcone è piccolo ma carino.", english: "The balcony is small but cute.", tags: ["general", "family"] },
  { target: "Lo squalo è un pesce grande.", english: "The shark is a big fish.", tags: ["general", "family"] },
  { target: "La sera usciamo a fare una passeggiata.", english: "In the evening we go for a walk.", tags: ["general", "family"] },

  // ── More i/gli/le practice ──
  { target: "I cani corrono nel parco.", english: "The dogs run in the park.", tags: ["general", "family"] },
  { target: "Gli occhiali sono sul tavolo.", english: "The glasses are on the table.", tags: ["general", "family"] },
  { target: "Le nuvole coprono il sole.", english: "The clouds cover the sun.", tags: ["general", "travel"] },
  { target: "I panini sono freschi.", english: "The sandwiches are fresh.", tags: ["general", "travel"] },
  { target: "Gli scienziati fanno ricerche.", english: "The scientists do research.", tags: ["general", "work"] },
  { target: "Le sorelle vivono a Torino.", english: "The sisters live in Turin.", tags: ["general", "family"] },
  { target: "I giornali sono sul banco.", english: "The newspapers are on the counter.", tags: ["general", "work"] },
  { target: "Gli uccelli cantano la mattina.", english: "The birds sing in the morning.", tags: ["general", "family"] },
  { target: "Le stelle brillano di notte.", english: "The stars shine at night.", tags: ["general", "travel"] },
  { target: "I pesci nuotano nel lago.", english: "The fish swim in the lake.", tags: ["general", "travel"] },

  // ── More un/uno/una/un' practice ──
  { target: "Leggo un giornale ogni mattina.", english: "I read a newspaper every morning.", tags: ["general", "work"] },
  { target: "Uno studente ha fatto una domanda.", english: "A student asked a question.", tags: ["general", "work"] },
  { target: "Voglio una tazza di tè caldo.", english: "I want a cup of hot tea.", tags: ["general", "family"] },
  { target: "Ho un'allergia al polline.", english: "I have a pollen allergy.", tags: ["general", "family"] },
  { target: "Cerco un albergo economico.", english: "I'm looking for a cheap hotel.", tags: ["general", "travel"] },
  { target: "Uno gnomo decora il giardino.", english: "A gnome decorates the garden.", tags: ["general", "family"] },
  { target: "Porto una torta alla festa.", english: "I'm bringing a cake to the party.", tags: ["general", "family"] },
  { target: "Ho un'urgenza al lavoro.", english: "I have an emergency at work.", tags: ["general", "work"] },
  { target: "Un cameriere porta il menù.", english: "A waiter brings the menu.", tags: ["general", "travel"] },
  { target: "Conosco una canzone italiana.", english: "I know an Italian song.", tags: ["general", "travel"] },

  // ── More partitives ──
  { target: "Metto del burro sulla pasta.", english: "I put some butter on the pasta.", tags: ["general", "family"] },
  { target: "Compra dello yogurt al supermercato.", english: "Buy some yogurt at the supermarket.", tags: ["general", "family"] },
  { target: "Aggiungo della panna al caffè.", english: "I add some cream to the coffee.", tags: ["general", "travel"] },
  { target: "Ci sono dei dolci sul tavolo.", english: "There are some sweets on the table.", tags: ["general", "family"] },
  { target: "Conosco degli artisti italiani.", english: "I know some Italian artists.", tags: ["general", "travel"] },
  { target: "Porto delle bottiglie d'acqua.", english: "I bring some bottles of water.", tags: ["general", "travel"] },
  { target: "Bevo del succo d'arancia.", english: "I drink some orange juice.", tags: ["general", "family"] },
  { target: "Vuoi dell'insalata?", english: "Do you want some salad?", tags: ["general", "family"] },

  // ── More gender agreement ──
  { target: "Un giorno freddo in dicembre.", english: "A cold day in December.", tags: ["general", "travel"] },
  { target: "Una sera fredda e piovosa.", english: "A cold and rainy evening.", tags: ["general", "travel"] },
  { target: "I fiori gialli sono bellissimi.", english: "The yellow flowers are beautiful.", tags: ["general", "family"] },
  { target: "Le rose gialle profumano tanto.", english: "The yellow roses smell so good.", tags: ["general", "family"] },
  { target: "Il cappotto lungo è elegante.", english: "The long coat is elegant.", tags: ["general", "travel"] },
  { target: "La sciarpa lunga è di lana.", english: "The long scarf is made of wool.", tags: ["general", "travel"] },
  { target: "Un piatto piccolo per il dolce.", english: "A small plate for dessert.", tags: ["general", "family"] },
  { target: "Una tazza piccola per il caffè.", english: "A small cup for coffee.", tags: ["general", "travel"] },
  { target: "I quadri moderni costano molto.", english: "Modern paintings cost a lot.", tags: ["general", "travel"] },
  { target: "Le sculture moderne sono al museo.", english: "The modern sculptures are at the museum.", tags: ["general", "travel"] },

  // ── More tricky genders ──
  { target: "Il dramma ha colpito tutti.", english: "The drama affected everyone.", tags: ["general", "work"] },
  { target: "La moto è veloce.", english: "The motorcycle is fast.", tags: ["general", "travel"] },
  { target: "Le moto parcheggiano qui.", english: "The motorcycles park here.", tags: ["general", "travel"] },
  { target: "Il papa vive a Roma.", english: "The pope lives in Rome.", tags: ["general", "travel"] },
  { target: "Il diploma è importante.", english: "The diploma is important.", tags: ["general", "work"] },
  { target: "La serie televisiva è lunga.", english: "The TV series is long.", tags: ["general", "family"] },
  { target: "Il panorama dalla finestra è bello.", english: "The view from the window is nice.", tags: ["general", "travel"] },
  { target: "Le analisi sono pronte.", english: "The test results are ready.", tags: ["general", "work"] },
  { target: "Il braccio mi fa male.", english: "My arm hurts.", tags: ["general", "family"] },
  { target: "Le braccia sono stanche.", english: "The arms are tired.", tags: ["general", "family"] },
  { target: "L'uovo è fresco.", english: "The egg is fresh.", tags: ["general", "family"] },
  { target: "Le uova sono nel frigorifero.", english: "The eggs are in the fridge.", tags: ["general", "family"] },
  { target: "Il dito è gonfio.", english: "The finger is swollen.", tags: ["general", "family"] },
  { target: "Le dita sono fredde.", english: "The fingers are cold.", tags: ["general", "family"] },
  { target: "Il ginocchio fa male.", english: "The knee hurts.", tags: ["general", "family"] },
];
const node05 = [
  // ── Mi piace + singular ──
  { target: "Mi piace il gelato.", english: "I like ice cream.", tags: ["general", "travel"] },
  { target: "Mi piace il mare.", english: "I like the sea.", tags: ["general", "travel"] },
  { target: "Mi piace la pizza.", english: "I like pizza.", tags: ["general", "travel"] },
  { target: "Mi piace questa canzone.", english: "I like this song.", tags: ["general", "family"] },
  { target: "Mi piace il tuo vestito.", english: "I like your dress.", tags: ["general", "family"] },
  { target: "Non mi piace il freddo.", english: "I don't like the cold.", tags: ["general", "travel"] },
  { target: "Mi piace il caffè italiano.", english: "I like Italian coffee.", tags: ["general", "travel"] },
  { target: "Mi piace la musica classica.", english: "I like classical music.", tags: ["general", "family"] },

  // ── Mi piacciono + plural ──
  { target: "Mi piacciono i gatti.", english: "I like cats.", tags: ["general", "family"] },
  { target: "Mi piacciono le vacanze al mare.", english: "I like beach vacations.", tags: ["general", "travel"] },
  { target: "Mi piacciono i dolci.", english: "I like sweets.", tags: ["general", "family"] },
  { target: "Non mi piacciono i ragni.", english: "I don't like spiders.", tags: ["general", "family"] },
  { target: "Mi piacciono le giornate di sole.", english: "I like sunny days.", tags: ["general", "travel"] },
  { target: "Mi piacciono i film italiani.", english: "I like Italian movies.", tags: ["general", "travel"] },
  { target: "Mi piacciono le tue idee.", english: "I like your ideas.", tags: ["general", "work"] },
  { target: "Non mi piacciono i lunedì.", english: "I don't like Mondays.", tags: ["general", "work"] },

  // ── All persons ──
  { target: "Ti piace la pasta?", english: "Do you like pasta?", tags: ["general", "travel"] },
  { target: "Gli piace il calcio.", english: "He likes soccer.", tags: ["general", "family"] },
  { target: "Le piace leggere romanzi.", english: "She likes reading novels.", tags: ["general", "family"] },
  { target: "Ci piace viaggiare in treno.", english: "We like traveling by train.", tags: ["general", "travel"] },
  { target: "Vi piace la città?", english: "Do you all like the city?", tags: ["general", "travel"] },
  { target: "Gli piace la montagna.", english: "They like the mountains.", tags: ["general", "travel"] },
  { target: "Ti piacciono i fiori?", english: "Do you like flowers?", tags: ["general", "family"] },
  { target: "Gli piacciono gli sport.", english: "He likes sports.", tags: ["general", "family"] },
  { target: "Le piacciono i gioielli.", english: "She likes jewelry.", tags: ["general", "family"] },
  { target: "Ci piacciono le sere d'estate.", english: "We like summer evenings.", tags: ["general", "travel"] },
  { target: "Vi piacciono i dolci italiani?", english: "Do you all like Italian sweets?", tags: ["general", "travel"] },
  { target: "Non gli piace alzarsi presto.", english: "He doesn't like getting up early.", tags: ["general", "family"] },
  { target: "Le piace il suo lavoro.", english: "She likes her job.", tags: ["general", "work"] },
  { target: "Ci piace stare insieme.", english: "We like being together.", tags: ["general", "family"] },
  { target: "Non ti piace il pesce?", english: "Don't you like fish?", tags: ["general", "family"] },

  // ── With infinitive ──
  { target: "Mi piace viaggiare.", english: "I like traveling.", tags: ["general", "travel"] },
  { target: "Non mi piace cucinare.", english: "I don't like cooking.", tags: ["general", "family"] },
  { target: "Ti piace nuotare?", english: "Do you like swimming?", tags: ["general", "travel"] },
  { target: "Ci piace camminare nel bosco.", english: "We like walking in the woods.", tags: ["general", "travel"] },
  { target: "Gli piace giocare a tennis.", english: "He likes playing tennis.", tags: ["general", "family"] },
  { target: "Le piace dipingere.", english: "She likes painting.", tags: ["general", "family"] },
  { target: "Mi piace ballare la salsa.", english: "I like dancing salsa.", tags: ["general", "travel"] },
  { target: "Non ci piace aspettare.", english: "We don't like waiting.", tags: ["general", "work"] },
  { target: "Vi piace sciare?", english: "Do you all like skiing?", tags: ["general", "travel"] },
  { target: "Mi piace cantare sotto la doccia.", english: "I like singing in the shower.", tags: ["general", "family"] },

  // ── Past: passato prossimo ──
  { target: "Mi è piaciuto il film.", english: "I liked the movie.", tags: ["general", "travel"] },
  { target: "Mi sono piaciute le vacanze.", english: "I liked the vacation.", tags: ["general", "travel"] },
  { target: "Ti è piaciuta la cena?", english: "Did you like the dinner?", tags: ["general", "family"] },
  { target: "Non mi è piaciuto il libro.", english: "I didn't like the book.", tags: ["general", "family"] },
  { target: "Gli è piaciuto il concerto.", english: "He liked the concert.", tags: ["general", "travel"] },
  { target: "Le è piaciuta la città.", english: "She liked the city.", tags: ["general", "travel"] },
  { target: "Ci sono piaciuti i musei.", english: "We liked the museums.", tags: ["general", "travel"] },
  { target: "Vi è piaciuto il viaggio?", english: "Did you all like the trip?", tags: ["general", "travel"] },
  { target: "Mi è piaciuta la tua presentazione.", english: "I liked your presentation.", tags: ["general", "work"] },
  { target: "Non mi sono piaciuti i dolci.", english: "I didn't like the desserts.", tags: ["general", "family"] },

  // ── Conditional ──
  { target: "Mi piacerebbe vivere in Italia.", english: "I would like to live in Italy.", tags: ["general", "travel"] },
  { target: "Ti piacerebbe venire con noi?", english: "Would you like to come with us?", tags: ["general", "travel"] },
  { target: "Ci piacerebbe visitare Venezia.", english: "We would like to visit Venice.", tags: ["general", "travel"] },
  { target: "Le piacerebbe cambiare lavoro.", english: "She would like to change jobs.", tags: ["general", "work"] },
  { target: "Mi piacerebbe imparare il pianoforte.", english: "I would like to learn the piano.", tags: ["general", "family"] },
  { target: "Vi piacerebbe tornare l'anno prossimo?", english: "Would you like to come back next year?", tags: ["general", "travel"] },
  { target: "Gli piacerebbe avere un cane.", english: "He would like to have a dog.", tags: ["general", "family"] },
  { target: "Mi piacerebbe provare quel ristorante.", english: "I would like to try that restaurant.", tags: ["general", "travel"] },

  // ── Mancare ──
  { target: "Mi manca casa.", english: "I miss home.", tags: ["general", "travel"] },
  { target: "Mi manchi tanto.", english: "I miss you so much.", tags: ["general", "family"] },
  { target: "Ti manca la tua famiglia?", english: "Do you miss your family?", tags: ["general", "family"] },
  { target: "Ci mancano gli amici.", english: "We miss our friends.", tags: ["general", "family"] },
  { target: "Mi manca il sole dell'Italia.", english: "I miss the Italian sun.", tags: ["general", "travel"] },
  { target: "Gli manca il suo paese.", english: "He misses his country.", tags: ["general", "travel"] },
  { target: "Le manca la nonna.", english: "She misses her grandmother.", tags: ["general", "family"] },
  { target: "Mi mancano le vacanze.", english: "I miss the holidays.", tags: ["general", "travel"] },

  // ── Servire ──
  { target: "Mi serve un aiuto.", english: "I need help.", tags: ["general", "work"] },
  { target: "Ti serve qualcosa?", english: "Do you need anything?", tags: ["general", "family"] },
  { target: "Ci serve più tempo.", english: "We need more time.", tags: ["general", "work"] },
  { target: "Mi servono le chiavi.", english: "I need the keys.", tags: ["general", "family"] },
  { target: "Non mi serve niente.", english: "I don't need anything.", tags: ["general", "family"] },
  { target: "Vi serve un passaggio?", english: "Do you need a ride?", tags: ["general", "travel"] },
  { target: "Gli serve un computer nuovo.", english: "He needs a new computer.", tags: ["general", "work"] },
  { target: "Mi servono dei soldi.", english: "I need some money.", tags: ["general", "work"] },

  // ── Interessare ──
  { target: "Mi interessa la storia.", english: "I'm interested in history.", tags: ["general", "work"] },
  { target: "Ti interessa questo lavoro?", english: "Are you interested in this job?", tags: ["general", "work"] },
  { target: "Non mi interessa la politica.", english: "I'm not interested in politics.", tags: ["general", "family"] },
  { target: "Ci interessano le lingue straniere.", english: "We're interested in foreign languages.", tags: ["general", "travel"] },
  { target: "Le interessa l'arte moderna.", english: "She's interested in modern art.", tags: ["general", "travel"] },
  { target: "Non gli interessa il gossip.", english: "He's not interested in gossip.", tags: ["general", "family"] },

  // ── Sembrare ──
  { target: "Mi sembra giusto.", english: "It seems right to me.", tags: ["general", "work"] },
  { target: "Ti sembra una buona idea?", english: "Does it seem like a good idea to you?", tags: ["general", "work"] },
  { target: "Mi sembra strano.", english: "It seems strange to me.", tags: ["general", "family"] },
  { target: "Non mi sembra vero.", english: "It doesn't seem real to me.", tags: ["general", "family"] },
  { target: "Ci sembra troppo caro.", english: "It seems too expensive to us.", tags: ["general", "travel"] },
  { target: "Mi sembra un bravo ragazzo.", english: "He seems like a nice guy to me.", tags: ["general", "family"] },

  // ── Bastare ──
  { target: "Mi basta un caffè.", english: "A coffee is enough for me.", tags: ["general", "travel"] },
  { target: "Ti basta questo?", english: "Is this enough for you?", tags: ["general", "family"] },
  { target: "Non mi basta il tempo.", english: "Time is not enough for me.", tags: ["general", "work"] },
  { target: "Ci bastano due giorni.", english: "Two days are enough for us.", tags: ["general", "travel"] },
  { target: "Mi basta sapere che stai bene.", english: "It's enough for me to know you're fine.", tags: ["general", "family"] },
  { target: "Vi basta una stanza?", english: "Is one room enough for you all?", tags: ["general", "travel"] },

  // ── Dispiacere ──
  { target: "Mi dispiace.", english: "I'm sorry.", tags: ["general", "travel"] },
  { target: "Mi dispiace per il ritardo.", english: "I'm sorry for the delay.", tags: ["general", "work"] },
  { target: "Ti dispiace chiudere la porta?", english: "Do you mind closing the door?", tags: ["general", "family"] },
  { target: "Ci dispiace molto.", english: "We are very sorry.", tags: ["general", "work"] },
  { target: "Mi dispiace disturbarti.", english: "I'm sorry to bother you.", tags: ["general", "work"] },
  { target: "Le dispiace aspettare un momento?", english: "Do you mind waiting a moment?", tags: ["general", "travel"] },

  // ── Succedere ──
  { target: "Cosa ti succede?", english: "What's happening to you?", tags: ["general", "family"] },
  { target: "Non mi succede mai niente.", english: "Nothing ever happens to me.", tags: ["general", "family"] },
  { target: "Cosa è successo?", english: "What happened?", tags: ["general", "work"] },
  { target: "Gli succedono cose strane.", english: "Strange things happen to him.", tags: ["general", "family"] },

  // ── Capitare ──
  { target: "Mi capita spesso.", english: "It happens to me often.", tags: ["general", "family"] },
  { target: "Ti capita di dimenticare?", english: "Does it happen to you to forget?", tags: ["general", "family"] },
  { target: "Capita a tutti di sbagliare.", english: "It happens to everyone to make mistakes.", tags: ["general", "work"] },
  { target: "Mi è capitato ieri.", english: "It happened to me yesterday.", tags: ["general", "family"] },
  { target: "Ci capita di litigare.", english: "It happens to us to argue.", tags: ["general", "family"] },

  // ── Extra mixed piacere ──
  { target: "A mia madre piace il giardino.", english: "My mother likes the garden.", tags: ["general", "family"] },
  { target: "Ai bambini piacciono i cartoni.", english: "Children like cartoons.", tags: ["general", "family"] },
  { target: "A Marco piace la birra tedesca.", english: "Marco likes German beer.", tags: ["general", "travel"] },
  { target: "Alla mia amica piace correre.", english: "My friend likes running.", tags: ["general", "family"] },
  { target: "Ai turisti piace Venezia.", english: "Tourists like Venice.", tags: ["general", "travel"] },
  { target: "A nessuno piace perdere.", english: "Nobody likes losing.", tags: ["general", "work"] },
  { target: "A tutti piace la domenica.", english: "Everyone likes Sundays.", tags: ["general", "family"] },
];
const node08 = [
  // ── Daily routine: svegliarsi ──
  { target: "Mi sveglio alle sei ogni mattina.", english: "I wake up at six every morning.", tags: ["general", "work"] },
  { target: "Ti svegli presto?", english: "Do you wake up early?", tags: ["general", "family"] },
  { target: "Si sveglia sempre tardi.", english: "He always wakes up late.", tags: ["general", "family"] },
  { target: "Ci svegliamo con la sveglia.", english: "We wake up with the alarm.", tags: ["general", "family"] },
  { target: "I bambini si svegliano di notte.", english: "The children wake up at night.", tags: ["general", "family"] },
  { target: "Non mi sveglio mai prima delle sette.", english: "I never wake up before seven.", tags: ["general", "family"] },

  // ── alzarsi ──
  { target: "Mi alzo subito dopo la sveglia.", english: "I get up right after the alarm.", tags: ["general", "work"] },
  { target: "Ti alzi sempre presto?", english: "Do you always get up early?", tags: ["general", "family"] },
  { target: "Lui si alza alle cinque per lavorare.", english: "He gets up at five to work.", tags: ["general", "work"] },
  { target: "Ci alziamo tardi la domenica.", english: "We get up late on Sundays.", tags: ["general", "family"] },
  { target: "Non mi alzo mai presto il sabato.", english: "I never get up early on Saturdays.", tags: ["general", "family"] },

  // ── lavarsi ──
  { target: "Mi lavo le mani prima di mangiare.", english: "I wash my hands before eating.", tags: ["general", "family"] },
  { target: "Ti lavi i denti tre volte al giorno?", english: "Do you brush your teeth three times a day?", tags: ["general", "family"] },
  { target: "Si lava i capelli ogni mattina.", english: "She washes her hair every morning.", tags: ["general", "family"] },
  { target: "Ci laviamo la faccia con acqua fredda.", english: "We wash our face with cold water.", tags: ["general", "family"] },
  { target: "I bambini si lavano da soli.", english: "The children wash themselves alone.", tags: ["general", "family"] },
  { target: "Mi lavo sempre prima di uscire.", english: "I always wash up before going out.", tags: ["general", "family"] },

  // ── vestirsi ──
  { target: "Mi vesto in fretta.", english: "I get dressed quickly.", tags: ["general", "work"] },
  { target: "Ti vesti elegante stasera?", english: "Are you dressing up tonight?", tags: ["general", "travel"] },
  { target: "Si veste sempre di nero.", english: "She always dresses in black.", tags: ["general", "family"] },
  { target: "Ci vestiamo in modo sportivo.", english: "We dress casually.", tags: ["general", "travel"] },
  { target: "Come ti vesti per la festa?", english: "How are you dressing for the party?", tags: ["general", "family"] },

  // ── pettinarsi ──
  { target: "Mi pettino davanti allo specchio.", english: "I comb my hair in front of the mirror.", tags: ["general", "family"] },
  { target: "Si pettina sempre con cura.", english: "She always combs her hair carefully.", tags: ["general", "family"] },
  { target: "Non mi pettino mai la mattina.", english: "I never comb my hair in the morning.", tags: ["general", "family"] },

  // ── truccarsi ──
  { target: "Mi trucco poco.", english: "I don't wear much makeup.", tags: ["general", "family"] },
  { target: "Si trucca prima di uscire.", english: "She puts on makeup before going out.", tags: ["general", "family"] },
  { target: "Non mi trucco tutti i giorni.", english: "I don't put on makeup every day.", tags: ["general", "family"] },

  // ── farsi la barba ──
  { target: "Mi faccio la barba ogni mattina.", english: "I shave every morning.", tags: ["general", "work"] },
  { target: "Si fa la barba prima della doccia.", english: "He shaves before the shower.", tags: ["general", "family"] },
  { target: "Non mi faccio la barba il weekend.", english: "I don't shave on the weekend.", tags: ["general", "family"] },

  // ── addormentarsi ──
  { target: "Mi addormento subito.", english: "I fall asleep right away.", tags: ["general", "family"] },
  { target: "Il bambino si addormenta alle otto.", english: "The child falls asleep at eight.", tags: ["general", "family"] },
  { target: "Non mi addormento senza leggere.", english: "I don't fall asleep without reading.", tags: ["general", "family"] },
  { target: "Ci addormentiamo sul divano.", english: "We fall asleep on the couch.", tags: ["general", "family"] },
  { target: "Si addormenta guardando la televisione.", english: "He falls asleep watching TV.", tags: ["general", "family"] },

  // ── Emotions: arrabbiarsi ──
  { target: "Mi arrabbio facilmente.", english: "I get angry easily.", tags: ["general", "family"] },
  { target: "Non ti arrabbiare con me.", english: "Don't get angry with me.", tags: ["general", "family"] },
  { target: "Si arrabbia per tutto.", english: "He gets angry about everything.", tags: ["general", "work"] },
  { target: "Perché vi arrabbiate?", english: "Why are you getting angry?", tags: ["general", "work"] },
  { target: "Non mi arrabbio quasi mai.", english: "I almost never get angry.", tags: ["general", "family"] },

  // ── annoiarsi ──
  { target: "Mi annoio a casa.", english: "I get bored at home.", tags: ["general", "family"] },
  { target: "Ti annoi al lavoro?", english: "Do you get bored at work?", tags: ["general", "work"] },
  { target: "I bambini si annoiano in macchina.", english: "The children get bored in the car.", tags: ["general", "family"] },
  { target: "Non mi annoio mai con te.", english: "I never get bored with you.", tags: ["general", "family"] },
  { target: "Si annoia senza fare niente.", english: "She gets bored doing nothing.", tags: ["general", "family"] },

  // ── preoccuparsi ──
  { target: "Mi preoccupo per i miei figli.", english: "I worry about my children.", tags: ["general", "family"] },
  { target: "Non ti preoccupare.", english: "Don't worry.", tags: ["general", "family"] },
  { target: "Si preoccupa troppo del lavoro.", english: "He worries too much about work.", tags: ["general", "work"] },
  { target: "Ci preoccupiamo per la salute.", english: "We worry about our health.", tags: ["general", "family"] },
  { target: "Non mi preoccupo per l'esame.", english: "I'm not worried about the exam.", tags: ["general", "work"] },

  // ── divertirsi ──
  { target: "Mi diverto molto alle feste.", english: "I have a lot of fun at parties.", tags: ["general", "family"] },
  { target: "Ti diverti in vacanza?", english: "Are you having fun on vacation?", tags: ["general", "travel"] },
  { target: "Ci divertiamo sempre insieme.", english: "We always have fun together.", tags: ["general", "family"] },
  { target: "I ragazzi si divertono al mare.", english: "The kids have fun at the beach.", tags: ["general", "travel"] },
  { target: "Si diverte a giocare a carte.", english: "He has fun playing cards.", tags: ["general", "family"] },

  // ── vergognarsi ──
  { target: "Mi vergogno di parlare in pubblico.", english: "I'm ashamed of speaking in public.", tags: ["general", "work"] },
  { target: "Non ti vergognare.", english: "Don't be ashamed.", tags: ["general", "family"] },
  { target: "Si vergogna di chiedere aiuto.", english: "He's ashamed to ask for help.", tags: ["general", "work"] },

  // ── innamorarsi ──
  { target: "Mi sono innamorato di lei subito.", english: "I fell in love with her right away.", tags: ["general", "family"] },
  { target: "Si sono innamorati in vacanza.", english: "They fell in love on vacation.", tags: ["general", "travel"] },
  { target: "Si innamora facilmente.", english: "She falls in love easily.", tags: ["general", "family"] },

  // ── lamentarsi ──
  { target: "Mi lamento troppo.", english: "I complain too much.", tags: ["general", "family"] },
  { target: "Non ti lamentare sempre.", english: "Don't always complain.", tags: ["general", "work"] },
  { target: "Si lamenta del tempo.", english: "He complains about the weather.", tags: ["general", "travel"] },

  // ── spaventarsi ──
  { target: "Mi spavento con i film horror.", english: "I get scared with horror movies.", tags: ["general", "family"] },
  { target: "Non ti spaventare, è solo un gatto.", english: "Don't be scared, it's just a cat.", tags: ["general", "family"] },
  { target: "Si spaventa facilmente.", english: "She gets scared easily.", tags: ["general", "family"] },

  // ── rilassarsi ──
  { target: "Mi rilasso ascoltando la musica.", english: "I relax by listening to music.", tags: ["general", "family"] },
  { target: "Ti rilassi in vacanza?", english: "Do you relax on vacation?", tags: ["general", "travel"] },
  { target: "Ci rilassiamo al parco.", english: "We relax at the park.", tags: ["general", "travel"] },
  { target: "Si rilassa leggendo un libro.", english: "He relaxes by reading a book.", tags: ["general", "family"] },

  // ── stancarsi ──
  { target: "Mi stanco facilmente.", english: "I get tired easily.", tags: ["general", "family"] },
  { target: "Ti stanchi a lavorare tutto il giorno?", english: "Do you get tired working all day?", tags: ["general", "work"] },
  { target: "Si stanca a camminare.", english: "She gets tired walking.", tags: ["general", "travel"] },
  { target: "Non mi stanco mai di viaggiare.", english: "I never get tired of traveling.", tags: ["general", "travel"] },

  // ── Reciprocal (noi/voi/loro) ──
  { target: "Ci vediamo domani.", english: "We'll see each other tomorrow.", tags: ["general", "family"] },
  { target: "Ci incontriamo al bar.", english: "We meet each other at the bar.", tags: ["general", "travel"] },
  { target: "Ci abbracciamo forte.", english: "We hug each other tight.", tags: ["general", "family"] },
  { target: "Ci salutiamo alla stazione.", english: "We greet each other at the station.", tags: ["general", "travel"] },
  { target: "Ci parliamo ogni giorno.", english: "We talk to each other every day.", tags: ["general", "family"] },
  { target: "Ci amiamo molto.", english: "We love each other very much.", tags: ["general", "family"] },
  { target: "Si conoscono da tanti anni.", english: "They've known each other for many years.", tags: ["general", "family"] },
  { target: "Vi vedete spesso?", english: "Do you see each other often?", tags: ["general", "family"] },
  { target: "Si scrivono ogni settimana.", english: "They write to each other every week.", tags: ["general", "family"] },
  { target: "Si aiutano a vicenda.", english: "They help each other.", tags: ["general", "work"] },
  { target: "Ci capiamo senza parlare.", english: "We understand each other without speaking.", tags: ["general", "family"] },
  { target: "Si telefonano la sera.", english: "They call each other in the evening.", tags: ["general", "family"] },

  // ── All persons full conjugation ──
  { target: "Mi lavo le mani.", english: "I wash my hands.", tags: ["general", "family"] },
  { target: "Ti lavi i capelli?", english: "Do you wash your hair?", tags: ["general", "family"] },
  { target: "Si lava la faccia.", english: "He washes his face.", tags: ["general", "family"] },
  { target: "Ci laviamo prima di cena.", english: "We wash up before dinner.", tags: ["general", "family"] },
  { target: "Vi lavate le mani?", english: "Do you wash your hands?", tags: ["general", "family"] },
  { target: "Si lavano dopo la palestra.", english: "They wash up after the gym.", tags: ["general", "family"] },

  // ── Passato prossimo ──
  { target: "Mi sono alzato presto stamattina.", english: "I got up early this morning.", tags: ["general", "work"] },
  { target: "Si è svegliata alle cinque.", english: "She woke up at five.", tags: ["general", "family"] },
  { target: "Ci siamo divertiti alla festa.", english: "We had fun at the party.", tags: ["general", "family"] },
  { target: "Vi siete preparati per la riunione?", english: "Did you all prepare for the meeting?", tags: ["general", "work"] },
  { target: "Si sono incontrati al ristorante.", english: "They met each other at the restaurant.", tags: ["general", "travel"] },
  { target: "Mi sono arrabbiata con lui.", english: "I got angry with him.", tags: ["general", "family"] },
  { target: "Si è vestito in fretta.", english: "He got dressed quickly.", tags: ["general", "work"] },
  { target: "Ci siamo svegliati tardi.", english: "We woke up late.", tags: ["general", "family"] },
  { target: "Ti sei divertito?", english: "Did you have fun?", tags: ["general", "travel"] },
  { target: "Si sono salutati alla porta.", english: "They said goodbye at the door.", tags: ["general", "family"] },
  { target: "Mi sono rilassata tutto il giorno.", english: "I relaxed all day.", tags: ["general", "travel"] },
  { target: "Si è preoccupato per niente.", english: "He worried for nothing.", tags: ["general", "family"] },
  { target: "Ci siamo addormentati tardi.", english: "We fell asleep late.", tags: ["general", "family"] },
  { target: "Si è lamentata del servizio.", english: "She complained about the service.", tags: ["general", "travel"] },
  { target: "Mi sono stancato di aspettare.", english: "I got tired of waiting.", tags: ["general", "work"] },
  { target: "Ti sei svegliato bene?", english: "Did you wake up well?", tags: ["general", "family"] },
  { target: "Si sono annoiati durante il film.", english: "They got bored during the movie.", tags: ["general", "travel"] },

  // ── With modal verbs ──
  { target: "Devo alzarmi presto domani.", english: "I have to get up early tomorrow.", tags: ["general", "work"] },
  { target: "Mi devo alzare alle sei.", english: "I have to get up at six.", tags: ["general", "work"] },
  { target: "Voglio lavarmi le mani.", english: "I want to wash my hands.", tags: ["general", "family"] },
  { target: "Mi voglio vestire bene.", english: "I want to dress well.", tags: ["general", "travel"] },
  { target: "Posso sedermi qui?", english: "Can I sit here?", tags: ["general", "travel"] },
  { target: "Mi posso rilassare un po'?", english: "Can I relax a bit?", tags: ["general", "family"] },
  { target: "Devi prepararti in fretta.", english: "You need to get ready quickly.", tags: ["general", "work"] },
  { target: "Ti devi svegliare adesso.", english: "You need to wake up now.", tags: ["general", "family"] },
  { target: "Vuole vestirsi prima di uscire.", english: "She wants to get dressed before going out.", tags: ["general", "family"] },
  { target: "Si deve alzare presto per il volo.", english: "He has to get up early for the flight.", tags: ["general", "travel"] },
  { target: "Dobbiamo prepararci per la cena.", english: "We need to get ready for dinner.", tags: ["general", "family"] },
  { target: "Ci dobbiamo incontrare alle tre.", english: "We have to meet at three.", tags: ["general", "work"] },

  // ── Negative ──
  { target: "Non mi preoccupo per questo.", english: "I don't worry about this.", tags: ["general", "work"] },
  { target: "Non si è arrabbiato.", english: "He didn't get angry.", tags: ["general", "family"] },
  { target: "Non mi sveglio mai con la sveglia.", english: "I never wake up with the alarm.", tags: ["general", "family"] },
  { target: "Non si lamentano mai.", english: "They never complain.", tags: ["general", "work"] },
  { target: "Non mi vesto mai di rosso.", english: "I never dress in red.", tags: ["general", "family"] },
  { target: "Non si è preparata per l'esame.", english: "She didn't prepare for the exam.", tags: ["general", "work"] },
  { target: "Non ci vediamo da molto tempo.", english: "We haven't seen each other in a long time.", tags: ["general", "family"] },
  { target: "Non mi addormento senza musica.", english: "I don't fall asleep without music.", tags: ["general", "family"] },

  // ── Extra mixed ──
  { target: "Mi faccio la doccia dopo la palestra.", english: "I shower after the gym.", tags: ["general", "family"] },
  { target: "Si preparano per la scuola.", english: "They get ready for school.", tags: ["general", "family"] },
  { target: "Mi siedo sempre allo stesso posto.", english: "I always sit in the same spot.", tags: ["general", "work"] },
  { target: "Si chiama Marco e lavora qui.", english: "His name is Marco and he works here.", tags: ["general", "work"] },
  { target: "Come ti chiami?", english: "What's your name?", tags: ["general", "travel"] },
  { target: "Mi sento bene oggi.", english: "I feel good today.", tags: ["general", "family"] },
  { target: "Si trovano bene in questa città.", english: "They feel at home in this city.", tags: ["general", "travel"] },
  { target: "Mi ricordo di quel giorno.", english: "I remember that day.", tags: ["general", "family"] },
  { target: "Si sposano il mese prossimo.", english: "They're getting married next month.", tags: ["general", "family"] },
  { target: "Mi cambio prima della cena.", english: "I change clothes before dinner.", tags: ["general", "family"] },
  { target: "Si trasferisce a Londra.", english: "He's moving to London.", tags: ["general", "travel"] },
  { target: "Mi organizzo la sera prima.", english: "I get organized the night before.", tags: ["general", "work"] },

  // ── More daily routine ──
  { target: "Mi preparo per uscire.", english: "I get ready to go out.", tags: ["general", "family"] },
  { target: "Si fanno la doccia ogni sera.", english: "They take a shower every evening.", tags: ["general", "family"] },
  { target: "Mi metto la giacca perché fa freddo.", english: "I put on a jacket because it's cold.", tags: ["general", "travel"] },
  { target: "Si toglie le scarpe all'ingresso.", english: "He takes off his shoes at the entrance.", tags: ["general", "family"] },
  { target: "Mi asciugo i capelli con il phon.", english: "I dry my hair with a blow dryer.", tags: ["general", "family"] },
  { target: "Si veste sempre di blu al lavoro.", english: "She always dresses in blue at work.", tags: ["general", "work"] },

  // ── More emotions ──
  { target: "Mi emoziono facilmente al cinema.", english: "I get emotional easily at the movies.", tags: ["general", "travel"] },
  { target: "Si offende per poco.", english: "He gets offended easily.", tags: ["general", "family"] },
  { target: "Ci arrabbiamo raramente.", english: "We rarely get angry.", tags: ["general", "family"] },
  { target: "Si deprime quando piove.", english: "She gets depressed when it rains.", tags: ["general", "family"] },
  { target: "Mi tranquillizzo con una tisana.", english: "I calm down with herbal tea.", tags: ["general", "family"] },

  // ── More reciprocal ──
  { target: "Si baciano sotto la pioggia.", english: "They kiss in the rain.", tags: ["general", "family"] },
  { target: "Ci scriviamo ogni giorno.", english: "We write to each other every day.", tags: ["general", "family"] },
  { target: "Si guardano negli occhi.", english: "They look into each other's eyes.", tags: ["general", "family"] },
  { target: "Ci rispettiamo molto.", english: "We respect each other a lot.", tags: ["general", "work"] },
  { target: "Si incontrano al bar la mattina.", english: "They meet at the bar in the morning.", tags: ["general", "travel"] },

  // ── More passato prossimo ──
  { target: "Mi sono svegliato con il mal di testa.", english: "I woke up with a headache.", tags: ["general", "family"] },
  { target: "Si è vestita elegante per la cena.", english: "She dressed up for dinner.", tags: ["general", "travel"] },
  { target: "Ci siamo abbracciati a lungo.", english: "We hugged for a long time.", tags: ["general", "family"] },
  { target: "Si è arrabbiata con il fratello.", english: "She got angry with her brother.", tags: ["general", "family"] },
  { target: "Mi sono divertito al concerto.", english: "I had fun at the concert.", tags: ["general", "travel"] },
];
const node09 = [
  // ── Per: purpose ──
  { target: "Studio per imparare.", english: "I study to learn.", tags: ["general", "work"] },
  { target: "Lavoro per vivere.", english: "I work to live.", tags: ["general", "work"] },
  { target: "Leggo per rilassarmi.", english: "I read to relax.", tags: ["general", "family"] },
  { target: "Corro per stare in forma.", english: "I run to stay in shape.", tags: ["general", "family"] },
  { target: "Risparmio per comprare una casa.", english: "I save to buy a house.", tags: ["general", "work"] },
  { target: "Cucino per la mia famiglia.", english: "I cook for my family.", tags: ["general", "family"] },
  { target: "Studio italiano per il viaggio.", english: "I study Italian for the trip.", tags: ["general", "travel"] },
  { target: "È utile per il lavoro.", english: "It's useful for work.", tags: ["general", "work"] },
  { target: "Faccio sport per divertirmi.", english: "I do sports for fun.", tags: ["general", "family"] },
  { target: "Prendo il treno per risparmiare.", english: "I take the train to save money.", tags: ["general", "travel"] },

  // ── Per: duration future ──
  { target: "Resto per due settimane.", english: "I'm staying for two weeks.", tags: ["general", "travel"] },
  { target: "Parto per un mese.", english: "I'm leaving for a month.", tags: ["general", "travel"] },
  { target: "Rimango per tre giorni.", english: "I'm staying for three days.", tags: ["general", "travel"] },
  { target: "Ci fermiamo per una notte.", english: "We're staying for one night.", tags: ["general", "travel"] },
  { target: "Vado via per una settimana.", english: "I'm going away for a week.", tags: ["general", "travel"] },
  { target: "Sarò fuori per cinque giorni.", english: "I'll be away for five days.", tags: ["general", "work"] },
  { target: "Resterà per tutto l'estate.", english: "She'll stay for the whole summer.", tags: ["general", "travel"] },
  { target: "Siamo qui per poco tempo.", english: "We're here for a short time.", tags: ["general", "travel"] },

  // ── Per: destination ──
  { target: "Partiamo per Roma domani.", english: "We leave for Rome tomorrow.", tags: ["general", "travel"] },
  { target: "Il treno per Milano è in ritardo.", english: "The train to Milan is late.", tags: ["general", "travel"] },
  { target: "Prendo l'aereo per Londra.", english: "I'm taking the plane to London.", tags: ["general", "travel"] },
  { target: "Parto per la Sicilia venerdì.", english: "I leave for Sicily on Friday.", tags: ["general", "travel"] },
  { target: "L'autobus per l'aeroporto è qui.", english: "The bus to the airport is here.", tags: ["general", "travel"] },
  { target: "La nave parte per la Sardegna.", english: "The ship departs for Sardinia.", tags: ["general", "travel"] },
  { target: "Domani si parte per la montagna.", english: "Tomorrow we leave for the mountains.", tags: ["general", "travel"] },

  // ── Per: deadline ──
  { target: "Finisco per venerdì.", english: "I finish by Friday.", tags: ["general", "work"] },
  { target: "Lo voglio per domani.", english: "I want it by tomorrow.", tags: ["general", "work"] },
  { target: "Dev'essere pronto per lunedì.", english: "It must be ready by Monday.", tags: ["general", "work"] },
  { target: "Consegno il progetto per la fine del mese.", english: "I hand in the project by the end of the month.", tags: ["general", "work"] },
  { target: "Devo rispondere per oggi.", english: "I have to reply by today.", tags: ["general", "work"] },
  { target: "Preparati per le otto.", english: "Get ready by eight.", tags: ["general", "family"] },

  // ── Per: in exchange ──
  { target: "L'ho comprato per dieci euro.", english: "I bought it for ten euros.", tags: ["general", "travel"] },
  { target: "Grazie per tutto.", english: "Thanks for everything.", tags: ["general", "family"] },
  { target: "Grazie per l'aiuto.", english: "Thanks for the help.", tags: ["general", "work"] },
  { target: "Pago cento euro per la stanza.", english: "I pay a hundred euros for the room.", tags: ["general", "travel"] },
  { target: "L'ho venduto per poco.", english: "I sold it for very little.", tags: ["general", "work"] },
  { target: "Grazie per la cena.", english: "Thanks for dinner.", tags: ["general", "family"] },
  { target: "Scusa per il ritardo.", english: "Sorry for the delay.", tags: ["general", "work"] },
  { target: "Grazie per il regalo.", english: "Thanks for the gift.", tags: ["general", "family"] },

  // ── Per: through/along ──
  { target: "Passiamo per il centro.", english: "We pass through downtown.", tags: ["general", "travel"] },
  { target: "Camminiamo per la strada.", english: "We walk along the street.", tags: ["general", "travel"] },
  { target: "Viaggio per tutta l'Italia.", english: "I travel across all of Italy.", tags: ["general", "travel"] },
  { target: "Passano per il parco ogni giorno.", english: "They pass through the park every day.", tags: ["general", "travel"] },
  { target: "Guido per le strade di campagna.", english: "I drive through country roads.", tags: ["general", "travel"] },

  // ── Da: origin ──
  { target: "Vengo da Napoli.", english: "I come from Naples.", tags: ["general", "travel"] },
  { target: "Arriva dall'America.", english: "He arrives from America.", tags: ["general", "travel"] },
  { target: "Torno da Londra domani.", english: "I come back from London tomorrow.", tags: ["general", "travel"] },
  { target: "Vengono dal Giappone.", english: "They come from Japan.", tags: ["general", "travel"] },
  { target: "Arriviamo dalla stazione.", english: "We're coming from the station.", tags: ["general", "travel"] },
  { target: "Esco dalla banca adesso.", english: "I'm leaving the bank now.", tags: ["general", "work"] },
  { target: "Da dove viene questo vino?", english: "Where does this wine come from?", tags: ["general", "travel"] },
  { target: "Parto da Roma alle dieci.", english: "I leave from Rome at ten.", tags: ["general", "travel"] },

  // ── Da: since/for duration ──
  { target: "Vivo qui da tre anni.", english: "I've lived here for three years.", tags: ["general", "travel"] },
  { target: "Aspetto da un'ora.", english: "I've been waiting for an hour.", tags: ["general", "travel"] },
  { target: "Studio italiano da sei mesi.", english: "I've been studying Italian for six months.", tags: ["general", "travel"] },
  { target: "Lavoro qui da gennaio.", english: "I've been working here since January.", tags: ["general", "work"] },
  { target: "Non lo vedo da mesi.", english: "I haven't seen him for months.", tags: ["general", "family"] },
  { target: "Siamo amici da sempre.", english: "We've been friends forever.", tags: ["general", "family"] },
  { target: "Non piove da settimane.", english: "It hasn't rained for weeks.", tags: ["general", "travel"] },
  { target: "Lavora da stamattina.", english: "He's been working since this morning.", tags: ["general", "work"] },
  { target: "Sono sveglio da presto.", english: "I've been awake since early.", tags: ["general", "family"] },
  { target: "Abitiamo qui da dieci anni.", english: "We've been living here for ten years.", tags: ["general", "family"] },

  // ── Da: at someone's place ──
  { target: "Vado da Marco.", english: "I'm going to Marco's place.", tags: ["general", "family"] },
  { target: "Ceniamo da mia nonna.", english: "We're having dinner at my grandma's.", tags: ["general", "family"] },
  { target: "Dormo da un amico stasera.", english: "I'm sleeping at a friend's tonight.", tags: ["general", "family"] },
  { target: "Siamo da Paolo.", english: "We're at Paolo's place.", tags: ["general", "family"] },
  { target: "Andiamo dal dottore.", english: "We're going to the doctor's.", tags: ["general", "family"] },
  { target: "Sono dal parrucchiere.", english: "I'm at the hairdresser's.", tags: ["general", "travel"] },
  { target: "Pranziamo da mia madre.", english: "We have lunch at my mother's.", tags: ["general", "family"] },
  { target: "Passo da te stasera.", english: "I'll stop by your place tonight.", tags: ["general", "family"] },

  // ── Da: by agent ──
  { target: "Scritto da Dante.", english: "Written by Dante.", tags: ["general", "work"] },
  { target: "Fatto da lei.", english: "Made by her.", tags: ["general", "family"] },
  { target: "Dipinto da Leonardo.", english: "Painted by Leonardo.", tags: ["general", "travel"] },
  { target: "Preparato da mia madre.", english: "Prepared by my mother.", tags: ["general", "family"] },
  { target: "Diretto da Fellini.", english: "Directed by Fellini.", tags: ["general", "travel"] },
  { target: "Costruito da un architetto famoso.", english: "Built by a famous architect.", tags: ["general", "travel"] },

  // ── Da: purpose/use ──
  { target: "Vuoi qualcosa da bere?", english: "Do you want something to drink?", tags: ["general", "travel"] },
  { target: "Ho bisogno di una macchina da scrivere.", english: "I need a typewriter.", tags: ["general", "work"] },
  { target: "Cerco gli occhiali da sole.", english: "I'm looking for the sunglasses.", tags: ["general", "travel"] },
  { target: "La sala da pranzo è grande.", english: "The dining room is big.", tags: ["general", "family"] },
  { target: "Hai qualcosa da mangiare?", english: "Do you have something to eat?", tags: ["general", "family"] },
  { target: "Il costume da bagno è in valigia.", english: "The swimsuit is in the suitcase.", tags: ["general", "travel"] },
  { target: "Ho molto da fare oggi.", english: "I have a lot to do today.", tags: ["general", "work"] },
  { target: "C'è qualcosa da vedere qui.", english: "There's something to see here.", tags: ["general", "travel"] },
  { target: "Niente da dichiarare.", english: "Nothing to declare.", tags: ["general", "travel"] },
  { target: "La camera da letto è al piano di sopra.", english: "The bedroom is upstairs.", tags: ["general", "family"] },

  // ── In/a for locations ──
  { target: "Vivo in Italia.", english: "I live in Italy.", tags: ["general", "travel"] },
  { target: "Lavoro in centro.", english: "I work downtown.", tags: ["general", "work"] },
  { target: "Sono in ufficio.", english: "I'm at the office.", tags: ["general", "work"] },
  { target: "Andiamo a Roma domani.", english: "We're going to Rome tomorrow.", tags: ["general", "travel"] },
  { target: "Torno a casa presto.", english: "I'm going home early.", tags: ["general", "family"] },
  { target: "Vado al cinema stasera.", english: "I'm going to the movies tonight.", tags: ["general", "travel"] },
  { target: "Ci vediamo alla stazione.", english: "We'll meet at the station.", tags: ["general", "travel"] },
  { target: "Abito in campagna.", english: "I live in the countryside.", tags: ["general", "family"] },
  { target: "Studiamo in biblioteca.", english: "We study in the library.", tags: ["general", "work"] },
  { target: "Vado a scuola a piedi.", english: "I walk to school.", tags: ["general", "family"] },
  { target: "Siamo al ristorante.", english: "We're at the restaurant.", tags: ["general", "travel"] },
  { target: "Vive in Spagna da un anno.", english: "He's been living in Spain for a year.", tags: ["general", "travel"] },
  { target: "Andiamo a teatro sabato.", english: "We're going to the theater on Saturday.", tags: ["general", "travel"] },
  { target: "Lavoro in un negozio.", english: "I work in a shop.", tags: ["general", "work"] },
  { target: "Sono a letto.", english: "I'm in bed.", tags: ["general", "family"] },

  // ── More per (purpose/exchange) ──
  { target: "Per me un espresso, grazie.", english: "An espresso for me, thanks.", tags: ["general", "travel"] },
  { target: "È perfetto per l'estate.", english: "It's perfect for summer.", tags: ["general", "travel"] },
  { target: "Lavoriamo per un futuro migliore.", english: "We work for a better future.", tags: ["general", "work"] },
  { target: "Per caso sai dov'è la stazione?", english: "By any chance do you know where the station is?", tags: ["general", "travel"] },
  { target: "Per me va bene così.", english: "It's fine for me like this.", tags: ["general", "work"] },
  { target: "Per fortuna non piove.", english: "Luckily it's not raining.", tags: ["general", "travel"] },
  { target: "Studio per diventare medico.", english: "I study to become a doctor.", tags: ["general", "work"] },

  // ── More da (various uses) ──
  { target: "Sono stato dal dentista stamattina.", english: "I was at the dentist's this morning.", tags: ["general", "family"] },
  { target: "Da piccolo giocavo sempre fuori.", english: "As a child I always played outside.", tags: ["general", "family"] },
  { target: "Da oggi cambio abitudini.", english: "Starting today I change my habits.", tags: ["general", "family"] },
  { target: "Da questa parte, prego.", english: "This way, please.", tags: ["general", "travel"] },
  { target: "Il regalo è da parte di tutti noi.", english: "The gift is from all of us.", tags: ["general", "family"] },
  { target: "Il vestito da sera è bellissimo.", english: "The evening dress is beautiful.", tags: ["general", "travel"] },
  { target: "Non ho niente da dire.", english: "I have nothing to say.", tags: ["general", "work"] },

  // ── More in/a for locations ──
  { target: "Andiamo a mangiare fuori.", english: "Let's go eat out.", tags: ["general", "travel"] },
  { target: "Abito in un palazzo antico.", english: "I live in an old building.", tags: ["general", "family"] },
  { target: "Vado al lavoro in macchina.", english: "I go to work by car.", tags: ["general", "work"] },
  { target: "In montagna l'aria è fresca.", english: "In the mountains the air is fresh.", tags: ["general", "travel"] },
  { target: "Siamo a tavola, vieni.", english: "We're at the table, come.", tags: ["general", "family"] },
  { target: "In primavera tutto fiorisce.", english: "In spring everything blooms.", tags: ["general", "travel"] },
  { target: "Vado a fare la spesa.", english: "I'm going grocery shopping.", tags: ["general", "family"] },
  { target: "In estate fa molto caldo.", english: "In summer it's very hot.", tags: ["general", "travel"] },
  { target: "Torna a casa presto, per favore.", english: "Come home early, please.", tags: ["general", "family"] },
  { target: "Lavora in una banca in centro.", english: "She works at a bank downtown.", tags: ["general", "work"] },
];
const node14 = [
  // ── Futuro semplice regular -are ──
  { target: "Parlerò con il capo domani.", english: "I'll talk to the boss tomorrow.", tags: ["general", "work"] },
  { target: "Mangeremo al ristorante stasera.", english: "We'll eat at the restaurant tonight.", tags: ["general", "travel"] },
  { target: "Studierai per l'esame?", english: "Will you study for the exam?", tags: ["general", "work"] },
  { target: "Cucinerà la nonna.", english: "Grandma will cook.", tags: ["general", "family"] },
  { target: "Lavorerete anche sabato?", english: "Will you all work on Saturday too?", tags: ["general", "work"] },
  { target: "Canteranno alla festa.", english: "They will sing at the party.", tags: ["general", "family"] },
  { target: "Pagherò io il conto.", english: "I'll pay the bill.", tags: ["general", "travel"] },
  { target: "Giocherai a tennis domani?", english: "Will you play tennis tomorrow?", tags: ["general", "family"] },
  { target: "Compreremo i biglietti online.", english: "We'll buy the tickets online.", tags: ["general", "travel"] },
  { target: "Torneranno la settimana prossima.", english: "They'll come back next week.", tags: ["general", "family"] },

  // ── Futuro semplice regular -ere ──
  { target: "Leggerò quel libro in vacanza.", english: "I'll read that book on vacation.", tags: ["general", "travel"] },
  { target: "Prenderemo un caffè al bar.", english: "We'll have a coffee at the bar.", tags: ["general", "travel"] },
  { target: "Scriverà una lettera.", english: "She'll write a letter.", tags: ["general", "work"] },
  { target: "Chiuderanno il negozio alle otto.", english: "They'll close the shop at eight.", tags: ["general", "work"] },
  { target: "Risponderai alla sua email?", english: "Will you reply to his email?", tags: ["general", "work"] },
  { target: "Metteremo i fiori sul tavolo.", english: "We'll put the flowers on the table.", tags: ["general", "family"] },

  // ── Futuro semplice regular -ire ──
  { target: "Dormirò fino a tardi sabato.", english: "I'll sleep late on Saturday.", tags: ["general", "family"] },
  { target: "Capirà tutto dopo la lezione.", english: "He'll understand everything after the lesson.", tags: ["general", "work"] },
  { target: "Partiremo presto domani mattina.", english: "We'll leave early tomorrow morning.", tags: ["general", "travel"] },
  { target: "Finirai il progetto in tempo?", english: "Will you finish the project on time?", tags: ["general", "work"] },
  { target: "Apriranno un nuovo ristorante.", english: "They'll open a new restaurant.", tags: ["general", "travel"] },
  { target: "Sentiremo la musica dal balcone.", english: "We'll hear the music from the balcony.", tags: ["general", "family"] },

  // ── Futuro irregular: sarò ──
  { target: "Sarò a casa alle cinque.", english: "I'll be home at five.", tags: ["general", "family"] },
  { target: "Sarà una bella giornata.", english: "It will be a beautiful day.", tags: ["general", "travel"] },
  { target: "Sarai stanco dopo il viaggio.", english: "You'll be tired after the trip.", tags: ["general", "travel"] },
  { target: "Saremo pronti fra un'ora.", english: "We'll be ready in an hour.", tags: ["general", "family"] },
  { target: "Saranno contenti della notizia.", english: "They'll be happy about the news.", tags: ["general", "family"] },
  { target: "Non sarà facile.", english: "It won't be easy.", tags: ["general", "work"] },
  { target: "Sarà un viaggio lungo.", english: "It will be a long trip.", tags: ["general", "travel"] },

  // ── Futuro irregular: avrò ──
  { target: "Avrò più tempo il mese prossimo.", english: "I'll have more time next month.", tags: ["general", "work"] },
  { target: "Avrai fame dopo la palestra.", english: "You'll be hungry after the gym.", tags: ["general", "family"] },
  { target: "Avremo ospiti questo weekend.", english: "We'll have guests this weekend.", tags: ["general", "family"] },
  { target: "Avranno bisogno di aiuto.", english: "They'll need help.", tags: ["general", "work"] },
  { target: "Avrà vent'anni a maggio.", english: "She'll be twenty in May.", tags: ["general", "family"] },

  // ── Futuro irregular: farò ──
  { target: "Farò la spesa dopo il lavoro.", english: "I'll do the grocery shopping after work.", tags: ["general", "family"] },
  { target: "Farai colazione con noi?", english: "Will you have breakfast with us?", tags: ["general", "family"] },
  { target: "Faremo una passeggiata al mare.", english: "We'll take a walk by the sea.", tags: ["general", "travel"] },
  { target: "Faranno una festa per il compleanno.", english: "They'll have a birthday party.", tags: ["general", "family"] },
  { target: "Cosa farai domani?", english: "What will you do tomorrow?", tags: ["general", "family"] },

  // ── Futuro irregular: andrò ──
  { target: "Andrò in vacanza ad agosto.", english: "I'll go on vacation in August.", tags: ["general", "travel"] },
  { target: "Andrai al concerto sabato?", english: "Will you go to the concert on Saturday?", tags: ["general", "travel"] },
  { target: "Andremo a Venezia in treno.", english: "We'll go to Venice by train.", tags: ["general", "travel"] },
  { target: "Andranno a vivere all'estero.", english: "They'll go live abroad.", tags: ["general", "travel"] },
  { target: "Non andrà bene se non studi.", english: "It won't go well if you don't study.", tags: ["general", "work"] },

  // ── Futuro irregular: verrò ──
  { target: "Verrò a trovarti domenica.", english: "I'll come visit you on Sunday.", tags: ["general", "family"] },
  { target: "Verrai alla cena?", english: "Will you come to dinner?", tags: ["general", "family"] },
  { target: "Verrà anche sua sorella.", english: "His sister will come too.", tags: ["general", "family"] },
  { target: "Verranno tutti alla riunione.", english: "Everyone will come to the meeting.", tags: ["general", "work"] },
  { target: "Verremo con piacere.", english: "We'll come with pleasure.", tags: ["general", "family"] },

  // ── Futuro irregular: vedrò ──
  { target: "Vedrò il dottore la prossima settimana.", english: "I'll see the doctor next week.", tags: ["general", "family"] },
  { target: "Vedrai che andrà tutto bene.", english: "You'll see, everything will be fine.", tags: ["general", "family"] },
  { target: "Vedremo cosa succede.", english: "We'll see what happens.", tags: ["general", "work"] },
  { target: "Vedranno i risultati presto.", english: "They'll see the results soon.", tags: ["general", "work"] },

  // ── Futuro irregular: potrò ──
  { target: "Potrò venire dopo le cinque.", english: "I'll be able to come after five.", tags: ["general", "work"] },
  { target: "Potrai restare quanto vuoi.", english: "You'll be able to stay as long as you want.", tags: ["general", "travel"] },
  { target: "Non potremo partire domani.", english: "We won't be able to leave tomorrow.", tags: ["general", "travel"] },
  { target: "Potranno aiutarci sabato.", english: "They'll be able to help us on Saturday.", tags: ["general", "family"] },

  // ── Futuro irregular: dovrò ──
  { target: "Dovrò lavorare anche sabato.", english: "I'll have to work on Saturday too.", tags: ["general", "work"] },
  { target: "Dovrai alzarti presto.", english: "You'll have to get up early.", tags: ["general", "work"] },
  { target: "Dovremo comprare più cibo.", english: "We'll have to buy more food.", tags: ["general", "family"] },
  { target: "Dovranno cambiare i piani.", english: "They'll have to change their plans.", tags: ["general", "work"] },

  // ── Futuro irregular: saprò ──
  { target: "Saprò la risposta domani.", english: "I'll know the answer tomorrow.", tags: ["general", "work"] },
  { target: "Saprai cosa fare.", english: "You'll know what to do.", tags: ["general", "work"] },
  { target: "Sapremo i risultati venerdì.", english: "We'll know the results on Friday.", tags: ["general", "work"] },

  // ── Futuro irregular: vivrò ──
  { target: "Vivrò in Italia un giorno.", english: "I'll live in Italy one day.", tags: ["general", "travel"] },
  { target: "Vivranno insieme l'anno prossimo.", english: "They'll live together next year.", tags: ["general", "family"] },
  { target: "Vivremo vicino al mare.", english: "We'll live near the sea.", tags: ["general", "travel"] },

  // ── Futuro irregular: rimarrò ──
  { target: "Rimarrò a casa tutto il giorno.", english: "I'll stay home all day.", tags: ["general", "family"] },
  { target: "Rimarranno fino a domenica.", english: "They'll stay until Sunday.", tags: ["general", "travel"] },
  { target: "Rimarremo in contatto.", english: "We'll stay in touch.", tags: ["general", "family"] },

  // ── Futuro irregular: terrò ──
  { target: "Terrò il segreto.", english: "I'll keep the secret.", tags: ["general", "family"] },
  { target: "Terrai il posto per me?", english: "Will you save my spot?", tags: ["general", "travel"] },

  // ── Futuro irregular: berrò ──
  { target: "Berrò solo acqua stasera.", english: "I'll only drink water tonight.", tags: ["general", "travel"] },
  { target: "Berranno un bicchiere di vino.", english: "They'll drink a glass of wine.", tags: ["general", "travel"] },

  // ── Futuro irregular: vorrò ──
  { target: "Non vorrà venire.", english: "He won't want to come.", tags: ["general", "family"] },
  { target: "Vorranno sapere la verità.", english: "They'll want to know the truth.", tags: ["general", "work"] },

  // ── Futuro irregular: uscirò ──
  { target: "Uscirò presto dall'ufficio.", english: "I'll leave the office early.", tags: ["general", "work"] },
  { target: "Usciranno stasera con gli amici.", english: "They'll go out tonight with friends.", tags: ["general", "family"] },
  { target: "Usciremo dopo cena.", english: "We'll go out after dinner.", tags: ["general", "family"] },

  // ── Future of probability ──
  { target: "Sarà vero?", english: "Could it be true?", tags: ["general", "family"] },
  { target: "Avrà trent'anni.", english: "He must be about thirty.", tags: ["general", "family"] },
  { target: "Costerà molto.", english: "It probably costs a lot.", tags: ["general", "travel"] },
  { target: "Dove sarà?", english: "Where could he be?", tags: ["general", "family"] },
  { target: "Saranno le dieci.", english: "It must be about ten.", tags: ["general", "work"] },
  { target: "Avrà fame dopo la palestra.", english: "He's probably hungry after the gym.", tags: ["general", "family"] },
  { target: "Sarà in ritardo come sempre.", english: "He's probably late as always.", tags: ["general", "work"] },
  { target: "Chi sarà a quest'ora?", english: "Who could it be at this hour?", tags: ["general", "family"] },
  { target: "Peserà almeno dieci chili.", english: "It probably weighs at least ten kilos.", tags: ["general", "travel"] },
  { target: "Starà dormendo.", english: "He's probably sleeping.", tags: ["general", "family"] },

  // ── Plans with time expressions ──
  { target: "Domani andrò al mare.", english: "Tomorrow I'll go to the beach.", tags: ["general", "travel"] },
  { target: "L'anno prossimo viaggeremo in Asia.", english: "Next year we'll travel to Asia.", tags: ["general", "travel"] },
  { target: "La settimana prossima comincio il corso.", english: "Next week I start the course.", tags: ["general", "work"] },
  { target: "Il mese prossimo ci spostiamo.", english: "Next month we'll move.", tags: ["general", "family"] },
  { target: "Fra poco arriveranno gli ospiti.", english: "The guests will arrive soon.", tags: ["general", "family"] },
  { target: "Tra un'ora saremo a casa.", english: "In one hour we'll be home.", tags: ["general", "family"] },
  { target: "Un giorno visiterò il Giappone.", english: "One day I'll visit Japan.", tags: ["general", "travel"] },
  { target: "In futuro tutto cambierà.", english: "In the future everything will change.", tags: ["general", "work"] },
  { target: "Dopodomani parto per la Francia.", english: "The day after tomorrow I leave for France.", tags: ["general", "travel"] },
  { target: "Stasera guarderemo un film.", english: "Tonight we'll watch a movie.", tags: ["general", "family"] },
  { target: "Fra due settimane finirà il corso.", english: "In two weeks the course will end.", tags: ["general", "work"] },
  { target: "Tra poco pioverà.", english: "It will rain soon.", tags: ["general", "travel"] },

  // ── Futuro anteriore ──
  { target: "Avrò finito entro le cinque.", english: "I'll have finished by five.", tags: ["general", "work"] },
  { target: "Quando sarà arrivato, ceneremo.", english: "When he arrives, we'll have dinner.", tags: ["general", "family"] },
  { target: "Fra un mese avrò completato il corso.", english: "In a month I'll have completed the course.", tags: ["general", "work"] },
  { target: "Quando avrai letto il libro, parliamo.", english: "When you've read the book, let's talk.", tags: ["general", "family"] },
  { target: "Entro domani avremo preparato tutto.", english: "By tomorrow we'll have prepared everything.", tags: ["general", "work"] },
  { target: "Quando saranno partiti, puliremo.", english: "When they've left, we'll clean.", tags: ["general", "family"] },
  { target: "Avrò dormito poco stanotte.", english: "I probably slept very little tonight.", tags: ["general", "family"] },
  { target: "Sarà già arrivata a quest'ora.", english: "She must have already arrived by now.", tags: ["general", "travel"] },
  { target: "Avranno già mangiato.", english: "They must have already eaten.", tags: ["general", "family"] },
  { target: "Quando avrò risparmiato, comprerò una casa.", english: "When I've saved enough, I'll buy a house.", tags: ["general", "work"] },
  { target: "Fra un anno ci saremo laureati.", english: "In a year we'll have graduated.", tags: ["general", "work"] },
  { target: "Quando saremo tornati, ci riposeremo.", english: "When we've returned, we'll rest.", tags: ["general", "travel"] },

  // ── Trapassato prossimo ──
  { target: "Avevo già mangiato.", english: "I had already eaten.", tags: ["general", "family"] },
  { target: "Non ero mai stato in Giappone.", english: "I had never been to Japan.", tags: ["general", "travel"] },
  { target: "Aveva finito il lavoro.", english: "He had finished the work.", tags: ["general", "work"] },
  { target: "Eravamo andati al cinema.", english: "We had gone to the movies.", tags: ["general", "travel"] },
  { target: "Avevano detto la verità.", english: "They had told the truth.", tags: ["general", "family"] },
  { target: "Avevo dimenticato le chiavi a casa.", english: "I had forgotten the keys at home.", tags: ["general", "family"] },
  { target: "Non aveva mai visto il mare.", english: "She had never seen the sea.", tags: ["general", "travel"] },
  { target: "Avevamo prenotato un tavolo.", english: "We had booked a table.", tags: ["general", "travel"] },
  { target: "Eri già partito quando ho chiamato.", english: "You had already left when I called.", tags: ["general", "family"] },
  { target: "Avevano comprato i biglietti.", english: "They had bought the tickets.", tags: ["general", "travel"] },
  { target: "Non avevo ancora finito.", english: "I hadn't finished yet.", tags: ["general", "work"] },
  { target: "Aveva studiato tutta la notte.", english: "He had studied all night.", tags: ["general", "work"] },
  { target: "Eravamo già arrivati all'albergo.", english: "We had already arrived at the hotel.", tags: ["general", "travel"] },
  { target: "Non avevi mai provato la pizza napoletana?", english: "You had never tried Neapolitan pizza?", tags: ["general", "travel"] },
  { target: "Avevo promesso di venire.", english: "I had promised to come.", tags: ["general", "family"] },
  { target: "Era andato dal dottore.", english: "He had gone to the doctor.", tags: ["general", "family"] },
  { target: "Avevamo già parlato di questo.", english: "We had already talked about this.", tags: ["general", "work"] },
  { target: "Aveva perso il treno.", english: "She had missed the train.", tags: ["general", "travel"] },
  { target: "Non avevano mai litigato prima.", english: "They had never argued before.", tags: ["general", "family"] },
  { target: "Avevo letto quel libro da bambino.", english: "I had read that book as a child.", tags: ["general", "family"] },

  // ── Mixed future sentences ──
  { target: "Chiamerò quando arrivo.", english: "I'll call when I arrive.", tags: ["general", "travel"] },
  { target: "Ti scriverò appena posso.", english: "I'll write to you as soon as I can.", tags: ["general", "family"] },
  { target: "Cercheremo un appartamento più grande.", english: "We'll look for a bigger apartment.", tags: ["general", "family"] },
  { target: "Cambierà idea, vedrai.", english: "He'll change his mind, you'll see.", tags: ["general", "family"] },
  { target: "Imparerò a cucinare bene.", english: "I'll learn to cook well.", tags: ["general", "family"] },
  { target: "Prenderanno una decisione domani.", english: "They'll make a decision tomorrow.", tags: ["general", "work"] },
  { target: "Finiremo il lavoro entro sera.", english: "We'll finish the work by evening.", tags: ["general", "work"] },
  { target: "Troverò una soluzione.", english: "I'll find a solution.", tags: ["general", "work"] },
  { target: "Tornerai presto?", english: "Will you come back soon?", tags: ["general", "family"] },
  { target: "Ci incontreremo alla stazione.", english: "We'll meet at the station.", tags: ["general", "travel"] },
  { target: "Porterò il dolce per la cena.", english: "I'll bring dessert for dinner.", tags: ["general", "family"] },
  { target: "Spenderemo meno il prossimo mese.", english: "We'll spend less next month.", tags: ["general", "work"] },
  { target: "Pioverà tutto il weekend.", english: "It will rain all weekend.", tags: ["general", "travel"] },
  { target: "Inviteremo tutti gli amici.", english: "We'll invite all our friends.", tags: ["general", "family"] },
  { target: "Organizzerò una cena a casa.", english: "I'll organize a dinner at home.", tags: ["general", "family"] },
  { target: "Studieranno all'estero l'anno prossimo.", english: "They'll study abroad next year.", tags: ["general", "work"] },
  { target: "Quando finirai il corso?", english: "When will you finish the course?", tags: ["general", "work"] },
  { target: "Non dimenticherò mai questo viaggio.", english: "I'll never forget this trip.", tags: ["general", "travel"] },
  { target: "Preparerò tutto per la partenza.", english: "I'll prepare everything for the departure.", tags: ["general", "travel"] },
  { target: "Migliorerà con la pratica.", english: "It will improve with practice.", tags: ["general", "work"] },

  // ── Mixed trapassato ──
  { target: "Quando sono arrivato, era già uscita.", english: "When I arrived, she had already left.", tags: ["general", "family"] },
  { target: "Avevo sperato di vederti.", english: "I had hoped to see you.", tags: ["general", "family"] },
  { target: "Non avevamo pensato a questo.", english: "We hadn't thought about this.", tags: ["general", "work"] },
  { target: "Aveva vissuto a Parigi per due anni.", english: "He had lived in Paris for two years.", tags: ["general", "travel"] },
  { target: "Eravamo partiti senza ombrello.", english: "We had left without an umbrella.", tags: ["general", "travel"] },
  { target: "Avevano chiuso il ristorante presto.", english: "They had closed the restaurant early.", tags: ["general", "travel"] },
  { target: "Non avevo mai mangiato il sushi.", english: "I had never eaten sushi.", tags: ["general", "travel"] },
  { target: "Aveva già deciso prima di parlare.", english: "He had already decided before speaking.", tags: ["general", "work"] },
  { target: "Avevamo preparato la valigia la sera prima.", english: "We had packed the suitcase the night before.", tags: ["general", "travel"] },
  { target: "Non avevi detto che venivi?", english: "Hadn't you said you were coming?", tags: ["general", "family"] },
  { target: "Erano già andati a letto.", english: "They had already gone to bed.", tags: ["general", "family"] },

  // ── Extra future time expressions ──
  { target: "Quest'estate andremo in Grecia.", english: "This summer we'll go to Greece.", tags: ["general", "travel"] },
  { target: "A Natale staremo con la famiglia.", english: "At Christmas we'll be with the family.", tags: ["general", "family"] },
  { target: "L'anno prossimo cambierò lavoro.", english: "Next year I'll change jobs.", tags: ["general", "work"] },
  { target: "Fra qualche anno andremo in pensione.", english: "In a few years we'll retire.", tags: ["general", "work"] },
  { target: "Presto tutto andrà meglio.", english: "Soon everything will get better.", tags: ["general", "family"] },
  { target: "Prima o poi capirà.", english: "Sooner or later he'll understand.", tags: ["general", "family"] },
  { target: "Quando crescerai, capirai.", english: "When you grow up, you'll understand.", tags: ["general", "family"] },
  { target: "Se piove, resteremo a casa.", english: "If it rains, we'll stay home.", tags: ["general", "family"] },
  { target: "Se studi, passerai l'esame.", english: "If you study, you'll pass the exam.", tags: ["general", "work"] },
  { target: "Se risparmiamo, viaggeremo di più.", english: "If we save, we'll travel more.", tags: ["general", "travel"] },

  // ── More futuro semplice ──
  { target: "Rideremo di questo un giorno.", english: "We'll laugh about this one day.", tags: ["general", "family"] },
  { target: "Deciderai cosa fare dopo l'università.", english: "You'll decide what to do after university.", tags: ["general", "work"] },
  { target: "Partiranno per le vacanze a luglio.", english: "They'll leave for vacation in July.", tags: ["general", "travel"] },
  { target: "Finalmente riposeremo.", english: "Finally we'll rest.", tags: ["general", "family"] },
  { target: "Costruiranno una casa nuova.", english: "They'll build a new house.", tags: ["general", "family"] },
  { target: "Ti chiamerò appena arrivo.", english: "I'll call you as soon as I arrive.", tags: ["general", "travel"] },
  { target: "Pianteremo dei fiori in giardino.", english: "We'll plant some flowers in the garden.", tags: ["general", "family"] },
  { target: "Scriverò un libro un giorno.", english: "I'll write a book one day.", tags: ["general", "work"] },
  { target: "Correrà la maratona il prossimo anno.", english: "He'll run the marathon next year.", tags: ["general", "family"] },
  { target: "Visiteremo i nonni questo weekend.", english: "We'll visit the grandparents this weekend.", tags: ["general", "family"] },
  { target: "Puliranno la casa domani.", english: "They'll clean the house tomorrow.", tags: ["general", "family"] },
  { target: "Risponderò a tutte le email.", english: "I'll reply to all the emails.", tags: ["general", "work"] },
  { target: "Festeggeremo il compleanno al mare.", english: "We'll celebrate the birthday at the beach.", tags: ["general", "family"] },
  { target: "Penserà a tutto lui.", english: "He'll take care of everything.", tags: ["general", "work"] },
  { target: "Insegnerà matematica il prossimo anno.", english: "He'll teach math next year.", tags: ["general", "work"] },

  // ── More futuro anteriore ──
  { target: "Quando avrò finito, ti chiamo.", english: "When I've finished, I'll call you.", tags: ["general", "work"] },
  { target: "Sarà partito senza dirci nulla.", english: "He must have left without telling us.", tags: ["general", "family"] },
  { target: "Entro sera avremo finito tutto.", english: "By evening we'll have finished everything.", tags: ["general", "work"] },
  { target: "Quando sarà guarita, tornerà al lavoro.", english: "When she's recovered, she'll return to work.", tags: ["general", "work"] },
  { target: "Avranno perso il treno.", english: "They must have missed the train.", tags: ["general", "travel"] },

  // ── More trapassato prossimo ──
  { target: "Avevo sempre sognato di visitare Roma.", english: "I had always dreamed of visiting Rome.", tags: ["general", "travel"] },
  { target: "Non avevamo mai visto tanta neve.", english: "We had never seen so much snow.", tags: ["general", "travel"] },
  { target: "Aveva già speso tutti i soldi.", english: "He had already spent all the money.", tags: ["general", "family"] },
  { target: "Eravamo tornati tardi dalla festa.", english: "We had returned late from the party.", tags: ["general", "family"] },
  { target: "Avevo preparato la cena per tutti.", english: "I had prepared dinner for everyone.", tags: ["general", "family"] },
  { target: "Non aveva mai guidato in autostrada.", english: "She had never driven on the highway.", tags: ["general", "travel"] },
  { target: "Avevamo dimenticato di chiudere la porta.", english: "We had forgotten to close the door.", tags: ["general", "family"] },
  { target: "Avevano già deciso il menù.", english: "They had already decided the menu.", tags: ["general", "travel"] },
  { target: "Ero andato a letto molto presto.", english: "I had gone to bed very early.", tags: ["general", "family"] },
  { target: "Aveva già finito quando sono arrivato.", english: "He had already finished when I arrived.", tags: ["general", "work"] },

  // ── More future + probability ──
  { target: "Quanto costerà questo ristorante?", english: "How much will this restaurant cost?", tags: ["general", "travel"] },
  { target: "Avrà dimenticato di nuovo.", english: "He probably forgot again.", tags: ["general", "family"] },
  { target: "Sarà ancora al lavoro.", english: "He's probably still at work.", tags: ["general", "work"] },
  { target: "Staranno cenando adesso.", english: "They're probably having dinner now.", tags: ["general", "family"] },
  { target: "Ci sarà un motivo.", english: "There must be a reason.", tags: ["general", "work"] },
  { target: "Avrà preso il treno sbagliato.", english: "He probably took the wrong train.", tags: ["general", "travel"] },

  // ── More conditional/plans ──
  { target: "Se tutto va bene, ci vedremo presto.", english: "If all goes well, we'll see each other soon.", tags: ["general", "family"] },
  { target: "Quando finirà la pioggia, usciremo.", english: "When the rain stops, we'll go out.", tags: ["general", "travel"] },
  { target: "Appena possibile, ti darò una risposta.", english: "As soon as possible, I'll give you an answer.", tags: ["general", "work"] },
  { target: "Se avrai tempo, vieni a trovarci.", english: "If you have time, come visit us.", tags: ["general", "family"] },
  { target: "Il prossimo anno tutto sarà diverso.", english: "Next year everything will be different.", tags: ["general", "work"] },
  { target: "Domani mattina faremo colazione insieme.", english: "Tomorrow morning we'll have breakfast together.", tags: ["general", "family"] },
];

// ── Main logic ──
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
console.log('Current deck size:', deck.length);

const existing = new Set(deck.map(c => c.target.toLowerCase().trim()));

function tagNode(cards, node) {
  return cards
    .filter(c => !existing.has(c.target.toLowerCase().trim()))
    .map(c => ({ ...c, grammarNode: node }));
}

const newCards = [
  ...tagNode(node01, 'node-01'),
  ...tagNode(node02, 'node-02'),
  ...tagNode(node03, 'node-03'),
  ...tagNode(node04, 'node-04'),
  ...tagNode(node05, 'node-05'),
  ...tagNode(node08, 'node-08'),
  ...tagNode(node09, 'node-09'),
  ...tagNode(node14, 'node-14'),
];

console.log('New cards to add:', newCards.length);
const all = [...deck, ...newCards];

// Sort by grammar node
function nodeOrder(n) {
  const m = n.match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 999;
}
all.sort((a, b) => nodeOrder(a.grammarNode) - nodeOrder(b.grammarNode));

// Re-assign IDs
const final = all.map((card, i) => ({
  id: i + 1,
  target: card.target,
  english: card.english,
  audio: `it-${i + 1}.mp3`,
  tags: card.tags,
  grammarNode: card.grammarNode,
}));

fs.writeFileSync(DECK_PATH, JSON.stringify(final, null, 2) + '\n');
console.log('Final deck size:', final.length);

// Print per-node stats
const counts = {};
final.forEach(c => { counts[c.grammarNode] = (counts[c.grammarNode] || 0) + 1; });
Object.keys(counts).sort((a, b) => nodeOrder(a) - nodeOrder(b)).forEach(k => {
  console.log(`  ${k}: ${counts[k]}`);
});
console.log('Done!');
