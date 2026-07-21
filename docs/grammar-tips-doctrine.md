# Grammar-Tips Quality Doctrine — repo-verified and corrected (audit, rewrite, re-enable per-language)

> Scoping document — no implementation yet. Design was adversarially feasibility-checked against the actual codebase.

## Executive summary

Adversarial re-verification against the repo confirms the design's core thesis and every coverage statistic to the decimal, but surfaces five errors and two missing work items, now fixed inline. Errors: the tier-band mapping didn't match grammarDescriptions.ts (actual: A1 01–08, A2 09–15, B1 16–21, B2 22–27, C1 28–31, C2 32–35); the 160-char hard cap would fail the design's own 187-char gold-standard tip (now 200 hard/90–160 target); de-0414 — cited as a GOOD exemplar — is itself a wrong-card mismatch; MIGRATE_TO_ETYMOLOGY is not viable cheaply (no ko/el/id etymology files, static 11-language imports, verified-sources contract with a frozen source list lacking Korean/Greek references) so glosses default to DROP; and the flag has 4 usages, not 3. Missing work: ~800 tips render literal backticks in the plain-text UI (ru 245/274, cy 167/197), and a .cjs linter cannot import the TS registry — the linter now lives inside scripts/audit-lang.ts, inheriting tsx, baseline-regression semantics, and free CI wiring via language-audit.yml. Scale corrections sharpen the plan: the German compound-noun template is stamped on 82 cards (not ~5), making Wave C a verify-everything pass, and tier-2 decks are 3,117–3,512 cards so Wave D authors ~560–700 tips per language.

## ROLLOUT PLAYBOOK v2 — post-pilot (2026-07-21, Spanish SHIPPED + flipped)

The Spanish pilot ran the full pipeline end-to-end and calibrated every stage.
This is the DEFINED process for the remaining 13 languages. Reusable scripts
from the pilot live in the session scratchpad pattern (classify wf → rewrite
wf → fill wf → tone wf → apply_es_tips.py); per-language runs clone them with
the language's deck path, STOP-word list, and script adaptations.

### The proven 6-stage pipeline (per language)

1. **CLASSIFY** every existing tip against the taxonomy (keep / rewrite / drop
   + EARN or BANNED category). Feed each item its `dupGroupSize` from the
   deterministic near-dup clustering (token-Jaccard 0.7, computed inline
   first). ~14 slices, effort=high. *Pilot yield: 41% keep / 20% rewrite /
   37% drop — expect FAR worse keep-rates in tr/ru/cy/hi (script-stamped).*
2. **REWRITE** the salvageables around the classifier's `focus` insight +
   adversarial verify. *Pilot: 143/143 usable, 0 over-length.*
3. **FILL to tier bands** — compute per-node quotas from the band targets
   (A1 35% · A2/B1 22% · B2 12% · C1/C2 10% of each node's card count, minus
   survivors), then per-node agents SELECT worthy cards (genuine trap only —
   "a card whose target works like English gets NO tip") and write to spec;
   adversarial verify per node. *Pilot: 443/443, landed 22.3%.*
4. **TONE SWEEP** the full merged set against the locked voice rule (chill +
   factual; hook = the fact; no wordplay/metaphor/zingers). *Pilot: 61 of 881
   flattened — the authoring prompts now carry the voice rule, so later
   languages should need fewer.*
5. **QUOTE-ANCHOR** stragglers: the apply-linter's token/stem floor flags tips
   that don't visibly cite their card; a small agent pass edits them to quote
   an exact target word. *Pilot: 88 flagged → 71 were linter-matcher gaps
   (fixed in the matcher) → 17 real, all anchored. Do NOT loosen the matcher
   further — touch up the tips instead.*
6. **APPLY + LINT** (hard gates, refuse-on-fail): ≤200 chars, no backticks,
   no markdown, quote-rule floor, exact-dup detection. Then the STRAY SWEEP:
   diff deck-tips-present vs classification coverage — the pilot found 2 tips
   the classifiers missed (one garbled, one backticked+wrong-card). Always
   run it.

### Pilot learnings now baked into the process

- **Voice rule in the authoring prompt** (not just the sweep) — saves a stage's
  worth of flattening.
- **Fill collisions**: parallel authors converge on obvious sentences. Dedup
  fills against (existing + siblings) at apply; re-author collisions against
  an explicit AVOID list. *Pilot: 4.6% collision rate on Hindi usefulness, ~0
  on tips fill thanks to per-node existing_tips context — keep providing it.*
