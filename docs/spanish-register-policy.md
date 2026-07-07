# Spanish register policy

## The register axis

Spanish's main register questions for this deck are **address (tú/usted)** and **written-only grammar**.

- **Address:** the deck targets **neutral Latin American Spanish**. Default to **tú** for casual/peer contexts and **usted** for service/stranger/elder contexts. No vos (voseo is regional — Río de la Plata, parts of Central America); no vosotros (Spain only — plural address is always **ustedes**).
- **Written-only grammar:** literary and legal Spanish keeps constructions that are dead in conversation everywhere: the future subjunctive, sentence-connector *mas*, heavy *cuyo* relatives. These never belong in conversational cards.

Everyday speech is the default register. Quartile tolerance applies as in the RU/TR policies: Q1–Q2 pure everyday, Q3 contextual formal OK (e.g. a card quoting a sign or formal letter), Q4 register variety welcome on purpose.

## Offender → preferred pairs

Genuinely dead-in-speech constructions (canonical list in `docs/spanish-register-offenders.json`):

| Offender | Preferred | Why |
|---|---|---|
| mas (= but) | pero | Literary conjunction; nobody says it |
| cuyo/cuya | rephrase with que + possessive («el señor cuyo coche...» → «el señor que tiene el coche...») | Alive in writing, dead in conversation |
| future subjunctive (hubiere, fuere) | present subjunctive / indicative | Legal fossil only |
| a fin de que | para que | Bureaucratic connector |
| asimismo | también | Report language |
| dicho/dicha (= said, the aforementioned) | ese/esa, este/esta | Legalese determiner |

## Standing rule

Every new or rewritten Spanish card passes the **LLM naturalness audit** («would a Latin American speaker say this sentence in conversation?») before ship, per the `registerPolicy` requirement in `docs/language-module-contract.md`. `scripts` audit tooling scans new cards against the offenders JSON.
