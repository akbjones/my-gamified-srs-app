/**
 * Backfill missing `lemma:` fields on Hindi verb dict entries by stripping
 * known conjugation suffixes and reconstructing the -ना infinitive.
 *
 * Conservative: only injects a lemma if the reconstructed infinitive is
 * present in the dict as its own entry.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'hi.ts');
const txt = fs.readFileSync(SRC, 'utf8');
const lines = txt.split('\n');

// Suffixes the engine reverses (mirrors src/data/conjugation/hi.ts).
// Longer first so present-participle "ता है" matches as one block.
const HABITUAL_SUFFIXES   = ['ता', 'ती', 'ते', 'तीं'];
const CONTINUOUS_SUFFIXES = ['रहा', 'रही', 'रहे'];
const FUTURE_SUFFIXES     = ['ऊँगा', 'ऊँगी', 'ूँगा', 'ूँगी', 'एगा', 'एगी', 'ेगा', 'ेगी', 'एँगे', 'एँगी', 'ेंगे', 'ेंगी', 'ओगे', 'ओगी', 'ोगे', 'ोगी'];
const SUBJUNCTIVE_SUFFIXES = ['ऊँ', 'ूँ', 'ए', 'ें', 'एँ', 'ओ', 'ो', 'े'];
const PAST_SUFFIXES = ['ा', 'े', 'ी', 'ीं', 'ें'];
const OBLIQUE = ['ने'];

// Order matters: longest first to avoid eager-match. Then habitual, continuous,
// future, subjunctive, oblique, past.
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
  const key = m[1];
  if (key.endsWith('ना')) knownInfinitives.add(key);
}

function findInfinitive(form) {
  if (form.endsWith('ना') && form.length >= 4) return form;
  // Try multi-word forms: take first whitespace token (e.g., "करता हूँ" → "करता")
  const main = form.split(/\s+/)[0];
  for (const sfx of SUFFIXES) {
    if (main.endsWith(sfx)) {
      const stem = main.slice(0, -sfx.length);
      if (stem.length >= 2) {
        const candidate = stem + 'ना';
        if (knownInfinitives.has(candidate)) return candidate;
      }
    }
  }
  return null;
}

let applied = 0;
let skipped = 0;
const skips = { noProposal: 0, alreadyHas: 0 };
const samples = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const keyMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{(.+)\}\s*,?\s*$/);
  if (!keyMatch) continue;
  const key = keyMatch[1];
  const body = keyMatch[2];
  if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
  if (/lemma\s*:/.test(body)) { skipped++; skips.alreadyHas++; continue; }
  if (key.endsWith('ना')) continue;  // self-infinitive

  const proposed = findInfinitive(key);
  if (!proposed) { skipped++; skips.noProposal++; continue; }

  const newLine = line.replace(/(\}\s*,?\s*)$/, ", lemma: '" + proposed + "' $1");
  lines[i] = newLine;
  applied++;
  if (samples.length < 10) samples.push({ key, lemma: proposed });
}

if (applied > 0) {
  fs.writeFileSync(SRC, lines.join('\n'));
}

console.log(`Applied: ${applied}`);
console.log(`Skipped: ${skipped}  (no proposal: ${skips.noProposal}, already has lemma: ${skips.alreadyHas})`);
console.log(`Sample applied:`);
for (const s of samples) console.log(`  ${s.key} → ${s.lemma}`);
