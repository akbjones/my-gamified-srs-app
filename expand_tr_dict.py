#!/usr/bin/env python3
"""
Expand Turkish dictionary (tr.ts) to cover all words from the deck.
Extracts unique words from deck.json, finds missing entries, generates
Turkish dictionary entries with English translations, IPA, and POS.
"""

import json
import re
import sys

DECK_PATH = "src/data/turkish/deck.json"
DICT_PATH = "src/data/dictionary/tr.ts"

# ── Turkish IPA mapping ──────────────────────────────────────────
# Turkish is largely phonetic. This maps graphemes to IPA.
TURKISH_IPA = {
    'a': 'ɑ', 'b': 'b', 'c': 'dʒ', 'ç': 'tʃ', 'd': 'd', 'e': 'e',
    'f': 'f', 'g': 'ɡ', 'ğ': 'ː', 'h': 'h', 'ı': 'ɯ', 'i': 'i',
    'j': 'ʒ', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o',
    'ö': 'œ', 'p': 'p', 'r': 'ɾ', 's': 's', 'ş': 'ʃ', 't': 't',
    'u': 'u', 'ü': 'y', 'v': 'v', 'y': 'j', 'z': 'z',
}

VOWELS = set('aeıioöuü')

def grapheme_to_ipa(word):
    """Convert Turkish word to approximate IPA."""
    ipa_chars = []
    for ch in word.lower():
        if ch in TURKISH_IPA:
            ipa_chars.append(TURKISH_IPA[ch])
        elif ch == ' ':
            ipa_chars.append(' ')
        else:
            ipa_chars.append(ch)
    # Simple syllabification: insert dots between syllables
    result = ''.join(ipa_chars)
    # Add syllable dots (rough: before each CV sequence after first syllable)
    syllabified = syllabify_ipa(result)
    return f'/{syllabified}/'

def syllabify_ipa(ipa):
    """Rough syllabification of IPA string."""
    if len(ipa) <= 2:
        return ipa
    # Simple approach: split into chunks at vowel boundaries
    parts = []
    current = ''
    prev_vowel = False
    ipa_vowels = set('ɑeiɯoœuyː')
    for ch in ipa:
        is_v = ch in ipa_vowels
        if is_v and prev_vowel and current:
            parts.append(current)
            current = ch
        elif is_v and not prev_vowel:
            current += ch
        elif not is_v and prev_vowel and len(current) > 1:
            # Check if next char exists and is vowel - if so, split before this consonant
            current += ch
        else:
            current += ch
        prev_vowel = is_v
    if current:
        parts.append(current)
    if len(parts) <= 1:
        return ipa
    return '.'.join(parts)

def clean_word(word):
    """Clean punctuation from a word."""
    return re.sub(r'[.,!?;:"""\'\'()—–\-…«»\[\]0-9]', '', word).strip().lower()

def extract_deck_words(deck_path):
    """Extract all unique words from the Turkish deck."""
    with open(deck_path, 'r', encoding='utf-8') as f:
        deck = json.load(f)
    words = set()
    for card in deck:
        target = card.get('target', '')
        for w in target.split():
            cleaned = clean_word(w)
            if cleaned and len(cleaned) > 0:
                words.add(cleaned)
    return words

