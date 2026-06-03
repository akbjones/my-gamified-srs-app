#!/usr/bin/env node
/**
 * Add contextual grammar tips to Russian deck cards that lack them.
 * Target: ~261 new tips to reach 35% coverage.
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'russian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const tipPools = {
  'node-01': [
    "Russian has no articles (a/the) – context determines definiteness.",
    "Russian word order is flexible but SVO is neutral; changing order shifts emphasis.",
    "The verb 'to be' (быть) is omitted in present tense: Я студент (I [am] a student).",
    "Я (I), ты (you informal), он/она/оно (he/she/it), мы (we), вы (you formal/plural), они (they).",
    "Russian has three genders: masculine, feminine, and neuter – learn gender with every noun.",
    "Masculine nouns typically end in a consonant, feminine in -а/-я, neuter in -о/-е.",
    "Stress in Russian is unpredictable and changes meaning: за́мок (castle) vs замо́к (lock).",
    "Russian uses the Cyrillic alphabet – some letters look like Latin but sound different (Р = R, not P).",
    "Pronouns change form by case: я → меня (genitive/accusative), мне (dative), мной (instrumental).",
  ],
  'node-02': [
    "First conjugation verbs end in -ать/-ять/-еть: читать → читаю, читаешь, читает.",
    "Second conjugation verbs end in -ить: говорить → говорю, говоришь, говорит.",
    "Some verbs mix conjugations – these must be memorized: хотеть (я хочу, ты хочешь, они хотят).",
    "The second conjugation endings are: -ю/-у, -ишь, -ит, -им, -ите, -ят/-ат.",
    "Stress shifts are common in conjugation: писа́ть → пишу́, пи́шешь (stress moves).",
    "Some second conjugation verbs have consonant changes: любить → люблю (б → бл in first person).",
    "Verbs ending in -жать, -чать, -шать, -щать follow first conjugation despite the -ать ending.",
    "Knowing which conjugation a verb follows is essential for correct endings.",
  ],
  'node-03': [
    "Быть (to be) is omitted in present tense but required in past and future.",
    "Past tense of быть: был (m.), была (f.), было (n.), были (pl.).",
    "Future of быть: буду, будешь, будет, будем, будете, будут.",
    "Есть means both 'there is' and 'to eat' – context makes it clear.",
    "У меня есть... (I have...) literally means 'by me there is': У меня есть книга.",
    "Нет replaces есть in negative: У меня нет книги (I don't have a book) – genitive required.",
    "Это (this is) introduces things: Это мой друг (This is my friend) – no verb needed.",
    "In formal/literary Russian, быть can appear as есть for emphasis: Истина есть добро (Truth is goodness).",
  ],
  'node-04': [
    "All Russian nouns have grammatical gender: masculine, feminine, or neuter.",
    "Nominative case is the dictionary/subject form: Книга интересная (The book is interesting).",
    "Masculine nouns end in consonant or -ь: стол (table), день (day).",
    "Feminine nouns end in -а, -я, or -ь: книга (book), песня (song), ночь (night).",
    "Neuter nouns end in -о or -е: окно (window), море (sea).",
    "Some -ь nouns are masculine (день, словарь), others feminine (ночь, тетрадь) – memorize them.",
    "Gender affects adjective endings: новый дом (m.), новая книга (f.), новое окно (n.).",
    "Foreign loanwords get gender by ending: метро is neuter (-о), кофе is masculine (exception).",
    "Professions ending in consonant are masculine even for women: Она – хороший врач.",
  ],
  'node-05': [
    "Numbers 1-10 must be memorized: один, два, три, четыре, пять, шесть, семь, восемь, девять, десять.",
    "After 1, use nominative singular: один стол (one table).",
    "After 2-4, use genitive singular: два стола (two tables), три книги (three books).",
    "After 5-20, use genitive plural: пять столов (five tables), десять книг (ten books).",
    "This 1/2-4/5+ pattern repeats: 21 uses singular, 22-24 use gen.sing., 25-30 use gen.plural.",
    "Два/две changes by gender: два стула (m.) but две книги (f.).",
    "Сколько (how many) takes genitive plural: Сколько книг? (How many books?).",
    "Много (many) and мало (few) also require genitive plural: много друзей (many friends).",
  ],
  'node-06': [
    "Accusative marks the direct object: Я читаю книгу (I am reading a book).",
    "Animate masculine nouns change in accusative (= genitive form): Я вижу студента (I see the student).",
    "Inanimate masculine nouns stay the same in accusative: Я вижу стол (I see the table).",
    "Feminine -а/-я changes to -у/-ю in accusative: книга → книгу, неделя → неделю.",
    "Neuter nouns don't change in accusative: Я вижу окно.",
    "This animate/inanimate distinction is unique to Russian and affects masculine and plural forms.",
    "Accusative is used after many prepositions of motion: в школу (to school), на работу (to work).",
    "Verbs like любить, знать, видеть, слышать always take accusative objects.",
  ],
  'node-07': [
    "Adjectives agree with nouns in gender, number, AND case: новый дом, новая книга, новое письмо.",
    "Masculine adjective endings: -ый/-ий (nom.), -ого/-его (gen.), -ому/-ему (dat.).",
    "Feminine adjective endings: -ая/-яя (nom.), -ой/-ей (gen./dat./instr./prep.).",
    "Neuter adjective endings: -ое/-ее (nom./acc.), otherwise like masculine.",
    "Plural adjectives are the same for all genders: новые книги, новые столы, новые окна.",
    "Short adjectives (рад, готов, должен) only appear in predicate: Я рад (I am glad).",
    "Красивый is 'beautiful' for things; красивая for feminine: красивая девушка.",
    "Adjective agreement is one of the trickiest parts of Russian – practice with every new noun.",
  ],
  'node-08': [
    "Здравствуйте is formal hello; Привет is casual hi – choosing wrong signals social awkwardness.",
    "Пожалуйста means both 'please' and 'you're welcome' depending on context.",
    "Спасибо (thanks) comes from 'спаси Бог' (God save you).",
    "Ничего means 'nothing' but informally means 'it's okay/not bad'.",
    "Давай/давайте means 'let's' – давай is informal, давайте is formal: Давай пойдём!",
    "Ладно means 'okay/alright' in casual speech: Ладно, пойдём (Alright, let's go).",
    "Как дела? (How are things?) is the standard casual greeting after hello.",
    "Будьте добры (be so kind) is a very polite way to start a request.",
    "Извините (excuse me, formal) vs Извини (casual) – choose based on ты/вы relationship.",
    "До свидания (until meeting again) is the standard goodbye; Пока is casual bye.",
  ],
  'node-09': [
    "Russian past tense is simple: drop -ть, add -л (m.), -ла (f.), -ло (n.), -ли (pl.).",
    "Past tense agrees with the SUBJECT's gender, not the object: Она читала, Он читал.",
    "Past tense does NOT change by person – only gender and number matter.",
    "Вчера (yesterday), раньше (before), давно (long ago) naturally pair with past tense.",
    "Some verbs have irregular past stems: идти → шёл/шла, мочь → мог/могла.",
    "Past tense of быть: был/была/было/были is used as an auxiliary and standalone.",
    "Verbs in -ти have irregular past: нести → нёс, вести → вёл, расти → рос.",
    "The л-form is one of the simplest parts of Russian grammar – enjoy it!",
  ],
  'node-10': [
    "Second conjugation verbs (-ить) use -ю/-у, -ишь, -ит, -им, -ите, -ят/-ат.",
    "Many common verbs are second conjugation: говорить, любить, видеть, смотреть.",
    "Consonant mutations in first person: любить → люблю (б→бл), ходить → хожу (д→ж).",
    "Some -еть verbs are second conjugation: видеть → вижу, смотреть → смотрю.",
    "Stress patterns differ: говори́ть → говорю́, говори́шь vs люби́ть → люблю́, лю́бишь.",
    "The -ат/-ят ending in third person plural marks second conjugation: они говорят.",
    "Some verbs switch between conjugations in different aspects: получать (1st) / получить (2nd).",
    "Memorize the 11 exception verbs in -ать/-еть that follow second conjugation.",
  ],
  'node-11': [
    "Мочь (can) conjugates: могу, можешь, может, можем, можете, могут.",
    "Хотеть (to want) mixes conjugations: хочу, хочешь, хочет, хотим, хотите, хотят.",
    "Должен/должна/должно/должны (must/should) agrees in gender: Я должен идти (m.), Я должна идти (f.).",
    "Нужно/надо (need to) is impersonal: Мне нужно идти (I need to go) – dative + нужно.",
    "Можно (it is possible/allowed) vs Нельзя (it is not possible/forbidden) are impersonal.",
    "Стоит means 'it's worth': Стоит попробовать (It's worth trying).",
    "Следует means 'one should' (formal): Следует отметить (It should be noted).",
    "Приходится means 'to have to' (involuntarily): Мне приходится работать (I have to work, no choice).",
    "Уметь means 'to know how to' (skill): Я умею плавать (I know how to swim).",
  ],
  'node-12': [
    "Reflexive verbs add -ся (after consonants) or -сь (after vowels): мыться (to wash oneself).",
    "Одеваться (to dress oneself), учиться (to study), встречаться (to meet each other).",
    "-ся can indicate reciprocal action: Они встречаются (They meet each other/are dating).",
    "Some verbs are always reflexive: улыбаться (to smile), бояться (to be afraid).",
    "-ся changes verb meaning: находить (to find) → находиться (to be located).",
    "Reflexive verbs cannot take direct objects – the action returns to the subject.",
    "Past tense reflexive: мылся (m.), мылась (f.), мылись (pl.).",
    "Many Russian reflexive verbs translate to non-reflexive English: нравиться (to be liked/to appeal to).",
  ],
  'node-13': [
    "Не is the standard negation, placed before the verb: Я не знаю (I don't know).",
    "Нет means 'no' and also 'there is not': Нет времени (There is no time) – requires genitive.",
    "Ни...ни means 'neither...nor': Ни один, ни другой (Neither one nor the other).",
    "Double negatives are REQUIRED in Russian: Никто не пришёл (Nobody didn't come = Nobody came).",
    "Никогда не (never), ничего не (nothing), нигде не (nowhere) – always pair with не.",
    "Не changes the case of the object to genitive in some contexts: Я не вижу студента.",
    "Нет + genitive for absence: Его нет дома (He is not at home, literally 'of him there is not').",
    "Без (without) takes genitive: без проблем (without problems).",
  ],
  'node-14': [
    "Prepositional case is used ONLY after prepositions – it never appears alone.",
    "В + prepositional = location inside: в городе (in the city), в школе (in school).",
    "На + prepositional = location on/at: на столе (on the table), на работе (at work).",
    "О + prepositional = about: о книге (about the book), о друге (about a friend).",
    "Masculine/neuter endings: -е (городе, окне). Feminine: -е (школе) or -и (ночи).",
    "Some masculine nouns take stressed -у in prepositional: в лесу (in the forest), в саду (in the garden).",
    "В vs На for location must be memorized: в магазине (in the store) but на почте (at the post office).",
    "Prepositional is the simplest case – only two main endings: -е and -и.",
  ],
  'node-15': [
    "Comparatives add -ее/-ей: красивее (more beautiful), интереснее (more interesting).",
    "Common irregular comparatives: хороший → лучше, плохой → хуже, большой → больше.",
    "Superlatives use самый + adjective: самый красивый (the most beautiful).",
    "Чем means 'than': Он старше, чем я (He is older than me).",
    "Genitive can replace чем: Он старше меня (He is older than me – same meaning).",
    "Adjective short forms exist for some adjectives: красивый → красив, готовый → готов.",
    "Такой...как means 'as...as': Такой же красивый, как... (As beautiful as...).",
    "Не такой...как means 'not as...as': Не такой большой, как (Not as big as).",
    "Гораздо/намного mean 'much' in comparisons: гораздо лучше (much better).",
  ],
  'node-16': [
    "Accusative after в/на means motion TOWARD: иду в школу (going to school).",
    "Prepositional after в/на means location AT: в школе (at school).",
    "This в + acc. vs в + prep. distinction is fundamental: в город (to the city) vs в городе (in the city).",
    "Accusative for time duration: Я жил там неделю (I lived there for a week).",
    "через + accusative = 'in/after (time)': через час (in an hour).",
    "за + accusative = 'in the course of': за неделю (within a week).",
    "Animate accusative = genitive for masculine and plural: Я вижу друга (I see a friend).",
    "Accusative after некоторые verbs of emotion: Мне жаль маму (I feel sorry for mom).",
  ],
  'node-17': [
    "Dative case marks the indirect object (to whom): Я дал книгу другу (I gave the book to a friend).",
    "Masculine dative: -у/-ю (другу, учителю). Feminine: -е/-и (маме, дочери).",
    "Dative is used with мне, тебе, ему, ей, нам, вам, им for personal pronouns.",
    "Many impersonal constructions use dative: Мне холодно (I am cold, lit. 'to me it is cold').",
    "Нравиться takes dative: Мне нравится музыка (I like music, lit. 'to me music is pleasing').",
    "Age uses dative: Мне двадцать лет (I am twenty years old, lit. 'to me twenty years').",
    "Dative with нужно/надо: Мне нужно (I need), Тебе надо (You need to).",
    "По + dative means 'along/by': по улице (along the street).",
  ],
  'node-18': [
    "Instrumental case shows the means/tool: писать ручкой (to write with a pen).",
    "С + instrumental = 'with' (accompaniment): с другом (with a friend), с молоком (with milk).",
    "Masculine instrumental: -ом/-ем (столом, учителем). Feminine: -ой/-ей (книгой, ночью).",
    "Instrumental is used after быть in past/future: Он был врачом (He was a doctor).",
    "Стать + instrumental: Она стала учительницей (She became a teacher).",
    "Instrumental with prepositions: перед (before), за (behind), между (between), над (above), под (under).",
    "Seasons use instrumental: весной (in spring), летом (in summer), осенью (in fall), зимой (in winter).",
    "Заниматься + instrumental: заниматься спортом (to do sports), музыкой (to do music).",
  ],
  'node-19': [
    "Imperative for -ить verbs: drop -ишь, add -и (singular) / -ите (formal): Говори! Говорите!",
    "Imperative for other verbs: drop -ешь, add -й/-и: Читай! Читайте! Пиши! Пишите!",
    "Negative imperative: Не + imperative: Не ходи! (Don't go!), Не трогай! (Don't touch!).",
    "Давай/Давайте + infinitive means 'let's': Давайте пойдём! (Let's go!).",
    "Пожалуйста softens commands: Откройте, пожалуйста (Please open).",
    "Imperfective imperative = repeated/general: Читай каждый день! (Read every day!).",
    "Perfective imperative = one-time specific: Прочитай эту книгу! (Read this book [to completion]!).",
    "Third person wishes use пусть: Пусть она придёт (Let her come).",
  ],
  'node-20': [
    "Genitive shows possession: книга друга (a friend's book), дом отца (father's house).",
    "Masculine genitive: -а/-я (стола, учителя). Feminine: -ы/-и (книги, земли).",
    "Нет + genitive = 'there is no': Нет времени (There is no time).",
    "Many prepositions take genitive: из (from), от (from), до (until), без (without), для (for).",
    "Genitive after quantities: много книг (many books), мало времени (little time).",
    "Genitive plural has many endings: -ов/-ев (столов), -ей (ночей), zero ending (книг, мест).",
    "Из + genitive = origin: Я из России (I am from Russia).",
    "У + genitive = 'at/by someone': У меня (at my place / I have).",
  ],
  'node-21': [
    "Который (who/which/that) introduces relative clauses and declines by case.",
    "Который agrees in gender/number with the noun it refers to, but takes case from its role in the clause.",
    "Который always triggers a comma before it: Человек, который пришёл (The person who came).",
    "In spoken Russian, что (that/what) sometimes replaces который in informal relative clauses.",
    "Где (where) replaces в котором: город, где я живу (the city where I live).",
    "Куда (where to) replaces в который: город, куда я еду (the city I'm going to).",
    "Whose = genitive of который: Человек, которого мы видели (The person whom we saw).",
    "Чей/чья/чьё (whose) can replace которого for possession: Женщина, чей сын... (The woman whose son...).",
  ],
  'node-22': [
    "Instrumental with за means 'behind': за домом (behind the house).",
    "Instrumental with перед means 'in front of': перед школой (in front of the school).",
    "Instrumental with над means 'above/over': над столом (above the table).",
    "Instrumental with под means 'under': под столом (under the table).",
    "Instrumental with между means 'between': между нами (between us).",
    "Instrumental predicates: Он работает учителем (He works as a teacher).",
    "Instrumental of time: утром (in the morning), вечером (in the evening).",
    "Чем with comparatives: лучше, чем... (better than...) – чем is instrumental of что.",
  ],
  'node-23': [
    "Imperfective verbs describe ongoing, repeated, or general actions: читать (to read, in general).",
    "Perfective verbs describe completed, single, result-focused actions: прочитать (to read through/finish).",
    "Every Russian verb has an aspect pair: делать/сделать, писать/написать, говорить/сказать.",
    "Past imperfective: Я читал (I was reading / I used to read). Past perfective: Я прочитал (I finished reading).",
    "Future imperfective uses буду + infinitive: Я буду читать (I will be reading).",
    "Future perfective uses conjugated form: Я прочитаю (I will read [and finish]).",
    "Aspect choice changes meaning: Он открывал дверь (He was opening the door) vs Он открыл дверь (He opened the door).",
    "With negation, imperfective is often preferred: Не открывай! (Don't open!) vs Не открой (risky, might imply accident).",
  ],
  'node-24': [
    "Imperfective future: буду + infinitive: Я буду работать (I will be working).",
    "Perfective future: conjugated perfective verb: Я сделаю (I will do/finish).",
    "Завтра (tomorrow), скоро (soon), через (in/after) naturally pair with future tense.",
    "Если (if) + future describes real conditions: Если будет дождь, я останусь дома.",
    "Собираться (to intend) + infinitive: Я собираюсь поехать (I'm planning to go).",
    "The future of быть (буду, будешь...) is also the imperfective future auxiliary.",
    "Perfective present forms express future meaning: Я напишу (I will write [and finish]).",
    "Когда + perfective future = 'when (completed)': Когда я приду (When I arrive).",
  ],
  'node-25': [
    "Поэтому means 'therefore': Было поздно, поэтому мы ушли (It was late, so we left).",
    "Однако means 'however': Однако, это не совсем так (However, this is not quite so).",
    "Тем не менее means 'nevertheless': Тем не менее, он продолжал работать.",
    "Хотя means 'although': Хотя было трудно, он справился (Although it was hard, he managed).",
    "Не только...но и means 'not only...but also': Не только красивый, но и умный.",
    "Кроме того means 'besides/moreover': Кроме того, нужно учитывать время.",
    "Таким образом means 'thus/in this way': Таким образом, проблема решена.",
    "Между тем means 'meanwhile': Между тем, ситуация изменилась.",
  ],
  'node-26': [
    "Verbs of motion distinguish 'going on foot' (идти) from 'going by vehicle' (ехать).",
    "Unidirectional: идти/ехать (going one way now). Multidirectional: ходить/ездить (going generally/repeatedly).",
    "Prefixes change meaning: выходить (to go out), входить (to go in), уходить (to leave).",
    "Пойти is perfective of идти: Я пошёл (I set off walking).",
    "Летать/лететь (to fly), плавать/плыть (to swim) follow the same unidirectional/multidirectional pattern.",
    "Носить/нести (to carry walking), возить/везти (to carry by vehicle) are also motion verbs.",
    "Ходить implies repeated trips: Я хожу в школу (I go to school regularly).",
    "Идти implies one specific trip: Я иду в школу (I am going to school right now).",
  ],
  'node-27': [
    "Reported speech uses что: Он сказал, что придёт (He said that he would come).",
    "Russian keeps the original tense in reported speech: Он сказал: 'Я приду' → Он сказал, что придёт.",
    "По словам (according to): По словам учителя (According to the teacher).",
    "Сказать/говорить (to say/tell) introduce direct and indirect speech.",
    "Спросить introduces reported questions: Она спросила, где я живу (She asked where I live).",
    "Ли introduces reported yes/no questions: Она спросила, приду ли я (She asked whether I'd come).",
    "Как сообщается (as reported): formal news construction for reported information.",
    "Якобы means 'allegedly': Он якобы знал об этом (He allegedly knew about this).",
  ],
  'node-28': [
    "Вешать лапшу на уши (to hang noodles on ears) means to deceive someone.",
    "Водить за нос (to lead by the nose) means to trick or mislead someone repeatedly.",
    "Как рыба в воде (like a fish in water) means to be in one's element, completely comfortable.",
    "Душа в душу (soul in soul) means living in perfect harmony.",
    "Не в своей тарелке (not in one's plate) means feeling uncomfortable or out of place.",
    "Семь пятниц на неделе (seven Fridays in a week) describes someone who changes their mind constantly.",
    "Делать из мухи слона (to make an elephant out of a fly) means to exaggerate.",
    "Язык до Киева доведёт (the tongue will lead to Kyiv) means asking questions gets you anywhere.",
  ],
  'node-29': [
    "Ты is informal 'you' for friends and family; Вы is formal and plural.",
    "Using ты with strangers or elders is considered rude – always start with Вы.",
    "The switch from Вы to ты (тыканье) is usually proposed by the older or higher-status person.",
    "Formal address uses first name + patronymic: Иван Петрович, Мария Ивановна.",
    "Academic/business style uses passive and impersonal constructions: Было решено (It was decided).",
    "Colloquial Russian shortens words: сейчас → щас, здравствуйте → здрасте.",
    "Written formal Russian avoids contractions and uses longer connectors.",
    "Уважаемый/ая (respected) begins formal letters: Уважаемая Мария Ивановна.",
  ],
  'node-30': [
    "Present active participles end in -щий: читающий (one who reads), говорящий (one who speaks).",
    "Past active participles end in -вший: читавший (one who read/was reading).",
    "Present passive participles end in -мый: читаемый (being read), любимый (beloved/being loved).",
    "Past passive participles end in -нный/-тый: прочитанный (that was read), открытый (opened).",
    "Participles are more common in written/formal Russian than in spoken language.",
    "Short past passive participles: написан (written), сделан (done), открыт (opened).",
    "Деепричастие (verbal adverb) replaces 'while doing': читая (while reading), прочитав (having read).",
    "Spoken Russian prefers который-clauses over participles: который читает vs читающий.",
  ],
  'node-31': [
    "Russian uses commas before all subordinate clauses – this is a strict rule, not optional.",
    "Что (that), чтобы (in order to), если (if), когда (when) all require preceding commas.",
    "Чтобы + past tense expresses purpose: Я пришёл, чтобы помочь (I came to help).",
    "Чем...тем means 'the more...the more': Чем больше, тем лучше (The more, the better).",
    "Topic-comment order shifts emphasis: Книгу я уже прочитал (The book, I've already read).",
    "То...то means 'now...now' (alternation): То дождь, то солнце (Now rain, now sun).",
    "Ведь adds 'after all/you know': Он ведь прав (He's right, after all).",
    "Же emphasizes contrast: Я же говорил! (I told you so! / But I said so!).",
  ],
  'node-32': [
    "Literary Russian uses more complex syntax with participles and verbal adverbs.",
    "Pushkin is considered the founder of modern literary Russian.",
    "Church Slavonic influences still appear in elevated/poetic language.",
    "Formal narration uses past tense consistently – present-tense narration is a modern technique.",
    "Literary Russian avoids colloquialisms: произнести (to utter) instead of сказать (to say).",
    "Archaic forms appear in proverbs: Не имей сто рублей, а имей сто друзей (old imperative).",
    "The distinction between high and low style goes back to Lomonosov's three-style theory.",
    "Russian poetry traditionally uses syllabic-tonic meter – stress patterns are essential.",
  ],
  'node-33': [
    "Academic Russian uses impersonal constructions: Следует отметить (It should be noted).",
    "Formal connectors: таким образом (thus), в связи с этим (in connection with this).",
    "Данный (given/present) replaces этот in academic style: данная работа (the present work).",
    "Passive participles dominate academic writing: Было установлено (It was established).",
    "Является + instrumental replaces есть formally: Россия является страной (Russia is a country).",
    "В заключение means 'in conclusion': В заключение следует сказать...",
    "Рассматривать (to consider/examine) is a key academic verb: В данной работе рассматривается...",
    "Вышеупомянутый (above-mentioned) and нижеследующий (following below) are formal reference words.",
  ],
  'node-34': [
    "Русская душа (Russian soul) is a cultural concept about emotional depth and spirituality.",
    "На здоровье (to your health) is said when someone thanks you for food – not as a toast.",
    "За + accusative is used for toasts: За здоровье! (To health!), За дружбу! (To friendship!).",
    "Баня (bathhouse) culture is an important Russian social tradition.",
    "Ничего (nothing/it's fine) reflects a cultural tendency toward stoic acceptance.",
    "Russian patronymics (отчество) show respect and are used in formal and professional settings.",
    "The concept of тоска (melancholy/longing) is considered untranslatable and deeply Russian.",
    "Russian hospitality demands offering food to guests – refusing is considered impolite.",
  ],
  'node-35': [
    "Mastering all six cases with their prepositions is the foundation of Russian fluency.",
    "Verbal aspect (perfective/imperfective) affects every verb choice – it never goes away.",
    "Verbs of motion with prefixes create an enormous family of precise movement verbs.",
    "Russian word formation through prefixes and suffixes allows decoding unfamiliar words.",
    "Intonation patterns (ИК-1 through ИК-7) distinguish questions from statements.",
    "Advanced Russian means choosing the right register: formal, neutral, colloquial, slang.",
    "Understanding Russian humor requires cultural knowledge and wordplay appreciation.",
    "True fluency includes mastering the 'untranslatable' particles: же, ведь, -то, ли, бы.",
  ],
};

const TARGET_TOTAL = 1377;
const currentWithTips = deck.filter(c => c.grammar && c.grammar.trim() !== '').length;
const needed = TARGET_TOTAL - currentWithTips;

console.log(`Current tips: ${currentWithTips}, target: ${TARGET_TOTAL}, need to add: ${needed}`);

const noTipByNode = {};
for (const card of deck) {
  if (!card.grammar || card.grammar.trim() === '') {
    if (!noTipByNode[card.grammarNode]) noTipByNode[card.grammarNode] = [];
    noTipByNode[card.grammarNode].push(card);
  }
}

let added = 0;
const nodeKeys = Object.keys(noTipByNode).sort();
const totalNoTip = Object.values(noTipByNode).reduce((s, arr) => s + arr.length, 0);

for (const node of nodeKeys) {
  const cards = noTipByNode[node];
  const tips = tipPools[node] || tipPools['node-08'];
  const share = Math.round((cards.length / totalNoTip) * needed);
  const toAdd = Math.min(share, cards.length);

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  for (let i = 0; i < toAdd && added < needed; i++) {
    cards[i].grammar = tips[i % tips.length];
    added++;
  }
}

console.log(`Added ${added} grammar tips to Russian deck.`);
const finalCount = deck.filter(c => c.grammar && c.grammar.trim() !== '').length;
console.log(`Final: ${finalCount}/${deck.length} = ${(finalCount/deck.length*100).toFixed(1)}%`);

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf8');
console.log('Written to', DECK_PATH);
