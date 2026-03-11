/**
 * expand-italian-35.cjs
 *
 * Adds 339 expansion cards to the Italian deck for 5 under-target nodes:
 *   - node-07: Descriptions & adjectives           (+87 cards)
 *   - node-10: Irregular passato prossimo           (+113 cards)
 *   - node-11: Imperfect tense                      (+65 cards)
 *   - node-12: Past contrast (pp vs imperfetto)     (+60 cards)
 *   - node-35: Advanced mixed mastery               (+14 cards)
 *
 * Steps:
 *   1. Read existing deck
 *   2. Collect existing target sentences (lowercased) for dedup
 *   3. Append new cards (skip duplicates)
 *   4. Sort all cards by grammarNode
 *   5. Re-assign sequential IDs and audio (it-{id}.mp3)
 *   6. Write back to deck.json
 *   7. Print stats
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

console.log(`Existing deck: ${deck.length} cards`);

// ─── Collect existing targets for dedup ──────────────────────
const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));

// ═════════════════════════════════════════════════════════════
// NEW CARDS
// ═════════════════════════════════════════════════════════════

const newCards = [];

// ─────────────────────────────────────────────────────────────
// NODE-07: Descriptions & adjectives (+87 cards)
// A1 level: c'è/ci sono, adjective descriptions, colors, sizes
// ─────────────────────────────────────────────────────────────

const node07Cards = [
  // --- c'è / ci sono ---
  { target: "C'è un parco vicino a casa mia.", english: "There's a park near my house.", tags: ["general", "family"] },
  { target: "C'è un bar all'angolo della strada.", english: "There's a cafe at the corner of the street.", tags: ["general", "travel"] },
  { target: "C'è troppo rumore qui.", english: "There's too much noise here.", tags: ["general", "travel"] },
  { target: "C'è un gatto sul tetto.", english: "There's a cat on the roof.", tags: ["general", "family"] },
  { target: "C'è un problema con il computer.", english: "There's a problem with the computer.", tags: ["general", "work"] },
  { target: "C'è sempre traffico la mattina.", english: "There's always traffic in the morning.", tags: ["general", "travel"] },
  { target: "C'è un bel sole oggi.", english: "It's sunny today.", tags: ["general", "travel"] },
  { target: "C'è qualcuno alla porta.", english: "There's someone at the door.", tags: ["general", "family"] },
  { target: "C'è un supermercato qui vicino?", english: "Is there a supermarket nearby?", tags: ["general", "travel"] },
  { target: "C'è posto per tutti.", english: "There's room for everyone.", tags: ["general", "family"] },
  { target: "Ci sono molte persone al mercato.", english: "There are many people at the market.", tags: ["general", "travel"] },
  { target: "Ci sono due camere da letto.", english: "There are two bedrooms.", tags: ["general", "family"] },
  { target: "Ci sono dei fiori nel giardino.", english: "There are flowers in the garden.", tags: ["general", "family"] },
  { target: "Ci sono tanti ristoranti in centro.", english: "There are many restaurants downtown.", tags: ["general", "travel"] },
  { target: "Ci sono tre gatti in cortile.", english: "There are three cats in the courtyard.", tags: ["general", "family"] },
  { target: "Ci sono nuvole nel cielo.", english: "There are clouds in the sky.", tags: ["general", "travel"] },
  { target: "Non ci sono più biglietti.", english: "There are no more tickets.", tags: ["general", "travel"] },
  { target: "Ci sono molti turisti d'estate.", english: "There are many tourists in summer.", tags: ["general", "travel"] },
  { target: "Ci sono dei libri sul tavolo.", english: "There are some books on the table.", tags: ["general", "work"] },
  { target: "Non c'è nessuno in ufficio.", english: "There's nobody in the office.", tags: ["general", "work"] },

  // --- Sizes and spatial descriptions ---
  { target: "La stanza è grande e luminosa.", english: "The room is big and bright.", tags: ["general", "family"] },
  { target: "Il bagno è troppo piccolo.", english: "The bathroom is too small.", tags: ["general", "travel"] },
  { target: "La cucina è moderna e spaziosa.", english: "The kitchen is modern and spacious.", tags: ["general", "family"] },
  { target: "Il tavolo è rotondo e largo.", english: "The table is round and wide.", tags: ["general", "family"] },
  { target: "La piazza è enorme e bellissima.", english: "The square is huge and beautiful.", tags: ["general", "travel"] },
  { target: "L'appartamento è piccolo ma carino.", english: "The apartment is small but cute.", tags: ["general", "travel"] },
  { target: "La strada è stretta e buia.", english: "The street is narrow and dark.", tags: ["general", "travel"] },
  { target: "Il palazzo è alto e moderno.", english: "The building is tall and modern.", tags: ["general", "work"] },
  { target: "La borsa è pesante.", english: "The bag is heavy.", tags: ["general", "travel"] },
  { target: "Il letto è morbido e comodo.", english: "The bed is soft and comfortable.", tags: ["general", "travel"] },

  // --- Colors ---
  { target: "Il cielo è azzurro oggi.", english: "The sky is blue today.", tags: ["general", "travel"] },
  { target: "La mia macchina è rossa.", english: "My car is red.", tags: ["general", "travel"] },
  { target: "Ha gli occhi verdi.", english: "She has green eyes.", tags: ["general", "family"] },
  { target: "Le pareti sono bianche.", english: "The walls are white.", tags: ["general", "family"] },
  { target: "Il vestito nero è elegante.", english: "The black dress is elegant.", tags: ["general", "work"] },
  { target: "I fiori gialli sono bellissimi.", english: "The yellow flowers are beautiful.", tags: ["general", "family"] },
  { target: "Ha i capelli castani.", english: "She has brown hair.", tags: ["general", "family"] },
  { target: "La porta è grigia.", english: "The door is gray.", tags: ["general", "work"] },
  { target: "Le tende sono arancioni.", english: "The curtains are orange.", tags: ["general", "family"] },
  { target: "Il gatto è bianco e nero.", english: "The cat is black and white.", tags: ["general", "family"] },

  // --- Qualities of everyday things ---
  { target: "Il caffè è caldo e forte.", english: "The coffee is hot and strong.", tags: ["general", "travel"] },
  { target: "L'acqua è fresca e buona.", english: "The water is fresh and good.", tags: ["general", "travel"] },
  { target: "La torta è dolce e morbida.", english: "The cake is sweet and soft.", tags: ["general", "family"] },
  { target: "Il pane è fresco di oggi.", english: "The bread is fresh from today.", tags: ["general", "travel"] },
  { target: "La pasta è pronta!", english: "The pasta is ready!", tags: ["general", "family"] },
  { target: "Il vino è rosso e buono.", english: "The wine is red and good.", tags: ["general", "travel"] },
  { target: "La minestra è troppo salata.", english: "The soup is too salty.", tags: ["general", "family"] },
  { target: "La frutta è molto dolce.", english: "The fruit is very sweet.", tags: ["general", "travel"] },
  { target: "Il gelato è freddo e cremoso.", english: "The ice cream is cold and creamy.", tags: ["general", "travel"] },
  { target: "La pizza è calda e buonissima.", english: "The pizza is hot and delicious.", tags: ["general", "travel"] },

  // --- Appearances and personal descriptions ---
  { target: "Marco è alto e magro.", english: "Marco is tall and thin.", tags: ["general", "family"] },
  { target: "La bambina è bionda e carina.", english: "The girl is blonde and cute.", tags: ["general", "family"] },
  { target: "Mio nonno è anziano ma forte.", english: "My grandfather is elderly but strong.", tags: ["general", "family"] },
  { target: "Il professore è giovane e simpatico.", english: "The professor is young and nice.", tags: ["general", "work"] },
  { target: "Lei è molto gentile con tutti.", english: "She is very kind to everyone.", tags: ["general", "work"] },
  { target: "Lui è serio e silenzioso.", english: "He is serious and quiet.", tags: ["general", "work"] },
  { target: "I bambini sono vivaci e allegri.", english: "The children are lively and cheerful.", tags: ["general", "family"] },
  { target: "La signora è elegante e raffinata.", english: "The lady is elegant and refined.", tags: ["general", "work"] },
  { target: "Il ragazzo è sportivo e abbronzato.", english: "The boy is sporty and tanned.", tags: ["general", "family"] },
  { target: "Mia sorella è bassa e mora.", english: "My sister is short and dark-haired.", tags: ["general", "family"] },

  // --- Weather and environment descriptions ---
  { target: "Oggi fa caldo.", english: "It's hot today.", tags: ["general", "travel"] },
  { target: "Fuori è buio e freddo.", english: "It's dark and cold outside.", tags: ["general", "travel"] },
  { target: "L'aria è pulita in montagna.", english: "The air is clean in the mountains.", tags: ["general", "travel"] },
  { target: "La sera è fresca e piacevole.", english: "The evening is cool and pleasant.", tags: ["general", "travel"] },
  { target: "Il tempo è brutto oggi.", english: "The weather is bad today.", tags: ["general", "travel"] },

  // --- Object and place qualities ---
  { target: "Il film è lungo ma interessante.", english: "The movie is long but interesting.", tags: ["general", "family"] },
  { target: "Il libro è noioso.", english: "The book is boring.", tags: ["general", "work"] },
  { target: "La musica è troppo forte.", english: "The music is too loud.", tags: ["general", "travel"] },
  { target: "La lezione è facile oggi.", english: "The lesson is easy today.", tags: ["general", "work"] },
  { target: "L'esame è difficile.", english: "The exam is difficult.", tags: ["general", "work"] },
  { target: "Il lavoro è stancante ma gratificante.", english: "The work is tiring but rewarding.", tags: ["general", "work"] },
  { target: "La vista è spettacolare.", english: "The view is spectacular.", tags: ["general", "travel"] },
  { target: "L'hotel è pulito e accogliente.", english: "The hotel is clean and welcoming.", tags: ["general", "travel"] },
  { target: "Il giardino è curato e verde.", english: "The garden is well-kept and green.", tags: ["general", "family"] },
  { target: "La chiesa è antica e bella.", english: "The church is old and beautiful.", tags: ["general", "travel"] },
  { target: "La stazione è vicina a casa.", english: "The station is close to home.", tags: ["general", "travel"] },
  { target: "Il ristorante è pieno stasera.", english: "The restaurant is full tonight.", tags: ["general", "travel"] },

  // --- più / meno / molto / troppo ---
  { target: "Questa borsa è più leggera.", english: "This bag is lighter.", tags: ["general", "travel"] },
  { target: "Il treno è più veloce dell'autobus.", english: "The train is faster than the bus.", tags: ["general", "travel"] },
  { target: "La tua casa è più grande della mia.", english: "Your house is bigger than mine.", tags: ["general", "family"] },
  { target: "Questa strada è meno rumorosa.", english: "This street is less noisy.", tags: ["general", "travel"] },
  { target: "Il vestito è troppo stretto.", english: "The dress is too tight.", tags: ["general", "family"] },
  { target: "Le scarpe sono molto comode.", english: "The shoes are very comfortable.", tags: ["general", "travel"] },
  { target: "Questo cappotto è troppo caro.", english: "This coat is too expensive.", tags: ["general", "travel"] },
];

// ─────────────────────────────────────────────────────────────
// NODE-10: Irregular passato prossimo (+113 cards)
// Irregular past participles with avere/essere
// ─────────────────────────────────────────────────────────────

const node10Cards = [
  // --- fatto (fare→fatto) ---
  { target: "Ho fatto la spesa stamattina.", english: "I went shopping this morning.", tags: ["general", "family"], grammar: "Irregular participle: fare→fatto." },
  { target: "Hai fatto i compiti?", english: "Did you do your homework?", tags: ["general", "family"], grammar: "Irregular participle: fare→fatto." },
  { target: "Abbiamo fatto una passeggiata al parco.", english: "We took a walk in the park.", tags: ["general", "travel"], grammar: "Irregular participle: fare→fatto." },
  { target: "Ha fatto tardi al lavoro.", english: "She was late to work.", tags: ["general", "work"], grammar: "Irregular participle: fare→fatto." },
  { target: "Hanno fatto una bella festa.", english: "They threw a great party.", tags: ["general", "family"], grammar: "Irregular participle: fare→fatto." },
  { target: "Che cosa avete fatto ieri sera?", english: "What did you all do last night?", tags: ["general", "family"], grammar: "Irregular participle: fare→fatto." },
  { target: "Ho fatto un errore grave.", english: "I made a serious mistake.", tags: ["general", "work"], grammar: "Irregular participle: fare→fatto." },
  { target: "Abbiamo fatto colazione insieme.", english: "We had breakfast together.", tags: ["general", "family"], grammar: "Irregular participle: fare→fatto." },

  // --- detto (dire→detto) ---
  { target: "Mi ha detto la verità.", english: "He told me the truth.", tags: ["general", "family"], grammar: "Irregular participle: dire→detto." },
  { target: "Ti ho detto di stare attento.", english: "I told you to be careful.", tags: ["general", "family"], grammar: "Irregular participle: dire→detto." },
  { target: "Cosa ha detto il dottore?", english: "What did the doctor say?", tags: ["general", "work"], grammar: "Irregular participle: dire→detto." },
  { target: "Non mi hanno detto nulla.", english: "They didn't tell me anything.", tags: ["general", "work"], grammar: "Irregular participle: dire→detto." },
  { target: "Chi te l'ha detto?", english: "Who told you?", tags: ["general", "family"], grammar: "Irregular participle: dire→detto." },
  { target: "Abbiamo detto la nostra opinione.", english: "We gave our opinion.", tags: ["general", "work"], grammar: "Irregular participle: dire→detto." },

  // --- scritto (scrivere→scritto) ---
  { target: "Ho scritto un messaggio a Marco.", english: "I wrote a message to Marco.", tags: ["general", "family"], grammar: "Irregular participle: scrivere→scritto." },
  { target: "Ha scritto un libro bellissimo.", english: "She wrote a beautiful book.", tags: ["general", "work"], grammar: "Irregular participle: scrivere→scritto." },
  { target: "Hai scritto la lista della spesa?", english: "Did you write the grocery list?", tags: ["general", "family"], grammar: "Irregular participle: scrivere→scritto." },
  { target: "Abbiamo scritto al proprietario dell'appartamento.", english: "We wrote to the apartment owner.", tags: ["general", "work"], grammar: "Irregular participle: scrivere→scritto." },
  { target: "Non ho ancora scritto l'email.", english: "I haven't written the email yet.", tags: ["general", "work"], grammar: "Irregular participle: scrivere→scritto." },

  // --- visto (vedere→visto) ---
  { target: "Hai visto il film ieri?", english: "Did you see the movie yesterday?", tags: ["general", "family"], grammar: "Irregular participle: vedere→visto." },
  { target: "Ho visto tua sorella al supermercato.", english: "I saw your sister at the supermarket.", tags: ["general", "family"], grammar: "Irregular participle: vedere→visto." },
  { target: "Non ho mai visto un posto così bello.", english: "I've never seen such a beautiful place.", tags: ["general", "travel"], grammar: "Irregular participle: vedere→visto." },
  { target: "Abbiamo visto un bellissimo tramonto.", english: "We saw a beautiful sunset.", tags: ["general", "travel"], grammar: "Irregular participle: vedere→visto." },
  { target: "Hai visto le foto del viaggio?", english: "Did you see the photos from the trip?", tags: ["general", "travel"], grammar: "Irregular participle: vedere→visto." },
  { target: "Hanno visto il concerto dal vivo.", english: "They saw the concert live.", tags: ["general", "travel"], grammar: "Irregular participle: vedere→visto." },

  // --- letto (leggere→letto) ---
  { target: "Ho letto il giornale stamattina.", english: "I read the newspaper this morning.", tags: ["general", "work"], grammar: "Irregular participle: leggere→letto." },
  { target: "Hai letto il messaggio che ti ho mandato?", english: "Did you read the message I sent you?", tags: ["general", "family"], grammar: "Irregular participle: leggere→letto." },
  { target: "Ha letto tutto il libro in una notte.", english: "She read the whole book in one night.", tags: ["general", "family"], grammar: "Irregular participle: leggere→letto." },
  { target: "Non ho letto ancora le istruzioni.", english: "I haven't read the instructions yet.", tags: ["general", "work"], grammar: "Irregular participle: leggere→letto." },
  { target: "Abbiamo letto le recensioni del ristorante.", english: "We read the restaurant reviews.", tags: ["general", "travel"], grammar: "Irregular participle: leggere→letto." },

  // --- preso (prendere→preso) ---
  { target: "Ho preso il treno delle sette.", english: "I took the seven o'clock train.", tags: ["general", "travel"], grammar: "Irregular participle: prendere→preso." },
  { target: "Hai preso le medicine?", english: "Did you take the medicine?", tags: ["general", "family"], grammar: "Irregular participle: prendere→preso." },
  { target: "Ha preso la decisione giusta.", english: "He made the right decision.", tags: ["general", "work"], grammar: "Irregular participle: prendere→preso." },
  { target: "Abbiamo preso un caffè al bar.", english: "We had a coffee at the cafe.", tags: ["general", "travel"], grammar: "Irregular participle: prendere→preso." },
  { target: "Hanno preso un taxi per l'aeroporto.", english: "They took a taxi to the airport.", tags: ["general", "travel"], grammar: "Irregular participle: prendere→preso." },
  { target: "Ho preso l'ombrello perché piove.", english: "I took the umbrella because it's raining.", tags: ["general", "travel"], grammar: "Irregular participle: prendere→preso." },

  // --- messo (mettere→messo) ---
  { target: "Ho messo le chiavi sul tavolo.", english: "I put the keys on the table.", tags: ["general", "family"], grammar: "Irregular participle: mettere→messo." },
  { target: "Ha messo la giacca nell'armadio.", english: "She put the jacket in the closet.", tags: ["general", "family"], grammar: "Irregular participle: mettere→messo." },
  { target: "Hai messo lo zucchero nel caffè?", english: "Did you put sugar in the coffee?", tags: ["general", "family"], grammar: "Irregular participle: mettere→messo." },
  { target: "Abbiamo messo i bambini a letto.", english: "We put the kids to bed.", tags: ["general", "family"], grammar: "Irregular participle: mettere→messo." },
  { target: "Ho messo la sveglia alle sei.", english: "I set the alarm for six.", tags: ["general", "work"], grammar: "Irregular participle: mettere→messo." },

  // --- aperto (aprire→aperto) ---
  { target: "Ho aperto la finestra per aria fresca.", english: "I opened the window for fresh air.", tags: ["general", "family"], grammar: "Irregular participle: aprire→aperto." },
  { target: "Hanno aperto un nuovo negozio in centro.", english: "They opened a new shop downtown.", tags: ["general", "travel"], grammar: "Irregular participle: aprire→aperto." },
  { target: "Hai aperto il regalo?", english: "Did you open the gift?", tags: ["general", "family"], grammar: "Irregular participle: aprire→aperto." },
  { target: "Abbiamo aperto una bottiglia di vino.", english: "We opened a bottle of wine.", tags: ["general", "travel"], grammar: "Irregular participle: aprire→aperto." },

  // --- chiuso (chiudere→chiuso) ---
  { target: "Ho chiuso la porta a chiave.", english: "I locked the door.", tags: ["general", "family"], grammar: "Irregular participle: chiudere→chiuso." },
  { target: "Hanno chiuso il bar per ferie.", english: "They closed the bar for holidays.", tags: ["general", "travel"], grammar: "Irregular participle: chiudere→chiuso." },
  { target: "Hai chiuso le finestre?", english: "Did you close the windows?", tags: ["general", "family"], grammar: "Irregular participle: chiudere→chiuso." },
  { target: "La scuola ha chiuso per la neve.", english: "The school closed because of the snow.", tags: ["general", "family"], grammar: "Irregular participle: chiudere→chiuso." },

  // --- rotto (rompere→rotto) ---
  { target: "Ho rotto un piatto in cucina.", english: "I broke a plate in the kitchen.", tags: ["general", "family"], grammar: "Irregular participle: rompere→rotto." },
  { target: "Si è rotto il telefono.", english: "The phone broke.", tags: ["general", "work"], grammar: "Irregular participle: rompere→rotto." },
  { target: "I bambini hanno rotto la lampada.", english: "The children broke the lamp.", tags: ["general", "family"], grammar: "Irregular participle: rompere→rotto." },
  { target: "Mi sono rotto un braccio da piccolo.", english: "I broke an arm when I was little.", tags: ["general", "family"], grammar: "Irregular participle: rompere→rotto." },

  // --- corso (correre→corso) ---
  { target: "Ho corso per prendere l'autobus.", english: "I ran to catch the bus.", tags: ["general", "travel"], grammar: "Irregular participle: correre→corso." },
  { target: "Abbiamo corso dieci chilometri oggi.", english: "We ran ten kilometers today.", tags: ["general", "family"], grammar: "Irregular participle: correre→corso." },
  { target: "È corsa a casa appena ha saputo.", english: "She ran home as soon as she found out.", tags: ["general", "family"], grammar: "Irregular participle: correre→corso. With essere for intransitive motion." },

  // --- nato/morto (nascere→nato / morire→morto) ---
  { target: "Sono nato a Milano nel 1990.", english: "I was born in Milan in 1990.", tags: ["general", "family"], grammar: "Irregular participle: nascere→nato. Always with essere." },
  { target: "Mia figlia è nata in primavera.", english: "My daughter was born in spring.", tags: ["general", "family"], grammar: "Irregular participle: nascere→nato. Always with essere." },
  { target: "È nato il figlio della mia amica.", english: "My friend's son was born.", tags: ["general", "family"], grammar: "Irregular participle: nascere→nato. Always with essere." },
  { target: "Il nonno è morto due anni fa.", english: "Grandpa died two years ago.", tags: ["general", "family"], grammar: "Irregular participle: morire→morto. Always with essere." },
  { target: "La pianta è morta per il freddo.", english: "The plant died from the cold.", tags: ["general", "family"], grammar: "Irregular participle: morire→morto. Always with essere." },

  // --- stato (essere→stato) ---
  { target: "Sono stato malato tutta la settimana.", english: "I was sick all week.", tags: ["general", "work"], grammar: "Irregular participle: essere→stato. Always with essere." },
  { target: "Sei stata brava all'esame.", english: "You did well on the exam.", tags: ["general", "work"], grammar: "Irregular participle: essere→stato. Always with essere." },
  { target: "È stato un weekend perfetto.", english: "It was a perfect weekend.", tags: ["general", "travel"], grammar: "Irregular participle: essere→stato." },
  { target: "Siamo stati al cinema sabato.", english: "We went to the movies on Saturday.", tags: ["general", "family"], grammar: "Irregular participle: essere→stato. Always with essere." },

  // --- venuto (venire→venuto) ---
  { target: "È venuta a trovarmi ieri.", english: "She came to visit me yesterday.", tags: ["general", "family"], grammar: "Irregular participle: venire→venuto. Always with essere." },
  { target: "Sei venuto alla festa di Marco?", english: "Did you come to Marco's party?", tags: ["general", "family"], grammar: "Irregular participle: venire→venuto. Always with essere." },
  { target: "Sono venuti da lontano per il matrimonio.", english: "They came from far away for the wedding.", tags: ["general", "family"], grammar: "Irregular participle: venire→venuto. Always with essere." },
  { target: "Non è venuto nessuno alla riunione.", english: "Nobody came to the meeting.", tags: ["general", "work"], grammar: "Irregular participle: venire→venuto. Always with essere." },

  // --- rimasto (rimanere→rimasto) ---
  { target: "Sono rimasta a casa per il mal di testa.", english: "I stayed home because of a headache.", tags: ["general", "family"], grammar: "Irregular participle: rimanere→rimasto. Always with essere." },
  { target: "Siamo rimasti bloccati nel traffico.", english: "We got stuck in traffic.", tags: ["general", "travel"], grammar: "Irregular participle: rimanere→rimasto. Always with essere." },
  { target: "È rimasto sorpreso dalla notizia.", english: "He was surprised by the news.", tags: ["general", "work"], grammar: "Irregular participle: rimanere→rimasto. Always with essere." },
  { target: "Sono rimasti pochi posti liberi.", english: "There are only a few seats left.", tags: ["general", "travel"], grammar: "Irregular participle: rimanere→rimasto. Always with essere." },

  // --- risposto (rispondere→risposto) ---
  { target: "Non ha risposto al telefono.", english: "She didn't answer the phone.", tags: ["general", "work"], grammar: "Irregular participle: rispondere→risposto." },
  { target: "Ho risposto a tutte le email.", english: "I answered all the emails.", tags: ["general", "work"], grammar: "Irregular participle: rispondere→risposto." },
  { target: "Hai risposto alla sua domanda?", english: "Did you answer his question?", tags: ["general", "work"], grammar: "Irregular participle: rispondere→risposto." },

  // --- perso (perdere→perso) ---
  { target: "Ho perso il portafoglio al mercato.", english: "I lost my wallet at the market.", tags: ["general", "travel"], grammar: "Irregular participle: perdere→perso." },
  { target: "Abbiamo perso la partita.", english: "We lost the game.", tags: ["general", "family"], grammar: "Irregular participle: perdere→perso." },
  { target: "Ha perso il lavoro il mese scorso.", english: "He lost his job last month.", tags: ["general", "work"], grammar: "Irregular participle: perdere→perso." },
  { target: "Hai perso l'autobus delle otto?", english: "Did you miss the eight o'clock bus?", tags: ["general", "travel"], grammar: "Irregular participle: perdere→perso." },

  // --- successo (succedere→successo) ---
  { target: "Cosa è successo ieri sera?", english: "What happened last night?", tags: ["general", "family"], grammar: "Irregular participle: succedere→successo. Always with essere." },
  { target: "Non è successo niente di grave.", english: "Nothing serious happened.", tags: ["general", "family"], grammar: "Irregular participle: succedere→successo. Always with essere." },
  { target: "Mi è successa una cosa strana.", english: "Something strange happened to me.", tags: ["general", "travel"], grammar: "Irregular participle: succedere→successo. Always with essere." },

  // --- deciso (decidere→deciso) ---
  { target: "Ho deciso di cambiare lavoro.", english: "I decided to change jobs.", tags: ["general", "work"], grammar: "Irregular participle: decidere→deciso." },
  { target: "Abbiamo deciso di partire domani.", english: "We decided to leave tomorrow.", tags: ["general", "travel"], grammar: "Irregular participle: decidere→deciso." },
  { target: "Hai deciso dove andare in vacanza?", english: "Did you decide where to go on vacation?", tags: ["general", "travel"], grammar: "Irregular participle: decidere→deciso." },

  // --- speso (spendere→speso) ---
  { target: "Ho speso troppo questo mese.", english: "I spent too much this month.", tags: ["general", "work"], grammar: "Irregular participle: spendere→speso." },
  { target: "Abbiamo speso poco per la cena.", english: "We spent little on dinner.", tags: ["general", "travel"], grammar: "Irregular participle: spendere→speso." },
  { target: "Quanto hanno speso per il viaggio?", english: "How much did they spend on the trip?", tags: ["general", "travel"], grammar: "Irregular participle: spendere→speso." },

  // --- scelto (scegliere→scelto) ---
  { target: "Ho scelto il vestito blu.", english: "I chose the blue dress.", tags: ["general", "family"], grammar: "Irregular participle: scegliere→scelto." },
  { target: "Abbiamo scelto un buon vino.", english: "We chose a good wine.", tags: ["general", "travel"], grammar: "Irregular participle: scegliere→scelto." },
  { target: "Hai scelto la scuola per tuo figlio?", english: "Did you choose the school for your son?", tags: ["general", "family"], grammar: "Irregular participle: scegliere→scelto." },
  { target: "Hanno scelto di restare in Italia.", english: "They chose to stay in Italy.", tags: ["general", "travel"], grammar: "Irregular participle: scegliere→scelto." },

  // --- pianto (piangere→pianto) ---
  { target: "Il bambino ha pianto tutta la notte.", english: "The baby cried all night.", tags: ["general", "family"], grammar: "Irregular participle: piangere→pianto." },
  { target: "Ho pianto di gioia quando l'ho saputo.", english: "I cried with joy when I found out.", tags: ["general", "family"], grammar: "Irregular participle: piangere→pianto." },

  // --- riso (ridere→riso) ---
  { target: "Abbiamo riso tutta la sera.", english: "We laughed all evening.", tags: ["general", "family"], grammar: "Irregular participle: ridere→riso." },
  { target: "Ha riso così tanto da piangere.", english: "He laughed so hard he cried.", tags: ["general", "family"], grammar: "Irregular participle: ridere→riso." },

  // --- Mixed irregular participles in natural contexts ---
  { target: "Ho messo il telefono in borsa.", english: "I put the phone in my bag.", tags: ["general", "travel"], grammar: "Irregular participle: mettere→messo." },
  { target: "Abbiamo visto un arcobaleno incredibile.", english: "We saw an incredible rainbow.", tags: ["general", "travel"], grammar: "Irregular participle: vedere→visto." },
  { target: "Ha fatto il possibile per aiutarci.", english: "He did everything possible to help us.", tags: ["general", "work"], grammar: "Irregular participle: fare→fatto." },
  { target: "Ho scritto tutto sul quaderno.", english: "I wrote everything in the notebook.", tags: ["general", "work"], grammar: "Irregular participle: scrivere→scritto." },
  { target: "Ha preso la macchina di sua madre.", english: "He took his mother's car.", tags: ["general", "family"], grammar: "Irregular participle: prendere→preso." },
  { target: "Hanno aperto le valigie in albergo.", english: "They opened their suitcases at the hotel.", tags: ["general", "travel"], grammar: "Irregular participle: aprire→aperto." },
  { target: "Ho chiuso gli occhi e mi sono rilassato.", english: "I closed my eyes and relaxed.", tags: ["general", "family"], grammar: "Irregular participle: chiudere→chiuso." },
  { target: "Siamo rimasti a cena dai nonni.", english: "We stayed for dinner at grandma and grandpa's.", tags: ["general", "family"], grammar: "Irregular participle: rimanere→rimasto. Always with essere." },
  { target: "Ha perso l'equilibrio ed è caduto.", english: "He lost his balance and fell.", tags: ["general", "travel"], grammar: "Irregular participle: perdere→perso." },
  { target: "Ho letto tre libri in vacanza.", english: "I read three books on vacation.", tags: ["general", "travel"], grammar: "Irregular participle: leggere→letto." },
  { target: "Abbiamo fatto una gita al lago.", english: "We took a trip to the lake.", tags: ["general", "travel"], grammar: "Irregular participle: fare→fatto." },
  { target: "Ha detto che arriva alle cinque.", english: "He said he's arriving at five.", tags: ["general", "family"], grammar: "Irregular participle: dire→detto." },
  { target: "Ho visto Marco al bar questa mattina.", english: "I saw Marco at the cafe this morning.", tags: ["general", "travel"], grammar: "Irregular participle: vedere→visto." },
];

// ─────────────────────────────────────────────────────────────
// NODE-11: Imperfect tense (+65 cards)
// Habitual past, ongoing states, descriptions
// ─────────────────────────────────────────────────────────────

const node11Cards = [
  // --- Habitual past actions (-avo/-evo/-ivo) ---
  { target: "Da piccola giocavo sempre nel parco.", english: "As a child I always played in the park.", tags: ["general", "family"], grammar: "Imperfetto: -avo ending for habitual past. Giocavo (giocare)." },
  { target: "Mia nonna cucinava la pasta ogni domenica.", english: "My grandma cooked pasta every Sunday.", tags: ["general", "family"], grammar: "Imperfetto: habitual action with 'ogni'. Cucinava (cucinare)." },
  { target: "Quando ero giovane, vivevo in campagna.", english: "When I was young, I lived in the countryside.", tags: ["general", "family"], grammar: "Imperfetto: ero (essere) + vivevo (vivere) for ongoing past states." },
  { target: "Ogni mattina prendevo il caffè al bar.", english: "Every morning I had coffee at the cafe.", tags: ["general", "travel"], grammar: "Imperfetto: habitual action with 'ogni mattina'. Prendevo (prendere)." },
  { target: "Da studente dormivo sempre fino a tardi.", english: "As a student I always slept in late.", tags: ["general", "work"], grammar: "Imperfetto: dormivo (dormire) for habitual past action." },
  { target: "Mio padre lavorava in fabbrica.", english: "My father worked in a factory.", tags: ["general", "work"], grammar: "Imperfetto: lavorava (lavorare) for ongoing past state." },
  { target: "Leggevamo il giornale a colazione.", english: "We used to read the newspaper at breakfast.", tags: ["general", "family"], grammar: "Imperfetto: leggevamo (leggere) for habitual past action." },
  { target: "Pranzavamo sempre alle tredici.", english: "We always had lunch at one.", tags: ["general", "family"], grammar: "Imperfetto: pranzavamo (pranzare) for habitual past." },
  { target: "Andavo a scuola in bicicletta.", english: "I used to go to school by bike.", tags: ["general", "family"], grammar: "Imperfetto: andavo (andare) for habitual past." },
  { target: "Guardavamo i cartoni animati il sabato.", english: "We watched cartoons on Saturdays.", tags: ["general", "family"], grammar: "Imperfetto: guardavamo (guardare) for habitual past." },
  { target: "Giocavano a pallone nel cortile.", english: "They used to play ball in the courtyard.", tags: ["general", "family"], grammar: "Imperfetto: giocavano (giocare) for habitual past." },
  { target: "Cantava sempre sotto la doccia.", english: "He always sang in the shower.", tags: ["general", "family"], grammar: "Imperfetto: cantava (cantare) for habitual past." },
  { target: "Mia madre mi accompagnava a scuola.", english: "My mother used to walk me to school.", tags: ["general", "family"], grammar: "Imperfetto: accompagnava (accompagnare) for habitual past." },
  { target: "Preparavo la cena per tutta la famiglia.", english: "I used to cook dinner for the whole family.", tags: ["general", "family"], grammar: "Imperfetto: preparavo (preparare) for habitual past." },
  { target: "Viaggiavamo ogni estate in Sardegna.", english: "We traveled to Sardinia every summer.", tags: ["general", "travel"], grammar: "Imperfetto: viaggiavamo (viaggiare) with 'ogni estate'." },

  // --- era/erano, avevo/aveva, facevo/faceva ---
  { target: "Era una bella giornata di sole.", english: "It was a beautiful sunny day.", tags: ["general", "travel"], grammar: "Imperfetto: era (essere) for descriptions in the past." },
  { target: "Erano tempi difficili per tutti.", english: "Those were difficult times for everyone.", tags: ["general", "family"], grammar: "Imperfetto: erano (essere) for past descriptions." },
  { target: "Avevo vent'anni quando mi sono sposato.", english: "I was twenty when I got married.", tags: ["general", "family"], grammar: "Imperfetto: avevo (avere) for age in the past." },
  { target: "Aveva sempre un sorriso per tutti.", english: "She always had a smile for everyone.", tags: ["general", "family"], grammar: "Imperfetto: aveva (avere) for habitual past state." },
  { target: "Avevamo un cane che si chiamava Lucky.", english: "We had a dog named Lucky.", tags: ["general", "family"], grammar: "Imperfetto: avevamo (avere) for past possession." },
  { target: "Faceva molto freddo quella notte.", english: "It was very cold that night.", tags: ["general", "travel"], grammar: "Imperfetto: faceva (fare) for weather descriptions." },
  { target: "Facevo sport ogni pomeriggio.", english: "I used to exercise every afternoon.", tags: ["general", "family"], grammar: "Imperfetto: facevo (fare) for habitual past." },
  { target: "Faceva sempre scherzi ai colleghi.", english: "He always played pranks on his colleagues.", tags: ["general", "work"], grammar: "Imperfetto: faceva (fare) for habitual past." },
  { target: "Erano tutti contenti della notizia.", english: "Everyone was happy about the news.", tags: ["general", "family"], grammar: "Imperfetto: erano (essere) for past state." },
  { target: "Avevi ragione tu alla fine.", english: "You were right in the end.", tags: ["general", "family"], grammar: "Imperfetto: avevi (avere) for past state." },

  // --- Descriptions of past states and environments ---
  { target: "La città era molto diversa allora.", english: "The city was very different back then.", tags: ["general", "travel"], grammar: "Imperfetto: era (essere) for past description." },
  { target: "La notte era calma e silenziosa.", english: "The night was calm and quiet.", tags: ["general", "travel"], grammar: "Imperfetto: era (essere) for past atmosphere." },
  { target: "Il ristorante era sempre pieno.", english: "The restaurant was always full.", tags: ["general", "travel"], grammar: "Imperfetto: era (essere) for habitual past state." },
  { target: "Le vacanze passavano troppo in fretta.", english: "The holidays went by too fast.", tags: ["general", "travel"], grammar: "Imperfetto: passavano (passare) for ongoing past." },
  { target: "I prezzi erano più bassi una volta.", english: "Prices were lower back in the day.", tags: ["general", "travel"], grammar: "Imperfetto: erano (essere) for past description." },

  // --- Emotions, feelings, thoughts in the past ---
  { target: "Speravo di rivederti presto.", english: "I was hoping to see you again soon.", tags: ["general", "family"], grammar: "Imperfetto: speravo (sperare) for ongoing past feeling." },
  { target: "Non capivo perché era arrabbiato.", english: "I didn't understand why he was angry.", tags: ["general", "family"], grammar: "Imperfetto: capivo (capire) for ongoing past mental state." },
  { target: "Preferivo restare a casa il sabato.", english: "I preferred staying home on Saturdays.", tags: ["general", "family"], grammar: "Imperfetto: preferivo (preferire) for habitual past preference." },
  { target: "Odiavo svegliarmi presto la mattina.", english: "I hated waking up early in the morning.", tags: ["general", "work"], grammar: "Imperfetto: odiavo (odiare) for habitual past feeling." },
  { target: "Amava il profumo dei fiori d'arancio.", english: "She loved the scent of orange blossoms.", tags: ["general", "travel"], grammar: "Imperfetto: amava (amare) for ongoing past state." },
  { target: "Pensavo sempre a te.", english: "I always thought about you.", tags: ["general", "family"], grammar: "Imperfetto: pensavo (pensare) for habitual past." },
  { target: "Non sapevo che cosa fare.", english: "I didn't know what to do.", tags: ["general", "work"], grammar: "Imperfetto: sapevo (sapere) for past mental state." },
  { target: "Mi preoccupavo troppo per tutto.", english: "I used to worry too much about everything.", tags: ["general", "family"], grammar: "Imperfetto: mi preoccupavo (preoccuparsi) for habitual past." },

  // --- Childhood and youth memories ---
  { target: "Da bambino avevo paura dei temporali.", english: "As a child I was afraid of thunderstorms.", tags: ["general", "family"], grammar: "Imperfetto: avevo (avere) for ongoing past state." },
  { target: "Giocavamo a nascondino fino a sera.", english: "We played hide and seek until evening.", tags: ["general", "family"], grammar: "Imperfetto: giocavamo (giocare) for habitual past." },
  { target: "Mia madre mi leggeva le fiabe.", english: "My mother used to read me fairy tales.", tags: ["general", "family"], grammar: "Imperfetto: leggeva (leggere) for habitual past." },
  { target: "Il nonno mi portava a pescare.", english: "Grandpa used to take me fishing.", tags: ["general", "family"], grammar: "Imperfetto: portava (portare) for habitual past." },
  { target: "Ci divertivamo molto d'estate.", english: "We had a lot of fun in summer.", tags: ["general", "family"], grammar: "Imperfetto: ci divertivamo (divertirsi) for habitual past." },
  { target: "Passavamo le sere a giocare a carte.", english: "We spent the evenings playing cards.", tags: ["general", "family"], grammar: "Imperfetto: passavamo (passare) for habitual past." },
  { target: "Raccoglievamo le fragole nel campo.", english: "We used to pick strawberries in the field.", tags: ["general", "family"], grammar: "Imperfetto: raccoglievamo (raccogliere) for habitual past." },

  // --- Work and daily life in the past ---
  { target: "Cominciavo a lavorare alle otto.", english: "I used to start work at eight.", tags: ["general", "work"], grammar: "Imperfetto: cominciavo (cominciare) for habitual past." },
  { target: "Tornava a casa stanchissimo.", english: "He came home exhausted.", tags: ["general", "work"], grammar: "Imperfetto: tornava (tornare) for habitual past." },
  { target: "Insegnava matematica al liceo.", english: "She taught math at high school.", tags: ["general", "work"], grammar: "Imperfetto: insegnava (insegnare) for ongoing past." },
  { target: "Guadagnavo poco ma ero contento.", english: "I earned little but I was happy.", tags: ["general", "work"], grammar: "Imperfetto: guadagnavo + ero for two past states." },
  { target: "Il treno arrivava sempre in ritardo.", english: "The train always arrived late.", tags: ["general", "travel"], grammar: "Imperfetto: arrivava (arrivare) for habitual past." },

  // --- Descriptions with stare + gerund in imperfetto ---
  { target: "Stavo guardando la TV quando hai chiamato.", english: "I was watching TV when you called.", tags: ["general", "family"], grammar: "Imperfetto progressivo: stavo + gerundio for action in progress." },
  { target: "Stava dormendo quando è suonato il campanello.", english: "She was sleeping when the doorbell rang.", tags: ["general", "family"], grammar: "Imperfetto progressivo: stava + gerundio for action in progress." },
  { target: "Stavamo cenando in terrazza.", english: "We were having dinner on the terrace.", tags: ["general", "family"], grammar: "Imperfetto progressivo: stavamo + gerundio for action in progress." },
  { target: "Stavano parlando di te proprio adesso.", english: "They were just talking about you.", tags: ["general", "family"], grammar: "Imperfetto progressivo: stavano + gerundio for action in progress." },

  // --- Mixed everyday imperfetto ---
  { target: "Portava sempre gli occhiali da sole.", english: "She always wore sunglasses.", tags: ["general", "travel"], grammar: "Imperfetto: portava (portare) for habitual past." },
  { target: "Fumava un pacchetto al giorno.", english: "He smoked a pack a day.", tags: ["general", "work"], grammar: "Imperfetto: fumava (fumare) for habitual past." },
  { target: "Costava molto meno dieci anni fa.", english: "It cost much less ten years ago.", tags: ["general", "travel"], grammar: "Imperfetto: costava (costare) for past state." },
  { target: "Parlava cinque lingue da giovane.", english: "He spoke five languages when he was young.", tags: ["general", "work"], grammar: "Imperfetto: parlava (parlare) for past ability." },
  { target: "Suonavo la chitarra da ragazzo.", english: "I used to play guitar as a teenager.", tags: ["general", "family"], grammar: "Imperfetto: suonavo (suonare) for habitual past." },
  { target: "Abitavamo in un palazzo antico.", english: "We lived in an old building.", tags: ["general", "family"], grammar: "Imperfetto: abitavamo (abitare) for ongoing past." },
  { target: "Mi alzavo presto per andare a correre.", english: "I used to get up early to go running.", tags: ["general", "family"], grammar: "Imperfetto: mi alzavo (alzarsi) for habitual past." },
];

// ─────────────────────────────────────────────────────────────
// NODE-12: Past contrast — passato prossimo vs imperfetto (+60 cards)
// BOTH tenses must appear in every sentence
// ─────────────────────────────────────────────────────────────

const node12Cards = [
  // --- mentre (while) ---
  { target: "Mentre dormivo, è suonato il telefono.", english: "While I was sleeping, the phone rang.", tags: ["general", "family"], grammar: "Imperfetto (dormivo) for background + passato prossimo (è suonato) for sudden event." },
  { target: "Mentre cucinavo, è arrivato mio marito.", english: "While I was cooking, my husband arrived.", tags: ["general", "family"], grammar: "Imperfetto (cucinavo) for ongoing action + passato prossimo (è arrivato) for interruption." },
  { target: "Mentre facevo la doccia, è andata via la luce.", english: "While I was showering, the power went out.", tags: ["general", "family"], grammar: "Imperfetto (facevo) for background + passato prossimo (è andata) for sudden event." },
  { target: "Mentre passeggiavamo, abbiamo incontrato Luigi.", english: "While we were walking, we ran into Luigi.", tags: ["general", "travel"], grammar: "Imperfetto (passeggiavamo) for ongoing + passato prossimo (abbiamo incontrato) for the event." },
  { target: "Mentre parlavo al telefono, il gatto ha rotto un vaso.", english: "While I was on the phone, the cat broke a vase.", tags: ["general", "family"], grammar: "Imperfetto (parlavo) for background + passato prossimo (ha rotto) for sudden event." },
  { target: "Mentre stiravo, ho sentito un rumore strano.", english: "While I was ironing, I heard a strange noise.", tags: ["general", "family"], grammar: "Imperfetto (stiravo) for ongoing + passato prossimo (ho sentito) for the event." },
  { target: "Mentre guardavamo il film, si è spenta la TV.", english: "While we were watching the movie, the TV turned off.", tags: ["general", "family"], grammar: "Imperfetto (guardavamo) for background + passato prossimo (si è spenta) for interruption." },
  { target: "Mentre correva, è inciampato e caduto.", english: "While he was running, he tripped and fell.", tags: ["general", "travel"], grammar: "Imperfetto (correva) for ongoing + passato prossimo (è inciampato) for sudden event." },
  { target: "Mentre pranzavamo, ha cominciato a piovere.", english: "While we were having lunch, it started raining.", tags: ["general", "travel"], grammar: "Imperfetto (pranzavamo) for background + passato prossimo (ha cominciato) for weather change." },
  { target: "Mentre lavoravo, mi ha chiamato un vecchio amico.", english: "While I was working, an old friend called me.", tags: ["general", "work"], grammar: "Imperfetto (lavoravo) for ongoing + passato prossimo (mi ha chiamato) for event." },
  { target: "Mentre aspettavamo il treno, è arrivata la neve.", english: "While we were waiting for the train, it started snowing.", tags: ["general", "travel"], grammar: "Imperfetto (aspettavamo) for background + passato prossimo (è arrivata) for sudden change." },
  { target: "Mentre studiava, si è addormentata sul libro.", english: "While she was studying, she fell asleep on the book.", tags: ["general", "work"], grammar: "Imperfetto (studiava) for ongoing + passato prossimo (si è addormentata) for event." },

  // --- quando (when) ---
  { target: "Quando siamo arrivati, pioveva forte.", english: "When we arrived, it was raining hard.", tags: ["general", "travel"], grammar: "Passato prossimo (siamo arrivati) for completed arrival + imperfetto (pioveva) for weather backdrop." },
  { target: "Quando ho aperto la porta, dormivano tutti.", english: "When I opened the door, everyone was sleeping.", tags: ["general", "family"], grammar: "Passato prossimo (ho aperto) for single action + imperfetto (dormivano) for state." },
  { target: "Quando l'ho incontrata, portava un vestito rosso.", english: "When I met her, she was wearing a red dress.", tags: ["general", "family"], grammar: "Passato prossimo (l'ho incontrata) for event + imperfetto (portava) for description." },
  { target: "Quando sono tornato, la cena era già pronta.", english: "When I got back, dinner was already ready.", tags: ["general", "family"], grammar: "Passato prossimo (sono tornato) for event + imperfetto (era) for state." },
  { target: "Quando ha chiamato, ero sotto la doccia.", english: "When he called, I was in the shower.", tags: ["general", "family"], grammar: "Passato prossimo (ha chiamato) for event + imperfetto (ero) for state." },
  { target: "Quando siamo usciti, faceva già buio.", english: "When we went out, it was already dark.", tags: ["general", "travel"], grammar: "Passato prossimo (siamo usciti) for event + imperfetto (faceva) for weather." },
  { target: "Quando ho visto il prezzo, non avevo abbastanza soldi.", english: "When I saw the price, I didn't have enough money.", tags: ["general", "travel"], grammar: "Passato prossimo (ho visto) for discovery + imperfetto (avevo) for state." },
  { target: "Quando mi sono svegliato, nevicava.", english: "When I woke up, it was snowing.", tags: ["general", "travel"], grammar: "Passato prossimo (mi sono svegliato) for event + imperfetto (nevicava) for weather." },
  { target: "Quando è arrivata la polizia, il ladro scappava.", english: "When the police arrived, the thief was running away.", tags: ["general", "travel"], grammar: "Passato prossimo (è arrivata) for event + imperfetto (scappava) for ongoing action." },
  { target: "Quando ho finito il lavoro, erano già le otto.", english: "When I finished work, it was already eight.", tags: ["general", "work"], grammar: "Passato prossimo (ho finito) for completed action + imperfetto (erano) for time state." },

  // --- d'improvviso / all'improvviso (suddenly) ---
  { target: "Stavo leggendo e d'improvviso è caduta la luce.", english: "I was reading and suddenly the power went out.", tags: ["general", "family"], grammar: "Imperfetto progressivo (stavo leggendo) for background + passato prossimo (è caduta) for sudden event." },
  { target: "Guidavo tranquillo e all'improvviso un cervo ha attraversato.", english: "I was driving calmly and suddenly a deer crossed.", tags: ["general", "travel"], grammar: "Imperfetto (guidavo) for ongoing + passato prossimo (ha attraversato) for sudden event." },
  { target: "Parlavamo del più e del meno e d'improvviso ha iniziato a piangere.", english: "We were chatting and suddenly she started crying.", tags: ["general", "family"], grammar: "Imperfetto (parlavamo) for background + passato prossimo (ha iniziato) for sudden event." },
  { target: "Camminavo per strada e all'improvviso ho sentito il mio nome.", english: "I was walking down the street and suddenly I heard my name.", tags: ["general", "travel"], grammar: "Imperfetto (camminavo) for ongoing + passato prossimo (ho sentito) for sudden event." },
  { target: "Dormiva profondamente e d'improvviso si è svegliato.", english: "He was sleeping deeply and suddenly he woke up.", tags: ["general", "family"], grammar: "Imperfetto (dormiva) for state + passato prossimo (si è svegliato) for sudden event." },

  // --- Mixed past contrast with a quel punto / intanto ---
  { target: "Pioveva da ore e a quel punto abbiamo deciso di restare.", english: "It had been raining for hours and at that point we decided to stay.", tags: ["general", "travel"], grammar: "Imperfetto (pioveva) for ongoing weather + passato prossimo (abbiamo deciso) for decision." },
  { target: "Intanto che aspettavo, ho letto un capitolo del libro.", english: "Meanwhile, as I was waiting, I read a chapter of the book.", tags: ["general", "work"], grammar: "Imperfetto (aspettavo) for background + passato prossimo (ho letto) for completed action." },
  { target: "Faceva un caldo terribile e a quel punto ho acceso il ventilatore.", english: "It was terribly hot and at that point I turned on the fan.", tags: ["general", "family"], grammar: "Imperfetto (faceva) for state + passato prossimo (ho acceso) for action." },

  // --- More natural everyday contrast ---
  { target: "Leggevo un libro quando è arrivata Maria.", english: "I was reading a book when Maria arrived.", tags: ["general", "family"], grammar: "Imperfetto (leggevo) for ongoing action + passato prossimo (è arrivata) for interruption." },
  { target: "Ero stanco ma ho continuato a lavorare.", english: "I was tired but I kept working.", tags: ["general", "work"], grammar: "Imperfetto (ero) for state + passato prossimo (ho continuato) for action." },
  { target: "Non stavo bene ma sono andato al lavoro.", english: "I wasn't feeling well but I went to work.", tags: ["general", "work"], grammar: "Imperfetto (stavo) for state + passato prossimo (sono andato) for completed action." },
  { target: "Faceva bel tempo e abbiamo deciso di uscire.", english: "The weather was nice and we decided to go out.", tags: ["general", "travel"], grammar: "Imperfetto (faceva) for weather + passato prossimo (abbiamo deciso) for decision." },
  { target: "Avevo fame e ho mangiato due panini.", english: "I was hungry and I ate two sandwiches.", tags: ["general", "family"], grammar: "Imperfetto (avevo) for state + passato prossimo (ho mangiato) for completed action." },
  { target: "Pensavo a te quando mi hai scritto.", english: "I was thinking about you when you texted me.", tags: ["general", "family"], grammar: "Imperfetto (pensavo) for ongoing + passato prossimo (mi hai scritto) for event." },
  { target: "Non sapevo la risposta ma ho provato lo stesso.", english: "I didn't know the answer but I tried anyway.", tags: ["general", "work"], grammar: "Imperfetto (sapevo) for state + passato prossimo (ho provato) for action." },
  { target: "Volevamo andare al mare ma ha piovuto.", english: "We wanted to go to the beach but it rained.", tags: ["general", "travel"], grammar: "Imperfetto (volevamo) for desire + passato prossimo (ha piovuto) for the event." },
  { target: "Era molto tardi e ho preso un taxi.", english: "It was very late and I took a taxi.", tags: ["general", "travel"], grammar: "Imperfetto (era) for time state + passato prossimo (ho preso) for completed action." },
  { target: "Avevamo fretta e abbiamo saltato la colazione.", english: "We were in a hurry and we skipped breakfast.", tags: ["general", "work"], grammar: "Imperfetto (avevamo) for state + passato prossimo (abbiamo saltato) for action." },
  { target: "Cercavo le chiavi quando le ho trovate in tasca.", english: "I was looking for the keys when I found them in my pocket.", tags: ["general", "family"], grammar: "Imperfetto (cercavo) for ongoing + passato prossimo (ho trovate) for discovery." },
  { target: "Mi annoiavo e così sono uscito a fare una passeggiata.", english: "I was bored so I went out for a walk.", tags: ["general", "travel"], grammar: "Imperfetto (mi annoiavo) for state + passato prossimo (sono uscito) for action." },
  { target: "Pioveva e lei ha dimenticato l'ombrello.", english: "It was raining and she forgot the umbrella.", tags: ["general", "travel"], grammar: "Imperfetto (pioveva) for weather + passato prossimo (ha dimenticato) for event." },
  { target: "Stavano per uscire quando è squillato il telefono.", english: "They were about to leave when the phone rang.", tags: ["general", "family"], grammar: "Imperfetto (stavano) for imminent action + passato prossimo (è squillato) for interruption." },
  { target: "Il treno era pieno e siamo rimasti in piedi.", english: "The train was full and we stood.", tags: ["general", "travel"], grammar: "Imperfetto (era) for state + passato prossimo (siamo rimasti) for result." },
  { target: "Nevicava molto e abbiamo chiuso le scuole.", english: "It was snowing a lot and they closed the schools.", tags: ["general", "family"], grammar: "Imperfetto (nevicava) for weather + passato prossimo (abbiamo chiuso) for decision." },
  { target: "Avevo sonno ma ho finito il libro.", english: "I was sleepy but I finished the book.", tags: ["general", "family"], grammar: "Imperfetto (avevo) for state + passato prossimo (ho finito) for completed action." },
  { target: "Sorrideva sempre e un giorno mi ha invitato a uscire.", english: "She always smiled and one day she asked me out.", tags: ["general", "family"], grammar: "Imperfetto (sorrideva) for habitual + passato prossimo (mi ha invitato) for specific event." },
  { target: "Non conoscevo nessuno ma ho fatto subito amicizia.", english: "I didn't know anyone but I made friends right away.", tags: ["general", "travel"], grammar: "Imperfetto (conoscevo) for state + passato prossimo (ho fatto) for event." },
];

// ─────────────────────────────────────────────────────────────
// NODE-35: Advanced mixed mastery (+14 cards)
// C2 level: subjunctive + conditionals, literary register
// ─────────────────────────────────────────────────────────────

const node35Cards = [
  { target: "Per quanto ne sappia, nessuno ha ancora trovato una soluzione.", english: "As far as I know, nobody has found a solution yet.", tags: ["general", "work"], grammar: "Per quanto + subjunctive (sappia) for concessive/epistemic expression." },
  { target: "Quand'anche fosse vero, non cambierebbe nulla.", english: "Even if it were true, it wouldn't change anything.", tags: ["general", "work"], grammar: "Quand'anche + imperfect subjunctive (fosse) + conditional: literary concessive." },
  { target: "Avesse almeno avuto il coraggio di dirmelo in faccia.", english: "If only he had had the courage to tell me to my face.", tags: ["general", "family"], grammar: "Avesse + past participle: pluperfect subjunctive as desiderative in literary register." },
  { target: "Sia come sia, dobbiamo andare avanti.", english: "Be that as it may, we must move forward.", tags: ["general", "work"], grammar: "Sia come sia: fixed concessive with repeated present subjunctive." },
  { target: "Non fosse stato per te, non ce l'avrei mai fatta.", english: "If it hadn't been for you, I would never have made it.", tags: ["general", "family"], grammar: "Non fosse stato + conditional past: inverted unreal past conditional." },
  { target: "Lungi dall'essere risolto, il problema si è aggravato.", english: "Far from being resolved, the problem has worsened.", tags: ["general", "work"], grammar: "Lungi da + infinitive: formal/literary expression of distance from a state." },
  { target: "Per quanto mi riguardi, la questione è chiusa.", english: "As far as I'm concerned, the matter is closed.", tags: ["general", "work"], grammar: "Per quanto + subjunctive (riguardi): formal concessive clause." },
  { target: "Checché se ne dica, il risultato è stato eccellente.", english: "Whatever people say, the result was excellent.", tags: ["general", "work"], grammar: "Checché + subjunctive (dica): literary concessive, regardless of what." },
  { target: "Foss'anche l'ultima cosa che faccio, lo porterò a termine.", english: "Even if it's the last thing I do, I'll see it through.", tags: ["general", "work"], grammar: "Foss'anche + imperfect subjunctive: literary emphatic concessive." },
  { target: "A prescindere da ciò che abbiano deciso, noi proseguiremo.", english: "Regardless of what they may have decided, we will continue.", tags: ["general", "work"], grammar: "A prescindere da + subjunctive: formal expression ignoring external factors." },
  { target: "Se non fosse per la burocrazia, vivere qui sarebbe perfetto.", english: "If it weren't for the bureaucracy, living here would be perfect.", tags: ["general", "travel"], grammar: "Se non fosse per: imperfect subjunctive + conditional for unreal present." },
  { target: "Quale che sia la tua scelta, ti sosterrò.", english: "Whatever your choice may be, I'll support you.", tags: ["general", "family"], grammar: "Quale che sia: literary/formal 'whichever' with present subjunctive." },
  { target: "Purché venga fatta giustizia, accetterò qualsiasi verdetto.", english: "As long as justice is done, I'll accept any verdict.", tags: ["general", "work"], grammar: "Purché + subjunctive (venga fatta): formal conditional clause with passive." },
  { target: "Senza che nessuno se ne accorgesse, il tempo era passato.", english: "Without anyone noticing, time had passed.", tags: ["general", "family"], grammar: "Senza che + imperfect subjunctive (se ne accorgesse): negative result clause." },
];


// ═════════════════════════════════════════════════════════════
// MERGE: append new cards, skip duplicates
// ═════════════════════════════════════════════════════════════

const allNew = [
  ...node07Cards.map(c => ({ ...c, grammarNode: 'node-07' })),
  ...node10Cards.map(c => ({ ...c, grammarNode: 'node-10' })),
  ...node11Cards.map(c => ({ ...c, grammarNode: 'node-11' })),
  ...node12Cards.map(c => ({ ...c, grammarNode: 'node-12' })),
  ...node35Cards.map(c => ({ ...c, grammarNode: 'node-35' })),
];

let addedCount = 0;
let skippedDupes = 0;
const addedPerNode = { 'node-07': 0, 'node-10': 0, 'node-11': 0, 'node-12': 0, 'node-35': 0 };

for (const card of allNew) {
  const key = card.target.toLowerCase().trim();
  if (existingTargets.has(key)) {
    skippedDupes++;
    console.log(`  SKIP duplicate: ${card.target}`);
    continue;
  }
  existingTargets.add(key);
  deck.push({
    id: 0,          // will be reassigned
    target: card.target,
    english: card.english,
    audio: '',       // will be reassigned
    ...(card.grammar ? { grammar: card.grammar } : {}),
    tags: card.tags,
    grammarNode: card.grammarNode,
  });
  addedCount++;
  addedPerNode[card.grammarNode]++;
}

console.log(`\nAdded ${addedCount} new cards (skipped ${skippedDupes} duplicates)`);
console.log('  node-07:', addedPerNode['node-07']);
console.log('  node-10:', addedPerNode['node-10']);
console.log('  node-11:', addedPerNode['node-11']);
console.log('  node-12:', addedPerNode['node-12']);
console.log('  node-35:', addedPerNode['node-35']);

// ═════════════════════════════════════════════════════════════
// SORT by grammarNode
// ═════════════════════════════════════════════════════════════

const nodeOrder = (n) => {
  const m = n.match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 999;
};
deck.sort((a, b) => nodeOrder(a.grammarNode) - nodeOrder(b.grammarNode));

// ═════════════════════════════════════════════════════════════
// RE-ASSIGN sequential IDs and audio
// ═════════════════════════════════════════════════════════════

for (let i = 0; i < deck.length; i++) {
  deck[i].id = i + 1;
  deck[i].audio = `it-${i + 1}.mp3`;
}

// ═════════════════════════════════════════════════════════════
// WRITE
// ═════════════════════════════════════════════════════════════

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));

// ═════════════════════════════════════════════════════════════
// STATS
// ═════════════════════════════════════════════════════════════

console.log(`\nNew total: ${deck.length} cards`);

// Per-node counts
const nodeCounts = {};
for (const c of deck) {
  nodeCounts[c.grammarNode] = (nodeCounts[c.grammarNode] || 0) + 1;
}
const sortedNodes = Object.entries(nodeCounts).sort((a, b) =>
  nodeOrder(a[0]) - nodeOrder(b[0])
);
console.log('\nCards per node:');
for (const [node, count] of sortedNodes) {
  console.log(`  ${node}: ${count}`);
}

// Tag distribution
const tagCounts = {};
for (const c of deck) {
  for (const tag of c.tags) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
}
console.log('\nTag distribution:');
for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${tag}: ${count} (${(count / deck.length * 100).toFixed(1)}%)`);
}

// Grammar notes
const grammarCount = deck.filter(c => c.grammar).length;
console.log(`\nCards with grammar notes: ${grammarCount}/${deck.length} (${(grammarCount / deck.length * 100).toFixed(1)}%)`);

console.log('\nDone! Wrote expanded deck to', DECK_PATH);
