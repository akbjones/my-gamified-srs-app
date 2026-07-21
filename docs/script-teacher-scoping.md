# WaniKani-Style Script Teacher for LangLab (kana / Hangul / Devanagari / Cyrillic) — feasibility-corrected

> Scoping document — no implementation yet. Design was adversarially feasibility-checked against the actual codebase.

## Executive summary

Add a mnemonic-driven, FSRS-scheduled "Learn the script" mode for the four alphabet/syllabary scripts LangLab serves — explicitly not kanji. The engine is a thin generic layer over verified-existing machinery: script items are wrapped as QuestCard-shaped objects so handleAnswerLogic (which already takes an injected saveProgress callback), mini-loop reinsertion, and the mergeMastery sync rule are reused verbatim; the UI follows the PlacementTest/ChallengeScreen phase-machine pattern. Feasibility review against the repo confirmed nearly all cited line numbers and APIs, and corrected four things: script storage MUST live in storageService.ts (safeSet/markDirty are module-private — a standalone service would silently never sync), the audio-cache double-bump is unnecessary and harmful for net-new files, the vite manualChunks change is optional (dynamic imports auto-chunk), and the kana pack has a hard compile-time dependency on a 'japanese' Language union entry that forces the teaser-vs-launch decision. V1 = engine + Hangul end-to-end, roughly 4-6 focused sessions; TTS cost for all four packs is ~$0.03-0.10, gated on a 10-clip pilot.

## Decisions needed before building

1. V1 script: Hangul (recommended — biggest audience, best Reddit demo, and block composition must shape the engine from day 1) vs Cyrillic (simpler but proves a core Hangul would later break)
2. Review input mode: 4-choice tap for v1 (recommended — mobile-first, no romanization-normalizer work, matches existing tap idioms); typed romanization deferred to v2
3. Gating: soft-gate only (recommended) — home banner + a third 'Learn the alphabet first' option in the existing 2-button placement interstitial (App.tsx:874); never hard-block study/placement
4. Script reviews feed the streak (recommended yes — via the existing updateStreak; never cardsLearned/totalReviews, keeping deck stats and sync reconcileStats untouched)
5. Kana timing — now a HARD sequencing decision, not a preference: ScriptPack.language cannot be 'japanese' until the Language union + full language scaffold exist, so either (a) bundle kana with the Japanese launch (recommended), or (b) ship a standalone teaser by making ScriptPack.language optional and forgoing exampleWords + the readable-words counter
6. Approve the TTS spend (~$0.03-0.10 total) and the per-script synthesis strategy after the 10-clip pilot (e.g. Hangul as CV syllables 가 rather than bare jamo; Cyrillic letter-name vs example-word clip) — per the standing cost-confirmation rule; pilot clips must NOT be uploaded to R2 under final filenames

## Phased plan

| Phase | Size | Deliverable |
|---|---|---|
| P0 — Engine core: pack types + JSON loader/manifest; loadScriptMap/saveScriptMap INSIDE storageService.ts (safeSet is module-private — the sole path that fires markDirty) + resetAll loop entry; syncMerge 'script' kind + mergeIndependent case + test-sync-merge.ts cases; update the 150-row cap comment in supabase/migrations/0002_rate_limit.sql. NO vite.config change. | M | Script items schedule through the existing ts-fsrs pipeline via the injected saveProgress callback, persist to quest_script_<lang>, sync-merge across devices, and are covered by backup/export — unit-tested, zero UI |
| P1 — ScriptTeacher UI: SCRIPT view + phase FSM, progress map, lesson, 4-choice review with derived ratings, composition drill (Hangul blocks / matras), summary, home banner + third placement-interstitial option, Hangul decomposition util | L | Full 'Learn the script' mode navigable end-to-end with a stub pack |
| P2 — Hangul pack: sequencing + similar-sets + exampleWords and per-level readableWordCount snapshotted from the ko deck at authoring time; ~28 mnemonics authored + adversarially verified; 10-clip TTS pilot (local / pilot- names only) then full generation + R2 upload under final names — NO cache bump; live browser test | M | Korean learners go from zero to reading Hangul; shipped and live-tested — the v1 launchable |
| P3 — Cyrillic pack (S, ru-RU-Wavenet-A voice to match the deck) then Devanagari pack (M, matras + conjunct curation): content-only additions proving engine generality | M | Russian and Hindi script teachers live with zero engine changes |
| P4 — Kana pack (hiragana→katakana, dakuten/combo rules, シツソン discrimination) — hard-gated on the Japanese Language-union decision: either bundled with the full Japanese launch or shipped as a deck-less teaser via optional ScriptPack.language | L | Kana teacher ready to onboard Japanese day-one learners |

