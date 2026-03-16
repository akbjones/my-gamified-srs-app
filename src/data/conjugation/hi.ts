/**
 * Hindi verb conjugation engine
 * Handles regular and irregular Hindi verbs across major tenses.
 *
 * Person order: मैं (I), तू (you-informal), वह/यह (he/she/it),
 *               हम (we), तुम (you-familiar), आप/वे (you-formal/they)
 *
 * NOTE: Hindi verbs are gender-sensitive. This engine provides MASCULINE forms
 * by default (standard dictionary convention). Feminine forms differ in
 * participle suffixes: -ता→-ती, -रहा→-रही, -आ→-ई, etc.
 *
 * Tenses:
 *   present     — वर्तमान (habitual: stem + ता/ती/ते + auxiliary)
 *   continuous  — अपूर्ण (stem + रहा/रही + auxiliary)
 *   past        — भूतकाल (stem + आ/ई/ए, ergative with ने for transitive)
 *   habitual_past — अपूर्ण भूत (stem + ता/ती + था/थी)
 *   future      — भविष्य (stem + ऊँगा/एगा/एँगे etc.)
 *   subjunctive — संभावना (stem + ऊँ/ए/एँ/ओ)
 */
import type { ConjugationTable } from '../../types';

// ── Types ───────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string];
type TenseKey = 'present' | 'continuous' | 'past' | 'habitual_past' | 'future' | 'subjunctive';

const TENSES: TenseKey[] = ['present', 'continuous', 'past', 'habitual_past', 'future', 'subjunctive'];

const TENSE_LABELS: Record<TenseKey, string> = {
  present: 'वर्तमान (Present)',
  continuous: 'अपूर्ण (Continuous)',
  past: 'भूतकाल (Past)',
  habitual_past: 'अभ्यस्त भूत (Past Habitual)',
  future: 'भविष्य (Future)',
  subjunctive: 'संभावना (Subjunctive)',
};

const PERSON_LABELS = ['मैं', 'तू', 'वह/यह', 'हम', 'तुम', 'आप/वे'];

// ── Helpers ─────────────────────────────────────────────────
function getStem(infinitive: string): string {
  // Hindi infinitives end in ना (-nā)
  if (infinitive.endsWith('ना')) {
    return infinitive.slice(0, -2);
  }
  return infinitive;
}

// ── Present tense auxiliary (masculine forms) ───────────────
// मैं ...ता हूँ, तू ...ता है, वह ...ता है, हम ...ते हैं, तुम ...ते हो, आप ...ते हैं
const PRESENT_AUX: Forms = ['हूँ', 'है', 'है', 'हैं', 'हो', 'हैं'];
const PRESENT_SUFFIX_SG = 'ता';
const PRESENT_SUFFIX_PL = 'ते';

// ── Continuous tense (masculine) ────────────────────────────
// मैं ...रहा हूँ, तू ...रहा है, etc.
const CONT_SUFFIX_SG = ' रहा';
const CONT_SUFFIX_PL = ' रहे';

// ── Past tense (masculine, simple perfective) ───────────────
// Intransitive: मैं गया, तू गया, वह गया, हम गए, तुम गए, वे गए
// Transitive uses ने (ergative): मैंने किया, तूने किया, etc.
const PAST_SUFFIX_SG = 'ा';  // added to stem: खेल → खेला
const PAST_SUFFIX_PL = 'े';  // खेल → खेले

// ── Past habitual (masculine) ───────────────────────────────
const PAST_HAB_AUX: Forms = ['था', 'था', 'था', 'थे', 'थे', 'थे'];

// ── Future tense ────────────────────────────────────────────
// मैं ...ऊँगा, तू ...एगा, वह ...एगा, हम ...एँगे, तुम ...ओगे, आप ...एँगे
const FUTURE_SUFFIXES: Forms = ['ऊँगा', 'एगा', 'एगा', 'एँगे', 'ओगे', 'एँगे'];

// ── Subjunctive ─────────────────────────────────────────────
// मैं ...ऊँ, तू ...ए, वह ...ए, हम ...एँ, तुम ...ओ, आप ...एँ
const SUBJ_SUFFIXES: Forms = ['ऊँ', 'ए', 'ए', 'एँ', 'ओ', 'एँ'];

