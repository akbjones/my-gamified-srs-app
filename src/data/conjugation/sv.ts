/**
 * Swedish conjugation engine
 * --------------------------
 * Modern Swedish has NO person inflection — the same verb form is used
 * for all persons (jag, du, han/hon, vi, ni, de).
 *
 * Four conjugation groups:
 *   Group 1  (-ar verbs):    tala → talar, talade, talat
 *   Group 2a (-er / -de):    ringa → ringer, ringde, ringt
 *   Group 2b (-er / -te):    köpa → köper, köpte, köpt
 *   Group 3  (short vowel):  bo → bor, bodde, bott
 *   Group 4  (strong/irr):   gå → går, gick, gått
 *
 * Tenses produced:
 *   present     – Presens
 *   preterite   – Preteritum (simple past)
 *   imperfect   – Perfekt (har/hade + supinum)
 *   future      – Futurum (ska + infinitive)
 *   conditional – Konditionalis (skulle + infinitive)
 *   subjunctive – Imperativ (practical substitute for subjunctive)
 */

import type { ConjugationTable } from '../../types';

// ─── Types ─────────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string];

/** Fill all 6 person slots with the same form (Swedish has no person inflection) */
function allPersons(form: string): Forms {
  return [form, form, form, form, form, form];
}

// ─── Irregular verb data ───────────────────────────────────────
interface IrregularData {
  present: string;
  past: string;
  supine: string;
  imperative?: string;
  auxiliary?: 'har' | 'har/är' | 'är';
}

