# 500-Entry Dictionary Review Summary

Date: 2026-04-08
Sample size: 500 random entries per language

## Results

| Language | Entries | Checked | Passed | Failed | Rate | Grade |
|----------|---------|---------|--------|--------|------|-------|
| ES | 4725 | 500 | 490 | 10 | 98.0% | A |
| IT | 6725 | 500 | 493 | 7 | 98.6% | A |
| FR | 5502 | 500 | 474 | 26 | 94.8% | B |
| PT | 5480 | 500 | 494 | 6 | 98.8% | A |
| DE | 7872 | 500 | 488 | 12 | 97.6% | A |
| NL | 5998 | 500 | 474 | 26 | 94.8% | B |
| SV | 5298 | 500 | 484 | 16 | 96.8% | A |
| CY | 6108 | 500 | 475 | 25 | 95.0% | A |
| HI | 4743 | 500 | 499 | 1 | 99.8% | A |
| TR | 9688 | 500 | 490 | 10 | 98.0% | A |
| RU | 4760 | 500 | 496 | 4 | 99.2% | A |

## Failure Breakdown by Type

| Language | to_prefix | pos_mismatch | truncated | self_ref | grammar_desc | mixed_case | not_english | bad_length |
|----------|-----------|--------------|-----------|----------|--------------|------------|-------------|------------|
| ES | 0 | 0 | 0 | 9 | 0 | 0 | 1 | 0 |
| IT | 1 | 0 | 2 | 4 | 0 | 0 | 0 | 0 |
| FR | 2 | 0 | 0 | 24 | 0 | 0 | 0 | 0 |
| PT | 1 | 0 | 0 | 4 | 0 | 0 | 1 | 0 |
| DE | 2 | 0 | 0 | 9 | 0 | 0 | 2 | 0 |
| NL | 2 | 0 | 2 | 22 | 0 | 0 | 0 | 0 |
| SV | 0 | 0 | 5 | 10 | 0 | 0 | 1 | 0 |
| CY | 1 | 0 | 4 | 18 | 0 | 0 | 2 | 0 |
| HI | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| TR | 1 | 0 | 0 | 8 | 0 | 0 | 1 | 0 |
| RU | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Top Failure Examples per Language

### ES (Grade A, 98.0%)

- **in**: "in" (pos=n) -- self_ref
- **moscas**: "fly" (pos=n) -- not_english
- **color**: "color" (pos=n) -- self_ref
- **cartagena**: "cartagena" (pos=n) -- self_ref
- **picchu**: "picchu" (pos=n) -- self_ref
- **embargo**: "embargo" (pos=n) -- self_ref
- **beethoven**: "beethoven" (pos=n) -- self_ref
- **gabriel**: "gabriel" (pos=n) -- self_ref
- **barcelona**: "barcelona" (pos=n) -- self_ref
- **talavera**: "talavera" (pos=n) -- self_ref

### IT (Grade A, 98.6%)

- **weekend**: "weekend" (pos=n) -- self_ref
- **video**: "?" (pos=n) -- truncated
- **cost**: "cost" (pos=n) -- self_ref
- **programma**: "program; plan" (pos=v) -- to_prefix
- **villa**: "villa" (pos=n) -- self_ref
- **c**: "The third letter of the Italian alphabet, called ci and w..." (pos=n) -- truncated
- **souvenir**: "souvenir" (pos=n) -- self_ref

### FR (Grade B, 94.8%)

- **viable**: "viable" (pos=adj) -- self_ref
- **france**: "france" (pos=n) -- self_ref
- **cigarette**: "cigarette" (pos=n) -- self_ref
- **jaille**: "jaille" (pos=n) -- self_ref
- **perspective**: "perspective" (pos=n) -- self_ref
- **week**: "week" (pos=n) -- self_ref
- **effort**: "effort" (pos=adj) -- self_ref
- **horizon**: "horizon" (pos=n) -- self_ref
- **parachute**: "parachute" (pos=n) -- self_ref
- **importance**: "importance" (pos=n) -- self_ref

### PT (Grade A, 98.8%)

