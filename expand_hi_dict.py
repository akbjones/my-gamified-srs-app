#!/usr/bin/env python3
"""
Expand Hindi dictionary (hi.ts) to cover all words from the deck.
Extracts unique words from deck.json, finds missing entries, generates
Hindi dictionary entries with English translations, IPA, and POS.
"""

import json
import re
import sys
import unicodedata

DECK_PATH = "src/data/hindi/deck.json"
DICT_PATH = "src/data/dictionary/hi.ts"

# ── Hindi IPA mapping ──────────────────────────────────────────
# Devanagari consonants to IPA
CONSONANT_IPA = {
    'क': 'k', 'ख': 'kʰ', 'ग': 'ɡ', 'घ': 'ɡʰ', 'ङ': 'ŋ',
    'च': 'tʃ', 'छ': 'tʃʰ', 'ज': 'dʒ', 'झ': 'dʒʰ', 'ञ': 'ɲ',
    'ट': 'ʈ', 'ठ': 'ʈʰ', 'ड': 'ɖ', 'ढ': 'ɖʰ', 'ण': 'ɳ',
    'त': 't', 'थ': 'tʰ', 'द': 'd', 'ध': 'dʰ', 'न': 'n',
    'प': 'p', 'फ': 'pʰ', 'ब': 'b', 'भ': 'bʰ', 'म': 'm',
    'य': 'j', 'र': 'r', 'ल': 'l', 'व': 'ʋ',
    'श': 'ʃ', 'ष': 'ʂ', 'स': 's', 'ह': 'h',
    'क़': 'q', 'ख़': 'x', 'ग़': 'ɣ', 'ज़': 'z', 'फ़': 'f', 'ड़': 'ɽ', 'ढ़': 'ɽʰ',
}

# Devanagari vowels (independent forms)
VOWEL_IPA = {
    'अ': 'ə', 'आ': 'aː', 'इ': 'ɪ', 'ई': 'iː', 'उ': 'ʊ', 'ऊ': 'uː',
    'ए': 'eː', 'ऐ': 'ɛː', 'ओ': 'oː', 'औ': 'ɔː', 'ऋ': 'rɪ',
}

# Vowel signs (matras)
MATRA_IPA = {
    'ा': 'aː', 'ि': 'ɪ', 'ी': 'iː', 'ु': 'ʊ', 'ू': 'uː',
    'े': 'eː', 'ै': 'ɛː', 'ो': 'oː', 'ौ': 'ɔː', 'ृ': 'rɪ',
}

def devanagari_to_ipa(word):
    """Convert a Hindi word in Devanagari to approximate IPA."""
    ipa = []
    i = 0
    chars = list(word)
    while i < len(chars):
        ch = chars[i]
        if ch in VOWEL_IPA:
            ipa.append(VOWEL_IPA[ch])
        elif ch in CONSONANT_IPA:
            ipa.append(CONSONANT_IPA[ch])
            # Check if next char is a matra (vowel sign)
            if i + 1 < len(chars) and chars[i + 1] in MATRA_IPA:
                ipa.append(MATRA_IPA[chars[i + 1]])
                i += 1
            elif i + 1 < len(chars) and chars[i + 1] == '्':
                # Halant/virama - no inherent vowel
                i += 1  # skip the virama
            else:
                # Inherent schwa (but not at end of word usually)
                if i < len(chars) - 1:
                    ipa.append('ə')
        elif ch in MATRA_IPA:
            ipa.append(MATRA_IPA[ch])
        elif ch == '्':
            pass  # virama already handled
        elif ch == 'ं':
            # Anusvara - nasalization
            ipa.append('n')
        elif ch == 'ँ':
            # Chandrabindu - nasalization
            ipa.append('̃')
        elif ch == 'ः':
            # Visarga
            ipa.append('h')
        elif ch == ' ':
            ipa.append(' ')
        elif ch == '़':
            # Nuqta - already handled in consonant lookup
            pass
        else:
            pass
        i += 1
    result = ''.join(ipa)
    return f'/{result}/'

def clean_word(word):
    """Clean punctuation from a Hindi word."""
    return re.sub(r'[।,!?;:"""\'\'()—–\-…«»\[\]0-9।॥]', '', word).strip()

def extract_deck_words(deck_path):
    """Extract all unique words from the Hindi deck."""
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
    keys = set()
    for m in re.finditer(r"'([^']+)'\s*:", content):
        keys.add(m.group(1))
    for m in re.finditer(r'"([^"]+)"\s*:', content):
        keys.add(m.group(1))
    return keys

