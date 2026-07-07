# Indonesian Register Policy

Canonical register: **standard conversational Indonesian** — the neutral
spoken language an adult uses with colleagues and strangers in Jakarta or
on TV interviews. Not formal written *bahasa baku*, not Jakarta youth
slang.

## Rules

1. **Q1–Q2: pure neutral conversational.** `saya/kamu` pronouns, plain
   SVO, aspect markers `sudah/belum/sedang/akan`. No slang, no
   bureaucratese.
2. **Formal *baku* vocabulary is an offender in Q1/Q2** — the words of
   government prose and news anchors that no one uses across a table:
   prefer `bilang` over `mengatakan` in dialogue contexts, `dapat` only
   as "get" (use `bisa` for "can"), avoid `merupakan` (use `adalah` or
   nothing), avoid `tersebut` (use `itu`).
3. **Jakarta colloquialisms (`gue/lo`, `nggak`, `banget`, `udah`) are
   offenders in Q1–Q3.** Q4 may introduce a small, tagged set with tips
   ("you will hear `nggak` for `tidak` everywhere in Jakarta") — heard
   language, not modeled language.
4. **Difficulty scaling:** Q3–Q4 may use formal register where the
   *situation* is formal (announcements, letters, job interviews) —
   register variety there is correct, not a violation.
5. The full meN- forms are canonical in writing but conversational
   Indonesian often bare-root-drops them; cards model the full form,
   tips may note the spoken drop.

## Enforcement

`docs/indonesian-register-offenders.json` feeds the register classifier
(same machinery as RU/TR). New content with high-severity hits in Q1/Q2
fails the gate; the LLM quality audit (audit-checklist rule 7) reads the
policy above as part of its prompt.
