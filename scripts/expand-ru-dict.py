#!/usr/bin/env python3
"""
expand-ru-dict.py

Expands the Russian dictionary (ru.ts) by:
1. Reading deck.json and tokenizing all target sentences
2. Reading existing ru.ts dictionary keys
3. Simulating findInfinitiveCandidates to exclude resolved words
4. Generating en/ipa/pos for truly missing words
5. Appending new entries to ru.ts

Usage: python3 scripts/expand-ru-dict.py [--write]
"""

import json
import re
import os
import sys

WRITE = '--write' in sys.argv

BASE = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')
DECK_PATH = os.path.join(BASE, 'russian', 'deck.json')
DICT_PATH = os.path.join(BASE, 'dictionary', 'ru.ts')

# ── Load deck ────────────────────────────────────────────────
with open(DECK_PATH, 'r', encoding='utf-8') as f:
    deck = json.load(f)

# ── Load dictionary keys ─────────────────────────────────────
with open(DICT_PATH, 'r', encoding='utf-8') as f:
    dict_content = f.read()

dict_keys = set()
key_pattern = re.compile(r"""(?:^|\n)\s*(?:['"]([^'"]+)['"]|([\w\u0400-\u04FF][\w\u0400-\u04FF]*))\s*:\s*\{\s*en:""")
for m in key_pattern.finditer(dict_content):
    key = (m.group(1) or m.group(2) or '').lower()
    if key:
        dict_keys.add(key)

print(f"Existing dictionary entries: {len(dict_keys)}")

# ── Tokenize deck words ──────────────────────────────────────
def clean_word(w):
    return re.sub(r'[.,!?;:"""\'\'«»()––…\d\[\]{}]', '', w).strip().lower()

deck_words = {}
deck_sentences = {}  # word -> list of (target, english) pairs for translation
for card in deck:
    target = card.get('target', '')
    english = card.get('english', '')
    words = target.split()
    for w in words:
        c = clean_word(w)
        if c and len(c) > 0:
            deck_words[c] = deck_words.get(c, 0) + 1
            if c not in deck_sentences:
                deck_sentences[c] = []
            if len(deck_sentences[c]) < 5:
                deck_sentences[c].append((target, english))

print(f"Unique deck words: {len(deck_words)}")

# ── IRREGULARS (from conjugation/ru.ts) ──────────────────────
IRREGULARS = {
    'быть': {'present': ['–','–','есть','–','–','–'], 'past': ['был','была','было','были']},
    'есть': {'present': ['ем','ешь','ест','едим','едите','едят'], 'past': ['ел','ела','ело','ели']},
    'дать': {'present': ['дам','дашь','даст','дадим','дадите','дадут'], 'past': ['дал','дала','дало','дали']},
    'хотеть': {'present': ['хочу','хочешь','хочет','хотим','хотите','хотят']},
    'мочь': {'present': ['могу','можешь','может','можем','можете','могут'], 'past': ['мог','могла','могло','могли']},
    'идти': {'present': ['иду','идёшь','идёт','идём','идёте','идут'], 'past': ['шёл','шла','шло','шли']},
    'ехать': {'present': ['еду','едешь','едет','едем','едете','едут']},
    'бежать': {'present': ['бегу','бежишь','бежит','бежим','бежите','бегут']},
    'брать': {'present': ['беру','берёшь','берёт','берём','берёте','берут']},
    'жить': {'present': ['живу','живёшь','живёт','живём','живёте','живут']},
    'пить': {'present': ['пью','пьёшь','пьёт','пьём','пьёте','пьют']},
    'писать': {'present': ['пишу','пишешь','пишет','пишем','пишете','пишут']},
    'сказать': {'present': ['скажу','скажешь','скажет','скажем','скажете','скажут']},
    'взять': {'present': ['возьму','возьмёшь','возьмёт','возьмём','возьмёте','возьмут']},
    'стать': {'present': ['стану','станешь','станет','станем','станете','станут']},
}

def find_infinitive_candidates(form):
    """Python port of findInfinitiveCandidates from conjugation/ru.ts"""
    candidates = []

    # Direct infinitive
    if form.endswith('ть') or form.endswith('ти') or form.endswith('чь') or \
       form.endswith('ться') or form.endswith('тись'):
        return [form]

    # Check irregular forms
    for inf, data in IRREGULARS.items():
        for key in ['present', 'past']:
            if key in data:
                for f in data[key]:
                    parts = f.split('/')
                    if form in parts or f == form:
                        return [inf]

    # Try stripping reflexive suffix
    base_form = form
    was_reflexive = False
    if form.endswith('ся') or form.endswith('сь'):
        base_form = form[:-2]
        was_reflexive = True
    refl_suffix = 'ся' if was_reflexive else ''

    # Try past tense: strip л/ла/ло/ли
    for suffix in ['ли', 'ло', 'ла', 'л']:
        if base_form.endswith(suffix):
            stem = base_form[:-len(suffix)]
            if len(stem) >= 2:
                candidates.extend([
                    stem + 'ть' + refl_suffix,
                    stem + 'ать' + refl_suffix,
                    stem + 'ить' + refl_suffix,
                    stem + 'еть' + refl_suffix,
                    stem + 'ять' + refl_suffix,
                    stem + 'ти' + refl_suffix,
                ])
                return candidates

    # Try present tense endings
    first_conj = ['ю', 'ешь', 'ет', 'ем', 'ете', 'ют']
    second_conj = ['у', 'ишь', 'ит', 'им', 'ите', 'ят', 'ат']

    for ending in first_conj:
        if base_form.endswith(ending):
            stem = base_form[:-len(ending)]
            if len(stem) >= 2:
                candidates.extend([
                    stem + 'ть' + refl_suffix,
                    stem + 'ать' + refl_suffix,
                    stem + 'ять' + refl_suffix,
                    stem + 'еть' + refl_suffix,
                    stem + 'овать' + refl_suffix,
                    stem + 'евать' + refl_suffix,
                ])
                break

    for ending in second_conj:
        if base_form.endswith(ending):
            stem = base_form[:-len(ending)]
            if len(stem) >= 2:
                candidates.extend([
                    stem + 'ить' + refl_suffix,
                    stem + 'ать' + refl_suffix,
                    stem + 'еть' + refl_suffix,
                    stem + 'ять' + refl_suffix,
                    stem + 'ть' + refl_suffix,
                ])
                break

    # -овать/-евать verbs
    ov_endings = ['ую', 'уешь', 'ует', 'уем', 'уете', 'уют']
    for e in ov_endings:
        if base_form.endswith(e):
            stem = base_form[:-len(e)]
            if len(stem) >= 1:
                candidates.extend([
                    stem + 'овать' + refl_suffix,
                    stem + 'евать' + refl_suffix,
                ])
            break

    return candidates

# ── ADJ_ENDINGS (from lookupWord in ru.ts) ───────────────────
ADJ_ENDINGS = [
    ('ого', ['ый', 'ой']), ('его', ['ий']),
    ('ому', ['ый', 'ой']), ('ему', ['ий']),
    ('ую', ['ый', 'ой']), ('юю', ['ий']),
    ('ая', ['ый', 'ой']), ('яя', ['ий']),
    ('ое', ['ый', 'ой']), ('ее', ['ий']),
    ('ые', ['ый', 'ой']), ('ие', ['ий']),
    ('ых', ['ый', 'ой']), ('их', ['ий']),
    ('ым', ['ый', 'ой']), ('им', ['ий']),
    ('ом', ['ый', 'ой']), ('ем', ['ий']),
    ('ой', ['ый', 'ой']), ('ей', ['ий']),
]

NOUN_ENDINGS = [
    'ами', 'ями', 'ам', 'ям', 'ах', 'ях',
    'ов', 'ев', 'ей',
    'ом', 'ем', 'ём',
    'ой', 'ей', 'ёй',
    'ую', 'юю',
    'ы', 'и', 'а', 'я', 'у', 'ю', 'е', 'о',
]

def lookup_resolvable(word, keys):
    """Simulate the lookupWord logic to check if word resolves to an existing key"""
    c = word.lower()
    if c in keys:
        return True

    # ё/е variation
    with_yo = c.replace('е', 'ё')
    if with_yo != c and with_yo in keys:
        return True
    without_yo = c.replace('ё', 'е')
    if without_yo != c and without_yo in keys:
        return True

    # Verb form resolution
    inf_candidates = find_infinitive_candidates(c)
    for inf in inf_candidates:
        if inf in keys:
            return True
        inf_yo = inf.replace('е', 'ё')
        if inf_yo != inf and inf_yo in keys:
            return True
        inf_no_yo = inf.replace('ё', 'е')
        if inf_no_yo != inf and inf_no_yo in keys:
            return True

    # Adjective ending stripping
    for suffix, bases in ADJ_ENDINGS:
        if c.endswith(suffix) and len(c) > len(suffix) + 1:
            stem = c[:-len(suffix)]
            for base in bases:
                if stem + base in keys:
                    return True

    # Noun case ending stripping
    for ending in NOUN_ENDINGS:
        if c.endswith(ending) and len(c) > len(ending) + 1:
            stem = c[:-len(ending)]
            if stem in keys:
                return True
            for nom in ['', 'а', 'о', 'е', 'ь', 'й', 'я']:
                if stem + nom in keys:
                    return True

    # Reflexive
    if c.endswith('ся'):
        base = c[:-2]
        if base in keys:
            return True
        # try findInfinitive on reflexive
        ref_cands = find_infinitive_candidates(c)
        for inf in ref_cands:
            if inf in keys:
                return True
    if c.endswith('сь'):
        base = c[:-2] + 'ся'
        if base in keys:
            return True

    return False

# ── Find truly missing words ─────────────────────────────────
missing = {}
for word, count in deck_words.items():
    if not lookup_resolvable(word, dict_keys):
        missing[word] = count

print(f"Truly missing words: {len(missing)}")

