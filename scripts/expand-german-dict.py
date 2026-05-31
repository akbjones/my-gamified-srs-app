#!/usr/bin/env python3
"""
Expand the German dictionary (de.ts) by finding missing words from deck.json,
generating IPA, POS, and English translations for each.
"""

import json
import re
import sys
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DECK_PATH = os.path.join(BASE, 'src/data/german/deck.json')
DICT_PATH = os.path.join(BASE, 'src/data/dictionary/de.ts')

# ─── Hardcoded translations for ~500 most common German words ────────────────

COMMON_WORDS = {
    # Pronouns
    'ich': ('I', 'pron'), 'du': ('you (informal)', 'pron'), 'er': ('he', 'pron'),
    'sie': ('she/they/you (formal)', 'pron'), 'es': ('it', 'pron'),
    'wir': ('we', 'pron'), 'ihr': ('you (plural)', 'pron'),
    'mich': ('me', 'pron'), 'dich': ('you', 'pron'), 'sich': ('oneself', 'pron'),
    'uns': ('us', 'pron'), 'euch': ('you (plural)', 'pron'),
    'mir': ('to me', 'pron'), 'dir': ('to you', 'pron'), 'ihm': ('to him', 'pron'),
    'ihnen': ('to them/you', 'pron'), 'mein': ('my', 'det'), 'dein': ('your', 'det'),
    'sein': ('to be; his', 'v'), 'unser': ('our', 'det'), 'euer': ('your (pl)', 'det'),
    'man': ('one, you (impersonal)', 'pron'), 'wer': ('who', 'pron'),
    'was': ('what', 'pron'), 'welche': ('which', 'det'), 'welcher': ('which', 'det'),
    'welches': ('which', 'det'), 'jemand': ('someone', 'pron'),
    'niemand': ('nobody', 'pron'), 'etwas': ('something', 'pron'),
    'nichts': ('nothing', 'pron'), 'alle': ('all', 'det'), 'jeder': ('every', 'det'),
    'jede': ('every', 'det'), 'jedes': ('every', 'det'), 'dieser': ('this', 'det'),
    'diese': ('this', 'det'), 'dieses': ('this', 'det'), 'jener': ('that', 'det'),
    'selbst': ('self', 'pron'), 'einander': ('each other', 'pron'),

    # Articles & determiners
    'der': ('the (masc)', 'det'), 'die': ('the (fem/pl)', 'det'),
    'das': ('the (neut)', 'det'), 'den': ('the (acc masc)', 'det'),
    'dem': ('the (dat)', 'det'), 'des': ('the (gen)', 'det'),
    'ein': ('a, an', 'det'), 'eine': ('a, an (fem)', 'det'),
    'einen': ('a, an (acc masc)', 'det'), 'einem': ('a, an (dat)', 'det'),
    'einer': ('a, an (gen/dat fem)', 'det'), 'eines': ('of a (gen)', 'det'),
    'kein': ('no, not a', 'det'), 'keine': ('no, not a', 'det'),
    'keinen': ('no, not a', 'det'), 'keinem': ('no, not a', 'det'),
    'meine': ('my', 'det'), 'meinen': ('my', 'det'), 'meinem': ('my', 'det'),
    'meiner': ('my', 'det'), 'deine': ('your', 'det'), 'deinen': ('your', 'det'),
    'deinem': ('your', 'det'), 'deiner': ('your', 'det'),
    'seine': ('his', 'det'), 'seinen': ('his', 'det'), 'seinem': ('his', 'det'),
    'seiner': ('his', 'det'), 'ihre': ('her/their', 'det'), 'ihrem': ('her/their', 'det'),
    'ihren': ('her/their', 'det'), 'ihrer': ('her/their', 'det'),
    'unsere': ('our', 'det'), 'unserem': ('our', 'det'), 'unseren': ('our', 'det'),
    'unserer': ('our', 'det'),

    # Prepositions
    'in': ('in', 'prep'), 'an': ('at, on', 'prep'), 'auf': ('on, upon', 'prep'),
    'für': ('for', 'prep'), 'mit': ('with', 'prep'), 'von': ('from, of', 'prep'),
    'zu': ('to', 'prep'), 'bei': ('at, near', 'prep'), 'nach': ('after, to', 'prep'),
    'über': ('over, about', 'prep'), 'unter': ('under, among', 'prep'),
    'vor': ('before, in front of', 'prep'), 'aus': ('from, out of', 'prep'),
    'durch': ('through', 'prep'), 'ohne': ('without', 'prep'),
    'zwischen': ('between', 'prep'), 'neben': ('next to', 'prep'),
    'hinter': ('behind', 'prep'), 'gegen': ('against', 'prep'),
    'um': ('around, at', 'prep'), 'bis': ('until', 'prep'),
    'seit': ('since', 'prep'), 'während': ('during', 'prep'),
    'wegen': ('because of', 'prep'), 'trotz': ('despite', 'prep'),
    'statt': ('instead of', 'prep'), 'außer': ('except', 'prep'),
    'ab': ('from, off', 'prep'), 'entlang': ('along', 'prep'),
    'gegenüber': ('opposite', 'prep'), 'innerhalb': ('within', 'prep'),
    'außerhalb': ('outside of', 'prep'), 'gemäß': ('according to', 'prep'),
    'laut': ('according to; loud', 'prep'), 'mittels': ('by means of', 'prep'),

    # Conjunctions
    'und': ('and', 'conj'), 'oder': ('or', 'conj'), 'aber': ('but', 'conj'),
    'denn': ('because, for', 'conj'), 'weil': ('because', 'conj'),
    'dass': ('that', 'conj'), 'wenn': ('when, if', 'conj'),
    'als': ('when, as, than', 'conj'), 'ob': ('whether', 'conj'),
    'obwohl': ('although', 'conj'), 'sondern': ('but rather', 'conj'),
    'damit': ('so that', 'conj'), 'bevor': ('before', 'conj'),
    'nachdem': ('after', 'conj'), 'sobald': ('as soon as', 'conj'),
    'falls': ('in case', 'conj'), 'sowohl': ('both', 'conj'),
    'weder': ('neither', 'conj'), 'noch': ('still, nor', 'conj'),
    'also': ('so, therefore', 'adv'), 'deshalb': ('therefore', 'adv'),
    'trotzdem': ('nevertheless', 'adv'), 'jedoch': ('however', 'adv'),
    'außerdem': ('moreover', 'adv'), 'allerdings': ('however', 'adv'),
    'daher': ('therefore', 'adv'), 'darum': ('that\'s why', 'adv'),
    'seitdem': ('since then', 'adv'), 'inzwischen': ('meanwhile', 'adv'),

    # Adverbs
    'nicht': ('not', 'adv'), 'auch': ('also', 'adv'), 'sehr': ('very', 'adv'),
    'schon': ('already', 'adv'), 'noch': ('still, yet', 'adv'),
    'nur': ('only', 'adv'), 'immer': ('always', 'adv'), 'hier': ('here', 'adv'),
    'dort': ('there', 'adv'), 'dann': ('then', 'adv'), 'so': ('so, thus', 'adv'),
    'jetzt': ('now', 'adv'), 'heute': ('today', 'adv'), 'morgen': ('tomorrow', 'adv'),
    'gestern': ('yesterday', 'adv'), 'gern': ('gladly', 'adv'),
    'gerne': ('gladly', 'adv'), 'vielleicht': ('perhaps', 'adv'),
    'oft': ('often', 'adv'), 'manchmal': ('sometimes', 'adv'),
    'nie': ('never', 'adv'), 'wieder': ('again', 'adv'),
    'zusammen': ('together', 'adv'), 'bald': ('soon', 'adv'),
    'fast': ('almost', 'adv'), 'genug': ('enough', 'adv'),
    'wirklich': ('really', 'adv'), 'eigentlich': ('actually', 'adv'),
    'ziemlich': ('quite', 'adv'), 'besonders': ('especially', 'adv'),
    'leider': ('unfortunately', 'adv'), 'oben': ('above', 'adv'),
    'unten': ('below', 'adv'), 'links': ('left', 'adv'), 'rechts': ('right', 'adv'),
    'draußen': ('outside', 'adv'), 'drinnen': ('inside', 'adv'),
    'überall': ('everywhere', 'adv'), 'irgendwo': ('somewhere', 'adv'),
    'nirgends': ('nowhere', 'adv'), 'zurück': ('back', 'adv'),
    'weg': ('away', 'adv'), 'hinauf': ('up', 'adv'), 'hinunter': ('down', 'adv'),
    'dazu': ('in addition', 'adv'), 'dabei': ('thereby', 'adv'),
    'dafür': ('for that', 'adv'), 'dagegen': ('against that', 'adv'),
    'davon': ('of that', 'adv'), 'daran': ('on that', 'adv'),
    'darauf': ('on that', 'adv'), 'darüber': ('about that', 'adv'),
    'darunter': ('under that', 'adv'), 'daneben': ('next to that', 'adv'),
    'dadurch': ('through that', 'adv'), 'dahin': ('there', 'adv'),
    'wohin': ('where to', 'adv'), 'woher': ('where from', 'adv'),
    'warum': ('why', 'adv'), 'wie': ('how', 'adv'), 'wo': ('where', 'adv'),
    'wann': ('when', 'adv'), 'mal': ('once, times', 'adv'),
    'eben': ('just, exactly', 'adv'), 'sogar': ('even', 'adv'),
    'zwar': ('indeed', 'adv'), 'eher': ('rather', 'adv'),
    'kaum': ('hardly', 'adv'), 'bereits': ('already', 'adv'),
    'übrigens': ('by the way', 'adv'), 'höchstens': ('at most', 'adv'),
    'mindestens': ('at least', 'adv'), 'ungefähr': ('approximately', 'adv'),
    'natürlich': ('naturally, of course', 'adv'),
    'normalerweise': ('normally', 'adv'), 'plötzlich': ('suddenly', 'adv'),
    'endlich': ('finally', 'adv'), 'meistens': ('mostly', 'adv'),
    'selten': ('rarely', 'adv'), 'häufig': ('frequently', 'adv'),
    'gleichzeitig': ('simultaneously', 'adv'), 'früher': ('earlier, formerly', 'adv'),
    'später': ('later', 'adv'), 'sofort': ('immediately', 'adv'),
    'gleich': ('right away, equal', 'adv'), 'gerade': ('just now, straight', 'adv'),
    'vorher': ('before', 'adv'), 'nachher': ('afterwards', 'adv'),
    'offen': ('open', 'adj'), 'bestimmt': ('certainly', 'adv'),
    'tatsächlich': ('actually', 'adv'), 'insgesamt': ('overall', 'adv'),
    'zunächst': ('first of all', 'adv'), 'zuerst': ('first', 'adv'),
    'zuletzt': ('lastly', 'adv'), 'schließlich': ('finally', 'adv'),
    'ebenso': ('likewise', 'adv'), 'ebenfalls': ('also', 'adv'),
    'weiterhin': ('furthermore', 'adv'), 'dennoch': ('nevertheless', 'adv'),
    'lieber': ('rather, preferably', 'adv'), 'stattdessen': ('instead', 'adv'),
    'ansonsten': ('otherwise', 'adv'), 'irgendwann': ('sometime', 'adv'),

    # Common verbs
    'haben': ('to have', 'v'), 'sein': ('to be', 'v'), 'werden': ('to become', 'v'),
    'können': ('can, to be able', 'v'), 'müssen': ('must, to have to', 'v'),
    'sollen': ('should, to be supposed to', 'v'), 'wollen': ('to want', 'v'),
    'dürfen': ('may, to be allowed', 'v'), 'mögen': ('to like', 'v'),
    'machen': ('to make, to do', 'v'), 'gehen': ('to go', 'v'),
    'kommen': ('to come', 'v'), 'sagen': ('to say', 'v'),
    'geben': ('to give', 'v'), 'nehmen': ('to take', 'v'),
    'finden': ('to find', 'v'), 'denken': ('to think', 'v'),
    'wissen': ('to know (fact)', 'v'), 'kennen': ('to know (person)', 'v'),
    'sehen': ('to see', 'v'), 'lassen': ('to let', 'v'),
    'stehen': ('to stand', 'v'), 'sprechen': ('to speak', 'v'),
    'halten': ('to hold, to stop', 'v'), 'führen': ('to lead', 'v'),
    'bringen': ('to bring', 'v'), 'leben': ('to live', 'v'),
    'fahren': ('to drive, to go', 'v'), 'meinen': ('to mean, to think', 'v'),
    'fragen': ('to ask', 'v'), 'spielen': ('to play', 'v'),
    'arbeiten': ('to work', 'v'), 'brauchen': ('to need', 'v'),
    'folgen': ('to follow', 'v'), 'lernen': ('to learn', 'v'),
    'bestehen': ('to exist, to pass', 'v'), 'verstehen': ('to understand', 'v'),
    'setzen': ('to set, to put', 'v'), 'bekommen': ('to get, to receive', 'v'),
    'beginnen': ('to begin', 'v'), 'erzählen': ('to tell', 'v'),
    'versuchen': ('to try', 'v'), 'schreiben': ('to write', 'v'),
    'laufen': ('to run', 'v'), 'erklären': ('to explain', 'v'),
    'glauben': ('to believe', 'v'), 'helfen': ('to help', 'v'),
    'lesen': ('to read', 'v'), 'ziehen': ('to pull, to move', 'v'),
    'scheinen': ('to seem, to shine', 'v'), 'fallen': ('to fall', 'v'),
    'gehören': ('to belong', 'v'), 'entstehen': ('to arise', 'v'),
    'erhalten': ('to receive', 'v'), 'treffen': ('to meet, to hit', 'v'),
    'suchen': ('to search', 'v'), 'legen': ('to lay, to put', 'v'),
    'vorstellen': ('to introduce, to imagine', 'v'), 'handeln': ('to act, to trade', 'v'),
    'erreichen': ('to reach', 'v'), 'tragen': ('to carry, to wear', 'v'),
    'schaffen': ('to create, to manage', 'v'), 'lesen': ('to read', 'v'),
    'verlieren': ('to lose', 'v'), 'zeigen': ('to show', 'v'),
    'nennen': ('to name, to call', 'v'), 'öffnen': ('to open', 'v'),
    'schließen': ('to close', 'v'), 'kaufen': ('to buy', 'v'),
    'verkaufen': ('to sell', 'v'), 'bezahlen': ('to pay', 'v'),
    'zahlen': ('to pay', 'v'), 'kosten': ('to cost', 'v'),
    'warten': ('to wait', 'v'), 'hören': ('to hear', 'v'),
    'fühlen': ('to feel', 'v'), 'lieben': ('to love', 'v'),
    'essen': ('to eat', 'v'), 'trinken': ('to drink', 'v'),
    'schlafen': ('to sleep', 'v'), 'aufstehen': ('to get up', 'v'),
    'sitzen': ('to sit', 'v'), 'legen': ('to lay', 'v'),
    'kochen': ('to cook', 'v'), 'waschen': ('to wash', 'v'),
    'rufen': ('to call', 'v'), 'bleiben': ('to stay', 'v'),
    'fliegen': ('to fly', 'v'), 'schwimmen': ('to swim', 'v'),
    'tanzen': ('to dance', 'v'), 'singen': ('to sing', 'v'),
    'vergessen': ('to forget', 'v'), 'erinnern': ('to remember', 'v'),
    'besuchen': ('to visit', 'v'), 'bitten': ('to ask, to request', 'v'),
    'wünschen': ('to wish', 'v'), 'hoffen': ('to hope', 'v'),
    'freuen': ('to be happy', 'v'), 'heißen': ('to be called', 'v'),
    'bedeuten': ('to mean', 'v'), 'stellen': ('to place', 'v'),
    'liegen': ('to lie', 'v'), 'nutzen': ('to use', 'v'),
    'bauen': ('to build', 'v'), 'tun': ('to do', 'v'),
    'ändern': ('to change', 'v'), 'passen': ('to fit, to suit', 'v'),
    'fehlen': ('to be missing', 'v'), 'gehören': ('to belong to', 'v'),
    'reisen': ('to travel', 'v'), 'ankommen': ('to arrive', 'v'),
    'abfahren': ('to depart', 'v'), 'mitnehmen': ('to take along', 'v'),
    'aufhören': ('to stop', 'v'), 'anfangen': ('to start', 'v'),
    'aufmachen': ('to open', 'v'), 'zumachen': ('to close', 'v'),
    'anrufen': ('to call (phone)', 'v'), 'einladen': ('to invite', 'v'),
    'ausgehen': ('to go out', 'v'), 'einkaufen': ('to shop', 'v'),
    'benutzen': ('to use', 'v'), 'empfehlen': ('to recommend', 'v'),
    'entscheiden': ('to decide', 'v'), 'entwickeln': ('to develop', 'v'),
    'besitzen': ('to own', 'v'), 'verbringen': ('to spend (time)', 'v'),
    'beobachten': ('to observe', 'v'), 'beschreiben': ('to describe', 'v'),
    'betrachten': ('to consider', 'v'), 'übersetzen': ('to translate', 'v'),
    'überlegen': ('to consider', 'v'), 'versprechen': ('to promise', 'v'),
    'schützen': ('to protect', 'v'), 'vermeiden': ('to avoid', 'v'),
    'verändern': ('to change', 'v'), 'verbessern': ('to improve', 'v'),
    'unterrichten': ('to teach', 'v'), 'überraschen': ('to surprise', 'v'),
    'vorbereiten': ('to prepare', 'v'), 'teilnehmen': ('to participate', 'v'),
    'anbieten': ('to offer', 'v'), 'aufräumen': ('to tidy up', 'v'),

    # Common nouns
    'zeit': ('time', 'n'), 'jahr': ('year', 'n'), 'mensch': ('human, person', 'n'),
    'tag': ('day', 'n'), 'frau': ('woman, Mrs.', 'n'), 'mann': ('man', 'n'),
    'kind': ('child', 'n'), 'land': ('country', 'n'), 'welt': ('world', 'n'),
    'haus': ('house', 'n'), 'stadt': ('city', 'n'), 'straße': ('street', 'n'),
    'arbeit': ('work', 'n'), 'leben': ('life', 'n'), 'wasser': ('water', 'n'),
    'geld': ('money', 'n'), 'schule': ('school', 'n'), 'name': ('name', 'n'),
    'hand': ('hand', 'n'), 'auge': ('eye', 'n'), 'kopf': ('head', 'n'),
    'buch': ('book', 'n'), 'tür': ('door', 'n'), 'weg': ('way, path', 'n'),
    'beispiel': ('example', 'n'), 'frage': ('question', 'n'),
    'seite': ('side, page', 'n'), 'teil': ('part', 'n'),
    'platz': ('place, square', 'n'), 'grund': ('reason, ground', 'n'),
    'stunde': ('hour', 'n'), 'minute': ('minute', 'n'),
    'woche': ('week', 'n'), 'monat': ('month', 'n'),
    'nacht': ('night', 'n'), 'morgen': ('morning', 'n'),
    'abend': ('evening', 'n'), 'familie': ('family', 'n'),
    'freund': ('friend', 'n'), 'mutter': ('mother', 'n'),
    'vater': ('father', 'n'), 'bruder': ('brother', 'n'),
    'schwester': ('sister', 'n'), 'tochter': ('daughter', 'n'),
    'sohn': ('son', 'n'), 'eltern': ('parents', 'n'),
    'essen': ('food', 'n'), 'brot': ('bread', 'n'),
    'tisch': ('table', 'n'), 'stuhl': ('chair', 'n'),
    'bett': ('bed', 'n'), 'zimmer': ('room', 'n'),
    'küche': ('kitchen', 'n'), 'bad': ('bathroom', 'n'),
    'fenster': ('window', 'n'), 'auto': ('car', 'n'),
    'bus': ('bus', 'n'), 'zug': ('train', 'n'),
    'flugzeug': ('airplane', 'n'), 'arzt': ('doctor', 'n'),
    'lehrer': ('teacher', 'n'), 'musik': ('music', 'n'),
    'sport': ('sport', 'n'), 'tier': ('animal', 'n'),
    'hund': ('dog', 'n'), 'katze': ('cat', 'n'),
    'baum': ('tree', 'n'), 'blume': ('flower', 'n'),
    'berg': ('mountain', 'n'), 'meer': ('sea', 'n'),
    'fluss': ('river', 'n'), 'see': ('lake', 'n'),
    'sonne': ('sun', 'n'), 'regen': ('rain', 'n'),
    'wetter': ('weather', 'n'), 'farbe': ('color', 'n'),
    'sprache': ('language', 'n'), 'wort': ('word', 'n'),
    'satz': ('sentence', 'n'), 'brief': ('letter', 'n'),
    'zeitung': ('newspaper', 'n'), 'film': ('film', 'n'),
    'telefon': ('telephone', 'n'), 'computer': ('computer', 'n'),
    'idee': ('idea', 'n'), 'problem': ('problem', 'n'),
    'lösung': ('solution', 'n'), 'antwort': ('answer', 'n'),
    'hilfe': ('help', 'n'), 'möglichkeit': ('possibility', 'n'),
    'erfahrung': ('experience', 'n'), 'gesellschaft': ('society', 'n'),
    'regierung': ('government', 'n'), 'unternehmen': ('company', 'n'),
    'geschichte': ('history, story', 'n'), 'kirche': ('church', 'n'),
    'universität': ('university', 'n'), 'kultur': ('culture', 'n'),
    'kunst': ('art', 'n'), 'natur': ('nature', 'n'),
    'umwelt': ('environment', 'n'), 'wirtschaft': ('economy', 'n'),
    'politik': ('politics', 'n'), 'wissenschaft': ('science', 'n'),
    'technik': ('technology', 'n'), 'gesundheit': ('health', 'n'),
    'krankheit': ('illness', 'n'), 'medizin': ('medicine', 'n'),
    'markt': ('market', 'n'), 'preis': ('price', 'n'),
    'anfang': ('beginning', 'n'), 'ende': ('end', 'n'),
    'zukunft': ('future', 'n'), 'vergangenheit': ('past', 'n'),
    'sicherheit': ('safety, security', 'n'), 'freiheit': ('freedom', 'n'),
    'erfolg': ('success', 'n'), 'unterschied': ('difference', 'n'),
    'beziehung': ('relationship', 'n'), 'situation': ('situation', 'n'),
    'entwicklung': ('development', 'n'), 'meinung': ('opinion', 'n'),
    'aufgabe': ('task', 'n'), 'ziel': ('goal', 'n'),
    'recht': ('right, law', 'n'), 'gesetz': ('law', 'n'),
    'schritt': ('step', 'n'), 'richtung': ('direction', 'n'),
    'entscheidung': ('decision', 'n'), 'verantwortung': ('responsibility', 'n'),
    'chance': ('chance', 'n'), 'interesse': ('interest', 'n'),
    'rolle': ('role', 'n'), 'bedeutung': ('meaning', 'n'),
    'einfluss': ('influence', 'n'), 'beitrag': ('contribution', 'n'),
    'folge': ('consequence', 'n'), 'wirkung': ('effect', 'n'),
    'gefahr': ('danger', 'n'), 'angst': ('fear', 'n'),
    'freude': ('joy', 'n'), 'glück': ('luck, happiness', 'n'),
    'liebe': ('love', 'n'), 'ruhe': ('peace, quiet', 'n'),
    'kraft': ('strength, power', 'n'), 'energie': ('energy', 'n'),
    'hafen': ('harbor', 'n'), 'brücke': ('bridge', 'n'),
    'garten': ('garden', 'n'), 'park': ('park', 'n'),
    'restaurant': ('restaurant', 'n'), 'hotel': ('hotel', 'n'),
    'flughafen': ('airport', 'n'), 'bahnhof': ('train station', 'n'),
    'krankenhaus': ('hospital', 'n'), 'bibliothek': ('library', 'n'),
    'laden': ('store', 'n'), 'supermarkt': ('supermarket', 'n'),
    'apotheke': ('pharmacy', 'n'), 'post': ('post office', 'n'),
    'polizei': ('police', 'n'), 'feuerwehr': ('fire department', 'n'),
    'amt': ('office, authority', 'n'), 'büro': ('office', 'n'),
    'kleid': ('dress', 'n'), 'hemd': ('shirt', 'n'),
    'hose': ('pants', 'n'), 'schuh': ('shoe', 'n'),
    'tasche': ('bag, pocket', 'n'), 'schlüssel': ('key', 'n'),
    'uhr': ('clock, watch', 'n'), 'glas': ('glass', 'n'),
    'tasse': ('cup', 'n'), 'teller': ('plate', 'n'),
    'messer': ('knife', 'n'), 'gabel': ('fork', 'n'),
    'löffel': ('spoon', 'n'), 'flasche': ('bottle', 'n'),
    'reis': ('rice', 'n'), 'fleisch': ('meat', 'n'),
    'fisch': ('fish', 'n'), 'gemüse': ('vegetables', 'n'),
    'obst': ('fruit', 'n'), 'milch': ('milk', 'n'),
    'käse': ('cheese', 'n'), 'butter': ('butter', 'n'),
    'zucker': ('sugar', 'n'), 'salz': ('salt', 'n'),
    'kaffee': ('coffee', 'n'), 'tee': ('tea', 'n'),
    'bier': ('beer', 'n'), 'wein': ('wine', 'n'),
    'saft': ('juice', 'n'), 'suppe': ('soup', 'n'),
    'kuchen': ('cake', 'n'), 'ei': ('egg', 'n'),

    # Common adjectives
    'gut': ('good', 'adj'), 'schlecht': ('bad', 'adj'),
    'groß': ('big, tall', 'adj'), 'klein': ('small', 'adj'),
    'neu': ('new', 'adj'), 'alt': ('old', 'adj'),
    'lang': ('long', 'adj'), 'kurz': ('short', 'adj'),
    'hoch': ('high', 'adj'), 'tief': ('deep, low', 'adj'),
    'schnell': ('fast', 'adj'), 'langsam': ('slow', 'adj'),
    'stark': ('strong', 'adj'), 'schwach': ('weak', 'adj'),
    'schön': ('beautiful', 'adj'), 'hässlich': ('ugly', 'adj'),
    'richtig': ('correct, right', 'adj'), 'falsch': ('wrong, false', 'adj'),
    'wichtig': ('important', 'adj'), 'möglich': ('possible', 'adj'),
    'nötig': ('necessary', 'adj'), 'fertig': ('ready, finished', 'adj'),
    'einfach': ('simple, easy', 'adj'), 'schwer': ('heavy, difficult', 'adj'),
    'leicht': ('light, easy', 'adj'), 'dunkel': ('dark', 'adj'),
    'hell': ('bright, light', 'adj'), 'warm': ('warm', 'adj'),
    'kalt': ('cold', 'adj'), 'heiß': ('hot', 'adj'),
    'trocken': ('dry', 'adj'), 'nass': ('wet', 'adj'),
    'frei': ('free', 'adj'), 'voll': ('full', 'adj'),
    'leer': ('empty', 'adj'), 'offen': ('open', 'adj'),
    'jung': ('young', 'adj'), 'dick': ('thick, fat', 'adj'),
    'dünn': ('thin', 'adj'), 'breit': ('wide', 'adj'),
    'eng': ('narrow, tight', 'adj'), 'rund': ('round', 'adj'),
    'ganz': ('whole, quite', 'adj'), 'halb': ('half', 'adj'),
    'laut': ('loud', 'adj'), 'leise': ('quiet', 'adj'),
    'müde': ('tired', 'adj'), 'sauber': ('clean', 'adj'),
    'schmutzig': ('dirty', 'adj'), 'teuer': ('expensive', 'adj'),
    'billig': ('cheap', 'adj'), 'süß': ('sweet', 'adj'),
    'sauer': ('sour, angry', 'adj'), 'bitter': ('bitter', 'adj'),
    'scharf': ('sharp, spicy', 'adj'), 'weich': ('soft', 'adj'),
    'hart': ('hard', 'adj'), 'ruhig': ('calm, quiet', 'adj'),
    'nett': ('nice', 'adj'), 'freundlich': ('friendly', 'adj'),
    'glücklich': ('happy', 'adj'), 'traurig': ('sad', 'adj'),
    'krank': ('sick', 'adj'), 'gesund': ('healthy', 'adj'),
    'bereit': ('ready', 'adj'), 'sicher': ('safe, sure', 'adj'),
    'gefährlich': ('dangerous', 'adj'), 'bekannt': ('known, famous', 'adj'),
    'verschieden': ('different', 'adj'), 'bestimmt': ('certain', 'adj'),
    'genau': ('exact', 'adj'), 'typisch': ('typical', 'adj'),
    'normal': ('normal', 'adj'), 'besonder': ('special', 'adj'),
    'ähnlich': ('similar', 'adj'), 'direkt': ('direct', 'adj'),

    # Numbers
    'null': ('zero', 'num'), 'eins': ('one', 'num'), 'zwei': ('two', 'num'),
    'drei': ('three', 'num'), 'vier': ('four', 'num'), 'fünf': ('five', 'num'),
    'sechs': ('six', 'num'), 'sieben': ('seven', 'num'), 'acht': ('eight', 'num'),
    'neun': ('nine', 'num'), 'zehn': ('ten', 'num'), 'elf': ('eleven', 'num'),
    'zwölf': ('twelve', 'num'), 'hundert': ('hundred', 'num'),
    'tausend': ('thousand', 'num'), 'million': ('million', 'num'),
    'erste': ('first', 'adj'), 'zweite': ('second', 'adj'),
    'dritte': ('third', 'adj'), 'vierte': ('fourth', 'adj'),
    'fünfte': ('fifth', 'adj'), 'letzte': ('last', 'adj'),
    'nächste': ('next', 'adj'),

    # Colors
    'rot': ('red', 'adj'), 'blau': ('blue', 'adj'), 'grün': ('green', 'adj'),
    'gelb': ('yellow', 'adj'), 'weiß': ('white', 'adj'), 'schwarz': ('black', 'adj'),
    'braun': ('brown', 'adj'), 'grau': ('gray', 'adj'), 'rosa': ('pink', 'adj'),
    'lila': ('purple', 'adj'), 'orange': ('orange', 'adj'),

    # Other common words
    'ja': ('yes', 'adv'), 'nein': ('no', 'adv'), 'bitte': ('please', 'adv'),
    'danke': ('thank you', 'adv'), 'hallo': ('hello', 'n'),
    'tschüss': ('bye', 'n'), 'willkommen': ('welcome', 'adj'),
    'entschuldigung': ('excuse me, sorry', 'n'),
    'da': ('there, since', 'adv'), 'doch': ('yet, after all', 'adv'),
    'mehr': ('more', 'adv'), 'weniger': ('less', 'adv'),
    'wenig': ('little, few', 'adj'), 'viel': ('much, many', 'adj'),
    'viele': ('many', 'adj'), 'einige': ('some', 'det'),
    'andere': ('other', 'adj'), 'anderer': ('other', 'adj'),
    'anderes': ('other', 'adj'), 'beiden': ('both', 'det'),
    'beide': ('both', 'det'), 'solche': ('such', 'det'),
    'mehrere': ('several', 'det'), 'ganze': ('whole', 'adj'),
    'erste': ('first', 'adj'), 'eigene': ('own', 'adj'),
    'nächste': ('next', 'adj'), 'letzte': ('last', 'adj'),
    'besondere': ('special', 'adj'), 'verschiedene': ('various', 'adj'),
    'bestimmte': ('certain', 'adj'),
}

