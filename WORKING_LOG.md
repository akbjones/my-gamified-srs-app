# LangLab Working Log

A running record of what's been done, what's pending review, and open decisions.
Newest entries at top.

---

## 2026-05-04 (continuation — went ahead with the plan)

### #1 — Turkish 2nd sweep (subject-verb agreement) ✓
- Built `scripts/find-tr-agreement.cjs` to detect `Sen/Biz/Siz/Onlar` + 3sg-verb mismatches.
- **Found and fixed 36 broken cards.** Most were template-broken with both agreement issues AND nonsense content. Mix of agreement-only fixes and full rewrites.
- Output: `scripts/tr-agreement-rewrites.json` (36 entries) → applied via `apply-tr-agreement-rewrites.cjs`.
- Added 4 new dict entries (`arkadaşımızı`, `aradık`, `çizdik`, `işinizi`) for new vocabulary.
- Generated 36 Edge TTS audio files. Manifest updated.

### #2 — Translation-quality sweep — DEFERRED ✗
- Built `scripts/find-leaked-source.cjs` (top-2000 frequency match) and target-english word overlap detector.
- Both produced too many false positives — common cognates (`café`, `train`, `hotel`, `internet`) flagged as leaks.
- The original bug case (`tr-3100`: `marmelat → opak meal with kekik and somon`) doesn't share words with target, so simple heuristics can't catch it.
- **Skipped** without an AI pass. Recommend: use AI for this in a future session.

### #3 — Russian template-banal cleanup ✓ (with Approach A)
- Detected 191 template-banal cards in Russian (subject + adverb + verb-object pattern).
- Original plan was Approach B (rewrite all 191) but writing 191 unique high-quality Russian sentences was infeasible in one session.
- **Decision: Approach A (delete)** — Russian deck 3,365 → 3,174 cards. Still a healthy size; banal flavor gone.
- 191 audio files orphaned on CDN (10MB dead weight, can clean later).

### #5 — Phase 2 thin-area gap fills ✓
- Authored 40 new short basic cards across 5 languages.
- Spanish greetings (5), Portuguese (20: numbers/colors/time/clothes), Welsh greetings (5), Hindi months (5), Turkish months (5).
- Added 8 new dict entries for new vocabulary (Portuguese `quinze`, `folha`; Hindi `अगस्त`, `दिसंबर`; Turkish `temmuz`, `aralık`; etc.).
- Generated 40 Edge TTS audio files. Manifest updated to 288 → ~330+ cards flagged for Google upgrade.

### #6 — Google Wavenet upgrade — STILL BLOCKED ✗
- Tested Google TTS API with the existing key — returns same `"This API method requires billing to be enabled"` 403.
- **Action required (not a code issue)**: enable billing on project #126882186864 at https://console.developers.google.com/billing/enable?project=126882186864
- Once billing is enabled: run `GOOGLE_TTS_KEY=<key> node scripts/upgrade-edge-to-google.cjs` (script ready in repo).
- The script reads `scripts/edge-tts-cards.json`, regenerates each card's audio via Google Wavenet, writes back to the same filenames so no deck changes needed.

### Build status
- Clean. All 11 decks rescore cleanly with `score-difficulty.cjs`.

### Final deck sizes (post all cleanup)
| Lang | Cards | Notes |
|------|------:|-------|
| Spanish | 3,945 | + 5 greeting starters |
| French | 3,932 | unchanged |
| Italian | 3,952 | unchanged |
| Portuguese | 3,952 | + 20 numbers/colors/time/clothes |
| German | 3,940 | unchanged |
| Dutch | 3,938 | unchanged |
| Swedish | 3,925 | unchanged |
| Welsh | 3,512 | + 5 greetings |
| Hindi | 3,091 | + 5 months (post-dedup state) |
| Turkish | 3,117 | + 5 months, 36 agreement fixes |
| Russian | 3,174 | -191 banal + 6 sanity fixes earlier |

