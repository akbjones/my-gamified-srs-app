# Japanese 300-starter authoring brief (P2)

You are authoring cards for a graded 300-card Japanese starter deck in a
gamified SRS app (docs/japanese-scoping.md). Real, useful, everyday polite
Japanese — the learner should be able to say every sentence to a real
person this week.

## Card JSON shape

```jsonc
{
  "id": "ja-0051",            // ja-%04d of seq — assigned by your band
  "seq": 51,                   // your band position (also becomes priority)
  "target": "私は学生です。",
  "english": "I am a student.",
  "tokens": [
    { "t": "私", "r": "わたし" },
    { "t": "は" },
    { "t": "学生", "r": "がくせい" },
    { "t": "です" },
    { "t": "。" }
  ],
  "tags": ["general"],        // see Tags
  "grammarNode": "node-02",
  "grammar": "は marks the topic – 私は (watashi wa = as for me). です closes politely."  // ~30% of cards only
}
```

Do NOT emit `audio` or `priority` — derived mechanically later.

## Hard rules (mechanical lint will refuse violations)

1. **tokens joined = target exactly**: `tokens.map(t => t.t).join('') === target`. Every character, including punctuation.
2. **Punctuation is its own token**: 。、！？「」 each as a standalone token, never glued to a word.
3. **Kana-only band (seq 1-50 only)**: zero kanji in target; no `r` needed anywhere.
4. **Furigana**: every token containing a kanji carries `r` = its full kana reading AS PRONOUNCED IN THIS SENTENCE (今日=きょう; 一人=ひとり; 行きます=いきます). `r` is pure kana.
5. **Register**: polite です/ます everywhere. Every sentence (except node-01 set phrases) ends in the です/ます system: です・ですか・ます・ません・ました・ませんでした・ましょう・ませんか・てください (+ ね/よ/か then 。/？). NO plain-form sentence endings (だ, dictionary form, ない, た). No 俺/僕/君/お前/あんた; first person is 私 (わたし in the kana band); avoid あなた — use name+さん or omit. See docs/japanese-register-policy.md.
6. **Unique sentences**: no duplicate targets, and don't recycle the same sentence with one word swapped.
7. **English gloss** must actually translate the target — natural English, sentence case.
8. **Tips (`grammar` field)**: ≤120 characters, ONE rule only, chill + factual (no wordplay, no cutesy metaphors), one worked example with rōmaji in parens: `学生 (gakusei = student)`. Use en dashes (–) NEVER em dashes (—). ~15 of your 50 cards get tips, on the cards where the rule is most visible. At most ONE tip in your band about the politeness system itself.

## Tokenization policy

- Nouns, adjectives, adverbs: one token each.
- **Particles are their own tokens** (は が を に で へ と も の か ね よ や から まで) — tapping a particle is a feature.
- **A conjugated verb is ONE token including its polite machinery**: 行きます, 行きません, 行きました, 飲みませんでした each one token.
- Progressive: split as て-form + います (食べて + います).
- Requests: て-form + ください (開けて + ください).
- です is its own token. な after a na-adjective is its own token (静か + な + 町).
- たいです: keep as one token with the verb (飲みたいです) — flag it in `dict`.
- Number + counter = one token (三時, 一人, 二つ), with `r` when kanji.

## Vocabulary discipline

- JLPT N5 range only (~800 core words). Common katakana loanwords fine (コーヒー, テレビ). At most 2 proper nouns in your band (e.g. 東京), never personal names.
- From seq 51 on, write kanji where N5 learners see it (学生, 行きます, 水, 今日); keep genuinely-kana words in kana (ここ, とても, ください).
- Content must be USEFUL everyday life: ordering, asking, family, work, travel, weather, time, feelings. Never decorative/trivia/preachy content ("The crane is a symbol of..."). Vary topics — not 50 sentences about students.

## Sidecar outputs (same JSON file)

Alongside `cards`, emit:

- `dict`: one entry per DISTINCT non-punctuation token surface in your cards:
  `{ "key": "学生", "en": "student", "romaji": "gakusei", "pos": "n" }`.
  - pos ∈ n, v, adj, adv, part, pron, intj, phrase, num.
  - For kanji surfaces ALSO emit the kana spelling key if the word appears kana-only in seq 1-50 elsewhere (がくせい).
  - Verb tokens: emit the DICTIONARY FORM as key (行く, romaji iku, pos v, plus `"lemma": "行く"`), NOT the conjugated surface — conjugated forms resolve through the engine. Exception: たいです and other non-paradigm surfaces get their own entry with `lemma` pointing at the dictionary form.
  - i-adjectives: key = plain form (高い); na-adjectives: key = stem (静か).
- `verbs`: every verb your cards use, with conjugation class:
  `{ "lemma": "行く", "cls": "godan", "kana": "いく" }` — cls ∈ godan | ichidan | suru | kuru. CLASSIFY CAREFULLY: 帰る/入る/走る/知る/切る/要る are godan despite the る. Include i-adjectives too with cls "iadj" (`{ "lemma": "高い", "cls": "iadj", "kana": "たかい" }`).

## Tags

Every card: `"general"`. Add `"travel"`, `"work"`, `"family"` where topically true — across your band aim for each of the three appearing on roughly 40-60% of cards (cards can carry several).

## Output

Write ONE file: `scripts/tmp/ja-p2/wave-<N>.json` (N given in your task) with
`{ "cards": [...50 cards...], "dict": [...], "verbs": [...] }`.
Then return the summary object you were asked for. Do not touch any other file.
