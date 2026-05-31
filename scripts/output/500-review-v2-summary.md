# 500-Entry Dictionary Review Summary

Date: 2026-04-09
Sample size: 500 random entries per language

## Results

| Language | Entries | Checked | Passed | Failed | Rate | Grade |
|----------|---------|---------|--------|--------|------|-------|
| ES | 4725 | 500 | 490 | 10 | 98.0% | A |
| IT | 6725 | 500 | 492 | 8 | 98.4% | A |
| FR | 5502 | 500 | 482 | 18 | 96.4% | A |
| PT | 5480 | 500 | 493 | 7 | 98.6% | A |
| DE | 7872 | 500 | 485 | 15 | 97.0% | A |
| NL | 5998 | 500 | 480 | 20 | 96.0% | A |
| SV | 5298 | 500 | 486 | 14 | 97.2% | A |
| CY | 6108 | 500 | 475 | 25 | 95.0% | A |
| HI | 4743 | 500 | 497 | 3 | 99.4% | A |
| TR | 9688 | 500 | 483 | 17 | 96.6% | A |
| RU | 4760 | 500 | 498 | 2 | 99.6% | A |

## Failure Breakdown by Type

| Language | to_prefix | pos_mismatch | truncated | self_ref | grammar_desc | mixed_case | not_english | bad_length |
|----------|-----------|--------------|-----------|----------|--------------|------------|-------------|------------|
| ES | 3 | 0 | 0 | 7 | 0 | 0 | 1 | 0 |
| IT | 1 | 1 | 0 | 6 | 0 | 0 | 1 | 0 |
| FR | 0 | 0 | 0 | 18 | 0 | 0 | 1 | 0 |
| PT | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 0 |
| DE | 0 | 0 | 0 | 14 | 0 | 1 | 1 | 0 |
| NL | 8 | 1 | 0 | 12 | 0 | 0 | 0 | 0 |
| SV | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 |
| CY | 0 | 0 | 4 | 20 | 0 | 0 | 1 | 0 |
| HI | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 0 |
| TR | 11 | 2 | 0 | 6 | 0 | 0 | 0 | 0 |
| RU | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

## Top Failure Examples per Language

### ES (Grade A, 98.0%)

- **gas**: "gas" (pos=n) -- self_ref
- **eras**: "eras" (pos=v) -- to_prefix, self_ref
- **parques**: "parks" (pos=v) -- to_prefix
- **terrible**: "terrible" (pos=adj) -- self_ref
- **paredes**: "walls" (pos=v) -- to_prefix
- **color**: "color" (pos=n) -- self_ref
- **tímido**: "shy" (pos=adj) -- not_english
- **late**: "late" (pos=adj) -- self_ref
- **michelin**: "michelin" (pos=n) -- self_ref
- **crisis**: "crisis" (pos=n) -- self_ref

### IT (Grade A, 98.4%)

- **dessert**: "dessert" (pos=n) -- self_ref
- **rose**: "rose" (pos=n) -- self_ref
- **medicine**: "medicine" (pos=n) -- self_ref
- **ritmi**: "rhythms" (pos=n) -- not_english
- **budget**: "budget" (pos=n) -- self_ref
- **mario**: "mario" (pos=n) -- self_ref
- **no**: "no" (pos=n) -- self_ref
- **gliela**: "to her/him (object pronoun)" (pos=n) -- to_prefix, pos_mismatch

### FR (Grade A, 96.4%)

- **million**: "million" (pos=n) -- self_ref
- **patient**: "patient" (pos=n) -- self_ref
- **president**: "president" (pos=n) -- self_ref
- **passion**: "passion" (pos=n) -- self_ref
- **six**: "six" (pos=n) -- self_ref
- **portrait**: "portrait" (pos=n) -- self_ref
- **contact**: "contact" (pos=n) -- self_ref
- **tesvous**: "tesvous" (pos=n) -- self_ref
- **rat**: "rat" (pos=n) -- self_ref
- **tgv**: "tgv" (pos=n) -- self_ref, not_english

### PT (Grade A, 98.6%)

