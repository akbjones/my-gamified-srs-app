#!/usr/bin/env node
/* Grammar tip audit v2 – scans every grammar tip in every deck and flags
 * common quality issues. Outputs:
 *   1. Per-language summary (counts per issue)
 *   2. Top 5 most-repeated tips per language (high-leverage rewrites)
 *   3. Sample of each issue type for manual review
 *
 * Run: node scripts/grammar-tip-audit-v2.cjs        # summary across all 11
 *      node scripts/grammar-tip-audit-v2.cjs hi    # deep-dive on Hindi
 */

const fs = require('fs');
const path = require('path');

const LANGS = ['spanish','italian','french','portuguese','german','dutch','swedish','welsh','turkish','hindi','russian'];
const argLang = process.argv[2];

const checks = {
  tooLong:           tip => tip.length > 120,
  veryLong:          tip => tip.length > 170,
  multipleSentences: tip => (tip.match(/[.!?]\s+[A-Z]/g) || []).length >= 2,
  noExample: tip => {
    // A worked example shows up as ONE of:
    //   - "=" or "→" sign (e.g. "ke paas = near")
    //   - backtick-fenced foreign word followed by an "=" gloss
    //   - parenthetical containing at least 2 latin words or a single English
    //     word (e.g. "(the car, m)", "(I ate)", "(big table)")
    //   - colon followed by a quoted example
    if (/[=→]/.test(tip)) return false;
    if (/`[^`]+`.*=\s/.test(tip)) return false;
    if (/\([^)]{4,}\)/.test(tip)) return false; // any parenthetical with content
    return true;
  },
  jargon:            tip => /\b(postposition|preposition|nominative|accusative|dative|genitive|locative|ablative|instrumental|vocative|ergative|absolutive|aorist|aspect|perfective|imperfective|participle|gerund|infinitive|conjugation|declension|oblique|allomorph|enclitic|proclitic|metathesis|fricative|plosive|sibilant|labial|velar|dental|stative|dynamic|telic|atelic|valence|valency)\b/i.test(tip),
  noRomanization:    (tip, lang) => {
    if (!['hindi','russian'].includes(lang)) return false;
    if (!/[ऀ-ॿЀ-ӿ]/.test(tip)) return false;
    return !/\([a-zA-Z][a-zA-Z' ]+\s*[=,]/.test(tip);
  },
  cryptic:           tip => tip.length < 50,
};

function loadDeck(lang) {
  const p = path.join('src/data', lang, 'deck.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const report = {};

for (const lang of LANGS) {
  const deck = loadDeck(lang);
  if (!deck) continue;
  const tips = deck.filter(c => c.grammar && c.grammar.length > 0);
  const r = {
    totalCards: deck.length,
    cardsWithTips: tips.length,
    coverage: ((tips.length / deck.length) * 100).toFixed(1),
    issues: {},
    distinctTips: new Set(tips.map(c => c.grammar)).size,
    avgLength: tips.length ? Math.round(tips.reduce((a, c) => a + c.grammar.length, 0) / tips.length) : 0,
  };
  for (const k of Object.keys(checks)) r.issues[k] = 0;

  const usage = new Map();
  for (const c of tips) usage.set(c.grammar, (usage.get(c.grammar) || 0) + 1);
  r.heavyRepeats = [...usage.entries()].filter(([, n]) => n >= 10).length;

  const samples = {};
  for (const c of tips) {
    for (const [name, fn] of Object.entries(checks)) {
      if (fn(c.grammar, lang)) {
        r.issues[name]++;
        if (!samples[name]) samples[name] = [];
        if (samples[name].length < 3) samples[name].push({ id: c.id, target: c.target, tip: c.grammar });
      }
    }
  }
  r.samples = samples;
  r.topRepeats = [...usage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => ({ uses: n, tip: t.slice(0, 90) + (t.length > 90 ? '…' : '') }));
  report[lang] = r;
}

console.log('\n=== GRAMMAR TIP AUDIT v2 ===\n');
console.log('lang        w/tips  distinct  avg-len  too-long  v-long  mult-s  no-ex  jargon  no-rom  cryptic  heavy-rep');
for (const lang of LANGS) {
  const r = report[lang];
  if (!r) continue;
  console.log([
    lang.padEnd(11),
    String(r.cardsWithTips).padStart(6),
    String(r.distinctTips).padStart(8),
    String(r.avgLength).padStart(7),
    String(r.issues.tooLong).padStart(8),
    String(r.issues.veryLong).padStart(6),
    String(r.issues.multipleSentences).padStart(6),
    String(r.issues.noExample).padStart(5),
    String(r.issues.jargon).padStart(6),
    String(r.issues.noRomanization).padStart(6),
    String(r.issues.cryptic).padStart(7),
    String(r.heavyRepeats).padStart(9),
  ].join('  '));
}

if (argLang) {
  const r = report[argLang];
  if (!r) { console.log('No data for', argLang); process.exit(1); }
  console.log('\n\n=== DEEP DIVE: ' + argLang + ' ===');
  for (const [name, list] of Object.entries(r.samples || {})) {
    if (!list.length) continue;
    console.log('\n--- ' + name + ' (' + r.issues[name] + ' total) ---');
    for (const s of list) {
      console.log('  [' + s.id + '] ' + s.target);
      console.log('    » ' + s.tip);
    }
  }
  console.log('\n--- TOP REPEATS ---');
  for (const t of r.topRepeats) console.log('  (' + t.uses + '×) ' + t.tip);
}