// ── Irregular verb data ─────────────────────────────────────
interface IrregularData {
  present?: Forms;           // full override for present habitual
  presentStem?: string;      // if present stem differs (e.g., पीना → पी)
  pastForms?: Forms;         // full override for past
  pastStem?: string;         // if past stem differs
  futureStem?: string;       // if future stem differs
  continuousStem?: string;   // if continuous stem differs
  isTransitive?: boolean;    // for ergative past marking
}

const IRREGULARS: Record<string, IrregularData> = {
  // होना — to be (highly irregular)
  'होना': {
    present: ['हूँ', 'है', 'है', 'हैं', 'हो', 'हैं'],
    pastForms: ['था', 'था', 'था', 'थे', 'थे', 'थे'],
    continuousStem: 'हो',
    futureStem: 'हो',
  },
  // करना — to do
  'करना': {
    presentStem: 'कर',
    pastForms: ['किया', 'किया', 'किया', 'किए', 'किए', 'किए'],
    futureStem: 'कर',
    isTransitive: true,
  },
  // जाना — to go
  'जाना': {
    presentStem: 'जा',
    pastForms: ['गया', 'गया', 'गया', 'गए', 'गए', 'गए'],
    futureStem: 'जा',
  },
  // आना — to come
  'आना': {
    presentStem: 'आ',
    pastForms: ['आया', 'आया', 'आया', 'आए', 'आए', 'आए'],
    futureStem: 'आ',
  },
  // देना — to give
  'देना': {
    presentStem: 'दे',
    pastForms: ['दिया', 'दिया', 'दिया', 'दिए', 'दिए', 'दिए'],
    futureStem: 'दे',
    isTransitive: true,
  },
  // लेना — to take
  'लेना': {
    presentStem: 'ले',
    pastForms: ['लिया', 'लिया', 'लिया', 'लिए', 'लिए', 'लिए'],
    futureStem: 'ले',
    isTransitive: true,
  },
  // पीना — to drink
  'पीना': {
    presentStem: 'पी',
    pastForms: ['पिया', 'पिया', 'पिया', 'पिए', 'पिए', 'पिए'],
    futureStem: 'पी',
    isTransitive: true,
  },
  // खाना — to eat
  'खाना': {
    presentStem: 'खा',
    pastForms: ['खाया', 'खाया', 'खाया', 'खाए', 'खाए', 'खाए'],
    futureStem: 'खा',
    isTransitive: true,
  },
  // सोना — to sleep
  'सोना': {
    presentStem: 'सो',
    pastForms: ['सोया', 'सोया', 'सोया', 'सोए', 'सोए', 'सोए'],
    futureStem: 'सो',
  },
  // धोना — to wash
  'धोना': {
    presentStem: 'धो',
    pastForms: ['धोया', 'धोया', 'धोया', 'धोए', 'धोए', 'धोए'],
    futureStem: 'धो',
    isTransitive: true,
  },
  // रोना — to cry
  'रोना': {
    presentStem: 'रो',
    pastForms: ['रोया', 'रोया', 'रोया', 'रोए', 'रोए', 'रोए'],
    futureStem: 'रो',
  },
  // सीखना — to learn
  'सीखना': {
    isTransitive: true,
  },
  // लिखना — to write
  'लिखना': {
    isTransitive: true,
  },
  // पढ़ना — to read/study
  'पढ़ना': {
    isTransitive: true,
  },
  // बोलना — to speak
  'बोलना': {
    isTransitive: true,
  },
  // देखना — to see
  'देखना': {
    isTransitive: true,
  },
  // सुनना — to listen
  'सुनना': {
    isTransitive: true,
  },
  // समझना — to understand
  'समझना': {
    isTransitive: true,
  },
  // कहना — to say
  'कहना': {
    pastForms: ['कहा', 'कहा', 'कहा', 'कहे', 'कहे', 'कहे'],
    isTransitive: true,
  },
  // रहना — to stay/live
  'रहना': {
    presentStem: 'रह',
  },
  // चलना — to walk/move
  'चलना': {
    presentStem: 'चल',
  },
  // बैठना — to sit
  'बैठना': {
    pastForms: ['बैठा', 'बैठा', 'बैठा', 'बैठे', 'बैठे', 'बैठे'],
  },
  // उठना — to get up
  'उठना': {
    presentStem: 'उठ',
  },
  // मिलना — to meet/be found
  'मिलना': {
    presentStem: 'मिल',
  },
  // रखना — to keep/put
  'रखना': {
    isTransitive: true,
  },
  // बनाना — to make
  'बनाना': {
    presentStem: 'बना',
    futureStem: 'बना',
    isTransitive: true,
  },
  // खोलना — to open
  'खोलना': {
    isTransitive: true,
  },
  // बंद करना — to close
  'बंद करना': {
    isTransitive: true,
  },
  // मारना — to hit/kill
  'मारना': {
    isTransitive: true,
  },
  // भेजना — to send
  'भेजना': {
    isTransitive: true,
  },
  // लाना — to bring
  'लाना': {
    presentStem: 'ला',
    pastForms: ['लाया', 'लाया', 'लाया', 'लाए', 'लाए', 'लाए'],
    futureStem: 'ला',
    isTransitive: true,
  },
  // चाहना — to want
  'चाहना': {
    isTransitive: true,
  },
  // जानना — to know
  'जानना': {
    isTransitive: true,
  },
  // मानना — to agree/believe
  'मानना': {
    isTransitive: true,
  },
  // पहुँचना — to arrive/reach
  'पहुँचना': {
    presentStem: 'पहुँच',
  },
  // निकलना — to come out
  'निकलना': {
    presentStem: 'निकल',
  },
  // बनना — to become
  'बनना': {
    presentStem: 'बन',
  },
  // दौड़ना — to run
  'दौड़ना': {
    presentStem: 'दौड़',
  },
  // तैरना — to swim
  'तैरना': {
    presentStem: 'तैर',
  },
  // गाना — to sing
  'गाना': {
    presentStem: 'गा',
    pastForms: ['गाया', 'गाया', 'गाया', 'गाए', 'गाए', 'गाए'],
    futureStem: 'गा',
    isTransitive: true,
  },
  // नाचना — to dance
  'नाचना': {
    presentStem: 'नाच',
  },
  // हँसना — to laugh
  'हँसना': {
    presentStem: 'हँस',
  },
  // रुकना — to stop
  'रुकना': {
    presentStem: 'रुक',
  },
  // गिरना — to fall
  'गिरना': {
    presentStem: 'गिर',
  },
  // मरना — to die
  'मरना': {
    pastForms: ['मरा', 'मरा', 'मरा', 'मरे', 'मरे', 'मरे'],
  },
  // जीना — to live
  'जीना': {
    presentStem: 'जी',
    pastForms: ['जिया', 'जिया', 'जिया', 'जिए', 'जिए', 'जिए'],
    futureStem: 'जी',
  },
  // छोड़ना — to leave
  'छोड़ना': {
    isTransitive: true,
  },
  // पकड़ना — to catch
  'पकड़ना': {
    isTransitive: true,
  },
  // तोड़ना — to break
  'तोड़ना': {
    isTransitive: true,
  },
  // जोड़ना — to add/join
  'जोड़ना': {
    isTransitive: true,
  },
  // हारना — to lose
  'हारना': {},
  // जीतना — to win
  'जीतना': {
    isTransitive: true,
  },
  // बताना — to tell
  'बताना': {
    presentStem: 'बता',
    futureStem: 'बता',
    isTransitive: true,
  },
  // सिखाना — to teach
  'सिखाना': {
    presentStem: 'सिखा',
    futureStem: 'सिखा',
    isTransitive: true,
  },
  // पहनना — to wear
  'पहनना': {
    isTransitive: true,
  },
  // उतारना — to remove/take off
  'उतारना': {
    isTransitive: true,
  },
};