# ── Hardcoded common Russian words (~300+) ───────────────────
COMMON_WORDS = {
    # Pronouns
    'я': ('I', 'ja', 'pron'), 'ты': ('you (informal)', 'tɨ', 'pron'),
    'он': ('he', 'on', 'pron'), 'она': ('she', 'ɐˈna', 'pron'),
    'оно': ('it', 'ɐˈno', 'pron'), 'мы': ('we', 'mɨ', 'pron'),
    'вы': ('you (formal/pl)', 'vɨ', 'pron'), 'они': ('they', 'ɐˈnʲi', 'pron'),
    'меня': ('me (gen/acc)', 'mʲɪˈnʲa', 'pron'), 'мне': ('to me', 'mnʲe', 'pron'),
    'мной': ('with me', 'mnoj', 'pron'), 'тебя': ('you (gen/acc)', 'tʲɪˈbʲa', 'pron'),
    'тебе': ('to you', 'tʲɪˈbʲe', 'pron'), 'тобой': ('with you', 'tɐˈboj', 'pron'),
    'его': ('his, him', 'jɪˈvo', 'pron'), 'ему': ('to him', 'jɪˈmu', 'pron'),
    'им': ('to them, by him', 'im', 'pron'), 'её': ('her', 'jɪˈjo', 'pron'),
    'ей': ('to her', 'jej', 'pron'), 'нас': ('us', 'nas', 'pron'),
    'нам': ('to us', 'nam', 'pron'), 'нами': ('with us', 'ˈnamʲɪ', 'pron'),
    'вас': ('you (formal, acc/gen)', 'vas', 'pron'), 'вам': ('to you (formal)', 'vam', 'pron'),
    'вами': ('with you (formal)', 'ˈvamʲɪ', 'pron'),
    'них': ('them (prep)', 'nʲix', 'pron'), 'ними': ('with them', 'ˈnʲimʲɪ', 'pron'),
    'себя': ('oneself', 'sʲɪˈbʲa', 'pron'), 'себе': ('to oneself', 'sʲɪˈbʲe', 'pron'),
    'собой': ('with oneself', 'sɐˈboj', 'pron'),
    'кто': ('who', 'kto', 'pron'), 'что': ('what, that', 'ʂto', 'pron'),
    'это': ('this, it', 'ˈɛtə', 'pron'), 'этот': ('this (m)', 'ˈɛtət', 'pron'),
    'эта': ('this (f)', 'ˈɛtə', 'pron'), 'эти': ('these', 'ˈɛtʲɪ', 'pron'),
    'этого': ('of this', 'ˈɛtəvə', 'pron'), 'этом': ('about this', 'ˈɛtəm', 'pron'),
    'этой': ('of this (f)', 'ˈɛtəj', 'pron'), 'этих': ('of these', 'ˈɛtʲɪx', 'pron'),
    'этому': ('to this', 'ˈɛtəmu', 'pron'),
    'тот': ('that (m)', 'tot', 'pron'), 'та': ('that (f)', 'ta', 'pron'),
    'то': ('that (n)', 'to', 'pron'), 'те': ('those', 'tʲe', 'pron'),
    'того': ('of that', 'tɐˈvo', 'pron'), 'том': ('about that', 'tom', 'pron'),
    'той': ('of that (f)', 'toj', 'pron'),
    'свой': ('one\'s own', 'svoj', 'pron'), 'своё': ('one\'s own (n)', 'svɐˈjo', 'pron'),
    'свою': ('one\'s own (f, acc)', 'svɐˈju', 'pron'), 'своей': ('one\'s own (f, gen)', 'svɐˈjej', 'pron'),
    'своего': ('one\'s own (m, gen)', 'svɐjɪˈvo', 'pron'), 'своих': ('one\'s own (pl, gen)', 'svɐˈix', 'pron'),
    'своим': ('one\'s own (dat)', 'svɐˈim', 'pron'), 'своими': ('one\'s own (instr, pl)', 'svɐˈimʲɪ', 'pron'),
    'свои': ('one\'s own (pl)', 'svɐˈi', 'pron'), 'своём': ('one\'s own (prep, m)', 'svɐˈjom', 'pron'),
    'мой': ('my', 'moj', 'pron'), 'моя': ('my (f)', 'mɐˈja', 'pron'),
    'моё': ('my (n)', 'mɐˈjo', 'pron'), 'мои': ('my (pl)', 'mɐˈi', 'pron'),
    'моего': ('my (gen, m)', 'mɐjɪˈvo', 'pron'), 'моей': ('my (gen, f)', 'mɐˈjej', 'pron'),
    'моих': ('my (gen, pl)', 'mɐˈix', 'pron'), 'моим': ('my (dat)', 'mɐˈim', 'pron'),
    'моём': ('my (prep, m)', 'mɐˈjom', 'pron'),
    'твой': ('your', 'tvoj', 'pron'), 'твоя': ('your (f)', 'tvɐˈja', 'pron'),
    'твоё': ('your (n)', 'tvɐˈjo', 'pron'), 'твои': ('your (pl)', 'tvɐˈi', 'pron'),
    'наш': ('our', 'naʂ', 'pron'), 'наша': ('our (f)', 'ˈnaʂə', 'pron'),
    'наше': ('our (n)', 'ˈnaʂɪ', 'pron'), 'наши': ('our (pl)', 'ˈnaʂɨ', 'pron'),
    'нашей': ('our (f, gen)', 'ˈnaʂɪj', 'pron'), 'нашего': ('our (m, gen)', 'ˈnaʂɪvə', 'pron'),
    'наших': ('our (pl, gen)', 'ˈnaʂɨx', 'pron'), 'нашем': ('our (prep, m)', 'ˈnaʂɪm', 'pron'),
    'нашим': ('our (dat)', 'ˈnaʂɨm', 'pron'),
    'ваш': ('your (formal)', 'vaʂ', 'pron'), 'ваша': ('your (f, formal)', 'ˈvaʂə', 'pron'),
    'ваше': ('your (n, formal)', 'ˈvaʂɪ', 'pron'), 'ваши': ('your (pl, formal)', 'ˈvaʂɨ', 'pron'),
    'их': ('their', 'ix', 'pron'),
    'весь': ('all, entire', 'vʲesʲ', 'pron'), 'вся': ('all (f)', 'fsʲa', 'pron'),
    'всё': ('everything', 'fsʲo', 'pron'), 'все': ('everyone, all (pl)', 'fsʲe', 'pron'),
    'всего': ('of all', 'fsʲɪˈvo', 'pron'), 'всех': ('of all (pl)', 'fsʲex', 'pron'),
    'всем': ('to all', 'fsʲem', 'pron'), 'всей': ('of all (f)', 'fsʲej', 'pron'),
    'каждый': ('every, each', 'ˈkaʐdɨj', 'pron'), 'каждая': ('every (f)', 'ˈkaʐdəjə', 'pron'),
    'каждое': ('every (n)', 'ˈkaʐdəjɪ', 'pron'),
    'никто': ('nobody', 'nʲɪkˈto', 'pron'), 'ничего': ('nothing (gen)', 'nʲɪtɕɪˈvo', 'pron'),
    'ничто': ('nothing', 'nʲɪtɕˈto', 'pron'),
    'какой': ('which, what kind', 'kɐˈkoj', 'pron'), 'какая': ('which (f)', 'kɐˈkajə', 'pron'),
    'какое': ('which (n)', 'kɐˈkojɪ', 'pron'), 'какие': ('which (pl)', 'kɐˈkʲijɪ', 'pron'),
    'такой': ('such', 'tɐˈkoj', 'pron'), 'такая': ('such (f)', 'tɐˈkajə', 'pron'),
    'такое': ('such (n)', 'tɐˈkojɪ', 'pron'), 'такие': ('such (pl)', 'tɐˈkʲijɪ', 'pron'),
    'другой': ('other, another', 'drʊˈɡoj', 'adj'), 'другая': ('other (f)', 'drʊˈɡajə', 'adj'),
    'другое': ('other (n)', 'drʊˈɡojɪ', 'adj'), 'другие': ('other (pl)', 'drʊˈɡʲijɪ', 'adj'),
    'других': ('of others', 'drʊˈɡʲix', 'adj'), 'другим': ('to others', 'drʊˈɡʲim', 'adj'),
    'другому': ('to another', 'drʊˈɡomu', 'adj'),
    'сам': ('oneself, himself', 'sam', 'pron'), 'сама': ('herself', 'sɐˈma', 'pron'),
    'само': ('itself', 'sɐˈmo', 'pron'), 'сами': ('ourselves/themselves', 'sɐˈmʲi', 'pron'),
    'который': ('which, who (rel)', 'kɐˈtorɨj', 'pron'), 'которая': ('which (f, rel)', 'kɐˈtorəjə', 'pron'),
    'которое': ('which (n, rel)', 'kɐˈtorəjɪ', 'pron'), 'которые': ('which (pl, rel)', 'kɐˈtorɨjɪ', 'pron'),
    'которого': ('of which (m)', 'kɐˈtorəvə', 'pron'), 'которой': ('of which (f)', 'kɐˈtorəj', 'pron'),
    'которых': ('of which (pl)', 'kɐˈtorɨx', 'pron'), 'котором': ('about which', 'kɐˈtorəm', 'pron'),

    # Prepositions
    'в': ('in, to', 'v', 'prep'), 'на': ('on, at, to', 'na', 'prep'),
    'с': ('with, from', 's', 'prep'), 'к': ('to, towards', 'k', 'prep'),
    'у': ('at, by, near', 'u', 'prep'), 'о': ('about', 'o', 'prep'),
    'из': ('from, out of', 'ɪs', 'prep'), 'за': ('behind, for', 'za', 'prep'),
    'по': ('along, by, on', 'po', 'prep'), 'до': ('before, until', 'do', 'prep'),
    'от': ('from', 'ot', 'prep'), 'для': ('for', 'dlʲa', 'prep'),
    'без': ('without', 'bʲes', 'prep'), 'при': ('at, during', 'prʲi', 'prep'),
    'про': ('about', 'pro', 'prep'), 'через': ('through, across', 'ˈtɕerʲɪs', 'prep'),
    'между': ('between', 'ˈmʲeʐdu', 'prep'), 'над': ('above', 'nat', 'prep'),
    'под': ('under', 'pot', 'prep'), 'перед': ('before, in front of', 'ˈpʲerʲɪt', 'prep'),
    'после': ('after', 'ˈposlʲɪ', 'prep'), 'около': ('near, around', 'ˈokələ', 'prep'),
    'вместо': ('instead of', 'ˈvmʲestə', 'prep'), 'кроме': ('except', 'ˈkromʲɪ', 'prep'),
    'среди': ('among', 'srʲɪˈdʲi', 'prep'), 'ради': ('for the sake of', 'ˈradʲɪ', 'prep'),
    'вокруг': ('around', 'vɐˈkruk', 'prep'), 'против': ('against', 'ˈprotʲɪf', 'prep'),

    # Conjunctions
    'и': ('and', 'i', 'conj'), 'а': ('but, and', 'a', 'conj'),
    'но': ('but', 'no', 'conj'), 'или': ('or', 'ˈilʲɪ', 'conj'),
    'что': ('that, what', 'ʂto', 'conj'), 'если': ('if', 'ˈjeslʲɪ', 'conj'),
    'когда': ('when', 'kɐɡˈda', 'conj'), 'как': ('how, as', 'kak', 'conj'),
    'чтобы': ('in order to', 'ˈʂtobɨ', 'conj'), 'потому': ('because', 'pɐtɐˈmu', 'conj'),
    'поэтому': ('therefore', 'pəˈɛtəmu', 'conj'), 'хотя': ('although', 'xɐˈtʲa', 'conj'),
    'пока': ('while, until', 'pɐˈka', 'conj'), 'чем': ('than', 'tɕem', 'conj'),
    'ни': ('neither, nor', 'nʲi', 'conj'), 'либо': ('or (either)', 'ˈlʲibə', 'conj'),
    'ведь': ('after all', 'vʲetʲ', 'conj'), 'же': ('emphasis particle', 'ʐɛ', 'part'),
    'ли': ('question particle', 'lʲi', 'part'), 'бы': ('would (conditional)', 'bɨ', 'part'),

    # Adverbs
    'не': ('not', 'nʲe', 'adv'), 'очень': ('very', 'ˈotɕɪnʲ', 'adv'),
    'уже': ('already', 'ʊˈʐɛ', 'adv'), 'ещё': ('still, yet, more', 'jɪˈɕːo', 'adv'),
    'еще': ('still, yet, more', 'jɪˈɕːo', 'adv'),
    'тоже': ('also, too', 'ˈtoʐɛ', 'adv'), 'также': ('also', 'ˈtakʐɛ', 'adv'),
    'здесь': ('here', 'zdʲesʲ', 'adv'), 'тут': ('here', 'tut', 'adv'),
    'там': ('there', 'tam', 'adv'), 'где': ('where', 'ɡdʲe', 'adv'),
    'куда': ('where to', 'kʊˈda', 'adv'), 'откуда': ('from where', 'ɐtˈkudə', 'adv'),
    'когда': ('when', 'kɐɡˈda', 'adv'), 'сейчас': ('now', 'sʲɪjˈtɕas', 'adv'),
    'теперь': ('now', 'tʲɪˈpʲerʲ', 'adv'), 'тогда': ('then', 'tɐɡˈda', 'adv'),
    'потом': ('then, later', 'pɐˈtom', 'adv'), 'сначала': ('at first', 'snɐˈtɕalə', 'adv'),
    'всегда': ('always', 'fsʲɪɡˈda', 'adv'), 'никогда': ('never', 'nʲɪkɐɡˈda', 'adv'),
    'иногда': ('sometimes', 'ɪnɐɡˈda', 'adv'), 'часто': ('often', 'ˈtɕastə', 'adv'),
    'редко': ('rarely', 'ˈrʲetkə', 'adv'), 'быстро': ('quickly', 'ˈbɨstrə', 'adv'),
    'медленно': ('slowly', 'ˈmʲedlʲɪnːə', 'adv'), 'хорошо': ('well, good', 'xərɐˈʂo', 'adv'),
    'плохо': ('badly', 'ˈploxə', 'adv'), 'много': ('a lot, many', 'ˈmnoɡə', 'adv'),
    'мало': ('little, few', 'ˈmalə', 'adv'), 'больше': ('more, bigger', 'ˈbolʲʂɛ', 'adv'),
    'меньше': ('less, smaller', 'ˈmʲenʲʂɛ', 'adv'), 'лучше': ('better', 'ˈlutɕʂɛ', 'adv'),
    'хуже': ('worse', 'ˈxuʐɛ', 'adv'), 'совсем': ('completely', 'sɐfˈsʲem', 'adv'),
    'вместе': ('together', 'ˈvmʲesʲtʲɪ', 'adv'), 'вдруг': ('suddenly', 'vdruk', 'adv'),
    'сразу': ('immediately', 'ˈsrazu', 'adv'), 'наконец': ('finally', 'nəkɐˈnʲets', 'adv'),
    'опять': ('again', 'ɐˈpʲatʲ', 'adv'), 'снова': ('again', 'ˈsnovə', 'adv'),
    'почти': ('almost', 'pɐtɕˈtʲi', 'adv'), 'довольно': ('quite, enough', 'dɐˈvolʲnə', 'adv'),
    'слишком': ('too (much)', 'ˈslʲiʂkəm', 'adv'), 'только': ('only', 'ˈtolʲkə', 'adv'),
    'именно': ('exactly', 'ˈimʲɪnːə', 'adv'), 'обычно': ('usually', 'ɐˈbɨtɕnə', 'adv'),
    'сегодня': ('today', 'sʲɪˈvodnʲə', 'adv'), 'завтра': ('tomorrow', 'ˈzaftrə', 'adv'),
    'вчера': ('yesterday', 'ftɕɪˈra', 'adv'), 'утром': ('in the morning', 'ˈutrəm', 'adv'),
    'вечером': ('in the evening', 'ˈvʲetɕɪrəm', 'adv'), 'ночью': ('at night', 'ˈnotɕju', 'adv'),
    'днём': ('during the day', 'dnʲom', 'adv'), 'рано': ('early', 'ˈranə', 'adv'),
    'поздно': ('late', 'ˈpoznə', 'adv'), 'далеко': ('far', 'dəlʲɪˈko', 'adv'),
    'близко': ('close', 'ˈblʲiskə', 'adv'), 'домой': ('home (direction)', 'dɐˈmoj', 'adv'),
    'назад': ('back, ago', 'nɐˈzat', 'adv'), 'вперёд': ('forward', 'fpʲɪˈrʲot', 'adv'),
    'наверху': ('upstairs, above', 'nəvʲɪrˈxu', 'adv'), 'внизу': ('below, downstairs', 'vnʲɪˈzu', 'adv'),
    'так': ('so, thus', 'tak', 'adv'), 'ещё': ('still, more', 'jɪˈɕːo', 'adv'),
    'почему': ('why', 'pətɕɪˈmu', 'adv'), 'зачем': ('what for', 'zɐˈtɕem', 'adv'),
    'конечно': ('of course', 'kɐˈnʲeʂnə', 'adv'), 'может': ('maybe', 'ˈmoʐɪt', 'adv'),
    'наверное': ('probably', 'nɐˈvʲernəjɪ', 'adv'), 'правда': ('truth, really', 'ˈpravdə', 'n'),
    'нет': ('no', 'nʲet', 'adv'), 'да': ('yes', 'da', 'adv'),

    # Common nouns
    'человек': ('person, human', 'tɕɪlɐˈvʲek', 'n'), 'люди': ('people', 'ˈlʲudʲɪ', 'n'),
    'людей': ('people (gen)', 'lʲʊˈdʲej', 'n'), 'людям': ('to people', 'ˈlʲudʲɪm', 'n'),
    'время': ('time', 'ˈvrʲemʲə', 'n'), 'год': ('year', 'ɡot', 'n'),
    'день': ('day', 'dʲenʲ', 'n'), 'дня': ('of the day', 'dnʲa', 'n'),
    'жизнь': ('life', 'ʐɨznʲ', 'n'), 'дело': ('affair, business', 'ˈdʲelə', 'n'),
    'рука': ('hand, arm', 'rʊˈka', 'n'), 'руку': ('hand (acc)', 'ˈruku', 'n'),
    'руки': ('hands', 'ˈrukʲɪ', 'n'),
    'место': ('place', 'ˈmʲestə', 'n'), 'слово': ('word', 'ˈslovə', 'n'),
    'дом': ('house, home', 'dom', 'n'), 'дома': ('at home, houses', 'ˈdomə', 'n'),
    'глаз': ('eye', 'ɡlas', 'n'), 'глаза': ('eyes', 'ɡlɐˈza', 'n'),
    'друг': ('friend', 'druk', 'n'), 'ребёнок': ('child', 'rʲɪˈbʲonək', 'n'),
    'дети': ('children', 'ˈdʲetʲɪ', 'n'), 'детей': ('children (gen)', 'dʲɪˈtʲej', 'n'),
    'женщина': ('woman', 'ˈʐɛnɕːɪnə', 'n'), 'мужчина': ('man', 'mʊˈɕːinə', 'n'),
    'работа': ('work, job', 'rɐˈbotə', 'n'), 'вопрос': ('question', 'vɐˈpros', 'n'),
    'город': ('city', 'ˈɡorət', 'n'), 'города': ('city (gen) / cities', 'ɡɐrɐˈda', 'n'),
    'страна': ('country', 'strɐˈna', 'n'), 'мир': ('world, peace', 'mʲir', 'n'),
    'школа': ('school', 'ˈʂkolə', 'n'), 'книга': ('book', 'ˈknʲiɡə', 'n'),
    'книгу': ('book (acc)', 'ˈknʲiɡu', 'n'),
    'вода': ('water', 'vɐˈda', 'n'), 'воду': ('water (acc)', 'ˈvodu', 'n'),
    'земля': ('earth, land', 'zʲɪmˈlʲa', 'n'),
    'дорога': ('road', 'dɐˈroɡə', 'n'), 'дорогу': ('road (acc)', 'dɐˈroɡu', 'n'),
    'машина': ('car', 'mɐˈʂɨnə', 'n'), 'деньги': ('money', 'ˈdʲenʲɡʲɪ', 'n'),
    'денег': ('money (gen)', 'ˈdʲenʲɪk', 'n'),
    'стол': ('table', 'stol', 'n'), 'окно': ('window', 'ɐkˈno', 'n'),
    'дверь': ('door', 'dvʲerʲ', 'n'), 'комната': ('room', 'ˈkomnətə', 'n'),
    'утро': ('morning', 'ˈutrə', 'n'), 'вечер': ('evening', 'ˈvʲetɕɪr', 'n'),
    'ночь': ('night', 'notɕ', 'n'), 'час': ('hour', 'tɕas', 'n'),
    'минута': ('minute', 'mʲɪˈnutə', 'n'), 'неделя': ('week', 'nʲɪˈdʲelʲə', 'n'),
    'месяц': ('month', 'ˈmʲesʲɪts', 'n'),
    'мать': ('mother', 'matʲ', 'n'), 'отец': ('father', 'ɐˈtʲets', 'n'),
    'отца': ('father (gen)', 'ɐtˈtsa', 'n'),
    'сын': ('son', 'sɨn', 'n'), 'дочь': ('daughter', 'dotɕ', 'n'),
    'брат': ('brother', 'brat', 'n'), 'сестра': ('sister', 'sʲɪsˈtra', 'n'),
    'муж': ('husband', 'muʂ', 'n'), 'жена': ('wife', 'ʐɨˈna', 'n'),
    'семья': ('family', 'sʲɪmˈja', 'n'), 'семьи': ('family (gen) / families', 'sʲɪˈmʲjɪ', 'n'),
    'голова': ('head', 'ɡələˈva', 'n'), 'сердце': ('heart', 'ˈsʲertsɛ', 'n'),
    'язык': ('language, tongue', 'jɪˈzɨk', 'n'),
    'улица': ('street', 'ˈulʲɪtsə', 'n'),
    'магазин': ('shop, store', 'mɐɡɐˈzʲin', 'n'),
    'ресторан': ('restaurant', 'rʲɪstɐˈran', 'n'),
    'музей': ('museum', 'mʊˈzʲej', 'n'),
    'театр': ('theater', 'tʲɪˈatr', 'n'),
    'парк': ('park', 'park', 'n'),
    'автобус': ('bus', 'ɐfˈtobʊs', 'n'),
    'поезд': ('train', 'ˈpojɪst', 'n'),
    'самолёт': ('airplane', 'səmɐˈlʲot', 'n'),
    'аэропорт': ('airport', 'əɪrɐˈport', 'n'),
    'вокзал': ('train station', 'vɐɡˈzal', 'n'),
    'билет': ('ticket', 'bʲɪˈlʲet', 'n'),
    'письмо': ('letter', 'pʲɪsʲˈmo', 'n'),
    'сообщение': ('message', 'sɐɐpˈɕːenʲɪjɪ', 'n'),
    'история': ('history, story', 'ɪsˈtorʲɪjə', 'n'),
    'проблема': ('problem', 'prɐˈblʲemə', 'n'),
    'ответ': ('answer', 'ɐtˈvʲet', 'n'),
    'помощь': ('help', 'ˈpoməɕː', 'n'),
    'часть': ('part', 'tɕasʲtʲ', 'n'),
    'сторона': ('side', 'stərɐˈna', 'n'),
    'случай': ('case, occasion', 'ˈslutɕɪj', 'n'),
    'образ': ('image, manner', 'ˈobrəs', 'n'),
    'система': ('system', 'sʲɪsˈtʲemə', 'n'),
    'власть': ('power, authority', 'vlastʲ', 'n'),
    'война': ('war', 'vɐjˈna', 'n'),

    # Common adjectives
    'большой': ('big, large', 'bɐlʲˈʂoj', 'adj'), 'большая': ('big (f)', 'bɐlʲˈʂajə', 'adj'),
    'большое': ('big (n)', 'bɐlʲˈʂojɪ', 'adj'), 'большие': ('big (pl)', 'bɐlʲˈʂɨjɪ', 'adj'),
    'маленький': ('small, little', 'ˈmalʲɪnʲkʲɪj', 'adj'),
    'новый': ('new', 'ˈnovɨj', 'adj'), 'новая': ('new (f)', 'ˈnovəjə', 'adj'),
    'новое': ('new (n)', 'ˈnovəjɪ', 'adj'), 'новые': ('new (pl)', 'ˈnovɨjɪ', 'adj'),
    'старый': ('old', 'ˈstarɨj', 'adj'),
    'хороший': ('good', 'xɐˈroʂɨj', 'adj'), 'хорошая': ('good (f)', 'xɐˈroʂəjə', 'adj'),
    'плохой': ('bad', 'plɐˈxoj', 'adj'),
    'красивый': ('beautiful', 'krɐˈsʲivɨj', 'adj'),
    'первый': ('first', 'ˈpʲervɨj', 'adj'),
    'последний': ('last', 'pɐˈslʲednʲɪj', 'adj'),
    'важный': ('important', 'ˈvaʐnɨj', 'adj'),
    'нужный': ('necessary', 'ˈnuʐnɨj', 'adj'), 'нужно': ('it is necessary', 'ˈnuʐnə', 'adv'),
    'нужна': ('necessary (f)', 'nʊʐˈna', 'adj'), 'нужны': ('necessary (pl)', 'nʊʐˈnɨ', 'adj'),
    'нужен': ('necessary (m)', 'ˈnuʐɪn', 'adj'),
    'возможный': ('possible', 'vɐzˈmoʐnɨj', 'adj'), 'возможно': ('possibly', 'vɐzˈmoʐnə', 'adv'),
    'главный': ('main, chief', 'ˈɡlavnɨj', 'adj'),
    'русский': ('Russian', 'ˈruskʲɪj', 'adj'), 'русская': ('Russian (f)', 'ˈruskəjə', 'adj'),
    'русское': ('Russian (n)', 'ˈruskəjɪ', 'adj'),
    'белый': ('white', 'ˈbʲelɨj', 'adj'), 'чёрный': ('black', 'ˈtɕornɨj', 'adj'),
    'красный': ('red', 'ˈkrasnɨj', 'adj'), 'зелёный': ('green', 'zʲɪˈlʲonɨj', 'adj'),
    'синий': ('blue (dark)', 'ˈsʲinʲɪj', 'adj'), 'голубой': ('blue (light)', 'ɡəlʊˈboj', 'adj'),
    'жёлтый': ('yellow', 'ˈʐoltɨj', 'adj'),
    'длинный': ('long', 'ˈdlʲinːɨj', 'adj'), 'короткий': ('short', 'kɐˈrotkʲɪj', 'adj'),
    'высокий': ('tall, high', 'vɨˈsokʲɪj', 'adj'), 'низкий': ('low, short', 'ˈnʲiskʲɪj', 'adj'),
    'тёплый': ('warm', 'ˈtʲoplɨj', 'adj'), 'холодный': ('cold', 'xɐˈlodnɨj', 'adj'),
    'горячий': ('hot', 'ɡɐˈrʲatɕɪj', 'adj'),
    'сильный': ('strong', 'ˈsʲilʲnɨj', 'adj'), 'слабый': ('weak', 'ˈslabɨj', 'adj'),
    'молодой': ('young', 'məlɐˈdoj', 'adj'),
    'лёгкий': ('easy, light', 'ˈlʲoxkʲɪj', 'adj'), 'тяжёлый': ('heavy, hard', 'tʲɪˈʐolɨj', 'adj'),
    'простой': ('simple', 'prɐˈstoj', 'adj'), 'сложный': ('complex', 'ˈsloʐnɨj', 'adj'),
    'чистый': ('clean', 'ˈtɕistɨj', 'adj'),
    'свободный': ('free', 'svɐˈbodnɨj', 'adj'),
    'счастливый': ('happy', 'ɕːɪsˈlʲivɨj', 'adj'),
    'готовый': ('ready', 'ɡɐˈtovɨj', 'adj'), 'готова': ('ready (f)', 'ɡɐˈtovə', 'adj'),
    'готов': ('ready (m, short)', 'ɡɐˈtof', 'adj'),
    'должен': ('must, should', 'ˈdolʐɨn', 'adj'), 'должна': ('must (f)', 'dɐlʐˈna', 'adj'),
    'должны': ('must (pl)', 'dɐlʐˈnɨ', 'adj'),
    'рад': ('glad', 'rat', 'adj'), 'рада': ('glad (f)', 'ˈradə', 'adj'),
    'рады': ('glad (pl)', 'ˈradɨ', 'adj'),

    # Common verbs (conjugated forms frequently seen)
    'знаю': ('I know', 'ˈznajʊ', 'v'), 'знаешь': ('you know', 'ˈznajɪʂ', 'v'),
    'знает': ('he/she knows', 'ˈznajɪt', 'v'), 'знаем': ('we know', 'ˈznajɪm', 'v'),
    'хочу': ('I want', 'xɐˈtɕu', 'v'), 'хочешь': ('you want', 'ˈxotɕɪʂ', 'v'),
    'могу': ('I can', 'mɐˈɡu', 'v'), 'можешь': ('you can', 'ˈmoʐɨʂ', 'v'),
    'может': ('he/she can', 'ˈmoʐɨt', 'v'), 'можем': ('we can', 'ˈmoʐɨm', 'v'),
    'можно': ('it is possible, may', 'ˈmoʐnə', 'adv'), 'нельзя': ('it is forbidden', 'nʲɪlʲˈzʲa', 'adv'),
    'надо': ('it is necessary', 'ˈnadə', 'adv'),
    'буду': ('I will', 'ˈbudu', 'v'), 'будет': ('will be', 'ˈbudʲɪt', 'v'),
    'будем': ('we will', 'ˈbudʲɪm', 'v'), 'будут': ('they will', 'ˈbudut', 'v'),
    'был': ('was (m)', 'bɨl', 'v'), 'была': ('was (f)', 'bɨˈla', 'v'),
    'было': ('was (n)', 'ˈbɨlə', 'v'), 'были': ('were', 'ˈbɨlʲɪ', 'v'),
    'есть': ('there is, to eat', 'jestʲ', 'v'),
    'пошли': ('let\'s go', 'pɐˈʂlʲi', 'v'), 'пошёл': ('went (m)', 'pɐˈʂol', 'v'),
    'пришёл': ('came (m)', 'prʲɪˈʂol', 'v'), 'пришла': ('came (f)', 'prʲɪˈʂla', 'v'),
    'стал': ('became (m)', 'stal', 'v'), 'стала': ('became (f)', 'ˈstalə', 'v'),
    'стали': ('became (pl)', 'ˈstalʲɪ', 'v'),
    'сказал': ('said (m)', 'skɐˈzal', 'v'), 'сказала': ('said (f)', 'skɐˈzalə', 'v'),
    'дайте': ('give (imperative, formal)', 'ˈdajtʲɪ', 'v'),
    'давайте': ('let\'s', 'dɐˈvajtʲɪ', 'v'),
    'иди': ('go (imperative)', 'ɪˈdʲi', 'v'), 'идите': ('go (formal imperative)', 'ɪˈdʲitʲɪ', 'v'),
    'смогу': ('I will be able', 'smɐˈɡu', 'v'),

    # Numbers
    'один': ('one', 'ɐˈdʲin', 'num'), 'одна': ('one (f)', 'ɐdˈna', 'num'),
    'одно': ('one (n)', 'ɐdˈno', 'num'), 'одного': ('one (gen)', 'ɐdnɐˈvo', 'num'),
    'два': ('two (m/n)', 'dva', 'num'), 'две': ('two (f)', 'dvʲe', 'num'),
    'три': ('three', 'trʲi', 'num'), 'четыре': ('four', 'tɕɪˈtɨrʲɪ', 'num'),
    'пять': ('five', 'pʲatʲ', 'num'), 'шесть': ('six', 'ʂɛstʲ', 'num'),
    'семь': ('seven', 'sʲemʲ', 'num'), 'восемь': ('eight', 'ˈvosʲɪmʲ', 'num'),
    'девять': ('nine', 'ˈdʲevʲɪtʲ', 'num'), 'десять': ('ten', 'ˈdʲesʲɪtʲ', 'num'),
    'сто': ('hundred', 'sto', 'num'), 'тысяча': ('thousand', 'ˈtɨsʲɪtɕə', 'num'),
    'двадцать': ('twenty', 'ˈdvatsːɪtʲ', 'num'), 'тридцать': ('thirty', 'ˈtrʲitsːɪtʲ', 'num'),
    'пятьдесят': ('fifty', 'pʲɪdʲɪˈsʲat', 'num'),
    'много': ('many, a lot', 'ˈmnoɡə', 'adv'), 'несколько': ('several', 'ˈnʲeskəlʲkə', 'adv'),

    # Misc high-frequency
    'вот': ('here is', 'vot', 'part'), 'ну': ('well', 'nu', 'part'),
    'уж': ('already (emphatic)', 'uʂ', 'part'), 'даже': ('even', 'ˈdaʐɛ', 'part'),
    'ведь': ('after all', 'vʲetʲ', 'part'), 'разве': ('really?', 'ˈrazvʲɪ', 'part'),
    'неужели': ('really? (surprise)', 'nʲɪʊˈʐɛlʲɪ', 'part'),
    'пожалуйста': ('please', 'pɐˈʐaləstə', 'part'),
    'спасибо': ('thank you', 'spɐˈsʲibə', 'part'),
    'извините': ('excuse me', 'ɪzvʲɪˈnʲitʲɪ', 'v'),
    'привет': ('hi', 'prʲɪˈvʲet', 'n'),
    'здравствуйте': ('hello (formal)', 'ˈzdrastvujtʲɪ', 'v'),
    'пожалуйста': ('please, you\'re welcome', 'pɐˈʐaləstə', 'part'),
    'тоже': ('also', 'ˈtoʐɛ', 'adv'),

    # More common nouns
    'дело': ('business, matter', 'ˈdʲelə', 'n'),
    'путь': ('way, path', 'putʲ', 'n'),
    'глаз': ('eye', 'ɡlas', 'n'),
    'лицо': ('face', 'lʲɪˈtso', 'n'),
    'имя': ('name', 'ˈimʲə', 'n'),
    'нога': ('leg, foot', 'nɐˈɡa', 'n'), 'ногу': ('leg (acc)', 'ˈnoɡu', 'n'),
    'ноги': ('legs', 'ˈnoɡʲɪ', 'n'),
    'голос': ('voice', 'ˈɡoləs', 'n'),
    'сила': ('strength, force', 'ˈsʲilə', 'n'),
    'конец': ('end', 'kɐˈnʲets', 'n'),
    'начало': ('beginning', 'nɐˈtɕalə', 'n'),
    'причина': ('reason', 'prʲɪˈtɕinə', 'n'),
    'задача': ('task, problem', 'zɐˈdatɕə', 'n'),
    'результат': ('result', 'rʲɪzʊlʲˈtat', 'n'),
    'пример': ('example', 'prʲɪˈmʲer', 'n'),
    'условие': ('condition', 'ʊsˈlovʲɪjɪ', 'n'),
    'цена': ('price', 'tsɨˈna', 'n'),
    'группа': ('group', 'ˈɡrupːə', 'n'),
    'компания': ('company', 'kɐmˈpanʲɪjə', 'n'),
    'чай': ('tea', 'tɕaj', 'n'),
    'кофе': ('coffee', 'ˈkofʲɪ', 'n'),
    'молоко': ('milk', 'məlɐˈko', 'n'),
    'хлеб': ('bread', 'xlʲep', 'n'),
    'мясо': ('meat', 'ˈmʲasə', 'n'),
    'рыба': ('fish', 'ˈrɨbə', 'n'),
    'сыр': ('cheese', 'sɨr', 'n'),
    'масло': ('butter, oil', 'ˈmaslə', 'n'),
    'сахар': ('sugar', 'ˈsaxər', 'n'),
    'соль': ('salt', 'solʲ', 'n'),
    'суп': ('soup', 'sup', 'n'),
    'салат': ('salad', 'sɐˈlat', 'n'),
    'завтрак': ('breakfast', 'ˈzaftrək', 'n'),
    'обед': ('lunch', 'ɐˈbʲet', 'n'),
    'ужин': ('dinner', 'ˈuʐɨn', 'n'),
    'кухня': ('kitchen', 'ˈkuxnʲə', 'n'),
    'погода': ('weather', 'pɐˈɡodə', 'n'),
    'дождь': ('rain', 'doʂtʲ', 'n'),
    'снег': ('snow', 'snʲek', 'n'),
    'солнце': ('sun', 'ˈsontsɛ', 'n'),
    'ветер': ('wind', 'ˈvʲetʲɪr', 'n'),
    'небо': ('sky', 'ˈnʲebə', 'n'),
    'море': ('sea', 'ˈmorʲɪ', 'n'),
    'река': ('river', 'rʲɪˈka', 'n'),
    'лес': ('forest', 'lʲes', 'n'),
    'гора': ('mountain', 'ɡɐˈra', 'n'),
    'цветок': ('flower', 'tsvʲɪˈtok', 'n'),
    'дерево': ('tree', 'ˈdʲerʲɪvə', 'n'),
    'животное': ('animal', 'ʐɨˈvotnəjɪ', 'n'),
    'собака': ('dog', 'sɐˈbakə', 'n'),
    'кошка': ('cat', 'ˈkoʂkə', 'n'), 'кот': ('cat (m)', 'kot', 'n'),
    'птица': ('bird', 'ˈptʲitsə', 'n'),
    'одежда': ('clothes', 'ɐˈdʲeʐdə', 'n'),
    'врач': ('doctor', 'vratɕ', 'n'),
    'учитель': ('teacher', 'ʊˈtɕitʲɪlʲ', 'n'),
    'студент': ('student', 'stʊˈdʲent', 'n'),
    'друзья': ('friends', 'drʊˈzʲja', 'n'), 'друзей': ('friends (gen)', 'drʊˈzʲej', 'n'),
    'подруга': ('female friend', 'pɐˈdruɡə', 'n'),
    'сосед': ('neighbor', 'sɐˈsʲet', 'n'),
    'гость': ('guest', 'ɡostʲ', 'n'), 'гости': ('guests', 'ˈɡostʲɪ', 'n'),

    # More verbs
    'нравится': ('to like (impersonal)', 'ˈnravʲɪtsə', 'v'),
    'нравиться': ('to like', 'ˈnravʲɪtsə', 'v'),
    'понравилось': ('liked (n, past)', 'pɐˈnravʲɪləsʲ', 'v'),
    'казаться': ('to seem', 'kɐˈzatsə', 'v'),
    'кажется': ('it seems', 'ˈkaʐɨtsə', 'v'),
    'является': ('is (formal)', 'jɪvˈlʲajɪtsə', 'v'),
    'оказаться': ('to turn out', 'ɐkɐˈzatsə', 'v'),
    'получить': ('to receive (perf.)', 'pəlʊˈtɕitʲ', 'v'),
    'получать': ('to receive', 'pəlʊˈtɕatʲ', 'v'),
    'принести': ('to bring (perf.)', 'prʲɪnʲɪsˈtʲi', 'v'),
    'приносить': ('to bring', 'prʲɪnɐˈsʲitʲ', 'v'),
    'поставить': ('to place (perf.)', 'pɐˈstavʲɪtʲ', 'v'),
    'ставить': ('to place', 'ˈstavʲɪtʲ', 'v'),
    'показать': ('to show (perf.)', 'pəkɐˈzatʲ', 'v'),
    'показывать': ('to show', 'pɐˈkazɨvətʲ', 'v'),
    'менять': ('to change', 'mʲɪˈnʲatʲ', 'v'),
    'изменить': ('to change (perf.)', 'ɪzmʲɪˈnʲitʲ', 'v'),
    'решить': ('to decide (perf.)', 'rʲɪˈʂɨtʲ', 'v'),
    'решать': ('to decide', 'rʲɪˈʂatʲ', 'v'),
    'попросить': ('to ask (perf.)', 'pəprɐˈsʲitʲ', 'v'),
    'просить': ('to ask, request', 'prɐˈsʲitʲ', 'v'),
    'ответить': ('to answer (perf.)', 'ɐtˈvʲetʲɪtʲ', 'v'),
    'отвечать': ('to answer', 'ɐtvʲɪˈtɕatʲ', 'v'),
    'объяснить': ('to explain (perf.)', 'ɐbjɪsˈnʲitʲ', 'v'),
    'объяснять': ('to explain', 'ɐbjɪsˈnʲatʲ', 'v'),
    'забыть': ('to forget (perf.)', 'zɐˈbɨtʲ', 'v'),
    'забывать': ('to forget', 'zəbɨˈvatʲ', 'v'),
    'вспомнить': ('to remember (perf.)', 'ˈfspomʲnʲɪtʲ', 'v'),
    'вспоминать': ('to remember', 'fspəmʲɪˈnatʲ', 'v'),
    'бояться': ('to be afraid', 'bɐˈjatsə', 'v'),
    'чувствовать': ('to feel', 'ˈtɕustvəvətʲ', 'v'),
    'оставить': ('to leave (perf.)', 'ɐsˈtavʲɪtʲ', 'v'),
    'оставлять': ('to leave', 'ɐstɐvˈlʲatʲ', 'v'),
    'выходить': ('to go out', 'vɨxɐˈdʲitʲ', 'v'),
    'выйти': ('to go out (perf.)', 'ˈvɨjtʲɪ', 'v'),
    'входить': ('to enter', 'fxɐˈdʲitʲ', 'v'),
    'войти': ('to enter (perf.)', 'vɐjˈtʲi', 'v'),
    'приходить': ('to come', 'prʲɪxɐˈdʲitʲ', 'v'),
    'прийти': ('to come (perf.)', 'prʲɪjˈtʲi', 'v'),
    'уходить': ('to leave', 'ʊxɐˈdʲitʲ', 'v'),
    'уйти': ('to leave (perf.)', 'ʊjˈtʲi', 'v'),
    'приехать': ('to arrive (perf.)', 'prʲɪˈjexətʲ', 'v'),
    'приезжать': ('to arrive', 'prʲɪjɪˈʐːatʲ', 'v'),
    'звонить': ('to call', 'zvɐˈnʲitʲ', 'v'),
    'позвонить': ('to call (perf.)', 'pəzvɐˈnʲitʲ', 'v'),
    'посылать': ('to send', 'pəsɨˈlatʲ', 'v'),
    'послать': ('to send (perf.)', 'pɐsˈlatʲ', 'v'),
    'отправить': ('to send (perf.)', 'ɐtˈpravʲɪtʲ', 'v'),
    'отправлять': ('to send', 'ɐtprɐvˈlʲatʲ', 'v'),
    'готовить': ('to cook, prepare', 'ɡɐˈtovʲɪtʲ', 'v'),
    'приготовить': ('to cook (perf.)', 'prʲɪɡɐˈtovʲɪtʲ', 'v'),
    'мыть': ('to wash', 'mɨtʲ', 'v'),
    'помыть': ('to wash (perf.)', 'pɐˈmɨtʲ', 'v'),
    'петь': ('to sing', 'pʲetʲ', 'v'),
    'спеть': ('to sing (perf.)', 'spʲetʲ', 'v'),
    'рисовать': ('to draw', 'rʲɪsɐˈvatʲ', 'v'),
    'танцевать': ('to dance', 'tɐntsɨˈvatʲ', 'v'),
    'гулять': ('to walk', 'ɡʊˈlʲatʲ', 'v'),
    'погулять': ('to walk (perf.)', 'pəɡʊˈlʲatʲ', 'v'),
    'пользоваться': ('to use', 'ˈpolʲzəvətsə', 'v'),
    'использовать': ('to use', 'ɪsˈpolʲzəvətʲ', 'v'),
    'стараться': ('to try', 'stɐˈratsə', 'v'),
    'постараться': ('to try (perf.)', 'pəstɐˈratsə', 'v'),
    'надеяться': ('to hope', 'nɐˈdʲejətsə', 'v'),
    'верить': ('to believe', 'ˈvʲerʲɪtʲ', 'v'),
    'поверить': ('to believe (perf.)', 'pɐˈvʲerʲɪtʲ', 'v'),
    'мечтать': ('to dream', 'mʲɪtɕˈtatʲ', 'v'),
    'путешествовать': ('to travel', 'pʊtʲɪˈʂɛstvəvətʲ', 'v'),
    'заниматься': ('to be engaged in', 'zɐnʲɪˈmatsə', 'v'),
    'заняться': ('to take up (perf.)', 'zɐˈnʲatsə', 'v'),
    'переводить': ('to translate', 'pʲɪrʲɪvɐˈdʲitʲ', 'v'),
    'перевести': ('to translate (perf.)', 'pʲɪrʲɪvʲɪsˈtʲi', 'v'),
    'провести': ('to spend (time, perf.)', 'prɐvʲɪsˈtʲi', 'v'),
    'проводить': ('to spend (time)', 'prəvɐˈdʲitʲ', 'v'),
    'вести': ('to lead, drive', 'vʲɪsˈtʲi', 'v'),
    'водить': ('to drive, lead (habitual)', 'vɐˈdʲitʲ', 'v'),
    'носить': ('to carry, wear', 'nɐˈsʲitʲ', 'v'),
    'нести': ('to carry', 'nʲɪsˈtʲi', 'v'),
    'платить': ('to pay', 'plɐˈtʲitʲ', 'v'),
    'заплатить': ('to pay (perf.)', 'zəplɐˈtʲitʲ', 'v'),
    'продавать': ('to sell', 'prədɐˈvatʲ', 'v'),
    'продать': ('to sell (perf.)', 'prɐˈdatʲ', 'v'),
    'строить': ('to build', 'ˈstroɪtʲ', 'v'),
    'построить': ('to build (perf.)', 'pɐˈstroɪtʲ', 'v'),
    'собирать': ('to collect, gather', 'səbʲɪˈratʲ', 'v'),
    'собрать': ('to collect (perf.)', 'sɐˈbratʲ', 'v'),
    'выбрать': ('to choose (perf.)', 'ˈvɨbrətʲ', 'v'),
    'выбирать': ('to choose', 'vɨbʲɪˈratʲ', 'v'),
    'предложить': ('to offer (perf.)', 'prʲɪdlɐˈʐɨtʲ', 'v'),
    'предлагать': ('to offer', 'prʲɪdlɐˈɡatʲ', 'v'),
    'закончить': ('to finish (perf.)', 'zɐˈkontɕɪtʲ', 'v'),
    'заканчивать': ('to finish', 'zɐˈkantɕɪvətʲ', 'v'),
    'продолжать': ('to continue', 'prədɐlˈʐatʲ', 'v'),
    'продолжить': ('to continue (perf.)', 'prədɐlˈʐɨtʲ', 'v'),
    'включить': ('to turn on (perf.)', 'fklʲʊˈtɕitʲ', 'v'),
    'включать': ('to turn on', 'fklʲʊˈtɕatʲ', 'v'),
    'выключить': ('to turn off (perf.)', 'ˈvɨklʲʊtɕɪtʲ', 'v'),
    'выключать': ('to turn off', 'vɨklʲʊˈtɕatʲ', 'v'),
    'положить': ('to put (perf.)', 'pəlɐˈʐɨtʲ', 'v'),
    'класть': ('to put', 'klastʲ', 'v'),
    'поднять': ('to lift (perf.)', 'pɐdˈnʲatʲ', 'v'),
    'поднимать': ('to lift', 'pədnʲɪˈmatʲ', 'v'),
    'спросить': ('to ask (perf.)', 'sprɐˈsʲitʲ', 'v'),
    'спрашивать': ('to ask', 'ˈspraʂɨvətʲ', 'v'),
    'встретить': ('to meet (perf.)', 'ˈfstrʲetʲɪtʲ', 'v'),
    'встречать': ('to meet', 'fstrʲɪˈtɕatʲ', 'v'),
    'попробовать': ('to try (perf.)', 'pɐˈprobəvətʲ', 'v'),
    'пробовать': ('to try', 'ˈprobəvətʲ', 'v'),
    'заказать': ('to order (perf.)', 'zɐkɐˈzatʲ', 'v'),
    'заказывать': ('to order', 'zɐˈkazɨvətʲ', 'v'),
    'проверить': ('to check (perf.)', 'prɐˈvʲerʲɪtʲ', 'v'),
    'проверять': ('to check', 'prəvʲɪˈrʲatʲ', 'v'),
    'участвовать': ('to participate', 'ʊˈtɕastvəvətʲ', 'v'),
    'появиться': ('to appear (perf.)', 'pəjɪˈvʲitsə', 'v'),
    'появляться': ('to appear', 'pəjɪvˈlʲatsə', 'v'),
    'случиться': ('to happen (perf.)', 'slʊˈtɕitsə', 'v'),
    'происходить': ('to happen', 'prəɪsxɐˈdʲitʲ', 'v'),
    'произойти': ('to happen (perf.)', 'prəɪzɐjˈtʲi', 'v'),
    'существовать': ('to exist', 'sʊɕːɪstvɐˈvatʲ', 'v'),
    'зависеть': ('to depend', 'zɐˈvʲisʲɪtʲ', 'v'),
    'относиться': ('to relate to', 'ɐtnɐˈsʲitsə', 'v'),
    'считать': ('to count, consider', 'ɕːɪˈtatʲ', 'v'),
    'думать': ('to think', 'ˈdumatʲ', 'v'),
    'остаться': ('to stay (perf.)', 'ɐsˈtatsə', 'v'),
    'оставаться': ('to stay', 'ɐstɐˈvatsə', 'v'),

    # Additional high-frequency missing words
    'продавец': ('salesperson, seller', 'prədɐˈvʲets', 'n'),
    'водитель': ('driver', 'vɐˈdʲitʲɪlʲ', 'n'),
    'писатель': ('writer', 'pʲɪˈsatʲɪlʲ', 'n'),
    'давно': ('long ago', 'dɐvˈno', 'adv'),
    'по-русски': ('in Russian', 'pɐˈruskʲɪ', 'adv'),
    'из-за': ('because of, from behind', 'ɪzˈza', 'prep'),
    'давай': ('let\'s, come on', 'dɐˈvaj', 'part'),
    'классе': ('class (prep.)', 'ˈklasʲɪ', 'n'),
    'класс': ('class', 'klas', 'n'),
    'дальше': ('further, farther', 'ˈdalʲʂɛ', 'adv'),
    'станции': ('station (gen/prep)', 'ˈstantsɨɪ', 'n'),
    'станция': ('station', 'ˈstantsɨjə', 'n'),
    'станцию': ('station (acc)', 'ˈstantsɨju', 'n'),
    'весной': ('in spring', 'vʲɪsˈnoj', 'adv'),
    'весна': ('spring', 'vʲɪsˈna', 'n'),
    'почте': ('post office (prep)', 'ˈpotɕtʲɪ', 'n'),
    'почта': ('post office, mail', 'ˈpotɕtə', 'n'),
    'дачу': ('dacha (acc)', 'ˈdatɕu', 'n'),
    'дача': ('dacha, summer house', 'ˈdatɕə', 'n'),
    'пойдём': ('let\'s go', 'pɐjˈdʲom', 'v'),
    'пойдёт': ('will go', 'pɐjˈdʲot', 'v'),
    'открыт': ('open (short adj)', 'ɐtˈkrɨt', 'adj'),
    'открыта': ('open (f, short)', 'ɐtˈkrɨtə', 'adj'),
    'марта': ('of March', 'ˈmartə', 'n'),
    'март': ('March', 'mart', 'n'),
    'пирог': ('pie', 'pʲɪˈrok', 'n'),
    'пирога': ('pie (gen)', 'pʲɪrɐˈɡa', 'n'),
    'пирожки': ('pies (dim, pl)', 'pʲɪrɐʐˈkʲi', 'n'),
    'старший': ('elder, senior', 'ˈstarʂɨj', 'adj'),
    'старшая': ('elder (f)', 'ˈstarʂəjə', 'adj'),
    'старше': ('older (comp)', 'ˈstarʂɛ', 'adv'),
    'любимый': ('favorite, beloved', 'lʲʊˈbʲimɨj', 'adj'),
    'любимое': ('favorite (n)', 'lʲʊˈbʲiməjɪ', 'adj'),
    'любимая': ('favorite (f)', 'lʲʊˈbʲiməjə', 'adj'),
    'виделись': ('saw each other', 'ˈvʲidʲɪlʲɪsʲ', 'v'),
    'учеников': ('pupils (gen pl)', 'ʊtɕɪnʲɪˈkof', 'n'),
    'ученик': ('pupil, student', 'ʊtɕɪˈnʲik', 'n'),
    'ученица': ('female pupil', 'ʊtɕɪˈnʲitsə', 'n'),
    'девяти': ('nine (gen)', 'dʲɪvʲɪˈtʲi', 'num'),
    'машину': ('car (acc)', 'mɐˈʂɨnu', 'n'),
    'городом': ('city (instr)', 'ˈɡorədəm', 'n'),
    'врачом': ('doctor (instr)', 'vrɐˈtɕom', 'n'),
    'часов': ('hours (gen pl), o\'clock', 'tɕɪˈsof', 'n'),
    'часа': ('hours (gen sg)', 'tɕɪˈsa', 'n'),
    'самая': ('the most (f)', 'ˈsaməjə', 'adj'),
    'самый': ('the most', 'ˈsamɨj', 'adj'),
    'самое': ('the most (n)', 'ˈsaməjɪ', 'adj'),
    'маме': ('to mom (dat)', 'ˈmamʲɪ', 'n'),
    'мама': ('mom', 'ˈmamə', 'n'),
    'маму': ('mom (acc)', 'ˈmamu', 'n'),
    'мамы': ('mom (gen)', 'ˈmamɨ', 'n'),
    'папа': ('dad', 'ˈpapə', 'n'),
    'папе': ('to dad (dat)', 'ˈpapʲɪ', 'n'),
    'папу': ('dad (acc)', 'ˈpapu', 'n'),
    'бабушка': ('grandmother', 'ˈbabuʂkə', 'n'),
    'бабушке': ('grandmother (dat)', 'ˈbabuʂkʲɪ', 'n'),
    'бабушки': ('grandmother (gen)', 'ˈbabuʂkʲɪ', 'n'),
    'дедушка': ('grandfather', 'ˈdʲeduʂkə', 'n'),
    'брата': ('brother (gen)', 'ˈbratə', 'n'),
    'братья': ('brothers', 'ˈbratʲjə', 'n'),
    'сестры': ('sister (gen) / sisters', 'sʲɪˈstrɨ', 'n'),
    'сестру': ('sister (acc)', 'sʲɪsˈtru', 'n'),
    'дочери': ('daughter (gen/dat)', 'ˈdotɕɪrʲɪ', 'n'),
    'дочь': ('daughter', 'dotɕ', 'n'),
    'сыну': ('to son (dat)', 'ˈsɨnu', 'n'),
    'сына': ('son (gen)', 'ˈsɨnə', 'n'),
    'жену': ('wife (acc)', 'ʐɨˈnu', 'n'),
    'жены': ('wife (gen)', 'ʐɨˈnɨ', 'n'),
    'мужа': ('husband (gen)', 'ˈmuʐə', 'n'),
    'мужу': ('to husband (dat)', 'ˈmuʐu', 'n'),
    'поехали': ('let\'s go (by vehicle)', 'pɐˈjexəlʲɪ', 'v'),
    'дела': ('affairs, things', 'dʲɪˈla', 'n'),
    'начинается': ('begins', 'nətɕɪˈnajɪtsə', 'v'),
    'заканчивается': ('ends', 'zɐˈkantɕɪvəjɪtsə', 'v'),
    'называется': ('is called', 'nɐzɨˈvajɪtsə', 'v'),
    'находится': ('is located', 'nɐˈxodʲɪtsə', 'v'),
    'получается': ('it turns out', 'pəlʊˈtɕajɪtsə', 'v'),
    'нравятся': ('to like (pl)', 'ˈnravʲɪtsə', 'v'),
    'кажется': ('it seems', 'ˈkaʐɨtsə', 'v'),
    'хотелось': ('wanted (impersonal)', 'xɐˈtʲeləsʲ', 'v'),
    'понравился': ('liked (m)', 'pɐˈnravʲɪlsə', 'v'),
    'понравилась': ('liked (f)', 'pɐˈnravʲɪləsʲ', 'v'),
    'рассказал': ('told (m)', 'rəskɐˈzal', 'v'),
    'рассказала': ('told (f)', 'rəskɐˈzalə', 'v'),
    'рассказать': ('to tell (perf.)', 'rəskɐˈzatʲ', 'v'),
    'рассказывать': ('to tell', 'rɐsˈkazɨvətʲ', 'v'),
    'объяснил': ('explained (m)', 'ɐbjɪsˈnʲil', 'v'),
    'спросил': ('asked (m)', 'sprɐˈsʲil', 'v'),
    'спросила': ('asked (f)', 'sprɐˈsʲilə', 'v'),
    'ответил': ('answered (m)', 'ɐtˈvʲetʲɪl', 'v'),
    'ответила': ('answered (f)', 'ɐtˈvʲetʲɪlə', 'v'),
    'решил': ('decided (m)', 'rʲɪˈʂɨl', 'v'),
    'решила': ('decided (f)', 'rʲɪˈʂɨlə', 'v'),
    'получил': ('received (m)', 'pəlʊˈtɕil', 'v'),
    'получила': ('received (f)', 'pəlʊˈtɕilə', 'v'),
    'выучил': ('learned (m, perf)', 'ˈvɨʊtɕɪl', 'v'),
    'прочитал': ('read (m, perf)', 'prətɕɪˈtal', 'v'),
    'прочитала': ('read (f, perf)', 'prətɕɪˈtalə', 'v'),
    'приготовили': ('prepared (pl)', 'prʲɪɡɐˈtovʲɪlʲɪ', 'v'),
    'приготовил': ('prepared (m)', 'prʲɪɡɐˈtovʲɪl', 'v'),
    'построили': ('built (pl)', 'pɐˈstroɪlʲɪ', 'v'),
    'пел': ('sang (m)', 'pʲel', 'v'),
    'пела': ('sang (f)', 'ˈpʲelə', 'v'),
    'дальше': ('further', 'ˈdalʲʂɛ', 'adv'),

    # Hyphenated words
    'где-то': ('somewhere', 'ˈɡdʲetə', 'adv'),
    'как-то': ('somehow', 'ˈkaktə', 'adv'),
    'кто-то': ('someone', 'ˈktotə', 'pron'),
    'что-то': ('something', 'ˈʂtotə', 'pron'),
    'когда-либо': ('ever', 'kɐɡˈdalʲɪbə', 'adv'),
    'чем-нибудь': ('with something', 'tɕɪmˈnʲibutʲ', 'pron'),
    'наконец-то': ('at last', 'nəkɐˈnʲetstə', 'adv'),
    'по-английски': ('in English', 'pɐɐnˈɡlʲijskʲɪ', 'adv'),
    'по-другому': ('differently', 'pɐdrʊˈɡomu', 'adv'),
    'из-под': ('from under', 'ɪsˈpot', 'prep'),
    'пока-пока': ('bye-bye', 'pɐˈkapɐˈka', 'part'),
    'чуть-чуть': ('a tiny bit', 'tɕutʲˈtɕutʲ', 'adv'),
    'хлеб-соль': ('bread and salt (hospitality)', 'xlʲepˈsolʲ', 'n'),
    'санкт-петербурга': ('of Saint Petersburg', 'sankpʲɪtʲɪrˈburɡə', 'n'),

    # More inflected forms
    'домой': ('home (direction)', 'dɐˈmoj', 'adv'),
    'учителя': ('teacher (gen/acc)', 'ʊtɕɪˈtʲɪlʲə', 'n'),
    'учителем': ('teacher (instr)', 'ʊtɕɪˈtʲɪlʲɪm', 'n'),
    'инженер': ('engineer', 'ɪnʐɨˈnʲer', 'n'),
    'инженером': ('engineer (instr)', 'ɪnʐɨˈnʲerəm', 'n'),
    'программист': ('programmer', 'prəɡrɐˈmʲist', 'n'),
    'программистом': ('programmer (instr)', 'prəɡrɐˈmʲistəm', 'n'),
    'художник': ('artist', 'xʊˈdoʐnʲɪk', 'n'),
    'художником': ('artist (instr)', 'xʊˈdoʐnʲɪkəm', 'n'),
    'музыкант': ('musician', 'muzɨˈkant', 'n'),
    'музыкантом': ('musician (instr)', 'muzɨˈkantəm', 'n'),
    'футболист': ('footballer', 'fʊtbɐˈlʲist', 'n'),
    'футболистом': ('footballer (instr)', 'fʊtbɐˈlʲistəm', 'n'),
    'журналист': ('journalist', 'ʐʊrnɐˈlʲist', 'n'),
    'журналистом': ('journalist (instr)', 'ʐʊrnɐˈlʲistəm', 'n'),
    'повар': ('cook', 'ˈpovər', 'n'),
    'поваром': ('cook (instr)', 'ˈpovərəm', 'n'),
    'лётчик': ('pilot', 'ˈlʲotɕɪk', 'n'),
    'лётчиком': ('pilot (instr)', 'ˈlʲotɕɪkəm', 'n'),
    'полицейский': ('policeman', 'pəlʲɪˈtsejskʲɪj', 'n'),
    'библиотека': ('library', 'bʲɪblʲɪɐˈtʲekə', 'n'),
    'библиотеке': ('library (prep)', 'bʲɪblʲɪɐˈtʲekʲɪ', 'n'),
    'магазине': ('shop (prep)', 'mɐɡɐˈzʲinʲɪ', 'n'),
    'рынке': ('market (prep)', 'ˈrɨnkʲɪ', 'n'),
    'рынок': ('market', 'ˈrɨnək', 'n'),
    'площади': ('square (gen/prep)', 'ˈploɕːɪdʲɪ', 'n'),
    'площадь': ('square', 'ˈploɕːɪtʲ', 'n'),
    'деревне': ('village (prep)', 'dʲɪˈrʲevnʲɪ', 'n'),
    'деревня': ('village', 'dʲɪˈrʲevnʲə', 'n'),
    'квартира': ('apartment', 'kvɐrˈtʲirə', 'n'),
    'квартире': ('apartment (prep)', 'kvɐrˈtʲirʲɪ', 'n'),
    'квартиру': ('apartment (acc)', 'kvɐrˈtʲiru', 'n'),
    'этаже': ('floor (prep)', 'ɪtɐˈʐɛ', 'n'),
    'этаж': ('floor, story', 'ɪˈtaʂ', 'n'),
    'экзамен': ('exam', 'ɪɡˈzamʲɪn', 'n'),
    'экзамены': ('exams', 'ɪɡˈzamʲɪnɨ', 'n'),
    'задание': ('assignment, task', 'zɐˈdanʲɪjɪ', 'n'),
    'задания': ('assignments', 'zɐˈdanʲɪjə', 'n'),
    'предмет': ('subject, object', 'prʲɪdˈmʲet', 'n'),
    'урок': ('lesson', 'ʊˈrok', 'n'),
    'уроки': ('lessons', 'ʊˈrokʲɪ', 'n'),
    'уроков': ('lessons (gen)', 'ʊˈrokəf', 'n'),
    'каникулы': ('vacation, holidays', 'kɐˈnʲikʊlɨ', 'n'),
    'каникул': ('vacation (gen)', 'kɐˈnʲikʊl', 'n'),
    'праздник': ('holiday, celebration', 'ˈpraznʲɪk', 'n'),
    'праздники': ('holidays', 'ˈpraznʲɪkʲɪ', 'n'),
    'подарок': ('gift', 'pɐˈdarək', 'n'),
    'подарки': ('gifts', 'pɐˈdarkʲɪ', 'n'),
    'подарков': ('gifts (gen)', 'pɐˈdarkəf', 'n'),
    'рождения': ('birthday (lit. of birth)', 'rɐʐˈdʲenʲɪjə', 'n'),
    'сюрприз': ('surprise', 'sʲurˈprʲis', 'n'),
    'вечеринка': ('party', 'vʲɪtɕɪˈrʲinkə', 'n'),
    'вечеринке': ('party (prep)', 'vʲɪtɕɪˈrʲinkʲɪ', 'n'),
    'вечеринку': ('party (acc)', 'vʲɪtɕɪˈrʲinku', 'n'),
    'гостей': ('guests (gen)', 'ɡɐsˈtʲej', 'n'),
    'гостям': ('to guests (dat)', 'ɡɐsˈtʲam', 'n'),

    # Food and daily life
    'блюдо': ('dish', 'ˈblʲudə', 'n'),
    'блюда': ('dishes', 'ˈblʲudə', 'n'),
    'рецепт': ('recipe', 'rʲɪˈtsɛpt', 'n'),
    'каша': ('porridge', 'ˈkaʂə', 'n'),
    'борщ': ('borscht', 'borɕː', 'n'),
    'пельмени': ('dumplings', 'pʲɪlʲˈmʲenʲɪ', 'n'),
    'блины': ('pancakes', 'blʲɪˈnɨ', 'n'),
    'варенье': ('jam', 'vɐˈrʲenʲjɪ', 'n'),
    'пирожок': ('small pie', 'pʲɪrɐˈʐok', 'n'),
    'торт': ('cake', 'tort', 'n'),
    'мороженое': ('ice cream', 'mɐˈroʐɨnəjɪ', 'n'),
    'конфеты': ('candy', 'kɐnˈfʲetɨ', 'n'),
    'шоколад': ('chocolate', 'ʂəkɐˈlat', 'n'),
    'сок': ('juice', 'sok', 'n'),

    # Nature and weather
    'лето': ('summer', 'ˈlʲetə', 'n'),
    'летом': ('in summer', 'ˈlʲetəm', 'adv'),
    'зима': ('winter', 'zʲɪˈma', 'n'),
    'зимой': ('in winter', 'zʲɪˈmoj', 'adv'),
    'осень': ('autumn', 'ˈosʲɪnʲ', 'n'),
    'осенью': ('in autumn', 'ˈosʲɪnʲju', 'adv'),

    # Time and duration
    'минут': ('minutes (gen)', 'mʲɪˈnut', 'n'),
    'секунда': ('second', 'sʲɪˈkundə', 'n'),
    'полчаса': ('half an hour', 'pəltɕɪˈsa', 'n'),
    'полгода': ('half a year', 'pəlˈɡodə', 'n'),

    # Education
    'университет': ('university', 'ʊnʲɪvʲɪrsʲɪˈtʲet', 'n'),
    'институт': ('institute', 'ɪnstʲɪˈtut', 'n'),

    # Transport
    'метро': ('metro, subway', 'mʲɪˈtro', 'n'),
    'остановка': ('bus stop', 'ɐstɐˈnofkə', 'n'),
    'остановке': ('bus stop (prep)', 'ɐstɐˈnofkʲɪ', 'n'),
    'такси': ('taxi', 'tɐkˈsʲi', 'n'),
    'велосипед': ('bicycle', 'vʲɪləsʲɪˈpʲet', 'n'),
    'велосипеде': ('bicycle (prep)', 'vʲɪləsʲɪˈpʲedʲɪ', 'n'),

    # Misc common
    'сумка': ('bag', 'ˈsumkə', 'n'),
    'сумку': ('bag (acc)', 'ˈsumku', 'n'),
    'телефон': ('telephone', 'tʲɪlʲɪˈfon', 'n'),
    'телефону': ('telephone (dat)', 'tʲɪlʲɪˈfonu', 'n'),
    'компьютер': ('computer', 'kɐmpˈjutʲɪr', 'n'),
    'компьютере': ('computer (prep)', 'kɐmpˈjutʲɪrʲɪ', 'n'),
    'интернет': ('internet', 'ɪntʲɪrˈnʲet', 'n'),
    'интернете': ('internet (prep)', 'ɪntʲɪrˈnʲetʲɪ', 'n'),
    'фильм': ('film', 'fʲilʲm', 'n'),
    'фильма': ('film (gen)', 'ˈfʲilʲmə', 'n'),
    'фильмы': ('films', 'ˈfʲilʲmɨ', 'n'),
    'песня': ('song', 'ˈpʲesʲnʲə', 'n'),
    'песню': ('song (acc)', 'ˈpʲesʲnʲu', 'n'),
    'песни': ('songs', 'ˈpʲesʲnʲɪ', 'n'),
    'музыка': ('music', 'ˈmuzɨkə', 'n'),
    'музыку': ('music (acc)', 'ˈmuzɨku', 'n'),
    'картина': ('painting, picture', 'kɐrˈtʲinə', 'n'),
    'картину': ('painting (acc)', 'kɐrˈtʲinu', 'n'),
    'фотография': ('photograph', 'fətɐˈɡrafʲɪjə', 'n'),
    'спорт': ('sport', 'sport', 'n'),
    'футбол': ('football', 'fʊtˈbol', 'n'),
    'шахматы': ('chess', 'ˈʂaxmətɨ', 'n'),
    'бассейн': ('swimming pool', 'bɐˈsʲejn', 'n'),
    'бассейне': ('swimming pool (prep)', 'bɐˈsʲejnʲɪ', 'n'),

    # More adjective forms
    'младший': ('younger', 'ˈmlatʂɨj', 'adj'),
    'младшая': ('younger (f)', 'ˈmlatʂəjə', 'adj'),
    'красивая': ('beautiful (f)', 'krɐˈsʲivəjə', 'adj'),
    'красивое': ('beautiful (n)', 'krɐˈsʲivəjɪ', 'adj'),
    'интересный': ('interesting', 'ɪnʲtʲɪˈrʲesnɨj', 'adj'),
    'интересная': ('interesting (f)', 'ɪnʲtʲɪˈrʲesnəjə', 'adj'),
    'интересное': ('interesting (n)', 'ɪnʲtʲɪˈrʲesnəjɪ', 'adj'),
    'вкусный': ('delicious', 'ˈfkusnɨj', 'adj'),
    'вкусная': ('delicious (f)', 'ˈfkusnəjə', 'adj'),
    'вкусное': ('delicious (n)', 'ˈfkusnəjɪ', 'adj'),
    'лучший': ('best', 'ˈlutɕʂɨj', 'adj'),
    'лучшая': ('best (f)', 'ˈlutɕʂəjə', 'adj'),
    'лучшее': ('best (n)', 'ˈlutɕʂəjɪ', 'adj'),
    'огромный': ('huge', 'ɐˈɡromnɨj', 'adj'),
    'следующий': ('next, following', 'ˈslʲedʊjʊɕːɪj', 'adj'),
    'следующая': ('next (f)', 'ˈslʲedʊjʊɕːəjə', 'adj'),
    'прошлый': ('last, past', 'ˈproʂlɨj', 'adj'),
    'прошлом': ('last (prep)', 'ˈproʂləm', 'adj'),
    'прошлой': ('last (f, gen)', 'ˈproʂləj', 'adj'),
    'ближайший': ('nearest', 'blʲɪˈʐajʂɨj', 'adj'),
    'ближайшей': ('nearest (f, gen)', 'blʲɪˈʐajʂɪj', 'adj'),
    'тёмно-зелёным': ('dark green (instr)', 'ˈtʲomnɐzʲɪˈlʲonɨm', 'adj'),
}

