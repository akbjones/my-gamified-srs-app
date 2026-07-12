import { QuestCard, SessionState, MasteryMap, Language } from '../types';
import { saveMasteryMap } from './storageService';
import { fsrs, generatorParameters, createEmptyCard, Rating, State, type Card as FsrsCard, type Grade } from 'ts-fsrs';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const MAX_INTERVAL = 365 * DAY; // Cap at 1 year
const RETENTION_THRESHOLD = 21 * DAY; // 21 days = "retained"
const LEECH_THRESHOLD = 5; // AGAIN count to flag as leech

// ── FSRS scheduler ───────────────────────────────────────────
// Modern spaced repetition (Anki's current default). Models each card's memory
// as stability + difficulty and schedules the next review for when predicted
// recall drops to `request_retention`. Replaces the old SM-2 ease math; the
// existing 4-button UI (Again/Hard/Good/Easy) maps straight onto FSRS ratings.
const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true }));

const RATING_MAP: Record<'AGAIN' | 'HARD' | 'GOOD' | 'EASY', Grade> = {
  AGAIN: Rating.Again, HARD: Rating.Hard, GOOD: Rating.Good, EASY: Rating.Easy,
};

// Seed FSRS difficulty from a legacy SM-2 ease (2.5 → mid 5; lower ease = harder).
function easeToDifficulty(ease: number | undefined): number {
  return Math.min(10, Math.max(1, 5 + (2.5 - (ease ?? 2.5)) * 4));
}

// Reconstruct the FSRS memory card from stored state. Migrates legacy SM-2 users
// so their existing interval is preserved (no schedule jump on first FSRS review).
function toFsrsCard(card: QuestCard, now: Date): FsrsCard {
  const base = createEmptyCard(now); // supplies all required fields (incl. learning_steps)
  // Already on FSRS — restore the saved memory state.
  if (card.stability != null && card.difficulty != null && card.fsrsState != null) {
    return {
      ...base,
      due: new Date(card.dueDate ?? now.getTime()),
      stability: card.stability,
      difficulty: card.difficulty,
      scheduled_days: Math.max(0, Math.round((card.interval ?? 0) / DAY)),
      reps: card.reps ?? 0,
      lapses: card.lapses ?? card.failCount ?? 0,
      state: card.fsrsState as State,
      last_review: card.lastReview ? new Date(card.lastReview) : base.last_review,
    };
  }
  // Migrate a graduated SM-2 card: its current interval ≈ memory stability.
  if ((card.mastery ?? 0) === 2 && (card.interval ?? 0) >= DAY) {
    const days = Math.max(1, Math.round((card.interval as number) / DAY));
    return {
      ...base,
      due: new Date(card.dueDate ?? now.getTime()),
      stability: days,
      difficulty: easeToDifficulty(card.ease),
      elapsed_days: days,
      scheduled_days: days,
      reps: Math.max(1, card.reps ?? 1),
      lapses: card.failCount ?? 0,
      state: State.Review,
      last_review: new Date(now.getTime() - days * DAY),
    };
  }
  // New / early-learning card → a fresh FSRS card.
  return base;
}

/** Retention: % of cards with interval >= 21 days (truly known) */
export const getRetention = (cards: QuestCard[]): number => {
  if (cards.length === 0) return 0;
  const retained = cards.filter(c => (c.interval || 0) >= RETENTION_THRESHOLD).length;
  return Math.round((retained / cards.length) * 100);
};

/** Save a card's progress to localStorage.
 *
 * IMPORTANT: This function reads the latest map from localStorage right
 * before writing, instead of trusting an in-memory `masteryMap` argument
 * captured in a React closure. Without this, two rapid submitAnswer calls
 * (the user rating two cards before React re-renders) would both base their
 * writes on the same stale closure map, and the second write would silently
 * erase the first. localStorage is synchronous and single-threaded, so a
 * load-modify-save cycle here is race-free.
 */
import { loadMasteryMap } from './storageService';

export const saveCardProgress = (card: QuestCard, lang: Language): MasteryMap => {
  const existing = loadMasteryMap(lang);
  const newMap = {
    ...existing,
    [card.id]: {
      mastery: card.mastery,
      step: card.step,
      dueDate: card.dueDate,
      interval: card.interval,
      ease: card.ease,
      failCount: card.failCount,
      isLeech: card.isLeech,
      isSuspended: card.isSuspended,
      // FSRS memory state — the real scheduling source of truth.
      stability: card.stability,
      difficulty: card.difficulty,
      fsrsState: card.fsrsState,
      reps: card.reps,
      lapses: card.lapses,
      lastReview: card.lastReview,
    },
  };
  saveMasteryMap(newMap, lang);
  return newMap;
};

/**
 * Sibling burying: reorder queue so cards with IDs within ±3 of each other
 * are spaced at least 2 cards apart. Prevents related vocab appearing back-to-back.
 */
