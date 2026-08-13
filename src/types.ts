export type Language = 'spanish' | 'italian' | 'german' | 'french' | 'portuguese' | 'dutch' | 'swedish' | 'welsh' | 'hindi' | 'turkish' | 'russian' | 'indonesian' | 'greek' | 'korean' | 'japanese' | 'mum';
export type LearningGoal = 'general' | 'travel' | 'work' | 'family';

export interface QuestCard {
  id: string;
  target: string;
  english: string;
  category: string; // tier name for theming: "Novice", "Beginner", etc.
  topic: string;    // node ID: "node-01", "node-02", etc.
  audio: string;
  /** Text fed to TTS instead of `target`, when the voice mispronounces the
   *  written form. The card always DISPLAYS `target`; this only changes what
   *  the speech engine reads. e.g. एसी (AC) is read as a word, so the audio
   *  is generated from ए.सी. so the letters are spoken. */
  ttsText?: string;
  grammar?: string; // optional grammar note shown on answer side
  // Pre-tokenized target for unspaced scripts (Japanese): t = surface
  // token, r = kana reading for ruby/furigana on kanji-bearing tokens.
  // Card rendering must prefer this over any whitespace split — lint
  // guarantees tokens.map(x => x.t).join('') === target exactly.
  tokens?: { t: string; r?: string }[];
  tags?: LearningGoal[]; // which learning goals this card is relevant to
  mastery: number; // 0=New, 1=Learning, 2=Graduated
  step?: number;
  dueDate?: number;
  interval?: number;
  ease?: number;
  failCount?: number;    // number of AGAIN ratings (for leech detection)
  isLeech?: boolean;     // flagged when failCount >= 5
  isSuspended?: boolean; // user can suspend leeches
  // ── FSRS memory state (persisted; supersedes the legacy SM-2 ease/step) ──
  stability?: number;    // FSRS: memory half-life, in days
  difficulty?: number;   // FSRS: intrinsic difficulty, 1..10
  fsrsState?: number;    // FSRS State enum: 0=New 1=Learning 2=Review 3=Relearning
  reps?: number;         // total reviews
  lapses?: number;       // total AGAIN lapses (drives the leech flag)
  lastReview?: number;   // ms timestamp of the last review
  learningStep?: number; // FSRS learning_steps index — WITHOUT persisting this,
                         // every reconstruct restarts at step 0 and a GOOD-rated
                         // card loops on the 10-minute step forever (never
                         // graduates); see toFsrsCard in srsService.
  priority?: 1 | 2 | 3;  // 1=practical (show first), 2=useful, 3=specialized
  // Script-teacher only: the learner has succeeded at least once on a drill
  // whose ANSWER is the glyph (sound→glyph). Items may not graduate to
  // mastery 2 without it — recognition alone can look mastered while the
  // learner cannot retrieve the shape. See applyRecallGate.
  recallOk?: boolean;
}

export interface SessionState {
  language: Language;
  topic: string;
  queue: QuestCard[];
  currentIndex: number;
  isFlipped: boolean;
  finishedCount: number;
  newCardsSeen: number;
  /** How many times each card has been shown in THIS session. Caps the
   *  in-session re-drill so a card the user keeps rating Hard can't be
   *  re-queued forever – without it the queue grows exactly as fast as the
   *  index advances and the session never reaches its end. */
  sessionShows?: Record<string, number>;
}

export type MasteryMap = Record<string, Partial<QuestCard>>;

export interface UserStats {
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

// Linear path node – a chunk of the main deck
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
// `variety` names the specific standard the deck teaches, shown small in
// the language pickers. Only set where a learner could be surprised —
// unmarked standards (German, French, Dutch…) stay unlabeled.
export const LANGUAGE_CONFIG: Record<Language, { name: string; code: string; bcp47: string; variety?: string }> = {
  spanish: { name: 'Spanish', code: 'ES', bcp47: 'es-MX', variety: 'Latin American' },
  italian: { name: 'Italian', code: 'IT', bcp47: 'it-IT' },
  german:  { name: 'German',  code: 'DE', bcp47: 'de-DE' },
  french:  { name: 'French',  code: 'FR', bcp47: 'fr-FR' },
  portuguese: { name: 'Portuguese', code: 'PT', bcp47: 'pt-BR', variety: 'Brazilian' },
  dutch: { name: 'Dutch', code: 'NL', bcp47: 'nl-NL' },
  swedish: { name: 'Swedish', code: 'SV', bcp47: 'sv-SE' },
  welsh: { name: 'Welsh', code: 'CY', bcp47: 'cy-GB' },
  hindi: { name: 'Hindi', code: 'HI', bcp47: 'hi-IN' },
  turkish: { name: 'Turkish', code: 'TR', bcp47: 'tr-TR' },
  russian: { name: 'Russian', code: 'RU', bcp47: 'ru-RU' },
  indonesian: { name: 'Indonesian', code: 'ID', bcp47: 'id-ID' },
  greek: { name: 'Greek', code: 'EL', bcp47: 'el-GR' },
  korean: { name: 'Korean', code: 'KO', bcp47: 'ko-KR' },
  japanese: { name: 'Japanese', code: 'JA', bcp47: 'ja-JP' },
  // Private gift deck – Spanish variant, hidden unless unlocked (see App.tsx GIFT_*).
  mum: { name: 'Pour Maman', code: 'ES', bcp47: 'es-MX', variety: 'Latin American' },
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

// ── Favorites ───────────────────────────────────────────────
/** A favorite can be a single word (kind 'vocab' or undefined for legacy
 *  entries), a card-level grammar tip ('grammar'), or a word-level etymology
 *  fact ('etymology'). The fields used depend on the kind:
 *
 *    vocab     → translation, ipa?, pos?, lemma?, example?
 *    grammar   → grammarTip, example? (card target so user remembers the
 *                sentence the tip was attached to)
 *    etymology → etymologyOrigin, etymologyNote, etymologyCognates?,
 *                etymologySources?, example?
 *
 *  All three kinds share `word` (the human label – the saved word for vocab
 *  and etymology, a short snippet for grammar) and `savedAt`. */
export interface FavoriteEntry {
  word: string;
  kind?: 'vocab' | 'grammar' | 'etymology';  // undefined = vocab (legacy)
  translation?: string;
  ipa?: string;
  pos?: string;
  lemma?: string;
  example?: string;
  // Grammar fields
  grammarTip?: string;
  // Etymology fields
  etymologyOrigin?: string;
  etymologyNote?: string;
  etymologyCognates?: string[];
  etymologySources?: string[];
  savedAt: number;
}

export type FavoriteMap = Record<string, FavoriteEntry>;

// ── Conjugation ─────────────────────────────────────────────
export interface ConjugationTable {
  infinitive: string;
  isReflexive: boolean;
  tenses: Record<string, string[]>; // tense name → [yo, tú, él, nosotros, vosotros, ellos]
}
