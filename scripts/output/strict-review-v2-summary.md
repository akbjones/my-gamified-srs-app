# Strict Semantic + Format Review Summary

Date: 2026-04-10
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
| ES | 4782 | 200 | 196 | 4 | 98% | A |
| IT | 6757 | 200 | 195 | 5 | 97.5% | A |
| FR | 5529 | 200 | 196 | 4 | 98% | A |
| PT | 5501 | 200 | 195 | 5 | 97.5% | A |
| DE | 7887 | 200 | 200 | 0 | 100% | A |
| NL | 6037 | 200 | 200 | 0 | 100% | A |
| SV | 5335 | 200 | 194 | 6 | 97% | A |
| CY | 6116 | 200 | 196 | 4 | 98% | A |
| HI | 4781 | 200 | 197 | 3 | 98.5% | A |
| TR | 9694 | 200 | 195 | 5 | 97.5% | A |
| RU | 4783 | 200 | 197 | 3 | 98.5% | A |
| **ALL** | — | 2200 | 2161 | 39 | 98.2% | A |

## Failure Breakdown by Type

| Language | semantic_fail | to_copula | to_noun | to_past_tense | to_prefix |
|----------|---|---|---|---|---|
| ES | 3 | 0 | 0 | 0 | 1 |
| IT | 4 | 0 | 1 | 0 | 0 |
| FR | 2 | 0 | 0 | 2 | 0 |
| PT | 5 | 0 | 0 | 0 | 0 |
| DE | 0 | 0 | 0 | 0 | 0 |
| NL | 0 | 0 | 0 | 0 | 0 |
| SV | 1 | 3 | 1 | 1 | 0 |
| CY | 4 | 0 | 0 | 0 | 0 |
| HI | 3 | 0 | 0 | 0 | 0 |
| TR | 5 | 0 | 0 | 0 | 0 |
| RU | 1 | 0 | 0 | 0 | 2 |

## Top Failure Examples per Language

### ES (Grade A, 98%)

- **debe**: "to duty" (pos=v) | GT: "has to" — semantic_fail
- **respondiera**: "to reply" (pos=v) | GT: "would respond" — semantic_fail
- **subieron**: "to increase" (pos=v) | GT: "they went up" — semantic_fail
- **¿recibiste**: "did you receive" (pos=v) | GT: "Did you receive" — to_prefix

### IT (Grade A, 97.5%)

- **divertite**: "to entertain" (pos=v) | GT: "have fun" — semantic_fail
- **avviso**: "to advise" (pos=v) | GT: "I notify" — semantic_fail
- **importa**: "to import" (pos=v) | GT: "it matters" — semantic_fail
- **collocare**: "to place" (pos=v) | GT: "place" — to_noun
- **desidereremmo**: "to desire" (pos=v) | GT: "we would like" — semantic_fail

### FR (Grade A, 98%)

- **coûte**: "to cost" (pos=v) | GT: "costs" — to_past_tense
- **coûté**: "to cost" (pos=v) | GT: "cost" — to_past_tense
- **adorerais**: "to worship" (pos=v) | GT: "would love it" — semantic_fail
- **souhaiterais**: "to wish" (pos=v) | GT: "would like" — semantic_fail

### PT (Grade A, 97.5%)

- **passei**: "to stroll" (pos=v) | GT: "I passed" — semantic_fail
- **acordou**: "to wake up" (pos=v) | GT: "he remembered" — semantic_fail
- **sentindo**: "to sit" (pos=v) | GT: "feeling" — semantic_fail
- **emociona**: "to thrill" (pos=v) | GT: "exciting" — semantic_fail
- **sentira**: "to sit" (pos=v) | GT: "had felt" — semantic_fail

### SV (Grade A, 97%)

- **invigdes**: "to was inaugurated" (pos=v) | GT: "was inaugurated" — to_copula
- **mättes**: "to was measured" (pos=v) | GT: "was measured" — to_copula
- **skulle**: "to said" (pos=v) | GT: "would" — to_past_tense
- **lämnar**: "to leave" (pos=v) | GT: "leaves" — semantic_fail
- **godkändes**: "to was approved" (pos=v) | GT: "was approved" — to_copula
- **plats**: "to place" (pos=v) | GT: "place" — to_noun

### CY (Grade A, 98%)

- **leiaf**: "minimum" (pos=adj) | GT: "least" — semantic_fail
- **tain**: "tin" (pos=n) | GT: "tain" — semantic_fail
- **amrywiaeth**: "variety" (pos=n) | GT: "diversity" — semantic_fail
- **gwisgodd**: "to wear" (pos=v) | GT: "he dressed" — semantic_fail

### HI (Grade A, 98.5%)

- **अभिज्ञानशाकुंतलम**: "abhigyanashakuntalam" (pos=n) | GT: "Abhijnanashakuntalam" — semantic_fail
- **पड़ा**: "to fall" (pos=v) | GT: "had" — semantic_fail
- **रहे**: "to stay" (pos=v) | GT: "are" — semantic_fail

### TR (Grade A, 97.5%)

- **kayıyor**: "to cream" (pos=v) | GT: "sliding" — semantic_fail
- **uyuyorsunuz**: "to suit" (pos=v) | GT: "You are sleeping" — semantic_fail
- **sürüyordu**: "to spread" (pos=v) | GT: "was continuing" — semantic_fail
- **hazırlandım**: "to prepare" (pos=v) | GT: "I got ready" — semantic_fail
- **tanıyor**: "to recognise" (pos=v) | GT: "He knows" — semantic_fail

### RU (Grade A, 98.5%)

- **вернёмся**: "we\" (pos=n) | GT: "we'll be back" — semantic_fail
- **напишу**: "to write" (pos=n) | GT: "I'll write" — to_prefix
- **открою**: "to open it" (pos=n) | GT: "I'll open it" — to_prefix

---
Grading: A=95%+, B=85-94%, C=75-84%, D=65-74%, F=<65%