const fs = require('fs');
const path = require('path');

const deck = require('../src/data/spanish/deck.json');
const PATCH = require('./es-align-patch.cjs');

// Comprehensive Spanish word -> English meaning dictionary
// For function words, articles, prepositions, pronouns, conjunctions
const FUNC_WORDS = {
  // Articles
  'el': 'the', 'la': 'the', 'los': 'the', 'las': 'the',
  'un': 'a', 'una': 'a', 'unos': 'some', 'unas': 'some',
  'al': 'to the', 'del': 'of the',
  // Prepositions
  'de': 'of', 'en': 'in', 'a': 'to', 'con': 'with', 'por': 'for',
  'para': 'for', 'sin': 'without', 'sobre': 'about',
  'entre': 'between', 'hasta': 'until', 'desde': 'from',
  'hacia': 'toward', 'durante': 'during', 'según': 'according to',
  'contra': 'against', 'tras': 'after', 'mediante': 'through',
  'ante': 'before', 'bajo': 'under', 'excepto': 'except',
  'salvo': 'except',
  // Subject pronouns
  'yo': 'I', 'tú': 'you', 'él': 'he', 'ella': 'she',
  'usted': 'you', 'nosotros': 'we', 'nosotras': 'we',
  'vosotros': 'you all', 'vosotras': 'you all',
  'ellos': 'they', 'ellas': 'they', 'ustedes': 'you all',
  // Object pronouns
  'me': 'me', 'te': 'you', 'lo': 'it/him', 'la2': 'her/it',
  'le': 'him/her', 'nos': 'us', 'os': 'you all',
  'les': 'them', 'se': 'oneself',
  // Possessives
  'mi': 'my', 'mis': 'my', 'tu': 'your', 'tus': 'your',
  'su': 'his/her', 'sus': 'his/her', 'nuestro': 'our',
  'nuestra': 'our', 'nuestros': 'our', 'nuestras': 'our',
  'vuestro': 'your', 'vuestra': 'your', 'vuestros': 'your',
  'vuestras': 'your', 'suyo': 'his/hers', 'suya': 'his/hers',
  'suyos': 'his/hers', 'suyas': 'his/hers',
  'mío': 'mine', 'mía': 'mine', 'míos': 'mine', 'mías': 'mine',
  'tuyo': 'yours', 'tuya': 'yours', 'tuyos': 'yours', 'tuyas': 'yours',
  // Demonstratives
  'este': 'this', 'esta': 'this', 'estos': 'these', 'estas': 'these',
  'ese': 'that', 'esa': 'that', 'esos': 'those', 'esas': 'those',
  'aquel': 'that', 'aquella': 'that', 'aquellos': 'those', 'aquellas': 'those',
  'esto': 'this', 'eso': 'that', 'aquello': 'that',
  // Conjunctions
  'y': 'and', 'e': 'and', 'o': 'or', 'u': 'or', 'pero': 'but',
  'sino': 'but rather', 'ni': 'nor', 'que': 'that',
  'porque': 'because', 'aunque': 'although', 'cuando': 'when',
  'si': 'if', 'como': 'as/like', 'donde': 'where',
  'mientras': 'while', 'pues': 'since/well',
  'ya': 'already', 'también': 'also', 'tampoco': 'neither',
  'además': 'moreover', 'sin embargo': 'however',
  // Question words
  'qué': 'what', 'quién': 'who', 'quiénes': 'who',
  'cuál': 'which', 'cuáles': 'which',
  'cómo': 'how', 'dónde': 'where', 'cuándo': 'when',
  'cuánto': 'how much', 'cuánta': 'how much',
  'cuántos': 'how many', 'cuántas': 'how many',
  'por qué': 'why',
  // Negation
  'no': 'no/not', 'nada': 'nothing', 'nadie': 'nobody',
  'nunca': 'never', 'jamás': 'never', 'ningún': 'no/none',
  'ninguno': 'none', 'ninguna': 'none',
  // Adverbs
  'muy': 'very', 'más': 'more', 'menos': 'less',
  'bien': 'well', 'mal': 'badly', 'mucho': 'much/a lot',
  'poco': 'little', 'bastante': 'quite', 'demasiado': 'too much',
  'tan': 'so', 'tanto': 'so much', 'tanta': 'so much',
  'tantos': 'so many', 'tantas': 'so many',
  'aquí': 'here', 'ahí': 'there', 'allí': 'there',
  'acá': 'here', 'allá': 'there',
  'ahora': 'now', 'hoy': 'today', 'ayer': 'yesterday',
  'mañana': 'tomorrow', 'siempre': 'always',
  'todavía': 'still', 'aún': 'still/yet',
  'casi': 'almost', 'solo': 'only', 'sólo': 'only',
  'quizás': 'perhaps', 'quizá': 'perhaps', 'tal vez': 'perhaps',
  'pronto': 'soon', 'tarde': 'late', 'temprano': 'early',
  'despacio': 'slowly', 'rápido': 'fast',
  'cerca': 'near', 'lejos': 'far',
  'dentro': 'inside', 'fuera': 'outside',
  'arriba': 'up', 'abajo': 'down',
  'adelante': 'forward', 'atrás': 'back',
  'junto': 'together', 'juntos': 'together', 'juntas': 'together',
  // Other common
  'hay': 'there is/are', 'así': 'so/thus',
  'luego': 'then', 'después': 'after',
  'antes': 'before', 'entonces': 'then',
  'cada': 'each', 'todo': 'all', 'toda': 'all',
  'todos': 'all', 'todas': 'all',
  'otro': 'other', 'otra': 'other', 'otros': 'others', 'otras': 'others',
  'mismo': 'same', 'misma': 'same', 'mismos': 'same', 'mismas': 'same',
  'algo': 'something', 'alguien': 'someone',
  'algún': 'some', 'alguno': 'some', 'alguna': 'some',
  'algunos': 'some', 'algunas': 'some',
  'varios': 'several', 'varias': 'several',
  'cual': 'which', 'cuyo': 'whose', 'cuya': 'whose',
  'cuyos': 'whose', 'cuyas': 'whose',
};

