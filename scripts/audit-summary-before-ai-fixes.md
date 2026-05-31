# Comprehensive Audit Summary

Generated: 2026-04-26T17:31:54.449Z

| Lang | Cards | Issues % | High | Medium | Low | Total Issues |
|------|-------|----------|------|--------|-----|-------------|
| Spanish | 3942 | 27% | 148 | 660 | 448 | 1256 |
| French | 3932 | 18% | 453 | 68 | 296 | 817 |
| Italian | 3952 | 15% | 132 | 28 | 472 | 632 |
| Portuguese | 3932 | 33% | 121 | 62 | 1319 | 1502 |
| German | 3940 | 26% | 122 | 376 | 742 | 1240 |
| Dutch | 3938 | 32% | 521 | 132 | 894 | 1547 |
| Swedish | 3926 | 21% | 115 | 36 | 751 | 902 |
| Welsh | 3507 | 18% | 243 | 59 | 403 | 705 |
| Hindi | 3173 | 39% | 140 | 449 | 972 | 1561 |
| Turkish | 3052 | 18% | 86 | 55 | 568 | 709 |
| Russian | 3366 | 19% | 39 | 310 | 387 | 736 |

## Per-language top issues

### Spanish (es)

| Type | Count | Sample |
|------|-------|--------|
| LEMMA_MISSING | 637 | "Escribo": Lemma "escribir" not in dictionary |
| STANZA_LEMMA_MISMATCH | 249 | "Creo": Our lemma="crear", Stanza="creer" |
| EMPTY_IPA | 185 | "Yo": No IPA for "Yo" |
| UNTRANSLATED | 147 | "favor": Translation is the same as the word: "favor" |
| ADJ_CAPITALISED | 22 | "verdad": Adjective "TRUE" capitalised |
| TOO_LONG_FOR_NODE | 14 | 9 words in node-1 (max 8) |
| WAY_TOO_LONG | 1 | 14 words in early node-3 |
| WORD_NOT_IN_DICT | 1 | "check-in": "check-in" not found in dictionary |

### French (fr)

| Type | Count | Sample |
|------|-------|--------|
| UNTRANSLATED | 403 | "part": Translation is the same as the word: "part" |
| STANZA_LEMMA_MISMATCH | 256 | "choisissez": Our lemma="choisir", Stanza="choisseser" |
| ADJ_CAPITALISED | 59 | "espagnol.": Adjective "Spanish" capitalised |
| WORD_NOT_IN_DICT | 50 | "jusqu": "jusqu" not found in dictionary |
| EMPTY_IPA | 38 | "récupérons": No IPA for "récupérons" |
| LEMMA_MISSING | 9 | "élu": Lemma "élire" not in dictionary |
| TOO_LONG_FOR_NODE | 2 | 9 words in node-2 (max 8) |

### Italian (it)

| Type | Count | Sample |
|------|-------|--------|
| STANZA_LEMMA_MISMATCH | 253 | "disegni": Our lemma="disegnare", Stanza="disegno" |
| EMPTY_IPA | 196 | "Direi": No IPA for "Direi" |
| UNTRANSLATED | 97 | "bravo": Translation is the same as the word: "bravo" |
| WORD_NOT_IN_DICT | 35 | "Dov": "Dov" not found in dictionary |
| ADJ_CAPITALISED | 19 | "celtica": Adjective "Celtic" capitalised |
| TECHNICAL_GRAMMAR_NOTE | 16 | "Voi": Has technical grammar note: "you (plural)" |
| LEMMA_MISSING | 9 | "abitua": Lemma "abituarsi" not in dictionary |
| TOO_LONG_FOR_NODE | 6 | 9 words in node-2 (max 8) |
| NO_END_PUNCTUATION | 1 | Sentence doesn't end with punctuation |

### Portuguese (pt)

| Type | Count | Sample |
|------|-------|--------|
| EMPTY_IPA | 660 | "Ela": No IPA for "Ela" |
| STANZA_LEMMA_MISMATCH | 475 | "vendo": Our lemma="vender", Stanza="ver" |
| TECHNICAL_GRAMMAR_NOTE | 158 | "Vocês": Has technical grammar note: "you (plural)" |
| UNTRANSLATED | 121 | "delivery": Translation is the same as the word: "delivery" |
| ADJ_CAPITALISED | 62 | "português": Adjective "Portuguese" capitalised |
| TOO_LONG_FOR_NODE | 26 | 9 words in node-1 (max 8) |

### German (de)

| Type | Count | Sample |
|------|-------|--------|
| STANZA_LEMMA_MISMATCH | 323 | "räume": Our lemma="raum", Stanza="räumen" |
| NON_VERB_WITH_TO | 230 | "dir": pron "dir" has "to" prefix: "to you" |
| EMPTY_IPA | 222 | "hattest": No IPA for "hattest" |
| TOO_LONG_FOR_NODE | 153 | 9 words in node-1 (max 8) |
| UNTRANSLATED | 122 | "so": Translation is the same as the word: "so" |
| LEMMA_MISSING | 81 | "verschiedenen": Lemma "verschieden" not in dictionary |
| ADJ_CAPITALISED | 56 | "Deutsch.": Adjective "German" capitalised |
| TECHNICAL_GRAMMAR_NOTE | 36 | "Ihr": Has technical grammar note: "her; you (plural); to her" |
| WAY_TOO_LONG | 9 | 13 words in early node-1 |
| ADV_CAPITALISED | 8 | "samstags": Adverb "Saturdays" capitalised |

