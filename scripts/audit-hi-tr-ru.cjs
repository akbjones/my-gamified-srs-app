#!/usr/bin/env node
/**
 * Per-language audit for Hindi / Turkish / Russian – the languages where
 * the European "noun spelled exactly like 1sg verb" pattern doesn't fire,
 * but each has its own bug shapes.
 *
 *  HINDI:
 *    H1  verb infinitive (ends in ना) tagged as non-verb
 *    H2  conjugated form (ता हूँ / ते हैं / etc.) tagged as non-verb
 *    H3  feminine form (ती / ती है) tagged as masculine-only verb
 *
 *  TURKISH:
 *    T1  verb infinitive (ends in -mak or -mek) tagged as non-verb
 *    T2  causative/passive suffix (-tir-, -il-, -in-) inside a noun entry
 *    T3  possessive suffix (-m / -n / -mız / -nız / -ları) but tagged as n
 *        without a lemma
 *
 *  RUSSIAN:
 *    R1  infinitive (ends in -ть or -чь or -ться) tagged as non-verb
 *    R2  reflexive form (ends in -ся / -сь) tagged as non-verb
 *    R3  past-tense -л / -ла / -ло / -ли form tagged as non-verb
 *
 * Output: scripts/output/audit-{hi,tr,ru}.json with bucketed lists.
 */
const fs = require('fs');

function parseDict(path) {
  const text = fs.readFileSync(path, 'utf8');
  const re = /^\s*'([^']+)':\s*\{[^}]*en:\s*'([^']*)'[^}]*pos:\s*'([^']+)'(?:[^}]*lemma:\s*'([^']+)')?[^}]*\},?\s*$/gm;
  const out = {};
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, word, en, pos, lemma] = m;
    out[word] = { en, pos, lemma };
  }
  return out;
}

const LANG = {
  hindi:   'src/data/dictionary/hi.ts',
  turkish: 'src/data/dictionary/tr.ts',
  russian: 'src/data/dictionary/ru.ts',
};

// ────────── HINDI ──────────
function auditHindi(entries) {
  const buckets = { H1_inf_not_verb: [], H2_conj_not_verb: [], H3_fem_misclass: [] };
  for (const word of Object.keys(entries)) {
    const e = entries[word];
    // H1: ना ending = infinitive
    if (word.endsWith('ना') && e.pos !== 'v') {
      buckets.H1_inf_not_verb.push({ word, en: e.en, pos: e.pos, lemma: e.lemma });
    }
    // H2: ता हूँ, ता है, ते हैं, ती है, etc. → conjugated, must be v
    if ((/ता हूँ|ता है|ते हैं|ती है|ती हूँ|ती हैं/.test(word)) && e.pos !== 'v') {
      buckets.H2_conj_not_verb.push({ word, en: e.en, pos: e.pos, lemma: e.lemma });
    }
    // H3: feminine -ती forms attached to a masculine lemma but with masculine label
    if (word.endsWith('ती') && e.pos === 'v' && e.lemma && entries[e.lemma]?.en && !/feminine|f\./i.test(e.en)) {
      // probably ok – flag only if en looks generic (no person/gender markers)
      if (!/I |we |he |she |they /i.test(e.en) && e.en.length < 25) {
        buckets.H3_fem_misclass.push({ word, en: e.en, pos: e.pos, lemma: e.lemma });
      }
    }
  }
  return buckets;
}

// ────────── TURKISH ──────────
function auditTurkish(entries) {
  const buckets = { T1_inf_not_verb: [], T2_caus_pass_in_noun: [], T3_possessive_no_lemma: [] };
  for (const word of Object.keys(entries)) {
    const e = entries[word];
    // T1: -mak / -mek ending = infinitive
    if ((word.endsWith('mak') || word.endsWith('mek')) && e.pos !== 'v') {
      buckets.T1_inf_not_verb.push({ word, en: e.en, pos: e.pos, lemma: e.lemma });
    }
    // T2: noun tagged but contains causative/passive infix (-dir-, -il-, -in-)
    if (e.pos === 'n' && /(dir|tir|dur|tur|dür|tür|il|ıl|ul|ül|in|ın|un|ün)mek|mak/.test(word)) {
      // ...too noisy. Skip this category – many false positives.
    }
    // T3: word ends with possessive suffix and not linked to lemma
    if (e.pos === 'n' && !e.lemma) {
      if (/(ım|im|um|üm|ın|in|un|ün|sı|si|su|sü|ımız|imiz|umuz|ümüz|ınız|iniz|unuz|ünüz|ları|leri)$/i.test(word)) {
        // exclude very short words (might be roots)
        if (word.length > 5) {
          buckets.T3_possessive_no_lemma.push({ word, en: e.en, pos: e.pos });
        }
      }
    }
  }
  return buckets;
}

// ────────── RUSSIAN ──────────
function auditRussian(entries) {
  const buckets = { R1_inf_not_verb: [], R2_refl_not_verb: [], R3_past_not_verb: [] };
  for (const word of Object.keys(entries)) {
    const e = entries[word];
    // R1: -ть / -чь / -ться endings = infinitive
    if ((word.endsWith('ть') || word.endsWith('чь')) && e.pos !== 'v') {
      buckets.R1_inf_not_verb.push({ word, en: e.en, pos: e.pos, lemma: e.lemma });
    }
    // R2: -ся / -сь reflexive endings
    if ((word.endsWith('ся') || word.endsWith('сь')) && e.pos !== 'v' && word.length > 4) {
      buckets.R2_refl_not_verb.push({ word, en: e.en, pos: e.pos, lemma: e.lemma });
    }
    // R3: past tense -л / -ла / -ло / -ли (must be ≥4 chars to avoid false positives like "лес")
    // Past tense usually 5+ chars, and is morphologically a verb form.
    if (e.pos !== 'v' && word.length >= 5 && /[аеиоуыэя]л[аоиы]?$/.test(word)) {
      // skip if lemma is already present and it's a non-verb derivation (rare)
      buckets.R3_past_not_verb.push({ word, en: e.en, pos: e.pos, lemma: e.lemma });
    }
  }
  return buckets;
}

const HANDLERS = {
  hindi:   auditHindi,
  turkish: auditTurkish,
  russian: auditRussian,
};

const all = {};
for (const [lang, path] of Object.entries(LANG)) {
  if (!fs.existsSync(path)) continue;
  const entries = parseDict(path);
  const buckets = HANDLERS[lang](entries);
  all[lang] = buckets;
  console.log(`\n=== ${lang.toUpperCase()} ===`);
  for (const [k, list] of Object.entries(buckets)) {
    console.log(`  ${k.padEnd(28)} ${list.length}`);
  }
  // print 8 examples per non-empty bucket
  for (const [k, list] of Object.entries(buckets)) {
    if (list.length === 0) continue;
    console.log(`\n  --- ${k} examples ---`);
    list.slice(0, 8).forEach(s => {
      console.log(`    ${s.word.padEnd(22)} pos=${s.pos.padEnd(6)} en=[${(s.en||'').slice(0, 40)}]${s.lemma ? ' lemma=' + s.lemma : ''}`);
    });
    if (list.length > 8) console.log(`    ... ${list.length - 8} more`);
  }
}

fs.mkdirSync('scripts/output', { recursive: true });
fs.writeFileSync('scripts/output/audit-hi-tr-ru.json', JSON.stringify(all, null, 2));
console.log('\nFull report: scripts/output/audit-hi-tr-ru.json');
