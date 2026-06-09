#!/usr/bin/env node
/* Strict tip-card mismatch detector.
 *
 * Only flags cards where the tip names a specific lexical item in
 * backticks/quotes AND that item (or any inflected form of it) is
 * genuinely absent from the card target. This keeps false-positives
 * low at the cost of catching fewer mismatches.
 *
 * For each language we list "anchor words" – distinctive words/forms
 * that, if mentioned in a tip and missing from the card, almost
 * certainly mean the tip is attached to the wrong card.
 *
 * Run:
 *   node scripts/tip-card-mismatch-strict.cjs
 *   node scripts/tip-card-mismatch-strict.cjs --fix
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const lang1 = args.find(a => !a.startsWith('--'));

// Per-language anchor lexical items. The matcher fires when:
//   tipPattern matches the tip AND none of cardForms appears in the card.
// Each anchor: [name, tipPattern, [card-form-regexes...]]
// Only HIGH-PRECISION anchors: tips that name a specific lexical item / idiom
// where its absence on the card means the tip is genuinely mis-attached (not
// just "general grammar info that happens to apply to the node").
//
// Excluded after sampling (informational/general — keeping):
//   - spanish vosotros, acordarse  (talks about a feature; node-relevant)
//   - german möchte                (politeness contrast; node-relevant)
//   - turkish var/yok              (existential intro; node-relevant)
//   - welsh wedi general           (overlaps with time idioms)
const ANCHORS = {
  french: [
    ['dû',          /\bdû\b|→\s*dû|dû.*\bdu\b/i,                                  [/\bdû\b/]],
    ['venir-de',    /\bvenir de\b|\bviens de\b|\bvient de\b/i,                    [/\bvien[stz]?\s+de\b/i, /\bvenons\s+de\b/i, /\bvenez\s+de\b/i, /\bvenions\s+de\b/i, /\bveniez\s+de\b/i]],
    ['avoir-bol',   /\bavoir du bol\b|\ba du bol\b/i,                              [/\b(ai|as|a|avons|avez|ont)\s+du\s+bol\b/i]],
    ['avoir-chance',/\bavoir de la chance\b/i,                                    [/\b(ai|as|a|avons|avez|ont)\s+de\s+la\s+chance\b/i]],
  ],
  italian: [
    ['piacere-form', /\bpiace\b|\bpiacciono\b/i,                                  [/\b(piace|piacciono|piaceva|piaceranno|piaciuto|piaciuta|piacque)\b/i]],
    ['ho-fame-form', /\bho fame\b/i,                                              [/\b(ho|hai|ha)\s+fame\b/i]],
    ['c-e',         /\bc'è\b/i,                                                   [/\bc'è\b/i, /\bci\s+sono\b/i]],
  ],
  portuguese: [
    ['a-gente',     /\ba gente\b/i,                                               [/\ba\s+gente\b/i]],
    ['talvez',      /\btalvez\b/i,                                                [/\btalvez\b/i]],
  ],
  hindi: [
    ['ne-form',     /\bने\b/,                                                     [/\bने\b/, /\bमैंने\b/, /\bतुमने\b/, /\bआपने\b/, /\bउसने\b/, /\bउन्होंने\b/]],
    ['chahiye',     /\bचाहिए\b/,                                                  [/\bचाहिए\b/]],
  ],
  welsh: [
    ['ddim-wedi',   /\bddim wedi\b/i,                                             [/\b(ddim|ddi'm)\b/i]],
  ],
};

function loadDeck(lang) {
  const p = path.join('src/data', lang, 'deck.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const langList = lang1 ? [lang1] : Object.keys(ANCHORS);
const mismatches = {};

for (const lang of langList) {
  const anchors = ANCHORS[lang];
  if (!anchors) continue;
  const deck = loadDeck(lang);
  if (!deck) continue;
  const flagged = [];
  for (const card of deck) {
    if (!card.grammar) continue;
    for (const [name, tipPattern, cardForms] of anchors) {
      if (!tipPattern.test(card.grammar)) continue;
      const matchesAny = cardForms.some(re => re.test(card.target));
      if (!matchesAny) {
        flagged.push({ id: card.id, anchor: name, target: card.target, tip: card.grammar });
        break;
      }
    }
  }
  mismatches[lang] = flagged;
}

if (lang1) {
  const mm = mismatches[lang1] || [];
  console.log('=== ' + lang1.toUpperCase() + ' ' + mm.length + ' strict mismatches ===\n');
  for (const m of mm) {
    console.log('[' + m.id + ']  anchor: ' + m.anchor);
    console.log('  card: ' + m.target);
    console.log('  tip : ' + m.tip.slice(0, 130));
    console.log();
  }
} else {
  let total = 0;
  console.log('Strict mismatch counts:');
  for (const lang of langList) {
    const n = (mismatches[lang] || []).length;
    console.log('  ' + lang.padEnd(11) + n);
    total += n;
  }
  console.log('  TOTAL      ' + total);
}

if (fix) {
  let total = 0;
  for (const lang of langList) {
    const mm = mismatches[lang] || [];
    if (!mm.length) continue;
    const p = path.join('src/data', lang, 'deck.json');
    const deck = JSON.parse(fs.readFileSync(p, 'utf8'));
    const ids = new Set(mm.map(m => m.id));
    let stripped = 0;
    for (const card of deck) {
      if (ids.has(card.id)) { delete card.grammar; stripped++; }
    }
    fs.writeFileSync(p, JSON.stringify(deck, null, 2));
    console.log(lang + ': stripped ' + stripped + ' cards');
    total += stripped;
  }
  console.log('Total stripped: ' + total);
}
