# Spanish Starter Deck — QA Report

**Deliverable:** `src/data/spanish-starter-deck.json` (300 cards) +
`src/data/starterDecks.ts` (typed loader).
**Goal:** bridge learners from beginner apps to native content with a
sentence-first, gradually graded SRS progression.
**Method:** curation, not authoring — all 300 cards are reused **verbatim**
from `src/data/spanish/deck.json` (3,945 cards), so every card keeps its
existing audio file, dictionary coverage, and word-popover behavior.
Each card is augmented with exactly two new fields: `starterSeq` (1–300)
and `themes` (derived content tags).

---

## 1. Progression structure

Difficulty rises along three coupled axes: grammar-node progression
(the app's own 35-node curriculum, see `src/data/grammarDescriptions.ts`),
sentence length, and clause complexity. Word-count caps per band keep
outliers from breaking the ramp.

| Band | Seq | Nodes | Avg words (range) | Tips | Character |
|------|---------|--------|-------------------|------|-----------|
| A | 1–50 | 01–08 | 4.0 (2–6) | 30/50 | Very approachable: greetings, fixed phrases, regular + irregular present, ser/estar, questions, gender, gustar, descriptions |
| B | 51–150 | 04–15 | 5.5 (4–10) | 34/100 | Slightly longer review of A topics, then the past tenses (preterite, imperfect, contrast), reflexives, por/para, object pronouns |
| C | 151–250 | 16–26 | 8.9 (5–12) | 31/100 | Subjunctive, commands, conditional, future, relative clauses, compound tenses, si-clauses, se-passive, discourse connectors, verb phrases |
| D | 251–300 | 27–35 | 10.9 (7–14) | 13/50 | Simple native-style: reported speech, idioms/proverbs, complex syntax, cultural fluency, multi-pattern sentences |

Quartile average sentence length: **4.2 → 5.8 → 8.9 → 10.3 words** — a
smooth, monotonic ramp with no cliff at band boundaries (band B starts with
short review cards from earlier nodes before introducing the preterite).

### Example cards along the arc

| Seq | Node | Card |
|-----|------|------|
| 1 | node-01 | *Buenas noches.* — Good evening / Good night. |
| 25 | node-03 | *¿El desayuno está incluido?* — Is breakfast included? |
| 50 | node-08 | *Te quiero mucho.* — I love you very much. |
| 75 | node-09 | *Ayer llovió todo el día.* — Yesterday it rained all day. |
| 150 | node-15 | *¿Me pasas la sal y la pimienta, por favor?* — Can you pass me the salt and pepper, please? |
| 180 | node-18 | *El equipo con el que trabajo es muy profesional.* — The team I work with is very professional. |
| 250 | node-26 | *Por más que busqué, no encontré un vuelo directo a esa isla.* — No matter how much I searched, I couldn't find a direct flight to that island. |
| 270 | node-30 | *Me pilló por sorpresa; no me lo esperaba para nada.* — It caught me by surprise – I didn't expect it at all. |
| 300 | node-35 | *Aunque hubiera tenido más tiempo, el resultado habría sido el mismo.* — Even if I had had more time, the result would have been the same. |

## 2. Grammar progression

All 35 grammar nodes appear, in strict curriculum order (a node's first card
never precedes an earlier node's first card). First appearance of each node:

```
node-01 @ 1    node-08 @ 48   node-15 @ 139  node-22 @ 213  node-29 @ 263
node-02 @ 15   node-09 @ 71   node-16 @ 151  node-23 @ 221  node-30 @ 267
node-03 @ 23   node-10 @ 85   node-17 @ 165  node-24 @ 228  node-31 @ 276
node-04 @ 31   node-11 @ 97   node-18 @ 175  node-25 @ 236  node-32 @ 282
node-05 @ 37   node-12 @ 109  node-19 @ 185  node-26 @ 244  node-33 @ 286
node-06 @ 41   node-13 @ 119  node-20 @ 195  node-27 @ 251  node-34 @ 290
node-07 @ 45   node-14 @ 129  node-21 @ 204  node-28 @ 257  node-35 @ 296
```

Node card counts (weighting rationale):

- **Heaviest (12–14 cards): node-01, node-09, node-10, node-11, node-15,
  node-16** — the learning-critical hurdles for this audience: present-tense
  foundation, the two past tenses, object pronouns, and first contact with
  the subjunctive. These are exactly where beginner apps stop and native
  content starts.
- **Medium (8–10): node-02..node-08, node-12..node-14, node-17..node-19,
  node-24, node-25, node-30** — one solid cluster per core structure
  (ser/estar, questions, gustar, reflexives, por/para, commands,
  conditional, future, se-constructions, connectors, idioms).
- **Lightest (4–7): node-29, node-32, node-33, node-35** — formal/literary
  and academic registers are only sampled; the deck's goal is everyday
  native-style Spanish, not literary Spanish. node-35 has only 32 source
  cards, most of them "si hubiera… habría" conditionals, so it is capped
  at 5 with a structural-variety guard (see §4).

Grammar tips ("short learner notes"): **108/300 cards (36%)**, versus 18%
in the main deck. Tips were deliberately over-selected at *node
introductions*: for each node in each band, the two shortest cards carrying
a `grammar` note are picked first, so a learner meeting the preterite or
the subjunctive for the first time gets an explanation, while later cards
of the same node arrive bare. Not every card has a note, per spec.

## 3. Theme distribution

Themes are derived from sentence content (English-side keyword
classification) and stored in a new `themes` field — **not** in `tags`,
because the app types `tags` as `LearningGoal[]`
(`general|travel|work|family`) and uses it for goal filtering. 1–3 themes
per card; 19 cards carry more than one; cards matching no keyword default
to `daily life`.

| Theme | Cards | | Theme | Cards |
|------------|-------|-|------------|-------|
| daily life | 71 | | food | 31 |
| time | 40 | | emotions | 29 |
| travel | 36 | | opinions | 27 |
| work | 34 | | directions | 20 |
| family | 32 | | | |

Selection balanced themes greedily against target shares while filling node
quotas, so every theme is represented in every band (opinions and emotions
skew later, matching where subjunctive/conditional sentences naturally
express them; directions skew earlier, matching traveler-survival needs).

## 4. Curation methodology (summary)

1. Filter the 3,945-card main deck; **exclude 13 source cards with
   missing-diacritic typos** (e.g. *senalar*, *ninos*, *manana*, *despues*,
   *decision* — flagged separately as a main-deck fix; the starter deck
   itself is clean).
2. Per band, per node: fill a fixed quota, taking up to 2 tipped cards
   first (shortest first), then greedily picking cards whose themes are most
   under-represented, preferring shorter sentences in bands A/B and longer
   in C/D, within the band's word-count window.
3. Structural-variety guard: at most 2 sentences per band opening with the
   same two words (band D: at most 3 per opening word — this caps the
   "Si hubiera…" flood inherent to source nodes 34–35).
4. Order each band by (node, word count); concatenate bands; assign
   `starterSeq` 1–300.
5. Validate: 300 unique ids, contiguous starterSeq 1–300, every original
   field byte-identical to the main deck, every card has an audio filename,
   no typo card leaked.

## 5. Assumptions and decisions

- **Curation over authoring.** New sentences would have required new TTS
  audio (a paid operation requiring confirmation) and new dictionary
  entries. Reusing cards verbatim keeps 100% audio and dictionary coverage
  and means SRS mastery transfers between main and starter deck (same ids).
- **`themes` as a new field, not new `tags` values.** Keeps `LearningGoal`
  typing and existing goal-filtering behavior intact.
- **TTS-ready text** = the existing `target` field; every selected card
  already has a generated mp3 (`audio` field), so nothing needs regenerating.
- **Difficulty proxy.** grammarNode order is trusted as the primary
  difficulty axis (it is the app's own curriculum), refined by word count.
  A few source cards sit in surprising nodes (e.g. *Gracias por tu ayuda*
  under node-12); these were left as-is since re-noding is out of scope
  and none of them break the felt difficulty ramp.
- **Integration status: not wired into the UI** (per constraints: one deck
  per language today, no new UI). `src/data/starterDecks.ts` exports
  `SPANISH_STARTER: StarterCard[]` typed against the raw-deck card shape
  that `buildDeck` (App.tsx) consumes, with a comment marking the exact
  hook point: the deck-loading `useEffect` in App.tsx where
  `DECK_MAP[lang]` is read — a future toggle swaps in `SPANISH_STARTER`
  there and everything downstream (SRS, audio, popover) works unchanged.
- **Typecheck:** `npx tsc --noEmit -p .` passes.
- Files touched: `src/data/spanish-starter-deck.json`,
  `src/data/starterDecks.ts`, `docs/spanish-starter-deck-qa.md` only.
