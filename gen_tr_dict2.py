#!/usr/bin/env python3
"""
Generate expanded Turkish dictionary - v2 with proper morphological analysis.
Uses Turkish verb conjugation patterns and noun declension to generate
accurate translations for all deck words.
"""

import json
import re
import sys
from collections import Counter, defaultdict

# ── Load deck ────────────────────────────────────────────────
with open('src/data/turkish/deck.json') as f:
    deck = json.load(f)

# ── Load existing dictionary ─────────────────────────────────
with open('src/data/dictionary/tr.ts') as f:
    ts_content = f.read()

# Parse existing entries
existing_entries = {}
for m in re.finditer(r"'([^'\\]*(?:\\.[^'\\]*)*)':\s*\{\s*en:\s*'([^'\\]*(?:\\.[^'\\]*)*)',\s*ipa:\s*'([^'\\]*(?:\\.[^'\\]*)*)',\s*pos:\s*'([^']*)'\s*\}", ts_content):
    key, en, ipa, pos = m.groups()
    existing_entries[key] = {'en': en.replace("\\'", "'"), 'ipa': ipa, 'pos': pos}

# Get the lookupWord/suffix code from the original file
suffix_code_start = ts_content.find("// ── Turkish suffix stripping")
suffix_code = ts_content[suffix_code_start:] if suffix_code_start != -1 else ""

print(f"Existing dictionary entries: {len(existing_entries)}")

# ── Extract all unique words from deck ───────────────────────
deck_words = set()
for card in deck:
    text = card.get('target', '')
    cleaned = re.sub(r'[.,!?;:"""\u201c\u201d\u2018\u2019()\u2014\u2013\-\u2026\u00ab\u00bb\[\]{}]', ' ', text)
    for w in cleaned.split():
        w = w.strip().lower()
        if w and len(w) > 0:
            deck_words.add(w)

print(f"Unique deck words: {len(deck_words)}")

missing = deck_words - set(existing_entries.keys())
print(f"Missing words: {len(missing)}")

# ── Turkish IPA generation ───────────────────────────────────
IPA_MAP = {
    'a': 'ɑ', 'b': 'b', 'c': 'dʒ', 'ç': 'tʃ', 'd': 'd',
    'e': 'e', 'f': 'f', 'g': 'ɡ', 'ğ': 'ː', 'h': 'h',
    'ı': 'ɯ', 'i': 'i', 'j': 'ʒ', 'k': 'k', 'l': 'l',
    'm': 'm', 'n': 'n', 'o': 'o', 'ö': 'œ', 'p': 'p',
    'r': 'ɾ', 's': 's', 'ş': 'ʃ', 't': 't', 'u': 'u',
    'ü': 'y', 'v': 'v', 'y': 'j', 'z': 'z',
}

VOWELS_TR = set('aeıioöuü')

def turkish_ipa(word):
    """Generate reasonable IPA for a Turkish word."""
    ipa_chars = []
    for ch in word.replace("'", ""):
        if ch in IPA_MAP:
            ipa_chars.append(IPA_MAP[ch])
        else:
            ipa_chars.append(ch)

    # Simple syllabification
    result = ''.join(ipa_chars)
    ipa_vowels = set('ɑeiɯoœuy')

    # Insert dots at syllable boundaries (before C+V sequences)
    out = []
    i = 0
    chars = list(result)
    vowel_count = 0
    for i, ch in enumerate(chars):
        if ch in ipa_vowels:
            vowel_count += 1
            if vowel_count > 1:
                # Find where to insert dot (before consonant cluster leading to this vowel)
                insert_at = len(out)
                while insert_at > 0 and out[insert_at-1] not in ipa_vowels and out[insert_at-1] != '.':
                    insert_at -= 1
                if insert_at > 0 and insert_at < len(out):
                    out.insert(insert_at, '.')
        out.append(ch)

    return '/' + ''.join(out) + '/'


# ── Build verb stem → infinitive → English mapping ───────────
# From existing entries, extract all verbs with their English meanings
VERB_DICT = {}
for word, entry in existing_entries.items():
    if entry['pos'] == 'v' and word.endswith(('mak', 'mek')):
        stem = word[:-3]  # Remove -mak/-mek
        en = entry['en']
        if en.startswith('to '):
            en = en[3:]  # Remove "to " prefix
        VERB_DICT[stem] = (en, word)

