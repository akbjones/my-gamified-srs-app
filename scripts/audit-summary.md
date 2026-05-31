# Comprehensive Audit Summary

Generated: 2026-04-28T02:33:28.095Z

| Lang | Cards | Issues % | High | Medium | Low | Total Issues |
|------|-------|----------|------|--------|-----|-------------|
| Spanish | 3942 | 35% | 97 | 873 | 760 | 1730 |
| French | 3932 | 17% | 293 | 111 | 302 | 706 |
| Italian | 3952 | 17% | 45 | 217 | 479 | 741 |
| Portuguese | 3932 | 33% | 74 | 97 | 1331 | 1502 |
| German | 3940 | 25% | 19 | 383 | 745 | 1147 |
| Dutch | 3938 | 33% | 400 | 88 | 1082 | 1570 |
| Swedish | 3926 | 21% | 67 | 89 | 758 | 914 |
| Welsh | 3507 | 17% | 182 | 62 | 406 | 650 |
| Hindi | 3173 | 36% | 1 | 391 | 1022 | 1414 |
| Turkish | 3052 | 20% | 39 | 123 | 626 | 788 |
| Russian | 3366 | 18% | 0 | 318 | 396 | 714 |

## Per-language top issues

### Spanish (es)

| Type | Count | Sample |
|------|-------|--------|
| LEMMA_MISSING | 637 | "Escribo": Lemma "escribir" not in dictionary |
| SLASH_POLYSEMY | 312 | "Se": Uses / instead of ; for "oneself; yourself; himself; herself; themselves;  |
| STANZA_LEMMA_MISMATCH | 249 | "Creo": Our lemma="crear", Stanza="creer" |
| NON_VERB_WITH_TO | 218 | "al": prep "al" has "to" prefix: "to the" |
| EMPTY_IPA | 185 | "Yo": No IPA for "Yo" |
| UNTRANSLATED | 97 | "supervisor": Translation is the same as the word: "supervisor" |
| ADJ_CAPITALISED | 17 | "alemana.": Adjective "German" capitalised |
| TOO_LONG_FOR_NODE | 14 | 9 words in node-1 (max 8) |
| WAY_TOO_LONG | 1 | 14 words in early node-3 |

### French (fr)

| Type | Count | Sample |
|------|-------|--------|
| UNTRANSLATED | 293 | "part": Translation is the same as the word: "part" |
| STANZA_LEMMA_MISMATCH | 256 | "choisissez": Our lemma="choisir", Stanza="choisseser" |
| VERB_MISSING_TO | 56 | "acheté": Verb "acheté" shows "bought" without "to" prefix |
| ADJ_CAPITALISED | 46 | "espagnol.": Adjective "Spanish" capitalised |
| EMPTY_IPA | 38 | "récupérons": No IPA for "récupérons" |
| LEMMA_MISSING | 9 | "élu": Lemma "élire" not in dictionary |
| SLASH_POLYSEMY | 6 | "coupé": Uses / instead of ; for "to cut; cut (as adjective/past participle)" |
| TOO_LONG_FOR_NODE | 2 | 9 words in node-2 (max 8) |

### Italian (it)

| Type | Count | Sample |
|------|-------|--------|
| STANZA_LEMMA_MISMATCH | 253 | "disegni": Our lemma="disegnare", Stanza="disegno" |
| EMPTY_IPA | 196 | "Direi": No IPA for "Direi" |
| NON_VERB_WITH_TO | 171 | "al": prep "al" has "to" prefix: "to the" |
| UNTRANSLATED | 45 | "password": Translation is the same as the word: "password" |
| ADJ_CAPITALISED | 32 | "italiano.": Adjective "Italian; Italian language" capitalised |
| TECHNICAL_GRAMMAR_NOTE | 17 | "Voi": Has technical grammar note: "you (plural)" |
| LEMMA_MISSING | 9 | "abitua": Lemma "abituarsi" not in dictionary |
| TOO_LONG_FOR_NODE | 6 | 9 words in node-2 (max 8) |
| SLASH_POLYSEMY | 6 | "perdonalo.": Uses / instead of ; for "to forgive him/her" |
| VERB_MISSING_TO | 5 | "cucinando": Verb "cucinando" shows "cooking" without "to" prefix |

