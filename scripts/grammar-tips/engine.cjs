#!/usr/bin/env node
/**
 * Grammar-tip generation engine.
 *
 * For each language with a pattern file, walk the deck and fill in
 * the `grammar` field on cards that currently have no tip. Each pattern
 * is a hand-written rule that:
 *   (a) detects a structure in the target sentence, and
 *   (b) supplies one or more pedagogical tip variants.
 *
 * Tips are picked deterministically (round-robin across matching cards
 * by their sorted position in the deck) so the same card always gets
 * the same tip on re-runs, AND different cards matching the same
 * pattern get different variants – preventing the kind of copy-paste
 * we already cleaned up.
 *
 * Run:
 *   node scripts/grammar-tips/engine.cjs            # dry run, all langs
 *   node scripts/grammar-tips/engine.cjs --apply
 *   node scripts/grammar-tips/engine.cjs --lang=spanish --apply
 */
const fs = require('fs');
const path = require('path');

const LANG_FILES = {
  spanish:    { deck: 'src/data/spanish/deck.json',    patterns: 'patterns-es.cjs' },
  italian:    { deck: 'src/data/italian/deck.json',    patterns: 'patterns-it.cjs' },
  french:     { deck: 'src/data/french/deck.json',     patterns: 'patterns-fr.cjs' },
  portuguese: { deck: 'src/data/portuguese/deck.json', patterns: 'patterns-pt.cjs' },
  german:     { deck: 'src/data/german/deck.json',     patterns: 'patterns-de.cjs' },
  dutch:      { deck: 'src/data/dutch/deck.json',      patterns: 'patterns-nl.cjs' },
  swedish:    { deck: 'src/data/swedish/deck.json',    patterns: 'patterns-sv.cjs' },
  welsh:      { deck: 'src/data/welsh/deck.json',      patterns: 'patterns-cy.cjs' },
  hindi:      { deck: 'src/data/hindi/deck.json',      patterns: 'patterns-hi.cjs' },
  turkish:    { deck: 'src/data/turkish/deck.json',    patterns: 'patterns-tr.cjs' },
  russian:    { deck: 'src/data/russian/deck.json',    patterns: 'patterns-ru.cjs' },
};

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const langArg = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1];
const langs = langArg ? [langArg] : Object.keys(LANG_FILES);

const totals = { matched: 0, unmatched: 0, byPattern: {}, byLang: {} };

for (const lang of langs) {
  const cfg = LANG_FILES[lang];
  if (!cfg) { console.log('skip ' + lang); continue; }

  const patternPath = path.join(__dirname, cfg.patterns);
  if (!fs.existsSync(patternPath)) {
    console.log(`${lang.padEnd(11)} (no patterns file yet – skipped)`);
    continue;
  }
  // Clear require cache so we always re-read patterns
  delete require.cache[require.resolve(patternPath)];
  const patterns = require(patternPath);

  if (!fs.existsSync(cfg.deck)) {
    console.log(`${lang.padEnd(11)} (deck missing)`);
    continue;
  }
  const deck = JSON.parse(fs.readFileSync(cfg.deck, 'utf8'));

  // Only cards with no current grammar tip
  const emptyCards = deck.filter(c => !(c.grammar || '').trim());
  const langStats = { empty: emptyCards.length, filled: 0, byPattern: {} };

  // Sort empty cards by id so round-robin assignment is deterministic
  const sortedEmpty = [...emptyCards].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  // Group cards by which patterns they match
  const matchesByPattern = new Map(); // patternId → array of cards
  for (const c of sortedEmpty) {
    const matched = patterns
      .filter(p => {
        try { return !!p.match(c.target, c.english, c); }
        catch (e) { return false; }
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
    if (matched.length === 0) continue;
    const winner = matched[0]; // highest priority wins
    if (!matchesByPattern.has(winner.id)) matchesByPattern.set(winner.id, []);
    matchesByPattern.get(winner.id).push(c);
  }

  // Apply tips round-robin within each pattern's matched-card list
  let touched = 0;
  for (const [pid, cards] of matchesByPattern.entries()) {
    const pattern = patterns.find(p => p.id === pid);
    const tips = pattern.tips || [];
    if (tips.length === 0) continue;
    for (let i = 0; i < cards.length; i++) {
      const tip = tips[i % tips.length];
      cards[i].grammar = tip;
      touched++;
    }
    langStats.byPattern[pid] = cards.length;
  }
  langStats.filled = touched;

  console.log(`${lang.padEnd(11)} empty=${String(langStats.empty).padStart(4)}  filled=${String(touched).padStart(4)}  coverage=${langStats.empty ? Math.round(touched / langStats.empty * 100) : 0}%`);
  // top patterns
  const topPatterns = Object.entries(langStats.byPattern).sort((a, b) => b[1] - a[1]).slice(0, 6);
  for (const [p, n] of topPatterns) console.log(`             • ${p.padEnd(36)} ${n}`);

  totals.matched += touched;
  totals.unmatched += langStats.empty - touched;
  totals.byLang[lang] = langStats;

  if (APPLY && touched > 0) {
    // Write back – only the cards we updated. We mutated in place inside the deck.
    fs.writeFileSync(cfg.deck, JSON.stringify(deck, null, 2) + '\n');
  }
}

console.log(`\nTOTAL: filled ${totals.matched}, unmatched ${totals.unmatched}`);
if (!APPLY) console.log('(dry run – pass --apply to write changes)');
