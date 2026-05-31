#!/usr/bin/env python3
"""
Generate src/data/dictionary/sv.ts — Swedish dictionary with IPA.
Extracts all unique words from the Swedish deck, generates translations + IPA.
"""
import json, re, sys

# ─── Load deck and extract unique words ────────────────────────
with open("src/data/swedish/deck.json") as f:
    deck = json.load(f)

word_set = set()
word_translations = {}  # word → english context from deck

for card in deck:
    target = card["target"]
    english = card["english"]
    for word in re.findall(r"[a-zA-ZåäöÅÄÖéèüàáâ]+", target):
        w = word.lower()
        word_set.add(w)
        if w not in word_translations:
            word_translations[w] = english

words = sorted(word_set)
print(f"Unique words: {len(words)}")

# ─── Swedish IPA generation rules ─────────────────────────────
# Swedish phonology - comprehensive rule-based IPA generator

def swedish_ipa(word):
    """Generate approximate IPA for a Swedish word."""
    w = word.lower()
    ipa = []
    i = 0
    n = len(w)

    # Track stress (Swedish typically stresses first syllable except for prefixes)
    stressed = True  # First syllable default

    while i < n:
        c = w[i]

        # ── Multi-character sequences first ──

        # sj-, skj- → [ɧ] (Swedish "sje-sound")
        if i + 2 <= n and w[i:i+3] == 'skj':
            ipa.append('ɧ')
            i += 3
            continue
        if i + 1 < n and w[i:i+2] == 'sj':
            ipa.append('ɧ')
            i += 2
            continue

        # stj → [ɧ]
        if i + 2 < n and w[i:i+3] == 'stj':
            ipa.append('ɧ')
            i += 3
            continue

        # sk before front vowels (e, i, y, ä, ö) → [ɧ]
        if i + 1 < n and w[i:i+2] == 'sk':
            if i + 2 < n and w[i+2] in 'eiyäö':
                ipa.append('ɧ')
                i += 2
                continue
            else:
                ipa.append('sk')
                i += 2
                continue

        # sch → [ɧ]
        if i + 2 < n and w[i:i+3] == 'sch':
            ipa.append('ɧ')
            i += 3
            continue

        # tj, kj → [ɕ] (voiceless alveolo-palatal fricative)
        if i + 1 < n and w[i:i+2] in ('tj', 'kj'):
            ipa.append('ɕ')
            i += 2
            continue

        # ch → [ɧ] in loanwords or [k]
        if i + 1 < n and w[i:i+2] == 'ch':
            ipa.append('ɧ')
            i += 2
            continue

        # ng → [ŋ]
        if i + 1 < n and w[i:i+2] == 'ng':
            ipa.append('ŋ')
            i += 2
            continue

        # nk → [ŋk]
        if i + 1 < n and w[i:i+2] == 'nk':
            ipa.append('ŋk')
            i += 2
            continue

        # dj → [j]
        if i + 1 < n and w[i:i+2] == 'dj':
            ipa.append('j')
            i += 2
            continue

        # gj, lj → [j]
        if i + 1 < n and w[i:i+2] in ('gj', 'lj'):
            ipa.append('j')
            i += 2
            continue

        # gn → [ŋn] initially, else [gn]
        if i + 1 < n and w[i:i+2] == 'gn':
            if i == 0:
                ipa.append('ŋn')
            else:
                ipa.append('gn')
            i += 2
            continue

        # ─── Vowel combinations ───

        # Long vowels (doubled)
        if i + 1 < n and c == w[i+1] and c in 'aeiou':
            vowel_map = {'a': 'aː', 'e': 'eː', 'i': 'iː', 'o': 'uː', 'u': 'ʉː'}
            ipa.append(vowel_map.get(c, c + 'ː'))
            i += 2
            continue

        # ─── Single characters ───

        # Vowels
        if c == 'a':
            # Long a before single consonant + vowel, short before cluster
            if i + 2 < n and w[i+1] not in 'aeiouyåäö' and (i + 2 >= n or w[i+2] in 'aeiouyåäö'):
                ipa.append('ɑː')
            else:
                ipa.append('a')
            i += 1
            continue

        if c == 'e':
            # Final -e is typically [ə]
            if i == n - 1:
                ipa.append('ə')
            elif i + 1 < n and w[i+1] == 'r' and (i + 2 >= n or w[i+2] not in 'aeiouyåäö'):
                ipa.append('æ')
            else:
                ipa.append('eː' if i + 2 < n and w[i+1] not in 'aeiouyåäö' and w[i+2] in 'aeiouyåäö' else 'ɛ')
            i += 1
            continue

        if c == 'i':
            ipa.append('ɪ')
            i += 1
            continue

        if c == 'o':
            # Swedish 'o' can be [uː] or [ɔ]
            if i + 1 < n and w[i+1] in 'ck' and i + 2 < n:
                ipa.append('ɔ')
            else:
                ipa.append('ʊ')
            i += 1
            continue

        if c == 'u':
            ipa.append('ʉ')
            i += 1
            continue

        if c == 'y':
            ipa.append('ʏ')
            i += 1
            continue

        if c == 'å':
            ipa.append('oː')
            i += 1
            continue

        if c == 'ä':
            # Before r → [æ], otherwise [ɛ]
            if i + 1 < n and w[i+1] == 'r':
                ipa.append('æ')
            else:
                ipa.append('ɛ')
            i += 1
            continue

        if c == 'ö':
            ipa.append('ø')
            i += 1
            continue

        # Consonants
        if c == 'b':
            ipa.append('b')
            i += 1
            continue

        if c == 'c':
            # c before e, i, y → [s], otherwise [k]
            if i + 1 < n and w[i+1] in 'eiy':
                ipa.append('s')
            else:
                ipa.append('k')
            i += 1
            continue

        if c == 'd':
            # rd → [ɖ] (retroflex)
            if i > 0 and w[i-1] == 'r':
                ipa[-1] = 'ɖ'  # Replace previous r
            else:
                ipa.append('d')
            i += 1
            continue

        if c == 'f':
            ipa.append('f')
            i += 1
            continue

        if c == 'g':
            # g before front vowels (e, i, y, ä, ö) → [j]
            if i + 1 < n and w[i+1] in 'eiyäö':
                ipa.append('j')
            # Final -g after vowel in some words
            elif i == n - 1 and i > 0 and w[i-1] in 'aeiouyåäö':
                ipa.append('j')
            else:
                ipa.append('ɡ')
            i += 1
            continue

        if c == 'h':
            # h is silent before j
            if i + 1 < n and w[i+1] == 'j':
                i += 1
                continue
            ipa.append('h')
            i += 1
            continue

        if c == 'j':
            ipa.append('j')
            i += 1
            continue

        if c == 'k':
            # k before front vowels → [ɕ]
            if i + 1 < n and w[i+1] in 'eiyäö':
                ipa.append('ɕ')
            else:
                ipa.append('k')
            i += 1
            continue

        if c == 'l':
            ipa.append('l')
            i += 1
            continue

        if c == 'm':
            ipa.append('m')
            i += 1
            continue

        if c == 'n':
            ipa.append('n')
            i += 1
            continue

        if c == 'p':
            ipa.append('p')
            i += 1
            continue

        if c == 'q':
            ipa.append('k')
            i += 1
            continue

        if c == 'r':
            # rs → [ʂ] (retroflex)
            if i + 1 < n and w[i+1] == 's':
                ipa.append('ʂ')
                i += 2
                continue
            # rt → [ʈ]
            if i + 1 < n and w[i+1] == 't':
                ipa.append('ʈ')
                i += 2
                continue
            # rn → [ɳ]
            if i + 1 < n and w[i+1] == 'n':
                ipa.append('ɳ')
                i += 2
                continue
            # rl → [ɭ]
            if i + 1 < n and w[i+1] == 'l':
                ipa.append('ɭ')
                i += 2
                continue
            # rd → [ɖ]
            if i + 1 < n and w[i+1] == 'd':
                ipa.append('ɖ')
                i += 2
                continue
            ipa.append('r')
            i += 1
            continue

        if c == 's':
            ipa.append('s')
            i += 1
            continue

        if c == 't':
            # tion → [ɧuːn]
            if i + 3 < n and w[i:i+4] == 'tion':
                ipa.append('ɧuːn')
                i += 4
                continue
            ipa.append('t')
            i += 1
            continue

        if c == 'v':
            ipa.append('v')
            i += 1
            continue

        if c == 'w':
            ipa.append('v')
            i += 1
            continue

        if c == 'x':
            ipa.append('ks')
            i += 1
            continue

        if c == 'z':
            ipa.append('s')
            i += 1
            continue

        # Default: skip unknown
        i += 1

    return ''.join(ipa)