### Portuguese (pt)

| Type | Count | Sample |
|------|-------|--------|
| EMPTY_IPA | 660 | "Ela": No IPA for "Ela" |
| STANZA_LEMMA_MISMATCH | 475 | "vendo": Our lemma="vender", Stanza="ver" |
| TECHNICAL_GRAMMAR_NOTE | 158 | "Vocês": Has technical grammar note: "you (plural)" |
| UNTRANSLATED | 74 | "delivery": Translation is the same as the word: "delivery" |
| ADJ_CAPITALISED | 62 | "português": Adjective "Portuguese; Portuguese person" capitalised |
| NON_VERB_WITH_TO | 35 | "às": prep "às" has "to" prefix: "to the" |
| TOO_LONG_FOR_NODE | 26 | 9 words in node-1 (max 8) |
| SLASH_POLYSEMY | 12 | "forró": Uses / instead of ; for "forró (music/dance); lining" |

### German (de)

| Type | Count | Sample |
|------|-------|--------|
| STANZA_LEMMA_MISMATCH | 323 | "räume": Our lemma="raum", Stanza="räumen" |
| NON_VERB_WITH_TO | 233 | "dir": pron "dir" has "to" prefix: "to you" |
| EMPTY_IPA | 222 | "hattest": No IPA for "hattest" |
| TOO_LONG_FOR_NODE | 153 | 9 words in node-1 (max 8) |
| LEMMA_MISSING | 81 | "verschiedenen": Lemma "verschieden" not in dictionary |
| ADJ_CAPITALISED | 60 | "Deutsch.": Adjective "German" capitalised |
| TECHNICAL_GRAMMAR_NOTE | 36 | "Ihr": Has technical grammar note: "her; you (plural); to her" |
| UNTRANSLATED | 19 | "Hey": Translation is the same as the word: "hey" |
| WAY_TOO_LONG | 9 | 13 words in early node-1 |
| ADV_CAPITALISED | 7 | "samstags": Adverb "Saturdays" capitalised |

### Dutch (nl)

| Type | Count | Sample |
|------|-------|--------|
| EMPTY_IPA | 512 | "leer": No IPA for "leer" |
| UNTRANSLATED | 400 | "water": Translation is the same as the word: "water" |
| STANZA_LEMMA_MISMATCH | 250 | "start": Our lemma="opstarten", Stanza="starten" |
| SLASH_POLYSEMY | 191 | "er": Uses / instead of ; for "there; it; there is/are" |
| TOO_LONG_FOR_NODE | 108 | 9 words in node-1 (max 8) |
| ADJ_CAPITALISED | 59 | "Nederlands": Adjective "Dutch" capitalised |
| TECHNICAL_GRAMMAR_NOTE | 21 | "jullie": Has technical grammar note: "you (plural)" |
| LEMMA_MISSING | 21 | "vriest": Lemma "vriezen" not in dictionary |
| WAY_TOO_LONG | 8 | 13 words in early node-1 |

### Swedish (sv)

| Type | Count | Sample |
|------|-------|--------|
| STANZA_LEMMA_MISMATCH | 365 | "heter": Our lemma="ha", Stanza="heta" |
| TOO_LONG_FOR_NODE | 243 | 9 words in node-1 (max 8) |
| EMPTY_IPA | 119 | "universitet": No IPA for "universitet" |
| ADJ_CAPITALISED | 79 | "svenska": Adjective "Swedish" capitalised |
| UNTRANSLATED | 67 | "smoothie": Translation is the same as the word: "smoothie" |
| TECHNICAL_GRAMMAR_NOTE | 24 | "ni": Has technical grammar note: "you (plural)" |
| LEMMA_MISSING | 8 | "drömmer": Lemma "drömma" not in dictionary |
| SLASH_POLYSEMY | 7 | "står": Uses / instead of ; for "to stand; to be (location/state)" |
| WAY_TOO_LONG | 2 | 15 words in early node-5 |

