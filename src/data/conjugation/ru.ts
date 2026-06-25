/**
 * Russian verb conjugation engine
 * Handles 1st and 2nd conjugation verbs, reflexive verbs, and major irregulars.
 *
 * Person order: я (I), ты (you), он/она (he/she), мы (we), вы (you-formal/pl), они (they)
 *
 * Russian verbs have two aspects: imperfective (ongoing) and perfective (completed).
 * This engine conjugates a single verb form – the aspect is inherent to the infinitive.
 *
 * Tenses:
 *   present      – Настоящее время (imperfective only; perfective uses future forms)
 *   past         – Прошедшее время (stem + л/ла/ло/ли)
 *   future       – Будущее время (буду + inf for impf; conjugated form for perf)
 *   imperative   – Повелительное (stem + й/и/ите)
 *   conditional  – Сослагательное (past + бы)
 *   short_part   – Краткое причастие (short participle forms)
 */
import type { ConjugationTable } from '../../types';

type Forms = [string, string, string, string, string, string];
type TenseKey = 'present' | 'past' | 'future' | 'imperative' | 'conditional';

const TENSES: TenseKey[] = ['present', 'past', 'future', 'imperative', 'conditional'];

const TENSE_LABELS: Record<TenseKey, string> = {
  present: 'Настоящее (Present)',
  past: 'Прошедшее (Past)',
  future: 'Будущее (Future)',
  imperative: 'Повелительное (Imperative)',
  conditional: 'Сослагательное (Conditional)',
};

// ── Verb classification ─────────────────────────────────────
// 1st conjugation: -ать, -ять, -еть, -уть, -оть, -ыть
// 2nd conjugation: -ить (+ some -еть, -ать exceptions)

function isSecondConjugation(infinitive: string): boolean {
  // 2nd conjugation: most -ить verbs
  if (infinitive.endsWith('ить') || infinitive.endsWith('иться')) return true;
  // Some -еть and -ать verbs are 2nd conjugation (exceptions)
  const secondConjExceptions = new Set([
    'смотреть', 'видеть', 'ненавидеть', 'зависеть', 'терпеть',
    'вертеть', 'обидеть', 'сидеть', 'лететь', 'гореть',
    'слышать', 'дышать', 'держать', 'гнать',
  ]);
  return secondConjExceptions.has(infinitive.replace('ся', ''));
}

function getStem(infinitive: string): string {
  let inf = infinitive;
  // Remove reflexive suffix
  if (inf.endsWith('ться')) return inf.slice(0, -4);
  if (inf.endsWith('тись')) return inf.slice(0, -4);
  if (inf.endsWith('ть')) return inf.slice(0, -2);
  if (inf.endsWith('ти')) return inf.slice(0, -2);
  if (inf.endsWith('чь')) return inf.slice(0, -2);
  return inf;
}

function isReflexive(infinitive: string): boolean {
  return infinitive.endsWith('ся') || infinitive.endsWith('сь');
}

function reflexiveSuffix(precedingVowel: boolean): string {
  return precedingVowel ? 'сь' : 'ся';
}

// ── Irregular verb data ─────────────────────────────────────
interface IrregularData {
  present?: Forms;
  past?: Forms;
  imperative?: [string, string]; // ты, вы forms
  isPerfective?: boolean;
}

