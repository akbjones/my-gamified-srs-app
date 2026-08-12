import { MasteryMap, UserStats, DailyStats, Language, LearningGoal, ProgressState, VocabMap, FavoriteMap, FavoriteEntry } from '../types';
import { markDirty } from './syncService';

// Per-language keys (namespaced)
const masteryKey = (lang: Language) => `quest_mastery_${lang}`;
const statsKey = (lang: Language) => `quest_stats_${lang}`;
const dailyKey = (lang: Language) => `quest_daily_${lang}`;
const achievementsKey = (lang: Language) => `quest_achievements_${lang}`;
const placementKey = (lang: Language) => `quest_placement_${lang}`;
const progressKey = (lang: Language) => `quest_progress_${lang}`;
const vocabKey = (lang: Language) => `quest_vocab_${lang}`;
const favoritesKey = (lang: Language) => `quest_favorites_${lang}`;
const scriptKey = (lang: Language) => `quest_script_${lang}`;

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
    const old = safeGet(oldKey);
    if (old && !safeGet(newKey)) {
      safeSet(newKey, old);
      safeRemove(oldKey);
    }
  }
};

// ─── Helpers ────────────────────────────────────────────────
function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}

// Guarded localStorage. Storage APIs can THROW — disabled storage, private
// mode (older Safari), or QuotaExceededError under heavy use. A storage
// failure must never crash the app: reads degrade to null (callers fall back
// to defaults), writes are silently dropped. This is why the whole app can
// still run in a storage-blocked browser (just without persistence).
const _ls: Storage | null = (() => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
})();
function safeGet(key: string): string | null {
  try { return _ls ? _ls.getItem(key) : null; } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { if (_ls) _ls.setItem(key, value); } catch { /* quota / disabled — drop write */ }
  // Mark this key for cross-device sync. No-op unless sync is enabled and the
  // key is a synced progress key, so it's free to call on every write. Never
  // fires for the sync service's own bookkeeping keys (different writer).
  markDirty(key);
}
function safeRemove(key: string): void {
  try { if (_ls) _ls.removeItem(key); } catch { /* ignore */ }
}

// ─── Mastery ────────────────────────────────────────────────
export const loadMasteryMap = (lang: Language): MasteryMap => {
  return safeParse(safeGet(masteryKey(lang)), {});
};

export const saveMasteryMap = (map: MasteryMap, lang: Language): void => {
  safeSet(masteryKey(lang), JSON.stringify(map));
};

// ─── Script-teacher progress ────────────────────────────────
// Same value shape as the mastery map but a fully separate track (alphabet
// items, not deck cards — shares only the streak with deck study). Lives HERE,
// not in scriptSrsService: safeSet is module-private and is the sole path that
// fires markDirty, so any write outside this file would silently never sync.
export const loadScriptMap = (lang: Language): MasteryMap => {
  return safeParse(safeGet(scriptKey(lang)), {});
};

export const saveScriptMap = (map: MasteryMap, lang: Language): void => {
  safeSet(scriptKey(lang), JSON.stringify(map));
};

// ─── User Stats ─────────────────────────────────────────────
const DEFAULT_USER_STATS: UserStats = {
  streak: 0, totalReviews: 0, cardsLearned: 0,
  lastStudyDate: '', streakFreezes: 0, freezeEarnedAtStreak: 0, freezeUsedDates: [],
};

export const loadUserStats = (lang: Language): UserStats => {
  const parsed = safeParse<Partial<UserStats> | null>(safeGet(statsKey(lang)), null);
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
  safeSet(statsKey(lang), JSON.stringify(stats));
};

// ─── Daily Stats ────────────────────────────────────────────
export const loadDailyStats = (lang: Language): DailyStats => {
  const parsed = safeParse<DailyStats | null>(safeGet(dailyKey(lang)), null);
  if (parsed && parsed.date === new Date().toDateString()) {
    return parsed;
  }
  return { date: new Date().toDateString(), newCardsCount: 0 };
};

export const saveDailyStats = (stats: DailyStats, lang: Language): void => {
  safeSet(dailyKey(lang), JSON.stringify(stats));
};

// ─── Achievements ───────────────────────────────────────────
export const loadUnlockedAchievements = (lang: Language): string[] => {
  return safeParse(safeGet(achievementsKey(lang)), []);
};

