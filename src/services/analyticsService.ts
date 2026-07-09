/**
 * ─── Analytics wrapper (PostHog) ─────────────────────────────────────────────
 *
 * ALL analytics go through this file. No other module may import posthog-js
 * directly — that keeps the privacy rules enforceable in one place.
 *
 * PRIVACY RULES (non-negotiable — see docs/analytics-tracking-plan.md):
 *   - NEVER send raw sentence text, card content, user notes, dictionary
 *     search text / looked-up words, email addresses, or any personal data.
 *   - Only language names, deck ids (language+goal slugs), counts, durations
 *     and booleans are allowed as event properties.
 *   - Autocapture and session recording are DISABLED — every event below is
 *     an explicit, typed capture.
 *
 * CONFIGURATION (environment variables, never hard-coded):
 *   - VITE_POSTHOG_KEY   PostHog project API key. If unset, every function in
 *                        this file is a silent no-op — the app behaves
 *                        identically with analytics off.
 *   - VITE_POSTHOG_HOST  Optional PostHog host (defaults to PostHog US cloud).
 *   Put real values in `.env.local` (gitignored). See `.env.development.local`
 *   for guidance.
 *
 * HOW TO DISABLE ANALYTICS FOR LOCAL DEVELOPMENT (pick any):
 *   1. Simply don't set VITE_POSTHOG_KEY in your env — analytics no-ops.
 *      (This is the default for local dev; no key is committed anywhere.)
 *   2. In DevTools: localStorage.setItem('quest_analytics_opt_out', 'true')
 *   3. From code: setAnalyticsOptOut(true)
 *
 * FAILURE POLICY: every posthog call is wrapped in try/catch and errors are
 * swallowed. Network failures, blocked requests (ad blockers), and script
 * errors must never affect the app.
 */
import posthog from 'posthog-js';
import { Language, LANGUAGE_CONFIG } from '../types';
import {
  loadMasteryMap, loadUserStats, loadSettings, getGoalFor,
} from './storageService';

// ─── localStorage keys ───────────────────────────────────────────
const OPT_OUT_KEY = 'quest_analytics_opt_out';
const FIRST_REVIEW_SENT_KEY = 'quest_analytics_first_review_sent';
const SNAPSHOT_SENT_KEY = 'quest_analytics_snapshot_sent';

const ALL_LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];

/** A deck is a language + goal/topic combination, e.g. "spanish-travel". */
const deckId = (language: Language, topic: string): string => `${language}-${topic}`;

type Props = Record<string, string | number | boolean | string[]>;

// ─── Init (lazy) ─────────────────────────────────────────────────
let initialized = false;
let initFailed = false;

/** Initialise PostHog on first use. Returns false when analytics is
 *  unavailable (no key, or init threw) — callers then no-op silently. */
function ensureInit(): boolean {
  if (initialized) return true;
  if (initFailed) return false;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) {
    // No key configured → analytics permanently disabled for this page load.
    // This is the normal state for local development.
    initFailed = true;
    return false;
  }
  try {
    posthog.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      // Explicit custom events only — no DOM autocapture, no recordings.
      autocapture: false,
      disable_session_recording: true,
      capture_pageview: false,
      capture_pageleave: false,
      persistence: 'localStorage',
      // Honour a pre-existing opt-out from a previous visit at init time.
      opt_out_capturing_by_default: isAnalyticsOptedOut(),
    });
    initialized = true;
    return true;
  } catch {
    initFailed = true; // fail silently; never retry-loop
    return false;
  }
}

/** The single funnel every event goes through. Checks opt-out, lazily
 *  initialises, and swallows every error. */
function capture(event: string, props?: Props): void {
  try {
    if (isAnalyticsOptedOut()) return;
    if (!ensureInit()) return;
    posthog.capture(event, props);
  } catch {
    // Analytics must never break the app — swallow everything.
  }
}

// ─── Opt-out ─────────────────────────────────────────────────────
/** True when the user has opted out of analytics. Default: opted in. */
export function isAnalyticsOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Persisted analytics opt-out. Checked before every capture. There is no
 *  settings UI for this yet — when one is added, wire its toggle here. */
export function setAnalyticsOptOut(optOut: boolean): void {
  try {
    localStorage.setItem(OPT_OUT_KEY, String(optOut));
  } catch { /* storage unavailable — in-memory state below still applies */ }
  try {
    if (!ensureInit()) return;
    if (optOut) posthog.opt_out_capturing();
    else posthog.opt_in_capturing();
  } catch { /* swallow */ }
}

