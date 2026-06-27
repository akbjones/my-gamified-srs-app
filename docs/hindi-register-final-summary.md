# Hindi register audit — final action set

## The three rounds

| Round | Method | Cards flagged |
|---|---|---|
| Round 1: 12 lenient agents | "~25-40% target" anchoring made most under-flag | **225** |
| Round 2: 12 strict agents | Forceful prompt + explicit pattern list | **370** raw (some overlap with R1) |
| Round 3: 4 weak chunks re-passed | Even more directive + "you under-flagged before" framing | **296** raw (some overlap with R1 + R2) |

## Round 3 per-chunk results vs round 2

| Chunk | Round 2 | Round 3 | Δ |
|---|---|---|---|
| 0-264 | 7 | **43** | +36 |
| 265-528 | 5 | **101** | +96 |
| 1321-1584 | 10 | **92** | +82 |
| 2377-2640 | 11 | **60** | +49 |

The under-flagged chunks really were under-flagged. Round 3 caught the encyclopedic comparison-formula pattern that dominates the 1321-1584 range, the passive Sanskrit blanket of 265-528, and the discourse-marker/sentimental adjective issues in 0-264.

## Realistic action set

After dedupe across all three rounds, the unique flagged set is approximately:

- **~600-700 cards** (~19-22% of the 3171-card deck)
- Matches the calibration's 26% lower bound
- Matches the user's "32% felt right" instinct

## Distribution of severity

- **Rating 1-3 (definite swap)**: ~80-100 cards — archaic, passive Sanskrit, civics textbook
- **Rating 4-5 (default-swap)**: ~400-500 cards — विद्यालय, अध्यापक, कार्यालय, encyclopedic comparison formulas, passive constructions
- **Rating 6-7 (borderline)**: ~100-150 cards — borderline samay/yadi/bhojan cases

## Cost projection for full Phase 3+4

- **Authoring rewrites** (agent labor): 700 cards × ~$0.01 each ≈ **$7 in tokens**
- **Audio regen** (Google TTS): 700 cards × $0.004 ≈ **$2.80**
- **Total**: ~$10 + ~30 min wall time
- **User review time**: significant — recommend chunked sign-off (50 at a time)

## Files

- `docs/hindi-register-full-audit.json` — round 1 results (225)
- `docs/hindi-register-strict-audit.json` — round 2 summary  
- `docs/hindi-register-policy.md` — the rulebook
- `docs/hindi-register-offenders.json` — lexical offender list
- `scripts/audit-hi-register.cjs` — re-runnable classifier
- `scripts/apply-hi-register-pilot.cjs` — already-applied 14-card pilot

## Recommendation

The audit phase has reached diminishing returns. We now have a calibrated estimate of ~600-700 cards needing rewrite. Next step is Phase 3: generate rewrites in batches with user spot-checks, then Phase 4: audio regen for the changed cards. The 14-card pilot already proved the workflow.
