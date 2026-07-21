// Unit tests for the script-teacher engine (P0): QuestCard wrapping, level
// gating, queue building, drill selection, and — critically — a full trip
// through the REAL handleAnswerLogic with an injected save callback, proving
// script items ride the existing ts-fsrs pipeline (learning steps included)
// with zero scheduler changes. Run: npx tsx scripts/test-script-engine.ts
//
// (Importing the service chain works under tsx because syncService guards its
// import.meta.env read — sync just reports unconfigured outside Vite.)

import type { QuestCard, MasteryMap } from '../src/types';
import type { ScriptPack, ScriptItem } from '../src/data/scripts/types';
import {
  toScriptCard, levelStats, isLevelUnlocked, nextLessonBatch,
  dueScriptItems, buildScriptQueue, selectDrill, isScriptMastered, scriptSummary,
} from '../src/services/scriptSrsService';
import { handleAnswerLogic } from '../src/services/srsService';
import type { SessionState } from '../src/types';
import hangulPack from '../src/data/scripts/hangul.json';

let pass = 0, fail = 0;
function ok(name: string, cond: boolean) { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + name); } }
function eq(name: string, a: unknown, b: unknown) { ok(name, JSON.stringify(a) === JSON.stringify(b)); }

const pack = hangulPack as unknown as ScriptPack;
const byId = new Map(pack.items.map(i => [i.id, i]));
const item = (id: string): ScriptItem => byId.get(id)!;

// A deterministic rng that plays back a fixed sequence (repeats last value).
const seqRng = (...vals: number[]) => { let i = 0; return () => vals[Math.min(i++, vals.length - 1)]; };

// ── pack sanity (stub, but must satisfy the schema the engine relies on) ─────
{
  ok('pack has items and levels', pack.items.length > 0 && pack.levels.length >= 2);
  ok('every level itemId resolves', pack.levels.every(l => l.itemIds.every(id => byId.has(id))));
  ok('every similar id resolves', pack.items.every(i => (i.similar ?? []).every(id => byId.has(id))));
  ok('every component id resolves', pack.items.every(i => (i.components ?? []).every(id => byId.has(id))));
  ok('composed items have components', pack.items.filter(i => i.kind === 'composed').every(i => (i.components?.length ?? 0) >= 2));
  ok('mnemonics ≤200 chars, no em dashes', pack.items.every(i => i.mnemonic.length <= 200 && !i.mnemonic.includes('—')));
}

// ── toScriptCard: required QuestCard fields stubbed correctly ────────────────
{
  const c = toScriptCard(item('sc-ko-0001'));
  ok('wrap: category/topic mark script track', c.category === 'Script' && c.topic === 'script');
  ok('wrap: target=glyph english=romanization', c.target === 'ㄱ' && c.english === 'g');
  ok('wrap: new card mastery 0', c.mastery === 0);
  const saved = { mastery: 2, reps: 5, dueDate: 123, lastReview: 100 };
  const c2 = toScriptCard(item('sc-ko-0001'), saved);
  ok('wrap: saved progress restored', c2.mastery === 2 && c2.reps === 5 && c2.dueDate === 123);
}

// ── full FSRS trip: GOOD → GOOD graduates via the REAL handleAnswerLogic ─────
{
  const progress: MasteryMap = {};
  const save = (card: QuestCard) => {
    progress[card.id] = {
      mastery: card.mastery, step: card.step, dueDate: card.dueDate, interval: card.interval,
      stability: card.stability, difficulty: card.difficulty, fsrsState: card.fsrsState,
      reps: card.reps, lapses: card.lapses, lastReview: card.lastReview, learningStep: card.learningStep,
    };
  };
  let card = toScriptCard(item('sc-ko-0001'));
  const session = { queue: [card], currentIndex: 0, newCardsSeen: 0 } as unknown as SessionState;

  const r1 = handleAnswerLogic('GOOD', card, session, save);
  ok('fsrs: first GOOD → learning', r1.updatedCard.mastery === 1);
  ok('fsrs: learningStep persisted', progress['sc-ko-0001'].learningStep === r1.updatedCard.learningStep);

  // Reconstruct from persisted progress (the app does this between shows) —
  // the learning-step round-trip is what makes the second GOOD graduate.
  card = toScriptCard(item('sc-ko-0001'), progress['sc-ko-0001']);
  const r2 = handleAnswerLogic('GOOD', card, session, save);
  ok('fsrs: second GOOD → graduated (no step-0 loop)', r2.updatedCard.mastery === 2);
  ok('fsrs: graduated due ≥1 day out', (r2.updatedCard.interval ?? 0) >= 24 * 60 * 60 * 1000 * 0.9);
}