// ── Regular conjugation ─────────────────────────────────────
function conjugateRegular(stem: string, tense: TenseKey): Forms {
  switch (tense) {
    case 'present':
      // stem + ता हूँ, ता है, ता है, ते हैं, ते हो, ते हैं
      return [
        `${stem}${PRESENT_SUFFIX_SG} ${PRESENT_AUX[0]}`,
        `${stem}${PRESENT_SUFFIX_SG} ${PRESENT_AUX[1]}`,
        `${stem}${PRESENT_SUFFIX_SG} ${PRESENT_AUX[2]}`,
        `${stem}${PRESENT_SUFFIX_PL} ${PRESENT_AUX[3]}`,
        `${stem}${PRESENT_SUFFIX_PL} ${PRESENT_AUX[4]}`,
        `${stem}${PRESENT_SUFFIX_PL} ${PRESENT_AUX[5]}`,
      ];
    case 'continuous':
      return [
        `${stem}${CONT_SUFFIX_SG} ${PRESENT_AUX[0]}`,
        `${stem}${CONT_SUFFIX_SG} ${PRESENT_AUX[1]}`,
        `${stem}${CONT_SUFFIX_SG} ${PRESENT_AUX[2]}`,
        `${stem}${CONT_SUFFIX_PL} ${PRESENT_AUX[3]}`,
        `${stem}${CONT_SUFFIX_PL} ${PRESENT_AUX[4]}`,
        `${stem}${CONT_SUFFIX_PL} ${PRESENT_AUX[5]}`,
      ];
    case 'past':
      return [
        `${stem}${PAST_SUFFIX_SG}`,
        `${stem}${PAST_SUFFIX_SG}`,
        `${stem}${PAST_SUFFIX_SG}`,
        `${stem}${PAST_SUFFIX_PL}`,
        `${stem}${PAST_SUFFIX_PL}`,
        `${stem}${PAST_SUFFIX_PL}`,
      ];
    case 'habitual_past':
      return [
        `${stem}${PRESENT_SUFFIX_SG} ${PAST_HAB_AUX[0]}`,
        `${stem}${PRESENT_SUFFIX_SG} ${PAST_HAB_AUX[1]}`,
        `${stem}${PRESENT_SUFFIX_SG} ${PAST_HAB_AUX[2]}`,
        `${stem}${PRESENT_SUFFIX_PL} ${PAST_HAB_AUX[3]}`,
        `${stem}${PRESENT_SUFFIX_PL} ${PAST_HAB_AUX[4]}`,
        `${stem}${PRESENT_SUFFIX_PL} ${PAST_HAB_AUX[5]}`,
      ];
    case 'future':
      return [
        `${stem}${FUTURE_SUFFIXES[0]}`,
        `${stem}${FUTURE_SUFFIXES[1]}`,
        `${stem}${FUTURE_SUFFIXES[2]}`,
        `${stem}${FUTURE_SUFFIXES[3]}`,
        `${stem}${FUTURE_SUFFIXES[4]}`,
        `${stem}${FUTURE_SUFFIXES[5]}`,
      ];
    case 'subjunctive':
      return [
        `${stem}${SUBJ_SUFFIXES[0]}`,
        `${stem}${SUBJ_SUFFIXES[1]}`,
        `${stem}${SUBJ_SUFFIXES[2]}`,
        `${stem}${SUBJ_SUFFIXES[3]}`,
        `${stem}${SUBJ_SUFFIXES[4]}`,
        `${stem}${SUBJ_SUFFIXES[5]}`,
      ];
  }
}

