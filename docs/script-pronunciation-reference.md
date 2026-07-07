# Script & Pronunciation Reference

How LangLab handles languages whose writing system is itself something
the learner must acquire. Applied retroactively to the existing 11,
designed forward for Persian, Korean, and beyond.

## The ScriptDescriptor

Each language declares a `ScriptDescriptor` (types in
`src/types/language.ts`):

| Field | Purpose | Examples |
|---|---|---|
| `direction` | `'ltr' \| 'rtl'` — must flow through card layout, popover positioning, and underline rendering | Persian/Hebrew are the first RTL cases; current popover math assumes LTR |
| `tokenize(sentence)` | Splits a target sentence into tappable units | Whitespace for all current 11; Korean needs particle-aware splitting; CJK would need dictionary-driven segmentation (out of scope) |
| `lowercase(token)` | Locale-correct case folding for dictionary keys | MUST be `toLocaleLowerCase('tr')` for Turkish (İ→i, I→ı); plain `toLowerCase()` broke every İ-word lookup |
| `isWordChar(ch)` | Character class for word-boundary detection in classifiers/matchers | JS `\b` is ASCII-only — it silently fails on Cyrillic and Devanagari. Every regex-based scanner must use explicit char classes |
| `transliterate(text)?` | Romanization for learner display | Devanagari → IAST-ish, Cyrillic → practical Latin, Perso-Arabic → transliteration WITH the unwritten short vowels, Hangul → Revised Romanization |
| `combiningRules?` | Notes for morphology engines about script-level composition | Devanagari matras: a vowel sign cannot attach to a stem already ending in one — बनाना's feminine past is बनाई (full vowel ई), never बनाी. The Hindi engine shipped invalid text until this was encoded |

## Lessons already paid for

1. **Case is locale-dependent.** Turkish İ/ı is the famous one; Greek
   final sigma is next. Case folding lives in the descriptor, not inline.
2. **Word boundaries are script-dependent.** `\b` fails outside ASCII.
   The register classifier grew per-script `wordChar` classes; every
   future matcher uses them.
3. **Suffix concatenation is not string concatenation.** Abugidas
   (Devanagari) have composition rules; engines must consult
   `combiningRules`. An engine producing orthographically impossible
   output should fail its round-trip audit (this is how the Hindi bug
   was caught).
4. **Transliteration is content, not decoration.** Hindi grammar tips
   required romanization in parentheses (के पास = ke paas) after user
   feedback. For Persian this is stronger: short vowels are unwritten,
   so a learner CANNOT recover pronunciation from the script alone —
   transliteration is mandatory at all levels, not a beginner toggle.

## Pronunciation-vs-script decoupling (Persian, Korean)

For languages where reading must be learned:

- **Cards carry three layers:** script target, transliteration, English.
  The `transliterate` function generates layer 2 where deterministic
  (Korean, Cyrillic); Persian needs it stored per-card because unwritten
  vowels make it non-deterministic.
- **Display policy is a Settings toggle with a tier-based default:**
  transliteration ON for Q1–Q2, dimmed at Q3, hidden at Q4 (tap to
  reveal). Always-on infantilizes advanced learners; always-off walls
  off beginners. (Decision from framework plan open question #2 —
  confirm with user before Phase 2 implements it.)
- **A script primer is a deck section, not an app mode.** Hangul is
  learnable in ~30 cards; Perso-Arabic joined forms in ~60. These are
  ordinary cards (letter → sound + example word) living in node-00 of
  the respective language, reusing the whole SRS machinery. No new UI.

## Per-language script notes (current + planned)

| Language | Script | Direction | Key hazards |
|---|---|---|---|
| ES/IT/FR/PT/DE/NL/SV | Latin | LTR | diacritics in matching (accent-blind fallbacks exist) |
| Welsh | Latin | LTR | initial mutations break naive dictionary lookup (mutation-reversing matcher shipped) |
| Turkish | Latin+ | LTR | İ/ı case folding; suffix chains for morphology |
| Russian | Cyrillic | LTR | `\b` failure; ё/е variance in lookups |
| Hindi | Devanagari | LTR | matra composition; nuqta variants (क़/क); no case |
| **Persian** (planned) | Perso-Arabic | **RTL** | joined letter forms; unwritten short vowels; ezāfe pronounced but unwritten; ZWNJ in compounds |
| **Korean** (planned) | Hangul | LTR | syllable-block decomposition for morphology; particle segmentation; batchim liaison in romanization |
