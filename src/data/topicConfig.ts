import { PathNode, SideBranch } from '../types';

// 20 grammar-progression nodes mapped to CEFR levels.
// Node names are language-specific (these are for Spanish).
// Cards are assigned to nodes dynamically in buildDeck() based on
// the filtered deck size, NOT via hardcoded slices.

export const MAIN_PATH: PathNode[] = [
  // Tier 1 — A1 (nodes 1-5)
  { id: 'node-01', name: 'Present Tense',         tier: 'A1',  color: '#22c55e' },
  { id: 'node-02', name: 'Ser vs Estar',           tier: 'A1',  color: '#22c55e' },
  { id: 'node-03', name: 'Common Questions',       tier: 'A1',  color: '#22c55e' },
  { id: 'node-04', name: 'Articles & Gender',      tier: 'A1',  color: '#22c55e' },
  { id: 'node-05', name: 'Gustar & Similar',       tier: 'A1',  color: '#22c55e' },

  // Tier 2 — A2 (nodes 6-10)
  { id: 'node-06', name: 'Preterite',              tier: 'A2',  color: '#3b82f6' },
  { id: 'node-07', name: 'Imperfect',              tier: 'A2',  color: '#3b82f6' },
  { id: 'node-08', name: 'Reflexive Verbs',        tier: 'A2',  color: '#3b82f6' },
  { id: 'node-09', name: 'Por vs Para',            tier: 'A2',  color: '#3b82f6' },
  { id: 'node-10', name: 'Object Pronouns',        tier: 'A2',  color: '#3b82f6' },

  // Tier 3 — B1 (nodes 11-15)
  { id: 'node-11', name: 'Present Subjunctive',    tier: 'B1',  color: '#f59e0b' },
  { id: 'node-12', name: 'Commands',               tier: 'B1',  color: '#f59e0b' },
  { id: 'node-13', name: 'Conditional',            tier: 'B1',  color: '#f59e0b' },
  { id: 'node-14', name: 'Future & Compound',      tier: 'B1',  color: '#f59e0b' },
  { id: 'node-15', name: 'Relative Clauses',       tier: 'B1',  color: '#f59e0b' },

  // Tier 4 — B2+ (nodes 16-20)
  { id: 'node-16', name: 'Imperfect Subjunctive',  tier: 'B2',  color: '#ef4444' },
  { id: 'node-17', name: 'Conditionals II & III',  tier: 'B2',  color: '#ef4444' },
  { id: 'node-18', name: 'Passive & Impersonal',   tier: 'B2',  color: '#ef4444' },
  { id: 'node-19', name: 'Advanced Connectors',    tier: 'B2',  color: '#ef4444' },
  { id: 'node-20', name: 'Mastery',                tier: 'B2',  color: '#ef4444' },
];

export const SIDE_BRANCHES: SideBranch[] = [
  { id: 'side-greetings',  name: 'Greetings',  icon: '--', cards: null, unlocksAtNode: 'node-01' },
  { id: 'side-numbers',    name: 'Numbers',     icon: '#',  cards: null, unlocksAtNode: 'node-03' },
  { id: 'side-restaurant', name: 'Dining',      icon: '--', cards: null, unlocksAtNode: 'node-06' },
  { id: 'side-hospital',   name: 'Medical',     icon: '+',  cards: null, unlocksAtNode: 'node-11' },
  { id: 'side-travel',     name: 'Travel',      icon: '>>',  cards: null, unlocksAtNode: 'node-06' },
  { id: 'side-family',     name: 'Family',      icon: '*',  cards: null, unlocksAtNode: 'node-04' },
  { id: 'side-corporate',  name: 'Business',    icon: '::',  cards: null, unlocksAtNode: 'node-14' },
  { id: 'side-literature', name: 'Literature',  icon: '[]',  cards: null, unlocksAtNode: 'node-19' },
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
