# Google Translate Word-Level Translation Review

## Executive Summary

**7721** words analyzed across **1100** cards (100 per language, 11 languages).

| Metric | Count | % |
|---|---|---|
| Total words | 7721 | 100% |
| Perfect translations | 5212 | 67.5% |
| Total issues | 2967 | 38.4% |
| **High-severity issues** | **1013** | **13.1%** |

**Bottom line**: Google Translate gives correct/usable word translations about 68% of the time. However, 13.1% of words have HIGH-severity errors (completely wrong meaning) that would actively mislead learners.

## Issue Type Summary

| Issue Type | Count | % of Words | Description |
|---|---|---|---|
| FUNCTION_WORD_WRONG | 847 | 11.0% | Articles, prepositions, aux verbs wrong (el→"he", la→"there") |
| WRONG_SENSE | 654 | 8.5% | Google picked wrong meaning (est→"east", está→"this", kar→"profit") |
| INFLECTED_NOT_BASE | 254 | 3.3% | Past tense / 3rd person instead of base form (went, eats) |
| FRAGMENT | 119 | 1.5% | Too many words for a dictionary definition |
| PROPER_NOUN_UNTRANSLATED | 31 | 0.4% | Word returned unchanged or transliterated (в→"V") |
| CAPITALIZATION | 1054 | 13.7% | Unnecessary uppercase (sentence-start leak) |
| NOUN_VS_VERB | 8 | 0.1% | Wrong part of speech (noun given but verb meant) |
| GOOGLE_PERFECT | 5212 | 67.5% | Translation is correct for dictionary use |

## Per-Language Error Rates

| Language | Words | Issues | Rate | High-Sev | Perfect |
|---|---|---|---|---|---|
| Spanish | 761 | 238 | 31.3% | 117 | 581 |
| Italian | 657 | 379 | 57.7% | 151 | 379 |
| French | 660 | 259 | 39.2% | 96 | 446 |
| Portuguese | 697 | 235 | 33.7% | 118 | 487 |
| German | 828 | 160 | 19.3% | 54 | 670 |
| Dutch | 831 | 293 | 35.3% | 114 | 599 |
| Swedish | 657 | 162 | 24.7% | 63 | 500 |
| Welsh | 781 | 213 | 27.3% | 112 | 585 |
| Hindi | 740 | 582 | 78.6% | 85 | 244 |
| Turkish | 574 | 248 | 43.2% | 49 | 349 |
| Russian | 535 | 198 | 37.0% | 54 | 372 |

## Per-Language Detailed Results

### Spanish (es)

- Words: 761 | Issues: 238 (31.3%) | High-severity: 117

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 106 |
| WRONG_SENSE | 69 |
| INFLECTED_NOT_BASE | 15 |
| FRAGMENT | 17 |
| CAPITALIZATION | 30 |
| NOUN_VS_VERB | 1 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | Vivo | Alive | WRONG_SENSE | "Vivo" → "Alive" should be "I live" or "to live" |
| 2 | el | he | FUNCTION_WORD_WRONG | "el" → "he" should be "the" |
| 3 | el | he | FUNCTION_WORD_WRONG | "el" → "he" should be "the" |
| 4 | el | he | FUNCTION_WORD_WRONG | "el" → "he" should be "the" |
| 5 | el | he | FUNCTION_WORD_WRONG | "el" → "he" should be "the" |
| 6 | El | He | FUNCTION_WORD_WRONG | "El" → "He" should be "the" |
| 7 | El | He | FUNCTION_WORD_WRONG | "El" → "He" should be "the" |
| 8 | el | he | FUNCTION_WORD_WRONG | "el" → "he" should be "the" |
| 9 | el | he | FUNCTION_WORD_WRONG | "el" → "he" should be "the" |
| 10 | el | he | FUNCTION_WORD_WRONG | "el" → "he" should be "the" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| segundo | second | I live on the second floor. |
| piso | floor | I live on the second floor. |
| Este | This | This gift is for my grandmother. |
| regalo | gift | This gift is for my grandmother. |
| abuela | grandmother | This gift is for my grandmother. |
| noviembre | November | In November the cold weather starts. |
| ya | already | In November the cold weather starts. |
| frío | cold | In November the cold weather starts. |
| hermano | brother | My older brother is thirty years old. |
| tiene | has | My older brother is thirty years old. |

