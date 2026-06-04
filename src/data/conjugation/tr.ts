/**
 * Turkish verb conjugation engine
 * Handles regular verbs with vowel harmony, and major irregular verbs.
 *
 * Turkish is agglutinative – suffixes are added to the verb stem following
 * vowel harmony rules (front/back, rounded/unrounded).
 *
 * Person order: ben (I), sen (you), o (he/she/it), biz (we), siz (you-pl/formal), onlar (they)
 *
 * Tenses:
 *   present_cont – Şimdiki zaman (-yor)
 *   aorist       – geniş zaman (-r/-er/-ir/-ar)
 *   past         – geçmiş zaman (-di/-dı/-du/-dü)
 *   reported     – duyulan geçmiş (-miş/-mış/-muş/-müş)
 *   future       – gelecek zaman (-ecek/-acak)
 *   conditional  – Şart (-se/-sa)
 */
import type { ConjugationTable } from '../../types';

type Forms = [string, string, string, string, string, string];
type TenseKey = 'present_cont' | 'aorist' | 'past' | 'reported' | 'future' | 'conditional';

const TENSES: TenseKey[] = ['present_cont', 'aorist', 'past', 'reported', 'future', 'conditional'];

const TENSE_LABELS: Record<TenseKey, string> = {
  present_cont: 'Şimdiki Zaman (Present Cont.)',
  aorist: 'Geniş Zaman (Aorist)',
  past: 'Geçmiş Zaman (Past)',
  reported: 'Duyulan Geçmiş (Reported)',
  future: 'Gelecek Zaman (Future)',
  conditional: 'Şart (Conditional)',
};

// ── Vowel harmony helpers ───────────────────────────────────
const BACK_VOWELS = new Set('aıou');
const FRONT_VOWELS = new Set('eiöü');
const ROUNDED_VOWELS = new Set('oöuü');

function lastVowel(word: string): string {
  for (let i = word.length - 1; i >= 0; i--) {
    if (BACK_VOWELS.has(word[i]) || FRONT_VOWELS.has(word[i])) return word[i];
  }
  return 'a'; // default
}

function isBackVowel(v: string): boolean {
  return BACK_VOWELS.has(v);
}

function isRounded(v: string): boolean {
  return ROUNDED_VOWELS.has(v);
}

/** 2-way harmony: a/e */
function harmonyAE(word: string): string {
  return isBackVowel(lastVowel(word)) ? 'a' : 'e';
}

/** 4-way harmony: ı/i/u/ü */
function harmony4(word: string): string {
  const v = lastVowel(word);
  const back = isBackVowel(v);
  const rounded = isRounded(v);
  if (back && !rounded) return 'ı';
  if (back && rounded) return 'u';
  if (!back && !rounded) return 'i';
  return 'ü';
}

/** Consonant mutation: final k→ğ, p→b, t→d, ç→c before vowel suffix */
function softenFinal(stem: string): string {
  const last = stem.slice(-1);
  const map: Record<string, string> = { 'k': 'ğ', 'p': 'b', 't': 'd', 'ç': 'c' };
  if (map[last]) return stem.slice(0, -1) + map[last];
  return stem;
}

function endsWithVowel(word: string): boolean {
  const last = word.slice(-1);
  return BACK_VOWELS.has(last) || FRONT_VOWELS.has(last);
}

// ── Get verb stem ───────────────────────────────────────────
function getStem(infinitive: string): string {
  // Turkish infinitives end in -mek or -mak
  if (infinitive.endsWith('mek') || infinitive.endsWith('mak')) {
    return infinitive.slice(0, -3);
  }
  return infinitive;
}

// ── Person suffixes ─────────────────────────────────────────
// After consonant suffixes
function personSuffixes(stem: string): Forms {
  const h = harmony4(stem);
  return [
    `${h}m`,  // ben: -ım/-im/-um/-üm
    `s${h}n`, // sen: -sın/-sin/-sun/-sün
    '',        // o: (none)
    `${h}z`,  // biz: -ız/-iz/-uz/-üz
    `s${h}n${h}z`, // siz: -sınız/-siniz/-sunuz/-sünüz
    'lar',    // onlar: -lar/-ler (simplified, actually follows harmony)
  ];
}

// ── Irregular verbs ─────────────────────────────────────────
interface IrregularData {
  aoristStem?: string;      // aorist stem if irregular
  presentStem?: string;     // -yor stem if different
  pastStem?: string;
  wideAorist?: boolean;     // uses -r instead of -er/-ir for aorist
}