export const burySiblings = (queue: QuestCard[]): QuestCard[] => {
  if (queue.length <= 2) return queue;

  const result: QuestCard[] = [];
  const pending = [...queue];

  while (pending.length > 0) {
    const candidate = pending.shift()!;
    const last1 = result[result.length - 1];
    const last2 = result[result.length - 2];

    const isSiblingOf = (a: QuestCard, b: QuestCard | undefined) => {
      if (!b) return false;
      // Extract numeric part from IDs like "hi-0001", "es-0123", or plain "123"
      const numA = parseInt(a.id.replace(/[^0-9]/g, ''), 10);
      const numB = parseInt(b.id.replace(/[^0-9]/g, ''), 10);
      if (isNaN(numA) || isNaN(numB)) return false;
      return Math.abs(numA - numB) <= 3;
    };

    if (isSiblingOf(candidate, last1) || isSiblingOf(candidate, last2)) {
      // Find a non-sibling to swap in
      const swapIndex = pending.findIndex(
        c => !isSiblingOf(c, last1) && !isSiblingOf(c, last2)
      );
      if (swapIndex >= 0) {
        result.push(pending.splice(swapIndex, 1)[0]);
        pending.unshift(candidate); // try candidate again later
      } else {
        result.push(candidate); // no better option, add anyway
      }
    } else {
      result.push(candidate);
    }
  }

  return result;
};

/**
 * ANKI-STYLE SRS
 * Mastery 0: New
 * Mastery 1: Learning (Step 0: 1m, Step 1: 10m)
 * Mastery 2: Graduated (Review)
 */
export interface AnswerResult {
  sessionUpdates: Partial<SessionState>;
  updatedCard: QuestCard;
}

// ── Mini-loop reinsertion: instead of pushing to end, insert nearby ──
const REINSERT_OFFSETS = {
  AGAIN:         { min: 5, max: 8 },   // failed → see again soon
  LEARNING_HARD: { min: 6, max: 10 },  // struggled → repeat fairly soon
  LEARNING_GOOD: { min: 8, max: 12 },  // got it → reinforce a bit later
};

function getReinsertPosition(
  currentIndex: number,
  queueLength: number,
  range: { min: number; max: number }
): number {
  const offset = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
  const targetPos = currentIndex + 1 + offset;
  return Math.min(targetPos, queueLength); // clamp to end if queue is short
}

function reinsertCard(queue: QuestCard[], currentIndex: number, card: QuestCard, range: { min: number; max: number }) {
  const pos = getReinsertPosition(currentIndex, queue.length, range);
  queue.splice(pos, 0, card);
}

/** Interleave new cards among reviews (1 new every N reviews) */
export function interleaveQueue(reviews: QuestCard[], newCards: QuestCard[]): QuestCard[] {
  if (newCards.length === 0) return [...reviews];
  if (reviews.length === 0) return [...newCards];

  const ratio = Math.max(3, Math.min(5, Math.floor(reviews.length / newCards.length)));
  const result: QuestCard[] = [];
  let newIdx = 0;

  for (let i = 0; i < reviews.length; i++) {
    result.push(reviews[i]);
    if ((i + 1) % ratio === 0 && newIdx < newCards.length) {
      result.push(newCards[newIdx++]);
    }
  }
  // Append any remaining new cards
  while (newIdx < newCards.length) {
    result.push(newCards[newIdx++]);
  }
  return result;
}

export const handleAnswerLogic = (
  rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
  currentCard: QuestCard,
  session: SessionState,
  saveProgress: (card: QuestCard) => void
): AnswerResult => {
  const newQueue = [...session.queue];
  let { currentIndex, newCardsSeen } = session;
  const nowMs = Date.now();
  const now = new Date(nowMs);
  const updatedCard = { ...currentCard };
  const wasNew = (updatedCard.mastery ?? 0) === 0;

  // FSRS: compute the next memory state + due date for this rating.
  const { card: next } = scheduler.next(toFsrsCard(updatedCard, now), now, RATING_MAP[rating]);

  updatedCard.stability = next.stability;
  updatedCard.difficulty = next.difficulty;
  updatedCard.fsrsState = next.state;
  updatedCard.reps = next.reps;
  updatedCard.lapses = next.lapses;
  updatedCard.lastReview = nowMs;
  updatedCard.dueDate = next.due.getTime();
  updatedCard.interval = Math.min(MAX_INTERVAL, Math.max(0, next.due.getTime() - nowMs));
  // Keep the app-level fields the UI + queue read, derived from FSRS state.
  updatedCard.mastery = next.state === State.Review ? 2 : next.state === State.New ? 0 : 1;
  updatedCard.step = next.state === State.Review ? 0 : 1;
  updatedCard.failCount = next.lapses;
  if (next.lapses >= LEECH_THRESHOLD) updatedCard.isLeech = true;

  if (wasNew) newCardsSeen = (newCardsSeen || 0) + 1;

  // In-session re-show: a sub-day learning/relearning step gets drilled again
  // within this session (same feel as before, now driven by FSRS short steps).
  if (updatedCard.interval < DAY && next.state !== State.Review) {
    const offsets = rating === 'AGAIN' ? REINSERT_OFFSETS.AGAIN
      : rating === 'HARD' ? REINSERT_OFFSETS.LEARNING_HARD
        : REINSERT_OFFSETS.LEARNING_GOOD;
    reinsertCard(newQueue, currentIndex, updatedCard, offsets);
  }

  saveProgress(updatedCard);
  currentIndex++;

  return {
    sessionUpdates: {
      queue: newQueue,
      currentIndex,
      isFlipped: false,
      newCardsSeen,
      finishedCount: currentIndex,
    },
    updatedCard,
  };
};
