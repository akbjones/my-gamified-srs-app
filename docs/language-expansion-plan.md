# Language Expansion Plan — Indonesian, Greek, Korean, MSA Arabic, Lebanese Arabic

Decisions locked 2026-07-07:

- **Order:** Indonesian → Greek → Korean → MSA Arabic → Lebanese Arabic.
  The two low-risk languages shake down the onboarding pipeline; Korean
  introduces script-primer + tokenizer machinery; the RTL investment
  happens once for MSA and Lebanese inherits it.
- **Dialect:** Lebanese (ar-LB). Voice is Edge TTS (`ar-LB-LaylaNeural`)
  — Google has zero dialect-Arabic voices (verified against the live
  catalog 2026-07-07). Same provider path as Welsh.
- **Arabic display:** bare script, **no harakat**. Pronunciation is
  carried by the per-card `transliteration` field already in the
  contract (`ContractCard.transliteration`) — same mechanism as
  everywhere else, no new UI concept. Display it as a secondary line
  under the target sentence; because Arabic short vowels are unwritten,
  it is stored per card, not derived.
- **Deck size:** start small and grow behind quality gates:
  pilot ~300 → ~1,000 → full LLM audit checkpoint → grow toward the
  ~3,933 parity target only if the audit holds.

## Canonical voices (verified 2026-07-07)

| Language | Voice | Provider |
|---|---|---|
| Indonesian | `id-ID-Chirp3-HD-Aoede` | google |
| Greek | `el-GR-Chirp3-HD-Aoede` | google |
| Korean | `ko-KR-Chirp3-HD-Aoede` | google |
| MSA Arabic | `ar-XA-Chirp3-HD-Aoede` | google |
| Lebanese Arabic | `ar-LB-LaylaNeural` | edge-tts |

One voice per language, both paths (pre-recorded + fallback), per the
contract. Add each to `scripts/CANONICAL-VOICES.md` and
`GOOGLE_VOICE_MAP` (Google languages) at module-scaffold time so the
voice-consistency audit is green before any audio exists.

## The onboarding pipeline (every language, in order)

Contract-first: a language exists in the repo only as a
`LanguageModule`. No stage ships without the previous one's gates green.

1. **Scaffold** — registry entry with ScriptDescriptor, VoiceSpec,
   register policy doc + offender lexicon (seeded, even if short),
   empty deck, stub dictionary, `findInfinitive` exported from day one
   (may start as reverse-map-only). Baseline entries added. CI green.
2. **Script primer** (where needed) — ordinary cards in node-00
   (letter → sound + example word), not an app mode: Greek ~20 cards,
   Korean ~30, Arabic ~60 (joined forms). MSA and Lebanese share one
   primer (MSA ships it; Lebanese deck references its concepts).
3. **Pilot deck (~300 cards)** — authored against the register policy,
   then the full gate order from docs/audit-checklist.md:
   dict-coverage 100% → conjugation round-trip → register classifier →
   **strict LLM quality audit on every card** (rule 7 — the RU/TR
   "cooked the article at the bank" lesson: no card ships unread).
4. **Audio** — single batch, canonical voice, deck-referenced upload
   set (never filename regexes), R2 parity sample, cache version pair
   bump. Cost estimate + user confirmation before generation.
5. **Grow in ~500-card batches** — each batch repeats the full gate.
   At ~1,000 cards: full audit checkpoint + user review before
   committing to parity scale.

## Per-language notes

### Indonesian (easiest; pipeline shakedown)
- No tense conjugation — the "conjugation" popover becomes an
  **affix-derivation table**: root → meN-/di-/ber-/ter-/-kan/-i/ke-…-an
  forms. `conjugate(lemma)` returns this table; `findInfinitive` strips
  affixes with meN- assimilation reversal (memukul→pukul, menulis→tulis,
  mengambil→ambil, menyapu→sapu — the m/n/ng/ny onset restoration is
  the whole trick).
- Register policy: standard conversational; offenders = stiff
  bureaucratic *baku* vocabulary AND heavy Jakarta slang in Q1/Q2.