const IRREGULARS: Record<string, IrregularData> = {
  'olmak': { aoristStem: 'ol', wideAorist: true },       // to be/become
  'gelmek': { aoristStem: 'gel', wideAorist: true },     // to come
  'görmek': { aoristStem: 'gör', wideAorist: true },     // to see
  'vermek': { aoristStem: 'ver', wideAorist: true },     // to give
  'almak': { aoristStem: 'al', wideAorist: true },       // to take
  'bilmek': { aoristStem: 'bil', wideAorist: true },     // to know
  'bulmak': { aoristStem: 'bul', wideAorist: true },     // to find
  'durmak': { aoristStem: 'dur', wideAorist: true },     // to stop
  'gitmek': { pastStem: 'git', presentStem: 'gid' },     // to go (t→d before vowel)
  'etmek': { pastStem: 'et', presentStem: 'ed' },        // to do
  'tatmak': { pastStem: 'tat', presentStem: 'tad' },     // to taste
  'yemek': { presentStem: 'yi', pastStem: 'ye', aoristStem: 'ye', wideAorist: true }, // to eat
  'demek': { presentStem: 'di', pastStem: 'de', aoristStem: 'de', wideAorist: true }, // to say
};

// ── Conjugation functions ───────────────────────────────────

function conjugatePresentCont(stem: string, _inf: string): Forms {
  // -yor suffix needs a vowel before it:
  // - If stem ends in vowel, drop it (e.g. bekle → bekl + iyor)
  // - If stem ends in consonant, insert buffer vowel via 4-way harmony
  let s = stem;
  if (endsWithVowel(s)) {
    s = s.slice(0, -1);
  }
  // Buffer vowel: ı/i/u/ü based on last vowel of stem
  const buf = harmony4(s);
  // -yor is always yor (no harmony on the suffix itself)
  return [
    `${s}${buf}yorum`,
    `${s}${buf}yorsun`,
    `${s}${buf}yor`,
    `${s}${buf}yoruz`,
    `${s}${buf}yorsunuz`,
    `${s}${buf}yorlar`,
  ];
}

function conjugateAorist(stem: string, inf: string): Forms {
  const irr = IRREGULARS[inf];
  let aoristBase: string;

  if (irr?.wideAorist) {
    // Monosyllabic: stem + r
    const s = irr.aoristStem || stem;
    aoristBase = s + (endsWithVowel(s) ? 'r' : `${harmony4(s)}r`);
  } else {
    // Regular: stem + er/ar (2-way harmony) for consonant-ending
    // stem + r for vowel-ending
    if (endsWithVowel(stem)) {
      aoristBase = stem + 'r';
    } else {
      aoristBase = stem + harmonyAE(stem) + 'r';
    }
  }

  return [
    `${aoristBase}${harmony4(aoristBase)}m`,
    `${aoristBase}s${harmony4(aoristBase)}n`,
    `${aoristBase}`,
    `${aoristBase}${harmony4(aoristBase)}z`,
    `${aoristBase}s${harmony4(aoristBase)}n${harmony4(aoristBase)}z`,
    `${aoristBase}lar`,
  ];
}

function conjugatePast(stem: string, _inf: string): Forms {
  const h = harmony4(stem);
  const a = harmonyAE(stem);
  // Voiced/voiceless: d after vowels and voiced consonants, t after voiceless
  const voiceless = new Set('çfhkpsşt');
  const d = voiceless.has(stem.slice(-1)) ? 't' : 'd';

  const base = `${stem}${d}${h}`;
  return [
    `${base}m`,
    `${base}n`,
    `${stem}${d}${h}`,
    `${base}k`,
    `${base}n${h}z`,
    `${stem}${d}${h}lar`,
  ];
}

function conjugateReported(stem: string, _inf: string): Forms {
  const h = harmony4(stem);
  const base = `${stem}m${h}ş`;
  return [
    `${base}${h}m`,
    `${base}s${h}n`,
    `${base}`,
    `${base}${h}z`,
    `${base}s${h}n${h}z`,
    `${base}lar`,
  ];
}

function conjugateFuture(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  let s = endsWithVowel(stem) ? stem.slice(0, -1) + 'y' : stem;
  const base = `${s}${a}c${a}k`;
  const h = harmony4(base);
  return [
    `${s}${a}c${a}ğ${h}m`,
    `${s}${a}c${a}ks${h}n`,
    `${base}`,
    `${s}${a}c${a}ğ${h}z`,
    `${s}${a}c${a}ks${h}n${h}z`,
    `${s}${a}c${a}klar`,
  ];
}

