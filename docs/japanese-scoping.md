# Japanese in LangLab — 300-card graded starter first, 3,933 parity later (feasibility-corrected)

> Scoping document — no implementation yet. Design was adversarially feasibility-checked against the actual codebase.

## Executive summary

Feasibility review verified the design's core mechanics against the repo — the doubled-prefix audio convention, starter hydration/lock machinery, ko-precedent dictionary/conjugation shapes, manualChunks, and cache-bump pairs all check out — but found the tokenization work surface understated roughly 2x: it is ~16 whitespace-split sites across 5 files plus a class of length-threshold heuristics (dud filter <3 chars, vocab key skip <2 chars, tile bands, font sizing) that silently break CJK even after splits are fixed, including a zero-duds tile bug and a whole-sentence-as-one-vocab-entry bug. Three claims were corrected: STARTER_LOCK is already a map (two one-line additions, not a refactor), the placement prompt is verifiably NOT gated in starter mode today (a required one-line fix that also fixes the live Spanish starter), and the Supabase-sync-strips-tokens risk is moot (sync moves progress rows, never deck content). Two missing registration items were added — NODE_NAMES.japanese (the fallback shows Romance-flavored node names in TopicMap) and CHALLENGE_NAMES/CONJUGATE_FNS entries — and ja-JP-Chirp3-HD-Aoede availability is flagged as unverifiable from this environment, requiring a 1-card smoke test before the batch. Corrected total: ~5-7 working days to the ?starter=ja milestone, ~$0.20-0.25 TTS, parity as a later XL phase with zero rework.

## DECISIONS — LOCKED 2026-07-21

1. **Pre-tokenized `tokens` field** (Intl.Segmenter fallback only) — per reco.
2. **Furigana: user-facing ON/OFF toggle from day 1, and it must be VISIBLE** (not buried) — CHANGED from reco (always-on). P1 gains a furigana toggle in the study surface (e.g. a small ふ/A pill on the card header) + persisted in settings; default ON.
3. **No romaji field/toggle** — Korean precedent (romanization in dictionary + tips only) — per reco.
4. **?starter=ja link only; Japanese hidden from the picker until parity** — per reco.
5. **NODE_NAMES + all 35 GRAMMAR_NUDGES written now** — per reco.
6. **TTS approved** (~$0.20–0.25 for the 300 batch) — 1-card smoke test of ja-JP-Chirp3-HD-Aoede first, per the standing cost-confirmation rule.
7. **Register: polite です/ます starter-wide, plain form deferred to node 19+** — per reco. User adds: the politeness system SHOULD be explained in the Japanese grammar tips — but sparingly, per the tips doctrine's repetition budget (a handful of well-placed tips, not a stamp).

## Decisions (original list, for reference)