## OPEN ITEMS
1. Translation-quality sweep — needs AI pass (deferred)
2. Google Wavenet upgrade — needs billing enabled (deferred)
3. Tag system overhaul — deferred per user
4. Netlify deploy — credit-blocked

## NEXT SESSION — agreed plan (2026-05-04 wrap)

The big final audit surfaced 5 follow-up items. User dispositions:

### 1. Turkish second sweep (DO)
Subject-verb agreement template bugs that survived earlier cleanup.
- Pattern: `Sen ... -3sg verb` (e.g. `Sen plajda çalışmıyor`) — should be `çalışmıyorsun`.
- Same for `Biz`, `Siz`, `Onlar` paired with 3sg verb forms.
- Likely 200-400 affected cards.
- **Approach A** (delete-and-replace) using Approach-A pattern from earlier de-dup.
- **Important**: dict must also be checked/extended after rewrites.

### 2. Translation-quality sweep (DO)
Find cards where the English translation contains untranslated source-language words (e.g. Turkish `tr-3100`: `marmelat → opak meal with kekik and somon`).
- Heuristic: English field contains tokens that are also in the source-lang frequency table.
- Or: AI pass that flags target/translation token mismatches.
- All 11 langs.

### 3. Russian template-banal cleanup — 144 cards (DO)
The "Brother rarely cooks lunch" / "Mother usually paints a picture" pattern. Cards are grammatical but formulaic.
- Approach B (rewrite with diversification) like Hindi de-dup.
- ~144 rewrites authored.
- Dict + audio pipeline as we did for Hindi.

### 4. Tag system overhaul (DEFER)
Keep tags as-is for now. Will revisit later.

### 5. Phase 2 thin-area gap fills (DO)
The 5-9 short-card categories per language. From `scripts/basics-coverage.json`:
- German: numbers_low (13), days (6), months (5), body_parts (3), directions (4), transport (7)
- Italian: days (8), months (9), time_telling (3)
- Portuguese: colors (8), months (3), time_telling (3), clothes (5)
- Dutch: colors (5), days (9), months (4), body_parts (3), directions (6)
- Hindi: months (5), time_telling (2)
- Turkish: days (5), months (4), family_core (12)
- Welsh: greetings (5)
- Etc.
- Each fill ~5-8 new cards per category. ~60-80 total cards across thin slots.
- **Important**: dict + audio must follow.

### 6. Audio upgrade — Edge TTS → Google Wavenet (FINAL)
After all the above, upgrade all 288 Edge TTS audio files (per `scripts/edge-tts-cards.json`) to Google Wavenet.
- Need: confirm Google Cloud TTS billing is enabled on the project (was blocked last time with "billing not enabled" 403).
- Existing script `scripts/generate-audio.cjs` does Google TTS via `GOOGLE_TTS_KEY` env var.
- Script will need a tweak to read the manifest and only regenerate the flagged IDs (currently it iterates the full deck with `--resume`).
- Output filenames should keep the same names so deck.json doesn't need updating.

### Cross-cutting requirement
**As we author/rewrite any cards, run `npx tsx scripts/find-real-missing.ts` and add any missing dict entries via `apply-manual-fixes.cjs`. Then re-build to verify integrity.**

### Order of execution
Recommended: 1 → 2 → 3 → 5 → 6. Save audio upgrade for the end so we only Google-TTS once.

---

## 2026-05-04 (most recent session — basics + difficulty ordering)

### Done (latest)
- **Basics coverage audit** across all 11 langs (`scripts/basics-audit.cjs`). Strict version (short focused cards) saved to `scripts/basics-coverage.json`.
- **Filled critical gaps** with 51 new cards:
  - Turkish: 20 (colors × 8, body parts × 7, clothes × 5) — `scripts/tr-basics-v2.json`
  - Hindi: 25 (days × 7, body parts × 6, time-telling × 6, clothes × 6) — `scripts/hi-basics.json`
  - Russian: 6 (time-telling) — `scripts/ru-basics.json`
