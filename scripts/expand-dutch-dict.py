#!/usr/bin/env python3
"""
Expand the Dutch dictionary (nl.ts) to cover all words from deck.json.

1. Reads deck.json → tokenizes all `target` sentences
2. Reads existing nl.ts dictionary entries
3. For each MISSING word, generates: en, ipa, pos
4. Appends new entries to nl.ts
"""

import json
import re
import sys
from pathlib import Path
from collections import Counter, defaultdict

BASE = Path(__file__).resolve().parent.parent
DECK_PATH = BASE / "src" / "data" / "dutch" / "deck.json"
DICT_PATH = BASE / "src" / "data" / "dictionary" / "nl.ts"

# ─── Step 1: Parse existing dictionary keys from nl.ts ───────────────

def parse_existing_keys(text: str) -> set:
    """Extract all dictionary keys from nl.ts (both IRREGULAR_MAP and dictionary)."""
    keys = set()
    # Match 'word': patterns (both in IRREGULAR_MAP and dictionary)
    for m in re.finditer(r"'([^']+)'\s*:", text):
        keys.add(m.group(1).lower())
    # Also match "word": patterns (double-quoted keys)
    for m in re.finditer(r'"([^"]+)"\s*:', text):
        keys.add(m.group(1).lower())
    return keys

# ─── Step 2: Tokenize deck sentences ────────────────────────────────

def tokenize(sentence: str) -> list:
    """Lowercase, strip punctuation, split into words."""
    s = sentence.lower()
    s = re.sub(r"[¿¡.,!?;:\"\"\"''()—–«»/\d]", " ", s)
    return [w.strip() for w in s.split() if w.strip() and len(w.strip()) > 0]

# ─── Step 3: Dutch IPA generation ───────────────────────────────────

def dutch_ipa(word: str) -> str:
    """Generate approximate Dutch IPA for a word."""
    w = word.lower()
    ipa = ""
    i = 0
    n = len(w)

    while i < n:
        # Try longest match first (3 chars, 2 chars, 1 char)

        # 3-char sequences
        if i + 2 < n:
            tri = w[i:i+3]
            if tri == "sch":
                ipa += "sx"; i += 3; continue
            if tri == "oei":
                ipa += "ui"; i += 3; continue
            if tri == "ieu":
                ipa += "iu"; i += 3; continue
            if tri == "aai":
                ipa += "aːi"; i += 3; continue
            if tri == "ooi":
                ipa += "oːi"; i += 3; continue
            if tri == "eeu":
                ipa += "eːu"; i += 3; continue

        # 2-char sequences
        if i + 1 < n:
            di = w[i:i+2]
            if di == "aa":
                ipa += "aː"; i += 2; continue
            if di == "ee":
                ipa += "eː"; i += 2; continue
            if di == "oo":
                ipa += "oː"; i += 2; continue
            if di == "uu":
                ipa += "yː"; i += 2; continue
            if di == "ie":
                ipa += "i"; i += 2; continue
            if di == "oe":
                ipa += "u"; i += 2; continue
            if di == "eu":
                ipa += "øː"; i += 2; continue
            if di in ("ij", "ei"):
                ipa += "ɛi"; i += 2; continue
            if di == "ui":
                ipa += "œy"; i += 2; continue
            if di in ("ou", "au"):
                ipa += "ɑu"; i += 2; continue
            if di == "ch":
                ipa += "x"; i += 2; continue
            if di == "ng":
                ipa += "ŋ"; i += 2; continue
            if di == "nk":
                ipa += "ŋk"; i += 2; continue
            if di == "th":
                ipa += "t"; i += 2; continue
            if di == "ph":
                ipa += "f"; i += 2; continue
            if di == "dt":
                ipa += "t"; i += 2; continue

        # Single chars
        c = w[i]
        mapping = {
            'a': 'ɑ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɔ', 'u': 'ʏ',
            'g': 'ɣ', 'v': 'v', 'w': 'ʋ', 'j': 'j',
            'y': 'i', 'c': 'k', 'q': 'k', 'x': 'ks',
            'b': 'b', 'd': 'd', 'f': 'f', 'h': 'ɦ',
            'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n',
            'p': 'p', 'r': 'r', 's': 's', 't': 't',
            'z': 'z',
        }
        ipa += mapping.get(c, c)
        i += 1

    # Post-processing
    # Final -en → ən
    if ipa.endswith("ɛn"):
        ipa = ipa[:-2] + "ən"
    # -lijk → lək
    ipa = re.sub(r"lɛik$", "lək", ipa)
    ipa = re.sub(r"ləik$", "lək", ipa)

    return ipa

