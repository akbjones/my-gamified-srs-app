#!/usr/bin/env python3
"""
Expand Turkish dictionary (tr.ts) with missing words from deck.json.

Reads the deck, tokenizes target sentences, compares against existing
dictionary keys, generates IPA / POS / English translations for missing
words, and appends them to tr.ts.
"""

import json
import re
import sys
import os
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DECK_PATH = os.path.join(BASE, "src/data/turkish/deck.json")
DICT_PATH = os.path.join(BASE, "src/data/dictionary/tr.ts")

# ─── IPA conversion tables ─────────────────────────────────────────
CONSONANT_IPA = {
    'b': 'b', 'c': 'dʒ', 'ç': 'tʃ', 'd': 'd', 'f': 'f',
    'g': 'ɡ', 'h': 'h', 'j': 'ʒ', 'k': 'k', 'l': 'l',
    'm': 'm', 'n': 'n', 'p': 'p', 'r': 'ɾ', 's': 's',
    'ş': 'ʃ', 't': 't', 'v': 'v', 'y': 'j', 'z': 'z',
}

VOWEL_IPA = {
    'a': 'ɑ', 'e': 'e', 'ı': 'ɯ', 'i': 'i',
    'o': 'o', 'ö': 'ø', 'u': 'u', 'ü': 'y',
}

BACK_VOWELS = set('aıou')
FRONT_VOWELS = set('eiöü')
ALL_VOWELS = BACK_VOWELS | FRONT_VOWELS


def turkish_to_ipa(word: str) -> str:
    """Convert a Turkish word to approximate IPA."""
    result = []
    chars = list(word.lower())
    i = 0
    syllable_vowels = 0

    while i < len(chars):
        c = chars[i]

        if c == 'ğ':
            # ğ lengthens preceding vowel — represent as ː
            if result and result[-1] not in ('.', ):
                result.append('ː')
            i += 1
            continue

        if c in VOWEL_IPA:
            result.append(VOWEL_IPA[c])
            syllable_vowels += 1
            # Add syllable break after vowel+consonant(s) if more vowels follow
            if syllable_vowels > 0:
                # Look ahead to see if there's a pattern C+V ahead
                j = i + 1
                consonants_ahead = 0
                while j < len(chars) and chars[j] not in ALL_VOWELS and chars[j] != 'ğ':
                    consonants_ahead += 1
                    j += 1
                if j < len(chars) and chars[j] in ALL_VOWELS and consonants_ahead > 0:
                    # Add consonants up to the last one, then syllable break
                    for k in range(i + 1, i + 1 + consonants_ahead - 1):
                        if chars[k] == 'ğ':
                            result.append('ː')
                        elif chars[k] in CONSONANT_IPA:
                            result.append(CONSONANT_IPA[chars[k]])
                        else:
                            result.append(chars[k])
                    result.append('.')
                    # Add the last consonant (onset of next syllable)
                    last_c = chars[i + consonants_ahead]
                    if last_c == 'ğ':
                        result.append('ː')
                    elif last_c in CONSONANT_IPA:
                        result.append(CONSONANT_IPA[last_c])
                    else:
                        result.append(last_c)
                    i = j
                    continue
            i += 1
            continue

        if c in CONSONANT_IPA:
            result.append(CONSONANT_IPA[c])
        # skip unknown chars (apostrophes, etc.)
        i += 1

    return ''.join(result)


