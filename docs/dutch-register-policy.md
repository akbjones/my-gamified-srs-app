# Dutch register policy

## The register axis

Dutch's register questions for this deck are **address (je/u)** and *schrijftaal* — a well-defined set of written-only words every Dutch style guide lists.

- **Address:** default to **je/jij** for casual/peer contexts and **u** for service/stranger/formal contexts. Dutch society skews informal; je is the broad default, u for clearly formal situations (officials, elderly strangers, formal letters). Gij is Flemish/archaic — never taught as standard.
- **Schrijftaal:** Dutch has an unusually clean list of words that are normal in writing but never spoken: reeds, thans, heden, tevens, indien, gaarne. Every conversational card must use the spoken counterparts (al, nu, vandaag, ook, als, graag).

Everyday speech is the default register. Quartile tolerance applies as in the RU/TR policies: Q1–Q2 pure everyday, Q3 contextual formal OK (quoted letters, signs), Q4 register variety welcome — e.g. a formal-letter card may teach «gaarne» deliberately.

## Offender → preferred pairs

Genuinely dead-in-speech constructions (canonical list in `docs/dutch-register-offenders.json`):

| Offender | Preferred | Why |
|---|---|---|
| reeds | al | Pure schrijftaal |
| thans | nu | Pure schrijftaal |
| heden | vandaag / nu | Survives only on signs («heden gesloten») |
| indien | als | Written conditional |
| tevens | ook | Report connector |
| gaarne | graag | Archaic-formal; alive only in hyper-polite writing |

## Standing rule

Every new or rewritten Dutch card passes the **LLM naturalness audit** («would a Dutch speaker say this sentence in conversation?») before ship, per the `registerPolicy` requirement in `docs/language-module-contract.md`. Audit tooling scans new cards against the offenders JSON.
