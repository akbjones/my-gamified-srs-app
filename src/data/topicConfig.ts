import { PathNode, SideBranch, Language } from '../types';

// 35 grammar-progression nodes mapped to CEFR levels (A1→C2).
// Node names are language-specific — see NODE_NAMES below.
// MAIN_PATH.name holds the English defaults; use getNodeName() for display.
// Cards are assigned to nodes via the grammarNode field in deck.json.

export const MAIN_PATH: PathNode[] = [
  // ── A1 — Foundations (8 nodes) ──────────────────────────────
  { id: 'node-01', name: 'Regular present tense',       tier: 'A1', color: '#22c55e' },
  { id: 'node-02', name: 'Irregular present verbs',     tier: 'A1', color: '#22c55e' },
  { id: 'node-03', name: 'Ser/Essere vs Estar/Stare',   tier: 'A1', color: '#22c55e' },
  { id: 'node-04', name: 'Questions & interrogatives',  tier: 'A1', color: '#22c55e' },
  { id: 'node-05', name: 'Articles, gender & agreement', tier: 'A1', color: '#22c55e' },
  { id: 'node-06', name: 'Gustar/Piacere & reverse verbs', tier: 'A1', color: '#22c55e' },
  { id: 'node-07', name: 'Descriptions & adjectives',   tier: 'A1', color: '#22c55e' },
  { id: 'node-08', name: 'Common expressions',          tier: 'A1', color: '#22c55e' },

  // ── A2 — Past & Pronouns (7 nodes) ─────────────────────────
  { id: 'node-09', name: 'Past tense: regular',         tier: 'A2', color: '#3b82f6' },
  { id: 'node-10', name: 'Past tense: irregular',       tier: 'A2', color: '#3b82f6' },
  { id: 'node-11', name: 'Imperfect tense',             tier: 'A2', color: '#3b82f6' },
  { id: 'node-12', name: 'Past contrast',               tier: 'A2', color: '#3b82f6' },
  { id: 'node-13', name: 'Reflexive verbs',             tier: 'A2', color: '#3b82f6' },
  { id: 'node-14', name: 'Prepositions',                tier: 'A2', color: '#3b82f6' },
  { id: 'node-15', name: 'Object pronouns',             tier: 'A2', color: '#3b82f6' },

  // ── B1 — Moods & Complex Tenses (6 nodes) ──────────────────
  { id: 'node-16', name: 'Present subjunctive',         tier: 'B1', color: '#f59e0b' },
  { id: 'node-17', name: 'Imperative / commands',       tier: 'B1', color: '#f59e0b' },
  { id: 'node-18', name: 'Conditional',                 tier: 'B1', color: '#f59e0b' },
  { id: 'node-19', name: 'Future tense',                tier: 'B1', color: '#f59e0b' },
  { id: 'node-20', name: 'Relative clauses',            tier: 'B1', color: '#f59e0b' },
  { id: 'node-21', name: 'Perfect & compound tenses',   tier: 'B1', color: '#f59e0b' },

  // ── B2 — Advanced Grammar (6 nodes) ────────────────────────
  { id: 'node-22', name: 'Imperfect subjunctive',       tier: 'B2', color: '#ef4444' },
  { id: 'node-23', name: 'Complex conditionals',        tier: 'B2', color: '#ef4444' },
  { id: 'node-24', name: 'Passive & impersonal',        tier: 'B2', color: '#ef4444' },
  { id: 'node-25', name: 'Advanced connectors',         tier: 'B2', color: '#ef4444' },
  { id: 'node-26', name: 'Verb phrases & periphrasis',  tier: 'B2', color: '#ef4444' },
  { id: 'node-27', name: 'Reported speech',             tier: 'B2', color: '#ef4444' },

  // ── C1 — Refinement (4 nodes) ──────────────────────────────
  { id: 'node-28', name: 'Subjunctive nuances',         tier: 'C1', color: '#8b5cf6' },
  { id: 'node-29', name: 'Register & formal style',     tier: 'C1', color: '#8b5cf6' },
  { id: 'node-30', name: 'Idiomatic expressions',       tier: 'C1', color: '#8b5cf6' },
  { id: 'node-31', name: 'Complex syntax',              tier: 'C1', color: '#8b5cf6' },

  // ── C2 — Mastery (4 nodes) ─────────────────────────────────
  { id: 'node-32', name: 'Literary tenses & narrative',  tier: 'C2', color: '#6366f1' },
  { id: 'node-33', name: 'Academic discourse',           tier: 'C2', color: '#6366f1' },
  { id: 'node-34', name: 'Cultural fluency',             tier: 'C2', color: '#6366f1' },
  { id: 'node-35', name: 'Advanced mixed mastery',       tier: 'C2', color: '#6366f1' },
];

