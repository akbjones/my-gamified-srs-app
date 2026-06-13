/**
 * Single-source feature toggles.
 *
 * Grammar tips:
 *   The `grammar` field on deck cards is preserved in each language's
 *   deck.json — that's the "cache". This flag controls whether the UI
 *   surfaces it on study cards. Flipped to false 2026-06-13 after the
 *   user reported widespread tip↔card mismatches (e.g. Russian
 *   "Что это за знание" tagged with verb бить). When tips get a
 *   correctness rewrite, flip back to true.
 */
export const SHOW_GRAMMAR_TIPS = false;