def detect_pos(word: str) -> str:
    """Detect part of speech from Turkish morphology."""
    w = word.lower()

    # Verb infinitives
    if w.endswith('mak') or w.endswith('mek'):
        return 'v'

    # Conjugated verb suffixes
    verb_suffixes = [
        'ıyor', 'iyor', 'uyor', 'üyor',  # present continuous
        'acak', 'ecek',  # future
        'acağ', 'eceğ',
        'ıyordu', 'iyordu', 'uyordu', 'üyordu',
        'mıştı', 'mişti', 'muştu', 'müştü',
        'mıştır', 'miştir', 'muştur', 'müştür',
        'malı', 'meli',  # necessity
        'abilir', 'ebilir',  # ability
        'acaktı', 'ecekti',
        'ardı', 'erdi', 'ırdı', 'irdi', 'urdu', 'ürdü',
        'ıyorlar', 'iyorlar', 'uyorlar', 'üyorlar',
        'dı', 'di', 'du', 'dü', 'tı', 'ti', 'tu', 'tü',  # past
        'mış', 'miş', 'muş', 'müş',  # reported past
        'ır', 'ir', 'ur', 'ür', 'ar', 'er',  # aorist
        'sa', 'se',  # conditional
        'arak', 'erek',  # gerund
        'ınca', 'ince', 'unca', 'ünce',  # temporal
        'dığ', 'diğ', 'duğ', 'düğ', 'tığ', 'tiğ', 'tuğ', 'tüğ',  # participle
        'ıp', 'ip', 'up', 'üp',  # connective
    ]
    for suf in verb_suffixes:
        if w.endswith(suf) and len(w) > len(suf) + 1:
            return 'v'

    # Noun-forming suffixes
    if any(w.endswith(s) for s in ['lık', 'lik', 'luk', 'lük']):
        return 'n'

    # Adjective suffixes
    adj_suffixes = ['lı', 'li', 'lu', 'lü', 'sız', 'siz', 'suz', 'süz',
                    'sal', 'sel', 'cı', 'ci', 'cu', 'cü',
                    'ımsı', 'imsi', 'umsu', 'ümsü']
    for suf in adj_suffixes:
        if w.endswith(suf) and len(w) > len(suf) + 1:
            return 'adj'

    # Adverb
    if w.endswith('ca') or w.endswith('ce') or w.endswith('çe') or w.endswith('ça'):
        if len(w) > 3:
            return 'adv'

    return 'n'  # default to noun