# Add more verb stems from KNOWN verbs
EXTRA_VERBS = {
    'abart': ('exaggerate', 'abartmak'),
    'anlat': ('tell/explain', 'anlatmak'),
    'ara': ('search/call', 'aramak'),
    'art': ('increase', 'artmak'),
    'araştır': ('research/investigate', 'araştırmak'),
    'alış': ('get used to', 'alışmak'),
    'at': ('throw', 'atmak'),
    'bahset': ('mention', 'bahsetmek'),
    'bağır': ('shout', 'bağırmak'),
    'bağla': ('tie/connect', 'bağlamak'),
    'bak': ('look', 'bakmak'),
    'barış': ('make peace', 'barışmak'),
    'bas': ('press/step on', 'basmak'),
    'başar': ('succeed', 'başarmak'),
    'başla': ('start/begin', 'başlamak'),
    'bat': ('sink/set', 'batmak'),
    'bek': ('wait', 'beklemek'),
    'bekle': ('wait', 'beklemek'),
    'beğen': ('like/approve', 'beğenmek'),
    'besle': ('feed/nourish', 'beslemek'),
    'bil': ('know', 'bilmek'),
    'bin': ('ride/get on/thousand', 'binmek'),
    'bitir': ('finish', 'bitirmek'),
    'bit': ('end', 'bitmek'),
    'boya': ('paint', 'boyamak'),
    'boz': ('break/spoil', 'bozmak'),
    'bul': ('find', 'bulmak'),
    'buluş': ('meet up', 'buluşmak'),
    'bırak': ('leave/let go', 'bırakmak'),
    'büyü': ('grow', 'büyümek'),
    'çağır': ('call/invite', 'çağırmak'),
    'çalış': ('work/study', 'çalışmak'),
    'çek': ('pull/draw', 'çekmek'),
    'çevir': ('translate/turn', 'çevirmek'),
    'çık': ('go out/exit', 'çıkmak'),
    'çıkar': ('remove/take out', 'çıkarmak'),
    'çöz': ('solve', 'çözmek'),
    'danış': ('consult', 'danışmak'),
    'davran': ('behave', 'davranmak'),
    'de': ('say', 'demek'),
    'değiş': ('change', 'değişmek'),
    'değiştir': ('change (trans.)', 'değiştirmek'),
    'dene': ('try', 'denemek'),
    'destekle': ('support', 'desteklemek'),
    'devam': ('continue', 'devam etmek'),
    'dinle': ('listen', 'dinlemek'),
    'doğ': ('be born', 'doğmak'),
    'dokun': ('touch', 'dokunmak'),
    'doldur': ('fill', 'doldurmak'),
    'don': ('freeze', 'donmak'),
    'doy': ('be full/satisfied', 'doymak'),
    'dök': ('pour/spill', 'dökmek'),
    'dön': ('return/turn', 'dönmek'),
    'dur': ('stop/stand', 'durmak'),
    'duy': ('hear/feel', 'duymak'),
    'duy': ('hear/feel', 'duymak'),
    'düş': ('fall', 'düşmek'),
    'düşün': ('think', 'düşünmek'),
    'düzenle': ('organize', 'düzenlemek'),
    'ed': ('do/make', 'etmek'),
    'et': ('do/make', 'etmek'),
    'eğlen': ('have fun', 'eğlenmek'),
    'ekle': ('add', 'eklemek'),
    'evlen': ('marry', 'evlenmek'),
    'geç': ('pass', 'geçmek'),
    'geçir': ('spend (time)', 'geçirmek'),
    'gel': ('come', 'gelmek'),
    'gerçekleş': ('come true', 'gerçekleşmek'),
    'gerek': ('be necessary', 'gerekmek'),
    'getir': ('bring', 'getirmek'),
    'gez': ('stroll/travel', 'gezmek'),
    'gir': ('enter', 'girmek'),
    'git': ('go', 'gitmek'),
    'gid': ('go', 'gitmek'),  # consonant softening
    'giy': ('wear/dress', 'giymek'),
    'gönder': ('send', 'göndermek'),
    'gör': ('see', 'görmek'),
    'göster': ('show', 'göstermek'),
    'götür': ('take (away)', 'götürmek'),
    'güven': ('trust', 'güvenmek'),
    'gül': ('laugh', 'gülmek'),
    'harca': ('spend (money)', 'harcamak'),
    'hatırla': ('remember', 'hatırlamak'),
    'hazırla': ('prepare', 'hazırlamak'),
    'hisset': ('feel', 'hissetmek'),
    'ilgilen': ('be interested', 'ilgilenmek'),
    'in': ('get off/descend', 'inmek'),
    'inan': ('believe', 'inanmak'),
    'incele': ('examine', 'incelemek'),
    'iste': ('want', 'istemek'),
    'ist': ('want', 'istemek'),
    'it': ('push', 'itmek'),
    'izle': ('watch/follow', 'izlemek'),
    'kabul': ('accept', 'kabul etmek'),
    'kal': ('stay/remain', 'kalmak'),
    'kalk': ('get up/rise', 'kalkmak'),
    'kapat': ('close/shut', 'kapatmak'),
    'karşıla': ('meet/welcome', 'karşılamak'),
    'karşılaş': ('encounter', 'karşılaşmak'),
    'katıl': ('join/participate', 'katılmak'),
    'kaybet': ('lose', 'kaybetmek'),
    'kaybol': ('get lost', 'kaybolmak'),
    'kazan': ('win/earn', 'kazanmak'),
    'kes': ('cut', 'kesmek'),
    'kirala': ('rent', 'kiralamak'),
    'konuş': ('speak/talk', 'konuşmak'),
    'kork': ('be afraid', 'korkmak'),
    'koru': ('protect', 'korumak'),
    'koş': ('run', 'koşmak'),
    'koy': ('put/place', 'koymak'),
    'kov': ('fire/expel', 'kovmak'),
    'kull': ('use', 'kullanmak'),
    'kullan': ('use', 'kullanmak'),
    'kur': ('set up/establish', 'kurmak'),
    'kurtar': ('save/rescue', 'kurtarmak'),
    'kır': ('break', 'kırmak'),
    'ol': ('be/become', 'olmak'),
    'oku': ('read', 'okumak'),
    'otur': ('sit/live', 'oturmak'),
    'oyna': ('play', 'oynamak'),
    'öde': ('pay', 'ödemek'),
    'öğren': ('learn', 'öğrenmek'),
    'öğret': ('teach', 'öğretmek'),
    'öl': ('die', 'ölmek'),
    'paylaş': ('share', 'paylaşmak'),
    'pişir': ('cook', 'pişirmek'),
    'reddet': ('refuse/reject', 'reddetmek'),
    'sakin': ('be calm', 'sakinmek'),
    'sakla': ('hide/store', 'saklamak'),
    'san': ('think/suppose', 'sanmak'),
    'sar': ('wrap', 'sarmak'),
    'sarıl': ('hug', 'sarılmak'),
    'sat': ('sell', 'satmak'),
    'sav': ('claim', 'savmak'),
    'savaş': ('fight', 'savaşmak'),
    'say': ('count/consider', 'saymak'),
    'seç': ('choose', 'seçmek'),
    'sev': ('love', 'sevmek'),
    'sor': ('ask', 'sormak'),
    'sun': ('present/offer', 'sunmak'),
    'sür': ('drive/last', 'sürmek'),
    'söyle': ('tell/say', 'söylemek'),
    'şaşır': ('be surprised', 'şaşırmak'),
    'tanı': ('recognize', 'tanımak'),
    'tanış': ('meet/get acquainted', 'tanışmak'),
    'taşı': ('carry', 'taşımak'),
    'taşın': ('move (house)', 'taşınmak'),
    'temizle': ('clean', 'temizlemek'),
    'topla': ('collect/gather', 'toplamak'),
    'tut': ('hold/catch', 'tutmak'),
    'ulaş': ('reach/arrive', 'ulaşmak'),
    'unu': ('forget', 'unutmak'),
    'unut': ('forget', 'unutmak'),
    'uy': ('sleep/fit', 'uyumak'),
    'uyu': ('sleep', 'uyumak'),
    'uyan': ('wake up', 'uyanmak'),
    'uyar': ('warn', 'uyarmak'),
    'uğraş': ('deal with', 'uğraşmak'),
    'üret': ('produce', 'üretmek'),
    'üzül': ('be sad', 'üzülmek'),
    'var': ('arrive/exist', 'varmak'),
    'vazgeç': ('give up', 'vazgeçmek'),
    'ver': ('give', 'vermek'),
    'vur': ('hit', 'vurmak'),
    'yap': ('do/make', 'yapmak'),
    'yarat': ('create', 'yaratmak'),
    'yardım': ('help', 'yardım etmek'),
    'yat': ('lie down/sleep', 'yatmak'),
    'yaş': ('live', 'yaşamak'),
    'yaşa': ('live', 'yaşamak'),
    'yaz': ('write', 'yazmak'),
    'ye': ('eat', 'yemek'),
    'yi': ('eat', 'yemek'),
    'yetiş': ('arrive/grow up', 'yetişmek'),
    'yetir': ('raise/grow', 'yetiştirmek'),
    'yıka': ('wash', 'yıkamak'),
    'yönet': ('manage', 'yönetmek'),
    'yürü': ('walk', 'yürümek'),
    'yüz': ('swim', 'yüzmek'),
    'ziyaret': ('visit', 'ziyaret etmek'),
    'ağla': ('cry', 'ağlamak'),
    'aç': ('open', 'açmak'),
    'açıkla': ('explain', 'açıklamak'),
    'ayrıl': ('leave/separate', 'ayrılmak'),
}
VERB_DICT.update(EXTRA_VERBS)

# ── Comprehensive known words ────────────────────────────────
# Large database of Turkish words and translations

KNOWN_WORDS = {}

# ── Helper: decode Turkish verb form ─────────────────────────
PERSON_SUFFIXES = {
    'um': 'I', 'ım': 'I', 'üm': 'I', 'im': 'I',
    'sun': 'you', 'sın': 'you', 'sün': 'you', 'sin': 'you',
    'sunuz': 'you (pl.)', 'sınız': 'you (pl.)', 'sünüz': 'you (pl.)', 'siniz': 'you (pl.)',
    'uz': 'we', 'ız': 'we', 'üz': 'we', 'iz': 'we',
    'lar': 'they', 'ler': 'they',
}

