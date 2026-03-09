# LangLab Curriculum Builder — Complete Instructions

> Paste this entire document into Claude when starting a new language curriculum.
> It covers every lesson learned, pitfall, and nuance from building the Spanish deck.

---

## 1. Overview

You are building a gamified SRS (Spaced Repetition System) language learning app called **LangLab**. Each language curriculum consists of:

- **~8000-8500 cards** (target sentences in the language + English translations)
- **26 grammar nodes** organized into 6 CEFR tiers (A1→C2)
- **4 learning goals**: General, Travel, Work, Family (each goal = 3300 cards)
- **A dictionary** with IPA phonetics, English translations, and infinitive cross-references for verbs
- **Audio** for every card (Google Cloud TTS)
- **A grammar classifier** that assigns each card to the correct grammar node
- **A placement test** that uses grammar nudges to help learners identify their level

---

## 2. Card Format

Each card in `deck.json` must have:

```json
{
  "id": 1,
  "target": "Sentence in target language.",
  "english": "English translation.",
  "audio": "",
  "tags": ["general", "travel"],
  "grammarNode": "node-01"
}
```

### Critical rules for cards:

1. **Maximum 12-14 words per card.** SRS memorization breaks down with long sentences. Hard ceiling: 14 words. Target: 8-12 words. If a grammar point naturally requires more words (e.g., complex conditionals), keep it as tight as possible.

2. **Every card must end with punctuation** (period, exclamation, or question mark). Both `target` and `english` fields.

3. **Use natural, conversational language.** Avoid textbook-style sentences that nobody would actually say. "The investment in public transport infrastructure is key to sustainable development" is bad for A1. Keep it real: "I take the bus to work every day."

4. **Match vocabulary to the CEFR level.** An A1 card should use basic vocabulary even if the grammar being tested is simple. Don't put C1-level vocabulary in A1 grammar nodes — the classifier might assign it to A1 based on grammar, but the learner can't handle the vocabulary.

5. **Include a `grammar` field on ~30% of cards** (especially for B1+ nodes). This is a brief grammar tip shown during the placement test:
   ```json
   "grammar": "The imperfect subjunctive (-iera/-iese) expresses hypothetical situations."
   ```

6. **IDs must be sequential integers**, starting from 1. Use `Math.max(...deck.map(c => c.id)) + 1` for new cards.

7. **Deduplicate aggressively.** Before adding any card, check if `target.toLowerCase()` already exists in the deck.

---

## 3. The 26 Grammar Nodes

Design your grammar nodes to cover the full CEFR range. Here's the structure used for Spanish — **adapt the actual grammar points for your target language**:

### Tier allocation and card distribution per goal (~3300 total):
```
A1: 5 nodes × ~150 cards/node = 750   (~7 weeks at 20 cards/day)
A2: 5 nodes × ~145 cards/node = 725   (~7 weeks)
B1: 5 nodes × ~130 cards/node = 650   (~6 weeks)
B2: 5 nodes × ~115 cards/node = 575   (~6 weeks)
C1: 3 nodes × ~100 cards/node = 300   (~3 weeks)
C2: 3 nodes × ~100 cards/node = 300   (~3 weeks)
                                 3300   (~7.5 months total)
```

### PITFALL: Node balance
In the Spanish deck, early nodes (A1) had 400+ cards while late B2 nodes had as few as 7. This means learners spend 9 weeks on A1 but blast through B2 in 4 weeks. **Aim for consistent per-node density** so each node feels like ~8 days of study.

### PITFALL: Mixed-level capstone nodes
Node-20 "Mixed advanced" (B2 capstone) initially had 0 cards because all its patterns were stolen by more specific nodes. You need either:
- A "multi-signal detection" approach (card must have 2+ features from that tier to qualify)
- Or explicit card generation for capstone nodes

### Language-specific considerations:

