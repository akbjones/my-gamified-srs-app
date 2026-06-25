/**
 * Backfill missing `lemma:` fields on Turkish verb dict entries by running
 * the engine's findInfinitive() over each unlemma'd key and accepting the
 * result if it matches an existing infinitive in the dict (-mek/-mak).
 *
 * Conservative: never overwrites an existing lemma, never proposes a lemma
 * that isn't in the dict, never adds a lemma whose stem doesn't share at
 * least 2 chars with the key (after diacritic+t/d/k/ğ fold).
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
const txt = fs.readFileSync(SRC, 'utf8');
const lines = txt.split('\n');

// ── Reverse-lookup suffixes — keep in sync with src/data/conjugation/tr.ts ──
const TENSE_SUFFIXES = [
  // Negative present continuous (longer first)
  'mıyorum', 'mıyorsun', 'mıyor', 'mıyoruz', 'mıyorsunuz', 'mıyorlar',
  'miyorum', 'miyorsun', 'miyor', 'miyoruz', 'miyorsunuz', 'miyorlar',
  'muyorum', 'muyorsun', 'muyor', 'muyoruz', 'muyorsunuz', 'muyorlar',
  'müyorum', 'müyorsun', 'müyor', 'müyoruz', 'müyorsunuz', 'müyorlar',
  // Negative future
  'mayacağım', 'mayacaksın', 'mayacak', 'mayacağız', 'mayacaksınız', 'mayacaklar',
  'meyeceğim', 'meyeceksin', 'meyecek', 'meyeceğiz', 'meyeceksiniz', 'meyecekler',
  // Negative reported
  'mamışım', 'mamışsın', 'mamış', 'mamışız', 'mamışsınız', 'mamışlar',
  'memişim', 'memişsin', 'memiş', 'memişiz', 'memişsiniz', 'memişler',
  // Negative past
  'madım', 'madın', 'madı', 'madık', 'madınız', 'madılar',
  'medim', 'medin', 'medi', 'medik', 'mediniz', 'mediler',
  // Negative aorist
  'mam', 'men', 'mez', 'meyiz', 'mezsin', 'mezler', 'mezsiniz',
  'maz', 'mayız', 'mazsın', 'mazlar', 'mazsınız',
  // Negative conditional
  'masam', 'masan', 'masa', 'masak', 'masanız', 'masalar',
  'mesem', 'mesen', 'mese', 'mesek', 'meseniz', 'meseler',
  // Necessitative
  'malıyım', 'malısın', 'malı', 'malıyız', 'malısınız', 'malılar',
  'meliyim', 'melisin', 'meli', 'meliyiz', 'melisiniz', 'meliler',
  'mamalıyım', 'mamalısın', 'mamalı', 'mamalıyız', 'mamalısınız', 'mamalılar',
  'memeliyim', 'memelisin', 'memeli', 'memeliyiz', 'memelisiniz', 'memeliler',
  // Imperative
  'sinler', 'sınlar', 'sunlar', 'sünler',
  'sin', 'sın', 'sun', 'sün',
  'iniz', 'ınız', 'unuz', 'ünüz',
  'elim', 'alım',
  // Present cont
  'yorum', 'yorsun', 'yor', 'yoruz', 'yorsunuz', 'yorlar',
  // Future
  'acağım', 'acaksın', 'acak', 'acağız', 'acaksınız', 'acaklar',
  'eceğim', 'eceksin', 'ecek', 'eceğiz', 'eceksiniz', 'ecekler',
  // Reported
  'mışım', 'mışsın', 'mış', 'mışız', 'mışsınız', 'mışlar',
  'mişim', 'mişsin', 'miş', 'mişiz', 'mişsiniz', 'mişler',
  'muşum', 'muşsun', 'muş', 'muşuz', 'muşsunuz', 'muşlar',
  'müşüm', 'müşsün', 'müş', 'müşüz', 'müşsünüz', 'müşler',
  // Past
  'dım', 'dın', 'dı', 'dık', 'dınız', 'dılar',
  'dim', 'din', 'di', 'dik', 'diniz', 'diler',
  'dum', 'dun', 'du', 'duk', 'dunuz', 'dular',
  'düm', 'dün', 'dü', 'dük', 'dünüz', 'düler',
  'tım', 'tın', 'tı', 'tık', 'tınız', 'tılar',
  'tim', 'tin', 'ti', 'tik', 'tiniz', 'tiler',
  'tum', 'tun', 'tu', 'tuk', 'tunuz', 'tular',
  'tüm', 'tün', 'tü', 'tük', 'tünüz', 'tüler',
  // Aorist
  'ırım', 'ırsın', 'ır', 'ırız', 'ırsınız', 'ırlar',
  'irim', 'irsin', 'ir', 'iriz', 'irsiniz', 'irler',
  'urum', 'ursun', 'ur', 'uruz', 'ursunuz', 'urlar',
  'ürüm', 'ürsün', 'ür', 'ürüz', 'ürsünüz', 'ürler',
  'erim', 'ersin', 'er', 'eriz', 'ersiniz', 'erler',
  'arım', 'arsın', 'ar', 'arız', 'arsınız', 'arlar',
  // Conditional
  'sam', 'san', 'sa', 'sak', 'sanız', 'salar',
  'sem', 'sen', 'se', 'sek', 'seniz', 'seler',
];

const BACK_VOWELS = new Set('aıou');
const FRONT_VOWELS = new Set('eiöü');
function lastVowel(word) {
  for (let i = word.length - 1; i >= 0; i--) {
    if (BACK_VOWELS.has(word[i]) || FRONT_VOWELS.has(word[i])) return word[i];
  }
  return 'a';
}
function isBackVowel(v) { return BACK_VOWELS.has(v); }

function findInfinitive(form) {
  if (form.endsWith('mek') || form.endsWith('mak')) return form;
  for (const suffix of TENSE_SUFFIXES) {
    if (form.endsWith(suffix)) {
      const stem = form.slice(0, -suffix.length);
      if (stem.length >= 2) {
        const ending = isBackVowel(lastVowel(stem)) ? 'mak' : 'mek';
        const direct = stem + ending;
        // -yor suffixes erase the stem-final vowel via harmony. açıklıyor
        // → strip -ıyor → stem "açıklı". The true stem is "açıkla" — the ı
        // was a harmony artifact of -ıyor. If suffix is -yor family and the
        // direct candidate isn't in the dict, try restoring -a or -e in
        // place of the trailing harmony vowel.
        const isYor = /^(m[ıiuü]?|)?(yor|ıyor|iyor|uyor|üyor)/.test(suffix);
        if (isYor && stem.length >= 3) {
          const last = stem.slice(-1);
          if ('ıiuü'.includes(last)) {
            const trimmed = stem.slice(0, -1);
            const restoredVowel = isBackVowel(lastVowel(trimmed)) ? 'a' : 'e';
            const restored = trimmed + restoredVowel + (restoredVowel === 'a' ? 'mak' : 'mek');
            return restored;
          }
        }
        return direct;
      }
    }
  }
  return null;
}

// ── Pass 1: collect existing infinitives from dict ─────────────
const knownInfinitives = new Set();
const ENTRY = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*([^}]*?)\}\s*,?\s*$/gm;
let m;
while ((m = ENTRY.exec(txt)) !== null) {
  const key = m[1];
  if (key.endsWith('mek') || key.endsWith('mak')) knownInfinitives.add(key);
}

// ── Pass 2: walk lines, find verb entries without lemma, propose ──
let applied = 0;
let skipped = 0;
const skips = { noProposal: 0, proposalNotInDict: 0, stemMismatch: 0 };
const samples = [];

const fold = (s) => s.toLowerCase()
  .replace(/ı/g, 'i').replace(/İ/g, 'i')
  .replace(/ş/g, 's').replace(/ç/g, 'c')
  .replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
  .replace(/d/g, 't').replace(/b/g, 'p').replace(/c/g, 'ç');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Match: '...': { ..., pos: 'v' ... }  AND  doesn't already contain lemma:
  const keyMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*\{(.+)\}\s*,?\s*$/);
  if (!keyMatch) continue;
  const key = keyMatch[1];
  const body = keyMatch[2];
  if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
  if (/lemma\s*:/.test(body)) continue;
  // Skip if the key itself is a base infinitive
  if (key.endsWith('mek') || key.endsWith('mak')) continue;

  const proposed = findInfinitive(key);
  if (!proposed) { skipped++; skips.noProposal++; continue; }
  // Conservative: only accept lemmas that exist as -mek/-mak entries in the
  // dict. Loosening this introduces wrong lemmas because findInfinitive can't
  // recover stem-final vowels lost to -yor harmony (açıklıyor → açıklımak is
  // wrong; correct is açıklamak).
  if (!knownInfinitives.has(proposed)) { skipped++; skips.proposalNotInDict++; continue; }
  const stem = proposed.slice(0, -3);
  if (stem.length < 2 || !fold(key).startsWith(fold(stem).slice(0, 2))) {
    skipped++; skips.stemMismatch++; continue;
  }

  // Inject lemma before the closing }
  // Find the closing brace position in body and append lemma before it.
  // Simpler: replace `pos: 'v' }` with `pos: 'v', lemma: 'X' }` if no trailing comma,
  // or `pos: 'v',` → `pos: 'v', lemma: 'X',`.
  // But safest: insert `, lemma: 'X'` right before the closing brace.
  const newLine = line.replace(/(\}\s*,?\s*)$/, ", lemma: '" + proposed + "' $1");
  lines[i] = newLine;
  applied++;
  if (samples.length < 8) samples.push({ key, lemma: proposed });
}

if (applied > 0) {
  fs.writeFileSync(SRC, lines.join('\n'));
}

console.log(`Applied: ${applied}`);
console.log(`Skipped: ${skipped}  (no proposal: ${skips.noProposal}, not in dict: ${skips.proposalNotInDict}, stem mismatch: ${skips.stemMismatch})`);
console.log(`Sample applied:`);
for (const s of samples) console.log(`  ${s.key} → ${s.lemma}`);
