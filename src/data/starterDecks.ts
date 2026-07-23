/**
 * Curated Spanish starter deck (?starter=es).
 *
 * A starter deck is a small, hand-graded SELECTION of cards from a language's
 * main deck — not new content. Every card is reused verbatim (same id, target,
 * english, audio, tags, grammarNode, grammar, priority), so existing audio
 * files, dictionary coverage, and the word popover keep working unchanged.
 *
 * The curation lives in src/data/spanish-starter-manifest.json (ids + graded
 * order + themes; content is hydrated from the live main deck below) and was
 * built by grammar-node progression + sentence length + theme balancing (see
 * docs/spanish-starter-deck-qa.md for the full methodology and QA report).
 *
 * Shared machinery (types + buildStarter) lives in starterCore.ts, which is
 * deck-free ON PURPOSE — importing it must never pull a deck chunk. Each
 * language's starter is its own module: this one (Spanish), japaneseStarter.ts.
 *
 * INTEGRATION (shipped): opening the app with `?starter=es` boots the
 * locked Spanish starter (App.tsx: STARTER_LOCK). Card ids match the main
 * deck, so SRS mastery/progress carries over both ways.
 */
import rawSpanishDeck from './spanish/deck.json';
import starterManifest from './spanish-starter-manifest.json';
import { buildStarter, type RawDeckCard, type StarterCard, type StarterManifestEntry } from './starterCore';

export type { StarterTheme, RawDeckCard, StarterCard, StarterManifestEntry } from './starterCore';
export { buildStarter } from './starterCore';

export const SPANISH_STARTER: StarterCard[] = buildStarter(
  rawSpanishDeck as RawDeckCard[],
  starterManifest as StarterManifestEntry[],
);
