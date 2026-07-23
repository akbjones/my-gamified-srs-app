/**
 * Deck-free starter machinery. starterDecks.ts (Spanish) and
 * japaneseStarter.ts both build on this — it must NEVER import a deck,
 * or every starter chunk drags every other starter's deck into its
 * dependency graph (loading ?starter=ja fetched the 1.2MB Spanish deck
 * until this split).
 */
import type { LearningGoal } from '../types';

/** Theme tags used by starter decks (content themes, not goal audiences). */
export type StarterTheme =
  | 'travel'
  | 'family'
  | 'food'
  | 'work'
  | 'directions'
  | 'daily life'
  | 'emotions'
  | 'time'
  | 'opinions';

/**
 * Shape of a raw main-deck card (as stored in src/data/<lang>/deck.json),
 * i.e. the input shape that App.tsx's `buildDeck` transforms into QuestCard.
 */
export interface RawDeckCard {
  id: string;
  /** TTS-ready target-language sentence (audio was generated from this). */
  target: string;
  english: string;
  /** Pre-tokenized target for unspaced scripts (Japanese) — see QuestCard.tokens. */
  tokens?: { t: string; r?: string }[];
  /** mp3 filename, e.g. "es-es-0001.mp3" — unchanged from the main deck. */
  audio: string;
  /** Goal-audience tags from the main deck (general/travel/work/family). */
  tags: LearningGoal[];
  /** Grammar node "node-01".."node-35"; see grammarDescriptions.ts. */
  grammarNode: string;
  /** Optional short learner note. */
  grammar?: string;
  /** Main-deck priority rank (lower = more practical). */
  priority: number;
}

/** A starter-deck card: a verbatim main-deck card plus starter ordering. */
export interface StarterCard extends RawDeckCard {
  /** 1-based graded position in the starter progression. */
  starterSeq: number;
  /** Content themes derived from the sentence (1-3 per card). */
  themes: StarterTheme[];
}

/** Curation manifest entry: which main-deck card, at what graded position. */
export interface StarterManifestEntry {
  id: string;
  starterSeq: number;
  themes: StarterTheme[];
}

/**
 * Hydrate a starter deck from its main deck + curation manifest. Cards
 * removed from the main deck are dropped rather than shown stale.
 */
export function buildStarter(mainDeck: RawDeckCard[], manifest: StarterManifestEntry[]): StarterCard[] {
  const byId = new Map(mainDeck.map(c => [c.id, c]));
  return manifest
    .map(m => {
      const card = byId.get(m.id);
      return card ? { ...card, starterSeq: m.starterSeq, themes: m.themes } : null;
    })
    .filter((c): c is StarterCard => c !== null)
    .sort((a, b) => a.starterSeq - b.starterSeq);
}
