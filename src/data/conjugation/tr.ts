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
type TenseKey =
  | 'present_cont' | 'aorist' | 'past' | 'reported' | 'future' | 'conditional'
  | 'imperative' | 'necessitative'
  | 'present_cont_neg' | 'aorist_neg' | 'past_neg' | 'reported_neg' | 'future_neg' | 'conditional_neg' | 'necessitative_neg'
  | 'temporal_converb' | 'manner_converb';

const TENSES: TenseKey[] = [
  'present_cont', 'aorist', 'past', 'reported', 'future', 'conditional',
  'imperative', 'necessitative',
  'temporal_converb', 'manner_converb',
  'present_cont_neg', 'aorist_neg', 'past_neg', 'reported_neg', 'future_neg', 'conditional_neg', 'necessitative_neg',
];

const TENSE_LABELS: Record<TenseKey, string> = {
  present_cont: 'Şimdiki Zaman (Present Cont.)',
  aorist: 'Geniş Zaman (Aorist)',
  past: 'Geçmiş Zaman (Past)',
  reported: 'Duyulan Geçmiş (Reported)',
  future: 'Gelecek Zaman (Future)',
  conditional: 'Şart (Conditional)',
  imperative: 'Emir Kipi (Imperative)',
  necessitative: 'Gereklilik Kipi (Necessitative)',
  temporal_converb: '-ınca/-ince (When X)',
  manner_converb: '-arak/-erek (By X-ing)',
  present_cont_neg: 'Şimdiki Zaman Olumsuz (Present Cont. Neg.)',
  aorist_neg: 'Geniş Zaman Olumsuz (Aorist Neg.)',
  past_neg: 'Geçmiş Zaman Olumsuz (Past Neg.)',
  reported_neg: 'Duyulan Geçmiş Olumsuz (Reported Neg.)',
  future_neg: 'Gelecek Zaman Olumsuz (Future Neg.)',
  conditional_neg: 'Şart Olumsuz (Conditional Neg.)',
  necessitative_neg: 'Gereklilik Olumsuz (Necessitative Neg.)',
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

/** 3rd-plural -lar/-ler by 2-way harmony on the word built so far.
 *  Hardcoded 'lar'/'ler' produced gelirlar/yapmazler-class errors. */
function pluralLE(ctx: string): string {
  return harmonyAE(ctx) === 'a' ? 'lar' : 'ler';
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
    // stem + r for vowel-ending. Voicing irregulars (etmek→ed, gitmek→gid)
    // use their present stem before the vowel-initial suffix: ed+er → eder.
    const s0 = irr?.presentStem || stem;
    if (endsWithVowel(s0)) {
      aoristBase = s0 + 'r';
    } else {
      aoristBase = s0 + harmonyAE(s0) + 'r';
    }
  }

  return [
    `${aoristBase}${harmony4(aoristBase)}m`,
    `${aoristBase}s${harmony4(aoristBase)}n`,
    `${aoristBase}`,
    `${aoristBase}${harmony4(aoristBase)}z`,
    `${aoristBase}s${harmony4(aoristBase)}n${harmony4(aoristBase)}z`,
    `${aoristBase}${pluralLE(aoristBase)}`,
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
    `${stem}${d}${h}${pluralLE(stem + d + h)}`,
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
    `${base}${pluralLE(base)}`,
  ];
}

function conjugateFuture(stem: string, _inf: string): Forms {
  // Voicing irregulars (etmek→ed, gitmek→gid) surface before the
  // vowel-initial future suffix: ed+ecek → edecek (not etecek).
  const irrF = IRREGULARS[_inf];
  const stemF = irrF?.presentStem || stem;
  const a = harmonyAE(stemF);
  let s = endsWithVowel(stemF) ? stemF.slice(0, -1) + 'y' : stemF;
  const base = `${s}${a}c${a}k`;
  const h = harmony4(base);
  return [
    `${s}${a}c${a}ğ${h}m`,
    `${s}${a}c${a}ks${h}n`,
    `${base}`,
    `${s}${a}c${a}ğ${h}z`,
    `${s}${a}c${a}ks${h}n${h}z`,
    `${s}${a}c${a}k${pluralLE(a)}`,
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
    `${stem}s${a}${pluralLE(a)}`,
  ];
}

