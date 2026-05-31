#!/usr/bin/env node
/**
 * Complete the Dutch deck to 112 cards per node.
 * Adds ~230 new cards to fill gaps.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'dutch', 'deck.json');
const TARGET_PER_NODE = 112;

// ─── New sentences per node ────────────────────────────────────────
// Format: [target, english, grammar|null, tags]
const NEW_SENTENCES = {
  'node-02': [
    // need +1
    ['Zij leest elke avond een boek voor het slapen.', 'She reads a book every evening before sleeping.', "Present tense: 'lezen' → zij leest. The -t ending applies to hij/zij/het.", ['general', 'family']],
  ],

  'node-03': [
    // need +6
    ['Het weer is vandaag beter dan gisteren.', 'The weather is better today than yesterday.', "'Zijn' irregular: het is, het was. 'Beter' = comparative of 'goed'.", ['general', 'travel']],
    ['Wij zijn al twee uur aan het wachten op de trein.', 'We have been waiting for the train for two hours already.', "'Zijn aan het + infinitive' = Dutch progressive: we are waiting.", ['general', 'travel', 'work']],
    ['Heb jij genoeg geld bij je voor de boodschappen?', 'Do you have enough money on you for the groceries?', "'Hebben' conjugation: heb jij? Note inversion in questions.", ['general', 'family']],
    ['De kinderen zijn moe na een lange dag op school.', 'The children are tired after a long day at school.', "'Zijn' + adjective describes a state: 'zijn moe' = are tired.", ['general', 'family']],
    ['Zij heeft altijd veel energie op maandagochtend.', 'She always has a lot of energy on Monday morning.', "'Hebben' conjugation: zij heeft. Note the -ft ending for hij/zij.", ['general', 'work']],
    ['Bent u de eigenaar van dit restaurant?', 'Are you the owner of this restaurant?', "'Zijn' formal: 'bent u' for formal questions — u always takes 'bent'.", ['general', 'work', 'travel']],
  ],

  'node-04': [
    // need +8
    ['Het kind speelt met de hond in de tuin.', 'The child plays with the dog in the garden.', "'Het kind' is neuter, but 'de hond' and 'de tuin' are common gender.", ['general', 'family']],
    ['De slager op de hoek verkoopt het beste vlees.', 'The butcher on the corner sells the best meat.', "'De slager' is common, 'het vlees' is neuter — memorize each noun.", ['general', 'travel']],
    ['Het meisje draagt de rode jurk naar het feest.', 'The girl wears the red dress to the party.', "'Het meisje' is neuter (diminutives are always het-words).", ['general', 'family']],
    ['De leraar schrijft het antwoord op het bord.', 'The teacher writes the answer on the board.', "'De leraar' is common; 'het antwoord' and 'het bord' are neuter.", ['general', 'work']],
    ['Waar is het toilet? Het is aan het einde van de gang.', 'Where is the toilet? It is at the end of the hallway.', "'Het toilet' is neuter; 'de gang' is common gender.", ['general', 'travel']],
    ['De zon schijnt op het water van het meer.', 'The sun shines on the water of the lake.', "'De zon' is common; 'het water' and 'het meer' are neuter.", ['general', 'travel']],
    ['Het probleem is dat de oplossing te duur is.', 'The problem is that the solution is too expensive.', "'Het probleem' is neuter; 'de oplossing' is common — typical traps.", ['general', 'work']],
    ['De bakker heeft het lekkerste brood van de stad.', 'The baker has the tastiest bread in the city.', "'De bakker' and 'de stad' are common; 'het brood' is neuter.", ['general', 'travel', 'family']],
  ],

  'node-05': [
    // need +3
    ['Morgen gaan wij samen naar het strand.', 'Tomorrow we are going to the beach together.', "V2: 'morgen' is first, so 'gaan' (verb) must be second, before 'wij'.", ['general', 'travel', 'family']],
    ['Na het eten ruimen wij altijd de tafel af.', 'After eating we always clear the table.', "V2 + separable verb: 'afruimen' splits — 'ruimen' at V2, 'af' at the end.", ['general', 'family']],
    ['Helaas kan ik vanavond niet komen.', 'Unfortunately I cannot come tonight.', "V2: after 'helaas', the modal 'kan' takes second position.", ['general', 'work', 'family']],
  ],

  'node-06': [
    // need +3
    ['De vergadering begint om kwart over twee.', 'The meeting starts at a quarter past two.', "'Kwart over' = quarter past. Dutch time: half drie = 2:30 (half TO three).", ['general', 'work']],
    ['Zij is op veertien juli negentienhonderdtachtig geboren.', 'She was born on July fourteenth, nineteen eighty.', "Dutch dates: day before month. Years split: 19-80 = negentienhonderdtachtig.", ['general', 'family']],
    ['Er staan drieduizend boeken in deze bibliotheek.', 'There are three thousand books in this library.', "Large numbers: 'drieduizend' is written as one word in Dutch.", ['general', 'work', 'travel']],
  ],

  'node-07': [
    // need +1
    ['Mag ik de rekening alstublieft? Wij willen graag betalen.', 'May I have the bill please? We would like to pay.', "'Alstublieft' = formal please. Use 'alsjeblieft' with friends.", ['general', 'travel']],
  ],

  'node-08': [
    // need +7
    ['Zij belt haar moeder elke zondag op.', 'She calls her mother every Sunday.', "Separable verb: 'opbellen' → 'belt ... op'. The prefix lands at sentence end.", ['general', 'family']],
    ['Wij nodigen al onze vrienden uit voor het feest.', 'We invite all our friends to the party.', "Separable: 'uitnodigen' → 'nodigen ... uit'. Prefix goes to the end.", ['general', 'family', 'travel']],
    ['Hij ruimt zijn kamer nooit op.', 'He never cleans up his room.', "Separable: 'opruimen' → 'ruimt ... op'. 'Nooit' sits before 'op'.", ['general', 'family']],
    ['De trein vertrekt om half acht van spoor drie.', 'The train departs at half past seven from platform three.', "'Vertrekken' is inseparable — the 'ver-' prefix never detaches.", ['general', 'travel']],
    ['Ik neem altijd mijn paraplu mee als het bewolkt is.', 'I always take my umbrella along when it is cloudy.', "Separable: 'meenemen' → 'neem ... mee'. The prefix 'mee' = along.", ['general', 'travel']],
    ['Maak je schoenen uit voordat je binnenkomt.', 'Take off your shoes before you come in.', "Separable: 'uitmaken' and 'binnenkomen' — both split in main clauses.", ['general', 'family']],
    ['Zij maakt het ontbijt klaar terwijl hij de tafel dekt.', 'She prepares breakfast while he sets the table.', "Separable: 'klaarmaken' → 'maakt ... klaar'. Prefix at the end.", ['general', 'family', 'work']],
  ],

  'node-09': [
    // need +3
    ['Wij hebben gisteren de hele dag gewandeld in het bos.', 'We walked in the forest all day yesterday.', "Perfectum: 'hebben gewandeld'. 'Wandelen' uses 'hebben', not 'zijn'.", ['general', 'travel', 'family']],
    ['Zij is vorige maand naar Duitsland verhuisd.', 'She moved to Germany last month.', "Perfectum with 'zijn': 'verhuizen' expresses a change of state.", ['general', 'travel', 'work']],
    ['De kat heeft de hele nacht buiten geslapen.', 'The cat slept outside all night.', "Perfectum: 'hebben geslapen'. Strong verb: slapen → geslapen.", ['general', 'family']],
  ],

  'node-10': [
    // need +1
    ['Geef het boek aan mij, niet aan hem.', 'Give the book to me, not to him.', "Object pronouns after preposition: 'aan mij' (stressed), 'aan hem'.", ['general', 'family', 'work']],
  ],

  'node-11': [
    // need +4
    ['Je mag hier niet zwemmen vanwege de stroming.', 'You may not swim here because of the current.', "Modal 'mogen': expresses permission. 'Niet' negates after the modal.", ['general', 'travel']],
    ['Wij moeten morgen vroeg opstaan voor de vlucht.', 'We have to get up early tomorrow for the flight.', "Modal 'moeten' + infinitive: 'opstaan' stays whole at the end.", ['general', 'travel', 'work']],
    ['Kun je mij helpen met deze zware dozen?', 'Can you help me with these heavy boxes?', "Modal 'kunnen': 'kun je' in questions. Infinitive 'helpen' at the end.", ['general', 'work', 'family']],
    ['Hij wil na zijn studie in het buitenland werken.', 'He wants to work abroad after his studies.', "Modal 'willen': 'wil' + infinitive 'werken' at the end of the clause.", ['general', 'work']],
  ],

  'node-12': [
    // need +8
    ['Zij wast zich elke ochtend met koud water.', 'She washes herself every morning with cold water.', "Reflexive: 'zich wassen' — 'zich' becomes 'zich' for zij.", ['general', 'family']],
    ['Ik scheer mij voordat ik naar kantoor ga.', 'I shave before I go to the office.', "Reflexive: 'zich scheren' — 'mij' is the reflexive for 'ik'.", ['general', 'work']],
    ['De kinderen kleden zich snel aan voor school.', 'The children get dressed quickly for school.', "Reflexive + separable: 'zich aankleden' → 'kleden zich ... aan'.", ['general', 'family']],
    ['Hij vergist zich altijd in de datum.', 'He always gets the date wrong.', "Reflexive: 'zich vergissen' — always requires a reflexive pronoun.", ['general', 'work']],
    ['Wij vermaken ons prima op dit feest.', 'We are having a great time at this party.', "Reflexive: 'zich vermaken' → 'ons' for wij. Means to enjoy oneself.", ['general', 'family', 'travel']],
    ['Je moet je haasten, anders mis je de bus.', 'You need to hurry, otherwise you will miss the bus.', "Reflexive: 'zich haasten' — 'je' is both subject and reflexive here.", ['general', 'travel']],
    ['Na het hardlopen doucht hij zich altijd.', 'After running he always showers.', "Reflexive: 'zich douchen'. V2 word order after 'na het hardlopen'.", ['general', 'family', 'work']],
    ['Ik poets mijn tanden twee keer per dag.', 'I brush my teeth twice a day.', "Daily routine: 'tanden poetsen' is not reflexive — uses 'mijn', not 'mij'.", ['general', 'family']],
  ],

  'node-13': [
    // need +3
    ['Hij heeft geen zin om vanavond te koken.', 'He does not feel like cooking tonight.', "'Geen' before 'zin' (indefinite noun). 'Geen zin hebben' = not feel like.", ['general', 'family']],
    ['Ik begrijp er helemaal niets van.', 'I do not understand any of it at all.', "'Niets' = nothing. 'Er ... van' wraps around for emphasis.", ['general', 'work']],
    ['Zij heeft nog nooit in een vliegtuig gezeten.', 'She has never sat in an airplane.', "'Nog nooit' = never yet. Double negative emphasis, placed before participle.", ['general', 'travel', 'family']],
  ],

  'node-14': [
    // need +10
    ['De kat zit onder de tafel naast de stoel.', 'The cat sits under the table next to the chair.', "'Onder' = under, 'naast' = next to — spatial prepositions.", ['general', 'family']],
    ['Wij lopen langs het kanaal naar het centrum.', 'We walk along the canal to the center.', "'Langs' = along, 'naar' = to (direction) — motion prepositions.", ['general', 'travel']],
    ['Hij werkt sinds januari bij een nieuw bedrijf.', 'He has been working at a new company since January.', "'Sinds' = since (time), 'bij' = at (company/organization).", ['general', 'work']],
    ['Volgens de dokter moet ik meer bewegen.', 'According to the doctor I need to exercise more.', "'Volgens' = according to — used for opinions and sources.", ['general', 'family', 'work']],
    ['De bus stopt voor het station aan de overkant.', 'The bus stops in front of the station on the other side.', "'Voor' = in front of, 'aan' = at/on — location prepositions.", ['general', 'travel']],
    ['Zij zit tussen haar twee broers op de bank.', 'She sits between her two brothers on the couch.', "'Tussen' = between, 'op' = on (surface) — spatial prepositions.", ['general', 'family']],
    ['Zonder jouw hulp hadden wij het niet gered.', 'Without your help we would not have made it.', "'Zonder' = without — takes a noun phrase, no article needed.", ['general', 'work', 'family']],
    ['De supermarkt is tegenover de kerk in het dorp.', 'The supermarket is opposite the church in the village.', "'Tegenover' = opposite — compound preposition, one word.", ['general', 'travel']],
    ['Vanwege het slechte weer blijven wij binnen.', 'Because of the bad weather we stay inside.', "'Vanwege' = because of — formal alternative to 'door' for cause.", ['general', 'travel', 'family']],
    ['Zij fietst elke dag door het park naar haar werk.', 'She cycles through the park to her work every day.', "'Door' = through, 'naar' = to — chain prepositions for a route.", ['general', 'travel', 'work']],
  ],

  'node-15': [
    // need +11
    ['De kleine jongen draagt een grote tas.', 'The small boy carries a big bag.', "Before de-word: 'kleine' gets -e. Before een + common: 'grote' also gets -e.", ['general', 'family']],
    ['Het nieuwe huis heeft een mooie tuin.', 'The new house has a beautiful garden.', "'Het nieuwe huis': adjective + het-word gets -e. 'Een mooie tuin': de-word.", ['general', 'family', 'travel']],
    ['Een klein kind heeft veel slaap nodig.', 'A small child needs a lot of sleep.', "'Een klein kind': no -e! Adjective before een + het-word stays bare.", ['general', 'family']],
    ['De Nederlandse keuken is eenvoudiger dan de Franse.', 'Dutch cuisine is simpler than French.', "Comparative: 'eenvoudig' + -er = 'eenvoudiger'. 'Dan' = than.", ['general', 'travel']],
    ['Dit is het duurste restaurant van de hele stad.', 'This is the most expensive restaurant in the entire city.', "Superlative: 'duur' → 'duurste'. Superlatives always get -e.", ['general', 'travel']],
    ['Zij is veel slimmer dan haar oudere broer.', 'She is much smarter than her older brother.', "'Slimmer' = smarter, 'oudere' = older. Comparative before noun gets -e.", ['general', 'family']],
    ['Het koude weer maakt mij altijd een beetje somber.', 'The cold weather always makes me a bit gloomy.', "'Het koude weer': adjective before definite het-word gets -e.", ['general', 'family']],
    ['Wij zoeken een rustig plekje om te lunchen.', 'We are looking for a quiet spot to have lunch.', "'Een rustig plekje': no -e before een + het-word (diminutive = neuter).", ['general', 'travel', 'work']],
    ['De verse groenten zijn gezonder dan ingeblikte.', 'Fresh vegetables are healthier than canned ones.', "'Verse' before de-word gets -e. 'Gezonder' = comparative of 'gezond'.", ['general', 'family']],
    ['Hij is de langste speler van het hele team.', 'He is the tallest player on the entire team.', "Superlative: 'lang' → 'langste'. With 'de' because 'speler' is a de-word.", ['general', 'work']],
    ['Ik heb een interessant boek over Nederlandse geschiedenis gelezen.', 'I read an interesting book about Dutch history.', "'Een interessant boek': no -e (een + het-word). Key agreement rule!", ['general', 'work']],
  ],

  'node-16': [
    // need +7
    ['Wij speelden als kinderen altijd in het park.', 'We always played in the park as children.', "Imperfectum: 'spelen' → 'speelden'. Stem ends in voiced sound → -den.", ['general', 'family']],
    ['Zij werkte vroeger als verpleegster in het ziekenhuis.', 'She used to work as a nurse in the hospital.', "Imperfectum: 'werken' → 'werkte'. Stem 'werk' ends in 'k' (kofschip) → -te.", ['general', 'work']],
    ['De kinderen liepen snel naar huis toen het begon te regenen.', 'The children walked home quickly when it started raining.', "Strong verb: 'lopen' → 'liepen'. Vowel change in imperfectum.", ['general', 'family']],
    ['Hij las elke avond de krant voordat hij ging slapen.', 'He read the newspaper every evening before going to sleep.', "Strong verb: 'lezen' → 'las'. Irregular vowel change a → e → a.", ['general', 'family']],
    ['Het regende de hele week tijdens onze vakantie.', 'It rained all week during our vacation.', "Imperfectum: 'regenen' → 'regende'. Stem ends in voiced 'n' → -de.", ['general', 'travel']],
    ['Wij gingen elke zomer naar dezelfde camping.', 'We went to the same campsite every summer.', "Strong verb: 'gaan' → 'gingen'. Highly irregular imperfectum.", ['general', 'travel', 'family']],
    ['De leraar vroeg of iedereen de opdracht had begrepen.', 'The teacher asked if everyone had understood the assignment.', "Strong verb: 'vragen' → 'vroeg'. Stem vowel change a → oe.", ['general', 'work']],
  ],

  'node-17': [
    // need +13
    ['Ga bij de stoplichten linksaf en dan rechtdoor.', 'Turn left at the traffic lights and then go straight ahead.', "Directions: 'linksaf' = turn left, 'rechtdoor' = straight ahead.", ['general', 'travel']],
    ['Hoe ver is het lopen naar het dichtstbijzijnde metrostation?', 'How far is it to walk to the nearest metro station?', "'Hoe ver' = how far. 'Dichtstbijzijnde' = nearest (superlative).", ['general', 'travel']],
    ['De fietsenstalling is achter het station aan de linkerkant.', 'The bicycle parking is behind the station on the left side.', "'Fietsenstalling' = bicycle parking — very Dutch! Compound noun.", ['general', 'travel']],
    ['Neem de tweede afslag rechts na de rotonde.', 'Take the second exit right after the roundabout.', "'Afslag' = exit/turn-off. 'Rotonde' = roundabout — key driving vocab.", ['general', 'travel']],
    ['Wij nemen de pont over het IJ naar Amsterdam-Noord.', 'We take the ferry across the IJ to Amsterdam North.', "'De pont' = free ferry — essential Amsterdam transport.", ['general', 'travel']],
    ['De bus naar Schiphol vertrekt elk kwartier van halte vier.', 'The bus to Schiphol departs every quarter hour from stop four.', "'Elk kwartier' = every quarter hour. 'Halte' = bus stop.", ['general', 'travel', 'work']],
    ['Je kunt het beste met de tram gaan; dat is sneller.', 'You had best go by tram; that is faster.', "'Het beste' = best. 'Met de tram' — Dutch prefers tram for cities.", ['general', 'travel']],
    ['Waar kan ik een OV-chipkaart opladen?', 'Where can I top up an OV chip card?', "'OV-chipkaart' = Dutch public transport card. 'Opladen' = to top up.", ['general', 'travel']],
    ['Het vliegveld is ongeveer dertig kilometer van het centrum.', 'The airport is about thirty kilometers from the center.', "'Vliegveld' = airport (lit. 'flying field'). Compound noun.", ['general', 'travel', 'work']],
    ['Loop rechtdoor tot je bij de brug komt en steek dan over.', 'Walk straight until you reach the bridge and then cross over.', "'Oversteken' = to cross over. Separable: 'steek ... over'.", ['general', 'travel']],
    ['Wij staan al twintig minuten in de file op de snelweg.', 'We have been in a traffic jam on the highway for twenty minutes.', "'In de file staan' = to be stuck in traffic. Very common in NL!", ['general', 'travel', 'work']],
    ['Het is maar vijf minuten lopen vanaf hier naar de markt.', 'It is only five minutes walking from here to the market.', "'Maar' = only. 'Vanaf' = from (starting point). Useful phrasing.", ['general', 'travel']],
    ['De trein heeft een vertraging van een kwartier.', 'The train has a delay of a quarter of an hour.', "'Vertraging' = delay. 'Een kwartier' = 15 minutes.", ['general', 'travel', 'work']],
  ],

  'node-18': [
    // need +12
    ['Ik weet dat hij morgen niet kan komen.', 'I know that he cannot come tomorrow.', "Subordinate: after 'dat', verb 'kan' goes to the END of the clause.", ['general', 'work']],
    ['Zij is blij omdat haar zoon geslaagd is voor het examen.', 'She is happy because her son passed the exam.', "'Omdat' = because — verb-final: 'geslaagd is' at the end.", ['general', 'family']],
    ['Als het morgen mooi weer is, gaan wij naar het strand.', 'If the weather is nice tomorrow, we will go to the beach.', "'Als' clause: verb-final. Main clause: V2 inversion after the subclause.", ['general', 'travel', 'family']],
    ['Hij vroeg of wij zin hadden om mee te gaan.', 'He asked if we felt like coming along.', "'Of' = if/whether in indirect questions. Verb-final: 'hadden' at end.", ['general', 'family', 'work']],
    ['Terwijl zij kookte, dekte hij de tafel.', 'While she cooked, he set the table.', "'Terwijl' = while — subordinating, verb-final in its clause.", ['general', 'family']],
    ['Wij gaan niet weg voordat iedereen klaar is.', 'We are not leaving before everyone is ready.', "'Voordat' = before — subordinating connector, verb at the end.", ['general', 'work', 'family']],
    ['Zodra de regen stopt, gaan wij naar buiten.', 'As soon as the rain stops, we will go outside.', "'Zodra' = as soon as — verb-final. Main clause inverts after.", ['general', 'travel']],
    ['Hoewel hij ziek was, ging hij toch naar zijn werk.', 'Although he was sick, he still went to his work.', "'Hoewel' = although — verb-final: 'was' at the end of subclause.", ['general', 'work']],
    ['Ik bel je wanneer ik op het station aankom.', 'I will call you when I arrive at the station.', "'Wanneer' = when — verb-final: 'aankom' (separable) stays whole.", ['general', 'travel']],
    ['Nadat wij gegeten hadden, gingen wij een stuk wandelen.', 'After we had eaten, we went for a walk.', "'Nadat' = after — past perfect in subclause: 'gegeten hadden'.", ['general', 'family', 'travel']],
    ['Zij werkt hard opdat haar kinderen het beter krijgen.', 'She works hard so that her children will have it better.', "'Opdat' = so that (formal) — subordinating, verb at the end.", ['general', 'family', 'work']],
    ['Doordat het zo druk was, konden wij geen plek vinden.', 'Because it was so busy, we could not find a spot.', "'Doordat' = because (factual cause) — verb-final: 'was' at end.", ['general', 'travel']],
  ],

  'node-19': [
    // need +4
    ['Doe de deur achter je dicht als je weggaat.', 'Close the door behind you when you leave.', "Imperative: bare stem 'doe'. Separable: 'dichtdoen' → 'doe ... dicht'.", ['general', 'family']],
    ['Vergeet niet je sleutels mee te nemen!', 'Do not forget to take your keys along!', "Imperative + negation: 'vergeet niet'. Infinitive with 'te' follows.", ['general', 'family', 'travel']],
    ['Laten wij samen een oplossing bedenken.', 'Let us think of a solution together.', "'Laten wij' = let us — formal/polite imperative form.", ['general', 'work']],
    ['Ga zitten en maak het je gemakkelijk.', 'Sit down and make yourself comfortable.', "Two imperatives chained: 'ga zitten' + 'maak het je gemakkelijk'.", ['general', 'travel', 'family']],
  ],

  'node-20': [
    // need +11
    ['Wil je een kopje koffie of een glaasje water?', 'Would you like a cup of coffee or a small glass of water?', "Diminutive: 'glas' → 'glaasje' (vowel lengthening + -je).", ['general', 'travel']],
    ['Het hondje van de buren blaft de hele nacht.', 'The neighbors\' little dog barks all night.', "Diminutive: 'hond' → 'hondje'. After -nd, add -je directly.", ['general', 'family']],
    ['Wij eten een broodje kaas als lunch.', 'We eat a cheese sandwich for lunch.', "'Broodje' = little bread/sandwich. Diminutive of 'brood' with -je.", ['general', 'travel', 'work']],
    ['Het zonnetje schijnt en de vogeltjes zingen.', 'The little sun shines and the little birds sing.', "Double diminutive: 'zon' → 'zonnetje', 'vogel' → 'vogeltjes' (plural).", ['general', 'family']],
    ['Zij woont in een aardig dorpje aan de kust.', 'She lives in a nice little village on the coast.', "Diminutive: 'dorp' → 'dorpje'. After -rp, add -je.", ['general', 'travel']],
    ['Mag ik een stukje taart bij de koffie?', 'May I have a piece of cake with the coffee?', "Diminutive: 'stuk' → 'stukje'. Very common in daily Dutch.", ['general', 'travel', 'family']],
    ['Het kindje slaapt eindelijk na een lange dag.', 'The little child is finally sleeping after a long day.', "Diminutive: 'kind' → 'kindje'. All diminutives are het-words.", ['general', 'family']],
    ['Ik stuur je een berichtje als ik er ben.', 'I will send you a message when I am there.', "Diminutive: 'bericht' → 'berichtje'. Casual for a quick text.", ['general', 'travel', 'work']],
    ['Er staat een schattig boompje in onze achtertuin.', 'There is a cute little tree in our backyard.', "Diminutive: 'boom' → 'boompje'. After -m, add -pje.", ['general', 'family']],
    ['Dat liedje kan ik niet meer uit mijn hoofd krijgen.', 'I cannot get that little song out of my head.', "Diminutive: 'lied' → 'liedje'. Also means a pop song in casual Dutch.", ['general', 'family']],
    ['Wij maken een ommetje door het park na het eten.', 'We take a little walk through the park after eating.', "'Ommetje' = a short stroll (diminutive of 'omweg'). Very Dutch.", ['general', 'family', 'travel']],
  ],

  'node-21': [
    // need +15
    ['De vrouw die naast ons woont, is lerares.', 'The woman who lives next to us is a teacher.', "'Die' for de-words: 'de vrouw die'. Verb at end of relative clause.", ['general', 'family']],
    ['Het boek dat ik vorige week kocht, is erg goed.', 'The book that I bought last week is very good.', "'Dat' for het-words: 'het boek dat'. Verb-final in relative clause.", ['general', 'family']],
    ['De collega met wie ik samenwerk, gaat met pensioen.', 'The colleague with whom I work together is retiring.', "'Met wie' — preposition + 'wie' for people in relative clauses.", ['general', 'work']],
    ['Het restaurant waar wij gisteren aten, is gesloten.', 'The restaurant where we ate yesterday is closed.', "'Waar' for places in relative clauses. Verb-final: 'aten'.", ['general', 'travel']],
    ['De stad waarin ik ben opgegroeid, is veel veranderd.', 'The city in which I grew up has changed a lot.', "'Waarin' = in which — compound relative for het-words and places.", ['general', 'travel', 'family']],
    ['Alles wat hij zei, bleek uiteindelijk waar te zijn.', 'Everything he said turned out to be true in the end.', "'Wat' after 'alles', 'iets', 'niets' — not 'dat'. Verb at end.", ['general', 'work']],
    ['De trein waarmee wij reisden, had een uur vertraging.', 'The train we traveled with had a one-hour delay.', "'Waarmee' = with which — compound relative for things.", ['general', 'travel']],
    ['De man wiens auto gestolen is, heeft aangifte gedaan.', 'The man whose car was stolen has filed a report.', "'Wiens' = whose (masculine). Formal but important relative pronoun.", ['general', 'work']],
    ['De reden waarom hij niet kwam, is nog steeds onduidelijk.', 'The reason why he did not come is still unclear.', "'Waarom' = why — used as relative pronoun after 'de reden'.", ['general', 'work', 'family']],
    ['Dat is het mooiste dat ik ooit heb gezien.', 'That is the most beautiful thing I have ever seen.', "'Dat' after superlatives: 'het mooiste dat'. Verb-final in clause.", ['general', 'travel']],
    ['De mensen die hier wonen, zijn heel vriendelijk.', 'The people who live here are very friendly.', "'Die' for plural de-words. 'Wonen' at end of relative clause.", ['general', 'travel', 'family']],
    ['Het probleem waarvoor wij staan, is niet eenvoudig.', 'The problem we are facing is not simple.', "'Waarvoor' = for which — compound relative with preposition.", ['general', 'work']],
    ['Ik ken iemand die perfect Nederlands spreekt.', 'I know someone who speaks perfect Dutch.', "'Die' after 'iemand'. Indefinite pronouns take 'die'.", ['general', 'work', 'travel']],
    ['Het huis waarnaast een school staat, is te koop.', 'The house next to which there is a school is for sale.', "'Waarnaast' = next to which — compound relative, formal Dutch.", ['general', 'family']],
    ['De dag waarop wij trouwden, was de mooiste van mijn leven.', 'The day on which we married was the most beautiful of my life.', "'Waarop' = on which — compound relative for time expressions.", ['general', 'family']],
  ],

  'node-22': [
    // need +10
    ['Het eten wordt door de chef elke dag vers bereid.', 'The food is prepared fresh every day by the chef.', "Passive: 'worden' + past participle. 'Door' = by (agent).", ['general', 'travel', 'work']],
    ['De brief is al verstuurd naar het hoofdkantoor.', 'The letter has already been sent to the headquarters.', "Passive with 'zijn': result/state. 'Is verstuurd' = has been sent.", ['general', 'work']],
    ['Er werd veel gelachen tijdens het feest.', 'There was a lot of laughing during the party.', "Impersonal passive: 'er werd gelachen' — no agent, no object.", ['general', 'family', 'travel']],
    ['De nieuwe weg wordt volgend jaar aangelegd.', 'The new road will be constructed next year.', "Passive future: 'worden' + past participle for planned actions.", ['general', 'travel', 'work']],
    ['Het rapport moet voor vrijdag worden ingeleverd.', 'The report must be submitted by Friday.', "Modal + passive: 'moeten worden' + past participle.", ['general', 'work']],
    ['De wedstrijd werd door duizenden mensen bekeken.', 'The match was watched by thousands of people.', "Passive imperfectum: 'werd bekeken'. 'Door' marks the agent.", ['general', 'travel']],
    ['Alle kamers zijn schoongemaakt voor de gasten.', 'All rooms have been cleaned for the guests.', "Passive result: 'zijn schoongemaakt' — state after completed action.", ['general', 'travel', 'work']],
    ['Het pakje is vanmorgen bezorgd door de postbode.', 'The package was delivered this morning by the postman.', "Passive: 'is bezorgd' — result. 'Door de postbode' = by the postman.", ['general', 'family']],
    ['Er wordt in Nederland veel gefietst.', 'There is a lot of cycling in the Netherlands.', "Impersonal passive: 'er wordt gefietst' — no person, general statement.", ['general', 'travel']],
    ['De beslissing is genomen zonder ons te raadplegen.', 'The decision was made without consulting us.', "Passive: 'is genomen' = was taken. 'Zonder ... te' = without ...ing.", ['general', 'work']],
  ],

  'node-23': [
    // need +10
    ['Er zijn veel toeristen in Amsterdam in de zomer.', 'There are many tourists in Amsterdam in the summer.', "'Er' as placeholder subject: 'er zijn' = there are.", ['general', 'travel']],
    ['Ik heb er geen verstand van.', 'I have no understanding of it.', "'Er ... van' = of it. Pronomial adverb replacing 'van het/dat'.", ['general', 'work']],
    ['Er wordt hard aan het project gewerkt.', 'The project is being worked on hard.', "'Er' in impersonal passive — required placeholder subject.", ['general', 'work']],
    ['Hoeveel kosten de appels? Er zijn er drie voor twee euro.', 'How much are the apples? There are three for two euros.', "Double 'er': first = there, second = of them (quantitative).", ['general', 'travel']],
    ['Wij hebben er lang over nagedacht.', 'We thought about it for a long time.', "'Er ... over' = about it. 'Nadenken over' → 'er over nagedacht'.", ['general', 'work', 'family']],
    ['Er staan veel bomen in het park.', 'There are many trees in the park.', "'Er' as locative/existential: 'er staan' introduces what exists.", ['general', 'travel']],
    ['Ik kijk er elke dag naar uit.', 'I look forward to it every day.', "'Er ... naar ... uit' from 'uitkijken naar'. Split around adverbs.", ['general', 'family', 'work']],
    ['Hoeveel broers heb je? Ik heb er twee.', 'How many brothers do you have? I have two of them.', "Quantitative 'er': replaces the noun. 'Ik heb er twee' = I have two.", ['general', 'family']],
    ['Er valt niets aan te doen.', 'There is nothing to be done about it.', "'Er' + 'aan': 'er valt niets aan te doen' — fixed expression.", ['general', 'work']],
    ['Zij heeft er spijt van dat zij niet is gegaan.', 'She regrets that she did not go.', "'Er ... van' = of it. 'Spijt hebben van' → 'er spijt van hebben'.", ['general', 'family']],
  ],

  'node-24': [
    // need +10
    ['Ik zal je morgen bellen als ik meer weet.', 'I will call you tomorrow when I know more.', "Future: 'zullen' + infinitive. 'Zal' for ik, 'zult' for jij formally.", ['general', 'work']],
    ['Zou je mij kunnen helpen met verhuizen?', 'Could you help me with moving?', "Conditional: 'zou' + infinitive for polite requests.", ['general', 'family']],
    ['Wij zullen volgend jaar naar Japan reizen.', 'We will travel to Japan next year.', "Future: 'zullen' + infinitive 'reizen'. Firm plan or promise.", ['general', 'travel']],
    ['Hij zou het liefst de hele dag thuis blijven.', 'He would prefer to stay home all day.', "Conditional wish: 'zou' + 'het liefst' — what he would most like.", ['general', 'family']],
    ['Als ik rijk was, zou ik een huis aan zee kopen.', 'If I were rich, I would buy a house by the sea.', "Conditional: 'zou ... kopen'. Hypothetical with 'als' + imperfectum.", ['general', 'family', 'travel']],
    ['Zij zullen wel al vertrokken zijn tegen de tijd dat wij aankomen.', 'They will probably already have left by the time we arrive.', "Future perfect: 'zullen ... vertrokken zijn'. 'Wel' adds probability.", ['general', 'travel']],
    ['Zou u zo vriendelijk willen zijn om de deur open te houden?', 'Would you be so kind as to hold the door open?', "Very polite conditional: 'zou u ... willen zijn'. Formal register.", ['general', 'work', 'travel']],
    ['Ik denk dat het morgen zal regenen.', 'I think it will rain tomorrow.', "Future in subclause: 'zal regenen' — verb cluster at end.", ['general', 'travel']],
    ['Zouden jullie dit weekend bij ons willen eten?', 'Would you all like to eat at our place this weekend?', "Conditional invitation: 'zouden jullie ... willen'. Polite and warm.", ['general', 'family']],
    ['Het zal niet makkelijk worden, maar wij gaan het proberen.', 'It will not be easy, but we are going to try.', "Future with 'zal' vs. 'gaan' — both express future, different nuance.", ['general', 'work']],
  ],

  'node-25': [
    // need +23
    ['Tenzij het gaat regenen, fietsen wij naar het werk.', 'Unless it is going to rain, we will cycle to work.', "'Tenzij' = unless — subordinating, verb-final in its clause.", ['general', 'travel', 'work']],
    ['Zodra de vergadering begint, zet ik mijn telefoon uit.', 'As soon as the meeting starts, I will turn off my phone.', "'Zodra' = as soon as — verb-final. Main clause inverts.", ['general', 'work']],
    ['Mits je op tijd komt, mag je met ons meerijden.', 'Provided you arrive on time, you may ride with us.', "'Mits' = provided that — conditional subordinating connector.", ['general', 'travel']],
    ['Naarmate de tijd verstreek, werd het steeds moeilijker.', 'As time passed, it became increasingly difficult.', "'Naarmate' = as/in proportion to — gradual change connector.", ['general', 'work']],
    ['Daarentegen is het openbaar vervoer hier uitstekend.', 'On the other hand, public transport here is excellent.', "'Daarentegen' = on the other hand — contrastive connector.", ['general', 'travel']],
    ['Desalniettemin besloten wij door te gaan met het project.', 'Nevertheless we decided to continue with the project.', "'Desalniettemin' = nevertheless — very formal connecting adverb.", ['general', 'work']],
    ['Enerzijds wil ik reizen, anderzijds mis ik mijn familie.', 'On one hand I want to travel, on the other I miss my family.', "'Enerzijds ... anderzijds' = on one hand ... on the other.", ['general', 'travel', 'family']],
    ['Aangezien het al laat is, stel ik voor om morgen verder te gaan.', 'Since it is already late, I suggest continuing tomorrow.', "'Aangezien' = since/given that — formal cause, verb-final.", ['general', 'work']],
    ['Zolang je je best doet, ben ik tevreden.', 'As long as you do your best, I am satisfied.', "'Zolang' = as long as — temporal/conditional, verb-final.", ['general', 'work', 'family']],
    ['Ondanks dat hij ziek was, kwam hij toch naar het werk.', 'Despite being sick, he still came to work.', "'Ondanks dat' = despite the fact that — concessive + verb-final.", ['general', 'work']],
    ['Bovendien heeft zij veel ervaring in dit vakgebied.', 'Moreover, she has a lot of experience in this field.', "'Bovendien' = moreover — additive connecting adverb.", ['general', 'work']],
    ['Hetzij per trein, hetzij per bus, wij komen er wel.', 'Whether by train or by bus, we will get there.', "'Hetzij ... hetzij' = whether ... or — formal disjunctive pair.", ['general', 'travel']],
    ['Integendeel, het eten was juist heel lekker.', 'On the contrary, the food was actually very tasty.', "'Integendeel' = on the contrary — contradicts previous statement.", ['general', 'travel']],
    ['Ofschoon het duur is, is het de moeite waard.', 'Although it is expensive, it is worth the effort.', "'Ofschoon' = although — literary subordinator, verb-final.", ['general', 'travel', 'work']],
    ['Behalve dat hij slim is, is hij ook erg aardig.', 'Besides being smart, he is also very kind.', "'Behalve dat' = besides the fact that — additive, verb-final.", ['general', 'family', 'work']],
    ['Dientengevolge moesten wij het plan aanpassen.', 'Consequently we had to adjust the plan.', "'Dientengevolge' = consequently — very formal result connector.", ['general', 'work']],
    ['Naar aanleiding van uw brief neem ik contact met u op.', 'Following your letter I am contacting you.', "'Naar aanleiding van' = following/in response to — formal.", ['general', 'work']],
    ['Immers, iedereen heeft recht op een eerlijke kans.', 'After all, everyone has the right to a fair chance.', "'Immers' = after all — explanatory connecting adverb.", ['general', 'work', 'family']],
    ['Evenals vorig jaar organiseren wij weer een barbecue.', 'Just like last year we are organizing a barbecue again.', "'Evenals' = just like — comparative connector.", ['general', 'family']],
    ['Terwijl hij kookte, waste zij ondertussen de groenten.', 'While he cooked, she meanwhile washed the vegetables.', "'Terwijl' = while, 'ondertussen' = meanwhile — simultaneous actions.", ['general', 'family']],
    ['Voor zover ik weet, is de winkel vandaag gesloten.', 'As far as I know, the shop is closed today.', "'Voor zover' = as far as — hedging connector, limits certainty.", ['general', 'travel']],
    ['In plaats van te klagen, zou je beter kunnen helpen.', 'Instead of complaining, you could better help.', "'In plaats van' = instead of — contrastive prepositional phrase.", ['general', 'work', 'family']],
    ['Doordat de trein uitviel, kwam ik te laat op mijn werk.', 'Because the train was cancelled, I arrived late at work.', "'Doordat' = because (external cause) — verb-final in clause.", ['general', 'travel', 'work']],
  ],

  'node-26': [
    // need +10
    ['Het is belangrijk om genoeg water te drinken.', 'It is important to drink enough water.', "'Om te' + infinitive: expresses purpose or necessity.", ['general', 'family']],
    ['Zij ging naar de winkel om boodschappen te doen.', 'She went to the shop to do groceries.', "'Om ... te doen' = in order to do. Purpose construction.", ['general', 'family', 'travel']],
    ['Hij probeert elke dag een uurtje te sporten.', 'He tries to exercise for an hour every day.', "'Proberen te' + infinitive — no 'om' needed after 'proberen'.", ['general', 'family', 'work']],
    ['Wij zijn van plan om volgend jaar te verhuizen.', 'We plan to move next year.', "'Van plan zijn om te' — common expression with infinitive.", ['general', 'family']],
    ['Het is niet makkelijk om Nederlands te leren.', 'It is not easy to learn Dutch.', "'Om te leren' — infinitive with 'om te' after adjective evaluation.", ['general', 'work']],
    ['Ik heb geen tijd om vanavond te koken.', 'I do not have time to cook tonight.', "'Om te koken' — purpose infinitive after 'tijd' (no time to...).", ['general', 'family', 'work']],
    ['Zij leert Nederlands om met haar schoonfamilie te praten.', 'She is learning Dutch to talk with her in-laws.', "'Om te praten' = in order to talk. Clear purpose construction.", ['general', 'family']],
    ['Het lukte mij niet om op tijd te komen.', 'I did not manage to arrive on time.', "'Lukken om te' — impersonal verb + infinitive construction.", ['general', 'work', 'travel']],
    ['Wij zitten hier om de nieuwe plannen te bespreken.', 'We are here to discuss the new plans.', "'Om te bespreken' = in order to discuss. Formal purpose.", ['general', 'work']],
    ['Hij is te moe om nog verder te rijden.', 'He is too tired to drive any further.', "'Te ... om te' = too ... to — result infinitive construction.", ['general', 'travel']],
  ],

  'node-27': [
    // need +14
    ['Hij zei dat hij de volgende dag zou komen.', 'He said that he would come the next day.', "Reported speech: present → imperfectum. 'Morgen' → 'de volgende dag'.", ['general', 'work']],
    ['Zij vertelde dat zij als kind in België had gewoond.', 'She told that she had lived in Belgium as a child.', "Reported speech: perfectum → plusquamperfectum (had gewoond).", ['general', 'family']],
    ['De dokter adviseerde dat ik meer moest rusten.', 'The doctor advised that I should rest more.', "Reported speech: 'moet' → 'moest'. Tense shift back.", ['general', 'family', 'work']],
    ['Mijn baas vroeg of ik het rapport al had afgemaakt.', 'My boss asked whether I had already finished the report.', "Indirect question: 'of' = whether. Verb-final: 'had afgemaakt'.", ['general', 'work']],
    ['Hij beweerde dat hij de beste student van de klas was.', 'He claimed that he was the best student in the class.', "Reported speech: 'is' → 'was'. 'Beweren' = to claim.", ['general', 'work']],
    ['Zij beloofde dat zij op tijd zou zijn voor het diner.', 'She promised that she would be on time for dinner.', "Reported speech: 'zal' → 'zou'. Future shifts to conditional.", ['general', 'family']],
    ['De buurman vertelde mij dat er ingebroken was.', 'The neighbor told me that there had been a break-in.', "Reported speech: passive. 'Is ingebroken' → 'was ingebroken'.", ['general', 'family']],
    ['Hij wilde weten wanneer de trein zou vertrekken.', 'He wanted to know when the train would depart.', "Indirect question with 'wanneer'. Verb-final: 'zou vertrekken'.", ['general', 'travel']],
    ['Zij zei dat zij het er niet mee eens was.', 'She said that she did not agree with it.', "Reported speech: 'het ermee eens zijn' stays intact, tense shifts.", ['general', 'work']],
    ['De leraar legde uit hoe het probleem opgelost moest worden.', 'The teacher explained how the problem had to be solved.', "Indirect question: 'hoe'. Passive in reported speech.", ['general', 'work']],
    ['Mijn moeder zei altijd dat eerlijkheid het belangrijkst was.', 'My mother always said that honesty was the most important.', "Habitual reported speech: 'zei altijd dat' — repeated saying.", ['general', 'family']],
    ['Hij meldde dat de vergadering was uitgesteld.', 'He reported that the meeting had been postponed.', "Reported speech: passive perfectum → 'was uitgesteld'.", ['general', 'work']],
    ['Zij vroeg mij waar ik zo laat naartoe ging.', 'She asked me where I was going so late.', "Indirect question: 'waar ... naartoe'. Verb-final: 'ging'.", ['general', 'family']],
    ['De gids vertelde ons dat het kasteel in de dertiende eeuw was gebouwd.', 'The guide told us that the castle was built in the thirteenth century.', "Reported speech: passive. Historical tense shift preserved.", ['general', 'travel']],
  ],

  'node-28': [
    // need +12
    ['Nu komt de aap uit de mouw.', 'Now the truth comes out.', "Idiom: 'de aap uit de mouw komen' = the truth is revealed (lit. the monkey comes out of the sleeve).", ['general', 'work']],
    ['Hij loopt met zijn hoofd in de wolken.', 'He has his head in the clouds.', "Idiom: 'met het hoofd in de wolken lopen' = to daydream.", ['general', 'family']],
    ['Dat is mosterd na de maaltijd.', 'That is too late to be of any use.', "Idiom: 'mosterd na de maaltijd' = mustard after the meal (too late).", ['general', 'work']],
    ['Zij maakt van een mug een olifant.', 'She makes a mountain out of a molehill.', "Idiom: 'van een mug een olifant maken' = to exaggerate wildly.", ['general', 'family']],
    ['Hij heeft boter op zijn hoofd.', 'He is not in a position to criticize.', "Idiom: 'boter op het hoofd hebben' = to be guilty yourself.", ['general', 'work', 'family']],
    ['Wij moeten niet de kat op het spek binden.', 'We should not put temptation in someone\'s way.', "Idiom: 'de kat op het spek binden' = to tempt fate.", ['general', 'work']],
    ['Dat slaat als een tang op een varken.', 'That makes absolutely no sense.', "Idiom: 'slaan als een tang op een varken' = completely irrelevant.", ['general', 'work', 'family']],
    ['Zij is met het verkeerde been uit bed gestapt.', 'She got up on the wrong side of the bed.', "Idiom: 'met het verkeerde been uit bed stappen' = to be grumpy.", ['general', 'family']],
    ['Hij draait er altijd omheen in plaats van eerlijk te zijn.', 'He always beats around the bush instead of being honest.', "Idiom: 'ergens omheen draaien' = to beat around the bush.", ['general', 'work', 'family']],
    ['Dat is een eitje; ik doe het in vijf minuten.', 'That is a piece of cake; I will do it in five minutes.', "Idiom: 'een eitje' = a piece of cake (very easy). Diminutive!", ['general', 'work']],
    ['Hij zit met de gebakken peren na die beslissing.', 'He is left holding the bag after that decision.', "Idiom: 'met de gebakken peren zitten' = to be stuck with the consequences.", ['general', 'work']],
    ['Wij zitten allemaal in hetzelfde schuitje.', 'We are all in the same boat.', "Idiom: 'in hetzelfde schuitje zitten' = in the same boat.", ['general', 'family', 'work']],
  ],

  'node-29': [
    // need +2
    ['Zou u mij kunnen vertellen waar de uitgang is, alstublieft?', 'Could you tell me where the exit is, please?', "Formal register: 'u' + 'zou' + 'alstublieft'. Very polite combination.", ['general', 'travel']],
    ['He joh, heb je zin om morgen wat te gaan drinken?', 'Hey, do you feel like going out for drinks tomorrow?', "Informal: 'he joh' = hey (buddy). 'Wat drinken' = casual for drinks.", ['general', 'family']],
  ],

  'node-30': [
    // need +1
    ['De stofzuiger in de schoonmaakkast is kapot.', 'The vacuum cleaner in the cleaning closet is broken.', "Compound words: 'stofzuiger' (dust+sucker), 'schoonmaakkast' (cleaning+closet).", ['general', 'family']],
  ],

  'node-31': [
    // need +1
    ['Niet alleen spreekt zij vloeiend Nederlands, maar ook Frans en Duits.', 'Not only does she speak fluent Dutch, but also French and German.', "'Niet alleen ... maar ook': paired connectors with inversion in first clause.", ['general', 'work', 'travel']],
  ],

  'node-32': [
    // need +4
    ['Men dient zich te houden aan de geldende voorschriften.', 'One must adhere to the applicable regulations.', "'Men' = one (impersonal). 'Dient te' = must — formal written Dutch.", ['general', 'work']],
    ['De door de minister aangekondigde maatregelen baren ons zorgen.', 'The measures announced by the minister cause us concern.', "Extended participial modifier before noun — literary word order.", ['general', 'work']],
    ['Het zij opgemerkt dat deze regeling slechts tijdelijk is.', 'Let it be noted that this regulation is only temporary.', "'Het zij opgemerkt' = let it be noted — archaic subjunctive form.", ['general', 'work']],
    ['Nimmer tevoren had de stad zo een spectaculair evenement meegemaakt.', 'Never before had the city experienced such a spectacular event.', "'Nimmer' = never (literary). Inversion after negative adverb.", ['general', 'travel']],
  ],

  'node-34': [
    // need +1
    ['Gezelligheid kent geen tijd, zeggen de Nederlanders altijd.', 'Coziness knows no time, the Dutch always say.', "'Gezelligheid' = uniquely Dutch: warmth, togetherness, coziness. Untranslatable.", ['general', 'family', 'travel']],
  ],

  'node-35': [
    // need +1
    ['Ach, het valt eigenlijk best wel mee hoor.', 'Oh, it is actually not that bad, you know.', "Particles: 'ach' (oh well), 'eigenlijk' (actually), 'best wel' (quite), 'hoor' (softener).", ['general', 'family']],
  ],
};

// ─── Main ──────────────────────────────────────────────────────────
function main() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  console.log(`Existing deck: ${deck.length} cards`);

  // Count per node
  const nodeCounts = {};
  deck.forEach(c => { nodeCounts[c.grammarNode] = (nodeCounts[c.grammarNode] || 0) + 1; });

  // Max ID
  let maxId = Math.max(...deck.map(c => c.id));
  console.log(`Max existing ID: ${maxId}`);

  // Collect all existing target sentences for duplicate check
  const existingTargets = new Set(deck.map(c => c.target.toLowerCase().trim()));

  let totalAdded = 0;
  let duplicatesSkipped = 0;

  for (const [node, sentences] of Object.entries(NEW_SENTENCES)) {
    const needed = TARGET_PER_NODE - (nodeCounts[node] || 0);
    const available = sentences.length;

    if (available < needed) {
      console.warn(`WARNING: ${node} needs ${needed} cards but only ${available} sentences provided`);
    }

    for (const [target, english, grammar, tags] of sentences) {
      const key = target.toLowerCase().trim();
      if (existingTargets.has(key)) {
        console.warn(`DUPLICATE SKIPPED: "${target}" in ${node}`);
        duplicatesSkipped++;
        continue;
      }

      maxId++;
      const card = {
        id: maxId,
        target,
        english,
        audio: `nl-${maxId}.mp3`,
        tags,
        grammarNode: node,
      };
      if (grammar) {
        card.grammar = grammar;
      }

      deck.push(card);
      existingTargets.add(key);
      totalAdded++;
      nodeCounts[node] = (nodeCounts[node] || 0) + 1;
    }
  }

  // Final duplicate check on entire deck
  const allTargets = deck.map(c => c.target.toLowerCase().trim());
  const targetSet = new Set();
  let finalDuplicates = 0;
  for (const t of allTargets) {
    if (targetSet.has(t)) {
      finalDuplicates++;
      console.error(`FINAL DUPLICATE: "${t}"`);
    }
    targetSet.add(t);
  }

  console.log(`\n--- Results ---`);
  console.log(`Cards added: ${totalAdded}`);
  console.log(`Duplicates skipped: ${duplicatesSkipped}`);
  console.log(`Final duplicates in deck: ${finalDuplicates}`);
  console.log(`New deck size: ${deck.length}`);

  // Show per-node counts
  console.log(`\nPer-node counts (target: ${TARGET_PER_NODE}):`);
  const sortedNodes = Object.keys(nodeCounts).sort((a, b) => {
    const na = parseInt(a.split('-')[1]);
    const nb = parseInt(b.split('-')[1]);
    return na - nb;
  });
  let allMet = true;
  for (const node of sortedNodes) {
    const count = nodeCounts[node];
    const status = count >= TARGET_PER_NODE ? 'OK' : `NEED +${TARGET_PER_NODE - count}`;
    if (count < TARGET_PER_NODE) allMet = false;
    console.log(`  ${node}: ${count} ${status}`);
  }

  if (finalDuplicates > 0) {
    console.error(`\nERROR: ${finalDuplicates} duplicates found. NOT writing.`);
    process.exit(1);
  }

  if (!allMet) {
    console.warn(`\nWARNING: Not all nodes reached ${TARGET_PER_NODE}.`);
  }

  // Compute stats
  const uniqueWords = new Set();
  let totalWords = 0;
  let grammarCount = 0;
  deck.forEach(c => {
    const words = c.target.split(/\s+/);
    totalWords += words.length;
    words.forEach(w => uniqueWords.add(w.toLowerCase().replace(/[.,!?;:'"()]/g, '')));
    if (c.grammar) grammarCount++;
  });

  console.log(`\nStats:`);
  console.log(`  Total cards: ${deck.length}`);
  console.log(`  Unique words: ${uniqueWords.size}`);
  console.log(`  Avg words/sentence: ${(totalWords / deck.length).toFixed(1)}`);
  console.log(`  Grammar tips: ${grammarCount} (${(grammarCount / deck.length * 100).toFixed(1)}%)`);

  // Write
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf8');
  console.log(`\nDeck written to ${DECK_PATH}`);
}

main();
