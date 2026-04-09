# Strict Semantic + Format Review Summary

Date: 2026-04-09
Sample size: 200 random entries per language (2200 total)

## Method

Each entry is checked for:
1. **Format**: to_prefix matches POS, not truncated, no mixed case, reasonable length
2. **Semantic**: re-translate source word via Google Translate, compare content words (lemmatized). FAIL if zero overlap.
3. **Bad patterns**: "to is/are/was", "to costs/came", "to friend/child", possessive nouns, trailing semicolons, etc.

An entry passes ONLY if ALL checks pass.

## Results

| Language | Dict Size | Checked | Passed | Failed | Rate | Grade |
|----------|-----------|---------|--------|--------|------|-------|
| ES | 4782 | 200 | 192 | 8 | 96% | A |
| IT | 6757 | 200 | 191 | 9 | 95.5% | A |
| FR | 5529 | 200 | 196 | 4 | 98% | A |
| PT | 5501 | 200 | 193 | 7 | 96.5% | A |
| DE | 7887 | 200 | 199 | 1 | 99.5% | A |
| NL | 6037 | 200 | 200 | 0 | 100% | A |
| SV | 5335 | 200 | 198 | 2 | 99% | A |
| CY | 6115 | 200 | 199 | 1 | 99.5% | A |
| HI | 4781 | 200 | 198 | 2 | 99% | A |
| TR | 9694 | 200 | 197 | 3 | 98.5% | A |
| RU | 4783 | 200 | 196 | 4 | 98% | A |
| **ALL** | — | 2200 | 2159 | 41 | 98.1% | A |

## Failure Breakdown by Type

| Language | semantic_fail | to_copula | to_past_tense |
|----------|---|---|---|
| ES | 8 | 0 | 0 |
| IT | 8 | 0 | 1 |
| FR | 3 | 0 | 1 |
| PT | 6 | 0 | 1 |
| DE | 0 | 0 | 1 |
| NL | 0 | 0 | 0 |
| SV | 0 | 2 | 0 |
| CY | 0 | 1 | 0 |
| HI | 2 | 0 | 0 |
| TR | 3 | 0 | 0 |
| RU | 4 | 0 | 0 |

## Top Failure Examples per Language

### ES (Grade A, 96%)

- **mantengamos**: "to let\" (pos=v) | GT: "Let's keep" — semantic_fail
- **más**: "more" (pos=adv) | GT: "further" — semantic_fail
- **probamos**: "to prove" (pos=v) | GT: "we tried" — semantic_fail
- **subieron**: "to increase" (pos=v) | GT: "they went up" — semantic_fail
- **bajé**: "to lower" (pos=v) | GT: "I went down" — semantic_fail
- **busqué**: "to look for" (pos=v) | GT: "I searched" — semantic_fail
- **programáramos**: "to program" (pos=v) | GT: "we would schedule" — semantic_fail
- **terminemos**: "to let\" (pos=v) | GT: "Let's finish." — semantic_fail

### IT (Grade A, 95.5%)

- **avvisassi**: "to advise" (pos=v) | GT: "I warned you" — semantic_fail
- **intende**: "to understand" (pos=v) | GT: "he means" — semantic_fail
- **formazione**: "to form" (pos=v) | GT: "training" — semantic_fail
- **sediamo**: "to let\" (pos=v) | GT: "let's sit down" — semantic_fail
- **divertiti**: "to entertain" (pos=v) | GT: "have fun" — semantic_fail
- **occorre**: "to take" (pos=v) | GT: "it is necessary" — semantic_fail
- **divertiresti**: "to entertain" (pos=v) | GT: "you would have fun" — semantic_fail
- **tornerò**: "i\" (pos=n) | GT: "I'll be back" — semantic_fail
- **costerebbe**: "to cost" (pos=v) | GT: "it would cost" — to_past_tense

### FR (Grade A, 98%)

- **coûte**: "to cost" (pos=v) | GT: "costs" — to_past_tense
- **voudriez**: "to want" (pos=v) | GT: "would you like" — semantic_fail
- **reviendrai**: "to goodbye" (pos=v) | GT: "will return" — semantic_fail
- **dinaient**: "dined" (pos=n) | GT: "dinner" — semantic_fail

### PT (Grade A, 96.5%)

- **tiraria**: "to throw" (pos=v) | GT: "I would take" — semantic_fail
- **guardamos**: "to save" (pos=v) | GT: "we keep" — semantic_fail
- **mando**: "to send" (pos=v) | GT: "I command" — semantic_fail
- **digo**: "to say" (pos=v) | GT: "I mean" — semantic_fail
- **guardei**: "to save" (pos=v) | GT: "I kept" — semantic_fail
- **acompanho**: "i\" (pos=n) | GT: "I'm following" — semantic_fail
- **custa**: "to cost" (pos=v) | GT: "costs" — to_past_tense

### DE (Grade A, 99.5%)

- **mussten**: "to had to" (pos=v) | GT: "had to" — to_past_tense

### SV (Grade A, 99%)

- **skrevs**: "to was written" (pos=v) | GT: "was written" — to_copula
- **följdes**: "to was followed" (pos=v) | GT: "was followed" — to_copula

### CY (Grade A, 99.5%)

- **cynhaliwyd**: "to was held" (pos=v) | GT: "was held" — to_copula

### HI (Grade A, 99%)

- **रही**: "to stay" (pos=v) | GT: "doing" — semantic_fail
- **पड़ा**: "to fall" (pos=v) | GT: "had" — semantic_fail

### TR (Grade A, 98.5%)

- **sorumluluğumuzdur**: "to ask" (pos=v) | GT: "It is our responsibility" — semantic_fail
- **kayıyor**: "to cream" (pos=v) | GT: "sliding" — semantic_fail
- **yemiyoruz**: "to cooked, to food" (pos=v) | GT: "we don't eat" — semantic_fail

### RU (Grade A, 98%)

- **успеешь**: "you\" (pos=n) | GT: "you'll make it" — semantic_fail
- **умываюсь**: "i\" (pos=n) | GT: "I'm washing my face" — semantic_fail
- **учишь**: "to study" (pos=v) | GT: "you teach" — semantic_fail
- **придёшь**: "you\" (pos=n) | GT: "you'll come" — semantic_fail

---
Grading: A=95%+, B=85-94%, C=75-84%, D=65-74%, F=<65%