/**
 * Tally Swedish missing-infinitive proposals from form scanning.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'sv.ts');
const txt = fs.readFileSync(SRC, 'utf8');

function looksLikeInfinitive(k) {
  if (k.endsWith('a')) return true;
  if (k.length <= 3 && /^[a-zåäö]+$/.test(k) && /[aeiouyåäö]$/.test(k)) return true;
  return false;
}

const knownInfinitives = new Set();
const ENTRY = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*([^}]*?)\}\s*,?\s*$/gm;
let m;
while ((m = ENTRY.exec(txt)) !== null) {
  if (looksLikeInfinitive(m[1])) knownInfinitives.add(m[1]);
}

function proposeInfinitives(form) {
  const proposals = [];
  const variants = [form];
  if (form.endsWith('s') && form.length >= 4) variants.push(form.slice(0, -1));
  for (const f of variants) {
    if (f.length >= 2) proposals.push(f + 'a');
    if (f.endsWith('ade')) proposals.push(f.slice(0, -3) + 'a');
    if (f.endsWith('at')) proposals.push(f.slice(0, -2) + 'a');
    if (f.endsWith('te')) proposals.push(f.slice(0, -2) + 'a');
    if (f.endsWith('de')) proposals.push(f.slice(0, -2) + 'a');
    if (f.endsWith('dde')) proposals.push(f.slice(0, -3));
    if (f.endsWith('it')) proposals.push(f.slice(0, -2) + 'a');
    if (f.endsWith('ar')) proposals.push(f.slice(0, -1));
    if (f.endsWith('er')) proposals.push(f.slice(0, -2) + 'a');
    if (f.endsWith('r')) proposals.push(f.slice(0, -1));
  }
  return proposals;
}

const tally = {};
ENTRY.lastIndex = 0;
while ((m = ENTRY.exec(txt)) !== null) {
  const key = m[1];
  const body = m[2];
  if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
  if (/lemma\s*:/.test(body)) continue;
  if (looksLikeInfinitive(key)) continue;
  const proposals = proposeInfinitives(key);
  // Tally each unique proposal (skipping ones that ARE in dict and skipping
  // the trivial "form + a" pass-through which is usually garbage when the
  // form already carries an inflection suffix).
  const seen = new Set();
  for (const p of proposals) {
    if (knownInfinitives.has(p)) { seen.clear(); break; }
    if (p.length >= 4 && p.endsWith('a') && !seen.has(p)) {
      seen.add(p);
    }
  }
  for (const p of seen) {
    tally[p] = (tally[p] || 0) + 1;
  }
}

const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
console.log(`Unique missing infinitives: ${sorted.length}`);
console.log(`Top 40:`);
for (const [inf, count] of sorted.slice(0, 40)) {
  console.log(`  ${inf.padEnd(24)} ${count}`);
}