// ── Imperative ────────────────────────────────────────────
// Person column ordering matches other tenses: ben/sen/o/biz/siz/onlar.
// ben has no imperative; biz uses cohortative (gel-elim "let's come").
function conjugateImperative(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const h = harmony4(stem);
  return [
    '-',                  // ben (no 1sg imperative)
    `${stem}`,            // sen: bare stem — gel
    `${stem}s${h}n`,      // o: gelsin (jussive)
    `${stem}${a}l${harmony4(stem + a)}m`, // biz: gel-elim (let's)
    `${stem}${h}n`,       // siz: gelin (also formal sing)
    `${stem}s${h}n${pluralLE(stem + 's' + h + 'n')}`,   // onlar: gelsinler/yapsınlar
  ];
}

// ── Necessitative (-meli/-malı) ───────────────────────────
// "must/have to": gelmeliyim (I must come)
function conjugateNecessitative(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const base = `${stem}m${a}l${harmony4(stem + 'm' + a)}`;
  return [
    `${base}y${harmony4(base)}m`,    // -meliyim
    `${base}s${harmony4(base)}n`,    // -melisin
    `${base}`,                        // -meli
    `${base}y${harmony4(base)}z`,    // -meliyiz
    `${base}s${harmony4(base)}n${harmony4(base)}z`, // -melisiniz
    `${base}${pluralLE(base)}`,               // -meliler/-malılar
  ];
}

// ── Non-finite converbs (no person agreement) ─────────────
/** Temporal converb (-ınca / -ince / -unca / -ünce): "when X happens".
 * Single form, all six person columns identical. Example: gel-ince ("upon
 * coming"), bastır-ınca ("when it presses"). */
function conjugateTemporalConverb(stem: string, _inf: string): Forms {
  const h = harmony4(stem);
  // -ınca/-unca for back vowels, -ince/-ünce for front vowels. The 'a/e' at
  // the end follows 2-way harmony of the harmony-4 buffer vowel itself.
  const final = isBackVowel(h) ? 'a' : 'e';
  const form = `${stem}${h}nc${final}`;
  return [form, form, form, form, form, form];
}

/** Manner converb (-arak / -erek): "by X-ing". Single form. */
function conjugateMannerConverb(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const form = `${stem}${a}r${a}k`;
  return [form, form, form, form, form, form];
}

// ── Negation helpers ──────────────────────────────────────
/** Negative present continuous: stem + MI/MU + yor.
 * Note: the negative suffix harmonizes to mı/mi/mu/mü (4-way) before -yor,
 * not to me/ma. Example: gelmek → gelmiyor (NOT gelmeyor), okumak → okumuyor.
 */
function conjugatePresentContNeg(stem: string, _inf: string): Forms {
  // Negative -mI- doesn't trigger stem-final-vowel drop the way -yor does in the
  // positive: oku + m + u + yor = okumuyor (NOT okmuyor). So we keep the full stem.
  const s = stem;
  const neg = harmony4(s);  // mı/mi/mu/mü
  const base = `${s}m${neg}yor`;
  return [
    `${base}um`,
    `${base}sun`,
    `${base}`,
    `${base}uz`,
    `${base}sunuz`,
    `${base}${pluralLE(base)}`,
  ];
}

/** Negative aorist: stem + me/ma (no -r/-er), with irregular 1sg/1pl + 2pl forms.
 * gelmek → gelmem, gelmezsin, gelmez, gelmeyiz, gelmezsiniz, gelmezler
 */
function conjugateAoristNeg(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const me = `${stem}m${a}`;
  const mez = `${stem}m${a}z`;
  return [
    `${me}m`,             // ben: gelmem
    `${mez}s${harmony4(mez)}n`,  // sen: gelmezsin
    `${mez}`,             // o: gelmez
    `${me}y${harmony4(me)}z`,    // biz: gelmeyiz
    `${mez}s${harmony4(mez)}n${harmony4(mez)}z`, // siz: gelmezsiniz
    `${mez}${pluralLE(mez)}`,   // onlar: gelmezler/yapmazlar
  ];
}