TENSE_PATTERNS = [
    # (regex, tense_label, stem_group_idx)
    # Present continuous: stem + ıyor/iyor/uyor/üyor + person
    (r'^(.+?)(ı|i|u|ü)yor(um|sun|sın|uz|ız|sunuz|sınız|lar|ler)?$', 'is {verb}ing', 0),
    # Future: stem + acak/ecek + person
    (r'^(.+?)(a|e)cak(ım|sın|ız|sınız|lar|ler)?$', 'will {verb}', 0),
    # Past definite: stem + dı/di/du/dü/tı/ti/tu/tü + person
    (r'^(.+?)(d|t)(ı|i|u|ü)(m|n|k|nız|niz|lar|ler)?$', '{verb}ed', 0),
    # Reported past: stem + mış/miş/muş/müş + person
    (r'^(.+?)(m)(ı|i|u|ü)(ş)(ım|sın|ız|sınız|lar|ler)?$', 'reportedly {verb}ed', 0),
    # Aorist: stem + r/er/ir/ar + person
    (r'^(.+?)(a|e|ı|i|u|ü)r(ım|sın|ız|sınız|lar|ler)?$', '{verb}s (habitual)', 0),
    # Negative present: stem + mıyor/miyor/muyor/müyor
    (r'^(.+?)(m)(ı|i|u|ü)yor(um|sun|sın|uz|ız|sunuz|sınız|lar|ler)?$', 'is not {verb}ing', 0),
    # Necessity: stem + malı/meli
    (r'^(.+?)(m)(a|e)l(ı|i)(yım|sın|yız|sınız|lar|ler)?$', 'must/should {verb}', 0),
    # Ability: stem + abilir/ebilir
    (r'^(.+?)(a|e)bil(ir|irim|irsin|iriz|irsiniz|irler)?$', 'can {verb}', 0),
    # Inability: stem + amıyor/emiyor or amaz/emez
    (r'^(.+?)(a|e)m(ı|i)yor(um|sun|uz|sunuz|lar|ler)?$', 'cannot {verb}', 0),
    (r'^(.+?)(a|e)m(a|e)(m|z|zsın|yız|zsınız|zlar)?$', 'cannot {verb}', 0),
    # Imperative: stem (bare) or stem + ın/in/un/ün (polite) or stem + iniz etc.
    (r'^(.+?)(y?ın|y?in|y?un|y?ün)(ız)?$', '{verb}! (imperative)', 0),
    # Optative/wish: stem + ayım/eyim/alım/elim/asın/esin
    (r'^(.+?)(a|e)(yım|lım|lim|sın|sin)?$', 'let (me/us) {verb}', 0),
    # Conditional: stem + sa/se + person
    (r'^(.+?)(s)(a|e)(m|n|k|nız|niz|lar|ler)?$', 'if {verb}', 0),
    # Past conditional: stem + saydı/seydi
    (r'^(.+?)(s)(a|e)(ydı|ydi)?$', 'if had {verb}ed', 0),
]

def decode_verb_form(word):
    """Try to decompose a Turkish verb form into stem + translation."""
    for pattern, tense_template, stem_idx in TENSE_PATTERNS:
        m = re.match(pattern, word)
        if m:
            stem = m.group(1)
            # Look up stem in verb dictionary
            if stem in VERB_DICT:
                en_verb, inf = VERB_DICT[stem]
                base_en = en_verb.split('/')[0]  # Take first translation
                translation = tense_template.format(verb=base_en)
                return translation, 'v'
            # Try with consonant mutation reversal
            mutations = {'ğ': 'k', 'b': 'p', 'd': 't', 'c': 'ç'}
            if stem and stem[-1] in mutations:
                mutated = stem[:-1] + mutations[stem[-1]]
                if mutated in VERB_DICT:
                    en_verb, inf = VERB_DICT[mutated]
                    base_en = en_verb.split('/')[0]
                    translation = tense_template.format(verb=base_en)
                    return translation, 'v'
    return None, None


# ── Noun declension decomposition ───────────────────────────
# Known nouns from existing dictionary
NOUN_DICT = {}
for word, entry in existing_entries.items():
    if entry['pos'] in ('n', 'adj', 'adv', 'pron'):
        NOUN_DICT[word] = entry['en']