// ── level gating: 80% of previous level graduates the gate ───────────────────
{
  const progress: MasteryMap = {};
  ok('gate: level 1 open from zero', isLevelUnlocked(pack, 1, progress));
  ok('gate: level 2 locked from zero', !isLevelUnlocked(pack, 2, progress));

  const l1 = pack.levels[0].itemIds;
  // Graduate 8 of 11 (72%) → still locked; 9 of 11 (81%) → open.
  l1.slice(0, 8).forEach(id => { progress[id] = { mastery: 2, lastReview: 1 }; });
  ok('gate: 72% graduated still locked', !isLevelUnlocked(pack, 2, progress));
  progress[l1[8]] = { mastery: 2, lastReview: 1 };
  ok('gate: 81% graduated unlocks level 2', isLevelUnlocked(pack, 2, progress));

  const stats = levelStats(pack, 1, progress);
  eq('levelStats counts', { total: stats.total, seen: stats.seen, graduated: stats.graduated }, { total: 11, seen: 9, graduated: 9 });
}

// ── lesson batches: unseen items from the lowest unlocked level, capped ──────
{
  const progress: MasteryMap = {};
  const b1 = nextLessonBatch(pack, progress, 6);
  eq('batch: first 6 of level 1 in authored order', b1.map(i => i.id), pack.levels[0].itemIds.slice(0, 6));
  pack.levels[0].itemIds.slice(0, 6).forEach(id => { progress[id] = { mastery: 1, lastReview: 1 }; });
  const b2 = nextLessonBatch(pack, progress, 6);
  eq('batch: continues with the unseen remainder', b2.map(i => i.id), pack.levels[0].itemIds.slice(6));
  // All of level 1 seen but not graduated → level 2 still gated → no batch.
  pack.levels[0].itemIds.forEach(id => { progress[id] = { mastery: 1, lastReview: 1 }; });
  eq('batch: empty while next level locked', nextLessonBatch(pack, progress, 6).length, 0);
  pack.levels[0].itemIds.forEach(id => { progress[id] = { mastery: 2, lastReview: 1 }; });
  eq('batch: level 2 items once unlocked', nextLessonBatch(pack, progress, 6).map(i => i.id), pack.levels[1].itemIds);
}

// ── queue: due-only, suspended excluded, sorted, new interleaved ─────────────
{
  const now = 1_000_000;
  const progress: MasteryMap = {
    'sc-ko-0001': { mastery: 2, dueDate: now - 500, lastReview: 1 },
    'sc-ko-0002': { mastery: 2, dueDate: now - 900, lastReview: 1 },
    'sc-ko-0003': { mastery: 2, dueDate: now + 999999, lastReview: 1 },      // not due
    'sc-ko-0004': { mastery: 2, dueDate: now - 100, isSuspended: true, lastReview: 1 }, // suspended
  };
  const due = dueScriptItems(pack, progress, now);
  eq('due: only due+unsuspended, oldest first', due.map(i => i.id), ['sc-ko-0002', 'sc-ko-0001']);

  const q = buildScriptQueue(pack, progress, { now, newItems: [item('sc-ko-0005')] });
  eq('queue: reviews + new item all present', [...q.map(c => c.id)].sort(), ['sc-ko-0001', 'sc-ko-0002', 'sc-ko-0005'].sort());
  ok('queue: wrapped as QuestCards', q.every(c => c.category === 'Script' && typeof c.target === 'string'));
}

