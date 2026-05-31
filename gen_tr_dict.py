#!/usr/bin/env python3
"""
Generate expanded Turkish dictionary entries for all unique words in the deck.
Outputs a complete tr.ts file with all existing + new entries.
"""

import json
import re
import sys

# ── Load deck ────────────────────────────────────────────────
with open('src/data/turkish/deck.json') as f:
    deck = json.load(f)

# ── Load existing dictionary keys ────────────────────────────
with open('src/data/dictionary/tr.ts') as f:
    ts_content = f.read()

existing_keys = set()
for m in re.finditer(r"'([^']+)':\s*\{\s*en:", ts_content):
    existing_keys.add(m.group(1))

print(f"Existing dictionary entries: {len(existing_keys)}")

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

# ── Find missing words ───────────────────────────────────────
missing = deck_words - existing_keys
print(f"Missing words: {len(missing)}")

# ── Turkish IPA generation ───────────────────────────────────
# Turkish is largely phonetic, so we can generate reasonable IPA
IPA_MAP = {
    'a': 'ɑ', 'b': 'b', 'c': 'dʒ', 'ç': 'tʃ', 'd': 'd',
    'e': 'e', 'f': 'f', 'g': 'ɡ', 'ğ': 'ː', 'h': 'h',
    'ı': 'ɯ', 'i': 'i', 'j': 'ʒ', 'k': 'k', 'l': 'l',
    'm': 'm', 'n': 'n', 'o': 'o', 'ö': 'œ', 'p': 'p',
    'r': 'ɾ', 's': 's', 'ş': 'ʃ', 't': 't', 'u': 'u',
    'ü': 'y', 'v': 'v', 'y': 'j', 'z': 'z',
}

VOWELS = set('aeıioöuü')

def turkish_ipa(word):
    """Generate reasonable IPA for a Turkish word."""
    ipa_chars = []
    for ch in word:
        if ch in IPA_MAP:
            ipa_chars.append(IPA_MAP[ch])
        elif ch == "'":
            continue  # skip apostrophes (proper nouns)
        else:
            ipa_chars.append(ch)

    # Add syllable boundaries
    ipa = ''.join(ipa_chars)

    # Simple syllabification: insert dots before consonant+vowel sequences
    result = []
    chars = list(ipa)
    i = 0
    syllable_count = 0
    while i < len(chars):
        if chars[i] in 'ɑeiɯoœuy' and i > 0:
            # Check if previous char is a consonant and we're starting a new syllable
            prev_is_vowel = False
            if result:
                last = result[-1]
                prev_is_vowel = last in 'ɑeiɯoœuy'
            if not prev_is_vowel and syllable_count > 0:
                # Look back to find where to insert the dot
                # Before the consonant cluster preceding this vowel
                insert_pos = len(result)
                while insert_pos > 0 and result[insert_pos-1] not in 'ɑeiɯoœuy.':
                    insert_pos -= 1
                if insert_pos > 0 and insert_pos < len(result):
                    result.insert(insert_pos, '.')
            syllable_count += 1
        elif chars[i] in 'ɑeiɯoœuy':
            syllable_count += 1
        result.append(chars[i])
        i += 1

    return '/' + ''.join(result) + '/'


# ── Translation + POS knowledge base ────────────────────────
# We'll use context from the deck's English translations to help.
# Build a word->translation map from deck cards.

# First, gather all deck translations paired with Turkish text
word_translations = {}
word_contexts = {}  # Store English for context

for card in deck:
    tr_text = card.get('target', '')
    en_text = card.get('english', '')

    tr_words = re.sub(r'[.,!?;:"""\u201c\u201d\u2018\u2019()\u2014\u2013\-\u2026\u00ab\u00bb\[\]{}]', ' ', tr_text).split()
    en_words = re.sub(r'[.,!?;:"""\u201c\u201d\u2018\u2019()\u2014\u2013\-\u2026\u00ab\u00bb\[\]{}]', ' ', en_text).split()

    for w in tr_words:
        wl = w.strip().lower()
        if wl and wl not in word_contexts:
            word_contexts[wl] = en_text

# ── Comprehensive Turkish word knowledge base ────────────────
# This is a large mapping of common Turkish words and their translations.
# Covers verb forms, suffixed nouns, common words, etc.

