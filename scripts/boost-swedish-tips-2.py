#!/usr/bin/env python3
"""Second round: boost weak nodes to 25%+ each using exact card targets."""
import json

with open("src/data/swedish/deck.json") as f:
    cards = json.load(f)

tips = {
    # ── node-05: Word order V2 (22% → target 28%) ──
    "Ofta dricker jag kaffe.": '"Ofta" in first position forces inversion: "dricker jag" not "jag dricker." V2 rule.',
    "Kanske kommer han imorgon.": '"Kanske" can trigger V2: "kanske kommer han." But "han kanske kommer" is also fine.',
    "Där borta ligger affären.": '"Där borta" = over there. Place adverb first → verb second → subject third.',
    "I helgen ska vi åka till stugan.": '"Stugan" = the cottage. Many Swedes have a "stuga" for weekends and holidays.',
    "Idag ska vi handla mat.": '"Handla" = shop (for food). "Handla mat" is more common than "köpa mat."',
    "Igår kväll tittade vi på film.": 'Time + time: "igår kväll" counts as one unit in first position. Verb stays 2nd.',
    "Förra veckan var det soligt.": '"Förra" = last (past). "Förra veckan" = last week. Triggers V2 inversion.',
    "Nu vill jag sova.": '"Nu" (now) in first position → inversion: "vill jag" instead of "jag vill."',
    "Sedan dess har det förändrats.": '"Sedan dess" = since then. Fronted time expression triggers V2.',
    "Troligen kommer det att regna.": '"Troligen" = probably. Sentence adverbs also trigger V2 when fronted.',

    # ── node-08: Common expressions (22% → target 28%) ──
    "Vad synd!": '"Vad + adjective/noun" = what a...! "Vad synd!" = what a pity! Very common exclamation.',
    "Vad bra!": '"Vad bra!" = how great! Swedish uses "vad" (what) for exclamations, not "hur" (how).',
    "Jag vet inte.": '"Veta" is irregular: vet (present), visste (past), vetat (supinum). "Vet inte" = don\'t know.',
    "Självklart!": '"Självklart" = of course! Compound: "själv" (self) + "klart" (clear). Very common.',
    "Ursäkta mig.": '"Ursäkta" = excuse me / sorry. Works for both getting attention and apologizing.',
    "Det gör ingenting.": '"Det gör ingenting" = it doesn\'t matter / no worries. Equivalent of "that\'s fine."',
    "Hurdan var filmen?": '"Hurdan" = what kind of / how was it. More about quality than "hur" which is about manner.',
    "Låt mig tänka.": '"Låt mig" = let me. "Tänka" = think. Common way to buy time in conversation.',
    "Det beror på.": '"Bero på" = depend on. "Det beror på" = it depends. Very common response.',
    "Ingen fara!": '"Ingen fara" = no worries / no problem. "Fara" means danger here.',

    # ── node-12: Daily routine & reflexives (20% → target 28%) ──
    "Hon duschar i tio minuter.": '"Duscha" = shower. Not reflexive in Swedish (unlike "tvätta sig" = wash oneself).',
    "Vi äter frukost klockan halv åtta.": '"Halv åtta" = 7:30 (half TO eight). "Frukost" = breakfast.',
    "Han borstar tänderna efter frukost.": '"Borsta tänderna" = brush teeth. No reflexive pronoun needed (unlike German/French).',
    "Hon sminkar sig varje dag.": '"Sminka sig" = put on makeup. Reflexive – she applies it to herself.',
    "Jag brukar jogga på morgonen.": '"Brukar" = usually do / tend to. A uniquely Swedish auxiliary for habitual actions.',
    "Vi lägger barnen klockan åtta.": '"Lägga" someone = put to bed. "Barnen" = the children (barn, plural unchanged).',
    "Han ställer klockan på sex.": '"Ställa klockan" = set the alarm. "Ställa" = place upright.',
    "Jag vaknar alltid tidigt.": '"Vakna" = wake up (intransitive). "Väcka" = wake someone else (transitive).',
    "Vi äter middag klockan sex.": '"Middag" = dinner (midday meal). Swedish eats earlier than many countries.',
    "Hon torkar sig med en handduk.": '"Torka sig" = dry oneself. Reflexive. "Handduk" = towel (hand+cloth).',

    # ── node-13: Negation (20% → target 28%) ──
    "Det regnar inte längre.": '"Inte längre" = no longer / not anymore. "Längre" = longer/anymore.',
    "Jag kan inte simma.": '"Kan inte" = can\'t. Negation always after the modal verb in main clauses.',
    "Vi ska inte stanna länge.": '"Ska inte" = won\'t / aren\'t going to. "Länge" = for a long time.',
    "Hon behöver inte komma.": '"Behöver inte" = doesn\'t need to. Milder than "ska inte" (won\'t).',
    "De vet inte vad de ska göra.": '"Vet inte" in main clause; in the "vad"-clause, normal order: "vad de ska göra."',
    "Jag tycker inte om det.": '"Tycker inte om" = don\'t like. "Inte" splits "tycker" and "om" (particle).',
    "Vi har ingenting att äta.": '"Ingenting" = nothing. "Att äta" = to eat. Infinitive with "att" after "ingenting."',
    "Ingen stannade kvar.": '"Ingen" as subject = nobody. "Stanna kvar" = stay behind / remain.',
    "Det är inte så farligt.": '"Inte så" = not that (degree). "Farligt" = dangerous. Common reassurance.',

    # ── node-16: Perfekt (21% → target 28%) ──
    "Vi har aldrig besökt Kiruna.": '"Kiruna" is Sweden\'s northernmost city – famous for the ice hotel and iron ore mine.',
    "Jag har läst den boken.": '"Läsa" → "läst" (supinum). "Den boken" = that book (demonstrative use of "den").',
    "De har kommit hem.": '"Komma" → "kommit" (supinum). Swedish uses "har" for all verbs in perfekt (unlike German).',
    "Jag har gett honom pengarna.": '"Ge" → "gett" (supinum). Short verb, short supinum. "Pengarna" = the money.',
    "Vi har känt varandra länge.": '"Känna" → "känt." "Varandra" = each other. "Länge" = for a long time.',
    "Hon har drömt om det länge.": '"Drömma" → "drömt." "Om" = about. Swedish supinum is always -t or -it ending.',
    "De har bestämt sig för att flytta.": '"Bestämma sig för" = decide (on). "Att flytta" = to move. Perfekt + infinitive.',
    "Har du provat surströmming?": '"Surströmming" = fermented herring. Iconic Swedish delicacy with a very strong smell.',
    "Vi har haft en bra dag.": '"Ha" → "haft" (supinum). "Bra" = good (invariable – no agreement needed).',
    "Jag har glömt lösenordet.": '"Lösenord" = password (lösen + ord). An ett-word: lösenordet.',

    # ── node-17: Directions (25% → target 28%) ──
    "Finns det en parkeringsplats här?": '"Parkeringsplats" = parking spot. Swedish compound: parkering + s + plats.',
    "Vi behöver tanka bilen.": '"Tanka" = refuel. From "tank." Swedish cars increasingly switch to "ladda" (charge).',
    "Hastigheten är begränsad till åttio.": '"Begränsad till" = limited to. Swedish speed limits: 30-50 urban, 70-120 highways.',
    "Kör försiktigt, det är halt.": '"Halt" = slippery (ice). "Kör försiktigt" = drive carefully (imperative).',

    # ── node-18: Subordinate clauses (20% → target 28%) ──
    "Jag frågar om hon vill följa med.": '"Fråga om" = ask whether. "Följa med" = come along – very common particle verb.',
    "Jag ringer dig när jag kommer.": '"När" + present tense for future events in Swedish: "when I come" not "when I will come."',
    "Vi äter när maten är klar.": '"Klar" = ready/done. Subordinate clause keeps normal word order after "när."',
    "Sedan hon flyttade hit har hon trivts.": '"Sedan" = since. "Trivts" = enjoyed being here (deponent verb "trivas").',
    "Innan du går, stäng fönstret.": '"Innan" = before. "Stäng" is imperative of "stänga." Subclause + imperative main.',
    "Så fort vi kan åker vi.": '"Så fort" = as soon as. Triggers V2 in main clause when fronted.',
    "Medan barnen sover kan vi prata.": '"Medan" = while. "Sover" is in subclause (normal order). Main inverts.',
    "Även om det är svårt ger vi inte upp.": '"Även om" = even if/though. "Ge upp" = give up (particle verb).',

    # ── node-19: Imperative (19% → target 28%) ──
    "Vänta lite!": '"Lite" softens the command: "vänta lite" = wait a moment (not as urgent as just "vänta!").',
    "Sitt ner!": '"Sitta" → imperative "sitt." Irregular strong verb. "Ner" = down.',
    "Stå upp!": '"Stå" → imperative "stå." "Upp" = up. "Stå upp" = stand up / get up.',
    "Stäng fönstret!": '"Stänga" → imperative "stäng." Group 2 verbs drop -a in imperative.',
    "Lyssna på mig!": '"Lyssna" → imperative "lyssna" (Group 1 keeps -a). "Lyssna på" = listen to.',
    "Läs instruktionerna!": '"Läsa" → imperative "läs." "Instruktion" is an en-word: instruktionerna.',
    "Häll upp mer vatten.": '"Hälla upp" = pour. Particle verb imperative: verb + particle: "häll upp."',
    "Skriv ner adressen.": '"Skriva ner" = write down. "Ner" is the particle. Imperative: "skriv ner."',
    "Ta det lugnt!": '"Ta det lugnt" = take it easy. "Lugnt" (neuter) for the impersonal "det."',

    # ── node-22: Passive (23% → target 28%) ──
    "Resultatet publicerades i morse.": '"Publicera" → "publicerades" (past s-passive). "I morse" = this morning.',
    "Mötet ställdes in.": '"Ställa in" = cancel. S-passive past: "ställdes in." The particle stays.',
    "Museet besöks av tusentals turister.": '"Tusentals" = thousands of. "Besöks av" = is visited by. S-passive present.',
    "Bilen reparerades av mekanikern.": '"Reparera" → "reparerades." "-ades" is Group 1 past s-passive ending.',
    "Medicinsk forskning finansieras av staten.": '"Finansiera" = finance. "Staten" = the state/government.',
    "Priserna har höjts.": '"Höja" → "höjts" (perfekt s-passive). Very concise: har + supinum + s.',

    # ── node-23: S-verbs (21% → target 28%) ──
    "De brottas på mattan.": '"Brottas" = wrestle. Reciprocal – they wrestle each other.',
    "Vi enades om priset.": '"Enas om" = agree on. Past: "enades." Reciprocal s-verb.',
    "Han kräks av maten.": '"Kräkas" = vomit. Deponent – active meaning but -s form always.',
    "De längtade efter sommaren.": '"Längtas" or "längta" – both work. "Längtas" is more traditional.',
    "Vi andades tungt.": '"Andas" past: "andades." Even in past tense the -s remains.',

    # ── node-24: Future & conditional (23% → target 28%) ──
    "Jag ska prova den nya restaurangen.": '"Prova" = try. "Ska prova" = am going to try (planned action).',
    "Sommaren kommer att bli fin.": '"Kommer att bli" = will become/be. Prediction about the future.',
    "Vi skulle stanna längre om vi kunde.": '"Om vi kunde" = if we could. Hypothetical condition: past tense in Swedish.',
    "Han ska plugga till läkare.": '"Plugga" = study (informal). "Plugga till" = study to become.',
    "Jag tänker lära mig franska.": '"Tänker" + infinitive = intend to. "Lära sig" = learn (reflexive).',
    "Vi lär komma sent.": '"Lär" = probably will / are likely to. A modal for likelihood.',

    # ── node-25: Advanced connectors (23% → target 28%) ──
    "Trots att hon var trött fortsatte hon.": '"Trots att" = despite the fact that. Subclause triggers verb-final order.',
    "Så länge du är här är jag glad.": '"Så länge" = as long as. Second clause inverts after fronted subclause.',
    "Visserligen är det dyrt, men det är bra.": '"Visserligen...men" = admittedly...but. Concessive pattern.',
    "I synnerhet gillar jag svensk natur.": '"I synnerhet" = especially/in particular. Formal connector.',
    "I och med att vi fick pengar kunde vi resa.": '"I och med att" = given that / due to the fact that. Three-word connector.',

    # ── node-26: Participles (20% → target 28%) ──
    "Ett avslappnande bad.": '"Avslappnande" = relaxing. Present participle from "avslappna." -ande is universal.',
    "De fascinerande berättelserna.": '"Fascinerande" = fascinating. Present participle – never changes form.',
    "En utmanande uppgift.": '"Utmanande" = challenging. From "utmana" (challenge).',
    "Ett inspirerande tal.": '"Inspirerande" = inspiring. "Tal" is ett-word: ett tal, talet, tal, talen.',
    "Den försenade avgången.": '"Försenad" = delayed. Past participle of "försena." "Avgång" = departure.',
    "De beställda varorna.": '"Beställd" = ordered. Past participle of "beställa." Plural: "beställda."',
    "Ett välkänt varumärke.": '"Välkänd" = well-known. Compound participle: väl + känd. "Varumärke" = brand.',
    "En lagad cykel.": '"Lagad" = repaired. Past participle of "laga." En-word indefinite: "lagad."',
    "De bortglömda sakerna.": '"Bortglömd" = forgotten/left behind. "Bort" (away) + "glömd" (forgotten).',

    # ── node-27: Reported speech (20% → target 28%) ──
    "De föreslog att vi skulle vänta.": '"Föreslå" = suggest. "Skulle" in reported speech = should/would.',
    "Han erkände att han hade fel.": '"Erkänna" = admit. "Ha fel" = be wrong. "Hade" in reported speech.',
    "Hon försäkrade mig om att allt var bra.": '"Försäkra om" = assure. "Allt" = everything. Reported past tense.',
    "De varnade oss att det var farligt.": '"Varna" = warn. "Farligt" = dangerous (neuter with "det").',
    "Han påminde mig om att betala.": '"Påminna om" = remind about. "Att betala" = to pay (infinitive).',
    "Hon berättade att hon var gravid.": '"Gravid" = pregnant. Reported speech keeps the tense of the original.',
    "De krävde att vi skulle lämna.": '"Kräva" = demand. "Kräva att" + should clause for demands.',

    # ── node-31: Advanced word order (21% → target 28%) ──
    "Hur vi löser problemet vet jag inte.": 'Fronted indirect question as topic: "Hur vi löser" + inverted main: "vet jag inte."',
    "Var hon bor är en hemlighet.": 'Indirect question as subject: "Var hon bor" = where she lives.',
    "Vad han sa förvånade oss.": 'Indirect question as subject. Normal word order inside: "vad han sa."',
    "Att han kom förvånade mig.": '"Att"-clause as subject. "Förvånade" = surprised. Very natural in Swedish.',
    "Hade vi vetat hade vi stannat.": 'Inverted conditional: "Hade vi vetat" = if we had known. No "om" needed.',
    "Så bra att du kom!": '"Så + adj + att" = so (adj) that. Exclamation pattern.',
    "Vore det inte trevligt?": '"Vore" (subjunctive of "vara") in questions = wouldn\'t it be?',
    "Heller inte jag trodde det.": '"Heller inte" = neither/nor. "Inte heller" is more standard.',

    # ── node-32: Literary Swedish (23% → target 28%) ──
    "Strömmen flöt sakta genom den sovande byn.": '"Sovande" = sleeping (present participle). Personification of the village.',
    "Hösten hade klätt landskapet i guld.": '"Klä" = dress/clothe. "Klä i" = dress in. Metaphor for autumn colors.',
    "Han lutade sig mot stammen av den gamla eken.": '"Luta sig" = lean. "Stam" = trunk. "Ek" = oak (en ek, eken).',
    "Tidvattnet bar med sig vrakdelar från det förflutna.": '"Det förflutna" = the past (literary). "Vrakdelar" = wreckage (compound).',
    "Skuggorna dansade i skenet av elden.": '"Sken" = glow. "I skenet av" = in the light/glow of.',
    "Tystnaden bröts av en fågels rop.": '"Brytas av" = be broken by. "Fågels" = bird\'s (genitive -s).',

    # ── node-33: Academic discourse (22% → target 28%) ──
    "Hypotesen kunde inte falsifieras.": '"Falsifiera" = falsify. "Kunde inte falsifieras" = could not be falsified.',
    "Studiens begränsningar bör nämnas.": '"Begränsning" = limitation. "Bör" = should (formal). "Nämnas" = be mentioned.',
    "I denna kontext avses med begreppet.": '"Avses" = is meant (s-passive of "avse"). "Begrepp" = concept.',
    "Resultaten överensstämmer med tidigare forskning.": '"Överensstämma med" = correspond with/agree with. Formal academic verb.',
    "Fenomenet har studerats ur olika perspektiv.": '"Ur" = from (formal). "Olika perspektiv" = various perspectives.',
    "Metoden tillämpades på ett urval av respondenter.": '"Tillämpa" = apply (method). "Urval" = sample/selection.',
    "Datan analyserades med avseende på tre variabler.": '"Med avseende på" = with regard to. Key academic Swedish phrase.',
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
