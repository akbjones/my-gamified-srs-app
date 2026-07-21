import type { Language } from '../types';

/**
 * Single-source feature toggles.
 *
 * Grammar tips – per-language allowlist (doctrine: docs/grammar-tips-doctrine.md):
 *   The `grammar` field on deck cards is preserved in each language's
 *   deck.json – that's the "cache". Tips were hidden globally 2026-06-13
 *   after widespread tip↔card mismatches (e.g. Russian "Что это за знание"
 *   tagged with verb бить). 2026-07-21 the global boolean became this
 *   allowlist: a language's tips become visible ONLY once its corpus passes
 *   the doctrine gates (relevance, dedup, format linter in audit-lang.ts,
 *   adversarial verify). EMPTY at the Reddit launch by explicit decision –
 *   add languages as their waves pass.
 */
export const GRAMMAR_TIPS_KILL_SWITCH = false; // set true to hide tips everywhere regardless of the allowlist
export const GRAMMAR_TIPS_LANGS: ReadonlySet<Language> = new Set<Language>([
  'spanish', // pilot passed all gates 2026-07-21: 882 tips, 22.4%, linter-clean (user flipped)
]);

/** Should the UI surface grammar tips for this language? */
export const grammarTipsEnabled = (lang: Language): boolean =>
  !GRAMMAR_TIPS_KILL_SWITCH && GRAMMAR_TIPS_LANGS.has(lang);