# ── Rule-based IPA generation ────────────────────────────────
CYRILLIC_IPA = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'ɡ', 'д': 'd',
    'е': 'e', 'ё': 'o', 'ж': 'ʐ', 'з': 'z', 'и': 'i',
    'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'tɕ',
    'ш': 'ʂ', 'щ': 'ɕː', 'ъ': '', 'ы': 'ɨ', 'ь': 'ʲ',
    'э': 'ɛ', 'ю': 'ju', 'я': 'ja',
}

PALATALIZED_VOWELS = set('еёиюя')
VOWELS = set('аеёиоуыэюя')
CONSONANTS = set('бвгджзйклмнпрстфхцчшщ')

def generate_ipa(word):
    """Generate approximate IPA for a Russian word."""
    result = []
    chars = list(word.lower())
    i = 0

    # Simple heuristic for stress position:
    # Stress falls on: ё always; last syllable for short words; penultimate for longer
    vowel_positions = [j for j, c in enumerate(chars) if c in VOWELS]
    if not vowel_positions:
        # No vowels, just transliterate
        return ''.join(CYRILLIC_IPA.get(c, c) for c in chars)

    # ё is always stressed
    yo_pos = [j for j, c in enumerate(chars) if c == 'ё']
    if yo_pos:
        stress_pos = yo_pos[0]
    elif len(vowel_positions) == 1:
        stress_pos = vowel_positions[0]
    elif len(vowel_positions) == 2:
        stress_pos = vowel_positions[-1]  # often last in 2-syllable
    else:
        stress_pos = vowel_positions[-2]  # penultimate as default

    while i < len(chars):
        c = chars[i]

        if c == 'ь':
            # Soft sign - palatalize previous consonant
            if result and not result[-1].endswith('ʲ'):
                result.append('ʲ')
            i += 1
            continue

        if c == 'ъ':
            i += 1
            continue

        # Check if next char is a palatalizing vowel
        next_is_palatal = (i + 1 < len(chars) and chars[i + 1] in PALATALIZED_VOWELS)

        if c in CONSONANTS:
            base = CYRILLIC_IPA.get(c, c)
            if next_is_palatal and c not in 'жшц':  # ж, ш, ц are always hard
                result.append(base + 'ʲ')
            else:
                result.append(base)
            i += 1
            continue

        if c in VOWELS:
            is_stressed = (i == stress_pos)
            if c == 'а':
                result.append('a' if is_stressed else 'ɐ')
            elif c == 'о':
                result.append('o' if is_stressed else 'ɐ')
            elif c == 'е':
                if is_stressed:
                    result.append('e')
                else:
                    result.append('ɪ')
            elif c == 'ё':
                result.append('o')  # always stressed
            elif c == 'и':
                result.append('i' if is_stressed else 'ɪ')
            elif c == 'у':
                result.append('u' if is_stressed else 'ʊ')
            elif c == 'ы':
                result.append('ɨ')
            elif c == 'э':
                result.append('ɛ' if is_stressed else 'ɪ')
            elif c == 'ю':
                result.append('ju' if is_stressed else 'jʊ')
            elif c == 'я':
                result.append('ja' if is_stressed else 'jɪ')
            i += 1
            continue

        result.append(CYRILLIC_IPA.get(c, c))
        i += 1

    ipa = ''.join(result)
    # Add stress mark before the stressed syllable
    # Find the position in IPA corresponding to stress
    if len(vowel_positions) > 1:
        ipa = 'ˈ' + ipa  # simplified: just put it at start

    return ipa