def extract_existing_keys(dict_path):
    """Extract existing dictionary keys from the .ts file."""
    with open(dict_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Match patterns like 'word': { or "word": {
    keys = set()
    for m in re.finditer(r"'([^']+)'\s*:", content):
        keys.add(m.group(1))
    for m in re.finditer(r'"([^"]+)"\s*:', content):
        keys.add(m.group(1))
    return keys

# ── Turkish → English translation dictionary ──────────────────────
# Comprehensive mapping of common Turkish words to English
TURKISH_TO_ENGLISH = {
    # Pronouns
    'ben': ('I', 'pron'), 'sen': ('you (informal)', 'pron'), 'o': ('he/she/it', 'pron'),
    'biz': ('we', 'pron'), 'siz': ('you (formal/plural)', 'pron'), 'onlar': ('they', 'pron'),
    'beni': ('me (acc)', 'pron'), 'seni': ('you (acc)', 'pron'), 'onu': ('him/her/it (acc)', 'pron'),
    'bana': ('to me', 'pron'), 'sana': ('to you', 'pron'), 'ona': ('to him/her', 'pron'),
    'benim': ('my/mine', 'pron'), 'senin': ('your/yours', 'pron'), 'onun': ('his/her/its', 'pron'),
    'bizim': ('our/ours', 'pron'), 'sizin': ('your/yours (formal)', 'pron'), 'onların': ('their/theirs', 'pron'),
    'bu': ('this', 'pron'), 'şu': ('that', 'pron'), 'bunlar': ('these', 'pron'),
    'şunlar': ('those', 'pron'), 'burada': ('here', 'adv'), 'şurada': ('there', 'adv'),
    'orada': ('there', 'adv'), 'buraya': ('to here', 'adv'), 'oraya': ('to there', 'adv'),
    'buradan': ('from here', 'adv'), 'oradan': ('from there', 'adv'),
    'bunu': ('this (acc)', 'pron'), 'şunu': ('that (acc)', 'pron'),
    'bunun': ('of this', 'pron'), 'bunları': ('these (acc)', 'pron'),
    'kendim': ('myself', 'pron'), 'kendin': ('yourself', 'pron'), 'kendisi': ('himself/herself', 'pron'),
    'kendi': ('own/self', 'pron'), 'hepsi': ('all of them', 'pron'), 'herkes': ('everyone', 'pron'),
    'hiçbiri': ('none of them', 'pron'), 'bazıları': ('some of them', 'pron'),
    'kim': ('who', 'pron'), 'ne': ('what', 'pron'), 'neden': ('why', 'adv'),
    'niye': ('why', 'adv'), 'niçin': ('why', 'adv'), 'nasıl': ('how', 'adv'),
    'nerede': ('where', 'adv'), 'nereye': ('where to', 'adv'), 'nereden': ('from where', 'adv'),
    'neresi': ('where/which place', 'adv'), 'ne zaman': ('when', 'adv'),
    'hangi': ('which', 'adj'), 'kaç': ('how many', 'adj'),

    # Articles/Determiners
    'bir': ('a/one', 'det'), 'birkaç': ('a few', 'det'), 'bazı': ('some', 'det'),
    'her': ('every/each', 'det'), 'hiç': ('no/none/ever', 'det'), 'tüm': ('all', 'det'),
    'bütün': ('whole/all', 'det'), 'birçok': ('many', 'det'), 'hiçbir': ('no/none', 'det'),
    'aynı': ('same', 'adj'), 'başka': ('other/different', 'adj'), 'diğer': ('other', 'adj'),
    'öyle': ('such/so', 'adv'), 'böyle': ('like this/such', 'adv'),

    # Nouns - People & Family
    'adam': ('man', 'n'), 'kadın': ('woman', 'n'), 'çocuk': ('child', 'n'),
    'kız': ('girl/daughter', 'n'), 'oğul': ('son', 'n'), 'erkek': ('man/male', 'n'),
    'anne': ('mother', 'n'), 'baba': ('father', 'n'), 'aile': ('family', 'n'),
    'kardeş': ('sibling', 'n'), 'ağabey': ('older brother', 'n'), 'abla': ('older sister', 'n'),
    'dede': ('grandfather', 'n'), 'nine': ('grandmother', 'n'), 'amca': ('uncle (paternal)', 'n'),
    'teyze': ('aunt (maternal)', 'n'), 'dayı': ('uncle (maternal)', 'n'), 'hala': ('aunt (paternal)', 'n'),
    'kuzen': ('cousin', 'n'), 'eş': ('spouse', 'n'), 'koca': ('husband', 'n'),
    'karı': ('wife', 'n'), 'bebek': ('baby', 'n'), 'arkadaş': ('friend', 'n'),
    'komşu': ('neighbor', 'n'), 'insan': ('human/person', 'n'), 'kişi': ('person', 'n'),
    'öğrenci': ('student', 'n'), 'öğretmen': ('teacher', 'n'), 'doktor': ('doctor', 'n'),
    'hemşire': ('nurse', 'n'), 'avukat': ('lawyer', 'n'), 'mühendis': ('engineer', 'n'),
    'müdür': ('director/manager', 'n'), 'patron': ('boss', 'n'), 'işçi': ('worker', 'n'),
    'memur': ('civil servant', 'n'), 'polis': ('police', 'n'), 'asker': ('soldier', 'n'),
    'şoför': ('driver', 'n'), 'garson': ('waiter', 'n'), 'aşçı': ('cook/chef', 'n'),
    'sanatçı': ('artist', 'n'), 'yazar': ('writer', 'n'), 'gazeteci': ('journalist', 'n'),
    'müzisyen': ('musician', 'n'), 'sporcu': ('athlete', 'n'), 'oyuncu': ('player/actor', 'n'),

    # Nouns - Body
    'baş': ('head', 'n'), 'göz': ('eye', 'n'), 'kulak': ('ear', 'n'),
    'burun': ('nose', 'n'), 'ağız': ('mouth', 'n'), 'diş': ('tooth', 'n'),
    'dil': ('tongue/language', 'n'), 'yüz': ('face/hundred', 'n'), 'saç': ('hair', 'n'),
    'el': ('hand', 'n'), 'kol': ('arm', 'n'), 'parmak': ('finger', 'n'),
    'ayak': ('foot', 'n'), 'bacak': ('leg', 'n'), 'sırt': ('back', 'n'),
    'kalp': ('heart', 'n'), 'karın': ('stomach/belly', 'n'), 'beden': ('body', 'n'),
    'vücut': ('body', 'n'), 'omuz': ('shoulder', 'n'), 'boyun': ('neck', 'n'),
    'diz': ('knee', 'n'), 'kan': ('blood', 'n'),

    # Nouns - Nature
    'su': ('water', 'n'), 'hava': ('air/weather', 'n'), 'güneş': ('sun', 'n'),
    'ay': ('moon/month', 'n'), 'yıldız': ('star', 'n'), 'deniz': ('sea', 'n'),
    'göl': ('lake', 'n'), 'nehir': ('river', 'n'), 'dağ': ('mountain', 'n'),
    'orman': ('forest', 'n'), 'ağaç': ('tree', 'n'), 'çiçek': ('flower', 'n'),
    'toprak': ('earth/soil', 'n'), 'taş': ('stone', 'n'), 'ateş': ('fire', 'n'),
    'rüzgâr': ('wind', 'n'), 'rüzgar': ('wind', 'n'), 'yağmur': ('rain', 'n'),
    'kar': ('snow', 'n'), 'bulut': ('cloud', 'n'), 'gökyüzü': ('sky', 'n'),
    'gök': ('sky/blue', 'n'), 'dünya': ('world/earth', 'n'), 'çimen': ('grass', 'n'),
    'yaprak': ('leaf', 'n'), 'hayvan': ('animal', 'n'), 'kuş': ('bird', 'n'),
    'balık': ('fish', 'n'), 'kedi': ('cat', 'n'), 'köpek': ('dog', 'n'),
    'at': ('horse', 'n'), 'inek': ('cow', 'n'), 'koyun': ('sheep', 'n'),
    'tavuk': ('chicken', 'n'), 'böcek': ('insect', 'n'), 'arı': ('bee', 'n'),
    'kurt': ('wolf', 'n'), 'aslan': ('lion', 'n'), 'ayı': ('bear', 'n'),

    # Nouns - Places
    'ev': ('house/home', 'n'), 'oda': ('room', 'n'), 'mutfak': ('kitchen', 'n'),
    'banyo': ('bathroom', 'n'), 'salon': ('living room', 'n'), 'yatak': ('bed', 'n'),
    'bahçe': ('garden', 'n'), 'sokak': ('street', 'n'), 'cadde': ('avenue', 'n'),
    'yol': ('road/way', 'n'), 'köprü': ('bridge', 'n'), 'park': ('park', 'n'),
    'okul': ('school', 'n'), 'üniversite': ('university', 'n'), 'hastane': ('hospital', 'n'),
    'eczane': ('pharmacy', 'n'), 'market': ('market/grocery', 'n'), 'mağaza': ('store', 'n'),
    'dükkan': ('shop', 'n'), 'restoran': ('restaurant', 'n'), 'kafe': ('cafe', 'n'),
    'otel': ('hotel', 'n'), 'havaalanı': ('airport', 'n'), 'istasyon': ('station', 'n'),
    'durak': ('stop/station', 'n'), 'liman': ('port/harbor', 'n'), 'cami': ('mosque', 'n'),
    'kilise': ('church', 'n'), 'müze': ('museum', 'n'), 'kütüphane': ('library', 'n'),
    'sinema': ('cinema', 'n'), 'tiyatro': ('theater', 'n'), 'stadyum': ('stadium', 'n'),
    'ofis': ('office', 'n'), 'fabrika': ('factory', 'n'), 'şehir': ('city', 'n'),
    'kasaba': ('town', 'n'), 'köy': ('village', 'n'), 'ülke': ('country', 'n'),
    'memleket': ('homeland', 'n'), 'yer': ('place/ground', 'n'), 'alan': ('area/field', 'n'),
    'bölge': ('region', 'n'), 'kent': ('city', 'n'), 'mahalle': ('neighborhood', 'n'),
    'apartman': ('apartment building', 'n'), 'kat': ('floor/story', 'n'),
    'kapı': ('door', 'n'), 'pencere': ('window', 'n'), 'duvar': ('wall', 'n'),
    'tavan': ('ceiling', 'n'), 'zemin': ('floor/ground', 'n'), 'merdiven': ('stairs', 'n'),
    'asansör': ('elevator', 'n'), 'garaj': ('garage', 'n'),

    # Nouns - Food & Drink
    'yemek': ('food/meal', 'n'), 'ekmek': ('bread', 'n'), 'su': ('water', 'n'),
    'çay': ('tea', 'n'), 'kahve': ('coffee', 'n'), 'süt': ('milk', 'n'),
    'meyve': ('fruit', 'n'), 'sebze': ('vegetable', 'n'), 'et': ('meat', 'n'),
    'tavuk': ('chicken', 'n'), 'pirinç': ('rice', 'n'), 'makarna': ('pasta', 'n'),
    'peynir': ('cheese', 'n'), 'tereyağı': ('butter', 'n'), 'yağ': ('oil/fat', 'n'),
    'şeker': ('sugar', 'n'), 'tuz': ('salt', 'n'), 'biber': ('pepper', 'n'),
    'yumurta': ('egg', 'n'), 'salata': ('salad', 'n'), 'çorba': ('soup', 'n'),
    'pilav': ('rice dish', 'n'), 'kebap': ('kebab', 'n'), 'döner': ('döner', 'n'),
    'elma': ('apple', 'n'), 'portakal': ('orange', 'n'), 'muz': ('banana', 'n'),
    'üzüm': ('grape', 'n'), 'domates': ('tomato', 'n'), 'salatalık': ('cucumber', 'n'),
    'soğan': ('onion', 'n'), 'sarımsak': ('garlic', 'n'), 'patates': ('potato', 'n'),
    'havuç': ('carrot', 'n'), 'fasulye': ('bean', 'n'), 'mercimek': ('lentil', 'n'),
    'nohut': ('chickpea', 'n'), 'bira': ('beer', 'n'), 'şarap': ('wine', 'n'),
    'meyve suyu': ('fruit juice', 'n'), 'bardak': ('glass/cup', 'n'),
    'tabak': ('plate', 'n'), 'kaşık': ('spoon', 'n'), 'çatal': ('fork', 'n'),
    'bıçak': ('knife', 'n'), 'fincan': ('cup', 'n'), 'tencere': ('pot', 'n'),
    'tava': ('pan', 'n'), 'buzdolabı': ('refrigerator', 'n'), 'fırın': ('oven', 'n'),
    'pasta': ('cake', 'n'), 'dondurma': ('ice cream', 'n'), 'tatlı': ('dessert/sweet', 'n'),
    'bal': ('honey', 'n'), 'reçel': ('jam', 'n'),

    # Nouns - Clothing
    'giysi': ('clothing', 'n'), 'elbise': ('dress/clothing', 'n'), 'gömlek': ('shirt', 'n'),
    'pantolon': ('trousers', 'n'), 'etek': ('skirt', 'n'), 'ceket': ('jacket', 'n'),
    'palto': ('coat', 'n'), 'kazak': ('sweater', 'n'), 'ayakkabı': ('shoe', 'n'),
    'çorap': ('sock/stocking', 'n'), 'şapka': ('hat', 'n'), 'eşarp': ('scarf', 'n'),
    'kravat': ('tie', 'n'), 'çanta': ('bag', 'n'), 'cüzdan': ('wallet', 'n'),
    'saat': ('watch/clock/hour', 'n'), 'yüzük': ('ring', 'n'), 'kolye': ('necklace', 'n'),
    'küpe': ('earring', 'n'), 'gözlük': ('glasses', 'n'), 'şemsiye': ('umbrella', 'n'),

    # Nouns - Transport
    'araba': ('car', 'n'), 'otobüs': ('bus', 'n'), 'tren': ('train', 'n'),
    'uçak': ('airplane', 'n'), 'gemi': ('ship', 'n'), 'bisiklet': ('bicycle', 'n'),
    'taksi': ('taxi', 'n'), 'metro': ('metro', 'n'), 'tramvay': ('tram', 'n'),
    'vapur': ('ferry', 'n'), 'kamyon': ('truck', 'n'), 'motosiklet': ('motorcycle', 'n'),
    'trafik': ('traffic', 'n'), 'bilet': ('ticket', 'n'), 'pasaport': ('passport', 'n'),
    'bavul': ('suitcase', 'n'), 'valiz': ('suitcase', 'n'), 'yolcu': ('passenger', 'n'),
    'seyahat': ('travel/journey', 'n'), 'gezi': ('trip/tour', 'n'),

    # Nouns - Time
    'zaman': ('time', 'n'), 'saat': ('hour/clock', 'n'), 'dakika': ('minute', 'n'),
    'saniye': ('second', 'n'), 'gün': ('day', 'n'), 'hafta': ('week', 'n'),
    'ay': ('month/moon', 'n'), 'yıl': ('year', 'n'), 'mevsim': ('season', 'n'),
    'sabah': ('morning', 'n'), 'öğle': ('noon', 'n'), 'akşam': ('evening', 'n'),
    'gece': ('night', 'n'), 'bugün': ('today', 'adv'), 'dün': ('yesterday', 'adv'),
    'yarın': ('tomorrow', 'adv'), 'şimdi': ('now', 'adv'), 'sonra': ('later/after', 'adv'),
    'önce': ('before/ago', 'adv'), 'her zaman': ('always', 'adv'), 'bazen': ('sometimes', 'adv'),
    'hiçbir zaman': ('never', 'adv'), 'hâlâ': ('still', 'adv'), 'hala': ('still/aunt', 'adv'),
    'artık': ('anymore/from now on', 'adv'), 'erken': ('early', 'adv'), 'geç': ('late', 'adj'),
    'hemen': ('immediately', 'adv'), 'yine': ('again', 'adv'), 'tekrar': ('again', 'adv'),
    'sık sık': ('frequently', 'adv'), 'genellikle': ('usually', 'adv'),
    'nadiren': ('rarely', 'adv'), 'ara sıra': ('occasionally', 'adv'),

    # Nouns - Abstract
    'şey': ('thing', 'n'), 'iş': ('work/job', 'n'), 'hayat': ('life', 'n'),
    'ömür': ('lifetime', 'n'), 'ölüm': ('death', 'n'), 'sevgi': ('love', 'n'),
    'aşk': ('love (romantic)', 'n'), 'nefret': ('hatred', 'n'), 'korku': ('fear', 'n'),
    'mutluluk': ('happiness', 'n'), 'üzüntü': ('sadness', 'n'), 'acı': ('pain', 'n'),
    'sevinç': ('joy', 'n'), 'öfke': ('anger', 'n'), 'umut': ('hope', 'n'),
    'güven': ('trust', 'n'), 'barış': ('peace', 'n'), 'savaş': ('war', 'n'),
    'özgürlük': ('freedom', 'n'), 'adalet': ('justice', 'n'), 'hak': ('right', 'n'),
    'görev': ('duty/task', 'n'), 'sorumluluk': ('responsibility', 'n'),
    'sorun': ('problem', 'n'), 'çözüm': ('solution', 'n'), 'fikir': ('idea', 'n'),
    'düşünce': ('thought', 'n'), 'bilgi': ('information/knowledge', 'n'),
    'haber': ('news', 'n'), 'mesaj': ('message', 'n'), 'mektup': ('letter', 'n'),
    'kitap': ('book', 'n'), 'gazete': ('newspaper', 'n'), 'dergi': ('magazine', 'n'),
    'hikâye': ('story', 'n'), 'hikaye': ('story', 'n'), 'roman': ('novel', 'n'),
    'şiir': ('poem', 'n'), 'müzik': ('music', 'n'), 'şarkı': ('song', 'n'),
    'film': ('film/movie', 'n'), 'fotoğraf': ('photograph', 'n'), 'resim': ('picture/painting', 'n'),
    'renk': ('color', 'n'), 'ses': ('sound/voice', 'n'), 'koku': ('smell', 'n'),
    'tat': ('taste', 'n'), 'dokunma': ('touch', 'n'),
    'para': ('money', 'n'), 'fiyat': ('price', 'n'), 'maaş': ('salary', 'n'),
    'ücret': ('fee/wage', 'n'), 'hesap': ('account/bill', 'n'),
    'sınıf': ('class/classroom', 'n'), 'ders': ('lesson', 'n'), 'sınav': ('exam', 'n'),
    'ödev': ('homework', 'n'), 'proje': ('project', 'n'), 'toplantı': ('meeting', 'n'),
    'plan': ('plan', 'n'), 'program': ('program', 'n'), 'kural': ('rule', 'n'),
    'yasa': ('law', 'n'), 'kanun': ('law', 'n'),
    'tarih': ('history/date', 'n'), 'coğrafya': ('geography', 'n'),
    'matematik': ('mathematics', 'n'), 'fen': ('science', 'n'),
    'sanat': ('art', 'n'), 'spor': ('sport', 'n'), 'oyun': ('game', 'n'),
    'hediye': ('gift', 'n'), 'parti': ('party', 'n'), 'düğün': ('wedding', 'n'),
    'bayram': ('holiday/festival', 'n'), 'tatil': ('vacation/holiday', 'n'),

    # Nouns - Objects
    'masa': ('table', 'n'), 'sandalye': ('chair', 'n'), 'koltuk': ('armchair/seat', 'n'),
    'dolap': ('cupboard/closet', 'n'), 'ayna': ('mirror', 'n'), 'lamba': ('lamp', 'n'),
    'halı': ('carpet', 'n'), 'perde': ('curtain', 'n'), 'yastık': ('pillow', 'n'),
    'battaniye': ('blanket', 'n'), 'havlu': ('towel', 'n'), 'sabun': ('soap', 'n'),
    'diş macunu': ('toothpaste', 'n'), 'anahtar': ('key', 'n'), 'kilit': ('lock', 'n'),
    'telefon': ('telephone', 'n'), 'bilgisayar': ('computer', 'n'),
    'televizyon': ('television', 'n'), 'radyo': ('radio', 'n'),
    'kâğıt': ('paper', 'n'), 'kagıt': ('paper', 'n'), 'kalem': ('pen/pencil', 'n'),
    'defter': ('notebook', 'n'), 'çiçek': ('flower', 'n'),
    'kutu': ('box', 'n'), 'poşet': ('plastic bag', 'n'), 'torba': ('bag/sack', 'n'),
    'ip': ('rope/string', 'n'), 'zincir': ('chain', 'n'),

    # Adjectives
    'büyük': ('big/large', 'adj'), 'küçük': ('small/little', 'adj'),
    'uzun': ('long/tall', 'adj'), 'kısa': ('short', 'adj'),
    'güzel': ('beautiful/nice', 'adj'), 'çirkin': ('ugly', 'adj'),
    'iyi': ('good', 'adj'), 'kötü': ('bad', 'adj'),
    'yeni': ('new', 'adj'), 'eski': ('old', 'adj'),
    'genç': ('young', 'adj'), 'yaşlı': ('old/elderly', 'adj'),
    'sıcak': ('hot/warm', 'adj'), 'soğuk': ('cold', 'adj'),
    'kolay': ('easy', 'adj'), 'zor': ('difficult/hard', 'adj'),
    'hızlı': ('fast', 'adj'), 'yavaş': ('slow', 'adj'),
    'doğru': ('correct/right', 'adj'), 'yanlış': ('wrong', 'adj'),
    'zengin': ('rich', 'adj'), 'fakir': ('poor', 'adj'),
    'temiz': ('clean', 'adj'), 'kirli': ('dirty', 'adj'),
    'açık': ('open/light', 'adj'), 'kapalı': ('closed', 'adj'),
    'dolu': ('full', 'adj'), 'boş': ('empty', 'adj'),
    'ağır': ('heavy', 'adj'), 'hafif': ('light', 'adj'),
    'kalın': ('thick', 'adj'), 'ince': ('thin', 'adj'),
    'geniş': ('wide', 'adj'), 'dar': ('narrow', 'adj'),
    'yumuşak': ('soft', 'adj'), 'sert': ('hard', 'adj'),
    'taze': ('fresh', 'adj'), 'bayat': ('stale', 'adj'),
    'güçlü': ('strong', 'adj'), 'zayıf': ('weak', 'adj'),
    'hasta': ('sick', 'adj'), 'sağlıklı': ('healthy', 'adj'),
    'mutlu': ('happy', 'adj'), 'mutsuz': ('unhappy', 'adj'),
    'rahat': ('comfortable', 'adj'), 'yorgun': ('tired', 'adj'),
    'meşgul': ('busy', 'adj'), 'boş': ('free/empty', 'adj'),
    'hazır': ('ready', 'adj'), 'mümkün': ('possible', 'adj'),
    'imkânsız': ('impossible', 'adj'), 'gerekli': ('necessary', 'adj'),
    'önemli': ('important', 'adj'), 'ilginç': ('interesting', 'adj'),
    'sıkıcı': ('boring', 'adj'), 'harika': ('wonderful', 'adj'),
    'mükemmel': ('perfect', 'adj'), 'korkunç': ('terrible/scary', 'adj'),
    'garip': ('strange', 'adj'), 'normal': ('normal', 'adj'),
    'farklı': ('different', 'adj'), 'benzer': ('similar', 'adj'),
    'aç': ('hungry', 'adj'), 'tok': ('full (stomach)', 'adj'),
    'susuz': ('thirsty', 'adj'), 'susamış': ('thirsty', 'adj'),
    'kırmızı': ('red', 'adj'), 'mavi': ('blue', 'adj'),
    'yeşil': ('green', 'adj'), 'sarı': ('yellow', 'adj'),
    'siyah': ('black', 'adj'), 'beyaz': ('white', 'adj'),
    'turuncu': ('orange', 'adj'), 'mor': ('purple', 'adj'),
    'pembe': ('pink', 'adj'), 'gri': ('gray', 'adj'),
    'kahverengi': ('brown', 'adj'),
    'güvenli': ('safe', 'adj'), 'tehlikeli': ('dangerous', 'adj'),
    'sessiz': ('quiet/silent', 'adj'), 'gürültülü': ('noisy', 'adj'),
    'kalabalık': ('crowded', 'adj'), 'tenha': ('deserted/quiet', 'adj'),
    'yakın': ('near/close', 'adj'), 'uzak': ('far', 'adj'),
    'üst': ('upper/top', 'adj'), 'alt': ('lower/bottom', 'adj'),
    'ön': ('front', 'adj'), 'arka': ('back/rear', 'adj'),
    'sağ': ('right', 'adj'), 'sol': ('left', 'adj'),
    'orta': ('middle/center', 'adj'), 'son': ('last/end', 'adj'),
    'ilk': ('first', 'adj'), 'tek': ('single/only', 'adj'),
    'çift': ('double/pair', 'adj'), 'yarım': ('half', 'adj'),
    'tam': ('complete/exact', 'adj'), 'asıl': ('main/real', 'adj'),
    'gerçek': ('real/true', 'adj'), 'sahte': ('fake', 'adj'),
    'ucuz': ('cheap', 'adj'), 'pahalı': ('expensive', 'adj'),
    'bedava': ('free (no cost)', 'adj'), 'özel': ('special/private', 'adj'),
    'genel': ('general', 'adj'), 'kişisel': ('personal', 'adj'),
    'resmi': ('official', 'adj'), 'modern': ('modern', 'adj'),
    'eski': ('old/former', 'adj'), 'yeni': ('new', 'adj'),
    'tatlı': ('sweet', 'adj'), 'acı': ('bitter/painful', 'adj'),
    'ekşi': ('sour', 'adj'), 'tuzlu': ('salty', 'adj'),
    'lezzetli': ('delicious', 'adj'),

    # Verbs (infinitives)
    'olmak': ('to be/become', 'v'), 'yapmak': ('to do/make', 'v'),
    'gelmek': ('to come', 'v'), 'gitmek': ('to go', 'v'),
    'almak': ('to take/buy', 'v'), 'vermek': ('to give', 'v'),
    'bilmek': ('to know', 'v'), 'istemek': ('to want', 'v'),
    'görmek': ('to see', 'v'), 'demek': ('to say', 'v'),
    'yemek': ('to eat', 'v'), 'içmek': ('to drink', 'v'),
    'okumak': ('to read', 'v'), 'yazmak': ('to write', 'v'),
    'konuşmak': ('to speak', 'v'), 'anlamak': ('to understand', 'v'),
    'sevmek': ('to love', 'v'), 'çalışmak': ('to work/study', 'v'),
    'başlamak': ('to begin', 'v'), 'bitmek': ('to end', 'v'),
    'beklemek': ('to wait', 'v'), 'bulmak': ('to find', 'v'),
    'kalmak': ('to stay', 'v'), 'düşünmek': ('to think', 'v'),
    'çıkmak': ('to go out', 'v'), 'girmek': ('to enter', 'v'),
    'oturmak': ('to sit/live', 'v'), 'kalkmak': ('to get up', 'v'),
    'yürümek': ('to walk', 'v'), 'koşmak': ('to run', 'v'),
    'durmak': ('to stop', 'v'), 'açmak': ('to open', 'v'),
    'kapatmak': ('to close', 'v'), 'taşımak': ('to carry', 'v'),
    'getirmek': ('to bring', 'v'), 'götürmek': ('to take away', 'v'),
    'tutmak': ('to hold', 'v'), 'bırakmak': ('to leave', 'v'),
    'kullanmak': ('to use', 'v'), 'söylemek': ('to tell', 'v'),
    'sormak': ('to ask', 'v'), 'cevaplamak': ('to answer', 'v'),
    'öğrenmek': ('to learn', 'v'), 'öğretmek': ('to teach', 'v'),
    'hatırlamak': ('to remember', 'v'), 'unutmak': ('to forget', 'v'),
    'satmak': ('to sell', 'v'), 'ödemek': ('to pay', 'v'),
    'değiştirmek': ('to change', 'v'), 'seçmek': ('to choose', 'v'),
    'denemek': ('to try', 'v'), 'etmek': ('to do', 'v'),
    'korkmak': ('to fear', 'v'), 'uyumak': ('to sleep', 'v'),
    'uyanmak': ('to wake up', 'v'), 'yıkamak': ('to wash', 'v'),
    'giymek': ('to wear', 'v'), 'çıkarmak': ('to remove', 'v'),
    'pişirmek': ('to cook', 'v'), 'temizlemek': ('to clean', 'v'),
    'gezmek': ('to stroll', 'v'), 'binmek': ('to ride', 'v'),
    'inmek': ('to descend', 'v'), 'sürmek': ('to drive', 'v'),
    'uçmak': ('to fly', 'v'), 'yüzmek': ('to swim', 'v'),
    'oynamak': ('to play', 'v'), 'kazanmak': ('to win', 'v'),
    'kaybetmek': ('to lose', 'v'), 'ölmek': ('to die', 'v'),
    'doğmak': ('to be born', 'v'), 'yaşamak': ('to live', 'v'),
    'büyümek': ('to grow', 'v'), 'düşmek': ('to fall', 'v'),
    'kalkmak': ('to rise', 'v'), 'atlamak': ('to jump', 'v'),
    'tırmanmak': ('to climb', 'v'), 'dönmek': ('to turn/return', 'v'),
    'bakmak': ('to look', 'v'), 'dinlemek': ('to listen', 'v'),
    'hissetmek': ('to feel', 'v'), 'dokunmak': ('to touch', 'v'),
    'koklamak': ('to smell', 'v'), 'tatmak': ('to taste', 'v'),
    'gülmek': ('to laugh', 'v'), 'ağlamak': ('to cry', 'v'),
    'şarkı söylemek': ('to sing', 'v'), 'dans etmek': ('to dance', 'v'),
    'yardım etmek': ('to help', 'v'), 'telefon etmek': ('to telephone', 'v'),
    'davet etmek': ('to invite', 'v'), 'kabul etmek': ('to accept', 'v'),
    'reddetmek': ('to reject', 'v'), 'tercih etmek': ('to prefer', 'v'),
    'tamir etmek': ('to repair', 'v'), 'kontrol etmek': ('to control', 'v'),
    'devam etmek': ('to continue', 'v'), 'teklif etmek': ('to offer', 'v'),
    'ihtiyaç duymak': ('to need', 'v'),
    'saklamak': ('to hide/store', 'v'), 'aramak': ('to search/call', 'v'),
    'tanımak': ('to recognize', 'v'), 'tanışmak': ('to meet (new)', 'v'),
    'buluşmak': ('to meet up', 'v'), 'ayrılmak': ('to leave/separate', 'v'),
    'katılmak': ('to join/attend', 'v'), 'paylaşmak': ('to share', 'v'),
    'toplamak': ('to collect', 'v'), 'dağıtmak': ('to distribute', 'v'),
    'kesmek': ('to cut', 'v'), 'yapıştırmak': ('to paste/glue', 'v'),
    'bağlamak': ('to tie/connect', 'v'), 'çözmek': ('to solve/untie', 'v'),
    'kurmak': ('to set up/build', 'v'), 'yıkmak': ('to demolish', 'v'),
    'onarmak': ('to repair', 'v'), 'boyamak': ('to paint', 'v'),
    'çizmek': ('to draw/scratch', 'v'), 'silmek': ('to erase/wipe', 'v'),
    'doldurmak': ('to fill', 'v'), 'boşaltmak': ('to empty', 'v'),
    'açıklamak': ('to explain', 'v'), 'tartışmak': ('to discuss/argue', 'v'),
    'şikayet etmek': ('to complain', 'v'), 'özür dilemek': ('to apologize', 'v'),
    'tebrik etmek': ('to congratulate', 'v'), 'kutlamak': ('to celebrate', 'v'),
    'planlamak': ('to plan', 'v'), 'organize etmek': ('to organize', 'v'),
    'hazırlamak': ('to prepare', 'v'), 'tamamlamak': ('to complete', 'v'),
    'bitirmek': ('to finish', 'v'), 'geliştirmek': ('to develop/improve', 'v'),
    'korumak': ('to protect', 'v'), 'kurtarmak': ('to save/rescue', 'v'),
    'engellemek': ('to prevent', 'v'), 'zorlamak': ('to force', 'v'),
    'izlemek': ('to watch/follow', 'v'), 'takip etmek': ('to follow', 'v'),
    'fark etmek': ('to notice', 'v'), 'ilgilenmek': ('to be interested', 'v'),
    'inanmak': ('to believe', 'v'), 'güvenmek': ('to trust', 'v'),
    'hayal etmek': ('to imagine', 'v'), 'merak etmek': ('to be curious', 'v'),
    'endişelenmek': ('to worry', 'v'), 'rahatlamak': ('to relax', 'v'),
    'eğlenmek': ('to have fun', 'v'), 'sıkılmak': ('to be bored', 'v'),
    'kızmak': ('to get angry', 'v'), 'sakinleşmek': ('to calm down', 'v'),
    'üzmek': ('to sadden', 'v'), 'sevindirmek': ('to make happy', 'v'),
    'şaşırmak': ('to be surprised', 'v'), 'utanmak': ('to be embarrassed', 'v'),
    'gururlanmak': ('to be proud', 'v'), 'kıskanmak': ('to be jealous', 'v'),
    'özlemek': ('to miss', 'v'), 'beklemek': ('to wait', 'v'),
    'geçmek': ('to pass', 'v'), 'kalmak': ('to stay/remain', 'v'),
    'taşınmak': ('to move (residence)', 'v'), 'yerleşmek': ('to settle', 'v'),
    'kaybolmak': ('to get lost', 'v'), 'kaçmak': ('to escape/run away', 'v'),
    'saklanmak': ('to hide', 'v'), 'yakalamak': ('to catch', 'v'),
    'atmak': ('to throw', 'v'), 'vurmak': ('to hit', 'v'),
    'itmek': ('to push', 'v'), 'çekmek': ('to pull', 'v'),
    'kırmak': ('to break', 'v'), 'yakmak': ('to burn', 'v'),
    'söndürmek': ('to extinguish', 'v'), 'karıştırmak': ('to mix/stir', 'v'),
    'eklemek': ('to add', 'v'), 'çıkarmak': ('to subtract/remove', 'v'),
    'saymak': ('to count', 'v'), 'ölçmek': ('to measure', 'v'),
    'tartmak': ('to weigh', 'v'), 'denemek': ('to try', 'v'),
    'başarmak': ('to succeed', 'v'), 'becermek': ('to manage', 'v'),
    'yetişmek': ('to catch up/grow', 'v'), 'yetiştirmek': ('to raise/grow', 'v'),

    # Adverbs & Postpositions
    'çok': ('very/much', 'adv'), 'az': ('little/few', 'adj'),
    'daha': ('more', 'adv'), 'en': ('most', 'adv'),
    'bile': ('even', 'adv'), 'sadece': ('only', 'adv'),
    'yalnız': ('alone/only', 'adj'), 'belki': ('maybe', 'adv'),
    'mutlaka': ('definitely', 'adv'), 'kesinlikle': ('absolutely', 'adv'),
    'muhtemelen': ('probably', 'adv'), 'tabii': ('of course', 'adv'),
    'elbette': ('of course', 'adv'), 'maalesef': ('unfortunately', 'adv'),
    'neyse': ('anyway', 'adv'), 'aslında': ('actually', 'adv'),
    'gerçekten': ('really', 'adv'), 'oldukça': ('quite/fairly', 'adv'),
    'tam': ('exactly', 'adv'), 'hâlâ': ('still', 'adv'),
    'henüz': ('yet/just', 'adv'), 'zaten': ('already', 'adv'),
    'biraz': ('a little', 'adv'), 'çoğu': ('most', 'adj'),
    'kadar': ('as much as/until', 'postp'), 'için': ('for', 'postp'),
    'ile': ('with', 'postp'), 'gibi': ('like/as', 'postp'),
    'göre': ('according to', 'postp'), 'karşı': ('against/opposite', 'postp'),
    'üzerinde': ('on/upon', 'postp'), 'altında': ('under', 'postp'),
    'yanında': ('beside/near', 'postp'), 'arasında': ('between/among', 'postp'),
    'içinde': ('inside', 'postp'), 'dışında': ('outside', 'postp'),
    'önünde': ('in front of', 'postp'), 'arkasında': ('behind', 'postp'),

    # Conjunctions
    've': ('and', 'conj'), 'veya': ('or', 'conj'), 'ya': ('or/either', 'conj'),
    'ama': ('but', 'conj'), 'fakat': ('but/however', 'conj'),
    'ancak': ('however/only', 'conj'), 'çünkü': ('because', 'conj'),
    'eğer': ('if', 'conj'), 'yoksa': ('otherwise', 'conj'),
    'hem': ('both', 'conj'), 'ne': ('neither/what', 'conj'),
    'ki': ('that/which', 'conj'), 'hatta': ('even/moreover', 'conj'),
    'yani': ('that is/so', 'conj'), 'oysa': ('whereas', 'conj'),
    'üstelik': ('moreover', 'conj'), 'dolayısıyla': ('therefore', 'conj'),

    # Particles & Suffixed forms commonly appearing as standalone
    'var': ('there is/exists', 'adj'), 'yok': ('there is not', 'adj'),
    'değil': ('not', 'part'), 'mi': ('(question particle)', 'part'),
    'mı': ('(question particle)', 'part'), 'mu': ('(question particle)', 'part'),
    'mü': ('(question particle)', 'part'), 'da': ('also/too', 'part'),
    'de': ('also/too', 'part'),

    # Education & Work
    'üniversite': ('university', 'n'), 'okul': ('school', 'n'),
    'sınıf': ('classroom/class', 'n'), 'ders': ('lesson', 'n'),
    'not': ('note/grade', 'n'), 'diploma': ('diploma', 'n'),
    'mezun': ('graduate', 'n'), 'burs': ('scholarship', 'n'),
    'şirket': ('company', 'n'), 'fabrika': ('factory', 'n'),
    'büro': ('bureau/office', 'n'), 'toplantı': ('meeting', 'n'),
    'rapor': ('report', 'n'), 'sunum': ('presentation', 'n'),
    'mülakat': ('interview', 'n'), 'kariyer': ('career', 'n'),
    'terfi': ('promotion', 'n'), 'emekli': ('retired', 'adj'),

    # Health
    'sağlık': ('health', 'n'), 'hastalık': ('disease', 'n'),
    'ilaç': ('medicine', 'n'), 'reçete': ('prescription', 'n'),
    'ameliyat': ('operation/surgery', 'n'), 'ağrı': ('ache/pain', 'n'),
    'ateş': ('fever/fire', 'n'), 'grip': ('flu', 'n'),
    'alerji': ('allergy', 'n'), 'kaza': ('accident', 'n'),
    'yaralanmak': ('to be injured', 'v'), 'iyileşmek': ('to recover', 'v'),

    # Technology
    'internet': ('internet', 'n'), 'bilgisayar': ('computer', 'n'),
    'telefon': ('phone', 'n'), 'uygulama': ('application', 'n'),
    'site': ('website', 'n'), 'eposta': ('email', 'n'),
    'şifre': ('password', 'n'), 'ekran': ('screen', 'n'),
    'tuş': ('key/button', 'n'), 'program': ('program', 'n'),

    # Government & Society
    'hükümet': ('government', 'n'), 'devlet': ('state', 'n'),
    'cumhurbaşkanı': ('president', 'n'), 'başbakan': ('prime minister', 'n'),
    'bakan': ('minister', 'n'), 'milletvekili': ('member of parliament', 'n'),
    'seçim': ('election', 'n'), 'oy': ('vote', 'n'),
    'parti': ('party (political)', 'n'), 'meclis': ('parliament', 'n'),
    'mahkeme': ('court', 'n'), 'hakim': ('judge', 'n'),
    'vatandaş': ('citizen', 'n'), 'nüfus': ('population', 'n'),
    'vergi': ('tax', 'n'), 'sigorta': ('insurance', 'n'),

    # Common suffixed/derived forms that appear frequently
    'olarak': ('as/being', 'adv'), 'olduğunu': ('that it is', 'adv'),
    'olduğu': ('that is/being', 'adj'), 'olması': ('being/its being', 'n'),
    'yapılır': ('is done', 'v'), 'yapılan': ('that is done', 'adj'),
    'gelen': ('coming/that comes', 'adj'), 'giden': ('going/that goes', 'adj'),
    'olan': ('being/that is', 'adj'), 'eden': ('doing/that does', 'adj'),

    # More nouns
    'durum': ('situation/condition', 'n'), 'olay': ('event/incident', 'n'),
    'sonuç': ('result', 'n'), 'neden': ('reason/cause', 'n'),
    'amaç': ('purpose/aim', 'n'), 'hedef': ('target/goal', 'n'),
    'başarı': ('success', 'n'), 'tecrübe': ('experience', 'n'),
    'deneyim': ('experience', 'n'), 'fırsat': ('opportunity', 'n'),
    'tehlike': ('danger', 'n'), 'risk': ('risk', 'n'),
    'değer': ('value', 'n'), 'anlam': ('meaning', 'n'),
    'örnek': ('example', 'n'), 'konu': ('subject/topic', 'n'),
    'cevap': ('answer', 'n'), 'soru': ('question', 'n'),
    'cümle': ('sentence', 'n'), 'kelime': ('word', 'n'),
    'harf': ('letter (alphabet)', 'n'), 'sayı': ('number', 'n'),
    'sayfa': ('page', 'n'), 'bölüm': ('chapter/section', 'n'),
    'başlık': ('title/heading', 'n'), 'liste': ('list', 'n'),

    # Additional verbs
    'anlatmak': ('to tell/explain', 'v'), 'göstermek': ('to show', 'v'),
    'yollamak': ('to send', 'v'), 'imzalamak': ('to sign', 'v'),
    'onaylamak': ('to approve', 'v'), 'iptal etmek': ('to cancel', 'v'),
    'ertelemek': ('to postpone', 'v'), 'teslim etmek': ('to deliver', 'v'),
    'sağlamak': ('to provide', 'v'), 'sunmak': ('to present/offer', 'v'),
    'üretmek': ('to produce', 'v'), 'tüketmek': ('to consume', 'v'),
    'harcamak': ('to spend', 'v'), 'biriktirmek': ('to save/accumulate', 'v'),
    'yatırmak': ('to deposit', 'v'), 'çekmek': ('to withdraw/pull', 'v'),
    'tavsiye etmek': ('to recommend', 'v'), 'önermek': ('to suggest', 'v'),
    'uyarmak': ('to warn', 'v'), 'tehdit etmek': ('to threaten', 'v'),
    'desteklemek': ('to support', 'v'), 'karşılamak': ('to meet/welcome', 'v'),
    'uğraşmak': ('to deal with', 'v'), 'başa çıkmak': ('to cope with', 'v'),

    # Seasonal/Weather
    'ilkbahar': ('spring', 'n'), 'yaz': ('summer', 'n'),
    'sonbahar': ('autumn', 'n'), 'kış': ('winter', 'n'),
    'fırtına': ('storm', 'n'), 'sel': ('flood', 'n'),
    'deprem': ('earthquake', 'n'), 'sis': ('fog', 'n'),
    'buz': ('ice', 'n'), 'nem': ('humidity', 'n'),
    'derece': ('degree', 'n'), 'sıcaklık': ('temperature', 'n'),

    # Materials
    'demir': ('iron', 'n'), 'altın': ('gold', 'n'),
    'gümüş': ('silver', 'n'), 'bakır': ('copper', 'n'),
    'cam': ('glass', 'n'), 'plastik': ('plastic', 'n'),
    'tahta': ('wood', 'n'), 'kumaş': ('fabric', 'n'),
    'deri': ('skin/leather', 'n'), 'pamuk': ('cotton', 'n'),
    'ipek': ('silk', 'n'), 'yün': ('wool', 'n'),

    # Religion/Culture
    'din': ('religion', 'n'), 'tanrı': ('god', 'n'),
    'allah': ('God', 'n'), 'ibadet': ('worship', 'n'),
    'namaz': ('prayer (Islamic)', 'n'), 'oruç': ('fasting', 'n'),
    'ramazan': ('Ramadan', 'n'), 'cami': ('mosque', 'n'),
    'gelenek': ('tradition', 'n'), 'kültür': ('culture', 'n'),
    'adet': ('custom/number', 'n'), 'tören': ('ceremony', 'n'),

    # Months
    'ocak': ('January', 'n'), 'şubat': ('February', 'n'),
    'mart': ('March', 'n'), 'nisan': ('April', 'n'),
    'mayıs': ('May', 'n'), 'haziran': ('June', 'n'),
    'temmuz': ('July', 'n'), 'ağustos': ('August', 'n'),
    'eylül': ('September', 'n'), 'ekim': ('October', 'n'),
    'kasım': ('November', 'n'), 'aralık': ('December', 'n'),

    # Sports & Hobbies
    'futbol': ('football/soccer', 'n'), 'basketbol': ('basketball', 'n'),
    'voleybol': ('volleyball', 'n'), 'tenis': ('tennis', 'n'),
    'yüzme': ('swimming', 'n'), 'koşu': ('running', 'n'),
    'maç': ('match/game', 'n'), 'takım': ('team', 'n'),
    'antrenman': ('training', 'n'), 'gol': ('goal', 'n'),
    'hobi': ('hobby', 'n'), 'kitap okumak': ('to read a book', 'v'),

    # Countries & Nationalities
    'türkiye': ('Turkey', 'n'), 'türk': ('Turkish/Turk', 'adj'),
    'türkçe': ('Turkish (language)', 'n'),
    'almanya': ('Germany', 'n'), 'alman': ('German', 'adj'),
    'fransa': ('France', 'n'), 'fransız': ('French', 'adj'),
    'ingiltere': ('England', 'n'), 'ingiliz': ('English', 'adj'),
    'ingilizce': ('English (language)', 'n'),
    'amerika': ('America', 'n'), 'amerikan': ('American', 'adj'),
    'italya': ('Italy', 'n'), 'italyan': ('Italian', 'adj'),
    'ispanya': ('Spain', 'n'), 'ispanyol': ('Spanish', 'adj'),
    'rusya': ('Russia', 'n'), 'rus': ('Russian', 'adj'),
    'çin': ('China', 'n'), 'çinli': ('Chinese', 'adj'),
    'japonya': ('Japan', 'n'), 'japon': ('Japanese', 'adj'),
    'yunanistan': ('Greece', 'n'), 'yunan': ('Greek', 'adj'),
    'iran': ('Iran', 'n'), 'arap': ('Arab', 'adj'),
    'suriye': ('Syria', 'n'), 'mısır': ('Egypt', 'n'),

    # Common Turkish suffixed forms
    'olabilir': ('can be/maybe', 'v'), 'olacak': ('will be', 'v'),
    'oldu': ('became/was', 'v'), 'olmuş': ('has been', 'v'),
    'oluyor': ('is becoming', 'v'), 'olmaz': ('cannot be', 'v'),
    'lazım': ('necessary/needed', 'adj'), 'gerek': ('necessary', 'adj'),
    'şart': ('condition/necessary', 'n'),

    # More everyday
    'hayır': ('no', 'intj'), 'evet': ('yes', 'intj'),
    'lütfen': ('please', 'adv'), 'teşekkürler': ('thanks', 'intj'),
    'hadi': ('come on/let\'s go', 'intj'), 'dur': ('stop', 'intj'),
    'dikkat': ('attention', 'n'), 'yardım': ('help', 'n'),
    'imdat': ('help! (emergency)', 'intj'),
}

def guess_pos(word):
    """Guess part of speech based on Turkish morphology."""
    if word.endswith(('mak', 'mek')):
        return 'v'
    if word.endswith(('lık', 'lik', 'luk', 'lük')):
        return 'n'
    if word.endswith(('cı', 'ci', 'cu', 'cü', 'çı', 'çi', 'çu', 'çü')):
        return 'n'  # agent suffix
    if word.endswith(('lı', 'li', 'lu', 'lü')):
        return 'adj'
    if word.endswith(('sız', 'siz', 'suz', 'süz')):
        return 'adj'
    if word.endswith(('ca', 'ce', 'ça', 'çe')):
        return 'adv'
    if word.endswith(('sel', 'sal')):
        return 'adj'
    return 'n'  # default

def get_translation(word):
    """Get translation, IPA and POS for a Turkish word."""
    # Check our static dictionary first
    if word in TURKISH_TO_ENGLISH:
        en, pos = TURKISH_TO_ENGLISH[word]
        return en, grapheme_to_ipa(word), pos

    # Try lowercase
    lower = word.lower()
    if lower in TURKISH_TO_ENGLISH:
        en, pos = TURKISH_TO_ENGLISH[lower]
        return en, grapheme_to_ipa(word), pos

    # For unknown words, generate IPA and guess POS
    pos = guess_pos(word)
    ipa = grapheme_to_ipa(word)

    # Try to provide a reasonable translation based on morphology
    # Check if it's a known stem + suffix
    for base, (en, bpos) in TURKISH_TO_ENGLISH.items():
        if word.startswith(base) and len(word) > len(base):
            suffix = word[len(base):]
            if suffix in ('lar', 'ler'):
                return f'{en} (pl)', ipa, bpos
            if suffix in ('lı', 'li', 'lu', 'lü'):
                return f'with {en}', ipa, 'adj'
            if suffix in ('sız', 'siz', 'suz', 'süz'):
                return f'without {en}', ipa, 'adj'
            if suffix in ('lık', 'lik', 'luk', 'lük'):
                return f'{en} (abstract)', ipa, 'n'
            if suffix in ('cı', 'ci', 'cu', 'cü', 'çı', 'çi', 'çu', 'çü'):
                return f'{en} person', ipa, 'n'

    return word, ipa, pos

def escape_ts_string(s):
    """Escape a string for TypeScript single-quoted strings."""
    return s.replace("\\", "\\\\").replace("'", "\\'")

def main():
    print("=" * 60)
    print("Turkish Dictionary Expansion")
    print("=" * 60)

    # 1. Extract deck words
    deck_words = extract_deck_words(DECK_PATH)
    print(f"\nDeck unique words: {len(deck_words)}")

    # 2. Read existing dict keys
    existing_keys = extract_existing_keys(DICT_PATH)
    print(f"Existing dict entries: {len(existing_keys)}")

    # 3. Find missing words
    missing = deck_words - existing_keys
    print(f"Missing words: {len(missing)}")

    # Calculate initial coverage
    covered = len(deck_words) - len(missing)
    print(f"Initial coverage: {covered}/{len(deck_words)} ({100*covered/len(deck_words):.1f}%)")

    if not missing:
        print("No missing words! Dictionary already covers all deck words.")
        return

    # 4. Generate entries for missing words
    new_entries = []
    for word in sorted(missing):
        if len(word) < 1:
            continue
        en, ipa, pos = get_translation(word)
        en_escaped = escape_ts_string(en)
        word_escaped = escape_ts_string(word)
        new_entries.append(f"  '{word_escaped}': {{ en: '{en_escaped}', ipa: '{ipa}', pos: '{pos}' }},")

    print(f"Generated {len(new_entries)} new entries")

    # 5. Insert entries into tr.ts before the closing '};'
    with open(DICT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the closing of the dictionary object (first '};')
    # We insert new entries just before it
    insert_marker = '};\n\n// ── Turkish suffix stripping'
    if insert_marker not in content:
        # fallback: find the first '};'
        idx = content.index('};')
        insert_point = idx
    else:
        insert_point = content.index(insert_marker)

    new_section = "\n  // ── Auto-generated entries (deck coverage) ────────────────\n"
    new_section += "\n".join(new_entries) + "\n"

    new_content = content[:insert_point] + new_section + content[insert_point:]

    with open(DICT_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 6. Verify
    final_keys = extract_existing_keys(DICT_PATH)
    final_missing = deck_words - final_keys
    final_covered = len(deck_words) - len(final_missing)

    print(f"\n--- AFTER ---")
    print(f"Total dict entries: {len(final_keys)}")
    print(f"Coverage: {final_covered}/{len(deck_words)} ({100*final_covered/len(deck_words):.1f}%)")
    print(f"Still missing: {len(final_missing)}")
    if final_missing and len(final_missing) <= 20:
        print(f"Missing words: {sorted(final_missing)}")

if __name__ == '__main__':
    main()
