#!/usr/bin/env node
/**
 * Surgical cleanup of the worst-broken lemma assignments. Three actions:
 *
 *   RESOLVE  — lemma chains through another inflected entry; collapse to
 *              the final infinitive (e.g. andas → anda → andar  becomes
 *              andas → andar). Only applies the collapse when the final
 *              hop is a real verb with no further lemma.
 *
 *   REMOVE_NOT_VERB     — lemma points at a non-verb entry. Delete the
 *                         lemma field. The entry survives without a
 *                         conjugation hook — strictly better than showing
 *                         a fake table.
 *
 *   REMOVE_MISMATCH     — lemma's English meaning doesn't overlap with
 *                         the inflected entry's first meaning. These are
 *                         the Phase B over-assignments (compruebo →
 *                         comprar, "verify" vs "buy"). Same treatment.
 *
 *   --dry    show what would change without writing.
 *   --lang=  apply to one language only.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DICT_DIR = path.join(ROOT, 'src/data/dictionary');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry') || args.includes('--dry-run');
const langArg = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];

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
  const lineRe = /^(\s*)(['"])([^'"]+?)\2\s*:\s*\{([^}]*)\}/gm;
  let m;
  while ((m = lineRe.exec(src)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, indent: m[1], quote: m[2], key: m[3], body: m[4], raw: m[0] });
  }
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

function cleanLang(lang) {
  const filepath = path.join(DICT_DIR, `${lang}.ts`);
  if (!fs.existsSync(filepath)) return null;
  const src = fs.readFileSync(filepath, 'utf8');
  const entries = parseEntries(src);
  const byKey = new Map(entries.map(e => [e.key, e]));
  const suffix = INFINITIVE_SUFFIX[lang];

  // Resolve lemma chains: follow each lemma forward, returning the final
  // infinitive (one with no further lemma + matches the suffix). Returns
  // null if the chain dead-ends at a non-verb.
  const MAX_HOPS = 6;
  function resolveChain(startKey) {
    let cur = startKey;
    for (let i = 0; i < MAX_HOPS; i++) {
      const e = byKey.get(cur);
      if (!e) return null;
      if (getPos(e.body) !== 'v') return null;
      const next = getLemma(e.body);
      if (!next) return suffix.test(cur) ? cur : null;
      if (next === cur) return null;
      cur = next;
    }
    return null;
  }

  const actions = [];   // { entry, kind: 'RESOLVE' | 'REMOVE_NOT_VERB' | 'REMOVE_MISMATCH', newLemma? }
  const stats = { resolve: 0, removeNotVerb: 0, removeMismatch: 0 };

  for (const e of entries) {
    if (getPos(e.body) !== 'v') continue;
    const lemma = getLemma(e.body);
    if (!lemma) continue;

    const lemmaEntry = byKey.get(lemma);
    if (!lemmaEntry) continue;  // missing_lemma_entry — leave alone

    if (getPos(lemmaEntry.body) !== 'v') {
      actions.push({ entry: e, kind: 'REMOVE_NOT_VERB' });
      stats.removeNotVerb++;
      continue;
    }

    if (getLemma(lemmaEntry.body)) {
      const final = resolveChain(lemma);
      if (final && final !== lemma) {
        actions.push({ entry: e, kind: 'RESOLVE', newLemma: final });
        stats.resolve++;
      }
      continue;
    }

    const enE = getEn(e.body), enL = getEn(lemmaEntry.body);
    if (enE && enL && !meaningsOverlap(enE, enL)) {
      actions.push({ entry: e, kind: 'REMOVE_MISMATCH' });
      stats.removeMismatch++;
    }
  }

  if (dryRun || actions.length === 0) return { lang, stats, actions };

  let newSrc = src;
  const sorted = actions.slice().sort((a, b) => b.entry.start - a.entry.start);
  for (const act of sorted) {
    const e = act.entry;
    let newBody;
    if (act.kind === 'RESOLVE') {
      newBody = e.body.replace(/lemma\s*:\s*['"][^'"]+['"]/, `lemma: '${act.newLemma}'`);
    } else {
      newBody = e.body.replace(/,\s*lemma\s*:\s*['"][^'"]+['"]/, '');
      if (newBody === e.body) {
        newBody = e.body.replace(/lemma\s*:\s*['"][^'"]+['"]\s*,?\s*/, '');
      }
    }
    const newRaw = e.raw.slice(0, e.raw.indexOf('{') + 1) + newBody + '}';
    newSrc = newSrc.slice(0, e.start) + newRaw + newSrc.slice(e.end);
  }
  fs.writeFileSync(filepath, newSrc);
  return { lang, stats, actions };
}

const targets = langArg ? langArg.split(',') : Object.keys(INFINITIVE_SUFFIX);
console.log(dryRun ? '[DRY RUN]\n' : '[APPLYING cleanup]\n');
console.log('lang   resolve  rmNotVerb  rmMismatch  total');
let grand = { resolve: 0, removeNotVerb: 0, removeMismatch: 0 };
for (const lang of targets) {
  const r = cleanLang(lang);
  if (!r) { console.log(`  ${lang}: file missing`); continue; }
  const t = r.stats.resolve + r.stats.removeNotVerb + r.stats.removeMismatch;
  grand.resolve += r.stats.resolve;
  grand.removeNotVerb += r.stats.removeNotVerb;
  grand.removeMismatch += r.stats.removeMismatch;
  console.log(`  ${lang.padEnd(4)} ${String(r.stats.resolve).padStart(7)}  ${String(r.stats.removeNotVerb).padStart(9)}  ${String(r.stats.removeMismatch).padStart(10)}  ${String(t).padStart(5)}`);
}
const grandTotal = grand.resolve + grand.removeNotVerb + grand.removeMismatch;
console.log(`\nTotal: ${grandTotal}  (resolve=${grand.resolve}, rmNotVerb=${grand.removeNotVerb}, rmMismatch=${grand.removeMismatch})`);
if (dryRun) console.log('\nRun without --dry to apply.');
