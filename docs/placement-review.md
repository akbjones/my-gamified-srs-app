# Placement Test Review — findings + design options

> Review only — no implementation. Every finding verified against the code (file:line cited). Delivered 2026-07-21 in response to: skip-ahead not understood; test quality unknown; graded scale idea; difficulty stock-check screen.

## Findings (most important first)

### 1. [comprehension] The word 'Skip' appears three times across the placement surfaces with OPPOSITE meanings: the benefit copy says the test lets you 'skip ahead', while the decline button is 'Skip, start from the beginning' and the test intro's back button is literally '<Skip'. A scanning user learns 'Skip = the escape hatch from the test', which inverts the entire value prop. This is the single most direct cause of 'people don't get that you can skip ahead'.

**Evidence:** App.tsx:906 ('Take a quick 2-minute test to skip ahead...') vs App.tsx:927 (decline button 'Skip, start from the beginning'); PlacementTest.tsx:254-258 (intro back button labeled 'Skip', wired to onSkip which permanently declines)

### 2. [comprehension] The benefit never appears in any headline or button — only in one line of small muted body text. Modal headline is a question about the user ('Know some X already?'), primary CTA names the effort ('Take the 2-min test' — exam framing), and the test's own intro headline ('What do you already know?') never mentions skipping at all. Worse, the intro's highlighted box demands 'Only mark Know it if you could reproduce the sentence from memory' — a production bar for what is a recognition test — which both deters taking it and pushes takers to place low, feeding 'the test didn't do anything'.

**Evidence:** App.tsx:902-916 (headline + CTA), PlacementTest.tsx:262-278 (intro headline, 'Be strict with yourself... reproduce the sentence from memory', 'About 2 minutes')

### 3. [comprehension] The offer is delivered via the exact pattern the user distrusts: a backdrop-click-dismissible modal that intercepts the FIRST Study tap — the moment of highest 'just let me start' intent. Backdrop-dismiss resolves nothing, so the user loops: tap Study → modal → dismiss → tap Study → same modal, until they pick a button — which trains them to smash the decline button.

**Evidence:** App.tsx:893-896 (fixed overlay, onClick={() => setShowPlacementPrompt(false)} on backdrop), App.tsx:935-944 (re-triggers on every Study tap while !isPlacementComplete)

### 4. [comprehension] The payoff is never tangible at any decision point. The results screen shows node names only — fastTrackedCount is computed inside handleApply, AFTER the user commits. The concrete number ('1,240 cards marked as known') appears only in a temporary toast after returning home, and since fast-tracked cards are due 4-10 days out, today's queue looks identical. A code comment already records users complaining 'did anything happen?'.

**Evidence:** PlacementTest.tsx:237-247 (fastTrackedCount computed only in handleApply), App.tsx:1654-1662 (comment: 'Without this users complained "did anything happen?"... due dates are 4-10 days out — they don't show up in TODAY's queue'), placementService.ts:86-92

### 5. [comprehension] Any resolution is permanent and one-shot: declining the modal, tapping the intro's 'Skip'/'Start from the beginning instead', or exiting mid-test all call setPlacementComplete, and the offer never returns. The only recovery is a Settings item framed as LOSS ('Reset placement test... you'll start from level 0'), not as 'skip ahead'. Onboarding never mentions placement either, so the dismissible modal is the sole exposure to the concept — one accidental backdrop tap away from never existing.

**Evidence:** App.tsx:918-928 (decline sets placementComplete), App.tsx:1665-1668 (onSkip from test sets placementComplete), App.tsx ~1490-1500 (Settings reset with level-0 framing); Onboarding.tsx SLIDES contain no placement mention

### 6. [signal-quality] Skip is a silent pass. Skipping records no rating, an unscored node cannot trip shouldFailNode, so the node passes and ALL its real cards (45-222 each in Hindi) are fast-tracked as known. The cap is floor(2/3 x 70) = 46 skips — enough to 'pass' up to 23 of 35 nodes (~2,600 cards) without a single rating. Also leaky: [no_idea + know_it] passes a node (fail needs noIdea>=2 or noIdea+mostly), so blanking on half of every node's sample still fast-tracks the whole deck.