const IRREGULARS: Record<string, IrregularData> = {
  'быть': {
    present: ['–', '–', 'есть', '–', '–', '–'],  // rarely conjugated in present
    past: ['был', 'был/была', 'был/была', 'были', 'были', 'были'],
    isPerfective: false,
  },
  'есть': {  // to eat
    present: ['ем', 'ешь', 'ест', 'едим', 'едите', 'едят'],
    past: ['ел', 'ел/ела', 'ел/ела', 'ели', 'ели', 'ели'],
    imperative: ['ешь', 'ешьте'],
  },
  'дать': {
    present: ['дам', 'дашь', 'даст', 'дадим', 'дадите', 'дадут'],
    past: ['дал', 'дал/дала', 'дал/дала', 'дали', 'дали', 'дали'],
    imperative: ['дай', 'дайте'],
    isPerfective: true,
  },
  'хотеть': {
    present: ['хочу', 'хочешь', 'хочет', 'хотим', 'хотите', 'хотят'],
    imperative: ['хоти', 'хотите'],
  },
  'мочь': {
    present: ['могу', 'можешь', 'может', 'можем', 'можете', 'могут'],
    past: ['мог', 'мог/могла', 'мог/могла', 'могли', 'могли', 'могли'],
  },
  'идти': {
    present: ['иду', 'идёшь', 'идёт', 'идём', 'идёте', 'идут'],
    past: ['шёл', 'шёл/шла', 'шёл/шла', 'шли', 'шли', 'шли'],
    imperative: ['иди', 'идите'],
  },
  'ехать': {
    present: ['еду', 'едешь', 'едет', 'едем', 'едете', 'едут'],
    imperative: ['поезжай', 'поезжайте'],
  },
  'бежать': {
    present: ['бегу', 'бежишь', 'бежит', 'бежим', 'бежите', 'бегут'],
    imperative: ['беги', 'бегите'],
  },
  'брать': {
    present: ['беру', 'берёшь', 'берёт', 'берём', 'берёте', 'берут'],
    imperative: ['бери', 'берите'],
  },
  'жить': {
    present: ['живу', 'живёшь', 'живёт', 'живём', 'живёте', 'живут'],
    imperative: ['живи', 'живите'],
  },
  'пить': {
    present: ['пью', 'пьёшь', 'пьёт', 'пьём', 'пьёте', 'пьют'],
    imperative: ['пей', 'пейте'],
  },
  'писать': {
    present: ['пишу', 'пишешь', 'пишет', 'пишем', 'пишете', 'пишут'],
    imperative: ['пиши', 'пишите'],
  },
  'сказать': {
    present: ['скажу', 'скажешь', 'скажет', 'скажем', 'скажете', 'скажут'],
    imperative: ['скажи', 'скажите'],
    isPerfective: true,
  },
  'взять': {
    present: ['возьму', 'возьмёшь', 'возьмёт', 'возьмём', 'возьмёте', 'возьмут'],
    imperative: ['возьми', 'возьмите'],
    isPerfective: true,
  },
  'стать': {
    present: ['стану', 'станешь', 'станет', 'станем', 'станете', 'станут'],
    imperative: ['стань', 'станьте'],
    isPerfective: true,
  },
  'начать': {
    present: ['начну', 'начнёшь', 'начнёт', 'начнём', 'начнёте', 'начнут'],
    past:    ['начал', 'начал/начала', 'начал/начала', 'начали', 'начали', 'начали'],
    imperative: ['начни', 'начните'],
    isPerfective: true,
  },
  // Prefixed motion verbs that don't fall cleanly out of идти's stem (the
  // prefix triggers stem reshape, "по" + "идти" → "пойти" not "поидти").
  // Add the most-common ones directly rather than try to model the morphology.
  'пойти': {
    present: ['пойду', 'пойдёшь', 'пойдёт', 'пойдём', 'пойдёте', 'пойдут'],
    past:    ['пошёл', 'пошёл/пошла', 'пошёл/пошла', 'пошли', 'пошли', 'пошли'],
    imperative: ['пойди', 'пойдите'],
    isPerfective: true,
  },
  'прийти': {
    present: ['приду', 'придёшь', 'придёт', 'придём', 'придёте', 'придут'],
    past:    ['пришёл', 'пришёл/пришла', 'пришёл/пришла', 'пришли', 'пришли', 'пришли'],
    imperative: ['приди', 'придите'],
    isPerfective: true,
  },
  'уйти': {
    present: ['уйду', 'уйдёшь', 'уйдёт', 'уйдём', 'уйдёте', 'уйдут'],
    past:    ['ушёл', 'ушёл/ушла', 'ушёл/ушла', 'ушли', 'ушли', 'ушли'],
    imperative: ['уйди', 'уйдите'],
    isPerfective: true,
  },
  'выйти': {
    present: ['выйду', 'выйдешь', 'выйдет', 'выйдем', 'выйдете', 'выйдут'],
    past:    ['вышел', 'вышел/вышла', 'вышел/вышла', 'вышли', 'вышли', 'вышли'],
    imperative: ['выйди', 'выйдите'],
    isPerfective: true,
  },
  'войти': {
    present: ['войду', 'войдёшь', 'войдёт', 'войдём', 'войдёте', 'войдут'],
    past:    ['вошёл', 'вошёл/вошла', 'вошёл/вошла', 'вошли', 'вошли', 'вошли'],
    imperative: ['войди', 'войдите'],
    isPerfective: true,
  },
  'перейти': {
    present: ['перейду', 'перейдёшь', 'перейдёт', 'перейдём', 'перейдёте', 'перейдут'],
    past:    ['перешёл', 'перешёл/перешла', 'перешёл/перешла', 'перешли', 'перешли', 'перешли'],
    imperative: ['перейди', 'перейдите'],
    isPerfective: true,
  },
};

