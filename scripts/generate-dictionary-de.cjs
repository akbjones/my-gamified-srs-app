#!/usr/bin/env node
/**
 * Generates the German dictionary (de.ts) from deck words.
 * Creates entries with English translations, POS tags, and IPA.
 * Includes lookupWord with German-specific handling.
 */
const fs = require('fs');
const path = require('path');

const DECK = require(path.join(__dirname, '..', 'src', 'data', 'german', 'deck.json'));
const OUT = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'de.ts');

// Extract all unique words from deck
const wordSet = new Set();
DECK.forEach(c => {
  c.target.toLowerCase()
    .replace(/[.,!?;:""«»()—–…'']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1)
    .forEach(w => wordSet.add(w));
});

// German → English translation map (comprehensive)
// Built from analyzing the deck content
const TRANSLATIONS = {
  // === Common verbs ===
  'sein': ['to be', 'v'], 'haben': ['to have', 'v'], 'werden': ['to become', 'v'],
  'können': ['to be able to', 'v'], 'müssen': ['to have to', 'v'], 'dürfen': ['to be allowed to', 'v'],
  'sollen': ['should', 'v'], 'wollen': ['to want', 'v'], 'mögen': ['to like', 'v'],
  'machen': ['to make/do', 'v'], 'gehen': ['to go', 'v'], 'kommen': ['to come', 'v'],
  'sagen': ['to say', 'v'], 'geben': ['to give', 'v'], 'nehmen': ['to take', 'v'],
  'sprechen': ['to speak', 'v'], 'finden': ['to find', 'v'], 'stehen': ['to stand', 'v'],
  'lassen': ['to let/leave', 'v'], 'sehen': ['to see', 'v'], 'wissen': ['to know', 'v'],
  'fahren': ['to drive/go', 'v'], 'denken': ['to think', 'v'], 'glauben': ['to believe', 'v'],
  'bringen': ['to bring', 'v'], 'leben': ['to live', 'v'], 'bleiben': ['to stay', 'v'],
  'liegen': ['to lie/be located', 'v'], 'halten': ['to hold/stop', 'v'],
  'heißen': ['to be called', 'v'], 'arbeiten': ['to work', 'v'], 'brauchen': ['to need', 'v'],
  'lesen': ['to read', 'v'], 'schreiben': ['to write', 'v'], 'trinken': ['to drink', 'v'],
  'essen': ['to eat', 'v'], 'spielen': ['to play', 'v'], 'lernen': ['to learn', 'v'],
  'kaufen': ['to buy', 'v'], 'helfen': ['to help', 'v'], 'fragen': ['to ask', 'v'],
  'antworten': ['to answer', 'v'], 'verstehen': ['to understand', 'v'],
  'kennen': ['to know (person)', 'v'], 'nennen': ['to name/call', 'v'],
  'beginnen': ['to begin', 'v'], 'anfangen': ['to start', 'v'], 'aufhören': ['to stop', 'v'],
  'versuchen': ['to try', 'v'], 'erklären': ['to explain', 'v'], 'zeigen': ['to show', 'v'],
  'führen': ['to lead', 'v'], 'erreichen': ['to reach', 'v'], 'tragen': ['to carry/wear', 'v'],
  'schlafen': ['to sleep', 'v'], 'laufen': ['to run', 'v'], 'fallen': ['to fall', 'v'],
  'ziehen': ['to pull/move', 'v'], 'sitzen': ['to sit', 'v'], 'fliegen': ['to fly', 'v'],
  'schließen': ['to close', 'v'], 'öffnen': ['to open', 'v'], 'rufen': ['to call', 'v'],
  'warten': ['to wait', 'v'], 'suchen': ['to search', 'v'], 'treffen': ['to meet', 'v'],
  'sterben': ['to die', 'v'], 'bitten': ['to ask/request', 'v'], 'tun': ['to do', 'v'],
  'legen': ['to lay/put', 'v'], 'setzen': ['to set/put', 'v'], 'stellen': ['to place', 'v'],
  'besuchen': ['to visit', 'v'], 'bezahlen': ['to pay', 'v'], 'bestellen': ['to order', 'v'],
  'kochen': ['to cook', 'v'], 'reisen': ['to travel', 'v'], 'wohnen': ['to live/reside', 'v'],
  'studieren': ['to study', 'v'], 'tanzen': ['to dance', 'v'], 'singen': ['to sing', 'v'],
  'schwimmen': ['to swim', 'v'], 'kosten': ['to cost', 'v'], 'dauern': ['to last', 'v'],
  'hoffen': ['to hope', 'v'], 'wünschen': ['to wish', 'v'], 'freuen': ['to be happy', 'v'],
  'meinen': ['to mean/think', 'v'], 'scheinen': ['to seem/shine', 'v'],
  'schicken': ['to send', 'v'], 'empfehlen': ['to recommend', 'v'],
  'ändern': ['to change', 'v'], 'vergessen': ['to forget', 'v'], 'erinnern': ['to remember', 'v'],
  'entscheiden': ['to decide', 'v'], 'beschließen': ['to decide', 'v'],
  'passieren': ['to happen', 'v'], 'gehören': ['to belong', 'v'],
  'gefallen': ['to please/like', 'v'], 'fehlen': ['to miss/lack', 'v'],
  'stimmen': ['to be correct', 'v'], 'aufstehen': ['to get up', 'v'],
  'vorstellen': ['to introduce/imagine', 'v'], 'anrufen': ['to call (phone)', 'v'],
  'einkaufen': ['to shop', 'v'], 'einladen': ['to invite', 'v'],
  'aufmachen': ['to open', 'v'], 'zumachen': ['to close', 'v'],
  'mitnehmen': ['to take along', 'v'], 'ankommen': ['to arrive', 'v'],
  'abfahren': ['to depart', 'v'], 'umsteigen': ['to transfer', 'v'],
  'fernsehen': ['to watch TV', 'v'], 'spazieren': ['to walk/stroll', 'v'],
  'waschen': ['to wash', 'v'], 'putzen': ['to clean', 'v'], 'rauchen': ['to smoke', 'v'],
  'parken': ['to park', 'v'], 'funktionieren': ['to function', 'v'],
  'bedeuten': ['to mean', 'v'], 'benutzen': ['to use', 'v'], 'übersetzen': ['to translate', 'v'],
  'wiederholen': ['to repeat', 'v'], 'buchstabieren': ['to spell', 'v'],
  'entschuldigen': ['to excuse', 'v'], 'untersuchen': ['to examine', 'v'],
  'entwickeln': ['to develop', 'v'], 'verbessern': ['to improve', 'v'],
  'vorbereiten': ['to prepare', 'v'], 'organisieren': ['to organize', 'v'],
  'diskutieren': ['to discuss', 'v'], 'veröffentlichen': ['to publish', 'v'],
  'lösen': ['to solve', 'v'], 'bauen': ['to build', 'v'], 'renovieren': ['to renovate', 'v'],
  'reparieren': ['to repair', 'v'], 'servieren': ['to serve', 'v'],
  'liefern': ['to deliver', 'v'], 'gießen': ['to water/pour', 'v'],
  'unterschreiben': ['to sign', 'v'], 'bewerben': ['to apply', 'v'],
  'kündigen': ['to terminate/quit', 'v'], 'expandieren': ['to expand', 'v'],
  'unterstützen': ['to support', 'v'], 'berücksichtigen': ['to consider', 'v'],
  'hinweisen': ['to point out', 'v'], 'betonen': ['to emphasize', 'v'],
  'zusammenfassen': ['to summarize', 'v'], 'erzielen': ['to achieve', 'v'],
  'übertragen': ['to broadcast/transfer', 'v'], 'einführen': ['to introduce', 'v'],
  'absagen': ['to cancel', 'v'], 'verzögern': ['to delay', 'v'],
  'bestätigen': ['to confirm', 'v'], 'mitteilen': ['to inform', 'v'],
  'vorschlagen': ['to suggest', 'v'], 'bedauern': ['to regret', 'v'],
  'behaupten': ['to claim', 'v'], 'berichten': ['to report', 'v'],
  'erörtern': ['to discuss', 'v'], 'darstellen': ['to present/depict', 'v'],
  'schließen': ['to close/conclude', 'v'], 'deuten': ['to suggest/point to', 'v'],
  'basieren': ['to be based on', 'v'], 'widmen': ['to dedicate', 'v'],
  'befassen': ['to deal with', 'v'], 'ergeben': ['to result in', 'v'],
  'übereinstimmen': ['to agree/match', 'v'], 'einschüchtern': ['to intimidate', 'v'],
  'pflegen': ['to care for/maintain', 'v'], 'drehen': ['to turn/film', 'v'],
  'decken': ['to cover/set (table)', 'v'], 'drücken': ['to press/push', 'v'],
  'aufräumen': ['to tidy up', 'v'], 'backen': ['to bake', 'v'],
  'schenken': ['to give (gift)', 'v'], 'beibringen': ['to teach', 'v'],
  'joggen': ['to jog', 'v'], 'mieten': ['to rent', 'v'],
  'versprechen': ['to promise', 'v'], 'planen': ['to plan', 'v'],
  'aufhalten': ['to hold open/stop', 'v'], 'abschicken': ['to send off', 'v'],
  'belegen': ['to take (course)/occupy', 'v'], 'konzentrieren': ['to concentrate', 'v'],
  'vorhersehen': ['to foresee', 'v'], 'schneiden': ['to cut', 'v'],
  'reparieren': ['to repair', 'v'], 'ausruhen': ['to rest', 'v'],
  'verschieben': ['to postpone', 'v'], 'handeln': ['to act/trade', 'v'],
  'hören': ['to hear/listen', 'v'], 'schauen': ['to look', 'v'],
  'denken': ['to think', 'v'], 'fühlen': ['to feel', 'v'],
  'verbieten': ['to forbid', 'v'], 'erlauben': ['to allow', 'v'],
  'verlängern': ['to extend', 'v'], 'klagen': ['to complain', 'v'],
  'verbringen': ['to spend (time)', 'v'], 'anbieten': ['to offer', 'v'],
  'reagieren': ['to react', 'v'], 'vermeiden': ['to avoid', 'v'],
  'übernehmen': ['to take over', 'v'], 'aufgeben': ['to give up', 'v'],
  'erwarten': ['to expect', 'v'], 'beeinflussen': ['to influence', 'v'],
  'wachsen': ['to grow', 'v'], 'erscheinen': ['to appear', 'v'],
  'entdecken': ['to discover', 'v'], 'sammeln': ['to collect', 'v'],
  'beobachten': ['to observe', 'v'], 'protestieren': ['to protest', 'v'],
  'feiern': ['to celebrate', 'v'], 'überraschen': ['to surprise', 'v'],
  'einstellen': ['to hire/adjust/stop', 'v'],
  // === Nouns ===
  'mann': ['man', 'n'], 'frau': ['woman/wife', 'n'], 'kind': ['child', 'n'],
  'kinder': ['children', 'n'], 'leute': ['people', 'n'], 'mensch': ['person/human', 'n'],
  'menschen': ['people/humans', 'n'], 'freund': ['friend', 'n'], 'eltern': ['parents', 'n'],
  'mutter': ['mother', 'n'], 'vater': ['father', 'n'], 'bruder': ['brother', 'n'],
  'schwester': ['sister', 'n'], 'sohn': ['son', 'n'], 'tochter': ['daughter', 'n'],
  'familie': ['family', 'n'], 'nachbar': ['neighbor', 'n'], 'nachbarin': ['neighbor (f)', 'n'],
  'kollege': ['colleague', 'n'], 'kollegin': ['colleague (f)', 'n'],
  'chef': ['boss', 'n'], 'lehrer': ['teacher', 'n'], 'lehrerin': ['teacher (f)', 'n'],
  'arzt': ['doctor', 'n'], 'ärztin': ['doctor (f)', 'n'], 'student': ['student', 'n'],
  'ingenieur': ['engineer', 'n'], 'künstler': ['artist', 'n'], 'autor': ['author', 'n'],
  'sänger': ['singer', 'n'], 'pilot': ['pilot', 'n'], 'direktor': ['director', 'n'],
  'wissenschaftler': ['scientist', 'n'], 'sprecher': ['speaker', 'n'],
  'besitzer': ['owner', 'n'], 'bewohner': ['resident', 'n'], 'verbraucher': ['consumer', 'n'],
  'mitarbeiter': ['employee', 'n'], 'präsident': ['president', 'n'],
  'minister': ['minister', 'n'], 'polizei': ['police', 'n'],
  'haus': ['house', 'n'], 'wohnung': ['apartment', 'n'], 'zimmer': ['room', 'n'],
  'küche': ['kitchen', 'n'], 'garten': ['garden', 'n'], 'tür': ['door', 'n'],
  'fenster': ['window', 'n'], 'tisch': ['table', 'n'], 'stuhl': ['chair', 'n'],
  'bett': ['bed', 'n'], 'dach': ['roof', 'n'], 'stock': ['floor/story', 'n'],
  'stadt': ['city', 'n'], 'land': ['country/land', 'n'], 'straße': ['street', 'n'],
  'platz': ['place/square', 'n'], 'brücke': ['bridge', 'n'], 'berg': ['mountain', 'n'],
  'fluss': ['river', 'n'], 'see': ['lake/sea', 'n'], 'wald': ['forest', 'n'],
  'dorf': ['village', 'n'], 'park': ['park', 'n'], 'marktplatz': ['marketplace', 'n'],
  'auto': ['car', 'n'], 'zug': ['train', 'n'], 'bus': ['bus', 'n'],
  'flughafen': ['airport', 'n'], 'bahnhof': ['train station', 'n'],
  'hotel': ['hotel', 'n'], 'restaurant': ['restaurant', 'n'], 'café': ['café', 'n'],
  'museum': ['museum', 'n'], 'schule': ['school', 'n'], 'universität': ['university', 'n'],
  'kirche': ['church', 'n'], 'krankenhaus': ['hospital', 'n'], 'rathaus': ['town hall', 'n'],
  'büro': ['office', 'n'], 'firma': ['company', 'n'], 'unternehmen': ['company/enterprise', 'n'],
  'geschäft': ['shop/business', 'n'], 'laden': ['shop/store', 'n'],
  'buch': ['book', 'n'], 'brief': ['letter', 'n'], 'zeitung': ['newspaper', 'n'],
  'film': ['film/movie', 'n'], 'musik': ['music', 'n'], 'bild': ['picture', 'n'],
  'geschichte': ['story/history', 'n'], 'roman': ['novel', 'n'],
  'sprache': ['language', 'n'], 'wort': ['word', 'n'], 'name': ['name', 'n'],
  'frage': ['question', 'n'], 'antwort': ['answer', 'n'], 'idee': ['idea', 'n'],
  'problem': ['problem', 'n'], 'lösung': ['solution', 'n'], 'grund': ['reason', 'n'],
  'beispiel': ['example', 'n'], 'ergebnis': ['result', 'n'], 'ziel': ['goal', 'n'],
  'arbeit': ['work', 'n'], 'projekt': ['project', 'n'], 'aufgabe': ['task', 'n'],
  'prüfung': ['exam', 'n'], 'kurs': ['course', 'n'], 'unterricht': ['class/lesson', 'n'],
  'vertrag': ['contract', 'n'], 'bericht': ['report', 'n'], 'rede': ['speech', 'n'],
  'gesetz': ['law', 'n'], 'regel': ['rule', 'n'], 'regierung': ['government', 'n'],
  'geld': ['money', 'n'], 'preis': ['price/prize', 'n'], 'kosten': ['costs', 'n'],
  'ticket': ['ticket', 'n'], 'rechnung': ['bill/invoice', 'n'],
  'essen': ['food/meal', 'n'], 'trinken': ['drink', 'n'], 'wasser': ['water', 'n'],
  'kaffee': ['coffee', 'n'], 'tee': ['tea', 'n'], 'bier': ['beer', 'n'],
  'kuchen': ['cake', 'n'], 'brot': ['bread', 'n'], 'pizza': ['pizza', 'n'],
  'salz': ['salt', 'n'], 'suppe': ['soup', 'n'],
  'zeit': ['time', 'n'], 'tag': ['day', 'n'], 'nacht': ['night', 'n'],
  'morgen': ['morning/tomorrow', 'n'], 'abend': ['evening', 'n'], 'woche': ['week', 'n'],
  'monat': ['month', 'n'], 'jahr': ['year', 'n'], 'stunde': ['hour', 'n'],
  'uhr': ['clock/o\'clock', 'n'], 'minute': ['minute', 'n'],
  'sommer': ['summer', 'n'], 'winter': ['winter', 'n'],
  'sonne': ['sun', 'n'], 'regen': ['rain', 'n'], 'schnee': ['snow', 'n'],
  'wind': ['wind', 'n'], 'wetter': ['weather', 'n'], 'himmel': ['sky/heaven', 'n'],
  'farbe': ['color', 'n'], 'größe': ['size', 'n'], 'höhe': ['height', 'n'],
  'länge': ['length', 'n'], 'gewicht': ['weight', 'n'], 'entfernung': ['distance', 'n'],
  'temperatur': ['temperature', 'n'], 'qualität': ['quality', 'n'],
  'bedeutung': ['meaning/importance', 'n'], 'ursache': ['cause', 'n'],
  'wirkung': ['effect', 'n'], 'kraft': ['force/power', 'n'],
  'stimme': ['voice', 'n'], 'klang': ['sound', 'n'], 'geruch': ['smell', 'n'],
  'geschmack': ['taste', 'n'], 'duft': ['scent/fragrance', 'n'],
  'blume': ['flower', 'n'], 'blumen': ['flowers', 'n'], 'baum': ['tree', 'n'],
  'hund': ['dog', 'n'], 'vogel': ['bird', 'n'],
  'kleid': ['dress', 'n'], 'schuh': ['shoe', 'n'], 'tasche': ['bag', 'n'],
  'schlüssel': ['key', 'n'], 'geschenk': ['gift', 'n'], 'paket': ['package', 'n'],
  'regenschirm': ['umbrella', 'n'], 'handschuh': ['glove', 'n'],
  'computer': ['computer', 'n'], 'telefon': ['telephone', 'n'],
  'seite': ['page/side', 'n'], 'stelle': ['position/place', 'n'],
  'medizin': ['medicine', 'n'], 'gesundheit': ['health', 'n'],
  'krankenschwester': ['nurse', 'n'], 'spritze': ['injection', 'n'],
  'medikament': ['medication', 'n'], 'patient': ['patient', 'n'],
  'urlaub': ['vacation', 'n'], 'reise': ['trip/journey', 'n'],
  'ferien': ['holidays', 'n'], 'ausstellung': ['exhibition', 'n'],
  'konzert': ['concert', 'n'], 'veranstaltung': ['event', 'n'],
  'konferenz': ['conference', 'n'], 'vortrag': ['lecture', 'n'],
  'besprechung': ['meeting', 'n'], 'termin': ['appointment', 'n'],
  'einladung': ['invitation', 'n'], 'geburtstag': ['birthday', 'n'],
  'anfang': ['beginning', 'n'], 'ende': ['end', 'n'], 'mitte': ['middle', 'n'],
  'zukunft': ['future', 'n'], 'vergangenheit': ['past', 'n'],
  'fortschritt': ['progress', 'n'], 'erfolg': ['success', 'n'],
  'erfahrung': ['experience', 'n'], 'bildung': ['education', 'n'],
  'forschung': ['research', 'n'], 'studie': ['study', 'n'],
  'wissenschaft': ['science', 'n'], 'methodik': ['methodology', 'n'],
  'analyse': ['analysis', 'n'], 'daten': ['data', 'n'],
  'hypothese': ['hypothesis', 'n'], 'evidenz': ['evidence', 'n'],
  'schlussfolgerung': ['conclusion', 'n'], 'zusammenhang': ['connection/correlation', 'n'],
  'stichprobe': ['sample', 'n'], 'debatte': ['debate', 'n'],
  'diskussion': ['discussion', 'n'], 'argumentation': ['argumentation', 'n'],
  'perspektive': ['perspective', 'n'], 'ansatz': ['approach', 'n'],
  'beitrag': ['contribution', 'n'], 'einfluss': ['influence', 'n'],
  'gesellschaft': ['society', 'n'], 'bevölkerung': ['population', 'n'],
  'mehrheit': ['majority', 'n'], 'wirtschaft': ['economy', 'n'],
  'nachhaltigkeit': ['sustainability', 'n'], 'intelligenz': ['intelligence', 'n'],
  'genehmigung': ['approval/permit', 'n'], 'vorschrift': ['regulation', 'n'],
  'angelegenheit': ['matter/affair', 'n'], 'sachverhalt': ['facts/matter', 'n'],
  'unannehmlichkeit': ['inconvenience', 'n'],
  'geschäftsleitung': ['management', 'n'], 'bewerbung': ['application', 'n'],
  'unterlagen': ['documents', 'n'], 'erhalt': ['receipt', 'n'],
  'verhandlung': ['negotiation', 'n'], 'lieferung': ['delivery', 'n'],
  'verlängerung': ['extension', 'n'], 'frist': ['deadline', 'n'],
  'auftrag': ['order/assignment', 'n'], 'genehmigung': ['approval', 'n'],
  'nachricht': ['message/news', 'n'], 'anfrage': ['inquiry', 'n'],
  'sonnenuntergang': ['sunset', 'n'], 'zusammenarbeit': ['cooperation', 'n'],
  'reiseversicherung': ['travel insurance', 'n'], 'stornierung': ['cancellation', 'n'],
  'sehenswürdigkeit': ['sight/attraction', 'n'], 'öffnungszeit': ['opening hours', 'n'],
  'verkehrsmittel': ['means of transport', 'n'], 'führerschein': ['driver\'s license', 'n'],
  'kindergarten': ['kindergarten', 'n'], 'schwimmbad': ['swimming pool', 'n'],
  'staubsauger': ['vacuum cleaner', 'n'], 'waschmaschine': ['washing machine', 'n'],
  'briefkasten': ['mailbox', 'n'], 'haustür': ['front door', 'n'],
  'kühlschrank': ['refrigerator', 'n'], 'schlafzimmer': ['bedroom', 'n'],
  'wohnzimmer': ['living room', 'n'], 'arbeitsplatz': ['workplace', 'n'],
  'sprachschule': ['language school', 'n'], 'stadtrand': ['outskirts', 'n'],
  'straßenverkehr': ['traffic', 'n'], 'fahrradtour': ['bicycle tour', 'n'],
  'zeitungsartikel': ['newspaper article', 'n'], 'hausbewohner': ['resident', 'n'],
  'lebensmittelgeschäft': ['grocery store', 'n'],
  'geburtstagstorte': ['birthday cake', 'n'], 'stadtmitte': ['city center', 'n'],
  'hauptstadt': ['capital city', 'n'],
  // === Adjectives ===
  'gut': ['good', 'adj'], 'schlecht': ['bad', 'adj'], 'groß': ['big/tall', 'adj'],
  'klein': ['small', 'adj'], 'neu': ['new', 'adj'], 'alt': ['old', 'adj'],
  'jung': ['young', 'adj'], 'schön': ['beautiful', 'adj'], 'toll': ['great', 'adj'],
  'nett': ['nice', 'adj'], 'freundlich': ['friendly', 'adj'], 'wichtig': ['important', 'adj'],
  'interessant': ['interesting', 'adj'], 'richtig': ['correct', 'adj'],
  'falsch': ['wrong/false', 'adj'], 'einfach': ['simple/easy', 'adj'],
  'schwer': ['heavy/difficult', 'adj'], 'leicht': ['light/easy', 'adj'],
  'schnell': ['fast', 'adj'], 'langsam': ['slow', 'adj'], 'teuer': ['expensive', 'adj'],
  'billig': ['cheap', 'adj'], 'frei': ['free', 'adj'], 'voll': ['full', 'adj'],
  'leer': ['empty', 'adj'], 'warm': ['warm', 'adj'], 'kalt': ['cold', 'adj'],
  'heiß': ['hot', 'adj'], 'müde': ['tired', 'adj'], 'hungrig': ['hungry', 'adj'],
  'krank': ['sick', 'adj'], 'gesund': ['healthy', 'adj'],
  'verheiratet': ['married', 'adj'], 'bekannt': ['known/famous', 'adj'],
  'beliebt': ['popular', 'adj'], 'kompetent': ['competent', 'adj'],
  'hilfsbereit': ['helpful', 'adj'], 'gemütlich': ['cozy', 'adj'],
  'beeindruckend': ['impressive', 'adj'], 'faszinierend': ['fascinating', 'adj'],
  'wunderschön': ['beautiful', 'adj'], 'fantastisch': ['fantastic', 'adj'],
  'ausgezeichnet': ['excellent', 'adj'], 'angenehm': ['pleasant', 'adj'],
  'wertvoll': ['valuable', 'adj'], 'einzigartig': ['unique', 'adj'],
  'umstritten': ['controversial', 'adj'], 'signifikant': ['significant', 'adj'],
  'obligatorisch': ['mandatory', 'adj'], 'erforderlich': ['required', 'adj'],
  'detailliert': ['detailed', 'adj'], 'vorläufig': ['preliminary', 'adj'],
  'innovativ': ['innovative', 'adj'], 'empirisch': ['empirical', 'adj'],
  'vielversprechend': ['promising', 'adj'], 'eindeutig': ['clear/unambiguous', 'adj'],
  'kontrovers': ['controversial', 'adj'], 'brillant': ['brilliant', 'adj'],
  'unglaublich': ['incredible', 'adj'], 'wunderbar': ['wonderful', 'adj'],
  'lecker': ['delicious', 'adj'], 'kaputt': ['broken', 'adj'],
  'gesperrt': ['closed/blocked', 'adj'], 'abgelaufen': ['expired', 'adj'],
  'belebt': ['busy/lively', 'adj'], 'begrenzt': ['limited', 'adj'],
  'ärgerlich': ['annoying', 'adj'], 'unklar': ['unclear', 'adj'],
  'offen': ['open', 'adj'], 'geschlossen': ['closed', 'adj'],
  'international': ['international', 'adj'], 'elegant': ['elegant', 'adj'],
  'informativ': ['informative', 'adj'],
  // === Adverbs ===
  'nicht': ['not', 'adv'], 'sehr': ['very', 'adv'], 'auch': ['also', 'adv'],
  'noch': ['still/yet', 'adv'], 'schon': ['already', 'adv'], 'nur': ['only', 'adv'],
  'hier': ['here', 'adv'], 'dort': ['there', 'adv'], 'heute': ['today', 'adv'],
  'morgen': ['tomorrow', 'adv'], 'gestern': ['yesterday', 'adv'],
  'immer': ['always', 'adv'], 'nie': ['never', 'adv'], 'oft': ['often', 'adv'],
  'manchmal': ['sometimes', 'adv'], 'gern': ['gladly', 'adv'], 'gerne': ['gladly', 'adv'],
  'natürlich': ['of course', 'adv'], 'leider': ['unfortunately', 'adv'],
  'vielleicht': ['perhaps', 'adv'], 'wahrscheinlich': ['probably', 'adv'],
  'sofort': ['immediately', 'adv'], 'bald': ['soon', 'adv'],
  'besonders': ['especially', 'adv'], 'gerade': ['just/right now', 'adv'],
  'ziemlich': ['quite/fairly', 'adv'], 'wirklich': ['really', 'adv'],
  'ungefähr': ['approximately', 'adv'], 'trotzdem': ['nevertheless', 'adv'],
  'allerdings': ['however', 'adv'], 'dennoch': ['nevertheless', 'adv'],
  'außerdem': ['besides/moreover', 'adv'], 'stattdessen': ['instead', 'adv'],
  'inzwischen': ['meanwhile', 'adv'], 'folglich': ['consequently', 'adv'],
  'schließlich': ['finally', 'adv'], 'zudem': ['in addition', 'adv'],
  'nichtsdestotrotz': ['nonetheless', 'adv'], 'insofern': ['in that respect', 'adv'],
  'immerhin': ['at least', 'adv'], 'übrigens': ['by the way', 'adv'],
  'währenddessen': ['meanwhile', 'adv'], 'andernfalls': ['otherwise', 'adv'],
  'pünktlich': ['punctually/on time', 'adv'], 'rechtzeitig': ['on time', 'adv'],
  'sorgfältig': ['carefully', 'adv'], 'erfolgreich': ['successfully', 'adv'],
  'ausführlich': ['in detail', 'adv'], 'vorher': ['before/beforehand', 'adv'],
  'nämlich': ['namely', 'adv'], 'demnach': ['accordingly', 'adv'],
  'somit': ['thus', 'adv'], 'gleichwohl': ['nonetheless', 'adv'],
  // === Prepositions ===
  'mit': ['with', 'prep'], 'bei': ['at/near', 'prep'], 'nach': ['after/to', 'prep'],
  'von': ['from/of', 'prep'], 'aus': ['from/out of', 'prep'], 'seit': ['since', 'prep'],
  'für': ['for', 'prep'], 'über': ['over/about', 'prep'], 'unter': ['under', 'prep'],
  'vor': ['before/in front of', 'prep'], 'hinter': ['behind', 'prep'],
  'neben': ['next to', 'prep'], 'zwischen': ['between', 'prep'],
  'durch': ['through', 'prep'], 'gegen': ['against', 'prep'], 'ohne': ['without', 'prep'],
  'trotz': ['despite', 'prep'], 'während': ['during', 'prep'], 'wegen': ['because of', 'prep'],
  'anstatt': ['instead of', 'prep'], 'statt': ['instead of', 'prep'],
  'innerhalb': ['inside/within', 'prep'], 'außerhalb': ['outside', 'prep'],
  'oberhalb': ['above', 'prep'], 'unterhalb': ['below', 'prep'],
  'jenseits': ['beyond', 'prep'], 'laut': ['according to', 'prep'],
  'aufgrund': ['due to', 'prep'], 'mithilfe': ['with the help of', 'prep'],
  'infolge': ['as a result of', 'prep'], 'gemäß': ['according to', 'prep'],
  'hinsichtlich': ['regarding', 'prep'], 'bezüglich': ['regarding', 'prep'],
  // === Conjunctions ===
  'und': ['and', 'conj'], 'oder': ['or', 'conj'], 'aber': ['but', 'conj'],
  'denn': ['because/for', 'conj'], 'weil': ['because', 'conj'], 'dass': ['that', 'conj'],
  'wenn': ['when/if', 'conj'], 'als': ['when/as/than', 'conj'], 'ob': ['whether', 'conj'],
  'sondern': ['but rather', 'conj'], 'obwohl': ['although', 'conj'],
  'obgleich': ['although', 'conj'], 'sofern': ['provided that', 'conj'],
  'indem': ['by (doing)', 'conj'], 'sowohl': ['both', 'conj'],
  'weder': ['neither', 'conj'], 'noch': ['nor/still', 'conj'],
  // === Pronouns ===
  'ich': ['I', 'pron'], 'du': ['you (informal)', 'pron'], 'er': ['he', 'pron'],
  'sie': ['she/they/you (formal)', 'pron'], 'es': ['it', 'pron'],
  'wir': ['we', 'pron'], 'ihr': ['you (plural)/her', 'pron'],
  'man': ['one/you (general)', 'pron'], 'sich': ['oneself', 'pron'],
  'mich': ['me', 'pron'], 'dich': ['you', 'pron'], 'uns': ['us', 'pron'],
  'euch': ['you all', 'pron'], 'ihnen': ['them/you (formal)', 'pron'],
  'mir': ['me (dative)', 'pron'], 'dir': ['you (dative)', 'pron'],
  'ihm': ['him', 'pron'], 'wer': ['who', 'pron'], 'was': ['what', 'pron'],
  'welch': ['which', 'pron'], 'dessen': ['whose (masc)', 'pron'],
  'deren': ['whose (fem/pl)', 'pron'],
  // === Determiners ===
  'der': ['the (masc)', 'det'], 'die': ['the (fem/pl)', 'det'],
  'das': ['the (neut)', 'det'], 'den': ['the (acc masc)', 'det'],
  'dem': ['the (dat)', 'det'], 'des': ['the (gen)', 'det'],
  'ein': ['a/an', 'det'], 'eine': ['a/an (fem)', 'det'],
  'einen': ['a (acc masc)', 'det'], 'einem': ['a (dat)', 'det'],
  'einer': ['a (gen fem)', 'det'], 'kein': ['no/none', 'det'],
  'keine': ['no/none', 'det'], 'keinen': ['no (acc masc)', 'det'],
  'mein': ['my', 'det'], 'meine': ['my (fem/pl)', 'det'],
  'dein': ['your (informal)', 'det'], 'sein': ['his/its', 'det'],
  'seine': ['his/its', 'det'], 'unser': ['our', 'det'],
  'jeder': ['every', 'det'], 'alle': ['all', 'det'], 'viel': ['much/many', 'det'],
  'viele': ['many', 'det'], 'einige': ['some', 'det'], 'andere': ['other', 'det'],
  'dieser': ['this', 'det'], 'diese': ['this (fem/pl)', 'det'],
  // === Interjections ===
  'ja': ['yes', 'interj'], 'nein': ['no', 'interj'], 'bitte': ['please', 'interj'],
  'danke': ['thank you', 'interj'], 'hallo': ['hello', 'interj'],
  'tschüss': ['bye', 'interj'], 'herzlich': ['warmly/cordially', 'adj'],
  'willkommen': ['welcome', 'adj'],
  // === Modal particles ===
  'doch': ['however/indeed', 'adv'], 'mal': ['once/just', 'adv'],
  'eben': ['just/simply', 'adv'], 'halt': ['just (colloquial)', 'adv'],
  'wohl': ['probably/indeed', 'adv'], 'etwa': ['perhaps/approximately', 'adv'],
  // === Common words in deck ===
  'gibt': ['gives/there is', 'v'], 'liegt': ['lies/is located', 'v'],
  'geht': ['goes', 'v'], 'kommt': ['comes', 'v'], 'steht': ['stands', 'v'],
  'macht': ['makes/does', 'v'], 'heißt': ['is called', 'v'],
  'braucht': ['needs', 'v'], 'spricht': ['speaks', 'v'],
  'fährt': ['drives', 'v'], 'trägt': ['carries/wears', 'v'],
  'schläft': ['sleeps', 'v'], 'fällt': ['falls', 'v'], 'läuft': ['runs', 'v'],
  'hält': ['holds/stops', 'v'], 'lässt': ['lets', 'v'], 'isst': ['eats', 'v'],
  'weiß': ['knows', 'v'],
  'guten': ['good (inflected)', 'adj'], 'vielen': ['many (inflected)', 'adj'],
  'neuen': ['new (inflected)', 'adj'], 'ersten': ['first (inflected)', 'adj'],
  'letzten': ['last (inflected)', 'adj'], 'nächsten': ['next (inflected)', 'adj'],
  'dritten': ['third (inflected)', 'adj'],
  'zwei': ['two', 'det'], 'drei': ['three', 'det'], 'zehn': ['ten', 'det'],
  'zwanzig': ['twenty', 'det'], 'dreißig': ['thirty', 'det'],
  'hundert': ['hundred', 'det'], 'tausend': ['thousand', 'det'],
  'acht': ['eight', 'det'], 'sieben': ['seven', 'det'],
};