/** Negative past: stem + me/ma + di + person. gelmek → gelmedim */
function conjugatePastNeg(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const base = `${stem}m${a}d${harmony4(stem + 'm' + a + 'd')}`;
  return [
    `${base}m`,
    `${base}n`,
    `${stem}m${a}d${harmony4(stem + 'm' + a + 'd')}`,
    `${base}k`,
    `${base}n${harmony4(base)}z`,
    `${stem}m${a}d${harmony4(stem + 'm' + a + 'd')}${pluralLE(a)}`,
  ];
}

/** Negative reported: stem + me/ma + miş + person. gelmek → gelmemişim */
function conjugateReportedNeg(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const base = `${stem}m${a}m${harmony4(stem + 'm' + a + 'm')}ş`;
  const h = harmony4(base);
  return [
    `${base}${h}m`,
    `${base}s${h}n`,
    `${base}`,
    `${base}${h}z`,
    `${base}s${h}n${h}z`,
    `${base}${pluralLE(base)}`,
  ];
}

/** Negative future: stem + me/ma + yacak/yecek. gelmek → gelmeyeceğim */
function conjugateFutureNeg(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  // stem + me/ma + y + acak/ecek
  const ya = `${stem}m${a}y${a}c${a}k`;
  const yaSoft = `${stem}m${a}y${a}c${a}ğ`;
  const h = harmony4(ya);
  return [
    `${yaSoft}${h}m`,
    `${ya}s${h}n`,
    `${ya}`,
    `${yaSoft}${h}z`,
    `${ya}s${h}n${h}z`,
    `${ya}${pluralLE(ya)}`,
  ];
}

/** Negative conditional: stem + me/ma + se/sa + person. gelmek → gelmesem */
function conjugateConditionalNeg(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const base = `${stem}m${a}s${a}`;
  return [
    `${base}m`,
    `${base}n`,
    `${base}`,
    `${base}k`,
    `${base}n${harmony4(base)}z`,
    `${stem}m${a}s${a}${pluralLE(a)}`,
  ];
}

/** Negative necessitative: stem + me/ma + meli/malı. gelmek → gelmemeliyim */
function conjugateNecessitativeNeg(stem: string, _inf: string): Forms {
  const a = harmonyAE(stem);
  const base = `${stem}m${a}m${a}l${harmony4(stem + 'm' + a + 'm' + a)}`;
  return [
    `${base}y${harmony4(base)}m`,
    `${base}s${harmony4(base)}n`,
    `${base}`,
    `${base}y${harmony4(base)}z`,
    `${base}s${harmony4(base)}n${harmony4(base)}z`,
    `${base}${pluralLE(base)}`,
  ];
}