KNOWN_WORDS = {
    # ── Common words not in base dict ──────────────
    'acaba': ('I wonder/perhaps', 'adv'),
    'acele': ('hurry/rush', 'n'),
    'acil': ('urgent/emergency', 'adj'),
    'acı': ('pain/bitter/spicy', 'n'),
    'acılar': ('pains/sorrows', 'n'),
    'adet': ('number/custom/piece', 'n'),
    'adeta': ('almost/virtually', 'adv'),
    'afiyet': ('health/appetite', 'n'),
    'ağabey': ('older brother', 'n'),
    'ağır': ('heavy/slow', 'adj'),
    'ağırlık': ('weight', 'n'),
    'akıl': ('mind/intelligence', 'n'),
    'akraba': ('relative/kin', 'n'),
    'aksi': ('contrary/opposite', 'adj'),
    'aktif': ('active', 'adj'),
    'alan': ('field/area', 'n'),
    'alışveriş': ('shopping', 'n'),
    'alışmak': ('to get used to', 'v'),
    'alt': ('bottom/lower', 'n'),
    'altın': ('gold', 'n'),
    'anlam': ('meaning', 'n'),
    'anlatmak': ('to tell/explain', 'v'),
    'anlaşma': ('agreement', 'n'),
    'anı': ('memory/moment', 'n'),
    'araba': ('car', 'n'),
    'aramak': ('to search/call', 'v'),
    'arası': ('between/interval', 'n'),
    'arazi': ('land/terrain', 'n'),
    'armut': ('pear', 'n'),
    'artı': ('plus/positive', 'n'),
    'artmak': ('to increase', 'v'),
    'asla': ('never', 'adv'),
    'asıl': ('main/actual', 'adj'),
    'ateş': ('fire/fever', 'n'),
    'atmosfer': ('atmosphere', 'n'),
    'avukat': ('lawyer', 'n'),
    'ayar': ('setting/adjustment', 'n'),
    'ayrılık': ('separation', 'n'),
    'ayrıntı': ('detail', 'n'),
    'azaltmak': ('to reduce', 'v'),
    'bağırmak': ('to shout', 'v'),
    'bağlamak': ('to tie/connect', 'v'),
    'bağlantı': ('connection', 'n'),
    'bakıcı': ('caretaker', 'n'),
    'bakış': ('look/gaze', 'n'),
    'balkon': ('balcony', 'n'),
    'banka': ('bank', 'n'),
    'bardak': ('glass/cup', 'n'),
    'basit': ('simple', 'adj'),
    'basamak': ('step/stair', 'n'),
    'baş': ('head/beginning', 'n'),
    'başarılı': ('successful', 'adj'),
    'başbakan': ('prime minister', 'n'),
    'başkan': ('president/chairman', 'n'),
    'başkent': ('capital city', 'n'),
    'bayram': ('holiday/festival', 'n'),
    'bebek': ('baby', 'n'),
    'beğenmek': ('to like/approve', 'v'),
    'belge': ('document', 'n'),
    'belirli': ('certain/specific', 'adj'),
    'benzer': ('similar', 'adj'),
    'beraber': ('together', 'adv'),
    'beri': ('since', 'postp'),
    'beslemek': ('to feed/nourish', 'v'),
    'bilim': ('science', 'n'),
    'bitki': ('plant', 'n'),
    'biraz': ('a little/some', 'adv'),
    'biri': ('someone/one of', 'pron'),
    'birisi': ('someone', 'pron'),
    'birlik': ('unity/union', 'n'),
    'boğaz': ('throat/strait', 'n'),
    'boya': ('paint/dye', 'n'),
    'boyamak': ('to paint/dye', 'v'),
    'bozmak': ('to break/spoil', 'v'),
    'borç': ('debt', 'n'),
    'bu': ('this', 'pron'),
    'buçuk': ('half (past)', 'adj'),
    'bulaşık': ('dishes (dirty)', 'n'),
    'bulmaca': ('puzzle', 'n'),
    'buluşmak': ('to meet up', 'v'),
    'burası': ('this place/here', 'pron'),
    'büro': ('office/bureau', 'n'),
    'büyükanneanne': ('great-grandmother', 'n'),
    'büyükanne': ('grandmother', 'n'),
    'büyükbaba': ('grandfather', 'n'),
    'cadde': ('avenue/street', 'n'),
    'cami': ('mosque', 'n'),
    'can': ('soul/life', 'n'),
    'canlı': ('alive/lively', 'adj'),
    'cenaze': ('funeral', 'n'),
    'cep': ('pocket', 'n'),
    'cesaret': ('courage', 'n'),
    'cesur': ('brave', 'adj'),
    'ceza': ('punishment/penalty', 'n'),
    'ciddi': ('serious', 'adj'),
    'cinayet': ('murder', 'n'),
    'coğrafya': ('geography', 'n'),
    'cumhuriyet': ('republic', 'n'),
    'cüzdan': ('wallet', 'n'),
    'çamaşır': ('laundry', 'n'),
    'çare': ('remedy/solution', 'n'),
    'çarşı': ('bazaar/market', 'n'),
    'çeşit': ('kind/variety', 'n'),
    'çeşitli': ('various', 'adj'),
    'çevre': ('environment/surroundings', 'n'),
    'çevirmek': ('to turn/translate', 'v'),
    'çikolata': ('chocolate', 'n'),
    'çorap': ('sock/stocking', 'n'),
    'çöp': ('garbage/trash', 'n'),
    'çözümlemek': ('to analyze', 'v'),
    'daire': ('apartment/circle', 'n'),
    'damat': ('groom/son-in-law', 'n'),
    'damla': ('drop', 'n'),
    'danışmak': ('to consult', 'v'),
    'davet': ('invitation', 'n'),
    'davranış': ('behavior', 'n'),
    'davranmak': ('to behave', 'v'),
    'defter': ('notebook', 'n'),
    'değer': ('value/worth', 'n'),
    'değerli': ('valuable/precious', 'adj'),
    'denetim': ('supervision/audit', 'n'),
    'deneyim': ('experience', 'n'),
    'deneyimli': ('experienced', 'adj'),
    'derin': ('deep', 'adj'),
    'dernek': ('association', 'n'),
    'devam': ('continuation', 'n'),
    'devir': ('era/period', 'n'),
    'dikkat': ('attention/care', 'n'),
    'dikkatli': ('careful/attentive', 'adj'),
    'dikkatsiz': ('careless', 'adj'),
    'diploma': ('diploma', 'n'),
    'direk': ('pole/pillar', 'n'),
    'direkt': ('direct', 'adj'),
    'dizi': ('series/row', 'n'),
    'doğa': ('nature', 'n'),
    'doğal': ('natural', 'adj'),
    'doğru': ('true/correct/toward', 'adj'),
    'doğum': ('birth', 'n'),
    'dokunmak': ('to touch', 'v'),
    'dolap': ('cupboard/cabinet', 'n'),
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
    'düşman': ('enemy', 'n'),
    'düşünce': ('thought/opinion', 'n'),
    'düz': ('flat/straight', 'adj'),
    'düzen': ('order/arrangement', 'n'),
    'düzenlemek': ('to organize/arrange', 'v'),
    'edebiyat': ('literature', 'n'),
    'efendi': ('sir/gentleman', 'n'),
    'ekonomi': ('economy', 'n'),
    'ekip': ('team', 'n'),
    'ekmek': ('bread', 'n'),
    'eksik': ('missing/incomplete', 'adj'),
    'elbette': ('of course/certainly', 'adv'),
    'eleman': ('employee/element', 'n'),
    'elma': ('apple', 'n'),
    'emek': ('labor/effort', 'n'),
    'emekli': ('retired', 'adj'),
    'emin': ('sure/certain', 'adj'),
    'endişe': ('worry/concern', 'n'),
    'endişeli': ('worried', 'adj'),
    'enerji': ('energy', 'n'),
    'engel': ('obstacle', 'n'),
    'erken': ('early', 'adv'),
    'eser': ('work (of art)', 'n'),
    'etki': ('effect/influence', 'n'),
    'etkili': ('effective', 'adj'),
    'eğitim': ('education/training', 'n'),
    'eğlence': ('entertainment/fun', 'n'),
    'eğlenceli': ('fun/entertaining', 'adj'),
    'eğlenmek': ('to have fun', 'v'),
    'faaliyeti': ('activity', 'n'),
    'fabrika': ('factory', 'n'),
    'fare': ('mouse', 'n'),
    'fatura': ('bill/invoice', 'n'),
    'fayda': ('benefit/use', 'n'),
    'fena': ('bad/awful', 'adj'),
    'festival': ('festival', 'n'),
    'fırın': ('oven/bakery', 'n'),
    'fırtına': ('storm', 'n'),
    'fincan': ('cup (small)', 'n'),
    'gece': ('night', 'n'),
    'geçen': ('last/past/passing', 'adj'),
    'geçici': ('temporary', 'adj'),
    'geçit': ('passage/crossing', 'n'),
    'geç': ('late', 'adj'),
    'gelecek': ('future', 'n'),
    'gelenek': ('tradition', 'n'),
    'geleneksel': ('traditional', 'adj'),
    'gelin': ('bride/daughter-in-law', 'n'),
    'gelir': ('income', 'n'),
    'gelişme': ('development', 'n'),
    'genel': ('general', 'adj'),
    'gerçek': ('real/true/reality', 'adj'),
    'gerçekleşmek': ('to come true/occur', 'v'),
    'gerekmek': ('to be necessary', 'v'),
    'geri': ('back/backward', 'adv'),
    'getirmek': ('to bring', 'v'),
    'gider': ('expense', 'n'),
    'giriş': ('entrance', 'n'),
    'göç': ('migration', 'n'),
    'göğüs': ('chest/breast', 'n'),
    'gök': ('sky', 'n'),
    'gölge': ('shadow/shade', 'n'),
    'görev': ('duty/task', 'n'),
    'görüntü': ('image/appearance', 'n'),
    'görüş': ('view/opinion', 'n'),
    'görüşme': ('meeting/interview', 'n'),
    'göster': ('show/indicate', 'v'),
    'göstermek': ('to show', 'v'),
    'göz': ('eye', 'n'),
    'gözlük': ('glasses/eyeglasses', 'n'),
    'grup': ('group', 'n'),
    'gurur': ('pride', 'n'),
    'güç': ('power/strength', 'n'),
    'güncel': ('current/up-to-date', 'adj'),
    'gündem': ('agenda', 'n'),
    'güney': ('south', 'n'),
    'güvenli': ('safe/secure', 'adj'),
    'güvenlik': ('security/safety', 'n'),
    'güvenmek': ('to trust', 'v'),
    'güzel': ('beautiful/nice', 'adj'),
    'haber': ('news', 'n'),
    'hak': ('right/justice', 'n'),
    'hakem': ('referee', 'n'),
    'hakim': ('judge', 'n'),
    'hakikat': ('truth/reality', 'n'),
    'haklı': ('right/justified', 'adj'),
    'hal': ('condition/state', 'n'),
    'halı': ('carpet/rug', 'n'),
    'hamur': ('dough', 'n'),
    'hanım': ('lady/Mrs.', 'n'),
    'hareket': ('movement/action', 'n'),
    'hassas': ('sensitive', 'adj'),
    'hatıra': ('souvenir/memory', 'n'),
    'havuz': ('pool', 'n'),
    'hayat': ('life', 'n'),
    'hayal': ('dream/imagination', 'n'),
    'haydi': ('come on/let\'s go', 'intj'),
    'hayırlı': ('auspicious/good', 'adj'),
    'hazine': ('treasure', 'n'),
    'hemen': ('immediately', 'adv'),
    'hesap': ('account/bill/calculation', 'n'),
    'heyecan': ('excitement', 'n'),
    'heyecanlı': ('excited/exciting', 'adj'),
    'hile': ('trick/fraud', 'n'),
    'hizmet': ('service', 'n'),
    'hoca': ('teacher/professor', 'n'),
    'hobi': ('hobby', 'n'),
    'hoş': ('pleasant/nice', 'adj'),
    'hukuk': ('law', 'n'),
    'hür': ('free/independent', 'adj'),
    'hırsız': ('thief', 'n'),
    'ilan': ('announcement', 'n'),
    'ilgili': ('interested/related', 'adj'),
    'ilginç': ('interesting', 'adj'),
    'ilişki': ('relationship', 'n'),
    'imkan': ('opportunity/possibility', 'n'),
    'imza': ('signature', 'n'),
    'inanç': ('belief/faith', 'n'),
    'inanılmaz': ('unbelievable/incredible', 'adj'),
    'internet': ('internet', 'n'),
    'inek': ('cow', 'n'),
    'inşaat': ('construction', 'n'),
    'isim': ('name', 'n'),
    'ispat': ('proof', 'n'),
    'işaret': ('sign/signal', 'n'),
    'işçi': ('worker', 'n'),
    'işlem': ('operation/process', 'n'),
    'iyi': ('good', 'adj'),
    'izin': ('permission/leave', 'n'),
    'izlemek': ('to watch/follow', 'v'),
    'kabul': ('acceptance', 'n'),
    'kafe': ('cafe', 'n'),
    'kağıt': ('paper', 'n'),
    'kahvaltı': ('breakfast', 'n'),
    'kalite': ('quality', 'n'),
    'kamp': ('camp', 'n'),
    'kanal': ('channel/canal', 'n'),
    'kanıt': ('evidence/proof', 'n'),
    'kaplumbağa': ('turtle', 'n'),
    'karar': ('decision', 'n'),
    'karın': ('stomach/belly', 'n'),
    'karpuz': ('watermelon', 'n'),
    'kasaba': ('town', 'n'),
    'katılmak': ('to participate/join', 'v'),
    'katkı': ('contribution', 'n'),
    'kavga': ('fight/quarrel', 'n'),
    'kavşak': ('intersection', 'n'),
    'kayak': ('ski/skiing', 'n'),
    'kaybolmak': ('to get lost', 'v'),
    'kayıt': ('registration/record', 'n'),
    'kaynak': ('source/resource', 'n'),
    'kaza': ('accident', 'n'),
    'kelepçe': ('handcuff', 'n'),
    'kenar': ('edge/side', 'n'),
    'kent': ('city', 'n'),
    'kesinlikle': ('absolutely/definitely', 'adv'),
    'kestane': ('chestnut', 'n'),
    'kırmak': ('to break', 'v'),
    'kısmet': ('fate/luck', 'n'),
    'kıyafet': ('clothing/outfit', 'n'),
    'kız': ('girl/daughter', 'n'),
    'kilim': ('kilim/rug', 'n'),
    'kilo': ('kilogram', 'n'),
    'kiralık': ('for rent', 'adj'),
    'kiralamak': ('to rent', 'v'),
    'kolay': ('easy', 'adj'),
    'komik': ('funny', 'adj'),
    'komisyon': ('commission', 'n'),
    'konak': ('mansion', 'n'),
    'konser': ('concert', 'n'),
    'konuk': ('guest', 'n'),
    'konuşma': ('speech/conversation', 'n'),
    'kopya': ('copy', 'n'),
    'koridorda': ('in the corridor', 'n'),
    'koridor': ('corridor/hallway', 'n'),
    'koruma': ('protection/guard', 'n'),
    'koşul': ('condition', 'n'),
    'kovmak': ('to fire/expel', 'v'),
    'koyun': ('sheep', 'n'),
    'kreş': ('daycare', 'n'),
    'kriz': ('crisis', 'n'),
    'kumaş': ('fabric', 'n'),
    'kumsal': ('beach (sandy)', 'n'),
    'kurabiye': ('cookie', 'n'),
    'kural': ('rule', 'n'),
    'kurmak': ('to set up/establish', 'v'),
    'kurs': ('course', 'n'),
    'kurum': ('institution', 'n'),
    'kutu': ('box', 'n'),
    'kuvvet': ('force/power', 'n'),
    'kuzey': ('north', 'n'),
    'küçüklük': ('childhood/smallness', 'n'),
    'kütük': ('log', 'n'),
    'laf': ('word/talk', 'n'),
    'lezzet': ('flavor/taste', 'n'),
    'lezzetli': ('delicious', 'adj'),
    'lider': ('leader', 'n'),
    'lise': ('high school', 'n'),
    'lokanta': ('restaurant', 'n'),
    'maaş': ('salary', 'n'),
    'maç': ('match/game', 'n'),
    'mahalle': ('neighborhood', 'n'),
    'mahkeme': ('court', 'n'),
    'makale': ('article', 'n'),
    'makine': ('machine', 'n'),
    'mal': ('property/goods', 'n'),
    'malzeme': ('material/ingredient', 'n'),
    'manzara': ('view/scenery', 'n'),
    'market': ('supermarket', 'n'),
    'masa': ('table', 'n'),
    'mekan': ('place/venue', 'n'),
    'memnun': ('pleased/satisfied', 'adj'),
    'memur': ('civil servant', 'n'),
    'merak': ('curiosity', 'n'),
    'meraklı': ('curious', 'adj'),
    'merdiven': ('stairs/ladder', 'n'),
    'merkez': ('center', 'n'),
    'mesafe': ('distance', 'n'),
    'meslek': ('profession', 'n'),
    'mevsim': ('season', 'n'),
    'meydan': ('square/plaza', 'n'),
    'meşhur': ('famous', 'adj'),
    'millet': ('nation/people', 'n'),
    'mimar': ('architect', 'n'),
    'misafir': ('guest', 'n'),
    'model': ('model', 'n'),
    'modern': ('modern', 'adj'),
    'mola': ('break/rest', 'n'),
    'mücadele': ('struggle', 'n'),
    'müdahale': ('intervention', 'n'),
    'mühendis': ('engineer', 'n'),
    'müşteri': ('customer', 'n'),
    'müzakere': ('negotiation', 'n'),
    'nefes': ('breath', 'n'),
    'nesil': ('generation', 'n'),
    'nihayet': ('finally', 'adv'),
    'nişan': ('engagement/medal', 'n'),
    'nüfus': ('population', 'n'),
    'olay': ('event/incident', 'n'),
    'olgunluk': ('maturity', 'n'),
    'olumlu': ('positive/favorable', 'adj'),
    'olumsuz': ('negative/unfavorable', 'adj'),
    'oluşmak': ('to form/consist of', 'v'),
    'oluşturmak': ('to create/form', 'v'),
    'onay': ('approval', 'n'),
    'opera': ('opera', 'n'),
    'organ': ('organ', 'n'),
    'organizasyon': ('organization', 'n'),
    'ortak': ('partner/common', 'n'),
    'ortam': ('environment/medium', 'n'),
    'ortaya': ('forward/into the open', 'adv'),
    'otel': ('hotel', 'n'),
    'otobüs': ('bus', 'n'),
    'otopark': ('parking lot', 'n'),
    'oya': ('lace/needlework', 'n'),
    'oynamak': ('to play', 'v'),
    'oyuncu': ('player/actor', 'n'),
    'ödev': ('homework/duty', 'n'),
    'ödül': ('prize/award', 'n'),
    'öğle': ('noon', 'n'),
    'öğrenci': ('student', 'n'),
    'öğretmen': ('teacher', 'n'),
    'öğün': ('meal', 'n'),
    'önemli': ('important', 'adj'),
    'öneri': ('suggestion', 'n'),
    'önlem': ('precaution/measure', 'n'),
    'önyargı': ('prejudice', 'n'),
    'örf': ('custom/tradition', 'n'),
    'örnek': ('example', 'n'),
    'örtü': ('cover/cloth', 'n'),
    'öte': ('beyond/other side', 'n'),
    'öteki': ('the other', 'pron'),
    'öykü': ('story/tale', 'n'),
    'özel': ('private/special', 'adj'),
    'özgürlük': ('freedom/liberty', 'n'),
    'özlem': ('longing/yearning', 'n'),
    'pahalı': ('expensive', 'adj'),
    'paha': ('price/value', 'n'),
    'paket': ('package', 'n'),
    'pansiyon': ('pension/guesthouse', 'n'),
    'parça': ('piece/part', 'n'),
    'parti': ('party', 'n'),
    'pasta': ('cake', 'n'),
    'patates': ('potato', 'n'),
    'patlıcan': ('eggplant', 'n'),
    'paylaşmak': ('to share', 'v'),
    'perde': ('curtain', 'n'),
    'personel': ('personnel/staff', 'n'),
    'pijama': ('pajamas', 'n'),
    'piknik': ('picnic', 'n'),
    'pilot': ('pilot', 'n'),
    'pişman': ('regretful', 'adj'),
    'plaj': ('beach', 'n'),
    'platform': ('platform', 'n'),
    'polis': ('police', 'n'),
    'politika': ('politics/policy', 'n'),
    'portakal': ('orange (fruit)', 'n'),
    'posta': ('mail/post', 'n'),
    'profesör': ('professor', 'n'),
    'program': ('program', 'n'),
    'rahat': ('comfortable', 'adj'),
    'rakam': ('number/digit', 'n'),
    'randevu': ('appointment', 'n'),
    'recete': ('recipe/prescription', 'n'),
    'rehber': ('guide', 'n'),
    'rekabet': ('competition', 'n'),
    'reklam': ('advertisement', 'n'),
    'risk': ('risk', 'n'),
    'roman': ('novel', 'n'),
    'rota': ('route', 'n'),
    'sabırlı': ('patient', 'adj'),
    'sabırsız': ('impatient', 'adj'),
    'sade': ('plain/simple', 'adj'),
    'sahil': ('coast/shore', 'n'),
    'sahip': ('owner/possessing', 'n'),
    'sakin': ('calm/quiet', 'adj'),
    'salon': ('hall/living room', 'n'),
    'sanat': ('art', 'n'),
    'sanatçı': ('artist', 'n'),
    'sanayi': ('industry', 'n'),
    'sandık': ('chest/box', 'n'),
    'sapak': ('turn/fork (road)', 'n'),
    'sarılmak': ('to hug', 'v'),
    'satıcı': ('seller/vendor', 'n'),
    'satılık': ('for sale', 'adj'),
    'sayfa': ('page', 'n'),
    'saygı': ('respect', 'n'),
    'saygılı': ('respectful', 'adj'),
    'sayı': ('number', 'n'),
    'savaş': ('war', 'n'),
    'sebep': ('reason/cause', 'n'),
    'seçenek': ('option/choice', 'n'),
    'sefer': ('time/journey', 'n'),
    'semt': ('district', 'n'),
    'serbest': ('free/unrestricted', 'adj'),
    'sergi': ('exhibition', 'n'),
    'sermaye': ('capital (money)', 'n'),
    'serüven': ('adventure', 'n'),
    'sevgili': ('dear/beloved/sweetheart', 'adj'),
    'sevinç': ('joy', 'n'),
    'seyahat': ('travel/journey', 'n'),
    'sınav': ('exam/test', 'n'),
    'sınır': ('border/limit', 'n'),
    'sıra': ('row/turn/order', 'n'),
    'sırt': ('back (body)', 'n'),
    'sigara': ('cigarette', 'n'),
    'silah': ('weapon', 'n'),
    'sinir': ('nerve/anger', 'n'),
    'sistem': ('system', 'n'),
    'siyaset': ('politics', 'n'),
    'soğan': ('onion', 'n'),
    'son': ('end/last', 'n'),
    'sorumluluk': ('responsibility', 'n'),
    'sorumlu': ('responsible', 'adj'),
    'soyad': ('surname', 'n'),
    'söz': ('word/promise', 'n'),
    'sözleşme': ('contract', 'n'),
    'staj': ('internship', 'n'),
    'stajyer': ('intern', 'n'),
    'strateji': ('strategy', 'n'),
    'suç': ('crime', 'n'),
    'sunucu': ('presenter/server', 'n'),
    'sunmak': ('to present/offer', 'v'),
    'sunum': ('presentation', 'n'),
    'surat': ('face (colloquial)', 'n'),
    'süre': ('duration', 'n'),
    'süreç': ('process', 'n'),
    'sürmek': ('to drive/last', 'v'),
    'sürpriz': ('surprise', 'n'),
    'şaka': ('joke', 'n'),
    'şef': ('chef/chief', 'n'),
    'şemsiye': ('umbrella', 'n'),
    'şiir': ('poem/poetry', 'n'),
    'şikayet': ('complaint', 'n'),
    'şoför': ('driver', 'n'),
    'şüphe': ('doubt/suspicion', 'n'),
    'tabiat': ('nature', 'n'),
    'tahmin': ('guess/estimate', 'n'),
    'takım': ('team/set', 'n'),
    'talep': ('demand/request', 'n'),
    'tamir': ('repair', 'n'),
    'tanık': ('witness', 'n'),
    'tanıtım': ('promotion/introduction', 'n'),
    'tanınmak': ('to be known', 'v'),
    'tarif': ('recipe/directions', 'n'),
    'tarla': ('field (agriculture)', 'n'),
    'tavsiye': ('advice/recommendation', 'n'),
    'taze': ('fresh', 'adj'),
    'tehlike': ('danger', 'n'),
    'tehlikeli': ('dangerous', 'adj'),
    'tek': ('single/only', 'adj'),
    'teklif': ('offer/proposal', 'n'),
    'tekne': ('boat', 'n'),
    'teknoloji': ('technology', 'n'),
    'televizyon': ('television', 'n'),
    'temel': ('foundation/basic', 'n'),
    'temizlik': ('cleanliness/cleaning', 'n'),
    'terfi': ('promotion (job)', 'n'),
    'ticaret': ('trade/commerce', 'n'),
    'toplum': ('society', 'n'),
    'toplumsal': ('social', 'adj'),
    'trafik': ('traffic', 'n'),
    'turist': ('tourist', 'n'),
    'tutku': ('passion', 'n'),
    'tüketici': ('consumer', 'n'),
    'tüm': ('all/entire', 'adj'),
    'türkçe': ('Turkish (language)', 'n'),
    'ucuz': ('cheap', 'adj'),
    'ufak': ('tiny/small', 'adj'),
    'ulaşım': ('transportation', 'n'),
    'ulaşmak': ('to reach/arrive', 'v'),
    'uluslararası': ('international', 'adj'),
    'umursamak': ('to care about', 'v'),
    'unsur': ('element', 'n'),
    'usul': ('method/manner', 'n'),
    'uyarı': ('warning', 'n'),
    'uyarmak': ('to warn', 'v'),
    'uygulama': ('application/practice', 'n'),
    'uygun': ('suitable/appropriate', 'adj'),
    'uyku': ('sleep', 'n'),
    'uyum': ('harmony/adaptation', 'n'),
    'uzak': ('far/distant', 'adj'),
    'uzay': ('space (outer)', 'n'),
    'uzman': ('expert/specialist', 'n'),
    'üretim': ('production', 'n'),
    'üretmek': ('to produce', 'v'),
    'ürün': ('product', 'n'),
    'üye': ('member', 'n'),
    'üzülmek': ('to be sad', 'v'),
    'vaat': ('promise', 'n'),
    'vagon': ('wagon/car (train)', 'n'),
    'vali': ('governor', 'n'),
    'varlık': ('existence/wealth', 'n'),
    'vasiyet': ('will/testament', 'n'),
    'vatan': ('homeland', 'n'),
    'vatandaş': ('citizen', 'n'),
    'vazgeçmek': ('to give up', 'v'),
    'vergi': ('tax', 'n'),
    'verimli': ('productive', 'adj'),
    'veteriner': ('veterinarian', 'n'),
    'yabancı': ('foreigner/foreign', 'n'),
    'yakın': ('close/near', 'adj'),
    'yakınmak': ('to complain', 'v'),
    'yakıt': ('fuel', 'n'),
    'yalanmak': ('to lick', 'v'),
    'yalnız': ('alone/only', 'adj'),
    'yanlış': ('wrong/incorrect', 'adj'),
    'yapı': ('structure/building', 'n'),
    'yaprak': ('leaf', 'n'),
    'yaramak': ('to be useful', 'v'),
    'yaratıcı': ('creative', 'adj'),
    'yaratmak': ('to create', 'v'),
    'yarış': ('race/competition', 'n'),
    'yarışma': ('competition/contest', 'n'),
    'yasak': ('forbidden/ban', 'adj'),
    'yasa': ('law', 'n'),
    'yat': ('yacht', 'n'),
    'yatırım': ('investment', 'n'),
    'yazar': ('writer/author', 'n'),
    'yazılım': ('software', 'n'),
    'yemin': ('oath', 'n'),
    'yerel': ('local', 'adj'),
    'yetenek': ('talent/ability', 'n'),
    'yetenekli': ('talented', 'adj'),
    'yeterli': ('sufficient/enough', 'adj'),
    'yetiştirmek': ('to raise/grow', 'v'),
    'yetişkin': ('adult', 'n'),
    'yoğun': ('intense/busy/thick', 'adj'),
    'yoğurt': ('yogurt', 'n'),
    'yolcu': ('passenger/traveler', 'n'),
    'yolculuk': ('journey/travel', 'n'),
    'yönetici': ('manager/administrator', 'n'),
    'yönetim': ('management', 'n'),
    'yönetmek': ('to manage/direct', 'v'),
    'yön': ('direction', 'n'),
    'yüksek': ('high/tall', 'adj'),
    'yürek': ('heart (emotional)', 'n'),
    'yüzme': ('swimming', 'n'),
    'zafer': ('victory', 'n'),
    'zaten': ('already/anyway', 'adv'),
    'zarar': ('harm/damage', 'n'),
    'zeka': ('intelligence', 'n'),
    'zemin': ('floor/ground', 'n'),
    'zenginlik': ('wealth', 'n'),
    'zeytin': ('olive', 'n'),
    'zil': ('bell/doorbell', 'n'),
    'zirve': ('summit/peak', 'n'),
    'zorluk': ('difficulty', 'n'),
    'zorunlu': ('mandatory/compulsory', 'adj'),

    # ── Very common verb forms (conjugated) ──────────
    'aldım': ('I bought/took', 'v'),
    'aldın': ('you bought/took', 'v'),
    'aldı': ('he/she bought/took', 'v'),
    'aldık': ('we bought/took', 'v'),
    'alıyor': ('is buying/taking', 'v'),
    'alacak': ('will buy/take', 'v'),
    'alıyorum': ('I am buying/taking', 'v'),
    'alıyorsun': ('you are buying/taking', 'v'),
    'anlıyor': ('understands', 'v'),
    'anladım': ('I understood', 'v'),
    'anlatıyor': ('is telling/explaining', 'v'),
    'arıyor': ('is calling/looking for', 'v'),
    'bakıyor': ('is looking', 'v'),
    'baktı': ('looked', 'v'),
    'başladı': ('started/began', 'v'),
    'başlıyor': ('is starting', 'v'),
    'bekliyorum': ('I am waiting', 'v'),
    'bildim': ('I knew', 'v'),
    'biliyorum': ('I know', 'v'),
    'biliyorsun': ('you know', 'v'),
    'bilirim': ('I know (habitual)', 'v'),
    'biliyor': ('knows', 'v'),
    'bitti': ('it ended/finished', 'v'),
    'bulamıyorum': ('I cannot find', 'v'),
    'buldum': ('I found', 'v'),
    'buyurun': ('here you go/please', 'intj'),
    'çalışıyor': ('is working', 'v'),
    'çalışıyorum': ('I am working', 'v'),
    'çıkıyor': ('is going out', 'v'),
    'çıktı': ('went out/came out', 'v'),
    'dedi': ('said', 'v'),
    'demiş': ('reportedly said', 'v'),
    'diyor': ('says', 'v'),
    'diyorum': ('I say', 'v'),
    'doğdu': ('was born', 'v'),
    'dolayı': ('due to/because of', 'postp'),
    'durdu': ('stopped', 'v'),
    'duruyor': ('is standing/stopping', 'v'),
    'düşündüm': ('I thought', 'v'),
    'düşünüyor': ('is thinking', 'v'),
    'düşünüyorum': ('I am thinking', 'v'),
    'ediyor': ('is doing', 'v'),
    'etmelisin': ('you should do', 'v'),
    'geçiyor': ('is passing', 'v'),
    'geldi': ('came', 'v'),
    'gelecek': ('will come/future', 'v'),
    'gidiyorum': ('I am going', 'v'),
    'gidiyorsun': ('you are going', 'v'),
    'gitti': ('went', 'v'),
    'gördüm': ('I saw', 'v'),
    'görüyor': ('sees', 'v'),
    'görüyorum': ('I see', 'v'),
    'gülüyor': ('is laughing', 'v'),
    'güldü': ('laughed', 'v'),
    'istiyorum': ('I want', 'v'),
    'istiyorsun': ('you want', 'v'),
    'kalıyor': ('is staying', 'v'),
    'kaldı': ('remained/stayed', 'v'),
    'olabilir': ('it can be/maybe', 'v'),
    'oluyor': ('is happening/becoming', 'v'),
    'olmuş': ('reportedly became', 'v'),
    'okuyor': ('is reading', 'v'),
    'okuyorum': ('I am reading', 'v'),
    'oynuyor': ('is playing', 'v'),
    'oturuyor': ('is sitting/living', 'v'),
    'seviyor': ('loves', 'v'),
    'seviyorum': ('I love', 'v'),
    'söyledi': ('said/told', 'v'),
    'söylüyor': ('is saying/telling', 'v'),
    'yapmak': ('to do/make', 'v'),
    'yapıyor': ('is doing', 'v'),
    'yapıyorum': ('I am doing', 'v'),
    'yazdı': ('wrote', 'v'),
    'yazıyor': ('is writing', 'v'),
    'yiyor': ('is eating', 'v'),

    # ── More suffixed/derived forms ──────────────────
    'evde': ('at home', 'n'),
    'evden': ('from home', 'n'),
    'eve': ('to home', 'n'),
    'evi': ('the house (acc.)', 'n'),
    'evin': ('of the house', 'n'),
    'evler': ('houses', 'n'),
    'evimde': ('at my home', 'n'),
    'evimden': ('from my home', 'n'),
    'evime': ('to my home', 'n'),
    'evimi': ('my home (acc.)', 'n'),
    'evimiz': ('our home', 'n'),
    'evimize': ('to our home', 'n'),
    'okula': ('to school', 'n'),
    'okulda': ('at school', 'n'),
    'okuldan': ('from school', 'n'),
    'okulun': ('of the school', 'n'),
    'okulu': ('the school (acc.)', 'n'),
    'arabada': ('in the car', 'n'),
    'arabayı': ('the car (acc.)', 'n'),
    'arabayla': ('by car', 'n'),
    'arabası': ('his/her car', 'n'),

    # ── Question words and particles ─────────────────
    'mi': ('question particle', 'part'),
    'mı': ('question particle', 'part'),
    'mu': ('question particle', 'part'),
    'mü': ('question particle', 'part'),
    'mısın': ('are you? (question)', 'part'),
    'misin': ('are you? (question)', 'part'),
    'musun': ('are you? (question)', 'part'),
    'müsün': ('are you? (question)', 'part'),
    'mıyım': ('am I? (question)', 'part'),
    'miyim': ('am I? (question)', 'part'),
    'da': ('also/too/in', 'part'),
    'de': ('also/too/in', 'part'),
    'dır': ('is (copula)', 'part'),
    'dir': ('is (copula)', 'part'),
    'dur': ('is (copula)', 'part'),
    'dür': ('is (copula)', 'part'),

    # ── Common expressions ───────────────────────────
    'sağ': ('right/alive', 'adj'),
    'sol': ('left', 'adj'),
    'ön': ('front', 'n'),
    'arka': ('back/rear', 'n'),
    'üst': ('top/upper', 'n'),
    'iç': ('inside/interior', 'n'),
    'dış': ('outside/exterior', 'n'),
    'yan': ('side', 'n'),
    'orta': ('middle/medium', 'n'),
    'doğu': ('east', 'n'),
    'batı': ('west', 'n'),
    'güney': ('south', 'n'),
    'kuzey': ('north', 'n'),
    'sağol': ('thanks (informal)', 'intj'),
    'hoşgeldiniz': ('welcome (formal)', 'intj'),
    'haydi': ('come on/let\'s go', 'intj'),
    'hadi': ('come on (informal)', 'intj'),
    'yahu': ('hey/come on', 'intj'),
    'eyvah': ('oh no', 'intj'),
    'bravo': ('bravo/well done', 'intj'),
    'maşallah': ('wonderful (expression)', 'intj'),
    'inşallah': ('God willing', 'intj'),
    'allah': ('God', 'n'),
    'vallahi': ('I swear/honestly', 'intj'),

    # ── Time expressions ─────────────────────────────
    'sene': ('year', 'n'),
    'mevsim': ('season', 'n'),
    'ilkbahar': ('spring', 'n'),
    'yaz': ('summer', 'n'),
    'sonbahar': ('autumn/fall', 'n'),
    'kış': ('winter', 'n'),
    'ocak': ('January/stove', 'n'),
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
    'pazar': ('Sunday/market', 'n'),

    # ── Food & drink ─────────────────────────────────
    'börek': ('pastry/börek', 'n'),
    'çorba': ('soup', 'n'),
    'dolma': ('stuffed dish', 'n'),
    'kebap': ('kebab', 'n'),
    'köfte': ('meatball', 'n'),
    'lahmacun': ('flatbread with meat', 'n'),
    'mantı': ('Turkish dumpling', 'n'),
    'pilav': ('rice pilaf', 'n'),
    'pide': ('flatbread', 'n'),
    'salata': ('salad', 'n'),
    'simit': ('sesame ring bread', 'n'),
    'turşu': ('pickle', 'n'),
    'baklava': ('baklava', 'n'),
    'ayran': ('yogurt drink', 'n'),
    'bira': ('beer', 'n'),
    'şarap': ('wine', 'n'),
    'maden suyu': ('mineral water', 'n'),
    'limonata': ('lemonade', 'n'),
    'tereyağı': ('butter', 'n'),
    'reçel': ('jam', 'n'),
    'bal': ('honey', 'n'),
    'biber': ('pepper', 'n'),
    'sarımsak': ('garlic', 'n'),
    'soğan': ('onion', 'n'),
    'fasulye': ('bean', 'n'),
    'mercimek': ('lentil', 'n'),
    'nohut': ('chickpea', 'n'),
    'erik': ('plum', 'n'),
    'üzüm': ('grape', 'n'),
    'kiraz': ('cherry', 'n'),
    'çilek': ('strawberry', 'n'),
    'kavun': ('melon', 'n'),
    'incir': ('fig', 'n'),
    'kayısı': ('apricot', 'n'),
    'nar': ('pomegranate', 'n'),
    'muz': ('banana', 'n'),
    'limon': ('lemon', 'n'),
    'havuç': ('carrot', 'n'),
    'kabak': ('zucchini/pumpkin', 'n'),
    'salatalık': ('cucumber', 'n'),
    'ıspanak': ('spinach', 'n'),
    'lahana': ('cabbage', 'n'),
    'turp': ('radish', 'n'),
    'mısır': ('corn/Egypt', 'n'),

    # ── Animals ──────────────────────────────────────
    'arı': ('bee', 'n'),
    'aslan': ('lion', 'n'),
    'ayı': ('bear', 'n'),
    'böcek': ('insect/bug', 'n'),
    'deve': ('camel', 'n'),
    'eşek': ('donkey', 'n'),
    'fare': ('mouse', 'n'),
    'fil': ('elephant', 'n'),
    'inek': ('cow', 'n'),
    'karınca': ('ant', 'n'),
    'kaplan': ('tiger', 'n'),
    'kaplumbağa': ('turtle', 'n'),
    'keçi': ('goat', 'n'),
    'kelebek': ('butterfly', 'n'),
    'koyun': ('sheep', 'n'),
    'kurt': ('wolf', 'n'),
    'maymun': ('monkey', 'n'),
    'sivrisinek': ('mosquito', 'n'),
    'tavşan': ('rabbit', 'n'),
    'tilki': ('fox', 'n'),
    'yılan': ('snake', 'n'),

    # ── Body parts (extras) ──────────────────────────
    'bel': ('waist/back', 'n'),
    'bilek': ('wrist', 'n'),
    'boyun': ('neck', 'n'),
    'çene': ('chin/jaw', 'n'),
    'dirsek': ('elbow', 'n'),
    'diz': ('knee', 'n'),
    'kaburga': ('rib', 'n'),
    'kaş': ('eyebrow', 'n'),
    'kirpik': ('eyelash', 'n'),
    'omuz': ('shoulder', 'n'),
    'tırnak': ('nail/fingernail', 'n'),

    # ── Household ────────────────────────────────────
    'ampul': ('light bulb', 'n'),
    'battaniye': ('blanket', 'n'),
    'buzdolabı': ('refrigerator', 'n'),
    'çamaşır makinesi': ('washing machine', 'n'),
    'fırın': ('oven/bakery', 'n'),
    'havlu': ('towel', 'n'),
    'koltuk': ('armchair/seat', 'n'),
    'lamba': ('lamp', 'n'),
    'ocak': ('stove/January', 'n'),
    'raf': ('shelf', 'n'),
    'sabun': ('soap', 'n'),
    'süpürge': ('broom', 'n'),
    'tarak': ('comb', 'n'),
    'yastık': ('pillow', 'n'),

    # ── Clothing extras ──────────────────────────────
    'ceket': ('jacket', 'n'),
    'etek': ('skirt', 'n'),
    'kazak': ('sweater', 'n'),
    'kemer': ('belt', 'n'),
    'kravat': ('tie', 'n'),
    'mont': ('coat/jacket', 'n'),
    'terlik': ('slipper', 'n'),
    'yüzük': ('ring', 'n'),
    'kolye': ('necklace', 'n'),
    'küpe': ('earring', 'n'),
    'bilezik': ('bracelet', 'n'),

    # ── Nature extras ────────────────────────────────
    'akıntı': ('current/flow', 'n'),
    'çağlayan': ('waterfall', 'n'),
    'çayır': ('meadow', 'n'),
    'çöl': ('desert', 'n'),
    'dere': ('stream/creek', 'n'),
    'kayalık': ('rocky area', 'n'),
    'kıyı': ('shore/coast', 'n'),
    'ova': ('plain', 'n'),
    'tepe': ('hill', 'n'),
    'vadi': ('valley', 'n'),
    'volkan': ('volcano', 'n'),
    'yanardağ': ('volcano', 'n'),

    # ── Professions ──────────────────────────────────
    'aşçı': ('cook/chef', 'n'),
    'asker': ('soldier', 'n'),
    'cerrah': ('surgeon', 'n'),
    'çiftçi': ('farmer', 'n'),
    'diş hekimi': ('dentist', 'n'),
    'eczacı': ('pharmacist', 'n'),
    'garson': ('waiter', 'n'),
    'gazeteci': ('journalist', 'n'),
    'hemşire': ('nurse', 'n'),
    'itfaiyeci': ('firefighter', 'n'),
    'mühendis': ('engineer', 'n'),
    'muhasebeci': ('accountant', 'n'),
    'müfettiş': ('inspector', 'n'),
    'berber': ('barber', 'n'),
    'kasap': ('butcher', 'n'),
    'terzi': ('tailor', 'n'),
    'ressam': ('painter/artist', 'n'),
    'savcı': ('prosecutor', 'n'),
    'subay': ('officer', 'n'),

    # ── Emotions extras ──────────────────────────────
    'endişe': ('worry/concern', 'n'),
    'hayal kırıklığı': ('disappointment', 'n'),
    'huzur': ('peace/serenity', 'n'),
    'kıskançlık': ('jealousy', 'n'),
    'merak': ('curiosity', 'n'),
    'özlem': ('longing', 'n'),
    'pişmanlık': ('regret', 'n'),
    'şaşkınlık': ('surprise/astonishment', 'n'),
    'utanç': ('shame', 'n'),

    # ── Abstract nouns ───────────────────────────────
    'adalet': ('justice', 'n'),
    'amaç': ('purpose/goal', 'n'),
    'arzu': ('desire/wish', 'n'),
    'bağımsızlık': ('independence', 'n'),
    'başarısızlık': ('failure', 'n'),
    'dürüstlük': ('honesty', 'n'),
    'eşitlik': ('equality', 'n'),
    'görev': ('duty/task', 'n'),
    'güzellik': ('beauty', 'n'),
    'kararlılık': ('determination', 'n'),
    'özgürlük': ('freedom', 'n'),
    'sorumluluk': ('responsibility', 'n'),
    'yalnızlık': ('loneliness', 'n'),

    # ── Technology ───────────────────────────────────
    'ekran': ('screen', 'n'),
    'klavye': ('keyboard', 'n'),
    'şarj': ('charge', 'n'),
    'şifre': ('password', 'n'),
    'uygulama': ('application/app', 'n'),
    'yazıcı': ('printer', 'n'),

    # ── Common suffixed forms frequently in decks ────
    'abimin': ('of my older brother', 'n'),
    'ablam': ('my older sister', 'n'),
    'ablamı': ('my older sister (acc.)', 'n'),
    'ablası': ('his/her older sister', 'n'),
    'ablasına': ('to his/her older sister', 'n'),
    'adı': ('his/her name', 'n'),
    'adım': ('my name/step', 'n'),
    'adınız': ('your name (formal)', 'n'),
    'adınızı': ('your name (acc.)', 'n'),
    'adımlar': ('steps', 'n'),
    'adresi': ('the address', 'n'),
    'ailem': ('my family', 'n'),
    'aileme': ('to my family', 'n'),
    'ailesi': ('his/her family', 'n'),
    'ailesine': ('to his/her family', 'n'),
    'amcam': ('my uncle (paternal)', 'n'),
    'annem': ('my mother', 'n'),
    'anneme': ('to my mother', 'n'),
    'annemi': ('my mother (acc.)', 'n'),
    'annemin': ('of my mother', 'n'),
    'annesi': ('his/her mother', 'n'),
    'annesine': ('to his/her mother', 'n'),
    'annesini': ('his/her mother (acc.)', 'n'),
    'arkadaşım': ('my friend', 'n'),
    'arkadaşıma': ('to my friend', 'n'),
    'arkadaşımla': ('with my friend', 'n'),
    'arkadaşın': ('your friend', 'n'),
    'arkadaşları': ('their friends', 'n'),
    'babam': ('my father', 'n'),
    'babama': ('to my father', 'n'),
    'babamın': ('of my father', 'n'),
    'babası': ('his/her father', 'n'),
    'babasına': ('to his/her father', 'n'),
    'babasını': ('his/her father (acc.)', 'n'),
    'bileti': ('the ticket', 'n'),
    'biletler': ('tickets', 'n'),
    'çocuğu': ('the child (acc.)', 'n'),
    'çocuklar': ('children', 'n'),
    'çocukları': ('their children', 'n'),
    'çocuklarım': ('my children', 'n'),
    'çocuklarımız': ('our children', 'n'),
    'dayım': ('my uncle (maternal)', 'n'),
    'dedem': ('my grandfather', 'n'),
    'dedesi': ('his/her grandfather', 'n'),
    'dostum': ('my friend', 'n'),
    'eşim': ('my spouse', 'n'),
    'eşime': ('to my spouse', 'n'),
    'eşimle': ('with my spouse', 'n'),
    'gelini': ('the bride', 'n'),
    'halam': ('my aunt (paternal)', 'n'),
    'kardeşim': ('my sibling', 'n'),
    'kardeşime': ('to my sibling', 'n'),
    'kardeşimle': ('with my sibling', 'n'),
    'kardeşler': ('siblings', 'n'),
    'kocam': ('my husband', 'n'),
    'kocası': ('her husband', 'n'),
    'komşum': ('my neighbor', 'n'),
    'komşumuz': ('our neighbor', 'n'),
    'kuzenlerim': ('my cousins', 'n'),
    'ninem': ('my grandmother', 'n'),
    'oğlum': ('my son', 'n'),
    'oğluma': ('to my son', 'n'),
    'oğlumuz': ('our son', 'n'),
    'teyzem': ('my aunt (maternal)', 'n'),

    # ── Possessive forms of common nouns ─────────────
    'işim': ('my work', 'n'),
    'işimi': ('my work (acc.)', 'n'),
    'işine': ('to his/her work', 'n'),
    'işler': ('works/jobs', 'n'),
    'günün': ('of the day', 'n'),
    'günler': ('days', 'n'),
    'günlerde': ('on (these) days', 'n'),
    'haftalık': ('weekly', 'adj'),
    'saatlerce': ('for hours', 'adv'),
    'yıllar': ('years', 'n'),
    'yıllardır': ('for years', 'adv'),
    'yıllık': ('annual/yearly', 'adj'),

    # ── Verb necessity/ability forms ─────────────────
    'gerekiyor': ('is necessary/needed', 'v'),
    'gerekir': ('it is necessary', 'v'),
    'lazım': ('necessary/needed', 'adj'),
    'olmalı': ('must be/should be', 'v'),
    'yapmalı': ('must do/should do', 'v'),
    'yapmalıyız': ('we must do', 'v'),
    'gitmeli': ('must go', 'v'),
    'gitmeliyim': ('I must go', 'v'),
    'gitmeliyiz': ('we must go', 'v'),
    'gelebilir': ('can come', 'v'),
    'gidebilir': ('can go', 'v'),
    'yapabilir': ('can do', 'v'),
    'yapabilirim': ('I can do', 'v'),
    'yapabilirsin': ('you can do', 'v'),
    'edebilir': ('can do', 'v'),
    'görebilir': ('can see', 'v'),
    'bilebilir': ('can know', 'v'),

    # ── Conditional/wish forms ───────────────────────
    'olsa': ('if it were/becomes', 'v'),
    'olsaydı': ('if it had been', 'v'),
    'gelse': ('if he/she comes', 'v'),
    'gitsem': ('if I go', 'v'),
    'yapsam': ('if I do', 'v'),
    'keşke': ('I wish/if only', 'adv'),

    # ── Reported past forms ──────────────────────────
    'gelmiş': ('reportedly came', 'v'),
    'gitmiş': ('reportedly went', 'v'),
    'yapmış': ('reportedly did', 'v'),
    'almış': ('reportedly took', 'v'),
    'olmuş': ('reportedly became', 'v'),
    'söylemiş': ('reportedly said', 'v'),
    'görmüş': ('reportedly saw', 'v'),

    # ── Negative verb forms ──────────────────────────
    'bilmiyorum': ('I don\'t know', 'v'),
    'bilmiyor': ('doesn\'t know', 'v'),
    'gelmiyor': ('is not coming', 'v'),
    'gitmiyor': ('is not going', 'v'),
    'istemiyor': ('doesn\'t want', 'v'),
    'istemiyorum': ('I don\'t want', 'v'),
    'yapmıyor': ('is not doing', 'v'),
    'olmaz': ('it won\'t do/no', 'v'),
    'yapma': ('don\'t do', 'v'),
    'gitme': ('don\'t go', 'v'),
    'gelme': ('don\'t come', 'v'),
    'yapamıyorum': ('I cannot do', 'v'),
    'gidemiyorum': ('I cannot go', 'v'),

    # ── More common words ────────────────────────────
    'tarafından': ('by (agent)', 'postp'),
    'nedeniyle': ('because of', 'postp'),
    'sayesinde': ('thanks to', 'postp'),
    'konusunda': ('regarding/about', 'postp'),
    'sırasında': ('during', 'postp'),
    'yerine': ('instead of', 'postp'),
    'dışında': ('outside of/except', 'postp'),
    'dolayısıyla': ('therefore', 'conj'),
    'böylece': ('thus/so', 'conj'),
    'dolayı': ('due to', 'postp'),
    'hem': ('both', 'conj'),
    'meğer': ('it turns out', 'conj'),
    'üstelik': ('moreover', 'conj'),

    # ── Place names in deck (proper nouns) ───────────
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

    # ── Common words ─────────────────────────────────
    'acı': ('bitter/pain', 'n'),
    'güneşli': ('sunny', 'adj'),
    'bulutlu': ('cloudy', 'adj'),
    'yağmurlu': ('rainy', 'adj'),
    'karlı': ('snowy', 'adj'),
    'rüzgarlı': ('windy', 'adj'),
    'sisli': ('foggy', 'adj'),
    'serin': ('cool', 'adj'),
    'ılık': ('warm/lukewarm', 'adj'),
    'nemli': ('humid', 'adj'),
    'kuru': ('dry', 'adj'),
    'yüz': ('face/hundred', 'n'),
    'yüzde': ('percent', 'n'),
    'derece': ('degree', 'n'),
    'metre': ('meter', 'n'),
    'kilometre': ('kilometer', 'n'),
    'gram': ('gram', 'n'),
    'litre': ('liter', 'n'),
    'lira': ('lira (currency)', 'n'),
    'kuruş': ('kurus (currency)', 'n'),
    'saat': ('hour/clock', 'n'),

    # ── Even more common words ───────────────────────
    'ayrılmak': ('to leave/separate', 'v'),
    'bağışlamak': ('to donate/forgive', 'v'),
    'bahsetmek': ('to mention', 'v'),
    'beslemek': ('to feed', 'v'),
    'biriktirmek': ('to save/accumulate', 'v'),
    'çevirmek': ('to translate/turn', 'v'),
    'dayanmak': ('to endure/lean on', 'v'),
    'desteklemek': ('to support', 'v'),
    'dışarıda': ('outside', 'adv'),
    'dikkat': ('attention/careful', 'n'),
    'doyurmak': ('to satisfy/fill up', 'v'),
    'düzenlemek': ('to organize', 'v'),
    'elde': ('in hand', 'n'),
    'etkilemek': ('to influence/affect', 'v'),
    'göçmek': ('to migrate', 'v'),
    'gözetmek': ('to watch over', 'v'),
    'güvenmek': ('to trust', 'v'),
    'haklı': ('right/justified', 'adj'),
    'harcamak': ('to spend', 'v'),
    'ilgilenmek': ('to be interested in', 'v'),
    'incelemek': ('to examine', 'v'),
    'itmek': ('to push', 'v'),
    'karşılamak': ('to meet/welcome', 'v'),
    'karşılaşmak': ('to encounter', 'v'),
    'katılmak': ('to join/participate', 'v'),
    'kurtarmak': ('to save/rescue', 'v'),
    'müdahale': ('intervention', 'n'),
    'onarmak': ('to repair', 'v'),
    'saklamak': ('to hide/store', 'v'),
    'sakınmak': ('to beware', 'v'),
    'şaşırmak': ('to be surprised', 'v'),
    'savaşmak': ('to fight', 'v'),
    'taşınmak': ('to move (house)', 'v'),
    'toplamak': ('to collect/gather', 'v'),
    'tutuklamak': ('to arrest', 'v'),
    'uğraşmak': ('to deal with/strive', 'v'),
    'uyarmak': ('to warn', 'v'),
    'yalnız': ('alone/only', 'adj'),
    'yansıtmak': ('to reflect', 'v'),
    'yaratmak': ('to create', 'v'),
    'yatmak': ('to lie down/sleep', 'v'),
    'yetiştirmek': ('to raise/grow', 'v'),
    'yönelmek': ('to turn toward', 'v'),
    'yürütmek': ('to walk/execute', 'v'),
}

