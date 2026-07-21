// Standalone unit tests for the sync merge engine. Run: npx tsx scripts/test-sync-merge.ts
import {
  keyKind, mergeMastery, countLearned, reconcileStats, mergeDaily, mergeProgress,
  mergeVocab, mergeFavorites, mergeAchievements, mergePlacement, mergeSettings, stripSecret,
} from '../src/services/syncMerge';
import type { StudySettings } from '../src/services/storageService';

let pass = 0, fail = 0;
function ok(name: string, cond: boolean) { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + name); } }
function eq(name: string, a: unknown, b: unknown) { ok(name, JSON.stringify(a) === JSON.stringify(b)); }

// keyKind
eq('keyKind mastery', keyKind('quest_mastery_hindi'), 'mastery');
eq('keyKind settings', keyKind('quest_settings'), 'settings');
eq('keyKind unknown', keyKind('quest_sync_dirty'), 'unknown');

// mergeMastery: newer lastReview wins; union of ids; subway-vs-laptop scenario
{
  const phone = { 'c1': { mastery: 2, reps: 5, lastReview: 2000, dueDate: 9 }, 'c2': { mastery: 1, reps: 1, lastReview: 100 } };
  const laptop = { 'c1': { mastery: 1, reps: 3, lastReview: 1000, dueDate: 5 }, 'c3': { mastery: 2, reps: 2, lastReview: 500 } };
  const m = mergeMastery(phone, laptop);
  eq('mastery c1 keeps newer (phone)', m['c1'], { mastery: 2, reps: 5, lastReview: 2000, dueDate: 9 });
  ok('mastery union has c2 and c3', !!m['c2'] && !!m['c3']);
  eq('countLearned', countLearned(m), 2); // c1 + c3 graduated
}
// legacy cards without lastReview fall back to reps
{
  const a = { 'x': { reps: 2 } }, b = { 'x': { reps: 7 } };
  eq('mastery legacy falls back to reps', mergeMastery(a, b)['x'], { reps: 7 });
}

// reconcileStats: max counters, latest date, union freezes, recompute learned
{
  const a = { streak: 10, totalReviews: 500, cardsLearned: 40, lastStudyDate: '2026-07-10', streakFreezes: 1, freezeEarnedAtStreak: 7, freezeUsedDates: ['2026-07-01'] };
  const b = { streak: 12, totalReviews: 480, cardsLearned: 45, lastStudyDate: '2026-07-12', streakFreezes: 2, freezeEarnedAtStreak: 10, freezeUsedDates: ['2026-07-02'] };
  const mm = { 'g1': { mastery: 2 }, 'g2': { mastery: 2 }, 'l1': { mastery: 1 } };
  const s = reconcileStats(a, b, mm);
  ok('stats streak=max', s.streak === 12);
  ok('stats totalReviews=max', s.totalReviews === 500);
  ok('stats lastStudyDate=latest', s.lastStudyDate === '2026-07-12');
  ok('stats freezes=max', s.streakFreezes === 2);
  eq('stats freezeUsedDates union', s.freezeUsedDates, ['2026-07-01', '2026-07-02']);
  ok('stats cardsLearned recomputed from mastery (=2)', s.cardsLearned === 2);
}

// mergeDaily
eq('daily later date wins', mergeDaily({ date: '2026-07-11', newCardsCount: 3 }, { date: '2026-07-12', newCardsCount: 1 }), { date: '2026-07-12', newCardsCount: 1 });
eq('daily same date maxes count', mergeDaily({ date: '2026-07-12', newCardsCount: 3 }, { date: '2026-07-12', newCardsCount: 7 }), { date: '2026-07-12', newCardsCount: 7 });

// mergeProgress: max counters + best ring per boss
{
  const a = { cumulativeNewCards: 100, lastCheckpointAt: 90, lastBossAt: 50, nextBossIndex: 3, bossRecords: [{ bossIndex: 0, bestRing: 'silver' as const, completedAt: 10 }] };
  const b = { cumulativeNewCards: 120, lastCheckpointAt: 80, lastBossAt: 60, nextBossIndex: 2, bossRecords: [{ bossIndex: 0, bestRing: 'gold' as const, completedAt: 20 }, { bossIndex: 1, bestRing: 'bronze' as const, completedAt: 30 }] };
  const p = mergeProgress(a, b);
  ok('progress cumulative=max', p.cumulativeNewCards === 120);
  ok('progress nextBoss=max', p.nextBossIndex === 3);
  eq('progress boss0 keeps gold', p.bossRecords.find(r => r.bossIndex === 0)?.bestRing, 'gold');
  ok('progress has boss1', !!p.bossRecords.find(r => r.bossIndex === 1));
}