// ── Main conjugation function ───────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  // Turkish dict has a Phase-B inheritance bug where some entries have a
  // bare-stem lemma (e.g. lemma: 'geç' for 'geçeriz'). Try the -mek/-mak
  // back-suffix, but conservatively — only for short consonant-ending
  // tokens that don't already contain inflection markers. Otherwise the
  // engine happily appends to gerunds ("bastırınca" → "bastırıncamak")
  // and produces nonsense tables that fool the matcher.
  if (!infinitive.endsWith('mek') && !infinitive.endsWith('mak')) {
    const INFLECTION_MARKERS = ['ıyor', 'iyor', 'uyor', 'üyor', 'mış', 'miş', 'muş', 'müş', 'acak', 'ecek', 'ınca', 'ince', 'unca', 'ünce', 'arak', 'erek', 'dik', 'tik', 'dim', 'tim', 'sin', 'sun', 'sünüz'];
    const looksLikeStem = infinitive.length <= 7
      && /[^aıoueiöü]$/.test(infinitive)
      && !INFLECTION_MARKERS.some(m => infinitive.includes(m));
    if (looksLikeStem) {
      const lastVowel = (infinitive.match(/[aıoueiöü](?=[^aıoueiöü]*$)/i) || [''])[0].toLowerCase();
      const backVowels = ['a', 'ı', 'o', 'u'];
      const suffix = backVowels.includes(lastVowel) ? 'mak' : 'mek';
      infinitive = infinitive + suffix;
    }
  }
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
      case 'imperative':
        tenses[label] = conjugateImperative(rawStem, infinitive);
        break;
      case 'necessitative':
        tenses[label] = conjugateNecessitative(rawStem, infinitive);
        break;
      case 'temporal_converb':
        tenses[label] = conjugateTemporalConverb(rawStem, infinitive);
        break;
      case 'manner_converb':
        tenses[label] = conjugateMannerConverb(rawStem, infinitive);
        break;
      case 'present_cont_neg':
        tenses[label] = conjugatePresentContNeg(rawStem, infinitive);
        break;
      case 'aorist_neg':
        tenses[label] = conjugateAoristNeg(rawStem, infinitive);
        break;
      case 'past_neg':
        tenses[label] = conjugatePastNeg(rawStem, infinitive);
        break;
      case 'reported_neg':
        tenses[label] = conjugateReportedNeg(rawStem, infinitive);
        break;
      case 'future_neg':
        tenses[label] = conjugateFutureNeg(rawStem, infinitive);
        break;
      case 'conditional_neg':
        tenses[label] = conjugateConditionalNeg(rawStem, infinitive);
        break;
      case 'necessitative_neg':
        tenses[label] = conjugateNecessitativeNeg(rawStem, infinitive);
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
// Order matters: longer/more-specific suffixes BEFORE shorter ones so
// "okumuyorsun" matches "muyorsun" (negative present cont) before "yorsun".
const TENSE_SUFFIXES = [
  // Negative present continuous (longer prefix forms first)
  'mıyorum', 'mıyorsun', 'mıyor', 'mıyoruz', 'mıyorsunuz', 'mıyorlar',
  'miyorum', 'miyorsun', 'miyor', 'miyoruz', 'miyorsunuz', 'miyorlar',
  'muyorum', 'muyorsun', 'muyor', 'muyoruz', 'muyorsunuz', 'muyorlar',
  'müyorum', 'müyorsun', 'müyor', 'müyoruz', 'müyorsunuz', 'müyorlar',
  // Negative future
  'mayacağım', 'mayacaksın', 'mayacak', 'mayacağız', 'mayacaksınız', 'mayacaklar',
  'meyeceğim', 'meyeceksin', 'meyecek', 'meyeceğiz', 'meyeceksiniz', 'meyecekler',
  // Negative reported
  'mamışım', 'mamışsın', 'mamış', 'mamışız', 'mamışsınız', 'mamışlar',
  'memişim', 'memişsin', 'memiş', 'memişiz', 'memişsiniz', 'memişler',
  // Negative past
  'madım', 'madın', 'madı', 'madık', 'madınız', 'madılar',
  'medim', 'medin', 'medi', 'medik', 'mediniz', 'mediler',
  // Negative aorist (irregular: no -r)
  'mam', 'men', 'mez', 'meyiz', 'mezsin', 'mezler', 'mezsiniz',
  'maz', 'mayız', 'mazsın', 'mazlar', 'mazsınız',
  // Negative conditional
  'masam', 'masan', 'masa', 'masak', 'masanız', 'masalar',
  'mesem', 'mesen', 'mese', 'mesek', 'meseniz', 'meseler',
  // Necessitative (positive + negative)
  'malıyım', 'malısın', 'malı', 'malıyız', 'malısınız', 'malılar',
  'meliyim', 'melisin', 'meli', 'meliyiz', 'melisiniz', 'meliler',
  'mamalıyım', 'mamalısın', 'mamalı', 'mamalıyız', 'mamalısınız', 'mamalılar',
  'memeliyim', 'memelisin', 'memeli', 'memeliyiz', 'memelisiniz', 'memeliler',
  // Imperative
  'sinler', 'sınlar', 'sunlar', 'sünler',
  'sin', 'sın', 'sun', 'sün',
  'iniz', 'ınız', 'unuz', 'ünüz',
  'elim', 'alım',
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