# ─── German IPA generation ───────────────────────────────────────────────────

def german_ipa(word: str) -> str:
    """Generate approximate IPA for a German word."""
    w = word.lower()
    ipa = ''
    i = 0
    n = len(w)

    # Track if we're at word start
    def at_start():
        return i == 0 or (i > 0 and ipa and ipa[-1] == 'ˈ')

    while i < n:
        # Multi-character sequences first (longest match)
        remaining = w[i:]

        # sch
        if remaining.startswith('sch'):
            ipa += 'ʃ'
            i += 3
            continue

        # tsch
        if remaining.startswith('tsch'):
            ipa += 'tʃ'
            i += 4
            continue

        # ch - context dependent
        if remaining.startswith('ch'):
            if i > 0 and w[i-1] in 'aouAOU':
                ipa += 'x'
            else:
                ipa += 'ç'
            i += 2
            continue

        # ck
        if remaining.startswith('ck'):
            ipa += 'k'
            i += 2
            continue

        # ng
        if remaining.startswith('ng'):
            ipa += 'ŋ'
            i += 2
            continue

        # nk
        if remaining.startswith('nk'):
            ipa += 'ŋk'
            i += 2
            continue

        # ph
        if remaining.startswith('ph'):
            ipa += 'f'
            i += 2
            continue

        # th
        if remaining.startswith('th'):
            ipa += 't'
            i += 2
            continue

        # qu
        if remaining.startswith('qu'):
            ipa += 'kv'
            i += 2
            continue

        # Diphthongs
        # ei/ai → aɪ
        if remaining.startswith('ei') or remaining.startswith('ai'):
            ipa += 'aɪ'
            i += 2
            continue

        # eu/äu → ɔʏ
        if remaining.startswith('eu') or remaining.startswith('äu'):
            ipa += 'ɔʏ'
            i += 2
            continue

        # au → aʊ
        if remaining.startswith('au'):
            ipa += 'aʊ'
            i += 2
            continue

        # ie → iː
        if remaining.startswith('ie'):
            ipa += 'iː'
            i += 2
            continue

        # ee → eː
        if remaining.startswith('ee'):
            ipa += 'eː'
            i += 2
            continue

        # oo → oː
        if remaining.startswith('oo'):
            ipa += 'oː'
            i += 2
            continue

        # ah → aː
        if remaining.startswith('ah'):
            ipa += 'aː'
            i += 2
            continue

        # eh → eː
        if remaining.startswith('eh'):
            ipa += 'eː'
            i += 2
            continue

        # oh → oː
        if remaining.startswith('oh'):
            ipa += 'oː'
            i += 2
            continue

        # uh → uː
        if remaining.startswith('uh'):
            ipa += 'uː'
            i += 2
            continue

        # ih → iː
        if remaining.startswith('ih'):
            ipa += 'iː'
            i += 2
            continue

        # sp at word start → ʃp
        if remaining.startswith('sp') and i == 0:
            ipa += 'ʃp'
            i += 2
            continue

        # st at word start → ʃt
        if remaining.startswith('st') and i == 0:
            ipa += 'ʃt'
            i += 2
            continue

        # tz → ts
        if remaining.startswith('tz'):
            ipa += 'ts'
            i += 2
            continue

        # -tion → tsjoːn
        if remaining.startswith('tion') and i + 4 <= n:
            ipa += 'tsjoːn'
            i += 4
            continue

        # Final -er → ɐ
        if remaining == 'er':
            ipa += 'ɐ'
            i += 2
            continue

        # Final -en → ən
        if remaining == 'en':
            ipa += 'ən'
            i += 2
            continue

        # Final -el → əl
        if remaining == 'el':
            ipa += 'əl'
            i += 2
            continue

        # Final -em → əm
        if remaining == 'em':
            ipa += 'əm'
            i += 2
            continue

        # Final -e → ə
        if remaining == 'e':
            ipa += 'ə'
            i += 1
            continue

        # Single characters
        c = w[i]
        if c == 'ä':
            ipa += 'ɛ'
        elif c == 'ö':
            ipa += 'øː'
        elif c == 'ü':
            ipa += 'yː'
        elif c == 'ß':
            ipa += 's'
        elif c == 'z':
            ipa += 'ts'
        elif c == 'v':
            ipa += 'f'
        elif c == 'w':
            ipa += 'v'
        elif c == 'j':
            ipa += 'j'
        elif c == 'y':
            ipa += 'yː'
        elif c == 'x':
            ipa += 'ks'
        elif c == 'r':
            ipa += 'ʁ'
        elif c == 's':
            # s before vowel at start = z
            if i + 1 < n and w[i+1] in 'aeiouäöü' and (i == 0 or w[i-1] in ' \t'):
                ipa += 'z'
            elif i == 0 and i + 1 < n and w[i+1] in 'aeiouäöü':
                ipa += 'z'
            else:
                ipa += 's'
        elif c == 'd':
            # Final devoicing
            if i == n - 1 or (i + 1 < n and w[i+1] in ' \t'):
                ipa += 't'
            else:
                ipa += 'd'
        elif c == 'b':
            # Final devoicing
            if i == n - 1:
                ipa += 'p'
            else:
                ipa += 'b'
        elif c == 'g':
            # Final devoicing; -ig → ɪç
            if remaining == 'g' and i > 0 and w[i-1] == 'i':
                ipa = ipa[:-1]  # remove the 'ɪ' we already added
                ipa += 'ɪç'
            elif i == n - 1:
                ipa += 'k'
            else:
                ipa += 'g'
        elif c == 'a':
            ipa += 'a'
        elif c == 'e':
            ipa += 'ɛ'
        elif c == 'i':
            ipa += 'ɪ'
        elif c == 'o':
            ipa += 'ɔ'
        elif c == 'u':
            ipa += 'ʊ'
        elif c in 'bcfhklmnpt':
            ipa += c
        else:
            ipa += c

        i += 1

    return ipa


