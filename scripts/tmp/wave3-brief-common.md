You are authoring a wave-3 slice of the Indonesian deck for LangLab.
Working directory: /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones

READ FIRST:
- docs/indonesian-register-policy.md + docs/indonesian-register-offenders.json (offenders must NOT appear; note rule 4 — Q3 allows situational formality)
- src/data/conjugation/id.ts (KNOWN_ROOTS + meN- assimilation; every verb must be a known root, a derived form of one, or a new bare root declared in your roots file)
- Skim src/data/indonesian/deck.json (800 cards) — your sentences must NOT duplicate ANY existing sentence.

CARD FORMAT — JSON array (fields exactly): id, target, english, audio ("id-" + id + ".mp3"), tags (array, "general" on EVERY card), grammarNode, priority (= card number), grammar (optional tip).

HARD RULES:
1. Sentences 100% unique (within slice AND vs all 800 existing); natural Indonesian; Q3 band 6–16 words.
2. Sequential ids in your assigned range; priority = card number.
3. Grammar tips on ~30%: ≤120 chars, ONE rule, one worked example, no jargon.
4. English glosses must actually translate the sentence (tense/person/politeness exact).
5. NO offender words. Full forms (tidak/sudah/saja); meN- forms modeled fully except bare-root imperatives.
6. Known audit traps to avoid: adalah with adjectives; noun+dia possession (use -nya); mendengar/mendengarkan; menyanyi+object (use menyanyikan); malam Jumat = THURSDAY night; masak ≠ grill (bakar); "terlihat bagus untuk kamu" calque (use cocok); bantu + action verb not "dengan"; jam-time uses jam not pukul.

DICT OUTPUT — every unique token you used (lowercased, punctuation stripped) → {"en","ipa","pos"} with "lemma":"<root>" on derived forms and bare roots as their own entries. SHORT pos codes only: v, n, adj, adv, pron, prep, conj, num, part, interj, det, phrase. IPA: c=tʃ, j=dʒ, ny=ɲ, ng=ŋ, e=ə/e, final k=ʔ. Values must be OBJECTS, never bare strings.

ROOTS OUTPUT — JSON array of bare verb roots you used that are NOT in KNOWN_ROOTS (check the actual file).

Validate before finishing (script it): parse all JSONs; ids sequential/unique; every target token covered by your dict; no duplicate sentences vs deck.json. Report counts. Do NOT touch any other files.
