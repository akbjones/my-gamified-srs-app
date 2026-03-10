import { QuestCard, ChallengeQuestion, BossRing, ProgressState, ChallengeMode } from '../types';

// ── Tile Word Normalization ─────────────────────────────────
// Strip leading ¿/¡ and trailing punctuation, then lowercase.
// Keeps accents (cómo ≠ como). Removes clues (capital = first word, period = last).
function normalizeTileWord(word: string): string {
  return word
    .replace(/^[¿¡«"]+/, '')
    .replace(/[.!?,;:…»"]+$/, '')
    .toLowerCase();
}

// ── Word Scrambling ─────────────────────────────────────────
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function scrambleWords(sentence: string): { correct: string[]; scrambled: string[] } {
  // Normalize: strip punctuation + lowercase so tiles don't give away order
  const correct = sentence.split(/\s+/).map(normalizeTileWord);
  let scrambled = fisherYatesShuffle(correct);
  // Ensure scrambled differs from correct (reshuffle up to 5 times)
  let attempts = 0;
  while (scrambled.join(' ') === correct.join(' ') && attempts < 5) {
    scrambled = fisherYatesShuffle(correct);
    attempts++;
  }
  return { correct, scrambled };
}

// ── Dud Tile Generation ─────────────────────────────────────
// Pull plausible-but-wrong words from sibling cards (same grammar node).
// Filters out words already in the sentence and very short filler words.
function generateDuds(correctWords: string[], siblingCards: QuestCard[], count: number): string[] {
  const correctSet = new Set(correctWords);
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const card of siblingCards) {
    for (const raw of card.target.split(/\s+/)) {
      const w = normalizeTileWord(raw);
      if (w.length < 3) continue;          // skip "y", "a", "de", etc. — too obvious
      if (correctSet.has(w)) continue;      // already in the sentence
      if (seen.has(w)) continue;            // dedupe
      seen.add(w);
      candidates.push(w);
    }
  }

  return fisherYatesShuffle(candidates).slice(0, count);
}

// Scale dud count with sentence length so longer sentences stay challenging.
//   5-6 words → 2 duds (29-33% distractors)
//   7-9 words → 3 duds (25-30% distractors)
//  10-12 words → 4 duds (25-29% distractors)
function dudCountForLength(wordCount: number): number {
  if (wordCount >= 10) return 4;
  if (wordCount >= 7) return 3;
  return 2;
}

// Build the full tile set: normalized correct words + duds, all shuffled together.
// siblingCards should be other cards from the same grammar node.
export function buildTiles(
  sentence: string,
  siblingCards: QuestCard[],
  dudCountOverride?: number,
): { correct: string[]; tiles: string[] } {
  const correct = sentence.split(/\s+/).map(normalizeTileWord);
  const duds = generateDuds(correct, siblingCards, dudCountOverride ?? dudCountForLength(correct.length));
  const tiles = fisherYatesShuffle([...correct, ...duds]);
  return { correct, tiles };
}

// ── Tile Card Selection ─────────────────────────────────────
export function selectTileCandidates(queue: QuestCard[]): number[] {
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  const candidates = queue
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => {
      const wordCount = card.target.split(/\s+/).length;
      return (
        card.mastery >= 1 &&
        (card.interval || 0) > threeDaysMs &&
        wordCount >= 5 &&
        wordCount <= 12
      );
    });

  if (candidates.length === 0) return [];

  const tileCount = Math.min(4, candidates.length);
  const step = candidates.length / tileCount;
  return Array.from({ length: tileCount }, (_, i) =>
    candidates[Math.floor(i * step)].idx
  );
}

// ── Challenge Question Building ─────────────────────────────
export function buildChallengeQuestions(cards: QuestCard[], count: number): ChallengeQuestion[] {
  // Filter eligible cards (5-12 words)
  const eligible = cards.filter(c => {
    const wc = c.target.split(/\s+/).length;
    return wc >= 5 && wc <= 12;
  });

  const shuffled = fisherYatesShuffle(eligible);
  const selected = shuffled.slice(0, count);

  return selected.map(card => {
    const { correct, scrambled } = scrambleWords(card.target);
    return { card, correctWords: correct, scrambledWords: scrambled };
  });
}

// ── Answer Checking ─────────────────────────────────────────
// Spanish has flexible word order, so we give detailed feedback:
//   'exact'     — perfect match (original order)
//   'close'     — right words, 1-2 in wrong position (still counts as correct)
//   'wrong'     — picked a dud word
export interface TileCheckResult {
  verdict: 'exact' | 'close' | 'wrong';
  misplacedWords?: string[];   // words in wrong position (for 'close')
}
export type TileResult = TileCheckResult['verdict'];

export function checkTileAnswer(placed: string[], correct: string[]): TileCheckResult {
  if (placed.length !== correct.length) return { verdict: 'wrong' };
  if (placed.every((word, i) => word === correct[i])) return { verdict: 'exact' };

  // Check if all correct words are present (no duds picked)
  const placedSorted = [...placed].sort();
  const correctSorted = [...correct].sort();
  if (!placedSorted.every((w, i) => w === correctSorted[i])) return { verdict: 'wrong' };

  // All right words, just in different order — find which are misplaced
  const misplaced: string[] = [];
  for (let i = 0; i < placed.length; i++) {
    if (placed[i] !== correct[i]) misplaced.push(placed[i]);
  }
  return { verdict: 'close', misplacedWords: misplaced };
}

// ── Boss Ring Calculation ───────────────────────────────────
const GOLD_TIME_LIMIT_MS = 90_000; // 90 seconds

export function calculateBossRing(correctCount: number, total: number, elapsedMs: number): BossRing {
  if (correctCount < 6) return 'none';
  if (correctCount === total && elapsedMs < GOLD_TIME_LIMIT_MS) return 'gold';
  if (correctCount === total) return 'silver';
  return 'bronze';
}

// ── Challenge Triggers ──────────────────────────────────────
const CHECKPOINT_INTERVAL = 50;
const BOSS_INTERVAL = 150;

export function shouldTriggerChallenge(
  progress: ProgressState,
  newCumulativeTotal: number
): ChallengeMode | null {
  // Boss takes priority over checkpoint
  const bossTrigger = Math.floor(newCumulativeTotal / BOSS_INTERVAL);
  const lastBossTrigger = Math.floor(progress.cumulativeNewCards / BOSS_INTERVAL);
  if (bossTrigger > lastBossTrigger && progress.nextBossIndex < 22) {
    return 'boss';
  }

  // Checkpoint every 50 new cards (but not at boss boundaries)
  const cpTrigger = Math.floor(newCumulativeTotal / CHECKPOINT_INTERVAL);
  const lastCpTrigger = Math.floor(progress.cumulativeNewCards / CHECKPOINT_INTERVAL);
  if (cpTrigger > lastCpTrigger) {
    return 'checkpoint';
  }

  return null;
}

// ── Ring Utility ────────────────────────────────────────────
const RING_ORDER: BossRing[] = ['none', 'bronze', 'silver', 'gold'];

export function isRingBetter(a: BossRing, b: BossRing): boolean {
  return RING_ORDER.indexOf(a) > RING_ORDER.indexOf(b);
}
