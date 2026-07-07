# Turkish register policy

## Why this exists

Modern Turkish carries two register fault lines at once:

1. **Ottoman-era formal vocabulary** — Arabic/Persian loans (müracaat etmek, ikamet etmek, malumat) that survive on signage, in legal text, and in older speakers' speech, but are dead or stiff in everyday conversation.
2. **Written-prose grammar** — the -maktadır progressive, tarafından passives, -dığı takdirde conditionals: standard in news and academia, absurd in dialogue.

There is also a third, opposite trap: **language-reform ideology**. Some öz Türkçe coinages (yanıt, sözcük, olanak) never displaced the older loan in daily speech. We target **what people say, not etymology or purism**. faydalanmak is Arabic-derived and fully alive; ivedi is pure Turkish and dead.

This policy is the rulebook. The canonical swap list lives in `docs/turkish-register-offenders.json`.

## The core rule

**Default to what a Turkish speaker would actually say in casual conversation.** Everyday speech is the target register unless the card is explicitly teaching something else.

## Quartile-tiered tolerance

| Tier | Policy |
|---|---|
| **Q1–Q2** | Pure everyday register only. Every offender hit is a defect. -ıyor, plain conditionals (-se/-sa), hem...hem, çünkü, önce/sonra. |
| **Q3** | Contextual formal OK. A card quoting a sign may use «kimlik ibrazı zorunludur»; a card about dinner plans may not. `high` severity still swaps; `medium` passes with genre justification. |
| **Q4** | Register variety welcome. Advanced learners should meet -maktadır in a news-reading card, arz ederim in a formal-letter card, şayet and nitekim as educated usage — deliberately, in cards whose point is that register. Only true fossils (binaenaleyh, mamafih, mucibince, iktiza etmek) stay banned outside irony. |

## Structural rules (TR-specific)

### No -maktadır/-mektedir in conversational cards

The -makta/-mekte progressive («artmaktadır», «çalışmaktadır») is standard academic/news prose and **never conversational**. In any dialogue or Q1–Q3 example sentence:

- yapmaktadır → yapıyor
- gerekmektedir → gerekiyor / lazım
- çalışmakta olan → çalışan

Same family: «X tarafından» passives in dialogue → active voice; «-dığı takdirde» → «-se/-sa»; «-mak suretiyle» → «-arak/-erek». Q4 news/formal-register cards may use them on purpose.

### Ottoman formal verbs → everyday equivalents

The Ottoman verb + etmek/olmak compounds have single dominant spoken replacements (full list with exemptions in the offenders JSON):

| Ottoman formal | Everyday |
|---|---|
| müracaat etmek | başvurmak |
| iştirak etmek | katılmak |
| ikamet etmek | oturmak |
| ihtiva etmek | içermek |
| beyan/ifade etmek | söylemek |
| istifade etmek | yararlanmak / faydalanmak |
| vuku bulmak | olmak / gerçekleşmek |
| muvaffak olmak | başarmak |
| tediye etmek | ödemek |

Watch the noun/verb split: the noun is often alive where the verb is dead (talep in economics, ifade vermek at the police station, tetkik in medicine, ihtar in football). Swap the verb, leave the living noun senses alone.

### vefat etmek is fine

vefat etmek is NOT a dead Ottoman relic — it is the **standard polite euphemism** for a person's death, used across all registers. Keep it wherever softness or respect is the point; teach ölmek as the plain verb (animals, plants, batteries, blunt statements). Never auto-swap it.

### mühim, lakin, evvel are alive as flavor

Several Ottoman words survive in genuine colloquial use as emphasis, humor, or dated-warm flavor:

- **mühim** — «en mühimi bu», «mühim değil» — alive, especially older speakers
- **lakin** — poetic/emphatic «lakin unutma...» — intentional register play
- **evvel** — evvela, evvelsi gün, «beş sene evvel» — dated-flavorful, not wrong
- Also: velhasıl (storyteller's wrap-up), külliyen (emphatic denial), malum ya, vaziyet ne?

These are `low` severity: context calls, never blanket swaps. Flagging them is over-correction; a deck with zero of them would itself sound sterile at Q4.

## Contextual exceptions

Don't flag, don't swap:

- **Quoted official/legal set phrases** — «arz ederim» in a letter-writing card, signage («kimlik ibrazı zorunludur»), contract language when quoted as such.
- **Living set phrases** — «sıhhatler olsun», «mesela», «vesaire», «ne münasebet!», «söz konusu bile olamaz!», «-den itibaren».
- **Domain-owning reform words** — yanıt in software UI, olasılık in math, kent in municipal compounds. Everyday conversation still gets cevap, ihtimal, şehir.
- Cards marked `register: 'formal'` in a designated formal-register unit.

## How this gets enforced

1. **`docs/turkish-register-offenders.json`** holds the canonical formal → preferred swaps with severity and exemption notes.
2. **`scripts/audit-tr-register.cjs`** scores every card by offender hits, weighted by severity and quartile. It must use locale-aware lowercasing (İ→i, I→ı) — see the İ-lookup incident in `docs/language-module-contract.md`.
3. **Every new or rewritten card goes through the LLM naturalness audit** ("would a native say this in conversation?") before ship — the audit gate required by the module contract's `registerPolicy` field.
4. **Audio regen is delta-only** — only cards whose target sentence changed get regenerated.
