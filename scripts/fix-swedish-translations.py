#!/usr/bin/env python3
"""Fix untranslated entries in Swedish dictionary by adding more translations."""
import re

# ─── Additional translations for the most common untranslated words ──
EXTRA_TRANSLATIONS = {
    # Very high frequency (20+)
    'skulle': 'would/should', 'bor': 'lives/resides', 'svenska': 'Swedish',
    'henne': 'her (obj)', 'mer': 'more', 'än': 'than',
    'hela': 'whole/entire', 'honom': 'him', 'ses': 'see each other',
    'fick': 'got/received', 'länge': 'for a long time',
    'tidigt': 'early', 'gott': 'good (neuter)', 'bättre': 'better',
    'god': 'good', 'gamla': 'old (pl/def)', 'bör': 'should/ought',
    'bästa': 'best', 'kör': 'drives/runs', 'dit': 'there (direction)',
    'sista': 'last/final', 'nästa': 'next', 'stora': 'big (pl/def)',
    'frukost': 'breakfast', 'lika': 'equally/as', 'hjälp': 'help (noun)',
    'mår': 'feels (health)', 'trevligt': 'nice/pleasant',
    'träffas': 'meet each other', 'varifrån': 'from where',
    'välkommen': 'welcome', 'allihopa': 'everyone/all of you',
    'betyder': 'means', 'lär': 'teaches/learns',
    'besök': 'visit (noun)', 'sysslar': 'is occupied with',
    'medicin': 'medicine', 'kul': 'fun/cool', 'låter': 'sounds',
    'efternamn': 'surname/last name', 'singel': 'single',
    'sambo': 'live-in partner', 'fritiden': 'the free time',
    'trivs': 'thrives/enjoys', 'engelska': 'English',
    'långsammare': 'slower', 'lägenhet': 'apartment',
    'centrala': 'central', 'er': 'you/your (pl)',

    # High frequency (8-19)
    'platsen': 'the place', 'nya': 'new (pl/def)', 'plats': 'place/seat',
    'samma': 'same', 'desto': 'the (comparative)', 'lunch': 'lunch',
    'ikväll': 'tonight', 'ihop': 'together', 'förra': 'previous/last',
    'sent': 'late', 'vädret': 'the weather', 'minns': 'remembers',
    'saken': 'the thing/matter', 'ingenting': 'nothing',
    'serveras': 'is served', 'nytt': 'new (neuter)',
    'timmar': 'hours', 'ber': 'asks/requests', 'firas': 'is celebrated',
    'tittar': 'looks/watches', 'hörnet': 'the corner',
    'stämmer': 'is correct/matches', 'varandra': 'each other',
    'plockar': 'picks', 'roll': 'role', 'längre': 'longer/further',
    'problem': 'problem', 'festen': 'the party',
    'rapporten': 'the report', 'kronor': 'crowns (SEK)',
    'glada': 'happy (pl/def)', 'händer': 'happens/hands',
    'stilla': 'still/quiet', 'tur': 'luck/turn',
    'norrskenet': 'the northern lights', 'stan': 'the city/town',
    'reglerna': 'the rules', 'långa': 'long (pl/def)',
    'lyckades': 'succeeded', 'sidan': 'the page/side',
    'slut': 'end/finished', 'härifrån': 'from here',
    'leker': 'plays (children)', 'bäst': 'best (adv)',
    'spännande': 'exciting', 'orden': 'the words',
    'härmed': 'hereby', 'hörde': 'heard', 'fått': 'gotten/received',
    'bott': 'lived (supine)',

    # Medium frequency (4-7)
    'eriksgatan': 'Erik\'s street', 'livets': 'of life',
    'nöjd': 'satisfied', 'kort': 'short/card', 'lågt': 'low',
    'gärna': 'gladly', 'åker': 'goes/rides', 'alldeles': 'completely',
    'ifrån': 'from/away', 'klimatet': 'the climate',
    'verkligen': 'really/truly', 'dagarna': 'the days',
    'numera': 'nowadays', 'nödvändigt': 'necessary',
    'sammanfattning': 'summary', 'dubbelt': 'double',
    'tydligt': 'clearly', 'omedelbart': 'immediately',
    'uppenbarligen': 'apparently', 'oundvikligen': 'inevitably',
    'framträdande': 'prominent', 'övervägande': 'predominantly',
    'grundläggande': 'fundamental', 'utomordentligt': 'extraordinarily',
    'ömsesidigt': 'mutually', 'välsignad': 'blessed',
    'eftertänksam': 'thoughtful', 'anmärkningsvärt': 'remarkably',
    'förutsägbart': 'predictably', 'oförglömligt': 'unforgettably',

    # Common verb forms
    'ville': 'wanted', 'visste': 'knew', 'kunde': 'could',
    'tänkte': 'thought', 'tyckte': 'thought/felt',
    'började': 'began', 'slutade': 'ended/stopped',
    'flyttade': 'moved', 'pratade': 'talked',
    'jobbade': 'worked', 'spelade': 'played',
    'försökte': 'tried', 'behövde': 'needed',
    'bestämde': 'decided', 'förklarade': 'explained',
    'undrade': 'wondered', 'berättade': 'told/narrated',
    'upptäckte': 'discovered', 'upplevde': 'experienced',
    'planerade': 'planned', 'organiserade': 'organized',
    'föreslog': 'suggested', 'rekommenderade': 'recommended',
    'presenterade': 'presented', 'diskuterade': 'discussed',
    'analyserade': 'analyzed', 'granskade': 'reviewed',
    'utvärderade': 'evaluated', 'förbättrade': 'improved',
    'förändrade': 'changed', 'utvecklade': 'developed',
    'producerade': 'produced', 'levererade': 'delivered',
    'installerade': 'installed', 'registrerade': 'registered',
    'accepterade': 'accepted', 'agerade': 'acted',
    'reagerade': 'reacted', 'protesterade': 'protested',
    'demonstrerade': 'demonstrated', 'dominerade': 'dominated',
    'inspirerade': 'inspired', 'motiverade': 'motivated',
    'lanserade': 'launched', 'designade': 'designed',
    'lade': 'laid/put', 'tog': 'took', 'drog': 'pulled',
    'slog': 'hit/struck', 'stod': 'stood', 'höll': 'held',
    'föll': 'fell', 'sjöng': 'sang', 'sprang': 'ran',
    'satt': 'sat', 'låg': 'lay', 'gick': 'went/walked',
    'skrev': 'wrote', 'läste': 'read (past)', 'köpte': 'bought',
    'sålde': 'sold', 'drack': 'drank', 'sov': 'slept',
    'brann': 'burned', 'frös': 'froze', 'bröt': 'broke',

    # Common nouns (with/without definite)
    'middag': 'dinner', 'vardagen': 'the everyday', 'förändring': 'change',
    'uppgift': 'task/assignment', 'påverkan': 'influence',
    'inställning': 'attitude/setting', 'tillgång': 'access/asset',
    'förståelse': 'understanding', 'ansvar': 'responsibility',
    'deltagare': 'participant', 'händelse': 'event/happening',
    'utrymme': 'space/room', 'skillnad': 'difference',
    'samarbete': 'collaboration', 'utveckling': 'development',
    'överraskning': 'surprise', 'välbefinnande': 'well-being',
    'verksamhet': 'activity/business', 'gemenskap': 'community',
    'utsikt': 'view/outlook', 'omgivning': 'surroundings',
    'grannar': 'neighbors', 'grannarna': 'the neighbors',
    'semester': 'vacation', 'semester': 'vacation',
    'kaffe': 'coffee', 'mjölk': 'milk', 'socker': 'sugar',
    'salt': 'salt', 'peppar': 'pepper', 'bulle': 'bun/roll',
    'bullar': 'buns', 'kanelbulle': 'cinnamon bun',
    'kanelbullar': 'cinnamon buns', 'smörgås': 'sandwich',
    'fika': 'coffee break', 'kväll': 'evening', 'natt': 'night',
    'vintern': 'the winter', 'sommaren': 'the summer',
    'hösten': 'the autumn', 'våren': 'the spring',
    'graden': 'the degree', 'grader': 'degrees',
    'helgen': 'the weekend', 'kvällen': 'the evening',
    'natten': 'the night', 'morgonen': 'the morning',
    'veckan': 'the week', 'månaden': 'the month',
    'året': 'the year', 'julen': 'Christmas',
    'midsommar': 'Midsummer', 'lucia': 'Lucia',
    'påsken': 'Easter', 'valborg': 'Walpurgis',
    'kräftskiva': 'crayfish party', 'julbord': 'Christmas buffet',
    'skärgården': 'the archipelago', 'stugan': 'the cottage',
    'stadsbiblioteket': 'the city library',
    'stadshuset': 'the city hall',
    'riksdagen': 'the parliament', 'kungliga': 'royal',
    'universitetet': 'the university', 'sjukhuset': 'the hospital',
    'flygplatsen': 'the airport', 'stationen': 'the station',
    'centralen': 'the central station', 'torget': 'the square',
    'museet': 'the museum', 'teatern': 'the theater',
    'kaféet': 'the café', 'restaurangen': 'the restaurant',
    'hotellet': 'the hotel', 'parken': 'the park',
    'kyrkogården': 'the cemetery', 'hamnen': 'the harbor',
    'vägen': 'the road', 'bron': 'the bridge',
    'tunnelbanan': 'the subway', 'tåget': 'the train',
    'bussen': 'the bus', 'spårvagnen': 'the tram',
    'taxin': 'the taxi', 'färjan': 'the ferry',
    'cykeln': 'the bicycle', 'båten': 'the boat',

    # Adjective forms (neuter, plural, definite)
    'nytt': 'new (neuter)', 'gammalt': 'old (neuter)',
    'fint': 'fine/nice (neuter)', 'bra': 'good',
    'dåligt': 'bad (neuter)', 'stort': 'big (neuter)',
    'litet': 'small (neuter)', 'lång': 'long/tall',
    'långt': 'long (neuter/far)', 'kort': 'short',
    'hög': 'high', 'högt': 'high (neuter)/loudly',
    'snabb': 'fast', 'snabbt': 'fast (neuter)/quickly',
    'varm': 'warm', 'varmt': 'warm (neuter)',
    'kallt': 'cold (neuter)', 'torrt': 'dry (neuter)',
    'svart': 'black', 'svarta': 'black (pl/def)',
    'vitt': 'white (neuter)', 'vita': 'white (pl/def)',
    'röda': 'red (pl/def)', 'blåa': 'blue (pl/def)',
    'gröna': 'green (pl/def)', 'gula': 'yellow (pl/def)',
    'bruna': 'brown (pl/def)', 'grått': 'gray (neuter)',
    'grönt': 'green (neuter)', 'blått': 'blue (neuter)',
    'rött': 'red (neuter)', 'gult': 'yellow (neuter)',
    'glad': 'happy', 'glatt': 'happy (neuter)',
    'ledsen': 'sad', 'ledsna': 'sad (pl)',
    'trött': 'tired', 'trötta': 'tired (pl)',
    'sjuk': 'sick', 'sjukt': 'sick (neuter)/insanely',
    'ung': 'young', 'unga': 'young (pl/def)',
    'gammal': 'old', 'gammalt': 'old (neuter)',
    'vacker': 'beautiful', 'vackert': 'beautiful (neuter)',
    'vackra': 'beautiful (pl/def)',
    'roligt': 'fun (neuter)', 'roliga': 'fun (pl/def)',
    'viktigt': 'important (neuter)', 'viktiga': 'important (pl)',
    'svårt': 'difficult (neuter)', 'svåra': 'difficult (pl)',
    'enkelt': 'simple (neuter)', 'enkla': 'simple (pl)',
    'öppet': 'open (neuter)', 'öppna': 'open (pl)',
    'stängt': 'closed (neuter)', 'stängda': 'closed (pl)',
    'full': 'full/drunk', 'fullt': 'full (neuter)',
    'tom': 'empty', 'tomt': 'empty (neuter)',
    'varma': 'warm (pl/def)', 'kalla': 'cold (pl/def)',
    'snäll': 'kind/nice', 'snällt': 'kind (neuter)',
    'snälla': 'kind (pl/def)', 'lugnt': 'calm (neuter)',
    'trevlig': 'nice/pleasant', 'trevligt': 'nice (neuter)',
    'trevliga': 'nice (pl)', 'mysig': 'cozy',
    'mysigt': 'cozy (neuter)', 'mysiga': 'cozy (pl)',
    'underbart': 'wonderful (neuter)', 'underbara': 'wonderful (pl)',
    'fantastiskt': 'fantastic (neuter)', 'fantastiska': 'fantastic (pl)',
    'perfekt': 'perfect', 'hemskt': 'terrible (neuter)',
    'hemska': 'terrible (pl)',

    # Common adverbs and function words
    'dock': 'however', 'ju': 'you know/indeed (particle)',
    'väl': 'well/probably (particle)', 'nog': 'probably/enough',
    'nämligen': 'namely', 'dessutom': 'moreover',
    'istället': 'instead', 'iallafall': 'anyway',
    'ovanpå': 'on top of', 'nedåt': 'downwards',
    'uppåt': 'upwards', 'framåt': 'forward',
    'bakåt': 'backward', 'runtom': 'around/all around',
    'överallt': 'everywhere', 'ingenstans': 'nowhere',
    'någonstans': 'somewhere', 'ändå': 'still/anyway',
    'förresten': 'by the way', 'alltså': 'so/therefore',
    'tydligen': 'apparently', 'troligen': 'probably',
    'knappt': 'barely/hardly', 'nästan': 'almost',
    'åtminstone': 'at least', 'ungefär': 'approximately',
    'lagom': 'just right/moderate', 'särskilt': 'especially',
    'exakt': 'exactly', 'genast': 'immediately',
    'plötsligt': 'suddenly', 'vanligtvis': 'usually',
    'normalt': 'normally', 'tyvärr': 'unfortunately',
    'lyckligtvis': 'fortunately', 'definitivt': 'definitely',
    'absolut': 'absolutely',

    # Prepositions and conjunctions
    'utom': 'except', 'förutom': 'besides/apart from',
    'angående': 'regarding', 'beträffande': 'concerning',
    'beroende': 'depending', 'istället': 'instead',
    'trots': 'despite', 'oavsett': 'regardless',
    'dessförinnan': 'before that', 'hädanefter': 'from now on',

    # Swedish-specific cultural terms
    'personnummer': 'personal identity number',
    'allemansrätten': 'right of public access',
    'systembolaget': 'state liquor store',
    'smörgåsbord': 'buffet spread',
    'midsommarstång': 'maypole',
    'dalahäst': 'Dala horse',
    'folkdräkt': 'folk costume',
    'knäckebröd': 'crispbread',
    'lussekatt': 'saffron bun',
    'glögg': 'mulled wine',
    'surströmming': 'fermented herring',
    'köttbullar': 'meatballs',
    'lingon': 'lingonberry',
    'lingonsylt': 'lingonberry jam',
    'prinskorv': 'cocktail sausage',
    'janssons': 'Jansson\'s',
    'frestelse': 'temptation',
    'semlor': 'cream buns',
    'semla': 'cream bun',
    'räkmacka': 'shrimp sandwich',

    # Place names and proper nouns
    'erik': 'Erik (name)', 'anna': 'Anna (name)',
    'astrid': 'Astrid (name)', 'lindgren': 'Lindgren (surname)',
    'ingmar': 'Ingmar (name)', 'bergman': 'Bergman (surname)',
    'alfred': 'Alfred (name)', 'nobel': 'Nobel',
    'göteborg': 'Gothenburg', 'malmö': 'Malmö',
    'uppsala': 'Uppsala', 'lund': 'Lund',
    'visby': 'Visby', 'kiruna': 'Kiruna',
    'abisko': 'Abisko', 'dalarna': 'Dalarna',
    'gotland': 'Gotland', 'skåne': 'Skåne',
    'norrland': 'Norrland', 'norden': 'the Nordics',
    'stockholm': 'Stockholm', 'england': 'England',
    'europa': 'Europe', 'spanien': 'Spain',
    'frankrike': 'France', 'tyskland': 'Germany',
    'italien': 'Italy', 'norge': 'Norway',
    'danmark': 'Denmark', 'finland': 'Finland',
    'island': 'Iceland', 'ikea': 'IKEA',
    'volvo': 'Volvo', 'spotify': 'Spotify',
    'abba': 'ABBA', 'ericsson': 'Ericsson',
    'saab': 'Saab', 'hm': 'H&M',

    # More common daily words
    'sätt': 'way/manner', 'steg': 'step', 'del': 'part',
    'bild': 'picture/image', 'ord': 'word', 'tal': 'speech/number',
    'kraft': 'power/strength', 'ljud': 'sound',
    'luft': 'air', 'mark': 'ground/soil', 'eld': 'fire',
    'is': 'ice', 'sten': 'stone', 'sand': 'sand',
    'jord': 'earth/soil', 'himmel': 'sky/heaven',
    'värld': 'world', 'liv': 'life', 'sak': 'thing/matter',
    'sorts': 'kind/sort', 'typ': 'type/kind',
    'tur': 'luck/turn', 'slags': 'kind of',
    'gång': 'time/occasion', 'stund': 'moment/while',
    'stycke': 'piece', 'mängd': 'amount/quantity',
    'grupp': 'group', 'lag': 'team/law',
    'rätt': 'right/dish', 'fest': 'party/celebration',
    'lek': 'play/game', 'vits': 'joke',
    'smak': 'taste', 'doft': 'scent/fragrance',
    'känsla': 'feeling', 'minne': 'memory',
    'dröm': 'dream', 'makt': 'power',
    'frihet': 'freedom', 'framgång': 'success',
    'lycka': 'happiness/luck', 'synd': 'sin/pity',
    'gemenskap': 'community', 'trygghet': 'security',

    # Time-related
    'förr': 'before/formerly', 'nyligen': 'recently',
    'strax': 'shortly/soon', 'framöver': 'in the future',
    'häromdagen': 'the other day', 'förrgår': 'day before yesterday',
    'övermorgon': 'day after tomorrow',

    # Body parts
    'ansikte': 'face', 'panna': 'forehead', 'kind': 'cheek',
    'haka': 'chin', 'nacke': 'neck/nape', 'skuldra': 'shoulder',
    'armbåge': 'elbow', 'handled': 'wrist', 'tumme': 'thumb',
    'bröstet': 'the chest', 'ryggen': 'the back',
    'magen': 'the stomach', 'benet': 'the leg',

    # Food and drink
    'soppa': 'soup', 'sallad': 'salad', 'biff': 'steak',
    'kyckling': 'chicken', 'lax': 'salmon', 'sill': 'herring',
    'potatis': 'potato', 'ris': 'rice', 'pasta': 'pasta',
    'grönsaker': 'vegetables', 'svamp': 'mushroom',
    'lök': 'onion', 'vitlök': 'garlic', 'tomat': 'tomato',
    'gurka': 'cucumber', 'morot': 'carrot',
    'jordgubb': 'strawberry', 'jordgubbar': 'strawberries',
    'blåbär': 'blueberry', 'blåbären': 'the blueberries',
    'hallon': 'raspberry', 'sylt': 'jam',
    'grädde': 'cream', 'glass': 'ice cream',
    'tårta': 'cake/tort', 'paj': 'pie',

    # Clothing
    'kläder': 'clothes', 'kläderna': 'the clothes',
    'kostym': 'suit', 'slips': 'tie', 'blus': 'blouse',
    'linne': 'tank top', 'shorts': 'shorts',
    'badkläder': 'swimwear', 'regnkläder': 'rain clothes',

    # Housing
    'hyra': 'rent', 'hyran': 'the rent', 'våning': 'floor/story',
    'vindsvåning': 'attic apartment', 'radhus': 'townhouse',
    'villa': 'detached house', 'innerstad': 'inner city',
    'förort': 'suburb', 'stadsdel': 'city district',

    # Work
    'lön': 'salary', 'lönen': 'the salary', 'anställd': 'employed',
    'arbetsgivare': 'employer', 'arbetstagare': 'employee',
    'fackförening': 'trade union', 'avtal': 'agreement/contract',
    'semester': 'vacation', 'föräldraledighet': 'parental leave',
    'sjukskrivning': 'sick leave', 'pension': 'pension',

    # Nature
    'älg': 'moose/elk', 'ren': 'reindeer', 'björk': 'birch',
    'tall': 'pine', 'gran': 'spruce', 'fjäll': 'mountain (treeless)',
    'dal': 'valley', 'å': 'stream/river', 'bäck': 'brook',
    'kust': 'coast', 'klippa': 'cliff/rock', 'vik': 'bay/inlet',
    'udde': 'cape/peninsula', 'holme': 'islet',
}

# Read current sv.ts and update entries
with open('src/data/dictionary/sv.ts', 'r') as f:
    content = f.read()

updated = 0
for word, translation in EXTRA_TRANSLATIONS.items():
    # Find the entry where en matches the word itself (untranslated)
    escaped_word = word.replace("'", "\\'")
    old_pattern = f"  '{escaped_word}': {{ en: '{escaped_word}'"
    new_pattern = f"  '{escaped_word}': {{ en: '{translation}'"

    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern, 1)
        updated += 1

with open('src/data/dictionary/sv.ts', 'w') as f:
    f.write(content)

print(f"Updated {updated} translations")

# Recount self-translated
import re
self_translated = 0
total = 0
for line in content.split('\n'):
    line_stripped = line.strip()
    if line_stripped.startswith("'") and 'en:' in line_stripped:
        try:
            key = line_stripped.split("'")[1]
            en_start = line_stripped.index("en: '") + 5
            en_end = line_stripped.index("'", en_start)
            en_val = line_stripped[en_start:en_end]
            total += 1
            if key == en_val:
                self_translated += 1
        except:
            pass
print(f"Remaining self-translated: {self_translated}/{total} ({100*self_translated/total:.1f}%)")
