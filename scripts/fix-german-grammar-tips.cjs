/**
 * Fix German grammar tips: increase from 10% to ~28% with contextual tips.
 * Replaces boring pattern-based tips and adds new ones.
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'german', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// ── Contextual tips per node (pool to pick from) ──────────────────
const NODE_TIPS = {
  'node-01': [
    "Germans shake hands when greeting formally. 'Guten Tag' is standard; 'Hallo' is casual.",
    "'Wie geht es Ihnen?' is formal; 'Wie geht's?' is what friends say. The 'Ihnen' signals respect.",
    "'Tschüss' is casual goodbye. In formal settings, say 'Auf Wiedersehen' instead.",
    "'Freut mich' (pleased to meet you) is the standard response when introduced to someone.",
    "In German-speaking countries, you address strangers with 'Sie' until they offer 'Du'. Getting this wrong is a social faux pas.",
    "'Grüß Gott' is the standard greeting in Bavaria and Austria — it's not religious, just regional.",
    "Germans typically say 'Guten Morgen' until about 10am, 'Guten Tag' until 6pm, then 'Guten Abend'.",
    "'Entschuldigung' works both as 'excuse me' (getting attention) and 'sorry' (apologizing).",
    "When answering the phone in German, you state your last name: 'Schmidt' or 'Hier Schmidt'.",
    "'Bis bald' (see you soon) vs 'Bis morgen' (see you tomorrow) — Germans are specific about when they'll meet.",
  ],
  'node-02': [
    "German verbs always go in second position in statements. 'Ich spiele Tennis' — the verb 'spiele' is #2.",
    "The du-form adds -st: 'du spielst', 'du lernst'. If the stem ends in -s/-z/-ß, just add -t: 'du tanzt'.",
    "German always capitalizes 'Sie' (formal you) to distinguish it from 'sie' (she/they).",
    "'Arbeiten' adds an extra -e- before endings with consonants: 'du arbeitest', 'er arbeitet' — for pronunciation ease.",
    "Unlike English, German has no continuous tense. 'Ich spiele' means both 'I play' and 'I am playing'.",
    "'Wir' and 'sie/Sie' forms are identical to the infinitive: wir spielen, sie spielen, Sie spielen.",
    "The ihr-form (you all) adds -t: 'ihr spielt'. It's used when addressing multiple people you know well.",
    "Stem-changing verbs only change in du and er/sie/es forms: 'ich laufe' but 'du läufst', 'er läuft'.",
  ],
  'node-03': [
    "'Sein' expresses identity and states: 'Ich bin müde' (I am tired). 'Haben' expresses possession: 'Ich habe Hunger' (I have hunger).",
    "German says 'Ich habe Hunger/Durst' (I have hunger/thirst), not 'I am hungry/thirsty' like English.",
    "'Es gibt' (there is/are) uses 'geben' + accusative, not 'sein': 'Es gibt einen Park hier.'",
    "'Ich bin 25 Jahre alt' — German uses 'sein' (to be) for age, unlike French/Spanish which use 'have'.",
    "'Haben' is also the helper verb for most perfect tenses: 'Ich habe gespielt' (I have played).",
    "'Sein' is used as helper for movement/state-change verbs: 'Ich bin gegangen' (I have gone).",
    "The question 'Bist du...?' is informal. 'Sind Sie...?' is what you'd ask your boss.",
    "'Mir ist kalt' (to me is cold) — German uses dative + sein for feelings, not 'I am cold'.",
  ],
  'node-04': [
    "No reliable rules for German gender — 'Mädchen' (girl) is neuter (das). You just have to memorize each noun's article.",
    "Compound nouns take the gender of the LAST word: 'die Haustür' (house door) is feminine because 'Tür' is feminine.",
    "Words ending in -ung, -heit, -keit, -schaft, -tion are almost always feminine (die).",
    "Words ending in -chen and -lein (diminutives) are always neuter (das), even 'das Mädchen' (the girl).",
    "Most words ending in -er referring to male persons/agents are masculine: der Lehrer, der Fahrer.",
    "In plural, all genders use 'die': der Mann → die Männer, das Kind → die Kinder, die Frau → die Frauen.",
    "'Der/die/das' also function as demonstrative pronouns: 'Das ist gut' (That is good).",
    "Foreign words often keep patterns: words from French ending in -age are neuter (das Garage), -ment too (das Dokument).",
  ],
  'node-05': [
    "The V2 rule: the conjugated verb is ALWAYS in position 2 in a statement. Everything else can move around it.",
    "'Heute spiele ich Tennis' — when time comes first, the subject flips behind the verb. The verb stays at #2.",
    "Yes/no questions put the verb first: 'Spielst du Tennis?' — no helping verb needed like English 'Do you play?'",
    "W-questions put the question word first, verb second: 'Wo wohnst du?' (Where do you live?)",
    "Time-Manner-Place: German prefers 'Ich fahre morgen mit dem Zug nach Berlin' (when-how-where).",
    "When you start with a subordinate clause, the main clause flips: 'Weil es regnet, bleibe ich zu Hause.'",
    "'Nicht' usually goes at the end, or before the thing being negated: 'Ich spiele nicht' vs 'Ich spiele nicht Tennis'.",
    "Multiple verbs? The conjugated one is at position 2, the rest go to the END: 'Ich will morgen Tennis spielen.'",
  ],
  'node-06': [
    "German uses 24-hour time in official contexts: '14:30 Uhr' (2:30 PM). In casual speech, 'halb drei' means 2:30.",
    "'Halb drei' means HALF TO three (2:30), not half past three. This trips up every English speaker.",
    "'Viertel vor drei' (quarter to 3) = 2:45. 'Viertel nach drei' (quarter past 3) = 3:15.",
    "For dates, German uses day.month.year: '13.03.2026' is March 13th. Months are written with ordinal numbers.",
    "Numbers 21-99 are said backwards: 25 = 'fünfundzwanzig' (five-and-twenty).",
    "Years are said as hundreds: 1990 = 'neunzehnhundertneunzig' (nineteen-hundred-ninety).",
    "'Am Montag' (on Monday), 'im Januar' (in January), 'um 8 Uhr' (at 8 o'clock) — different prepositions for each.",
    "The accusative is used for duration: 'Ich bleibe einen Monat' (I'm staying for a month).",
  ],
  'node-07': [
    "'Ich hätte gern...' (I would like...) is the polite way to order. 'Ich will...' sounds demanding.",
    "In Germany, you usually say 'Zahlen, bitte' (pay, please) to get the bill. Tipping ~10% is customary.",
    "'Stimmt so' means 'keep the change' — say it when paying if the tip is already included in what you hand over.",
    "Germans say 'Guten Appetit' before eating. It's considered rude not to wait for everyone to be served.",
    "'Ein Bier, bitte' — you don't need an article with 'bitte'. But 'Ich nehme das Schnitzel' uses the article.",
    "'Noch ein Bier' means 'another beer'. 'Noch' is incredibly useful — it means 'another/still/yet'.",
    "'Gemütlich' describes a cozy, pleasant atmosphere — it's a core German cultural concept, especially in restaurants and cafés.",
    "Germans often share tables ('Zusammensitzen') in busy restaurants. Ask 'Ist hier noch frei?' before sitting.",
  ],
  'node-08': [
    "Separable verbs split in present tense: 'anfangen' → 'Ich fange jetzt an.' The prefix goes to the very end.",
    "In subordinate clauses, the verb reunites: 'Ich weiß, dass er morgen anfängt.' — 'anfängt' stays together.",
    "Common separable prefixes: an-, auf-, aus-, ein-, mit-, vor-, zu-, ab-, weg-, zurück-. They're stressed in speech.",
    "Inseparable prefixes (be-, emp-, ent-, er-, ge-, miss-, ver-, zer-) NEVER separate. Stress falls on the stem, not the prefix.",
    "'Aufstehen' (to get up), 'aufmachen' (to open), 'aufhören' (to stop) — 'auf' has different meanings in each.",
    "'Ich rufe dich an' (I'll call you) — even objects go between the verb and its prefix.",
    "Past participle of separable verbs: ge- goes BETWEEN prefix and stem: 'aufgemacht', 'angefangen', 'mitgebracht'.",
    "Some prefixes are both separable and inseparable depending on meaning: 'umfahren' (drive around) vs 'umfahren' (knock over).",
  ],
  'node-09': [
    "Germans use Perfekt (not simple past) in everyday speech: 'Ich habe gegessen' not 'Ich aß'. Präteritum is for writing.",
    "Most verbs use 'haben': 'Ich habe gespielt.' Verbs of movement/change use 'sein': 'Ich bin gefahren.'",
    "Regular past participle: ge- + stem + -t: 'machen → gemacht', 'spielen → gespielt'.",
    "Verbs with inseparable prefixes skip 'ge-': 'besuchen → besucht', 'verstehen → verstanden'.",
    "Verbs ending in -ieren skip 'ge-': 'telefonieren → telefoniert', 'studieren → studiert'.",
    "The past participle goes to the END of the clause: 'Ich habe gestern Tennis gespielt.'",
    "Strong verbs change their stem vowel: 'trinken → getrunken', 'schreiben → geschrieben'.",
    "'Sein' and 'haben' themselves use Präteritum even in speech: 'Ich war' not 'Ich bin gewesen'.",
  ],
  'node-10': [
    "Dative marks the indirect object (receiver): 'Ich gebe dem Mann das Buch' — 'dem Mann' is dative.",
    "Dative changes: der→dem, die→der, das→dem, die(pl)→den + -n on noun. 'Den Kindern' not 'den Kinder'.",
    "Certain verbs ALWAYS take dative: helfen, danken, gefallen, gehören, folgen, glauben, antworten.",
    "'Mir gefällt das' (that pleases me) — 'gefallen' takes dative. Don't say 'Ich gefalle das'.",
    "Dative prepositions (always dative): aus, bei, mit, nach, seit, von, zu, gegenüber.",
    "'Bei mir' means 'at my place'. 'Zu mir' means 'to my place'. Germans use these constantly.",
    "In commands with two objects, dative (person) comes before accusative (thing): 'Gib mir das Buch.'",
    "'Wie geht es dir/Ihnen?' — 'es geht' takes dative. That's why it's 'mir geht es gut', not 'mich'.",
  ],
  'node-11': [
    "Modal verbs push the main verb to the end as infinitive: 'Ich kann gut schwimmen' — 'schwimmen' goes last.",
    "'Können' = ability/possibility, 'dürfen' = permission, 'müssen' = necessity. 'Darf ich?' (May I?) is polite.",
    "'Müssen' in negative doesn't mean 'must not' — 'Du musst nicht' = you don't have to. 'Must not' = 'Du darfst nicht'.",
    "'Möchten' (would like) is the polite form for requests. 'Ich möchte ein Bier' — use this in restaurants.",
    "Modal verbs have no vowel change in ich/er/sie forms: 'ich kann, er kann' (not 'er kannt').",
    "'Sollen' implies someone else's will: 'Du sollst das machen' = You're supposed to do that (someone said so).",
    "In Perfekt, modals use double infinitive: 'Ich habe schwimmen können' — both verbs stay as infinitive at the end.",
    "'Wollen' expresses intention/desire: 'Ich will nach Berlin fahren.' It's stronger than 'möchten'.",
  ],
  'node-12': [
    "Daily routine uses reflexive + accusative: 'Ich wasche mich' (I wash myself), 'Ich ziehe mich an' (I get dressed).",
    "Some reflexives take dative: 'Ich wasche mir die Hände' — when there's a specific body part, use dative reflexive.",
    "German daily routine is very structured: 'Feierabend' (end of work day) is a sacred concept — work ends and leisure begins.",
    "'Um 7 Uhr stehe ich auf' — daily times use 'um' + time. Note the separable verb 'aufstehen' splits.",
    "'Sich freuen auf' (look forward to) vs 'sich freuen über' (be happy about) — the preposition changes the meaning entirely.",
    "'Zähneputzen' (brushing teeth) is one compound word in German. Many daily activities become compounds.",
    "Reflexive verbs in commands: 'Setz dich!' (Sit down!) — the reflexive pronoun follows the verb.",
    "'Sich beeilen' (to hurry) — 'Beeil dich!' is what you'll hear when running late in Germany.",
  ],
  'node-13': [
    "'Nicht' negates verbs and adjectives: 'Ich spiele nicht.' 'Kein' negates nouns: 'Ich habe kein Auto.'",
    "'Kein' replaces 'ein': 'Ich habe ein Auto → Ich habe kein Auto.' It also works with uncountable nouns: 'kein Wasser'.",
    "'Nicht' goes before adjectives: 'Das ist nicht gut.' Before prepositions: 'Ich gehe nicht nach Hause.'",
    "'Nicht' goes at the end when negating the whole sentence: 'Ich verstehe das nicht.'",
    "'Kein' declines like 'ein': keinen (acc masc), keinem (dat), keiner (dat fem/gen fem). It follows the same pattern.",
    "'Noch nicht' (not yet) vs 'nicht mehr' (not anymore) vs 'noch nie' (never yet) — these combinations are very common.",
    "'Nein' answers a yes/no question. 'Doch' contradicts a negative: 'Du magst das nicht!' — 'Doch!' (Yes I do!).",
    "'Gar nicht' means 'not at all' — stronger than just 'nicht'. 'Das gefällt mir gar nicht.'",
  ],
  'node-14': [
    "Wechselpräpositionen (two-way prepositions) take accusative for movement TO, dative for location AT: in, an, auf, über, unter, vor, hinter, neben, zwischen.",
    "'Ich gehe in den Park' (acc = going INTO) vs 'Ich bin im Park' (dat = being IN). The case tells you movement vs location.",
    "'Im' = in dem, 'am' = an dem, 'ins' = in das, 'ans' = an das — these contractions are almost always used in speech.",
    "'Auf dem Tisch' (on the table, stationary) vs 'auf den Tisch' (onto the table, movement).",
    "'An der Wand' = on the wall (vertical surface), 'auf dem Boden' = on the floor (horizontal surface).",
    "'Vor' means both 'in front of' (spatial) and 'ago' (temporal): 'vor dem Haus', 'vor drei Tagen'.",
    "'Zwischen' (between) is useful in time expressions: 'zwischen 8 und 10 Uhr' (between 8 and 10).",
    "The mnemonic 'An, Auf, Hinter, In, Neben, Über, Unter, Vor, Zwischen' — these 9 switch between acc/dat.",
  ],
  'node-15': [
    "Reflexive pronouns change by person: mich/mir (ich), dich/dir (du), sich (er/sie/es/sie/Sie), uns (wir), euch (ihr).",
    "'Sich erinnern an' (to remember), 'sich interessieren für' (to be interested in) — many reflexives need specific prepositions.",
    "Some verbs are reflexive in German but not in English: 'sich setzen' (to sit down), 'sich befinden' (to be located).",
    "'Einander' can replace reflexive for reciprocal: 'Sie lieben sich' = they love themselves/each other. 'Sie lieben einander' = they love each other (unambiguous).",
    "Reflexive verbs use 'haben' in Perfekt, even movement ones: 'Ich habe mich gesetzt' (not 'bin').",
    "German reflexive is mandatory where English uses possessive: 'Ich wasche mir die Hände' (I wash my hands), not 'meine Hände'.",
  ],
  'node-16': [
    "Comparative: add -er: 'schnell → schneller'. Superlative: am + -sten: 'am schnellsten'. Simple as that.",
    "Common irregulars: gut→besser→am besten, viel→mehr→am meisten, gern→lieber→am liebsten, hoch→höher→am höchsten.",
    "One-syllable adjectives with a/o/u often get umlaut: alt→älter, groß→größer, jung→jünger, lang→länger.",
    "'Als' for comparisons (than): 'Er ist größer als ich.' 'So...wie' for equality: 'Er ist so groß wie ich.'",
    "'Immer + comparative' means 'more and more': 'Es wird immer kälter' (It's getting colder and colder).",
    "'Je...desto' = the more...the more: 'Je mehr ich lerne, desto besser verstehe ich.' Very common pattern.",
    "Superlative as adjective before noun gets endings: 'das beste Restaurant', 'die schönste Stadt'.",
    "'Am liebsten' (most preferably) is used constantly: 'Am liebsten esse ich Pizza' = My favorite food is pizza.",
  ],
  'node-17': [
    "'Links' (left), 'rechts' (right), 'geradeaus' (straight ahead) — the basics for getting around.",
    "'Die nächste Straße links' = the next street on the left. Germans give precise, structured directions.",
    "'Mit dem Zug/Bus/Auto fahren' — always dative after 'mit'. 'Ich fahre mit dem Zug nach München.'",
    "'Zu Fuß gehen' = to walk (go on foot). 'Laufen' in northern Germany means 'walk', in the south it means 'run'.",
    "German train announcements: 'Der ICE nach Berlin fährt auf Gleis 5' — Gleis = platform/track.",
    "'Umsteigen' (to transfer/change) is key for public transport: 'Sie müssen in Frankfurt umsteigen.'",
    "Germans are famous for punctuality. 'Pünktlich' (on time) is a core value — trains excepted.",
    "'Einsteigen' (board), 'aussteigen' (get off), 'umsteigen' (transfer) — all separable verbs for transit.",
  ],
  'node-18': [
    "In subordinate clauses, the verb jumps to the END: 'Ich weiß, dass er morgen kommt.' — 'kommt' is last.",
    "'Weil' (because), 'dass' (that), 'wenn' (if/when), 'obwohl' (although), 'als' (when, past) — all send the verb to the end.",
    "Comma is MANDATORY before subordinate clauses in German. 'Ich denke, dass...' — never skip the comma.",
    "When the subordinate clause comes first, the main clause verb follows immediately: 'Wenn es regnet, bleibe ich zu Hause.'",
    "'Als' = when (single past event): 'Als ich Kind war...' 'Wenn' = when (repeated/future): 'Wenn ich Zeit habe...'",
    "With modal verbs in subordinate clauses, the modal goes LAST: 'Ich weiß, dass er kommen kann.'",
    "'Ob' introduces indirect yes/no questions: 'Ich weiß nicht, ob er kommt.' (I don't know if he's coming.)",
    "Multiple verbs in a subordinate clause: all cluster at the end: 'weil er hat kommen müssen' (because he had to come).",
  ],
  'node-19': [
    "Informal imperative (du): just use the stem: 'Komm!' 'Mach das!' Drop the -st ending and the 'du'.",
    "Formal imperative (Sie): verb first + Sie: 'Kommen Sie!' 'Setzen Sie sich!' — always include 'Sie'.",
    "Separable verbs in imperative: prefix goes to the end: 'Mach die Tür auf!' 'Steh auf!'",
    "'Bitte' softens any command: 'Gib mir bitte das Salz.' Without it, commands sound harsh.",
    "'Lass uns...' (Let's...) for suggestions: 'Lass uns gehen!' (Let's go!) — very common in casual speech.",
    "Stem-changing e→i verbs keep the change: 'Gib!' (from geben), 'Nimm!' (from nehmen), 'Lies!' (from lesen).",
    "But e→ie does NOT apply in imperative: 'Gib!' not 'Gieb!'. And a→ä does NOT change either: 'Fahr!' not 'Fähr!'",
    "The 'ihr' form is identical to the present: 'Kommt!' 'Macht!' — just drop the 'ihr'.",
  ],
  'node-20': [
    "Adjective endings depend on three things: gender, case, and whether there's a der/ein/no article before it.",
    "After 'der/die/das' (definite): mostly -e in nominative, -en everywhere else: 'der große Mann', 'dem großen Mann'.",
    "After 'ein/kein' (indefinite): add the gender signal the article is missing: 'ein großer Mann' (-er shows masculine).",
    "With no article, the adjective carries ALL the case/gender info: 'großer Mann', 'große Frau', 'großes Kind'.",
    "The -en ending is your safe bet — it's used in most oblique cases and plural forms.",
    "Predicate adjectives (after sein) get NO ending: 'Der Mann ist groß.' — never 'großer'.",
    "Colors as adjectives get endings too: 'das rote Auto', 'ein rotes Auto' — same rules as other adjectives.",
    "Multiple adjectives all get the same ending: 'der große, alte Baum' — both get -e after 'der'.",
  ],
  'node-21': [
    "Genitive shows possession: 'das Auto des Mannes' (the man's car). Masculine/neuter nouns add -(e)s.",
    "In spoken German, 'von + dative' often replaces genitive: 'das Auto von meinem Vater' instead of 'meines Vaters'.",
    "Genitive prepositions: 'wegen' (because of), 'trotz' (despite), 'während' (during), 'statt' (instead of).",
    "Proper names add -s without apostrophe: 'Marias Auto', 'Deutschlands Geschichte'. Only use apostrophe if the name ends in s/z.",
    "'Dessen' (whose, masc/neut) and 'deren' (whose, fem/pl) are genitive relative pronouns.",
    "Genitive is considered more formal/written. Using it in speech sounds educated — but 'von + dative' is fine in casual talk.",
  ],
  'node-22': [
    "Relative clauses use 'der/die/das' (which agree in gender/number with the noun, but case depends on their role in the clause).",
    "The verb goes to the END in relative clauses: 'Der Mann, der hier wohnt, ist nett.'",
    "'Was' is used after indefinite pronouns: 'Alles, was er sagt...' 'Etwas, was ich brauche...'",
    "'Wo' can replace 'in dem/in der' for places: 'Die Stadt, wo ich wohne' = 'Die Stadt, in der ich wohne.'",
    "Commas are mandatory around relative clauses in German — always.",
    "In formal writing, avoid stranding prepositions: 'Der Mann, mit dem ich spreche' (not 'den ich mit spreche').",
  ],
  'node-23': [
    "Passive with 'werden': 'Das Buch wird gelesen' (The book is being read). Focus shifts from doer to action.",
    "'Von + dative' introduces the agent: 'Das Buch wird von mir gelesen.' (The book is read by me.)",
    "State passive uses 'sein': 'Die Tür ist geöffnet' (The door is open — state) vs 'Die Tür wird geöffnet' (is being opened — process).",
    "'Man' + active is often preferred over passive in spoken German: 'Man spricht Deutsch' rather than 'Deutsch wird gesprochen.'",
    "Passive in past: 'wurde + participle': 'Das Haus wurde 1900 gebaut.' (The house was built in 1900.)",
    "'Es wird getanzt' (There is dancing) — impersonal passive describes activities without a subject. Very German.",
  ],
  'node-24': [
    "Konjunktiv II expresses hypothetical/wishes: 'Wenn ich reich wäre, würde ich reisen.' (If I were rich, I'd travel.)",
    "For most verbs, use 'würde + infinitive': 'Ich würde kommen' (I would come). Simpler than forming each verb's Konj II.",
    "Common verbs use their own Konj II forms: wäre (would be), hätte (would have), könnte (could), müsste (should/would have to).",
    "'Ich hätte gern...' (I would like) is THE polite phrase for ordering, requesting, or wishing in German.",
    "'An deiner Stelle würde ich...' (In your place, I would...) — standard way to give advice.",
    "'Wenn' (if) + Konjunktiv II for unreal conditions: 'Wenn ich Zeit hätte, würde ich kommen.'",
  ],
  'node-25': [
    "Konjunktiv I is for reported speech: 'Er sagt, er sei krank.' (He says he is sick.) — used in news/formal writing.",
    "If Konj I looks identical to indicative, use Konj II instead: 'sie sagen → sie sagten' (not 'sie sagen').",
    "'Er sagte, er habe keine Zeit' — Konj I of 'haben' in reported speech. This is standard in newspapers.",
    "In casual speech, Germans skip Konj I and just use indicative: 'Er hat gesagt, er ist krank.'",
    "Konjunktiv I forms: sei (sein), habe (haben), könne (können), müsse (müssen) — mostly sei and habe matter.",
    "Headlines and journalism love Konj I: it signals 'this is what someone claimed, not what I confirm.'",
  ],
  'node-26': [
    "'Um...zu + infinitive' expresses purpose: 'Ich lerne Deutsch, um in Berlin zu arbeiten.' (in order to work)",
    "'Ohne...zu + infinitive' = without doing: 'Er ging, ohne sich zu verabschieden.' (He left without saying goodbye.)",
    "'Statt/Anstatt...zu + infinitive' = instead of: 'Statt zu lernen, spielt er.' (Instead of studying, he plays.)",
    "'Zu + infinitive' after many verbs: 'Ich versuche, pünktlich zu kommen.' — comma before the infinitive clause.",
    "Separable verbs with 'zu': 'zu' goes BETWEEN prefix and verb: 'anzufangen', 'aufzuhören', 'mitzubringen'.",
    "'Es ist wichtig, das zu verstehen.' — 'zu' constructions are common after 'es ist + adjective'.",
  ],
  'node-27': [
    "'Deshalb/Deswegen' (therefore) causes inversion: 'Deshalb bleibe ich zu Hause.' — verb stays at position 2.",
    "'Trotzdem' (nevertheless) also causes inversion: 'Es regnet. Trotzdem gehe ich spazieren.'",
    "'Außerdem' (besides/moreover) adds information: 'Es ist billig. Außerdem ist es schön.'",
    "'Entweder...oder' (either...or) and 'weder...noch' (neither...nor) — paired connectors.",
    "'Zwar...aber' (indeed...but) is a sophisticated connector: 'Das ist zwar teuer, aber es lohnt sich.'",
    "'Sowohl...als auch' (both...and) for inclusive statements: 'Sowohl Deutsch als auch Englisch.'",
  ],
  'node-28': [
    "German compounds are written as ONE word: 'Handschuh' (hand+shoe = glove). No spaces, no hyphens.",
    "The last word determines gender AND meaning: 'der Schlüssel' + 'das Loch' = 'das Schlüsselloch' (keyhole, neuter).",
    "Sometimes -s-/-n-/-en- connects parts: 'Arbeit-s-platz' (workplace), 'Straße-n-bahn' (tram).",
    "'Donaudampfschifffahrtsgesellschaftskapitän' — German compounds can be infinitely long. Break them apart to understand.",
    "'Lieblings-' as a prefix means 'favorite': Lieblingsfilm, Lieblingsessen, Lieblingslied.",
    "Reading compounds: always split from the RIGHT. 'Krankenhaus' = Kranken + Haus (sick + house = hospital).",
  ],
  'node-29': [
    "Extended adjective constructions put whole clauses before a noun: 'der gestern angereiste Gast' (the guest who arrived yesterday).",
    "These replace relative clauses in formal/written German: instead of 'der Gast, der gestern angereist ist'.",
    "They read backwards in English: 'die in Deutschland lebenden Ausländer' = 'the foreigners living in Germany'.",
    "Past participles work too: 'das von meinem Vater gebaute Haus' = the house built by my father.",
    "These constructions are common in news, academic, and legal German. Learn to read them, even if you don't produce them.",
    "The pattern: article + [modifiers + participle] + noun. Everything between article and noun modifies the noun.",
  ],
  'node-30': [
    "Double infinitive occurs with modals in Perfekt: 'Ich habe kommen können' (I was able to come) — both verbs are infinitive.",
    "Lassen + infinitive: 'Ich habe mir die Haare schneiden lassen' (I had my hair cut) — lassen stays as infinitive.",
    "Perception verbs too: 'Ich habe ihn singen hören' (I heard him sing) — hören stays as infinitive in Perfekt.",
    "In subordinate clauses with double infinitive, 'haben' goes BEFORE the infinitives: '...weil ich habe kommen müssen.'",
    "'Lassen' is incredibly versatile: 'Lass mich!' (Leave me alone!), 'Lass uns gehen' (Let's go), 'Er lässt sich scheiden' (He's getting divorced).",
    "Verb chains: 'Er wird haben kommen müssen' (He will have had to come) — rare but grammatically possible.",
  ],
  'node-31': [
    "Formal German avoids contractions: 'in dem' not 'im', 'an dem' not 'am' in official documents.",
    "Passive is more common in formal writing: 'Es wird darauf hingewiesen, dass...' (It is pointed out that...)",
    "'Sehr geehrte Damen und Herren' (Dear Ladies and Gentlemen) opens formal letters. 'Liebe/Lieber...' is for people you know.",
    "German formal letters end with 'Mit freundlichen Grüßen' (With friendly regards). Email can be shorter: 'MfG'.",
    "'Hiermit' (hereby), 'bezüglich' (regarding), 'gemäß' (in accordance with) — formal register markers.",
    "The subjunctive is more common in formal German: 'Ich würde mich freuen' instead of 'Ich freue mich'.",
  ],
  'node-32': [
    "'Das ist mir Wurst' (That's sausage to me) = I don't care. Germans have many food-related idioms.",
    "'Ich verstehe nur Bahnhof' (I only understand train station) = I don't understand anything.",
    "'Daumen drücken' (press thumbs) = crossing fingers for luck. Germans squeeze thumbs, not cross fingers.",
    "'Schwein haben' (to have pig) = to be lucky. 'Schwein gehabt!' after a narrow escape.",
    "'Alles in Butter' (everything in butter) = everything's fine. Butter = quality/comfort in German idioms.",
    "'Die Daumen drücken' — when a German says 'Ich drücke dir die Daumen', they're wishing you luck.",
  ],
  'node-33': [
    "Konjunktiv II of strong verbs: add umlaut to preterite stem + -e endings: 'kam → käme', 'ging → ginge'.",
    "'Als ob' (as if) takes Konjunktiv II: 'Er tut, als ob er nichts wüsste.' (He acts as if he knew nothing.)",
    "'Hätte + infinitive + sollen/können' for past regret: 'Ich hätte das machen sollen.' (I should have done that.)",
    "Subjunctive makes polite requests: 'Könnten Sie mir helfen?' is softer than 'Können Sie mir helfen?'",
    "'Es wäre schön, wenn...' (It would be nice if...) — standard wishful thinking pattern.",
    "'Wenn ich nur mehr Zeit hätte!' — 'nur' in wishes adds emphasis: If only I had more time!",
  ],
  'node-34': [
    "'Im Rahmen von' (in the framework of), 'in Bezug auf' (with regard to) — essential academic phrases.",
    "'Zusammenfassend lässt sich sagen' (In summary, one can say) — standard academic conclusion opener.",
    "'Einerseits...andererseits' (on one hand...on the other hand) — for balanced academic arguments.",
    "German academic style prefers passive and impersonal constructions: 'Es wurde festgestellt, dass...'",
    "'Beziehungsweise' (bzw.) = respectively/or rather — ubiquitous in professional German. Master this word.",
    "'Dementsprechend' (accordingly), 'darüber hinaus' (moreover), 'nichtsdestotrotz' (nevertheless) — connector level-ups.",
  ],
  'node-35': [
    "Modal particles add nuance: 'doch' (contrary to expectation), 'mal' (softener), 'eben/halt' (that's just how it is).",
    "'Komm doch mal vorbei!' — 'doch' + 'mal' together soften an invitation. Without them it sounds like a command.",
    "'Das ist halt so' (That's just how it is) — 'halt' expresses resigned acceptance. Very colloquial, very German.",
    "'Eigentlich' (actually/really) often introduces a contradiction: 'Eigentlich wollte ich nicht, aber...'",
    "'Ja' as a particle (unstressed) expresses shared knowledge: 'Du weißt ja, dass...' (You know, as we both agree...)",
    "'Wohl' expresses probability: 'Er ist wohl krank' = He's probably sick. Subtle but important.",
    "'Schon' as a particle means 'indeed/admittedly': 'Das stimmt schon, aber...' (That's true, but...)",
    "'Ruhig' in commands = feel free to: 'Setz dich ruhig hin' = Feel free to sit down (don't be shy).",
  ],
};

// ── Bad tip patterns to replace ───────────────────────────────────
const BAD_PATTERNS = [
  /regular verbs.*pattern/i,
  /remove.*-en.*add.*endings/i,
  /^guten tag/i,
  /^hallo /i,
  /ending for du/i,
  /-st ending/i,
  /^the.*form is/i,
  /conjugat.*pattern/i,
  /verb.*ends? in/i,
  /add.*suffix/i,
  /^in german,? (the )?plural/i,
];

function isBadTip(tip) {
  return BAD_PATTERNS.some(p => p.test(tip));
}

// ── Process deck ──────────────────────────────────────────────────
// Track tip indices per node for cycling through tips
const nodeCounters = {};
const nodeCardIndices = {};

// First pass: index cards by node
for (let i = 0; i < deck.length; i++) {
  const node = deck[i].grammarNode;
  if (!node) continue;
  if (!nodeCardIndices[node]) nodeCardIndices[node] = [];
  nodeCardIndices[node].push(i);
}

// Second pass: replace bad tips and add new ones
let replaced = 0;
let added = 0;

for (const [node, tips] of Object.entries(NODE_TIPS)) {
  const cardIndices = nodeCardIndices[node] || [];
  if (cardIndices.length === 0) continue;

  let tipIdx = 0;
  const targetTipCount = Math.round(cardIndices.length * 0.28);
  let currentTipCount = cardIndices.filter(i => deck[i].grammar).length;

  // Replace bad tips
  for (const ci of cardIndices) {
    if (deck[ci].grammar && isBadTip(deck[ci].grammar)) {
      deck[ci].grammar = tips[tipIdx % tips.length];
      tipIdx++;
      replaced++;
    }
  }

  // Count tips after replacement
  currentTipCount = cardIndices.filter(i => deck[i].grammar).length;

  // Add new tips to cards without them
  if (currentTipCount < targetTipCount) {
    const needMore = targetTipCount - currentTipCount;
    const candidates = cardIndices.filter(i => !deck[i].grammar);
    // Spread tips evenly across the node
    const step = Math.max(1, Math.floor(candidates.length / needMore));
    let addedForNode = 0;
    for (let j = 0; j < candidates.length && addedForNode < needMore; j += step) {
      deck[candidates[j]].grammar = tips[tipIdx % tips.length];
      tipIdx++;
      addedForNode++;
      added++;
    }
  }
}

// Save
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));

// Verify
let totalTips = 0;
const perNode = {};
for (const c of deck) {
  if (c.grammar) totalTips++;
  const n = c.grammarNode || 'none';
  if (!perNode[n]) perNode[n] = { total: 0, tips: 0 };
  perNode[n].total++;
  if (c.grammar) perNode[n].tips++;
}

console.log(`Replaced: ${replaced} bad tips`);
console.log(`Added: ${added} new tips`);
console.log(`Total tips: ${totalTips}/${deck.length} (${(100*totalTips/deck.length).toFixed(1)}%)`);
console.log('\nPer node:');
for (const [n, d] of Object.entries(perNode).sort()) {
  console.log(`  ${n}: ${d.tips}/${d.total} (${(100*d.tips/d.total).toFixed(0)}%)`);
}
