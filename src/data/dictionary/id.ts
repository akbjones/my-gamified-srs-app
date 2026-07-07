/**
 * Indonesian dictionary — Stage-1 scaffold (seed entries only).
 *
 * Grows with the pilot deck; every deck token must resolve through
 * lookupWord (dict-coverage audit). Lookup order mirrors the other
 * Latin-script languages: exact → lowercase → affix-stripped root via
 * the engine's findInfinitive.
 */
import { findInfinitive } from '../conjugation/id';

export interface DictEntry {
  en: string;
  ipa?: string;
  pos?: string;
  /** Root whose derivation table opens when this token is tapped. */
  lemma?: string;
}

const DICT: Record<string, DictEntry> = {
  // Pronouns & function words
  'saya': { en: 'I; me (neutral)', ipa: 'ˈsaja', pos: 'pron' },
  'aku': { en: 'I; me (informal)', ipa: 'ˈaku', pos: 'pron' },
  'kamu': { en: 'you (informal)', ipa: 'ˈkamu', pos: 'pron' },
  'anda': { en: 'you (polite)', ipa: 'ˈanda', pos: 'pron' },
  'dia': { en: 'he; she', ipa: 'ˈdia', pos: 'pron' },
  'kami': { en: 'we (excluding you)', ipa: 'ˈkami', pos: 'pron' },
  'kita': { en: 'we (including you)', ipa: 'ˈkita', pos: 'pron' },
  'mereka': { en: 'they', ipa: 'məˈreka', pos: 'pron' },
  'ini': { en: 'this', ipa: 'ˈini', pos: 'det' },
  'itu': { en: 'that', ipa: 'ˈitu', pos: 'det' },
  'yang': { en: 'which; that (linker)', ipa: 'jaŋ', pos: 'conj' },
  'dan': { en: 'and', ipa: 'dan', pos: 'conj' },
  'di': { en: 'in; at (location)', ipa: 'di', pos: 'prep' },
  'ke': { en: 'to (direction)', ipa: 'kə', pos: 'prep' },
  'dari': { en: 'from', ipa: 'ˈdari', pos: 'prep' },
  'tidak': { en: 'not; no (verbs/adjectives)', ipa: 'ˈtidaʔ', pos: 'adv' },
  'bukan': { en: 'not (nouns)', ipa: 'ˈbukan', pos: 'adv' },
  'sudah': { en: 'already (completed)', ipa: 'ˈsudah', pos: 'adv' },
  'belum': { en: 'not yet', ipa: 'bəˈlum', pos: 'adv' },
  'sedang': { en: 'in the middle of (progressive)', ipa: 'səˈdaŋ', pos: 'adv' },
  'akan': { en: 'will (future)', ipa: 'ˈakan', pos: 'adv' },

  // Seed verbs (roots — the engine derives meN-/di-/ter-/ber- forms)
  'makan': { en: 'to eat', ipa: 'ˈmakan', pos: 'v' },
  'minum': { en: 'to drink', ipa: 'ˈminum', pos: 'v' },
  'pergi': { en: 'to go', ipa: 'pərˈgi', pos: 'v' },
  'datang': { en: 'to come', ipa: 'ˈdataŋ', pos: 'v' },
  'tidur': { en: 'to sleep', ipa: 'ˈtidur', pos: 'v' },
  'bicara': { en: 'to speak', ipa: 'biˈtʃara', pos: 'v' },
  'tulis': { en: 'to write (root)', ipa: 'ˈtulis', pos: 'v' },
  'baca': { en: 'to read (root)', ipa: 'ˈbatʃa', pos: 'v' },
  'lihat': { en: 'to see (root)', ipa: 'ˈlihat', pos: 'v' },
  'beli': { en: 'to buy (root)', ipa: 'bəˈli', pos: 'v' },
  'kerja': { en: 'to work (root)', ipa: 'kərˈdʒa', pos: 'v' },
  'belajar': { en: 'to study; to learn', ipa: 'bəˈladʒar', pos: 'v', lemma: 'ajar' },
  'suka': { en: 'to like', ipa: 'ˈsuka', pos: 'v' },
  'mau': { en: 'to want', ipa: 'ˈmau', pos: 'v' },
  'bisa': { en: 'can; to be able', ipa: 'ˈbisa', pos: 'v' },
  'punya': { en: 'to have', ipa: 'ˈpuɲa', pos: 'v' },

  // Seed nouns/adjectives
  'orang': { en: 'person', ipa: 'ˈoraŋ', pos: 'n' },
  'rumah': { en: 'house', ipa: 'ˈrumah', pos: 'n' },
  'air': { en: 'water', ipa: 'ˈair', pos: 'n' },
  'nasi': { en: 'cooked rice', ipa: 'ˈnasi', pos: 'n' },
  'hari': { en: 'day', ipa: 'ˈhari', pos: 'n' },
  'baik': { en: 'good; fine', ipa: 'ˈbaik', pos: 'adj' },
  'besar': { en: 'big', ipa: 'bəˈsar', pos: 'adj' },
  'kecil': { en: 'small', ipa: 'kəˈtʃil', pos: 'adj' },
  'baru': { en: 'new; just (did)', ipa: 'ˈbaru', pos: 'adj' },
  'banyak': { en: 'many; much', ipa: 'ˈbaɲaʔ', pos: 'adj' },
};

const clean = (w: string) => w.toLowerCase().replace(/[^a-z-]/g, '');

export function lookupWord(word: string): DictEntry | null {
  if (!word) return null;
  const w = clean(word);
  if (!w) return null;
  if (DICT[w]) return DICT[w];
  // Derived verb form → root entry (menulis/ditulis/tertulis → tulis)
  const root = findInfinitive(w);
  if (root && DICT[root]) {
    const e = DICT[root];
    return { ...e, lemma: e.lemma ?? root };
  }
  return null;
}