# ── Turkish suffix-based POS inference ───────────────────────
# Common Turkish derivational suffixes
def infer_pos(word):
    """Infer part of speech from common Turkish suffixes."""
    if word.endswith(('mak', 'mek')):
        return 'v'
    # -lık/-lik/-luk/-lük = noun suffix
    if word.endswith(('lık', 'lik', 'luk', 'lük')):
        return 'n'
    # -lı/-li/-lu/-lü, -sız/-siz/-suz/-süz = adjective suffixes
    if word.endswith(('lı', 'li', 'lu', 'lü', 'sız', 'siz', 'suz', 'süz')):
        return 'adj'
    # -ca/-ce, -ça/-çe = adverb (manner)
    if word.endswith(('ca', 'ce', 'ça', 'çe')) and len(word) > 4:
        return 'adv'
    # -cı/-ci/-cu/-cü = profession/agent noun
    if word.endswith(('cı', 'ci', 'cu', 'cü', 'çı', 'çi', 'çu', 'çü')):
        return 'n'
    # verb conjugation endings
    verb_endings = (
        'yor', 'yorum', 'yorsun', 'yoruz', 'yorsunuz', 'yorlar',
        'dım', 'dim', 'dum', 'düm', 'dın', 'din', 'dun', 'dün',
        'dı', 'di', 'du', 'dü', 'tı', 'ti', 'tu', 'tü',
        'tım', 'tim', 'tum', 'tüm',
        'mış', 'miş', 'muş', 'müş',
        'acak', 'ecek',
        'ıyor', 'iyor', 'uyor', 'üyor',
        'malı', 'meli',
        'malıyım', 'meliyim',
        'malısın', 'melisin',
        'abilir', 'ebilir',
        'amaz', 'emez', 'amam', 'emem',
    )
    if word.endswith(verb_endings):
        return 'v'
    # Default to noun
    return 'n'


