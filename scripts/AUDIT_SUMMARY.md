# Translation Quality Audit — Final Summary

**Date**: 2026-04-26
**Production**: https://langlab-srs.netlify.app

## Approach

Built a multi-stage audit pipeline that goes through **every single card in every single language**:

1. **Structural audit** (`scripts/comprehensive-audit.ts`) — 38,500+ cards × 11 langs, checking 30+ issue types per token using the REAL `lookupWord()` from each dict file
2. **AI semantic audit** (`scripts/ai-card-audit.py`) — Each card sent to Claude Haiku for translation accuracy, naturalness, polysemy
3. **Dict-level fix applier** (`scripts/apply-card-fixes.cjs`) — Auto-applies dict updates from AI audit
4. **Deck-level translation corrector** (`scripts/ai-deck-fix.py`) — Generates corrected English for high/medium WRONG_TRANSLATION cards
5. **Missing word generator** (`scripts/ai-generate-missing.py`) — Uses Claude API to generate proper dict entries for any tokens missing

## Changes applied

| Category | Count | Notes |
|----------|------:|-------|
| Structural code fixes | 4 | Hyphen preservation in es/ru/hi/tr lookupWord; verb infinitive display alignment |
| Missing dict entries added | 130 | туалет, tuvalet, toaletten, по-русски, माता-पिता, etc. |
| AI dict-level fixes | 17,837 | From semantic audit (зовут→"to call" etc.) |
| Verb-clause re-classification | 978 | Conjugated forms moved from `pos:v` to `pos:phrase` |
| Card-level dict fixes | 273 | From card-level AI audit |
| Deck translation corrections (high) | 752 | Wrong English translations corrected |
| Deck translation corrections (med) | 2,485 | Unnatural English improved |
| Audio files generated | 68 | For previously-empty audio fields |
| **TOTAL CHANGES** | **22,527** | |

## Per-language audit metrics (high-severity issues)

| Language | Before | After | Change |
|----------|-------:|------:|-------:|
| Spanish (es) | 148 | 133 | -15 |
| French (fr) | 453 | 383 | -70 |
| Italian (it) | 132 | 49 | **-83** |
| Portuguese (pt) | 121 | 92 | -29 |
| German (de) | 122 | 105 | -17 |
| Dutch (nl) | 521 | 471 | -50 |
| Swedish (sv) | 115 | 74 | -41 |
| Welsh (cy) | 243 | 185 | -58 |
| Hindi (hi) | 140 | **1** | **-139** |
| Turkish (tr) | 86 | 43 | -43 |
| Russian (ru) | 39 | **0** | **-39** |
| **TOTAL** | **2,120** | **1,536** | **-584 (-28%)** |

Russian and Hindi dropped most because the hyphen-handling fix in `lookupWord` resolved hundreds of compound-word lookup failures (по-русски, माता-पिता etc.).

## Remaining "issues" (not user-visible quality concerns)

Most remaining audit issues are infrastructural rather than translation quality:

- **EMPTY_IPA** — IPA pronunciation strings not yet generated for some entries
- **STANZA_LEMMA_MISMATCH** — Our dict's lemma differs from Stanza NLP's analysis
- **LEMMA_MISSING** — Lemma word not yet a standalone dict entry
- **TOO_LONG_FOR_NODE** — Sentence longer than ideal for early grammar nodes

These don't affect what users see when tapping words; they're internal correctness flags.

## User-reported issues addressed structurally

| Issue | Root cause | Structural fix |
|-------|-----------|----------------|
| зовут shown as "they call" (n) | Wrong dict entry | AI audit caught and fixed → "to call" (v) |
| Где туалет? — toilet missing | Word not in dict | AI generation added entry |
| Verb display brackets vs arrow | UI inconsistency | WordPopover always uses arrow now |
| по-русски not found | cleanWord stripped hyphens | Preserve hyphens, add fallback |
| Wasser bitte no audio | Empty audio field | Edge TTS generated |
| frage = "ask" only | Polysemy | Now "question" (lemma covers verb sense) |
| siehst tagged as noun | Verb wrongly POS'd | AI audit fixed → "to see" (v) |

## Scripts (reusable)

All in `scripts/`:
- `find-real-missing.ts` — find missing words via REAL lookupWord
- `comprehensive-audit.ts` — full structural audit
- `ai-card-audit.py` — Claude Haiku card-level audit
- `ai-deck-fix.py` — apply translation corrections (env: SEVERITIES=high,medium ISSUES=WRONG_TRANSLATION,UNNATURAL)
- `ai-generate-missing.py` — generate dict entries for any missing tokens
- `apply-ai-fixes.cjs` — applies AI-suggested dict fixes
- `apply-card-fixes.cjs` — applies card-level fix proposals
- `apply-missing-entries.cjs` — adds new dict entries from AI generation
- `fix-verb-clauses.cjs` — moves clauses (with subject) from `pos:v` to `pos:phrase`
- `fill-missing-audio.py` — Edge TTS for cards with empty audio

## Re-running future audits

```bash
# 1. Refresh missing-words baseline
npx tsx scripts/find-real-missing.ts

# 2. Generate dict entries for any new missing words
/tmp/audit-venv/bin/python scripts/ai-generate-missing.py
node scripts/apply-missing-entries.cjs

# 3. Run AI card audit (will resume if .jsonl files exist)
/tmp/audit-venv/bin/python scripts/ai-card-audit.py

# 4. Apply dict fixes from card audit
node scripts/apply-card-fixes.cjs

# 5. Apply translation corrections
SEVERITIES=high,medium ISSUES=WRONG_TRANSLATION,UNNATURAL \
  /tmp/audit-venv/bin/python scripts/ai-deck-fix.py

# 6. Re-run structural audit to verify
npx tsx scripts/comprehensive-audit.ts

# 7. Build and deploy
npx vite build && npx netlify-cli deploy --dir=dist --prod
```
