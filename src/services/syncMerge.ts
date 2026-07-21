// Pure, side-effect-free merge functions for cross-device progress sync.
//
// The sync transport is dumb (push/pull JSON blobs keyed by storage key); ALL
// the correctness lives here. Every function is a deterministic merge of two
// values for the SAME storage key — used both on first pairing (local ⊕ cloud)
// and on every pull (incoming ⊕ local). No function ever deletes data (union /
// max / newest-wins), so a stale device can never erase a fresh one. Whole-
// account deletion is handled out of band by the reset epoch, not here.
//
// Kept as its own module with zero imports from React/storage side-effects so
// it can be unit-tested in isolation (see scripts/test-sync-merge.ts).

import type {
  MasteryMap, UserStats, DailyStats, ProgressState, VocabMap, VocabEntry,
  FavoriteMap, FavoriteEntry, BossRecord, BossRing, Language,
} from '../types';
import type { StudySettings } from './storageService';

// ── key classification ──────────────────────────────────────────────────────
export type MergeKind =
  | 'mastery' | 'stats' | 'daily' | 'progress' | 'vocab'
  | 'favorites' | 'achievements' | 'placement' | 'settings' | 'unknown';

export function keyKind(key: string): MergeKind {
  if (key === 'quest_settings') return 'settings';
  if (key.startsWith('quest_mastery_')) return 'mastery';
  if (key.startsWith('quest_stats_')) return 'stats';
  if (key.startsWith('quest_daily_')) return 'daily';
  if (key.startsWith('quest_progress_')) return 'progress';
  if (key.startsWith('quest_vocab_')) return 'vocab';
  if (key.startsWith('quest_favorites_')) return 'favorites';
  if (key.startsWith('quest_achievements_')) return 'achievements';
  if (key.startsWith('quest_placement_')) return 'placement';
  return 'unknown';
}

const num = (v: unknown, d = 0): number => (typeof v === 'number' && !Number.isNaN(v) ? v : d);
const obj = <T>(v: unknown): Record<string, T> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, T>) : {});

// ── mastery: the one that matters — union of card ids, newest review wins ─────
export function mergeMastery(a: MasteryMap | null | undefined, b: MasteryMap | null | undefined): MasteryMap {
  const A = obj<Partial<import('../types').QuestCard>>(a);
  const B = obj<Partial<import('../types').QuestCard>>(b);
  const out: MasteryMap = {};
  const ids = new Set([...Object.keys(A), ...Object.keys(B)]);
  for (const id of ids) {
    const x = A[id], y = B[id];
    if (!x) { out[id] = y!; continue; }
    if (!y) { out[id] = x; continue; }
    out[id] = pickNewerCard(x, y);
  }
  return out;
}

function pickNewerCard(x: Partial<import('../types').QuestCard>, y: Partial<import('../types').QuestCard>) {
  // Prefer the side whose last review is more recent; the review that happened
  // later reflects the newer memory state. Fall back to reps, then dueDate,
  // for legacy SM-2 cards that predate lastReview.
  const lx = x.lastReview, ly = y.lastReview;
  if (lx != null && ly != null) return lx >= ly ? x : y;
  if (lx != null) return x;
  if (ly != null) return y;
  const rx = num(x.reps), ry = num(y.reps);
  if (rx !== ry) return rx > ry ? x : y;
  return num(x.dueDate) >= num(y.dueDate) ? x : y;
}

/** Count graduated cards (mastery === 2) in a merged map — used to recompute
 *  cardsLearned so the counter can never regress or double-count across devices. */
export function countLearned(m: MasteryMap): number {
  let n = 0;
  for (const id in m) if (num(m[id]?.mastery) >= 2) n++;
  return n;
}

// ── stats: never regress a counter; recompute cardsLearned from merged mastery ─
export function reconcileStats(
  a: Partial<UserStats> | null | undefined,
  b: Partial<UserStats> | null | undefined,
  mergedMastery?: MasteryMap,
): UserStats {
  const A = a || {}, B = b || {};
  const laterDate = maxDate(A.lastStudyDate, B.lastStudyDate);
  const freezeDates = Array.from(new Set([...(A.freezeUsedDates || []), ...(B.freezeUsedDates || [])])).sort();
  return {
    streak: Math.max(num(A.streak), num(B.streak)),
    totalReviews: Math.max(num(A.totalReviews), num(B.totalReviews)),
    cardsLearned: mergedMastery ? countLearned(mergedMastery) : Math.max(num(A.cardsLearned), num(B.cardsLearned)),
    lastStudyDate: laterDate,
    streakFreezes: Math.max(num(A.streakFreezes), num(B.streakFreezes)),
    freezeEarnedAtStreak: Math.max(num(A.freezeEarnedAtStreak), num(B.freezeEarnedAtStreak)),
    freezeUsedDates: freezeDates,
  };
}

// YYYY-MM-DD strings compare lexicographically === chronologically.
function maxDate(a?: string, b?: string): string {
  if (!a) return b || '';
  if (!b) return a;
  return a >= b ? a : b;
}

// ── daily: later date wins; same date → the higher new-card count ─────────────
export function mergeDaily(a: DailyStats | null | undefined, b: DailyStats | null | undefined): DailyStats {
  const A = a || { date: '', newCardsCount: 0 };
  const B = b || { date: '', newCardsCount: 0 };
  if (A.date === B.date) return { date: A.date, newCardsCount: Math.max(num(A.newCardsCount), num(B.newCardsCount)) };
  return (A.date >= B.date) ? A : B;
}