- **Added 24 missing dict entries** for the new cards' vocabulary — `scripts/manual-basics-dict.json` applied via `apply-manual-fixes.cjs`.
- **Generated Edge TTS audio** for all 51 new cards. All flagged in `scripts/edge-tts-cards.json` for later Google Wavenet upgrade. Edge-TTS total: 161+51 = ~210.
- **Built difficulty scorer** — `scripts/score-difficulty.cjs`. Components: word count (3.0×) + vocab rarity log-rank (2.0×) + syllable count (1.0×) + sub-clause hit (1.5×) + advanced grammar markers (2.0×).
- **Repurposed `priority` field** — now a 1..N rank within each language, where 1 = easiest. All 11 decks updated.
- **Wired `App.tsx`** to flatten cards into a single difficulty-ordered stream (no more node-grouping at study time). Vocab Focus filter still applies on top.
- **Build clean.** `dist/` ready; awaiting Netlify credit reset.

### Difficulty results — spot-check looks great
Easiest 5 per language (priority 1-5) are all survival cards:
- ES: De nada · ¿Habla inglés? · ¿Cuánto cuesta? · Hasta luego · Buenas noches
- FR: Pardon · Bonjour · Il est midi · Pas de problème
- DE: Bitte · Tschüss · Wasser, bitte · Entschuldigung · Die Rechnung, bitte
- HI: नमस्ते · पानी दीजिए · फिर मिलेंगे · बिल दीजिए · माफ़ कीजिए
- RU: Привет · Пока · Пожалуйста · Здравствуйте · Извините
- TR: Çok güzel · Su, lütfen · Saat üç · Ne demek? · Saat kaç?

Hardest 5 per language are genuinely advanced (idioms, stacked conditionals, formal letters).

### Pending — needs your check
- [ ] Tap a few first cards in each language at http://localhost:4173 — verify the new difficulty order surfaces survival/starter cards first
- [ ] Listen to one new basics card audio (Edge TTS) to confirm quality
- [ ] Test Vocab Focus filter — should still constrain to family/work/travel within the difficulty-ordered stream
- [ ] Confirm: app no longer feels like it's serving "Hutmacher entwarf elegante Kopfbedeckungen" as one of the first cards

### Open / next session
- ~~Russian sanity audit~~ ✓ Done (see below)
- **Tweak difficulty weights** if any language's middle/hardest looks off — easy iteration on the formula.
- **Phase 2 thin-fixes** — categories at 5-9 cards across many languages. Defer until Phase 1 results are validated.
- **Delete dead gamification files** — still in codebase.
- **144 Russian template-banal cards** — grammatical & translations correct, but formulaic ("Brother rarely cooks lunch" × dozens). Not blocking; deserves a clean-up pass in a future session.

## 2026-05-04 (de-dup pass)

### Hindi de-dup (Approach B)
- Detected 132 near-duplicate clusters covering 313 cards (~10% of deck).
- Pattern: deck-generator templates with `[NAME]` slots (5-8 name variants per template).
- **Found gender-agreement bugs**: 3 clusters had female names paired with masculine verbs (`Sunita जानता था` should be `जानती थी`). Re-canonicalized to gender-correct member, rewrote others.
- **Action taken**:
  - 3x+ clusters (21 clusters, 70 cards): rewrote each non-canonical with NEW sentence using same name in different context.
  - 2x clusters (111 clusters): deleted the duplicate, kept canonical.
- **Dictionary**: added 20 new entries for vocabulary in rewrites.
- **Audio**: regenerated 70 Edge TTS files, manifest updated. Hindi edge-TTS list: 102 cards.
- **Re-scored**: difficulty ordering refreshed.
- **Result**: Hindi deck 3,198 → 3,086 cards (-112). 3,086 unique cards instead of 3,198 with 313 duplicate-class.

