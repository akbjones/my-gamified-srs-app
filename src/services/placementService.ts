import { QuestCard, MasteryMap, UserStats, Language } from '../types';
import { MAIN_PATH } from '../data/topicConfig';
import { saveMasteryMap, setPlacementComplete, setPlacementTaken } from './storageService';

/**
 * Pick CARDS_PER_NODE representative cards per node. The test does NOT ask all
 * of them — an adaptive search probes a handful of nodes — but every node needs
 * its candidates ready because the search can jump anywhere.
 *
 * Sampling is stratified-random: the node's cards are split into
 * CARDS_PER_NODE equal buckets and one card is drawn at random from each.
 * This keeps the early/late spread within a node while making every run
 * (and every retake) see different sentences — the old picker was fully
 * deterministic (identical cards every run, memorizable retakes) and
 * preferred grammar-annotated cards, a small unrepresentative slice in
 * some decks.
 */
const CARDS_PER_NODE = 3;

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

/**
 * Node indices the test can actually probe.
 *
 * Several shipped decks have nodes with no cards for a given goal filter
 * (japanese/general 18-34, greek+korean general 34-35, indonesian/travel 4 and
 * 6, …). The old linear scan almost never reached them; an adaptive search
 * probes the middle of the range FIRST, so an empty node would render a card
 * that doesn't exist – a blank screen with no way out. A node also needs at
 * least 2 cards to be judged fairly, since a single card caps the score too low
 * to ever pass cleanly.
 */
export function probeableNodeIndices(cardsByNode: QuestCard[][]): number[] {
  const out: number[] = [];
  for (let i = 0; i < cardsByNode.length; i++) {
    if ((cardsByNode[i]?.length ?? 0) >= 2) out.push(i);
  }
  return out;
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
 * How soon a card comes back depends on how confidently its node was passed:
 * 'strong' gets the full stagger, 'normal' 70% of it, 'wobble' 40%, on top of
 * a 7/4/2-day floor. FSRS's legacy migration turns interval into initial
 * stability, so a scraped-past B1 card genuinely returns sooner than one known
 * cold — the graded ratings DO something mechanical.
 *
 * The stagger width itself scales with how many cards are being seeded and the
 * user's daily appetite, so placing someone at 2,000 cards spreads their return
 * over months rather than dumping 300 reviews on day four.
 */
export function applyPlacementResults(
  results: PlacementResults,
  deck: QuestCard[],
  masteryMap: MasteryMap,
  userStats: UserStats,
  lang: Language,
  /** The user's own new-cards-per-day setting, used to size the due-date
   *  stagger so a big fast-track doesn't land as one huge review day. */
  dailyNewLimit = 20
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

  // How many cards this is about to seed, so the stagger can be sized to it.
  const toSeed = deck.filter(c => strengthByNodeId.has(c.topic) && c.mastery !== 2).length;

  // Spread the due dates over enough days that the daily review load stays
  // near the user's own daily appetite. The old fixed 3-6 day stagger was fine
  // for the ~500 cards the linear test could fast-track, but the adaptive
  // search can place someone at 2,000+ — which over 6 days is 300+ reviews a
  // day against an uncapped pile. Sizing it here is what keeps a more generous
  // placement from turning into a worse complaint than the one it fixes.
  const spreadDays = Math.max(6, Math.min(90, Math.ceil(toSeed / Math.max(1, dailyNewLimit * 2))));

  // A card due N days out must carry roughly N days of stability, or FSRS's
  // legacy migration reads a 4-day memory for a 45-day gap and the card comes
  // back "overdue" the moment it surfaces.
  const SEED: Record<NodeStrength, { minDays: number; spreadFactor: number }> = {
    strong: { minDays: 7, spreadFactor: 1.0 },
    normal: { minDays: 4, spreadFactor: 0.7 },
    wobble: { minDays: 2, spreadFactor: 0.4 },
  };

  const newMap = { ...masteryMap };
  let fastTrackedCount = 0;

  for (const card of deck) {
    const strength = strengthByNodeId.get(card.topic);
    if (!strength) continue;
    if (card.mastery === 2) continue; // already graduated

    const s = SEED[strength];
    // Stagger due dates to prevent a review avalanche
    const spread = Math.max(1, Math.round(spreadDays * s.spreadFactor));
    const staggerDays = Math.floor(Math.random() * spread);
    const dueInDays = s.minDays + staggerDays;
    newMap[card.id] = {
      // Spread the existing entry so a card that HAS been genuinely reviewed
      // keeps anything not explicitly overwritten below.
      ...masteryMap[card.id],
      mastery: 2,
      step: 0,
      interval: dueInDays * DAY,
      dueDate: now + dueInDays * DAY,
      ease: 2.5,
      failCount: 0,
      isLeech: false,
      isSuspended: false,
      // Placement is a fresh assertion about this card, so any FSRS memory from
      // a half-finished learning run must be cleared — otherwise the card keeps
      // fsrsState: Learning while claiming mastery 2, and toFsrsCard's restore
      // branch runs on inconsistent state. These are explicit undefineds, which
      // is why the deck merge tests key PRESENCE rather than using `??`.
      stability: undefined,
      difficulty: undefined,
      fsrsState: undefined,
      reps: undefined,
      lapses: undefined,
      learningStep: undefined,
      // Stamp the seed so cross-device merge treats it as recent news instead
      // of always losing to whatever the other device has.
      lastReview: now,
    };
    fastTrackedCount++;
  }

  // Persist mastery changes (no XP awarded for placement)
  saveMasteryMap(newMap, lang);
  setPlacementComplete(lang);
  setPlacementTaken(lang); // distinguishes "took the test" from "declined" (Settings label)

  return { newMasteryMap: newMap, newUserStats: userStats, fastTrackedCount };
}
