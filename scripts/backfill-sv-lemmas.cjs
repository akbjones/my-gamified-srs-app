/**
 * Backfill missing `lemma:` fields on Swedish verb dict entries by
 * stripping known conjugation suffixes (present, past, supine, passive)
 * and restoring the -a infinitive. Validates the proposed lemma is in
 * the dict before applying.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'sv.ts');
const txt = fs.readFileSync(SRC, 'utf8');
const lines = txt.split('\n');

// True Swedish infinitives end in -a (group 1/2/4) or are short vowel-ending
// monosyllables (group 3: bo, tro, må, gå, se, ge, etc.).
function looksLikeInfinitive(k) {
  if (k.endsWith('a')) return true;
  // Short vowel-final monosyllabic verbs: bo, gå, må, se, tro, ge, dö, le, etc.
  if (k.length <= 3 && /^[a-zåäö]+$/.test(k) && /[aeiouyåäö]$/.test(k)) return true;
  return false;
}

const knownInfinitives = new Set();
const ENTRY = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*([^}]*?)\}\s*,?\s*$/gm;
let m;
while ((m = ENTRY.exec(txt)) !== null) {
  if (looksLikeInfinitive(m[1])) knownInfinitives.add(m[1]);
}

function findInfinitive(form) {
  if (looksLikeInfinitive(form) && form.length >= 2) return form;

  // Strip s-passive: ends in -s. Try stripping -s first.
  const tryWithoutS = (s) => {
    const r = innerFind(s);
    if (r) return r;
    return null;
  };

  function innerFind(f) {
    // Try "form + a" first to catch bare-stem present-tense forms of group 2b
    // verbs whose stem ends in -r (hör → höra, gör → göra). Doing this AFTER
    // suffix-stripping would let the -r rule fire and over-strip ("hör" → "hö").
    if (f.length >= 2) {
      const direct = f + 'a';
      if (knownInfinitives.has(direct)) return direct;
    }
    // Past tense / supine: -ade (group 1), -de/-te (group 2), -dde (group 3),
    // -t/-tt/-it (supine).
    // Group 1: -ade → stem + a (talade → tala)
    if (f.endsWith('ade')) {
      const inf = f.slice(0, -3) + 'a';
      if (knownInfinitives.has(inf)) return inf;
    }
    // Group 1 supine: -at → stem + a (talat → tala)
    if (f.endsWith('at')) {
      const inf = f.slice(0, -2) + 'a';
      if (knownInfinitives.has(inf)) return inf;
    }
    // Group 2a: -te → stem + a (köpte → köpa, läste → läsa)
    if (f.endsWith('te')) {
      const stem = f.slice(0, -2);
      const inf1 = stem + 'a';
      if (knownInfinitives.has(inf1)) return inf1;
      // Some group 2a stems lose a final 'a' (sätta → satt + e → satte). Try
      // doubling consonant: köpa stem = köp; sätta stem = sätt.
    }
    // Group 2b: -de → stem + a (ringde → ringa, hörde → höra)
    if (f.endsWith('de')) {
      const stem = f.slice(0, -2);
      const inf1 = stem + 'a';
      if (knownInfinitives.has(inf1)) return inf1;
    }
    // Group 3: -dde → stem + (bodde → bo, trodde → tro)
    if (f.endsWith('dde')) {
      const inf = f.slice(0, -3);
      if (knownInfinitives.has(inf)) return inf;
    }
    // Supine -t (group 2): köpt → köpa
    if (f.endsWith('t') && !f.endsWith('at') && !f.endsWith('tt') && !f.endsWith('it')) {
      const inf = f.slice(0, -1) + 'a';
      if (knownInfinitives.has(inf)) return inf;
    }
    // Supine -tt (group 3): bott → bo, trott → tro
    if (f.endsWith('tt')) {
      const inf = f.slice(0, -2);
      if (knownInfinitives.has(inf)) return inf;
    }
    // Supine -it (group 4 strong): skrivit → skriva. Stem may have vowel change.
    if (f.endsWith('it')) {
      const inf = f.slice(0, -2) + 'a';
      if (knownInfinitives.has(inf)) return inf;
    }
    // Present -ar (group 1): talar → tala
    if (f.endsWith('ar')) {
      const inf = f.slice(0, -1);  // talar → tala
      if (knownInfinitives.has(inf)) return inf;
    }
    // Present -er (group 2 / 4): läser → läsa, skriver → skriva
    if (f.endsWith('er')) {
      const inf = f.slice(0, -2) + 'a';
      if (knownInfinitives.has(inf)) return inf;
    }
    // Present -r (group 3): bor → bo, tror → tro
    if (f.endsWith('r')) {
      const inf = f.slice(0, -1);
      if (knownInfinitives.has(inf)) return inf;
    }
    return null;
  }

  // Try directly
  let r = innerFind(form);
  if (r) return r;
  // Try s-passive: strip trailing s
  if (form.endsWith('s') && form.length >= 4) {
    r = innerFind(form.slice(0, -1));
    if (r) return r;
  }
  return null;
}

let applied = 0;
let skipped = 0;
const skips = { noMatch: 0 };
const samples = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const keyMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{(.+)\}\s*,?\s*$/);
  if (!keyMatch) continue;
  const key = keyMatch[1];
  const body = keyMatch[2];
  if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
  if (/lemma\s*:/.test(body)) continue;
  if (looksLikeInfinitive(key)) continue;

  const proposed = findInfinitive(key);
  if (!proposed) { skipped++; skips.noMatch++; continue; }

  const newLine = line.replace(/(\}\s*,?\s*)$/, ", lemma: '" + proposed + "' $1");
  lines[i] = newLine;
  applied++;
  if (samples.length < 12) samples.push({ key, lemma: proposed });
}

if (applied > 0) fs.writeFileSync(SRC, lines.join('\n'));

console.log(`Applied: ${applied}`);
console.log(`Skipped: ${skipped}`);
console.log(`Sample applied:`);
for (const s of samples) console.log(`  ${s.key} → ${s.lemma}`);
