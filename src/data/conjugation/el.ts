/**
 * Greek conjugation engine — Stage-1 scaffold.
 *
 * Covers the A-conjugation present (-ω: γράφω) and the contract verbs
 * (-άω/-ώ: μιλάω, -έω class via IRREGULARS), plus the core irregulars
 * είμαι/έχω/πάω/λέω/τρώω. The pilot stage grows this to aspect stems
 * (aorist vs present — the same pair design as Russian) and futures.
 *
 * Script hazards encoded here (see docs/script-pronunciation-reference.md):
 * - Final sigma: dictionary keys and all form matching are σ-normalized
 *   (ς → σ) — the Greek analogue of the Turkish İ lesson.
 * - Accents are phonemic (μιλάω) but learners type/tap unaccented forms;
 *   findInfinitive falls back to an accent-stripped comparison.
 */

export interface ConjugationTable {
  infinitive: string; // 1sg present — Greek's citation form
  isReflexive: boolean;
  tenses: Record<string, string[]>;
}

/** σ-normalize + lowercase: the canonical key form for all matching. */
export const normalizeGreek = (t: string): string =>
  t.toLowerCase().replace(/ς/g, 'σ');

/** Accent-strip for tolerant matching (μιλάω ↔ μιλαω). */
export const stripAccents = (t: string): string =>
  t.normalize('NFD').replace(/[̀-ͅ]/g, '').normalize('NFC');

interface IrregularData {
  present: [string, string, string, string, string, string];
}

// Citation form (1sg) → present row [εγώ, εσύ, αυτός, εμείς, εσείς, αυτοί]
const IRREGULARS: Record<string, IrregularData> = {
  'είμαι': { present: ['είμαι', 'είσαι', 'είναι', 'είμαστε', 'είστε', 'είναι'] },
  'έχω':   { present: ['έχω', 'έχεις', 'έχει', 'έχουμε', 'έχετε', 'έχουν'] },
  'πάω':   { present: ['πάω', 'πας', 'πάει', 'πάμε', 'πάτε', 'πάνε'] },
  'λέω':   { present: ['λέω', 'λες', 'λέει', 'λέμε', 'λέτε', 'λένε'] },
  'τρώω':  { present: ['τρώω', 'τρως', 'τρώει', 'τρώμε', 'τρώτε', 'τρώνε'] },
  'ακούω': { present: ['ακούω', 'ακούς', 'ακούει', 'ακούμε', 'ακούτε', 'ακούνε'] },
};

export function conjugate(lemma: string): ConjugationTable | null {
  if (!lemma) return null;
  const w = lemma.toLowerCase().trim();

  const irr = IRREGULARS[w];
  if (irr) {
    return {
      infinitive: w,
      isReflexive: false,
      tenses: { 'Ενεστώτας (Present)': [...irr.present] },
    };
  }

  // Contract verbs in -άω (μιλάω): stem + άω/άς/άει/άμε/άτε/άνε
  if (w.endsWith('άω')) {
    const s = w.slice(0, -2);
    return {
      infinitive: w,
      isReflexive: false,
      tenses: {
        'Ενεστώτας (Present)': [`${s}άω`, `${s}άς`, `${s}άει`, `${s}άμε`, `${s}άτε`, `${s}άνε`],
      },
    };
  }

  // A-conjugation in -ω (γράφω): stem + ω/εις/ει/ουμε/ετε/ουν
  if (w.endsWith('ω')) {
    const s = w.slice(0, -1);
    return {
      infinitive: w,
      isReflexive: false,
      tenses: {
        'Ενεστώτας (Present)': [`${s}ω`, `${s}εις`, `${s}ει`, `${s}ουμε`, `${s}ετε`, `${s}ουν`],
      },
    };
  }

  // Passive/deponent -ομαι (έρχομαι, σκέφτομαι). In 1pl the stress moves
  // onto -όμαστε, so the stem loses its accent: έρχ- → ερχόμαστε.
  if (w.endsWith('ομαι')) {
    const s = w.slice(0, -4);
    const sBare = stripAccents(s);
    return {
      infinitive: w,
      isReflexive: true,
      tenses: {
        'Ενεστώτας (Present)': [`${s}ομαι`, `${s}εσαι`, `${s}εται`, `${sBare}όμαστε`, `${s}εστε`, `${s}ονται`],
      },
    };
  }

  return null;
}

// ── findInfinitive: reverse map from the engine's own output ─────

let REVERSE: Map<string, string> | null = null;

function buildReverse(): Map<string, string> {
  const m = new Map<string, string>();
  for (const lemma of Object.keys(IRREGULARS)) {
    const t = conjugate(lemma);
    if (!t) continue;
    for (const forms of Object.values(t.tenses)) {
      for (const f of forms) {
        const key = normalizeGreek(f);
        if (!m.has(key)) m.set(key, lemma);
        const bare = stripAccents(key);
        if (!m.has(bare)) m.set(bare, lemma);
      }
    }
  }
  return m;
}

// Regular personal endings, longest first, with the lemma reconstruction
const ENDINGS: [string, string][] = [
  ['όμαστε', 'ομαι'], ['ουμε', 'ω'], ['ετε', 'ω'], ['ουν', 'ω'], ['ουνε', 'ω'],
  ['εις', 'ω'], ['ει', 'ω'],
  ['άμε', 'άω'], ['άτε', 'άω'], ['άνε', 'άω'], ['άς', 'άω'], ['άει', 'άω'],
  ['εσαι', 'ομαι'], ['εται', 'ομαι'], ['εστε', 'ομαι'], ['ονται', 'ομαι'],
];

export function findInfinitive(form: string): string | null {
  if (!form) return null;
  const w = normalizeGreek(form.trim());
  if (!REVERSE) REVERSE = buildReverse();

  const hit = REVERSE.get(w) ?? REVERSE.get(stripAccents(w));
  if (hit) return hit;

  // Citation forms pass through if the engine can conjugate them
  if (conjugate(w)) return w;

  for (const [ending, repl] of ENDINGS) {
    const e = normalizeGreek(ending);
    if (w.endsWith(e) && w.length > e.length + 1) {
      const cand = w.slice(0, -e.length) + repl;
      if (conjugate(cand)) return cand;
    }
  }
  return null;
}