# ─── Step 4: POS detection ──────────────────────────────────────────

FUNCTION_WORDS = {
    # Determiners
    'de': 'det', 'het': 'det', 'een': 'det', 'dit': 'det', 'dat': 'det',
    'deze': 'det', 'die': 'det', 'elk': 'det', 'elke': 'det',
    'alle': 'det', 'geen': 'det', 'ieder': 'det', 'iedere': 'det',
    'welk': 'det', 'welke': 'det', 'enig': 'det', 'enige': 'det',
    'sommige': 'det', 'beide': 'det', 'zulke': 'det',
    # Pronouns
    'ik': 'pron', 'jij': 'pron', 'je': 'pron', 'hij': 'pron', 'zij': 'pron',
    'ze': 'pron', 'wij': 'pron', 'we': 'pron', 'jullie': 'pron', 'u': 'pron',
    'mij': 'pron', 'me': 'pron', 'hem': 'pron', 'haar': 'pron', 'ons': 'pron',
    'hen': 'pron', 'hun': 'pron', 'zich': 'pron', 'zelf': 'pron',
    'mijn': 'pron', 'jouw': 'pron', 'zijn': 'pron', 'onze': 'pron',
    'wie': 'pron', 'wat': 'pron', 'waar': 'pron', 'iets': 'pron',
    'niets': 'pron', 'iemand': 'pron', 'niemand': 'pron', 'alles': 'pron',
    'elkaar': 'pron', 'men': 'pron', 'zichzelf': 'pron',
    # Prepositions
    'in': 'prep', 'op': 'prep', 'met': 'prep', 'voor': 'prep', 'van': 'prep',
    'aan': 'prep', 'naar': 'prep', 'over': 'prep', 'uit': 'prep', 'bij': 'prep',
    'door': 'prep', 'om': 'prep', 'tot': 'prep', 'na': 'prep', 'onder': 'prep',
    'tegen': 'prep', 'tussen': 'prep', 'achter': 'prep', 'langs': 'prep',
    'zonder': 'prep', 'sinds': 'prep', 'tijdens': 'prep', 'vanaf': 'prep',
    'volgens': 'prep', 'rondom': 'prep', 'richting': 'prep', 'buiten': 'prep',
    'binnen': 'prep', 'naast': 'prep', 'boven': 'prep', 'beneden': 'prep',
    'rond': 'prep', 'voorbij': 'prep', 'behalve': 'prep', 'ondanks': 'prep',
    # Conjunctions
    'en': 'conj', 'maar': 'conj', 'of': 'conj', 'want': 'conj', 'dus': 'conj',
    'omdat': 'conj', 'als': 'conj', 'dan': 'conj', 'toen': 'conj',
    'terwijl': 'conj', 'hoewel': 'conj', 'voordat': 'conj', 'nadat': 'conj',
    'totdat': 'conj', 'zodra': 'conj', 'tenzij': 'conj', 'indien': 'conj',
    'doordat': 'conj', 'opdat': 'conj', 'noch': 'conj', 'zowel': 'conj',
    'zodat': 'conj', 'aangezien': 'conj', 'mits': 'conj', 'ofwel': 'conj',
    # Adverbs (common)
    'niet': 'adv', 'ook': 'adv', 'al': 'adv', 'nog': 'adv', 'wel': 'adv',
    'er': 'adv', 'hier': 'adv', 'daar': 'adv', 'nu': 'adv', 'toen': 'adv',
    'altijd': 'adv', 'nooit': 'adv', 'vaak': 'adv', 'soms': 'adv',
    'heel': 'adv', 'erg': 'adv', 'zo': 'adv', 'hoe': 'adv', 'waarom': 'adv',
    'wanneer': 'adv', 'toch': 'adv', 'misschien': 'adv', 'graag': 'adv',
    'samen': 'adv', 'weer': 'adv', 'steeds': 'adv', 'reeds': 'adv',
    'bijna': 'adv', 'slechts': 'adv', 'zelfs': 'adv', 'pas': 'adv',
    'ooit': 'adv', 'eerder': 'adv', 'later': 'adv', 'daarna': 'adv',
    'daarom': 'adv', 'daarbij': 'adv', 'immers': 'adv', 'overigens': 'adv',
    'trouwens': 'adv', 'eigenlijk': 'adv', 'natuurlijk': 'adv',
    'inderdaad': 'adv', 'helaas': 'adv', 'gelukkig': 'adv',
    'bovendien': 'adv', 'echter': 'adv', 'verder': 'adv', 'direct': 'adv',
    'opeens': 'adv', 'echt': 'adv', 'best': 'adv', 'vast': 'adv',
    'zeker': 'adv', 'precies': 'adv', 'ongeveer': 'adv', 'al': 'adv',
    'juist': 'adv', 'alleen': 'adv', 'liever': 'adv', 'vooral': 'adv',
    'net': 'adv', 'even': 'adv', 'gewoon': 'adv',
    # Interjections
    'ja': 'interj', 'nee': 'interj', 'hallo': 'interj', 'alsjeblieft': 'interj',
    'dank': 'interj', 'hoi': 'interj', 'dag': 'interj', 'welkom': 'interj',
    'sorry': 'interj', 'pardon': 'interj',
    # Particles / Other
    'te': 'part', 'er': 'part', 'daar': 'part', 'hier': 'part',
}

