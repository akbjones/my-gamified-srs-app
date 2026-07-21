// Regression test for the FSRS learning-step loop (2026-07-20): the app never
// persisted the learning_steps index, so every reconstruct restarted at step 0
// and a GOOD-rated new card looped at "+10m" forever (8+ in-session shows,
// never graduating). Mirrors the FIXED toFsrsCard round-trip incl. the
// legacy-card heal. Run: node scripts/test-srs-steps.cjs
const { fsrs, generatorParameters, createEmptyCard, Rating, State } = require('ts-fsrs');
const f = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true }));
const DAY = 86400000;
const sname = s => ({0:'New',1:'Learning',2:'Review',3:'Relearning'}[s]);

function reconstructFixed(stored, now) { // mirrors fixed toFsrsCard
  const base = createEmptyCard(now);
  if (!stored) return base;
  const lastStep = 1;
  const learningStep = stored.learningStep ?? Math.min(stored.reps ?? 0, lastStep);
  return { ...base, due: new Date(stored.dueDate), stability: stored.stability,
    difficulty: stored.difficulty, scheduled_days: Math.max(0, Math.round(stored.interval / DAY)),
    reps: stored.reps, lapses: stored.lapses, state: stored.fsrsState,
    last_review: new Date(stored.lastReview), learning_steps: learningStep };
}
function persist(next, now) { return { stability: next.stability, difficulty: next.difficulty,
  fsrsState: next.state, reps: next.reps, lapses: next.lapses, lastReview: now.getTime(),
  dueDate: next.due.getTime(), interval: next.due.getTime() - now.getTime(),
  learningStep: next.learning_steps }; }

let fails = 0;
function check(name, cond) { if (!cond) { fails++; console.error('  ✗ ' + name); } else console.log('  ✓ ' + name); }

// Scenario 1: new card, GOOD every time → exactly 2 in-session shows then graduate
{
  let now = new Date('2026-07-20T12:00:00Z'); let stored = null; let shows = 0; let states = [];
  for (let i = 0; i < 6; i++) {
    shows++;
    const { card: next } = f.next(reconstructFixed(stored, now), now, Rating.Good);
    stored = persist(next, now); states.push(sname(next.state));
    if (!(next.due.getTime() - now.getTime() < DAY && next.state !== State.Review)) break;
    now = new Date(now.getTime() + 2 * 60000);
  }
  console.log(`Scenario 1 (new + GOODs): shows=${shows} states=${states.join('→')}`);
  check('graduates after exactly 2 shows', shows === 2 && states[1] === 'Review');
}
// Scenario 2: HEAL — legacy stuck card (Learning, reps=5, NO learningStep) → next GOOD graduates
{
  const now = new Date('2026-07-20T12:00:00Z');
  const stuck = { stability: 0.6, difficulty: 5, fsrsState: 1, reps: 5, lapses: 0,
    lastReview: now.getTime() - 10*60000, dueDate: now.getTime(), interval: 10*60000, learningStep: undefined };
  const { card: next } = f.next(reconstructFixed(stuck, now), now, Rating.Good);
  console.log(`Scenario 2 (stuck legacy card + GOOD): state=${sname(next.state)} due=+${Math.round((next.due-now)/DAY)}d`);
  check('stuck card graduates on next GOOD', next.state === State.Review);
}
// Scenario 3: AGAIN resets the ladder (correct FSRS behavior preserved)
{
  let now = new Date('2026-07-20T12:00:00Z'); let stored = null;
  let r = f.next(reconstructFixed(stored, now), now, Rating.Good); stored = persist(r.card, now); // step 1
  now = new Date(now.getTime() + 2*60000);
  r = f.next(reconstructFixed(stored, now), now, Rating.Again); stored = persist(r.card, now);   // reset
  console.log(`Scenario 3 (GOOD then AGAIN): state=${sname(r.card.state)} steps_idx=${r.card.learning_steps}`);
  check('AGAIN keeps card in learning at step 0', r.card.state === State.Learning && r.card.learning_steps === 0);
  // then two more GOODs should graduate
  now = new Date(now.getTime() + 2*60000);
  r = f.next(reconstructFixed(stored, now), now, Rating.Good); stored = persist(r.card, now);
  now = new Date(now.getTime() + 2*60000);
  r = f.next(reconstructFixed(stored, now), now, Rating.Good);
  check('two GOODs after a lapse graduate', r.card.state === State.Review);
}
console.log(fails === 0 ? '\n✓ ALL PASS' : `\n✗ ${fails} FAILURES`);
process.exit(fails ? 1 : 0);