# Add more common nouns
EXTRA_NOUNS = {
    'acaba': ('I wonder/perhaps', 'adv'),
    'acele': ('hurry/rush', 'n'),
    'acil': ('urgent/emergency', 'adj'),
    'adeta': ('almost/virtually', 'adv'),
    'afiyet': ('appetite/health', 'n'),
    'aile': ('family', 'n'),
    'akraba': ('relative', 'n'),
    'akşamüstü': ('late afternoon', 'n'),
    'alan': ('field/area', 'n'),
    'alışkanlık': ('habit', 'n'),
    'alışveriş': ('shopping', 'n'),
    'alt': ('bottom/lower', 'n'),
    'altın': ('gold', 'n'),
    'anlam': ('meaning', 'n'),
    'anlaşma': ('agreement', 'n'),
    'anı': ('memory/moment', 'n'),
    'arazi': ('land/terrain', 'n'),
    'arka': ('back/rear', 'n'),
    'armut': ('pear', 'n'),
    'asla': ('never', 'adv'),
    'asıl': ('main/actual', 'adj'),
    'avukat': ('lawyer', 'n'),
    'ayar': ('setting/adjustment', 'n'),
    'ayrıntı': ('detail', 'n'),
    'bağlantı': ('connection', 'n'),
    'bakıcı': ('caretaker', 'n'),
    'bakış': ('look/gaze', 'n'),
    'bal': ('honey', 'n'),
    'balkon': ('balcony', 'n'),
    'banka': ('bank', 'n'),
    'basit': ('simple', 'adj'),
    'başarılı': ('successful', 'adj'),
    'başkan': ('president/chairman', 'n'),
    'başkent': ('capital city', 'n'),
    'batı': ('west', 'n'),
    'bayram': ('holiday/festival', 'n'),
    'bel': ('waist', 'n'),
    'belge': ('document', 'n'),
    'belirli': ('certain/specific', 'adj'),
    'benzer': ('similar', 'adj'),
    'beraber': ('together', 'adv'),
    'berber': ('barber', 'n'),
    'beri': ('since', 'postp'),
    'biber': ('pepper', 'n'),
    'bilek': ('wrist', 'n'),
    'bilezik': ('bracelet', 'n'),
    'bilim': ('science', 'n'),
    'bilinç': ('consciousness', 'n'),
    'bira': ('beer', 'n'),
    'biraz': ('a little/some', 'adv'),
    'biri': ('someone/one of', 'pron'),
    'birlik': ('unity', 'n'),
    'bisiklet': ('bicycle', 'n'),
    'bitki': ('plant', 'n'),
    'boğaz': ('throat/strait', 'n'),
    'borç': ('debt', 'n'),
    'boyun': ('neck', 'n'),
    'bravo': ('bravo/well done', 'intj'),
    'buçuk': ('half (past)', 'adj'),
    'bulaşık': ('dirty dishes', 'n'),
    'bulmaca': ('puzzle', 'n'),
    'burası': ('this place/here', 'pron'),
    'böcek': ('insect/bug', 'n'),
    'börek': ('pastry/börek', 'n'),
    'böyle': ('like this/such', 'adv'),
    'böylece': ('thus/so', 'conj'),
    'büro': ('office/bureau', 'n'),
    'büyükanne': ('grandmother', 'n'),
    'büyükbaba': ('grandfather', 'n'),
    'can': ('soul/life', 'n'),
    'canlı': ('alive/lively', 'adj'),
    'ceket': ('jacket', 'n'),
    'cenaze': ('funeral', 'n'),
    'cep': ('pocket', 'n'),
    'cesaret': ('courage', 'n'),
    'cesur': ('brave', 'adj'),
    'ceza': ('punishment', 'n'),
    'ciddi': ('serious', 'adj'),
    'coğrafya': ('geography', 'n'),
    'cumhuriyet': ('republic', 'n'),
    'cüzdan': ('wallet', 'n'),
    'çamaşır': ('laundry', 'n'),
    'çare': ('remedy/solution', 'n'),
    'çarşı': ('bazaar/market', 'n'),
    'çene': ('chin/jaw', 'n'),
    'çeşit': ('kind/variety', 'n'),
    'çeşitli': ('various', 'adj'),
    'çevre': ('environment', 'n'),
    'çikolata': ('chocolate', 'n'),
    'çilek': ('strawberry', 'n'),
    'çorap': ('sock/stocking', 'n'),
    'çorba': ('soup', 'n'),
    'çöl': ('desert', 'n'),
    'çöp': ('garbage/trash', 'n'),
    'daire': ('apartment/circle', 'n'),
    'damat': ('groom/son-in-law', 'n'),
    'damla': ('drop', 'n'),
    'davet': ('invitation', 'n'),
    'davranış': ('behavior', 'n'),
    'defter': ('notebook', 'n'),
    'değer': ('value/worth', 'n'),
    'değerli': ('valuable/precious', 'adj'),
    'dere': ('stream/creek', 'n'),
    'derin': ('deep', 'adj'),
    'dernek': ('association', 'n'),
    'deve': ('camel', 'n'),
    'devam': ('continuation', 'n'),
    'dikkat': ('attention/care', 'n'),
    'dikkatli': ('careful/attentive', 'adj'),
    'direkt': ('direct', 'adj'),
    'dirsek': ('elbow', 'n'),
    'diz': ('knee', 'n'),
    'dizi': ('series/row', 'n'),
    'doğa': ('nature', 'n'),
    'doğal': ('natural', 'adj'),
    'doğru': ('true/correct/toward', 'adj'),
    'doğu': ('east', 'n'),
    'doğum': ('birth', 'n'),
    'dolap': ('cupboard/cabinet', 'n'),
    'dolma': ('stuffed dish', 'n'),
    'dolmuş': ('shared taxi', 'n'),
    'domates': ('tomato', 'n'),
    'dondurma': ('ice cream', 'n'),
    'dost': ('close friend', 'n'),
    'dostluk': ('friendship', 'n'),
    'dua': ('prayer', 'n'),
    'duvar': ('wall', 'n'),
    'duygu': ('emotion/feeling', 'n'),
    'düğün': ('wedding', 'n'),
    'dükkan': ('shop/store', 'n'),
    'dünya': ('world', 'n'),
    'düşman': ('enemy', 'n'),
    'düşünce': ('thought/opinion', 'n'),
    'düz': ('flat/straight', 'adj'),
    'düzen': ('order/arrangement', 'n'),
    'dış': ('outside/exterior', 'n'),
    'dışarıda': ('outside', 'adv'),
    'edebiyat': ('literature', 'n'),
    'eğitim': ('education/training', 'n'),
    'eğlence': ('entertainment/fun', 'n'),
    'eğlenceli': ('fun/entertaining', 'adj'),
    'ekip': ('team', 'n'),
    'ekran': ('screen', 'n'),
    'eksik': ('missing/incomplete', 'adj'),
    'elma': ('apple', 'n'),
    'emek': ('labor/effort', 'n'),
    'emekli': ('retired', 'adj'),
    'emin': ('sure/certain', 'adj'),
    'endişe': ('worry/concern', 'n'),
    'endişeli': ('worried', 'adj'),
    'enerji': ('energy', 'n'),
    'engel': ('obstacle', 'n'),
    'erik': ('plum', 'n'),
    'erken': ('early', 'adv'),
    'eser': ('work (of art)', 'n'),
    'etek': ('skirt', 'n'),
    'etki': ('effect/influence', 'n'),
    'etkili': ('effective', 'adj'),
    'eşek': ('donkey', 'n'),
    'fabrika': ('factory', 'n'),
    'fasulye': ('bean', 'n'),
    'fatura': ('bill/invoice', 'n'),
    'fayda': ('benefit/use', 'n'),
    'fena': ('bad/awful', 'adj'),
    'festival': ('festival', 'n'),
    'fil': ('elephant', 'n'),
    'fincan': ('cup (small)', 'n'),
    'fırın': ('oven/bakery', 'n'),
    'fırtına': ('storm', 'n'),
    'garson': ('waiter', 'n'),
    'gazeteci': ('journalist', 'n'),
    'geç': ('late', 'adj'),
    'geçen': ('last/past', 'adj'),
    'geçici': ('temporary', 'adj'),
    'gelecek': ('future', 'n'),
    'gelenek': ('tradition', 'n'),
    'geleneksel': ('traditional', 'adj'),
    'gelin': ('bride', 'n'),
    'gelir': ('income', 'n'),
    'gelişme': ('development', 'n'),
    'genel': ('general', 'adj'),
    'gerçek': ('real/true', 'adj'),
    'gezi': ('trip/excursion', 'n'),
    'giriş': ('entrance', 'n'),
    'göç': ('migration', 'n'),
    'gök': ('sky', 'n'),
    'gölge': ('shadow/shade', 'n'),
    'görev': ('duty/task', 'n'),
    'görüntü': ('image/appearance', 'n'),
    'görüş': ('view/opinion', 'n'),
    'görüşme': ('meeting', 'n'),
    'gözlük': ('glasses', 'n'),
    'grup': ('group', 'n'),
    'gurur': ('pride', 'n'),
    'güçlü': ('strong/powerful', 'adj'),
    'güncel': ('current/up-to-date', 'adj'),
    'güneşli': ('sunny', 'adj'),
    'güney': ('south', 'n'),
    'güvenli': ('safe/secure', 'adj'),
    'güvenlik': ('security/safety', 'n'),
    'güzellik': ('beauty', 'n'),
    'haber': ('news', 'n'),
    'hadi': ('come on', 'intj'),
    'hakem': ('referee', 'n'),
    'haklı': ('right/justified', 'adj'),
    'hal': ('condition/state', 'n'),
    'halı': ('carpet/rug', 'n'),
    'hamur': ('dough', 'n'),
    'hanım': ('lady/Mrs.', 'n'),
    'hareket': ('movement/action', 'n'),
    'hassas': ('sensitive', 'adj'),
    'hatıra': ('souvenir/memory', 'n'),
    'havlu': ('towel', 'n'),
    'havuç': ('carrot', 'n'),
    'havuz': ('pool', 'n'),
    'hayal': ('dream/imagination', 'n'),
    'haydi': ("come on/let's go", 'intj'),
    'hayırlı': ('auspicious/good', 'adj'),
    'hemşire': ('nurse', 'n'),
    'hesap': ('account/bill', 'n'),
    'heyecan': ('excitement', 'n'),
    'heyecanlı': ('excited/exciting', 'adj'),
    'hile': ('trick/fraud', 'n'),
    'hizmet': ('service', 'n'),
    'hoca': ('teacher/professor', 'n'),
    'hobi': ('hobby', 'n'),
    'hoş': ('pleasant/nice', 'adj'),
    'hukuk': ('law', 'n'),
    'huzur': ('peace/serenity', 'n'),
    'hırsız': ('thief', 'n'),
    'ilan': ('announcement', 'n'),
    'ilginç': ('interesting', 'adj'),
    'ilgili': ('interested/related', 'adj'),
    'ilişki': ('relationship', 'n'),
    'ilkbahar': ('spring', 'n'),
    'imkan': ('opportunity', 'n'),
    'imza': ('signature', 'n'),
    'inanç': ('belief/faith', 'n'),
    'inanılmaz': ('unbelievable', 'adj'),
    'incir': ('fig', 'n'),
    'inek': ('cow', 'n'),
    'internet': ('internet', 'n'),
    'inşaat': ('construction', 'n'),
    'inşallah': ('God willing', 'intj'),
    'isim': ('name', 'n'),
    'istanbul': ('Istanbul', 'n'),
    'işaret': ('sign/signal', 'n'),
    'işçi': ('worker', 'n'),
    'iç': ('inside/interior', 'n'),
    'izin': ('permission', 'n'),
    'kabak': ('zucchini/pumpkin', 'n'),
    'kabul': ('acceptance', 'n'),
    'kafe': ('cafe', 'n'),
    'kağıt': ('paper', 'n'),
    'kahvaltı': ('breakfast', 'n'),
    'kalite': ('quality', 'n'),
    'kamp': ('camp', 'n'),
    'kanal': ('channel', 'n'),
    'kaplan': ('tiger', 'n'),
    'kaplumbağa': ('turtle', 'n'),
    'karar': ('decision', 'n'),
    'karınca': ('ant', 'n'),
    'karlı': ('snowy', 'adj'),
    'karpuz': ('watermelon', 'n'),
    'kasaba': ('town', 'n'),
    'kasap': ('butcher', 'n'),
    'katkı': ('contribution', 'n'),
    'kavga': ('fight/quarrel', 'n'),
    'kavun': ('melon', 'n'),
    'kaya': ('rock', 'n'),
    'kayak': ('ski/skiing', 'n'),
    'kayısı': ('apricot', 'n'),
    'kayıt': ('registration/record', 'n'),
    'kaynak': ('source/resource', 'n'),
    'kaza': ('accident', 'n'),
    'kazak': ('sweater', 'n'),
    'kebap': ('kebab', 'n'),
    'keçi': ('goat', 'n'),
    'kelebek': ('butterfly', 'n'),
    'kemer': ('belt', 'n'),
    'kenar': ('edge/side', 'n'),
    'kent': ('city', 'n'),
    'keşke': ('I wish/if only', 'adv'),
    'kestane': ('chestnut', 'n'),
    'kilim': ('kilim/rug', 'n'),
    'kilo': ('kilogram', 'n'),
    'kiraz': ('cherry', 'n'),
    'kirpik': ('eyelash', 'n'),
    'kişi': ('person', 'n'),
    'koltuk': ('armchair/seat', 'n'),
    'kolye': ('necklace', 'n'),
    'komik': ('funny', 'adj'),
    'konser': ('concert', 'n'),
    'konuk': ('guest', 'n'),
    'konuşma': ('speech/conversation', 'n'),
    'koridor': ('corridor/hallway', 'n'),
    'koruma': ('protection/guard', 'n'),
    'koşul': ('condition', 'n'),
    'koyun': ('sheep', 'n'),
    'kravat': ('tie', 'n'),
    'kreş': ('daycare', 'n'),
    'kumaş': ('fabric', 'n'),
    'kumsal': ('sandy beach', 'n'),
    'kurabiye': ('cookie', 'n'),
    'kural': ('rule', 'n'),
    'kurs': ('course', 'n'),
    'kurum': ('institution', 'n'),
    'kurt': ('wolf', 'n'),
    'kutu': ('box', 'n'),
    'kuzey': ('north', 'n'),
    'küpe': ('earring', 'n'),
    'kıyı': ('shore/coast', 'n'),
    'kış': ('winter', 'n'),
    'köfte': ('meatball', 'n'),
    'köy': ('village', 'n'),
    'laf': ('word/talk', 'n'),
    'lahana': ('cabbage', 'n'),
    'lamba': ('lamp', 'n'),
    'lazım': ('necessary/needed', 'adj'),
    'lezzetli': ('delicious', 'adj'),
    'lider': ('leader', 'n'),
    'limon': ('lemon', 'n'),
    'limonata': ('lemonade', 'n'),
    'lira': ('lira', 'n'),
    'lise': ('high school', 'n'),
    'lokanta': ('restaurant', 'n'),
    'mahalle': ('neighborhood', 'n'),
    'makine': ('machine', 'n'),
    'malzeme': ('material/ingredient', 'n'),
    'manzara': ('view/scenery', 'n'),
    'market': ('supermarket', 'n'),
    'maşallah': ('wonderful', 'intj'),
    'maymun': ('monkey', 'n'),
    'meğer': ('it turns out', 'conj'),
    'mekan': ('place/venue', 'n'),
    'memnun': ('pleased/satisfied', 'adj'),
    'memur': ('civil servant', 'n'),
    'merak': ('curiosity', 'n'),
    'meraklı': ('curious', 'adj'),
    'mercimek': ('lentil', 'n'),
    'merdiven': ('stairs/ladder', 'n'),
    'merkez': ('center', 'n'),
    'mesafe': ('distance', 'n'),
    'meslek': ('profession', 'n'),
    'meşhur': ('famous', 'adj'),
    'mevsim': ('season', 'n'),
    'meydan': ('square/plaza', 'n'),
    'mısır': ('corn', 'n'),
    'mimar': ('architect', 'n'),
    'misafir': ('guest', 'n'),
    'modern': ('modern', 'adj'),
    'mola': ('break/rest', 'n'),
    'mont': ('coat/jacket', 'n'),
    'muz': ('banana', 'n'),
    'mühendis': ('engineer', 'n'),
    'müşteri': ('customer', 'n'),
    'müze': ('museum', 'n'),
    'nar': ('pomegranate', 'n'),
    'nefes': ('breath', 'n'),
    'nemli': ('humid', 'adj'),
    'nesil': ('generation', 'n'),
    'nihayet': ('finally', 'adv'),
    'nişan': ('engagement', 'n'),
    'nohut': ('chickpea', 'n'),
    'olay': ('event/incident', 'n'),
    'olumlu': ('positive', 'adj'),
    'olumsuz': ('negative', 'adj'),
    'omuz': ('shoulder', 'n'),
    'onay': ('approval', 'n'),
    'orta': ('middle/medium', 'n'),
    'ortak': ('partner/common', 'n'),
    'ortam': ('environment', 'n'),
    'otopark': ('parking lot', 'n'),
    'ova': ('plain', 'n'),
    'oyuncu': ('player/actor', 'n'),
    'ödev': ('homework', 'n'),
    'ödül': ('prize/award', 'n'),
    'öğün': ('meal', 'n'),
    'ön': ('front', 'n'),
    'öneri': ('suggestion', 'n'),
    'önlem': ('measure/precaution', 'n'),
    'öte': ('beyond', 'n'),
    'öykü': ('story/tale', 'n'),
    'özel': ('private/special', 'adj'),
    'özgürlük': ('freedom', 'n'),
    'özlem': ('longing/yearning', 'n'),
    'pahalı': ('expensive', 'adj'),
    'paket': ('package', 'n'),
    'parça': ('piece/part', 'n'),
    'parti': ('party', 'n'),
    'pasta': ('cake', 'n'),
    'patates': ('potato', 'n'),
    'patlıcan': ('eggplant', 'n'),
    'perde': ('curtain', 'n'),
    'personel': ('personnel/staff', 'n'),
    'pide': ('flatbread', 'n'),
    'piknik': ('picnic', 'n'),
    'pilav': ('rice pilaf', 'n'),
    'pişman': ('regretful', 'adj'),
    'plaj': ('beach', 'n'),
    'polis': ('police', 'n'),
    'portakal': ('orange (fruit)', 'n'),
    'posta': ('mail/post', 'n'),
    'program': ('program', 'n'),
    'rahat': ('comfortable', 'adj'),
    'randevu': ('appointment', 'n'),
    'reçel': ('jam', 'n'),
    'rehber': ('guide', 'n'),
    'ressam': ('painter/artist', 'n'),
    'roman': ('novel', 'n'),
    'sabun': ('soap', 'n'),
    'sabırlı': ('patient', 'adj'),
    'sade': ('plain/simple', 'adj'),
    'sağ': ('right/alive', 'adj'),
    'sahil': ('coast/shore', 'n'),
    'sahip': ('owner/possessing', 'n'),
    'sakin': ('calm/quiet', 'adj'),
    'salata': ('salad', 'n'),
    'salon': ('hall/living room', 'n'),
    'sanat': ('art', 'n'),
    'sanatçı': ('artist', 'n'),
    'sarılmak': ('to hug', 'v'),
    'sarımsak': ('garlic', 'n'),
    'satıcı': ('seller/vendor', 'n'),
    'sayfa': ('page', 'n'),
    'saygı': ('respect', 'n'),
    'saygılı': ('respectful', 'adj'),
    'sayı': ('number', 'n'),
    'sebep': ('reason/cause', 'n'),
    'seçenek': ('option/choice', 'n'),
    'sene': ('year', 'n'),
    'serin': ('cool', 'adj'),
    'sergi': ('exhibition', 'n'),
    'serüven': ('adventure', 'n'),
    'sevgili': ('dear/beloved', 'adj'),
    'sevinç': ('joy', 'n'),
    'seyahat': ('travel/journey', 'n'),
    'sigara': ('cigarette', 'n'),
    'simit': ('sesame bread ring', 'n'),
    'sinir': ('nerve/anger', 'n'),
    'sisli': ('foggy', 'adj'),
    'soğan': ('onion', 'n'),
    'sol': ('left', 'adj'),
    'sonbahar': ('autumn/fall', 'n'),
    'sonuç': ('result', 'n'),
    'sorumlu': ('responsible', 'adj'),
    'sorumluluk': ('responsibility', 'n'),
    'sözleşme': ('contract', 'n'),
    'staj': ('internship', 'n'),
    'suç': ('crime', 'n'),
    'sunum': ('presentation', 'n'),
    'sürpriz': ('surprise', 'n'),
    'şaka': ('joke', 'n'),
    'şarap': ('wine', 'n'),
    'şef': ('chef/chief', 'n'),
    'şemsiye': ('umbrella', 'n'),
    'şiir': ('poem/poetry', 'n'),
    'şikayet': ('complaint', 'n'),
    'şoför': ('driver', 'n'),
    'şüphe': ('doubt', 'n'),
    'tahmin': ('guess/estimate', 'n'),
    'takım': ('team/set', 'n'),
    'talep': ('demand/request', 'n'),
    'tamir': ('repair', 'n'),
    'tanık': ('witness', 'n'),
    'tanıtım': ('promotion', 'n'),
    'tarif': ('recipe/directions', 'n'),
    'tarla': ('field (agriculture)', 'n'),
    'tavsiye': ('advice/recommendation', 'n'),
    'tavşan': ('rabbit', 'n'),
    'taze': ('fresh', 'adj'),
    'tehlike': ('danger', 'n'),
    'tehlikeli': ('dangerous', 'adj'),
    'teklif': ('offer/proposal', 'n'),
    'tekne': ('boat', 'n'),
    'teknoloji': ('technology', 'n'),
    'televizyon': ('television', 'n'),
    'temel': ('foundation/basic', 'n'),
    'temizlik': ('cleanliness', 'n'),
    'tepe': ('hill', 'n'),
    'tereyağı': ('butter', 'n'),
    'terlik': ('slipper', 'n'),
    'terzi': ('tailor', 'n'),
    'tilki': ('fox', 'n'),
    'tırnak': ('nail/fingernail', 'n'),
    'toplum': ('society', 'n'),
    'turist': ('tourist', 'n'),
    'turşu': ('pickle', 'n'),
    'tutku': ('passion', 'n'),
    'türkçe': ('Turkish language', 'n'),
    'ucuz': ('cheap', 'adj'),
    'ufak': ('tiny/small', 'adj'),
    'ulaşım': ('transportation', 'n'),
    'uluslararası': ('international', 'adj'),
    'uygun': ('suitable/appropriate', 'adj'),
    'uyku': ('sleep', 'n'),
    'uzak': ('far/distant', 'adj'),
    'uzay': ('space (outer)', 'n'),
    'uzman': ('expert/specialist', 'n'),
    'ürün': ('product', 'n'),
    'üst': ('top/upper', 'n'),
    'üye': ('member', 'n'),
    'üzüm': ('grape', 'n'),
    'vadi': ('valley', 'n'),
    'varlık': ('existence/wealth', 'n'),
    'vatan': ('homeland', 'n'),
    'vatandaş': ('citizen', 'n'),
    'vergi': ('tax', 'n'),
    'yabancı': ('foreigner/foreign', 'n'),
    'yakın': ('close/near', 'adj'),
    'yakıt': ('fuel', 'n'),
    'yalnız': ('alone/only', 'adj'),
    'yan': ('side', 'n'),
    'yapı': ('structure/building', 'n'),
    'yaprak': ('leaf', 'n'),
    'yaratıcı': ('creative', 'adj'),
    'yarış': ('race/competition', 'n'),
    'yasak': ('forbidden/ban', 'adj'),
    'yastık': ('pillow', 'n'),
    'yatırım': ('investment', 'n'),
    'yaz': ('summer', 'n'),
    'yazar': ('writer/author', 'n'),
    'yemin': ('oath', 'n'),
    'yerel': ('local', 'adj'),
    'yetenek': ('talent/ability', 'n'),
    'yetenekli': ('talented', 'adj'),
    'yeterli': ('sufficient/enough', 'adj'),
    'yetişkin': ('adult', 'n'),
    'yoğun': ('intense/busy', 'adj'),
    'yoğurt': ('yogurt', 'n'),
    'yolcu': ('passenger', 'n'),
    'yolculuk': ('journey/travel', 'n'),
    'yön': ('direction', 'n'),
    'yönetici': ('manager', 'n'),
    'yönetim': ('management', 'n'),
    'yüksek': ('high/tall', 'adj'),
    'yürek': ('heart (emotional)', 'n'),
    'yüzme': ('swimming', 'n'),
    'yüzük': ('ring', 'n'),
    'zafer': ('victory', 'n'),
    'zaten': ('already/anyway', 'adv'),
    'zarar': ('harm/damage', 'n'),
    'zeka': ('intelligence', 'n'),
    'zenginlik': ('wealth', 'n'),
    'zeytin': ('olive', 'n'),
    'zil': ('bell/doorbell', 'n'),
    'zorluk': ('difficulty', 'n'),
    'zorunlu': ('mandatory', 'adj'),

    # Question particles
    'mi': ('(question particle)', 'part'),
    'mı': ('(question particle)', 'part'),
    'mu': ('(question particle)', 'part'),
    'mü': ('(question particle)', 'part'),

    # Copula
    'dır': ('is (copula)', 'part'),
    'dir': ('is (copula)', 'part'),

    # Place names
    'istanbul': ('Istanbul', 'n'),
    'ankara': ('Ankara', 'n'),
    'izmir': ('Izmir', 'n'),
    'antalya': ('Antalya', 'n'),
    'türkiye': ('Turkey', 'n'),
    'kapadokya': ('Cappadocia', 'n'),
    'bursa': ('Bursa', 'n'),
    'trabzon': ('Trabzon', 'n'),
    'adana': ('Adana', 'n'),
    'bodrum': ('Bodrum', 'n'),
    'efes': ('Ephesus', 'n'),
    'pamukkale': ('Pamukkale', 'n'),

    # Months
    'ocak': ('January', 'n'),
    'şubat': ('February', 'n'),
    'mart': ('March', 'n'),
    'nisan': ('April', 'n'),
    'mayıs': ('May', 'n'),
    'haziran': ('June', 'n'),
    'temmuz': ('July', 'n'),
    'ağustos': ('August', 'n'),
    'eylül': ('September', 'n'),
    'ekim': ('October', 'n'),
    'kasım': ('November', 'n'),
    'aralık': ('December/interval', 'n'),
}