**Total effort:** V1 (P0 engine + P1 UI + P2 Hangul pack): roughly 4-6 focused working sessions for a solo maintainer with agent support (P0 shrank slightly — no vite work; P2 gained the pilot-naming/R2-upload-discipline step). Each later pack: Cyrillic S (~1 session), Devanagari M (~1-2), kana L (~2-3, hard-tied to the Japanese-launch decision). Dollar cost: TTS for all four packs ≈ $0.03-0.10 (≈350 one-to-three-character clips billed per character); no other spend — authoring uses the existing agent workflow, hosting is the existing R2/Netlify setup, and skipping the audio-cache bump avoids incremental egress for existing users.

## Risks

- Single-character TTS quality: isolated letters may clip or be read as letter names (Cyrillic 'вэ') — mitigated by the mandatory 10-clip pilot per script and per-script synthesis strategy before bulk generation; UNVERIFIABLE from the repo until the pilot runs, since no comparable single-character clips exist
- Sync has TWO silent-failure halves, both P0: (1) without the 'script' MergeKind, quest_script_* classifies 'unknown' and never syncs (verified against isSyncedKey, syncService.ts:38); (2) script persistence written outside storageService.ts bypasses the module-private markDirty wiring and never syncs even WITH the kind — both fixed by design (§2.2, §2.4) and unit-tested
- Mnemonic correctness at scale: the maintainer cannot read these scripts, so a hallucinated shape-story would ship unnoticed — the adversarial verify pass (story matches the actual strokes, yields the right sound) is load-bearing, with Reddit feedback as post-launch backstop
- Font shaping variance: Devanagari conjunct/matra rendering differs across platforms — lesson screens set the lang attribute and get visually checked on iOS/Android; conjuncts capped at ~10 recognition-only items partly for this reason
- R2/CDN staleness on overwritten objects: net-new files need no cache bump (verified — and bumping would force every user to re-download all cached deck audio), but any clip regenerated under an already-uploaded final name can be served stale by the Cloudflare edge with no client-side bust — finalize clips before uploading under final names
- SW audio runtime cache caps at maxEntries 500 with LRU eviction (vite.config.ts): 350 script clips churn against deck audio; existing behavior and acceptable online, but offline mid-lesson re-fetch behavior after eviction is UNVERIFIED
- Market claims are unverifiable from the repo: 'Korean has the largest untapped audience' and 'existing users are mid-deck in all three languages' are plausible but unevidenced — cheap sanity check once PostHog is enabled at Reddit launch
- Supabase 150-row per-code cap (0002_rate_limit.sql): 9 key families × 14 langs + settings = 127 max — safe, but the migration's margin comment must be updated in P0 or the NEXT key family blows the cap unnoticed
- Scope creep: typed input, stroke order, images, kanji, and vite/workbox tinkering are adjacent temptations — all explicitly out of v1

---

## Full design

# WaniKani-Style Script Teacher — Design (feasibility-corrected)

## 0. Review corrections applied (what changed vs. the draft and why)

Verified against the repo at `/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones`:

