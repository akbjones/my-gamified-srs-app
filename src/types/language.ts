/**
 * The Language Module Contract — draft types (Phase 0).
 *
 * NOT yet implemented by any language. Phase 1 retrofits the existing 11
 * modules to export a `LanguageModule` conforming to these interfaces and
 * adds a CI audit gate. See docs/language-module-contract.md for the
 * rationale behind every field — each one is traceable to a shipped bug.
 *
 * Design constraints:
 * - Pure types + tiny helpers only. No imports from data files, so this
 *   module never drags 15 MB of dictionaries into a consumer bundle.
 * - Interfaces describe what EXISTS today (deck.json shape, DictEntry
 *   shape) rather than an aspirational redesign — Phase 1 is a retrofit,
 *   not a rewrite.
 */

// ── Cards ───────────────────────────────────────────────────────

export interface ContractCard {
  /** Stable, content-derived ID (e.g. "hi-0417", "hi-S-007").
   *  NEVER reshuffled or repurposed: a card whose meaning changes gets a
   *  NEW id and the old one is retired. Audio filenames derive from this. */
  id: string;
  /** Target-language sentence. */
  target: string;
  /** English gloss — must actually translate `target` (LLM audit checks). */
  english: string;
  /** Audio filename, derived deterministically from `id`. */
  audio: string;
  /** Optional stored transliteration for scripts where it is not
   *  derivable (Persian unwritten vowels). Derivable scripts generate it
   *  via ScriptDescriptor.transliterate instead. */
  transliteration?: string;
  tags?: string[];
  grammarNode?: string;
  priority?: number;
  grammar?: string;
}

// ── Dictionary ──────────────────────────────────────────────────

export interface ContractDictEntry {
  en: string;
  ipa?: string;
  pos?: string;
  /** For inflected forms: the base form whose conjugation table should
   *  open when this token is tapped. Must point at a REAL lemma — the
   *  Swedish `fick → skaffa` class of bug fails the audit. */
  lemma?: string;
}

// ── Script ──────────────────────────────────────────────────────

export interface ScriptDescriptor {
  direction: 'ltr' | 'rtl';
  /** Split a target sentence into tappable tokens. Whitespace-based for
   *  all current languages; Korean will need particle awareness. */
  tokenize: (sentence: string) => string[];
  /** Locale-correct case folding for dictionary keys. Turkish MUST use
   *  toLocaleLowerCase('tr'); plain toLowerCase() maps İ → i̇ and broke
   *  every İ-word lookup. Caseless scripts return input unchanged. */
  lowercase: (token: string) => string;
  /** Word-character test for boundary detection. JS \b is ASCII-only and
   *  silently fails on Cyrillic/Devanagari — every matcher and classifier
   *  must use this instead. */
  isWordChar: (ch: string) => boolean;
  /** Custom form-vs-token match for the conjugation round-trip audit.
   *  Default is equality. Agglutinative scripts need more: Korean's
   *  copula attaches to its complement (학생 + 이에요 = 학생이에요), so
   *  the token legitimately ENDS WITH the table form without equalling
   *  it. Encode that here rather than weakening the audit globally. */
  formMatches?: (token: string, tableForm: string) => boolean;
  /** Romanization for learner display, where deterministic. */
  transliterate?: (text: string) => string;
  /** Free-text notes engines must respect (e.g. Devanagari matra
   *  composition). Kept as documentation-adjacent data; engines encode
   *  the actual logic. */
  combiningNotes?: string;
}

// ── Voice ───────────────────────────────────────────────────────

export interface VoiceSpec {
  /** BCP-47-ish language code for TTS, e.g. "hi-IN". */
  languageCode: string;
  /** The ONE canonical voice for this language. Pre-recorded MP3s and the
   *  live-TTS fallback must both use exactly this string — drift between
   *  them produced the "two voices alternating" bug. */
  name: string;
  /** Provider for pre-recorded generation. Welsh uses Edge TTS because
   *  Google has no Welsh neural voice. */
  provider: 'google' | 'edge-tts';
}

// ── The module ──────────────────────────────────────────────────

export interface LanguageModule {
  /** Language key as used in src/data/<key>/ and the Language union. */
  key: string;
  /** Two-letter code used in audio filenames and doc names. */
  code: string;
  deck: ContractCard[];
  lookup: (token: string) => ContractDictEntry | null;
  conjugate: (lemma: string) => unknown | null; // ConjugationTable — kept loose until Phase 1 unifies table shapes
  findInfinitive: (form: string) => string | null;
  script: ScriptDescriptor;
  voice: VoiceSpec;
  /** Repo paths to the register policy + offender lexicon. Required even
   *  for languages believed clean — the check must be an artifact. */
  registerPolicy: { policyDoc: string; offenderLexicon: string };
}

// ── Audit result shape (consumed by scripts/audit-lang, Phase 1) ─

export interface AuditResult {
  language: string;
  audit:
    | 'dict-coverage'
    | 'conjugation-roundtrip'
    | 'audio-parity'
    | 'voice-consistency'
    | 'cache-version-pair'
    | 'register-lexical'
    ;
  pass: boolean;
  /** e.g. coverage percentage, mismatch count. */
  metric: number;
  details?: string[];
}
