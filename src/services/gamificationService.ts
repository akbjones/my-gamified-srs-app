import { UserStats, MasteryMap, Achievement, QuestCard, Language, StreakTier, ChallengeMode } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';
import { loadUnlockedAchievements, saveUnlockedAchievements } from './storageService';

const XP_TABLE: Record<string, number> = {
  AGAIN: 2,
  HARD: 5,
  GOOD: 10,
  EASY: 15,
};

export const getLevel = (xp: number): number => Math.floor(xp / 100) + 1;

export const getXPProgress = (xp: number): { current: number; needed: number; percent: number } => {
  const current = xp % 100;
  return { current, needed: 100, percent: current };
};

export const awardXP = (
  rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
  stats: UserStats
): { stats: UserStats; xpGained: number; leveledUp: boolean } => {
  const xpGained = XP_TABLE[rating] || 0;
  const newXP = stats.xp + xpGained;
  const newLevel = getLevel(newXP);
  const leveledUp = newLevel > stats.level;

  return {
    stats: {
      ...stats,
      xp: newXP,
      level: newLevel,
      totalReviews: stats.totalReviews + 1,
    },
    xpGained,
    leveledUp,
  };
};

export const awardBulkXP = (
  cardCount: number,
  stats: UserStats
): UserStats => {
  const xpGained = cardCount * XP_TABLE.GOOD; // 10 XP per fast-tracked card
  const newXP = stats.xp + xpGained;
  const newLevel = getLevel(newXP);
  return {
    ...stats,
    xp: newXP,
    level: newLevel,
    totalReviews: stats.totalReviews + cardCount,
    cardsLearned: stats.cardsLearned + cardCount,
  };
};

export const updateStreak = (stats: UserStats): UserStats => {
  const today = new Date().toDateString();
  if (stats.lastStudyDate === today) return stats;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  let newStreak: number;
  let newFreezes = stats.streakFreezes ?? 0;
  let freezeUsedDates = [...(stats.freezeUsedDates ?? [])];
  let freezeEarnedAtStreak = stats.freezeEarnedAtStreak ?? 0;

  if (stats.lastStudyDate === yesterday) {
    // Studied yesterday — streak continues
    newStreak = stats.streak + 1;
  } else if (stats.lastStudyDate && newFreezes > 0) {
    // Missed yesterday but have a freeze
    const dayBefore = new Date(Date.now() - 2 * 86400000).toDateString();
    if (stats.lastStudyDate === dayBefore) {
      // Only missed one day — use a freeze
      newStreak = stats.streak + 1;
      newFreezes -= 1;
      freezeUsedDates.push(yesterday);
    } else {
      // Missed multiple days — freeze can't help
      newStreak = 1;
      freezeEarnedAtStreak = 0;
    }
  } else {
    newStreak = 1;
    freezeEarnedAtStreak = 0;
  }

  // Earn a freeze every 7 consecutive days (max 3)
  if (newStreak > 0 && newStreak >= freezeEarnedAtStreak + 7 && newFreezes < 3) {
    newFreezes += 1;
    freezeEarnedAtStreak = newStreak;
  }

  return {
    ...stats,
    streak: newStreak,
    lastStudyDate: today,
    streakFreezes: newFreezes,
    freezeEarnedAtStreak,
    freezeUsedDates,
  };
};

export const getStreakTier = (streak: number): StreakTier => {
  if (streak >= 365) return 'lightning';
  if (streak >= 100) return 'blue';
  if (streak >= 30) return 'big';
  if (streak >= 7) return 'small';
  return 'none';
};

export const awardChallengeXP = (mode: ChallengeMode, correctCount: number): number => {
  if (mode === 'checkpoint') return 25 + correctCount * 10;
  return 50 + correctCount * 15; // boss
};

export const checkAchievements = (
  stats: UserStats,
  masteryMap: MasteryMap,
  deck: QuestCard[],
  lang: Language = 'spanish'
): Achievement[] => {
  const unlocked = loadUnlockedAchievements(lang);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue;
    if (achievement.condition(stats, masteryMap, deck)) {
      newlyUnlocked.push({ ...achievement, unlocked: true });
      unlocked.push(achievement.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(unlocked, lang);
  }

  return newlyUnlocked;
};

export const getAchievementsWithStatus = (
  stats: UserStats,
  masteryMap: MasteryMap,
  deck: QuestCard[],
  lang: Language = 'spanish'
): Achievement[] => {
  const unlocked = loadUnlockedAchievements(lang);
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlocked.includes(a.id),
  }));
};
