#!/usr/bin/env node
/**
 * Add `lemma` fields to conjugated verb entries in Turkish (tr.ts) and Hindi (hi.ts) dictionaries.
 *
 * For Turkish: infinitives end in -mek/-mak. Conjugated forms get lemma pointing to infinitive.
 * For Hindi: infinitives end in -ना. Conjugated forms get lemma pointing to infinitive.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Turkish ──────────────────────────────────────────────────
function processTurkish() {
  const filePath = path.join(ROOT, 'src/data/dictionary/tr.ts');
  let src = fs.readFileSync(filePath, 'utf8');

  // Extract all dictionary keys and identify infinitives
  const allKeys = new Set();
  const infinitives = new Set(); // only keys ending in -mek/-mak with pos:'v'
  let m;

  // First pass: collect all keys, identify verb infinitives
  const keyPosRegex = /^\s+'([^']+)':\s*\{([^}]+)\}/gm;
  while ((m = keyPosRegex.exec(src)) !== null) {
    allKeys.add(m[1]);
    if (m[2].includes("pos: 'v'") && (m[1].endsWith('mek') || m[1].endsWith('mak'))) {
      infinitives.add(m[1]);
    }
  }

  // Turkish vowel harmony helpers
  const BACK_VOWELS = new Set(['a','ı','o','u']);
  const ALL_VOWELS = new Set(['a','ı','o','u','e','i','ö','ü']);

  function lastVowel(word) {
    for (let i = word.length - 1; i >= 0; i--) {
      if (ALL_VOWELS.has(word[i])) return word[i];
    }
    return 'a';
  }

  function isBackVowel(v) {
    return BACK_VOWELS.has(v);
  }

  // Turkish tense suffixes (longest first for greedy matching)
  const TENSE_SUFFIXES = [
    // Present continuous
    'yorum', 'yorsun', 'yor', 'yoruz', 'yorsunuz', 'yorlar',
    // Future
    'acağım', 'acaksın', 'acak', 'acağız', 'acaksınız', 'acaklar',
    'eceğim', 'eceksin', 'ecek', 'eceğiz', 'eceksiniz', 'ecekler',
    // Reported past
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
    // Negative marker combos: -mıyor, -miyor, -muyor, -müyor etc.
    'mıyorum', 'mıyorsun', 'mıyor', 'mıyoruz', 'mıyorsunuz', 'mıyorlar',
    'miyorum', 'miyorsun', 'miyor', 'miyoruz', 'miyorsunuz', 'miyorlar',
    'muyorum', 'muyorsun', 'muyor', 'muyoruz', 'muyorsunuz', 'muyorlar',
    'müyorum', 'müyorsun', 'müyor', 'müyoruz', 'müyorsunuz', 'müyorlar',
    // Negative past: -madım, -medim, etc.
    'madım', 'madın', 'madı', 'madık', 'madınız', 'madılar',
    'medim', 'medin', 'medi', 'medik', 'mediniz', 'mediler',
    // Negative aorist: -mam, -mem, -maz, -mez, -mazsın, -mezsin
    'mam', 'mazsın', 'maz', 'mayız', 'mazsınız', 'mazlar',
    'mem', 'mezsin', 'mez', 'meyiz', 'mezsiniz', 'mezler',
    // Negative future: -mayacağım, -meyeceğim
    'mayacağım', 'mayacaksın', 'mayacak', 'mayacağız', 'mayacaksınız', 'mayacaklar',
    'meyeceğim', 'meyeceksin', 'meyecek', 'meyeceğiz', 'meyeceksiniz', 'meyecekler',
    // Imperative
    'in', 'ın', 'ün', 'un', 'iniz', 'ınız', 'ünüz', 'unuz',
    // Additional person suffixes for aorist (short forms)
    'ım', 'im', 'um', 'üm',
  ].sort((a, b) => b.length - a.length); // longest first

  function findTurkishInfinitive(form) {
    if (form.endsWith('mek') || form.endsWith('mak')) return form;

    // Strategy 1: Progressive trimming — only accept actual infinitives from the dict
    for (let i = form.length - 1; i >= 2; i--) {
      const prefix = form.slice(0, i);
      const mak = prefix + 'mak';
      const mek = prefix + 'mek';
      if (infinitives.has(mak)) return mak;
      if (infinitives.has(mek)) return mek;
    }

    // Strategy 2: Use suffix stripping, prefer results that are in dict
    // Also try removing buffer vowels and vowel narrowing reversal for -yor forms
    for (const suffix of TENSE_SUFFIXES) {
      if (form.endsWith(suffix)) {
        const stem = form.slice(0, -suffix.length);
        if (stem.length >= 2) {
          const ending = isBackVowel(lastVowel(stem)) ? 'mak' : 'mek';
          const inf = stem + ending;
          if (infinitives.has(inf)) return inf;

          // For -yor forms: try vowel narrowing reversal
          // Before -yor, stem vowels narrow: a→ı, e→i, o→u, ö→ü
          // Try replacing last vowel with its un-narrowed form
          const lastChar = stem.slice(-1);
          if (ALL_VOWELS.has(lastChar) && stem.length >= 3) {
            const shorterStem = stem.slice(0, -1);

            // Try the narrowed vowel as a buffer (just remove it)
            for (const e of ['mak', 'mek']) {
              if (infinitives.has(shorterStem + e)) return shorterStem + e;
            }

            // Try consonant hardening: d→t, b→p, c→ç, ğ→k
            const hardenMap = { 'd': 't', 'b': 'p', 'c': 'ç', 'ğ': 'k' };
            const finalC = shorterStem.slice(-1);
            if (hardenMap[finalC]) {
              const hardened = shorterStem.slice(0, -1) + hardenMap[finalC];
              for (const e of ['mak', 'mek']) {
                if (infinitives.has(hardened + e)) return hardened + e;
              }
            }

            // Try vowel un-narrowing: ı→a, i→e, u→o, ü→ö
            const unnarrow = { 'ı': 'a', 'i': 'e', 'u': 'o', 'ü': 'ö' };
            if (unnarrow[lastChar]) {
              const restored = stem.slice(0, -1) + unnarrow[lastChar];
              for (const e of ['mak', 'mek']) {
                if (infinitives.has(restored + e)) return restored + e;
              }
            }
          }
        }
      }
    }

    // Strategy 3: suffix stripping — return even if not in dict infinitives set
    const hardenMap = { 'd': 't', 'b': 'p', 'c': 'ç', 'ğ': 'k' };
    for (const suffix of TENSE_SUFFIXES) {
      if (form.endsWith(suffix)) {
        const stem = form.slice(0, -suffix.length);
        if (stem.length >= 2) {
          // Try without buffer vowel + consonant hardening
          const lastChar = stem.slice(-1);
          if (ALL_VOWELS.has(lastChar) && stem.length >= 3) {
            const shorterStem = stem.slice(0, -1);
            for (const e of ['mak', 'mek']) {
              if (infinitives.has(shorterStem + e)) return shorterStem + e;
            }
            const finalC = shorterStem.slice(-1);
            if (hardenMap[finalC]) {
              const hardened = shorterStem.slice(0, -1) + hardenMap[finalC];
              for (const e of ['mak', 'mek']) {
                if (infinitives.has(hardened + e)) return hardened + e;
              }
            }
          }
          const ending = isBackVowel(lastVowel(stem)) ? 'mak' : 'mek';
          return stem + ending;
        }
      }
    }

    return null;
  }

  // Now process: find all verb entries that are NOT infinitives and don't already have lemma
  let count = 0;
  const lineRegex = /^(\s+'[^']+':)\s*\{([^}]+)\}/gm;

  src = src.replace(lineRegex, (match, keyPart, propsPart) => {
    // Extract the key
    const keyMatch = keyPart.match(/'([^']+)'/);
    if (!keyMatch) return match;
    const key = keyMatch[1];

    // Only process verbs
    if (!propsPart.includes("pos: 'v'")) return match;

    // Skip if already has lemma
    if (propsPart.includes('lemma:')) return match;

    // Skip infinitives
    if (key.endsWith('mek') || key.endsWith('mak')) return match;

    // Skip multi-word entries that end with an infinitive (compound verbs like "yardım etmek")
    if (/\s/.test(key) && (key.endsWith('mek') || key.endsWith('mak'))) return match;

    const infinitive = findTurkishInfinitive(key);
    if (!infinitive || infinitive === key) return match;

    count++;
    // Add lemma to the props
    const newProps = propsPart.trimEnd() + `, lemma: '${infinitive}'`;
    return `${keyPart} {${newProps}}`;
  });

  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`Turkish: added lemma to ${count} verb entries`);
  return count;
}

// ── Hindi ────────────────────────────────────────────────────
function processHindi() {
  const filePath = path.join(ROOT, 'src/data/dictionary/hi.ts');
  let src = fs.readFileSync(filePath, 'utf8');

  // Collect all keys and identify infinitives
  const allKeys = new Set();
  const infinitives = new Set(); // verb entries ending in ना
  const keyPosRegex = /^\s+'([^']+)':\s*\{([^}]+)\}/gm;
  let m;
  while ((m = keyPosRegex.exec(src)) !== null) {
    allKeys.add(m[1]);
    if (m[2].includes("pos: 'v'") && m[1].endsWith('ना')) {
      infinitives.add(m[1]);
    }
  }

  // Hindi suffix patterns (longest first)
  const HABITUAL_SUFFIXES = ['ता', 'ती', 'ते'];
  const CONTINUOUS_PARTICLES = ['रहा', 'रही', 'रहे'];
  const FUTURE_SUFFIXES = ['ऊँगा', 'ऊँगी', 'एगा', 'एगी', 'एँगे', 'एँगी', 'ओगे', 'ओगी'];
  const SUBJUNCTIVE = ['ऊँ', 'ए', 'एँ', 'ओ'];
  const PAST_SUFFIXES = ['ा', 'ी', 'े', 'ीं'];
  // Imperative: -ो, -िए, -ना (but ना is infinitive)
  const IMPERATIVE = ['िए', 'ो'];

  // Combined, longest first
  const ALL_SUFFIXES = [
    ...FUTURE_SUFFIXES,
    ...CONTINUOUS_PARTICLES,
    ...HABITUAL_SUFFIXES,
    ...SUBJUNCTIVE,
    ...IMPERATIVE,
    ...PAST_SUFFIXES,
  ].sort((a, b) => b.length - a.length);

  // Known irregular stems → infinitives
  const IRREGULAR_MAP = {
    'कर': 'करना', 'कि': 'करना',
    'हो': 'होना', 'हु': 'होना', 'है': 'होना', 'हैं': 'होना', 'था': 'होना',
    'जा': 'जाना', 'गय': 'जाना', 'गई': 'जाना', 'ग': 'जाना',
    'आ': 'आना', 'आय': 'आना',
    'दे': 'देना', 'दि': 'देना', 'दी': 'देना',
    'ले': 'लेना', 'लि': 'लेना', 'ली': 'लेना',
    'कह': 'कहना',
    'पी': 'पीना',
    'खा': 'खाना', 'खाय': 'खाना',
    'सो': 'सोना', 'सोय': 'सोना',
    'रो': 'रोना', 'रोय': 'रोना',
    'धो': 'धोना', 'धोय': 'धोना',
    'दिया': 'देना', 'लिया': 'लेना', 'किया': 'करना', 'गया': 'जाना',
    'हुआ': 'होना', 'गए': 'जाना', 'दिए': 'देना', 'लिए': 'लेना',
  };

  function findHindiInfinitive(form) {
    // If already an infinitive in our set, return it
    if (infinitives.has(form)) return form;

    // Check full-form irregulars first
    if (IRREGULAR_MAP[form]) return IRREGULAR_MAP[form];

    // Strategy 1: Strip known suffixes, prefer results that are known infinitives
    for (const suffix of ALL_SUFFIXES) {
      if (form.endsWith(suffix)) {
        const stem = form.slice(0, -suffix.length);
        if (stem.length >= 1) {
          if (IRREGULAR_MAP[stem]) return IRREGULAR_MAP[stem];
          const inf = stem + 'ना';
          if (infinitives.has(inf)) return inf;
        }
      }
    }

    // Strategy 2: suffix stripping — return stem+ना even if not a known infinitive
    for (const suffix of ALL_SUFFIXES) {
      if (form.endsWith(suffix)) {
        const stem = form.slice(0, -suffix.length);
        if (stem.length >= 2) {
          if (IRREGULAR_MAP[stem]) return IRREGULAR_MAP[stem];
          return stem + 'ना';
        }
      }
    }

    // Strategy 3: if form itself + ना is a known infinitive
    const directInf = form + 'ना';
    if (infinitives.has(directInf)) return directInf;

    return null;
  }

  let count = 0;
  const lineRegex = /^(\s+'[^']+':)\s*\{([^}]+)\}/gm;

  src = src.replace(lineRegex, (match, keyPart, propsPart) => {
    const keyMatch = keyPart.match(/'([^']+)'/);
    if (!keyMatch) return match;
    const key = keyMatch[1];

    if (!propsPart.includes("pos: 'v'")) return match;
    if (propsPart.includes('lemma:')) return match;

    // Skip infinitives
    if (infinitives.has(key)) return match;
    // Compound infinitives like "मदद करना"
    if (/\s/.test(key) && key.endsWith('ना')) return match;

    const infinitive = findHindiInfinitive(key);
    if (!infinitive || infinitive === key) return match;

    count++;
    const newProps = propsPart.trimEnd() + `, lemma: '${infinitive}'`;
    return `${keyPart} {${newProps}}`;
  });

  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`Hindi: added lemma to ${count} verb entries`);
  return count;
}

// ── Run ──────────────────────────────────────────────────────
const trCount = processTurkish();
const hiCount = processHindi();
console.log(`\nTotal: ${trCount + hiCount} verb entries got lemma fields`);
