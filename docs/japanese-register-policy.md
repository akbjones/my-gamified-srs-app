# Japanese register policy

**Canonical register: polite です/ます (teineigo), starter-wide.**
Locked 2026-07-21 in docs/japanese-scoping.md (decision 7). Mirrors the
Korean 해요체 canon: one register everywhere so learners never absorb a
form they can't safely use, with plain form arriving only as *taught
content* at its ladder position.

## Rules

1. **Structural rule (the main control):** every declarative/interrogative
   sentence in nodes 1–18 ends in the です/ます system — です・ですか・
   ます・ません・ました・ませんでした・ましょう・ませんか・てください.
   Sentence-final plain forms (だ, dictionary form, ない, た) are register
   violations in the starter band.
2. **Plain form is content, not register drift.** Nodes 19+ teach plain
   form explicitly; until then it may not appear even inside quoted speech.
   (Plain forms inside conjugation *tables* are fine — the table teaches
   the paradigm; cards teach the register.)
3. **Pronoun policy:** first person is 私 (わたし). No 俺, no 僕 in the
   starter. Second person: avoid pronouns entirely — use name + さん or
   omit (the natural pattern); 君・お前・あんた are banned, あなた only
   in glossary-style contexts, never modeled as conversational "you".
4. **No casual contractions** (じゃん, っす, 〜ちゃう as sentence-final
   casualness, sentence-final ぜ/ぞ/さ) until the casual-speech node (33)
   teaches them deliberately.
5. **No officialese:** 本日 → 今日, 明日(みょうにち reading contexts) →
   あした, 貴殿/貴社 never. The starter is spoken-register polite, not
   business-letter register.
6. **Keigo (尊敬語/謙譲語)** beyond ください/ございます set phrases is
   deferred to node 32. いらっしゃいます etc. may appear only in fixed
   greetings the ladder has introduced.

## Enforcement

- Offender lexicon: docs/japanese-register-offenders.json (vocabulary-level
  gate, severity high = hard fail).
- The structural rule is checked by scripts/lint-ja-deck.cjs (P2): every
  card in nodes 1–18 must match a sentence-final です/ます-system form.
- LLM audit waves flag pragmatic register errors the mechanical gates
  can't see (e.g. あなた used as conversational "you").
