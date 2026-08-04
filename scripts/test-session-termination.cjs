// Regression test for the unbounded in-session re-drill (2026-08-04).
//
// handleAnswerLogic re-inserted any sub-day learning card into the live queue
// with no repeat counter. HARD correctly repeats the current FSRS learning step
// (Anki semantics), so a card the user kept rating Hard was re-queued forever.
// Worse: each re-insert grew the queue by 1 while currentIndex advanced by 1,
// so `queue.length - currentIndex` never shrank and the session could not end.
//
// This drives the REAL handleAnswerLogic through tsx and asserts termination.
// Run: npx tsx scripts/test-session-termination.cjs
const { execFileSync } = require('child_process');

const SRC = `
import { handleAnswerLogic } from '../../src/services/srsService.ts';

const mkCard = (i: number) => ({
  id: 'c-' + i, topic: 'node-01', target: 't' + i, english: 'e' + i,
  mastery: 0, step: 0, interval: 0, ease: 2.5, failCount: 0,
  isLeech: false, isSuspended: false, priority: i,
} as any);

function runSession(rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY', n = 20, maxPresentations = 5000) {
  let session: any = {
    language: 'spanish', topic: 'node-01',
    queue: Array.from({ length: n }, (_, i) => mkCard(i)),
    currentIndex: 0, isFlipped: false, finishedCount: 0, newCardsSeen: 0,
  };
  const shows: Record<string, number> = {};
  let presentations = 0;
  while (session.currentIndex < session.queue.length) {
    if (++presentations > maxPresentations) return { terminated: false, presentations, shows };
    const card = session.queue[session.currentIndex];
    shows[card.id] = (shows[card.id] || 0) + 1;
    const { sessionUpdates } = handleAnswerLogic(rating, card, session, () => {});
    session = { ...session, ...sessionUpdates };
  }
  return { terminated: true, presentations, shows };
}

const results: Record<string, any> = {};
for (const r of ['AGAIN', 'HARD', 'GOOD', 'EASY'] as const) {
  const { terminated, presentations, shows } = runSession(r);
  const counts = Object.values(shows) as number[];
  results[r] = {
    terminated, presentations,
    maxShowsForOneCard: Math.max(...counts),
    distinctCards: counts.length,
  };
}
console.log(JSON.stringify(results, null, 2));
`;

const fs = require('fs');
const path = require('path');
const tmp = path.join(__dirname, 'tmp', '_session-termination.ts');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, SRC);

let out;
try {
  out = execFileSync('npx', ['tsx', tmp], { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
} finally {
  fs.unlinkSync(tmp);
}

const results = JSON.parse(out);
const MAX_SESSION_SHOWS = 4;
let failed = 0;
const check = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) failed++; };

console.log('in-session re-drill is bounded and every session terminates\n');
for (const [rating, r] of Object.entries(results)) {
  console.log(`${rating}: terminated=${r.terminated} presentations=${r.presentations} maxShows=${r.maxShowsForOneCard}`);
  check(r.terminated, `${rating}: session reaches the end of its queue`);
  check(r.maxShowsForOneCard <= MAX_SESSION_SHOWS, `${rating}: no card shown more than ${MAX_SESSION_SHOWS}x (was ${r.maxShowsForOneCard})`);
}
// A correct GOOD run still needs the 2 presses that graduate a card (1m/10m).
check(results.GOOD.maxShowsForOneCard === 2, `GOOD: still takes exactly 2 shows to graduate (Anki default)`);
check(results.EASY.maxShowsForOneCard === 1, `EASY: still graduates in 1 show`);

console.log(failed ? `\n✗ ${failed} assertion(s) failed` : '\n✓ all assertions passed');
process.exit(failed ? 1 : 0);