# ── POS detection ────────────────────────────────────────────
FUNCTION_WORDS = {
    'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они',
    'в', 'на', 'с', 'к', 'у', 'о', 'из', 'за', 'по', 'до',
    'от', 'для', 'без', 'при', 'про', 'через', 'между',
    'над', 'под', 'перед', 'после', 'около',
    'и', 'а', 'но', 'или', 'что', 'если', 'когда', 'как',
    'не', 'ни', 'бы', 'же', 'ли', 'да', 'нет',
    'вот', 'ну', 'уж', 'даже', 'ведь',
}

def detect_pos(word):
    """Detect part of speech from Russian word endings."""
    w = word.lower()

    if w in FUNCTION_WORDS:
        if w in {'в', 'на', 'с', 'к', 'у', 'о', 'из', 'за', 'по', 'до', 'от', 'для', 'без', 'при', 'про', 'через', 'между', 'над', 'под', 'перед', 'после', 'около'}:
            return 'prep'
        if w in {'и', 'а', 'но', 'или', 'что', 'если', 'когда', 'как'}:
            return 'conj'
        if w in {'не', 'ни', 'бы', 'же', 'ли', 'да', 'нет', 'вот', 'ну', 'уж', 'даже', 'ведь'}:
            return 'part'
        return 'pron'

    # Verb infinitives
    if w.endswith('ть') or w.endswith('ти') or w.endswith('чь') or \
       w.endswith('ться') or w.endswith('тись'):
        return 'v'

    # Noun suffixes
    if w.endswith('ция') or w.endswith('ство') or w.endswith('ность') or \
       w.endswith('ение') or w.endswith('ание') or w.endswith('тель') or \
       w.endswith('щик') or w.endswith('чик') or w.endswith('ник') or \
       w.endswith('ист') or w.endswith('изм'):
        return 'n'

    # Adjective endings (nominative)
    if w.endswith('ый') or w.endswith('ий') or w.endswith('ой') or \
       w.endswith('ая') or w.endswith('ое') or w.endswith('ые') or \
       w.endswith('ие'):
        return 'adj'

    # Adverb endings (only -но/-ло as standalone suffixes, -ски always adv)
    if w.endswith('ски') or w.endswith('чески'):
        return 'adv'
    if (w.endswith('но') or w.endswith('ло')) and len(w) >= 4:
        # Heuristic: if the word without -но/-ло leaves a common adj stem, it's adv
        return 'adv'

    # Past tense verbs
    if w.endswith('ла') or w.endswith('ло') or w.endswith('ли'):
        # Could be verb past or noun, default to verb
        return 'v'

    # Default: noun (most common POS for unknown words)
    return 'n'

