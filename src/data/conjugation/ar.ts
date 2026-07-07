/**
 * MSA Arabic conjugation engine — Stage-1 scaffold.
 *
 * Citation form: past 3sg masculine (كتب "he wrote") — Arabic's
 * dictionary convention. The scaffold covers sound triliteral Form-I
 * verbs in past + present, written UNVOCALIZED (deck policy: no
 * harakat), which means some person forms are homographs (كتبت is
 * 1sg/2sg.m/2sg.f/3sg.f past — they differ only in unwritten vowels).
 * Rows show the written form; the pilot stage decides how tips
 * disambiguate.
 *
 * Hollow/defective/doubled verbs (كان، قال، رأى) are seeded as
 * IRREGULARS; the pilot grows this list with the deck.
 */

export interface ConjugationTable {
  infinitive: string; // past 3sg.m — the Arabic citation form
  isReflexive: boolean;
  tenses: Record<string, string[]>;
}

interface IrregularData {
  past: [string, string, string, string, string, string];
  present: [string, string, string, string, string, string];
}

// Rows: [أنا, أنتَ/أنتِ, هو/هي, نحن, أنتم, هم]
const IRREGULARS: Record<string, IrregularData> = {
  'كان': {
    past: ['كنت', 'كنت', 'كان/كانت', 'كنا', 'كنتم', 'كانوا'],
    present: ['أكون', 'تكون', 'يكون/تكون', 'نكون', 'تكونون', 'يكونون'],
  },
  'قال': {
    past: ['قلت', 'قلت', 'قال/قالت', 'قلنا', 'قلتم', 'قالوا'],
    present: ['أقول', 'تقول', 'يقول/تقول', 'نقول', 'تقولون', 'يقولون'],
  },
  'رأى': {
    past: ['رأيت', 'رأيت', 'رأى/رأت', 'رأينا', 'رأيتم', 'رأوا'],
    present: ['أرى', 'ترى', 'يرى/ترى', 'نرى', 'ترون', 'يرون'],
  },
  'جاء': {
    past: ['جئت', 'جئت', 'جاء/جاءت', 'جئنا', 'جئتم', 'جاءوا'],
    present: ['أجيء', 'تجيء', 'يجيء/تجيء', 'نجيء', 'تجيئون', 'يجيئون'],
  },
  'أراد': {
    past: ['أردت', 'أردت', 'أراد/أرادت', 'أردنا', 'أردتم', 'أرادوا'],
    present: ['أريد', 'تريد', 'يريد/تريد', 'نريد', 'تريدون', 'يريدون'],
  },
};

/** Sound triliteral roots the regular generator may conjugate. */
export const KNOWN_ROOTS = new Set<string>([
  'كتب', 'درس', 'ذهب', 'شرب', 'أكل', 'فتح', 'سكن', 'عمل', 'دخل',
  'خرج', 'جلس', 'سمع', 'فهم', 'لعب', 'طبخ', 'غسل', 'حمل', 'ركب',
  'نظر', 'بحث', 'وصل', 'رجع', 'سأل', 'قرأ',
]);

const AR = /^[ء-ي]+$/;

export function conjugate(lemma: string): ConjugationTable | null {
  if (!lemma) return null;
  const w = lemma.trim();

  const irr = IRREGULARS[w];
  if (irr) {
    return {
      infinitive: w,
      isReflexive: false,
      tenses: {
        'الماضي (Past)': [...irr.past],
        'المضارع (Present)': [...irr.present],
      },
    };
  }

  // Sound triliteral Form I: prefix/suffix morphology on the bare stem.
  // Only for known roots — blind generation over any 3 letters would
  // produce garbage for hollow/defective/doubled radicals.
  if (AR.test(w) && w.length === 3 && KNOWN_ROOTS.has(w)) {
    return {
      infinitive: w,
      isReflexive: false,
      tenses: {
        'الماضي (Past)': [`${w}ت`, `${w}ت`, `${w}/${w}ت`, `${w}نا`, `${w}تم`, `${w}وا`],
        'المضارع (Present)': [`أ${w}`, `ت${w}`, `ي${w}/ت${w}`, `ن${w}`, `ت${w}ون`, `ي${w}ون`],
      },
    };
  }
  return null;
}

// ── findInfinitive: written form → citation form ─────────────────

let REVERSE: Map<string, string> | null = null;

function buildReverse(): Map<string, string> {
  const m = new Map<string, string>();
  const lemmas = [...Object.keys(IRREGULARS), ...KNOWN_ROOTS];
  for (const lemma of lemmas) {
    const t = conjugate(lemma);
    if (!t) continue;
    for (const forms of Object.values(t.tenses)) {
      for (const f of forms) {
        for (const part of f.split('/')) {
          if (!m.has(part)) m.set(part, lemma);
        }
      }
    }
  }
  return m;
}

/** Strip proclitics that attach to the written word: و ف ب ل س ال. */
function stripProclitics(w: string): string[] {
  const out = [w];
  let cur = w;
  for (const p of ['و', 'ف', 'س', 'ل', 'ب']) {
    if (cur.startsWith(p) && cur.length > 3) {
      cur = cur.slice(1);
      out.push(cur);
    }
  }
  if (cur.startsWith('ال') && cur.length > 4) out.push(cur.slice(2));
  return out;
}

export function findInfinitive(form: string): string | null {
  if (!form) return null;
  const w = form.trim();
  if (!REVERSE) REVERSE = buildReverse();
  for (const cand of stripProclitics(w)) {
    if (IRREGULARS[cand] || KNOWN_ROOTS.has(cand)) return cand;
    const hit = REVERSE.get(cand);
    if (hit) return hit;
  }
  return null;
}