export const saveUnlockedAchievements = (ids: string[], lang: Language): void => {
  safeSet(achievementsKey(lang), JSON.stringify(ids));
};

// ─── Settings (global + per-language) ──────────────────────
export type AudioSpeed = 0.6 | 0.8 | 1.0;

/** Per-language overrides for card-volume settings.
 *  If a language has no entry, the global `dailyNewLimit` / `sessionCardLimit`
 *  acts as the default. Theme, audio, etc. stay global. */
export type PerLanguageLimits = Partial<Record<Language, {
  dailyNewLimit?: number;
  sessionCardLimit?: number;
}>>;

export interface StudySettings {
  // Global defaults – apply to any language without an override
  dailyNewLimit: number;
  sessionCardLimit: number; // cards per "Study More" session (5–50)
  // Per-language overrides for card volume
  perLanguageLimits?: PerLanguageLimits;
  // Per-language theme selection (general/travel/work/family). Switching
  // languages restores that language's last goal instead of carrying the
  // previous language's goal over.
  goalByLanguage?: Partial<Record<Language, LearningGoal>>;
  // Other settings stay global
  selectedLanguage: Language;
  /** Legacy global goal — superseded by goalByLanguage; kept for migration. */
  learningGoal: LearningGoal;
  theme: 'light' | 'dark';
  autoPlayAudio: boolean;
  audioSpeed: AudioSpeed;
  googleTtsApiKey?: string; // optional – falls back to browser TTS if not set
  /** Script-teacher home banner: per-language "not now" collapses the full
   *  card to the compact pill (never removes the entry point entirely). */
  scriptIntroDismissed?: Partial<Record<Language, boolean>>;
}

const DEFAULT_SETTINGS: StudySettings = {
  dailyNewLimit: 20,
  sessionCardLimit: 10,
  perLanguageLimits: {},
  selectedLanguage: 'spanish',
  learningGoal: 'general',
  theme: 'light',
  autoPlayAudio: true,
  audioSpeed: 1.0,
};

