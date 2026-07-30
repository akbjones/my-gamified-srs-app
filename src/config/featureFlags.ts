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
  'hindi',   // wave passed all gates 2026-07-22: 582 tips, 18.3%, verified + linter-clean (user flipped)
  'korean',     // Wave A 2026-07-22: 1,024 tips, 26.0%, verified + linter-clean
  'greek',      // Wave A 2026-07-22: 1,055 tips, 26.8%, verified + linter-clean
  'indonesian', // Wave A 2026-07-22: 1,021 tips, 26.0%, verified + linter-clean
  'french',     // Wave B 2026-07-23: 877 tips, 22.3%, classify→rewrite→fill→verify, linter-clean
  'italian',    // Wave B 2026-07-24: 923 tips, 23.4%, author→adversarial-verify, gates green + spot-checked
  'portuguese', // Wave B 2026-07-24: 883 tips, 22.3%, author→adversarial-verify, gates green + spot-checked
  'german',     // Wave B 2026-07-24: 912 tips, 23.1%, author→adversarial-verify, gates green + spot-checked
  'dutch',      // Wave B 2026-07-24: 901 tips, 22.9%, author→adversarial-verify, gates green + spot-checked
  'swedish',    // Wave B 2026-07-24: 878 tips, 22.4%, author→adversarial-verify, gates green + spot-checked
  'turkish',    // Wave C 2026-07-24: 691 tips, 22.2%, + Tip Clarity format pass + adversarial judgment critic
  'russian',    // Wave C 2026-07-24: 704 tips, 22.2%, + Tip Clarity format pass + adversarial judgment critic
  'welsh',      // Wave C 2026-07-24: 774 tips, 22.0%, + Tip Clarity format pass + adversarial judgment critic
]);

/** Should the UI surface grammar tips for this language? */
export const grammarTipsEnabled = (lang: Language): boolean =>
  !GRAMMAR_TIPS_KILL_SWITCH && GRAMMAR_TIPS_LANGS.has(lang);
