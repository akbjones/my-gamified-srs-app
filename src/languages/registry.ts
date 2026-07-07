/**
 * Language Module Registry — Phase 1 retrofit.
 *
 * Exposes every language as a contract-conforming module descriptor
 * (docs/language-module-contract.md, types in src/types/language.ts).
 *
 * CURRENT CONSUMER: scripts/audit-lang.ts only. The app still imports
 * data files directly; migrating app consumption (with lazy loading) is
 * Phase 2 work. To keep this module light for that future, decks are
 * referenced by PATH (`deckPath`) and loaded by the consumer — importing
 * eleven deck.json files here would drag ~15 MB into any bundle that
 * touches the registry.
 *
 * All 11 languages now export findInfinitive and register-policy
 * artifacts; remaining sub-95% round-trip scores are tracked as known
 * gaps in docs/audit-baseline.json.
 */
import type { ContractDictEntry, ScriptDescriptor, VoiceSpec } from '../types/language';

import { lookupWord as lookupEs } from '../data/dictionary/es';
import { lookupWord as lookupIt } from '../data/dictionary/it';
import { lookupWord as lookupFr } from '../data/dictionary/fr';
import { lookupWord as lookupPt } from '../data/dictionary/pt';
import { lookupWord as lookupDe } from '../data/dictionary/de';
import { lookupWord as lookupNl } from '../data/dictionary/nl';
import { lookupWord as lookupSv } from '../data/dictionary/sv';
import { lookupWord as lookupCy } from '../data/dictionary/cy';
import { lookupWord as lookupHi } from '../data/dictionary/hi';
import { lookupWord as lookupTr } from '../data/dictionary/tr';
import { lookupWord as lookupRu } from '../data/dictionary/ru';

import { conjugate as conjEs, findInfinitive as findInfEs } from '../data/conjugation/es';
import { conjugate as conjIt, findInfinitive as findInfIt } from '../data/conjugation/it';
import { conjugate as conjFr, findInfinitive as findInfFr } from '../data/conjugation/fr';
import { conjugate as conjPt, findInfinitive as findInfPt } from '../data/conjugation/pt';
import { conjugate as conjDe, findInfinitive as findInfDe } from '../data/conjugation/de';
import { conjugate as conjNl, findInfinitive as findInfNl } from '../data/conjugation/nl';
import { conjugate as conjSv, findInfinitive as findInfSv } from '../data/conjugation/sv';
import { conjugate as conjCy, findInfinitive as findInfCy } from '../data/conjugation/cy';
import { conjugateHindi as conjHi, findInfinitive as findInfHi } from '../data/conjugation/hi';
import { conjugate as conjTr, findInfinitive as findInfTr } from '../data/conjugation/tr';
import { conjugate as conjRu, findInfinitive as findInfRu } from '../data/conjugation/ru';
import { lookupWord as lookupId } from '../data/dictionary/id';
import { lookupWord as lookupEl } from '../data/dictionary/el';
import { conjugate as conjId, findInfinitive as findInfId } from '../data/conjugation/id';
import { conjugate as conjEl, findInfinitive as findInfEl } from '../data/conjugation/el';

// ── Script descriptors ──────────────────────────────────────────

const wsTokenize = (s: string) => s.split(/\s+/).filter(Boolean);

const latin: ScriptDescriptor = {
  direction: 'ltr',
  tokenize: wsTokenize,
  lowercase: (t) => t.toLowerCase(),
  isWordChar: (c) => /[a-zA-ZÀ-ÿœŒßẞ]/.test(c),
};

/** Turkish: plain toLowerCase() maps İ → i̇ (combining dot) and I → i,
 *  both wrong. Locale-aware folding is mandatory. */
const latinTurkish: ScriptDescriptor = {
  direction: 'ltr',
  tokenize: wsTokenize,
  lowercase: (t) => t.toLocaleLowerCase('tr'),
  isWordChar: (c) => /[a-zA-ZçğıöşüÇĞİÖŞÜâîû]/.test(c),
};

/** Welsh: standard Latin plus initial-mutation hazard (handled inside
 *  the cy lookup, noted here for engine authors). */