// ── drills ───────────────────────────────────────────────────────────────────
{
  // Learning state → recognition at rng<0.8, recall otherwise.
  const learning: MasteryMap = { 'sc-ko-0001': { mastery: 1, lastReview: 1 }, 'sc-ko-0002': { mastery: 1, lastReview: 1 }, 'sc-ko-0006': { mastery: 1, lastReview: 1 } };
  const d1 = selectDrill(item('sc-ko-0001'), pack, learning, seqRng(0.1, 0.5, 0.5, 0.5, 0.5));
  ok('drill: learning → recognition, glyph prompt', d1.kind === 'recognition' && d1.prompt === 'glyph');
  ok('drill: 4 unique choices incl. answer', d1.choices.length === 4 && new Set(d1.choices.map(c => c.id)).size === 4 && d1.choices.some(c => c.id === 'sc-ko-0001'));
  ok('drill: no future-level distractors', d1.choices.every(c => !!learning[c.id] || c.level <= item('sc-ko-0001').level));
  const d2 = selectDrill(item('sc-ko-0001'), pack, learning, seqRng(0.9, 0.0, 0.5, 0.5, 0.5));
  ok('drill: learning rng≥0.8 → recall', d2.kind === 'recall');

  // Review with ≥2 learned similars → discrimination at rng<0.4; choices favor the similar set.
  const review: MasteryMap = {
    'sc-ko-0002': { mastery: 2, lastReview: 1 },
    'sc-ko-0001': { mastery: 2, lastReview: 1 },
    'sc-ko-0003': { mastery: 2, lastReview: 1 },
  };
  const d3 = selectDrill(item('sc-ko-0002'), pack, review, seqRng(0.1, 0.5, 0.5, 0.5, 0.5));
  ok('drill: review + 2 learned similars → discrimination', d3.kind === 'discrimination');
  ok('drill: discrimination includes both confusables', ['sc-ko-0001', 'sc-ko-0003'].every(id => d3.choices.some(c => c.id === id)));
  const d4 = selectDrill(item('sc-ko-0002'), pack, review, seqRng(0.9, 0.5, 0.5, 0.5, 0.5));
  ok('drill: review rng≥0.4 → recall', d4.kind === 'recall');

  // Composed item in review → composition with its component tiles present.
  const revComposed: MasteryMap = { ...review, 'sc-ko-0006': { mastery: 2, lastReview: 1 }, 'sc-ko-0012': { mastery: 2, lastReview: 1 } };
  const d5 = selectDrill(item('sc-ko-0012'), pack, revComposed, seqRng(0.5));
  ok('drill: composed in review → composition', d5.kind === 'composition');
  ok('drill: composition has all component tiles', item('sc-ko-0012').components!.every(id => d5.choices.some(c => c.id === id)));
  ok('drill: composition decoys are not composed items', d5.choices.every(c => c.kind !== 'composed' || item('sc-ko-0012').components!.includes(c.id)));
  ok('drill: composition HAS decoy tiles beyond the components', d5.choices.length > item('sc-ko-0012').components!.length);
  // Composed but still learning → falls back to recognition/recall.
  const d6 = selectDrill(item('sc-ko-0012'), pack, { 'sc-ko-0012': { mastery: 1, lastReview: 1 } }, seqRng(0.1, 0.5, 0.5, 0.5, 0.5));
  ok('drill: composed while learning → not composition', d6.kind !== 'composition');
}

// ── mastered + summary ───────────────────────────────────────────────────────
{
  const progress: MasteryMap = {};
  const letters = pack.items.filter(i => i.kind === 'letter');
  ok('mastered: false at zero', !isScriptMastered(pack, progress));
  // 9 of 11 letters (81%) < 90% → not mastered; 10 of 11 (90.9%) → mastered.
  letters.slice(0, 9).forEach(i => { progress[i.id] = { mastery: 2, lastReview: 1 }; });
  ok('mastered: 81% not yet', !isScriptMastered(pack, progress));
  progress[letters[9].id] = { mastery: 2, lastReview: 1 };
  ok('mastered: 90.9% crosses the line', isScriptMastered(pack, progress));

  const s = scriptSummary(pack, progress, 1);
  ok('summary: counts core items only', s.total === letters.length && s.graduated === 10);
  ok('summary: mastered flag matches', s.mastered);
}

console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
