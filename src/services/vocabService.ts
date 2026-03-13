import { VocabEntry, VocabMap, Language } from '../types';
import { DictEntry } from '../data/dictionary/es';

// ── Tokenization ────────────────────────────────────────────
export function tokenizeSentence(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[¿¡.,!?;:"""''()—–\-…«»]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/** Tokenize preserving original case — returns [lowercase, original] pairs */
function tokenizeSentenceWithCase(sentence: string): [string, string][] {
  const raw = sentence
    .replace(/[¿¡.,!?;:"""''()—–\-…«»]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
  return raw.map((w, i) => {
    const lower = w.toLowerCase();
    // First word is always capitalized (sentence start) — don't treat as proper noun
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
};

export function isCommonWord(word: string, lang: Language): boolean {
  const set = COMMON_WORDS[lang];
  return set ? set.has(word.toLowerCase()) : false;
}

// ── Record words from a studied card ────────────────────────
export function recordWordsFromCard(
  sentence: string,
  vocabMap: VocabMap,
  lookupFn: (w: string) => DictEntry | null,
  wasFailure: boolean,
): VocabMap {
  const tokens = tokenizeSentenceWithCase(sentence);
  const now = Date.now();
  const updated = { ...vocabMap };

  for (const [key, display] of tokens) {
    if (key.length < 2) continue; // skip single chars

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