# ─── Hardcoded common Turkish words (~300+) ─────────────────────────
COMMON_WORDS = {
    # Pronouns
    'ben': ('I', 'pron'), 'sen': ('you', 'pron'), 'o': ('he/she/it', 'pron'),
    'biz': ('we', 'pron'), 'siz': ('you (plural)', 'pron'), 'onlar': ('they', 'pron'),
    'beni': ('me', 'pron'), 'seni': ('you (acc)', 'pron'), 'onu': ('him/her/it', 'pron'),
    'bize': ('us (dat)', 'pron'), 'size': ('you (dat)', 'pron'), 'onlara': ('them (dat)', 'pron'),
    'benim': ('my', 'pron'), 'senin': ('your', 'pron'), 'onun': ('his/her/its', 'pron'),
    'bizim': ('our', 'pron'), 'sizin': ('your (pl)', 'pron'), 'onların': ('their', 'pron'),
    'bu': ('this', 'pron'), 'şu': ('that', 'pron'), 'bunlar': ('these', 'pron'),
    'şunlar': ('those', 'pron'), 'bunu': ('this (acc)', 'pron'), 'burada': ('here', 'adv'),
    'şurada': ('there', 'adv'), 'orada': ('there', 'adv'), 'buraya': ('here (dat)', 'adv'),
    'oraya': ('there (dat)', 'adv'), 'buradan': ('from here', 'adv'),
    'ne': ('what', 'pron'), 'kim': ('who', 'pron'), 'neden': ('why', 'adv'),
    'niçin': ('why', 'adv'), 'nerede': ('where', 'adv'), 'nasıl': ('how', 'adv'),
    'hangi': ('which', 'pron'), 'kaç': ('how many', 'pron'), 'nereye': ('where to', 'adv'),
    'nereden': ('where from', 'adv'), 'nere': ('where', 'adv'),
    'kendi': ('self', 'pron'), 'kendim': ('myself', 'pron'), 'kendisi': ('himself/herself', 'pron'),
    'herkes': ('everyone', 'pron'), 'hiçbir': ('no, none', 'adj'), 'birisi': ('someone', 'pron'),
    'her': ('every, each', 'adj'), 'bazı': ('some', 'adj'), 'birçok': ('many', 'adj'),
    'hiç': ('never, none', 'adv'), 'hep': ('always', 'adv'), 'biraz': ('a little', 'adv'),

    # Numbers
    'bir': ('one, a', 'num'), 'iki': ('two', 'num'), 'üç': ('three', 'num'),
    'dört': ('four', 'num'), 'beş': ('five', 'num'), 'altı': ('six', 'num'),
    'yedi': ('seven', 'num'), 'sekiz': ('eight', 'num'), 'dokuz': ('nine', 'num'),
    'on': ('ten', 'num'), 'yirmi': ('twenty', 'num'), 'otuz': ('thirty', 'num'),
    'kırk': ('forty', 'num'), 'elli': ('fifty', 'num'), 'altmış': ('sixty', 'num'),
    'yetmiş': ('seventy', 'num'), 'seksen': ('eighty', 'num'), 'doksan': ('ninety', 'num'),
    'yüz': ('hundred', 'num'), 'bin': ('thousand', 'num'), 'milyon': ('million', 'num'),
    'ilk': ('first', 'adj'), 'ikinci': ('second', 'adj'), 'üçüncü': ('third', 'adj'),
    'son': ('last', 'adj'),

    # Common nouns
    'ev': ('house', 'n'), 'su': ('water', 'n'), 'yol': ('road, way', 'n'),
    'gün': ('day', 'n'), 'gece': ('night', 'n'), 'sabah': ('morning', 'n'),
    'akşam': ('evening', 'n'), 'zaman': ('time', 'n'), 'yıl': ('year', 'n'),
    'ay': ('month, moon', 'n'), 'hafta': ('week', 'n'), 'saat': ('hour, clock', 'n'),
    'dakika': ('minute', 'n'), 'adam': ('man', 'n'), 'kadın': ('woman', 'n'),
    'çocuk': ('child', 'n'), 'kız': ('girl, daughter', 'n'), 'oğul': ('son', 'n'),
    'anne': ('mother', 'n'), 'baba': ('father', 'n'), 'kardeş': ('sibling', 'n'),
    'arkadaş': ('friend', 'n'), 'aile': ('family', 'n'), 'insan': ('human, person', 'n'),
    'hayat': ('life', 'n'), 'dünya': ('world', 'n'), 'ülke': ('country', 'n'),
    'şehir': ('city', 'n'), 'köy': ('village', 'n'), 'sokak': ('street', 'n'),
    'okul': ('school', 'n'), 'iş': ('work, job', 'n'), 'para': ('money', 'n'),
    'araba': ('car', 'n'), 'kapı': ('door', 'n'), 'pencere': ('window', 'n'),
    'masa': ('table', 'n'), 'sandalye': ('chair', 'n'), 'kitap': ('book', 'n'),
    'dil': ('language, tongue', 'n'), 'göz': ('eye', 'n'), 'el': ('hand', 'n'),
    'baş': ('head', 'n'), 'kalp': ('heart', 'n'), 'yüz': ('face', 'n'),
    'ses': ('sound, voice', 'n'), 'renk': ('color', 'n'), 'şey': ('thing', 'n'),
    'yer': ('place', 'n'), 'taraf': ('side', 'n'), 'ara': ('between, gap', 'n'),
    'konu': ('subject, topic', 'n'), 'soru': ('question', 'n'), 'cevap': ('answer', 'n'),
    'haber': ('news', 'n'), 'fikir': ('idea', 'n'), 'sebep': ('reason', 'n'),
    'yemek': ('food, meal', 'n'), 'ekmek': ('bread', 'n'), 'çay': ('tea', 'n'),
    'kahve': ('coffee', 'n'), 'süt': ('milk', 'n'), 'meyve': ('fruit', 'n'),
    'et': ('meat', 'n'), 'balık': ('fish', 'n'), 'sebze': ('vegetable', 'n'),
    'bahçe': ('garden', 'n'), 'ağaç': ('tree', 'n'), 'çiçek': ('flower', 'n'),
    'deniz': ('sea', 'n'), 'dağ': ('mountain', 'n'), 'nehir': ('river', 'n'),
    'göl': ('lake', 'n'), 'orman': ('forest', 'n'), 'güneş': ('sun', 'n'),
    'yağmur': ('rain', 'n'), 'kar': ('snow', 'n'), 'rüzgar': ('wind', 'n'),
    'hava': ('weather, air', 'n'), 'toprak': ('soil, earth', 'n'),
    'doktor': ('doctor', 'n'), 'öğretmen': ('teacher', 'n'), 'müdür': ('director', 'n'),
    'başkan': ('president', 'n'), 'devlet': ('state, government', 'n'),
    'hükümet': ('government', 'n'), 'kanun': ('law', 'n'), 'hak': ('right', 'n'),
    'tarih': ('history, date', 'n'), 'bilim': ('science', 'n'),
    'müzik': ('music', 'n'), 'sanat': ('art', 'n'), 'spor': ('sport', 'n'),
    'film': ('film', 'n'), 'dergi': ('magazine', 'n'), 'gazete': ('newspaper', 'n'),
    'telefon': ('telephone', 'n'), 'bilgisayar': ('computer', 'n'),
    'hastane': ('hospital', 'n'), 'market': ('market', 'n'),
    'restoran': ('restaurant', 'n'), 'otel': ('hotel', 'n'),
    'park': ('park', 'n'), 'kütüphane': ('library', 'n'),
    'camii': ('mosque', 'n'), 'kilise': ('church', 'n'),
    'havaalanı': ('airport', 'n'), 'istasyon': ('station', 'n'),
    'otobüs': ('bus', 'n'), 'tren': ('train', 'n'), 'uçak': ('airplane', 'n'),
    'gemi': ('ship', 'n'), 'bisiklet': ('bicycle', 'n'),

    # Common adjectives
    'büyük': ('big', 'adj'), 'küçük': ('small', 'adj'), 'iyi': ('good', 'adj'),
    'kötü': ('bad', 'adj'), 'güzel': ('beautiful', 'adj'), 'çirkin': ('ugly', 'adj'),
    'yeni': ('new', 'adj'), 'eski': ('old', 'adj'), 'genç': ('young', 'adj'),
    'yaşlı': ('old (person)', 'adj'), 'uzun': ('long, tall', 'adj'),
    'kısa': ('short', 'adj'), 'geniş': ('wide', 'adj'), 'dar': ('narrow', 'adj'),
    'sıcak': ('hot', 'adj'), 'soğuk': ('cold', 'adj'), 'hızlı': ('fast', 'adj'),
    'yavaş': ('slow', 'adj'), 'kolay': ('easy', 'adj'), 'zor': ('difficult', 'adj'),
    'doğru': ('correct, true', 'adj'), 'yanlış': ('wrong', 'adj'),
    'önemli': ('important', 'adj'), 'gerekli': ('necessary', 'adj'),
    'mümkün': ('possible', 'adj'), 'farklı': ('different', 'adj'),
    'aynı': ('same', 'adj'), 'başka': ('other', 'adj'),
    'tek': ('single, only', 'adj'), 'çok': ('many, very', 'adj'),
    'az': ('few, little', 'adj'), 'tam': ('exact, full', 'adj'),
    'boş': ('empty', 'adj'), 'dolu': ('full', 'adj'),
    'açık': ('open, light', 'adj'), 'kapalı': ('closed', 'adj'),
    'temiz': ('clean', 'adj'), 'kirli': ('dirty', 'adj'),
    'zengin': ('rich', 'adj'), 'fakir': ('poor', 'adj'),
    'mutlu': ('happy', 'adj'), 'üzgün': ('sad', 'adj'),
    'sağlıklı': ('healthy', 'adj'), 'hasta': ('sick', 'adj'),
    'hazır': ('ready', 'adj'), 'meşgul': ('busy', 'adj'),
    'rahat': ('comfortable', 'adj'), 'yorgun': ('tired', 'adj'),
    'sessiz': ('quiet', 'adj'), 'gürültülü': ('noisy', 'adj'),
    'beyaz': ('white', 'adj'), 'siyah': ('black', 'adj'),
    'kırmızı': ('red', 'adj'), 'mavi': ('blue', 'adj'),
    'yeşil': ('green', 'adj'), 'sarı': ('yellow', 'adj'),

    # Common verbs (stems that appear in conjugated forms)
    'var': ('there is, exists', 'adj'), 'yok': ('there is not', 'adj'),
    'değil': ('not', 'adv'),

    # Adverbs / particles / conjunctions
    'da': ('also, too', 'part'), 'de': ('also, too', 'part'),
    'ile': ('with', 'prep'), 'için': ('for', 'prep'),
    'gibi': ('like', 'prep'), 'kadar': ('until, as much as', 'prep'),
    'sonra': ('after', 'adv'), 'önce': ('before', 'adv'),
    'şimdi': ('now', 'adv'), 'bugün': ('today', 'adv'),
    'dün': ('yesterday', 'adv'), 'yarın': ('tomorrow', 'adv'),
    'hâlâ': ('still', 'adv'), 'hala': ('still', 'adv'),
    'artık': ('anymore', 'adv'), 'henüz': ('yet', 'adv'),
    'bile': ('even', 'adv'), 'sadece': ('only', 'adv'),
    'belki': ('maybe', 'adv'), 'tabii': ('of course', 'adv'),
    'elbette': ('certainly', 'adv'), 'kesinlikle': ('absolutely', 'adv'),
    'evet': ('yes', 'adv'), 'hayır': ('no', 'adv'),
    'tamam': ('okay', 'adv'), 'lütfen': ('please', 'adv'),
    'teşekkür': ('thanks', 'n'), 'teşekkürler': ('thanks', 'n'),
    'merhaba': ('hello', 'n'), 'günaydın': ('good morning', 'n'),
    'iyi': ('good', 'adj'), 'geceler': ('nights', 'n'),
    'hoşça': ('bye', 'adv'), 'güle': ('bye', 'adv'),
    've': ('and', 'conj'), 'ama': ('but', 'conj'), 'veya': ('or', 'conj'),
    'ya': ('or', 'conj'), 'hem': ('both', 'conj'), 'ne': ('what', 'pron'),
    'ki': ('that', 'conj'), 'eğer': ('if', 'conj'), 'çünkü': ('because', 'conj'),
    'ise': ('if, as for', 'conj'), 'yoksa': ('otherwise', 'conj'),
    'ancak': ('however', 'conj'), 'fakat': ('but', 'conj'),
    'oysa': ('whereas', 'conj'), 'yani': ('so, that is', 'conj'),
    'hatta': ('even, moreover', 'adv'), 'üstelik': ('moreover', 'adv'),

    # Postpositions
    'üzerinde': ('on, upon', 'prep'), 'altında': ('under', 'prep'),
    'yanında': ('next to', 'prep'), 'arasında': ('between', 'prep'),
    'içinde': ('inside', 'prep'), 'dışında': ('outside', 'prep'),
    'karşısında': ('across from', 'prep'), 'arkasında': ('behind', 'prep'),
    'önünde': ('in front of', 'prep'),

    # Time expressions
    'bugün': ('today', 'adv'), 'dün': ('yesterday', 'adv'),
    'yarın': ('tomorrow', 'adv'), 'geçen': ('last, passing', 'adj'),
    'gelecek': ('next, future', 'adj'), 'her': ('every', 'adj'),
    'bazen': ('sometimes', 'adv'), 'genellikle': ('usually', 'adv'),
    'sık': ('often', 'adv'), 'nadiren': ('rarely', 'adv'),
    'daima': ('always', 'adv'), 'asla': ('never', 'adv'),

    # Common suffixed forms
    'olarak': ('as', 'adv'), 'olduğunu': ('that it is', 'v'),
    'olan': ('which is', 'v'), 'oldu': ('became, happened', 'v'),
    'olmuş': ('has become', 'v'), 'olacak': ('will be', 'v'),
    'olduğu': ('that it is', 'v'), 'olması': ('being', 'v'),
    'olabilir': ('can be', 'v'), 'olursa': ('if it becomes', 'v'),

    # More common words
    'gece': ('night', 'n'), 'gündüz': ('daytime', 'n'),
    'mevsim': ('season', 'n'), 'kış': ('winter', 'n'),
    'yaz': ('summer', 'n'), 'bahar': ('spring', 'n'),
    'sonbahar': ('autumn', 'n'), 'ilkbahar': ('spring', 'n'),
    'renk': ('color', 'n'), 'şekil': ('shape', 'n'),
    'boyut': ('size, dimension', 'n'),
    'oda': ('room', 'n'), 'mutfak': ('kitchen', 'n'),
    'banyo': ('bathroom', 'n'), 'salon': ('living room', 'n'),
    'yatak': ('bed', 'n'), 'koltuk': ('armchair', 'n'),
    'dolap': ('cabinet', 'n'), 'ayna': ('mirror', 'n'),
    'perde': ('curtain', 'n'), 'halı': ('carpet', 'n'),
    'duvar': ('wall', 'n'), 'tavan': ('ceiling', 'n'),
    'zemin': ('floor', 'n'), 'merdiven': ('stairs', 'n'),
    'asansör': ('elevator', 'n'), 'bina': ('building', 'n'),
    'köprü': ('bridge', 'n'), 'cadde': ('avenue', 'n'),
    'meydan': ('square', 'n'), 'kale': ('castle', 'n'),
    'nehir': ('river', 'n'), 'sahil': ('coast', 'n'),
    'ada': ('island', 'n'), 'vadi': ('valley', 'n'),
    'tepe': ('hill', 'n'), 'çöl': ('desert', 'n'),
    'gökyüzü': ('sky', 'n'), 'bulut': ('cloud', 'n'),
    'yıldız': ('star', 'n'), 'dolunay': ('full moon', 'n'),
    'fırtına': ('storm', 'n'), 'deprem': ('earthquake', 'n'),
    'sel': ('flood', 'n'), 'yangın': ('fire', 'n'),
    'kaza': ('accident', 'n'), 'savaş': ('war', 'n'),
    'barış': ('peace', 'n'), 'özgürlük': ('freedom', 'n'),
    'eğitim': ('education', 'n'), 'sınav': ('exam', 'n'),
    'ders': ('lesson', 'n'), 'sınıf': ('class', 'n'),
    'ödev': ('homework', 'n'), 'not': ('grade, note', 'n'),

    # Food and drink
    'peynir': ('cheese', 'n'), 'yoğurt': ('yogurt', 'n'),
    'pirinç': ('rice', 'n'), 'makarna': ('pasta', 'n'),
    'çorba': ('soup', 'n'), 'salata': ('salad', 'n'),
    'pilav': ('rice pilaf', 'n'), 'kebap': ('kebab', 'n'),
    'tatlı': ('dessert, sweet', 'n'), 'şeker': ('sugar', 'n'),
    'tuz': ('salt', 'n'), 'biber': ('pepper', 'n'),
    'yağ': ('oil, fat', 'n'), 'soğan': ('onion', 'n'),
    'domates': ('tomato', 'n'), 'patates': ('potato', 'n'),
    'havuç': ('carrot', 'n'), 'fasulye': ('bean', 'n'),
    'elma': ('apple', 'n'), 'portakal': ('orange', 'n'),
    'muz': ('banana', 'n'), 'üzüm': ('grape', 'n'),
    'çilek': ('strawberry', 'n'), 'karpuz': ('watermelon', 'n'),
    'limon': ('lemon', 'n'), 'tavuk': ('chicken', 'n'),

    # Body
    'vücut': ('body', 'n'), 'kol': ('arm', 'n'), 'bacak': ('leg', 'n'),
    'ayak': ('foot', 'n'), 'parmak': ('finger', 'n'), 'saç': ('hair', 'n'),
    'kulak': ('ear', 'n'), 'burun': ('nose', 'n'), 'ağız': ('mouth', 'n'),
    'diş': ('tooth', 'n'), 'dil': ('tongue', 'n'), 'omuz': ('shoulder', 'n'),
    'sırt': ('back', 'n'), 'karın': ('belly', 'n'), 'boyun': ('neck', 'n'),

    # Clothing
    'elbise': ('dress', 'n'), 'gömlek': ('shirt', 'n'), 'pantolon': ('pants', 'n'),
    'ceket': ('jacket', 'n'), 'ayakkabı': ('shoe', 'n'), 'çorap': ('sock', 'n'),
    'şapka': ('hat', 'n'), 'kravat': ('tie', 'n'), 'etek': ('skirt', 'n'),
    'mont': ('coat', 'n'), 'kazak': ('sweater', 'n'),
}