# ─── POS detection ─────────────────────────────────────────────
def detect_pos(word, english):
    """Simple POS detection based on word form and English translation."""
    en = english.lower() if english else ''
    w = word.lower()

    # Verbs
    if en.startswith('to ') or w.endswith('ar') or w.endswith('er') and len(w) > 3:
        if w.endswith(('ar', 'er', 'or')) and len(w) > 3:
            return 'v'
    if w.endswith(('ade', 'ades', 'ades', 'at', 'ats')):
        return 'v'
    if en.startswith('to '):
        return 'v'

    # Common verb endings
    verb_endings = ('a', 'ar', 'er', 'de', 'te', 'ade', 'at', 'it', 'ades')

    # Adjectives
    adj_endings = ('ig', 'igt', 'iga', 'isk', 'iskt', 'iska', 'lig', 'ligt', 'liga', 'bar', 'bart', 'bara', 'sam', 'samt', 'samma', 'ös', 'öst', 'ösa', 'full', 'fullt', 'fulla')
    if w.endswith(adj_endings):
        return 'adj'
    if en in ('big', 'small', 'good', 'bad', 'new', 'old', 'long', 'short', 'hot', 'cold'):
        return 'adj'

    # Adverbs
    adv_words = {'aldrig', 'alltid', 'bara', 'dock', 'då', 'där', 'fortfarande', 'ganska', 'gärna', 'här', 'igen', 'inne', 'inte', 'just', 'kanske', 'mycket', 'nog', 'nu', 'också', 'ofta', 'redan', 'riktigt', 'rätt', 'sedan', 'snart', 'ute', 'verkligen', 'väldigt', 'ännu'}
    if w in adv_words:
        return 'adv'

    # Prepositions
    prep_words = {'av', 'bakom', 'bland', 'bredvid', 'efter', 'enligt', 'framför', 'från', 'för', 'genom', 'hos', 'i', 'ifrån', 'igenom', 'inom', 'inför', 'längs', 'med', 'mellan', 'mot', 'med', 'ner', 'om', 'omkring', 'på', 'runt', 'sedan', 'till', 'trots', 'under', 'upp', 'ur', 'utan', 'utanför', 'utmed', 'vid', 'åt', 'över'}
    if w in prep_words:
        return 'prep'

    # Conjunctions
    conj_words = {'att', 'eller', 'fast', 'för', 'ifall', 'innan', 'men', 'när', 'och', 'om', 'samt', 'så', 'utan'}
    if w in conj_words:
        return 'conj'

    # Pronouns
    pron_words = {'jag', 'du', 'han', 'hon', 'den', 'det', 'vi', 'ni', 'de', 'dom', 'mig', 'dig', 'sig', 'oss', 'er', 'dem', 'min', 'mitt', 'mina', 'din', 'ditt', 'dina', 'sin', 'sitt', 'sina', 'hans', 'hennes', 'dess', 'vår', 'vårt', 'våra', 'er', 'ert', 'era', 'deras', 'man', 'en', 'ens', 'vars', 'vilken', 'vilket', 'vilka', 'vem', 'vad', 'som', 'sig', 'denna', 'detta', 'dessa', 'ingen', 'inget', 'inga', 'någon', 'något', 'några', 'alla', 'allt', 'var', 'varje', 'annan', 'annat', 'andra'}
    if w in pron_words:
        return 'pron'

    # Determiners
    det_words = {'en', 'ett', 'den', 'det', 'de', 'denna', 'detta', 'dessa'}
    if w in det_words:
        return 'det'

    # Numbers
    num_words = {'en', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton', 'tjugo', 'trettio', 'fyrtio', 'femtio', 'sextio', 'sjuttio', 'åttio', 'nittio', 'hundra', 'tusen', 'första', 'andra', 'tredje', 'fjärde', 'femte'}
    if w in num_words:
        return 'num'

    # Interjections
    interj_words = {'aj', 'hej', 'hejdå', 'javisst', 'ja', 'nej', 'oj', 'tack', 'tjena', 'varsågod', 'grattis', 'skål', 'hallå', 'hurra', 'usch'}
    if w in interj_words:
        return 'interj'

    # Default: noun (most common POS)
    return 'n'


# ─── Swedish word → English translation ───────────────────────
# Comprehensive Swedish vocabulary with translations
TRANSLATIONS = {
    # ── Pronouns ──
    'jag': 'I', 'du': 'you', 'han': 'he', 'hon': 'she', 'den': 'it (en-words)',
    'det': 'it (ett-words)', 'vi': 'we', 'ni': 'you (plural)', 'de': 'they',
    'dom': 'they (informal)', 'mig': 'me', 'dig': 'you (obj)', 'sig': 'oneself',
    'oss': 'us', 'dem': 'them', 'min': 'my (en)', 'mitt': 'my (ett)',
    'mina': 'my (pl)', 'din': 'your (en)', 'ditt': 'your (ett)',
    'dina': 'your (pl)', 'sin': 'his/her own (en)', 'sitt': 'his/her own (ett)',
    'sina': 'his/her own (pl)', 'hans': 'his', 'hennes': 'her',
    'vår': 'our (en)', 'vårt': 'our (ett)', 'våra': 'our (pl)',
    'era': 'your (pl, pl)', 'deras': 'their', 'man': 'one/you (generic)',
    'vars': 'whose', 'vilken': 'which (en)', 'vilket': 'which (ett)',
    'vilka': 'which (pl)', 'vem': 'who', 'vad': 'what',
    'som': 'who/which/that', 'denna': 'this (en)', 'detta': 'this (ett)',
    'dessa': 'these', 'ingen': 'no one/none (en)', 'inget': 'nothing (ett)',
    'inga': 'no (pl)', 'någon': 'someone (en)', 'något': 'something (ett)',
    'några': 'some (pl)', 'alla': 'all/everyone', 'allt': 'everything',
    'var': 'each', 'varje': 'every', 'annan': 'other (en)',
    'annat': 'other (ett)', 'andra': 'others/second',

    # ── Articles / Determiners ──
    'en': 'a/an (en-word)', 'ett': 'a/an (ett-word)',

    # ── Common verbs (infinitive) ──
    'vara': 'to be', 'ha': 'to have', 'bli': 'to become', 'göra': 'to do/make',
    'gå': 'to go/walk', 'komma': 'to come', 'kunna': 'can/be able to',
    'ska': 'shall/will', 'vilja': 'to want', 'se': 'to see',
    'säga': 'to say', 'ta': 'to take', 'ge': 'to give', 'stå': 'to stand',
    'finnas': 'to exist', 'få': 'to get/may', 'veta': 'to know (fact)',
    'tro': 'to believe', 'tänka': 'to think', 'heta': 'to be called',
    'äta': 'to eat', 'dricka': 'to drink', 'sova': 'to sleep',
    'leva': 'to live', 'bo': 'to live/reside', 'arbeta': 'to work',
    'jobba': 'to work (informal)', 'studera': 'to study', 'lära': 'to teach/learn',
    'läsa': 'to read', 'skriva': 'to write', 'tala': 'to speak',
    'prata': 'to talk', 'höra': 'to hear', 'lyssna': 'to listen',
    'titta': 'to look/watch', 'köpa': 'to buy', 'sälja': 'to sell',
    'betala': 'to pay', 'kosta': 'to cost', 'öppna': 'to open',
    'stänga': 'to close', 'börja': 'to begin', 'sluta': 'to end/stop',
    'behöva': 'to need', 'hjälpa': 'to help', 'förstå': 'to understand',
    'älska': 'to love', 'tycka': 'to think/feel', 'gilla': 'to like',
    'hata': 'to hate', 'springa': 'to run', 'simma': 'to swim',
    'cykla': 'to cycle', 'köra': 'to drive', 'flyga': 'to fly',
    'resa': 'to travel', 'besöka': 'to visit', 'laga': 'to cook/fix',
    'baka': 'to bake', 'handla': 'to shop', 'ringa': 'to call/ring',
    'skicka': 'to send', 'hämta': 'to fetch/pick up', 'lämna': 'to leave',
    'stanna': 'to stay/stop', 'vänta': 'to wait', 'möta': 'to meet',
    'träffa': 'to meet (person)', 'fira': 'to celebrate', 'sjunga': 'to sing',
    'dansa': 'to dance', 'spela': 'to play', 'leka': 'to play (children)',
    'måla': 'to paint', 'rita': 'to draw', 'bygga': 'to build',
    'flytta': 'to move', 'byta': 'to change/swap', 'välja': 'to choose',
    'försöka': 'to try', 'lyckas': 'to succeed', 'misslyckas': 'to fail',
    'hoppas': 'to hope', 'drömma': 'to dream', 'vakna': 'to wake up',
    'somna': 'to fall asleep', 'klä': 'to dress', 'duscha': 'to shower',
    'borsta': 'to brush', 'tvätta': 'to wash', 'städa': 'to clean',
    'laga': 'to cook/repair', 'planera': 'to plan', 'bestämma': 'to decide',
    'förklara': 'to explain', 'berätta': 'to tell/narrate',
    'fråga': 'to ask', 'svara': 'to answer', 'visa': 'to show',
    'leda': 'to lead', 'följa': 'to follow', 'hålla': 'to hold',
    'bära': 'to carry/wear', 'lägga': 'to lay/put', 'sätta': 'to set/put',
    'ställa': 'to place (standing)', 'sitta': 'to sit', 'ligga': 'to lie down',
    'känna': 'to feel/know (person)', 'minnas': 'to remember',
    'glömma': 'to forget', 'brinna': 'to burn', 'frysa': 'to freeze',
    'regna': 'to rain', 'snöa': 'to snow', 'blåsa': 'to blow',
    'ändra': 'to change', 'utveckla': 'to develop',
    'använda': 'to use', 'fungera': 'to function/work',
    'passa': 'to suit/fit', 'kolla': 'to check', 'fixa': 'to fix',
    'oroa': 'to worry', 'lugna': 'to calm',
    'parkera': 'to park', 'tanka': 'to refuel', 'svänga': 'to turn',
    'korsa': 'to cross', 'promenera': 'to take a walk',
    'boka': 'to book', 'avboka': 'to cancel booking',
    'rekommendera': 'to recommend', 'föreslå': 'to suggest',
    'acceptera': 'to accept', 'neka': 'to refuse/deny',
    'bjuda': 'to invite/treat', 'tacka': 'to thank',
    'gratulera': 'to congratulate', 'presentera': 'to present/introduce',
    'diskutera': 'to discuss', 'argumentera': 'to argue',
    'klaga': 'to complain', 'ursäkta': 'to excuse',
    'lova': 'to promise', 'svära': 'to swear',
    'respektera': 'to respect', 'beundra': 'to admire',
    'påverka': 'to influence', 'bidra': 'to contribute',
    'skydda': 'to protect', 'rädda': 'to save/rescue',
    'söka': 'to search/apply', 'hitta': 'to find',
    'förlora': 'to lose', 'vinna': 'to win',
    'tävla': 'to compete', 'öva': 'to practice',
    'undervisa': 'to teach', 'utbilda': 'to educate',
    'anställa': 'to employ', 'avskeda': 'to fire/dismiss',
    'tjäna': 'to earn/serve', 'spara': 'to save (money)',
    'investera': 'to invest', 'låna': 'to borrow/lend',
    'hyra': 'to rent', 'äga': 'to own',
    'dela': 'to share/divide', 'samla': 'to collect',
    'ordna': 'to arrange/organize', 'sortera': 'to sort',
    'packa': 'to pack', 'landa': 'to land',
    'starta': 'to start', 'avsluta': 'to finish',
    'fortsätta': 'to continue', 'upprepa': 'to repeat',
    'översätta': 'to translate', 'uttala': 'to pronounce',
    'stava': 'to spell', 'betyda': 'to mean',
    'koppla': 'to connect', 'ladda': 'to charge/load',
    'trycka': 'to press/print', 'klicka': 'to click',
    'logga': 'to log', 'installera': 'to install',
    'registrera': 'to register', 'fylla': 'to fill',
    'hälla': 'to pour', 'blanda': 'to mix',
    'krydda': 'to season/spice', 'grilla': 'to grill',
    'steka': 'to fry', 'koka': 'to boil/cook',
    'servera': 'to serve', 'beställa': 'to order',
    'smaka': 'to taste', 'lukta': 'to smell',
    'röra': 'to touch/stir', 'skära': 'to cut',
    'bryta': 'to break', 'reparera': 'to repair',
    'måste': 'must', 'borde': 'should', 'behöver': 'need',
    'brukar': 'usually do', 'verkar': 'seem',
    'sakna': 'to miss', 'längta': 'to long for',
    'njuta': 'to enjoy', 'uppskatta': 'to appreciate',
    'undra': 'to wonder', 'anse': 'to consider',
    'märka': 'to notice', 'upptäcka': 'to discover',
    'skapa': 'to create', 'designa': 'to design',
    'producera': 'to produce', 'tillverka': 'to manufacture',
    'leverera': 'to deliver', 'transportera': 'to transport',
    'pendla': 'to commute', 'anlända': 'to arrive',
    'avgå': 'to depart', 'tåga': 'to march',
    'klättra': 'to climb', 'hoppa': 'to jump',
    'kasta': 'to throw', 'fånga': 'to catch',
    'jaga': 'to hunt/chase', 'fiska': 'to fish',
    'plocka': 'to pick', 'odla': 'to grow/cultivate',
    'plantera': 'to plant', 'vattna': 'to water',
    'klippa': 'to cut/trim', 'sy': 'to sew',
    'sticka': 'to knit/sting', 'måla': 'to paint',
    'fotografera': 'to photograph', 'filma': 'to film',
    'publicera': 'to publish', 'skriva': 'to write',
    'redigera': 'to edit', 'granska': 'to review',
    'godkänna': 'to approve', 'avslå': 'to reject',
    'protestera': 'to protest', 'demonstrera': 'to demonstrate',
    'rösta': 'to vote', 'välja': 'to elect/choose',
    'styra': 'to govern/steer', 'leda': 'to lead',
    'representera': 'to represent', 'förhandla': 'to negotiate',
    'kompromissa': 'to compromise', 'samarbeta': 'to collaborate',
    'konkurrera': 'to compete', 'dominera': 'to dominate',
    'existera': 'to exist', 'överleva': 'to survive',
    'dö': 'to die', 'födas': 'to be born',
    'växa': 'to grow', 'åldras': 'to age',
    'mogna': 'to mature', 'blomma': 'to bloom/flower',
    'vissna': 'to wilt', 'ruttna': 'to rot',
    'smälta': 'to melt', 'torka': 'to dry',
    'lysa': 'to shine', 'glimma': 'to glimmer',
    'skina': 'to shine (sun)', 'glänsa': 'to gleam',
    'minska': 'to decrease', 'öka': 'to increase',
    'förbättra': 'to improve', 'försämra': 'to worsen',
    'förändra': 'to change/transform', 'anpassa': 'to adapt',
    'integrera': 'to integrate', 'separera': 'to separate',
    'kombinera': 'to combine', 'jämföra': 'to compare',
    'analysera': 'to analyze', 'utvärdera': 'to evaluate',
    'betygsätta': 'to grade', 'mäta': 'to measure',
    'väga': 'to weigh', 'räkna': 'to count/calculate',
    'addera': 'to add', 'subtrahera': 'to subtract',
    'multiplicera': 'to multiply', 'dividera': 'to divide',
    'lösa': 'to solve', 'bevisa': 'to prove',
    'anta': 'to assume/adopt', 'gissa': 'to guess',
    'föreställa': 'to imagine', 'fantisera': 'to fantasize',
    'inspirera': 'to inspire', 'motivera': 'to motivate',
    'uppmuntra': 'to encourage', 'trösta': 'to comfort',
    'stödja': 'to support', 'hjälpa': 'to help',
    'rådgiva': 'to advise', 'varna': 'to warn',
    'hota': 'to threaten', 'skrämma': 'to scare',
    'lugna': 'to calm', 'slappna': 'to relax',
    'meditera': 'to meditate', 'andas': 'to breathe',
    'le': 'to smile', 'skratta': 'to laugh',
    'gråta': 'to cry', 'ropa': 'to shout',
    'viska': 'to whisper', 'sjunga': 'to sing',
    'humma': 'to hum', 'vissla': 'to whistle',
    'klappa': 'to clap/pat', 'krama': 'to hug',
    'kyssa': 'to kiss', 'vinka': 'to wave',
    'nicka': 'to nod', 'skaka': 'to shake',
    'peka': 'to point', 'sträcka': 'to stretch',
    'böja': 'to bend', 'vrida': 'to twist',
    'dra': 'to pull/draw', 'trycka': 'to push/press',
    'slå': 'to hit/strike', 'sparka': 'to kick',
    'dyka': 'to dive', 'flyta': 'to float',
    'segla': 'to sail', 'ro': 'to row',
    'åka': 'to go/ride', 'landa': 'to land',
    'lyfta': 'to lift', 'sänka': 'to lower',
    'öppna': 'to open', 'stänga': 'to close',
    'låsa': 'to lock', 'knacka': 'to knock',
    'ringa': 'to ring/call', 'svara': 'to answer',
    'agera': 'to act', 'reagera': 'to react',
    'påverka': 'to affect', 'orsaka': 'to cause',
    'förhindra': 'to prevent', 'tillåta': 'to allow',
    'förbjuda': 'to forbid', 'kräva': 'to demand',
    'erbjuda': 'to offer', 'förse': 'to provide',
    'leverera': 'to deliver', 'distribuera': 'to distribute',
    'konsumera': 'to consume', 'slösa': 'to waste',
    'återvinna': 'to recycle', 'bevara': 'to preserve',
    'förstöra': 'to destroy', 'bygga': 'to build',
    'renovera': 'to renovate', 'inreda': 'to furnish',
    'dekorera': 'to decorate', 'måla': 'to paint',
    'tapetsera': 'to wallpaper', 'installera': 'to install',
    'montera': 'to assemble', 'demontera': 'to disassemble',

    # ── Verb forms (present, past, etc.) ──
    'är': 'is/am/are', 'var': 'was/were', 'varit': 'been',
    'har': 'have/has', 'hade': 'had', 'haft': 'had (supine)',
    'blir': 'becomes', 'blev': 'became', 'blivit': 'become (supine)',
    'gör': 'does/makes', 'gjorde': 'did/made', 'gjort': 'done/made',
    'går': 'goes/walks', 'gick': 'went', 'gått': 'gone',
    'kommer': 'comes', 'kom': 'came', 'kommit': 'come (supine)',
    'kan': 'can', 'kunde': 'could', 'kunnat': 'been able',
    'vill': 'want(s)', 'ville': 'wanted', 'velat': 'wanted (supine)',
    'ser': 'sees', 'såg': 'saw', 'sett': 'seen',
    'säger': 'says', 'sa': 'said', 'sade': 'said (formal)', 'sagt': 'said (supine)',
    'tar': 'takes', 'tog': 'took', 'tagit': 'taken',
    'ger': 'gives', 'gav': 'gave', 'gett': 'given', 'givit': 'given (supine)',
    'står': 'stands', 'stod': 'stood', 'stått': 'stood (supine)',
    'finns': 'exists/there is', 'fanns': 'existed/there was', 'funnits': 'existed (supine)',
    'vet': 'know(s)', 'visste': 'knew', 'vetat': 'known',
    'tror': 'believes', 'trodde': 'believed', 'trott': 'believed (supine)',
    'tänker': 'thinks', 'tänkte': 'thought', 'tänkt': 'thought (supine)',
    'äter': 'eats', 'åt': 'ate', 'ätit': 'eaten',
    'dricker': 'drinks', 'drack': 'drank', 'druckit': 'drunk (supine)',
    'sover': 'sleeps', 'sov': 'slept', 'sovit': 'slept (supine)',
    'skriver': 'writes', 'skrev': 'wrote', 'skrivit': 'written',
    'läser': 'reads', 'läste': 'read (past)', 'läst': 'read (supine)',
    'köper': 'buys', 'köpte': 'bought', 'köpt': 'bought (supine)',
    'säljer': 'sells', 'sålde': 'sold', 'sålt': 'sold (supine)',
    'springer': 'runs', 'sprang': 'ran', 'sprungit': 'run (supine)',
    'sitter': 'sits', 'satt': 'sat',
    'ligger': 'lies (down)', 'låg': 'lay', 'legat': 'lain',
    'håller': 'holds', 'höll': 'held', 'hållit': 'held (supine)',
    'bär': 'carries/wears', 'bar': 'carried', 'burit': 'carried (supine)',
    'dör': 'dies', 'dog': 'died', 'dött': 'died (supine)',
    'sjunger': 'sings', 'sjöng': 'sang', 'sjungit': 'sung',
    'slår': 'hits', 'slog': 'hit (past)', 'slagit': 'hit (supine)',
    'brinner': 'burns', 'brann': 'burned', 'brunnit': 'burned (supine)',
    'fryser': 'freezes', 'frös': 'froze', 'frusit': 'frozen',
    'bryter': 'breaks', 'bröt': 'broke', 'brutit': 'broken',
    'flyger': 'flies', 'flög': 'flew', 'flugit': 'flown',
    'drar': 'pulls', 'drog': 'pulled', 'dragit': 'pulled (supine)',
    'lägger': 'puts (down)', 'lade': 'put (past)', 'lagt': 'put (supine)',
    'sätter': 'puts/sets', 'satte': 'put (past)',
    'ställer': 'places', 'ställde': 'placed', 'ställt': 'placed (supine)',
    'känner': 'feels/knows', 'kände': 'felt', 'känt': 'felt (supine)',
    'glömmer': 'forgets', 'glömde': 'forgot', 'glömt': 'forgotten',
    'väljer': 'chooses', 'valde': 'chose', 'valt': 'chosen',
    'försvinner': 'disappears', 'försvann': 'disappeared', 'försvunnit': 'disappeared',
    'hinner': 'has time', 'hann': 'had time', 'hunnit': 'had time (supine)',
    'bjuder': 'invites', 'bjöd': 'invited', 'bjudit': 'invited (supine)',
    'ljuger': 'lies', 'ljög': 'lied', 'ljugit': 'lied (supine)',
    'vinner': 'wins', 'vann': 'won', 'vunnit': 'won (supine)',
    'växter': 'grows', 'växte': 'grew', 'växt': 'grown',
    'biter': 'bites', 'bet': 'bit', 'bitit': 'bitten',
    'griper': 'grabs', 'grep': 'grabbed', 'gripit': 'grabbed (supine)',

    # ── Group 1 verb forms (-ar present) ──
    'talar': 'speaks', 'talade': 'spoke', 'talat': 'spoken',
    'pratar': 'talks', 'pratade': 'talked', 'pratat': 'talked (supine)',
    'jobbar': 'works', 'jobbade': 'worked', 'jobbat': 'worked (supine)',
    'arbetar': 'works', 'arbetade': 'worked', 'arbetat': 'worked (supine)',
    'studerar': 'studies', 'studerade': 'studied', 'studerat': 'studied (supine)',
    'öppnar': 'opens', 'öppnade': 'opened', 'öppnat': 'opened (supine)',
    'stänger': 'closes', 'stängde': 'closed', 'stängt': 'closed (supine)',
    'börjar': 'begins', 'började': 'began', 'börjat': 'begun',
    'slutar': 'ends', 'slutade': 'ended', 'slutat': 'ended (supine)',
    'tycker': 'thinks/feels', 'tyckte': 'thought', 'tyckt': 'thought (supine)',
    'gillar': 'likes', 'gillade': 'liked', 'gillat': 'liked (supine)',
    'älskar': 'loves', 'älskade': 'loved', 'älskat': 'loved (supine)',
    'hatar': 'hates', 'hatade': 'hated', 'hatat': 'hated (supine)',
    'behöver': 'needs', 'behövde': 'needed', 'behövt': 'needed (supine)',
    'hjälper': 'helps', 'hjälpte': 'helped', 'hjälpt': 'helped (supine)',
    'förstår': 'understands', 'förstod': 'understood', 'förstått': 'understood',
    'simmar': 'swims', 'simmade': 'swam', 'simmat': 'swum',
    'cyklar': 'cycles', 'cyklade': 'cycled', 'cyklat': 'cycled (supine)',
    'reser': 'travels', 'reste': 'traveled', 'rest': 'traveled (supine)',
    'besöker': 'visits', 'besökte': 'visited', 'besökt': 'visited (supine)',
    'lagar': 'cooks/fixes', 'lagade': 'cooked', 'lagat': 'cooked (supine)',
    'bakar': 'bakes', 'bakade': 'baked', 'bakat': 'baked (supine)',
    'handlar': 'shops', 'handlade': 'shopped', 'handlat': 'shopped (supine)',
    'ringer': 'calls', 'ringde': 'called', 'ringt': 'called (supine)',
    'skickar': 'sends', 'skickade': 'sent', 'skickat': 'sent (supine)',
    'hämtar': 'fetches', 'hämtade': 'fetched', 'hämtat': 'fetched (supine)',
    'lämnar': 'leaves', 'lämnade': 'left', 'lämnat': 'left (supine)',
    'stannar': 'stays', 'stannade': 'stayed', 'stannat': 'stayed (supine)',
    'väntar': 'waits', 'väntade': 'waited', 'väntat': 'waited (supine)',
    'möter': 'meets', 'mötte': 'met', 'mött': 'met (supine)',
    'träffar': 'meets', 'träffade': 'met', 'träffat': 'met (supine)',
    'firar': 'celebrates', 'firade': 'celebrated', 'firat': 'celebrated (supine)',
    'dansar': 'dances', 'dansade': 'danced', 'dansat': 'danced (supine)',
    'spelar': 'plays', 'spelade': 'played', 'spelat': 'played (supine)',
    'målar': 'paints', 'målade': 'painted', 'målat': 'painted (supine)',
    'bygger': 'builds', 'byggde': 'built', 'byggt': 'built (supine)',
    'flyttar': 'moves', 'flyttade': 'moved', 'flyttat': 'moved (supine)',
    'byter': 'changes', 'bytte': 'changed', 'bytt': 'changed (supine)',
    'vaknar': 'wakes up', 'vaknade': 'woke up', 'vaknat': 'woken up',
    'somnar': 'falls asleep', 'somnade': 'fell asleep', 'somnat': 'fallen asleep',
    'tvättar': 'washes', 'tvättade': 'washed', 'tvättat': 'washed (supine)',
    'städar': 'cleans', 'städade': 'cleaned', 'städat': 'cleaned (supine)',
    'planerar': 'plans', 'planerade': 'planned', 'planerat': 'planned (supine)',
    'bestämmer': 'decides', 'bestämde': 'decided', 'bestämt': 'decided (supine)',
    'förklarar': 'explains', 'förklarade': 'explained', 'förklarat': 'explained',
    'berättar': 'tells', 'berättade': 'told', 'berättat': 'told (supine)',
    'frågar': 'asks', 'frågade': 'asked', 'frågat': 'asked (supine)',
    'svarar': 'answers', 'svarade': 'answered', 'svarat': 'answered (supine)',
    'visar': 'shows', 'visade': 'showed', 'visat': 'shown',
    'leder': 'leads', 'ledde': 'led', 'lett': 'led (supine)',
    'följer': 'follows', 'följde': 'followed', 'följt': 'followed (supine)',
    'använder': 'uses', 'använde': 'used', 'använt': 'used (supine)',
    'passar': 'fits/suits', 'passade': 'fitted', 'passat': 'fitted (supine)',
    'kollar': 'checks', 'kollade': 'checked', 'kollat': 'checked (supine)',
    'fixar': 'fixes', 'fixade': 'fixed', 'fixat': 'fixed (supine)',
    'oroar': 'worries', 'oroade': 'worried', 'oroat': 'worried (supine)',
    'lugnar': 'calms', 'lugnade': 'calmed', 'lugnat': 'calmed (supine)',
    'parkerar': 'parks', 'parkerade': 'parked', 'parkerat': 'parked (supine)',
    'svänger': 'turns', 'svängde': 'turned', 'svängt': 'turned (supine)',
    'bokar': 'books', 'bokade': 'booked', 'bokat': 'booked (supine)',
    'beställer': 'orders', 'beställde': 'ordered', 'beställt': 'ordered (supine)',
    'smakar': 'tastes', 'smakade': 'tasted', 'smakat': 'tasted (supine)',
    'luktar': 'smells', 'luktade': 'smelled', 'luktat': 'smelled (supine)',
    'saknar': 'misses', 'saknade': 'missed', 'saknat': 'missed (supine)',
    'njuter': 'enjoys', 'njöt': 'enjoyed', 'njutit': 'enjoyed (supine)',
    'uppskattar': 'appreciates', 'uppskattade': 'appreciated', 'uppskattat': 'appreciated',
    'undrar': 'wonders', 'undrade': 'wondered', 'undrat': 'wondered (supine)',
    'märker': 'notices', 'märkte': 'noticed', 'märkt': 'noticed (supine)',
    'upptäcker': 'discovers', 'upptäckte': 'discovered', 'upptäckt': 'discovered',
    'skapar': 'creates', 'skapade': 'created', 'skapat': 'created (supine)',
    'söker': 'searches', 'sökte': 'searched', 'sökt': 'searched (supine)',
    'hittar': 'finds', 'hittade': 'found', 'hittat': 'found (supine)',
    'förlorar': 'loses', 'förlorade': 'lost', 'förlorat': 'lost (supine)',
    'övar': 'practices', 'övade': 'practiced', 'övat': 'practiced (supine)',
    'sparar': 'saves', 'sparade': 'saved', 'sparat': 'saved (supine)',
    'delar': 'shares', 'delade': 'shared', 'delat': 'shared (supine)',
    'samlar': 'collects', 'samlade': 'collected', 'samlat': 'collected (supine)',
    'ordnar': 'arranges', 'ordnade': 'arranged', 'ordnat': 'arranged (supine)',
    'packar': 'packs', 'packade': 'packed', 'packat': 'packed (supine)',
    'landar': 'lands', 'landade': 'landed', 'landat': 'landed (supine)',
    'startar': 'starts', 'startade': 'started', 'startat': 'started (supine)',
    'avslutar': 'finishes', 'avslutade': 'finished', 'avslutat': 'finished (supine)',
    'fortsätter': 'continues', 'fortsatte': 'continued', 'fortsatt': 'continued',
    'översätter': 'translates', 'översatte': 'translated', 'översatt': 'translated',
    'klättrar': 'climbs', 'klättrade': 'climbed', 'klättrat': 'climbed (supine)',
    'hoppar': 'jumps', 'hoppade': 'jumped', 'hoppat': 'jumped (supine)',
    'kastar': 'throws', 'kastade': 'threw', 'kastat': 'thrown',
    'ler': 'smiles', 'log': 'smiled', 'lett': 'smiled (supine)',
    'skrattar': 'laughs', 'skrattade': 'laughed', 'skrattat': 'laughed (supine)',
    'gråter': 'cries', 'grät': 'cried', 'gråtit': 'cried (supine)',
    'ropar': 'shouts', 'ropade': 'shouted', 'ropat': 'shouted (supine)',
    'kramar': 'hugs', 'kramade': 'hugged', 'kramat': 'hugged (supine)',
    'vinkar': 'waves', 'vinkade': 'waved', 'vinkat': 'waved (supine)',
    'pekar': 'points', 'pekade': 'pointed', 'pekat': 'pointed (supine)',
    'sträcker': 'stretches', 'sträckte': 'stretched', 'sträckt': 'stretched',
    'trycker': 'presses', 'tryckte': 'pressed', 'tryckt': 'pressed (supine)',
    'körer': 'drives', 'körde': 'drove', 'kört': 'driven',
    'åker': 'goes/rides', 'åkte': 'went/rode', 'åkt': 'gone/ridden',
    'flyger': 'flies', 'flög': 'flew', 'flugit': 'flown (supine)',
    'regnar': 'rains', 'regnade': 'rained', 'regnat': 'rained (supine)',
    'snöar': 'snows', 'snöade': 'snowed', 'snöat': 'snowed (supine)',
    'blåser': 'blows', 'blåste': 'blew', 'blåst': 'blown',
    'ökar': 'increases', 'ökade': 'increased', 'ökat': 'increased (supine)',
    'minskar': 'decreases', 'minskade': 'decreased', 'minskat': 'decreased',
    'förbättrar': 'improves', 'förbättrade': 'improved', 'förbättrat': 'improved',
    'förändrar': 'changes', 'förändrade': 'changed', 'förändrat': 'changed',
    'räknar': 'counts', 'räknade': 'counted', 'räknat': 'counted (supine)',
    'mäter': 'measures', 'mätte': 'measured', 'mätt': 'measured (supine)',
    'löser': 'solves', 'löste': 'solved', 'löst': 'solved (supine)',

    # ── Nouns ──
    'hund': 'dog', 'katt': 'cat', 'hus': 'house', 'bil': 'car',
    'bok': 'book', 'dag': 'day', 'natt': 'night', 'tid': 'time',
    'år': 'year', 'månad': 'month', 'vecka': 'week', 'timme': 'hour',
    'minut': 'minute', 'sekund': 'second', 'morgon': 'morning',
    'kväll': 'evening', 'middag': 'lunch/dinner', 'mat': 'food',
    'vatten': 'water', 'kaffe': 'coffee', 'te': 'tea', 'mjölk': 'milk',
    'bröd': 'bread', 'ost': 'cheese', 'smör': 'butter', 'frukt': 'fruit',
    'grönsak': 'vegetable', 'kött': 'meat', 'fisk': 'fish',
    'äpple': 'apple', 'barn': 'child/children', 'familj': 'family',
    'mamma': 'mom', 'pappa': 'dad', 'bror': 'brother', 'syster': 'sister',
    'farfar': 'grandfather (paternal)', 'farmor': 'grandmother (paternal)',
    'morfar': 'grandfather (maternal)', 'mormor': 'grandmother (maternal)',
    'man': 'man/husband', 'kvinna': 'woman', 'flicka': 'girl',
    'pojke': 'boy', 'vän': 'friend', 'granne': 'neighbor',
    'lärare': 'teacher', 'elev': 'student', 'läkare': 'doctor',
    'sjuksköterska': 'nurse', 'chef': 'boss/chef', 'kollega': 'colleague',
    'land': 'country', 'stad': 'city', 'by': 'village',
    'gata': 'street', 'väg': 'road/way', 'bro': 'bridge',
    'park': 'park', 'skog': 'forest', 'sjö': 'lake', 'hav': 'sea',
    'berg': 'mountain', 'strand': 'beach', 'ö': 'island',
    'sol': 'sun', 'måne': 'moon', 'stjärna': 'star',
    'himmel': 'sky/heaven', 'moln': 'cloud', 'regn': 'rain',
    'snö': 'snow', 'vind': 'wind', 'väder': 'weather',
    'sommar': 'summer', 'vinter': 'winter', 'vår': 'spring',
    'höst': 'autumn', 'jul': 'Christmas', 'påsk': 'Easter',
    'midsommar': 'Midsummer', 'lucia': 'Lucia',
    'skola': 'school', 'universitet': 'university', 'sjukhus': 'hospital',
    'apotek': 'pharmacy', 'bibliotek': 'library', 'museum': 'museum',
    'kyrka': 'church', 'restaurang': 'restaurant', 'hotell': 'hotel',
    'flygplats': 'airport', 'station': 'station', 'affär': 'shop/store',
    'butik': 'shop/boutique', 'marknad': 'market',
    'pengar': 'money', 'pris': 'price', 'krona': 'crown (SEK)',
    'jobb': 'job', 'arbete': 'work', 'möte': 'meeting',
    'kontor': 'office', 'företag': 'company', 'projekt': 'project',
    'dator': 'computer', 'telefon': 'telephone', 'mobil': 'mobile phone',
    'e-post': 'email', 'internet': 'internet', 'program': 'program',
    'musik': 'music', 'film': 'film/movie', 'teater': 'theater',
    'konst': 'art', 'sport': 'sport', 'fotboll': 'football/soccer',
    'ishockey': 'ice hockey', 'gym': 'gym', 'träning': 'training',
    'hälsa': 'health', 'kropp': 'body', 'huvud': 'head',
    'hjärta': 'heart', 'hand': 'hand', 'fot': 'foot',
    'öga': 'eye', 'öra': 'ear', 'mun': 'mouth', 'näsa': 'nose',
    'tand': 'tooth', 'hår': 'hair', 'rygg': 'back',
    'mage': 'stomach', 'ben': 'leg/bone', 'arm': 'arm',
    'finger': 'finger', 'knä': 'knee', 'axel': 'shoulder',
    'rum': 'room', 'kök': 'kitchen', 'badrum': 'bathroom',
    'sovrum': 'bedroom', 'vardagsrum': 'living room',
    'trädgård': 'garden', 'balkong': 'balcony', 'tak': 'roof',
    'golv': 'floor', 'vägg': 'wall', 'dörr': 'door',
    'fönster': 'window', 'trappa': 'stairs', 'hiss': 'elevator',
    'stol': 'chair', 'bord': 'table', 'säng': 'bed',
    'soffa': 'sofa', 'lampa': 'lamp', 'spegel': 'mirror',
    'gardin': 'curtain', 'matta': 'carpet/rug',
    'nyhet': 'news', 'tidning': 'newspaper', 'brev': 'letter',
    'paket': 'package', 'present': 'gift',
    'färg': 'color', 'form': 'shape', 'storlek': 'size',
    'vikt': 'weight', 'längd': 'length', 'bredd': 'width',
    'höjd': 'height', 'avstånd': 'distance',
    'fråga': 'question', 'svar': 'answer', 'problem': 'problem',
    'lösning': 'solution', 'idé': 'idea', 'plan': 'plan',
    'mål': 'goal', 'resultat': 'result', 'framgång': 'success',
    'fel': 'error/fault', 'misstag': 'mistake',
    'orsak': 'cause/reason', 'anledning': 'reason',
    'möjlighet': 'possibility', 'chans': 'chance',
    'val': 'choice/election', 'beslut': 'decision',
    'åsikt': 'opinion', 'känsla': 'feeling',
    'glädje': 'joy', 'sorg': 'grief/sorrow',
    'rädsla': 'fear', 'hopp': 'hope', 'kärlek': 'love',
    'fred': 'peace', 'krig': 'war', 'frihet': 'freedom',
    'rättvisa': 'justice', 'lag': 'law', 'regel': 'rule',
    'kultur': 'culture', 'tradition': 'tradition',
    'historia': 'history', 'framtid': 'future',
    'natur': 'nature', 'miljö': 'environment',
    'energi': 'energy', 'teknik': 'technology',
    'vetenskap': 'science', 'forskning': 'research',
    'utbildning': 'education', 'kunskap': 'knowledge',
    'erfarenhet': 'experience', 'information': 'information',
    'samhälle': 'society', 'befolkning': 'population',
    'regering': 'government', 'politik': 'politics',
    'ekonomi': 'economy', 'industri': 'industry',
    'handel': 'trade/commerce', 'turism': 'tourism',
    'trafik': 'traffic', 'transport': 'transport',
    'flyg': 'flight/aviation', 'tåg': 'train',
    'buss': 'bus', 'tunnelbana': 'subway/metro',
    'spårvagn': 'tram', 'färja': 'ferry',
    'cykel': 'bicycle', 'promenad': 'walk',
    'resa': 'trip/journey', 'semester': 'vacation',
    'äventyr': 'adventure', 'upplevelse': 'experience',
    'recept': 'recipe/prescription', 'ingrediens': 'ingredient',
    'rätt': 'dish/right', 'soppa': 'soup', 'sallad': 'salad',
    'dessert': 'dessert', 'glass': 'ice cream',
    'kaka': 'cake/cookie', 'choklad': 'chocolate',
    'godis': 'candy/sweets', 'juice': 'juice',
    'öl': 'beer', 'vin': 'wine', 'läsk': 'soda',
    'kopp': 'cup', 'glas': 'glass', 'tallrik': 'plate',
    'sked': 'spoon', 'gaffel': 'fork', 'kniv': 'knife',
    'skål': 'bowl/cheers', 'flaska': 'bottle',
    'väska': 'bag', 'ryggsäck': 'backpack',
    'nyckel': 'key', 'plånbok': 'wallet',
    'klocka': 'clock/watch', 'ring': 'ring',
    'halsband': 'necklace', 'örhänge': 'earring',
    'glasögon': 'glasses', 'paraply': 'umbrella',
    'jacka': 'jacket', 'byxor': 'pants/trousers',
    'kjol': 'skirt', 'klänning': 'dress',
    'skjorta': 'shirt', 'tröja': 'sweater/shirt',
    'sko': 'shoe', 'stövel': 'boot',
    'mössa': 'hat/beanie', 'vantar': 'mittens',
    'halsduk': 'scarf', 'strumpor': 'socks',
    'blomma': 'flower', 'träd': 'tree', 'blad': 'leaf',
    'ros': 'rose', 'gräs': 'grass',
    'djur': 'animal', 'fågel': 'bird', 'häst': 'horse',
    'ko': 'cow', 'gris': 'pig', 'lamm': 'lamb',
    'kanin': 'rabbit', 'älg': 'moose/elk',
    'björn': 'bear', 'varg': 'wolf', 'räv': 'fox',
    'ekorre': 'squirrel', 'uggla': 'owl',

    # ── Common Swedish culture words ──
    'fika': 'coffee break', 'lagom': 'just right/moderate',
    'smörgåsbord': 'buffet spread', 'kanelbulle': 'cinnamon bun',
    'allemansrätten': 'right of public access', 'stuga': 'cottage/cabin',
    'midsommarstång': 'maypole', 'kräftskiva': 'crayfish party',
    'lussekatt': 'saffron bun', 'glögg': 'mulled wine',
    'julbord': 'Christmas buffet', 'surströmming': 'fermented herring',
    'köttbullar': 'meatballs', 'lingon': 'lingonberry',
    'knäckebröd': 'crispbread', 'smörgås': 'sandwich',
    'dalahäst': 'Dala horse', 'folkdräkt': 'folk costume',
    'bastu': 'sauna', 'systembolaget': 'state liquor store',

    # ── Adjectives ──
    'stor': 'big', 'liten': 'small', 'bra': 'good', 'dålig': 'bad',
    'ny': 'new', 'gammal': 'old', 'lång': 'long/tall', 'kort': 'short',
    'hög': 'high/tall', 'låg': 'low', 'bred': 'wide', 'smal': 'narrow',
    'tjock': 'thick/fat', 'tunn': 'thin', 'tung': 'heavy', 'lätt': 'light/easy',
    'snabb': 'fast', 'långsam': 'slow', 'varm': 'warm', 'kall': 'cold',
    'het': 'hot', 'sval': 'cool', 'torr': 'dry', 'våt': 'wet',
    'ren': 'clean', 'smutsig': 'dirty', 'rik': 'rich', 'fattig': 'poor',
    'glad': 'happy', 'ledsen': 'sad', 'arg': 'angry', 'rädd': 'afraid/scared',
    'trött': 'tired', 'sjuk': 'sick', 'frisk': 'healthy',
    'stark': 'strong', 'svag': 'weak', 'ung': 'young',
    'vacker': 'beautiful', 'ful': 'ugly', 'fin': 'nice/fine',
    'rolig': 'funny/fun', 'tråkig': 'boring', 'intressant': 'interesting',
    'viktig': 'important', 'svår': 'difficult', 'enkel': 'simple/easy',
    'möjlig': 'possible', 'omöjlig': 'impossible',
    'vanlig': 'common/usual', 'ovanlig': 'unusual/uncommon',
    'sann': 'true', 'falsk': 'false', 'säker': 'safe/sure',
    'farlig': 'dangerous', 'öppen': 'open', 'stängd': 'closed',
    'full': 'full/drunk', 'tom': 'empty', 'hel': 'whole',
    'halv': 'half', 'dubbel': 'double', 'ensam': 'alone/lonely',
    'gift': 'married', 'skild': 'divorced', 'gravid': 'pregnant',
    'hungrig': 'hungry', 'törstig': 'thirsty', 'mätt': 'full (after eating)',
    'nöjd': 'satisfied', 'besviken': 'disappointed',
    'förväntansfull': 'expectant', 'nervös': 'nervous',
    'lugn': 'calm', 'stressad': 'stressed', 'avslappnad': 'relaxed',
    'snäll': 'kind/nice', 'elak': 'mean/nasty',
    'artig': 'polite', 'oartig': 'rude',
    'tyst': 'quiet', 'högljudd': 'loud',
    'mörk': 'dark', 'ljus': 'light/bright',
    'vit': 'white', 'svart': 'black', 'röd': 'red',
    'blå': 'blue', 'grön': 'green', 'gul': 'yellow',
    'orange': 'orange', 'brun': 'brown', 'grå': 'gray',
    'rosa': 'pink', 'lila': 'purple',
    'svensk': 'Swedish', 'norsk': 'Norwegian',
    'dansk': 'Danish', 'finsk': 'Finnish',
    'europeisk': 'European', 'amerikansk': 'American',
    'typisk': 'typical', 'traditionell': 'traditional',
    'modern': 'modern', 'klassisk': 'classic',
    'populär': 'popular', 'känd': 'famous/known',
    'egen': 'own', 'gemensam': 'common/shared',
    'privat': 'private', 'offentlig': 'public',
    'gratis': 'free (no cost)', 'billig': 'cheap',
    'dyr': 'expensive', 'prisvärd': 'affordable',
    'härlig': 'lovely/wonderful', 'underbar': 'wonderful',
    'fantastisk': 'fantastic', 'perfekt': 'perfect',
    'hemsk': 'terrible/awful', 'fruktansvärd': 'dreadful',
    'mysig': 'cozy', 'bekväm': 'comfortable',
    'tacksam': 'grateful', 'stolt': 'proud',
    'nyfiken': 'curious', 'kreativ': 'creative',
    'praktisk': 'practical', 'teoretisk': 'theoretical',
    'digital': 'digital', 'analog': 'analog',
    'hållbar': 'sustainable', 'ekologisk': 'ecological/organic',

    # ── Definite forms of common nouns ──
    'hunden': 'the dog', 'katten': 'the cat', 'huset': 'the house',
    'bilen': 'the car', 'boken': 'the book', 'dagen': 'the day',
    'natten': 'the night', 'tiden': 'the time', 'maten': 'the food',
    'vattnet': 'the water', 'kaffet': 'the coffee', 'barnet': 'the child',
    'barnen': 'the children', 'familjen': 'the family',
    'mannen': 'the man', 'kvinnan': 'the woman', 'flickan': 'the girl',
    'pojken': 'the boy', 'vännen': 'the friend', 'grannen': 'the neighbor',
    'läraren': 'the teacher', 'eleven': 'the student',
    'landet': 'the country', 'staden': 'the city',
    'gatan': 'the street', 'vägen': 'the road',
    'parken': 'the park', 'skogen': 'the forest',
    'sjön': 'the lake', 'havet': 'the sea', 'berget': 'the mountain',
    'stranden': 'the beach', 'solen': 'the sun',
    'himlen': 'the sky', 'molnet': 'the cloud',
    'sommaren': 'the summer', 'vintern': 'the winter',
    'våren': 'the spring', 'hösten': 'the autumn',
    'julen': 'Christmas (def)', 'skolan': 'the school',
    'universitetet': 'the university', 'sjukhuset': 'the hospital',
    'restaurangen': 'the restaurant', 'hotellet': 'the hotel',
    'flygplatsen': 'the airport', 'stationen': 'the station',
    'affären': 'the shop', 'butiken': 'the store',
    'pengarna': 'the money', 'priset': 'the price',
    'jobbet': 'the job', 'arbetet': 'the work',
    'mötet': 'the meeting', 'kontoret': 'the office',
    'företaget': 'the company', 'projektet': 'the project',
    'datorn': 'the computer', 'telefonen': 'the telephone',
    'musiken': 'the music', 'filmen': 'the film',
    'hälsan': 'the health', 'kroppen': 'the body',
    'huvudet': 'the head', 'hjärtat': 'the heart',
    'handen': 'the hand', 'foten': 'the foot',
    'ögat': 'the eye', 'örat': 'the ear',
    'munnen': 'the mouth', 'rummet': 'the room',
    'köket': 'the kitchen', 'badrummet': 'the bathroom',
    'sovrummet': 'the bedroom', 'vardagsrummet': 'the living room',
    'trädgården': 'the garden', 'taket': 'the roof',
    'golvet': 'the floor', 'väggen': 'the wall',
    'dörren': 'the door', 'fönstret': 'the window',
    'stolen': 'the chair', 'bordet': 'the table',
    'sängen': 'the bed', 'soffan': 'the sofa',
    'lampan': 'the lamp', 'nyheten': 'the news item',
    'tidningen': 'the newspaper', 'brevet': 'the letter',
    'presenten': 'the gift', 'frågan': 'the question',
    'svaret': 'the answer', 'problemet': 'the problem',
    'lösningen': 'the solution', 'idén': 'the idea',
    'planen': 'the plan', 'målet': 'the goal',
    'resultatet': 'the result', 'felet': 'the error',
    'resan': 'the trip', 'semestern': 'the vacation',
    'stugan': 'the cottage', 'kyrkan': 'the church',
    'tåget': 'the train', 'bussen': 'the bus',
    'cykeln': 'the bicycle', 'båten': 'the boat',
    'blodet': 'the blood', 'livet': 'the life',
    'döden': 'the death', 'drömmen': 'the dream',
    'verkligheten': 'the reality', 'sanningen': 'the truth',
    'historien': 'the history/story', 'framtiden': 'the future',
    'naturen': 'the nature', 'miljön': 'the environment',
    'samhället': 'the society', 'ekonomin': 'the economy',
    'regeringen': 'the government', 'lagen': 'the law',

    # ── Adverbs ──
    'inte': 'not', 'aldrig': 'never', 'alltid': 'always',
    'ofta': 'often', 'ibland': 'sometimes', 'sällan': 'seldom/rarely',
    'redan': 'already', 'fortfarande': 'still', 'snart': 'soon',
    'nu': 'now', 'då': 'then', 'här': 'here', 'där': 'there',
    'var': 'where', 'när': 'when', 'hur': 'how', 'varför': 'why',
    'mycket': 'very/much', 'lite': 'a little', 'ganska': 'quite/rather',
    'väldigt': 'very', 'verkligen': 'really', 'faktiskt': 'actually',
    'kanske': 'maybe/perhaps', 'nog': 'probably/enough',
    'bara': 'only/just', 'också': 'also/too', 'igen': 'again',
    'ännu': 'yet/still', 'ändå': 'still/anyway',
    'hem': 'home (direction)', 'hemma': 'at home',
    'ute': 'outside', 'inne': 'inside', 'uppe': 'up/upstairs',
    'nere': 'down/downstairs', 'borta': 'away/gone',
    'framme': 'arrived/there', 'tillbaka': 'back',
    'bort': 'away', 'fram': 'forward', 'ut': 'out',
    'in': 'in (direction)', 'upp': 'up', 'ner': 'down',
    'igår': 'yesterday', 'idag': 'today', 'imorgon': 'tomorrow',
    'just': 'just/exactly', 'precis': 'precisely/exactly',
    'ungefär': 'approximately', 'nästan': 'almost',
    'helt': 'completely', 'nästan': 'almost',
    'gärna': 'gladly/willingly', 'helst': 'preferably',
    'troligen': 'probably', 'tyvärr': 'unfortunately',
    'lyckligtvis': 'fortunately', 'förstås': 'of course',
    'naturligtvis': 'naturally', 'självklart': 'obviously',
    'definitivt': 'definitely', 'absolut': 'absolutely',
    'förmodligen': 'presumably', 'antagligen': 'probably',
    'genast': 'immediately', 'direkt': 'directly',
    'långsamt': 'slowly', 'snabbt': 'quickly',
    'tyst': 'quietly', 'högt': 'loudly/highly',
    'noga': 'carefully', 'annorlunda': 'differently',
    'tillsammans': 'together', 'ensam': 'alone',
    'utomhus': 'outdoors', 'inomhus': 'indoors',
    'plötsligt': 'suddenly', 'gradvis': 'gradually',
    'vanligtvis': 'usually', 'normalt': 'normally',
    'dessutom': 'moreover/besides', 'istället': 'instead',
    'iallafall': 'anyway', 'exempelvis': 'for example',

    # ── Prepositions ──
    'i': 'in', 'på': 'on/at', 'till': 'to', 'från': 'from',
    'av': 'of/by', 'med': 'with', 'utan': 'without',
    'för': 'for', 'om': 'about/if', 'efter': 'after',
    'före': 'before', 'under': 'under/during', 'över': 'over',
    'mellan': 'between', 'mot': 'towards/against',
    'vid': 'at/by', 'hos': 'at (someone\'s place)',
    'genom': 'through', 'bakom': 'behind', 'framför': 'in front of',
    'bredvid': 'beside/next to', 'utanför': 'outside of',
    'innanför': 'inside of', 'ovanför': 'above',
    'nedanför': 'below', 'runt': 'around',
    'längs': 'along', 'enligt': 'according to',
    'trots': 'despite', 'sedan': 'since/then',
    'inom': 'within', 'bland': 'among',

    # ── Conjunctions ──
    'och': 'and', 'eller': 'or', 'men': 'but',
    'att': 'that/to', 'som': 'which/who/that',
    'när': 'when', 'om': 'if/about', 'medan': 'while',
    'fast': 'although', 'även': 'even/also',
    'både': 'both', 'varken': 'neither',
    'antingen': 'either', 'så': 'so/then',
    'därför': 'therefore', 'eftersom': 'because/since',
    'innan': 'before (conj)', 'tills': 'until',
    'förrän': 'before (not until)',

    # ── Numbers ──
    'noll': 'zero', 'en': 'one', 'ett': 'one (ett)',
    'två': 'two', 'tre': 'three', 'fyra': 'four',
    'fem': 'five', 'sex': 'six', 'sju': 'seven',
    'åtta': 'eight', 'nio': 'nine', 'tio': 'ten',
    'elva': 'eleven', 'tolv': 'twelve',
    'tretton': 'thirteen', 'fjorton': 'fourteen',
    'femton': 'fifteen', 'sexton': 'sixteen',
    'sjutton': 'seventeen', 'arton': 'eighteen',
    'nitton': 'nineteen', 'tjugo': 'twenty',
    'trettio': 'thirty', 'fyrtio': 'forty',
    'femtio': 'fifty', 'sextio': 'sixty',
    'sjuttio': 'seventy', 'åttio': 'eighty',
    'nittio': 'ninety', 'hundra': 'hundred',
    'tusen': 'thousand', 'miljon': 'million',
    'första': 'first', 'andra': 'second', 'tredje': 'third',
    'fjärde': 'fourth', 'femte': 'fifth',

    # ── Interjections ──
    'hej': 'hello', 'hejdå': 'goodbye', 'tack': 'thank you',
    'tjena': 'hi (informal)', 'hallå': 'hello',
    'varsågod': 'you\'re welcome/here you go', 'förlåt': 'sorry',
    'ursäkta': 'excuse me', 'grattis': 'congratulations',
    'skål': 'cheers', 'lycka': 'luck/happiness',
    'ja': 'yes', 'nej': 'no', 'jo': 'yes (contradicting negative)',
    'okej': 'okay', 'visst': 'sure/certainly',
    'javisst': 'of course', 'absolut': 'absolutely',
    'oj': 'oh', 'aj': 'ouch', 'usch': 'yuck',
    'hurra': 'hooray', 'bravo': 'bravo',

    # ── Time expressions ──
    'måndag': 'Monday', 'tisdag': 'Tuesday', 'onsdag': 'Wednesday',
    'torsdag': 'Thursday', 'fredag': 'Friday', 'lördag': 'Saturday',
    'söndag': 'Sunday', 'helg': 'weekend',
    'januari': 'January', 'februari': 'February', 'mars': 'March',
    'april': 'April', 'maj': 'May', 'juni': 'June',
    'juli': 'July', 'augusti': 'August', 'september': 'September',
    'oktober': 'October', 'november': 'November', 'december': 'December',

    # ── Place names / proper nouns that appear in deck ──
    'sverige': 'Sweden', 'stockholm': 'Stockholm', 'göteborg': 'Gothenburg',
    'malmö': 'Malmö', 'uppsala': 'Uppsala', 'lund': 'Lund',
    'kiruna': 'Kiruna', 'abisko': 'Abisko', 'visby': 'Visby',
    'gotland': 'Gotland', 'dalarna': 'Dalarna', 'skåne': 'Skåne',
    'norrland': 'Norrland', 'norden': 'the Nordics', 'europa': 'Europe',
    'astrid': 'Astrid', 'ingmar': 'Ingmar', 'alfred': 'Alfred',
    'nobel': 'Nobel', 'abba': 'ABBA', 'ikea': 'IKEA',
    'volvo': 'Volvo', 'spotify': 'Spotify',
}

# ─── Build IRREGULAR_MAP for Swedish verbs ─────────────────────
IRREGULAR_VERB_FORMS = {
    # vara (to be)
    'vara': ['är', 'var', 'varit', 'vore'],
    # ha (to have)
    'ha': ['har', 'hade', 'haft'],
    # bli (to become)
    'bli': ['blir', 'blev', 'blivit'],
    # göra (to do/make)
    'göra': ['gör', 'gjorde', 'gjort'],
    # gå (to go)
    'gå': ['går', 'gick', 'gått'],
    # komma (to come)
    'komma': ['kommer', 'kom', 'kommit'],
    # kunna (can)
    'kunna': ['kan', 'kunde', 'kunnat'],
    # ska (shall)
    'ska': ['skall', 'skulle'],
    # vilja (to want)
    'vilja': ['vill', 'ville', 'velat'],
    # se (to see)
    'se': ['ser', 'såg', 'sett'],
    # säga (to say)
    'säga': ['säger', 'sa', 'sade', 'sagt'],
    # ta (to take)
    'ta': ['tar', 'tog', 'tagit'],
    # ge (to give)
    'ge': ['ger', 'gav', 'gett', 'givit'],
    # stå (to stand)
    'stå': ['står', 'stod', 'stått'],
    # finnas (to exist)
    'finnas': ['finns', 'fanns', 'funnits'],
    # få (to get/may)
    'få': ['får', 'fick', 'fått'],
    # veta (to know)
    'veta': ['vet', 'visste', 'vetat'],
    # förstå (to understand)
    'förstå': ['förstår', 'förstod', 'förstått'],
    # äta (to eat)
    'äta': ['äter', 'åt', 'ätit'],
    # dricka (to drink)
    'dricka': ['dricker', 'drack', 'druckit'],
    # sova (to sleep)
    'sova': ['sover', 'sov', 'sovit'],
    # skriva (to write)
    'skriva': ['skriver', 'skrev', 'skrivit'],
    # läsa (to read)
    'läsa': ['läser', 'läste', 'läst'],
    # springa (to run)
    'springa': ['springer', 'sprang', 'sprungit'],
    # sitta (to sit)
    'sitta': ['sitter', 'satt'],
    # ligga (to lie)
    'ligga': ['ligger', 'låg', 'legat'],
    # hålla (to hold)
    'hålla': ['håller', 'höll', 'hållit'],
    # bära (to carry)
    'bära': ['bär', 'bar', 'burit'],
    # dra (to pull)
    'dra': ['drar', 'drog', 'dragit'],
    # lägga (to lay)
    'lägga': ['lägger', 'lade', 'lagt'],
    # sätta (to put)
    'sätta': ['sätter', 'satte', 'satt'],
    # ställa (to place)
    'ställa': ['ställer', 'ställde', 'ställt'],
    # sjunga (to sing)
    'sjunga': ['sjunger', 'sjöng', 'sjungit'],
    # slå (to hit)
    'slå': ['slår', 'slog', 'slagit'],
    # brinna (to burn)
    'brinna': ['brinner', 'brann', 'brunnit'],
    # frysa (to freeze)
    'frysa': ['fryser', 'frös', 'frusit'],
    # bryta (to break)
    'bryta': ['bryter', 'bröt', 'brutit'],
    # flyga (to fly)
    'flyga': ['flyger', 'flög', 'flugit'],
    # välja (to choose)
    'välja': ['väljer', 'valde', 'valt'],
    # försvinna (to disappear)
    'försvinna': ['försvinner', 'försvann', 'försvunnit'],
    # hinna (to have time)
    'hinna': ['hinner', 'hann', 'hunnit'],
    # bjuda (to invite)
    'bjuda': ['bjuder', 'bjöd', 'bjudit'],
    # ljuga (to lie)
    'ljuga': ['ljuger', 'ljög', 'ljugit'],
    # vinna (to win)
    'vinna': ['vinner', 'vann', 'vunnit'],
    # bita (to bite)
    'bita': ['biter', 'bet', 'bitit'],
    # gripa (to grab)
    'gripa': ['griper', 'grep', 'gripit'],
    # le (to smile)
    'le': ['ler', 'log', 'lett'],
    # gråta (to cry)
    'gråta': ['gråter', 'grät', 'gråtit'],
    # dö (to die)
    'dö': ['dör', 'dog', 'dött'],
    # njuta (to enjoy)
    'njuta': ['njuter', 'njöt', 'njutit'],
    # flyta (to float)
    'flyta': ['flyter', 'flöt', 'flutit'],
    # köpa (to buy)
    'köpa': ['köper', 'köpte', 'köpt'],
    # sälja (to sell)
    'sälja': ['säljer', 'sålde', 'sålt'],
    # fortsätta (to continue)
    'fortsätta': ['fortsätter', 'fortsatte', 'fortsatt'],
    # översätta (to translate)
    'översätta': ['översätter', 'översatte', 'översatt'],
    # bestämma (to decide)
    'bestämma': ['bestämmer', 'bestämde', 'bestämt'],
    # glömma (to forget)
    'glömma': ['glömmer', 'glömde', 'glömt'],
    # känna (to feel/know)
    'känna': ['känner', 'kände', 'känt'],
    # tänka (to think)
    'tänka': ['tänker', 'tänkte', 'tänkt'],
    # böra (should)
    'böra': ['bör', 'borde', 'bort'],
    # måste (must) - defective
    'måste': [],
    # behöva (to need)
    'behöva': ['behöver', 'behövde', 'behövt'],
    # tycka (to think/find)
    'tycka': ['tycker', 'tyckte', 'tyckt'],
    # stänga (to close)
    'stänga': ['stänger', 'stängde', 'stängt'],
    # börja (to begin)
    'börja': ['börjar', 'började', 'börjat'],
    # bygga (to build)
    'bygga': ['bygger', 'byggde', 'byggt'],
    # följa (to follow)
    'följa': ['följer', 'följde', 'följt'],
    # leda (to lead)
    'leda': ['leder', 'ledde', 'lett'],
    # sträcka (to stretch)
    'sträcka': ['sträcker', 'sträckte', 'sträckt'],
    # smälta (to melt)
    'smälta': ['smälter', 'smälte', 'smält'],
    # växa (to grow)
    'växa': ['växer', 'växte', 'växt'],
    # hoppas (to hope)
    'hoppas': ['hoppades'],
    # lyckas (to succeed)
    'lyckas': ['lyckades', 'lyckats'],
    # minnas (to remember)
    'minnas': ['mindes', 'mints'],
    # andas (to breathe)
    'andas': ['andades', 'andats'],
    # åldras (to age)
    'åldras': ['åldrades'],
    # födas (to be born)
    'födas': ['föddes', 'fötts'],
    # beställa (to order)
    'beställa': ['beställer', 'beställde', 'beställt'],
    # svänga (to turn)
    'svänga': ['svänger', 'svängde', 'svängt'],
    # använda (to use)
    'använda': ['använder', 'använde', 'använt'],
    # blåsa (to blow)
    'blåsa': ['blåser', 'blåste', 'blåst'],
    # lösa (to solve)
    'lösa': ['löser', 'löste', 'löst'],
    # mäta (to measure)
    'mäta': ['mäter', 'mätte', 'mätt'],
    # ringa (to ring/call)
    'ringa': ['ringer', 'ringde', 'ringt'],
    # hjälpa (to help)
    'hjälpa': ['hjälper', 'hjälpte', 'hjälpt'],
    # trycka (to press)
    'trycka': ['trycker', 'tryckte', 'tryckt'],
    # köra (to drive)
    'köra': ['kör', 'körde', 'kört'],
    # åka (to go/ride)
    'åka': ['åker', 'åkte', 'åkt'],
}

# Build the irregular map
irr_lines = []
for inf, forms in sorted(IRREGULAR_VERB_FORMS.items()):
    form_entries = []
    for form in forms:
        if form != inf:
            form_entries.append(f"'{form}': '{inf}'")
    if form_entries:
        irr_lines.append(f"  // {inf}")
        irr_lines.append("  " + ", ".join(form_entries) + ",")

# ─── Now build the dictionary entries ─────────────────────────
dict_entries = {}

for word in words:
    # Try to get translation from our map
    en = TRANSLATIONS.get(word, '')

    if not en:
        # Try some heuristics for derived forms
        # Definite singular -en, -et, -n, -t
        for suffix, article in [('en', 'the '), ('et', 'the '), ('n', 'the '), ('t', 'the ')]:
            base = word[:-len(suffix)] if word.endswith(suffix) and len(word) > len(suffix) + 1 else ''
            if base and base in TRANSLATIONS:
                en = article + TRANSLATIONS[base].lstrip('a ').lstrip('an ')
                break

        # Definite plural -na, -erna, -arna
        if not en:
            for suffix in ('erna', 'arna', 'na', 'en'):
                base = word[:-len(suffix)] if word.endswith(suffix) and len(word) > len(suffix) + 1 else ''
                if base and base in TRANSLATIONS:
                    en = 'the ' + TRANSLATIONS[base] + 's'
                    break

        # Plural -ar, -er, -or
        if not en:
            for suffix in ('ar', 'er', 'or'):
                base = word[:-len(suffix)] if word.endswith(suffix) and len(word) > len(suffix) + 1 else ''
                if base and base in TRANSLATIONS:
                    en = TRANSLATIONS[base] + 's'
                    break

        # -ning, -tion (noun from verb)
        if not en and word.endswith('ning'):
            base = word[:-4] + 'a'
            if base in TRANSLATIONS:
                en = TRANSLATIONS[base].replace('to ', '') + ' (noun)'

        # Comparative -are
        if not en and word.endswith('are') and len(word) > 4:
            base = word[:-3]
            if base in TRANSLATIONS:
                en = 'more ' + TRANSLATIONS[base]

        # Superlative -ast
        if not en and word.endswith('ast') and len(word) > 4:
            base = word[:-3]
            if base in TRANSLATIONS:
                en = 'most ' + TRANSLATIONS[base]

        # Past participle / adjective form -ad, -d, -t
        if not en and word.endswith('ad') and len(word) > 3:
            base = word[:-1] + 'e'  # -ade verb form
            inf_base = word[:-2] + 'a'
            if inf_base in TRANSLATIONS:
                en = TRANSLATIONS[inf_base].replace('to ', '') + ' (adj)'

    if not en:
        en = word  # Fallback to word itself

    ipa = swedish_ipa(word)
    pos = detect_pos(word, en)

    dict_entries[word] = {'en': en, 'ipa': ipa, 'pos': pos}

# ─── Generate TypeScript output ────────────────────────────────
lines = []
lines.append('/**')
lines.append(' * Swedish dictionary — word lookup with IPA pronunciations.')
lines.append(' * Every word appearing in the Swedish deck should have an entry.')
lines.append(' */')
lines.append('')
lines.append("export interface DictEntry {")
lines.append("  en: string;   // English translation")
lines.append("  ipa: string;  // IPA pronunciation")
lines.append("  pos?: string; // Part of speech: n, v, adj, adv, prep, conj, det, pron, num, interj")
lines.append("}")
lines.append('')
lines.append('// ── Irregular verb forms → infinitive ────────────────────────')
lines.append('const IRREGULAR_MAP: Record<string, string> = {')
for line in irr_lines:
    lines.append(line)
lines.append('};')
lines.append('')
lines.append('// ── Main dictionary ──────────────────────────────────────────')
lines.append('const dictionary: Record<string, DictEntry> = {')

for word in sorted(dict_entries.keys()):
    entry = dict_entries[word]
    en_escaped = entry['en'].replace("'", "\\'")
    pos = entry['pos']
    lines.append(f"  '{word}': {{ en: '{en_escaped}', ipa: '{entry['ipa']}', pos: '{pos}' }},")

lines.append('};')
lines.append('')

# Add lookupWord function - Swedish-specific morphology
lines.append('export function lookupWord(raw: string): DictEntry | null {')
lines.append('  // 1. Clean input: lowercase, strip punctuation')
lines.append("  let clean = raw.toLowerCase().replace(/[¿¡.,!?;:\"\"\"\\u2018\\u2019()—–«»\\d/]/g, '').trim();")
lines.append("  if (!clean || clean.length < 1) return null;")
lines.append('')
lines.append('  // 2. Direct dictionary lookup')
lines.append('  if (dictionary[clean]) return dictionary[clean];')
lines.append('')
lines.append('  // 3. Irregular verb form → infinitive')
lines.append('  if (IRREGULAR_MAP[clean]) {')
lines.append('    const inf = IRREGULAR_MAP[clean];')
lines.append('    if (dictionary[inf]) return dictionary[inf];')
lines.append('  }')
lines.append('')
lines.append('  // 4. Definite form reversal: -en, -et, -n, -t (singular definite)')
lines.append("  for (const suf of ['erna', 'arna', 'orna', 'en', 'et', 'na', 'n', 't']) {")
lines.append('    if (clean.endsWith(suf) && clean.length > suf.length + 2) {')
lines.append('      const base = clean.slice(0, -suf.length);')
lines.append('      if (dictionary[base]) return dictionary[base];')
lines.append('      // Try adding -a (hund→hunden, skola→skolan)')
lines.append("      if (dictionary[base + 'a']) return dictionary[base + 'a'];")
lines.append("      if (dictionary[base + 'e']) return dictionary[base + 'e'];")
lines.append('    }')
lines.append('  }')
lines.append('')
lines.append('  // 5. Plural stripping: -ar, -er, -or, -r')
lines.append("  for (const suf of ['ar', 'er', 'or', 'r']) {")
lines.append('    if (clean.endsWith(suf) && clean.length > suf.length + 2) {')
lines.append('      const base = clean.slice(0, -suf.length);')
lines.append('      if (dictionary[base]) return dictionary[base];')
lines.append("      if (dictionary[base + 'a']) return dictionary[base + 'a'];")
lines.append("      if (dictionary[base + 'e']) return dictionary[base + 'e'];")
lines.append('    }')
lines.append('  }')
lines.append('')
lines.append('  // 6. Verb form stripping: -ade, -de, -te, -at, -t, -s, -ade')
lines.append("  for (const suf of ['ade', 'ades', 'ades', 'at', 'de', 'te', 'ts', 't', 's']) {")
lines.append('    if (clean.endsWith(suf) && clean.length > suf.length + 2) {')
lines.append('      const base = clean.slice(0, -suf.length);')
lines.append('      if (dictionary[base]) return dictionary[base];')
lines.append("      if (dictionary[base + 'a']) return dictionary[base + 'a'];")
lines.append("      if (dictionary[base + 'e']) return dictionary[base + 'e'];")
lines.append('    }')
lines.append('  }')
lines.append('')
lines.append('  // 7. Adjective forms: -a, -t (neuter), -e (masc definite)')
lines.append("  for (const suf of ['iga', 'igt', 'ig', 'iska', 'iskt', 'isk', 'a', 't', 'e']) {")
lines.append('    if (clean.endsWith(suf) && clean.length > suf.length + 2) {')
lines.append('      const base = clean.slice(0, -suf.length);')
lines.append('      if (dictionary[base]) return dictionary[base];')
lines.append('    }')
lines.append('  }')
lines.append('')
lines.append('  // 8. Comparative/superlative: -are, -ast')
lines.append("  if (clean.endsWith('are') && clean.length > 5) {")
lines.append("    const base = clean.slice(0, -3);")
lines.append('    if (dictionary[base]) return dictionary[base];')
lines.append('  }')
lines.append("  if (clean.endsWith('ast') && clean.length > 5) {")
lines.append("    const base = clean.slice(0, -3);")
lines.append('    if (dictionary[base]) return dictionary[base];')
lines.append('  }')
lines.append('')
lines.append('  return null;')
lines.append('}')
lines.append('')

output = '\n'.join(lines)

with open('src/data/dictionary/sv.ts', 'w') as f:
    f.write(output)

# Stats
total = len(dict_entries)
with_translation = sum(1 for w, e in dict_entries.items() if e['en'] and e['en'] != w)
translated = sum(1 for w, e in dict_entries.items() if e['en'] != w)
print(f"Dictionary entries: {total}")
print(f"With real translation: {translated} ({100*translated/total:.1f}%)")
print(f"With IPA: {total} (100%)")
print(f"Written to src/data/dictionary/sv.ts")
