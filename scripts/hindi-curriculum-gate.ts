// Curriculum regression gate. Run in CI: a deck edit that reopens a tier-1
// gap, pushes a tier-1 teachable past its band, or adds a card that teaches
// nothing fails the build. This is what stops the sentence-first disease from
// growing back.
//
//   npx tsx scripts/hindi-curriculum-gate.ts            # check against baseline
//   npx tsx scripts/hindi-curriculum-gate.ts --baseline # record a new baseline
//
// Exit 0 = pass, 1 = regression.
import fs from 'fs';
import { execSync } from 'child_process';

const RECORD = process.argv.includes('--baseline');
const BASELINE = 'docs/hindi/curriculum-baseline.json';

// The compiler writes the report; run it fresh so the gate can never pass on
// stale numbers.
execSync('npx tsx scripts/hindi-coverage-compiler.ts', { stdio: 'pipe' });
const report = JSON.parse(fs.readFileSync('docs/hindi/coverage-report.json', 'utf8'));

const current = {
  gapsTier1: report.gaps.filter((g: any) => g.tier === 1).length,
  gapsTier2: report.gaps.filter((g: any) => g.tier === 2).length,
  gapsTotal: report.summary.gapsTier1to4,
  tooLateTier1: report.tooLate.filter((l: any) => l.tier === 1).length,
  tooLateTotal: report.summary.tooLate,
  deadWeight: report.summary.deadWeightCards,
  covered: report.summary.covered,
};

if (RECORD) {
  fs.writeFileSync(BASELINE, JSON.stringify({ recorded: new Date().toISOString().slice(0, 10), ...current }, null, 1));
  console.log('baseline recorded:', JSON.stringify(current, null, 1));
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error('No baseline. Run with --baseline first.');
  process.exit(1);
}
const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));

// Ratchet: these may improve but never regress.
const CHECKS: [string, 'lower-better' | 'higher-better'][] = [
  ['gapsTier1', 'lower-better'],
  ['gapsTier2', 'lower-better'],
  ['gapsTotal', 'lower-better'],
  ['tooLateTier1', 'lower-better'],
  ['tooLateTotal', 'lower-better'],
  ['deadWeight', 'lower-better'],
  ['covered', 'higher-better'],
];

const failures: string[] = [];
for (const [key, dir] of CHECKS) {
  const now = (current as any)[key], was = base[key];
  const regressed = dir === 'lower-better' ? now > was : now < was;
  const arrow = now === was ? '=' : regressed ? 'REGRESSED' : 'improved';
  console.log(`${regressed ? 'FAIL' : 'ok  '} ${key.padEnd(14)} ${String(was).padStart(5)} -> ${String(now).padStart(5)}  ${arrow}`);
  if (regressed) failures.push(`${key}: ${was} -> ${now}`);
}

// Hard floor regardless of baseline: tier-1 teachables are non-negotiable.
if (current.gapsTier1 > 0) {
  console.log(`\nHARD FAIL: ${current.gapsTier1} tier-1 teachables are still not taught anywhere:`);
  for (const g of report.gaps.filter((x: any) => x.tier === 1).slice(0, 20)) console.log(`   ${g.hi} – ${g.en}`);
  failures.push(`tier-1 gaps must be zero (${current.gapsTier1} open)`);
}

if (failures.length) {
  console.error('\ncurriculum gate FAILED:\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log('\ncurriculum gate passed.');