# Merge EXTRA_NOUNS into NOUN_DICT
for word, (en, pos) in EXTRA_NOUNS.items():
    if word not in NOUN_DICT:
        NOUN_DICT[word] = en

# ── Noun suffix stripping and translation ────────────────────
NOUN_SUFFIXES = [
    # Longest first for greedy matching
    # Plural + possessive + case
    ('larından', 'from their {noun}s'),
    ('lerinden', 'from their {noun}s'),
    ('larınızı', 'your {noun}s (acc.)'),
    ('lerinizi', 'your {noun}s (acc.)'),
    ('larımızı', 'our {noun}s (acc.)'),
    ('lerimizi', 'our {noun}s (acc.)'),
    ('larımız', 'our {noun}s'),
    ('lerimiz', 'our {noun}s'),
    ('larınız', 'your {noun}s'),
    ('leriniz', 'your {noun}s'),
    ('larında', 'in their {noun}s'),
    ('lerinde', 'in their {noun}s'),
    ('larından', 'from their {noun}s'),
    ('lerinden', 'from their {noun}s'),
    ('larına', 'to their {noun}s'),
    ('lerine', 'to their {noun}s'),
    ('larını', 'their {noun}s (acc.)'),
    ('lerini', 'their {noun}s (acc.)'),
    ('ların', 'of the {noun}s'),
    ('lerin', 'of the {noun}s'),
    ('ları', 'the {noun}s'),
    ('leri', 'the {noun}s'),
    ('larda', 'in the {noun}s'),
    ('lerde', 'in the {noun}s'),
    ('lardan', 'from the {noun}s'),
    ('lerden', 'from the {noun}s'),
    ('lara', 'to the {noun}s'),
    ('lere', 'to the {noun}s'),
    ('lar', '{noun}s'),
    ('ler', '{noun}s'),
    # Possessive + case
    ('ımda', 'in my {noun}'),
    ('imde', 'in my {noun}'),
    ('umda', 'in my {noun}'),
    ('ümde', 'in my {noun}'),
    ('ımdan', 'from my {noun}'),
    ('imden', 'from my {noun}'),
    ('ıma', 'to my {noun}'),
    ('ime', 'to my {noun}'),
    ('ımı', 'my {noun} (acc.)'),
    ('imi', 'my {noun} (acc.)'),
    ('ımız', 'our {noun}'),
    ('imiz', 'our {noun}'),
    ('umuz', 'our {noun}'),
    ('ümüz', 'our {noun}'),
    ('ınız', 'your {noun}'),
    ('iniz', 'your {noun}'),
    ('unuz', 'your {noun}'),
    ('ünüz', 'your {noun}'),
    ('ında', 'in his/her {noun}'),
    ('inde', 'in his/her {noun}'),
    ('unda', 'in his/her {noun}'),
    ('ünde', 'in his/her {noun}'),
    ('ından', 'from his/her {noun}'),
    ('inden', 'from his/her {noun}'),
    ('ına', 'to his/her {noun}'),
    ('ine', 'to his/her {noun}'),
    ('una', 'to his/her {noun}'),
    ('üne', 'to his/her {noun}'),
    ('sına', 'to his/her {noun}'),
    ('sine', 'to his/her {noun}'),
    ('sını', 'his/her {noun} (acc.)'),
    ('sini', 'his/her {noun} (acc.)'),
    ('sından', 'from his/her {noun}'),
    ('sinden', 'from his/her {noun}'),
    ('sında', 'in his/her {noun}'),
    ('sinde', 'in his/her {noun}'),
    # Buffer + possessive
    ('nda', 'in the {noun}'),
    ('nde', 'in the {noun}'),
    ('ndan', 'from the {noun}'),
    ('nden', 'from the {noun}'),
    ('nın', 'of the {noun}'),
    ('nin', 'of the {noun}'),
    ('nun', 'of the {noun}'),
    ('nün', 'of the {noun}'),
    ('na', 'to the {noun}'),
    ('ne', 'to the {noun}'),
    # Simple case
    ('dan', 'from {noun}'),
    ('den', 'from {noun}'),
    ('tan', 'from {noun}'),
    ('ten', 'from {noun}'),
    ('da', 'in/at {noun}'),
    ('de', 'in/at {noun}'),
    ('ta', 'in/at {noun}'),
    ('te', 'in/at {noun}'),
    ('ya', 'to {noun}'),
    ('ye', 'to {noun}'),
    # Possessive markers
    ('ım', 'my {noun}'),
    ('im', 'my {noun}'),
    ('um', 'my {noun}'),
    ('üm', 'my {noun}'),
    ('sı', 'his/her {noun}'),
    ('si', 'his/her {noun}'),
    ('su', 'his/her {noun}'),
    ('sü', 'his/her {noun}'),
    # Accusative
    ('nı', 'the {noun} (acc.)'),
    ('ni', 'the {noun} (acc.)'),
    ('nu', 'the {noun} (acc.)'),
    ('nü', 'the {noun} (acc.)'),
    ('ı', 'the {noun} (acc.)'),
    ('i', 'the {noun} (acc.)'),
    ('u', 'the {noun} (acc.)'),
    ('ü', 'the {noun} (acc.)'),
    # Genitive
    ('ın', 'of {noun}'),
    ('in', 'of {noun}'),
    ('un', 'of {noun}'),
    ('ün', 'of {noun}'),
    # Instrumental (postposition "ile" contracts to suffix)
    ('yla', 'with {noun}'),
    ('yle', 'with {noun}'),
    ('la', 'with {noun}'),
    ('le', 'with {noun}'),
]

