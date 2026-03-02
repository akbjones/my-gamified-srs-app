import { PathNode, SideBranch } from '../types';

// 1,718 cards total → 20 nodes of ~86 cards each
// Cards are roughly ordered by difficulty in deck.json
// Each node is a gate on the single main deck

const N = 86; // cards per node (last node gets remainder)

export const MAIN_PATH: PathNode[] = [
  // Novice tier (nodes 1-5, cards 0-429)
  { id: 'node-01', name: 'First Words',      cardSlice: [0, N],         tier: 'Novice',       color: '#22c55e' },
  { id: 'node-02', name: 'Common Phrases',   cardSlice: [N, N * 2],     tier: 'Novice',       color: '#22c55e' },
  { id: 'node-03', name: 'Simple Questions', cardSlice: [N * 2, N * 3], tier: 'Novice',       color: '#22c55e', sideBranchIds: ['side-greetings'] },
  { id: 'node-04', name: 'Daily Basics',     cardSlice: [N * 3, N * 4], tier: 'Novice',       color: '#22c55e' },
  { id: 'node-05', name: 'Core Vocabulary',  cardSlice: [N * 4, N * 5], tier: 'Novice',       color: '#22c55e', sideBranchIds: ['side-numbers'] },

  // Beginner tier (nodes 6-10, cards 430-859)
  { id: 'node-06', name: 'Descriptions',     cardSlice: [N * 5, N * 6],   tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-07', name: 'Past Tense',       cardSlice: [N * 6, N * 7],   tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-08', name: 'Directions',       cardSlice: [N * 7, N * 8],   tier: 'Beginner',     color: '#3b82f6', sideBranchIds: ['side-restaurant'] },
  { id: 'node-09', name: 'Conversations',    cardSlice: [N * 8, N * 9],   tier: 'Beginner',     color: '#3b82f6', sideBranchIds: ['side-hospital'] },
  { id: 'node-10', name: 'Practical Skills', cardSlice: [N * 9, N * 10],  tier: 'Beginner',     color: '#3b82f6' },

  // Intermediate tier (nodes 11-15, cards 860-1289)
  { id: 'node-11', name: 'Opinions',         cardSlice: [N * 10, N * 11], tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-12', name: 'Storytelling',     cardSlice: [N * 11, N * 12], tier: 'Intermediate', color: '#f59e0b', sideBranchIds: ['side-travel'] },
  { id: 'node-13', name: 'Abstract Ideas',   cardSlice: [N * 12, N * 13], tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-14', name: 'Comparisons',      cardSlice: [N * 13, N * 14], tier: 'Intermediate', color: '#f59e0b', sideBranchIds: ['side-family'] },
  { id: 'node-15', name: 'Complex Grammar',  cardSlice: [N * 14, N * 15], tier: 'Intermediate', color: '#f59e0b' },

  // Advanced tier (nodes 16-20, cards 1290-1718)
  { id: 'node-16', name: 'Nuance',           cardSlice: [N * 15, N * 16], tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-17', name: 'Idioms',           cardSlice: [N * 16, N * 17], tier: 'Advanced',     color: '#ef4444', sideBranchIds: ['side-corporate'] },
  { id: 'node-18', name: 'Formal Speech',    cardSlice: [N * 17, N * 18], tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-19', name: 'Cultural Depth',   cardSlice: [N * 18, N * 19], tier: 'Advanced',     color: '#ef4444', sideBranchIds: ['side-literature'] },
  { id: 'node-20', name: 'Mastery',          cardSlice: [N * 19, 1718],   tier: 'Advanced',     color: '#ef4444' },
];

export const SIDE_BRANCHES: SideBranch[] = [
  { id: 'side-greetings',  name: 'Greetings',  icon: '👋', cards: null, unlocksAtNode: 'node-03' },
  { id: 'side-numbers',    name: 'Numbers',     icon: '#',  cards: null, unlocksAtNode: 'node-05' },
  { id: 'side-restaurant', name: 'Dining',      icon: '🍽', cards: null, unlocksAtNode: 'node-08' },
  { id: 'side-hospital',   name: 'Medical',     icon: '+',  cards: null, unlocksAtNode: 'node-09' },
  { id: 'side-travel',     name: 'Travel',      icon: '✈',  cards: null, unlocksAtNode: 'node-12' },
  { id: 'side-family',     name: 'Family',      icon: '♥',  cards: null, unlocksAtNode: 'node-14' },
  { id: 'side-corporate',  name: 'Business',    icon: '◆',  cards: null, unlocksAtNode: 'node-17' },
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
