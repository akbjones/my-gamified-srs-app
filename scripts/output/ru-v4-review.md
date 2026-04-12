# Russian Dictionary v3 Rebuild — 100-Entry Deep Review

**Date:** 2026-04-04
**Total entries written:** 4760
**Script:** `rebuild-ru-dict-v3.cjs`
**TypeScript:** PASS (no errors)

## Automated Review Results (from script)

**Pass:** 72 / 100
**Fail:** 28 / 100
**Grade:** C

## Manual Deep-Dive: 100-Entry Spot-Check Across Full Dictionary

Sampled 100 entries evenly across the 4760-entry dictionary (lines ~8-80, ~500-580, ~1500-1580, ~2500-2580, ~3500-3580, ~4500-4550). Each entry checked for:

1. **Wrong translation** — English doesn't match the Russian word
2. **Wrong POS** — noun tagged as verb, verb as noun, etc.
3. **Spurious "to" prefix** — "to beautiful", "to cold" on non-verbs
4. **Missing "to" prefix** — verbs without infinitive marker
5. **Context bleed** — translation is a nearby word from the sentence, not the target
6. **Conjugated English** — past tense / -ing form instead of base form for verbs
7. **Empty IPA** — missing pronunciation
8. **Self-referencing** — translation is the Russian word transliterated

### Issues Found (100 entries, 33 failures)

| # | Word | Got | Expected | POS | Pitfall |
|---|------|-----|----------|-----|---------|
| 1 | бегут | to children | to run | v | wrong_translation, context_bleed |
| 2 | балет | to ballet | ballet | n | wrong_pos, spurious_to |
| 3 | байкал | to baikal | Baikal | n | wrong_pos, spurious_to |
| 4 | аудитории | auditorium after | auditorium | n | fragment_suffix |
| 5 | бабушкой | grandmother | grandmother | adj→n | wrong_pos |
| 6 | вывел | to teacher | to lead out | v | wrong_translation, context_bleed |
| 7 | выглядел | look | to look | n→v | wrong_pos, missing_to |
| 8 | выглядит | to looks | to look | v | conjugated_english |
| 9 | выгравировала | to engraved | to engrave | v | conjugated_english |
| 10 | выделывал | to tanner | to process/tan | v | context_bleed |
| 11 | выписал | to optician | to prescribe | v | context_bleed |
| 12 | выполнены | conditions | fulfilled | n | wrong_translation, context_bleed |
| 13 | выполнила | gymnast | to perform | n | wrong_translation, context_bleed |
| 14 | выросла | price | to grow | n | wrong_translation, context_bleed |
| 15 | высаживают | main roads | to plant | n | wrong_translation, context_bleed |
| 16 | высекал | to sculptor | to carve | v | context_bleed |
| 17 | высокую | to tall | tall | v→adj | wrong_pos, spurious_to |
| 18 | высоте | plane | altitude | n | wrong_translation, context_bleed |
| 19 | выступил | to school | to perform | v | wrong_translation, context_bleed |
| 20 | вытащишь | to without | to pull out | v | wrong_translation, context_bleed |
| 21 | вылепил | to potter | to sculpt | v | context_bleed |
| 22 | вылетел | to plane | to fly out | v | context_bleed |
| 23 | выиграл | to won | to win | v | conjugated_english |
| 24 | выпечкой | kitchen | pastry | adj | wrong_translation, context_bleed |
| 25 | выноcливее | running | more enduring | adj | wrong_translation |
| 26 | красивую | to beautiful | beautiful | v→adj | wrong_pos, spurious_to |
| 27 | крепкую | to strong | strong | v→adj | wrong_pos, spurious_to |
| 28 | свежую | to fresh | fresh | v→adj | wrong_pos, spurious_to |
| 29 | холодную | to cold | cold | v→adj | wrong_pos, spurious_to |
| 30 | хорошую | to good | good | v→adj | wrong_pos, spurious_to |
| 31 | которую | to book | which | v→adj | wrong_translation, spurious_to |
| 32 | которая | girl | which | adj | wrong_translation, context_bleed |
| 33 | которому | doctor | to whom | adj | wrong_translation, context_bleed |
| 34 | которое | window | which | adj | wrong_translation, context_bleed |
| 35 | конная | troika | equestrian | adj | wrong_translation, context_bleed |
| 36 | копил | to dreaming | to save up | v | wrong_translation |
| 37 | кратковременного | rainbow | short-term | adj | wrong_translation, context_bleed |
| 38 | кончится | rain stops | to end | n | wrong_translation, context_bleed |
| 39 | крайнего | anthropologist | extreme | adj | wrong_translation, context_bleed |
| 40 | пенящимися | dolphin | foaming | n | wrong_translation, context_bleed |
| 41 | перебежала | to black | to run across | v | wrong_translation, context_bleed |
| 42 | переведены | money | translated | n | wrong_translation, context_bleed |
| 43 | перешла | to daughter moved | to cross/move | v | context_bleed, fragment |
| 44 | перчатки | whose | gloves | n | wrong_translation, context_bleed |
| 45 | перчаток | tanner | gloves | n | wrong_translation, context_bleed |
| 46 | пила | to see | to drink/saw | v | wrong_translation |
| 47 | передайте | kind | pass/hand over | n | wrong_translation, context_bleed |
| 48 | переплёт | to binding | binding | v→n | wrong_pos, spurious_to |
| 49 | своём | to in his own | in one's own | v→adj | wrong_pos, spurious_to |
| 50 | сваренный | to boiled | boiled | v | conjugated_english, spurious_to |
| 51 | сбежал | to ran | to run away | v | conjugated_english |
| 52 | хотел | to wanted | to want | v | conjugated_english |
| 53 | хотела | to wanted | to want | v | conjugated_english |
| 54 | хотели | to wanted | to want | v | conjugated_english |
| 55 | хотелось | to wanted to | to want | v | conjugated_english |
| 56 | хотите | to do you want | to want | v | fragment_question |
| 57 | ходят | theater | to walk | n | wrong_translation, context_bleed |
| 58 | хожу | work | to walk | n | wrong_translation, context_bleed |
| 59 | хозяев | having | owners | n | wrong_translation |
| 60 | хранит | to deep | to keep/store | v | wrong_translation, context_bleed |
| 61 | хочу | want | to want | n→v | wrong_pos, missing_to |
| 62 | хочется | child | to feel like | n | wrong_translation, context_bleed |
| 63 | хотят | want | to want | n→v | wrong_pos, missing_to |

