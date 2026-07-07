# French register policy

## The register axis

French has one of the widest written/spoken gaps in Europe. Two axes matter for this deck:

- **Address (tu/vous):** default to **tu** for casual/peer contexts and **vous** for service/stranger/formal contexts. Both must appear across the deck; a tu-only deck strands learners at the bakery.
- **Written-only grammar:** the **passé simple is banned in conversational cards** — it is a written-narrative tense; dialogue uses passé composé. Likewise: spoken French says **on** where written French says nous ("on y va", not "nous y allons"), drops *ne...point*, and prefers *pour* over *afin de*. Formal inversion questions («Que fais-tu ?») are fine sparingly, but Q1–Q2 dialogue should mostly use intonation/est-ce que forms («Tu fais quoi ?», «Qu'est-ce que tu fais ?»).

Everyday speech is the default register. Quartile tolerance applies as in the RU/TR policies: Q1–Q2 pure everyday, Q3 contextual formal OK (quoted letters, signs), Q4 register variety welcome — including passé simple in a designated reading/narrative card.

## Offender → preferred pairs

Genuinely dead-in-speech constructions (canonical list in `docs/french-register-offenders.json`):

| Offender | Preferred | Why |
|---|---|---|
| passé simple in dialogue (il alla, nous fûmes) | passé composé (il est allé, on a été) | Written narrative tense only |
| ne...point | ne...pas | Archaic negation |
| nous as casual "we" subject | on | «nous allons au ciné» → «on va au ciné» in speech |
| afin de / afin que | pour / pour que | Formal purpose connector |
| nonobstant | malgré | Legal fossil |
| car (in dialogue) | parce que | car is written-leaning; speech says parce que |

## Standing rule

Every new or rewritten French card passes the **LLM naturalness audit** («would a French speaker say this sentence in conversation?») before ship, per the `registerPolicy` requirement in `docs/language-module-contract.md`. Audit tooling scans new cards against the offenders JSON.
