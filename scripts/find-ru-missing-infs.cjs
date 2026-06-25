/**
 * Tally proposed Russian infinitives that aren't in the dict. Top entries
 * are good candidates to add.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'ru.ts');
const txt = fs.readFileSync(SRC, 'utf8');

function looksLikeInfinitive(k) {
  if (k.endsWith('чь') || k.endsWith('ти') || k.endsWith('тись')) return true;
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

function findInfinitiveCandidates(form) {
  const candidates = [];
  if (looksLikeInfinitive(form)) return [form];
  let base = form, refl = '';
  if (form.endsWith('ся') || form.endsWith('сь')) {
    base = form.slice(0, -2);
    refl = 'ся';
  }
  for (const sfx of ['ли', 'ло', 'ла', 'л']) {
    if (base.endsWith(sfx)) {
      const stem = base.slice(0, -sfx.length);
      if (stem.length >= 2) {
        candidates.push(stem + 'ть' + refl);
        candidates.push(stem + 'ать' + refl);
        candidates.push(stem + 'ить' + refl);
        candidates.push(stem + 'еть' + refl);
        candidates.push(stem + 'ять' + refl);
        return candidates;
      }
    }
  }
  for (const e of ['ю', 'ешь', 'ет', 'ем', 'ете', 'ют']) {
    if (base.endsWith(e)) {
      const stem = base.slice(0, -e.length);
      if (stem.length >= 2) {
        candidates.push(stem + 'ть' + refl);
        candidates.push(stem + 'ать' + refl);
        candidates.push(stem + 'ять' + refl);
        candidates.push(stem + 'еть' + refl);
        candidates.push(stem + 'овать' + refl);
        break;
      }
    }
  }
  for (const e of ['у', 'ишь', 'ит', 'им', 'ите', 'ят', 'ат']) {
    if (base.endsWith(e)) {
      const stem = base.slice(0, -e.length);
      if (stem.length >= 2) {
        candidates.push(stem + 'ить' + refl);
        candidates.push(stem + 'ать' + refl);
        candidates.push(stem + 'еть' + refl);
        candidates.push(stem + 'ять' + refl);
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

const tally = {};
ENTRY.lastIndex = 0;
while ((m = ENTRY.exec(txt)) !== null) {
  const key = m[1];
  const body = m[2];
  if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
  if (/lemma\s*:/.test(body)) continue;
  if (looksLikeInfinitive(key)) continue;
  const candidates = findInfinitiveCandidates(key);
  // Take just the FIRST candidate as the "best guess"
  if (candidates.length === 0) continue;
  const best = candidates[0];
  if (knownInfinitives.has(best)) continue;
  tally[best] = (tally[best] || 0) + 1;
}

const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
console.log(`Unique missing best-guess infinitives: ${sorted.length}`);
console.log(`Top 40:`);
for (const [inf, count] of sorted.slice(0, 40)) {
  console.log(`  ${inf.padEnd(24)} ${count}`);
}