const latinWelsh: ScriptDescriptor = {
  direction: 'ltr',
  tokenize: wsTokenize,
  lowercase: (t) => t.toLowerCase(),
  isWordChar: (c) => /[a-zA-ZâêîôûŵŷÂÊÎÔÛŴŶàèìòùáéíóú]/.test(c),
  combiningNotes: 'Initial consonant mutations (soft/nasal/aspirate) must be reversed before dictionary lookup.',
};

/** Cyrillic: JS \b is ASCII-only — matchers must use isWordChar. */
const cyrillic: ScriptDescriptor = {
  direction: 'ltr',
  tokenize: wsTokenize,
  lowercase: (t) => t.toLowerCase(),
  isWordChar: (c) => /[а-яёА-ЯЁ]/.test(c),
  combiningNotes: 'ё/е variance: lookups should tolerate е-for-ё spellings.',
};

/** Greek: final sigma (ς/σ) is positional orthography — all dictionary
 *  keys and matching are σ-normalized. Accents are phonemic but matching
 *  is accent-tolerant (mobile taps sometimes strip them). */
const greek: ScriptDescriptor = {
  direction: 'ltr',
  tokenize: wsTokenize,
  lowercase: (t) => t.toLowerCase().replace(/ς/g, 'σ'),
  isWordChar: (c) => /[α-ωΑ-Ωάέήίόύώϊϋΐΰς]/.test(c),
  combiningNotes: 'Final sigma: ς word-finally, σ elsewhere — normalize to σ for lookups.',
};

/** Devanagari: caseless; matra composition rules constrain suffixing. */
const devanagari: ScriptDescriptor = {
  direction: 'ltr',
  tokenize: wsTokenize,
  lowercase: (t) => t, // caseless script
  isWordChar: (c) => /[ऀ-ॿ]/.test(c),
  combiningNotes:
    'Vowel matras cannot attach to a stem already ending in a matra — ' +
    'feminine past of बनाना is बनाई (full vowel ई U+0908), never बनाी. ' +
    'Engines producing orthographically impossible sequences fail the round-trip audit.',
};

// ── Voice specs (must match scripts/CANONICAL-VOICES.md AND the
//    GOOGLE_VOICE_MAP fallback in audioService.ts; the audit compares) ──

const google = (languageCode: string, name: string): VoiceSpec =>
  ({ languageCode, name, provider: 'google' });

// ── Registry ────────────────────────────────────────────────────

export interface RegistryEntry {
  key: string;
  code: string;
  deckPath: string; // consumer loads via fs (audit) — app-side lazy load is Phase 2
  lookup: (token: string) => ContractDictEntry | null;
  conjugate: (lemma: string) => unknown | null;
  findInfinitive: ((form: string) => string | null) | null; // null = engine gap (audit fails)
  script: ScriptDescriptor;
  voice: VoiceSpec;
  registerPolicy: { policyDoc: string | null; offenderLexicon: string | null };
}