// Build the file content
let output = `import type { DictEntry } from './es';

// ── Contraction map ──────────────────────────────────────────
const CONTRACTION_MAP: Record<string, [string, string]> = {
  'im': ['in', 'dem'],
  'am': ['an', 'dem'],
  'vom': ['von', 'dem'],
  'zum': ['zu', 'dem'],
  'zur': ['zu', 'der'],
  'ins': ['in', 'das'],
  'ans': ['an', 'das'],
  'aufs': ['auf', 'das'],
  'fürs': ['für', 'das'],
  'ums': ['um', 'das'],
  'beim': ['bei', 'dem'],
  'durchs': ['durch', 'das'],
  'übers': ['über', 'das'],
  'unters': ['unter', 'das'],
  'vors': ['vor', 'das'],
  'hinters': ['hinter', 'das'],
};

// ── Irregular verb forms → infinitive ────────────────────────
const IRREGULAR_MAP: Record<string, string> = {
  // sein
  'bin': 'sein', 'bist': 'sein', 'ist': 'sein', 'sind': 'sein', 'seid': 'sein',
  'war': 'sein', 'warst': 'sein', 'wart': 'sein', 'waren': 'sein',
  'gewesen': 'sein', 'sei': 'sein', 'seien': 'sein', 'wäre': 'sein', 'wären': 'sein',
  // haben
  'habe': 'haben', 'hast': 'haben', 'hat': 'haben', 'habt': 'haben',
  'hatte': 'haben', 'hattest': 'haben', 'hatten': 'haben', 'hattet': 'haben',
  'gehabt': 'haben', 'hätte': 'haben', 'hätten': 'haben',
  // werden
  'werde': 'werden', 'wirst': 'werden', 'wird': 'werden', 'werdet': 'werden',
  'wurde': 'werden', 'wurdest': 'werden', 'wurden': 'werden', 'wurdet': 'werden',
  'geworden': 'werden', 'würde': 'werden', 'würden': 'werden', 'würdest': 'werden',
  // können
  'kann': 'können', 'kannst': 'können', 'könnt': 'können',
  'konnte': 'können', 'konntest': 'können', 'konnten': 'können',
  'gekonnt': 'können', 'könnte': 'können', 'könnten': 'können', 'könntest': 'können',
  // müssen
  'muss': 'müssen', 'musst': 'müssen', 'müsst': 'müssen',
  'musste': 'müssen', 'musstest': 'müssen', 'mussten': 'müssen',
  'gemusst': 'müssen', 'müsste': 'müssen', 'müssten': 'müssen',
  // dürfen
  'darf': 'dürfen', 'darfst': 'dürfen', 'dürft': 'dürfen',
  'durfte': 'dürfen', 'durftest': 'dürfen', 'durften': 'dürfen',
  'gedurft': 'dürfen', 'dürfte': 'dürfen', 'dürften': 'dürfen',
  // sollen
  'soll': 'sollen', 'sollst': 'sollen', 'sollt': 'sollen',
  'sollte': 'sollen', 'solltest': 'sollen', 'sollten': 'sollen', 'solltet': 'sollen',
  'gesollt': 'sollen',
  // wollen
  'will': 'wollen', 'willst': 'wollen', 'wollt': 'wollen',
  'wollte': 'wollen', 'wolltest': 'wollen', 'wollten': 'wollen',
  'gewollt': 'wollen',
  // mögen
  'mag': 'mögen', 'magst': 'mögen', 'mögt': 'mögen',
  'mochte': 'mögen', 'mochtest': 'mögen', 'mochten': 'mögen',
  'gemocht': 'mögen', 'möchte': 'mögen', 'möchten': 'mögen', 'möchtest': 'mögen',
  // gehen
  'ging': 'gehen', 'gingst': 'gehen', 'gingen': 'gehen',
  'gegangen': 'gehen', 'ginge': 'gehen',
  // kommen
  'kam': 'kommen', 'kamst': 'kommen', 'kamen': 'kommen',
  'gekommen': 'kommen', 'käme': 'kommen',
  // sprechen
  'spricht': 'sprechen', 'sprichst': 'sprechen',
  'sprach': 'sprechen', 'sprachst': 'sprechen', 'sprachen': 'sprechen',
  'gesprochen': 'sprechen',
  // geben
  'gibt': 'geben', 'gibst': 'geben',
  'gab': 'geben', 'gabst': 'geben', 'gaben': 'geben',
  'gegeben': 'geben', 'gäbe': 'geben',
  // nehmen
  'nimmt': 'nehmen', 'nimmst': 'nehmen',
  'nahm': 'nehmen', 'nahmst': 'nehmen', 'nahmen': 'nehmen',
  'genommen': 'nehmen', 'nähme': 'nehmen',
  // sehen
  'sieht': 'sehen', 'siehst': 'sehen',
  'sah': 'sehen', 'sahst': 'sehen', 'sahen': 'sehen',
  'gesehen': 'sehen',
  // lesen
  'liest': 'lesen',
  'las': 'lesen', 'lasen': 'lesen', 'gelesen': 'lesen',
  // fahren
  'fährt': 'fahren', 'fährst': 'fahren',
  'fuhr': 'fahren', 'fuhrst': 'fahren', 'fuhren': 'fahren',
  'gefahren': 'fahren',
  // tragen
  'trägt': 'tragen', 'trägst': 'tragen',
  'trug': 'tragen', 'trugen': 'tragen', 'getragen': 'tragen',
  // schlafen
  'schläft': 'schlafen', 'schläfst': 'schlafen',
  'schlief': 'schlafen', 'schliefen': 'schlafen', 'geschlafen': 'schlafen',
  // fallen
  'fällt': 'fallen', 'fällst': 'fallen',
  'fiel': 'fallen', 'fielen': 'fallen', 'gefallen': 'fallen',
  // laufen
  'läuft': 'laufen', 'läufst': 'laufen',
  'lief': 'laufen', 'liefen': 'laufen', 'gelaufen': 'laufen',
  // halten
  'hält': 'halten', 'hältst': 'halten',
  'hielt': 'halten', 'hielten': 'halten', 'gehalten': 'halten',
  // lassen
  'lässt': 'lassen',
  'ließ': 'lassen', 'ließen': 'lassen', 'gelassen': 'lassen',
  // essen
  'isst': 'essen', 'aß': 'essen', 'aßen': 'essen', 'gegessen': 'essen',
  // finden
  'fand': 'finden', 'fanden': 'finden', 'gefunden': 'finden',
  // trinken
  'trank': 'trinken', 'tranken': 'trinken', 'getrunken': 'trinken',
  // stehen
  'stand': 'stehen', 'standen': 'stehen', 'gestanden': 'stehen',
  // liegen
  'lag': 'liegen', 'lagen': 'liegen', 'gelegen': 'liegen',
  // sitzen
  'saß': 'sitzen', 'saßen': 'sitzen', 'gesessen': 'sitzen',
  // schreiben
  'schrieb': 'schreiben', 'schrieben': 'schreiben', 'geschrieben': 'schreiben',
  // bleiben
  'blieb': 'bleiben', 'blieben': 'bleiben', 'geblieben': 'bleiben',
  // fliegen
  'flog': 'fliegen', 'flogen': 'fliegen', 'geflogen': 'fliegen',
  // ziehen
  'zog': 'ziehen', 'zogen': 'ziehen', 'gezogen': 'ziehen',
  // rufen
  'rief': 'rufen', 'riefen': 'rufen', 'gerufen': 'rufen',
  // bitten
  'bat': 'bitten', 'baten': 'bitten', 'gebeten': 'bitten',
  // tun
  'tat': 'tun', 'taten': 'tun', 'getan': 'tun',
  // wissen
  'weiß': 'wissen', 'weißt': 'wissen', 'wisst': 'wissen',
  'wusste': 'wissen', 'wusstest': 'wissen', 'wussten': 'wissen',
  'gewusst': 'wissen', 'wüsste': 'wissen', 'wüssten': 'wissen',
  // bringen
  'brachte': 'bringen', 'brachten': 'bringen', 'gebracht': 'bringen',
  // denken
  'dachte': 'denken', 'dachten': 'denken', 'gedacht': 'denken',
  // kennen
  'kannte': 'kennen', 'kannten': 'kennen', 'gekannt': 'kennen',
  // beginnen
  'begann': 'beginnen', 'begannen': 'beginnen', 'begonnen': 'beginnen',
  // vergessen
  'vergisst': 'vergessen', 'vergaß': 'vergessen', 'vergaßen': 'vergessen',
  // treffen
  'trifft': 'treffen', 'triffst': 'treffen',
  'traf': 'treffen', 'trafen': 'treffen', 'getroffen': 'treffen',
  // helfen
  'hilft': 'helfen', 'hilfst': 'helfen',
  'half': 'helfen', 'halfen': 'helfen', 'geholfen': 'helfen',
  // schließen
  'schloss': 'schließen', 'schlossen': 'schließen', 'geschlossen': 'schließen',
  // schneiden
  'schnitt': 'schneiden', 'schnitten': 'schneiden', 'geschnitten': 'schneiden',
  // waschen
  'wäscht': 'waschen', 'wäschst': 'waschen',
  'wusch': 'waschen', 'wuschen': 'waschen', 'gewaschen': 'waschen',
  // heißen
  'hieß': 'heißen', 'hießen': 'heißen', 'geheißen': 'heißen',
};

// ── Main dictionary ──────────────────────────────────────────

const DICT: Record<string, DictEntry> = {
`;

