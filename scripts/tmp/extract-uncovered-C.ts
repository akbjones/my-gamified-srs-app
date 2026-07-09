/** Extract tokens from wave2-el-cards-C.json and classify coverage. */
import { readFileSync, existsSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/el';
import { findInfinitive, normalizeGreek } from '../../src/data/conjugation/el';

const ROOT = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones';
const cards: any[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave2-el-cards-C.json`, 'utf8'));

const tokenize = (t: string): string[] =>
  t.split(/\s+/)
    .map((w) => normalizeGreek(w).replace(/[^α-ωάέήίόύώϊϋΐΰ]/g, ''))
    .filter(Boolean);

// token -> example sentences (up to 3)
const examples = new Map<string, string[]>();
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    if (!examples.has(tok)) examples.set(tok, []);
    const ex = examples.get(tok)!;
    if (ex.length < 3) ex.push(`${c.target} = ${c.english}`);
  }
}

let dictHit = 0, engineHit = 0;
const uncovered: string[] = [];
for (const tok of [...examples.keys()].sort()) {
  if (lookupWord(tok)) { dictHit++; continue; }
  const inf = findInfinitive(tok);
  if (inf) { engineHit++; console.error(`engine: ${tok} -> ${inf}`); continue; }
  uncovered.push(tok);
}

console.log(`total unique tokens: ${examples.size}`);
console.log(`dict-covered: ${dictHit}, engine-covered: ${engineHit}, uncovered: ${uncovered.length}\n`);
for (const tok of uncovered) {
  console.log(`### ${tok}`);
  for (const ex of examples.get(tok)!) console.log(`    ${ex}`);
}
