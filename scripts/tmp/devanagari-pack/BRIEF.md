# Devanagari script-teacher curriculum brief (Hindi)

You are authoring the curriculum for the Devanagari script-teacher pack,
following the shipped precedents (scripts/build-hangul-pack.cjs LEVELS array
for the house mnemonic style; the kana pack for the two-half structure).

## Item kinds

- `letter`: an independent vowel (अ), a consonant (क), or a nukta letter
  (ज़). Carries a mnemonic.
- `modifier`: a matra (ा ि ी…), a sign (ं ँ ः), or the halant (्).
  Carries a mnemonic teaching the RULE it applies.
- `composed`: a worked example (का = क+ा; क्ष = क+्+ष). `components`
  lists constituent glyphs IN TAP ORDER. No mnemonic.
- Do NOT author `word` items — the build script derives them from the deck.

## Sound & romanization rules (the answer key is TYPED ascii)

- `romanization` is plain lowercase ascii: ka kha ga gha nga · cha chha ja
  jha nya · ta tha da dha na (BOTH retroflex ट-row and dental त-row use
  ta/tha/da/dha/na — the distinction is AUDIO-led, see below) · pa pha ba
  bha ma · ya ra la va sha sha sa ha (श and ष both "sha") · vowels a aa i
  ee u oo e ai o au ri · signs: anusvara "n", chandrabindu "n", visarga "h",
  halant "" is never typed (its drills are composition).
- `sound` is the DISPLAY pronunciation and may carry the precision the
  ascii can't: ट = "ṭa (retroflex – tongue curled back)", त = "ta (dental –
  tongue on teeth)", ख = "kha (ka + breath)". Honest phonetics, learner
  wording, no IPA jargon.
- Retroflex/dental and aspirated/plain contrasts are THE lesson of this
  script: the mnemonic must say how the sound differs, not just name it.
  Aspiration follows the Hangul house pattern ("one extra puff of breath").
- Nukta letters: ज़ za, फ़ fa, ड़ Ra ("flapped – tongue flicks"), ढ़ Rha.
  romanization: za fa ra rha.

## Mnemonic rules

- ≤200 chars, shape→sound story that honestly matches the glyph (every
  Devanagari letter hangs from the headline bar – use what's UNDER it).
  Chill + factual, en dashes (–) only, NEVER em dashes (—).
- Reference already-taught glyphs where genuinely helpful ("घ is भ's…" only
  if भ is already taught in the level plan you were given). Aspirated
  letters may lean on their plain partner (ख on क) when the partner comes
  earlier.
- `similar`: real visual confusables that power discrimination drills.
  Cover the classics within your half: घ/ध, ट/ठ, ड/ढ, ब/व, भ/म, त/न,
  थ/य, श/ष, इ/ई, उ/ऊ, ा/ि(?) only if genuinely confusable. Also list the
  SOUND confusables across rows where relevant (ट similar त) — the engine
  drills those by audio.

## Output shape

Write ONE JSON file (path given in your task):
```jsonc
{ "levels": [
  { "title": "First vowels",
    "items": [
      { "kind": "letter", "glyph": "अ", "sound": "a (the u in fun)", "romanization": "a", "mnemonic": "…", "similar": ["आ"] },
      { "kind": "modifier", "glyph": "ा", "sound": "aa sign", "romanization": "aa", "mnemonic": "…" },
      { "kind": "composed", "glyph": "का", "sound": "kaa", "romanization": "kaa", "components": ["क", "ा"] }
    ] }
] }
```
Components/similar are GLYPH strings — ids are assigned mechanically later.
Every composed item's components must appear as items at the same or an
earlier level (the full cross-half level plan is in your task, so cross-
references to the other half's EARLIER levels are legal). Then return the
summary object you were asked for. Touch no other file.