**For non-European languages (Arabic, Chinese, Japanese, Korean, Hindi, etc.):**
- **Writing systems**: You may need to handle romanization/transliteration alongside native script
- **Character-level complexity**: Chinese/Japanese cards should consider character count, not word count (aim ~15-20 characters instead of 12 words)
- **No verb conjugation**: Chinese/Vietnamese don't conjugate — grammar nodes should focus on aspect markers, classifiers, sentence particles, word order, etc.
- **Honorifics/register**: Japanese/Korean have extensive politeness levels — dedicate 2-3 nodes to register/formality
- **Tonal languages**: Chinese/Vietnamese/Thai — the audio is even more critical; consider slower TTS speed (0.85)
- **Script variants**: Arabic has connected script, different forms per position; Japanese has 3 scripts (hiragana, katakana, kanji); make sure your dictionary handles all
- **SOV vs SVO**: Japanese/Korean/Hindi are SOV — the grammar progression should reflect this (particles/postpositions are more important than verb conjugation for early nodes)

**For European languages (Italian, French, German, Portuguese):**
- Very similar node structure to Spanish
- German: add cases (nominative/accusative/dative/genitive) as dedicated nodes
- French: add nodes for subjunctive (used more than in Spanish), liaison rules
- Italian: very similar to Spanish structure, but add passato remoto vs passato prossimo distinction
- Portuguese: add personal infinitive, future subjunctive (unique to Portuguese)

### Node configuration (in `topicConfig.ts`):

```typescript
export const MAIN_PATH: PathNode[] = [
  // Tier 1 — A1 (5 nodes)
  { id: 'node-01', name: 'Node name', tier: 'A1', color: '#22c55e' },
  // ... through node-05
  // Tier 2 — A2 (5 nodes)
  { id: 'node-06', name: 'Node name', tier: 'A2', color: '#3b82f6' },
  // ... through node-10
  // Tier 3 — B1 (5 nodes)
  { id: 'node-11', name: 'Node name', tier: 'B1', color: '#f59e0b' },
  // ... through node-15
  // Tier 4 — B2 (5 nodes)
  { id: 'node-16', name: 'Node name', tier: 'B2', color: '#ef4444' },
  // ... through node-20
  // Tier 5 — C1 (3 nodes)
  { id: 'node-21', name: 'Node name', tier: 'C1', color: '#8b5cf6' },
  // ... through node-23
  // Tier 6 — C2 (3 nodes)
  { id: 'node-24', name: 'Node name', tier: 'C2', color: '#6366f1' },
  // ... through node-26
];
```

---

## 4. Grammar Nudges (`grammarDescriptions.ts`)

Each node needs a nudge shown after revealing the English translation in the placement test:

```typescript
export const GRAMMAR_NUDGES: Record<string, string> = {
  'node-01': 'This sentence uses [grammar point] — [brief explanation].',
  // ... one per node
};
```

Keep nudges:
- **Under 30 words**
- **Focused on the structural pattern**, not vocabulary
- **Written for learners**, not linguists (avoid "periphrastic" — use "verb phrases" instead)

---

## 5. Card Generation

### Approach
Create a CJS script (e.g., `scripts/generate-cards.cjs`) that defines cards as hardcoded arrays, then appends them to `deck.json`. Do NOT use AI to generate sentences in bulk — it produces unnatural, repetitive text. Write each sentence by hand or use carefully designed templates.

### Template-based generation
For high-volume nodes, use templates:
```javascript
const templates = [
  { target: '{subject} {verb} {complement}.', english: '{subjectEn} {verbEn} {complementEn}.' }
];
const subjects = [
  { es: 'Yo', en: 'I' }, { es: 'Ella', en: 'She' }, ...
];
```

### Tagging strategy
Every card gets `["general"]` plus contextual goal tags:
- **travel**: transport, directions, food/restaurants, hotels, tourism, geography, weather
- **work**: office, meetings, projects, deadlines, professional skills, emails, careers
- **family**: relationships, home, emotions, celebrations, children, daily routines, health

Use regex-based keyword matching for bulk tagging (see `balance-goals.cjs`), but **manually tag cards when generating them** for better accuracy.

### PITFALL: Sentence length vs level
A sentence can have A1 grammar but C1 vocabulary. The classifier will see simple grammar → A1, but the learner can't handle the vocabulary. **Review your generated cards and ensure vocabulary matches the tier.**

Example of a BAD A1 card:
> "La inversión en infraestructura de transporte público es clave para el desarrollo sostenible."

