/** Russian grammar-tip patterns */
module.exports = [

  // ── No "to be" in present tense ──
  {
    id: 'ru-no-byt-present',
    priority: 90,
    match: t => /^[А-ЯЁ]\w*\s+[а-яё][а-яёА-ЯЁ]+\.?$/i.test(t) && !/\sесть\s/i.test(t),
    tips: [
      "Russian doesn't use 'to be' in the present: `Я студент` literally = 'I student' = 'I am a student'. The verb is implied. Adding `есть` would be old-fashioned.",
      "When you'd say 'is/are' in English, Russian usually says nothing. `Это дом` = 'this house' = 'this is a house'. The pause does the work.",
    ],
  },

  // ── Subject pronoun + verb (typical sentence) ──
  {
    id: 'ru-subject-verb',
    priority: 35,
    match: t => /^(Я|Ты|Он|Она|Оно|Мы|Вы|Они|Это)\s+[а-яёА-ЯЁ]+/i.test(t),
    tips: [
      "Russian verbs conjugate by person and number. The endings tell you who's doing the action — but unlike Spanish/Italian, Russian KEEPS the subject pronoun. Don't drop it.",
      "Each verb ending matches a specific person: -ю/-у (I), -ешь/-ёшь (you), -ет/-ёт (he/she), -ем/-ём (we), -ете/-ёте (you pl), -ют/-ут (they). Same shape, six endings.",
      "Subject pronouns in Russian: я / ты / он / она / оно / мы / вы / они. You'll see them at the start of most sentences — that's natural, not redundant.",
    ],
  },

  // ── По-+ language ──
  {
    id: 'ru-po-language',
    priority: 80,
    match: t => /\bпо-(русски|английски|немецки|французски|испански|итальянски|китайски|японски)\b/i.test(t),
    tips: [
      "To say 'in [language]' or 'speak [language]', use `по- + adjective`: `по-русски` (in Russian), `по-английски` (in English). Always lowercase, hyphenated.",
      "`Я говорю по-русски` = 'I speak Russian'. The `по-` adverbial form is different from `русский язык` (Russian language as a noun).",
    ],
  },

  // ── Каждый / весь (every/all) ──
  {
    id: 'ru-kazhdyy-ves',
    priority: 70,
    match: t => /\b(каждый|каждая|каждое|каждые|весь|вся|всё|все|всегда|никогда)\b/i.test(t),
    tips: [
      "`Каждый` (every) and `весь` (all/whole) work like adjectives — match gender, number, case. `Каждый день` (m sg, nominative — every day), `всю ночь` (f sg, accusative — all night).",
      "Frequency adverbs like `всегда` (always) and `никогда` (never) don't change shape. They sit before the verb: `я всегда читаю` (I always read).",
    ],
  },

  // ── Сегодня / Вчера / Завтра ──
  {
    id: 'ru-time-adverb',
    priority: 50,
    match: t => /^(Сегодня|Вчера|Завтра|Сейчас|Утром|Днём|Вечером|Ночью)\b/i.test(t),
    tips: [
      "Time adverbs at the start are common in Russian. `Сегодня` (today), `Вчера` (yesterday), `Завтра` (tomorrow). Unlike German/Dutch V2, Russian doesn't invert after a fronted adverb.",
    ],
  },

  // ── Adjective agreement ──
  {
    id: 'ru-adjective-agreement',
    priority: 65,
    match: t => /\b[а-яёА-ЯЁ]+(ый|ой|ий|ая|яя|ое|ее|ые|ие)\s+[а-яёА-ЯЁ]+/i.test(t),
    tips: [
      "Adjectives must agree with their noun's gender, number, and case. `Красивый дом` (m), `красивая книга` (f), `красивое здание` (n), `красивые книги` (pl). Six endings × six cases = lots to track.",
      "Pick the ending from the noun: dictionary form is masculine `-ый/-ой/-ий`. Add `-ая` for fem, `-ое` for neuter, `-ые` for plural. Then cases shift them again.",
    ],
  },

  // ── Cases — preposition tells you which ──
  {
    id: 'ru-prepositional-case',
    priority: 75,
    match: t => /\b(в|на|о|об|при)\s+[а-яёА-ЯЁ]+(е|и|у)\b/i.test(t),
    tips: [
      "Prepositional case (`-е/-и/-у`) follows `в`, `на`, `о/об`, `при` when expressing location or topic. `в Москве` (in Moscow), `на столе` (on the table).",
      "Same prepositions can also take accusative for direction: `иду в школу` (going to school — acc) vs `я в школе` (I'm at school — prep). Direction vs location.",
    ],
  },

  // ── Genitive after numbers ──
  {
    id: 'ru-genitive-after-numbers',
    priority: 85,
    match: t => /\b(два|две|три|четыре|пять|шесть|семь|восемь|девять|десять|много|мало|несколько|сколько)\s+[а-яёА-ЯЁ]+/i.test(t),
    tips: [
      "Numbers 2/3/4 (and `оба`/`полтора`) take genitive SINGULAR: `два дома` (two houses — house-of). Numbers 5+ take genitive PLURAL: `пять домов` (five of-houses).",
      "Counterintuitive for English: 'two houses' isn't `два домы` — it's `два дома` (genitive singular). Numbers force this case shift even though it sounds like 'two of house'.",
    ],
  },

  // ── Aspect: perfective vs imperfective ──
  {
    id: 'ru-aspect-pair',
    priority: 80,
    match: t => /\b(прочитал|прочитала|написал|написала|сделал|сделала|купил|купила|увидел|увидела|пришёл|пришла|сказал|сказала|поел|поела|выпил|съел|съела)\b/i.test(t),
    tips: [
      "Perfective verb forms (often with prefixes like `по-`, `про-`, `с-`) describe completed, one-time actions: `я прочитал книгу` (I read [and finished] the book). Imperfective for ongoing/repeated.",
      "Every Russian verb comes in a pair: imperfective (process) and perfective (result). `Читать` (be reading) vs `прочитать` (have read). Pick the aspect that matches the situation.",
      "Past tense often signals aspect through the prefix: bare verb (impf, ongoing/habitual) vs prefixed verb (pf, completed). `Я писал письмо` (I was writing) vs `я написал письмо` (I wrote and finished).",
    ],
  },
  {
    id: 'ru-imperfective-habit',
    priority: 70,
    match: t => /\b[а-яёА-ЯЁ]+(л|ла|ло|ли)\b/i.test(t) && /\b(всегда|часто|обычно|иногда|каждый\s+день|каждое\s+утро)\b/i.test(t),
    tips: [
      "Habitual past tense uses imperfective: `я часто ходил в кино` (I often went to the movies). Frequency words like `часто`, `всегда`, `каждый день` signal you want imperfective.",
    ],
  },

  // ── Plural genitive forms ──
  {
    id: 'ru-plural-genitive',
    priority: 65,
    match: t => /\b[а-яёА-ЯЁ]+(ов|ев|ей|ёв)\b/i.test(t),
    tips: [
      "Plural genitive endings: `-ов/-ев` for masculine (домов, мужей), `-ø` for feminine (книг, женщин), `-ø` for neuter (окон). It's the trickiest case to form.",
      "Common context: after `много/мало/нет/сколько` or numbers 5+: `много книг`, `нет проблем`, `пять учителей`. The thing you're counting goes plural genitive.",
    ],
  },

  // ── Reflexive verbs -ся/-сь ──
  {
    id: 'ru-reflexive-sya',
    priority: 80,
    match: t => /\b[а-яёА-ЯЁ]+(ся|сь)\b/i.test(t),
    tips: [
      "Reflexive verbs end in `-ся` (after consonant) or `-сь` (after vowel): `мыться` (to wash oneself), `учиться` (to study), `смеяться` (to laugh). The ending is part of the verb.",
      "Many `-ся` verbs aren't literally reflexive in English: `находиться` (to be located), `улыбаться` (to smile), `надеяться` (to hope). Learn them with the suffix attached.",
    ],
  },

  // ── No articles (fallback — only fires for short SV/SVO sentences w/o other markers) ──
  {
    id: 'ru-no-articles',
    priority: 30,
    match: t => /^(Это|Вот|Тут|Там)\s+/i.test(t),
    tips: [
      "Russian has NO articles (no 'the' or 'a/an'). `Это книга` = 'this [is] a/the book'. The article is left to context and intonation.",
      "Want to emphasize 'this specific one'? Use `этот/эта/это` as a demonstrative. For 'a (one)' use `один/одна`. Otherwise no article.",
    ],
  },

  // ── Animate accusative ──
  {
    id: 'ru-animate-accusative',
    priority: 80,
    match: t => /\b(вижу|видишь|видит|видим|видите|видят|знаю|знаешь|знает|знаем|знаете|знают|люблю|любишь|любит|любим|любите|любят|жду|ждёшь|ждёт|ждут)\s+[а-яёА-ЯЁ]+(а|я|у|ю)\b/i.test(t),
    tips: [
      "For animate masculine nouns (people, animals), the accusative case looks like the genitive: `Я вижу брата` (I see [my] brother — like 'of brother'). Inanimate stays like nominative.",
      "If the word answers 'whom?' and it's a living being, you use the genitive-style ending: `студента`, `мужчину` (acc of mужчина). For things, accusative = nominative for masculine inanimate.",
    ],
  },

  // ── Verbs of motion (идти vs ходить) ──
  {
    id: 'ru-motion-verbs',
    priority: 90,
    match: t => /\b(идти|ходить|ехать|ездить|бежать|бегать|лететь|летать|плыть|плавать|нести|носить|везти|возить|вести|водить|идёт|идут|идёшь|иду|идём|ходит|ходят|едет|едут|еду)\b/i.test(t),
    tips: [
      "Motion verbs come in pairs: one-direction (`идти`, `ехать`) for a single trip in progress, multi-direction (`ходить`, `ездить`) for round trips or habits. `Я иду в школу` (going right now) vs `я хожу в школу` (I attend school).",
      "If the action is happening NOW in one direction → unidirectional (идти/ехать). If it's habitual or round-trip → multidirectional (ходить/ездить). Same English 'go', two Russian verbs.",
    ],
  },

  // ── Dative for indirect object ──
  {
    id: 'ru-dative-indirect',
    priority: 75,
    match: t => /\b(даю|даёшь|даёт|даём|даёте|дают|говорю|говоришь|говорит|пишу|пишешь|пишет|посылаю|посылает|показываю|показывает)\s+[а-яёА-ЯЁ]+(у|ю|е|и|ям|ам)\b/i.test(t),
    tips: [
      "Indirect object (the recipient) goes in dative: `Я даю книгу другу` (I give the book to friend — dative). English uses 'to'; Russian uses case endings.",
      "Dative endings: masculine/neuter -у/-ю, feminine -е/-и, plurals -ам/-ям. Pronouns: мне/тебе/ему/ей/нам/вам/им. Learn them as fixed forms.",
    ],
  },

  // ── Чтобы + infinitive (purpose) ──
  {
    id: 'ru-chtoby-purpose',
    priority: 90,
    match: t => /\bчтобы\b/i.test(t),
    tips: [
      "`чтобы + infinitive` = 'in order to': `Я учусь, чтобы говорить по-русски` (I study to speak Russian). Same subject in both halves of the sentence → infinitive.",
      "Different subjects → `чтобы + past tense`: `Я хочу, чтобы ты пришёл` (I want you to come — literally 'that you came'). Past tense even though the action is hypothetical.",
    ],
  },

  // ── Negative + genitive ──
  {
    id: 'ru-negative-genitive',
    priority: 80,
    match: t => /\b(нет|не\s+было|не\s+будет)\s+[а-яёА-ЯЁ]+(а|я|и|ы|ов|ев)\b/i.test(t),
    tips: [
      "Negation flips the object to genitive: `у меня нет книги` (I don't have a book — book in genitive). `Нет`, `не было`, `не будет` all take genitive.",
      "Positive: `у меня есть книга` (I have a book — nominative). Negative: `у меня нет книги` (no book — genitive). The case shift signals the negation.",
    ],
  },

];