- **participem**: "interested; participate" (pos=v) -- to_prefix
- **céu**: "sky" (pos=n) -- not_english
- **gonzagão**: "gonzagão" (pos=n) -- self_ref
- **volume**: "volume" (pos=n) -- self_ref
- **site**: "site" (pos=n) -- self_ref
- **freelancer**: "freelancer" (pos=n) -- self_ref

### DE (Grade A, 97.6%)

- **dressing**: "dressing" (pos=n) -- self_ref
- **zucchini**: "zucchini" (pos=n) -- self_ref
- **argumentation**: "argumentation" (pos=n) -- self_ref
- **freut**: "forward; be happy" (pos=v) -- to_prefix
- **still**: "still" (pos=n) -- self_ref
- **hollandaise**: "hollandaise" (pos=n) -- self_ref
- **paragraph**: "paragraph" (pos=n) -- self_ref
- **schalte**: "turn; switch" (pos=v) -- to_prefix
- **pesto**: "pesto" (pos=n) -- self_ref
- **1900**: "1900" (pos=num) -- self_ref, not_english

### NL (Grade B, 94.8%)

- **camera**: "camera" (pos=n) -- self_ref
- **effect**: "effect" (pos=adj) -- self_ref
- **groningen**: "groningen" (pos=n) -- self_ref
- **jargon**: "jargon" (pos=n) -- self_ref
- **deal**: "deal" (pos=n) -- self_ref
- **fruit**: "fruit" (pos=n) -- self_ref
- **november**: "november" (pos=n) -- self_ref
- **vries**: "last; freeze" (pos=v) -- to_prefix
- **tram**: "tram" (pos=n) -- self_ref
- **online**: "online" (pos=n) -- self_ref

### SV (Grade A, 96.8%)

- **umeå**: "umeå" (pos=n) -- self_ref
- **museum**: "museum" (pos=n) -- self_ref
- **utvalda**: "?" (pos=n) -- truncated
- **dill**: "dill" (pos=n) -- self_ref
- **oslo**: "?" (pos=n) -- truncated
- **april**: "april" (pos=n) -- self_ref
- **uppenbara**: "?" (pos=adj) -- truncated
- **spotify**: "spotify" (pos=n) -- self_ref
- **arga**: "?" (pos=n) -- truncated
- **skyarna**: "sky" (pos=n) -- not_english

### CY (Grade A, 95.0%)

- **karaoke**: "karaoke" (pos=n) -- self_ref
- **lyncs**: "lynx" (pos=n) -- not_english
- **owain**: "owain" (pos=n) -- self_ref
- **sioned**: "sioned" (pos=n) -- self_ref
- **brioche**: "brioche" (pos=n) -- self_ref
- **adeiladwyd**: "building; construction" (pos=v) -- to_prefix
- **gwynedd**: "?" (pos=n) -- truncated
- **conwy**: "?" (pos=n) -- truncated
- **halloumi**: "halloumi" (pos=n) -- self_ref
- **constrictor**: "constrictor" (pos=n) -- self_ref

### HI (Grade A, 99.8%)

- **गुप्तचर**: "spy" (pos=n) -- not_english

### TR (Grade A, 98.0%)

- **kalıp**: "last; pattern" (pos=v) -- to_prefix
- **galata**: "galata" (pos=n) -- self_ref
- **sudan**: "sudan" (pos=n) -- self_ref
- **trabzonye**: "trabzonye" (pos=n) -- self_ref
- **gaziantep**: "gaziantep" (pos=n) -- self_ref
- **kurusu**: "dry" (pos=adj) -- not_english
- **pamukkale**: "pamukkale" (pos=n) -- self_ref
- **te**: "te" (pos=suff) -- self_ref
- **tundra**: "tundra" (pos=n) -- self_ref
- **post**: "post" (pos=n) -- self_ref

### RU (Grade A, 99.2%)

- **доехала**: "work; arrived" (pos=v) -- to_prefix
- **ходили**: "reason; walk" (pos=v) -- to_prefix
- **зовут**: "name; they call" (pos=v) -- to_prefix
- **кататься**: "last; ride" (pos=v) -- to_prefix

---
Grading: A=95%+, B=85-94%, C=75-84%, D=65-74%, F=<65%