- **baião**: "baião" (pos=n) -- self_ref
- **bourdieu**: "bourdieu" (pos=n) -- self_ref
- **item**: "item" (pos=n) -- self_ref
- **is**: "is" (pos=n) -- self_ref
- **exemplar**: "exemplar" (pos=adj) -- self_ref
- **food**: "food" (pos=n) -- self_ref
- **caipirinha**: "caipirinha" (pos=n) -- self_ref

### DE (Grade A, 97.0%)

- **tablet**: "tablet" (pos=n) -- self_ref
- **oregano**: "oregano" (pos=n) -- self_ref
- **variable**: "variable" (pos=n) -- self_ref
- **schnitzel**: "schnitzel" (pos=n) -- self_ref
- **neuschwanstein**: "neuschwanstein" (pos=n) -- self_ref
- **triangulation**: "triangulation" (pos=n) -- self_ref
- **ticket**: "ticket" (pos=n) -- self_ref
- **ice**: "ice" (pos=n) -- self_ref
- **japan**: "japan" (pos=n) -- self_ref
- **promoviert**: "PhD" (pos=n) -- mixed_case, not_english

### NL (Grade A, 96.0%)

- **product**: "product" (pos=adj) -- self_ref
- **bekijken**: "review; look at" (pos=v) -- to_prefix
- **echo**: "echo" (pos=n) -- self_ref
- **steel**: "steel" (pos=n) -- self_ref
- **langst**: "longest" (pos=v) -- to_prefix
- **amsterdam**: "amsterdam" (pos=n) -- self_ref
- **max**: "max" (pos=adv) -- self_ref
- **trof**: "struck; met" (pos=v) -- to_prefix
- **sprinter**: "sprinter" (pos=n) -- self_ref
- **bitterballen**: "bitterballen" (pos=n) -- self_ref

### SV (Grade A, 97.2%)

- **paradox**: "paradox" (pos=n) -- self_ref
- **symbol**: "symbol" (pos=n) -- self_ref
- **doggy**: "doggy" (pos=n) -- self_ref
- **kiruna**: "kiruna" (pos=n) -- self_ref
- **origami**: "origami" (pos=n) -- self_ref
- **tradition**: "tradition" (pos=n) -- self_ref
- **museum**: "museum" (pos=n) -- self_ref
- **smoothie**: "smoothie" (pos=n) -- self_ref
- **gotland**: "gotland" (pos=n) -- self_ref
- **dessert**: "dessert" (pos=n) -- self_ref

### CY (Grade A, 95.0%)

- **pero**: "pero" (pos=conj) -- self_ref
- **nramar**: "nramar" (pos=n) -- self_ref
- **mwyalchen**: "?" (pos=n) -- truncated
- **caernarfon**: "caernarfon" (pos=n) -- self_ref
- **marathon**: "marathon" (pos=n) -- self_ref
- **thesis**: "thesis" (pos=n) -- self_ref
- **caesar**: "caesar" (pos=n) -- self_ref
- **manon**: "manon" (pos=n) -- self_ref
- **wi-fi**: "?" (pos=n) -- truncated
- **mango**: "?" (pos=n) -- truncated

### HI (Grade A, 99.4%)

- **मक्खियाँ**: "fly" (pos=n) -- not_english
- **पीजिए**: "please drink" (pos=v) -- to_prefix
- **आसमान**: "sky" (pos=n) -- not_english

### TR (Grade A, 96.6%)

- **gezi**: "gezi" (pos=n) -- self_ref
- **serkane**: "serkane" (pos=n) -- self_ref
- **görmektedir**: "sees" (pos=v) -- to_prefix
- **ye**: "ye" (pos=n) -- self_ref
- **kullanarak**: "using" (pos=v) -- to_prefix
- **ecein**: "ecein" (pos=n) -- self_ref
- **kurmuştur**: "has established" (pos=v) -- to_prefix
- **süredir**: "for a long time" (pos=v) -- to_prefix
- **izlenim**: "impression" (pos=v) -- to_prefix
- **antep**: "antep" (pos=n) -- self_ref

### RU (Grade A, 99.6%)

- **идём**: "let\" (pos=v) -- to_prefix
- **придёшь**: "to come; to arrive" (pos=n) -- to_prefix, pos_mismatch

---
Grading: A=95%+, B=85-94%, C=75-84%, D=65-74%, F=<65%