**Evidence:** PlacementTest.tsx:114-135 (handleSkip: 'never trips shouldFailNode because nothing was scored'), :178-192 (fail conditions; empty or single-no_idea score = pass), :109-112 (skipCap math) — all verified in code this review

### 7. [signal-quality] Dead rule + comment/code mismatch: the 'mostly >= 3 → fail' branch is unreachable because CARDS_PER_NODE = 2, so rating BOTH cards of a node 'Mostly' passes it outright ('Mostly' only ever matters via the adjacent-spillover rule). The header comment claims '1 no idea → fail that node; 2 mostly in a single node → fail' — strictly stricter than what the code implements (needs 2 no-idea, or no-idea+mostly).

**Evidence:** placementService.ts:11 (CARDS_PER_NODE = 2) vs PlacementTest.tsx:183 ('if (s.mostly >= 3) return true' — max 2 ratings/node) and :104-107 (comment) vs :178-192 (implementation) — verified

### 8. [signal-quality] n=2 self-rated cards decide the fate of 45-222 real cards per node (Hindi verified: 35 nodes, min 45 / median 78 / max 222) — statistically unable to distinguish 50% from 90% knowledge. Selection is fully deterministic (evenly-spaced index picks, zero randomization), so every user and every retake sees the identical 70 cards (retakes are memorizable), with systematic bias toward grammar-annotated cards — which are a tiny unrepresentative slice in some decks (Hindi: 115 of 3,172 cards).

**Evidence:** placementService.ts:13-46 (pickSpread deterministic, withGrammar preferred first); Hindi deck counts verified by script this review: 3,172 cards, 115 with grammar, node min/median/max 45/78/222

### 9. [signal-quality] Non-adaptive linear scan with a hard first-fail ceiling: cards run low-to-high through all 35 nodes and the first failed node ends everything, discarding all higher knowledge (spiky profiles invisible; one shaky A1 node while solid through B1 costs 1,000+ cards). The users the test exists FOR face up to 70 cards x 2 mandatory taps each (the forced reveal screen's 'Next' contributes zero scoring signal) — 'About 2 minutes' is only true for beginners who fail early. Also two progress scales on one screen: header counts nodes (12/35), bar counts cards.

**Evidence:** PlacementTest.tsx:194-235 (sequential walk, setCeilingNode + immediate results on first fail), :276-278 ('About 2 minutes'), reveal phase with mandatory Next (~:401-511), node counter vs card-based bar (~:312-326)

### 10. [signal-quality] The signal is pure self-report with a free cheat: the user may peek the English translation, then rate 'Know it' with no penalty — translationRevealed is tracked and reset per question but handleConfidence never reads it. The one honesty signal the UI already captures is thrown away; the only compensation is the intro's honesty plea.

**Evidence:** PlacementTest.tsx:50 + :92-95 (state tracked/reset) vs :137-154 (handleConfidence ignores it) — verified

### 11. [rating-scale] A graded scale already EXISTS (No idea / Mostly / Know it) — the user's 'it's just know or not know' perception exists because the mapping is near-binary, not the input: 'Mostly' almost never changes outcomes (dead rule above), handleApply passes ONLY ceilingNodeIndex (the collected nodeScores are discarded), and every fast-tracked card gets an identical legacy seed (mastery 2, 4d interval, ease 2.5) that FSRS migration turns into stability=4d, difficulty=5 — the same for a day-one 'Hello' as for a B2 card scraped past. The problem to fix is the mapping, not adding a slider.

**Evidence:** PlacementTest.tsx:237-247 (only ceilingNode survives), placementService.ts:86-97 (uniform seed, no FSRS fields), srsService.ts:56-70 (migration: stability = interval days = 4, easeToDifficulty(2.5)=5) — all verified