### Greek
- Alphabet primer ~20 cards. ScriptDescriptor lowercase must normalize
  final sigma (σ/ς) for dictionary keys — the Turkish-İ lesson,
  different letter.
- Verb system: two conjugations + aspect stems (aorist vs present) —
  reuse the Russian aspect-pair table design.
- Register offenders: katharevousa-flavored formalisms.

### Korean
- Hangul primer ~30 cards. Deterministic romanization → implement
  `ScriptDescriptor.transliterate` (Revised Romanization) instead of
  storing per card.
- First language where whitespace tokenize isn't enough for lookup:
  particles attach to nouns (학교에서 = school+LOC). Dictionary lookup
  strips particle suffixes the way Turkish lookup strips case suffixes
  — this lives in the module's `lookup`, not in tokenize.
- **Register = speech level.** Canonical level: 해요체 (polite
  informal) everywhere; 합니다체 allowed in clearly-formal Q3/Q4
  contexts; 반말 only with an explicit tip. The register-policy
  framework maps onto this directly.
- Conjugation table: tense × speech level, with vowel-harmony contraction
  (하다→해요, 먹다→먹어요, ㅂ-irregulars 돕다→도와요).

### MSA Arabic
- **First RTL language — UI workstream gates this stage** (see below).
- Bare script, no harakat; stored per-card transliteration line.
- Deck mandate: MSA is nobody's everyday speech — the register policy
  *inverts*. Q1–Q4 target reading/news/announcements/travel
  comprehension and pan-Arab intelligibility; "would a Cairo taxi
  driver say this" is NOT the test here (it is for Lebanese).
- `findInfinitive`: start as reverse map harvested from the engine's
  own tables (the approach that got 6 languages to 90%+), plus prefix
  stripping (sa-, wa-, bi-, al-). Root-pattern extraction is a later
  refinement, not a day-one requirement.
- Dictionary keys: bare-script forms; lookups tolerant of alif variants
  (أ/إ/آ/ا) and ta marbuta (ة/ه) — encode in ScriptDescriptor notes.

### Lebanese Arabic (last; inherits everything)
- **Gate 0 — voice A/B test before anything else:** generate ~10
  Lebanese-written sentences (بدي، عم بـ، هلق، مش) through
  ar-LB-LaylaNeural and have the user listen. Edge dialect voices are
  trained largely on MSA-ish text; if Layla reads Lebanese text
  unnaturally, the language is blocked and we reassess (RamiNeural,
  or Egyptian fallback). Do not author 300 cards before this.
- Orthography convention doc is part of the register policy: Lebanese
  has no standard spelling — pick conventions (script not Arabizi,
  progressive عم + verb, بدّي for want, negation مش/ما) and the
  classifier enforces them.
- Shares MSA's script primer and all RTL work; its offender lexicon is
  the reverse of MSA's (flag *fusha-only* vocabulary that no Beiruti
  would say).

## Cross-cutting workstreams (build before the stage that needs them)

| Workstream | Needed by | Notes |
|---|---|---|
| Transliteration display line | MSA (also improves Hindi/Russian later) | Renders `card.transliteration` under target; Settings toggle, tier-based default (on Q1–Q2, dimmed Q3, tap-to-reveal Q4) |
| Affix-table popover shape | Indonesian | Generalize ConjugationTable so tenses aren't the only row type |
| Particle-stripping lookup | Korean | Module-local, like Turkish suffix stripping |
| RTL support | MSA | direction:'rtl' through card layout, popover positioning, underline rendering; audit every absolute-position calc in WordPopover |
| Edge-TTS batch generation for Arabic | Lebanese | Welsh scripts generalized (they assume cy filenames) |

## Costs (confirm-before-spend, per standing rule)

Chirp3-HD generation for a 300-card pilot is ~$1–2; a full-size deck
~$15–20 per language (extrapolated from the $46 / 10-language regen).
Edge TTS (Lebanese) is free. Each audio stage gets an explicit estimate
+ user confirmation first.

## What "done" means per stage

Same as the existing 11: all six audits green in `npm run audit:langs`,
LLM audit clean, baseline updated deliberately, audio byte-verified on
R2, cache pair bumped, deployed, spot-checked.