const IRREGULARS: Record<string, IrregularData> = {
  // ── Essential / high-frequency ──
  'vara':    { present: 'är',      past: 'var',      supine: 'varit',     imperative: 'var',     auxiliary: 'har' },
  'ha':      { present: 'har',     past: 'hade',     supine: 'haft',      imperative: 'ha',      auxiliary: 'har' },
  'bli':     { present: 'blir',    past: 'blev',     supine: 'blivit',    imperative: 'bli',     auxiliary: 'har' },
  'göra':    { present: 'gör',     past: 'gjorde',   supine: 'gjort',     imperative: 'gör',     auxiliary: 'har' },
  'gå':      { present: 'går',     past: 'gick',     supine: 'gått',      imperative: 'gå',      auxiliary: 'har' },
  'ge':      { present: 'ger',     past: 'gav',      supine: 'gett',      imperative: 'ge',      auxiliary: 'har' },
  'komma':   { present: 'kommer',  past: 'kom',      supine: 'kommit',    imperative: 'kom',     auxiliary: 'har' },
  'kunna':   { present: 'kan',     past: 'kunde',    supine: 'kunnat',    imperative: '-',       auxiliary: 'har' },
  'ska':     { present: 'ska',     past: 'skulle',   supine: '-',         imperative: '-',       auxiliary: 'har' },
  'vilja':   { present: 'vill',    past: 'ville',    supine: 'velat',     imperative: '-',       auxiliary: 'har' },
  'veta':    { present: 'vet',     past: 'visste',   supine: 'vetat',     imperative: '-',       auxiliary: 'har' },
  'se':      { present: 'ser',     past: 'såg',      supine: 'sett',      imperative: 'se',      auxiliary: 'har' },
  'säga':    { present: 'säger',   past: 'sa',       supine: 'sagt',      imperative: 'säg',     auxiliary: 'har' },
  'ta':      { present: 'tar',     past: 'tog',      supine: 'tagit',     imperative: 'ta',      auxiliary: 'har' },
  'stå':     { present: 'står',    past: 'stod',     supine: 'stått',     imperative: 'stå',     auxiliary: 'har' },
  'ligga':   { present: 'ligger',  past: 'låg',      supine: 'legat',     imperative: 'ligg',    auxiliary: 'har' },
  'sitta':   { present: 'sitter',  past: 'satt',     supine: 'suttit',    imperative: 'sitt',    auxiliary: 'har' },
  'finnas':  { present: 'finns',   past: 'fanns',    supine: 'funnits',   imperative: '-',       auxiliary: 'har' },
  'få':      { present: 'får',     past: 'fick',     supine: 'fått',      imperative: 'få',      auxiliary: 'har' },
  'måste':   { present: 'måste',   past: 'måste',    supine: '-',         imperative: '-',       auxiliary: 'har' },
  'böra':    { present: 'bör',     past: 'borde',    supine: 'bort',      imperative: '-',       auxiliary: 'har' },

  // ── Movement & position ──
  'fara':    { present: 'far',     past: 'for',      supine: 'farit',     imperative: 'far',     auxiliary: 'har' },
  'springa': { present: 'springer', past: 'sprang',  supine: 'sprungit',  imperative: 'spring',  auxiliary: 'har' },
  'falla':   { present: 'faller',  past: 'föll',     supine: 'fallit',    imperative: 'fall',    auxiliary: 'har' },
  'flyga':   { present: 'flyger',  past: 'flög',     supine: 'flugit',    imperative: 'flyg',    auxiliary: 'har' },
  'dra':     { present: 'drar',    past: 'drog',     supine: 'dragit',    imperative: 'dra',     auxiliary: 'har' },
  'lägga':   { present: 'lägger',  past: 'la',       supine: 'lagt',      imperative: 'lägg',    auxiliary: 'har' },
  'sätta':   { present: 'sätter',  past: 'satte',    supine: 'satt',      imperative: 'sätt',    auxiliary: 'har' },
  'ställa':  { present: 'ställer', past: 'ställde',  supine: 'ställt',    imperative: 'ställ',   auxiliary: 'har' },
  'bära':    { present: 'bär',     past: 'bar',      supine: 'burit',     imperative: 'bär',     auxiliary: 'har' },
  'hålla':   { present: 'håller',  past: 'höll',     supine: 'hållit',    imperative: 'håll',    auxiliary: 'har' },

  // ── Communication & thought ──
  'skriva':  { present: 'skriver', past: 'skrev',    supine: 'skrivit',   imperative: 'skriv',   auxiliary: 'har' },
  'läsa':    { present: 'läser',   past: 'läste',    supine: 'läst',      imperative: 'läs',     auxiliary: 'har' },
  'förstå':  { present: 'förstår', past: 'förstod',  supine: 'förstått',  imperative: 'förstå',  auxiliary: 'har' },
  'tro':     { present: 'tror',    past: 'trodde',   supine: 'trott',     imperative: 'tro',     auxiliary: 'har' },
  'tänka':   { present: 'tänker',  past: 'tänkte',   supine: 'tänkt',     imperative: 'tänk',    auxiliary: 'har' },
  'heta':    { present: 'heter',   past: 'hette',    supine: 'hetat',     imperative: '-',       auxiliary: 'har' },
  'le':      { present: 'ler',     past: 'log',      supine: 'lett',      imperative: 'le',      auxiliary: 'har' },
  'sjunga':  { present: 'sjunger', past: 'sjöng',    supine: 'sjungit',   imperative: 'sjung',   auxiliary: 'har' },
  'slå':     { present: 'slår',    past: 'slog',     supine: 'slagit',    imperative: 'slå',     auxiliary: 'har' },

  // ── Daily life ──
  'äta':     { present: 'äter',    past: 'åt',       supine: 'ätit',      imperative: 'ät',      auxiliary: 'har' },
  'dricka':  { present: 'dricker', past: 'drack',    supine: 'druckit',   imperative: 'drick',   auxiliary: 'har' },
  'sova':    { present: 'sover',   past: 'sov',      supine: 'sovit',     imperative: 'sov',     auxiliary: 'har' },
  'dö':      { present: 'dör',     past: 'dog',      supine: 'dött',      imperative: '-',       auxiliary: 'har' },
  'brinna':  { present: 'brinner', past: 'brann',    supine: 'brunnit',   imperative: 'brinn',   auxiliary: 'har' },
  'frysa':   { present: 'fryser',  past: 'frös',     supine: 'frusit',    imperative: 'frys',    auxiliary: 'har' },
  'bita':    { present: 'biter',   past: 'bet',      supine: 'bitit',     imperative: 'bit',     auxiliary: 'har' },
  'bryta':   { present: 'bryter',  past: 'bröt',     supine: 'brutit',    imperative: 'bryt',    auxiliary: 'har' },
  'gripa':   { present: 'griper',  past: 'grep',     supine: 'gripit',    imperative: 'grip',    auxiliary: 'har' },
  'njuta':   { present: 'njuter',  past: 'njöt',     supine: 'njutit',    imperative: 'njut',    auxiliary: 'har' },
  'rida':    { present: 'rider',   past: 'red',      supine: 'ridit',     imperative: 'rid',     auxiliary: 'har' },
  'skjuta':  { present: 'skjuter', past: 'sköt',     supine: 'skjutit',   imperative: 'skjut',   auxiliary: 'har' },
  'vinna':   { present: 'vinner',  past: 'vann',     supine: 'vunnit',    imperative: 'vinn',    auxiliary: 'har' },
  'försvinna': { present: 'försvinner', past: 'försvann', supine: 'försvunnit', imperative: '-', auxiliary: 'har' },
  'hinna':   { present: 'hinner',  past: 'hann',     supine: 'hunnit',    imperative: 'hinn',    auxiliary: 'har' },
  'bjuda':   { present: 'bjuder',  past: 'bjöd',     supine: 'bjudit',    imperative: 'bjud',    auxiliary: 'har' },
  'ljuga':   { present: 'ljuger',  past: 'ljög',     supine: 'ljugit',    imperative: 'ljug',    auxiliary: 'har' },
  'välja':   { present: 'väljer',  past: 'valde',    supine: 'valt',      imperative: 'välj',    auxiliary: 'har' },
  'binda':   { present: 'binder',  past: 'band',     supine: 'bundit',    imperative: 'bind',    auxiliary: 'har' },
  'sticka':  { present: 'sticker', past: 'stack',    supine: 'stuckit',   imperative: 'stick',   auxiliary: 'har' },
  'svara':   { present: 'svarar',  past: 'svarade',  supine: 'svarat',    imperative: 'svara',   auxiliary: 'har' },
};