def tokenize(text: str) -> list:
    """Tokenize a Turkish sentence into words."""
    # Remove punctuation but keep Turkish chars
    text = re.sub(r"[.,!?;:\"\"\"''()—–\-…«»\[\]{}/<>@#$%^&*+=~`|\\]", ' ', text)
    # Handle apostrophes in proper nouns like Türkiye'den
    text = re.sub(r"'", "'", text)  # normalize fancy apostrophes
    words = text.lower().split()
    result = []
    for w in words:
        w = w.strip("'")
        if w:
            result.append(w)
    return result


def parse_existing_dict(path: str) -> set:
    """Parse tr.ts to extract all existing dictionary keys."""
    keys = set()
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match both quoted and bare keys in the dictionary section
    # Patterns: 'key': {  or  "key": {  or  key: {
    for m in re.finditer(r"""(?:['"])((?:[^'"\\\n]|\\.)*)(?:['"])\s*:\s*\{""", content):
        key = m.group(1).replace("\\'", "'")
        keys.add(key.lower())

    return keys


def build_translation_map(deck: list) -> dict:
    """
    Build word translation map using sentence alignment.
    For each Turkish word, collect English words that co-occur in sentences.
    """
    word_english = defaultdict(Counter)

    for card in deck:
        tr_words = set(tokenize(card.get('target', '')))
        en_text = card.get('english', '').lower()
        en_words = re.findall(r"[a-z']+", en_text)

        for tw in tr_words:
            for ew in en_words:
                word_english[tw][ew] += 1

    # For each Turkish word, pick top English translations
    translations = {}
    stop_en = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
               'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
               'would', 'shall', 'should', 'may', 'might', 'must', 'can',
               'could', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
               'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
               'our', 'their', 'this', 'that', 'these', 'those', 'to',
               'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from',
               'up', 'about', 'into', 'through', 'during', 'before',
               'after', 'and', 'but', 'or', 'not', 'no', 'if', 'so',
               'than', 'too', 'very', 'just', 'only', 'also', 'as',
               'when', 'where', 'how', 'what', 'who', 'which', 'there',
               's', 't', 'd', 'll', 've', 're', 'm', 'don'}

    for tw, counter in word_english.items():
        # Filter out stop words and very short words
        meaningful = [(w, c) for w, c in counter.most_common(20)
                      if w not in stop_en and len(w) > 1]
        if meaningful:
            # Take top 2
            top = meaningful[:2]
            translations[tw] = ', '.join(w for w, _ in top)

    return translations


