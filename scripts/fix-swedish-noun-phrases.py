#!/usr/bin/env python3
"""
Fix bare noun phrase cards and nonsensical adverb cards in Swedish deck nodes 13-17.

Identifies cards that are:
1. Bare noun phrases (no verb/predicate) in nodes 15 (the main offender)
2. Cards with nonsensical adverb additions across nodes 13-17
   (e.g., "next week soon", "very often here", "in the morning really")

Replaces them with proper full sentences that preserve the original adjective+noun vocabulary.
"""

import json
import re
import sys

DECK_PATH = "src/data/swedish/deck.json"

# ─── REPLACEMENT MAP ───────────────────────────────────────────────────────
# Each entry: original_id -> (new_english, new_swedish)
# Preserves the adjective+noun vocabulary from the original card.

REPLACEMENTS = {
    # ═══ NODE 15: BARE NOUN PHRASES ═══

    # Indefinite en-word basics
    "sv-1723": (
        "We need a big car for the trip to Dalarna.",
        "Vi behöver en stor bil för resan till Dalarna."
    ),
    "sv-1724": (
        "They bought a big house near the lake.",
        "De köpte ett stort hus nära sjön."
    ),
    "sv-1726": (
        "The big car was parked outside the store.",
        "Den stora bilen stod parkerad utanför affären."
    ),
    "sv-1727": (
        "The big house belongs to my grandparents.",
        "Det stora huset tillhör mina morföräldrar."
    ),
    "sv-1728": (
        "The big cars take up too much space in the garage.",
        "De stora bilarna tar för mycket plats i garaget."
    ),
    # Nonsensical: "The small children next week soon."
    "sv-1735": (
        "The small children played in the garden all afternoon.",
        "De små barnen lekte i trädgården hela eftermiddagen."
    ),
    "sv-1736": (
        "It was a beautiful day so we went to the beach.",
        "Det var en vacker dag så vi åkte till stranden."
    ),
    "sv-1737": (
        "We drove through a beautiful landscape on the way north.",
        "Vi körde genom ett vackert landskap på vägen norrut."
    ),
    # Nonsensical: "Beautiful flowers together."
    "sv-1738": (
        "She arranged the beautiful flowers in a vase on the table.",
        "Hon ställde de vackra blommorna i en vas på bordet."
    ),
    # Nonsensical adverbs: "A cold winter day last week too."
    "sv-1741": (
        "On a cold winter day we stayed inside and drank hot chocolate.",
        "En kall vinterdag stannade vi inne och drack varm choklad."
    ),
    "sv-1742": (
        "The cold water in the lake made us shiver.",
        "Det kalla vattnet i sjön fick oss att huttra."
    ),
    # Nonsensical: "A cheaper solution after work with the family."
    "sv-1752": (
        "We found a cheaper solution that worked just as well.",
        "Vi hittade en billigare lösning som fungerade lika bra."
    ),
    # Nonsensical: "The most beautiful place right now in the end."
    "sv-1753": (
        "That is the most beautiful place I have ever visited.",
        "Det är den vackraste platsen jag någonsin har besökt."
    ),
    "sv-1754": (
        "A happy boy ran across the schoolyard.",
        "En glad pojke sprang över skolgården."
    ),
    # Nonsensical: "A happy child for a long time soon."
    "sv-1755": (
        "A happy child laughed and clapped its hands.",
        "Ett glatt barn skrattade och klappade i händerna."
    ),
    # Nonsensical: "A new book after work too."
    "sv-1759": (
        "I bought a new book at the bookstore yesterday.",
        "Jag köpte en ny bok i bokhandeln igår."
    ),
    "sv-1760": (
        "She started a new job in Gothenburg last month.",
        "Hon började ett nytt jobb i Göteborg förra månaden."
    ),
    # Nonsensical: "The new car on the weekend with friends."
    "sv-1762": (
        "The new car drives much better than the old one.",
        "Den nya bilen kör mycket bättre än den gamla."
    ),
    # Nonsensical: "A funny movie in the morning really."
    "sv-1765": (
        "We watched a funny movie and laughed the whole evening.",
        "Vi tittade på en rolig film och skrattade hela kvällen."
    ),
    "sv-1766": (
        "He told a funny joke that made everyone laugh.",
        "Han berättade ett roligt skämt som fick alla att skratta."
    ),
    "sv-1768": (
        "She asked an important question during the meeting.",
        "Hon ställde en viktig fråga under mötet."
    ),
    # Nonsensical: "An important decision very often with friends."
    "sv-1769": (
        "We have to make an important decision before Friday.",
        "Vi måste fatta ett viktigt beslut före fredag."
    ),
    "sv-1773": (
        "A tall building stood at the end of the street.",
        "En hög byggnad stod i slutet av gatan."
    ),
    # Nonsensical: "The tallest tower right now here."
    "sv-1774": (
        "The tallest tower in the city can be seen from far away.",
        "Det högsta tornet i staden syns långt bortifrån."
    ),
    # Nonsensical: "A thick book during the week too."
    "sv-1775": (
        "I read a thick book during the holiday.",
        "Jag läste en tjock bok under semestern."
    ),
    "sv-1776": (
        "She wrote the address on a thin paper.",
        "Hon skrev adressen på ett tunt papper."
    ),
    "sv-1778": (
        "We walked along a wide street lined with trees.",
        "Vi gick längs en bred gata kantad med träd."
    ),
    "sv-1779": (
        "The bus drove down a narrow road through the forest.",
        "Bussen körde på en smal väg genom skogen."
    ),
    # Nonsensical: "It's just as good last week too."
    "sv-1780": (
        "The weather today is just as good as yesterday.",
        "Vädret idag är lika bra som igår."
    ),
    "sv-1783": (
        "I found a more interesting book at the library.",
        "Jag hittade en mer intressant bok på biblioteket."
    ),
    "sv-1784": (
        "That was the most exciting movie I have ever seen.",
        "Det var den mest spännande filmen jag någonsin sett."
    ),
    "sv-1785": (
        "We visited an old church in the countryside.",
        "Vi besökte en gammal kyrka på landsbygden."
    ),
    "sv-1786": (
        "There is an old castle in the park that dates from the 1600s.",
        "Det finns ett gammalt slott i parken som är från 1600-talet."
    ),
    "sv-1787": (
        "The Old Town in Stockholm is a popular tourist destination.",
        "Gamla Stan i Stockholm är ett populärt turistmål."
    ),
    # Nonsensical: "A young woman next week with friends."
    "sv-1788": (
        "A young woman sat on the bench and read a newspaper.",
        "En ung kvinna satt på bänken och läste en tidning."
    ),
    # Nonsensical: "The young couple on the weekend next year."
    "sv-1789": (
        "The young couple moved into their first apartment.",
        "Det unga paret flyttade in i sin första lägenhet."
    ),
    # Nonsensical: "A rich man in the evening in the end."
    "sv-1790": (
        "A rich man donated money to the hospital.",
        "En rik man donerade pengar till sjukhuset."
    ),
    "sv-1791": (
        "Sweden is a rich country with a high standard of living.",
        "Sverige är ett rikt land med hög levnadsstandard."
    ),
    # Nonsensical: "A poor family during the week too."
    "sv-1793": (
        "A poor family received help from their neighbors.",
        "En fattig familj fick hjälp av sina grannar."
    ),
    "sv-1794": (
        "The poorest area in the city needs more resources.",
        "Det fattigaste området i staden behöver mer resurser."
    ),
    "sv-1795": (
        "We have a kind neighbor who always helps us.",
        "Vi har en snäll granne som alltid hjälper oss."
    ),
    # Nonsensical: "The kindest dog right now with friends."
    "sv-1797": (
        "The kindest dog in the neighborhood always greets everyone.",
        "Den snällaste hunden i grannskapet hälsar alltid på alla."
    ),
    "sv-1798": (
        "We spent a quiet evening at home with a good book.",
        "Vi tillbringade en tyst kväll hemma med en bra bok."
    ),
    "sv-1799": (
        "The library is quieter than usual today.",
        "Biblioteket är tystare än vanligt idag."
    ),
    "sv-1800": (
        "The quietest place in the house is the attic.",
        "Den tystaste platsen i huset är vinden."
    ),
    "sv-1801": (
        "We sat outside on a bright summer evening and talked.",
        "Vi satt ute en ljus sommarkväll och pratade."
    ),
    # Nonsensical: "The brightest room right now really."
    "sv-1802": (
        "The brightest room in the apartment faces south.",
        "Det ljusaste rummet i lägenheten ligger mot söder."
    ),
    "sv-1803": (
        "It was a dark night and we could barely see the path.",
        "Det var en mörk natt och vi kunde knappt se stigen."
    ),
    # Nonsensical: "Darker days together during summer."
    "sv-1804": (
        "The darker days in autumn make me want to stay inside.",
        "De mörkare dagarna på hösten gör att jag vill stanna inne."
    ),
    "sv-1805": (
        "The darkest winter I remember was the one in 2010.",
        "Den mörkaste vintern jag minns var den 2010."
    ),
    "sv-1806": (
        "He hung a clean shirt in the wardrobe.",
        "Han hängde en ren skjorta i garderoben."
    ),
    "sv-1807": (
        "We always keep a clean kitchen at home.",
        "Vi har alltid ett rent kök hemma."
    ),
    # Nonsensical: "A dirty car very often soon."
    "sv-1809": (
        "The children came home with a dirty car after the trip.",
        "Barnen kom hem med en smutsig bil efter utflykten."
    ),
    "sv-1810": (
        "The floor is dirtier than yesterday after the party.",
        "Golvet är smutsigare än igår efter festen."
    ),
    "sv-1811": (
        "We had a dry summer with almost no rain.",
        "Vi hade en torr sommar med nästan inget regn."
    ),
    "sv-1813": (
        "It was a wet day so we stayed indoors.",
        "Det var en blöt dag så vi stannade inomhus."
    ),
    "sv-1815": (
        "The children found a cute kitten behind the house.",
        "Barnen hittade en söt kattunge bakom huset."
    ),
    "sv-1816": (
        "Everyone agreed that it was the cutest puppy at the shelter.",
        "Alla tyckte att det var den sötaste valpen på djurhemmet."
    ),
    "sv-1817": (
        "We have a grumpy neighbor who complains about everything.",
        "Vi har en sur granne som klagar på allt."
    ),
    # Nonsensical: "A friendlier tone for a long time in the end."
    "sv-1820": (
        "She used a friendlier tone when speaking to the children.",
        "Hon använde en vänligare ton när hon talade med barnen."
    ),
    # Nonsensical: "The nicest weather after work now."
    "sv-1821": (
        "We always get the nicest weather in June.",
        "Vi får alltid det finaste vädret i juni."
    ),
    "sv-1822": (
        "We searched for a calmer place to live outside the city.",
        "Vi letade efter en lugnare plats att bo på utanför staden."
    ),
    "sv-1824": (
        "I would like a stronger coffee, please.",
        "Jag skulle vilja ha en starkare kaffe, tack."
    ),
    # Nonsensical: "The weakest tea very often with the family."
    "sv-1825": (
        "The weakest tea on the menu still had a nice flavor.",
        "Det svagaste teet på menyn hade ändå en fin smak."
    ),

    # ═══ NODE 15: BORDERLINE / SHORT PREDICATE-LESS COMPARATIVES ═══
    "sv-1777": (
        "The thinnest fabric in the store was surprisingly expensive.",
        "Det tunnaste tyget i affären var förvånansvärt dyrt."
    ),
    "sv-1812": (
        "The driest summer in a long time caused problems for farmers.",
        "Den torraste sommaren på länge skapade problem för bönderna."
    ),
    "sv-1767": (
        "That was the funniest movie I have ever seen.",
        "Det var den roligaste filmen jag någonsin har sett."
    ),
    "sv-1823": (
        "A walk in the forest is the calmest thing I know.",
        "En promenad i skogen är det lugnaste jag vet."
    ),
    "sv-1832": (
        "The further north you go, the colder it gets.",
        "Ju längre norrut man åker, desto kallare blir det."
    ),

    # ═══ NODE 13: NONSENSICAL ADVERB ADDITIONS ═══
    "sv-1594": (
        "She is not coming today.",
        "Hon kommer inte idag."
    ),
    "sv-1597": (
        "He doesn't want to go out this evening.",
        "Han vill inte gå ut i kväll."
    ),
    "sv-1603": (
        "There is nobody home at the moment.",
        "Det finns ingen hemma just nu."
    ),
    "sv-1611": (
        "She couldn't manage anymore after such a long day.",
        "Hon orkade inte mer efter en så lång dag."
    ),
    "sv-1615": (
        "He doesn't smoke anymore since he quit last year.",
        "Han röker inte längre sedan han slutade förra året."
    ),
    "sv-1619": (
        "They didn't even come on time despite the reminder.",
        "De kom inte ens i tid trots påminnelsen."
    ),
    "sv-1621": (
        "She said nothing for a long time and just looked away.",
        "Hon sa ingenting på länge och tittade bara bort."
    ),
    "sv-1637": (
        "He didn't want to talk about it anymore.",
        "Han ville inte prata om det längre."
    ),
    "sv-1639": (
        "I didn't get an answer even though I waited all week.",
        "Jag fick inte svar trots att jag väntade hela veckan."
    ),
    "sv-1649": (
        "It doesn't hurt as much now as it did before.",
        "Det gör inte lika ont nu som det gjorde förut."
    ),
    "sv-1654": (
        "She doesn't know what she really wants.",
        "Hon vet inte vad hon egentligen vill."
    ),
    "sv-1660": (
        "We didn't get a seat on the evening train.",
        "Vi fick inte plats på kvällståget."
    ),
    "sv-1665": (
        "He couldn't sleep all night because of the noise.",
        "Han kunde inte sova hela natten på grund av bullret."
    ),
    "sv-1666": (
        "I didn't want to disturb you so I waited outside.",
        "Jag ville inte störa dig så jag väntade utanför."
    ),

    # ═══ NODE 14: NONSENSICAL ADVERB ADDITIONS ═══
    "sv-1677": (
        "We live in the countryside near a small village.",
        "Vi bor på landet nära en liten by."
    ),
    "sv-1682": (
        "He works at Volvo as an engineer.",
        "Han jobbar på Volvo som ingenjör."
    ),
    "sv-1695": (
        "I study in the evenings after the children have gone to bed.",
        "Jag studerar om kvällarna efter att barnen har lagt sig."
    ),
    "sv-1697": (
        "She thinks about summer when it is cold outside.",
        "Hon tänker på sommaren när det är kallt ute."
    ),
    "sv-1703": (
        "She hikes towards the summit every summer.",
        "Hon vandrar mot toppen varje sommar."
    ),
    "sv-1709": (
        "I come home from work in the evening.",
        "Jag kommer hem från jobbet på kvällen."
    ),

    # ═══ NODE 16: NONSENSICAL ADVERB ADDITIONS ═══
    "sv-2013": (
        "They have apparently forgotten about the meeting.",
        "De har tydligen glömt bort mötet."
    ),

    # ═══ NODE 17: NONSENSICAL ADVERB ADDITIONS ═══
    "sv-2112": (
        "How do I get to the central station?",
        "Hur tar jag mig till centralstationen?"
    ),
    "sv-2119": (
        "Where is the nearest subway station?",
        "Var ligger närmaste tunnelbanestation?"
    ),
    "sv-2131": (
        "Where is the nearest bus stop from here?",
        "Var ligger närmaste busshållplats härifrån?"
    ),
    "sv-2132": (
        "Is there a parking space near here?",
        "Finns det en parkeringsplats i närheten?"
    ),
    "sv-2173": (
        "We get off at the next station.",
        "Vi kliver av vid nästa station."
    ),
    "sv-2192": (
        "The gas station is located at the highway exit.",
        "Bensinstationen ligger vid avfarten från motorvägen."
    ),
    "sv-2198": (
        "Do you want first class or second class?",
        "Vill du ha första klass eller andra klass?"
    ),
    "sv-2207": (
        "I get on at the next stop.",
        "Jag kliver på vid nästa stopp."
    ),
    "sv-2208": (
        "We queue at the platform while waiting for the train.",
        "Vi köar vid perrongen medan vi väntar på tåget."
    ),

    # ═══ NODE 15: SENTENCES THAT HAVE VERBS BUT NONSENSICAL ADVERBS ═══
    "sv-1732": (
        "She is tall and always stands out in a crowd.",
        "Hon är lång och syns alltid i en folksamling."
    ),
}


