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
 *   present     – वर्तमान (habitual: stem + ता/ती/ते + auxiliary)
 *   continuous  – अपूर्ण (stem + रहा/रही + auxiliary)
 *   past        – भूतकाल (stem + आ/ई/ए, ergative with ने for transitive)
 *   habitual_past – अपूर्ण भूत (stem + ता/ती + था/थी)
 *   future      – भविष्य (stem + ऊँगा/एगा/एँगे etc.)
 *   subjunctive – संभावना (stem + ऊँ/ए/एँ/ओ)
 */
import type { ConjugationTable } from '../../types';

// ── Types ───────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string];
type TenseKey =
  | 'present' | 'continuous' | 'past' | 'habitual_past' | 'future' | 'subjunctive' | 'imperative'
  | 'present_fem' | 'continuous_fem' | 'past_fem' | 'habitual_past_fem' | 'future_fem'
  | 'perfect' | 'perfect_fem' | 'past_perfect' | 'past_perfect_fem'
  | 'oblique_infinitive';

const TENSES: TenseKey[] = [
  'present', 'present_fem',
  'continuous', 'continuous_fem',
  'past', 'past_fem',
  'perfect', 'perfect_fem',
  'past_perfect', 'past_perfect_fem',
  'habitual_past', 'habitual_past_fem',
  'future', 'future_fem',
  'subjunctive',
  'imperative',
  'oblique_infinitive',
];

