You are authoring a pilot slice of the GREEK deck for LangLab.
Working directory: /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones

READ FIRST:
- docs/greek-register-policy.md + docs/greek-register-offenders.json (offenders must NOT appear)
- src/data/conjugation/el.ts — the engine's CURRENT capability defines what verbs you may use:
  * IRREGULARS: είμαι, έχω, πάω, λέω, τρώω, ακούω
  * any regular -ω verb (γράφω-class), -άω contract verb (μιλάω-class), or -ομαι deponent (έρχομαι-class)
  * ONLY present-tense forms and θα + present (future) — NO aorist/past/imperative forms (engine can't generate them yet)
- src/data/dictionary/el.ts — note keys are stored σ-NORMALIZED (lowercase, final ς → σ: καλός is stored 'καλόσ'). Your dict keys must follow this.

CARD FORMAT — JSON array, fields exactly: id ("el-NNNN"), target, english, audio ("el-" + id + ".mp3" i.e. "el-el-0001.mp3"), tags (array, "general" on EVERY card), grammarNode, priority (= card number), grammar (optional tip).

HARD RULES:
1. Natural everyday Modern Greek (demotic), Q1 band 3–10 words; 100% unique sentences within your slice AND vs other slices (stay strictly on your topics).
2. Sequential ids in your range; priority = card number.
3. tags: general 100%; travel/work/family sprinkled naturally (~40-60% of applicable cards).
4. Grammar tips on ~30%: ≤120 chars, ONE rule, one worked example, ALWAYS accent-marked Greek. No jargon.
5. English glosses translate exactly.
6. NO offender words (no katharevousa: δύναται/όστις/ούτως; no slang: ρε below Q4).
7. All Greek text fully accented (μιλάω not μιλαω). Final sigma correct in TARGETS (ς word-finally); σ-normalized in DICT KEYS only.
8. Verbs: present tense or θα + present ONLY. Every verb's citation form (1sg present) must be conjugatable by the engine (test mentally against the classes above).

DICT OUTPUT — every unique token you used → {"en","ipa","pos"} with "lemma":"<citation form>" on conjugated verb forms, citation forms as their own entries. Keys σ-normalized + lowercased + accented. SHORT pos codes: v, n, adj, adv, pron, prep, conj, num, part, interj, det, phrase. IPA required on every entry (Modern Greek IPA: γ=ɣ/ʝ, χ=x/ç, θ=θ, δ=ð, stress marks).

Validate before finishing (script it): parse JSONs; ids sequential/unique; every target token (σ-normalized, punctuation stripped) is a dict key; every verb resolves via the engine's findInfinitive or its dict lemma. Report counts. Do NOT touch any other files.