CONSONANT_MUTATIONS = {'ğ': 'k', 'b': 'p', 'd': 't', 'c': 'ç'}

def find_noun_base(word):
    """Try to find the base noun and generate translation."""
    for suffix, template in NOUN_SUFFIXES:
        if word.endswith(suffix) and len(word) > len(suffix) + 1:
            stem = word[:-len(suffix)]
            # Direct lookup
            if stem in NOUN_DICT:
                return NOUN_DICT[stem], template.format(noun=NOUN_DICT[stem]), stem
            # Consonant mutation
            if stem and stem[-1] in CONSONANT_MUTATIONS:
                mutated = stem[:-1] + CONSONANT_MUTATIONS[stem[-1]]
                if mutated in NOUN_DICT:
                    return NOUN_DICT[mutated], template.format(noun=NOUN_DICT[mutated]), mutated
            # Buffer consonant removal (y, n, s)
            if stem and stem[-1] in 'yns' and len(stem) > 2:
                no_buf = stem[:-1]
                if no_buf in NOUN_DICT:
                    return NOUN_DICT[no_buf], template.format(noun=NOUN_DICT[no_buf]), no_buf
    return None, None, None


# ── Build co-occurrence map for remaining unknowns ───────────
tr_en_cooccurrence = defaultdict(Counter)
for card in deck:
    tr_text = card.get('target', '')
    en_text = card.get('english', '')
    tr_words_card = re.sub(r'[.,!?;:"""\u201c\u201d\u2018\u2019()\u2014\u2013\-\u2026\u00ab\u00bb\[\]{}]', ' ', tr_text).lower().split()
    en_words_card = re.sub(r'[.,!?;:"""\u201c\u201d\u2018\u2019()\u2014\u2013\-\u2026\u00ab\u00bb\[\]{}]', ' ', en_text).lower().split()
    for tw in set(tr_words_card):
        for ew in set(en_words_card):
            tr_en_cooccurrence[tw.strip()][ew.strip()] += 1