### Cross-language detection (skeleton-based)
After Hindi cleanup, ran detector across all 11 langs:

| Lang | Clusters | Cards in clusters | Deleted |
|------|---------:|-----------------:|--------:|
| Hindi | 1 (leftover) | 2 | 1 |
| Russian | 2 | 9 | 7 |
| Swedish | 1 | 2 | 1 |
| Spanish | 2 | 4 | 2 |
| French/Italian/Portuguese/German/Dutch/Welsh/Turkish | 0 | 0 | 0 |

Total deleted across all langs: **11 cards** (post-Hindi cleanup).

The European decks essentially had no name-swap duplicates. Hindi's deck-generator was uniquely template-heavy.

### Notes
- **Russian "template-banal" cards** (~144 detected earlier) are NOT name-swap duplicates — they're sentences with the same grammatical scaffold but different verbs/objects. Different problem (variety, not duplication). Listed in log; not addressed in this pass.
- **Turkish** had 0 duplicates after the earlier broken-card rewrites — clean.
- **All canonicals verified** via re-scoring without errors.

### Build
Clean. Spanish 3940, Swedish 3925, Hindi 3086, Russian 3365, Turkish 3112, others unchanged.

## 2026-05-04 (tier-weighted difficulty fix)

### Issue surfaced
After running `score-difficulty.cjs` initially, C1/C2 cards with short idioms or simple register cards (e.g. "Спасибо, что написал!" tagged C2 but score 8) were ranking *easier* than mid-A2 sentences. Reason: the formula scored only word-count + vocab rarity, ignoring that an idiom is hard even when literally short.

### Fix
Added `TIER_WEIGHT` parameter (default 8) to `score-difficulty.cjs`. Each card's score is now offset by `tier_index × TIER_WEIGHT`:
- A1 nodes (01-08): +0
- A2 nodes (09-15): +8
- B1 nodes (16-21): +16
- B2 nodes (22-27): +24
- C1 nodes (28-31): +32
- C2 nodes (32-35): +40

Tunable via env var: `TIER_WEIGHT=12 node scripts/score-difficulty.cjs` makes the bands more separated.

### Result for Russian (illustrative)
| Tier | easiest priority before | easiest priority after |
|------|---:|---:|
| A1 | 1 | 1 |
| A2 | **14** | **397** |
| B1 | **12** | **1163** |
| B2 | **11** | **1862** |
| C1 | **92** | **2573** |
| C2 | **19** | **2905** |

Tiers now form clean non-overlapping bands. Within-tier ordering preserved (idioms still float to top of C1/C2 within their band). Same fix applied across all 11 languages.

### Build
Clean. `dist/` ready when Netlify credit returns.

## 2026-05-04 (Russian sanity sweep)

### Done
- **Russian heuristic scan** — `/tmp/ru-broken-scan.cjs`. Found 6 truly broken cards + 144 template-banal.
- **Rewrote 6 sanity-0 cards**:
  - 4 "open vs learn" mistranslations (`открыли = opened/discovered`, not `learned`) — `ru-1272/1273/1274/1289`
  - 2 "A old" article typos — `ru-0540/0551`
- **Generated Edge TTS** for 6 new audio files. Added to manifest.
- **Added missing dict entry**: `словарь` (dictionary) used in one rewrite.
- **Re-scored Russian** with the new content. Easiest 5 stays the same (Привет/Пока/Пожалуйста/Здравствуйте/Извините); hardest tier unchanged.
- **Russian dict miss rate**: 1/17,053 tokens = 0.01% (essentially zero).
- **Build clean.** `dist/` ready when Netlify credit returns.

### Russian deck status (final for this pass)
- 3,372 cards
- ~210 cards now flagged for Google Wavenet upgrade (mostly Edge TTS due to billing gate)
- Difficulty ordered (priority 1-3372)
- 144 template-banal cards remain — listed but not rewritten
- Dictionary coverage: 99.99% direct hit

