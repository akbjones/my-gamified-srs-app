import { MasteryMap, UserStats, DailyStats, Language, LearningGoal, ProgressState, VocabMap } from '../types';

// Per-language keys (namespaced)
const masteryKey = (lang: Language) => `quest_mastery_${lang}`;
const statsKey = (lang: Language) => `quest_stats_${lang}`;
const dailyKey = (lang: Language) => `quest_daily_${lang}`;
const achievementsKey = (lang: Language) => `quest_achievements_${lang}`;
const placementKey = (lang: Language) => `quest_placement_${lang}`;
const progressKey = (lang: Language) => `quest_progress_${lang}`;
const vocabKey = (lang: Language) => `quest_vocab_${lang}`;

// Global keys (shared across languages)
const SETTINGS_KEY = 'quest_settings';

// ─── Migration ──────────────────────────────────────────────
// One-time: move old non-namespaced keys to spanish-namespaced keys
export const migrateStorageKeys = (): void => {
  const oldKeys = [
    ['quest_mastery', masteryKey('spanish')],
    ['quest_stats', statsKey('spanish')],
    ['quest_daily', dailyKey('spanish')],
    ['quest_achievements', achievementsKey('spanish')],
  ];
  for (const [oldKey, newKey] of oldKeys) {
    const old = localStorage.getItem(oldKey);
    if (old && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, old);
      localStorage.removeItem(oldKey);
    }
  }
};

// ─── Helpers ────────────────────────────────────────────────
function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}

// ─── Mastery ────────────────────────────────────────────────
export const loadMasteryMap = (lang: Language): MasteryMap => {
  return safeParse(localStorage.getItem(masteryKey(lang)), {});
};

export const saveMasteryMap = (map: MasteryMap, lang: Language): void => {
  localStorage.setItem(masteryKey(lang), JSON.stringify(map));
};

// ─── User Stats ─────────────────────────────────────────────
const DEFAULT_USER_STATS: UserStats = {
  streak: 0, totalReviews: 0, cardsLearned: 0,
  lastStudyDate: '', streakFreezes: 0, freezeEarnedAtStreak: 0, freezeUsedDates: [],
};

export const loadUserStats = (lang: Language): UserStats => {
  const parsed = safeParse<Partial<UserStats> | null>(localStorage.getItem(statsKey(lang)), null);
  if (parsed) {
    return {
      streak: parsed.streak ?? 0,
      totalReviews: parsed.totalReviews ?? 0,
      cardsLearned: parsed.cardsLearned ?? 0,
      lastStudyDate: parsed.lastStudyDate ?? '',
      streakFreezes: parsed.streakFreezes ?? 0,
      freezeEarnedAtStreak: parsed.freezeEarnedAtStreak ?? 0,
      freezeUsedDates: parsed.freezeUsedDates ?? [],
    };
  }
  return { ...DEFAULT_USER_STATS };
};

export const saveUserStats = (stats: UserStats, lang: Language): void => {
  localStorage.setItem(statsKey(lang), JSON.stringify(stats));
};

// ─── Daily Stats ────────────────────────────────────────────
export const loadDailyStats = (lang: Language): DailyStats => {
  const parsed = safeParse<DailyStats | null>(localStorage.getItem(dailyKey(lang)), null);
  if (parsed && parsed.date === new Date().toDateString()) {
    return parsed;
  }
  return { date: new Date().toDateString(), newCardsCount: 0 };
};

export const saveDailyStats = (stats: DailyStats, lang: Language): void => {
  localStorage.setItem(dailyKey(lang), JSON.stringify(stats));
};

// ─── Achievements ───────────────────────────────────────────
export const loadUnlockedAchievements = (lang: Language): string[] => {
  return safeParse(localStorage.getItem(achievementsKey(lang)), []);
};

export const saveUnlockedAchievements = (ids: string[], lang: Language): void => {
  localStorage.setItem(achievementsKey(lang), JSON.stringify(ids));
};

// ─── Settings (global) ─────────────────────────────────────
export type AudioSpeed = 0.6 | 0.8 | 1.0;

export interface StudySettings {
  dailyNewLimit: number;
  selectedLanguage: Language;
  learningGoal: LearningGoal;
  theme: 'light' | 'dark';
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string; // optional — falls back to browser TTS if not set
}

const DEFAULT_SETTINGS: StudySettings = {
  dailyNewLimit: 20,
  selectedLanguage: 'spanish',
  learningGoal: 'general',
  theme: 'light',
  autoPlayAudio: true,
  audioSpeed: 1.0,
};

export const loadSettings = (): StudySettings => {
  const parsed = safeParse<Partial<StudySettings> | null>(localStorage.getItem(SETTINGS_KEY), null);
  if (parsed) return { ...DEFAULT_SETTINGS, ...parsed };
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: StudySettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// ─── Placement ──────────────────────────────────────────────
export const isPlacementComplete = (lang: Language): boolean => {
  return localStorage.getItem(placementKey(lang)) === 'true';
};

export const setPlacementComplete = (lang: Language): void => {
  localStorage.setItem(placementKey(lang), 'true');
};

export const resetPlacement = (lang: Language): void => {
  localStorage.removeItem(placementKey(lang));
};

// ─── Progress State ─────────────────────────────────────────
const DEFAULT_PROGRESS: ProgressState = {
  cumulativeNewCards: 0, lastCheckpointAt: 0, lastBossAt: 0,
  bossRecords: [], nextBossIndex: 0,
};

export const loadProgressState = (lang: Language): ProgressState => {
  const parsed = safeParse<Partial<ProgressState> | null>(localStorage.getItem(progressKey(lang)), null);
  if (parsed) return { ...DEFAULT_PROGRESS, ...parsed };
  return { ...DEFAULT_PROGRESS };
};

export const saveProgressState = (state: ProgressState, lang: Language): void => {
  localStorage.setItem(progressKey(lang), JSON.stringify(state));
};

// ─── Vocabulary ────────────────────────────────────────────
export const loadVocabMap = (lang: Language): VocabMap => {
  return safeParse(localStorage.getItem(vocabKey(lang)), {});
};

export const saveVocabMap = (map: VocabMap, lang: Language): void => {
  localStorage.setItem(vocabKey(lang), JSON.stringify(map));
};

// ─── Reset ──────────────────────────────────────────────────
export const resetAll = (): void => {
  // Clear all language-specific keys
  const langs: Language[] = ['spanish', 'italian', 'german', 'french'];
  for (const lang of langs) {
    localStorage.removeItem(masteryKey(lang));
    localStorage.removeItem(statsKey(lang));
    localStorage.removeItem(dailyKey(lang));
    localStorage.removeItem(achievementsKey(lang));
    localStorage.removeItem(placementKey(lang));
    localStorage.removeItem(progressKey(lang));
    localStorage.removeItem(vocabKey(lang));
  }
  // Clear old non-namespaced keys too (for migration)
  localStorage.removeItem('quest_mastery');
  localStorage.removeItem('quest_stats');
  localStorage.removeItem('quest_daily');
  localStorage.removeItem('quest_achievements');
  localStorage.removeItem(SETTINGS_KEY);
};
