# Kana script-teacher curriculum brief

You are authoring the curriculum for the Japanese kana script-teacher pack,
following the shipped Hangul precedent (scripts/build-hangul-pack.cjs — read
its LEVELS array first for the exact style and item shapes).

## Item kinds

- `letter`: a base kana. Carries a mnemonic.
- `modifier`: ゛ (dakuten), ゜ (handakuten), small ゃ/ゅ/ょ, small っ, ー
  (chōonpu, katakana levels). Carries a mnemonic teaching the RULE.
- `composed`: a worked example applying a rule (が = か+゛, きゃ = き+ゃ).
  `components` lists the constituent glyphs IN TAP ORDER. No mnemonic.
- Do NOT author `word` items — the build script derives them from the deck.

## Mnemonic rules (the load-bearing content)

- ≤200 chars. Shape→sound story: what the GLYPH LOOKS LIKE must connect to
  the SOUND, concretely and honestly (see Hangul examples: "A closed mouth,
  lips sealed in a square – m."). No stretch that misdescribes the shape.
- Chill + factual voice. En dashes (–) only, NEVER em dashes (—).
- Reference already-taught glyphs where genuinely helpful ("ぱ is ば's
  circle-swap"), never forward-reference untaught ones.
- Standard sound facts must be right: し=shi, ち=chi, つ=tsu, ふ=fu, を=o
  (particle), ん=n/m context, ー doubles the vowel. Romanization = Hepburn,
  lowercase; it is the typed answer key.
- `sound` is the display pronunciation ("shi"), `romanization` the canonical
  answer ("shi") — usually identical for kana; を is sound "o (particle)",
  romanization "o"; ん is sound "n", romanization "n".
- `similar`: list glyphs (same script, already/soon taught within your half)
  that beginners visually confuse — these power discrimination drills. Cover
  the classics in your half: あ/お, ね/れ/わ, ぬ/め, る/ろ, は/ほ/ま, き/さ,
  ら/ろ(?) … katakana: シ/ツ, ソ/ン, ク/ケ/タ, コ/ユ, ワ/ク/フ, チ/テ.
  Only genuinely confusable pairs — no padding.

## Output shape

Write ONE JSON file (path given in your task):
```jsonc
{ "levels": [
  { "title": "First vowels and K row",
    "items": [
      { "kind": "letter", "glyph": "あ", "sound": "a", "romanization": "a",
        "mnemonic": "…", "similar": ["お"] },
      { "kind": "modifier", "glyph": "゛", "sound": "voicing mark", "romanization": "dakuten", "mnemonic": "…" },
      { "kind": "composed", "glyph": "が", "sound": "ga", "romanization": "ga", "components": ["か", "゛"] }
    ] }
] }
```
Components/similar are GLYPH strings — ids are assigned mechanically later.
Every composed item's components must appear as items at the same or an
earlier level. Then return the summary object you were asked for. Touch no
other file.
