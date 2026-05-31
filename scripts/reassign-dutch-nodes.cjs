#!/usr/bin/env node
/**
 * Reassign Dutch deck cards to grammar nodes based on morphological analysis.
 *
 * - Force-reassign cards from the 5 renamed theme nodes (01, 06, 07, 12, 17)
 * - Only move cards from existing grammar nodes if score difference > 12
 * - Rebalance to 80-200 per node
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'dutch', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// The 5 renamed theme nodes that need force-reassignment
const THEME_NODES = new Set(['node-01', 'node-06', 'node-07', 'node-12', 'node-17']);

// Node definitions with grammar markers
const NODES = {
  'node-01': {
    name: 'Personal pronouns & present tense',
    tier: 'A1',
    nlPatterns: [
      /\b(ik|jij|je|hij|zij|ze|wij|we|jullie|u)\s+\S+[t]?\b/i,  // pronoun + verb
      /\bik\s+(ben|heb|ga|kom|weet|kan|wil|moet|mag|doe|zie|werk|lees|schrijf|eet|drink|loop|slaap|spreek)\b/i,
      /\bjij\s+\S+t\b/i,                      // jij + -t ending
      /\bhij\s+\S+t\b/i,                      // hij + -t ending
      /\bwij\s+\S+en\b/i,                     // wij + -en ending
      /\bze\s+\S+en\b/i,                      // ze (they) + -en ending
      /\bik\s+\S+\b/i,                        // ik + stem
      /\bwerk[t]?\b/i,                        // werkt/werk
      /\b(lees|leest|lezen)\b/i,              // lezen conjugation
      /\b(schrijf|schrijft|schrijven)\b/i,    // schrijven conjugation
      /\b(spreek|spreekt|spreken)\b/i,        // spreken conjugation
    ],
    enPatterns: [
      /\bI\s+(am|have|go|come|know|can|want|must|do|see|work|read|write|eat|drink|walk|sleep|speak)\b/i,
      /\byou\s+(are|have|go|come|know|work|read|write)\b/i,
      /\b(he|she)\s+(is|has|goes|comes|knows|works|reads|writes)\b/i,
    ],
    tipPatterns: [/present\s*tense/i, /personal\s*pronoun/i, /stam\b/i, /conjugat/i],
  },
  'node-02': {
    name: 'Present tense regular verbs',
    tier: 'A1',
    nlPatterns: [
      /\b\S+[t]\b/,                          // -t ending (present)
      /\b\S+en\b/,                            // -en ending (plural/infinitive)
      /\b(werkt|werken|woont|wonen|speelt|spelen|maakt|maken|loopt|lopen)\b/i,
      /\b(fiets|fietst|fietsen|kookt|koken|betaalt|betalen|luistert|luisteren)\b/i,
    ],
    enPatterns: [
      /\b(works?|lives?|plays?|makes?|walks?|cooks?|pays?|listens?)\b/i,
    ],
    tipPatterns: [/present\s*tense/i, /regular/i, /stam\b/i],
  },
  'node-03': {
    name: 'Zijn vs hebben',
    tier: 'A1',
    nlPatterns: [
      /\b(ben|bent|is|zijn|was|waren|geweest)\b/i,
      /\b(heb|hebt|heeft|hebben|had|hadden|gehad)\b/i,
      /\ber\s+(is|zijn|was|waren)\b/i,
      /\bik\s+ben\b/i,
      /\bjij\s+bent\b/i,
      /\bhij\s+is\b/i,
      /\bik\s+heb\b/i,
      /\bjij\s+hebt\b/i,
      /\bhij\s+heeft\b/i,
    ],
    enPatterns: [
      /\b(am|is|are|was|were)\s+(a|an|the|my|his|her|very|not)\b/i,
      /\b(have|has|had)\s+(a|an|the|my|no|been)\b/i,
      /\bthere\s+(is|are|was|were)\b/i,
    ],
    tipPatterns: [/zijn\b/i, /hebben\b/i, /\bto be\b/i, /\bto have\b/i],
  },
  'node-04': {
    name: 'Articles & gender (de/het)',
    tier: 'A1',
    nlPatterns: [
      /\b(de|het|een)\s+\S+\b/i,
      /\bhet\s+(huis|boek|kind|water|weer|land|dier|meisje|eten|probleem)\b/i,
      /\bde\s+(man|vrouw|jongen|tafel|stoel|auto|stad|school|deur|straat)\b/i,
    ],
    enPatterns: [
      /\b(the|a|an)\s+\S+\b/i,
    ],
    tipPatterns: [/\bde\b.*\bhet\b/i, /article/i, /gender/i, /lidwoord/i],
  },
  'node-05': {
    name: 'Word order (V2 rule)',
    tier: 'A1',
    nlPatterns: [
      /^(vandaag|morgen|gisteren|soms|altijd|nooit|hier|daar|nu|toen|daarna|eerst)\s+\S+\s+(ik|jij|hij|zij|wij|ze)\b/i,
      /^(vandaag|morgen|gisteren|soms|altijd|nu|toen|daarna)\b/i,
      /\b(vandaag|morgen|gisteren)\s+\S+\s+(ik|jij|hij|wij|ze)\b/i,
    ],
    enPatterns: [
      /^(today|tomorrow|yesterday|sometimes|always|never|here|there|now|then|first)\b/i,
    ],
    tipPatterns: [/word\s*order/i, /V2/i, /inversie/i, /inversion/i],
  },
  'node-06': {
    name: 'Questions & interrogatives',
    tier: 'A1',
    nlPatterns: [
      /\b(wie|wat|waar|wanneer|waarom|hoe|welke?|hoeveel|waarmee|waarvan|waarheen|waarover)\b/i,
      /\b(wie|wat|waar|wanneer|waarom|hoe)\s+\S+/i,
      /\?\s*$/,                                // ends with question mark
      /^(is|ben|bent|heeft|heb|hebt|kan|kun|wil|mag|moet|ga|gaat|zijn|hebben|worden|doe|doet)\s+/i,  // yes/no question inversion
    ],
    enPatterns: [
      /\b(who|what|where|when|why|how|which|how many|how much)\b/i,
      /\?\s*$/,
      /^(is|are|do|does|did|can|could|will|would|shall|should|have|has|may)\s+/i,
    ],
    tipPatterns: [/question/i, /interrogat/i, /vraag/i],
  },
  'node-07': {
    name: 'Descriptions & adjectives',
    tier: 'A1',
    nlPatterns: [
      /\b(groot|grote|klein|kleine|mooi|mooie|lelijk|lelijke|oud|oude|nieuw|nieuwe|lang|lange|kort|korte)\b/i,
      /\b(goed|goede|slecht|slechte|duur|dure|goedkoop|goedkope|warm|warme|koud|koude)\b/i,
      /\b(rood|rode|blauw|blauwe|groen|groene|wit|witte|zwart|zwarte|geel|gele)\b/i,
      /\b(leuk|leuke|aardig|aardige|lief|lieve|sterk|sterke|zwak|zwakke)\b/i,
      /\b(een|de|het)\s+\S+e\s+\S+\b/i,     // inflected adjective before noun
      /\b(heel|erg|zeer|best|nogal|vrij|tamelijk)\s+\S+\b/i,  // intensifier + adj
    ],
    enPatterns: [
      /\b(big|small|beautiful|ugly|old|new|long|short|good|bad|expensive|cheap|warm|cold)\b/i,
      /\b(red|blue|green|white|black|yellow|nice|kind|dear|strong|weak)\b/i,
      /\b(very|really|quite|rather|extremely|pretty)\s+\S+\b/i,
    ],
    tipPatterns: [/adjective/i, /bijvoeglijk/i, /beschrijv/i, /description/i],
  },
  'node-08': {
    name: 'Separable verbs',
    tier: 'A1',
    nlPatterns: [
      /\b(op|aan|af|uit|mee|terug|door|over|bij|weg|na|samen|open|dicht)\b.*\b(op|aan|af|uit|mee|terug|door|over|bij|weg|na|samen|open|dicht)\b/i,
      /\b(bel|belt|bellen)\b.*\b(op)\b/i,     // opbellen
      /\b(sta|staat|staan)\b.*\b(op)\b/i,     // opstaan
      /\b(kom|komt|komen)\b.*\b(aan|mee|terug)\b/i,
      /\b(ga|gaat|gaan)\b.*\b(weg|door|mee|uit)\b/i,
      /\b(doe|doet|doen)\b.*\b(mee|open|dicht)\b/i,
      /\b(neem|neemt|nemen)\b.*\b(mee|af|op)\b/i,
      /\bopstaan|opbellen|meekomen|weggaan|terugkomen|aankomen|uitgaan|meenemen|afdoen|opendoen|dichtdoen\b/i,
    ],
    enPatterns: [
      /\b(get up|call up|come along|go away|come back|arrive|go out|take along)\b/i,
      /\b(pick up|put on|take off|turn on|turn off)\b/i,
    ],
    tipPatterns: [/separab/i, /scheidbaar/i, /split/i, /prefix/i],
  },
  'node-09': {
    name: 'Perfectum (present perfect)',
    tier: 'A2',
    nlPatterns: [
      /\b(heb|hebt|heeft|hebben)\s+\S*ge\S+(t|d|en)\b/i,   // hebben + ge-...-t/d/en
      /\b(ben|bent|is|zijn)\s+\S*ge\S+(t|d|en)\b/i,         // zijn + ge-...-t/d/en
      /\bge\S+(t|d|en)\b/i,                                   // any past participle
      /\b(gewerkt|gemaakt|geleerd|gedaan|geworden|gegaan|gekomen|geweest|gehad|gezien|gezegd)\b/i,
      /\b(geschreven|gelezen|gegeven|genomen|geslapen|gesproken|gevonden|begrepen|vergeten)\b/i,
    ],
    enPatterns: [
      /\b(have|has)\s+(worked|made|learned|done|gone|come|been|had|seen|said)\b/i,
      /\b(have|has)\s+\S+ed\b/i,
      /\balready\b/i,
      /\bjust\b/i,
    ],
    tipPatterns: [/perfectum/i, /perfect\b/i, /voltooid/i, /past\s*participle/i, /ge-/i],
  },
  'node-10': {
    name: 'Object pronouns',
    tier: 'A2',
    nlPatterns: [
      /\b(mij|me|jou|je|hem|haar|het|ons|hen|hun|u)\b/i,
      /\b\S+\s+(mij|me|jou|hem|haar|ons|hen|hun)\b/i,  // verb + object pronoun
      /\b(geef|geeft|geven)\s+(mij|me|jou|hem|haar|ons|hun)\b/i,
      /\b(voor|met|aan|van|naar|bij|tegen|over|zonder)\s+(mij|me|jou|hem|haar|ons|hen|hun)\b/i,
    ],
    enPatterns: [
      /\b(me|him|her|us|them|you)\b/i,
      /\b(give|tell|show|send|bring)\s+(me|him|her|us|them)\b/i,
      /\b(to|for|with)\s+(me|him|her|us|them)\b/i,
    ],
    tipPatterns: [/object\s*pronoun/i, /lijdend\s*voorwerp/i, /meewerkend/i],
  },
  'node-11': {
    name: 'Modal verbs (kunnen/moeten/willen)',
    tier: 'A2',
    nlPatterns: [
      /\b(kan|kun|kunt|kunnen|kon|konden)\b/i,
      /\b(moet|moeten|moest|moesten)\b/i,
      /\b(wil|wilt|willen|wilde|wilden)\b/i,
      /\b(mag|mogen|mocht|mochten)\b/i,
      /\b(hoef|hoeft|hoeven|hoefde)\b/i,
      /\b(zal|zul|zult|zullen|zou|zouden)\b/i,
      /\b(kan|moet|wil|mag|hoeft|zal)\s+\S+en\b/i,  // modal + infinitive
    ],
    enPatterns: [
      /\b(can|could|must|should|may|might|want\s+to|need\s+to|have\s+to|shall|will|would)\b/i,
      /\b(allowed\s+to|able\s+to|supposed\s+to)\b/i,
    ],
    tipPatterns: [/modal/i, /hulpwerkwoord/i, /kunnen/i, /moeten/i, /willen/i, /mogen/i],
  },
  'node-12': {
    name: 'Reflexive verbs (zich)',
    tier: 'A2',
    nlPatterns: [
      /\bzich\b/i,                              // zich
      /\b(me|mij|je|zich|ons)\s+(wassen|herinneren|vergissen|voelen|schamen|amuseren|vervelen)\b/i,
      /\bik\s+(me|mij)\s+\S+/i,                // ik me/mij + verb
      /\bhij\s+zich\s+\S+/i,                   // hij zich + verb
      /\b(was|wast|wassen)\s+(me|je|zich)\b/i,
      /\b(voel|voelt|voelen)\s+(me|je|zich)\b/i,
      /\b(herinner|herinnert|herinneren)\s+(me|je|zich)\b/i,
      /\b(vergis|vergist|vergissen)\s+(me|je|zich)\b/i,
      /\b(schaam|schaamt|schamen)\s+(me|je|zich)\b/i,
    ],
    enPatterns: [
      /\b(myself|yourself|himself|herself|ourselves|themselves)\b/i,
      /\b(wash|feel|remember|mistake|ashamed|amuse|bore)\s+(my|your|him|her|our|them)sel(f|ves)\b/i,
    ],
    tipPatterns: [/reflexi/i, /zich\b/i, /wederkerend/i],
  },
  'node-13': {
    name: 'Negation (niet vs geen)',
    tier: 'A2',
    nlPatterns: [
      /\bniet\b/i,
      /\bgeen\b/i,
      /\bnooit\b/i,
      /\bnergens\b/i,
      /\bniets\b/i,
      /\bnobody|niemand\b/i,
      /\bnoch\b/i,
      /\bniet\s+meer\b/i,
      /\bnog\s+niet\b/i,
    ],
    enPatterns: [
      /\b(not|no|never|nothing|nobody|nowhere|neither|nor|don't|doesn't|didn't|isn't|aren't|wasn't|weren't)\b/i,
      /\bnot\s+any(more|longer)?\b/i,
    ],
    tipPatterns: [/negat/i, /niet\b/i, /geen\b/i, /ontkenning/i],
  },
  'node-14': {
    name: 'Prepositions (in/op/aan/bij)',
    tier: 'A2',
    nlPatterns: [
      /\b(in|op|aan|bij|van|naar|met|voor|door|over|onder|boven|achter|naast|tussen|zonder|tegen|langs|tot)\b/i,
      /\b(in de|in het|op de|op het|aan de|aan het|bij de|bij het|van de|van het|naar de|naar het)\b/i,
    ],
    enPatterns: [
      /\b(in|on|at|by|from|to|with|for|through|over|under|above|behind|next to|between|without|against|along|until)\b/i,
    ],
    tipPatterns: [/preposit/i, /voorzetsel/i],
  },
  'node-15': {
    name: 'Adjective agreement & comparison',
    tier: 'A2',
    nlPatterns: [
      /\b\S+er\s+dan\b/i,                    // comparative + dan
      /\b(groter|kleiner|mooier|ouder|nieuwer|langer|korter|beter|slechter|duurder|goedkoper)\b/i,
      /\bhet\s+\S+st[e]?\b/i,                // superlative het -st/-ste
      /\bde\s+\S+ste\b/i,                    // superlative de -ste
      /\b(beste|slechtste|grootste|kleinste|mooiste|oudste|nieuwste|langste|kortste)\b/i,
      /\b(meer|minder|meest|minst)\s+\S+\b/i,  // analytical comparison
      /\bnet\s+zo\s+\S+\s+als\b/i,           // even...als
    ],
    enPatterns: [
      /\b\S+er\s+than\b/i,
      /\b(bigger|smaller|more beautiful|older|newer|longer|shorter|better|worse|more expensive|cheaper)\b/i,
      /\bthe\s+(biggest|smallest|most|best|worst|oldest|newest|longest|shortest)\b/i,
      /\b(more|less|most|least)\s+\S+\b/i,
      /\bas\s+\S+\s+as\b/i,
    ],
    tipPatterns: [/comparat/i, /superlat/i, /vergelijk/i, /overtreffend/i],
  },
  'node-16': {
    name: 'Imperfectum (simple past)',
    tier: 'B1',
    nlPatterns: [
      /\b\S+te\b/,                            // -te ending
      /\b\S+ten\b/,                           // -ten ending
      /\b\S+de\b/,                            // -de ending
      /\b\S+den\b/,                           // -den ending
      /\b(werkte|werkten|maakte|maakten|speelde|speelden|woonde|woonden|leerde|leerden)\b/i,
      /\b(ging|gingen|kwam|kwamen|was|waren|had|hadden|deed|deden|zag|zagen)\b/i,
      /\b(kon|konden|mocht|mochten|moest|moesten|wilde|wilden|zou|zouden)\b/i,
      /\b(stond|stonden|liep|liepen|at|aten|dronk|dronken|sliep|sliepen)\b/i,
      /\b(schreef|schreven|las|lazen|gaf|gaven|nam|namen|sprak|spraken)\b/i,
    ],
    enPatterns: [
      /\b(worked|lived|played|learned|went|came|was|were|had|did|saw|could|would)\b/i,
      /\b\S+ed\b/,
      /\byesterday\b/i,
      /\blast\s+(week|month|year|night)\b/i,
    ],
    tipPatterns: [/imperfectum/i, /simple\s*past/i, /onvoltooid\s*verleden/i, /OVT/i],
  },
  'node-17': {
    name: 'Temporal expressions & conjunctions',
    tier: 'B1',
    nlPatterns: [
      /\b(vandaag|morgen|gisteren|overmorgen|eergisteren|nu|straks|later|toen|vroeger)\b/i,
      /\b(altijd|nooit|soms|vaak|zelden|gewoonlijk|meestal|dagelijks|wekelijks)\b/i,
      /\b(voordat|nadat|terwijl|zodra|totdat|sinds|sinsdien|wanneer|als|toen)\b/i,
      /\b(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b/i,
      /\b(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\b/i,
      /\b(ochtend|middag|avond|nacht|weekend|vakantie)\b/i,
      /\b(uur|minuut|minuten|seconde|dag|dagen|week|weken|maand|maanden|jaar|jaren)\b/i,
      /\b(om|over|voor|half)\s+\d/i,          // time expressions
      /\b(al|nog|pas|net|juist|bijna|al\s+lang|nog\s+steeds)\b/i,
    ],
    enPatterns: [
      /\b(today|tomorrow|yesterday|now|later|then|before|after|ago|already|still|soon)\b/i,
      /\b(always|never|sometimes|often|rarely|usually|daily|weekly)\b/i,
      /\b(before|after|while|as soon as|until|since|when|whenever)\b/i,
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
      /\b(morning|afternoon|evening|night|weekend|vacation|holiday)\b/i,
      /\b(hour|minute|second|day|week|month|year)s?\b/i,
      /\b(o'clock|half past|quarter)\b/i,
    ],
    tipPatterns: [/temporal/i, /time\s*express/i, /conjunct/i, /wanneer/i, /voordat/i, /nadat/i, /terwijl/i],
  },
  'node-18': {
    name: 'Subordinate clauses (verb-final)',
    tier: 'B1',
    nlPatterns: [
      /\b(dat|omdat|als|wanneer|of|terwijl|hoewel|tenzij|zodra|voordat|nadat|doordat|zodat)\s+.+\s+\S+(t|en|n)\b/i,
      /\b(dat|omdat|als|wanneer|of|terwijl|hoewel|tenzij)\b/i,
      /,\s*(dat|omdat|als|wanneer|of|terwijl|hoewel)\b/i,
    ],
    enPatterns: [
      /\b(that|because|if|when|whether|while|although|unless|so that)\b/i,
      /,\s*(because|although|while|when|if|since)\b/i,
    ],
    tipPatterns: [/subordinat/i, /bijzin/i, /verb.?final/i, /werkwoord.*achter/i],
  },
  'node-19': {
    name: 'Imperative',
    tier: 'B1',
    nlPatterns: [
      /^(kom|ga|kijk|luister|lees|schrijf|eet|drink|slaap|loop|spreek|geef|neem|open|sluit|stop|wacht|zeg|doe|laat|help|denk|zit|sta|werk|bel)\b/i,
      /^(kom|ga|kijk|luister|lees)\s/i,        // imperative at start
      /!\s*$/,                                  // ends with !
      /\b(alsjeblieft|alstublieft)\b/i,        // please (informal/formal)
      /\blaat\s+(me|ons|mij)\b/i,              // laat ons (let us)
    ],
    enPatterns: [
      /^(come|go|look|listen|read|write|eat|drink|sleep|walk|speak|give|take|open|close|stop|wait|say|do|let|help|think|sit|stand|work|call)\b/i,
      /!\s*$/,
      /\bplease\s+(come|go|look|listen|read|open|close|stop|wait|sit|stand)\b/i,
      /\blet's\b/i,
    ],
    tipPatterns: [/imperative/i, /command/i, /gebiedend/i],
  },
  'node-20': {
    name: 'Diminutives (-je/-tje/-pje)',
    tier: 'B1',
    nlPatterns: [
      /\b\S+je\b/i,                           // -je diminutive
      /\b\S+tje\b/i,                          // -tje diminutive
      /\b\S+pje\b/i,                          // -pje diminutive
      /\b\S+etje\b/i,                         // -etje diminutive
      /\b(huisje|katje|hondje|boompje|bloemetje|mannetje|vrouwtje|kindje|kopje|beetje)\b/i,
    ],
    enPatterns: [
      /\b(little|small|tiny)\s+\S+\b/i,
      /\b(a bit|a little)\b/i,
    ],
    tipPatterns: [/diminut/i, /verkleinwoord/i, /\-je\b/i, /\-tje\b/i],
  },
  'node-21': {
    name: 'Relative clauses',
    tier: 'B1',
    nlPatterns: [
      /\b(die|dat)\s+\S+\s+\S+/i,            // die/dat + clause
      /,\s*(die|dat)\s+/i,                    // , die/dat
      /\bwaar\s+\S+\s+\S+\b/i,               // waar + clause
      /\b(wie|wat)\s+\S+\s+\S+/i,            // wie/wat in relative
    ],
    enPatterns: [
      /\b(who|which|that|whom|whose)\s+\S+\b/i,
      /,\s*(who|which|that)\s/i,
    ],
    tipPatterns: [/relative/i, /betrekkelijk/i, /die\/dat/i],
  },
  'node-22': {
    name: 'Passive voice (worden/zijn)',
    tier: 'B2',
    nlPatterns: [
      /\b(wordt|worden|werd|werden)\s+\S*(ge\S+[tden])\b/i,   // worden + past participle
      /\b(is|zijn|was|waren)\s+\S*(ge\S+[tden])\b/i,          // zijn + past participle (result)
      /\bwordt\s+ge/i,
      /\bwerden\s+ge/i,
      /\bwerd\s+ge/i,
      /\b(wordt|werden|werd)\s+(gemaakt|gedaan|geschreven|gelezen|gegeven|gezien|gezegd|gebouwd|gebruikt)\b/i,
    ],
    enPatterns: [
      /\b(is|are|was|were|been|being)\s+(made|done|written|read|given|seen|said|built|used|found|taken|known)\b/i,
      /\bwas\s+\S+ed\b/i,
      /\b(is|are|was|were)\s+\S+ed\s+by\b/i,
    ],
    tipPatterns: [/passive/i, /lijdend/i, /worden\b/i],
  },
  'node-23': {
    name: 'Er (there/of it)',
    tier: 'B2',
    nlPatterns: [
      /\ber\s+(is|zijn|was|waren|wordt|worden|werd|werden)\b/i,   // er is/zijn (existential)
      /\ber\s+\S+\s+(van|mee|aan|op|in|over|uit|voor|naar|bij|tegen|om)\b/i,  // er...van/mee/etc (prepositional)
      /\ber\s+\d+\b/i,                        // er + number (quantitative)
      /\b(ervan|ermee|eraan|erop|erin|erover|eruit|ervoor|erbij)\b/i,  // combined
      /\ber\s+wordt\b/i,                      // er wordt (impersonal passive)
    ],
    enPatterns: [
      /\bthere\s+(is|are|was|were)\b/i,
      /\bof\s+(it|them)\b/i,
      /\b(about|with|on|in)\s+it\b/i,
    ],
    tipPatterns: [/\ber\b/i, /there\b/i, /existential/i, /prepositional\s*er/i],
  },
  'node-24': {
    name: 'Future & conditional',
    tier: 'B2',
    nlPatterns: [
      /\b(zal|zul|zult|zullen)\s+\S+en\b/i,     // zullen + infinitive (future)
      /\b(zou|zouden)\s+\S+en\b/i,               // zou/zouden + infinitive (conditional)
      /\bgaat?\s+\S+en\b/i,                       // gaan + infinitive (near future)
      /\b(zou|zouden)\b/i,
      /\b(zal|zullen)\b/i,
    ],
    enPatterns: [
      /\bwill\s+\S+\b/i,
      /\bwould\s+\S+\b/i,
      /\bgoing\s+to\s+\S+\b/i,
      /\bif\s+.*would\b/i,
    ],
    tipPatterns: [/future/i, /conditional/i, /toekomend/i, /zou\b/i, /zullen\b/i],
  },
  'node-25': {
    name: 'Advanced connectors',
    tier: 'B2',
    nlPatterns: [
      /\b(echter|desondanks|niettemin|bovendien|daarnaast|daarentegen|ondertussen|integendeel)\b/i,
      /\b(bijgevolg|derhalve|daarom|dus|immers|namelijk|enerzijds|anderzijds)\b/i,
      /\b(hoewel|ofschoon|ondanks|mits|tenzij|behalve|naarmate|aangezien|doordat|zodat)\b/i,
      /\b(met andere woorden|dat wil zeggen|ter illustratie|al met al|kort gezegd)\b/i,
    ],
    enPatterns: [
      /\b(however|nevertheless|moreover|furthermore|meanwhile|on the contrary|therefore|consequently|indeed|namely)\b/i,
      /\b(although|despite|unless|except|as long as|since|so that|in order to)\b/i,
      /\b(in other words|that is|to illustrate|all in all)\b/i,
    ],
    tipPatterns: [/connector/i, /voegwoord/i, /linking/i, /conjunction/i],
  },
  'node-26': {
    name: 'Infinitive constructions (om te)',
    tier: 'B2',
    nlPatterns: [
      /\bom\s+te\s+\S+en\b/i,                 // om te + infinitive
      /\bte\s+\S+en\b/i,                      // te + infinitive
      /\b(om|zonder|in plaats van)\s+te\s+\S+/i,
      /\b(proberen|beginnen|vergeten|beloven|weigeren|hopen)\s+te\s+\S+/i,
    ],
    enPatterns: [
      /\b(in order\s+to|to\s+\S+|without\s+\S+ing|instead\s+of\s+\S+ing)\b/i,
      /\b(try|begin|forget|promise|refuse|hope)\s+to\b/i,
    ],
    tipPatterns: [/infiniti/i, /om\s+te/i, /te\s+\+/i],
  },
  'node-27': {
    name: 'Reported speech',
    tier: 'B2',
    nlPatterns: [
      /\b(zei|zeiden)\s+dat\b/i,
      /\b(vertelde|vertelden)\s+dat\b/i,
      /\b(vroeg|vroegen)\s+(of|wat|waar|wanneer|wie|hoe)\b/i,
      /\b(antwoordde|antwoordden)\b/i,
      /\b(beweerde|beweerden)\b/i,
      /\b(legde\s+uit|verklaarde)\b/i,
      /,\s*dat\s+\S+\s+\S+\b/i,
    ],
    enPatterns: [
      /\b(said|told|asked|replied|explained|claimed|reported|announced)\s+that\b/i,
      /\b(he|she|they)\s+said\b/i,
    ],
    tipPatterns: [/reported/i, /indirect\s*speech/i, /indirecte\s*rede/i],
  },
  'node-28': {
    name: 'Idiomatic expressions',
    tier: 'C1',
    nlPatterns: [
      /\b(in de war|op de hoogte|van plan|op zoek|ter sprake|aan de slag)\b/i,
      /\b(het gaat om|het ligt aan|het valt mee|het valt tegen)\b/i,
      /\b(met open armen|op stel en sprong|in één klap|van de kaart)\b/i,
      /\b(een oogje op|de draak steken|door de vingers zien|een handje helpen)\b/i,
    ],
    enPatterns: [
      /\b(idiom|proverb|saying|expression)\b/i,
      /\b(piece of cake|break a leg|raining cats|cold shoulder)\b/i,
    ],
    tipPatterns: [/idiom/i, /expression/i, /uitdrukking/i, /spreekwoord/i],
  },
  'node-29': {
    name: 'Formal vs informal register',
    tier: 'C1',
    nlPatterns: [
      /\bu\b/,                                 // formal u
      /\bjij\b/i,                              // informal jij
      /\b(meneer|mevrouw|geachte|hoogachtend)\b/i,
      /\b(zou\s+u|kunt\s+u|wilt\s+u)\b/i,
      /\b(met\s+vriendelijke\s+groet|hoogachtend|gaarne)\b/i,
    ],
    enPatterns: [
      /\b(formal|informal|polite|casual|sir|madam|mr|mrs|dear)\b/i,
      /\bcould\s+you\s+please\b/i,
    ],
    tipPatterns: [/register/i, /formal/i, /informal/i, /u\/jij/i, /beleefd/i],
  },
  'node-30': {
    name: 'Compound words',
    tier: 'C1',
    nlPatterns: [
      /\b\S{12,}\b/,                          // very long words (compounds)
      /\b(zonnebloem|regenboog|huiskamer|slaapkamer|badkamer|woordenboek|schooljaar)\b/i,
      /\b(voetbal|handbal|schaatsen|koffietafel|werkgever|werknemer)\b/i,
    ],
    enPatterns: [
      /\b(compound|combined)\b/i,
    ],
    tipPatterns: [/compound/i, /samenstelling/i, /samengesteld/i],
  },
  'node-31': {
    name: 'Advanced word order',
    tier: 'C1',
    nlPatterns: [
      /\b(niet\s+alleen|maar\s+ook|zowel|als|noch|hetzij)\b/i,
      /\b(weliswaar|daarentegen|desalniettemin|evenwel)\b/i,
    ],
    enPatterns: [
      /\b(not only|but also|either|or|neither|nor)\b/i,
    ],
    tipPatterns: [/word\s*order/i, /woordvolgorde/i, /advanced/i],
  },
  'node-32': {
    name: 'Literary & written Dutch',
    tier: 'C2',
    nlPatterns: [
      /\b(hetgeen|hetwelk|dewelke|alhoewel|nochtans|dienaangaande|mitsdien)\b/i,
      /\b(zij|men)\s+\S+\b/i,                 // formal zij/men
      /\bmen\b/i,
    ],
    enPatterns: [
      /\b(literary|poetic|archaic|eloquent|formal writing)\b/i,
    ],
    tipPatterns: [/literary/i, /written/i, /geschreven/i],
  },
  'node-33': {
    name: 'Academic discourse',
    tier: 'C2',
    nlPatterns: [
      /\b(onderzoek|analyse|theorie|hypothese|methode|resultaat|conclusie)\b/i,
      /\b(beschouwen|analyseren|concluderen|veronderstellen|constateren)\b/i,
    ],
    enPatterns: [
      /\b(research|analysis|theory|hypothesis|method|result|conclusion)\b/i,
      /\b(furthermore|moreover|in conclusion|to summarize)\b/i,
    ],
    tipPatterns: [/academic/i, /wetenschappelijk/i, /discourse/i],
  },
  'node-34': {
    name: 'Cultural fluency',
    tier: 'C2',
    nlPatterns: [
      /\b(cultuur|traditie|gewoonte|feest|geschiedenis)\b/i,
      /\b(Nederland|Nederlands|Amsterdam|Rotterdam|Vlaanderen|Vlaams|België)\b/i,
      /\b(Koningsdag|Sinterklaas|Kerst|Pasen|carnaval)\b/i,
    ],
    enPatterns: [
      /\b(culture|tradition|custom|heritage|festival|Dutch|Netherlands|Belgium)\b/i,
    ],
    tipPatterns: [/cultur/i, /traditie/i],
  },
  'node-35': {
    name: 'Advanced mixed mastery',
    tier: 'C2',
    nlPatterns: [],
    enPatterns: [],
    tipPatterns: [],
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

  // Primary: Dutch morphology (weight 3)
  for (const pat of node.nlPatterns) {
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
console.log('=== Dutch Deck Node Reassignment ===\n');

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