# ── Hindi → English translation dictionary ─────────────────────
# Comprehensive mapping of common Hindi words
HINDI_TO_ENGLISH = {
    # Pronouns
    'मैं': ('I', 'pron'), 'तू': ('you (informal)', 'pron'), 'तुम': ('you', 'pron'),
    'आप': ('you (formal)', 'pron'), 'वह': ('he/she/that', 'pron'), 'यह': ('this', 'pron'),
    'वे': ('they/those', 'pron'), 'ये': ('these/they', 'pron'), 'हम': ('we', 'pron'),
    'मुझे': ('to me', 'pron'), 'तुम्हें': ('to you', 'pron'), 'उसे': ('to him/her', 'pron'),
    'हमें': ('to us', 'pron'), 'उन्हें': ('to them', 'pron'), 'आपको': ('to you (formal)', 'pron'),
    'मेरा': ('my (m)', 'pron'), 'मेरी': ('my (f)', 'pron'), 'मेरे': ('my (pl)', 'pron'),
    'तुम्हारा': ('your (m)', 'pron'), 'तुम्हारी': ('your (f)', 'pron'),
    'तुम्हारे': ('your (pl)', 'pron'),
    'आपका': ('your (formal m)', 'pron'), 'आपकी': ('your (formal f)', 'pron'),
    'आपके': ('your (formal pl)', 'pron'),
    'उसका': ('his/her (m)', 'pron'), 'उसकी': ('his/her (f)', 'pron'),
    'उसके': ('his/her (pl)', 'pron'),
    'हमारा': ('our (m)', 'pron'), 'हमारी': ('our (f)', 'pron'), 'हमारे': ('our (pl)', 'pron'),
    'उनका': ('their (m)', 'pron'), 'उनकी': ('their (f)', 'pron'), 'उनके': ('their (pl)', 'pron'),
    'कौन': ('who', 'pron'), 'क्या': ('what', 'pron'), 'कहाँ': ('where', 'adv'),
    'कब': ('when', 'adv'), 'कैसे': ('how', 'adv'), 'कैसा': ('how/what kind', 'adj'),
    'कैसी': ('how/what kind (f)', 'adj'), 'कितना': ('how much/many (m)', 'adj'),
    'कितनी': ('how much/many (f)', 'adj'), 'कितने': ('how many (pl)', 'adj'),
    'क्यों': ('why', 'adv'), 'किसका': ('whose', 'pron'), 'किसको': ('to whom', 'pron'),
    'कौन-सा': ('which one', 'pron'), 'किधर': ('which direction', 'adv'),
    'कोई': ('someone/anyone', 'pron'), 'कुछ': ('something/some', 'pron'),
    'सब': ('all/everyone', 'pron'), 'सबको': ('to everyone', 'pron'),
    'खुद': ('self', 'pron'), 'अपना': ('own (m)', 'pron'), 'अपनी': ('own (f)', 'pron'),
    'अपने': ('own (pl)', 'pron'), 'जो': ('who/which (relative)', 'pron'),
    'जिसे': ('to whom/which', 'pron'), 'जिसका': ('whose (relative)', 'pron'),

    # Postpositions & Particles
    'का': ('of (m)', 'postp'), 'की': ('of (f)', 'postp'), 'के': ('of (pl)', 'postp'),
    'को': ('to/for', 'postp'), 'से': ('from/with/by', 'postp'), 'में': ('in', 'postp'),
    'पर': ('on/at', 'postp'), 'तक': ('until/up to', 'postp'), 'ने': ('(agent marker)', 'postp'),
    'लिए': ('for', 'postp'), 'साथ': ('with/together', 'postp'), 'बीच': ('between/middle', 'n'),
    'पास': ('near', 'postp'), 'बाद': ('after', 'postp'), 'पहले': ('before', 'adv'),
    'ऊपर': ('above/up', 'adv'), 'नीचे': ('below/down', 'adv'), 'अंदर': ('inside', 'adv'),
    'बाहर': ('outside', 'adv'), 'सामने': ('in front of', 'postp'), 'पीछे': ('behind', 'postp'),
    'बगल': ('beside', 'n'), 'दूर': ('far', 'adj'), 'करीब': ('near/close', 'adj'),
    'यहाँ': ('here', 'adv'), 'वहाँ': ('there', 'adv'), 'जहाँ': ('where (relative)', 'adv'),
    'तरफ़': ('towards/direction', 'n'), 'तरफ': ('towards/direction', 'n'),
    'बारे': ('about (in)', 'postp'), 'बदले': ('in exchange', 'postp'),
    'वजह': ('reason', 'n'), 'ज़रिए': ('through/by means of', 'postp'),

    # Conjunctions
    'और': ('and', 'conj'), 'या': ('or', 'conj'), 'लेकिन': ('but', 'conj'),
    'मगर': ('but', 'conj'), 'परन्तु': ('but/however', 'conj'), 'पर': ('but/on', 'conj'),
    'क्योंकि': ('because', 'conj'), 'अगर': ('if', 'conj'), 'तो': ('then', 'conj'),
    'जब': ('when', 'conj'), 'तब': ('then', 'adv'), 'जबकि': ('while/whereas', 'conj'),
    'हालांकि': ('although', 'conj'), 'कि': ('that', 'conj'), 'ताकि': ('so that', 'conj'),
    'इसलिए': ('therefore', 'conj'), 'फिर': ('then/again', 'adv'), 'भी': ('also/even', 'part'),
    'ही': ('only/just', 'part'), 'न': ('not', 'part'), 'नहीं': ('no/not', 'adv'),
    'हाँ': ('yes', 'intj'), 'जी': ('yes (respectful)', 'intj'),
    'नही': ('not', 'adv'), 'मत': ('don\'t', 'adv'), 'बिलकुल': ('absolutely', 'adv'),
    'ज़रूर': ('certainly', 'adv'), 'शायद': ('maybe/perhaps', 'adv'),

    # Verbs (infinitives)
    'होना': ('to be', 'v'), 'करना': ('to do', 'v'), 'जाना': ('to go', 'v'),
    'आना': ('to come', 'v'), 'देना': ('to give', 'v'), 'लेना': ('to take', 'v'),
    'कहना': ('to say', 'v'), 'देखना': ('to see/look', 'v'), 'सुनना': ('to listen', 'v'),
    'खाना': ('to eat', 'v'), 'पीना': ('to drink', 'v'), 'पढ़ना': ('to read/study', 'v'),
    'लिखना': ('to write', 'v'), 'बोलना': ('to speak', 'v'), 'समझना': ('to understand', 'v'),
    'सोचना': ('to think', 'v'), 'जानना': ('to know', 'v'), 'चाहना': ('to want', 'v'),
    'रहना': ('to stay/live', 'v'), 'चलना': ('to walk/move', 'v'),
    'बैठना': ('to sit', 'v'), 'उठना': ('to get up', 'v'), 'सोना': ('to sleep', 'v'),
    'रोना': ('to cry', 'v'), 'हँसना': ('to laugh', 'v'), 'खेलना': ('to play', 'v'),
    'सीखना': ('to learn', 'v'), 'सिखाना': ('to teach', 'v'), 'बनाना': ('to make', 'v'),
    'रखना': ('to keep/put', 'v'), 'मिलना': ('to meet/be found', 'v'),
    'लाना': ('to bring', 'v'), 'भेजना': ('to send', 'v'), 'बताना': ('to tell', 'v'),
    'दौड़ना': ('to run', 'v'), 'तैरना': ('to swim', 'v'), 'गाना': ('to sing', 'v'),
    'नाचना': ('to dance', 'v'), 'धोना': ('to wash', 'v'), 'पकड़ना': ('to catch', 'v'),
    'छोड़ना': ('to leave/let go', 'v'), 'तोड़ना': ('to break', 'v'),
    'जोड़ना': ('to join/add', 'v'), 'काटना': ('to cut', 'v'),
    'खोलना': ('to open', 'v'), 'बंद करना': ('to close', 'v'),
    'भूलना': ('to forget', 'v'), 'याद करना': ('to remember', 'v'),
    'मारना': ('to hit/kill', 'v'), 'डरना': ('to be afraid', 'v'),
    'पहनना': ('to wear', 'v'), 'उतारना': ('to remove/take off', 'v'),
    'पकाना': ('to cook', 'v'), 'धोना': ('to wash', 'v'),
    'बचाना': ('to save/rescue', 'v'), 'पहुँचना': ('to reach/arrive', 'v'),
    'निकलना': ('to come out/leave', 'v'), 'गिरना': ('to fall', 'v'),
    'उड़ना': ('to fly', 'v'), 'खींचना': ('to pull/drag', 'v'),
    'धकेलना': ('to push', 'v'), 'फेंकना': ('to throw', 'v'),
    'मोड़ना': ('to turn/bend', 'v'), 'बदलना': ('to change', 'v'),
    'चुनना': ('to choose', 'v'), 'ढूँढना': ('to search/find', 'v'),
    'ढूंढना': ('to search/find', 'v'), 'खोजना': ('to search', 'v'),
    'लगना': ('to feel/seem', 'v'), 'लगाना': ('to apply/attach', 'v'),
    'मानना': ('to believe/accept', 'v'), 'बुलाना': ('to call/invite', 'v'),
    'पूछना': ('to ask', 'v'), 'बचना': ('to be saved/survive', 'v'),
    'चढ़ना': ('to climb/mount', 'v'), 'उतरना': ('to descend/get off', 'v'),
    'रुकना': ('to stop/wait', 'v'), 'रोकना': ('to stop (someone)', 'v'),
    'हटना': ('to move away', 'v'), 'हटाना': ('to remove/move', 'v'),
    'उठाना': ('to pick up/raise', 'v'), 'बिठाना': ('to seat someone', 'v'),
    'सुलाना': ('to put to sleep', 'v'), 'जगाना': ('to wake up', 'v'),
    'खिलाना': ('to feed', 'v'), 'पिलाना': ('to give to drink', 'v'),
    'समझाना': ('to explain', 'v'), 'सुनाना': ('to narrate/tell', 'v'),
    'दिखाना': ('to show', 'v'), 'पढ़ाना': ('to teach', 'v'),
    'लिखाना': ('to make write', 'v'), 'करवाना': ('to get done', 'v'),
    'बनवाना': ('to get made', 'v'), 'भिजवाना': ('to get sent', 'v'),
    'चलाना': ('to drive/operate', 'v'), 'रुलाना': ('to make cry', 'v'),
    'हँसाना': ('to make laugh', 'v'), 'जलाना': ('to burn/light', 'v'),
    'बुझाना': ('to extinguish', 'v'), 'सजाना': ('to decorate', 'v'),
    'सँभालना': ('to handle/manage', 'v'), 'संभालना': ('to handle/manage', 'v'),
    'ठहरना': ('to stay/stop', 'v'), 'घूमना': ('to roam/turn', 'v'),
    'टूटना': ('to break (intr.)', 'v'), 'जुड़ना': ('to be joined', 'v'),
    'बिकना': ('to be sold', 'v'), 'बेचना': ('to sell', 'v'),
    'ख़रीदना': ('to buy', 'v'), 'खरीदना': ('to buy', 'v'),
    'भरना': ('to fill', 'v'), 'ख़ाली करना': ('to empty', 'v'),
    'छूना': ('to touch', 'v'), 'मिलाना': ('to mix/match', 'v'),
    'बाँटना': ('to distribute', 'v'), 'बांटना': ('to distribute', 'v'),
    'इकट्ठा करना': ('to collect/gather', 'v'),
    'कूदना': ('to jump', 'v'), 'फिसलना': ('to slip', 'v'),
    'गिराना': ('to drop/topple', 'v'), 'पलटना': ('to turn over', 'v'),

    # Common verb forms (conjugated)
    'है': ('is', 'v'), 'हैं': ('are', 'v'), 'हूँ': ('am', 'v'),
    'था': ('was (m)', 'v'), 'थी': ('was (f)', 'v'), 'थे': ('were', 'v'), 'थीं': ('were (f)', 'v'),
    'हो': ('are/be', 'v'), 'होता': ('happens/is (hab.m)', 'v'), 'होती': ('happens/is (hab.f)', 'v'),
    'होते': ('happen/are (hab.pl)', 'v'), 'होगा': ('will be (m)', 'v'), 'होगी': ('will be (f)', 'v'),
    'करता': ('does (hab.m)', 'v'), 'करती': ('does (hab.f)', 'v'),
    'करते': ('do (hab.pl)', 'v'), 'किया': ('did (m)', 'v'), 'करें': ('do (subj.)', 'v'),
    'करो': ('do (imp.)', 'v'), 'कीजिए': ('please do', 'v'),
    'गया': ('went (m)', 'v'), 'गई': ('went (f)', 'v'), 'गए': ('went (pl)', 'v'),
    'आया': ('came (m)', 'v'), 'आई': ('came (f)', 'v'), 'आए': ('came (pl)', 'v'),
    'दिया': ('gave (m)', 'v'), 'दी': ('gave (f)', 'v'), 'दिए': ('gave (pl)', 'v'),
    'लिया': ('took (m)', 'v'), 'ली': ('took (f)', 'v'), 'लिए': ('took (pl)/for', 'v'),
    'कहा': ('said', 'v'), 'देखा': ('saw', 'v'), 'सुना': ('heard', 'v'),
    'खाया': ('ate (m)', 'v'), 'पिया': ('drank (m)', 'v'),
    'लिखा': ('wrote (m)', 'v'), 'पढ़ा': ('read (past m)', 'v'),
    'बोला': ('spoke (m)', 'v'), 'बोली': ('spoke (f)', 'v'),
    'रहा': ('staying/continuous (m)', 'v'), 'रही': ('staying/continuous (f)', 'v'),
    'रहे': ('staying/continuous (pl)', 'v'),
    'जाता': ('goes (hab.m)', 'v'), 'जाती': ('goes (hab.f)', 'v'),
    'जाते': ('go (hab.pl)', 'v'), 'आता': ('comes (hab.m)', 'v'),
    'आती': ('comes (hab.f)', 'v'), 'आते': ('come (hab.pl)', 'v'),
    'मिला': ('found/met (m)', 'v'), 'मिली': ('found/met (f)', 'v'),
    'मिले': ('found/met (pl)', 'v'),
    'चाहिए': ('should/want', 'v'), 'सकता': ('can (m)', 'v'),
    'सकती': ('can (f)', 'v'), 'सकते': ('can (pl)', 'v'),
    'पड़ता': ('have to (m)', 'v'), 'पड़ती': ('have to (f)', 'v'),
    'लगता': ('seems (m)', 'v'), 'लगती': ('seems (f)', 'v'),
    'लगा': ('felt/applied (m)', 'v'), 'लगी': ('felt/applied (f)', 'v'),
    'बना': ('made (m)', 'v'), 'बनी': ('made (f)', 'v'), 'बने': ('made (pl)', 'v'),
    'रखा': ('kept (m)', 'v'), 'रखी': ('kept (f)', 'v'),
    'चला': ('walked/went (m)', 'v'), 'चली': ('walked/went (f)', 'v'),
    'चले': ('walked/went (pl)', 'v'),
    'बैठा': ('sat (m)', 'v'), 'बैठी': ('sat (f)', 'v'),
    'उठा': ('got up (m)', 'v'), 'उठी': ('got up (f)', 'v'),
    'सोया': ('slept (m)', 'v'), 'रोया': ('cried (m)', 'v'),
    'हुआ': ('happened/became (m)', 'v'), 'हुई': ('happened/became (f)', 'v'),
    'हुए': ('happened/became (pl)', 'v'),
    'पहुँचा': ('arrived (m)', 'v'), 'पहुँची': ('arrived (f)', 'v'),
    'निकला': ('came out (m)', 'v'), 'निकली': ('came out (f)', 'v'),
    'गिरा': ('fell (m)', 'v'), 'गिरी': ('fell (f)', 'v'),
    'बदला': ('changed (m)', 'v'), 'बदली': ('changed (f)', 'v'),
    'रुका': ('stopped (m)', 'v'), 'रुकी': ('stopped (f)', 'v'),
    'चढ़ा': ('climbed (m)', 'v'), 'चढ़ी': ('climbed (f)', 'v'),
    'उतरा': ('descended (m)', 'v'), 'बचा': ('survived (m)', 'v'),
    'जला': ('burned (m)', 'v'), 'बजा': ('played (instrument m)', 'v'),
    'छोड़ा': ('left (m)', 'v'), 'तोड़ा': ('broke (m)', 'v'),
    'जोड़ा': ('joined (m)', 'v'), 'काटा': ('cut (m)', 'v'),
    'खोला': ('opened (m)', 'v'), 'भूला': ('forgot (m)', 'v'),
    'मारा': ('hit (m)', 'v'), 'पहना': ('wore (m)', 'v'),
    'घूमा': ('roamed (m)', 'v'), 'बेचा': ('sold (m)', 'v'),
    'खरीदा': ('bought (m)', 'v'), 'भरा': ('filled (m)', 'v'),
    'छुआ': ('touched (m)', 'v'), 'कूदा': ('jumped (m)', 'v'),
    'पूछा': ('asked (m)', 'v'), 'बुलाया': ('called (m)', 'v'),
    'समझा': ('understood (m)', 'v'), 'सीखा': ('learned (m)', 'v'),
    'बताया': ('told (m)', 'v'),

    # Nouns - People & Family
    'लोग': ('people', 'n'), 'आदमी': ('man', 'n'), 'औरत': ('woman', 'n'),
    'लड़का': ('boy', 'n'), 'लड़की': ('girl', 'n'), 'बच्चा': ('child (m)', 'n'),
    'बच्ची': ('child (f)', 'n'), 'बच्चे': ('children', 'n'),
    'माँ': ('mother', 'n'), 'पिता': ('father', 'n'), 'पापा': ('papa/dad', 'n'),
    'मम्मी': ('mommy', 'n'), 'दादा': ('paternal grandfather', 'n'),
    'दादी': ('paternal grandmother', 'n'), 'नाना': ('maternal grandfather', 'n'),
    'नानी': ('maternal grandmother', 'n'), 'भाई': ('brother', 'n'),
    'बहन': ('sister', 'n'), 'बेटा': ('son', 'n'), 'बेटी': ('daughter', 'n'),
    'पति': ('husband', 'n'), 'पत्नी': ('wife', 'n'),
    'चाचा': ('paternal uncle', 'n'), 'चाची': ('paternal aunt', 'n'),
    'मामा': ('maternal uncle', 'n'), 'मामी': ('maternal aunt', 'n'),
    'फूफा': ('father\'s sister\'s husband', 'n'), 'बुआ': ('father\'s sister', 'n'),
    'मौसी': ('mother\'s sister', 'n'), 'मौसा': ('mother\'s sister\'s husband', 'n'),
    'ससुर': ('father-in-law', 'n'), 'सास': ('mother-in-law', 'n'),
    'परिवार': ('family', 'n'), 'रिश्तेदार': ('relative', 'n'),
    'दोस्त': ('friend', 'n'), 'पड़ोसी': ('neighbor', 'n'),
    'इंसान': ('human being', 'n'), 'व्यक्ति': ('person', 'n'),
    'महिला': ('woman (formal)', 'n'), 'पुरुष': ('man (formal)', 'n'),

    # Professions
    'डॉक्टर': ('doctor', 'n'), 'शिक्षक': ('teacher', 'n'), 'अध्यापक': ('teacher', 'n'),
    'वकील': ('lawyer', 'n'), 'इंजीनियर': ('engineer', 'n'), 'पुलिस': ('police', 'n'),
    'सिपाही': ('soldier/constable', 'n'), 'किसान': ('farmer', 'n'),
    'दुकानदार': ('shopkeeper', 'n'), 'ड्राइवर': ('driver', 'n'),
    'नर्स': ('nurse', 'n'), 'कलाकार': ('artist', 'n'), 'लेखक': ('writer', 'n'),
    'पत्रकार': ('journalist', 'n'), 'गायक': ('singer', 'n'),
    'नेता': ('leader/politician', 'n'), 'मज़दूर': ('laborer', 'n'),
    'मजदूर': ('laborer', 'n'), 'वैज्ञानिक': ('scientist', 'n'),
    'व्यापारी': ('businessman', 'n'), 'नौकर': ('servant', 'n'),
    'रसोइया': ('cook', 'n'), 'मालिक': ('owner/boss', 'n'),

    # Body parts
    'सिर': ('head', 'n'), 'आँख': ('eye', 'n'), 'कान': ('ear', 'n'),
    'नाक': ('nose', 'n'), 'मुँह': ('mouth', 'n'), 'मुंह': ('mouth', 'n'),
    'होंठ': ('lip', 'n'), 'दाँत': ('tooth', 'n'), 'जीभ': ('tongue', 'n'),
    'हाथ': ('hand', 'n'), 'पैर': ('foot/leg', 'n'), 'उँगली': ('finger', 'n'),
    'उंगली': ('finger', 'n'), 'गला': ('throat', 'n'), 'कंधा': ('shoulder', 'n'),
    'पेट': ('stomach', 'n'), 'पीठ': ('back', 'n'), 'छाती': ('chest', 'n'),
    'घुटना': ('knee', 'n'), 'बाल': ('hair', 'n'), 'चेहरा': ('face', 'n'),
    'दिल': ('heart', 'n'), 'दिमाग़': ('brain/mind', 'n'), 'दिमाग': ('brain/mind', 'n'),
    'ख़ून': ('blood', 'n'), 'खून': ('blood', 'n'), 'हड्डी': ('bone', 'n'),
    'त्वचा': ('skin', 'n'), 'शरीर': ('body', 'n'),

    # Nature
    'पानी': ('water', 'n'), 'हवा': ('air/wind', 'n'), 'सूरज': ('sun', 'n'),
    'चाँद': ('moon', 'n'), 'चांद': ('moon', 'n'), 'तारा': ('star', 'n'),
    'आसमान': ('sky', 'n'), 'बादल': ('cloud', 'n'), 'बारिश': ('rain', 'n'),
    'धूप': ('sunshine', 'n'), 'बर्फ़': ('snow/ice', 'n'), 'बर्फ': ('snow/ice', 'n'),
    'नदी': ('river', 'n'), 'समुद्र': ('ocean', 'n'), 'पहाड़': ('mountain', 'n'),
    'जंगल': ('forest', 'n'), 'पेड़': ('tree', 'n'), 'फूल': ('flower', 'n'),
    'पत्ता': ('leaf', 'n'), 'पत्ते': ('leaves', 'n'), 'घास': ('grass', 'n'),
    'मिट्टी': ('soil/clay', 'n'), 'पत्थर': ('stone', 'n'), 'रेत': ('sand', 'n'),
    'आग': ('fire', 'n'), 'धरती': ('earth', 'n'), 'ज़मीन': ('land/ground', 'n'),
    'जमीन': ('land/ground', 'n'),
    'हरा': ('green', 'adj'), 'हरी': ('green (f)', 'adj'),

    # Animals
    'जानवर': ('animal', 'n'), 'कुत्ता': ('dog', 'n'), 'बिल्ली': ('cat', 'n'),
    'गाय': ('cow', 'n'), 'भैंस': ('buffalo', 'n'), 'घोड़ा': ('horse', 'n'),
    'बकरी': ('goat', 'n'), 'भेड़': ('sheep', 'n'), 'मुर्गी': ('hen', 'n'),
    'चिड़िया': ('bird', 'n'), 'मछली': ('fish', 'n'), 'मोर': ('peacock', 'n'),
    'हाथी': ('elephant', 'n'), 'शेर': ('lion/tiger', 'n'), 'बंदर': ('monkey', 'n'),
    'साँप': ('snake', 'n'), 'सांप': ('snake', 'n'), 'चूहा': ('mouse', 'n'),
    'खरगोश': ('rabbit', 'n'), 'कबूतर': ('pigeon', 'n'), 'तोता': ('parrot', 'n'),

    # Places
    'घर': ('house/home', 'n'), 'कमरा': ('room', 'n'), 'रसोई': ('kitchen', 'n'),
    'स्नानघर': ('bathroom', 'n'), 'दरवाज़ा': ('door', 'n'), 'दरवाजा': ('door', 'n'),
    'खिड़की': ('window', 'n'), 'दीवार': ('wall', 'n'), 'छत': ('roof', 'n'),
    'फ़र्श': ('floor', 'n'), 'फर्श': ('floor', 'n'), 'सीढ़ी': ('staircase', 'n'),
    'बगीचा': ('garden', 'n'), 'आँगन': ('courtyard', 'n'), 'आंगन': ('courtyard', 'n'),
    'सड़क': ('road', 'n'), 'गली': ('lane/alley', 'n'), 'चौराहा': ('crossroads', 'n'),
    'पुल': ('bridge', 'n'), 'बाज़ार': ('market', 'n'), 'बाजार': ('market', 'n'),
    'दुकान': ('shop', 'n'), 'स्कूल': ('school', 'n'), 'विश्वविद्यालय': ('university', 'n'),
    'अस्पताल': ('hospital', 'n'), 'मंदिर': ('temple', 'n'), 'मस्जिद': ('mosque', 'n'),
    'गुरुद्वारा': ('Sikh temple', 'n'), 'चर्च': ('church', 'n'),
    'होटल': ('hotel', 'n'), 'रेस्टोरेंट': ('restaurant', 'n'),
    'स्टेशन': ('station', 'n'), 'हवाई अड्डा': ('airport', 'n'),
    'पुस्तकालय': ('library', 'n'), 'अदालत': ('court', 'n'),
    'शहर': ('city', 'n'), 'गाँव': ('village', 'n'), 'गांव': ('village', 'n'),
    'देश': ('country', 'n'), 'राज्य': ('state', 'n'), 'प्रदेश': ('state/region', 'n'),
    'इलाक़ा': ('area/region', 'n'), 'इलाका': ('area/region', 'n'),
    'मोहल्ला': ('neighborhood', 'n'), 'जगह': ('place', 'n'),
    'दफ़्तर': ('office', 'n'), 'दफ्तर': ('office', 'n'),
    'मैदान': ('field/ground', 'n'), 'पार्क': ('park', 'n'),

    # Food & Drink
    'खाना': ('food/to eat', 'n'), 'रोटी': ('bread/chapati', 'n'), 'चावल': ('rice', 'n'),
    'दाल': ('lentil soup', 'n'), 'सब्ज़ी': ('vegetable', 'n'), 'सब्जी': ('vegetable', 'n'),
    'फल': ('fruit', 'n'), 'दूध': ('milk', 'n'), 'चाय': ('tea', 'n'),
    'पानी': ('water', 'n'), 'चीनी': ('sugar/Chinese', 'n'), 'नमक': ('salt', 'n'),
    'मसाला': ('spice', 'n'), 'तेल': ('oil', 'n'), 'घी': ('clarified butter', 'n'),
    'मक्खन': ('butter', 'n'), 'पनीर': ('cottage cheese', 'n'),
    'अंडा': ('egg', 'n'), 'मांस': ('meat', 'n'), 'मीठा': ('sweet', 'adj'),
    'नमकीन': ('salty', 'adj'), 'खट्टा': ('sour', 'adj'), 'कड़वा': ('bitter', 'adj'),
    'तीखा': ('spicy', 'adj'), 'स्वादिष्ट': ('delicious', 'adj'),
    'भूख': ('hunger', 'n'), 'प्यास': ('thirst', 'n'),
    'आम': ('mango/common', 'n'), 'केला': ('banana', 'n'), 'सेब': ('apple', 'n'),
    'संतरा': ('orange', 'n'), 'अंगूर': ('grape', 'n'),
    'आलू': ('potato', 'n'), 'प्याज़': ('onion', 'n'), 'प्याज': ('onion', 'n'),
    'टमाटर': ('tomato', 'n'), 'गोभी': ('cauliflower', 'n'),
    'मटर': ('peas', 'n'), 'बैंगन': ('eggplant', 'n'),
    'नाश्ता': ('breakfast', 'n'), 'दोपहर': ('afternoon/lunch', 'n'),
    'रात': ('night', 'n'),
    'थाली': ('plate', 'n'), 'गिलास': ('glass', 'n'), 'कप': ('cup', 'n'),
    'चम्मच': ('spoon', 'n'), 'कटोरी': ('bowl', 'n'),
    'बर्तन': ('utensil', 'n'), 'बर्तनों': ('utensils (obl.)', 'n'),

    # Clothing
    'कपड़ा': ('cloth', 'n'), 'कपड़े': ('clothes', 'n'),
    'कमीज़': ('shirt', 'n'), 'कमीज': ('shirt', 'n'),
    'पैंट': ('pants', 'n'), 'साड़ी': ('sari', 'n'),
    'सलवार': ('salwar', 'n'), 'कुर्ता': ('kurta', 'n'),
    'दुपट्टा': ('dupatta/scarf', 'n'), 'जूता': ('shoe', 'n'), 'जूते': ('shoes', 'n'),
    'मोज़ा': ('sock', 'n'), 'मोज़े': ('socks', 'n'), 'टोपी': ('cap/hat', 'n'),
    'चश्मा': ('glasses', 'n'), 'घड़ी': ('watch/clock', 'n'),
    'अंगूठी': ('ring', 'n'), 'कंगन': ('bangle', 'n'),
    'चूड़ी': ('bangle', 'n'), 'बिंदी': ('bindi', 'n'),

    # Time
    'समय': ('time', 'n'), 'वक़्त': ('time', 'n'), 'वक्त': ('time', 'n'),
    'घंटा': ('hour', 'n'), 'मिनट': ('minute', 'n'),
    'दिन': ('day', 'n'), 'हफ़्ता': ('week', 'n'), 'हफ्ता': ('week', 'n'),
    'महीना': ('month', 'n'), 'साल': ('year', 'n'),
    'सुबह': ('morning', 'n'), 'दोपहर': ('afternoon', 'n'),
    'शाम': ('evening', 'n'), 'रात': ('night', 'n'),
    'आज': ('today', 'adv'), 'कल': ('yesterday/tomorrow', 'adv'),
    'परसों': ('day before/after', 'adv'),
    'अभी': ('right now', 'adv'), 'बाद': ('later/after', 'adv'),
    'पहले': ('before/first', 'adv'), 'हमेशा': ('always', 'adv'),
    'कभी': ('ever/sometimes', 'adv'), 'कभी-कभी': ('sometimes', 'adv'),
    'अक्सर': ('often', 'adv'), 'रोज़': ('daily', 'adv'), 'रोज': ('daily', 'adv'),
    'जल्दी': ('quickly/soon', 'adv'), 'देर': ('delay/late', 'n'),
    'फ़ौरन': ('immediately', 'adv'), 'तुरंत': ('immediately', 'adv'),
    'सोमवार': ('Monday', 'n'), 'मंगलवार': ('Tuesday', 'n'),
    'बुधवार': ('Wednesday', 'n'), 'गुरुवार': ('Thursday', 'n'),
    'शुक्रवार': ('Friday', 'n'), 'शनिवार': ('Saturday', 'n'),
    'रविवार': ('Sunday', 'n'),

    # Adjectives
    'अच्छा': ('good (m)', 'adj'), 'अच्छी': ('good (f)', 'adj'), 'अच्छे': ('good (pl)', 'adj'),
    'बुरा': ('bad (m)', 'adj'), 'बुरी': ('bad (f)', 'adj'),
    'बड़ा': ('big (m)', 'adj'), 'बड़ी': ('big (f)', 'adj'), 'बड़े': ('big (pl)', 'adj'),
    'छोटा': ('small (m)', 'adj'), 'छोटी': ('small (f)', 'adj'), 'छोटे': ('small (pl)', 'adj'),
    'लंबा': ('tall/long (m)', 'adj'), 'लंबी': ('tall/long (f)', 'adj'),
    'मोटा': ('fat/thick (m)', 'adj'), 'पतला': ('thin (m)', 'adj'),
    'सुंदर': ('beautiful', 'adj'), 'ख़ूबसूरत': ('beautiful', 'adj'), 'खूबसूरत': ('beautiful', 'adj'),
    'नया': ('new (m)', 'adj'), 'नई': ('new (f)', 'adj'), 'नए': ('new (pl)', 'adj'),
    'पुराना': ('old (m)', 'adj'), 'पुरानी': ('old (f)', 'adj'), 'पुराने': ('old (pl)', 'adj'),
    'गर्म': ('hot/warm', 'adj'), 'ठंडा': ('cold (m)', 'adj'), 'ठंडी': ('cold (f)', 'adj'),
    'आसान': ('easy', 'adj'), 'मुश्किल': ('difficult', 'adj'),
    'सही': ('correct/right', 'adj'), 'ग़लत': ('wrong', 'adj'), 'गलत': ('wrong', 'adj'),
    'ज़रूरी': ('necessary', 'adj'), 'जरूरी': ('necessary', 'adj'),
    'साफ़': ('clean', 'adj'), 'साफ': ('clean', 'adj'), 'गंदा': ('dirty', 'adj'),
    'ख़ाली': ('empty', 'adj'), 'खाली': ('empty', 'adj'), 'भरा': ('full', 'adj'),
    'मज़बूत': ('strong', 'adj'), 'मजबूत': ('strong', 'adj'), 'कमज़ोर': ('weak', 'adj'),
    'ख़ुश': ('happy', 'adj'), 'खुश': ('happy', 'adj'), 'उदास': ('sad', 'adj'),
    'थका': ('tired (m)', 'adj'), 'थकी': ('tired (f)', 'adj'),
    'बीमार': ('sick', 'adj'), 'स्वस्थ': ('healthy', 'adj'),
    'अमीर': ('rich', 'adj'), 'ग़रीब': ('poor', 'adj'), 'गरीब': ('poor', 'adj'),
    'सस्ता': ('cheap', 'adj'), 'महँगा': ('expensive', 'adj'), 'महंगा': ('expensive', 'adj'),
    'तेज़': ('fast/sharp', 'adj'), 'तेज': ('fast/sharp', 'adj'), 'धीमा': ('slow', 'adj'),
    'भारी': ('heavy', 'adj'), 'हल्का': ('light', 'adj'),
    'गहरा': ('deep', 'adj'), 'उथला': ('shallow', 'adj'),
    'चौड़ा': ('wide', 'adj'), 'संकरा': ('narrow', 'adj'),
    'मुलायम': ('soft', 'adj'), 'कठोर': ('hard/strict', 'adj'),
    'पक्का': ('ripe/permanent', 'adj'), 'कच्चा': ('raw/unripe', 'adj'),
    'ताज़ा': ('fresh', 'adj'), 'ताजा': ('fresh', 'adj'),
    'पूरा': ('complete/whole (m)', 'adj'), 'पूरी': ('complete/whole (f)', 'adj'),
    'आधा': ('half', 'adj'),
    'काला': ('black (m)', 'adj'), 'काली': ('black (f)', 'adj'),
    'सफ़ेद': ('white', 'adj'), 'सफेद': ('white', 'adj'),
    'लाल': ('red', 'adj'), 'नीला': ('blue (m)', 'adj'), 'नीली': ('blue (f)', 'adj'),
    'पीला': ('yellow (m)', 'adj'), 'पीली': ('yellow (f)', 'adj'),
    'हरा': ('green (m)', 'adj'), 'हरी': ('green (f)', 'adj'),
    'भूरा': ('brown', 'adj'), 'गुलाबी': ('pink', 'adj'),
    'बैंगनी': ('purple', 'adj'), 'सलेटी': ('gray', 'adj'),
    'सफ़ेद': ('white', 'adj'), 'चमकीला': ('shiny', 'adj'),
    'ज़्यादा': ('more', 'adj'), 'ज्यादा': ('more', 'adj'),
    'कम': ('less', 'adj'), 'काफ़ी': ('enough', 'adj'), 'काफी': ('enough/quite', 'adj'),
    'ख़ास': ('special', 'adj'), 'खास': ('special', 'adj'),
    'आम': ('common/mango', 'adj'), 'प्रसिद्ध': ('famous', 'adj'),
    'अजीब': ('strange', 'adj'), 'अलग': ('different/separate', 'adj'),
    'एक जैसा': ('similar', 'adj'),

    # Abstract nouns
    'बात': ('matter/talk', 'n'), 'काम': ('work', 'n'), 'ज़िंदगी': ('life', 'n'),
    'जिंदगी': ('life', 'n'), 'ज़िन्दगी': ('life', 'n'),
    'मौत': ('death', 'n'), 'प्यार': ('love', 'n'), 'ख़ुशी': ('happiness', 'n'),
    'खुशी': ('happiness', 'n'), 'दुख': ('sorrow', 'n'), 'ग़ुस्सा': ('anger', 'n'),
    'गुस्सा': ('anger', 'n'), 'डर': ('fear', 'n'), 'उम्मीद': ('hope', 'n'),
    'सच': ('truth', 'n'), 'झूठ': ('lie', 'n'),
    'सपना': ('dream', 'n'), 'याद': ('memory', 'n'), 'ख़्याल': ('thought', 'n'),
    'ख्याल': ('thought', 'n'), 'विचार': ('idea/thought', 'n'),
    'फ़ैसला': ('decision', 'n'), 'फैसला': ('decision', 'n'),
    'इरादा': ('intention', 'n'), 'कोशिश': ('effort/try', 'n'),
    'मदद': ('help', 'n'), 'ज़रूरत': ('need', 'n'), 'जरूरत': ('need', 'n'),
    'तरीक़ा': ('method/way', 'n'), 'तरीका': ('method/way', 'n'),
    'वजह': ('reason', 'n'), 'मतलब': ('meaning', 'n'),
    'जवाब': ('answer', 'n'), 'सवाल': ('question', 'n'),
    'समस्या': ('problem', 'n'), 'हल': ('solution', 'n'),
    'नतीजा': ('result', 'n'), 'असर': ('effect', 'n'),
    'ताक़त': ('strength/power', 'n'), 'ताकत': ('strength/power', 'n'),
    'कमज़ोरी': ('weakness', 'n'),
    'हिम्मत': ('courage', 'n'), 'हौसला': ('courage/spirit', 'n'),
    'शांति': ('peace', 'n'), 'आज़ादी': ('freedom', 'n'), 'आजादी': ('freedom', 'n'),
    'न्याय': ('justice', 'n'), 'हक़': ('right', 'n'), 'हक': ('right', 'n'),
    'फ़र्ज़': ('duty', 'n'), 'ज़िम्मेदारी': ('responsibility', 'n'),
    'जिम्मेदारी': ('responsibility', 'n'),
    'अनुभव': ('experience', 'n'), 'सफलता': ('success', 'n'),
    'असफलता': ('failure', 'n'), 'विश्वास': ('trust/belief', 'n'),
    'इज़्ज़त': ('respect/honor', 'n'), 'इज्जत': ('respect/honor', 'n'),
    'रिश्ता': ('relationship', 'n'),

    # Objects
    'किताब': ('book', 'n'), 'कलम': ('pen', 'n'), 'काग़ज़': ('paper', 'n'),
    'कागज': ('paper', 'n'), 'कॉपी': ('notebook/copy', 'n'),
    'मेज़': ('table', 'n'), 'मेज': ('table', 'n'), 'कुर्सी': ('chair', 'n'),
    'बिस्तर': ('bed', 'n'), 'तकिया': ('pillow', 'n'), 'चादर': ('bedsheet', 'n'),
    'रज़ाई': ('quilt', 'n'), 'कंबल': ('blanket', 'n'),
    'शीशा': ('mirror/glass', 'n'), 'तस्वीर': ('picture', 'n'),
    'चाबी': ('key', 'n'), 'ताला': ('lock', 'n'),
    'फ़ोन': ('phone', 'n'), 'फोन': ('phone', 'n'),
    'कंप्यूटर': ('computer', 'n'), 'टीवी': ('TV', 'n'),
    'रेडियो': ('radio', 'n'), 'पंखा': ('fan', 'n'),
    'बल्ब': ('bulb', 'n'), 'बत्ती': ('light', 'n'),
    'साबुन': ('soap', 'n'), 'तौलिया': ('towel', 'n'),
    'ब्रश': ('brush', 'n'), 'कंघी': ('comb', 'n'),
    'बाल्टी': ('bucket', 'n'), 'डिब्बा': ('box/can', 'n'),
    'थैला': ('bag', 'n'), 'बैग': ('bag', 'n'),
    'छाता': ('umbrella', 'n'), 'रस्सी': ('rope', 'n'),
    'सुई': ('needle', 'n'), 'धागा': ('thread', 'n'),
    'पैसा': ('money', 'n'), 'पैसे': ('money (pl)', 'n'),
    'सिक्का': ('coin', 'n'), 'नोट': ('note', 'n'),

    # Transport
    'गाड़ी': ('car/vehicle', 'n'), 'बस': ('bus/enough', 'n'),
    'ट्रेन': ('train', 'n'), 'रिक्शा': ('rickshaw', 'n'),
    'साइकिल': ('bicycle', 'n'), 'मोटरसाइकिल': ('motorcycle', 'n'),
    'ऑटो': ('auto-rickshaw', 'n'), 'टैक्सी': ('taxi', 'n'),
    'हवाई जहाज़': ('airplane', 'n'), 'जहाज़': ('ship', 'n'),
    'जहाज': ('ship', 'n'), 'नाव': ('boat', 'n'),
    'टिकट': ('ticket', 'n'), 'सवारी': ('ride/passenger', 'n'),
    'यात्रा': ('journey/travel', 'n'), 'सफ़र': ('journey', 'n'), 'सफर': ('journey', 'n'),

    # Education
    'विद्यार्थी': ('student', 'n'), 'छात्र': ('student (m)', 'n'),
    'नौकरी': ('job', 'n'), 'कंपनी': ('company', 'n'),
    'परीक्षा': ('exam', 'n'), 'कक्षा': ('class', 'n'),
    'पाठ': ('lesson', 'n'), 'अभ्यास': ('practice', 'n'),
    'होमवर्क': ('homework', 'n'), 'प्रश्न': ('question', 'n'),
    'उत्तर': ('answer', 'n'),
    'ज्ञान': ('knowledge', 'n'), 'शिक्षा': ('education', 'n'),
    'विज्ञान': ('science', 'n'), 'गणित': ('mathematics', 'n'),
    'इतिहास': ('history', 'n'), 'भूगोल': ('geography', 'n'),
    'हिंदी': ('Hindi', 'n'), 'अंग्रेज़ी': ('English', 'n'), 'अंग्रेजी': ('English', 'n'),
    'भाषा': ('language', 'n'), 'शब्द': ('word', 'n'), 'वाक्य': ('sentence', 'n'),
    'अक्षर': ('letter (alphabet)', 'n'), 'पन्ना': ('page', 'n'),
    'कहानी': ('story', 'n'), 'कविता': ('poem', 'n'),

    # Numbers
    'एक': ('one', 'num'), 'दो': ('two', 'num'), 'तीन': ('three', 'num'),
    'चार': ('four', 'num'), 'पाँच': ('five', 'num'), 'पांच': ('five', 'num'),
    'छह': ('six', 'num'), 'सात': ('seven', 'num'), 'आठ': ('eight', 'num'),
    'नौ': ('nine', 'num'), 'दस': ('ten', 'num'),
    'ग्यारह': ('eleven', 'num'), 'बारह': ('twelve', 'num'),
    'तेरह': ('thirteen', 'num'), 'चौदह': ('fourteen', 'num'),
    'पंद्रह': ('fifteen', 'num'), 'सोलह': ('sixteen', 'num'),
    'सत्रह': ('seventeen', 'num'), 'अठारह': ('eighteen', 'num'),
    'उन्नीस': ('nineteen', 'num'), 'बीस': ('twenty', 'num'),
    'पच्चीस': ('twenty-five', 'num'), 'तीस': ('thirty', 'num'),
    'चालीस': ('forty', 'num'), 'पचास': ('fifty', 'num'),
    'साठ': ('sixty', 'num'), 'सत्तर': ('seventy', 'num'),
    'अस्सी': ('eighty', 'num'), 'नब्बे': ('ninety', 'num'),
    'सौ': ('hundred', 'num'), 'हज़ार': ('thousand', 'num'),
    'लाख': ('hundred thousand', 'num'), 'करोड़': ('ten million', 'num'),
    'पहला': ('first (m)', 'adj'), 'पहली': ('first (f)', 'adj'),
    'दूसरा': ('second/other (m)', 'adj'), 'दूसरी': ('second/other (f)', 'adj'),
    'तीसरा': ('third', 'adj'),

    # Adverbs
    'बहुत': ('very/much', 'adv'), 'थोड़ा': ('a little', 'adv'),
    'ज़रा': ('a little/please', 'adv'), 'जरा': ('a little/please', 'adv'),
    'बिल्कुल': ('absolutely', 'adv'), 'सच में': ('really', 'adv'),
    'सचमुच': ('truly', 'adv'), 'ज़रूर': ('certainly', 'adv'),
    'शायद': ('maybe', 'adv'), 'अक्सर': ('often', 'adv'),
    'अभी': ('now', 'adv'), 'तुरंत': ('immediately', 'adv'),
    'जल्दी': ('quickly', 'adv'), 'धीरे': ('slowly', 'adv'),
    'ज़ोर': ('force/loudly', 'n'), 'जोर': ('force/loudly', 'n'),
    'साथ': ('together', 'adv'), 'अकेला': ('alone (m)', 'adj'),
    'अकेली': ('alone (f)', 'adj'),
    'सीधा': ('straight', 'adj'), 'सीधे': ('straight (pl/adv)', 'adv'),
    'बाएँ': ('left', 'adv'), 'बाएं': ('left', 'adv'),
    'दाएँ': ('right', 'adv'), 'दाएं': ('right', 'adv'),
    'ऐसा': ('such/like this (m)', 'adj'), 'ऐसी': ('such/like this (f)', 'adj'),
    'ऐसे': ('like this', 'adv'), 'वैसा': ('like that (m)', 'adj'),
    'वैसे': ('like that/by the way', 'adv'),
    'सबसे': ('most (superlative)', 'adv'),
    'बस': ('enough/just', 'adv'), 'सिर्फ़': ('only', 'adv'), 'सिर्फ': ('only', 'adv'),
    'केवल': ('only', 'adv'),

    # Greetings & Expressions
    'नमस्ते': ('hello/greetings', 'intj'), 'नमस्कार': ('greetings', 'intj'),
    'धन्यवाद': ('thank you', 'intj'), 'शुक्रिया': ('thank you', 'intj'),
    'माफ़ी': ('forgiveness', 'n'), 'माफ': ('forgiven', 'adj'),
    'कृपया': ('please', 'adv'), 'स्वागत': ('welcome', 'n'),
    'अलविदा': ('goodbye', 'intj'), 'शुभकामनाएँ': ('best wishes', 'n'),
    'बधाई': ('congratulations', 'n'), 'मुबारक': ('congratulations', 'adj'),

    # Countries / Languages
    'भारत': ('India', 'n'), 'भारतीय': ('Indian', 'adj'),
    'पाकिस्तान': ('Pakistan', 'n'), 'चीन': ('China', 'n'),
    'अमेरिका': ('America', 'n'), 'इंग्लैंड': ('England', 'n'),
    'विदेश': ('abroad', 'n'), 'विदेशी': ('foreigner/foreign', 'adj'),

    # Weather & Seasons
    'मौसम': ('weather/season', 'n'), 'गर्मी': ('summer/heat', 'n'),
    'सर्दी': ('winter/cold', 'n'), 'बरसात': ('rainy season', 'n'),
    'बसंत': ('spring', 'n'), 'पतझड़': ('autumn', 'n'),

    # More common words
    'तरह': ('type/kind', 'n'), 'प्रकार': ('type/kind', 'n'),
    'हिस्सा': ('part', 'n'), 'भाग': ('part', 'n'),
    'शुरू': ('beginning', 'n'), 'अंत': ('end', 'n'),
    'बीच': ('middle/between', 'n'),
    'ओर': ('side/towards', 'n'), 'पक्ष': ('side', 'n'),
    'दिशा': ('direction', 'n'),
    'नाम': ('name', 'n'), 'उम्र': ('age', 'n'),
    'रंग': ('color', 'n'), 'आवाज़': ('sound/voice', 'n'), 'आवाज': ('sound/voice', 'n'),
    'गंध': ('smell', 'n'), 'स्वाद': ('taste', 'n'),
    'ख़बर': ('news', 'n'), 'खबर': ('news', 'n'),
    'संदेश': ('message', 'n'), 'ख़त': ('letter', 'n'), 'खत': ('letter', 'n'),
    'अख़बार': ('newspaper', 'n'), 'अखबार': ('newspaper', 'n'),
    'गीत': ('song', 'n'), 'गाना': ('song/to sing', 'n'),
    'फ़िल्म': ('film', 'n'), 'फिल्म': ('film', 'n'),
    'नाटक': ('drama', 'n'), 'खेल': ('game/sport', 'n'),
    'त्योहार': ('festival', 'n'), 'छुट्टी': ('holiday/leave', 'n'),
    'शादी': ('wedding/marriage', 'n'), 'जन्मदिन': ('birthday', 'n'),
    'तोहफ़ा': ('gift', 'n'), 'तोहफा': ('gift', 'n'),
    'दावत': ('feast/party', 'n'), 'जश्न': ('celebration', 'n'),

    # Religion/Culture
    'धर्म': ('religion', 'n'), 'भगवान': ('God', 'n'),
    'पूजा': ('worship', 'n'), 'प्रार्थना': ('prayer', 'n'),
    'दीवाली': ('Diwali', 'n'), 'होली': ('Holi', 'n'),
    'ईद': ('Eid', 'n'), 'क्रिसमस': ('Christmas', 'n'),

    # Government/Society
    'सरकार': ('government', 'n'), 'क़ानून': ('law', 'n'), 'कानून': ('law', 'n'),
    'अधिकार': ('right', 'n'), 'कर्तव्य': ('duty', 'n'),
    'चुनाव': ('election', 'n'), 'वोट': ('vote', 'n'),
    'नागरिक': ('citizen', 'n'), 'संविधान': ('constitution', 'n'),

    # Common verb + noun compounds
    'इस्तेमाल': ('use', 'n'), 'शुरुआत': ('beginning', 'n'),
    'ख़त्म': ('finished', 'adj'), 'खत्म': ('finished', 'adj'),
    'बंद': ('closed', 'adj'), 'खुला': ('open (m)', 'adj'),
    'तैयार': ('ready', 'adj'), 'मौजूद': ('present', 'adj'),
    'ग़ायब': ('missing/disappeared', 'adj'), 'गायब': ('missing/disappeared', 'adj'),
    'शुरू': ('started', 'adj'),
    'पसंद': ('liking/favorite', 'n'), 'नापसंद': ('dislike', 'n'),
    'इंतज़ार': ('waiting', 'n'), 'इंतजार': ('waiting', 'n'),
    'ध्यान': ('attention', 'n'), 'ख़्वाब': ('dream', 'n'),
    'इजाज़त': ('permission', 'n'),

    # More verbs
    'सुधारना': ('to improve/correct', 'v'), 'बचाना': ('to save', 'v'),
    'पहचानना': ('to recognize', 'v'), 'चुराना': ('to steal', 'v'),
    'बाँधना': ('to tie', 'v'), 'बांधना': ('to tie', 'v'),
    'खोदना': ('to dig', 'v'), 'बोना': ('to sow', 'v'),
    'काटना': ('to cut/harvest', 'v'), 'सींचना': ('to irrigate', 'v'),
    'उगाना': ('to grow', 'v'), 'सजाना': ('to decorate', 'v'),
    'सँवारना': ('to groom', 'v'), 'संवारना': ('to groom', 'v'),
    'मनाना': ('to celebrate/convince', 'v'), 'मिटाना': ('to erase', 'v'),
    'हिलाना': ('to shake/move', 'v'), 'घुमाना': ('to rotate/take around', 'v'),
    'बजाना': ('to play (instrument)', 'v'),

    # Particles and function words
    'वाला': ('one who (m)', 'part'), 'वाली': ('one who (f)', 'part'),
    'वाले': ('ones who (pl)', 'part'),
    'यानी': ('that is', 'conj'), 'बल्कि': ('rather', 'conj'),
    'चलो': ('let\'s go', 'intj'), 'आओ': ('come (imp.)', 'v'),
    'जाओ': ('go (imp.)', 'v'), 'बैठो': ('sit (imp.)', 'v'),
    'देखो': ('look (imp.)', 'v'), 'सुनो': ('listen (imp.)', 'v'),
    'बोलो': ('speak (imp.)', 'v'), 'खाओ': ('eat (imp.)', 'v'),
    'पढ़ो': ('read (imp.)', 'v'), 'लिखो': ('write (imp.)', 'v'),
    'चलो': ('let\'s go', 'v'), 'रुको': ('stop/wait (imp.)', 'v'),

    # Honorific and respect forms
    'जी': ('sir/madam (respectful)', 'part'),
    'साहब': ('sir', 'n'), 'बाबू': ('mister/babu', 'n'),
    'श्री': ('Mr.', 'n'), 'श्रीमती': ('Mrs.', 'n'),
    'गुरु': ('teacher/guru', 'n'),

    # Health
    'सेहत': ('health', 'n'), 'बुखार': ('fever', 'n'),
    'सर्दी': ('cold (illness/winter)', 'n'), 'खाँसी': ('cough', 'n'), 'खांसी': ('cough', 'n'),
    'दवाई': ('medicine', 'n'), 'इलाज': ('treatment', 'n'),
    'ऑपरेशन': ('operation', 'n'), 'चोट': ('injury', 'n'),

    # Common words appearing in sentences
    'वक़्त': ('time', 'n'), 'हालत': ('condition', 'n'),
    'ज़माना': ('era/age', 'n'), 'जमाना': ('era/age', 'n'),
    'दौर': ('era/phase', 'n'), 'किस्सा': ('tale/story', 'n'),
    'मज़ा': ('fun', 'n'), 'मजा': ('fun', 'n'),
    'ख़ुशबू': ('fragrance', 'n'), 'खुशबू': ('fragrance', 'n'),
    'चिंता': ('worry', 'n'), 'परेशानी': ('trouble', 'n'),
    'तकलीफ़': ('pain/trouble', 'n'), 'तकलीफ': ('pain/trouble', 'n'),
    'राहत': ('relief', 'n'), 'सुकून': ('peace', 'n'),
    'ख़ामोशी': ('silence', 'n'), 'खामोशी': ('silence', 'n'),
    'शोर': ('noise', 'n'),

    # More conjugated forms
    'करेंगे': ('will do (m.pl)', 'v'), 'करेगा': ('will do (m)', 'v'),
    'करेगी': ('will do (f)', 'v'), 'जाएगा': ('will go (m)', 'v'),
    'जाएगी': ('will go (f)', 'v'), 'जाएँगे': ('will go (pl)', 'v'),
    'आएगा': ('will come (m)', 'v'), 'आएगी': ('will come (f)', 'v'),
    'देगा': ('will give (m)', 'v'), 'देगी': ('will give (f)', 'v'),
    'लेगा': ('will take (m)', 'v'), 'बोलेगा': ('will speak (m)', 'v'),
    'खाएगा': ('will eat (m)', 'v'), 'पीएगा': ('will drink (m)', 'v'),
    'मिलेगा': ('will be found/meet (m)', 'v'), 'मिलेगी': ('will be found/meet (f)', 'v'),
    'होगा': ('will be (m)', 'v'), 'होगी': ('will be (f)', 'v'),
    'जाओ': ('go (imper.)', 'v'), 'आओ': ('come (imper.)', 'v'),
    'खाओ': ('eat (imper.)', 'v'), 'पीओ': ('drink (imper.)', 'v'),
    'दो': ('give (imper.)/two', 'v'), 'लो': ('take (imper.)', 'v'),
    'करो': ('do (imper.)', 'v'), 'बोलो': ('speak (imper.)', 'v'),
    'सुनो': ('listen (imper.)', 'v'), 'देखो': ('look (imper.)', 'v'),
    'चलो': ('let\'s go', 'v'), 'रुको': ('stop (imper.)', 'v'),
    'पूछो': ('ask (imper.)', 'v'),

    # Misc common
    'ज़रा': ('a bit/please', 'adv'), 'वर्ना': ('otherwise', 'conj'),
    'नहीं तो': ('otherwise', 'conj'), 'चलिए': ('let\'s go (formal)', 'v'),
    'कीजिए': ('please do (formal)', 'v'), 'बताइए': ('please tell (formal)', 'v'),
    'दीजिए': ('please give (formal)', 'v'), 'लीजिए': ('please take (formal)', 'v'),
    'जनाब': ('sir/gentleman', 'n'), 'महोदय': ('sir (formal)', 'n'),

    # Common suffixed/compound words
    'ज़िंदगी': ('life', 'n'), 'बचपन': ('childhood', 'n'),
    'जवानी': ('youth', 'n'), 'बुढ़ापा': ('old age', 'n'),
    'ग़रीबी': ('poverty', 'n'), 'अमीरी': ('richness', 'n'),
    'दोस्ती': ('friendship', 'n'), 'दुश्मनी': ('enmity', 'n'),
    'ईमानदारी': ('honesty', 'n'), 'बेईमानी': ('dishonesty', 'n'),
    'सफ़ाई': ('cleanliness', 'n'), 'सफाई': ('cleanliness', 'n'),
    'गंदगी': ('dirtiness', 'n'), 'तैयारी': ('preparation', 'n'),
    'पढ़ाई': ('studies', 'n'), 'लिखाई': ('writing', 'n'),
    'सिलाई': ('sewing', 'n'), 'कढ़ाई': ('embroidery', 'n'),
    'रंगाई': ('painting/dyeing', 'n'), 'धुलाई': ('washing', 'n'),

    # More
    'चोर': ('thief', 'n'), 'राजा': ('king', 'n'), 'रानी': ('queen', 'n'),
    'सेना': ('army', 'n'), 'युद्ध': ('war', 'n'),
    'हथियार': ('weapon', 'n'), 'तलवार': ('sword', 'n'),
    'बंदूक़': ('gun', 'n'), 'बंदूक': ('gun', 'n'),

    # Respect
    'माता': ('mother (formal)', 'n'), 'पिताजी': ('father (respectful)', 'n'),
    'दीदी': ('elder sister', 'n'), 'भैया': ('brother (affectionate)', 'n'),
    'बेटा': ('son/child (affectionate)', 'n'),

    'ललक': ('desire/longing', 'n'), 'अधूरा': ('incomplete', 'adj'),
    'बिना': ('without', 'postp'), 'रखो': ('keep (imp.)', 'v'),
    'सीखने': ('to learn (obl.)', 'v'),
    'हुए': ('while/having become', 'v'),
    'खेलते': ('playing (m.pl)', 'v'),
    'लिया': ('took', 'v'), 'दिया': ('gave', 'v'),
}