Example of a GOOD A1 card:
> "Yo cocino pasta los viernes."

---

## 6. The Grammar Classifier (`classify-grammar.mjs`)

This is the **most complex and error-prone part** of the curriculum. The classifier assigns each card to a grammar node based on regex pattern matching.

### Architecture

```javascript
function classify(card) {
  const scores = new Array(26).fill(0);

  // Create two text representations:
  // t = accent-stripped lowercase (for ASCII regex \b word boundaries)
  // r = accented lowercase (for accent-critical patterns like -ó, -ía)
  const t = stripAccents(card.target.toLowerCase());
  const r = card.target.toLowerCase();

  // Score each node based on detected patterns
  // Node with highest score wins
  // Ties broken by difficulty (prefer higher nodes)
}
```

### Critical lessons learned:

1. **Use TWO text representations.** Regex `\b` boundaries don't work with accented characters in JavaScript. So `\bhabló\b` won't match. Use accent-stripped text for `\b`-based patterns, and accented text for accent-critical patterns (like detecting preterite `-ó` endings).

2. **Use Spanish-aware word boundaries** for accented patterns:
   ```javascript
   const SB = '(?<![a-záéíóúüñ])';  // start boundary
   const EB = '(?![a-záéíóúüñ])';   // end boundary
   // Usage: new RegExp(SB + 'habló' + EB)
   ```

3. **A1/A2 dampening.** When a card scores ≥5 on any B1+ node, multiply all A1/A2 scores by 0.6. This prevents complex sentences from being classified as basic just because they happen to contain present-tense verbs.

4. **Grammar field boost.** Cards with a `grammar` field that mentions the target pattern get +10-14 points. This is the most reliable signal.

5. **Fallback classification.** If no node scores above 0, use heuristics:
   - Questions (starts with ¿) → question node
   - Short sentences (1-2 words) → A1 basic node
   - Very long sentences (20+ words) → C1/C2
   - With relative pronouns + 8+ words → relative clause node

6. **Multi-signal detection for capstone nodes.** The final B2 node ("Mixed advanced") should detect sentences with 2+ simultaneous B2-level features, not any single feature. Example:
   ```javascript
   const b2Signals = [
     hasImperfectSubjunctive,
     hasPassiveConstruction,
     hasAdvancedConnector,
     hasComplexConditional,
     wordCount >= 12,
   ].filter(Boolean).length;
   if (b2Signals >= 2) scores[19] += 8;
   ```

### PITFALL: Pattern overlap between nodes
"Si tuviera dinero, viajaría" has both imperfect subjunctive AND conditional. The node for imperfect subjunctive and the node for conditional will both score high. Make sure:
- The most specific/advanced pattern wins (subjunctive > conditional > preterite > present)
- Or add negative scoring: if a card matches a more advanced pattern, reduce scores for simpler ones

### Language-specific classifier considerations:

**Chinese/Japanese:** No verb conjugation patterns → classify by:
- Sentence particles (了, 过, 着 for Chinese; は, が, を, で for Japanese)
- Grammar structures (把-construction, 被-construction, relative clauses)
- Complexity markers (的 chains, 所 constructions)

**Arabic:** Classify by:
- Root + pattern (Form I vs Form II-X)
- Case endings (nominative/accusative/genitive)
- Sentence type (nominal vs verbal)
- Idafa constructions

**German:** Classify by:
- Case usage (nom → acc → dat → gen progression)
- Word order (V2, subordinate clause, relative clause)
- Verb prefix separation

---

## 7. Goal Balancing (`balance-goals.cjs`)

Target: each of the 4 goals has exactly 3300 cards.

### Strategy (4-step):
1. **Strict keyword retagging**: Use specific keywords (e.g., "hotel", "aeropuerto" for travel) to add tags to general-only cards
2. **Broad keyword retagging**: Use broader keywords (e.g., "lugar", "caminar" for travel)
3. **Fallback retagging**: Simply add the goal tag to remaining general cards until target is reached
4. **Trim general**: Remove "general" tag from cards that have all 4 tags to bring general down to 3300