- **The linter's stem matcher cannot bridge stem changes** (quiero↔querer,
  diphthongs) — expect ~2% flagged-but-fine; anchor them, don't loosen.
- **Classify misses ~0.3%** of items (2/706) — the stray sweep is mandatory.
- **Never let a fill overwrite a keep/rewrite** (guard exists in the apply
  script).

### Script adaptations for non-Latin languages (ko/el/ru/hi + cy diacritics)

- **Romanization required** in every tip that cites target-script text:
  parenthetical per the historical convention — 안녕하세요 (annyeonghaseyo).
  The format spec's char budget INCLUDES the romanization; the 200 hard cap
  stands (target 90–160 gets tight — audit p90 per language before fill).
- **Quote-rule matcher**: tokenize the target in ITS script (exact token match
  works for Hangul words / Cyrillic / Greek; Devanagari needs the same
  matra-tolerant matching the register linter used) AND accept the tip citing
  the romanization of a target word. Per-language STOP lists.
- **Korean vocab-glosses DROP** (locked decision 5) — ko/el/id classify will
  drop-heavy; their fill quotas are correspondingly larger.

### Wave order + per-language prognosis

| Wave | Languages | Shape of the work | Est. |
|---|---|---|---|
| **A** | ko, el, id | New-wave corpora: decent tips but vocab-gloss-heavy (ko 1,515 / el 1,629 / id 1,379 tips). Classify → heavy gloss-drops → moderate fill. Non-Latin matcher debuts (ko, el). | ~1 focused session each |
| **B** | fr, it, pt, de, nl, sv | Legacy six: mixed quality; kill conjugation restatements + the **82-card German compound-noun template** + known mismatches (de-0158, de-0414); ~250 backticked tips across them; selective fill to band. | ~1–2 sessions each |
| **C** | tr, ru, cy | Script-stamped worst: mostly drop-everything + author ~560–700 fresh per language (decks 3,117–3,512). Romanization mandatory (tr Latin but ru/cy need care). | ~2 sessions each |
| **D** | hi | LAST — waits for the native-speaker naturalness review (task #87): no point writing tips against sentences that may be rewritten. | ~2 sessions, after #87 |

**ORDER OVERRIDE (user, 2026-07-21): HINDI RUNS NEXT** — immediately after the
Hangul script-teacher ships, before the remaining waves. The Wave-D blocker is
considered lifted (the 153-card Hindi naturalness rewrite shipped 2026-07-14;
task #87 closed). Sequence now: hi → (ko/el/id, classify already done in the
background) → legacy six → tr/ru/cy. Hindi runs the full 6-stage pipeline with
the Devanagari matra-tolerant quote matcher + mandatory romanization.

**Gate per language:** linter green + adversarial verify green + coverage in
band → add to `GRAMMAR_TIPS_LANGS` → tips go live for that language only.

## DECISIONS — LOCKED 2026-07-21

**VOICE CALIBRATION (user, 2026-07-21, from pilot samples):** **PUNCTUATION: no em dashes (—) anywhere user-visible – use en dashes (–). Applies to tips, UI copy, and all future authoring prompts.** chill and factual. The hook must come from the surprising FACT itself (a literal gloss, a real contrast, a consequence) — never from wordplay, cutesy metaphor, or aphoristic zingers. "Desde hace años is literally 'since it makes years'" = good. "Ser judges the brand; estar savors the sip" = cringe, banned. Applies to all languages' tip authoring.

1. **Per-language allowlist** (`GRAMMAR_TIPS_LANGS` Set + global kill switch) — per reco.
2. **Spanish pilots first** — per reco.
3. **Launch posture: ALL tips stay hidden at the Reddit launch** (user chose the safer alternative over unhiding es/ko/el/id). The allowlist mechanism is still built; languages are added to it only after passing their wave, and the unhide moment is a later explicit call.
4. **Length: 200 hard / 90–160 target** — per reco.
5. **ko/el/id vocab-glosses: DROP** (no etymology migration) — per reco.
6. **Linter lives inside scripts/audit-lang.ts** (tsx + CI for free) — per reco.
7. **Chip renamed "Grammar" → "Why?"** — approved.

## Decisions (original list, for reference)

1. Per-language allowlist vs global boolean flag — RECOMMEND per-language GRAMMAR_TIPS_LANGS Set (4 SHOW_GRAMMAR_TIPS usages across 2 files, enables per-wave unhiding; keep a global kill switch). Global-only forces all-14-or-nothing and blocks the launch posture.
2. Pilot language — RECOMMEND Spanish (Reddit showcase + ?starter=es starter deck + 97% unique tips = fastest calibration). Alternative: Korean first if you want the non-Latin linter path proven earlier.
3. Launch posture — RECOMMEND shipping Reddit with only Waves A+B (es/ko/el/id) unhidden; hi/tr/ru/cy stay hidden until re-authored. Alternative: hold ALL tips hidden until every language passes (safer, but wastes the 4 good-ish corpora).
4. Length cap — RECOMMEND 200 hard / 90–160 target (corpus median 96, p90 147, max 197; the best tip es-2244 is 187 chars and must survive its own doctrine). The design's original 160 hard cap kills its own gold standard; the historical 120 is even worse.
5. Vocab-gloss fate in ko/el/id — RECOMMEND DROP by default. Migration to the etymology surface is NOT the cheap out the original design implied: src/data/etymology/ has no ko/el/id files, etymologyService.ts statically imports exactly 11 languages, and the EtymologyEntry contract requires verified:true + sources from a frozen ALLOWED_SOURCES list containing no Korean/Greek reference works. If the best glosses are worth keeping, scope 'Korean/Greek/Indonesian etymology surfaces' as its own future project with real source verification.
6. Linter home — RECOMMEND implementing the tip linter as a new check inside scripts/audit-lang.ts (tsx, imports registry.ts already, baseline-regression semantics, CI wiring in .github/workflows/language-audit.yml is free) rather than a standalone .cjs script, which cannot import the TS registry at all. Alternative: standalone scripts/check-grammar-tips.ts run via tsx with its own workflow step.
7. Chip rename 'Grammar' → 'Why?' — RECOMMEND yes (matches doctrine framing, zero cost). Pure taste call.

## Phased plan

| Phase | Size | Deliverable |
|---|---|---|
| P0 — Doctrine doc + per-language flag refactor + tip linter as a new audit-lang.ts check (relevance/dup/format/backtick gates, baseline mode for unfixed langs) | M | docs/grammar-tips-doctrine.md; GRAMMAR_TIPS_LANGS allowlist in featureFlags.ts with all 4 usages updated (StudySession 377/439/441, PlacementTest 476); extract-tips.ts + linter checks inside scripts/audit-lang.ts, running in the existing language-audit.yml CI for free |
| P1 — Spanish pilot: classify → prune/rewrite (incl. 40 backticked + 43 over-length tips) → adversarial verify → unhide es | M | Spanish tips at 18–25% six-tier-banded coverage, linter-clean; 'es' in allowlist; near-dup threshold calibrated from real pilot friction |
| P2 — New-wave de-gloss: ko, el, id (drop vocab glosses with gloss_worth_keeping flagged for a future etymology project, fix jargon, verify) | L | ko/el/id (1,515/1,629/1,379 tips) pass all gates and join the allowlist — launch posture reached (4 languages live) |
| P3 — Legacy wave: fr, it, pt, de, nl, sv (kill conjugation restatements + the 82-card German template + confirmed mismatches de-0158/de-0414, strip ~250 backticked tips, selective adds) | L | 6 legacy languages linter-clean and unhidden; every legacy tip verified, not just pruned |
| P4 — Script-stamped re-author: tr, ru, cy, then hi (after naturalness review #87) | XL | ~560–700 doctrine-compliant tips authored per language (decks are 3,117–3,512 cards, not 3,933), stamped duplicates and ~565 backticked tips purged, all 14 languages unhidden |
| P5 — UI polish: flip-gating (both conditions, lines 439 AND 441), 'Why?' chip rename, optional once-per-phenomenon pulse | S | Chip renders answer-side only, renamed; pulse behind its own mini-flag if adopted |

**Total effort:** Roughly 11–15 focused sessions across P0–P5 (P0+P1 ≈ 2–3 to reach the pilot; +3 for the 4-language launch posture; remaining 10 languages backloadable; German and Russian are the two heaviest single languages — 82-card template purge and 245-backtick/79-overlength re-author respectively). Monetary cost: $0 TTS (tips are never voiced; apply path touches only the grammar field, so no audio-cache bump); LLM subagent usage only, phased per wave, comparable per-language to the Hindi usefulness pass.

## Risks

- Factual correctness in languages the maintainer can't verify (Korean, Greek, Hindi…): an LLM-authored wrong tip is worse than no tip. Mitigated by adversarial verify with hard drop-over-keep bias and by drop-being-free — but residual error is nonzero; the Hindi native-speaker review (#87) is the only true backstop for hi.
- Relevance-gate false negatives are PROVEN in-corpus, not hypothetical: hi-0446 carries a comparative-से tip on a sentence where से only appears inside कम से कम ('at least') — it passes token overlap while being wrong. The linter is a floor; Stage-4 verify is mandatory before unhiding, no exceptions.
- Legacy waves are dirtier than 97%-uniqueness suggests: German alone has one template on 82 cards plus two confirmed wrong-card mismatches (de-0158, de-0414 — the latter was miscited as a GOOD exemplar in the first draft of this very doc, which is itself evidence of how easy these are to wave through). Budget Wave C as verify-everything.
- Near-dup detector tuning: Jaccard threshold too tight flags legitimate budgeted retellings, too loose lets template-stamping regress; expect one calibration loop during the Spanish pilot.
- Scope creep before Reddit launch: 14 languages × full pipeline is 10+ sessions; the per-language flag exists precisely so launch doesn't wait on Waves C/D.
- Hindi double-work: rewriting tips before the naturalness review (#87) rewrites sentences would orphan tips; sequencing hi last in Wave D is load-bearing.
- Favorites keyed on tip text (toggleGrammarFavorite/isGrammarFavorited, verified): users who saved tips pre-rewrite keep stale text and lose the 'Saved' indicator on the rewritten card; cosmetic, worth a release-notes line.
- UNVERIFIED — sampled, not exhaustive: the ko/el/id 'vocab-gloss dilution' characterization rests on ~10 sampled tips per language plus the near-100% uniqueness stat; the actual gloss fraction (vs genuine grammar) is unmeasured until Stage 2 classification runs — Wave B could skew shorter (mostly KEEP) or longer (mostly DROP) than 1 session each. Also unverified: whether Greek tips consistently romanize (Korean samples do), and the per-script content-token length threshold for the relevance gate needs empirical tuning on Devanagari/Hangul before the gate is trusted.
- Linter-in-audit-lang coupling: audit-lang.ts fails CI on regressions vs docs/audit-baseline.json; the tip linter must adopt the same baseline discipline or its P0 landing will red every branch touching src/data/** for the 13 not-yet-fixed languages. Baseline mode is designed in, but the first baseline commit is load-bearing.

---

## Full design

# Grammar-Tips Quality Doctrine (repo-verified revision)

## 0. Ground truth: what's actually in the decks — ALL NUMBERS RE-MEASURED AGAINST THE REPO

Flag: `src/config/featureFlags.ts` — `SHOW_GRAMMAR_TIPS = false`, comment confirms the trigger verbatim: flipped 2026-06-13 after "widespread tip↔card mismatches (e.g. Russian 'Что это за знание' tagged with verb бить)".

Render sites — **4 flag usages across 2 files**, not 3: `src/components/StudySession.tsx` lines 377 (amber modal overlay with Save-to-Favorites star), 439 (chip-stack container condition), 441 (the "Grammar" chip itself); `src/components/PlacementTest.tsx` line 476 (per-card detail after reveal). Verified from code: the grammar chip renders on BOTH card sides, while the etymology chip directly below it is already gated on `isFlipped` (line ~450) — the asymmetry the UI fix removes.

Corpus stats (re-measured 2026-07-21; every figure below verified exact):

| Generation | Languages | Coverage | Unique/total | Signature defect |
|---|---|---|---|---|
| Legacy | es 17.9% (685u/706), fr 23.9% (918/938), it 16.4% (630/649), pt 23.1% (885/914), de 23.2% (890/916), nl 14.9% (575/588), sv 14.2% (546/558) | 14–24% | ~97% unique | conjugation restatement, template-stamping, mismatches |
| Script-stamped | cy 5.6% (115u/197, deck=3512), hi 3.6% (82/115, deck=3172), tr 5.1% (77/160, deck=3117), ru 8.6% (129/274, deck=3174) | 3.6–8.6% | 40–70% unique | generic rules stamped by keyword scripts (`scripts/add-grammar-tips-{hi,hi-v2,ru,tr}.cjs` exist in-repo), wrongly applied |
| New wave | ko 38.5% (1514/1515), el 41.4% (1628/1629), id 35.1% (1379/1379) | 35–41% | ~100% unique | vocab glosses masquerading as grammar tips |

**Smoking guns (all verified in deck.json):**
- **Mismatch:** de-0158 "Ich mache in der Mittagspause einen kurzen Spaziergang" → tip about 'wohl' + future — *wohl absent from the sentence*.
- **Mismatch #2 (was miscited as a GOOD exemplar in draft 1):** de-0414 "Du bist nicht allein damit." → tip: "weil and dass both push the verb to the back…" — *neither weil nor dass appears in the sentence*. The weil/dass tip is excellent content on the wrong card; legacy German has ≥2 mismatch-class defects, so the audit must not assume legacy = merely-verbose.
- **Wrong application:** the Russian motion-verb stamp ("Walking vs vehicle: идти/ходить … ехать/ездить") sits verbatim on exactly **7 cards** including ru-0505 "Дождь идёт уже третий день подряд" (*it's raining* — идёт is idiomatic, tip actively misleading) and ru-0248 "Медсестра бегает" (бегать — neither verb pair).
- **Template-stamping at scale:** German "compound noun. The last component determines gender" appears on **82 cards** (measured; draft 1 implied ~5 — the problem is an order of magnitude worse). Hindi "के + word makes compound postpositions" stamped identically on hi-0172, hi-0809.
- **Generic-not-about-this-card:** hi-0009 "मुझे ज़ोरों की भूख लगी है" → tip is the auxiliary-selection table (हूँ/है/हैं/हो) — a paradigm dump unrelated to the "hunger strikes me" construction.
- **NEW, missed by draft 1 — raw backticks in the UI:** tips render as plain text (`{card.grammar}` inside a `<p>`, no markdown pipeline), yet **~800 tips contain literal backticks** that display as raw `` ` `` characters: ru 245/274, cy 167/197, tr 110/160, pt 58, fr 49, es 40, hi 43, it 43, nl 30, sv 24, de 20 (ko/el/id: zero). Also **266 tips exceed 160 chars** (ru alone: 79). Both are mechanical lint rules + strip passes.

---

## 1. Tip taxonomy — what EARNS a tip vs what is BANNED

A tip earns its place iff an English speaker reading the answer would either **(a) get it wrong without the tip, (b) wonder "why is it phrased like that?", or (c) gain a reusable intuition they can't get from the dictionary popover or conjugation table** (both exist: `src/data/dictionary/<code>.ts`, `src/data/conjugation/<code>.ts`, surfaced via WordPopover; tips must never duplicate those surfaces).

### EARNS its place (in-deck exemplars, re-verified)
1. **Contrastive-with-English traps** — es-2244 "Spanish says 'I have hunger' (tengo hambre)… 'I am' would mean you are hunger itself" (187 chars — the corpus's best tip, and the reason the cap is 200 not 160). ko-0289 "Korean adjectives work like verbs — no 'is' needed: 좋아요 alone means 'it's good'."
2. **Register/politeness stakes** — hi-3202 "For respect, even one person takes हैं (hain), not है. मेरे पिता हैं." de-1373 "Servus is common in Bavaria and Austria."
3. **Disambiguation of confusable pairs, anchored in THIS sentence** — hi-1105 के साथ vs के पास (card contains के साथ — passes the quote rule). es-0532 "Estar + listo = ready. Ser + listo = clever."
4. **Why-word-order/structure-differs intuitions** — the weil/dass verb-final tip is the archetype, but it must move OFF de-0414 onto a card that actually contains weil or dass (draft 1 wrongly held it up in place).
5. **Idiomatic/cultural logic** — ko-3471 "가뭄에 콩 나듯 (like beans in a drought) = very rare." ko-1839 songpyeon folk saying (-대요 reportative).
6. **One-word-two-meanings landmines** — hi-3238 "कल = yesterday OR tomorrow. Context decides."
7. **False friends / deceptive cognates** — underused today; audit should add where genuine.

**Cautionary non-exemplar:** hi-0446 "इस तालाब की गहराई कम से कम बीस फ़ीट है" carries the comparative-से tip, but the sentence's से lives inside कम से कम ("at least") — not a comparative. It would PASS a naive token-overlap gate. This is the canonical proof that the linter is a floor and Stage-4 verify is the gate.

### BANNED (verified offenders)
1. **Conjugation-table restatement** — es-0361 "Encontrar: stem change o→ue. Encuentro, encuentras, encuentra." es-0285 (stem-change mechanics essay). The conjugation engine already renders this on word-tap. DROP, don't rewrite.
2. **Re-translating the sentence** — es-2695 "Future perfect: habré terminado = I will have finished." ko-2314 glosses 때문에 twice.
3. **Generic rules stamped verbatim across cards** — the 82-card German compound-noun template; all script-stamped duplicates. A rule may recur only under the repetition budget (§2), each telling re-anchored.
4. **Tips not about THIS sentence** — de-0158, de-0414, ru-0505, ru-0248, the бить/знание flag-comment case.
5. **Pure vocabulary glosses** — ko-3244 워라밸, ko-1425 상비약. Policy: **DROP** (migration to etymology is not viable at current cost — see Decisions; the etymology surface has a verified-sources contract, a QC gate at `scripts/etymology/qc.cjs`, a frozen ALLOWED_SOURCES list without Korean/Greek references, no ko/el/id data files, and a static 11-language import list in `src/services/etymologyService.ts`).
6. **Node-label restatement** — es-2546 "Pluperfect subjunctive + conditional perfect – third conditional." GRAMMAR_NUDGES in `src/data/grammarDescriptions.ts` already cover node-level descriptions.
7. **Jargon-led tips** — no "postposition/auxiliary/nominalizer/copula/oblique" without plain-words framing (ko-3312 fails).
8. **Markdown artifacts** — backticks, asterisks, or any markup: the render path is plain text. Strip during rewrite; lint forever.

---

## 2. Coverage policy

**Principle: no tip is better than a weak tip.** A card with no `grammar` field is fully supported (chip simply doesn't render — verified, condition is `card.grammar &&`).

- **When a card SHOULD have a tip:** (a) first encounter of a phenomenon in deck order (priority then id; starterSeq for Spanish starter cards), (b) a genuine trap where the English default guess is wrong, (c) a "wait, why?" moment specific to this sentence, (d) idiom whose literal logic illuminates.
- **Per-phenomenon repetition budget: max 3 tellings**, different angle each: ① introduce, ② contrast, ③ edge case/trap. Every telling quotes material from its own card. Phenomenon identity = a slug assigned during audit (finer than grammarNode, e.g. `es:tener-idioms`, `de:verb-final-sub-clause`), stored in audit artifacts only (no deck.json schema change).
- **Target coverage by node tier — CORRECTED to the actual six-tier sectioning in grammarDescriptions.ts** (verified: A1 = nodes 01–08, A2 = 09–15, B1 = 16–21, B2 = 22–27, C1 = 28–31, **C2 = 32–35** — draft 1's five-tier 8-node-block mapping does not match the file):
  - A1 (01–08): 30–40%
  - A2 (09–15) & B1 (16–21): 20–25%
  - B2 (22–27): 10–15%
  - C1 (28–31) & C2 (32–35): 8–12%, skewed to idiom-logic and register
  - **Global target: 18–25% per language.** ko/el/id shrink (de-glossing from 35–41%); hi/tr/ru/cy grow from 3.6–8.6% mostly-duplicates to ~18–20% authored. Note tier-2 decks are smaller than 3,933 (cy 3512, hi 3172, tr 3117, ru 3174), so Wave D authoring is ~560–700 tips per language, not 700+.

---

## 3. Format spec

- **Structure: HOOK → RULE → THIS-CARD EXAMPLE.** Hook = the surprise or stake in ≤1 clause; rule in plain words; worked example **quoting a phrase from this card's own `target`**.
- **The quote rule is load-bearing:** ≥1 content token from the card's `target` inside the tip makes relevance machine-checkable — but it is a FLOOR (hi-0446 proves a token can match while the tip is wrong). One extra sibling example allowed after the card's own.
- **Length: ≤200 chars hard cap, 90–160 target.** (Corpus reality: median 96, p90 147, max 197; es-2244 — the corpus's best tip — is 187 and must pass its own doctrine. Draft 1's 160 hard cap would have failed it; the historical 120 is far too tight.)
- **One rule per tip.** The second interesting thing waits for another card under the phenomenon budget.
- **Plain text only:** no backticks, asterisks, or markup — the UI renders raw text. (New rule; ~800 current tips violate it.)
- **Romanization:** non-Latin scripts (hi, ru, ko, el) romanize every quoted target-script chunk in parens: `के पास (ke paas = near)`. Latin-script languages: no parens gloss unless pronunciation IS the point.
- **Voice:** intriguing, second person, concrete, zero textbook hedging. Banned jargon list: postposition, auxiliary, nominalizer, copula, oblique. Contractions welcome.

**Five exemplar rewrites (real bad → doctrine-compliant):**
1. es-0361 (No encuentro mis gafas de sol) → "'No encuentro' = 'I can't find' — Spanish skips the 'can'. Failing at something is just the plain verb + no: no veo, no oigo."
2. de-0158 (Mittagspause / Spaziergang) → "You don't 'take' a walk in German — you make one: 'einen Spaziergang machen'. Same with photos: 'ein Foto machen'."
3. ru-0505 (Дождь идёт) → "Rain walks in Russian: дождь идёт (dozhd' idyot = rain goes). Snow too: снег идёт. Weather is always on foot."
4. ko-2314 (면접 때문에 너무 긴장돼요) → "긴장돼요 (ginjang-dwaeyo) uses 되다 = 'become': nerves are something that happens to you in Korean, not something you are."
5. hi-0009 (मुझे ज़ोरों की भूख लगी है) → "Hunger strikes you in Hindi: भूख लगी है (bhookh lagi hai = hunger has struck). Thirst and cold too: प्यास लगी है. You're the target, not the doer."

---

## 4. QA pipeline (reusable, modeled on the Hindi usefulness-pass fan-out)

Prior-art scripts verified in-repo: `scripts/check-welsh-coherence.cjs`, `scripts/welsh-salad-snapshot.json`, `scripts/rewrite-hindi-tips.cjs`, `scripts/add-grammar-tips-{hi,hi-v2,ru,tr}.cjs`.

**Stage 0 — Extract:** `scripts/extract-tips.ts <lang>` → `scripts/tips-<code>.jsonl` rows `{id, target, english, node, tip}`. Handles both deck formats (numeric ids nl/cy; string ids elsewhere) AND the 30 Hindi `hi-S-###` starter-review ids.

**Stage 1 — Machine linter (permanent regression guard): a new check inside `scripts/audit-lang.ts`** — NOT a standalone .cjs. Rationale (verified): audit-lang.ts already runs under tsx (`npm run audit:langs`), already imports `REGISTRY` from `src/languages/registry.ts` (a .cjs script cannot import the TS registry at all), already has baseline-regression semantics against `docs/audit-baseline.json`, and `.github/workflows/language-audit.yml` already triggers it on every push touching `src/data/**` — CI wiring is free. Note: every ScriptDescriptor currently uses whitespace `wsTokenize` (verified lines 56–137), which is adequate for all 14 shipped languages; the "script-aware tokenization" framing matters only if Japanese ever lands. Checks:
- *Relevance gate:* tip contains ≥1 normalized content token (stopword-filtered, length threshold tuned per script — Devanagari/Hangul tokens are short in code points) from the card's `target`.
- *Exact-dup detector:* identical tip on >1 card → fail. (Would catch the 82-card German template and the 7-card Russian stamp today.)
- *Near-dup detector:* normalized 4-gram shingle Jaccard > 0.6 → fail unless whitelisted in `scripts/tip-budget-<code>.json` (phenomenon slug → ≤3 card ids).
- *Format:* ≤200 chars; backtick/markup ban; non-Latin scripts need `(romanization = gloss)` parens covering target-script runs; banned-phrase regexes ("stem change", "conjugation", node-label restatements); jargon list.
- *Snapshot regression:* known-bad tips (`scripts/tip-bad-snapshot-<code>.json`, mirroring welsh-salad-snapshot.json) may never reappear.
- *Baseline mode:* un-audited languages report but don't fail (audit-lang.ts's existing pattern), so the linter can land in P0 without blocking CI on 13 unfixed languages.

**Stage 2 — Classify (LLM fan-out, ~25 parallel subagents):** each tip → `{verdict: KEEP | REWRITE | DROP, taxonomy_label, defects[], phenomenon_slug}` (MIGRATE_TO_ETYMOLOGY removed as a verdict — see Decisions; a `gloss_worth_keeping` boolean flag is retained in the artifact so a future etymology project can mine it). Also flags no-tip first-encounter cards deserving an ADD.

**Stage 3 — Rewrite/author:** doctrine prompt (taxonomy + §3 verbatim) rewrites REWRITEs and authors ADDs against the phenomenon budget ledger. Output = id-keyed patch; `scripts/apply-tip-fixes.cjs` applies id-stably, touching ONLY the `grammar` field — no audio, no `audio-cache-vN`/`AUDIO_VERSION` bump, no id churn.

**Stage 4 — Adversarial verify (separate agents, fresh context):** per tip: (a) factually correct for this language? (b) true of THIS sentence (the hi-0446 test)? (c) duplicates a kept angle within the phenomenon? (d) format-compliant? Any failure → DROP. Bias to drop, never to keep — the coverage policy makes dropping free.

**Stage 5 — Gate:** linter green + verify green + coverage within tier bands → language eligible for the allowlist.

---

## 5. Rollout

**Flag refactor (do first, trivial):** replace the boolean with a per-language allowlist in featureFlags.ts:
```ts
import type { Language } from '../types'; // type-only import, no cycle
export const GRAMMAR_TIPS_LANGS = new Set<Language>([]);
export const showGrammarTips = (lang: Language) => GRAMMAR_TIPS_LANGS.has(lang);
```
**4 usages change across 2 files** (StudySession.tsx lines 377, 439, 441 using `session.language`; PlacementTest.tsx line 476 using its `lang` prop — both verified in scope). Keep a global kill switch if desired.

**Sequencing: audit → fix → verify → add lang to allowlist**, one language at a time, shippable per-language.

**Pilot: Spanish.** Biggest audience + Reddit showcase; `?starter=es` locked starter mode (verified in App.tsx STARTER_LOCK, `src/data/spanish-starter-manifest.json`) means new users hit Spanish first; 706 tips at 97% unique = audit-prune-rewrite, not authoring. Second: **Korean** (exercises romanization + de-glossing + the non-Latin linter path).

**Waves + effort:**
- Wave A (pilot): Spanish — 1 session. Includes 43 over-length + 40 backticked tips and the calibration loop for the near-dup threshold.
- Wave B (new-wave de-gloss): ko, el, id — ~1 session each (1,515/1,629/1,379 tips; mostly KEEP/DROP classification + verify; zero backtick debt).
- Wave C (legacy): fr, it, pt, de, nl, sv — ~1–1.5 sessions each. German is the heavy one: the compound-noun template alone is 82 cards, and legacy German has confirmed mismatch-class defects (de-0158, de-0414) — treat legacy as "verify everything", not "prune the obvious".
- Wave D (script-stamped re-author): tr, ru, cy, then hi — ~1.5–2 sessions each (strip stamps incl. ru's 79 over-length/245 backticked tips; author ~560–700 tips per language to policy). **Hindi last, after the naturalness review (task #87)** — rewriting tips against sentences that will change is double-work. Welsh audio-field misalignment is irrelevant (tips are text-only).
- Launch posture: ship Reddit with Waves A+B unhidden; C/D stay hidden — partial coverage is invisible, bad tips are not.

**Cost:** $0 TTS (tips never voiced; the audio-cache-bump rule does not apply — verified apply path touches only `grammar`). LLM subagent cost only, phased per wave, comparable per-language to the Hindi usefulness pass.

---

## 6. UI when re-enabled

Current (verified): amber "Grammar" chip pinned top-right, renders on BOTH sides; tap → centered amber modal (BookOpen icon, Save-to-Favorites star); etymology chip below it is already `isFlipped`-gated; PlacementTest shows the tip inline after reveal.

1. **Gate the chip behind `isFlipped`** — StudySession.tsx lines 439+441 (two conditions, not one — the container check at 439 must also change or an empty chip-stack div renders front-side). Matches the etymology chip's existing behavior; doctrine tips explicitly quote the answer sentence, so front-side display leaks the answer.
2. **Rename chip "Grammar" → "Why?"** — reads as intrigue, not homework. Keep amber modal, BookOpen, Save star.
3. **Once-per-phenomenon pulse (defer post-launch):** "new" dot on first encounter of a phenomenon (localStorage set of seen slugs + tiny per-lang slug map from the pipeline). Nice, not required.
4. **Placement test:** keep inline rendering; GRAMMAR_NUDGES are a separate node-level system, out of scope.
5. **Favorites:** `toggleGrammarFavorite(card.grammar, session.language, card.target)` and `isGrammarFavorited(card.grammar, …)` (verified lines 190–191, 391) key on tip TEXT — rewrites orphan the favorited-state indicator on rewritten cards, but saved favorites keep their text+example. Acceptable; note in PR, no migration.
