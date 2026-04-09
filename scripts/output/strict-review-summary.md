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
| ES | 4782 | 200 | 163 | 37 | 81.5% | C |
| IT | 6757 | 200 | 174 | 26 | 87% | B |
| FR | 5529 | 200 | 173 | 27 | 86.5% | B |
| PT | 5501 | 200 | 176 | 24 | 88% | B |
| DE | 7887 | 200 | 184 | 16 | 92% | B |
| NL | 6037 | 200 | 176 | 24 | 88% | B |
| SV | 5335 | 200 | 189 | 11 | 94.5% | B |
| CY | 6115 | 200 | 196 | 4 | 98% | A |
| HI | 4781 | 200 | 195 | 5 | 97.5% | A |
| TR | 9694 | 200 | 173 | 27 | 86.5% | B |
| RU | 4783 | 200 | 166 | 34 | 83% | C |
| **ALL** | — | 2200 | 1965 | 235 | 89.3% | B |

## Failure Breakdown by Type

| Language | semantic_fail | to_capitalized | to_copula | to_noun | to_past_tense | to_prefix |
|----------|---|---|---|---|---|---|
| ES | 19 | 0 | 0 | 0 | 0 | 18 |
| IT | 17 | 0 | 0 | 0 | 0 | 9 |
| FR | 12 | 1 | 0 | 0 | 0 | 14 |
| PT | 21 | 0 | 0 | 0 | 0 | 4 |
| DE | 5 | 0 | 0 | 1 | 0 | 11 |
| NL | 11 | 0 | 0 | 1 | 1 | 11 |
| SV | 10 | 0 | 0 | 1 | 3 | 0 |
| CY | 3 | 0 | 1 | 0 | 0 | 0 |
| HI | 5 | 0 | 0 | 0 | 0 | 0 |
| TR | 8 | 0 | 0 | 0 | 0 | 19 |
| RU | 6 | 0 | 0 | 0 | 0 | 28 |

## Top Failure Examples per Language

### ES (Grade C, 81.5%)

- **cuentan**: "to count" (pos=v) | GT: "they say" — semantic_fail
- **mudó**: "to move" (pos=v) | GT: "dumb" — semantic_fail
- **odio**: "hate" (pos=v) | GT: "hate" — to_prefix
- **queden**: "to meet" (pos=v) | GT: "remain" — semantic_fail
- **renuncia**: "to give up" (pos=v) | GT: "resignation" — semantic_fail
- **hace**: "to do/make" (pos=v) | GT: "does" — semantic_fail
- **parque**: "to stall" (pos=v) | GT: "park" — semantic_fail
- **domingos**: "to master" (pos=v) | GT: "Sundays" — semantic_fail
- **partido**: "to start" (pos=v) | GT: "game" — semantic_fail
- **cancelemos**: "let\\" (pos=n) | GT: "Let's cancel" — semantic_fail
- **prestaste**: "to lend" (pos=v) | GT: "you lent" — semantic_fail
- **supermercado**: "supermarket" (pos=v) | GT: "supermarket" — to_prefix
- **levantarme**: "get up" (pos=v) | GT: "get up" — to_prefix
- **mar**: "sea" (pos=v) | GT: "sea" — to_prefix
- **control**: "to count" (pos=v) | GT: "control" — semantic_fail

### IT (Grade B, 87%)

- **vivevo**: "to live" (pos=v) | GT: "I lived" — semantic_fail
- **offerta**: "offer" (pos=v) | GT: "offer" — to_prefix
- **suono**: "to play" (pos=v) | GT: "sound" — semantic_fail
- **rinunceresti**: "to renounce" (pos=v) | GT: "you would give up" — semantic_fail
- **valigia**: "to be worth" (pos=v) | GT: "suitcase" — semantic_fail
- **trasferissi**: "to transfer" (pos=v) | GT: "I moved" — semantic_fail
- **unico**: "to unite" (pos=v) | GT: "unique" — semantic_fail
- **esiti**: "to hesitate" (pos=v) | GT: "results" — semantic_fail
- **continuo**: "to continue" (pos=v) | GT: "continuous" — semantic_fail
- **preterite**: "preterite" (pos=v) | GT: "preterite" — to_prefix
- **fondi**: "fund" (pos=v) | GT: "funds" — to_prefix
- **morbido**: "to die" (pos=v) | GT: "soft" — semantic_fail
- **tappa**: "stage" (pos=v) | GT: "stage" — to_prefix
- **narra**: "narra" (pos=v) | GT: "narra" — to_prefix
- **ferie**: "to hurt" (pos=v) | GT: "holidays" — semantic_fail

### FR (Grade B, 86.5%)