// Common Russian verb prefixes that derive perfectives from imperfective
// roots. Sorted longest-first so multi-character prefixes match before their
// shorter substrings (про- before при- before по-, etc.). Includes devoiced
// variants (рас-, вос-, ис-, нис-) that appear before voiceless consonants.
const RU_PERFECTIVE_PREFIXES = [
  'пере', 'пред',
  'про', 'при', 'под', 'воз', 'раз', 'рас', 'низ', 'нис', 'над', 'вос', 'бес', 'без',
  'вы', 'на', 'по', 'за', 'до', 'об', 'из', 'ис',
  'у', 'с', 'в',
];

// When a verb isn't directly in IRREGULARS (e.g. написать), try stripping
// each prefix and see if the remainder IS an irregular root (писать). If so,
// we can reuse the root's stem alternations with the prefix re-attached:
//   написать → strip "на" → "писать" → IRREGULARS["писать"] hit
//   forms become "на" + ["пишу", "пишешь", ...] = ["напишу", "напишешь", ...]
//
// Same trick rescues подписать, переписать, исписать, попросить (if просить
// is added later), полюбить, увидеть, услышать, поехать, etc.
function findPrefixedIrregular(infinitive: string): { prefix: string; root: string; data: IrregularData } | null {
  for (const p of RU_PERFECTIVE_PREFIXES) {
    if (!infinitive.startsWith(p)) continue;
    const root = infinitive.slice(p.length);
    const data = IRREGULARS[root];
    if (data) return { prefix: p, root, data };
  }
  return null;
}

// Apply a prefix to each form in an Irregular forms array. Slash-separated
// gender variants (e.g. "был/была") get each part prefixed independently.
function prefixForms(forms: string[], prefix: string): string[] {
  return forms.map(f => {
    if (f === '–') return f;
    if (f.includes('/')) return f.split('/').map(p => prefix + p).join('/');
    return prefix + f;
  });
}

// ── Regular conjugation ─────────────────────────────────────
function conjugatePresent(stem: string, infinitive: string): Forms {
  const refl = isReflexive(infinitive);
  const baseInf = infinitive.replace(/ся$/, '').replace(/сь$/, '');
  const is2nd = isSecondConjugation(baseInf);

  let forms: string[];

  if (is2nd) {
    // 2nd conjugation: -у/-ю, -ишь, -ит, -им, -ите, -ат/-ят
    const s = stem.endsWith('и') ? stem.slice(0, -1) : stem;
    // Consonant mutation in 1st person for some verbs
    forms = [
      `${s}ю`, `${s}ишь`, `${s}ит`,
      `${s}им`, `${s}ите`, `${s}ят`,
    ];
  } else {
    // 1st conjugation: -у/-ю, -ешь, -ет, -ем, -ете, -ут/-ют
    // Default keeps the stem-final thematic vowel (читать → читаю/читаешь;
    // встречаться → встречаюсь/встречаешься). The writing-class with
    // consonant mutation (писать → пишу; казать → кажу) drops the 'а' and
    // mutates — that minority class needs an explicit IRREGULARS entry.
    forms = [
      `${stem}ю`, `${stem}ешь`, `${stem}ет`,
      `${stem}ем`, `${stem}ете`, `${stem}ют`,
    ];
  }

  if (refl) {
    forms = forms.map(f => {
      const endsV = 'аеёиоуыэюя'.includes(f.slice(-1));
      return f + (endsV ? 'сь' : 'ся');
    });
  }

  return forms as Forms;
}

