#!/usr/bin/env node
// APPLY + LINT for Wave-C tips (tr/ru/cy), authored from scratch to ~22% by the
// per-node workflow (docs/tips-wave-c/<lang>/node-NN.json = [{id,tip}]). Unlike
// Wave A/B there is no classify step: the authored files ARE the final tip set,
// so we set grammar for every id in the files and CLEAR it on every other card
// (net coverage rises from the old sparse 5-9% to a curated ~22%).
// Hard gates per tip: <=200 chars, no em dash, no backtick/markdown, exact-dup,
// and the QUOTE RULE with a per-language matcher:
//   turkish – Latin, accent-stripped (ç/ş/ğ/ı/ö/ü), exact or >=4-char stem
//   welsh   – Latin; agent quoted the mutated SURFACE form, so same matcher
//   russian – Cyrillic tokens; exact or >=4-char stem; PLUS romanization-parens
//             required whenever the tip shows Cyrillic
// Usage: node scripts/apply-tips-c.cjs --lang=russian [--check]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const lang = (process.argv.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const check = process.argv.includes('--check');
if (!['turkish', 'russian', 'welsh'].includes(lang)) { console.error('use --lang=turkish|russian|welsh'); process.exit(1); }

const DECK_PATH = path.join(ROOT, `src/data/${lang}/deck.json`);
const TIPS_DIR = path.join(ROOT, `docs/tips-wave-c/${lang}`);
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const byId = new Map(deck.map(c => [String(c.id), c]));

const tips = new Map();
for (const f of fs.readdirSync(TIPS_DIR).filter(f => /^node-\d+\.json$/.test(f)))
  for (const e of JSON.parse(fs.readFileSync(path.join(TIPS_DIR, f), 'utf8')))
    if (e && e.id && typeof e.tip === 'string') tips.set(String(e.id), e.tip.trim());

// ── per-language quote matchers ──────────────────────────────────────────────
const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const MATCHERS = {
  latin(tip, target) {
    // Turkish ı (dotless i, U+0131) is a base letter — NFD doesn't fold it to
    // 'i', so fold it explicitly or words like Kızım/çıkmış split and never match.
    const toks = s => (stripAccents(String(s).toLowerCase().replace(/ı/g, 'i')).match(/[a-zß]+/g) || []).filter(t => t.length >= 3);
    const tgt = toks(target);
    for (const t of toks(tip)) for (const g of tgt) {
      if (g === t) return true;
      if (Math.min(t.length, g.length) >= 4 && t.slice(0, 4) === g.slice(0, 4)) return true;
      if (t.length >= 4 && g.includes(t)) return true;
      if (g.length >= 4 && t.includes(g)) return true;
    }
    return false;
  },
  russian(tip, target) {
    const toks = s => (String(s).toLowerCase().match(/[а-яё]+/g) || []).filter(t => t.length >= 3);
    const tgt = toks(target);
    for (const t of toks(tip)) for (const g of tgt) {
      if (g === t) return true;
      if (Math.min(t.length, g.length) >= 4 && t.slice(0, 4) === g.slice(0, 4)) return true;
    }
    return false;
  },
};
const quotesOwnCard = lang === 'russian' ? MATCHERS.russian : MATCHERS.latin;
const CYR = /[а-яА-ЯёЁ]/;

// ── gates ────────────────────────────────────────────────────────────────────
const fails = [];
const gate = (id, cond, why, tip) => { if (!cond) fails.push({ id, why, tip: (tip || '').slice(0, 90) }); };
function lintTip(id, tip, target) {
  gate(id, tip.length > 0, 'empty', tip);
  gate(id, tip.length <= 200, `over 200 (${tip.length})`, tip);
  gate(id, !tip.includes('—'), 'em dash', tip);
  gate(id, !/[`*_#]/.test(tip), 'markdown', tip);
  if (lang === 'russian') gate(id, CYR.test(tip) ? /\(/.test(tip) : true, 'cyrillic without romanization parens', tip);
  gate(id, quotesOwnCard(tip, target), 'quote rule: cites no word from its own card', tip);
}

let set = 0, cleared = 0;
const final = new Map();
for (const c of deck) {
  const id = String(c.id);
  if (tips.has(id)) { const t = tips.get(id); lintTip(id, t, c.target); final.set(id, t); set++; }
  else if (c.grammar) cleared++;
}
const seen = new Map();
for (const [id, tip] of final) { const k = tip.toLowerCase(); if (seen.has(k)) gate(id, false, `dup of ${seen.get(k)}`, tip); else seen.set(k, id); }
for (const id of tips.keys()) gate(id, byId.has(id), 'unknown card id');

const coverage = (100 * final.size / deck.length).toFixed(1);
console.log(`${lang}: deck ${deck.length} | ${final.size} tips (${coverage}%) | set ${set}, cleared ${cleared} old`);
if (fails.length) {
  console.error(`\n✗ ${fails.length} LINT FAILURES — refusing to write:`);
  for (const f of fails.slice(0, 40)) console.error(`  ${f.id}: ${f.why}${f.tip ? ' :: ' + f.tip : ''}`);
  if (fails.length > 40) console.error(`  … and ${fails.length - 40} more`);
  fs.writeFileSync(path.join(TIPS_DIR, 'lint-failures.json'), JSON.stringify(fails, null, 1));
  process.exit(1);
}
console.log('✓ all gates green');
if (check) { console.log('(check mode — no write)'); process.exit(0); }
for (const c of deck) { const id = String(c.id); if (final.has(id)) c.grammar = final.get(id); else delete c.grammar; }
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('wrote', DECK_PATH);