// ── Main conjugation function ───────────────────────────────
export function conjugateHindi(infinitive: string): ConjugationTable | null {
  if (!infinitive || !infinitive.endsWith('ना')) return null;

  const stem = getStem(infinitive);
  const irr = IRREGULARS[infinitive];

  // Special case: होना (to be) — completely irregular
  if (infinitive === 'होना') {
    return {
      infinitive,
      isReflexive: false,
      tenses: {
        [TENSE_LABELS.present]: irr!.present!,
        [TENSE_LABELS.continuous]: [
          'हो रहा हूँ', 'हो रहा है', 'हो रहा है',
          'हो रहे हैं', 'हो रहे हो', 'हो रहे हैं',
        ],
        [TENSE_LABELS.past]: irr!.pastForms!,
        [TENSE_LABELS.habitual_past]: [
          'होता था', 'होता था', 'होता था',
          'होते थे', 'होते थे', 'होते थे',
        ],
        [TENSE_LABELS.future]: [
          'होऊँगा', 'होएगा', 'होएगा',
          'होएँगे', 'होओगे', 'होएँगे',
        ],
        [TENSE_LABELS.subjunctive]: [
          'होऊँ', 'हो', 'हो',
          'होएँ', 'होओ', 'होएँ',
        ],
      },
    };
  }

  const tenses: Record<string, string[]> = {};

  for (const tense of TENSES) {
    const label = TENSE_LABELS[tense];
    const effectiveStem = (tense === 'future' || tense === 'subjunctive')
      ? (irr?.futureStem ?? irr?.presentStem ?? stem)
      : (tense === 'continuous')
        ? (irr?.continuousStem ?? irr?.presentStem ?? stem)
        : (irr?.presentStem ?? stem);

    if (tense === 'present' && irr?.present) {
      tenses[label] = irr.present;
    } else if (tense === 'past' && irr?.pastForms) {
      tenses[label] = irr.pastForms;
    } else {
      tenses[label] = conjugateRegular(
        tense === 'past' ? (irr?.pastStem ?? stem) : effectiveStem,
        tense,
      );
    }
  }

  return {
    infinitive,
    isReflexive: false,
    tenses,
  };
}