def escape_key(key: str) -> str:
    """Format dictionary key for TypeScript."""
    if "'" in key:
        return f'"{key}"'
    return f"'{key}'"


def escape_en(val: str) -> str:
    """Escape single quotes in English translation."""
    return val.replace("'", "\\'")


def main():
    # Load deck
    with open(DECK_PATH, 'r', encoding='utf-8') as f:
        deck = json.load(f)

    print(f"Loaded {len(deck)} cards from deck.json")

    # Tokenize all target sentences
    all_words = Counter()
    for card in deck:
        for w in tokenize(card.get('target', '')):
            all_words[w] += 1

    unique_words = set(all_words.keys())
    print(f"Found {len(unique_words)} unique words in deck")

    # Parse existing dictionary
    existing_keys = parse_existing_dict(DICT_PATH)
    print(f"Existing dictionary has {len(existing_keys)} entries")

    # Find missing words (not in dictionary)
    missing = unique_words - existing_keys

    # Filter out very short words (single chars), pure numbers, proper nouns
    filtered_missing = set()
    for w in missing:
        if len(w) <= 1 and w not in COMMON_WORDS:
            continue
        if re.match(r'^\d+$', w):
            continue
        # Skip words that look like they're just proper nouns with apostrophe suffixes
        # e.g., "türkiye'den" - keep these as they're useful
        filtered_missing.add(w)

    missing = filtered_missing
    print(f"Missing words (after filtering): {len(missing)}")

    # Build translation map from sentence alignment
    translation_map = build_translation_map(deck)

    # Generate entries for missing words
    new_entries = []
    for word in sorted(missing):
        # Get English translation
        if word in COMMON_WORDS:
            en, pos = COMMON_WORDS[word]
        else:
            en = translation_map.get(word, '')
            if not en:
                # Try without apostrophe part
                base = word.split("'")[0] if "'" in word else word
                en = translation_map.get(base, '')
            pos = detect_pos(word)
            # Override POS from common words if available
            if word in COMMON_WORDS:
                _, pos = COMMON_WORDS[word]

        if not en:
            # Last resort: just use the word itself
            en = word

        # Generate IPA
        # For words with apostrophes, IPA only the base
        ipa_word = word.split("'")[0] if "'" in word else word
        ipa = turkish_to_ipa(ipa_word)

        new_entries.append((word, en, ipa, pos))

    print(f"Generated {len(new_entries)} new entries")

    # Read the existing file and find insertion point (before the closing '};')
    with open(DICT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the closing brace of the dictionary object
    # It's the line with just '};' after all entries
    dict_end = content.find("\n};\n\n// ── Turkish suffix stripping")
    if dict_end == -1:
        # Try alternative pattern
        dict_end = content.find("\n};\n")
        if dict_end == -1:
            print("ERROR: Could not find dictionary end marker")
            sys.exit(1)

    # Build new entries text
    lines = []
    lines.append("\n  // ── Auto-expanded entries ──────────────────────────────────")
    for word, en, ipa, pos in new_entries:
        key = escape_key(word)
        en_escaped = escape_en(en)
        lines.append(f"  {key}: {{ en: '{en_escaped}', ipa: '{ipa}', pos: '{pos}' }},")

    insert_text = '\n'.join(lines)

    # Insert before the closing '};'
    new_content = content[:dict_end] + insert_text + content[dict_end:]

    with open(DICT_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # Report results
    final_keys = parse_existing_dict(DICT_PATH)
    final_coverage = len(unique_words & final_keys)
    pct = 100 * final_coverage / len(unique_words) if unique_words else 0

    print(f"\n{'='*60}")
    print(f"RESULTS:")
    print(f"  New entries added:    {len(new_entries)}")
    print(f"  Total dict entries:   {len(final_keys)}")
    print(f"  Deck unique words:    {len(unique_words)}")
    print(f"  Words covered:        {final_coverage}")
    print(f"  Coverage:             {pct:.1f}%")
    print(f"  Still missing:        {len(unique_words) - final_coverage}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