function conjugatePast(stem: string, infinitive: string): Forms {
  const refl = isReflexive(infinitive);
  const rs = (v: boolean) => refl ? (v ? 'сь' : 'ся') : '';

  // Past tense: stem + л, stem + ла, stem + ло, stem + ли
  const m = `${stem}л${rs(false)}`;
  const f = `${stem}ла${rs(true)}`;
  const mf = `${m}/${f}`;
  const pl = `${stem}ли${rs(true)}`;

  return [m, mf, mf, pl, pl, pl];
}

function conjugateFuture(stem: string, infinitive: string): Forms {
  const irr = IRREGULARS[infinitive.replace(/ся$/, '').replace(/сь$/, '')];
  const refl = isReflexive(infinitive);
  const rs = (v: boolean) => refl ? (v ? 'сь' : 'ся') : '';

  if (irr?.isPerfective) {
    // Perfective: use present tense forms (they express future meaning)
    return irr.present ? irr.present.map((f, i) => f + rs(false)) as Forms : conjugatePresent(stem, infinitive);
  }

  // Imperfective: буду + infinitive
  const inf = infinitive;
  return [
    `буду ${inf}`,
    `будешь ${inf}`,
    `будет ${inf}`,
    `будем ${inf}`,
    `будете ${inf}`,
    `будут ${inf}`,
  ];
}

function conjugateImperative(stem: string, infinitive: string): Forms {
  const refl = isReflexive(infinitive);
  const baseInf = infinitive.replace(/ся$/, '').replace(/сь$/, '');

  // Basic imperative: stem + й/и (ты), stem + йте/ите (вы)
  let tyForm: string;
  let vyForm: string;

  // 2nd-conj -ить verbs: strip the thematic 'и' before adding the suffix to
  // avoid "позволии"/"позволиите". Produce BOTH the -и/-ите form AND the
  // -ь/-ьте soft-sign variant so the matcher catches either (позволь,
  // позвольте vs. позвонь, позвоните — the stress-driven choice depends on
  // the verb, but having both as alternates is safe for matching).
  if (baseInf.endsWith('ить')) {
    const root = stem.endsWith('и') ? stem.slice(0, -1) : stem;
    tyForm = `${root}и/${root}ь`;
    vyForm = `${root}ите/${root}ьте`;
  } else if (stem.endsWith('а') || stem.endsWith('я') || stem.endsWith('е')) {
    tyForm = stem + 'й';
    vyForm = stem + 'йте';
  } else {
    tyForm = stem + 'и';
    vyForm = stem + 'ите';
  }

  if (refl) {
    // For slash-joined alternates apply -сь to each branch.
    tyForm = tyForm.includes('/') ? tyForm.split('/').map(p => p + 'сь').join('/') : tyForm + 'сь';
    vyForm = vyForm.includes('/') ? vyForm.split('/').map(p => p + 'сь').join('/') : vyForm + 'сь';
  }

  // Imperative doesn't have all 6 person forms, but we fill for consistency
  return [
    '–', tyForm, '–',
    `давайте ${infinitive}`, vyForm, '–',
  ];
}

function conjugateConditional(stem: string, infinitive: string): Forms {
  const past = conjugatePast(stem, infinitive);
  return past.map(f => f === '–' ? '–' : `${f} бы`) as Forms;
}