### 12. [rating-scale] Vocabulary mismatch: placement uses No idea / Mostly / Know it while the study session (and onboarding) teach No idea / Hard / Knew it / Very easy. The user's first two rating experiences in the app use different scales, muddying both.

**Evidence:** PlacementTest.tsx:359-378 (3 buttons) vs StudySession.tsx:65-68 (4 ratings) and Onboarding.tsx slide 4

### 13. [rating-scale] The uniform seed causes a review avalanche AND lying stats: a full-deck pass puts ~3,200-3,900 cards due inside a 7-day window (~450-560/day, each restarting at 4-day stability). Meanwhile the stored interval stays 4 days, below the 21-day RETENTION_THRESHOLD, so getRetention reports ~0% retention immediately after the toast says thousands of cards are known. Graded per-node stability seeding fixes both as a side effect.

**Evidence:** placementService.ts:86-92 ('Stagger due dates across 4-10 days to prevent review avalanche' — spreads one cliff across one week), srsService.ts:75-80 (RETENTION_THRESHOLD 21d, counts interval>=21d only) — verified

### 14. [stock-check] No difficulty check-in exists anywhere today; the only difficulty levers are buried in Settings plus the loss-framed placement reset. The building blocks are all present: the View FSM (useState union in App.tsx:76) trivially admits a full-screen 'CHECKIN' view gated like PLACEMENT; UserStats.totalReviews and the mastery map's rating/interval distribution can both trigger the screen and pre-fill an evidence-based prompt; and WordTileChallenge (boss fights) is an existing objective-check mechanic reusable for verifying 'too easy' claims.

**Evidence:** App.tsx:76 (View union has no check-in state), src/types.ts:47-49 (UserStats.totalReviews), srsService.ts:75-80 (aggregation pattern exists), src/components/WordTileChallenge.tsx (existing correct/incorrect -> rating mapping used in StudySession.tsx:~353)

---

## Design options by theme

### 1-comprehension

**Full-screen fork with benefit-first copy (kill the modal AND the double 'skip')** ⭐ RECOMMENDED

