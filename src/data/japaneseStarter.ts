/**
 * Japanese starter deck (?starter=ja).
 *
 * Unlike Spanish (a 300-card SELECTION from a 3,935-card deck), the
 * Japanese main deck IS 300 graded cards at launch, so the manifest
 * covers all of it 1:1 (starterSeq = priority). Same machinery on
 * purpose: at parity expansion (ja-0301..ja-3933) the manifest keeps
 * selecting exactly these 300 ids with zero rework, and SRS progress
 * carries over because ids never change.
 *
 * Kept separate from starterDecks.ts so the Spanish starter chunk does
 * not drag in the Japanese deck (and vice versa).
 */
import rawJapaneseDeck from './japanese/deck.json';
import starterManifest from './japanese-starter-manifest.json';
import { buildStarter, type RawDeckCard, type StarterCard, type StarterManifestEntry } from './starterDecks';

export const JAPANESE_STARTER: StarterCard[] = buildStarter(
  rawJapaneseDeck as unknown as RawDeckCard[],
  starterManifest as StarterManifestEntry[],
);