**Confirmed accurate** (checked line-by-line): `burySiblings` at srsService.ts:125 (strips non-digits, so `sc-ko-0012` → 12; adjacency = lesson batch, keep); `REINSERT_OFFSETS` srsService.ts:176; `toFsrsCard` learning-step healing srsService.ts:29-53; `handleAnswerLogic` srsService.ts:219 **takes `saveProgress` as an injected callback** — the "works unchanged" claim is genuinely true, no fork needed; View union App.tsx:76; placement interstitial App.tsx:874 (currently a 2-button modal, `showPlacementPrompt`); `mergeMastery`/`pickNewerCard` syncMerge.ts:41-66; `keyKind`/`mergeIndependent` dispatch and the "unknown kind silently never syncs" failure mode (`isSyncedKey` syncService.ts:38-40); `resetAll` storageService.ts:360 with its **hardcoded 14-language list at line 363**; `LANG_DEFAULTS` generate-audio.cjs:46; registry.ts descriptors (cyrillic ё/е ~line 89, arabic RTL gate ~line 121, devanagari combiningNotes ~line 133+); PlacementTest/ChallengeScreen `Phase` useState pattern (PlacementTest.tsx:23/:36, ChallengeScreen.tsx:21/:89); `updateStreak` in gamificationService.ts:21, already called from App.tsx:464; `scripts/test-sync-merge.ts` exists; ts-fsrs default learning steps 1m/10m confirmed in code comments; Korean deck targets confirmed (`ko-0001` "안녕하세요, 민수 씨." — note punctuation, see §1.1).