# ── Co-occurrence based translation ──────────────────────────
def guess_translation_from_context(word, sentences):
    """Try to guess English translation from co-occurring deck sentences."""
    if not sentences:
        return None

    # Take the first sentence pair where this word appears
    target, english = sentences[0]

    # Tokenize both
    ru_words = [clean_word(w) for w in target.split() if clean_word(w)]
    en_words = english.lower().split()
    en_words = [re.sub(r'[.,!?;:\'"()––\-…]', '', w).strip() for w in en_words]
    en_words = [w for w in en_words if w]

    if not ru_words or not en_words:
        return None

    # Find position of word in Russian sentence
    try:
        pos = ru_words.index(word)
    except ValueError:
        return None

    # Estimate corresponding position in English
    ratio = len(en_words) / len(ru_words) if ru_words else 1
    en_pos = min(int(pos * ratio), len(en_words) - 1)

    # Return a few words around the estimated position
    start = max(0, en_pos - 1)
    end = min(len(en_words), en_pos + 2)
    guess = ' '.join(en_words[start:end])

    # Filter out common English function words if that's all we got
    stop = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'but', 'it', 'i'}
    filtered = [w for w in en_words[start:end] if w not in stop]
    if filtered:
        return ' '.join(filtered[:3])

    return guess if len(guess) > 1 else None

