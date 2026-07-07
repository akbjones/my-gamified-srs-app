# Swedish register policy

## The register axis

Swedish is the easy case for address and the classic case for written-only vocabulary.

- **Address: universal du.** The du-reformen (late 1960s) made **du** the address form for everyone — strangers, bosses, officials, the elderly. The deck uses du throughout. **Ni** as a polite singular is not neutral politeness: it reads dated or as service-industry affectation, and to older speakers can even feel distancing. Never teach Ni as "the polite you"; ni is only genuine plural.
- **Written-only vocabulary:** Swedish keeps a stock of kanslisvenska/literary words that are dead in speech: ej/icke, erhålla, ty, således, medelst. Conversational cards use inte, få, eftersom, alltså, med. (ej survives on signs — «Ej i trafik» — which is quoting signage, not speech.)

Everyday speech is the default register. Quartile tolerance applies as in the RU/TR policies: Q1–Q2 pure everyday, Q3 contextual formal OK (quoted signs, formal letters), Q4 register variety welcome on purpose.

## Offender → preferred pairs

Genuinely dead-in-speech constructions (canonical list in `docs/swedish-register-offenders.json`):

| Offender | Preferred | Why |
|---|---|---|
| ej / icke | inte | Written/sign negation; speech is always inte |
| erhålla | få | Kanslisvenska "receive" |
| ty | för / eftersom | Archaic "because" |
| således | alltså / så | Report connector |
| medelst | med | Bureaucratic "by means of" |
| Ni (polite singular) | du | Post du-reformen, du is universal |

## Standing rule

Every new or rewritten Swedish card passes the **LLM naturalness audit** («would a Swede say this sentence in conversation?») before ship, per the `registerPolicy` requirement in `docs/language-module-contract.md`. Audit tooling scans new cards against the offenders JSON.
