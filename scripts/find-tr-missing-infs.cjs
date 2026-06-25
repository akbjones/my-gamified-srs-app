/**
 * Walk the Turkish dict, for each verb form without lemma run the engine's
 * findInfinitive (with -yor recovery) and tally the proposed infinitives
 * that AREN'T in the dict. The top entries are good candidates to add.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'data', 'dictionary', 'tr.ts');
const txt = fs.readFileSync(SRC, 'utf8');

const TENSE_SUFFIXES = [
  'mıyorum', 'mıyorsun', 'mıyor', 'mıyoruz', 'mıyorsunuz', 'mıyorlar',
  'miyorum', 'miyorsun', 'miyor', 'miyoruz', 'miyorsunuz', 'miyorlar',
  'muyorum', 'muyorsun', 'muyor', 'muyoruz', 'muyorsunuz', 'muyorlar',
  'müyorum', 'müyorsun', 'müyor', 'müyoruz', 'müyorsunuz', 'müyorlar',
  'mayacağım', 'mayacaksın', 'mayacak', 'mayacağız', 'mayacaksınız', 'mayacaklar',
  'meyeceğim', 'meyeceksin', 'meyecek', 'meyeceğiz', 'meyeceksiniz', 'meyecekler',
  'mamışım', 'mamışsın', 'mamış', 'mamışız', 'mamışsınız', 'mamışlar',
  'memişim', 'memişsin', 'memiş', 'memişiz', 'memişsiniz', 'memişler',
  'madım', 'madın', 'madı', 'madık', 'madınız', 'madılar',
  'medim', 'medin', 'medi', 'medik', 'mediniz', 'mediler',
  'mam', 'men', 'mez', 'meyiz', 'mezsin', 'mezler', 'mezsiniz',
  'maz', 'mayız', 'mazsın', 'mazlar', 'mazsınız',
  'masam', 'masan', 'masa', 'masak', 'masanız', 'masalar',
  'mesem', 'mesen', 'mese', 'mesek', 'meseniz', 'meseler',
  'malıyım', 'malısın', 'malı', 'malıyız', 'malısınız', 'malılar',
  'meliyim', 'melisin', 'meli', 'meliyiz', 'melisiniz', 'meliler',
  'mamalıyım', 'mamalısın', 'mamalı', 'mamalıyız', 'mamalısınız', 'mamalılar',
  'memeliyim', 'memelisin', 'memeli', 'memeliyiz', 'memelisiniz', 'memeliler',
  'sinler', 'sınlar', 'sunlar', 'sünler',
  'sin', 'sın', 'sun', 'sün',
  'iniz', 'ınız', 'unuz', 'ünüz',
  'elim', 'alım',
  'yorum', 'yorsun', 'yor', 'yoruz', 'yorsunuz', 'yorlar',
  'acağım', 'acaksın', 'acak', 'acağız', 'acaksınız', 'acaklar',
  'eceğim', 'eceksin', 'ecek', 'eceğiz', 'eceksiniz', 'ecekler',
  'mışım', 'mışsın', 'mış', 'mışız', 'mışsınız', 'mışlar',
  'mişim', 'mişsin', 'miş', 'mişiz', 'mişsiniz', 'mişler',
  'muşum', 'muşsun', 'muş', 'muşuz', 'muşsunuz', 'muşlar',
  'müşüm', 'müşsün', 'müş', 'müşüz', 'müşsünüz', 'müşler',
  'dım', 'dın', 'dı', 'dık', 'dınız', 'dılar',
  'dim', 'din', 'di', 'dik', 'diniz', 'diler',
  'dum', 'dun', 'du', 'duk', 'dunuz', 'dular',
  'düm', 'dün', 'dü', 'dük', 'dünüz', 'düler',
  'tım', 'tın', 'tı', 'tık', 'tınız', 'tılar',
  'tim', 'tin', 'ti', 'tik', 'tiniz', 'tiler',
  'tum', 'tun', 'tu', 'tuk', 'tunuz', 'tular',
  'tüm', 'tün', 'tü', 'tük', 'tünüz', 'tüler',
  'ırım', 'ırsın', 'ır', 'ırız', 'ırsınız', 'ırlar',
  'irim', 'irsin', 'ir', 'iriz', 'irsiniz', 'irler',
  'urum', 'ursun', 'ur', 'uruz', 'ursunuz', 'urlar',
  'ürüm', 'ürsün', 'ür', 'ürüz', 'ürsünüz', 'ürler',
  'erim', 'ersin', 'er', 'eriz', 'ersiniz', 'erler',
  'arım', 'arsın', 'ar', 'arız', 'arsınız', 'arlar',
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
        const isYor = /^(m[ıiuü]?|)?(yor|ıyor|iyor|uyor|üyor)/.test(suffix);
        if (isYor && stem.length >= 3) {
          const last = stem.slice(-1);
          if ('ıiuü'.includes(last)) {
            const trimmed = stem.slice(0, -1);
            const rv = isBackVowel(lastVowel(trimmed)) ? 'a' : 'e';
            return trimmed + rv + (rv === 'a' ? 'mak' : 'mek');
          }
        }
        return direct;
      }
    }
  }
  return null;
}

const knownInfinitives = new Set();
const ENTRY = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*([^}]*?)\}\s*,?\s*$/gm;
let m;
while ((m = ENTRY.exec(txt)) !== null) {
  const key = m[1];
  if (key.endsWith('mek') || key.endsWith('mak')) knownInfinitives.add(key);
}

const missingTally = {};
ENTRY.lastIndex = 0;
while ((m = ENTRY.exec(txt)) !== null) {
  const key = m[1];
  const body = m[2];
  if (!/pos\s*:\s*['"]v['"]/.test(body)) continue;
  if (/lemma\s*:/.test(body)) continue;
  if (key.endsWith('mek') || key.endsWith('mak')) continue;
  const proposed = findInfinitive(key);
  if (!proposed) continue;
  if (knownInfinitives.has(proposed)) continue;
  // Stem-share guard
  const stem = proposed.slice(0, -3);
  if (stem.length < 2) continue;
  missingTally[proposed] = (missingTally[proposed] || 0) + 1;
}

const sorted = Object.entries(missingTally).sort((a, b) => b[1] - a[1]);
console.log(`Unique missing infinitives proposed: ${sorted.length}`);
console.log(`Top 50:`);
for (const [inf, count] of sorted.slice(0, 50)) {
  console.log(`  ${inf.padEnd(20)} ${count}`);
}
fs.writeFileSync(path.join(__dirname, 'tr-missing-infs.json'), JSON.stringify(sorted, null, 2));