// Verb conjugation -> infinitive mapping
// Format: conjugated form -> [infinitive, english meaning]
const VERB_MAP = {
  // ser (to be)
  'soy': ['ser', 'to be'], 'eres': ['ser', 'to be'], 'es': ['ser', 'to be'],
  'somos': ['ser', 'to be'], 'sois': ['ser', 'to be'], 'son': ['ser', 'to be'],
  'era': ['ser', 'to be'], 'eras': ['ser', 'to be'], 'éramos': ['ser', 'to be'],
  'eran': ['ser', 'to be'], 'fui': ['ser/ir', 'to be/to go'], 'fue': ['ser/ir', 'to be/to go'],
  'fuimos': ['ser/ir', 'to be/to go'], 'fueron': ['ser/ir', 'to be/to go'],
  'fuiste': ['ser/ir', 'to be/to go'], 'fuisteis': ['ser/ir', 'to be/to go'],
  'sea': ['ser', 'to be'], 'seas': ['ser', 'to be'], 'seamos': ['ser', 'to be'],
  'sean': ['ser', 'to be'], 'sido': ['ser', 'to be'], 'siendo': ['ser', 'to be'],
  'será': ['ser', 'to be'], 'serán': ['ser', 'to be'], 'sería': ['ser', 'to be'],
  'serían': ['ser', 'to be'], 'seré': ['ser', 'to be'], 'serás': ['ser', 'to be'],
  'seríamos': ['ser', 'to be'], 'fuera': ['ser/ir', 'to be/to go'],
  'fueras': ['ser/ir', 'to be/to go'], 'fuéramos': ['ser/ir', 'to be/to go'],
  'fueran': ['ser/ir', 'to be/to go'], 'fuese': ['ser/ir', 'to be/to go'],
  'fuesen': ['ser/ir', 'to be/to go'],
  // estar (to be)
  'estoy': ['estar', 'to be'], 'estás': ['estar', 'to be'], 'está': ['estar', 'to be'],
  'estamos': ['estar', 'to be'], 'estáis': ['estar', 'to be'], 'están': ['estar', 'to be'],
  'estaba': ['estar', 'to be'], 'estabas': ['estar', 'to be'], 'estábamos': ['estar', 'to be'],
  'estaban': ['estar', 'to be'], 'estuvo': ['estar', 'to be'], 'estuve': ['estar', 'to be'],
  'estuvimos': ['estar', 'to be'], 'estuvieron': ['estar', 'to be'],
  'esté': ['estar', 'to be'], 'estés': ['estar', 'to be'], 'estén': ['estar', 'to be'],
  'estado': ['estar', 'to be'], 'estando': ['estar', 'to be'],
  'estará': ['estar', 'to be'], 'estarán': ['estar', 'to be'],
  'estaría': ['estar', 'to be'], 'estarían': ['estar', 'to be'],
  'estuviera': ['estar', 'to be'], 'estuviéramos': ['estar', 'to be'],
  'estuvieran': ['estar', 'to be'],
  // haber (to have - auxiliary)
  'he': ['haber', 'to have'], 'has': ['haber', 'to have'], 'ha': ['haber', 'to have'],
  'hemos': ['haber', 'to have'], 'habéis': ['haber', 'to have'], 'han': ['haber', 'to have'],
  'había': ['haber', 'to have'], 'habías': ['haber', 'to have'],
  'habíamos': ['haber', 'to have'], 'habían': ['haber', 'to have'],
  'hubo': ['haber', 'to have'], 'hube': ['haber', 'to have'],
  'haya': ['haber', 'to have'], 'hayas': ['haber', 'to have'],
  'hayamos': ['haber', 'to have'], 'hayan': ['haber', 'to have'],
  'habrá': ['haber', 'to have'], 'habrán': ['haber', 'to have'],
  'habría': ['haber', 'to have'], 'habrían': ['haber', 'to have'],
  'hubiera': ['haber', 'to have'], 'hubiéramos': ['haber', 'to have'],
  'hubieran': ['haber', 'to have'], 'hubiera': ['haber', 'to have'],
  'hubiese': ['haber', 'to have'], 'hubiesen': ['haber', 'to have'],
  // tener (to have)
  'tengo': ['tener', 'to have'], 'tienes': ['tener', 'to have'], 'tiene': ['tener', 'to have'],
  'tenemos': ['tener', 'to have'], 'tenéis': ['tener', 'to have'], 'tienen': ['tener', 'to have'],
  'tenía': ['tener', 'to have'], 'tenías': ['tener', 'to have'],
  'teníamos': ['tener', 'to have'], 'tenían': ['tener', 'to have'],
  'tuvo': ['tener', 'to have'], 'tuve': ['tener', 'to have'],
  'tuvimos': ['tener', 'to have'], 'tuvieron': ['tener', 'to have'],
  'tuviste': ['tener', 'to have'],
  'tenga': ['tener', 'to have'], 'tengas': ['tener', 'to have'],
  'tengamos': ['tener', 'to have'], 'tengan': ['tener', 'to have'],
  'tenido': ['tener', 'to have'], 'teniendo': ['tener', 'to have'],
  'tendrá': ['tener', 'to have'], 'tendrán': ['tener', 'to have'],
  'tendré': ['tener', 'to have'], 'tendrás': ['tener', 'to have'],
  'tendría': ['tener', 'to have'], 'tendrían': ['tener', 'to have'],
  'tuviera': ['tener', 'to have'], 'tuviéramos': ['tener', 'to have'],
  'tuvieran': ['tener', 'to have'],
  // ir (to go)
  'voy': ['ir', 'to go'], 'vas': ['ir', 'to go'], 'va': ['ir', 'to go'],
  'vamos': ['ir', 'to go'], 'vais': ['ir', 'to go'], 'van': ['ir', 'to go'],
  'iba': ['ir', 'to go'], 'ibas': ['ir', 'to go'], 'íbamos': ['ir', 'to go'],
  'iban': ['ir', 'to go'],
  'vaya': ['ir', 'to go'], 'vayas': ['ir', 'to go'], 'vayamos': ['ir', 'to go'],
  'vayan': ['ir', 'to go'], 'ido': ['ir', 'to go'], 'yendo': ['ir', 'to go'],
  'irá': ['ir', 'to go'], 'irán': ['ir', 'to go'], 'iré': ['ir', 'to go'],
  'irás': ['ir', 'to go'], 'iría': ['ir', 'to go'], 'irían': ['ir', 'to go'],
  // hacer (to do/make)
  'hago': ['hacer', 'to do/make'], 'haces': ['hacer', 'to do/make'], 'hace': ['hacer', 'to do/make'],
  'hacemos': ['hacer', 'to do/make'], 'hacéis': ['hacer', 'to do/make'], 'hacen': ['hacer', 'to do/make'],
  'hacía': ['hacer', 'to do/make'], 'hacías': ['hacer', 'to do/make'],
  'hacíamos': ['hacer', 'to do/make'], 'hacían': ['hacer', 'to do/make'],
  'hizo': ['hacer', 'to do/make'], 'hice': ['hacer', 'to do/make'],
  'hicimos': ['hacer', 'to do/make'], 'hicieron': ['hacer', 'to do/make'],
  'hiciste': ['hacer', 'to do/make'],
  'haga': ['hacer', 'to do/make'], 'hagas': ['hacer', 'to do/make'],
  'hagamos': ['hacer', 'to do/make'], 'hagan': ['hacer', 'to do/make'],
  'hecho': ['hacer', 'to do/make'], 'haciendo': ['hacer', 'to do/make'],
  'hará': ['hacer', 'to do/make'], 'harán': ['hacer', 'to do/make'],
  'haré': ['hacer', 'to do/make'], 'harás': ['hacer', 'to do/make'],
  'haría': ['hacer', 'to do/make'], 'harían': ['hacer', 'to do/make'],
  'hiciera': ['hacer', 'to do/make'], 'hiciéramos': ['hacer', 'to do/make'],
  'hicieran': ['hacer', 'to do/make'],
  // poder (to be able)
  'puedo': ['poder', 'to be able'], 'puedes': ['poder', 'to be able'], 'puede': ['poder', 'to be able'],
  'podemos': ['poder', 'to be able'], 'podéis': ['poder', 'to be able'], 'pueden': ['poder', 'to be able'],
  'podía': ['poder', 'to be able'], 'podías': ['poder', 'to be able'],
  'podíamos': ['poder', 'to be able'], 'podían': ['poder', 'to be able'],
  'pudo': ['poder', 'to be able'], 'pude': ['poder', 'to be able'],
  'pudimos': ['poder', 'to be able'], 'pudieron': ['poder', 'to be able'],
  'pueda': ['poder', 'to be able'], 'puedas': ['poder', 'to be able'],
  'puedan': ['poder', 'to be able'], 'podido': ['poder', 'to be able'],
  'pudiendo': ['poder', 'to be able'],
  'podrá': ['poder', 'to be able'], 'podrán': ['poder', 'to be able'],
  'podré': ['poder', 'to be able'], 'podrás': ['poder', 'to be able'],
  'podría': ['poder', 'to be able'], 'podrían': ['poder', 'to be able'],
  'pudiera': ['poder', 'to be able'], 'pudiéramos': ['poder', 'to be able'],
  'pudieran': ['poder', 'to be able'],
  // querer (to want)
  'quiero': ['querer', 'to want'], 'quieres': ['querer', 'to want'], 'quiere': ['querer', 'to want'],
  'queremos': ['querer', 'to want'], 'queréis': ['querer', 'to want'], 'quieren': ['querer', 'to want'],
  'quería': ['querer', 'to want'], 'querías': ['querer', 'to want'],
  'queríamos': ['querer', 'to want'], 'querían': ['querer', 'to want'],
  'quiso': ['querer', 'to want'], 'quise': ['querer', 'to want'],
  'quisimos': ['querer', 'to want'], 'quisieron': ['querer', 'to want'],
  'quiera': ['querer', 'to want'], 'quieras': ['querer', 'to want'],
  'quieran': ['querer', 'to want'], 'querido': ['querer', 'to want'],
  'queriendo': ['querer', 'to want'],
  'querrá': ['querer', 'to want'], 'querrán': ['querer', 'to want'],
  'querré': ['querer', 'to want'], 'querrás': ['querer', 'to want'],
  'querría': ['querer', 'to want'], 'querrían': ['querer', 'to want'],
  'quisiera': ['querer', 'to want'], 'quisiéramos': ['querer', 'to want'],
  'quisieran': ['querer', 'to want'],
  // decir (to say/tell)
  'digo': ['decir', 'to say'], 'dices': ['decir', 'to say'], 'dice': ['decir', 'to say'],
  'decimos': ['decir', 'to say'], 'decís': ['decir', 'to say'], 'dicen': ['decir', 'to say'],
  'decía': ['decir', 'to say'], 'decías': ['decir', 'to say'],
  'decíamos': ['decir', 'to say'], 'decían': ['decir', 'to say'],
  'dijo': ['decir', 'to say'], 'dije': ['decir', 'to say'],
  'dijimos': ['decir', 'to say'], 'dijeron': ['decir', 'to say'],
  'dijiste': ['decir', 'to say'],
  'diga': ['decir', 'to say'], 'digas': ['decir', 'to say'],
  'digamos': ['decir', 'to say'], 'digan': ['decir', 'to say'],
  'dicho': ['decir', 'to say'], 'diciendo': ['decir', 'to say'],
  'dirá': ['decir', 'to say'], 'dirán': ['decir', 'to say'],
  'diré': ['decir', 'to say'], 'dirás': ['decir', 'to say'],
  'diría': ['decir', 'to say'], 'dirían': ['decir', 'to say'],
  'dijera': ['decir', 'to say'], 'dijéramos': ['decir', 'to say'],
  'dijesen': ['decir', 'to say'],
  // saber (to know)
  'sé': ['saber', 'to know'], 'sabes': ['saber', 'to know'], 'sabe': ['saber', 'to know'],
  'sabemos': ['saber', 'to know'], 'sabéis': ['saber', 'to know'], 'saben': ['saber', 'to know'],
  'sabía': ['saber', 'to know'], 'sabías': ['saber', 'to know'],
  'sabíamos': ['saber', 'to know'], 'sabían': ['saber', 'to know'],
  'supo': ['saber', 'to know'], 'supe': ['saber', 'to know'],
  'supimos': ['saber', 'to know'], 'supieron': ['saber', 'to know'],
  'sepa': ['saber', 'to know'], 'sepas': ['saber', 'to know'],
  'sepan': ['saber', 'to know'], 'sabido': ['saber', 'to know'],
  'sabiendo': ['saber', 'to know'],
  'sabrá': ['saber', 'to know'], 'sabrán': ['saber', 'to know'],
  'sabré': ['saber', 'to know'], 'sabrás': ['saber', 'to know'],
  'sabría': ['saber', 'to know'], 'sabrían': ['saber', 'to know'],
  'supiera': ['saber', 'to know'], 'supiéramos': ['saber', 'to know'],
  'supieran': ['saber', 'to know'],
  // dar (to give)
  'doy': ['dar', 'to give'], 'das': ['dar', 'to give'], 'da': ['dar', 'to give'],
  'damos': ['dar', 'to give'], 'dais': ['dar', 'to give'], 'dan': ['dar', 'to give'],
  'daba': ['dar', 'to give'], 'dabas': ['dar', 'to give'],
  'dábamos': ['dar', 'to give'], 'daban': ['dar', 'to give'],
  'dio': ['dar', 'to give'], 'di': ['dar', 'to give'],
  'dimos': ['dar', 'to give'], 'dieron': ['dar', 'to give'],
  'dé': ['dar', 'to give'], 'des': ['dar', 'to give'],
  'den': ['dar', 'to give'], 'dado': ['dar', 'to give'],
  'dando': ['dar', 'to give'],
  'dará': ['dar', 'to give'], 'darán': ['dar', 'to give'],
  'daré': ['dar', 'to give'], 'darás': ['dar', 'to give'],
  'daría': ['dar', 'to give'], 'darían': ['dar', 'to give'],
  'diera': ['dar', 'to give'], 'diéramos': ['dar', 'to give'],
  'dieran': ['dar', 'to give'],
  // ver (to see)
  'veo': ['ver', 'to see'], 'ves': ['ver', 'to see'], 've': ['ver', 'to see'],
  'vemos': ['ver', 'to see'], 'veis': ['ver', 'to see'], 'ven': ['ver', 'to see'],
  'veía': ['ver', 'to see'], 'veías': ['ver', 'to see'],
  'veíamos': ['ver', 'to see'], 'veían': ['ver', 'to see'],
  'vio': ['ver', 'to see'], 'vi': ['ver', 'to see'],
  'vimos': ['ver', 'to see'], 'vieron': ['ver', 'to see'],
  'vea': ['ver', 'to see'], 'veas': ['ver', 'to see'],
  'vean': ['ver', 'to see'], 'visto': ['ver', 'to see'],
  'viendo': ['ver', 'to see'],
  // poner (to put)
  'pongo': ['poner', 'to put'], 'pones': ['poner', 'to put'], 'pone': ['poner', 'to put'],
  'ponemos': ['poner', 'to put'], 'ponéis': ['poner', 'to put'], 'ponen': ['poner', 'to put'],
  'ponía': ['poner', 'to put'], 'ponías': ['poner', 'to put'],
  'poníamos': ['poner', 'to put'], 'ponían': ['poner', 'to put'],
  'puso': ['poner', 'to put'], 'puse': ['poner', 'to put'],
  'pusimos': ['poner', 'to put'], 'pusieron': ['poner', 'to put'],
  'ponga': ['poner', 'to put'], 'pongas': ['poner', 'to put'],
  'pongan': ['poner', 'to put'], 'puesto': ['poner', 'to put'],
  'poniendo': ['poner', 'to put'],
  'pondrá': ['poner', 'to put'], 'pondrán': ['poner', 'to put'],
  'pondré': ['poner', 'to put'], 'pondrás': ['poner', 'to put'],
  'pondría': ['poner', 'to put'], 'pondrían': ['poner', 'to put'],
  // venir (to come)
  'vengo': ['venir', 'to come'], 'vienes': ['venir', 'to come'], 'viene': ['venir', 'to come'],
  'venimos': ['venir', 'to come'], 'venís': ['venir', 'to come'], 'vienen': ['venir', 'to come'],
  'venía': ['venir', 'to come'], 'venías': ['venir', 'to come'],
  'veníamos': ['venir', 'to come'], 'venían': ['venir', 'to come'],
  'vino': ['venir', 'to come'], 'vine': ['venir', 'to come'],
  'vinimos': ['venir', 'to come'], 'vinieron': ['venir', 'to come'],
  'venga': ['venir', 'to come'], 'vengas': ['venir', 'to come'],
  'vengan': ['venir', 'to come'], 'venido': ['venir', 'to come'],
  'viniendo': ['venir', 'to come'],
  'vendrá': ['venir', 'to come'], 'vendrán': ['venir', 'to come'],
  'vendré': ['venir', 'to come'], 'vendrás': ['venir', 'to come'],
  'vendría': ['venir', 'to come'], 'vendrían': ['venir', 'to come'],
  'viniera': ['venir', 'to come'], 'viniéramos': ['venir', 'to come'],
  'vinieran': ['venir', 'to come'],
  // salir (to leave/go out)
  'salgo': ['salir', 'to leave'], 'sales': ['salir', 'to leave'], 'sale': ['salir', 'to leave'],
  'salimos': ['salir', 'to leave'], 'salís': ['salir', 'to leave'], 'salen': ['salir', 'to leave'],
  'salía': ['salir', 'to leave'], 'salías': ['salir', 'to leave'],
  'salíamos': ['salir', 'to leave'], 'salían': ['salir', 'to leave'],
  'salió': ['salir', 'to leave'], 'salí': ['salir', 'to leave'],
  'salga': ['salir', 'to leave'], 'salgan': ['salir', 'to leave'],
  'salido': ['salir', 'to leave'], 'saliendo': ['salir', 'to leave'],
  'saldrá': ['salir', 'to leave'], 'saldrán': ['salir', 'to leave'],
  'saldré': ['salir', 'to leave'], 'saldrás': ['salir', 'to leave'],
  'saldría': ['salir', 'to leave'], 'saldrían': ['salir', 'to leave'],
  // conocer (to know/meet)
  'conozco': ['conocer', 'to know'], 'conoces': ['conocer', 'to know'], 'conoce': ['conocer', 'to know'],
  'conocemos': ['conocer', 'to know'], 'conocen': ['conocer', 'to know'],
  'conocía': ['conocer', 'to know'], 'conocían': ['conocer', 'to know'],
  'conoció': ['conocer', 'to know'], 'conocí': ['conocer', 'to know'],
  'conozca': ['conocer', 'to know'], 'conozcan': ['conocer', 'to know'],
  'conocido': ['conocer', 'to know'], 'conociendo': ['conocer', 'to know'],
  // llevar (to carry/wear)
  'llevo': ['llevar', 'to carry'], 'llevas': ['llevar', 'to carry'], 'lleva': ['llevar', 'to carry'],
  'llevamos': ['llevar', 'to carry'], 'llevan': ['llevar', 'to carry'],
  'llevaba': ['llevar', 'to carry'], 'llevaban': ['llevar', 'to carry'],
  'llevó': ['llevar', 'to carry'], 'llevé': ['llevar', 'to carry'],
  'llevado': ['llevar', 'to carry'], 'llevando': ['llevar', 'to carry'],
  // llamar (to call)
  'llamo': ['llamar', 'to call'], 'llamas': ['llamar', 'to call'], 'llama': ['llamar', 'to call'],
  'llamamos': ['llamar', 'to call'], 'llaman': ['llamar', 'to call'],
  'llamaba': ['llamar', 'to call'], 'llamaban': ['llamar', 'to call'],
  'llamó': ['llamar', 'to call'], 'llamé': ['llamar', 'to call'],
  'llamado': ['llamar', 'to call'], 'llamando': ['llamar', 'to call'],
  // creer (to believe)
  'creo': ['creer', 'to believe'], 'crees': ['creer', 'to believe'], 'cree': ['creer', 'to believe'],
  'creemos': ['creer', 'to believe'], 'creen': ['creer', 'to believe'],
  'creía': ['creer', 'to believe'], 'creían': ['creer', 'to believe'],
  'creyó': ['creer', 'to believe'], 'creí': ['creer', 'to believe'],
  'crea': ['creer', 'to believe'], 'crean': ['creer', 'to believe'],
  'creído': ['creer', 'to believe'], 'creyendo': ['creer', 'to believe'],
  // pensar (to think)
  'pienso': ['pensar', 'to think'], 'piensas': ['pensar', 'to think'], 'piensa': ['pensar', 'to think'],
  'pensamos': ['pensar', 'to think'], 'piensan': ['pensar', 'to think'],
  'pensaba': ['pensar', 'to think'], 'pensaban': ['pensar', 'to think'],
  'pensó': ['pensar', 'to think'], 'pensé': ['pensar', 'to think'],
  'piense': ['pensar', 'to think'], 'piensen': ['pensar', 'to think'],
  'pensado': ['pensar', 'to think'], 'pensando': ['pensar', 'to think'],
  // sentir (to feel)
  'siento': ['sentir', 'to feel'], 'sientes': ['sentir', 'to feel'], 'siente': ['sentir', 'to feel'],
  'sentimos': ['sentir', 'to feel'], 'sienten': ['sentir', 'to feel'],
  'sentía': ['sentir', 'to feel'], 'sentían': ['sentir', 'to feel'],
  'sintió': ['sentir', 'to feel'], 'sentí': ['sentir', 'to feel'],
  'sienta': ['sentir', 'to feel'], 'sientan': ['sentir', 'to feel'],
  'sentido': ['sentir', 'to feel'], 'sintiendo': ['sentir', 'to feel'],
  // encontrar (to find)
  'encuentro': ['encontrar', 'to find'], 'encuentras': ['encontrar', 'to find'],
  'encuentra': ['encontrar', 'to find'], 'encontramos': ['encontrar', 'to find'],
  'encuentran': ['encontrar', 'to find'],
  'encontraba': ['encontrar', 'to find'], 'encontraban': ['encontrar', 'to find'],
  'encontró': ['encontrar', 'to find'], 'encontré': ['encontrar', 'to find'],
  'encuentre': ['encontrar', 'to find'], 'encuentren': ['encontrar', 'to find'],
  'encontrado': ['encontrar', 'to find'], 'encontrando': ['encontrar', 'to find'],
  // hablar (to speak)
  'hablo': ['hablar', 'to speak'], 'hablas': ['hablar', 'to speak'], 'habla': ['hablar', 'to speak'],
  'hablamos': ['hablar', 'to speak'], 'hablan': ['hablar', 'to speak'],
  'hablaba': ['hablar', 'to speak'], 'hablaban': ['hablar', 'to speak'],
  'habló': ['hablar', 'to speak'], 'hablé': ['hablar', 'to speak'],
  'hable': ['hablar', 'to speak'], 'hablen': ['hablar', 'to speak'],
  'hablado': ['hablar', 'to speak'], 'hablando': ['hablar', 'to speak'],
  // comer (to eat)
  'como': ['comer', 'to eat'], 'comes': ['comer', 'to eat'], 'come': ['comer', 'to eat'],
  'comemos': ['comer', 'to eat'], 'coméis': ['comer', 'to eat'], 'comen': ['comer', 'to eat'],
  'comía': ['comer', 'to eat'], 'comían': ['comer', 'to eat'],
  'comió': ['comer', 'to eat'], 'comí': ['comer', 'to eat'],
  'coma': ['comer', 'to eat'], 'coman': ['comer', 'to eat'],
  'comido': ['comer', 'to eat'], 'comiendo': ['comer', 'to eat'],
  // vivir (to live)
  'vivo': ['vivir', 'to live'], 'vives': ['vivir', 'to live'], 'vive': ['vivir', 'to live'],
  'vivimos': ['vivir', 'to live'], 'viven': ['vivir', 'to live'],
  'vivía': ['vivir', 'to live'], 'vivían': ['vivir', 'to live'],
  'vivió': ['vivir', 'to live'], 'viví': ['vivir', 'to live'],
  'viva': ['vivir', 'to live'], 'vivan': ['vivir', 'to live'],
  'vivido': ['vivir', 'to live'], 'viviendo': ['vivir', 'to live'],
  // trabajar (to work)
  'trabajo': ['trabajar', 'to work'], 'trabajas': ['trabajar', 'to work'],
  'trabaja': ['trabajar', 'to work'], 'trabajamos': ['trabajar', 'to work'],
  'trabajan': ['trabajar', 'to work'],
  'trabajaba': ['trabajar', 'to work'], 'trabajaban': ['trabajar', 'to work'],
  'trabajó': ['trabajar', 'to work'], 'trabajé': ['trabajar', 'to work'],
  'trabaje': ['trabajar', 'to work'], 'trabajen': ['trabajar', 'to work'],
  'trabajado': ['trabajar', 'to work'], 'trabajando': ['trabajar', 'to work'],
  // necesitar (to need)
  'necesito': ['necesitar', 'to need'], 'necesitas': ['necesitar', 'to need'],
  'necesita': ['necesitar', 'to need'], 'necesitamos': ['necesitar', 'to need'],
  'necesitan': ['necesitar', 'to need'],
  'necesitaba': ['necesitar', 'to need'], 'necesitaban': ['necesitar', 'to need'],
  'necesitó': ['necesitar', 'to need'], 'necesité': ['necesitar', 'to need'],
  'necesite': ['necesitar', 'to need'], 'necesiten': ['necesitar', 'to need'],
  'necesitado': ['necesitar', 'to need'], 'necesitando': ['necesitar', 'to need'],
  // gustar (to like/please)
  'gusta': ['gustar', 'to like'], 'gustan': ['gustar', 'to like'],
  'gustaba': ['gustar', 'to like'], 'gustaban': ['gustar', 'to like'],
  'gustó': ['gustar', 'to like'], 'gusté': ['gustar', 'to like'],
  'guste': ['gustar', 'to like'], 'gusten': ['gustar', 'to like'],
  'gustado': ['gustar', 'to like'], 'gustando': ['gustar', 'to like'],
  'gustaría': ['gustar', 'to like'],
  // tomar (to take/drink)
  'tomo': ['tomar', 'to take'], 'tomas': ['tomar', 'to take'], 'toma': ['tomar', 'to take'],
  'tomamos': ['tomar', 'to take'], 'toman': ['tomar', 'to take'],
  'tomaba': ['tomar', 'to take'], 'tomaban': ['tomar', 'to take'],
  'tomó': ['tomar', 'to take'], 'tomé': ['tomar', 'to take'],
  'tome': ['tomar', 'to take'], 'tomen': ['tomar', 'to take'],
  'tomado': ['tomar', 'to take'], 'tomando': ['tomar', 'to take'],
  // pasar (to pass/happen)
  'paso': ['pasar', 'to happen'], 'pasas': ['pasar', 'to happen'], 'pasa': ['pasar', 'to happen'],
  'pasamos': ['pasar', 'to happen'], 'pasan': ['pasar', 'to happen'],
  'pasaba': ['pasar', 'to happen'], 'pasaban': ['pasar', 'to happen'],
  'pasó': ['pasar', 'to happen'], 'pasé': ['pasar', 'to happen'],
  'pase': ['pasar', 'to happen'], 'pasen': ['pasar', 'to happen'],
  'pasado': ['pasar', 'to happen'], 'pasando': ['pasar', 'to happen'],
  // esperar (to wait/hope)
  'espero': ['esperar', 'to hope'], 'esperas': ['esperar', 'to hope'], 'espera': ['esperar', 'to hope'],
  'esperamos': ['esperar', 'to hope'], 'esperan': ['esperar', 'to hope'],
  'esperaba': ['esperar', 'to hope'], 'esperaban': ['esperar', 'to hope'],
  'esperó': ['esperar', 'to hope'], 'esperé': ['esperar', 'to hope'],
  'espere': ['esperar', 'to hope'], 'esperen': ['esperar', 'to hope'],
  'esperado': ['esperar', 'to hope'], 'esperando': ['esperar', 'to hope'],
  // parecer (to seem)
  'parece': ['parecer', 'to seem'], 'parecen': ['parecer', 'to seem'],
  'parecía': ['parecer', 'to seem'], 'parecían': ['parecer', 'to seem'],
  'pareció': ['parecer', 'to seem'], 'parecido': ['parecer', 'to seem'],
  // quedar (to remain/stay)
  'quedo': ['quedar', 'to stay'], 'quedas': ['quedar', 'to stay'], 'queda': ['quedar', 'to stay'],
  'quedamos': ['quedar', 'to stay'], 'quedan': ['quedar', 'to stay'],
  'quedaba': ['quedar', 'to stay'], 'quedaban': ['quedar', 'to stay'],
  'quedó': ['quedar', 'to stay'], 'quedé': ['quedar', 'to stay'],
  'quede': ['quedar', 'to stay'], 'queden': ['quedar', 'to stay'],
  'quedado': ['quedar', 'to stay'], 'quedando': ['quedar', 'to stay'],
  // llegar (to arrive)
  'llego': ['llegar', 'to arrive'], 'llegas': ['llegar', 'to arrive'], 'llega': ['llegar', 'to arrive'],
  'llegamos': ['llegar', 'to arrive'], 'llegan': ['llegar', 'to arrive'],
  'llegaba': ['llegar', 'to arrive'], 'llegaban': ['llegar', 'to arrive'],
  'llegó': ['llegar', 'to arrive'], 'llegué': ['llegar', 'to arrive'],
  'llegue': ['llegar', 'to arrive'], 'lleguen': ['llegar', 'to arrive'],
  'llegado': ['llegar', 'to arrive'], 'llegando': ['llegar', 'to arrive'],
  // seguir (to follow/continue)
  'sigo': ['seguir', 'to follow'], 'sigues': ['seguir', 'to follow'], 'sigue': ['seguir', 'to follow'],
  'seguimos': ['seguir', 'to follow'], 'siguen': ['seguir', 'to follow'],
  'seguía': ['seguir', 'to follow'], 'seguían': ['seguir', 'to follow'],
  'siguió': ['seguir', 'to follow'], 'seguí': ['seguir', 'to follow'],
  'siga': ['seguir', 'to follow'], 'sigan': ['seguir', 'to follow'],
  'seguido': ['seguir', 'to follow'], 'siguiendo': ['seguir', 'to follow'],
  // deber (must/should)
  'debo': ['deber', 'to must'], 'debes': ['deber', 'to must'], 'debe': ['deber', 'to must'],
  'debemos': ['deber', 'to must'], 'deben': ['deber', 'to must'],
  'debía': ['deber', 'to must'], 'debían': ['deber', 'to must'],
  'debió': ['deber', 'to must'], 'debí': ['deber', 'to must'],
  'deba': ['deber', 'to must'], 'deban': ['deber', 'to must'],
  'debido': ['deber', 'to must'], 'debiendo': ['deber', 'to must'],
  'debería': ['deber', 'to must'], 'deberían': ['deber', 'to must'],
  'deberíamos': ['deber', 'to must'],
  // pedir (to ask for)
  'pido': ['pedir', 'to ask for'], 'pides': ['pedir', 'to ask for'], 'pide': ['pedir', 'to ask for'],
  'pedimos': ['pedir', 'to ask for'], 'piden': ['pedir', 'to ask for'],
  'pedía': ['pedir', 'to ask for'], 'pedían': ['pedir', 'to ask for'],
  'pidió': ['pedir', 'to ask for'], 'pedí': ['pedir', 'to ask for'],
  'pida': ['pedir', 'to ask for'], 'pidan': ['pedir', 'to ask for'],
  'pedido': ['pedir', 'to ask for'], 'pidiendo': ['pedir', 'to ask for'],
  // empezar (to begin)
  'empiezo': ['empezar', 'to begin'], 'empiezas': ['empezar', 'to begin'],
  'empieza': ['empezar', 'to begin'], 'empezamos': ['empezar', 'to begin'],
  'empiezan': ['empezar', 'to begin'],
  'empezaba': ['empezar', 'to begin'], 'empezaban': ['empezar', 'to begin'],
  'empezó': ['empezar', 'to begin'], 'empecé': ['empezar', 'to begin'],
  'empiece': ['empezar', 'to begin'], 'empiecen': ['empezar', 'to begin'],
  'empezado': ['empezar', 'to begin'], 'empezando': ['empezar', 'to begin'],
  // terminar (to finish)
  'termino': ['terminar', 'to finish'], 'terminas': ['terminar', 'to finish'],
  'termina': ['terminar', 'to finish'], 'terminamos': ['terminar', 'to finish'],
  'terminan': ['terminar', 'to finish'],
  'terminaba': ['terminar', 'to finish'], 'terminaban': ['terminar', 'to finish'],
  'terminó': ['terminar', 'to finish'], 'terminé': ['terminar', 'to finish'],
  'termine': ['terminar', 'to finish'], 'terminen': ['terminar', 'to finish'],
  'terminado': ['terminar', 'to finish'], 'terminando': ['terminar', 'to finish'],
  // leer (to read)
  'leo': ['leer', 'to read'], 'lees': ['leer', 'to read'], 'lee': ['leer', 'to read'],
  'leemos': ['leer', 'to read'], 'leen': ['leer', 'to read'],
  'leía': ['leer', 'to read'], 'leían': ['leer', 'to read'],
  'leyó': ['leer', 'to read'], 'leí': ['leer', 'to read'],
  'lea': ['leer', 'to read'], 'lean': ['leer', 'to read'],
  'leído': ['leer', 'to read'], 'leyendo': ['leer', 'to read'],
  // escribir (to write)
  'escribo': ['escribir', 'to write'], 'escribes': ['escribir', 'to write'],
  'escribe': ['escribir', 'to write'], 'escribimos': ['escribir', 'to write'],
  'escriben': ['escribir', 'to write'],
  'escribía': ['escribir', 'to write'], 'escribían': ['escribir', 'to write'],
  'escribió': ['escribir', 'to write'], 'escribí': ['escribir', 'to write'],
  'escriba': ['escribir', 'to write'], 'escriban': ['escribir', 'to write'],
  'escrito': ['escribir', 'to write'], 'escribiendo': ['escribir', 'to write'],
  // dormir (to sleep)
  'duermo': ['dormir', 'to sleep'], 'duermes': ['dormir', 'to sleep'],
  'duerme': ['dormir', 'to sleep'], 'dormimos': ['dormir', 'to sleep'],
  'duermen': ['dormir', 'to sleep'],
  'dormía': ['dormir', 'to sleep'], 'dormían': ['dormir', 'to sleep'],
  'durmió': ['dormir', 'to sleep'], 'dormí': ['dormir', 'to sleep'],
  'duerma': ['dormir', 'to sleep'], 'duerman': ['dormir', 'to sleep'],
  'dormido': ['dormir', 'to sleep'], 'durmiendo': ['dormir', 'to sleep'],
  // entender (to understand)
  'entiendo': ['entender', 'to understand'], 'entiendes': ['entender', 'to understand'],
  'entiende': ['entender', 'to understand'], 'entendemos': ['entender', 'to understand'],
  'entienden': ['entender', 'to understand'],
  'entendía': ['entender', 'to understand'], 'entendían': ['entender', 'to understand'],
  'entendió': ['entender', 'to understand'], 'entendí': ['entender', 'to understand'],
  'entienda': ['entender', 'to understand'], 'entiendan': ['entender', 'to understand'],
  'entendido': ['entender', 'to understand'], 'entendiendo': ['entender', 'to understand'],
  // comprar (to buy)
  'compro': ['comprar', 'to buy'], 'compras': ['comprar', 'to buy'],
  'compra': ['comprar', 'to buy'], 'compramos': ['comprar', 'to buy'],
  'compran': ['comprar', 'to buy'],
  'compraba': ['comprar', 'to buy'], 'compraban': ['comprar', 'to buy'],
  'compró': ['comprar', 'to buy'], 'compré': ['comprar', 'to buy'],
  'compre': ['comprar', 'to buy'], 'compren': ['comprar', 'to buy'],
  'comprado': ['comprar', 'to buy'], 'comprando': ['comprar', 'to buy'],
  // jugar (to play)
  'juego': ['jugar', 'to play'], 'juegas': ['jugar', 'to play'],
  'juega': ['jugar', 'to play'], 'jugamos': ['jugar', 'to play'],
  'juegan': ['jugar', 'to play'],
  'jugaba': ['jugar', 'to play'], 'jugaban': ['jugar', 'to play'],
  'jugó': ['jugar', 'to play'], 'jugué': ['jugar', 'to play'],
  'juegue': ['jugar', 'to play'], 'jueguen': ['jugar', 'to play'],
  'jugado': ['jugar', 'to play'], 'jugando': ['jugar', 'to play'],
  // aprender (to learn)
  'aprendo': ['aprender', 'to learn'], 'aprendes': ['aprender', 'to learn'],
  'aprende': ['aprender', 'to learn'], 'aprendemos': ['aprender', 'to learn'],
  'aprenden': ['aprender', 'to learn'],
  'aprendía': ['aprender', 'to learn'], 'aprendían': ['aprender', 'to learn'],
  'aprendió': ['aprender', 'to learn'], 'aprendí': ['aprender', 'to learn'],
  'aprenda': ['aprender', 'to learn'], 'aprendan': ['aprender', 'to learn'],
  'aprendido': ['aprender', 'to learn'], 'aprendiendo': ['aprender', 'to learn'],
  // preguntar (to ask)
  'pregunto': ['preguntar', 'to ask'], 'preguntas': ['preguntar', 'to ask'],
  'pregunta': ['preguntar', 'to ask'], 'preguntamos': ['preguntar', 'to ask'],
  'preguntan': ['preguntar', 'to ask'],
  'preguntó': ['preguntar', 'to ask'], 'pregunté': ['preguntar', 'to ask'],
  'pregunte': ['preguntar', 'to ask'], 'pregunten': ['preguntar', 'to ask'],
  'preguntado': ['preguntar', 'to ask'], 'preguntando': ['preguntar', 'to ask'],
  // mirar (to look)
  'miro': ['mirar', 'to look'], 'miras': ['mirar', 'to look'],
  'mira': ['mirar', 'to look'], 'miramos': ['mirar', 'to look'],
  'miran': ['mirar', 'to look'],
  'miraba': ['mirar', 'to look'], 'miraban': ['mirar', 'to look'],
  'miró': ['mirar', 'to look'], 'miré': ['mirar', 'to look'],
  'mire': ['mirar', 'to look'], 'miren': ['mirar', 'to look'],
  'mirado': ['mirar', 'to look'], 'mirando': ['mirar', 'to look'],
  // abrir (to open)
  'abro': ['abrir', 'to open'], 'abres': ['abrir', 'to open'],
  'abre': ['abrir', 'to open'], 'abrimos': ['abrir', 'to open'],
  'abren': ['abrir', 'to open'],
  'abrió': ['abrir', 'to open'], 'abrí': ['abrir', 'to open'],
  'abra': ['abrir', 'to open'], 'abran': ['abrir', 'to open'],
  'abierto': ['abrir', 'to open'], 'abriendo': ['abrir', 'to open'],
  // cerrar (to close)
  'cierro': ['cerrar', 'to close'], 'cierras': ['cerrar', 'to close'],
  'cierra': ['cerrar', 'to close'], 'cerramos': ['cerrar', 'to close'],
  'cierran': ['cerrar', 'to close'],
  'cerró': ['cerrar', 'to close'], 'cerré': ['cerrar', 'to close'],
  'cierre': ['cerrar', 'to close'], 'cierren': ['cerrar', 'to close'],
  'cerrado': ['cerrar', 'to close'], 'cerrando': ['cerrar', 'to close'],
  // ayudar (to help)
  'ayudo': ['ayudar', 'to help'], 'ayudas': ['ayudar', 'to help'],
  'ayuda': ['ayudar', 'to help'], 'ayudamos': ['ayudar', 'to help'],
  'ayudan': ['ayudar', 'to help'],
  'ayudó': ['ayudar', 'to help'], 'ayudé': ['ayudar', 'to help'],
  'ayude': ['ayudar', 'to help'], 'ayuden': ['ayudar', 'to help'],
  'ayudado': ['ayudar', 'to help'], 'ayudando': ['ayudar', 'to help'],
  // cambiar (to change)
  'cambio': ['cambiar', 'to change'], 'cambias': ['cambiar', 'to change'],
  'cambia': ['cambiar', 'to change'], 'cambiamos': ['cambiar', 'to change'],
  'cambian': ['cambiar', 'to change'],
  'cambió': ['cambiar', 'to change'], 'cambié': ['cambiar', 'to change'],
  'cambie': ['cambiar', 'to change'], 'cambien': ['cambiar', 'to change'],
  'cambiado': ['cambiar', 'to change'], 'cambiando': ['cambiar', 'to change'],
  // perder (to lose)
  'pierdo': ['perder', 'to lose'], 'pierdes': ['perder', 'to lose'],
  'pierde': ['perder', 'to lose'], 'perdemos': ['perder', 'to lose'],
  'pierden': ['perder', 'to lose'],
  'perdía': ['perder', 'to lose'], 'perdían': ['perder', 'to lose'],
  'perdió': ['perder', 'to lose'], 'perdí': ['perder', 'to lose'],
  'pierda': ['perder', 'to lose'], 'pierdan': ['perder', 'to lose'],
  'perdido': ['perder', 'to lose'], 'perdiendo': ['perder', 'to lose'],
  // ganar (to win/earn)
  'gano': ['ganar', 'to win'], 'ganas': ['ganar', 'to win'],
  'gana': ['ganar', 'to win'], 'ganamos': ['ganar', 'to win'],
  'ganan': ['ganar', 'to win'],
  'ganó': ['ganar', 'to win'], 'gané': ['ganar', 'to win'],
  'gane': ['ganar', 'to win'], 'ganen': ['ganar', 'to win'],
  'ganado': ['ganar', 'to win'], 'ganando': ['ganar', 'to win'],
  // mantener (to maintain)
  'mantengo': ['mantener', 'to maintain'], 'mantienes': ['mantener', 'to maintain'],
  'mantiene': ['mantener', 'to maintain'], 'mantenemos': ['mantener', 'to maintain'],
  'mantienen': ['mantener', 'to maintain'],
  'mantenía': ['mantener', 'to maintain'], 'mantenían': ['mantener', 'to maintain'],
  'mantuvo': ['mantener', 'to maintain'], 'mantuve': ['mantener', 'to maintain'],
  'mantenga': ['mantener', 'to maintain'], 'mantengan': ['mantener', 'to maintain'],
  'mantenido': ['mantener', 'to maintain'], 'manteniendo': ['mantener', 'to maintain'],
  'mantendrá': ['mantener', 'to maintain'], 'mantendría': ['mantener', 'to maintain'],
  // volver (to return)
  'vuelvo': ['volver', 'to return'], 'vuelves': ['volver', 'to return'],
  'vuelve': ['volver', 'to return'], 'volvemos': ['volver', 'to return'],
  'vuelven': ['volver', 'to return'],
  'volvía': ['volver', 'to return'], 'volvían': ['volver', 'to return'],
  'volvió': ['volver', 'to return'], 'volví': ['volver', 'to return'],
  'vuelva': ['volver', 'to return'], 'vuelvan': ['volver', 'to return'],
  'vuelto': ['volver', 'to return'], 'volviendo': ['volver', 'to return'],
  // morir (to die)
  'muero': ['morir', 'to die'], 'mueres': ['morir', 'to die'],
  'muere': ['morir', 'to die'], 'morimos': ['morir', 'to die'],
  'mueren': ['morir', 'to die'],
  'murió': ['morir', 'to die'], 'morí': ['morir', 'to die'],
  'muera': ['morir', 'to die'], 'mueran': ['morir', 'to die'],
  'muerto': ['morir', 'to die'], 'muriendo': ['morir', 'to die'],
  // correr (to run)
  'corro': ['correr', 'to run'], 'corres': ['correr', 'to run'],
  'corre': ['correr', 'to run'], 'corremos': ['correr', 'to run'],
  'corren': ['correr', 'to run'],
  'corrió': ['correr', 'to run'], 'corrí': ['correr', 'to run'],
  'corra': ['correr', 'to run'], 'corran': ['correr', 'to run'],
  'corrido': ['correr', 'to run'], 'corriendo': ['correr', 'to run'],
  // subir (to go up)
  'subo': ['subir', 'to go up'], 'subes': ['subir', 'to go up'],
  'sube': ['subir', 'to go up'], 'subimos': ['subir', 'to go up'],
  'suben': ['subir', 'to go up'],
  'subió': ['subir', 'to go up'], 'subí': ['subir', 'to go up'],
  'suba': ['subir', 'to go up'], 'suban': ['subir', 'to go up'],
  'subido': ['subir', 'to go up'], 'subiendo': ['subir', 'to go up'],
  // bajar (to go down)
  'bajo': ['bajar', 'to go down'], 'bajas': ['bajar', 'to go down'],
  'baja': ['bajar', 'to go down'], 'bajamos': ['bajar', 'to go down'],
  'bajan': ['bajar', 'to go down'],
  'bajó': ['bajar', 'to go down'], 'bajé': ['bajar', 'to go down'],
  'bajado': ['bajar', 'to go down'], 'bajando': ['bajar', 'to go down'],
  // recordar (to remember)
  'recuerdo': ['recordar', 'to remember'], 'recuerdas': ['recordar', 'to remember'],
  'recuerda': ['recordar', 'to remember'], 'recordamos': ['recordar', 'to remember'],
  'recuerdan': ['recordar', 'to remember'],
  'recordaba': ['recordar', 'to remember'], 'recordaban': ['recordar', 'to remember'],
  'recordó': ['recordar', 'to remember'], 'recordé': ['recordar', 'to remember'],
  'recuerde': ['recordar', 'to remember'], 'recuerden': ['recordar', 'to remember'],
  'recordado': ['recordar', 'to remember'], 'recordando': ['recordar', 'to remember'],
  // olvidar (to forget)
  'olvido': ['olvidar', 'to forget'], 'olvidas': ['olvidar', 'to forget'],
  'olvida': ['olvidar', 'to forget'], 'olvidamos': ['olvidar', 'to forget'],
  'olvidan': ['olvidar', 'to forget'],
  'olvidó': ['olvidar', 'to forget'], 'olvidé': ['olvidar', 'to forget'],
  'olvide': ['olvidar', 'to forget'], 'olviden': ['olvidar', 'to forget'],
  'olvidado': ['olvidar', 'to forget'], 'olvidando': ['olvidar', 'to forget'],
  // elegir (to choose)
  'elijo': ['elegir', 'to choose'], 'eliges': ['elegir', 'to choose'],
  'elige': ['elegir', 'to choose'], 'elegimos': ['elegir', 'to choose'],
  'eligen': ['elegir', 'to choose'],
  'eligió': ['elegir', 'to choose'], 'elegí': ['elegir', 'to choose'],
  'elija': ['elegir', 'to choose'], 'elijan': ['elegir', 'to choose'],
  'elegido': ['elegir', 'to choose'], 'eligiendo': ['elegir', 'to choose'],
  // preferir (to prefer)
  'prefiero': ['preferir', 'to prefer'], 'prefieres': ['preferir', 'to prefer'],
  'prefiere': ['preferir', 'to prefer'], 'preferimos': ['preferir', 'to prefer'],
  'prefieren': ['preferir', 'to prefer'],
  'prefirió': ['preferir', 'to prefer'], 'preferí': ['preferir', 'to prefer'],
  'prefiera': ['preferir', 'to prefer'], 'prefieran': ['preferir', 'to prefer'],
  'preferido': ['preferir', 'to prefer'], 'prefiriendo': ['preferir', 'to prefer'],
  // oír (to hear)
  'oigo': ['oír', 'to hear'], 'oyes': ['oír', 'to hear'],
  'oye': ['oír', 'to hear'], 'oímos': ['oír', 'to hear'],
  'oyen': ['oír', 'to hear'],
  'oyó': ['oír', 'to hear'], 'oí': ['oír', 'to hear'],
  'oiga': ['oír', 'to hear'], 'oigan': ['oír', 'to hear'],
  'oído': ['oír', 'to hear'], 'oyendo': ['oír', 'to hear'],
  // traer (to bring)
  'traigo': ['traer', 'to bring'], 'traes': ['traer', 'to bring'],
  'trae': ['traer', 'to bring'], 'traemos': ['traer', 'to bring'],
  'traen': ['traer', 'to bring'],
  'trajo': ['traer', 'to bring'], 'traje': ['traer', 'to bring'],
  'trajimos': ['traer', 'to bring'], 'trajeron': ['traer', 'to bring'],
  'traiga': ['traer', 'to bring'], 'traigan': ['traer', 'to bring'],
  'traído': ['traer', 'to bring'], 'trayendo': ['traer', 'to bring'],
  // caer (to fall)
  'caigo': ['caer', 'to fall'], 'caes': ['caer', 'to fall'],
  'cae': ['caer', 'to fall'], 'caemos': ['caer', 'to fall'],
  'caen': ['caer', 'to fall'],
  'cayó': ['caer', 'to fall'], 'caí': ['caer', 'to fall'],
  'caiga': ['caer', 'to fall'], 'caigan': ['caer', 'to fall'],
  'caído': ['caer', 'to fall'], 'cayendo': ['caer', 'to fall'],
  // conducir (to drive)
  'conduzco': ['conducir', 'to drive'], 'conduces': ['conducir', 'to drive'],
  'conduce': ['conducir', 'to drive'], 'conducimos': ['conducir', 'to drive'],
  'conducen': ['conducir', 'to drive'],
  'condujo': ['conducir', 'to drive'], 'conduje': ['conducir', 'to drive'],
  'conduzca': ['conducir', 'to drive'], 'conduzcan': ['conducir', 'to drive'],
  'conducido': ['conducir', 'to drive'], 'conduciendo': ['conducir', 'to drive'],
};