---

### Italian (it)

- Words: 657 | Issues: 379 (57.7%) | High-severity: 151

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 128 |
| WRONG_SENSE | 56 |
| INFLECTED_NOT_BASE | 12 |
| FRAGMENT | 11 |
| CAPITALIZATION | 172 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | si | Yes | FUNCTION_WORD_WRONG | "si" → "Yes" should be "(reflexive/one)" |
| 2 | La | There | FUNCTION_WORD_WRONG | "La" → "There" should be "the" |
| 3 | La | There | FUNCTION_WORD_WRONG | "La" → "There" should be "the" |
| 4 | ogni | Everything is fine | FUNCTION_WORD_WRONG | "ogni" → "Everything is fine" should be "every" |
| 5 | ogni | Everything is fine | WRONG_SENSE | "ogni" → "Everything is fine" should be "every" |
| 6 | Lui | Him | FUNCTION_WORD_WRONG | "Lui" → "Him" should be "he" |
| 7 | è | And | FUNCTION_WORD_WRONG | "è" → "And" should be "is" |
| 8 | è | And | WRONG_SENSE | "è" → "And" should be "is" |
| 9 | Noi | Us | FUNCTION_WORD_WRONG | "Noi" → "Us" should be "we" |
| 10 | prima | Before | FUNCTION_WORD_WRONG | "prima" → "Before" should be "before/first" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| gioia | joy | I cry with joy. |
| Lei | She | She rests after lunch. |
| riposa | rest | She rests after lunch. |
| pranzo | lunch | She rests after lunch. |
| Dovresti | You should | You should eat more fruit. |
| mangiare | eat | You should eat more fruit. |
| più | more | You should eat more fruit. |
| frutta | fruit | You should eat more fruit. |
| sorella | sister | My sister works at a bank. |
| lavora | he works | My sister works at a bank. |

---

### French (fr)

- Words: 660 | Issues: 259 (39.2%) | High-severity: 96

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 77 |
| WRONG_SENSE | 58 |
| INFLECTED_NOT_BASE | 14 |
| FRAGMENT | 2 |
| PROPER_NOUN_UNTRANSLATED | 4 |
| CAPITALIZATION | 100 |
| NOUN_VS_VERB | 4 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | compose | compound | NOUN_VS_VERB | "compose" → "compound" should be "dial/compose" (verb) |
| 2 | porte | door | NOUN_VS_VERB | "porte" → "door" should be "to wear/to carry" (verb, not noun) |
| 3 | préfère | favorite | NOUN_VS_VERB | "préfère" → "favorite" should be "prefers" (verb) |
| 4 | la | there | FUNCTION_WORD_WRONG | "la" → "there" should be "the" |
| 5 | la | there | FUNCTION_WORD_WRONG | "la" → "there" should be "the" |
| 6 | est | East | FUNCTION_WORD_WRONG | "est" → "East" should be "is" |
| 7 | est | East | WRONG_SENSE | "est" → "East" should be "is" |
| 8 | La | There | FUNCTION_WORD_WRONG | "La" → "There" should be "the" |
| 9 | La | There | FUNCTION_WORD_WRONG | "La" → "There" should be "the" |
| 10 | est | East | FUNCTION_WORD_WRONG | "est" → "East" should be "is" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| chantons | let's sing | We sing a song. |
| chanson | song | We sing a song. |
| Elle | She | She hears a noise. |
| bruit | noise | She hears a noise. |
| numéro | number | I dial a number. |
| Tu | You | You kiss your grandmother. |
| embrasses | kisses | You kiss your grandmother. |
| ta | your | You kiss your grandmother. |
| grandmère | grandmother | You kiss your grandmother. |
| avez | have | Do you have children? |

---

### Portuguese (pt)

