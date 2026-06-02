/** Turkish grammar-tip patterns — deeply tailored to the agglutinative shock for English speakers. */
module.exports = [

  // ── Verb at the end ──
  {
    id: 'tr-verb-final',
    priority: 60,
    match: t => /[A-Za-zçğıöşüÇĞİÖŞÜ]+(yorum|yorsun|yor|yoruz|yorsunuz|yorlar|dum|dun|du|duk|dunuz|dular|um|sun|uz|sunuz|lar|im|sin|iz|siniz|ler)[.!?]?$/.test(t.trim()),
    tips: [
      "Turkish goes Subject-Object-Verb: the verb is the FINAL word. `Ben kitap okuyorum` = 'I book am-reading' = 'I'm reading a book'. The verb wraps everything up.",
      "Mentally reorder English sentences as you compose: subject → all objects → ALL modifiers → verb at the very end. Adjectives stay before their nouns; the verb goes last.",
      "If you put the verb in the middle, native speakers will understand but it'll sound foreign or emphatic. Default to verb-last for normal speech.",
      "The thing being acted on (object) comes before the verb. `Ben elma yiyorum` = I-apple-am eating. The apple sits between you and the action.",
    ],
  },

  // ── -iyor present continuous (with vowel harmony) ──
  {
    id: 'tr-iyor-continuous',
    priority: 95,
    match: t => /\w+(iyor|ıyor|uyor|üyor)(um|sun|uz|sunuz|lar)?\b/i.test(t),
    tips: [
      "`-iyor` = 'am/is -ing' (continuous): `geliyorum` (I'm coming), `çalışıyor` (he's working). Person suffix after: -um (I), -sun (you), -uz (we), -sunuz (you-pl), -lar (they).",
      "Vowel harmony shifts the suffix: `-iyor` after front-vowel root, `-uyor` after rounded back vowel, `-ıyor` after back unrounded. `Gel-iyor`, `gör-üyor`, `kal-ıyor`, `bul-uyor`.",
      "`-iyor` covers BOTH 'I am doing now' AND 'I do generally' in many contexts. Turkish doesn't sharply split habitual from continuous like English does.",
      "Decoding a long verb? Find `-iyor` first — that's your anchor. Then trace back to the root (left) and forward to the person ending (right). Layered like an onion.",
    ],
  },

  // ── Vowel harmony ──
  {
    id: 'tr-vowel-harmony',
    priority: 50,
    match: t => /\w+(ler|lar|den|dan|de|da|im|ım|um|üm|sin|sın|sun|sün)\b/i.test(t),
    tips: [
      "Turkish vowel harmony: suffixes shape-shift to match the root's last vowel. Two-way harmony picks `-ler/-lar` (plural): front vowels (e, i, ö, ü) → -ler, back vowels (a, ı, o, u) → -lar.",
      "Four-way harmony for `i`-class suffixes: -im/-ım/-um/-üm depending on the last vowel. `Evim` (my house, e→i), `kapım` (my door, a→ı), `kolum` (my arm, o→u), `gözüm` (my eye, ö→ü).",
      "Why this matters: getting the suffix vowel wrong is the #1 marker of foreign-sounding Turkish. The root's last vowel BLOCKS certain suffix shapes.",
      "Quick checklist: 'a, ı, o, u' = back vowels (deep sound). 'e, i, ö, ü' = front (light). Match by feel after a bit of practice.",
    ],
  },

  // ── Locative -de/-da/-te/-ta ──
  {
    id: 'tr-locative',
    priority: 80,
    match: t => /\w+(de|da|te|ta)\b/i.test(t),
    tips: [
      "`-de/-da` = 'in / at / on': `evde` (at home), `okulda` (at school), `İstanbul'da` (in Istanbul). Vowel harmony picks -de (front) or -da (back).",
      "Consonant assimilation: after voiceless consonants (p, ç, t, k, f, h, s, ş), the suffix hardens to `-te/-ta`. `Kitapta` (in the book — kitap ends in p), `arabasta`? no, `arabada`.",
      "Apostrophe before suffixes for proper nouns: `İstanbul'da`, `Ankara'ya`. Without the apostrophe, the proper noun looks chained-in incorrectly.",
      "Locative doesn't make a noun definite. `Okulda öğrenci var` = 'there is a student at the school' — the locative doesn't add 'the'. Definiteness comes from context.",
    ],
  },

  // ── Ablative -den/-dan ──
  {
    id: 'tr-ablative',
    priority: 80,
    match: t => /\w+(den|dan|ten|tan)\b/i.test(t),
    tips: [
      "`-den/-dan` = 'from / out of / through': `evden` (from home), `İstanbul'dan` (from Istanbul), `pencereden` (through the window). Vowel harmony rules.",
      "Hardening: after voiceless consonants, the suffix becomes `-ten/-tan`. `Kitaptan` (from the book — kitap ends in p), `evdan`? no, `evden`.",
      "Ablative isn't just physical 'from'. It marks the reason in 'because of': `soğuktan üşüdüm` (I got cold because of the cold). Also the standard in comparisons: `senden büyük` (bigger than you).",
      "After verb stems, -den/-dan makes a gerund-like noun: `gelmekten` (from coming), used with verbs like `vazgeçmek` (to give up). 'I gave up coming' = `gelmekten vazgeçtim`.",
    ],
  },

  // ── Dative -e/-a ──
  {
    id: 'tr-dative',
    priority: 80,
    match: t => /\w+(ye|ya|e|a)\b\s+(gidiyor|gitti|geliyor|geldi|ver|veriyor|söyl|yaz|gönder)/i.test(t),
    tips: [
      "Dative `-e/-a` = 'to / toward': `eve` (to home), `okula` (to school). Mandatory with motion verbs: `eve gidiyorum` (I'm going home).",
      "After a vowel, insert a buffer 'y': `kapıya` (to the door — kapı + ya). Turkish hates back-to-back vowels.",
      "Dative also goes with verbs that take 'to' indirectly: `söylemek` (to tell to), `vermek` (to give to), `yardım etmek` (to help). The recipient ends in -e/-a.",
      "Time expressions: `saat üçe` (by three o'clock). The deadline takes dative. Turkish 'by 3' = 'to 3'.",
    ],
  },

  // ── Possessive suffixes ──
  {
    id: 'tr-possessive-suffix',
    priority: 75,
    match: t => /\w+(im|ım|um|üm|in|ın|un|ün|si|sı|su|sü|imiz|ımız|umuz|ümüz|iniz|ınız|unuz|ünüz|leri|ları)\b/i.test(t),
    tips: [
      "Possession is baked into the noun: `evim` (my house), `evin` (your house), `evi` (his/her house). No separate 'my', 'your', etc. — just suffix the owner onto the thing.",
      "Person endings: -im (my), -in (your), -i (his/her), -imiz (our), -iniz (your pl), -leri (their). Vowel harmony picks the right shape: -ım/-um/-üm after back/rounded roots.",
      "Buffer 's' after vowel-ending nouns: `araba` → `arabası` (his/her car). 'a' meets 'i' so 's' breaks them apart. Same for `kutu → kutusu`.",
      "You CAN add a separate 'my'/'your' word for emphasis: `benim evim` (MY house). The owner-pronoun is optional; the suffix is mandatory.",
    ],
  },

  // ── Negation with -ma/-me ──
  {
    id: 'tr-negation-me',
    priority: 95,
    match: t => /\w+m[ie]y[oö]r(um|sun|uz|sunuz|lar)?\b/i.test(t) || /\w+(ma|me)(d[iı][m|n|k])\b/i.test(t),
    tips: [
      "Negation slots in BEFORE the tense suffix: `geliyorum` (I'm coming) → `gelmiyorum` (I'm not coming). The `-mi-/-mı-/-mu-/-mü-` slot lives between root and tense.",
      "Past negative: `gitmedim` (I didn't go) = git (go) + me (not) + di (past) + m (I). Stack the suffixes in order: root + neg + tense + person.",
      "Future negative is special: future is `-ecek/-acak`, negative goes before: `gelmeyeceğim` (I won't come). Watch the buffer y: `me + eceğim → meyeceğim`.",
      "If you put -me- in the wrong slot, the whole word breaks. Position is fixed: root + (causative/passive) + NEG + tense + person.",
    ],
  },

  // ── Yes/no questions with mi/mı/mu/mü ──
  {
    id: 'tr-question-mi',
    priority: 95,
    match: t => /\s(mi|mı|mu|mü)\b/i.test(t),
    tips: [
      "Yes/no questions use a separate particle: `mi / mı / mu / mü` (vowel harmony). It floats AFTER the questioned word: `Geliyor musun?` (Are you coming?).",
      "Person suffix attaches to `mi`, not the verb: `gidecek misin?` (will you go?), NOT `gideceksin mi`. The question particle steals the person ending.",
      "Spacing matters: write `mi` SEPARATELY from the verb. Computer keyboards make it tempting to glue them — don't. `geliyor mu` two words, `geliyormusun` is broken.",
      "Picking the form: harmonise with the last vowel of the question target. After 'a/ı' → mı, 'e/i' → mi, 'o/u' → mu, 'ö/ü' → mü.",
    ],
  },

  // ── Genitive-possessive (X'in Y-i) ──
  {
    id: 'tr-genitive-possessive',
    priority: 80,
    match: t => /\w+(in|ın|un|ün|nin|nın|nun|nün)\b\s+\w+(i|ı|u|ü|si|sı|su|sü)\b/i.test(t),
    tips: [
      "Possession 'X of Y' takes two suffixes: -in (genitive) on the owner, -i (possessive) on the thing. `Ali'nin kitabı` = 'Ali's book' literally 'of-Ali book-his'.",
      "Both ends MUST match: if owner is in genitive, the thing MUST carry the possessive suffix. Drop either one and the sentence collapses.",
      "Vowel ending? Insert 'n': `araba` → `arabanın` (of the car). The 'n' breaks the back-to-back vowel disaster.",
      "Three-noun chains work the same: `Ahmet'in arkadaşının evi` = 'Ahmet's friend's house'. Stack the genitives left-to-right, the final thing carries possessive.",
    ],
  },

  // ── Future -ecek / -acak ──
  {
    id: 'tr-future-ecek',
    priority: 90,
    match: t => /\w+(eceğim|acağım|eceksin|acaksın|ecek|acak|eceğiz|acağız|eceksiniz|acaksınız|ecekler|acaklar)\b/i.test(t),
    tips: [
      "Future tense `-ecek/-acak` + person suffix: `geleceğim` (I will come), `çalışacaksın` (you will work). Vowel harmony picks -ecek (front) or -acak (back).",
      "Spelling rule: `k` softens to `ğ` between vowels. `-ecek + -im` would give `-ecekim`, but you write `-eceğim`. Pronounced almost identically; spelling reflects the soft k.",
      "Future doesn't always mean a fixed plan. It can express prediction, intention, even uncertainty: `yağmur yağacak` (it will rain — confident), `umarım gelecek` (I hope she'll come).",
      "Future + question: `gelecek misin?` (will you come?). The `mi` question particle takes the person ending here.",
    ],
  },

  // ── Var / Yok existence ──
  {
    id: 'tr-var-yok',
    priority: 85,
    match: t => /\b(var|yok)\b/i.test(t),
    tips: [
      "`var` = 'there is/are', `yok` = 'there isn't/aren't'. No 'to be' needed. `Sınıfta üç kişi var` (there are three people in the class). Just slap `var` at the end.",
      "Past forms: `vardı` (there was), `yoktu` (there wasn't). Future: `olacak` (will be). The bare `var/yok` covers only present.",
      "Possession 'I have X': use locative + var. `Bende kalem var` (I have a pen — lit. 'at me a pen there is'). Turkish has no 'have' verb; it borrows `var`.",
      "Combined with the possessive: `arabam var` (I have a car — 'my-car there is'). Different structure than the locative form, both valid.",
    ],
  },

  // ── -di simple past ──
  {
    id: 'tr-past-di',
    priority: 85,
    match: t => /\w+(dim|dın|di|dik|diniz|diler|dım|dun|dük|tım|tın|ti|tik|tiniz|tiler|tum|ttı|ttuk)\b/i.test(t),
    tips: [
      "Simple past `-di/-dı/-du/-dü` + person: `geldim` (I came), `gördün` (you saw), `yedi` (he/she ate). Vowel harmony + consonant hardening (-ti after voiceless).",
      "Distinct from the witnessed past `-miş/-mış` (hearsay/inferred): `gelmiş` = 'apparently came / they say came'. Use `-di` for things YOU witnessed; `-miş` for hearsay or surprise.",
      "Person endings on -di: -im (I), -in (you), -∅ (he/she), -ik (we), -iniz (you pl), -iler (they). Vowel harmony picks the version.",
    ],
  },

  // ── -miş / -mış reported past ──
  {
    id: 'tr-mis-evidential',
    priority: 90,
    match: t => /\w+(mişim|mışım|miş|mış|muş|müş|mişiz|mışız)\b/i.test(t),
    tips: [
      "`-miş` (with harmony) marks INFERRED or REPORTED past: `gelmiş` = 'apparently came / I heard he came / it seems he came'. English needs auxiliaries; Turkish bakes it into one suffix.",
      "Distinguish: `-di` = I saw it happen. `-miş` = I'm reporting it from elsewhere, or I'm noticing it now (resultative). `Yağmur yağmış` = 'it has rained' (I'm seeing the wet ground).",
      "Used for fairy tales, rumours, news reports, and surprise: `meğer haklıymışsın` = 'turns out you were right' (with discovery tone). Adds narrative distance.",
    ],
  },

  // ── Accusative -i for definite objects ──
  {
    id: 'tr-accusative-definite',
    priority: 80,
    match: t => /\w+(yi|yı|yu|yü|i|ı|u|ü)\b\s+\w+(yorum|yorsun|yor|du|dü|cek)/i.test(t),
    tips: [
      "Definite direct objects take accusative -i (+ harmony, + buffer y after vowels): `kitabı okuyorum` (I'm reading the book — specific). `Kitap okuyorum` = 'I'm reading a book' (any book).",
      "No accusative = indefinite. Adding accusative = 'the / this specific one'. Turkish distinguishes 'a' vs 'the' through this suffix, not through articles.",
      "Buffer y after vowel-final stems: `kapı + yı → kapıyı` (the door — acc). Without the y, the vowels would crash together.",
      "Pronouns have fixed accusative forms: `beni` (me), `seni` (you), `onu` (him/her/it). Memorise; the rule of -i + harmony still holds.",
    ],
  },

  // ── Plural -ler/-lar ──
  {
    id: 'tr-plural',
    priority: 50,
    match: t => /\w+(ler|lar)\b/i.test(t),
    tips: [
      "Plural is `-ler/-lar` (vowel harmony): `evler` (houses, e→ler), `kitaplar` (books, a→lar). One suffix, two forms.",
      "After numbers, drop the plural: `üç ev` (three houses), not `üç evler`. The number does the pluralising; the noun stays singular.",
      "Plural also marks respect on a third-person verb: `geldiler` could mean 'they came' OR 'he/she came (respect)'. Context tells you which.",
    ],
  },

  // ── Modal verbs: -bilir (can), -malı (must) ──
  {
    id: 'tr-modal-suffix',
    priority: 85,
    match: t => /\w+(bilir|biliyor|bilirim|bilirsin|bileceğim|abilir|ebilir|malı|meli)\b/i.test(t),
    tips: [
      "`-(y)abilir/-(y)ebilir` = 'can / may': `gelebilirim` (I can come), `görebilirsin` (you can see). Stacks onto the root: root + a-/-e + bilir + person.",
      "`-malı/-meli` = 'must / should': `gitmeliyim` (I must go), `çalışmalısın` (you must work). Strong obligation; for softer 'should' use `gerekiyor` patterns.",
      "Negative ability: `gelemem` (I can't come — gel + e + me + m). The ability suffix wraps around the negation; word builds out from the root.",
    ],
  },

  // ── -ken (while X-ing) ──
  {
    id: 'tr-ken-while',
    priority: 80,
    match: t => /\w+(ken|iken|ıken|uken|üken)\b/i.test(t),
    tips: [
      "`-ken` = 'while X-ing': `çocukken` (while a child), `yürürken` (while walking). Attaches to nouns, adjectives, or verb-progressive forms.",
      "Tells background events: `eve geliyorken arkadaşımı gördüm` = 'while coming home, I saw my friend'. Sets up the scene for the main action.",
      "After vowels, insert 'y': `gelirken` (while coming — gelir + ken). After consonants, just stick `-ken` on.",
    ],
  },

  // ── Honorific -siz / -sınız ──
  {
    id: 'tr-formal-you',
    priority: 70,
    match: t => /\b(siz|sizinki|sizler)\b/i.test(t) || /\w+(sınız|siniz|sunuz|sünüz)\b/i.test(t),
    tips: [
      "`siz` = polite 'you' (also actual plural 'you'). Use it with strangers, elders, in shops, in writing. `sen` is for friends and family.",
      "Verbs take `-sınız/-siniz/-sunuz/-sünüz` for siz: `geliyorsunuz` (you-formal/pl are coming). Harmony picks the right form.",
      "Even for one person, `siz` means respect. Saying `sen` to someone elder/unknown is rude. When in doubt, formal.",
    ],
  },

  // ── Compound verb with etmek ──
  {
    id: 'tr-etmek-compound',
    priority: 65,
    match: t => /\b(yardım|teşekkür|telefon|hareket|tatil|dans|kontrol|tercih|sevk|kabul|tamir|tedavi)\s+ediyor/i.test(t) || /\b(yardım|teşekkür|telefon|tatil)\s+et/i.test(t),
    tips: [
      "Compound verb pattern: noun + `etmek` (to do). `Yardım etmek` (to help), `teşekkür etmek` (to thank), `tatil yapmak` (to vacation). The noun stays static; `etmek` carries tense.",
      "English loanwords often join with `etmek` to become verbs: `kontrol etmek` (to check), `tercih etmek` (to prefer), `kabul etmek` (to accept).",
      "Difference between `etmek` (to do) and `yapmak` (to make/do): mostly idiomatic. `Yardım etmek`, not `yardım yapmak`. Learn each phrase whole.",
    ],
  },

  // ── -lik suffix (abstract noun) ──
  {
    id: 'tr-lik-abstract',
    priority: 55,
    match: t => /\w+(lik|lık|luk|lük)\b/i.test(t),
    tips: [
      "`-lik` makes abstract nouns from words: `iyi` (good) → `iyilik` (goodness), `çocuk` (child) → `çocukluk` (childhood). Highly productive — slap on any adjective or noun.",
      "Also means 'place for X' or 'set of X': `kitap` (book) → `kitaplık` (bookshelf). Vowel harmony picks the right form.",
      "Combines into long words: `arkadaş + lık → arkadaşlık` (friendship). Decoding tip: if you see -lik at the end of a long word, peel it off — the rest is the concrete root.",
    ],
  },

  // ── -ci occupation suffix ──
  {
    id: 'tr-ci-profession',
    priority: 55,
    match: t => /\w+(ci|cı|cu|cü|çi|çı|çu|çü)\b/i.test(t),
    tips: [
      "`-ci/-cı/-cu/-cü` makes profession or 'person who X': `simit` (bagel) → `simitçi` (bagel seller), `iş` (work) → `işçi` (worker), `yol` (road) → `yolcu` (passenger).",
      "After voiceless consonants it hardens to `-çi`: `kitap → kitapçı` (bookseller). Same suffix, different spelling.",
      "Also marks ideology: `Türkçü` (Turkist), `solcu` (leftist). 'X-ist' often = root + cü/cı/cu/ci.",
    ],
  },

  // ── -de/-da clause connector ──
  {
    id: 'tr-de-also',
    priority: 60,
    match: t => /\s(de|da)\b\s/i.test(t),
    tips: [
      "Free-standing `de/da` (with a SPACE) means 'also / too': `Ben de geliyorum` (I'm coming too). NOT to be confused with the locative `-de` (suffix, no space) meaning 'in/at'.",
      "Position matters: `ben de geliyorum` (I-also am coming) vs `geliyorum da` (I'm coming, though). Same word, different placement, shifted emphasis.",
    ],
  },

  // ── -mış olmalı (must have ...) ──
  {
    id: 'tr-must-have',
    priority: 75,
    match: t => /\w+(mış|miş|muş|müş)\s+olmalı/i.test(t),
    tips: [
      "`-mış olmalı` = 'must have / probably has': `gelmiş olmalı` (he must have come). Combines evidential past with `olmalı` (must be).",
      "Deduction structure: bare evidential past + olmalı + (person suffix). 'Based on evidence, this happened'. English uses 'must have'; Turkish stacks suffixes.",
    ],
  },

  // ── SOV word order — verb at the very end ──────────────────
  {
    id: 'tr-sov-order',
    priority: 50,
    match: t => /[a-zçğıöşü]/i.test(t),
    tips: [
      "Turkish is SOV: the verb ALWAYS goes at the end. `Ben elma yiyorum` (I apple eat) = 'I'm eating an apple'. English SVO flips to SOV. Long sentences pile everything before the verb.",
      "No gender, no articles. `O` covers he/she/it. `Ev` means both 'a house' and 'the house' depending on context. Massive simplification compared to English/German.",
      "Question particle `mi` floats to attach to whatever is being questioned: `Geliyor mu?` (Is he coming?), `Ev mi?` (Is it a house?). It harmonizes with the vowel of the word in front.",
      "Negation glues a `-me/-ma` infix INTO the verb (vowel-harmonized): `geliyorum` (I come) → `gelmiyorum` (I don't come). The negative is part of the verb, not a separate word.",
    ],
  },

];