// ─── Group 2b: verbs whose stem ends in voiceless consonant → -te/-t ───
const VOICELESS = new Set(['k', 'p', 't', 's', 'x']);

// ─── Known Group 2 verbs (present: -er, not -ar) ─────────────────
// In Swedish, the Group 1/2 distinction for -a verbs is largely lexical.
// We use an explicit set rather than heuristics (too many exceptions).
const GROUP_2_VERBS = new Set([
  // Group 2a — stem ends in voiced consonant (-er, -de, -t)
  'ringa', 'hänga', 'svänga', 'stänga', 'tvinga', 'bringa', 'tränga',
  'bygga', 'lägga', 'smygga', 'snygga', 'vagga', 'rugga',
  'glömma', 'bestämma', 'stämma', 'skämma', 'drömma', 'gömma', 'strömma',
  'känna', 'bränna', 'spänna', 'hänna', 'nämna',
  'ställa', 'fylla', 'hälla', 'fälla', 'spilla', 'välla', 'meddela',
  'beställa', 'framställa', 'förställa', 'föreställa', 'avställa',
  'följa', 'bölja', 'dölja', 'hölja',
  'leva', 'väva',
  'ändra', 'undra', 'hindra', 'fördra',
  'vänja', 'svärja',
  // Group 2b — stem ends in voiceless consonant (-er, -te, -t)
  'köpa', 'tycka', 'trycka', 'smycka', 'rycka', 'slicka', 'blicka',
  'hjälpa', 'skölpa',
  'söka', 'besöka', 'undersöka',
  'möta', 'bemöta',
  'lösa', 'blåsa', 'krossa', 'pressa', 'missa',
  'resa', 'resa',
  'steka', 'smeka', 'beka',
  'märka', 'verka', 'stärka', 'styrka',
  'behöva',
  'använda', 'vända', 'sända', 'tända', 'hända', 'lända',
  'mäta', 'väta', 'böta',
  'lyfta', 'skifta', 'gifta',
]);