// Extended noun/adjective dictionary (common Spanish words)
const WORD_DICT = {
  // Common nouns
  'hola': 'hello', 'adiós': 'goodbye', 'gracias': 'thank you',
  'por favor': 'please', 'buenos': 'good', 'buenas': 'good',
  'días': 'days/morning', 'tardes': 'afternoon', 'noches': 'night',
  'señor': 'sir/mr', 'señora': 'madam/mrs', 'señorita': 'miss',
  'amigo': 'friend', 'amiga': 'friend', 'amigos': 'friends', 'amigas': 'friends',
  'hombre': 'man', 'mujer': 'woman', 'niño': 'boy', 'niña': 'girl',
  'niños': 'children', 'niñas': 'girls', 'hijo': 'son', 'hija': 'daughter',
  'hijos': 'children', 'padre': 'father', 'madre': 'mother',
  'padres': 'parents', 'hermano': 'brother', 'hermana': 'sister',
  'hermanos': 'siblings', 'abuelo': 'grandfather', 'abuela': 'grandmother',
  'abuelos': 'grandparents', 'tío': 'uncle', 'tía': 'aunt',
  'primo': 'cousin', 'prima': 'cousin', 'primos': 'cousins',
  'esposo': 'husband', 'esposa': 'wife', 'marido': 'husband',
  'familia': 'family', 'familias': 'families',
  'persona': 'person', 'personas': 'people', 'gente': 'people',
  'nombre': 'name', 'nombres': 'names',
  'casa': 'house', 'casas': 'houses', 'hogar': 'home',
  'ciudad': 'city', 'ciudades': 'cities', 'pueblo': 'town',
  'país': 'country', 'países': 'countries', 'mundo': 'world',
  'lugar': 'place', 'lugares': 'places', 'sitio': 'place/site',
  'calle': 'street', 'calles': 'streets', 'camino': 'road/path',
  'plaza': 'square', 'parque': 'park', 'jardín': 'garden',
  'escuela': 'school', 'universidad': 'university', 'colegio': 'school',
  'clase': 'class', 'clases': 'classes', 'curso': 'course',
  'libro': 'book', 'libros': 'books', 'página': 'page',
  'trabajo': 'work/job', 'oficina': 'office', 'empresa': 'company',
  'tienda': 'store', 'mercado': 'market', 'supermercado': 'supermarket',
  'restaurante': 'restaurant', 'hotel': 'hotel', 'hospital': 'hospital',
  'banco': 'bank', 'iglesia': 'church', 'museo': 'museum',
  'teatro': 'theater', 'cine': 'cinema', 'biblioteca': 'library',
  'estación': 'station', 'aeropuerto': 'airport', 'puerto': 'port',
  'agua': 'water', 'comida': 'food', 'bebida': 'drink',
  'pan': 'bread', 'leche': 'milk', 'café': 'coffee',
  'cerveza': 'beer', 'vino': 'wine', 'jugo': 'juice', 'zumo': 'juice',
  'carne': 'meat', 'pollo': 'chicken', 'pescado': 'fish',
  'arroz': 'rice', 'fruta': 'fruit', 'frutas': 'fruits',
  'verdura': 'vegetable', 'verduras': 'vegetables',
  'ensalada': 'salad', 'sopa': 'soup', 'postre': 'dessert',
  'desayuno': 'breakfast', 'almuerzo': 'lunch', 'cena': 'dinner',
  'mesa': 'table', 'silla': 'chair', 'cama': 'bed',
  'puerta': 'door', 'ventana': 'window', 'pared': 'wall',
  'piso': 'floor', 'techo': 'ceiling/roof', 'habitación': 'room',
  'cocina': 'kitchen', 'baño': 'bathroom', 'sala': 'living room',
  'cuarto': 'room', 'dormitorio': 'bedroom',
  'coche': 'car', 'carro': 'car', 'auto': 'car',
  'autobús': 'bus', 'tren': 'train', 'avión': 'airplane',
  'bicicleta': 'bicycle', 'barco': 'boat', 'metro': 'subway',
  'taxi': 'taxi', 'viaje': 'trip', 'viajes': 'trips',
  'vacaciones': 'vacation', 'vuelo': 'flight',
  'tiempo': 'time/weather', 'hora': 'hour/time', 'horas': 'hours',
  'minuto': 'minute', 'minutos': 'minutes', 'segundo': 'second',
  'día': 'day', 'semana': 'week', 'mes': 'month',
  'año': 'year', 'años': 'years', 'meses': 'months',
  'semanas': 'weeks',
  'lunes': 'Monday', 'martes': 'Tuesday', 'miércoles': 'Wednesday',
  'jueves': 'Thursday', 'viernes': 'Friday', 'sábado': 'Saturday',
  'domingo': 'Sunday',
  'enero': 'January', 'febrero': 'February', 'marzo': 'March',
  'abril': 'April', 'mayo': 'May', 'junio': 'June',
  'julio': 'July', 'agosto': 'August', 'septiembre': 'September',
  'octubre': 'October', 'noviembre': 'November', 'diciembre': 'December',
  'mañana2': 'morning', 'noche': 'night', 'tarde2': 'afternoon',
  'sol': 'sun', 'luna': 'moon', 'estrella': 'star', 'estrellas': 'stars',
  'cielo': 'sky', 'tierra': 'earth/ground', 'mar': 'sea',
  'río': 'river', 'montaña': 'mountain', 'montañas': 'mountains',
  'playa': 'beach', 'bosque': 'forest', 'campo': 'field/countryside',
  'isla': 'island', 'lago': 'lake', 'árbol': 'tree', 'árboles': 'trees',
  'flor': 'flower', 'flores': 'flowers', 'planta': 'plant',
  'animal': 'animal', 'animales': 'animals', 'perro': 'dog',
  'gato': 'cat', 'pájaro': 'bird', 'pez': 'fish',
  'caballo': 'horse', 'vaca': 'cow',
  'dinero': 'money', 'precio': 'price', 'precios': 'prices',
  'euro': 'euro', 'euros': 'euros', 'dólar': 'dollar',
  'problema': 'problem', 'problemas': 'problems',
  'idea': 'idea', 'ideas': 'ideas',
  'cosa': 'thing', 'cosas': 'things',
  'parte': 'part', 'partes': 'parts',
  'forma': 'form/way', 'manera': 'way/manner',
  'modo': 'way/mode', 'tipo': 'type/kind',
  'vez': 'time/occasion', 'veces': 'times',
  'ejemplo': 'example', 'ejemplos': 'examples',
  'razón': 'reason', 'razones': 'reasons',
  'respuesta': 'answer', 'respuestas': 'answers',
  'pregunta2': 'question', 'preguntas2': 'questions',
  'verdad': 'truth', 'mentira': 'lie',
  'historia': 'history/story', 'historias': 'stories',
  'música': 'music', 'canción': 'song', 'canciones': 'songs',
  'película': 'movie', 'películas': 'movies',
  'programa': 'program', 'programas': 'programs',
  'juego': 'game', 'juegos': 'games',
  'deporte': 'sport', 'deportes': 'sports',
  'fútbol': 'soccer', 'equipo': 'team',
  'salud': 'health', 'médico': 'doctor',
  'enfermedad': 'illness', 'dolor': 'pain',
  'cuerpo': 'body', 'cabeza': 'head', 'mano': 'hand',
  'manos': 'hands', 'ojo': 'eye', 'ojos': 'eyes',
  'boca': 'mouth', 'nariz': 'nose', 'oreja': 'ear',
  'brazo': 'arm', 'pierna': 'leg', 'pie': 'foot',
  'pies': 'feet', 'dedo': 'finger', 'dedos': 'fingers',
  'corazón': 'heart', 'sangre': 'blood',
  'ropa': 'clothes', 'camisa': 'shirt', 'pantalón': 'pants',
  'pantalones': 'pants', 'zapato': 'shoe', 'zapatos': 'shoes',
  'vestido': 'dress', 'falda': 'skirt', 'chaqueta': 'jacket',
  'sombrero': 'hat', 'gafas': 'glasses',
  'teléfono': 'phone', 'ordenador': 'computer', 'computadora': 'computer',
  'internet': 'internet', 'correo': 'mail/email',
  'carta': 'letter', 'cartas': 'letters', 'mensaje': 'message',
  'mensajes': 'messages', 'foto': 'photo', 'fotos': 'photos',
  'número': 'number', 'números': 'numbers',
  'color': 'color', 'colores': 'colors',
  'rojo': 'red', 'azul': 'blue', 'verde': 'green',
  'amarillo': 'yellow', 'blanco': 'white', 'negro': 'black',
  'gris': 'gray', 'rosa': 'pink', 'naranja': 'orange',
  'marrón': 'brown', 'morado': 'purple',
  // Common adjectives
  'grande': 'big', 'grandes': 'big', 'pequeño': 'small', 'pequeña': 'small',
  'pequeños': 'small', 'pequeñas': 'small',
  'bueno': 'good', 'buena': 'good', 'malo': 'bad', 'mala': 'bad',
  'mejor': 'better/best', 'mejores': 'better/best',
  'peor': 'worse/worst', 'peores': 'worse/worst',
  'nuevo': 'new', 'nueva': 'new', 'nuevos': 'new', 'nuevas': 'new',
  'viejo': 'old', 'vieja': 'old', 'viejos': 'old', 'viejas': 'old',
  'joven': 'young', 'jóvenes': 'young',
  'largo': 'long', 'larga': 'long', 'corto': 'short', 'corta': 'short',
  'alto': 'tall/high', 'alta': 'tall/high',
  'bajo2': 'short/low', 'baja2': 'short/low',
  'bonito': 'pretty', 'bonita': 'pretty', 'hermoso': 'beautiful', 'hermosa': 'beautiful',
  'feo': 'ugly', 'fea': 'ugly',
  'rico': 'rich', 'rica': 'rich', 'pobre': 'poor',
  'feliz': 'happy', 'felices': 'happy', 'triste': 'sad', 'tristes': 'sad',
  'contento': 'happy', 'contenta': 'happy',
  'enfermo': 'sick', 'enferma': 'sick',
  'cansado': 'tired', 'cansada': 'tired',
  'ocupado': 'busy', 'ocupada': 'busy',
  'libre': 'free', 'libres': 'free',
  'solo2': 'alone', 'sola': 'alone',
  'lleno': 'full', 'llena': 'full', 'vacío': 'empty', 'vacía': 'empty',
  'caliente': 'hot', 'frío': 'cold', 'fría': 'cold',
  'seco': 'dry', 'seca': 'dry', 'mojado': 'wet', 'mojada': 'wet',
  'limpio': 'clean', 'limpia': 'clean', 'sucio': 'dirty', 'sucia': 'dirty',
  'fácil': 'easy', 'difícil': 'difficult',
  'rápido2': 'fast', 'rápida': 'fast', 'lento': 'slow', 'lenta': 'slow',
  'fuerte': 'strong', 'fuertes': 'strong', 'débil': 'weak',
  'claro': 'clear', 'clara': 'clear', 'oscuro': 'dark', 'oscura': 'dark',
  'importante': 'important', 'importantes': 'important',
  'necesario': 'necessary', 'necesaria': 'necessary',
  'posible': 'possible', 'imposible': 'impossible',
  'seguro': 'safe/sure', 'segura': 'safe/sure',
  'diferente': 'different', 'diferentes': 'different',
  'igual': 'equal/same', 'iguales': 'equal/same',
  'último': 'last', 'última': 'last', 'últimos': 'last', 'últimas': 'last',
  'primero': 'first', 'primera': 'first', 'primeros': 'first', 'primeras': 'first',
  'próximo': 'next', 'próxima': 'next', 'próximos': 'next',
  'siguiente': 'next/following', 'siguientes': 'following',
  'anterior': 'previous', 'anteriores': 'previous',
  'propio': 'own', 'propia': 'own', 'propios': 'own', 'propias': 'own',
  'cierto': 'certain', 'cierta': 'certain',
  'real': 'real', 'reales': 'real',
  'especial': 'special', 'especiales': 'special',
  'general': 'general', 'generales': 'general',
  'público': 'public', 'pública': 'public',
  'privado': 'private', 'privada': 'private',
  'social': 'social', 'sociales': 'social',
  'político': 'political', 'política': 'political',
  'económico': 'economic', 'económica': 'economic',
  'natural': 'natural', 'naturales': 'natural',
  'internacional': 'international',
  'nacional': 'national', 'nacionales': 'national',
  'humano': 'human', 'humana': 'human',
  // Numbers
  'uno': 'one', 'dos': 'two', 'tres': 'three', 'cuatro': 'four',
  'cinco': 'five', 'seis': 'six', 'siete': 'seven', 'ocho': 'eight',
  'nueve': 'nine', 'diez': 'ten', 'once': 'eleven', 'doce': 'twelve',
  'trece': 'thirteen', 'catorce': 'fourteen', 'quince': 'fifteen',
  'veinte': 'twenty', 'treinta': 'thirty', 'cuarenta': 'forty',
  'cincuenta': 'fifty', 'cien': 'hundred', 'ciento': 'hundred',
  'mil': 'thousand', 'millón': 'million',
  'primer': 'first', 'segundo2': 'second', 'tercero': 'third', 'tercer': 'third',
  // Other very common words
  'gusto': 'pleasure', 'encantada': 'pleased', 'encantado': 'pleased',
  'favor': 'favor', 'perdón': 'pardon', 'disculpe': 'excuse me',
  'bienvenido': 'welcome', 'bienvenida': 'welcome', 'bienvenidos': 'welcome',
  'felicidades': 'congratulations', 'felicitaciones': 'congratulations',
  'cumpleaños': 'birthday', 'fiesta': 'party', 'regalo': 'gift',
  'vida': 'life', 'muerte': 'death', 'amor': 'love',
  'paz': 'peace', 'guerra': 'war', 'libertad': 'freedom',
  'derecho': 'right/law', 'derechos': 'rights',
  'ley': 'law', 'leyes': 'laws',
  'gobierno': 'government', 'estado': 'state',
  'poder2': 'power', 'fuerza': 'force/strength',
  'grupo': 'group', 'grupos': 'groups',
  'punto': 'point', 'puntos': 'points',
  'momento': 'moment', 'momentos': 'moments',
  'final': 'end/final', 'principio': 'beginning',
  'medio': 'middle/half', 'media': 'half/media',
  'centro': 'center', 'norte': 'north', 'sur': 'south',
  'este2': 'east', 'oeste': 'west',
  'lado': 'side', 'lados': 'sides',
  // Country/location names
  'españa': 'Spain', 'méxico': 'Mexico', 'argentina': 'Argentina',
  'colombia': 'Colombia', 'perú': 'Peru', 'chile': 'Chile',
  'cuba': 'Cuba', 'venezuela': 'Venezuela',
  'europa': 'Europe', 'américa': 'America', 'asia': 'Asia', 'áfrica': 'Africa',
  // Proper names left as-is
  'maría': 'María', 'juan': 'Juan', 'carlos': 'Carlos', 'pedro': 'Pedro',
  'ana': 'Ana', 'rosa2': 'Rosa', 'luis': 'Luis', 'josé': 'José',
  'miguel': 'Miguel', 'antonio': 'Antonio', 'francisco': 'Francisco',
  'manuel': 'Manuel', 'david': 'David', 'daniel': 'Daniel',
  'pablo': 'Pablo', 'elena': 'Elena', 'laura': 'Laura',
  'carmen': 'Carmen', 'lucía': 'Lucía', 'marta': 'Marta',
  'sofía': 'Sofía', 'isabel': 'Isabel',
  // Weather
  'lluvia': 'rain', 'nieve': 'snow', 'viento': 'wind',
  'tormenta': 'storm', 'nube': 'cloud', 'nubes': 'clouds',
  'temperatura': 'temperature', 'calor': 'heat',
  // Education
  'estudiante': 'student', 'estudiantes': 'students',
  'profesor': 'teacher', 'profesora': 'teacher',
  'maestro': 'teacher', 'maestra': 'teacher',
  'alumno': 'student', 'alumna': 'student',
  'examen': 'exam', 'exámenes': 'exams',
  'nota': 'grade/note', 'notas': 'grades/notes',
  // Work
  'jefe': 'boss', 'jefa': 'boss',
  'empleado': 'employee', 'empleada': 'employee',
  'proyecto': 'project', 'proyectos': 'projects',
  'reunión': 'meeting', 'reuniones': 'meetings',
  'negocio': 'business', 'negocios': 'business',
  'cliente': 'client', 'clientes': 'clients',
  'producto': 'product', 'productos': 'products',
  'servicio': 'service', 'servicios': 'services',
  // Technology
  'sistema': 'system', 'sistemas': 'systems',
  'tecnología': 'technology', 'información': 'information',
  'dato': 'data', 'datos': 'data',
  'red': 'network', 'redes': 'networks',
  'aplicación': 'application', 'aplicaciones': 'applications',
  'pantalla': 'screen', 'pantallas': 'screens',
  // More verbs as nouns/infinitives
  'ser': 'to be', 'estar': 'to be', 'haber': 'to have',
  'tener': 'to have', 'hacer': 'to do/make', 'poder': 'to be able',
  'decir': 'to say', 'ir': 'to go', 'ver': 'to see',
  'dar': 'to give', 'saber': 'to know', 'querer': 'to want',
  'llegar': 'to arrive', 'pasar': 'to happen', 'deber': 'to must',
  'poner': 'to put', 'parecer': 'to seem', 'quedar': 'to stay',
  'creer': 'to believe', 'hablar': 'to speak', 'llevar': 'to carry',
  'dejar': 'to leave', 'seguir': 'to follow', 'encontrar': 'to find',
  'llamar': 'to call', 'venir': 'to come', 'pensar': 'to think',
  'salir': 'to leave', 'volver': 'to return', 'tomar': 'to take',
  'conocer': 'to know', 'vivir': 'to live', 'sentir': 'to feel',
  'tratar': 'to try/treat', 'mirar': 'to look', 'contar': 'to count/tell',
  'empezar': 'to begin', 'esperar': 'to wait/hope', 'buscar': 'to search',
  'existir': 'to exist', 'entrar': 'to enter', 'trabajar': 'to work',
  'escribir': 'to write', 'perder': 'to lose', 'producir': 'to produce',
  'ocurrir': 'to occur', 'entender': 'to understand', 'pedir': 'to ask for',
  'recibir': 'to receive', 'recordar': 'to remember', 'terminar': 'to finish',
  'permitir': 'to allow', 'aparecer': 'to appear', 'conseguir': 'to get',
  'comenzar': 'to begin', 'servir': 'to serve', 'sacar': 'to take out',
  'necesitar': 'to need', 'mantener': 'to maintain', 'resultar': 'to result',
  'leer': 'to read', 'caer': 'to fall', 'cambiar': 'to change',
  'presentar': 'to present', 'crear': 'to create', 'abrir': 'to open',
  'considerar': 'to consider', 'oír': 'to hear', 'acabar': 'to finish',
  'convertir': 'to convert', 'ganar': 'to win', 'formar': 'to form',
  'traer': 'to bring', 'partir': 'to depart', 'morir': 'to die',
  'aceptar': 'to accept', 'realizar': 'to realize', 'suponer': 'to suppose',
  'comprender': 'to understand', 'lograr': 'to achieve', 'explicar': 'to explain',
  'preguntar': 'to ask', 'tocar': 'to touch/play', 'reconocer': 'to recognize',
  'estudiar': 'to study', 'alcanzar': 'to reach', 'nacer': 'to be born',
  'dirigir': 'to direct', 'correr': 'to run', 'utilizar': 'to use',
  'pagar': 'to pay', 'dormir': 'to sleep', 'funcionar': 'to function',
  'jugar': 'to play', 'aprender': 'to learn', 'comprar': 'to buy',
  'cocinar': 'to cook', 'limpiar': 'to clean', 'caminar': 'to walk',
  'nadar': 'to swim', 'cantar': 'to sing', 'bailar': 'to dance',
  'viajar': 'to travel', 'visitar': 'to visit', 'celebrar': 'to celebrate',
  'olvidar': 'to forget', 'elegir': 'to choose', 'preferir': 'to prefer',
  'construir': 'to build', 'destruir': 'to destroy', 'reducir': 'to reduce',
  'aumentar': 'to increase', 'mejorar': 'to improve', 'desarrollar': 'to develop',
  'preparar': 'to prepare', 'organizar': 'to organize', 'participar': 'to participate',
  'compartir': 'to share', 'proteger': 'to protect', 'decidir': 'to decide',
  'resolver': 'to solve', 'imaginar': 'to imagine', 'observar': 'to observe',
  'comunicar': 'to communicate', 'establecer': 'to establish',
  'intentar': 'to try', 'evitar': 'to avoid', 'incluir': 'to include',
  'representar': 'to represent', 'significar': 'to mean',
  'demostrar': 'to demonstrate', 'aprovechar': 'to take advantage',
  'mover': 'to move', 'desear': 'to wish', 'enseñar': 'to teach',
  'cumplir': 'to fulfill', 'indicar': 'to indicate', 'asegurar': 'to ensure',
  'sugerir': 'to suggest', 'recomendar': 'to recommend',
  'invertir': 'to invest', 'exigir': 'to demand', 'contribuir': 'to contribute',
  'promover': 'to promote', 'garantizar': 'to guarantee',
  'renovar': 'to renew', 'transformar': 'to transform',
  'adaptar': 'to adapt', 'implementar': 'to implement',
};