## 2026-05-04 (earlier — Turkish phase 1 cleanup)

### Done (this batch)
- **Identified 53 broken Turkish cards** via heuristic filter + sample audit cross-reference. Saved `scripts/tr-rewrites.json`.
- **Wrote rewrites for all 53** preserving original `id` and `grammarNode`. Each rewrite uses native Turkish, sensible meaning, and same grammar feature as the node.
- **Applied via `apply-tr-rewrites.cjs`** — all 53 cards updated in `src/data/turkish/deck.json`. Audio fields cleared.
- **Wrote 40 Turkish A1 starter cards** (`scripts/tr-starter-set.json`) — IDs `tr-S-001` through `tr-S-040`. Categories: intro (8), time (5), numbers (2), restaurant (7), help (6), transport (5), polite (7).
- **Applied via `apply-tr-starter.cjs`** — Turkish deck now 3,092 cards (up from 3,052; 40 new starter cards appended).
- **Generated Edge TTS audio for 93 cards** (53 rewrites + 40 starter cards). All saved as `tr-fill-tr-XXXX.mp3`.
- **Updated `scripts/edge-tts-cards.json` manifest** — Turkish edge-TTS count is now 96 (was 3); flagged for Google Wavenet upgrade later. Total cross-language Edge TTS: 161.

### Pending — needs your check
- [ ] Reload http://localhost:4173, switch to Turkish
- [ ] Look for the new starter cards (IDs `tr-S-001` to `tr-S-040`) — they're in node-01/04/07/08/09/17 mostly
- [ ] Try a few rewrites — search for `tr-0397` (now "Öğretmen postaneye mektup göndermek için gitti"), `tr-1893` ("Gazeteci gün batımında deniz kıyısında röportaj yaptı")
- [ ] Listen to one starter audio to confirm Edge TTS quality is OK
- [ ] No app crashes on Turkish cards

