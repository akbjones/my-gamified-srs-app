/**
 * Backfill missing `lemma:` fields on Russian verb dict entries.
 * Russian engine generates MULTIPLE candidate infinitives per form
 * (e.g. писал → писать or писить or ... — different inf classes give
 * different forms). We pick the one that exists in the dict.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');
const txt = fs.readFileSync(SRC, 'utf8');
const lines = txt.split('\n');

// True Russian infinitives end in vowel + -ть/ться (ать/ять/ить/еть/уть/оть)
// or -ти/-чь. A bare "-ть" without a preceding vowel (like "ответь") is an
// imperative form, not an infinitive — skip it from the known-infinitive set
// or auto-backfill will assign wrong lemmas.
function looksLikeInfinitive(k) {
  if (k.endsWith('чь') || k.endsWith('ти') || k.endsWith('тись')) return true;
  // Find the "ть" or "ться" suffix and check the char before it.
  let stripLen = 0;
  if (k.endsWith('ться')) stripLen = 4;
  else if (k.endsWith('ть')) stripLen = 2;
  else return false;
  const beforeSuffix = k.charAt(k.length - stripLen - 1);
  return 'аяиеуо'.includes(beforeSuffix);
}

const knownInfinitives = new Set();
const ENTRY = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*([^}]*?)\}\s*,?\s*$/gm;
let m;
while ((m = ENTRY.exec(txt)) !== null) {
  if (looksLikeInfinitive(m[1])) knownInfinitives.add(m[1]);
}

// Mirrors src/data/conjugation/ru.ts findInfinitiveCandidates.
function findInfinitiveCandidates(form) {
  const candidates = [];
  if (form.endsWith('ть') || form.endsWith('ти') || form.endsWith('чь') ||
      form.endsWith('ться') || form.endsWith('тись')) {
    return [form];
  }
  let base = form, refl = '';
  if (form.endsWith('ся') || form.endsWith('сь')) {
    base = form.slice(0, -2);
    refl = 'ся';
  }
  // -ть is the canonical infinitive marker. The stem may or may not include
  // the thematic vowel — both stem + 'ть' (помога → помогать) and stem +
  // 'ать' (пис → писать) are valid patterns. Mirror the engine's order
  // exactly.
  for (const sfx of ['ли', 'ло', 'ла', 'л']) {
    if (base.endsWith(sfx)) {
      const stem = base.slice(0, -sfx.length);
      if (stem.length >= 2) {
        candidates.push(stem + 'ть' + refl);
        candidates.push(stem + 'ать' + refl);
        candidates.push(stem + 'ить' + refl);
        candidates.push(stem + 'еть' + refl);
        candidates.push(stem + 'ять' + refl);
        candidates.push(stem + 'ти' + refl);
        return candidates;
      }
    }
  }
  const first = ['ю', 'ешь', 'ет', 'ем', 'ете', 'ют'];
  const second = ['у', 'ишь', 'ит', 'им', 'ите', 'ят', 'ат'];
  for (const e of first) {
    if (base.endsWith(e)) {
      const stem = base.slice(0, -e.length);
      if (stem.length >= 2) {
        candidates.push(stem + 'ть' + refl);
        candidates.push(stem + 'ать' + refl);
        candidates.push(stem + 'ять' + refl);
        candidates.push(stem + 'еть' + refl);
        candidates.push(stem + 'овать' + refl);
        candidates.push(stem + 'евать' + refl);
        break;
      }
    }
  }
  for (const e of second) {
    if (base.endsWith(e)) {
      const stem = base.slice(0, -e.length);
      if (stem.length >= 2) {
        candidates.push(stem + 'ить' + refl);
        candidates.push(stem + 'ать' + refl);
        candidates.push(stem + 'еть' + refl);
        candidates.push(stem + 'ять' + refl);
        candidates.push(stem + 'ть' + refl);
        break;
      }
    }
  }
  if (base.endsWith('ую') || base.endsWith('уешь') || base.endsWith('ует') ||
      base.endsWith('уем') || base.endsWith('уете') || base.endsWith('уют')) {
    for (const e of ['ую', 'уешь', 'ует', 'уем', 'уете', 'уют']) {
      if (base.endsWith(e)) {
        const stem = base.slice(0, -e.length);
        if (stem.length >= 1) {
          candidates.push(stem + 'овать' + refl);
          candidates.push(stem + 'евать' + refl);
        }
        break;
      }
    }
  }
  return candidates;
}

let applied = 0;
let skipped = 0;
const skips = { noCandidates: 0, noMatch: 0 };
const samples = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const keyMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{(.+)\}\s*,?\s*$/);
  if (!keyMatch) continue;
  const key = keyMatch[1];
  const body = keyMatch[2];
  if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
  if (/lemma\s*:/.test(body)) continue;
  // Skip self-infinitives
  if (knownInfinitives.has(key)) continue;

  const candidates = findInfinitiveCandidates(key);
  if (candidates.length === 0) { skipped++; skips.noCandidates++; continue; }
  // Pick first candidate that's in dict
  const chosen = candidates.find(c => knownInfinitives.has(c));
  if (!chosen) { skipped++; skips.noMatch++; continue; }

  const newLine = line.replace(/(\}\s*,?\s*)$/, ", lemma: '" + chosen + "' $1");
  lines[i] = newLine;
  applied++;
  if (samples.length < 12) samples.push({ key, lemma: chosen });
}

if (applied > 0) fs.writeFileSync(SRC, lines.join('\n'));

console.log(`Applied: ${applied}`);
console.log(`Skipped: ${skipped}  (no candidates: ${skips.noCandidates}, no dict match: ${skips.noMatch})`);
console.log(`Sample applied:`);
for (const s of samples) console.log(`  ${s.key} → ${s.lemma}`);
