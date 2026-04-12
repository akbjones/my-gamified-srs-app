# 500-Entry Dictionary Review - Final Summary

**Date:** 2026-04-08
**Script:** `scripts/500-review-all.cjs`
**Method:** 500 random dictionary entries per language checked for: `to_prefix_correct`, `pos_matches_en`, `not_truncated`, `not_self_referencing`, `not_grammar_desc`, `not_mixed_case`, `is_real_english`, `reasonable_length`

**Grading:** A = 95%+, B = 85-94%, C = 75-84%, D = 65-74%, F = <65%

---

## Results

| Language   | Entries | Checked | Passed | Failed | Rate   | Grade |
|------------|---------|---------|--------|--------|--------|-------|
| Spanish    | 4725    | 500     | 490    | 10     | 98.0%  | **A** |
| Italian    | 6725    | 500     | 492    | 8      | 98.4%  | **A** |
| French     | 5502    | 500     | 482    | 18     | 96.4%  | **A** |
| Portuguese | 5480    | 500     | 493    | 7      | 98.6%  | **A** |
| German     | 7872    | 500     | 485    | 15     | 97.0%  | **A** |
| Dutch      | 5998    | 500     | 480    | 20     | 96.0%  | **A** |
| Swedish    | 5298    | 500     | 486    | 14     | 97.2%  | **A** |
| Welsh      | 6108    | 500     | 475    | 25     | 95.0%  | **A** |
| Hindi      | 4743    | 500     | 497    | 3      | 99.4%  | **A** |
| Turkish    | 9688    | 500     | 483    | 17     | 96.6%  | **A** |
| Russian    | 4760    | 500     | 498    | 2      | 99.6%  | **A** |

**Overall: 11/11 languages Grade A (95%+)**

---

## Failure Breakdown by Type

| Issue Type     | ES | IT | FR | PT | DE | NL | SV | CY | HI | TR | RU | Total |
|----------------|----|----|----|----|----|----|----|----|----|----|----|----- |
| self_ref       | 7  | 6  | 18 | 7  | 14 | 12 | 14 | 20 | 0  | 6  | 0  | 104   |
| to_prefix      | 3  | 1  | 0  | 0  | 0  | 8  | 0  | 0  | 1  | 11 | 2  | 26    |
| not_english    | 1  | 1  | 1  | 0  | 1  | 0  | 0  | 1  | 2  | 0  | 0  | 7     |
| pos_mismatch   | 0  | 1  | 0  | 0  | 0  | 1  | 0  | 0  | 0  | 2  | 1  | 5     |
| truncated      | 0  | 0  | 0  | 0  | 0  | 0  | 0  | 4  | 0  | 0  | 0  | 4     |
| mixed_case     | 0  | 0  | 0  | 0  | 1  | 0  | 0  | 0  | 0  | 0  | 0  | 1     |

### Notes

- **self_ref** (104 total): Dominant issue. These are cognates/loanwords where the target-language word is identical to the English translation (e.g., FR "million" = "million", DE "tablet" = "tablet"). Most are legitimate entries, not real errors.
- **to_prefix** (26 total): Verb entries missing the "to " prefix. NL (8) and TR (11) account for most. Recent verb review passes fixed the majority.
- **not_english** (7 total): Entries with translations that may not be standard English words. Mostly proper nouns or cultural terms.
- **pos_mismatch** (5 total): Part-of-speech tag doesn't match the English translation pattern.
- **truncated** (4 total): All in Welsh - entries with incomplete or placeholder translations.
- **mixed_case** (1 total): Single German entry with inconsistent casing.

---

## Verdict

All 11 languages score Grade A (95%+). The remaining failures are predominantly false positives from cognates (self_ref) which are correct entries. True errors are minimal - approximately 1-2% across all languages. Dictionary quality is production-ready.
