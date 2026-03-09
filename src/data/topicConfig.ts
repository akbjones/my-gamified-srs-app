import { PathNode, SideBranch } from '../types';

// 26 grammar-progression nodes mapped to CEFR levels (A1→C2).
// Node names are language-specific (these are for Spanish).
// Cards are assigned to nodes dynamically in buildDeck() based on
// the filtered deck size, NOT via hardcoded slices.

export const MAIN_PATH: PathNode[] = [
  // Tier 1 — A1 (nodes 1-5)
  { id: 'node-01', name: 'Present tense',          tier: 'A1',  color: '#22c55e' },
  { id: 'node-02', name: 'Ser vs estar',            tier: 'A1',  color: '#22c55e' },
  { id: 'node-03', name: 'Common questions',        tier: 'A1',  color: '#22c55e' },
  { id: 'node-04', name: 'Articles & gender',       tier: 'A1',  color: '#22c55e' },
  { id: 'node-05', name: 'Gustar & similar',        tier: 'A1',  color: '#22c55e' },

  // Tier 2 — A2 (nodes 6-10)
  { id: 'node-06', name: 'Preterite',               tier: 'A2',  color: '#3b82f6' },
  { id: 'node-07', name: 'Imperfect',               tier: 'A2',  color: '#3b82f6' },
  { id: 'node-08', name: 'Reflexive verbs',         tier: 'A2',  color: '#3b82f6' },
  { id: 'node-09', name: 'Por vs para',             tier: 'A2',  color: '#3b82f6' },
  { id: 'node-10', name: 'Object pronouns',         tier: 'A2',  color: '#3b82f6' },

  // Tier 3 — B1 (nodes 11-15)
  { id: 'node-11', name: 'Present subjunctive',     tier: 'B1',  color: '#f59e0b' },
  { id: 'node-12', name: 'Commands',                tier: 'B1',  color: '#f59e0b' },
  { id: 'node-13', name: 'Conditional',             tier: 'B1',  color: '#f59e0b' },
  { id: 'node-14', name: 'Future & perfect',         tier: 'B1',  color: '#f59e0b' },
  { id: 'node-15', name: 'Relative clauses',        tier: 'B1',  color: '#f59e0b' },

  // Tier 4 — B2 (nodes 16-20)
  { id: 'node-16', name: 'Imperfect subjunctive',   tier: 'B2',  color: '#ef4444' },
  { id: 'node-17', name: 'Complex conditionals',    tier: 'B2',  color: '#ef4444' },
  { id: 'node-18', name: 'Passive & impersonal',    tier: 'B2',  color: '#ef4444' },
  { id: 'node-19', name: 'Advanced connectors',     tier: 'B2',  color: '#ef4444' },
  { id: 'node-20', name: 'Mixed advanced',          tier: 'B2',  color: '#ef4444' },

  // Tier 5 — C1 (nodes 21-23)
  { id: 'node-21', name: 'Subjunctive nuances',     tier: 'C1',  color: '#8b5cf6' },
  { id: 'node-22', name: 'Verb phrases',              tier: 'C1',  color: '#8b5cf6' },
  { id: 'node-23', name: 'Reported speech',          tier: 'C1',  color: '#8b5cf6' },

  // Tier 6 — C2 (nodes 24-26)
  { id: 'node-24', name: 'Register & style',         tier: 'C2',  color: '#6366f1' },
  { id: 'node-25', name: 'Idiomatic fluency',        tier: 'C2',  color: '#6366f1' },
  { id: 'node-26', name: 'Complex syntax',            tier: 'C2',  color: '#6366f1' },
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
