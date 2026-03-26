# LangLab UX Audit Report

**Date:** 2026-03-26
**Scope:** Complete user experience flow from first launch to daily study
**Verdict:** Solid SRS engine and attractive UI, but significant FTUE friction and retention gaps that would cause most users to churn within 2 weeks.

---

## 1. First-Time User Experience (FTUE)

### What a brand new user sees

1. **Language picker overlay** -- Full-screen grid of 11 languages with flags. Clean and clear. The user picks one and the overlay dismisses. This is the only "onboarding" step.

2. **Home screen** -- The user lands on the home screen with:
   - A streak flame showing "0"
   - A placement test banner ("Know some Spanish? Skip ahead with a 2-min test")
   - A vocab focus selector (General/Travel/Work/Family)
   - A "Study" button showing "X due + Y new"
   - Stats/Map buttons, Settings gear

3. **No tutorial, no explanation, no welcome message.** A new user sees a dense dashboard with jargon like "due reviews," "new today," "Misión 1 of 22," vocab focus categories, and a progress bar with no context. There is zero guidance on what to do first.

### Placement test flow

The placement test is well-designed technically:
- Shows sentences from easy to hard
- Three confidence buttons: "Know it" / "Mostly" / "No idea"
- Strict scoring (1 "no idea" = fail that node)
- Reveals translation + grammar nudge after each rating
- Re-rate button for second-guessing
- Results screen shows level placement

**Problems:**
- The banner is easy to miss -- a small card among many elements
- "Skip" dismisses it permanently with no confirmation
- If a user skips it, there is no way to access it again except through Settings > "Reset placement test" (hidden at the very bottom)
- The test shows raw target-language sentences with no English -- intimidating for absolute beginners who might think they need to already know the language to start

### Time to first flashcard

- Best case (skip placement): 2 taps (language select, then "Study")
- With placement test: ~3-5 minutes
- This is acceptable, but the lack of any explanation means the first flashcard experience is confusing

### First flashcard experience

The user sees a sentence in the target language with "Tap to reveal" below it. After tapping:
- The English translation appears
- Four grading buttons appear: Again / Hard / Good / Easy with cryptic time hints (1m, 6m, 10m, 4d)
- A "?" button exists that opens a grading guide modal

**Critical problem:** A brand new user has no idea what Again/Hard/Good/Easy mean, what the time intervals represent, why there are 4 buttons instead of right/wrong, or what the new/learn/review counters at the top mean. The "?" help is not discoverable -- it is a tiny character below the grading buttons.

### FTUE Grade: D

The app assumes the user already knows how SRS works. There is no onboarding flow, no tooltip tour, no "here's how this works" screen. Competitors like Duolingo have extensive onboarding; even Anki (notoriously unfriendly) has a manual linked prominently.

### Recommendations

