export interface QuestCard {
  id: string;
  target: string;
  english: string;
  category: string;
  topic: string;
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

export interface TopicDef {
  id: string;
  name: string;
  cardSlice: [number, number]; // start, end indices
}

export interface TierDef {
  tier: string;
  color: string;
  mainTopics: TopicDef[];
  sideLeft?: { title: string; topics: TopicDef[] };
  sideRight?: { title: string; topics: TopicDef[] };
}