**Corrected — wrong or misleading in the draft:**
1. **Script storage cannot be a standalone `scriptSrsService.ts` clone.** `safeSet`/`markDirty` wiring lives in **module-private** functions in storageService.ts (safeSet at line 52 is not exported). A separate service writing localStorage directly would bypass `markDirty` and **silently never sync** — the exact failure mode the draft warned about for keyKind, reproduced one layer down. Fix: `loadScriptMap(lang)` / `saveScriptMap(map, lang)` are added **inside storageService.ts** (5 lines, identical to loadMasteryMap/saveMasteryMap); the queue-building/drill-selection logic can still live in a `scriptSrsService.ts` that calls them.
2. **No AUDIO_VERSION / audio-cache-vN bump for the script clips.** The double-bump rule applies to **regenerated** files (same URL, new bytes). Script clips are net-new filenames — never cached by any client — so bumping is unnecessary AND harmful (it cache-busts every user's cached deck MP3s → full re-download on the Cloudflare egress bill). The real discipline is the inverse: **do not upload pilot clips to R2 under final filenames until approved** — an overwritten R2 object can be served stale by the CDN edge with no client-side bust available. Pilot locally or under `pilot-` names.
3. **The vite `manualChunks` edit is optional, not required.** Rollup gives every dynamic `import()` its own chunk automatically; the deck regex (vite.config.ts:47) exists only to produce predictable `deck-<lang>` names for the SW's `globIgnores: ['assets/deck-*.js']` + runtime-cache pattern. A 30-80 KB pack should simply be **left in the SW precache** (no vite.config change at all, offline-by-default). Revisit only if packs grow past ~200 KB.
4. **QuestCard has required non-optional fields the wrapper must stub**: `category`, `topic`, `audio`, `mastery` (types.ts:4-13). Wrapper: `{ id, target: glyph, english: romanization, category: 'Script', topic: 'script', audio: item.audio, mastery: saved?.mastery ?? 0, ...savedProgress }`.
5. **Supabase per-code row cap = 150** (supabase/migrations/0002_rate_limit.sql: "at most 150 rows; the real app writes ~113 max = 8 keys × 14 languages + settings"). Adding a 9th per-language key family raises the theoretical max to 127 — still safe, but the migration comment must be updated so the next key family doesn't blow the cap unnoticed. P0 checklist item.
6. **Kana pack has a compile-time blocker**: `ScriptPack.language: Language` cannot be `'japanese'` — the union (types.ts:1) has 14 members and no Japanese. A standalone kana teaser therefore requires either adding a full Japanese language scaffold or making `language` optional (`language?: Language`, disabling exampleWords/readable-counter). This turns "kana timing" from a soft preference into a hard sequencing decision (see Decisions).
7. **Readable-words counter must be precomputed, not runtime.** Computing it live requires loading the language's full deck chunk (~1-2 MB) inside script mode. Decks are static, so snapshot `readableWordCount` (+ sample words) **per level at authoring time**, same as `exampleWord` snapshotting. Recompute live only if the deck happens to be in memory.
8. **Free win the draft missed**: `exportAllProgress`/`importAllProgress` (storageService.ts:387-415) operate on the `quest_` prefix — `quest_script_*` is covered by backup/restore with zero work.
9. **Cyrillic audio nuance**: the canonical Russian voice is `ru-RU-Wavenet-A` (generate-audio.cjs:57), not Chirp3-HD — script clips must match each deck's voice, so "Chirp3-HD everywhere" is wrong for ru.

---

## 1. Pedagogy — WaniKani essence, adapted to phonetic scripts

Scope: kana (hiragana + katakana), Hangul, Devanagari, Cyrillic. Explicitly NOT kanji (no meaning-bearing logographs, no radicals).

### 1.1 Item lifecycle (one FSRS card per item; drill TYPE varies, scheduler does not)

Each script item is a single FSRS card scheduled by the existing `handleAnswerLogic` — verified to take `saveProgress: (card) => void` as a parameter, so injecting `saveScriptProgress` is the entire integration. Drills:

1. **Lesson** (batch of 5-8): big glyph, audio, romanization, mnemonic story, "don't confuse with" row. Ends in a warm-up recognition quiz on just that batch before items enter the review queue (WaniKani lesson-quiz pattern).
2. **Recognition** (learning state, dominant early): glyph → pick sound/romanization from 4 choices.
3. **Recall** (review state): audio or romanization → pick the glyph from 4 choices.
4. **Discrimination** (review state, when ≥2 members of an item's `similar` set are learned): choices drawn from the similar set — "which one is *shi*? シ ツ ソ ン"; Hangul ㅁ/ㅂ/ㅍ; Devanagari ब/व, घ/ध; Cyrillic Latin false friends в/н/р/с/у/х. The drill that fixes the classic failure modes.
5. **Context / production** (review state, coverage-gated): read a composed syllable or a real deck word all of whose characters are learned → pick its romanization (meaning shown as reward). Hangul: compose a syllable block from jamo tiles — WordTileChallenge tap-tile mechanics at character granularity.

Drill selection per review: weighted random among eligible drills by `fsrsState` (Learning → 80% recognition / 20% recall; Review → recall + discrimination + context). Distractors: prefer `similar` ids, else same-level items, never unlearned glyphs.

**Short steps**: ts-fsrs defaults (1m, 10m) plus the existing REINSERT_OFFSETS mini-loop reinsertion give exactly the tight sub-day drilling character learning needs. No scheduler fork; shared 0.9 retention.

**Readable-words counter**: precomputed per level at authoring time (correction #7): "You can now read 214 words in your deck." The counter test strips non-script characters (punctuation, digits, Latin — Korean targets like "안녕하세요, 민수 씨." contain both) before the all-glyphs-learned check; Hangul needs the `code − 0xAC00` jamo decomposition (~15-line util, shared with the composition drill and the authoring script).

### 1.2 Sequencing per script

- **Hangul** (~40 jamo + composition, 8-10 levels): L1 basic consonants ㄱㄴㄷㄹㅁ + vowels ㅏㅓㅗㅜㅡㅣ interleaved so **block composition starts at level 2** — Hangul's unique mechanic, and its featural logic is the mnemonic goldmine. Then remaining basic jamo; CV composition drills; aspirated ㅋㅌㅍㅊ as "add a breath-stroke" rule-mnemonics vs their plain siblings (automatic similar-sets); tense doubles ㄲㄸㅃㅆㅉ as rules; compound vowels; batchim sound rules last.
- **Devanagari** (~46 letters + ~12 matras, ~10 levels): consonants ordered by frequency in `src/data/hindi/deck.json`, not varga order. Inherent-'a' in L1. Matras after ~2 consonant levels, drilled as composed items (क → का कि की). Conjuncts capped in v1 at the top ~10 by deck frequency, recognition-only "ligature" items. Nukta letters (ज़ फ़) late. Registry `combiningNotes` (registry.ts:133+) documents the composition hazards.
- **Cyrillic** (33 letters, ~6 levels), hybrid ordering: L1 true friends (а к м о т) for instant wins; L2-L4 genuinely new shapes; the six Latin **false friends в н р с у х get dedicated mid-course discrimination levels** pitting Cyrillic reading against the Latin reflex — interference is the failure mode, drilled head-on. ё/е tolerance (registry.ts:89) applies to distractor generation. Audio uses `ru-RU-Wavenet-A` to match the deck voice (correction #9).
- **Kana** (46+46 + dakuten/combos ≈ 150 items, ~15 levels): hiragana complete first in gojuon order; dakuten/handakuten as rule-modifier levels, not 25 fresh mnemonics; combo kana (きゃ) as composition drills. Katakana second via "same sound, new shape" paired drills, with シ/ツ/ソ/ン drilled hard. **Blocked on the Japanese-launch decision** (correction #6).

Greek (live today, 24 letters) deliberately out of the four; near-free later add since the engine is generic.

---

## 2. Data model

### 2.1 Content pack — JSON data + typed loader (corrected from all-TS)

Pack **data lives in JSON** (`src/data/scripts/hangul.json`) with a thin typed loader (`src/data/scripts/index.ts`), for three verified reasons: it matches the deck.json pattern the repo tooling assumes; `generate-audio.cjs` is CommonJS and can `require()` it with no tsx compile step; the authoring/verify agent scripts read-modify-write JSON id-stably (the Hindi-pass idiom).

```ts
// src/data/scripts/types.ts
export type ScriptId = 'hangul' | 'cyrillic' | 'devanagari' | 'kana';

export interface ScriptItem {
  id: string;              // 'sc-ko-0001' — stable forever, id-stable-apply rule
  kind: 'letter' | 'modifier' | 'composed' | 'word';
  glyph: string;           // 'ㄱ' | 'в' | 'का' | '한'
  sound: string;           // display pronunciation: 'g/k'
  romanization: string;    // canonical answer key: 'g'
  mnemonic: string;        // ≤200 chars, shape→sound story (letters/modifiers only)
  level: number;           // 1..N
  similar?: string[];      // ids of confusables → discrimination drills
  components?: string[];   // 'composed' items: constituent item ids
  exampleWord?: { target: string; english: string; deckCardId: string }; // snapshot from the language's own deck
  audio: string;           // 'sc-ko-0001.mp3' — flat in public/quest-audio
}

export interface ScriptPack {
  scriptId: ScriptId;
  language?: Language;     // OPTIONAL (correction #6): kana teaser mode has no deck; exampleWords/readable-counter disabled when absent
  name: string;            // 'Hangul'
  tagline: string;         // 'Read Korean in about 3 days'
  items: ScriptItem[];
  levels: { level: number; title: string; itemIds: string[]; readableWordCount: number }[]; // count precomputed at authoring time (correction #7)
}
```

- Packs lazy-load via `import('./hangul.json')`. **No vite.config change** (correction #3): Rollup auto-chunks the dynamic import; the small chunk stays in the SW precache (offline by default). Do NOT touch `manualChunks` or `globIgnores` unless packs grow.
- Static manifest in `src/data/scripts/index.ts` maps `Language → { scriptId, loader }` for ko/hi/ru so HOME knows a pack exists without loading it (DECK_LOADERS pattern, App.tsx:83).
- `exampleWord` and `readableWordCount` resolved at authoring time from the language's deck and snapshot into the pack — no runtime deck dependency.

### 2.2 Progress storage — INSIDE storageService.ts (correction #1)

Add to `src/services/storageService.ts` (NOT a standalone service — `safeSet`/`markDirty` are module-private):

```ts
const scriptKey = (lang: Language) => `quest_script_${lang}`;
export const loadScriptMap = (lang: Language): MasteryMap => safeParse(safeGet(scriptKey(lang)), {});
export const saveScriptMap = (map: MasteryMap, lang: Language): void => safeSet(scriptKey(lang), JSON.stringify(map));
```

Values hold exactly the field subset saveCardProgress persists (srsService.ts:94-119: stability, difficulty, fsrsState, reps, lapses, lastReview, learningStep, dueDate, interval, mastery, failCount…). Add `safeRemove(scriptKey(lang))` inside `resetAll`'s existing per-language loop (storageService.ts:364-373 — the hardcoded langs list at :363 covers it, no new list). Backup/export coverage is automatic via the `quest_` prefix (correction #8).

"Script mastered" is **derived** (≥90% of `letter|modifier` items graduated), never stored — nothing to merge, can't go stale.

### 2.3 SRS reuse

Session build wraps items as full QuestCards **including the required non-optional fields** (correction #4): `{ id, target: glyph, english: romanization, category: 'Script', topic: 'script', audio: item.audio, mastery: saved?.mastery ?? 0, ...savedProgress }`. `handleAnswerLogic`, `toFsrsCard` (incl. the learning-step persistence fix), mini-loop reinsertion, `interleaveQueue`, and `burySiblings` (adjacent numeric ids = same lesson batch — desirable) work verbatim. `scriptSrsService.ts` shrinks to `buildScriptQueue(pack, progress, limits)` + drill selection; the persistence race guard comes free by calling `loadScriptMap` immediately before `saveScriptMap` (same load-modify-save idiom as saveCardProgress, srsService.ts:82-91).

### 2.4 Sync merge rule (P0 hard requirement — verified end-to-end)

In `syncMerge.ts`: add `'script'` to `MergeKind` (:20-22); `if (key.startsWith('quest_script_')) return 'script';` in `keyKind` (:24-35 — no prefix collision with `quest_stats_`/`quest_settings`/`quest_sync_*`, checked); `case 'script': return mergeMastery(...)` in `mergeIndependent` (:206-218) — the value is literally a MasteryMap, so union-of-ids / newest-`lastReview`-wins is correct as-is. Verified: `isSyncedKey` (syncService.ts:38) accepts any `quest_*` key with known kind, so this is the only transport change; `pullInto` pass-2 routes non-mastery kinds through `mergeIndependent` (:166); `langOf` and the stats recompute never touch script keys; the reset-epoch wipe (`allSyncedKeys`) covers script keys automatically once the kind exists. Failure mode if skipped: classifies `'unknown'`, silently never syncs. Add cases to `scripts/test-sync-merge.ts` (33 existing tests).

**Plus (correction #5): update the 150-row cap comment in `supabase/migrations/0002_rate_limit.sql`** — new max is 9 key families × 14 langs + settings = 127 of 150. Headroom exists but the margin note must not rot.

Do NOT count script items into `reconcileStats` cardsLearned — it derives from `quest_mastery_` keys only (verified syncMerge.ts:77-94) and stays that way.

### 2.5 Audio

Extend `scripts/generate-audio.cjs` with `--script=<pack>` mode: `require()` the pack JSON (no tsx step — correction), synthesize with the **language's canonical deck voice from LANG_DEFAULTS (:46)** — ko/hi = Chirp3-HD-Aoede, **ru = Wavenet-A** (correction #9) — write `sc-<code>-NNNN.mp3` flat into `public/quest-audio/`, upload to R2 bucket `langlab-srs-audio` under key prefix `quest-audio/` (per scripts/AUDIO-PIPELINE.md).

**No AUDIO_VERSION / audio-cache-vN bump** (correction #2): net-new filenames were never cached by any client; bumping would force every user to re-download all cached deck audio. Discipline instead: pilot clips stay local or under `pilot-` names until approved — an overwritten R2 object under a final name can be served stale by the CDN edge with no bust mechanism.

**Cost**: ~350 clips × 1-3 characters, billed per character ≈ $0.03-0.10 total. Per the standing cost-confirmation rule: confirm before running; **10-clip pilot first** — isolated characters are the riskiest TTS input (a lone Cyrillic letter read as its NAME "вэ"; a lone jamo may clip). Per-script mitigations chosen after listening: Hangul as CV syllables (가 not ㄱ — pedagogically better anyway); Cyrillic letter-name acceptable for recall drills OR exampleWord clip; Devanagari bare consonants carry inherent-a and should work.

---

## 3. UI / UX

### 3.1 View FSM

Add `'SCRIPT'` to the View union (App.tsx:76 — verified). One component `src/components/ScriptTeacher.tsx` with internal `Phase = 'map' | 'lesson' | 'lessonQuiz' | 'review' | 'summary'` — exactly the verified PlacementTest.tsx:23/:36 and ChallengeScreen.tsx:21/:89 pattern (phase useState, onExit → setView('HOME')). Receives the lazy-loaded pack + progress map + save callback from App.

### 3.2 Home entry + gating (soft-gate)

For ko/hi/ru (later ja) where a pack exists and script isn't mastered: banner card above the Study button — "Learn Hangul · read Korean in ~3 days" with progress ring + due count. Full card while 0 script progress AND <20 deck reviews; collapses to a pill after start/dismiss (dismissal in `quest_settings`). **Do NOT hard-gate** study or placement — users are mid-deck in the live languages, and heritage/Cyrillic-familiar learners legitimately skip. The placement interstitial (App.tsx:874 — verified as a 2-button modal) gains a **third option**: "Learn the alphabet first (recommended)" → SCRIPT view.

### 3.3 Screens

- **Map** (default entry): level rows of glyph chips colored by mastery (gray/amber/green) — TopicMap idiom. Tap learned chip → mnemonic recap popover (WordPopover styling). "Lesson: next 5-8" (enabled when previous level ≥80% graduated) + "Review (N due)".
- **Lesson**: one item per screen: 10rem glyph with `lang` attribute set (Devanagari conjunct shaping), audio autoplay respecting `autoPlayAudio`, romanization, mnemonic, similar-set warning row. Ends in batch recognition quiz.
- **Review**: **4-choice tap for v1** — mobile-first, no per-script romanization normalizer (kh/x, sh/ś…), matches the app's tap idioms. Derived rating: correct-fast → GOOD, correct >6s → HARD, wrong → AGAIN (shows answer + mnemonic recap). Typed input is a v2 layer on the same drills.
- **Composition drill** (Hangul blocks, Devanagari matras): tap component tiles in order — WordTileChallenge mechanics at character scale.
- **Summary**: session stats + readable-words delta ("+37 deck words now readable"), from the precomputed per-level counts.

Streak: script reviews call the existing `updateStreak` (gamificationService.ts:21, already invoked from App.tsx:464) + `saveUserStats` — a study day is a study day — but never touch `cardsLearned`/`totalReviews`, keeping deck stats, achievements math, and sync reconcileStats untouched (verified compatible).

---

## 4. Mnemonic content — authoring

**Text-only v1, no images** — per-item art is WaniKani's most expensive asset and least automatable well; the glyph renders huge next to the story, and Hangul's featural design plus Devanagari/Cyrillic stroke shapes narrate well ("ㄴ is a tongue touching the ridge — *n*").

Workflow — the proven Hindi-pass machinery (classify → author → adversarial verify → id-stable apply; `scripts/rewrite-hindi-tips.cjs` as template):
1. LLM-author per item: ≤200 chars; must reference the visible SHAPE and land on the SOUND; concrete imagery; romanization in parens (house style); no culture-bound references that don't travel.
2. **Adversarial verify** (separate agent run): does the story describe THIS glyph's actual strokes (not a hallucinated shape)? Right sound? Confusable pairs get contrasting, cross-referencing stories (ツ vs シ each mention the discriminating feature)? Duplicate-imagery check across the pack.
3. Human spot-check ~15% (the maintainer doesn't read these scripts — the verify pass carries the load pre-launch; Reddit feedback closes the loop after).

Authored counts (mnemonics, not total items): Hangul ~28; Cyrillic 33; Devanagari ~58; kana ~100. Composed drill items need no mnemonics.

---

## 5. Scope discipline & phasing

**V1 = engine + ONE script end-to-end. Recommended: Hangul.** (a) Newest live language, weakest onboarding, largest claimed demand (unverifiable from repo — see risks); (b) best Reddit demo ("read Korean in 3 days"); (c) **engineering**: block composition is the one mechanic that would wreck a retrofitted abstraction — `kind:'composed'` + `components` + the composition drill must shape the engine in v1; Devanagari matras then reuse it free; (d) smallest mnemonic count.

### Explicitly OUT
Kanji/hanzi (different problem); handwriting/stroke order (canvas + stroke data); mnemonic images; typed romanization (v2); Arabic script (gated on the RTL workstream, registry.ts:121 — verified); Greek pack (cheap later add); any deck-study scheduler changes; **any vite.config/workbox changes** (correction #3); **any AUDIO_VERSION bump** (correction #2).
