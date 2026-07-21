// Script-teacher SRS engine — queue building, level gating and drill selection
// over a ScriptPack (docs/script-teacher-scoping.md §1.1, §2.3).
//
// Deliberately THIN: scheduling is the existing ts-fsrs pipeline verbatim —
// the UI calls srsService.handleAnswerLogic with saveScriptCardProgress
// injected as the saveProgress callback, so learning steps, mini-loop
// reinsertion and leech flagging all behave exactly like deck study.
// Persistence goes through storageService's loadScriptMap/saveScriptMap (the
// only path that fires markDirty → cross-device sync); progress is a fully
// separate track from deck mastery and never touches cardsLearned/totalReviews.

import type { QuestCard, MasteryMap, Language } from '../types';
import type { ScriptItem, ScriptPack, ScriptDrillConfig } from '../data/scripts/types';
import { burySiblings, interleaveQueue } from './srsService';
import { loadScriptMap, saveScriptMap } from './storageService';

/** A level unlocks when the previous one is ≥80% graduated. */
const LEVEL_UNLOCK_RATIO = 0.8;
/** "Script mastered" = ≥90% of letter|modifier items graduated — always derived, never stored. */
const MASTERED_RATIO = 0.9;

const DEFAULT_DRILL: ScriptDrillConfig = {
  recallPrompts: ['audio', 'romanization'],
  discriminationPrompt: 'audio',
};

// ── QuestCard wrapping ───────────────────────────────────────────────────────

/** Wrap a script item (+ its saved progress) as a full QuestCard so the FSRS
 *  pipeline works unchanged. QuestCard's required fields are stubbed:
 *  category/topic mark it as script-track, english carries the answer key. */
export const toScriptCard = (item: ScriptItem, saved?: Partial<QuestCard>): QuestCard => ({
  id: item.id,
  target: item.glyph,
  english: item.romanization,
  category: 'Script',
  topic: 'script',
  audio: item.audio,
  mastery: saved?.mastery ?? 0,
  ...saved,
});

/** Persist a script card's scheduling state — the exact field subset
 *  saveCardProgress keeps, written via the load-modify-save idiom so two rapid
 *  ratings can't clobber each other (localStorage is synchronous). */
export const saveScriptCardProgress = (card: QuestCard, lang: Language): MasteryMap => {
  const existing = loadScriptMap(lang);
  const newMap: MasteryMap = {
    ...existing,
    [card.id]: {
      mastery: card.mastery,
      step: card.step,
      dueDate: card.dueDate,
      interval: card.interval,
      ease: card.ease,
      failCount: card.failCount,
      isLeech: card.isLeech,
      isSuspended: card.isSuspended,
      stability: card.stability,
      difficulty: card.difficulty,
      fsrsState: card.fsrsState,
      reps: card.reps,
      lapses: card.lapses,
      lastReview: card.lastReview,
      learningStep: card.learningStep,
    },
  };
  saveScriptMap(newMap, lang);
  return newMap;
};

// ── Levels & gating ──────────────────────────────────────────────────────────

const itemById = (pack: ScriptPack): Map<string, ScriptItem> => {
  const m = new Map<string, ScriptItem>();
  for (const it of pack.items) m.set(it.id, it);
  return m;
};

export const levelStats = (pack: ScriptPack, level: number, progress: MasteryMap): { total: number; seen: number; graduated: number } => {
  const lvl = pack.levels.find(l => l.level === level);
  if (!lvl) return { total: 0, seen: 0, graduated: 0 };
  let seen = 0, graduated = 0;
  for (const id of lvl.itemIds) {
    const p = progress[id];
    if (p) seen++;
    if ((p?.mastery ?? 0) >= 2) graduated++;
  }
  return { total: lvl.itemIds.length, seen, graduated };
};

export const isLevelUnlocked = (pack: ScriptPack, level: number, progress: MasteryMap): boolean => {
  const idx = pack.levels.findIndex(l => l.level === level);
  if (idx <= 0) return idx === 0; // first level always open; unknown level never
  const prev = levelStats(pack, pack.levels[idx - 1].level, progress);
  return prev.total > 0 && prev.graduated / prev.total >= LEVEL_UNLOCK_RATIO;
};

