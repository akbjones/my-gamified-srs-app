# Greek Register Policy

Canonical register: **standard everyday Modern Greek** — what an Athens
adult says to colleagues, shopkeepers, and friends. Not katharevousa-
flavored formality, not heavy slang.

## Rules

1. **Q1–Q2: pure everyday demotic.** δεν/μη negation, natural word order,
   the spoken contract forms (μιλάω not ομιλώ, θέλω να πάω not επιθυμώ).
2. **Katharevousa/formal-written vocabulary is an offender in Q1/Q2** —
   the words of legal notices and 1960s newsprint: δύναται (use μπορεί),
   όστις (use που/όποιος), ούτως, ενταύθα, άπαντες (use όλοι),
   καθότι (use επειδή/γιατί), πλην (use εκτός από).
3. **Slang and rude particles are offenders below Q4.** ρε/βρε are
   tagged-tip material ("you'll hear ρε constantly between friends"),
   never modeled sentence content in Q1–Q3.
4. **Q3–Q4 formal contexts are fine** where the situation is formal
   (announcements, signs, official letters) — register variety there is
   correct, not a violation.
5. Final sigma and accents are orthography, not register — but tips must
   always show accented forms (μιλάω), since accent position is phonemic.

## Enforcement

`docs/greek-register-offenders.json` feeds the register classifier. New
content with high-severity hits in Q1/Q2 fails the gate; the LLM quality
audit reads this policy as part of its prompt.