// ── progress: max the counters; union boss records keeping the best ring ──────
const RING_RANK: Record<BossRing, number> = { none: 0, bronze: 1, silver: 2, gold: 3 };
export function mergeProgress(a: Partial<ProgressState> | null | undefined, b: Partial<ProgressState> | null | undefined): ProgressState {
  const A = a || {}, B = b || {};
  const byIndex = new Map<number, BossRecord>();
  for (const r of [...(A.bossRecords || []), ...(B.bossRecords || [])]) {
    const cur = byIndex.get(r.bossIndex);
    if (!cur || RING_RANK[r.bestRing] > RING_RANK[cur.bestRing] ||
        (RING_RANK[r.bestRing] === RING_RANK[cur.bestRing] && r.completedAt < cur.completedAt)) {
      byIndex.set(r.bossIndex, r);
    }
  }
  return {
    cumulativeNewCards: Math.max(num(A.cumulativeNewCards), num(B.cumulativeNewCards)),
    lastCheckpointAt: Math.max(num(A.lastCheckpointAt), num(B.lastCheckpointAt)),
    lastBossAt: Math.max(num(A.lastBossAt), num(B.lastBossAt)),
    bossRecords: [...byIndex.values()].sort((r, s) => r.bossIndex - s.bossIndex),
    nextBossIndex: Math.max(num(A.nextBossIndex), num(B.nextBossIndex)),
  };
}

// ── vocab: per-word union — earliest first-seen, latest everything else ───────
export function mergeVocab(a: VocabMap | null | undefined, b: VocabMap | null | undefined): VocabMap {
  const A = obj<VocabEntry>(a), B = obj<VocabEntry>(b);
  const out: VocabMap = {};
  for (const w of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const x = A[w], y = B[w];
    if (!x) { out[w] = y!; continue; }
    if (!y) { out[w] = x; continue; }
    out[w] = {
      word: x.word || y.word,
      translation: x.translation || y.translation,
      ipa: x.ipa || y.ipa,
      pos: x.pos || y.pos,
      firstSeen: Math.min(num(x.firstSeen, Infinity), num(y.firstSeen, Infinity)),
      lastSeen: Math.max(num(x.lastSeen), num(y.lastSeen)),
      timesSeen: Math.max(num(x.timesSeen), num(y.timesSeen)),
      timesFailed: Math.max(num(x.timesFailed), num(y.timesFailed)),
    };
  }
  return out;
}

// ── favorites: union by key; on collision keep the more recently-saved entry ──
export function mergeFavorites(a: FavoriteMap | null | undefined, b: FavoriteMap | null | undefined): FavoriteMap {
  const A = obj<FavoriteEntry>(a), B = obj<FavoriteEntry>(b);
  const out: FavoriteMap = { ...A };
  for (const k of Object.keys(B)) {
    const existing = out[k];
    if (!existing || num(B[k].savedAt) > num(existing.savedAt)) out[k] = B[k];
  }
  return out;
}

// ── achievements: set union ───────────────────────────────────────────────────
export function mergeAchievements(a: string[] | null | undefined, b: string[] | null | undefined): string[] {
  return Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])).sort();
}

// ── placement: monotonic — done on either device means done ───────────────────
export function mergePlacement(a: unknown, b: unknown): 'true' {
  return 'true'; // only ever stored when completed; presence on either side wins
}
export function placementDone(v: unknown): boolean {
  return v === true || v === 'true';
}

// ── settings: shallow-merge the account-level maps; keep device's own API key ─
// Called with `remote` = the incoming settings when the cloud row is newer than
// local (transport decides by updated_at). Per-language limits and goals UNION
// (never lose a language's config); the local googleTtsApiKey is always kept
// (it is stripped before upload, so the cloud never has it anyway).
// `local` is null on a BRAND-NEW device pairing (the settings key doesn't exist
// in localStorage yet) — must not throw, or the whole first pull dies mid-way.
export function mergeSettings(local: StudySettings | null | undefined, remote: Partial<StudySettings>): StudySettings {
  const L = (local || {}) as Partial<StudySettings>;
  return {
    ...L,
    ...remote,
    perLanguageLimits: { ...(L.perLanguageLimits || {}), ...(remote.perLanguageLimits || {}) } as StudySettings['perLanguageLimits'],
    goalByLanguage: { ...(L.goalByLanguage || {}), ...(remote.goalByLanguage || {}) } as Partial<Record<Language, import('../types').LearningGoal>>,
    googleTtsApiKey: L.googleTtsApiKey, // never accept a key from the cloud
  } as StudySettings;
}

/** Remove the API key before a settings value is uploaded. Hard requirement:
 *  the key must never reach the database. */
export function stripSecret(settings: StudySettings): Omit<StudySettings, 'googleTtsApiKey'> {
  const { googleTtsApiKey, ...rest } = settings;
  void googleTtsApiKey;
  return rest;
}

// ── dispatcher for keys that merge independently (mastery→stats handled by the
//    orchestrator, which must merge mastery first to recompute cardsLearned) ──
export function mergeIndependent(key: string, local: unknown, remote: unknown): unknown {
  switch (keyKind(key)) {
    case 'mastery': return mergeMastery(local as MasteryMap, remote as MasteryMap);
    case 'daily': return mergeDaily(local as DailyStats, remote as DailyStats);
    case 'progress': return mergeProgress(local as ProgressState, remote as ProgressState);
    case 'vocab': return mergeVocab(local as VocabMap, remote as VocabMap);
    case 'favorites': return mergeFavorites(local as FavoriteMap, remote as FavoriteMap);
    case 'achievements': return mergeAchievements(local as string[], remote as string[]);
    case 'placement': return mergePlacement(local, remote);
    // stats + settings need cross-key / newer-wins context → handled by orchestrator
    default: return remote ?? local;
  }
}