/** The next lesson batch: unseen items from the lowest unlocked level, in
 *  authored order. Empty when everything unlocked has been seen. */
export const nextLessonBatch = (pack: ScriptPack, progress: MasteryMap, batchSize = 6): ScriptItem[] => {
  const byId = itemById(pack);
  for (const lvl of pack.levels) {
    if (!isLevelUnlocked(pack, lvl.level, progress)) break; // levels are ordered; later ones can't be open
    const unseen = lvl.itemIds.filter(id => !progress[id]).map(id => byId.get(id)!).filter(Boolean);
    if (unseen.length > 0) return unseen.slice(0, batchSize);
  }
  return [];
};

// ── Queue building ───────────────────────────────────────────────────────────

/** Items with saved progress that are due now (suspended excluded), oldest due first. */
export const dueScriptItems = (pack: ScriptPack, progress: MasteryMap, now = Date.now()): ScriptItem[] => {
  return pack.items
    .filter(it => {
      const p = progress[it.id];
      return p && !p.isSuspended && (p.dueDate ?? 0) <= now;
    })
    .sort((a, b) => (progress[a.id]!.dueDate ?? 0) - (progress[b.id]!.dueDate ?? 0));
};

/** Build a review-session queue: due reviews (sibling-buried) interleaved with
 *  the fresh lesson batch, all wrapped as QuestCards ready for handleAnswerLogic. */
export const buildScriptQueue = (
  pack: ScriptPack,
  progress: MasteryMap,
  opts: { now?: number; newItems?: ScriptItem[] } = {},
): QuestCard[] => {
  const now = opts.now ?? Date.now();
  const reviews = dueScriptItems(pack, progress, now).map(it => toScriptCard(it, progress[it.id]));
  const fresh = (opts.newItems ?? []).map(it => toScriptCard(it, progress[it.id]));
  return interleaveQueue(burySiblings(reviews), fresh);
};

// ── Drill selection ──────────────────────────────────────────────────────────

export type DrillKind = 'recognition' | 'recall' | 'discrimination' | 'composition';

export interface Drill {
  kind: DrillKind;
  item: ScriptItem;
  /** What the prompt side shows. recognition/composition show the glyph/audio;
   *  recall & discrimination ask the learner to FIND the glyph. */
  prompt: 'glyph' | 'audio' | 'romanization';
  /** 4 options including the answer (composition: component tiles + decoys,
   *  answer order = item.components). Recognition answers by romanization,
   *  everything else by glyph. */
  choices: ScriptItem[];
}

const shuffle = <T>(arr: T[], rng: () => number): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Distractors, best-first: learned/co-batch confusables from the item's
 *  similar set, then same-level batch-mates, then anything already seen.
 *  NEVER glyphs from unseen future levels — a choice the learner has no way
 *  to recognize teaches nothing and leaks upcoming content. Also never an
 *  item sharing the target's romanization (hiragana か vs katakana カ are
 *  both "ka" — either would be a second correct answer). */
const distractorsFor = (item: ScriptItem, pack: ScriptPack, progress: MasteryMap, rng: () => number, n = 3): ScriptItem[] => {
  const seen = (id: string) => !!progress[id];
  // Same-family only: letters/modifiers vs composed vs words never mix in one
  // choice set. Letter audio is synthesized as a CV syllable (ㄱ plays "ga"),
  // so a composed 가 next to letter ㄱ under an audio prompt would be a second
  // correct answer.
  const family = (i: ScriptItem) => (i.kind === 'letter' || i.kind === 'modifier') ? 'letter' : i.kind;
  const eligible = (i: ScriptItem) =>
    i.id !== item.id && family(i) === family(item) && i.romanization !== item.romanization &&
    (seen(i.id) || i.level <= item.level);
  const pool = pack.items.filter(eligible);
  const similarSet = new Set(item.similar ?? []);
  const rank = (i: ScriptItem): number =>
    similarSet.has(i.id) ? 0 :
    i.kind === item.kind && i.level === item.level ? 1 :
    i.kind === item.kind ? 2 : 3;
  // Shuffle first so ties break randomly, then stable-sort by preference rank.
  return shuffle(pool, rng).sort((a, b) => rank(a) - rank(b)).slice(0, n);
};

