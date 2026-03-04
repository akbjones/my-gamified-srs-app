import { PathNode, SideBranch } from '../types';

// 2,000 cards total → 20 nodes of 100 cards each
// Cards ordered by difficulty in deck.json
// Each node is a gate on the single main deck

const N = 100; // cards per node

export const MAIN_PATH: PathNode[] = [
  // Tier 1 — Novice (nodes 1-5, cards 0-499)
  { id: 'node-01', name: 'First Words',       cardSlice: [0, N],         tier: 'Novice',       color: '#22c55e' },
  { id: 'node-02', name: 'Daily Routine',     cardSlice: [N, N * 2],     tier: 'Novice',       color: '#22c55e' },
  { id: 'node-03', name: 'Numbers & Time',    cardSlice: [N * 2, N * 3], tier: 'Novice',       color: '#22c55e' },
  { id: 'node-04', name: 'People & Family',   cardSlice: [N * 3, N * 4], tier: 'Novice',       color: '#22c55e' },
  { id: 'node-05', name: 'Around the House',  cardSlice: [N * 4, N * 5], tier: 'Novice',       color: '#22c55e' },

  // Tier 2 — Beginner (nodes 6-10, cards 500-999)
  { id: 'node-06', name: 'Food & Dining',     cardSlice: [N * 5, N * 6],   tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-07', name: 'Getting Around',    cardSlice: [N * 6, N * 7],   tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-08', name: 'Shopping & Money',  cardSlice: [N * 7, N * 8],   tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-09', name: 'Weather & Nature',  cardSlice: [N * 8, N * 9],   tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-10', name: 'Work & School',     cardSlice: [N * 9, N * 10],  tier: 'Beginner',     color: '#3b82f6' },

  // Tier 3 — Intermediate (nodes 11-15, cards 1000-1499)
  { id: 'node-11', name: 'Health & Body',     cardSlice: [N * 10, N * 11], tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-12', name: 'Opinions & Emotions', cardSlice: [N * 11, N * 12], tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-13', name: 'Past Narratives',   cardSlice: [N * 12, N * 13], tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-14', name: 'Future & Plans',    cardSlice: [N * 13, N * 14], tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-15', name: 'Communication',     cardSlice: [N * 14, N * 15], tier: 'Intermediate', color: '#f59e0b' },

  // Tier 4 — Advanced (nodes 16-20, cards 1500-1999)
  { id: 'node-16', name: 'Society & News',    cardSlice: [N * 15, N * 16], tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-17', name: 'Culture & Travel',  cardSlice: [N * 16, N * 17], tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-18', name: 'Professional Life', cardSlice: [N * 17, N * 18], tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-19', name: 'Abstract Ideas',    cardSlice: [N * 18, N * 19], tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-20', name: 'Mastery',           cardSlice: [N * 19, N * 20], tier: 'Advanced',     color: '#ef4444' },
];

export const SIDE_BRANCHES: SideBranch[] = [
  { id: 'side-greetings',  name: 'Greetings',  icon: '👋', cards: null, unlocksAtNode: 'node-01' },
  { id: 'side-numbers',    name: 'Numbers',     icon: '#',  cards: null, unlocksAtNode: 'node-03' },
  { id: 'side-restaurant', name: 'Dining',      icon: '🍽', cards: null, unlocksAtNode: 'node-06' },
  { id: 'side-hospital',   name: 'Medical',     icon: '+',  cards: null, unlocksAtNode: 'node-11' },
  { id: 'side-travel',     name: 'Travel',      icon: '✈',  cards: null, unlocksAtNode: 'node-17' },
  { id: 'side-family',     name: 'Family',      icon: '♥',  cards: null, unlocksAtNode: 'node-04' },
  { id: 'side-corporate',  name: 'Business',    icon: '◆',  cards: null, unlocksAtNode: 'node-18' },
  { id: 'side-literature', name: 'Literature',  icon: '▪',  cards: null, unlocksAtNode: 'node-19' },
];

// 70% progress on a node to unlock the next
export const UNLOCK_THRESHOLD = 0.7;

// Helper: check if a node is unlocked
export const isNodeUnlocked = (nodeIndex: number, cards: { topic: string; mastery: number }[]): boolean => {
  if (nodeIndex === 0) return true;
  const prevNode = MAIN_PATH[nodeIndex - 1];
  const prevCards = cards.filter(c => c.topic === prevNode.id);
  if (prevCards.length === 0) return false;
  const graduated = prevCards.filter(c => c.mastery === 2).length;
  return (graduated / prevCards.length) >= UNLOCK_THRESHOLD;
};