// Build a combined lookup
const allLookup = {};

// Add function words
for (const [w, en] of Object.entries(FUNC_WORDS)) {
  allLookup[w] = en;
}

// Add verb conjugations
for (const [w, [inf, en]] of Object.entries(VERB_MAP)) {
  allLookup[w] = en;
}

// Add word dict
for (const [w, en] of Object.entries(WORD_DICT)) {
  // Skip entries with trailing numbers (disambiguation keys)
  const clean = w.replace(/\d+$/, '');
  if (!allLookup[clean]) {
    allLookup[clean] = en;
  }
}

// Add patch words
for (const [w, en] of Object.entries(PATCH)) {
  allLookup[w] = en;
}

// Tokenize: strip punctuation, lowercase, split on whitespace
function tokenize(text) {
  return text
    .replace(/[.,!?¿¡;:"""«»––…()\[\]{}\/\\]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0);
}

// Try to infer meaning for unknown words using patterns
function inferMeaning(word, english) {
  // Check direct lookup
  if (allLookup[word]) return allLookup[word];

  // Try without accent marks for lookup
  const noAccent = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (allLookup[noAccent]) return allLookup[noAccent];

  // Regular -ar verb conjugation patterns
  if (word.endsWith('amos') || word.endsWith('áis') || word.endsWith('aron') ||
      word.endsWith('aba') || word.endsWith('aban') || word.endsWith('ábamos') ||
      word.endsWith('ará') || word.endsWith('arán') || word.endsWith('aré') ||
      word.endsWith('arás') || word.endsWith('aría') || word.endsWith('arían') ||
      word.endsWith('ara') || word.endsWith('aran') || word.endsWith('ase') ||
      word.endsWith('asen')) {
    // Try to reconstruct infinitive
    let stem = '';
    if (word.endsWith('amos')) stem = word.slice(0, -4);
    else if (word.endsWith('áis')) stem = word.slice(0, -3);
    else if (word.endsWith('aron')) stem = word.slice(0, -4);
    else if (word.endsWith('ábamos')) stem = word.slice(0, -6);
    else if (word.endsWith('aban')) stem = word.slice(0, -4);
    else if (word.endsWith('aba')) stem = word.slice(0, -3);
    else if (word.endsWith('arán')) stem = word.slice(0, -4);
    else if (word.endsWith('ará')) stem = word.slice(0, -3);
    else if (word.endsWith('aré')) stem = word.slice(0, -3);
    else if (word.endsWith('arás')) stem = word.slice(0, -4);
    else if (word.endsWith('arían')) stem = word.slice(0, -5);
    else if (word.endsWith('aría')) stem = word.slice(0, -4);
    else if (word.endsWith('aran')) stem = word.slice(0, -4);
    else if (word.endsWith('ara')) stem = word.slice(0, -3);
    else if (word.endsWith('asen')) stem = word.slice(0, -4);
    else if (word.endsWith('ase')) stem = word.slice(0, -3);
    const inf = stem + 'ar';
    if (allLookup[inf]) return allLookup[inf];
  }

  // -ar present: -o, -as, -a, -an
  for (const [suffix, infSuffix] of [['ando', 'ar'], ['ado', 'ar']]) {
    if (word.endsWith(suffix)) {
      const inf = word.slice(0, -suffix.length) + infSuffix;
      if (allLookup[inf]) return allLookup[inf];
    }
  }

  // -er verb patterns
  for (const [suffix, infSuffix] of [['iendo', 'er'], ['ido', 'er'], ['emos', 'er'], ['éis', 'er'],
    ['ieron', 'er'], ['ía', 'er'], ['ían', 'er'], ['íamos', 'er'],
    ['erá', 'er'], ['erán', 'er'], ['eré', 'er'], ['erás', 'er'],
    ['ería', 'er'], ['erían', 'er'], ['iera', 'er'], ['ieran', 'er'],
    ['iese', 'er'], ['iesen', 'er']]) {
    if (word.endsWith(suffix)) {
      const inf = word.slice(0, -suffix.length) + infSuffix;
      if (allLookup[inf]) return allLookup[inf];
    }
  }

  // -ir verb patterns
  for (const [suffix, infSuffix] of [['iendo', 'ir'], ['ido', 'ir'], ['imos', 'ir'], ['ís', 'ir'],
    ['ieron', 'ir'], ['ía', 'ir'], ['ían', 'ir'], ['íamos', 'ir'],
    ['irá', 'ir'], ['irán', 'ir'], ['iré', 'ir'], ['irás', 'ir'],
    ['iría', 'ir'], ['irían', 'ir']]) {
    if (word.endsWith(suffix)) {
      const inf = word.slice(0, -suffix.length) + infSuffix;
      if (allLookup[inf]) return allLookup[inf];
    }
  }

  // Try removing common suffixes for adjectives/nouns
  // -mente adverbs
  if (word.endsWith('mente')) {
    const adj = word.slice(0, -5);
    if (allLookup[adj]) return allLookup[adj] + ' (adv)';
    const adjA = adj + 'a';
    if (allLookup[adjA]) return allLookup[adjA] + ' (adv)';
    // Map common -mente words
    return word.slice(0, -5) + 'ly';
  }

  // Plural forms: -es, -s
  if (word.endsWith('es') && word.length > 3) {
    const sing = word.slice(0, -2);
    if (allLookup[sing]) return allLookup[sing];
    // -ción -> -ciones
    if (word.endsWith('ciones')) {
      const sing2 = word.slice(0, -2).slice(0, -4) + 'ción';
      if (allLookup[sing2]) return allLookup[sing2];
    }
  }
  if (word.endsWith('s') && word.length > 3) {
    const sing = word.slice(0, -1);
    if (allLookup[sing]) return allLookup[sing];
  }

  // Feminine forms: -a -> -o
  if (word.endsWith('a') && word.length > 3) {
    const masc = word.slice(0, -1) + 'o';
    if (allLookup[masc]) return allLookup[masc];
  }

  // Try present tense -ar: -o/-as/-a/-an
  if (word.length > 2) {
    for (const ending of ['o', 'as', 'a', 'an', 'é', 'ó']) {
      if (word.endsWith(ending)) {
        const stem = word.slice(0, -ending.length);
        const inf = stem + 'ar';
        if (allLookup[inf]) return allLookup[inf];
      }
    }
    // -er present: -o/-es/-e/-en
    for (const ending of ['o', 'es', 'e', 'en']) {
      if (word.endsWith(ending) && word.length > ending.length + 2) {
        const stem = word.slice(0, -ending.length);
        const inf = stem + 'er';
        if (allLookup[inf]) return allLookup[inf];
      }
    }
    // -ir present: -o/-es/-e/-en
    for (const ending of ['o', 'es', 'e', 'en']) {
      if (word.endsWith(ending) && word.length > ending.length + 2) {
        const stem = word.slice(0, -ending.length);
        const inf = stem + 'ir';
        if (allLookup[inf]) return allLookup[inf];
      }
    }
  }

  // Reflexive: strip -se
  if (word.endsWith('se') && word.length > 4) {
    const base = word.slice(0, -2);
    if (allLookup[base]) return allLookup[base];
    return inferMeaning(base, english);
  }
  // Clitic pronouns: -me, -te, -lo, -la, -le, -nos
  for (const clitic of ['me', 'te', 'lo', 'la', 'le', 'nos', 'los', 'las', 'les']) {
    if (word.endsWith(clitic) && word.length > clitic.length + 2) {
      const base = word.slice(0, -clitic.length);
      if (allLookup[base]) return allLookup[base];
      const r = inferMeaning(base, english);
      if (r) return r;
    }
  }

  return null;
}

// Bilingual alignment using English translation as context
function alignCard(card) {
  const tokens = tokenize(card.target);
  const enLower = card.english.toLowerCase();
  const results = [];

  for (const token of tokens) {
    let meaning = inferMeaning(token, enLower);
    if (!meaning) {
      // Use context from English to guess
      meaning = guessFromContext(token, enLower);
    }
    if (!meaning) {
      meaning = token; // fallback: keep original
    }
    results.push({ word: token, en: meaning });
  }
  return results;
}

// Context-based guessing from English translation
function guessFromContext(word, english) {
  // Common Spanish words we can identify from context
  const contextMap = {
    'encantada': 'pleased', 'encantado': 'pleased',
    'conocerte': 'to meet you', 'conocerle': 'to meet you',
    'conocerlo': 'to know it', 'conocerla': 'to know her',
    'llamarme': 'to call myself', 'llamarte': 'to call you',
    'verme': 'to see me', 'verte': 'to see you',
    'hacerlo': 'to do it', 'hacerla': 'to do it',
    'decirme': 'to tell me', 'decirte': 'to tell you',
    'darme': 'to give me', 'darte': 'to give you',
    'irme': 'to leave', 'irse': 'to leave',
    'ponerse': 'to put on', 'sentirse': 'to feel',
    'quedarse': 'to stay', 'irse': 'to leave',
    'levantarse': 'to get up', 'acostarse': 'to go to bed',
    'bañarse': 'to bathe', 'ducharse': 'to shower',
    'vestirse': 'to dress', 'peinarse': 'to comb',
    'lavarse': 'to wash', 'cepillarse': 'to brush',
    'divertirse': 'to have fun', 'aburrirse': 'to be bored',
    'preocuparse': 'to worry', 'alegrarse': 'to be glad',
    'enojarse': 'to get angry', 'calmarse': 'to calm down',
    'mudarse': 'to move', 'casarse': 'to marry',
    'graduarse': 'to graduate', 'jubilarse': 'to retire',
    'portarse': 'to behave', 'acercarse': 'to approach',
    'alejarse': 'to move away', 'darse': 'to give oneself',
  };

  if (contextMap[word]) return contextMap[word];

  return null;
}

// Process all cards
console.log(`Processing ${deck.length} cards...`);
const alignments = {};
let processed = 0;

for (const card of deck) {
  const tokenResults = alignCard(card);
  for (const { word, en } of tokenResults) {
    if (!alignments[word]) {
      alignments[word] = [];
    }
    alignments[word].push({ en, card: card.id });
  }
  processed++;
  if (processed % 500 === 0) {
    console.log(`  ${processed}/${deck.length} cards processed...`);
  }
}

console.log(`Done. ${Object.keys(alignments).length} unique words found.`);

// Write output
const output = { alignments };
const outPath = path.join(__dirname, 'output', 'es-alignments.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Written to ${outPath}`);

// Stats
let totalOccurrences = 0;
let fallbackCount = 0;
for (const [word, entries] of Object.entries(alignments)) {
  totalOccurrences += entries.length;
  for (const e of entries) {
    if (e.en === word) fallbackCount++;
  }
}
console.log(`Total word occurrences: ${totalOccurrences}`);
console.log(`Fallback (untranslated): ${fallbackCount} (${(100*fallbackCount/totalOccurrences).toFixed(1)}%)`);
