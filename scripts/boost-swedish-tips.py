#!/usr/bin/env python3
"""Boost Swedish grammar tips to ~29% to match other languages."""
import json

with open("src/data/swedish/deck.json") as f:
    cards = json.load(f)

# High-quality contextual tips keyed by target sentence
tips = {
    # ── node-06: Numbers & time (18% → target 28%) ──
    "Vi har väntat i tjugo minuter.": '"I" + time period = "for": "i tjugo minuter" (for 20 minutes). Don\'t use "för" here.',
    "En, två, tre, fyra, fem.": "Swedish numbers 1-5: en/ett, två, tre, fyra, fem. \"En\" for en-words, \"ett\" for ett-words.",
    "Sex, sju, åtta, nio, tio.": '"Sju" (7) contains the tricky sj-sound [ɧ]. "Åtta" has double-t making the å short.',
    "Elva, tolv, tretton, fjorton, femton.": "13-19 add \"-ton\" (like English \"-teen\"): tretton, fjorton, femton, sexton...",
    "Sexton, sjutton, arton, nitton, tjugo.": '"Arton" is the modern form of 18 (not "aderton" which is formal/written).',
    "Trettio, fyrtio, femtio, sextio.": "Tens use \"-tio\" suffix: trettio (30), fyrtio (40). Note \"fyrtio\" not \"förtio\".",
    "Sjuttio, åttio, nittio, hundra.": '"Hundra" (100) is an ett-word: ett hundra, but you usually drop "ett" before it.',
    "En miljon invånare.": '"Miljon" is an en-word: en miljon, miljonen. "Invånare" = inhabitant — same singular and plural.',
    "Hur mycket kostar det?": '"Hur mycket" = how much (price). "Hur många" = how many (countable). Important distinction.',
    "Det är en kvart i fyra.": '"En kvart i" = quarter to. "En kvart över" = quarter past. Swedish time centers on the half hour.',
    "Vi ses imorgon kväll.": '"Imorgon" = tomorrow. "I morse" = this morning. "I övermorgon" = day after tomorrow.',
    "Jag är född den tredje maj.": 'Dates use ordinal + month: "den tredje maj." No preposition needed before the date.',
    "Vi firar midsommar i juni.": '"Midsommar" falls on the Friday between June 19-25. Sweden\'s most beloved summer holiday.',
    "Programmet börjar om en halvtimme.": '"Om" + time = in (future): "om en halvtimme" = in half an hour.',
    "Det tar ungefär en timme.": '"Ungefär" = approximately. "Ta" for duration: "det tar" = it takes.',

    # ── node-10: Object pronouns (18% → target 28%) ──
    "Hon tittade på oss.": '"Titta på" = look at. Object pronouns after prepositions: på mig, på dig, på oss, på dem.',
    "Han bad henne om hjälp.": '"Be om" = ask for. "Bad" is past of "be." Indirect object (henne) before "om."',
    "Vi förstår er.": '"Er" is both "you" (object, plural) and "your." In speech, "er" as object is being replaced by "dig" (singular).',
    "Hon berättade det för oss.": '"Berätta för" = tell (to someone). "Det" (it) as object goes before "för oss."',
    "Kan ni se mig?": '"Ni" = you (plural subject). "Er" = you (plural object). "Mig" is often pronounced "mej."',
    "Jag träffade henne på festen.": '"Träffa" = meet. Object pronouns go right after the verb: "träffade henne."',
    "Han skickade oss ett paket.": 'Indirect object (oss) before direct object (ett paket): "skickade oss ett paket."',
    "De bjöd mig på middag.": '"Bjuda på" = treat to / invite for. "Bjöd" is past of "bjuda" (strong verb).',
    "Jag hörde honom sjunga.": 'After perception verbs (hörde, såg), use bare infinitive: "hörde honom sjunga" (heard him sing).',
    "Hon gav oss en chans.": '"Ge" → "gav" (past). Double object: indirect (oss) + direct (en chans).',

    # ── node-11: Modal verbs (16% → target 28%) ──
    "Vi ska träffas klockan fem.": '"Ska" for plans/arrangements: "Vi ska träffas" = we\'re meeting (arranged).',
    "Man måste ha biljett.": '"Man" = one/you (impersonal). "Måste" is invariable — no past tense form; use "var tvungen att" for past.',
    "Jag får inte äta gluten.": '"Får inte" = not allowed to. "Får" also means "get/receive" — context determines meaning.',
    "Du borde vila dig.": '"Borde" = should (present advice, though technically past of "böra"). "Vila sig" = rest (reflexive).',
    "Vi behöver inte stressa.": '"Behöver inte" = don\'t need to. Much milder than "måste inte" (must not). Important distinction.',
    "Han vill flytta till Spanien.": '"Vill" = want to. No "att" after modals: "vill flytta" not "vill att flytta."',
    "Jag kan hjälpa dig imorgon.": '"Kan" = can/know how to. No "att" needed: "kan hjälpa" = can help.',
    "Vi ska fira med tårta.": '"Ska" for intentions: "ska fira" = going to celebrate. "Tårta" = cake (layer cake specifically).',
    "Hon måste jobba övertid.": '"Övertid" = overtime. "Jobba" is informal for "arbeta" — both mean work.',
    "Du kan väl hjälpa mig?": '"Väl" is a modal particle softening the request — makes it sound like you expect agreement.',
    "Jag vill gärna ha en till.": '"Gärna" = gladly/willingly. "En till" = one more. "Vill gärna" = would like (polite).',
    "Vi borde gå hem nu.": '"Borde" for mild obligation: we should/ought to. Weaker than "måste" (must).',

    # ── node-17: Directions & transport (16% → target 28%) ──
    "En tur och retur till Malmö.": '"Tur och retur" = round trip. "Enkel" = one-way. Essential train/bus vocabulary.',
    "Var kan jag köpa biljett?": '"Biljett" = ticket. Most transport tickets in Sweden are digital — "SL-appen" in Stockholm.',
    "Bussen stannar vid torget.": '"Torget" = the square/marketplace. "Vid" = at/by (for locations near something).',
    "Nästa hållplats är Slussen.": '"Hållplats" = stop (bus/tram). "Station" for train/subway. "Slussen" is a major Stockholm hub.',
    "Jag vill åka till flygplatsen.": '"Åka" = go/travel (by vehicle). "Gå" = go (on foot). "Flyga" = fly. Use the right verb!',
    "Arlanda Express tar tjugo minuter.": '"Arlanda" is Stockholm\'s main airport. "Express" trains connect airports to city centers in Sweden.',
    "Vi åker spårvagn i Göteborg.": '"Spårvagn" = tram. Gothenburg is famous for its tram network — Stockholm doesn\'t have trams.',
    "Var ligger närmaste busshållplats?": '"Närmaste" = nearest (superlative of "nära"). "Ligga" for location of places.',
    "Tåget är försenat med tio minuter.": '"Försenad" = delayed. "Med" + time = by (amount): delayed by ten minutes.',
    "Gå rakt fram och sväng vänster.": '"Rakt fram" = straight ahead. "Sväng" is imperative of "svänga" = turn.',
    "Det finns en genväg genom parken.": '"Genväg" = shortcut. Compound: "gen" (direct) + "väg" (way).',
    "Vi tar pendeltåget till Södertälje.": '"Pendeltåg" = commuter train. "Pendla" = commute. Very common in Swedish cities.',

    # ── node-20: Definite forms (18% → target 28%) ──
    "De nya böckerna är bra.": '"Bok" → "böcker" (irregular plural) → "böckerna" (def. plural). "Nya" — all adjectives end -a in definite.',
    "Det gamla slottet är vackert.": 'Double definite: det + gamla + slottet. Three markers of definiteness simultaneously!',
    "Den svarta katten sitter i fönstret.": 'Double definite with en-word: den + svarta + katten. Adjective always ends in -a in definite.',
    "Det vita huset är till salu.": '"Till salu" = for sale. "Vit" → "vita" in definite: den vita, det vita, de vita.',
    "De vackra blommorna doftar gott.": '"Dofta" = smell (emit scent). "Gott" (neuter) here because it\'s an adverb, not adjective.',
    "Den fina restaurangen är fullbokad.": '"Fullbokad" = fully booked. Compound: full + bokad. Very common in Swedish.',
    "Det kalla vattnet är uppfriskande.": '"Vatten" is ett-word: vattnet (def.). Double definite: det + kalla + vattnet.',
    "De svenska somrarna är korta.": '"Kort" → "korta" in plural/definite. "Svensk" → "svenska" — same pattern for all adjectives.',
    "Den gröna dörren till vänster.": 'Directions with definite: "den gröna dörren" — the specific green door, not any green door.',
    "Det ljusa rummet på övervåningen.": '"Ljus" = bright/light. "Övervåningen" = the upper floor. "Våning" = floor/story.',
    "De stora fönstren i vardagsrummet.": '"Fönster" → "fönstren" (def. plural of ett-word). "Vardagsrum" = living room (compound).',
    "Den lilla katten är söt.": '"Liten" has special forms: liten/litet/lilla (def.)/små (plural). "Lilla" in all definite forms.',

    # ── node-21: Relative clauses (18% → target 28%) ──
    "Barnet som leker i parken är glatt.": '"Som" never changes form — same for subjects, objects, en/ett/plural. Universal relative pronoun.',
    "Vägen som leder till sjön är lång.": '"Leda" = lead. "Sjön" = the lake (en sjö). In relative clauses, verb order stays normal.',
    "Staden som vi besökte var vacker.": '"Som" as object — in formal Swedish you can use "vilken/vilket/vilka" instead, but "som" is standard.',
    "Musiken som spelas är fin.": '"Som spelas" = that is being played. S-passive in relative clause — very natural in Swedish.',
    "Kaffet som serveras här är gott.": '"Serveras" = is served (s-passive). "Gott" = good/tasty (neuter, matching "kaffet").',
    "Kvinnan som jobbar på banken är trevlig.": 'After "som" as subject, the verb agrees with the antecedent: "kvinnan som jobbar" (she works).',
    "Blomman som växer där är sällsynt.": '"Sällsynt" = rare. "Växa" = grow (intransitive). Group 2: växer, växte, växt.',
    "Hunden som springer i parken tillhör oss.": '"Tillhöra" = belong to. Formal. Everyday: "är vår" (is ours).',
    "Boken som jag läser är spännande.": 'When "som" is object, subject goes between "som" and verb: "som jag läser."',
    "Landet som vi reser till heter Norge.": '"Som" + preposition at end: "som vi reser till" (that we travel to). Preposition stays at end.',

    # ── node-22: Passive voice (16% → target 28%) ──
    "Nyheten rapporterades i tidningen.": '"Rapporteras" (present), "rapporterades" (past). S-passive is very common in Swedish news.',
    "Lagen antogs av riksdagen.": '"Riksdagen" = the Swedish parliament. "Antog" → "antogs" — just add -s for s-passive past.',
    "Tåget blev försenat.": '"Bli-passive" + past participle emphasizes the event/change: "blev försenat" = got delayed.',
    "Boken har översatts till tjugo språk.": '"Har översatts" = has been translated. Perfect s-passive: har + supine + s.',
    "Huset ska säljas.": '"Ska säljas" = will be sold. Modal + infinitive s-passive. Very common in real estate.',
    "Gatan repareras just nu.": '"Just nu" = right now. S-passive for ongoing actions: "repareras" = is being repaired.',
    "Filmen visades på bio.": '"Visas" (present) → "visades" (past). "På bio" = at the cinema (no article needed).',
    "Kläderna tvättades igår.": '"Tvätta" → "tvättades" (past s-passive). Group 1 verbs: -ades ending in past passive.',
    "Arbetet måste göras.": '"Måste göras" = must be done. Modal + s-passive infinitive is very productive.',
    "Beslut har fattats av styrelsen.": '"Fatta beslut" = make a decision. "Styrelsen" = the board. Formal/business passive.',
    "Vägen stängdes på grund av olyckan.": '"På grund av" = because of. "Stängdes" = was closed (s-passive past).',
    "Dörren kan inte öppnas utifrån.": '"Utifrån" = from outside. S-passive with modal: "kan inte öppnas."',

    # ── node-24: Future & conditional (16% → target 28%) ──
    "Jag ska ringa henne senare.": '"Ska" for definite plans/intentions. More personal than "kommer att" which is prediction.',
    "Vi kommer att behöva hjälp.": '"Kommer att" for predictions/expectations. "Ska" would imply you\'ve already arranged help.',
    "Om jag vann på lotto skulle jag resa.": 'Swedish conditional: "om" + past tense, "skulle" + infinitive. Same pattern as English.',
    "De ska flytta till Malmö.": '"Ska" for future plans someone has decided on. "Malmö" is Sweden\'s third-largest city.',
    "Det kommer att bli bättre.": '"Kommer att bli" = will become/get. "Bli" is the go-to verb for changes of state.',
    "Vi ska ha fest i helgen.": '"I helgen" = this weekend. "Ha fest" = have a party — no article before "fest."',
    "Det kommer att vara fullt.": '"Kommer att vara" = will be (state). Use "bli" for change, "vara" for ongoing state.',
    "Hon skulle vilja resa mer.": '"Skulle vilja" = would like to. The polite way to express wishes.',
    "Om det regnar stannar vi hemma.": 'Real condition: "om" + present tense → present tense. Not hypothetical, just possible.',
    "Vi skulle kunna gå på bio.": '"Skulle kunna" = could (suggestion). Stacking modals: would + can + infinitive.',
    "Jag tänker söka jobbet.": '"Tänker" + infinitive = intend to / am going to. More informal future than "ska."',
    "Om hon hade tid skulle hon komma.": 'Hypothetical: "om" + past tense, "skulle" + infinitive. "Hade" makes it unreal.',

    # ── node-26: Participle constructions (12% → target 28%) ──
    "Det målade huset.": 'Past participle as adjective: "målad" (painted). "Målat" for ett-words: "det målade huset."',
    "Den kokta potatisen.": '"Kokt" = boiled/cooked. Past participle agrees: kokt (ett), kokta (plural/definite).',
    "Ett fryst paket.": '"Fryst" = frozen (from "frysa"). Indefinite ett-word: "ett fryst paket" (no change needed).',
    "De älskade barnen.": '"Älskade" can mean both "beloved" (participle adjective) and "loved" (past tense). Context decides.',
    "En respekterad ledare.": 'Past participle with en-word (indefinite): "respekterad." No ending change needed.',
    "Det förlorade passet.": '"Förlorad" = lost (from "förlora"). "Pass" is ett-word: passet. "Förlorade" in definite.',
    "De glömda minnena.": '"Glömd" = forgotten. Plural definite: "glömda." "Minne" is ett-word, plural: "minnen."',
    "En överraskande nyhet.": '"Överraskande" (surprising) — present participle (-ande/-ende) never inflects. Same for all forms.',
    "Den leende flickan.": '"Leende" = smiling (present participle of "le"). -ende because "le" is Group 4.',
    "En väl bevarad hemlighet.": '"Bevarad" = preserved/well-kept. "Väl" = well (adverb). Compound participle phrase.',
    "Det nybyggda huset.": '"Nybyggd" = newly built. Compound: ny + byggd. "Nybyggt" for ett-words: "det nybyggda huset."',
    "De nyanställda kollegorna.": '"Nyanställd" = newly employed. Swedish loves compounding prefix + participle.',
    "En fascinerande historia.": '"Fascinerande" = fascinating. Present participle from "fascinera" — same form always.',
    "Det befriande känslan av semester.": 'Participles from reflexive verbs drop "sig": "befria sig" → "befriande."',
    "En levande legend.": '"Levande" = living (present participle). "Leva" → "levande" — a very common form.',
    "Den parkerade bilen blockerade vägen.": '"Parkerad" agrees with noun: parkerad (en), parkerat (ett), parkerade (def/plural).',
    "Det serverade kaffet var kallt.": 'Past participle in double definite: det + serverade + kaffet.',

    # ── node-32: Literary Swedish (15% → target 28%) ──
    "Aldrig hade känslan av ensamhet känts så starkt.": 'Fronted "aldrig" + inverted word order = literary emphasis. "Kännas" = feel (s-verb).',
    "I fjärran hördes ljudet av bjällror.": '"I fjärran" = in the distance (literary). "Hördes" = was heard (s-passive).',
    "Han bar med sig en hemlighet som tyngde.": '"Bära med sig" = carry with oneself. "Tynga" = weigh down — metaphorical usage.',
    "Ljuset sipprade in genom de smutsiga fönstren.": '"Sippra" = seep/trickle. Literary verbs paint vivid pictures of slow movement.',
    "Deras blickar möttes över det dukade bordet.": '"Mötas" = meet (reciprocal s-verb). "Dukat bord" = set table. Romantic imagery.',
    "Minnet av sommarens dagar värmde hennes hjärta.": '"Sommarens" = summer\'s (genitive -s). Possessive -s works like English apostrophe-s.',
    "Klockorna i kyrktornent slog tolv.": '"Slå" → "slog" (struck). "Kyrktorn" = church tower. Literary time-marking device.',
    "Snön gnisslade under hans stövlar.": '"Gnissla" = crunch/squeak. Onomatopoeia — Swedish has many such expressive verbs.',
    "Löven dansade i den kyliga höstvinden.": '"Löv" (leaf, ett-word) — definite form "löven." Personification common in literary Swedish.',
    "Det var som om tiden hade stannat.": '"Som om" + past perfect for unreal comparisons — a literary construction.',
    "Natten var mörk och full av ljud.": 'Simple but evocative. "Mörk" and "full av" — literary Swedish often uses pairs.',
    "Fåglarna tystnade en efter en.": '"Tystna" = fall silent. "En efter en" = one by one. Inchoative verb (-na suffix).',
    "Regnet trummade mot takfönstret.": '"Trumma" = drum. Sound imagery. "Takfönster" = skylight (tak + fönster compound).',

    # ── node-33: Academic discourse (14% → target 28%) ──
    "Resultaten presenteras i tabell tre.": '"Presenteras" — s-passive is dominant in Swedish academic writing. Impersonal style.',
    "Diskussionen kretsar kring tre huvudteman.": '"Kretsa kring" = revolve around. "Huvudtema" = main theme (compound).',
    "Det teoretiska ramverket baseras på.": '"Baseras på" = is based on (s-passive). "Ramverk" = framework.',
    "Materialet har bearbetats kvalitativt.": '"Bearbeta" = process/analyze. Past s-passive: "har bearbetats."',
    "Respondenternas svar kodades tematiskt.": '"Respondenternas" = the respondents\' (double genitive). "-erna" (def.) + "-s" (genitive).',
    "Reliabiliteten bedöms som hög.": '"Bedöma" = assess/judge. "Bedöms som" = is assessed as — standard academic phrasing.',
    "Det finns en signifikant skillnad.": '"Signifikant" = significant (statistical term). Same word as English, Swedish pronunciation.',
    "Korrelationen mellan variablerna är stark.": '"Variablerna" = the variables (def. plural). Latin-origin words common in academic Swedish.',
    "Sammantaget visar studien att.": '"Sammantaget" = taken together / overall. Formal summarizing word.',
    "Hypotesen bekräftades delvis.": '"Delvis" = partly/partially. "Bekräftades" = was confirmed (s-passive past).',
    "Tidigare forskning har visat att.": '"Tidigare forskning" = previous research. Standard literature review opening.',
    "Det krävs ytterligare studier.": '"Krävas" = be required. "Ytterligare" = further/additional — more formal than "mer."',
    "Slutsatsen grundar sig på empirin.": '"Grunda sig på" = be based on. "Empiri" = empirical data.',
    "Den statistiska analysen genomfördes med SPSS.": '"Genomföra" = carry out/conduct. Past s-passive: "genomfördes."',

    # ── node-08: Common expressions (21% → target 28%) ──
    "Det spelar ingen roll.": '"Spela roll" = matter. "Ingen" negates the noun: "ingen roll" = no role/it doesn\'t matter.',
    "Jag har ingen aning.": '"Aning" = idea/clue. "Ingen aning" = no idea. Very common casual expression.',
    "Det var länge sedan.": '"Länge sedan" = long ago. "Det var länge sedan vi sågs" = it\'s been a long time.',
    "Ta det lugnt.": '"Ta det lugnt" = take it easy/calm down. "Lugnt" (neuter) because of impersonal "det."',
    "Vi får se.": '"Får se" = we\'ll see. "Få" as auxiliary for future possibility. Very common response.',
    "Lycka till!": '"Lycka till" = good luck! "Lycka" = luck/happiness. "Till" adds direction/purpose.',
    "Skål!": '"Skål" = cheers! Originally meant "bowl" (drinking vessel). Look people in the eye when saying it.',

    # ── node-09: Preteritum (26% → target 28%) ──
    "Vi reste till Frankrike förra sommaren.": '"Förra" = last (previous). "Förra sommaren" = last summer. "Resa" → "reste" (Group 2).',
    "Hon berättade en lång historia.": '"Berätta" → "berättade" (Group 1). "-ade" ending is the most common past tense.',

    # ── node-13: Negation (19% → target 28%) ──
    "Jag har inte sett den filmen.": '"Inte" after auxiliary "har" in main clauses: "har inte sett." In subclauses: "att jag inte har sett."',
    "Vi träffade ingen vi kände.": '"Ingen" = no one/nobody. Also works as determiner: "ingen tid" = no time.',
    "Det finns inget att oroa sig för.": '"Inget" = nothing (ett-form). "Oroa sig för" = worry about.',
    "Jag dricker varken kaffe eller te.": '"Varken...eller" = neither...nor. A correlative conjunction pair.',
    "Hon har aldrig varit i Japan.": '"Aldrig" (never) goes after auxiliary "har" in main clauses. In subclauses: before the verb.',
    "Ingenting förvånar mig längre.": '"Ingenting" = nothing (emphatic). "Inte...något" is the milder form.',
    "Ingen av oss visste svaret.": '"Ingen av" = none of. "Svaret" = the answer (ett svar, def: svaret).',
    "Vi har inte råd med det.": '"Ha råd med" = afford. "Inte" between auxiliary and main verb.',

    # ── node-16: Perfekt (21% → target 28%) ──
    "Har du ätit frukost?": '"Äta" → "ätit" (supinum). Swedish supinum is unique — different from past participle.',
    "Vi har bott här i fem år.": '"Bo" → "bott" (supinum of Group 3). Duration with "i": "i fem år" = for five years.',
    "Hon har skrivit tre böcker.": '"Skriva" → "skrivit" (supinum). Strong verb: infinitive -a → supinum -it.',
    "Jag har aldrig sett norrsken.": '"Norrsken" = northern lights (aurora borealis). "Aldrig" goes after "har."',
    "De har redan gått.": '"Redan" = already. Goes after auxiliary: "har redan gått." "Gå" → "gått" (supinum).',
    "Han har jobbat hela dagen.": '"Hela dagen" = all day. "Jobba" → "jobbat" (Group 1 supinum: -at ending).',
    "Vi har precis kommit hem.": '"Precis" = just (very recently). "Komma" → "kommit" (supinum). Very frequent combination.',

    # ── node-15: Adjective agreement (27% → target 28%) ──
    "Hon är snällare än sin bror.": '"Snäll" → "snällare" (comparative). "Sin" = his/her own (reflexive possessive).',

    # ── node-18: Subordinate clauses (20% → target 28%) ──
    "Jag stannade hemma eftersom jag var sjuk.": '"Eftersom" = because/since. Subordinate clause — "inte" would go BEFORE "var" here.',
    "Vi ska äta när hon kommer.": '"När" = when. Future events use present tense in Swedish: "när hon kommer" (when she comes).',
    "Fastän det regnade gick vi ut.": '"Fastän" = although. Subordinate clause first → main clause inverts: "gick vi."',
    "Medan vi väntade läste jag en bok.": '"Medan" = while. Two simultaneous actions. Main clause inverts after fronted subclause.',
    "Om du vill kan vi gå på bio.": '"Om" = if. Conditional — "kan vi" inverts in main clause after fronted "om"-clause.',
    "Jag visste inte att han var sjuk.": '"Att" clause after "visste inte" — "inte" goes before verb in subclause: "att han INTE var."',
    "Vi fick veta att tåget var inställt.": '"Få veta" = find out. "Inställd" = cancelled — past participle of "ställa in."',
    "Trots att det var sent stannade vi.": '"Trots att" = despite/although. Subclause first → main clause inverts.',

    # ── node-19: Imperative (19% → target 28%) ──
    "Sluta gnälla!": '"Gnälla" = whine/complain. Imperative of Group 1: "Sluta!" "Gnälla" stays as infinitive after "sluta."',
    "Ring polisen!": '"Ringa" imperative drops -a and becomes "ring." Stem-only for Group 2 verbs.',
    "Stäng av telefonen.": '"Stänga av" = turn off. Particle verbs in imperative: "Stäng av!" The particle follows.',
    "Var försiktig!": '"Vara" imperative = "var." Irregular. "Försiktig" = careful.',
    "Slå dig ner.": '"Slå sig ner" = sit down (informal). Reflexive imperative: "dig" for "du"-form.',
    "Låt oss gå!": '"Låt oss" = let us / let\'s. Swedish equivalent of "let\'s" — very common.',
    "Ta med dig paraply!": '"Ta med sig" = bring along. Imperative: "ta med dig" (you-form).',
    "Glöm inte nycklarna!": '"Glömma" → imperative "glöm." "Inte" follows the verb in imperative.',
    "Skynda dig, vi är sena!": '"Skynda sig" = hurry. "Skynda dig!" = hurry up! "Sen" = late.',

    # ── node-25: Advanced connectors (23% → target 28%) ──
    "Förutsatt att vädret blir bra åker vi.": '"Förutsatt att" = provided that. Formal connector triggering subordinate word order.',
    "Såvida det inte regnar går vi ut.": '"Såvida...inte" = unless. "Inte" goes before verb in this subclause.',
    "Å ena sidan är det dyrt, å andra sidan är det bra.": '"Å ena sidan...å andra sidan" = on one hand...on the other hand.',
    "Dessutom har vi inte tillräckligt med tid.": '"Dessutom" = moreover/besides. "Tillräckligt med" = enough of.',
    "Inte desto mindre var han nöjd.": '"Inte desto mindre" = nevertheless. Formal. Everyday: "ändå" or "trots det."',

    # ── node-14: Prepositions (30% → target maintained) ──
    # node-14 is already at 30%, skip

    # ── node-27: Reported speech (20% → target 28%) ──
    "Han undrade var vi bodde.": 'Indirect question: "undrade var" = wondered where. Normal word order in the subclause.',
    "De berättade att de hade haft kul.": '"Ha kul" = have fun. Past perfect in reported speech: "hade haft."',
    "Hon frågade om vi ville följa med.": '"Fråga om" = ask whether. "Följa med" = come along — a particle verb.',
    "Han nämnde att han skulle resa.": '"Nämna" = mention. "Skulle" in reported speech = was going to.',
    "De meddelade att de hade bestämt sig.": '"Meddela" = inform/announce. "Bestämma sig" = decide (reflexive).',
    "Vädret rapporterades bli varmare.": 'Infinitive construction in reported speech: "rapporterades bli" = was reported to become.',
    "Enligt hans uppgifter stämmer allt.": '"Enligt" = according to. "Uppgifter" = information/data. No subclause needed.',

    # ── node-31: Advanced word order (21% → target 28%) ──
    "Det var igår som jag träffade henne.": 'Cleft sentence for emphasis: "Det var igår som..." = It was yesterday that...',
    "Ännu har vi inte fått svar.": '"Ännu" (yet/still) fronted triggers inversion: "har vi." Emphatic word order.',
    "Bara i Sverige kan man se sådant.": '"Bara" (only) fronted → inversion. "Sådant" = such things (neuter).',
    "Under inga omständigheter får du göra det.": '"Under inga omständigheter" = under no circumstances. Strong fronted negation.',
    "Så sa han, och alla skrattade.": '"Så" (so/thus) starting a clause triggers V2: "Så sa han."',
    "Hade jag vetat det hade jag stannat.": 'Conditional without "om": inverted "hade jag" replaces "om jag hade." Literary/formal.',
    "Dit vi ska finns det ingen väg.": '"Dit" (to where) as relative — archaic/literary. Fronted relative clause.',

    # ── node-23: S-verbs (21% → target 28%) ──
    "Vi trivs bra här.": '"Trivas" = thrive/enjoy being. Deponent: always -s but active meaning. "Trivs" = present.',
    "De enades om en lösning.": '"Enas" = agree/come to agreement. Reciprocal s-verb.',
    "Jag minns det tydligt.": '"Minnas" = remember. Deponent verb. "Tydligt" = clearly.',
    "Vi umgås ofta med grannarna.": '"Umgås" = socialize/hang out. Deponent — reciprocal by nature.',
    "De bråkas hela tiden.": '"Bråkas" = quarrel/fight. Reciprocal s-verb for mutual action.',
    "Man vänjs vid det.": '"Vänjas vid" = get used to. S-verb for gradual change.',
    "Vi syns imorgon!": '"Synas" = be seen / see each other. "Vi syns!" = see you! Very common farewell.',

    # ── node-35: Advanced mixed (25% → target 28%) ──
    "Det lär vara dyrt.": '"Lär" = is supposed to / apparently is. A modal for hearsay/assumption.',
    "Hur det än är så måste vi.": '"Hur...än" = however. Concessive: "however it may be."',
    "Det vill till att man är beredd.": '"Det vill till att" = it\'s important that / one needs to. Fixed expression.',
}

applied = 0
for card in cards:
    if "grammar" not in card and card["target"] in tips:
        card["grammar"] = tips[card["target"]]
        applied += 1

with open("src/data/swedish/deck.json", "w") as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)

total_tips = sum(1 for c in cards if "grammar" in c)
print(f"Applied {applied} additional grammar tips")
print(f"Total cards: {len(cards)}")
print(f"Cards with grammar tips: {total_tips} ({100*total_tips/len(cards):.1f}%)")

# Per-node breakdown
from collections import Counter
node_total = Counter()
node_tips_count = Counter()
for c in cards:
    node_total[c['grammarNode']] += 1
    if 'grammar' in c:
        node_tips_count[c['grammarNode']] += 1
for n in sorted(node_total.keys()):
    total = node_total[n]
    t = node_tips_count[n]
    pct = 100*t/total if total else 0
    flag = " ← LOW" if pct < 25 else ""
    print(f"  {n}: {t}/{total} ({pct:.0f}%){flag}")
