#!/usr/bin/env node
/**
 * Scope the wrong-lemma problem honestly. For every dict entry with a
 * `lemma:` field, validate:
 *
 *   1. The lemma exists as a key somewhere in the same dict.
 *   2. The lemma's own entry has pos: 'v'.
 *   3. The lemma's own entry has NO further lemma field (i.e. the chain
 *      bottoms out at an infinitive, not at yet another inflected form).
 *   4. The lemma's key matches the language's infinitive suffix regex.
 *   5. The lemma's English meaning overlaps with the entry's — otherwise
 *      it's almost certainly a Phase B over-assignment (Dutch raden →
 *      aanraden is two different verbs that happen to share "to advise").
 *
 * Per-language counts + 5 sample failures of each kind, so we can pick the
 * right remediation (manual scrub vs revert vs scripted fix).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DICT_DIR = path.join(ROOT, 'src/data/dictionary');

const INFINITIVE_SUFFIX = {
  es: /(ar|er|ir|arse|erse|irse)$/,
  it: /(are|ere|ire|arsi|ersi|irsi|arsene)$/,
  fr: /(er|ir|re|oir|ger|cer|ier)$/,
  pt: /(ar|er|ir|or|ar-se|er-se|ir-se)$/,
  de: /(en|n)$/,
  nl: /(en|n)$/,
  sv: /^(att\s)?[\w]+a$/,
  cy: /(o|i|u|au|eg)$/,
  hi: /ना$/,
  tr: /(mak|mek)$/,
  ru: /(ть|ться|чь|чься|ти)$/,
};

function parseEntries(src) {
  const out = [];
  const lineRe = /^\s*['"]([^'"]+?)['"]\s*:\s*\{([^}]*)\}/gm;
  let m;
  while ((m = lineRe.exec(src)) !== null) out.push({ key: m[1], body: m[2] });
  return out;
}
const getPos = b => (b.match(/pos\s*:\s*['"]([^'"]+)['"]/) || [])[1];
const getLemma = b => (b.match(/lemma\s*:\s*['"]([^'"]+)['"]/) || [])[1];
const getEn = b => (b.match(/en\s*:\s*['"]([^'"]*)['"]/) || ['',''])[1];

function meaningsOverlap(a, b) {
  const norm = s => s.toLowerCase().split(';').map(p => p.trim()).filter(Boolean);
  const A = new Set(norm(a));
  for (const phrase of norm(b)) if (A.has(phrase)) return true;
  return false;
}

const KINDS = ['missing_lemma_entry', 'lemma_not_verb', 'lemma_is_inflected', 'lemma_wrong_suffix', 'meaning_mismatch'];
const stats = {};

for (const lang of Object.keys(INFINITIVE_SUFFIX)) {
  const filepath = path.join(DICT_DIR, `${lang}.ts`);
  if (!fs.existsSync(filepath)) continue;
  const entries = parseEntries(fs.readFileSync(filepath, 'utf8'));
  const byKey = new Map(entries.map(e => [e.key, e]));
  const suffix = INFINITIVE_SUFFIX[lang];

  const fails = { missing_lemma_entry: [], lemma_not_verb: [], lemma_is_inflected: [], lemma_wrong_suffix: [], meaning_mismatch: [] };
  let totalWithLemma = 0;

  for (const e of entries) {
    if (getPos(e.body) !== 'v') continue;
    const lemma = getLemma(e.body);
    if (!lemma) continue;
    totalWithLemma++;

    const lemmaEntry = byKey.get(lemma);
    if (!lemmaEntry) { fails.missing_lemma_entry.push({ key: e.key, lemma }); continue; }
    if (getPos(lemmaEntry.body) !== 'v') { fails.lemma_not_verb.push({ key: e.key, lemma }); continue; }
    if (getLemma(lemmaEntry.body)) { fails.lemma_is_inflected.push({ key: e.key, lemma, lemmasLemma: getLemma(lemmaEntry.body) }); continue; }
    if (!suffix.test(lemma)) { fails.lemma_wrong_suffix.push({ key: e.key, lemma }); continue; }
    const enE = getEn(e.body), enL = getEn(lemmaEntry.body);
    if (enE && enL && !meaningsOverlap(enE, enL)) {
      fails.meaning_mismatch.push({ key: e.key, lemma, enE, enL });
    }
  }
  stats[lang] = { totalWithLemma, fails };
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('LEMMA INTEGRITY AUDIT — every lemma field validated');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('lang  w/lemma  missing  notVerb  inflected  badSuffix  meanMismatch');
let grandTotal = 0, grandBad = 0;
for (const [lang, s] of Object.entries(stats)) {
  const f = s.fails;
  const badCount = f.missing_lemma_entry.length + f.lemma_not_verb.length + f.lemma_is_inflected.length + f.lemma_wrong_suffix.length + f.meaning_mismatch.length;
  grandTotal += s.totalWithLemma; grandBad += badCount;
  console.log(`  ${lang.padEnd(4)}  ${String(s.totalWithLemma).padStart(7)}  ${String(f.missing_lemma_entry.length).padStart(7)}  ${String(f.lemma_not_verb.length).padStart(7)}  ${String(f.lemma_is_inflected.length).padStart(9)}  ${String(f.lemma_wrong_suffix.length).padStart(9)}  ${String(f.meaning_mismatch.length).padStart(12)}`);
}
console.log(`\nTotal: ${grandBad} bad / ${grandTotal} with lemma  (${(grandBad*100/grandTotal).toFixed(1)}%)`);

console.log('\n── Sample failures by kind ──');
for (const lang of Object.keys(stats)) {
  for (const kind of KINDS) {
    const items = stats[lang].fails[kind];
    if (items.length === 0) continue;
    console.log(`\n${lang} · ${kind} (${items.length}):`);
    for (const x of items.slice(0, 3)) {
      const extra = x.lemmasLemma ? ` → ${x.lemmasLemma}` : (x.enE ? ` ("${x.enE.slice(0,30)}" vs "${x.enL.slice(0,30)}")` : '');
      console.log(`  ${x.key} → ${x.lemma}${extra}`);
    }
  }
}
