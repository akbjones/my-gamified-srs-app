#!/usr/bin/env node
/**
 * Auto-fill missing `lemma:` fields on verb-tagged dictionary entries.
 *
 * Phase A — punct-strip: entries whose key starts with ¿ ¡ « » " etc.
 *   Look up the stripped key in the same dict, copy its lemma. Spanish
 *   has ~33 of these; other langs none.
 *
 * Phase B — English-meaning lookup: for each remaining no-lemma verb
 *   entry V, scan the dictionary for any verb entry E that (a) has NO
 *   lemma field itself (so E is the infinitive), (b) whose `en` field
 *   contains V's first English meaning as a substring, and (c) whose
 *   key matches the language's infinitive-suffix pattern. If exactly
 *   ONE such E is found, set V.lemma = E.key.
 *
 *   This is conservative — it only fires when there's a single
 *   unambiguous match. Hard cases stay no-lemma for manual review.
 *
 * Run:    node scripts/fix-verb-lemmas.cjs           # apply to all langs
 *         node scripts/fix-verb-lemmas.cjs --dry     # report only
 *         node scripts/fix-verb-lemmas.cjs --lang=es # one language
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DICT_DIR = path.join(ROOT, 'src/data/dictionary');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry') || args.includes('--dry-run');
const langArg = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];

// Per-language infinitive-suffix regex. Used to filter the "is this an
// infinitive" check in Phase B. Conservative — better to miss a fix
// than to wrongly point at a non-infinitive.
const INFINITIVE_SUFFIX = {
  es: /(ar|er|ir|arse|erse|irse)$/,
  it: /(are|ere|ire|arsi|ersi|irsi|arsene)$/,
  fr: /(er|ir|re|oir|ger|cer|ier)$/,
  pt: /(ar|er|ir|or|ar-se|er-se|ir-se)$/,
  de: /(en|n)$/,   // German infinitives end in -en (or -n)
  nl: /(en|n)$/,   // Dutch likewise
  sv: /^(att\s)?[\w]+a$/,  // Swedish: most end in -a (att gå, gå)
  cy: /(o|i|u|au|eg)$/,    // Welsh: many suffixes, broad
  hi: /ना$/,                // Hindi infinitives end in -nā
  tr: /(mak|mek)$/,        // Turkish: -mak or -mek
  ru: /(ть|ться|чь|чься|ти)$/, // Russian: -ть / -ться / -чь / -ти
};

function parseDict(src) {
  // Match top-level entries: 'key': { ... },
  // The dictionaries are formatted one-entry-per-line so we use line-anchored matching.
  // Each entry is captured with: { start, end, key, body }
  const entries = [];
  const lineRe = /^(\s*)(['"])([^'"]+?)\2\s*:\s*\{([^}]*)\}/gm;
  let m;
  while ((m = lineRe.exec(src)) !== null) {
    entries.push({
      start: m.index,
      end: m.index + m[0].length,
      indent: m[1],
      quote: m[2],
      key: m[3],
      body: m[4],
      raw: m[0],
    });
  }
  return entries;
}

function getPos(body) { const m = body.match(/pos\s*:\s*['"]([^'"]+)['"]/); return m ? m[1] : null; }
function getLemma(body) { const m = body.match(/lemma\s*:\s*['"]([^'"]+)['"]/); return m ? m[1] : null; }
function getEn(body) { const m = body.match(/en\s*:\s*['"]([^'"]*)['"]/); return m ? m[1] : ''; }

const PUNCT_LEADING = /^[¿¡«»"'„‚‹›()]+/;

function fixLanguage(lang) {
  const filepath = path.join(DICT_DIR, `${lang}.ts`);
  if (!fs.existsSync(filepath)) return null;
  const src = fs.readFileSync(filepath, 'utf8');
  const entries = parseDict(src);
  const byKey = new Map(entries.map(e => [e.key, e]));
  const infSuffix = INFINITIVE_SUFFIX[lang];

  const noLemmaVerbs = entries.filter(e => getPos(e.body) === 'v' && !getLemma(e.body));
  const stats = { phaseA: 0, phaseB_unique: 0, phaseB_ambiguous: 0, phaseB_none: 0, total: noLemmaVerbs.length };
  const fixes = [];   // { entry, newLemma, reason }

  // Phase A — strip leading punctuation, copy lemma from stripped sibling
  for (const e of noLemmaVerbs) {
    if (!PUNCT_LEADING.test(e.key)) continue;
    const stripped = e.key.replace(PUNCT_LEADING, '');
    const sibling = byKey.get(stripped);
    if (!sibling) continue;
    const sibLemma = getLemma(sibling.body) || (getPos(sibling.body) === 'v' && infSuffix?.test(stripped) ? stripped : null);
    if (sibLemma) {
      fixes.push({ entry: e, newLemma: sibLemma, reason: 'phaseA' });
      stats.phaseA++;
    }
  }
  const phaseAFixedKeys = new Set(fixes.map(f => f.entry.key));

  // Phase B — English-meaning lookup. Build index of infinitive entries
  // keyed by their first English meaning phrase (everything before the first ';').
  const infinitiveByMeaning = new Map(); // meaning → array of infinitive keys
  for (const e of entries) {
    if (getPos(e.body) !== 'v') continue;
    if (getLemma(e.body)) continue;          // skip entries that already point elsewhere
    if (!infSuffix || !infSuffix.test(e.key)) continue;   // must look like an infinitive
    const en = getEn(e.body);
    if (!en) continue;
    // Split on ; to handle "to know; to meet; to visit" — index each phrase.
    for (const phrase of en.split(';').map(s => s.trim()).filter(Boolean)) {
      if (!infinitiveByMeaning.has(phrase)) infinitiveByMeaning.set(phrase, []);
      infinitiveByMeaning.get(phrase).push(e.key);
    }
  }

  for (const e of noLemmaVerbs) {
    if (phaseAFixedKeys.has(e.key)) continue;
    // SAFETY: never add a lemma to an entry that already looks like an
    // infinitive itself. Without this guard, two infinitives sharing an
    // English meaning (e.g. Hindi जाना "to go" vs चलना "to walk; to go")
    // would wrongly point at each other.
    if (infSuffix && infSuffix.test(e.key)) { stats.phaseB_none++; continue; }
    const en = getEn(e.body);
    if (!en) { stats.phaseB_none++; continue; }
    const firstPhrase = en.split(';')[0].trim();
    if (!firstPhrase) { stats.phaseB_none++; continue; }
    const candidates = (infinitiveByMeaning.get(firstPhrase) || []).filter(k => k !== e.key);
    if (candidates.length === 1) {
      fixes.push({ entry: e, newLemma: candidates[0], reason: 'phaseB' });
      stats.phaseB_unique++;
    } else if (candidates.length > 1) {
      stats.phaseB_ambiguous++;
    } else {
      stats.phaseB_none++;
    }
  }

  // Apply fixes (right-to-left so earlier offsets stay valid)
  let newSrc = src;
  if (fixes.length > 0 && !dryRun) {
    const sorted = fixes.slice().sort((a, b) => b.entry.start - a.entry.start);
    for (const f of sorted) {
      const e = f.entry;
      // Inject lemma BEFORE the closing brace of body. Body looks like:
      // " en: '...', ipa: '...', pos: 'v' "
      // We want it to become:
      // " en: '...', ipa: '...', pos: 'v', lemma: 'X' "
      const newBody = e.body.replace(/(\s*)$/, `, lemma: '${f.newLemma}'$1`);
      const newRaw = e.raw.slice(0, e.raw.indexOf('{') + 1) + newBody + '}';
      newSrc = newSrc.slice(0, e.start) + newRaw + newSrc.slice(e.end);
    }
    fs.writeFileSync(filepath, newSrc);
  }

  return { lang, stats, fixes };
}

const targets = langArg ? langArg.split(',') : Object.keys(INFINITIVE_SUFFIX);
console.log(dryRun ? '[DRY RUN — no writes]\n' : '[APPLYING fixes]\n');
console.log('lang   total  phaseA  phaseB ✓  phaseB ambig  phaseB none  fixed%');
let totalFixed = 0, grandTotal = 0;
for (const lang of targets) {
  const r = fixLanguage(lang);
  if (!r) { console.log(`  ${lang}: (file missing)`); continue; }
  const { stats } = r;
  const fixed = stats.phaseA + stats.phaseB_unique;
  totalFixed += fixed;
  grandTotal += stats.total;
  const pct = stats.total > 0 ? (fixed * 100 / stats.total).toFixed(1) : '0.0';
  console.log(
    `  ${lang.padEnd(4)} ${String(stats.total).padStart(6)} ${String(stats.phaseA).padStart(7)} ` +
    `${String(stats.phaseB_unique).padStart(9)} ${String(stats.phaseB_ambiguous).padStart(13)} ` +
    `${String(stats.phaseB_none).padStart(12)} ${pct.padStart(6)}%`
  );
}
console.log(`\nTotal: ${totalFixed} / ${grandTotal} lemmas auto-filled (${(totalFixed*100/grandTotal).toFixed(1)}%)`);
if (dryRun) console.log('\nRun without --dry to apply.');
