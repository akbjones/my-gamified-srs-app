#!/usr/bin/env node
// APPLY + LINT stage of the Hindi tips wave (Playbook v2 stage 6).
//
// Merges, in this order, refusing to write if any hard gate fails:
//   1. strip DROP tips (classify verdicts) and the originals of rewrites
//   2. apply rewrites.json                     (docs/tips-hindi/rewrites.json)
//   3. apply per-node fills                    (docs/tips-hindi/fill-node-*.json)
//      - a fill may NEVER overwrite a keep or a rewrite (pilot guard)
// Hard gates per tip: ≤200 chars, no em dash, no backticks/markdown, exact-dup
// across the final corpus, and the QUOTE RULE: the tip must cite a word from
// its own card's target. Devanagari matching is matra-tolerant (combining
// marks stripped, ≥3-char skeleton prefix accepted) — the same idea as the
// register linter; do NOT loosen further, touch up tips instead.
//
// Usage: node scripts/apply-hindi-tips.cjs --check   (lint only, no write)
//        node scripts/apply-hindi-tips.cjs           (refuses on any gate fail)

const fs = require('fs');
const path = require('path');
const glob = p => fs.readdirSync(path.dirname(p)).filter(f => f.match(path.basename(p).replace('*', '.*'))).map(f => path.join(path.dirname(p), f));

const ROOT = path.join(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/hindi/deck.json');
const TIPS_DIR = path.join(ROOT, 'docs/tips-hindi');
const check = process.argv.includes('--check');

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const byId = new Map(deck.map(c => [c.id, c]));

// ── verdicts ─────────────────────────────────────────────────────────────────
const verdicts = new Map();
for (const f of glob(path.join(TIPS_DIR, 'hindi-classify-*.json')))
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) verdicts.set(e.id, e.verdict);

// ── incoming tips ────────────────────────────────────────────────────────────
const rewrites = fs.existsSync(path.join(TIPS_DIR, 'rewrites.json'))
  ? JSON.parse(fs.readFileSync(path.join(TIPS_DIR, 'rewrites.json'), 'utf8')) : [];
const fills = [];
for (const f of glob(path.join(TIPS_DIR, 'fill-node-*.json')))
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) fills.push({ ...e, src: path.basename(f) });

// ── matra-tolerant Devanagari matcher ────────────────────────────────────────
// Skeleton = Devanagari with combining vowel signs / nukta / virama / accents
// removed, so inflected forms still match their stem (किताब ↔ किताबें).
// Tokens are LETTERS only: the Devanagari block also contains punctuation
// (danda । ॥, U+0964-5) and digits (U+0966-6F), which must not glue onto a
// word — else किताब। ≠ किताब. Matching accepts either a RAW exact token
// (catches short words like तू / जी / पी that skeleton-collapse to one glyph)
// or a shared ≥3-char skeleton prefix (catches inflection).
const DEV_LETTERS = /[ऀ-ॣ॰-ॿ]+/g; // Devanagari minus danda/digits
const skeleton = s => s.replace(/[ऺ-ॏ॑-ॗॢॣ़ँ-ः]/g, '');
function rawTokens(s) { return (s.match(DEV_LETTERS) || []).filter(t => t.length >= 2); }
function skelTokens(s) { return rawTokens(s).map(skeleton).filter(t => t.length >= 2); }
const digitRuns = s => s.match(/[०-९]{2,}/g) || []; // Devanagari numerals, kept OUT of word tokens
function quotesOwnCard(tip, target) {
  const rawT = new Set(rawTokens(target));
  for (const t of rawTokens(tip)) if (rawT.has(t)) return true; // exact form (short words)
  const numT = new Set(digitRuns(target)); // a tip ABOUT a number cites that number
  for (const n of digitRuns(tip)) if (numT.has(n)) return true;
  const skelT = skelTokens(target);
  for (const t of skelTokens(tip)) {
    for (const tt of skelT) {
      if (t === tt) return true;
      if (Math.min(t.length, tt.length) >= 3 && t.slice(0, 3) === tt.slice(0, 3)) return true; // stem prefix
    }
  }
  return false;
}

// ── lint gates ───────────────────────────────────────────────────────────────
const fails = [];
const gate = (id, cond, why, tip) => { if (!cond) fails.push({ id, why, tip: (tip || '').slice(0, 80) }); };
function lintTip(id, tip, target) {
  gate(id, tip.length <= 200, `over 200 chars (${tip.length})`, tip);
  gate(id, !tip.includes('—'), 'em dash', tip);
  gate(id, !/[`*_#]/.test(tip), 'backtick/markdown', tip);
  gate(id, /[ऀ-ॿ]/.test(tip) ? /\(/.test(tip) : true, 'Devanagari without romanization parens', tip);
  gate(id, quotesOwnCard(tip, target), 'quote rule: cites no word from its own card', tip);
}

// ── merge ────────────────────────────────────────────────────────────────────
let stripped = 0, rewritten = 0, filled = 0, blockedOverwrite = 0;
const finalTips = new Map(); // id -> tip
for (const c of deck) {
  if (!c.grammar) continue;
  const v = verdicts.get(c.id);
  if (v === 'drop' || v === 'rewrite') { stripped++; continue; } // rewrite originals replaced below
  finalTips.set(c.id, c.grammar); // keeps
}
for (const r of rewrites) {
  const card = byId.get(r.id);
  gate(r.id, !!card, 'rewrite for unknown card id');
  if (!card) continue;
  lintTip(r.id, r.tip, card.target);
  finalTips.set(r.id, r.tip);
  rewritten++;
}
for (const fitem of fills) {
  const card = byId.get(fitem.id);
  gate(fitem.id, !!card, `fill for unknown card id (${fitem.src})`);
  if (!card) continue;
  if (finalTips.has(fitem.id)) { blockedOverwrite++; continue; } // never overwrite keep/rewrite
  lintTip(fitem.id, fitem.tip, card.target);
  finalTips.set(fitem.id, fitem.tip);
  filled++;
}

// exact-dup across the final corpus
const seen = new Map();
for (const [id, tip] of finalTips) {
  const key = tip.trim().toLowerCase();
  if (seen.has(key)) gate(id, false, `exact duplicate of ${seen.get(key)}`, tip);
  else seen.set(key, id);
}

// ── report ───────────────────────────────────────────────────────────────────
const coverage = (100 * finalTips.size / deck.length).toFixed(1);
console.log(`deck ${deck.length} cards | keeps ${finalTips.size - rewritten - filled} + rewrites ${rewritten} + fills ${filled} = ${finalTips.size} tips (${coverage}%)`);
console.log(`stripped ${stripped} (drops + rewrite originals) | fills blocked from overwriting ${blockedOverwrite}`);
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
  if (finalTips.has(c.id)) c.grammar = finalTips.get(c.id);
  else delete c.grammar;
}
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('wrote', DECK_PATH);
