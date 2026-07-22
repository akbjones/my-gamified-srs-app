import { QuestCard, ChallengeQuestion, BossRing, ProgressState, ChallengeMode } from '../types';
import { contentTokens } from './textService';

// ── Tile Word Normalization ─────────────────────────────────
// Strip leading ¿/¡ and trailing punctuation, then lowercase.
// Keeps accents (cómo ≠ como). Removes clues (capital = first word, period = last).
// Fullwidth punctuation (。、！？「」) included as defense-in-depth: ja
// punctuation is its own token by lint, but an author error must not
// leave a 。 glued to です.
function normalizeTileWord(word: string): string {
  return word
    .replace(/^[¿¡«"「『（]+/, '')
    .replace(/[.!?,;:…»"。、！？」』）]+$/, '')
    .toLowerCase();
}

// Dud/tile length gates are per-script: nearly every Japanese word is 1-3
// chars (水, 学生, 行く), so the Latin "<3 chars is filler" rule would
// produce ZERO duds for ja. For CJK only single-char kana (particles,
// too-obvious grammar glue) are filtered.
const CJK_RE = /[々぀-ヿ㐀-䶿一-鿿]/;
function isTooObviousDud(w: string): boolean {
  if (CJK_RE.test(w)) return w.length === 1 && /^[぀-ゟ]$/.test(w);
  return w.length < 3;
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

export function scrambleWords(card: Pick<QuestCard, 'target' | 'tokens'>): { correct: string[]; scrambled: string[] } {
  // Normalize: strip punctuation + lowercase so tiles don't give away order.
  // contentTokens = pre-tokenized tokens for ja (punctuation tokens already
  // excluded), whitespace split for everyone else.
  const correct = contentTokens(card).map(normalizeTileWord);
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
    for (const raw of contentTokens(card)) {
      const w = normalizeTileWord(raw);
      if (isTooObviousDud(w)) continue;     // "y"/"de" (Latin), single kana (ja)
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
  card: Pick<QuestCard, 'target' | 'tokens'>,
  siblingCards: QuestCard[],
  dudCountOverride?: number,
): { correct: string[]; tiles: string[] } {
  const correct = contentTokens(card).map(normalizeTileWord);
  const duds = generateDuds(correct, siblingCards, dudCountOverride ?? dudCountForLength(correct.length));
  const tiles = fisherYatesShuffle([...correct, ...duds]);
  return { correct, tiles };
}

// ── Tile Card Selection ─────────────────────────────────────
export function selectTileCandidates(queue: QuestCard[]): number[] {
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  // Only cards approaching retention (14+ day interval) are eligible
  // This makes tiles a milestone challenge, not every review
  const candidates = queue
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => {
      const wordCount = contentTokens(card).length;
      // Tokenized (ja) sentences run 4-7 content tokens at N5 — the
      // 5-word floor would disqualify most of the deck, so it drops to 4.
      const minLen = card.tokens?.length ? 4 : 5;
      return (
        card.mastery >= 2 &&              // must be graduated (not still learning)
        (card.interval || 0) >= fourteenDaysMs && // approaching retention (21d)
        wordCount >= minLen &&
        wordCount <= 12
      );
    });

  if (candidates.length === 0) return [];

  // Prefer shorter cards for tiles, especially in early nodes (01-10)
  // This makes early challenges achievable and later ones more demanding
  candidates.sort((a, b) => {
    const nodeA = parseInt((a.card as any).grammarNode?.replace('node-', '') || '99');
    const nodeB = parseInt((b.card as any).grammarNode?.replace('node-', '') || '99');
    const wordsA = contentTokens(a.card).length;
    const wordsB = contentTokens(b.card).length;
    // Early nodes (01-10): strongly prefer shorter cards
    if (nodeA <= 10 && nodeB <= 10) return wordsA - wordsB;
    // Mixed: early node cards first
    if (nodeA <= 10) return -1;
    if (nodeB <= 10) return 1;
    // Later nodes: still prefer shorter but less aggressively
    return wordsA - wordsB;
  });

  // Cap at 2 tiles per session, pick from the shortest candidates
  const tileCount = Math.min(2, candidates.length);
  return candidates.slice(0, tileCount).map(c => c.idx);
}

// ── Challenge Question Building ─────────────────────────────
export function buildChallengeQuestions(cards: QuestCard[], count: number): ChallengeQuestion[] {
  // Filter eligible cards (prefer 5-12 words, fallback to 3-14).
  // Tokenized (ja) cards use a floor of 4 — see selectTileCandidates.
  let eligible = cards.filter(c => {
    const wc = contentTokens(c).length;
    return wc >= (c.tokens?.length ? 4 : 5) && wc <= 12;
  });

  // Fallback: include shorter/longer sentences if not enough
  if (eligible.length < count) {
    eligible = cards.filter(c => {
      const wc = contentTokens(c).length;
      return wc >= 3 && wc <= 14;
    });
  }

  const shuffled = fisherYatesShuffle(eligible);
  const selected = shuffled.slice(0, count);

  return selected.map(card => {
    const { correct, scrambled } = scrambleWords(card);
    return { card, correctWords: correct, scrambledWords: scrambled };
  });
}

// ── Answer Checking ─────────────────────────────────────────
// Spanish has flexible word order, so we give detailed feedback:
//   'exact'     – perfect match (original order)
//   'close'     – right words, 1-2 in wrong position (still counts as correct)
//   'wrong'     – picked a dud word
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

  // All right words, just in different order – find which are misplaced
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
export const TOTAL_BOSSES = 22;

export function shouldTriggerChallenge(
  progress: ProgressState,
  newCumulativeTotal: number
): ChallengeMode | null {
  // Boss takes priority over checkpoint
  const bossTrigger = Math.floor(newCumulativeTotal / BOSS_INTERVAL);
  const lastBossTrigger = Math.floor(progress.cumulativeNewCards / BOSS_INTERVAL);
  if (bossTrigger > lastBossTrigger && progress.nextBossIndex < TOTAL_BOSSES) {
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