def detect_pos(word: str) -> str:
    """Detect part of speech from Dutch word morphology."""
    w = word.lower()

    # Check function words first
    if w in FUNCTION_WORDS:
        return FUNCTION_WORDS[w]

    # Verb infinitives (ending in -en, -n after vowels)
    if w.endswith('en') and len(w) > 3:
        return 'v'
    if w.endswith('ën') and len(w) > 3:
        return 'v'

    # Noun suffixes
    noun_suffixes = [
        'heid', 'nis', 'tie', 'ing', 'ment', 'schap', 'dom', 'isme', 'ist',
        'teit', 'uur', 'atie', 'ering', 'eling', 'sel', 'aard', 'erd',
        'ster', 'eur', 'ier', 'aar', 'ent', 'ant', 'age', 'iek', 'theek',
    ]
    for suf in noun_suffixes:
        if w.endswith(suf) and len(w) > len(suf) + 1:
            return 'n'

    # Adjective suffixes
    adj_suffixes = ['ig', 'lijk', 'baar', 'loos', 'vol', 'achtig', 'zaam', 'erig']
    for suf in adj_suffixes:
        if w.endswith(suf) and len(w) > len(suf) + 1:
            return 'adj'

    # Adverb
    if w.endswith('lings') or w.endswith('waarts') or w.endswith('halve'):
        return 'adv'

    # Ordinal numbers
    if w.endswith('ste') or w.endswith('de') and w[:-2].isdigit():
        return 'num'

    # Plural nouns ending in -s or -en (after removing other matches)
    if w.endswith('s') and len(w) > 3 and not w.endswith('ens'):
        return 'n'

    # Default: noun (most open-class words in Dutch are nouns)
    return 'n'

# ─── Step 5: Translation via co-occurrence ──────────────────────────

