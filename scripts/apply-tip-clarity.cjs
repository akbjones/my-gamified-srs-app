#!/usr/bin/env node
// APPLY + GATE for the Tip Clarity pass. Reads the review outputs
// docs/tip-clarity/<lang>/out-*.json ([{id,tip}] — every reviewed tip, fixed or
// unchanged) and overwrites each card's grammar. Gates each tip against the base
// rules (<=200 chars, no em dash, no markdown, exact-dup, and the QUOTE RULE via
// a per-language matcher). Refuses to write on any failure.
// Usage: node scripts/apply-tip-clarity.cjs --lang=hindi [--check]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const lang = (process.argv.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const check = process.argv.includes('--check');
if (!lang) { console.error('use --lang=hindi|russian|turkish|welsh|...'); process.exit(1); }

const DECK_PATH = path.join(ROOT, `src/data/${lang}/deck.json`);
const passArg = (process.argv.find(a => a.startsWith('--pass=')) || '').split('=')[1] || 'tip-clarity';
const DIR = path.join(ROOT, `docs/${passArg}/${lang}`);
if (!fs.existsSync(DIR)) { console.error('no pass output at', DIR); process.exit(1); }
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const byId = new Map(deck.map(c => [String(c.id), c]));

const tips = new Map();
for (const f of fs.readdirSync(DIR).filter(f => /^out-\d+\.json$/.test(f)))
  for (const e of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
    if (e && e.id && typeof e.tip === 'string') tips.set(String(e.id), e.tip.trim());

const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const MATCHERS = {
  latin(tip, target) { // turkish (ı-fold), welsh, romance, germanic
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
  hindi(tip, target) { // full Devanagari tokens (keep matras — stripping them nukes 2-char words like है/हूँ); exact or inflection-prefix
    const toks = s => (String(s).normalize('NFC').match(/[ऀ-ॿ]+/g) || []);
    const tgt = toks(target);
    for (const t of toks(tip)) for (const g of tgt) {
      if (g === t) return true;
      const [a, b] = t.length <= g.length ? [t, g] : [g, t];
      if (a.length >= 2 && b.startsWith(a)) return true; // stem prefix (मैं ⊂ मैंने)
    }
    return false;
  },
};
const quotesOwnCard = MATCHERS[lang] || MATCHERS.latin;

const fails = [];
const gate = (id, cond, why, tip) => { if (!cond) fails.push({ id, why, tip: (tip || '').slice(0, 90) }); };
function lintTip(id, tip, target) {
  gate(id, tip.length > 0 && tip.length <= 200, `len ${tip.length}`, tip);
  gate(id, !tip.includes('—'), 'em dash', tip);
  gate(id, !/[`*_#]/.test(tip), 'markdown', tip);
  gate(id, quotesOwnCard(tip, target), 'quote rule: cites no word from its own card', tip);
}

let applied = 0;
const final = new Map();
for (const [id, tip] of tips) {
  const c = byId.get(id);
  gate(id, !!c, 'unknown card id', tip);
  if (!c) continue;
  lintTip(id, tip, c.target);
  final.set(id, tip); applied++;
}
const seen = new Map();
for (const [id, tip] of final) { const k = tip.toLowerCase(); if (seen.has(k)) gate(id, false, `dup of ${seen.get(k)}`, tip); else seen.set(k, id); }

console.log(`${lang}: ${applied} tips reviewed+applied (deck ${deck.length})`);
if (fails.length) {
  console.error(`\n✗ ${fails.length} GATE FAILURES — refusing to write:`);
  for (const f of fails.slice(0, 40)) console.error(`  ${f.id}: ${f.why}${f.tip ? ' :: ' + f.tip : ''}`);
  if (fails.length > 40) console.error(`  … and ${fails.length - 40} more`);
  fs.writeFileSync(path.join(DIR, 'gate-failures.json'), JSON.stringify(fails, null, 1));
  process.exit(1);
}
console.log('✓ all gates green');
if (check) { console.log('(check mode — no write)'); process.exit(0); }
for (const c of deck) { const id = String(c.id); if (final.has(id)) c.grammar = final.get(id); }
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('wrote', DECK_PATH);