ENGLISH_STOP = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                'to', 'of', 'in', 'at', 'on', 'for', 'with', 'and', 'or', 'but',
                'it', 'its', 'my', 'your', 'his', 'her', 'our', 'their', 'him', 'them',
                'i', 'you', 'he', 'she', 'we', 'they', 'me', 'us',
                'this', 'that', 'these', 'those', 'not', 'do', 'does', 'did',
                'have', 'has', 'had', 'will', 'would', 'should', 'could', 'can', 'may',
                'very', 'so', 'too', 'also', 'just', 'even', 'still', 'only',
                'if', 'then', 'than', 'when', 'where', 'how', 'what', 'who', 'which',
                'no', 'yes', 'been', 'am', 'about', 'from', 'up', 'out',
                'more', 'some', 'any', 'all', 'each', 'every', 'both',
                'here', 'there', 'now', 'then', 'after', 'before',
                'much', 'many', 'most', 'such', 'other', 'new', 'old',
                'get', 'got', 'make', 'go', 'going', 'went', 'come', 'came',
                'take', 'give', 'know', 'like', 'want', 'need',
                'into', 'over', 'under', 'between', 'through',
                'back', 'down', 'well', 'really', 'already', 'again',
                "don't", "doesn't", "didn't", "won't", "can't",
                'because', 'while', 'since', 'during', 'until'}

