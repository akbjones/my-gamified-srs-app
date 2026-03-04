import { PathNode, SideBranch } from '../types';

// 20 thematic nodes — same structure for all languages.
// Cards are assigned to nodes dynamically in buildDeck() based on
// the filtered deck size, NOT via hardcoded slices.

export const MAIN_PATH: PathNode[] = [
  // Tier 1 — Novice (nodes 1-5)
  { id: 'node-01', name: 'First Words',       tier: 'Novice',       color: '#22c55e' },
  { id: 'node-02', name: 'Daily Routine',     tier: 'Novice',       color: '#22c55e' },
  { id: 'node-03', name: 'Numbers & Time',    tier: 'Novice',       color: '#22c55e' },
  { id: 'node-04', name: 'People & Family',   tier: 'Novice',       color: '#22c55e' },
  { id: 'node-05', name: 'Around the House',  tier: 'Novice',       color: '#22c55e' },

  // Tier 2 — Beginner (nodes 6-10)
  { id: 'node-06', name: 'Food & Dining',     tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-07', name: 'Getting Around',    tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-08', name: 'Shopping & Money',  tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-09', name: 'Weather & Nature',  tier: 'Beginner',     color: '#3b82f6' },
  { id: 'node-10', name: 'Work & School',     tier: 'Beginner',     color: '#3b82f6' },

  // Tier 3 — Intermediate (nodes 11-15)
  { id: 'node-11', name: 'Health & Body',     tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-12', name: 'Opinions & Emotions', tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-13', name: 'Past Narratives',   tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-14', name: 'Future & Plans',    tier: 'Intermediate', color: '#f59e0b' },
  { id: 'node-15', name: 'Communication',     tier: 'Intermediate', color: '#f59e0b' },

  // Tier 4 — Advanced (nodes 16-20)
  { id: 'node-16', name: 'Society & News',    tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-17', name: 'Culture & Travel',  tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-18', name: 'Professional Life', tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-19', name: 'Abstract Ideas',    tier: 'Advanced',     color: '#ef4444' },
  { id: 'node-20', name: 'Mastery',           tier: 'Advanced',     color: '#ef4444' },
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