# ─── POS detection ───────────────────────────────────────────────────────────

FUNCTION_WORDS = {
    'der', 'die', 'das', 'den', 'dem', 'des',
    'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
    'mich', 'dich', 'sich', 'uns', 'euch',
    'mir', 'dir', 'ihm', 'ihnen',
    'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
    'meine', 'deine', 'seine', 'ihre', 'unsere',
    'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes',
    'welcher', 'welche', 'welches',
    'kein', 'keine', 'keinen', 'keinem',
}

NOUN_SUFFIXES = ['ung', 'heit', 'keit', 'schaft', 'nis', 'tum', 'ment', 'tion', 'ität', 'enz', 'anz', 'eur', 'eur']
ADJ_SUFFIXES = ['ig', 'lich', 'bar', 'los', 'sam', 'haft', 'isch', 'ell', 'iv']
PREP_SET = {
    'in', 'an', 'auf', 'für', 'mit', 'von', 'zu', 'bei', 'nach', 'über',
    'unter', 'vor', 'aus', 'durch', 'ohne', 'zwischen', 'neben', 'hinter',
    'gegen', 'um', 'bis', 'seit', 'während', 'wegen', 'trotz', 'statt',
    'außer', 'entlang', 'gegenüber', 'ab', 'innerhalb', 'außerhalb',
}