# ── Generate entries for missing words ───────────────────────
new_entries = {}
for word, count in sorted(missing.items(), key=lambda x: -x[1]):
    if len(word) < 1:
        continue
    # Skip pure numbers and non-Cyrillic
    if not re.search(r'[\u0400-\u04FF]', word):
        continue

    # Check hardcoded common words first
    if word in COMMON_WORDS:
        en, ipa, pos = COMMON_WORDS[word]
    else:
        pos = detect_pos(word)
        ipa = generate_ipa(word)

        # Try co-occurrence translation
        en = guess_translation_from_context(word, deck_sentences.get(word, []))
        if not en:
            # Fallback: just use the word itself (will need manual review)
            en = f'({word})'

    new_entries[word] = {'en': en, 'ipa': ipa, 'pos': pos}

print(f"New entries to add: {len(new_entries)}")

# ── Filter: don't add entries already in dict_keys ───────────
actually_new = {k: v for k, v in new_entries.items() if k not in dict_keys}
print(f"After dedup with existing: {len(actually_new)}")

# ── Report coverage ──────────────────────────────────────────
total_words = len(deck_words)
existing_covered = total_words - len(missing)
new_covered = existing_covered + len(actually_new)
print(f"\nCoverage before: {existing_covered}/{total_words} = {100*existing_covered/total_words:.1f}%")
print(f"Coverage after:  {new_covered}/{total_words} = {100*new_covered/total_words:.1f}%")

