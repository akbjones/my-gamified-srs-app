# Japanese 300-starter — deck QA report (P2)

**Date:** 2026-07-22 · **Deck:** src/data/japanese/deck.json (ja-0001..ja-0300)
**Pipeline:** 6 authoring waves → 3-lens adversarial verify per wave → per-wave
fix pass → mechanical lint (scripts/lint-ja-deck.ts) → id-stable merge
(scripts/tmp/ja-p2/merge.ts). Brief: scripts/tmp/ja-p2/BRIEF.md.

## Numbers

| Metric | Value |
|---|---|
| Cards | 300, seq 1-300 = priority, unique targets |
| Grammar tips | 91 (30.3%), ≤120 chars, romaji parentheticals, en dashes |
| Tags | general 100% · travel 42% · family 35% · work 34% (work just under the 40-60% band – acceptable for a starter skewed to daily life; parity expansion rebalances) |
| Dictionary | 403 entries (src/data/dictionary/ja.ts), **100% tap coverage** – every non-punctuation token in all 300 cards resolves via lookupWord (engine-derived verb forms included) |
| Conjugation | 90 verb/adjective lemmas in KNOWN_VERBS, full reverse round-trip green (test harness 61 explicit cases + all-forms round-trip) |
| Bands | seq 1-50 kana-only (nodes 1-4, 3-6 tokens; node-01 set phrases 1-2) · 51-100 nodes 5-7 · 101-150 nodes 8-10 · 151-200 nodes 11-13 · 201-250 nodes 14-16 · 251-300 nodes 17-18 + bridge |
| Register | 100% sentence-final です/ます outside node-01 set phrases; offender lexicon clean |

## Adversarial verification

26 agents (6 authors, 18 verifiers – grammar/particles, naturalness/register,
readings/glosses/tokens – plus 2 fixers), ~2.0M subagent tokens.

- Wave 2: 8 fix findings → 6 cards rewritten (duplicates, node-ladder leaks).
- Wave 6: 3 fix findings → 2 cards fixed (a recycled wave-5 sentence rebuilt
  as 写真を撮ってください; じゃないです dictionary path added).
- Post-hoc ladder sweep: 5 more wave-2 cards used ました/ません at nodes 6-7
  (before nodes 9-10 teach them) – rewritten to present-tense frames
  (ja-0078/0082/0095/0098/0099); corpus re-scanned, zero pre-node-09
  past/negative forms remain.
- 89 "note"-severity observations were logged but judged non-defects.

## Known limitations

- Homographs: kana とる resolves to 撮る (photo) – correct for the one card
  using it (ja-0117); kanji surfaces 取る/撮る resolve unambiguously.
- Tips flag: SHOW_GRAMMAR_TIPS not yet flipped for japanese – data ships
  dormant, same as every language pre-flip.
- Audio pending P3 (1-card ja-JP-Chirp3-HD-Aoede smoke test before batch).
