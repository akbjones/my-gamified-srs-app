import { MasteryMap, UserStats, DailyStats } from '../types';

const MASTERY_KEY = 'quest_mastery';
const STATS_KEY = 'quest_stats';
const DAILY_KEY = 'quest_daily';
const ACHIEVEMENTS_KEY = 'quest_achievements';

export const loadMasteryMap = (): MasteryMap => {
  const saved = localStorage.getItem(MASTERY_KEY);
  return saved ? JSON.parse(saved) : {};
};

export const saveMasteryMap = (map: MasteryMap): void => {
  localStorage.setItem(MASTERY_KEY, JSON.stringify(map));
};

export const loadUserStats = (): UserStats => {
  const saved = localStorage.getItem(STATS_KEY);
  if (saved) return JSON.parse(saved);
  return {
    xp: 0,
    level: 1,
    streak: 0,
    totalReviews: 0,
    cardsLearned: 0,
    lastStudyDate: '',
  };
};

export const saveUserStats = (stats: UserStats): void => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const loadDailyStats = (): DailyStats => {
  const saved = localStorage.getItem(DAILY_KEY);
  if (saved) {
    const parsed: DailyStats = JSON.parse(saved);
    if (parsed.date === new Date().toDateString()) {
      return parsed;
    }
  }
  return { date: new Date().toDateString(), newCardsCount: 0 };
};

export const saveDailyStats = (stats: DailyStats): void => {
  localStorage.setItem(DAILY_KEY, JSON.stringify(stats));
};

export const loadUnlockedAchievements = (): string[] => {
  const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const saveUnlockedAchievements = (ids: string[]): void => {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids));
};

const SETTINGS_KEY = 'quest_settings';

export interface StudySettings {
  dailyNewLimit: number;
}

const DEFAULT_SETTINGS: StudySettings = { dailyNewLimit: 10 };

export const loadSettings = (): StudySettings => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: StudySettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const resetAll = (): void => {
  localStorage.removeItem(MASTERY_KEY);
  localStorage.removeItem(STATS_KEY);
  localStorage.removeItem(DAILY_KEY);
  localStorage.removeItem(ACHIEVEMENTS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
};