export const SIDE_BRANCHES: SideBranch[] = [
  { id: 'side-greetings',  name: 'Greetings',  icon: '--', cards: null, unlocksAtNode: 'node-01' },
  { id: 'side-numbers',    name: 'Numbers',     icon: '#',  cards: null, unlocksAtNode: 'node-04' },
  { id: 'side-restaurant', name: 'Dining',      icon: '--', cards: null, unlocksAtNode: 'node-09' },
  { id: 'side-hospital',   name: 'Medical',     icon: '+',  cards: null, unlocksAtNode: 'node-16' },
  { id: 'side-travel',     name: 'Travel',      icon: '>>',  cards: null, unlocksAtNode: 'node-09' },
  { id: 'side-family',     name: 'Family',      icon: '*',  cards: null, unlocksAtNode: 'node-05' },
  { id: 'side-corporate',  name: 'Business',    icon: '::',  cards: null, unlocksAtNode: 'node-19' },
  { id: 'side-literature', name: 'Literature',  icon: '[]',  cards: null, unlocksAtNode: 'node-25' },
];

// ── Per-language node names ────────────────────────────────────
// Keys not listed fall back to MAIN_PATH[].name (the English default).
export const NODE_NAMES: Partial<Record<Language, Record<string, string>>> = {
  spanish: {
    'node-01': 'Regular present tense',
    'node-02': 'Irregular present verbs',
    'node-03': 'Ser vs estar',
    'node-04': 'Common questions',
    'node-05': 'Articles & gender',
    'node-06': 'Gustar & similar',
    'node-07': 'Descriptions & adjectives',
    'node-08': 'Common expressions',
    'node-09': 'Preterite: regular',
    'node-10': 'Preterite: irregular',
    'node-11': 'Imperfect',
    'node-12': 'Past contrast',
    'node-13': 'Reflexive verbs',
    'node-14': 'Por vs para',
    'node-15': 'Object pronouns',
    'node-16': 'Present subjunctive',
    'node-17': 'Commands',
    'node-18': 'Conditional',
    'node-19': 'Future tense',
    'node-20': 'Relative clauses',
    'node-21': 'Perfect & compound tenses',
    'node-22': 'Imperfect subjunctive',
    'node-23': 'Complex conditionals',
    'node-24': 'Passive & impersonal',
    'node-25': 'Advanced connectors',
    'node-26': 'Verb phrases',
    'node-27': 'Reported speech',
    'node-28': 'Subjunctive nuances',
    'node-29': 'Register & style',
    'node-30': 'Idiomatic fluency',
    'node-31': 'Complex syntax',
    'node-32': 'Literary tenses',
    'node-33': 'Academic discourse',
    'node-34': 'Cultural fluency',
    'node-35': 'Advanced mastery',
  },
  italian: {
    'node-01': 'Regular present tense',
    'node-02': 'Irregular present verbs',
    'node-03': 'Essere vs stare',
    'node-04': 'Common questions',
    'node-05': 'Articles & gender',
    'node-06': 'Piacere & similar',
    'node-07': 'Descriptions & adjectives',
    'node-08': 'Common expressions',
    'node-09': 'Passato prossimo: regular',
    'node-10': 'Passato prossimo: irregular',
    'node-11': 'Imperfect',
    'node-12': 'Past contrast',
    'node-13': 'Reflexive verbs',
    'node-14': 'Per vs da',
    'node-15': 'Object pronouns',
    'node-16': 'Present subjunctive',
    'node-17': 'Commands',
    'node-18': 'Conditional',
    'node-19': 'Future tense',
    'node-20': 'Relative clauses',
    'node-21': 'Perfect & compound tenses',
    'node-22': 'Imperfect subjunctive',
    'node-23': 'Complex conditionals',
    'node-24': 'Passive & impersonal',
    'node-25': 'Advanced connectors',
    'node-26': 'Verb phrases',
    'node-27': 'Reported speech',
    'node-28': 'Subjunctive nuances',
    'node-29': 'Register & style',
    'node-30': 'Idiomatic fluency',
    'node-31': 'Complex syntax',
    'node-32': 'Literary tenses',
    'node-33': 'Academic discourse',
    'node-34': 'Cultural fluency',
    'node-35': 'Advanced mastery',
  },
  french: {
    'node-01': 'Regular present tense',
    'node-02': 'Irregular present verbs',
    'node-03': 'Être vs avoir',
    'node-04': 'Common questions',
    'node-05': 'Articles & gender',
    'node-06': 'Plaire & similar',
    'node-07': 'Descriptions & adjectives',
    'node-08': 'Common expressions',
    'node-09': 'Passé composé: regular',
    'node-10': 'Passé composé: irregular',
    'node-11': 'Imparfait',
    'node-12': 'Past contrast',
    'node-13': 'Reflexive verbs',
    'node-14': 'Pour vs par',
    'node-15': 'Object pronouns',
    'node-16': 'Present subjunctive',
    'node-17': 'Commands',
    'node-18': 'Conditional',
    'node-19': 'Future tense',
    'node-20': 'Relative clauses',
    'node-21': 'Perfect & compound tenses',
    'node-22': 'Imperfect subjunctive',
    'node-23': 'Complex conditionals',
    'node-24': 'Passive & impersonal',
    'node-25': 'Advanced connectors',
    'node-26': 'Verb phrases',
    'node-27': 'Reported speech',
    'node-28': 'Subjunctive nuances',
    'node-29': 'Register & style',
    'node-30': 'Idiomatic fluency',
    'node-31': 'Complex syntax',
    'node-32': 'Literary tenses',
    'node-33': 'Academic discourse',
    'node-34': 'Cultural fluency',
    'node-35': 'Advanced mastery',
  },
  portuguese: {
    'node-01': 'Regular present tense',
    'node-02': 'Irregular present verbs',
    'node-03': 'Ser vs estar',
    'node-04': 'Common questions',
    'node-05': 'Articles & gender',
    'node-06': 'Gostar & similar',
    'node-07': 'Descriptions & adjectives',
    'node-08': 'Common expressions',
    'node-09': 'Pretérito perfeito: regular',
    'node-10': 'Pretérito perfeito: irregular',
    'node-11': 'Pretérito imperfeito',
    'node-12': 'Past contrast',
    'node-13': 'Reflexive verbs',
    'node-14': 'Por vs para',
    'node-15': 'Object pronouns',
    'node-16': 'Present subjunctive',
    'node-17': 'Commands',
    'node-18': 'Conditional',
    'node-19': 'Future tense',
    'node-20': 'Relative clauses',
    'node-21': 'Perfect & compound tenses',
    'node-22': 'Imperfect subjunctive',
    'node-23': 'Complex conditionals',
    'node-24': 'Passive & impersonal',
    'node-25': 'Advanced connectors',
    'node-26': 'Verb phrases',
    'node-27': 'Reported speech',
    'node-28': 'Subjunctive nuances',
    'node-29': 'Register & style',
    'node-30': 'Idiomatic fluency',
    'node-31': 'Complex syntax',
    'node-32': 'Literary tenses',
    'node-33': 'Academic discourse',
    'node-34': 'Cultural fluency',
    'node-35': 'Advanced mastery',
  },
  german: {
    'node-01': 'Greetings & introductions',
    'node-02': 'Present tense regular verbs',
    'node-03': 'Sein vs haben',
    'node-04': 'Articles & gender (der/die/das)',
    'node-05': 'Word order (V2 rule)',
    'node-06': 'Accusative case',
    'node-07': 'Food, drink & ordering',
    'node-08': 'Separable verbs',
    'node-09': 'Perfekt (present perfect)',
    'node-10': 'Dative case',
    'node-11': 'Modal verbs',
    'node-12': 'Time & daily routine',
    'node-13': 'Negation (nicht vs kein)',
    'node-14': 'Wechselpräpositionen',
    'node-15': 'Pronouns & reflexive verbs',
    'node-16': 'Comparatives & superlatives',
    'node-17': 'Directions & transport',
    'node-18': 'Subordinate clauses (verb-final)',
    'node-19': 'Imperative',
    'node-20': 'Adjective endings',
    'node-21': 'Genitive case',
    'node-22': 'Relative clauses',
    'node-23': 'Passive voice',
    'node-24': 'Konjunktiv II',
    'node-25': 'Indirect speech (Konjunktiv I)',
    'node-26': 'Infinitive constructions',
    'node-27': 'Advanced connectors',
    'node-28': 'Noun compounds',
    'node-29': 'Extended adjective constructions',
    'node-30': 'Double infinitive & verb chains',
    'node-31': 'Formal writing & register',
    'node-32': 'Idiomatic expressions',
    'node-33': 'Advanced subjunctive',
    'node-34': 'Academic & professional German',
    'node-35': 'Nuance & modal particles',
  },
  // dutch / swedish: add when those languages get decks
};

/** Get the localized node name for a given language (falls back to MAIN_PATH.name). */
export function getNodeName(nodeId: string, lang: Language): string {
  return NODE_NAMES[lang]?.[nodeId]
    ?? MAIN_PATH.find(n => n.id === nodeId)?.name
    ?? '';
}

// 70% progress on a node to unlock the next
export const UNLOCK_THRESHOLD = 0.7;

// Helper: check if a node is unlocked
// Suspended cards are excluded from the denominator so leeches don't block progression
export const isNodeUnlocked = (nodeIndex: number, cards: { topic: string; mastery: number; isSuspended?: boolean }[]): boolean => {
  if (nodeIndex === 0) return true;
  const prevNode = MAIN_PATH[nodeIndex - 1];
  const prevCards = cards.filter(c => c.topic === prevNode.id && !c.isSuspended);
  if (prevCards.length === 0) return false;
  const graduated = prevCards.filter(c => c.mastery === 2).length;
  return (graduated / prevCards.length) >= UNLOCK_THRESHOLD;
};