def generate_translation_from_context(word, contexts):
    """Try to guess a reasonable translation from deck context."""
    # Check if word appears in our knowledge base
    if word in KNOWN_WORDS:
        return KNOWN_WORDS[word]

    # Try to infer from common Turkish patterns
    pos = infer_pos(word)

    # For verb forms, try to relate back to an infinitive
    # and generate a reasonable translation
    return None


# ── Generate missing entries ─────────────────────────────────
# For words not in KNOWN_WORDS, we need to generate entries.
# We'll use deck context (English translations) and Turkish patterns.

# Build context mapping: for each Turkish word, find the English sentence it appears in
word_to_english = {}
for card in deck:
    tr_text = card.get('target', '')
    en_text = card.get('english', '')
    cleaned = re.sub(r'[.,!?;:"""\u201c\u201d\u2018\u2019()\u2014\u2013\-\u2026\u00ab\u00bb\[\]{}]', ' ', tr_text)
    for w in cleaned.split():
        wl = w.strip().lower()
        if wl and wl not in word_to_english:
            word_to_english[wl] = en_text

# For REALLY generating a good dictionary, let's look at common
# Turkish morphology patterns and build translations systematically.

# Turkish vowel harmony helpers
BACK_V = set('aıou')
FRONT_V = set('eiöü')

