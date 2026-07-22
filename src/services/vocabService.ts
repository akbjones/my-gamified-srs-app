import { VocabEntry, VocabMap, Language } from '../types';
import { DictEntry } from '../data/dictionary/es';
import { hasCjk, PUNCT_TOKEN, type CardText } from './textService';

// ── Tokenization ────────────────────────────────────────────
export function tokenizeSentence(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[¿¡.,!?;:"""''()––\-…«»]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/** Tokenize preserving original case – returns [lowercase, original] pairs */
function tokenizeSentenceWithCase(sentence: string): [string, string][] {
  const raw = sentence
    .replace(/[¿¡.,!?;:"""''()––\-…«»]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
  return raw.map((w, i) => {
    const lower = w.toLowerCase();
    // First word is always capitalized (sentence start) – don't treat as proper noun
    const display = i === 0 ? lower : (w !== lower ? w : lower);
    return [lower, display];
  });
}

// ── Common function words (shunted to separate category in UI) ──
const COMMON_WORDS: Record<string, Set<string>> = {
  spanish: new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'en', 'a', 'al', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hacia',
    'y', 'e', 'o', 'u', 'pero', 'ni', 'que', 'si', 'como', 'cuando', 'donde', 'porque',
    'yo', 'tú', 'él', 'ella', 'nosotros', 'nosotras', 'ellos', 'ellas', 'usted', 'ustedes',
    'me', 'te', 'se', 'nos', 'os', 'lo', 'le', 'les',
    'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras',
    'es', 'son', 'está', 'están', 'hay', 'ser', 'estar', 'ha', 'han', 'fue', 'era', 'hacer', 'ir',
    'no', 'sí', 'muy', 'más', 'menos', 'ya', 'también', 'aquí', 'ahí', 'allí',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'esto', 'eso',
    'dos', 'tres', 'uno', 'todo', 'toda', 'todos', 'todas', 'cada', 'otro', 'otra', 'otros', 'otras',
    'del', 'al',
  ]),
  italian: new Set([
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
    'di', 'del', 'dello', 'della', 'dei', 'degli', 'delle',
    'a', 'al', 'allo', 'alla', 'ai', 'agli', 'alle',
    'da', 'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
    'in', 'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
    'su', 'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
    'con', 'per', 'tra', 'fra', 'su', 'sotto', 'sopra', 'verso',
    'e', 'ed', 'o', 'ma', 'che', 'se', 'come', 'quando', 'dove', 'perché',
    'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
    'mi', 'ti', 'si', 'ci', 'vi', 'lo', 'li', 'ne',
    'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'tuoi', 'tue', 'suo', 'sua', 'suoi', 'sue',
    'è', 'sono', 'ha', 'hanno', 'essere', 'avere', 'era', 'erano', 'fare', 'stare',
    'non', 'sì', 'molto', 'più', 'meno', 'già', 'anche', 'qui', 'là',
    'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'quelli', 'quelle',
    'due', 'tre', 'uno', 'tutto', 'tutti', 'tutta', 'tutte', 'ogni', 'altro', 'altra', 'altri', 'altre',
    'nostro', 'nostra', 'nostri', 'nostre', 'vostro', 'vostra', 'vostri', 'vostre',
    'col', 'dell', 'nell', 'sull', 'all', 'dall',
  ]),
  french: new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
    'l', 'd', 'j', 'n', 's', 'c', 'm', 't', 'qu', // elision fragments
    'à', 'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'vers', 'chez', 'entre',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'si', 'comme', 'quand', 'où', 'parce',
    'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
    'me', 'te', 'se', 'lui', 'leur', 'y', 'en',
    'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'nos', 'vos', 'leurs',
    'ce', 'cet', 'cette', 'ces', 'cela', 'ceci', 'ça',
    'est', 'sont', 'a', 'ont', 'être', 'avoir', 'fait', 'va', 'aller', 'faire',
    'ai', 'as', 'avons', 'avez', 'suis', 'es', 'sommes', 'êtes',
    'ne', 'pas', 'plus', 'jamais', 'rien', 'personne',
    'oui', 'non', 'très', 'bien', 'aussi', 'ici', 'là',
    'qui', 'dont', 'lequel', 'laquelle',
    'tout', 'tous', 'toute', 'toutes', 'chaque', 'autre', 'autres', 'même', 'mêmes',
    'deux', 'trois', 'un',
  ]),
  portuguese: new Set([
    // Articles
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    // Pronouns
    'eu', 'tu', 'ele', 'ela', 'você', 'nós', 'vocês', 'eles', 'elas',
    'me', 'te', 'se', 'nos', 'lhe', 'isso', 'isto', 'aquilo', 'quem', 'que',
    // Prepositions
    'de', 'em', 'a', 'para', 'por', 'com', 'sem', 'sobre', 'entre', 'até', 'desde',
    // Contractions
    'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
    'ao', 'à', 'aos', 'às', 'pelo', 'pela', 'pelos', 'pelas',
    // Conjunctions
    'e', 'ou', 'mas', 'porque', 'quando', 'se', 'como', 'pois', 'nem', 'porém',
    // Common verbs
    'ser', 'estar', 'ter', 'ir', 'fazer', 'poder', 'dizer', 'dar', 'ver', 'saber', 'querer', 'haver',
    // Common adverbs
    'não', 'sim', 'muito', 'mais', 'também', 'já', 'ainda', 'sempre', 'nunca',
    'bem', 'mal', 'aqui', 'ali', 'lá', 'onde', 'assim', 'depois', 'antes', 'agora',
    'hoje', 'ontem', 'amanhã',
    // Determiners
    'este', 'esta', 'esse', 'essa', 'aquele', 'aquela',
    'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa',
    'todo', 'toda', 'cada', 'outro', 'outra',
  ]),
  german: new Set([
    // Articles
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
    // Pronouns
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'man',
    'mich', 'dich', 'sich', 'uns', 'euch',
    'mir', 'dir', 'ihm', 'ihr', 'uns', 'euch', 'ihnen',
    'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines',
    'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines',
    'sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines',
    'unser', 'unsere', 'unseren', 'unserem', 'unserer', 'unseres',
    'euer', 'eure', 'euren', 'eurem', 'eurer', 'eures',
    // Prepositions
    'in', 'im', 'an', 'am', 'auf', 'aus', 'bei', 'mit', 'nach', 'von', 'vom', 'zu', 'zum', 'zur',
    'für', 'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen', 'durch', 'gegen', 'ohne', 'um',
    // Conjunctions
    'und', 'oder', 'aber', 'denn', 'weil', 'dass', 'wenn', 'als', 'ob', 'sondern',
    // Common verbs (conjugated)
    'ist', 'sind', 'bin', 'bist', 'war', 'hat', 'haben', 'habe', 'hatte',
    'wird', 'werden', 'kann', 'muss', 'soll', 'will', 'darf', 'mag',
    // Adverbs & particles
    'nicht', 'kein', 'keine', 'keinen', 'keinem', 'keiner',
    'ja', 'nein', 'sehr', 'auch', 'noch', 'schon', 'nur', 'hier', 'da', 'dort',
    'mehr', 'weniger', 'immer', 'nie', 'oft', 'gern', 'gerne',
    'doch', 'mal', 'eben', 'halt', 'wohl',
    // Demonstratives
    'dieser', 'diese', 'dieses', 'diesen', 'diesem',
    'jeder', 'jede', 'jedes', 'jeden', 'jedem',
    // Numbers
    'eins', 'zwei', 'drei',
    // Question words
    'was', 'wer', 'wo', 'wie', 'wann', 'warum', 'welch',
  ]),
  dutch: new Set([
    // Articles
    'de', 'het', 'een',
    // Pronouns
    'ik', 'jij', 'je', 'hij', 'zij', 'ze', 'het', 'wij', 'we', 'jullie', 'u',
    'mij', 'me', 'jou', 'hem', 'haar', 'ons', 'hen', 'hun',
    'mijn', 'jouw', 'zijn', 'haar', 'ons', 'onze', 'jullie', 'hun',
    'dit', 'dat', 'deze', 'die', 'wat', 'wie', 'welk', 'welke',
    // Prepositions
    'in', 'op', 'aan', 'van', 'voor', 'met', 'naar', 'bij', 'uit', 'door',
    'over', 'om', 'tot', 'tussen', 'onder', 'boven', 'achter', 'naast', 'zonder', 'tegen',
    // Conjunctions
    'en', 'of', 'maar', 'want', 'dus', 'dat', 'als', 'omdat', 'wanneer', 'waar',
    'toen', 'terwijl', 'hoewel', 'zodat', 'tenzij',
    // Common verbs
    'is', 'ben', 'bent', 'zijn', 'was', 'waren', 'wordt', 'worden',
    'heb', 'hebt', 'heeft', 'hebben', 'had', 'hadden',
    'kan', 'kun', 'kunt', 'kunnen', 'mag', 'mogen', 'moet', 'moeten',
    'wil', 'wilt', 'willen', 'zal', 'zult', 'zullen', 'zou', 'zouden',
    'ga', 'gaat', 'gaan', 'doe', 'doet', 'doen', 'kom', 'komt', 'komen',
    // Adverbs & particles
    'niet', 'geen', 'wel', 'ook', 'nog', 'al', 'er', 'hier', 'daar',
    'ja', 'nee', 'heel', 'erg', 'zeer', 'meer', 'minder', 'zo', 'nu',
    'dan', 'toch', 'maar', 'even', 'altijd', 'nooit', 'vaak', 'soms',
    // Demonstratives & determiners
    'elk', 'elke', 'iedere', 'alle', 'beide', 'veel', 'weinig', 'andere', 'eigen',
    // Numbers
    'een', 'twee', 'drie',
    // Question words
    'hoe', 'waarom', 'hoeveel',
  ]),
  swedish: new Set([
    // Articles & pronouns
    'en', 'ett', 'den', 'det', 'de',
    'jag', 'du', 'han', 'hon', 'vi', 'ni', 'de', 'man',
    'mig', 'dig', 'honom', 'henne', 'oss', 'er', 'dem', 'sig',
    'min', 'mitt', 'mina', 'din', 'ditt', 'dina', 'sin', 'sitt', 'sina',
    'hans', 'hennes', 'vår', 'vårt', 'våra', 'er', 'ert', 'era', 'deras',
    'denna', 'detta', 'dessa', 'den', 'det', 'de',
    // Prepositions
    'i', 'på', 'till', 'från', 'av', 'med', 'för', 'om', 'hos', 'vid',
    'under', 'över', 'mellan', 'efter', 'före', 'utan', 'mot', 'genom', 'bland',
    // Conjunctions
    'och', 'eller', 'men', 'att', 'om', 'som', 'när', 'medan', 'för', 'så',
    'eftersom', 'fast', 'fastän', 'trots',
    // Common verbs
    'är', 'var', 'vara', 'har', 'hade', 'ha', 'blir', 'blev', 'bli',
    'ska', 'skulle', 'kan', 'kunde', 'vill', 'ville', 'måste', 'bör',
    'gör', 'gjorde', 'går', 'gick', 'kommer', 'kom', 'får', 'fick',
    'finns', 'ser', 'tar', 'ger', 'säger',
    // Adverbs & particles
    'inte', 'mycket', 'mer', 'mest', 'också', 'redan', 'bara', 'här', 'där',
    'ja', 'nej', 'väl', 'ju', 'nog', 'så', 'nu', 'då', 'aldrig', 'alltid',
    'ofta', 'ibland', 'ganska', 'lite', 'sedan', 'ännu',
    // Determiners
    'alla', 'varje', 'någon', 'något', 'några', 'ingen', 'inget', 'inga',
    'annan', 'annat', 'andra', 'samma', 'egen', 'eget', 'egna',
    // Numbers
    'en', 'två', 'tre',
    // Question words
    'vad', 'vem', 'var', 'hur', 'vilken', 'vilket', 'vilka', 'varför',
  ]),
  welsh: new Set([
    // Articles & particles
    'y', 'yr', "'r", 'a', 'o', 'i', 'yn', 'ar', 'am', 'at', 'gan', 'gyda',
    'heb', 'dan', 'dros', 'drwy', 'rhwng', 'ers', 'cyn', 'wedi', 'wrth',
    // Pronouns
    'fi', 'ti', 'fe', 'hi', 'ni', 'chi', 'nhw', 'e',
    'fy', 'dy', 'ei', 'ein', 'eich', 'eu',
    // Conjunctions
    'a', 'ac', 'neu', 'ond', 'achos', 'oherwydd', 'os', 'pan', 'er', 'fel',
    'bod', 'fod', 'mai', 'taw',
    // Forms of bod (to be)
    'dw', 'rwyt', 'mae', 'rydyn', 'rydych', 'maen',
    'oedd', 'roedd', 'roeddwn', 'roeddet', 'roedden', 'roeddech',
    'bydd', 'bydda', 'byddi', 'byddwn', 'byddwch', 'byddan',
    'yw', 'ydy', 'oes', 'oedd',
    // Common verbs
    'mynd', 'dod', 'gwneud', 'cael', 'gallu', 'gwybod',
    // Negation & adverbs
    'ddim', 'dim', 'nid', 'nad', 'na',
    'iawn', 'hefyd', 'yma', 'yna', 'nawr', 'heddiw', 'yfory', 'ddoe',
    'byth', 'erioed', 'bob', 'pob', 'rhai',
    // Determiners
    'hon', 'hwn', 'hyn', 'hynny', 'un', 'ryw', 'rhyw',
    // Question words
    'beth', 'pwy', 'ble', 'sut', 'pryd', 'pam', 'faint', 'pa',
    // Numbers
    'un', 'dau', 'dwy', 'tri', 'tair', 'pedwar', 'pedair', 'pump', 'deg',
  ]),
  hindi: new Set([
    // Pronouns
    'मैं', 'तू', 'तुम', 'आप', 'वह', 'यह', 'हम', 'वे', 'ये',
    'मुझे', 'मुझको', 'तुझे', 'तुम्हें', 'आपको', 'उसे', 'इसे', 'हमें', 'उन्हें', 'इन्हें',
    'मेरा', 'मेरी', 'मेरे', 'तेरा', 'तेरी', 'तेरे',
    'तुम्हारा', 'तुम्हारी', 'तुम्हारे', 'आपका', 'आपकी', 'आपके',
    'उसका', 'उसकी', 'उसके', 'इसका', 'इसकी', 'इसके',
    'हमारा', 'हमारी', 'हमारे', 'उनका', 'उनकी', 'उनके',
    // Postpositions
    'में', 'पर', 'को', 'से', 'का', 'की', 'के', 'ने', 'तक', 'द्वारा',
    'के लिए', 'की तरफ', 'के बारे', 'के साथ', 'के बाद', 'के पहले',
    // Conjunctions
    'और', 'या', 'लेकिन', 'मगर', 'कि', 'क्योंकि', 'जब', 'अगर', 'तो',
    'पर', 'परंतु', 'इसलिए', 'ताकि', 'जैसे', 'हालाँकि',
    // Common verbs (forms of होना, करना)
    'है', 'हैं', 'हूँ', 'हो', 'था', 'थी', 'थे', 'थीं',
    'होना', 'करना', 'जाना', 'आना', 'देना', 'लेना',
    'करता', 'करती', 'करते', 'किया', 'की', 'किए',
    'हुआ', 'हुई', 'हुए', 'गया', 'गई', 'गए',
    // Negation & adverbs
    'नहीं', 'न', 'मत', 'हाँ', 'जी',
    'बहुत', 'बस', 'भी', 'ही', 'तो', 'सब', 'कुछ', 'कभी', 'अभी',
    'यहाँ', 'वहाँ', 'कहाँ', 'आज', 'कल', 'अब', 'फिर',
    // Demonstratives
    'यह', 'वह', 'ये', 'वे', 'इस', 'उस', 'इन', 'उन',
    // Question words
    'क्या', 'कौन', 'कहाँ', 'कब', 'कैसे', 'क्यों', 'कितना', 'कितनी', 'कितने', 'कौनसा',
    // Numbers
    'एक', 'दो', 'तीन',
    // Common other
    'वाला', 'वाली', 'वाले', 'सा', 'सी', 'से',
  ]),
  turkish: new Set([
    // Articles/determiners (Turkish has no articles, but common determiners)
    'bir', 'bu', 'şu', 'o', 'her', 'bazı', 'birkaç', 'hiç', 'bütün', 'tüm',
    // Pronouns
    'ben', 'sen', 'o', 'biz', 'siz', 'onlar',
    'beni', 'seni', 'onu', 'bizi', 'sizi', 'onları',
    'bana', 'sana', 'ona', 'bize', 'size', 'onlara',
    'benim', 'senin', 'onun', 'bizim', 'sizin', 'onların',
    'bende', 'sende', 'onda', 'bizde', 'sizde', 'onlarda',
    'benden', 'senden', 'ondan', 'bizden', 'sizden', 'onlardan',
    'kendi', 'kendim', 'kendin', 'kendisi',
    // Postpositions
    'için', 'ile', 'gibi', 'kadar', 'göre', 'doğru', 'karşı',
    // Conjunctions
    've', 'veya', 'ya', 'ama', 'fakat', 'ancak', 'çünkü', 'ki', 'de', 'da',
    'ne', 'hem', 'eğer', 'ise', 'oysa', 'yoksa', 'bile',
    // Common verbs (conjugated)
    'var', 'yok', 'olan', 'olur', 'oluyor', 'oldu', 'olacak',
    'olan', 'yapan', 'eden', 'gelen', 'giden', 'alan', 'veren',
    // Adverbs & particles
    'değil', 'mi', 'mı', 'mu', 'mü', 'hayır', 'evet',
    'çok', 'az', 'en', 'daha', 'pek', 'hiç', 'bile',
    'şimdi', 'sonra', 'önce', 'hep', 'hâlâ', 'artık', 'henüz',
    'burada', 'orada', 'şurada', 'nerede', 'nasıl', 'ne', 'neden', 'niçin',
    // Question words
    'kim', 'ne', 'nerede', 'nasıl', 'neden', 'kaç', 'hangi',
    // Numbers
    'bir', 'iki', 'üç',
  ]),
  russian: new Set([
    // Pronouns
    'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они',
    'меня', 'тебя', 'его', 'её', 'нас', 'вас', 'их',
    'мне', 'тебе', 'ему', 'ей', 'нам', 'вам', 'им',
    'мной', 'тобой', 'ним', 'ней', 'нами', 'вами', 'ними',
    'мой', 'моя', 'моё', 'мои', 'твой', 'твоя', 'твоё', 'твои',
    'его', 'её', 'наш', 'наша', 'наше', 'наши', 'ваш', 'ваша', 'ваше', 'ваши', 'их',
    'этот', 'эта', 'это', 'эти', 'тот', 'та', 'то', 'те',
    'кто', 'что', 'какой', 'какая', 'какое', 'какие', 'который', 'которая', 'которое', 'которые',
    'весь', 'вся', 'всё', 'все', 'сам', 'сама', 'само', 'сами', 'свой', 'своя', 'своё', 'свои',
    // Prepositions
    'в', 'на', 'с', 'из', 'к', 'о', 'об', 'за', 'от', 'до', 'по', 'при', 'без', 'через',
    'для', 'у', 'над', 'под', 'между', 'перед', 'после', 'вместе',
    // Conjunctions
    'и', 'а', 'но', 'или', 'что', 'чтобы', 'когда', 'если', 'потому', 'хотя',
    'так', 'как', 'где', 'куда', 'откуда', 'почему', 'зачем',
    // Common verbs
    'быть', 'есть', 'было', 'будет', 'нет', 'можно', 'нельзя', 'надо', 'нужно',
    'знать', 'хотеть', 'мочь', 'делать', 'говорить', 'идти', 'дать', 'стать',
    // Adverbs & particles
    'не', 'ни', 'да', 'нет', 'очень', 'тоже', 'также', 'ещё', 'уже', 'только',
    'здесь', 'тут', 'там', 'сюда', 'туда', 'сейчас', 'тогда', 'потом',
    'всегда', 'никогда', 'часто', 'иногда', 'редко', 'вообще',
    'хорошо', 'плохо', 'много', 'мало', 'больше', 'меньше',
    // Numbers
    'один', 'два', 'три',
    // Particles
    'бы', 'ли', 'же', 'ведь', 'вот', 'вон',
  ]),
  japanese: new Set([
    // Particles (their own tokens on pre-tokenized cards)
    'は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'か', 'ね', 'よ',
    'から', 'まで', 'より', 'や',
    // Copula & polite machinery
    'です', 'でした', 'じゃない', 'ではありません', 'だ',
    'ます', 'ません', 'ました', 'ませんでした',
    // Pronouns & demonstratives
    '私', 'わたし', 'これ', 'それ', 'あれ', 'ここ', 'そこ', 'あそこ',
    'この', 'その', 'あの',
    // Yes/no & fillers
    'はい', 'いいえ', 'ええ', 'そう',
    // Question words
    '何', 'なに', 'なん', 'だれ', '誰', 'どこ', 'いつ', 'どう', 'どれ',
  ]),
};

