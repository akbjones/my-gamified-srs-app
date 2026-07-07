# The Language Module Contract

Every language in LangLab — the existing 11 and every future addition —
must satisfy one interface. When it does, adding a language is filling in
a template. When it doesn't, an automated audit fails the build.

This document is the rationale. The types live in `src/types/language.ts`.
The audits live in `docs/audit-checklist.md`.

## Why a contract

Each of the 11 languages was built as bespoke files with shared scripts
stapled on. Every one shipped with defects that the same five checks would
have caught. The postmortem (see `docs/` planning artifacts, 2026-07)
found the failures cluster into four classes:

1. **Content quality** — register drift (Hindi Sanskritic vocabulary,
   472 cards), template-generated nonsense (RU/TR, 680 cards), difficulty
   miscalibration.
2. **Data plumbing** — wrong lemmas (Swedish `fick → skaffa`), missing
   engine exports, upload regexes that silently skipped non-numeric card
   IDs (126 cards served stale audio for weeks).
3. **Engine coverage** — invalid Devanagari from matra-blind suffixing,
   missing feminine reverse lookups, Turkish locale-blind lowercasing
   (`İ → i̇` broke every İ-word tap for the deck's lifetime).
4. **Infrastructure** — R2 CORS absent (audio silently fell back to iOS
   robot TTS), voice-map drift between pre-recorded and live TTS
   ("two women's voices"), audio↔card ID reshuffles breaking stale clients.

Classes 2–4 are entirely preventable by interface + audit. Class 1 is
reducible by policy docs + LLM audit gates, which the contract requires
as artifacts.

## The interface

A language module exports a single `LanguageModule` object:

| Field | What it is | Failure it prevents |
|---|---|---|
| `deck` | Cards with **stable content-derived IDs**. IDs are never repurposed; a changed sentence keeps its ID only if meaning is preserved, else it gets a new ID and the old is retired. | Audio/card mismatch on stale clients |
| `lookup(token)` | Returns a `DictEntry` for every token that appears in any card. Must be **locale-aware** (Turkish İ/ı, Cyrillic case). Verb entries carry a correct `lemma`. | Empty popovers; Swedish wrong-lemma class |
| `conjugate(lemma)` | Full conjugation table for any lemma the lookup can emit. | Dead-end conjugation views |
| `findInfinitive(form)` | Reverse morphology: any verb form in any card round-trips to a lemma whose table contains that form. | Tap-a-verb dead ends |
| `script` | `ScriptDescriptor`: direction, tokenizer, transliterator, case rules. See `docs/script-pronunciation-reference.md`. | RTL layout breaks, İ-lowercasing, matra-blind suffixing |
| `voice` | ONE object holding both the pre-recorded voice ID and the live-TTS fallback voice ID. A build assert enforces they are identical strings. | "Two voices alternating" |
| `registerPolicy` | Path to the language's register policy doc + offender lexicon. Required for every language, even ones we believe are clean — "we checked" is an artifact, not a memory. | Hindi/TR/RU register drift recurring |

## Rules that are not fields

- **Never reshuffle audio↔ID mappings.** `generate-audio.cjs` writes
  `card.audio` deterministically from `card.id`. If a regen would change
  any existing mapping, it must fail loudly instead.
- **Uploads select by deck reference, not filename regex.** The uploader
  reads deck.json and uploads exactly the referenced files. Pattern-
  matching filenames is how the S-XXX cards got skipped.
- **Every apply script runs the audit gate before ship.** No exceptions
  for "small" batches — the 5-card Hindi greetings batch went through the
  same gate as the 652-card RU/TR batch.
- **Secrets never in transcripts or repo.** TTS and R2 credentials load
  from env only.

## Amending the contract

The contract grows when a new failure class is discovered, not
speculatively. Each addition must name the incident that motivated it
(as the table above does). Fields nobody audits are dead weight.