// ── Reverse lookup: find infinitive from conjugated form ────
const HABITUAL_SUFFIXES = ['ता', 'ती', 'ते'];
const CONTINUOUS_PARTICLES = ['रहा', 'रही', 'रहे'];
const PAST_SUFFIXES_M = ['ा', 'े', 'ी'];
const FUTURE_SUFFIX_LIST = ['ऊँगा', 'ऊँगी', 'एगा', 'एगी', 'एँगे', 'एँगी', 'ओगे', 'ओगी'];
const SUBJUNCTIVE_LIST = ['ऊँ', 'ए', 'एँ', 'ओ'];

// Build reverse map from irregular past forms
const PAST_REVERSE = new Map<string, string>();
for (const [inf, data] of Object.entries(IRREGULARS)) {
  if (data.pastForms) {
    for (const form of data.pastForms) {
      if (!PAST_REVERSE.has(form)) {
        PAST_REVERSE.set(form, inf);
      }
    }
  }
}

export function findInfinitive(form: string): string | null {
  // Direct infinitive
  if (form.endsWith('ना') && (IRREGULARS[form] || form.length >= 4)) {
    return form;
  }

  // Check irregular past forms
  if (PAST_REVERSE.has(form)) {
    return PAST_REVERSE.get(form)!;
  }

  // Strip auxiliaries: "करता हूँ" → "करता"
  const parts = form.split(/\s+/);
  const mainWord = parts[0];

  // Check continuous: remove रहा/रही/रहे
  for (const p of CONTINUOUS_PARTICLES) {
    if (mainWord.endsWith(p)) {
      const stem = mainWord.slice(0, -p.length).trim();
      if (stem.length > 0) return stem + 'ना';
    }
  }

  // Check habitual: remove ता/ती/ते
  for (const s of HABITUAL_SUFFIXES) {
    if (mainWord.endsWith(s)) {
      const stem = mainWord.slice(0, -s.length);
      if (stem.length > 0) {
        // Check irregular stems
        for (const [inf, data] of Object.entries(IRREGULARS)) {
          if (data.presentStem === stem) return inf;
        }
        return stem + 'ना';
      }
    }
  }

  // Check future suffixes
  for (const s of FUTURE_SUFFIX_LIST) {
    if (mainWord.endsWith(s)) {
      const stem = mainWord.slice(0, -s.length);
      if (stem.length > 0) {
        for (const [inf, data] of Object.entries(IRREGULARS)) {
          if ((data.futureStem ?? data.presentStem) === stem) return inf;
        }
        return stem + 'ना';
      }
    }
  }

  // Check subjunctive suffixes
  for (const s of SUBJUNCTIVE_LIST) {
    if (mainWord.endsWith(s)) {
      const stem = mainWord.slice(0, -s.length);
      if (stem.length > 0) {
        for (const [inf, data] of Object.entries(IRREGULARS)) {
          if ((data.futureStem ?? data.presentStem) === stem) return inf;
        }
        return stem + 'ना';
      }
    }
  }

  // Check simple past: remove ा/ी/े
  for (const s of PAST_SUFFIXES_M) {
    if (mainWord.endsWith(s) && mainWord.length > 2) {
      const stem = mainWord.slice(0, -1);
      if (stem.length > 0) {
        for (const [inf, data] of Object.entries(IRREGULARS)) {
          if (data.pastStem === stem || getStem(inf) === stem) return inf;
        }
        return stem + 'ना';
      }
    }
  }

  return null;
}

export default conjugateHindi;