// ── Main conjugation function ───────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  if (!infinitive.endsWith('ть') && !infinitive.endsWith('ти') &&
      !infinitive.endsWith('чь') && !infinitive.endsWith('ться') &&
      !infinitive.endsWith('тись')) return null;

  const stem = getStem(infinitive);
  const baseInf = infinitive.replace(/ся$/, '').replace(/сь$/, '');
  // Direct hit on IRREGULARS first (e.g. писать, сказать). Falls back to a
  // prefix-strip lookup so prefixed perfectives like написать, переписать,
  // подписать reuse писать's stem alternation without each needing its own
  // IRREGULARS entry.
  let irr = IRREGULARS[baseInf];
  let irrPrefix = '';
  if (!irr) {
    const m = findPrefixedIrregular(baseInf);
    if (m) {
      irr = {
        present: m.data.present ? prefixForms(m.data.present, m.prefix) as Forms : undefined,
        past: m.data.past ? prefixForms(m.data.past, m.prefix) as Forms : undefined,
        imperative: m.data.imperative
          ? prefixForms(m.data.imperative, m.prefix) as [string, string]
          : undefined,
        isPerfective: true,
      };
      irrPrefix = m.prefix;
    }
  }
  const refl = isReflexive(infinitive);

  const tenses: Record<string, string[]> = {};

  for (const tense of TENSES) {
    const label = TENSE_LABELS[tense];

    switch (tense) {
      case 'present':
        if (irr?.present) {
          let forms = [...irr.present];
          if (refl) {
            forms = forms.map(f => {
              if (f === '–') return f;
              const endsV = 'аеёиоуыэюя'.includes(f.slice(-1));
              return f + (endsV ? 'сь' : 'ся');
            });
          }
          tenses[label] = forms;
        } else {
          tenses[label] = conjugatePresent(stem, infinitive);
        }
        break;

      case 'past':
        if (irr?.past) {
          let forms = [...irr.past];
          if (refl) {
            forms = forms.map(f => {
              const parts = f.split('/');
              return parts.map(p => {
                const endsV = 'аеёиоуыэюя'.includes(p.slice(-1));
                return p + (endsV ? 'сь' : 'ся');
              }).join('/');
            });
          }
          tenses[label] = forms;
        } else {
          tenses[label] = conjugatePast(stem, infinitive);
        }
        break;

      case 'future':
        tenses[label] = conjugateFuture(stem, infinitive);
        break;

      case 'imperative':
        if (irr?.imperative) {
          const [ty, vy] = irr.imperative;
          const tyR = refl ? ty + 'ся' : ty;
          const vyR = refl ? vy + 'сь' : vy;
          tenses[label] = ['–', tyR, '–', `давайте ${infinitive}`, vyR, '–'];
        } else {
          tenses[label] = conjugateImperative(stem, infinitive);
        }
        break;

      case 'conditional':
        tenses[label] = conjugateConditional(stem, infinitive);
        break;
    }
  }

  return {
    infinitive,
    isReflexive: refl,
    tenses,
  };
}

