# Dictionary & Card Quality Overhaul — Master Plan

## Status: IN PROGRESS
## Current Step: 3A (Turkish dictionary merge) + starting 1B-1K (other language validation)

---

## Overview

Fix systemic quality issues across all 11 languages by:
1. Validating and cleaning cards (remove nonsense)
2. Building dictionaries from word-level alignment (not Wiktionary glosses)
3. Keeping Wiktionary only for IPA/POS/lemma metadata
4. Fixing card ordering by difficulty

---

## Phase 1: Card Validation

For each language, read every card and flag:
- **GARBAGE**: Target sentence is nonsense/ungrammatical
- **MISMATCH**: English translation doesn't match target
- **MIXED**: Target contains English words mixed in
- **DUPLICATE**: Near-duplicate of another card

Output: `scripts/output/{lang}-card-validation.json`

### Steps:
- [x] 1A: Turkish (3,933 cards) — DONE: 745 bad cards removed (21%), 3188 clean remain
- [ ] 1B: Hindi (3,933 cards)
- [ ] 1C: Russian (3,933 cards)
- [ ] 1D: Welsh (3,933 cards)
- [ ] 1E: German (3,933 cards)
- [ ] 1F: Dutch (3,933 cards)
- [ ] 1G: Swedish (3,933 cards)
- [ ] 1H: Spanish (3,935 cards)
- [ ] 1I: Italian (3,945 cards)
- [ ] 1J: French (3,927 cards)
- [ ] 1K: Portuguese (3,923 cards)

After validation: remove/fix flagged cards, commit.

---

## Phase 2: Word-Level Alignment

For each language, process every valid card:
- Split target sentence into tokens
- Align each token to its meaning using the card's English translation
- Aggregate across all cards to build dictionary entries
- Format: `{ word: { en: "aligned meaning", contexts: ["card1", "card2"] } }`

Output: `scripts/output/{lang}-word-alignments.json`

### Steps:
- [x] 2A: Turkish — DONE: 6055 unique words aligned from 3188 cards
- [ ] 2B: Hindi
- [ ] 2C: Russian
- [ ] 2D: Welsh
- [ ] 2E: German
- [ ] 2F: Dutch
- [ ] 2G: Swedish
- [ ] 2H: Spanish
- [ ] 2I: Italian
- [ ] 2J: French
- [ ] 2K: Portuguese

---

## Phase 3: Dictionary Rebuild (merge alignment + Wiktionary metadata)

For each language:
- Take translations from Phase 2 alignments
- Take IPA from Wiktionary (already extracted) + espeak-ng fallback
- Take POS from Wiktionary
- Take lemma from Wiktionary form-of relationships
- Write final dictionary .ts files

Output: Updated `src/data/dictionary/{lang}.ts`

### Steps:
- [ ] 3A: Build merge script
- [ ] 3B: Run for all 11 languages
- [ ] 3C: TypeScript compile check
- [ ] 3D: Spot-check 20 entries per language

---

## Phase 4: Card Reordering

For each language:
- Score cards by difficulty (word frequency, sentence length, grammar complexity)
- Reorder deck.json so easier cards come first
- Ensure grammar node progression makes sense

Output: Reordered `src/data/{language}/deck.json`

### Steps:
- [ ] 4A: Build reordering script
- [ ] 4B: Run for all 11 languages
- [ ] 4C: Verify first 50 cards per language are sensible beginner content

---

## Phase 5: Final Verification

- [ ] 5A: TypeScript compiles clean
- [ ] 5B: Dev server runs without errors
- [ ] 5C: Sample 10 cards per language in browser, verify dictionary popups
- [ ] 5D: Commit all changes

---

## Batch Processing Strategy

To handle 3,933 cards per language without losing context:
- Process in batches of 100 cards per agent
- Each agent writes results to a JSON file
- A merge script combines batch results
- Progress tracked in this file

---

## Files Created
- `scripts/output/` — all intermediate outputs
- `scripts/validate-cards.cjs` — card validation runner
- `scripts/align-words.cjs` — word alignment runner
- `scripts/merge-dict.cjs` — dictionary merge script
- `scripts/reorder-cards.cjs` — card reordering script