- Words: 697 | Issues: 235 (33.7%) | High-severity: 118

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 98 |
| WRONG_SENSE | 69 |
| INFLECTED_NOT_BASE | 11 |
| FRAGMENT | 11 |
| CAPITALIZATION | 46 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | Nós | Us | FUNCTION_WORD_WRONG | "Nós" → "Us" should be "we" |
| 2 | no | node | FUNCTION_WORD_WRONG | "no" → "node" should be "in the" |
| 3 | no | node | WRONG_SENSE | "no" → "node" should be "in the" |
| 4 | uma | one | FUNCTION_WORD_WRONG | "uma" → "one" should be "a" |
| 5 | conta | account | FUNCTION_WORD_WRONG | "conta" → "account" should be "bill/account" |
| 6 | está | this | FUNCTION_WORD_WRONG | "está" → "this" should be "is" |
| 7 | está | this | WRONG_SENSE | "está" → "this" should be "is" |
| 8 | uma | one | FUNCTION_WORD_WRONG | "uma" → "one" should be "a" |
| 9 | que | what | FUNCTION_WORD_WRONG | "que" → "what" should be "that/which" |
| 10 | é | and | FUNCTION_WORD_WRONG | "é" → "and" should be "is" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| Vocês | You | Are you okay? |
| estão | they are | Are you okay? |
| bem | good | Are you okay? |
| muito | very | I'm very sleepy. |
| sono | sleep | I'm very sleepy. |
| esporte | sport | Do you play any sport? |
| plantamos | we planted | We grow tomatoes in the backyard. |
| tomates | tomatoes | We grow tomatoes in the backyard. |
| quintal | yard | We grow tomatoes in the backyard. |
| escreve | he writes | He writes articles for a magazine. |

---

### German (de)

- Words: 828 | Issues: 160 (19.3%) | High-severity: 54

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 54 |
| WRONG_SENSE | 64 |
| INFLECTED_NOT_BASE | 33 |
| FRAGMENT | 2 |
| CAPITALIZATION | 7 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | leid | sorrow | FUNCTION_WORD_WRONG | "leid" → "sorrow" should be "sorry" |
| 2 | Meine | Mine | FUNCTION_WORD_WRONG | "Meine" → "Mine" should be "my" |
| 3 | morgen | morning | FUNCTION_WORD_WRONG | "morgen" → "morning" should be "tomorrow" |
| 4 | Morgen | Morning | FUNCTION_WORD_WRONG | "Morgen" → "Morning" should be "tomorrow" |
| 5 | Morgen | Morning | FUNCTION_WORD_WRONG | "Morgen" → "Morning" should be "tomorrow" |
| 6 | stellt | presents | FUNCTION_WORD_WRONG | "stellt" → "presents" should be "sets/places" |
| 7 | ihren | your | FUNCTION_WORD_WRONG | "ihren" → "your" should be "her/their" |
| 8 | zum | for the | FUNCTION_WORD_WRONG | "zum" → "for the" should be "to the" |
| 9 | dem | dem | FUNCTION_WORD_WRONG | "dem" → "dem" should be "the (dative)" |
| 10 | Weg | Away | FUNCTION_WORD_WRONG | "Weg" → "Away" should be "path/way" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| Hallo | Hello | Hello, how are you? |
| Ihnen | Them | Hello, how are you? |
| Tut | Does | I'm sorry, I'm late. |
| spät | late | I'm sorry, I'm late. |
| Hey | Hey | Hey, what are you doing here? |
| du | you | Hey, what are you doing here? |
| hier | here | Hey, what are you doing here? |
| Unsere | Our | Our neighbors come from different countries. |
| Nachbarn | Neighbors | Our neighbors come from different countries. |
| kommen | come | Our neighbors come from different countries. |

---

### Dutch (nl)

