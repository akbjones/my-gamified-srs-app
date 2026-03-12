import { Achievement, UserStats, MasteryMap, QuestCard } from '../types';

const RETENTION_THRESHOLD = 21 * 24 * 60 * 60 * 1000; // 21 days

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-steps',
    title: 'Hydrogen',
    description: 'Complete your first review session',
    icon: 'H',
    unlocked: false,
    condition: (stats: UserStats) => stats.totalReviews >= 1,
  },
  {
    id: 'streak-3',
    title: 'Helium',
    description: 'Maintain a 3-day streak',
    icon: 'He',
    unlocked: false,
    condition: (stats: UserStats) => stats.streak >= 3,
  },
  {
    id: 'streak-7',
    title: 'Carbon',
    description: 'Maintain a 7-day streak',
    icon: 'C',
    unlocked: false,
    condition: (stats: UserStats) => stats.streak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Neon',
    description: 'Maintain a 30-day streak',
    icon: 'Ne',
    unlocked: false,
    condition: (stats: UserStats) => stats.streak >= 30,
  },
  {
    id: 'century',
    title: 'Silicon',
    description: 'Complete 100 reviews',
    icon: 'Si',
    unlocked: false,
    condition: (stats: UserStats) => stats.totalReviews >= 100,
  },
  {
    id: 'millennium',
    title: 'Iron',
    description: 'Complete 1,000 reviews',
    icon: 'Fe',
    unlocked: false,
    condition: (stats: UserStats) => stats.totalReviews >= 1000,
  },
  {
    id: 'first-experiment',
    title: 'Copper',
    description: 'Win your first experiment (boss battle)',
    icon: 'Cu',
    unlocked: false,
    condition: (stats: UserStats) => stats.cardsLearned >= 50,
  },
  {
    id: 'recall-90',
    title: 'Silver',
    description: 'Achieve 90%+ recall with 20+ graduated cards',
    icon: 'Ag',
    unlocked: false,
    condition: (_stats: UserStats, _masteryMap: MasteryMap, deck: QuestCard[]) => {
      const graduated = deck.filter(c => c.mastery === 2);
      if (graduated.length < 20) return false;
      const retained = graduated.filter(c => (c.interval || 0) >= RETENTION_THRESHOLD).length;
      return (retained / graduated.length) >= 0.9;
    },
  },
  {
    id: 'cards-50',
    title: 'Tin',
    description: 'Learn 50 cards',
    icon: 'Sn',
    unlocked: false,
    condition: (stats: UserStats) => stats.cardsLearned >= 50,
  },
  {
    id: 'cards-200',
    title: 'Gold',
    description: 'Learn 200 cards',
    icon: 'Au',
    unlocked: false,
    condition: (stats: UserStats) => stats.cardsLearned >= 200,
  },
  {
    id: 'cards-500',
    title: 'Lead',
    description: 'Learn 500 cards',
    icon: 'Pb',
    unlocked: false,
    condition: (stats: UserStats) => stats.cardsLearned >= 500,
  },
  {
    id: 'cards-1000',
    title: 'Nobelium',
    description: 'Learn 1,000 cards',
    icon: 'No',
    unlocked: false,
    condition: (stats: UserStats) => stats.cardsLearned >= 1000,
  },
];