- **déménagions**: "to relocate" (pos=v) | GT: "moving" — semantic_fail
- **souligné**: "to emphasize" (pos=v) | GT: "underlines" — semantic_fail
- **appel**: "call" (pos=v) | GT: "call" — to_prefix
- **connaissezvous**: "do you know" (pos=v) | GT: "do you know" — to_prefix
- **restât**: "to stay" (pos=v) | GT: "rest" — semantic_fail
- **saison**: "season" (pos=v) | GT: "season" — to_prefix
- **regretté**: "to regret" (pos=v) | GT: "missed" — semantic_fail
- **déclenchée**: "to release" (pos=v) | GT: "triggered" — semantic_fail
- **résultat**: "result" (pos=v) | GT: "result" — to_prefix
- **suivant**: "following" (pos=v) | GT: "following" — to_prefix
- **léquipe**: "the team" (pos=v) | GT: "the team" — to_prefix
- **modèle**: "model" (pos=v) | GT: "model" — to_prefix
- **font**: "to DO" (pos=v) | GT: "make" — to_capitalized
- **ressemblait**: "to look like" (pos=v) | GT: "resembled" — semantic_fail
- **jhabitais**: "to live" (pos=v) | GT: "I lived" — semantic_fail

### PT (Grade B, 88%)

- **assistido**: "to attend" (pos=v) | GT: "assisted" — semantic_fail
- **existe**: "to exist" (pos=v) | GT: "there is" — semantic_fail
- **amando**: "to love" (pos=v) | GT: "loving" — semantic_fail
- **levanta**: "to raise" (pos=v) | GT: "stand up" — semantic_fail
- **acabaram**: "to finish" (pos=v) | GT: "they are over" — semantic_fail
- **pega**: "to take" (pos=v) | GT: "handle" — semantic_fail
- **consertaria**: "to repair" (pos=v) | GT: "fix" — semantic_fail
- **tomava**: "to take" (pos=v) | GT: "drank" — semantic_fail
- **tocava**: "to touch" (pos=v) | GT: "played" — semantic_fail
- **voltariam**: "to go back" (pos=v) | GT: "would return" — semantic_fail
- **falando**: "to speak" (pos=v) | GT: "talking" — semantic_fail
- **imperfect**: "imperfect" (pos=v) | GT: "imperfect" — to_prefix
- **prova**: "to test" (pos=v) | GT: "proof" — semantic_fail
- **tocou**: "to touch" (pos=v) | GT: "played" — semantic_fail
- **viu**: "to vier" (pos=v) | GT: "it saw" — semantic_fail

### DE (Grade B, 92%)

- **vorbei**: "over" (pos=v) | GT: "over" — to_prefix
- **verzeihe**: "to pardon" (pos=v) | GT: "forgive" — semantic_fail
- **legte**: "to place" (pos=v) | GT: "lay" — to_noun, semantic_fail
- **schaufenster**: "shop window" (pos=v) | GT: "shop window" — to_prefix
- **bezug**: "relation" (pos=v) | GT: "relation" — to_prefix
- **konstrukte**: "constructs" (pos=v) | GT: "constructs" — to_prefix
- **schiebt**: "pushes" (pos=v) | GT: "pushes" — to_prefix
- **gehängt**: "to hang" (pos=v) | GT: "hung" — semantic_fail
- **geirrt**: "to err" (pos=v) | GT: "mistake" — semantic_fail
- **pastParticiple**: "past participle" (pos=v) | GT: "past participle" — to_prefix
- **schlafe**: "to sleep" (pos=v) | GT: "temple" — semantic_fail
- **beendet**: "finished" (pos=v) | GT: "finished" — to_prefix
- **öffnungszeit**: "opening hours" (pos=v) | GT: "opening hours" — to_prefix
- **zielscheibe**: "target" (pos=v) | GT: "target" — to_prefix
- **sicht**: "view" (pos=v) | GT: "view" — to_prefix

### NL (Grade B, 88%)

- **sterretje**: "asterisk" (pos=v) | GT: "asterisk" — to_prefix
- **bedoelt**: "to leg" (pos=v) | GT: "means" — semantic_fail
- **geadopteerd**: "adopted" (pos=v) | GT: "adopted" — to_prefix
- **pak**: "to tackle" (pos=v) | GT: "pack" — semantic_fail
- **ruime**: "to clear" (pos=v) | GT: "spacious" — semantic_fail
- **toegepast**: "applied" (pos=v) | GT: "applied" — to_prefix
- **gekopieerd**: "copied" (pos=v) | GT: "copied" — to_prefix
- **maakten**: "to made" (pos=v) | GT: "made" — to_past_tense
- **opgemerkt**: "to remark" (pos=v) | GT: "noticed" — semantic_fail
- **name**: "to take" (pos=v) | GT: "name" — semantic_fail
- **stromend**: "flowing" (pos=v) | GT: "flowing" — to_prefix
- **ziens**: "to see" (pos=v) | GT: "goodbye" — semantic_fail
- **fietst**: "to misuse" (pos=v) | GT: "bicycles" — semantic_fail
- **bord**: "to plates" (pos=v) | GT: "board" — semantic_fail
- **haast**: "to hurry" (pos=v) | GT: "hast" — semantic_fail

