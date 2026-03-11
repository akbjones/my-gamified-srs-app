import { QuestCard, SessionState, MasteryMap, Language } from '../types';
import { saveMasteryMap } from './storageService';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const MAX_INTERVAL = 365 * DAY; // Cap at 1 year
const RETENTION_THRESHOLD = 21 * DAY; // 21 days = "retained"
const LEECH_THRESHOLD = 5; // AGAIN count to flag as leech

/** Retention: % of cards with interval >= 21 days (truly known) */
export const getRetention = (cards: QuestCard[]): number => {
  if (cards.length === 0) return 0;
  const retained = cards.filter(c => (c.interval || 0) >= RETENTION_THRESHOLD).length;
  return Math.round((retained / cards.length) * 100);
};

export const saveCardProgress = (card: QuestCard, masteryMap: MasteryMap, lang: Language): MasteryMap => {
  const newMap = {
    ...masteryMap,
    [card.id]: {
      mastery: card.mastery,
      step: card.step,
      dueDate: card.dueDate,
      interval: card.interval,
      ease: card.ease,
      failCount: card.failCount,
      isLeech: card.isLeech,
      isSuspended: card.isSuspended,
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
      return Math.abs(Number(a.id) - Number(b.id)) <= 3;
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

export const handleAnswerLogic = (
  rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
  currentCard: QuestCard,
  session: SessionState,
  saveProgress: (card: QuestCard) => void
): AnswerResult => {
  const newQueue = [...session.queue];
  let { currentIndex, newCardsSeen } = session;
  const now = Date.now();
  const updatedCard = { ...currentCard };

  if (updatedCard.step === undefined) updatedCard.step = 0;
  if (updatedCard.interval == null) updatedCard.interval = 0;
  if (updatedCard.ease == null || updatedCard.ease === 0) updatedCard.ease = 2.5;

  const wasNew = updatedCard.mastery === 0;

  if (rating === 'AGAIN') {
    // Leech detection: increment fail count
    updatedCard.failCount = (updatedCard.failCount || 0) + 1;
    if (updatedCard.failCount >= LEECH_THRESHOLD) {
      updatedCard.isLeech = true;
    }

    if (wasNew) newCardsSeen = (newCardsSeen || 0) + 1;
    updatedCard.mastery = 1;
    updatedCard.step = 0;
    updatedCard.interval = 1 * MINUTE;
    updatedCard.dueDate = now + updatedCard.interval;
    newQueue.push(updatedCard);
    saveProgress(updatedCard);
    currentIndex++;
  } else if (rating === 'HARD') {
    if (updatedCard.mastery < 2) {
      if (wasNew) newCardsSeen = (newCardsSeen || 0) + 1;
      updatedCard.mastery = 1; // promote new → learning
      updatedCard.interval = 6 * MINUTE;
      updatedCard.dueDate = now + updatedCard.interval;
      newQueue.push(updatedCard);
    } else {
      updatedCard.interval = Math.min(MAX_INTERVAL, Math.max(1 * DAY, Math.round((updatedCard.interval || 0) * 1.2)));
      updatedCard.dueDate = now + updatedCard.interval;
      updatedCard.ease = Math.max(1.3, updatedCard.ease - 0.15);
    }
    saveProgress(updatedCard);
    currentIndex++;
  } else if (rating === 'GOOD') {
    if (updatedCard.mastery === 0) {
      updatedCard.mastery = 1;
      updatedCard.step = 1;
      updatedCard.interval = 10 * MINUTE;
      updatedCard.dueDate = now + updatedCard.interval;
      newQueue.push(updatedCard);
      newCardsSeen = (newCardsSeen || 0) + 1;
    } else if (updatedCard.mastery === 1) {
      if (updatedCard.step === 0) {
        updatedCard.step = 1;
        updatedCard.interval = 10 * MINUTE;
        updatedCard.dueDate = now + updatedCard.interval;
        newQueue.push(updatedCard);
      } else {
        // Graduate
        updatedCard.mastery = 2;
        updatedCard.step = 0;
        updatedCard.interval = 1 * DAY;
        updatedCard.dueDate = now + updatedCard.interval;
      }
    } else {
      // Review — cap at MAX_INTERVAL
      updatedCard.interval = Math.min(MAX_INTERVAL, Math.round((updatedCard.interval || 1 * DAY) * updatedCard.ease));
      updatedCard.dueDate = now + updatedCard.interval;
    }
    saveProgress(updatedCard);
    currentIndex++;
  } else if (rating === 'EASY') {
    if (wasNew) newCardsSeen = (newCardsSeen || 0) + 1;
    // For graduated cards: multiply interval by ease * 1.3 easy-bonus (don't regress to 4d)
    if (updatedCard.mastery === 2) {
      updatedCard.interval = Math.min(MAX_INTERVAL, Math.round((updatedCard.interval || 1 * DAY) * updatedCard.ease * 1.3));
    } else {
      updatedCard.interval = 4 * DAY;
    }
    updatedCard.mastery = 2;
    updatedCard.step = 0;
    updatedCard.dueDate = now + updatedCard.interval;
    updatedCard.ease = updatedCard.ease + 0.15;
    saveProgress(updatedCard);
    currentIndex++;
  }

  return {
    sessionUpdates: {
      queue: newQueue,
      currentIndex,
      isFlipped: false,
      newCardsSeen,
    },
    updatedCard,
  };
};
