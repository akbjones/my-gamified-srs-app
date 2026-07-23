#!/usr/bin/env node
// APPLY + LINT for the Wave-B (legacy Latin) tips languages — fr/it/pt/de/nl/sv.
// Mirrors apply-tips.cjs (Wave A) with the wave-b file layout + a Latin quote
// matcher. Merge order, refusing to write on any hard-gate failure:
//   1. strip DROP tips + the originals of rewrites (classify verdicts)
//   2. apply rewrites   docs/tips-wave-b/<lang>/rewritten-*.json
//   3. apply fills      docs/tips-wave-b/<lang>/filled-*.json
//      (a fill may NEVER overwrite a keep or a rewrite)
// Hard gates per tip: <=200 chars, no em dash, no backticks/markdown, exact-dup
// across the final corpus, and the QUOTE RULE (Latin matcher: accent-stripped
// token, exact / >=4-char shared prefix / >=4-char containment — covers Romance
// inflection parle<->parler and German compounds).
//
// Usage: node scripts/apply-tips-b.cjs --lang=french [--check]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const lang = (process.argv.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const check = process.argv.includes('--check');
const LANGS = ['french', 'italian', 'portuguese', 'german', 'dutch', 'swedish'];
if (!LANGS.includes(lang)) { console.error(`use --lang=${LANGS.join('|')}`); process.exit(1); }

const DECK_PATH = path.join(ROOT, `src/data/${lang}/deck.json`);
const TIPS_DIR = path.join(ROOT, `docs/tips-wave-b/${lang}`);
const CLASSIFY_GLOB = path.join(ROOT, 'docs/tips-wave-b');
const listFiles = (dir, re) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => re.test(f)).map(f => path.join(dir, f)) : [];

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const byId = new Map(deck.map(c => [String(c.id), c]));

const verdicts = new Map();
for (const f of listFiles(CLASSIFY_GLOB, new RegExp(`^${lang}-classify-.*\\.json$`)))
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) verdicts.set(e.id, e.verdict);

const rewrites = [];
for (const f of listFiles(TIPS_DIR, /^rewritten-.*\.json$/))
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) rewrites.push(e);
const fills = [];
for (const f of listFiles(TIPS_DIR, /^filled-.*\.json$/))
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) fills.push({ ...e, src: path.basename(f) });

// ── Latin quote matcher ──────────────────────────────────────────────────────
const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
function quotesOwnCard(tip, target) {
  const toks = s => (stripAccents(String(s).toLowerCase()).match(/[a-zß]+/g) || []).filter(t => t.length >= 3);
  const tgt = toks(target);
  for (const t of toks(tip)) {
    for (const g of tgt) {
      if (g === t) return true;
      // Romance inflection: shared >=4-char prefix (parle/parler, mange/manger)
      if (Math.min(t.length, g.length) >= 4 && t.slice(0, 4) === g.slice(0, 4)) return true;
      // German compounds / affixation: one contains the other, >=4 chars
      if (t.length >= 4 && g.includes(t)) return true;
      if (g.length >= 4 && t.includes(g)) return true;
    }
  }
  return false;
}

// ── lint gates ───────────────────────────────────────────────────────────────
const fails = [];
const gate = (id, cond, why, tip) => { if (!cond) fails.push({ id, why, tip: (tip || '').slice(0, 90) }); };
function lintTip(id, tip, target) {
  gate(id, typeof tip === 'string' && tip.length > 0, 'empty tip', tip);
  if (typeof tip !== 'string') return;
  gate(id, tip.length <= 200, `over 200 chars (${tip.length})`, tip);
  gate(id, !tip.includes('—'), 'em dash', tip);
  gate(id, !/[`*_#]/.test(tip), 'backtick/markdown', tip);
  gate(id, quotesOwnCard(tip, target), 'quote rule: cites no word from its own card', tip);
}

// ── merge ────────────────────────────────────────────────────────────────────
let stripped = 0, rewritten = 0, filled = 0, blocked = 0;
const finalTips = new Map();
for (const c of deck) {
  if (!c.grammar) continue;
  const v = verdicts.get(String(c.id));
  if (v === 'drop' || v === 'rewrite') { stripped++; continue; }
  finalTips.set(String(c.id), c.grammar); // keeps
}
for (const r of rewrites) {
  const card = byId.get(String(r.id));
  gate(r.id, !!card, 'rewrite for unknown card id');
  if (!card || !r.tip) continue;
  lintTip(r.id, r.tip, card.target);
  finalTips.set(String(r.id), r.tip);
  rewritten++;
}
for (const fi of fills) {
  const card = byId.get(String(fi.id));
  gate(fi.id, !!card, `fill for unknown card id (${fi.src})`);
  if (!card || !fi.tip) continue;
  if (finalTips.has(String(fi.id))) { blocked++; continue; } // never overwrite keep/rewrite
  lintTip(fi.id, fi.tip, card.target);
  finalTips.set(String(fi.id), fi.tip);
  filled++;
}
const seen = new Map();
for (const [id, tip] of finalTips) {
  const key = tip.trim().toLowerCase();
  if (seen.has(key)) gate(id, false, `exact duplicate of ${seen.get(key)}`, tip);
  else seen.set(key, id);
}

const keeps = finalTips.size - rewritten - filled;
const coverage = (100 * finalTips.size / deck.length).toFixed(1);
console.log(`${lang}: deck ${deck.length} | keeps ${keeps} + rewrites ${rewritten} + fills ${filled} = ${finalTips.size} tips (${coverage}%)`);
console.log(`stripped ${stripped} | fills blocked from overwriting ${blocked}`);
if (fails.length) {
  console.error(`\n✗ ${fails.length} LINT FAILURES — refusing to write:`);
  for (const f of fails.slice(0, 40)) console.error(`  ${f.id}: ${f.why}${f.tip ? ' :: ' + f.tip : ''}`);
  if (fails.length > 40) console.error(`  … and ${fails.length - 40} more`);
  fs.writeFileSync(path.join(TIPS_DIR, 'lint-failures.json'), JSON.stringify(fails, null, 1));
  process.exit(1);
}
console.log('✓ all gates green');
if (check) { console.log('(check mode — no write)'); process.exit(0); }
for (const c of deck) {
  const id = String(c.id);
  if (finalTips.has(id)) c.grammar = finalTips.get(id);
  else delete c.grammar;
}
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('wrote', DECK_PATH);
