# German register policy

## The register axis

German's register questions for this deck are **address (Sie/du)** and the written/spoken grammar gap.

- **Address:** default to **du** for casual/peer/family contexts and **Sie** for service/stranger/workplace-formal contexts. Both must appear across the deck. Ihr is only plural informal.
- **Tense note:** conversational cards use the **Perfekt** as the default past («ich habe gegessen»), not the Präteritum — except for sein, haben, and the modals (war, hatte, konnte, wollte, musste), whose Präteritum forms are fully spoken. «ich aß» in dialogue is a register error.
- **Written-only vocabulary:** Amtsdeutsch and Schriftsprache keep verbs and connectors (sich begeben, des Weiteren, diesbezüglich) that are stiff-to-dead in conversation. Long extended-participle chains («die von mir gestern gekaufte Tasche») belong in writing; speech uses relative clauses.

Everyday speech is the default register. Quartile tolerance applies as in the RU/TR policies: Q1–Q2 pure everyday, Q3 contextual formal OK (quoted letters, signs, workplace email), Q4 register variety welcome on purpose.

## Offender → preferred pairs

Genuinely dead-in-speech constructions (canonical list in `docs/german-register-offenders.json`):

| Offender | Preferred | Why |
|---|---|---|
| sich begeben | gehen / fahren | «sich zum Bahnhof begeben» is officialese |
| erhalten (in dialogue) | bekommen / kriegen | erhalten is formal-written; speech says bekommen |
| des Weiteren | außerdem | Report connector |
| diesbezüglich | dazu / darüber | Amtsdeutsch pointer |
| welcher/welche/welches as relative | der / die / das | «der Mann, welcher...» is dead in speech |
| Präteritum of ordinary verbs in dialogue (ich aß, er kaufte) | Perfekt (ich habe gegessen, er hat gekauft) | Written-narrative tense; sein/haben/modals exempt |

## Standing rule

Every new or rewritten German card passes the **LLM naturalness audit** («would a German speaker say this sentence in conversation?») before ship, per the `registerPolicy` requirement in `docs/language-module-contract.md`. Audit tooling scans new cards against the offenders JSON.
