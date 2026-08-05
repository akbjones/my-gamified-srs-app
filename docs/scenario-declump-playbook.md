# Scenario De-clump Playbook (all decks)

Status: **PLANNED, not started.** Hindi is done (2026-08-05, commits
386621bcc/b98fea41f/185cd6dba) and is the template. This doc structures the
same pass for the other 13 decks without committing to running it.

## What we're fixing

Not word frequency – **scenario clumping**: a wave author templates one
actor/prop across a node ("the X who … is our neighbour" ×4 in one node), or
near-duplicate meanings land a few study ranks apart ("my neighbours are very
nice" at ranks 191 and 368). Learners notice the recurring actor, not the
word count. पड़ोसी was 0.5% of the Hindi deck and still felt jarring.

## Hard-won rules (from the Hindi run – do not relearn these)

1. **Mechanical thresholds over-flag massively.** Naive frequency+clump rules
   flagged 1,676 of 3,172 Hindi cards; the judgment pass kept 326. The
   carrier / vocab / scenario distinction is the whole game:
   - *carrier* – the node's own grammar material (ज़्यादा ×58 in the
     comparatives node IS the lesson). Untouched.
   - *vocab* – honest everyday frequency (खाना, घर). Only near-dup pairs flagged.
   - *scenario* – a recurring specific actor/scene. Flag the excess.
2. **Batch-scoped verify misses cross-batch repetition.** The Hindi authors
   introduced their own clumps (tailor ×4, one "X जी… आज ही… दीजिए" template
   ×3) that per-batch verifiers could not see. A **whole-set uniqueness gate
   is mandatory as the final stage**, checking (a) repeated sentence openings,
   (b) repeated new scenarios, (c) near-identical pairs vs the WHOLE deck.
3. **Translationese is its own failure mode.** Hindi produced Indian-English
   calques ("today itself"). Every language pair has its own: check the
   English glosses for word-for-word tics, not just the target sentences.
4. **Audio coupling.** Text must never deploy before its audio regen
   (regen 2-wide with backoff; bump BOTH audio-cache-vN and AUDIO_VERSION).
   Cost-confirm the TTS spend per deck BEFORE authoring so nothing sits
   blocked half-done.

## Phase 0 – measure first, judge nothing (cheap, do this before anything)

Build `scripts/scan-scenario-clumps.cjs`, language-agnostic with a per-language
token folder (the crude Devanagari suffix-stripper worked for Hindi; Turkish
agglutination, Russian case endings and Korean particles each need their own
fold – reuse the per-language matcher lessons from the tips programme).

Per deck it outputs a **clump report**: candidate families with total /
first-600-ranks density / max-in-one-node, near-duplicate pairs (token-set
Jaccard over folded content words, threshold ~0.6), and repeated sentence
openings. Plus one headline **clump score** per deck so the 13 decks rank.

Decision gate: only decks above threshold proceed. Prior evidence says the
wave-authored decks (Greek, Korean, Indonesian – 3,933 cards authored fast by
few agents) are the likely worst; es/it were clean in the ordering audit but
that measured a different axis, so measure anyway. Japanese is only 300 cards
– scan it, but expect a hand-fix not a pipeline run.

## Phase 1 – judgment classification (per flagged deck)

Same 6-judge panel as Hindi: every candidate family classified
carrier/vocab/scenario with explicit rewriteIds. Conservative bias – a rewrite
costs authoring + audio. Cap and sanity-check the flagged count against the
Hindi ratio (~10% of deck) before proceeding.

## Phase 2 – author → per-batch verify → WHOLE-SET gate

- Authors get the deck's own frequency table and a banned-scenario list, and
  a "don't reuse your own new scenario more than twice" rule.
- Per-batch adversarial verify (grammar slot, naturalness, agreement) as in
  Hindi – it corrected dozens.
- Then the whole-set uniqueness + gloss-naturalness pass (rule 2/3 above) as
  its own stage, not folded into the batches.

## Phase 3 – apply + audio + ship (per deck)

- `apply-sentence-qc.cjs` is Hindi-hardcoded (deck path + id shapes); needs a
  `--deck=` parameter first. Gates stay: unknown id, empty text, and
  replacement-INTRODUCED duplicates only.
- Audio: per-deck regen list → cost confirm → 2-wide regen → R2 upload →
  bump both cache versions → build → deploy → commit. One deck per ship so a
  bad batch is revertible.

## Rough scope

Phase 0 is one short session and pays for itself by ruling decks out. Each
flagged deck is roughly the Hindi effort (two workflow runs + cleanup + audio,
~$0.40-0.60 TTS per 300 cards). Realistic guess: 4-7 decks need action.

## Order of attack (subject to Phase 0 numbers)

1. Greek, Korean, Indonesian (wave-authored at speed, same-author templates)
2. Turkish, Welsh (older correctness history)
3. Russian, German, Dutch, Swedish, French, Italian, Spanish, Portuguese
   (only if the scanner says so)
