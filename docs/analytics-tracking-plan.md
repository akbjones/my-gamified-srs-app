# LangLab Analytics Tracking Plan (PostHog)

All analytics flow through `src/services/analyticsService.ts` — no other module
may import `posthog-js`. Autocapture and session recording are **disabled**;
every event below is an explicit, typed capture.

## Configuration

| Variable | Meaning |
|---|---|
| `VITE_POSTHOG_KEY` | PostHog project API key. **Unset = analytics fully disabled** (every capture is a silent no-op). Never hard-coded, never committed — put real values in `.env.local` (gitignored). |
| `VITE_POSTHOG_HOST` | Optional PostHog host. Defaults to `https://us.i.posthog.com`. |

Runtime controls:

- **Opt-out:** `setAnalyticsOptOut(true)` persists `quest_analytics_opt_out = "true"`
  in localStorage and calls `posthog.opt_out_capturing()`. Checked before **every**
  capture. Default is opted-in. (No settings UI yet — the function is exported and
  ready to wire to a toggle.)
- **Fail-silent:** every PostHog call is wrapped in try/catch; init failures,
  network errors, and ad-blocker interference never affect the app.

## Global privacy rules

**Never sent, under any circumstances:** raw sentence/card text, user notes,
dictionary search text or tapped words, flagged-word content, email addresses,
names, or any personal data. Allowed property values are limited to: language
names, deck ids (`language-goal` slugs), grammar-node/goal slugs, counts,
durations, booleans, and the PostHog anonymous `distinct_id`.

`deck_id` is always the slug `<language>-<goal>`, e.g. `spanish-travel`.

---

## Event catalogue

### `app_opened` — wired (App mount, `src/App.tsx`)
Fired once per page load.

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `app_version` | string | `"1.0.0"` | Build metadata only; no user data. |

### `language_selected` — wired (first-launch picker + header dropdown, `src/App.tsx` `handleLanguageChange`)

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"spanish"` | One of 14 fixed language names; reveals nothing personal. |

### `deck_selected` — wired (goal/topic dropdown, `src/App.tsx` `handleGoalChange`)
The goal dropdown (General/Travel/Work/Family) is the app's deck selection.

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"french"` | Fixed enum. |
| `topic` | string | `"travel"` | One of 4 fixed goal slugs; not free text. |
| `deck_id` | string | `"french-travel"` | Derived slug of the two enums above. |

### `first_review_started` — wired (inside `trackReviewSessionStarted`)
Fired at most once per device, on the first-ever study session. Devices with
pre-analytics review history (any stored `totalReviews > 0`) are flagged
silently and never emit this — their true first review predates instrumentation.
Guard flag: `quest_analytics_first_review_sent`.

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"korean"` | Fixed enum. |

### `review_session_started` — wired (`src/App.tsx` `handleStartSession`)

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"german"` | Fixed enum. |
| `deck_id` | string | `"german-general"` | Derived slug. |

### `review_session_completed` — wired (App effect fires when the study queue is exhausted; aborted sessions never emit it)
Only safe aggregates — never card text.

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"dutch"` | Fixed enum. |
| `deck_id` | string | `"dutch-general"` | Derived slug. |
| `session_length_seconds` | number | `412` | Duration only. |
| `cards_seen` | number | `23` | Count of graded answers (learning mini-loop repeats count once per grading). No card identity or content. |
| `cards_correct` | number | `19` | Grades other than "No idea". Count only. |
| `cards_wrong` | number | `4` | "No idea" grades. Count only. |
| `audio_play_count` | number | `7` | Count of explicit Listen/Slow taps in this session. |
| `dictionary_open_count` | number | `5` | Count of word popovers opened; the words are never sent. |
| `etymology_open_count` | number | `2` | Count of etymology overlays opened; content never sent. |
| `new_cards_seen` | number | `8` | Grades on cards that were new (mastery 0) when graded. |
| `review_cards_seen` | number | `15` | Grades on previously-learned cards. |

### `audio_played` — wired (`src/components/StudySession.tsx` Listen + Slow buttons)
Deliberately **not** wired to auto-play — it measures user intent, not the
autoplay setting. ListenMode's continuous auto-advance playback is also not
instrumented (it would emit one event per card and measure a timer, not intent).

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"hindi"` | Language only — **no sentence text, no audio filename**. |

### `dictionary_opened` — wired (`src/components/WordPopover.tsx` `handleWordClick`, fires only when a popover opens, not when it toggles closed)

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"turkish"` | Language only — **the tapped word is never sent** (word lookups can reveal what a user is reading/writing). |

### `etymology_opened` — wired (card-level chip in `StudySession.tsx` + "See etymology" button in `WordPopover.tsx`)

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"welsh"` | Language only — no word or etymology content. |

