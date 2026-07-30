# Tip Clarity Standard (agreed 2026-07-24)

The rules every grammar tip must follow, across all 14 languages. Applied as a
review-and-fix pass: a compliant tip is left unchanged; a violating tip is
rewritten minimally to comply. Supplements (does not replace) the base doctrine
in `docs/grammar-tips-doctrine.md` (≤200 chars hard / ~120 ideal, ONE rule, one
worked example, chill+factual voice, cites a word from the card's own sentence,
no em dash, no markdown).

## A · Format

1. **Capitalise normally — like any English sentence.** Don't inherit a capital
   a MID-sentence word only has from starting the example sentence (cite it
   lowercase). But write the tip with ordinary sentence capitalisation: the first
   word takes a capital as usual, and a foreign word that happens to open the tip
   is capitalised too. Nothing more clever than normal English rules.
   - ✗ mid-tip "The suffix marks it: **Arkadaşımdan** = from my friend"
   - ✓ mid-tip "The suffix marks it: 'arkadaşımdan' = from my friend"
   - ✓ tip-initial "'Arkadaşımdan' means from my friend" (normal sentence start)

2. **Quote target words in Latin-script languages.** Wrap every target-language
   token in single quotes so it can't blur into the English. Applies to:
   turkish, welsh, spanish, italian, french, portuguese, german, dutch,
   swedish, indonesian. Do NOT quote in non-Latin languages (hindi, russian,
   greek, korean, japanese) — their script already separates them and they
   carry romanisation in parens instead.
   - ✗ "ei aspirate-mutates: tad-cu becomes thad-cu"
   - ✓ "'ei' (her) aspirate-mutates 'p, t, c', so 'tad-cu' becomes 'thad-cu'"

3. **Romanisation is a pronunciation respelling, not transliteration.** Write
   how a learner should SAY it, in parens after the target word. Per-language
   sound rules:
   - **russian**: unstressed о → "a" (пока = paka, хорошо = harasho); genitive/
     adjective endings -ого/-его: г → "v" (того = tavo, его = yevo, красного =
     krasnava); ё = "yo" (always stressed); я/е unstressed reduce. Give the spoken form.
   - **hindi**: inherent schwa अ ≈ short "a"/"uh"; फ = "ph" (native, e.g. phal),
     फ़ = "f"; nukta letters ज़ = za, क़ = qa; mark long vowels. Match the deck dict.
   - **greek**: phonetic (β = v, δ = dh, γ = gh/y, χ = kh, ει/η/υ = i).
   - **korean**: Revised Romanisation, pronunciation-leaning (받침 assimilation).
   - **japanese**: Hepburn (し = shi, つ = tsu, を = o, は particle = wa).

## B · Correctness

4. **No false absolutes.** Qualify claims that aren't universally true.
   - ✗ "Russian has no verb 'to be'"   ✓ "быть (to be) is normally dropped in the present"

5. **Only real, visible segments.** Every piece you split a word into must
   actually appear in (or be a stated sound-change of) the surface form, and must
   not collide with a different real word. If a sound change hides or alters the
   segment, explain the change — never present a clean-but-false split.
   - ✗ "uyuyamıyorum carries -ama" (there is no "-ama"; "ama" = "but")
   - ✓ "the negative-potential -yama-/-yeme- says can't: 'uyuyamıyorum' = I can't sleep"

6. **English analogies only when genuinely parallel.** Prefer explaining the
   target directly; drop a comparison a learner would question (e.g. English
   preposition-stranding).

## C · Clarity

7. **Plain terms, not jargon.** Name a form by what it does and show it, rather
   than using a linguistics label a beginner won't know.
   - ✗ "bod, the plain verb"   ✓ "'bod' is the 'to be' verb-noun (being)"
8. **One rule, one legible worked example** (base doctrine, reinforced).

## Tiered rigor
Deepest review on the error-prone languages — **hindi, russian, turkish, welsh**
(non-Latin script / agglutination / mutation). Lighter on the Romance +
Germanic + greek/korean/indonesian set (mainly quoting + lowercase + spot
correctness), since their tips are simpler and already gate-clean.