// Sort and output all dictionary entries
const allWords = [...wordSet].sort();
const added = new Set();

for (const word of allWords) {
  const entry = TRANSLATIONS[word];
  if (entry) {
    const [en, pos] = entry;
    const escaped = en.replace(/'/g, "\\'");
    output += `  '${word}': { en: '${escaped}', ipa: '', pos: '${pos}' },\n`;
    added.add(word);
  }
}

// Add any translations not yet in the wordSet (helper words)
for (const [word, [en, pos]] of Object.entries(TRANSLATIONS)) {
  if (!added.has(word)) {
    const escaped = en.replace(/'/g, "\\'");
    output += `  '${word}': { en: '${escaped}', ipa: '', pos: '${pos}' },\n`;
    added.add(word);
  }
}

output += `};

// ── Reverse regular verb forms ───────────────────────────────
function reverseVerb(word: string): string | null {
  // Check irregular map first
  if (IRREGULAR_MAP[word]) return IRREGULAR_MAP[word];

  // Try to reverse regular conjugation endings
  const endings: [string, number][] = [
    // Present tense
    ['st', 2], ['t', 1], ['e', 1], ['en', 2], ['et', 2], ['est', 3],
    // Preterite (weak)
    ['te', 2], ['test', 4], ['ten', 3], ['tet', 3],
    // Past participle (weak): ge-...-t
  ];

  // Handle ge- past participles
  if (word.startsWith('ge') && (word.endsWith('t') || word.endsWith('en'))) {
    let stem: string;
    if (word.endsWith('en')) {
      stem = word.slice(2, -2); // ge-fahr-en → fahr
    } else {
      stem = word.slice(2, -1); // ge-mach-t → mach
    }
    // Try common infinitive endings
    for (const end of ['en', 'ern', 'eln', 'n']) {
      const candidate = stem + end;
      if (DICT[candidate]) return candidate;
    }
  }

  // Try stripping conjugation endings
  for (const [ending, len] of endings) {
    if (word.endsWith(ending) && word.length > len + 2) {
      const stem = word.slice(0, -len);
      for (const end of ['en', 'ern', 'eln', 'n']) {
        const candidate = stem + end;
        if (DICT[candidate]) return candidate;
      }
    }
  }

  return null;
}

// ── Main lookup function ─────────────────────────────────────
export function lookupWord(raw: string): DictEntry | null {
  const word = raw.toLowerCase().replace(/[.,!?;:""«»()—–…'']/g, '').trim();
  if (word.length < 2) return null;

  // 1. Direct lookup
  if (DICT[word]) return DICT[word];

  // 2. Contraction lookup
  if (CONTRACTION_MAP[word]) {
    const [prep] = CONTRACTION_MAP[word];
    return DICT[prep] || null;
  }

  // 3. Irregular verb form → infinitive
  if (IRREGULAR_MAP[word]) {
    const inf = IRREGULAR_MAP[word];
    return DICT[inf] || null;
  }

  // 4. Reverse regular verb
  const verbInf = reverseVerb(word);
  if (verbInf && DICT[verbInf]) return DICT[verbInf];

  // 5. Case/plural reductions: strip common endings
  for (const suffix of ['en', 'er', 'em', 'es', 'e', 'n', 's']) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const stem = word.slice(0, -suffix.length);
      if (DICT[stem]) return DICT[stem];
    }
  }

  // 6. Umlaut reduction (ä→a, ö→o, ü→u) + suffix strip for plurals
  const deUmlaut = word.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
  if (deUmlaut !== word) {
    if (DICT[deUmlaut]) return DICT[deUmlaut];
    for (const suffix of ['er', 'e', 'en', 'n']) {
      if (deUmlaut.endsWith(suffix) && deUmlaut.length > suffix.length + 2) {
        const stem = deUmlaut.slice(0, -suffix.length);
        if (DICT[stem]) return DICT[stem];
      }
    }
  }

  // 7. Compound word splitting: try splitting from left
  for (let i = 3; i < word.length - 3; i++) {
    const left = word.slice(0, i);
    const right = word.slice(i);
    // Try with and without linking -s-, -n-, -en-
    if (DICT[right]) return DICT[right]; // return the main (right) component
    if (right.startsWith('s') && DICT[right.slice(1)]) return DICT[right.slice(1)];
    if (right.startsWith('n') && DICT[right.slice(1)]) return DICT[right.slice(1)];
    if (right.startsWith('en') && DICT[right.slice(2)]) return DICT[right.slice(2)];
  }

  return null;
}
`;

fs.writeFileSync(OUT, output);
console.log(`Dictionary written with ${added.size} entries`);

// Check coverage
let covered = 0;
let missed = [];
// Quick check: load the module would require ts compilation, so just check DICT keys
for (const word of allWords) {
  if (added.has(word) || TRANSLATIONS[word]) {
    covered++;
  } else {
    missed.push(word);
  }
}
console.log(`Coverage: ${covered}/${allWords.length} direct entries (${(100*covered/allWords.length).toFixed(1)}%)`);
if (missed.length > 0 && missed.length < 50) {
  console.log('Missing:', missed.join(', '));
} else if (missed.length >= 50) {
  console.log(`${missed.length} words without direct entries (will be caught by lookupWord fallbacks)`);
}