// ─── Helper: detect conjugation group ───────────────────────────

type ConjGroup = '1' | '2a' | '2b' | '3' | '4';

function detectGroup(infinitive: string): ConjGroup {
  // Group 3: short verbs ending in stressed vowel (bo, tro, sy, nå, etc.)
  if (/^[a-zåäö]{1,3}$/.test(infinitive) && /[aeiouåäö]$/.test(infinitive)) {
    return '3';
  }

  if (infinitive.endsWith('a')) {
    // Check known Group 2 list — the only reliable way to distinguish 1 vs 2
    if (GROUP_2_VERBS.has(infinitive)) {
      const stem = infinitive.slice(0, -1);
      const lastChar = stem[stem.length - 1];
      // Stems ending in -d: use 2a (använde, not användde)
      // Stems ending in voiceless: use 2b (-te/-t)
      // Otherwise: 2a (-de/-t)
      return VOICELESS.has(lastChar) ? '2b' : '2a';
    }

    // Default for -a verbs: Group 1 (safest fallback)
    return '1';
  }

  // Remaining: non -a ending verbs not in irregulars
  return '2a';
}

function getStem(infinitive: string, group: ConjGroup): string {
  switch (group) {
    case '1':
      // tala → tal, arbeta → arbet
      return infinitive.slice(0, -1);
    case '2a':
    case '2b':
      // ringa → ring, köpa → köp
      return infinitive.endsWith('a') ? infinitive.slice(0, -1) : infinitive;
    case '3':
      // bo → bo, tro → tro (stem = infinitive for short verbs)
      return infinitive;
    case '4':
      return infinitive.endsWith('a') ? infinitive.slice(0, -1) : infinitive;
    default:
      return infinitive;
  }
}

function isGroup2b(stem: string): boolean {
  // Stem ends in voiceless consonant → Group 2b (-te/-t)
  const lastChar = stem[stem.length - 1];
  return VOICELESS.has(lastChar);
}

// ─── Regular conjugation ───────────────────────────────────────

/**
 * Simplify stem for past/supine suffixes.
 * Swedish rules:
 *   -mm → -m  before -de/-t  (glömma → glömde, glömt)
 *   -nn → -n  before -de/-t  (känna → kände, känt)
 *   -nd → -n  before -d/-t   (använda → använde, använt)
 *   -dt → absorbed            (möta → mötte)
 */
function pastStem(stem: string): string {
  // Double m → single m: glömm → glöm
  if (stem.endsWith('mm')) return stem.slice(0, -1);
  // Double n → single n: känn → kän
  if (stem.endsWith('nn')) return stem.slice(0, -1);
  return stem;
}