1. Tokenization source of truth: pre-tokenized tokens field on Japanese cards with Intl.Segmenter only as fallback (RECOMMENDED) vs pure runtime Intl.Segmenter — pre-tokens buy determinism, browser independence, and the every-token-has-a-dictionary-entry lint guarantee for near-zero authoring cost.
2. Furigana model: kana-only seq 1-50, then always-on ruby furigana on all kanji (RECOMMENDED for v1; add a hide-furigana setting later) vs a furigana toggle from day 1 vs a kanji-free starter (rejected — not real Japanese).
3. Romaji: no romanization field or display toggle — Korean precedent verified in src/data/dictionary/ko.ts (Hepburn-style romanization lives in the dictionary ipa field) and grammar-tip parentheticals (RECOMMENDED) vs introducing a per-card romanization field (sets a 15-language schema precedent to serve one language's crutch).
4. Exposure at starter stage: ?starter=ja link only, Japanese hidden from the main language picker until parity (RECOMMENDED — protects the 3,933-parity expectation for the Reddit launch). Note this requires keeping japanese OUT of DECK_LOADERS/availableLanguages while adding it to the Language union — TS exhaustive Records (CHALLENGE_NAMES, GOOGLE_VOICE_MAP) still need ja entries; decide whether to add a visible '(beta)' picker entry instead and skip the hiding complexity.
5. GRAMMAR_NUDGES + NODE_NAMES timing: both are Partial records falling back to Spanish/Romance-flavored text. NODE_NAMES ja (35 display names) is REQUIRED for the starter (TopicMap shows node names in normal study UI). GRAMMAR_NUDGES ja is placement-test-only UI — RECOMMENDED to write all 35 now while the ladder is fresh, but it can defer to P5 since placement is gated in starter mode (Korean shipped without ko nudges).
6. TTS spend approval per the cost-confirmation rule: ~$0.20-0.25 for the 300-card batch, ~$2-4 later for parity — trivial but requires an explicit go before running generate-audio, and a 1-card smoke test first because ja-JP-Chirp3-HD-Aoede availability is unverified from this environment.
7. Register canon: polite です/ます starter-wide with plain form deferred to node 19+ (RECOMMENDED, mirrors Korean's 해요체 policy; registry.ts requires the policyDoc + offenderLexicon artifacts) vs mixing plain form in early.

## Phased plan

| Phase | Size | Deliverable |
|---|---|---|
| P0 — Platform registration: Language union + LANGUAGE_CONFIG + QuestCard.tokens typing (src/types.ts), registry ja entry + ScriptDescriptor + register-policy doc/offender lexicon, CHALLENGE_NAMES + GOOGLE_VOICE_MAP entries (TS-forced), resetAll, NODE_NAMES.japanese 35-name block, 35 GRAMMAR_NUDGES, empty deck scaffold, STARTER_LOCK placement-prompt guard (App.tsx:918 — also fixes the live Spanish starter) | S | App type-checks and builds with a registered-but-hidden Japanese language; deck-japanese chunk exists; audit CLI runs against the ja entry; placement prompt no longer fires in any ?starter= mode |
| P1 — CJK-proof the text pipeline: shared tokenizeTarget helper + tokens prop through WordPopover(:203)/StudySession(:535)/ListenMode(:133); challengeService token API (scrambleWords/buildTiles/eligibility/sort at :25,:45,:75,:90,:106-107,:126,:133) INCLUDING the generateDuds <3-char gate, fullwidth punctuation in normalizeTileWord, and tile-eligibility floor; vocabService ja keying (whole-sentence-as-one-key bug + key.length<2 single-kanji skip); TargetText ruby component + lang attr on every render surface + CSS; char-count font sizing for ja; Intl.Segmenter fallback tokenize | M | A 10-card hand-written sample deck renders with tappable tokens, furigana, working tiles WITH duds, correct vocab entries, and sane font sizes; zero behavior change for the other 14 languages (regression-check tiles + vocab on Spanish and Korean) |
| P2 — Content: 6 authoring waves (300 cards + tokens + readings + tips), ~550-entry dictionary, conjugation engine v1 (godan/ichidan/irregular; masu/te/ta/nai + i-adjectives), lint-ja-deck.cjs gates, adversarial verify, QA doc | L | 300 lint-clean, adversarially-verified cards with 100% dictionary tap coverage and green findInfinitive round-trip |
| P3 — Audio: 1-card ja-JP-Chirp3-HD-Aoede smoke test (voice availability unverified) then, after cost confirm, generate 300 ja-ja-NNNN.mp3; counter/date-weighted listen spot-check + ttsText overrides BEFORE R2 upload; audio-cache-v19 + AUDIO_VERSION '19' bump together; CANONICAL-VOICES.md row + registry/GOOGLE_VOICE_MAP triple-match | S | All 300 cards play native-quality audio in the app; encoder-signature audit clean; single cache bump |
| P4 — Starter ship: japanese-starter-manifest.json (300 ids, starterSeq, themes), extract buildStarter() from starterDecks.ts + JAPANESE_STARTER export, two map entries in App.tsx (STARTER_LOADERS + STARTER_LANG_BY_CODE), on-device QA at mobile breakpoint (ruby legibility, single-kana tile width) | S | Shareable ?starter=ja link boots the locked 300-card graded Japanese starter — the shippable milestone |
| P5 — Parity expansion (later): append ja-0301..ja-3933 across nodes 1-35, dictionary to 3,500+, engine stage 2 (potential/conditional/keigo), DECK_LOADERS + picker entry, un-gate placement test | XL | Japanese at full 3,933-card parity with the other 14 languages (~$2-4 additional TTS) |

**Total effort:** ~5-7 focused working days to the shippable ?starter=ja milestone (P0 0.5d; P1 1.5-2d — grown to cover the full 16-site + length-heuristic CJK-proofing surface; P2 2-3d dominated by authoring waves; P3+P4 1d combined) plus ~$0.20-0.25 TTS after a 1-card voice smoke test; parity expansion (P5) is a separate multi-week XL with ~$2-4 additional TTS.

## Risks

- Intl.Segmenter fallback varies by browser/ICU version and is absent in Firefox <125 — anything leaning on it beyond the audit CLI inherits nondeterminism; card rendering must always prefer card.tokens.
- Length-threshold heuristics are the second, sneakier breakage class beyond splitting: generateDuds' <3-char filter (zero duds for ja), vocabService's <2-char key skip (drops single-kanji words), tile-eligibility 5-12 word bands, and word-count font sizing all silently misbehave for CJK even after every split call site is fixed — P1 must treat thresholds, not just splits, as the work surface.
- ja-JP-Chirp3-HD-Aoede availability could NOT be verified from this environment (no Google voice-catalog access); the repo's own history shows Chirp3-HD burned this project once before (half-length audio on non-Latin scripts, later fixed) — do a paid 1-card smoke test and human listen BEFORE the 300-card batch, with ja-JP Neural2/Wavenet as fallback.
- TTS kanji misreadings (counters/dates like 一人・二日 are the known weak spot at N5) — mitigated by a counter-weighted listen spot-check and the per-card ttsText kana override; catching them after R2 upload costs an extra cache-version bump.
- Han-unification glyph errors if lang="ja" tagging is skipped on any target-text surface (StudySession card, popover, tiles, favorites, vocab list, placement) — audit every render site.
- Future components that split target on \s silently degrade ja to one-giant-word — funnel all splitting through the shared tokenizeTarget helper and add a lint/grep guard to lint-ja-deck.cjs or CI.
- Hiding Japanese from the picker while it exists in the Language union means every exhaustive Record<Language,...> (CHALLENGE_NAMES, GOOGLE_VOICE_MAP, DECK_LOADERS) needs a ja entry anyway; DECK_LOADERS inclusion would surface ja in availableLanguages (App.tsx:718 derives the picker from it) — the hiding mechanism needs a deliberate exclusion and a test, or accept a '(beta)' picker entry.
- Authoring quality is the schedule long pole: particle choice (は/が) and counter usage are exactly where LLM-authored Japanese slips — the adversarial verify wave and N5 lexicon gate are load-bearing, not optional.
- Unverified: exact Intl.Segmenter morpheme boundaries per browser (the 食べました split example is representative, not tested here), and real-device ruby rendering metrics on Android system fonts — both are P1 sample-deck test items rather than design blockers.

---

## Full design

.# Japanese for LangLab — scoping design (feasibility-corrected against the repo)

Repo: `/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones`

## 1. The script problem

### 1a. Tokenization for word-tap — recommendation: **pre-tokenized deck field, Intl.Segmenter as fallback**

Three options evaluated:

| Option | Pros | Cons |
|---|---|---|
| `Intl.Segmenter('ja', {granularity:'word'})` | Zero bundle, built into Chrome 87+/Safari 14.1+/Firefox 125+ | ICU morpheme splits vary by browser/ICU release (conjugated verbs like 食べました may split mid-morpheme) — breaks deterministic dictionary lookup and word-tile answers; Firefox <125 has nothing |
| Spaced-kana text | Trivial | Not real written Japanese; defeats the "bridge to native content" purpose; TTS prosody suffers |
| **Pre-tokenized deck field** | Deterministic; tokens authored together with the dictionary so **every token is guaranteed a lookup hit** (a lint gate, not a hope); tiles/word-counts stable across browsers; particles become their own tappable units (pedagogically right for は/が/を/に/で) | Deck schema addition; trivial authoring cost in LLM-wave authoring |

Concrete schema (additive; `buildDeck` in App.tsx:120 spreads raw cards `{...c}` so the field flows through at runtime — the only typing work is adding `tokens?: {t: string; r?: string}[]` to `QuestCard` in src/types.ts:4 and to `RawDeckCard` in src/data/starterDecks.ts):

```jsonc
{
  "id": "ja-0051",
  "target": "私は学生です。",
  "english": "I am a student.",
  "tokens": [
    { "t": "私",   "r": "わたし" },
    { "t": "は" },
    { "t": "学生", "r": "がくせい" },
    { "t": "です" },
    { "t": "。" }
  ],
  "audio": "ja-ja-0051.mp3",
  "tags": ["general"], "grammarNode": "node-02", "priority": 51
}
```

Lint invariant: `tokens.map(x => x.t).join('') === target` exactly (Welsh-style regression guard).

Runtime: add a `japanese` `ScriptDescriptor` to `src/languages/registry.ts` (pattern at lines 104–119: the hangul descriptor already carries a custom `formMatches`) whose `tokenize()` uses `Intl.Segmenter('ja')` for arbitrary strings (audit CLI, free text), but **card rendering reads `card.tokens` directly**. Registry entries also require `registerPolicy.policyDoc` + `offenderLexicon` paths (every existing entry has both) — write `docs/japanese-register-policy.md` + `docs/japanese-register-offenders.json` in P0.

### CORRECTED: the whitespace-split surface is ~16 sites in 5 files, plus latent length-threshold heuristics

Grep of `split(/\s+/)`-family calls (all verified by line):

- `src/components/WordPopover.tsx:203` — sentence render/tap split. Add optional `tokens?` prop; punctuation tokens (。、) render non-tappable. WordPopover is rendered from exactly one place (StudySession.tsx:550), so the prop threads through one call site. Lines **521/549/646** split conjugation *forms* on whitespace for table-highlight matching — Japanese v1 forms are single-word so these mostly no-op, but verify with the te-form table.
- `src/components/StudySession.tsx:30` — inside `findCardEtymology` (etymology token scan, **not** a word count as previously claimed). Harmless for ja: `lookupEtymology` returns null for languages without a TABLES entry. No change needed.
- `src/components/StudySession.tsx:535` and `src/components/ListenMode.tsx:133` — **font-size band selection**, not gameplay. For ja, word counts are meaningless AND character counts are the right signal (a 12-char kanji sentence at text-3xl with ruby is fine; a 30-char one is not). Route both through a shared `displayLengthFor(card)` helper: token count for tokenized decks feeding the same bands, or switch ja to char-count bands. Include ruby headroom testing here.
- `src/services/challengeService.ts` — the deep end. Split sites at **25 (scrambleWords), 45 (generateDuds), 75 (buildTiles), 90/126/133 (eligibility word counts), 106–107 (sort comparators)**. Three additional CJK landmines that survive a naive split fix:
  1. `generateDuds` (line 47) skips candidate words `< 3` chars — **nearly every Japanese word is 1–3 chars (学生, 水, 行く), so dud generation produces zero duds**. Gate the length filter per-language (for ja: skip 1-char kana particles only).
  2. `normalizeTileWord` (line 6) strips only Western punctuation — fullwidth 。、！？「」 pass through. With token-based tiles, punctuation tokens are excluded upstream, but normalize must still handle a trailing 。 glued to です in author error cases; the lint gate makes punctuation its own token so this is defense-in-depth.
  3. Eligibility bands (5–12 "words") translate to token counts acceptably, but recheck against real starter sentences — a typical N5 sentence is 4–7 non-punctuation tokens, so consider lowering the tile floor to 4 for ja or many cards never qualify.
  API change: `scrambleWords`/`buildTiles` take `sentence: string` today and `WordTileChallenge.tsx:27` calls `buildTiles(card.target, siblingCards)` — change these to accept the card (or `tokens`), with the whitespace path as fallback for the other 14 languages. `buildChallengeQuestions` (App.tsx:573) and `selectTileCandidates` (App.tsx:475) ride along.
- `src/services/vocabService.ts:9,17` — `tokenizeSentenceWithCase` splits on whitespace after stripping Western punctuation, so **an unfixed ja card records the entire sentence as one garbage vocab entry** (it passes the length filter). Also: line 335's `key.length < 2` skip silently drops every single-char word (私, 水, 本, 木) — must be per-script. Add a ja branch keyed on card tokens (kanji surface as the vocab key), and optionally a `COMMON_WORDS.japanese` particle set (absent = `isCommonWord` returns false, which is safe but noisy).

Funnel rule (unchanged, now more load-bearing): all future target-text splitting goes through one shared `tokenizeTarget(card | string, language)` helper so a fifteenth call site can't silently regress ja to one-giant-word.

### 1b. Furigana — recommendation: **kana-only ramp, then kanji with always-on ruby**

- **seq 1–50: kana-only cards** (no kanji in `target`; lint-enforced). `tokens` still present, no `r` needed.
- **seq 51–300: normal kanji+kana with `r` on every kanji-bearing token** (lint gate: any token matching the Han range carries `r`). Rendered as `<ruby>{t}<rt>{r}</rt></ruby>` by a small shared `TargetText` component used by StudySession/WordPopover.
- Rejected: kanji-free entire starter (fake Japanese) and a furigana toggle for v1 (later setting; always-on is correct for N5).
- CSS: `line-height: ~1.9` and `lang="ja"` on the target-text container. `lang` is **required**, not cosmetic — Han-unified codepoints render Chinese glyph variants on some systems without it. `LANGUAGE_CONFIG` already carries `bcp47` per language (src/types.ts:132) — set `lang={LANGUAGE_CONFIG[lang].bcp47}` and audit every render surface (StudySession card, WordPopover popover text, tiles in WordTileChallenge/ChallengeScreen, FavoritesList, VocabList, PlacementTest).

### 1c. Romaji — recommendation: **no romanization field; follow the Korean precedent exactly**

Verified: no deck has a romanization field; `src/data/dictionary/ko.ts` puts romanization in the `ipa` field (`"학생": {en, ipa: "haksaeng", ...}`) and grammar tips carry romanization parentheticals. Japanese does the same: Hepburn rōmaji in dictionary `ipa`, tips like `学生 (gakusei = student)`. The kana ramp + always-on furigana removes the need for a romaji toggle. A per-card romanization field would be a 15-language schema precedent to serve one language's crutch — don't.

## 2. The 300-card starter as a standalone deck

Unlike Spanish (a manifest *selecting* from a 3,935-card deck), Japanese's main deck **starts at 300 cards** and the manifest covers all of it. Same machinery, no special case:

- **Deck**: `src/data/japanese/deck.json`, ids `ja-0001`..`ja-0300`, `priority` 1..300. The vite `manualChunks` regex (vite.config.ts:47–51, `[/\\]data[/\\]([a-z]+)[/\\]deck\.json$`) yields `deck-japanese` automatically. Note `buildDeck` sorts `a.id - b.id` (NaN no-op for string ids, stable) then by `priority` — priority is the load-bearing order, as with hi/ko.
- **Manifest**: `src/data/japanese-starter-manifest.json` — `{id, starterSeq, themes}` for all 300, hydrated like `SPANISH_STARTER`. `src/data/starterDecks.ts` is only 104 lines; extract `buildStarter(deck, manifest)` and export `JAPANESE_STARTER`.
- **Lock — CORRECTED**: App.tsx **already has the map structure**: `STARTER_LOADERS: Partial<Record<Language, loader>>` (line 111) and `STARTER_LANG_BY_CODE: Record<string, Language>` (line 114). The work is two one-line additions (`ja: 'japanese'`, japanese loader), not a generalization refactor. `?starter=ja` then boots locked with goal pinned to `general` (line 286) and the switcher disabled (line 831–839).
- **Placement gating — VERIFIED, work required**: the Study button (App.tsx:918) fires the placement prompt on `!isPlacementComplete(lang)` with **no STARTER_LOCK guard — the prompt appears in starter mode today**, including the live Spanish starter. Add `!STARTER_LOCK &&` to the condition (fixes Spanish too). `selectPlacementCards` (placementService.ts) handles empty nodes gracefully, so nothing crashes, but placement against an 18-node deck places on a compressed scale — keep it gated until parity.

**Extension to 3,933 without rework** — three invariants, enforced from day 1:
1. **Ids never renumber.** Expansion appends `ja-0301`..`ja-3933`; ordering via `priority`. SRS state and Supabase sync (which moves localStorage progress rows keyed by card id — never deck content) survive untouched.
2. **The 35-node ladder is fixed now**; the 300 starter populates nodes 1–18 thinly, expansion densifies. `grammarNode` values on starter cards never change.
3. **The manifest stays valid forever** — it references ids; the Spanish hydration pattern drops missing ids gracefully.

**Grammar-node ladder (nodes 1–12 explicit, 13–35 sketched):**

| Node | Topic | Example |
|---|---|---|
| 01 | Greetings & set phrases | こんにちは。ありがとうございます。 |
| 02 | XはYです — topic + polite copula | わたしはがくせいです。 |
| 03 | Questions with か; はい/いいえ; じゃないです | にほんじんですか。 |
| 04 | これ/それ/あれ/この demonstratives | これはなんですか。 |
| 05 | が subject; あります/います existence | ねこがいます。 |
| 06 | を + verbs, polite present ます | パンを食べます。 |
| 07 | に/へ — direction, time, location-of-existence | 学校に行きます。 |
| 08 | で — location of action, means | 電車で行きます。 |
| 09 | ません negative; ませんか invitations | 飲みませんか。 |
| 10 | ました past; ませんでした | 昨日見ました。 |
| 11 | i-adjectives (〜い/〜くない/〜かった) | 高いですね。 |
| 12 | na-adjectives + です | 静かな町です。 |
| 13–18 | の linking; counters/numbers/time; も・と・や; てください; て-form sequencing + ている; たい / 好き | (starter tops out here) |
| 19–27 | plain form + んです; た + たことがある; ない; potential; より/ほうが; から/ので/けど; ましょう; あげる/くれる/もらう; と/たら conditionals | (expansion) |
| 28–35 | relative clauses; なければ obligation; てもいい; そう/よう; basic keigo; casual contractions; と思う/と言う; native-style | (expansion) |

**Node display names — NEW REQUIRED ITEM**: `NODE_NAMES` in src/data/topicConfig.ts:83 is a Partial record covering only the original 11 languages; the fallback is `MAIN_PATH` English defaults with Romance framing ("Ser/Essere vs Estar/Stare", "Gustar/Piacere & reverse verbs") — shown in TopicMap (normal study UI) and PlacementTest. Korean/Greek/Indonesian currently fall back (existing wart); for ja, whose ladder redefines node semantics, the fallback is nonsense. Write the 35-entry `NODE_NAMES.japanese` block in P0 alongside the ladder.

**Graded seq bands** (mirrors the Spanish starter curve documented in starterDecks.ts):
- seq 1–50: nodes 1–4, **kana-only**, 3–6 tokens
- seq 51–150: nodes 5–10, kanji+furigana begins, core particle drills
- seq 151–250: nodes 11–16, adjectives, counters, first て-forms
- seq 251–300: nodes 17–18 + mixed-node natural sentences (the "bridge" band)

Themes: same `StarterTheme` union, balanced like the Spanish QA doc.

**Register policy** (mirrors Korean's 해요체 canon, which is enforced in the ko conjugation header): canonical register is **polite です/ます**; plain form appears only as taught content in node 19+. The policy doc + offender lexicon are registry-required artifacts (P0).

## 3. Dictionary + conjugation scope for 300 cards

**Dictionary** — `src/data/dictionary/ja.ts`, shape identical to ko.ts (`DictEntry {en, ipa, pos, lemma?}`; `ipa` = Hepburn rōmaji).
- **Keys = surface tokens exactly as they appear in `tokens[].t`** — kanji surface where the card writes kanji (学生), kana keys added for words appearing kana-only in seq 1–50 (がくせい). Both key to the same data. Plus the lint gate "every non-punctuation token resolves via lookupWord" = 100% tap coverage by construction.
- `lookupWord`: exact match → strip trailing particles longest-first (は・が・を・に・で・へ・と・も・から・まで・の・ね・よ) → retry. Same layering as ko's particle stripping (ko.ts:6252–6280). With pre-tokenized cards this fallback serves Intl.Segmenter output (audit CLI, free text).
- Volume: ~450–600 entries. Parity target later: 3,500+.

**Conjugation** — `src/data/conjugation/ja.ts`, modeled on the ko.ts Stage-1 scaffold (verified 481 lines, IRREGULARS map + algebraic core):
- Classes: **godan** (9 ending rows う/く/ぐ/す/つ/ぬ/ぶ/む/る — pure kana suffix swaps, simpler than ko's jamo arithmetic), **ichidan** (drop る), **irregulars** する/来る (きます・きて) plus 行く→行って and ある→ない.
- v1 tenses (what nodes 1–18 surface): ます / ません / ました / ませんでした, te-form, plain dictionary form, plain ない. **Include i-adjective tables** (くない/かった/くなかった) for node 11; na-adjectives are copula constructions (no engine work).
- ~60 KNOWN_VERBS seed (every verb in the starter), stored with kanji + kana surfaces so `findInfinitive` works from either. Reverse index from generated forms keeps the audit round-trip green (registry `findInfinitive: null` = audit failure).
- Stage 2 (parity): potential, volitional, conditional, passive/causative, keigo — documented in the file header like ko's Stage-2 note.

## 4. Audio

- **Voice**: `ja-JP-Chirp3-HD-Aoede`, keeping the one-female-voice canon (hi/id/el/ko all standardized on Chirp3-HD-Aoede; the audioService comment confirms the earlier Aoede-on-non-Latin problem was fixed and re-verified). **Caveat: ja-JP Chirp3-HD availability was not verifiable from this environment** — run a 1-card `--dry-run` + live smoke test before the batch; fall back to ja-JP-Neural2/Wavenet-B if absent. Add the row to `scripts/CANONICAL-VOICES.md`; the registry voice spec and `GOOGLE_VOICE_MAP` (audioService.ts:135 — an **exhaustive** `Record<Language | 'msa', ...>`, so TS forces the ja entry the moment the union grows) must match — the audit compares all three.
- **Pipeline**: add to `LANG_DEFAULTS` in scripts/generate-audio.cjs (lines 47–62): `ja: { voice: 'ja-JP-Chirp3-HD-Aoede', prefix: 'ja', deckDir: 'japanese' }`. `audioFilename()` (line 76, `prefix + '-' + cardId`) yields the doubled-prefix convention automatically: `ja-0001` → **`ja-ja-0001.mp3`**, flat in `public/quest-audio/`, same as hi-hi/ko-ko (verified against the Korean deck: `ko-0001` / `ko-ko-0001.mp3`).
- **Cost**: 300 cards × ~15–25 chars (Japanese is character-dense) ≈ 5–8k chars of Chirp3-HD ≈ **$0.20–0.25** (parity ≈ $2–4). Per the cost-confirmation rule, confirm before running even this.
- **Kanji-misreading risk**: TTS reads `target`. N5 vocab is high-frequency so misreads are rare, but counters/dates (一人・二日) are the known weak spot. QA = encoder-signature audit + ~20-card human listen, weighted toward counter/date cards. Escape hatch: per-card `ttsText` kana override fed to the generator — additive, and it must land BEFORE R2 upload to avoid a second cache bump.
- **Cache**: bump BOTH `audio-cache-vN` (vite.config.ts:146, currently v18) and `AUDIO_VERSION` (audioService.ts:34, currently '18') together, plus R2 upload.

## 5. UI impacts beyond tokenization

- **Font**: no webfont — Noto Sans JP subsets are 1.5MB+. System CJK fonts are excellent. Extend the stack at src/index.css:65 (`'Hiragino Sans', 'Yu Gothic'` before sans-serif) and set the `lang` attribute everywhere (the load-bearing part — see 1b).
- **Sizing**: ruby needs `line-height ~1.9`; keep kanji at/above current sentence size (small kanji under ruby is illegible; test the mobile breakpoint). Font-size bands per the corrected split-site list use char count for ja.
- **Listen mode**: works once the ListenMode:133 sizing fix lands (no tappable words there — verified WordPopover is used only by StudySession).
- **Word tiles**: token-based tiles per 1a **including the dud-length and normalization fixes** — without the `generateDuds` length-gate fix, ja tile challenges silently ship with zero distractors. Particles as separate tiles is a feature (particle drills). Repeated particles (は twice) are fine — `checkTileAnswer` sort-compare handles duplicates. Check min tile width for single-kana tiles on mobile.
- **Placement test**: gated in starter mode via the verified one-line STARTER_LOCK guard (App.tsx:918). Enable properly at parity.
- **`?starter=ja`**: two map entries (section 2). Language switcher already disabled in lock mode.
- **Registration checklist** (CORRECTED, all verified by line): `Language` union (src/types.ts:1) + `LANGUAGE_CONFIG` (src/types.ts:132, `japanese: { name: 'Japanese', code: 'JA', bcp47: 'ja-JP' }`); `QuestCard.tokens?` (types.ts:4) + `RawDeckCard` (starterDecks.ts); `DECK_LOADERS` (App.tsx:83) — only at parity if hiding from picker, see decisions; **`CHALLENGE_NAMES` (App.tsx:204, exhaustive Record — TS errors until added)**; registry entry + policy docs; **`NODE_NAMES.japanese` 35-name block (topicConfig.ts:83)**; `GRAMMAR_NUDGES` ja block (grammarDescriptions.ts:12 — Partial with Spanish fallback; placement-only UI, see decisions); storageService `resetAll` langs array (storageService.ts:363); `LOOKUP_FNS` **and `CONJUGATE_FNS` in WordPopover (WordPopover.tsx:38,55) and `CONJUGATE_FNS` in VocabList (VocabList.tsx:28)**; `GOOGLE_VOICE_MAP` (audioService.ts:135); generate-audio `LANG_DEFAULTS`. Note `SHOW_GRAMMAR_TIPS=false` (featureFlags.ts) — author `grammar` tips anyway (~30% of cards, ≤120 chars, one rule, rōmaji parenthetical); data is preserved and flips on with the flag.

## 6. Content authoring plan

Reuse the Hindi/Welsh methodology wholesale (`docs/`, `scripts/rewrite-hindi-tips.cjs` as template):
- **Waves** of ~50 cards by seq band (6 waves): author agent (emits target + tokens + readings + english + tags + node + tip) → mechanical lint gates → adversarial verify agent (particle choice は/が, counter correctness, naturalness — the Hindi-pass adversarial pattern) → id-stable merge. Git-check `src/data` before every merge (wave-author engine-contamination rule).
- **Vocab discipline**: JLPT-N5 wordlist (~800 words) as the allowed lexicon; linter flags out-of-list tokens with a small proper-noun budget. Usefulness rubric from day 1 — no decorative/trivia/preachy content ever enters.
- **Lint gates** (new `scripts/lint-ja-deck.cjs`): tokens join === target; kana-only for seq 1–50; `r` on every Han-range token; every non-punctuation token resolves in the ja dictionary; unique sentences; audio filename convention; node within seq band; register policy + offender lexicon; tip format (≤120 chars, rōmaji parens); punctuation is always its own token.
- **QA doc**: `docs/japanese-starter-deck-qa.md` mirroring the Spanish starter QA report.