# Hardcoded map of ~500 most common Dutch words
COMMON_NL = {
    'hallo': 'hello', 'goedemorgen': 'good morning', 'goedemiddag': 'good afternoon',
    'goedenavond': 'good evening', 'goedenacht': 'good night', 'welkom': 'welcome',
    'dag': 'day, goodbye', 'hoi': 'hi', 'doei': 'bye', 'tot': 'until, to',
    'ziens': 'seeing', 'alsjeblieft': 'please', 'dankjewel': 'thank you',
    'dankuwel': 'thank you (formal)', 'bedankt': 'thanks', 'ja': 'yes', 'nee': 'no',
    'goed': 'good', 'slecht': 'bad', 'groot': 'big', 'klein': 'small',
    'mooi': 'beautiful', 'lelijk': 'ugly', 'oud': 'old', 'nieuw': 'new',
    'jong': 'young', 'lang': 'long, tall', 'kort': 'short', 'dik': 'thick, fat',
    'dun': 'thin', 'warm': 'warm', 'koud': 'cold', 'heet': 'hot',
    'droog': 'dry', 'nat': 'wet', 'hard': 'hard, loud', 'zacht': 'soft',
    'snel': 'fast', 'langzaam': 'slow', 'stil': 'quiet', 'luid': 'loud',
    'donker': 'dark', 'licht': 'light', 'zwaar': 'heavy', 'makkelijk': 'easy',
    'moeilijk': 'difficult', 'duur': 'expensive', 'goedkoop': 'cheap',
    'rijk': 'rich', 'arm': 'poor', 'sterk': 'strong', 'zwak': 'weak',
    'ziek': 'sick', 'gezond': 'healthy', 'blij': 'happy', 'verdrietig': 'sad',
    'boos': 'angry', 'bang': 'afraid', 'moe': 'tired', 'wakker': 'awake',
    'klaar': 'ready', 'vol': 'full', 'leeg': 'empty', 'open': 'open',
    'dicht': 'closed', 'vrij': 'free', 'druk': 'busy', 'rustig': 'calm',
    'schoon': 'clean', 'vies': 'dirty', 'breed': 'wide', 'smal': 'narrow',
    'diep': 'deep', 'hoog': 'high', 'laag': 'low', 'rond': 'round',
    'plat': 'flat', 'recht': 'straight', 'krom': 'crooked',
    # Nouns - people
    'man': 'man', 'vrouw': 'woman', 'kind': 'child', 'kinderen': 'children',
    'jongen': 'boy', 'meisje': 'girl', 'baby': 'baby', 'vriend': 'friend',
    'vriendin': 'girlfriend, female friend', 'buur': 'neighbor', 'buurman': 'neighbor (male)',
    'buurvrouw': 'neighbor (female)', 'collega': 'colleague', 'baas': 'boss',
    'leraar': 'teacher (m)', 'lerares': 'teacher (f)', 'student': 'student',
    'leerling': 'pupil', 'dokter': 'doctor', 'arts': 'physician',
    'verpleegster': 'nurse', 'kok': 'cook', 'agent': 'police officer',
    'vader': 'father', 'moeder': 'mother', 'broer': 'brother', 'zus': 'sister',
    'zoon': 'son', 'dochter': 'daughter', 'opa': 'grandfather', 'oma': 'grandmother',
    'oom': 'uncle', 'tante': 'aunt', 'neef': 'nephew, cousin', 'nicht': 'niece, cousin',
    'ouders': 'parents', 'familie': 'family', 'gezin': 'family (household)',
    # Nouns - places
    'huis': 'house', 'woning': 'dwelling', 'kamer': 'room', 'slaapkamer': 'bedroom',
    'badkamer': 'bathroom', 'keuken': 'kitchen', 'woonkamer': 'living room',
    'tuin': 'garden', 'straat': 'street', 'weg': 'road, away', 'plein': 'square',
    'park': 'park', 'stad': 'city', 'dorp': 'village', 'land': 'country, land',
    'school': 'school', 'universiteit': 'university', 'ziekenhuis': 'hospital',
    'winkel': 'shop', 'supermarkt': 'supermarket', 'markt': 'market',
    'restaurant': 'restaurant', 'station': 'station', 'vliegveld': 'airport',
    'haven': 'harbor', 'strand': 'beach', 'bos': 'forest', 'berg': 'mountain',
    'rivier': 'river', 'zee': 'sea', 'meer': 'lake, more', 'eiland': 'island',
    'kantoor': 'office', 'fabriek': 'factory', 'kerk': 'church', 'museum': 'museum',
    'theater': 'theater', 'bioscoop': 'cinema', 'bibliotheek': 'library',
    'apotheek': 'pharmacy', 'politiebureau': 'police station',
    # Nouns - things
    'tafel': 'table', 'stoel': 'chair', 'bed': 'bed', 'deur': 'door',
    'raam': 'window', 'muur': 'wall', 'vloer': 'floor', 'trap': 'stairs',
    'auto': 'car', 'fiets': 'bicycle', 'trein': 'train', 'bus': 'bus',
    'vliegtuig': 'airplane', 'boot': 'boat', 'schip': 'ship',
    'boek': 'book', 'brief': 'letter', 'krant': 'newspaper', 'tijdschrift': 'magazine',
    'telefoon': 'telephone', 'computer': 'computer', 'sleutel': 'key',
    'geld': 'money', 'tas': 'bag', 'koffer': 'suitcase', 'jas': 'coat',
    'broek': 'pants', 'schoen': 'shoe', 'schoenen': 'shoes', 'jurk': 'dress',
    'overhemd': 'shirt', 'rok': 'skirt',
    # Nouns - food/drink
    'eten': 'to eat, food', 'drinken': 'to drink', 'water': 'water',
    'melk': 'milk', 'koffie': 'coffee', 'thee': 'tea', 'bier': 'beer',
    'wijn': 'wine', 'sap': 'juice', 'brood': 'bread', 'kaas': 'cheese',
    'boter': 'butter', 'ei': 'egg', 'eieren': 'eggs', 'vlees': 'meat',
    'vis': 'fish', 'groente': 'vegetable', 'fruit': 'fruit', 'appel': 'apple',
    'sinaasappel': 'orange', 'aardappel': 'potato', 'rijst': 'rice',
    'pasta': 'pasta', 'soep': 'soup', 'salade': 'salad', 'taart': 'cake',
    'koekje': 'cookie', 'chocolade': 'chocolate', 'ijs': 'ice, ice cream',
    'suiker': 'sugar', 'zout': 'salt', 'peper': 'pepper',
    # Nouns - time
    'tijd': 'time', 'uur': 'hour', 'minuut': 'minute', 'seconde': 'second',
    'dag': 'day', 'week': 'week', 'maand': 'month', 'jaar': 'year',
    'ochtend': 'morning', 'middag': 'afternoon', 'avond': 'evening', 'nacht': 'night',
    'vandaag': 'today', 'morgen': 'tomorrow', 'gisteren': 'yesterday',
    'maandag': 'Monday', 'dinsdag': 'Tuesday', 'woensdag': 'Wednesday',
    'donderdag': 'Thursday', 'vrijdag': 'Friday', 'zaterdag': 'Saturday',
    'zondag': 'Sunday', 'lente': 'spring', 'zomer': 'summer', 'herfst': 'autumn',
    'winter': 'winter', 'verjaardag': 'birthday', 'vakantie': 'vacation',
    'feest': 'party', 'weekend': 'weekend',
    # Nouns - nature/weather
    'zon': 'sun', 'maan': 'moon', 'ster': 'star', 'lucht': 'air, sky',
    'wolk': 'cloud', 'regen': 'rain', 'sneeuw': 'snow', 'wind': 'wind',
    'storm': 'storm', 'onweer': 'thunderstorm', 'donder': 'thunder',
    'bliksem': 'lightning', 'mist': 'fog', 'ijs': 'ice',
    'bloem': 'flower', 'boom': 'tree', 'gras': 'grass', 'blad': 'leaf',
    'dier': 'animal', 'hond': 'dog', 'kat': 'cat', 'paard': 'horse',
    'koe': 'cow', 'varken': 'pig', 'kip': 'chicken', 'vogel': 'bird',
    # Nouns - abstract
    'naam': 'name', 'taal': 'language', 'woord': 'word', 'zin': 'sentence',
    'vraag': 'question', 'antwoord': 'answer', 'probleem': 'problem',
    'oplossing': 'solution', 'idee': 'idea', 'plan': 'plan', 'doel': 'goal',
    'reden': 'reason', 'kans': 'chance', 'geluk': 'happiness, luck',
    'liefde': 'love', 'vrede': 'peace', 'oorlog': 'war', 'vrijheid': 'freedom',
    'gezondheid': 'health', 'leven': 'life', 'dood': 'death', 'werk': 'work',
    'baan': 'job', 'les': 'lesson', 'ervaring': 'experience', 'kennis': 'knowledge',
    'informatie': 'information', 'nieuws': 'news', 'verhaal': 'story',
    'geschiedenis': 'history', 'cultuur': 'culture', 'kunst': 'art',
    'muziek': 'music', 'sport': 'sport', 'spel': 'game', 'reis': 'journey',
    # Verbs (infinitives)
    'zijn': 'to be', 'hebben': 'to have', 'worden': 'to become',
    'kunnen': 'can, to be able to', 'moeten': 'must, to have to',
    'willen': 'to want', 'zullen': 'shall, will', 'mogen': 'may, to be allowed',
    'gaan': 'to go', 'komen': 'to come', 'doen': 'to do', 'maken': 'to make',
    'zien': 'to see', 'kijken': 'to look', 'horen': 'to hear',
    'spreken': 'to speak', 'praten': 'to talk', 'zeggen': 'to say',
    'vertellen': 'to tell', 'lezen': 'to read', 'schrijven': 'to write',
    'leren': 'to learn', 'studeren': 'to study', 'werken': 'to work',
    'spelen': 'to play', 'wonen': 'to live', 'leven': 'to live',
    'slapen': 'to sleep', 'eten': 'to eat', 'drinken': 'to drink',
    'koken': 'to cook', 'lopen': 'to walk', 'rijden': 'to drive',
    'fietsen': 'to cycle', 'vliegen': 'to fly', 'zwemmen': 'to swim',
    'rennen': 'to run', 'zitten': 'to sit', 'staan': 'to stand',
    'liggen': 'to lie down', 'vallen': 'to fall', 'geven': 'to give',
    'nemen': 'to take', 'brengen': 'to bring', 'halen': 'to fetch',
    'kopen': 'to buy', 'verkopen': 'to sell', 'betalen': 'to pay',
    'zoeken': 'to search', 'vinden': 'to find', 'weten': 'to know',
    'kennen': 'to know (person)', 'denken': 'to think', 'geloven': 'to believe',
    'voelen': 'to feel', 'hopen': 'to hope', 'wensen': 'to wish',
    'proberen': 'to try', 'helpen': 'to help', 'beginnen': 'to begin',
    'eindigen': 'to end', 'stoppen': 'to stop', 'wachten': 'to wait',
    'reizen': 'to travel', 'bezoeken': 'to visit', 'ontmoeten': 'to meet',
    'trouwen': 'to marry', 'scheiden': 'to divorce', 'verhuizen': 'to move house',
    'bellen': 'to call', 'sturen': 'to send', 'ontvangen': 'to receive',
    'kiezen': 'to choose', 'beslissen': 'to decide', 'vergeten': 'to forget',
    'herinneren': 'to remember', 'begrijpen': 'to understand',
    'uitleggen': 'to explain', 'vertalen': 'to translate',
    'luisteren': 'to listen', 'klagen': 'to complain', 'lachen': 'to laugh',
    'huilen': 'to cry', 'zingen': 'to sing', 'dansen': 'to dance',
    'tekenen': 'to draw', 'schilderen': 'to paint', 'bouwen': 'to build',
    'breken': 'to break', 'repareren': 'to repair', 'schoonmaken': 'to clean',
    'wassen': 'to wash', 'opruimen': 'to tidy up', 'wandelen': 'to walk, hike',
    'pakken': 'to grab', 'gooien': 'to throw', 'trekken': 'to pull',
    'duwen': 'to push', 'draaien': 'to turn', 'openen': 'to open',
    'sluiten': 'to close', 'vullen': 'to fill',
    # Numbers
    'nul': 'zero', 'een': 'one', 'twee': 'two', 'drie': 'three',
    'vier': 'four', 'vijf': 'five', 'zes': 'six', 'zeven': 'seven',
    'acht': 'eight', 'negen': 'nine', 'tien': 'ten', 'elf': 'eleven',
    'twaalf': 'twelve', 'dertien': 'thirteen', 'veertien': 'fourteen',
    'vijftien': 'fifteen', 'zestien': 'sixteen', 'zeventien': 'seventeen',
    'achttien': 'eighteen', 'negentien': 'nineteen', 'twintig': 'twenty',
    'dertig': 'thirty', 'veertig': 'forty', 'vijftig': 'fifty',
    'zestig': 'sixty', 'zeventig': 'seventy', 'tachtig': 'eighty',
    'negentig': 'ninety', 'honderd': 'hundred', 'duizend': 'thousand',
    'miljoen': 'million', 'eerste': 'first', 'tweede': 'second',
    'derde': 'third', 'vierde': 'fourth', 'vijfde': 'fifth',
    # Colors
    'rood': 'red', 'blauw': 'blue', 'groen': 'green', 'geel': 'yellow',
    'wit': 'white', 'zwart': 'black', 'grijs': 'gray', 'bruin': 'brown',
    'oranje': 'orange', 'roze': 'pink', 'paars': 'purple',
    # Body
    'hoofd': 'head', 'gezicht': 'face', 'oog': 'eye', 'ogen': 'eyes',
    'oor': 'ear', 'neus': 'nose', 'mond': 'mouth', 'tand': 'tooth',
    'lip': 'lip', 'tong': 'tongue', 'haar': 'hair', 'hand': 'hand',
    'vinger': 'finger', 'arm': 'arm', 'been': 'leg', 'voet': 'foot',
    'knie': 'knee', 'rug': 'back', 'buik': 'belly', 'hart': 'heart',
    'hersenen': 'brain', 'bloed': 'blood', 'huid': 'skin',
    # Additional common words
    'heel': 'very, whole', 'erg': 'very, bad', 'veel': 'much, many',
    'weinig': 'little, few', 'meer': 'more', 'minder': 'less', 'meest': 'most',
    'minst': 'least', 'ander': 'other', 'andere': 'other', 'anders': 'otherwise',
    'dezelfde': 'the same', 'eigen': 'own', 'enkel': 'only, single',
    'enkele': 'some, a few', 'genoeg': 'enough', 'te': 'too, to',
    'nog': 'still, yet', 'al': 'already', 'pas': 'just, only',
    'ooit': 'ever', 'nooit': 'never', 'altijd': 'always', 'vaak': 'often',
    'soms': 'sometimes', 'zelden': 'rarely',
    'hier': 'here', 'daar': 'there', 'ergens': 'somewhere',
    'nergens': 'nowhere', 'overal': 'everywhere',
    'nu': 'now', 'straks': 'soon, later', 'later': 'later',
    'vroeger': 'earlier, formerly', 'meteen': 'immediately',
    'thuis': 'at home', 'weg': 'away, road', 'terug': 'back',
    'samen': 'together', 'alleen': 'alone, only', 'bijna': 'almost',
    'ongeveer': 'approximately', 'precies': 'exactly', 'zeker': 'certainly',
    'misschien': 'maybe', 'waarschijnlijk': 'probably', 'hopelijk': 'hopefully',
    'natuurlijk': 'naturally, of course', 'eigenlijk': 'actually',
    'helaas': 'unfortunately', 'gelukkig': 'fortunately, happy',
    'dus': 'so, therefore', 'toch': 'yet, still', 'zelfs': 'even',
    'juist': 'correct, precisely', 'inderdaad': 'indeed',
    # Misc high-frequency
    'hoe': 'how', 'wat': 'what', 'wie': 'who', 'waar': 'where',
    'wanneer': 'when', 'waarom': 'why', 'welk': 'which',
    'hoeveel': 'how much, how many',
    'manier': 'way, manner', 'keer': 'time (occasion)', 'plaats': 'place',
    'punt': 'point', 'deel': 'part', 'kant': 'side', 'stuk': 'piece',
    'ding': 'thing', 'groep': 'group', 'soort': 'kind, sort',
    'voorbeeld': 'example', 'moment': 'moment', 'begin': 'beginning',
    'einde': 'end', 'kant': 'side', 'vorm': 'form, shape',
    'aantal': 'number, amount', 'resultaat': 'result',
    'verschil': 'difference', 'verband': 'connection',
    'belang': 'importance, interest', 'effect': 'effect',
    'invloed': 'influence', 'rol': 'role', 'taak': 'task',
    'niveau': 'level', 'waarde': 'value', 'kwaliteit': 'quality',
    'situatie': 'situation', 'positie': 'position', 'richting': 'direction',
    'periode': 'period', 'proces': 'process', 'systeem': 'system',
    'project': 'project', 'programma': 'program', 'methode': 'method',
}