def get_last_vowel(word):
    for ch in reversed(word):
        if ch in BACK_V or ch in FRONT_V:
            return ch
    return 'a'

def is_back(word):
    v = get_last_vowel(word)
    return v in BACK_V

# Common Turkish suffixes and what they mean for translation
SUFFIX_MEANINGS = {
    # Plural
    'lar': ('plural', lambda base_en: f'{base_en} (plural)'),
    'ler': ('plural', lambda base_en: f'{base_en} (plural)'),
    # Case
    'da': ('locative', lambda base_en: f'in/at {base_en}'),
    'de': ('locative', lambda base_en: f'in/at {base_en}'),
    'ta': ('locative', lambda base_en: f'in/at {base_en}'),
    'te': ('locative', lambda base_en: f'in/at {base_en}'),
    'dan': ('ablative', lambda base_en: f'from {base_en}'),
    'den': ('ablative', lambda base_en: f'from {base_en}'),
    'tan': ('ablative', lambda base_en: f'from {base_en}'),
    'ten': ('ablative', lambda base_en: f'from {base_en}'),
    'ya': ('dative', lambda base_en: f'to {base_en}'),
    'ye': ('dative', lambda base_en: f'to {base_en}'),
}

# Try to find base forms in existing dict or KNOWN_WORDS
def find_base_translation(word, existing_dict_entries):
    """Try to find a base form of the word and its translation."""
    # Common suffix order (longest first) for stripping
    suffixes = [
        'larından', 'lerinden', 'larınızı', 'lerinizi',
        'larımız', 'lerimiz', 'larında', 'lerinde',
        'larını', 'lerini', 'lardan', 'lerden',
        'larda', 'lerde', 'lara', 'lere',
        'ların', 'lerin', 'ları', 'leri',
        'lar', 'ler',
        'ından', 'inden', 'undan', 'ünden',
        'ıyla', 'iyle', 'uyla', 'üyle',
        'ında', 'inde', 'unda', 'ünde',
        'ına', 'ine', 'una', 'üne',
        'dan', 'den', 'tan', 'ten',
        'nın', 'nin', 'nun', 'nün',
        'da', 'de', 'ta', 'te',
        'ya', 'ye',
        'nı', 'ni', 'nu', 'nü',
        'ın', 'in', 'un', 'ün',
        'ım', 'im', 'um', 'üm',
        'ı', 'i', 'u', 'ü',
        'a', 'e',
    ]

    for sfx in suffixes:
        if word.endswith(sfx) and len(word) > len(sfx) + 1:
            stem = word[:-len(sfx)]
            if stem in existing_dict_entries:
                return stem, existing_dict_entries[stem]
            if stem in KNOWN_WORDS:
                return stem, KNOWN_WORDS[stem]
            # Try consonant mutation
            mutations = {'ğ': 'k', 'b': 'p', 'd': 't', 'c': 'ç'}
            if stem and stem[-1] in mutations:
                mutated = stem[:-1] + mutations[stem[-1]]
                if mutated in existing_dict_entries:
                    return mutated, existing_dict_entries[mutated]
                if mutated in KNOWN_WORDS:
                    return mutated, KNOWN_WORDS[mutated]
            # Try buffer consonant removal
            if stem and stem[-1] in 'yns' and len(stem) > 2:
                no_buffer = stem[:-1]
                if no_buffer in existing_dict_entries:
                    return no_buffer, existing_dict_entries[no_buffer]
                if no_buffer in KNOWN_WORDS:
                    return no_buffer, KNOWN_WORDS[no_buffer]

    return None, None