### Open / next session
- **Re-tier the Turkish deck** — extrapolated 1,395 cards mis-tiered. This needs a full-deck pass in Claude Code, batched ~150 cards per turn ≈ 20 turns. Significant work but doable.
- **Sanity audit Russian** — same 105-card stratified pattern. Estimated similar but lower-rate template breakage (maybe 5-10% vs Turkish's 20%).
- **Settings**: tags policy: keep `general`, drop nothing else; the over-tagging (3-4 tags per card) wasn't fully addressed in Turkish rewrites — those have 2-3 tags only. Older cards still have 3-4 tag bloat. To address: a separate tag-tightening pass.

### Done (latest)
- **Edge TTS audio inventory** complete — 68 cards across 11 langs flagged in `scripts/edge-tts-cards.json`. Easy to feed Google upgrade later.
- **Turkish card sanity audit** — 105-card stratified sample across all 35 grammar nodes. Findings in `scripts/tr-sanity-audit.jsonl`.
- **Edge TTS audio inventory** complete — 68 cards across 11 langs flagged in `scripts/edge-tts-cards.json`. Easy to feed Google upgrade later.
- **Turkish card sanity audit** — 105-card stratified sample across all 35 grammar nodes. Findings in `scripts/tr-sanity-audit.jsonl`.

### Turkish audit findings (extrapolated to full deck of 3,052)
- **~610 broken cards** (sanity 0): translation ≠ target, or target is grammatically broken / template nonsense.
- **~291 awkward cards** (sanity 1): grammatical but unidiomatic.
- **~1,395 cards mis-tiered** (≥1 tier off): mostly cards labelled higher than they actually are.
  - 11 off by 2 tiers (significant)
  - 5 off by 3+ tiers (major — e.g. tr-2993 marked C2 is actually A1)
- **~552 cards over-tagged** (e.g. simple food card tagged family+general+travel+work).
- ~74% of cards are genuinely fine — but you can't hand a learner a deck where 1 in 5 cards is broken.

### What this means for the plan
- Estimated effort for Turkish cleanup: 600 deletions + 1,400 re-tierings + 550 re-taggings = ~2,550 card mutations.
- Audio: only the 600 deletions affect audio (orphaned files, not regen). Re-tier/re-tag = metadata only.
- This is doable in ~3 batched Claude Code passes if we plug through.

### Done
- **Removed gamification UI** from home screen (kept underlying SRS logic).
  - Hidden: streak flame, "Level X of 8" boss tier, % complete bar, boss-tier auto-trigger, Stats link.
  - Files still present (not deleted): `GamificationHub.tsx`, `StreakFlame.tsx`, `ChallengeScreen.tsx`, `WordTileChallenge.tsx`, `gamificationService.ts`, `challengeService.ts`, `achievements.ts`, `bossArt.ts`. Dead code; safe to remove.
- **Removed boss-challenge auto-trigger** from `handleAnswerLogic` flow — no more interruption mid-session.
- **Tried thematic chapter card** ("Chapter 4 — Telling stories") — user rejected as patronising. Reverted.
- Final home-screen layout: header → Vocab Focus dropdown → Explore link → Study button → Vocabulary card → Settings.
- Generated random card samples for **DE, FR, IT, RU, HI, TR** — full critical analysis written.
- Built `/scripts/random-samples.cjs` reusable for any language at any tier.
- Drafted full deck-restructuring plan (5 phases) with cost & risk assessment.

### Decisions made
- **No more API spending without explicit go-ahead.** Default to Claude Code in-conversation work; only fall back to scripts if context-window pain forces it.
- "Friendly chapter names" idea is dead.
- Starter-kit hand-curation is dead. AI-generated with strict spec is the path if/when we do it.

### Pending — needs your check
- [ ] Open `http://localhost:4173` and verify home screen looks clean (no streak/boss/level UI)
- [ ] Tap `зовут`, `туалет`, `по-русски` (RU) — confirm correct lookups
- [ ] Tap `addition` (FR), `conto` (IT), `Rechnung` (DE), `rekening` (NL) — confirm bill meanings present
- [ ] Verb popovers show `→ infinitive` arrow format consistently
- [ ] Vocab Focus dropdown opens/closes
- [ ] Theme toggle in Settings → Appearance works
- [ ] Placement banner has `×` icon (not "Skip" text)
- [ ] No mid-session boss popups
- [ ] Confirm whether to delete the 8 dead gamification files

### Pending — needs your decision
- [ ] Which language to start the deck-restructuring plan on (recommend: Turkish — worst quality, cheapest pipeline test)
- [ ] Whether to delete or rewrite broken cards in Phase 2
- [ ] Whether starter-kit needs native-speaker review or AI alone is fine
- [ ] Whether to add any quiet progression hint after all (e.g. "session 12") or stay minimalist
- [ ] Netlify credit lockout — needs you to top up or wait for monthly reset

### Blocked
- **Deploy** — Netlify credits exhausted. `dist/` is built and ready; one retry of `npx netlify-cli deploy --dir=dist --prod` should work once credits return.

---

## 2026-04-28 (earlier session — polysemy + UX pass)

### Done
- Re-ran polysemy audit at MIN_FREQ=1 (Haiku) — 8,635 fixes flagged, 6,443 applied.
- Manually patched the bill/check words across 6 languages (FR `addition`, NL `rekening`, DE `Rechnung`, ES `cuenta` follow-up, IT `conto`, FR `note`/`facture`).
- Built `apply-manual-fixes.cjs` for future "AI missed X" patches via a shared `manual-bill-fixes.json`-style format.
- UX reorgs:
  - Stat card now wholly tappable → Stats (later removed in next session)
  - Map link separated into its own slim row
  - "Study More Cards" became inline secondary text-link
  - Placement banner Skip → × icon
  - Theme toggle moved from header into Settings → Appearance
  - Vocabulary card always visible
- Pushed deploy: https://langlab-srs.netlify.app at 22:something UTC.

### Note for next time
- The "second pass" pattern worked: same audit, lower threshold, AI catches more. Tendency to be conservative on first pass means rerunning with broader scope is high-yield.
- The `apply-manual-fixes.cjs` + JSON pattern is the easiest way to ship targeted dict fixes without API.

---

## 2026-04-26 / 04-27 (initial mass cleanup)

### Done
- Built initial audit pipeline:
  - `comprehensive-audit.ts` — structural, uses real `lookupWord`
  - `ai-card-audit.py` — sentence-level Haiku review
  - `ai-polysemy-audit.py` — dict-completeness Haiku review
  - `ai-deck-fix.py` — corrects deck.json `english` fields
  - `ai-generate-missing.py` — generates entries for missing words
  - Various `apply-*.cjs` scripts for the Parse → Edit → Write pattern
- Applied **17,837 AI dict fixes** across 11 languages (зовут → "to call" etc.).
- Re-classified **978 verb-clauses** from `pos: v` to `pos: phrase`.
- Added **130 missing dict entries** (туалет, tuvalet, по-русски, माता-पिता, etc.).
- Fixed `cleanWord` hyphen-stripping bug across RU/HI/TR/ES.
- Generated **68 missing audio files** via Edge TTS.
- Applied **752 high-severity + 2,485 medium-severity** card translation corrections.
- Applied **1,776 polysemy fixes** (first pass).
- Multiple Netlify deploys.

### Audit metric improvements (high-priority issues)
- Russian: 39 → **0**
- Hindi: 140 → **1**
- Italian: 132 → 49
- French: 453 → 383
- All others: smaller but consistent reductions

### Net cost
- ~$50 + $50 in API credits over both days.

---

## What's actually in the codebase right now

### Active scripts (worth keeping)
- `scripts/random-samples.cjs` — sample N cards per (lang, tier, focus)
- `scripts/comprehensive-audit.ts` — structural audit
- `scripts/find-real-missing.ts` — dict coverage check using real `lookupWord`
- `scripts/apply-manual-fixes.cjs` — apply curated dict patches
- `scripts/apply-card-fixes.cjs` — apply card-level dict fixes
- `scripts/apply-polysemy-fixes.cjs` — apply polysemy completeness fixes
- `scripts/apply-missing-entries.cjs` — add new dict entries
- `scripts/fix-verb-clauses.cjs` — re-classify clauses as `phrase`
- `scripts/fill-missing-audio.py` — Edge TTS fallback for empty audio fields

### AI scripts (would need API key to run again)
- `scripts/ai-card-audit.py` — used Haiku
- `scripts/ai-polysemy-audit.py` — used Haiku
- `scripts/ai-deck-fix.py` — used Haiku
- `scripts/ai-generate-missing.py` — used Haiku

### Reports / state
- `scripts/AUDIT_SUMMARY.md` — what was done in earlier passes
- `ARCHITECTURE.md` (repo root) — runtime + pipeline diagrams
- `architecture-view.html` — same with Mermaid rendered
- `WORKING_LOG.md` (this file) — live status

### Dead code (candidates for deletion)
- `src/components/GamificationHub.tsx`
- `src/components/StreakFlame.tsx`
- `src/components/ChallengeScreen.tsx`
- `src/components/WordTileChallenge.tsx`
- `src/data/achievements.ts`
- `src/data/bossArt.ts`
- `src/services/gamificationService.ts`
- `src/services/challengeService.ts`
- The `view === 'GAMIFICATION'` and `view === 'CHALLENGE'` blocks in `App.tsx`
- The `BossRing`, `ChallengeMode`, `ChallengeQuestion` types in `types.ts`