export const loadSettings = (): StudySettings => {
  const parsed = safeParse<Partial<StudySettings> | null>(safeGet(SETTINGS_KEY), null);
  if (parsed) {
    const settings = { ...DEFAULT_SETTINGS, ...parsed };
    // Migrate the legacy global goal: seed only the currently-selected
    // language with it; every other language starts at 'general'.
    if (!parsed.goalByLanguage && parsed.learningGoal && parsed.learningGoal !== 'general') {
      settings.goalByLanguage = { [settings.selectedLanguage]: parsed.learningGoal };
    }
    return settings;
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: StudySettings): void => {
  safeSet(SETTINGS_KEY, JSON.stringify(settings));
};

/** Get the effective daily new-card limit for `lang`, falling back to the global default. */
export const getDailyLimitFor = (settings: StudySettings, lang: Language): number => {
  return settings.perLanguageLimits?.[lang]?.dailyNewLimit ?? settings.dailyNewLimit;
};

/** Get the effective session card limit for `lang`, falling back to the global default. */
export const getSessionLimitFor = (settings: StudySettings, lang: Language): number => {
  return settings.perLanguageLimits?.[lang]?.sessionCardLimit ?? settings.sessionCardLimit;
};

/** Set the per-language daily-limit override (without touching other langs). */
export const setDailyLimitFor = (settings: StudySettings, lang: Language, value: number): StudySettings => {
  const perLang = { ...(settings.perLanguageLimits || {}) };
  perLang[lang] = { ...(perLang[lang] || {}), dailyNewLimit: value };
  return { ...settings, perLanguageLimits: perLang };
};

/** Set the per-language session-limit override. */
export const setSessionLimitFor = (settings: StudySettings, lang: Language, value: number): StudySettings => {
  const perLang = { ...(settings.perLanguageLimits || {}) };
  perLang[lang] = { ...(perLang[lang] || {}), sessionCardLimit: value };
  return { ...settings, perLanguageLimits: perLang };
};

/** Get the goal (theme filter) for `lang` — that language's last selection, else 'general'. */
export const getGoalFor = (settings: StudySettings, lang: Language): LearningGoal => {
  return settings.goalByLanguage?.[lang] ?? 'general';
};

/** Remember the goal for `lang` only; other languages keep their own. */
export const setGoalFor = (settings: StudySettings, lang: Language, goal: LearningGoal): StudySettings => {
  return {
    ...settings,
    goalByLanguage: { ...(settings.goalByLanguage || {}), [lang]: goal },
    learningGoal: goal, // legacy field kept in sync for anything still reading it
  };
};

// ─── Placement ──────────────────────────────────────────────
export const isPlacementComplete = (lang: Language): boolean => {
  return safeGet(placementKey(lang)) === 'true';
};

export const setPlacementComplete = (lang: Language): void => {
  safeSet(placementKey(lang), 'true');
};

/** Whether the user actually TOOK the test (vs declined it) — drives the
 *  Settings label ("Retake placement test" vs "Skip ahead — take the test").
 *  Key starts with quest_placement_ so it rides the placement sync rule
 *  (monotonic: taken on either device = taken). */
export const isPlacementTaken = (lang: Language): boolean => {
  return !!safeGet(`quest_placement_taken_${lang}`);
};

export const setPlacementTaken = (lang: Language): void => {
  safeSet(`quest_placement_taken_${lang}`, 'true');
};

// ─── Difficulty check-in (one-shot per language, at session end) ───
export const isCheckinDone = (lang: Language): boolean => {
  return !!safeGet(`quest_checkin_${lang}`);
};

export const setCheckinDone = (lang: Language): void => {
  safeSet(`quest_checkin_${lang}`, 'true');
};

export const resetPlacement = (lang: Language): void => {
  safeRemove(placementKey(lang));
};

// ─── Progress State ─────────────────────────────────────────
const DEFAULT_PROGRESS: ProgressState = {
  cumulativeNewCards: 0, lastCheckpointAt: 0, lastBossAt: 0,
  bossRecords: [], nextBossIndex: 0,
};

export const loadProgressState = (lang: Language): ProgressState => {
  const parsed = safeParse<Partial<ProgressState> | null>(safeGet(progressKey(lang)), null);
  if (parsed) return { ...DEFAULT_PROGRESS, ...parsed };
  return { ...DEFAULT_PROGRESS };
};

export const saveProgressState = (state: ProgressState, lang: Language): void => {
  safeSet(progressKey(lang), JSON.stringify(state));
};

// ─── Vocabulary ────────────────────────────────────────────
export const loadVocabMap = (lang: Language): VocabMap => {
  return safeParse(safeGet(vocabKey(lang)), {});
};

export const saveVocabMap = (map: VocabMap, lang: Language): void => {
  safeSet(vocabKey(lang), JSON.stringify(map));
};

// ─── Favorites ─────────────────────────────────────────────
export const loadFavorites = (lang: Language): FavoriteMap => {
  return safeParse(safeGet(favoritesKey(lang)), {});
};

export const saveFavorites = (map: FavoriteMap, lang: Language): void => {
  safeSet(favoritesKey(lang), JSON.stringify(map));
};

/** Toggle whether `word` is favorited in `lang`. Returns the updated map. */
export const toggleFavorite = (
  word: string,
  lang: Language,
  entry: Omit<FavoriteEntry, 'word' | 'savedAt'>,
): FavoriteMap => {
  const key = word.toLowerCase();
  const map = loadFavorites(lang);
  if (map[key]) {
    delete map[key];
  } else {
    map[key] = { ...entry, word: key, savedAt: Date.now() };
  }
  saveFavorites(map, lang);
  return map;
};

export const isFavorited = (word: string, lang: Language): boolean => {
  return !!loadFavorites(lang)[word.toLowerCase()];
};

// ─── Grammar / Etymology favorites ─────────────────────────
// Different namespaces in the same FavoriteMap so the UI can show them all
// together but filter by kind. Vocab keys stay raw (legacy compat); grammar
// and etymology keys get a prefix so they can't collide with vocab words
// like "etymology" or "grammar" if those ever get tapped as words.

/** Build a stable storage key for a grammar-tip favorite. The tip itself is
 *  the unique part – saving the same tip from another card de-dupes. */
const grammarKey = (tip: string) =>
  `__g__${tip.toLowerCase().replace(/\s+/g, ' ').trim()}`;

const etymologyKey = (word: string) => `__e__${word.toLowerCase()}`;

export const toggleGrammarFavorite = (
  tip: string,
  lang: Language,
  example?: string,
  label?: string,
): FavoriteMap => {
  const key = grammarKey(tip);
  const map = loadFavorites(lang);
  if (map[key]) {
    delete map[key];
  } else {
    map[key] = {
      word: label || tip.slice(0, 60) + (tip.length > 60 ? '…' : ''),
      kind: 'grammar',
      grammarTip: tip,
      example,
      savedAt: Date.now(),
    };
  }
  saveFavorites(map, lang);
  return map;
};

export const isGrammarFavorited = (tip: string, lang: Language): boolean => {
  return !!loadFavorites(lang)[grammarKey(tip)];
};

export const toggleEtymologyFavorite = (
  word: string,
  lang: Language,
  origin: string,
  note: string,
  cognates: string[] | undefined,
  sources: string[],
  example?: string,
): FavoriteMap => {
  const key = etymologyKey(word);
  const map = loadFavorites(lang);
  if (map[key]) {
    delete map[key];
  } else {
    map[key] = {
      word: word.toLowerCase(),
      kind: 'etymology',
      etymologyOrigin: origin,
      etymologyNote: note,
      etymologyCognates: cognates,
      etymologySources: sources,
      example,
      savedAt: Date.now(),
    };
  }
  saveFavorites(map, lang);
  return map;
};

export const isEtymologyFavorited = (word: string, lang: Language): boolean => {
  return !!loadFavorites(lang)[etymologyKey(word)];
};

// ─── Reset ──────────────────────────────────────────────────
export const resetAll = (): void => {
  // Clear all language-specific keys
  // All supported languages — keep in sync with the Language union / DECK_MAP.
  const langs: Language[] = ['spanish', 'italian', 'german', 'french', 'portuguese', 'dutch', 'swedish', 'welsh', 'hindi', 'turkish', 'russian', 'indonesian', 'greek', 'korean', 'japanese', 'mum'];
  for (const lang of langs) {
    safeRemove(masteryKey(lang));
    safeRemove(statsKey(lang));
    safeRemove(dailyKey(lang));
    safeRemove(achievementsKey(lang));
    safeRemove(placementKey(lang));
    safeRemove(progressKey(lang));
    safeRemove(vocabKey(lang));
    safeRemove(favoritesKey(lang));
    safeRemove(scriptKey(lang));
  }
  // Clear old non-namespaced keys too (for migration)
  safeRemove('quest_mastery');
  safeRemove('quest_stats');
  safeRemove('quest_daily');
  safeRemove('quest_achievements');
  safeRemove(SETTINGS_KEY);
};

// ─── Backup / restore ───────────────────────────────────────
// Progress lives only in this browser (no account / no sync), so give users a
// way to back it up and move it. Export dumps every `quest_*` key; import
// writes them back (overwrite). Keeps the app usable across devices/wipes
// without a backend.
const BACKUP_PREFIX = 'quest_';

export const exportAllProgress = (): string => {
  const data: Record<string, unknown> = {};
  try {
    const n = _ls ? _ls.length : 0;
    for (let i = 0; i < n; i++) {
      const key = _ls!.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) data[key] = safeParse<unknown>(safeGet(key), null);
    }
  } catch { /* storage unreadable — export whatever we got */ }
  return JSON.stringify({ app: 'langlab', schema: 1, exportedAt: new Date().toISOString(), data }, null, 2);
};

export const importAllProgress = (json: string): { ok: boolean; imported: number; error?: string } => {
  let parsed: unknown;
  try { parsed = JSON.parse(json); } catch { return { ok: false, imported: 0, error: 'That file is not valid JSON.' }; }
  const data = (parsed && typeof parsed === 'object') ? (parsed as { data?: unknown }).data : null;
  if (!data || typeof data !== 'object') return { ok: false, imported: 0, error: 'This does not look like a LangLab backup (no progress data).' };
  let imported = 0;
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!key.startsWith(BACKUP_PREFIX)) continue; // never write foreign keys
    safeSet(key, JSON.stringify(value));
    imported++;
  }
  return imported > 0
    ? { ok: true, imported }
    : { ok: false, imported: 0, error: 'No LangLab progress found in that file.' };
};
