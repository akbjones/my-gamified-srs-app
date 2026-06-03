#!/usr/bin/env node
/**
 * Reassign Russian deck cards to grammar nodes based on morphological analysis.
 *
 * - Force-reassign cards from the 6 renamed theme nodes (01, 05, 06, 07, 12, 17)
 * - Only move cards from existing grammar nodes if score difference > 12
 * - Rebalance to 80-200 per node
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'russian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// The 6 renamed theme nodes that need force-reassignment
const THEME_NODES = new Set(['node-01', 'node-05', 'node-06', 'node-07', 'node-12', 'node-17']);

// Node definitions with grammar markers
const NODES = {
  'node-01': {
    name: 'Personal pronouns & present tense (1st conj)',
    tier: 'A1',
    ruPatterns: [
      /\bя\s+\S*[ую]\b/i,           // я + 1st person ending
      /\bты\s+\S*ешь\b/i,            // ты + -ешь
      /\bон[аo]?\s+\S*ет\b/i,        // он/она + -ет
      /\bмы\s+\S*ем\b/i,             // мы + -ем
      /\bвы\s+\S*ете\b/i,            // вы + -ете
      /\bони\s+\S*[уюя]т\b/i,        // они + -ют/-ут
      /\bчита[юе]/i,                  // читать conjugation
      /\bпиш[уе]/i,                   // писать conjugation
      /\bдела[юе]/i,                  // делать conjugation
      /\bработа[юе]/i,                // работать conjugation
      /\bзна[юе]/i,                   // знать conjugation
      /\bдума[юе]/i,                  // думать conjugation
      /\bигра[юе]/i,                  // играть conjugation
      /\bгуля[юе]/i,                  // гулять conjugation
    ],
    enPatterns: [
      /\bI\s+(read|write|work|play|think|know|do|make|walk)\b/i,
      /\byou\s+(read|write|work|play|think|know)\b/i,
      /\b(he|she)\s+(reads|writes|works|plays|thinks|knows)\b/i,
    ],
    tipPatterns: [/1st\s*conj/i, /personal\s*pronoun/i, /\-ать\b/i, /\-ять\b/i],
  },
  'node-02': {
    name: 'Present tense (1st conjugation)',
    tier: 'A1',
    ruPatterns: [
      /\S+а[юе]т?(?:ся)?\b/,         // -ать verbs conjugated
      /\S+я[юе]т?(?:ся)?\b/,         // -ять verbs conjugated
      /\bговор[юи]/i,                 // говорить (irregular)
      /\bхо[чд]/i,                    // хотеть/ходить
      /\bмог[уу]/i,                   // мочь
    ],
    enPatterns: [
      /\b(speaks?|talks?|reads?|writes?|works?)\b/i,
    ],
    tipPatterns: [/present\s*tense/i, /conjugat/i],
  },
  'node-03': {
    name: 'Быть & есть (to be)',
    tier: 'A1',
    ruPatterns: [
      /\bесть\b/,                     // есть (to be/to eat)
      /\bбыл[аои]?\b/,               // был/была/было/были
      /\bбудет\b/,                    // будет
      /\bявляется\b/,                 // является
      /\bсуществует\b/,               // существует
      /\bэто\s+(есть|мой|моя|наш)/,  // это есть/мой
    ],
    enPatterns: [
      /\b(is|are|was|were)\s+(a|an|the|my|our|his|her)\b/i,
      /\bthere\s+(is|are|was|were)\b/i,
    ],
    tipPatterns: [/быть/i, /есть/i, /\bto be\b/i],
  },
  'node-04': {
    name: 'Gender & nominative case',
    tier: 'A1',
    ruPatterns: [
      /\b\S+ый\b/,                    // masc adj ending
      /\b\S+ая\b/,                    // fem adj ending
      /\b\S+ое\b/,                    // neut adj ending
      /\b(этот|эта|это|эти)\b/,       // demonstratives
      /\b(мой|моя|моё|мои)\b/,        // possessives
      /\b(новый|новая|новое)\b/,      // example adjectives
      /\b(большой|большая|большое)\b/,
    ],
    enPatterns: [
      /\b(this|that|these|those)\s+(is|are)\b/i,
      /\bmy\s+(new|big|old|good)\b/i,
    ],
    tipPatterns: [/gender/i, /nominative/i, /masculine|feminine|neuter/i],
  },
  'node-05': {
    name: 'Numerals & genitive with numbers',
    tier: 'A1',
    ruPatterns: [
      /\b(один|одна|одно|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять)\b/i,
      /\b(двадцать|тридцать|сорок|пятьдесят|сто|тысяча|миллион)\b/i,
      /\b(первый|второй|третий|четвёртый|пятый)\b/i,
      /\b\d+\s*(час|минут|день|дней|лет|рублей|километр|метр|год|месяц)/i,
      /\b(сколько|несколько|много|мало)\s+\S+(ов|ей|ий)\b/i,  // genitive plural after quantity
    ],
    enPatterns: [
      /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
      /\b(twenty|thirty|hundred|thousand|million)\b/i,
      /\b\d+\s*(hours?|minutes?|days?|years?|rubles?|kilometers?)\b/i,
      /\b(how many|how much|several|few|many)\b/i,
      /\b(first|second|third|fourth|fifth)\b/i,
    ],
    tipPatterns: [/numer/i, /genit.*number/i, /count/i, /genitive\s*plural/i],
  },
  'node-06': {
    name: 'Accusative case (animate vs inanimate)',
    tier: 'A1',
    ruPatterns: [
      /\bвижу\s+\S+[ау]/i,            // вижу + accusative
      /\bчитаю\s+\S+[ау]/i,           // читаю + accusative
      /\bлюблю\s+\S+[ау]/i,           // люблю + accusative
      /\bзнаю\s+\S+[ау]/i,            // знаю + accusative
      /\b(вижу|люблю|знаю|читаю|покупаю|готовлю|ем|пью)\b/i,
      /\bна\s+\S+[ау]\b/,             // на + accusative (direction)
      /\bв\s+\S+[ау]\b/,              // в + accusative (direction)
      /\bкниг[уи]\b/i,                // книгу (acc)
      /\bмашин[уы]\b/i,               // машину (acc)
      /\bстудент[аов]\b/i,            // студента (animate acc)
    ],
    enPatterns: [
      /\b(see|love|know|read|buy|cook|eat|drink)\s+(the|a|an|my|his|her)\b/i,
      /\binto\s+the\b/i,
    ],
    tipPatterns: [/accusative/i, /animate/i, /inanimate/i, /direct\s*object/i],
  },
  'node-07': {
    name: 'Adjective agreement (gender/number/case)',
    tier: 'A1',
    ruPatterns: [
      /\b\S+[ыо]й\s+\S+\b/,          // masc adj + noun
      /\b\S+ая\s+\S+\b/,             // fem adj + noun
      /\b\S+ое\s+\S+\b/,             // neut adj + noun
      /\b\S+ые\s+\S+\b/,             // plural adj + noun
      /\b\S+ие\s+\S+\b/,             // plural adj (soft) + noun
      /\b(красив|больш|маленьк|хорош|плох|нов|стар|молод|интересн|важн)[ыоаие]/i,
      /\b\S+ого\s/,                   // genitive adj
      /\b\S+ому\s/,                   // dative adj
      /\b\S+ой\s+\S+[еи]\b/,        // fem adj oblique
    ],
    enPatterns: [
      /\b(beautiful|big|small|good|bad|new|old|young|interesting|important)\s+\S+\b/i,
      /\bthe\s+(red|blue|green|white|black|big|small|old|new)\b/i,
    ],
    tipPatterns: [/adjective/i, /agreement/i, /gender.*case/i, /ending/i],
  },
  'node-08': {
    name: 'Common expressions',
    tier: 'A1',
    ruPatterns: [
      /\b(пожалуйста|спасибо|извините|простите|конечно|ладно|хорошо|ничего)\b/i,
      /\b(здравствуй|привет|до свидания|пока|добрый|доброе)\b/i,
      /\bкак\s+(дела|зовут|пройти|поживаете)\b/i,
      /\bне\s+за\s+что\b/i,
      /\b(мне|нам)\s+(нравится|кажется|нужно)\b/i,
    ],
    enPatterns: [
      /\b(please|thank|sorry|excuse|of course|okay|hello|goodbye|hi|bye)\b/i,
      /\bhow\s+(are|do)\s+you\b/i,
      /\bnice\s+to\s+meet\b/i,
    ],
    tipPatterns: [/expression/i, /phrase/i, /greeting/i, /polite/i],
  },
  'node-09': {
    name: 'Past tense (л-forms)',
    tier: 'A2',
    ruPatterns: [
      /\b\S+[аиыо]?л[аои]?\b/,       // past tense -л/-ла/-ло/-ли
      /\bбыл[аои]?\b/,               // был/была/было/были
      /\bсделал[аи]?\b/i,
      /\bсказал[аи]?\b/i,
      /\bпошёл|пошла\b/i,
      /\bпришёл|пришла\b/i,
      /\bувидел[аи]?\b/i,
      /\bузнал[аи]?\b/i,
      /\bнашёл|нашла\b/i,
      /\bвзял[аи]?\b/i,
      /\bдал[аи]?\b/i,
      /\bстал[аи]?\b/i,
    ],
    enPatterns: [
      /\b(was|were|did|went|had|got|came|saw|said|made|took|gave)\b/i,
      /\b\S+ed\b/,                    // regular past
      /\byesterday\b/i,
      /\blast\s+(week|month|year|night|time)\b/i,
    ],
    tipPatterns: [/past\s*tense/i, /\bл-form/i, /прошедш/i],
  },
  'node-10': {
    name: 'Present tense (2nd conjugation)',
    tier: 'A2',
    ruPatterns: [
      /\b\S+ишь\b/,                   // -ишь ending
      /\b\S+ит\b/,                    // -ит ending
      /\b\S+им\b/,                    // -им ending
      /\b\S+ите\b/,                   // -ите ending
      /\b\S+ят\b/,                    // -ят ending
      /\bговор[юиа]/i,               // говорить
      /\bвид[ижу]/i,                  // видеть
      /\bстоит\b/i,                   // стоить
      /\bсмотр[юиа]/i,               // смотреть
      /\bслыш[уиа]/i,                // слышать
      /\bдерж[уиа]/i,                // держать
      /\bлюб[юиа]/i,                 // любить
    ],
    enPatterns: [
      /\b(speaks?|sees?|stands?|watches?|hears?|holds?|loves?)\b/i,
    ],
    tipPatterns: [/2nd\s*conj/i, /\-ить\b/i, /\-еть\b/i],
  },
  'node-11': {
    name: 'Modal verbs',
    tier: 'A2',
    ruPatterns: [
      /\b(могу|можешь|может|можем|можете|могут)\b/i,
      /\b(хочу|хочешь|хочет|хотим|хотите|хотят)\b/i,
      /\b(должен|должна|должно|должны)\b/i,
      /\b(нужно|надо|необходимо)\b/i,
      /\b(можно|нельзя)\b/i,
      /\b(умею|умеешь|умеет|умеем|умеете|умеют)\b/i,
    ],
    enPatterns: [
      /\b(can|could|must|should|need|may|might|have to|able to)\b/i,
      /\b(want|wants)\s+to\b/i,
    ],
    tipPatterns: [/modal/i, /мочь/i, /хотеть/i, /должен/i],
  },
  'node-12': {
    name: 'Reflexive verbs (-ся/-сь)',
    tier: 'A2',
    ruPatterns: [
      /\S+[тс]ся\b/,                  // reflexive -тся/-ся
      /\S+[ал]ась\b/,                 // past fem reflexive
      /\S+[ао]лся\b/,                 // past masc reflexive
      /\S+[ао]лись\b/,                // past plural reflexive
      /\b(моется|одевается|учится|занимается|встречается|готовится)\b/i,
      /\b(мыться|одеваться|учиться|заниматься|встречаться|готовиться)\b/i,
      /\b(просыпаюсь|умываюсь|собираюсь|возвращаюсь|ложусь)\b/i,
      /\b(называется|находится|кажется|нравится|получается)\b/i,
    ],
    enPatterns: [
      /\b(myself|yourself|himself|herself|ourselves|themselves)\b/i,
      /\b(washes?|dresses?|prepares?)\s+(him|her|my)self\b/i,
      /\b(is\s+called|is\s+located|seems?|turns?\s+out)\b/i,
    ],
    tipPatterns: [/reflexive/i, /\-ся\b/i, /\-сь\b/i, /возвратн/i],
  },
  'node-13': {
    name: 'Negation',
    tier: 'A2',
    ruPatterns: [
      /\bне\s+\S+/,                   // не + verb/adj
      /\bнет\b/,                      // нет
      /\bни\s+\S+/,                   // ни + word
      /\bникогда\b/i,                 // никогда
      /\bничего\b/i,                  // ничего
      /\bникто\b/i,                   // никто
      /\bнигде\b/i,                   // нигде
      /\bникуда\b/i,                  // никуда
      /\bнезачем\b/i,
      /\bнеоткуда\b/i,
    ],
    enPatterns: [
      /\b(not|never|nothing|nobody|no one|nowhere|don't|doesn't|didn't|isn't|aren't|wasn't|weren't)\b/i,
    ],
    tipPatterns: [/negat/i, /не\b/i, /нет\b/i, /ни\b/i],
  },
  'node-14': {
    name: 'Prepositional case',
    tier: 'A2',
    ruPatterns: [
      /\b[вВ]\s+\S+[еи]\b/,          // в + prepositional
      /\b[нН]а\s+\S+[еи]\b/,         // на + prepositional
      /\b[оО]\s+\S+[еи]\b/,          // о + prepositional
      /\b(в школе|на работе|в городе|на улице|в доме|в парке|на кухне)\b/i,
      /\b(о книге|о фильме|о работе|о жизни|о любви)\b/i,
      /\bпри\s+\S+[еи]\b/,           // при + prepositional
    ],
    enPatterns: [
      /\b(in|at|on|about)\s+the\s+\S+\b/i,
      /\b(at school|at work|in the city|on the street|in the park)\b/i,
    ],
    tipPatterns: [/prepositional/i, /предложн/i, /в\/на\s*\+/i],
  },
  'node-15': {
    name: 'Adjective agreement & comparison',
    tier: 'A2',
    ruPatterns: [
      /\b(более|менее)\s+\S+/,        // comparative with более
      /\S+ее\b/,                       // comparative -ее
      /\S+ей\b/,                       // comparative -ей
      /\b(лучше|хуже|больше|меньше|старше|младше|выше|ниже)\b/i,
      /\bсамый\b/i,                   // superlative
      /\bсамая\b/i,
      /\bсамое\b/i,
      /\bсамые\b/i,
      /\bчем\b/,                      // than
    ],
    enPatterns: [
      /\b(more|less|better|worse|bigger|smaller|older|younger|higher|lower)\b/i,
      /\bthan\b/i,
      /\b(the\s+)?(most|best|worst|biggest|smallest)\b/i,
      /\S+er\s+than\b/i,
    ],
    tipPatterns: [/comparat/i, /superlat/i, /сравнит/i, /превосходн/i],
  },
  'node-16': {
    name: 'Accusative case',
    tier: 'B1',
    ruPatterns: [
      /\b(вижу|люблю|знаю|читаю|покупаю|готовлю|ем|пью|беру|несу)\b/i,
      /\bкниг[уи]\b/i,
      /\bмашин[уы]\b/i,
      /\bстудент[аов]\b/i,
      /\b(про|через|за)\s+\S+/,       // prepositions + accusative
      /\bна\s+\S+[уа]\b/,             // на + accusative direction
      /\bв\s+\S+[уа]\b/,              // в + accusative direction
    ],
    enPatterns: [
      /\b(see|love|know|read|buy|cook|eat|drink|take|carry)\s+(the|a|an|my)\b/i,
      /\bthrough\s+the\b/i,
      /\binto\s+the\b/i,
    ],
    tipPatterns: [/accusative/i, /винительн/i, /direct\s*object/i],
  },
  'node-17': {
    name: 'Dative case (кому/чему)',
    tier: 'B1',
    ruPatterns: [
      /\b(дал|дала|дали|даю|дать)\b/i,
      /\b(помог|помогла|помогу|помогать|помочь)\b/i,
      /\bк\s+\S+[уе]\b/,             // к + dative
      /\bпо\s+\S+[уеам]\b/,          // по + dative
      /\b(брату|сестре|маме|папе|другу|учителю|врачу)\b/i,
      /\b(мне|тебе|ему|ей|нам|вам|им)\b/i,
      /\b(нравится|кажется|нужно|надо|можно|нельзя)\b/i,
      /\b(звон[юиа]|пиш[уеа]|говор[юиа])\s+(мне|тебе|ему|ей|нам|вам|им)\b/i,
    ],
    enPatterns: [
      /\b(gave|give|gives?|help|helps?|helped)\s+(me|him|her|us|them|the|a|my)\b/i,
      /\bto\s+(me|him|her|us|them|my|his|her|the)\b/i,
      /\b(seems?|likes?|needs?)\b/i,
    ],
    tipPatterns: [/dative/i, /дательн/i, /кому/i, /чему/i],
  },
  'node-18': {
    name: 'Dative case',
    tier: 'B1',
    ruPatterns: [
      /\b(дал|дала|дали|даю|дать)\b/i,
      /\bк\s+\S+[уе]\b/,
      /\bпо\s+\S+[уеам]\b/,
      /\b(брату|сестре|маме|папе|другу|учителю)\b/i,
      /\b(мне|тебе|ему|ей|нам|вам|им)\s+\S+/,
    ],
    enPatterns: [
      /\b(gave|give|help|to me|to him|to her|to us|to them)\b/i,
    ],
    tipPatterns: [/dative/i, /дательн/i],
  },
  'node-19': {
    name: 'Imperative mood',
    tier: 'B1',
    ruPatterns: [
      /\b(читай|пиши|иди|идите|смотри|слушай|говори|дай|возьми|открой|закрой|подожди)\b/i,
      /\b(давай|давайте)\b/i,
      /\bне\s+(читай|пиши|иди|трогай|забудь|опаздывай)\b/i,
      /\bпожалуйста\b.*[!.]/i,
      /\S+[иь]те\b/,                  // formal imperative -ите/-ьте
    ],
    enPatterns: [
      /^(read|write|go|look|listen|speak|give|take|open|close|wait|don't)\b/i,
      /\blet's\b/i,
      /\bplease\s+(read|write|go|come|open|close|wait|sit|stand)\b/i,
    ],
    tipPatterns: [/imperative/i, /command/i, /повелит/i],
  },
  'node-20': {
    name: 'Genitive case',
    tier: 'B1',
    ruPatterns: [
      /\b(нет|без|для|от|до|из|у|около|после|вместо|кроме)\s+\S+[аяыи]\b/i,
      /\bнет\s+\S+[аяыиов]\b/i,
      /\b(много|мало|несколько|сколько)\s+\S+[ов|ей|ий]\b/i,
      /\b(из|от|до|без|для|у|около|после)\s+/i,
    ],
    enPatterns: [
      /\b(of|from|without|for|after|near|instead of)\s+the\b/i,
      /\bthere\s+is\s+no\b/i,
      /\bno\s+\S+\s+(left|here|there)\b/i,
    ],
    tipPatterns: [/genitive/i, /родительн/i],
  },
  'node-21': {
    name: 'Relative clauses (который)',
    tier: 'B1',
    ruPatterns: [
      /\b(который|которая|которое|которые|которого|которой|которому|которым)\b/i,
    ],
    enPatterns: [
      /\b(who|which|that|whom|whose)\s+\S+\b/i,
      /,\s*(who|which|that)\s/i,
    ],
    tipPatterns: [/relative/i, /который/i, /clause/i],
  },
  'node-22': {
    name: 'Instrumental case',
    tier: 'B2',
    ruPatterns: [
      /\bс\s+\S+[ом|ем|ой|ей|ью|ами|ями]\b/i,
      /\b(другом|братом|сестрой|женой|мужем|ножом|рукой|ручкой)\b/i,
      /\b(являюсь|являешься|является|являемся|являетесь|являются)\b/i,
      /\b(стал|стала|стали|станет|стану)\s+\S+[ом|ем|ой|ей]\b/i,
      /\b(доволен|довольна|довольны|горд|горда|горды)\b/i,
      /\b(между|над|под|перед|за)\s+/i,
    ],
    enPatterns: [
      /\bwith\s+(a|an|the|my|his|her)\b/i,
      /\b(by|between|above|below|behind|in front of)\s+the\b/i,
      /\bbecame?\s+(a|an)\b/i,
    ],
    tipPatterns: [/instrumental/i, /творительн/i],
  },
  'node-23': {
    name: 'Verbal aspect',
    tier: 'B2',
    ruPatterns: [
      /\b(по|на|с|про|вы|при|у|за|пере|от|об|до|раз)\S+[аие]л[аои]?\b/i,  // perfective past
      /\b(сделал|написал|прочитал|приготовил|купил|позвонил|помыл|поехал|пришёл)\b/i,
      /\b(делал|писал|читал|готовил|покупал|звонил|мыл|ехал|шёл)\b/i,  // imperfective
    ],
    enPatterns: [
      /\b(already|just|finally|completely|once)\b/i,
      /\bused\s+to\b/i,
      /\bwould\s+(always|often|usually)\b/i,
    ],
    tipPatterns: [/aspect/i, /вид\b/i, /perfective/i, /imperfective/i, /совершенн/i, /несовершенн/i],
  },
  'node-24': {
    name: 'Future tense',
    tier: 'B2',
    ruPatterns: [
      /\b(буду|будешь|будет|будем|будете|будут)\b/i,
      /\b(сделаю|напишу|прочитаю|приготовлю|куплю|позвоню|поеду|приду)\b/i,
      /\bзавтра\b/i,
      /\bскоро\b/i,
      /\bчерез\s+(час|день|неделю|месяц|год)\b/i,
    ],
    enPatterns: [
      /\bwill\s+\S+/i,
      /\bgoing\s+to\s+\S+/i,
      /\btomorrow\b/i,
      /\bnext\s+(week|month|year|day)\b/i,
      /\bsoon\b/i,
    ],
    tipPatterns: [/future/i, /будущ/i],
  },
  'node-25': {
    name: 'Advanced connectors',
    tier: 'B2',
    ruPatterns: [
      /\b(однако|тем не менее|несмотря на|вследствие|благодаря|поскольку|ввиду)\b/i,
      /\b(причём|притом|тогда как|между тем|в то время как)\b/i,
      /\b(следовательно|таким образом|итак|в результате|в связи с)\b/i,
      /\b(хотя|хоть|даже если|в случае если|при условии)\b/i,
    ],
    enPatterns: [
      /\b(however|nevertheless|despite|although|therefore|consequently|moreover|furthermore|whereas)\b/i,
      /\b(as a result|in addition|on the other hand|in spite of)\b/i,
    ],
    tipPatterns: [/connector/i, /conjunction/i, /linking/i, /союз/i],
  },
  'node-26': {
    name: 'Verbs of motion',
    tier: 'B2',
    ruPatterns: [
      /\b(идти|ходить|идёт|ходит|шёл|шла|ходил)\b/i,
      /\b(ехать|ездить|едет|ездит|ехал|ездил)\b/i,
      /\b(бежать|бегать|бежит|бегает)\b/i,
      /\b(лететь|летать|летит|летает)\b/i,
      /\b(нести|носить|несёт|носит)\b/i,
      /\b(вести|водить|ведёт|водит)\b/i,
      /\b(везти|возить|везёт|возит)\b/i,
      /\b(плыть|плавать|плывёт|плавает)\b/i,
      /\b(пойти|поехать|побежать|полететь)\b/i,  // perfective motion
      /\b(выйти|войти|уйти|прийти|зайти|перейти)\b/i,  // prefixed motion
    ],
    enPatterns: [
      /\b(go|goes?|going|went|walk|walks?|walked|drive|drives?|drove|run|runs?|ran|fly|flies?|flew)\b/i,
      /\b(on foot|by car|by bus|by train|by plane)\b/i,
    ],
    tipPatterns: [/motion/i, /движен/i, /идти.*ходить/i, /ехать.*ездить/i],
  },
  'node-27': {
    name: 'Reported speech',
    tier: 'B2',
    ruPatterns: [
      /\b(сказал|сказала|сказали)\s+(что|чтобы)\b/i,
      /\b(рассказал|рассказала|рассказали)\b/i,
      /\b(ответил|ответила|ответили)\b/i,
      /\b(спросил|спросила|спросили)\b/i,
      /\b(объяснил|объяснила|объяснили)\b/i,
      /\b(сообщил|сообщила|сообщили)\b/i,
      /,\s*что\s+\S+\s+\S+л[аои]?\b/i,  // что + past tense
    ],
    enPatterns: [
      /\b(said|told|asked|replied|explained|reported|announced)\s+that\b/i,
      /\b(he|she|they)\s+said\b/i,
    ],
    tipPatterns: [/reported/i, /indirect\s*speech/i, /косвенн/i],
  },
  'node-28': {
    name: 'Idiomatic expressions',
    tier: 'C1',
    ruPatterns: [
      /\b(бить баклуши|вешать нос|водить за нос|убить двух зайцев|как рыба в воде)\b/i,
      /\bкак\s+\S+\s+(на|в|из|с)\b/i,  // как + simile
      /\b(душа|сердце|голова|рука|нога|глаз)\s+(в|на|за|не)\b/i,
    ],
    enPatterns: [
      /\b(idiom|proverb|saying|expression)\b/i,
      /\b(kill two birds|cold shoulder|break a leg|raining cats)\b/i,
    ],
    tipPatterns: [/idiom/i, /expression/i, /пословиц/i, /поговорк/i, /фразеолог/i],
  },
  'node-29': {
    name: 'Formal vs informal register',
    tier: 'C1',
    ruPatterns: [
      /\b(вы|Вы|ваш|Ваш|вашего|Вашего)\b/,  // formal вы
      /\b(ты|твой|тебя|тебе|тобой)\b/,       // informal ты
      /\b(господин|госпожа|уважаемый|уважаемая)\b/i,
      /\b(позвольте|извольте|будьте добры|не могли бы вы)\b/i,
    ],
    enPatterns: [
      /\b(formal|informal|polite|casual|sir|madam|mr|mrs|dear)\b/i,
      /\bcould\s+you\s+please\b/i,
    ],
    tipPatterns: [/register/i, /formal/i, /informal/i, /ты.*вы/i],
  },
  'node-30': {
    name: 'Participles & verbal adjectives',
    tier: 'C1',
    ruPatterns: [
      /\S+[ую]щий\b/,                 // present active participle
      /\S+[ая]щая\b/,
      /\S+[ее]щее\b/,
      /\S+вший\b/,                     // past active participle
      /\S+ший\b/,
      /\S+нный\b/,                     // passive past participle
      /\S+тый\b/,                      // passive past participle
      /\S+мый\b/,                      // present passive participle
      /\b(читающий|пишущий|говорящий|идущий|работающий)\b/i,
      /\b(прочитанный|написанный|сделанный|построенный)\b/i,
    ],
    enPatterns: [
      /\b\S+ing\s+(the|a|his|her|our)\b/i,  // present participle
      /\b(written|built|made|done|read)\s+(by|in|on|with)\b/i,
    ],
    tipPatterns: [/participle/i, /причаст/i, /деепричаст/i],
  },
  'node-31': {
    name: 'Complex sentence structures',
    tier: 'C1',
    ruPatterns: [
      /\b(если бы|хотя бы|как бы|лишь бы|чтобы)\b/i,
      /\b(не только|но и|как|так и|ни|ни)\b/i,
      /\b(то есть|вернее|точнее|иначе говоря)\b/i,
      /,\s*\S+\s+\S+,\s*\S+\s+\S+,/,  // multiple clauses
    ],
    enPatterns: [
      /\b(not only|but also|either|or|neither|nor)\b/i,
      /\b(in other words|that is to say|namely)\b/i,
    ],
    tipPatterns: [/complex/i, /sentence\s*structure/i, /syntax/i],
  },
  'node-32': {
    name: 'Literary & written Russian',
    tier: 'C2',
    ruPatterns: [
      /\b(сей|оный|ибо|дабы|коий|токмо)\b/i,  // archaic
      /\b(ведь|мол|дескать|якобы)\b/i,           // literary particles
    ],
    enPatterns: [
      /\b(literary|poetic|archaic|eloquent)\b/i,
    ],
    tipPatterns: [/literary/i, /written/i, /книжн/i],
  },
  'node-33': {
    name: 'Academic discourse',
    tier: 'C2',
    ruPatterns: [
      /\b(исследование|анализ|теория|гипотеза|метод|результат|вывод|заключение)\b/i,
      /\b(рассмотрим|проанализируем|отметим|подчеркнём|следует отметить)\b/i,
    ],
    enPatterns: [
      /\b(research|analysis|theory|hypothesis|method|result|conclusion)\b/i,
      /\b(furthermore|moreover|in conclusion|to summarize)\b/i,
    ],
    tipPatterns: [/academic/i, /научн/i, /discourse/i],
  },
  'node-34': {
    name: 'Cultural fluency',
    tier: 'C2',
    ruPatterns: [
      /\b(культура|традиция|обычай|праздник|история)\b/i,
      /\b(Россия|русский|российский|москв|петербург)\b/i,
    ],
    enPatterns: [
      /\b(culture|tradition|custom|heritage|festival|Russian)\b/i,
    ],
    tipPatterns: [/cultur/i, /традиц/i],
  },
  'node-35': {
    name: 'Advanced mixed mastery',
    tier: 'C2',
    ruPatterns: [],
    enPatterns: [],
    tipPatterns: [],
  },
};

// Score a card against a node
function scoreCard(card, nodeId) {
  const node = NODES[nodeId];
  if (!node) return 0;

  let score = 0;
  const target = card.target || '';
  const english = card.english || '';
  const grammar = card.grammar || '';

  // Primary: Russian morphology (weight 3)
  for (const pat of node.ruPatterns) {
    if (pat.test(target)) score += 3;
  }

  // Secondary: English translation (weight 2)
  for (const pat of node.enPatterns) {
    if (pat.test(english)) score += 2;
  }

  // Tertiary: grammar tips (weight 4 – highly reliable)
  for (const pat of node.tipPatterns) {
    if (pat.test(grammar) || pat.test(target)) score += 4;
  }

  return score;
}

// Find best node for a card
function findBestNode(card) {
  let bestNode = null;
  let bestScore = 0;

  for (const nodeId of Object.keys(NODES)) {
    const score = scoreCard(card, nodeId);
    if (score > bestScore) {
      bestScore = score;
      bestNode = nodeId;
    }
  }

  return { node: bestNode, score: bestScore };
}

// ── Main logic ──
console.log('=== Russian Deck Node Reassignment ===\n');

// Count current distribution
const beforeCounts = {};
for (const card of deck) {
  const node = card.grammarNode;
  beforeCounts[node] = (beforeCounts[node] || 0) + 1;
}

console.log('BEFORE distribution:');
for (const [node, count] of Object.entries(beforeCounts).sort()) {
  const isTheme = THEME_NODES.has(node) ? ' [THEME - will force-reassign]' : '';
  console.log(`  ${node}: ${count} cards${isTheme}`);
}

// Phase 1: Score all cards
let moved = 0;
let themeForced = 0;
let grammarImproved = 0;
const movements = {};

for (const card of deck) {
  const currentNode = card.grammarNode;
  const best = findBestNode(card);
  const currentScore = scoreCard(card, currentNode);

  const isThemeNode = THEME_NODES.has(currentNode);

  if (isThemeNode) {
    // Force-reassign from theme nodes
    if (best.node && best.score > 0) {
      const from = currentNode;
      card.grammarNode = best.node;
      movements[`${from}->${best.node}`] = (movements[`${from}->${best.node}`] || 0) + 1;
      moved++;
      themeForced++;
    }
    // If no good match, leave it (will be rebalanced later)
  } else {
    // Only move from grammar nodes if significant improvement
    if (best.node && best.node !== currentNode && (best.score - currentScore) > 12) {
      const from = currentNode;
      card.grammarNode = best.node;
      movements[`${from}->${best.node}`] = (movements[`${from}->${best.node}`] || 0) + 1;
      moved++;
      grammarImproved++;
    }
  }
}

console.log(`\nPhase 1 results:`);
console.log(`  Theme nodes force-reassigned: ${themeForced}`);
console.log(`  Grammar nodes improved: ${grammarImproved}`);
console.log(`  Total moved: ${moved}`);

// Phase 2: Rebalance (80-200 per node)
const MIN_PER_NODE = 80;
const MAX_PER_NODE = 200;

function getNodeCounts() {
  const counts = {};
  for (const nodeId of Object.keys(NODES)) counts[nodeId] = [];
  for (const card of deck) {
    if (!counts[card.grammarNode]) counts[card.grammarNode] = [];
    counts[card.grammarNode].push(card);
  }
  return counts;
}

let rebalanceRounds = 0;
let rebalanceMoved = 0;

for (let round = 0; round < 10; round++) {
  let movedThisRound = 0;

  // Step A: Fix overflow nodes (>200)
  {
    const counts = getNodeCounts();
    for (const [nodeId, cards] of Object.entries(counts)) {
      if (cards.length <= MAX_PER_NODE) continue;

      const scoredCards = cards.map(c => ({
        card: c,
        currentScore: scoreCard(c, nodeId),
      }));
      scoredCards.sort((a, b) => a.currentScore - b.currentScore);

      const excess = cards.length - MAX_PER_NODE;
      let movedFromNode = 0;

      for (const sc of scoredCards) {
        if (movedFromNode >= excess) break;
        const curCounts = getNodeCounts();
        let bestAlt = null;
        let bestAltScore = 0;

        for (const altNode of Object.keys(NODES)) {
          if (altNode === nodeId) continue;
          if ((curCounts[altNode]?.length || 0) >= MAX_PER_NODE) continue;
          const altScore = scoreCard(sc.card, altNode);
          if (altScore > bestAltScore) {
            bestAltScore = altScore;
            bestAlt = altNode;
          }
        }

        if (bestAlt) {
          sc.card.grammarNode = bestAlt;
          movedFromNode++;
          movedThisRound++;
        }
      }
    }
  }

  // Step B: Fix underflow nodes (<80) – steal from largest nodes
  {
    const counts = getNodeCounts();
    const underNodes = Object.entries(counts)
      .filter(([, cards]) => cards.length < MIN_PER_NODE)
      .sort((a, b) => a[1].length - b[1].length);  // smallest first

    for (const [nodeId, cards] of underNodes) {
      const deficit = MIN_PER_NODE - cards.length;
      let filled = 0;

      // Gather candidates from all nodes with >MIN cards
      const candidates = [];
      const freshCounts = getNodeCounts();
      for (const [otherNode, otherCards] of Object.entries(freshCounts)) {
        if (otherNode === nodeId) continue;
        if (otherCards.length <= MIN_PER_NODE) continue;

        for (const c of otherCards) {
          const scoreHere = scoreCard(c, nodeId);
          const scoreThere = scoreCard(c, otherNode);
          candidates.push({ card: c, scoreHere, scoreThere, fromNode: otherNode, surplus: otherCards.length - MIN_PER_NODE });
        }
      }

      // Sort: prefer cards that score well here, from nodes with biggest surplus
      candidates.sort((a, b) => {
        // First priority: has any score for target node
        if (a.scoreHere > 0 && b.scoreHere === 0) return -1;
        if (a.scoreHere === 0 && b.scoreHere > 0) return 1;
        // Second: highest relative improvement
        const relA = a.scoreHere - a.scoreThere;
        const relB = b.scoreHere - b.scoreThere;
        if (relA !== relB) return relB - relA;
        // Third: biggest surplus
        return b.surplus - a.surplus;
      });

      for (const cand of candidates) {
        if (filled >= deficit) break;
        const srcCount = deck.filter(c => c.grammarNode === cand.fromNode).length;
        if (srcCount <= MIN_PER_NODE) continue;

        cand.card.grammarNode = nodeId;
        filled++;
        movedThisRound++;
      }
    }
  }

  rebalanceMoved += movedThisRound;
  rebalanceRounds++;
  if (movedThisRound === 0) break;
}

console.log(`\nRebalancing: ${rebalanceMoved} cards moved in ${rebalanceRounds} rounds`);

// Final counts
const afterCounts = {};
for (const card of deck) {
  const node = card.grammarNode;
  afterCounts[node] = (afterCounts[node] || 0) + 1;
}

console.log('\nAFTER distribution:');
let totalCards = 0;
let underMin = 0;
let overMax = 0;
for (const nodeId of Object.keys(NODES).sort()) {
  const count = afterCounts[nodeId] || 0;
  const before = beforeCounts[nodeId] || 0;
  const delta = count - before;
  const flag = count < MIN_PER_NODE ? ' [UNDER]' : count > MAX_PER_NODE ? ' [OVER]' : '';
  const name = NODES[nodeId]?.name || '???';
  console.log(`  ${nodeId}: ${count} (was ${before}, ${delta >= 0 ? '+' : ''}${delta}) - ${name}${flag}`);
  totalCards += count;
  if (count < MIN_PER_NODE) underMin++;
  if (count > MAX_PER_NODE) overMax++;
}

console.log(`\nTotal cards: ${totalCards}`);
console.log(`Nodes under ${MIN_PER_NODE}: ${underMin}`);
console.log(`Nodes over ${MAX_PER_NODE}: ${overMax}`);

// Top movements
console.log('\nTop movements:');
const sortedMovements = Object.entries(movements).sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [key, count] of sortedMovements) {
  console.log(`  ${key}: ${count} cards`);
}

// Alignment check: % of cards where current node = best-scoring node
let aligned = 0;
for (const card of deck) {
  const best = findBestNode(card);
  if (best.node === card.grammarNode || best.score === 0) aligned++;
}
console.log(`\nAlignment: ${aligned}/${deck.length} (${(100 * aligned / deck.length).toFixed(1)}%)`);

// Write output
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf8');
console.log('\nDeck written successfully.');