def detect_pos(word: str, original_token: str = '') -> str:
    """Detect part of speech for a German word."""
    w = word.lower()

    # Check common words first
    if w in COMMON_WORDS:
        return COMMON_WORDS[w][1]

    # Function words
    if w in FUNCTION_WORDS:
        return 'det' if w in {'der','die','das','den','dem','des','ein','eine','einen','einem','einer','eines','kein','keine','keinen','keinem','dieser','diese','dieses','jener','jene','jenes','welcher','welche','welches','mein','dein','sein','ihr','unser','euer','meine','deine','seine','ihre','unsere'} else 'pron'

    # Prepositions
    if w in PREP_SET:
        return 'prep'

    # Verb infinitive ending -en/-eln/-ern
    if w.endswith('en') and len(w) > 3:
        return 'v'
    if w.endswith('eln') or w.endswith('ern'):
        return 'v'

    # Noun suffixes
    for suf in NOUN_SUFFIXES:
        if w.endswith(suf) and len(w) > len(suf) + 1:
            return 'n'

    # Adjective suffixes
    for suf in ADJ_SUFFIXES:
        if w.endswith(suf) and len(w) > len(suf) + 1:
            return 'n' if suf in ('nis',) else 'adj'

    # Capitalized in original → noun (German nouns are capitalized)
    if original_token and original_token[0].isupper() and not original_token.isupper():
        # But skip if it's the first word of a sentence (we check this in caller)
        return 'n'

    # Past participles ge-...-t/ge-...-en
    if w.startswith('ge') and (w.endswith('t') or w.endswith('en')):
        return 'v'

    # Default
    return 'n'


