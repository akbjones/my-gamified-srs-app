/**
 * Smoke test for the Hindi -कर / -के conjunctive-participle fix.
 *   npx tsx scripts/tmp/hi-kar-smoke.ts
 */
import { conjugateHindi, findInfinitive } from '../../src/data/conjugation/hi';

let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};

// (a) findInfinitive resolves -कर / -के surface forms back to the -ना infinitive
eq('findInfinitive(खाकर)', findInfinitive('खाकर'), 'खाना');
eq('findInfinitive(करके)', findInfinitive('करके'), 'करना');
eq('findInfinitive(जाकर)', findInfinitive('जाकर'), 'जाना');
eq('findInfinitive(देखकर)', findInfinitive('देखकर'), 'देखना');
eq('findInfinitive(लेकर)', findInfinitive('लेकर'), 'लेना');
eq('findInfinitive(देकर)', findInfinitive('देकर'), 'देना');
eq('findInfinitive(पीकर)', findInfinitive('पीकर'), 'पीना');
eq('findInfinitive(होकर)', findInfinitive('होकर'), 'होना');
eq('findInfinitive(उठकर)', findInfinitive('उठकर'), 'उठना');
eq('findInfinitive(बोलकर)', findInfinitive('बोलकर'), 'बोलना');

// Guard: genuine subjunctive / genitive के must NOT be stolen by the -के strip
eq('findInfinitive(करे) still subjunctive', findInfinitive('करे'), 'करना');
eq('findInfinitive(ढके) still past-plural', findInfinitive('ढके'), 'ढकना');

// (b) conjugate() now emits a कर-form row containing the tapped word
const label = 'पूर्वकालिक (Conjunctive: having done)';
function conjHas(inf: string, want: string) {
  const t = conjugateHindi(inf);
  const row = t?.tenses?.[label];
  const present = !!row && row.includes(want);
  if (!present) fail++;
  console.log(`${present ? 'PASS' : 'FAIL'}  conjugate(${inf})['${label}'] contains ${want}: row=${JSON.stringify(row)}`);
}
conjHas('खाना', 'खाकर');
conjHas('करना', 'करके');
conjHas('जाना', 'जाकर');
conjHas('देखना', 'देखकर');
conjHas('लेना', 'लेकर');
conjHas('देना', 'देकर');
conjHas('पीना', 'पीकर');
conjHas('होना', 'होकर');
conjHas('बोलना', 'बोलकर');
conjHas('बंद करना', 'बंद करके');

console.log(`\n${fail === 0 ? 'ALL PASS' : fail + ' FAILURE(S)'}`);
process.exit(fail === 0 ? 0 : 1);