- Mechanics: Replace the interstitial with a full h-dvh choice view (new state in the View FSM, or PlacementTest's intro restyled): first Study tap on an unplaced language routes there. Two large option cards: 'Start from zero — I'm new to Spanish' vs 'Skip ahead — a 2-min check marks everything below your level as known (often 1,000+ cards)'. No backdrop, no X; the word 'skip' appears ONLY on the benefit path, never on decline. Inside the test: intro headline sells the payoff ('We stop when it gets hard; everything below that is skipped'), soften the honesty bar to recognition-level ('Know it = you understood it before seeing the translation'), fix '2 minutes' to 'usually 2-5 minutes — the further you get, the better'. Results screen computes fastTrackedCount BEFORE Apply (pure function of ceilingNode, all inputs already in scope) and puts it in the button: 'Start learning — 1,240 cards behind you'. Replace the 6s toast with a home banner that persists until the first session starts.
- Tradeoff: One extra full screen for true beginners (one tap, never returns) and modestly more code than copy-only — but it attacks all three root causes at once (skip collision, invisible payoff, dismiss-loop) and matches the user's own anti-popup doctrine.

**Copy-only pass inside the existing modal**

- Mechanics: Keep the modal, rewrite every string: headline 'Already know some Spanish? Skip ahead.', primary 'Find my level (2 min)', secondary 'I'm new — start from zero' (never 'skip' on decline), same reframe on the test intro and results button as above.
- Tradeoff: Cheapest fix (an evening, zero flow risk) and fixes the two sharpest wording findings — but the medium stays a dismissible popup intercepting the highest-intent tap, so gains are capped by everyone who reflex-dismisses; strictly dominated by the fork, which includes this copy.

**Recoverable re-entry after decline**

- Mechanics: Stop making decline permanent-and-buried: rename the Settings item to 'Take the placement test' (never taken) / 'Retake placement — skip ahead' (taken), and optionally show a small persistent home row ('Know some Spanish already? Skip ahead') until taken or explicitly dismissed.
- Tradeoff: The Settings rename is near-free and worth doing regardless; the home row costs real estate and risks feeling naggy. Note the recommended stock-check screen (theme 4) already provides the systematic second chance, so this is a complement, not the fix.

### 2-test-quality

**Plug the verified leaks (minimal surgery, ~50-100 lines)** ⭐ RECOMMENDED

- Mechanics: Five surgical fixes to code confirmed broken: (1) skip becomes neutral — a node needs >=1 recorded rating to pass; fully-skipped nodes are NOT fast-tracked (or trigger one forced probe); (2) replace the dead 'mostly>=3' with 'mostly>=2 in one node -> fail' and make [no_idea + know_it] draw a 3rd tiebreak card instead of passing — restoring the documented intent; (3) auto-downgrade 'Know it' to 'Mostly' when translationRevealed is true (state already tracked, currently discarded); (4) randomize pickSpread's offset per attempt so retakes see different cards and the grammar-card bias softens; (5) make the reveal screen optional ('see translation & tip' tap) — cuts up to 140 mandatory taps to ~70 and makes the time promise honest.
- Tradeoff: Keeps the linear walk, n=2 thinness, and hard first-fail ceiling — one unlucky node still caps everything — but every fix is small, independently shippable, and repairs a verified defect rather than redesigning on a guess. Do this first; graduate to the adaptive option only if placement stays a priority after.

**Adaptive tier search (binary-search tiers, sample the boundary densely)**

- Mechanics: Rewrite scoring as two stages: coarse probes at tier anchors (start ~A2, jump up on clean pass, down on fail) bracket the level in ~6-10 cards; then 4-6 cards across the 2-3 nodes around the bracket pick the exact ceiling. Total 12-18 cards for everyone — the advanced users the test exists for finish FASTER than today's beginners. Include the leak fixes in the rewrite. A single bad node no longer decides; the bracket does.
- Tradeoff: Real rewrite of the state machine (~1 day), progress bar needs rethinking (total length unknown upfront), and it assumes rough monotonicity of node difficulty. Puts the sampling budget where the statistical uncertainty actually is — the right destination, but not the first step.

**Objective spot-checks via WordTileChallenge**

- Mechanics: After every 2-3 nodes claimed 'Know it', insert one tile-ordering challenge (reuse the existing WordTileChallenge component from boss fights) on a sentence from those nodes; a fail downgrades those nodes to 'Mostly' (partial credit under the theme-3 mapping). ~5-8 objective checks per full run converts pure self-report into partially demonstrated signal.
- Tradeoff: Best signal-per-effort ceiling but the most build (embedding + downgrade plumbing), slows the test ~30-60s, and its value is unproven until the leak fixes ship and prove insufficient. Layer on later, not now.

### 3-rating-scale

**Align to the study 4-scale and make grades seed FSRS (fix the mapping, not the input)** ⭐ RECOMMENDED

- Mechanics: Replace No idea/Mostly/Know it with the exact study buttons — No idea / Hard / Knew it / Very easy (one rating vocabulary app-wide; onboarding already teaches it). Then stop collapsing to a ceiling index: pass nodeScores through handleApply and have applyPlacementResults write real per-node FSRS state — 'Very easy' nodes deep below ceiling seed ~60-90d stability tapering to ~21d near the ceiling (difficulty ~4, state Review, due dates proportional to stability); 'Knew it' ~10-21d; 'Hard' nodes pass but their cards enter the learning queue mixed into early sessions instead of being marked known; 'No idea' feeds the fail logic as today. Set interval = due - now so fields agree. Side effects for free: the 450-560/day avalanche dissolves and getRetention stops reporting ~0% after a strong placement.
- Tradeoff: Moderate rework (~100 lines in placementService + signature change + seeding in srsService); seeding constants are guesses until real reviews calibrate — cheap, since FSRS self-corrects within 1-2 reviews per card. 'Hard = pass but practice soon' needs one explanatory line on results. Highest impact-to-effort in this whole review.

**Per-node verdict instead of per-card ratings**

- Mechanics: Show a node's 2-3 sentences together on one screen and ask ONE question — 'This level: Easy / Mixed / Hard?' — mapping to long fast-track / short fast-track + some learning cards / ceiling. Halves interactions and matches the unit of judgment to the unit of consequence (nodes, not cards).
- Tradeoff: Arguably more honest about what n=2 can measure, but loses per-card granularity (no spot-checking individual claims), multi-sentence screens are heavy on mobile, and it forks the rating vocabulary again instead of unifying it.

**Continuous slider (the user's floated idea — advise against as literal UI)**

- Mechanics: A 0-100 confidence slider per card ('Don't know' -> 'Easy'), thresholded back into discrete buckets since the ceiling logic and FSRS consume discrete grades anyway.
- Tradeoff: Strictly worse than buttons: drag+release is slower than one tap, poor thumb ergonomics, false precision immediately quantized away, and inconsistent with study. The instinct behind the suggestion — 'graded, with visible consequences, not know/don't-know' — is correct and is fully delivered by the 4-button + FSRS-seeding option; note the graded scale technically already exists and is being discarded at apply time.

### 4-stock-check

**One-shot full-screen check-in, evidence-corroborated, at session end** ⭐ RECOMMENDED

- Mechanics: New 'CHECKIN' value in the View union, rendered full h-dvh like PlacementTest — no backdrop, nothing to click away. Trigger: once ever per language, inserted into the session-complete flow (a natural pause, not an interception) after the 3rd completed session OR ~60-75 rated reviews, whichever first (totalReviews exists; once-flag persisted like placement's). The screen leads with the user's own data ('You've rated 87% of cards Knew it or easier' — computable from the mastery map) then asks 'How does the difficulty feel?' with three full-width cards, each stating its concrete consequence BEFORE the tap: Too easy -> 'Take a quick skip-ahead check from where you are' (PlacementTest with a start-node param — this is ALSO the second chance for everyone who reflex-dismissed the original offer) and/or raise daily new cards (numbers shown); About right -> 'Great — we won't ask again'; Too hard -> lower daily new limit (shown: '15 -> 8 new/day') and bias the queue toward review for a week.
- Tradeoff: Most build of the three (new view, trigger plumbing, start-node param, limit adjustments), but it is the only option meeting every stated constraint — full screen, once, early-but-informed, real consequences — and it doubles as the recovery path for placement's one-shot-forever problem. If the data preamble slips, ship the plain screen first; the pre-fill is ~30 lines of polish.

**Same screen, self-report only (no data preamble)**

- Mechanics: Identical trigger, view, and consequence-cards, but just the plain question — no rating-distribution computation.
- Tradeoff: Ships a day sooner, but a bare 'how does it feel?' invites noise (modesty under-reports 'too easy'; one bad session over-reports 'too hard'); the evidence preamble is one pass over the mastery map and is the part that makes the answer trustworthy. Acceptable v1 subset of the recommended option, not a separate destination.

**Signal-triggered or recurring variants (rejected baselines)**

- Mechanics: Either fire the screen only when the rating mix crosses an extreme threshold (>70% Very easy across 2 sessions), or embed a recurring one-row difficulty question in the session summary every ~10 sessions.
- Tradeoff: Signal-only contradicts the spec ('this just happens once after a bit' — unconditional) and silently skips mixed-but-frustrated users; recurring is glanceable furniture, not a screen that demands an answer, and repeated asking is exactly the naggy pattern the no-nag doctrine forbids. Keep the signal computation only as pre-selection input to the recommended screen.
