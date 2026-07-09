/**
 * Curated starter decks.
 *
 * A starter deck is a small, hand-graded SELECTION of cards from a language's
 * main deck — not new content. Every card is reused verbatim (same id, target,
 * english, audio, tags, grammarNode, grammar, priority), so existing audio
 * files, dictionary coverage, and the word popover keep working unchanged.
 * Each card gains two starter-only fields:
 *
 *   - `starterSeq` (1..300): graded position. Difficulty rises gradually:
 *       seq   1-50   very approachable present-tense basics (nodes 01-08)
 *       seq  51-150  past tenses, reflexives, por/para, object pronouns
 *       seq 151-250  subjunctive, commands, conditional/future, connectors
 *       seq 251-300  simple native-style sentences (idioms, complex syntax)
 *   - `themes`: content-derived theme tags (food, directions, daily life,
 *       emotions, time, opinions, travel, family, work). These are richer
 *       than the goal-audience `tags` field and are NOT LearningGoal values.
 *
 * The deck lives in src/data/spanish-starter-deck.json and was curated by
 * grammar-node progression + sentence length + theme balancing (see
 * docs/spanish-starter-deck-qa.md for the full methodology and QA report).
 *
 * INTEGRATION HOOK (future work — the app currently has one deck per
 * language): a "starter deck" toggle would hook into App.tsx where
 * `DECK_MAP[lang]` is read inside the deck-loading useEffect (~line 261).
 * When the toggle is on for Spanish, pass SPANISH_STARTER (already ordered
 * by starterSeq) to `buildDeck(...)` instead of DECK_MAP['spanish'].
 * buildDeck accepts raw card arrays, so no other change is needed; card ids
 * match the main deck, so SRS mastery/progress carries over in both
 * directions.
 */
import type { LearningGoal } from '../types';
import rawSpanishDeck from './spanish/deck.json';
import starterManifest from './spanish-starter-manifest.json';

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
 * Shape of a raw main-deck card (as stored in src/data/spanish/deck.json),
 * i.e. the input shape that App.tsx's `buildDeck` transforms into QuestCard.
 */
export interface RawDeckCard {
  id: string;
  /** TTS-ready target-language sentence (audio was generated from this). */
  target: string;
  english: string;
  /** mp3 filename, e.g. "es-es-0001.mp3" — unchanged from the main deck. */
  audio: string;
  /** Goal-audience tags from the main deck (general/travel/work/family). */
  tags: LearningGoal[];
  /** Grammar node "node-01".."node-35"; see grammarDescriptions.ts. */
  grammarNode: string;
  /** Optional short learner note (present on ~36% of starter cards). */
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
interface StarterManifestEntry {
  id: string;
  starterSeq: number;
  themes: StarterTheme[];
}

/**
 * The Spanish starter deck: 300 graded sentence cards bridging beginner
 * apps to native content, ordered easiest (starterSeq 1) to hardest (300).
 *
 * HYDRATED FROM THE LIVE MAIN DECK. The manifest (spanish-starter-manifest.json)
 * stores only the curation — which main-deck card ids, their graded order, and
 * themes. Card CONTENT (target, english, audio, tags, grammar) is read from the
 * current main deck at load time, so any edit you make to a main-deck card flows
 * into the starter deck automatically — no re-curation needed. A card removed
 * from the main deck is dropped here rather than shown stale.
 */
const _mainById = new Map<string, RawDeckCard>(
  (rawSpanishDeck as RawDeckCard[]).map(c => [c.id, c]),
);

export const SPANISH_STARTER: StarterCard[] = (starterManifest as StarterManifestEntry[])
  .map(m => {
    const card = _mainById.get(m.id);
    return card ? { ...card, starterSeq: m.starterSeq, themes: m.themes } : null;
  })
  .filter((c): c is StarterCard => c !== null)
  .sort((a, b) => a.starterSeq - b.starterSeq);
