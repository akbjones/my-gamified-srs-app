# 500-Entry Dictionary Review Summary

Date: 2026-04-09
Sample size: 500 random entries per language

## Results

| Language | Entries | Checked | Passed | Failed | Rate | Grade |
|----------|---------|---------|--------|--------|------|-------|
| ES | 4725 | 500 | 491 | 9 | 98.2% | A |
| IT | 6725 | 500 | 466 | 34 | 93.2% | B |
| FR | 5502 | 500 | 450 | 50 | 90.0% | B |
| PT | 5480 | 500 | 494 | 6 | 98.8% | A |
| DE | 7872 | 500 | 480 | 20 | 96.0% | A |
| NL | 5998 | 500 | 486 | 14 | 97.2% | A |
| SV | 5298 | 500 | 479 | 21 | 95.8% | A |
| CY | 6108 | 500 | 480 | 20 | 96.0% | A |
| HI | 4743 | 500 | 497 | 3 | 99.4% | A |
| TR | 9688 | 500 | 369 | 131 | 73.8% | D |
| RU | 4760 | 500 | 467 | 33 | 93.4% | B |

## Failure Breakdown by Type

| Language | to_prefix | pos_mismatch | truncated | self_ref | grammar_desc | mixed_case | not_english | bad_length |
|----------|-----------|--------------|-----------|----------|--------------|------------|-------------|------------|
| ES | 0 | 0 | 0 | 8 | 0 | 0 | 1 | 0 |
| IT | 30 | 0 | 9 | 2 | 0 | 0 | 2 | 0 |
| FR | 23 | 0 | 0 | 28 | 0 | 0 | 0 | 0 |
| PT | 1 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| DE | 6 | 0 | 0 | 13 | 0 | 0 | 1 | 0 |
| NL | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 |
| SV | 14 | 0 | 2 | 5 | 0 | 0 | 0 | 0 |
| CY | 1 | 0 | 5 | 13 | 0 | 0 | 2 | 0 |
| HI | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| TR | 121 | 0 | 0 | 9 | 0 | 0 | 2 | 0 |
| RU | 33 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Top Failure Examples per Language

### ES (Grade A, 98.2%)

- **oral**: "oral" (pos=adj) -- self_ref
- **oaxaca**: "oaxaca" (pos=n) -- self_ref
- **colonial**: "colonial" (pos=adj) -- self_ref
- **secos**: "dry" (pos=adj) -- not_english
- **quena**: "quena" (pos=n) -- self_ref
- **terrible**: "terrible" (pos=adj) -- self_ref
- **picchu**: "picchu" (pos=n) -- self_ref
- **artificial**: "artificial" (pos=adj) -- self_ref
- **debate**: "debate" (pos=n) -- self_ref

### IT (Grade B, 93.2%)

- **riceva**: "we\" (pos=v) -- to_prefix
- **capisca**: "understand (subjunctive)" (pos=v) -- to_prefix
- **rischi**: "?" (pos=v) -- to_prefix, truncated
- **accede**: "accesses, logs in" (pos=v) -- to_prefix
- **raggiunto**: "reach" (pos=v) -- to_prefix
- **tienimi**: "?" (pos=v) -- to_prefix, truncated
- **passaporto**: "pass" (pos=v) -- to_prefix
- **sola**: "?" (pos=n) -- truncated
- **arrivassi**: "arrive" (pos=v) -- to_prefix
- **tornato**: "return" (pos=v) -- to_prefix

### FR (Grade B, 90.0%)

- **réveillés**: "awake" (pos=v) -- to_prefix
- **court**: "short" (pos=v) -- to_prefix
- **vaille**: "worth" (pos=v) -- to_prefix
- **diagnostiqué**: "diagnostic" (pos=v) -- to_prefix
- **cause**: "cause" (pos=n) -- self_ref
- **guerres**: "war" (pos=v) -- to_prefix
- **conditions**: "condition" (pos=v) -- to_prefix
- **rempli**: "completed" (pos=v) -- to_prefix
- **écrits**: "writing" (pos=v) -- to_prefix
- **aggravait**: "aggravated" (pos=v) -- to_prefix

### PT (Grade A, 98.8%)

- **manual**: "manual" (pos=n) -- self_ref
- **tamo**: "we're" (pos=v) -- to_prefix
- **capoeira**: "capoeira" (pos=n) -- self_ref
- **lapa**: "lapa" (pos=n) -- self_ref
- **delivery**: "delivery" (pos=n) -- self_ref
- **sedex**: "sedex" (pos=n) -- self_ref

