/**
 * MSA Arabic dictionary — Stage-1 scaffold (seed entries only).
 *
 * Keys are stored orthographically NORMALIZED: alif variants أ/إ/آ → ا,
 * final ى → ي. Lookup normalizes the same way, and strips the attached
 * proclitics (و/ف/ب/ل/س + ال) that make Arabic tokens compound
 * (والبيت = و + ال + بيت). No harakat anywhere (deck policy).
 */
import { findInfinitive } from '../conjugation/ar';

export interface DictEntry {
  en: string;
  ipa: string;
  pos?: string;
  /** Citation form (past 3sg.m) whose table opens when tapped. */
  lemma?: string;
}

/** Orthographic key fold: alif variants + dotless ya. */
export const normalizeArabic = (t: string): string =>
  t.replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');

const DICT: Record<string, DictEntry> = {
  // Pronouns & function words
  'انا': { en: 'I', ipa: 'ʔanaː', pos: 'pron' },
  'انت': { en: 'you', ipa: 'ʔanta', pos: 'pron' },
  'هو': { en: 'he', ipa: 'huwa', pos: 'pron' },
  'هي': { en: 'she', ipa: 'hija', pos: 'pron' },
  'نحن': { en: 'we', ipa: 'naħnu', pos: 'pron' },
  'هم': { en: 'they', ipa: 'hum', pos: 'pron' },
  'هذا': { en: 'this (m)', ipa: 'haːðaː', pos: 'det' },
  'هذه': { en: 'this (f)', ipa: 'haːðihi', pos: 'det' },
  'في': { en: 'in; at', ipa: 'fiː', pos: 'prep' },
  'من': { en: 'from; who', ipa: 'min', pos: 'prep' },
  'الي': { en: 'to; towards', ipa: 'ʔilaː', pos: 'prep' },
  'علي': { en: 'on; upon', ipa: 'ʕalaː', pos: 'prep' },
  'مع': { en: 'with', ipa: 'maʕa', pos: 'prep' },
  'لا': { en: 'no; not (present)', ipa: 'laː', pos: 'adv' },
  'ما': { en: 'not (past); what', ipa: 'maː', pos: 'adv' },
  'نعم': { en: 'yes', ipa: 'naʕam', pos: 'interj' },
  'و': { en: 'and', ipa: 'wa', pos: 'conj' },
  'هل': { en: 'question marker (yes/no)', ipa: 'hal', pos: 'part' },
  'ماذا': { en: 'what', ipa: 'maːðaː', pos: 'pron' },
  'اين': { en: 'where', ipa: 'ʔajna', pos: 'adv' },
  'متي': { en: 'when', ipa: 'mataː', pos: 'adv' },
  'كيف': { en: 'how', ipa: 'kajfa', pos: 'adv' },

  // Seed verbs (citation form = past 3sg.m)
  'كتب': { en: 'to write (he wrote)', ipa: 'kataba', pos: 'v' },
  'درس': { en: 'to study (he studied)', ipa: 'darasa', pos: 'v' },
  'ذهب': { en: 'to go (he went)', ipa: 'ðahaba', pos: 'v' },
  'شرب': { en: 'to drink (he drank)', ipa: 'ʃariba', pos: 'v' },
  'اكل': { en: 'to eat (he ate)', ipa: 'ʔakala', pos: 'v', lemma: 'أكل' },
  'عمل': { en: 'to work; to do', ipa: 'ʕamila', pos: 'v' },
  'سكن': { en: 'to live; to reside', ipa: 'sakana', pos: 'v' },
  'قرا': { en: 'to read (he read)', ipa: 'qaraʔa', pos: 'v', lemma: 'قرأ' },
  'كان': { en: 'to be (he was)', ipa: 'kaːna', pos: 'v' },
  'قال': { en: 'to say (he said)', ipa: 'qaːla', pos: 'v' },
  'اراد': { en: 'to want (he wanted)', ipa: 'ʔaraːda', pos: 'v', lemma: 'أراد' },

  // Seed nouns/adjectives
  'بيت': { en: 'house', ipa: 'bajt', pos: 'n' },
  'ماء': { en: 'water', ipa: 'maːʔ', pos: 'n' },
  'خبز': { en: 'bread', ipa: 'χubz', pos: 'n' },
  'قهوة': { en: 'coffee', ipa: 'qahwa', pos: 'n' },
  'يوم': { en: 'day', ipa: 'jawm', pos: 'n' },
  'مدينة': { en: 'city', ipa: 'madiːna', pos: 'n' },
  'كتاب': { en: 'book', ipa: 'kitaːb', pos: 'n' },
  'صديق': { en: 'friend', ipa: 'sˤadiːq', pos: 'n' },
  'كبير': { en: 'big', ipa: 'kabiːr', pos: 'adj' },
  'صغير': { en: 'small', ipa: 'sˤaɣiːr', pos: 'adj' },
  'جيد': { en: 'good', ipa: 'dʒajjid', pos: 'adj' },
  'مرحبا': { en: 'hello', ipa: 'marħaban', pos: 'phrase' },
  'شكرا': { en: 'thank you', ipa: 'ʃukran', pos: 'phrase' },
};

/** Proclitics that attach to the following word, longest-combination first. */
const PROCLITICS = ['وبال', 'فبال', 'وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك', 'س'];

export function lookupWord(word: string): DictEntry | null {
  if (!word) return null;
  const w = normalizeArabic(word.trim().replace(/[^ء-ي]/g, ''));
  if (!w) return null;
  if (DICT[w]) return DICT[w];

  // Conjugated verb → citation entry (يكتبون → كتب)
  const lemma = findInfinitive(w);
  if (lemma) {
    const key = normalizeArabic(lemma);
    if (DICT[key]) {
      const e = DICT[key];
      return { ...e, lemma: e.lemma ?? lemma };
    }
  }

  // Proclitic stripping (والبيت → بيت)
  for (const p of PROCLITICS) {
    if (w.startsWith(p) && w.length > p.length + 1) {
      const base = w.slice(p.length);
      if (DICT[base]) return DICT[base];
      const lem = findInfinitive(base);
      if (lem && DICT[normalizeArabic(lem)]) {
        const e = DICT[normalizeArabic(lem)];
        return { ...e, lemma: e.lemma ?? lem };
      }
    }
  }
  return null;
}
