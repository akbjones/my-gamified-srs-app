/**
 * Greek dictionary — Stage-1 scaffold (seed entries only).
 *
 * Keys are stored lowercase and σ-normalized (final ς → σ): the lookup
 * normalizes the same way, so καιρός and ΚΑΙΡΟΣ both resolve. Grows with
 * the pilot deck; every deck token must resolve (dict-coverage audit).
 */
import { findInfinitive, normalizeGreek, stripAccents } from '../conjugation/el';

export interface DictEntry {
  en: string;
  ipa: string;
  pos?: string;
  /** Citation form (1sg present) whose table opens when tapped. */
  lemma?: string;
}

const DICT: Record<string, DictEntry> = {
  // Pronouns & function words
  'εγώ': { en: 'I', ipa: 'eˈɣo', pos: 'pron' },
  'εσύ': { en: 'you (singular)', ipa: 'eˈsi', pos: 'pron' },
  'αυτόσ': { en: 'he; this', ipa: 'afˈtos', pos: 'pron' },
  'αυτή': { en: 'she; this', ipa: 'afˈti', pos: 'pron' },
  'εμείσ': { en: 'we', ipa: 'eˈmis', pos: 'pron' },
  'εσείσ': { en: 'you (plural/polite)', ipa: 'eˈsis', pos: 'pron' },
  'και': { en: 'and', ipa: 'ce', pos: 'conj' },
  'δεν': { en: 'not (verbs)', ipa: 'ðen', pos: 'adv' },
  'μη': { en: "don't (prohibitions)", ipa: 'mi', pos: 'adv' },
  'ναι': { en: 'yes', ipa: 'ne', pos: 'interj' },
  'όχι': { en: 'no', ipa: 'ˈoçi', pos: 'interj' },
  'το': { en: 'the (neuter); it', ipa: 'to', pos: 'det' },
  'ο': { en: 'the (masculine)', ipa: 'o', pos: 'det' },
  'η': { en: 'the (feminine)', ipa: 'i', pos: 'det' },
  'σε': { en: 'in; to; at', ipa: 'se', pos: 'prep' },
  'από': { en: 'from', ipa: 'aˈpo', pos: 'prep' },
  'με': { en: 'with; me', ipa: 'me', pos: 'prep' },
  'για': { en: 'for; about', ipa: 'ʝa', pos: 'prep' },

  // Seed verbs (citation form = 1sg present)
  'είμαι': { en: 'to be (I am)', ipa: 'ˈime', pos: 'v' },
  'έχω': { en: 'to have (I have)', ipa: 'ˈexo', pos: 'v' },
  'πάω': { en: 'to go (I go)', ipa: 'ˈpao', pos: 'v' },
  'λέω': { en: 'to say (I say)', ipa: 'ˈleo', pos: 'v' },
  'τρώω': { en: 'to eat (I eat)', ipa: 'ˈtroo', pos: 'v' },
  'ακούω': { en: 'to hear; to listen', ipa: 'aˈkuo', pos: 'v' },
  'γράφω': { en: 'to write', ipa: 'ˈɣrafo', pos: 'v' },
  'μιλάω': { en: 'to speak', ipa: 'miˈlao', pos: 'v' },
  'θέλω': { en: 'to want', ipa: 'ˈθelo', pos: 'v' },
  'ξέρω': { en: 'to know', ipa: 'ˈksero', pos: 'v' },
  'βλέπω': { en: 'to see', ipa: 'ˈvlepo', pos: 'v' },
  'κάνω': { en: 'to do; to make', ipa: 'ˈkano', pos: 'v' },
  'έρχομαι': { en: 'to come', ipa: 'ˈerxome', pos: 'v' },

  // Seed nouns/adjectives
  'νερό': { en: 'water', ipa: 'neˈro', pos: 'n' },
  'ψωμί': { en: 'bread', ipa: 'psoˈmi', pos: 'n' },
  'σπίτι': { en: 'house; home', ipa: 'ˈspiti', pos: 'n' },
  'μέρα': { en: 'day', ipa: 'ˈmera', pos: 'n' },
  'καλόσ': { en: 'good', ipa: 'kaˈlos', pos: 'adj' },
  'μεγάλοσ': { en: 'big', ipa: 'meˈɣalos', pos: 'adj' },
  'μικρόσ': { en: 'small', ipa: 'miˈkros', pos: 'adj' },
  'καλημέρα': { en: 'good morning', ipa: 'kaliˈmera', pos: 'phrase' },
  'ευχαριστώ': { en: 'thank you', ipa: 'efxariˈsto', pos: 'phrase' },
  'παρακαλώ': { en: 'please; you are welcome', ipa: 'parakaˈlo', pos: 'phrase' },
};

export function lookupWord(word: string): DictEntry | null {
  if (!word) return null;
  const w = normalizeGreek(word).replace(/[^α-ωάέήίόύώϊϋΐΰ-]/g, '');
  if (!w) return null;
  if (DICT[w]) return DICT[w];
  // Accent-tolerant pass (tapped tokens sometimes lose accents on mobile)
  const bare = stripAccents(w);
  for (const [k, v] of Object.entries(DICT)) {
    if (stripAccents(k) === bare) return v;
  }
  // Conjugated form → citation-form entry
  const lemma = findInfinitive(w);
  if (lemma) {
    const key = normalizeGreek(lemma);
    if (DICT[key]) {
      const e = DICT[key];
      return { ...e, lemma: e.lemma ?? lemma };
    }
  }
  return null;
}
