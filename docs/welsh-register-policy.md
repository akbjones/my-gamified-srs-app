# Welsh register policy

## The register axis

Welsh has the widest register gap of any language in this app: **literary Welsh (Cymraeg Llenyddol)** and **colloquial Welsh (Cymraeg Byw / Cymraeg llafar)** differ in verb morphology, pronouns, and syntax — almost two grammars. Textbooks historically taught the literary forms; nobody speaks them.

- **Deck target: Cymraeg Byw** — the standardized colloquial register that Welsh-for-adults courses (Dysgu Cymraeg) teach. «Dw i'n mynd», not «Yr wyf yn myned».
- **Address (chi/ti):** default to **ti** for casual/peer/family contexts and **chi** for service/stranger/formal contexts (chi is also the only plural). Both must appear across the deck.
- **Dialect note:** where North and South forms diverge (gen i / gyda fi; rŵan / nawr), the deck stays consistent per card and prefers widely-understood forms; either is acceptable, mixing within one card is not.

Everyday speech is the default register. Quartile tolerance applies as in the RU/TR policies: Q1–Q2 pure colloquial, Q3 contextual formal OK (quoted signs, hymns, news), Q4 register variety welcome — literary forms may appear in cards explicitly about reading formal Welsh.

## Offender → preferred pairs

Genuinely dead-in-speech literary forms (canonical list in `docs/welsh-register-offenders.json`):

| Offender | Preferred | Why |
|---|---|---|
| yr wyf (fi) | dw i / rydw i | Literary "I am"; speech is dw i |
| nid wyf | dw i ddim | Literary negation |
| y mae | mae | Literary particle + copula; speech drops y |
| gennyf / gennym | gen i / gynnon ni (N) or gyda fi/ni (S) | Literary inflected preposition |
| impersonal -ir/-wyd (gwelir, gwnaethpwyd) | cael passive (mae'n cael ei weld, cafodd ei wneud) | Impersonal forms are written-only; signage exempt |
| sydd yn (uncontracted) | sy'n | Full form is literary; speech contracts |

## Standing rule

Every new or rewritten Welsh card passes the **LLM naturalness audit** («would a Welsh speaker say this in conversation?») before ship, per the `registerPolicy` requirement in `docs/language-module-contract.md`. Audit tooling scans new cards against the offenders JSON.
