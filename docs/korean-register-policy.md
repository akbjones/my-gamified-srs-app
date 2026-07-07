# Korean Register Policy

Canonical register: **해요체 (polite informal)** — the level adults use
with strangers, colleagues, and shopkeepers. Register in Korean IS speech
level, so this policy is structural, not just lexical.

## Rules

1. **Every modeled sentence in Q1–Q3 ends in 해요체** (-요 forms).
   One canonical level everywhere — mixing levels across cards is the
   Korean equivalent of the "two voices" audio bug.
2. **합니다체 (formal polite)** appears only where the situation demands
   it (announcements, news, first-meeting set phrases like 감사합니다 /
   처음 뵙겠습니다) and always with a tip naming the level.
3. **반말 (casual)** is never modeled below Q4; Q4 may introduce a small
   tagged set with tips ("friends drop -요: 어디 가?").
4. **Pronoun register:** 저 (humble I) is canonical; 나 only in clearly
   casual contexts with a tip. Avoid 당신 entirely (marked); use
   name+씨 or omit the subject, as Korean actually does.
5. Sino-Korean formal vocabulary that no one speaks (금일 for 오늘,
   명일 for 내일, 본인 for 저) is an offender in Q1/Q2.

## Enforcement

`docs/korean-register-offenders.json` feeds the register classifier.
A structural scan (pilot stage) additionally checks sentence-final
endings: non--요/-니다 endings in Q1–Q3 fail the gate.