export function isCommonWord(word: string, lang: Language): boolean {
  const set = COMMON_WORDS[lang];
  return set ? set.has(word.toLowerCase()) : false;
}

// ── Record words from a studied card ────────────────────────
// Takes the card (not a bare sentence): pre-tokenized (ja) cards key vocab
// by their surface tokens — the whitespace path would record the ENTIRE
// sentence as one garbage entry, and the <2-char skip would drop every
// single-kanji word (水, 本, 私).
export function recordWordsFromCard(
  card: CardText,
  vocabMap: VocabMap,
  lookupFn: (w: string) => DictEntry | null,
  wasFailure: boolean,
): VocabMap {
  const tokens: [string, string][] = card.tokens?.length
    ? card.tokens
        .map((t): [string, string] => [t.t, t.t]) // caseless script — key = surface
        .filter(([k]) => !PUNCT_TOKEN.test(k))
    : tokenizeSentenceWithCase(card.target);
  const now = Date.now();
  const updated = { ...vocabMap };

  for (const [key, display] of tokens) {
    if (key.length < 2 && !hasCjk(key)) continue; // skip single chars (single kanji/kana are real words)

    const existing = updated[key];
    if (existing) {
      // Refresh translation from dictionary if available (fixes stale cached translations)
      const freshEntry = lookupFn(key);
      const freshTranslation = freshEntry?.en && freshEntry.en !== 'see context' ? freshEntry.en : existing.translation;
      updated[key] = {
        ...existing,
        // Upgrade display form if we see a capitalized version (proper noun)
        word: display !== key && existing.word === key ? display : existing.word,
        translation: freshTranslation,
        pos: freshEntry?.pos || existing.pos,
        lastSeen: now,
        timesSeen: existing.timesSeen + 1,
        timesFailed: existing.timesFailed + (wasFailure ? 1 : 0),
      };
    } else {
      const entry = lookupFn(key);
      updated[key] = {
        word: display,
        translation: entry?.en || '',
        ipa: entry?.ipa || '',
        pos: entry?.pos,
        firstSeen: now,
        lastSeen: now,
        timesSeen: 1,
        timesFailed: wasFailure ? 1 : 0,
      };
    }
  }

  return updated;
}