# ─── Sentence alignment for translation ─────────────────────────────────────

def build_alignment_dict(cards):
    """Build word translation map from sentence pairs using co-occurrence."""
    # For each German word, count which English words co-occur
    from collections import Counter, defaultdict

    de_en_cooccur = defaultdict(Counter)
    en_words_per_card = []

    for card in cards:
        de_tokens = tokenize(card['target'])
        en_tokens = set(card['english'].lower().split())
        en_tokens = {re.sub(r'[^a-z\'-]', '', t) for t in en_tokens} - {''}
        en_words_per_card.append(en_tokens)

        for dt in de_tokens:
            for et in en_tokens:
                de_en_cooccur[dt][et] += 1

    # For each German word, find best English translation
    # Score by: co-occurrence count / total occurrences of english word
    en_total = Counter()
    for en_set in en_words_per_card:
        for e in en_set:
            en_total[e] += 1

    translations = {}
    for de_word, en_counts in de_en_cooccur.items():
        # Filter very common English words that don't help
        skip_en = {'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be',
                    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
                    'will', 'would', 'could', 'should', 'may', 'might', 'shall',
                    'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
                    'from', 'it', 'this', 'that', 'i', 'you', 'he', 'she', 'we',
                    'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
                    'and', 'or', 'but', 'not', 'no', "don't", "doesn't", "didn't",
                    "isn't", "aren't", "wasn't", "weren't", "won't", "wouldn't",
                    "couldn't", "shouldn't", "can't", "there", "here"}

        # Score each English candidate
        best_en = None
        best_score = 0
        for en_word, count in en_counts.most_common(20):
            if en_word in skip_en or len(en_word) < 2:
                continue
            # TF-IDF-like: high co-occurrence, but not too common overall
            score = count * count / (en_total[en_word] + 1)
            if score > best_score:
                best_score = score
                best_en = en_word

        if best_en and best_score > 0.5:
            translations[de_word] = best_en

    return translations


