import { QuestCard, SessionState, MasteryMap } from '../types';
import { saveMasteryMap } from './storageService';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const RETENTION_THRESHOLD = 21 * DAY; // 21 days = "retained"

/** Retention: % of cards with interval >= 21 days (truly known) */
export const getRetention = (cards: QuestCard[]): number => {
  if (cards.length === 0) return 0;
  const retained = cards.filter(c => (c.interval || 0) >= RETENTION_THRESHOLD).length;
  return Math.round((retained / cards.length) * 100);
};

export const saveCardProgress = (card: QuestCard, masteryMap: MasteryMap): MasteryMap => {
  const newMap = {
    ...masteryMap,
    [card.id]: {
      mastery: card.mastery,
      step: card.step,
      dueDate: card.dueDate,
      interval: card.interval,
      ease: card.ease,
    },
  };
  saveMasteryMap(newMap);
  return newMap;
};

/**
 * ANKI-STYLE SRS
 * Mastery 0: New
 * Mastery 1: Learning (Step 0: 1m, Step 1: 10m)
 * Mastery 2: Graduated (Review)
 */
export const handleAnswerLogic = (
  rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
  currentCard: QuestCard,
  session: SessionState,
  saveProgress: (card: QuestCard) => void
): Partial<SessionState> => {
  const newQueue = [...session.queue];
  let { currentIndex, newCardsSeen } = session;
  const now = Date.now();
  const updatedCard = { ...currentCard };

  if (updatedCard.step === undefined) updatedCard.step = 0;
  if (!updatedCard.interval) updatedCard.interval = 0;
  if (!updatedCard.ease) updatedCard.ease = 2.5;

  if (rating === 'AGAIN') {
    updatedCard.mastery = 1;
    updatedCard.step = 0;
    updatedCard.interval = 1 * MINUTE;
    updatedCard.dueDate = now + updatedCard.interval;
    newQueue.push(updatedCard);
    saveProgress(updatedCard);
    currentIndex++;
  } else if (rating === 'HARD') {
    if (updatedCard.mastery < 2) {
      updatedCard.interval = 6 * MINUTE;
      updatedCard.dueDate = now + updatedCard.interval;
      newQueue.push(updatedCard);
    } else {
      updatedCard.interval = Math.max(1 * DAY, (updatedCard.interval || 0) * 1.2);
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
      // Review
      updatedCard.interval = (updatedCard.interval || 1 * DAY) * updatedCard.ease;
      updatedCard.dueDate = now + updatedCard.interval;
    }
    saveProgress(updatedCard);
    currentIndex++;
  } else if (rating === 'EASY') {
    if (updatedCard.mastery === 0) newCardsSeen = (newCardsSeen || 0) + 1;
    updatedCard.mastery = 2;
    updatedCard.step = 0;
    updatedCard.interval = 4 * DAY;
    updatedCard.dueDate = now + updatedCard.interval;
    updatedCard.ease = updatedCard.ease + 0.15;
    saveProgress(updatedCard);
    currentIndex++;
  }

  return {
    queue: newQueue,
    currentIndex,
    isFlipped: false,
    newCardsSeen,
  };
};
