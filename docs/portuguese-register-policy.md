# Portuguese register policy

## The register axis

This deck targets **Brazilian Portuguese**, where the address system and verb morphology diverge sharply from the European written standard.

- **Address:** **você** is the default second person (with 3sg verb forms); **vocês** is the only plural. Vós is dead everywhere; tu with full 2sg conjugation («tu és») is regional (South, parts of the Northeast, and EP) — not the deck default. Polite address is «o senhor / a senhora».
- **Written-only grammar:** BR speech has abandoned several forms the written language keeps: the synthetic pluperfect (falara), mesoclisis (dir-lhe-ei), heavy *cujo* relatives. Conversational cards use the analytic equivalents.
- **Register note:** third-person clitics (o/a: «vi-o») are formal-written in Brazil; speech says «vi ele» (colloquial) or repeats the noun. Cards should avoid teaching «vi-o» as conversational.

Everyday speech is the default register. Quartile tolerance applies as in the RU/TR policies: Q1–Q2 pure everyday, Q3 contextual formal OK, Q4 register variety welcome on purpose (including EP or literary forms in cards labeled as such).

## Offender → preferred pairs

Genuinely dead-in-speech constructions (canonical list in `docs/portuguese-register-offenders.json`):

| Offender | Preferred | Why |
|---|---|---|
| vós (fazeis, ireis) | vocês (fazem, vão) | Dead in all spoken Portuguese |
| mesoclisis (dir-lhe-ei, far-se-á) | vou dizer (para ele), vai ser feito | Written-formal fossil in BR |
| synthetic pluperfect (falara, fizera) | tinha falado, tinha feito | Literary tense; speech uses tinha + participle |
| cujo/cuja | rephrase with que + possessive | Dead in BR conversation |
| todavia | mas | Essay connector |
| a fim de | para | Bureaucratic purpose connector |

## Standing rule

Every new or rewritten Portuguese card passes the **LLM naturalness audit** («would a Brazilian say this sentence in conversation?») before ship, per the `registerPolicy` requirement in `docs/language-module-contract.md`. Audit tooling scans new cards against the offenders JSON.