# ─── Tokenizer ───────────────────────────────────────────────────────────────

def tokenize(sentence: str) -> set:
    """Tokenize a German sentence into lowercase words."""
    # Remove punctuation, split by whitespace
    cleaned = re.sub(r'[.,!?;:"""«»()—–…\'\'`\-/\[\]{}0-9]', ' ', sentence)
    tokens = {t.lower().strip() for t in cleaned.split() if len(t.strip()) >= 2}
    return tokens


def tokenize_with_originals(sentence: str) -> list:
    """Tokenize preserving original casing for POS detection."""
    cleaned = re.sub(r'[.,!?;:"""«»()—–…\'\'`\-/\[\]{}]', ' ', sentence)
    return [t.strip() for t in cleaned.split() if len(t.strip()) >= 2]


# ─── Parse existing dictionary keys ─────────────────────────────────────────

def parse_existing_keys(dict_path: str) -> set:
    """Extract all keys from the existing de.ts DICT."""
    keys = set()
    with open(dict_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the DICT section
    dict_start = content.find("const DICT: Record<string, DictEntry> = {")
    if dict_start == -1:
        print("ERROR: Could not find DICT in de.ts")
        sys.exit(1)

    # Find closing }; after DICT
    # We need to find the matching closing brace
    brace_count = 0
    dict_section = ''
    started = False
    for i in range(dict_start, len(content)):
        if content[i] == '{':
            brace_count += 1
            started = True
        elif content[i] == '}':
            brace_count -= 1
        if started:
            dict_section += content[i]
        if started and brace_count == 0:
            break

    # Extract keys: 'key': { ... }, "key": { ... }, or bare key: { ... }
    for m in re.finditer(r"'([^']+)':\s*\{", dict_section):
        keys.add(m.group(1))
    for m in re.finditer(r'"([^"]+)":\s*\{', dict_section):
        keys.add(m.group(1))
    # Bare identifier keys (no quotes)
    for m in re.finditer(r'^\s+(\w+):\s*\{', dict_section, re.MULTILINE):
        keys.add(m.group(1))

    return keys


# Also parse IRREGULAR_MAP and CONTRACTION_MAP keys as "covered"
def parse_map_keys(dict_path: str) -> set:
    """Extract all keys from IRREGULAR_MAP and CONTRACTION_MAP."""
    keys = set()
    with open(dict_path, 'r', encoding='utf-8') as f:
        content = f.read()

    for map_name in ['CONTRACTION_MAP', 'IRREGULAR_MAP']:
        start = content.find(f"const {map_name}")
        if start == -1:
            continue
        brace_count = 0
        section = ''
        started = False
        for i in range(start, len(content)):
            if content[i] == '{':
                brace_count += 1
                started = True
            elif content[i] == '}':
                brace_count -= 1
            if started:
                section += content[i]
            if started and brace_count == 0:
                break

        for m in re.finditer(r"'([^']+)':", section):
            keys.add(m.group(1))

    return keys


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=== German Dictionary Expansion ===\n")

    # 1. Load deck
    with open(DECK_PATH, 'r', encoding='utf-8') as f:
        cards = json.load(f)
    print(f"Loaded {len(cards)} cards from deck.json")

    # 2. Tokenize all target sentences
    all_words = set()
    word_originals = {}  # lowercase -> set of original forms (for POS)
    word_is_sentence_start = set()  # words that only appear at sentence start

    for card in cards:
        tokens_orig = tokenize_with_originals(card['target'])
        for idx, tok in enumerate(tokens_orig):
            low = tok.lower()
            if len(low) < 2:
                continue
            # Skip pure numbers
            if re.match(r'^\d+$', low):
                continue
            all_words.add(low)
            if low not in word_originals:
                word_originals[low] = set()
            word_originals[low].add(tok)

            # Track sentence-start words (after . ! ? or first token)
            # Simple heuristic: first token in the target string
            if idx == 0:
                word_is_sentence_start.add(low)

    print(f"Found {len(all_words)} unique words in deck")

    # 3. Parse existing dictionary
    existing_keys = parse_existing_keys(DICT_PATH)
    map_keys = parse_map_keys(DICT_PATH)
    all_covered = existing_keys | map_keys
    print(f"Existing dictionary: {len(existing_keys)} entries")
    print(f"Irregular/contraction maps: {len(map_keys)} forms")

    # 4. Find missing words
    missing = all_words - all_covered
    # Also check if word can be resolved by the lookupWord logic (suffix stripping etc)
    # We approximate this: strip common endings and check
    still_missing = set()
    for w in missing:
        found = False
        # Check suffix stripping would find it
        for suffix in ['en', 'er', 'em', 'es', 'e', 'n', 's', 'st', 'et', 'te', 'tet', 'ten', 'test']:
            if w.endswith(suffix) and len(w) > len(suffix) + 2:
                stem = w[:len(w)-len(suffix)]
                if stem in all_covered:
                    found = True
                    break
                # Try adding -en for verb
                if stem + 'en' in all_covered:
                    found = True
                    break
                if stem + 'ern' in all_covered:
                    found = True
                    break
                if stem + 'eln' in all_covered:
                    found = True
                    break

        # Umlaut reduction
        if not found:
            de_uml = w.replace('ä', 'a').replace('ö', 'o').replace('ü', 'u')
            if de_uml != w and de_uml in all_covered:
                found = True
            if not found and de_uml != w:
                for suffix in ['er', 'e', 'en', 'n']:
                    if de_uml.endswith(suffix) and len(de_uml) > len(suffix) + 2:
                        stem = de_uml[:len(de_uml)-len(suffix)]
                        if stem in all_covered:
                            found = True
                            break

        # ge- prefix (past participle) → try infinitive
        if not found and w.startswith('ge'):
            base = w[2:]
            if base.endswith('t') and base[:-1] + 'en' in all_covered:
                found = True
            elif base.endswith('en') and base in all_covered:
                found = True
            elif base + 'en' in all_covered:
                found = True

        # Compound word splitting
        if not found:
            for split_pos in range(3, len(w) - 2):
                right = w[split_pos:]
                if right in all_covered:
                    found = True
                    break
                # linking s
                if right.startswith('s') and right[1:] in all_covered:
                    found = True
                    break
                if right.startswith('n') and right[1:] in all_covered:
                    found = True
                    break

        if not found:
            still_missing.add(w)

    print(f"Missing words (after morph analysis): {len(still_missing)}")

    # 5. Build alignment-based translations
    alignment_trans = build_alignment_dict(cards)
    print(f"Alignment translations available: {len(alignment_trans)}")

    # 5b. Build a map: word -> set of positions it appears at (0=start, 1+=mid)
    word_positions = {}
    for card in cards:
        toks = tokenize_with_originals(card['target'])
        for idx, tok in enumerate(toks):
            low = tok.lower()
            if low not in word_positions:
                word_positions[low] = {'start': False, 'mid_upper': False}
            if idx == 0:
                word_positions[low]['start'] = True
            elif tok[0].isupper():
                word_positions[low]['mid_upper'] = True

    # 6. Generate entries for missing words
    new_entries = {}
    for word in sorted(still_missing):
        # SKIP if already in existing dictionary (double-check)
        if word in existing_keys:
            continue

        # Get original forms for POS detection
        originals = word_originals.get(word, {word})

        # Determine if capitalized mid-sentence → noun
        wp = word_positions.get(word, {})
        is_capitalized = wp.get('mid_upper', False)

        # POS
        if word in COMMON_WORDS:
            pos = COMMON_WORDS[word][1]
        else:
            pos = detect_pos(word, list(originals)[0] if originals else '')
            if is_capitalized:
                pos = 'n'

        # Translation
        if word in COMMON_WORDS:
            en_trans = COMMON_WORDS[word][0]
        elif word in alignment_trans:
            en_trans = alignment_trans[word]
        else:
            en_trans = word  # fallback: use German word itself

        # IPA
        ipa = german_ipa(word)

        new_entries[word] = {
            'en': en_trans,
            'ipa': ipa,
            'pos': pos,
        }

    print(f"\nGenerated {len(new_entries)} new entries")

    # 7. Write to de.ts - insert before closing };
    with open(DICT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the closing }; of DICT (line 7625 area)
    # We look for the pattern: last entry line followed by };
    # Strategy: find "const DICT" section, then find its closing };
    dict_start = content.find("const DICT: Record<string, DictEntry> = {")
    brace_count = 0
    dict_end = -1
    started = False
    for i in range(dict_start, len(content)):
        if content[i] == '{':
            brace_count += 1
            started = True
        elif content[i] == '}':
            brace_count -= 1
        if started and brace_count == 0:
            dict_end = i  # position of closing }
            break

    if dict_end == -1:
        print("ERROR: Could not find end of DICT")
        sys.exit(1)

    # Build new entries text -- final dedup against existing keys
    lines = []
    for word in sorted(new_entries.keys()):
        if word in existing_keys:
            continue
        entry = new_entries[word]
        en = entry['en'].replace("'", "\\'")
        ipa = entry['ipa'].replace("'", "\\'")
        pos = entry['pos']
        # Use single quotes for key unless it contains apostrophe
        if "'" in word:
            key_str = f'"{word}"'
        else:
            key_str = f"'{word}'"
        lines.append(f"  {key_str}: {{ en: '{en}', ipa: '{ipa}', pos: '{pos}' }},")

    insert_text = '\n'.join(lines) + '\n'

    # Insert before closing }
    new_content = content[:dict_end] + insert_text + content[dict_end:]

    with open(DICT_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 8. Report
    final_count = len(existing_keys) + len(new_entries)
    total_words = len(all_words)
    # Recalculate coverage considering morphological analysis
    covered_after = total_words - len(still_missing) + len(new_entries)
    coverage = covered_after / total_words * 100 if total_words > 0 else 0

    print(f"\n=== Results ===")
    print(f"New entries added:    {len(new_entries)}")
    print(f"Previous dict size:  {len(existing_keys)}")
    print(f"New dict size:       {final_count}")
    print(f"Total unique words:  {total_words}")
    print(f"Coverage (direct+morph): {coverage:.1f}%")
    print(f"\nDictionary updated: {DICT_PATH}")


if __name__ == '__main__':
    main()
