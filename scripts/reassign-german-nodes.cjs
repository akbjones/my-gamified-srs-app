#!/usr/bin/env node
/**
 * Reassign German deck cards to grammar nodes based on morphological analysis.
 *
 * - Force-reassign cards from the 4 renamed theme nodes (01, 07, 12, 17)
 * - Only move cards from existing grammar nodes if score difference > 12
 * - Rebalance to 80-200 per node
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'german', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// The 4 renamed theme nodes that need force-reassignment
const THEME_NODES = new Set(['node-01', 'node-07', 'node-12', 'node-17']);

// Node definitions with grammar markers
const NODES = {
  'node-01': {
    name: 'Personal pronouns & present tense',
    tier: 'A1',
    dePatterns: [
      /\b(ich|du|er|sie|es|wir|ihr|Sie)\s+\S+[eE]\b/i,  // pronoun + verb
      /\bich\s+(bin|habe|gehe|komme|mache|sage|frage|lese|schreibe|arbeite|spiele|wohne|lerne|esse|trinke|sehe|höre|spreche|denke|finde|brauche)\b/i,
      /\bdu\s+\S+st\b/i,                     // du + -st ending
      /\ber\s+\S+t\b/i,                      // er + -t ending
      /\bsie\s+\S+t\b/i,                     // sie + -t ending
      /\bwir\s+\S+en\b/i,                    // wir + -en ending
      /\bihr\s+\S+t\b/i,                     // ihr + -t ending
      /\b(mache|machst|macht|machen)\b/i,
      /\b(gehe|gehst|geht|gehen)\b/i,
      /\b(komme|kommst|kommt|kommen)\b/i,
      /\b(sage|sagst|sagt|sagen)\b/i,
      /\b(spiele|spielst|spielt|spielen)\b/i,
      /\b(arbeite|arbeitest|arbeitet|arbeiten)\b/i,
      /\b(lerne|lernst|lernt|lernen)\b/i,
    ],
    enPatterns: [
      /\bI\s+(am|have|go|come|make|say|ask|read|write|work|play|live|learn|eat|drink|see|hear|speak|think|find|need)\b/i,
      /\byou\s+(are|have|go|come|make|say|work|play|live|learn)\b/i,
      /\b(he|she)\s+(is|has|goes|comes|makes|says|works|plays|lives|learns)\b/i,
      /\bwe\s+(are|have|go|come|make|say|work|play|live|learn)\b/i,
    ],
    tipPatterns: [/pronoun/i, /present\s*tense/i, /\-e\/\-st\/\-t/i, /verb\s*ending/i],
  },
  'node-02': {
    name: 'Present tense regular verbs',
    tier: 'A1',
    dePatterns: [
      /\b\S+e\b/,                            // -e ending (ich)
      /\b\S+st\b/,                           // -st ending (du)
      /\b\S+t\b/,                            // -t ending (er/sie/es/ihr)
      /\b\S+en\b/,                           // -en ending (wir/sie/Sie)
      /\b(lerne|lernst|lernt|lernen)\b/i,
      /\b(wohne|wohnst|wohnt|wohnen)\b/i,
      /\b(spiele|spielst|spielt|spielen)\b/i,
      /\b(kaufe|kaufst|kauft|kaufen)\b/i,
    ],
    enPatterns: [
      /\b(learn|live|play|buy|work|make|say|ask|go)\b/i,
    ],
    tipPatterns: [/regular\s*verb/i, /present\s*tense/i, /conjugat/i],
  },
  'node-03': {
    name: 'Sein vs haben',
    tier: 'A1',
    dePatterns: [
      /\b(bin|bist|ist|sind|seid)\b/i,       // sein
      /\b(habe|hast|hat|haben|habt)\b/i,     // haben
      /\b(war|warst|waren|wart)\b/i,         // sein past
      /\b(hatte|hattest|hatten|hattet)\b/i,   // haben past
      /\b(gewesen|gehabt)\b/i,               // participles
    ],
    enPatterns: [
      /\b(am|is|are|was|were|been)\b/i,
      /\b(have|has|had)\b/i,
    ],
    tipPatterns: [/\bsein\b/i, /\bhaben\b/i, /to be/i, /to have/i],
  },
  'node-04': {
    name: 'Articles & gender (der/die/das)',
    tier: 'A1',
    dePatterns: [
      /\b(der|die|das|den|dem|des)\s+\S+\b/,
      /\b(ein|eine|einen|einem|einer|eines)\s+\S+\b/,
      /\bdie\s+\S+en\b/,                     // plural
    ],
    enPatterns: [
      /\b(the|a|an)\s+\S+\b/i,
    ],
    tipPatterns: [/article/i, /gender/i, /der\/die\/das/i, /masculine|feminine|neuter/i],
  },
  'node-05': {
    name: 'Word order (V2 rule)',
    tier: 'A1',
    dePatterns: [
      /^(Heute|Morgen|Gestern|Manchmal|Oft|Hier|Dort|Jetzt|Dann|Leider|Normalerweise|Meistens)\s+\S+\s+(ich|du|er|sie|es|wir|ihr|man)\b/i,  // time/place first, then verb, then subject
      /^(Am|Im|Um|Seit|Vor|Nach)\s+\S+\s+\S+\s+(ich|du|er|sie|es|wir|ihr|man)\b/i,
    ],
    enPatterns: [
      /^(today|tomorrow|yesterday|sometimes|often|here|there|now|then|unfortunately|usually|mostly)\b/i,
    ],
    tipPatterns: [/word\s*order/i, /V2/i, /verb.*second/i, /inversion/i],
  },
  'node-06': {
    name: 'Accusative case',
    tier: 'A1',
    dePatterns: [
      /\bden\s+\S+\b/,                       // masc accusative
      /\beinen\s+\S+\b/,                     // masc accusative indefinite
      /\b(sehe|sieht|kaufe|kauft|lese|liest|esse|isst|trinke|trinkt|nehme|nimmt|brauche|braucht|habe|hat)\s+(den|einen|die|das|ein|eine|meinen|seinen|ihren|keinen)\b/i,
      /\b(für|durch|gegen|ohne|um)\s+(den|die|das|einen|eine|ein|mich|dich|ihn|sie|uns|euch)\b/i,
      /\bmich\b/i,
      /\bdich\b/i,
      /\bihn\b/i,
    ],
    enPatterns: [
      /\b(see|buy|read|eat|drink|take|need|have)\s+(the|a|an|my|his|her|no)\b/i,
      /\b(for|through|against|without|around)\s+(the|a|me|him|her|us|them)\b/i,
    ],
    tipPatterns: [/accusative/i, /Akkusativ/i, /direct\s*object/i, /den\b/i],
  },
  'node-07': {
    name: 'Descriptions & adjectives',
    tier: 'A1',
    dePatterns: [
      /\b(schön|groß|klein|alt|neu|gut|schlecht|lang|kurz|schnell|langsam|heiß|kalt|warm|teuer|billig|laut|leise|wichtig|einfach|schwer|leicht|dunkel|hell|nett|freundlich|interessant|langweilig)\b/i,
      /\bist\s+(sehr\s+)?(schön|groß|klein|alt|neu|gut|schlecht|lang|kurz|schnell|langsam|heiß|kalt|warm|teuer|billig|wichtig|einfach|schwer|leicht|nett|freundlich|interessant)\b/i,
      /\bsind\s+(sehr\s+)?(schön|groß|klein|alt|neu|gut|schlecht|wichtig|interessant|langweilig)\b/i,
      /\b(der|die|das|ein|eine)\s+(große|kleine|alte|neue|gute|schlechte|schöne|wichtige|interessante|lange|kurze|schnelle|langsame)\b/i,
    ],
    enPatterns: [
      /\b(beautiful|big|small|old|new|good|bad|long|short|fast|slow|hot|cold|warm|expensive|cheap|loud|quiet|important|easy|hard|light|dark|nice|friendly|interesting|boring)\b/i,
      /\bis\s+(very\s+)?(beautiful|big|small|old|new|good|bad|important|interesting)\b/i,
    ],
    tipPatterns: [/adjective/i, /beschreib/i, /description/i, /eigenschaft/i],
  },
  'node-08': {
    name: 'Separable verbs',
    tier: 'A1',
    dePatterns: [
      /\b(an|auf|aus|ab|ein|mit|vor|zu|weg|zurück|hin|her|um|nach|vorbei|zusammen|teil|fest|fern|statt)\S*\b.*\b(an|auf|aus|ab|ein|mit|vor|zu|weg|zurück|hin|her|um|nach|vorbei)\b/i,
      /\b(rufe|rufst|ruft|rufen)\b.*\ban\b/i,       // anrufen
      /\b(stehe|stehst|steht|stehen)\b.*\bauf\b/i,   // aufstehen
      /\b(fange|fängst|fängt|fangen)\b.*\ban\b/i,    // anfangen
      /\b(komme|kommst|kommt|kommen)\b.*\b(an|zurück|mit|vorbei)\b/i,
      /\b(mache|machst|macht|machen)\b.*\b(auf|zu|mit|an)\b/i,
      /\b(gehe|gehst|geht|gehen)\b.*\b(aus|weg|mit|zurück|hin|her|ein|vor)\b/i,
      /\b(nehme|nimmst|nimmt|nehmen)\b.*\b(mit|an|auf|ab|teil)\b/i,
      /\b(sehe|siehst|sieht|sehen)\b.*\b(aus|fern|an)\b/i,
      /\b(kaufe|kaufst|kauft|kaufen)\b.*\bein\b/i,   // einkaufen
      /\banzu\S+en\b/i,                              // separable infinitive with zu
    ],
    enPatterns: [
      /\b(call|calls?|called)\b.*\b(up)\b/i,
      /\b(get|gets?|got)\s+up\b/i,
      /\b(pick|picks?|picked)\s+up\b/i,
      /\b(come|comes?|came)\s+(back|along)\b/i,
      /\b(go|goes?|went)\s+(out|away|along|back)\b/i,
    ],
    tipPatterns: [/separable/i, /trennbar/i, /prefix/i],
  },
  'node-09': {
    name: 'Perfekt (present perfect)',
    tier: 'A2',
    dePatterns: [
      /\b(habe|hast|hat|haben|habt)\s+\S*ge\S+[tn]\b/i,     // haben + ge-...-t/-en
      /\b(bin|bist|ist|sind|seid)\s+\S*ge\S+[tn]\b/i,       // sein + ge-...-t/-en
      /\b(gemacht|gesagt|gekauft|gespielt|gelernt|gearbeitet|gewohnt|gefragt|gesucht|gehört|gezeigt|geöffnet|geschlossen)\b/i,
      /\b(gegangen|gekommen|gefahren|gelaufen|geflogen|gewesen|geworden|geblieben|gestorben)\b/i,
      /\b(gesehen|gelesen|geschrieben|gegessen|getrunken|gefunden|genommen|gegeben|gesprochen|verstanden)\b/i,
    ],
    enPatterns: [
      /\bhave\s+(made|said|bought|played|learned|worked|lived|asked|seen|read|written|eaten|drunk|found|taken|given|spoken|understood)\b/i,
      /\bhas\s+(made|said|bought|played|learned|worked|lived|asked|seen|read|written|eaten|drunk|found|taken|given|spoken)\b/i,
    ],
    tipPatterns: [/Perfekt/i, /present\s*perfect/i, /ge-/i, /participle/i],
  },
  'node-10': {
    name: 'Dative case',
    tier: 'A2',
    dePatterns: [
      /\bdem\s+\S+\b/,                       // masc/neut dative
      /\bder\s+\S+\b.*\bdem\b/,              // fem dative (der Frau)
      /\beinem\s+\S+\b/,                     // masc/neut dative indef
      /\beiner\s+\S+\b/,                     // fem dative indef
      /\b(mir|dir|ihm|ihr|uns|euch|ihnen|Ihnen)\b/,
      /\b(gebe|gibst|gibt|geben|gebt)\s+\S*\s*(mir|dir|ihm|ihr|uns|euch|ihnen)\b/i,
      /\b(helfe|hilfst|hilft|helfen|helft)\b/i,
      /\b(gefällt|schmeckt|gehört|passt|fehlt)\s+(mir|dir|ihm|ihr|uns|euch|ihnen)\b/i,
      /\b(mit|nach|bei|seit|von|zu|aus|gegenüber)\s+(dem|der|einem|einer|mir|dir|ihm|ihr|uns|euch|ihnen)\b/i,
    ],
    enPatterns: [
      /\b(give|gives?|gave)\s+(me|him|her|us|them|the)\b/i,
      /\b(help|helps?|helped)\s+(me|him|her|us|them|the)\b/i,
      /\bto\s+(me|him|her|us|them|the)\b/i,
      /\b(with|from|to|at|since|of)\s+(the|a|my|his|her)\b/i,
    ],
    tipPatterns: [/dative/i, /Dativ/i, /indirect\s*object/i, /dem\b/i, /mir\/dir/i],
  },
  'node-11': {
    name: 'Modal verbs',
    tier: 'A2',
    dePatterns: [
      /\b(kann|kannst|können|könnt)\b/i,
      /\b(muss|musst|müssen|müsst)\b/i,
      /\b(soll|sollst|sollen|sollt)\b/i,
      /\b(darf|darfst|dürfen|dürft)\b/i,
      /\b(will|willst|wollen|wollt)\b/i,
      /\b(möchte|möchtest|möchten|möchtet)\b/i,
      /\b(mag|magst|mögen|mögt)\b/i,
      /\b(konnte|musste|sollte|durfte|wollte|mochte)\b/i,
    ],
    enPatterns: [
      /\b(can|could|must|should|may|might|want to|would like to|have to|allowed to)\b/i,
    ],
    tipPatterns: [/modal/i, /können|müssen|sollen|dürfen|wollen|möchten/i],
  },
  'node-12': {
    name: 'Präteritum (simple past)',
    tier: 'A2',
    dePatterns: [
      /\b(war|warst|waren|wart)\b/i,         // sein Präteritum
      /\b(hatte|hattest|hatten|hattet)\b/i,   // haben Präteritum
      /\b(machte|sagte|kaufte|spielte|lernte|arbeitete|wohnte|fragte|suchte|hörte|zeigte|öffnete|schloss)\b/i,
      /\b(ging|kam|fuhr|lief|flog|blieb|starb|fiel|fand|nahm|gab|sprach|sah|las|schrieb|aß|trank|schlief|wusste|kannte|dachte|brachte|stand|saß|lag|hing|rief|begann)\b/i,
      /\b\S+te\b.*\b(gestern|damals|früher|einmal)\b/i,
      /\b(gestern|damals|früher|einmal)\b.*\b\S+te\b/i,
    ],
    enPatterns: [
      /\b(was|were|had|went|came|drove|ran|flew|stayed|died|fell|found|took|gave|spoke|saw|read|wrote|ate|drank|slept|knew|thought|brought|stood|sat|lay|called|began)\b/i,
      /\byesterday\b/i,
      /\blast\s+(week|month|year|night|time)\b/i,
      /\b(once|formerly|in the past)\b/i,
    ],
    tipPatterns: [/Präteritum/i, /simple\s*past/i, /imperfect/i, /past\s*tense/i],
  },
  'node-13': {
    name: 'Negation (nicht vs kein)',
    tier: 'A2',
    dePatterns: [
      /\bnicht\b/,
      /\b(kein|keine|keinen|keinem|keiner|keines)\b/i,
      /\b(nie|niemals|nirgends|nirgendwo|niemand|nichts)\b/i,
      /\bnoch\s+nicht\b/i,
      /\bnicht\s+mehr\b/i,
      /\bgar\s+nicht\b/i,
      /\büberhaupt\s+nicht\b/i,
      /\bweder\b.*\bnoch\b/i,
    ],
    enPatterns: [
      /\b(not|no|never|nobody|nothing|nowhere|neither|nor|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|hasn't|haven't|can't|won't)\b/i,
    ],
    tipPatterns: [/negat/i, /nicht/i, /kein/i],
  },
  'node-14': {
    name: 'Wechselpräpositionen',
    tier: 'A2',
    dePatterns: [
      /\b(in|an|auf|über|unter|vor|hinter|neben|zwischen)\s+(dem|der|den|einem|einer)\b/i,   // dative
      /\b(in|an|auf|über|unter|vor|hinter|neben|zwischen)\s+(den|die|das|einen|eine|ein)\b/i, // accusative
      /\b(im|am|zum|zur|vom|beim)\b/i,       // contractions
      /\bins\b/i,
      /\bans\b/i,
      /\baufs\b/i,
    ],
    enPatterns: [
      /\b(in|on|at|above|below|behind|in front of|next to|between)\s+the\b/i,
      /\binto\s+the\b/i,
      /\bonto\s+the\b/i,
    ],
    tipPatterns: [/Wechselpräposition/i, /two-way\s*preposition/i, /dative.*accusative/i, /location.*direction/i],
  },
  'node-15': {
    name: 'Pronouns & reflexive verbs',
    tier: 'A2',
    dePatterns: [
      /\b(mich|dich|sich|uns|euch)\s+\S+/,   // reflexive pronouns
      /\b(freue|freust|freut|freuen)\s+mich\b/i,
      /\b(fühle|fühlst|fühlt|fühlen)\s+(mich|sich)\b/i,
      /\b(setze|setzt|setzen)\s+(mich|sich)\b/i,
      /\b(wasche|wäschst|wäscht|waschen)\s+(mich|sich)\b/i,
      /\b(erinnere|erinnerst|erinnert|erinnern)\s+(mich|sich)\b/i,
      /\b(interessiere|interessierst|interessiert|interessieren)\s+(mich|sich)\b/i,
      /\bsich\s+\S+en\b/i,                   // sich + infinitive
    ],
    enPatterns: [
      /\b(myself|yourself|himself|herself|ourselves|themselves)\b/i,
      /\b(feel|feels?|sit|sits?|wash|washes?|remember|remembers?)\b/i,
    ],
    tipPatterns: [/reflexive/i, /pronoun/i, /sich\b/i],
  },
  'node-16': {
    name: 'Comparatives & superlatives',
    tier: 'B1',
    dePatterns: [
      /\b\S+er\s+als\b/i,                    // comparative + als
      /\b(größer|kleiner|schneller|langsamer|besser|schlechter|älter|jünger|teurer|billiger|wichtiger|einfacher|schwerer|leichter|schöner|interessanter|länger|kürzer|höher|niedriger)\b/i,
      /\bam\s+\S+sten\b/i,                   // superlative am -sten
      /\b(am größten|am kleinsten|am schnellsten|am besten|am schlechtesten|am ältesten|am wichtigsten|am schönsten|am interessantesten)\b/i,
      /\b(der|die|das)\s+\S+ste\b/i,         // def article + superlative
    ],
    enPatterns: [
      /\b\S+er\s+than\b/i,
      /\b(bigger|smaller|faster|slower|better|worse|older|younger|more expensive|cheaper|more important|easier|harder|more beautiful|more interesting|longer|shorter|higher|lower)\b/i,
      /\b(the\s+)?(biggest|smallest|fastest|best|worst|oldest|youngest|most important|most beautiful|most interesting|longest|shortest)\b/i,
    ],
    tipPatterns: [/comparat/i, /superlat/i, /als\b/i, /am\s+\S+sten/i],
  },
  'node-17': {
    name: 'Temporal expressions & conjunctions',
    tier: 'B1',
    dePatterns: [
      /\b(als|wenn|bevor|nachdem|während|seitdem|sobald|bis|solange)\b/i,
      /\b(gestern|heute|morgen|übermorgen|vorgestern)\b/i,
      /\b(immer|oft|manchmal|selten|nie|täglich|wöchentlich|monatlich|jährlich)\b/i,
      /\b(zuerst|dann|danach|schließlich|endlich|plötzlich|inzwischen|gleichzeitig|mittlerweile)\b/i,
      /\b(am Morgen|am Abend|am Nachmittag|in der Nacht|am Wochenende)\b/i,
      /\b(letztes Jahr|nächste Woche|vor einem Monat|seit einer Stunde|in zwei Tagen)\b/i,
    ],
    enPatterns: [
      /\b(when|before|after|while|since|until|as soon as|as long as)\b/i,
      /\b(yesterday|today|tomorrow|always|often|sometimes|rarely|never|daily|weekly|monthly)\b/i,
      /\b(first|then|afterwards|finally|suddenly|meanwhile|at the same time)\b/i,
      /\b(in the morning|in the evening|at night|on the weekend|last year|next week)\b/i,
    ],
    tipPatterns: [/temporal/i, /time\s*express/i, /conjunction/i, /als\/wenn/i, /zeitlich/i],
  },
  'node-18': {
    name: 'Subordinate clauses (verb-final)',
    tier: 'B1',
    dePatterns: [
      /\b(dass|weil|wenn|ob|als|nachdem|obwohl|damit|bevor|bis|seit|seitdem|während|indem|falls)\s+.*\S+[tneg]\b/i,  // subordinating conjunction
      /,\s*(dass|weil|wenn|ob|als|nachdem|obwohl|damit|bevor|bis|seit|seitdem|während)\s+/i,
    ],
    enPatterns: [
      /\b(that|because|when|whether|if|although|after|before|since|while|so that|until)\b/i,
    ],
    tipPatterns: [/subordinate/i, /Nebensatz/i, /verb.*final/i, /verb.*end/i, /dass|weil|wenn|ob/i],
  },
  'node-19': {
    name: 'Imperative',
    tier: 'B1',
    dePatterns: [
      /^(Mach|Geh|Komm|Nimm|Gib|Lies|Iss|Trink|Schreib|Sprich|Lauf|Fahr|Öffne|Schließ|Hilf|Sag|Zeig|Hör|Warte|Setz|Steh|Bleib|Ruf|Bring|Pass)\b/,
      /^(Macht|Geht|Kommt|Nehmt|Gebt|Lest|Esst|Trinkt|Schreibt|Sprecht)\b/,
      /^(Machen|Gehen|Kommen|Nehmen|Geben|Lesen|Essen|Trinken|Schreiben|Sprechen)\s+Sie\b/,
      /\bBitte\s+(mach|geh|komm|nimm|gib|lies|iss|schreib|sprich|öffne|schließ)/i,
      /^(Lass|Lasst|Lassen)\s+(uns|Sie)\b/i,
      /![^"]*$/,                              // ends with !
    ],
    enPatterns: [
      /^(Do|Go|Come|Take|Give|Read|Eat|Drink|Write|Speak|Run|Drive|Open|Close|Help|Say|Show|Listen|Wait|Sit|Stand|Stay|Call|Bring|Be)\b/,
      /\bplease\s+(do|go|come|take|give|read|eat|drink|write|speak|open|close|help|say|wait)\b/i,
      /\blet's\b/i,
      /\bdon't\s+(do|go|touch|forget|worry|be)\b/i,
    ],
    tipPatterns: [/imperative/i, /command/i, /Imperativ/i, /Befehl/i],
  },
  'node-20': {
    name: 'Adjective endings',
    tier: 'B1',
    dePatterns: [
      /\b(der|die|das|den|dem|des)\s+\S+(e|en|er|es|em)\s+\S+\b/,   // def article + adj + noun
      /\b(ein|eine|einen|einem|einer|eines)\s+\S+(er|e|es|en|em)\s+\S+\b/,  // indef article + adj + noun
      /\b\S+(er|e|es|en|em)\s+(Mann|Frau|Kind|Leute|Haus|Tag|Stadt|Land|Buch|Auto|Hund|Katze)\b/i,
    ],
    enPatterns: [
      /\b(the|a|an)\s+(big|small|old|new|good|bad|beautiful|important|interesting|young)\s+\S+\b/i,
    ],
    tipPatterns: [/adjective\s*ending/i, /Adjektivendung/i, /Adjektivdeklination/i, /\-e\/\-en\/\-er\/\-es\/\-em/i],
  },
  'node-21': {
    name: 'Genitive case',
    tier: 'B1',
    dePatterns: [
      /\bdes\s+\S+s\b/,                      // masc/neut genitive
      /\bder\s+\S+\b/,                       // fem/plural genitive
      /\b(wegen|trotz|während|anstatt|statt|innerhalb|außerhalb|aufgrund|infolge)\s+(des|der|eines|einer)\b/i,
      /\b\S+s\s+\S+\b/,                      // possessive -s
    ],
    enPatterns: [
      /\b(of the|of a|because of|despite|during|instead of|within|outside of|due to)\b/i,
      /\b\S+'s\s+\S+\b/,                     // possessive 's
    ],
    tipPatterns: [/genitive/i, /Genitiv/i, /des\b/i, /possession/i],
  },
  'node-22': {
    name: 'Relative clauses',
    tier: 'B2',
    dePatterns: [
      /,\s*(der|die|das|dem|den|dessen|deren|denen)\s+\S+/,   // relative pronoun after comma
      /\b(der|die|das|dem|den|dessen|deren|denen)\s+\S+\s+\S+[tn]\b/,
    ],
    enPatterns: [
      /\b(who|which|that|whom|whose)\s+\S+\b/i,
      /,\s*(who|which|that)\s+/i,
    ],
    tipPatterns: [/relative\s*clause/i, /Relativsatz/i, /Relativpronomen/i],
  },
  'node-23': {
    name: 'Passive voice',
    tier: 'B2',
    dePatterns: [
      /\b(wird|wirst|werden|werdet)\s+\S*[tn]\b/i,         // Vorgangspassiv present
      /\b(wurde|wurdest|wurden|wurdet)\s+\S*[tn]\b/i,      // Vorgangspassiv past
      /\b(ist|sind|war|waren)\s+\S+\s+worden\b/i,          // Perfekt passive
      /\bworden\b/i,
      /\bwird\s+\S+\s+ge\S+[tn]\b/i,
      /\bwurde\s+\S+\s+ge\S+[tn]\b/i,
    ],
    enPatterns: [
      /\b(is|are|was|were|been|being)\s+(made|built|done|written|seen|found|taken|given|told|called|used|known|considered)\b/i,
      /\bwas\s+\S+ed\b/i,
      /\bwere\s+\S+ed\b/i,
    ],
    tipPatterns: [/passive/i, /Passiv/i, /Vorgangspassiv/i, /Zustandspassiv/i],
  },
  'node-24': {
    name: 'Konjunktiv II',
    tier: 'B2',
    dePatterns: [
      /\b(würde|würdest|würden|würdet)\s+\S+\b/i,
      /\b(wäre|wärst|wären|wärt)\b/i,
      /\b(hätte|hättest|hätten|hättet)\b/i,
      /\b(könnte|könntest|könnten|könntet)\b/i,
      /\b(müsste|müsstest|müssten|müsstet)\b/i,
      /\b(sollte|solltest|sollten|solltet)\b/i,
      /\b(dürfte|dürftest|dürften|dürftet)\b/i,
      /\bwenn\s+ich\s+\S+\s+(wäre|hätte|könnte|würde)\b/i,
    ],
    enPatterns: [
      /\b(would|could|should|might)\s+\S+\b/i,
      /\bif\s+I\s+(were|had|could|would)\b/i,
      /\bwish\s+I\b/i,
    ],
    tipPatterns: [/Konjunktiv\s*II/i, /subjunctive/i, /würde/i, /conditional/i],
  },
  'node-25': {
    name: 'Indirect speech (Konjunktiv I)',
    tier: 'B2',
    dePatterns: [
      /\b(sei|seien|seiest|seiet)\b/i,
      /\b(habe|haben)\s+\S+\s+(gesagt|berichtet|erklärt|behauptet|gemeint)\b/i,
      /\b(sagte|berichtete|erklärte|behauptete|meinte)\s*,?\s*(dass|er|sie|es|man)\b/i,
      /\b(er|sie)\s+(sei|habe|könne|müsse|solle|dürfe|wolle)\b/i,
    ],
    enPatterns: [
      /\b(said|told|reported|claimed|explained|stated)\s+(that|he|she|they)\b/i,
      /\baccording\s+to\b/i,
    ],
    tipPatterns: [/Konjunktiv\s*I/i, /indirect\s*speech/i, /reported/i, /indirekte\s*Rede/i],
  },
  'node-26': {
    name: 'Infinitive constructions',
    tier: 'B2',
    dePatterns: [
      /\bzu\s+\S+en\b/i,                     // zu + infinitive
      /\bum\s+zu\s+\S+en\b/i,               // um zu + infinitive
      /\bohne\s+zu\s+\S+en\b/i,             // ohne zu + infinitive
      /\b(an)?statt\s+zu\s+\S+en\b/i,       // (an)statt zu + infinitive
      /\b\S+zu\S+en\b/i,                     // separable with zu (anzufangen)
    ],
    enPatterns: [
      /\bto\s+\S+\b/i,
      /\bin order to\b/i,
      /\bwithout\s+\S+ing\b/i,
      /\binstead of\s+\S+ing\b/i,
    ],
    tipPatterns: [/infinitive/i, /Infinitiv/i, /zu\s*\+/i, /um\s*zu/i],
  },
  'node-27': {
    name: 'Advanced connectors',
    tier: 'B2',
    dePatterns: [
      /\b(jedoch|allerdings|dennoch|trotzdem|nichtsdestotrotz|nichtsdestoweniger)\b/i,
      /\b(deshalb|deswegen|daher|darum|folglich|infolgedessen)\b/i,
      /\b(außerdem|darüber\s*hinaus|ferner|zudem|überdies)\b/i,
      /\b(einerseits|andererseits|im\s*Gegensatz|dagegen|hingegen|währenddessen)\b/i,
      /\b(obwohl|obgleich|obschon|wenngleich)\b/i,
      /\b(sowohl|als\s*auch|weder|noch|entweder|oder)\b/i,
    ],
    enPatterns: [
      /\b(however|nevertheless|therefore|furthermore|moreover|consequently|in contrast|on the other hand|despite|although)\b/i,
      /\b(as a result|in addition|on the contrary|in spite of|regardless)\b/i,
    ],
    tipPatterns: [/connector/i, /conjunction/i, /Konnektor/i, /linking/i],
  },
  'node-28': {
    name: 'Noun compounds',
    tier: 'C1',
    dePatterns: [
      /\b\S{12,}\b/,                         // very long words (compound nouns)
      /\b(Straßen|Haupt|Bundes|Arbeits|Lebens|Sprach|Welt|Stadt|Schul|Fahr|Flug|Bahn|Kranken|Wohn|Schlaf|Küchen|Bade|Kinder|Garten|Schlüssel|Telefon|Computer|Fernseh|Wasch|Geschäfts|Geburts|Hochzeits)\S+\b/,
    ],
    enPatterns: [
      /\b\S+\s+(station|room|place|house|school|office|center|park|way|street|market)\b/i,
    ],
    tipPatterns: [/compound/i, /Kompositum/i, /Zusammensetzung/i],
  },
  'node-29': {
    name: 'Extended adjective constructions',
    tier: 'C1',
    dePatterns: [
      /\b(der|die|das|den|dem|des)\s+\S+\s+\S+\s+\S+(e|en|er|es|em)\s+\S+\b/,  // extended adj attribute
      /\bzu\s+\S+ende\b/i,
      /\b\S+end(e|en|er|es|em)\b/,           // present participle as adjective
      /\b\S+t(e|en|er|es|em)\s+\S+\b/,       // past participle as adjective
    ],
    enPatterns: [
      /\bthe\s+\S+\s+\S+\s+\S+(ed|ing)\s+\S+\b/i,
    ],
    tipPatterns: [/extended\s*adj/i, /erweitertes\s*Adjektiv/i, /partizip.*attribut/i],
  },
  'node-30': {
    name: 'Double infinitive & verb chains',
    tier: 'C1',
    dePatterns: [
      /\b(hat|hatte|hätte)\s+\S+en\s+(können|müssen|sollen|dürfen|wollen|lassen)\b/i,
      /\bwird\s+\S+en\s+(können|müssen|sollen|dürfen|wollen)\b/i,
      /\b\S+en\s+(lassen|sehen|hören|helfen|lernen)\b/i,
    ],
    enPatterns: [
      /\b(could|should|would)\s+have\s+\S+ed\b/i,
      /\blet\s+(me|him|her|us|them)\s+\S+\b/i,
      /\bheard\s+(him|her|them)\s+\S+\b/i,
    ],
    tipPatterns: [/double\s*infinit/i, /Ersatzinfinitiv/i, /verb\s*chain/i],
  },
  'node-31': {
    name: 'Formal writing & register',
    tier: 'C1',
    dePatterns: [
      /\b(Sehr\s+geehrte|Mit\s+freundlichen|Hochachtungsvoll|Bezüglich|Hinsichtlich|Diesbezüglich|Inbezugnahme)\b/i,
      /\b(betreffend|gemäß|laut|zufolge|kraft|mangels|mittels|zwecks)\b/i,
      /\b(hiermit|hierfür|hierzu|hierbei|hierin|daraufhin|dementsprechend)\b/i,
    ],
    enPatterns: [
      /\b(Dear Sir|Dear Madam|Sincerely|Regards|Regarding|Concerning|Furthermore|Henceforth)\b/i,
      /\b(hereby|thereof|therein|thereupon|accordingly|respectively)\b/i,
    ],
    tipPatterns: [/formal/i, /register/i, /Schriftsprache/i, /Amtssprache/i],
  },
  'node-32': {
    name: 'Idiomatic expressions',
    tier: 'C2',
    dePatterns: [
      /\b(Schwein\s+haben|ins\s+Gras\s+beißen|die\s+Daumen\s+drücken|auf\s+dem\s+Holzweg|unter\s+vier\s+Augen)\b/i,
      /\bden\s+\S+\s+(in|auf|an|aus|um)\s/i,  // idiomatic verb + preposition
      /\b(Quatsch|Mist|Mensch|Wahnsinn|Donnerwetter)\b/i,
    ],
    enPatterns: [
      /\b(idiom|proverb|expression|saying)\b/i,
      /\b(break a leg|raining cats|cold shoulder|piece of cake|hit the road)\b/i,
    ],
    tipPatterns: [/idiom/i, /Redewendung/i, /Sprichwort/i, /expression/i],
  },
  'node-33': {
    name: 'Advanced subjunctive',
    tier: 'C2',
    dePatterns: [
      /\b(würde|wäre|hätte|könnte|müsste|sollte|dürfte)\b.*\b(wenn|falls|sofern)\b/i,
      /\b(als\s+ob|als\s+wenn|als\s+hätte|als\s+wäre)\b/i,
      /\bsei\s+\S+\b/i,
      /\bhabe\s+\S+\s+(gesagt|berichtet)\b/i,
    ],
    enPatterns: [
      /\b(as if|as though|if only|I wish)\b/i,
      /\b(would have|could have|should have|might have)\b/i,
    ],
    tipPatterns: [/Konjunktiv/i, /subjunctive/i, /irreal/i],
  },
  'node-34': {
    name: 'Academic & professional German',
    tier: 'C2',
    dePatterns: [
      /\b(Forschung|Analyse|Theorie|Hypothese|Methode|Ergebnis|Schlussfolgerung|Zusammenfassung)\b/i,
      /\b(untersuchen|analysieren|feststellen|nachweisen|belegen|widerlegen|erörtern)\b/i,
      /\b(hinsichtlich|bezüglich|angesichts|aufgrund|infolge|zwecks)\b/i,
    ],
    enPatterns: [
      /\b(research|analysis|theory|hypothesis|method|result|conclusion|summary)\b/i,
      /\b(investigate|analyze|determine|demonstrate|refute|discuss)\b/i,
    ],
    tipPatterns: [/academic/i, /wissenschaft/i, /professional/i],
  },
  'node-35': {
    name: 'Nuance & modal particles',
    tier: 'C2',
    dePatterns: [
      /\b(doch|mal|halt|eben|ja|schon|wohl|eigentlich|bloß|nur|etwa|denn)\b/i,
      /\b(Komm\s+mal|Mach\s+doch|Geh\s+halt|Sag\s+schon|Hör\s+mal)\b/i,
    ],
    enPatterns: [
      /\b(actually|really|just|simply|indeed|certainly|surely)\b/i,
      /\b(you know|after all|right)\b/i,
    ],
    tipPatterns: [/modal\s*particle/i, /Modalpartikel/i, /Abtönungspartikel/i, /nuance/i],
  },
};

// Score a card against a node
function scoreCard(card, nodeId) {
  const node = NODES[nodeId];
  if (!node) return 0;

  let score = 0;
  const target = card.target || '';
  const english = card.english || '';
  const grammar = card.grammar || '';

  // Primary: German morphology (weight 3)
  for (const pat of node.dePatterns) {
    if (pat.test(target)) score += 3;
  }

  // Secondary: English translation (weight 2)
  for (const pat of node.enPatterns) {
    if (pat.test(english)) score += 2;
  }

  // Tertiary: grammar tips (weight 4 — highly reliable)
  for (const pat of node.tipPatterns) {
    if (pat.test(grammar) || pat.test(target)) score += 4;
  }

  return score;
}

// Find best node for a card
function findBestNode(card) {
  let bestNode = null;
  let bestScore = 0;

  for (const nodeId of Object.keys(NODES)) {
    const score = scoreCard(card, nodeId);
    if (score > bestScore) {
      bestScore = score;
      bestNode = nodeId;
    }
  }

  return { node: bestNode, score: bestScore };
}

// ── Main logic ──
console.log('=== German Deck Node Reassignment ===\n');

// Count current distribution
const beforeCounts = {};
for (const card of deck) {
  const node = card.grammarNode;
  beforeCounts[node] = (beforeCounts[node] || 0) + 1;
}

console.log('BEFORE distribution:');
for (const [node, count] of Object.entries(beforeCounts).sort()) {
  const isTheme = THEME_NODES.has(node) ? ' [THEME - will force-reassign]' : '';
  console.log(`  ${node}: ${count} cards${isTheme}`);
}

// Phase 1: Score all cards
let moved = 0;
let themeForced = 0;
let grammarImproved = 0;
const movements = {};

for (const card of deck) {
  const currentNode = card.grammarNode;
  const best = findBestNode(card);
  const currentScore = scoreCard(card, currentNode);

  const isThemeNode = THEME_NODES.has(currentNode);

  if (isThemeNode) {
    // Force-reassign from theme nodes
    if (best.node && best.score > 0) {
      const from = currentNode;
      card.grammarNode = best.node;
      movements[`${from}->${best.node}`] = (movements[`${from}->${best.node}`] || 0) + 1;
      moved++;
      themeForced++;
    }
    // If no good match, leave it (will be rebalanced later)
  } else {
    // Only move from grammar nodes if significant improvement
    if (best.node && best.node !== currentNode && (best.score - currentScore) > 12) {
      const from = currentNode;
      card.grammarNode = best.node;
      movements[`${from}->${best.node}`] = (movements[`${from}->${best.node}`] || 0) + 1;
      moved++;
      grammarImproved++;
    }
  }
}

console.log(`\nPhase 1 results:`);
console.log(`  Theme nodes force-reassigned: ${themeForced}`);
console.log(`  Grammar nodes improved: ${grammarImproved}`);
console.log(`  Total moved: ${moved}`);

// Phase 2: Rebalance (80-200 per node)
const MIN_PER_NODE = 80;
const MAX_PER_NODE = 200;

function getNodeCounts() {
  const counts = {};
  for (const nodeId of Object.keys(NODES)) counts[nodeId] = [];
  for (const card of deck) {
    if (!counts[card.grammarNode]) counts[card.grammarNode] = [];
    counts[card.grammarNode].push(card);
  }
  return counts;
}

let rebalanceRounds = 0;
let rebalanceMoved = 0;

for (let round = 0; round < 10; round++) {
  let movedThisRound = 0;

  // Step A: Fix overflow nodes (>200)
  {
    const counts = getNodeCounts();
    for (const [nodeId, cards] of Object.entries(counts)) {
      if (cards.length <= MAX_PER_NODE) continue;

      const scoredCards = cards.map(c => ({
        card: c,
        currentScore: scoreCard(c, nodeId),
      }));
      scoredCards.sort((a, b) => a.currentScore - b.currentScore);

      const excess = cards.length - MAX_PER_NODE;
      let movedFromNode = 0;

      for (const sc of scoredCards) {
        if (movedFromNode >= excess) break;
        const curCounts = getNodeCounts();
        let bestAlt = null;
        let bestAltScore = 0;

        for (const altNode of Object.keys(NODES)) {
          if (altNode === nodeId) continue;
          if ((curCounts[altNode]?.length || 0) >= MAX_PER_NODE) continue;
          const altScore = scoreCard(sc.card, altNode);
          if (altScore > bestAltScore) {
            bestAltScore = altScore;
            bestAlt = altNode;
          }
        }

        if (bestAlt) {
          sc.card.grammarNode = bestAlt;
          movedFromNode++;
          movedThisRound++;
        }
      }
    }
  }

  // Step B: Fix underflow nodes (<80) — steal from largest nodes
  {
    const counts = getNodeCounts();
    const underNodes = Object.entries(counts)
      .filter(([, cards]) => cards.length < MIN_PER_NODE)
      .sort((a, b) => a[1].length - b[1].length);  // smallest first

    for (const [nodeId, cards] of underNodes) {
      const deficit = MIN_PER_NODE - cards.length;
      let filled = 0;

      // Gather candidates from all nodes with >MIN cards
      const candidates = [];
      const freshCounts = getNodeCounts();
      for (const [otherNode, otherCards] of Object.entries(freshCounts)) {
        if (otherNode === nodeId) continue;
        if (otherCards.length <= MIN_PER_NODE) continue;

        for (const c of otherCards) {
          const scoreHere = scoreCard(c, nodeId);
          const scoreThere = scoreCard(c, otherNode);
          candidates.push({ card: c, scoreHere, scoreThere, fromNode: otherNode, surplus: otherCards.length - MIN_PER_NODE });
        }
      }

      // Sort: prefer cards that score well here, from nodes with biggest surplus
      candidates.sort((a, b) => {
        // First priority: has any score for target node
        if (a.scoreHere > 0 && b.scoreHere === 0) return -1;
        if (a.scoreHere === 0 && b.scoreHere > 0) return 1;
        // Second: highest relative improvement
        const relA = a.scoreHere - a.scoreThere;
        const relB = b.scoreHere - b.scoreThere;
        if (relA !== relB) return relB - relA;
        // Third: biggest surplus
        return b.surplus - a.surplus;
      });

      for (const cand of candidates) {
        if (filled >= deficit) break;
        const srcCount = deck.filter(c => c.grammarNode === cand.fromNode).length;
        if (srcCount <= MIN_PER_NODE) continue;

        cand.card.grammarNode = nodeId;
        filled++;
        movedThisRound++;
      }
    }
  }

  rebalanceMoved += movedThisRound;
  rebalanceRounds++;
  if (movedThisRound === 0) break;
}

console.log(`\nRebalancing: ${rebalanceMoved} cards moved in ${rebalanceRounds} rounds`);

// Final counts
const afterCounts = {};
for (const card of deck) {
  const node = card.grammarNode;
  afterCounts[node] = (afterCounts[node] || 0) + 1;
}

console.log('\nAFTER distribution:');
let totalCards = 0;
let underMin = 0;
let overMax = 0;
for (const nodeId of Object.keys(NODES).sort()) {
  const count = afterCounts[nodeId] || 0;
  const before = beforeCounts[nodeId] || 0;
  const delta = count - before;
  const flag = count < MIN_PER_NODE ? ' [UNDER]' : count > MAX_PER_NODE ? ' [OVER]' : '';
  const name = NODES[nodeId]?.name || '???';
  console.log(`  ${nodeId}: ${count} (was ${before}, ${delta >= 0 ? '+' : ''}${delta}) - ${name}${flag}`);
  totalCards += count;
  if (count < MIN_PER_NODE) underMin++;
  if (count > MAX_PER_NODE) overMax++;
}

console.log(`\nTotal cards: ${totalCards}`);
console.log(`Nodes under ${MIN_PER_NODE}: ${underMin}`);
console.log(`Nodes over ${MAX_PER_NODE}: ${overMax}`);

// Top movements
console.log('\nTop movements:');
const sortedMovements = Object.entries(movements).sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [key, count] of sortedMovements) {
  console.log(`  ${key}: ${count} cards`);
}

// Alignment check: % of cards where current node = best-scoring node
let aligned = 0;
for (const card of deck) {
  const best = findBestNode(card);
  if (best.node === card.grammarNode || best.score === 0) aligned++;
}
console.log(`\nAlignment: ${aligned}/${deck.length} (${(100 * aligned / deck.length).toFixed(1)}%)`);

// Write output
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf8');
console.log('\nDeck written successfully.');