### DE (Grade A, 96.0%)

- **minister**: "minister" (pos=n) -- self_ref
- **smoothie**: "smoothie" (pos=n) -- self_ref
- **robust**: "robust" (pos=n) -- self_ref
- **verteilt**: "distributed" (pos=v) -- to_prefix
- **integration**: "integration" (pos=n) -- self_ref
- **laptop**: "laptop" (pos=n) -- self_ref
- **vorgestellt**: "introduced; presented" (pos=v) -- to_prefix
- **düsseldorf**: "düsseldorf" (pos=n) -- self_ref
- **verpasste**: "missed" (pos=v) -- to_prefix
- **dissertation**: "dissertation" (pos=n) -- self_ref

### NL (Grade A, 97.2%)

- **camera**: "camera" (pos=n) -- self_ref
- **hutspot**: "hutspot" (pos=n) -- self_ref
- **housewarming**: "housewarming" (pos=n) -- self_ref
- **specialist**: "specialist" (pos=n) -- self_ref
- **japan**: "japan" (pos=n) -- self_ref
- **laptop**: "laptop" (pos=n) -- self_ref
- **software**: "software" (pos=n) -- self_ref
- **monument**: "monument" (pos=n) -- self_ref
- **steel**: "steel" (pos=n) -- self_ref
- **jan**: "jan" (pos=n) -- self_ref

### SV (Grade A, 95.8%)

- **sattes**: "past passive indicative of sätta" (pos=v) -- to_prefix
- **tackar**: "received; thank" (pos=v) -- to_prefix
- **hörde**: "heard" (pos=v) -- to_prefix
- **accepterade**: "accepted" (pos=v) -- to_prefix
- **advent**: "advent" (pos=n) -- self_ref
- **brinnande**: "burning" (pos=v) -- to_prefix
- **rörliga**: "movable" (pos=v) -- to_prefix
- **anses**: "is considered" (pos=v) -- to_prefix
- **trend**: "trend" (pos=n) -- self_ref
- **utvalda**: "?" (pos=n) -- truncated

### CY (Grade A, 96.0%)

- **emyn**: "hymn" (pos=n) -- not_english
- **blentyn**: "?" (pos=n) -- truncated
- **codin**: "codeine" (pos=v) -- to_prefix
- **stamp**: "stamp" (pos=n) -- self_ref
- **phd**: "phd" (pos=n) -- self_ref, not_english
- **sahara**: "sahara" (pos=n) -- self_ref
- **ceilidh**: "ceilidh" (pos=n) -- self_ref
- **owen**: "?" (pos=n) -- truncated
- **cashmere**: "cashmere" (pos=n) -- self_ref
- **banjo**: "banjo" (pos=n) -- self_ref

### HI (Grade A, 99.4%)

- **सुखाओ**: "dry" (pos=adj) -- not_english
- **खिलाई**: "fed" (pos=v) -- to_prefix
- **सके**: "could" (pos=v) -- to_prefix

### TR (Grade D, 73.8%)

- **konuşuyorsunuz**: "talk" (pos=v) -- to_prefix
- **araştırıldı**: "research" (pos=v) -- to_prefix
- **kalkmalıyım**: "get up" (pos=v) -- to_prefix
- **mirası**: "legacy" (pos=v) -- to_prefix
- **arabası**: "car" (pos=v) -- to_prefix
- **taşımama**: "carrying" (pos=v) -- to_prefix
- **kurar**: "create" (pos=v) -- to_prefix
- **dir**: "dir" (pos=n) -- self_ref
- **kalkacaksın**: "get up" (pos=v) -- to_prefix
- **gelen**: "incoming" (pos=v) -- to_prefix

### RU (Grade B, 93.4%)

- **ходили**: "walk" (pos=v) -- to_prefix
- **разработал**: "developed" (pos=v) -- to_prefix
- **вернёшься**: "you will return" (pos=v) -- to_prefix
- **смогла**: "managed; was able" (pos=v) -- to_prefix
- **обсуждался**: "was discussed" (pos=v) -- to_prefix
- **обедали**: "were having lunch" (pos=v) -- to_prefix
- **обновил**: "update" (pos=v) -- to_prefix
- **мыл**: "washed" (pos=v) -- to_prefix
- **пришла**: "came; arrived" (pos=v) -- to_prefix
- **приближается**: "is approaching" (pos=v) -- to_prefix

---
Grading: A=95%+, B=85-94%, C=75-84%, D=65-74%, F=<65%