- Words: 831 | Issues: 293 (35.3%) | High-severity: 114

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 95 |
| WRONG_SENSE | 58 |
| INFLECTED_NOT_BASE | 40 |
| FRAGMENT | 6 |
| CAPITALIZATION | 94 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | vloeiend | flowing | FUNCTION_WORD_WRONG | "vloeiend" → "flowing" should be "fluently" |
| 2 | kam | crest | FUNCTION_WORD_WRONG | "kam" → "crest" should be "combed" |
| 3 | mijn | mine | FUNCTION_WORD_WRONG | "mijn" → "mine" should be "my" |
| 4 | haar | her | FUNCTION_WORD_WRONG | "haar" → "her" should be "her/hair" |
| 5 | met | of | FUNCTION_WORD_WRONG | "met" → "of" should be "with" |
| 6 | met | of | WRONG_SENSE | "met" → "of" should be "with" |
| 7 | naar | Unpleasant | FUNCTION_WORD_WRONG | "naar" → "Unpleasant" should be "to" |
| 8 | naar | Unpleasant | WRONG_SENSE | "naar" → "Unpleasant" should be "to" |
| 9 | Zij | She | FUNCTION_WORD_WRONG | "Zij" → "She" should be "she/they" |
| 10 | een | An | FUNCTION_WORD_WRONG | "een" → "An" should be "a" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| spreken | speak | By now we speak Dutch fluently. |
| Nederlands | Dutch | By now we speak Dutch fluently. |
| spiegel | mirror | I comb my hair in front of the mirror. |
| rijden | to ride | We drive to the beach by car. |
| strand | beach | We drive to the beach by car. |
| heerlijke | delicious | She makes a delicious hotchpotch with carrots and  |
| wortelen | carrots | She makes a delicious hotchpotch with carrots and  |
| uien | onions | She makes a delicious hotchpotch with carrots and  |
| slager | butcher | The butcher sells fresh meat. |
| vers | fresh | The butcher sells fresh meat. |

---

### Swedish (sv)

- Words: 657 | Issues: 162 (24.7%) | High-severity: 63

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 59 |
| WRONG_SENSE | 45 |
| INFLECTED_NOT_BASE | 31 |
| FRAGMENT | 5 |
| CAPITALIZATION | 22 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | köttbullar | noisette | FUNCTION_WORD_WRONG | "köttbullar" → "noisette" should be "meatballs" |
| 2 | köttbullar | noisette | WRONG_SENSE | "köttbullar" → "noisette" should be "meatballs" |
| 3 | håller | holding | FUNCTION_WORD_WRONG | "håller" → "holding" should be "hold/keep" |
| 4 | var | where | FUNCTION_WORD_WRONG | "var" → "where" should be "was/where" |
| 5 | var | where | FUNCTION_WORD_WRONG | "var" → "where" should be "was/where" |
| 6 | Det | The | FUNCTION_WORD_WRONG | "Det" → "The" should be "the/it" |
| 7 | sin | its | FUNCTION_WORD_WRONG | "sin" → "its" should be "his/her" |
| 8 | Det | The | FUNCTION_WORD_WRONG | "Det" → "The" should be "the/it" |
| 9 | det | the | FUNCTION_WORD_WRONG | "det" → "the" should be "the/it" |
| 10 | det | the | FUNCTION_WORD_WRONG | "det" → "the" should be "the/it" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| lunch | lunch | They eat meatballs for lunch. |
| två | two | One, two, three, four, five. |
| tre | three | One, two, three, four, five. |
| fyra | four | One, two, three, four, five. |
| fem | five | One, two, three, four, five. |
| dricker | drinking | He drinks a cup of coffee. |
| kopp | cup | He drinks a cup of coffee. |
| kaffe | coffee | He drinks a cup of coffee. |
| svenska | Swedish | I study Swedish every evening for at least one hou |
| minst | least | I study Swedish every evening for at least one hou |

---

### Welsh (cy)