def build_translation_map(cards: list) -> dict:
    """
    Build a word→translation map using sentence alignment heuristics.
    For each card, align Dutch and English tokens by position.
    """
    # Count co-occurrences: (nl_word, en_word) → count
    cooccur = defaultdict(Counter)
    # Also track: nl_word → total occurrences
    nl_counts = Counter()

    for card in cards:
        nl_tokens = tokenize(card.get("target", ""))
        en_tokens = tokenize(card.get("english", ""))
        if not nl_tokens or not en_tokens:
            continue

        nl_set = set(nl_tokens)
        en_set = set(en_tokens)

        # Simple co-occurrence: every NL word co-occurs with every EN word in same sentence
        for nw in nl_set:
            nl_counts[nw] += 1
            for ew in en_set:
                cooccur[nw][ew] += 1

        # Position-based alignment bonus (for sentences of similar length)
        if 0.5 <= len(nl_tokens) / max(len(en_tokens), 1) <= 2.0:
            for idx, nw in enumerate(nl_tokens):
                # Map proportional position
                en_idx = int(idx * len(en_tokens) / len(nl_tokens))
                en_idx = min(en_idx, len(en_tokens) - 1)
                # Give bonus to position-aligned pairs
                cooccur[nw][en_tokens[en_idx]] += 3

    # Convert to best translations
    translations = {}
    for nw, en_counter in cooccur.items():
        if nl_counts[nw] < 1:
            continue
        # Get top candidates, normalized by frequency
        candidates = []
        for ew, count in en_counter.most_common(10):
            # Score: co-occurrence count, penalize very common English words
            score = count
            candidates.append((ew, score))

        if candidates:
            candidates.sort(key=lambda x: -x[1])
            best = candidates[0][0]
            # If multiple strong candidates, join top 2
            if len(candidates) > 1 and candidates[1][1] > candidates[0][1] * 0.6:
                translations[nw] = f"{candidates[0][0]}, {candidates[1][0]}"
            else:
                translations[nw] = best

    return translations