# Build existing entries lookup
existing_entries = {}
for m in re.finditer(r"'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'\s*\}", ts_content):
    key, en, ipa, pos = m.groups()
    existing_entries[key] = (en, pos)

# Now generate all new entries
new_entries = {}
unknown_words = []

for word in sorted(missing):
    # Skip words with apostrophes (proper nouns with suffixes like "istanbul'da")
    if "'" in word:
        # For proper nouns, try to identify base
        base = word.split("'")[0]
        if base in KNOWN_WORDS:
            en_base, pos_base = KNOWN_WORDS[base]
            suffix = word.split("'")[1]
            sfx_meaning = {
                'da': 'in', 'de': 'in', 'ta': 'in', 'te': 'in',
                'dan': 'from', 'den': 'from', 'tan': 'from', 'ten': 'from',
                'ya': 'to', 'ye': 'to', 'a': 'to', 'e': 'to',
                'nın': 'of', 'nin': 'of', 'nun': 'of', 'nün': 'of',
                'daki': 'in (adj.)', 'deki': 'in (adj.)',
                'ı': '(acc.)', 'i': '(acc.)', 'u': '(acc.)', 'ü': '(acc.)',
            }
            sfx_en = sfx_meaning.get(suffix, '')
            en_trans = f'{sfx_en} {en_base}'.strip() if sfx_en else en_base
            new_entries[word] = (en_trans, turkish_ipa(word.replace("'", "")), pos_base)
        else:
            # Generic proper noun + suffix
            new_entries[word] = (f'{base} (proper noun)', turkish_ipa(word.replace("'", "")), 'n')
        continue

    # Check our knowledge base first
    if word in KNOWN_WORDS:
        en, pos = KNOWN_WORDS[word]
        new_entries[word] = (en, turkish_ipa(word), pos)
        continue

    # Try to find base form
    base, base_info = find_base_translation(word, {**existing_entries, **{k: v for k, v in KNOWN_WORDS.items()}})
    if base_info:
        base_en = base_info[0] if isinstance(base_info, tuple) else base_info
        base_pos = base_info[1] if isinstance(base_info, tuple) else 'n'
        # Figure out what suffix was stripped
        suffix_part = word[len(base):] if word.startswith(base) else ''
        pos = infer_pos(word) if not suffix_part else base_pos

        # Generate a contextual translation
        sfx_meanings = {
            'lar': '(pl.)', 'ler': '(pl.)',
            'da': '(loc.)', 'de': '(loc.)', 'ta': '(loc.)', 'te': '(loc.)',
            'dan': '(abl.)', 'den': '(abl.)', 'tan': '(abl.)', 'ten': '(abl.)',
            'ya': '(dat.)', 'ye': '(dat.)',
            'ı': '(acc.)', 'i': '(acc.)', 'u': '(acc.)', 'ü': '(acc.)',
            'ın': '(gen.)', 'in': '(gen.)', 'un': '(gen.)', 'ün': '(gen.)',
            'ım': '(1sg poss.)', 'im': '(1sg poss.)', 'um': '(1sg poss.)', 'üm': '(1sg poss.)',
            'nı': '(acc.)', 'ni': '(acc.)', 'nu': '(acc.)', 'nü': '(acc.)',
        }
        sfx_label = sfx_meanings.get(suffix_part, '')
        en_trans = f'{base_en} {sfx_label}'.strip() if sfx_label else base_en
        new_entries[word] = (en_trans, turkish_ipa(word), pos)
        continue

    # For remaining words, try to use deck context
    pos = infer_pos(word)
    context = word_to_english.get(word, '')

    # Mark as needing manual review but still add with best guess
    new_entries[word] = (f'[{word}]', turkish_ipa(word), pos)
    unknown_words.append(word)

