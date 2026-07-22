/**
 * Shared target-text tokenization — the ONE place target sentences are
 * split for display, tiles, vocab, and length measurement.
 *
 * Japanese has no inter-word spacing: its cards carry a pre-tokenized
 * `tokens` field (lint-guaranteed to re-join to `target` exactly), and
 * every whitespace split silently degrades ja to one-giant-word. All
 * future splitting must go through these helpers — grep-guarded by
 * scripts/lint-ja-deck.cjs.
 */
import type { QuestCard } from '../types';

export type CardText = Pick<QuestCard, 'target' | 'tokens'>;

/** Token that is ONLY punctuation (fullwidth + Western) — never tappable,
 *  never a tile, never a vocab entry. Whole-token test, not a stripper. */
export const PUNCT_TOKEN = /^[\s。、！？．，「」『』（）()［］【】!?.,;:…・〜~«»""''"'¿¡–-]+$/;

/** Any CJK content (kana, kanji, iteration marks, chōonpu). */
export const hasCjk = (s: string): boolean => /[々぀-ヿ㐀-䶿一-鿿]/.test(s);

/** Display tokens: pre-tokenized for CJK decks (punctuation tokens
 *  included, so joins reconstruct the sentence), whitespace split
 *  otherwise. */
export function tokenizeTarget(card: CardText): string[] {
  if (card.tokens?.length) return card.tokens.map((t) => t.t);
  return card.target.split(/\s+/).filter(Boolean);
}

/** Gameplay tokens: punctuation-only tokens removed. For whitespace decks
 *  this equals the plain split (trailing punctuation stays glued to its
 *  word, exactly as before — normalizeTileWord handles it downstream). */
export function contentTokens(card: CardText): string[] {
  return tokenizeTarget(card).filter((t) => !PUNCT_TOKEN.test(t));
}

/** Length signal for font-size bands and tile eligibility: a ja token is
 *  the analogue of a word, so one banding scale serves every language. */
export function displayLengthFor(card: CardText): number {
  return contentTokens(card).length;
}