# ─── Step 6: Main logic ─────────────────────────────────────────────

def main():
    # Load deck
    with open(DECK_PATH, "r", encoding="utf-8") as f:
        cards = json.load(f)

    # Load dictionary text
    dict_text = DICT_PATH.read_text(encoding="utf-8")

    # Parse existing keys
    existing_keys = parse_existing_keys(dict_text)
    print(f"Existing dictionary keys: {len(existing_keys)}")

    # Tokenize all deck sentences
    all_words = set()
    word_freq = Counter()
    for card in cards:
        tokens = tokenize(card.get("target", ""))
        for t in tokens:
            all_words.add(t)
            word_freq[t] += 1

    print(f"Unique words in deck: {len(all_words)}")

    # Find missing words
    missing = set()
    for w in all_words:
        wl = w.lower()
        if wl in existing_keys:
            continue
        # Skip single characters
        if len(wl) <= 1:
            continue
        # Skip if it's likely a proper noun (starts with capital in original) — but we lowercased
        # Skip pure numbers
        if wl.isdigit():
            continue
        missing.add(wl)

    print(f"Missing words: {len(missing)}")

    # Build translation map from deck alignment
    trans_map = build_translation_map(cards)

    # Generate entries for missing words
    new_entries = {}
    for word in sorted(missing):
        # Translation: prefer hardcoded, then alignment, then placeholder
        en = COMMON_NL.get(word) or trans_map.get(word) or word
        ipa = dutch_ipa(word)
        pos = detect_pos(word)
        new_entries[word] = {"en": en, "ipa": ipa, "pos": pos}

    print(f"New entries generated: {len(new_entries)}")

    # Format new entries as TypeScript
    # Find the closing "};" of the dictionary to insert before it
    # The dictionary ends with a line like: '  'zomerdagen': { en: 'summer days', ... },\n};'
    # We need to insert before the final "};"

    # Build the new entry lines
    lines = []
    lines.append("")
    lines.append("  // ── Auto-generated entries (expand-dutch-dict.py) ────────────────")

    current_letter = ""
    for word in sorted(new_entries.keys()):
        entry = new_entries[word]
        first = word[0].upper() if word else ""
        if first != current_letter:
            current_letter = first
            lines.append(f"  // {current_letter}")

        # Escape single quotes in translation
        en_escaped = entry["en"].replace("'", "\\'")
        # Use single quotes for key, double quotes if word contains apostrophe
        if "'" in word:
            key_str = f'"{word}"'
        else:
            key_str = f"'{word}'"

        lines.append(f"  {key_str}: {{ en: '{en_escaped}', ipa: '{entry['ipa']}', pos: '{entry['pos']}' }},")

    new_block = "\n".join(lines) + "\n"

    # Find the closing "};" of the `const dictionary` object.
    # The dictionary starts with "const dictionary: Record<string, DictEntry> = {"
    # and ends with the LAST "};" in the file (it's the last top-level const).
    dict_start = dict_text.find("const dictionary: Record<string, DictEntry> = {")
    if dict_start == -1:
        print("ERROR: Could not find 'const dictionary' in nl.ts")
        sys.exit(1)

    # Find the closing "};" after dictionary start
    # Search for the last "};" in the file (the dictionary is the last const)
    last_close = dict_text.rfind("\n};")
    if last_close == -1 or last_close < dict_start:
        print("ERROR: Could not find closing '};' for dictionary")
        sys.exit(1)

    # Insert before the closing "};"
    new_text = dict_text[:last_close] + new_block + dict_text[last_close:]

    # Write back
    DICT_PATH.write_text(new_text, encoding="utf-8")

    # Report
    total_keys_after = len(existing_keys) + len(new_entries)
    coverage = len(all_words - missing) + len(new_entries)
    pct = coverage / len(all_words) * 100 if all_words else 0
    print(f"\n=== Results ===")
    print(f"New entries added: {len(new_entries)}")
    print(f"Estimated total dictionary keys: ~{total_keys_after}")
    print(f"Deck words covered: {coverage}/{len(all_words)} ({pct:.1f}%)")


if __name__ == "__main__":
    main()
