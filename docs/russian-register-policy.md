# Russian register policy

## Why this exists

Russian has a sharp split between **written/bureaucratic Russian** (канцелярит, news-cliché, книжный стиль) and **everyday spoken Russian**. The deck was generated partly from written-register templates, so hundreds of cards taught constructions like «Москва является столицей» or «человек, читающий книгу» — grammatically perfect, and exactly what no Russian says over coffee. A learner who masters those cards sounds like a government form and won't parse what they hear back.

This policy is the rulebook for deciding which register a Russian card should use. The canonical machine-readable swap list lives in `docs/russian-register-offenders.json`.

## The core rule

**Default to what a Russian speaker would actually say in casual conversation with a friend.** Everyday speech is the target register unless the card is explicitly teaching something else.

## Quartile-tiered tolerance

Cards are tiered by deck quartile (difficulty position). Tolerance for formal register rises with the tier:

| Tier | Policy |
|---|---|
| **Q1–Q2** | Pure everyday register only. Every offender-list hit is a defect, regardless of severity. No participles, no gerunds, no канцелярит. |
| **Q3** | Contextual formal is OK. A card *about* reading announcements may quote «поезд прибывает»; a card about weekend plans may not. Severity `high` items still swap; `medium` items pass with a genre justification. |
| **Q4** | Register variety welcome. Advanced learners should meet следует, необходимо, однако, and even attributive participles — deliberately, in cards whose point is that register. Only `high`-severity fossils (дабы, ибо, каковой, сей) stay banned outside irony. |

## Structural rules (RU-specific)

### Participles and gerunds → который/когда clauses (Q1–Q3)

Participles (-ущий/-ющий, -вший, -емый, -нный) and gerunds (-я, -в/-вши) are written-Russian machinery. Spoken Russian uses clauses instead. At Q1–Q3, rewrite:

- «человек, читающий книгу» → «человек, который читает книгу»
- «Придя домой, он поужинал» → «Он пришёл домой и поужинал» / «Когда он пришёл домой...»
- «используемый метод» → «метод, который используют»

**Exempt:** lexicalized forms that have become ordinary words — следующий, бывший, любимый, настоящий (real); adverbs сидя, стоя, молча, не спеша; discourse markers честно говоря, судя по, кстати говоря; short predicative passives («магазин закрыт», «сделано»). These are fully spoken.

At Q4, attributive participles may appear in cards explicitly teaching written register.

### Preserve aspect in every swap

When replacing a bureaucratic verb, the replacement MUST keep the aspect of the original. Changing aspect changes the meaning:

- осуществи́ть (pf) → сде́лать (pf); осуществля́ть (impf) → де́лать (impf)
- принять решение (pf) → решить (pf); принимать решение (impf) → решать (impf)
- Same inside rephrased clauses: прочитавший (pf) → который прочитал (pf)

Any automated or LLM rewrite that flips aspect fails review.

### The канцелярит verb list

These verbs are the core bureaucratic offenders; the everyday verb always wins in Q1–Q3 content (full list with notes and exemptions in the offenders JSON):

| Канцелярит | Everyday |
|---|---|
| являться | быть / это / (omit copula) |
| осуществлять | делать |
| реализовывать | делать, выполнять |
| обеспечивать | давать |
| предоставлять | давать |
| направляться | идти / ехать |
| проживать | жить |
| иметься | есть |
| иметь возможность | мочь |
| обладать / располагать | иметь / у ... есть |
| прибывать | приезжать / приходить |
| приступать к | начинать |
| содействовать / способствовать | помогать |
| оказывать помощь / влияние | помогать / влиять |
| функционировать | работать |

Light-verb constructions (оказывать помощь, принимать участие, производить оплату) always lose to the plain verb. Nominalization chains («улучшение качества обслуживания клиентов») get rebuilt around a finite verb («лучше обслуживать клиентов»).

## Contextual exceptions

Don't flag, don't swap:

- **Set phrases, proverbs, literary quotes** — exempt from all swaps.
- **Genre-quoted official language** — station announcements («поезд прибывает на второй путь»), job ads («требуется продавец»), booking sites («проживание с завтраком») when the card is explicitly quoting that genre.
- **Different-sense homographs** — данные (data), лицо (face), «иметь в виду», «обеспечивать семью», «программное обеспечение». The offenders JSON notes each exemption.
- Cards marked `register: 'formal'` in a designated formal-register unit.

## How this gets enforced

1. **`docs/russian-register-offenders.json`** holds the canonical formal → preferred swaps with severity and exemption notes.
2. **`scripts/audit-ru-register.cjs`** scores every card by offender hits, weighted by severity and quartile.
3. **Every new or rewritten card goes through the LLM naturalness audit** ("would a native say this sentence in conversation?") before ship — this is the audit gate required by `docs/language-module-contract.md` (`registerPolicy` field).
4. **Audio regen is delta-only** — only cards whose target sentence changed get regenerated.