# ── Format and append to ru.ts ───────────────────────────────
if WRITE and actually_new:
    # Build the TS entries
    lines = []
    lines.append("\n  // ── Auto-expanded entries (script-generated) ─────────────")

    # Group by POS
    by_pos = {}
    for word, data in sorted(actually_new.items()):
        pos = data['pos']
        if pos not in by_pos:
            by_pos[pos] = []
        by_pos[pos].append((word, data))

    pos_labels = {
        'n': 'Nouns', 'v': 'Verbs', 'adj': 'Adjectives', 'adv': 'Adverbs',
        'prep': 'Prepositions', 'conj': 'Conjunctions', 'pron': 'Pronouns',
        'part': 'Particles', 'num': 'Numbers',
    }

    for pos_key in ['pron', 'prep', 'conj', 'part', 'num', 'adv', 'adj', 'n', 'v']:
        if pos_key not in by_pos:
            continue
        entries = by_pos[pos_key]
        label = pos_labels.get(pos_key, pos_key)
        lines.append(f"  // ── {label} ───")
        for word, data in sorted(entries, key=lambda x: x[0]):
            en_escaped = data['en'].replace("'", "\\'")
            ipa_escaped = data['ipa'].replace("'", "\\'")
            # Use quotes if word contains special chars
            if "'" in word or '-' in word or not re.match(r'^[\w\u0400-\u04FF]+$', word):
                key = f"'{word}'"
            else:
                key = f"'{word}'"
            lines.append(f"  {key}: {{ en: '{en_escaped}', ipa: '{ipa_escaped}', pos: '{data['pos']}' }},")

    new_block = '\n'.join(lines)

    # Find the closing of the dictionary object (the line with just "};")
    # We insert before the `};` that closes the dictionary, but after the last entry
    # Find the marker: the line containing "const ADJ_ENDINGS" or the closing };
    # Actually, find the line with `};` that ends the dictionary object
    # Look for the pattern: line with just `};` followed by functions

    # Find insertion point: before ADJ_ENDINGS or NOUN_ENDINGS declarations
    insert_marker = "\n// ── Adjective"
    if insert_marker not in dict_content:
        insert_marker = "\nconst ADJ_ENDINGS"
    if insert_marker not in dict_content:
        # Fallback: find the closing `};` of dictionary
        insert_marker = "\n};\n"

    # Actually the dict ends with `};` then there are helper arrays and functions
    # Let's find where the dictionary entries end
    # The dictionary closing is `};` before the ADJ_ENDINGS or NOUN_ENDINGS
    # Let's find the pattern more carefully

    # Find "const NOUN_ENDINGS" or "const ADJ_ENDINGS"
    adj_match = re.search(r'\n(const ADJ_ENDINGS|// ── Adjective)', dict_content)
    if adj_match:
        insert_pos = adj_match.start()
    else:
        # Find last `};` before function definitions
        noun_match = re.search(r'\n(const NOUN_ENDINGS)', dict_content)
        if noun_match:
            insert_pos = noun_match.start()
        else:
            # Find the `};` that closes the dictionary
            dict_close = dict_content.rfind('\n};\n')
            insert_pos = dict_close

    # Find the `};` right before insert_pos
    dict_close = dict_content.rfind('};', 0, insert_pos)
    if dict_close == -1:
        print("ERROR: Could not find dictionary closing `};`")
        sys.exit(1)

    # Insert before the `};`
    new_content = dict_content[:dict_close] + new_block + '\n' + dict_content[dict_close:]

    with open(DICT_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"\n✓ Wrote {len(actually_new)} new entries to {DICT_PATH}")
else:
    if not WRITE:
        print("\nDry run. Use --write to apply changes.")
    else:
        print("\nNo new entries to add.")

# ── Show sample entries ──────────────────────────────────────
print("\nSample new entries (top 30 by frequency):")
for word, data in sorted(actually_new.items(), key=lambda x: -missing.get(x[0], 0))[:30]:
    freq = missing.get(word, 0)
    print(f"  {word:20s} → en='{data['en']}', ipa='{data['ipa']}', pos='{data['pos']}', freq={freq}")
