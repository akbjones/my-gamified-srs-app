export interface QuestCard {
  id: string;
  target: string;
  english: string;
  category: string; // tier name for theming: "Novice", "Beginner", etc.
  topic: string;    // node ID: "node-01", "node-02", etc.
  audio: string;
  mastery: number; // 0=New, 1=Learning, 2=Graduated
  step?: number;
  dueDate?: number;
  interval?: number;
  ease?: number;
}

export interface SessionState {
  language: string;
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
  cardSlice: [number, number];
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