const TENSE_LABELS: Record<TenseKey, string> = {
  present: 'वर्तमान (Present, m.)',
  present_fem: 'वर्तमान (Present, f.)',
  continuous: 'अपूर्ण (Continuous, m.)',
  continuous_fem: 'अपूर्ण (Continuous, f.)',
  past: 'भूतकाल (Past, m.)',
  past_fem: 'भूतकाल (Past, f.)',
  habitual_past: 'अभ्यस्त भूत (Past Habitual, m.)',
  habitual_past_fem: 'अभ्यस्त भूत (Past Habitual, f.)',
  future: 'भविष्य (Future, m.)',
  future_fem: 'भविष्य (Future, f.)',
  perfect: 'पूर्ण (Perfect, m.)',
  perfect_fem: 'पूर्ण (Perfect, f.)',
  past_perfect: 'पूर्ण भूत (Past Perfect, m.)',
  past_perfect_fem: 'पूर्ण भूत (Past Perfect, f.)',
  subjunctive: 'संभावना (Subjunctive)',
  imperative: 'आज्ञार्थक (Imperative)',
  oblique_infinitive: 'तिर्यक (Oblique Infinitive)',
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

// ── Continuous tense (feminine) ─────────────────────────────
// मैं ...रही हूँ. Feminine plural keeps रही (number is on the aux): हम रही हैं
const CONT_SUFFIX_F_SG = ' रही';
const CONT_SUFFIX_F_PL = ' रही';

// ── Habitual / present suffixes (feminine) ──────────────────
// stem + ती (sg) or ती (pl, number carried by aux)
const PRESENT_SUFFIX_F = 'ती';

// ── Past tense (masculine, simple perfective) ───────────────
// Intransitive: मैं गया, तू गया, वह गया, हम गए, तुम गए, वे गए
// Transitive uses ने (ergative): मैंने किया, तूने किया, etc.
const PAST_SUFFIX_SG = 'ा';  // added to stem: खेल → खेला
const PAST_SUFFIX_PL = 'े';  // खेल → खेले

// ── Past tense (feminine) ───────────────────────────────────
// खेल → खेली (sg), खेलीं (pl, with chandrabindu nasalization)
const PAST_SUFFIX_F_SG = 'ी';
const PAST_SUFFIX_F_PL = 'ीं';

// ── Past habitual (masculine) ───────────────────────────────
const PAST_HAB_AUX: Forms = ['था', 'था', 'था', 'थे', 'थे', 'थे'];

// ── Past habitual (feminine) ────────────────────────────────
const PAST_HAB_AUX_F: Forms = ['थी', 'थी', 'थी', 'थीं', 'थीं', 'थीं'];

// ── Future + subjunctive: suffixes computed at call time by
// getFutureSuffixes()/getSubjunctiveSuffixes() since the shape depends on
// whether the stem ends in a consonant (matra suffix) or vowel (full vowel).

// ── Subjunctive ─────────────────────────────────────────────
// मैं ...ऊँ, तू ...ए, वह ...ए, हम ...एँ, तुम ...ओ, आप ...एँ

// ── Irregular verb data ─────────────────────────────────────
interface IrregularData {
  present?: Forms;           // full override for present habitual
  presentStem?: string;      // if present stem differs (e.g., पीना → पी)
  pastForms?: Forms;         // full override for past
  pastStem?: string;         // if past stem differs
  futureStem?: string;       // if future stem differs
  continuousStem?: string;   // if continuous stem differs
  isTransitive?: boolean;    // for ergative past marking
  politeImperative?: string; // override for आप form (देना→दीजिए, लेना→लीजिए, करना→कीजिए)
}

const IRREGULARS: Record<string, IrregularData> = {
  // होना – to be (highly irregular)
  'होना': {
    present: ['हूँ', 'है', 'है', 'हैं', 'हो', 'हैं'],
    pastForms: ['था', 'था', 'था', 'थे', 'थे', 'थे'],
    continuousStem: 'हो',
    futureStem: 'हो',
  },
  // करना – to do
  'करना': {
    presentStem: 'कर',
    pastForms: ['किया', 'किया', 'किया', 'किए', 'किए', 'किए'],
    futureStem: 'कर',
    isTransitive: true,
    politeImperative: 'कीजिए',
  },
  // जाना – to go
  'जाना': {
    presentStem: 'जा',
    pastForms: ['गया', 'गया', 'गया', 'गए', 'गए', 'गए'],
    futureStem: 'जा',
  },
  // आना – to come
  'आना': {
    presentStem: 'आ',
    pastForms: ['आया', 'आया', 'आया', 'आए', 'आए', 'आए'],
    futureStem: 'आ',
  },
  // देना – to give
  'देना': {
    presentStem: 'दे',
    pastForms: ['दिया', 'दिया', 'दिया', 'दिए', 'दिए', 'दिए'],
    futureStem: 'दे',
    isTransitive: true,
    politeImperative: 'दीजिए',
  },
  // लेना – to take
  'लेना': {
    presentStem: 'ले',
    pastForms: ['लिया', 'लिया', 'लिया', 'लिए', 'लिए', 'लिए'],
    futureStem: 'ले',
    isTransitive: true,
    politeImperative: 'लीजिए',
  },
  // पीना – to drink
  'पीना': {
    presentStem: 'पी',
    pastForms: ['पिया', 'पिया', 'पिया', 'पिए', 'पिए', 'पिए'],
    futureStem: 'पी',
    isTransitive: true,
    politeImperative: 'पीजिए',
  },
  // खाना – to eat
  'खाना': {
    presentStem: 'खा',
    pastForms: ['खाया', 'खाया', 'खाया', 'खाए', 'खाए', 'खाए'],
    futureStem: 'खा',
    isTransitive: true,
  },
  // सोना – to sleep
  'सोना': {
    presentStem: 'सो',
    pastForms: ['सोया', 'सोया', 'सोया', 'सोए', 'सोए', 'सोए'],
    futureStem: 'सो',
  },
  // धोना – to wash
  'धोना': {
    presentStem: 'धो',
    pastForms: ['धोया', 'धोया', 'धोया', 'धोए', 'धोए', 'धोए'],
    futureStem: 'धो',
    isTransitive: true,
  },
  // रोना – to cry
  'रोना': {
    presentStem: 'रो',
    pastForms: ['रोया', 'रोया', 'रोया', 'रोए', 'रोए', 'रोए'],
    futureStem: 'रो',
  },
  // सीखना – to learn
  'सीखना': {
    isTransitive: true,
  },
  // लिखना – to write
  'लिखना': {
    isTransitive: true,
  },
  // पढ़ना – to read/study
  'पढ़ना': {
    isTransitive: true,
  },
  // बोलना – to speak
  'बोलना': {
    isTransitive: true,
  },
  // देखना – to see
  'देखना': {
    isTransitive: true,
  },
  // सुनना – to listen
  'सुनना': {
    isTransitive: true,
  },
  // समझना – to understand
  'समझना': {
    isTransitive: true,
  },
  // कहना – to say
  'कहना': {
    pastForms: ['कहा', 'कहा', 'कहा', 'कहे', 'कहे', 'कहे'],
    isTransitive: true,
  },
  // रहना – to stay/live
  'रहना': {
    presentStem: 'रह',
  },
  // चलना – to walk/move
  'चलना': {
    presentStem: 'चल',
  },
  // बैठना – to sit
  'बैठना': {
    pastForms: ['बैठा', 'बैठा', 'बैठा', 'बैठे', 'बैठे', 'बैठे'],
  },
  // उठना – to get up
  'उठना': {
    presentStem: 'उठ',
  },
  // मिलना – to meet/be found
  'मिलना': {
    presentStem: 'मिल',
  },
  // रखना – to keep/put
  'रखना': {
    isTransitive: true,
  },
  // बनाना – to make
  'बनाना': {
    presentStem: 'बना',
    futureStem: 'बना',
    isTransitive: true,
  },
  // खोलना – to open
  'खोलना': {
    isTransitive: true,
  },
  // बंद करना – to close
  'बंद करना': {
    isTransitive: true,
  },
  // मारना – to hit/kill
  'मारना': {
    isTransitive: true,
  },
  // भेजना – to send
  'भेजना': {
    isTransitive: true,
  },
  // लाना – to bring
  'लाना': {
    presentStem: 'ला',
    pastForms: ['लाया', 'लाया', 'लाया', 'लाए', 'लाए', 'लाए'],
    futureStem: 'ला',
    isTransitive: true,
  },
  // चाहना – to want
  'चाहना': {
    isTransitive: true,
  },
  // जानना – to know
  'जानना': {
    isTransitive: true,
  },
  // मानना – to agree/believe
  'मानना': {
    isTransitive: true,
  },
  // पहुँचना – to arrive/reach
  'पहुँचना': {
    presentStem: 'पहुँच',
  },
  // निकलना – to come out
  'निकलना': {
    presentStem: 'निकल',
  },
  // बनना – to become
  'बनना': {
    presentStem: 'बन',
  },
  // दौड़ना – to run
  'दौड़ना': {
    presentStem: 'दौड़',
  },
  // तैरना – to swim
  'तैरना': {
    presentStem: 'तैर',
  },
  // गाना – to sing
  'गाना': {
    presentStem: 'गा',
    pastForms: ['गाया', 'गाया', 'गाया', 'गाए', 'गाए', 'गाए'],
    futureStem: 'गा',
    isTransitive: true,
  },
  // नाचना – to dance
  'नाचना': {
    presentStem: 'नाच',
  },
  // हँसना – to laugh
  'हँसना': {
    presentStem: 'हँस',
  },
  // रुकना – to stop
  'रुकना': {
    presentStem: 'रुक',
  },
  // गिरना – to fall
  'गिरना': {
    presentStem: 'गिर',
  },
  // मरना – to die
  'मरना': {
    pastForms: ['मरा', 'मरा', 'मरा', 'मरे', 'मरे', 'मरे'],
  },
  // जीना – to live
  'जीना': {
    presentStem: 'जी',
    pastForms: ['जिया', 'जिया', 'जिया', 'जिए', 'जिए', 'जिए'],
    futureStem: 'जी',
  },
  // छोड़ना – to leave
  'छोड़ना': {
    isTransitive: true,
  },
  // पकड़ना – to catch
  'पकड़ना': {
    isTransitive: true,
  },
  // तोड़ना – to break
  'तोड़ना': {
    isTransitive: true,
  },
  // जोड़ना – to add/join
  'जोड़ना': {
    isTransitive: true,
  },
  // हारना – to lose
  'हारना': {},
  // जीतना – to win
  'जीतना': {
    isTransitive: true,
  },
  // बताना – to tell
  'बताना': {
    presentStem: 'बता',
    futureStem: 'बता',
    isTransitive: true,
  },
  // सिखाना – to teach
  'सिखाना': {
    presentStem: 'सिखा',
    futureStem: 'सिखा',
    isTransitive: true,
  },
  // पहनना – to wear
  'पहनना': {
    isTransitive: true,
  },
  // उतारना – to remove/take off
  'उतारना': {
    isTransitive: true,
  },
};

// ── Masculine → feminine past form transform ────────────────
// Patterns:
//   गया → गई    (drop या, add ई)
//   किया → की   (Cि+या pattern: drop ि+या, add ी to bare consonant)
//   दिया → दी
//   लिया → ली
//   पिया → पी
//   खाया → खाई  (Cा+या: keep ा matra, add ई)
//   आया → आई
//   सोया → सोई
//   खेला → खेली (drop ा, add ी)
// Plural feminine adds nasalization: गई → गईं, खेली → खेलीं
function mascToFemPast(masc: string, plural: boolean): string {
  let base: string;
  if (masc.endsWith('या')) {
    const root = masc.slice(0, -2);
    if (root.endsWith('ि')) {
      // Cि+या cases: किया, दिया, लिया, पिया → drop the i-matra, attach ी
      base = root.slice(0, -1) + 'ी';
    } else {
      base = root + 'ई';
    }
  } else if (masc.endsWith('ा')) {
    base = masc.slice(0, -1) + 'ी';
  } else {
    base = masc;
  }
  if (!plural) return base;
  if (base.endsWith('ई')) return base.slice(0, -1) + 'ईं';
  if (base.endsWith('ी')) return base.slice(0, -1) + 'ीं';
  return base + 'ं';
}

/** Derive the full 6-person feminine past from the masculine pastForms by
 * pulling the singular masc (index 0) and nasalising for plural slots. */
function pastFormsToFem(masc: Forms): Forms {
  const femSg = mascToFemPast(masc[0], false);
  const femPl = mascToFemPast(masc[0], true);
  return [femSg, femSg, femSg, femPl, femPl, femPl];
}

// ── Vowel-vs-consonant ending detection for suffix shape ────
// Hindi future/subjunctive suffixes attach differently to consonant- vs
// vowel-ending stems. खेल (cons) + ूँगा → खेलूँगा. जा (vowel) + ऊँगा → जाऊँगा.
const VOWEL_MATRAS = 'ािीुूेैोौृं';
const STANDALONE_VOWELS = 'अआइईउऊऋएऐओऔ';
function isVowelEndingStem(stem: string): boolean {
  if (!stem) return false;
  const last = stem.charAt(stem.length - 1);
  return VOWEL_MATRAS.includes(last) || STANDALONE_VOWELS.includes(last);
}

function getFutureSuffixes(stem: string, fem: boolean): Forms {
  const v = isVowelEndingStem(stem);
  if (fem) {
    return v
      ? ['ऊँगी', 'एगी', 'एगी', 'एँगी', 'ओगी', 'एँगी']
      : ['ूँगी', 'ेगी', 'ेगी', 'ेंगी', 'ोगी', 'ेंगी'];
  }
  return v
    ? ['ऊँगा', 'एगा', 'एगा', 'एँगे', 'ओगे', 'एँगे']
    : ['ूँगा', 'ेगा', 'ेगा', 'ेंगे', 'ोगे', 'ेंगे'];
}

function getSubjunctiveSuffixes(stem: string): Forms {
  const v = isVowelEndingStem(stem);
  return v ? ['ऊँ', 'ए', 'ए', 'एँ', 'ओ', 'एँ'] : ['ूँ', 'े', 'े', 'ें', 'ो', 'ें'];
}

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
    case 'future': {
      const sx = getFutureSuffixes(stem, false);
      return [`${stem}${sx[0]}`, `${stem}${sx[1]}`, `${stem}${sx[2]}`, `${stem}${sx[3]}`, `${stem}${sx[4]}`, `${stem}${sx[5]}`];
    }
    case 'subjunctive': {
      const sx = getSubjunctiveSuffixes(stem);
      return [`${stem}${sx[0]}`, `${stem}${sx[1]}`, `${stem}${sx[2]}`, `${stem}${sx[3]}`, `${stem}${sx[4]}`, `${stem}${sx[5]}`];
    }
    case 'present_fem':
      return [
        `${stem}${PRESENT_SUFFIX_F} ${PRESENT_AUX[0]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PRESENT_AUX[1]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PRESENT_AUX[2]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PRESENT_AUX[3]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PRESENT_AUX[4]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PRESENT_AUX[5]}`,
      ];
    case 'continuous_fem':
      return [
        `${stem}${CONT_SUFFIX_F_SG} ${PRESENT_AUX[0]}`,
        `${stem}${CONT_SUFFIX_F_SG} ${PRESENT_AUX[1]}`,
        `${stem}${CONT_SUFFIX_F_SG} ${PRESENT_AUX[2]}`,
        `${stem}${CONT_SUFFIX_F_PL} ${PRESENT_AUX[3]}`,
        `${stem}${CONT_SUFFIX_F_PL} ${PRESENT_AUX[4]}`,
        `${stem}${CONT_SUFFIX_F_PL} ${PRESENT_AUX[5]}`,
      ];
    case 'past_fem':
      return [
        `${stem}${PAST_SUFFIX_F_SG}`,
        `${stem}${PAST_SUFFIX_F_SG}`,
        `${stem}${PAST_SUFFIX_F_SG}`,
        `${stem}${PAST_SUFFIX_F_PL}`,
        `${stem}${PAST_SUFFIX_F_PL}`,
        `${stem}${PAST_SUFFIX_F_PL}`,
      ];
    case 'habitual_past_fem':
      return [
        `${stem}${PRESENT_SUFFIX_F} ${PAST_HAB_AUX_F[0]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PAST_HAB_AUX_F[1]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PAST_HAB_AUX_F[2]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PAST_HAB_AUX_F[3]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PAST_HAB_AUX_F[4]}`,
        `${stem}${PRESENT_SUFFIX_F} ${PAST_HAB_AUX_F[5]}`,
      ];
    case 'future_fem': {
      const sx = getFutureSuffixes(stem, true);
      return [`${stem}${sx[0]}`, `${stem}${sx[1]}`, `${stem}${sx[2]}`, `${stem}${sx[3]}`, `${stem}${sx[4]}`, `${stem}${sx[5]}`];
    }
    case 'oblique_infinitive': {
      // Single form used regardless of person: replace infinitive's final ा
      // with े. We get the bare stem here, so reconstruct: stem + ने.
      const ob = `${stem}ने`;
      return [ob, ob, ob, ob, ob, ob];
    }
    case 'perfect':
    case 'perfect_fem':
    case 'past_perfect':
    case 'past_perfect_fem':
      // Handled in the main loop — needs the past form + an auxiliary.
      return ['', '', '', '', '', ''];
    case 'imperative': {
      // Imperative only exists for 2nd-person (तू / तुम / आप). Other slots
      // are '-' which the UI renders as "no form for this person". The
      // stem-vowel handling is the tricky part:
      //
      //   Short-e ending (दे/ले): drop the े matra, then append ो / ीजिए
      //     → दे → दो, दीजिए   |   ले → लो, लीजिए
      //
      //   Other vowel-matra ending (खा/जा/आ): keep the matra, use the
      //   FULL vowel characters ओ / इ (not the matras ो / ि)
      //     → खा → खाओ, खाइए   |   जा → जाओ, जाइए
      //
      //   Consonant ending (बोल/कर): use vowel matras as suffix
      //     → बोल → बोलो, बोलिए
      //
      // Irregular polite forms (करना→कीजिए, पीना→पीजिए) still need
      // politeImperative overrides because the stem-rule doesn't predict them.
      const lastChar = stem.charAt(stem.length - 1);
      const vowelMatras = new Set(['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'ै', 'ो', 'ौ']);
      // Standalone vowel letters (single-character stems like आ in आना).
      // Same treatment as vowel-matra: use full-vowel suffixes.
      const standaloneVowels = new Set(['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ']);
      let tumForm: string, aapForm: string;
      if (lastChar === 'े') {
        const root = stem.slice(0, -1);
        tumForm = `${root}ो`;
        aapForm = `${root}ीजिए`;
      } else if (vowelMatras.has(lastChar) || standaloneVowels.has(lastChar)) {
        tumForm = `${stem}ओ`;
        aapForm = `${stem}इए`;
      } else {
        tumForm = `${stem}ो`;
        aapForm = `${stem}िए`;
      }
      return ['-', stem, '-', '-', tumForm, aapForm];
    }
  }
}

// ── Main conjugation function ───────────────────────────────
export function conjugateHindi(infinitive: string): ConjugationTable | null {
  if (!infinitive || !infinitive.endsWith('ना')) return null;

  const stem = getStem(infinitive);
  const irr = IRREGULARS[infinitive];

  // Special case: होना (to be) – completely irregular
  if (infinitive === 'होना') {
    return {
      infinitive,
      isReflexive: false,
      tenses: {
        [TENSE_LABELS.present]: irr!.present!,
        [TENSE_LABELS.present_fem]: irr!.present!,  // hai/hu form is gender-neutral
        [TENSE_LABELS.continuous]: [
          'हो रहा हूँ', 'हो रहा है', 'हो रहा है',
          'हो रहे हैं', 'हो रहे हो', 'हो रहे हैं',
        ],
        [TENSE_LABELS.continuous_fem]: [
          'हो रही हूँ', 'हो रही है', 'हो रही है',
          'हो रही हैं', 'हो रही हो', 'हो रही हैं',
        ],
        [TENSE_LABELS.past]: irr!.pastForms!,
        [TENSE_LABELS.past_fem]: ['थी', 'थी', 'थी', 'थीं', 'थीं', 'थीं'],
        // Perfect of होना is unusual — "हुआ है" (has happened/become). Listed for
        // completeness rather than typical SRS usage.
        [TENSE_LABELS.perfect]: ['हुआ हूँ', 'हुआ है', 'हुआ है', 'हुए हैं', 'हुए हो', 'हुए हैं'],
        [TENSE_LABELS.perfect_fem]: ['हुई हूँ', 'हुई है', 'हुई है', 'हुई हैं', 'हुई हो', 'हुई हैं'],
        [TENSE_LABELS.past_perfect]: ['हुआ था', 'हुआ था', 'हुआ था', 'हुए थे', 'हुए थे', 'हुए थे'],
        [TENSE_LABELS.past_perfect_fem]: ['हुई थी', 'हुई थी', 'हुई थी', 'हुई थीं', 'हुई थीं', 'हुई थीं'],
        [TENSE_LABELS.habitual_past]: [
          'होता था', 'होता था', 'होता था',
          'होते थे', 'होते थे', 'होते थे',
        ],
        [TENSE_LABELS.habitual_past_fem]: [
          'होती थी', 'होती थी', 'होती थी',
          'होती थीं', 'होती थीं', 'होती थीं',
        ],
        [TENSE_LABELS.future]: [
          'होऊँगा', 'होएगा', 'होएगा',
          'होएँगे', 'होओगे', 'होएँगे',
        ],
        [TENSE_LABELS.future_fem]: [
          'होऊँगी', 'होएगी', 'होएगी',
          'होएँगी', 'होओगी', 'होएँगी',
        ],
        [TENSE_LABELS.subjunctive]: [
          'होऊँ', 'हो', 'हो',
          'होएँ', 'होओ', 'होएँ',
        ],
        [TENSE_LABELS.imperative]: [
          '-', 'हो', '-',
          '-', 'हो', 'होइए',
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
    } else if (tense === 'past_fem' && irr?.pastForms) {
      // Derive feminine past from the irregular masculine past forms.
      tenses[label] = pastFormsToFem(irr.pastForms);
    } else if (tense === 'perfect' || tense === 'perfect_fem' || tense === 'past_perfect' || tense === 'past_perfect_fem') {
      // Skip — handled below after the base past tenses are computed.
      continue;
    } else {
      tenses[label] = conjugateRegular(
        tense === 'past' || tense === 'past_fem' ? (irr?.pastStem ?? stem) : effectiveStem,
        tense,
      );
      // Overlay the irregular polite imperative (आप form) — देना→दीजिए,
      // लेना→लीजिए, करना→कीजिए — onto the regular-pattern result.
      if (tense === 'imperative' && irr?.politeImperative) {
        const arr = tenses[label].slice();
        arr[5] = irr.politeImperative;
        tenses[label] = arr;
      }
    }
  }

  // Derive perfect + past perfect (both genders) from the bare past forms.
  // Perfect: past form + present auxiliary (हूँ/है/हैं/हो).
  // Past perfect: past form + था/थे (m) or थी/थीं (f).
  const pastM = tenses[TENSE_LABELS.past];
  const pastF = tenses[TENSE_LABELS.past_fem];
  if (pastM) {
    tenses[TENSE_LABELS.perfect] = [
      `${pastM[0]} ${PRESENT_AUX[0]}`, `${pastM[1]} ${PRESENT_AUX[1]}`, `${pastM[2]} ${PRESENT_AUX[2]}`,
      `${pastM[3]} ${PRESENT_AUX[3]}`, `${pastM[4]} ${PRESENT_AUX[4]}`, `${pastM[5]} ${PRESENT_AUX[5]}`,
    ];
    tenses[TENSE_LABELS.past_perfect] = [
      `${pastM[0]} ${PAST_HAB_AUX[0]}`, `${pastM[1]} ${PAST_HAB_AUX[1]}`, `${pastM[2]} ${PAST_HAB_AUX[2]}`,
      `${pastM[3]} ${PAST_HAB_AUX[3]}`, `${pastM[4]} ${PAST_HAB_AUX[4]}`, `${pastM[5]} ${PAST_HAB_AUX[5]}`,
    ];
  }
  if (pastF) {
    tenses[TENSE_LABELS.perfect_fem] = [
      `${pastF[0]} ${PRESENT_AUX[0]}`, `${pastF[1]} ${PRESENT_AUX[1]}`, `${pastF[2]} ${PRESENT_AUX[2]}`,
      `${pastF[3]} ${PRESENT_AUX[3]}`, `${pastF[4]} ${PRESENT_AUX[4]}`, `${pastF[5]} ${PRESENT_AUX[5]}`,
    ];
    tenses[TENSE_LABELS.past_perfect_fem] = [
      `${pastF[0]} ${PAST_HAB_AUX_F[0]}`, `${pastF[1]} ${PAST_HAB_AUX_F[1]}`, `${pastF[2]} ${PAST_HAB_AUX_F[2]}`,
      `${pastF[3]} ${PAST_HAB_AUX_F[3]}`, `${pastF[4]} ${PAST_HAB_AUX_F[4]}`, `${pastF[5]} ${PAST_HAB_AUX_F[5]}`,
    ];
  }

  return {
    infinitive,
    isReflexive: false,
    tenses,
  };
}

// ── Reverse lookup: find infinitive from conjugated form ────
// Suffixes used to strip an inflection back to its bare stem. Feminine
// variants included so that e.g. "खेलती" round-trips to "खेलना".
const HABITUAL_SUFFIXES = ['ता', 'ती', 'ते'];
const CONTINUOUS_PARTICLES = ['रहा', 'रही', 'रहे'];
const PAST_SUFFIXES_M = ['ा', 'े', 'ी', 'ीं'];
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
  // Oblique infinitive: stem + ने (e.g. घूमने → घूमना)
  if (form.endsWith('ने') && form.length >= 4) {
    const candidate = form.slice(0, -2) + 'ना';
    if (IRREGULARS[candidate] || candidate.length >= 4) return candidate;
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