### Pass Examples (37 of 100 that are correct)

| Word | English | POS | Notes |
|------|---------|-----|-------|
| автобус | bus | n | correct |
| аптека | pharmacy | n | correct |
| бабушка | grandmother | n | correct |
| выбор | choice | n | correct |
| выбрать | to choose | v | correct |
| кофе | coffee | n | correct |
| компьютер | computer | n | correct |
| снег | snow | n | correct |
| рыба | fish | n | correct |
| самолёт | airplane | n | correct |
| хорошо | well/good | adv | correct |
| холодно | cold | adv | correct |

## Pitfall Breakdown

| Pitfall Type | Count | % of Failures |
|--------------|-------|---------------|
| context_bleed (translation is a nearby sentence word) | 35 | 56% |
| wrong_translation (unrelated meaning) | 30 | 48% |
| wrong_pos (verb<->noun, adj<->verb, etc.) | 18 | 29% |
| spurious_to ("to beautiful", "to cold") | 10 | 16% |
| conjugated_english ("to wanted", "to engraved") | 9 | 14% |
| missing_to (verb without "to" prefix) | 3 | 5% |
| fragment/suffix leftovers | 3 | 5% |

**Note:** Many entries have multiple pitfalls simultaneously.

## Systemic Patterns

### 1. Accusative feminine adjective forms universally broken
All `-ую` ending adjectives (красивую, крепкую, свежую, холодную, хорошую, высокую) get translated as `"to [adjective]"` with POS `v`. The pipeline mistakes the Google Translate output pattern for these forms.

### 2. Massive context bleed from Google Translate
Google Translate is returning sentence-context words instead of word-level translations for ~35% of the sampled failures. Words like `перчатки` ("gloves") getting "whose", `высаживают` ("to plant") getting "main roads", `ходят` getting "theater".

### 3. Relative pronouns (который forms) all wrong
Every declined form of `который` (which) gets a random context word: "girl", "window", "doctor", "book".

### 4. Verb past tense forms carry English past tense
The lemmatization step copies `"to [past tense]"` from Google: "to wanted", "to engraved", "to won", "to ran".

### 5. Non-lemmatized verb forms getting noun POS
Many conjugated verbs (хожу, хочу, хотят, ходят) are tagged as nouns with random English words.

## Summary

| Metric | Value |
|--------|-------|
| Automated pass rate | 72% |
| Manual pass rate (deep check) | ~37% |
| Entries written | 4760 |
| TypeScript | PASS |
| **Grade** | **C** |

The automated review catches structural issues (wrong POS, spurious "to") but underdetects context bleed and wrong translations. The actual quality is lower than the automated 72% suggests. The main bottleneck is Google Translate returning sentence-level context rather than word-level definitions, especially for inflected forms.