print(f"\nGenerated {len(new_entries)} new entries")
print(f"Of which {len(unknown_words)} need translations from context")

# ── Now use deck context to fill in translations for unknown words ──
# For each unknown word, try to extract meaning from its English sentence pair
# using simple word alignment heuristics.

def try_translate_from_context(tr_word, en_sentence):
    """Try to guess word translation from sentence context."""
    en_lower = en_sentence.lower()

    # Common Turkish→English word patterns
    simple_map = {
        # Word endings that suggest meaning
        'mak': ('to ...', 'v'),
        'mek': ('to ...', 'v'),
    }

    return None

# Now let's do a smarter approach: for each card, align Turkish words to English
# by position and frequency to build a translation table

# Build word frequency across all cards
from collections import Counter, defaultdict

tr_en_cooccurrence = defaultdict(Counter)
for card in deck:
    tr_text = card.get('target', '')
    en_text = card.get('english', '')
    tr_words_card = re.sub(r'[.,!?;:"""\u201c\u201d\u2018\u2019()\u2014\u2013\-\u2026\u00ab\u00bb\[\]{}]', ' ', tr_text).lower().split()
    en_words_card = re.sub(r'[.,!?;:"""\u201c\u201d\u2018\u2019()\u2014\u2013\-\u2026\u00ab\u00bb\[\]{}]', ' ', en_text).lower().split()

    for tw in tr_words_card:
        tw = tw.strip()
        if tw:
            for ew in en_words_card:
                ew = ew.strip()
                if ew:
                    tr_en_cooccurrence[tw][ew] += 1