def guess_pos_hindi(word):
    """Guess part of speech for Hindi words based on common patterns."""
    if word.endswith('ना'):
        return 'v'
    if word.endswith(('ता', 'ती', 'ते', 'या', 'ई', 'गा', 'गी', 'गे')):
        return 'v'
    if word.endswith(('ाई', 'ावट', 'ाहट', 'पन', 'ता')):
        return 'n'
    if word.endswith(('ीय', 'ित', 'ीला')):
        return 'adj'
    return 'n'

def escape_ts_string(s):
    """Escape a string for TypeScript single-quoted strings."""
    return s.replace("\\", "\\\\").replace("'", "\\'")

def main():
    print("=" * 60)
    print("Hindi Dictionary Expansion")
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

    covered = len(deck_words) - len(missing)
    print(f"Initial coverage: {covered}/{len(deck_words)} ({100*covered/len(deck_words):.1f}%)")

    if not missing:
        print("No missing words!")
        return

    # 4. Generate entries for missing words
    new_entries = []
    for word in sorted(missing):
        if len(word) < 1:
            continue
        # Check our static dict
        if word in HINDI_TO_ENGLISH:
            en, pos = HINDI_TO_ENGLISH[word]
        else:
            en = word  # fallback: keep Devanagari as placeholder
            pos = guess_pos_hindi(word)

        ipa = devanagari_to_ipa(word)
        en_escaped = escape_ts_string(en)
        word_escaped = escape_ts_string(word)
        new_entries.append(f"  '{word_escaped}': {{ en: '{en_escaped}', ipa: '{ipa}', pos: '{pos}' }},")

    print(f"Generated {len(new_entries)} new entries")

    # 5. Insert into hi.ts before the closing '};' of the dictionary object
    with open(DICT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    insert_marker = '};\n\n// ── Verb form resolution'
    if insert_marker not in content:
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