// ── Reverse lookup ──────────────────────────────────────────
/** Return all plausible infinitive candidates for a conjugated form */
export function findInfinitiveCandidates(form: string): string[] {
  const candidates: string[] = [];

  // Direct infinitive
  if (form.endsWith('ть') || form.endsWith('ти') || form.endsWith('чь') ||
      form.endsWith('ться') || form.endsWith('тись')) {
    return [form];
  }

  // Check irregular forms
  for (const [inf, data] of Object.entries(IRREGULARS)) {
    if (data.present) {
      for (const f of data.present) {
        if (f === form || f.split('/').includes(form)) return [inf];
      }
    }
    if (data.past) {
      for (const f of data.past) {
        if (f === form || f.split('/').includes(form)) return [inf];
      }
    }
  }

  // Try stripping reflexive suffix
  let baseForm = form;
  let wasReflexive = false;
  if (form.endsWith('ся') || form.endsWith('сь')) {
    baseForm = form.endsWith('ся') ? form.slice(0, -2) : form.slice(0, -2);
    wasReflexive = true;
  }
  const reflSuffix = wasReflexive ? 'ся' : '';

  // Try past tense: strip л/ла/ло/ли
  for (const suffix of ['ли', 'ло', 'ла', 'л']) {
    if (baseForm.endsWith(suffix)) {
      const stem = baseForm.slice(0, -suffix.length);
      if (stem.length >= 2) {
        // Past tense stem = infinitive stem (usually). Try multiple endings:
        candidates.push(stem + 'ть' + reflSuffix);     // читал → читать
        candidates.push(stem + 'ать' + reflSuffix);     // писал → писать
        candidates.push(stem + 'ить' + reflSuffix);     // ходил → ходить
        candidates.push(stem + 'еть' + reflSuffix);     // сидел → сидеть
        candidates.push(stem + 'ять' + reflSuffix);     // стоял → стоять
        candidates.push(stem + 'ти' + reflSuffix);      // нёс → нести (rare)
        return candidates;
      }
    }
  }

  // Try present tense endings – generate ALL possible infinitives per stem
  // 1st conjugation endings (stem includes the thematic vowel)
  const firstConjEndings = ['ю', 'ешь', 'ет', 'ем', 'ете', 'ют'];
  // 2nd conjugation endings
  const secondConjEndings = ['у', 'ишь', 'ит', 'им', 'ите', 'ят', 'ат'];

  for (const ending of firstConjEndings) {
    if (baseForm.endsWith(ending)) {
      const stem = baseForm.slice(0, -ending.length);
      if (stem.length >= 2) {
        // For 1st conj, stem typically ends in the thematic vowel (а, я, е, о)
        // помогает → помога- → помогать (stem+ть), NOT помога+ать
        candidates.push(stem + 'ть' + reflSuffix);      // помога → помогать
        candidates.push(stem + 'ать' + reflSuffix);      // пис → писать (stem vowel dropped)
        candidates.push(stem + 'ять' + reflSuffix);      // гуля → гулять
        candidates.push(stem + 'еть' + reflSuffix);      // ум → уметь
        candidates.push(stem + 'овать' + reflSuffix);     // рису → рисовать (-ую/-уешь verbs)
        candidates.push(stem + 'евать' + reflSuffix);     // танц → танцевать
        break;
      }
    }
  }

  for (const ending of secondConjEndings) {
    if (baseForm.endsWith(ending)) {
      const stem = baseForm.slice(0, -ending.length);
      if (stem.length >= 2) {
        // For 2nd conj, stem doesn't include thematic vowel
        // говорит → говор- → говорить
        candidates.push(stem + 'ить' + reflSuffix);      // говор → говорить
        candidates.push(stem + 'ать' + reflSuffix);       // крич → кричать (mixed)
        candidates.push(stem + 'еть' + reflSuffix);       // вид → видеть
        candidates.push(stem + 'ять' + reflSuffix);       // сто → стоять
        candidates.push(stem + 'ть' + reflSuffix);        // fallback
        break;
      }
    }
  }

  // Also try -овать/-евать verbs where -ую/-уешь present forms drop -ова-
  // рисовать → рисую (stem рис + ую), not рисова + ю
  if (baseForm.endsWith('ую') || baseForm.endsWith('уешь') || baseForm.endsWith('ует') ||
      baseForm.endsWith('уем') || baseForm.endsWith('уете') || baseForm.endsWith('уют')) {
    const ovEndings = ['ую', 'уешь', 'ует', 'уем', 'уете', 'уют'];
    for (const e of ovEndings) {
      if (baseForm.endsWith(e)) {
        const stem = baseForm.slice(0, -e.length);
        if (stem.length >= 1) {
          candidates.push(stem + 'овать' + reflSuffix);
          candidates.push(stem + 'евать' + reflSuffix);
        }
        break;
      }
    }
  }

  return candidates;
}

/** Legacy single-return wrapper (returns first candidate) */
export function findInfinitive(form: string): string | null {
  const candidates = findInfinitiveCandidates(form);
  return candidates.length > 0 ? candidates[0] : null;
}

export default conjugate;
