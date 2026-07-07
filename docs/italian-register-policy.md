# Italian register policy

## The register axis

Italian's register questions for this deck are **address (tu/Lei)** and the gap between **written Italian** and conversation.

- **Address:** default to **tu** for casual/peer contexts and **Lei** for service/stranger/formal contexts. Voi as polite singular is regional/archaic — never teach it as address; voi is only plural "you all".
- **Written vs spoken:** written Italian preserves subject pronouns (egli, ella, essi), determiners (codesto), and connectors (altresì) that are completely dead in conversation. Spoken Italian uses lui/lei/loro, questo/quello, anche.
- **Tense note:** conversational cards use **passato prossimo** as the default past. The passato remoto is alive regionally (spoken in the South, normal in all written narrative) — fine in Q4 narrative/reading cards, not in Q1–Q3 dialogue.

Everyday speech is the default register. Quartile tolerance applies as in the RU/TR policies: Q1–Q2 pure everyday, Q3 contextual formal OK, Q4 register variety welcome on purpose.

## Offender → preferred pairs

Genuinely dead-in-speech constructions (canonical list in `docs/italian-register-offenders.json`):

| Offender | Preferred | Why |
|---|---|---|
| egli / ella / essi | lui / lei / loro | Subject pronouns of written prose only |
| codesto | questo / quello | Bureaucratic/Tuscan archaism |
| recarsi | andare | «recarsi in ufficio» is officialese; people say andare |
| altresì | anche | Legal/administrative connector |
| suddetto | quel / questo | "Aforementioned" — document language |
| il quale / la quale (plain relative) | che | «l'uomo il quale parla» → «l'uomo che parla»; il quale survives only after prepositions |

## Standing rule

Every new or rewritten Italian card passes the **LLM naturalness audit** («would an Italian say this sentence in conversation?») before ship, per the `registerPolicy` requirement in `docs/language-module-contract.md`. Audit tooling scans new cards against the offenders JSON.