# For unknown words, pick the most co-occurring English word(s)
ENGLISH_STOP = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                'to', 'of', 'in', 'at', 'on', 'for', 'with', 'and', 'or',
                'it', 'its', 'my', 'your', 'his', 'her', 'our', 'their',
                'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'us', 'them',
                'this', 'that', 'these', 'those', 'not', 'do', 'does', 'did',
                'have', 'has', 'had', 'will', 'would', 'should', 'could', 'can',
                'very', 'so', 'too', 'also', 'but', 'if', 'then', 'than'}

updated_count = 0
for word in unknown_words:
    if word in tr_en_cooccurrence:
        # Get top co-occurring English words, excluding stop words
        candidates = [(ew, count) for ew, count in tr_en_cooccurrence[word].most_common(20)
                      if ew not in ENGLISH_STOP and len(ew) > 2]
        if candidates:
            # Take top 1-2 candidates
            top_en = candidates[0][0]
            if len(candidates) > 1 and candidates[1][1] > candidates[0][1] * 0.7:
                top_en = f'{candidates[0][0]}/{candidates[1][0]}'

            old_en, old_ipa, old_pos = new_entries[word]
            new_entries[word] = (top_en, old_ipa, old_pos)
            updated_count += 1

print(f"Updated {updated_count} entries from context co-occurrence")

# ── Write the final tr.ts file ───────────────────────────────
# Read the template parts from the existing file (import and suffix-stripping code)

# Extract everything before the dictionary and after
dict_start = ts_content.find("const dictionary: Record<string, DictEntry> = {")
dict_end = ts_content.find("};\n\n// ── Turkish suffix stripping")
if dict_end == -1:
    dict_end = ts_content.find("};\n\n// ──")

# Get the suffix stripping and lookupWord code
suffix_code_start = ts_content.find("// ── Turkish suffix stripping")
suffix_code = ts_content[suffix_code_start:]

# Build all entries (existing + new)
all_entries = {}

# Parse existing entries more carefully
for m in re.finditer(r"'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'\s*\}", ts_content[:suffix_code_start]):
    key, en, ipa, pos = m.groups()
    all_entries[key] = (en, ipa, pos)

# Add new entries
for word, (en, ipa, pos) in new_entries.items():
    if word not in all_entries:
        all_entries[word] = (en, ipa, pos)

print(f"\nTotal entries: {len(all_entries)}")
print(f"Old entries: {len(existing_keys)}")
print(f"New entries: {len(all_entries) - len(existing_keys)}")

# Calculate coverage
covered = 0
for w in deck_words:
    if w in all_entries:
        covered += 1
coverage = covered / len(deck_words) * 100
print(f"Deck coverage: {covered}/{len(deck_words)} = {coverage:.1f}%")

# ── Organize entries by category ─────────────────────────────
verbs = {}
nouns = {}
adjectives = {}
adverbs = {}
pronouns = {}
conjunctions = {}
postpositions = {}
numbers = {}
particles = {}
interjections = {}
other = {}

for word, (en, ipa, pos) in sorted(all_entries.items()):
    if pos == 'v':
        verbs[word] = (en, ipa, pos)
    elif pos == 'n':
        nouns[word] = (en, ipa, pos)
    elif pos == 'adj':
        adjectives[word] = (en, ipa, pos)
    elif pos == 'adv':
        adverbs[word] = (en, ipa, pos)
    elif pos == 'pron':
        pronouns[word] = (en, ipa, pos)
    elif pos == 'conj':
        conjunctions[word] = (en, ipa, pos)
    elif pos == 'postp':
        postpositions[word] = (en, ipa, pos)
    elif pos == 'num':
        numbers[word] = (en, ipa, pos)
    elif pos == 'part':
        particles[word] = (en, ipa, pos)
    elif pos == 'intj':
        interjections[word] = (en, ipa, pos)
    else:
        other[word] = (en, ipa, pos)

def write_entries(entries, indent='  '):
    """Write entries in TypeScript format."""
    lines = []
    for word, (en, ipa, pos) in sorted(entries.items()):
        # Escape single quotes in translations
        en_escaped = en.replace("'", "\\'")
        word_escaped = word.replace("'", "\\'")
        lines.append(f"{indent}'{word_escaped}': {{ en: '{en_escaped}', ipa: '{ipa}', pos: '{pos}' }},")
    return '\n'.join(lines)

# ── Write the file ───────────────────────────────────────────
output = f"""import type {{ DictEntry }} from './es';
import {{ findInfinitive }} from '../conjugation/tr';

// ── Turkish Dictionary ────────────────────────────────────────
// Keys are lowercase Turkish (with ç, ğ, ı, ö, ş, ü).
// Each entry: {{ en: 'English translation', ipa: 'IPA pronunciation', pos: 'part of speech' }}
const dictionary: Record<string, DictEntry> = {{
  // ── Verbs ─────────────────────────────────────────────────
{write_entries(verbs)}

  // ── Nouns ─────────────────────────────────────────────────
{write_entries(nouns)}

  // ── Adjectives ────────────────────────────────────────────
{write_entries(adjectives)}

  // ── Adverbs ───────────────────────────────────────────────
{write_entries(adverbs)}

  // ── Pronouns ──────────────────────────────────────────────
{write_entries(pronouns)}

  // ── Conjunctions ──────────────────────────────────────────
{write_entries(conjunctions)}

  // ── Postpositions ─────────────────────────────────────────
{write_entries(postpositions)}

  // ── Numbers ───────────────────────────────────────────────
{write_entries(numbers)}

  // ── Particles ─────────────────────────────────────────────
{write_entries(particles)}

  // ── Interjections ─────────────────────────────────────────
{write_entries(interjections)}
}};

{suffix_code}"""

with open('src/data/dictionary/tr.ts', 'w') as f:
    f.write(output)

print(f"\nWrote {len(all_entries)} entries to src/data/dictionary/tr.ts")
print("Done!")
