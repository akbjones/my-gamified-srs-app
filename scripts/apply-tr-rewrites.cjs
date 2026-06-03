#!/usr/bin/env node
/**
 * Apply Turkish card rewrites from scripts/tr-rewrites.json to the Turkish deck.
 * Replaces target + english + tags. Clears audio field so it gets regenerated next pass.
 * Adds card IDs to scripts/edge-tts-cards.json under turkish (for later Google upgrade).
 */
const fs = require('fs');

const DECK_PATH = 'src/data/turkish/deck.json';
const REWRITES_PATH = 'scripts/tr-rewrites.json';
const EDGE_MANIFEST = 'scripts/edge-tts-cards.json';

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const { rewrites } = JSON.parse(fs.readFileSync(REWRITES_PATH, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(EDGE_MANIFEST, 'utf8'));

const byId = new Map(deck.map(c => [c.id, c]));
let applied = 0, missing = 0;
const newAudioIds = [];

for (const r of rewrites) {
  const card = byId.get(r.id);
  if (!card) { missing++; continue; }
  card.target = r.target;
  card.english = r.english;
  card.tags = r.tags;
  card.audio = '';  // Clear so audio gen will refill
  card.grammar = '';  // Clear potentially-stale grammar tip
  newAudioIds.push(r.id);
  applied++;
}

console.log('Rewrites applied: ' + applied);
console.log('Rewrites missing (id not in deck): ' + missing);

// Write back
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log('Wrote ' + DECK_PATH);

// Update manifest – append new IDs to turkish list (dedupe)
const existing = new Set(manifest.turkish || []);
for (const id of newAudioIds) existing.add(id);
manifest.turkish = [...existing].sort();
manifest._total = Object.entries(manifest)
  .filter(([k]) => !k.startsWith('_'))
  .reduce((sum, [_, v]) => sum + (Array.isArray(v) ? v.length : 0), 0);
manifest._meta = manifest._meta + ' Updated 2026-05-04 with Turkish rewrites pending Google TTS upgrade.';
fs.writeFileSync(EDGE_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log('Updated ' + EDGE_MANIFEST + ' (Turkish edge-TTS list: ' + manifest.turkish.length + ' cards)');