### Dutch (nl)

| Type | Count | Sample |
|------|-------|--------|
| UNTRANSLATED | 521 | "water": Translation is the same as the word: "water" |
| EMPTY_IPA | 512 | "leer": No IPA for "leer" |
| STANZA_LEMMA_MISMATCH | 250 | "start": Our lemma="opstarten", Stanza="starten" |
| TOO_LONG_FOR_NODE | 108 | 9 words in node-1 (max 8) |
| ADJ_CAPITALISED | 103 | "Aangenaam": Adjective "Nice to meet you" capitalised |
| TECHNICAL_GRAMMAR_NOTE | 21 | "jullie": Has technical grammar note: "you (plural)" |
| LEMMA_MISSING | 21 | "vriest": Lemma "vriezen" not in dictionary |
| WAY_TOO_LONG | 8 | 13 words in early node-1 |
| ADV_CAPITALISED | 3 | "mei.": Adverb "May" capitalised |

### Swedish (sv)

| Type | Count | Sample |
|------|-------|--------|
| STANZA_LEMMA_MISMATCH | 365 | "heter": Our lemma="ha", Stanza="heta" |
| TOO_LONG_FOR_NODE | 243 | 9 words in node-1 (max 8) |
| EMPTY_IPA | 119 | "universitet": No IPA for "universitet" |
| UNTRANSLATED | 114 | "just": Translation is the same as the word: "just" |
| ADJ_CAPITALISED | 27 | "trevlig": Adjective "Nice" capitalised |
| TECHNICAL_GRAMMAR_NOTE | 24 | "ni": Has technical grammar note: "you (plural)" |
| LEMMA_MISSING | 7 | "drömmer": Lemma "drömma" not in dictionary |
| WAY_TOO_LONG | 2 | 15 words in early node-5 |
| WORD_NOT_IN_DICT | 1 | "toaletten": "toaletten" not found in dictionary |

### Welsh (cy)

| Type | Count | Sample |
|------|-------|--------|
| EMPTY_IPA | 303 | "nghanlyniadau.": No IPA for "nghanlyniadau." |
| UNTRANSLATED | 240 | "signal": Translation is the same as the word: "signal" |
| TOO_LONG_FOR_NODE | 68 | 9 words in node-1 (max 8) |
| ADJ_CAPITALISED | 44 | "braf.": Adjective "Nice" capitalised |
| PRON_CAPITALISED | 31 | "fi": Pronoun "I; me" capitalised |
| WAY_TOO_LONG | 15 | 18 words in early node-1 |
| WORD_NOT_IN_DICT | 3 | "Future": "Future" not found in dictionary |
| NO_END_PUNCTUATION | 1 | Sentence doesn't end with punctuation |

### Hindi (hi)

| Type | Count | Sample |
|------|-------|--------|
| STANZA_LEMMA_MISMATCH | 702 | "हैं": Our lemma="होना", Stanza="है" |
| LEMMA_MISSING | 374 | "दिखा": Lemma "दिखाना" not in dictionary |
| EMPTY_IPA | 173 | "चलें": No IPA for "चलें" |
| WORD_NOT_IN_DICT | 140 | "पोते-पोतियाँ": "पोते-पोतियाँ" not found in dictionary |
| TOO_LONG_FOR_NODE | 95 | 9 words in node-1 (max 8) |
| VERB_MISSING_TO | 61 | "चाहिए": Verb "चाहिए" shows "should, to need" without "to" prefix |
| ADJ_CAPITALISED | 11 | "भारतीय": Adjective "Indian" capitalised |
| WAY_TOO_LONG | 3 | 13 words in early node-2 |
| NO_END_PUNCTUATION | 2 | Sentence doesn't end with punctuation |

### Turkish (tr)

| Type | Count | Sample |
|------|-------|--------|
| EMPTY_IPA | 524 | "Haydi": No IPA for "Haydi" |
| UNTRANSLATED | 82 | "yi": Translation is the same as the word: "yi" |
| ADJ_CAPITALISED | 49 | "doğru": Adjective "TRUE" capitalised |
| STANZA_LEMMA_MISMATCH | 25 | "yetmiyor": Our lemma="yemek", Stanza="yet" |
| TOO_LONG_FOR_NODE | 12 | 9 words in node-1 (max 8) |
| ADV_CAPITALISED | 7 | "İngilizce": Adverb "English" capitalised |
| LEMMA_MISSING | 6 | "zorlanıyorum.": Lemma "zorlanmak" not in dictionary |
| WORD_NOT_IN_DICT | 4 | "belge": "belge" not found in dictionary |

### Russian (ru)

| Type | Count | Sample |
|------|-------|--------|
| LEMMA_MISSING | 263 | "бегает": Lemma "бегать" not in dictionary |
| EMPTY_IPA | 241 | "час": No IPA for "час" |
| STANZA_LEMMA_MISMATCH | 137 | "стоит": Our lemma="стоять", Stanza="стоить" |
| ADJ_CAPITALISED | 47 | "русский": Adjective "Russian" capitalised |
| WORD_NOT_IN_DICT | 39 | "по-русски": "по-русски" not found in dictionary |
| ADV_CAPITALISED | 7 | "приятно": Adverb "Nice" capitalised |
| TOO_LONG_FOR_NODE | 2 | 9 words in node-1 (max 8) |

