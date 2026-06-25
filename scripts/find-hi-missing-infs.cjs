/**
 * Tally missing Hindi infinitives — verb forms whose stripped stem doesn't
 * match any dict infinitive. The top entries are good candidates to add.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'hi.ts');
const txt = fs.readFileSync(SRC, 'utf8');

const HABITUAL_SUFFIXES   = ['ता', 'ती', 'ते', 'तीं'];
const CONTINUOUS_SUFFIXES = ['रहा', 'रही', 'रहे'];
const FUTURE_SUFFIXES     = ['ऊँगा', 'ऊँगी', 'ूँगा', 'ूँगी', 'एगा', 'एगी', 'ेगा', 'ेगी', 'एँगे', 'एँगी', 'ेंगे', 'ेंगी', 'ओगे', 'ओगी', 'ोगे', 'ोगी'];
const SUBJUNCTIVE_SUFFIXES = ['ऊँ', 'ूँ', 'ए', 'ें', 'एँ', 'ओ', 'ो', 'े'];
const PAST_SUFFIXES = ['ा', 'े', 'ी', 'ीं', 'ें'];
const OBLIQUE = ['ने'];
const SUFFIXES = [
  ...FUTURE_SUFFIXES,
  ...CONTINUOUS_SUFFIXES,
  ...HABITUAL_SUFFIXES,
  ...SUBJUNCTIVE_SUFFIXES,
  ...OBLIQUE,
  ...PAST_SUFFIXES,
].sort((a, b) => b.length - a.length);

const knownInfinitives = new Set();
const ENTRY = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*([^}]*?)\}\s*,?\s*$/gm;
let m;
while ((m = ENTRY.exec(txt)) !== null) {
  if (m[1].endsWith('ना')) knownInfinitives.add(m[1]);
}

const tally = {};
ENTRY.lastIndex = 0;
while ((m = ENTRY.exec(txt)) !== null) {
  const key = m[1];
  const body = m[2];
  if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
  if (/lemma\s*:/.test(body)) continue;
  if (key.endsWith('ना')) continue;
  const main = key.split(/\s+/)[0];
  for (const sfx of SUFFIXES) {
    if (main.endsWith(sfx)) {
      const stem = main.slice(0, -sfx.length);
      if (stem.length >= 2) {
        const candidate = stem + 'ना';
        if (!knownInfinitives.has(candidate)) {
          tally[candidate] = (tally[candidate] || 0) + 1;
        }
        break;
      }
    }
  }
}

const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
console.log(`Unique missing infinitives: ${sorted.length}`);
console.log(`Top 30:`);
for (const [inf, count] of sorted.slice(0, 30)) {
  console.log(`  ${inf.padEnd(20)} ${count}`);
}
