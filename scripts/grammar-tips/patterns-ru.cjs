/** Russian grammar-tip patterns
 *  IMPORTANT: JavaScript `\b` doesn't work with Cyrillic (ASCII boundaries only).
 *  Use `(?:^|\s|[«»"'(,.;:!?-])` for "start of word" and `(?=\s|$|[.,!?»"';:)-])` for "end of word".
 *  Or use lookbehind/lookahead with [а-яёА-ЯЁ].
 */

// Boundary helpers
const SB = '(?:^|[^а-яёА-ЯЁ])'; // start boundary
const EB = '(?=[^а-яёА-ЯЁ]|$)';   // end boundary

module.exports = [

  // ── No "to be" in present tense ──
  {
    id: 'ru-no-byt-present',
    priority: 90,
    match: t => /^[А-ЯЁ][а-яё]*\s+[а-яё]+\.?$/i.test(t) && !/(^|\s)есть(\s|$)/i.test(t),
    tips: [
      "Russian doesn't use 'to be' in the present: `Я студент` literally = 'I student' = 'I am a student'. The verb is implied. Adding `есть` would be old-fashioned.",
      "When you'd say 'is/are' in English, Russian usually says nothing. `Это дом` = 'this house' = 'this is a house'. The pause does the work.",
      "Skip the copula in present. `Он врач` (he doctor = he is a doctor), `она дома` (she at home = she is at home). It's not broken — it's the rule.",
      "Russian present tense of 'to be' is essentially silent. Past uses `был/была/было/были`, future uses `буду/будешь/...` — but right now, nothing.",
    ],
  },

  // ── Меня зовут — name idiom ──
  {
    id: 'ru-menya-zovut',
    priority: 95,
    match: t => /Меня\s+зовут|Тебя\s+зовут|Его\s+зовут|Её\s+зовут|Нас\s+зовут|Вас\s+зовут|Их\s+зовут|Как\s+(тебя|вас)\s+зовут/i.test(t),
    tips: [
      "`Меня зовут Олег` literally = 'me they-call Oleg' = 'My name is Oleg'. Russian uses a passive-style construction with the accusative pronoun.",
      "The person is in ACCUSATIVE (меня, тебя, его, её, нас, вас, их), not nominative. `Зовут` = 'they call' — an unspecified plural subject.",
      "Asking: `Как тебя зовут?` (informal) or `Как вас зовут?` (formal). Literally 'How do they call you?'. The name comes back: `Меня зовут [name]`.",
      "Compare: `Я Олег` (I'm Oleg — short intro) vs `Меня зовут Олег` (My name is Oleg — full formal intro). Both work, second is more polite.",
    ],
  },

  // ── Subject pronoun + verb (low priority catch) ──
  {
    id: 'ru-subject-verb',
    priority: 35,
    match: t => /^(Я|Ты|Он|Она|Оно|Мы|Вы|Они|Это)\s+[а-яёА-ЯЁ]+/i.test(t),
    tips: [
      "Russian verbs conjugate by person and number, but unlike Spanish or Italian, Russian KEEPS the subject pronoun. Don't drop it — `читаю` alone sounds incomplete.",
      "Six endings to learn: -ю/-у (я), -ешь/-ёшь (ты), -ет/-ёт (он/она), -ем/-ём (мы), -ете/-ёте (вы), -ют/-ут (они). One verb, six shapes.",
      "Subject pronouns in Russian: я / ты / он / она / оно / мы / вы / они. You'll see them at the start of most sentences — natural, not redundant.",
      "Russian belongs to a different group than Spanish/Italian — pronouns aren't optional. They mark the topic; ending agreement is extra confirmation.",
    ],
  },

  // ── 3sg verb endings -ет/-ит/-ёт ──
  {
    id: 'ru-3sg-verb',
    priority: 40,
    match: t => /[а-яё]+(ет|ит|ёт)(\s|[.,!?]|$)/i.test(t) && !/^(Я|Ты|Мы|Вы|Они)\s/i.test(t),
    tips: [
      "3rd-person singular endings: `-ет` (first conjugation: читает, делает), `-ит` (second conjugation: говорит, смотрит). Tells you 'he/she/it' is doing it.",
      "Two conjugations to remember: I (`-ешь/-ет/-ем/-ете/-ют`) — most verbs; II (`-ишь/-ит/-им/-ите/-ат/-ят`) — verbs in `-ить` and some in `-еть/-ать`.",
      "You can guess conjugation from the infinitive: `-ать/-ять/-овать/-еть` mostly → I; `-ить` and some `-еть/-ать` → II. Memorize the exceptions.",
      "Stressed `-ёт` is just `-ет` with stress: `идёт`, `поёт`. The dots mark stress — important for pronunciation.",
    ],
  },

  // ── 3pl verb endings -ют/-ут/-ят/-ат ──
  {
    id: 'ru-3pl-verb',
    priority: 40,
    match: t => /[а-яё]+(ют|ут|ят|ат)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "3rd-person plural endings: `-ют/-ут` (first conjugation: читают, идут), `-ят/-ат` (second conjugation: говорят, кричат). 'They' do it.",
      "These plural endings also appear when speaking about an unspecified group: `говорят, что...` = 'they say that...' (people in general).",
      "Hard consonant before ending? Likely `-ут/-ат`. Soft (vowel-like)? Likely `-ют/-ят`. The spelling rule follows from the stem's consonant.",
      "Watch for impersonal usage: `звонят в дверь` (someone's ringing the door — literally 'they ring'). Plural verb, no real subject mentioned.",
    ],
  },

  // ── По-+ language ──
  {
    id: 'ru-po-language',
    priority: 80,
    match: t => /по-(русски|английски|немецки|французски|испански|итальянски|китайски|японски|арабски|португальски)/i.test(t),
    tips: [
      "To say 'in [language]' or 'speak [language]', use `по- + adjective`: `по-русски` (in Russian), `по-английски` (in English). Lowercase, hyphenated.",
      "`Я говорю по-русски` = 'I speak Russian'. The `по-` adverbial form differs from `русский язык` (the Russian language as a noun).",
      "After verbs of speaking, reading, writing → use `по-русски` style. After 'know' or 'study' → use `русский язык`. Two grammars, one meaning.",
      "Always lowercase: `по-французски` not `По-Французски`. And no space — the hyphen sticks it to the adjective stem.",
    ],
  },

  // ── Каждый / весь ──
  {
    id: 'ru-kazhdyy-ves',
    priority: 70,
    match: t => /(^|\s)(каждый|каждая|каждое|каждые|каждого|каждый\s+день|каждое\s+утро|весь|вся|всё|все|всю|всем|всему|всегда|никогда)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "`Каждый` (every) and `весь` (all/whole) act like adjectives — match gender, number, case. `Каждый день` (m, nom), `всю ночь` (f, acc).",
      "Frequency adverbs `всегда` (always), `никогда` (never) don't change shape. They sit before the verb: `я всегда читаю`.",
      "`Никогда не` — Russian doubles up on negatives. `Я никогда не был там` (I never not have-been there). Don't drop the `не`; it's required.",
      "`Весь/вся/всё/все` covers 'all', 'the whole', 'everyone', 'everything' depending on form. Context + ending tells you which.",
    ],
  },

  // ── Time adverbs at start ──
  {
    id: 'ru-time-adverb',
    priority: 50,
    match: t => /^(Сегодня|Вчера|Завтра|Сейчас|Утром|Днём|Вечером|Ночью|Позавчера|Послезавтра)(\s|[.,!?])/i.test(t),
    tips: [
      "Time adverbs at sentence start are common in Russian. `Сегодня` (today), `Вчера` (yesterday), `Завтра` (tomorrow). Unlike German V2, Russian doesn't invert after a fronted adverb.",
      "Times of day are already in instrumental case: `утром` (in the morning), `днём` (in the daytime), `вечером` (in the evening), `ночью` (at night). One word, no preposition needed.",
      "Word order is flexible: `Сегодня я работаю` and `Я сегодня работаю` both mean 'today I work'. Fronting emphasizes 'when'.",
      "For 'in the morning/afternoon/evening', Russian uses the instrumental case of the noun — no preposition. `Утром` = literally 'by/with morning'.",
    ],
  },

  // ── Adjective agreement ──
  {
    id: 'ru-adjective-agreement',
    priority: 65,
    match: t => /[а-яёА-ЯЁ]+(ый|ой|ий|ая|яя|ое|ее|ые|ие|ого|ому|ыми|ими|ой|ей|ую|юю|ых|их)(\s)[а-яёА-ЯЁ]+/i.test(t),
    tips: [
      "Adjectives must agree with their noun's gender, number, AND case. `Красивый дом` (m), `красивая книга` (f), `красивое здание` (n), `красивые книги` (pl).",
      "Dictionary form is masculine `-ый/-ой/-ий`. Swap to `-ая` for feminine, `-ое` for neuter, `-ые` for plural. Then cases shift the endings again.",
      "Soft adjectives (-ний type, e.g. `синий`) and hard (-ный, e.g. `красный`) follow different paradigms. Look at the consonant before the ending.",
      "Adjective comes BEFORE the noun, like English. `Большой стол` (big table), not `стол большой` (which sounds like 'the table is big' — predicate).",
    ],
  },

  // ── Prepositional case ──
  {
    id: 'ru-prepositional-case',
    priority: 75,
    match: t => /(^|\s)(в|во|на|о|об|при)\s+[а-яёА-ЯЁ]+(е|и|у|ах|ях)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Prepositional case (`-е/-и/-у`) follows `в`, `на`, `о/об`, `при` for location or topic. `в Москве` (in Moscow), `на столе` (on the table).",
      "Same prepositions can take accusative for direction: `иду в школу` (going to school — acc) vs `я в школе` (at school — prep). Direction vs location.",
      "Prepositional NEVER appears without a preposition — that's why it's called 'prepositional'. The case literally requires one.",
      "Topic with `о/об`: `думаю о доме` (thinking about home). `Об` before vowels (`об этом`), `о` before consonants (`о тебе`).",
    ],
  },

  // ── Genitive after numbers ──
  {
    id: 'ru-genitive-after-numbers',
    priority: 85,
    match: t => /(^|\s)(два|две|три|четыре|пять|шесть|семь|восемь|девять|десять|двадцать|тридцать|сорок|пятьдесят|сто|много|мало|несколько|сколько)\s+[а-яёА-ЯЁ]+/i.test(t),
    tips: [
      "Numbers 2/3/4 (and `оба`/`полтора`) take genitive SINGULAR: `два дома` (two houses — house-of). Numbers 5+ take genitive PLURAL: `пять домов`.",
      "Counterintuitive for English: 'two houses' isn't `два домы` — it's `два дома` (gen sg). Numbers force this case shift.",
      "`Много`, `мало`, `сколько`, `несколько` (much, little, how many, several) ALL take genitive plural: `много книг`, `мало времени`.",
      "Числа `2/3/4` are special: gen sg even for 22, 23, 24, 32, etc. — anything ending in 2/3/4 (except 12/13/14). `Двадцать два дня`.",
    ],
  },

  // ── Aspect — perfective verbs ──
  {
    id: 'ru-aspect-pair',
    priority: 80,
    match: t => /(^|\s)(прочитал|прочитала|написал|написала|сделал|сделала|купил|купила|увидел|увидела|пришёл|пришла|сказал|сказала|поел|поела|выпил|съел|съела|приехал|приехала|ушёл|ушла|закончил|закончила|открыл|открыла|закрыл|закрыла|посмотрел|посмотрела|позвонил|позвонила|приготовил|приготовила|вернулся|вернулась)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Perfective verb forms (often with prefixes like `по-`, `про-`, `с-`, `на-`) describe completed, one-time actions: `я прочитал книгу` (I read [and finished] the book).",
      "Every Russian verb comes in a pair: imperfective (process) and perfective (result). `Читать` (be reading) vs `прочитать` (have read). Pick by situation.",
      "Past tense often signals aspect by the prefix: bare verb (impf, ongoing) vs prefixed verb (pf, completed). `Я писал письмо` (I was writing) vs `я написал письмо` (I wrote and finished).",
      "Aspect ≠ tense. Both imperfective and perfective have past, present, future forms — but perfective present is actually future-meaning. `Напишу` = 'I will (have) written'.",
    ],
  },

  // ── Habitual past ──
  {
    id: 'ru-imperfective-habit',
    priority: 70,
    match: t => /[а-яё]+(л|ла|ло|ли)(\s|[.,!?])/i.test(t) && /(^|\s)(всегда|часто|обычно|иногда|каждый\s+день|каждое\s+утро|регулярно|редко)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Habitual past uses imperfective: `я часто ходил в кино` (I often went to the movies). Frequency words `часто`, `всегда`, `каждый день` signal imperfective.",
      "If something happened repeatedly or as a habit → imperfective. If it happened once and completed → perfective. The frequency adverb is your clue.",
      "Compare: `Я читал книгу` (I was reading / used to read) vs `я прочитал книгу` (I read and finished it). Same English 'read', two Russian forms.",
      "Past tense forms agree with the SUBJECT's gender/number, not the speaker: `она читала`, `он читал`, `они читали`. The `-л/-ла/-ло/-ли` ending shifts.",
    ],
  },

  // ── Reflexive -ся/-сь ──
  {
    id: 'ru-reflexive-sya',
    priority: 75,
    match: t => /[а-яё]+(ся|сь)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Reflexive verbs end in `-ся` (after consonant) or `-сь` (after vowel): `мыться` (wash oneself), `учиться` (study), `смеяться` (laugh). The ending is part of the verb.",
      "Many `-ся` verbs aren't literally reflexive in English: `находиться` (be located), `улыбаться` (smile), `надеяться` (hope). Learn them with the suffix.",
      "`-ся` is a shortened `себя` (oneself) glued onto the verb. It never moves: `я моюсь`, `ты моешься`, `он моется`. The form changes only at the verb part.",
      "Sometimes `-ся` adds reciprocal meaning: `встречаться` (meet each other), `целоваться` (kiss each other). Two people doing it to each other.",
    ],
  },

  // ── No articles — это/вот ──
  {
    id: 'ru-no-articles',
    priority: 30,
    match: t => /^(Это|Вот|Тут|Там)\s+/i.test(t),
    tips: [
      "Russian has NO articles (no 'the' or 'a/an'). `Это книга` = 'this [is] a/the book'. The article is left to context and intonation.",
      "Want to emphasize 'this specific one'? Use `этот/эта/это` as a demonstrative. For 'one' (a specific one) use `один/одна/одно`. Otherwise nothing.",
      "Word order can replace articles: new/indefinite info tends to come LATER in the sentence, definite info comes earlier. `Книга на столе` (the book is on the table) vs `на столе книга` (there's a book on the table).",
      "Skip `the`/`a` entirely in translation — adding them in Russian is grammatically impossible. Get used to bare nouns.",
    ],
  },

  // ── Animate accusative ──
  {
    id: 'ru-animate-accusative',
    priority: 80,
    match: t => /(^|\s)(вижу|видишь|видит|видим|видите|видят|знаю|знаешь|знает|знаем|знаете|знают|люблю|любишь|любит|любим|любите|любят|жду|ждёшь|ждёт|ждут|встречаю|встречает|приглашаю|пригласил|пригласила|спросил|спросила)\s+[а-яёА-ЯЁ]+(а|я|у|ю)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Animate masculine nouns (people, animals) in accusative look like genitive: `Я вижу брата` (I see brother — like 'of brother'). Inanimate stays nominative-shaped.",
      "If it answers 'whom?' and is a living being, use the genitive-style ending: `студента`, `мужчину`. For things, accusative = nominative for masc inanimate.",
      "Feminine doesn't care about animacy in the accusative singular: `женщину`, `книгу` — both end in `-у/-ю` regardless. The rule applies to masc + all plurals.",
      "All animate plurals (any gender) take accusative = genitive: `вижу студентов`, `вижу женщин`. Inanimates plural use nominative shape.",
    ],
  },

  // ── Motion verbs ──
  {
    id: 'ru-motion-verbs',
    priority: 85,
    match: t => /(^|\s)(идти|ходить|ехать|ездить|бежать|бегать|лететь|летать|плыть|плавать|нести|носить|везти|возить|вести|водить|идёт|идут|идёшь|иду|идём|идёте|ходит|ходят|хожу|ходишь|ходим|ходите|едет|едут|еду|едешь|едем|едете|летит|летят|лечу|летишь|плывёт|плывут|бежит|бегут|бегу|бегаю|бегает|бегают|ходил|ходила|ходили|ездил|ездила|ездили|ехал|ехала|ехали|шёл|шла|шли)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Motion verbs come in pairs: unidirectional (`идти`, `ехать`) for one-way trip in progress, multidirectional (`ходить`, `ездить`) for round trips or habits.",
      "`Я иду в школу` (going right now, single trip) vs `я хожу в школу` (I attend school, regularly). Same English 'go', two Russian verbs.",
      "Walking vs vehicle: `идти/ходить` for on foot, `ехать/ездить` for any vehicle. Russian distinguishes how you move, English doesn't.",
      "Add prefixes for more nuance: `при-` (arrive), `у-` (leave), `пере-` (cross), `до-` (reach). `Прихожу домой` (I arrive home), `ухожу` (I leave).",
    ],
  },

  // ── Dative indirect ──
  {
    id: 'ru-dative-indirect',
    priority: 75,
    match: t => /(^|\s)(мне|тебе|ему|ей|нам|вам|им)(\s|[.,!?])/i.test(t),
    tips: [
      "Dative pronouns: мне/тебе/ему/ей/нам/вам/им. Used for the recipient ('to me'), age ('I'm 20 = мне 20'), and impersonal feeling ('I'm cold = мне холодно').",
      "Indirect object goes dative: `Я даю книгу другу` (I give the book to friend). English 'to' = Russian dative ending.",
      "Many verbs require dative without 'to': `помогать` (help), `звонить` (phone), `советовать` (advise), `мешать` (disturb). `Помогаю маме` (I help mom).",
      "Impersonal expressions of feeling/state always use dative: `мне холодно/тепло/грустно/весело/больно`. The person experiencing goes in dative.",
    ],
  },

  // ── Чтобы ──
  {
    id: 'ru-chtoby-purpose',
    priority: 90,
    match: t => /(^|\s)чтобы(\s|[.,!?])/i.test(t),
    tips: [
      "`чтобы + infinitive` = 'in order to': `Я учусь, чтобы говорить по-русски` (I study to speak Russian). Same subject in both halves → infinitive.",
      "Different subjects → `чтобы + past tense`: `Я хочу, чтобы ты пришёл` (I want you to come — literally 'that you came'). Past tense even though hypothetical.",
      "`Чтобы` always introduces purpose or desire. After verbs of wanting/asking/ordering with a different subject in the subordinate clause, it's required.",
      "Don't confuse `чтобы` (purpose/desire) with `что` (statement). `Я знаю, что он пришёл` (I know that he came — fact) vs `я хочу, чтобы он пришёл` (I want him to come — wish).",
    ],
  },

  // ── Negative + genitive ──
  {
    id: 'ru-negative-genitive',
    priority: 80,
    match: t => /(^|\s)(нет|не\s+было|не\s+будет)\s+[а-яёА-ЯЁ]+(а|я|и|ы|ов|ев|ей)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Negation flips the object to genitive: `у меня нет книги` (I don't have a book — book in genitive). `Нет`, `не было`, `не будет` all take genitive.",
      "Positive: `у меня есть книга` (I have a book — nom). Negative: `у меня нет книги` (no book — gen). The case shift signals the negation.",
      "`Нет` is short for `не есть` — 'there is not'. The thing that doesn't exist must be in the genitive (the case of absence).",
      "Time too: `Меня не было дома` (I wasn't home — literally 'of-me not was at home'). The subject of non-existence goes genitive.",
    ],
  },

  // ── Instrumental case ──
  {
    id: 'ru-instrumental',
    priority: 78,
    match: t => /(^|\s)(с|со)\s+[а-яёА-ЯЁ]+(ом|ем|ой|ей|ью|ами|ями)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Instrumental case marks the tool, means, or accompaniment: `пишу карандашом` (write with pencil), `еду с другом` (go with a friend). Endings: -ом/-ем (m/n), -ой/-ей (f), -ью (f soft), -ами/-ями (pl).",
      "After `с` (with), the noun goes instrumental: `с братом`, `с сестрой`, `с друзьями`. Without `с`, instrumental marks the instrument itself.",
      "Professions in instrumental: `работаю учителем` (I work as a teacher). When you 'become' or 'be' something in professional sense, use instrumental.",
      "Times of day are already instrumental: `утром` (in the morning), `вечером` (in the evening). No preposition — the case carries the meaning.",
    ],
  },

  // ── Possession У + person ──
  {
    id: 'ru-u-possession',
    priority: 88,
    match: t => /(^|\s)У\s+(меня|тебя|него|неё|нас|вас|них|[а-яёА-ЯЁ]+(а|я|ы|и))\s+(есть|нет|был|была|было|были|будет|будут)/i.test(t),
    tips: [
      "Russian doesn't really have 'to have' — it uses `у + genitive` + `есть` (there is). `У меня есть книга` = 'at me there-is book' = 'I have a book'.",
      "Negative drops `есть` and switches to `нет`: `У меня нет книги` (I don't have a book). The object goes genitive after `нет`.",
      "Past: `у меня была книга` (I had a book). Future: `у меня будет книга` (I will have a book). `Был/была/было/были` agrees with the THING owned.",
      "Pronouns after `у`: меня/тебя/него/неё/нас/вас/них (genitive forms). `У него` (he has), `у неё` (she has). The owner is in genitive.",
    ],
  },

  // ── Modal надо/нужно/нельзя ──
  {
    id: 'ru-modal-nado',
    priority: 80,
    match: t => /(^|\s)(надо|нужно|нельзя|можно|должен|должна|должно|должны)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "`Надо` and `нужно` = 'need to / should'. Person goes dative: `Мне надо идти` (I need to go — literally 'to-me necessary to-go'). The 'subject' is in dative.",
      "`Можно` (one can/may) and `нельзя` (one can't/may not) are impersonal: `Здесь можно курить?` (Can one smoke here?). No subject needed.",
      "`Должен/должна/должно/должны` (must/should) DOES agree with the subject in gender/number: `Я должен идти` (m), `она должна идти` (f).",
      "Negative obligation: `не надо` (don't need) vs `нельзя` (forbidden). Big difference: `не надо` = it's unnecessary, `нельзя` = it's not allowed.",
    ],
  },

  // ── Нравиться ──
  {
    id: 'ru-nravitsya',
    priority: 85,
    match: t => /(^|\s)(нравится|нравятся|нравился|нравилась|нравилось|нравились|понравился|понравилась|понравилось)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "`Нравиться` flips the subject and object: `Мне нравится книга` literally = 'to-me appeals book' = 'I like the book'. The thing liked is the GRAMMATICAL subject.",
      "Person who likes goes dative (мне, тебе, ему, ей, нам, вам, им). The verb agrees with what's LIKED, not the liker: `нравится` (sg) vs `нравятся` (pl).",
      "Past tense agrees with the liked thing too: `Мне нравилась эта песня` (I liked this song — agrees with song, fem). Gender follows the object.",
      "`Любить` (to love) works normally — subject = liker, object = liked: `Я люблю кофе`. Use `нравиться` for 'like', `любить` for 'love'.",
    ],
  },

  // ── Conditional бы ──
  {
    id: 'ru-conditional-by',
    priority: 88,
    match: t => /(^|\s)бы(\s|[.,!?]|$)/i.test(t),
    tips: [
      "`Бы + past tense` = conditional/subjunctive: `Я хотел бы пойти` (I would like to go), `если бы я знал` (if I knew). Past form even when meaning is hypothetical.",
      "`Бы` can sit anywhere after the verb or pronoun: `Я бы пошёл`, `я пошёл бы`, `пошёл бы я`. Position is flexible — meaning stays the same.",
      "`Если бы + past, ... бы + past` = 'if ... then would ...': `Если бы я знал, я бы пришёл` (If I had known, I would have come). Both halves take бы.",
      "Polite requests use бы: `Я хотел бы` (I would like — softer than `я хочу`). Adding бы to a wish softens it considerably.",
    ],
  },

  // ── Imperative ──
  {
    id: 'ru-imperative',
    priority: 82,
    match: t => /^(Иди|Идите|Скажи|Скажите|Говори|Говорите|Читай|Читайте|Пиши|Пишите|Слушай|Слушайте|Смотри|Смотрите|Дай|Дайте|Бери|Берите|Купи|Купите|Открой|Откройте|Закрой|Закройте|Извини|Извините|Помоги|Помогите|Подожди|Подождите|Покажи|Покажите|Принеси|Принесите|Сделай|Сделайте|Приходи|Приходите|Позвоните|Позвони|Расскажи|Расскажите)/i.test(t),
    tips: [
      "Imperative is formed from the present-tense stem + ending: `-и/-й` for singular (ты), `-ите/-йте` for plural/formal (вы). `Читай → читайте`.",
      "Use `ты`-form with friends/family/kids, `вы`-form for strangers, groups, or formality. The plural -ите ending also marks politeness.",
      "Negative imperatives usually use imperfective: `Не делай так` (don't do it like that). Perfective negative imperative is rarer and usually a warning: `Не упади!`.",
      "Some imperatives are irregular: `дать → дай`, `есть → ешь`. Memorize the common ones; they appear constantly in everyday speech.",
    ],
  },

  // ── Свой ──
  {
    id: 'ru-svoy',
    priority: 82,
    match: t => /(^|\s)(свой|своя|своё|свои|своего|своей|своих|своему|своим|свою)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "`Свой` (one's own) refers back to the SUBJECT, regardless of person. `Он любит свою жену` (he loves his [own] wife). Use `свой` when subject = owner.",
      "If you used `его жену` instead, it would mean 'someone else's wife'. `Свой` clarifies that it's the subject's own.",
      "`Свой` agrees with the noun it modifies in gender/number/case, just like other possessives. `Свой дом` (m), `своя машина` (f), `своё окно` (n).",
      "First and second person can use either: `я люблю мою/свою жену` are both fine. Third person almost always needs `свой` for clarity.",
    ],
  },

  // ── Question words ──
  {
    id: 'ru-question-words',
    priority: 70,
    match: t => /^(Кто|Что|Где|Когда|Почему|Зачем|Как|Какой|Какая|Какое|Какие|Сколько|Откуда|Куда|Чей|Чья|Чьё|Чьи)(\s|[.,!?])/i.test(t),
    tips: [
      "Question words start the sentence: кто (who), что (what), где (where), когда (when), почему (why), как (how), сколько (how much), куда (where to), откуда (from where).",
      "`Где` vs `куда` vs `откуда`: location vs destination vs origin. `Где ты?` (Where are you?) vs `куда ты идёшь?` (Where are you going?). English uses 'where' for both.",
      "`Почему` (why-cause) vs `зачем` (why-purpose). `Почему ты плачешь?` (why are you crying — what caused this?) vs `зачем ты пришёл?` (why did you come — what for?).",
      "`Какой` (which/what kind) agrees with the noun: какой день, какая книга, какое окно, какие люди. Like an adjective in form.",
    ],
  },

  // ── Если + future ──
  {
    id: 'ru-esli-future',
    priority: 78,
    match: t => /(^|\s)если(\s|[.,!?])/i.test(t),
    tips: [
      "`Если + future tense` for real conditions: `Если будет дождь, я останусь дома` (If it rains, I'll stay home). Both halves go in future.",
      "Unlike English ('if it rains' — present), Russian uses future in both clauses for real future conditions.",
      "For hypothetical/unreal conditions, switch to `если бы + past`: `Если бы шёл дождь, я остался бы дома` (If it were raining, I would stay home).",
      "Don't confuse `если` (if — condition) with `ли` (whether — indirect question). `Я не знаю, придёт ли он` (I don't know whether he'll come).",
    ],
  },

  // ── Который ──
  {
    id: 'ru-kotoryy',
    priority: 75,
    match: t => /(^|\s)(который|которая|которое|которые|которого|которой|которому|которым|которой|которых|которыми)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "`Который` (who/which/that) is the relative pronoun. It agrees with its noun in gender/number, but its case depends on its role IN the relative clause.",
      "`Книга, которую я читаю` (the book that I'm reading — `книгу` is feminine, accusative because it's the object of `читаю`).",
      "Compare: `Мужчина, который пришёл` (the man who came — nominative, subject) vs `мужчина, которого я знаю` (the man whom I know — accusative).",
      "Put a comma before `который` (Russian punctuation rule). The clause is set off by commas on both sides if it's in the middle.",
    ],
  },

  // ── Себя ──
  {
    id: 'ru-sebya',
    priority: 80,
    match: t => /(^|\s)(себя|себе|собой|собою)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "`Себя` (oneself) refers back to the subject — any person, any gender. Same form regardless: `я знаю себя` (I know myself), `он знает себя` (he knows himself).",
      "Cases of себя: gen/acc `себя`, dat/prep `себе`, instr `собой`. No nominative — you can't be the subject AND the object of yourself.",
      "Use `себя` for the object position; use the reflexive suffix `-ся` if the verb has a reflexive form: `мыться` (wash oneself) vs `мыть себя` (which sounds odd).",
      "Common idioms: `у себя` (at one's place), `с собой` (with oneself / for takeaway), `по себе` (according to one's self).",
    ],
  },

  // ── Time expressions ──
  {
    id: 'ru-time-expr',
    priority: 70,
    match: t => /(^|\s)(в|через|после)\s+(час|два\s+часа|три\s+часа|четыре\s+часа|пять\s+часов|шесть\s+часов|семь\s+часов|восемь\s+часов|девять\s+часов|десять\s+часов|неделю|месяц|год|минуту|секунду)(\s|[.,!?]|$)/i.test(t) || /(^|\s)в\s+(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Telling time uses `в + accusative`: `в час` (at one o'clock), `в два часа` (at two), `в пять часов` (at five). Hours follow the gen-sg/gen-pl number rules.",
      "Days of the week with `в + accusative`: `в понедельник` (on Monday), `в среду` (on Wednesday). Always `в` for days, never `на`.",
      "`Через + accusative` = 'in X time' (future from now): `через час` (in an hour), `через неделю` (in a week). For 'after X', use `после + genitive`.",
      "Months with `в + prepositional`: `в январе` (in January), `в марте` (in March). Different preposition logic from days — annoying but consistent.",
    ],
  },

  // ── Possessive adjectives ──
  {
    id: 'ru-possessive',
    priority: 60,
    match: t => /(^|\s)(мой|моя|моё|мои|моего|моей|моих|твой|твоя|твоё|твои|твоего|твоей|твоих|наш|наша|наше|наши|нашего|нашей|наших|ваш|ваша|ваше|ваши|вашего|вашей|ваших|его|её|их)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Possessives agree with the OWNED noun: `мой брат` (m), `моя сестра` (f), `моё окно` (n), `мои книги` (pl). Endings shift by gender, number, case.",
      "`Его/её/их` (his/her/their) DON'T change — they're fixed forms regardless of what's owned. `Его дом`, `его машина`, `его книги` — all `его`.",
      "Possessives precede the noun: `мой дом`, not `дом мой`. Putting it after sounds emphatic or poetic.",
      "For 'whose?', ask `чей/чья/чьё/чьи?` — same gender/number agreement: `чей это дом?` (whose house is this?).",
    ],
  },

  // ── Ты vs Вы (formal/informal you + plural) ─────────────────────
  {
    id: 'ru-ty-vy-formal',
    priority: 88,
    match: t => /(^|\s|[.,!?])(ты|вы|тебя|вас|тебе|вам|тобой|вами|твой|твоя|твоё|твои|ваш|ваша|ваше|ваши)(\s|[.,!?]|$)/i.test(t),
    tips: [
      "Russian has TWO 'you's: `ты` (informal — family, friends, kids) and `вы` (formal — strangers, elders, work, AND plural for everyone). They use DIFFERENT verb forms: `ты говоришь` vs `вы говорите`.",
      "`Вы` is BOTH the formal singular and the plural — context tells you which. Verbs always conjugate as plural with `вы` even when addressing one person formally. Writing `Вы` with a capital is polite (especially in letters).",
      "Default to `вы` with adults you don't know well. Russians are stricter about this than English speakers — wrong `ты` can sound rude. Wait for them to suggest `давай на ты` (let's switch to ты).",
      "Possessives shift too: `твой` (your, informal) vs `ваш` (your, formal/plural). And the cases: `тебя/тебе/тобой` (informal) vs `вас/вам/вами` (formal/plural).",
    ],
  },

  // ── Gender of inanimate nouns (predictable from ending) ─────
  {
    id: 'ru-gender-nouns',
    priority: 45,
    match: t => /(^|\s)(этот|эта|это|эти|тот|та|то|те|мой|моя|моё|мои|твой|твоя|твоё|твои|наш|наша|наше|наши|ваш|ваша|ваше|ваши)\s+[а-яёА-ЯЁ]+/i.test(t),
    tips: [
      "Russian has THREE genders. Unlike Spanish or German, gender is PREDICTABLE from the noun's ending: consonant → masc (дом, стол), `-а/-я` → fem (книга, неделя), `-о/-е` → neuter (окно, поле). Easy to guess.",
      "Adjectives and demonstratives agree with gender + number: `этот дом` (m), `эта книга` (f), `это окно` (n), `эти дома/книги/окна` (pl). One word, four forms.",
      "Exceptions: nouns ending in `-ь` can be either masc or fem — `день` (day, m), `ночь` (night, f). Memorize these. Some `-а` nouns are masc by meaning: `папа`, `дядя`, `мужчина`.",
      "Past tense verbs ALSO agree with the subject's gender: `он читал` (m), `она читала` (f), `оно читало` (n). Adjectives, pronouns, and past verbs — all visibly gendered.",
    ],
  },

  // ── Double negative is mandatory ────────────────────────────
  {
    id: 'ru-double-negative',
    priority: 60,
    match: t => /(^|\s)(никогда|никто|никого|никому|ничто|ничего|ничему|нигде|никуда|ниоткуда|ни\s+один|ни\s+одного|никакой)\b/i.test(t),
    tips: [
      "Russian REQUIRES the double negative — even though English avoids it. `Я никогда не был там` (literally 'I never not was there') = 'I've never been there'. Drop the `не` and the sentence is broken.",
      "All negative pronouns and adverbs need BOTH the `ни-` word AND `не` before the verb: `никто не пришёл` (nobody not came = nobody came), `ничего не видел` (nothing not saw = saw nothing).",
      "English rule 'two negatives make a positive' does NOT apply in Russian. The `ни-` word and the `не` work TOGETHER to express a single negation. They reinforce, not cancel.",
      "List of negative words: `никто` (nobody), `ничто/ничего` (nothing), `никогда` (never), `нигде` (nowhere), `никуда` (to-nowhere), `никакой` (no kind of). All need `не` with the verb.",
    ],
  },

];