### SV (Grade B, 94.5%)

- **vattnet**: "to water" (pos=v) | GT: "the water" — to_noun
- **bestämmer**: "to determine" (pos=v) | GT: "decides" — semantic_fail
- **betade**: "to bite" (pos=v) | GT: "grazed" — semantic_fail
- **agerade**: "to act" (pos=v) | GT: "acted" — semantic_fail
- **studier**: "to said" (pos=v) | GT: "studies" — to_past_tense, semantic_fail
- **bredde**: "to wide" (pos=v) | GT: "width" — semantic_fail
- **antar**: "to adopt" (pos=v) | GT: "assume" — semantic_fail
- **snöade**: "to said" (pos=v) | GT: "snowed" — to_past_tense, semantic_fail
- **belyser**: "to illustrate" (pos=v) | GT: "highlights" — semantic_fail
- **sköter**: "to said" (pos=v) | GT: "takes care of" — to_past_tense, semantic_fail
- **bäras**: "to wear" (pos=v) | GT: "waft" — semantic_fail

### CY (Grade A, 98%)

- **comisiynwyd**: "to was commissioned" (pos=v) | GT: "was commissioned" — to_copula
- **trodd**: "to try" (pos=v) | GT: "he turned" — semantic_fail
- **est**: "to go" (pos=v) | GT: "ext" — semantic_fail
- **diogelwch**: "to protect" (pos=v) | GT: "safety" — semantic_fail

### HI (Grade A, 97.5%)

- **बताए**: "to narrate" (pos=v) | GT: "tell" — semantic_fail
- **कह**: "to tell" (pos=v) | GT: "Say" — semantic_fail
- **चले**: "to walking" (pos=v) | GT: "let's go" — semantic_fail
- **दिखेंगे**: "to appearance" (pos=v) | GT: "will be seen" — semantic_fail
- **चलाओ**: "to drive" (pos=v) | GT: "Run it" — semantic_fail

### TR (Grade B, 86.5%)

- **gittiler**: "to go" (pos=v) | GT: "They left" — semantic_fail
- **konuşmaya**: "to talk" (pos=v) | GT: "to speak" — semantic_fail
- **ilgilenir**: "is interested" (pos=v) | GT: "is interested" — to_prefix
- **onaylandı**: "confirmed" (pos=v) | GT: "confirmed" — to_prefix
- **alınmakta**: "being received" (pos=v) | GT: "being received" — to_prefix
- **tabanları**: "bases" (pos=v) | GT: "bases" — to_prefix
- **müracaat**: "application" (pos=v) | GT: "application" — to_prefix
- **çıkacak**: "to leave" (pos=v) | GT: "will come out" — semantic_fail
- **karınca**: "ant" (pos=v) | GT: "ant" — to_prefix
- **dökülür**: "to pour" (pos=v) | GT: "spilled" — semantic_fail
- **çalmayı**: "stealing" (pos=v) | GT: "stealing" — to_prefix
- **deneyleri**: "experiments" (pos=v) | GT: "experiments" — to_prefix
- **üretmiş**: "produced" (pos=v) | GT: "produced" — to_prefix
- **sahneliyor**: "is staging" (pos=v) | GT: "is staging" — to_prefix
- **tartışıyor**: "to dispute" (pos=v) | GT: "arguing" — semantic_fail

### RU (Grade C, 83%)

- **знакомимся**: "to meet" (pos=v) | GT: "let's get acquainted" — semantic_fail
- **отказались**: "refused" (pos=v) | GT: "refused" — to_prefix
- **вышел**: "to go out" (pos=v) | GT: "came out" — semantic_fail
- **переведите**: "translate" (pos=v) | GT: "translate" — to_prefix
- **переведи**: "translate" (pos=v) | GT: "translate" — to_prefix
- **сломалась**: "broke down" (pos=v) | GT: "broke down" — to_prefix
- **переехали**: "moved" (pos=v) | GT: "moved" — to_prefix
- **кровать**: "bed" (pos=v) | GT: "bed" — to_prefix
- **поставлен**: "delivered" (pos=v) | GT: "delivered" — to_prefix
- **остывает**: "is cooling down" (pos=v) | GT: "is cooling down" — to_prefix
- **звонил**: "called" (pos=v) | GT: "called" — to_prefix
- **просьба**: "request" (pos=v) | GT: "request" — to_prefix
- **достигнута**: "achieved" (pos=v) | GT: "achieved" — to_prefix
- **сбежал**: "ran away" (pos=v) | GT: "ran away" — to_prefix
- **ездит**: "drives" (pos=v) | GT: "drives" — to_prefix

---
Grading: A=95%+, B=85-94%, C=75-84%, D=65-74%, F=<65%