// ─── Lifecycle events ────────────────────────────────────────────
let appOpenedSent = false;

/** Fired once per page load on app mount. (Guarded so React StrictMode's
 *  double-invoked dev effects don't double-count.) */
export function trackAppOpened(): void {
  if (appOpenedSent) return;
  appOpenedSent = true;
  capture('app_opened', { app_version: __APP_VERSION__ });
}

/** User picked a language (first-launch picker or header dropdown). */
export function trackLanguageSelected(language: Language): void {
  capture('language_selected', { language });
}

/** User picked a deck via the goal/topic dropdown (general/travel/work/family). */
export function trackDeckSelected(language: Language, topic: string): void {
  capture('deck_selected', { language, topic, deck_id: deckId(language, topic) });
}

// ─── Review session lifecycle + aggregates ──────────────────────
// Aggregate counters for the in-flight study session. Only counts and
// timestamps live here — never card text.
interface SessionTracker {
  active: boolean;
  language: Language;
  deckIdValue: string;
  startedAt: number;
  cardsSeen: number;
  cardsCorrect: number;
  cardsWrong: number;
  audioPlayCount: number;
  dictionaryOpenCount: number;
  etymologyOpenCount: number;
  newCardsSeen: number;
  reviewCardsSeen: number;
}

let tracker: SessionTracker | null = null;

/** first_review_started: the first-ever study session on this device.
 *  Devices that already have review history from before analytics existed
 *  are marked silently (their "first" happened pre-instrumentation). */
function maybeTrackFirstReviewStarted(language: Language): void {
  try {
    if (localStorage.getItem(FIRST_REVIEW_SENT_KEY)) return;
    localStorage.setItem(FIRST_REVIEW_SENT_KEY, '1');
    const hasPriorReviews = ALL_LANGUAGES.some(l => loadUserStats(l).totalReviews > 0);
    if (hasPriorReviews) return; // not genuinely their first review
    capture('first_review_started', { language });
  } catch { /* swallow */ }
}

/** Study session started. Resets the per-session aggregate counters. */
export function trackReviewSessionStarted(language: Language, topic: string): void {
  maybeTrackFirstReviewStarted(language);
  tracker = {
    active: true,
    language,
    deckIdValue: deckId(language, topic),
    startedAt: Date.now(),
    cardsSeen: 0,
    cardsCorrect: 0,
    cardsWrong: 0,
    audioPlayCount: 0,
    dictionaryOpenCount: 0,
    etymologyOpenCount: 0,
    newCardsSeen: 0,
    reviewCardsSeen: 0,
  };
  capture('review_session_started', { language, deck_id: tracker.deckIdValue });
}

/** Record one graded answer into the session aggregates. NOT an event —
 *  it only feeds review_session_completed. Counts each grading action, so
 *  cards re-shown by the learning mini-loop count once per grading. */
export function recordSessionAnswer(wasNewCard: boolean, correct: boolean): void {
  if (!tracker?.active) return;
  tracker.cardsSeen += 1;
  if (correct) tracker.cardsCorrect += 1;
  else tracker.cardsWrong += 1;
  if (wasNewCard) tracker.newCardsSeen += 1;
  else tracker.reviewCardsSeen += 1;
}

/** Study session finished (queue exhausted). Emits ONLY safe aggregates —
 *  no card text ever. Idempotent: safe to call more than once per session. */
export function trackReviewSessionCompleted(): void {
  if (!tracker?.active) return;
  tracker.active = false;
  capture('review_session_completed', {
    language: tracker.language,
    deck_id: tracker.deckIdValue,
    session_length_seconds: Math.max(0, Math.round((Date.now() - tracker.startedAt) / 1000)),
    cards_seen: tracker.cardsSeen,
    cards_correct: tracker.cardsCorrect,
    cards_wrong: tracker.cardsWrong,
    audio_play_count: tracker.audioPlayCount,
    dictionary_open_count: tracker.dictionaryOpenCount,
    etymology_open_count: tracker.etymologyOpenCount,
    new_cards_seen: tracker.newCardsSeen,
    review_cards_seen: tracker.reviewCardsSeen,
  });
}

// ─── Feature usage events (language only — NEVER the text/word) ─
/** User explicitly played card audio (Listen / Slow buttons).
 *  Deliberately NOT wired to autoplay — we measure intent, not settings. */
export function trackAudioPlayed(language: Language): void {
  if (tracker?.active) tracker.audioPlayCount += 1;
  capture('audio_played', { language });
}

