import { TierDef } from '../types';

// 1,718 cards total, split into 4 tiers × 2 main topics
// Cards are roughly ordered by difficulty in deck.json
// Side branches exist in UI but have 0 cards (placeholders for future content)

const CARDS_PER_TIER = 430;
const CARDS_PER_TOPIC = 215;

export const SKILL_TREE: TierDef[] = [
  {
    tier: 'Novice',
    color: '#22c55e',
    mainTopics: [
      { id: 'novice-part-1', name: 'Part 1', cardSlice: [0, CARDS_PER_TOPIC] },
      { id: 'novice-part-2', name: 'Part 2', cardSlice: [CARDS_PER_TOPIC, CARDS_PER_TIER] },
    ],
    sideLeft: {
      title: 'Greetings',
      topics: [
        { id: 'greetings-a', name: 'Intro A', cardSlice: [-1, -1] },
      ],
    },
    sideRight: {
      title: 'Numbers',
      topics: [
        { id: 'numbers-a', name: 'Count A', cardSlice: [-1, -1] },
      ],
    },
  },
  {
    tier: 'Beginner',
    color: '#3b82f6',
    mainTopics: [
      { id: 'beginner-part-1', name: 'Part 1', cardSlice: [CARDS_PER_TIER, CARDS_PER_TIER + CARDS_PER_TOPIC] },
      { id: 'beginner-part-2', name: 'Part 2', cardSlice: [CARDS_PER_TIER + CARDS_PER_TOPIC, CARDS_PER_TIER * 2] },
    ],
    sideLeft: {
      title: 'Hospital',
      topics: [
        { id: 'hospital-a', name: 'Med A', cardSlice: [-1, -1] },
      ],
    },
    sideRight: {
      title: 'Dining',
      topics: [
        { id: 'restaurant-a', name: 'Rest A', cardSlice: [-1, -1] },
      ],
    },
  },
  {
    tier: 'Intermediate',
    color: '#f59e0b',
    mainTopics: [
      { id: 'intermediate-part-1', name: 'Part 1', cardSlice: [CARDS_PER_TIER * 2, CARDS_PER_TIER * 2 + CARDS_PER_TOPIC] },
      { id: 'intermediate-part-2', name: 'Part 2', cardSlice: [CARDS_PER_TIER * 2 + CARDS_PER_TOPIC, CARDS_PER_TIER * 3] },
    ],
    sideLeft: {
      title: 'Travel',
      topics: [
        { id: 'travel-a', name: 'Flight', cardSlice: [-1, -1] },
        { id: 'travel-b', name: 'Transit', cardSlice: [-1, -1] },
      ],
    },
    sideRight: {
      title: 'Family',
      topics: [
        { id: 'family-a', name: 'General 1', cardSlice: [-1, -1] },
        { id: 'family-b', name: 'General 2', cardSlice: [-1, -1] },
      ],
    },
  },
  {
    tier: 'Advanced',
    color: '#ef4444',
    mainTopics: [
      { id: 'advanced-part-1', name: 'Part 1', cardSlice: [CARDS_PER_TIER * 3, CARDS_PER_TIER * 3 + CARDS_PER_TOPIC] },
      { id: 'advanced-part-2', name: 'Part 2', cardSlice: [CARDS_PER_TIER * 3 + CARDS_PER_TOPIC, 1718] },
    ],
    sideLeft: {
      title: 'Corporate',
      topics: [
        { id: 'corp-a', name: 'Management', cardSlice: [-1, -1] },
        { id: 'corp-b', name: 'Legal', cardSlice: [-1, -1] },
      ],
    },
    sideRight: {
      title: 'Literature',
      topics: [
        { id: 'lit-a', name: 'Prose', cardSlice: [-1, -1] },
        { id: 'lit-b', name: 'Realism', cardSlice: [-1, -1] },
      ],
    },
  },
];

// Flatten all topics with cards for lookup
export const ALL_TOPICS = SKILL_TREE.flatMap(tier => {
  const topics = [...tier.mainTopics];
  if (tier.sideLeft) topics.push(...tier.sideLeft.topics);
  if (tier.sideRight) topics.push(...tier.sideRight.topics);
  return topics.map(t => ({ ...t, tier: tier.tier, color: tier.color }));
});

// Unlock threshold: 70% mastery in a tier to unlock the next
export const UNLOCK_THRESHOLD = 0.7;