- Words: 781 | Issues: 213 (27.3%) | High-severity: 112

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 106 |
| WRONG_SENSE | 72 |
| FRAGMENT | 9 |
| PROPER_NOUN_UNTRANSLATED | 9 |
| CAPITALIZATION | 17 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | i'n | to our | FUNCTION_WORD_WRONG | "i'n" → "to our" should be "(progressive marker)" |
| 2 | i'n | to our | FUNCTION_WORD_WRONG | "i'n" → "to our" should be "(progressive marker)" |
| 3 | yn | in | FUNCTION_WORD_WRONG | "yn" → "in" should be "in / (verbal particle)" |
| 4 | yn | in | FUNCTION_WORD_WRONG | "yn" → "in" should be "in / (verbal particle)" |
| 5 | yn | in | FUNCTION_WORD_WRONG | "yn" → "in" should be "in / (verbal particle)" |
| 6 | ddim | no | FUNCTION_WORD_WRONG | "ddim" → "no" should be "not" |
| 7 | i | i | FUNCTION_WORD_WRONG | "i" → "i" should be "to/I" |
| 8 | e | e | FUNCTION_WORD_WRONG | "e" → "e" should be "he" |
| 9 | yn | in | FUNCTION_WORD_WRONG | "yn" → "in" should be "in / (verbal particle)" |
| 10 | yn | in | FUNCTION_WORD_WRONG | "yn" → "in" should be "in / (verbal particle)" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| hoffi | like | I like my colleagues. |
| nghydweithwyr | colleagues | I like my colleagues. |
| bws | a bus | The bus is late again today, that's the third time |
| hwyr | late | The bus is late again today, that's the third time |
| eto | again | The bus is late again today, that's the third time |
| heddiw | today | The bus is late again today, that's the third time |
| trydydd | third | The bus is late again today, that's the third time |
| tro | turn | The bus is late again today, that's the third time |
| arth | a bear | The polar bear lives in the frozen Arctic. |
| byw | live | The polar bear lives in the frozen Arctic. |

---

### Hindi (hi)

- Words: 740 | Issues: 582 (78.6%) | High-severity: 85

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 64 |
| WRONG_SENSE | 72 |
| INFLECTED_NOT_BASE | 44 |
| CAPITALIZATION | 402 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | पर | But | FUNCTION_WORD_WRONG | "पर" → "But" should be "on" |
| 2 | पर | But | WRONG_SENSE | "पर" → "But" should be "on" |
| 3 | पर | But | FUNCTION_WORD_WRONG | "पर" → "But" should be "on" |
| 4 | पर | But | WRONG_SENSE | "पर" → "But" should be "on" |
| 5 | जाता | go | FUNCTION_WORD_WRONG | "जाता" → "go" should be "goes (habitual)" |
| 6 | पर | But | FUNCTION_WORD_WRONG | "पर" → "But" should be "on" |
| 7 | पर | But | WRONG_SENSE | "पर" → "But" should be "on" |
| 8 | बस | Bus | FUNCTION_WORD_WRONG | "बस" → "Bus" should be "just/enough/bus" |
| 9 | हुए | happened | FUNCTION_WORD_WRONG | "हुए" → "happened" should be "(progressive marker)" |
| 10 | रहे | are | FUNCTION_WORD_WRONG | "रहे" → "are" should be "(progressive pl.)" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| सबसे | To all | Which is the nearest hospital? |
| नज़दीकी | close proximity | Which is the nearest hospital? |
| अस्पताल | hospital | Which is the nearest hospital? |
| नमस्ते | hello | Hello, I have come from Bhopal. |
| भोपाल | Bhopal | Hello, I have come from Bhopal. |
| धर्मपत्नी | wife | This is my wife Mrs. Sharma. |
| किसान | Farmer | The farmer goes to the field every morning. |
| हर | every | The farmer goes to the field every morning. |
| दफ़्तर | office | He always reaches the office right on time. |
| न्याय | Justice | Getting justice is every citizen's right. |

---

### Turkish (tr)