/** User opened a word-definition popover. The word itself is never sent. */
export function trackDictionaryOpened(language: Language): void {
  if (tracker?.active) tracker.dictionaryOpenCount += 1;
  capture('dictionary_opened', { language });
}

/** User opened an etymology overlay (card chip or popover button).
 *  The word/etymology content is never sent. */
export function trackEtymologyOpened(language: Language): void {
  if (tracker?.active) tracker.etymologyOpenCount += 1;
  capture('etymology_opened', { language });
}

/** User submitted feedback. Currently wired to the "Flag as wrong" button in
 *  the word popover (feedback_type: 'word_flag'). The flagged word and its
 *  translation are NOT sent — they stay in localStorage / the Netlify form. */
export function trackFeedbackSubmitted(language: Language, feedbackType: string): void {
  capture('feedback_submitted', { language, feedback_type: feedbackType });
}

// ─── Monetisation events (NO CALL SITE YET) ─────────────────────
/** No pricing UI exists yet — call this from the pricing screen when built. */
export function trackPricingViewed(): void {
  capture('pricing_viewed', {});
}

/** No pricing UI exists yet — call this from the "I'm interested" CTA on a
 *  paid deck when that UI is built. `topic` is the goal slug, never content. */
export function trackPaidDeckInterestClicked(language: Language, topic: string): void {
  capture('paid_deck_interest_clicked', { language, topic, deck_id: deckId(language, topic) });
}

// ─── PART B: one-time retroactive progress snapshot ─────────────
/**
 * Sends exactly ONE `existing_progress_snapshot` event per device, on the
 * first app open where analytics is actually available. Reads the real
 * storage keys (via storageService) and reports ONLY aggregates.
 *
 * Fields are OMITTED when the storage genuinely doesn't record them:
 *   - decks_completed          not derivable from storage alone (needs deck
 *                              sizes per goal; progress isn't stored per goal)
 *   - total_audio_plays        never counted historically
 *   - total_dictionary_lookups never counted historically
 *   - first_seen_at            install date was never stored
 *
 * The sent-flag is only written when a capture is actually possible (key
 * present + not opted out), so devices that enable analytics later still
 * get their one snapshot.
 */
export function maybeSendExistingProgressSnapshot(): void {
  try {
    if (localStorage.getItem(SNAPSHOT_SENT_KEY)) return;
    if (isAnalyticsOptedOut()) return;
    if (!ensureInit()) return;

    // Set the flag BEFORE capturing so a re-entrant call (React StrictMode
    // double-effects) can never send twice. Worst case on a capture error is
    // a lost snapshot, never a duplicate.
    localStorage.setItem(SNAPSHOT_SENT_KEY, '1');

    // Languages with any stored progress (SRS entries or recorded reviews).
    const languages = ALL_LANGUAGES.filter(l =>
      Object.keys(loadMasteryMap(l)).length > 0 || loadUserStats(l).totalReviews > 0,
    );

    let totalReviews = 0;
    let totalSentencesSeen = 0;
    let lastReviewedMs = 0;
    for (const l of languages) {
      const stats = loadUserStats(l);
      totalReviews += stats.totalReviews;
      totalSentencesSeen += Object.keys(loadMasteryMap(l)).length;
      if (stats.lastStudyDate) {
        const t = Date.parse(stats.lastStudyDate); // stored as toDateString()
        if (!Number.isNaN(t)) lastReviewedMs = Math.max(lastReviewedMs, t);
      }
    }

    const settings = loadSettings();
    const currentLang = settings.selectedLanguage;
    const currentGoal = getGoalFor(settings, currentLang);

    const props: Props = {
      anonymous_user_id: posthog.get_distinct_id(),
      app_version: __APP_VERSION__,
      languages,
      // Progress is stored per language (not per goal), so a "started deck"
      // here means a language with any progress.
      decks_started: languages.length,
      current_deck_id: deckId(currentLang, currentGoal),
      // Position in the current deck = cards with any SRS progress in the
      // currently selected language.
      current_position: Object.keys(loadMasteryMap(currentLang)).length,
      total_reviews: totalReviews,
      total_sentences_seen: totalSentencesSeen,
    };
    if (lastReviewedMs > 0) {
      props.last_reviewed_at = new Date(lastReviewedMs).toISOString().slice(0, 10);
    }

    capture('existing_progress_snapshot', props);
  } catch {
    // Snapshot must never break app startup.
  }
}
