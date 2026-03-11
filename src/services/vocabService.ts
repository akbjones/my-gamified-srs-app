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