- Words: 574 | Issues: 248 (43.2%) | High-severity: 49

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 28 |
| WRONG_SENSE | 64 |
| INFLECTED_NOT_BASE | 16 |
| FRAGMENT | 45 |
| PROPER_NOUN_UNTRANSLATED | 1 |
| CAPITALIZATION | 91 |
| NOUN_VS_VERB | 3 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | Her | Each | FUNCTION_WORD_WRONG | "Her" → "Each" should be "every" |
| 2 | en | -most | FUNCTION_WORD_WRONG | "en" → "-most" should be "most" |
| 3 | başı | head | FUNCTION_WORD_WRONG | "başı" → "head" should be "per/head" |
| 4 | yüz | face | FUNCTION_WORD_WRONG | "yüz" → "face" should be "hundred/face" |
| 5 | hesap | bill | FUNCTION_WORD_WRONG | "hesap" → "bill" should be "bill/account" |
| 6 | çıktı | output | FUNCTION_WORD_WRONG | "çıktı" → "output" should be "came out" |
| 7 | doğru | TRUE | FUNCTION_WORD_WRONG | "doğru" → "TRUE" should be "correct/towards" |
| 8 | her | each | FUNCTION_WORD_WRONG | "her" → "each" should be "every" |
| 9 | kar | profit | FUNCTION_WORD_WRONG | "kar" → "profit" should be "snow" |
| 10 | kar | profit | WRONG_SENSE | "kar" → "profit" should be "snow" |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| Öğrenciler | Students | The students are taking notes carefully in class. |
| sınıfta | in the classroom | The students are taking notes carefully in class. |
| dikkatle | with care | The students are taking notes carefully in class. |
| not | notes | The students are taking notes carefully in class. |
| alıyor | is taking | The students are taking notes carefully in class. |
| Gelinimiz | Our bride | Our daughter-in-law is a very hardworking and kind |
| çalışkan | hard working | Our daughter-in-law is a very hardworking and kind |
| nazik | kind | Our daughter-in-law is a very hardworking and kind |
| kız | girl | Our daughter-in-law is a very hardworking and kind |
| Uçak | Aeroplane | The plane was two hours late and we waited a long  |

---

### Russian (ru)

- Words: 535 | Issues: 198 (37.0%) | High-severity: 54

**Issue breakdown:**

| Type | Count |
|---|---|
| FUNCTION_WORD_WRONG | 32 |
| WRONG_SENSE | 27 |
| INFLECTED_NOT_BASE | 38 |
| FRAGMENT | 11 |
| PROPER_NOUN_UNTRANSLATED | 17 |
| CAPITALIZATION | 73 |

**10 Worst Examples:**

| # | Word | Google | Issue | Detail |
|---|---|---|---|---|
| 1 | число | number | FUNCTION_WORD_WRONG | "число" → "number" should be "date/number" |
| 2 | У | U | FUNCTION_WORD_WRONG | "У" → "U" should be "at/by" |
| 3 | У | U | PROPER_NOUN_UNTRANSLATED | "У" → "U" (transliterated, should be "at/by") |
| 4 | в | V | FUNCTION_WORD_WRONG | "в" → "V" should be "in" |
| 5 | в | V | PROPER_NOUN_UNTRANSLATED | "в" → "V" (transliterated, should be "in") |
| 6 | выпьем | let's have a drink | FRAGMENT | "выпьем" → "let's have a drink" (4 words) |
| 7 | дома | Houses | FUNCTION_WORD_WRONG | "дома" → "Houses" should be "at home" |
| 8 | дома | Houses | FUNCTION_WORD_WRONG | "дома" → "Houses" should be "at home" |
| 9 | в | V | FUNCTION_WORD_WRONG | "в" → "V" should be "in" |
| 10 | в | V | PROPER_NOUN_UNTRANSLATED | "в" → "V" (transliterated, should be "in") |

**10 Best Examples (Google Perfect):**

| Word | Google | Card English |
|---|---|---|
| прав | right | I think that he is right. |
| Сегодня | Today | Today is the thirteenth — Friday. |
| тринадцатое | thirteenth | Today is the thirteenth — Friday. |
| пятница | Friday | Today is the thirteenth — Friday. |
| буду | will | I will not eat this porridge. |
| эту | this one | I will not eat this porridge. |
| кашу | porridge | I will not eat this porridge. |
| Когда | When | When will you return home? |
| домой | home | When will you return home? |
| бабушки | grandmothers | Grandmother has many interesting stories. |

---

## Systemic Patterns Found

### 1. Article/Copula → Pronoun (Romance Languages)
The single most common and most damaging pattern. Google translates definite articles as pronouns:
- Spanish: **el→"he"** (appears ~20+ times), la→"the" (correct sometimes)
- Italian: **è→"And"** (catastrophic — "is" becomes "and"), la→"there"
- French: **est→"East"** (catastrophic — most common verb becomes direction)
- Portuguese: **no→"node"**, está→"this", é→"and"

