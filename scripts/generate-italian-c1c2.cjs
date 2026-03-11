/**
 * generate-italian-c1c2.cjs
 *
 * Generates ~600 Italian C1-C2 flashcards for nodes 21-26.
 * Writes output to src/data/italian/c1c2.json.
 *
 * Node mapping:
 *   21: Sfumature del congiuntivo  (~100 cards)
 *   22: Perifrasi verbali          (~100 cards)
 *   23: Discorso indiretto         (~100 cards)
 *   24: Registro & stile           (~100 cards)
 *   25: Espressioni idiomatiche    (~100 cards)
 *   26: Sintassi complessa         (~100 cards)
 *
 * IDs start at 8001. Audio follows pattern: it-{id}.mp3
 * ~40% of cards include a grammar tip.
 * Tags always include at least 2 of: general, travel, work, family.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'c1c2.json');

let currentId = 8001;

function makeCard(target, english, grammarNode, tags, grammar) {
  const card = {
    id: currentId,
    target,
    english,
    audio: `it-${currentId}.mp3`,
    tags,
    grammarNode,
  };
  if (grammar) {
    card.grammar = grammar;
  }
  currentId++;
  return card;
}

const cards = [];

// ═══════════════════════════════════════════════════════════════
// NODE 21 — Sfumature del congiuntivo (~100 cards)
// ═══════════════════════════════════════════════════════════════

const node21 = [
  // Non credo che + subjunctive
  makeCard("Non credo che lui abbia capito la situazione.", "I don't think he understood the situation.", "node-21", ["general", "work"], "\"Non credo che\" triggers subjunctive because it expresses doubt."),
  makeCard("Non penso che questa sia la decisione giusta.", "I don't think this is the right decision.", "node-21", ["general", "work"]),
  makeCard("Non mi sembra che abbiano risolto il problema.", "It doesn't seem to me that they solved the problem.", "node-21", ["general", "work"], "\"Non mi sembra che\" expresses doubt, requiring subjunctive."),
  makeCard("Dubito che riescano a finire entro domani.", "I doubt they'll manage to finish by tomorrow.", "node-21", ["general", "work"]),
  makeCard("Non credo che valga la pena discuterne ancora.", "I don't think it's worth discussing it anymore.", "node-21", ["general", "work"], "\"Valga\" is the subjunctive of \"valere\" (to be worth)."),
  makeCard("Non sono sicura che il treno parta in orario.", "I'm not sure the train leaves on time.", "node-21", ["general", "travel"]),
  makeCard("Non penso che ci sia abbastanza tempo per tutto.", "I don't think there is enough time for everything.", "node-21", ["general", "work"]),
  makeCard("Dubito fortemente che lui dica la verita.", "I strongly doubt that he is telling the truth.", "node-21", ["general", "family"]),
  makeCard("Non credo che mia sorella sappia ancora la notizia.", "I don't believe my sister knows the news yet.", "node-21", ["general", "family"], "\"Sappia\" is the subjunctive of \"sapere\" (to know)."),
  makeCard("Non mi pare che il ristorante sia aperto oggi.", "I don't think the restaurant is open today.", "node-21", ["general", "travel"]),

  // Come se + imperfect subjunctive
  makeCard("Parla come se fosse un esperto di economia.", "He talks as if he were an expert in economics.", "node-21", ["general", "work"], "\"Come se\" always requires the imperfect subjunctive."),
  makeCard("Mi tratta come se fossi un bambino piccolo.", "He treats me as if I were a small child.", "node-21", ["general", "family"]),
  makeCard("Si comporta come se niente fosse successo ieri sera.", "She behaves as if nothing had happened last night.", "node-21", ["general", "family"], "\"Come se\" + imperfect subjunctive for simultaneity; pluperfect for anteriority."),
  makeCard("Ride come se avesse sentito la barzelletta migliore.", "She laughs as if she had heard the best joke.", "node-21", ["general", "family"]),
  makeCard("Cammina come se conoscesse ogni angolo della citta.", "He walks as if he knew every corner of the city.", "node-21", ["general", "travel"]),
  makeCard("Spende soldi come se fossero acqua fresca.", "He spends money as if it were nothing.", "node-21", ["general", "work"]),

  // Il fatto che + subjunctive
  makeCard("Il fatto che tu sia qui mi rende molto felice.", "The fact that you are here makes me very happy.", "node-21", ["general", "family"], "\"Il fatto che\" always takes the subjunctive in standard Italian."),
  makeCard("Il fatto che nessuno abbia protestato mi sorprende.", "The fact that nobody protested surprises me.", "node-21", ["general", "work"]),
  makeCard("Il fatto che piova non ci impedisce di uscire.", "The fact that it's raining doesn't stop us from going out.", "node-21", ["general", "travel"]),
  makeCard("Il fatto che abbia cambiato idea non cambia nulla.", "The fact that he changed his mind changes nothing.", "node-21", ["general", "work"]),

  // Per quanto + subjunctive
  makeCard("Per quanto ne sappia, nessuno ha ancora trovato una soluzione.", "As far as I know, nobody has found a solution yet.", "node-21", ["general", "work"], "\"Per quanto\" (as far as / however much) triggers subjunctive."),
  makeCard("Per quanto sia difficile, non mi arrendo facilmente.", "However difficult it may be, I don't give up easily.", "node-21", ["general", "work"]),
  makeCard("Per quanto si impegni, i risultati non migliorano mai.", "No matter how hard he tries, the results never improve.", "node-21", ["general", "work"], "\"Per quanto\" + subjunctive expresses concession (however much)."),
  makeCard("Per quanto mi riguardi, la questione e chiusa ormai.", "As far as I'm concerned, the matter is closed now.", "node-21", ["general", "work"]),
  makeCard("Per quanto ne sappiamo, il volo non e stato cancellato.", "As far as we know, the flight has not been cancelled.", "node-21", ["general", "travel"]),

  // Qualunque/qualsiasi + subjunctive
  makeCard("Qualunque cosa tu dica, non cambiero idea su questo.", "Whatever you say, I won't change my mind about this.", "node-21", ["general", "family"], "\"Qualunque cosa\" + subjunctive for indefinite concessive clauses."),
  makeCard("Qualsiasi decisione prendiate, vi appoggeremo senza dubbi.", "Whatever decision you make, we will support you without doubt.", "node-21", ["general", "family"]),
  makeCard("Dovunque tu vada, porterai sempre questo ricordo con te.", "Wherever you go, you will always carry this memory with you.", "node-21", ["general", "travel"], "\"Dovunque\" (wherever) behaves like \"qualunque\" and takes subjunctive."),
  makeCard("Chiunque abbia scritto questa lettera sapeva la verita.", "Whoever wrote this letter knew the truth.", "node-21", ["general", "work"]),
  makeCard("Qualsiasi cosa succeda, resta calmo e ragiona con lucidita.", "Whatever happens, stay calm and think clearly.", "node-21", ["general", "work"]),

  // A patto che, a condizione che, purche + subjunctive
  makeCard("Ti aiuto a patto che tu faccia la tua parte.", "I'll help you provided that you do your part.", "node-21", ["general", "work"], "\"A patto che\" (provided that) always requires subjunctive."),
  makeCard("Possiamo partire purche il tempo migliori entro sera.", "We can leave provided that the weather improves by evening.", "node-21", ["general", "travel"]),
  makeCard("Accetto l'invito a condizione che ci sia anche Marco.", "I accept the invitation on the condition that Marco is there too.", "node-21", ["general", "family"], "\"A condizione che\" (on the condition that) triggers subjunctive."),
  makeCard("Vengo alla festa purche non si faccia troppo tardi.", "I'll come to the party as long as it doesn't get too late.", "node-21", ["general", "family"]),
  makeCard("Firmo il contratto a patto che le condizioni siano chiare.", "I'll sign the contract provided the conditions are clear.", "node-21", ["general", "work"]),
  makeCard("Ti presto la macchina a condizione che tu guidi piano.", "I'll lend you the car on condition that you drive slowly.", "node-21", ["general", "family"]),

  // Prima che + subjunctive vs dopo che + indicative
  makeCard("Devo finire prima che arrivi il direttore stamattina.", "I have to finish before the director arrives this morning.", "node-21", ["general", "work"], "\"Prima che\" takes subjunctive; \"dopo che\" takes indicative."),
  makeCard("Chiudi la finestra prima che cominci a piovere forte.", "Close the window before it starts raining hard.", "node-21", ["general", "family"]),
  makeCard("Voglio parlargli prima che sia troppo tardi ormai.", "I want to talk to him before it's too late.", "node-21", ["general", "family"]),
  makeCard("Partiamo prima che il traffico diventi impossibile oggi.", "Let's leave before the traffic becomes impossible today.", "node-21", ["general", "travel"], "\"Prima che\" requires subjunctive because the event hasn't happened yet."),

  // Superlative relative + subjunctive
  makeCard("E il film piu bello che io abbia mai visto.", "It's the most beautiful film I have ever seen.", "node-21", ["general", "family"], "Superlative relative (il piu... che) triggers subjunctive."),
  makeCard("E la persona piu intelligente che abbia mai conosciuto.", "She is the smartest person I have ever met.", "node-21", ["general", "work"]),
  makeCard("E il viaggio piu emozionante che abbiamo mai fatto insieme.", "It's the most exciting trip we have ever taken together.", "node-21", ["general", "travel"], "After a relative superlative, Italian uses subjunctive in the relative clause."),
  makeCard("E la citta piu caotica che io abbia mai visitato.", "It's the most chaotic city I have ever visited.", "node-21", ["general", "travel"]),
  makeCard("E il regalo piu bello che mi abbiano mai fatto.", "It's the most beautiful gift they have ever given me.", "node-21", ["general", "family"]),
  makeCard("E il peggior errore che si possa commettere in ufficio.", "It's the worst mistake one can make at the office.", "node-21", ["general", "work"]),

  // Subjunctive in independent clauses
  makeCard("Che Dio ti benedica per quello che hai fatto!", "May God bless you for what you have done!", "node-21", ["general", "family"], "Independent subjunctive for wishes and exhortations: Che + subjunctive."),
  makeCard("Magari potessi tornare indietro e cambiare tutto quanto!", "If only I could go back and change everything!", "node-21", ["general", "family"], "\"Magari\" + imperfect subjunctive expresses a strong, unrealizable wish."),
  makeCard("Che vinca il migliore in questa competizione importante!", "May the best one win in this important competition!", "node-21", ["general", "work"]),
  makeCard("Magari avessi studiato medicina invece di giurisprudenza!", "If only I had studied medicine instead of law!", "node-21", ["general", "work"]),
  makeCard("Che sia chiaro a tutti: non tollero ritardi.", "Let it be clear to everyone: I don't tolerate delays.", "node-21", ["general", "work"], "\"Che sia\" introduces an exhortative subjunctive in independent clauses."),
  makeCard("Magari smettesse di piovere prima della partita di stasera!", "If only it would stop raining before tonight's game!", "node-21", ["general", "travel"]),

  // Additional mixed subjunctive nuances
  makeCard("Sembra che il governo stia considerando nuove misure economiche.", "It seems the government is considering new economic measures.", "node-21", ["general", "work"]),
  makeCard("E necessario che tutti partecipino alla riunione di domani.", "It is necessary that everyone participates in tomorrow's meeting.", "node-21", ["general", "work"], "Impersonal expressions of necessity trigger subjunctive."),
  makeCard("Temo che non riusciremo a partire in tempo per il volo.", "I'm afraid we won't manage to leave in time for the flight.", "node-21", ["general", "travel"]),
  makeCard("Bisogna che tu faccia attenzione a ogni piccolo dettaglio.", "You need to pay attention to every small detail.", "node-21", ["general", "work"], "\"Bisogna che\" (it is necessary that) triggers subjunctive."),
  makeCard("E probabile che la riunione venga rinviata alla prossima settimana.", "It's likely that the meeting will be postponed to next week.", "node-21", ["general", "work"]),
  makeCard("Spero che tu possa venire alla cena di famiglia sabato.", "I hope you can come to the family dinner on Saturday.", "node-21", ["general", "family"]),
  makeCard("E importante che i bambini imparino a rispettare gli altri.", "It's important that children learn to respect others.", "node-21", ["general", "family"]),
  makeCard("Suppongo che abbiate gia ricevuto la mia lettera di ieri.", "I suppose you have already received my letter from yesterday.", "node-21", ["general", "work"]),
  makeCard("Benche sia stanco, continuo a lavorare fino a sera.", "Although I'm tired, I keep working until evening.", "node-21", ["general", "work"], "\"Benche\" (although) always takes the subjunctive."),
  makeCard("Nonostante faccia freddo, preferisco camminare fino all'ufficio.", "Despite the cold, I prefer walking to the office.", "node-21", ["general", "work"], "\"Nonostante\" (despite) requires subjunctive when followed by a clause."),
  makeCard("Affinche il progetto riesca, dobbiamo collaborare tutti insieme.", "In order for the project to succeed, we must all work together.", "node-21", ["general", "work"], "\"Affinche\" (so that) takes subjunctive to express purpose."),
  makeCard("Sebbene abbia molti difetti, resta una persona di gran cuore.", "Although he has many flaws, he remains a big-hearted person.", "node-21", ["general", "family"]),
  makeCard("Mi auguro che tutto si risolva nel migliore dei modi.", "I hope everything will work out in the best possible way.", "node-21", ["general", "family"]),
  makeCard("Senza che nessuno se ne accorga, e uscita di nascosto ieri.", "Without anyone noticing, she snuck out yesterday.", "node-21", ["general", "family"], "\"Senza che\" (without) requires the subjunctive."),
  makeCard("Non e detto che domani piova; le previsioni sono incerte.", "It's not certain that it will rain tomorrow; the forecasts are uncertain.", "node-21", ["general", "travel"]),
  makeCard("Malgrado le difficolta, il gruppo ha raggiunto ottimi risultati.", "Despite the difficulties, the group achieved excellent results.", "node-21", ["general", "work"]),
  makeCard("Puo darsi che il museo sia chiuso il lunedi mattina.", "It may be that the museum is closed on Monday mornings.", "node-21", ["general", "travel"], "\"Puo darsi che\" (it may be that) triggers subjunctive."),
  makeCard("Non c'e nessuno che sappia risolvere questo problema tecnico.", "There is nobody who can solve this technical problem.", "node-21", ["general", "work"]),
  makeCard("Cerco un hotel che abbia una vista panoramica sul mare.", "I'm looking for a hotel that has a panoramic sea view.", "node-21", ["general", "travel"], "Subjunctive in relative clauses when the antecedent is indefinite or sought."),
  makeCard("Aspetto che smetta di nevicare prima di mettermi in viaggio.", "I'm waiting for it to stop snowing before I set off.", "node-21", ["general", "travel"]),
  makeCard("Vorrei che i miei figli capissero il valore del risparmio.", "I wish my children understood the value of saving.", "node-21", ["general", "family"]),
  makeCard("A meno che non cambi idea, parto domani mattina presto.", "Unless he changes his mind, I leave early tomorrow morning.", "node-21", ["general", "travel"], "\"A meno che non\" (unless) requires subjunctive; the \"non\" is pleonastic."),
  makeCard("Speriamo che il tempo regga per la gita di domenica.", "Let's hope the weather holds for Sunday's trip.", "node-21", ["general", "travel"]),
  makeCard("Temo che mia madre si sia offesa per quello che ho detto.", "I'm afraid my mother was offended by what I said.", "node-21", ["general", "family"]),
  makeCard("E l'unico che abbia avuto il coraggio di dire la verita.", "He is the only one who had the courage to tell the truth.", "node-21", ["general", "work"], "\"L'unico che\" (the only one who) triggers subjunctive in the relative clause."),
  makeCard("Non esiste persona che non abbia mai commesso un errore.", "There is no person who has never made a mistake.", "node-21", ["general", "work"]),
  makeCard("Ovunque tu vada, ricordati sempre delle tue origini familiari.", "Wherever you go, always remember your family origins.", "node-21", ["general", "family"]),
  makeCard("Pare che il nuovo direttore sia molto esigente con tutti.", "It seems that the new director is very demanding with everyone.", "node-21", ["general", "work"]),
  makeCard("E possibile che il treno arrivi in ritardo per lo sciopero.", "It's possible that the train will arrive late due to the strike.", "node-21", ["general", "travel"]),
  makeCard("Comunque vada, sappi che sono orgoglioso di te figlio mio.", "However it goes, know that I am proud of you, my son.", "node-21", ["general", "family"]),
  makeCard("Non voglio che si ripeta mai piu una situazione del genere.", "I don't want a situation like this to ever happen again.", "node-21", ["general", "work"]),
  makeCard("Basta che tu mi avvisi con qualche giorno di anticipo.", "It's enough that you let me know a few days in advance.", "node-21", ["general", "work"], "\"Basta che\" (it's enough that) requires subjunctive."),
];
cards.push(...node21);

// ═══════════════════════════════════════════════════════════════
// NODE 22 — Perifrasi verbali (~100 cards)
// ═══════════════════════════════════════════════════════════════

const node22 = [
  // Stare + gerundio (progressive)
  makeCard("Sto leggendo un romanzo molto avvincente in questi giorni.", "I'm reading a very gripping novel these days.", "node-22", ["general", "family"]),
  makeCard("Stavo dormendo quando il telefono ha cominciato a squillare.", "I was sleeping when the phone started ringing.", "node-22", ["general", "family"], "\"Stare\" + gerund forms the progressive aspect in Italian."),
  makeCard("Stavamo cenando quando sono arrivati gli ospiti inaspettati.", "We were having dinner when the unexpected guests arrived.", "node-22", ["general", "family"]),
  makeCard("I bambini stanno giocando tranquillamente nel giardino di casa.", "The children are playing quietly in the garden at home.", "node-22", ["general", "family"]),
  makeCard("Stavo preparando la relazione quando il sistema si e bloccato.", "I was preparing the report when the system crashed.", "node-22", ["general", "work"], "Progressive past: \"stavo\" + gerund for an ongoing past action interrupted."),
  makeCard("Sta piovendo a dirotto da stamattina senza sosta.", "It's been pouring rain since this morning without stopping.", "node-22", ["general", "travel"]),
  makeCard("La situazione economica sta peggiorando di giorno in giorno.", "The economic situation is getting worse day by day.", "node-22", ["general", "work"]),
  makeCard("Stanno costruendo un nuovo centro commerciale vicino a casa nostra.", "They are building a new shopping center near our house.", "node-22", ["general", "family"]),
  makeCard("Stavo giusto pensando a te quando mi hai chiamato.", "I was just thinking about you when you called me.", "node-22", ["general", "family"]),

  // Stare per + infinitive (about to)
  makeCard("Sto per uscire di casa; ci vediamo tra poco.", "I'm about to leave the house; see you shortly.", "node-22", ["general", "family"], "\"Stare per\" + infinitive expresses imminent future action."),
  makeCard("Stava per piovere quando siamo finalmente rientrati in hotel.", "It was about to rain when we finally got back to the hotel.", "node-22", ["general", "travel"]),
  makeCard("Il treno sta per partire; dobbiamo correre al binario.", "The train is about to leave; we have to run to the platform.", "node-22", ["general", "travel"], "\"Stare per\" signals something is on the verge of happening."),
  makeCard("Stavo per addormentarmi quando ho sentito un rumore strano.", "I was about to fall asleep when I heard a strange noise.", "node-22", ["general", "family"]),
  makeCard("La riunione sta per cominciare; prendete posto per favore.", "The meeting is about to start; please take your seats.", "node-22", ["general", "work"]),
  makeCard("Stavamo per rinunciare quando abbiamo trovato finalmente la soluzione.", "We were about to give up when we finally found the solution.", "node-22", ["general", "work"]),
  makeCard("Stava per dirmi qualcosa di importante ma poi ha esitato.", "He was about to tell me something important but then hesitated.", "node-22", ["general", "family"]),

  // Andare a + infinitive
  makeCard("Vado a comprare il pane e il latte al supermercato.", "I'm going to buy bread and milk at the supermarket.", "node-22", ["general", "family"]),
  makeCard("Andiamo a fare una passeggiata lungo il mare al tramonto.", "Let's go for a walk along the sea at sunset.", "node-22", ["general", "travel"]),
  makeCard("Sono andato a trovare i miei genitori nel fine settimana.", "I went to visit my parents over the weekend.", "node-22", ["general", "family"], "\"Andare a\" + infinitive indicates motion with purpose."),
  makeCard("Vai a chiedere informazioni alla reception dell'albergo per favore.", "Go ask for information at the hotel reception please.", "node-22", ["general", "travel"]),
  makeCard("Siamo andati a cenare in quel ristorante tipico del centro.", "We went to have dinner at that typical restaurant downtown.", "node-22", ["general", "travel"]),

  // Continuare a + infinitive
  makeCard("Continua a piovere da tre giorni senza interruzione.", "It keeps raining for three days without interruption.", "node-22", ["general", "travel"], "\"Continuare a\" + infinitive expresses ongoing, persistent action."),
  makeCard("Non posso continuare a lavorare a questi ritmi insostenibili.", "I can't keep working at these unsustainable paces.", "node-22", ["general", "work"]),
  makeCard("Mia figlia continua a chiedere quando arriveranno i regali.", "My daughter keeps asking when the presents will arrive.", "node-22", ["general", "family"]),
  makeCard("Continua a nevicare e le strade sono sempre piu pericolose.", "It keeps snowing and the roads are getting more dangerous.", "node-22", ["general", "travel"]),
  makeCard("Il collega continua a interrompermi durante le riunioni importanti.", "My colleague keeps interrupting me during important meetings.", "node-22", ["general", "work"]),
  makeCard("Nonostante le critiche, continua a credere nel suo progetto.", "Despite the criticism, he keeps believing in his project.", "node-22", ["general", "work"]),

  // Mettersi a + infinitive (to start)
  makeCard("Si e messo a ridere senza alcun motivo apparente.", "He started laughing for no apparent reason.", "node-22", ["general", "family"], "\"Mettersi a\" + infinitive means to start doing something, often suddenly."),
  makeCard("Quando ha sentito la notizia, si e messa a piangere.", "When she heard the news, she started crying.", "node-22", ["general", "family"]),
  makeCard("I bambini si sono messi a correre per tutto il cortile.", "The children started running all over the yard.", "node-22", ["general", "family"]),
  makeCard("Mi sono messo a studiare seriamente solo a meta semestre.", "I started studying seriously only halfway through the semester.", "node-22", ["general", "work"], "\"Mettersi a\" emphasizes the beginning of an action, often with effort or resolve."),
  makeCard("Si e messa a piovere proprio quando siamo usciti di casa.", "It started raining right when we left the house.", "node-22", ["general", "travel"]),
  makeCard("Il cane si e messo ad abbaiare nel cuore della notte.", "The dog started barking in the middle of the night.", "node-22", ["general", "family"]),

  // Smettere di + infinitive (to stop)
  makeCard("Ha smesso di fumare due anni fa per motivi di salute.", "He quit smoking two years ago for health reasons.", "node-22", ["general", "family"], "\"Smettere di\" + infinitive means to stop/quit doing something."),
  makeCard("Smettila di lamentarti e trova una soluzione al problema.", "Stop complaining and find a solution to the problem.", "node-22", ["general", "work"]),
  makeCard("Non ha mai smesso di sperare in un futuro migliore.", "He never stopped hoping for a better future.", "node-22", ["general", "family"]),
  makeCard("Ha smesso di piovere finalmente; possiamo uscire adesso.", "It finally stopped raining; we can go out now.", "node-22", ["general", "travel"]),
  makeCard("Devi smettere di rimandare e affrontare la situazione subito.", "You must stop procrastinating and face the situation immediately.", "node-22", ["general", "work"]),

  // Finire di/per + infinitive
  makeCard("Ho finito di lavorare tardi e sono tornato a casa stanchissimo.", "I finished working late and came home exhausted.", "node-22", ["general", "work"], "\"Finire di\" = to finish doing; \"finire per\" = to end up doing."),
  makeCard("Finisce sempre per annoiarsi dopo pochi minuti di attesa.", "He always ends up getting bored after a few minutes of waiting.", "node-22", ["general", "family"]),
  makeCard("Non ho ancora finito di leggere quel libro che mi hai prestato.", "I haven't finished reading that book you lent me yet.", "node-22", ["general", "family"]),
  makeCard("A forza di insistere, ha finito per convincere anche il capo.", "By insisting, he ended up convincing even the boss.", "node-22", ["general", "work"], "\"Finire per\" + infinitive indicates an eventual, often unintended outcome."),
  makeCard("Abbiamo finito di cenare e ci siamo seduti a chiacchierare.", "We finished dinner and sat down to chat.", "node-22", ["general", "family"]),
  makeCard("Se continui cosi, finirai per perdere tutti i tuoi amici.", "If you keep going like this, you'll end up losing all your friends.", "node-22", ["general", "family"]),

  // Cercare di + infinitive
  makeCard("Cerco di capire il tuo punto di vista sulla questione.", "I'm trying to understand your point of view on the matter.", "node-22", ["general", "work"], "\"Cercare di\" + infinitive means to try to do something."),
  makeCard("Ha cercato di spiegare le sue ragioni ma nessuno ascoltava.", "He tried to explain his reasons but nobody was listening.", "node-22", ["general", "work"]),
  makeCard("Cerchiamo di arrivare puntuali alla stazione domani mattina.", "Let's try to arrive on time at the station tomorrow morning.", "node-22", ["general", "travel"]),
  makeCard("Cercava di nascondere la sua delusione dietro un sorriso forzato.", "She was trying to hide her disappointment behind a forced smile.", "node-22", ["general", "family"]),
  makeCard("Ho cercato di prenotare un tavolo ma il ristorante era pieno.", "I tried to book a table but the restaurant was full.", "node-22", ["general", "travel"]),

  // Riuscire a + infinitive
  makeCard("Non riesco a dormire quando fa troppo caldo la notte.", "I can't sleep when it's too hot at night.", "node-22", ["general", "family"], "\"Riuscire a\" + infinitive means to manage/succeed in doing something."),
  makeCard("Sei riuscito a trovare un volo economico per Barcellona?", "Did you manage to find a cheap flight to Barcelona?", "node-22", ["general", "travel"]),
  makeCard("Non sono riuscita a contattare il servizio clienti per telefono.", "I couldn't manage to contact customer service by phone.", "node-22", ["general", "work"]),
  makeCard("Alla fine siamo riusciti a risolvere il malinteso tra colleghi.", "In the end we managed to resolve the misunderstanding among colleagues.", "node-22", ["general", "work"], "\"Riuscire a\" differs from \"potere\": it implies effort and eventual success."),
  makeCard("Non riesco a credere che abbia detto una cosa del genere.", "I can't believe he said such a thing.", "node-22", ["general", "family"]),
  makeCard("E riuscito a finire la maratona nonostante un infortunio al ginocchio.", "He managed to finish the marathon despite a knee injury.", "node-22", ["general", "family"]),

  // Avere da + infinitive
  makeCard("Ho da fare tutto il pomeriggio; ci vediamo stasera.", "I have things to do all afternoon; see you tonight.", "node-22", ["general", "work"], "\"Avere da\" + infinitive expresses obligation or things to be done."),
  makeCard("Non ho niente da dire su questa faccenda delicata.", "I have nothing to say about this delicate matter.", "node-22", ["general", "work"]),
  makeCard("Hai qualcosa da dichiarare alla dogana per il controllo?", "Do you have anything to declare at customs for inspection?", "node-22", ["general", "travel"]),
  makeCard("Abbiamo molto da imparare dalla cultura di questo paese.", "We have much to learn from this country's culture.", "node-22", ["general", "travel"], "\"Avere da\" can imply both obligation and opportunity."),
  makeCard("Non ho nulla da rimproverarti; hai fatto del tuo meglio.", "I have nothing to reproach you for; you did your best.", "node-22", ["general", "family"]),

  // Andare + past participle (obligation/passive)
  makeCard("Questa storia va raccontata per non dimenticare il passato.", "This story must be told so as not to forget the past.", "node-22", ["general", "work"], "\"Andare\" + past participle expresses obligation (must be done)."),
  makeCard("Il modulo va compilato in ogni sua parte con attenzione.", "The form must be filled out in every part carefully.", "node-22", ["general", "work"]),
  makeCard("Queste regole vanno rispettate da tutti senza alcuna eccezione.", "These rules must be respected by everyone without any exception.", "node-22", ["general", "work"], "\"Andare\" + past participle = dovere essere + past participle (must be)."),
  makeCard("Il latte va conservato in frigorifero dopo l'apertura della bottiglia.", "The milk must be stored in the fridge after opening the bottle.", "node-22", ["general", "family"]),
  makeCard("I documenti vanno consegnati entro la fine del mese prossimo.", "The documents must be handed in by the end of next month.", "node-22", ["general", "work"]),
  makeCard("Questo vino va servito a temperatura ambiente per apprezzarlo.", "This wine should be served at room temperature to appreciate it.", "node-22", ["general", "travel"]),

  // Additional mixed perifrasi
  makeCard("Stava per scoppiare a ridere ma si e trattenuto appena.", "He was about to burst out laughing but held himself back.", "node-22", ["general", "family"]),
  makeCard("Ho ripreso a studiare dopo una lunga pausa di diversi mesi.", "I started studying again after a long break of several months.", "node-22", ["general", "work"], "\"Riprendere a\" + infinitive means to resume doing something."),
  makeCard("Tende a esagerare quando racconta le sue avventure di viaggio.", "He tends to exaggerate when he tells his travel adventures.", "node-22", ["general", "travel"], "\"Tendere a\" + infinitive means to tend to do something."),
  makeCard("Ha provato a chiamare tre volte ma la linea era occupata.", "He tried to call three times but the line was busy.", "node-22", ["general", "work"]),
  makeCard("Si sono messi d'accordo per partire all'alba di sabato prossimo.", "They agreed to leave at dawn next Saturday.", "node-22", ["general", "travel"]),
  makeCard("Ha deciso di smettere di lavorare per dedicarsi alla famiglia.", "He decided to stop working to devote himself to his family.", "node-22", ["general", "family"]),
  makeCard("Bisogna imparare a convivere con le proprie imperfezioni quotidiane.", "One must learn to live with one's own daily imperfections.", "node-22", ["general", "family"]),
  makeCard("Mi sono abituato a svegliarmi presto per andare a correre.", "I got used to waking up early to go running.", "node-22", ["general", "family"], "\"Abituarsi a\" + infinitive = to get used to doing something."),
  makeCard("Ci vuole pazienza; le cose stanno per cambiare finalmente.", "It takes patience; things are about to change finally.", "node-22", ["general", "work"]),
  makeCard("Stai attento a non cadere; il pavimento e molto scivoloso.", "Be careful not to fall; the floor is very slippery.", "node-22", ["general", "travel"]),
  makeCard("Finiranno per capire che avevi ragione tu fin dall'inizio.", "They'll end up understanding that you were right from the start.", "node-22", ["general", "family"]),
  makeCard("Sto cercando di imparare a suonare il pianoforte quest'anno.", "I'm trying to learn to play the piano this year.", "node-22", ["general", "family"]),
  makeCard("Non mi va di uscire stasera; preferisco restare a casa.", "I don't feel like going out tonight; I prefer staying home.", "node-22", ["general", "family"], "\"Non mi va di\" + infinitive = I don't feel like doing something."),
  makeCard("La questione va affrontata con serieta e determinazione adesso.", "The issue must be addressed with seriousness and determination now.", "node-22", ["general", "work"]),
  makeCard("Stanno per annunciare i risultati del concorso pubblico finalmente.", "They are about to announce the results of the public competition.", "node-22", ["general", "work"]),
  makeCard("Continuiamo a sperare che le cose migliorino presto per tutti.", "Let's keep hoping that things improve soon for everyone.", "node-22", ["general", "family"]),
];
cards.push(...node22);

// ═══════════════════════════════════════════════════════════════
// NODE 23 — Discorso indiretto (~100 cards)
// ═══════════════════════════════════════════════════════════════

const node23 = [
  // Present → imperfect
  makeCard("Ha detto che era stanco e che voleva riposarsi.", "He said he was tired and that he wanted to rest.", "node-23", ["general", "family"], "In reported speech, present tense becomes imperfect: \"sono stanco\" → \"era stanco\"."),
  makeCard("Mi ha raccontato che viveva a Roma da molti anni.", "He told me he had been living in Rome for many years.", "node-23", ["general", "travel"]),
  makeCard("Ha spiegato che non capiva il motivo di tanta urgenza.", "She explained that she didn't understand the reason for such urgency.", "node-23", ["general", "work"]),
  makeCard("Mia madre ha detto che stava bene e non preoccuparsi.", "My mother said she was fine and not to worry.", "node-23", ["general", "family"], "Present → imperfect in reported speech; imperative → infinitive."),
  makeCard("Il medico ha detto che non era niente di grave.", "The doctor said it was nothing serious.", "node-23", ["general", "family"]),
  makeCard("Marco ha detto che preferiva restare a casa quel giorno.", "Marco said he preferred to stay home that day.", "node-23", ["general", "family"]),
  makeCard("Ha confessato che si sentiva in colpa per l'accaduto.", "He confessed that he felt guilty about what happened.", "node-23", ["general", "family"]),
  makeCard("La collega ha detto che aveva troppo lavoro da sbrigare.", "The colleague said she had too much work to take care of.", "node-23", ["general", "work"]),
  makeCard("Ha ammesso che non conosceva bene le regole del gioco.", "He admitted he didn't know the rules of the game well.", "node-23", ["general", "family"]),
  makeCard("Ci ha informato che il negozio chiudeva alle sette.", "He informed us that the shop closed at seven.", "node-23", ["general", "travel"]),

  // Passato prossimo → trapassato prossimo
  makeCard("Ha detto che aveva gia mangiato prima di uscire.", "He said he had already eaten before going out.", "node-23", ["general", "family"], "Passato prossimo becomes trapassato: \"ho mangiato\" → \"aveva mangiato\"."),
  makeCard("Mi ha raccontato che aveva visitato Parigi l'anno precedente.", "She told me she had visited Paris the previous year.", "node-23", ["general", "travel"]),
  makeCard("Ha spiegato che aveva perso il treno per un solo minuto.", "He explained that he had missed the train by just one minute.", "node-23", ["general", "travel"], "In indirect speech, passato prossimo shifts to trapassato prossimo."),
  makeCard("La polizia ha confermato che aveva arrestato il sospettato la sera prima.", "The police confirmed they had arrested the suspect the night before.", "node-23", ["general", "work"]),
  makeCard("Ha detto che non aveva mai provato un piatto cosi buono.", "She said she had never tried such a good dish.", "node-23", ["general", "travel"]),
  makeCard("Mio fratello ha detto che aveva cambiato lavoro due mesi prima.", "My brother said he had changed jobs two months earlier.", "node-23", ["general", "family"]),
  makeCard("L'insegnante ha detto che non aveva corretto i compiti.", "The teacher said she hadn't graded the homework yet.", "node-23", ["general", "work"]),
  makeCard("Mi ha rivelato che si era sposato in segreto l'estate prima.", "He revealed to me that he had married in secret the previous summer.", "node-23", ["general", "family"]),

  // Future → conditional
  makeCard("Ha detto che sarebbe venuto alla festa di sabato sera.", "He said he would come to the party on Saturday night.", "node-23", ["general", "family"], "Future becomes conditional in reported speech: \"verro\" → \"sarebbe venuto\"."),
  makeCard("Mi ha promesso che avrebbe finito il lavoro entro venerdi.", "She promised me she would finish the work by Friday.", "node-23", ["general", "work"]),
  makeCard("Ha assicurato che sarebbe arrivato puntuale alla cerimonia.", "He assured that he would arrive on time for the ceremony.", "node-23", ["general", "family"], "\"Arrivero\" → \"sarebbe arrivato\" in indirect speech (future → past conditional)."),
  makeCard("La compagnia ha annunciato che avrebbe aumentato i prezzi.", "The company announced that it would increase prices.", "node-23", ["general", "work"]),
  makeCard("Mi ha giurato che non lo avrebbe fatto mai piu.", "He swore to me that he would never do it again.", "node-23", ["general", "family"]),
  makeCard("Il meteo ha previsto che avrebbe nevicato per tutta la settimana.", "The weather forecast predicted it would snow all week.", "node-23", ["general", "travel"]),
  makeCard("Ha detto che ci avrebbe ripensato e fatto sapere presto.", "She said she would think about it and let us know soon.", "node-23", ["general", "work"]),
  makeCard("Ha garantito che il pacco sarebbe arrivato entro tre giorni.", "He guaranteed that the package would arrive within three days.", "node-23", ["general", "work"]),

  // Imperative → di + infinitive / che + subjunctive
  makeCard("Mi ha detto di venire subito nel suo ufficio al piano.", "He told me to come to his office on the floor immediately.", "node-23", ["general", "work"], "Imperative in reported speech becomes \"di\" + infinitive: \"Vieni!\" → \"di venire\"."),
  makeCard("Il dottore mi ha consigliato di riposare per almeno una settimana.", "The doctor advised me to rest for at least a week.", "node-23", ["general", "family"]),
  makeCard("Mia madre mi ha pregato di non tornare troppo tardi.", "My mother begged me not to come back too late.", "node-23", ["general", "family"]),
  makeCard("Il capo ci ha ordinato di finire il rapporto per domani.", "The boss ordered us to finish the report by tomorrow.", "node-23", ["general", "work"], "\"Ha ordinato di\" + infinitive for reported commands."),
  makeCard("Mi ha suggerito di provare quel ristorante vicino al porto.", "He suggested I try that restaurant near the port.", "node-23", ["general", "travel"]),
  makeCard("Ha chiesto che tutti fossero presenti alla riunione straordinaria.", "He asked that everyone be present at the extraordinary meeting.", "node-23", ["general", "work"], "\"Ha chiesto che\" + subjunctive for polite/formal reported commands."),
  makeCard("L'insegnante ha detto agli studenti di aprire il libro a pagina dieci.", "The teacher told the students to open the book to page ten.", "node-23", ["general", "work"]),
  makeCard("Mio padre mi ha raccomandato di fare attenzione in autostrada.", "My father urged me to be careful on the highway.", "node-23", ["general", "family"]),
  makeCard("Il vigile ci ha intimato di fermarci subito al bordo della strada.", "The officer ordered us to stop immediately at the roadside.", "node-23", ["general", "travel"]),

  // Reported questions
  makeCard("Mi ha chiesto dove andassi con tutta quella fretta.", "He asked me where I was going in such a hurry.", "node-23", ["general", "work"], "In reported questions, verb shifts to imperfect (subjunctive in formal register)."),
  makeCard("Voleva sapere se avessi gia prenotato l'albergo per le vacanze.", "She wanted to know if I had already booked the hotel for vacation.", "node-23", ["general", "travel"]),
  makeCard("Mi ha domandato perche non fossi venuto alla sua festa.", "He asked me why I hadn't come to his party.", "node-23", ["general", "family"], "\"Perche\" in reported questions: \"perche non sei venuto\" → \"perche non fossi venuto\"."),
  makeCard("Ha chiesto quanto costasse il biglietto di andata e ritorno.", "She asked how much the round-trip ticket cost.", "node-23", ["general", "travel"]),
  makeCard("Mi ha chiesto se potessi aiutarlo con il trasloco sabato.", "He asked me if I could help him with the move on Saturday.", "node-23", ["general", "family"]),
  makeCard("Voleva sapere a che ora partisse il prossimo treno per Firenze.", "She wanted to know what time the next train to Florence left.", "node-23", ["general", "travel"]),
  makeCard("Mi ha chiesto chi avesse lasciato la porta dell'ufficio aperta.", "He asked me who had left the office door open.", "node-23", ["general", "work"]),
  makeCard("Ha domandato se fossimo soddisfatti del servizio ricevuto finora.", "He asked if we were satisfied with the service received so far.", "node-23", ["general", "travel"]),

  // Pronoun/time shifts
  makeCard("Ha detto: 'Vengo domani.' Ha detto che sarebbe venuto il giorno dopo.", "He said: 'I'm coming tomorrow.' He said he would come the next day.", "node-23", ["general", "work"], "Time shifts: domani → il giorno dopo, ieri → il giorno prima, oggi → quel giorno."),
  makeCard("Ha detto: 'Qui si mangia bene.' Ha detto che li si mangiava bene.", "She said: 'The food is good here.' She said the food was good there.", "node-23", ["general", "travel"], "Space shifts: qui → li/la, questo → quello."),
  makeCard("Ha risposto: 'L'ho fatto ieri.' Ha risposto che l'aveva fatto il giorno prima.", "He replied: 'I did it yesterday.' He replied he had done it the day before.", "node-23", ["general", "work"]),
  makeCard("Maria ha detto: 'Il mio capo mi ha promosso oggi.'", "Maria said: 'My boss promoted me today.'", "node-23", ["general", "work"]),
  makeCard("Maria ha detto che il suo capo l'aveva promossa quel giorno.", "Maria said that her boss had promoted her that day.", "node-23", ["general", "work"], "Pronoun shift: il mio → il suo; oggi → quel giorno."),
  makeCard("Ha esclamato: 'Non ce la faccio piu!' Ha esclamato che non ce la faceva piu.", "He exclaimed: 'I can't take it anymore!' He exclaimed he couldn't take it anymore.", "node-23", ["general", "family"]),

  // Complex chains
  makeCard("Mi ha riferito che il direttore aveva detto che il progetto andava bene.", "He reported that the director had said the project was going well.", "node-23", ["general", "work"], "Chains of reported speech require careful sequence of tenses across multiple levels."),
  makeCard("Ha raccontato che sua moglie gli aveva chiesto di non partire.", "He told that his wife had asked him not to leave.", "node-23", ["general", "family"]),
  makeCard("Il giornale riportava che il sindaco aveva annunciato nuove misure.", "The newspaper reported that the mayor had announced new measures.", "node-23", ["general", "work"]),
  makeCard("Mi ha informato che i colleghi avevano deciso di scioperare.", "He informed me that the colleagues had decided to go on strike.", "node-23", ["general", "work"]),
  makeCard("Ha raccontato che i suoi genitori gli avevano detto di stare attento.", "He said his parents had told him to be careful.", "node-23", ["general", "family"]),
  makeCard("L'agenzia ha comunicato che il volo era stato cancellato per maltempo.", "The agency communicated that the flight had been cancelled due to bad weather.", "node-23", ["general", "travel"]),
  makeCard("Ha spiegato che non aveva potuto venire perche era malato.", "He explained that he hadn't been able to come because he was sick.", "node-23", ["general", "family"]),
  makeCard("Il testimone ha dichiarato che aveva visto l'incidente dalla finestra.", "The witness stated that he had seen the accident from the window.", "node-23", ["general", "work"]),
  makeCard("Mi ha scritto che sarebbe tornato non appena avesse finito.", "He wrote me that he would return as soon as he had finished.", "node-23", ["general", "work"], "\"Non appena\" + pluperfect subjunctive in subordinate clause of reported speech."),
  makeCard("Ci ha fatto sapere che avrebbe chiamato quando fosse arrivato.", "He let us know he would call when he had arrived.", "node-23", ["general", "travel"]),

  // Additional reported speech patterns
  makeCard("Mi ha assicurato che tutto sarebbe andato per il meglio.", "He assured me that everything would go well.", "node-23", ["general", "family"]),
  makeCard("Ha affermato con sicurezza che il problema era stato risolto.", "He stated with certainty that the problem had been solved.", "node-23", ["general", "work"]),
  makeCard("La guida ci ha spiegato che il castello risaliva al Medioevo.", "The guide explained to us that the castle dated back to the Middle Ages.", "node-23", ["general", "travel"]),
  makeCard("Mi ha confidato che non era felice del suo matrimonio attuale.", "She confided in me that she wasn't happy in her current marriage.", "node-23", ["general", "family"]),
  makeCard("Ha ripetuto piu volte che non avrebbe cambiato la sua decisione.", "He repeated several times that he would not change his decision.", "node-23", ["general", "work"]),
  makeCard("Mi ha avvertito che la strada era pericolosa di notte.", "He warned me that the road was dangerous at night.", "node-23", ["general", "travel"]),
  makeCard("Il professore ha precisato che l'esame non sarebbe stato facile.", "The professor specified that the exam would not be easy.", "node-23", ["general", "work"]),
  makeCard("Mia nonna raccontava sempre che da giovane lavorava nei campi.", "My grandmother always told that when she was young she worked in the fields.", "node-23", ["general", "family"]),
  makeCard("L'impiegato ha risposto che non era di sua competenza la questione.", "The clerk replied that the matter was not within his competence.", "node-23", ["general", "work"]),
  makeCard("Ha mormorato che avrebbe preferito non essere coinvolto nella faccenda.", "He murmured that he would have preferred not to be involved in the matter.", "node-23", ["general", "work"]),
  makeCard("Il portiere ha avvisato che l'ascensore era fuori servizio da ieri.", "The doorman warned that the elevator had been out of service since yesterday.", "node-23", ["general", "travel"]),
  makeCard("Mi ha rimproverato di non averla avvisata del cambiamento di programma.", "She reproached me for not having informed her of the schedule change.", "node-23", ["general", "work"], "\"Rimproverare di\" + infinitive for reported reproach."),
  makeCard("Ha sostenuto che la sua versione dei fatti fosse quella corretta.", "He maintained that his version of the events was the correct one.", "node-23", ["general", "work"]),
  makeCard("Mi ha supplicato di non dirlo a nessuno della famiglia.", "She begged me not to tell anyone in the family.", "node-23", ["general", "family"]),
  makeCard("Ha aggiunto che sarebbe passato a trovarci nel fine settimana.", "He added that he would come by to visit us over the weekend.", "node-23", ["general", "family"]),
  makeCard("Ci ha rassicurato dicendo che non c'era motivo di preoccuparsi.", "He reassured us by saying there was no reason to worry.", "node-23", ["general", "family"]),
  makeCard("Ha specificato che la consegna sarebbe avvenuta entro tre giorni lavorativi.", "She specified that the delivery would take place within three business days.", "node-23", ["general", "work"]),
  makeCard("Mi ha chiesto se per caso conoscessi un buon ristorante in zona.", "He asked me if by any chance I knew a good restaurant in the area.", "node-23", ["general", "travel"]),
  makeCard("Ha dichiarato che non avrebbe piu tollerato comportamenti simili in ufficio.", "He declared he would no longer tolerate such behavior in the office.", "node-23", ["general", "work"]),
];
cards.push(...node23);

// ═══════════════════════════════════════════════════════════════
// NODE 24 — Registro & stile (~100 cards)
// ═══════════════════════════════════════════════════════════════

const node24 = [
  // Passato remoto
  makeCard("Quando arrivo alla stazione, il treno era gia partito.", "When he arrived at the station, the train had already left.", "node-24", ["general", "travel"], "Passato remoto (arrivo) is standard in literary and southern Italian narrative."),
  makeCard("Dante nacque a Firenze nel milleduecentosessantacinque.", "Dante was born in Florence in 1265.", "node-24", ["general", "travel"]),
  makeCard("Dissi la verita e nessuno mi credette in quel momento.", "I told the truth and nobody believed me at that moment.", "node-24", ["general", "family"], "Irregular passato remoto: dire → dissi, credere → credette."),
  makeCard("Fu una giornata che non dimenticammo mai per tutta la vita.", "It was a day we never forgot for our entire lives.", "node-24", ["general", "family"]),
  makeCard("Parti all'alba e non fece mai piu ritorno a casa.", "He left at dawn and never came back home again.", "node-24", ["general", "family"], "Irregular forms: partire → parti, fare → fece."),
  makeCard("Vissi a lungo all'estero prima di tornare in Italia.", "I lived abroad for a long time before returning to Italy.", "node-24", ["general", "travel"], "\"Vissi\" is the passato remoto of \"vivere\" (to live)."),
  makeCard("Ebbe il coraggio di affrontare il problema da solo quella volta.", "He had the courage to face the problem alone that time.", "node-24", ["general", "work"]),
  makeCard("Presero una decisione difficile che cambio il corso degli eventi.", "They made a difficult decision that changed the course of events.", "node-24", ["general", "work"]),
  makeCard("Scrisse una lettera commovente che fece piangere tutti i presenti.", "He wrote a moving letter that made everyone present cry.", "node-24", ["general", "family"], "Irregular passato remoto: scrivere → scrisse, fare → fece."),
  makeCard("Quando lo vide, corse ad abbracciarlo con grande gioia.", "When she saw him, she ran to hug him with great joy.", "node-24", ["general", "family"]),
  makeCard("L'esercito attraverso il fiume durante la notte senza essere scoperto.", "The army crossed the river during the night without being discovered.", "node-24", ["general", "work"]),
  makeCard("Mori in solitudine, lontano dalla terra che aveva tanto amato.", "He died in solitude, far from the land he had loved so much.", "node-24", ["general", "family"]),

  // Passato remoto in narrative
  makeCard("Quando entro nella stanza, vide che tutto era cambiato.", "When he entered the room, he saw that everything had changed.", "node-24", ["general", "family"]),
  makeCard("Si alzo in piedi, guardo l'assemblea e comincio a parlare.", "He stood up, looked at the assembly, and began to speak.", "node-24", ["general", "work"], "Narrative chains use passato remoto for sequential actions in formal writing."),
  makeCard("Ando alla finestra, apri le imposte e respiro l'aria fresca.", "She went to the window, opened the shutters, and breathed the fresh air.", "node-24", ["general", "family"]),
  makeCard("Prese il cappotto, saluto tutti e usci senza dire una parola.", "He grabbed his coat, greeted everyone, and left without saying a word.", "node-24", ["general", "work"]),

  // Future of probability
  makeCard("Sara stato mezzanotte quando finalmente siamo rientrati a casa.", "It must have been midnight when we finally got back home.", "node-24", ["general", "family"], "Future perfect of probability: \"sara stato\" = it must have been."),
  makeCard("Avra avuto una quarantina d'anni, non di piu a occhio.", "He must have been about forty years old, no more at a guess.", "node-24", ["general", "family"]),
  makeCard("Saranno le tre del pomeriggio; il sole e ancora alto.", "It must be about three in the afternoon; the sun is still high.", "node-24", ["general", "travel"], "Simple future of probability: \"saranno\" = they must be (conjecture)."),
  makeCard("Ci saranno state almeno duecento persone alla conferenza ieri.", "There must have been at least two hundred people at the conference yesterday.", "node-24", ["general", "work"]),
  makeCard("Avra dimenticato di avvisarci; non e da lui comportarsi cosi.", "He must have forgotten to notify us; it's not like him to behave this way.", "node-24", ["general", "work"]),
  makeCard("Sara costato una fortuna quel quadro appeso alla parete.", "That painting hanging on the wall must have cost a fortune.", "node-24", ["general", "travel"]),
  makeCard("Avranno perso il treno; ecco perche non sono ancora arrivati.", "They must have missed the train; that's why they haven't arrived yet.", "node-24", ["general", "travel"]),

  // Academic markers
  makeCard("Si evince che il fenomeno e in costante crescita da anni.", "It is evident that the phenomenon has been constantly growing for years.", "node-24", ["general", "work"], "\"Si evince che\" is an academic/formal marker meaning \"it is evident that\"."),
  makeCard("E stato dimostrato che l'esercizio fisico migliora l'umore.", "It has been demonstrated that physical exercise improves mood.", "node-24", ["general", "work"]),
  makeCard("Vale la pena sottolineare l'importanza di questo risultato scientifico.", "It is worth emphasizing the importance of this scientific result.", "node-24", ["general", "work"], "\"Vale la pena sottolineare\" is a formal hedging expression in academic writing."),
  makeCard("Da quanto emerge dai dati, la tendenza e chiaramente positiva.", "From what emerges from the data, the trend is clearly positive.", "node-24", ["general", "work"]),
  makeCard("Come si puo notare dalla tabella, i costi sono aumentati.", "As can be noted from the table, costs have increased.", "node-24", ["general", "work"]),
  makeCard("E opportuno precisare che i risultati sono ancora preliminari.", "It is appropriate to specify that the results are still preliminary.", "node-24", ["general", "work"], "\"E opportuno precisare\" is a formal hedging expression."),
  makeCard("In conclusione, si puo affermare che la tesi e confermata.", "In conclusion, it can be stated that the thesis is confirmed.", "node-24", ["general", "work"]),
  makeCard("Ne consegue che le misure adottate non sono state sufficienti.", "It follows that the measures adopted were not sufficient.", "node-24", ["general", "work"]),
  makeCard("Come gia accennato, il problema richiede un approccio multidisciplinare.", "As already mentioned, the problem requires a multidisciplinary approach.", "node-24", ["general", "work"]),
  makeCard("Occorre inoltre considerare l'impatto ambientale delle nuove politiche.", "It is also necessary to consider the environmental impact of the new policies.", "node-24", ["general", "work"], "\"Occorre\" (it is necessary) is more formal than \"bisogna\"."),

  // Formal correspondence
  makeCard("La prego di voler cortesemente confermare la Sua disponibilita.", "I kindly ask you to confirm your availability.", "node-24", ["general", "work"], "\"La prego di\" is a highly formal request formula using the Lei register."),
  makeCard("Mi permetta di esprimere il mio piu sincero apprezzamento.", "Allow me to express my most sincere appreciation.", "node-24", ["general", "work"]),
  makeCard("In riferimento alla Sua richiesta del quindici marzo scorso.", "With reference to your request of March fifteenth.", "node-24", ["general", "work"], "\"In riferimento a\" is standard opening for formal letters."),
  makeCard("Restiamo a Sua completa disposizione per qualsiasi chiarimento necessario.", "We remain at your complete disposal for any necessary clarification.", "node-24", ["general", "work"]),
  makeCard("Con la presente si comunica che la domanda e stata accolta.", "We hereby communicate that the application has been accepted.", "node-24", ["general", "work"], "\"Con la presente\" is a highly formal opening for official communications."),
  makeCard("Distinti saluti e cordiali auguri per il nuovo incarico.", "Kind regards and warm wishes for the new position.", "node-24", ["general", "work"]),
  makeCard("Vorrei sottoporre alla Sua attenzione una questione di grande rilievo.", "I would like to bring to your attention a matter of great importance.", "node-24", ["general", "work"]),
  makeCard("La ringrazio anticipatamente per la cortese collaborazione offerta.", "I thank you in advance for the kind collaboration offered.", "node-24", ["general", "work"]),
  makeCard("In attesa di un Suo cortese riscontro, porgo cordiali saluti.", "Awaiting your kind reply, I send cordial regards.", "node-24", ["general", "work"], "Standard formal letter closing in Italian business correspondence."),

  // Lei vs tu register shifts
  makeCard("Mi scusi, potrebbe indicarmi dove si trova la stazione centrale?", "Excuse me, could you tell me where the central station is?", "node-24", ["general", "travel"]),
  makeCard("Scusa, sai dove si trova la stazione centrale qui vicino?", "Sorry, do you know where the central station is near here?", "node-24", ["general", "travel"], "\"Scusa\" (tu) vs \"Mi scusi\" (Lei) marks the formality register shift."),
  makeCard("Le sarei grato se potesse inviarmi la documentazione completa.", "I would be grateful if you could send me the complete documentation.", "node-24", ["general", "work"]),
  makeCard("Mi farebbe un grande favore se mi aiutasse con questo.", "You would do me a great favor if you helped me with this.", "node-24", ["general", "work"]),
  makeCard("Le chiedo scusa per il ritardo; il traffico era impossibile.", "I apologize for the delay; the traffic was impossible.", "node-24", ["general", "work"]),
  makeCard("Potrebbe ripetere per cortesia? Non ho sentito bene.", "Could you repeat, please? I didn't hear well.", "node-24", ["general", "travel"]),
  makeCard("Desidera altro oppure posso portarLe il conto adesso?", "Would you like anything else or may I bring you the bill now?", "node-24", ["general", "travel"]),

  // Subjunctive in formal speech
  makeCard("Ritenga pure che la proposta sia stata valutata con cura.", "Rest assured that the proposal has been evaluated with care.", "node-24", ["general", "work"]),
  makeCard("Ritengo che sia necessario un incontro per discuterne a fondo.", "I believe a meeting is necessary to discuss it in depth.", "node-24", ["general", "work"], "\"Ritengo che\" + subjunctive is formal for \"I believe that\"."),
  makeCard("Mi auguro che la collaborazione possa proseguire con reciproca soddisfazione.", "I hope the collaboration can continue with mutual satisfaction.", "node-24", ["general", "work"]),
  makeCard("E auspicabile che si trovino soluzioni condivise al piu presto.", "It is desirable that shared solutions be found as soon as possible.", "node-24", ["general", "work"], "\"E auspicabile che\" is formal academic/political register."),
  makeCard("Si prega di non disturbare durante l'orario delle lezioni.", "Please do not disturb during class hours.", "node-24", ["general", "work"]),

  // Additional register & style
  makeCard("Si rammenti che il termine ultimo per l'iscrizione e il trenta.", "Please remember that the deadline for registration is the thirtieth.", "node-24", ["general", "work"], "\"Si rammenti\" (formal imperative) is literary for \"remember\"."),
  makeCard("L'onorevole ha dichiarato che si procedera con le riforme annunciate.", "The Honorable Member declared that they would proceed with the announced reforms.", "node-24", ["general", "work"]),
  makeCard("La ditta ha comunicato che i lavori sarebbero terminati entro giugno.", "The company communicated that the works would be completed by June.", "node-24", ["general", "work"]),
  makeCard("A quanto pare, la situazione e piu complessa del previsto.", "Apparently, the situation is more complex than expected.", "node-24", ["general", "work"]),
  makeCard("In virtu di quanto sopra esposto, si chiede un intervento urgente.", "By virtue of the foregoing, an urgent intervention is requested.", "node-24", ["general", "work"], "\"In virtu di\" is a highly formal prepositional phrase."),
  makeCard("Come noto, il problema risale a diversi decenni addietro.", "As is well known, the problem dates back several decades.", "node-24", ["general", "work"]),
  makeCard("Il suddetto articolo prevede sanzioni per chi non rispetta le norme.", "The aforementioned article provides penalties for those who don't comply.", "node-24", ["general", "work"]),
  makeCard("La famiglia reale partecipo alla cerimonia con grande solennita.", "The royal family participated in the ceremony with great solemnity.", "node-24", ["general", "family"]),
  makeCard("Codesto comportamento non e degno di un professionista serio.", "Such behavior is not worthy of a serious professional.", "node-24", ["general", "work"], "\"Codesto\" (that near you) is archaic/Tuscan, used in formal/legal language."),
  makeCard("Qualora lo ritenesse opportuno, potra contattarci in qualsiasi momento.", "Should you deem it appropriate, you may contact us at any time.", "node-24", ["general", "work"], "\"Qualora\" (should/if) is formal and takes subjunctive."),
  makeCard("L'autore analizza con acume le contraddizioni della societa moderna.", "The author analyzes with acumen the contradictions of modern society.", "node-24", ["general", "work"]),
  makeCard("Si auspica che il dialogo tra le parti riprenda quanto prima.", "It is hoped that the dialogue between the parties will resume as soon as possible.", "node-24", ["general", "work"]),
  makeCard("Alla luce dei fatti, la posizione del governo appare indifendibile.", "In light of the facts, the government's position appears indefensible.", "node-24", ["general", "work"]),
  makeCard("Il relatore ha concluso il suo intervento con una citazione dantesca.", "The speaker concluded his speech with a Dante quotation.", "node-24", ["general", "work"]),
  makeCard("Egregi signori, con la presente desidero portare alla Vostra attenzione.", "Dear Sirs, I hereby wish to bring to your attention.", "node-24", ["general", "work"], "\"Egregi signori\" is the most formal salutation in Italian correspondence."),
  makeCard("In merito alla questione sollevata, si forniscono le seguenti precisazioni.", "Regarding the issue raised, the following clarifications are provided.", "node-24", ["general", "work"]),
];
cards.push(...node24);

// ═══════════════════════════════════════════════════════════════
// NODE 25 — Espressioni idiomatiche (~100 cards)
// ═══════════════════════════════════════════════════════════════

const node25 = [
  // Common idioms
  makeCard("Non vedo l'ora di partire per le vacanze estive!", "I can't wait to leave for the summer holidays!", "node-25", ["general", "travel"], "\"Non vedo l'ora di\" literally means \"I can't see the hour of\" — I can't wait."),
  makeCard("In bocca al lupo per l'esame di domani mattina!", "Good luck for tomorrow morning's exam!", "node-25", ["general", "work"], "\"In bocca al lupo\" (into the wolf's mouth) = good luck. Reply: \"Crepi!\""),
  makeCard("Acqua in bocca! Non dire niente a nessuno di questa cosa.", "Keep it a secret! Don't say anything to anyone about this.", "node-25", ["general", "family"]),
  makeCard("Non c'e due senza tre; vedrai che avrai un'altra occasione.", "There's no two without three; you'll see you'll get another chance.", "node-25", ["general", "work"], "\"Non c'e due senza tre\" = things come in threes (good or bad)."),
  makeCard("Chi la fa l'aspetti; prima o poi paghera le conseguenze.", "What goes around comes around; sooner or later he'll pay the consequences.", "node-25", ["general", "family"]),
  makeCard("Piove sul bagnato: dopo aver perso il lavoro, gli hanno rubato la macchina.", "When it rains, it pours: after losing his job, his car was stolen.", "node-25", ["general", "work"], "\"Piove sul bagnato\" = bad things pile up (it rains on the wet)."),
  makeCard("Non tutte le ciambelle riescono col buco, si sa.", "Not everything turns out as planned, as we know.", "node-25", ["general", "work"]),
  makeCard("Ha fatto di necessita virtu e ha trovato una soluzione creativa.", "He made a virtue of necessity and found a creative solution.", "node-25", ["general", "work"]),
  makeCard("Tra moglie e marito non mettere il dito; non sono affari tuoi.", "Don't interfere between husband and wife; it's not your business.", "node-25", ["general", "family"], "Proverb warning against meddling in couples' affairs."),
  makeCard("Chi fa da se fa per tre; meglio arrangiarsi da soli.", "If you want something done right, do it yourself; better to manage alone.", "node-25", ["general", "work"]),

  // Fixed expressions
  makeCard("Questo film non mi va a genio; preferirei vedere altro.", "This film doesn't suit me; I'd prefer to see something else.", "node-25", ["general", "family"], "\"Andare a genio\" = to be to one's liking, to suit someone."),
  makeCard("Quel rumore continuo mi da molto fastidio quando lavoro.", "That continuous noise bothers me a lot when I work.", "node-25", ["general", "work"]),
  makeCard("Non posso fare a meno di pensare a quello che hai detto.", "I can't help thinking about what you said.", "node-25", ["general", "family"], "\"Fare a meno di\" = to do without, to help doing."),
  makeCard("Smettila di prendermi in giro; sto parlando seriamente adesso.", "Stop making fun of me; I'm speaking seriously now.", "node-25", ["general", "family"]),
  makeCard("Non ho voglia di uscire stasera; sono troppo stanco.", "I don't feel like going out tonight; I'm too tired.", "node-25", ["general", "family"], "\"Avere voglia di\" = to feel like doing something."),
  makeCard("Mi sono fatto in quattro per organizzare questa festa di compleanno.", "I bent over backwards to organize this birthday party.", "node-25", ["general", "family"], "\"Farsi in quattro\" = to go out of one's way, to bend over backwards."),
  makeCard("Alla fine ha dato buca e non si e presentato all'appuntamento.", "In the end he stood us up and didn't show up for the appointment.", "node-25", ["general", "family"]),
  makeCard("Mi ha tenuto sulla corda per settimane prima di dare una risposta.", "He kept me in suspense for weeks before giving an answer.", "node-25", ["general", "work"], "\"Tenere sulla corda\" = to keep someone in suspense."),
  makeCard("Ha gettato la spugna dopo mesi di tentativi senza risultati.", "He threw in the towel after months of unsuccessful attempts.", "node-25", ["general", "work"]),
  makeCard("Ci siamo trovati con l'acqua alla gola per colpa dei debiti.", "We found ourselves in dire straits because of debts.", "node-25", ["general", "work"], "\"Avere l'acqua alla gola\" = to be in dire straits, desperate situation."),
  makeCard("Vuole sempre avere l'ultima parola in ogni discussione familiare.", "He always wants to have the last word in every family discussion.", "node-25", ["general", "family"]),
  makeCard("Mi ha messo i bastoni tra le ruote fin dall'inizio del progetto.", "He put obstacles in my way from the beginning of the project.", "node-25", ["general", "work"], "\"Mettere i bastoni tra le ruote\" = to put a spoke in someone's wheel."),
  makeCard("Non perdere il filo del discorso; stavamo parlando di altro.", "Don't lose the thread of the conversation; we were talking about something else.", "node-25", ["general", "work"]),
  makeCard("Ha preso due piccioni con una fava risolvendo entrambi i problemi.", "He killed two birds with one stone by solving both problems.", "node-25", ["general", "work"], "\"Prendere due piccioni con una fava\" = to kill two birds with one stone."),
  makeCard("Sta facendo le cose alla carlona; non e per niente preciso.", "He's doing things sloppily; he's not precise at all.", "node-25", ["general", "work"]),
  makeCard("Non mi va giu che non abbia nemmeno chiesto scusa.", "I can't accept that he didn't even apologize.", "node-25", ["general", "family"], "\"Non mi va giu\" = I can't stomach it, I can't accept it."),

  // Colloquial
  makeCard("Figurati! Non devi ringraziarmi per una cosa cosi piccola.", "Don't mention it! You don't need to thank me for such a small thing.", "node-25", ["general", "family"], "\"Figurati\" (informal) / \"Si figuri\" (formal) = don't mention it, no problem."),
  makeCard("Meno male che sei arrivato in tempo per la partenza!", "Thank goodness you arrived in time for the departure!", "node-25", ["general", "travel"], "\"Meno male\" = thank goodness, luckily."),
  makeCard("Magari potessi permettermi una vacanza ai Caraibi quest'anno!", "If only I could afford a vacation in the Caribbean this year!", "node-25", ["general", "travel"]),
  makeCard("Mica male questo vino; dove l'hai comprato esattamente?", "Not bad at all, this wine; where did you buy it exactly?", "node-25", ["general", "family"], "\"Mica male\" = not bad at all (colloquial, positive understatement)."),
  makeCard("Che barba questa riunione! Non finisce mai di parlare.", "What a bore, this meeting! He never stops talking.", "node-25", ["general", "work"], "\"Che barba\" = what a bore (colloquial expression of frustration)."),
  makeCard("Che ne so io! Chiedi a qualcun altro per favore.", "How should I know! Ask someone else please.", "node-25", ["general", "family"]),
  makeCard("Per carita, non parlarne piu; e un argomento delicato.", "For goodness' sake, don't talk about it anymore; it's a delicate topic.", "node-25", ["general", "family"]),
  makeCard("Ci mancherebbe altro! E il minimo che potessi fare.", "Of course! It's the least I could do.", "node-25", ["general", "family"], "\"Ci mancherebbe altro\" = of course, it goes without saying."),
  makeCard("Macche vacanza! Quest'anno dobbiamo risparmiare su tutto.", "Vacation, my foot! This year we have to save on everything.", "node-25", ["general", "family"], "\"Macche\" = expresses strong denial or contradiction."),
  makeCard("Boh, non saprei dirti; chiedi a chi se ne intende.", "I dunno, I couldn't tell you; ask someone who knows about it.", "node-25", ["general", "work"]),

  // Proverbs
  makeCard("Chi dorme non piglia pesci; svegliati e datti da fare.", "The early bird catches the worm; wake up and get to work.", "node-25", ["general", "work"], "\"Chi dorme non piglia pesci\" literally: who sleeps doesn't catch fish."),
  makeCard("Tra il dire e il fare c'e di mezzo il mare.", "There's a big gap between saying and doing.", "node-25", ["general", "work"], "Proverb: between saying and doing, there's an ocean in the middle."),
  makeCard("L'appetito vien mangiando; piu studio e piu voglio imparare.", "Appetite comes with eating; the more I study, the more I want to learn.", "node-25", ["general", "work"]),
  makeCard("Chi troppo vuole nulla stringe; impara ad accontentarti.", "He who wants too much gets nothing; learn to be content.", "node-25", ["general", "family"]),
  makeCard("Il mattino ha l'oro in bocca; alzati presto domani.", "The early morning has gold in its mouth; get up early tomorrow.", "node-25", ["general", "work"], "\"Il mattino ha l'oro in bocca\" = the morning hours are precious."),
  makeCard("Meglio tardi che mai; l'importante e aver cominciato.", "Better late than never; the important thing is to have started.", "node-25", ["general", "work"]),
  makeCard("Chi va piano va sano e va lontano nella vita.", "Slow and steady wins the race in life.", "node-25", ["general", "family"], "\"Chi va piano va sano e va lontano\" = who goes slowly goes safely and far."),
  makeCard("L'abito non fa il monaco; non giudicare dalle apparenze.", "Clothes don't make the man; don't judge by appearances.", "node-25", ["general", "family"]),
  makeCard("A caval donato non si guarda in bocca, si sa.", "Don't look a gift horse in the mouth, as they say.", "node-25", ["general", "family"]),
  makeCard("Sbagliando si impara; non aver paura di fare errori.", "You learn by making mistakes; don't be afraid to make errors.", "node-25", ["general", "work"]),
  makeCard("Paese che vai, usanza che trovi; rispetta le tradizioni locali.", "When in Rome, do as the Romans do; respect local traditions.", "node-25", ["general", "travel"], "\"Paese che vai, usanza che trovi\" = each country has its customs."),
  makeCard("Chi trova un amico trova un tesoro; sii grato.", "He who finds a friend finds a treasure; be grateful.", "node-25", ["general", "family"]),

  // Additional idiomatic expressions
  makeCard("Ha fatto un buco nell'acqua con quel progetto ambizioso.", "That ambitious project was a complete flop.", "node-25", ["general", "work"], "\"Fare un buco nell'acqua\" = to fail completely, to achieve nothing."),
  makeCard("Sta sempre a fare il furbetto ma poi viene scoperto.", "He's always trying to be clever but then he gets caught.", "node-25", ["general", "work"]),
  makeCard("Non ha peli sulla lingua; dice sempre quello che pensa.", "She doesn't mince words; she always says what she thinks.", "node-25", ["general", "family"], "\"Non avere peli sulla lingua\" = to not mince words, to be blunt."),
  makeCard("Costa un occhio della testa quel ristorante in centro.", "That restaurant downtown costs an arm and a leg.", "node-25", ["general", "travel"]),
  makeCard("Sono al verde questo mese; non posso permettermi spese extra.", "I'm broke this month; I can't afford extra expenses.", "node-25", ["general", "family"], "\"Essere al verde\" = to be broke, to have no money."),
  makeCard("Ha chiuso un occhio sul ritardo perche capiva la situazione.", "He turned a blind eye to the delay because he understood the situation.", "node-25", ["general", "work"]),
  makeCard("Ha toccato ferro quando ha sentito quella brutta notizia.", "He touched wood when he heard that bad news.", "node-25", ["general", "family"], "\"Toccare ferro\" = to touch iron/wood (Italian superstition for warding off bad luck)."),
  makeCard("Stai con i piedi per terra e smetti di sognare.", "Keep your feet on the ground and stop dreaming.", "node-25", ["general", "family"]),
  makeCard("Mi sono rotto le scatole di aspettare senza avere notizie.", "I'm fed up with waiting without any news.", "node-25", ["general", "work"], "\"Rompersi le scatole\" = to get fed up (colloquial)."),
  makeCard("Ha dato filo da torcere a tutti gli avversari.", "He gave all his opponents a hard time.", "node-25", ["general", "work"]),
  makeCard("Non fare il passo piu lungo della gamba con le spese.", "Don't bite off more than you can chew with expenses.", "node-25", ["general", "family"], "\"Fare il passo piu lungo della gamba\" = to overextend oneself."),
  makeCard("E andato a farsi benedire tutto il nostro piano originale.", "Our entire original plan went down the drain.", "node-25", ["general", "work"]),
  makeCard("Dormi tra due guanciali; la situazione e sotto controllo.", "Sleep easy; the situation is under control.", "node-25", ["general", "family"], "\"Dormire tra due guanciali\" = to sleep easy, to have no worries."),
  makeCard("Ha fatto orecchie da mercante e ha ignorato tutti i consigli.", "He turned a deaf ear and ignored all the advice.", "node-25", ["general", "work"]),
  makeCard("Sono rimasto di stucco quando ho saputo la notizia.", "I was flabbergasted when I heard the news.", "node-25", ["general", "family"], "\"Rimanere di stucco\" = to be flabbergasted, stunned."),
  makeCard("Non piangere sul latte versato; guarda avanti con fiducia.", "Don't cry over spilt milk; look ahead with confidence.", "node-25", ["general", "family"]),
  makeCard("Quando il gatto non c'e, i topi ballano in ufficio.", "When the cat's away, the mice will play in the office.", "node-25", ["general", "work"]),
  makeCard("Ha scoperto l'acqua calda con quella sua grande rivelazione.", "He discovered something obvious with that great revelation of his.", "node-25", ["general", "work"], "\"Scoprire l'acqua calda\" = to state the obvious."),
  makeCard("Calma e gesso; affrontiamo il problema un passo alla volta.", "Easy does it; let's face the problem one step at a time.", "node-25", ["general", "work"]),
  makeCard("Ride bene chi ride ultimo; aspetta di vedere come finisce.", "He who laughs last laughs best; wait to see how it ends.", "node-25", ["general", "family"]),
];
cards.push(...node25);

// ═══════════════════════════════════════════════════════════════
// NODE 26 — Sintassi complessa (~100 cards)
// ═══════════════════════════════════════════════════════════════

const node26 = [
  // Participial clauses
  makeCard("Arrivato a casa, si e messo subito a cucinare la cena.", "Having arrived home, he immediately started cooking dinner.", "node-26", ["general", "family"], "Past participle clause (participio passato) replaces a temporal subordinate clause."),
  makeCard("Finita la riunione, tutti sono tornati alle proprie scrivanie.", "Once the meeting was over, everyone went back to their desks.", "node-26", ["general", "work"]),
  makeCard("Letta la lettera, ha capito finalmente la gravita della situazione.", "Having read the letter, he finally understood the gravity of the situation.", "node-26", ["general", "work"], "\"Letta la lettera\" = avendo letto la lettera (implicit subject must match main clause)."),
  makeCard("Svegliata dal rumore, si e affacciata alla finestra per guardare.", "Woken by the noise, she went to the window to look.", "node-26", ["general", "family"]),
  makeCard("Tornati dall'estero, hanno deciso di trasferirsi in campagna.", "Having returned from abroad, they decided to move to the countryside.", "node-26", ["general", "travel"]),
  makeCard("Risolto il problema tecnico, il sito ha ripreso a funzionare.", "Once the technical problem was solved, the site started working again.", "node-26", ["general", "work"]),
  makeCard("Salutati gli ospiti, abbiamo finalmente potuto rilassarci un poco.", "Having said goodbye to the guests, we were finally able to relax a bit.", "node-26", ["general", "family"]),
  makeCard("Superato l'esame, si e concesso una vacanza ben meritata.", "Having passed the exam, he treated himself to a well-deserved vacation.", "node-26", ["general", "travel"]),

  // Gerund clauses
  makeCard("Essendo stanco, ha deciso di rimandare il lavoro a domani.", "Being tired, he decided to postpone the work until tomorrow.", "node-26", ["general", "work"], "Gerund clause (essendo + adjective/past participle) for causal subordination."),
  makeCard("Camminando lungo il fiume, abbiamo scoperto un piccolo villaggio.", "Walking along the river, we discovered a small village.", "node-26", ["general", "travel"]),
  makeCard("Non avendo ricevuto risposta, ho deciso di chiamare direttamente.", "Not having received a reply, I decided to call directly.", "node-26", ["general", "work"], "Compound gerund (avendo + past participle) for completed prior action."),
  makeCard("Studiando con costanza, si possono raggiungere risultati eccellenti.", "By studying consistently, one can achieve excellent results.", "node-26", ["general", "work"]),
  makeCard("Pur sapendo la verita, ha preferito non dire nulla.", "Despite knowing the truth, he preferred not to say anything.", "node-26", ["general", "family"], "\"Pur\" + gerund = although/despite doing something (concessive gerund)."),
  makeCard("Essendo cresciuto all'estero, parla tre lingue correntemente.", "Having grown up abroad, he speaks three languages fluently.", "node-26", ["general", "travel"]),
  makeCard("Avendo finito in anticipo, siamo andati a fare una passeggiata.", "Having finished early, we went for a walk.", "node-26", ["general", "family"]),
  makeCard("Lavorando da casa, risparmio almeno due ore di tragitto al giorno.", "Working from home, I save at least two hours of commute per day.", "node-26", ["general", "work"]),
  makeCard("Pur non essendo d'accordo, ha accettato la decisione del gruppo.", "Although he didn't agree, he accepted the group's decision.", "node-26", ["general", "work"]),

  // Multiple subordination
  makeCard("Credo che, nonostante le difficolta, riusciremo a completare il progetto.", "I believe that, despite the difficulties, we will manage to complete the project.", "node-26", ["general", "work"], "Multiple subordination: main clause + embedded concessive + complement clause."),
  makeCard("Penso che, se tutti collaborano, potremo ottenere risultati straordinari.", "I think that, if everyone collaborates, we can achieve extraordinary results.", "node-26", ["general", "work"]),
  makeCard("Sapevo che, quando fosse arrivato, avrebbe capito tutto subito.", "I knew that, when he arrived, he would understand everything immediately.", "node-26", ["general", "family"]),
  makeCard("Ammetto che, benche sembri impossibile, la storia e del tutto vera.", "I admit that, although it seems impossible, the story is entirely true.", "node-26", ["general", "family"]),
  makeCard("E evidente che, a meno che non si intervenga, la situazione peggiorera.", "It is evident that, unless action is taken, the situation will worsen.", "node-26", ["general", "work"]),
  makeCard("Spero che, quando tornerai, troverai tutto in ordine a casa.", "I hope that, when you return, you'll find everything in order at home.", "node-26", ["general", "family"]),
  makeCard("Ho capito che, anche se mi impegno, non posso cambiare tutto.", "I understood that, even if I try hard, I can't change everything.", "node-26", ["general", "work"]),
  makeCard("Temo che, qualora non si trovi un compromesso, le trattative falliranno.", "I fear that, should no compromise be found, the negotiations will fail.", "node-26", ["general", "work"]),

  // Nominalization
  makeCard("Il suo continuo lamentarsi mi da un enorme fastidio quotidiano.", "His constant complaining annoys me enormously on a daily basis.", "node-26", ["general", "work"], "Nominalized infinitive: \"il lamentarsi\" = the act of complaining (functions as noun)."),
  makeCard("Il viaggiare apre la mente e arricchisce profondamente l'anima.", "Traveling opens the mind and deeply enriches the soul.", "node-26", ["general", "travel"]),
  makeCard("Il vivere in citta ha i suoi vantaggi ma anche svantaggi.", "Living in the city has its advantages but also disadvantages.", "node-26", ["general", "travel"], "\"Il vivere\" = nominalized infinitive used as subject."),
  makeCard("Lo scorrere del tempo non si puo fermare in alcun modo.", "The passing of time cannot be stopped in any way.", "node-26", ["general", "family"]),
  makeCard("L'aver studiato all'estero mi ha dato una prospettiva diversa.", "Having studied abroad gave me a different perspective.", "node-26", ["general", "travel"], "Compound nominalized infinitive: l'aver + past participle."),
  makeCard("Il suo insistere ha finito per infastidire tutti i presenti.", "His insisting ended up annoying everyone present.", "node-26", ["general", "work"]),
  makeCard("Il dover lavorare anche nei festivi e davvero frustrante.", "Having to work even on holidays is really frustrating.", "node-26", ["general", "work"]),

  // Cleft sentences
  makeCard("E proprio questo che volevo dire durante la nostra discussione.", "This is exactly what I wanted to say during our discussion.", "node-26", ["general", "work"], "Cleft sentence: \"E ... che\" focuses emphasis on the highlighted element."),
  makeCard("E a te che stavo pensando quando ho scritto questa canzone.", "It's you I was thinking about when I wrote this song.", "node-26", ["general", "family"]),
  makeCard("E per questo motivo che ho deciso di cambiare completamente strada.", "It is for this reason that I decided to completely change course.", "node-26", ["general", "work"], "Cleft sentences with \"e ... che\" place focus on the reason or cause."),
  makeCard("Sono io che dovrei scusarmi per come mi sono comportato.", "It's I who should apologize for how I behaved.", "node-26", ["general", "family"]),
  makeCard("E qui che ci siamo conosciuti per la prima volta tanti anni fa.", "It's here that we met for the first time so many years ago.", "node-26", ["general", "travel"]),
  makeCard("E solo lavorando insieme che potremo superare questa crisi attuale.", "It's only by working together that we can overcome this current crisis.", "node-26", ["general", "work"]),

  // Topicalization and dislocazione
  makeCard("Di soldi, ne ha fin troppi ma non e per niente felice.", "As for money, he has far too much but isn't happy at all.", "node-26", ["general", "family"], "Topicalization with resumptive pronoun \"ne\" restates the fronted topic."),
  makeCard("Questo libro, l'ho gia letto almeno tre volte con piacere.", "This book, I've already read it at least three times with pleasure.", "node-26", ["general", "family"], "Left dislocation: topic moved to front, resumed by pronoun \"l'\"."),
  makeCard("L'ho gia letto, questo libro; non serve comprarlo di nuovo.", "I've already read it, this book; no need to buy it again.", "node-26", ["general", "family"], "Right dislocation: topic placed after the main clause for afterthought."),
  makeCard("A Maria, le ho gia detto tutto quello che dovevo.", "As for Maria, I've already told her everything I needed to.", "node-26", ["general", "family"]),
  makeCard("Di pazienza, ne servira molta per portare a termine questo.", "As for patience, a lot of it will be needed to complete this.", "node-26", ["general", "work"], "Topicalization: \"Di pazienza\" is fronted; \"ne\" resumes it in the clause."),
  makeCard("La torta, l'ha preparata mia nonna con la sua ricetta segreta.", "The cake, my grandmother made it with her secret recipe.", "node-26", ["general", "family"]),
  makeCard("Queste cose, non le capiro mai per quanto ci provi.", "These things, I'll never understand them no matter how hard I try.", "node-26", ["general", "work"]),
  makeCard("La verita, gliela diro quando sara il momento giusto.", "The truth, I'll tell it to him when the time is right.", "node-26", ["general", "family"]),

  // Infinitive clauses as subjects
  makeCard("Imparare una lingua richiede tempo, pazienza e molta costanza.", "Learning a language requires time, patience, and great consistency.", "node-26", ["general", "work"], "Infinitive clause as subject: \"Imparare una lingua\" functions as the subject."),
  makeCard("Viaggiare da soli ti insegna a conoscere meglio te stesso.", "Traveling alone teaches you to know yourself better.", "node-26", ["general", "travel"]),
  makeCard("Ammettere i propri errori e il primo passo verso il miglioramento.", "Admitting one's mistakes is the first step toward improvement.", "node-26", ["general", "work"]),
  makeCard("Crescere i figli e la sfida piu grande e bella della vita.", "Raising children is the greatest and most beautiful challenge in life.", "node-26", ["general", "family"]),
  makeCard("Risparmiare adesso ci permettera di vivere meglio in futuro.", "Saving now will allow us to live better in the future.", "node-26", ["general", "family"]),
  makeCard("Lavorare in gruppo e fondamentale per la riuscita del progetto.", "Working as a team is fundamental for the project's success.", "node-26", ["general", "work"]),

  // Additional complex syntax
  makeCard("Non solo ha chiesto scusa, ma ha anche offerto di rimediare.", "Not only did he apologize, but he also offered to make amends.", "node-26", ["general", "family"], "\"Non solo ... ma anche\" is a correlative conjunction for emphasis."),
  makeCard("Tanto piu studio, quanto piu mi rendo conto di non sapere.", "The more I study, the more I realize I don't know.", "node-26", ["general", "work"], "\"Tanto piu ... quanto piu\" = the more ... the more (correlative comparison)."),
  makeCard("Ne lui ne lei hanno voluto ammettere di aver sbagliato.", "Neither he nor she wanted to admit they had been wrong.", "node-26", ["general", "family"]),
  makeCard("Sia che piova sia che ci sia il sole, usciremo lo stesso.", "Whether it rains or shines, we'll go out all the same.", "node-26", ["general", "travel"], "\"Sia che ... sia che\" + subjunctive for disjunctive concessive clauses."),
  makeCard("Per quanto mi sforzi di capire, certi comportamenti restano inspiegabili.", "No matter how hard I try to understand, some behaviors remain inexplicable.", "node-26", ["general", "family"]),
  makeCard("Piu ci penso, meno capisco come sia potuto succedere davvero.", "The more I think about it, the less I understand how it could have happened.", "node-26", ["general", "family"]),
  makeCard("Non e che non voglia venire; e che non posso proprio.", "It's not that I don't want to come; it's that I really can't.", "node-26", ["general", "family"], "\"Non e che\" + subjunctive for negating a presupposition."),
  makeCard("A dire il vero, non mi aspettavo un risultato cosi positivo.", "To tell the truth, I wasn't expecting such a positive result.", "node-26", ["general", "work"]),
  makeCard("Detto fra noi, credo che il progetto abbia dei problemi seri.", "Between you and me, I think the project has some serious problems.", "node-26", ["general", "work"], "\"Detto fra noi\" is a parenthetical expression (absolute past participle clause)."),
  makeCard("Volente o nolente, dovra accettare le nuove regole del lavoro.", "Like it or not, he'll have to accept the new work rules.", "node-26", ["general", "work"]),
  makeCard("Cio nonostante, la situazione e migliorata rispetto all'anno precedente.", "Nevertheless, the situation has improved compared to the previous year.", "node-26", ["general", "work"]),
  makeCard("Tutto sommato, la vacanza e stata un'esperienza molto piacevole.", "All things considered, the vacation was a very pleasant experience.", "node-26", ["general", "travel"]),
  makeCard("Al posto tuo, ci penserei due volte prima di accettare.", "In your place, I would think twice before accepting.", "node-26", ["general", "work"]),
  makeCard("Sta di fatto che nessuno si e presentato alla riunione stamattina.", "The fact remains that nobody showed up to the meeting this morning.", "node-26", ["general", "work"], "\"Sta di fatto che\" introduces an undeniable fact in argumentative discourse."),
  makeCard("Piuttosto che lamentarmi, preferisco cercare una soluzione al problema.", "Rather than complain, I prefer to look for a solution to the problem.", "node-26", ["general", "work"]),
  makeCard("A quanto risulta, la decisione finale sara presa entro la settimana.", "From what we understand, the final decision will be made within the week.", "node-26", ["general", "work"]),
  makeCard("Per quanto riguarda il budget, dovremo fare dei tagli significativi.", "As regards the budget, we will have to make significant cuts.", "node-26", ["general", "work"]),
  makeCard("Fatto sta che le cose non sono andate come ci aspettavamo.", "The fact is that things didn't go as we expected.", "node-26", ["general", "work"]),
  makeCard("Saremo in grado di partire solo a condizione di avere i visti.", "We will be able to leave only on condition of having the visas.", "node-26", ["general", "travel"]),
  makeCard("Non fosse stato per il tuo aiuto, non ce l'avrei mai fatta.", "If it hadn't been for your help, I would never have made it.", "node-26", ["general", "family"], "\"Non fosse stato per\" = if it hadn't been for (counterfactual past)."),
  makeCard("Per farla breve, abbiamo deciso di rinviare il viaggio a ottobre.", "To cut a long story short, we decided to postpone the trip to October.", "node-26", ["general", "travel"]),
  makeCard("Ci tengo a precisare che non e stata colpa mia.", "I want to make clear that it wasn't my fault.", "node-26", ["general", "work"]),
];
cards.push(...node26);

// ─── WRITE OUTPUT ────────────────────────────────────────────

// Ensure the output directory exists
const outDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cards, null, 2), 'utf-8');

// ─── STATS ───────────────────────────────────────────────────

const nodeCounts = {};
for (const c of cards) {
  nodeCounts[c.grammarNode] = (nodeCounts[c.grammarNode] || 0) + 1;
}

const grammarCount = cards.filter(c => c.grammar).length;
const grammarPct = ((grammarCount / cards.length) * 100).toFixed(1);

console.log(`\nItalian C1-C2 deck generated: ${cards.length} cards`);
console.log(`Grammar tips: ${grammarCount} cards (${grammarPct}%)`);
console.log(`\nPer-node breakdown:`);
for (const [node, count] of Object.entries(nodeCounts).sort()) {
  console.log(`  ${node}: ${count} cards`);
}
console.log(`\nID range: ${cards[0].id} – ${cards[cards.length - 1].id}`);
console.log(`\nWritten to: ${OUTPUT_PATH}`);
