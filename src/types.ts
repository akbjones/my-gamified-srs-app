export type Language = 'spanish' | 'italian' | 'german' | 'french';
export type LearningGoal = 'general' | 'travel' | 'work' | 'family';

export interface QuestCard {
  id: string;
  target: string;
  english: string;
  category: string; // tier name for theming: "Novice", "Beginner", etc.
  topic: string;    // node ID: "node-01", "node-02", etc.
  audio: string;
  grammar?: string; // optional grammar note shown on answer side
  tags?: LearningGoal[]; // which learning goals this card is relevant to
  mastery: number; // 0=New, 1=Learning, 2=Graduated
  step?: number;
  dueDate?: number;
  interval?: number;
  ease?: number;
  failCount?: number;    // number of AGAIN ratings (for leech detection)
  isLeech?: boolean;     // flagged when failCount >= 5
  isSuspended?: boolean; // user can suspend leeches
}

export interface SessionState {
  language: Language;
  topic: string;
  queue: QuestCard[];
  currentIndex: number;
  isFlipped: boolean;
  finishedCount: number;
  newCardsSeen: number;
}

export type MasteryMap = Record<string, Partial<QuestCard>>;

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  totalReviews: number;
  cardsLearned: number;
  lastStudyDate: string;
  // Streak freeze system
  streakFreezes: number;            // 0-3 banked
  freezeEarnedAtStreak: number;     // streak when last freeze was earned
  freezeUsedDates: string[];        // dates when freezes auto-consumed
}

export interface DailyStats {
  date: string;
  newCardsCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (stats: UserStats, masteryMap: MasteryMap, deck: QuestCard[]) => boolean;
}

// Linear path node — a chunk of the main deck
export interface PathNode {
  id: string;
  name: string;
  tier: string;
  color: string;
  sideBranchIds?: string[];
}

// Self-contained side branch (future content)
export interface SideBranch {
  id: string;
  name: string;
  icon: string;
  cards: null; // placeholder for future
  unlocksAtNode: string;
}

// ── Gamification: Word Tile Challenges ────────────────────
export interface ChallengeQuestion {
  card: QuestCard;
  correctWords: string[];    // target sentence split into words (correct order)
  scrambledWords: string[];  // shuffled version for display
}

export type ChallengeMode = 'checkpoint' | 'boss';

export interface ChallengeState {
  mode: ChallengeMode;
  questions: ChallengeQuestion[];
  currentIndex: number;
  answers: boolean[];          // true=correct, false=wrong
  startTime: number;           // Date.now() at start
  bossIndex?: number;          // which boss (0-21) for boss mode
}

export type BossRing = 'none' | 'bronze' | 'silver' | 'gold';

export interface BossRecord {
  bossIndex: number;
  bestRing: BossRing;
  completedAt: number;
}

// ── Gamification: Streak ──────────────────────────────────
export type StreakTier = 'none' | 'small' | 'big' | 'blue' | 'lightning';

// ── Gamification: Progress Tracking ───────────────────────
export interface ProgressState {
  cumulativeNewCards: number;     // total new cards ever introduced
  lastCheckpointAt: number;      // cumulative count at last checkpoint
  lastBossAt: number;            // cumulative count at last boss
  bossRecords: BossRecord[];     // completed boss attempts
  nextBossIndex: number;         // 0-21, next boss to face
}

// Language configuration
export const LANGUAGE_CONFIG: Record<Language, { name: string; code: string; bcp47: string }> = {
  spanish: { name: 'Spanish', code: 'ES', bcp47: 'es-MX' },
  italian: { name: 'Italian', code: 'IT', bcp47: 'it-IT' },
  german:  { name: 'German',  code: 'DE', bcp47: 'de-DE' },
  french:  { name: 'French',  code: 'FR', bcp47: 'fr-FR' },
};

export const GOAL_CONFIG: Record<LearningGoal, { name: string; description: string }> = {
  general: { name: 'General', description: 'Full curriculum' },
  travel:  { name: 'Travel',  description: 'Airports, hotels, navigation' },
  work:    { name: 'Work',    description: 'Meetings, emails, professional' },
  family:  { name: 'Family',  description: 'Relationships, home, emotions' },
};

// ── Vocabulary Tracking ─────────────────────────────────────
export interface VocabEntry {
  word: string;
  translation: string;
  ipa: string;
  pos?: string;
  firstSeen: number;   // Date.now() when first encountered
  lastSeen: number;    // Date.now() when last encountered
  timesSeen: number;
  timesFailed: number; // incremented when card rated AGAIN
}

export type VocabMap = Record<string, VocabEntry>; // keyed by lowercase word

// ── Conjugation ─────────────────────────────────────────────
export interface ConjugationTable {
  infinitive: string;
  isReflexive: boolean;
  tenses: Record<string, string[]>; // tense name → [yo, tú, él, nosotros, vosotros, ellos]
}
