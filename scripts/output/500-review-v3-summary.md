# 500-Entry Dictionary Review v3 (Post Verb Review + To-Prefix Fixes)

Date: 2026-04-08

## Summary

All 11 languages scored Grade A after the full verb review and "to " prefix fixes.

| Language   | Dict Size | Sampled | Passed | Failed | Rate   | Grade |
|------------|-----------|---------|--------|--------|--------|-------|
| Spanish    | 4,725     | 500     | 494    | 6      | 98.8%  | A     |
| Italian    | 6,725     | 500     | 493    | 7      | 98.6%  | A     |
| French     | 5,502     | 500     | 476    | 24     | 95.2%  | A     |
| Portuguese | 5,480     | 500     | 496    | 4      | 99.2%  | A     |
| German     | 7,872     | 500     | 484    | 16     | 96.8%  | A     |
| Dutch      | 5,998     | 500     | 493    | 7      | 98.6%  | A     |
| Swedish    | 5,298     | 500     | 484    | 16     | 96.8%  | A     |
| Welsh      | 6,108     | 500     | 478    | 22     | 95.6%  | A     |
| Hindi      | 4,743     | 500     | 498    | 2      | 99.6%  | A     |
| Turkish    | 9,688     | 500     | 490    | 10     | 98.0%  | A     |
| Russian    | 4,760     | 500     | 499    | 1      | 99.8%  | A     |

## Grading Scale

- A = 95%+
- B = 85-94%
- C = 75-84%
- D = 65-74%
- F = < 65%

## Checks Applied (per entry)

1. **to_prefix_correct** -- verbs have "to " prefix, non-verbs do not
2. **pos_matches_en** -- POS tag is consistent with the English translation
3. **not_truncated** -- translation is not cut off mid-word
4. **not_self_referencing** -- translation does not just repeat the source word
5. **not_grammar_desc** -- translation is not a grammar description instead of a real translation
6. **not_mixed_case** -- no weird mixed-case issues
7. **is_real_english** -- translation is actual English, not gibberish
8. **reasonable_length** -- translation length is reasonable (not too short or too long)

## Overall Result

**11/11 languages at Grade A.** Average pass rate: 97.8%

Top performers: Russian (99.8%), Hindi (99.6%), Portuguese (99.2%)
Most remaining failures: French (24), Welsh (22), German (16), Swedish (16)

## Context

This review was run after:
- Full verb review passes for all 11 languages (fixing verb forms, POS tags, garbage semicolons, missing lemmas)
- "to " prefix additions to 1,165+ verb entries across IT/FR/DE/SV/CY/RU
- "to " prefix additions to 2,700+ Turkish verb entries
- Hindi verb review: 1,016 fixes
- Welsh verb review: 588 fixes
- Russian verb review: 858 fixes

Per-language details available in `{lang}-500-review.json` and `{lang}-v3-review.md` files.
