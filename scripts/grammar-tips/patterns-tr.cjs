/** Turkish grammar-tip patterns */
module.exports = [

  // ── Sentence-final verb ──
  {
    id: 'tr-verb-final',
    priority: 50,
    match: t => /\w+(yorum|yorsun|yor|yoruz|yorsunuz|yorlar|dum|dun|du|duk|dunuz|dular|um|sun|uz|sunuz|lar|im|sin|iz|siniz|ler)\.?$/i.test(t),
    tips: [
      "Turkish puts the verb at the END of the sentence: Subject-Object-Verb. `Ben kitap okuyorum` = 'I book am-reading' = 'I'm reading a book'. The verb wraps up everything.",
    ],
  },

  // ── -iyor present continuous ──
  {
    id: 'tr-iyor-continuous',
    priority: 95,
    match: t => /\w+iyor(um|sun|uz|sunuz|lar)?\b/i.test(t),
    tips: [
      "`-iyor` = present continuous ('am -ing'): `geliyorum` (I am coming), `çalışıyor` (he is working). Add a person suffix after: -um (I), -sun (you), -uz (we).",
      "Vowel harmony at work: `-iyor` becomes `-uyor`, `-üyor`, `-ıyor` depending on the verb stem's last vowel. `Gel + iyor`, `gör + üyor`, `kal + ıyor`, `bul + uyor`.",
    ],
  },

  // ── Agglutinative suffix chains ──
  {
    id: 'tr-suffix-chain',
    priority: 60,
    match: t => /\w{12,}/i.test(t),
    tips: [
      "Turkish words can carry many suffixes in a row: root + tense + person + question + negation, all glued. A 12-letter word might be 5 small pieces.",
      "Decoding strategy: find the root (start of the word), then peel off suffixes one by one. `Gel-mi-yor-um` = come-NEG-CONT-1SG = 'I'm not coming'.",
    ],
  },

  // ── Vowel harmony ──
  {
    id: 'tr-vowel-harmony',
    priority: 40,
    match: t => /\w+(ler|lar|den|dan|de|da|im|um|üm|ım|sin|sun|sün|sın)\b/i.test(t),
    tips: [
      "Turkish suffixes shape-shift to harmonize with the root's last vowel. Plural is `-ler` after front vowels (e, i, ö, ü) and `-lar` after back vowels (a, ı, o, u). Listen to the root.",
      "Two-way harmony for simple suffixes (-lar/-ler), four-way for those with i (-im/-um/-üm/-ım). Trust the root vowel; it dictates the suffix.",
    ],
  },

  // ── Locative -de/-da/-te/-ta ──
  {
    id: 'tr-locative',
    priority: 75,
    match: t => /\w+(de|da|te|ta)\s/i.test(t),
    tips: [
      "`-de/-da` (in/at) attaches to the noun: `evde` (at home), `okulda` (at school). After voiceless consonants it hardens to `-te/-ta`: `kitapta` (in the book).",
      "Vowel harmony: front-vowel root → `-de/-te`, back-vowel root → `-da/-ta`. Consonant assimilation: voiceless ending → use the voiceless suffix.",
    ],
  },

  // ── Ablative -den/-dan ──
  {
    id: 'tr-ablative',
    priority: 75,
    match: t => /\w+(den|dan|ten|tan)\s/i.test(t),
    tips: [
      "`-den/-dan` (from): `evden` (from home), `İstanbul'dan` (from Istanbul). Harmony rules same as locative.",
      "After verb stems, `-den/-dan` sense changes: `gelmekten` (from coming) — used with `vazgeçmek` and other 'stop / give up' verbs.",
    ],
  },

  // ── Dative -e/-a ──
  {
    id: 'tr-dative',
    priority: 75,
    match: t => /\w+(e|a)\s+(gidiyor|gittim|gel|ver|geldim)\b/i.test(t),
    tips: [
      "Dative `-e/-a` (to/for): `eve` (to home), `okula` (to school). Vowel harmony: front → -e, back → -a. Goes with motion verbs (`gitmek` to go, `gelmek` to come).",
      "After vowel-ending nouns, insert a buffer y: `kapı` → `kapıya` (to the door). Turkish hates back-to-back vowels.",
    ],
  },

  // ── Possessive suffixes ──
  {
    id: 'tr-possessive-suffix',
    priority: 65,
    match: t => /\w+(im|in|si|imiz|iniz|leri|ım|ın|si|ımız|ınız|ları|um|un|su|umuz|unuz|ları)\b/i.test(t),
    tips: [
      "Possessive endings (no separate 'my', 'your'): `evim` (my house), `evin` (your house), `evi` (his/her house). All baked into one word.",
      "Person endings: -im (my), -in (your), -i (his/her), -imiz (our), -iniz (your pl), -leri (their). With back-vowel roots: -ım/-ın/-ı/-ımız/-ınız/-ları.",
    ],
  },

  // ── Negation with -mi ──
  {
    id: 'tr-negation-me',
    priority: 95,
    match: t => /\w+m[ie]y[oö]r(um|sun|uz|sunuz|lar)?\b/i.test(t),
    tips: [
      "Negation: insert `-me-/-ma-` before the tense suffix. `Geliyorum` (I'm coming) → `Gelmiyorum` (I'm not coming). The `-mi-` slot lives between root and tense.",
      "Vowel harmony picks the form: `-me-` after front vowels, `-ma-` after back. `Yapmıyor` (he's not doing), `görmüyor` (he's not seeing).",
    ],
  },

  // ── Yes/no question with -mi ──
  {
    id: 'tr-question-mi',
    priority: 90,
    match: t => /\b(mi|mı|mu|mü)\?$/i.test(t.trim()),
    tips: [
      "Yes/no questions add a separate particle: `mi / mı / mu / mü` — separated from the verb. `Geliyor musun?` = 'Are you coming?'. The question particle picks harmony from the previous vowel.",
      "Don't glue `mi` to the verb — write it separately, then add the person suffix to `mi`. `gidecek misin?` (will you go?), not `gideceksin mi`.",
    ],
  },

  // ── Genitive-possessive (X'in Y-i) ──
  {
    id: 'tr-genitive-possessive',
    priority: 70,
    match: t => /\w+(in|ın|un|ün)\s+\w+(i|ı|u|ü|si|sı|su|sü)\b/i.test(t),
    tips: [
      "Possession 'X of Y' uses two suffixes: -in (genitive) on the owner, -i (possessive) on the thing owned. `Ali'nin kitabı` = 'Ali's book' literally 'of-Ali book-his'.",
      "Both ends must match: if the owner is in genitive, the thing must carry the possessive. Same harmony rules across both.",
    ],
  },

  // ── Future -ecek/-acak ──
  {
    id: 'tr-future-ecek',
    priority: 90,
    match: t => /\w+(eceğim|acağım|eceksin|acaksın|ecek|acak|eceğiz|acağız|eceksiniz|acaksınız|ecekler|acaklar)\b/i.test(t),
    tips: [
      "Future tense `-ecek/-acak`: `geleceğim` (I will come), `çalışacak` (he will work). Vowel harmony picks -ecek or -acak. Add person suffixes after.",
      "Two-vowel collapse: when `-ecek` meets `-im` (I), you'd write `-eceğim` (the k softens to ğ between vowels). Spelling rule, not pronunciation magic.",
    ],
  },

  // ── Var / Yok (existence) ──
  {
    id: 'tr-var-yok',
    priority: 85,
    match: t => /\b(var|yok)\b/i.test(t),
    tips: [
      "`var` = 'there is/are', `yok` = 'there isn't/aren't'. No `to be` needed. `Sınıfta üç kişi var` (there are three people in the class).",
      "Past forms: `vardı` (there was), `yoktu` (there wasn't). Future: `olacak` (will be). The base `var/yok` covers the present without help.",
    ],
  },

];