### PITFALL: Keyword quality
Spanish keywords won't work for other languages. You MUST create language-specific keyword regex patterns. Consider:
- **Compound words** (German: Reiseversicherung = travel insurance)
- **Different scripts** (Japanese: 旅行 = travel, 仕事 = work, 家族 = family)
- **Affixes** (Arabic: root-based matching needed instead of whole-word)

### PITFALL: Don't make "general" = all cards
Originally every card had the "general" tag. This makes general meaningless. Instead, general should be a curated subset of 3300 cards that represents the foundational curriculum across all topics.

---

## 8. Dictionary Generation (`generate-dictionary.cjs`)

### What it produces:
```typescript
export interface DictEntry {
  en: string;   // English translation
  ipa: string;  // IPA pronunciation
  pos?: string; // Part of speech: n, v, adj, adv, prep, conj, det, pron
}
```

### Critical features:

1. **IPA generation**: Rules-based phonetic transcription. Must be customized per language:
   - Spanish: Latin American pronunciation (c/z → /s/, ll → /ʝ/)
   - French: liaison rules, nasal vowels
   - Chinese: pinyin → IPA conversion
   - Japanese: kana → IPA conversion
   - Arabic: pharyngeals, emphatics

2. **Smart lookup (`lookupWord` function)**:
   - Direct match first
   - Strip pronoun/particle suffixes
   - Try verb deconjugation to infinitive
   - Try plural/gender inflection stripping
   - Fall back to null (not "see context")

3. **Infinitive references for ALL verb entries**: Every conjugated verb form should show `"translation (infinitive)"`. Example:
   ```
   "habló" → "to speak (hablar)"
   "comemos" → "to eat (comer)"
   ```

### PITFALL: The cognate detector produces garbage
The original cognate detector had rules like `-ar → ''` which turned "acostar" into "acost" (meaningless). **Never strip verb endings for cognate detection.** Handle verbs separately through the infinitive-finding system.