/** Pick the drill for one queue card. rng is injectable for deterministic tests. */
export const selectDrill = (
  item: ScriptItem,
  pack: ScriptPack,
  progress: MasteryMap,
  rng: () => number = Math.random,
): Drill => {
  const cfg = pack.drill ?? DEFAULT_DRILL;
  const p = progress[item.id];
  const inReview = (p?.mastery ?? 0) >= 2;
  const byId = itemById(pack);

  // Composed items drill as composition once in review (tap the component
  // tiles in order); while learning they behave like recognition. Decoy tiles
  // are picked from letters/modifiers directly — the generic ranker prefers
  // same-kind items, i.e. other composed blocks, which can't be tiles.
  if (item.kind === 'composed' && item.components?.length && inReview) {
    const components = item.components.map(id => byId.get(id)!).filter(Boolean);
    const decoys = shuffle(
      pack.items.filter(i =>
        (i.kind === 'letter' || i.kind === 'modifier') &&
        !item.components!.includes(i.id) &&
        (!!progress[i.id] || i.level <= item.level)),
      rng,
    ).slice(0, 2);
    return { kind: 'composition', item, prompt: 'audio', choices: shuffle([...components, ...decoys], rng) };
  }

  const recognition = (): Drill => ({
    kind: 'recognition', item, prompt: 'glyph',
    choices: shuffle([item, ...distractorsFor(item, pack, progress, rng)], rng),
  });
  const recall = (): Drill => ({
    kind: 'recall', item,
    prompt: cfg.recallPrompts[Math.floor(rng() * cfg.recallPrompts.length)] ?? 'audio',
    choices: shuffle([item, ...distractorsFor(item, pack, progress, rng)], rng),
  });

  if (!inReview) {
    // Learning: 80% recognition (glyph → sound), 20% recall (sound → glyph).
    return rng() < 0.8 ? recognition() : recall();
  }

  // Review: recall by default; discrimination when ≥2 of the similar set are
  // learned — choices drawn from the confusables themselves ("which one is shi?").
  const learnedSimilar = (item.similar ?? []).map(id => byId.get(id)!).filter(i => i && progress[i.id]);
  if (learnedSimilar.length >= 2 && rng() < 0.4) {
    const others = shuffle(learnedSimilar, rng).slice(0, 3);
    const pad = distractorsFor(item, pack, progress, rng, 3 - others.length)
      .filter(d => !others.some(o => o.id === d.id));
    return {
      kind: 'discrimination', item, prompt: cfg.discriminationPrompt,
      choices: shuffle([item, ...others, ...pad].slice(0, 4), rng),
    };
  }
  return recall();
};

// ── Derived status (HOME banner / summary) ───────────────────────────────────

export const isScriptMastered = (pack: ScriptPack, progress: MasteryMap): boolean => {
  const core = pack.items.filter(i => i.kind === 'letter' || i.kind === 'modifier');
  if (core.length === 0) return false;
  const graduated = core.filter(i => (progress[i.id]?.mastery ?? 0) >= 2).length;
  return graduated / core.length >= MASTERED_RATIO;
};

export interface ScriptSummary {
  total: number;       // letter|modifier items
  seen: number;
  graduated: number;
  dueCount: number;
  mastered: boolean;
  /** Cumulative deck words readable now — the highest level whose items are all
   *  at least learning, using the authoring-time precomputed counts. 0 for
   *  deck-less teaser packs. */
  readableWords: number;
}

export const scriptSummary = (pack: ScriptPack, progress: MasteryMap, now = Date.now()): ScriptSummary => {
  const core = pack.items.filter(i => i.kind === 'letter' || i.kind === 'modifier');
  const seen = core.filter(i => !!progress[i.id]).length;
  const graduated = core.filter(i => (progress[i.id]?.mastery ?? 0) >= 2).length;
  let readableWords = 0;
  if (pack.language) {
    for (const lvl of pack.levels) {
      const allLearning = lvl.itemIds.every(id => (progress[id]?.mastery ?? 0) >= 1);
      if (!allLearning) break;
      readableWords = lvl.readableWordCount;
    }
  }
  return {
    total: core.length,
    seen,
    graduated,
    dueCount: dueScriptItems(pack, progress, now).length,
    mastered: isScriptMastered(pack, progress),
    readableWords,
  };
};
