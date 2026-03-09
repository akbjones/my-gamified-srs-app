import { QuestCard, MasteryMap, UserStats, Language } from '../types';
import { MAIN_PATH } from '../data/topicConfig';
import { saveMasteryMap, saveUserStats, setPlacementComplete } from './storageService';
import { awardBulkXP, checkAchievements } from './gamificationService';

/**
 * Pick 3 representative cards per node for the placement test.
 * Prefers cards with grammar field populated (better for the reveal phase).
 * Uses evenly-spaced index picking for diversity within each node.
 */
export function selectPlacementCards(deck: QuestCard[]): QuestCard[][] {
  const result: QuestCard[][] = [];

  for (const node of MAIN_PATH) {
    const nodeCards = deck.filter(c => c.topic === node.id);

    const withGrammar = nodeCards.filter(c => c.grammar);
    const withoutGrammar = nodeCards.filter(c => !c.grammar);

    const pickSpread = (pool: QuestCard[], count: number): QuestCard[] => {
      if (pool.length === 0) return [];
      if (pool.length <= count) return [...pool];
      const step = pool.length / count;
      return Array.from({ length: count }, (_, i) =>
        pool[Math.floor(i * step)]
      );
    };

    const selected: QuestCard[] = [];
    if (withGrammar.length >= 3) {
      selected.push(...pickSpread(withGrammar, 3));
    } else {
      selected.push(...withGrammar);
      const remaining = 3 - selected.length;
      if (remaining > 0) {
        selected.push(...pickSpread(withoutGrammar, remaining));
      }
    }

    result.push(selected);
  }

  return result;
}

export type ConfidenceRating = 'know_it' | 'mostly' | 'no_idea';

export interface PlacementResults {
  /** Index into MAIN_PATH where user hit ceiling. null = passed everything. */
  ceilingNodeIndex: number | null;
}

/**
 * Apply placement results: graduate cards below ceiling, award XP, save everything.
 * Returns updated masteryMap and userStats.
 */
export function applyPlacementResults(
  results: PlacementResults,
  deck: QuestCard[],
  masteryMap: MasteryMap,
  userStats: UserStats,
  lang: Language
): { newMasteryMap: MasteryMap; newUserStats: UserStats } {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Fast-track everything BELOW the ceiling (not including ceiling itself)
  const fastTrackUpTo = results.ceilingNodeIndex !== null
    ? results.ceilingNodeIndex
    : MAIN_PATH.length;

  const nodesToFastTrack = new Set(
    MAIN_PATH.slice(0, fastTrackUpTo).map(n => n.id)
  );

  const newMap = { ...masteryMap };
  let fastTrackedCount = 0;

  for (const card of deck) {
    if (!nodesToFastTrack.has(card.topic)) continue;
    if (card.mastery === 2) continue; // already graduated

    // Stagger due dates across 4-10 days to prevent review avalanche
    const staggerDays = Math.floor(Math.random() * 7);
    newMap[card.id] = {
      mastery: 2,
      step: 0,
      interval: 4 * DAY,
      dueDate: now + (4 + staggerDays) * DAY,
      ease: 2.5,
      failCount: 0,
      isLeech: false,
      isSuspended: false,
    };
    fastTrackedCount++;
  }

  // Persist
  saveMasteryMap(newMap, lang);

  // Award XP
  const newStats = awardBulkXP(fastTrackedCount, userStats);
  saveUserStats(newStats, lang);

  // Mark placement done
  setPlacementComplete(lang);

  // Check achievements with new state
  checkAchievements(newStats, newMap, deck, lang);

  return { newMasteryMap: newMap, newUserStats: newStats };
}