### PITFALL: Dictionary entries persist across regenerations
The script preserves existing entries. If a previous run produced a bad entry (wrong infinitive mapping, garbage translation), it persists forever unless you:
- Strip old annotations before re-processing
- Force re-derivation for verb entries from the infinitive (don't trust existing translations)

### PITFALL: Reflexive verb display
Words like "acostarme" (going to bed) need to map to the reflexive infinitive "acostarse", not the plain form "acostar". The lookup function must strip pronoun suffixes (-me, -te, -se, -nos) and try both `stem` and `stem + se`.

### Language-specific dictionary considerations:

**Chinese:** No IPA needed → use pinyin with tone marks. No verb conjugation. Dictionary = character/word → pinyin + English. Handle traditional vs simplified variants.

**Japanese:** Multiple readings per kanji. Dictionary should include furigana/reading. Handle the 3 scripts. Verb dictionary form (辞書形) is the "infinitive equivalent."

**Arabic:** Root-based lookup. Dictionary should handle root extraction (كتب → write, reader, library, etc.). Include both vocalized and unvocalized forms.

**German:** Handle compound word splitting (Handschuh = Hand + Schuh). Noun gender is critical → include der/die/das. Verb prefix separation (aufstehen → steh...auf).

---

## 9. Audio Generation (`generate-audio.cjs`)

### Google Cloud TTS setup:
```bash
GOOGLE_TTS_KEY=your-api-key node scripts/generate-audio.cjs --resume
```

### Configuration per language:
| Language | Voice | Language Code | Speed |
|----------|-------|--------------|-------|
| Spanish | es-US-Standard-A | es-US | 0.95 |
| French | fr-FR-Standard-A | fr-FR | 0.95 |
| German | de-DE-Standard-A | de-DE | 0.95 |
| Italian | it-IT-Standard-A | it-IT | 0.95 |
| Japanese | ja-JP-Standard-A | ja-JP | 0.90 |
| Chinese | cmn-CN-Standard-A | cmn-CN | 0.90 |
| Arabic | ar-XA-Standard-A | ar-XA | 0.90 |
| Korean | ko-KR-Standard-A | ko-KR | 0.90 |
| Hindi | hi-IN-Standard-A | hi-IN | 0.90 |

### PITFALL: Rate limiting
Google TTS has a 300 requests/minute quota. The script uses 240 RPM to stay safe. With `--resume`, it skips existing files. For ~8000 cards at 20 concurrent requests, expect ~40 minutes.

### PITFALL: Voice quality
"Standard" voices are fine but "Wavenet" or "Neural2" voices sound more natural (cost more). For tonal languages, consider using Wavenet — standard voices sometimes mangle tones.

### PITFALL: Audio file naming
Files are named `{lang}-{id}.mp3` (e.g., `es-123.mp3`). When generating for a new language, change the prefix in `audioFilename()`:
```javascript
function audioFilename(cardId) {
  return `fr-${cardId}.mp3`; // for French
}
```

---

## 10. Quality Audit (`scripts/audit-quality.mjs`)

Run after every major change:
```bash
node scripts/audit-quality.mjs
```

### What it checks:
- Empty target/english fields
- Missing ending punctuation
- Target appears to be English (language swap)
- English appears to be target language
- Unclosed parentheses/quotes
- Very short (1-word) or very long (25+ word) sentences
- Duplicate targets
- Leading/trailing whitespace
- Double spaces

### Manual quality checks you should also do:
1. **Read 20-30 random cards from each tier** — do they feel right for the level?
2. **Check node distribution** — are any nodes suspiciously empty or overfull?
3. **Test the placement test** — does it correctly identify levels?
4. **Check dictionary lookups** — tap random words in study mode, do they show sensible definitions?

---

## 11. Full Pipeline — Step by Step

Run these in order when building a new language or making major changes:

### Step 1: Create card content
```bash
node scripts/generate-cards.cjs    # Your language-specific card generator
```
Output: `src/data/{language}/deck.json` with ~8000+ cards

### Step 2: Update config files
- `src/data/topicConfig.ts` — 26 PathNode entries
- `src/data/grammarDescriptions.ts` — 26 grammar nudges
- `src/components/PlacementTest.tsx` — uses `MAIN_PATH.length` dynamically (no hardcoded numbers!)

### Step 3: Classify grammar
```bash
node scripts/classify-grammar.mjs
```
Check output for node distribution. Iterate on classifier patterns if distribution is uneven.

### Step 4: Balance goals
```bash
node scripts/balance-goals.cjs
```
Must reach exactly 3300 per goal. May need to adjust keyword regexes.

### Step 5: Generate dictionary
```bash
node scripts/generate-dictionary.cjs
```
Check for "see context" entries (should be minimal for verbs).

### Step 6: Generate audio
```bash
GOOGLE_TTS_KEY=xxx node scripts/generate-audio.cjs --resume
```

### Step 7: Quality audit
```bash
node scripts/audit-quality.mjs
```

### Step 8: Manual verification
- `npx tsc --noEmit` — TypeScript compiles
- Preview the app — all 26 nodes visible on Progress Map
- Placement test works through all levels
- Study session shows cards with audio and dictionary lookups

---

## 12. Common Pitfalls Summary

| # | Pitfall | Symptom | Fix |
|---|---------|---------|-----|
| 1 | Cards too long | Users can't memorize 20+ word sentences | Max 14 words, target 8-12 |
| 2 | Vocabulary doesn't match level | C1 vocabulary in A1 grammar nodes | Review cards manually, match vocabulary to tier |
| 3 | Uneven node distribution | Some nodes have 400 cards, others have 7 | Target consistent per-node counts within each tier |
| 4 | Classifier misses accented characters | `\b` doesn't work with accents in JS regex | Use TWO text representations (stripped + accented) |
| 5 | Capstone node has 0 cards | All patterns assigned to more specific nodes | Add multi-signal detection for capstone nodes |
| 6 | Dictionary shows garbage (e.g., "acost") | Cognate detector strips verb endings | Don't use cognate detection for verbs; use infinitive system |
| 7 | Dictionary entries persist incorrectly | Bad translations from previous runs survive | Strip old annotations and re-derive from infinitive each run |
| 8 | Reflexive verbs show truncated stems | "acostarme" → "acost" instead of "acostarse" | Pronoun suffix stripping + reflexive infinitive lookup |
| 9 | Goals not balanced | One goal has 2900 cards, another has 3500 | Run balance-goals.cjs with language-specific keyword regexes |
| 10 | A1/A2 dampening missing | Complex sentences classified as A1 due to present tense | When B1+ scores ≥ 5, multiply A1/A2 scores by 0.6 |
| 11 | Hardcoded node count | "20" hardcoded in PlacementTest instead of dynamic | Always use `MAIN_PATH.length`, never literal numbers |
| 12 | Grammar names too technical | "Periphrastic verbs" confuses learners | Use learner-friendly names ("Verb phrases") |
| 13 | Variable used before declaration | `queCount` used in node-20 but declared in node-26 | Declare shared variables at top of classify function |
| 14 | Audio TTS rate limits | 429 errors, failed cards | Use rate limiter (240 RPM), exponential backoff, --resume |
| 15 | General = all cards | "General" goal is meaningless if every card has it | Trim general to 3300 by removing tag from multi-goal cards |

---

## 13. File Structure

```
src/
  data/
    {language}/
      deck.json              # ~8000 cards
    dictionary/
      {lang}.ts              # Dictionary entries + lookupWord()
    topicConfig.ts           # 26 PathNode definitions
    grammarDescriptions.ts   # Grammar nudges per node
  components/
    PlacementTest.tsx        # Uses MAIN_PATH dynamically
  services/
    srsService.ts           # ANKI-style SRS scheduling
    placementService.ts     # Fast-tracking logic
  App.tsx                   # Session queue construction, deck building
  types.ts                  # QuestCard, LearningGoal, Language types

scripts/
  generate-cards.cjs        # Card content generation (language-specific)
  classify-grammar.mjs      # Grammar node classification
  balance-goals.cjs         # Goal balancing to 3300
  generate-dictionary.cjs   # Dictionary with IPA + infinitive refs
  generate-audio.cjs        # Google Cloud TTS batch generation
  audit-quality.mjs         # Quality validation
  shorten-deck.cjs          # Remove/replace over-length cards

public/
  quest-audio/
    {lang}-{id}.mp3         # Audio files per card
```

---

## 14. What Auto-Scales (No Changes Needed Per Language)

These components work dynamically and don't need language-specific modifications:

- `App.tsx` `buildDeck()` — loops `MAIN_PATH` dynamically
- `TopicMap.tsx` — renders nodes and tier labels from `MAIN_PATH`
- `placementService.ts` — loops `MAIN_PATH` for card selection
- `SessionMenu.tsx`, `isNodeUnlocked()` — uses `MAIN_PATH.length`
- SRS scheduling — language-agnostic (same intervals, ease factors)
- Gamification/achievements — card-count based
- localStorage state — grows proportionally, within limits

---

## 15. Adding a New Language to the App

After building all the curriculum content:

1. Add to `src/types.ts`:
   ```typescript
   export const LANGUAGE_CONFIG = {
     // existing...
     japanese: { name: 'Japanese', code: 'JA', bcp47: 'ja-JP' },
   };
   ```

2. Add deck import to `App.tsx`:
   ```typescript
   import rawJapaneseDeck from './data/japanese/deck.json';
   const DECK_MAP = { /* existing... */ japanese: rawJapaneseDeck };
   ```

3. Create the dictionary file at `src/data/dictionary/{lang}.ts`

4. Ensure audio files are in `public/quest-audio/{lang}-{id}.mp3`

---

## 16. Estimated Effort Per Language

| Task | Effort | Notes |
|------|--------|-------|
| Design 26 grammar nodes | 2-3 hours | Requires deep knowledge of target language grammar |
| Generate ~8000 cards | 8-12 hours | Mix of hand-written and template-based |
| Write grammar nudges | 1 hour | 26 short descriptions |
| Build classifier patterns | 4-6 hours | Most time-consuming; needs iteration |
| Create keyword regexes for goals | 1-2 hours | Travel/work/family keywords per language |
| Adapt dictionary generator | 2-4 hours | IPA rules, verb deconjugation, lookup logic |
| Generate audio | 1 hour | Mostly automated, just set up TTS config |
| Quality audit + iteration | 2-3 hours | Multiple rounds of classifier tuning |
| **Total** | **~20-30 hours** | Faster for languages similar to Spanish |
