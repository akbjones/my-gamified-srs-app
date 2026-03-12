import { UserStats, MasteryMap, Achievement, QuestCard, Language, StreakTier } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';
import { loadUnlockedAchievements, saveUnlockedAchievements } from './storageService';

/** Simple answer recording — increments totalReviews */
export const recordAnswer = (stats: UserStats): UserStats => ({
  ...stats,
  totalReviews: stats.totalReviews + 1,
});

/** Bulk recording for placement test fast-tracked cards */
export const recordBulkAnswers = (
  cardCount: number,
  stats: UserStats
): UserStats => ({
  ...stats,
  totalReviews: stats.totalReviews + cardCount,
  cardsLearned: stats.cardsLearned + cardCount,
});

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