### `feedback_submitted` — wired ("Flag as wrong" in `WordPopover.tsx`)
The word-flag button is the app's existing feedback UI. The flagged word, its
translation, and the sentence stay in localStorage / the Netlify form — only
the fact that feedback happened is captured.

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"russian"` | Fixed enum. |
| `feedback_type` | string | `"word_flag"` | Fixed slug set by the call site — never free text. |

### `pricing_viewed` — exported, **no call site yet**
No pricing UI exists. `trackPricingViewed()` is exported from
`analyticsService.ts` with a comment; call it from the pricing screen when built.
No properties.

### `paid_deck_interest_clicked` — exported, **no call site yet**
`trackPaidDeckInterestClicked(language, topic)` is exported with a comment;
call it from the paid-deck CTA when built.

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `language` | string | `"spanish"` | Fixed enum. |
| `topic` | string | `"work"` | Fixed goal slug. |
| `deck_id` | string | `"spanish-work"` | Derived slug. |

### `existing_progress_snapshot` — wired (App mount, once per device)
See Part B below.

| Property | Type | Example | Privacy rationale |
|---|---|---|---|
| `anonymous_user_id` | string | `"0196b1c2-…"` | PostHog's own random `distinct_id`; no account identity exists in the app. |
| `app_version` | string | `"1.0.0"` | Build metadata. |
| `languages` | string[] | `["spanish","hindi"]` | Languages with any stored progress; fixed enum values. |
| `decks_started` | number | `2` | Count of languages with progress (see caveat below). |
| `current_deck_id` | string | `"spanish-general"` | Selected language + its saved goal. |
| `current_position` | number | `340` | Count of cards with any SRS progress in the selected language. Card *ids* are not sent, let alone card text. |
| `total_reviews` | number | `5210` | Sum of `totalReviews` across languages. |
| `total_sentences_seen` | number | `612` | Total SRS entries across languages (1 card = 1 sentence). Count only. |
| `last_reviewed_at` | string | `"2026-07-06"` | Day granularity only, derived from the stored `lastStudyDate`. Omitted if never studied. |

---

## Part B — retroactive snapshot: what past behavior can and cannot be recovered

The app has always stored progress locally (localStorage, keys
`quest_mastery_<lang>`, `quest_stats_<lang>`, `quest_progress_<lang>`,
`quest_settings`). The snapshot reads those real keys once and reports only
aggregates.

**Can be recovered from existing storage:**

- Which of the 14 languages have progress (`quest_mastery_*` entries or
  `totalReviews > 0`) → `languages`, `decks_started`
- How many cards carry SRS state per language → `total_sentences_seen`,
  `current_position`
- Lifetime review count per language (`UserStats.totalReviews`) → `total_reviews`
- Most recent study day (`UserStats.lastStudyDate`) → `last_reviewed_at`
- Currently selected language + goal (`quest_settings`) → `current_deck_id`

**Cannot be recovered (fields OMITTED per requirement — we do not invent values):**

- `decks_completed` — SRS progress is stored per *language*, not per
  language+goal deck, and completion would additionally require comparing
  against each deck's card count. Not derivable from storage alone.
  (`decks_started` is therefore also per-language, not per-goal.)
- `total_audio_plays` — audio playback was never counted historically.
- `total_dictionary_lookups` — dictionary opens were never counted; the vocab
  map counts words encountered on reviewed cards, which is not lookups.
- `first_seen_at` — the install/first-open date was never stored
  (`quest_first_launch_done` is a boolean with no timestamp).
- Any per-card history: which sentences were failed, grades over time, session
  timestamps — none of that was ever stored, only current SRS state.

**Exactly-once mechanics:** sent-flag `quest_analytics_snapshot_sent` in
localStorage. The flag is written immediately *before* capture (so React
StrictMode's double-mounted dev effects can never send twice), and only when a
send is actually possible (key configured + not opted out) — so a device that
enables analytics later still gets its one snapshot on the next app open.

---

## Manual QA

Prereq: put a real key in `.env.local` (`VITE_POSTHOG_KEY=phc_…`), restart the
dev server, open the PostHog "Activity" live-events view. Without a key,
repeat the same steps and verify **no** `/i/v0/e/`… requests appear in the
Network tab and the app works identically (fail-silent check).

**New user (no prior progress):**
1. DevTools → Application → clear all localStorage for the site; reload.
2. Expect on load: `app_opened`, then `existing_progress_snapshot` with
   `languages: []`, `decks_started: 0`, `total_reviews: 0`, and **no**
   `last_reviewed_at`. Reload again → snapshot must NOT repeat
   (`quest_analytics_snapshot_sent` is set).
3. Pick a language in the first-launch picker → `language_selected`.
4. Tap Study, skip placement → `first_review_started` then
   `review_session_started` (`deck_id` like `spanish-general`).
5. During the session: tap Listen and Slow → `audio_played` (language only);
   flip a card and tap an underlined word → `dictionary_opened`; open an
   Etymology chip/button → `etymology_opened`. Verify **no event property
   contains sentence or word text**.
6. Finish every card → `review_session_completed` once, with plausible
   aggregates (counts you performed in step 5, `session_length_seconds` > 0).
7. Exit a fresh session midway → no `review_session_completed`.
8. Change the goal dropdown → `deck_selected`. In a popover, tap
   "Flag as wrong" → `feedback_submitted` with `feedback_type: "word_flag"`
   and no word text.

**Returning user (existing progress):**
1. With real study history present (or after doing sessions above), remove only
   the analytics flags:
   `localStorage.removeItem('quest_analytics_snapshot_sent');`
   `localStorage.removeItem('quest_analytics_first_review_sent');` then reload.
2. Expect `existing_progress_snapshot` with the studied languages, non-zero
   `total_reviews` / `total_sentences_seen`, and a `last_reviewed_at` date.
3. Start a session → `review_session_started` **without** a
   `first_review_started` (prior reviews exist, so the flag is set silently).
4. Reload once more → no second snapshot.

**Opt-out:**
1. Console: `localStorage.setItem('quest_analytics_opt_out', 'true')`; reload.
2. Use the app normally → zero events in PostHog / Network tab.
3. `localStorage.removeItem('quest_analytics_opt_out')`; reload → events resume.