### 2. Wrong Sense for Homographs
Words with multiple meanings consistently get the wrong one in isolation:
- Turkish: **kar→"profit"** (should be "snow"), üç→"fly" (should be "three"), gelir→"income" (should be "comes")
- Hindi: **पर→"But"** (should be "on"), कर→"Tax" (should be "do"), जाती→"caste" (should be "goes")
- Dutch: **naar→"Unpleasant"** (should be "to"), bij→"bee" (should be "at"), met→"of" (should be "with")
- Swedish: **köttbullar→"noisette"** (should be "meatballs"), åker→"field" (should be "go/travel")
- Russian: **в→"V"** (transliteration!), дома→"Houses" (should be "at home")

### 3. Capitalization Leakage
Google preserves source-language capitalization. German capitalizes ALL nouns, so translations like "Coffee", "Water", "Window" are correct German but wrong English dictionary entries.

### 4. Grammatical Particles Mistranslated
Many languages have particles that don't map 1:1 to English:
- Hindi: ने (agent marker), से, में, पर, को — these are postpositions Google handles inconsistently
- Welsh: yn (verbal particle), wedi (perfective), ddim (negation) — Welsh grammar markers poorly handled
- Turkish: agglutinative suffixes (-da, -den, -yla) handled by Google within compound forms but isolated words lose context

### 5. Verb Form Issues
Google frequently gives inflected forms instead of dictionary base forms:
- Past tense: "went" instead of "to go", "came" instead of "to come"
- Italian: era→"era" (untranslated!), fosse→"is" (wrong tense entirely)
- Spanish: vino→"came" (correct but should be "to come" for dictionary)

## Recommendations

### Auto-Fix Rules (apply post-processing to Google output)

| # | Rule | Languages | Expected Fix Rate |
|---|---|---|---|
| 1 | **Lowercase first letter** unless proper noun | All | ~95% of CAPITALIZATION issues |
| 2 | **Article lookup table**: el/la/le/il/o/der/die/das → "the" | ES/FR/IT/PT/DE | ~90% of article errors |
| 3 | **Function word table**: 50-100 entries per language | All | ~80% of FUNCTION_WORD_WRONG |
| 4 | **Strip fragments**: if output >3 words, take last content word | All | ~70% of FRAGMENT issues |
| 5 | **Verb base form**: if English output is irregular past, map to "to X" | All | ~60% of INFLECTED issues |
| 6 | **Transliteration fix**: single Cyrillic letter → known translation | RU | 100% of в/у/о issues |

### Must Use Wiktionary (cannot auto-fix)

| Issue | Why Auto-Fix Fails |
|---|---|
| **WRONG_SENSE** | No way to pick correct sense without context. Google picks the most common meaning in isolation, which is often wrong for how the word is used in our sentences. |
| **NOUN_VS_VERB** | Google doesn't distinguish POS. "porte" = "door" (noun) vs "wears" (verb) requires knowing the sentence structure. |
| **Hindi/Welsh grammatical particles** | These are language-specific grammar markers that need language-aware definitions, not translation. |
| **Turkish agglutination** | Suffixed words need morphological analysis, not single-word translation. |

### Recommended Strategy

1. **Primary source: Wiktionary** — already have rebuild script. Use for definitions, POS, IPA.
2. **Secondary source: Google Translate with auto-fix pipeline** — only when Wiktionary has no entry.
3. **Auto-fix pipeline**: lowercase → function word table → verb base form → fragment trim.
4. **Never use raw Google output** — even "perfect" translations often have capitalization issues.
5. **Per-language function word tables are essential** — the 50 most common function words per language need hardcoded correct translations.

### Expected Quality After Pipeline

| Source | Coverage | Accuracy |
|---|---|---|
| Wiktionary only | ~70-80% of words | ~95% accurate |
| Wiktionary + Google auto-fixed | ~95%+ of words | ~88% accurate |
| Raw Google (current) | 100% of words | ~68% accurate |
