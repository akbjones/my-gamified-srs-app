import { QuestCard, MasteryMap, UserStats, Language } from '../types';
import { MAIN_PATH } from '../data/topicConfig';
import { saveMasteryMap, setPlacementComplete, setPlacementTaken } from './storageService';

/**
 * Pick 2 representative cards per node for the placement test.
 * With 35 nodes this gives 70 cards total (manageable test length).
 *
 * Sampling is stratified-random: the node's cards are split into
 * CARDS_PER_NODE equal buckets and one card is drawn at random from each.
 * This keeps the early/late spread within a node while making every run
 * (and every retake) see different sentences — the old picker was fully
 * deterministic (identical cards every run, memorizable retakes) and
 * preferred grammar-annotated cards, a small unrepresentative slice in
 * some decks.
 */
const CARDS_PER_NODE = 2;

export function selectPlacementCards(deck: QuestCard[]): QuestCard[][] {
  const result: QuestCard[][] = [];

  for (const node of MAIN_PATH) {
    const nodeCards = deck.filter(c => c.topic === node.id);
    if (nodeCards.length <= CARDS_PER_NODE) {
      result.push([...nodeCards]);
      continue;
    }
    const step = nodeCards.length / CARDS_PER_NODE;
    const selected = Array.from({ length: CARDS_PER_NODE }, (_, i) => {
      const start = Math.floor(i * step);
      const end = Math.max(start + 1, Math.floor((i + 1) * step));
      return nodeCards[start + Math.floor(Math.random() * (end - start))];
    });
    result.push(selected);
  }

  return result;
}

/** Placement ratings mirror the study buttons — one rating vocabulary
 *  app-wide (StudySession: No idea / Hard / Knew it / Very easy). */
export type ConfidenceRating = 'no_idea' | 'hard' | 'knew_it' | 'very_easy';

/** Points per rating, used by the node pass/fail/wobble rules and by the
 *  FSRS seeding strength below. */
export const RATING_POINTS: Record<ConfidenceRating, number> = {
  no_idea: 0, hard: 1, knew_it: 2, very_easy: 3,
};

/** How confidently a passed node was passed — drives how soon its
 *  fast-tracked cards come back for review. */
export type NodeStrength = 'strong' | 'normal' | 'wobble';

export interface PlacementResults {
  /** Index into MAIN_PATH where user hit ceiling. null = passed everything. */
  ceilingNodeIndex: number | null;
  /** Per passed-node strength (index into MAIN_PATH). Nodes missing from the
   *  map (legacy callers) seed as 'normal'. */
  nodeStrengths?: Record<number, NodeStrength>;
}

/** Count how many cards WOULD be fast-tracked, without touching anything.
 *  Used by the results screen to make the payoff concrete BEFORE applying. */
export function countFastTrackable(results: PlacementResults, deck: QuestCard[]): number {
  const upTo = results.ceilingNodeIndex !== null ? results.ceilingNodeIndex : MAIN_PATH.length;
  const nodes = new Set(MAIN_PATH.slice(0, upTo).map(n => n.id));
  return deck.filter(c => nodes.has(c.topic) && c.mastery !== 2).length;
}

/**
 * Apply placement results: graduate cards below ceiling, save everything.
 * No XP awarded – placement just sets your starting point.
 *
 * The seed a card gets depends on how confidently its node was passed:
 *   strong (both cards easy/known cold) → 7-day interval, due 7–14 days out
 *   normal                              → 4-day interval, due 4–10 days out
 *   wobble (scraped past)               → 2-day interval, due 2–5 days out
 * FSRS's legacy migration turns interval into initial stability, so a
 * scraped-past B1 card genuinely comes back sooner than a cold-known one —
 * the graded ratings finally DO something mechanical.
 */
export function applyPlacementResults(
  results: PlacementResults,
  deck: QuestCard[],
  masteryMap: MasteryMap,
  userStats: UserStats,
  lang: Language
): { newMasteryMap: MasteryMap; newUserStats: UserStats; fastTrackedCount: number } {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Fast-track everything BELOW the ceiling (not including ceiling itself)
  const fastTrackUpTo = results.ceilingNodeIndex !== null
    ? results.ceilingNodeIndex
    : MAIN_PATH.length;

  const strengthByNodeId = new Map<string, NodeStrength>();
  MAIN_PATH.slice(0, fastTrackUpTo).forEach((n, i) => {
    strengthByNodeId.set(n.id, results.nodeStrengths?.[i] ?? 'normal');
  });

  const SEED: Record<NodeStrength, { interval: number; minDays: number; spreadDays: number }> = {
    strong: { interval: 7 * DAY, minDays: 7, spreadDays: 7 },
    normal: { interval: 4 * DAY, minDays: 4, spreadDays: 6 },
    wobble: { interval: 2 * DAY, minDays: 2, spreadDays: 3 },
  };

  const newMap = { ...masteryMap };
  let fastTrackedCount = 0;

  for (const card of deck) {
    const strength = strengthByNodeId.get(card.topic);
    if (!strength) continue;
    if (card.mastery === 2) continue; // already graduated

    const s = SEED[strength];
    // Stagger due dates to prevent a review avalanche
    const staggerDays = Math.floor(Math.random() * s.spreadDays);
    newMap[card.id] = {
      mastery: 2,
      step: 0,
      interval: s.interval,
      dueDate: now + (s.minDays + staggerDays) * DAY,
      ease: 2.5,
      failCount: 0,
      isLeech: false,
      isSuspended: false,
    };
    fastTrackedCount++;
  }

  // Persist mastery changes (no XP awarded for placement)
  saveMasteryMap(newMap, lang);
  setPlacementComplete(lang);
  setPlacementTaken(lang); // distinguishes "took the test" from "declined" (Settings label)

  return { newMasteryMap: newMap, newUserStats: userStats, fastTrackedCount };
}