function conjugateRegular(infinitive: string): {
  present: string;
  past: string;
  supine: string;
  imperative: string;
} {
  const group = detectGroup(infinitive);
  const stem = getStem(infinitive, group);

  switch (group) {
    case '1':
      // tala → talar, talade, talat
      return {
        present: stem + 'ar',
        past: stem + 'ade',
        supine: stem + 'at',
        imperative: stem + 'a',
      };

    case '2a': {
      // ringa → ringer, ringde, ringt
      const ps = pastStem(stem);
      // Stem ending in -d: använde (stem+e), not användde
      if (stem.endsWith('d')) {
        return {
          present: stem + 'er',
          past: stem + 'e',
          supine: ps.slice(0, -1) + 't',  // använd → använt (drop d, add t)
          imperative: stem,
        };
      }
      return {
        present: stem + 'er',
        past: ps + 'de',
        supine: ps + 't',
        imperative: stem,
      };
    }

    case '2b': {
      // köpa → köper, köpte, köpt
      const ps = pastStem(stem);
      // Stem ending in -t: möta → mötte (stem+te absorbs)
      if (stem.endsWith('t')) {
        return {
          present: stem + 'er',
          past: stem + 'te',
          supine: stem + 't',
          imperative: stem,
        };
      }
      return {
        present: stem + 'er',
        past: ps + 'te',
        supine: ps + 't',
        imperative: stem,
      };
    }

    case '3':
      // bo → bor, bodde, bott
      return {
        present: stem + 'r',
        past: stem + 'dde',
        supine: stem + 'tt',
        imperative: stem,
      };

    default:
      return {
        present: stem + 'er',
        past: stem + 'de',
        supine: stem + 't',
        imperative: stem,
      };
  }
}

// ─── Build full conjugation table ──────────────────────────────

function buildTable(
  infinitive: string,
  present: string,
  past: string,
  supine: string,
  imperative: string,
  auxiliary: string = 'har',
): ConjugationTable {
  const isReflexive = infinitive.endsWith('s') && infinitive !== 'läsa' && infinitive !== 'frysa';
  // But more accurately: check if it's a deponent/reflexive -s verb
  // For now, simple check: finnas, hoppas, etc.

  const tenses: Record<string, string[]> = {
    present: allPersons(present),
    preterite: allPersons(past),
    imperfect: allPersons(`${auxiliary} ${supine}`),
    future: allPersons(`ska ${infinitive}`),
    conditional: allPersons(`skulle ${infinitive}`),
    subjunctive: allPersons(imperative === '-' ? '-' : imperative),
  };

  return {
    infinitive,
    isReflexive: isReflexive && !infinitive.startsWith('finnas'),
    tenses,
  };
}

// ─── Main export ───────────────────────────────────────────────

export function conjugate(infinitive: string): ConjugationTable | null {
  if (!infinitive || infinitive.length < 2) return null;

  const inf = infinitive.toLowerCase().trim();

  // Check irregulars first
  const irr = IRREGULARS[inf];
  if (irr) {
    return buildTable(
      inf,
      irr.present,
      irr.past,
      irr.supine,
      irr.imperative || '-',
      irr.auxiliary || 'har',
    );
  }

  // Detect group and check if it looks like a valid Swedish verb
  // Swedish infinitives typically end in -a, or are short vowel verbs
  if (!inf.endsWith('a') && !inf.endsWith('s')) {
    // Short verbs (bo, tro, sy, nå) or doesn't look like a verb
    if (!/^[a-zåäö]{1,4}$/.test(inf) || !/[aeiouåäö]$/.test(inf)) {
      return null;
    }
  }

  // Handle -s verbs (passive/deponent): hoppas, finnas, etc.
  if (inf.endsWith('as') && inf.length > 3) {
    const base = inf.slice(0, -1); // hoppas → hoppa
    const group = detectGroup(base);
    const stem = getStem(base, group);

    // -s verbs follow the same pattern but add -s
    let present: string, past: string, supine: string;
    if (group === '1') {
      present = stem + 'as';
      past = stem + 'ades';
      supine = stem + 'ats';
    } else {
      present = stem + 'es' in IRREGULARS ? IRREGULARS[inf].present : stem + 's';
      past = stem + 'des';
      supine = stem + 'ts';
    }

    return buildTable(inf, present, past, supine, '-', 'har');
  }

  // Regular conjugation — detectGroup now properly identifies Group 2 verbs
  const group = detectGroup(inf);
  const forms = conjugateRegular(inf);
  return buildTable(inf, forms.present, forms.past, forms.supine, forms.imperative, 'har');
}