def main():
    with open(DECK_PATH, "r", encoding="utf-8") as f:
        deck = json.load(f)

    fixed_count = 0
    fixed_ids = []

    for card in deck:
        card_id = card["id"]
        if card_id in REPLACEMENTS:
            new_eng, new_sv = REPLACEMENTS[card_id]
            old_eng = card["english"]
            old_sv = card["target"]
            card["english"] = new_eng
            card["target"] = new_sv
            fixed_count += 1
            fixed_ids.append(card_id)
            print(f"FIXED {card_id} ({card.get('grammarNode','')}):")
            print(f"  OLD EN: {old_eng}")
            print(f"  NEW EN: {new_eng}")
            print(f"  OLD SV: {old_sv}")
            print(f"  NEW SV: {new_sv}")
            print()

    # Write back
    with open(DECK_PATH, "w", encoding="utf-8") as f:
        json.dump(deck, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\n{'='*60}")
    print(f"Total cards fixed: {fixed_count}")
    print(f"By node:")

    node_counts = {}
    for card in deck:
        if card["id"] in REPLACEMENTS:
            node = card.get("grammarNode", "unknown")
            node_counts[node] = node_counts.get(node, 0) + 1
    for node in sorted(node_counts):
        print(f"  {node}: {node_counts[node]} cards")

    # Verify: check if any remaining bare noun phrases exist in node 15
    print(f"\n{'='*60}")
    print("REMAINING POTENTIAL BARE NOUN PHRASES IN NODE 15:")
    remaining = 0
    for card in deck:
        if card.get("grammarNode") != "node-15":
            continue
        eng = card["english"]
        words = eng.split()
        # Very short, no common verb
        verb_words = {
            'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did',
            'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
            'go', 'goes', 'went', 'going', 'come', 'comes', 'came', 'coming',
            'live', 'lives', 'lived', 'buy', 'buys', 'bought', 'get', 'gets', 'got',
            'need', 'needs', 'want', 'wants', 'like', 'likes', 'think', 'thinks',
            'know', 'knows', 'see', 'sees', 'saw', 'seen', 'eat', 'eats', 'ate',
            'eaten', 'drink', 'drinks', 'drank', 'drunk', 'read', 'reads',
            'write', 'writes', 'wrote', 'written', 'take', 'takes', 'took', 'taken',
            'give', 'gives', 'gave', 'given', 'find', 'finds', 'found',
            'run', 'runs', 'ran', 'say', 'says', 'said', 'tell', 'tells', 'told',
            'make', 'makes', 'made', 'put', 'puts', 'sit', 'sits', 'sat',
            'stand', 'stands', 'stood', 'sleep', 'sleeps', 'slept',
            'drive', 'drives', 'drove', 'walk', 'walks', 'walked',
            'work', 'works', 'worked', 'play', 'plays', 'played',
            'cook', 'cooks', 'cooked', 'clean', 'cleans', 'cleaned',
            'wash', 'washes', 'washed', 'sing', 'sings', 'sang',
            'dance', 'dances', 'danced', 'swim', 'swims', 'swam',
            'fly', 'flies', 'flew', 'stay', 'stays', 'stayed',
            'wait', 'waits', 'waited', 'stop', 'stops', 'stopped',
            'start', 'starts', 'started', 'open', 'opens', 'opened',
            'close', 'closes', 'closed', 'turn', 'turns', 'turned',
            'pay', 'pays', 'paid', 'cost', 'costs', 'become', 'becomes', 'became',
            'feel', 'feels', 'felt', 'look', 'looks', 'looked',
            'taste', 'tastes', 'tasted', 'smell', 'smells', 'smelled',
            'sound', 'sounds', 'sounded', 'seem', 'seems', 'seemed',
            'belong', 'belongs', 'belonged', 'arrange', 'arranges', 'arranged',
            'gather', 'gathers', 'gathered', 'drove', 'explored',
            'held', 'opened', 'prefer', 'prefers', 'preferred',
            'chose', 'choose', 'chooses', 'searched', 'wore',
            'received', 'served', 'covered', 'offered', 'caused',
            'hope', 'hopes', 'hoped', 'spread', 'grows', 'grow',
            'hang', 'hangs', 'hung', 'expected', 'tend', 'tends',
            'attracts', 'lured', 'donated', 'rests',
            'i\'m', 'it\'s', 'he\'s', 'she\'s', 'we\'re', 'they\'re',
            'i\'ve', 'we\'ve', 'they\'ve',
        }
        lower_words = set(w.lower().rstrip('.,!?') for w in words)
        has_verb = bool(lower_words & verb_words)
        if not has_verb and len(words) <= 7:
            print(f"  {card['id']} | EN: {eng} | SV: {card['target']}")
            remaining += 1

    if remaining == 0:
        print("  None found - all bare noun phrases have been fixed!")
    else:
        print(f"  ({remaining} remaining)")


if __name__ == "__main__":
    main()
