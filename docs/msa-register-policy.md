# MSA Arabic Register Policy

MSA inverts the register problem: nobody speaks it natively, so the
usual test ("would someone say this across a table?") does not apply.
The test here is: **is this natural written/broadcast Arabic that a
learner will actually encounter — signs, news, announcements, formal
conversation between Arabs who share no dialect?**

## Rules

1. **Q1 still opens with basic everyday sentences in MSA** (user
   decision 2026-07-07): greetings, introductions, simple needs — what
   learners expect, teaching how the language works. This is the ONE
   band where "conversational" MSA is deliberately modeled.
2. From Q2 upward, lean into MSA's real functions: reading, news,
   travel signage, announcements, pan-Arab intelligibility. The goal
   dropdown (general/travel/work/family) stays, same tag targets as
   other languages, even where content skews formal.
3. **Hyper-classical/Quranic vocabulary is an offender** — MSA ≠
   fusha turath: no لكي المشددة chains, no أنّى, no قد + imperfect
   stacking beyond common patterns.
4. **Dialect intrusions are also offenders** in the MSA deck (بدي،
   عايز، مش) — that content belongs to the (future) dialect deck.
5. No harakat on cards (deck policy); pronunciation is carried by the
   per-card transliteration field. Tips referencing pronunciation use
   the transliteration, never vowel diacritics.

## Enforcement

`docs/msa-register-offenders.json` feeds the register classifier.
The LLM quality audit reads this policy; its naturalness question for
MSA is "natural WRITTEN Arabic", not "colloquially natural".
