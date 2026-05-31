#!/usr/bin/env node
/**
 * Apply Hindi de-duplication:
 *   - Rewrite the 70 cards in hi-dedup-rewrites.json (3x+ clusters get diversified)
 *   - Delete the duplicates in 2x clusters (keep the lowest-priority canonical)
 *
 * Audio fields cleared on rewritten cards. Deleted cards' IDs printed for manifest cleanup.
 */
const fs = require('fs');

const DECK_PATH = 'src/data/hindi/deck.json';
const REWRITES_PATH = 'scripts/hi-dedup-rewrites.json';
const CLUSTERS_PATH = '/tmp/hi-duplicates.json';
const EDGE_MANIFEST = 'scripts/edge-tts-cards.json';

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const { rewrites } = JSON.parse(fs.readFileSync(REWRITES_PATH, 'utf8'));
const { clusters } = JSON.parse(fs.readFileSync(CLUSTERS_PATH, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(EDGE_MANIFEST, 'utf8'));

const byId = new Map(deck.map(c => [c.id, c]));

// 1) Apply rewrites
let rewritten = 0;
const rewrittenIds = [];
for (const r of rewrites) {
  const card = byId.get(r.id);
  if (!card) continue;
  card.target = r.target;
  card.english = r.english;
  if (r.tags) card.tags = r.tags;
  card.audio = '';
  card.grammar = '';
  rewritten++;
  rewrittenIds.push(r.id);
}
console.log('Rewrites applied: ' + rewritten);

// 2) For 2x clusters: delete the duplicate (the higher-priority of the two)
const toDelete = new Set();
for (const c of clusters) {
  if (c.count !== 2) continue;
  // Sort by priority asc; canonical is lowest, the other is the duplicate
  const sorted = [...c.cards].sort((a, b) => (a.priority || 999999) - (b.priority || 999999));
  const dup = sorted[1];
  toDelete.add(dup.id);
}
console.log('Cards to delete (2x duplicates): ' + toDelete.size);

const before = deck.length;
const newDeck = deck.filter(c => !toDelete.has(c.id));
console.log('Deck size: ' + before + ' → ' + newDeck.length + ' (-' + (before - newDeck.length) + ')');

fs.writeFileSync(DECK_PATH, JSON.stringify(newDeck, null, 2) + '\n');

// 3) Manifest: add rewritten IDs (need new audio); leave deleted IDs alone (their audio orphans)
const existing = new Set(manifest.hindi || []);
for (const id of rewrittenIds) existing.add(id);
manifest.hindi = [...existing].sort();
manifest._total = Object.entries(manifest)
  .filter(([k]) => !k.startsWith('_'))
  .reduce((sum, [_, v]) => sum + (Array.isArray(v) ? v.length : 0), 0);
fs.writeFileSync(EDGE_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

console.log('Updated manifest: hindi edge-TTS list now has ' + manifest.hindi.length + ' entries');
console.log();
console.log('Deleted card IDs (audio files now orphaned, not deleting from disk):');
for (const id of [...toDelete].sort()) console.log('  ' + id);