function conjugateConditional(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const base = `${stem}s${a}`;
  return [
    `${base}m`,
    `${base}n`,
    `${base}`,
    `${base}k`,
    `${base}n${harmony4(base)}z`,
    `${stem}s${a}lar`,
  ];
}

// ── Main conjugation function ───────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  if (!infinitive.endsWith('mek') && !infinitive.endsWith('mak')) return null;

  const rawStem = getStem(infinitive);
  const irr = IRREGULARS[infinitive];

  const tenses: Record<string, string[]> = {};

  for (const tense of TENSES) {
    const label = TENSE_LABELS[tense];
    let stem = rawStem;

    // Use irregular stems where applicable
    if (tense === 'present_cont' && irr?.presentStem) stem = irr.presentStem;
    if (tense === 'past' && irr?.pastStem) stem = irr.pastStem;

    switch (tense) {
      case 'present_cont':
        tenses[label] = conjugatePresentCont(stem, infinitive);
        break;
      case 'aorist':
        tenses[label] = conjugateAorist(stem, infinitive);
        break;
      case 'past':
        tenses[label] = conjugatePast(stem, infinitive);
        break;
      case 'reported':
        tenses[label] = conjugateReported(stem, infinitive);
        break;
      case 'future':
        tenses[label] = conjugateFuture(stem, infinitive);
        break;
      case 'conditional':
        tenses[label] = conjugateConditional(stem, infinitive);
        break;
    }
  }

  return {
    infinitive,
    isReflexive: false,
    tenses,
  };
}

// ── Reverse lookup: find infinitive from conjugated form ────
const TENSE_SUFFIXES = [
  // Present continuous
  'yorum', 'yorsun', 'yor', 'yoruz', 'yorsunuz', 'yorlar',
  // Future
  'acağım', 'acaksın', 'acak', 'acağız', 'acaksınız', 'acaklar',
  'eceğim', 'eceksin', 'ecek', 'eceğiz', 'eceksiniz', 'ecekler',
  // Reported past
  'mışım', 'mışsın', 'mış', 'mışız', 'mışsınız', 'mışlar',
  'mişim', 'mişsin', 'miş', 'mişiz', 'mişsiniz', 'mişler',
  'muşum', 'muşsun', 'muş', 'muşuz', 'muşsunuz', 'muşlar',
  'müşüm', 'müşsün', 'müş', 'müşüz', 'müşsünüz', 'müşler',
  // Past
  'dım', 'dın', 'dı', 'dık', 'dınız', 'dılar',
  'dim', 'din', 'di', 'dik', 'diniz', 'diler',
  'dum', 'dun', 'du', 'duk', 'dunuz', 'dular',
  'düm', 'dün', 'dü', 'dük', 'dünüz', 'düler',
  'tım', 'tın', 'tı', 'tık', 'tınız', 'tılar',
  'tim', 'tin', 'ti', 'tik', 'tiniz', 'tiler',
  'tum', 'tun', 'tu', 'tuk', 'tunuz', 'tular',
  'tüm', 'tün', 'tü', 'tük', 'tünüz', 'tüler',
  // Aorist
  'ırım', 'ırsın', 'ır', 'ırız', 'ırsınız', 'ırlar',
  'irim', 'irsin', 'ir', 'iriz', 'irsiniz', 'irler',
  'urum', 'ursun', 'ur', 'uruz', 'ursunuz', 'urlar',
  'ürüm', 'ürsün', 'ür', 'ürüz', 'ürsünüz', 'ürler',
  'erim', 'ersin', 'er', 'eriz', 'ersiniz', 'erler',
  'arım', 'arsın', 'ar', 'arız', 'arsınız', 'arlar',
  // Conditional
  'sam', 'san', 'sa', 'sak', 'sanız', 'salar',
  'sem', 'sen', 'se', 'sek', 'seniz', 'seler',
];

export function findInfinitive(form: string): string | null {
  // Direct infinitive
  if (form.endsWith('mek') || form.endsWith('mak')) return form;

  // Try stripping suffixes
  for (const suffix of TENSE_SUFFIXES) {
    if (form.endsWith(suffix)) {
      const stem = form.slice(0, -suffix.length);
      if (stem.length >= 2) {
        // Determine -mak or -mek based on vowel harmony
        const ending = isBackVowel(lastVowel(stem)) ? 'mak' : 'mek';
        return stem + ending;
      }
    }
  }

  return null;
}

export default conjugate;