export const REGISTRY: Record<string, RegistryEntry> = {
  spanish: {
    key: 'spanish', code: 'es', deckPath: 'src/data/spanish/deck.json',
    lookup: lookupEs, conjugate: conjEs, findInfinitive: findInfEs,
    script: latin, voice: google('es-US', 'es-US-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/spanish-register-policy.md',
      offenderLexicon: 'docs/spanish-register-offenders.json',
    },
  },
  italian: {
    key: 'italian', code: 'it', deckPath: 'src/data/italian/deck.json',
    lookup: lookupIt, conjugate: conjIt, findInfinitive: findInfIt,
    script: latin, voice: google('it-IT', 'it-IT-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/italian-register-policy.md',
      offenderLexicon: 'docs/italian-register-offenders.json',
    },
  },
  french: {
    key: 'french', code: 'fr', deckPath: 'src/data/french/deck.json',
    lookup: lookupFr, conjugate: conjFr, findInfinitive: findInfFr,
    script: latin, voice: google('fr-FR', 'fr-FR-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/french-register-policy.md',
      offenderLexicon: 'docs/french-register-offenders.json',
    },
  },
  portuguese: {
    key: 'portuguese', code: 'pt', deckPath: 'src/data/portuguese/deck.json',
    lookup: lookupPt, conjugate: conjPt, findInfinitive: findInfPt,
    script: latin, voice: google('pt-BR', 'pt-BR-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/portuguese-register-policy.md',
      offenderLexicon: 'docs/portuguese-register-offenders.json',
    },
  },
  german: {
    key: 'german', code: 'de', deckPath: 'src/data/german/deck.json',
    lookup: lookupDe, conjugate: conjDe, findInfinitive: findInfDe,
    script: latin, voice: google('de-DE', 'de-DE-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/german-register-policy.md',
      offenderLexicon: 'docs/german-register-offenders.json',
    },
  },
  dutch: {
    key: 'dutch', code: 'nl', deckPath: 'src/data/dutch/deck.json',
    lookup: lookupNl, conjugate: conjNl, findInfinitive: findInfNl,
    script: latin, voice: google('nl-NL', 'nl-NL-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/dutch-register-policy.md',
      offenderLexicon: 'docs/dutch-register-offenders.json',
    },
  },
  swedish: {
    key: 'swedish', code: 'sv', deckPath: 'src/data/swedish/deck.json',
    lookup: lookupSv, conjugate: conjSv, findInfinitive: findInfSv,
    script: latin, voice: google('sv-SE', 'sv-SE-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/swedish-register-policy.md',
      offenderLexicon: 'docs/swedish-register-offenders.json',
    },
  },
  welsh: {
    key: 'welsh', code: 'cy', deckPath: 'src/data/welsh/deck.json',
    lookup: lookupCy, conjugate: conjCy, findInfinitive: findInfCy,
    script: latinWelsh,
    voice: { languageCode: 'cy-GB', name: 'cy-GB-NiaNeural', provider: 'edge-tts' },
    registerPolicy: {
      policyDoc: 'docs/welsh-register-policy.md',
      offenderLexicon: 'docs/welsh-register-offenders.json',
    },
  },
  hindi: {
    key: 'hindi', code: 'hi', deckPath: 'src/data/hindi/deck.json',
    lookup: lookupHi, conjugate: conjHi, findInfinitive: findInfHi,
    script: devanagari, voice: google('hi-IN', 'hi-IN-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/hindi-register-policy.md',
      offenderLexicon: 'docs/hindi-register-offenders.json',
    },
  },
  turkish: {
    key: 'turkish', code: 'tr', deckPath: 'src/data/turkish/deck.json',
    lookup: lookupTr, conjugate: conjTr, findInfinitive: findInfTr,
    script: latinTurkish, voice: google('tr-TR', 'tr-TR-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/turkish-register-policy.md',
      offenderLexicon: 'docs/turkish-register-offenders.json',
    },
  },
  russian: {
    key: 'russian', code: 'ru', deckPath: 'src/data/russian/deck.json',
    lookup: lookupRu, conjugate: conjRu, findInfinitive: findInfRu,
    script: cyrillic, voice: google('ru-RU', 'ru-RU-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/russian-register-policy.md',
      offenderLexicon: 'docs/russian-register-offenders.json',
    },
  },
  indonesian: {
    key: 'indonesian', code: 'id', deckPath: 'src/data/indonesian/deck.json',
    lookup: lookupId, conjugate: conjId, findInfinitive: findInfId,
    script: latin, voice: google('id-ID', 'id-ID-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/indonesian-register-policy.md',
      offenderLexicon: 'docs/indonesian-register-offenders.json',
    },
  },
  // ── Staged (Stage-1 scaffold; not yet in the app UI) ──────────
  greek: {
    key: 'greek', code: 'el', deckPath: 'src/data/greek/deck.json',
    lookup: lookupEl, conjugate: conjEl, findInfinitive: findInfEl,
    script: greek, voice: google('el-GR', 'el-GR-Chirp3-HD-Aoede'),
    registerPolicy: {
      policyDoc: 'docs/greek-register-policy.md',
      offenderLexicon: 'docs/greek-register-offenders.json',
    },
  },
};
