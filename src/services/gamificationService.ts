import { UserStats, MasteryMap, Achievement, QuestCard } from '../types';
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

export const updateStreak = (stats: UserStats): UserStats => {
  const today = new Date().toDateString();
  if (stats.lastStudyDate === today) return stats;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const newStreak = stats.lastStudyDate === yesterday ? stats.streak + 1 : 1;

  return { ...stats, streak: newStreak, lastStudyDate: today };
};

export const checkAchievements = (
  stats: UserStats,
  masteryMap: MasteryMap,
  deck: QuestCard[]
): Achievement[] => {
  const unlocked = loadUnlockedAchievements();
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue;
    if (achievement.condition(stats, masteryMap, deck)) {
      newlyUnlocked.push({ ...achievement, unlocked: true });
      unlocked.push(achievement.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(unlocked);
  }

  return newlyUnlocked;
};

export const getAchievementsWithStatus = (
  stats: UserStats,
  masteryMap: MasteryMap,
  deck: QuestCard[]
): Achievement[] => {
  const unlocked = loadUnlockedAchievements();
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlocked.includes(a.id),
  }));
};