// mergeVocab
{
  const a = { hola: { word: 'hola', translation: 'hi', ipa: '', firstSeen: 500, lastSeen: 500, timesSeen: 2, timesFailed: 1 } };
  const b = { hola: { word: 'hola', translation: 'hi', ipa: 'ˈola', firstSeen: 300, lastSeen: 900, timesSeen: 5, timesFailed: 0 } };
  const v = mergeVocab(a, b).hola;
  ok('vocab firstSeen=min', v.firstSeen === 300);
  ok('vocab lastSeen=max', v.lastSeen === 900);
  ok('vocab timesSeen=max', v.timesSeen === 5);
  ok('vocab timesFailed=max', v.timesFailed === 1);
  ok('vocab fills ipa', v.ipa === 'ˈola');
}

// mergeFavorites: union, newer savedAt wins on collision
{
  const a = { w1: { word: 'w1', savedAt: 100 }, w2: { word: 'w2', savedAt: 100 } };
  const b = { w1: { word: 'w1', savedAt: 200 }, w3: { word: 'w3', savedAt: 100 } };
  const f = mergeFavorites(a, b);
  ok('favorites union w1/w2/w3', !!f.w1 && !!f.w2 && !!f.w3);
  ok('favorites collision keeps newer', f.w1.savedAt === 200);
}

// mergeAchievements
eq('achievements union+sort', mergeAchievements(['b', 'a'], ['a', 'c']), ['a', 'b', 'c']);

// placement
ok('placement always true', mergePlacement('true', undefined) === 'true');

// mergeSettings: union maps, KEEP local API key, never accept cloud key
{
  const local: StudySettings = { dailyNewLimit: 20, sessionCardLimit: 10, perLanguageLimits: { hindi: { dailyNewLimit: 15 } }, goalByLanguage: { hindi: 'travel' }, selectedLanguage: 'hindi', learningGoal: 'travel', theme: 'dark', autoPlayAudio: true, audioSpeed: 1.0, googleTtsApiKey: 'SECRET-LOCAL-KEY' };
  const remote = { dailyNewLimit: 30, perLanguageLimits: { spanish: { dailyNewLimit: 25 } }, goalByLanguage: { spanish: 'work' as const }, googleTtsApiKey: 'EVIL-CLOUD-KEY' } as Partial<StudySettings>;
  const s = mergeSettings(local, remote);
  ok('settings takes remote scalar', s.dailyNewLimit === 30);
  ok('settings unions perLanguageLimits', !!s.perLanguageLimits?.hindi && !!s.perLanguageLimits?.spanish);
  ok('settings unions goalByLanguage', s.goalByLanguage?.hindi === 'travel' && s.goalByLanguage?.spanish === 'work');
  ok('settings KEEPS local api key, ignores cloud', s.googleTtsApiKey === 'SECRET-LOCAL-KEY');
}
// mergeSettings with NULL local (brand-new device pairing) must not throw —
// regression: this crashed the whole first pull mid-way (found in click-through)
{
  const remote = { dailyNewLimit: 30, theme: 'dark' as const, perLanguageLimits: { spanish: { dailyNewLimit: 25 } } } as Partial<StudySettings>;
  const s = mergeSettings(null, remote);
  ok('null-local settings takes remote', s.dailyNewLimit === 30 && s.theme === 'dark');
  ok('null-local settings has no api key', s.googleTtsApiKey === undefined);
}

// stripSecret removes the key entirely
{
  const s: StudySettings = { dailyNewLimit: 20, sessionCardLimit: 10, selectedLanguage: 'hindi', learningGoal: 'general', theme: 'light', autoPlayAudio: true, audioSpeed: 1.0, googleTtsApiKey: 'SECRET' };
  const stripped = stripSecret(s) as Record<string, unknown>;
  ok('stripSecret drops googleTtsApiKey', !('googleTtsApiKey' in stripped));
}

console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
