/**
 * Detect Turkish dictionary entries where the lemma field looks wrong.
 *
 * Heuristic: a verb form should share at least the first 2 characters with
 * its declared lemma (after lowercase + diacritic-fold). e.g. "aldı" → "almak"
 * shares "al". "aldı" → "götürmek" shares nothing → flag.
 *
 * For each suspect, propose a fix by finding a candidate infinitive in the
 * dict whose stem matches the form's first chars.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
const txt = fs.readFileSync(SRC, 'utf8');

// Crude regex: pull "'key': { ..., lemma: 'X' }" tuples
// Entries are single-line in tr.ts (verified by grep above).
const ENTRY = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*([^}]*?)\}\s*,?\s*$/gm;

const fold = (s) => s.toLowerCase()
  .replace(/ı/g, 'i').replace(/İ/g, 'i')
  .replace(/ş/g, 's').replace(/ç/g, 'c')
  .replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u');

const knownInfinitives = new Set();
const allEntries = [];
let m;
while ((m = ENTRY.exec(txt)) !== null) {
  const key = m[1];
  const body = m[2];
  const lemmaMatch = body.match(/lemma\s*:\s*['"]([^'"]+)['"]/);
  const posMatch = body.match(/pos\s*:\s*['"]([^'"]+)['"]/);
  const lemma = lemmaMatch ? lemmaMatch[1] : null;
  const pos = posMatch ? posMatch[1] : null;
  if (key.endsWith('mek') || key.endsWith('mak')) knownInfinitives.add(key);
  allEntries.push({ key, lemma, pos, line: txt.slice(0, m.index).split('\n').length });
}

const suspect = [];
const propose = (key) => {
  // Try to find an infinitive in known set whose stem matches the first 2-3 chars of key
  const kf = fold(key);
  const matches = [];
  for (const inf of knownInfinitives) {
    const infStem = fold(inf).slice(0, -3); // strip mek/mak
    if (infStem.length < 2) continue;
    if (kf.startsWith(infStem)) matches.push({ inf, stemLen: infStem.length });
  }
  // Pick the longest matching stem
  matches.sort((a, b) => b.stemLen - a.stemLen);
  return matches[0]?.inf || null;
};

for (const e of allEntries) {
  if (!e.lemma) continue;
  if (!e.lemma.endsWith('mek') && !e.lemma.endsWith('mak')) continue; // not a verb lemma
  if (e.key === e.lemma) continue; // self-reference is fine
  const keyFold = fold(e.key);
  const lemmaStemFold = fold(e.lemma).slice(0, -3);
  if (lemmaStemFold.length < 2) continue;
  // Acceptable: key starts with lemma stem
  if (keyFold.startsWith(lemmaStemFold)) continue;
  // Also acceptable: key shares first 2 chars of lemma stem
  if (keyFold.slice(0, 2) === lemmaStemFold.slice(0, 2)) continue;

  // Mismatch detected — try to propose a fix
  const proposed = propose(e.key);
  suspect.push({ ...e, proposed });
}

console.log(`Total entries scanned: ${allEntries.length}`);
console.log(`Known infinitives in dict: ${knownInfinitives.size}`);
console.log(`Suspect lemma mismatches: ${suspect.length}\n`);

// Group by current (wrong) lemma to show the pattern
const byWrongLemma = {};
for (const s of suspect) {
  if (!byWrongLemma[s.lemma]) byWrongLemma[s.lemma] = [];
  byWrongLemma[s.lemma].push(s);
}
console.log('Suspect entries grouped by wrong lemma (top 20):');
const sorted = Object.entries(byWrongLemma).sort((a, b) => b[1].length - a[1].length);
for (const [lemma, items] of sorted.slice(0, 20)) {
  // Find most common proposed fix for these items
  const props = {};
  for (const it of items) {
    if (it.proposed) props[it.proposed] = (props[it.proposed] || 0) + 1;
  }
  const topProp = Object.entries(props).sort((a, b) => b[1] - a[1])[0];
  console.log(`  "${lemma}"  (${items.length} entries)  →  proposed: ${topProp ? `${topProp[0]} (${topProp[1]})` : 'no proposal'}`);
  console.log(`     samples: ${items.slice(0, 6).map(it => it.key).join(', ')}`);
}

console.log(`\nTotal proposed fixes: ${suspect.filter(s => s.proposed).length}/${suspect.length}`);

// Write fix proposals to JSON for review
const fixes = suspect.filter(s => s.proposed).map(s => ({
  key: s.key,
  line: s.line,
  oldLemma: s.lemma,
  newLemma: s.proposed,
}));
fs.writeFileSync(path.join(__dirname, 'tr-lemma-fixes.json'), JSON.stringify(fixes, null, 2));
console.log(`\nProposed fixes written to scripts/tr-lemma-fixes.json`);