def get_cooccurrence_translation(word, min_count=2):
    """Get best translation from co-occurrence, with quality filters."""
    if word not in tr_en_cooccurrence:
        return None

    candidates = []
    total = sum(tr_en_cooccurrence[word].values())
    for ew, count in tr_en_cooccurrence[word].most_common(30):
        if ew.strip() not in ENGLISH_STOP and len(ew) > 2 and count >= min_count:
            # Calculate PMI-like score (how much more this pair co-occurs vs random)
            candidates.append((ew, count, count / total))

    if not candidates:
        return None

    # Take the top candidate
    best = candidates[0][0]
    return best


# ── Infer POS from Turkish morphology ────────────────────────
def infer_pos(word):
    if word.endswith(('mak', 'mek')):
        return 'v'
    verb_endings = (
        'yor', 'yorum', 'yorsun', 'yoruz', 'yorsunuz', 'yorlar',
        'dım', 'dim', 'dum', 'düm', 'dın', 'din', 'dun', 'dün',
        'dı', 'di', 'du', 'dü', 'tı', 'ti', 'tu', 'tü',
        'mış', 'miş', 'muş', 'müş',
        'acak', 'ecek',
        'malı', 'meli',
    )
    if word.endswith(verb_endings):
        return 'v'
    if word.endswith(('lık', 'lik', 'luk', 'lük')):
        return 'n'
    if word.endswith(('lı', 'li', 'lu', 'lü', 'sız', 'siz', 'suz', 'süz')):
        return 'adj'
    if word.endswith(('ca', 'ce', 'ça', 'çe')) and len(word) > 4:
        return 'adv'
    if word.endswith(('cı', 'ci', 'cu', 'cü', 'çı', 'çi', 'çu', 'çü')):
        return 'n'
    return 'n'


# ── Generate all missing entries ─────────────────────────────
new_entries = {}
stats = {'known': 0, 'verb_decode': 0, 'noun_decode': 0, 'cooccurrence': 0, 'unknown': 0}

for word in sorted(missing):
    # Handle proper nouns with apostrophes
    if "'" in word:
        base = word.split("'")[0]
        suffix = word.split("'", 1)[1]
        base_name = NOUN_DICT.get(base, EXTRA_NOUNS.get(base, (base, 'n'))[0] if base in EXTRA_NOUNS else base.capitalize())
        if isinstance(base_name, tuple):
            base_name = base_name[0]
        sfx_map = {
            'da': f'in {base_name}', 'de': f'in {base_name}',
            'dan': f'from {base_name}', 'den': f'from {base_name}',
            'ya': f'to {base_name}', 'ye': f'to {base_name}',
            'a': f'to {base_name}', 'e': f'to {base_name}',
            'nın': f'of {base_name}', 'nin': f'of {base_name}',
            'daki': f'in {base_name} (adj.)', 'deki': f'in {base_name} (adj.)',
            'ı': f'{base_name} (acc.)', 'i': f'{base_name} (acc.)',
        }
        en = sfx_map.get(suffix, base_name)
        new_entries[word] = {'en': en, 'ipa': turkish_ipa(word.replace("'", "")), 'pos': 'n'}
        stats['noun_decode'] += 1
        continue

    # 1. Check extra known words
    if word in EXTRA_NOUNS:
        en, pos = EXTRA_NOUNS[word]
        new_entries[word] = {'en': en, 'ipa': turkish_ipa(word), 'pos': pos}
        stats['known'] += 1
        continue

    # 2. Try verb form decomposition
    verb_en, verb_pos = decode_verb_form(word)
    if verb_en:
        new_entries[word] = {'en': verb_en, 'ipa': turkish_ipa(word), 'pos': 'v'}
        stats['verb_decode'] += 1
        continue

    # 3. Try noun declension
    base_en, full_en, base_word = find_noun_base(word)
    if full_en:
        new_entries[word] = {'en': full_en, 'ipa': turkish_ipa(word), 'pos': infer_pos(word) if infer_pos(word) != 'n' else 'n'}
        stats['noun_decode'] += 1
        continue

    # 4. Use co-occurrence
    cooc_en = get_cooccurrence_translation(word)
    if cooc_en:
        new_entries[word] = {'en': cooc_en, 'ipa': turkish_ipa(word), 'pos': infer_pos(word)}
        stats['cooccurrence'] += 1
        continue

    # 5. Unknown - use the word itself
    new_entries[word] = {'en': word, 'ipa': turkish_ipa(word), 'pos': infer_pos(word)}
    stats['unknown'] += 1

print(f"\nGeneration stats:")
print(f"  Known words: {stats['known']}")
print(f"  Verb decomposition: {stats['verb_decode']}")
print(f"  Noun decomposition: {stats['noun_decode']}")
print(f"  Co-occurrence: {stats['cooccurrence']}")
print(f"  Unknown (word as translation): {stats['unknown']}")
print(f"  Total new: {len(new_entries)}")

# ── Merge with existing entries ──────────────────────────────
all_entries = dict(existing_entries)
for word, entry in new_entries.items():
    if word not in all_entries:
        all_entries[word] = entry

print(f"\nTotal entries: {len(all_entries)}")

# Coverage
covered = sum(1 for w in deck_words if w in all_entries)
print(f"Coverage: {covered}/{len(deck_words)} = {covered/len(deck_words)*100:.1f}%")

# ── Write output ─────────────────────────────────────────────
# Organize by POS
categories = {
    'v': ('Verbs', {}),
    'n': ('Nouns', {}),
    'adj': ('Adjectives', {}),
    'adv': ('Adverbs', {}),
    'pron': ('Pronouns', {}),
    'conj': ('Conjunctions', {}),
    'postp': ('Postpositions', {}),
    'num': ('Numbers', {}),
    'part': ('Particles', {}),
    'intj': ('Interjections', {}),
}

for word, entry in sorted(all_entries.items()):
    pos = entry['pos']
    if pos in categories:
        categories[pos][1][word] = entry
    else:
        categories['n'][1][word] = entry  # default to nouns

def escape_ts(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")

def write_section(entries):
    lines = []
    for word, entry in sorted(entries.items()):
        w = escape_ts(word)
        en = escape_ts(entry['en'])
        ipa = entry['ipa']
        pos = entry['pos']
        lines.append(f"  '{w}': {{ en: '{en}', ipa: '{ipa}', pos: '{pos}' }},")
    return '\n'.join(lines)

sections = []
for pos_key in ['v', 'n', 'adj', 'adv', 'pron', 'conj', 'postp', 'num', 'part', 'intj']:
    label, entries = categories[pos_key]
    if entries:
        sections.append(f"  // ── {label} ─────────────────────────────────────────────────")
        sections.append(write_section(entries))

output = f"""import type {{ DictEntry }} from './es';
import {{ findInfinitive }} from '../conjugation/tr';

// ── Turkish Dictionary ────────────────────────────────────────
// Keys are lowercase Turkish (with ç, ğ, ı, ö, ş, ü).
// Each entry: {{ en: 'English translation', ipa: 'IPA pronunciation', pos: 'part of speech' }}
const dictionary: Record<string, DictEntry> = {{
{chr(10).join(sections)}
}};

{suffix_code}"""

with open('src/data/dictionary/tr.ts', 'w') as f:
    f.write(output)

print(f"\nWrote {len(all_entries)} entries to src/data/dictionary/tr.ts")
print("Done!")