| Improvement | Difficulty | Impact |
|---|---|---|
| Add a 3-screen onboarding carousel explaining the core loop (see sentence, self-grade, spaced review) | Easy | High |
| Show a tooltip on the first card explaining the 4 grading buttons | Easy | High |
| Make placement test more prominent for new users (full-screen CTA, not a banner) | Easy | Medium |
| Add a "How it works" persistent link in settings or help menu | Easy | Low |
| Simplify first session to 2 buttons (Knew it / Didn't know) with an option to switch to 4-button mode | Medium | High |
| Add animated micro-tutorial on first card flip | Medium | Medium |

---

## 2. Daily Study Loop

### Returning user experience

A returning user sees the home screen with:
- Current streak count (with flame animation)
- Due reviews count and new cards available
- Current grammar node and tier
- Boss/experiment progress bar
- One-tap "Study" button with counts

This is clean and effective. The single "Study" button with embedded counts ("Study . 12 due + 5 new") is well-designed.

### Due card calculation

Reviews come from ALL unlocked nodes (unified deck), not just the current node. New cards come only from the current frontier node. This is correct SRS behavior but is never explained to the user. The daily new card limit (configurable 1-50, default appears to be in settings) caps intake.

The queue is built by interleaving reviews with new cards at a 3:1 to 5:1 ratio, with sibling burying to avoid same-topic clusters. This is solid.

### "All Caught Up" state

When all reviews are done and daily new card limit is reached, the button says "All Caught Up" (disabled). Below it, a "Study More Cards" button appears with a number input (default 10). This overrides the daily limit.

**Problems:**
- "All Caught Up" is a dead end with no celebratory moment -- no confetti, no "great job," no encouragement
- The "Study More Cards" button + number input is confusing UX -- why is there a number input? What does it mean? Is this extra credit?
- A caught-up user has nothing else to do in the app. No reading, no listening exercise, no vocabulary review prompt

### Session length

Sessions include all due reviews + up to the daily new card limit of new cards. With default settings, a typical session might be 15-30 cards (reviews accumulate over days). The session card limit (configurable 5-50) caps new cards per session when no reviews exist.

**Problem:** If a user has been away for days, they could face 100+ due reviews in a single session. There is no session length cap for reviews -- only new cards are limited. This is a major overwhelm risk.

### Daily Study Grade: B-

The core loop works, but lacks polish around the edges. The overwhelm risk from accumulated reviews and the dead-end "All Caught Up" state are significant.

### Recommendations

| Improvement | Difficulty | Impact |
|---|---|---|
| Cap total session size (e.g., 50 cards) with "Continue" option | Easy | High |
| Add celebration animation/sound on "All Caught Up" | Easy | Medium |
| Show estimated session time ("~5 min") on Study button | Easy | Medium |
| Replace "Study More Cards" with clearer "Practice Extra" CTA | Easy | Low |
| Add a "Catch Up" mode that prioritizes overdue cards by age | Medium | Medium |
| Show review forecast ("12 cards due tomorrow, 8 the day after") | Medium | Medium |

---

## 3. Progression & Motivation

### How the user knows they're making progress

1. **Streak flame** -- Prominent on home screen and stats page. Tiers: none/small/big/blue/lightning at 0/7/30/100/365 days. Good visual feedback.
2. **Topic Map** -- Linear path with 35 grammar nodes across tiers (A1 through C2). Shows completion percentage per node, auto-scrolls to current node. Locked nodes are grayed out.
3. **Stats page** -- Shows streak, total reviews, cards learned, recall percentage.
4. **Boss progress bar** -- On home screen, fills up as new cards are learned. Boss every 150 new cards, checkpoint every 50.
5. **Achievements** -- 12 periodic-table-themed achievements (Hydrogen through Nobelium).

### Topic Map assessment

The map is clean but potentially overwhelming -- 35 nodes is a lot to scroll through. The tier labels (A1, A2, B1, etc.) are standard CEFR levels which is good for language learners who know the framework, but meaningless for casual users.

**Problem:** The map is read-only. Users cannot tap a node to study it specifically -- they are locked to the linear progression. This removes agency and could frustrate users who want to jump to a specific grammar topic (e.g., they need past tense for a trip next week).

### Achievement system

The 12 achievements are themed as chemical elements (Hydrogen, Helium, Carbon...), which matches the "LangLab" science theme. However:

- **Frequency is poor.** The gaps between achievements are huge: first review (trivial) -> 3-day streak -> 7-day streak -> 30-day streak. After the first few, the next achievement might be weeks away.
- **No notification on unlock.** `checkAchievements` returns newly unlocked achievements but the App component does not use the return value to show a toast or celebration. Achievements unlock silently.
- **No progress toward next achievement.** The stats page shows locked achievements but not how close you are to unlocking them.

### Streak system

- Streak increments on first study of the day
- Streak freeze: earn 1 every 7 days (max 3 banked)
- Missing one day with a freeze: streak continues
- Missing one day without freeze: reset to 1
- Missing 2+ days: always reset

**Problem:** The freeze mechanic is hidden -- a tiny line of text appears only when you have freezes. Users don't know they're earning freezes or how many they have until they check the stats page. A 30-day streak lost to a forgotten day with no warning is devastating for retention.

### Boss challenges

Boss battles trigger every 150 new cards learned. They consist of 8 word-tile puzzles (rearrange words into correct sentence order). Need 6/8 to win. Ring system: bronze (6+), silver (perfect), gold (perfect under 90s).

**Strengths:** The boss system is thematic and adds variety. The ring system encourages replay.
**Weaknesses:** 150 cards between bosses is too long (weeks of daily study). The word-tile challenge type is the ONLY challenge type -- it gets repetitive.

### Progression Grade: C+

The pieces are there but they do not connect into a motivating loop. Silent achievements, invisible streaks freezes, and infrequent boss battles leave gaps where users feel no progress for days at a time.

### Recommendations

| Improvement | Difficulty | Impact |
|---|---|---|
| Show achievement unlock toasts/celebrations when they trigger | Easy | High |
| Show progress bars on locked achievements ("42/50 cards learned") | Easy | High |
| Add a "streak freeze" indicator on the home screen near the flame | Easy | Medium |
| Send streak-at-risk warnings ("Study today to keep your 14-day streak!") | Medium | High |
| Reduce boss interval to 75-100 new cards for more frequent milestones | Easy | Medium |
| Add more achievement milestones (every 25 cards, every 5 days, first perfect session) | Easy | Medium |
| Allow tapping map nodes to study specific topics (breaks linear lock) | Medium | High |
| Add weekly/monthly progress summaries | Medium | Medium |

---

## 4. Pain Points & Drop-off Risks

### Where users will get frustrated and quit

1. **First session confusion (Day 1 churn).** No explanation of the grading system. A casual user who sees Again/Hard/Good/Easy with no context will feel stupid and quit. This is the #1 drop-off point.

2. **Review pile-up (Day 7-14 churn).** After missing 2-3 days, a user faces 50-100 due reviews. There is no way to reduce this except grinding through them all. Anki users know this pain; casual users just uninstall.

3. **Grading anxiety.** The 4-button system (Again/Hard/Good/Easy) is a cognitive load issue. Users constantly wonder "was that Hard or Good?" This uncertainty makes every card stressful rather than enjoyable. Research shows binary grading (Pass/Fail) has equivalent long-term outcomes with less friction.

4. **No grammar explanation.** When a user encounters a grammar concept they don't understand, the only help is a one-line "grammar tip" on ~28% of cards. There is no lesson, no explanation page, no link to resources. The placement test shows grammar "nudges" per node, but the main study flow does not use these.

5. **Leech handling.** Cards that fail 5+ times get a "Leech" badge but are NOT suspended -- they keep appearing. The user sees the warning badge but has no way to deal with the problem (no option to suspend, no extra help, no simplified version of the card).

6. **No easy mode.** There is no way to reduce difficulty. The only adjustments are daily new card limit and cards per session. A struggling user cannot switch to simpler cards, get hints, or reduce the grading complexity.

### Grading system assessment

The 4-button system with interval hints (1m, 6m, 10m, 4d) is standard Anki-style but hostile to casual learners. The interval hints are especially confusing -- a new user has no idea what "1m" means or why it matters.

The WordTileChallenge provides binary grading (correct/incorrect auto-graded), which is a better UX. But it only activates for randomly selected cards via `selectTileCandidates`.

### Pain Points Grade: D+

The app does not handle failure gracefully. There is no safety net for struggling users, no progressive difficulty reduction, and no way to escape the review pile-up death spiral.

### Recommendations

| Improvement | Difficulty | Impact |
|---|---|---|
| Add a 2-button grading option (Knew it / Didn't know) as default for new users | Medium | Critical |
| Cap daily review sessions at 50 cards with "Continue later" option | Easy | High |
| Add grammar lesson/explanation pages linked from grammar tips | Medium | High |
| Auto-suspend leech cards after 8 fails with option to unsuspend | Easy | Medium |
| Add a "Vacation mode" that pauses review scheduling | Easy | Medium |
| Show a hint button (first letter, word count, etc.) before revealing answer | Medium | Medium |
| Add "Bury until tomorrow" option for overwhelming cards | Easy | Medium |

---

## 5. Missing Features (vs. Competitors)

### Compared to Duolingo, Memrise, Anki, Busuu

| Feature | LangLab | Duolingo | Memrise | Anki |
|---|---|---|---|---|
| Flashcard SRS | Yes (strong) | No (fixed curriculum) | Yes | Yes (gold standard) |
| Speaking practice | No | Yes | No | Via add-ons |
| Typing/fill-in-blank | No | Yes | Yes | Via card types |
| Stories/conversations | No | Yes (Stories) | Yes (videos) | No |
| Grammar lessons | Minimal tips | Full lessons | Minimal | No |
| Social/leaderboards | No | Yes (leagues) | No | No |
| Offline mode | No | Yes (Pro) | Yes (Pro) | Yes |
| Cross-device sync | No (localStorage only) | Yes | Yes | Yes (AnkiWeb) |
| Audio pronunciation | TTS only | Native speakers | Native speakers | Varies |
| Progress sharing | No | Yes | No | No |
| Streaks/gamification | Basic | Extensive | Basic | None |
| Word tile challenges | Yes | Yes | No | No |
| Conjugation tables | Yes (excellent) | No | No | No |
| Dictionary/vocab list | Yes (excellent) | No | No | No |

### Critical missing features

1. **No typing exercises.** The user never produces output -- they only read and self-grade. Productive recall (typing the answer) is significantly more effective for learning than recognition.

2. **No speaking practice.** Audio input via Web Speech API is feasible and would add a crucial skill dimension.

3. **No offline mode.** The app uses localStorage for state but imports all deck data statically. It could work offline as a PWA with a service worker, but this is not implemented.

4. **No cross-device sync.** Progress is trapped in the browser's localStorage. Clearing browser data = losing everything. This is a critical retention risk -- users who switch devices or browsers lose all progress.

5. **No social features.** No leaderboards, no friends, no sharing. Social competition is Duolingo's strongest retention lever.

6. **No listening comprehension mode.** Audio exists but is only used as supplementary playback. A dedicated "listen and translate" mode would add variety.

### Missing Features Grade: C

LangLab has excellent depth in areas competitors lack (conjugation engine, vocabulary tracker, grammar tips) but is missing the breadth of exercise types that keep users engaged.

### Recommendations

| Improvement | Difficulty | Impact |
|---|---|---|
| Add PWA manifest + service worker for offline support | Medium | High |
| Add typing/input mode (type the translation) as card variant | Medium | High |
| Implement cloud sync via simple backend (Supabase/Firebase) | Hard | Critical |
| Add listening-only mode (hear sentence, type/select translation) | Medium | Medium |
| Add basic sentence translation exercise (English -> target language) | Medium | Medium |
| Add export/import progress as JSON file (stopgap for sync) | Easy | Medium |
| Add share streak/progress to social media | Easy | Low |

---

## 6. Retention Mechanics

### What brings the user back tomorrow?

1. **Streak fear** -- The only mechanic that creates urgency. However, streaks are fragile (lose everything after 2 missed days even with freezes) and the freeze system is poorly communicated.

2. **Due reviews** -- SRS creates natural urgency: "You have cards to review today." But this only works if the user opens the app. There are no reminders.

3. **Boss progress** -- The progress bar toward the next boss/experiment is visible on the home screen. But at 150 cards per boss, this moves slowly.

### Push notifications

**Not implemented.** No service worker, no notification permission request, no reminder system. This is the single most impactful missing feature for retention. Studies show push notifications increase D7 retention by 20-30%.

### Streak freeze mechanic

- Earn 1 freeze every 7 consecutive days (max 3)
- Auto-consumed when you miss exactly 1 day
- Dates of freeze use are tracked
- Explanation only shown when freezes > 0

**Problems:**
- Users don't know they have freezes until they need one
- No warning before a streak is at risk
- No way to manually trigger a freeze (auto-only)
- Losing a long streak is the #1 reason users quit language apps permanently

### Daily goals / targets

There is a "Daily Intake" progress bar showing new cards consumed vs. daily limit. But there is no formal daily goal (e.g., "Complete 5 minutes of study" or "Review 20 cards"). The app considers the day complete when you start a session (streak updates on session start, not completion).

**Problem:** Starting a session and reviewing 1 card counts as maintaining your streak. There is no minimum effort threshold. This means the streak is not meaningful as a commitment device.

### Retention Grade: D

The app has almost no proactive retention mechanics. It relies entirely on the user remembering to open it. The streak system is the only hook, and it is poorly communicated with no notifications.

### Recommendations

| Improvement | Difficulty | Impact |
|---|---|---|
| Add PWA with push notification reminders ("You have 15 cards due!") | Medium | Critical |
| Add daily goal system (configurable: 5/10/15 min or card count) | Medium | High |
| Show streak freeze count on home screen prominently | Easy | Medium |
| Send streak-at-risk warning at 8 PM if user hasn't studied | Medium | High |
| Require minimum 5 cards reviewed to count streak (not just session start) | Easy | Medium |
| Add weekly email digest with progress summary | Hard | Medium |
| Add "study reminder" time setting (daily notification at user-chosen time) | Medium | High |
| Show "Come back tomorrow for X reviews" on session complete | Easy | Medium |

---

## Executive Summary

### Would this app retain users after 30 days?

**Probably not for most users.** Here is the expected funnel:

- **Day 1:** 60% of users who install will complete first session (high friction FTUE)
- **Day 3:** 30% still active (confusion about grading, no notification reminders)
- **Day 7:** 15% still active (novelty worn off, no social hooks, no variety)
- **Day 14:** 8% still active (review pile-up for those who missed days)
- **Day 30:** 3-5% still active (only dedicated SRS enthusiasts)

For comparison, Duolingo retains ~20% at Day 30.

### Top 5 changes for maximum retention impact

1. **Add push notification reminders via PWA** (Medium difficulty, Critical impact)
   Without notifications, the app is invisible. Users must remember to open it.

2. **Simplify grading to 2 buttons by default** (Medium difficulty, Critical impact)
   Again/Hard/Good/Easy intimidates casual learners. A binary "Knew it / Didn't know" with an advanced mode toggle would dramatically reduce Day 1 churn.

3. **Add onboarding flow** (Easy difficulty, High impact)
   Three screens explaining the core loop would prevent the confusion that causes immediate uninstalls.

4. **Implement cloud sync** (Hard difficulty, Critical impact)
   localStorage-only progress is a ticking time bomb. One cleared cache = months of progress lost.

5. **Cap review sessions and add catch-up mode** (Easy difficulty, High impact)
   The review pile-up death spiral is the most common reason intermediate users quit SRS apps.

### What LangLab does well

- **Conjugation engine** -- The verb conjugation tables in the vocabulary list are exceptional. This is better than any competitor.
- **Grammar tips** -- Contextual grammar notes on cards are useful and well-written.
- **Word popover** -- Tapping individual words for definitions during study is excellent UX.
- **Boss battle system** -- The experiment/boss theming is unique and engaging when it triggers.
- **Vocabulary tracker** -- The "My Words" section with search, sort by tricky, and conjugation drilldown is a genuine differentiator.
- **Visual design** -- The dark mode, animations, and overall polish are high quality.
- **Audio system** -- Auto-play, speed control, and slow replay are well-implemented.
- **Placement test** -- The adaptive placement test with strict scoring is well-designed.
- **Undo system** -- The ability to go back and re-grade a card (up to 20 undo steps) is thoughtful.

### What LangLab must fix

- No onboarding or tutorial
- No push notifications or reminders
- No data persistence beyond localStorage
- Grading system too complex for casual users
- No session length cap for reviews
- Silent achievement unlocks
- No exercise variety (only read + self-grade + occasional word tiles)
- No graceful handling of failure/struggle
- Streak freeze system is invisible
- "All Caught Up" state is a dead end

---

*Report generated from static code analysis of: App.tsx, StudySession.tsx, GamificationHub.tsx, TopicMap.tsx, PlacementTest.tsx, ChallengeScreen.tsx, SessionMenu.tsx, VocabList.tsx, and supporting services.*
