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
 * The curation lives in src/data/spanish-starter-manifest.json (ids + graded
 * order + themes; content is hydrated from the live main deck below) and was
 * built by grammar-node progression + sentence length + theme balancing (see
 * docs/spanish-starter-deck-qa.md for the full methodology and QA report).
 *
 * INTEGRATION (shipped): opening the app with `?starter=es` boots the
 * locked Spanish starter (App.tsx: STARTER_LOCK). The deck-loading
 * useEffect passes SPANISH_STARTER to `buildDeck(...)` instead of
 * DECK_MAP['spanish'], forces the 'general' goal, and disables the
 * language switcher so a shared link can ONLY use this deck. Card ids
 * match the main deck, so SRS mastery/progress carries over both ways.
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
  /** Pre-tokenized target for unspaced scripts (Japanese) — see QuestCard.tokens. */
  tokens?: { t: string; r?: string }[];
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
export interface StarterManifestEntry {
  id: string;
  starterSeq: number;
  themes: StarterTheme[];
}

/**
 * Hydrate a starter deck from its main deck + curation manifest. Cards
 * removed from the main deck are dropped rather than shown stale. Keep
 * each language's starter in its OWN module (this file imports the
 * Spanish deck statically) so one starter's chunk never drags in another
 * language's deck — see japaneseStarter.ts.
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
export const SPANISH_STARTER: StarterCard[] = buildStarter(
  rawSpanishDeck as RawDeckCard[],
  starterManifest as StarterManifestEntry[],
);
