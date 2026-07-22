#!/usr/bin/env node
// APPLY + LINT for the Wave-A tips languages (Playbook v2 stage 6),
// generalized from apply-hindi-tips.cjs. Merge order, refusing to write on
// any hard-gate failure:
//   1. strip DROP tips + the originals of rewrites (classify verdicts)
//   2. apply rewrites   docs/tips-wave-a/<lang>/rewrites-*.json
//   3. apply fills      docs/tips-wave-a/<lang>/fill-node-*.json
//      (a fill may NEVER overwrite a keep or a rewrite)
// Hard gates per tip: ≤200 chars, no em dash, no backticks/markdown, exact-dup
// across the final corpus, and the QUOTE RULE with a per-script matcher:
//   korean     – Hangul tokens; exact or particle-tolerant prefix (학교 ↔ 학교에)
//   greek      – lowercased, accent-stripped; exact or ≥4-char stem prefix
//   indonesian – lowercased Latin; exact or ≥4-char root containment (makan ↔ memakan)
// Do NOT loosen matchers on failures — touch up the tips instead.
//
// Usage: node scripts/apply-tips.cjs --lang=korean [--check]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const lang = (process.argv.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const check = process.argv.includes('--check');
if (!['korean', 'greek', 'indonesian'].includes(lang)) { console.error('use --lang=korean|greek|indonesian'); process.exit(1); }

const DECK_PATH = path.join(ROOT, `src/data/${lang}/deck.json`);
const TIPS_DIR = path.join(ROOT, `docs/tips-wave-a/${lang}`);
const CLASSIFY_GLOB = path.join(ROOT, 'docs/tips-wave-a');
const listFiles = (dir, re) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => re.test(f)).map(f => path.join(dir, f)) : [];

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const byId = new Map(deck.map(c => [c.id, c]));

const verdicts = new Map();
for (const f of listFiles(CLASSIFY_GLOB, new RegExp(`^${lang}-classify-.*\\.json$`)))
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) verdicts.set(e.id, e.verdict);

const rewrites = [];
for (const f of listFiles(TIPS_DIR, /^rewrites-.*\.json$/))
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) rewrites.push(e);
const fills = [];
for (const f of listFiles(TIPS_DIR, /^fill-node-.*\.json$/))
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) fills.push({ ...e, src: path.basename(f) });

// ── per-script quote matchers ────────────────────────────────────────────────
const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const MATCHERS = {
  korean(tip, target) {
    const toks = s => (s.match(/[가-힣]+/g) || []);
    const tgt = toks(target);
    for (const t of toks(tip)) {
      for (const g of tgt) {
        if (g === t) return true;
        // particles/endings attach directly: tip cites the stem (학교 ↔ 학교에,
        // 먹다 cited as 먹 in 먹었어요). Either direction, ≥1 shared syllable
        // and one is a prefix of the other with the shorter ≥1 syllable.
        const [a, b] = t.length <= g.length ? [t, g] : [g, t];
        if (a.length >= 1 && b.startsWith(a) && a.length >= Math.min(2, b.length)) return true;
      }
    }
    return false;
  },
  greek(tip, target) {
    const norm = s => stripAccents(s.toLowerCase());
    const toks = s => (norm(s).match(/[α-ωϊϋς]+/g) || []).filter(t => t.length >= 2);
    const tgt = toks(target);
    for (const t of toks(tip)) {
      for (const g of tgt) {
        if (g === t) return true;
        if (Math.min(t.length, g.length) >= 4 && t.slice(0, 4) === g.slice(0, 4)) return true;
      }
    }
    return false;
  },
  indonesian(tip, target) {
    const toks = s => (s.toLowerCase().match(/[a-z]+/g) || []).filter(t => t.length >= 3);
    const tgt = toks(target);
    for (const t of toks(tip)) {
      for (const g of tgt) {
        if (g === t) return true;
        // agglutination: root inside affixed form (makan ↔ memakannya)
        if (t.length >= 4 && g.includes(t)) return true;
        if (g.length >= 4 && t.includes(g)) return true;
      }
    }
    return false;
  },
};
const quotesOwnCard = MATCHERS[lang];

// ── lint gates ───────────────────────────────────────────────────────────────
const fails = [];
const gate = (id, cond, why, tip) => { if (!cond) fails.push({ id, why, tip: (tip || '').slice(0, 90) }); };
const NEEDS_ROMAN = lang === 'korean' || lang === 'greek';
const SCRIPT_RE = lang === 'korean' ? /[가-힣]/ : /[α-ωΑ-Ωϊϋ]/;
function lintTip(id, tip, target) {
  gate(id, tip.length <= 200, `over 200 chars (${tip.length})`, tip);
  gate(id, !tip.includes('—'), 'em dash', tip);
  gate(id, !/[`*_#]/.test(tip), 'backtick/markdown', tip);
  if (NEEDS_ROMAN) gate(id, SCRIPT_RE.test(tip) ? /\(/.test(tip) : true, 'target-script without romanization parens', tip);
  gate(id, quotesOwnCard(tip, target), 'quote rule: cites no word from its own card', tip);
}

// ── merge ────────────────────────────────────────────────────────────────────
let stripped = 0, rewritten = 0, filled = 0, blocked = 0;
const finalTips = new Map();
for (const c of deck) {
  if (!c.grammar) continue;
  const v = verdicts.get(c.id);
  if (v === 'drop' || v === 'rewrite') { stripped++; continue; }
  finalTips.set(c.id, c.grammar);
}
for (const r of rewrites) {
  const card = byId.get(r.id);
  gate(r.id, !!card, 'rewrite for unknown card id');
  if (!card) continue;
  lintTip(r.id, r.tip, card.target);
  finalTips.set(r.id, r.tip);
  rewritten++;
}
for (const fi of fills) {
  const card = byId.get(fi.id);
  gate(fi.id, !!card, `fill for unknown card id (${fi.src})`);
  if (!card) continue;
  if (finalTips.has(fi.id)) { blocked++; continue; }
  lintTip(fi.id, fi.tip, card.target);
  finalTips.set(fi.id, fi.tip);
  filled++;
}
const seen = new Map();
for (const [id, tip] of finalTips) {
  const key = tip.trim().toLowerCase();
  if (seen.has(key)) gate(id, false, `exact duplicate of ${seen.get(key)}`, tip);
  else seen.set(key, id);
}

const coverage = (100 * finalTips.size / deck.length).toFixed(1);
console.log(`${lang}: deck ${deck.length} | keeps ${finalTips.size - rewritten - filled} + rewrites ${rewritten} + fills ${filled} = ${finalTips.size} tips (${coverage}%)`);
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
  if (finalTips.has(c.id)) c.grammar = finalTips.get(c.id);
  else delete c.grammar;
}
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('wrote', DECK_PATH);