### Welsh (cy)

| Type | Count | Sample |
|------|-------|--------|
| EMPTY_IPA | 304 | "nghanlyniadau.": No IPA for "nghanlyniadau." |
| UNTRANSLATED | 182 | "signal": Translation is the same as the word: "signal" |
| TOO_LONG_FOR_NODE | 68 | 9 words in node-1 (max 8) |
| PRON_CAPITALISED | 31 | "fi": Pronoun "I; me" capitalised |
| ADJ_CAPITALISED | 27 | "Cymreig": Adjective "Welsh" capitalised |
| VERB_MISSING_TO | 17 | "bydden": Verb "bydden" shows "would be" without "to" prefix |
| WAY_TOO_LONG | 15 | 18 words in early node-1 |
| NON_VERB_WITH_TO | 3 | "iddyn": pron "iddyn" has "to" prefix: "to them" |
| SLASH_POLYSEMY | 2 | "weini": Uses / instead of ; for "to serve; to wait (as a waiter/waitress)" |
| NO_END_PUNCTUATION | 1 | Sentence doesn't end with punctuation |

### Hindi (hi)

| Type | Count | Sample |
|------|-------|--------|
| STANZA_LEMMA_MISMATCH | 702 | "हैं": Our lemma="होना", Stanza="है" |
| LEMMA_MISSING | 363 | "दिखा": Lemma "दिखाना" not in dictionary |
| EMPTY_IPA | 218 | "चलें": No IPA for "चलें" |
| TOO_LONG_FOR_NODE | 95 | 9 words in node-1 (max 8) |
| ADJ_CAPITALISED | 25 | "भारतीय": Adjective "Indian" capitalised |
| SLASH_POLYSEMY | 5 | "मनाया": Uses / instead of ; for "to celebrate; to observe; to keep (a festival/ |
| WAY_TOO_LONG | 3 | 13 words in early node-2 |
| NO_END_PUNCTUATION | 2 | Sentence doesn't end with punctuation |
| WORD_NOT_IN_DICT | 1 | "H₂O": "H₂O" not found in dictionary |

### Turkish (tr)

| Type | Count | Sample |
|------|-------|--------|
| EMPTY_IPA | 525 | "Haydi": No IPA for "Haydi" |
| NON_VERB_WITH_TO | 110 | "bize": postp "bize" has "to" prefix: "to us" |
| SLASH_POLYSEMY | 54 | "musunuz": Uses / instead of ; for "are you (plural/formal)" |
| UNTRANSLATED | 39 | "gram": Translation is the same as the word: "gram" |
| STANZA_LEMMA_MISMATCH | 25 | "yetmiyor": Our lemma="yemek", Stanza="yet" |
| TOO_LONG_FOR_NODE | 12 | 9 words in node-1 (max 8) |
| TECHNICAL_GRAMMAR_NOTE | 10 | "size": Has technical grammar note: "to you; you (dative)" |
| LEMMA_MISSING | 6 | "zorlanıyorum.": Lemma "zorlanmak" not in dictionary |
| VERB_MISSING_TO | 5 | "yaşındasınız": Verb "yaşındasınız" shows "you are the same age" without "to" pr |
| ADJ_CAPITALISED | 2 | "hazırım.": Adjective "I am ready" capitalised |

### Russian (ru)

| Type | Count | Sample |
|------|-------|--------|
| LEMMA_MISSING | 265 | "бегает": Lemma "бегать" not in dictionary |
| EMPTY_IPA | 243 | "час": No IPA for "час" |
| STANZA_LEMMA_MISMATCH | 137 | "стоит": Our lemma="стоять", Stanza="стоить" |
| ADJ_CAPITALISED | 47 | "русский": Adjective "Russian" capitalised |
| SLASH_POLYSEMY | 14 | "номер": Uses / instead of ; for "number; room (hotel); issue (magazine/journal) |
| NON_VERB_WITH_TO | 6 | "остановке.": n "остановке." has "to" prefix: "to stop" |
| TOO_LONG_FOR_NODE | 2 | 9 words in node-1 (max 8) |

