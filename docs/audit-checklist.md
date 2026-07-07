# The Audit Checklist

Every audit below exists because skipping it once shipped a bug. Run the
full gate after ANY batch that touches deck content, dictionaries,
engines, or audio — batch size does not matter.

Existing tooling is listed per audit. Phase 1 unifies these behind
`scripts/audit-lang.ts <code>` and a CI gate.

## 1. Dictionary coverage — 100%, no exceptions

**Check:** every token of every card's `target` resolves through the
language's **runtime** `lookupWord` (not literal key match — the runtime
strips suffixes, follows lemmas, and handles locale case).

**Tooling:** `scripts/audit-hi-dict-coverage.cjs` (literal, Hindi),
`scripts/tmp/dict-gate.ts` (runtime, RU/TR). Phase 1 merges these.

**Incidents:** 197 missing Hindi entries post-register-rewrite; 114
missing RU/TR entries post-quality-batch; Turkish İ-lowercasing bug
found only because the gate used the runtime path.

## 2. Conjugation round-trip — every verb form resolves

**Check:** for every token tagged `pos:'v'` in any card,
`findInfinitive(form)` returns a lemma, and `conjugate(lemma)` yields a
table containing that form (or the form is the lemma itself / a
recognized non-finite like -कर compounds).

**Tooling:** `scripts/audit-hi-conjugation.ts`,
`scripts/audit-sv-conjugation.ts`. Phase 1 generalizes.

**Incidents:** Hindi 50.7% → 100% (invalid Devanagari from matra-blind
suffixing, feminine reverse-map gaps); Swedish 74% → 89% (37 wrong
lemmas, no findInfinitive export at all).

## 3. Audio parity — R2 byte-identical to local

**Check:** for every audio file referenced by any deck, R2 object ETag
== local MD5. Sample-verify immediately after every upload; full sweep
(`scripts/verify-r2-parity.py`) after regens and periodically.

**Gotchas encoded in the tooling:**
- r2.dev rate-limits: re-verify 429s sequentially before calling them
  failures (958 false alarms on the first full sweep).
- Upload to `langlab-srs-audio` with `quest-audio/` key prefix. The
  `langlab-audio` bucket exists but is NOT served (473 Hindi files once
  vanished into it).
- Select upload sets from deck references, never filename regexes
  (`\d+` silently skipped 126 S-XXX cards).

## 4. Voice consistency — one voice per deck, both paths

**Check:** (a) local files per deck come from a single generation batch
(mtime scan); (b) `GOOGLE_VOICE_MAP` in audioService.ts matches the
voice in `scripts/CANONICAL-VOICES.md` for every language.

**Incidents:** "two women's voices" (fallback map lagged the Chirp3
regen); Welsh male/female alternation (pre-contract era).

## 5. Cache version — bumped in pairs

**Check:** any deploy where audio bytes changed bumps BOTH
`AUDIO_VERSION` (audioService.ts) and `audio-cache-vN` (vite.config.ts).
Grep-able; trivially scriptable.

**Incident:** stale service-worker caches serving old voices for weeks.

## 6. Register sanity — lexical classifier under threshold

**Check:** `scripts/audit-register.cjs <lang>` (offender lexicons in
`docs/*-register-offenders.json`) reports high-severity count. New
content with high-severity hits in Q1/Q2 fails the gate.

**Incidents:** Hindi 472-card cleanup; RU/TR offender lexicons built
2026-07.

## 7. Content quality — LLM audit for new content

**Check:** any batch of NEW cards (not rewrites of audited cards) gets
the 1–7 naturalness+correctness rating pass before merge, quartile-aware
rules, strict prompt ("past audits under-flagged 5×").

**Incident:** 680 template-generated nonsense cards ("cooked the article
at the bank") survived in RU/TR for the deck's entire life because no
LLM ever read them.

## 8. Infra preconditions — checked once per environment, documented

- R2 bucket CORS: GET/HEAD from `*`, verified with an OPTIONS preflight
  (missing CORS silently degraded ALL audio to iOS system TTS).
- SW + `?v=` cache-bust behavior on iOS PWA (force-quit does not evict).

## Gate order for a content batch

```
apply → dict coverage → conjugation round-trip → register classifier
     → audio regen → upload (deck-referenced set) → parity sample
     → cache bump pair → typecheck → build → deploy → parity spot-check
```

A batch failing any step rolls back; the fix ships with the next batch.
No hotfixes in prod.
